import { useState } from "react";
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
  { id: "eth", name: "Ethereum", symbol: "ETH", icon: "⟠", color: "from-blue-500/20 to-blue-600/10 border-blue-500/30", description: "EVM wallet tracker with multi-chain support", coingeckoId: "ethereum", hasAddressLookup: false, isEvm: true, internalRoute: "/" },
  { id: "sol", name: "Solana", symbol: "SOL", icon: "◎", color: "from-purple-500/20 to-purple-600/10 border-purple-500/30", description: "Account balance & recent transactions", coingeckoId: "solana", hasAddressLookup: true, apiPrefix: "sol", addressPlaceholder: "Enter Solana address (7v91N...)", explorerUrl: "https://solscan.io" },
  { id: "xrp", name: "XRP Ledger", symbol: "XRP", icon: "✕", color: "from-gray-400/20 to-gray-500/10 border-gray-400/30", description: "Full account, tokens, NFTs & transactions", coingeckoId: "ripple", hasAddressLookup: false, internalRoute: "/xrp" },
  { id: "bnb", name: "BNB Chain", symbol: "BNB", icon: "◆", color: "from-yellow-500/20 to-yellow-600/10 border-yellow-500/30", description: "BEP-20 tokens & DeFi ecosystem", coingeckoId: "binancecoin", hasAddressLookup: false, isEvm: true, evmChainId: 56, internalRoute: "/" },
  { id: "doge", name: "Dogecoin", symbol: "DOGE", icon: "Ð", color: "from-amber-500/20 to-amber-600/10 border-amber-500/30", description: "Address balance & transaction explorer", coingeckoId: "dogecoin", hasAddressLookup: true, apiPrefix: "doge", addressPlaceholder: "Enter Dogecoin address (D...)", explorerUrl: "https://dogechain.info" },
  { id: "ada", name: "Cardano", symbol: "ADA", icon: "₳", color: "from-blue-600/20 to-blue-700/10 border-blue-600/30", description: "Proof-of-stake smart contract platform", coingeckoId: "cardano", hasAddressLookup: false },
  { id: "trx", name: "TRON", symbol: "TRX", icon: "⟁", color: "from-red-500/20 to-red-600/10 border-red-500/30", description: "High-throughput blockchain network", coingeckoId: "tron", hasAddressLookup: true, apiPrefix: "trx", addressPlaceholder: "Enter TRON address (T...)", explorerUrl: "https://tronscan.org" },
  { id: "avax", name: "Avalanche", symbol: "AVAX", icon: "🔺", color: "from-red-600/20 to-red-700/10 border-red-600/30", description: "High-speed smart contracts", coingeckoId: "avalanche-2", hasAddressLookup: false, isEvm: true, evmChainId: 43114, internalRoute: "/" },
  { id: "ton", name: "Toncoin", symbol: "TON", icon: "💎", color: "from-sky-500/20 to-sky-600/10 border-sky-500/30", description: "Telegram's blockchain ecosystem", coingeckoId: "the-open-network", hasAddressLookup: false },
  { id: "dot", name: "Polkadot", symbol: "DOT", icon: "●", color: "from-pink-500/20 to-pink-600/10 border-pink-500/30", description: "Multi-chain interoperability", coingeckoId: "polkadot", hasAddressLookup: false },
  { id: "link", name: "Chainlink", symbol: "LINK", icon: "⬡", color: "from-blue-400/20 to-blue-500/10 border-blue-400/30", description: "Decentralized oracle network (ERC-20)", coingeckoId: "chainlink", hasAddressLookup: false, isEvm: true, internalRoute: "/" },
  { id: "ltc", name: "Litecoin", symbol: "LTC", icon: "Ł", color: "from-gray-400/20 to-gray-500/10 border-gray-400/30", description: "Digital silver peer-to-peer payments", coingeckoId: "litecoin", hasAddressLookup: true, apiPrefix: "ltc", addressPlaceholder: "Enter Litecoin address (L..., M..., ltc1...)", explorerUrl: "https://litecoinspace.org" },
  { id: "shib", name: "Shiba Inu", symbol: "SHIB", icon: "🐕", color: "from-orange-400/20 to-orange-500/10 border-orange-400/30", description: "Community-driven memecoin (ERC-20)", coingeckoId: "shiba-inu", hasAddressLookup: false, isEvm: true, internalRoute: "/" },
  { id: "bch", name: "Bitcoin Cash", symbol: "BCH", icon: "₿", color: "from-green-500/20 to-green-600/10 border-green-500/30", description: "Bitcoin fork for fast payments", coingeckoId: "bitcoin-cash", hasAddressLookup: true, apiPrefix: "bch", addressPlaceholder: "Enter BCH address (1..., q...)", explorerUrl: "https://blockchair.com/bitcoin-cash" },
  { id: "xem", name: "NEM", symbol: "XEM", icon: "✦", color: "from-teal-500/20 to-teal-600/10 border-teal-500/30", description: "Smart asset blockchain platform", coingeckoId: "nem", hasAddressLookup: true, apiPrefix: "xem", addressPlaceholder: "Enter NEM address (N...)", explorerUrl: "https://explorer.nemtool.com" },
  { id: "neo", name: "NEO", symbol: "NEO", icon: "◈", color: "from-green-400/20 to-green-500/10 border-green-400/30", description: "Smart economy blockchain (N3)", coingeckoId: "neo", hasAddressLookup: true, apiPrefix: "neo", addressPlaceholder: "Enter NEO address (N...)", explorerUrl: "https://dora.coz.io" },
  { id: "xlm", name: "Stellar", symbol: "XLM", icon: "✴", color: "from-violet-400/20 to-violet-500/10 border-violet-400/30", description: "Cross-border payment network", coingeckoId: "stellar", hasAddressLookup: true, apiPrefix: "xlm", addressPlaceholder: "Enter Stellar address (G...)", explorerUrl: "https://stellarchain.io" },
  { id: "atom", name: "Cosmos", symbol: "ATOM", icon: "⚛", color: "from-indigo-500/20 to-indigo-600/10 border-indigo-500/30", description: "Internet of blockchains", coingeckoId: "cosmos", hasAddressLookup: false },
  { id: "near", name: "NEAR Protocol", symbol: "NEAR", icon: "Ⓝ", color: "from-cyan-600/20 to-cyan-700/10 border-cyan-600/30", description: "Developer-friendly L1 platform", coingeckoId: "near", hasAddressLookup: false },
  { id: "polygon", name: "Polygon", symbol: "MATIC", icon: "⬡", color: "from-purple-400/20 to-purple-500/10 border-purple-400/30", description: "Layer 2 scaling solution", coingeckoId: "matic-network", hasAddressLookup: false, isEvm: true, evmChainId: 137, internalRoute: "/" },
  { id: "arbitrum", name: "Arbitrum", symbol: "ARB", icon: "🔵", color: "from-cyan-500/20 to-cyan-600/10 border-cyan-500/30", description: "Optimistic rollup L2", coingeckoId: "arbitrum", hasAddressLookup: false, isEvm: true, evmChainId: 42161, internalRoute: "/" },
  { id: "optimism", name: "Optimism", symbol: "OP", icon: "🔴", color: "from-red-500/20 to-red-600/10 border-red-500/30", description: "OP Stack L2 network", coingeckoId: "optimism", hasAddressLookup: false, isEvm: true, evmChainId: 10, internalRoute: "/" },
  { id: "base", name: "Base", symbol: "ETH", icon: "🔷", color: "from-blue-400/20 to-blue-500/10 border-blue-400/30", description: "Coinbase's L2 chain", coingeckoId: "ethereum", hasAddressLookup: false, isEvm: true, evmChainId: 8453, internalRoute: "/" },
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
          <p className="text-xs text-muted-foreground mt-4 leading-relaxed line-clamp-3">{data.description.replace(/<[^>]*>/g, '')}</p>
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
                  <div><span className="text-muted-foreground">Amount:</span> <span className="font-mono">{tx.amount}</span></div>
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
      {renderAddressExplorer()}
    </div>
  );
}

