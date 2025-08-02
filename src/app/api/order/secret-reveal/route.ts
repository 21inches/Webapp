import { NextResponse } from "next/server";
import { getTransactionLink } from "../../../utils/transaction";
import { ChainConfigs, getChainResolver, getDstEscrowAddress, getSrcEscrowAddress } from "../../constants/contracts";
import { withdrawCallData } from "../resolver";

export async function POST(request: Request) {
    const { swapState, secret, dstImmutablesData,srcImmutablesHash,dstImmutablesHash,srcImmutablesData } = await request.json();

    const srcEscrowAddress = await getSrcEscrowAddress(swapState.fromChain, srcImmutablesHash);
    const dstEscrowAddress = await getDstEscrowAddress(swapState.toChain, dstImmutablesHash);

    console.log("🔍 Escrow addresses calculated:");
    console.log("   Source:", srcEscrowAddress.toString());
    console.log("   Destination:", dstEscrowAddress.toString());

    console.log("⏳ Waiting 20 seconds before destination withdrawal...");
    await new Promise((resolve) => setTimeout(resolve, 20000));
    
    const dstChainResolver = getChainResolver(swapState.toChain);
    const { txHash: dstWithdrawHash } = await dstChainResolver.send(
        withdrawCallData(
            "dst",
            dstEscrowAddress.toString(),
            secret,
            dstImmutablesData,
            ChainConfigs[swapState.toChain].ResolverContractAddress
        )
    );
    console.log("✅ Destination escrow withdrawn:", dstWithdrawHash);

    console.log("🔄 Withdrawing from source escrow for resolver...");
    const srcChainResolver = getChainResolver(swapState.fromChain);
    const { txHash: resolverWithdrawHash } = await srcChainResolver.send(
        withdrawCallData(
            "src",
            srcEscrowAddress.toString(),
            secret,
            srcImmutablesData,
            ChainConfigs[swapState.fromChain].ResolverContractAddress
        )
    );
    console.log("✅ Source escrow withdrawn:", resolverWithdrawHash);
    
    return NextResponse.json({
        srcEscrowAddress: srcEscrowAddress.toString(),
        dstEscrowAddress: dstEscrowAddress.toString(),
        transactions: {
            dstWithdraw: {
                txHash: dstWithdrawHash,
                txLink: getTransactionLink(swapState.toChain, dstWithdrawHash),
                chainId: swapState.toChain,
                description: "Destination escrow withdrawal"
            },
            srcWithdraw: {
                txHash: resolverWithdrawHash,
                txLink: getTransactionLink(swapState.fromChain, resolverWithdrawHash),
                chainId: swapState.fromChain,
                description: "Source escrow withdrawal"
            }
        },
        status: "completed",
        message: "Cross-chain exchange completed successfully! Assets have been transferred."
    }, {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
        },
    });
}