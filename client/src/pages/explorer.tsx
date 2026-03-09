import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Search,
  Loader2,
  ArrowRight,
  Copy,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Clock,
  Wallet,
  ArrowRightLeft,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Info,
  Zap,
  Calculator,
  Trophy,
  Star,
  Settings2,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AdBanner } from "@/components/AdBanner";
import { useToast } from "@/hooks/use-toast";

type ChainId = "overview" | "btc" | "eth" | "sol" | "xrp" | "bnb" | "doge" | "ada" | "trx" | "avax" | "ton" |
  "dot" | "link" | "ltc" | "shib" | "bch" | "xem" | "neo" | "xlm" | "atom" | "near" |
  "polygon" | "arbitrum" | "optimism" | "base";

interface ChainInfo {
  id: ChainId;
  name: string;
  symbol: string;
  icon: string;
  color: string;
  description: string;
  coingeckoId: string;
  hasAddressLookup: boolean;
  apiPrefix?: string;
  addressPlaceholder?: string;
  explorerUrl?: string;
  evmChainId?: number;
  isEvm?: boolean;
  internalRoute?: string;
}

const ALL_CHAINS: ChainInfo[] = [
  { id: "btc", name: "Bitcoin", symbol: "BTC", icon: "₿", color: "from-orange-500/20 to-orange-600/10 border-orange-500/30", description: "Address balance & transaction explorer", coingeckoId: "bitcoin", hasAddressLookup: true, apiPrefix: "btc", addressPlaceholder: "Enter Bitcoin address (bc1q...)", explorerUrl: "https://blockstream.info" },
  { id: "eth", name: "Ethereum", symbol: "ETH", icon: "⟠", color: "from-blue-500/20 to-blue-600/10 border-blue-500/30", description: "EVM wallet tracker with multi-chain support", coingeckoId: "ethereum", hasAddressLookup: false, isEvm: true, internalRoute: "/wallet" },
  { id: "sol", name: "Solana", symbol: "SOL", icon: "◎", color: "from-purple-500/20 to-purple-600/10 border-purple-500/30", description: "Account balance & recent transactions", coingeckoId: "solana", hasAddressLookup: true, apiPrefix: "sol", addressPlaceholder: "Enter Solana address (7v91N...)", explorerUrl: "https://solscan.io" },
  { id: "xrp", name: "XRP Ledger", symbol: "XRP", icon: "✕", color: "from-gray-400/20 to-gray-500/10 border-gray-400/30", description: "Full account, tokens, NFTs & transactions", coingeckoId: "ripple", hasAddressLookup: false, internalRoute: "/xrp" },
  { id: "bnb", name: "BNB Chain", symbol: "BNB", icon: "◆", color: "from-yellow-500/20 to-yellow-600/10 border-yellow-500/30", description: "BEP-20 tokens & DeFi ecosystem", coingeckoId: "binancecoin", hasAddressLookup: false, isEvm: true, evmChainId: 56, internalRoute: "/wallet" },
  { id: "doge", name: "Dogecoin", symbol: "DOGE", icon: "Ð", color: "from-amber-500/20 to-amber-600/10 border-amber-500/30", description: "Address balance & transaction explorer", coingeckoId: "dogecoin", hasAddressLookup: true, apiPrefix: "doge", addressPlaceholder: "Enter Dogecoin address (D...)", explorerUrl: "https://dogechain.info" },
  { id: "ada", name: "Cardano", symbol: "ADA", icon: "₳", color: "from-blue-600/20 to-blue-700/10 border-blue-600/30", description: "Proof-of-stake smart contract platform", coingeckoId: "cardano", hasAddressLookup: true, apiPrefix: "ada", addressPlaceholder: "Enter Cardano address (addr1q...)" },
  { id: "trx", name: "TRON", symbol: "TRX", icon: "⟁", color: "from-red-500/20 to-red-600/10 border-red-500/30", description: "High-throughput blockchain network", coingeckoId: "tron", hasAddressLookup: true, apiPrefix: "trx", addressPlaceholder: "Enter TRON address (T...)", explorerUrl: "https://tronscan.org" },
  { id: "avax", name: "Avalanche", symbol: "AVAX", icon: "🔺", color: "from-red-600/20 to-red-700/10 border-red-600/30", description: "High-speed smart contracts", coingeckoId: "avalanche-2", hasAddressLookup: false, isEvm: true, evmChainId: 43114, internalRoute: "/wallet" },
  { id: "ton", name: "Toncoin", symbol: "TON", icon: "💎", color: "from-sky-500/20 to-sky-600/10 border-sky-500/30", description: "Telegram's blockchain ecosystem", coingeckoId: "the-open-network", hasAddressLookup: true, apiPrefix: "ton", addressPlaceholder: "Enter TON address (EQ... or UQ...)" },
  { id: "dot", name: "Polkadot", symbol: "DOT", icon: "●", color: "from-pink-500/20 to-pink-600/10 border-pink-500/30", description: "Multi-chain interoperability", coingeckoId: "polkadot", hasAddressLookup: true, apiPrefix: "dot", addressPlaceholder: "Enter Polkadot address (1... or 5...)", explorerUrl: "https://subscan.io" },
  { id: "link", name: "Chainlink", symbol: "LINK", icon: "⬡", color: "from-blue-400/20 to-blue-500/10 border-blue-400/30", description: "Decentralized oracle network (ERC-20)", coingeckoId: "chainlink", hasAddressLookup: false, isEvm: true, internalRoute: "/wallet" },
  { id: "ltc", name: "Litecoin", symbol: "LTC", icon: "Ł", color: "from-gray-400/20 to-gray-500/10 border-gray-400/30", description: "Digital silver peer-to-peer payments", coingeckoId: "litecoin", hasAddressLookup: true, apiPrefix: "ltc", addressPlaceholder: "Enter Litecoin address (L..., M..., ltc1...)", explorerUrl: "https://litecoinspace.org" },
  { id: "shib", name: "Shiba Inu", symbol: "SHIB", icon: "🐕", color: "from-orange-400/20 to-orange-500/10 border-orange-400/30", description: "Community-driven memecoin (ERC-20)", coingeckoId: "shiba-inu", hasAddressLookup: false, isEvm: true, internalRoute: "/wallet" },
  { id: "bch", name: "Bitcoin Cash", symbol: "BCH", icon: "₿", color: "from-green-500/20 to-green-600/10 border-green-500/30", description: "Bitcoin fork for fast payments", coingeckoId: "bitcoin-cash", hasAddressLookup: true, apiPrefix: "bch", addressPlaceholder: "Enter BCH address (1..., q...)", explorerUrl: "https://blockchair.com/bitcoin-cash" },
  { id: "xem", name: "NEM", symbol: "XEM", icon: "✦", color: "from-teal-500/20 to-teal-600/10 border-teal-500/30", description: "Smart asset blockchain platform", coingeckoId: "nem", hasAddressLookup: true, apiPrefix: "xem", addressPlaceholder: "Enter NEM address (N...)", explorerUrl: "https://explorer.nemtool.com" },
  { id: "neo", name: "NEO", symbol: "NEO", icon: "◈", color: "from-green-400/20 to-green-500/10 border-green-400/30", description: "Smart economy blockchain (N3)", coingeckoId: "neo", hasAddressLookup: true, apiPrefix: "neo", addressPlaceholder: "Enter NEO address (N...)", explorerUrl: "https://dora.coz.io" },
  { id: "xlm", name: "Stellar", symbol: "XLM", icon: "✴", color: "from-violet-400/20 to-violet-500/10 border-violet-400/30", description: "Cross-border payment network", coingeckoId: "stellar", hasAddressLookup: true, apiPrefix: "xlm", addressPlaceholder: "Enter Stellar address (G...)", explorerUrl: "https://stellarchain.io" },
  { id: "atom", name: "Cosmos", symbol: "ATOM", icon: "⚛", color: "from-indigo-500/20 to-indigo-600/10 border-indigo-500/30", description: "Internet of blockchains", coingeckoId: "cosmos", hasAddressLookup: true, apiPrefix: "atom", addressPlaceholder: "Enter Cosmos address (cosmos1...)" },
  { id: "near", name: "NEAR Protocol", symbol: "NEAR", icon: "Ⓝ", color: "from-cyan-600/20 to-cyan-700/10 border-cyan-600/30", description: "Developer-friendly L1 platform", coingeckoId: "near", hasAddressLookup: true, apiPrefix: "near", addressPlaceholder: "Enter NEAR account (e.g. root.near)" },
  { id: "polygon", name: "Polygon", symbol: "MATIC", icon: "⬡", color: "from-purple-400/20 to-purple-500/10 border-purple-400/30", description: "Layer 2 scaling solution", coingeckoId: "matic-network", hasAddressLookup: false, isEvm: true, evmChainId: 137, internalRoute: "/wallet" },
  { id: "arbitrum", name: "Arbitrum", symbol: "ARB", icon: "🔵", color: "from-cyan-500/20 to-cyan-600/10 border-cyan-500/30", description: "Optimistic rollup L2", coingeckoId: "arbitrum", hasAddressLookup: false, isEvm: true, evmChainId: 42161, internalRoute: "/wallet" },
  { id: "optimism", name: "Optimism", symbol: "OP", icon: "🔴", color: "from-red-500/20 to-red-600/10 border-red-500/30", description: "OP Stack L2 network", coingeckoId: "optimism", hasAddressLookup: false, isEvm: true, evmChainId: 10, internalRoute: "/wallet" },
  { id: "base", name: "Base", symbol: "ETH", icon: "🔷", color: "from-blue-400/20 to-blue-500/10 border-blue-400/30", description: "Coinbase's L2 chain", coingeckoId: "ethereum", hasAddressLookup: false, isEvm: true, evmChainId: 8453, internalRoute: "/wallet" },
];

