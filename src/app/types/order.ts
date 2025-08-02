// Order lifecycle states
export type OrderStatus = 
  | "CREATED"
  | "PENDING_SECRET" 
  | "PENDING_WITHDRAW"
  | "COMPLETED"
  | "FAILED";

// Transaction interface
export interface Transaction {
  txHash: string;
  txLink: string;
  description: string;
  chainId?: number;
  blockHash?: string;
  blockLink?: string;
}

// Transaction types
export interface OrderTransactions {
  orderFill?: Transaction;
  dstEscrowDeploy?: Transaction;
  dstWithdraw?: Transaction;
  srcWithdraw?: Transaction;
}

// Token interface
export interface Token {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logo?: string;
}

// Swap state interface
export interface SwapState {
  fromChain: number;
  toChain: number;
  fromToken: Token;
  toToken: Token;
  fromAmount: string;
  toAmount: string;
  userAddress?: string;
}

// Main Order interface
export interface Order {
  id: string;
  createdAt: number;
  updatedAt?: number;
  status: OrderStatus;
  swapState: SwapState;
  fromToken: Token;
  toToken: Token;
  orderHash?: string;
  secret?: string;
  orderFillTxHash?: string;
  dstEscrowDeployTxHash?: string;
  dstWithdrawTxHash?: string;
  srcWithdrawTxHash?: string;
  orderFillTxLink?: string;
  dstEscrowDeployTxLink?: string;
  dstWithdrawTxLink?: string;
  srcWithdrawTxLink?: string;
  completedAt?: number;
  failedAt?: number;
  message?: string;
  error?: string;
  transactions?: OrderTransactions;
  metadata?: Record<string, unknown>;
} 