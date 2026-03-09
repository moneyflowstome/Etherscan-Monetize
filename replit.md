# TokenAltcoin - Multi-Chain Crypto Platform

## Overview
TokenAltcoin is a fully free, multi-chain cryptocurrency platform with a real-time wallet tracker, live crypto prices, news feed, masternode tracker, and a password-protected admin panel. Monetized via Google AdSense.

## Architecture
- **Frontend**: React + TypeScript with Vite, TanStack Query, wouter routing, shadcn/ui components, Tailwind CSS v4
- **Backend**: Express.js server proxying Etherscan API V2, CoinGecko, CryptoCompare (protects API keys)
- **Database**: PostgreSQL with Drizzle ORM for admin settings, analytics, and content moderation
- **Design**: Dark Future / Cyberpunk minimal with light/dark mode toggle — Orbitron + Inter fonts, neon cyan (#00C8FF), glassmorphism
- **Theme**: Light/dark mode via `useTheme` hook (`client/src/hooks/use-theme.ts`), persisted in localStorage, toggled from Navbar

## Key Features
- Wallet address lookup with real-time balance display
- Multi-chain support (Ethereum, BSC, Polygon, Arbitrum, Optimism, Base, Avalanche)
- Multi-Chain Explorer hub at `/explorer` — 24+ chains ALL built-in (no external links): "Top Chains" (BTC, ETH, SOL, XRP, BNB, DOGE, ADA, TRX, AVAX, TON), "More Chains" (DOT, LINK, LTC, SHIB, BCH, XEM, NEO, XLM, ATOM, NEAR), "EVM Networks" (Polygon, Arbitrum, Optimism, Base)
- Every chain shows live CoinGecko coin info (price, market cap, volume, ATH, supply, description) via `/api/coin/:id`
- Address lookup built-in for: BTC (Blockstream), SOL (Solana RPC), DOGE/LTC/BCH (Blockcypher), TRX (TronGrid), XLM (Stellar Horizon), XEM (NEM NIS), NEO (NEO N3 RPC)
- Chains without address APIs (ADA, TON, ATOM, NEAR) show full coin info; ERC-20 tokens (LINK, SHIB) link to Wallet Tracker
- Polkadot (DOT) address lookup via Subscan API (free, no key) — balance, locked, reserved, bonded, unbonding + transfer history
- XRP Explorer at `/xrp` — wallet lookup, transaction history, token holdings (trust lines), NFTs, and live ledger stats (all free via XRPL public JSON-RPC)
- Staking Calculator at `/staking` — compound interest calculator for 10 PoS coins with live price integration
- Transaction history + token transfer tracking
- Live ETH price & gas tracker
- Crypto prices page (CoinGecko) with sparklines, trending, and star-to-watchlist
- Watchlist page — add/remove coins, localStorage persistence, dedicated by-IDs API endpoint, search to add coins
- News feed with three tabs: Crypto (CryptoCompare), World (BBC, Al Jazeera, Sky News RSS), USA (BBC US, ABC News, NPR RSS)
- Crypto news has category filtering (Market, Business, Blockchain, Bitcoin, Ethereum, Altcoins, Research), archive mode with infinite scroll and article counts
- World and USA news auto-refreshed from RSS feeds, cached 10 minutes server-side
- Masternode tracker with collateral/ROI data
- Admin panel at `/admin` with:
  - Site analytics (page views, tracked wallets, top chains)
  - AdSense management (publisher ID, slot IDs)
  - Content moderation (pin/hide news articles)
  - General settings (toggle features, change admin password)
- 100% Free — monetized with Google AdSense

## Monetization
- Google AdSense integration with dynamic AdBanner component
- Ad placements: leaderboard, mid-content, in-feed, sidebar rectangles
- AdBanner returns null when unfilled (no empty space)
- Replace `ca-pub-XXXXXXXXXXXXXXXX` with real publisher ID
- Admin panel allows managing ad slot IDs via settings

## API Routes
### Public
- `GET /api/chains` - Supported chains
- `GET /api/balance/:address?chainId=` - Native balance
- `GET /api/balances/:address?chains=` - Multi-chain balances
- `GET /api/transactions/:address?chainId=` - Transaction list
- `GET /api/token-transfers/:address?chainId=` - ERC-20 transfers
- `GET /api/gas?chainId=` - Gas oracle
- `GET /api/eth-price` - ETH price
- `GET /api/prices?page=&per_page=` - Coin market data (CoinGecko)
- `GET /api/prices/by-ids?ids=` - Coin data by comma-separated IDs (for watchlist)
- `GET /api/news/archive?before=` - Older news articles with timestamp pagination
- `GET /api/news/world` - World news from RSS feeds (BBC, Al Jazeera, Sky News)
- `GET /api/news/usa` - USA news from RSS feeds (BBC US, ABC News, NPR)
- `GET /api/xrpl/account/:address` - XRP account info + balance
- `GET /api/xrpl/transactions/:address` - XRP transaction history (last 20)
- `GET /api/xrpl/tokens/:address` - XRP trust lines / token holdings
- `GET /api/xrpl/nfts/:address` - XRP NFTs owned by address
- `GET /api/xrpl/server` - XRP Ledger network stats (cached 30s)
- `GET /api/btc/address/:address` - Bitcoin address info (balance, tx count, funded/spent) via Blockstream
- `GET /api/btc/transactions/:address` - Bitcoin recent transactions (last 15) via Blockstream
- `GET /api/sol/account/:address` - Solana account balance (SOL + lamports) via public RPC
- `GET /api/sol/transactions/:address` - Solana recent transaction signatures (last 15) via public RPC
- `GET /api/doge/address/:address` - Dogecoin address info (balance, tx count, received/sent) via Blockcypher
- `GET /api/doge/transactions/:address` - Dogecoin recent transactions (last 15) via Blockcypher
- `GET /api/ltc/address/:address` - Litecoin address info via Blockcypher
- `GET /api/ltc/transactions/:address` - Litecoin recent transactions via Blockcypher
- `GET /api/bch/address/:address` - Bitcoin Cash address info via Blockcypher
- `GET /api/bch/transactions/:address` - Bitcoin Cash recent transactions via Blockcypher
- `GET /api/trx/account/:address` - TRON account info (balance, bandwidth, energy) via TronGrid
- `GET /api/trx/transactions/:address` - TRON recent transactions via TronGrid
- `GET /api/xlm/account/:address` - Stellar account info (balances, subentries) via Horizon
- `GET /api/xlm/transactions/:address` - Stellar recent transactions via Horizon
- `GET /api/xem/account/:address` - NEM account info (balance, vested, importance) via NIS
- `GET /api/xem/transactions/:address` - NEM recent transactions via NIS
- `GET /api/neo/account/:address` - NEO N3 token balances (NEO, GAS) via RPC
- `GET /api/neo/transactions/:address` - NEO N3 recent transfers via RPC
- `GET /api/coin/:id` - Detailed coin info from CoinGecko (price, market cap, ATH, supply, description)
- `GET /api/trending` - Trending coins
- `GET /api/news` - Crypto news (with moderation applied)
- `GET /api/masternodes` - Masternode coin data
- `POST /api/track` - Record analytics event

### Admin (requires x-admin-token header)
- `POST /api/admin/login` - Login (default password: admin123)
- `POST /api/admin/logout` - Logout
- `GET /api/admin/verify` - Check auth
- `GET /api/admin/stats` - Analytics data
- `GET /api/admin/settings` - Get all settings
- `PUT /api/admin/settings` - Update settings (key-value object)
- `GET /api/admin/hidden-news` - List hidden articles
- `POST /api/admin/hide-news` - Hide an article
- `DELETE /api/admin/hide-news/:articleId` - Restore article
- `GET /api/admin/pinned-news` - List pinned articles
- `POST /api/admin/pin-news` - Pin an article
- `DELETE /api/admin/pin-news/:articleId` - Unpin article

## Database Tables
- `users` - User accounts (varchar UUID primary key)
- `site_settings` - Key-value settings store
- `page_views` - Analytics tracking (page, wallet, chain, timestamps)
- `hidden_news` - Hidden article IDs with reason
- `pinned_news` - Pinned article IDs

## Environment Variables
- `ETHERSCAN_API_KEY` - Required. Etherscan API key (free tier: 5 calls/sec)
- `DATABASE_URL` - PostgreSQL connection string (auto-provisioned)

## File Structure
- `client/src/pages/dashboard.tsx` - Wallet tracker page
- `client/src/pages/prices.tsx` - Crypto prices page
- `client/src/pages/news.tsx` - News feed page
- `client/src/pages/masternodes.tsx` - Masternode tracker page
- `client/src/pages/watchlist.tsx` - Watchlist page (localStorage-persisted)
- `client/src/hooks/use-watchlist.ts` - Watchlist hook (add/remove/toggle/isWatched)
- `client/src/pages/explorer.tsx` - Multi-Chain Explorer hub (BTC, SOL, DOGE inline; links to 20+ chains)
- `client/src/pages/xrp-explorer.tsx` - XRP Ledger explorer (account, txs, tokens, NFTs)
- `client/src/pages/staking.tsx` - Crypto staking calculator (10 PoS coins, compound interest, live prices)
- `client/src/pages/admin.tsx` - Admin panel (login + tabs)
- `client/src/components/Navbar.tsx` - Shared navigation
- `client/src/components/Footer.tsx` - Shared footer
- `client/src/components/AdBanner.tsx` - AdSense ad component
- `server/routes.ts` - All API routes (public + admin)
- `server/storage.ts` - Database storage layer (Drizzle ORM)
- `server/index.ts` - Express server entry point
- `shared/schema.ts` - Drizzle schema + Zod types

## Caching
- Prices: 60s, Trending: 120s, News: 300s, Masternodes: 300s (server-side)
