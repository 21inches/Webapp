"use client";

import { ArrowPathIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { formatUnits } from 'viem';
import { useAccount } from 'wagmi';

interface OrderDetails {
  id: string;
  order: unknown;
  secret: string;
  swapState: unknown;
  signature: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  fromChain: number;
  toChain: number;
  fromToken: unknown;
  toToken: unknown;
  fromAmount: string;
  toAmount: string;
  orderHash: string;
  completedAt?: string;
  failedAt?: string;
  txHash?: string;
  error?: string;
}

const CHAINS = [
  { id: 11155111, name: "Sepolia" },
  { id: 84532, name: "Base Sepolia" },
];

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800'
};

export default function OpenOrders() {
  const { address, isConnected } = useAccount();
  const [orders, setOrders] = useState<OrderDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isConnected && address) {
      loadOrders();
    }
  }, [isConnected, address]);

  const loadOrders = () => {
    try {
      const storedOrders = localStorage.getItem('crossChainOrders');
      if (storedOrders) {
        const parsedOrders = JSON.parse(storedOrders);
        // Filter orders for current user (you might want to add user address to orders)
        setOrders(parsedOrders);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const formatAmount = (amount: string, decimals: number = 18) => {
    try {
      return Number(formatUnits(BigInt(amount), decimals)).toFixed(4);
    } catch {
      return amount;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getChainName = (chainId: number) => {
    return CHAINS.find(chain => chain.id === chainId)?.name || `Chain ${chainId}`;
  };

  const getStatusBadge = (status: string) => {
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const handleRefresh = () => {
    setIsLoading(true);
    loadOrders();
    setTimeout(() => setIsLoading(false), 1000);
  };

  const handleClearCompleted = () => {
    const filteredOrders = orders.filter(order => order.status !== 'completed');
    localStorage.setItem('crossChainOrders', JSON.stringify(filteredOrders));
    setOrders(filteredOrders);
  };

  if (!isConnected) {
    return (
      <div className="w-full max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Open Orders
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please connect your wallet to view your orders
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Open Orders
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="group relative px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            title="Refresh orders from local storage"
          >
            <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="sr-only">Refresh</span>
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              Refresh orders from local storage
            </div>
          </button>
          <button
            onClick={handleClearCompleted}
            className="group relative px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            title="Remove all completed orders from the list"
          >
            <TrashIcon className="w-4 h-4" />
            <span className="sr-only">Clear Completed</span>
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              Remove all completed orders from the list
            </div>
          </button>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-gray-600 dark:text-gray-400">
            No orders found. Create your first cross-chain order!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-3">
                  {getStatusBadge(order.status)}
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(order.createdAt)}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Order ID: {order.id}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Hash: {order.orderHash.slice(0, 10)}...{order.orderHash.slice(-8)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1 text-sm">From</h4>
                  <div className="bg-white dark:bg-gray-600 rounded p-2">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {getChainName(order.fromChain)}
                    </p>
                    <p className="font-medium text-sm">
                      {formatAmount(order.fromAmount)} {(order.fromToken as { symbol: string }).symbol}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1 text-sm">To</h4>
                  <div className="bg-white dark:bg-gray-600 rounded p-2">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {getChainName(order.toChain)}
                    </p>
                    <p className="font-medium text-sm">
                      {formatAmount(order.toAmount)} {(order.toToken as { symbol: string }).symbol}
                    </p>
                  </div>
                </div>
              </div>

              {order.status === 'completed' && order.txHash && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded p-2 mb-2">
                  <p className="text-xs text-green-800 dark:text-green-200">
                    <strong>Completed:</strong> {formatDate(order.completedAt!)}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-300">
                    TX: {order.txHash.slice(0, 10)}...{order.txHash.slice(-8)}
                  </p>
                </div>
              )}

              {order.status === 'failed' && order.error && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded p-2 mb-2">
                  <p className="text-xs text-red-800 dark:text-red-200">
                    <strong>Failed:</strong> {formatDate(order.failedAt!)}
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-300">
                    Error: {order.error}
                  </p>
                </div>
              )}

              <div className="text-xs text-gray-500 dark:text-gray-400">
                <p>Secret: {order.secret.slice(0, 10)}...{order.secret.slice(-8)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 