export default function ExplorerPage() {
  const [view, setView] = useState<ChainId>("overview");
  const [, navigate] = useLocation();

  const handleChainClick = (chain: ChainInfo) => {
    setView(chain.id);
  };

  const renderSection = (title: string, subtitle: string, chainIds: ChainId[], sectionId: string) => (
    <section>
      <h2 className="text-xl font-display font-semibold mb-2 flex items-center gap-2" data-testid={`text-section-${sectionId}`}>
        <span className="w-2 h-2 rounded-full bg-primary" /> {title}
      </h2>
      <p className="text-sm text-muted-foreground mb-4">{subtitle}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {chainIds.map(id => {
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-2" data-testid="text-explorer-title">Multi-Chain Explorer</h1>
          <p className="text-muted-foreground" data-testid="text-explorer-subtitle">Explore wallets and transactions across 24+ blockchains — all built-in, all free</p>
        </div>

        {view !== "overview" && (
          <Button variant="ghost" onClick={() => setView("overview")} className="text-muted-foreground hover:text-foreground" data-testid="button-back-overview">← Back to all chains</Button>
        )}

        {view === "overview" && (
          <>
            {renderSection("Top Chains", "Top cryptocurrencies by market cap — click to explore", TOP_CHAIN_IDS, "top-chains")}
            <AdBanner slot="explorer-mid" className="my-6" />
            {renderSection("More Chains", "Additional blockchains with live market data and address lookup", MORE_CHAIN_IDS, "more-chains")}
            {renderSection("EVM Networks", "Layer 2 and EVM-compatible chains — tracked via the Wallet Tracker", EVM_CHAIN_IDS, "evm-chains")}
          </>
        )}

        {view !== "overview" && <ChainExplorerView chainId={view} />}

        <AdBanner slot="explorer-bottom" className="mt-8" />
      </main>
      <Footer />
    </div>
  );
}
