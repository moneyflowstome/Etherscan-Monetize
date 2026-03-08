import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { insertHiddenNewsSchema, insertPinnedNewsSchema } from "@shared/schema";
import crypto from "crypto";
import bcrypt from "bcryptjs";

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

let priceCache: { data: any; timestamp: number } | null = null;
const PRICE_CACHE_TTL = 60000;

let newsCache: { data: any; timestamp: number } | null = null;
const NEWS_CACHE_TTL = 300000;

let trendingCache: { data: any; timestamp: number } | null = null;
const TRENDING_CACHE_TTL = 120000;

let masternodeCache: { data: any; timestamp: number } | null = null;
const MASTERNODE_CACHE_TTL = 300000;

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
    const page = req.path === "/" ? "dashboard" : req.path.replace("/", "");
    if (["dashboard", "prices", "news", "masternodes"].includes(page) || req.path === "/") {
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

  app.get("/ads.txt", (_req, res) => {
    res.type("text/plain");
    res.send("google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0");
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

      if (priceCache && Date.now() - priceCache.timestamp < PRICE_CACHE_TTL && page === 1) {
        return res.json(priceCache.data);
      }

      const url = `${COINGECKO_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=true&price_change_percentage=1h,24h,7d`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`CoinGecko API error: ${response.status}`);
      const data = await response.json();

      if (page === 1) {
        priceCache = { data, timestamp: Date.now() };
      }

      res.json(data);
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
        valid = password === "admin123";
        if (valid) {
          const hash = await bcrypt.hash(password, 10);
          await storage.setSetting("admin_password_hash", hash);
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

  return httpServer;
}
