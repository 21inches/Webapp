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

    }
    
    console.log("Order structure:", orderObject);
    console.log("Order extension:", orderObject?.extension);
    const fillAmount = orderObject?.makingAmount;
    const { txHash: orderFillHash, blockHash: srcDeployBlock } =
    await srcChainResolver.send(
        resolverContract.deploySrc(
        swapState.fromChain,
        orderObject, // Use the order data directly
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
    const { txHash: dstDepositHash, blockTimestamp: dstDeployedAt } =
    await dstChainResolver.send(resolverContract.deployDst(dstImmutables));
    console.log("Dst escrow deployed", dstDepositHash);
    return NextResponse.json(orderData);
}
