import {
    Address,
    AmountMode,
    CrossChainOrder,
    TakerTraits
} from "@1inch/cross-chain-sdk";
import { NextResponse } from "next/server";
import { ChainConfigs, getChainResolver, getSrcEscrowFactory } from "../constants/contracts";
import { Resolver } from "./resolver";

export async function POST(request: Request) {
    const { order, swapState, signature } = await request.json();
    const orderData = {
        order: order,
        swapState: swapState,
        signature: signature,
    };
    
    console.log("Filling order...");
    console.log("Received order structure:", JSON.stringify(order, null, 2));
    
    const resolverContract = new Resolver(
        ChainConfigs[swapState.fromChain].ResolverContractAddress,
        ChainConfigs[swapState.toChain].ResolverContractAddress
    );
    
    // The order data should contain the necessary properties
    const srcChainResolver = getChainResolver(swapState.fromChain);
    
    // Try to reconstruct the CrossChainOrder properly
    let orderObject;
    try {
        // First try with the original approach
        orderObject = CrossChainOrder.fromDataAndExtension(order.inner.inner, order.inner.extension);
    } catch (error: any) {
        console.log("Failed to reconstruct with fromDataAndExtension, trying alternative approach...");
        console.log("Error:", error.message);
        
        // Alternative: Create a mock CrossChainOrder with the data we have
        orderObject = {
            inner: {
                takingAmount: BigInt(order.inner.takingAmount),
                makingAmount: BigInt(order.inner.makingAmount),
                maker: order.inner.maker,
                takerAsset: order.inner.takerAsset,
                makerAsset: order.inner.makerAsset,
                receiver: order.inner.receiver,
                salt: BigInt(order.inner.salt),
                deadline: order.inner.deadline,
                auctionStartTime: order.inner.auctionStartTime,
                auctionEndTime: order.inner.auctionEndTime,
                nonce: order.inner.nonce,
                partialFillAllowed: order.inner.partialFillAllowed,
                multipleFillsAllowed: order.inner.multipleFillsAllowed,
                escrowExtension: order.inner.escrowExtension,
                extension: order.inner.extension
            },
            // Add getters
            get takingAmount() { return this.inner.takingAmount; },
            get makingAmount() { return this.inner.makingAmount; },
            get maker() { return this.inner.maker; },
            get takerAsset() { return this.inner.takerAsset; },
            get makerAsset() { return this.inner.makerAsset; },
            get receiver() { return this.inner.receiver; },
            get salt() { return this.inner.salt; },
            get deadline() { return this.inner.deadline; },
            get auctionStartTime() { return this.inner.auctionStartTime; },
            get auctionEndTime() { return this.inner.auctionEndTime; },
            get nonce() { return this.inner.nonce; },
            get partialFillAllowed() { return this.inner.partialFillAllowed; },
            get multipleFillsAllowed() { return this.inner.multipleFillsAllowed; },
            get escrowExtension() { return this.inner.escrowExtension; },
            get extension() { return this.inner.extension; },
            getOrderHash: (srcChainId: number) => order.inner.orderHash || "0x",
            getTypedData: (srcChainId: number) => order.inner.typedData || {},
            getCalculator: () => order.inner.calculator || null,
            calcTakingAmount: (makingAmount: bigint, time: bigint, blockBaseFee: bigint) => order.inner.takingAmount,
            canExecuteAt: (executor: any, executionTime: bigint) => true,
            isExpiredAt: (time: bigint) => false,
            getResolverFee: (filledMakingAmount: bigint) => BigInt(0),
            isExclusiveResolver: (wallet: any) => false,
            isExclusivityPeriod: (time: bigint = BigInt(Math.floor(Date.now() / 1000))) => false,
            toSrcImmutables: (srcChainId: number, taker: any, amount: bigint, hashLock: any) => ({
                hashLock,
                safetyDeposit: order.inner.escrowExtension?.srcSafetyDeposit || BigInt(0),
                taker,
                maker: order.inner.maker,
                orderHash: order.inner.orderHash || "0x",
                amount,
                timeLocks: order.inner.escrowExtension?.timeLocks || "0x",
                token: order.inner.makerAsset
            }),
            getMultipleFillIdx: (fillAmount: bigint, remainingAmount: bigint = order.inner.makingAmount) => 0
        };
    }
    
    console.log("Order structure:", orderObject);
    console.log("Order extension:", orderObject.extension);
    const fillAmount = orderObject.makingAmount;
    const { txHash: orderFillHash, blockHash: srcDeployBlock } =
    await srcChainResolver.send(
        resolverContract.deploySrc(
        swapState.fromChain,
        orderObject, // Use the order data directly
        signature,
        TakerTraits.default()
            .setExtension(orderObject.extension)
            .setAmountMode(AmountMode.maker)
            .setAmountThreshold(BigInt(orderObject.takingAmount)),
        fillAmount,
        )
    );
    console.log("Order filled", orderFillHash);

    console.log("Fetching src escrow event...");
    const srcEscrowFactory = getSrcEscrowFactory(swapState.fromChain)
    const srcEscrowEvent = await srcEscrowFactory.getSrcDeployEvent(
        srcDeployBlock
    );
    const [immutables, complement] = srcEscrowEvent;
    const dstImmutables = {
        ...immutables,
        ...complement,
        taker: new Address(resolverContract.dstAddress)
    };
    console.log("Src escrow event fetched");

    console.log("Deploying dst escrow...");
    const dstChainResolver = getChainResolver(swapState.toChain);
    const { txHash: dstDepositHash, blockTimestamp: dstDeployedAt } =
    await dstChainResolver.send(resolverContract.deployDst(dstImmutables));
    console.log("Dst escrow deployed", dstDepositHash);
    return NextResponse.json(orderData);
}
