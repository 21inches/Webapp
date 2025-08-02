import {
  baseSepolia,
  etherlinkTestnet,
  monadTestnet,
  sepolia,
} from "wagmi/chains";

// Chain configurations
export const CHAINS = [
  {
    id: sepolia.id,
    name: "Sepolia",
    logo: "/ethereum-logo.svg",
    chain: sepolia,
  },
  {
    id: baseSepolia.id,
    name: "Base Sepolia",
    logo: "/base-logo.svg",
    chain: baseSepolia,
  },
  {
    id: monadTestnet.id,
    name: "Monad Testnet",
    logo: "/monad-logo.svg",
    chain: monadTestnet,
  },
  {
    id: etherlinkTestnet.id,
    name: "Etherlink Testnet",
    logo: "/etherlink-logo.svg",
    chain: etherlinkTestnet,
  },
];

// Helper functions
export const getChainById = (chainId: number) => {
  return CHAINS.find(chain => chain.id === chainId);
};

export const getChainName = (chainId: number): string => {
  const chain = getChainById(chainId);
  return chain?.name || `Chain ${chainId}`;
};

export const getChainLogo = (chainId: number): string => {
  const chain = getChainById(chainId);
  return chain?.logo || "/default-chain-logo.svg";
};

export const isSupportedChain = (chainId: number): boolean => {
  return CHAINS.some(chain => chain.id === chainId);
};
