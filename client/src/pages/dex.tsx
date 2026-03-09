import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Loader2,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  Flame,
  Sparkles,
  X,
  ChevronDown,
  ChevronUp,
  Droplets,
  BarChart3,
  Users,
  Clock,
  Zap,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AdBanner } from "@/components/AdBanner";

function formatUsd(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n >= 0.0001) return `$${n.toFixed(6)}`;
  return `$${n.toExponential(2)}`;
}

function formatPrice(n: string | number | null | undefined): string {
  if (n == null) return "—";
  const v = typeof n === "string" ? parseFloat(n) : n;
  if (isNaN(v)) return "—";
  if (v >= 1) return `$${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  if (v >= 0.0001) return `$${v.toFixed(6)}`;
  return `$${v.toExponential(2)}`;
}

function formatNum(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toLocaleString();
}

function safeUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") return url;
  } catch {}
  return undefined;
}

function timeAgo(ts: number | null | undefined): string {
  if (!ts) return "—";
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

const CHAIN_COLORS: Record<string, string> = {
  solana: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  ethereum: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  bsc: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  base: "bg-blue-600/20 text-blue-300 border-blue-600/30",
  arbitrum: "bg-sky-500/20 text-sky-400 border-sky-500/30",
  polygon: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  avalanche: "bg-red-500/20 text-red-400 border-red-500/30",
  optimism: "bg-red-400/20 text-red-300 border-red-400/30",
  fantom: "bg-blue-400/20 text-blue-300 border-blue-400/30",
  cronos: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  sui: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  ton: "bg-sky-400/20 text-sky-300 border-sky-400/30",
  tron: "bg-red-500/20 text-red-400 border-red-500/30",
  aptos: "bg-teal-500/20 text-teal-400 border-teal-500/30",
};

function getChainStyle(chainId: string): string {
  return CHAIN_COLORS[chainId] || "bg-muted/40 text-muted-foreground border-border";
}

function PctBadge({ value, className = "" }: { value: number | null | undefined; className?: string }) {
  if (value == null) return <span className="text-muted-foreground text-xs">—</span>;
  const up = value >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 font-mono text-xs font-semibold ${up ? "text-green-400" : "text-red-400"} ${className}`}>
      {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {Math.abs(value).toFixed(2)}%
    </span>
  );
}

