import { motion } from 'framer-motion';
import { Header } from '@/components/Header';
import { BalanceCard } from '@/components/BalanceCard';
import { DepositForm } from '@/components/DepositForm';
import { SendForm } from '@/components/SendForm';
import { WithdrawForm } from '@/components/WithdrawForm';
import { useNetwork } from '@/hooks/useNetwork';
import { CONTRACTS } from '@/constants/contracts';
import { ExternalLink, Shield, Zap, Lock } from 'lucide-react';

const Index = () => {
  const { network } = useNetwork();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Your <span className="gradient-text">Smart Wallet</span> on Stacks
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Deposit, send, and withdraw STX securely through your personal smart contract wallet.
          </p>
        </motion.div>

        {/* Feature badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap justify-center gap-4 mb-12"
        >
          <div className="flex items-center gap-2 px-4 py-2 glass-card rounded-full">
            <Shield className="h-4 w-4 text-success" />
            <span className="text-sm">Secure Smart Contract</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 glass-card rounded-full">
            <Zap className="h-4 w-4 text-warning" />
            <span className="text-sm">Instant Transactions</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 glass-card rounded-full">
            <Lock className="h-4 w-4 text-primary" />
            <span className="text-sm">Self-Custody</span>
          </div>
        </motion.div>

        {/* Main content grid */}
        <div className="grid gap-6 lg:grid-cols-2 max-w-5xl mx-auto">
          {/* Balance card - full width on mobile */}
          <div className="lg:col-span-2">
            <BalanceCard />
          </div>

          {/* Action cards */}
          <DepositForm />
          <SendForm />
          
          {/* Withdraw - full width */}
          <div className="lg:col-span-2">
            <WithdrawForm />
          </div>
        </div>

        {/* Contract info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-muted-foreground mb-2">Contract Address</p>
          <a
            href={`https://explorer.stacks.co/address/${CONTRACTS[network].address}?chain=${network}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-mono text-sm text-primary hover:underline"
          >
            {CONTRACTS[network].address}.{CONTRACTS[network].name}
            <ExternalLink className="h-3 w-3" />
          </a>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 xWallet. Built on Stacks.
            </p>
            <div className="flex items-center gap-6">
              <a
                href="https://explorer.stacks.co"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Explorer
              </a>
              <a
                href="https://docs.stacks.co"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Docs
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
