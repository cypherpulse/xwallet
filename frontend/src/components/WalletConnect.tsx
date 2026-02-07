import { motion } from 'framer-motion';
import { Wallet, LogOut, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks/useWallet';
import { truncateAddress, formatStx } from '@/utils/formatting';
import { useState } from 'react';

export function WalletConnect() {
  const { isConnected, address, walletBalance, isLoading, connect, disconnect } = useWallet();
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="h-10 w-32 rounded-lg shimmer" />
    );
  }

  if (!isConnected) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Button
          onClick={connect}
          className="glow-button border-0 font-semibold"
        >
          <Wallet className="mr-2 h-4 w-4" />
          Connect Wallet
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3"
    >
      <div className="glass-card rounded-lg px-4 py-2 flex items-center gap-3">
        <div className="flex flex-col items-end">
          <span className="text-xs text-muted-foreground">Balance</span>
          <span className="font-semibold text-foreground">
            {formatStx(walletBalance)} STX
          </span>
        </div>
        <div className="h-8 w-px bg-border" />
        <button
          onClick={copyAddress}
          className="flex items-center gap-2 hover:text-primary transition-colors"
        >
          <span className="font-mono text-sm">{truncateAddress(address || '')}</span>
          {copied ? (
            <Check className="h-4 w-4 text-success" />
          ) : (
            <Copy className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={disconnect}
        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </motion.div>
  );
}
