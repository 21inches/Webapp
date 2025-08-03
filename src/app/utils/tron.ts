/* eslint-disable @typescript-eslint/no-explicit-any */
import { TRC20_ABI } from "../constants/abi";
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

// Tron API endpoints
const TRON_API_ENDPOINTS = {
  mainnet: "https://api.trongrid.io",
  shasta: "https://api.shasta.trongrid.io",
  nile: "https://nile.trongrid.io"
};

// Helper function to get TronWeb instance
const getTronWebInstance = async (chainId: number) => {
  // Check if window.tronWeb is available (TronLink)
  if (typeof window !== 'undefined' && window.tronWeb && window.tronWeb.ready) {
    console.log("🌐 [getTronWebInstance] Using window.tronWeb (TronLink)");
    return window.tronWeb;
  }

  console.log("⚠️ [getTronWebInstance] TronWeb not available, will use API fallback");
  return null;
};

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
 * Get Tron account balance via API
 */
export const getTronAccountBalance = async (address: string, chainId: number): Promise<string> => {
  console.log("🔍 [getTronAccountBalance] Starting...", { address, chainId });
  
  try {
    const network = getTronNetwork(chainId);
    console.log("🌐 [getTronAccountBalance] Network config:", network);
    
    if (!network) {
      console.error("❌ [getTronAccountBalance] Invalid Tron network for chainId:", chainId);
      throw new Error("Invalid Tron network");
    }

    const apiUrl = `${network.rpcUrl}/v1/accounts/${address}`;
    console.log("📡 [getTronAccountBalance] Making API call to:", apiUrl);

    const response = await fetch(apiUrl);
    console.log("📥 [getTronAccountBalance] Response status:", response.status);
    
    if (!response.ok) {
      console.error("❌ [getTronAccountBalance] API call failed:", response.status, response.statusText);
      throw new Error("Failed to fetch account balance");
    }

    const data = await response.json();
    console.log("📊 [getTronAccountBalance] Response data:", data);
    
    const balance = data.balance || "0";
    console.log("💰 [getTronAccountBalance] Final balance:", balance);
    
    return balance;
  } catch (error) {
    console.error("❌ [getTronAccountBalance] Error:", error);
    return "0";
  }
};

/**
 * Get TRC20 token balance using TronWeb
 */
export const getTronTokenBalance = async (
  wallet: any,
  tokenAddress: string,
  userAddress: string | null
): Promise<string> => {
  console.log("🔍 [getTronTokenBalance] Starting...", { 
    wallet: !!wallet, 
    hasAdapter: !!wallet?.adapter, 
    tokenAddress, 
    userAddress 
  });
  
  try {
    if (!wallet || !wallet.adapter || !userAddress) {
      console.error("❌ [getTronTokenBalance] Wallet validation failed:", {
        hasWallet: !!wallet,
        hasAdapter: !!wallet?.adapter,
        userAddress
      });
      throw new Error("Tron wallet not available or address is null");
    }

    // Get the current chain ID from wallet or use default
    const chainId = wallet.adapter.chainId || ChainIds.TronNile;
    console.log("🌐 [getTronTokenBalance] Chain ID:", chainId);
    
    const network = getTronNetwork(chainId);
    console.log("🌐 [getTronTokenBalance] Network config:", network);
    
    if (!network) {
      console.error("❌ [getTronTokenBalance] Invalid Tron network for chainId:", chainId);
      throw new Error("Invalid Tron network");
    }

    // Get TronWeb instance
    const tronWeb = await getTronWebInstance(chainId);
    
    if (tronWeb) {
      console.log("🌐 [getTronTokenBalance] Using TronWeb for balance check");
      
      try {
        // Use TronWeb to get token balance
        const contract = await tronWeb.contract().at(tokenAddress);
        console.log("📋 [getTronTokenBalance] Contract instance created");
        
        const balance = await contract.balanceOf(userAddress).call();
        console.log("💰 [getTronTokenBalance] TronWeb balance result:", balance);
        
        // Convert balance to string and adjust for decimals
        const balanceString = String(balance);
        console.log("💰 [getTronTokenBalance] Raw balance:", balanceString);
        
        // Note: You might want to adjust for decimals here
        // const adjustedBalance = parseFloat(balanceString) / Math.pow(10, decimals);
        
        return balanceString;
      } catch (tronWebError) {
        console.error("❌ [getTronTokenBalance] TronWeb error:", tronWebError);
        console.log("🔄 [getTronTokenBalance] Falling back to API call...");
        
        // Fallback to API call
        const balance = await callTronContract(
          tokenAddress,
          "balanceOf",
          [userAddress],
          chainId
        );

        console.log("💰 [getTronTokenBalance] API fallback balance:", balance);
        return balance || "0";
      }
    } else {
      console.log("⚠️ [getTronTokenBalance] TronWeb not available, using API call");
      
      // Fallback to API call
      const balance = await callTronContract(
        tokenAddress,
        "balanceOf",
        [userAddress],
        chainId
      );

      console.log("💰 [getTronTokenBalance] API balance:", balance);
      return balance || "0";
    }
  } catch (error) {
    console.error("❌ [getTronTokenBalance] Error:", error);
    return "0";
  }
};

