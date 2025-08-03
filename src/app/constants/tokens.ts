import {
  baseSepolia,
  etherlinkTestnet,
  monadTestnet,
  sepolia,
} from "wagmi/chains";
import { type Token } from "../types/order";
import { ChainIds } from "./contracts";

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
  [monadTestnet.id]: [
    {
      symbol: "BLT",
      name: "BLT Coin",
      address: "0x60c13fAcC3d2363fa4c1D4c8A0456a4FeBc98903",
      decimals: 18,
      logo: "/blt-logo.svg",
    },
  ],
  [etherlinkTestnet.id]: [
    {
      symbol: "BLT",
      name: "BLT Coin",
      address: "0xb84b2c6c0d554263Eab9f56DEeA8523347270A11",
      decimals: 18,
      logo: "/blt-logo.svg",
    },
  ],
  // Tron tokens
  [ChainIds.TronNile]: [
    {
      symbol: "ITRC",
      name: "ITRC Coin",
      address: "TCLbkeYSQR9zX8D7svdQ85NbdSRCDWVM5R", // Test USDT on Nile
      decimals: 6,
      logo: "/blt-logo.svg",
    },
  ],
};

// LOP (Liquidity Optimization Protocol) addresses per chain
export const LOP_ADDRESSES: Record<number, string> = {
  [sepolia.id]: "0x32a209c3736c5bd52e395eabc86b9bca4f602985",
  [baseSepolia.id]: "0xe30f9abbadc1eb84b41d41035b2a2c7d0bd5f9b2",
  [monadTestnet.id]: "0xFCf9F11666Adb060D03Bb873954673f90914bAdE",
  [etherlinkTestnet.id]: "0x942DFf5Af350fd0816Bd03C91729633C293dB5dA",
  [ChainIds.TronNile]: "0x0656e98bf5b9457048b8ac0985cb48b1b6def4ac",
};

// Helper functions
export const getTokensForChain = (chainId: number): Token[] => {
  return TOKENS[chainId] || [];
};

export const getTokenByAddress = (
  chainId: number,
  address: string
): Token | undefined => {
  return TOKENS[chainId]?.find(
    (token: Token) => token.address.toLowerCase() === address.toLowerCase()
  );
};

export const getLopAddress = (chainId: number): string => {
  return LOP_ADDRESSES[chainId] || "";
};
