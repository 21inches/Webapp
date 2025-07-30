const { Interface, Signature } = require("ethers");
const Sdk = require("@1inch/cross-chain-sdk");
const Contract = require("./Resolver.json");
const { ethers } = require("ethers");

class Resolver {
  iface = new Interface(Contract.abi);

  constructor(srcAddress, dstAddress) {
    this.srcAddress = srcAddress;
    this.dstAddress = dstAddress;
  }

  deploySrc(
    chainId,
    order,
    signature,
    takerTraits,
    amount,
    hashLock = order.escrowExtension.hashLockInfo
  ) {
    const { r, yParityAndS: vs } = Signature.from(signature);
    const { args, trait } = takerTraits.encode();
    const immutables = order.toSrcImmutables(
      chainId,
      new Sdk.Address(this.srcAddress),
      amount,
      hashLock
    ).build();
    const hash = this.hashOrder(chainId, order);
    immutables.orderHash = hash;

    return {
      to: this.srcAddress,
      data: this.iface.encodeFunctionData("deploySrc", [
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

  hashOrder(srcChainId, order) {
    const typedData = order.getTypedData(srcChainId);
    const domain = {
      name: "1inch Limit Order Protocol",
      version: "4",
      chainId: srcChainId,
      verifyingContract: "0x32a209c3736c5bd52e395eabc86b9bca4f602985",
    };
    return ethers.TypedDataEncoder.hash(
      domain,
      { Order: typedData.types[typedData.primaryType] },
      typedData.message
    );
  }

  deployDst(immutables) {
    return {
      to: this.dstAddress,
      data: this.iface.encodeFunctionData("deployDst", [
        immutables.build(),
        immutables.timeLocks.toSrcTimeLocks().privateCancellation,
      ]),
      value: immutables.safetyDeposit,
    };
  }

  withdraw(side, escrow, secret, immutables) {
    return {
      to: side === "src" ? this.srcAddress : this.dstAddress,
      data: this.iface.encodeFunctionData("withdraw", [
        escrow.toString(),
        secret,
        immutables.build(),
      ]),
    };
  }

  cancel(side, escrow, immutables) {
    return {
      to: side === "src" ? this.srcAddress : this.dstAddress,
      data: this.iface.encodeFunctionData("cancel", [
        escrow.toString(),
        immutables.build(),
      ]),
    };
  }
}

module.exports = { Resolver };