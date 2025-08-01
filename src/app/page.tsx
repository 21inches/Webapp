"use client";

import OpenOrders from "./components/OpenOrders";
import SwapComponent from "./components/SwapComponent";

export default function Home() {
  return (
    <div className="font-sans min-h-screen p-4 sm:p-6">
      <main className="max-w-6xl mx-auto space-y-6">
        {/* Cross-Chain Exchange Section */}
        <div className="w-full">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 text-center">
            Cross-Chain Exchange
          </h1>
          <SwapComponent />
        </div>

        {/* Open Orders Section */}
        <div className="w-full">
          <OpenOrders />
        </div>
      </main>
    </div>
  );
}
