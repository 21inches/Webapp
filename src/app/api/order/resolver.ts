import { Interface, Signature, TypedDataEncoder } from 'ethers';
import * as Sdk from '@1inch/cross-chain-sdk';
import { Address } from '@1inch/cross-chain-sdk';
import ResolverABI from './abi/Resolver.json';

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

  deploySrc(
    chainId: number,
    order: any, // Use SDK Order type
    signature: string,
    takerTraits: any, // Use SDK TakerTraits type
    amount: bigint,
    hashLock: any = order.escrowExtension.hashLockInfo
  ): TransactionData {
    // Parse signature using ethers
    const { r, yParityAndS: vs } = Signature.from(signature);

    const { args, trait } = takerTraits.encode();
    const immutables = order
      .toSrcImmutables(
        chainId,
        new Sdk.Address(this.srcAddress),
        amount,
        hashLock
      )
      .build();
    const hash = this.hashOrder(chainId, order);
    immutables.orderHash = hash;

    return {
      to: this.srcAddress,
      data: this.iface.encodeFunctionData('deploySrc', [
        immutables,
        order.build(),
        r,
        vs,
        amount,
        trait,
        args,
      ]),
      value: order.escrowExtension.srcSafetyDeposit,
    };
  }

  hashOrder(srcChainId: number, order: any): string {
    const typedData = order.getTypedData(srcChainId);
    const domain = {
      name: '1inch Limit Order Protocol',
      version: '4',
      chainId: srcChainId,
      verifyingContract: '0x32a209c3736c5bd52e395eabc86b9bca4f602985',
    };
    return TypedDataEncoder.hash(
      domain,
      { Order: typedData.types[typedData.primaryType] },
      typedData.message
    );
  }

  deployDst(immutables: any): TransactionData {
    return {
      to: this.dstAddress,
      data: this.iface.encodeFunctionData('deployDst', [
        immutables.build(),
        immutables.timeLocks.toSrcTimeLocks().privateCancellation,
      ]),
      value: immutables.safetyDeposit,
    };
  }

  withdraw(
    side: 'src' | 'dst',
    escrow: any,
    secret: string,
    immutables: any
  ): TransactionData {
    return {
      to: side === 'src' ? this.srcAddress : this.dstAddress,
      data: this.iface.encodeFunctionData('withdraw', [
        escrow.toString(),
        secret,
        immutables.build(),
      ]),
    };
  }

  cancel(side: 'src' | 'dst', escrow: any, immutables: any): TransactionData {
    return {
      to: side === 'src' ? this.srcAddress : this.dstAddress,
      data: this.iface.encodeFunctionData('cancel', [
        escrow.toString(),
        immutables.build(),
      ]),
    };
  }
}

export { Resolver };
