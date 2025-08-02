"use client";

import { ArrowPathIcon, CheckCircleIcon, ClockIcon, TrashIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

interface OrderDetails {
  id: string;
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
  error?: string;
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

  // Auto-refresh orders every 5 seconds
  useEffect(() => {
    loadOrders();
    
    const interval = setInterval(() => {
      loadOrders();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Listen for storage changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "orders") {
        loadOrders();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
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
            <ClockIcon className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircleIcon className="w-3 h-3 mr-1" />
            Completed
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            <XCircleIcon className="w-3 h-3 mr-1" />
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800";
      case "completed":
        return "border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800";
      case "failed":
        return "border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800";
      default:
        return "border-gray-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-600";
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
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <ClockIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No orders found</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Start your first cross-chain exchange to see orders here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Open Orders
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {orders.length} order{orders.length !== 1 ? 's' : ''} • Auto-refreshing every 5 seconds
          </p>
        </div>
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
            className={`rounded-xl p-6 border-2 transition-all duration-200 hover:shadow-lg ${getStatusColor(order.status)}`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {getStatusBadge(order.status)}
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(order.createdAt)}
                </span>
              </div>
              {order.orderHash && (
                <span className="text-xs text-gray-400 dark:text-gray-500 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  {order.orderHash.slice(0, 8)}...{order.orderHash.slice(-6)}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  Exchange Details
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-600 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">From</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatAmount(
                          ((order.swapState as Record<string, unknown>)?.fromAmount as string) || "0",
                          ((order.fromToken as Record<string, unknown>)?.decimals as number) || 18
                        )}{" "}
                        {(order.fromToken as Record<string, unknown>)?.symbol as string}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {getChainName((order.swapState as Record<string, unknown>)?.fromChain as number)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <div className="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                      <ArrowPathIcon className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-600 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">To</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatAmount(
                          ((order.swapState as Record<string, unknown>)?.toAmount as string) || "0",
                          ((order.toToken as Record<string, unknown>)?.decimals as number) || 18
                        )}{" "}
                        {(order.toToken as Record<string, unknown>)?.symbol as string}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {getChainName((order.swapState as Record<string, unknown>)?.toChain as number)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {order.transactions && Object.keys(order.transactions).length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    Transaction Links
                  </h3>
                  <div className="space-y-2">
                    {order.transactions.orderFill && (
                      <a
                        href={order.transactions.orderFill.txLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 bg-white dark:bg-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
                      >
                        <span className="text-sm text-gray-600 dark:text-gray-400">Order Fill</span>
                        <span className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium">
                          View →
                        </span>
                      </a>
                    )}
                    {order.transactions.dstEscrowDeploy && (
                      <a
                        href={order.transactions.dstEscrowDeploy.txLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 bg-white dark:bg-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
                      >
                        <span className="text-sm text-gray-600 dark:text-gray-400">Escrow Deploy</span>
                        <span className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium">
                          View →
                        </span>
                      </a>
                    )}
                    {order.transactions.dstWithdraw && (
                      <a
                        href={order.transactions.dstWithdraw.txLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 bg-white dark:bg-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
                      >
                        <span className="text-sm text-gray-600 dark:text-gray-400">Withdrawal</span>
                        <span className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium">
                          View →
                        </span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {order.message && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300">{order.message}</p>
              </div>
            )}

            {order.error && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-300">
                  <strong>Error:</strong> {order.error}
                </p>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Order ID: {order.id}</span>
              <div className="flex space-x-4">
                {order.completedAt && (
                  <span>Completed: {formatDate(order.completedAt)}</span>
                )}
                {order.failedAt && (
                  <span>Failed: {formatDate(order.failedAt)}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 