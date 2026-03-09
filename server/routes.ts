import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { insertHiddenNewsSchema, insertPinnedNewsSchema, insertContactMessageSchema, insertBlogPostSchema, insertSeoMetaSchema, insertAirdropSchema } from "@shared/schema";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { XMLParser } from "fast-xml-parser";

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const ETHERSCAN_BASE = "https://api.etherscan.io/v2/api";

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
};

const CHAIN_NAMES: Record<number, string> = Object.fromEntries(
  Object.entries(CHAIN_IDS).map(([k, v]) => [v, k])
);

async function etherscanFetch(params: Record<string, string>, chainId: number = 1) {
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
const NEWS_CACHE_TTL = 300000;

let trendingCache: { data: any; timestamp: number } | null = null;
const TRENDING_CACHE_TTL = 120000;

let masternodeCache: { data: any; timestamp: number } | null = null;
const MASTERNODE_CACHE_TTL = 300000;

let validatorCache: { data: any; timestamp: number } | null = null;
const VALIDATOR_CACHE_TTL = 300000;

let worldNewsCache: { data: any; timestamp: number } | null = null;
let usaNewsCache: { data: any; timestamp: number } | null = null;
const GENERAL_NEWS_CACHE_TTL = 600000;

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

  const validChainIds = new Set(Object.values(CHAIN_IDS));

  function isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  function isValidChainId(chainId: number): boolean {
    return validChainIds.has(chainId);
  }

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

      const url = `${COINGECKO_BASE}/search?query=${encodeURIComponent(query)}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`CoinGecko API error: ${response.status}`);
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
      res.json(coins);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/site-settings", async (_req, res) => {
    try {
      const settings = await storage.getAllSettings();
      const settingsMap: Record<string, string> = {};
      const publicKeys = ["home_page", "site_title", "changenow_affiliate_id"];
      for (const s of settings) {
        if (publicKeys.includes(s.key)) {
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
    return /^T[a-zA-Z0-9]{33}$/.test(address);
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
          from: value.owner_address || null,
          to: value.to_address || null,
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

  const NEM_NODE = "https://nem.peernode.net:7891";

  app.get("/api/xem/account/:address", async (req, res) => {
    try {
      const { address } = req.params;
      const cleaned = address.replace(/-/g, "").toUpperCase();
      if (!cleaned.startsWith("N") || cleaned.length !== 40) {
        return res.status(400).json({ error: "Invalid NEM address. Must start with N and be 40 characters." });
      }

      const response = await fetch(`${NEM_NODE}/account/get?address=${cleaned}`);
      if (!response.ok) throw new Error(`NEM API error: ${response.status}`);
      const data = await response.json();

      if (!data.account) throw new Error("Account not found");

      const account = data.account;
      res.json({
        address: account.address,
        balance: (account.balance / 1000000).toFixed(6),
        vestedBalance: ((account.vestedBalance || 0) / 1000000).toFixed(6),
        importance: account.importance || 0,
        publicKey: account.publicKey || null,
        harvestedBlocks: account.harvestedBlocks || 0,
      });
    } catch (err: any) {
      const msg = err.message || "Failed to fetch NEM account";
      if (msg.includes("not found")) return res.status(404).json({ error: "Account not found on NEM network" });
      res.status(500).json({ error: msg });
    }
  });

  app.get("/api/xem/transactions/:address", async (req, res) => {
    try {
      const { address } = req.params;
      const cleaned = address.replace(/-/g, "").toUpperCase();
      if (!cleaned.startsWith("N") || cleaned.length !== 40) {
        return res.status(400).json({ error: "Invalid NEM address" });
      }

      const response = await fetch(`${NEM_NODE}/account/transfers/all?address=${cleaned}`);
      if (!response.ok) throw new Error(`NEM API error: ${response.status}`);
      const data = await response.json();

      const transactions = (data.data || []).slice(0, 15).map((entry: any) => {
        const tx = entry.transaction;
        const meta = entry.meta;
        return {
          hash: meta?.hash?.data || meta?.innerHash?.data || "",
          height: meta?.height || 0,
          timestamp: tx.timeStamp ? (tx.timeStamp + 1427587585) * 1000 : 0,
          type: tx.type,
          amount: tx.amount ? (tx.amount / 1000000).toFixed(6) : "0",
          fee: tx.fee ? (tx.fee / 1000000).toFixed(6) : "0",
          recipient: tx.recipient || "",
          sender: tx.signer || "",
          message: tx.message?.payload ? Buffer.from(tx.message.payload, "hex").toString("utf8") : null,
        };
      });

      res.json({ address: cleaned, transactions });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to fetch NEM transactions" });
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

  app.post("/api/admin/login", async (req, res) => {
    try {
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
      if (!valid) {
        return res.status(401).json({ error: "Invalid password" });
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

  app.get("/api/admin/settings", requireAdmin, async (_req, res) => {
    try {
      const settings = await storage.getAllSettings();
      const settingsMap: Record<string, string> = {};
      for (const s of settings) {
        settingsMap[s.key] = s.value;
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
        } else if (key !== "admin_password_hash") {
          await storage.setSetting(key, String(value));
        }
      }
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

  app.get("/api/show-login", async (_req, res) => {
    try {
      const val = await storage.getSetting("show_login_link");
      res.json({ show: val?.toLowerCase() !== "false" });
    } catch {
      res.json({ show: true });
    }
  });

  // ── ChangeNOW Swap API ──
  const CN_API = "https://api.changenow.io/v2";
  const CN_KEY = process.env.CHANGENOW_API_KEY || "";

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
      if (!id || !/^[a-zA-Z0-9]{10,64}$/.test(id)) {
        return res.status(400).json({ error: "Invalid exchange ID" });
      }
      const resp = await fetch(`${CN_API}/exchange/by-id/${encodeURIComponent(id)}`, {
        headers: { "x-changenow-api-key": CN_KEY },
      });
      if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({}));
        return res.status(resp.status).json({ error: errBody.message || errBody.error || `Status check failed (${resp.status})` });
      }
      const data = await resp.json();
      res.json(data);
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
        { name: "Coinbase", url: "https://www.coinbase.com", description: "US-based regulated crypto exchange, publicly traded (NASDAQ)", type: "centralized", country: "United States", year: 2012, tradingPairs: 500, featured: true, sortOrder: 3 },
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
        { name: "Gemini", url: "https://www.gemini.com", description: "US-regulated exchange founded by the Winklevoss twins", type: "centralized", country: "United States", year: 2014, tradingPairs: 200, featured: false, sortOrder: 13 },
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
      ];
      let count = 0;
      for (const ex of defaultExchanges) {
        const slug = ex.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        if (existingSlugs.has(slug)) continue;
        try {
          await storage.createExchange({ ...ex, slug, logo: null, affiliateUrl: null, active: true });
          count++;
        } catch { }
      }
      res.json({ message: `Seeded ${count} exchanges`, count });
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

  return httpServer;
}
