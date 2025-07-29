import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { RainbowProvider } from "./RainbowProvider";
import { Navbar } from "./Navbar";


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
        <RainbowProvider>
          <div className=" relative w-full">
            <Navbar />
            {children}
          </div>
        </RainbowProvider>
      </body>
    </html>
  );
}
