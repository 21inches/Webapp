'use client'
import { ChainConfigs } from "../constants/contracts"
import { Address, AuctionDetails, CrossChainOrder, EIP712TypedData, HashLock, randBigInt, TimeLocks } from "@1inch/cross-chain-sdk";
export const createOrder = async(
    srcChainUserAddress:string,
    makingAmount:string,
    takingAmount:string,
    srcTokenAddress:string,
    dstTokenAddress:string,
    secret:string,
    srcChainId:number,
    dstChainId:number,
  ): Promise<{orderTypedData:EIP712TypedData,secret:string}>=>{
    const escrowFactoryAddress = ChainConfigs[srcChainId].EscrowFactory;
    const srcTimestamp = BigInt(Math.floor(Date.now() / 1000));
    const order = CrossChainOrder.new(
        new Address(escrowFactoryAddress),
        {
          salt: randBigInt(1000),
          maker: new Address(srcChainUserAddress),
          makingAmount: BigInt(makingAmount),
          takingAmount: BigInt(takingAmount),
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
               address: new Address(ChainConfigs[srcChainId].ResolverContractAddress),  
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
    const domain = {
        name: "1inch Limit Order Protocol",
        version: "4",
        chainId: srcChainId,
        verifyingContract: ChainConfigs[srcChainId].EscrowFactory,
      };
    return {orderTypedData ,secret};
}

// async signOrder(srcChainId, order) {
//     const typedData = order.getTypedData(srcChainId);
//     const domain = {
//       name: "1inch Limit Order Protocol",
//       version: "4",
//       chainId: srcChainId,
//       verifyingContract: "0x32a209c3736c5bd52e395eabc86b9bca4f602985",
//     };

//     return this.signer.signTypedData(
//       domain,
//       { Order: typedData.types[typedData.primaryType] },
//       typedData.message
//     );
//   }