import {
    Address,
    Immutables
} from "@1inch/cross-chain-sdk";
import { NextResponse } from "next/server";
import { getBlockExplorerLink, getTransactionLink } from "../../utils/transaction";
import { ChainConfigs, getChainResolver } from "../constants/contracts";
import { getSrcDeployEvent } from "./escrow";
import { deploySrcCallData, Resolver } from "./resolver";

export async function POST(request: Request) {
    const { order, swapState, signature,immutables,hashLock,orderHash,orderBuild,takerTraits,srcSafetyDeposit} = await request.json();
    
    console.log("🚀 Starting cross-chain exchange process...");
    
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
    console.log("✅ Order filled successfully:", orderFillHash);

    console.log("🔍 Fetching source escrow deployment event...");
    const srcEscrowEvent = await getSrcDeployEvent(
        srcChainResolver.provider,
        ChainConfigs[swapState.fromChain].EscrowFactory,
        srcDeployBlock
    );
    console.log("✅ Source escrow event retrieved");
    const dstImmutables = (srcEscrowEvent[0] as Immutables)
    .withComplement(srcEscrowEvent[1])
    .withTaker(new Address(resolverContract.dstAddress));

    console.log("🏗️ Deploying destination escrow...");
    const dstChainResolver = getChainResolver(swapState.toChain);
    const { txHash: dstDepositHash, blockTimestamp: dstDeployedAt } =
    await dstChainResolver.send(
        resolverContract.deployDst(dstImmutables as Immutables));
    console.log("✅ Destination escrow deployed:", dstDepositHash);
    
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
        srcImmutablesData: srcImmutablesData,
        // Transaction information with links
        transactions: {
            orderFill: {
                txHash: orderFillHash,
                txLink: getTransactionLink(swapState.fromChain, orderFillHash),
                blockHash: srcDeployBlock,
                blockLink: getBlockExplorerLink(swapState.fromChain, srcDeployBlock),
                chainId: swapState.fromChain,
                description: "Order fill transaction"
            },
            dstEscrowDeploy: {
                txHash: dstDepositHash,
                txLink: getTransactionLink(swapState.toChain, dstDepositHash),
                chainId: swapState.toChain,
                description: "Destination escrow deployment"
            }
        },
        status: "escrow_deployed",
        message: "Cross-chain exchange initiated successfully. Escrow contracts deployed on both chains."
    }
    
    // Custom serializer to handle BigInt values
    const serializedRes = JSON.parse(JSON.stringify(res, (key, value) => 
        typeof value === "bigint" ? value.toString() : value
    ));
    
    return NextResponse.json(serializedRes, {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
        },
    });
}
