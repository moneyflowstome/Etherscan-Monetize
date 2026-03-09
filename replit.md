# TokenAltcoin - Multi-Chain Crypto Platform

## Overview
TokenAltcoin is a fully free, multi-chain cryptocurrency platform with a real-time wallet tracker, live crypto prices, news feed, masternode tracker, and a password-protected admin panel. Monetized via Google AdSense.

## Architecture
- **Frontend**: React + TypeScript with Vite, TanStack Query, wouter routing, shadcn/ui components, Tailwind CSS v4
- **Backend**: Express.js server proxying Etherscan API V2, CoinGecko, CoinMarketCap, CryptoCompare (protects API keys)
- **Database**: PostgreSQL with Drizzle ORM for admin settings, analytics, and content moderation
- **Design**: Dark Future / Cyberpunk minimal with light/dark mode toggle — Orbitron + Inter fonts, neon cyan (#00C8FF), glassmorphism
- **Theme**: Light/dark mode via `useTheme` hook (`client/src/hooks/use-theme.ts`), persisted in localStorage, toggled from Navbar

## Key Features
- Wallet address lookup with real-time balance display
- Multi-chain support (Ethereum, BSC, Polygon, Arbitrum, Optimism, Base, Avalanche)
- Multi-Chain Explorer hub at `/` (HOME PAGE) — 51+ chains ALL built-in (no external links): "Top Chains" (BTC, ETH, SOL, XRP, BNB, DOGE, ADA, TRX, AVAX, TON), "More Chains" (DOT, LINK, LTC, SHIB, BCH, XEM, NEO, XLM, ATOM, NEAR), "EVM Networks" (Polygon, Arbitrum, Optimism, Base, Fantom, Cronos, Mantle, Celo, zkSync Era), "Next-Gen L1s" (Sui, Aptos, Sei, Injective, Kava), "Privacy Coins" (XMR, ZEC, DASH, SCRT, ZEN, FIRO, ARRR, DERO), "Meme Coins" (DOGE, SHIB, PEPE, FLOKI, WIF, BONK, BRETT, TURBO, MOG, NEIRO)
- Wallet Tracker moved to `/wallet`
- Every chain shows comprehensive CoinGecko coin info via `/api/coin/:id` — price, market cap, volume, ATH/ATL, supply (incl. infinite), description, sentiment, watchlist users, ROI, TVL, DeFi ratios, developer data (GitHub stars/forks/commits/PRs/issues/code changes), community data (Reddit/Telegram/Facebook), extended price changes (14d/60d/200d/1y), whitepaper link, governance (Snapshot), forums, chat, announcements, BitcoinTalk, block time, country, asset platform, contract addresses, public notices, last updated
- Address lookup built-in for: BTC (Blockstream), SOL (Solana RPC), DOGE/LTC/BCH (Blockcypher), TRX (TronGrid), XLM (Stellar Horizon), XEM (NEM NIS — enhanced: multi-node fallback, mosaics/tokens, harvest history, network stats, multisig info, cosignatories), NEO (NEO N3 RPC), ADA (Koios), TON (Toncenter), ATOM (Cosmos LCD), NEAR (NEAR RPC)
- Polkadot (DOT) address lookup via Subscan API (free, no key) — balance, locked, reserved, bonded, unbonding + transfer history
- ERC-20 tokens (LINK, SHIB) link to Wallet Tracker at `/wallet`
- XRP Explorer at `/xrp` — wallet lookup, transaction history, token holdings (trust lines), NFTs, and live ledger stats (all free via XRPL public JSON-RPC)
- Staking Calculator at `/staking` — compound interest calculator for 10 PoS coins with live price integration + "My Positions" tracker (localStorage) with accumulated rewards, projections, and progress tracking
- Wallet Tracker export — CSV and PDF download buttons for transaction and token transfer data (with CSV formula injection sanitization)
- Coin of the Day — picks from top 100 coins by market cap (via `/api/coin-of-the-day`), deterministic daily rotation, explorer homepage with live price, 24h change, market cap, and rank badge
- Fear & Greed Index — live gauge widget on explorer homepage (compact) and prices page (full), powered by Alternative.me API, 7-day history bar chart, cached 10 min via `/api/fear-greed`
- Market Overview widget on prices page — total market cap, 24h volume, BTC dominance bar, BTC/ETH live prices
- Price Alerts at `/alerts` — search any coin, set upper/lower price thresholds, stored in localStorage, polls every 60s, toast notifications + **browser push notifications** (with permission request button, enabled/blocked status indicator) when triggered, active/triggered sections
- Crypto Calculator at `/calculator` — real-time crypto-to-crypto and crypto-to-fiat converter using CoinGecko simple/price endpoint; 12 popular cryptos (BTC, ETH, SOL, XRP, BNB, DOGE, ADA, DOT, AVAX, LINK, TRX, LTC) + 8 fiat currencies (USD, EUR, GBP, JPY, CAD, AUD, CHF, INR); swap direction button, quick conversion shortcuts, live popular rates section
- Compare Coins at `/compare` — side-by-side analysis of up to 4 cryptocurrencies, comparing price, market cap, rank, volume, 24h change, ATH, ATL, supply; crown icon highlights best value per metric; mobile-friendly card layout; quick-add suggestion buttons
- Free Airdrops directory at `/airdrops` — verified airdrop listings with card grid, search, blockchain/reward type filters, expandable details (steps, requirements, dates), FAQ section; user submission form (auto-creates pending airdrop for admin approval); similar to freeairdrop.io
- Portfolio Tracker at `/portfolio` — search any of 10,000+ coins via CoinGecko search API, add holdings (quantity + purchase price), live P&L tracking, allocation pie chart (Recharts), total value/cost/return summary, localStorage persistence
- News Sentiment Analysis on `/news` — keyword-based bullish/bearish/neutral scoring, sentiment badges on each article, sentiment filter buttons, market sentiment summary bar at top
- Customizable Dashboard at `/dashboard` — 7 widgets (Market Overview, Fear & Greed, Portfolio Summary, Price Alerts, Watchlist, Trending, News Headlines), show/hide and reorder, drag-and-drop support, localStorage persistence
- Customizable homepage widgets — show/hide and reorder explorer sections (Top Chains, More Chains, EVM Networks, Next-Gen L1s) via settings panel, preferences persisted in localStorage
- Transaction history + token transfer tracking
- Live ETH price & gas tracker
- Gold & Precious Metals at `/gold` — live gold & silver spot prices (Swissquote free API, 1min cache), gold/silver ratio, gold weight calculator (oz/grams/kg), tokenized gold market overview (total MCap, 24h volume, dominant token, avg 24h change), 3 tabs: **Gold-Backed Tokens** (CoinGecko "tokenized-gold" category, full table with sparkline charts, 1h/24h/7d changes, mobile card layout), **Gold News** (CryptoCompare filtered for gold/PAXG/XAUT keywords), **About Tokenized Gold** (facts, top token profiles — PAXG/XAUT/KAU/CGO, DeFi integration info). Backend routes: `/api/gold/spot`, `/api/gold/silver-spot`, `/api/gold/tokens`, `/api/gold/news`
- DEX Screener at `/dex` — real-time DEX pair analytics across 80+ blockchains via DexScreener API: trending/boosted tokens grid, new token profiles, pair search by name/symbol/address, chain filter badges, search results table (token, chain/DEX, price, 5m/1h/6h/24h changes, volume, liquidity, buy/sell txns), pair detail panel (price changes, volume breakdown, transactions, liquidity, FDV, market cap, pair age, socials, websites, contract addresses), links to DexScreener. Backend proxies: `/api/dex/trending`, `/api/dex/profiles`, `/api/dex/search`, `/api/dex/pairs/:chainId/:pairAddress`, `/api/dex/token/:chainId/:tokenAddress`
- Crypto prices page — 2,500+ coins browsable via pagination (100/page, 25 pages), mobile-friendly card layout, clickable coins with detail panel, desktop table preserved, Fear & Greed + Market Overview widgets at top, **Gainers & Losers** section (toggle gainers/losers, 1h/24h/7d timeframe, top 10 cards with rank/icon/price/change), Meme Coins and Privacy Coins highlight sections with live prices, API-powered search across all CoinGecko coins with dropdown results
- Coin detail panel — tabbed layout with 5 tabs: **Overview** (price, 24h range, 7d sparkline, stats, ATH/ATL, sentiment, extended price changes), **Chart** (interactive Recharts area chart with price history + volume bars, 7d/30d/90d/1y timeframe selector, price change %, smart date formatting; backend `/api/coin/:id/market-chart` with tiered caching), **Info** (official links, socials, chain explorers, GitHub repos, contract addresses, quick links, developer activity, community stats, network info, DeFi ratios, CMC data), **Markets** (exchange tickers, top 50 by volume), **News** (filtered CryptoCompare articles); tab resets to Overview on coin change; all tabs lazy-loaded
- CoinMarketCap API integration — backend routes: `/api/cmc/quote/:symbol` (price, rank, dominance, volume change, 60d/90d changes; cached 5min), `/api/cmc/info/:symbol` (tags, URLs, platform info, notices; cached 10min), `/api/cmc/listings` (top coins by market cap; cached 5min)
- Watchlist page — add/remove coins, localStorage persistence, dedicated by-IDs API endpoint, search to add coins
- News feed with three tabs: Crypto (CryptoCompare), World (BBC, Al Jazeera, Sky News RSS), USA (BBC US, ABC News, NPR RSS)
- Crypto news has category filtering (Market, Business, Blockchain, Bitcoin, Ethereum, Altcoins, Research), archive mode with infinite scroll and article counts
- World and USA news auto-refreshed from RSS feeds, cached 10 minutes server-side
- Masternode tracker with collateral/ROI data
- Blog at `/blog` — full blog system with article listing, category filter, search, pagination, featured posts; single post view at `/blog/:slug` with social sharing (Twitter, Facebook, LinkedIn, copy link), view counter, related posts
- Contact form at `/contact` — name, email, subject dropdown, message; submits to DB; success confirmation
- Admin panel at `/admin` with:
  - Site analytics (page views, tracked wallets, top chains)
  - AdSense management (publisher ID, slot IDs)
  - Content moderation (pin/hide news articles)
  - General settings (toggle features, change admin password, home page selector, ChangeNOW affiliate ID)
  - **Home Page setting** — admin can choose which page loads as `/` (Explorer, Prices, Dashboard, News, Swap, Portfolio)
  - **Messages tab** — view all contact form submissions, mark read/unread, delete, unread count badge
  - **Airdrops tab** — manage submitted airdrops (approve/reject with one click, feature/unfeature, delete), filter by status, pending count badge
  - **Blog tab** — full CRUD for blog posts (title, slug, content, excerpt, category, tags, cover image, meta fields, publish/draft, featured toggle)
  - **SEO tab** — page-level SEO meta management (title, description, keywords, OG tags, canonical) for all pages; SEO score checker (title length, description length, keyword analysis); robots.txt editor
- Crypto Swap at `/swap` — full custom swap UI powered by ChangeNOW API (CHANGENOW_API_KEY env var), 900+ coins, real-time rate estimates, 3-step exchange flow (select pair → enter address → send & receive), exchange status tracking, revenue earned per transaction through API key
- **Swap Widget on Home Page** — compact ChangeNOW exchange widget on explorer/home page with currency selectors, amount input, live estimate, and "Exchange Now" button linking to full swap flow
- Live Validator Stats on `/masternodes` — real-time validator counts, total staked amounts, and staking APY for 8 major PoS chains (ETH, SOL, ATOM, ADA, DOT, AVAX, NEAR, TRX) from free public APIs, cached 5 minutes
- Crypto Exchanges directory at `/exchanges` — 50+ pre-seeded exchanges (CEX + DEX), search, filter by type, featured highlights, affiliate link support, global coverage (US, EU, Asia, Africa)
- Admin "Exchanges" tab — add/edit/delete exchanges, set affiliate URLs, toggle featured/active, seed 50+ defaults with one click
- Auto-generated sitemap.xml with all pages + published blog posts
- robots.txt configurable from admin SEO tab
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
- `GET /api/prices?page=&per_page=` - Coin market data (CoinGecko, up to 100/page, 25 pages = 2500+ coins)
- `GET /api/prices/by-ids?ids=` - Coin data by comma-separated IDs (for watchlist)
- `GET /api/search/coins?q=` - Search coins by name/symbol (CoinGecko search, cached 5min)
- `GET /api/site-settings` - Public site settings (home_page, site_title, changenow_affiliate_id)
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
- `GET /api/ada/account/:address` - Cardano address info (balance, UTXOs, stake address) via Koios
- `GET /api/ada/transactions/:address` - Cardano recent transactions via Koios
- `GET /api/ton/account/:address` - TON address info (balance, state) via Toncenter
- `GET /api/ton/transactions/:address` - TON recent transactions via Toncenter
- `GET /api/atom/account/:address` - Cosmos account balances + staking via LCD REST
- `GET /api/atom/transactions/:address` - Cosmos recent transactions via LCD REST
- `GET /api/near/account/:accountId` - NEAR account info (balance, locked, storage, contract) via RPC
- `GET /api/dot/account/:address` - Polkadot address info via Subscan
- `GET /api/dot/transactions/:address` - Polkadot recent transfers via Subscan
- `GET /api/coin/:id` - Detailed coin info from CoinGecko (price, market cap, ATH, supply, description)
- `GET /api/exchanges` - Active exchanges list (public)
- `GET /api/trending` - Trending coins
- `GET /api/news` - Crypto news (with moderation applied)
- `GET /api/masternodes` - Masternode coin data
- `POST /api/track` - Record analytics event

### Admin (requires x-admin-token header)
- `POST /api/admin/login` - Login (password set via ADMIN_PASSWORD env var)
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
- `GET /api/admin/exchanges` - All exchanges (including inactive)
- `POST /api/admin/exchanges` - Create exchange
- `PUT /api/admin/exchanges/:id` - Update exchange
- `DELETE /api/admin/exchanges/:id` - Delete exchange
- `POST /api/admin/exchanges/seed` - Seed 30 default exchanges

## Database Tables
- `users` - User accounts (varchar UUID primary key)
- `site_settings` - Key-value settings store
- `page_views` - Analytics tracking (page, wallet, chain, timestamps)
- `hidden_news` - Hidden article IDs with reason
- `pinned_news` - Pinned article IDs
- `exchanges` - Crypto exchange directory (name, url, affiliate_url, type, country, year, trading_pairs, featured, active, sort_order)

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
- `client/src/pages/exchanges.tsx` - Crypto exchanges directory (CEX/DEX, search, filter, affiliate links)
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
