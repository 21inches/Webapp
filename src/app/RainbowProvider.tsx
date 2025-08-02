"use client";
import "@rainbow-me/rainbowkit/styles.css";

import { RainbowKitProvider, lightTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider, createConfig, http } from "wagmi";
import { coinbaseWallet } from "wagmi/connectors";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PropsWithChildren } from "react";
import {
  baseSepolia,
  etherlinkTestnet,
  monadTestnet,
  sepolia,
} from "wagmi/chains";
const queryClient = new QueryClient();

export const config = createConfig({
  chains: [sepolia, baseSepolia, monadTestnet, etherlinkTestnet],
  connectors: [
    coinbaseWallet({
      appName: "21Inches",
    }),
  ],
  transports: {
    [sepolia.id]: http(),
    [baseSepolia.id]: http(),
    [monadTestnet.id]: http(),
    [etherlinkTestnet.id]: http(),
  },
});

export function RainbowProvider({ children }: PropsWithChildren) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={lightTheme({
            accentColor: "#A178DF",
            borderRadius: "small",
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
