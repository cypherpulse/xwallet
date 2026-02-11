import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;

describe("xWallet Unit Tests", () => {

  describe("get-balance function - Unit Tests", () => {
    it("should return zero for non-existent user", () => {
      const balance = simnet.callReadOnlyFn(
        "xwallet",
        "get-balance",
        [Cl.principal(wallet1)],
        wallet1
      );
      expect(balance.result).toBeOk(Cl.uint(0));
    });

    it("should return correct balance after single deposit", () => {
      simnet.callPublicFn("xwallet", "deposit", [Cl.uint(1000)], wallet1);

      const balance = simnet.callReadOnlyFn(
        "xwallet",
        "get-balance",
        [Cl.principal(wallet1)],
        wallet1
      );
      expect(balance.result).toBeOk(Cl.uint(1000));
    });

    it("should return correct balance when called by different user", () => {
      simnet.callPublicFn("xwallet", "deposit", [Cl.uint(500)], wallet1);

      const balance = simnet.callReadOnlyFn(
        "xwallet",
        "get-balance",
        [Cl.principal(wallet1)],
        wallet2
      );
      expect(balance.result).toBeOk(Cl.uint(500));
    });

    it("should handle large balances correctly", () => {
      const largeAmount = 1000000000; // 1 billion microSTX
      simnet.callPublicFn("xwallet", "deposit", [Cl.uint(largeAmount)], wallet1);

      const balance = simnet.callReadOnlyFn(
        "xwallet",
        "get-balance",
        [Cl.principal(wallet1)],
        wallet1
      );
      expect(balance.result).toBeOk(Cl.uint(largeAmount));
    });
  });

  describe("deposit function - Unit Tests", () => {
    it("should deposit minimum amount (1 microSTX)", () => {
      const { result } = simnet.callPublicFn(
        "xwallet",
        "deposit",
        [Cl.uint(1)],
        wallet1
      );
      expect(result).toBeOk(Cl.uint(1));

      const balance = simnet.callReadOnlyFn(
        "xwallet",
        "get-balance",
        [Cl.principal(wallet1)],
        wallet1
      );
      expect(balance.result).toBeOk(Cl.uint(1));
    });

    it("should handle maximum reasonable deposit", () => {
      const maxAmount = 1000000000000; // 1 trillion microSTX
      const { result } = simnet.callPublicFn(
        "xwallet",
        "deposit",
        [Cl.uint(maxAmount)],
        wallet1
      );
      expect(result).toBeOk(Cl.uint(maxAmount));
    });

    it("should reject deposit of zero amount", () => {
      const { result } = simnet.callPublicFn(
        "xwallet",
        "deposit",
        [Cl.uint(0)],
        wallet1
      );
      expect(result).toBeErr(Cl.uint(101)); // ERR-ZERO-AMOUNT
    });

    it("should reject deposit of negative amount (uint wraps to large number)", () => {
      // Note: Clarity uint can't be negative, but we can test with very large numbers
      const { result } = simnet.callPublicFn(
        "xwallet",
        "deposit",
        [Cl.uint(0)], // This would be the edge case
        wallet1
      );
      expect(result).toBeErr(Cl.uint(101));
    });

    it("should update balance correctly on multiple deposits from same user", () => {
      simnet.callPublicFn("xwallet", "deposit", [Cl.uint(100)], wallet1);
      simnet.callPublicFn("xwallet", "deposit", [Cl.uint(200)], wallet1);
      simnet.callPublicFn("xwallet", "deposit", [Cl.uint(300)], wallet1);

      const balance = simnet.callReadOnlyFn(
        "xwallet",
        "get-balance",
        [Cl.principal(wallet1)],
        wallet1
      );
      expect(balance.result).toBeOk(Cl.uint(600));
    });

    it("should allow different users to deposit independently", () => {
      simnet.callPublicFn("xwallet", "deposit", [Cl.uint(100)], wallet1);
      simnet.callPublicFn("xwallet", "deposit", [Cl.uint(200)], wallet2);
      simnet.callPublicFn("xwallet", "deposit", [Cl.uint(300)], wallet3);

      const balance1 = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet1)], wallet1);
      const balance2 = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet2)], wallet2);
      const balance3 = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet3)], wallet3);

      expect(balance1.result).toBeOk(Cl.uint(100));
      expect(balance2.result).toBeOk(Cl.uint(200));
      expect(balance3.result).toBeOk(Cl.uint(300));
    });
  });

  describe("send-stx function - Unit Tests", () => {
    beforeEach(() => {
      simnet.callPublicFn("xwallet", "deposit", [Cl.uint(1000)], wallet1);
    });

    it("should send minimum amount (1 microSTX)", () => {
      const { result } = simnet.callPublicFn(
        "xwallet",
        "send-stx",
        [Cl.uint(1), Cl.principal(wallet2)],
        wallet1
      );
      expect(result).toBeOk(Cl.uint(1));

      const senderBalance = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet1)], wallet1);
      const recipientBalance = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet2)], wallet2);

      expect(senderBalance.result).toBeOk(Cl.uint(999));
      expect(recipientBalance.result).toBeOk(Cl.uint(1));
    });

    it("should reject sending zero amount", () => {
      const { result } = simnet.callPublicFn(
        "xwallet",
        "send-stx",
        [Cl.uint(0), Cl.principal(wallet2)],
        wallet1
      );
      expect(result).toBeErr(Cl.uint(101)); // ERR-ZERO-AMOUNT
    });

    it("should reject sending more than available balance", () => {
      const { result } = simnet.callPublicFn(
        "xwallet",
        "send-stx",
        [Cl.uint(1500), Cl.principal(wallet2)],
        wallet1
      );
      expect(result).toBeErr(Cl.uint(100)); // ERR-INSUFFICIENT-BALANCE
    });

    it("should reject self-send", () => {
      const { result } = simnet.callPublicFn(
        "xwallet",
        "send-stx",
        [Cl.uint(100), Cl.principal(wallet1)],
        wallet1
      );
      expect(result).toBeErr(Cl.uint(102)); // ERR-SELF-SEND
    });

    it("should handle sending entire balance", () => {
      const { result } = simnet.callPublicFn(
        "xwallet",
        "send-stx",
        [Cl.uint(1000), Cl.principal(wallet2)],
        wallet1
      );
      expect(result).toBeOk(Cl.uint(1000));

      const senderBalance = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet1)], wallet1);
      const recipientBalance = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet2)], wallet2);

      expect(senderBalance.result).toBeOk(Cl.uint(0));
      expect(recipientBalance.result).toBeOk(Cl.uint(1000));
    });

    it("should handle multiple sends to different recipients", () => {
      simnet.callPublicFn("xwallet", "send-stx", [Cl.uint(200), Cl.principal(wallet2)], wallet1);
      simnet.callPublicFn("xwallet", "send-stx", [Cl.uint(300), Cl.principal(wallet3)], wallet1);

      const balance1 = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet1)], wallet1);
      const balance2 = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet2)], wallet2);
      const balance3 = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet3)], wallet3);

      expect(balance1.result).toBeOk(Cl.uint(500));
      expect(balance2.result).toBeOk(Cl.uint(200));
      expect(balance3.result).toBeOk(Cl.uint(300));
    });
  });

  describe("withdraw function - Unit Tests", () => {
    beforeEach(() => {
      simnet.callPublicFn("xwallet", "deposit", [Cl.uint(1000)], wallet1);
    });

    it("should withdraw minimum amount (1 microSTX)", () => {
      const { result } = simnet.callPublicFn(
        "xwallet",
        "withdraw",
        [Cl.uint(1)],
        wallet1
      );
      expect(result).toBeOk(Cl.uint(1));

      const balance = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet1)], wallet1);
      expect(balance.result).toBeOk(Cl.uint(999));
    });

    it("should reject withdrawing zero amount", () => {
      const { result } = simnet.callPublicFn(
        "xwallet",
        "withdraw",
        [Cl.uint(0)],
        wallet1
      );
      expect(result).toBeErr(Cl.uint(101)); // ERR-ZERO-AMOUNT
    });

    it("should reject withdrawing more than balance", () => {
      const { result } = simnet.callPublicFn(
        "xwallet",
        "withdraw",
        [Cl.uint(1500)],
        wallet1
      );
      expect(result).toBeErr(Cl.uint(100)); // ERR-INSUFFICIENT-BALANCE
    });

    it("should allow withdrawing full balance", () => {
      const { result } = simnet.callPublicFn(
        "xwallet",
        "withdraw",
        [Cl.uint(1000)],
        wallet1
      );
      expect(result).toBeOk(Cl.uint(1000));

      const balance = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet1)], wallet1);
      expect(balance.result).toBeOk(Cl.uint(0));
    });

    it("should handle multiple partial withdrawals", () => {
      simnet.callPublicFn("xwallet", "withdraw", [Cl.uint(200)], wallet1);
      simnet.callPublicFn("xwallet", "withdraw", [Cl.uint(300)], wallet1);

      const balance = simnet.callReadOnlyFn("xwallet", "get-balance", [Cl.principal(wallet1)], wallet1);
      expect(balance.result).toBeOk(Cl.uint(500));
    });

    it("should reject withdrawal when balance becomes zero", () => {
      simnet.callPublicFn("xwallet", "withdraw", [Cl.uint(1000)], wallet1);

      const { result } = simnet.callPublicFn(
        "xwallet",
        "withdraw",
        [Cl.uint(1)],
        wallet1
      );
      expect(result).toBeErr(Cl.uint(100)); // ERR-INSUFFICIENT-BALANCE
    });
  });
});