import { getTronNetwork, isTronChain } from "../constants/chains";
import { ChainIds } from "../constants/contracts";

export interface TronTransaction {
  to: string;
  amount: string;
  data?: string;
}

export interface TronAccount {
  address: string;
  balance: string;
  network: string;
}

export interface TronSignature {
  signature: string;
  messageHash: string;
}

/**
 * Check if the given chain ID is a Tron network
 */
export const isTronNetwork = (chainId: number): boolean => {
  return isTronChain(chainId);
};

/**
 * Get Tron network configuration
 */
export const getTronNetworkConfig = (chainId: number) => {
  return getTronNetwork(chainId);
};

/**
 * Convert Ethereum address format to Tron address format
 */
export const toTronAddress = (address: string): string => {
  // Tron addresses are base58 encoded
  // This is a simplified conversion - in practice you'd use a proper base58 library
  return address;
};

/**
 * Convert Tron address format to Ethereum address format
 */
export const fromTronAddress = (address: string): string => {
  // Convert from Tron base58 format to Ethereum hex format
  // This is a simplified conversion - in practice you'd use a proper base58 library
  return address;
};

/**
 * Get Tron network RPC URL
 */
export const getTronRpcUrl = (chainId: number): string => {
  const network = getTronNetwork(chainId);
  return network?.rpcUrl || "";
};

/**
 * Validate Tron address format
 */
export const isValidTronAddress = (address: string): boolean => {
  // Basic validation - Tron addresses are 34 characters long and start with 'T'
  return address.length === 34 && address.startsWith("T");
};

/**
 * Get supported Tron networks
 */
export const getSupportedTronNetworks = () => {
  return [
    ChainIds.TronNile,
  ];
};

/**
 * Format Tron balance
 */
export const formatTronBalance = (balance: string, decimals: number = 6): string => {
  const num = parseFloat(balance) / Math.pow(10, decimals);
  return num.toFixed(6);
};

/**
 * Convert TRX to SUN (smallest unit)
 */
export const trxToSun = (trx: number): string => {
  return (trx * 1000000).toString();
};

/**
 * Convert SUN to TRX
 */
export const sunToTrx = (sun: string): number => {
  return parseFloat(sun) / 1000000;
};

/**
 * Sign message with Tron wallet
 */
export const signTronMessage = async (
  wallet: any,
  message: string,
  chainId: number
): Promise<TronSignature> => {
  try {
    if (!wallet || !wallet.adapter) {
      throw new Error("Tron wallet not available");
    }

    // Sign the message using Tron wallet
    const signature = await wallet.adapter.signMessage(message);
    
    return {
      signature: signature,
      messageHash: message, // Tron doesn't use the same message hashing as EVM
    };
  } catch (error) {
    console.error("Failed to sign Tron message:", error);
    throw error;
  }
};

/**
 * Get Tron token balance
 */
export const getTronTokenBalance = async (
  wallet: any,
  tokenAddress: string,
  userAddress: string | null
): Promise<string> => {
  try {
    if (!wallet || !wallet.adapter || !userAddress) {
      throw new Error("Tron wallet not available or address is null");
    }

    // This would need to be implemented with actual Tron API calls
    // For now, returning a placeholder
    return "0";
  } catch (error) {
    console.error("Failed to get Tron token balance:", error);
    return "0";
  }
};

/**
 * Approve Tron token spending
 */
export const approveTronToken = async (
  wallet: any,
  tokenAddress: string,
  spenderAddress: string,
  amount: string
): Promise<string> => {
  try {
    if (!wallet || !wallet.adapter) {
      throw new Error("Tron wallet not available");
    }

    // This would need to be implemented with actual Tron contract calls
    // For now, returning a placeholder transaction hash
    return "0x0000000000000000000000000000000000000000000000000000000000000000";
  } catch (error) {
    console.error("Failed to approve Tron token:", error);
    throw error;
  }
};

/**
 * Check Tron token allowance
 */
export const checkTronTokenAllowance = async (
  wallet: any,
  tokenAddress: string,
  ownerAddress: string | null,
  spenderAddress: string
): Promise<string> => {
  try {
    if (!wallet || !wallet.adapter || !ownerAddress) {
      throw new Error("Tron wallet not available or address is null");
    }

    // This would need to be implemented with actual Tron contract calls
    // For now, returning a placeholder
    return "0";
  } catch (error) {
    console.error("Failed to check Tron token allowance:", error);
    return "0";
  }
}; 