/**
 * Call Tron smart contract function
 */
export const callTronContract = async (
  contractAddress: string,
  functionName: string,
  parameters: any[] = [],
  chainId: number
): Promise<string> => {
  console.log("🔍 [callTronContract] Starting...", { 
    contractAddress, 
    functionName, 
    parameters, 
    chainId 
  });
  
  try {
    const network = getTronNetwork(chainId);
    console.log("🌐 [callTronContract] Network config:", network);
    
    if (!network) {
      console.error("❌ [callTronContract] Invalid Tron network for chainId:", chainId);
      throw new Error("Invalid Tron network");
    }

    // Find the ABI function
    console.log("🔍 [callTronContract] Searching for function in TRC20_ABI:", functionName);
    const abiFunction = TRC20_ABI.find(item => 
      item.type === "function" && item.name === functionName
    );
    
    console.log("📋 [callTronContract] Found ABI function:", abiFunction);
    
    if (!abiFunction) {
      console.error("❌ [callTronContract] Function not found in ABI:", functionName);
      throw new Error(`Function ${functionName} not found in ABI`);
    }

    // Encode function call
    console.log("🔧 [callTronContract] Encoding function call...");
    const encodedData = encodeTronFunctionCall(abiFunction, parameters);
    console.log("🔧 [callTronContract] Encoded data:", encodedData);

    const requestBody = {
      contract_address: contractAddress,
      function_selector: functionName,
      parameter: encodedData,
      owner_address: parameters[0] || "", // Use first parameter as owner if available
      fee_limit: 1000000000,
      call_value: 0
    };
    
    console.log("📤 [callTronContract] Request body:", requestBody);

    // Make API call to Tron network
    const apiUrl = `${network.rpcUrl}/wallet/triggersmartcontract`;
    console.log("📡 [callTronContract] Making API call to:", apiUrl);
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody)
    });

    console.log("📥 [callTronContract] Response status:", response.status);
    
    if (!response.ok) {
      console.error("❌ [callTronContract] API call failed:", response.status, response.statusText);
      throw new Error("Failed to call Tron contract");
    }

    const data = await response.json();
    console.log("📊 [callTronContract] Response data:", data);
    
    const result = data.result || "0";
    console.log("✅ [callTronContract] Final result:", result);
    
    return result;
  } catch (error) {
    console.error("❌ [callTronContract] Error:", error);
    throw error;
  }
};

/**
 * Encode Tron function call parameters
 */
