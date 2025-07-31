import {
    Address,
    AmountMode,
    CrossChainOrder,
    Immutables,
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
    
    // Debug the order structure
    console.log("Order keys:", Object.keys(order));
    console.log("Order.inner keys:", order.inner ? Object.keys(order.inner) : "No inner");
    console.log("Order.inner.inner keys:", order.inner?.inner ? Object.keys(order.inner.inner) : "No inner.inner");
    
    let orderObject;
    try {
        // Try different approaches to reconstruct the CrossChainOrder
        if (order.inner?.inner) {
            console.log("Trying with order.inner.inner");
            orderObject = CrossChainOrder.fromDataAndExtension(order.inner.inner, order.inner.extension);
        } else if (order.inner) {
            console.log("Trying with order.inner");
            orderObject = CrossChainOrder.fromDataAndExtension(order.inner, order.extension);
        } else {
            console.log("Trying with order directly");
            orderObject = CrossChainOrder.fromDataAndExtension(order, order.extension);
        }
    } catch (error: unknown) {
        console.log("Failed to reconstruct CrossChainOrder:", error instanceof Error ? error.message : String(error));
        console.log("Creating fallback object...");
    }
    
    console.log("Order structure:", orderObject);
    console.log("Order extension:", orderObject?.extension);
    console.log("Taking amount:", orderObject?.takingAmount);
    console.log("Making amount:", orderObject?.makingAmount);
    
    const fillAmount = orderObject?.makingAmount;
    const { txHash: orderFillHash, blockHash: srcDeployBlock } =
    await srcChainResolver.send(
        resolverContract.deploySrc(
        swapState.fromChain,
        orderObject as CrossChainOrder, // Type assertion to avoid complex typing
        signature,
        TakerTraits.default()
            .setExtension(orderObject!.extension)
            .setAmountMode(AmountMode.maker)
            .setAmountThreshold(BigInt(orderObject!.takingAmount)),
        fillAmount!,
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
    const { txHash: dstDepositHash } =
    await dstChainResolver.send(resolverContract.deployDst(dstImmutables as Immutables));
    console.log("Dst escrow deployed", dstDepositHash);
    return NextResponse.json(orderData);
}
