import {
  baseSepolia,
  etherlinkTestnet,
  monadTestnet,
  sepolia,
} from "wagmi/chains";
// Tron network configurations
export const TRON_NETWORKS = {
  nile: {
    id: 3448148188, // Tron Nile Testnet chain ID
    name: "Tron Nile Testnet",
    logo: "/tron-logo.png",
    chainId: 3448148188,
    rpcUrl: "https://nile.trongrid.io",
  },
};

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

// Combined chains including Tron networks
export const ALL_CHAINS = [
  ...CHAINS,
  {
    id: TRON_NETWORKS.nile.id,
    name: TRON_NETWORKS.nile.name,
    logo: TRON_NETWORKS.nile.logo,
    chain: TRON_NETWORKS.nile,
  },
];

// Helper functions
export const getChainById = (chainId: number) => {
  return ALL_CHAINS.find(chain => chain.id === chainId);
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
  return ALL_CHAINS.some(chain => chain.id === chainId);
};

export const isTronChain = (chainId: number): boolean => {
  return chainId === 3448148188; // Tron Nile chain ID
};

export const getTronNetwork = (chainId: number) => {
  if (chainId === 3448148188) return TRON_NETWORKS.nile;
  return null;
};
