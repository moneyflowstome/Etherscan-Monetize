import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { insertHiddenNewsSchema, insertPinnedNewsSchema } from "@shared/schema";
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

  app.get("/api/prices/by-ids", async (req, res) => {
    try {
      const ids = req.query.ids as string;
      if (!ids || ids.trim().length === 0) return res.json([]);

      const idList = ids.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 50);
      if (idList.length === 0) return res.json([]);

      const url = `${COINGECKO_BASE}/coins/markets?vs_currency=usd&ids=${idList.join(",")}&order=market_cap_desc&per_page=${idList.length}&page=1&sparkline=true&price_change_percentage=1h,24h,7d`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`CoinGecko API error: ${response.status}`);
      const data = await response.json();
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
