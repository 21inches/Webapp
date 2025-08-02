"use client";
import {
  Address,
  AuctionDetails,
  CrossChainOrder,
  HashLock,
  randBigInt,
  TimeLocks,
} from "@1inch/cross-chain-sdk";
import { parseUnits } from "viem";
import { ChainConfigs } from "../constants/contracts";

export const createOrder = async (
  srcChainUserAddress: string,
  makingAmount: string,
  takingAmount: string,
  srcTokenAddress: string,
  dstTokenAddress: string,
  secret: string,
  srcChainId: number,
  dstChainId: number,
  srcTokenDecimals: number = 18,
  dstTokenDecimals: number = 18
): Promise<{
  order: CrossChainOrder;
  orderdata: {
    domain: Record<string, unknown>;
    types: Record<string, unknown>;
    primaryType: string;
    message: Record<string, unknown>;
  };
  secret: string;
}> => {
  const escrowFactoryAddress = ChainConfigs[srcChainId].EscrowFactory;
  const srcTimestamp = BigInt(Math.floor(Date.now() / 1000));
  const order = CrossChainOrder.new(
    new Address(escrowFactoryAddress),
    {
      salt: randBigInt(1000),
      maker: new Address(srcChainUserAddress),
      makingAmount: parseUnits(makingAmount, srcTokenDecimals),
      takingAmount: parseUnits(takingAmount, dstTokenDecimals),
      makerAsset: new Address(srcTokenAddress),
      takerAsset: new Address(dstTokenAddress),
    },
    {
      hashLock: HashLock.forSingleFill(secret),
      timeLocks: TimeLocks.new({
        srcWithdrawal: BigInt(10), // 10sec finality lock for test
        srcPublicWithdrawal: BigInt(120), // 2m for private withdrawal
        srcCancellation: BigInt(121), // 1sec public withdrawal
        srcPublicCancellation: BigInt(122), // 1sec private cancellation
        dstWithdrawal: BigInt(10), // 10sec finality lock for test
        dstPublicWithdrawal: BigInt(100), // 100sec private withdrawal
        dstCancellation: BigInt(101), // 1sec public withdrawal
      }),
      srcChainId,
      dstChainId,
      srcSafetyDeposit: ChainConfigs[srcChainId].SafetyDeposit,
      dstSafetyDeposit: ChainConfigs[dstChainId].SafetyDeposit,
    },
    {
      auction: new AuctionDetails({
        initialRateBump: 0,
        points: [],
        duration: BigInt(120),
        startTime: BigInt(srcTimestamp),
      }),
      whitelist: [
        {
          address: new Address(
            ChainConfigs[srcChainId].ResolverContractAddress
          ),
          allowFrom: BigInt(0),
        },
      ],
      resolvingStartTime: BigInt(0),
    },
    {
      nonce: randBigInt(1000), /// changed to 1000 for testing instead of UINT_40_MAX
      allowPartialFills: false,
      allowMultipleFills: false,
    }
  );
  const orderTypedData = order.getTypedData(srcChainId);
  const orderdata = {
    domain: {
      name: "1inch Limit Order Protocol",
      version: "4",
      chainId: srcChainId,
      verifyingContract: ChainConfigs[srcChainId].LOP,
    },

    types: orderTypedData.types,
    primaryType: orderTypedData.primaryType,
    message: orderTypedData.message,
  };
  return { order, orderdata, secret };
};
