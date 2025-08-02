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
  [sepolia.id]: "0x32a209c3736c5bd52e395eabc86b9bca4f602985",
  [baseSepolia.id]: "0xe30f9abbadc1eb84b41d41035b2a2c7d0bd5f9b2",
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
  const { signTypedDataAsync } = useSignTypedData();
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

  // Get balances and allowances
  const { data: fromTokenBalance } = useBalance({
    address,
    token: swapState.fromToken.address as `0x${string}`,
    chainId: swapState.fromChain,
  });

  const { data: toTokenBalance } = useBalance({
    address,
    token: swapState.toToken.address as `0x${string}`,
    chainId: swapState.toChain,
  });

  const { data: allowance } = useReadContract({
    address: swapState.fromToken.address as `0x${string}`,
    abi: [
      {
        constant: true,
        inputs: [
          { name: "_owner", type: "address" },
          { name: "_spender", type: "address" },
        ],
        name: "allowance",
        outputs: [{ name: "", type: "uint256" }],
        type: "function",
      },
    ],
    functionName: "allowance",
    args: [address!, LOP_ADDRESSES[swapState.fromChain] as `0x${string}`],
    chainId: swapState.fromChain,
  });

  const needsApproval = () => {
    if (!fromTokenBalance || !allowance) return false;
    const requiredAmount = parseUnits(swapState.fromAmount, swapState.fromToken.decimals);
    return (allowance as bigint) < requiredAmount;
  };

  const handleApprove = async () => {
    if (!address) return;

    setIsApproving(true);
    try {
      console.log("🔐 Approving token spend...");
      const requiredAmount = parseUnits(swapState.fromAmount, swapState.fromToken.decimals);
      
      await writeContract({
        address: swapState.fromToken.address as `0x${string}`,
        abi: [
          {
            constant: false,
            inputs: [
              { name: "_spender", type: "address" },
              { name: "_value", type: "uint256" },
            ],
            name: "approve",
            outputs: [{ name: "", type: "bool" }],
            type: "function",
          },
        ],
        functionName: "approve",
        args: [LOP_ADDRESSES[swapState.fromChain] as `0x${string}`, requiredAmount],
        chainId: swapState.fromChain,
      });
      console.log("✅ Token approval successful");
    } catch (error) {
      console.error("❌ Token approval failed:", error);
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
      fromToken: prev.toToken,
      toToken: prev.fromToken,
      fromAmount: prev.toAmount,
      toAmount: prev.fromAmount,
    }));
  };

  const handleSwap = async () => {
    if (!isConnected) return;

    setIsLoading(true);
    try {
      console.log("🔄 Switching to source chain...");
      await switchChain({ chainId: swapState.fromChain });
      console.log("Switched to source chain");
      // Add a small delay to ensure the chain switch is complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      const secret =
        "0x0000000000000000000000000000000000000000000000000000000000000000";
      console.log("✅ Switched to source chain successfully");
      
      console.log("📝 Creating order data...");
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
      
      console.log("🔐 Signing order data...");
      const signature = await signTypedDataAsync(order.orderdata);
      
      console.log("📦 Preparing order for submission...");
      const orderBuild = order.order.build();
      const hashLock = order.order.escrowExtension.hashLockInfo;
      const orderHash = hashTypedData(order.orderdata as { domain: Record<string, unknown>; types: Record<string, unknown>; primaryType: string; message: Record<string, unknown> });
      const takerTraits = TakerTraits.default()
      .setExtension(order.order.extension)
          .setAmountMode(AmountMode.maker)
          .setAmountThreshold(order.order.takingAmount).encode()
      const immutables = order.order.toSrcImmutables(
        swapState.fromChain,
        new Address(ChainConfigs[swapState.fromChain].ResolverContractAddress),
        order.order.makingAmount,
        order.order.escrowExtension.hashLockInfo
      ).build();
      const srcSafetyDeposit = BigInt(order.order.escrowExtension.srcSafetyDeposit);
      
      console.log("🚀 Submitting order to exchange...");
      const response = await fetch("/api/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order: order.order,
          swapState: swapState,
          signature: signature,
          immutables: immutables,
          hashLock: hashLock,
          orderHash: orderHash,
          orderBuild: orderBuild,
          takerTraits: takerTraits,
          srcSafetyDeposit: srcSafetyDeposit
        },(key, value) => (typeof value === "bigint" ? value.toString() : value)
        ),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const resultBody = await response.json();
      
      console.log("✅ Exchange initiated successfully!");
      console.log("📊 Transaction details:", {
        orderFill: resultBody.transactions?.orderFill?.txLink,
        dstEscrowDeploy: resultBody.transactions?.dstEscrowDeploy?.txLink,
        status: resultBody.status
      });
      
      const responseData = {
        srcEscrowEvent: resultBody.srcEscrowEvent,
        dstDeployedAt: resultBody.dstDeployedAt,
        dstImmutablesData: resultBody.dstImmutablesData,
        dstImmutablesHash: resultBody.dstImmutablesHash,
        srcImmutablesHash: resultBody.srcImmutablesHash,
        srcImmutablesData: resultBody.srcImmutablesData,
        transactions: resultBody.transactions,
        status: resultBody.status,
        message: resultBody.message
      };

      console.log("⏳ Initiating secret revelation phase...");
      const secretRevealResponse = await fetch("/api/order/secret-reveal", {
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

      if (!secretRevealResponse.ok) {
        throw new Error(`Secret reveal failed: ${secretRevealResponse.status}`);
      }

      const secretRevealResult = await secretRevealResponse.json();
      console.log("✅ Secret revelation completed!");
      console.log("📊 Withdrawal transaction details:", {
        dstWithdraw: secretRevealResult.transactions?.dstWithdraw?.txLink,
        srcWithdraw: secretRevealResult.transactions?.srcWithdraw?.txLink,
        status: secretRevealResult.status,
        message: secretRevealResult.message
      });
      
      console.log("✅ Cross-chain exchange process completed!");
    } catch (error) {
      console.error("❌ Exchange failed:", error);
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

  return (
    <div className="w-md mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
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
                  {TOKENS[swapState.fromChain].map(token => (
                    <button
                      key={token.address}
                      onClick={() => {
                        setSwapState(prev => ({
                          ...prev,
                          fromToken: token,
                        }));
                        setShowFromTokenList(false);
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    >
                      <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                      <span className="text-sm">{token.symbol}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <input
            type="number"
            placeholder="0.0"
            value={swapState.fromAmount}
            onChange={(e) => setSwapState(prev => ({ ...prev, fromAmount: e.target.value }))}
            className="w-full bg-transparent text-2xl font-bold text-gray-900 dark:text-white outline-none"
          />
        </div>
      </div>

      {/* Swap Direction Button */}
      <div className="flex justify-center mb-4">
        <button
          onClick={handleSwapDirection}
          className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <ArrowsUpDownIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* To Section */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            To
          </label>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Balance: {formatBalance(toTokenBalance)}
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
                  {CHAINS.map(chain => (
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
                  ))}
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
                  {TOKENS[swapState.toChain].map(token => (
                    <button
                      key={token.address}
                      onClick={() => {
                        setSwapState(prev => ({
                          ...prev,
                          toToken: token,
                        }));
                        setShowToTokenList(false);
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    >
                      <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                      <span className="text-sm">{token.symbol}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <input
            type="number"
            placeholder="0.0"
            value={swapState.toAmount}
            onChange={(e) => setSwapState(prev => ({ ...prev, toAmount: e.target.value }))}
            className="w-full bg-transparent text-2xl font-bold text-gray-900 dark:text-white outline-none"
          />
        </div>
      </div>

      {/* Exchange Fee */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Exchange Fee</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">0.001 ETH</span>
        </div>
      </div>

      {/* Action Button */}
      {needsApproval() ? (
        <button
          onClick={handleApprove}
          disabled={isApproving}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
        >
          {isApproving ? "Approving..." : "Approve"}
        </button>
      ) : (
        <button
          onClick={handleSwap}
          disabled={isLoading || !swapState.fromAmount || !swapState.toAmount}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
        >
          {isLoading ? "Exchanging..." : "Exchange Assets"}
        </button>
      )}
    </div>
  );
}
