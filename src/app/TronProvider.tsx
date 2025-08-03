"use client"
import { Adapter } from '@tronweb3/tronwallet-abstract-adapter';
import { WalletProvider } from '@tronweb3/tronwallet-adapter-react-hooks';
import { WalletModalProvider } from '@tronweb3/tronwallet-adapter-react-ui';
import '@tronweb3/tronwallet-adapter-react-ui/style.css';
import { LedgerAdapter } from '@tronweb3/tronwallet-adapters';
import { PropsWithChildren, useCallback, useEffect, useState } from "react";

export function TronProvider({ children }: PropsWithChildren) {
  //const adapters = useMemo(() => ([new TronLinkAdapter()]), []);
  const onAccountsChanged = useCallback((curAddr:string, preAddr:string|undefined) => {
    console.log('new address is: ', curAddr, ' previous address is: ', preAddr);
  }, []);
  const [adapters, setAdapters] = useState<Adapter[]>([]);
  useEffect(() => {
      import('@tronweb3/tronwallet-adapters').then((res) => {
                          const { BitKeepAdapter, OkxWalletAdapter, TokenPocketAdapter, TronLinkAdapter } = res;
          const tronLinkAdapter = new TronLinkAdapter({
              openTronLinkAppOnMobile: true,
              openUrlWhenWalletNotFound: false,
              checkTimeout: 3000,
          });
          const ledger = new LedgerAdapter({
              accountNumber: 2,
          });
          const bitKeepAdapter = new BitKeepAdapter();
          const tokenPocketAdapter = new TokenPocketAdapter();
          const okxwalletAdapter = new OkxWalletAdapter();
          setAdapters([
              tronLinkAdapter,
              bitKeepAdapter,
              tokenPocketAdapter,
              okxwalletAdapter,
              ledger,
          ]);
      });
  }, [setAdapters]);
  return (
    <WalletProvider adapters={adapters} onAccountsChanged={onAccountsChanged}>
      <WalletModalProvider>
        {children}
      </WalletModalProvider>
    </WalletProvider>
  );
}