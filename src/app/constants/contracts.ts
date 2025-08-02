import { parseEther } from "viem";
export const ChainIds = {
  Sepolia: 11155111,
  BaseSepolia: 84532,
};
export const ChainConfigs = {
  [ChainIds.Sepolia]: {
    LOP: "0x32a209c3736c5bd52e395eabc86b9bca4f602985",
    EscrowFactory: "0x61a32a9263c6ff568c66799a94f8fe09c1db7a66",
    ResolverContractAddress: "0xe002e8e986fd4bbff58b49423c7f7e0e0e92cc59",
    BLT: "0x0BF8E91b08b242cD7380bC92385C90c8270b37f0",
    EscrowSrcImplementationAddress:
      "0xa17ddb01f03a42e0070a0e25099cf3d27b705fff",
    EscrowDstImplementationAddress:
      "0x7490329e69ab8e298a32dc59493034e4d02a5ccf",
    TrueERC20: "0x6dFe5DA3C989aB142CfB16a8FfA2B0e640b1d821",
    ChainName: "Sepolia",
    RpcUrl: "https://sepolia.drpc.org",
    SafetyDeposit: parseEther("0.001"),
  },
  [ChainIds.BaseSepolia]: {
    LOP: "0xe30f9abbadc1eb84b41d41035b2a2c7d0bd5f9b2",
    EscrowFactory: "0x178ddaca4499a89e40826ec247baf608051edf9e",
    ResolverContractAddress: "0x3fe279B56F330304446522F04907fBBe03Fe236a",
    BLT: "0xbb7f72d58f5F7147CBa030Ba4c46a94a07E4c2CA",
    EscrowSrcImplementationAddress:
      "0xe55061a78bf30e7f38410b90a6a167d5621cc068",
    EscrowDstImplementationAddress:
      "0x0418b6e80a602474fbfadc3a2594413fe68496bb",
    TrueERC20: "0x8bD9f7C82eBF9D9C830a76bAcb0E99A52163B304",
    ChainName: "BaseSepolia",
    RpcUrl: "https://sepolia.base.org",
    SafetyDeposit: parseEther("0.001"),
  },
};
