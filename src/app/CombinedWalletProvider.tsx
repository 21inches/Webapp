"use client";

import { PropsWithChildren } from "react";
import { RainbowProvider } from "./RainbowProvider";
import { TronProvider } from "./TronProvider";

export function CombinedWalletProvider({ children }: PropsWithChildren) {
  return (
    <RainbowProvider>
      <TronProvider>
        {children}
      </TronProvider>
    </RainbowProvider>
  );
} 