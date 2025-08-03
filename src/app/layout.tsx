import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import { CombinedWalletProvider } from "./CombinedWalletProvider";
import { Footer } from "./components/Footer";
import { Navbar } from "./components/Navbar";
import "./globals.css";

const roboto = Roboto({
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "21 Inches",
  description: "Lets make defi bigger",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${roboto.className}`}>
        <CombinedWalletProvider>
          <div className=" relative w-full">
            <Navbar />
            {children}
            <Footer />
          </div>
        </CombinedWalletProvider>
      </body>
    </html>
  );
}
