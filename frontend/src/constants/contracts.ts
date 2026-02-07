export const CONTRACTS = {
  testnet: {
    address: 'STGDS0Y17973EN5TCHNHGJJ9B31XWQ5YXBQ0KQ2Y',
    name: 'xwallet',
  },
  mainnet: {
    address: 'SPGDS0Y17973EN5TCHNHGJJ9B31XWQ5YX8A36C9B',
    name: 'xwallet',
  },
} as const;

export const ERROR_CODES: Record<string, string> = {
  'u100': 'Insufficient balance in xWallet. Please deposit more STX.',
  'u101': 'Amount must be greater than zero.',
  'u102': 'Cannot send to yourself. Use the withdraw function instead.',
  'u103': 'Transfer failed. Please check your wallet balance and try again.',
};

export const EXPLORER_URLS = {
  testnet: 'https://explorer.stacks.co/txid',
  mainnet: 'https://explorer.stacks.co/txid',
} as const;

export const API_URLS = {
  testnet: 'https://api.testnet.hiro.so',
  mainnet: 'https://api.mainnet.hiro.so',
} as const;

export type NetworkType = 'testnet' | 'mainnet';