const TOP_CHAIN_IDS: ChainId[] = ["btc", "eth", "sol", "xrp", "bnb", "doge", "ada", "trx", "avax", "ton"];
const MORE_CHAIN_IDS: ChainId[] = ["dot", "link", "ltc", "shib", "bch", "xem", "neo", "xlm", "atom", "near"];
const EVM_CHAIN_IDS: ChainId[] = ["polygon", "arbitrum", "optimism", "base"];

function getChain(id: ChainId): ChainInfo {
  return ALL_CHAINS.find(c => c.id === id)!;
}

function truncateHash(hash: string): string {
  if (!hash || hash.length < 16) return hash || "";
  return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
}

function timeAgo(ts: number): string {
  if (!ts) return "—";
  const seconds = Math.floor(Date.now() / 1000 - ts);
  if (seconds < 0) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function CopyButton({ text, id }: { text: string; id: string }) {
  const { toast } = useToast();
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); toast({ title: "Copied!" }); }} className="text-muted-foreground hover:text-primary transition-colors" data-testid={`button-copy-${id}`}>
      <Copy className="w-3.5 h-3.5" />
    </button>
  );
}

function getCoinOfTheDay(): ChainInfo {
  const today = new Date().toISOString().split("T")[0];
  let hash = 0;
  for (let i = 0; i < today.length; i++) {
    hash = ((hash << 5) - hash + today.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % ALL_CHAINS.length;
  return ALL_CHAINS[index];
}

function CoinOfTheDay({ onChainClick }: { onChainClick: (chain: ChainInfo) => void }) {
  const coinChain = getCoinOfTheDay();

  const { data, isLoading, error } = useQuery({
    queryKey: ["coin-info", coinChain.coingeckoId],
    queryFn: async () => {
      const res = await fetch(`/api/coin/${coinChain.coingeckoId}`);
      if (!res.ok) throw new Error("Failed to fetch coin info");
      return res.json();
    },
    staleTime: 60000,
    retry: 2,
  });

  const priceUp = (data?.price_change_percentage_24h || 0) >= 0;

  return (
    <button onClick={() => onChainClick(coinChain)} className="w-full text-left group" data-testid="card-coin-of-the-day">
      <Card className="glass-panel bg-gradient-to-br from-yellow-500/10 via-amber-500/5 to-orange-500/10 border-yellow-500/30 hover:border-yellow-400/60 transition-all duration-300 group-hover:scale-[1.01] overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-yellow-500/10 to-transparent rounded-bl-full" />
        <CardContent className="p-5 md:p-6">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-yellow-400" data-testid="text-cotd-label">Coin of the Day</span>
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 min-w-0">
              {data?.image ? (
                <img src={data.image} alt={coinChain.name} className="w-12 h-12 rounded-full ring-2 ring-yellow-500/30" data-testid="img-cotd-icon" />
              ) : (
                <span className="text-4xl" data-testid="img-cotd-icon">{coinChain.icon}</span>
              )}
              <div className="min-w-0">
                <h3 className="font-display font-bold text-lg md:text-xl truncate" data-testid="text-cotd-name">{coinChain.name}</h3>
                <p className="text-sm text-muted-foreground">{coinChain.symbol}</p>
              </div>
            </div>
            {isLoading ? (
              <div className="ml-auto"><Loader2 className="w-5 h-5 animate-spin text-yellow-400" /></div>
            ) : error ? (
              <div className="ml-auto text-xs text-muted-foreground">Click to explore {coinChain.symbol} →</div>
            ) : data ? (
              <div className="ml-auto flex items-center gap-4 md:gap-6">
                <div className="text-right">
                  <p className="font-mono text-xl md:text-2xl font-bold" data-testid="text-cotd-price">
                    ${data.current_price?.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                  </p>
                  <span className={`text-sm flex items-center justify-end gap-1 ${priceUp ? "text-green-400" : "text-red-400"}`} data-testid="text-cotd-change">
                    {priceUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {Math.abs(data.price_change_percentage_24h || 0).toFixed(2)}%
                  </span>
                </div>
                <div className="hidden md:block text-right">
                  <p className="text-xs text-muted-foreground mb-1">Market Cap</p>
                  <p className="font-mono text-sm font-semibold" data-testid="text-cotd-mcap">
                    ${(data.market_cap || 0).toLocaleString()}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-yellow-400 transition-colors hidden sm:block" />
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </button>
  );
}

function CoinInfoPanel({ coingeckoId, chainName }: { coingeckoId: string; chainName: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["coin-info", coingeckoId],
    queryFn: async () => {
      const res = await fetch(`/api/coin/${coingeckoId}`);
      if (!res.ok) throw new Error("Failed to fetch coin info");
      return res.json();
    },
    staleTime: 60000,
  });

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (error) return <div className="glass-panel p-4 text-destructive text-sm">Failed to load coin data</div>;
  if (!data) return null;

  const priceUp = (data.price_change_percentage_24h || 0) >= 0;

  return (
    <Card className="glass-panel border-border/50">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-4">
          {data.image && <img src={data.image} alt={data.name} className="w-8 h-8 rounded-full" />}
          <div>
            <h3 className="font-display font-semibold text-lg" data-testid={`text-coin-name-${coingeckoId}`}>{data.name}</h3>
            <span className="text-xs text-muted-foreground">{data.symbol?.toUpperCase()} · Rank #{data.market_cap_rank}</span>
          </div>
          <div className="ml-auto text-right">
            <p className="font-mono text-xl font-bold" data-testid={`text-coin-price-${coingeckoId}`}>${data.current_price?.toLocaleString(undefined, { maximumFractionDigits: 6 })}</p>
            <span className={`text-sm flex items-center justify-end gap-1 ${priceUp ? "text-green-400" : "text-red-400"}`} data-testid={`text-coin-change-${coingeckoId}`}>
              {priceUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {Math.abs(data.price_change_percentage_24h || 0).toFixed(2)}%
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="glass-panel p-3 rounded-lg">
            <p className="text-muted-foreground mb-1">Market Cap</p>
            <p className="font-mono font-semibold" data-testid={`text-coin-mcap-${coingeckoId}`}>${(data.market_cap || 0).toLocaleString()}</p>
          </div>
          <div className="glass-panel p-3 rounded-lg">
            <p className="text-muted-foreground mb-1">24h Volume</p>
            <p className="font-mono font-semibold" data-testid={`text-coin-vol-${coingeckoId}`}>${(data.total_volume || 0).toLocaleString()}</p>
          </div>
          <div className="glass-panel p-3 rounded-lg">
            <p className="text-muted-foreground mb-1">Circulating</p>
            <p className="font-mono font-semibold">{(data.circulating_supply || 0).toLocaleString()}</p>
          </div>
          <div className="glass-panel p-3 rounded-lg">
            <p className="text-muted-foreground mb-1">ATH</p>
            <p className="font-mono font-semibold">${data.ath?.toLocaleString(undefined, { maximumFractionDigits: 6 })}</p>
          </div>
        </div>
        {data.description && (
          <p className="text-xs text-muted-foreground mt-4 leading-relaxed">{data.description.replace(/<[^>]*>/g, '')}</p>
        )}
      </CardContent>
    </Card>
  );
}

function BlockcypherExplorer({ chain, symbol, addressApiPrefix, txApiPrefix, explorerBaseUrl }: {
  chain: ChainInfo; symbol: string; addressApiPrefix: string; txApiPrefix: string; explorerBaseUrl: string;
}) {
  const [input, setInput] = useState("");
  const [address, setAddress] = useState("");

  const { data: accountData, isLoading, error } = useQuery({
    queryKey: [`${chain.id}-account`, address],
    queryFn: async () => {
      const res = await fetch(`/api/${addressApiPrefix}/address/${address}`);
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); }
      return res.json();
    },
    enabled: !!address,
  });

  const { data: txData } = useQuery({
    queryKey: [`${chain.id}-transactions`, address],
    queryFn: async () => {
      const res = await fetch(`/api/${txApiPrefix}/transactions/${address}`);
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); }
      return res.json();
    },
    enabled: !!address,
  });

  const handleSearch = () => { if (input.trim()) setAddress(input.trim()); };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input placeholder={chain.addressPlaceholder || `Enter ${chain.name} address`} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} className="bg-card border-border" data-testid={`input-${chain.id}-address`} />
        <Button onClick={handleSearch} disabled={!input.trim()} data-testid={`button-${chain.id}-search`}><Search className="w-4 h-4 mr-1" /> Search</Button>
      </div>
      {isLoading && <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}
      {error && <div className="glass-panel p-4 text-destructive text-sm" data-testid={`text-${chain.id}-error`}>{(error as Error).message}</div>}
      {accountData && (
        <Card className="glass-panel border-primary/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3"><Wallet className="w-5 h-5 text-primary" /><h3 className="font-display font-semibold">Account Info</h3></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div><p className="text-xs text-muted-foreground">Balance</p><p className="font-mono text-lg font-semibold text-primary" data-testid={`text-${chain.id}-balance`}>{accountData.balance} {symbol}</p></div>
              <div><p className="text-xs text-muted-foreground">Transactions</p><p className="font-mono" data-testid={`text-${chain.id}-txcount`}>{accountData.txCount?.toLocaleString()}</p></div>
              <div><p className="text-xs text-muted-foreground">Received</p><p className="font-mono text-sm text-green-400" data-testid={`text-${chain.id}-received`}>{accountData.totalReceived || accountData.funded} {symbol}</p></div>
              <div><p className="text-xs text-muted-foreground">Sent</p><p className="font-mono text-sm text-red-400" data-testid={`text-${chain.id}-sent`}>{accountData.totalSent || accountData.spent} {symbol}</p></div>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono" data-testid={`text-${chain.id}-addr`}>{truncateHash(accountData.address)}</span>
              <CopyButton text={accountData.address} id={`${chain.id}-addr`} />
            </div>
          </CardContent>
        </Card>
      )}
      {txData?.transactions?.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2"><ArrowRightLeft className="w-4 h-4 text-primary" /><h3 className="font-display font-semibold text-sm">Recent Transactions</h3><Badge variant="secondary" className="text-xs">{txData.transactions.length}</Badge></div>
          {txData.transactions.map((tx: any, i: number) => (
            <Card key={tx.txid || tx.txID || tx.hash || i} className="glass-panel border-border/50" data-testid={`card-${chain.id}-tx-${i}`}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2"><span className="font-mono text-xs text-muted-foreground">{truncateHash(tx.txid || tx.txID || tx.hash)}</span><CopyButton text={tx.txid || tx.txID || tx.hash} id={`${chain.id}-tx-${i}`} /></div>
                  <div className="flex items-center gap-1">
                    {(tx.confirmed || tx.confirmations > 0) ? (<Badge variant="outline" className="text-green-400 border-green-400/30 text-[10px]"><CheckCircle2 className="w-3 h-3 mr-1" />OK</Badge>) : (<Badge variant="outline" className="text-yellow-400 border-yellow-400/30 text-[10px]"><Clock className="w-3 h-3 mr-1" />Pending</Badge>)}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div><span className="text-muted-foreground">Value:</span> <span className="font-mono">{tx.value || tx.totalOutput || tx.amount || "—"} {symbol}</span></div>
                  <div><span className="text-muted-foreground">Block:</span> <span className="font-mono">{tx.blockHeight || tx.block_height || "—"}</span></div>
                  <div><span className="text-muted-foreground">Time:</span> <span>{tx.blockTime ? timeAgo(tx.blockTime) : tx.time ? timeAgo(Math.floor(new Date(tx.time).getTime() / 1000)) : "—"}</span></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function SolExplorer({ chain }: { chain: ChainInfo }) {
  const [input, setInput] = useState("");
  const [address, setAddress] = useState("");

  const { data: accountData, isLoading, error } = useQuery({
    queryKey: ["sol-account", address],
    queryFn: async () => { const res = await fetch(`/api/sol/account/${address}`); if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); } return res.json(); },
    enabled: !!address,
  });

  const { data: txData } = useQuery({
    queryKey: ["sol-transactions", address],
    queryFn: async () => { const res = await fetch(`/api/sol/transactions/${address}`); if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); } return res.json(); },
    enabled: !!address,
  });

  const handleSearch = () => { if (input.trim()) setAddress(input.trim()); };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input placeholder="Enter Solana address (e.g. 7v91N...)" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} className="bg-card border-border" data-testid="input-sol-address" />
        <Button onClick={handleSearch} disabled={!input.trim()} data-testid="button-sol-search"><Search className="w-4 h-4 mr-1" /> Search</Button>
      </div>
      {isLoading && <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}
      {error && <div className="glass-panel p-4 text-destructive text-sm" data-testid="text-sol-error">{(error as Error).message}</div>}
      {accountData && (
        <Card className="glass-panel border-purple-500/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3"><Wallet className="w-5 h-5 text-purple-400" /><h3 className="font-display font-semibold">Account Info</h3></div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div><p className="text-xs text-muted-foreground">Balance</p><p className="font-mono text-lg font-semibold text-purple-400" data-testid="text-sol-balance">{accountData.balance} SOL</p></div>
              <div><p className="text-xs text-muted-foreground">Lamports</p><p className="font-mono text-sm" data-testid="text-sol-lamports">{accountData.lamports?.toLocaleString()}</p></div>
              <div><p className="text-xs text-muted-foreground">Slot</p><p className="font-mono text-sm" data-testid="text-sol-slot">{accountData.slot?.toLocaleString()}</p></div>
            </div>
          </CardContent>
        </Card>
      )}
      {txData?.transactions?.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2"><ArrowRightLeft className="w-4 h-4 text-purple-400" /><h3 className="font-display font-semibold text-sm">Recent Transactions</h3><Badge variant="secondary" className="text-xs">{txData.transactions.length}</Badge></div>
          {txData.transactions.map((tx: any, i: number) => (
            <Card key={tx.signature} className="glass-panel border-border/50" data-testid={`card-sol-tx-${i}`}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2"><span className="font-mono text-xs text-muted-foreground">{truncateHash(tx.signature)}</span><CopyButton text={tx.signature} id={`sol-tx-${i}`} /></div>
                  {tx.err ? (<Badge variant="outline" className="text-red-400 border-red-400/30 text-[10px]"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>) : (<Badge variant="outline" className="text-green-400 border-green-400/30 text-[10px]"><CheckCircle2 className="w-3 h-3 mr-1" />{tx.confirmationStatus}</Badge>)}
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div><span className="text-muted-foreground">Slot:</span> <span className="font-mono">{tx.slot?.toLocaleString()}</span></div>
                  <div><span className="text-muted-foreground">Time:</span> <span>{tx.blockTime ? timeAgo(tx.blockTime) : "—"}</span></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function TrxExplorer({ chain }: { chain: ChainInfo }) {
  const [input, setInput] = useState("");
  const [address, setAddress] = useState("");

  const { data: accountData, isLoading, error } = useQuery({
    queryKey: ["trx-account", address],
    queryFn: async () => { const res = await fetch(`/api/trx/account/${address}`); if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); } return res.json(); },
    enabled: !!address,
  });

  const { data: txData } = useQuery({
    queryKey: ["trx-transactions", address],
    queryFn: async () => { const res = await fetch(`/api/trx/transactions/${address}`); if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); } return res.json(); },
    enabled: !!address,
  });

  const handleSearch = () => { if (input.trim()) setAddress(input.trim()); };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input placeholder="Enter TRON address (T...)" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} className="bg-card border-border" data-testid="input-trx-address" />
        <Button onClick={handleSearch} disabled={!input.trim()} data-testid="button-trx-search"><Search className="w-4 h-4 mr-1" /> Search</Button>
      </div>
      {isLoading && <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}
      {error && <div className="glass-panel p-4 text-destructive text-sm" data-testid="text-trx-error">{(error as Error).message}</div>}
      {accountData && (
        <Card className="glass-panel border-red-500/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3"><Wallet className="w-5 h-5 text-red-400" /><h3 className="font-display font-semibold">Account Info</h3></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div><p className="text-xs text-muted-foreground">Balance</p><p className="font-mono text-lg font-semibold text-red-400" data-testid="text-trx-balance">{accountData.balance} TRX</p></div>
              <div><p className="text-xs text-muted-foreground">Bandwidth</p><p className="font-mono" data-testid="text-trx-bandwidth">{accountData.bandwidth?.toLocaleString() || "0"}</p></div>
              <div><p className="text-xs text-muted-foreground">Energy</p><p className="font-mono" data-testid="text-trx-energy">{accountData.energy?.toLocaleString() || "0"}</p></div>
              <div><p className="text-xs text-muted-foreground">Frozen</p><p className="font-mono" data-testid="text-trx-frozen">{accountData.frozenBalance || "0"} TRX</p></div>
            </div>
          </CardContent>
        </Card>
      )}
      {txData?.transactions?.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2"><ArrowRightLeft className="w-4 h-4 text-red-400" /><h3 className="font-display font-semibold text-sm">Recent Transactions</h3><Badge variant="secondary" className="text-xs">{txData.transactions.length}</Badge></div>
          {txData.transactions.map((tx: any, i: number) => (
            <Card key={tx.txID || i} className="glass-panel border-border/50" data-testid={`card-trx-tx-${i}`}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2"><span className="font-mono text-xs text-muted-foreground">{truncateHash(tx.txID)}</span><CopyButton text={tx.txID} id={`trx-tx-${i}`} /></div>
                  {tx.confirmed ? (<Badge variant="outline" className="text-green-400 border-green-400/30 text-[10px]"><CheckCircle2 className="w-3 h-3 mr-1" />OK</Badge>) : (<Badge variant="outline" className="text-yellow-400 border-yellow-400/30 text-[10px]"><Clock className="w-3 h-3 mr-1" />Pending</Badge>)}
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div><span className="text-muted-foreground">Amount:</span> <span className="font-mono">{tx.amount || "—"} TRX</span></div>
                  <div><span className="text-muted-foreground">Block:</span> <span className="font-mono">{tx.blockNumber || "—"}</span></div>
                  <div><span className="text-muted-foreground">Time:</span> <span>{tx.timestamp ? timeAgo(Math.floor(tx.timestamp / 1000)) : "—"}</span></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function XlmExplorer({ chain }: { chain: ChainInfo }) {
  const [input, setInput] = useState("");
  const [address, setAddress] = useState("");

  const { data: accountData, isLoading, error } = useQuery({
    queryKey: ["xlm-account", address],
    queryFn: async () => { const res = await fetch(`/api/xlm/account/${address}`); if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); } return res.json(); },
    enabled: !!address,
  });

  const { data: txData } = useQuery({
    queryKey: ["xlm-transactions", address],
    queryFn: async () => { const res = await fetch(`/api/xlm/transactions/${address}`); if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); } return res.json(); },
    enabled: !!address,
  });

  const handleSearch = () => { if (input.trim()) setAddress(input.trim()); };
  const nativeBalance = accountData?.balances?.find((b: any) => b.asset_type === "native");

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input placeholder="Enter Stellar address (G...)" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} className="bg-card border-border" data-testid="input-xlm-address" />
        <Button onClick={handleSearch} disabled={!input.trim()} data-testid="button-xlm-search"><Search className="w-4 h-4 mr-1" /> Search</Button>
      </div>
      {isLoading && <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}
      {error && <div className="glass-panel p-4 text-destructive text-sm" data-testid="text-xlm-error">{(error as Error).message}</div>}
      {accountData && (
        <Card className="glass-panel border-violet-500/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3"><Wallet className="w-5 h-5 text-violet-400" /><h3 className="font-display font-semibold">Account Info</h3></div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div><p className="text-xs text-muted-foreground">XLM Balance</p><p className="font-mono text-lg font-semibold text-violet-400" data-testid="text-xlm-balance">{nativeBalance?.balance || "0"} XLM</p></div>
              <div><p className="text-xs text-muted-foreground">Subentries</p><p className="font-mono" data-testid="text-xlm-sub">{accountData.subentry_count}</p></div>
              <div><p className="text-xs text-muted-foreground">Tokens</p><p className="font-mono">{(accountData.balances?.length || 1) - 1}</p></div>
            </div>
          </CardContent>
        </Card>
      )}
      {txData?.transactions?.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2"><ArrowRightLeft className="w-4 h-4 text-violet-400" /><h3 className="font-display font-semibold text-sm">Recent Transactions</h3><Badge variant="secondary" className="text-xs">{txData.transactions.length}</Badge></div>
          {txData.transactions.map((tx: any, i: number) => (
            <Card key={tx.hash || i} className="glass-panel border-border/50" data-testid={`card-xlm-tx-${i}`}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2"><span className="font-mono text-xs text-muted-foreground">{truncateHash(tx.hash)}</span><CopyButton text={tx.hash} id={`xlm-tx-${i}`} /></div>
                  {tx.successful ? (<Badge variant="outline" className="text-green-400 border-green-400/30 text-[10px]"><CheckCircle2 className="w-3 h-3 mr-1" />OK</Badge>) : (<Badge variant="outline" className="text-red-400 border-red-400/30 text-[10px]"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>)}
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div><span className="text-muted-foreground">Ops:</span> <span className="font-mono">{tx.operation_count}</span></div>
                  <div><span className="text-muted-foreground">Fee:</span> <span className="font-mono">{tx.fee_charged} stroops</span></div>
                  <div><span className="text-muted-foreground">Time:</span> <span>{tx.created_at ? timeAgo(Math.floor(new Date(tx.created_at).getTime() / 1000)) : "—"}</span></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function XemExplorer({ chain }: { chain: ChainInfo }) {
  const [input, setInput] = useState("");
  const [address, setAddress] = useState("");

  const { data: accountData, isLoading, error } = useQuery({
    queryKey: ["xem-account", address],
    queryFn: async () => { const res = await fetch(`/api/xem/account/${address}`); if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); } return res.json(); },
    enabled: !!address,
  });

  const { data: txData } = useQuery({
    queryKey: ["xem-transactions", address],
    queryFn: async () => { const res = await fetch(`/api/xem/transactions/${address}`); if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); } return res.json(); },
    enabled: !!address,
  });

  const handleSearch = () => { if (input.trim()) setAddress(input.trim()); };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input placeholder="Enter NEM address (N...)" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} className="bg-card border-border" data-testid="input-xem-address" />
        <Button onClick={handleSearch} disabled={!input.trim()} data-testid="button-xem-search"><Search className="w-4 h-4 mr-1" /> Search</Button>
      </div>
      {isLoading && <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}
      {error && <div className="glass-panel p-4 text-destructive text-sm" data-testid="text-xem-error">{(error as Error).message}</div>}
      {accountData && (
        <Card className="glass-panel border-teal-500/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3"><Wallet className="w-5 h-5 text-teal-400" /><h3 className="font-display font-semibold">Account Info</h3></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div><p className="text-xs text-muted-foreground">Balance</p><p className="font-mono text-lg font-semibold text-teal-400" data-testid="text-xem-balance">{accountData.balance} XEM</p></div>
              <div><p className="text-xs text-muted-foreground">Vested</p><p className="font-mono" data-testid="text-xem-vested">{accountData.vestedBalance} XEM</p></div>
              <div><p className="text-xs text-muted-foreground">Importance</p><p className="font-mono" data-testid="text-xem-importance">{(accountData.importance * 100).toFixed(6)}%</p></div>
              <div><p className="text-xs text-muted-foreground">Harvested</p><p className="font-mono" data-testid="text-xem-harvested">{accountData.harvestedBlocks}</p></div>
            </div>
          </CardContent>
        </Card>
      )}
      {txData?.transactions?.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2"><ArrowRightLeft className="w-4 h-4 text-teal-400" /><h3 className="font-display font-semibold text-sm">Recent Transactions</h3><Badge variant="secondary" className="text-xs">{txData.transactions.length}</Badge></div>
          {txData.transactions.map((tx: any, i: number) => (
            <Card key={tx.hash || i} className="glass-panel border-border/50" data-testid={`card-xem-tx-${i}`}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2"><span className="font-mono text-xs text-muted-foreground">{truncateHash(tx.hash)}</span>{tx.hash && <CopyButton text={tx.hash} id={`xem-tx-${i}`} />}</div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div><span className="text-muted-foreground">Amount:</span> <span className="font-mono">{tx.amount} XEM</span></div>
                  <div><span className="text-muted-foreground">Fee:</span> <span className="font-mono text-yellow-400">{tx.fee} XEM</span></div>
                  <div><span className="text-muted-foreground">Time:</span> <span>{tx.timestamp ? timeAgo(Math.floor(tx.timestamp / 1000)) : "—"}</span></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function NeoExplorer({ chain }: { chain: ChainInfo }) {
  const [input, setInput] = useState("");
  const [address, setAddress] = useState("");

  const { data: accountData, isLoading, error } = useQuery({
    queryKey: ["neo-account", address],
    queryFn: async () => { const res = await fetch(`/api/neo/account/${address}`); if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); } return res.json(); },
    enabled: !!address,
  });

  const { data: txData } = useQuery({
    queryKey: ["neo-transactions", address],
    queryFn: async () => { const res = await fetch(`/api/neo/transactions/${address}`); if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); } return res.json(); },
    enabled: !!address,
  });

  const handleSearch = () => { if (input.trim()) setAddress(input.trim()); };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input placeholder="Enter NEO address (N...)" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} className="bg-card border-border" data-testid="input-neo-address" />
        <Button onClick={handleSearch} disabled={!input.trim()} data-testid="button-neo-search"><Search className="w-4 h-4 mr-1" /> Search</Button>
      </div>
      {isLoading && <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}
      {error && <div className="glass-panel p-4 text-destructive text-sm" data-testid="text-neo-error">{(error as Error).message}</div>}
      {accountData?.balances?.length > 0 && (
        <Card className="glass-panel border-green-500/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3"><Wallet className="w-5 h-5 text-green-400" /><h3 className="font-display font-semibold">Token Balances</h3></div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {accountData.balances.map((b: any, i: number) => (
                <div key={i}><p className="text-xs text-muted-foreground">{b.name}</p><p className="font-mono text-lg font-semibold text-green-400" data-testid={`text-neo-bal-${i}`}>{b.amount} {b.symbol}</p></div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      {txData?.transactions?.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2"><ArrowRightLeft className="w-4 h-4 text-green-400" /><h3 className="font-display font-semibold text-sm">Recent Transfers</h3><Badge variant="secondary" className="text-xs">{txData.transactions.length}</Badge></div>
          {txData.transactions.map((tx: any, i: number) => (
            <Card key={tx.txHash || i} className="glass-panel border-border/50" data-testid={`card-neo-tx-${i}`}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2"><span className="font-mono text-xs text-muted-foreground">{truncateHash(tx.txHash)}</span>{tx.txHash && <CopyButton text={tx.txHash} id={`neo-tx-${i}`} />}</div>
                  <Badge variant="outline" className={`text-[10px] ${tx.direction === "received" ? "text-green-400 border-green-400/30" : "text-red-400 border-red-400/30"}`}>{tx.direction === "received" ? "IN" : "OUT"}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div><span className="text-muted-foreground">Amount:</span> <span className="font-mono">{tx.amount} {tx.tokenSymbol || ""}</span></div>
                  <div><span className="text-muted-foreground">Block:</span> <span className="font-mono">{tx.blockIndex || "—"}</span></div>
                  <div><span className="text-muted-foreground">Time:</span> <span>{tx.timestamp ? timeAgo(Math.floor(tx.timestamp / 1000)) : "—"}</span></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function AdaExplorer({ chain }: { chain: ChainInfo }) {
  const [input, setInput] = useState("");
  const [address, setAddress] = useState("");

  const { data: accountData, isLoading, error } = useQuery({
    queryKey: ["ada-account", address],
    queryFn: async () => { const res = await fetch(`/api/ada/account/${address}`); if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); } return res.json(); },
    enabled: !!address,
  });

  const { data: txData } = useQuery({
    queryKey: ["ada-transactions", address],
    queryFn: async () => { const res = await fetch(`/api/ada/transactions/${address}`); if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); } return res.json(); },
    enabled: !!address,
  });

  const handleSearch = () => { if (input.trim()) setAddress(input.trim()); };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input placeholder="Enter Cardano address (addr1q...)" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} className="bg-card border-border" data-testid="input-ada-address" />
        <Button onClick={handleSearch} disabled={!input.trim()} data-testid="button-ada-search"><Search className="w-4 h-4 mr-1" /> Search</Button>
      </div>
      {isLoading && <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}
      {error && <div className="glass-panel p-4 text-destructive text-sm" data-testid="text-ada-error">{(error as Error).message}</div>}
      {accountData && (
        <Card className="glass-panel border-blue-600/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3"><Wallet className="w-5 h-5 text-blue-400" /><h3 className="font-display font-semibold">Account Info</h3></div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div><p className="text-xs text-muted-foreground">Balance</p><p className="font-mono text-lg font-semibold text-blue-400" data-testid="text-ada-balance">{accountData.balance} ADA</p></div>
              <div><p className="text-xs text-muted-foreground">UTXOs</p><p className="font-mono" data-testid="text-ada-utxos">{accountData.utxoCount}</p></div>
              {accountData.stakeAddress && <div><p className="text-xs text-muted-foreground">Stake Address</p><p className="font-mono text-xs text-muted-foreground" data-testid="text-ada-stake">{truncateHash(accountData.stakeAddress)}</p></div>}
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono" data-testid="text-ada-addr">{truncateHash(accountData.address)}</span>
              <CopyButton text={accountData.address} id="ada-addr" />
            </div>
          </CardContent>
        </Card>
      )}
      {txData?.transactions?.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2"><ArrowRightLeft className="w-4 h-4 text-blue-400" /><h3 className="font-display font-semibold text-sm">Recent Transactions</h3><Badge variant="secondary" className="text-xs">{txData.transactions.length}</Badge></div>
          {txData.transactions.map((tx: any, i: number) => (
            <Card key={tx.hash || i} className="glass-panel border-border/50" data-testid={`card-ada-tx-${i}`}>
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1"><span className="font-mono text-xs text-muted-foreground">{truncateHash(tx.hash)}</span><CopyButton text={tx.hash} id={`ada-tx-${i}`} /></div>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div><span className="text-muted-foreground">Block:</span> <span className="font-mono">{tx.blockHeight?.toLocaleString()}</span></div>
                  <div><span className="text-muted-foreground">Epoch:</span> <span className="font-mono">{tx.epoch}</span></div>
                  <div><span className="text-muted-foreground">Time:</span> <span>{tx.blockTime ? timeAgo(tx.blockTime) : "—"}</span></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function TonExplorer({ chain }: { chain: ChainInfo }) {
  const [input, setInput] = useState("");
  const [address, setAddress] = useState("");

  const { data: accountData, isLoading, error } = useQuery({
    queryKey: ["ton-account", address],
    queryFn: async () => { const res = await fetch(`/api/ton/account/${address}`); if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); } return res.json(); },
    enabled: !!address,
  });

  const { data: txData } = useQuery({
    queryKey: ["ton-transactions", address],
    queryFn: async () => { const res = await fetch(`/api/ton/transactions/${address}`); if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); } return res.json(); },
    enabled: !!address,
  });

  const handleSearch = () => { if (input.trim()) setAddress(input.trim()); };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input placeholder="Enter TON address (EQ... or UQ...)" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} className="bg-card border-border" data-testid="input-ton-address" />
        <Button onClick={handleSearch} disabled={!input.trim()} data-testid="button-ton-search"><Search className="w-4 h-4 mr-1" /> Search</Button>
      </div>
      {isLoading && <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}
      {error && <div className="glass-panel p-4 text-destructive text-sm" data-testid="text-ton-error">{(error as Error).message}</div>}
      {accountData && (
        <Card className="glass-panel border-sky-500/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3"><Wallet className="w-5 h-5 text-sky-400" /><h3 className="font-display font-semibold">Account Info</h3></div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div><p className="text-xs text-muted-foreground">Balance</p><p className="font-mono text-lg font-semibold text-sky-400" data-testid="text-ton-balance">{accountData.balance} TON</p></div>
              <div><p className="text-xs text-muted-foreground">State</p><p className="font-mono" data-testid="text-ton-state"><Badge variant="outline" className={accountData.state === "active" ? "text-green-400 border-green-400/30" : "text-yellow-400 border-yellow-400/30"}>{accountData.state}</Badge></p></div>
            </div>
          </CardContent>
        </Card>
      )}
      {txData?.transactions?.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2"><ArrowRightLeft className="w-4 h-4 text-sky-400" /><h3 className="font-display font-semibold text-sm">Recent Transactions</h3><Badge variant="secondary" className="text-xs">{txData.transactions.length}</Badge></div>
          {txData.transactions.map((tx: any, i: number) => (
            <Card key={tx.lt || i} className="glass-panel border-border/50" data-testid={`card-ton-tx-${i}`}>
              <CardContent className="p-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                  <div><span className="text-muted-foreground">Value:</span> <span className="font-mono">{tx.inMsg?.value || "0"} TON</span></div>
                  <div><span className="text-muted-foreground">Fee:</span> <span className="font-mono text-yellow-400">{tx.fee} TON</span></div>
                  <div><span className="text-muted-foreground">Out msgs:</span> <span className="font-mono">{tx.outMsgCount}</span></div>
                  <div><span className="text-muted-foreground">Time:</span> <span>{tx.timestamp ? timeAgo(tx.timestamp) : "—"}</span></div>
                </div>
                {tx.inMsg?.source && <p className="text-[10px] text-muted-foreground mt-1">From: <span className="font-mono">{truncateHash(tx.inMsg.source)}</span></p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function AtomExplorer({ chain }: { chain: ChainInfo }) {
  const [input, setInput] = useState("");
  const [address, setAddress] = useState("");

  const { data: accountData, isLoading, error } = useQuery({
    queryKey: ["atom-account", address],
    queryFn: async () => { const res = await fetch(`/api/atom/account/${address}`); if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); } return res.json(); },
    enabled: !!address,
  });

  const { data: txData } = useQuery({
    queryKey: ["atom-transactions", address],
    queryFn: async () => { const res = await fetch(`/api/atom/transactions/${address}`); if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); } return res.json(); },
    enabled: !!address,
  });

  const handleSearch = () => { if (input.trim()) setAddress(input.trim()); };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input placeholder="Enter Cosmos address (cosmos1...)" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} className="bg-card border-border" data-testid="input-atom-address" />
        <Button onClick={handleSearch} disabled={!input.trim()} data-testid="button-atom-search"><Search className="w-4 h-4 mr-1" /> Search</Button>
      </div>
      {isLoading && <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}
      {error && <div className="glass-panel p-4 text-destructive text-sm" data-testid="text-atom-error">{(error as Error).message}</div>}
      {accountData && (
        <Card className="glass-panel border-indigo-500/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3"><Wallet className="w-5 h-5 text-indigo-400" /><h3 className="font-display font-semibold">Account Info</h3></div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div><p className="text-xs text-muted-foreground">Available</p><p className="font-mono text-lg font-semibold text-indigo-400" data-testid="text-atom-balance">{accountData.balance} ATOM</p></div>
              <div><p className="text-xs text-muted-foreground">Staked</p><p className="font-mono text-sm text-green-400" data-testid="text-atom-staked">{accountData.staked} ATOM</p></div>
              {accountData.balances?.length > 1 && <div><p className="text-xs text-muted-foreground">Other Tokens</p><p className="font-mono text-sm">{accountData.balances.length - 1}</p></div>}
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono" data-testid="text-atom-addr">{truncateHash(accountData.address)}</span>
              <CopyButton text={accountData.address} id="atom-addr" />
            </div>
          </CardContent>
        </Card>
      )}
      {txData?.transactions?.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2"><ArrowRightLeft className="w-4 h-4 text-indigo-400" /><h3 className="font-display font-semibold text-sm">Recent Transactions</h3><Badge variant="secondary" className="text-xs">{txData.total} total</Badge></div>
          {txData.transactions.map((tx: any, i: number) => (
            <Card key={tx.hash || i} className="glass-panel border-border/50" data-testid={`card-atom-tx-${i}`}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2"><span className="font-mono text-xs text-muted-foreground">{truncateHash(tx.hash)}</span><CopyButton text={tx.hash} id={`atom-tx-${i}`} /></div>
                  {tx.success ? (<Badge variant="outline" className="text-green-400 border-green-400/30 text-[10px]"><CheckCircle2 className="w-3 h-3 mr-1" />OK</Badge>) : (<Badge variant="outline" className="text-red-400 border-red-400/30 text-[10px]"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>)}
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div><span className="text-muted-foreground">Height:</span> <span className="font-mono">{tx.height?.toLocaleString()}</span></div>
                  <div><span className="text-muted-foreground">Gas:</span> <span className="font-mono">{tx.gasUsed}/{tx.gasWanted}</span></div>
                  <div><span className="text-muted-foreground">Time:</span> <span>{tx.timestamp ? timeAgo(Math.floor(new Date(tx.timestamp).getTime() / 1000)) : "—"}</span></div>
                </div>
                {tx.memo && <p className="text-[10px] text-muted-foreground mt-1 truncate">Memo: {tx.memo}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function NearExplorer({ chain }: { chain: ChainInfo }) {
  const [input, setInput] = useState("");
  const [accountId, setAccountId] = useState("");

  const { data: accountData, isLoading, error } = useQuery({
    queryKey: ["near-account", accountId],
    queryFn: async () => { const res = await fetch(`/api/near/account/${accountId}`); if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); } return res.json(); },
    enabled: !!accountId,
  });

  const handleSearch = () => { if (input.trim()) setAccountId(input.trim()); };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input placeholder="Enter NEAR account (e.g. root.near)" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} className="bg-card border-border" data-testid="input-near-address" />
        <Button onClick={handleSearch} disabled={!input.trim()} data-testid="button-near-search"><Search className="w-4 h-4 mr-1" /> Search</Button>
      </div>
      {isLoading && <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}
      {error && <div className="glass-panel p-4 text-destructive text-sm" data-testid="text-near-error">{(error as Error).message}</div>}
      {accountData && (
        <Card className="glass-panel border-cyan-600/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3"><Wallet className="w-5 h-5 text-cyan-400" /><h3 className="font-display font-semibold">Account Info</h3></div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div><p className="text-xs text-muted-foreground">Balance</p><p className="font-mono text-lg font-semibold text-cyan-400" data-testid="text-near-balance">{accountData.balance} NEAR</p></div>
              <div><p className="text-xs text-muted-foreground">Locked</p><p className="font-mono text-sm" data-testid="text-near-locked">{accountData.locked} NEAR</p></div>
              <div><p className="text-xs text-muted-foreground">Storage</p><p className="font-mono text-sm" data-testid="text-near-storage">{(accountData.storageUsage / 1024).toFixed(1)} KB</p></div>
              <div><p className="text-xs text-muted-foreground">Block Height</p><p className="font-mono text-sm" data-testid="text-near-block">{accountData.blockHeight?.toLocaleString()}</p></div>
              <div><p className="text-xs text-muted-foreground">Has Contract</p><p className="font-mono text-sm" data-testid="text-near-contract">{accountData.hasContract ? "Yes" : "No"}</p></div>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono" data-testid="text-near-accountid">{accountData.accountId}</span>
              <CopyButton text={accountData.accountId} id="near-account" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DotExplorer({ chain }: { chain: ChainInfo }) {
  const [input, setInput] = useState("");
  const [address, setAddress] = useState("");

  const { data: accountData, isLoading, error } = useQuery({
    queryKey: ["dot-account", address],
    queryFn: async () => { const res = await fetch(`/api/dot/account/${address}`); if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); } return res.json(); },
    enabled: !!address,
  });

  const { data: txData } = useQuery({
    queryKey: ["dot-transactions", address],
    queryFn: async () => { const res = await fetch(`/api/dot/transactions/${address}`); if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); } return res.json(); },
    enabled: !!address,
  });

  const handleSearch = () => { if (input.trim()) setAddress(input.trim()); };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input placeholder="Enter Polkadot address (1... or 5...)" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} className="bg-card border-border" data-testid="input-dot-address" />
        <Button onClick={handleSearch} disabled={!input.trim()} data-testid="button-dot-search"><Search className="w-4 h-4 mr-1" /> Search</Button>
      </div>
      {isLoading && <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}
      {error && <div className="glass-panel p-4 text-destructive text-sm" data-testid="text-dot-error">{(error as Error).message}</div>}
      {accountData && (
        <Card className="glass-panel border-pink-500/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3"><Wallet className="w-5 h-5 text-pink-400" /><h3 className="font-display font-semibold">Account Info</h3></div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div><p className="text-xs text-muted-foreground">Balance</p><p className="font-mono text-lg font-semibold text-pink-400" data-testid="text-dot-balance">{accountData.balance} DOT</p></div>
              <div><p className="text-xs text-muted-foreground">Locked</p><p className="font-mono text-sm" data-testid="text-dot-locked">{accountData.locked} DOT</p></div>
              <div><p className="text-xs text-muted-foreground">Reserved</p><p className="font-mono text-sm" data-testid="text-dot-reserved">{accountData.reserved} DOT</p></div>
              <div><p className="text-xs text-muted-foreground">Bonded (Staked)</p><p className="font-mono text-sm text-green-400" data-testid="text-dot-bonded">{accountData.bonded} DOT</p></div>
              <div><p className="text-xs text-muted-foreground">Unbonding</p><p className="font-mono text-sm text-yellow-400" data-testid="text-dot-unbonding">{accountData.unbonding} DOT</p></div>
              {accountData.price && <div><p className="text-xs text-muted-foreground">DOT Price</p><p className="font-mono text-sm" data-testid="text-dot-price">${accountData.price}</p></div>}
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono" data-testid="text-dot-addr">{truncateHash(accountData.address)}</span>
              <CopyButton text={accountData.address} id="dot-addr" />
            </div>
          </CardContent>
        </Card>
      )}
      {txData?.transactions?.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2"><ArrowRightLeft className="w-4 h-4 text-pink-400" /><h3 className="font-display font-semibold text-sm">Recent Transfers</h3><Badge variant="secondary" className="text-xs">{txData.count} total</Badge></div>
          {txData.transactions.map((tx: any, i: number) => (
            <Card key={tx.hash || i} className="glass-panel border-border/50" data-testid={`card-dot-tx-${i}`}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2"><span className="font-mono text-xs text-muted-foreground">{truncateHash(tx.hash)}</span><CopyButton text={tx.hash} id={`dot-tx-${i}`} /></div>
                  <div className="flex items-center gap-1">
                    {tx.success ? (<Badge variant="outline" className="text-green-400 border-green-400/30 text-[10px]"><CheckCircle2 className="w-3 h-3 mr-1" />OK</Badge>) : (<Badge variant="outline" className="text-red-400 border-red-400/30 text-[10px]"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>)}
                    <Badge variant="outline" className={`text-[10px] ${tx.direction === "received" ? "text-green-400 border-green-400/30" : "text-red-400 border-red-400/30"}`}>{tx.direction === "received" ? "IN" : "OUT"}</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div><span className="text-muted-foreground">Amount:</span> <span className="font-mono">{tx.amount} {tx.symbol}</span></div>
                  <div><span className="text-muted-foreground">Block:</span> <span className="font-mono">{tx.blockNumber?.toLocaleString() || "—"}</span></div>
                  <div><span className="text-muted-foreground">Time:</span> <span>{tx.timestamp ? timeAgo(tx.timestamp) : "—"}</span></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function NeoGasCalculator() {
  const [neoAmount, setNeoAmount] = useState("100");
  const [duration, setDuration] = useState("365");

  const { data: gasPrice } = useQuery({
    queryKey: ["coin-info", "gas"],
    queryFn: async () => {
      const res = await fetch("/api/coin/gas");
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 60000,
  });

  const { data: neoPrice } = useQuery({
    queryKey: ["coin-info", "neo"],
    queryFn: async () => {
      const res = await fetch("/api/coin/neo");
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 60000,
  });

  const TOTAL_NEO = 100_000_000;
  const GAS_PER_BLOCK = 5;
  const BLOCKS_PER_DAY = 5760;

  const neo = parseFloat(neoAmount) || 0;
  const days = parseFloat(duration) || 0;
  const dailyGas = (neo / TOTAL_NEO) * GAS_PER_BLOCK * BLOCKS_PER_DAY;
  const totalGas = dailyGas * days;
  const gasUsdPrice = gasPrice?.current_price || 0;
  const neoUsdPrice = neoPrice?.current_price || 0;
  const totalGasUsd = totalGas * gasUsdPrice;
  const neoHoldingUsd = neo * neoUsdPrice;
  const apr = neoHoldingUsd > 0 ? ((dailyGas * 365 * gasUsdPrice) / neoHoldingUsd) * 100 : 0;

  return (
    <Card className="glass-panel border-green-500/20">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-green-400" />
          <h3 className="font-display font-semibold text-lg">NEO GAS Staking Calculator</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          NEO holders automatically generate GAS tokens just by holding NEO in a wallet. No locking or active staking required. {GAS_PER_BLOCK} GAS are distributed per block across all {TOTAL_NEO.toLocaleString()} NEO tokens. Vote in Neo Council governance for bonus GAS rewards.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">NEO Holdings</label>
            <Input
              type="number"
              min="1"
              max="100000000"
              value={neoAmount}
              onChange={(e) => setNeoAmount(e.target.value)}
              className="bg-card border-border font-mono"
              data-testid="input-neo-staking-amount"
            />
            {neoUsdPrice > 0 && <p className="text-[10px] text-muted-foreground mt-1">≈ ${(neo * neoUsdPrice).toLocaleString(undefined, { maximumFractionDigits: 2 })} USD</p>}
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Duration (days)</label>
            <div className="flex gap-2">
              <Input
                type="number"
                min="1"
                max="3650"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="bg-card border-border font-mono"
                data-testid="input-neo-staking-duration"
              />
              <div className="flex gap-1">
                {[30, 90, 365].map(d => (
                  <Button key={d} variant={duration === String(d) ? "default" : "outline"} size="sm" onClick={() => setDuration(String(d))} className="text-xs px-2" data-testid={`button-neo-duration-${d}`}>
                    {d === 365 ? "1Y" : `${d}D`}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="glass-panel p-3 rounded-lg">
            <p className="text-muted-foreground mb-1">Daily GAS</p>
            <p className="font-mono font-semibold text-green-400" data-testid="text-neo-daily-gas">{dailyGas.toFixed(6)}</p>
            {gasUsdPrice > 0 && <p className="text-[10px] text-muted-foreground">≈ ${(dailyGas * gasUsdPrice).toFixed(4)}</p>}
          </div>
          <div className="glass-panel p-3 rounded-lg">
            <p className="text-muted-foreground mb-1">Total GAS ({days}d)</p>
            <p className="font-mono font-semibold text-green-400" data-testid="text-neo-total-gas">{totalGas.toFixed(4)}</p>
            {gasUsdPrice > 0 && <p className="text-[10px] text-muted-foreground">≈ ${totalGasUsd.toFixed(2)}</p>}
          </div>
          <div className="glass-panel p-3 rounded-lg">
            <p className="text-muted-foreground mb-1">Est. APR</p>
            <p className="font-mono font-semibold text-primary" data-testid="text-neo-apr">{apr.toFixed(2)}%</p>
            <p className="text-[10px] text-muted-foreground">base rate</p>
          </div>
          <div className="glass-panel p-3 rounded-lg">
            <p className="text-muted-foreground mb-1">GAS Price</p>
            <p className="font-mono font-semibold" data-testid="text-gas-price">${gasUsdPrice.toLocaleString(undefined, { maximumFractionDigits: 4 })}</p>
            <p className="text-[10px] text-muted-foreground">live</p>
          </div>
        </div>
        <div className="mt-4 glass-panel p-3 rounded-lg">
          <h4 className="text-xs font-semibold mb-2 flex items-center gap-1"><Calculator className="w-3.5 h-3.5 text-primary" /> How NEO GAS Generation Works</h4>
          <ul className="text-[11px] text-muted-foreground space-y-1">
            <li>• Hold NEO in a personal wallet (not on an exchange) to earn GAS automatically</li>
            <li>• {GAS_PER_BLOCK} GAS distributed per block (~{BLOCKS_PER_DAY.toLocaleString()} blocks/day at 15s intervals)</li>
            <li>• Your share: (Your NEO ÷ {TOTAL_NEO.toLocaleString()}) × {GAS_PER_BLOCK} GAS per block</li>
            <li>• Claim GAS by sending a transaction to yourself or using your wallet's "Claim GAS" button</li>
            <li>• Vote in Neo Council governance for additional bonus GAS rewards</li>
            <li>• NEO is indivisible — you must hold whole NEO tokens (1, 2, 3...)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function ChainExplorerView({ chainId }: { chainId: ChainId }) {
  const chain = getChain(chainId);
  const [, navigate] = useLocation();

  const renderAddressExplorer = () => {
    if (!chain.hasAddressLookup) {
      if (chain.internalRoute) {
        const targetUrl = chain.isEvm && chain.evmChainId ? `${chain.internalRoute}?chain=${chain.evmChainId}` : chain.internalRoute;
        const label = chain.id === "xrp" ? "Open XRP Explorer" : chain.isEvm ? "Open Wallet Tracker" : "Open Wallet Tracker";
        return (
          <div className="glass-panel p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-primary shrink-0" />
              <p className="text-sm text-muted-foreground">
                {chain.isEvm ? `${chain.name} is supported through the EVM Wallet Tracker for address lookups.` : `${chain.name} has a dedicated explorer for full address, token, and transaction lookup.`}
              </p>
            </div>
            <Button size="sm" onClick={() => navigate(targetUrl)} data-testid={`button-open-${chain.id}-tracker`}>{label} <ArrowRight className="w-3.5 h-3.5 ml-1" /></Button>
          </div>
        );
      }
      return (
        <div className="glass-panel p-4 flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-primary shrink-0" />
          <p className="text-sm text-muted-foreground">Address lookup is not yet available for {chain.name}. View live market data above.</p>
        </div>
      );
    }

    switch (chainId) {
      case "sol": return <SolExplorer chain={chain} />;
      case "trx": return <TrxExplorer chain={chain} />;
      case "xlm": return <XlmExplorer chain={chain} />;
      case "xem": return <XemExplorer chain={chain} />;
      case "neo": return <NeoExplorer chain={chain} />;
      case "dot": return <DotExplorer chain={chain} />;
      case "ada": return <AdaExplorer chain={chain} />;
      case "ton": return <TonExplorer chain={chain} />;
      case "atom": return <AtomExplorer chain={chain} />;
      case "near": return <NearExplorer chain={chain} />;
      case "btc": return <BlockcypherExplorer chain={chain} symbol="BTC" addressApiPrefix="btc" txApiPrefix="btc" explorerBaseUrl="https://blockstream.info" />;
      case "doge": return <BlockcypherExplorer chain={chain} symbol="DOGE" addressApiPrefix="doge" txApiPrefix="doge" explorerBaseUrl="https://dogechain.info" />;
      case "ltc": return <BlockcypherExplorer chain={chain} symbol="LTC" addressApiPrefix="ltc" txApiPrefix="ltc" explorerBaseUrl="https://litecoinspace.org" />;
      case "bch": return <BlockcypherExplorer chain={chain} symbol="BCH" addressApiPrefix="bch" txApiPrefix="bch" explorerBaseUrl="https://blockchair.com/bitcoin-cash" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-3xl">{chain.icon}</span>
        <div>
          <h2 className="text-xl font-display font-bold" data-testid={`text-${chainId}-explorer-title`}>{chain.name} Explorer</h2>
          <p className="text-sm text-muted-foreground">{chain.symbol} · {chain.description}</p>
        </div>
      </div>
      <CoinInfoPanel coingeckoId={chain.coingeckoId} chainName={chain.name} />
      <AdBanner slot={`explorer-${chainId}`} className="my-4" />
      {chainId === "neo" && <NeoGasCalculator />}
      {renderAddressExplorer()}
    </div>
  );
}

interface SectionConfig {
  id: string;
  title: string;
  subtitle: string;
  chainIds: ChainId[];
  visible: boolean;
}

const DEFAULT_SECTIONS: SectionConfig[] = [
  { id: "top-chains", title: "Top Chains", subtitle: "Top cryptocurrencies by market cap — click to explore", chainIds: TOP_CHAIN_IDS, visible: true },
  { id: "more-chains", title: "More Chains", subtitle: "Additional blockchains with live market data and address lookup", chainIds: MORE_CHAIN_IDS, visible: true },
  { id: "evm-chains", title: "EVM Networks", subtitle: "Layer 2 and EVM-compatible chains — tracked via the Wallet Tracker", chainIds: EVM_CHAIN_IDS, visible: true },
];

const SECTION_PREFS_KEY = "explorer-section-prefs";

function loadSectionPrefs(): SectionConfig[] {
  try {
    const saved = localStorage.getItem(SECTION_PREFS_KEY);
    if (!saved) return DEFAULT_SECTIONS;
    const parsed = JSON.parse(saved) as { id: string; visible: boolean }[];
    const ordered: SectionConfig[] = [];
    for (const pref of parsed) {
      const def = DEFAULT_SECTIONS.find(s => s.id === pref.id);
      if (def) ordered.push({ ...def, visible: pref.visible });
    }
    for (const def of DEFAULT_SECTIONS) {
      if (!ordered.find(s => s.id === def.id)) ordered.push(def);
    }
    return ordered;
  } catch {
    return DEFAULT_SECTIONS;
  }
}

function saveSectionPrefs(sections: SectionConfig[]) {
  localStorage.setItem(SECTION_PREFS_KEY, JSON.stringify(sections.map(s => ({ id: s.id, visible: s.visible }))));
}

function CustomizePanel({ sections, onChange, onClose }: { sections: SectionConfig[]; onChange: (s: SectionConfig[]) => void; onClose: () => void }) {
  const toggleVisibility = (id: string) => {
    const updated = sections.map(s => s.id === id ? { ...s, visible: !s.visible } : s);
    onChange(updated);
  };

  const moveUp = (index: number) => {
    if (index <= 0) return;
    const updated = [...sections];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    onChange(updated);
  };

  const moveDown = (index: number) => {
    if (index >= sections.length - 1) return;
    const updated = [...sections];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    onChange(updated);
  };

  const resetDefaults = () => {
    onChange(DEFAULT_SECTIONS);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <Card className="glass-panel border-primary/30 w-full max-w-md mx-4" data-testid="panel-customize-sections">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-primary" />
              <h3 className="font-display font-bold text-lg">Customize Sections</h3>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors" data-testid="button-close-customize">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Toggle visibility and reorder sections on the explorer homepage.</p>
          <div className="space-y-2">
            {sections.map((section, index) => (
              <div key={section.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${section.visible ? "glass-panel border-border/50" : "bg-muted/20 border-border/20 opacity-60"}`} data-testid={`customize-row-${section.id}`}>
                <button onClick={() => toggleVisibility(section.id)} className={`shrink-0 transition-colors ${section.visible ? "text-primary" : "text-muted-foreground"}`} data-testid={`button-toggle-${section.id}`}>
                  {section.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <span className="flex-1 font-medium text-sm">{section.title}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => moveUp(index)} disabled={index === 0} className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors" data-testid={`button-moveup-${section.id}`}>
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button onClick={() => moveDown(index)} disabled={index === sections.length - 1} className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors" data-testid={`button-movedown-${section.id}`}>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-5">
            <Button variant="ghost" size="sm" onClick={resetDefaults} data-testid="button-reset-customize">Reset to Default</Button>
            <Button size="sm" onClick={onClose} data-testid="button-done-customize">Done</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ExplorerPage() {
  const [view, setView] = useState<ChainId>("overview");
  const [, navigate] = useLocation();
  const [sections, setSections] = useState<SectionConfig[]>(loadSectionPrefs);
  const [showCustomize, setShowCustomize] = useState(false);

  const handleSectionsChange = useCallback((updated: SectionConfig[]) => {
    setSections(updated);
    saveSectionPrefs(updated);
  }, []);

  const handleChainClick = (chain: ChainInfo) => {
    setView(chain.id);
  };

  const renderSection = (section: SectionConfig) => (
    <section key={section.id}>
      <h2 className="text-xl font-display font-semibold mb-2 flex items-center gap-2" data-testid={`text-section-${section.id}`}>
        <span className="w-2 h-2 rounded-full bg-primary" /> {section.title}
      </h2>
      <p className="text-sm text-muted-foreground mb-4">{section.subtitle}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {section.chainIds.map(id => {
          const chain = getChain(id);
          return (
            <button key={id} onClick={() => handleChainClick(chain)} className="text-left group" data-testid={`card-chain-${id}`}>
              <Card className={`glass-panel bg-gradient-to-br ${chain.color} border hover:border-primary/50 transition-all duration-300 group-hover:scale-[1.02] h-full`}>
                <CardContent className="p-4 text-center">
                  <span className="text-2xl block mb-2">{chain.icon}</span>
                  <p className="font-display font-semibold text-sm">{chain.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{chain.symbol}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{chain.description}</p>
                  {chain.hasAddressLookup && <Badge variant="outline" className="text-primary border-primary/30 text-[9px] mt-2">Address Lookup</Badge>}
                  {!chain.hasAddressLookup && chain.internalRoute && <Badge variant="outline" className="text-primary border-primary/30 text-[9px] mt-2">Wallet Tracker</Badge>}
                  {!chain.hasAddressLookup && !chain.internalRoute && <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30 text-[9px] mt-2">Coin Info</Badge>}
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>
    </section>
  );

  const visibleSections = sections.filter(s => s.visible);
  const adInsertAfterIndex = 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-2" data-testid="text-explorer-title">Multi-Chain Explorer</h1>
            <p className="text-muted-foreground" data-testid="text-explorer-subtitle">Explore wallets and transactions across 24+ blockchains — all built-in, all free</p>
          </div>
          {view === "overview" && (
            <Button variant="outline" size="sm" onClick={() => setShowCustomize(true)} className="shrink-0 mt-1" data-testid="button-customize-sections">
              <Settings2 className="w-4 h-4 mr-1.5" /> Customize
            </Button>
          )}
        </div>

        {view !== "overview" && (
          <Button variant="ghost" onClick={() => setView("overview")} className="text-muted-foreground hover:text-foreground" data-testid="button-back-overview">← Back to all chains</Button>
        )}

        {view === "overview" && (
          <>
            <CoinOfTheDay onChainClick={handleChainClick} />
            {visibleSections.map((section, idx) => (
              <div key={section.id}>
                {renderSection(section)}
                {idx === adInsertAfterIndex && <AdBanner slot="explorer-mid" className="my-6" />}
              </div>
            ))}
          </>
        )}

        {view !== "overview" && <ChainExplorerView chainId={view} />}

        <AdBanner slot="explorer-bottom" className="mt-8" />
      </main>
      {showCustomize && (
        <CustomizePanel sections={sections} onChange={handleSectionsChange} onClose={() => setShowCustomize(false)} />
      )}
      <Footer />
    </div>
  );
}
