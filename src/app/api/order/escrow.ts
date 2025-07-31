import { Address, DstImmutablesComplement, HashLock, Immutables, TimeLocks } from "@1inch/cross-chain-sdk";
import { id, Interface, JsonRpcApiProvider } from "ethers";
import EscrowFactoryContract from "./abi/EscrowFactory.json";

class EscrowFactory {
  iface = new Interface(EscrowFactoryContract.abi);
  provider: JsonRpcApiProvider;
  address: string;

  constructor(provider: JsonRpcApiProvider, address: string) {
    this.provider = provider;
    this.address = address;
  }

  async getSourceImpl() {
    return Address.fromBigInt(
      BigInt(
        await this.provider.call({
          to: this.address,
          data: id("ESCROW_SRC_IMPLEMENTATION()").slice(0, 10),
        })
      )
    );
  }

  async getDestinationImpl() {
    return Address.fromBigInt(
      BigInt(
        await this.provider.call({
          to: this.address,
          data: id("ESCROW_DST_IMPLEMENTATION()").slice(0, 10),
        })
      )
    );
  }

  async getSrcDeployEvent(blockHash: string) {
    const event = this.iface.getEvent("SrcEscrowCreated");
    const logs = await this.provider.getLogs({
      blockHash,
      address: this.address,
      topics: [event!.topicHash],
    });

    const [data] = logs.map((l) => this.iface.decodeEventLog(event!, l.data));

    const immutables = data.at(0);
    const complement = data.at(1);

    return [
      Immutables.new({
        orderHash: immutables[0],
        hashLock: HashLock.fromString(immutables[1]),
        maker: Address.fromBigInt(immutables[2]),
        taker: Address.fromBigInt(immutables[3]),
        token: Address.fromBigInt(immutables[4]),
        amount: immutables[5],
        safetyDeposit: immutables[6],
        timeLocks: TimeLocks.fromBigInt(immutables[7]),
      }),
      DstImmutablesComplement.new({
        maker: Address.fromBigInt(complement[0]),
        amount: complement[1],
        token: Address.fromBigInt(complement[2]),
        safetyDeposit: complement[3],
      }),
    ];
  }
}

export { EscrowFactory };
