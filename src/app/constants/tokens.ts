import { baseSepolia, sepolia } from "wagmi/chains";
import { type Token } from "../types/order";

// Token configurations
export const TOKENS: Record<number, Token[]> = {
  [sepolia.id]: [
    {
      symbol: "BLT",
      name: "BLT Coin",
      address: "0x0BF8E91b08b242cD7380bC92385C90c8270b37f0",
      decimals: 18,
      logo: "/blt-logo.svg",
    },
  ],
  [baseSepolia.id]: [
    {
      symbol: "BLT",
      name: "BLT Coin",
      address: "0xbb7f72d58f5F7147CBa030Ba4c46a94a07E4c2CA",
      decimals: 18,
      logo: "/blt-logo.svg",
    },
  ],
};

// LOP (Liquidity Optimization Protocol) addresses per chain
export const LOP_ADDRESSES: Record<number, string> = {
  [sepolia.id]: "0x32a209c3736c5bd52e395eabc86b9bca4f602985",
  [baseSepolia.id]: "0xe30f9abbadc1eb84b41d41035b2a2c7d0bd5f9b2",
};

// Helper functions
export const getTokensForChain = (chainId: number): Token[] => {
  return TOKENS[chainId] || [];
};

export const getTokenByAddress = (chainId: number, address: string): Token | undefined => {
  return TOKENS[chainId]?.find(token => token.address.toLowerCase() === address.toLowerCase());
};

export const getLopAddress = (chainId: number): string => {
  return LOP_ADDRESSES[chainId] || "";
}; 