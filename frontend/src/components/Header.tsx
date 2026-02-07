import { motion } from 'framer-motion';
import { WalletConnect } from './WalletConnect';
import { NetworkSwitch } from './NetworkSwitch';

export function Header() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card border-b border-border"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <span className="text-xl font-bold text-primary-foreground">X</span>
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">xWallet</h1>
              <p className="text-xs text-muted-foreground">Stacks Smart Wallet</p>
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:block">
              <NetworkSwitch />
            </div>
            <WalletConnect />
          </div>
        </div>

        {/* Mobile network switch */}
        <div className="sm:hidden mt-4 pt-4 border-t border-border">
          <NetworkSwitch />
        </div>
      </div>
    </motion.header>
  );
}
