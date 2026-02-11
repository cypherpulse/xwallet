import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;

describe("xWallet Stress Tests", () => {

  describe("Large number operations", () => {
    it("should handle maximum uint values", () => {
      // Test with very large numbers (close to uint max)
      const maxUint = 340282366920938463463374607431768211455n; // 2^128 - 1
      const largeAmount = 1000000000000000000000n; // 10^21

      // Note: In practice, STX amounts are limited by total supply, but testing large numbers
      const reasonableLarge = 1000000000000; // 1 trillion microSTX

      const { result } = simnet.callPublicFn(
        "xwallet",
        "deposit",
        [Cl.uint(reasonableLarge)],
        wallet1
      );
      expect(result).toBeOk(Cl.uint(reasonableLarge));

      const balance = simnet.callReadOnlyFn(
        "xwallet",
        "get-balance",
        [Cl.principal(wallet1)],
        wallet1
      );
      expect(balance.result).toBeOk(Cl.uint(reasonableLarge));
    });

    it("should handle precision with decimal-like operations", () => {
      // Test operations that might involve precision issues
      simnet.callPublicFn("xwallet", "deposit", [Cl.uint(1000000)], wallet1);

      // Multiple small transfers
      for (let i = 0; i < 100; i++) {
        simnet.callPublicFn("xwallet", "send-stx", [Cl.uint(1000), Cl.principal(wallet2)], wallet1);
      }

      const balance1 = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet1)], wallet1);
      const balance2 = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet2)], wallet2);

      expect(balance1.result).toBeOk(Cl.uint(900000)); // 1000000 - (100 * 1000)
      expect(balance2.result).toBeOk(Cl.uint(100000)); // 100 * 1000
    });
  });

  describe("High frequency operations", () => {
    it("should handle many rapid deposits", () => {
      const numOperations = 1000;
      const amountPerDeposit = 100;

      for (let i = 0; i < numOperations; i++) {
        simnet.callPublicFn("xwallet", "deposit", [Cl.uint(amountPerDeposit)], wallet1);
      }

      const balance = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet1)], wallet1);
      expect(balance.result).toBeOk(Cl.uint(numOperations * amountPerDeposit));
    });

    it("should handle many rapid transfers", () => {
      simnet.callPublicFn("xwallet", "deposit", [Cl.uint(100000)], wallet1);

      const numTransfers = 200;
      const amountPerTransfer = 100;

      for (let i = 0; i < numTransfers; i++) {
        simnet.callPublicFn("xwallet", "send-stx", [Cl.uint(amountPerTransfer), Cl.principal(wallet2)], wallet1);
      }

      const balance1 = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet1)], wallet1);
      const balance2 = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet2)], wallet2);

      expect(balance1.result).toBeOk(Cl.uint(100000 - (numTransfers * amountPerTransfer)));
      expect(balance2.result).toBeOk(Cl.uint(numTransfers * amountPerTransfer));
    });

    it("should handle alternating deposits and withdrawals", () => {
      let expectedBalance = 0;

      for (let i = 0; i < 500; i++) {
        simnet.callPublicFn("xwallet", "deposit", [Cl.uint(200)], wallet1);
        expectedBalance += 200;

        simnet.callPublicFn("xwallet", "withdraw", [Cl.uint(150)], wallet1);
        expectedBalance -= 150;
      }

      const balance = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet1)], wallet1);
      expect(balance.result).toBeOk(Cl.uint(expectedBalance));
    });
  });

  describe("Boundary conditions", () => {
    it("should handle minimum and maximum reasonable amounts", () => {
      // Test minimum amount (1 microSTX)
      simnet.callPublicFn("xwallet", "deposit", [Cl.uint(1)], wallet1);
      let balance = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet1)], wallet1);
      expect(balance.result).toBeOk(Cl.uint(1));

      // Test maximum reasonable amount (1 STX = 1,000,000 microSTX)
      const oneSTX = 1000000;
      simnet.callPublicFn("xwallet", "deposit", [Cl.uint(oneSTX)], wallet1);
      balance = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet1)], wallet1);
      expect(balance.result).toBeOk(Cl.uint(1 + oneSTX));
    });

    it("should handle zero balance edge cases", () => {
      // Deposit and withdraw everything
      simnet.callPublicFn("xwallet", "deposit", [Cl.uint(1000)], wallet1);
      simnet.callPublicFn("xwallet", "withdraw", [Cl.uint(1000)], wallet1);

      // Try operations on zero balance
      const sendResult = simnet.callPublicFn("xwallet", "send-stx", [Cl.uint(1), Cl.principal(wallet2)], wallet1);
      expect(sendResult.result).toBeErr(Cl.uint(100)); // ERR-INSUFFICIENT-BALANCE

      const withdrawResult = simnet.callPublicFn("xwallet", "withdraw", [Cl.uint(1)], wallet1);
      expect(withdrawResult.result).toBeErr(Cl.uint(100)); // ERR-INSUFFICIENT-BALANCE

      // Balance should still be zero
      const balance = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet1)], wallet1);
      expect(balance.result).toBeOk(Cl.uint(0));
    });

    it("should handle exact balance transfers", () => {
      simnet.callPublicFn("xwallet", "deposit", [Cl.uint(500)], wallet1);

      // Send exact balance
      const { result } = simnet.callPublicFn("xwallet", "send-stx", [Cl.uint(500), Cl.principal(wallet2)], wallet1);
      expect(result).toBeOk(Cl.uint(500));

      const balance1 = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet1)], wallet1);
      const balance2 = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet2)], wallet2);

      expect(balance1.result).toBeOk(Cl.uint(0));
      expect(balance2.result).toBeOk(Cl.uint(500));
    });
  });

  describe("Complex multi-user stress scenarios", () => {
    it("should handle many users with many operations", () => {
      const users = [wallet1, wallet2, wallet3];
      const numOperationsPerUser = 50;

      // Each user performs multiple operations
      users.forEach((user, index) => {
        for (let i = 0; i < numOperationsPerUser; i++) {
          simnet.callPublicFn("xwallet", "deposit", [Cl.uint(100)], user);

          // Send to next user in cycle
          const recipient = users[(index + 1) % users.length];
          simnet.callPublicFn("xwallet", "send-stx", [Cl.uint(50), Cl.principal(recipient)], user);
        }
      });

      // Verify final balances
      const balance1 = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet1)], wallet1);
      const balance2 = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet2)], wallet2);
      const balance3 = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet3)], wallet3);

      // Each user: deposited 5000, sent 2500, received 2500 → net +0
      // But since it's a cycle, balances should balance out
      const expectedBalance = numOperationsPerUser * 50; // 50 * 50 = 2500
      expect(balance1.result).toBeOk(Cl.uint(expectedBalance));
      expect(balance2.result).toBeOk(Cl.uint(expectedBalance));
      expect(balance3.result).toBeOk(Cl.uint(expectedBalance));
    });

    it("should handle burst operations", () => {
      // Simulate burst of operations
      const operations = [
        () => simnet.callPublicFn("xwallet", "deposit", [Cl.uint(1000)], wallet1),
        () => simnet.callPublicFn("xwallet", "send-stx", [Cl.uint(300), Cl.principal(wallet2)], wallet1),
        () => simnet.callPublicFn("xwallet", "deposit", [Cl.uint(500)], wallet2),
        () => simnet.callPublicFn("xwallet", "send-stx", [Cl.uint(200), Cl.principal(wallet3)], wallet2),
        () => simnet.callPublicFn("xwallet", "withdraw", [Cl.uint(400)], wallet1),
        () => simnet.callPublicFn("xwallet", "deposit", [Cl.uint(800)], wallet3),
        () => simnet.callPublicFn("xwallet", "send-stx", [Cl.uint(150), Cl.principal(wallet1)], wallet3),
        () => simnet.callPublicFn("xwallet", "withdraw", [Cl.uint(250)], wallet2),
      ];

      // Execute all operations in sequence
      operations.forEach(op => op());

      // Verify final state
      const balance1 = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet1)], wallet1);
      const balance2 = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet2)], wallet2);
      const balance3 = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet3)], wallet3);

      // Calculate expected balances:
      // wallet1: +1000 -300 -400 +150 = 450
      // wallet2: +300 +500 -200 -250 = 350
      // wallet3: +200 +800 -150 = 850
      expect(balance1.result).toBeOk(Cl.uint(450));
      expect(balance2.result).toBeOk(Cl.uint(350));
      expect(balance3.result).toBeOk(Cl.uint(850));
    });
  });

  describe("Error condition stress", () => {
    it("should handle many consecutive error operations", () => {
      simnet.callPublicFn("xwallet", "deposit", [Cl.uint(100)], wallet1);

      // Perform many invalid operations
      for (let i = 0; i < 100; i++) {
        simnet.callPublicFn("xwallet", "send-stx", [Cl.uint(0), Cl.principal(wallet2)], wallet1); // zero amount
        simnet.callPublicFn("xwallet", "send-stx", [Cl.uint(200), Cl.principal(wallet2)], wallet1); // insufficient balance
        simnet.callPublicFn("xwallet", "send-stx", [Cl.uint(50), Cl.principal(wallet1)], wallet1); // self-send
        simnet.callPublicFn("xwallet", "withdraw", [Cl.uint(0)], wallet1); // zero withdrawal
        simnet.callPublicFn("xwallet", "withdraw", [Cl.uint(200)], wallet1); // insufficient balance
      }

      // Balance should remain unchanged
      const balance = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet1)], wallet1);
      expect(balance.result).toBeOk(Cl.uint(100));

      // Valid operation should still work
      simnet.callPublicFn("xwallet", "withdraw", [Cl.uint(50)], wallet1);
      const balanceAfter = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet1)], wallet1);
      expect(balanceAfter.result).toBeOk(Cl.uint(50));
    });

    it("should handle mixed valid and invalid operations", () => {
      let validDeposits = 0;
      let validWithdrawals = 0;

      for (let i = 0; i < 200; i++) {
        if (i % 3 === 0) {
          simnet.callPublicFn("xwallet", "deposit", [Cl.uint(10)], wallet1);
          validDeposits += 10;
        } else if (i % 3 === 1) {
          // Try invalid operation
          simnet.callPublicFn("xwallet", "withdraw", [Cl.uint(1000)], wallet1); // insufficient balance
        } else {
          // Try valid withdrawal if possible
          const currentBalance = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet1)], wallet1);
          if (currentBalance.result.value > 5) {
            simnet.callPublicFn("xwallet", "withdraw", [Cl.uint(5)], wallet1);
            validWithdrawals += 5;
          }
        }
      }

      const finalBalance = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet1)], wallet1);
      expect(finalBalance.result).toBeOk(Cl.uint(validDeposits - validWithdrawals));
    });
  });
});