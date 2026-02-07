import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownToLine, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useContract } from '@/hooks/useContract';
import { useWallet } from '@/hooks/useWallet';
import { useNetwork } from '@/hooks/useNetwork';
import { formatStx, getExplorerUrl } from '@/utils/formatting';
import { toast } from '@/hooks/use-toast';

const PRESETS = [0.1, 1, 5, 10];

export function DepositForm() {
  const [amount, setAmount] = useState('');
  const { deposit, isLoading, lastTxId } = useContract();
  const { walletBalance, address } = useWallet();
  const { network } = useNetwork();

  const handleDeposit = async () => {
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid amount greater than 0.',
        variant: 'destructive',
      });
      return;
    }

    const microAmount = numAmount * 1_000_000;
    if (microAmount > walletBalance) {
      toast({
        title: 'Insufficient balance',
        description: 'You do not have enough STX in your wallet.',
        variant: 'destructive',
      });
      return;
    }

    const txId = await deposit(numAmount);
    if (txId) {
      setAmount('');
    }
  };

  const setMaxAmount = () => {
    // Leave some for transaction fees
    const maxAmount = Math.max(0, walletBalance - 1000) / 1_000_000;
    setAmount(maxAmount.toString());
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-card rounded-2xl p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-success/10">
          <ArrowDownToLine className="h-5 w-5 text-success" />
        </div>
        <div>
          <h3 className="font-semibold">Deposit</h3>
          <p className="text-sm text-muted-foreground">Add STX to your xWallet</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="text-2xl font-bold h-14 pr-20 bg-secondary/50 border-border focus:border-primary"
            disabled={!address || isLoading}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <span className="text-muted-foreground font-medium">STX</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {PRESETS.map((preset) => (
              <Button
                key={preset}
                variant="secondary"
                size="sm"
                onClick={() => setAmount(preset.toString())}
                disabled={!address || isLoading}
                className="text-xs"
              >
                {preset} STX
              </Button>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={setMaxAmount}
            disabled={!address || isLoading}
            className="text-primary"
          >
            Max
          </Button>
        </div>

        <div className="pt-2">
          <p className="text-sm text-muted-foreground flex justify-between">
            <span>Available:</span>
            <span className="font-medium text-foreground">{formatStx(walletBalance)} STX</span>
          </p>
        </div>

        <Button
          onClick={handleDeposit}
          disabled={!address || isLoading || !amount}
          className="w-full glow-button h-12 font-semibold border-0"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Confirming...
            </>
          ) : (
            'Deposit STX'
          )}
        </Button>

        {lastTxId && (
          <motion.a
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            href={getExplorerUrl(lastTxId, network)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-sm text-primary hover:underline"
          >
            View transaction
            <ExternalLink className="h-3 w-3" />
          </motion.a>
        )}
      </div>
    </motion.div>
  );
}
