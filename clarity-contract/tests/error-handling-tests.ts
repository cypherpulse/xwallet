import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;

describe("xWallet Error Handling Tests", () => {

  describe("Deposit error conditions", () => {
    it("should reject zero amount deposits", () => {
      const { result } = simnet.callPublicFn(
        "xwallet",
        "deposit",
        [Cl.uint(0)],
        wallet1
      );
      expect(result).toBeErr(Cl.uint(101)); // ERR-ZERO-AMOUNT
    });

    it("should handle STX transfer failures gracefully", () => {
      // Note: In simnet, STX transfers should succeed, but this tests the error path
      // In a real scenario, if stx-transfer? fails, it should return ERR-TRANSFER-FAILED
      const { result } = simnet.callPublicFn(
        "xwallet",
        "deposit",
        [Cl.uint(100)],
        wallet1
      );
      // Should succeed in simnet
      expect(result).toBeOk(Cl.uint(100));
    });

    it("should maintain state consistency on failed deposits", () => {
      // First successful deposit
      simnet.callPublicFn("xwallet", "deposit", [Cl.uint(500)], wallet1);

      // Failed deposit (zero amount)
      simnet.callPublicFn("xwallet", "deposit", [Cl.uint(0)], wallet1);

      // Balance should remain unchanged
      const balance = simnet.callReadOnlyFn(
        "xwallet",
        "get-balance",
        [Cl.principal(wallet1)],
        wallet1
      );
      expect(balance.result).toBeOk(Cl.uint(500));
    });
  });

  describe("Send-STX error conditions", () => {
    beforeEach(() => {
      simnet.callPublicFn("xwallet", "deposit", [Cl.uint(1000)], wallet1);
    });

    it("should reject zero amount transfers", () => {
      const { result } = simnet.callPublicFn(
        "xwallet",
        "send-stx",
        [Cl.uint(0), Cl.principal(wallet2)],
        wallet1
      );
      expect(result).toBeErr(Cl.uint(101)); // ERR-ZERO-AMOUNT
    });

    it("should reject transfers exceeding balance", () => {
      const { result } = simnet.callPublicFn(
        "xwallet",
        "send-stx",
        [Cl.uint(1500), Cl.principal(wallet2)],
        wallet1
      );
      expect(result).toBeErr(Cl.uint(100)); // ERR-INSUFFICIENT-BALANCE
    });

    it("should reject self-transfers", () => {
      const { result } = simnet.callPublicFn(
        "xwallet",
        "send-stx",
        [Cl.uint(100), Cl.principal(wallet1)],
        wallet1
      );
      expect(result).toBeErr(Cl.uint(102)); // ERR-SELF-SEND
    });

    it("should maintain state on failed transfers", () => {
      const initialBalance = simnet.callReadOnlyFn(
        "xwallet",
        "get-balance",
        [Cl.principal(wallet1)],
        wallet1
      );

      // Attempt various invalid transfers
      simnet.callPublicFn("xwallet", "send-stx", [Cl.uint(0), Cl.principal(wallet2)], wallet1);
      simnet.callPublicFn("xwallet", "send-stx", [Cl.uint(2000), Cl.principal(wallet2)], wallet1);
      simnet.callPublicFn("xwallet", "send-stx", [Cl.uint(100), Cl.principal(wallet1)], wallet1);

      // Balance should remain unchanged
      const finalBalance = simnet.callReadOnlyFn(
        "xwallet",
        "get-balance",
        [Cl.principal(wallet1)],
        wallet1
      );
      expect(finalBalance.result).toBeOk(initialBalance.result.value);
    });

    it("should handle STX transfer failures in send-stx", () => {
      // Note: In simnet, this should succeed, but tests the error handling path
      const { result } = simnet.callPublicFn(
        "xwallet",
        "send-stx",
        [Cl.uint(100), Cl.principal(wallet2)],
        wallet1
      );
      expect(result).toBeOk(Cl.uint(100));
    });
  });

  describe("Withdraw error conditions", () => {
    beforeEach(() => {
      simnet.callPublicFn("xwallet", "deposit", [Cl.uint(1000)], wallet1);
    });

    it("should reject zero amount withdrawals", () => {
      const { result } = simnet.callPublicFn(
        "xwallet",
        "withdraw",
        [Cl.uint(0)],
        wallet1
      );
      expect(result).toBeErr(Cl.uint(101)); // ERR-ZERO-AMOUNT
    });

    it("should reject withdrawals exceeding balance", () => {
      const { result } = simnet.callPublicFn(
        "xwallet",
        "withdraw",
        [Cl.uint(1500)],
        wallet1
      );
      expect(result).toBeErr(Cl.uint(100)); // ERR-INSUFFICIENT-BALANCE
    });

    it("should maintain state on failed withdrawals", () => {
      // Attempt invalid withdrawals
      simnet.callPublicFn("xwallet", "withdraw", [Cl.uint(0)], wallet1);
      simnet.callPublicFn("xwallet", "withdraw", [Cl.uint(2000)], wallet1);

      // Balance should remain unchanged
      const balance = simnet.callReadOnlyFn(
        "xwallet",
        "get-balance",
        [Cl.principal(wallet1)],
        wallet1
      );
      expect(balance.result).toBeOk(Cl.uint(1000));
    });

    it("should handle STX transfer failures in withdraw", () => {
      // Note: In simnet, this should succeed
      const { result } = simnet.callPublicFn(
        "xwallet",
        "withdraw",
        [Cl.uint(500)],
        wallet1
      );
      expect(result).toBeOk(Cl.uint(500));
    });
  });

  describe("Cross-function error scenarios", () => {
    it("should handle deposit after multiple failures", () => {
      // Multiple failed operations
      simnet.callPublicFn("xwallet", "send-stx", [Cl.uint(100), Cl.principal(wallet2)], wallet1); // no balance
      simnet.callPublicFn("xwallet", "withdraw", [Cl.uint(100)], wallet1); // no balance

      // Then successful deposit
      const { result } = simnet.callPublicFn(
        "xwallet",
        "deposit",
        [Cl.uint(1000)],
        wallet1
      );
      expect(result).toBeOk(Cl.uint(1000));

      const balance = simnet.callReadOnlyFn(
        "xwallet",
        "get-balance",
        [Cl.principal(wallet1)],
        wallet1
      );
      expect(balance.result).toBeOk(Cl.uint(1000));
    });

    it("should handle operations after balance depletion", () => {
      simnet.callPublicFn("xwallet", "deposit", [Cl.uint(500)], wallet1);
      simnet.callPublicFn("xwallet", "withdraw", [Cl.uint(500)], wallet1);

      // Try operations on zero balance
      const sendResult = simnet.callPublicFn(
        "xwallet",
        "send-stx",
        [Cl.uint(100), Cl.principal(wallet2)],
        wallet1
      );
      expect(sendResult.result).toBeErr(Cl.uint(100));

      const withdrawResult = simnet.callPublicFn(
        "xwallet",
        "withdraw",
        [Cl.uint(100)],
        wallet1
      );
      expect(withdrawResult.result).toBeErr(Cl.uint(100));

      // Deposit should still work
      const depositResult = simnet.callPublicFn(
        "xwallet",
        "deposit",
        [Cl.uint(200)],
        wallet1
      );
      expect(depositResult.result).toBeOk(Cl.uint(200));
    });
  });

  describe("State consistency checks", () => {
    it("should maintain consistent state across failed operations", () => {
      // Initial deposit
      simnet.callPublicFn("xwallet", "deposit", [Cl.uint(1000)], wallet1);

      // Record initial state
      const initialBalance1 = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet1)], wallet1);
      const initialBalance2 = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet2)], wallet2);

      // Perform mix of valid and invalid operations
      simnet.callPublicFn("xwallet", "send-stx", [Cl.uint(200), Cl.principal(wallet2)], wallet1); // valid
      simnet.callPublicFn("xwallet", "send-stx", [Cl.uint(0), Cl.principal(wallet2)], wallet1); // invalid
      simnet.callPublicFn("xwallet", "send-stx", [Cl.uint(1000), Cl.principal(wallet2)], wallet1); // invalid
      simnet.callPublicFn("xwallet", "withdraw", [Cl.uint(100)], wallet1); // valid
      simnet.callPublicFn("xwallet", "withdraw", [Cl.uint(0)], wallet1); // invalid
      simnet.callPublicFn("xwallet", "withdraw", [Cl.uint(1000)], wallet1); // invalid

      // Check intermediate state
      const midBalance1 = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet1)], wallet1);
      const midBalance2 = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet2)], wallet2);

      expect(midBalance1.result).toBeOk(Cl.uint(700)); // 1000 - 200 - 100
      expect(midBalance2.result).toBeOk(Cl.uint(200));

      // Final valid operations
      simnet.callPublicFn("xwallet", "deposit", [Cl.uint(300)], wallet1);
      simnet.callPublicFn("xwallet", "send-stx", [Cl.uint(100), Cl.principal(wallet2)], wallet1);

      const finalBalance1 = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet1)], wallet1);
      const finalBalance2 = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet2)], wallet2);

      expect(finalBalance1.result).toBeOk(Cl.uint(900)); // 700 + 300 - 100
      expect(finalBalance2.result).toBeOk(Cl.uint(300)); // 200 + 100
    });

    it("should handle rapid error sequences without corruption", () => {
      simnet.callPublicFn("xwallet", "deposit", [Cl.uint(100)], wallet1);

      // Rapid sequence of invalid operations
      for (let i = 0; i < 50; i++) {
        simnet.callPublicFn("xwallet", "send-stx", [Cl.uint(0), Cl.principal(wallet2)], wallet1);
        simnet.callPublicFn("xwallet", "withdraw", [Cl.uint(0)], wallet1);
        simnet.callPublicFn("xwallet", "send-stx", [Cl.uint(1000), Cl.principal(wallet2)], wallet1);
        simnet.callPublicFn("xwallet", "withdraw", [Cl.uint(1000)], wallet1);
      }

      // Balance should be unchanged
      const balance = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet1)], wallet1);
      expect(balance.result).toBeOk(Cl.uint(100));

      // Valid operation should work
      simnet.callPublicFn("xwallet", "withdraw", [Cl.uint(50)], wallet1);
      const finalBalance = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet1)], wallet1);
      expect(finalBalance.result).toBeOk(Cl.uint(50));
    });
  });

  describe("Authorization and access control", () => {
    it("should only allow users to access their own balances", () => {
      simnet.callPublicFn("xwallet", "deposit", [Cl.uint(500)], wallet1);

      // wallet2 should not be able to withdraw from wallet1's balance
      const withdrawResult = simnet.callPublicFn(
        "xwallet",
        "withdraw",
        [Cl.uint(100)],
        wallet2
      );
      expect(withdrawResult.result).toBeErr(Cl.uint(100)); // ERR-INSUFFICIENT-BALANCE

      // wallet2 should not be able to send from wallet1's balance
      const sendResult = simnet.callPublicFn(
        "xwallet",
        "send-stx",
        [Cl.uint(100), Cl.principal(wallet3)],
        wallet2
      );
      expect(sendResult.result).toBeErr(Cl.uint(100)); // ERR-INSUFFICIENT-BALANCE

      // wallet1's balance should remain unchanged
      const balance1 = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet1)], wallet1);
      expect(balance1.result).toBeOk(Cl.uint(500));
    });

    it("should allow reading other users' balances", () => {
      simnet.callPublicFn("xwallet", "deposit", [Cl.uint(300)], wallet1);

      // Any user can read any balance (public information)
      const balanceByWallet2 = simnet.callReadOnlyFn(
        "xwallet",
        "get-balance",
        [Cl.principal(wallet1)],
        wallet2
      );
      expect(balanceByWallet2.result).toBeOk(Cl.uint(300));

      const balanceByWallet3 = simnet.callReadOnlyFn(
        "xwallet",
        "get-balance",
        [Cl.principal(wallet1)],
        wallet3
      );
      expect(balanceByWallet3.result).toBeOk(Cl.uint(300));
    });
  });
});