import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;

describe("xWallet Contract Tests", () => {
  
  describe("deposit function", () => {
    it("should allow users to deposit STX", () => {
      const depositAmount = 1000;
      const { result } = simnet.callPublicFn(
        "xwallet",
        "deposit",
        [Cl.uint(depositAmount)],
        wallet1
      );
      expect(result).toBeOk(Cl.uint(depositAmount));
      
      // Check balance
      const balance = simnet.callReadOnlyFn(
        "xwallet",
        "get-balance",
        [Cl.principal(wallet1)],
        wallet1
      );
      expect(balance.result).toBeOk(Cl.uint(depositAmount));
    });

    it("should reject deposits of zero amount", () => {
      const { result } = simnet.callPublicFn(
        "xwallet",
        "deposit",
        [Cl.uint(0)],
        wallet1
      );
      expect(result).toBeErr(Cl.uint(101)); // ERR-ZERO-AMOUNT
    });

    it("should accumulate multiple deposits", () => {
      simnet.callPublicFn("xwallet", "deposit", [Cl.uint(500)], wallet1);
      simnet.callPublicFn("xwallet", "deposit", [Cl.uint(300)], wallet1);
      
      const balance = simnet.callReadOnlyFn(
        "xwallet",
        "get-balance",
        [Cl.principal(wallet1)],
        wallet1
      );
      expect(balance.result).toBeOk(Cl.uint(800));
    });
  });

  describe("get-balance function", () => {
    it("should return zero for users with no balance", () => {
      const balance = simnet.callReadOnlyFn(
        "xwallet",
        "get-balance",
        [Cl.principal(wallet1)],
        wallet1
      );
      expect(balance.result).toBeOk(Cl.uint(0));
    });

    it("should return correct balance after deposit", () => {
      simnet.callPublicFn("xwallet", "deposit", [Cl.uint(2000)], wallet1);
      
      const balance = simnet.callReadOnlyFn(
        "xwallet",
        "get-balance",
        [Cl.principal(wallet1)],
        wallet1
      );
      expect(balance.result).toBeOk(Cl.uint(2000));
    });
  });

  describe("send-stx function", () => {
    beforeEach(() => {
      simnet.callPublicFn("xwallet", "deposit", [Cl.uint(1000)], wallet1);
    });

    it("should allow sending STX to another user", () => {
      const { result } = simnet.callPublicFn(
        "xwallet",
        "send-stx",
        [Cl.uint(400), Cl.principal(wallet2)],
        wallet1
      );
      expect(result).toBeOk(Cl.uint(400));
      
      // Check sender balance decreased
      const senderBalance = simnet.callReadOnlyFn(
        "xwallet",
        "get-balance",
        [Cl.principal(wallet1)],
        wallet1
      );
      expect(senderBalance.result).toBeOk(Cl.uint(600));
      
      // Check recipient balance increased
      const recipientBalance = simnet.callReadOnlyFn(
        "xwallet",
        "get-balance",
        [Cl.principal(wallet2)],
        wallet2
      );
      expect(recipientBalance.result).toBeOk(Cl.uint(400));
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

    it("should reject sending more than balance", () => {
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

    it("should handle multiple sends correctly", () => {
      simnet.callPublicFn(
        "xwallet",
        "send-stx",
        [Cl.uint(200), Cl.principal(wallet2)],
        wallet1
      );
      simnet.callPublicFn(
        "xwallet",
        "send-stx",
        [Cl.uint(300), Cl.principal(wallet3)],
        wallet1
      );
      
      const wallet1Balance = simnet.callReadOnlyFn(
        "xwallet",
        "get-balance",
        [Cl.principal(wallet1)],
        wallet1
      );
      expect(wallet1Balance.result).toBeOk(Cl.uint(500));
      
      const wallet2Balance = simnet.callReadOnlyFn(
        "xwallet",
        "get-balance",
        [Cl.principal(wallet2)],
        wallet2
      );
      expect(wallet2Balance.result).toBeOk(Cl.uint(200));
      
      const wallet3Balance = simnet.callReadOnlyFn(
        "xwallet",
        "get-balance",
        [Cl.principal(wallet3)],
        wallet3
      );
      expect(wallet3Balance.result).toBeOk(Cl.uint(300));
    });
  });

  describe("withdraw function", () => {
    beforeEach(() => {
      simnet.callPublicFn("xwallet", "deposit", [Cl.uint(1000)], wallet1);
    });

    it("should allow users to withdraw their balance", () => {
      const { result } = simnet.callPublicFn(
        "xwallet",
        "withdraw",
        [Cl.uint(600)],
        wallet1
      );
      expect(result).toBeOk(Cl.uint(600));
      
      // Check balance decreased
      const balance = simnet.callReadOnlyFn(
        "xwallet",
        "get-balance",
        [Cl.principal(wallet1)],
        wallet1
      );
      expect(balance.result).toBeOk(Cl.uint(400));
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
      
      const balance = simnet.callReadOnlyFn(
        "xwallet",
        "get-balance",
        [Cl.principal(wallet1)],
        wallet1
      );
      expect(balance.result).toBeOk(Cl.uint(0));
    });

    it("should reject withdrawal when balance is zero", () => {
      simnet.callPublicFn("xwallet", "withdraw", [Cl.uint(1000)], wallet1);
      
      const { result } = simnet.callPublicFn(
        "xwallet",
        "withdraw",
        [Cl.uint(100)],
        wallet1
      );
      expect(result).toBeErr(Cl.uint(100)); // ERR-INSUFFICIENT-BALANCE
    });
  });

  describe("complex scenarios", () => {
    it("should handle deposit, send, and withdraw flow", () => {
      // Wallet1 deposits
      simnet.callPublicFn("xwallet", "deposit", [Cl.uint(2000)], wallet1);
      
      // Wallet1 sends to wallet2
      simnet.callPublicFn(
        "xwallet",
        "send-stx",
        [Cl.uint(800), Cl.principal(wallet2)],
        wallet1
      );
      
      // Wallet2 withdraws
      simnet.callPublicFn("xwallet", "withdraw", [Cl.uint(500)], wallet2);
      
      // Check final balances
      const wallet1Balance = simnet.callReadOnlyFn(
        "xwallet",
        "get-balance",
        [Cl.principal(wallet1)],
        wallet1
      );
      expect(wallet1Balance.result).toBeOk(Cl.uint(1200));
      
      const wallet2Balance = simnet.callReadOnlyFn(
        "xwallet",
        "get-balance",
        [Cl.principal(wallet2)],
        wallet2
      );
      expect(wallet2Balance.result).toBeOk(Cl.uint(300));
    });

    it("should handle multiple users independently", () => {
      simnet.callPublicFn("xwallet", "deposit", [Cl.uint(1000)], wallet1);
      simnet.callPublicFn("xwallet", "deposit", [Cl.uint(2000)], wallet2);
      simnet.callPublicFn("xwallet", "deposit", [Cl.uint(1500)], wallet3);
      
      const wallet1Balance = simnet.callReadOnlyFn(
        "xwallet",
        "get-balance",
        [Cl.principal(wallet1)],
        wallet1
      );
      const wallet2Balance = simnet.callReadOnlyFn(
        "xwallet",
        "get-balance",
        [Cl.principal(wallet2)],
        wallet2
      );
      const wallet3Balance = simnet.callReadOnlyFn(
        "xwallet",
        "get-balance",
        [Cl.principal(wallet3)],
        wallet3
      );
      
      expect(wallet1Balance.result).toBeOk(Cl.uint(1000));
      expect(wallet2Balance.result).toBeOk(Cl.uint(2000));
      expect(wallet3Balance.result).toBeOk(Cl.uint(1500));
    });
  });
});