export const encodeTronFunctionCall = (abiFunction: any, parameters: any[]): string => {
  console.log("🔧 [encodeTronFunctionCall] Starting...", { 
    abiFunction, 
    parameters 
  });
  
  // This is a simplified encoding - in practice you'd use a proper ABI encoder
  // For now, we'll return a placeholder
  console.log("⚠️ [encodeTronFunctionCall] Using placeholder encoding - needs proper ABI encoder");
  console.log("📝 [encodeTronFunctionCall] Parameters to encode:", parameters);
  
  // TODO: Implement proper ABI encoding for Tron
  // This should use a library like ethers.js or similar for proper parameter encoding
  const encodedData = "0x";
  console.log("🔧 [encodeTronFunctionCall] Encoded data (placeholder):", encodedData);
  
  return encodedData;
};

/**
 * Approve Tron token spending using TronWeb
 */
export const approveTronToken = async (
  wallet: any,
  tokenAddress: string,
  spenderAddress: string,
  amount: string
): Promise<string> => {
  console.log("🔍 [approveTronToken] Starting...", { 
    wallet: !!wallet, 
    hasAdapter: !!wallet?.adapter, 
    tokenAddress, 
    spenderAddress, 
    amount 
  });
  
  try {
    if (!wallet || !wallet.adapter) {
      console.error("❌ [approveTronToken] Wallet validation failed:", {
        hasWallet: !!wallet,
        hasAdapter: !!wallet?.adapter
      });
      throw new Error("Tron wallet not available");
    }

    const chainId = wallet.adapter.chainId || ChainIds.TronNile;
    console.log("🌐 [approveTronToken] Chain ID:", chainId);
    
    const network = getTronNetwork(chainId);
    console.log("🌐 [approveTronToken] Network config:", network);
    
    if (!network) {
      console.error("❌ [approveTronToken] Invalid Tron network for chainId:", chainId);
      throw new Error("Invalid Tron network");
    }

    // Get TronWeb instance
    const tronWeb = await getTronWebInstance(chainId);
    
    if (tronWeb && tronWeb.ready) {
      console.log("🌐 [approveTronToken] Using TronWeb for approval");
      
      try {
        // Use TronWeb to approve token spending
        const contract = await tronWeb.contract().at(tokenAddress);
        console.log("📋 [approveTronToken] Contract instance created");
        
        console.log("📝 [approveTronToken] Sending approval transaction...");
        const result = await contract.approve(spenderAddress, amount).send();
        console.log("📊 [approveTronToken] TronWeb approval result:", result);
        
        const txHash = (result as any).txid || (result as any).transaction?.txID || "0x0000000000000000000000000000000000000000000000000000000000000000";
        console.log("✅ [approveTronToken] TronWeb transaction hash:", txHash);
        
        return txHash;
      } catch (tronWebError) {
        console.error("❌ [approveTronToken] TronWeb error:", tronWebError);
        console.log("🔄 [approveTronToken] Falling back to wallet adapter...");
        
        // Fallback to wallet adapter
        const transaction = await createTronTransaction(
          wallet,
          tokenAddress,
          "approve",
          [spenderAddress, amount],
          chainId
        );

        console.log("📊 [approveTronToken] Wallet adapter transaction result:", transaction);
        
        const txHash = (transaction as any).txid || "0x0000000000000000000000000000000000000000000000000000000000000000";
        console.log("✅ [approveTronToken] Wallet adapter transaction hash:", txHash);
        
        return txHash;
      }
    } else {
      console.log("⚠️ [approveTronToken] TronWeb not available, using wallet adapter");
      
      // Use wallet adapter
      const transaction = await createTronTransaction(
        wallet,
        tokenAddress,
        "approve",
        [spenderAddress, amount],
        chainId
      );

      console.log("📊 [approveTronToken] Wallet adapter transaction result:", transaction);
      
      const txHash = (transaction as any).txid || "0x0000000000000000000000000000000000000000000000000000000000000000";
      console.log("✅ [approveTronToken] Wallet adapter transaction hash:", txHash);
      
      return txHash;
    }
  } catch (error) {
    console.error("❌ [approveTronToken] Error:", error);
    throw error;
  }
};

/**
 * Check Tron token allowance using TronWeb
 */
