import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Globe } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useNetwork } from '@/hooks/useNetwork';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';

export function NetworkSwitch() {
  const { network, setNetwork } = useNetwork();
  const [showMainnetWarning, setShowMainnetWarning] = useState(false);

  const handleToggle = () => {
    if (network === 'testnet') {
      setShowMainnetWarning(true);
    } else {
      setNetwork('testnet');
    }
  };

  const confirmMainnet = () => {
    setNetwork('mainnet');
    setShowMainnetWarning(false);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-3"
      >
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Network:</span>
        </div>
        
        <div className="flex items-center gap-2">
          <AnimatePresence mode="wait">
            <motion.span
              key={network}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                network === 'testnet' ? 'network-testnet' : 'network-mainnet'
              }`}
            >
              {network === 'testnet' ? 'Testnet' : 'Mainnet'}
            </motion.span>
          </AnimatePresence>
          
          <Switch
            checked={network === 'mainnet'}
            onCheckedChange={handleToggle}
            className="data-[state=checked]:bg-success"
          />
        </div>
      </motion.div>

      <AlertDialog open={showMainnetWarning} onOpenChange={setShowMainnetWarning}>
        <AlertDialogContent className="glass-card border-warning/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              Switch to Mainnet?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              You are about to switch to Mainnet. This will use real STX tokens 
              and transactions cannot be reversed. Make sure you understand the 
              risks before proceeding.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-secondary hover:bg-secondary/80">
              Stay on Testnet
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmMainnet}
              className="bg-warning text-warning-foreground hover:bg-warning/90"
            >
              Switch to Mainnet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
