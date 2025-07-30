import Image from "next/image";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export function Navbar() {
  return (
    <header className="sticky top-0 left-0 bg-gradient-to-r p-6 from-indigo-200 via-purple-200 to-pink-200 w-full">
      <div className="flex">
        <Image src="./next.svg" alt="21 Inches" width={100} height={50} />
        <div className="flex-1" />
        <ConnectButton></ConnectButton>
      </div>
    </header>
  );
}
