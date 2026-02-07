import { NetworkType } from '@/constants/contracts';

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: number; // in microSTX
}

export interface TransactionStatus {
  txId: string;
  status: 'pending' | 'success' | 'failed';
  type: 'deposit' | 'send' | 'withdraw';
  amount: number; // in microSTX
  recipient?: string;
  timestamp: number;
  network: NetworkType;
}

export interface ContractCallResult {
  txId: string;
  success: boolean;
  error?: string;
}

export interface BalanceData {
  xWalletBalance: number; // in microSTX
  walletBalance: number; // in microSTX
  loading: boolean;
  error?: string;
}

export interface FormState {
  amount: string;
  recipient?: string;
  isLoading: boolean;
  error?: string;
}
