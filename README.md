# 21inches Webapp

A cross-chain decentralized exchange web application built with Next.js, supporting multiple EVM networks including Ethereum Sepolia, Base Sepolia, Etherlink Testnet, Tron Nile, and Monad Testnet.

## Installation

1. Clone the repository:

```bash
git clone git@github.com:21inches/Webapp.git
cd Webapp
```

2. Install dependencies:

```bash
pnpm install
```

## Running the Application

Start the development server:

```bash
pnpm run dev
```

The application will be available at `http://localhost:3000`

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
ETHERLINK_TESTNET_USER_PRIVATE_KEY=***
MONAD_TESTNET_USER_PRIVATE_KEY=***
BASE_SEPOLIA_USER_PRIVATE_KEY=***
SEPOLIA_USER_PRIVATE_KEY=***
```

## Contract Addresses

### Ethereum Sepolia (Chain ID: 11155111)

- **LOP**: `0x32a209c3736c5bd52e395eabc86b9bca4f602985`
- **Escrow Factory**: `0x61a32a9263c6ff568c66799a94f8fe09c1db7a66`
- **Resolver**: `0xe002e8e986fd4bbff58b49423c7f7e0e0e92cc59`
- **BLT Token**: `0x0BF8E91b08b242cD7380bC92385C90c8270b37f0`
- **Escrow Src Implementation**: `0xa17ddb01f03a42e0070a0e25099cf3d27b705fff`
- **Escrow Dst Implementation**: `0x7490329e69ab8e298a32dc59493034e4d02a5ccf`
- **True ERC20**: `0x6dFe5DA3C989aB142CfB16a8FfA2B0e640b1d821`

### Base Sepolia (Chain ID: 84532)

- **LOP**: `0xe30f9abbadc1eb84b41d41035b2a2c7d0bd5f9b2`
- **Escrow Factory**: `0x178ddaca4499a89e40826ec247baf608051edf9e`
- **Resolver**: `0x3fe279B56F330304446522F04907fBBe03Fe236a`
- **BLT Token**: `0xbb7f72d58f5F7147CBa030Ba4c46a94a07E4c2CA`
- **Escrow Src Implementation**: `0xe55061a78bf30e7f38410b90a6a167d5621cc068`
- **Escrow Dst Implementation**: `0x0418b6e80a602474fbfadc3a2594413fe68496bb`
- **True ERC20**: `0x8bD9f7C82eBF9D9C830a76bAcb0E99A52163B304`

### Etherlink Testnet (Chain ID: 128123)

- **LOP**: `0x942DFf5Af350fd0816Bd03C91729633C293dB5dA`
- **Escrow Factory**: `0x54B6335e1daEed822d2f06Bf5D5c97b7423e319d`
- **Resolver**: `0xa7c76ECE64a9c7ea863bb324a9451f903e1D0996`
- **BLT Token**: `0xb84b2c6c0d554263Eab9f56DEeA8523347270A11`
- **Escrow Src Implementation**: `0xdb2c3b4de9e6943da03afaff9dacaee861eb7f39`
- **Escrow Dst Implementation**: `0xa16d7bc6b95a3ab7b2a2514cd58ddc18732aa74a`
- **True ERC20**: `0x8382515C25930D298e3B64Eb397005f9Ae71fc0C`

### Monad Testnet (Chain ID: 10143)

- **LOP**: `0xFCf9F11666Adb060D03Bb873954673f90914bAdE`
- **Escrow Factory**: `0xb84b2c6c0d554263Eab9f56DEeA8523347270A11`
- **Resolver**: `0x0642d9dE03A087588b39dBc844edE137e81f504E`
- **BLT Token**: `0x60c13fAcC3d2363fa4c1D4c8A0456a4FeBc98903`
- **Escrow Src Implementation**: `0xb067a3695e316f4d6f42ef047cac941a3f0298f1`
- **Escrow Dst Implementation**: `0x4a2d6954c17ff9be4af9b0c9a74e2d0ff4cf128d`
- **True ERC20**: `0xE4F87948Efd25651CA20d8b0d750d94612f3FCB7`

## Available Scripts

- `pnpm run dev` - Start development server
- `pnpm run build` - Build for production
- `pnpm run start` - Start production server
- `pnpm run lint` - Run ESLint
- `pnpm run format` - Format code with Prettier
- `pnpm run format:check` - Check code formatting

## Tech Stack

- **Framework**: Next.js 15.4.4
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Web3**: Viem, Wagmi, RainbowKit
- **State Management**: TanStack Query
- **Package Manager**: pnpm

## Project Structure

```
src/
├── app/
│   ├── api/           # API routes
│   ├── components/    # React components
│   ├── constants/     # Contract addresses and configurations
│   ├── logic/         # Business logic
│   ├── types/         # TypeScript type definitions
│   └── utils/         # Utility functions
```
