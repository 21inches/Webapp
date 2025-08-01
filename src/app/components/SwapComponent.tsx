"use client";

import { Address, AmountMode, TakerTraits } from "@1inch/cross-chain-sdk";
import { ArrowsUpDownIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { formatUnits, hashTypedData, parseUnits } from "viem";
import {
  useAccount,
  useBalance,
  useReadContract,
  useSignTypedData,
  useSwitchChain,
  useWriteContract
} from "wagmi";
import { baseSepolia, sepolia } from "wagmi/chains";
import { ChainConfigs } from "../constants/contracts";
import { createOrder } from "../logic/swap";

// Mock token data - replace with actual token lists
const TOKENS: Record<number, Token[]> = {
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
const LOP_ADDRESSES: Record<number, string> = {
  [sepolia.id]: "0x32a209c3736c5bd52e395eabc86b9bca4f602985", // Replace with actual LOP address for Sepolia
  [baseSepolia.id]: "0xe30f9abbadc1eb84b41d41035b2a2c7d0bd5f9b2", // Replace with actual LOP address for Base Sepolia
};

const CHAINS = [
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
];

interface Token {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logo: string;
}

interface SwapState {
  fromChain: number;
  toChain: number;
  fromToken: Token;
  toToken: Token;
  fromAmount: string;
  toAmount: string;
}

export default function SwapComponent() {
  const { address, isConnected } = useAccount();
  const {  signTypedDataAsync } = useSignTypedData();
  const { switchChain } = useSwitchChain();
  const { writeContract } = useWriteContract();

  const [swapState, setSwapState] = useState<SwapState>({
    fromChain: sepolia.id,
    toChain: baseSepolia.id,
    fromToken: TOKENS[sepolia.id][0],
    toToken: TOKENS[baseSepolia.id][0],
    fromAmount: "",
    toAmount: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [showFromTokenList, setShowFromTokenList] = useState(false);
  const [showToTokenList, setShowToTokenList] = useState(false);
  const [showFromChainList, setShowFromChainList] = useState(false);
  const [showToChainList, setShowToChainList] = useState(false);

  const { data: fromTokenBalance } = useBalance({
    address,
    token:
      swapState.fromToken.address === "0x"
        ? undefined
        : (swapState.fromToken.address as `0x${string}`),
    chainId: swapState.fromChain,
  });

  // Check current allowance for the from token
  const { data: currentAllowance } = useReadContract({
    address: swapState.fromToken.address as `0x${string}`,
    abi: [
      {
        inputs: [
          { name: "owner", type: "address" },
          { name: "spender", type: "address" },
        ],
        name: "allowance",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
    ],
    functionName: "allowance",
    args: [
      address as `0x${string}`,
      LOP_ADDRESSES[swapState.fromChain] as `0x${string}`,
    ],
    chainId: swapState.fromChain,
    query: {
      enabled:
        !!address &&
        swapState.fromToken.address !== "0x" &&
        !!LOP_ADDRESSES[swapState.fromChain],
    },
  });

  // Calculate if approval is needed
  const needsApproval = () => {
    if (!swapState.fromAmount || swapState.fromToken.address === "0x")
      return false;
    if (!currentAllowance) return true;

    try {
      const amountToSwap = parseUnits(
        swapState.fromAmount,
        swapState.fromToken.decimals
      );
      return currentAllowance < amountToSwap;
    } catch {
      return false;
    }
  };

  const handleApprove = async () => {
    if (!address || swapState.fromToken.address === "0x") return;

    setIsApproving(true);
    try {
      // Switch to the correct chain first and wait for confirmation
      await switchChain({ chainId: swapState.fromChain });

      // Add a small delay to ensure the chain switch is complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Approve the exact amount the user wants to swap
      const amountToApprove = parseUnits(
        swapState.fromAmount || "0",
        swapState.fromToken.decimals
      );

      await writeContract({
        address: swapState.fromToken.address as `0x${string}`,
        abi: [
          {
            inputs: [
              { name: "spender", type: "address" },
              { name: "amount", type: "uint256" },
            ],
            name: "approve",
            outputs: [{ name: "", type: "bool" }],
            stateMutability: "nonpayable",
            type: "function",
          },
        ],
        functionName: "approve",
        args: [
          LOP_ADDRESSES[swapState.fromChain] as `0x${string}`,
          amountToApprove, // Approve only the exact amount needed
        ],
        chainId: swapState.fromChain, // Explicitly specify the chain ID
      });
    } catch (error) {
      console.error("Approval failed:", error);
    } finally {
      setIsApproving(false);
    }
  };

  // Mock price calculation - replace with actual pricing API
  useEffect(() => {
    if (swapState.fromAmount && !isNaN(Number(swapState.fromAmount))) {
      // Simple 1:1 conversion for demo - replace with actual rates
      setSwapState(prev => ({
        ...prev,
        toAmount: prev.fromAmount,
      }));
    }
  }, [swapState.fromAmount]);

  const handleSwapDirection = () => {
    setSwapState(prev => ({
      ...prev,
      fromChain: prev.toChain,
      toChain: prev.fromChain,
      fromToken: TOKENS[prev.toChain][0],
      toToken: TOKENS[prev.fromChain][0],
      fromAmount: prev.toAmount,
      toAmount: prev.fromAmount,
    }));
  };

  const handleSwap = async () => {
    if (!isConnected) return;

    setIsLoading(true);
    try {
      // Switch to source chain if needed and wait for confirmation
      await switchChain({ chainId: swapState.fromChain });
      console.log("Switched to source chain");
      // Add a small delay to ensure the chain switch is complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      const secret =
        "0x0000000000000000000000000000000000000000000000000000000000000000";
      const order = await createOrder(
        address!,
        swapState.fromAmount,
        swapState.toAmount,
        swapState.fromToken.address,
        swapState.toToken.address,
        secret,
        swapState.fromChain,
        swapState.toChain
      );

      console.log("Data:", order);
      const signature = await signTypedDataAsync(order.orderdata);

      console.log("Order:", order.order);
      let res: Response;
      let resultBody: Record<string, unknown>;
      // Send order and signature to API
      try {
        const immutables = order.order.toSrcImmutables(
          swapState.fromChain,
          new Address(ChainConfigs[swapState.fromChain].ResolverContractAddress),
          order.order.makingAmount,
          order.order.escrowExtension.hashLockInfo
        ).build()
        const hashLock = order.order.escrowExtension.hashLockInfo
        const orderHash = hashTypedData(order.orderdata as { domain: Record<string, unknown>; types: Record<string, unknown>; primaryType: string; message: Record<string, unknown> })
        const orderBuild = order.order.build()
        const takerTraits = TakerTraits.default()
          .setExtension(order.order.extension)
          .setAmountMode(AmountMode.maker)
          .setAmountThreshold(order.order.takingAmount).encode()
        const srcSafetyDeposit = BigInt(order.order.escrowExtension.srcSafetyDeposit)
        res = await fetch("/api/order", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(
            {
              order: order.order,
              swapState: swapState,
              signature: signature,
              immutables: immutables,
              hashLock: hashLock,
              orderHash: orderHash,
              orderBuild: orderBuild,
              takerTraits: takerTraits,
              srcSafetyDeposit: srcSafetyDeposit
            },
            (key, value) => (typeof value === "bigint" ? value.toString() : value)
          ),
        });

        if (!res.ok) {
          throw new Error(`API call failed: ${res.status}`);
        }

        const responseText = await res.text();
        console.log("Raw response text:", responseText);
        
        resultBody = JSON.parse(responseText) as Record<string, unknown>;
        console.log("API response:", resultBody);
        console.log("Result srcEscrowEvents", resultBody.srcEscrowEvent);
        console.log("Result dstDeployedAt", resultBody.dstDeployedAt);
        console.log("Result keys:", Object.keys(resultBody));
        console.log("Result type:", typeof resultBody);
        
        // Ensure resultBody is an object, not a string
        const responseData = typeof resultBody === 'string' ? JSON.parse(resultBody) : resultBody;
        console.log("Parsed response data:", responseData);
        
        await fetch("/api/order/secret-reveal", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(
            {
              order: order.order,
              swapState: swapState,
              signature: signature,
              secret: secret,
              srcEscrowEvent: responseData.srcEscrowEvent,
              dstDeployedAt: responseData.dstDeployedAt,
              dstImmutablesData: responseData.dstImmutablesData,
              dstImmutablesHash: responseData.dstImmutablesHash,
              srcImmutablesHash: responseData.srcImmutablesHash,
              srcImmutablesData: responseData.srcImmutablesData
            },
            (key, value) => (typeof value === "bigint" ? value.toString() : value)
          ),
        });
      } catch (apiError) {
        console.error("API call failed:", apiError);
        throw apiError;
      }
      console.log("Swap initiated:", swapState);
    } catch (error) {
      console.error("Swap failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatBalance = (
    balance: { value: bigint; decimals: number } | undefined
  ) => {
    if (!balance) return "0.00";
    return Number(formatUnits(balance.value, balance.decimals)).toFixed(4);
  };

  const formatAllowance = (allowance: bigint | undefined, decimals: number) => {
    console.log(allowance);
    if (!allowance) return "0.00";
    return Number(formatUnits(allowance, decimals)).toFixed(4);
  };

  return (
    <div className="w-md mx-auto bg-white dyesark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Exchange Assets
        </h2>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Connected
          </span>
        </div>
      </div>

      {/* From Section */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            From
          </label>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Balance: {formatBalance(fromTokenBalance)}
          </span>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
          <div className="flex justify-between items-center mb-3">
            {/* Chain Selector */}
            <div className="relative">
              <button
                onClick={() => setShowFromChainList(!showFromChainList)}
                className="flex items-center space-x-2 bg-white dark:bg-gray-600 rounded-lg px-3 py-2 border border-gray-300 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
              >
                <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                <span className="text-sm font-medium">
                  {CHAINS.find(c => c.id === swapState.fromChain)?.name}
                </span>
                <ChevronDownIcon className="w-4 h-4" />
              </button>

              {showFromChainList && (
                <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10 min-w-full">
                  {CHAINS.map(chain => (
                    <button
                      key={chain.id}
                      onClick={() => {
                        setSwapState(prev => ({
                          ...prev,
                          fromChain: chain.id,
                          fromToken: TOKENS[chain.id][0],
                        }));
                        setShowFromChainList(false);
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    >
                      <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                      <span className="text-sm">{chain.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Token Selector */}
            <div className="relative">
              <button
                onClick={() => setShowFromTokenList(!showFromTokenList)}
                className="flex items-center space-x-2 bg-white dark:bg-gray-600 rounded-lg px-3 py-2 border border-gray-300 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
              >
                <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                <span className="text-sm font-medium">
                  {swapState.fromToken.symbol}
                </span>
                <ChevronDownIcon className="w-4 h-4" />
              </button>

              {showFromTokenList && (
                <div className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10 min-w-full">
                  {TOKENS[swapState.fromChain]?.map(token => (
                    <button
                      key={token.address}
                      onClick={() => {
                        setSwapState(prev => ({ ...prev, fromToken: token }));
                        setShowFromTokenList(false);
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    >
                      <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                      <div className="text-left">
                        <div className="text-sm font-medium">
                          {token.symbol}
                        </div>
                        <div className="text-xs text-gray-500">
                          {token.name}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <input
            type="number"
            value={swapState.fromAmount}
            onChange={e =>
              setSwapState(prev => ({ ...prev, fromAmount: e.target.value }))
            }
            placeholder="0.0"
            className="w-full text-2xl font-semibold bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400"
          />
        </div>
      </div>

      {/* Swap Direction Button */}
      <div className="flex justify-center my-4">
        <button
          onClick={handleSwapDirection}
          className="p-2 bg-blue-500 hover:bg-blue-600 rounded-full text-white transition-colors"
        >
          <ArrowsUpDownIcon className="w-5 h-5" />
        </button>
      </div>

      {/* To Section */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            To
          </label>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Estimated
          </span>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
          <div className="flex justify-between items-center mb-3">
            {/* Chain Selector */}
            <div className="relative">
              <button
                onClick={() => setShowToChainList(!showToChainList)}
                className="flex items-center space-x-2 bg-white dark:bg-gray-600 rounded-lg px-3 py-2 border border-gray-300 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
              >
                <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                <span className="text-sm font-medium">
                  {CHAINS.find(c => c.id === swapState.toChain)?.name}
                </span>
                <ChevronDownIcon className="w-4 h-4" />
              </button>

              {showToChainList && (
                <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10 min-w-full">
                  {CHAINS.filter(c => c.id !== swapState.fromChain).map(
                    chain => (
                      <button
                        key={chain.id}
                        onClick={() => {
                          setSwapState(prev => ({
                            ...prev,
                            toChain: chain.id,
                            toToken: TOKENS[chain.id][0],
                          }));
                          setShowToChainList(false);
                        }}
                        className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                      >
                        <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                        <span className="text-sm">{chain.name}</span>
                      </button>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Token Selector */}
            <div className="relative">
              <button
                onClick={() => setShowToTokenList(!showToTokenList)}
                className="flex items-center space-x-2 bg-white dark:bg-gray-600 rounded-lg px-3 py-2 border border-gray-300 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
              >
                <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                <span className="text-sm font-medium">
                  {swapState.toToken.symbol}
                </span>
                <ChevronDownIcon className="w-4 h-4" />
              </button>

              {showToTokenList && (
                <div className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10 min-w-full">
                  {TOKENS[swapState.toChain]?.map(token => (
                    <button
                      key={token.address}
                      onClick={() => {
                        setSwapState(prev => ({ ...prev, toToken: token }));
                        setShowToTokenList(false);
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    >
                      <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                      <div className="text-left">
                        <div className="text-sm font-medium">
                          {token.symbol}
                        </div>
                        <div className="text-xs text-gray-500">
                          {token.name}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="text-2xl font-semibold text-gray-900 dark:text-white">
            {swapState.toAmount || "0.0"}
          </div>
        </div>
      </div>

      {/* Exchange Info */}
      <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex justify-between text-sm">
          <span className="text-blue-700 dark:text-blue-300">Exchange Fee:</span>
          <span className="text-blue-700 dark:text-blue-300">~0.001 ETH</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-blue-700 dark:text-blue-300">
            Estimated Time:
          </span>
          <span className="text-blue-700 dark:text-blue-300">3-5 minutes</span>
        </div>
        {swapState.fromToken.address !== "0x" && (
          <div className="flex justify-between text-sm mt-1">
            <span className="text-blue-700 dark:text-blue-300">
              Current Allowance:
            </span>
            <span className="text-blue-700 dark:text-blue-300">
              {formatAllowance(currentAllowance, swapState.fromToken.decimals)}{" "}
              {swapState.fromToken.symbol}
            </span>
          </div>
        )}
      </div>

      {/* Approval Section */}
      {needsApproval() && isConnected && (
        <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-700 dark:text-orange-300">
                Approval Required
              </p>
              <p className="text-xs text-orange-600 dark:text-orange-400">
                Allow LOP contract to transfer your {swapState.fromToken.symbol}{" "}
                tokens
              </p>
            </div>
            <button
              onClick={handleApprove}
              disabled={isApproving}
              className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
            >
              {isApproving ? "Approving..." : "Approve"}
            </button>
          </div>
        </div>
      )}

      {/* Exchange Button */}
      <button
        onClick={handleSwap}
        disabled={
          !isConnected || !swapState.fromAmount || isLoading || needsApproval()
        }
        className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-colors"
      >
        {!isConnected
          ? "Connect Wallet"
          : needsApproval()
            ? "Approval Required First"
            : isLoading
              ? "Exchanging..."
              : "Exchange Assets"}
      </button>

      {/* Transaction Status */}
      {isLoading && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-yellow-700 dark:text-yellow-300">
              Processing exchange transaction...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
