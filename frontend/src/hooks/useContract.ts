import { useCallback, useState } from 'react';
import { openContractCall } from '@stacks/connect';
import {
  uintCV,
  principalCV,
  cvToValue,
  fetchCallReadOnlyFunction,
  PostConditionMode,
  Pc,
} from '@stacks/transactions';
import { STACKS_MAINNET, STACKS_TESTNET } from '@stacks/network';
import { useNetwork } from './useNetwork';
import { useWallet } from './useWallet';
import { CONTRACTS, ERROR_CODES, NetworkType } from '@/constants/contracts';
import { stxToMicroStx } from '@/utils/formatting';
import { toast } from '@/hooks/use-toast';

function getNetwork(network: NetworkType) {
  return network === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET;
}

export function useContract() {
  const { network } = useNetwork();
  const { address, refetchBalance, userSession } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [lastTxId, setLastTxId] = useState<string | null>(null);

  const getXWalletBalance = useCallback(async (userAddress?: string): Promise<number> => {
    const targetAddress = userAddress || address;
    if (!targetAddress) return 0;

    try {
      const result = await fetchCallReadOnlyFunction({
        network: getNetwork(network),
        contractAddress: CONTRACTS[network].address,
        contractName: CONTRACTS[network].name,
        functionName: 'get-balance',
        functionArgs: [principalCV(targetAddress)],
        senderAddress: targetAddress,
      });

      const value = cvToValue(result);
      return value.value ? Number(value.value) : 0;
    } catch (error) {
      console.error('Error fetching xWallet balance:', error);
      return 0;
    }
  }, [address, network]);

  const deposit = useCallback(async (amount: number): Promise<string | null> => {
    if (!address) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet first.',
        variant: 'destructive',
      });
      return null;
    }

    const amountInMicroSTX = stxToMicroStx(amount);
    setIsLoading(true);

    return new Promise((resolve) => {
      openContractCall({
        network: getNetwork(network),
        contractAddress: CONTRACTS[network].address,
        contractName: CONTRACTS[network].name,
        functionName: 'deposit',
        functionArgs: [uintCV(amountInMicroSTX)],
        postConditions: [
          Pc.principal(address).willSendLte(amountInMicroSTX).ustx(),
        ],
        postConditionMode: PostConditionMode.Deny,
        onFinish: (data) => {
          setLastTxId(data.txId);
          setIsLoading(false);
          toast({
            title: 'Transaction submitted',
            description: `Deposit of ${amount} STX initiated.`,
          });
          setTimeout(refetchBalance, 2000);
          resolve(data.txId);
        },
        onCancel: () => {
          setIsLoading(false);
          toast({
            title: 'Transaction cancelled',
            description: 'You cancelled the transaction.',
            variant: 'destructive',
          });
          resolve(null);
        },
      });
    });
  }, [address, network, refetchBalance]);

  const sendStx = useCallback(async (amount: number, recipient: string): Promise<string | null> => {
    if (!address) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet first.',
        variant: 'destructive',
      });
      return null;
    }

    const amountInMicroSTX = stxToMicroStx(amount);
    setIsLoading(true);

    return new Promise((resolve) => {
      openContractCall({
        network: getNetwork(network),
        contractAddress: CONTRACTS[network].address,
        contractName: CONTRACTS[network].name,
        functionName: 'send-stx',
        functionArgs: [uintCV(amountInMicroSTX), principalCV(recipient)],
        postConditionMode: PostConditionMode.Deny,
        onFinish: (data) => {
          setLastTxId(data.txId);
          setIsLoading(false);
          toast({
            title: 'Transaction submitted',
            description: `Sending ${amount} STX to ${recipient.slice(0, 10)}...`,
          });
          setTimeout(refetchBalance, 2000);
          resolve(data.txId);
        },
        onCancel: () => {
          setIsLoading(false);
          toast({
            title: 'Transaction cancelled',
            description: 'You cancelled the transaction.',
            variant: 'destructive',
          });
          resolve(null);
        },
      });
    });
  }, [address, network, refetchBalance]);

  const withdraw = useCallback(async (amount: number): Promise<string | null> => {
    if (!address) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet first.',
        variant: 'destructive',
      });
      return null;
    }

    const amountInMicroSTX = stxToMicroStx(amount);
    setIsLoading(true);

    return new Promise((resolve) => {
      openContractCall({
        network: getNetwork(network),
        contractAddress: CONTRACTS[network].address,
        contractName: CONTRACTS[network].name,
        functionName: 'withdraw',
        functionArgs: [uintCV(amountInMicroSTX)],
        postConditionMode: PostConditionMode.Deny,
        onFinish: (data) => {
          setLastTxId(data.txId);
          setIsLoading(false);
          toast({
            title: 'Transaction submitted',
            description: `Withdrawal of ${amount} STX initiated.`,
          });
          setTimeout(refetchBalance, 2000);
          resolve(data.txId);
        },
        onCancel: () => {
          setIsLoading(false);
          toast({
            title: 'Transaction cancelled',
            description: 'You cancelled the transaction.',
            variant: 'destructive',
          });
          resolve(null);
        },
      });
    });
  }, [address, network, refetchBalance]);

  const parseError = useCallback((errorCode: string): string => {
    return ERROR_CODES[errorCode] || 'An unknown error occurred.';
  }, []);

  return {
    getXWalletBalance,
    deposit,
    sendStx,
    withdraw,
    parseError,
    isLoading,
    lastTxId,
    contractAddress: CONTRACTS[network].address,
    contractName: CONTRACTS[network].name,
  };
}
