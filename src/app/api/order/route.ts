import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const { order, signature } = await request.json();
    console.log("Order:", order);
    console.log("Signature:", signature);
    const orderData = {
        order: order,
        signature: signature,
    }
    return NextResponse.json(orderData);
}