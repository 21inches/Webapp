"use client"
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { WalletActionButton } from "@tronweb3/tronwallet-adapter-react-ui";
import Image from "next/image";

export function Navbar() {
  return (
    <header className="sticky top-0 left-0 bg-white w-full">
      <div className="flex">
        <Image
          src="/21incheslogo.png"
          alt="21 Inches"
          width={100}
          height={100}
        />
        <div className="flex-1" />
        <div className="flex items-center justify-end pr-4 gap-2">
          <ConnectButton label="EVM Wallet">
          </ConnectButton>
          <WalletActionButton>
          </WalletActionButton>
        </div>
      </div>
    </header>
  );
}
