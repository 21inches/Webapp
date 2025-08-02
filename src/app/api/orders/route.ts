import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        
        // Get query parameters
        const status = searchParams.get('status');
        const userAddress = searchParams.get('userAddress');
        const fromChainId = searchParams.get('fromChainId');
        const toChainId = searchParams.get('toChainId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');
        
        // Build where clause
        const where: Record<string, unknown> = {};
        
        if (status) {
            where.status = status.toUpperCase() as 'CREATED' | 'PENDING_SECRET' | 'PENDING_WITHDRAW' | 'COMPLETED' | 'FAILED';
        }
        
        if (userAddress) {
            where.userAddress = userAddress;
        }
        
        if (fromChainId) {
            where.fromChainId = parseInt(fromChainId);
        }
        
        if (toChainId) {
            where.toChainId = parseInt(toChainId);
        }
        
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                (where.createdAt as Record<string, unknown>).gte = new Date(startDate);
            }
            if (endDate) {
                (where.createdAt as Record<string, unknown>).lte = new Date(endDate);
            }
        }
        
        // Get orders with pagination
        const orders = await prisma.order.findMany({
            where,
            orderBy: {
                createdAt: 'desc'
            },
            take: limit,
            skip: offset,
            select: {
                id: true,
                createdAt: true,
                updatedAt: true,
                status: true,
                fromChainId: true,
                toChainId: true,
                fromToken: true,
                toToken: true,
                fromAmount: true,
                toAmount: true,
                userAddress: true,
                orderHash: true,
                orderFillTxHash: true,
                dstEscrowDeployTxHash: true,
                dstWithdrawTxHash: true,
                srcWithdrawTxHash: true,
                orderFillTxLink: true,
                dstEscrowDeployTxLink: true,
                dstWithdrawTxLink: true,
                srcWithdrawTxLink: true,
                completedAt: true,
                failedAt: true,
                message: true,
                error: true,
                metadata: true
            }
        });
        
        // Get total count for pagination
        const totalCount = await prisma.order.count({ where });
        
        // Transform orders to include transaction objects
        const transformedOrders = orders.map((order: {
            orderFillTxHash?: string | null;
            orderFillTxLink?: string | null;
            dstEscrowDeployTxHash?: string | null;
            dstEscrowDeployTxLink?: string | null;
            dstWithdrawTxHash?: string | null;
            dstWithdrawTxLink?: string | null;
            srcWithdrawTxHash?: string | null;
            srcWithdrawTxLink?: string | null;
            [key: string]: unknown;
        }) => ({
            ...order,
            transactions: {
                ...(order.orderFillTxHash && {
                    orderFill: {
                        txHash: order.orderFillTxHash,
                        txLink: order.orderFillTxLink,
                        description: "Order fill transaction"
                    }
                }),
                ...(order.dstEscrowDeployTxHash && {
                    dstEscrowDeploy: {
                        txHash: order.dstEscrowDeployTxHash,
                        txLink: order.dstEscrowDeployTxLink,
                        description: "Destination escrow deployment"
                    }
                }),
                ...(order.dstWithdrawTxHash && {
                    dstWithdraw: {
                        txHash: order.dstWithdrawTxHash,
                        txLink: order.dstWithdrawTxLink,
                        description: "Destination escrow withdrawal"
                    }
                }),
                ...(order.srcWithdrawTxHash && {
                    srcWithdraw: {
                        txHash: order.srcWithdrawTxHash,
                        txLink: order.srcWithdrawTxLink,
                        description: "Source escrow withdrawal"
                    }
                })
            }
        }));
        
        return NextResponse.json({
            orders: transformedOrders,
            pagination: {
                total: totalCount,
                limit,
                offset,
                hasMore: offset + limit < totalCount
            },
            filters: {
                status,
                userAddress,
                fromChainId: fromChainId ? parseInt(fromChainId) : null,
                toChainId: toChainId ? parseInt(toChainId) : null,
                startDate,
                endDate
            }
        });
        
    } catch (error) {
        console.error("Error fetching orders:", error);
        return NextResponse.json(
            { error: "Failed to fetch orders" },
            { status: 500 }
        );
    }
} 