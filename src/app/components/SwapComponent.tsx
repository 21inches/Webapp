"use client";

import { Address, AmountMode, TakerTraits } from "@1inch/cross-chain-sdk";
import { ArrowsUpDownIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { useWallet } from "@tronweb3/tronwallet-adapter-react-hooks";
import { useEffect, useState } from "react";
import { formatUnits, hashTypedData, parseUnits } from "viem";
import {
  useAccount,
  useBalance,
  useReadContract,
  useSignTypedData,
  useSwitchChain,
  useWriteContract,
} from "wagmi";
import { baseSepolia, sepolia } from "wagmi/chains";
import { ALL_CHAINS, getChainLogo, isTronChain } from "../constants/chains";
import { ChainConfigs } from "../constants/contracts";
import { LOP_ADDRESSES, TOKENS } from "../constants/tokens";
import { createOrder as createOrderLogic } from "../logic/swap";
import { type Order, type SwapState } from "../types/order";
import {
  approveTronToken,
  checkTronTokenAllowance,
  getTronTokenBalance
} from "../utils/tron";

export default function SwapComponent() {
  const { address, isConnected } = useAccount();
  const { switchChain } = useSwitchChain();
  const { writeContract } = useWriteContract();
  const { signTypedDataAsync } = useSignTypedData();
  
  // Tron wallet integration
  const { wallet, connected: tronConnected, connecting: tronConnecting } = useWallet();

  const [swapState, setSwapState] = useState<SwapState>({
    fromChain: sepolia.id,
    toChain: baseSepolia.id,
    fromToken: TOKENS[sepolia.id][0],
    toToken: TOKENS[baseSepolia.id][0],
    fromAmount: "",
    toAmount: "",
  });

  // Helper function to check if current wallet supports the chain
  const isWalletConnected = () => {
    if (isTronChain(swapState.fromChain) || isTronChain(swapState.toChain)) {
      return tronConnected;
    }
    return isConnected;
  };

  // Helper function to get current wallet address
  const getCurrentAddress = () => {
    if (isTronChain(swapState.fromChain) || isTronChain(swapState.toChain)) {
      return wallet?.adapter.address;
    }
    return address;
  };

  const [isLoading, setIsLoading] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [showFromTokenList, setShowFromTokenList] = useState(false);
  const [showToTokenList, setShowToTokenList] = useState(false);
  const [showFromChainList, setShowFromChainList] = useState(false);
  const [showToChainList, setShowToChainList] = useState(false);

  // State for Tron balances and allowances
  const [tronFromBalance, setTronFromBalance] = useState<string>("0");
  const [tronToBalance, setTronToBalance] = useState<string>("0");
  const [tronAllowance, setTronAllowance] = useState<string>("0");

  // Get balances and allowances (EVM chains use wagmi, Tron chains use custom logic)
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

  // Update Tron balances when wallet or chain changes
  useEffect(() => {
    const updateTronBalances = async () => {
      if (isTronChain(swapState.fromChain) && wallet && tronConnected && wallet.adapter.address) {
        console.log("🔍 Updating Tron from balance...", {
          fromChain: swapState.fromChain,
          tokenAddress: swapState.fromToken.address,
          walletAddress: wallet.adapter.address
        });
        const balance = await getTronTokenBalance(
          wallet,
          swapState.fromToken.address,
          wallet.adapter.address
        );
        console.log("💰 Tron from balance result:", balance, "Type:", typeof balance);
        setTronFromBalance(balance);
      }
      
      if (isTronChain(swapState.toChain) && wallet && tronConnected && wallet.adapter.address) {
        console.log("🔍 Updating Tron to balance...", {
          toChain: swapState.toChain,
          tokenAddress: swapState.toToken.address,
          walletAddress: wallet.adapter.address
        });
        const balance = await getTronTokenBalance(
          wallet,
          swapState.toToken.address,
          wallet.adapter.address
        );
        console.log("💰 Tron to balance result:", balance, "Type:", typeof balance);
        setTronToBalance(balance);
      }
    };

    updateTronBalances();
  }, [swapState.fromChain, swapState.toChain, swapState.fromToken, swapState.toToken, wallet, tronConnected]);

  // Update Tron allowance when wallet or chain changes
  useEffect(() => {
    const updateTronAllowance = async () => {
      if (isTronChain(swapState.fromChain) && wallet && tronConnected && wallet.adapter.address) {
        const allowance = await checkTronTokenAllowance(
          wallet,
          swapState.fromToken.address,
          wallet.adapter.address,
          LOP_ADDRESSES[swapState.fromChain]
        );
        setTronAllowance(allowance);
      }
    };

    updateTronAllowance();
  }, [swapState.fromChain, wallet, tronConnected]);

  const needsApproval = () => {
    if (!swapState.fromAmount || parseFloat(swapState.fromAmount) <= 0) return false;
    
    if (isTronChain(swapState.fromChain)) {
      // For Tron chains, check allowance using Tron wallet
      if (!tronConnected || !wallet) return false;
      
      const requiredAmount = parseFloat(swapState.fromAmount) * Math.pow(10, swapState.fromToken.decimals);
      const currentAllowance = parseFloat(tronAllowance);
      
      return currentAllowance < requiredAmount;
    } else {
      // For EVM chains, use wagmi allowance
      if (!fromTokenBalance || !allowance) return false;
      const requiredAmount = parseUnits(
        swapState.fromAmount,
        swapState.fromToken.decimals
      );
      return (allowance as bigint) < requiredAmount;
    }
  };

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      console.log("🔐 Approving token spend...");
      
      
      if (isTronChain(swapState.fromChain)) {
        // For Tron chains, use Tron wallet approval
        if (!tronConnected || !wallet) {
          throw new Error("Tron wallet not connected");
        }
        
        const requiredAmount = parseFloat(swapState.fromAmount) * Math.pow(10, swapState.fromToken.decimals);
        
        const txHash = await approveTronToken(
          wallet,
          swapState.fromToken.address,
          LOP_ADDRESSES[swapState.fromChain],
          requiredAmount.toString()
        );
        
        console.log("✅ Tron token approval successful:", txHash);
        
        // Update allowance after approval
        const newAllowance = await checkTronTokenAllowance(
          wallet,
          swapState.fromToken.address,
          wallet.adapter.address,
          LOP_ADDRESSES[swapState.fromChain]
        );
        setTronAllowance(newAllowance);
        
      } else {
        // For EVM chains, use wagmi approval
        if (!address) {
          throw new Error("EVM wallet not connected");
        }
        await switchChain({ chainId: swapState.fromChain });
        const requiredAmount = parseUnits(
          swapState.fromAmount,
          swapState.fromToken.decimals
        );

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
          args: [
            LOP_ADDRESSES[swapState.fromChain] as `0x${string}`,
            requiredAmount,
          ],
          chainId: swapState.fromChain as number,
        });
        console.log("✅ EVM token approval successful");
      }
    } catch (error) {
      console.error("❌ Token approval failed:", error);
      alert(`Approval failed: ${error instanceof Error ? error.message : "Unknown error"}`);
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
    if (!isWalletConnected()) {
      alert("Please connect your wallet first");
      return;
    }

    // Check if we have the right wallet connected for the from chain
    if (isTronChain(swapState.fromChain) && !tronConnected) {
      alert("Please connect your Tron wallet to perform this swap");
      setIsLoading(false);
      return;
    }
    
    if (!isTronChain(swapState.fromChain) && !isConnected) {
      alert("Please connect your EVM wallet to perform this swap");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Create order details for storage
    const orderId = Date.now().toString();
    const orderDetails: Order = {
      id: orderId,
      swapState: swapState,
      fromToken: swapState.fromToken,
      toToken: swapState.toToken,
      message: "Order created and signed",
      status: "CREATED",
      createdAt: Date.now(),
      transactions: {},
    };

    // Save order to localStorage immediately in CREATED state
    const existingOrders = JSON.parse(localStorage.getItem("orders") || "[]");
    existingOrders.push(orderDetails);
    localStorage.setItem("orders", JSON.stringify(existingOrders));
    console.log("💾 Order created and saved to localStorage with ID:", orderId);
    console.log("🆕 Order status: CREATED (order created and signed)");

    try {
      console.log("🔄 Switching to source chain...");
      
      // Handle chain switching based on wallet type
      if (isTronChain(swapState.fromChain)) {
        // For Tron chains, we need to ensure Tron wallet is connected
        if (!tronConnected) {
          throw new Error("Please connect your Tron wallet first");
        }
        console.log("Using Tron wallet for source chain");
      } else {
        // For EVM chains, use wagmi switchChain
        if (typeof swapState.fromChain === "number") {
          await switchChain({ chainId: swapState.fromChain });
          console.log("Switched to EVM source chain");
          // Add a small delay to ensure the chain switch is complete
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          throw new Error("Invalid chain ID for EVM network");
        }
      }
      
      const secret =
        "0x0000000000000000000000000000000000000000000000000000000000000000";
      console.log("✅ Switched to source chain successfully");

      console.log("📝 Creating order data...");
      const order = await createOrderLogic(
        getCurrentAddress()!,
        swapState.fromAmount,
        swapState.toAmount,
        swapState.fromToken.address,
        swapState.toToken.address,
        secret,
        swapState.fromChain,
        swapState.toChain,
        swapState.fromToken.decimals,
        swapState.toToken.decimals
      );

      console.log("🔐 Signing order data...");
      const signature = await signTypedDataAsync(order.orderdata);

      console.log("📦 Preparing order for submission...");
      const orderBuild = order.order.build();
      const hashLock = order.order.escrowExtension.hashLockInfo;
      const orderHash = hashTypedData(
        order.orderdata as {
          domain: Record<string, unknown>;
          types: Record<string, unknown>;
          primaryType: string;
          message: Record<string, unknown>;
        }
      );
      const takerTraits = TakerTraits.default()
        .setExtension(order.order.extension)
        .setAmountMode(AmountMode.maker)
        .setAmountThreshold(order.order.takingAmount)
        .encode();
      const immutables = order.order
        .toSrcImmutables(
          swapState.fromChain,
          new Address(
            ChainConfigs[swapState.fromChain].ResolverContractAddress
          ),
          order.order.makingAmount,
          order.order.escrowExtension.hashLockInfo
        )
        .build();
      const srcSafetyDeposit = BigInt(
        order.order.escrowExtension.srcSafetyDeposit
      );

      console.log("🚀 Submitting order to exchange...");

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 30 seconds timeout

      const response = await fetch("/api/order", {
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
            srcSafetyDeposit: srcSafetyDeposit,
          },
          (key, value) => (typeof value === "bigint" ? value.toString() : value)
        ),
        signal: controller.signal,
      });

      // Clear the timeout since the request completed
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const resultBody = await response.json();

      console.log("✅ Exchange initiated successfully!");
      console.log("📊 Transaction details:", {
        orderFill: resultBody.transactions?.orderFill?.txLink,
        dstEscrowDeploy: resultBody.transactions?.dstEscrowDeploy?.txLink,
        status: resultBody.status,
      });

      // Update order with initial transaction data
      orderDetails.transactions = resultBody.transactions || {};
      orderDetails.message = resultBody.message || "Exchange initiated";
      orderDetails.status = "PENDING_SECRET"; // Update to PENDING_SECRET after escrow deployment

      // Update existing order in localStorage
      const pendingSecretOrders = JSON.parse(
        localStorage.getItem("orders") || "[]"
      );
      const updatedOrders = pendingSecretOrders.map((o: Order) =>
        o.id === orderId
          ? {
              ...o,
              status: "PENDING_SECRET",
              transactions: resultBody.transactions || {},
              message:
                resultBody.message ||
                "Escrow contracts deployed on both chains. Waiting for secret revelation.",
            }
          : o
      );
      localStorage.setItem("orders", JSON.stringify(updatedOrders));
      console.log("💾 Order updated in localStorage with ID:", orderId);
      console.log(
        "🔄 Order status: PENDING_SECRET (waiting for secret revelation)"
      );

      const responseData = {
        srcEscrowEvent: resultBody.srcEscrowEvent,
        dstDeployedAt: resultBody.dstDeployedAt,
        dstImmutablesData: resultBody.dstImmutablesData,
        dstImmutablesHash: resultBody.dstImmutablesHash,
        srcImmutablesHash: resultBody.srcImmutablesHash,
        srcImmutablesData: resultBody.srcImmutablesData,
        transactions: resultBody.transactions,
        status: resultBody.status,
        message: resultBody.message,
      };

      console.log("⏳ Initiating secret revelation phase...");

      // Update order status to PENDING_WITHDRAW before secret revelation
      const currentOrders = JSON.parse(localStorage.getItem("orders") || "[]");
      const withdrawOrders = currentOrders.map((o: Order) =>
        o.id === orderId
          ? {
              ...o,
              status: "PENDING_WITHDRAW",
              message: "Secret revealed. Starting withdrawal process...",
            }
          : o
      );
      localStorage.setItem("orders", JSON.stringify(withdrawOrders));
      console.log(
        "🔄 Order status: PENDING_WITHDRAW (secret revealed, withdrawing)"
      );

      // Create AbortController for secret reveal timeout
      const secretRevealController = new AbortController();
      const secretRevealTimeoutId = setTimeout(
        () => secretRevealController.abort(),
        60000
      ); // 30 seconds timeout

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
            srcImmutablesData: responseData.srcImmutablesData,
          },
          (key, value) => (typeof value === "bigint" ? value.toString() : value)
        ),
        signal: secretRevealController.signal,
      });

      // Clear the timeout since the request completed
      clearTimeout(secretRevealTimeoutId);

      if (!secretRevealResponse.ok) {
        throw new Error(`Secret reveal failed: ${secretRevealResponse.status}`);
      }

      const secretRevealResult = await secretRevealResponse.json();
      console.log("✅ Secret revelation completed!");
      console.log("📊 Withdrawal transaction details:", {
        dstWithdraw: secretRevealResult.transactions?.dstWithdraw?.txLink,
        srcWithdraw: secretRevealResult.transactions?.srcWithdraw?.txLink,
        status: secretRevealResult.status,
        message: secretRevealResult.message,
      });

      // Update order status to completed
      const completedOrders = JSON.parse(
        localStorage.getItem("orders") || "[]"
      );
      const completedOrderIndex = completedOrders.findIndex(
        (o: Order) => o.id === orderId
      );
      if (completedOrderIndex !== -1) {
        completedOrders[completedOrderIndex].status = "COMPLETED";
        completedOrders[completedOrderIndex].completedAt = Date.now();
        completedOrders[completedOrderIndex].transactions = {
          ...completedOrders[completedOrderIndex].transactions,
          ...secretRevealResult.transactions,
        };
        completedOrders[completedOrderIndex].message =
          secretRevealResult.message;
        localStorage.setItem("orders", JSON.stringify(completedOrders));
        console.log("✅ Order status updated to completed");
      }

      console.log("✅ Cross-chain exchange process completed!");
    } catch (error) {
      console.error("❌ Exchange failed:", error);

      // Update order status to failed
      const failedOrders = JSON.parse(localStorage.getItem("orders") || "[]");
      const failedOrderIndex = failedOrders.findIndex(
        (o: Order) => o.id === orderId
      );
      if (failedOrderIndex !== -1) {
        failedOrders[failedOrderIndex].status = "FAILED";
        failedOrders[failedOrderIndex].failedAt = Date.now();
        failedOrders[failedOrderIndex].error =
          error instanceof Error ? error.message : "Unknown error";
        localStorage.setItem("orders", JSON.stringify(failedOrders));
        console.log("❌ Order status updated to failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatBalance = (
    balance: { value: bigint; decimals: number } | undefined,
    chainId?: number 
  ) => {
    if (!balance) return "0.00";
    // For Tron chains, we don't have balance data from wagmi
    if (chainId && isTronChain(chainId)) return "N/A";
    return Number(formatUnits(balance.value, balance.decimals)).toFixed(4);
  };

  // Format Tron balance for display
  const formatTronBalance = (balance: string, decimals: number = 6) => {
    if (!balance || balance === "0") {
      return "0.00";
    }
    
    // Handle different balance formats
    let balanceNum: number;
    
    // If balance is already a number or string number
    if (typeof balance === 'number') {
      balanceNum = balance;
    } else if (typeof balance === 'string') {
      // Remove any non-numeric characters except decimal point
      const cleanBalance = balance.replace(/[^0-9.]/g, '');
      balanceNum = parseFloat(cleanBalance);
    } else {
      // If it's an object (like BigNumber), try to convert to string first
      const balanceStr = balance.toString();
      balanceNum = parseFloat(balanceStr);
    }
    
    // Apply decimal conversion
    const adjustedBalance = balanceNum / Math.pow(10, decimals);
    const result = adjustedBalance.toFixed(4);
    
    return result;
  };

  return (
    <div className="w-md mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Exchange Assets
        </h2>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isWalletConnected() ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {isWalletConnected() ? 'Connected' : 'Disconnected'}
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
            Balance: {isTronChain(swapState.fromChain) 
              ? formatTronBalance(tronFromBalance, swapState.fromToken.decimals)
              : formatBalance(fromTokenBalance, swapState.fromChain)
            }
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
                <img
                  src={getChainLogo(swapState.fromChain)}
                  alt="Chain logo"
                  className="w-6 h-6 rounded-full"
                />
                <span className="text-sm font-medium">
                  {ALL_CHAINS.find(c => c.id === swapState.fromChain)?.name}
                </span>
                <ChevronDownIcon className="w-4 h-4" />
              </button>

              {showFromChainList && (
                <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10 min-w-full">
                  {ALL_CHAINS.map(chain => (
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
                      <img
                        src={getChainLogo(chain.id)}
                        alt={`${chain.name} logo`}
                        className="w-6 h-6 rounded-full"
                      />
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
                <img
                  src={swapState.fromToken.logo}
                  alt={`${swapState.fromToken.symbol} logo`}
                  className="w-6 h-6 rounded-full"
                />
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
                      <img
                        src={token.logo}
                        alt={`${token.symbol} logo`}
                        className="w-6 h-6 rounded-full"
                      />
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
            onChange={e =>
              setSwapState(prev => ({ ...prev, fromAmount: e.target.value }))
            }
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
            Balance: {isTronChain(swapState.toChain) 
              ? formatTronBalance(tronToBalance, swapState.toToken.decimals)
              : formatBalance(toTokenBalance, swapState.toChain)
            }
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
                <img
                  src={getChainLogo(swapState.toChain)}
                  alt="Chain logo"
                  className="w-6 h-6 rounded-full"
                />
                <span className="text-sm font-medium">
                  {ALL_CHAINS.find(c => c.id === swapState.toChain)?.name}
                </span>
                <ChevronDownIcon className="w-4 h-4" />
              </button>

              {showToChainList && (
                <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10 min-w-full">
                  {ALL_CHAINS.map(chain => (
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
                      <img
                        src={getChainLogo(chain.id)}
                        alt={`${chain.name} logo`}
                        className="w-6 h-6 rounded-full"
                      />
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
                <img
                  src={swapState.toToken.logo}
                  alt={`${swapState.toToken.symbol} logo`}
                  className="w-6 h-6 rounded-full"
                />
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
                      <img
                        src={token.logo}
                        alt={`${token.symbol} logo`}
                        className="w-6 h-6 rounded-full"
                      />
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
            onChange={e =>
              setSwapState(prev => ({ ...prev, toAmount: e.target.value }))
            }
            className="w-full bg-transparent text-2xl font-bold text-gray-900 dark:text-white outline-none"
          />
        </div>
      </div>

      {/* Exchange Fee */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Exchange Fee
          </span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            0.001 ETH
          </span>
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
