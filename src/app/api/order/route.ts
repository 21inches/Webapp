import {
    Address,
    Immutables
} from "@1inch/cross-chain-sdk";
import { NextResponse } from "next/server";
import { ChainConfigs, getChainResolver } from "../constants/contracts";
import { getSrcDeployEvent } from "./escrow";
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
    const srcEscrowEvent = await getSrcDeployEvent(
        srcChainResolver.provider,
        ChainConfigs[swapState.fromChain].EscrowFactory,
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
    const { txHash: dstDepositHash, blockTimestamp: dstDeployedAt } =
    await dstChainResolver.send(
        resolverContract.deployDst(dstImmutables as Immutables));
    console.log("Dst escrow deployed", dstDepositHash);
    console.log("Dst deployed at", dstDeployedAt);
    const dstImmutablesData = dstImmutables.withDeployedAt(dstDeployedAt).build()
    const dstImmutablesHash = dstImmutables.withDeployedAt(dstDeployedAt).hash()
    const srcImmutablesHash = (srcEscrowEvent[0] as Immutables).hash()
    const srcImmutablesData = (srcEscrowEvent[0] as Immutables).build()
    const res = {
        srcEscrowEvent: srcEscrowEvent,
        dstDeployedAt: dstDeployedAt,       
        dstImmutablesData: dstImmutablesData,
        dstImmutablesHash: dstImmutablesHash,
        srcImmutablesHash: srcImmutablesHash,
        srcImmutablesData: srcImmutablesData
    }
    return NextResponse.json(JSON.stringify(res,(key, value) => (typeof value === "bigint" ? value.toString() : value)));
}
