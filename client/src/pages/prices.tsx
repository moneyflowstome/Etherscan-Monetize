import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Loader2,
  Search,
  Star,
  ChevronLeft,
  ChevronRight,
  Gauge,
  Activity,
  ExternalLink,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AdBanner } from "@/components/AdBanner";
import { useWatchlist } from "@/hooks/use-watchlist";
import { useToast } from "@/hooks/use-toast";

function formatMarketCap(num: number): string {
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  return `$${num.toLocaleString()}`;
}

function MiniSparkline({ data, positive }: { data: number[]; positive: boolean }) {
  if (!data || data.length === 0) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 80;
  const height = 28;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={width} height={height} className="inline-block">
      <polyline
        points={points}
        fill="none"
        stroke={positive ? "#22c55e" : "#ef4444"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function getFgiColor(value: number): string {
  if (value <= 20) return "#ea3943";
  if (value <= 40) return "#ea8c00";
  if (value <= 60) return "#f5d100";
  if (value <= 80) return "#93d900";
  return "#16c784";
}

function getFgiLabel(value: number): string {
  if (value <= 20) return "Extreme Fear";
  if (value <= 40) return "Fear";
  if (value <= 60) return "Neutral";
  if (value <= 80) return "Greed";
  return "Extreme Greed";
}

function FearGreedGauge({ value, size = 160 }: { value: number; size?: number }) {
  const center = size / 2;
  const radius = (size / 2) - 12;
  const startAngle = 180;
  const endAngle = 0;
  const totalArc = 180;

  const segments = [
    { from: 0, to: 20, color: "#ea3943" },
    { from: 20, to: 40, color: "#ea8c00" },
    { from: 40, to: 60, color: "#f5d100" },
    { from: 60, to: 80, color: "#93d900" },
    { from: 80, to: 100, color: "#16c784" },
  ];

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const arcPath = (startPct: number, endPct: number) => {
    const s = startAngle - (startPct / 100) * totalArc;
    const e = startAngle - (endPct / 100) * totalArc;
    const x1 = center + radius * Math.cos(toRad(s));
    const y1 = center - radius * Math.sin(toRad(s));
    const x2 = center + radius * Math.cos(toRad(e));
    const y2 = center - radius * Math.sin(toRad(e));
    const largeArc = Math.abs(e - s) > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 0 ${x2} ${y2}`;
  };

  const needleAngle = startAngle - (value / 100) * totalArc;
  const needleLen = radius - 20;
  const nx = center + needleLen * Math.cos(toRad(needleAngle));
  const ny = center - needleLen * Math.sin(toRad(needleAngle));

  return (
    <svg width={size} height={size * 0.65} viewBox={`0 0 ${size} ${size * 0.65}`} data-testid="svg-fgi-gauge">
      {segments.map((seg, i) => (
        <path
          key={i}
          d={arcPath(seg.from, seg.to)}
          fill="none"
          stroke={seg.color}
          strokeWidth={10}
          strokeLinecap="round"
          opacity={0.85}
        />
      ))}
      <line
        x1={center}
        y1={center}
        x2={nx}
        y2={ny}
        stroke={getFgiColor(value)}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <circle cx={center} cy={center} r={4} fill={getFgiColor(value)} />
      <text x={center} y={center - 16} textAnchor="middle" className="text-3xl font-bold" fill="currentColor" fontSize={size * 0.2}>
        {value}
      </text>
      <text x={center} y={center + 2} textAnchor="middle" fill={getFgiColor(value)} fontSize={size * 0.07} fontWeight="600">
        {getFgiLabel(value)}
      </text>
    </svg>
  );
}

function FearGreedWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ["fear-greed"],
    queryFn: async () => {
      const res = await fetch("/api/fear-greed");
      if (!res.ok) throw new Error("Failed to fetch Fear & Greed Index");
      return res.json();
    },
    staleTime: 300000,
    retry: 2,
  });

  const current = data?.current;
  const history = data?.history?.slice(0, 7) || [];

  return (
    <Card className="glass-panel border-border" data-testid="card-fear-greed">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Gauge className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground" data-testid="text-fgi-title">Fear & Greed Index</h3>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : current ? (
          <div className="flex flex-col items-center">
            <FearGreedGauge value={current.value} size={180} />
            <div className="w-full mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>7-Day History</span>
              </div>
              <div className="flex gap-1 items-end h-8">
                {history.map((h: any, i: number) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                    <div
                      className="w-full rounded-sm min-h-[4px]"
                      style={{
                        height: `${(h.value / 100) * 28}px`,
                        backgroundColor: getFgiColor(h.value),
                        opacity: i === 0 ? 1 : 0.5 + (1 - i / history.length) * 0.5,
                      }}
                      title={`${h.value} - ${h.classification}`}
                      data-testid={`bar-fgi-history-${i}`}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Today</span>
                <span>7d ago</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground py-4 text-center">Unable to load index</div>
        )}
      </CardContent>
    </Card>
  );
}

function MarketOverview() {
  const { data: prices } = useQuery({
    queryKey: ["prices", 1],
    queryFn: async () => {
      const res = await fetch("/api/prices?page=1&per_page=50");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 60000,
  });

  const totalMcap = prices?.reduce((sum: number, c: any) => sum + (c.market_cap || 0), 0) || 0;
  const totalVol = prices?.reduce((sum: number, c: any) => sum + (c.total_volume || 0), 0) || 0;
  const btc = prices?.find((c: any) => c.id === "bitcoin");
  const eth = prices?.find((c: any) => c.id === "ethereum");

  const btcDom = totalMcap > 0 && btc ? ((btc.market_cap / totalMcap) * 100).toFixed(1) : null;

  return (
    <Card className="glass-panel border-border" data-testid="card-market-overview">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground" data-testid="text-market-overview-title">Market Overview</h3>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Total Market Cap</span>
            <span className="text-sm font-mono font-semibold text-foreground" data-testid="text-total-mcap">{formatMarketCap(totalMcap)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">24h Volume</span>
            <span className="text-sm font-mono font-semibold text-foreground" data-testid="text-total-vol">{formatMarketCap(totalVol)}</span>
          </div>
          {btcDom && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-muted-foreground">BTC Dominance</span>
                <span className="text-sm font-mono font-semibold text-foreground" data-testid="text-btc-dom">{btcDom}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-muted/50 overflow-hidden">
                <div className="h-full rounded-full bg-orange-500" style={{ width: `${btcDom}%` }} />
              </div>
            </div>
          )}
          {btc && (
            <div className="flex justify-between items-center pt-1">
              <div className="flex items-center gap-2">
                <img src={btc.image} alt="BTC" className="w-5 h-5 rounded-full" />
                <span className="text-xs text-muted-foreground">Bitcoin</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-mono font-semibold text-foreground" data-testid="text-btc-price">${btc.current_price?.toLocaleString()}</span>
                <span className={`text-xs ml-2 ${(btc.price_change_percentage_24h || 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {(btc.price_change_percentage_24h || 0) >= 0 ? "+" : ""}{btc.price_change_percentage_24h?.toFixed(2)}%
                </span>
              </div>
            </div>
          )}
          {eth && (
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <img src={eth.image} alt="ETH" className="w-5 h-5 rounded-full" />
                <span className="text-xs text-muted-foreground">Ethereum</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-mono font-semibold text-foreground" data-testid="text-eth-price">${eth.current_price?.toLocaleString()}</span>
                <span className={`text-xs ml-2 ${(eth.price_change_percentage_24h || 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {(eth.price_change_percentage_24h || 0) >= 0 ? "+" : ""}{eth.price_change_percentage_24h?.toFixed(2)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

const COINGECKO_TO_CHAIN: Record<string, string> = {
  bitcoin: "btc", ethereum: "eth", solana: "sol", ripple: "xrp", binancecoin: "bnb",
  dogecoin: "doge", cardano: "ada", tron: "trx", "avalanche-2": "avax", "the-open-network": "ton",
  polkadot: "dot", chainlink: "link", litecoin: "ltc", "shiba-inu": "shib", "bitcoin-cash": "bch",
  nem: "xem", neo: "neo", stellar: "xlm", cosmos: "atom", near: "near",
};

function CoinDetailPanel({ coin, onClose }: { coin: any; onClose: () => void }) {
  const change24h = coin.price_change_percentage_24h_in_currency ?? coin.price_change_percentage_24h;
  const change7d = coin.price_change_percentage_7d_in_currency;
  const priceUp = (change24h || 0) >= 0;

  return (
    <Card className="glass-panel border-primary/30 mb-4" data-testid={`panel-coin-detail-${coin.id}`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <img src={coin.image} alt="" className="w-10 h-10 rounded-full" />
            <div>
              <h3 className="font-display font-bold text-lg text-foreground">{coin.name}</h3>
              <span className="text-xs text-muted-foreground uppercase">{coin.symbol} · #{coin.market_cap_rank}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1" data-testid="button-close-detail">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Price</p>
            <p className="font-mono text-xl font-bold text-foreground" data-testid="text-detail-price">
              ${coin.current_price?.toLocaleString(undefined, { maximumFractionDigits: coin.current_price < 1 ? 6 : 2 })}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">24h Change</p>
            <p className={`font-mono text-xl font-bold ${priceUp ? "text-green-400" : "text-red-400"}`} data-testid="text-detail-change">
              {priceUp ? "+" : ""}{(change24h || 0).toFixed(2)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Market Cap</p>
            <p className="font-mono text-sm font-semibold text-foreground">{coin.market_cap ? formatMarketCap(coin.market_cap) : "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">24h Volume</p>
            <p className="font-mono text-sm font-semibold text-foreground">{coin.total_volume ? formatMarketCap(coin.total_volume) : "—"}</p>
          </div>
          {change7d != null && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">7d Change</p>
              <p className={`font-mono text-sm font-semibold ${change7d >= 0 ? "text-green-400" : "text-red-400"}`}>
                {change7d >= 0 ? "+" : ""}{change7d.toFixed(2)}%
              </p>
            </div>
          )}
          {coin.sparkline_in_7d?.price && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">7d Chart</p>
              <MiniSparkline data={coin.sparkline_in_7d.price} positive={(change7d || 0) >= 0} />
            </div>
          )}
        </div>
        {coin.ath && (
          <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">All-Time High</p>
              <p className="font-mono text-sm text-foreground">${coin.ath?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">From ATH</p>
              <p className="font-mono text-sm text-red-400">{coin.ath_change_percentage?.toFixed(1)}%</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function PricesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [selectedCoin, setSelectedCoin] = useState<any>(null);
  const { toggleWatchlist, isWatched } = useWatchlist();
  const { toast } = useToast();

  const pricesQuery = useQuery({
    queryKey: ["/api/prices", page],
    queryFn: async () => {
      const res = await fetch(`/api/prices?page=${page}&per_page=50`);
      if (!res.ok) throw new Error("Failed to fetch prices");
      return res.json();
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const trendingQuery = useQuery({
    queryKey: ["/api/trending"],
    queryFn: async () => {
      const res = await fetch("/api/trending");
      if (!res.ok) throw new Error("Failed to fetch trending");
      return res.json();
    },
    refetchInterval: 120000,
    staleTime: 60000,
  });

  const coins = pricesQuery.data && Array.isArray(pricesQuery.data)
    ? pricesQuery.data.filter((c: any) =>
        !searchTerm ||
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.symbol.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const trending = trendingQuery.data?.coins?.slice(0, 6) || [];

  return (
    <div className="min-h-screen bg-background">
      <div
        className="h-72 w-full absolute top-0 left-0 z-0 page-glow"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(0,200,255,0.15) 0%, transparent 70%)",
        }}
      />
      <Navbar />

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 pt-8">
        <AdBanner slot="8901234567" format="horizontal" className="w-full mb-6" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground" data-testid="text-page-title">Crypto Prices</h1>
            <p className="text-muted-foreground text-sm mt-1">Live prices for top cryptocurrencies by market cap</p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search coins..."
              className="bg-muted/30 border-border pl-10 h-10 text-sm"
              data-testid="input-search-prices"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <FearGreedWidget />
          <MarketOverview />
        </div>

        {trending.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm uppercase tracking-widest text-muted-foreground font-medium mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Trending
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {trending.map((t: any, i: number) => (
                <div
                  key={i}
                  className="glass-panel rounded-xl p-3 hover:bg-muted/30 transition-colors cursor-pointer"
                  data-testid={`card-trending-${i}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {t.item?.thumb && (
                      <img src={t.item.thumb} alt="" className="w-5 h-5 rounded-full" />
                    )}
                    <span className="text-sm font-medium text-foreground truncate">{t.item?.name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground uppercase">{t.item?.symbol}</div>
                  <div className="text-xs text-primary mt-1">#{t.item?.market_cap_rank || "—"}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedCoin && (
          <CoinDetailPanel coin={selectedCoin} onClose={() => setSelectedCoin(null)} />
        )}

        {pricesQuery.isLoading ? (
          <div className="glass-panel rounded-2xl p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
            <div className="text-muted-foreground">Loading prices...</div>
          </div>
        ) : (
          <>
            <div className="md:hidden space-y-2">
              {coins.map((coin: any, i: number) => {
                const change24h = coin.price_change_percentage_24h_in_currency ?? coin.price_change_percentage_24h;
                const priceUp = (change24h || 0) >= 0;
                return (
                  <div key={coin.id}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedCoin(selectedCoin?.id === coin.id ? null : coin)}
                      onKeyDown={(e) => { if (e.key === "Enter") setSelectedCoin(selectedCoin?.id === coin.id ? null : coin); }}
                      className="w-full text-left glass-panel rounded-xl p-3 hover:bg-muted/20 active:bg-muted/30 transition-colors cursor-pointer"
                      data-testid={`card-price-mobile-${coin.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWatchlist(coin.id);
                            toast({ title: isWatched(coin.id) ? `Removed ${coin.name}` : `Added ${coin.name} to watchlist` });
                          }}
                          className="text-muted-foreground hover:text-yellow-400 transition-colors shrink-0"
                          data-testid={`button-star-mobile-${coin.id}`}
                        >
                          <Star className={`w-4 h-4 ${isWatched(coin.id) ? "text-yellow-400 fill-yellow-400" : ""}`} />
                        </button>
                        <span className="text-xs text-muted-foreground w-6 text-right shrink-0">{coin.market_cap_rank}</span>
                        <img src={coin.image} alt="" className="w-8 h-8 rounded-full shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground text-sm truncate">{coin.name}</span>
                            <span className="text-xs text-muted-foreground uppercase shrink-0">{coin.symbol}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            MCap: {coin.market_cap ? formatMarketCap(coin.market_cap) : "—"}
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <div className="font-mono text-sm font-semibold text-foreground">
                            ${coin.current_price?.toLocaleString(undefined, { maximumFractionDigits: coin.current_price < 1 ? 6 : 2 })}
                          </div>
                          <div className={`text-xs font-mono ${priceUp ? "text-green-400" : "text-red-400"}`}>
                            {priceUp ? "+" : ""}{(change24h || 0).toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    </div>
                    {i === 9 && (
                      <AdBanner slot="9012345678" format="fluid" layout="in-article" className="w-full my-2" />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="hidden md:block glass-panel rounded-2xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="p-4 font-medium w-10"></th>
                    <th className="p-4 font-medium w-12">#</th>
                    <th className="p-4 font-medium">Coin</th>
                    <th className="p-4 font-medium text-right">Price</th>
                    <th className="p-4 font-medium text-right">1h</th>
                    <th className="p-4 font-medium text-right">24h</th>
                    <th className="p-4 font-medium text-right">7d</th>
                    <th className="p-4 font-medium text-right">Market Cap</th>
                    <th className="p-4 font-medium text-right">7d Chart</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {coins.map((coin: any, i: number) => {
                    const change1h = coin.price_change_percentage_1h_in_currency;
                    const change24h = coin.price_change_percentage_24h_in_currency;
                    const change7d = coin.price_change_percentage_7d_in_currency;
                    return (
                      <tr
                        key={coin.id}
                        className="hover:bg-muted/20 transition-colors cursor-pointer group"
                        onClick={() => setSelectedCoin(selectedCoin?.id === coin.id ? null : coin)}
                        data-testid={`row-price-${coin.id}`}
                      >
                        <td className="p-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleWatchlist(coin.id);
                              toast({ title: isWatched(coin.id) ? `Removed ${coin.name}` : `Added ${coin.name} to watchlist` });
                            }}
                            className="text-muted-foreground hover:text-yellow-400 transition-colors"
                            data-testid={`button-star-${coin.id}`}
                          >
                            <Star className={`w-4 h-4 ${isWatched(coin.id) ? "text-yellow-400 fill-yellow-400" : ""}`} />
                          </button>
                        </td>
                        <td className="p-4 text-muted-foreground text-sm">{coin.market_cap_rank}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img src={coin.image} alt="" className="w-7 h-7 rounded-full" />
                            <div>
                              <div className="font-medium text-foreground text-sm group-hover:text-primary transition-colors">{coin.name}</div>
                              <div className="text-xs text-muted-foreground uppercase">{coin.symbol}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-right font-mono text-sm text-foreground">
                          ${coin.current_price?.toLocaleString(undefined, { maximumFractionDigits: coin.current_price < 1 ? 6 : 2 })}
                        </td>
                        <td className={`p-4 text-right text-sm font-mono ${(change1h || 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {change1h != null ? `${change1h >= 0 ? "+" : ""}${change1h.toFixed(2)}%` : "—"}
                        </td>
                        <td className={`p-4 text-right text-sm font-mono ${(change24h || 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {change24h != null ? `${change24h >= 0 ? "+" : ""}${change24h.toFixed(2)}%` : "—"}
                        </td>
                        <td className={`p-4 text-right text-sm font-mono ${(change7d || 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {change7d != null ? `${change7d >= 0 ? "+" : ""}${change7d.toFixed(2)}%` : "—"}
                        </td>
                        <td className="p-4 text-right text-sm font-mono text-foreground">
                          {coin.market_cap ? formatMarketCap(coin.market_cap) : "—"}
                        </td>
                        <td className="p-4 text-right">
                          {coin.sparkline_in_7d?.price && (
                            <MiniSparkline data={coin.sparkline_in_7d.price} positive={(change7d || 0) >= 0} />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between p-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="bg-muted/30 border-border text-foreground"
                data-testid="button-prev-page"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </Button>
              <span className="text-sm text-muted-foreground">Page {page}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                className="bg-muted/30 border-border text-foreground"
                data-testid="button-next-page"
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </>
        )}

        <AdBanner slot="0123456789" format="horizontal" className="w-full mt-6" />
      </div>
      <Footer />
    </div>
  );
}
