import { ChainIds } from "../constants/contracts";

export const getTransactionLink = (chainId: number, txHash: string): string => {
  switch (chainId) {
    case ChainIds.Sepolia:
      return `https://sepolia.etherscan.io/tx/${txHash}`;
    case ChainIds.BaseSepolia:
      return `https://sepolia.basescan.org/tx/${txHash}`;
    default:
      return `https://etherscan.io/tx/${txHash}`;
  }
};

export const getBlockExplorerLink = (
  chainId: number,
  blockHash: string
): string => {
  switch (chainId) {
    case ChainIds.Sepolia:
      return `https://sepolia.etherscan.io/block/${blockHash}`;
    case ChainIds.BaseSepolia:
      return `https://sepolia.basescan.org/block/${blockHash}`;
    default:
      return `https://etherscan.io/block/${blockHash}`;
  }
};

export const formatApiResponse = (
  data: Record<string, unknown>,
  includeTxLinks = true
) => {
  const response = { ...data };

  if (includeTxLinks && response.txHash) {
    response.txLink = getTransactionLink(
      response.chainId as number,
      response.txHash as string
    );
  }

  if (includeTxLinks && response.blockHash) {
    response.blockLink = getBlockExplorerLink(
      response.chainId as number,
      response.blockHash as string
    );
  }

  return response;
};
