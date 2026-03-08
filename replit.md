# TokenAltcoin - Multi-Chain Crypto Portfolio Tracker

## Overview
TokenAltcoin is a real-time multi-chain cryptocurrency wallet tracker powered by the Etherscan API V2. Users can enter any Ethereum-compatible wallet address and view live balances, transactions, token transfers, gas prices, and ETH price data across multiple EVM chains.

## Architecture
- **Frontend**: React + TypeScript with Vite, TanStack Query, wouter routing, shadcn/ui components, Tailwind CSS v4
- **Backend**: Express.js server that proxies requests to Etherscan API V2 (protects API key)
- **No Database**: This app fetches all data live from the blockchain via Etherscan API

## Key Features
- Wallet address lookup with real-time balance display
- Multi-chain support (Ethereum, BSC, Polygon, Arbitrum, Optimism, Base, Avalanche)
- Transaction history with send/receive indicators
- Token transfer tracking
- Live ETH price feed
- Gas price tracker (Slow/Average/Fast)
- Token detection from recent transfers
- Links to block explorers for all transactions and addresses
- 100% Free - monetized with Google AdSense ad placements

## Monetization
- Google AdSense integration with multiple ad placements:
  - Top leaderboard banner (below navbar)
  - Mid-content banner (between balance and transactions)
  - In-feed ads (within transaction/token lists every 5 items)
  - Two sidebar rectangle ads (300x250)
  - Bottom content leaderboard
- AdSense script loaded in index.html
- AdBanner component in `client/src/components/AdBanner.tsx`
- Replace `ca-pub-XXXXXXXXXXXXXXXX` in index.html and AdBanner.tsx with your real Google AdSense publisher ID

## API Routes (all prefixed with /api)
- `GET /api/chains` - List supported chains
- `GET /api/balance/:address?chainId=` - Native balance for address
- `GET /api/balances/:address?chains=` - Multi-chain balances
- `GET /api/transactions/:address?chainId=` - Transaction list
- `GET /api/token-transfers/:address?chainId=` - ERC-20 token transfers
- `GET /api/gas?chainId=` - Gas oracle data
- `GET /api/eth-price` - Current ETH price
- `GET /api/contract-abi/:address?chainId=` - Contract ABI
- `GET /api/internal-transactions/:address?chainId=` - Internal transactions

## Environment Variables
- `ETHERSCAN_API_KEY` - Required. Etherscan API key (free tier: 5 calls/sec)

## File Structure
- `client/src/pages/dashboard.tsx` - Main dashboard page with all UI
- `server/routes.ts` - API routes proxying to Etherscan
- `server/index.ts` - Express server entry point
- `shared/schema.ts` - Shared types (minimal, no DB needed)