function PairDetailPanel({ pair, onClose }: { pair: any; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [pair.pairAddress]);

  const base = pair.baseToken || {};
  const quote = pair.quoteToken || {};
  const vol = pair.volume || {};
  const txns = pair.txns || {};
  const pc = pair.priceChange || {};
  const liq = pair.liquidity || {};

  return (
    <Card ref={panelRef} className="glass-panel border-primary/30 mb-4" data-testid={`panel-pair-detail-${pair.pairAddress}`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {pair.info?.imageUrl && <img src={pair.info.imageUrl} alt="" className="w-10 h-10 rounded-full" />}
            <div>
              <h3 className="font-display font-bold text-lg text-foreground">
                {base.symbol || "?"}<span className="text-muted-foreground font-normal">/{quote.symbol || "?"}</span>
              </h3>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border ${getChainStyle(pair.chainId)}`}>
                  {pair.chainId}
                </Badge>
                <span className="text-xs text-muted-foreground">{pair.dexId}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {safeUrl(pair.url) && (
              <a
                href={safeUrl(pair.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/20 text-xs text-primary hover:bg-primary/30 transition-colors"
                data-testid="link-dexscreener-pair"
              >
                <ExternalLink className="w-3 h-3" /> DexScreener
              </a>
            )}
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1" data-testid="button-close-pair-detail">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div className="flex flex-col">
            <span className="text-[11px] text-muted-foreground">Price</span>
            <span className="font-mono text-lg font-bold text-foreground">{formatPrice(pair.priceUsd)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-muted-foreground">Native Price</span>
            <span className="font-mono text-sm font-semibold text-foreground">{pair.priceNative || "—"} {quote.symbol}</span>
          </div>
          {pair.marketCap != null && (
            <div className="flex flex-col">
              <span className="text-[11px] text-muted-foreground">Market Cap</span>
              <span className="font-mono text-sm font-semibold text-foreground">{formatUsd(pair.marketCap)}</span>
            </div>
          )}
          {pair.fdv != null && (
            <div className="flex flex-col">
              <span className="text-[11px] text-muted-foreground">FDV</span>
              <span className="font-mono text-sm font-semibold text-foreground">{formatUsd(pair.fdv)}</span>
            </div>
          )}
        </div>

        <div className="border-t border-border pt-4 mt-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Price Changes
          </h4>
          <div className="flex gap-3 flex-wrap">
            {[
              { label: "5m", val: pc.m5 },
              { label: "1h", val: pc.h1 },
              { label: "6h", val: pc.h6 },
              { label: "24h", val: pc.h24 },
            ].map(({ label, val }) => (
              <div key={label} className="text-center px-4 py-2 rounded-lg bg-muted/30 min-w-[60px]">
                <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
                <PctBadge value={val} />
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-border pt-4 mt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1">
            <BarChart3 className="w-3 h-3" /> Volume
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "5m", val: vol.m5 },
              { label: "1h", val: vol.h1 },
              { label: "6h", val: vol.h6 },
              { label: "24h", val: vol.h24 },
            ].map(({ label, val }) => (
              <div key={label} className="flex flex-col">
                <span className="text-[11px] text-muted-foreground">Vol {label}</span>
                <span className="font-mono text-sm font-semibold text-foreground">{formatUsd(val)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-border pt-4 mt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1">
            <Users className="w-3 h-3" /> Transactions
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "5m", data: txns.m5 },
              { label: "1h", data: txns.h1 },
              { label: "6h", data: txns.h6 },
              { label: "24h", data: txns.h24 },
            ].map(({ label, data }) => (
              <div key={label} className="flex flex-col">
                <span className="text-[11px] text-muted-foreground">Txns {label}</span>
                {data ? (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-green-400">{data.buys}B</span>
                    <span className="text-muted-foreground text-[10px]">/</span>
                    <span className="font-mono text-xs text-red-400">{data.sells}S</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-xs">—</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {(liq.usd != null || liq.base != null) && (
          <div className="border-t border-border pt-4 mt-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1">
              <Droplets className="w-3 h-3" /> Liquidity
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col">
                <span className="text-[11px] text-muted-foreground">Total (USD)</span>
                <span className="font-mono text-sm font-semibold text-foreground">{formatUsd(liq.usd)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-muted-foreground">{base.symbol}</span>
                <span className="font-mono text-sm font-semibold text-foreground">{formatNum(liq.base)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-muted-foreground">{quote.symbol}</span>
                <span className="font-mono text-sm font-semibold text-foreground">{formatNum(liq.quote)}</span>
              </div>
            </div>
          </div>
        )}

        {pair.pairCreatedAt && (
          <div className="border-t border-border pt-4 mt-4">
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Pair created {timeAgo(pair.pairCreatedAt)}</span>
              <span className="text-[10px] text-muted-foreground">({new Date(pair.pairCreatedAt).toLocaleDateString()})</span>
            </div>
          </div>
        )}

        {pair.info?.socials?.length > 0 && (
          <div className="border-t border-border pt-4 mt-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Socials</h4>
            <div className="flex flex-wrap gap-2">
              {pair.info.socials.map((s: any, i: number) => (
                <a
                  key={i}
                  href={safeUrl(s.url) || safeUrl(`https://${s.platform}.com/${s.handle}`) || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted/40 text-xs text-foreground hover:bg-muted/60 transition-colors"
                  data-testid={`link-social-${s.platform}`}
                >
                  {s.platform}
                </a>
              ))}
            </div>
          </div>
        )}

        {pair.info?.websites?.length > 0 && (
          <div className="border-t border-border pt-4 mt-4">
            <div className="flex flex-wrap gap-2">
              {pair.info.websites.map((w: any, i: number) => (
                <a
                  key={i}
                  href={safeUrl(w.url) || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted/40 text-xs text-foreground hover:bg-muted/60 transition-colors"
                  data-testid={`link-website-${i}`}
                >
                  <ExternalLink className="w-3 h-3 text-primary" /> Website
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-border pt-3 mt-4">
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span>Base: <span className="font-mono">{base.address?.slice(0, 8)}...{base.address?.slice(-6)}</span></span>
            <span>Pair: <span className="font-mono">{pair.pairAddress?.slice(0, 8)}...{pair.pairAddress?.slice(-6)}</span></span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DexPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedPair, setSelectedPair] = useState<any>(null);
  const [chainFilter, setChainFilter] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"trending" | "new">("trending");
  const [selectedToken, setSelectedToken] = useState<{ chainId: string; tokenAddress: string; name: string; icon?: string } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const handleSearch = useCallback((val: string) => {
    setSearchQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(val.trim()), 400);
  }, []);

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const handleTokenClick = (token: any) => {
    if (!token.chainId || !token.tokenAddress) return;
    setSelectedToken({
      chainId: token.chainId,
      tokenAddress: token.tokenAddress,
      name: token.description?.split(" ").slice(0, 3).join(" ") || "Token",
      icon: token.icon,
    });
    setSelectedPair(null);
    setChainFilter(null);
  };

  const trendingQuery = useQuery({
    queryKey: ["/api/dex/trending"],
    queryFn: async () => {
      const res = await fetch("/api/dex/trending");
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 60000,
    refetchInterval: 60000,
  });

  const profilesQuery = useQuery({
    queryKey: ["/api/dex/profiles"],
    queryFn: async () => {
      const res = await fetch("/api/dex/profiles");
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 60000,
    refetchInterval: 60000,
  });

  const searchResults = useQuery({
    queryKey: ["/api/dex/search", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return { pairs: [] };
      const res = await fetch(`/api/dex/search?q=${encodeURIComponent(debouncedQuery)}`);
      if (!res.ok) return { pairs: [] };
      return res.json();
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 30000,
  });

  const tokenPairsQuery = useQuery({
    queryKey: ["/api/dex/token", selectedToken?.chainId, selectedToken?.tokenAddress],
    queryFn: async () => {
      if (!selectedToken) return [];
      const res = await fetch(`/api/dex/token/${selectedToken.chainId}/${selectedToken.tokenAddress}`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : (data?.pairs || data || []);
    },
    enabled: !!selectedToken,
    staleTime: 30000,
  });

  const isViewingToken = !!selectedToken && debouncedQuery.length < 2;
  const tokenPairs = (tokenPairsQuery.data || []) as any[];

  const pairs = (searchResults.data?.pairs || []) as any[];
  const activePairs = isViewingToken ? tokenPairs : pairs;
  const filteredPairs = chainFilter ? activePairs.filter((p: any) => p.chainId === chainFilter) : activePairs;
  const chainCounts = activePairs.reduce((acc: Record<string, number>, p: any) => {
    acc[p.chainId] = (acc[p.chainId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topChains = Object.entries(chainCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);

  const trending = (trendingQuery.data || []) as any[];
  const profiles = (profilesQuery.data || []) as any[];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <AdBanner slot="0123456789" format="horizontal" className="w-full mb-4" />

        <div className="text-center mb-6">
          <h1 className="font-display text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-cyan-400 to-primary bg-clip-text text-transparent mb-2" data-testid="text-dex-title">
            DEX Screener
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
            Real-time DEX pair analytics across 80+ blockchains. Search tokens, track trending pairs, and analyze liquidity & volume.
          </p>
        </div>

        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by token name, symbol, or contract address..."
            className="pl-12 pr-10 h-12 bg-muted/30 border-primary/30 rounded-xl text-base"
            data-testid="input-dex-search"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(""); setDebouncedQuery(""); setChainFilter(null); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              data-testid="button-clear-dex-search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {isViewingToken && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 glass-panel rounded-xl p-4">
              {selectedToken?.icon && <img src={selectedToken.icon} alt="" className="w-10 h-10 rounded-full" />}
              <div className="flex-1">
                <h2 className="font-display text-lg font-bold text-foreground">{selectedToken?.name}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border ${getChainStyle(selectedToken?.chainId || "")}`}>
                    {selectedToken?.chainId}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {selectedToken?.tokenAddress?.slice(0, 12)}...{selectedToken?.tokenAddress?.slice(-6)}
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setSelectedToken(null); setSelectedPair(null); setChainFilter(null); }}
                className="gap-1"
                data-testid="button-back-to-list"
              >
                <X className="w-4 h-4" /> Back
              </Button>
            </div>

            {tokenPairsQuery.isLoading ? (
              <div className="glass-panel rounded-2xl p-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">Loading pairs...</p>
              </div>
            ) : tokenPairs.length === 0 ? (
              <div className="glass-panel rounded-2xl p-8 text-center text-muted-foreground text-sm">
                No trading pairs found for this token
              </div>
            ) : (
              <>
                {topChains.length > 1 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <Badge
                      variant={chainFilter === null ? "default" : "outline"}
                      className="cursor-pointer text-[11px]"
                      onClick={() => setChainFilter(null)}
                      data-testid="button-token-chain-all"
                    >
                      All ({activePairs.length})
                    </Badge>
                    {topChains.map(([chain, count]) => (
                      <Badge
                        key={chain}
                        variant={chainFilter === chain ? "default" : "outline"}
                        className={`cursor-pointer text-[11px] ${chainFilter !== chain ? getChainStyle(chain) : ""}`}
                        onClick={() => setChainFilter(chainFilter === chain ? null : chain)}
                        data-testid={`button-token-chain-${chain}`}
                      >
                        {chain} ({count})
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="hidden md:block overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/20">
                        <th className="p-3 text-left font-medium">Pair</th>
                        <th className="p-3 text-left font-medium">Chain / DEX</th>
                        <th className="p-3 font-medium text-right">Price</th>
                        <th className="p-3 font-medium text-right">5m</th>
                        <th className="p-3 font-medium text-right">1h</th>
                        <th className="p-3 font-medium text-right">24h</th>
                        <th className="p-3 font-medium text-right">Volume 24h</th>
                        <th className="p-3 font-medium text-right">Liquidity</th>
                        <th className="p-3 font-medium text-right">Txns 24h</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredPairs.slice(0, 50).map((pair: any) => {
                        const pc = pair.priceChange || {};
                        const tx24 = pair.txns?.h24;
                        return (
                          <tr
                            key={`${pair.chainId}-${pair.pairAddress}`}
                            className="hover:bg-muted/20 transition-colors cursor-pointer group"
                            onClick={() => setSelectedPair(selectedPair?.pairAddress === pair.pairAddress && selectedPair?.chainId === pair.chainId ? null : pair)}
                            data-testid={`row-token-pair-${pair.pairAddress}`}
                          >
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                {pair.info?.imageUrl && <img src={pair.info.imageUrl} alt="" className="w-6 h-6 rounded-full" />}
                                <div>
                                  <div className="font-medium text-foreground text-sm group-hover:text-primary transition-colors">
                                    {pair.baseToken?.symbol}<span className="text-muted-foreground font-normal">/{pair.quoteToken?.symbol}</span>
                                  </div>
                                  <div className="text-[10px] text-muted-foreground truncate max-w-[150px]">{pair.baseToken?.name}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border ${getChainStyle(pair.chainId)}`}>
                                {pair.chainId}
                              </Badge>
                              <div className="text-[10px] text-muted-foreground mt-0.5">{pair.dexId}</div>
                            </td>
                            <td className="p-3 text-right font-mono text-sm text-foreground">{formatPrice(pair.priceUsd)}</td>
                            <td className="p-3 text-right"><PctBadge value={pc.m5} /></td>
                            <td className="p-3 text-right"><PctBadge value={pc.h1} /></td>
                            <td className="p-3 text-right"><PctBadge value={pc.h24} /></td>
                            <td className="p-3 text-right font-mono text-xs text-foreground">{formatUsd(pair.volume?.h24)}</td>
                            <td className="p-3 text-right font-mono text-xs text-foreground">{formatUsd(pair.liquidity?.usd)}</td>
                            <td className="p-3 text-right">
                              {tx24 ? (
                                <div className="text-xs">
                                  <span className="font-mono text-green-400">{tx24.buys}</span>
                                  <span className="text-muted-foreground mx-0.5">/</span>
                                  <span className="font-mono text-red-400">{tx24.sells}</span>
                                </div>
                              ) : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="md:hidden space-y-2">
                  {filteredPairs.slice(0, 30).map((pair: any) => {
                    const pc = pair.priceChange || {};
                    return (
                      <div
                        key={`${pair.chainId}-${pair.pairAddress}`}
                        className="glass-panel rounded-xl p-3 hover:bg-muted/20 active:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => setSelectedPair(selectedPair?.pairAddress === pair.pairAddress && selectedPair?.chainId === pair.chainId ? null : pair)}
                        data-testid={`card-token-pair-mobile-${pair.pairAddress}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {pair.info?.imageUrl && <img src={pair.info.imageUrl} alt="" className="w-7 h-7 rounded-full" />}
                            <div>
                              <div className="font-medium text-sm text-foreground">
                                {pair.baseToken?.symbol}<span className="text-muted-foreground font-normal">/{pair.quoteToken?.symbol}</span>
                              </div>
                              <div className="flex items-center gap-1 mt-0.5">
                                <Badge variant="outline" className={`text-[9px] px-1 py-0 border ${getChainStyle(pair.chainId)}`}>
                                  {pair.chainId}
                                </Badge>
                                <span className="text-[9px] text-muted-foreground">{pair.dexId}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono text-sm font-semibold text-foreground">{formatPrice(pair.priceUsd)}</div>
                            <PctBadge value={pc.h24} />
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
                          <span>Vol: {formatUsd(pair.volume?.h24)}</span>
                          <span>Liq: {formatUsd(pair.liquidity?.usd)}</span>
                          {pair.txns?.h24 && (
                            <span>
                              <span className="text-green-400">{pair.txns.h24.buys}B</span>/<span className="text-red-400">{pair.txns.h24.sells}S</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {selectedPair && (
              <PairDetailPanel pair={selectedPair} onClose={() => setSelectedPair(null)} />
            )}
          </div>
        )}

        {debouncedQuery.length >= 2 && !isViewingToken && (
          <div className="space-y-4">
            {topChains.length > 1 && (
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Badge
                  variant={chainFilter === null ? "default" : "outline"}
                  className="cursor-pointer text-[11px]"
                  onClick={() => setChainFilter(null)}
                  data-testid="button-chain-all"
                >
                  All ({pairs.length})
                </Badge>
                {topChains.map(([chain, count]) => (
                  <Badge
                    key={chain}
                    variant={chainFilter === chain ? "default" : "outline"}
                    className={`cursor-pointer text-[11px] ${chainFilter !== chain ? getChainStyle(chain) : ""}`}
                    onClick={() => setChainFilter(chainFilter === chain ? null : chain)}
                    data-testid={`button-chain-${chain}`}
                  >
                    {chain} ({count})
                  </Badge>
                ))}
              </div>
            )}

            {searchResults.isLoading ? (
              <div className="glass-panel rounded-2xl p-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                <span className="text-muted-foreground text-sm">Searching DEX pairs...</span>
              </div>
            ) : filteredPairs.length === 0 ? (
              <div className="glass-panel rounded-2xl p-8 text-center">
                <span className="text-muted-foreground text-sm">No pairs found for "{debouncedQuery}"</span>
              </div>
            ) : (
              <>
                <div className="hidden md:block glass-panel rounded-2xl overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="p-3 font-medium text-left">Token</th>
                        <th className="p-3 font-medium text-left">Chain / DEX</th>
                        <th className="p-3 font-medium text-right">Price</th>
                        <th className="p-3 font-medium text-right">5m</th>
                        <th className="p-3 font-medium text-right">1h</th>
                        <th className="p-3 font-medium text-right">24h</th>
                        <th className="p-3 font-medium text-right">Vol 24h</th>
                        <th className="p-3 font-medium text-right">Liquidity</th>
                        <th className="p-3 font-medium text-right">Txns 24h</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredPairs.slice(0, 50).map((pair: any) => {
                        const pc = pair.priceChange || {};
                        const tx24 = pair.txns?.h24;
                        return (
                          <tr
                            key={`${pair.chainId}-${pair.pairAddress}`}
                            className="hover:bg-muted/20 transition-colors cursor-pointer group"
                            onClick={() => setSelectedPair(selectedPair?.pairAddress === pair.pairAddress && selectedPair?.chainId === pair.chainId ? null : pair)}
                            data-testid={`row-pair-${pair.pairAddress}`}
                          >
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                {pair.info?.imageUrl && <img src={pair.info.imageUrl} alt="" className="w-6 h-6 rounded-full" />}
                                <div>
                                  <div className="font-medium text-foreground text-sm group-hover:text-primary transition-colors">
                                    {pair.baseToken?.symbol}<span className="text-muted-foreground font-normal">/{pair.quoteToken?.symbol}</span>
                                  </div>
                                  <div className="text-[10px] text-muted-foreground truncate max-w-[150px]">{pair.baseToken?.name}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border ${getChainStyle(pair.chainId)}`}>
                                {pair.chainId}
                              </Badge>
                              <div className="text-[10px] text-muted-foreground mt-0.5">{pair.dexId}</div>
                            </td>
                            <td className="p-3 text-right font-mono text-sm text-foreground">{formatPrice(pair.priceUsd)}</td>
                            <td className="p-3 text-right"><PctBadge value={pc.m5} /></td>
                            <td className="p-3 text-right"><PctBadge value={pc.h1} /></td>
                            <td className="p-3 text-right"><PctBadge value={pc.h24} /></td>
                            <td className="p-3 text-right font-mono text-xs text-foreground">{formatUsd(pair.volume?.h24)}</td>
                            <td className="p-3 text-right font-mono text-xs text-foreground">{formatUsd(pair.liquidity?.usd)}</td>
                            <td className="p-3 text-right">
                              {tx24 ? (
                                <div className="text-xs">
                                  <span className="font-mono text-green-400">{tx24.buys}</span>
                                  <span className="text-muted-foreground mx-0.5">/</span>
                                  <span className="font-mono text-red-400">{tx24.sells}</span>
                                </div>
                              ) : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="md:hidden space-y-2">
                  {filteredPairs.slice(0, 30).map((pair: any) => {
                    const pc = pair.priceChange || {};
                    return (
                      <div
                        key={`${pair.chainId}-${pair.pairAddress}`}
                        className="glass-panel rounded-xl p-3 hover:bg-muted/20 active:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => setSelectedPair(selectedPair?.pairAddress === pair.pairAddress && selectedPair?.chainId === pair.chainId ? null : pair)}
                        data-testid={`card-pair-mobile-${pair.pairAddress}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {pair.info?.imageUrl && <img src={pair.info.imageUrl} alt="" className="w-7 h-7 rounded-full" />}
                            <div>
                              <div className="font-medium text-sm text-foreground">
                                {pair.baseToken?.symbol}<span className="text-muted-foreground font-normal">/{pair.quoteToken?.symbol}</span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <Badge variant="outline" className={`text-[9px] px-1 py-0 border ${getChainStyle(pair.chainId)}`}>
                                  {pair.chainId}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground">{pair.dexId}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono text-sm font-semibold text-foreground">{formatPrice(pair.priceUsd)}</div>
                            <PctBadge value={pc.h24} />
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
                          <span>Vol: {formatUsd(pair.volume?.h24)}</span>
                          <span>Liq: {formatUsd(pair.liquidity?.usd)}</span>
                          {pair.txns?.h24 && (
                            <span>
                              <span className="text-green-400">{pair.txns.h24.buys}B</span>/<span className="text-red-400">{pair.txns.h24.sells}S</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {filteredPairs.length > 50 && (
                  <p className="text-center text-xs text-muted-foreground">
                    Showing {Math.min(50, filteredPairs.length)} of {filteredPairs.length} results
                  </p>
                )}
              </>
            )}

            {selectedPair && (
              <PairDetailPanel pair={selectedPair} onClose={() => setSelectedPair(null)} />
            )}
          </div>
        )}

        {debouncedQuery.length < 2 && !isViewingToken && (
          <>
            <div className="flex gap-2 justify-center">
              <Button
                variant={activeTab === "trending" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("trending")}
                className="gap-1.5"
                data-testid="button-tab-trending"
              >
                <Flame className="w-4 h-4" /> Trending Tokens
              </Button>
              <Button
                variant={activeTab === "new" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("new")}
                className="gap-1.5"
                data-testid="button-tab-new"
              >
                <Sparkles className="w-4 h-4" /> New Profiles
              </Button>
            </div>

            {activeTab === "trending" && (
              <div>
                <h2 className="font-display text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-400" /> Top Boosted Tokens
                </h2>
                {trendingQuery.isLoading ? (
                  <div className="glass-panel rounded-2xl p-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                  </div>
                ) : trending.length === 0 ? (
                  <div className="glass-panel rounded-2xl p-8 text-center text-muted-foreground text-sm">
                    No trending tokens available
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {trending.slice(0, 30).map((token: any, i: number) => (
                      <div
                        key={`${token.chainId}-${token.tokenAddress}-${i}`}
                        onClick={() => handleTokenClick(token)}
                        className="glass-panel rounded-xl p-4 hover:bg-muted/20 transition-colors group cursor-pointer"
                        data-testid={`card-trending-${i}`}
                      >
                        <div className="flex items-center gap-3">
                          {token.icon && <img src={token.icon} alt="" className="w-10 h-10 rounded-full" />}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground text-sm group-hover:text-primary transition-colors truncate">
                                {token.description?.split(" ").slice(0, 3).join(" ") || `Token`}
                              </span>
                              {token.totalAmount != null && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-orange-500/30 text-orange-400 bg-orange-500/10 shrink-0">
                                  <Zap className="w-2.5 h-2.5 mr-0.5" />{token.totalAmount}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <Badge variant="outline" className={`text-[9px] px-1 py-0 border ${getChainStyle(token.chainId)}`}>
                                {token.chainId}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground font-mono truncate">
                                {token.tokenAddress?.slice(0, 8)}...{token.tokenAddress?.slice(-4)}
                              </span>
                            </div>
                          </div>
                          <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                        </div>
                        {token.description && (
                          <p className="text-[11px] text-muted-foreground mt-2 line-clamp-2">{token.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "new" && (
              <div>
                <h2 className="font-display text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-cyan-400" /> Latest Token Profiles
                </h2>
                {profilesQuery.isLoading ? (
                  <div className="glass-panel rounded-2xl p-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                  </div>
                ) : profiles.length === 0 ? (
                  <div className="glass-panel rounded-2xl p-8 text-center text-muted-foreground text-sm">
                    No new profiles available
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {profiles.slice(0, 30).map((token: any, i: number) => (
                      <div
                        key={`${token.chainId}-${token.tokenAddress}-${i}`}
                        onClick={() => handleTokenClick(token)}
                        className="glass-panel rounded-xl p-4 hover:bg-muted/20 transition-colors group cursor-pointer"
                        data-testid={`card-profile-${i}`}
                      >
                        <div className="flex items-center gap-3">
                          {token.icon && <img src={token.icon} alt="" className="w-10 h-10 rounded-full" />}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-foreground text-sm group-hover:text-primary transition-colors truncate">
                              {token.description?.split(" ").slice(0, 4).join(" ") || "New Token"}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <Badge variant="outline" className={`text-[9px] px-1 py-0 border ${getChainStyle(token.chainId)}`}>
                                {token.chainId}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground font-mono truncate">
                                {token.tokenAddress?.slice(0, 8)}...{token.tokenAddress?.slice(-4)}
                              </span>
                            </div>
                          </div>
                          <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                        </div>
                        {token.links && token.links.length > 0 && (
                          <div className="flex gap-1.5 mt-2 flex-wrap">
                            {token.links.slice(0, 3).map((link: any, li: number) => (
                              <Badge key={li} variant="outline" className="text-[9px] px-1.5 py-0 border-border text-muted-foreground">
                                {link.label || link.type || "Link"}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {token.description && (
                          <p className="text-[11px] text-muted-foreground mt-2 line-clamp-2">{token.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        <AdBanner slot="0123456789" format="horizontal" className="w-full mt-6" />

        <a
          href="https://www.tradingview.com/pricing/?share_your_love=moneyflowstome78&mobileapp=true"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between gap-3 mt-6 p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 hover:border-cyan-400/40 transition-all group"
          data-testid="banner-tradingview-dex"
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <div>
              <p className="text-sm font-semibold text-foreground">Level Up Your Trading</p>
              <p className="text-xs text-muted-foreground">Get advanced charts, real-time data & 100+ indicators</p>
            </div>
          </div>
          <span className="text-sm font-bold text-cyan-400 group-hover:text-cyan-300 flex items-center gap-1 whitespace-nowrap">
            Try TradingView <ExternalLink className="w-4 h-4" />
          </span>
        </a>
      </div>
      <Footer />
    </div>
  );
}
