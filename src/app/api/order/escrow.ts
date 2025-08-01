import { Address, DstImmutablesComplement, HashLock, Immutables, TimeLocks } from "@1inch/cross-chain-sdk";
import { id, Interface, JsonRpcApiProvider } from "ethers";
import EscrowFactoryContract from "./abi/EscrowFactory.json";

  export async function getSourceImpl(provider: JsonRpcApiProvider, address: string) {
    return Address.fromBigInt(
      BigInt(
        await provider.call({
          to: address,
          data: id("ESCROW_SRC_IMPLEMENTATION()").slice(0, 10),
        })
      )
    );
  }
  export async function getDestinationImpl(provider: JsonRpcApiProvider, address: string) {
    return Address.fromBigInt(
      BigInt(
        await provider.call({
          to: address,
          data: id("ESCROW_DST_IMPLEMENTATION()").slice(0, 10),
        })
      )
    );
  }
  export async function getSrcDeployEvent(provider: JsonRpcApiProvider, address: string, blockHash: string) {
    const iEscrowFactory = new Interface(EscrowFactoryContract.abi);
    const event = iEscrowFactory.getEvent("SrcEscrowCreated");
    const logs = await provider.getLogs({
      blockHash,
      address: address,
      topics: [event!.topicHash],
    });

    const [data] = logs.map((l) => iEscrowFactory.decodeEventLog(event!, l.data));

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
