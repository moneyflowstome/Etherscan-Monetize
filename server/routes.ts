import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { insertHiddenNewsSchema, insertPinnedNewsSchema, insertContactMessageSchema, insertBlogPostSchema, insertSeoMetaSchema, insertAirdropSchema } from "@shared/schema";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { XMLParser } from "fast-xml-parser";

function normalizeIp(ip: string): string {
  if (!ip) return "unknown";
  let normalized = ip.trim();
  if (normalized.startsWith("::ffff:")) normalized = normalized.slice(7);
  return normalized;
}

async function getApiKey(name: string): Promise<string> {
  const dbVal = await storage.getSetting(`api_key_${name}`);
  if (dbVal) return dbVal;
  return process.env[name] || "";
}

let ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const ETHERSCAN_BASE = "https://api.etherscan.io/v2/api";
let CMC_API_KEY = process.env.CMC_API_KEY || "";
const CMC_BASE = "https://pro-api.coinmarketcap.com";

async function refreshApiKeys() {
  ETHERSCAN_API_KEY = await getApiKey("ETHERSCAN_API_KEY");
  CMC_API_KEY = await getApiKey("CMC_API_KEY");
}

const CHAIN_IDS: Record<string, number> = {
  ethereum: 1,
  bsc: 56,
  polygon: 137,
  arbitrum: 42161,
  optimism: 10,
  base: 8453,
  avalanche: 43114,
  fantom: 250,
  cronos: 25,
  mantle: 5000,
  celo: 42220,
  zksync: 324,
  linea: 59144,
  scroll: 534352,
  flare: 14,
};

const BLOCKSCOUT_CHAINS: Record<number, string> = {
  14: "https://flare-explorer.flare.network/api",
};

const CHAIN_NAMES: Record<number, string> = Object.fromEntries(
  Object.entries(CHAIN_IDS).map(([k, v]) => [v, k])
);

async function etherscanFetch(params: Record<string, string>, chainId: number = 1) {
  const blockscoutBase = BLOCKSCOUT_CHAINS[chainId];
  if (blockscoutBase) {
    const url = new URL(blockscoutBase);
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Blockscout API error: ${res.status}`);
    return res.json();
  }
  const url = new URL(ETHERSCAN_BASE);
  url.searchParams.set("chainid", chainId.toString());
  url.searchParams.set("apikey", ETHERSCAN_API_KEY);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Etherscan API error: ${res.status}`);
  return res.json();
}

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

let priceCache: { data: any; timestamp: number; perPage: number } | null = null;
let cotdCache: { data: any[]; timestamp: number } | null = null;
const PRICE_CACHE_TTL = 60000;
const COTD_CACHE_TTL = 300000;

let newsCache: { data: any; timestamp: number } | null = null;
const NEWS_CACHE_TTL = 120000;

let trendingCache: { data: any; timestamp: number } | null = null;
const TRENDING_CACHE_TTL = 120000;

let masternodeCache: { data: any; timestamp: number } | null = null;
const MASTERNODE_CACHE_TTL = 300000;

let validatorCache: { data: any; timestamp: number } | null = null;
const VALIDATOR_CACHE_TTL = 300000;

let worldNewsCache: { data: any; timestamp: number } | null = null;
let usaNewsCache: { data: any; timestamp: number } | null = null;
const GENERAL_NEWS_CACHE_TTL = 300000;

const XRPL_RPC = "https://s1.ripple.com:51234/";
let xrplServerCache: { data: any; timestamp: number } | null = null;
const XRPL_SERVER_CACHE_TTL = 30000;

const activeSessions = new Set<string>();

