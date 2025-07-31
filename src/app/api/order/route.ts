import {
    Address,
    Immutables
} from "@1inch/cross-chain-sdk";
import { NextResponse } from "next/server";
import { ChainConfigs, getChainResolver, getSrcEscrowFactory } from "../constants/contracts";
import { deploySrcCallData, Resolver } from "./resolver";

export async function POST(request: Request) {
    const { order, swapState, signature,immutables,hashLock,orderHash,orderBuild,takerTraits,srcSafetyDeposit} = await request.json();
    const req = {
        order: order,
        swapState: swapState,
        signature: signature,
        immutables: immutables,
        hashLock: hashLock,
        orderHash: orderHash,
        orderBuild: orderBuild,
        takerTraits: takerTraits,
        srcSafetyDeposit: srcSafetyDeposit
    };
    
    console.log("Filling order...");
    console.log("Received order structure:", JSON.stringify(order, null, 2));
    
    const resolverContract = new Resolver(
        ChainConfigs[swapState.fromChain].ResolverContractAddress,
        ChainConfigs[swapState.toChain].ResolverContractAddress
    );
    
    // The order data should contain the necessary properties
    const srcChainResolver = getChainResolver(swapState.fromChain);
    
    const fillAmount = order.inner.inner.makingAmount;
    const { txHash: orderFillHash, blockHash: srcDeployBlock } =
    await srcChainResolver.send(
        deploySrcCallData(ChainConfigs[swapState.fromChain].ResolverContractAddress, 
            signature, immutables, takerTraits, fillAmount, orderHash, hashLock,orderBuild, srcSafetyDeposit)
    );
    console.log("Order filled", orderFillHash);

    console.log("Fetching src escrow event...");
    const srcEscrowFactory = getSrcEscrowFactory(swapState.fromChain)
    const srcEscrowEvent = await srcEscrowFactory.getSrcDeployEvent(
        srcDeployBlock
    );
    console.log("Src escrow event fetched", srcEscrowEvent);
    const [immutables2, complement] = srcEscrowEvent;
    const dstImmutables = (srcEscrowEvent[0] as Immutables)
    .withComplement(srcEscrowEvent[1])
    .withTaker(new Address(resolverContract.dstAddress));
    console.log("Src escrow event fetched");

    console.log("Deploying dst escrow...");
    console.log("Dst immutables", dstImmutables);

    const dstChainResolver = getChainResolver(swapState.toChain);
    const { txHash: dstDepositHash } =
    await dstChainResolver.send(
        resolverContract.deployDst(dstImmutables as Immutables));
    console.log("Dst escrow deployed", dstDepositHash);
    return NextResponse.json(req);
}
