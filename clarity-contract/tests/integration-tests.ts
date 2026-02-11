import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;

describe("xWallet Integration Tests", () => {

  describe("Multi-user wallet operations", () => {
    it("should handle complex multi-user deposit and transfer scenario", () => {
      // Multiple users deposit funds
      simnet.callPublicFn("xwallet", "deposit", [Cl.uint(1000)], wallet1);
      simnet.callPublicFn("xwallet", "deposit", [Cl.uint(2000)], wallet2);
      simnet.callPublicFn("xwallet", "deposit", [Cl.uint(1500)], wallet3);

      // Users perform various transfers
      simnet.callPublicFn("xwallet", "send-stx", [Cl.uint(300), Cl.principal(wallet2)], wallet1);
      simnet.callPublicFn("xwallet", "send-stx", [Cl.uint(500), Cl.principal(wallet3)], wallet2);
      simnet.callPublicFn("xwallet", "send-stx", [Cl.uint(200), Cl.principal(wallet1)], wallet3);

      // Some withdrawals
      simnet.callPublicFn("xwallet", "withdraw", [Cl.uint(400)], wallet1);
      simnet.callPublicFn("xwallet", "withdraw", [Cl.uint(600)], wallet2);

      // Verify final balances
      const balance1 = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet1)], wallet1);
      const balance2 = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet2)], wallet2);
      const balance3 = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet3)], wallet3);

      expect(balance1.result).toBeOk(Cl.uint(500)); // 1000 - 300 + 200 - 400
      expect(balance2.result).toBeOk(Cl.uint(1200)); // 2000 + 300 - 500 - 600
      expect(balance3.result).toBeOk(Cl.uint(1800)); // 1500 + 500 - 200
    });

    it("should handle circular transfers between users", () => {
      // Initial deposits
      simnet.callPublicFn("xwallet", "deposit", [Cl.uint(1000)], wallet1);
      simnet.callPublicFn("xwallet", "deposit", [Cl.uint(1000)], wallet2);
      simnet.callPublicFn("xwallet", "deposit", [Cl.uint(1000)], wallet3);

      // Circular transfers: wallet1 -> wallet2 -> wallet3 -> wallet1
      simnet.callPublicFn("xwallet", "send-stx", [Cl.uint(200), Cl.principal(wallet2)], wallet1);
      simnet.callPublicFn("xwallet", "send-stx", [Cl.uint(300), Cl.principal(wallet3)], wallet2);
      simnet.callPublicFn("xwallet", "send-stx", [Cl.uint(150), Cl.principal(wallet1)], wallet3);

      // Verify balances
      const balance1 = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet1)], wallet1);
      const balance2 = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet2)], wallet2);
      const balance3 = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet3)], wallet3);

      expect(balance1.result).toBeOk(Cl.uint(950));  // 1000 - 200 + 150
      expect(balance2.result).toBeOk(Cl.uint(900));  // 1000 + 200 - 300
      expect(balance3.result).toBeOk(Cl.uint(1150)); // 1000 + 300 - 150
    });
  });

  describe("Deposit-Send-Withdraw flow", () => {
    it("should handle complete deposit-send-withdraw cycle", () => {
      // Deposit
      simnet.callPublicFn("xwallet", "deposit", [Cl.uint(1000)], wallet1);

      // Send to another user
      simnet.callPublicFn("xwallet", "send-stx", [Cl.uint(400), Cl.principal(wallet2)], wallet1);

      // Withdraw remaining balance
      simnet.callPublicFn("xwallet", "withdraw", [Cl.uint(600)], wallet1);

      // Verify all balances are correct
      const balance1 = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet1)], wallet1);
      const balance2 = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet2)], wallet2);

      expect(balance1.result).toBeOk(Cl.uint(0));
      expect(balance2.result).toBeOk(Cl.uint(400));
    });

    it("should handle partial withdrawals after multiple operations", () => {
      // Complex flow
      simnet.callPublicFn("xwallet", "deposit", [Cl.uint(2000)], wallet1);
      simnet.callPublicFn("xwallet", "send-stx", [Cl.uint(500), Cl.principal(wallet2)], wallet1);
      simnet.callPublicFn("xwallet", "send-stx", [Cl.uint(300), Cl.principal(wallet3)], wallet1);
      simnet.callPublicFn("xwallet", "withdraw", [Cl.uint(400)], wallet1);
      simnet.callPublicFn("xwallet", "deposit", [Cl.uint(100)], wallet1);
      simnet.callPublicFn("xwallet", "withdraw", [Cl.uint(200)], wallet1);

      const balance1 = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet1)], wallet1);
      const balance2 = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet2)], wallet2);
      const balance3 = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet3)], wallet3);

      expect(balance1.result).toBeOk(Cl.uint(700)); // 2000 - 500 - 300 - 400 + 100 - 200
      expect(balance2.result).toBeOk(Cl.uint(500));
      expect(balance3.result).toBeOk(Cl.uint(300));
    });
  });

  describe("Error recovery and edge cases", () => {
    it("should maintain correct state after failed operations", () => {
      // Deposit initial amount
      simnet.callPublicFn("xwallet", "deposit", [Cl.uint(1000)], wallet1);

      // Attempt invalid operations (should fail)
      simnet.callPublicFn("xwallet", "send-stx", [Cl.uint(0), Cl.principal(wallet2)], wallet1); // zero amount
      simnet.callPublicFn("xwallet", "send-stx", [Cl.uint(1500), Cl.principal(wallet2)], wallet1); // insufficient balance
      simnet.callPublicFn("xwallet", "send-stx", [Cl.uint(100), Cl.principal(wallet1)], wallet1); // self-send
      simnet.callPublicFn("xwallet", "withdraw", [Cl.uint(0)], wallet1); // zero withdrawal
      simnet.callPublicFn("xwallet", "withdraw", [Cl.uint(2000)], wallet1); // insufficient balance

      // Balance should remain unchanged
      const balance = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet1)], wallet1);
      expect(balance.result).toBeOk(Cl.uint(1000));

      // Valid operation should still work
      simnet.callPublicFn("xwallet", "send-stx", [Cl.uint(300), Cl.principal(wallet2)], wallet1);
      const balanceAfter = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet1)], wallet1);
      expect(balanceAfter.result).toBeOk(Cl.uint(700));
    });

    it("should handle operations on zero balance accounts", () => {
      // Attempt operations on wallet2 with zero balance
      simnet.callPublicFn("xwallet", "send-stx", [Cl.uint(100), Cl.principal(wallet3)], wallet2); // should fail
      simnet.callPublicFn("xwallet", "withdraw", [Cl.uint(100)], wallet2); // should fail

      // Balances should remain zero
      const balance2 = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet2)], wallet2);
      const balance3 = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet3)], wallet3);

      expect(balance2.result).toBeOk(Cl.uint(0));
      expect(balance3.result).toBeOk(Cl.uint(0));

      // Deposit should work
      simnet.callPublicFn("xwallet", "deposit", [Cl.uint(500)], wallet2);
      const balance2After = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet2)], wallet2);
      expect(balance2After.result).toBeOk(Cl.uint(500));
    });
  });

  describe("Concurrent-like operations simulation", () => {
    it("should handle rapid sequential operations", () => {
      // Simulate rapid operations
      for (let i = 1; i <= 10; i++) {
        simnet.callPublicFn("xwallet", "deposit", [Cl.uint(100)], wallet1);
        simnet.callPublicFn("xwallet", "send-stx", [Cl.uint(50), Cl.principal(wallet2)], wallet1);
      }

      const balance1 = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet1)], wallet1);
      const balance2 = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet2)], wallet2);

      expect(balance1.result).toBeOk(Cl.uint(500)); // 10 * (100 - 50)
      expect(balance2.result).toBeOk(Cl.uint(500)); // 10 * 50
    });

    it("should handle alternating deposits and withdrawals", () => {
      let expectedBalance = 0;

      for (let i = 1; i <= 5; i++) {
        simnet.callPublicFn("xwallet", "deposit", [Cl.uint(200)], wallet1);
        expectedBalance += 200;

        if (expectedBalance >= 100) {
          simnet.callPublicFn("xwallet", "withdraw", [Cl.uint(100)], wallet1);
          expectedBalance -= 100;
        }
      }

      const balance = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet1)], wallet1);
      expect(balance.result).toBeOk(Cl.uint(expectedBalance));
    });
  });

  describe("Large scale operations", () => {
    it("should handle large amounts correctly", () => {
      const largeAmount = 1000000000; // 1 billion microSTX

      simnet.callPublicFn("xwallet", "deposit", [Cl.uint(largeAmount)], wallet1);
      simnet.callPublicFn("xwallet", "send-stx", [Cl.uint(largeAmount / 2), Cl.principal(wallet2)], wallet1);
      simnet.callPublicFn("xwallet", "withdraw", [Cl.uint(largeAmount / 4)], wallet2);

      const balance1 = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet1)], wallet1);
      const balance2 = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet2)], wallet2);

      expect(balance1.result).toBeOk(Cl.uint(largeAmount / 2));
      expect(balance2.result).toBeOk(Cl.uint(largeAmount / 4));
    });

    it("should handle many small operations", () => {
      let totalDeposited = 0;
      let totalTransferred = 0;

      for (let i = 1; i <= 100; i++) {
        simnet.callPublicFn("xwallet", "deposit", [Cl.uint(10)], wallet1);
        totalDeposited += 10;

        simnet.callPublicFn("xwallet", "send-stx", [Cl.uint(5), Cl.principal(wallet2)], wallet1);
        totalTransferred += 5;
      }

      const balance1 = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet1)], wallet1);
      const balance2 = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet2)], wallet2);

      expect(balance1.result).toBeOk(Cl.uint(totalDeposited - totalTransferred));
      expect(balance2.result).toBeOk(Cl.uint(totalTransferred));
    });
  });
});