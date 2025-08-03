"use client";

import { useWallet } from "@tronweb3/tronwallet-adapter-react-hooks";
import { useAccount, useSwitchChain } from "wagmi";
import { ALL_CHAINS, isTronChain } from "../constants/chains";

export function NetworkSelector() {
  const { chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const { wallet, connected, disconnect } = useWallet();

  const handleNetworkSwitch = async (chainId: number) => {
    if (isTronChain(chainId)) {
      // Handle Tron network switch
      if (connected) {
        await disconnect();
      }
      // Tron networks are handled by the wallet adapter
      console.log("Switching to Tron network:", chainId);
    } else {
      // Handle Ethereum network switch
      if (switchChain) {
        switchChain({ chainId });
      }
    }
  };

  const getCurrentNetwork = () => {
    if (connected && wallet) {
      return "Tron Network"; // Tron wallet doesn't expose chain info directly
    }
    return chain?.name || "Select Network";
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm font-medium text-gray-700">
        Current Network: {getCurrentNetwork()}
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {/* Ethereum Networks */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-gray-600 uppercase">Ethereum Networks</h3>
          {ALL_CHAINS.filter(chain => !isTronChain(chain.id)).map((network) => (
            <button
              key={network.id}
              onClick={() => handleNetworkSwitch(network.id)}
              className={`w-full px-3 py-2 text-sm rounded-lg border transition-colors ${
                chain?.id === network.id
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-2">
                <img src={network.logo} alt={network.name} className="w-4 h-4" />
                {network.name}
              </div>
            </button>
          ))}
        </div>

        {/* Tron Networks */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-gray-600 uppercase">Tron Networks</h3>
          {ALL_CHAINS.filter(chain => isTronChain(chain.id)).map((network) => (
            <button
              key={network.id}
              onClick={() => handleNetworkSwitch(network.id)}
              className={`w-full px-3 py-2 text-sm rounded-lg border transition-colors ${
                connected && isTronChain(network.id)
                  ? "bg-red-500 text-white border-red-500"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-2">
                <img src={network.logo} alt={network.name} className="w-4 h-4" />
                {network.name}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Tron Wallet Status */}
      {connected && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-sm text-green-800">
            <div className="font-medium">Tron Wallet Connected</div>
            <div className="text-xs opacity-75">
              Address: {wallet?.adapter.address?.slice(0, 8)}...{wallet?.adapter.address?.slice(-6)}
            </div>
            <div className="text-xs opacity-75">
              Network: Tron Network
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 