export const checkTronTokenAllowance = async (
  wallet: any,
  tokenAddress: string,
  ownerAddress: string | null,
  spenderAddress: string
): Promise<string> => {
  console.log("🔍 [checkTronTokenAllowance] Starting...", { 
    wallet: !!wallet, 
    hasAdapter: !!wallet?.adapter, 
    tokenAddress, 
    ownerAddress, 
    spenderAddress 
  });
  
  try {
    if (!wallet || !wallet.adapter || !ownerAddress) {
      console.error("❌ [checkTronTokenAllowance] Wallet validation failed:", {
        hasWallet: !!wallet,
        hasAdapter: !!wallet?.adapter,
        ownerAddress
      });
      throw new Error("Tron wallet not available or address is null");
    }

    const chainId = wallet.adapter.chainId || ChainIds.TronNile;
    console.log("🌐 [checkTronTokenAllowance] Chain ID:", chainId);
    
    // Get TronWeb instance
    const tronWeb = await getTronWebInstance(chainId);
    
    if (tronWeb) {
      console.log("🌐 [checkTronTokenAllowance] Using TronWeb for allowance check");
      
      try {
        // Use TronWeb to get token allowance
        const contract = await tronWeb.contract().at(tokenAddress);
        console.log("📋 [checkTronTokenAllowance] Contract instance created");
        
        const allowance = await contract.allowance(ownerAddress, spenderAddress).call();
        console.log("💰 [checkTronTokenAllowance] TronWeb allowance result:", allowance);
        
        // Convert allowance to string
        const allowanceString = String(allowance);
        console.log("💰 [checkTronTokenAllowance] Raw allowance:", allowanceString);
        
        return allowanceString;
      } catch (tronWebError) {
        console.error("❌ [checkTronTokenAllowance] TronWeb error:", tronWebError);
        console.log("🔄 [checkTronTokenAllowance] Falling back to API call...");
        
        // Fallback to API call
        const allowance = await callTronContract(
          tokenAddress,
          "allowance",
          [ownerAddress, spenderAddress],
          chainId
        );

        console.log("💰 [checkTronTokenAllowance] API fallback allowance:", allowance);
        return allowance || "0";
      }
    } else {
      console.log("⚠️ [checkTronTokenAllowance] TronWeb not available, using API call");
      
      // Fallback to API call
      const allowance = await callTronContract(
        tokenAddress,
        "allowance",
        [ownerAddress, spenderAddress],
        chainId
      );

      console.log("💰 [checkTronTokenAllowance] API allowance:", allowance);
      return allowance || "0";
    }
  } catch (error) {
    console.error("❌ [checkTronTokenAllowance] Error:", error);
    return "0";
  }
};

/**
 * Create and sign Tron transaction
 */
