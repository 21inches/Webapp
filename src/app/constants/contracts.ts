import { parseEther } from "viem";
export const ChainIds = {
  Sepolia: 11155111,
  BaseSepolia: 84532,
  MonadTestnet: 10143,
  EtherlinkTestnet: 128123,
  TronNile: 3448148188,
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
    RpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
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
    RpcUrl: "https://base-sepolia-rpc.publicnode.com",
    SafetyDeposit: parseEther("0.001"),
  },
  [ChainIds.EtherlinkTestnet]: {
    LOP: "0x942DFf5Af350fd0816Bd03C91729633C293dB5dA",
    EscrowFactory: "0x54B6335e1daEed822d2f06Bf5D5c97b7423e319d",
    ResolverContractAddress: "0xa7c76ECE64a9c7ea863bb324a9451f903e1D0996",
    BLT: "0xb84b2c6c0d554263Eab9f56DEeA8523347270A11",
    EscrowSrcImplementationAddress:
      "0xdb2c3b4de9e6943da03afaff9dacaee861eb7f39",
    EscrowDstImplementationAddress:
      "0xa16d7bc6b95a3ab7b2a2514cd58ddc18732aa74a",
    TrueERC20: "0x8382515C25930D298e3B64Eb397005f9Ae71fc0C",
    ChainName: "EtherlinkTestnet",
    RpcUrl: "https://rpc.ankr.com/etherlink_testnet",
    SafetyDeposit: parseEther("0.001"),
  },
  [ChainIds.MonadTestnet]: {
    LOP: "0xFCf9F11666Adb060D03Bb873954673f90914bAdE",
    EscrowFactory: "0xb84b2c6c0d554263Eab9f56DEeA8523347270A11",
    ResolverContractAddress: "0x0642d9dE03A087588b39dBc844edE137e81f504E",
    BLT: "0x60c13fAcC3d2363fa4c1D4c8A0456a4FeBc98903",
    EscrowSrcImplementationAddress:
      "0xb067a3695e316f4d6f42ef047cac941a3f0298f1",
    EscrowDstImplementationAddress:
      "0x4a2d6954c17ff9be4af9b0c9a74e2d0ff4cf128d",
    TrueERC20: "0xE4F87948Efd25651CA20d8b0d750d94612f3FCB7",
    ChainName: "MonadTestnet",
    RpcUrl: "https://rpc.ankr.com/monad_testnet",
    SafetyDeposit: parseEther("0.001"),
  },
  [ChainIds.TronNile]: {
    LOP: "0x0656e98bf5b9457048b8ac0985cb48b1b6def4ac", // "TAYjAyuKjKvkhkcvgJ7CgrJ8PVziU5vr4R",
    EscrowFactory: "0x527eb6a0f425c77722da1d92aa515f691606571b", // "THVQCzNgJxTvBRH297tmHXuxVdcahipy3f",
    ResolverContractAddress: "0x9afd02fe7b017867e7468a0cacb3546c721edd84", // "TQ6iAAL9oV4Xh6DrQwZ8iGa7q1QAcwhpui",
    ITRC: "0x19fbfa920c9579bce1006d2d512d49e2dc47de1c", //"TCLbkeYSQR9zX8D7svdQ85NbdSRCDWVM5R",
    EscrowSrcImplementationAddress: "0x810deb8c21a11f0f10977378d403c995480c2b8c", // "TMjaqzSMeni2H8qSG2JyShS29dY8zgcm3V",
    EscrowDstImplementationAddress: "0x724132e32346b5199e7821025bcae3a20c5717fb", // "TLPL921VcESVS3YKB1KnPxNmBENxTDB3jY",
    TrueERC20: "0xf8dfdf1ab75de04f485a9871d9298a070b9bebc6", // "TYf8mVp2tC7K9AYbFFfv8gVH82JEkbKKDj",
    ChainId: 3448148188, // NILE=3448148188,  Mainnet=728126428
    RpcUrl: "https://nile.trongrid.io",
    SafetyDeposit: parseEther("0.001"),
  },
};
