import {
  AbiCoder,
  Contract,
  JsonRpcApiProvider,
  Wallet as PKWallet,
  Signer,
} from "ethers";
import ERC20 from "./abi/IERC20.json";

const coder = AbiCoder.defaultAbiCoder();

class Wallet {
  provider: JsonRpcApiProvider;
  signer: Signer;

  constructor(
    privateKeyOrSigner: string | Signer,
    provider: JsonRpcApiProvider
  ) {
    this.provider = provider;
    this.signer =
      typeof privateKeyOrSigner === "string"
        ? new PKWallet(privateKeyOrSigner, this.provider)
        : privateKeyOrSigner;
  }

  static async fromAddress(
    address: string,
    provider: JsonRpcApiProvider
  ): Promise<Wallet> {
    await provider.send("anvil_impersonateAccount", [address.toString()]);

    const signer = await provider.getSigner(address.toString());

    return new Wallet(signer, provider);
  }

  async tokenBalance(token: string): Promise<bigint> {
    const tokenContract = new Contract(
      token.toString(),
      ERC20.abi,
      this.provider
    );

    return tokenContract.balanceOf(await this.getAddress());
  }

  async topUpFromDonor(
    token: string,
    donor: string,
    amount: bigint
  ): Promise<void> {
    const donorWallet = await Wallet.fromAddress(donor, this.provider);
    await donorWallet.transferToken(token, await this.getAddress(), amount);
  }

  async getAddress(): Promise<string> {
    return this.signer.getAddress();
  }

  async unlimitedApprove(tokenAddress: string, spender: string): Promise<void> {
    const currentApprove = await this.getAllowance(tokenAddress, spender);

    // for usdt like tokens
    if (currentApprove !== BigInt(0)) {
      await this.approveToken(tokenAddress, spender, BigInt(0));
    }

    await this.approveToken(
      tokenAddress,
      spender,
      BigInt(2) ** BigInt(256) - BigInt(1)
    );
  }

  async getAllowance(token: string, spender: string): Promise<bigint> {
    const contract = new Contract(token.toString(), ERC20.abi, this.provider);

    return contract.allowance(await this.getAddress(), spender.toString());
  }

  async transfer(dest: string, amount: bigint): Promise<void> {
    await this.signer.sendTransaction({
      to: dest,
      value: amount,
    });
  }

  async transferToken(
    token: string,
    dest: string,
    amount: bigint
  ): Promise<void> {
    const tx = await this.signer.sendTransaction({
      to: token.toString(),
      data:
        "0xa9059cbb" +
        coder
          .encode(["address", "uint256"], [dest.toString(), amount])
          .slice(2),
    });

    await tx.wait();
  }

  async approveToken(
    token: string,
    spender: string,
    amount: bigint
  ): Promise<void> {
    const tx = await this.signer.sendTransaction({
      to: token.toString(),
      data:
        "0x095ea7b3" +
        coder
          .encode(["address", "uint256"], [spender.toString(), amount])
          .slice(2),
    });

    await tx.wait();
  }

  async send(param: { to: string; data?: string; value?: bigint }): Promise<{
    txHash: string;
    blockTimestamp: bigint;
    blockHash: string;
  }> {
    const res = await this.signer.sendTransaction({
      ...param,
      gasLimit: 5_000_000,
      from: await this.getAddress(),
    });
    const receipt = await res.wait(1, 60000);
    const block = await res.getBlock();
    if (receipt && receipt.status) {
      return {
        txHash: receipt.hash,
        blockTimestamp: BigInt(block?.timestamp ?? -1),
        blockHash: receipt.blockHash!,
      };
    }

    throw new Error((await receipt?.getResult()) || "unknown error");
  }
}

export { Wallet };
