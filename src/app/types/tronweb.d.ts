// TronWeb TypeScript declarations
declare global {
  interface Window {
    tronWeb?: {
      contract(): {
        at(address: string): Promise<{
          balanceOf(address: string): {
            call(): Promise<any>;
          };
          allowance(owner: string, spender: string): {
            call(): Promise<any>;
          };
          approve(spender: string, amount: string): {
            send(): Promise<any>;
          };
          transfer(to: string, amount: string): {
            send(): Promise<any>;
          };
          transferFrom(from: string, to: string, amount: string): {
            send(): Promise<any>;
          };
        }>;
      };
      defaultAddress: {
        base58: string;
        hex: string;
      };
      ready: boolean;
      request: (request: any) => Promise<any>;
      signMessage: (message: string) => Promise<string>;
      signTransaction: (transaction: any) => Promise<any>;
    };
  }
}

export { };
