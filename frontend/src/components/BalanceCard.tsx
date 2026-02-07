import { motion } from 'framer-motion';
import { Wallet, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatStx } from '@/utils/formatting';
import { useEffect, useState } from 'react';
import { useContract } from '@/hooks/useContract';
import { useWallet } from '@/hooks/useWallet';

export function BalanceCard() {
  const { address, walletBalance, refetchBalance } = useWallet();
  const { getXWalletBalance } = useContract();
  const [xWalletBalance, setXWalletBalance] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBalances = async () => {
    if (!address) return;
    setIsLoading(true);
    try {
      const balance = await getXWalletBalance(address);
      setXWalletBalance(balance);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchBalances();
  }, [address, getXWalletBalance]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchBalances(), refetchBalance()]);
    setIsRefreshing(false);
  };

  if (!address) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-8 text-center"
      >
        <Wallet className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
        <p className="text-muted-foreground">
          Connect your Hiro or Leather wallet to view your balance and interact with xWallet.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6 relative overflow-hidden"
    >
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl -mr-32 -mt-32" />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-muted-foreground">xWallet Balance</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-muted-foreground hover:text-primary"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <div className="h-12 w-48 shimmer rounded-lg" />
            <div className="h-4 w-32 shimmer rounded" />
          </div>
        ) : (
          <>
            <motion.div
              key={xWalletBalance}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-6"
            >
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold gradient-text">
                  {formatStx(xWalletBalance)}
                </span>
                <span className="text-2xl font-semibold text-muted-foreground">STX</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                ≈ {(xWalletBalance / 1_000_000).toFixed(6)} STX
              </p>
            </motion.div>

            <div className="flex items-center gap-4 pt-4 border-t border-border">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Wallet Balance</p>
                <p className="font-semibold">{formatStx(walletBalance)} STX</p>
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Available to Deposit</p>
                <p className="font-semibold text-success">{formatStx(walletBalance)} STX</p>
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
