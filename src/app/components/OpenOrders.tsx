"use client";

import { ArrowPathIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

interface OrderDetails {
  id: string;
  order: unknown;
  secret: string;
  swapState: unknown;
  fromToken: unknown;
  toToken: unknown;
  status: string;
  createdAt: number;
  completedAt?: number;
  failedAt?: number;
  orderHash?: string;
  transactions?: {
    orderFill?: {
      txHash: string;
      txLink: string;
      description: string;
    };
    dstEscrowDeploy?: {
      txHash: string;
      txLink: string;
      description: string;
    };
    dstWithdraw?: {
      txHash: string;
      txLink: string;
      description: string;
    };
    srcWithdraw?: {
      txHash: string;
      txLink: string;
      description: string;
    };
  };
  message?: string;
}

export default function OpenOrders() {
  const [orders, setOrders] = useState<OrderDetails[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadOrders = () => {
    try {
      const storedOrders = localStorage.getItem("orders");
      if (storedOrders) {
        const parsedOrders = JSON.parse(storedOrders);
        setOrders(parsedOrders);
      }
    } catch (error) {
      console.error("Error loading orders:", error);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadOrders();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleClearCompleted = () => {
    const activeOrders = orders.filter(order => order.status !== "completed");
    localStorage.setItem("orders", JSON.stringify(activeOrders));
    setOrders(activeOrders);
  };

  const formatAmount = (amount: string, decimals: number) => {
    return Number(amount) / Math.pow(10, decimals);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getChainName = (chainId: number) => {
    switch (chainId) {
      case 11155111:
        return "Sepolia";
      case 84532:
        return "Base Sepolia";
      default:
        return `Chain ${chainId}`;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            Pending
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            Completed
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
            Unknown
          </span>
        );
    }
  };

  if (orders.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Open Orders
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              title="Refresh orders"
            >
              <ArrowPathIcon className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`} />
              <span className="sr-only">Refresh orders</span>
            </button>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No orders found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Open Orders
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            title="Refresh orders"
          >
            <ArrowPathIcon className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="sr-only">Refresh orders</span>
          </button>
          <button
            onClick={handleClearCompleted}
            className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
            title="Clear completed orders"
          >
            <TrashIcon className="w-5 h-5" />
            <span className="sr-only">Clear completed orders</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                {getStatusBadge(order.status)}
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(order.createdAt)}
                </span>
              </div>
              {order.orderHash && (
                <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                  {order.orderHash.slice(0, 8)}...{order.orderHash.slice(-6)}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Exchange Details
                </h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">From:</span>
                    <span className="text-gray-900 dark:text-white">
                      {formatAmount(
                        ((order.swapState as Record<string, unknown>)?.fromAmount as string) || "0",
                        ((order.fromToken as Record<string, unknown>)?.decimals as number) || 18
                      )}{" "}
                      {(order.fromToken as Record<string, unknown>)?.symbol as string} on{" "}
                      {getChainName((order.swapState as Record<string, unknown>)?.fromChain as number)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">To:</span>
                    <span className="text-gray-900 dark:text-white">
                      {formatAmount(
                        ((order.swapState as Record<string, unknown>)?.toAmount as string) || "0",
                        ((order.toToken as Record<string, unknown>)?.decimals as number) || 18
                      )}{" "}
                      {(order.toToken as Record<string, unknown>)?.symbol as string} on{" "}
                      {getChainName((order.swapState as Record<string, unknown>)?.toChain as number)}
                    </span>
                  </div>
                </div>
              </div>

              {order.transactions && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Transaction Links
                  </h3>
                  <div className="space-y-1 text-sm">
                    {order.transactions.orderFill && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 dark:text-gray-400">Order Fill:</span>
                        <a
                          href={order.transactions.orderFill.txLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                        >
                          View
                        </a>
                      </div>
                    )}
                    {order.transactions.dstEscrowDeploy && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 dark:text-gray-400">Escrow Deploy:</span>
                        <a
                          href={order.transactions.dstEscrowDeploy.txLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                        >
                          View
                        </a>
                      </div>
                    )}
                    {order.transactions.dstWithdraw && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 dark:text-gray-400">Withdrawal:</span>
                        <a
                          href={order.transactions.dstWithdraw.txLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                        >
                          View
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {order.message && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">{order.message}</p>
              </div>
            )}

            {order.completedAt && (
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Completed: {formatDate(order.completedAt)}
              </div>
            )}
            {order.failedAt && (
              <div className="mt-2 text-xs text-red-500 dark:text-red-400">
                Failed: {formatDate(order.failedAt)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 