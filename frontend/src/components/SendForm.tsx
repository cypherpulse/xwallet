import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, ExternalLink, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useContract } from '@/hooks/useContract';
import { useWallet } from '@/hooks/useWallet';
import { useNetwork } from '@/hooks/useNetwork';
import { formatStx, getExplorerUrl, isValidStacksAddress } from '@/utils/formatting';
import { toast } from '@/hooks/use-toast';

export function SendForm() {
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [xWalletBalance, setXWalletBalance] = useState(0);
  const [recipientError, setRecipientError] = useState('');
  
  const { sendStx, getXWalletBalance, isLoading, lastTxId } = useContract();
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

  useEffect(() => {
    if (recipient) {
      if (!isValidStacksAddress(recipient)) {
        setRecipientError('Invalid Stacks address format');
      } else if (recipient === address) {
        setRecipientError('Cannot send to yourself. Use withdraw instead.');
      } else {
        setRecipientError('');
      }
    } else {
      setRecipientError('');
    }
  }, [recipient, address]);

  const handleSend = async () => {
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid amount greater than 0.',
        variant: 'destructive',
      });
      return;
    }

    if (!isValidStacksAddress(recipient)) {
      toast({
        title: 'Invalid address',
        description: 'Please enter a valid Stacks address.',
        variant: 'destructive',
      });
      return;
    }

    if (recipient === address) {
      toast({
        title: 'Cannot send to yourself',
        description: 'Use the withdraw function to transfer funds to your wallet.',
        variant: 'destructive',
      });
      return;
    }

    const microAmount = numAmount * 1_000_000;
    if (microAmount > xWalletBalance) {
      toast({
        title: 'Insufficient xWallet balance',
        description: 'You do not have enough STX in your xWallet.',
        variant: 'destructive',
      });
      return;
    }

    const txId = await sendStx(numAmount, recipient);
    if (txId) {
      setAmount('');
      setRecipient('');
    }
  };

  const setMaxAmount = () => {
    setAmount((xWalletBalance / 1_000_000).toString());
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card rounded-2xl p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <Send className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Send</h3>
          <p className="text-sm text-muted-foreground">Transfer STX to another address</p>
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

        <div className="space-y-2">
          <Input
            type="text"
            placeholder="Recipient address (SP... or ST...)"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value.toUpperCase())}
            className={`font-mono text-sm bg-secondary/50 border-border focus:border-primary ${
              recipientError ? 'border-destructive' : ''
            }`}
            disabled={!address || isLoading}
          />
          {recipientError && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="text-sm text-destructive flex items-center gap-1"
            >
              <AlertCircle className="h-3 w-3" />
              {recipientError}
            </motion.p>
          )}
        </div>

        <Button
          onClick={handleSend}
          disabled={!address || isLoading || !amount || !recipient || !!recipientError}
          className="w-full glow-button h-12 font-semibold border-0"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Confirming...
            </>
          ) : (
            'Send STX'
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
