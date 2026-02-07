import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { NetworkType } from '@/constants/contracts';

interface NetworkState {
  network: NetworkType;
  setNetwork: (network: NetworkType) => void;
  toggleNetwork: () => void;
}

export const useNetwork = create<NetworkState>()(
  persist(
    (set) => ({
      network: 'testnet', // Default to testnet for safety
      setNetwork: (network) => set({ network }),
      toggleNetwork: () =>
        set((state) => ({
          network: state.network === 'testnet' ? 'mainnet' : 'testnet',
        })),
    }),
    {
      name: 'xwallet-network',
    }
  )
);
