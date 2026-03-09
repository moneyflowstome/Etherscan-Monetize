import { useState, useMemo } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AdBanner } from "@/components/AdBanner";
import {
  Loader2,
  ArrowRight,
  TrendingUp,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  RefreshCw,
  Search,
  ArrowUpDown,
  DollarSign,
  BarChart3,
  Shield,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const COIN_META: Record<string, { symbol: string; name: string; image: string }> = {
  bitcoin: { symbol: "BTC", name: "Bitcoin", image: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png" },
  ethereum: { symbol: "ETH", name: "Ethereum", image: "https://assets.coingecko.com/coins/images/279/small/ethereum.png" },
  solana: { symbol: "SOL", name: "Solana", image: "https://assets.coingecko.com/coins/images/4128/small/solana.png" },
  ripple: { symbol: "XRP", name: "XRP", image: "https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png" },
  binancecoin: { symbol: "BNB", name: "BNB", image: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png" },
  dogecoin: { symbol: "DOGE", name: "Dogecoin", image: "https://assets.coingecko.com/coins/images/5/small/dogecoin.png" },
  cardano: { symbol: "ADA", name: "Cardano", image: "https://assets.coingecko.com/coins/images/975/small/cardano.png" },
  polkadot: { symbol: "DOT", name: "Polkadot", image: "https://assets.coingecko.com/coins/images/12171/small/polkadot.png" },
  "avalanche-2": { symbol: "AVAX", name: "Avalanche", image: "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png" },
  chainlink: { symbol: "LINK", name: "Chainlink", image: "https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png" },
  tron: { symbol: "TRX", name: "TRON", image: "https://assets.coingecko.com/coins/images/1094/small/tron-logo.png" },
  litecoin: { symbol: "LTC", name: "Litecoin", image: "https://assets.coingecko.com/coins/images/2/small/litecoin.png" },
};

type SortField = "spread" | "volume" | "name";

function formatUsd(value: number): string {
  if (value >= 1000) return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (value >= 1) return `$${value.toFixed(4)}`;
  return `$${value.toFixed(6)}`;
}

function formatVolume(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function TrustBadge({ score }: { score: string | null }) {
  if (score === "green") return <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-400 border-green-500/20">Trusted</Badge>;
  if (score === "yellow") return <Badge variant="outline" className="text-[10px] bg-yellow-500/10 text-yellow-400 border-yellow-500/20">Caution</Badge>;
  return <Badge variant="outline" className="text-[10px] bg-muted/30 text-muted-foreground border-border">Unknown</Badge>;
}

function ExchangeRow({ ex, rank }: { ex: any; rank: number }) {
  return (
    <div className="flex items-center justify-between py-2.5 px-3 hover:bg-muted/20 transition-colors rounded-lg" data-testid={`exchange-row-${rank}`}>
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span className="text-xs text-muted-foreground w-5 text-right shrink-0">{rank}</span>
        {ex.exchangeLogo ? (
          <img src={ex.exchangeLogo} alt={ex.exchange} className="w-5 h-5 rounded-full shrink-0" />
        ) : (
          <div className="w-5 h-5 rounded-full bg-muted/30 shrink-0" />
        )}
        <span className="text-sm text-foreground truncate">{ex.exchange}</span>
        <TrustBadge score={ex.trustScore} />
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <span className="text-sm font-mono text-foreground">{formatUsd(ex.price)}</span>
        <span className="text-xs text-muted-foreground hidden md:block w-20 text-right">{formatVolume(ex.volume)}</span>
        {ex.spread != null && (
          <span className="text-xs text-muted-foreground hidden md:block w-16 text-right">{ex.spread.toFixed(2)}%</span>
        )}
        {ex.tradeUrl && (
          <a
            href={ex.tradeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}

function ArbitrageCard({ opp, index }: { opp: any; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const meta = COIN_META[opp.coinId] || { symbol: opp.coinId.toUpperCase(), name: opp.coinId, image: "" };
  const profit1k = (1000 * opp.spreadPct) / 100;
  const isHighSpread = opp.spreadPct >= 1;

  return (
    <div
      className={`glass-panel rounded-xl overflow-hidden transition-all ${isHighSpread ? "border-primary/30" : "border-border"}`}
      data-testid={`card-arbitrage-${opp.coinId}`}
    >
      <div className="p-4 md:p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              {meta.image && <img src={meta.image} alt={meta.name} className="w-10 h-10 rounded-full" />}
              <span className="absolute -top-1 -right-1 text-[10px] bg-card border border-border rounded-full w-5 h-5 flex items-center justify-center text-muted-foreground font-bold">
                {index + 1}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                {meta.symbol}
              </h3>
              <p className="text-xs text-muted-foreground">{meta.name}</p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-xl font-bold ${opp.spreadPct >= 1 ? "text-green-400" : opp.spreadPct >= 0.3 ? "text-yellow-400" : "text-muted-foreground"}`} style={{ fontFamily: "'Orbitron', sans-serif" }} data-testid={`text-spread-${opp.coinId}`}>
              {opp.spreadPct.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">spread</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-center mb-4">
          <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-[10px] text-green-400 uppercase tracking-widest font-medium">Buy Low</span>
            </div>
            <div className="flex items-center gap-2">
              {opp.lowestExchangeLogo && <img src={opp.lowestExchangeLogo} alt="" className="w-4 h-4 rounded-full" />}
              <span className="text-sm text-foreground font-medium truncate">{opp.lowestExchange}</span>
            </div>
            <div className="text-lg font-mono font-bold text-green-400 mt-1">{formatUsd(opp.lowestPrice)}</div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] text-muted-foreground">Vol: {formatVolume(opp.lowestVolume)}</span>
              {opp.lowestTradeUrl && (
                <a href={opp.lowestTradeUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-green-400 hover:text-green-300 flex items-center gap-0.5">
                  Trade <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
          </div>

          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
              <ArrowRight className="w-4 h-4 text-primary" />
            </div>
          </div>

          <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-orange-400" />
              <span className="text-[10px] text-orange-400 uppercase tracking-widest font-medium">Sell High</span>
            </div>
            <div className="flex items-center gap-2">
              {opp.highestExchangeLogo && <img src={opp.highestExchangeLogo} alt="" className="w-4 h-4 rounded-full" />}
              <span className="text-sm text-foreground font-medium truncate">{opp.highestExchange}</span>
            </div>
            <div className="text-lg font-mono font-bold text-orange-400 mt-1">{formatUsd(opp.highestPrice)}</div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] text-muted-foreground">Vol: {formatVolume(opp.highestVolume)}</span>
              {opp.highestTradeUrl && (
                <a href={opp.highestTradeUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-orange-400 hover:text-orange-300 flex items-center gap-0.5">
                  Trade <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              ~${profit1k.toFixed(2)} per $1K
            </span>
            <span className="flex items-center gap-1">
              <BarChart3 className="w-3 h-3" />
              {opp.exchangeCount} exchanges
            </span>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
            data-testid={`button-expand-${opp.coinId}`}
          >
            {expanded ? "Hide" : "All prices"}
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {expanded && opp.allExchanges?.length > 0 && (
        <div className="border-t border-border bg-card/30 px-2 py-2">
          <div className="flex items-center justify-between px-3 py-1.5 mb-1">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Exchange</span>
            <div className="flex items-center gap-4 text-[10px] text-muted-foreground uppercase tracking-widest">
              <span>Price</span>
              <span className="hidden md:block w-20 text-right">Volume</span>
              <span className="hidden md:block w-16 text-right">Spread</span>
              <span className="w-4" />
            </div>
          </div>
          {opp.allExchanges
            .sort((a: any, b: any) => a.price - b.price)
            .map((ex: any, i: number) => (
              <ExchangeRow key={`${ex.exchange}-${i}`} ex={ex} rank={i + 1} />
            ))}
        </div>
      )}
    </div>
  );
}

export default function ArbitragePage() {
  const [sortField, setSortField] = useState<SortField>("spread");
  const [searchTerm, setSearchTerm] = useState("");

  const arbQuery = useQuery({
    queryKey: ["arbitrage-data"],
    queryFn: async () => {
      const res = await fetch("/api/arbitrage");
      if (!res.ok) throw new Error("Failed to fetch arbitrage data");
      const data = await res.json();
      if (data?.error) throw new Error(data.error);
      return data;
    },
    staleTime: 60000,
    refetchInterval: 120000,
    retry: 2,
    retryDelay: 5000,
    placeholderData: keepPreviousData,
  });

  const opportunities = arbQuery.data?.opportunities || [];
  const dataTimestamp = arbQuery.data?.timestamp;

  const filteredAndSorted = useMemo(() => {
    let filtered = opportunities;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = opportunities.filter((o: any) => {
        const meta = COIN_META[o.coinId];
        return (
          o.coinId.includes(term) ||
          meta?.symbol.toLowerCase().includes(term) ||
          meta?.name.toLowerCase().includes(term) ||
          o.lowestExchange.toLowerCase().includes(term) ||
          o.highestExchange.toLowerCase().includes(term)
        );
      });
    }
    return [...filtered].sort((a: any, b: any) => {
      if (sortField === "spread") return b.spreadPct - a.spreadPct;
      if (sortField === "volume") return (b.lowestVolume + b.highestVolume) - (a.lowestVolume + a.highestVolume);
      const nameA = COIN_META[a.coinId]?.name || a.coinId;
      const nameB = COIN_META[b.coinId]?.name || b.coinId;
      return nameA.localeCompare(nameB);
    });
  }, [opportunities, sortField, searchTerm]);

  const avgSpread = opportunities.length > 0
    ? opportunities.reduce((sum: number, o: any) => sum + o.spreadPct, 0) / opportunities.length
    : 0;
  const highOpps = opportunities.filter((o: any) => o.spreadPct >= 1).length;
  const totalExchanges = new Set(
    opportunities.flatMap((o: any) => (o.allExchanges || []).map((e: any) => e.exchange))
  ).size;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <AdBanner slot="0123456789" format="horizontal" className="w-full mb-4" />

        <div className="mb-6">
          <h1
            className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
            data-testid="heading-arbitrage"
          >
            <TrendingUp className="w-8 h-8 text-primary" />
            Crypto Arbitrage Scanner
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Find price differences across exchanges. Buy low, sell high.
          </p>
        </div>

        <div className="glass-panel rounded-xl p-4 mb-6 flex items-start gap-3" data-testid="arbitrage-disclaimer">
          <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground">
            <span className="text-yellow-400 font-medium">Disclaimer:</span> Arbitrage opportunities shown are based on real-time exchange data but may not account for withdrawal fees, network fees, transfer times, or slippage. Always verify prices before trading. This is not financial advice.
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="glass-panel rounded-xl p-4 text-center" data-testid="stat-total-coins">
            <div className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              {opportunities.length}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Coins Tracked</div>
          </div>
          <div className="glass-panel rounded-xl p-4 text-center" data-testid="stat-high-opps">
            <div className="text-2xl font-bold text-green-400" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              {highOpps}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">High Spread (1%+)</div>
          </div>
          <div className="glass-panel rounded-xl p-4 text-center" data-testid="stat-avg-spread">
            <div className="text-2xl font-bold text-primary" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              {avgSpread.toFixed(2)}%
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Avg Spread</div>
          </div>
          <div className="glass-panel rounded-xl p-4 text-center" data-testid="stat-exchanges">
            <div className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              {totalExchanges}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Exchanges</div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by coin or exchange..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-card/50 border border-border rounded-lg pl-9 pr-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary"
              data-testid="input-search-arbitrage"
            />
          </div>
          <div className="flex items-center gap-2">
            {(["spread", "volume", "name"] as SortField[]).map((field) => (
              <button
                key={field}
                onClick={() => setSortField(field)}
                className={`px-3 py-2 text-xs rounded-lg border transition-all ${
                  sortField === field
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-card/50 border-border text-muted-foreground hover:border-primary/20 hover:text-foreground"
                }`}
                data-testid={`button-sort-${field}`}
              >
                <ArrowUpDown className="w-3 h-3 inline mr-1" />
                {field === "spread" ? "Spread" : field === "volume" ? "Volume" : "Name"}
              </button>
            ))}
            <button
              onClick={() => arbQuery.refetch()}
              disabled={arbQuery.isFetching}
              className="px-3 py-2 text-xs rounded-lg border border-border bg-card/50 text-muted-foreground hover:border-primary/20 hover:text-foreground transition-all disabled:opacity-50"
              data-testid="button-refresh-arbitrage"
            >
              <RefreshCw className={`w-3 h-3 inline mr-1 ${arbQuery.isFetching ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {dataTimestamp && (
          <div className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
            <RefreshCw className="w-3 h-3" />
            Updated {new Date(dataTimestamp).toLocaleTimeString()}
            {arbQuery.isFetching && <Loader2 className="w-3 h-3 animate-spin ml-1 text-primary" />}
          </div>
        )}

        {arbQuery.isLoading && opportunities.length === 0 ? (
          <div className="glass-panel rounded-xl p-16 text-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Scanning exchanges for arbitrage opportunities...</p>
            <p className="text-xs text-muted-foreground mt-1">This may take a moment on first load</p>
          </div>
        ) : arbQuery.isError && opportunities.length === 0 ? (
          <div className="glass-panel rounded-xl p-16 text-center">
            <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-4" />
            <p className="text-red-400 mb-2">Failed to load arbitrage data</p>
            <button
              onClick={() => arbQuery.refetch()}
              className="text-sm text-primary hover:underline"
            >
              Try again
            </button>
          </div>
        ) : filteredAndSorted.length === 0 ? (
          <div className="glass-panel rounded-xl p-16 text-center">
            <Search className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No opportunities match your search</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAndSorted.map((opp: any, i: number) => (
              <ArbitrageCard key={opp.coinId} opp={opp} index={i} />
            ))}
          </div>
        )}

        <div className="mt-8 glass-panel rounded-xl p-5" data-testid="arbitrage-info">
          <h3 className="text-sm uppercase tracking-widest text-muted-foreground font-medium mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            How Crypto Arbitrage Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted-foreground">
            <div className="space-y-2">
              <div className="font-medium text-foreground">1. Spot the Opportunity</div>
              <p>Price differences occur because exchanges operate independently with different supply/demand dynamics and liquidity pools.</p>
            </div>
            <div className="space-y-2">
              <div className="font-medium text-foreground">2. Execute the Trade</div>
              <p>Buy the asset on the exchange where it's cheapest, then sell on the exchange where it's most expensive.</p>
            </div>
            <div className="space-y-2">
              <div className="font-medium text-foreground">3. Consider the Costs</div>
              <p>Factor in trading fees (0.1-0.5%), withdrawal fees, network gas fees, and transfer time. The spread must exceed total costs to profit.</p>
            </div>
          </div>
        </div>

        <AdBanner slot="0123456789" format="horizontal" className="w-full mt-6" />
      </div>
      <Footer />
    </div>
  );
}
