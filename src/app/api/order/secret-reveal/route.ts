import { NextResponse } from "next/server";
import { ChainConfigs, getChainResolver, getDstEscrowAddress, getSrcEscrowAddress } from "../../constants/contracts";
import { withdrawCallData } from "../resolver";

export async function POST(request: Request) {
    const { swapState, secret, dstImmutablesData,srcImmutablesHash,dstImmutablesHash,srcImmutablesData } = await request.json();

    const srcEscrowAddress = await getSrcEscrowAddress(swapState.fromChain, srcImmutablesHash);
    const dstEscrowAddress = await getDstEscrowAddress(swapState.toChain, dstImmutablesHash);

  console.log("Src escrow address", srcEscrowAddress);
  console.log("Dst escrow address", dstEscrowAddress);

  console.log("Withdrawing from dst escrow for user in 20secs...");
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
  console.log("Dst escrow withdrawn", dstWithdrawHash);

  console.log("Withdrawing from src escrow for resolver...");
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
  console.log("Src escrow withdrawn", resolverWithdrawHash);
return NextResponse.json({
    srcEscrowAddress,
    dstEscrowAddress
});
}