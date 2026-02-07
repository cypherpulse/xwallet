/**
 * Convert STX to microSTX
 */
export function stxToMicroStx(stx: number): number {
  return Math.floor(stx * 1_000_000);
}

/**
 * Convert microSTX to STX
 */
export function microStxToStx(microStx: number | bigint): number {
  return Number(microStx) / 1_000_000;
}

/**
 * Format STX amount with proper decimals
 */
export function formatStx(microStx: number | bigint, decimals: number = 6): string {
  const stx = microStxToStx(microStx);
  return stx.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals,
  });
}

/**
 * Truncate address for display
 */
export function truncateAddress(address: string, startChars: number = 6, endChars: number = 4): string {
  if (!address) return '';
  if (address.length <= startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Validate Stacks principal address format
 */
export function isValidStacksAddress(address: string): boolean {
  // Stacks addresses start with SP (mainnet) or ST (testnet)
  const stacksAddressRegex = /^(SP|ST)[A-Z0-9]{38,40}$/;
  return stacksAddressRegex.test(address);
}

/**
 * Format date for transaction display
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get explorer URL for transaction
 */
export function getExplorerUrl(txId: string, network: 'testnet' | 'mainnet'): string {
  const baseUrl = 'https://explorer.stacks.co/txid';
  const networkParam = network === 'testnet' ? '?chain=testnet' : '?chain=mainnet';
  return `${baseUrl}/${txId}${networkParam}`;
}
