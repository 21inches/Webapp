import * as Sdk from "@1inch/cross-chain-sdk";
import { Interface, Signature } from "ethers";
import ResolverABI from "./abi/Resolver.json";

export const deploySrcCallData = (
  srcAddress: string,
  signature: string,
  immutables: Sdk.ImmutablesData,
  takerTraits: unknown,
  amount: bigint,
  orderHash: string,
  hashLock: Sdk.HashLock,
  orderBuild: unknown,
  srcSafetyDeposit: bigint
) => {
  const { r, yParityAndS: vs } = Signature.from(signature);
  const { args, trait } = takerTraits as { args: unknown; trait: unknown };
  immutables.orderHash = orderHash;
  return {
    to: srcAddress,
    data: new Interface(RESOLVER_ABI).encodeFunctionData("deploySrc", [
      immutables,
      orderBuild,
      r,
      vs,
      amount,
      trait,
      args,
    ]),
    value: srcSafetyDeposit,
  };
};

export const deployDstCallData = (
  dstAddress: string,
  immutablesData: Sdk.ImmutablesData,
  privateCancellation: bigint,
  safetyDeposit: bigint
): TransactionData => {
  return {
    to: dstAddress,
    data: new Interface(RESOLVER_ABI).encodeFunctionData("deployDst", [
      immutablesData,
      privateCancellation,
    ]),
    value: safetyDeposit,
  };
};
export const withdrawCallData = (
  side: "src" | "dst",
  escrow: string,
  secret: string,
  immutables: Sdk.ImmutablesData,
  toAddress: string
) => {
  return {
    to: toAddress,
    data: new Interface(RESOLVER_ABI).encodeFunctionData("withdraw", [
      escrow,
      secret,
      immutables,
    ]),
  };
};
// Use the actual Resolver ABI from the JSON file
const RESOLVER_ABI = ResolverABI.abi;

// Use SDK types instead of custom interfaces
type TransactionData = {
  to: string;
  data: string;
  value?: bigint;
};

class Resolver {
  private iface: Interface;
  public srcAddress: string;
  public dstAddress: string;

  constructor(srcAddress: string, dstAddress: string) {
    this.srcAddress = srcAddress;
    this.dstAddress = dstAddress;
    this.iface = new Interface(RESOLVER_ABI);
  }

  deployDst(immutables: Sdk.Immutables): TransactionData {
    return {
      to: this.dstAddress,
      data: this.iface.encodeFunctionData("deployDst", [
        immutables.build(),
        immutables.timeLocks.toSrcTimeLocks().privateCancellation,
      ]),
      value: immutables.safetyDeposit,
    };
  }

  withdraw(
    side: "src" | "dst",
    escrow: Sdk.Address,
    secret: string,
    immutables: Sdk.Immutables
  ): TransactionData {
    return {
      to: side === "src" ? this.srcAddress : this.dstAddress,
      data: this.iface.encodeFunctionData("withdraw", [
        escrow.toString(),
        secret,
        immutables.build(),
      ]),
    };
  }

  cancel(
    side: "src" | "dst",
    escrow: Sdk.Address,
    immutables: Sdk.Immutables
  ): TransactionData {
    return {
      to: side === "src" ? this.srcAddress : this.dstAddress,
      data: this.iface.encodeFunctionData("cancel", [
        escrow.toString(),
        immutables.build(),
      ]),
    };
  }
}

export { Resolver };
