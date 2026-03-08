# TokenAltcoin - Multi-Chain Crypto Platform

## Overview
TokenAltcoin is a fully free, multi-chain cryptocurrency platform with a real-time wallet tracker, live crypto prices, news feed, masternode tracker, and a password-protected admin panel. Monetized via Google AdSense.

## Architecture
- **Frontend**: React + TypeScript with Vite, TanStack Query, wouter routing, shadcn/ui components, Tailwind CSS v4
- **Backend**: Express.js server proxying Etherscan API V2, CoinGecko, CryptoCompare (protects API keys)
- **Database**: PostgreSQL with Drizzle ORM for admin settings, analytics, and content moderation
- **Design**: Dark Future / Cyberpunk minimal — Orbitron + Inter fonts, neon cyan (#00C8FF), glassmorphism

## Key Features
- Wallet address lookup with real-time balance display
- Multi-chain support (Ethereum, BSC, Polygon, Arbitrum, Optimism, Base, Avalanche)
- Transaction history + token transfer tracking
- Live ETH price & gas tracker
- Crypto prices page (CoinGecko) with sparklines and trending
- Crypto news feed (CryptoCompare)
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
