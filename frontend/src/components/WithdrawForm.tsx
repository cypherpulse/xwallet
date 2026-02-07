import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpFromLine, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useContract } from '@/hooks/useContract';
import { useWallet } from '@/hooks/useWallet';
import { useNetwork } from '@/hooks/useNetwork';
import { formatStx, getExplorerUrl } from '@/utils/formatting';
import { toast } from '@/hooks/use-toast';

export function WithdrawForm() {
  const [amount, setAmount] = useState('');
  const [xWalletBalance, setXWalletBalance] = useState(0);
  
  const { withdraw, getXWalletBalance, isLoading, lastTxId } = useContract();
  const { address } = useWallet();
  const { network } = useNetwork();

  useEffect(() => {
    const fetchBalance = async () => {
      if (address) {
        const balance = await getXWalletBalance(address);
        setXWalletBalance(balance);
      }
    };
    fetchBalance();
  }, [address, getXWalletBalance]);

  const handleWithdraw = async () => {
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
    if (microAmount > xWalletBalance) {
      toast({
        title: 'Insufficient balance',
        description: 'You do not have enough STX in your xWallet.',
        variant: 'destructive',
      });
      return;
    }

    const txId = await withdraw(numAmount);
    if (txId) {
      setAmount('');
    }
  };

  const setMaxAmount = () => {
    setAmount((xWalletBalance / 1_000_000).toString());
  };

  const withdrawAll = async () => {
    if (xWalletBalance === 0) {
      toast({
        title: 'No balance',
        description: 'You do not have any STX in your xWallet.',
        variant: 'destructive',
      });
      return;
    }
    const fullAmount = xWalletBalance / 1_000_000;
    const txId = await withdraw(fullAmount);
    if (txId) {
      setAmount('');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card rounded-2xl p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-warning/10">
          <ArrowUpFromLine className="h-5 w-5 text-warning" />
        </div>
        <div>
          <h3 className="font-semibold">Withdraw</h3>
          <p className="text-sm text-muted-foreground">Transfer STX back to your wallet</p>
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
          <p className="text-sm text-muted-foreground">
            xWallet Balance: <span className="font-medium text-foreground">{formatStx(xWalletBalance)} STX</span>
          </p>
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

        <div className="flex gap-2">
          <Button
            onClick={handleWithdraw}
            disabled={!address || isLoading || !amount}
            className="flex-1 glow-button h-12 font-semibold border-0"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Confirming...
              </>
            ) : (
              'Withdraw STX'
            )}
          </Button>
          <Button
            onClick={withdrawAll}
            disabled={!address || isLoading || xWalletBalance === 0}
            variant="secondary"
            className="h-12 font-semibold"
          >
            Withdraw All
          </Button>
        </div>

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