function requireAdmin(req: any, res: any, next: any) {
  const token = req.headers["x-admin-token"];
  if (!token || !activeSessions.has(token as string)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  await refreshApiKeys();

  const validChainIds = new Set(Object.values(CHAIN_IDS));

  function isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  function isValidChainId(chainId: number): boolean {
    return validChainIds.has(chainId);
  }

  app.get("/api/maintenance-status", async (_req, res) => {
    try {
      const enabled = await storage.getSetting("maintenance_enabled");
      const message = await storage.getSetting("maintenance_message");
      res.json({
        enabled: enabled === "true",
        message: message || "We're currently performing scheduled maintenance. Please check back soon.",
      });
    } catch {
      res.json({ enabled: false, message: "" });
    }
  });

  app.use(async (req, res, next) => {
    if (
      req.path.startsWith("/api/admin") ||
      req.path.startsWith("/api/track") ||
      req.path === "/api/maintenance-status" ||
      req.path === "/api/site-settings" ||
      req.path === "/admin" ||
      req.path === "/ads.txt" ||
      req.path === "/robots.txt" ||
      req.path === "/sitemap.xml" ||
      req.path === "/manifest.json" ||
      req.path === "/sw.js" ||
      req.path.startsWith("/assets") ||
      req.path.startsWith("/icons")
    ) {
      return next();
    }

    try {
      const enabled = await storage.getSetting("maintenance_enabled");
      if (enabled === "true") {
        const allowedIps = await storage.getSetting("maintenance_allowed_ips");
        const clientIp = normalizeIp(req.ip || "");
        if (allowedIps) {
          const ipList = allowedIps.split(",").map(ip => ip.trim()).filter(Boolean);
          if (ipList.includes(clientIp)) {
            return next();
          }
        }

        if (req.path.startsWith("/api/")) {
          return res.status(503).json({ error: "Site is under maintenance" });
        }

        const message = await storage.getSetting("maintenance_message") || "We're currently performing scheduled maintenance. Please check back soon.";
        return res.status(503).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Maintenance - TokenAltcoin</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #0a0f1a; color: #e0e0e0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .container { text-align: center; padding: 40px; max-width: 600px; }
    .icon { width: 80px; height: 80px; margin: 0 auto 24px; border-radius: 20px; background: rgba(0,200,255,0.1); border: 1px solid rgba(0,200,255,0.3); display: flex; align-items: center; justify-content: center; font-size: 36px; }
    h1 { font-size: 28px; font-weight: 700; color: #00C8FF; margin-bottom: 12px; letter-spacing: 2px; }
    p { font-size: 16px; color: #888; line-height: 1.6; margin-bottom: 24px; }
    .msg { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; font-size: 14px; color: #aaa; }
    .footer { margin-top: 32px; font-size: 12px; color: #555; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">🔧</div>
    <h1>Under Maintenance</h1>
    <p>TokenAltcoin is temporarily unavailable</p>
    <div class="msg">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
    <div class="footer">We'll be back shortly. Thank you for your patience.</div>
  </div>
</body>
</html>`);
      }
    } catch {}

    next();
  });

  app.use((req, _res, next) => {
    if (req.path.startsWith("/api/admin") || req.path.startsWith("/api/track")) {
      return next();
    }
    const page = req.path === "/" ? "explorer" : req.path === "/wallet" ? "dashboard" : req.path.replace("/", "");
    if (["explorer", "dashboard", "prices", "news", "masternodes", "wallet"].includes(page) || req.path === "/") {
      storage.recordPageView({
        page,
        userAgent: req.headers["user-agent"] || null,
        referer: req.headers["referer"] || null,
        ip: req.ip || null,
        walletTracked: null,
        chain: null,
      }).catch(() => {});
    }
    next();
  });

  app.get("/ads.txt", async (_req, res) => {
    res.type("text/plain");
    try {
      const content = await storage.getSetting("ads_txt_content");
      res.send(content || "google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0");
    } catch {
      res.send("google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0");
    }
  });

  app.post("/api/track", (req, res) => {
    const { page, walletTracked, chain } = req.body || {};
    if (page) {
      storage.recordPageView({
        page: String(page),
        walletTracked: walletTracked ? String(walletTracked) : null,
        chain: chain ? String(chain) : null,
        userAgent: req.headers["user-agent"] || null,
        referer: req.headers["referer"] || null,
        ip: req.ip || null,
      }).catch(() => {});
    }
    res.json({ ok: true });
  });

  app.get("/api/chains", (_req, res) => {
    res.json(
      Object.entries(CHAIN_IDS).map(([name, id]) => ({ name, id }))
    );
  });

  app.get("/api/balance/:address", async (req, res) => {
    try {
      const { address } = req.params;
      const chainId = parseInt(req.query.chainId as string) || 1;
      if (!isValidAddress(address)) {
        return res.status(400).json({ error: "Invalid Ethereum address format" });
      }
      if (!isValidChainId(chainId)) {
        return res.status(400).json({ error: "Unsupported chain ID" });
      }
      const data = await etherscanFetch({
        module: "account",
        action: "balance",
        address,
        tag: "latest",
      }, chainId);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/balances/:address", async (req, res) => {
    try {
      const { address } = req.params;
      if (!isValidAddress(address)) {
        return res.status(400).json({ error: "Invalid Ethereum address format" });
      }
      const chainIdsParam = (req.query.chains as string) || "1";
      const chainIds = chainIdsParam.split(",").map(Number).filter(id => isValidChainId(id));
      const results = await Promise.allSettled(
        chainIds.map(async (chainId) => {
          const ethBalance = await etherscanFetch({
            module: "account",
            action: "balance",
            address,
            tag: "latest",
          }, chainId);
          let tokenBalances: any[] = [];
          try {
            const tokenData = await etherscanFetch({
              module: "account",
              action: "tokentx",
              address,
              page: "1",
              offset: "100",
              sort: "desc",
            }, chainId);
            if (tokenData.result && Array.isArray(tokenData.result)) {
              const uniqueTokens = new Map();
              for (const tx of tokenData.result) {
                if (!uniqueTokens.has(tx.contractAddress)) {
                  uniqueTokens.set(tx.contractAddress, {
                    contractAddress: tx.contractAddress,
                    tokenName: tx.tokenName,
                    tokenSymbol: tx.tokenSymbol,
                    tokenDecimal: tx.tokenDecimal,
                  });
                }
              }
              const tokenAddresses = Array.from(uniqueTokens.keys()).slice(0, 10);
              const balanceResults = await Promise.allSettled(
                tokenAddresses.map(async (contractAddress: string) => {
                  const bal = await etherscanFetch({
                    module: "account",
                    action: "tokenbalance",
                    contractaddress: contractAddress,
                    address,
                    tag: "latest",
                  }, chainId);
                  const tokenInfo = uniqueTokens.get(contractAddress);
                  return { ...tokenInfo, balance: bal.result || "0" };
                })
              );
              tokenBalances = balanceResults
                .filter((r) => r.status === "fulfilled")
                .map((r: any) => r.value)
                .filter((t) => t.balance !== "0");
            }
          } catch {}
          return {
            chainId,
            chainName: CHAIN_NAMES[chainId] || `Chain ${chainId}`,
            nativeBalance: ethBalance.result || "0",
            tokens: tokenBalances,
          };
        })
      );
      const balances = results
        .filter((r) => r.status === "fulfilled")
        .map((r: any) => r.value);
      res.json({ address, balances });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/transactions/:address", async (req, res) => {
    try {
      const { address } = req.params;
      const chainId = parseInt(req.query.chainId as string) || 1;
      const page = req.query.page || "1";
      const offset = req.query.offset || "20";
      if (!isValidAddress(address)) {
        return res.status(400).json({ error: "Invalid Ethereum address format" });
      }
      if (!isValidChainId(chainId)) {
        return res.status(400).json({ error: "Unsupported chain ID" });
      }
      const data = await etherscanFetch({
        module: "account",
        action: "txlist",
        address,
        startblock: "0",
        endblock: "99999999",
        page: page as string,
        offset: offset as string,
        sort: "desc",
      }, chainId);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/token-transfers/:address", async (req, res) => {
    try {
      const { address } = req.params;
      const chainId = parseInt(req.query.chainId as string) || 1;
      if (!isValidAddress(address)) {
        return res.status(400).json({ error: "Invalid Ethereum address format" });
      }
      if (!isValidChainId(chainId)) {
        return res.status(400).json({ error: "Unsupported chain ID" });
      }
      const data = await etherscanFetch({
        module: "account",
        action: "tokentx",
        address,
        page: "1",
        offset: "25",
        sort: "desc",
      }, chainId);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/gas", async (req, res) => {
    try {
      const chainId = parseInt(req.query.chainId as string) || 1;
      const data = await etherscanFetch({
        module: "gastracker",
        action: "gasoracle",
      }, chainId);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/eth-price", async (_req, res) => {
    try {
      const data = await etherscanFetch({
        module: "stats",
        action: "ethprice",
      }, 1);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/prices", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const perPage = Math.min(parseInt(req.query.per_page as string) || 50, 100);

      if (priceCache && Date.now() - priceCache.timestamp < PRICE_CACHE_TTL && page === 1 && priceCache.perPage === perPage) {
        return res.json(priceCache.data);
      }

      const url = `${COINGECKO_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=true&price_change_percentage=1h,24h,7d`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`CoinGecko API error: ${response.status}`);
      const data = await response.json();

      if (page === 1) {
        priceCache = { data, timestamp: Date.now(), perPage };
      }

      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  let fgiCache: { data: any; timestamp: number } | null = null;
  const FGI_CACHE_TTL = 600000;

  app.get("/api/fear-greed", async (_req, res) => {
    try {
      if (fgiCache && Date.now() - fgiCache.timestamp < FGI_CACHE_TTL) {
        return res.json(fgiCache.data);
      }
      const response = await fetch("https://api.alternative.me/fng/?limit=30&format=json");
      if (!response.ok) throw new Error(`Fear & Greed API error: ${response.status}`);
      const raw = await response.json();
      const result = {
        current: raw.data?.[0] ? {
          value: parseInt(raw.data[0].value),
          classification: raw.data[0].value_classification,
          timestamp: parseInt(raw.data[0].timestamp) * 1000,
        } : null,
        history: (raw.data || []).map((d: any) => ({
          value: parseInt(d.value),
          classification: d.value_classification,
          timestamp: parseInt(d.timestamp) * 1000,
        })),
      };
      fgiCache = { data: result, timestamp: Date.now() };
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/coin-of-the-day", async (req, res) => {
    try {
      let topCoins: any[] = [];
      if (cotdCache && Date.now() - cotdCache.timestamp < COTD_CACHE_TTL) {
        topCoins = cotdCache.data;
      } else {
        const url = `${COINGECKO_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`CoinGecko API error: ${response.status}`);
        topCoins = await response.json();
        cotdCache = { data: topCoins, timestamp: Date.now() };
      }

      if (!topCoins.length) {
        return res.status(503).json({ error: "No price data available" });
      }

      const today = new Date().toISOString().split("T")[0];
      let hash = 0;
      for (let i = 0; i < today.length; i++) {
        hash = ((hash << 5) - hash + today.charCodeAt(i)) | 0;
      }
      const index = Math.abs(hash) % topCoins.length;
      const coin = topCoins[index];

      res.json({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol?.toUpperCase(),
        image: coin.image,
        current_price: coin.current_price,
        price_change_percentage_24h: coin.price_change_percentage_24h,
        market_cap: coin.market_cap,
        total_volume: coin.total_volume,
        market_cap_rank: coin.market_cap_rank,
        sparkline_in_7d: coin.sparkline_in_7d,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  const byIdsCache: Record<string, { data: any; timestamp: number }> = {};
  const BY_IDS_CACHE_TTL = 120000;

  app.get("/api/prices/by-ids", async (req, res) => {
    try {
      const ids = req.query.ids as string;
      if (!ids || ids.trim().length === 0) return res.json([]);

      const idList = ids.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 50);
      if (idList.length === 0) return res.json([]);

      const cacheKey = idList.sort().join(",");
      const cached = byIdsCache[cacheKey];
      if (cached && Date.now() - cached.timestamp < BY_IDS_CACHE_TTL) {
        return res.json(cached.data);
      }

      const url = `${COINGECKO_BASE}/coins/markets?vs_currency=usd&ids=${idList.join(",")}&order=market_cap_desc&per_page=${idList.length}&page=1&sparkline=true&price_change_percentage=1h,24h,7d`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`CoinGecko API error: ${response.status}`);
      const data = await response.json();
      if (Array.isArray(data)) {
        byIdsCache[cacheKey] = { data, timestamp: Date.now() };
      }
      res.json(data);
    } catch (err: any) {
      const cacheKey = (req.query.ids as string || "").split(",").map(s => s.trim()).filter(Boolean).sort().join(",");
      const stale = byIdsCache[cacheKey];
      if (stale) return res.json(stale.data);
      if (priceCache && Array.isArray(priceCache.data)) {
        const idSet = new Set(cacheKey.split(","));
        const fromMain = priceCache.data.filter((c: any) => idSet.has(c.id));
        if (fromMain.length > 0) return res.json(fromMain);
      }
      res.status(500).json({ error: err.message });
    }
  });

  const simplePriceCache: Record<string, { data: any; timestamp: number }> = {};
  const SIMPLE_PRICE_CACHE_TTL = 60000;
  const SIMPLE_PRICE_CACHE_MAX = 20;

  const COINGECKO_TO_CMC_SLUG: Record<string, string> = {
    bitcoin: "bitcoin", ethereum: "ethereum", solana: "solana", ripple: "xrp",
    binancecoin: "bnb", dogecoin: "dogecoin", cardano: "cardano", polkadot: "polkadot-new",
    "avalanche-2": "avalanche", chainlink: "chainlink", tron: "tron", litecoin: "litecoin",
  };

  const APPROX_FIAT_FROM_USD: Record<string, number> = {
    eur: 0.92, gbp: 0.79, jpy: 149.5, cad: 1.36, aud: 1.55, chf: 0.88, inr: 83.1,
  };

  async function fetchCmcFallbackPrices(geckoIds: string[], vsCurrencies: string[]): Promise<Record<string, any> | null> {
    if (!CMC_API_KEY) return null;
    try {
      const slugs = geckoIds.map(id => COINGECKO_TO_CMC_SLUG[id]).filter(Boolean);
      if (slugs.length === 0) return null;
      const cmcUrl = `${CMC_BASE}/v2/cryptocurrency/quotes/latest?slug=${slugs.join(",")}&convert=USD`;
      const cmcRes = await fetch(cmcUrl, {
        headers: { "X-CMC_PRO_API_KEY": CMC_API_KEY, "Accept": "application/json" },
      });
      if (!cmcRes.ok) return null;
      const cmcData = await cmcRes.json();
      if (!cmcData?.data) return null;
      const result: Record<string, any> = {};
      const slugToGecko: Record<string, string> = {};
      for (const [gId, slug] of Object.entries(COINGECKO_TO_CMC_SLUG)) {
        slugToGecko[slug] = gId;
      }
      for (const coinData of Object.values(cmcData.data) as any[]) {
        const slug = coinData.slug;
        const geckoId = slugToGecko[slug];
        if (!geckoId || !geckoIds.includes(geckoId)) continue;
        const usdPrice = coinData.quote?.USD?.price;
        if (!usdPrice) continue;
        const priceObj: Record<string, number> = {};
        for (const cur of vsCurrencies) {
          if (cur === "usd") {
            priceObj.usd = usdPrice;
          } else {
            const rate = APPROX_FIAT_FROM_USD[cur];
            if (rate) priceObj[cur] = usdPrice * rate;
          }
        }
        if (Object.keys(priceObj).length > 0) result[geckoId] = priceObj;
      }
      return Object.keys(result).length > 0 ? result : null;
    } catch {
      return null;
    }
  }

  app.get("/api/prices/simple", async (req, res) => {
    try {
      const ids = (req.query.ids as string || "").split(",").map(s => s.trim()).filter(Boolean).slice(0, 30);
      const vs = (req.query.vs_currencies as string || "usd").split(",").map(s => s.trim()).filter(Boolean);
      if (ids.length === 0) return res.json({});

      const cacheKey = `${ids.sort().join(",")}|${vs.sort().join(",")}`;
      const cached = simplePriceCache[cacheKey];
      if (cached && Date.now() - cached.timestamp < SIMPLE_PRICE_CACHE_TTL) {
        return res.json(cached.data);
      }

      const url = `${COINGECKO_BASE}/simple/price?ids=${ids.join(",")}&vs_currencies=${vs.join(",")}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`CoinGecko ${response.status}`);
      const data = await response.json();
      if (data && typeof data === "object" && !data.error) {
        if (Object.keys(simplePriceCache).length >= SIMPLE_PRICE_CACHE_MAX) {
          const oldest = Object.entries(simplePriceCache).sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
          if (oldest) delete simplePriceCache[oldest[0]];
        }
        simplePriceCache[cacheKey] = { data, timestamp: Date.now() };
        return res.json(data);
      }
      throw new Error("Invalid CoinGecko response");
    } catch (err: any) {
      const ids = (req.query.ids as string || "").split(",").map(s => s.trim()).filter(Boolean);
      const vs = (req.query.vs_currencies as string || "usd").split(",").map(s => s.trim()).filter(Boolean);
      const cacheKey = `${ids.sort().join(",")}|${vs.sort().join(",")}`;
      const stale = simplePriceCache[cacheKey];
      if (stale) return res.json(stale.data);

      const cmcData = await fetchCmcFallbackPrices(ids, vs);
      if (cmcData) {
        simplePriceCache[cacheKey] = { data: cmcData, timestamp: Date.now() };
        return res.json(cmcData);
      }

      res.status(500).json({ error: err.message });
    }
  });

  let searchCache: { query: string; data: any; timestamp: number } | null = null;
  const SEARCH_CACHE_TTL = 300000;

  app.get("/api/search/coins", async (req, res) => {
    try {
      const query = (req.query.q as string || "").trim();
      if (!query || query.length < 1) return res.json([]);

      if (searchCache && searchCache.query === query.toLowerCase() && Date.now() - searchCache.timestamp < SEARCH_CACHE_TTL) {
        return res.json(searchCache.data);
      }

      try {
        const url = `${COINGECKO_BASE}/search?query=${encodeURIComponent(query)}`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          const coins = (data.coins || []).slice(0, 20).map((c: any) => ({
            id: c.id,
            name: c.name,
            symbol: c.symbol,
            thumb: c.thumb,
            large: c.large,
            market_cap_rank: c.market_cap_rank,
          }));
          searchCache = { query: query.toLowerCase(), data: coins, timestamp: Date.now() };
          return res.json(coins);
        }
      } catch {}

      if (priceCache && priceCache.data) {
        const q = query.toLowerCase();
        const allCoins = Array.isArray(priceCache.data) ? priceCache.data : [];
        const filtered = allCoins.filter((c: any) =>
          c.name?.toLowerCase().includes(q) || c.symbol?.toLowerCase().includes(q)
        ).slice(0, 20).map((c: any) => ({
          id: c.id,
          name: c.name,
          symbol: c.symbol,
          thumb: c.image,
          image: c.image,
          market_cap_rank: c.market_cap_rank,
        }));
        return res.json(filtered);
      }

      try {
        const warmUrl = `${COINGECKO_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1`;
        const warmRes = await fetch(warmUrl);
        if (warmRes.ok) {
          const warmData = await warmRes.json();
          if (Array.isArray(warmData)) {
            priceCache = { data: warmData, timestamp: Date.now(), perPage: 100 };
            const q = query.toLowerCase();
            const filtered = warmData.filter((c: any) =>
              c.name?.toLowerCase().includes(q) || c.symbol?.toLowerCase().includes(q)
            ).slice(0, 20).map((c: any) => ({
              id: c.id, name: c.name, symbol: c.symbol,
              thumb: c.image, image: c.image, market_cap_rank: c.market_cap_rank,
            }));
            return res.json(filtered);
          }
        }
      } catch {}

      res.json([]);
    } catch (err: any) {
      res.json([]);
    }
  });

  app.get("/api/site-settings", async (_req, res) => {
    try {
      const settings = await storage.getAllSettings();
      const settingsMap: Record<string, string> = {};
      const publicKeys = ["home_page", "site_title", "changenow_affiliate_id"];
      for (const s of settings) {
        if (s.key.startsWith("api_key_") || s.key === "admin_password_hash" || s.key.startsWith("maintenance_")) continue;
        if (publicKeys.includes(s.key) || s.key.endsWith("_enabled")) {
          settingsMap[s.key] = s.value;
        }
      }
      res.json(settingsMap);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/trending", async (_req, res) => {
    try {
      if (trendingCache && Date.now() - trendingCache.timestamp < TRENDING_CACHE_TTL) {
        return res.json(trendingCache.data);
      }

      const url = `${COINGECKO_BASE}/search/trending`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`CoinGecko API error: ${response.status}`);
      const data = await response.json();

      trendingCache = { data, timestamp: Date.now() };
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/news", async (_req, res) => {
    try {
      if (newsCache && Date.now() - newsCache.timestamp < NEWS_CACHE_TTL) {
        const hiddenArticles = await storage.getHiddenArticles();
        const pinnedArticles = await storage.getPinnedArticles();
        const hiddenIds = new Set(hiddenArticles.map((a) => a.articleId));
        const pinnedIds = new Set(pinnedArticles.map((a) => a.articleId));

        const filtered = newsCache.data.articles.filter(
          (a: any) => !hiddenIds.has(String(a.id))
        );
        const pinned = filtered.filter((a: any) => pinnedIds.has(String(a.id)));
        const rest = filtered.filter((a: any) => !pinnedIds.has(String(a.id)));

        return res.json({ articles: [...pinned, ...rest], timestamp: newsCache.data.timestamp });
      }

      const feeds = [
        { url: "https://min-api.cryptocompare.com/data/v2/news/?lang=EN&sortOrder=popular", source: "cryptocompare" },
      ];

      let articles: any[] = [];

      for (const feed of feeds) {
        try {
          const response = await fetch(feed.url);
          if (response.ok) {
            const data = await response.json();
            if (data.Data && Array.isArray(data.Data)) {
              articles = data.Data.slice(0, 30).map((item: any) => ({
                id: item.id,
                title: item.title,
                body: item.body?.substring(0, 200) + "...",
                url: item.url,
                imageUrl: item.imageurl,
                source: item.source_info?.name || item.source,
                publishedAt: item.published_on * 1000,
                categories: item.categories,
                tags: item.tags?.split("|").slice(0, 5) || [],
              }));
            }
          }
        } catch {}
      }

      const rawResult = { articles, timestamp: Date.now() };
      newsCache = { data: rawResult, timestamp: Date.now() };

      const hiddenArticles = await storage.getHiddenArticles();
      const pinnedArticles = await storage.getPinnedArticles();
      const hiddenIds = new Set(hiddenArticles.map((a) => a.articleId));
      const pinnedIds = new Set(pinnedArticles.map((a) => a.articleId));

      const filtered = articles.filter((a) => !hiddenIds.has(String(a.id)));
      const pinned = filtered.filter((a) => pinnedIds.has(String(a.id)));
      const rest = filtered.filter((a) => !pinnedIds.has(String(a.id)));

      res.json({ articles: [...pinned, ...rest], timestamp: Date.now() });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/news/archive", async (req, res) => {
    try {
      const before = parseInt(req.query.before as string) || 0;
      let url = "https://min-api.cryptocompare.com/data/v2/news/?lang=EN&sortOrder=latest";
      if (before > 0) {
        url += `&lTs=${Math.floor(before / 1000)}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error(`CryptoCompare API error: ${response.status}`);
      const data = await response.json();

      let articles: any[] = [];
      if (data.Data && Array.isArray(data.Data)) {
        articles = data.Data.slice(0, 50).map((item: any) => ({
          id: item.id,
          title: item.title,
          body: item.body?.substring(0, 200) + "...",
          url: item.url,
          imageUrl: item.imageurl,
          source: item.source_info?.name || item.source,
          publishedAt: item.published_on * 1000,
          categories: item.categories,
          tags: item.tags?.split("|").slice(0, 5) || [],
        }));
      }

      const hiddenArticles = await storage.getHiddenArticles();
      const hiddenIds = new Set(hiddenArticles.map((a) => a.articleId));
      const filtered = articles.filter((a) => !hiddenIds.has(String(a.id)));

      res.json({ articles: filtered, timestamp: Date.now() });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  const xmlParser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

  async function fetchRssNews(feeds: { url: string; region: string }[]): Promise<any[]> {
    const articles: any[] = [];
    for (const feed of feeds) {
      try {
        const response = await fetch(feed.url, {
          headers: { "User-Agent": "TokenAltcoin/1.0" },
        });
        if (!response.ok) continue;
        const xml = await response.text();
        const parsed = xmlParser.parse(xml);
        const channel = parsed?.rss?.channel;
        if (!channel?.item) continue;
        const items = Array.isArray(channel.item) ? channel.item : [channel.item];
        for (const item of items.slice(0, 30)) {
          const pubDate = item.pubDate ? new Date(item.pubDate).getTime() : Date.now();
          let imageUrl = "";
          if (item["media:content"]?.["@_url"]) {
            imageUrl = item["media:content"]["@_url"];
          } else if (item["media:thumbnail"]?.["@_url"]) {
            imageUrl = item["media:thumbnail"]["@_url"];
          } else if (item.enclosure?.["@_url"]) {
            imageUrl = item.enclosure["@_url"];
          }
          const description = typeof item.description === "string"
            ? item.description.replace(/<[^>]*>/g, "").substring(0, 200)
            : "";
          articles.push({
            id: `${feed.region}-${pubDate}-${articles.length}`,
            title: item.title || "",
            body: description + (description.length >= 200 ? "..." : ""),
            url: item.link || "",
            imageUrl,
            source: channel.title || feed.region,
            publishedAt: pubDate,
            categories: feed.region.toUpperCase(),
            tags: [],
            region: feed.region,
          });
        }
      } catch {}
    }
    articles.sort((a, b) => b.publishedAt - a.publishedAt);
    return articles;
  }

  app.get("/api/news/world", async (_req, res) => {
    try {
      if (worldNewsCache && Date.now() - worldNewsCache.timestamp < GENERAL_NEWS_CACHE_TTL) {
        return res.json(worldNewsCache.data);
      }

      const feeds = [
        { url: "https://feeds.bbci.co.uk/news/world/rss.xml", region: "World" },
        { url: "https://www.aljazeera.com/xml/rss/all.xml", region: "World" },
        { url: "https://feeds.skynews.com/feeds/rss/world.xml", region: "World" },
      ];

      const articles = await fetchRssNews(feeds);
      const result = { articles: articles.slice(0, 50), timestamp: Date.now() };
      worldNewsCache = { data: result, timestamp: Date.now() };
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/news/usa", async (_req, res) => {
    try {
      if (usaNewsCache && Date.now() - usaNewsCache.timestamp < GENERAL_NEWS_CACHE_TTL) {
        return res.json(usaNewsCache.data);
      }

      const feeds = [
        { url: "https://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml", region: "USA" },
        { url: "https://abcnews.go.com/abcnews/usheadlines", region: "USA" },
        { url: "https://feeds.npr.org/1001/rss.xml", region: "USA" },
      ];

      const articles = await fetchRssNews(feeds);
      const result = { articles: articles.slice(0, 50), timestamp: Date.now() };
      usaNewsCache = { data: result, timestamp: Date.now() };
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  const braveSearchCache: Record<string, { data: any; timestamp: number }> = {};
  const BRAVE_SEARCH_CACHE_TTL = 300000;

  app.get("/api/news/search", async (req, res) => {
    try {
      const q = (req.query.q as string) || "cryptocurrency";
      const cacheKey = `brave-search-${q.toLowerCase().trim()}`;

      if (braveSearchCache[cacheKey] && Date.now() - braveSearchCache[cacheKey].timestamp < BRAVE_SEARCH_CACHE_TTL) {
        return res.json(braveSearchCache[cacheKey].data);
      }

      let articles: any[] = [];
      let source = "brave";

      let braveKey = await getApiKey("BRAVE_API_KEY");
      if (braveKey && !braveKey.endsWith("-")) braveKey = braveKey + "-";
      if (braveKey) {
        try {
          const response = await fetch(
            `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(q + " crypto news")}&count=20`,
            {
              headers: {
                "Accept": "application/json",
                "Accept-Encoding": "gzip",
                "X-Subscription-Token": braveKey,
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            const webResults = data.web?.results || [];
            articles = webResults.map((item: any) => ({
              id: item.url,
              title: item.title,
              body: item.description || "",
              url: item.url,
              imageUrl: item.thumbnail?.src || null,
              source: (item.meta_url?.hostname || new URL(item.url).hostname).replace("www.", ""),
              publishedAt: item.age ? Date.now() : Date.now(),
              categories: "crypto",
              tags: [],
            }));
          }
        } catch {}
      }

      if (articles.length === 0) {
        try {
          const ccUrl = `https://min-api.cryptocompare.com/data/v2/news/?lang=EN&sortOrder=popular&categories=${encodeURIComponent(q)}`;
          const ccRes = await fetch(ccUrl);
          if (ccRes.ok) {
            const ccData = await ccRes.json();
            if (ccData.Data && Array.isArray(ccData.Data)) {
              const keyword = q.toLowerCase();
              const filtered = ccData.Data.filter((item: any) => {
                const text = `${item.title || ""} ${item.body || ""} ${item.categories || ""} ${item.tags || ""}`.toLowerCase();
                return text.includes(keyword);
              });
              articles = (filtered.length > 0 ? filtered : ccData.Data).slice(0, 20).map((item: any) => ({
                id: item.id,
                title: item.title,
                body: item.body?.substring(0, 200) + "...",
                url: item.url,
                imageUrl: item.imageurl,
                source: item.source_info?.name || item.source,
                publishedAt: item.published_on * 1000,
                categories: item.categories,
                tags: item.tags?.split("|").slice(0, 5) || [],
              }));
              source = "cryptocompare";
            }
          }
        } catch {}
      }

      const result = { articles, source, timestamp: Date.now() };
      braveSearchCache[cacheKey] = { data: result, timestamp: Date.now() };
      res.json(result);
    } catch (err: any) {
      const cacheKey = `brave-search-${((req.query.q as string) || "cryptocurrency").toLowerCase().trim()}`;
      if (braveSearchCache[cacheKey]) return res.json(braveSearchCache[cacheKey].data);
      res.json({ articles: [], source: "fallback", error: err.message });
    }
  });

  async function xrplRequest(method: string, params: any[] = [{}]) {
    const response = await fetch(XRPL_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method, params }),
    });
    if (!response.ok) throw new Error(`XRPL API error: ${response.status}`);
    const data = await response.json();
    if (data.result?.error) {
      throw new Error(data.result.error_message || data.result.error);
    }
    return data.result;
  }

  app.get("/api/xrpl/account/:address", async (req, res) => {
    try {
      const { address } = req.params;
      if (!address || !address.startsWith("r") || address.length < 25 || address.length > 35) {
        return res.status(400).json({ error: "Invalid XRP address" });
      }

      const result = await xrplRequest("account_info", [{
        account: address,
        ledger_index: "validated",
        queue: true,
      }]);

      const acct = result.account_data;
      const dropsToXrp = (drops: string) => (parseInt(drops) / 1000000).toFixed(6);

      res.json({
        address: acct.Account,
        balance: dropsToXrp(acct.Balance),
        balanceDrops: acct.Balance,
        sequence: acct.Sequence,
        ownerCount: acct.OwnerCount,
        flags: acct.Flags,
        previousTxnId: acct.PreviousTxnID,
        index: acct.index,
        reserve: {
          base: 10,
          owner: acct.OwnerCount * 2,
          total: 10 + acct.OwnerCount * 2,
        },
      });
    } catch (err: any) {
      const msg = err.message || "Failed to fetch account";
      if (msg.includes("actNotFound")) {
        return res.status(404).json({ error: "Account not found on the XRP Ledger" });
      }
      res.status(500).json({ error: msg });
    }
  });

  app.get("/api/xrpl/transactions/:address", async (req, res) => {
    try {
      const { address } = req.params;
      if (!address || !address.startsWith("r") || address.length < 25 || address.length > 35) {
        return res.status(400).json({ error: "Invalid XRP address" });
      }

      const result = await xrplRequest("account_tx", [{
        account: address,
        ledger_index_min: -1,
        ledger_index_max: -1,
        limit: 20,
        forward: false,
      }]);

      const dropsToXrp = (drops: string | number) => {
        const n = typeof drops === "string" ? parseInt(drops) : drops;
        return (n / 1000000).toFixed(6);
      };

      const transactions = (result.transactions || []).map((tx: any) => {
        const t = tx.tx || tx.tx_json || {};
        const meta = tx.meta || {};
        return {
          hash: t.hash || tx.hash,
          type: t.TransactionType,
          from: t.Account,
          to: t.Destination || null,
          amount: t.Amount ? (typeof t.Amount === "string" ? dropsToXrp(t.Amount) : `${t.Amount.value} ${t.Amount.currency}`) : null,
          fee: t.Fee ? dropsToXrp(t.Fee) : null,
          date: t.date ? (t.date + 946684800) * 1000 : null,
          ledgerIndex: t.ledger_index || tx.ledger_index,
          result: meta.TransactionResult || "unknown",
          successful: meta.TransactionResult === "tesSUCCESS",
        };
      });

      res.json({ transactions, address });
    } catch (err: any) {
      const msg = err.message || "Failed to fetch transactions";
      if (msg.includes("actNotFound")) return res.status(404).json({ error: "Account not found on the XRP Ledger" });
      if (msg.includes("actMalformed") || msg.includes("invalidParams")) return res.status(400).json({ error: "Invalid XRP address format" });
      res.status(500).json({ error: msg });
    }
  });

  app.get("/api/xrpl/tokens/:address", async (req, res) => {
    try {
      const { address } = req.params;
      if (!address || !address.startsWith("r") || address.length < 25 || address.length > 35) {
        return res.status(400).json({ error: "Invalid XRP address" });
      }

      const result = await xrplRequest("account_lines", [{
        account: address,
        ledger_index: "validated",
      }]);

      const tokens = (result.lines || []).map((line: any) => ({
        currency: line.currency,
        balance: line.balance,
        issuer: line.account,
        limit: line.limit,
        qualityIn: line.quality_in,
        qualityOut: line.quality_out,
        noRipple: line.no_ripple || false,
        freeze: line.freeze || false,
      }));

      res.json({ tokens, address });
    } catch (err: any) {
      const msg = err.message || "Failed to fetch tokens";
      if (msg.includes("actNotFound")) return res.status(404).json({ error: "Account not found on the XRP Ledger" });
      if (msg.includes("actMalformed") || msg.includes("invalidParams")) return res.status(400).json({ error: "Invalid XRP address format" });
      res.status(500).json({ error: msg });
    }
  });

  app.get("/api/xrpl/nfts/:address", async (req, res) => {
    try {
      const { address } = req.params;
      if (!address || !address.startsWith("r") || address.length < 25 || address.length > 35) {
        return res.status(400).json({ error: "Invalid XRP address" });
      }

      const result = await xrplRequest("account_nfts", [{
        account: address,
        ledger_index: "validated",
      }]);

      const nfts = (result.account_nfts || []).map((nft: any) => ({
        tokenId: nft.NFTokenID,
        issuer: nft.Issuer,
        taxon: nft.NFTokenTaxon,
        serial: nft.nft_serial,
        uri: nft.URI ? Buffer.from(nft.URI, "hex").toString("utf-8") : null,
        flags: nft.Flags,
        transferFee: nft.TransferFee,
      }));

      res.json({ nfts, address, count: nfts.length });
    } catch (err: any) {
      const msg = err.message || "Failed to fetch NFTs";
      if (msg.includes("actNotFound")) return res.status(404).json({ error: "Account not found on the XRP Ledger" });
      if (msg.includes("actMalformed") || msg.includes("invalidParams")) return res.status(400).json({ error: "Invalid XRP address format" });
      res.status(500).json({ error: msg });
    }
  });

  app.get("/api/xrpl/server", async (_req, res) => {
    try {
      if (xrplServerCache && Date.now() - xrplServerCache.timestamp < XRPL_SERVER_CACHE_TTL) {
        return res.json(xrplServerCache.data);
      }

      const result = await xrplRequest("server_info", [{}]);
      const info = result.info;

      const data = {
        buildVersion: info.build_version,
        completeLedgers: info.complete_ledgers,
        hostId: info.hostid,
        serverState: info.server_state,
        validatedLedger: {
          age: info.validated_ledger?.age,
          hash: info.validated_ledger?.hash,
          sequence: info.validated_ledger?.seq,
          reserveBase: info.validated_ledger?.reserve_base_xrp,
          reserveInc: info.validated_ledger?.reserve_inc_xrp,
          baseFee: info.validated_ledger?.base_fee_xrp,
        },
        loadFactor: info.load_factor,
        peers: info.peers,
        uptime: info.uptime,
        time: info.time,
      };

      xrplServerCache = { data, timestamp: Date.now() };
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  const SOLANA_RPC = "https://api.mainnet-beta.solana.com";

  async function solanaRpcRequest(method: string, params: any[]) {
    const response = await fetch(SOLANA_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method,
        params,
      }),
    });
    if (!response.ok) throw new Error(`Solana RPC error: ${response.status}`);
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message || "Solana RPC error");
    }
    return data.result;
  }

  app.get("/api/sol/account/:address", async (req, res) => {
    try {
      const { address } = req.params;
      if (!address || address.length < 32 || address.length > 44) {
        return res.status(400).json({ error: "Invalid Solana address" });
      }

      const result = await solanaRpcRequest("getBalance", [address]);

      const lamports = result.value;
      const sol = lamports / 1e9;

      res.json({
        address,
        lamports,
        balance: sol.toFixed(9),
        slot: result.context?.slot || null,
      });
    } catch (err: any) {
      const msg = err.message || "Failed to fetch Solana account";
      if (msg.includes("Invalid param") || msg.includes("invalid")) return res.status(400).json({ error: "Invalid Solana address format" });
      res.status(500).json({ error: msg });
    }
  });

  app.get("/api/sol/transactions/:address", async (req, res) => {
    try {
      const { address } = req.params;
      if (!address || address.length < 32 || address.length > 44) {
        return res.status(400).json({ error: "Invalid Solana address" });
      }

      const signatures = await solanaRpcRequest("getSignaturesForAddress", [
        address,
        { limit: 15 },
      ]);

      const transactions = (signatures || []).map((sig: any) => ({
        signature: sig.signature,
        slot: sig.slot,
        blockTime: sig.blockTime,
        confirmationStatus: sig.confirmationStatus,
        err: sig.err,
        memo: sig.memo || null,
      }));

      res.json({ address, transactions });
    } catch (err: any) {
      const msg = err.message || "Failed to fetch Solana transactions";
      if (msg.includes("Invalid param") || msg.includes("invalid")) return res.status(400).json({ error: "Invalid Solana address format" });
      res.status(500).json({ error: msg });
    }
  });

  app.get("/api/sol/tokens/:address", async (req, res) => {
    try {
      const { address } = req.params;
      if (!address || address.length < 32 || address.length > 44) {
        return res.status(400).json({ error: "Invalid Solana address" });
      }

      const result = await solanaRpcRequest("getTokenAccountsByOwner", [
        address,
        { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
        { encoding: "jsonParsed" },
      ]);

      const tokens = (result.value || [])
        .map((item: any) => {
          const info = item.account?.data?.parsed?.info;
          if (!info) return null;
          const amount = info.tokenAmount;
          if (!amount || parseFloat(amount.uiAmountString || "0") === 0) return null;
          return {
            mint: info.mint,
            balance: amount.uiAmountString || "0",
            decimals: amount.decimals || 0,
            rawAmount: amount.amount || "0",
          };
        })
        .filter(Boolean);

      res.json({ address, tokens });
    } catch (err: any) {
      const msg = err.message || "Failed to fetch SPL tokens";
      res.status(500).json({ error: msg });
    }
  });

  const BLOCKSTREAM_BASE = "https://blockstream.info/api";

  app.get("/api/btc/address/:address", async (req, res) => {
    try {
      const { address } = req.params;
      if (!address || address.length < 26 || address.length > 62) {
        return res.status(400).json({ error: "Invalid Bitcoin address" });
      }

      const response = await fetch(`${BLOCKSTREAM_BASE}/address/${address}`);
      if (!response.ok) {
        if (response.status === 400) return res.status(400).json({ error: "Invalid Bitcoin address" });
        throw new Error(`Blockstream API error: ${response.status}`);
      }
      const data = await response.json();

      const funded = data.chain_stats.funded_txo_sum + (data.mempool_stats?.funded_txo_sum || 0);
      const spent = data.chain_stats.spent_txo_sum + (data.mempool_stats?.spent_txo_sum || 0);
      const balanceSats = funded - spent;
      const txCount = data.chain_stats.tx_count + (data.mempool_stats?.tx_count || 0);

      res.json({
        address: data.address,
        balance: (balanceSats / 100000000).toFixed(8),
        balanceSats,
        txCount,
        funded: (funded / 100000000).toFixed(8),
        spent: (spent / 100000000).toFixed(8),
        fundedSats: funded,
        spentSats: spent,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/btc/transactions/:address", async (req, res) => {
    try {
      const { address } = req.params;
      if (!address || address.length < 26 || address.length > 62) {
        return res.status(400).json({ error: "Invalid Bitcoin address" });
      }

      const response = await fetch(`${BLOCKSTREAM_BASE}/address/${address}/txs`);
      if (!response.ok) {
        if (response.status === 400) return res.status(400).json({ error: "Invalid Bitcoin address" });
        throw new Error(`Blockstream API error: ${response.status}`);
      }
      const txs = await response.json();

      const transactions = txs.slice(0, 15).map((tx: any) => {
        let totalInput = 0;
        let totalOutput = 0;
        let fromAddresses: string[] = [];
        let toAddresses: string[] = [];

        for (const vin of tx.vin || []) {
          if (vin.prevout) {
            totalInput += vin.prevout.value;
            if (vin.prevout.scriptpubkey_address) {
              fromAddresses.push(vin.prevout.scriptpubkey_address);
            }
          }
        }

        for (const vout of tx.vout || []) {
          totalOutput += vout.value;
          if (vout.scriptpubkey_address) {
            toAddresses.push(vout.scriptpubkey_address);
          }
        }

        const fee = totalInput > 0 ? Math.max(0, totalInput - totalOutput) : 0;

        return {
          txid: tx.txid,
          confirmed: tx.status?.confirmed || false,
          blockHeight: tx.status?.block_height || null,
          blockTime: tx.status?.block_time || null,
          fee: (fee / 100000000).toFixed(8),
          feeSats: fee,
          totalInput: (totalInput / 100000000).toFixed(8),
          totalOutput: (totalOutput / 100000000).toFixed(8),
          from: Array.from(new Set(fromAddresses)).slice(0, 5),
          to: Array.from(new Set(toAddresses)).slice(0, 5),
          size: tx.size || null,
          weight: tx.weight || null,
        };
      });

      res.json({ address, transactions });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  const BLOCKCYPHER_DOGE_BASE = "https://api.blockcypher.com/v1/doge/main";

  function isValidDogeAddress(address: string): boolean {
    return /^[DA9][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address);
  }

  app.get("/api/doge/address/:address", async (req, res) => {
    try {
      const { address } = req.params;
      if (!isValidDogeAddress(address)) {
        return res.status(400).json({ error: "Invalid Dogecoin address. Must start with D, A, or 9 and be 26-35 characters." });
      }

      const response = await fetch(`${BLOCKCYPHER_DOGE_BASE}/addrs/${address}/balance`);
      if (!response.ok) {
        if (response.status === 400) return res.status(400).json({ error: "Invalid Dogecoin address" });
        throw new Error(`Blockcypher API error: ${response.status}`);
      }
      const data = await response.json();

      res.json({
        address: data.address,
        balance: (data.balance / 100000000).toFixed(8),
        balanceSats: data.balance,
        totalReceived: (data.total_received / 100000000).toFixed(8),
        totalReceivedSats: data.total_received,
        totalSent: (data.total_sent / 100000000).toFixed(8),
        totalSentSats: data.total_sent,
        txCount: data.n_tx,
        unconfirmedBalance: (data.unconfirmed_balance / 100000000).toFixed(8),
        unconfirmedTxCount: data.unconfirmed_n_tx,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/doge/transactions/:address", async (req, res) => {
    try {
      const { address } = req.params;
      if (!isValidDogeAddress(address)) {
        return res.status(400).json({ error: "Invalid Dogecoin address. Must start with D and be 26-35 characters." });
      }

      const response = await fetch(`${BLOCKCYPHER_DOGE_BASE}/addrs/${address}?limit=15`);
      if (!response.ok) {
        if (response.status === 400) return res.status(400).json({ error: "Invalid Dogecoin address" });
        throw new Error(`Blockcypher API error: ${response.status}`);
      }
      const data = await response.json();

      const transactions = (data.txrefs || []).map((tx: any) => ({
        txid: tx.tx_hash,
        blockHeight: tx.block_height,
        value: (tx.value / 100000000).toFixed(8),
        valueSats: tx.value,
        confirmed: tx.confirmations > 0,
        confirmations: tx.confirmations,
        time: tx.confirmed ? new Date(tx.confirmed).getTime() : null,
        confirmedAt: tx.confirmed || null,
        txInputN: tx.tx_input_n,
        txOutputN: tx.tx_output_n,
        spent: tx.spent || false,
        doubleSpend: tx.double_spend || false,
      }));

      res.json({ address: data.address, transactions });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  const coinInfoCache: Record<string, { data: any; timestamp: number }> = {};
  const COIN_INFO_CACHE_TTL = 300000;

  app.get("/api/coin/:id", async (req, res) => {
    try {
      const { id } = req.params;
      if (!id || !/^[a-z0-9\-]+$/.test(id)) {
        return res.status(400).json({ error: "Invalid coin ID" });
      }

      const cached = coinInfoCache[id];
      if (cached && Date.now() - cached.timestamp < COIN_INFO_CACHE_TTL) {
        return res.json(cached.data);
      }

      const url = `${COINGECKO_BASE}/coins/${id}?localization=false&tickers=false&community_data=true&developer_data=true`;
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 404) return res.status(404).json({ error: "Coin not found" });
        if (cached) return res.json(cached.data);
        throw new Error(`CoinGecko API error: ${response.status}`);
      }
      const raw = await response.json();

      const md = raw.market_data || {};
      const desc = raw.description?.en || "";
      const data = {
        id: raw.id,
        name: raw.name,
        symbol: raw.symbol,
        image: raw.image?.large || raw.image?.small || null,
        current_price: md.current_price?.usd ?? null,
        market_cap: md.market_cap?.usd ?? null,
        market_cap_rank: raw.market_cap_rank ?? null,
        total_volume: md.total_volume?.usd ?? null,
        price_change_24h: md.price_change_24h ?? null,
        price_change_percentage_24h: md.price_change_percentage_24h ?? null,
        price_change_percentage_1h: md.price_change_percentage_1h_in_currency?.usd ?? null,
        price_change_percentage_7d: md.price_change_percentage_7d_in_currency?.usd ?? null,
        price_change_percentage_14d: md.price_change_percentage_14d ?? null,
        price_change_percentage_30d: md.price_change_percentage_30d ?? null,
        price_change_percentage_60d: md.price_change_percentage_60d ?? null,
        price_change_percentage_200d: md.price_change_percentage_200d ?? null,
        price_change_percentage_1y: md.price_change_percentage_1y ?? null,
        market_cap_change_24h: md.market_cap_change_24h ?? null,
        market_cap_change_percentage_24h: md.market_cap_change_percentage_24h ?? null,
        market_cap_fdv_ratio: md.market_cap_fdv_ratio ?? null,
        total_value_locked: md.total_value_locked?.usd ?? null,
        mcap_to_tvl_ratio: md.mcap_to_tvl_ratio ?? null,
        fdv_to_tvl_ratio: md.fdv_to_tvl_ratio ?? null,
        roi: md.roi ? { times: md.roi.times, currency: md.roi.currency, percentage: md.roi.percentage } : null,
        ath: md.ath?.usd ?? null,
        ath_date: md.ath_date?.usd ?? null,
        ath_change_percentage: md.ath_change_percentage?.usd ?? null,
        atl: md.atl?.usd ?? null,
        atl_date: md.atl_date?.usd ?? null,
        atl_change_percentage: md.atl_change_percentage?.usd ?? null,
        high_24h: md.high_24h?.usd ?? null,
        low_24h: md.low_24h?.usd ?? null,
        fully_diluted_valuation: md.fully_diluted_valuation?.usd ?? null,
        circulating_supply: md.circulating_supply ?? null,
        total_supply: md.total_supply ?? null,
        max_supply: md.max_supply ?? null,
        max_supply_infinite: md.max_supply_infinite ?? false,
        description: desc.substring(0, 3000),
        categories: (raw.categories || []).filter(Boolean),
        genesis_date: raw.genesis_date || null,
        hashing_algorithm: raw.hashing_algorithm || null,
        block_time_in_minutes: raw.block_time_in_minutes || null,
        country_origin: raw.country_origin || null,
        sentiment_votes_up_percentage: raw.sentiment_votes_up_percentage ?? null,
        sentiment_votes_down_percentage: raw.sentiment_votes_down_percentage ?? null,
        watchlist_portfolio_users: raw.watchlist_portfolio_users ?? null,
        public_notice: raw.public_notice || null,
        additional_notices: raw.additional_notices || [],
        last_updated: raw.last_updated || null,
        community_data: raw.community_data ? {
          reddit_subscribers: raw.community_data.reddit_subscribers ?? null,
          reddit_accounts_active_48h: raw.community_data.reddit_accounts_active_48h ?? null,
          reddit_average_posts_48h: raw.community_data.reddit_average_posts_48h ?? null,
          reddit_average_comments_48h: raw.community_data.reddit_average_comments_48h ?? null,
          telegram_channel_user_count: raw.community_data.telegram_channel_user_count ?? null,
          facebook_likes: raw.community_data.facebook_likes ?? null,
        } : null,
        developer_data: raw.developer_data ? {
          forks: raw.developer_data.forks ?? null,
          stars: raw.developer_data.stars ?? null,
          subscribers: raw.developer_data.subscribers ?? null,
          total_issues: raw.developer_data.total_issues ?? null,
          closed_issues: raw.developer_data.closed_issues ?? null,
          pull_requests_merged: raw.developer_data.pull_requests_merged ?? null,
          pull_request_contributors: raw.developer_data.pull_request_contributors ?? null,
          code_additions_deletions_4_weeks: raw.developer_data.code_additions_deletions_4_weeks || null,
          commit_count_4_weeks: raw.developer_data.commit_count_4_weeks ?? null,
        } : null,
        links: {
          homepage: raw.links?.homepage?.filter(Boolean) || [],
          whitepaper: raw.links?.whitepaper || null,
          blockchain_site: raw.links?.blockchain_site?.filter(Boolean) || [],
          official_forum_url: raw.links?.official_forum_url?.filter(Boolean) || [],
          chat_url: raw.links?.chat_url?.filter(Boolean) || [],
          announcement_url: raw.links?.announcement_url?.filter(Boolean) || [],
          snapshot_url: raw.links?.snapshot_url || null,
          subreddit_url: raw.links?.subreddit_url || null,
          twitter_screen_name: raw.links?.twitter_screen_name || null,
          facebook_username: raw.links?.facebook_username || null,
          bitcointalk_thread_identifier: raw.links?.bitcointalk_thread_identifier || null,
          telegram_channel_identifier: raw.links?.telegram_channel_identifier || null,
          repos_url: {
            github: (raw.links?.repos_url?.github || []).filter(Boolean),
            bitbucket: (raw.links?.repos_url?.bitbucket || []).filter(Boolean),
          },
        },
        platforms: raw.platforms || {},
        detail_platforms: raw.detail_platforms || {},
        asset_platform_id: raw.asset_platform_id || null,
      };

      coinInfoCache[id] = { data, timestamp: Date.now() };
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  const tickerCache: Record<string, { data: any; timestamp: number }> = {};
  const TICKER_CACHE_TTL = 120000;

  app.get("/api/coin/:id/tickers", async (req, res) => {
    try {
      const { id } = req.params;
      if (!id || !/^[a-z0-9\-]+$/.test(id)) {
        return res.status(400).json({ error: "Invalid coin ID" });
      }

      const cached = tickerCache[id];
      if (cached && Date.now() - cached.timestamp < TICKER_CACHE_TTL) {
        return res.json(cached.data);
      }

      const url = `${COINGECKO_BASE}/coins/${id}/tickers?include_exchange_logo=true&depth=false&order=volume_desc`;
      const response = await fetch(url);
      if (!response.ok) {
        if (cached) return res.json(cached.data);
        throw new Error(`CoinGecko API error: ${response.status}`);
      }
      const raw = await response.json();
      const rawTickers = Array.isArray(raw?.tickers) ? raw.tickers : [];
      const tickers = rawTickers.slice(0, 50).map((t: any) => ({
        exchange: t.market?.name || "Unknown",
        exchangeLogo: t.market?.logo || null,
        exchangeId: t.market?.identifier || null,
        base: t.base || "",
        target: t.target || "",
        price: t.last ?? null,
        volume: t.converted_volume?.usd ?? null,
        spread: t.bid_ask_spread_percentage ?? null,
        trustScore: t.trust_score || null,
        tradeUrl: t.trade_url || null,
        isAnomaly: t.is_anomaly || false,
        isStale: t.is_stale || false,
        lastTradedAt: t.last_traded_at || null,
        lastFetchAt: t.last_fetch_at || null,
        convertedLast: t.converted_last?.usd ?? null,
      }));

      const data = { tickers };
      tickerCache[id] = { data, timestamp: Date.now() };
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  const arbitrageCache: Record<string, { data: any; timestamp: number }> = {};
  const ARBITRAGE_CACHE_TTL = 90000;
  const ARBITRAGE_DEFAULT_COINS = [
    "bitcoin", "ethereum", "solana", "ripple", "binancecoin", "dogecoin", "cardano",
    "polkadot", "avalanche-2", "chainlink", "litecoin", "tron", "uniswap", "stellar",
    "near", "sui", "aptos", "arbitrum", "optimism", "render-token"
  ];
  const ARBITRAGE_EXTRA_COINS: Record<string, { symbol: string; name: string }> = {
    "pepe": { symbol: "PEPE", name: "Pepe" },
    "shiba-inu": { symbol: "SHIB", name: "Shiba Inu" },
    "polygon-ecosystem-token": { symbol: "POL", name: "Polygon" },
    "cosmos": { symbol: "ATOM", name: "Cosmos" },
    "filecoin": { symbol: "FIL", name: "Filecoin" },
    "immutable-x": { symbol: "IMX", name: "Immutable" },
    "injective-protocol": { symbol: "INJ", name: "Injective" },
    "the-graph": { symbol: "GRT", name: "The Graph" },
    "aave": { symbol: "AAVE", name: "Aave" },
    "algorand": { symbol: "ALGO", name: "Algorand" },
    "fantom": { symbol: "FTM", name: "Fantom" },
    "vechain": { symbol: "VET", name: "VeChain" },
    "theta-token": { symbol: "THETA", name: "Theta" },
    "eos": { symbol: "EOS", name: "EOS" },
    "maker": { symbol: "MKR", name: "Maker" },
    "monero": { symbol: "XMR", name: "Monero" },
    "hedera-hashgraph": { symbol: "HBAR", name: "Hedera" },
    "the-sandbox": { symbol: "SAND", name: "The Sandbox" },
    "decentraland": { symbol: "MANA", name: "Decentraland" },
    "axie-infinity": { symbol: "AXS", name: "Axie Infinity" },
  };

  app.get("/api/arbitrage/extra-coins", (_req, res) => {
    res.json(Object.entries(ARBITRAGE_EXTRA_COINS).map(([id, info]) => ({ id, ...info })));
  });

  app.get("/api/arbitrage", async (req, res) => {
    const extraParam = typeof req.query.extra === "string" ? req.query.extra : "";
    const extraCoins = [...new Set(extraParam ? extraParam.split(",").filter(c => ARBITRAGE_EXTRA_COINS[c]).slice(0, 20) : [])];
    const allCoins = [...new Set([...ARBITRAGE_DEFAULT_COINS, ...extraCoins])];
    const cacheKey = [...allCoins].sort().join(",");

    try {
      if (arbitrageCache[cacheKey]?.data && Date.now() - arbitrageCache[cacheKey].timestamp < ARBITRAGE_CACHE_TTL) {
        return res.json(arbitrageCache[cacheKey].data);
      }

      const results: any[] = [];

      for (const coinId of allCoins) {
        try {
          const cached = tickerCache[coinId];
          let tickers: any[] = [];

          if (cached && Date.now() - cached.timestamp < TICKER_CACHE_TTL) {
            tickers = cached.data?.tickers || [];
          } else {
            const url = `${COINGECKO_BASE}/coins/${coinId}/tickers?include_exchange_logo=true&depth=false&order=volume_desc`;
            const response = await fetch(url);
            if (response.ok) {
              const raw = await response.json();
              const rawTickers = Array.isArray(raw?.tickers) ? raw.tickers : [];
              tickers = rawTickers.slice(0, 50).map((t: any) => ({
                exchange: t.market?.name || "Unknown",
                exchangeLogo: t.market?.logo || null,
                exchangeId: t.market?.identifier || null,
                base: t.base || "",
                target: t.target || "",
                price: t.last ?? null,
                volume: t.converted_volume?.usd ?? null,
                spread: t.bid_ask_spread_percentage ?? null,
                trustScore: t.trust_score || null,
                tradeUrl: t.trade_url || null,
                isAnomaly: t.is_anomaly || false,
                isStale: t.is_stale || false,
                convertedLast: t.converted_last?.usd ?? null,
              }));
              tickerCache[coinId] = { data: { tickers }, timestamp: Date.now() };
            } else if (cached) {
              tickers = cached.data?.tickers || [];
            }
          }

          const validTickers = tickers.filter((t: any) =>
            t.convertedLast && t.convertedLast > 0 && !t.isAnomaly && !t.isStale &&
            t.volume && t.volume > 1000 && t.trustScore !== "red"
          );

          const bestByExchange = new Map<string, any>();
          for (const t of validTickers) {
            const key = t.exchange;
            const existing = bestByExchange.get(key);
            if (!existing || t.volume > existing.volume) {
              bestByExchange.set(key, t);
            }
          }
          const uniqueExchangeTickers = Array.from(bestByExchange.values());

          if (uniqueExchangeTickers.length >= 2) {
            const sorted = [...uniqueExchangeTickers].sort((a: any, b: any) => a.convertedLast - b.convertedLast);
            const lowest = sorted[0];
            const highest = sorted[sorted.length - 1];
            const spreadPct = ((highest.convertedLast - lowest.convertedLast) / lowest.convertedLast) * 100;

            results.push({
              coinId,
              lowestExchange: lowest.exchange,
              lowestExchangeLogo: lowest.exchangeLogo,
              lowestPrice: lowest.convertedLast,
              lowestTradeUrl: lowest.tradeUrl,
              lowestVolume: lowest.volume,
              highestExchange: highest.exchange,
              highestExchangeLogo: highest.exchangeLogo,
              highestPrice: highest.convertedLast,
              highestTradeUrl: highest.tradeUrl,
              highestVolume: highest.volume,
              spreadPct: Math.round(spreadPct * 100) / 100,
              exchangeCount: uniqueExchangeTickers.length,
              allExchanges: sorted.slice(0, 20).map((t: any) => ({
                exchange: t.exchange,
                exchangeLogo: t.exchangeLogo,
                price: t.convertedLast,
                volume: t.volume,
                spread: t.spread,
                trustScore: t.trustScore,
                tradeUrl: t.tradeUrl,
              })),
            });
          }

          await new Promise(r => setTimeout(r, 300));
        } catch {}
      }

      results.sort((a, b) => b.spreadPct - a.spreadPct);

      const data = { opportunities: results, timestamp: Date.now(), coinCount: allCoins.length };
      arbitrageCache[cacheKey] = { data, timestamp: Date.now() };
      res.json(data);
    } catch (err: any) {
      if (arbitrageCache[cacheKey]?.data) return res.json(arbitrageCache[cacheKey].data);
      res.status(500).json({ error: err.message });
    }
  });

  const marketChartCache: Record<string, { data: any; timestamp: number }> = {};
  const MARKET_CHART_TTL: Record<string, number> = {
    "7": 120000,
    "30": 300000,
    "90": 600000,
    "365": 600000,
  };

  app.get("/api/coin/:id/market-chart", async (req, res) => {
    try {
      const { id } = req.params;
      if (!id || !/^[a-z0-9\-]+$/.test(id)) {
        return res.status(400).json({ error: "Invalid coin ID" });
      }
      const days = String(req.query.days || "7");
      if (!["7", "30", "90", "365"].includes(days)) {
        return res.status(400).json({ error: "Invalid days parameter. Use 7, 30, 90, or 365" });
      }

      const cacheKey = `${id}_${days}`;
      const cached = marketChartCache[cacheKey];
      const ttl = MARKET_CHART_TTL[days] || 120000;
      if (cached && Date.now() - cached.timestamp < ttl) {
        return res.json(cached.data);
      }

      const url = `${COINGECKO_BASE}/coins/${id}/market_chart?vs_currency=usd&days=${days}`;
      const response = await fetch(url);
      if (!response.ok) {
        if (cached) return res.json(cached.data);
        if (response.status === 404) return res.status(404).json({ error: "Coin not found" });
        throw new Error(`CoinGecko API error: ${response.status}`);
      }
      const raw = await response.json();

      const data = {
        prices: (raw.prices || []).map((p: [number, number]) => ({ t: p[0], v: p[1] })),
        volumes: (raw.total_volumes || []).map((p: [number, number]) => ({ t: p[0], v: p[1] })),
      };

      marketChartCache[cacheKey] = { data, timestamp: Date.now() };
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  const cmcMapCache: { data: Map<string, number>; timestamp: number } = { data: new Map(), timestamp: 0 };
  const CMC_MAP_TTL = 86400000;
  const cmcQuoteCache: Record<string, { data: any; timestamp: number }> = {};
  const CMC_QUOTE_TTL = 300000;
  const cmcInfoCache: Record<string, { data: any; timestamp: number }> = {};
  const CMC_INFO_TTL = 600000;

  async function cmcFetch(path: string, params: Record<string, string> = {}) {
    if (!CMC_API_KEY) throw new Error("CMC API key not configured");
    const qs = new URLSearchParams(params).toString();
    const url = `${CMC_BASE}${path}${qs ? "?" + qs : ""}`;
    const res = await fetch(url, {
      headers: { "X-CMC_PRO_API_KEY": CMC_API_KEY, "Accept": "application/json" },
    });
    if (!res.ok) throw new Error(`CMC API error: ${res.status}`);
    const json = await res.json();
    if (json.status?.error_code && json.status.error_code !== 0) {
      throw new Error(json.status.error_message || "CMC API error");
    }
    return json.data;
  }

  async function getCmcIdBySymbol(symbol: string): Promise<number | null> {
    const sym = symbol.toUpperCase();
    if (cmcMapCache.data.has(sym) && Date.now() - cmcMapCache.timestamp < CMC_MAP_TTL) {
      return cmcMapCache.data.get(sym) || null;
    }
    try {
      const data = await cmcFetch("/v1/cryptocurrency/map", { symbol: sym, limit: "1" });
      if (Array.isArray(data) && data.length > 0) {
        cmcMapCache.data.set(sym, data[0].id);
        cmcMapCache.timestamp = Date.now();
        return data[0].id;
      }
    } catch {}
    return null;
  }

  app.get("/api/cmc/quote/:symbol", async (req, res) => {
    try {
      const symbol = (req.params.symbol || "").toUpperCase();
      if (!symbol || !/^[A-Z0-9]+$/.test(symbol)) {
        return res.status(400).json({ error: "Invalid symbol" });
      }

      const cached = cmcQuoteCache[symbol];
      if (cached && Date.now() - cached.timestamp < CMC_QUOTE_TTL) {
        return res.json(cached.data);
      }

      const data = await cmcFetch("/v1/cryptocurrency/quotes/latest", { symbol, convert: "USD" });
      const coinData = data?.[symbol];
      if (!coinData) {
        return res.status(404).json({ error: "Coin not found on CMC" });
      }

      const quote = coinData.quote?.USD || {};
      const result = {
        id: coinData.id,
        name: coinData.name,
        symbol: coinData.symbol,
        slug: coinData.slug,
        cmcRank: coinData.cmc_rank,
        numMarketPairs: coinData.num_market_pairs,
        maxSupply: coinData.max_supply,
        circulatingSupply: coinData.circulating_supply,
        totalSupply: coinData.total_supply,
        isActive: coinData.is_active,
        dateAdded: coinData.date_added,
        tags: coinData.tags || [],
        price: quote.price,
        volume24h: quote.volume_24h,
        volumeChange24h: quote.volume_change_24h,
        percentChange1h: quote.percent_change_1h,
        percentChange24h: quote.percent_change_24h,
        percentChange7d: quote.percent_change_7d,
        percentChange30d: quote.percent_change_30d,
        percentChange60d: quote.percent_change_60d,
        percentChange90d: quote.percent_change_90d,
        marketCap: quote.market_cap,
        marketCapDominance: quote.market_cap_dominance,
        fullyDilutedMarketCap: quote.fully_diluted_market_cap,
        lastUpdated: quote.last_updated,
      };

      cmcQuoteCache[symbol] = { data: result, timestamp: Date.now() };
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/cmc/info/:symbol", async (req, res) => {
    try {
      const symbol = (req.params.symbol || "").toUpperCase();
      if (!symbol || !/^[A-Z0-9]+$/.test(symbol)) {
        return res.status(400).json({ error: "Invalid symbol" });
      }

      const cached = cmcInfoCache[symbol];
      if (cached && Date.now() - cached.timestamp < CMC_INFO_TTL) {
        return res.json(cached.data);
      }

      const data = await cmcFetch("/v1/cryptocurrency/info", { symbol });
      const coinData = data?.[symbol];
      if (!coinData) {
        return res.status(404).json({ error: "Coin not found on CMC" });
      }

      const result = {
        id: coinData.id,
        name: coinData.name,
        symbol: coinData.symbol,
        slug: coinData.slug,
        category: coinData.category,
        description: coinData.description,
        logo: coinData.logo,
        dateAdded: coinData.date_added,
        dateLaunched: coinData.date_launched,
        tags: coinData.tags || [],
        tagNames: coinData["tag-names"] || [],
        tagGroups: coinData["tag-groups"] || [],
        urls: {
          website: coinData.urls?.website || [],
          technicalDoc: coinData.urls?.technical_doc || [],
          twitter: coinData.urls?.twitter || [],
          reddit: coinData.urls?.reddit || [],
          messageBoard: coinData.urls?.message_board || [],
          announcement: coinData.urls?.announcement || [],
          chat: coinData.urls?.chat || [],
          explorer: coinData.urls?.explorer || [],
          sourceCode: coinData.urls?.source_code || [],
        },
        platform: coinData.platform ? {
          name: coinData.platform.name,
          symbol: coinData.platform.symbol,
          tokenAddress: coinData.platform.token_address,
        } : null,
        selfReportedCirculatingSupply: coinData.self_reported_circulating_supply,
        selfReportedMarketCap: coinData.self_reported_market_cap,
        selfReportedTags: coinData.self_reported_tags || [],
        isHidden: coinData.is_hidden || 0,
        notice: coinData.notice || "",
      };

      cmcInfoCache[symbol] = { data: result, timestamp: Date.now() };
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/cmc/listings", async (req, res) => {
    try {
      const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit)) || 20));
      const start = Math.max(1, parseInt(String(req.query.start)) || 1);

      const cacheKey = `listings-${start}-${limit}`;
      const cached = cmcQuoteCache[cacheKey];
      if (cached && Date.now() - cached.timestamp < CMC_QUOTE_TTL) {
        return res.json(cached.data);
      }

      const data = await cmcFetch("/v1/cryptocurrency/listings/latest", {
        start: String(start),
        limit: String(limit),
        convert: "USD",
        sort: "market_cap",
        sort_dir: "desc",
      });

      const coins = Array.isArray(data) ? data.map((c: any) => {
        const q = c.quote?.USD || {};
        return {
          id: c.id,
          name: c.name,
          symbol: c.symbol,
          slug: c.slug,
          cmcRank: c.cmc_rank,
          price: q.price,
          percentChange1h: q.percent_change_1h,
          percentChange24h: q.percent_change_24h,
          percentChange7d: q.percent_change_7d,
          marketCap: q.market_cap,
          volume24h: q.volume_24h,
          circulatingSupply: c.circulating_supply,
          totalSupply: c.total_supply,
          maxSupply: c.max_supply,
          marketCapDominance: q.market_cap_dominance,
          dateAdded: c.date_added,
        };
      }) : [];

      cmcQuoteCache[cacheKey] = { data: coins, timestamp: Date.now() };
      res.json(coins);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  const BLOCKCYPHER_LTC_BASE = "https://api.blockcypher.com/v1/ltc/main";

  function isValidLtcAddress(address: string): boolean {
    if (/^[LM3][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address)) return true;
    if (/^ltc1[a-zA-HJ-NP-Z0-9]{25,89}$/.test(address)) return true;
    return false;
  }

  app.get("/api/ltc/address/:address", async (req, res) => {
    try {
      const { address } = req.params;
      if (!isValidLtcAddress(address)) {
        return res.status(400).json({ error: "Invalid Litecoin address. Must start with L, M, 3, or ltc1." });
      }

      const response = await fetch(`${BLOCKCYPHER_LTC_BASE}/addrs/${address}/balance`);
      if (!response.ok) {
        if (response.status === 400) return res.status(400).json({ error: "Invalid Litecoin address" });
        throw new Error(`Blockcypher API error: ${response.status}`);
      }
      const data = await response.json();

      res.json({
        address: data.address,
        balance: (data.balance / 100000000).toFixed(8),
        balanceSats: data.balance,
        totalReceived: (data.total_received / 100000000).toFixed(8),
        totalReceivedSats: data.total_received,
        totalSent: (data.total_sent / 100000000).toFixed(8),
        totalSentSats: data.total_sent,
        txCount: data.n_tx,
        unconfirmedBalance: (data.unconfirmed_balance / 100000000).toFixed(8),
        unconfirmedTxCount: data.unconfirmed_n_tx,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/ltc/transactions/:address", async (req, res) => {
    try {
      const { address } = req.params;
      if (!isValidLtcAddress(address)) {
        return res.status(400).json({ error: "Invalid Litecoin address. Must start with L, M, 3, or ltc1." });
      }

      const response = await fetch(`${BLOCKCYPHER_LTC_BASE}/addrs/${address}?limit=15`);
      if (!response.ok) {
        if (response.status === 400) return res.status(400).json({ error: "Invalid Litecoin address" });
        throw new Error(`Blockcypher API error: ${response.status}`);
      }
      const data = await response.json();

      const transactions = (data.txrefs || []).map((tx: any) => ({
        txid: tx.tx_hash,
        blockHeight: tx.block_height,
        value: (tx.value / 100000000).toFixed(8),
        valueSats: tx.value,
        confirmed: tx.confirmations > 0,
        confirmations: tx.confirmations,
        time: tx.confirmed ? new Date(tx.confirmed).getTime() : null,
        confirmedAt: tx.confirmed || null,
        txInputN: tx.tx_input_n,
        txOutputN: tx.tx_output_n,
        spent: tx.spent || false,
        doubleSpend: tx.double_spend || false,
      }));

      res.json({ address: data.address, transactions });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  const BLOCKCYPHER_BCH_BASE = "https://api.blockcypher.com/v1/bch/main";

  function isValidBchAddress(address: string): boolean {
    if (/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address)) return true;
    if (/^[qp][a-z0-9]{25,49}$/.test(address)) return true;
    return false;
  }

  app.get("/api/bch/address/:address", async (req, res) => {
    try {
      const { address } = req.params;
      if (!isValidBchAddress(address)) {
        return res.status(400).json({ error: "Invalid Bitcoin Cash address. Must start with 1, 3, q, or p." });
      }

      const response = await fetch(`${BLOCKCYPHER_BCH_BASE}/addrs/${address}/balance`);
      if (!response.ok) {
        if (response.status === 400) return res.status(400).json({ error: "Invalid Bitcoin Cash address" });
        throw new Error(`Blockcypher API error: ${response.status}`);
      }
      const data = await response.json();

      res.json({
        address: data.address,
        balance: (data.balance / 100000000).toFixed(8),
        balanceSats: data.balance,
        totalReceived: (data.total_received / 100000000).toFixed(8),
        totalReceivedSats: data.total_received,
        totalSent: (data.total_sent / 100000000).toFixed(8),
        totalSentSats: data.total_sent,
        txCount: data.n_tx,
        unconfirmedBalance: (data.unconfirmed_balance / 100000000).toFixed(8),
        unconfirmedTxCount: data.unconfirmed_n_tx,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/bch/transactions/:address", async (req, res) => {
    try {
      const { address } = req.params;
      if (!isValidBchAddress(address)) {
        return res.status(400).json({ error: "Invalid Bitcoin Cash address. Must start with 1, 3, q, or p." });
      }

      const response = await fetch(`${BLOCKCYPHER_BCH_BASE}/addrs/${address}?limit=15`);
      if (!response.ok) {
        if (response.status === 400) return res.status(400).json({ error: "Invalid Bitcoin Cash address" });
        throw new Error(`Blockcypher API error: ${response.status}`);
      }
      const data = await response.json();

      const transactions = (data.txrefs || []).map((tx: any) => ({
        txid: tx.tx_hash,
        blockHeight: tx.block_height,
        value: (tx.value / 100000000).toFixed(8),
        valueSats: tx.value,
        confirmed: tx.confirmations > 0,
        confirmations: tx.confirmations,
        time: tx.confirmed ? new Date(tx.confirmed).getTime() : null,
        confirmedAt: tx.confirmed || null,
        txInputN: tx.tx_input_n,
        txOutputN: tx.tx_output_n,
        spent: tx.spent || false,
        doubleSpend: tx.double_spend || false,
      }));

      res.json({ address: data.address, transactions });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  function isValidTrxAddress(address: string): boolean {
    return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address);
  }

  function hexToTronBase58(hex: string): string | null {
    if (!hex) return null;
    const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
    if (cleanHex.length !== 42 || !cleanHex.startsWith("41")) return hex;
    try {
      const bytes = Buffer.from(cleanHex, "hex");
      const hash1 = crypto.createHash("sha256").update(bytes).digest();
      const hash2 = crypto.createHash("sha256").update(hash1).digest();
      const checksum = hash2.slice(0, 4);
      const payload = Buffer.concat([bytes, checksum]);
      const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
      let num = BigInt("0x" + payload.toString("hex"));
      let result = "";
      while (num > 0n) {
        result = ALPHABET[Number(num % 58n)] + result;
        num = num / 58n;
      }
      for (let i = 0; i < payload.length && payload[i] === 0; i++) {
        result = "1" + result;
      }
      return result;
    } catch {
      return hex;
    }
  }

  app.get("/api/trx/account/:address", async (req, res) => {
    try {
      const { address } = req.params;
      if (!isValidTrxAddress(address)) {
        return res.status(400).json({ error: "Invalid TRON address. Must start with T and be 34 characters." });
      }

      const response = await fetch(`https://api.trongrid.io/v1/accounts/${address}`);
      if (!response.ok) {
        throw new Error(`TronGrid API error: ${response.status}`);
      }
      const data = await response.json();

      if (!data.data || data.data.length === 0) {
        return res.status(404).json({ error: "Account not found on TRON network" });
      }

      const acct = data.data[0];
      const balanceSun = acct.balance || 0;
      const frozenBalance = (acct.frozen || []).reduce((sum: number, f: any) => sum + (f.frozen_balance || 0), 0);

      res.json({
        address: acct.address,
        balance: (balanceSun / 1000000).toFixed(6),
        balanceSun,
        bandwidth: acct.free_net_usage || 0,
        energy: acct.energy_usage || 0,
        frozenBalance: (frozenBalance / 1000000).toFixed(6),
        frozenBalanceSun: frozenBalance,
        createTime: acct.create_time || null,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/trx/transactions/:address", async (req, res) => {
    try {
      const { address } = req.params;
      if (!isValidTrxAddress(address)) {
        return res.status(400).json({ error: "Invalid TRON address. Must start with T and be 34 characters." });
      }

      const response = await fetch(`https://api.trongrid.io/v1/accounts/${address}/transactions?limit=15`);
      if (!response.ok) {
        throw new Error(`TronGrid API error: ${response.status}`);
      }
      const data = await response.json();

      const transactions = (data.data || []).map((tx: any) => {
        const contract = tx.raw_data?.contract?.[0] || {};
        const value = contract.parameter?.value || {};
        return {
          txID: tx.txID,
          blockNumber: tx.blockNumber,
          timestamp: tx.block_timestamp || null,
          from: hexToTronBase58(value.owner_address) || null,
          to: hexToTronBase58(value.to_address) || null,
          amount: value.amount ? (value.amount / 1000000).toFixed(6) : null,
          type: contract.type || null,
          confirmed: tx.ret?.[0]?.contractRet === "SUCCESS",
        };
      });

      res.json({ address, transactions });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  function isValidXlmAddress(address: string): boolean {
    return /^G[A-Z2-7]{55}$/.test(address);
  }

  app.get("/api/xlm/account/:address", async (req, res) => {
    try {
      const { address } = req.params;
      if (!isValidXlmAddress(address)) {
        return res.status(400).json({ error: "Invalid Stellar address. Must start with G and be 56 characters." });
      }

      const response = await fetch(`https://horizon.stellar.org/accounts/${address}`);
      if (!response.ok) {
        if (response.status === 404) {
          return res.status(404).json({ error: "Account not found on Stellar network" });
        }
        throw new Error(`Horizon API error: ${response.status}`);
      }
      const data = await response.json();

      const balances = (data.balances || []).map((b: any) => ({
        asset_type: b.asset_type,
        asset_code: b.asset_code || null,
        asset_issuer: b.asset_issuer || null,
        balance: b.balance,
      }));

      res.json({
        account_id: data.account_id,
        sequence: data.sequence,
        balances,
        subentry_count: data.subentry_count,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/xlm/transactions/:address", async (req, res) => {
    try {
      const { address } = req.params;
      if (!isValidXlmAddress(address)) {
        return res.status(400).json({ error: "Invalid Stellar address. Must start with G and be 56 characters." });
      }

      const response = await fetch(`https://horizon.stellar.org/accounts/${address}/transactions?limit=15&order=desc`);
      if (!response.ok) {
        if (response.status === 404) {
          return res.status(404).json({ error: "Account not found on Stellar network" });
        }
        throw new Error(`Horizon API error: ${response.status}`);
      }
      const data = await response.json();

      const transactions = (data._embedded?.records || []).map((tx: any) => ({
        id: tx.id,
        hash: tx.hash,
        created_at: tx.created_at,
        source_account: tx.source_account,
        fee_charged: tx.fee_charged,
        operation_count: tx.operation_count,
        successful: tx.successful,
        memo: tx.memo || null,
      }));

      res.json({ address, transactions });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  const NEM_NODES = [
    "http://176.9.20.180:7890",
    "http://176.9.68.110:7890",
    "http://199.217.118.114:7890",
    "http://108.61.182.27:7890",
    "http://san.nem.ninja:7890",
    "http://bob.nem.ninja:7890",
  ];
  const NEM_GENESIS_TIME = 1427587585;

  async function nemRequest(path: string): Promise<any> {
    let lastError: Error | null = null;
    for (const node of NEM_NODES) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      try {
        const response = await fetch(`${node}${path}`, { signal: controller.signal });
        clearTimeout(timeout);
        if (!response.ok) throw new Error(`NEM API error: ${response.status}`);
        return await response.json();
      } catch (e: any) {
        clearTimeout(timeout);
        lastError = e;
      }
    }
    throw lastError || new Error("All NEM nodes unreachable");
  }

  function cleanNemAddress(raw: string): string {
    const cleaned = raw.replace(/-/g, "").toUpperCase();
    if (!cleaned.startsWith("N") || cleaned.length !== 40) {
      throw new Error("Invalid NEM address. Must start with N and be 40 characters.");
    }
    return cleaned;
  }

  app.get("/api/xem/account/:address", async (req, res) => {
    try {
      const cleaned = cleanNemAddress(req.params.address);
      const data = await nemRequest(`/account/get?address=${cleaned}`);
      if (!data.account) throw new Error("Account not found");

      const account = data.account;
      const meta = data.meta || {};
      res.json({
        address: account.address,
        balance: (account.balance / 1000000).toFixed(6),
        vestedBalance: ((account.vestedBalance || 0) / 1000000).toFixed(6),
        importance: account.importance || 0,
        publicKey: account.publicKey || null,
        harvestedBlocks: account.harvestedBlocks || 0,
        label: account.label || null,
        status: meta.status || null,
        remoteStatus: meta.remoteStatus || null,
        cosignatories: (meta.cosignatories || []).map((c: any) => ({
          address: c.address,
          publicKey: c.publicKey,
          balance: c.balance ? (c.balance / 1000000).toFixed(6) : "0",
        })),
        cosignatoryOf: (meta.cosignatoryOf || []).map((c: any) => ({
          address: c.address,
          publicKey: c.publicKey,
          balance: c.balance ? (c.balance / 1000000).toFixed(6) : "0",
        })),
        isMultisig: (meta.cosignatories || []).length > 0,
        multisigInfo: account.multisigInfo || {},
      });
    } catch (err: any) {
      const msg = err.message || "Failed to fetch NEM account";
      if (msg.includes("Invalid NEM")) return res.status(400).json({ error: msg });
      if (msg.includes("not found")) return res.status(404).json({ error: "Account not found on NEM network" });
      res.status(500).json({ error: msg });
    }
  });

  app.get("/api/xem/transactions/:address", async (req, res) => {
    try {
      const cleaned = cleanNemAddress(req.params.address);
      const data = await nemRequest(`/account/transfers/all?address=${cleaned}`);

      const transactions = (data.data || []).slice(0, 25).map((entry: any) => {
        const tx = entry.transaction;
        const meta = entry.meta;
        const innerTx = tx.otherTrans || null;
        const actualTx = innerTx || tx;
        return {
          hash: meta?.hash?.data || meta?.innerHash?.data || "",
          height: meta?.height || 0,
          timestamp: actualTx.timeStamp ? (actualTx.timeStamp + NEM_GENESIS_TIME) * 1000 : 0,
          type: tx.type,
          typeName: tx.type === 257 ? "Transfer" : tx.type === 4100 ? "Multisig" : tx.type === 8193 ? "Namespace" : tx.type === 16385 ? "Mosaic Def" : tx.type === 16386 ? "Mosaic Supply" : tx.type === 4097 ? "Multisig Mod" : `Type ${tx.type}`,
          amount: actualTx.amount ? (actualTx.amount / 1000000).toFixed(6) : "0",
          fee: tx.fee ? (tx.fee / 1000000).toFixed(6) : "0",
          recipient: actualTx.recipient || "",
          sender: tx.signer || "",
          message: actualTx.message?.payload ? (() => { try { return Buffer.from(actualTx.message.payload, "hex").toString("utf8"); } catch { return null; } })() : null,
          mosaics: Array.isArray(actualTx.mosaics) ? actualTx.mosaics.map((m: any) => ({
            namespace: m.mosaicId?.namespaceId || "",
            name: m.mosaicId?.name || "",
            quantity: m.quantity || 0,
          })) : [],
        };
      });

      res.json({ address: cleaned, transactions });
    } catch (err: any) {
      if (err.message?.includes("Invalid NEM")) return res.status(400).json({ error: err.message });
      res.status(500).json({ error: err.message || "Failed to fetch NEM transactions" });
    }
  });

  app.get("/api/xem/mosaics/:address", async (req, res) => {
    try {
      const cleaned = cleanNemAddress(req.params.address);
      const data = await nemRequest(`/account/mosaic/owned?address=${cleaned}`);

      const mosaics = (data.data || []).map((m: any) => ({
        namespace: m.mosaicId?.namespaceId || "",
        name: m.mosaicId?.name || "",
        quantity: m.quantity || 0,
        fullId: `${m.mosaicId?.namespaceId || ""}:${m.mosaicId?.name || ""}`,
      }));

      res.json({ address: cleaned, mosaics });
    } catch (err: any) {
      if (err.message?.includes("Invalid NEM")) return res.status(400).json({ error: err.message });
      res.status(500).json({ error: err.message || "Failed to fetch NEM mosaics" });
    }
  });

  app.get("/api/xem/harvests/:address", async (req, res) => {
    try {
      const cleaned = cleanNemAddress(req.params.address);
      const data = await nemRequest(`/account/harvests?address=${cleaned}`);

      const harvests = (data.data || []).slice(0, 25).map((h: any) => ({
        height: h.height || h.id || 0,
        totalFee: h.totalFee ? (h.totalFee / 1000000).toFixed(6) : "0",
        difficulty: h.difficulty || 0,
        timestamp: h.timeStamp ? (h.timeStamp + NEM_GENESIS_TIME) * 1000 : 0,
      }));

      res.json({ address: cleaned, harvests, count: harvests.length });
    } catch (err: any) {
      if (err.message?.includes("Invalid NEM")) return res.status(400).json({ error: err.message });
      res.status(500).json({ error: err.message || "Failed to fetch NEM harvests" });
    }
  });

  const nemNetworkCache: { data: any; timestamp: number } = { data: null, timestamp: 0 };

  app.get("/api/xem/network", async (_req, res) => {
    try {
      if (nemNetworkCache.data && Date.now() - nemNetworkCache.timestamp < 60000) {
        return res.json(nemNetworkCache.data);
      }

      const [heightData, lastBlock, nodeInfo, peersData] = await Promise.all([
        nemRequest("/chain/height"),
        nemRequest("/chain/last-block"),
        nemRequest("/node/info"),
        nemRequest("/node/peer-list/reachable").catch(() => ({ data: [] })),
      ]);

      const result = {
        chainHeight: heightData?.height || 0,
        lastBlock: {
          height: lastBlock?.height || 0,
          timestamp: lastBlock?.timeStamp ? (lastBlock.timeStamp + NEM_GENESIS_TIME) * 1000 : 0,
          signer: lastBlock?.signer || "",
          txCount: lastBlock?.transactions?.length || 0,
        },
        node: {
          name: nodeInfo?.identity?.name || "",
          version: nodeInfo?.metaData?.version || "",
          platform: nodeInfo?.metaData?.platform || "",
          networkId: nodeInfo?.metaData?.networkId || 0,
        },
        reachablePeers: Array.isArray(peersData?.data) ? peersData.data.length : 0,
      };

      nemNetworkCache.data = result;
      nemNetworkCache.timestamp = Date.now();
      res.json(result);
    } catch (err: any) {
      if (nemNetworkCache.data) return res.json(nemNetworkCache.data);
      res.status(500).json({ error: err.message || "Failed to fetch NEM network info" });
    }
  });

  const NEO_RPC_NODES = [
    "http://seed1.neo.org:10332",
    "http://seed2.neo.org:10332",
    "https://mainnet1.neo.coz.io:443",
    "https://mainnet2.neo.coz.io:443",
  ];

  async function neoRpcRequest(method: string, params: any[]) {
    let lastError: Error | null = null;
    for (const rpcUrl of NEO_RPC_NODES) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const response = await fetch(rpcUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (!response.ok) { lastError = new Error(`NEO RPC ${response.status}`); continue; }
        const data = await response.json();
        if (data.error) { lastError = new Error(data.error.message || "NEO RPC error"); continue; }
        return data.result;
      } catch (e: any) {
        lastError = e;
      }
    }
    throw lastError || new Error("All NEO RPC nodes failed");
  }

  const neoKnownTokens: Record<string, { name: string; symbol: string; decimals: number }> = {
    "0xef4073a0f2b305a38ec4050e4d3d28bc40ea63f5": { name: "NEO", symbol: "NEO", decimals: 0 },
    "0xd2a4cff31913016155e38e474a2c06d08be276cf": { name: "GAS", symbol: "GAS", decimals: 8 },
    "0xf0151f528127558851b39c2cd8aa47da7418ab28": { name: "Flamingo", symbol: "FLM", decimals: 8 },
    "0xf46719e2d16bf50cddce2deb29cfb2f10562b5b7": { name: "Burger", symbol: "BURGER", decimals: 8 },
    "0x48c40d4666f93408be1bef038b6722404d9a4c2a": { name: "NeoFS", symbol: "NEOFS", decimals: 12 },
    "0xa5aef84e3c5a3e27e1400d52f90c8aa90a7a1375": { name: "GrantShares", symbol: "GDT", decimals: 8 },
    "0x340720c7107ef5721e44ed2ea8e314cce5c130fa": { name: "NEP Token", symbol: "NEP", decimals: 8 },
  };
  const neoTokenCache: Record<string, { name: string; symbol: string; decimals: number }> = { ...neoKnownTokens };

  async function resolveNeoToken(assetHash: string): Promise<{ name: string; symbol: string; decimals: number }> {
    if (neoTokenCache[assetHash]) return neoTokenCache[assetHash];
    try {
      const state = await neoRpcRequest("getcontractstate", [assetHash]);
      const manifest = state?.manifest;
      if (manifest?.name) {
        const info = {
          name: manifest.name,
          symbol: manifest.name,
          decimals: 8,
        };
        const abiMethods = manifest.abi?.methods || [];
        const decimalsMethod = abiMethods.find((m: any) => m.name === "decimals");
        if (decimalsMethod) {
          try {
            const invResult = await neoRpcRequest("invokefunction", [assetHash, "decimals", []]);
            if (invResult?.stack?.[0]?.value) {
              info.decimals = parseInt(invResult.stack[0].value, 10) || 8;
            }
          } catch {}
        }
        const symbolMethod = abiMethods.find((m: any) => m.name === "symbol");
        if (symbolMethod) {
          try {
            const invResult = await neoRpcRequest("invokefunction", [assetHash, "symbol", []]);
            if (invResult?.stack?.[0]?.value) {
              const raw = invResult.stack[0].value;
              const decoded = Buffer.from(raw, "base64").toString("utf8");
              if (decoded && /^[A-Za-z0-9]+$/.test(decoded)) {
                info.symbol = decoded;
              }
            }
          } catch {}
        }
        neoTokenCache[assetHash] = info;
        return info;
      }
    } catch {}
    const fallback = { name: assetHash.slice(0, 10), symbol: assetHash.slice(0, 6), decimals: 8 };
    neoTokenCache[assetHash] = fallback;
    return fallback;
  }

  app.get("/api/neo/account/:address", async (req, res) => {
    try {
      const { address } = req.params;
      if (!address.startsWith("N") || address.length !== 34) {
        return res.status(400).json({ error: "Invalid NEO address. Must start with N and be 34 characters." });
      }

      const result = await neoRpcRequest("getnep17balances", [address]);

      const balances = await Promise.all(
        (result.balance || []).map(async (b: any) => {
          const token = await resolveNeoToken(b.assethash);
          const amount = Number(b.amount) / Math.pow(10, token.decimals);
          return {
            asset: b.assethash,
            name: token.name,
            symbol: token.symbol,
            amount: amount.toString(),
            lastUpdatedBlock: b.lastupdatedblock,
          };
        })
      );

      res.json({
        address: result.address || address,
        balances,
      });
    } catch (err: any) {
      const msg = err.message || "Failed to fetch NEO account";
      if (msg.includes("Invalid params")) {
        return res.status(404).json({ error: "NEO address not found or not active on N3 network. Make sure this is a valid Neo N3 address." });
      }
      res.status(500).json({ error: msg });
    }
  });

  app.get("/api/neo/transactions/:address", async (req, res) => {
    try {
      const { address } = req.params;
      if (!address.startsWith("N") || address.length !== 34) {
        return res.status(400).json({ error: "Invalid NEO address" });
      }

      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const result = await neoRpcRequest("getnep17transfers", [address, thirtyDaysAgo]);

      const processTransfer = async (t: any, direction: "sent" | "received") => {
        const token = await resolveNeoToken(t.assethash);
        const amount = Number(t.amount) / Math.pow(10, token.decimals);
        return {
          txHash: t.txhash,
          timestamp: t.timestamp,
          asset: t.assethash,
          tokenName: token.name,
          tokenSymbol: token.symbol,
          amount: amount.toString(),
          from: direction === "sent" ? address : (t.transferaddress || ""),
          to: direction === "received" ? address : (t.transferaddress || ""),
          direction,
          blockIndex: t.blockindex,
        };
      };

      const sent = await Promise.all((result.sent || []).slice(0, 8).map((t: any) => processTransfer(t, "sent")));
      const received = await Promise.all((result.received || []).slice(0, 8).map((t: any) => processTransfer(t, "received")));

      const transactions = [...sent, ...received]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 15);

      res.json({ address, transactions });
    } catch (err: any) {
      const msg = err.message || "Failed to fetch NEO transactions";
      if (msg.includes("Invalid params")) {
        return res.status(404).json({ error: "NEO address not found or not active on N3 network." });
      }
      res.status(500).json({ error: msg });
    }
  });

  // Cardano (ADA) via Koios API
  app.get("/api/ada/account/:address", async (req, res) => {
    try {
      const { address } = req.params;
      if (!address.startsWith("addr1") || address.length < 50) {
        return res.status(400).json({ error: "Invalid Cardano address. Must start with addr1." });
      }

      const response = await fetch("https://api.koios.rest/api/v1/address_info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _addresses: [address] }),
      });
      if (!response.ok) throw new Error(`Koios API error: ${response.status}`);
      const data = await response.json();

      if (!data || data.length === 0) {
        return res.json({
          address,
          balance: "0",
          stakeAddress: null,
          utxoCount: 0,
        });
      }

      const info = data[0];
      const balanceAda = (parseInt(info.balance || "0") / 1_000_000).toFixed(6);

      res.json({
        address: info.address,
        balance: balanceAda,
        stakeAddress: info.stake_address || null,
        utxoCount: info.utxo_set?.length || 0,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to fetch Cardano account" });
    }
  });

  app.get("/api/ada/transactions/:address", async (req, res) => {
    try {
      const { address } = req.params;
      if (!address.startsWith("addr1") || address.length < 50) {
        return res.status(400).json({ error: "Invalid Cardano address" });
      }

      const response = await fetch("https://api.koios.rest/api/v1/address_txs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _addresses: [address], _after_block_height: 0 }),
      });
      if (!response.ok) throw new Error(`Koios API error: ${response.status}`);
      const data = await response.json();

      const transactions = (data || []).slice(0, 15).map((tx: any) => ({
        hash: tx.tx_hash,
        blockHeight: tx.block_height,
        blockTime: tx.block_time,
        epoch: tx.epoch_no,
      }));

      res.json({ address, transactions });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to fetch Cardano transactions" });
    }
  });

  // TON via Toncenter API
  app.get("/api/ton/account/:address", async (req, res) => {
    try {
      const { address } = req.params;
      if (!address || address.length < 30) {
        return res.status(400).json({ error: "Invalid TON address." });
      }

      const response = await fetch(`https://toncenter.com/api/v2/getAddressInformation?address=${encodeURIComponent(address)}`);
      if (!response.ok) throw new Error(`Toncenter API error: ${response.status}`);
      const data = await response.json();

      if (!data.ok) {
        return res.status(400).json({ error: data.error || "Invalid TON address" });
      }

      const r = data.result;
      const balanceTon = (parseInt(r.balance || "0") / 1_000_000_000).toFixed(9);

      res.json({
        address,
        balance: balanceTon,
        state: r.state || "unknown",
        lastTransactionLt: r.last_transaction_id?.lt || null,
        lastTransactionHash: r.last_transaction_id?.hash || null,
        frozenHash: r.frozen_hash || null,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to fetch TON account" });
    }
  });

  app.get("/api/ton/transactions/:address", async (req, res) => {
    try {
      const { address } = req.params;
      if (!address || address.length < 30) {
        return res.status(400).json({ error: "Invalid TON address" });
      }

      const response = await fetch(`https://toncenter.com/api/v2/getTransactions?address=${encodeURIComponent(address)}&limit=15`);
      if (!response.ok) throw new Error(`Toncenter API error: ${response.status}`);
      const data = await response.json();

      if (!data.ok) {
        return res.status(400).json({ error: data.error || "Failed to fetch transactions" });
      }

      const transactions = (data.result || []).map((tx: any) => ({
        hash: tx.transaction_id?.hash || "",
        lt: tx.transaction_id?.lt || "",
        timestamp: tx.utime,
        fee: (parseInt(tx.fee || "0") / 1_000_000_000).toFixed(9),
        inMsg: tx.in_msg ? {
          source: tx.in_msg.source || "",
          value: (parseInt(tx.in_msg.value || "0") / 1_000_000_000).toFixed(9),
        } : null,
        outMsgCount: tx.out_msgs?.length || 0,
      }));

      res.json({ address, transactions });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to fetch TON transactions" });
    }
  });

  // Cosmos (ATOM) via public LCD REST API
  app.get("/api/atom/account/:address", async (req, res) => {
    try {
      const { address } = req.params;
      if (!address.startsWith("cosmos1") || address.length < 39) {
        return res.status(400).json({ error: "Invalid Cosmos address. Must start with cosmos1." });
      }

      const response = await fetch(`https://cosmos-rest.publicnode.com/cosmos/bank/v1beta1/balances/${address}`);
      if (!response.ok) {
        if (response.status === 400 || response.status === 500) {
          return res.status(400).json({ error: "Invalid Cosmos address or address not found." });
        }
        throw new Error(`Cosmos LCD error: ${response.status}`);
      }
      const data = await response.json();

      const balances = (data.balances || []).map((b: any) => {
        if (b.denom === "uatom") {
          return { denom: "ATOM", amount: (parseInt(b.amount) / 1_000_000).toFixed(6) };
        }
        return { denom: b.denom, amount: b.amount };
      });

      const atomBal = balances.find((b: any) => b.denom === "ATOM");

      // Also fetch staking delegations
      let stakedAmount = "0";
      try {
        const stakingRes = await fetch(`https://cosmos-rest.publicnode.com/cosmos/staking/v1beta1/delegations/${address}`);
        if (stakingRes.ok) {
          const stakingData = await stakingRes.json();
          const totalStaked = (stakingData.delegation_responses || []).reduce((sum: number, d: any) => {
            return sum + parseInt(d.balance?.amount || "0");
          }, 0);
          stakedAmount = (totalStaked / 1_000_000).toFixed(6);
        }
      } catch {}

      res.json({
        address,
        balance: atomBal?.amount || "0",
        staked: stakedAmount,
        balances,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to fetch Cosmos account" });
    }
  });

  app.get("/api/atom/transactions/:address", async (req, res) => {
    try {
      const { address } = req.params;
      if (!address.startsWith("cosmos1") || address.length < 39) {
        return res.status(400).json({ error: "Invalid Cosmos address" });
      }

      const response = await fetch(`https://cosmos-rest.publicnode.com/cosmos/tx/v1beta1/txs?events=message.sender%3D%27${address}%27&order_by=ORDER_BY_DESC&pagination.limit=15`);
      if (!response.ok) throw new Error(`Cosmos LCD error: ${response.status}`);
      const data = await response.json();

      const transactions = (data.tx_responses || []).map((tx: any) => ({
        hash: tx.txhash,
        height: parseInt(tx.height),
        timestamp: tx.timestamp,
        gasUsed: tx.gas_used,
        gasWanted: tx.gas_wanted,
        success: tx.code === 0,
        memo: tx.tx?.body?.memo || "",
      }));

      res.json({ address, total: parseInt(data.pagination?.total || "0"), transactions });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to fetch Cosmos transactions" });
    }
  });

  // NEAR via public RPC
  app.get("/api/near/account/:accountId", async (req, res) => {
    try {
      const { accountId } = req.params;
      if (!accountId || accountId.length < 2 || accountId.length > 64) {
        return res.status(400).json({ error: "Invalid NEAR account ID." });
      }

      const response = await fetch("https://rpc.mainnet.near.org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0", id: 1, method: "query",
          params: { request_type: "view_account", finality: "final", account_id: accountId },
        }),
      });
      if (!response.ok) throw new Error(`NEAR RPC error: ${response.status}`);
      const data = await response.json();

      if (data.error) {
        if (data.error.cause?.name === "UNKNOWN_ACCOUNT") {
          return res.status(404).json({ error: `NEAR account "${accountId}" not found.` });
        }
        throw new Error(data.error.message || data.error.cause?.name || "NEAR RPC error");
      }

      const r = data.result;
      const balanceYocto = BigInt(r.amount || "0");
      const balanceNear = Number(balanceYocto / BigInt(10 ** 18)) / 1_000_000;
      const lockedYocto = BigInt(r.locked || "0");
      const lockedNear = Number(lockedYocto / BigInt(10 ** 18)) / 1_000_000;

      res.json({
        accountId,
        balance: balanceNear.toFixed(6),
        locked: lockedNear.toFixed(6),
        storageUsage: r.storage_usage,
        blockHeight: r.block_height,
        codeHash: r.code_hash,
        hasContract: r.code_hash !== "11111111111111111111111111111111",
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to fetch NEAR account" });
    }
  });

  app.get("/api/dot/account/:address", async (req, res) => {
    try {
      const { address } = req.params;
      if (!address || address.length < 46 || address.length > 48) {
        return res.status(400).json({ error: "Invalid Polkadot address. Must be a valid SS58 address (46-48 characters)." });
      }

      const response = await fetch("https://polkadot.api.subscan.io/api/scan/account/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      if (!response.ok) throw new Error(`Subscan API error: ${response.status}`);
      const data = await response.json();
      if (data.code !== 0) throw new Error(data.message || "Subscan API error");

      const native = data.data?.native?.[0];
      if (!native) {
        return res.status(404).json({ error: "Polkadot address not found or has no activity." });
      }

      res.json({
        address,
        balance: native.balance || "0",
        locked: native.lock || "0",
        reserved: native.reserved || "0",
        bonded: native.bonded || "0",
        unbonding: native.unbonding || "0",
        symbol: native.symbol || "DOT",
        decimals: native.decimals || 10,
        price: native.price || null,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to fetch Polkadot account" });
    }
  });

  app.get("/api/dot/transactions/:address", async (req, res) => {
    try {
      const { address } = req.params;
      if (!address || address.length < 46 || address.length > 48) {
        return res.status(400).json({ error: "Invalid Polkadot address" });
      }

      const response = await fetch("https://polkadot.api.subscan.io/api/v2/scan/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, row: 15, page: 0 }),
      });
      if (!response.ok) throw new Error(`Subscan API error: ${response.status}`);
      const data = await response.json();
      if (data.code !== 0) throw new Error(data.message || "Subscan API error");

      const transfers = (data.data?.transfers || []).map((t: any) => ({
        hash: t.hash,
        from: t.from,
        to: t.to,
        amount: t.amount || "0",
        symbol: t.asset_symbol || "DOT",
        success: t.success,
        blockNumber: t.block_num,
        timestamp: t.block_timestamp,
        fee: t.fee,
        direction: t.from === address ? "sent" : "received",
      }));

      res.json({ address, count: data.data?.count || 0, transactions: transfers });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to fetch Polkadot transactions" });
    }
  });

  app.get("/api/masternodes", async (_req, res) => {
    try {
      if (masternodeCache && Date.now() - masternodeCache.timestamp < MASTERNODE_CACHE_TTL) {
        return res.json(masternodeCache.data);
      }

      const mnCoins = [
        "dash", "pivx", "zcoin", "horizen", "energi", "syscoin",
        "blocknet", "divi", "smartcash", "crown",
      ];

      const url = `${COINGECKO_BASE}/coins/markets?vs_currency=usd&ids=${mnCoins.join(",")}&order=market_cap_desc&sparkline=false&price_change_percentage=24h,7d`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`CoinGecko API error: ${response.status}`);
      const priceData = await response.json();

      const masternodeInfo: Record<string, { collateral: number; roi: string }> = {
        dash: { collateral: 1000, roi: "5.7%" },
        pivx: { collateral: 10000, roi: "9.2%" },
        zcoin: { collateral: 1000, roi: "15.4%" },
        horizen: { collateral: 42, roi: "7.8%" },
        energi: { collateral: 10000, roi: "14.1%" },
        syscoin: { collateral: 100000, roi: "8.6%" },
        blocknet: { collateral: 5000, roi: "11.3%" },
        divi: { collateral: 10000000, roi: "20.5%" },
        smartcash: { collateral: 10000, roi: "12.8%" },
        crown: { collateral: 10000, roi: "16.2%" },
      };

      const coins = priceData.map((coin: any) => {
        const mn = masternodeInfo[coin.id] || { collateral: 0, roi: "N/A" };
        const collateralValue = mn.collateral * (coin.current_price || 0);
        return {
          id: coin.id,
          symbol: coin.symbol,
          name: coin.name,
          image: coin.image,
          currentPrice: coin.current_price,
          marketCap: coin.market_cap,
          priceChange24h: coin.price_change_percentage_24h,
          priceChange7d: coin.price_change_percentage_7d_in_currency,
          collateral: mn.collateral,
          collateralValueUsd: collateralValue,
          estimatedRoi: mn.roi,
          rank: coin.market_cap_rank,
        };
      });

      const result = { coins, timestamp: Date.now() };
      masternodeCache = { data: result, timestamp: Date.now() };
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/validators", async (_req, res) => {
    try {
      if (validatorCache && Date.now() - validatorCache.timestamp < VALIDATOR_CACHE_TTL) {
        return res.json(validatorCache.data);
      }

      const fetchWithTimeout = async (url: string, options?: RequestInit) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        try {
          const r = await fetch(url, { ...options, signal: controller.signal });
          return r;
        } finally {
          clearTimeout(timeout);
        }
      };

      const results = await Promise.allSettled([
        (async () => {
          try {
            const r = await fetchWithTimeout("https://beaconcha.in/api/v1/epoch/latest");
            const d = await r.json();
            return { chain: "Ethereum", symbol: "ETH", validatorCount: d.data?.validatorscount ?? null, totalStaked: d.data?.eligibleether ? `${Math.round(d.data.eligibleether).toLocaleString()} ETH` : null, stakingApy: "3.5%", color: "#627EEA" };
          } catch { return { chain: "Ethereum", symbol: "ETH", validatorCount: null, totalStaked: null, stakingApy: "3.5%", color: "#627EEA" }; }
        })(),
        (async () => {
          try {
            const r = await fetchWithTimeout("https://api.mainnet-beta.solana.com", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getVoteAccounts" }) });
            const d = await r.json();
            const count = d.result?.current?.length ?? null;
            return { chain: "Solana", symbol: "SOL", validatorCount: count, totalStaked: null, stakingApy: "7%", color: "#00FFA3" };
          } catch { return { chain: "Solana", symbol: "SOL", validatorCount: null, totalStaked: null, stakingApy: "7%", color: "#00FFA3" }; }
        })(),
        (async () => {
          try {
            const r = await fetchWithTimeout("https://rest.cosmos.directory/cosmoshub/cosmos/staking/v1beta1/pool");
            const d = await r.json();
            const bonded = d.pool?.bonded_tokens ? `${Math.round(parseInt(d.pool.bonded_tokens) / 1e6).toLocaleString()} ATOM` : null;
            return { chain: "Cosmos", symbol: "ATOM", validatorCount: null, totalStaked: bonded, stakingApy: "15%", color: "#2E3148" };
          } catch { return { chain: "Cosmos", symbol: "ATOM", validatorCount: null, totalStaked: null, stakingApy: "15%", color: "#2E3148" }; }
        })(),
        (async () => {
          try {
            const r = await fetchWithTimeout("https://api.koios.rest/api/v1/tip");
            const d = await r.json();
            const epoch = Array.isArray(d) && d[0]?.epoch_no ? d[0].epoch_no : null;
            return { chain: "Cardano", symbol: "ADA", validatorCount: null, totalStaked: epoch ? `Epoch ${epoch}` : null, stakingApy: "3.5%", color: "#0033AD" };
          } catch { return { chain: "Cardano", symbol: "ADA", validatorCount: null, totalStaked: null, stakingApy: "3.5%", color: "#0033AD" }; }
        })(),
        (async () => {
          try {
            const r = await fetchWithTimeout("https://polkadot.api.subscan.io/api/scan/metadata", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
            const d = await r.json();
            const count = d.data?.validator_count ?? null;
            return { chain: "Polkadot", symbol: "DOT", validatorCount: count, totalStaked: null, stakingApy: "12%", color: "#E6007A" };
          } catch { return { chain: "Polkadot", symbol: "DOT", validatorCount: null, totalStaked: null, stakingApy: "12%", color: "#E6007A" }; }
        })(),
        (async () => {
          try {
            const r = await fetchWithTimeout("https://api.avax.network/ext/bc/P", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "platform.getCurrentValidators", params: {} }) });
            const d = await r.json();
            const count = d.result?.validators?.length ?? null;
            return { chain: "Avalanche", symbol: "AVAX", validatorCount: count, totalStaked: null, stakingApy: "8%", color: "#E84142" };
          } catch { return { chain: "Avalanche", symbol: "AVAX", validatorCount: null, totalStaked: null, stakingApy: "8%", color: "#E84142" }; }
        })(),
        (async () => {
          try {
            const r = await fetchWithTimeout("https://rpc.mainnet.near.org", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "validators", params: [null] }) });
            const d = await r.json();
            const count = d.result?.current_validators?.length ?? null;
            return { chain: "NEAR", symbol: "NEAR", validatorCount: count, totalStaked: null, stakingApy: "9%", color: "#00C1DE" };
          } catch { return { chain: "NEAR", symbol: "NEAR", validatorCount: null, totalStaked: null, stakingApy: "9%", color: "#00C1DE" }; }
        })(),
        (async () => {
          try {
            const r = await fetchWithTimeout("https://api.trongrid.io/wallet/listwitnesses");
            const d = await r.json();
            const count = d.witnesses?.length ?? null;
            return { chain: "Tron", symbol: "TRX", validatorCount: count, totalStaked: null, stakingApy: "4%", color: "#FF0013" };
          } catch { return { chain: "Tron", symbol: "TRX", validatorCount: null, totalStaked: null, stakingApy: "4%", color: "#FF0013" }; }
        })(),
      ]);

      const validators = results.map((r) => r.status === "fulfilled" ? r.value : null).filter(Boolean);
      const data = { validators, updatedAt: Date.now() };
      validatorCache = { data, timestamp: Date.now() };
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/contract-abi/:address", async (req, res) => {
    try {
      const { address } = req.params;
      const chainId = parseInt(req.query.chainId as string) || 1;
      const data = await etherscanFetch({ module: "contract", action: "getabi", address }, chainId);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/internal-transactions/:address", async (req, res) => {
    try {
      const { address } = req.params;
      const chainId = parseInt(req.query.chainId as string) || 1;
      const data = await etherscanFetch({
        module: "account",
        action: "txlistinternal",
        address,
        startblock: "0",
        endblock: "99999999",
        page: "1",
        offset: "20",
        sort: "desc",
      }, chainId);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  const MAX_LOGIN_ATTEMPTS = 5;
  const LOCKOUT_WINDOW_MINUTES = 15;
  const AUTO_BLOCK_DURATION_MINUTES = 30;

  app.post("/api/admin/login", async (req, res) => {
    try {
      const clientIp = normalizeIp(req.ip || req.socket.remoteAddress || "unknown");

      await storage.cleanExpiredBlocks();
      const blocked = await storage.isIpBlocked(clientIp);
      if (blocked) {
        return res.status(403).json({ error: "Your IP has been temporarily blocked due to too many failed login attempts. Please try again later." });
      }

      const { password } = req.body;
      if (!password || typeof password !== "string") {
        return res.status(400).json({ error: "Password required" });
      }
      const hashedPassword = await storage.getSetting("admin_password_hash");
      let valid = false;
      if (hashedPassword) {
        valid = await bcrypt.compare(password, hashedPassword);
      } else {
        const envPassword = process.env.ADMIN_PASSWORD;
        if (envPassword) {
          valid = password === envPassword;
          if (valid) {
            const hash = await bcrypt.hash(password, 10);
            await storage.setSetting("admin_password_hash", hash);
          }
        }
      }

      await storage.recordLoginAttempt({ ip: clientIp, success: valid });

      if (!valid) {
        const recentFails = await storage.getRecentFailedAttempts(clientIp, LOCKOUT_WINDOW_MINUTES);
        if (recentFails >= MAX_LOGIN_ATTEMPTS) {
          const expiresAt = new Date(Date.now() + AUTO_BLOCK_DURATION_MINUTES * 60 * 1000);
          await storage.blockIp({
            ip: clientIp,
            reason: `Auto-blocked: ${recentFails} failed login attempts in ${LOCKOUT_WINDOW_MINUTES} minutes`,
            blockedBy: "auto",
            expiresAt,
          });
          return res.status(403).json({ error: `Too many failed attempts. Your IP has been blocked for ${AUTO_BLOCK_DURATION_MINUTES} minutes.` });
        }
        const remaining = MAX_LOGIN_ATTEMPTS - recentFails;
        return res.status(401).json({ error: `Invalid password. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining before lockout.` });
      }
      const token = crypto.randomBytes(32).toString("hex");
      activeSessions.add(token);
      res.json({ token, needsPasswordChange: !hashedPassword });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/logout", requireAdmin, (_req, res) => {
    const token = _req.headers["x-admin-token"] as string;
    activeSessions.delete(token);
    res.json({ ok: true });
  });

  app.get("/api/admin/verify", requireAdmin, (_req, res) => {
    res.json({ authenticated: true });
  });

  app.get("/api/admin/stats", requireAdmin, async (_req, res) => {
    try {
      const stats = await storage.getPageViewStats();
      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/admin/login-attempts", requireAdmin, async (_req, res) => {
    try {
      const attempts = await storage.getLoginAttempts(200);
      res.json(attempts);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/admin/blocked-ips", requireAdmin, async (_req, res) => {
    try {
      await storage.cleanExpiredBlocks();
      const blocked = await storage.getBlockedIps();
      res.json(blocked);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/block-ip", requireAdmin, async (req, res) => {
    try {
      const { ip, reason, permanent } = req.body;
      if (!ip || typeof ip !== "string") return res.status(400).json({ error: "IP required" });
      const data: any = {
        ip: ip.trim(),
        reason: reason || "Manually blocked by admin",
        blockedBy: "admin",
      };
      if (!permanent) {
        data.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      }
      const blocked = await storage.blockIp(data);
      res.json(blocked);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/admin/blocked-ips/:id", requireAdmin, async (req, res) => {
    try {
      await storage.unblockIp(parseInt(req.params.id));
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/admin/chat-messages", requireAdmin, async (_req, res) => {
    try {
      const messages = await storage.getChatMessages({ limit: 200 });
      res.json(messages);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/admin/chat/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteChatMessage(parseInt(req.params.id));
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/chat/flag/:id", requireAdmin, async (req, res) => {
    try {
      const flagged = req.body.flagged !== false;
      await storage.flagChatMessage(parseInt(req.params.id), flagged);
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/admin/settings", requireAdmin, async (_req, res) => {
    try {
      const settings = await storage.getAllSettings();
      const settingsMap: Record<string, string> = {};
      for (const s of settings) {
        if (s.key.startsWith("api_key_") && s.value) {
          const v = s.value;
          settingsMap[s.key] = v.length > 4 ? "••••••••" + v.slice(-4) : "••••";
        } else {
          settingsMap[s.key] = s.value;
        }
      }
      res.json(settingsMap);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/admin/settings", requireAdmin, async (req, res) => {
    try {
      const updates = req.body;
      if (typeof updates !== "object" || Array.isArray(updates)) {
        return res.status(400).json({ error: "Expected object" });
      }
      for (const [key, value] of Object.entries(updates)) {
        if (key === "admin_password" && value) {
          const hash = await bcrypt.hash(String(value), 10);
          await storage.setSetting("admin_password_hash", hash);
        } else if (key.startsWith("api_key_")) {
          const v = String(value).trim();
          if (v.startsWith("••")) {
            // masked value unchanged, skip
          } else {
            await storage.setSetting(key, v);
          }
        } else if (key !== "admin_password_hash") {
          await storage.setSetting(key, String(value));
        }
      }
      await refreshApiKeys();
      CN_KEY = await getApiKey("CHANGENOW_API_KEY");
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/admin/hidden-news", requireAdmin, async (_req, res) => {
    try {
      const hidden = await storage.getHiddenArticles();
      res.json(hidden);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/hide-news", requireAdmin, async (req, res) => {
    try {
      const parsed = insertHiddenNewsSchema.parse(req.body);
      const hidden = await storage.hideArticle(parsed);
      res.json(hidden);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete("/api/admin/hide-news/:articleId", requireAdmin, async (req, res) => {
    try {
      await storage.unhideArticle(req.params.articleId);
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/admin/pinned-news", requireAdmin, async (_req, res) => {
    try {
      const pinned = await storage.getPinnedArticles();
      res.json(pinned);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/pin-news", requireAdmin, async (req, res) => {
    try {
      const parsed = insertPinnedNewsSchema.parse(req.body);
      const pinned = await storage.pinArticle(parsed);
      res.json(pinned);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete("/api/admin/pin-news/:articleId", requireAdmin, async (req, res) => {
    try {
      await storage.unpinArticle(req.params.articleId);
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  const PROFANITY_WORDS = ["fuck", "shit", "ass", "bitch", "damn", "cunt", "dick", "nigger", "faggot", "retard"];
  const chatRateLimit = new Map<string, number>();
  const chatMessageHistory = new Map<string, { messages: string[]; timestamps: number[] }>();

  const SPAM_KEYWORDS = [
    "send me", "free btc", "free eth", "free crypto", "airdrop claim", "claim now",
    "double your", "guaranteed profit", "100x", "1000x", "get rich", "easy money",
    "invest now", "telegram.me", "t.me/", "discord.gg/", "bit.ly/", "tinyurl.com",
    "whatsapp", "dm me", "send to wallet", "giveaway", "pump signal", "insider info",
    "wallet connect", "validate wallet", "sync wallet", "dapp browser",
    "metamask support", "trust wallet support", "customer service",
  ];

  const SPAM_URL_PATTERN = /https?:\/\/[^\s]+/gi;
  const SPAM_REPEATED_CHARS = /(.)\1{7,}/;
  const SPAM_ALL_CAPS_THRESHOLD = 0.7;
  const SPAM_MAX_MESSAGES_PER_5MIN = 15;
  const SPAM_DUPLICATE_THRESHOLD = 3;
  const SPAM_AUTO_BAN_THRESHOLD = 5;

  async function analyzeSpam(ip: string, nickname: string, message: string, messageId: number): Promise<void> {
    const lowerMsg = message.toLowerCase();
    const reasons: { reason: string; severity: string }[] = [];

    const keywordHits = SPAM_KEYWORDS.filter(kw => lowerMsg.includes(kw));
    if (keywordHits.length >= 2) {
      reasons.push({ reason: `Scam keywords: ${keywordHits.slice(0, 3).join(", ")}`, severity: "high" });
    } else if (keywordHits.length === 1) {
      reasons.push({ reason: `Suspicious keyword: ${keywordHits[0]}`, severity: "medium" });
    }

    const urls = message.match(SPAM_URL_PATTERN);
    if (urls && urls.length >= 2) {
      reasons.push({ reason: `Multiple URLs (${urls.length})`, severity: "high" });
    } else if (urls && urls.length === 1) {
      reasons.push({ reason: "Contains external URL", severity: "low" });
    }

    if (SPAM_REPEATED_CHARS.test(message)) {
      reasons.push({ reason: "Repeated character spam", severity: "medium" });
    }

    const upperCount = message.replace(/[^A-Z]/g, "").length;
    const letterCount = message.replace(/[^a-zA-Z]/g, "").length;
    if (letterCount > 10 && upperCount / letterCount > SPAM_ALL_CAPS_THRESHOLD) {
      reasons.push({ reason: "Excessive CAPS", severity: "low" });
    }

    const history = chatMessageHistory.get(ip);
    if (history) {
      const now = Date.now();
      const fiveMinAgo = now - 5 * 60 * 1000;
      const recentTimestamps = history.timestamps.filter(t => t > fiveMinAgo);
      if (recentTimestamps.length >= SPAM_MAX_MESSAGES_PER_5MIN) {
        reasons.push({ reason: `Flood: ${recentTimestamps.length} msgs in 5min`, severity: "high" });
      }
      const duplicates = history.messages.filter(m => m === lowerMsg).length;
      if (duplicates >= SPAM_DUPLICATE_THRESHOLD) {
        reasons.push({ reason: `Duplicate message sent ${duplicates + 1} times`, severity: "high" });
      }
    }

    if (reasons.length === 0) return;

    const highestSeverity = reasons.some(r => r.severity === "high") ? "high"
      : reasons.some(r => r.severity === "medium") ? "medium" : "low";

    const combinedReason = reasons.map(r => r.reason).join("; ");

    await storage.createSpamReport({
      ip,
      nickname,
      reason: combinedReason,
      severity: highestSeverity,
      messageId,
      messageText: message.slice(0, 500),
      autoBanned: false,
      resolved: false,
    });

    if (highestSeverity === "high") {
      await storage.flagChatMessage(messageId, true);
    }

    const existingReports = await storage.getSpamReportsByIp(ip);
    if (existingReports.length >= SPAM_AUTO_BAN_THRESHOLD) {
      const isBlocked = await storage.isIpBlocked(ip);
      if (!isBlocked) {
        await storage.blockIp({
          ip,
          reason: `Auto-banned: ${existingReports.length} spam reports`,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
        await storage.createSpamReport({
          ip,
          nickname,
          reason: `AUTO-BAN triggered (${existingReports.length} reports)`,
          severity: "critical",
          messageId,
          messageText: message.slice(0, 500),
          autoBanned: true,
          resolved: false,
        });
      }
    }
  }

  app.get("/api/chat/messages", async (req, res) => {
    try {
      const coinTag = typeof req.query.coin === "string" ? req.query.coin : undefined;
      const before = typeof req.query.before === "string" ? parseInt(req.query.before) : undefined;
      const messages = await storage.getChatMessages({ coinTag, before, limit: 50 });
      res.json(messages);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/chat/messages", async (req, res) => {
    try {
      const clientIp = normalizeIp(req.ip || req.socket.remoteAddress || "unknown");

      const isBlocked = await storage.isIpBlocked(clientIp);
      if (isBlocked) {
        return res.status(403).json({ error: "Your IP has been blocked due to spam activity." });
      }

      const lastSent = chatRateLimit.get(clientIp) || 0;
      if (Date.now() - lastSent < 5000) {
        return res.status(429).json({ error: "Please wait a few seconds between messages." });
      }

      const { nickname, message, coinTag } = req.body;
      if (!nickname || typeof nickname !== "string" || nickname.trim().length < 1 || nickname.trim().length > 30) {
        return res.status(400).json({ error: "Nickname must be 1-30 characters." });
      }
      if (!message || typeof message !== "string" || message.trim().length < 1 || message.trim().length > 500) {
        return res.status(400).json({ error: "Message must be 1-500 characters." });
      }

      const lowerMsg = message.toLowerCase();
      const hasProfanity = PROFANITY_WORDS.some(w => lowerMsg.includes(w));

      const created = await storage.createChatMessage({
        nickname: nickname.trim().slice(0, 30),
        message: message.trim().slice(0, 500),
        coinTag: coinTag || null,
        ip: clientIp,
        flagged: hasProfanity,
      } as any);

      chatRateLimit.set(clientIp, Date.now());
      if (chatRateLimit.size > 10000) {
        const cutoff = Date.now() - 60000;
        for (const [k, v] of chatRateLimit) {
          if (v < cutoff) chatRateLimit.delete(k);
        }
      }

      const history = chatMessageHistory.get(clientIp) || { messages: [], timestamps: [] };
      history.messages.push(lowerMsg);
      history.timestamps.push(Date.now());
      const fiveMinAgo = Date.now() - 5 * 60 * 1000;
      history.messages = history.messages.slice(-30);
      history.timestamps = history.timestamps.filter(t => t > fiveMinAgo);
      chatMessageHistory.set(clientIp, history);

      if (chatMessageHistory.size > 5000) {
        const cutoff = Date.now() - 10 * 60 * 1000;
        for (const [k, v] of chatMessageHistory) {
          if (v.timestamps.every(t => t < cutoff)) chatMessageHistory.delete(k);
        }
      }

      analyzeSpam(clientIp, nickname.trim(), message.trim(), created.id).catch(err => {
        console.error("Spam analysis error:", err);
      });

      res.json({ ...created, ip: null });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/admin/spam/stats", requireAdmin, async (_req, res) => {
    try {
      const stats = await storage.getSpamStats();
      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/admin/spam/reports", requireAdmin, async (req, res) => {
    try {
      const resolved = req.query.resolved === "true" ? true : req.query.resolved === "false" ? false : undefined;
      const reports = await storage.getSpamReports({ resolved, limit: 200 });
      res.json(reports);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/spam/resolve/:id", requireAdmin, async (req, res) => {
    try {
      await storage.resolveSpamReport(parseInt(req.params.id));
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/spam/bulk-resolve", requireAdmin, async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids)) return res.status(400).json({ error: "ids must be an array" });
      await storage.bulkResolveSpamReports(ids);
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/admin/spam/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteSpamReport(parseInt(req.params.id));
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/spam/ban-ip", requireAdmin, async (req, res) => {
    try {
      const { ip, reason, duration } = req.body;
      if (!ip || typeof ip !== "string") return res.status(400).json({ error: "IP required" });
      const normalizedBanIp = normalizeIp(ip);
      const durationHours = Math.min(Math.max(parseInt(duration) || 24, 1), 8760);
      await storage.blockIp({
        ip: normalizedBanIp,
        reason: reason || "Manually banned from Spam Monitor",
        expiresAt: new Date(Date.now() + durationHours * 60 * 60 * 1000),
      });
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/show-login", async (_req, res) => {
    try {
      const val = await storage.getSetting("show_login_link");
      res.json({ show: val?.toLowerCase() !== "false" });
    } catch {
      res.json({ show: true });
    }
  });

  // ── NFT API (Alchemy — free, no key required) ──
    const ALCHEMY_NFT_CHAINS: Record<string, string> = {
      ethereum: "https://eth-mainnet.g.alchemy.com/nft/v3/demo",
      polygon: "https://polygon-mainnet.g.alchemy.com/nft/v3/demo",
      arbitrum: "https://arb-mainnet.g.alchemy.com/nft/v3/demo",
      optimism: "https://opt-mainnet.g.alchemy.com/nft/v3/demo",
      base: "https://base-mainnet.g.alchemy.com/nft/v3/demo",
    };
    const VALID_NFT_CHAINS = new Set(Object.keys(ALCHEMY_NFT_CHAINS));
    let nft_cache: Record<string, { data: any; timestamp: number }> = {};
    const NFT_CACHE_TTL = 120000;

    function nftCacheGet(key: string) {
      const c = nft_cache[key];
      if (c && Date.now() - c.timestamp < NFT_CACHE_TTL) return c.data;
      return null;
    }
    function nftCacheSet(key: string, data: any) {
      nft_cache[key] = { data, timestamp: Date.now() };
      const keys = Object.keys(nft_cache);
      if (keys.length > 100) delete nft_cache[keys[0]];
    }

    async function alchemyFetch(chain: string, endpoint: string, params: Record<string, string> = {}): Promise<any> {
      const base = ALCHEMY_NFT_CHAINS[chain];
      if (!base) return null;
      const qs = new URLSearchParams(params).toString();
      const url = `${base}/${endpoint}${qs ? "?" + qs : ""}`;
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) return null;
      return res.json();
    }

    async function alchemyPost(chain: string, endpoint: string, body: any): Promise<any> {
      const base = ALCHEMY_NFT_CHAINS[chain];
      if (!base) return null;
      const res = await fetch(`${base}/${endpoint}`, {
        method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) return null;
      return res.json();
    }

    const TOP_COLLECTIONS = [
      "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
      "0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB",
      "0x23581767a106ae21c074b2276D25e5C3e136a68b",
      "0x60E4d786628Fea6478F785A6d7e704777c86a7c6",
      "0xED5AF388653567Af2F388E6224dC7C4b3241C544",
      "0x49cF6f5d44E70224e2E23fDcdd2C053F30aDA28B",
      "0x34d85c9CDeB23FA97cb08333b511ac86E1C4E258",
      "0x8a90CAb2b38dba80c64b7734e58Ee1dB38B8992e",
      "0xBd3531dA5CF5857e7CfAA92426877b022e612cf8",
      "0x1A92f7381B9F03921564a437210bB9396471050C",
      "0x394E3d3044fC89fCDd966D3cb35Ac0B32B0Cda91",
      "0x5Af0D9827E0c53E4799BB226655A1de152A425a5",
      "0xa7d8d9ef8D8Ce8992Df33D8b8CF4Aebabd5bD270",
      "0x7Bd29408f11D2bFC23c34f18275bBf23bB716Bc7",
      "0xe785E82358879F061BC3dcAC6f0444462D4b5330",
      "0x306b1ea3ecdf94aB739F1910bbda052Ed4A9f949",
      "0xd774557b647330C91Bf44cfEDE4b0C2d8c4B5e3F",
      "0xba30E5F9Bb24caa003E9f2f0497Ad287FDF95623",
      "0x059EDD72Cd353dF5106D2B9cC5ab83a52287aC3a",
      "0x39ee2c7b3cb80254225884ca001F57118C8f21B6",
    ];

    const POLYGON_COLLECTIONS = [
      "0x2953399124F0cBB46d2CbACD8A89cF0599974963",
      "0xA604060890923Ff400e8c6f5290461A83AEdACec",
      "0x67F4732266C7300cca593C814d46bee72e40659F",
    ];

    app.get("/api/nfts/collections", async (req, res) => {
      try {
        const chain = (req.query.chain as string) || "ethereum";
        if (!VALID_NFT_CHAINS.has(chain)) return res.status(400).json({ error: "Invalid chain" });
        const cached = nftCacheGet(`collections-${chain}`);
        if (cached) return res.json(cached);

        const addresses = chain === "polygon" ? POLYGON_COLLECTIONS : chain === "ethereum" ? TOP_COLLECTIONS : TOP_COLLECTIONS.slice(0, 5);
        const data = await alchemyPost(chain, "getContractMetadataBatch", { contractAddresses: addresses });
        if (!data) return res.status(502).json({ error: "NFT API unavailable" });

        const contracts = Array.isArray(data?.contracts) ? data.contracts : [];
        const floorPromises = contracts.map(async (c: any) => {
          try {
            const fp = await alchemyFetch(chain, "getFloorPrice", { contractAddress: c.address });
            return { ...c, floorPrice: fp };
          } catch { return c; }
        });
        const enriched = await Promise.all(floorPromises);

        const collections = enriched.map((c: any) => ({
          name: c.openSeaMetadata?.collectionName || c.name || "Unknown",
          collection: c.openSeaMetadata?.collectionSlug || c.symbol || "",
          image_url: c.openSeaMetadata?.imageUrl || "",
          banner_image_url: c.openSeaMetadata?.bannerImageUrl || "",
          description: c.openSeaMetadata?.description || "",
          safelist_request_status: c.openSeaMetadata?.safelistRequestStatus || "",
          contract_address: c.address,
          token_type: c.tokenType,
          total_supply: c.totalSupply ? parseInt(c.totalSupply) : null,
          twitter_username: c.openSeaMetadata?.twitterUsername || "",
          discord_url: c.openSeaMetadata?.discordUrl || "",
          opensea_url: c.openSeaMetadata?.collectionSlug ? `https://opensea.io/collection/${c.openSeaMetadata.collectionSlug}` : "",
          stats: {
            floor_price: c.floorPrice?.openSea?.floorPrice ?? c.openSeaMetadata?.floorPrice ?? null,
            total_supply: c.totalSupply ? parseInt(c.totalSupply) : null,
          },
        }));

        nftCacheSet(`collections-${chain}`, collections);
        res.json(collections);
      } catch (err: any) {
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.get("/api/nfts/search", async (req, res) => {
      try {
        const q = (req.query.q as string || "").trim().slice(0, 100);
        if (!q) return res.status(400).json({ error: "Query required" });
        const cached = nftCacheGet(`search-${q}`);
        if (cached) return res.json(cached);

        const data = await alchemyFetch("ethereum", "searchContractMetadata", { query: q });
        if (!data) return res.status(502).json({ error: "NFT API unavailable" });
        const contracts = Array.isArray(data?.contracts) ? data.contracts : [];

        const results = contracts.map((c: any) => ({
          name: c.openSeaMetadata?.collectionName || c.name || "Unknown",
          collection: c.openSeaMetadata?.collectionSlug || c.symbol || "",
          image_url: c.openSeaMetadata?.imageUrl || "",
          description: c.openSeaMetadata?.description || "",
          safelist_request_status: c.openSeaMetadata?.safelistRequestStatus || "",
          contract_address: c.address,
          token_type: c.tokenType,
          total_supply: c.totalSupply ? parseInt(c.totalSupply) : null,
          opensea_url: c.openSeaMetadata?.collectionSlug ? `https://opensea.io/collection/${c.openSeaMetadata.collectionSlug}` : "",
          stats: {
            floor_price: c.openSeaMetadata?.floorPrice ?? null,
            total_supply: c.totalSupply ? parseInt(c.totalSupply) : null,
          },
        }));

        nftCacheSet(`search-${q}`, results);
        res.json(results);
      } catch (err: any) {
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.get("/api/nfts/collection/:address", async (req, res) => {
      try {
        const address = req.params.address;
        if (!/^0x[a-fA-F0-9]{40}$/.test(address)) return res.status(400).json({ error: "Invalid contract address" });
        const chain = (req.query.chain as string) || "ethereum";
        if (!VALID_NFT_CHAINS.has(chain)) return res.status(400).json({ error: "Invalid chain" });

        const [meta, fp] = await Promise.all([
          alchemyFetch(chain, "getContractMetadata", { contractAddress: address }),
          alchemyFetch(chain, "getFloorPrice", { contractAddress: address }),
        ]);
        if (!meta) return res.status(404).json({ error: "Collection not found" });

        res.json({
          name: meta.openSeaMetadata?.collectionName || meta.name || "Unknown",
          collection: meta.openSeaMetadata?.collectionSlug || meta.symbol || "",
          image_url: meta.openSeaMetadata?.imageUrl || "",
          banner_image_url: meta.openSeaMetadata?.bannerImageUrl || "",
          description: meta.openSeaMetadata?.description || "",
          safelist_request_status: meta.openSeaMetadata?.safelistRequestStatus || "",
          contract_address: meta.address,
          token_type: meta.tokenType,
          total_supply: meta.totalSupply ? parseInt(meta.totalSupply) : null,
          twitter_username: meta.openSeaMetadata?.twitterUsername || "",
          discord_url: meta.openSeaMetadata?.discordUrl || "",
          opensea_url: meta.openSeaMetadata?.collectionSlug ? `https://opensea.io/collection/${meta.openSeaMetadata.collectionSlug}` : "",
          stats: {
            floor_price: fp?.openSea?.floorPrice ?? meta.openSeaMetadata?.floorPrice ?? null,
            floor_price_looksrare: fp?.looksRare?.floorPrice ?? null,
            total_supply: meta.totalSupply ? parseInt(meta.totalSupply) : null,
          },
        });
      } catch (err: any) {
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.get("/api/nfts/collection/:address/nfts", async (req, res) => {
      try {
        const address = req.params.address;
        if (!/^0x[a-fA-F0-9]{40}$/.test(address)) return res.status(400).json({ error: "Invalid contract address" });
        const chain = (req.query.chain as string) || "ethereum";
        if (!VALID_NFT_CHAINS.has(chain)) return res.status(400).json({ error: "Invalid chain" });

        const data = await alchemyFetch(chain, "getNFTsForContract", { contractAddress: address, limit: "50", withMetadata: "true" });
        if (!data) return res.status(502).json({ error: "NFT API unavailable" });
        const nfts = Array.isArray(data?.nfts) ? data.nfts : [];

        res.json(nfts.map((n: any) => ({
          identifier: n.tokenId,
          name: n.name || n.raw?.metadata?.name || `#${n.tokenId}`,
          description: n.description || n.raw?.metadata?.description || "",
          image_url: n.image?.cachedUrl || n.image?.thumbnailUrl || n.image?.originalUrl || "",
          token_standard: n.tokenType,
          collection: n.collection?.name || n.contract?.name || "",
          contract: n.contract?.address,
          traits: n.raw?.metadata?.attributes || [],
          opensea_url: n.collection?.slug ? `https://opensea.io/assets/ethereum/${n.contract?.address}/${n.tokenId}` : "",
        })));
      } catch (err: any) {
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.get("/api/nfts/wallet/:address", async (req, res) => {
      try {
        const { address } = req.params;
        if (!/^0x[a-fA-F0-9]{40}$/.test(address)) return res.status(400).json({ error: "Invalid EVM address" });
        const chain = (req.query.chain as string) || "ethereum";
        if (!VALID_NFT_CHAINS.has(chain)) return res.status(400).json({ error: "Invalid chain" });

        const data = await alchemyFetch(chain, "getNFTsForOwner", { owner: address, pageSize: "100", withMetadata: "true" });
        if (!data) return res.status(502).json({ error: "NFT API unavailable" });
        const nfts = Array.isArray(data?.ownedNfts) ? data.ownedNfts : [];

        res.json(nfts.map((n: any) => ({
          identifier: n.tokenId,
          name: n.name || n.raw?.metadata?.name || `#${n.tokenId}`,
          description: n.description || n.raw?.metadata?.description || "",
          image_url: n.image?.cachedUrl || n.image?.thumbnailUrl || n.image?.pngUrl || n.image?.originalUrl || "",
          token_standard: n.tokenType,
          collection: n.collection?.name || n.contract?.name || "",
          contract: n.contract?.address,
          traits: n.raw?.metadata?.attributes || [],
          opensea_url: n.contract?.address && n.tokenId ? `https://opensea.io/assets/${chain}/${n.contract.address}/${n.tokenId}` : "",
          is_spam: n.contract?.isSpam || false,
        })));
      } catch (err: any) {
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.get("/api/nfts/collection/:address/stats", async (req, res) => {
      try {
        const address = req.params.address;
        if (!/^0x[a-fA-F0-9]{40}$/.test(address)) return res.status(400).json({ error: "Invalid contract address" });
        const chain = (req.query.chain as string) || "ethereum";
        if (!VALID_NFT_CHAINS.has(chain)) return res.status(400).json({ error: "Invalid chain" });

        const [meta, fp] = await Promise.all([
          alchemyFetch(chain, "getContractMetadata", { contractAddress: address }),
          alchemyFetch(chain, "getFloorPrice", { contractAddress: address }),
        ]);
        if (!meta) return res.status(404).json({ error: "Collection not found" });

        res.json({
          floor_price: fp?.openSea?.floorPrice ?? meta.openSeaMetadata?.floorPrice ?? null,
          floor_price_looksrare: fp?.looksRare?.floorPrice ?? null,
          total_supply: meta.totalSupply ? parseInt(meta.totalSupply) : null,
          token_type: meta.tokenType,
          name: meta.openSeaMetadata?.collectionName || meta.name,
          deployer: meta.contractDeployer,
          deployed_block: meta.deployedBlockNumber,
        });
      } catch (err: any) {
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.get("/api/nfts/sales/:address", async (req, res) => {
      try {
        const address = req.params.address;
        if (!/^0x[a-fA-F0-9]{40}$/.test(address)) return res.status(400).json({ error: "Invalid contract address" });
        const chain = (req.query.chain as string) || "ethereum";
        if (!VALID_NFT_CHAINS.has(chain)) return res.status(400).json({ error: "Invalid chain" });

        const data = await alchemyFetch(chain, "getNFTSales", { contractAddress: address, limit: "50" });
        if (!data) return res.status(502).json({ error: "NFT API unavailable" });
        const sales = Array.isArray(data?.nftSales) ? data.nftSales : [];
        res.json(sales);
      } catch (err: any) {
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.get("/api/nfts/asset/:chain/:contract/:tokenId", async (req, res) => {
      try {
        const { chain, contract, tokenId } = req.params;
        if (!VALID_NFT_CHAINS.has(chain)) return res.status(400).json({ error: "Invalid chain" });
        if (!/^0x[a-fA-F0-9]{40}$/.test(contract)) return res.status(400).json({ error: "Invalid contract address" });
        if (!/^\d+$/.test(tokenId)) return res.status(400).json({ error: "Invalid token ID" });

        const data = await alchemyFetch(chain, "getNFTMetadata", { contractAddress: contract, tokenId, refreshCache: "false" });
        if (!data) return res.status(404).json({ error: "NFT not found" });

        res.json({
          identifier: data.tokenId,
          name: data.name || data.raw?.metadata?.name || `#${data.tokenId}`,
          description: data.description || data.raw?.metadata?.description || "",
          image_url: data.image?.cachedUrl || data.image?.thumbnailUrl || data.image?.pngUrl || data.image?.originalUrl || "",
          token_standard: data.tokenType,
          collection: data.collection?.name || data.contract?.name || "",
          contract: data.contract?.address,
          traits: data.raw?.metadata?.attributes || [],
          owners: data.owners || [],
          rarity: data.rarity || null,
          metadata_url: data.raw?.tokenUri || "",
          opensea_url: `https://opensea.io/assets/${chain}/${contract}/${tokenId}`,
          is_spam: data.contract?.isSpam || false,
          contract_deployer: data.contract?.contractDeployer || "",
          total_supply: data.contract?.totalSupply || null,
        });
      } catch (err: any) {
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.get("/api/nfts/account/:address/collections", async (req, res) => {
      try {
        const { address } = req.params;
        if (!/^0x[a-fA-F0-9]{40}$/.test(address)) return res.status(400).json({ error: "Invalid EVM address" });
        const chain = (req.query.chain as string) || "ethereum";
        if (!VALID_NFT_CHAINS.has(chain)) return res.status(400).json({ error: "Invalid chain" });

        const data = await alchemyFetch(chain, "getContractsForOwner", { owner: address, pageSize: "50" });
        if (!data) return res.status(502).json({ error: "NFT API unavailable" });
        const contracts = Array.isArray(data?.contracts) ? data.contracts : [];

        res.json(contracts.map((c: any) => ({
          name: c.openSeaMetadata?.collectionName || c.name || c.symbol || "Unknown",
          collection: c.openSeaMetadata?.collectionSlug || "",
          image_url: c.openSeaMetadata?.imageUrl || "",
          contract_address: c.address,
          token_type: c.tokenType,
          total_supply: c.totalBalance || c.numDistinctTokensOwned || 0,
          is_spam: c.isSpam || false,
        })));
      } catch (err: any) {
        res.status(500).json({ error: "Internal server error" });
      }
    });

  // ── Banner Rotation API ──
  const VALID_BANNER_ZONES = new Set(["header", "footer", "sidebar", "blog-top", "blog-middle", "blog-bottom"]);
  const VALID_BANNER_SIZES = new Set(["728x90", "468x60", "300x250", "160x600", "320x50", "970x90", "336x280"]);

  app.get("/api/banner-settings", async (_req, res) => {
    try {
      const keys = ["banner_rotation_enabled", "banner_rotation_interval", "banner_footer_enabled", "banner_blog_enabled"];
      const result: Record<string, string> = {};
      for (const k of keys) {
        const v = await storage.getSetting(k);
        result[k] = v ?? (k === "banner_rotation_interval" ? "8" : "true");
      }
      res.json(result);
    } catch {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/banners/:zone", async (req, res) => {
    try {
      const zone = req.params.zone;
      if (!VALID_BANNER_ZONES.has(zone)) return res.status(400).json({ error: "Invalid zone" });
      const list = await storage.getActiveBannersByZone(zone);
      res.json(list);
    } catch {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const clickTracker = new Map<string, number>();
  setInterval(() => clickTracker.clear(), 60000);

  app.post("/api/banners/:id/click", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
      const clientIp = normalizeIp(req.ip || req.socket.remoteAddress || "unknown");
      const key = `${clientIp}:${id}`;
      const lastClick = clickTracker.get(key) || 0;
      if (Date.now() - lastClick < 30000) {
        return res.json({ ok: true });
      }
      clickTracker.set(key, Date.now());
      const banner = await storage.getBanner(id);
      if (!banner || !banner.active) return res.json({ ok: true });
      await storage.incrementBannerClick(id);
      res.json({ ok: true });
    } catch {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/banner-inquiry", async (req, res) => {
    try {
      const { name, email, company, bannerSize, message } = req.body;
      if (!name || !email || !bannerSize || !message) return res.status(400).json({ error: "Name, email, banner size, and message are required" });
      if (typeof name !== "string" || name.length > 200) return res.status(400).json({ error: "Invalid name" });
      if (typeof email !== "string" || !email.includes("@") || email.length > 200) return res.status(400).json({ error: "Invalid email" });
      if (typeof message !== "string" || message.length > 5000) return res.status(400).json({ error: "Message too long" });
      const inquiry = await storage.createBannerInquiry({
        name: name.slice(0, 200),
        email: email.slice(0, 200),
        company: company ? String(company).slice(0, 200) : null,
        bannerSize: String(bannerSize).slice(0, 20),
        message: message.slice(0, 5000),
      });
      res.json(inquiry);
    } catch {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/admin/banners", requireAdmin, async (_req, res) => {
    try {
      const list = await storage.getBanners();
      res.json(list);
    } catch {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/banners", requireAdmin, async (req, res) => {
    try {
      const { name, imageUrl, targetUrl, size, zone, active, sortOrder } = req.body;
      if (!name || !imageUrl || !targetUrl || !size || !zone) return res.status(400).json({ error: "Missing required fields" });
      if (!VALID_BANNER_SIZES.has(size)) return res.status(400).json({ error: "Invalid banner size" });
      if (!VALID_BANNER_ZONES.has(zone)) return res.status(400).json({ error: "Invalid zone" });
      const banner = await storage.createBanner({
        name: String(name).slice(0, 200),
        imageUrl: String(imageUrl).slice(0, 1000),
        targetUrl: String(targetUrl).slice(0, 1000),
        size,
        zone,
        active: active !== false,
        sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
      });
      res.json(banner);
    } catch {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/admin/banners/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
      const { name, imageUrl, targetUrl, size, zone, active, sortOrder } = req.body;
      const update: any = {};
      if (name !== undefined) update.name = String(name).slice(0, 200);
      if (imageUrl !== undefined) update.imageUrl = String(imageUrl).slice(0, 1000);
      if (targetUrl !== undefined) update.targetUrl = String(targetUrl).slice(0, 1000);
      if (size !== undefined && VALID_BANNER_SIZES.has(size)) update.size = size;
      if (zone !== undefined && VALID_BANNER_ZONES.has(zone)) update.zone = zone;
      if (active !== undefined) update.active = !!active;
      if (sortOrder !== undefined) update.sortOrder = Number(sortOrder) || 0;
      const banner = await storage.updateBanner(id, update);
      if (!banner) return res.status(404).json({ error: "Banner not found" });
      res.json(banner);
    } catch {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/admin/banners/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
      await storage.deleteBanner(id);
      res.json({ ok: true });
    } catch {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/admin/banner-inquiries", requireAdmin, async (_req, res) => {
    try {
      const list = await storage.getBannerInquiries();
      res.json(list);
    } catch {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/admin/banner-inquiries/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
      const { status, adminReply } = req.body;
      const update: any = {};
      if (status) update.status = String(status).slice(0, 20);
      if (adminReply !== undefined) update.adminReply = String(adminReply).slice(0, 5000);
      const inquiry = await storage.updateBannerInquiry(id, update);
      if (!inquiry) return res.status(404).json({ error: "Inquiry not found" });
      res.json(inquiry);
    } catch {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ── ChangeNOW Swap API ──
  const CN_API = "https://api.changenow.io/v2";
  let CN_KEY = await getApiKey("CHANGENOW_API_KEY");

  let cnCurrencyCache: { data: any; timestamp: number } | null = null;
  const CN_CURRENCY_TTL = 600000;

  app.get("/api/swap/currencies", async (_req, res) => {
    try {
      if (cnCurrencyCache && Date.now() - cnCurrencyCache.timestamp < CN_CURRENCY_TTL) {
        return res.json(cnCurrencyCache.data);
      }
      const resp = await fetch(`${CN_API}/exchange/currencies?active=true&fixedRate=true`, {
        headers: { "x-changenow-api-key": CN_KEY },
      });
      if (!resp.ok) throw new Error(`ChangeNOW API error: ${resp.status}`);
      const data = await resp.json();
      const filtered = data
        .filter((c: any) => c.isFiat === false && c.isAvailable !== false)
        .map((c: any) => ({
          ticker: c.ticker,
          name: c.name,
          image: c.image,
          network: c.network,
          hasExternalId: c.hasExternalId,
        }));
      cnCurrencyCache = { data: filtered, timestamp: Date.now() };
      res.json(filtered);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/swap/estimate", async (req, res) => {
    try {
      const { fromCurrency, toCurrency, fromAmount, fromNetwork, toNetwork } = req.query;
      if (!fromCurrency || !toCurrency || !fromAmount) {
        return res.status(400).json({ error: "Missing required parameters: fromCurrency, toCurrency, fromAmount" });
      }
      const amt = parseFloat(String(fromAmount));
      if (!isFinite(amt) || amt <= 0) {
        return res.status(400).json({ error: "fromAmount must be a positive number" });
      }
      const tickerRegex = /^[a-zA-Z0-9]{1,20}$/;
      if (!tickerRegex.test(String(fromCurrency)) || !tickerRegex.test(String(toCurrency))) {
        return res.status(400).json({ error: "Invalid currency ticker" });
      }
      const estimateUrl = new URL(`${CN_API}/exchange/estimated-amount`);
      estimateUrl.searchParams.set("fromCurrency", String(fromCurrency));
      estimateUrl.searchParams.set("toCurrency", String(toCurrency));
      estimateUrl.searchParams.set("fromAmount", String(amt));
      if (fromNetwork) estimateUrl.searchParams.set("fromNetwork", String(fromNetwork));
      if (toNetwork) estimateUrl.searchParams.set("toNetwork", String(toNetwork));
      estimateUrl.searchParams.set("flow", "standard");
      estimateUrl.searchParams.set("type", "direct");
      const resp = await fetch(estimateUrl.toString(), {
        headers: { "x-changenow-api-key": CN_KEY },
      });
      if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({}));
        return res.status(resp.status).json({ error: errBody.message || errBody.error || `Estimate failed (${resp.status})` });
      }
      const data = await resp.json();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/swap/create", async (req, res) => {
    try {
      const { fromCurrency, toCurrency, fromAmount, address, fromNetwork, toNetwork, extraId, refundAddress } = req.body;
      if (!fromCurrency || !toCurrency || !fromAmount || !address) {
        return res.status(400).json({ error: "Missing required fields: fromCurrency, toCurrency, fromAmount, address" });
      }
      const amt = parseFloat(fromAmount);
      if (!isFinite(amt) || amt <= 0) {
        return res.status(400).json({ error: "fromAmount must be a positive number" });
      }
      const tickerRegex = /^[a-zA-Z0-9]{1,20}$/;
      if (!tickerRegex.test(String(fromCurrency)) || !tickerRegex.test(String(toCurrency))) {
        return res.status(400).json({ error: "Invalid currency ticker" });
      }
      if (String(address).length < 10 || String(address).length > 256) {
        return res.status(400).json({ error: "Invalid address length" });
      }
      const payload: any = {
        fromCurrency: String(fromCurrency),
        toCurrency: String(toCurrency),
        fromAmount: amt,
        address: String(address).trim(),
        flow: "standard",
        type: "direct",
      };
      if (fromNetwork) payload.fromNetwork = fromNetwork;
      if (toNetwork) payload.toNetwork = toNetwork;
      if (extraId) payload.extraId = extraId;
      if (refundAddress) payload.refundAddress = refundAddress;

      const resp = await fetch(`${CN_API}/exchange`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-changenow-api-key": CN_KEY,
        },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({}));
        return res.status(resp.status).json({ error: errBody.message || errBody.error || `Exchange creation failed (${resp.status})` });
      }
      const data = await resp.json();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/swap/status/:id", async (req, res) => {
    try {
      const id = req.params.id;
      if (!id || !/^[a-zA-Z0-9_-]{6,128}$/.test(id)) {
        return res.status(400).json({ error: "Invalid exchange ID format" });
      }

      const v2Resp = await fetch(`${CN_API}/exchange/by-id/${encodeURIComponent(id)}`, {
        headers: { "x-changenow-api-key": CN_KEY },
      });
      if (v2Resp.ok) {
        const data = await v2Resp.json();
        return res.json(data);
      }

      const v1Resp = await fetch(`https://api.changenow.io/v1/transactions/${encodeURIComponent(id)}/${CN_KEY}`);
      if (v1Resp.ok) {
        const data = await v1Resp.json();
        return res.json(data);
      }

      const errBody = await v2Resp.json().catch(() => ({}));
      return res.status(404).json({
        error: errBody.message || "Transaction not found. Please verify your transaction ID is correct. Note: only transactions created through TokenAltcoin or ChangeNOW can be tracked here."
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Public exchanges endpoint
  app.get("/api/exchanges", async (_req, res) => {
    try {
      const list = await storage.getExchanges(true);
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin exchanges endpoints
  app.get("/api/admin/exchanges", requireAdmin, async (_req, res) => {
    try {
      const list = await storage.getExchanges(false);
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/exchanges", requireAdmin, async (req, res) => {
    try {
      const { name, url, affiliateUrl, description, type, country, year, tradingPairs, featured, active, sortOrder, logo } = req.body;
      if (!name || !url) return res.status(400).json({ error: "Name and URL are required" });
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const exchange = await storage.createExchange({
        name, slug, url, logo: logo || null,
        affiliateUrl: affiliateUrl || null,
        description: description || null,
        type: type || "centralized",
        country: country || null,
        year: year ? parseInt(year) : null,
        tradingPairs: tradingPairs ? parseInt(tradingPairs) : null,
        featured: featured === true,
        active: active !== false,
        sortOrder: sortOrder ? parseInt(sortOrder) : 0,
      });
      res.json(exchange);
    } catch (err: any) {
      if (err.message?.includes("unique")) {
        return res.status(409).json({ error: "An exchange with this name already exists" });
      }
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/admin/exchanges/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { name, url, affiliateUrl, description, type, country, year, tradingPairs, featured, active, sortOrder, logo } = req.body;
      const updates: any = {};
      if (name !== undefined) { updates.name = name; updates.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }
      if (url !== undefined) updates.url = url;
      if (logo !== undefined) updates.logo = logo;
      if (affiliateUrl !== undefined) updates.affiliateUrl = affiliateUrl;
      if (description !== undefined) updates.description = description;
      if (type !== undefined) updates.type = type;
      if (country !== undefined) updates.country = country;
      if (year !== undefined) updates.year = year ? parseInt(year) : null;
      if (tradingPairs !== undefined) updates.tradingPairs = tradingPairs ? parseInt(tradingPairs) : null;
      if (featured !== undefined) updates.featured = featured;
      if (active !== undefined) updates.active = active;
      if (sortOrder !== undefined) updates.sortOrder = parseInt(sortOrder);
      const exchange = await storage.updateExchange(id, updates);
      if (!exchange) return res.status(404).json({ error: "Exchange not found" });
      res.json(exchange);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/admin/exchanges/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteExchange(id);
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/exchanges/seed", requireAdmin, async (_req, res) => {
    try {
      const existing = await storage.getExchanges(false);
      const existingSlugs = new Set(existing.map((e: any) => e.slug));
      const defaultExchanges = [
        { name: "Binance", url: "https://www.binance.com", description: "World's largest crypto exchange by trading volume", type: "centralized", country: "Global", year: 2017, tradingPairs: 1500, featured: true, sortOrder: 1 },
        { name: "Binance.US", url: "https://www.binance.us", description: "US-regulated version of Binance for American traders", type: "centralized", country: "United States", year: 2019, tradingPairs: 150, featured: false, sortOrder: 2 },
        { name: "Coinbase", url: "https://www.coinbase.com", description: "US-based regulated crypto exchange, publicly traded (NASDAQ)", type: "centralized", country: "United States", year: 2012, tradingPairs: 500, featured: true, sortOrder: 3, affiliateUrl: "https://coinbase.com/join/NC7ZTX4?src=ios-link" },
        { name: "Kraken", url: "https://www.kraken.com", description: "US-based exchange known for security and compliance", type: "centralized", country: "United States", year: 2011, tradingPairs: 600, featured: true, sortOrder: 3 },
        { name: "Bybit", url: "https://www.bybit.com", description: "Leading crypto derivatives and spot exchange", type: "centralized", country: "Dubai", year: 2018, tradingPairs: 800, featured: true, sortOrder: 4 },
        { name: "OKX", url: "https://www.okx.com", description: "Global exchange with advanced trading features and Web3 wallet", type: "centralized", country: "Seychelles", year: 2017, tradingPairs: 700, featured: true, sortOrder: 5 },
        { name: "KuCoin", url: "https://www.kucoin.com", description: "People's exchange with wide altcoin selection", type: "centralized", country: "Seychelles", year: 2017, tradingPairs: 900, featured: false, sortOrder: 6 },
        { name: "Gate.io", url: "https://www.gate.io", description: "Exchange with extensive altcoin listings and margin trading", type: "centralized", country: "Cayman Islands", year: 2013, tradingPairs: 1700, featured: false, sortOrder: 7 },
        { name: "Bitfinex", url: "https://www.bitfinex.com", description: "Professional trading platform for advanced traders", type: "centralized", country: "British Virgin Islands", year: 2012, tradingPairs: 400, featured: false, sortOrder: 8 },
        { name: "Huobi (HTX)", url: "https://www.htx.com", description: "Global exchange formerly known as Huobi Global", type: "centralized", country: "Seychelles", year: 2013, tradingPairs: 700, featured: false, sortOrder: 9 },
        { name: "MEXC", url: "https://www.mexc.com", description: "Exchange known for listing new tokens early", type: "centralized", country: "Seychelles", year: 2018, tradingPairs: 2000, featured: false, sortOrder: 10 },
        { name: "Bitget", url: "https://www.bitget.com", description: "Copy trading and derivatives exchange", type: "centralized", country: "Seychelles", year: 2018, tradingPairs: 700, featured: false, sortOrder: 11 },
        { name: "Crypto.com", url: "https://crypto.com", description: "Exchange with Visa card and DeFi wallet integration", type: "centralized", country: "Singapore", year: 2016, tradingPairs: 350, featured: true, sortOrder: 12 },
        { name: "Gemini", url: "https://www.gemini.com", description: "US-regulated exchange founded by the Winklevoss twins", type: "centralized", country: "United States", year: 2014, tradingPairs: 200, featured: true, sortOrder: 13, affiliateUrl: "https://exchange.gemini.com/register?referral=68zng9ce&type=referral" },
        { name: "Bitstamp", url: "https://www.bitstamp.net", description: "One of the oldest crypto exchanges, EU regulated", type: "centralized", country: "Luxembourg", year: 2011, tradingPairs: 150, featured: false, sortOrder: 14 },
        { name: "Upbit", url: "https://upbit.com", description: "South Korea's largest crypto exchange", type: "centralized", country: "South Korea", year: 2017, tradingPairs: 300, featured: false, sortOrder: 15 },
        { name: "Bittrex", url: "https://www.bittrex.com", description: "US-based exchange with strong security focus", type: "centralized", country: "United States", year: 2014, tradingPairs: 300, featured: false, sortOrder: 16 },
        { name: "Poloniex", url: "https://poloniex.com", description: "Crypto exchange with wide trading pair support", type: "centralized", country: "Seychelles", year: 2014, tradingPairs: 400, featured: false, sortOrder: 17 },
        { name: "BingX", url: "https://www.bingx.com", description: "Social trading exchange with copy trading features", type: "centralized", country: "Singapore", year: 2018, tradingPairs: 500, featured: false, sortOrder: 18 },
        { name: "Uniswap", url: "https://app.uniswap.org", description: "Leading Ethereum DEX with automated market making", type: "decentralized", country: "Global", year: 2018, tradingPairs: 5000, featured: true, sortOrder: 19 },
        { name: "PancakeSwap", url: "https://pancakeswap.finance", description: "Top DEX on BNB Chain with farming and lottery", type: "decentralized", country: "Global", year: 2020, tradingPairs: 4000, featured: false, sortOrder: 20 },
        { name: "dYdX", url: "https://dydx.exchange", description: "Decentralized perpetual futures exchange", type: "decentralized", country: "Global", year: 2017, tradingPairs: 100, featured: false, sortOrder: 21 },
        { name: "SushiSwap", url: "https://www.sushi.com", description: "Multi-chain DEX with liquidity mining", type: "decentralized", country: "Global", year: 2020, tradingPairs: 2000, featured: false, sortOrder: 22 },
        { name: "Curve Finance", url: "https://curve.fi", description: "DEX optimized for stablecoin and pegged asset trading", type: "decentralized", country: "Global", year: 2020, tradingPairs: 500, featured: false, sortOrder: 23 },
        { name: "Jupiter", url: "https://jup.ag", description: "Leading DEX aggregator on Solana", type: "decentralized", country: "Global", year: 2021, tradingPairs: 3000, featured: true, sortOrder: 24 },
        { name: "Raydium", url: "https://raydium.io", description: "Solana AMM and DEX with Serum integration", type: "decentralized", country: "Global", year: 2021, tradingPairs: 1500, featured: false, sortOrder: 25 },
        { name: "1inch", url: "https://1inch.io", description: "Multi-chain DEX aggregator for best swap rates", type: "decentralized", country: "Global", year: 2020, tradingPairs: 3000, featured: false, sortOrder: 26 },
        { name: "Changelly", url: "https://changelly.com", description: "Instant crypto exchange with simple swap interface", type: "centralized", country: "Czech Republic", year: 2015, tradingPairs: 500, featured: false, sortOrder: 27 },
        { name: "FixedFloat", url: "https://fixedfloat.com", description: "Lightning-fast crypto exchange with fixed and floating rates", type: "centralized", country: "Global", year: 2018, tradingPairs: 200, featured: false, sortOrder: 28 },
        { name: "Phemex", url: "https://phemex.com", description: "Derivatives exchange with zero-fee spot trading", type: "centralized", country: "Singapore", year: 2019, tradingPairs: 300, featured: false, sortOrder: 29 },
        { name: "LBank", url: "https://www.lbank.com", description: "Exchange with innovative token listings", type: "centralized", country: "British Virgin Islands", year: 2015, tradingPairs: 800, featured: false, sortOrder: 30 },
        { name: "Coincheck", url: "https://coincheck.com", description: "Japan's leading crypto exchange, regulated by FSA", type: "centralized", country: "Japan", year: 2012, tradingPairs: 30, featured: false, sortOrder: 31 },
        { name: "Korbit", url: "https://www.korbit.co.kr", description: "South Korea's first crypto exchange", type: "centralized", country: "South Korea", year: 2013, tradingPairs: 100, featured: false, sortOrder: 32 },
        { name: "Bithumb", url: "https://www.bithumb.com", description: "Major South Korean cryptocurrency exchange", type: "centralized", country: "South Korea", year: 2014, tradingPairs: 250, featured: false, sortOrder: 33 },
        { name: "WOO X", url: "https://x.woo.org", description: "Zero-fee trading with deep liquidity from WOO Network", type: "centralized", country: "Global", year: 2019, tradingPairs: 200, featured: false, sortOrder: 34 },
        { name: "AscendEX", url: "https://ascendex.com", description: "Exchange with DeFi yield farming features", type: "centralized", country: "Singapore", year: 2018, tradingPairs: 500, featured: false, sortOrder: 35 },
        { name: "WhiteBIT", url: "https://whitebit.com", description: "European crypto exchange with SMART staking", type: "centralized", country: "Lithuania", year: 2018, tradingPairs: 400, featured: false, sortOrder: 36 },
        { name: "Bitkub", url: "https://www.bitkub.com", description: "Thailand's largest regulated crypto exchange", type: "centralized", country: "Thailand", year: 2018, tradingPairs: 50, featured: false, sortOrder: 37 },
        { name: "CoinDCX", url: "https://coindcx.com", description: "India's largest crypto exchange with INR support", type: "centralized", country: "India", year: 2018, tradingPairs: 500, featured: false, sortOrder: 38 },
        { name: "WazirX", url: "https://wazirx.com", description: "India's most trusted crypto exchange", type: "centralized", country: "India", year: 2018, tradingPairs: 400, featured: false, sortOrder: 39 },
        { name: "Luno", url: "https://www.luno.com", description: "Crypto exchange serving emerging markets across Africa and Asia", type: "centralized", country: "South Africa", year: 2013, tradingPairs: 20, featured: false, sortOrder: 40 },
        { name: "BitMart", url: "https://www.bitmart.com", description: "Global exchange with early token listings and staking", type: "centralized", country: "Cayman Islands", year: 2017, tradingPairs: 1000, featured: false, sortOrder: 41 },
        { name: "CoinEx", url: "https://www.coinex.com", description: "BCH-friendly exchange with AMM DEX features", type: "centralized", country: "Hong Kong", year: 2017, tradingPairs: 900, featured: false, sortOrder: 42 },
        { name: "ProBit Global", url: "https://www.probit.com", description: "Korean exchange with IEO launchpad and staking", type: "centralized", country: "South Korea", year: 2018, tradingPairs: 600, featured: false, sortOrder: 43 },
        { name: "Bitrue", url: "https://www.bitrue.com", description: "XRP-friendly exchange with Power Piggy yield", type: "centralized", country: "Singapore", year: 2018, tradingPairs: 800, featured: false, sortOrder: 44 },
        { name: "Trader Joe", url: "https://traderjoexyz.com", description: "Leading DEX on Avalanche with liquidity book AMM", type: "decentralized", country: "Global", year: 2021, tradingPairs: 1000, featured: false, sortOrder: 45 },
        { name: "Orca", url: "https://www.orca.so", description: "User-friendly DEX on Solana with concentrated liquidity", type: "decentralized", country: "Global", year: 2021, tradingPairs: 800, featured: false, sortOrder: 46 },
        { name: "Osmosis", url: "https://osmosis.zone", description: "Leading DEX in the Cosmos ecosystem with IBC swaps", type: "decentralized", country: "Global", year: 2021, tradingPairs: 500, featured: false, sortOrder: 47 },
        { name: "Camelot", url: "https://camelot.exchange", description: "Native DEX on Arbitrum with custom liquidity features", type: "decentralized", country: "Global", year: 2022, tradingPairs: 600, featured: false, sortOrder: 48 },
        { name: "Aerodrome", url: "https://aerodrome.finance", description: "Central liquidity hub on Base chain", type: "decentralized", country: "Global", year: 2023, tradingPairs: 400, featured: false, sortOrder: 49 },
        { name: "GMX", url: "https://gmx.io", description: "Decentralized perpetual futures on Arbitrum and Avalanche", type: "decentralized", country: "Global", year: 2021, tradingPairs: 50, featured: false, sortOrder: 50 },
        { name: "Hyperliquid", url: "https://hyperliquid.xyz", description: "High-performance perpetual DEX on its own L1 chain", type: "decentralized", country: "Global", year: 2023, tradingPairs: 150, featured: false, sortOrder: 51 },
        { name: "Cetus", url: "https://www.cetus.zone", description: "Concentrated liquidity DEX on Sui and Aptos", type: "decentralized", country: "Global", year: 2022, tradingPairs: 300, featured: false, sortOrder: 52 },
        { name: "Robinhood", url: "https://robinhood.com", description: "Commission-free stock and crypto trading platform", type: "centralized", country: "United States", year: 2013, tradingPairs: 20, featured: true, sortOrder: 53, affiliateUrl: "https://join.robinhood.com/alexisd4" },
        { name: "YoBit", url: "https://yobit.net", description: "Long-running exchange with thousands of altcoin pairs and faucets", type: "centralized", country: "Russia", year: 2014, tradingPairs: 8000, featured: false, sortOrder: 54, affiliateUrl: "https://yobit.net/?bonus=irJzI" },
        { name: "Coinbase Advanced", url: "https://advanced.coinbase.com", description: "Professional trading platform by Coinbase with advanced charting and order types", type: "centralized", country: "United States", year: 2022, tradingPairs: 500, featured: true, sortOrder: 55, affiliateUrl: "https://advanced.coinbase.com/join/VDZGGVS" },
      ];
      let count = 0;
      for (const ex of defaultExchanges) {
        const slug = ex.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        if (existingSlugs.has(slug)) continue;
        try {
          await storage.createExchange({ ...ex, slug, logo: null, affiliateUrl: (ex as any).affiliateUrl || null, active: true });
          count++;
        } catch { }
      }
      res.json({ message: `Seeded ${count} exchanges`, count });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/exchanges/update-affiliates", requireAdmin, async (_req, res) => {
    try {
      const affiliateMap: Record<string, string> = {
        "coinbase": "https://coinbase.com/join/NC7ZTX4?src=ios-link",
        "gemini": "https://exchange.gemini.com/register?referral=68zng9ce&type=referral",
        "robinhood": "https://join.robinhood.com/alexisd4",
        "yobit": "https://yobit.net/?bonus=irJzI",
        "coinbase-advanced": "https://advanced.coinbase.com/join/VDZGGVS",
      };
      const existing = await storage.getExchanges(false);
      let count = 0;
      for (const ex of existing) {
        const slug = (ex as any).slug;
        if (slug && affiliateMap[slug] && !(ex as any).affiliateUrl) {
          await storage.updateExchange((ex as any).id, { affiliateUrl: affiliateMap[slug] });
          count++;
        }
      }
      res.json({ message: `Updated ${count} exchanges with affiliate URLs`, count });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Contact Messages ──
  app.post("/api/contact", async (req, res) => {
    try {
      const parsed = insertContactMessageSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid form data", details: parsed.error.flatten() });
      const msg = await storage.createMessage(parsed.data);
      res.json({ success: true, id: msg.id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/admin/messages", requireAdmin, async (_req, res) => {
    try {
      const messages = await storage.getMessages();
      res.json(messages);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/admin/messages/unread-count", requireAdmin, async (_req, res) => {
    try {
      const count = await storage.getUnreadCount();
      res.json({ count });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/admin/messages/:id", requireAdmin, async (req, res) => {
    try {
      const msg = await storage.getMessage(parseInt(req.params.id));
      if (!msg) return res.status(404).json({ error: "Message not found" });
      res.json(msg);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/admin/messages/:id/read", requireAdmin, async (req, res) => {
    try {
      await storage.markMessageRead(parseInt(req.params.id));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/admin/messages/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteMessage(parseInt(req.params.id));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Blog Posts ──
  app.get("/api/blog", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 12, 50);
      const category = req.query.category as string;
      const offset = (page - 1) * limit;
      const [posts, total] = await Promise.all([
        storage.getPosts({ published: true, category: category || undefined, limit, offset }),
        storage.getPostCount({ published: true, category: category || undefined }),
      ]);
      res.json({ posts, total, page, pages: Math.ceil(total / limit) });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/blog/:slug", async (req, res) => {
    try {
      const post = await storage.getPostBySlug(req.params.slug);
      if (!post || !post.published) return res.status(404).json({ error: "Post not found" });
      await storage.incrementPostViews(post.id);
      res.json(post);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/admin/blog", requireAdmin, async (req, res) => {
    try {
      const posts = await storage.getPosts();
      res.json(posts);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/blog/generate", requireAdmin, async (req, res) => {
    try {
      const { topic, category, tone } = req.body;
      if (!topic || typeof topic !== "string") {
        return res.status(400).json({ error: "Topic is required" });
      }

      const cat = category || "Guide";
      const toneStyle = tone || "professional";

      const TOPIC_TEMPLATES: Record<string, { intros: string[]; sections: string[][]; conclusions: string[] }> = {
        default: {
          intros: [
            `The world of cryptocurrency continues to evolve at a remarkable pace. In this ${cat.toLowerCase()}, we explore ${topic} — a subject that has captured the attention of investors, developers, and enthusiasts worldwide.`,
            `Understanding ${topic} is essential for anyone looking to navigate the rapidly changing crypto landscape. Whether you're a seasoned trader or just getting started, this comprehensive ${cat.toLowerCase()} will provide valuable insights.`,
            `${topic} represents one of the most significant developments in the blockchain space today. As the crypto market matures, understanding this concept becomes increasingly important for making informed decisions.`,
          ],
          sections: [
            [
              `<h2>What You Need to Know About ${topic}</h2>`,
              `<p>At its core, ${topic} addresses fundamental challenges in the cryptocurrency ecosystem. The technology behind it leverages blockchain's inherent strengths — decentralization, transparency, and security — while pushing the boundaries of what's possible in digital finance.</p>`,
              `<p>Market analysts have noted growing interest in this area, with trading volumes and adoption metrics showing consistent upward trends. This growth reflects a broader shift toward more sophisticated crypto solutions that cater to both retail and institutional investors.</p>`,
            ],
            [
              `<h2>Key Benefits and Opportunities</h2>`,
              `<p>One of the primary advantages of ${topic} is the potential for enhanced efficiency in crypto operations. By leveraging modern blockchain protocols, users can access faster transaction speeds, lower fees, and improved security compared to traditional systems.</p>`,
              `<p>For investors, this opens up new avenues for portfolio diversification and risk management. The ability to participate in emerging crypto sectors early often yields significant returns, though it's important to approach any investment with careful research and risk awareness.</p>`,
              `<p>Developers and builders in the space are also finding new opportunities, as the infrastructure supporting ${topic} continues to expand. Open-source tools, developer grants, and growing community support make it easier than ever to contribute to and benefit from these innovations.</p>`,
            ],
            [
              `<h2>Risks and Considerations</h2>`,
              `<p>While the potential upside is significant, it's crucial to understand the risks involved. Market volatility remains a constant factor in cryptocurrency, and ${topic} is no exception. Prices can fluctuate dramatically in short periods, making it important to only invest what you can afford to lose.</p>`,
              `<p>Regulatory uncertainty is another consideration. Different jurisdictions have varying approaches to crypto regulation, which can impact the accessibility and legality of certain activities related to ${topic}. Staying informed about regulatory developments in your region is essential.</p>`,
              `<p>Security is paramount in the crypto space. Always use reputable platforms, enable two-factor authentication, and store significant holdings in hardware wallets. Never share your private keys or seed phrases with anyone.</p>`,
            ],
            [
              `<h2>How to Get Started</h2>`,
              `<p>Getting started with ${topic} doesn't have to be complicated. Begin by educating yourself through reputable sources — whitepapers, official documentation, and established crypto news outlets are excellent starting points.</p>`,
              `<p>Next, consider using tools like TokenAltcoin's multi-chain explorer and wallet tracker to monitor market conditions and track your assets across different blockchains. These free tools provide real-time data and analytics that can inform your decisions.</p>`,
              `<p>Start small and scale gradually as you build confidence and understanding. The crypto space rewards patience and continuous learning, so take the time to develop a solid foundation before making significant commitments.</p>`,
            ],
            [
              `<h2>Market Outlook and Future Trends</h2>`,
              `<p>The future outlook for ${topic} appears promising, with several major developments on the horizon. Institutional adoption continues to grow, bringing increased liquidity and legitimacy to the market.</p>`,
              `<p>Technological advancements, including improvements in blockchain scalability, interoperability, and user experience, are making crypto more accessible to mainstream users. These developments are likely to accelerate adoption and drive innovation in the coming years.</p>`,
              `<p>As the ecosystem matures, expect to see more sophisticated products, better regulatory clarity, and increased integration with traditional financial systems. The intersection of DeFi, NFTs, and real-world assets is creating new paradigms that could reshape how we think about digital ownership and value transfer.</p>`,
            ],
          ],
          conclusions: [
            `<h2>Final Thoughts</h2><p>${topic} represents an exciting frontier in the cryptocurrency space. By staying informed, practicing due diligence, and using the right tools, you can position yourself to benefit from the opportunities this area presents. Remember to always do your own research (DYOR) and never invest more than you can afford to lose.</p><p>Use TokenAltcoin's free tools — including our multi-chain explorer, arbitrage scanner, and real-time price tracker — to stay ahead of market movements and make informed decisions.</p>`,
            `<h2>Summary</h2><p>As we've explored in this ${cat.toLowerCase()}, ${topic} is a multifaceted subject with significant implications for the broader crypto ecosystem. The key takeaway is that knowledge and preparation are your greatest assets in navigating this space.</p><p>Bookmark TokenAltcoin for daily updates, real-time market data, and comprehensive analysis across 50+ blockchain networks. Our platform is designed to give you the edge you need in the fast-moving world of cryptocurrency.</p>`,
          ],
        },
      };

      const template = TOPIC_TEMPLATES.default;
      const pickRandom = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

      const toneAdjust = (text: string) => {
        if (toneStyle === "casual") {
          return text.replace(/It is crucial/g, "It's really important").replace(/essential/g, "super helpful").replace(/significant/g, "huge").replace(/Furthermore/g, "Plus").replace(/However/g, "But").replace(/represents/g, "is basically");
        }
        if (toneStyle === "beginner") {
          return text.replace(/leverages/g, "uses").replace(/paradigms/g, "ideas").replace(/ecosystem/g, "world").replace(/infrastructure/g, "systems").replace(/multifaceted/g, "complex");
        }
        return text;
      };

      const numSections = 3 + Math.floor(Math.random() * 2);
      const shuffled = [...template.sections].sort(() => Math.random() - 0.5);
      const selectedSections = shuffled.slice(0, numSections);

      const contentParts = [
        `<p>${toneAdjust(pickRandom(template.intros))}</p>`,
        ...selectedSections.map(s => toneAdjust(s.join("\n"))),
        toneAdjust(pickRandom(template.conclusions)),
      ];
      const content = contentParts.join("\n\n");

      const cleanText = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      const words = cleanText.split(" ");
      const excerpt = words.slice(0, 35).join(" ") + "...";

      const tagPool = ["crypto", "blockchain", "bitcoin", "ethereum", "defi", "trading", "investing", "altcoins", "web3", "nft", "staking", "wallet", "exchange", "market", "analysis", "tokenomics", "mining", "yield", "dex", "security"];
      const topicWords = topic.toLowerCase().split(/\s+/);
      const relevantTags = tagPool.filter(t => topicWords.some(w => t.includes(w) || w.includes(t)));
      const randomTags = tagPool.filter(t => !relevantTags.includes(t)).sort(() => Math.random() - 0.5).slice(0, 4 - relevantTags.length);
      const tags = [...new Set([...relevantTags, ...randomTags])].slice(0, 5);

      const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

      const metaTitle = `${topic} — ${cat} | TokenAltcoin`.slice(0, 60);
      const metaDescription = excerpt.slice(0, 155) + (excerpt.length > 155 ? "..." : "");
      const metaKeywords = tags.join(", ");

      res.json({
        title: topic,
        slug,
        content,
        excerpt,
        category: cat,
        tags,
        metaTitle,
        metaDescription,
        metaKeywords,
        published: false,
        featured: false,
        coverImage: "",
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/seo/auto-fill", requireAdmin, async (req, res) => {
    try {
      const { pagePath, pageLabel, siteUrl } = req.body;
      if (!pagePath || !pageLabel) {
        return res.status(400).json({ error: "pagePath and pageLabel required" });
      }

      const baseUrl = siteUrl || "https://tokenaltcoin.com";

      const PAGE_SEO: Record<string, { title: string; description: string; keywords: string }> = {
        "/": {
          title: "TokenAltcoin — Free Multi-Chain Crypto Explorer & Portfolio Tracker",
          description: "Track wallets, explore 50+ blockchains, monitor live crypto prices, scan arbitrage opportunities, and manage your portfolio. All free, no sign-up required.",
          keywords: "crypto explorer, blockchain explorer, wallet tracker, crypto prices, bitcoin, ethereum, portfolio tracker, defi, multi-chain",
        },
        "/wallet": {
          title: "EVM Wallet Tracker — Multi-Chain Balance & Transaction History",
          description: "Track any EVM wallet across Ethereum, BSC, Polygon, Arbitrum, Optimism, Base, and Avalanche. View balances, transactions, and token transfers in real-time.",
          keywords: "wallet tracker, ethereum wallet, evm wallet, multi-chain wallet, transaction history, token transfers, portfolio",
        },
        "/prices": {
          title: "Live Crypto Prices — 2,500+ Coins with Market Data & Charts",
          description: "Real-time cryptocurrency prices for 2,500+ coins. Market cap, volume, 24h changes, gainers & losers, Fear & Greed Index, and interactive price charts.",
          keywords: "crypto prices, bitcoin price, ethereum price, cryptocurrency market, market cap, trading volume, coin prices",
        },
        "/blog": {
          title: "TokenAltcoin Blog — Crypto News, Guides & Market Analysis",
          description: "Expert crypto guides, market analysis, trading tutorials, and blockchain news. Stay informed with TokenAltcoin's comprehensive crypto blog.",
          keywords: "crypto blog, blockchain news, crypto guides, trading tutorials, market analysis, defi guides, bitcoin news",
        },
        "/contact": {
          title: "Contact TokenAltcoin — Get in Touch With Our Team",
          description: "Have questions or feedback? Contact the TokenAltcoin team. We're here to help with crypto tools, partnerships, and platform support.",
          keywords: "contact tokenaltcoin, crypto support, feedback, partnership, help",
        },
        "/news": {
          title: "Crypto & World News — Latest Headlines & Market Sentiment",
          description: "Breaking cryptocurrency news, world headlines, and market sentiment analysis. Filter by category, track sentiment trends, and stay ahead of the market.",
          keywords: "crypto news, bitcoin news, blockchain news, market sentiment, breaking crypto, world news",
        },
        "/exchanges": {
          title: "Crypto Exchanges Directory — 50+ CEX & DEX Platforms Compared",
          description: "Compare 50+ cryptocurrency exchanges worldwide. Find the best CEX and DEX platforms with features, fees, and trusted affiliate links.",
          keywords: "crypto exchanges, best exchange, coinbase, binance, dex, cex, trading platform, crypto trading",
        },
        "/staking": {
          title: "Crypto Staking Calculator — Estimate PoS Rewards & Earnings",
          description: "Calculate staking rewards for 10+ proof-of-stake cryptocurrencies. Compound interest projections, track positions, and maximize your passive crypto income.",
          keywords: "staking calculator, crypto staking, proof of stake, staking rewards, passive income, ethereum staking, cardano staking",
        },
        "/masternodes": {
          title: "Masternode Tracker — Collateral, ROI & Validator Statistics",
          description: "Track masternode requirements, ROI, and live validator stats for major PoS networks. Real-time staking data for ETH, SOL, ATOM, ADA, DOT, and more.",
          keywords: "masternode tracker, validator stats, staking apy, masternode roi, proof of stake, crypto nodes",
        },
        "/arbitrage": {
          title: "Crypto Arbitrage Scanner — Find Cross-Exchange Price Differences",
          description: "Real-time arbitrage opportunities across 20+ exchanges. Compare prices for 40 cryptocurrencies, calculate profits, and find the best spreads instantly.",
          keywords: "crypto arbitrage, price difference, cross-exchange trading, arbitrage scanner, bitcoin arbitrage, spread trading",
        },
        "/swap": {
          title: "Crypto Swap — Exchange 900+ Coins Instantly with Best Rates",
          description: "Swap cryptocurrencies instantly across 900+ coins. Real-time exchange rates, low fees, and 3-step exchange process powered by ChangeNOW.",
          keywords: "crypto swap, coin exchange, token swap, changenow, cryptocurrency exchange, instant swap",
        },
        "/dex": {
          title: "DEX Screener — Real-Time DEX Pair Analytics & Trending Tokens",
          description: "Track trending DEX tokens, search pairs across 80+ blockchains, view real-time price changes, volume, and liquidity data for decentralized exchanges.",
          keywords: "dex screener, dex analytics, trending tokens, uniswap, defi pairs, liquidity, dex trading",
        },
        "/calculator": {
          title: "Crypto Calculator — Real-Time Crypto-to-Fiat Converter",
          description: "Convert between 12 popular cryptocurrencies and 8 fiat currencies in real-time. Quick conversion shortcuts and live popular exchange rates.",
          keywords: "crypto calculator, bitcoin converter, crypto to fiat, ethereum converter, currency converter, exchange rate",
        },
        "/chat": {
          title: "Community Chat — Discuss Crypto Markets & Trading Ideas",
          description: "Join the TokenAltcoin community chat. Discuss crypto markets, share trading ideas, and connect with fellow crypto enthusiasts in real-time.",
          keywords: "crypto chat, community, trading discussion, crypto forum, market talk, bitcoin chat",
        },
        "/dashboard": {
          title: "Crypto Dashboard — Customizable Market Overview & Widgets",
          description: "Your personalized crypto command center. Drag-and-drop widgets for market overview, portfolio, alerts, watchlist, Fear & Greed, and trending coins.",
          keywords: "crypto dashboard, market overview, portfolio widget, crypto widgets, customizable dashboard",
        },
        "/airdrops": {
          title: "Free Crypto Airdrops — Verified Token Giveaways & Rewards",
          description: "Discover verified crypto airdrops and token giveaways. Step-by-step guides, requirements, and deadlines for the latest free crypto opportunities.",
          keywords: "crypto airdrops, free crypto, token giveaway, airdrop list, free tokens, crypto rewards",
        },
        "/gold": {
          title: "Gold & Precious Metals — Live Spot Prices & Tokenized Gold",
          description: "Live gold and silver spot prices, gold-backed token market data, weight calculator, and tokenized gold news. Track PAXG, XAUT, and more.",
          keywords: "gold price, tokenized gold, paxg, xaut, precious metals, gold backed crypto, silver price",
        },
      };

      const seo = PAGE_SEO[pagePath] || {
        title: `${pageLabel} — TokenAltcoin`,
        description: `Explore ${pageLabel.toLowerCase()} on TokenAltcoin — your free multi-chain crypto platform with live data, analytics, and portfolio tools.`,
        keywords: `${pageLabel.toLowerCase()}, crypto, blockchain, tokenaltcoin`,
      };

      res.json({
        metaTitle: seo.title,
        metaDescription: seo.description,
        metaKeywords: seo.keywords,
        ogTitle: seo.title,
        ogDescription: seo.description,
        ogImage: `${baseUrl}/opengraph.jpg`,
        canonical: `${baseUrl}${pagePath}`,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/blog", requireAdmin, async (req, res) => {
    try {
      const parsed = insertBlogPostSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid post data", details: parsed.error.flatten() });
      const post = await storage.createPost(parsed.data);
      res.json(post);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/admin/blog/:id", requireAdmin, async (req, res) => {
    try {
      const post = await storage.getPost(parseInt(req.params.id));
      if (!post) return res.status(404).json({ error: "Post not found" });
      res.json(post);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/admin/blog/:id", requireAdmin, async (req, res) => {
    try {
      const post = await storage.updatePost(parseInt(req.params.id), req.body);
      if (!post) return res.status(404).json({ error: "Post not found" });
      res.json(post);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/admin/blog/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deletePost(parseInt(req.params.id));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── SEO Meta ──
  app.get("/api/seo/:pagePath", async (req, res) => {
    try {
      const meta = await storage.getSeoMeta("/" + req.params.pagePath);
      res.json(meta || {});
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/admin/seo", requireAdmin, async (_req, res) => {
    try {
      const allMeta = await storage.getAllSeoMeta();
      res.json(allMeta);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/admin/seo", requireAdmin, async (req, res) => {
    try {
      const body = req.body;
      if (typeof body === "object" && !Array.isArray(body) && body.pagePath) {
        const parsed = insertSeoMetaSchema.safeParse(body);
        if (!parsed.success) return res.status(400).json({ error: "Invalid SEO data", details: parsed.error.flatten() });
        const meta = await storage.setSeoMeta(parsed.data);
        return res.json(meta);
      }
      const entries = Object.values(body) as any[];
      const results = [];
      for (const entry of entries) {
        if (!entry.pagePath) continue;
        const parsed = insertSeoMetaSchema.safeParse(entry);
        if (parsed.success) {
          const meta = await storage.setSeoMeta(parsed.data);
          results.push(meta);
        }
      }
      res.json(results);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/admin/seo/:pagePath", requireAdmin, async (req, res) => {
    try {
      await storage.deleteSeoMeta("/" + req.params.pagePath);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Airdrops (Public) ──
  app.get("/api/airdrops", async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const offset = parseInt(req.query.offset as string) || 0;
      const data = await storage.getAirdrops({ status: "approved", limit, offset });
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/airdrops/:slug", async (req, res) => {
    try {
      const airdrop = await storage.getAirdropBySlug(req.params.slug);
      if (!airdrop || airdrop.status !== "approved") {
        return res.status(404).json({ error: "Airdrop not found" });
      }
      res.json(airdrop);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/airdrops/submit", async (req, res) => {
    try {
      const name = (req.body.name || "").trim();
      if (!name) return res.status(400).json({ error: "Name is required" });
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      if (!slug) return res.status(400).json({ error: "Invalid name" });
      const existing = await storage.getAirdropBySlug(slug);
      if (existing) return res.status(400).json({ error: "An airdrop with this name already exists" });

      const validRewardTypes = ["Task", "Signup", "Hold", "Social", "Testnet", "Other"];
      const rewardType = validRewardTypes.includes(req.body.rewardType) ? req.body.rewardType : "Task";
      const validBlockchains = ["Ethereum", "BSC", "Polygon", "Solana", "Arbitrum", "Optimism", "Base", "Avalanche", "Fantom", "Cosmos", "Sui", "Aptos", "Other"];
      const blockchain = validBlockchains.includes(req.body.blockchain) ? req.body.blockchain : "Ethereum";

      const website = typeof req.body.website === "string" && req.body.website.startsWith("http") ? req.body.website : null;
      const steps = Array.isArray(req.body.steps) ? req.body.steps.filter((s: any) => typeof s === "string" && s.trim()).map((s: string) => s.trim()) : null;

      const airdrop = await storage.createAirdrop({
        name,
        slug,
        logo: typeof req.body.logo === "string" ? req.body.logo : null,
        website,
        description: typeof req.body.description === "string" ? req.body.description.slice(0, 2000) : null,
        tokenSymbol: typeof req.body.tokenSymbol === "string" ? req.body.tokenSymbol.slice(0, 20) : null,
        rewardType,
        rewardAmount: typeof req.body.rewardAmount === "string" ? req.body.rewardAmount.slice(0, 100) : null,
        referralReward: typeof req.body.referralReward === "string" ? req.body.referralReward.slice(0, 100) : null,
        blockchain,
        startDate: typeof req.body.startDate === "string" ? req.body.startDate.slice(0, 20) : null,
        endDate: typeof req.body.endDate === "string" ? req.body.endDate.slice(0, 20) : null,
        steps,
        requirements: typeof req.body.requirements === "string" ? req.body.requirements.slice(0, 1000) : null,
        status: "pending",
        featured: false,
        submitterEmail: typeof req.body.submitterEmail === "string" ? req.body.submitterEmail.slice(0, 200) : null,
        submitterName: typeof req.body.submitterName === "string" ? req.body.submitterName.slice(0, 100) : null,
      });
      res.status(201).json(airdrop);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Airdrops (Admin) ──
  app.get("/api/admin/airdrops", requireAdmin, async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const data = await storage.getAirdrops(status ? { status } : {});
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/admin/airdrops/pending-count", requireAdmin, async (_req, res) => {
    try {
      const count = await storage.getPendingAirdropCount();
      res.json({ count });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch("/api/admin/airdrops/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const allowedFields: Record<string, boolean> = {
        name: true, slug: true, logo: true, website: true, description: true,
        tokenSymbol: true, rewardType: true, rewardAmount: true, referralReward: true,
        blockchain: true, startDate: true, endDate: true, steps: true, requirements: true,
        status: true, featured: true,
      };
      const validStatuses = ["pending", "approved", "rejected"];
      const data: any = {};
      for (const [key, val] of Object.entries(req.body)) {
        if (allowedFields[key]) {
          if (key === "status" && !validStatuses.includes(val as string)) continue;
          data[key] = val;
        }
      }
      const updated = await storage.updateAirdrop(id, data);
      if (!updated) return res.status(404).json({ error: "Not found" });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/admin/airdrops/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteAirdrop(id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Sitemap.xml ──
  app.get("/sitemap.xml", async (_req, res) => {
    try {
      const baseUrl = "https://tokenaltcoin.com";
      const staticPages = ["/", "/wallet", "/prices", "/watchlist", "/exchanges", "/swap", "/xrp", "/staking", "/news", "/masternodes", "/blog", "/airdrops", "/contact", "/privacy", "/terms"];
      const posts = await storage.getPosts({ published: true });

      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
      for (const page of staticPages) {
        xml += `  <url><loc>${baseUrl}${page}</loc><changefreq>${page === "/" ? "hourly" : "daily"}</changefreq><priority>${page === "/" ? "1.0" : "0.8"}</priority></url>\n`;
      }
      for (const post of posts) {
        xml += `  <url><loc>${baseUrl}/blog/${post.slug}</loc><lastmod>${post.updatedAt.toISOString().split("T")[0]}</lastmod><changefreq>weekly</changefreq><priority>0.6</priority></url>\n`;
      }
      xml += `</urlset>`;
      res.set("Content-Type", "application/xml");
      res.send(xml);
    } catch (err: any) {
      res.status(500).send("Error generating sitemap");
    }
  });

  // ── DexScreener API Proxy ──
  const DEXSCREENER_BASE = "https://api.dexscreener.com";
  const dexCache: Record<string, { data: any; timestamp: number }> = {};
  const DEX_CACHE_SHORT = 30_000;
  const DEX_CACHE_MEDIUM = 60_000;
  const DEX_CACHE_LONG = 120_000;

  function getDexCache(key: string, ttl: number) {
    const c = dexCache[key];
    if (c && Date.now() - c.timestamp < ttl) return c.data;
    return null;
  }

  app.get("/api/dex/trending", async (_req, res) => {
    try {
      const cached = getDexCache("dex-trending", DEX_CACHE_MEDIUM);
      if (cached) return res.json(cached);
      const response = await fetch(`${DEXSCREENER_BASE}/token-boosts/top/v1`);
      if (!response.ok) throw new Error(`DexScreener error: ${response.status}`);
      const data = await response.json();
      if (Array.isArray(data)) {
        dexCache["dex-trending"] = { data, timestamp: Date.now() };
      }
      res.json(data);
    } catch (e: any) {
      const cached = getDexCache("dex-trending", DEX_CACHE_LONG * 5);
      if (cached) return res.json(cached);
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/dex/profiles", async (_req, res) => {
    try {
      const cached = getDexCache("dex-profiles", DEX_CACHE_MEDIUM);
      if (cached) return res.json(cached);
      const response = await fetch(`${DEXSCREENER_BASE}/token-profiles/latest/v1`);
      if (!response.ok) throw new Error(`DexScreener error: ${response.status}`);
      const data = await response.json();
      if (Array.isArray(data)) {
        dexCache["dex-profiles"] = { data, timestamp: Date.now() };
      }
      res.json(data);
    } catch (e: any) {
      const cached = getDexCache("dex-profiles", DEX_CACHE_LONG * 5);
      if (cached) return res.json(cached);
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/dex/search", async (req, res) => {
    try {
      const q = String(req.query.q || "").trim().slice(0, 100);
      if (!q || q.length < 2) return res.json({ pairs: [] });
      const cacheKey = `dex-search-${q.toLowerCase()}`;
      const cached = getDexCache(cacheKey, DEX_CACHE_SHORT);
      if (cached) return res.json(cached);
      const searchKeys = Object.keys(dexCache).filter(k => k.startsWith("dex-search-"));
      if (searchKeys.length > 200) {
        const sorted = searchKeys.map(k => ({ k, ts: dexCache[k].timestamp })).sort((a, b) => a.ts - b.ts);
        sorted.slice(0, 100).forEach(({ k }) => delete dexCache[k]);
      }
      const response = await fetch(`${DEXSCREENER_BASE}/latest/dex/search?q=${encodeURIComponent(q)}`);
      if (!response.ok) throw new Error(`DexScreener error: ${response.status}`);
      const data = await response.json();
      dexCache[cacheKey] = { data, timestamp: Date.now() };
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/dex/pairs/:chainId/:pairAddress", async (req, res) => {
    try {
      const { chainId, pairAddress } = req.params;
      if (!chainId || !pairAddress) return res.status(400).json({ error: "Missing params" });
      const cacheKey = `dex-pair-${chainId}-${pairAddress}`;
      const cached = getDexCache(cacheKey, DEX_CACHE_SHORT);
      if (cached) return res.json(cached);
      const response = await fetch(`${DEXSCREENER_BASE}/latest/dex/pairs/${encodeURIComponent(chainId)}/${encodeURIComponent(pairAddress)}`);
      if (!response.ok) throw new Error(`DexScreener error: ${response.status}`);
      const data = await response.json();
      dexCache[cacheKey] = { data, timestamp: Date.now() };
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/dex/token/:chainId/:tokenAddress", async (req, res) => {
    try {
      const { chainId, tokenAddress } = req.params;
      if (!chainId || !tokenAddress) return res.status(400).json({ error: "Missing params" });
      const cacheKey = `dex-token-${chainId}-${tokenAddress}`;
      const cached = getDexCache(cacheKey, DEX_CACHE_LONG);
      if (cached) return res.json(cached);
      const response = await fetch(`${DEXSCREENER_BASE}/token-pairs/v1/${encodeURIComponent(chainId)}/${encodeURIComponent(tokenAddress)}`);
      if (!response.ok) throw new Error(`DexScreener error: ${response.status}`);
      const data = await response.json();
      if (Array.isArray(data)) {
        dexCache[cacheKey] = { data, timestamp: Date.now() };
      }
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── Robots.txt ──
  app.get("/robots.txt", async (_req, res) => {
    try {
      const custom = await storage.getSetting("robots_txt_content");
      if (custom) {
        res.set("Content-Type", "text/plain");
        return res.send(custom);
      }
      res.set("Content-Type", "text/plain");
      res.send(`User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: https://tokenaltcoin.com/sitemap.xml`);
    } catch {
      res.set("Content-Type", "text/plain");
      res.send(`User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: https://tokenaltcoin.com/sitemap.xml`);
    }
  });

  // ==================== GOLD ROUTES ====================
  const goldCache: Record<string, { data: any; timestamp: number }> = {};
  const GOLD_CACHE_SHORT = 60000; // 1 min for spot price
  const GOLD_CACHE_MEDIUM = 300000; // 5 min for tokens

  function getGoldCache(key: string, ttl: number) {
    const entry = goldCache[key];
    if (entry && Date.now() - entry.timestamp < ttl) return entry.data;
    return null;
  }

  app.get("/api/gold/spot", async (_req, res) => {
    try {
      const cached = getGoldCache("gold-spot", GOLD_CACHE_SHORT);
      if (cached) return res.json(cached);
      const response = await fetch("https://forex-data-feed.swissquote.com/public-quotes/bboquotes/instrument/XAU/USD");
      if (!response.ok) throw new Error(`Gold price API error: ${response.status}`);
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const prices = data[0]?.spreadProfilePrices;
        if (Array.isArray(prices) && prices.length > 0) {
          const mid = (prices[0].bid + prices[0].ask) / 2;
          const result = {
            price: mid,
            bid: prices[0].bid,
            ask: prices[0].ask,
            timestamp: data[0].ts || Date.now(),
            currency: "USD",
            unit: "troy ounce",
          };
          goldCache["gold-spot"] = { data: result, timestamp: Date.now() };
          return res.json(result);
        }
      }
      throw new Error("Invalid gold price data");
    } catch (e: any) {
      const cached = getGoldCache("gold-spot", GOLD_CACHE_SHORT * 10);
      if (cached) return res.json(cached);
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/gold/silver-spot", async (_req, res) => {
    try {
      const cached = getGoldCache("silver-spot", GOLD_CACHE_SHORT);
      if (cached) return res.json(cached);
      const response = await fetch("https://forex-data-feed.swissquote.com/public-quotes/bboquotes/instrument/XAG/USD");
      if (!response.ok) throw new Error(`Silver price API error: ${response.status}`);
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const prices = data[0]?.spreadProfilePrices;
        if (Array.isArray(prices) && prices.length > 0) {
          const mid = (prices[0].bid + prices[0].ask) / 2;
          const result = {
            price: mid,
            bid: prices[0].bid,
            ask: prices[0].ask,
            timestamp: data[0].ts || Date.now(),
            currency: "USD",
            unit: "troy ounce",
          };
          goldCache["silver-spot"] = { data: result, timestamp: Date.now() };
          return res.json(result);
        }
      }
      throw new Error("Invalid silver price data");
    } catch (e: any) {
      const cached = getGoldCache("silver-spot", GOLD_CACHE_SHORT * 10);
      if (cached) return res.json(cached);
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/gold/tokens", async (_req, res) => {
    try {
      const cached = getGoldCache("gold-tokens", GOLD_CACHE_MEDIUM);
      if (cached) return res.json(cached);
      const response = await fetch(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=tokenized-gold&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=1h%2C24h%2C7d"
      );
      if (!response.ok) throw new Error(`CoinGecko API error: ${response.status}`);
      const data = await response.json();
      if (Array.isArray(data)) {
        goldCache["gold-tokens"] = { data, timestamp: Date.now() };
        return res.json(data);
      }
      throw new Error("Invalid gold tokens data");
    } catch (e: any) {
      const cached = getGoldCache("gold-tokens", GOLD_CACHE_MEDIUM * 5);
      if (cached) return res.json(cached);
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/gold/news", async (_req, res) => {
    try {
      const cached = getGoldCache("gold-news", GOLD_CACHE_MEDIUM);
      if (cached) return res.json(cached);

      let goldArticles: any[] = [];

      let braveKey = await getApiKey("BRAVE_API_KEY");
      if (braveKey && !braveKey.endsWith("-")) braveKey = braveKey + "-";
      if (braveKey) {
        try {
          const response = await fetch(
            `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent("gold price precious metals PAXG XAUT crypto news")}&count=15`,
            {
              headers: {
                "Accept": "application/json",
                "Accept-Encoding": "gzip",
                "X-Subscription-Token": braveKey,
              },
            }
          );
          if (response.ok) {
            const data = await response.json();
            const webResults = data.web?.results || [];
            goldArticles = webResults.map((item: any) => ({
              title: item.title,
              url: item.url,
              body: item.description || "",
              imageUrl: item.thumbnail?.src || null,
              source: (item.meta_url?.hostname || new URL(item.url).hostname).replace("www.", ""),
              publishedAt: item.age ? Math.floor(Date.now() / 1000) : Math.floor(Date.now() / 1000),
              categories: "Gold,Precious Metals",
            }));
          }
        } catch {}
      }

      if (goldArticles.length === 0) {
        const response = await fetch(
          "https://min-api.cryptocompare.com/data/v2/news/?lang=EN&sortOrder=popular&extraParams=TokenAltcoin"
        );
        if (response.ok) {
          const data = await response.json();
          const articles = data?.Data;
          if (Array.isArray(articles)) {
            const keywords = ["gold", "paxg", "xaut", "precious metal", "tokenized gold", "gold-backed", "silver", "platinum", "commodity", "commodities", "metal"];
            goldArticles = articles.filter((a: any) => {
              const text = `${a.title || ""} ${a.body || ""} ${a.categories || ""}`.toLowerCase();
              return keywords.some(k => text.includes(k));
            }).slice(0, 10).map((a: any) => ({
              title: a.title,
              url: a.url || a.guid,
              body: a.body,
              imageUrl: a.imageurl,
              source: a.source_info?.name || a.source,
              publishedAt: a.published_on,
              categories: a.categories,
            }));
          }
        }
      }

      goldCache["gold-news"] = { data: goldArticles, timestamp: Date.now() };
      res.json(goldArticles);
    } catch (e: any) {
      const cached = getGoldCache("gold-news", GOLD_CACHE_MEDIUM * 5);
      if (cached) return res.json(cached);
      res.json([]);
    }
  });

  (async () => {
    try {
      const existingCount = await storage.getPostCount({ published: true });
      if (existingCount === 0) {
        console.log("[blog] No blog posts found, seeding...");
        const blogSeedData = [
          { title: "What Is Bitcoin and How Does It Work?", slug: "what-is-bitcoin", content: "<h2>The Birth of Digital Currency</h2><p>Bitcoin, created in 2009 by the pseudonymous Satoshi Nakamoto, is the world's first decentralized cryptocurrency. It operates on a peer-to-peer network without the need for intermediaries like banks or governments.</p><h2>How Bitcoin Works</h2><p>At its core, Bitcoin uses <strong>blockchain technology</strong> — a distributed ledger that records all transactions across a network of computers. Each block contains a cryptographic hash of the previous block, creating an immutable chain.</p><h3>Key Components</h3><ul><li><strong>Mining:</strong> Specialized computers solve complex mathematical puzzles to validate transactions and add new blocks to the blockchain. Miners are rewarded with newly created Bitcoin.</li><li><strong>Wallets:</strong> Digital wallets store your private keys, which are needed to sign transactions and prove ownership of your Bitcoin.</li><li><strong>Transactions:</strong> When you send Bitcoin, the transaction is broadcast to the network, verified by miners, and added to a block.</li></ul><h2>Why Bitcoin Matters</h2><p>Bitcoin introduced the concept of trustless, permissionless money. With a fixed supply of 21 million coins, it's designed to be deflationary — making it attractive as a store of value, often called \"digital gold.\"</p><p>Use TokenAltcoin's <a href='/explorer'>Multi-Chain Explorer</a> to track Bitcoin transactions in real-time.</p>", excerpt: "Learn the fundamentals of Bitcoin — how blockchain technology works, why mining matters, and what makes BTC the king of crypto.", author: "TokenAltcoin Team", category: "Tutorial", tags: ["Bitcoin", "Blockchain", "Beginner"], coverImage: "", published: true, featured: true, metaTitle: "What Is Bitcoin and How Does It Work? | TokenAltcoin", metaDescription: "A complete beginner's guide to Bitcoin — how blockchain works, mining, wallets, and why BTC matters.", metaKeywords: "Bitcoin, BTC, blockchain, cryptocurrency, beginner guide" },
          { title: "Ethereum 2.0: The Complete Guide to Proof of Stake", slug: "ethereum-proof-of-stake-guide", content: "<h2>From Proof of Work to Proof of Stake</h2><p>Ethereum's transition to Proof of Stake (PoS) was one of the most significant upgrades in crypto history. Known as \"The Merge,\" this shift reduced Ethereum's energy consumption by over 99%.</p><h2>How Proof of Stake Works</h2><p>Instead of miners competing to solve puzzles, <strong>validators</strong> stake 32 ETH as collateral to participate in block production. Validators are chosen randomly to propose blocks, and other validators attest to the validity.</p><h3>Benefits of PoS</h3><ul><li><strong>Energy Efficiency:</strong> No need for power-hungry mining rigs</li><li><strong>Lower Barrier:</strong> Staking pools allow participation with any amount</li><li><strong>Security:</strong> Malicious validators risk losing their staked ETH (slashing)</li></ul><h2>Staking Rewards</h2><p>Validators earn rewards for proposing and attesting to blocks. Current APY ranges from 3-5% depending on the total ETH staked.</p><p>Calculate your potential staking rewards with our <a href='/staking'>Staking Calculator</a>.</p>", excerpt: "Everything you need to know about Ethereum's transition to Proof of Stake — how validators work, staking rewards, and what it means for the network.", author: "TokenAltcoin Team", category: "Guide", tags: ["Ethereum", "Proof of Stake", "Staking", "ETH 2.0"], coverImage: "", published: true, featured: true, metaTitle: "Ethereum 2.0: Complete Guide to Proof of Stake | TokenAltcoin", metaDescription: "Everything about Ethereum's Proof of Stake — validators, staking rewards, and the impact of The Merge.", metaKeywords: "Ethereum, Proof of Stake, staking, validators, The Merge" },
          { title: "Top 10 DeFi Protocols You Should Know in 2026", slug: "top-defi-protocols-2026", content: "<h2>The DeFi Landscape</h2><p>Decentralized Finance (DeFi) continues to reshape how we interact with financial services. Here are the top protocols making an impact.</p><h3>1. Aave</h3><p>The leading lending and borrowing protocol, supporting multiple chains and offering flash loans.</p><h3>2. Uniswap</h3><p>The largest decentralized exchange (DEX), pioneering the automated market maker (AMM) model.</p><h3>3. Lido</h3><p>The dominant liquid staking protocol, allowing users to stake ETH while maintaining liquidity.</p><h3>4. MakerDAO</h3><p>The protocol behind DAI, one of the most trusted decentralized stablecoins.</p><h3>5. Curve Finance</h3><p>Specialized DEX optimized for stablecoin and pegged-asset trading with minimal slippage.</p><h3>6. Compound</h3><p>Algorithmic money market protocol enabling lending and borrowing at variable rates.</p><h3>7. Pendle</h3><p>Innovative yield trading protocol that separates yield from principal.</p><h3>8. GMX</h3><p>Decentralized perpetual futures exchange with deep liquidity.</p><h3>9. Eigenlayer</h3><p>Restaking protocol extending Ethereum's security to other services.</p><h3>10. Jupiter</h3><p>The leading DEX aggregator on Solana, offering the best swap rates.</p><p>Track DeFi token prices on our <a href='/prices'>Live Prices</a> page.</p>", excerpt: "Explore the top 10 DeFi protocols shaping the crypto landscape in 2026, from lending platforms to DEX aggregators.", author: "TokenAltcoin Team", category: "Analysis", tags: ["DeFi", "Protocols", "Uniswap", "Aave"], coverImage: "", published: true, featured: true, metaTitle: "Top 10 DeFi Protocols to Know in 2026 | TokenAltcoin", metaDescription: "Explore the most important DeFi protocols of 2026 — from Aave and Uniswap to emerging platforms reshaping finance.", metaKeywords: "DeFi, protocols, Uniswap, Aave, Lido, decentralized finance" },
          { title: "How to Read a Blockchain Explorer Like a Pro", slug: "how-to-read-blockchain-explorer", content: "<h2>What Is a Blockchain Explorer?</h2><p>A blockchain explorer is a search engine for blockchain data. It lets you look up transactions, wallet balances, smart contracts, and more.</p><h2>Key Information You Can Find</h2><h3>Transaction Details</h3><ul><li><strong>Transaction Hash (TxHash):</strong> A unique identifier for each transaction</li><li><strong>Block Number:</strong> Which block the transaction was included in</li><li><strong>From/To:</strong> Sender and receiver addresses</li><li><strong>Value:</strong> Amount of crypto transferred</li><li><strong>Gas Used:</strong> Computational resources consumed</li></ul><h3>Address Information</h3><ul><li>Balance in native token and all held tokens</li><li>Complete transaction history</li><li>Token transfers and NFTs</li></ul><h2>Tips for Using Explorers</h2><p>Always verify transaction confirmations before considering a payment final. For EVM chains, check the internal transactions tab for complex contract interactions.</p><p>Try our <a href='/explorer'>Multi-Chain Explorer</a> to search across Ethereum, BSC, Polygon, and more.</p>", excerpt: "Master the art of reading blockchain explorers — understand transaction hashes, block confirmations, gas fees, and address details.", author: "TokenAltcoin Team", category: "Tutorial", tags: ["Explorer", "Blockchain", "Tutorial"], coverImage: "", published: true, featured: false, metaTitle: "How to Read a Blockchain Explorer | TokenAltcoin", metaDescription: "Learn to navigate blockchain explorers — understand transactions, blocks, addresses, and smart contracts.", metaKeywords: "blockchain explorer, transactions, blocks, addresses" },
          { title: "Understanding Gas Fees: Why They Matter and How to Save", slug: "understanding-gas-fees", content: "<h2>What Are Gas Fees?</h2><p>Gas fees are the cost of executing operations on a blockchain network. On Ethereum, every transaction requires computational resources, and gas is the unit used to measure that cost.</p><h2>How Gas Works</h2><p>Gas fees = <strong>Gas Units × Gas Price (Gwei)</strong>. After EIP-1559, Ethereum uses a base fee that adjusts dynamically based on network demand, plus an optional priority fee (tip) for faster processing.</p><h3>Factors Affecting Gas</h3><ul><li><strong>Network Congestion:</strong> More transactions = higher gas prices</li><li><strong>Transaction Complexity:</strong> Simple transfers cost less than smart contract interactions</li><li><strong>Time of Day:</strong> Gas tends to be lower during off-peak hours (weekends, late night UTC)</li></ul><h2>How to Save on Gas</h2><ul><li>Use Layer 2 solutions like Arbitrum or Optimism for 10-100x cheaper transactions</li><li>Batch multiple operations into one transaction</li><li>Set a reasonable gas limit and use gas price trackers</li><li>Time your transactions during low-activity periods</li></ul><p>Monitor gas fees in real-time on our <a href='/explorer'>Explorer</a>.</p>", excerpt: "Everything you need to know about blockchain gas fees — what they are, why they fluctuate, and practical tips to minimize costs.", author: "TokenAltcoin Team", category: "Tutorial", tags: ["Gas Fees", "Ethereum", "Layer 2"], coverImage: "", published: true, featured: false, metaTitle: "Understanding Gas Fees and How to Save | TokenAltcoin", metaDescription: "Learn about gas fees on Ethereum and other blockchains, plus practical tips to minimize transaction costs.", metaKeywords: "gas fees, Ethereum, Gwei, EIP-1559, Layer 2" },
          { title: "XRP Ledger: A Deep Dive Into Ripple's Technology", slug: "xrp-ledger-deep-dive", content: "<h2>What Is the XRP Ledger?</h2><p>The XRP Ledger (XRPL) is a decentralized blockchain designed for fast, low-cost cross-border payments. It uses a unique consensus protocol rather than Proof of Work or Proof of Stake.</p><h2>How XRPL Consensus Works</h2><p>The XRPL uses a <strong>Federated Byzantine Agreement</strong> model. Validators (called Unique Node List or UNL nodes) agree on the order and validity of transactions. Consensus is reached in 3-5 seconds.</p><h3>Key Features</h3><ul><li><strong>Speed:</strong> Transactions settle in 3-5 seconds</li><li><strong>Cost:</strong> Average transaction fee is fractions of a cent</li><li><strong>Built-in DEX:</strong> The XRPL has a native decentralized exchange</li><li><strong>No Mining:</strong> All 100 billion XRP were created at genesis</li></ul><h2>Use Cases</h2><p>XRP is primarily used for cross-border payments and remittances. Ripple's On-Demand Liquidity (ODL) service uses XRP as a bridge currency between fiat currencies.</p><p>Explore XRP transactions with our dedicated <a href='/xrp'>XRP Explorer</a>.</p>", excerpt: "Deep dive into the XRP Ledger — how its consensus mechanism works, transaction speed, and real-world payment use cases.", author: "TokenAltcoin Team", category: "Analysis", tags: ["XRP", "Ripple", "XRPL", "Payments"], coverImage: "", published: true, featured: false, metaTitle: "XRP Ledger Deep Dive: Ripple's Technology Explained | TokenAltcoin", metaDescription: "Explore the XRP Ledger — its unique consensus mechanism, lightning-fast transactions, and cross-border payment use cases.", metaKeywords: "XRP, Ripple, XRPL, cross-border payments, consensus" },
          { title: "Crypto Staking Guide: Earn Passive Income With Your Holdings", slug: "crypto-staking-passive-income", content: "<h2>What Is Staking?</h2><p>Staking is the process of locking up your cryptocurrency to support a blockchain network's operations — like validating transactions — in exchange for rewards.</p><h2>How Staking Works</h2><p>On Proof of Stake networks, validators lock (stake) tokens as collateral. The network selects validators to propose and verify blocks. Good behavior earns rewards; malicious behavior risks losing staked tokens (slashing).</p><h3>Types of Staking</h3><ul><li><strong>Direct Staking:</strong> Run your own validator node (requires technical skills + minimum stake)</li><li><strong>Delegated Staking:</strong> Delegate to a validator and share rewards</li><li><strong>Liquid Staking:</strong> Stake and receive a liquid token (like stETH) to use in DeFi</li><li><strong>Exchange Staking:</strong> Stake through centralized exchanges (easiest, but custodial)</li></ul><h2>Top Staking Coins by APY</h2><p>Popular staking options include Ethereum (3-5% APY), Solana (6-8%), Cosmos (15-20%), Polkadot (12-15%), and Cardano (4-6%).</p><p>Calculate your staking returns with our <a href='/staking'>Staking Calculator</a>.</p>", excerpt: "Learn how to earn passive income through crypto staking — from validator setup to liquid staking and delegation.", author: "TokenAltcoin Team", category: "Guide", tags: ["Staking", "Passive Income", "Validators"], coverImage: "", published: true, featured: false, metaTitle: "Crypto Staking Guide: Earn Passive Income | TokenAltcoin", metaDescription: "Complete guide to cryptocurrency staking — earn passive income through validators, delegation, and liquid staking.", metaKeywords: "staking, passive income, validators, Proof of Stake, APY" },
          { title: "The Rise of Layer 2 Solutions: Scaling Ethereum", slug: "layer-2-solutions-scaling-ethereum", content: "<h2>The Scalability Problem</h2><p>Ethereum processes ~15 transactions per second (TPS) on its base layer. During high demand, this leads to congestion and expensive gas fees. Layer 2 solutions solve this by processing transactions off the main chain.</p><h2>Types of Layer 2 Solutions</h2><h3>Optimistic Rollups</h3><p><strong>Arbitrum</strong> and <strong>Optimism</strong> batch transactions off-chain and assume they're valid unless challenged. They offer 10-100x cost reduction with a 7-day withdrawal period.</p><h3>ZK-Rollups</h3><p><strong>zkSync</strong> and <strong>StarkNet</strong> use zero-knowledge proofs to verify transaction validity. They offer faster finality and better security guarantees.</p><h3>State Channels</h3><p>Like Bitcoin's Lightning Network, state channels allow participants to transact off-chain and only settle final states on-chain.</p><h2>Which L2 Should You Use?</h2><p>For DeFi: Arbitrum has the largest ecosystem. For gaming: Immutable X (ZK-based). For general use: Base offers easy onboarding. For privacy: zkSync offers advanced features.</p><p>Track L2 tokens on our <a href='/prices'>Prices</a> page.</p>", excerpt: "How Layer 2 solutions like Arbitrum, Optimism, and zkSync are solving Ethereum's scalability challenges.", author: "TokenAltcoin Team", category: "Analysis", tags: ["Layer 2", "Ethereum", "Scaling", "Rollups"], coverImage: "", published: true, featured: false, metaTitle: "Layer 2 Solutions: Scaling Ethereum | TokenAltcoin", metaDescription: "How L2 rollups like Arbitrum, Optimism, and zkSync solve Ethereum's scalability and gas fee problems.", metaKeywords: "Layer 2, rollups, Arbitrum, Optimism, zkSync, scaling" },
          { title: "How to Spot and Avoid Crypto Scams", slug: "spot-avoid-crypto-scams", content: "<h2>Common Crypto Scams</h2><h3>Rug Pulls</h3><p>Developers create a token, attract investment, then drain all liquidity. Warning signs: anonymous team, locked liquidity for short periods, unrealistic promises.</p><h3>Phishing Attacks</h3><p>Fake websites, emails, or social media accounts that mimic legitimate projects to steal your private keys or seed phrases.</p><h3>Pump and Dump Schemes</h3><p>Coordinated groups artificially inflate a token's price through misleading hype, then sell at the peak, leaving late buyers with losses.</p><h3>Fake Airdrops</h3><p>Scam tokens sent to your wallet that require interacting with malicious contracts to \"claim.\"</p><h2>How to Protect Yourself</h2><ul><li><strong>Never share your seed phrase</strong> — no legitimate project will ever ask for it</li><li><strong>Verify URLs carefully</strong> — bookmark official sites</li><li><strong>Research the team</strong> — anonymous projects carry higher risk</li><li><strong>Check contract audits</strong> — reputable projects get audited by firms like CertiK or Trail of Bits</li><li><strong>Use hardware wallets</strong> — keep large holdings offline</li></ul>", excerpt: "Learn to identify and avoid common crypto scams — from rug pulls and phishing to pump-and-dump schemes.", author: "TokenAltcoin Team", category: "Guide", tags: ["Security", "Scams", "Safety"], coverImage: "", published: true, featured: false, metaTitle: "How to Spot and Avoid Crypto Scams | TokenAltcoin", metaDescription: "Protect yourself from crypto scams — learn to identify rug pulls, phishing attacks, and pump-and-dump schemes.", metaKeywords: "crypto scams, rug pulls, phishing, security, safety" },
          { title: "Masternodes Explained: What They Are and How to Run One", slug: "masternodes-explained", content: "<h2>What Are Masternodes?</h2><p>Masternodes are full nodes on a blockchain network that perform special functions beyond simple transaction validation. They often enable features like instant transactions, privacy features, and governance voting.</p><h2>How Masternodes Work</h2><p>To run a masternode, you need to hold a minimum amount of the network's cryptocurrency as collateral. This collateral ensures operators have a financial stake in the network's health.</p><h3>Requirements</h3><ul><li><strong>Collateral:</strong> A minimum stake (e.g., 1,000 DASH, 10,000 PIVX)</li><li><strong>Server:</strong> A VPS or dedicated server running 24/7</li><li><strong>Technical Setup:</strong> Installation and configuration of the node software</li></ul><h2>Popular Masternode Coins</h2><ul><li><strong>DASH:</strong> The pioneer of masternodes, offering InstantSend and PrivateSend</li><li><strong>PIVX:</strong> Privacy-focused with zk-SNARKs and masternode governance</li><li><strong>Syscoin:</strong> Provides merge-mined security with Bitcoin</li></ul><h2>ROI Considerations</h2><p>Masternode rewards vary by network. Consider the coin's price volatility, network inflation, and hosting costs when calculating potential returns.</p><p>Browse masternode opportunities on our <a href='/masternodes'>Masternode Tracker</a>.</p>", excerpt: "Everything you need to know about masternodes — what they do, how to set one up, and which coins offer the best rewards.", author: "TokenAltcoin Team", category: "Guide", tags: ["Masternodes", "Passive Income", "DASH", "PIVX"], coverImage: "", published: true, featured: false, metaTitle: "Masternodes Explained: Setup and Rewards Guide | TokenAltcoin", metaDescription: "Complete guide to masternodes — what they are, how to set one up, and top masternode coins for passive income.", metaKeywords: "masternodes, DASH, PIVX, passive income, node setup" },
          { title: "NFTs Beyond Art: Real-World Use Cases", slug: "nfts-real-world-use-cases", content: "<h2>NFTs Are More Than JPEGs</h2><p>While digital art brought NFTs into the mainstream, the technology has far broader applications. An NFT is simply a unique digital certificate on a blockchain that can represent ownership of any asset.</p><h2>Real-World Applications</h2><h3>Real Estate</h3><p>Property deeds and titles can be tokenized as NFTs, enabling fractional ownership and streamlining the transfer process.</p><h3>Supply Chain</h3><p>NFTs can track products from manufacturer to consumer, proving authenticity for luxury goods, pharmaceuticals, and food products.</p><h3>Identity and Credentials</h3><p>Universities can issue diplomas as NFTs. Professional certifications, medical records, and government IDs can all be tokenized for tamper-proof verification.</p><h3>Gaming</h3><p>In-game items, characters, and land represented as NFTs give players true ownership and the ability to trade across platforms.</p><h3>Ticketing</h3><p>Event tickets as NFTs prevent counterfeiting and enable programmable royalties for secondary market sales.</p><p>Stay updated on NFT trends in our <a href='/news'>News Feed</a>.</p>", excerpt: "Discover how NFTs are being used beyond digital art — from real estate and supply chain tracking to identity verification.", author: "TokenAltcoin Team", category: "News", tags: ["NFTs", "Real World", "Use Cases"], coverImage: "", published: true, featured: false, metaTitle: "NFTs Beyond Art: Real-World Use Cases | TokenAltcoin", metaDescription: "Explore practical NFT applications in real estate, supply chain, gaming, identity, and ticketing.", metaKeywords: "NFTs, real world, use cases, real estate, gaming, supply chain" },
          { title: "Bitcoin Halving: What It Means for Prices and Mining", slug: "bitcoin-halving-explained", content: "<h2>What Is the Bitcoin Halving?</h2><p>Every 210,000 blocks (approximately every 4 years), the Bitcoin block reward is cut in half. This event is hardcoded into Bitcoin's protocol and reduces the rate at which new BTC enters circulation.</p><h2>Halving History</h2><ul><li><strong>2012:</strong> Reward dropped from 50 to 25 BTC</li><li><strong>2016:</strong> Reward dropped from 25 to 12.5 BTC</li><li><strong>2020:</strong> Reward dropped from 12.5 to 6.25 BTC</li><li><strong>2024:</strong> Reward dropped from 6.25 to 3.125 BTC</li></ul><h2>Impact on Price</h2><p>Historically, Bitcoin has experienced significant price appreciation in the 12-18 months following each halving. The reduced supply combined with steady or growing demand creates upward price pressure.</p><h2>Impact on Miners</h2><p>Halvings squeeze miners' revenue. Less efficient miners may shut down, but the difficulty adjustment ensures blocks continue to be produced. This leads to industry consolidation around more efficient operations.</p><p>Track Bitcoin's price on our <a href='/prices'>Live Prices</a> page.</p>", excerpt: "Understanding Bitcoin halvings — how they work, historical price impacts, and what they mean for miners and investors.", author: "TokenAltcoin Team", category: "Analysis", tags: ["Bitcoin", "Halving", "Mining", "Supply"], coverImage: "", published: true, featured: false, metaTitle: "Bitcoin Halving Explained: Prices & Mining Impact | TokenAltcoin", metaDescription: "How Bitcoin halvings work, their historical price impacts, and what they mean for miners and the market.", metaKeywords: "Bitcoin halving, BTC, mining, supply, price impact" },
          { title: "Solana vs Ethereum: A Comprehensive Comparison", slug: "solana-vs-ethereum-comparison", content: "<h2>Two Giants of Smart Contracts</h2><p>Ethereum and Solana are the two most popular smart contract platforms, each with distinct philosophies and technical approaches.</p><h2>Performance</h2><table><tr><th>Feature</th><th>Ethereum</th><th>Solana</th></tr><tr><td>TPS (Base Layer)</td><td>~15</td><td>~4,000</td></tr><tr><td>Block Time</td><td>12 seconds</td><td>400ms</td></tr><tr><td>Avg. Transaction Fee</td><td>$1-50</td><td>$0.00025</td></tr><tr><td>Consensus</td><td>PoS</td><td>PoH + PoS</td></tr></table><h2>Ecosystem</h2><p><strong>Ethereum</strong> has the largest DeFi ecosystem, most liquidity, and strongest network effects. It's the gold standard for security and decentralization.</p><p><strong>Solana</strong> excels in speed and cost, making it ideal for high-frequency applications like trading, gaming, and payments.</p><h2>Development</h2><p>Ethereum uses Solidity; Solana uses Rust. Ethereum has more developers and tooling, while Solana's architecture requires a different programming model.</p><p>Compare prices side by side on our <a href='/compare'>Coin Compare</a> page.</p>", excerpt: "Ethereum vs Solana — a detailed comparison of speed, fees, ecosystem, development, and investment potential.", author: "TokenAltcoin Team", category: "Analysis", tags: ["Ethereum", "Solana", "Comparison", "Smart Contracts"], coverImage: "", published: true, featured: false, metaTitle: "Solana vs Ethereum: Full Comparison | TokenAltcoin", metaDescription: "Compare Ethereum and Solana — performance, fees, ecosystem, development, and which is right for you.", metaKeywords: "Solana, Ethereum, comparison, smart contracts, speed, fees" },
          { title: "Crypto Tax Guide: What You Need to Know", slug: "crypto-tax-guide", content: "<h2>Crypto and Taxes</h2><p>In most countries, cryptocurrency is treated as property for tax purposes. This means you may owe taxes on gains when you sell, trade, or use crypto.</p><h2>Taxable Events</h2><ul><li><strong>Selling crypto for fiat:</strong> Capital gains tax on the difference between purchase and sale price</li><li><strong>Trading crypto to crypto:</strong> Each trade is a taxable event</li><li><strong>Using crypto for purchases:</strong> Treated as selling at fair market value</li><li><strong>Receiving crypto as income:</strong> Taxed as ordinary income at fair market value</li></ul><h2>Non-Taxable Events</h2><ul><li>Buying crypto with fiat</li><li>Transferring between your own wallets</li><li>Donating crypto to qualified charities</li><li>Gifts under the annual exclusion amount</li></ul><h2>Record Keeping</h2><p>Keep detailed records of all transactions, including dates, amounts, and the fair market value at the time. Use crypto tax software to automate tracking.</p><p><em>Note: Tax laws vary by jurisdiction. Always consult a tax professional for advice specific to your situation.</em></p>", excerpt: "Essential crypto tax information — taxable events, deductions, record keeping, and tips for staying compliant.", author: "TokenAltcoin Team", category: "Guide", tags: ["Taxes", "Compliance", "Legal"], coverImage: "", published: true, featured: false, metaTitle: "Crypto Tax Guide: Everything You Need to Know | TokenAltcoin", metaDescription: "Essential guide to cryptocurrency taxes — taxable events, deductions, record keeping, and compliance tips.", metaKeywords: "crypto taxes, capital gains, taxable events, compliance" },
          { title: "The Complete Guide to Crypto Wallets", slug: "complete-guide-crypto-wallets", content: "<h2>Types of Crypto Wallets</h2><h3>Hot Wallets (Online)</h3><p>Connected to the internet. Convenient for daily transactions but more vulnerable to hacking.</p><ul><li><strong>Browser Extensions:</strong> MetaMask, Rabby, Phantom</li><li><strong>Mobile Wallets:</strong> Trust Wallet, Coinbase Wallet</li><li><strong>Desktop Wallets:</strong> Electrum, Exodus</li></ul><h3>Cold Wallets (Offline)</h3><p>Store private keys offline. Best for long-term storage of large amounts.</p><ul><li><strong>Hardware Wallets:</strong> Ledger, Trezor, GridPlus</li><li><strong>Paper Wallets:</strong> Private key printed on paper (not recommended for beginners)</li></ul><h2>Choosing the Right Wallet</h2><p>Consider security level needed, supported blockchains, ease of use, and whether you need DApp interaction. For most users, a hardware wallet for savings plus a hot wallet for daily use is ideal.</p><h2>Security Best Practices</h2><ul><li>Never share your seed phrase with anyone</li><li>Store backups in multiple secure locations</li><li>Use a unique, strong password for each wallet</li><li>Enable 2FA wherever possible</li></ul><p>Track your wallet balances with our <a href='/wallet'>EVM Wallet Tracker</a>.</p>", excerpt: "Complete guide to cryptocurrency wallets — hot vs cold storage, top options, and security best practices.", author: "TokenAltcoin Team", category: "Tutorial", tags: ["Wallets", "Security", "MetaMask", "Ledger"], coverImage: "", published: true, featured: false, metaTitle: "Complete Guide to Crypto Wallets | TokenAltcoin", metaDescription: "Everything about crypto wallets — hot vs cold, top wallets, and essential security practices.", metaKeywords: "crypto wallets, MetaMask, Ledger, security, hot wallet, cold wallet" },
          { title: "What Are Stablecoins and Why Do They Matter?", slug: "stablecoins-explained", content: "<h2>The Stability Problem</h2><p>Cryptocurrencies are known for volatility. Stablecoins solve this by pegging their value to a stable asset, usually the US dollar.</p><h2>Types of Stablecoins</h2><h3>Fiat-Backed</h3><p><strong>USDT (Tether)</strong> and <strong>USDC (Circle)</strong> are backed by reserves of cash, cash equivalents, and other assets. They're centralized and audited.</p><h3>Crypto-Backed</h3><p><strong>DAI (MakerDAO)</strong> is backed by over-collateralized crypto deposits. It's decentralized and transparent, with all collateral visible on-chain.</p><h3>Algorithmic</h3><p>These use algorithms and smart contracts to maintain their peg. After the UST collapse, algorithmic stablecoins face increased scrutiny.</p><h2>Why Stablecoins Matter</h2><ul><li><strong>Trading:</strong> Park profits without converting to fiat</li><li><strong>DeFi:</strong> Earn yield on stable assets</li><li><strong>Payments:</strong> Send value globally with blockchain speed and low fees</li><li><strong>Onramp/Offramp:</strong> Bridge between traditional and crypto finance</li></ul>", excerpt: "Understanding stablecoins — how they maintain their peg, different types, and why they're essential to the crypto ecosystem.", author: "TokenAltcoin Team", category: "Tutorial", tags: ["Stablecoins", "USDT", "USDC", "DAI"], coverImage: "", published: true, featured: false, metaTitle: "What Are Stablecoins and Why They Matter | TokenAltcoin", metaDescription: "Guide to stablecoins — fiat-backed, crypto-backed, and algorithmic types, and their role in DeFi and payments.", metaKeywords: "stablecoins, USDT, USDC, DAI, Tether, stablecoin types" },
          { title: "Cardano: Technology, Governance, and Ecosystem", slug: "cardano-technology-governance", content: "<h2>What Is Cardano?</h2><p>Cardano (ADA) is a third-generation blockchain platform built on peer-reviewed research and developed using the Haskell programming language. Founded by Charles Hoskinson, a co-founder of Ethereum.</p><h2>Technical Architecture</h2><h3>Ouroboros Consensus</h3><p>Cardano uses Ouroboros, the first provably secure Proof of Stake protocol. It divides time into epochs and slots, with slot leaders randomly selected to produce blocks.</p><h3>Two-Layer Design</h3><ul><li><strong>Cardano Settlement Layer (CSL):</strong> Handles ADA transactions</li><li><strong>Cardano Computation Layer (CCL):</strong> Handles smart contracts and DApps</li></ul><h2>Governance</h2><p>Cardano's governance model includes on-chain voting through Project Catalyst, one of the largest decentralized innovation funds in the world. ADA holders can propose and vote on funding for ecosystem projects.</p><h2>Ecosystem Growth</h2><p>The Cardano ecosystem includes DeFi protocols (Minswap, SundaeSwap), NFT marketplaces (jpg.store), and growing institutional adoption.</p>", excerpt: "Deep dive into Cardano — its research-driven approach, Ouroboros consensus, two-layer architecture, and governance model.", author: "TokenAltcoin Team", category: "Analysis", tags: ["Cardano", "ADA", "Ouroboros", "Governance"], coverImage: "", published: true, featured: false, metaTitle: "Cardano: Technology, Governance & Ecosystem | TokenAltcoin", metaDescription: "Explore Cardano's technology — Ouroboros consensus, two-layer architecture, governance, and ecosystem growth.", metaKeywords: "Cardano, ADA, Ouroboros, governance, Catalyst, smart contracts" },
          { title: "Understanding Crypto Market Cycles: Bull and Bear Markets", slug: "understanding-crypto-market-cycles", content: "<h2>The Four Phases of Market Cycles</h2><h3>1. Accumulation Phase</h3><p>After a major downturn, prices stabilize. Smart money begins accumulating while retail interest is low. Sentiment is fearful. This is often the best time to invest.</p><h3>2. Markup Phase (Bull Market)</h3><p>Prices rise steadily, attracting increasing attention. Positive news grows, new projects launch, retail investors enter. FOMO builds gradually.</p><h3>3. Distribution Phase</h3><p>Early investors take profits as prices peak. Volatility increases significantly. Euphoria and FOMO are at maximum. New investors enter at the worst time.</p><h3>4. Markdown Phase (Bear Market)</h3><p>Prices decline 70-90% from all-time highs for altcoins. Weak projects fail and exit the market. This phase can last 1-2 years. It's a time for building and learning.</p><h2>Strategies for Each Phase</h2><ul><li><strong>Accumulation:</strong> Dollar-cost average into strong projects with solid fundamentals</li><li><strong>Bull Market:</strong> Take partial profits at predetermined price targets</li><li><strong>Distribution:</strong> Reduce exposure to high-risk positions, move to stablecoins</li><li><strong>Bear Market:</strong> Focus on research, accumulation, and skill building</li></ul><p>Track market sentiment with our <a href='/prices'>Fear & Greed Index</a>.</p>", excerpt: "Learn to identify crypto market cycles — accumulation, markup, distribution, and markdown phases with strategies for each.", author: "TokenAltcoin Team", category: "Opinion", tags: ["Market Cycles", "Trading", "Investing"], coverImage: "", published: true, featured: false, metaTitle: "Understanding Crypto Market Cycles | TokenAltcoin", metaDescription: "Learn to identify crypto market cycles, understand bull and bear markets, and develop strategies for each phase.", metaKeywords: "market cycles, bull market, bear market, trading, investing" },
          { title: "Cross-Chain Bridges: Connecting Blockchain Networks", slug: "cross-chain-bridges-connecting-blockchains", content: "<h2>The Multi-Chain Reality</h2><p>The blockchain ecosystem is fragmented across hundreds of networks. Cross-chain bridges enable asset transfers between different networks, unlocking liquidity and interoperability.</p><h2>How Bridges Work</h2><h3>Lock and Mint</h3><p>Tokens are locked on the source chain, and equivalent wrapped tokens are minted on the destination chain. When bridging back, wrapped tokens are burned and originals unlocked.</p><h3>Liquidity Pools</h3><p>Bridges like Stargate maintain liquidity pools on multiple chains for native asset transfers without wrapping.</p><h3>Message Passing</h3><p>Protocols like <strong>LayerZero</strong> and <strong>Wormhole</strong> transmit messages between chains, enabling cross-chain smart contract calls and complex multi-chain applications.</p><h2>Security Considerations</h2><p>Bridges have been prime targets for hackers — over $2 billion was stolen from bridges in 2022 alone. Key risks include smart contract vulnerabilities, compromised validators, and centralization points.</p><h2>Best Practices</h2><ul><li>Use well-established bridges with proven security track records</li><li>Start with small test amounts before bridging large sums</li><li>Consider using canonical bridges from L2s to Ethereum when possible</li><li>Monitor bridge TVL and audit history</li></ul>", excerpt: "How cross-chain bridges enable asset transfers between different blockchains, security risks, and best practices.", author: "TokenAltcoin Team", category: "Tutorial", tags: ["Bridges", "Interoperability", "DeFi"], coverImage: "", published: true, featured: false, metaTitle: "Cross-Chain Bridges: Connecting Blockchains | TokenAltcoin", metaDescription: "How cross-chain bridges work, security risks, and best practices for bridging crypto assets.", metaKeywords: "bridges, cross-chain, interoperability, LayerZero, Wormhole" },
          { title: "Building a Balanced Crypto Portfolio: A Beginner's Strategy", slug: "building-balanced-crypto-portfolio-strategy", content: "<h2>Portfolio Construction Principles</h2><p>A well-constructed crypto portfolio balances potential returns with risk management. Don't put all your eggs in one basket — even if that basket is Bitcoin.</p><h2>The Tiered Approach</h2><h3>Tier 1: Blue Chips (50-60%)</h3><ul><li><strong>Bitcoin (BTC):</strong> Digital gold, store of value, lowest risk in crypto</li><li><strong>Ethereum (ETH):</strong> Smart contract platform leader, the backbone of DeFi</li></ul><h3>Tier 2: Large-Cap Altcoins (20-30%)</h3><p>Solana (SOL), Cardano (ADA), Avalanche (AVAX), Polkadot (DOT) — projects with active development and growing ecosystems that have survived multiple market cycles.</p><h3>Tier 3: Growth Plays (10-20%)</h3><p>Emerging DeFi protocols, new L1/L2 solutions, promising early-stage projects. Only invest what you can afford to lose entirely.</p><h2>Risk Management Rules</h2><ul><li><strong>Dollar-Cost Average:</strong> Invest fixed amounts at regular intervals regardless of price</li><li><strong>Rebalance Quarterly:</strong> Bring allocations back to target percentages</li><li><strong>Set Stop-Losses:</strong> Define exit points before entering any position</li><li><strong>Take Profits:</strong> Secure gains at predetermined price targets — greed is the enemy</li></ul><p>Use TokenAltcoin's <a href='/prices'>Prices</a> page and <a href='/watchlist'>Watchlist</a> to track your portfolio.</p>", excerpt: "Learn how to build a diversified crypto portfolio with a tiered approach balancing blue chips, altcoins, and growth plays.", author: "TokenAltcoin Team", category: "Guide", tags: ["Portfolio", "Investing", "Strategy"], coverImage: "", published: true, featured: false, metaTitle: "Building a Balanced Crypto Portfolio | TokenAltcoin", metaDescription: "Learn to build a diversified cryptocurrency portfolio balancing risk and reward across blue chips, altcoins, and growth plays.", metaKeywords: "crypto portfolio, investing, strategy, diversification" },
        ];
        for (const post of blogSeedData) {
          try {
            await storage.createPost(post);
          } catch (e: any) {
            if (!e.message?.includes("duplicate") && !e.message?.includes("unique")) {
              console.error(`[blog] Failed to seed post "${post.title}":`, e.message);
            }
          }
        }
        const newCount = await storage.getPostCount({ published: true });
        console.log(`[blog] Seeded ${newCount} blog posts`);
      } else {
        console.log(`[blog] ${existingCount} blog posts already exist, skipping seed`);
      }
    } catch (e: any) {
      console.error("[blog] Seed error:", e.message);
    }
  })();

  return httpServer;
}
