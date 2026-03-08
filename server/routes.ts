import type { Express } from "express";
import { type Server } from "http";

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

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/api/chains", (_req, res) => {
    res.json(
      Object.entries(CHAIN_IDS).map(([name, id]) => ({ name, id }))
    );
  });

  const validChainIds = new Set(Object.values(CHAIN_IDS));

  function isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  function isValidChainId(chainId: number): boolean {
    return validChainIds.has(chainId);
  }

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
                  return {
                    ...tokenInfo,
                    balance: bal.result || "0",
                  };
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

  app.get("/api/contract-abi/:address", async (req, res) => {
    try {
      const { address } = req.params;
      const chainId = parseInt(req.query.chainId as string) || 1;

      const data = await etherscanFetch({
        module: "contract",
        action: "getabi",
        address,
      }, chainId);

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

  return httpServer;
}
