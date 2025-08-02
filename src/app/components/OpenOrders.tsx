"use client";

import { ArrowPathIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import OrderCard from "./OrderCard";

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
    const activeOrders = orders.filter(
      order => order.status !== "COMPLETED" && order.status !== "FAILED"
    );
    localStorage.setItem("orders", JSON.stringify(activeOrders));
    setOrders(activeOrders);
  };

  if (orders.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Orders
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              title="Refresh orders"
            >
              <ArrowPathIcon
                className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`}
              />
              <span className="sr-only">Refresh orders</span>
            </button>
          </div>
        </div>
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <ArrowPathIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
            No orders found
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
            Start your first cross-chain exchange to see orders here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Orders
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {orders.length} order{orders.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            title="Refresh orders"
          >
            <ArrowPathIcon
              className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`}
            />
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

      <div className="space-y-3">
        {orders.map(order => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    </div>
  );
}
