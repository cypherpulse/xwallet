import { useState, useEffect, useCallback, useMemo } from 'react';
import { AppConfig, UserSession, authenticate, disconnect } from '@stacks/connect';
import { useNetwork } from './useNetwork';
import { API_URLS } from '@/constants/contracts';
import { toast } from '@/hooks/use-toast';

const appConfig = new AppConfig(['store_write', 'publish_data']);
const userSession = new UserSession({ appConfig });

export function useWallet() {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const { network } = useNetwork();

  // Check if user is signed in and update address based on network
  useEffect(() => {
    if (userSession.isUserSignedIn()) {
      const userData = userSession.loadUserData();
      const userAddress = network === 'mainnet' 
        ? userData.profile.stxAddress.mainnet 
        : userData.profile.stxAddress.testnet;
      setAddress(userAddress);
      setIsConnected(true);
    } else {
      setAddress(null);
      setIsConnected(false);
    }
    setIsLoading(false);
  }, [network]);

  // Fetch wallet balance
  const fetchBalance = useCallback(async () => {
    if (!address) return;
    
    try {
      const response = await fetch(
        `${API_URLS[network]}/extended/v1/address/${address}/balances`
      );
      const data = await response.json();
      setWalletBalance(Number(data.stx.balance));
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  }, [address, network]);

  useEffect(() => {
    if (address) {
      fetchBalance();
      // Refresh balance every 30 seconds
      const interval = setInterval(fetchBalance, 30000);
      return () => clearInterval(interval);
    }
  }, [address, fetchBalance]);

  const connect = useCallback(() => {
    try {
      authenticate({
        userSession,
        onFinish: ({ userSession: us }) => {
          // Check if user is now signed in
          if (us.isUserSignedIn()) {
            const userData = us.loadUserData();
            const userAddress = network === 'mainnet' 
              ? userData.profile.stxAddress.mainnet 
              : userData.profile.stxAddress.testnet;
            setAddress(userAddress);
            setIsConnected(true);
            toast({
              title: 'Wallet connected',
              description: `Connected to ${userAddress.slice(0, 8)}...${userAddress.slice(-4)}`,
            });
          }
        },
        onCancel: () => {
          toast({
            title: 'Connection cancelled',
            description: 'You cancelled the wallet connection.',
            variant: 'destructive',
          });
        },
      });
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast({
        title: 'Wallet not found',
        description: 'Please install Hiro Wallet or Leather wallet extension to connect.',
        variant: 'destructive',
      });
    }
  }, [network]);

  const disconnectWallet = useCallback(() => {
    disconnect();
    setIsConnected(false);
    setAddress(null);
    setWalletBalance(0);
    toast({
      title: 'Wallet disconnected',
      description: 'Your wallet has been disconnected.',
    });
  }, []);

  return useMemo(() => ({
    isConnected,
    address,
    walletBalance,
    isLoading,
    connect,
    disconnect: disconnectWallet,
    refetchBalance: fetchBalance,
    userSession,
  }), [isConnected, address, walletBalance, isLoading, connect, disconnectWallet, fetchBalance]);
}
