"use client";

import {
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { getChainName } from "../constants/chains";

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

interface OrderCardProps {
  order: OrderDetails;
}

export default function OrderCard({ order }: OrderCardProps) {
  const formatAmount = (amount: string, decimals: number) => {
    try {
      return Number(amount).toFixed(6);
    } catch (error) {
      console.error("Error formatting amount:", error);
      return "0";
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CREATED":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <ClockIcon className="w-3 h-3 mr-1" />
            Created
          </span>
        );
      case "PENDING_SECRET":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ClockIcon className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
      case "PENDING_WITHDRAW":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            <ClockIcon className="w-3 h-3 mr-1" />
            Withdrawing
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="w-3 h-3 mr-1" />
            Completed
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircleIcon className="w-3 h-3 mr-1" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CREATED":
        return "border-blue-200 bg-blue-50";
      case "PENDING_SECRET":
        return "border-yellow-200 bg-yellow-50";
      case "PENDING_WITHDRAW":
        return "border-orange-200 bg-orange-50";
      case "COMPLETED":
        return "border-green-200 bg-green-50";
      case "FAILED":
        return "border-red-200 bg-red-50";
      default:
        return "border-gray-200 bg-gray-50";
    }
  };

  const TransactionLink = ({
    href,
    tooltip,
    className = "",
  }: {
    href: string;
    tooltip: string;
    className?: string;
  }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`p-1 text-gray-500 hover:text-blue-600 transition-colors ${className}`}
      title={tooltip}
    >
      <ArrowTopRightOnSquareIcon className="w-4 h-4" />
    </a>
  );

  return (
    <div
      className={`rounded-lg p-3 border transition-all duration-200 hover:shadow-md ${getStatusColor(order.status)}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {getStatusBadge(order.status)}
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatDate(order.createdAt)}
          </span>
        </div>
        {order.orderHash && (
          <span className="text-xs text-gray-400 dark:text-gray-500 font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
            {order.orderHash.slice(0, 6)}...{order.orderHash.slice(-4)}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-3">
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Trade Details
          </h3>
          <div className="p-3 bg-white dark:bg-gray-600 rounded">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  From:
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatAmount(
                    ((order.swapState as Record<string, unknown>)
                      ?.fromAmount as string) || "0",
                    ((order.fromToken as Record<string, unknown>)
                      ?.decimals as number) || 18
                  )}{" "}
                  {
                    (order.fromToken as Record<string, unknown>)
                      ?.symbol as string
                  }
                </span>
                <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-blue-600">🔵</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gray-100 dark:bg-gray-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-gray-600 dark:text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 12h14m0 0l-4-4m4 4l-4 4"
                    />
                  </svg>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-green-600">🟢</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatAmount(
                    ((order.swapState as Record<string, unknown>)
                      ?.toAmount as string) || "0",
                    ((order.toToken as Record<string, unknown>)
                      ?.decimals as number) || 18
                  )}{" "}
                  {(order.toToken as Record<string, unknown>)?.symbol as string}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  To:
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {getChainName(
                  (order.swapState as Record<string, unknown>)
                    ?.fromChain as number
                )}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {getChainName(
                  (order.swapState as Record<string, unknown>)
                    ?.toChain as number
                )}
              </span>
            </div>
          </div>
        </div>

        {order.transactions && Object.keys(order.transactions).length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Transaction links:
              </h3>
              <div className="flex items-center space-x-2">
                {order.transactions.orderFill && (
                  <a
                    href={order.transactions.orderFill.txLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative"
                    title="Source Escrow Deploy - Order fill transaction on source chain"
                  >
                    <ArrowTopRightOnSquareIcon className="w-6 h-6 text-blue-600 hover:text-blue-800 transition-colors" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      Source Escrow Deploy
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </a>
                )}
                {order.transactions.dstEscrowDeploy && (
                  <a
                    href={order.transactions.dstEscrowDeploy.txLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative"
                    title="Destination Escrow Deploy - Escrow contract deployment on destination chain"
                  >
                    <ArrowTopRightOnSquareIcon className="w-6 h-6 text-green-600 hover:text-green-800 transition-colors" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      Destination Escrow Deploy
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </a>
                )}
                {order.transactions.dstWithdraw && (
                  <a
                    href={order.transactions.dstWithdraw.txLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative"
                    title="Destination Withdrawal - Final withdrawal of tokens on destination chain"
                  >
                    <ArrowTopRightOnSquareIcon className="w-6 h-6 text-purple-600 hover:text-purple-800 transition-colors" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      Destination Withdrawal
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </a>
                )}
                {order.transactions.srcWithdraw && (
                  <a
                    href={order.transactions.srcWithdraw.txLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative"
                    title="Source Withdrawal - Cleanup withdrawal on source chain"
                  >
                    <ArrowTopRightOnSquareIcon className="w-6 h-6 text-orange-600 hover:text-orange-800 transition-colors" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      Source Withdrawal
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {order.message && (
        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            {order.message}
          </p>
        </div>
      )}

      {order.error && (
        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
          <p className="text-xs text-red-700 dark:text-red-300">
            <strong>Error:</strong> {order.error}
          </p>
        </div>
      )}

      <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>ID: {order.id}</span>
        <div className="flex space-x-2">
          {order.completedAt && <span>✓ {formatDate(order.completedAt)}</span>}
          {order.failedAt && <span>✗ {formatDate(order.failedAt)}</span>}
        </div>
      </div>
    </div>
  );
}
