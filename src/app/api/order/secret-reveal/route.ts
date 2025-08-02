import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getTransactionLink } from "../../../utils/transaction";
import { ChainConfigs, getChainResolver, getDstEscrowAddress, getSrcEscrowAddress } from "../../constants/contracts";
import { withdrawCallData } from "../resolver";

export async function POST(request: Request) {
    const { swapState, secret, dstImmutablesData,srcImmutablesHash,dstImmutablesHash,srcImmutablesData, orderId } = await request.json();

    console.log("🔍 Calculating escrow addresses...");
    const srcEscrowAddress = await getSrcEscrowAddress(swapState.fromChain, srcImmutablesHash);
    const dstEscrowAddress = await getDstEscrowAddress(swapState.toChain, dstImmutablesHash);

    console.log("🔍 Escrow addresses calculated:");
    console.log("   Source:", srcEscrowAddress.toString());
    console.log("   Destination:", dstEscrowAddress.toString());

    // Update order status to PENDING_WITHDRAW and save the secret
    if (orderId) {
        await prisma.order.update({
            where: { id: orderId },
            data: {
                status: "PENDING_WITHDRAW",
                secret: secret,
                message: "Secret revealed. Starting withdrawal process..."
            }
        });
        console.log("🔄 Order status updated to PENDING_WITHDRAW");
    }

    console.log("⏳ Waiting 20 seconds before destination withdrawal...");
    await new Promise((resolve) => setTimeout(resolve, 20000));
    
    console.log("💰 Starting destination escrow withdrawal...");
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
    
    // Update order status to COMPLETED
    if (orderId) {
        await prisma.order.update({
            where: { id: orderId },
            data: {
                status: "COMPLETED",
                completedAt: new Date(),
                dstWithdrawTxHash: dstWithdrawHash,
                srcWithdrawTxHash: resolverWithdrawHash,
                dstWithdrawTxLink: getTransactionLink(swapState.toChain, dstWithdrawHash),
                srcWithdrawTxLink: getTransactionLink(swapState.fromChain, resolverWithdrawHash),
                message: "Cross-chain exchange completed successfully! Assets have been transferred."
            }
        });
        console.log("✅ Order status updated to COMPLETED");
    }
    
    const response = {
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
    };
    
    console.log("🎉 Secret revelation process completed successfully!");
    console.log("📊 Final transaction summary:", {
        dstWithdraw: response.transactions.dstWithdraw.txLink,
        srcWithdraw: response.transactions.srcWithdraw.txLink,
        status: response.status
    });
    
    return NextResponse.json(response, {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
        },
    });
}