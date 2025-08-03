// TronWeb TypeScript declarations
declare global {
  interface Window {
    tronWeb?: {
      contract(): {
        at(address: string): Promise<{
          balanceOf(address: string): {
            call(): Promise<unknown>;
          };
          allowance(owner: string, spender: string): {
            call(): Promise<unknown>;
          };
          approve(spender: string, amount: string): {
            send(): Promise<unknown>;
          };
          transfer(to: string, amount: string): {
            send(): Promise<unknown>;
          };
          transferFrom(from: string, to: string, amount: string): {
            send(): Promise<unknown>;
          };
        }>;
      };
      defaultAddress: {
        base58: string;
        hex: string;
      };
      ready: boolean;
      request: (request: unknown) => Promise<unknown>;
      signMessage: (message: string) => Promise<string>;
      signTransaction: (transaction: unknown) => Promise<unknown>;
    };
  }
}

export { };
