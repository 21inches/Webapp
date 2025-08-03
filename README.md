# 21inches Webapp

A cross-chain decentralized exchange web application built with Next.js, supporting multiple EVM networks including Ethereum Sepolia, Tron, Base Sepolia, Etherlink Testnet, Tron Testnet (Nile), and Monad Testnet.

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
NILE_USER_PRIVATE_KEY=***
```

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