export const createTronTransaction = async (
  wallet: any,
  contractAddress: string,
  functionName: string,
  parameters: any[] = [],
  chainId: number
): Promise<any> => {
  console.log("🔍 [createTronTransaction] Starting...", { 
    wallet: !!wallet, 
    hasAdapter: !!wallet?.adapter, 
    contractAddress, 
    functionName, 
    parameters, 
    chainId 
  });
  
  try {
    if (!wallet || !wallet.adapter) {
      console.error("❌ [createTronTransaction] Wallet validation failed:", {
        hasWallet: !!wallet,
        hasAdapter: !!wallet?.adapter
      });
      throw new Error("Tron wallet not available");
    }

    const network = getTronNetwork(chainId);
    console.log("🌐 [createTronTransaction] Network config:", network);
    
    if (!network) {
      console.error("❌ [createTronTransaction] Invalid Tron network for chainId:", chainId);
      throw new Error("Invalid Tron network");
    }

    // Encode function call
    console.log("🔍 [createTronTransaction] Searching for function in TRC20_ABI:", functionName);
    const abiFunction = TRC20_ABI.find(item => 
      item.type === "function" && item.name === functionName
    );
    
    console.log("📋 [createTronTransaction] Found ABI function:", abiFunction);
    
    if (!abiFunction) {
      console.error("❌ [createTronTransaction] Function not found in ABI:", functionName);
      throw new Error(`Function ${functionName} not found in ABI`);
    }

    console.log("🔧 [createTronTransaction] Encoding function call...");
    const encodedData = encodeTronFunctionCall(abiFunction, parameters);
    console.log("🔧 [createTronTransaction] Encoded data:", encodedData);

    // Create transaction
    const transaction = {
      contract_address: contractAddress,
      function_selector: functionName,
      parameter: encodedData,
      owner_address: wallet.adapter.address,
      fee_limit: 1000000000,
      call_value: 0
    };
    
    console.log("📝 [createTronTransaction] Transaction object:", transaction);

    console.log("✍️ [createTronTransaction] Signing transaction with wallet...");
    // Sign transaction with wallet
    const signedTx = await wallet.adapter.signTransaction(transaction);
    console.log("✍️ [createTronTransaction] Signed transaction:", signedTx);
    
    // Broadcast transaction
    const apiUrl = `${network.rpcUrl}/wallet/broadcasttransaction`;
    console.log("📡 [createTronTransaction] Broadcasting transaction to:", apiUrl);
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(signedTx)
    });

    console.log("📥 [createTronTransaction] Broadcast response status:", response.status);
    
    if (!response.ok) {
      console.error("❌ [createTronTransaction] Broadcast failed:", response.status, response.statusText);
      throw new Error("Failed to broadcast transaction");
    }

    const result = await response.json();
    console.log("📊 [createTronTransaction] Broadcast result:", result);
    console.log("✅ [createTronTransaction] Transaction created successfully");
    
    return result;
  } catch (error) {
    console.error("❌ [createTronTransaction] Error:", error);
    throw error;
  }
};

/**
 * Sign message with Tron wallet
 */
export const signTronMessage = async (
  wallet: any,
  message: string,
  chainId: number
): Promise<TronSignature> => {
  console.log("🔍 [signTronMessage] Starting...", { 
    wallet: !!wallet, 
    hasAdapter: !!wallet?.adapter, 
    messageLength: message.length, 
    chainId 
  });
  
  try {
    if (!wallet || !wallet.adapter) {
      console.error("❌ [signTronMessage] Wallet validation failed:", {
        hasWallet: !!wallet,
        hasAdapter: !!wallet?.adapter
      });
      throw new Error("Tron wallet not available");
    }

    console.log("✍️ [signTronMessage] Signing message with Tron wallet...");
    console.log("📝 [signTronMessage] Message to sign:", message);
    
    // Sign the message using Tron wallet
    const signature = await wallet.adapter.signMessage(message);
    console.log("✍️ [signTronMessage] Signature received:", signature);
    
    const result = {
      signature: signature,
      messageHash: message, // Tron doesn't use the same message hashing as EVM
    };
    
    console.log("✅ [signTronMessage] Final result:", result);
    return result;
  } catch (error) {
    console.error("❌ [signTronMessage] Error:", error);
    throw error;
  }
};

/**
 * Get Tron transaction info
 */
export const getTronTransactionInfo = async (txid: string, chainId: number): Promise<any> => {
  try {
    const network = getTronNetwork(chainId);
    if (!network) throw new Error("Invalid Tron network");

    const response = await fetch(`${network.rpcUrl}/wallet/gettransactioninfobyid`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ value: txid })
    });

    if (!response.ok) throw new Error("Failed to get transaction info");

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to get Tron transaction info:", error);
    throw error;
  }
};

/**
 * Get Tron block info
 */
export const getTronBlockInfo = async (blockNumber: number, chainId: number): Promise<any> => {
  try {
    const network = getTronNetwork(chainId);
    if (!network) throw new Error("Invalid Tron network");

    const response = await fetch(`${network.rpcUrl}/wallet/getblockbynum`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ num: blockNumber })
    });

    if (!response.ok) throw new Error("Failed to get block info");

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to get Tron block info:", error);
    throw error;
  }
}; 