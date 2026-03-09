import { useState, useEffect, useRef, useCallback } from "react";
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
  Shield,
  Globe,
  MessageCircle,
  Github,
  ChevronDown,
  ChevronUp,
  Tag,
  Calendar,
  Hash,
  BarChart3,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
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

function formatSupply(num: number, symbol: string): string {
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B ${symbol.toUpperCase()}`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M ${symbol.toUpperCase()}`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K ${symbol.toUpperCase()}`;
  return `${num.toLocaleString()} ${symbol.toUpperCase()}`;
}

function formatPrice(price: number | null | undefined): string {
  if (price == null) return "—";
  if (price < 0.001) return `$${price.toFixed(8)}`;
  if (price < 1) return `$${price.toFixed(6)}`;
  return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function safeUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.protocol === "http:" || u.protocol === "https:") return url;
    return null;
  } catch {
    return null;
  }
}

const CHART_TIMEFRAMES = [
  { key: "7", label: "7d" },
  { key: "30", label: "30d" },
  { key: "90", label: "90d" },
  { key: "365", label: "1y" },
] as const;

function PriceHistoryChart({ coinId }: { coinId: string }) {
  const [days, setDays] = useState("7");

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/coin/market-chart", coinId, days],
    queryFn: async () => {
      const res = await fetch(`/api/coin/${coinId}/market-chart?days=${days}`);
      if (!res.ok) throw new Error("Failed to fetch chart data");
      return res.json();
    },
    staleTime: days === "7" ? 120000 : days === "30" ? 300000 : 600000,
    enabled: !!coinId,
  });

  const prices = data?.prices || [];
  const volumes = data?.volumes || [];

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    if (days === "7") return d.toLocaleDateString(undefined, { weekday: "short", hour: "2-digit", minute: "2-digit" });
    if (days === "30") return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "2-digit" });
  };

  const formatChartPrice = (val: number) => {
    if (val < 0.001) return `$${val.toFixed(8)}`;
    if (val < 1) return `$${val.toFixed(4)}`;
    if (val < 1000) return `$${val.toFixed(2)}`;
    return `$${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  const priceChange = prices.length >= 2 ? prices[prices.length - 1].v - prices[0].v : 0;
  const priceChangePercent = prices.length >= 2 && prices[0].v > 0
    ? ((priceChange / prices[0].v) * 100)
    : 0;
  const isPositive = priceChange >= 0;
  const chartColor = isPositive ? "#22c55e" : "#ef4444";

  return (
    <div data-testid="chart-price-history">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Price History</span>
          {prices.length >= 2 && (
            <span className={`text-xs font-mono font-semibold ${isPositive ? "text-green-400" : "text-red-400"}`}>
              {isPositive ? "+" : ""}{priceChangePercent.toFixed(2)}%
            </span>
          )}
        </div>
        <div className="flex rounded-lg border border-border overflow-hidden">
          {CHART_TIMEFRAMES.map(tf => (
            <button
              key={tf.key}
              onClick={() => setDays(tf.key)}
              className={`px-3 py-1 text-xs font-medium transition-colors ${days === tf.key ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
              data-testid={`button-chart-tf-${tf.label}`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-center py-8 text-sm text-muted-foreground">Unable to load chart data</div>
      ) : prices.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">No chart data available</div>
      ) : (
        <div className="space-y-4">
          <div className="h-[220px]" data-testid="chart-area-price">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={prices} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id={`priceGrad-${coinId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartColor} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis
                  dataKey="t"
                  tickFormatter={formatDate}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={40}
                />
                <YAxis
                  tickFormatter={formatChartPrice}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  width={65}
                  domain={["auto", "auto"]}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  labelFormatter={(ts) => new Date(ts).toLocaleString()}
                  formatter={(value: number) => [formatChartPrice(value), "Price"]}
                />
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke={chartColor}
                  strokeWidth={2}
                  fill={`url(#priceGrad-${coinId})`}
                  dot={false}
                  activeDot={{ r: 4, fill: chartColor }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {volumes.length > 0 && (
            <div>
              <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">Volume</p>
              <div className="h-[80px]" data-testid="chart-bar-volume">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={volumes} margin={{ top: 0, right: 5, bottom: 0, left: 0 }}>
                    <XAxis
                      dataKey="t"
                      tickFormatter={formatDate}
                      tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                      minTickGap={60}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "11px",
                      }}
                      labelFormatter={(ts) => new Date(ts).toLocaleString()}
                      formatter={(value: number) => [formatMarketCap(value), "Volume"]}
                    />
                    <Bar dataKey="v" fill="hsl(var(--primary))" opacity={0.5} radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20" data-testid="banner-tradingview-chart">
        <a href="https://www.tradingview.com/pricing/?share_your_love=moneyflowstome78&mobileapp=true" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-2 group">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-muted-foreground">Want advanced charts & indicators?</span>
          </div>
          <span className="text-xs font-semibold text-cyan-400 group-hover:text-cyan-300 transition-colors flex items-center gap-1">
            Try TradingView <ExternalLink className="w-3 h-3" />
          </span>
        </a>
      </div>
    </div>
  );
}

function CoinDetailPanel({ coin, onClose }: { coin: any; onClose: () => void }) {
  const [showAbout, setShowAbout] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "chart" | "info" | "markets" | "news">("overview");
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveTab("overview");
  }, [coin.id]);

  const { data: fullData, isLoading: fullLoading } = useQuery({
    queryKey: ["/api/coin", coin.id],
    queryFn: async () => {
      const res = await fetch(`/api/coin/${coin.id}`);
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 300000,
    enabled: !!coin.id,
  });

  const tickersQuery = useQuery({
    queryKey: ["/api/coin/tickers", coin.id],
    queryFn: async () => {
      const res = await fetch(`/api/coin/${coin.id}/tickers`);
      if (!res.ok) return { tickers: [] };
      return res.json();
    },
    staleTime: 120000,
    enabled: activeTab === "markets",
  });

  const cmcQuoteQuery = useQuery({
    queryKey: ["/api/cmc/quote", coin.symbol],
    queryFn: async () => {
      const sym = (coin.symbol || "").toUpperCase();
      const res = await fetch(`/api/cmc/quote/${sym}`);
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 300000,
    enabled: !!coin.symbol && (activeTab === "overview" || activeTab === "info"),
    retry: 1,
  });

  const cmcInfoQuery = useQuery({
    queryKey: ["/api/cmc/info", coin.symbol],
    queryFn: async () => {
      const sym = (coin.symbol || "").toUpperCase();
      const res = await fetch(`/api/cmc/info/${sym}`);
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 600000,
    enabled: !!coin.symbol && activeTab === "info",
    retry: 1,
  });

  const newsQuery = useQuery({
    queryKey: ["/api/news/coin", coin.id],
    queryFn: async () => {
      const res = await fetch(`/api/news`);
      if (!res.ok) return [];
      const data = await res.json();
      const raw = data?.articles || data?.Data || data;
      const articles = Array.isArray(raw) ? raw : [];
      const sym = (coin.symbol || "").toUpperCase();
      const name = (coin.name || "").toLowerCase();
      const filtered = articles.filter((a: any) => {
        const title = (a.title || "").toLowerCase();
        const body = (a.body || "").toLowerCase();
        const cats = (a.categories || "").toUpperCase();
        return cats.includes(sym) || title.includes(name) || title.includes(sym.toLowerCase()) || body.includes(name);
      });
      return filtered.slice(0, 10);
    },
    staleTime: 120000,
    enabled: activeTab === "news",
  });

  const d = fullData || coin;
  const change1h = d.price_change_percentage_1h ?? coin.price_change_percentage_1h_in_currency;
  const change24h = d.price_change_percentage_24h ?? coin.price_change_percentage_24h_in_currency ?? coin.price_change_percentage_24h;
  const change7d = d.price_change_percentage_7d ?? coin.price_change_percentage_7d_in_currency;
  const change30d = d.price_change_percentage_30d;
  const priceUp = (change24h || 0) >= 0;
  const price = d.current_price ?? coin.current_price;
  const low24 = d.low_24h ?? coin.low_24h;
  const high24 = d.high_24h ?? coin.high_24h;
  const img = d.image ?? coin.image;

  const lowHighRange = low24 && high24
    ? ((price - low24) / (high24 - low24)) * 100
    : 50;

  const descriptionText = d.description ? d.description.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ") : "";
  const links = d.links || {};
  const hasLinks = links.homepage?.length > 0 || links.whitepaper || links.subreddit_url || links.twitter_screen_name || links.telegram_channel_identifier || links.repos_url?.github?.length > 0 || links.blockchain_site?.length > 0 || links.announcement_url?.length > 0 || links.official_forum_url?.length > 0 || links.chat_url?.length > 0 || links.snapshot_url;

  const tabs = [
    { key: "overview" as const, label: "Overview" },
    { key: "chart" as const, label: "Chart" },
    { key: "info" as const, label: "Info" },
    { key: "markets" as const, label: "Markets" },
    { key: "news" as const, label: "News" },
  ];

  return (
    <Card ref={panelRef} className="glass-panel border-primary/30 mb-4" data-testid={`panel-coin-detail-${coin.id}`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {img && <img src={img} alt="" className="w-10 h-10 rounded-full" />}
            <div>
              <h3 className="font-display font-bold text-lg text-foreground">{d.name || coin.name}</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground uppercase">{d.symbol || coin.symbol}</span>
                {(d.market_cap_rank || coin.market_cap_rank) && <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-muted-foreground/30">#{d.market_cap_rank || coin.market_cap_rank}</Badge>}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1" data-testid="button-close-detail">
            <X className="w-5 h-5" />
          </button>
        </div>

        {fullLoading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <Loader2 className="w-3 h-3 animate-spin" /> Loading detailed info...
          </div>
        )}

        <div className="flex items-baseline gap-3 mb-4">
          <p className="font-mono text-2xl md:text-3xl font-bold text-foreground" data-testid="text-detail-price">
            {formatPrice(price)}
          </p>
          <span className={`text-sm font-mono font-semibold ${priceUp ? "text-green-400" : "text-red-400"}`} data-testid="text-detail-change">
            {priceUp ? "+" : ""}{(change24h || 0).toFixed(2)}%
          </span>
        </div>

        <div className="flex gap-3 mb-5 flex-wrap">
          {[
            { label: "1h", val: change1h },
            { label: "24h", val: change24h },
            { label: "7d", val: change7d },
            { label: "30d", val: change30d },
          ].filter(x => x.val != null).map(({ label, val }) => (
            <div key={label} className="text-center">
              <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
              <p className={`text-xs font-mono font-semibold ${(val || 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                {(val || 0) >= 0 ? "▲" : "▼"} {Math.abs(val || 0).toFixed(2)}%
              </p>
            </div>
          ))}
        </div>

        <div className="flex gap-1 border-b border-border mb-4 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 ${activeTab === tab.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              data-testid={`button-tab-${tab.key}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="space-y-0">
            {low24 && high24 && (
              <div className="mb-5">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">Low / High <span className="text-foreground font-medium ml-1">24h</span></span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-foreground whitespace-nowrap">{formatPrice(low24)}</span>
                  <div className="flex-1 h-2 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 relative overflow-hidden">
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-foreground border-2 border-background shadow-md"
                      style={{ left: `calc(${Math.min(100, Math.max(0, lowHighRange))}% - 6px)` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-foreground whitespace-nowrap">{formatPrice(high24)}</span>
                </div>
              </div>
            )}

            {coin.sparkline_in_7d?.price && (
              <div className="mb-5">
                <p className="text-xs text-muted-foreground mb-2">7d Chart</p>
                <MiniSparkline data={coin.sparkline_in_7d.price} positive={(change7d || 0) >= 0} />
              </div>
            )}

            <div className="border-t border-border pt-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Statistics</h4>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <div className="flex flex-col">
                  <span className="text-[11px] text-muted-foreground">Market Cap</span>
                  <span className="font-mono text-sm font-semibold text-foreground">{(d.market_cap || coin.market_cap) ? formatMarketCap(d.market_cap || coin.market_cap) : "—"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-muted-foreground">Fully Diluted MCap</span>
                  <span className="font-mono text-sm font-semibold text-foreground">{(d.fully_diluted_valuation || coin.fully_diluted_valuation) ? formatMarketCap(d.fully_diluted_valuation || coin.fully_diluted_valuation) : "—"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-muted-foreground">Volume 24h</span>
                  <span className="font-mono text-sm font-semibold text-foreground">{(d.total_volume || coin.total_volume) ? formatMarketCap(d.total_volume || coin.total_volume) : "—"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-muted-foreground">Circulating Supply</span>
                  <span className="font-mono text-sm font-semibold text-foreground">{(d.circulating_supply || coin.circulating_supply) ? formatSupply(d.circulating_supply || coin.circulating_supply, d.symbol || coin.symbol) : "—"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-muted-foreground">Max Supply</span>
                  <span className="font-mono text-sm font-semibold text-foreground">
                    {d.max_supply_infinite ? "∞ Infinite" : (d.max_supply || coin.max_supply) ? formatSupply(d.max_supply || coin.max_supply, d.symbol || coin.symbol) : "—"}
                  </span>
                </div>
                {(d.total_supply || coin.total_supply) && (
                  <div className="flex flex-col">
                    <span className="text-[11px] text-muted-foreground">Total Supply</span>
                    <span className="font-mono text-sm font-semibold text-foreground">{formatSupply(d.total_supply || coin.total_supply, d.symbol || coin.symbol)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-border pt-4 mt-4">
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {(d.ath ?? coin.ath) != null && (
                  <div className="flex flex-col">
                    <span className="text-[11px] text-muted-foreground">All Time High</span>
                    <span className="font-mono text-sm font-semibold text-foreground">{formatPrice(d.ath ?? coin.ath)}</span>
                    {(d.ath_change_percentage ?? coin.ath_change_percentage) != null && (
                      <span className="text-[10px] font-mono text-red-400">{(d.ath_change_percentage ?? coin.ath_change_percentage).toFixed(1)}%</span>
                    )}
                    {d.ath_date && <span className="text-[9px] text-muted-foreground">{new Date(d.ath_date).toLocaleDateString()}</span>}
                  </div>
                )}
                {(d.atl ?? coin.atl) != null && (
                  <div className="flex flex-col">
                    <span className="text-[11px] text-muted-foreground">All Time Low</span>
                    <span className="font-mono text-sm font-semibold text-foreground" data-testid="text-detail-atl">{formatPrice(d.atl ?? coin.atl)}</span>
                    {(d.atl_change_percentage ?? coin.atl_change_percentage) != null && (
                      <span className="text-[10px] font-mono text-green-400" data-testid="text-detail-atl-change">+{(d.atl_change_percentage ?? coin.atl_change_percentage).toFixed(1)}%</span>
                    )}
                    {d.atl_date && <span className="text-[9px] text-muted-foreground">{new Date(d.atl_date).toLocaleDateString()}</span>}
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-[11px] text-muted-foreground">Rank</span>
                  <span className="font-mono text-sm font-semibold text-foreground">#{d.market_cap_rank || coin.market_cap_rank || "—"}</span>
                </div>
                {d.hashing_algorithm && (
                  <div className="flex flex-col">
                    <span className="text-[11px] text-muted-foreground">Algorithm</span>
                    <span className="font-mono text-sm font-semibold text-foreground">{d.hashing_algorithm}</span>
                  </div>
                )}
                {d.genesis_date && (
                  <div className="flex flex-col">
                    <span className="text-[11px] text-muted-foreground">Launch Date</span>
                    <span className="font-mono text-sm font-semibold text-foreground flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(d.genesis_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            {descriptionText && (
              <div className="border-t border-border pt-4 mt-4">
                <button
                  onClick={() => setShowAbout(!showAbout)}
                  className="flex items-center justify-between w-full text-left"
                  data-testid="button-toggle-about"
                >
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">About {d.name || coin.name}</h4>
                  {showAbout ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>
                {showAbout && (
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed" data-testid="text-coin-description">
                    {descriptionText.length > 500 ? descriptionText.substring(0, 500) + "..." : descriptionText}
                  </p>
                )}
              </div>
            )}

            {d.categories && d.categories.length > 0 && (
              <div className="border-t border-border pt-4 mt-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1"><Tag className="w-3 h-3" /> Categories</h4>
                <div className="flex flex-wrap gap-1.5">
                  {d.categories.map((cat: string) => (
                    <Badge key={cat} variant="outline" className="text-[10px] border-primary/30 text-primary">{cat}</Badge>
                  ))}
                </div>
              </div>
            )}

            {(d.sentiment_votes_up_percentage != null || d.watchlist_portfolio_users != null || d.market_cap_change_percentage_24h != null) && (
              <div className="border-t border-border pt-4 mt-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1"><Activity className="w-3 h-3" /> Community Sentiment</h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  {d.sentiment_votes_up_percentage != null && (
                    <div className="flex flex-col">
                      <span className="text-[11px] text-muted-foreground">Sentiment</span>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-2 rounded-full bg-muted/40 overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(100, Math.max(0, d.sentiment_votes_up_percentage))}%` }} />
                        </div>
                        <span className="text-[10px] font-mono text-green-400">{d.sentiment_votes_up_percentage?.toFixed(0)}%</span>
                        <span className="text-[10px] text-muted-foreground">/</span>
                        <span className="text-[10px] font-mono text-red-400">{d.sentiment_votes_down_percentage?.toFixed(0)}%</span>
                      </div>
                    </div>
                  )}
                  {d.watchlist_portfolio_users != null && (
                    <div className="flex flex-col">
                      <span className="text-[11px] text-muted-foreground">Watchlist Users</span>
                      <span className="font-mono text-sm font-semibold text-foreground">{d.watchlist_portfolio_users?.toLocaleString()}</span>
                    </div>
                  )}
                  {d.market_cap_change_percentage_24h != null && (
                    <div className="flex flex-col">
                      <span className="text-[11px] text-muted-foreground">MCap Change 24h</span>
                      <span className={`font-mono text-sm font-semibold ${(d.market_cap_change_percentage_24h || 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {d.market_cap_change_percentage_24h >= 0 ? "+" : ""}{d.market_cap_change_percentage_24h?.toFixed(2)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(() => {
              const changes = [
                { label: "14d", val: d.price_change_percentage_14d },
                { label: "60d", val: d.price_change_percentage_60d },
                { label: "200d", val: d.price_change_percentage_200d },
                { label: "1y", val: d.price_change_percentage_1y },
              ].filter(x => x.val != null);
              if (changes.length === 0) return null;
              return (
                <div className="border-t border-border pt-4 mt-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Extended Price Changes</h4>
                  <div className="flex gap-3 flex-wrap">
                    {changes.map(({ label, val }) => (
                      <div key={label} className="text-center px-3 py-2 rounded-lg bg-muted/30">
                        <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
                        <p className={`text-xs font-mono font-semibold ${(val || 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {(val || 0) >= 0 ? "▲" : "▼"} {Math.abs(val || 0).toFixed(2)}%
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {activeTab === "chart" && (
          <PriceHistoryChart coinId={coin.id} />
        )}

        {activeTab === "info" && (
          <div className="space-y-4">
            {hasLinks && (
              <div className="space-y-3">
                {(links.homepage?.length > 0 || links.whitepaper) && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1"><Globe className="w-3 h-3" /> Official Links</h4>
                    <div className="flex flex-wrap gap-2">
                      {links.homepage?.map((url: string) => {
                        const safe = safeUrl(url);
                        if (!safe) return null;
                        return (
                          <a key={url} href={safe} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/40 text-xs text-foreground hover:bg-muted/60 transition-colors" data-testid="link-homepage">
                            <Globe className="w-3 h-3 text-primary" /> Website
                          </a>
                        );
                      })}
                      {links.whitepaper && safeUrl(links.whitepaper) && (
                        <a href={safeUrl(links.whitepaper)!} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/40 text-xs text-foreground hover:bg-muted/60 transition-colors" data-testid="link-whitepaper">
                          <ExternalLink className="w-3 h-3 text-primary" /> Whitepaper
                        </a>
                      )}
                      {links.announcement_url?.map((url: string) => {
                        const safe = safeUrl(url);
                        if (!safe) return null;
                        let host = "";
                        try { host = new URL(safe).hostname.replace("www.", ""); } catch {}
                        return (
                          <a key={url} href={safe} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/40 text-xs text-foreground hover:bg-muted/60 transition-colors" data-testid="link-announcement">
                            <ExternalLink className="w-3 h-3 text-primary" /> {host || "Announcement"}
                          </a>
                        );
                      })}
                      {links.official_forum_url?.map((url: string) => {
                        const safe = safeUrl(url);
                        if (!safe) return null;
                        let host = "";
                        try { host = new URL(safe).hostname.replace("www.", ""); } catch {}
                        return (
                          <a key={url} href={safe} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/40 text-xs text-foreground hover:bg-muted/60 transition-colors" data-testid="link-forum">
                            <MessageCircle className="w-3 h-3 text-primary" /> {host || "Forum"}
                          </a>
                        );
                      })}
                      {links.chat_url?.map((url: string) => {
                        const safe = safeUrl(url);
                        if (!safe) return null;
                        let host = "";
                        try { host = new URL(safe).hostname.replace("www.", ""); } catch {}
                        return (
                          <a key={url} href={safe} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/40 text-xs text-foreground hover:bg-muted/60 transition-colors" data-testid="link-chat">
                            <MessageCircle className="w-3 h-3 text-primary" /> {host || "Chat"}
                          </a>
                        );
                      })}
                      {links.snapshot_url && safeUrl(links.snapshot_url) && (
                        <a href={safeUrl(links.snapshot_url)!} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/40 text-xs text-foreground hover:bg-muted/60 transition-colors" data-testid="link-snapshot">
                          <ExternalLink className="w-3 h-3 text-primary" /> Governance
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {(links.subreddit_url || links.twitter_screen_name || links.telegram_channel_identifier || links.facebook_username || links.bitcointalk_thread_identifier) && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1"><MessageCircle className="w-3 h-3" /> Socials</h4>
                    <div className="flex flex-wrap gap-2">
                      {links.twitter_screen_name && (
                        <a href={`https://twitter.com/${links.twitter_screen_name}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/40 text-xs text-foreground hover:bg-muted/60 transition-colors" data-testid="link-twitter">
                          <span className="text-primary">𝕏</span> Twitter
                        </a>
                      )}
                      {links.subreddit_url && safeUrl(links.subreddit_url) && (
                        <a href={safeUrl(links.subreddit_url)!} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/40 text-xs text-foreground hover:bg-muted/60 transition-colors" data-testid="link-reddit">
                          <span className="text-orange-500">●</span> Reddit
                        </a>
                      )}
                      {links.telegram_channel_identifier && (
                        <a href={`https://t.me/${links.telegram_channel_identifier}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/40 text-xs text-foreground hover:bg-muted/60 transition-colors" data-testid="link-telegram">
                          <span className="text-blue-400">✈</span> Telegram
                        </a>
                      )}
                      {links.facebook_username && (
                        <a href={`https://facebook.com/${links.facebook_username}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/40 text-xs text-foreground hover:bg-muted/60 transition-colors" data-testid="link-facebook">
                          <span className="text-blue-500">f</span> Facebook
                        </a>
                      )}
                      {links.bitcointalk_thread_identifier && (
                        <a href={`https://bitcointalk.org/index.php?topic=${links.bitcointalk_thread_identifier}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/40 text-xs text-foreground hover:bg-muted/60 transition-colors" data-testid="link-bitcointalk">
                          <span className="text-yellow-500">₿</span> BitcoinTalk
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {links.blockchain_site?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1"><Search className="w-3 h-3" /> Chain Explorers</h4>
                    <div className="flex flex-wrap gap-2">
                      {links.blockchain_site.slice(0, 8).map((url: string) => {
                        const safe = safeUrl(url);
                        if (!safe) return null;
                        let host = "";
                        try { host = new URL(safe).hostname.replace("www.", ""); } catch {}
                        return (
                          <a key={url} href={safe} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/40 text-xs text-foreground hover:bg-muted/60 transition-colors" data-testid={`link-explorer-${host}`}>
                            <ExternalLink className="w-3 h-3 text-primary" /> {host || "Explorer"}
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}

                {(links.repos_url?.github?.length > 0 || links.repos_url?.bitbucket?.length > 0) && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1"><Github className="w-3 h-3" /> Source Code</h4>
                    <div className="flex flex-wrap gap-2">
                      {links.repos_url.github.map((url: string) => {
                        const safe = safeUrl(url);
                        if (!safe) return null;
                        const parts = safe.split("/");
                        const repoName = parts[parts.length - 1] || parts[parts.length - 2] || "GitHub";
                        return (
                          <a key={url} href={safe} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/40 text-xs text-foreground hover:bg-muted/60 transition-colors" data-testid={`link-github-${repoName}`}>
                            <Github className="w-3 h-3 text-primary" /> {repoName}
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1"><ExternalLink className="w-3 h-3" /> Quick Links</h4>
              <div className="flex flex-wrap gap-2">
                <a href={`https://www.coingecko.com/en/coins/${d.id || coin.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/40 text-xs text-foreground hover:bg-muted/60 transition-colors" data-testid="link-coingecko">
                  <ExternalLink className="w-3 h-3 text-green-400" /> CoinGecko
                </a>
                <a href={`https://coinmarketcap.com/currencies/${d.id || coin.id}/`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/40 text-xs text-foreground hover:bg-muted/60 transition-colors" data-testid="link-coinmarketcap">
                  <ExternalLink className="w-3 h-3 text-blue-400" /> CoinMarketCap
                </a>
                <a href="https://www.tradingview.com/pricing/?share_your_love=moneyflowstome78&mobileapp=true" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/40 text-xs text-foreground hover:bg-muted/60 transition-colors" data-testid="link-tradingview">
                  <Activity className="w-3 h-3 text-cyan-400" /> TradingView
                </a>
                <a href={`https://www.google.com/search?q=${encodeURIComponent((d.name || coin.name) + " crypto")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/40 text-xs text-foreground hover:bg-muted/60 transition-colors" data-testid="link-google-search">
                  <Search className="w-3 h-3 text-yellow-400" /> Google
                </a>
                <a href={`https://twitter.com/search?q=${encodeURIComponent("$" + (d.symbol || coin.symbol || "").toUpperCase())}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/40 text-xs text-foreground hover:bg-muted/60 transition-colors" data-testid="link-twitter-search">
                  <span className="text-primary">𝕏</span> Search on X
                </a>
              </div>
            </div>

            {d.platforms && Object.keys(d.platforms).filter(k => d.platforms[k]).length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1"><Hash className="w-3 h-3" /> Contract Addresses</h4>
                <div className="space-y-1.5">
                  {Object.entries(d.platforms).filter(([, addr]) => addr).map(([platform, address]) => (
                    <div key={platform} className="flex items-center gap-2 text-[11px]">
                      <span className="text-muted-foreground capitalize whitespace-nowrap">{platform.replace(/-/g, " ")}:</span>
                      <span className="font-mono text-foreground truncate">{String(address)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {d.developer_data && (d.developer_data.stars || d.developer_data.forks || d.developer_data.commit_count_4_weeks) && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1"><Github className="w-3 h-3" /> Developer Activity</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
                  {d.developer_data.stars != null && <div className="flex flex-col"><span className="text-[11px] text-muted-foreground">GitHub Stars</span><span className="font-mono text-sm font-semibold text-foreground">{d.developer_data.stars?.toLocaleString()}</span></div>}
                  {d.developer_data.forks != null && <div className="flex flex-col"><span className="text-[11px] text-muted-foreground">Forks</span><span className="font-mono text-sm font-semibold text-foreground">{d.developer_data.forks?.toLocaleString()}</span></div>}
                  {d.developer_data.subscribers != null && <div className="flex flex-col"><span className="text-[11px] text-muted-foreground">Watchers</span><span className="font-mono text-sm font-semibold text-foreground">{d.developer_data.subscribers?.toLocaleString()}</span></div>}
                  {d.developer_data.total_issues != null && <div className="flex flex-col"><span className="text-[11px] text-muted-foreground">Issues</span><span className="font-mono text-sm font-semibold text-foreground">{d.developer_data.total_issues?.toLocaleString()}</span></div>}
                  {d.developer_data.pull_requests_merged != null && <div className="flex flex-col"><span className="text-[11px] text-muted-foreground">PRs Merged</span><span className="font-mono text-sm font-semibold text-foreground">{d.developer_data.pull_requests_merged?.toLocaleString()}</span></div>}
                  {d.developer_data.commit_count_4_weeks != null && <div className="flex flex-col"><span className="text-[11px] text-muted-foreground">Commits (4w)</span><span className="font-mono text-sm font-semibold text-foreground">{d.developer_data.commit_count_4_weeks?.toLocaleString()}</span></div>}
                  {d.developer_data.code_additions_deletions_4_weeks && (
                    <div className="flex flex-col col-span-2">
                      <span className="text-[11px] text-muted-foreground">Code Changes (4w)</span>
                      <span className="font-mono text-sm font-semibold text-foreground">
                        <span className="text-green-400">+{d.developer_data.code_additions_deletions_4_weeks.additions?.toLocaleString() || 0}</span>
                        {" / "}
                        <span className="text-red-400">{d.developer_data.code_additions_deletions_4_weeks.deletions?.toLocaleString() || 0}</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {d.community_data && (d.community_data.reddit_subscribers || d.community_data.telegram_channel_user_count || d.community_data.facebook_likes) && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1"><MessageCircle className="w-3 h-3" /> Community Stats</h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  {d.community_data.reddit_subscribers != null && d.community_data.reddit_subscribers > 0 && <div className="flex flex-col"><span className="text-[11px] text-muted-foreground">Reddit Subscribers</span><span className="font-mono text-sm font-semibold text-foreground">{d.community_data.reddit_subscribers?.toLocaleString()}</span></div>}
                  {d.community_data.reddit_accounts_active_48h != null && d.community_data.reddit_accounts_active_48h > 0 && <div className="flex flex-col"><span className="text-[11px] text-muted-foreground">Reddit Active (48h)</span><span className="font-mono text-sm font-semibold text-foreground">{d.community_data.reddit_accounts_active_48h?.toLocaleString()}</span></div>}
                  {d.community_data.telegram_channel_user_count != null && d.community_data.telegram_channel_user_count > 0 && <div className="flex flex-col"><span className="text-[11px] text-muted-foreground">Telegram Members</span><span className="font-mono text-sm font-semibold text-foreground">{d.community_data.telegram_channel_user_count?.toLocaleString()}</span></div>}
                  {d.community_data.facebook_likes != null && d.community_data.facebook_likes > 0 && <div className="flex flex-col"><span className="text-[11px] text-muted-foreground">Facebook Likes</span><span className="font-mono text-sm font-semibold text-foreground">{d.community_data.facebook_likes?.toLocaleString()}</span></div>}
                </div>
              </div>
            )}

            {(d.block_time_in_minutes || d.country_origin || d.asset_platform_id) && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Network Info</h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  {d.block_time_in_minutes != null && d.block_time_in_minutes > 0 && <div className="flex flex-col"><span className="text-[11px] text-muted-foreground">Block Time</span><span className="font-mono text-sm font-semibold text-foreground">{d.block_time_in_minutes} min</span></div>}
                  {d.country_origin && <div className="flex flex-col"><span className="text-[11px] text-muted-foreground">Country</span><span className="font-mono text-sm font-semibold text-foreground">{d.country_origin}</span></div>}
                  {d.asset_platform_id && <div className="flex flex-col"><span className="text-[11px] text-muted-foreground">Platform</span><span className="font-mono text-sm font-semibold text-foreground capitalize">{d.asset_platform_id.replace(/-/g, " ")}</span></div>}
                </div>
              </div>
            )}

            {(d.total_value_locked != null || d.mcap_to_tvl_ratio != null || d.fdv_to_tvl_ratio != null || d.market_cap_fdv_ratio != null || d.roi) && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> DeFi & Valuation</h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  {d.total_value_locked != null && <div className="flex flex-col"><span className="text-[11px] text-muted-foreground">Total Value Locked</span><span className="font-mono text-sm font-semibold text-foreground">{formatMarketCap(d.total_value_locked)}</span></div>}
                  {d.mcap_to_tvl_ratio != null && <div className="flex flex-col"><span className="text-[11px] text-muted-foreground">MCap/TVL</span><span className="font-mono text-sm font-semibold text-foreground">{d.mcap_to_tvl_ratio.toFixed(2)}</span></div>}
                  {d.fdv_to_tvl_ratio != null && <div className="flex flex-col"><span className="text-[11px] text-muted-foreground">FDV/TVL</span><span className="font-mono text-sm font-semibold text-foreground">{d.fdv_to_tvl_ratio.toFixed(2)}</span></div>}
                  {d.market_cap_fdv_ratio != null && <div className="flex flex-col"><span className="text-[11px] text-muted-foreground">MCap/FDV</span><span className="font-mono text-sm font-semibold text-foreground">{(d.market_cap_fdv_ratio * 100).toFixed(1)}%</span></div>}
                  {d.roi && d.roi.percentage != null && (
                    <div className="flex flex-col col-span-2">
                      <span className="text-[11px] text-muted-foreground">ROI (vs {(d.roi.currency || "USD").toUpperCase()})</span>
                      <span className={`font-mono text-sm font-semibold ${(d.roi.percentage || 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {d.roi.percentage >= 0 ? "+" : ""}{d.roi.percentage.toFixed(2)}%{d.roi.times != null ? ` (${d.roi.times.toFixed(2)}x)` : ""}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(() => {
              const cmc = cmcQuoteQuery.data;
              const cmcInfo = cmcInfoQuery.data;
              if (!cmc && !cmcInfo) {
                if (cmcInfoQuery.isLoading || cmcQuoteQuery.isLoading) return (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                    <Loader2 className="w-3 h-3 animate-spin" /> Loading CoinMarketCap data...
                  </div>
                );
                if (cmcInfoQuery.isError && cmcQuoteQuery.isError) return (
                  <div className="text-[11px] text-muted-foreground/60 py-2">CMC data unavailable for this coin</div>
                );
                return null;
              }

              const cmcUrls = cmcInfo?.urls || {};
              function getHost(url: string): string {
                try { return new URL(url).hostname.replace("www.", "").toLowerCase(); } catch { return ""; }
              }
              function dedupLinks(cmcLinks: string[], existingLinks: string[]): string[] {
                const existingHosts = new Set(existingLinks.map(e => getHost(e)).filter(Boolean));
                return (cmcLinks || []).filter((u: string) => {
                  const safe = safeUrl(u);
                  if (!safe) return false;
                  const host = getHost(safe);
                  return host && !existingHosts.has(host);
                });
              }
              const cmcExtraWebsites = dedupLinks(cmcUrls.website || [], links.homepage || []);
              const cmcExtraExplorers = dedupLinks(cmcUrls.explorer || [], links.blockchain_site || []);
              const cmcTechDocs = (cmcUrls.technicalDoc || []).filter((u: string) => safeUrl(u));
              const cmcAnnouncements = dedupLinks(cmcUrls.announcement || [], links.announcement_url || []);
              const cmcChat = dedupLinks(cmcUrls.chat || [], links.chat_url || []);
              const cmcSourceCode = dedupLinks(cmcUrls.sourceCode || [], links.repos_url?.github || []);
              const hasExtraLinks = cmcExtraWebsites.length > 0 || cmcExtraExplorers.length > 0 || cmcTechDocs.length > 0 || cmcAnnouncements.length > 0 || cmcChat.length > 0 || cmcSourceCode.length > 0;

              return (
                <div className="border-t border-border pt-4 space-y-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <ExternalLink className="w-3 h-3" /> CoinMarketCap Data
                  </h4>

                  {cmc && (
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                      {cmc.cmcRank != null && <div className="flex flex-col"><span className="text-[11px] text-muted-foreground">CMC Rank</span><span className="font-mono text-sm font-semibold text-foreground">#{cmc.cmcRank}</span></div>}
                      {cmc.numMarketPairs != null && <div className="flex flex-col"><span className="text-[11px] text-muted-foreground">Market Pairs</span><span className="font-mono text-sm font-semibold text-foreground">{cmc.numMarketPairs?.toLocaleString()}</span></div>}
                      {cmc.marketCapDominance != null && cmc.marketCapDominance > 0 && <div className="flex flex-col"><span className="text-[11px] text-muted-foreground">Market Dominance</span><span className="font-mono text-sm font-semibold text-primary">{cmc.marketCapDominance.toFixed(4)}%</span></div>}
                      {cmc.volumeChange24h != null && <div className="flex flex-col"><span className="text-[11px] text-muted-foreground">Volume Change 24h</span><span className={`font-mono text-sm font-semibold ${(cmc.volumeChange24h || 0) >= 0 ? "text-green-400" : "text-red-400"}`}>{cmc.volumeChange24h >= 0 ? "+" : ""}{cmc.volumeChange24h?.toFixed(2)}%</span></div>}
                      {cmc.percentChange60d != null && <div className="flex flex-col"><span className="text-[11px] text-muted-foreground">Change 60d</span><span className={`font-mono text-sm font-semibold ${(cmc.percentChange60d || 0) >= 0 ? "text-green-400" : "text-red-400"}`}>{cmc.percentChange60d >= 0 ? "+" : ""}{cmc.percentChange60d?.toFixed(2)}%</span></div>}
                      {cmc.percentChange90d != null && <div className="flex flex-col"><span className="text-[11px] text-muted-foreground">Change 90d</span><span className={`font-mono text-sm font-semibold ${(cmc.percentChange90d || 0) >= 0 ? "text-green-400" : "text-red-400"}`}>{cmc.percentChange90d >= 0 ? "+" : ""}{cmc.percentChange90d?.toFixed(2)}%</span></div>}
                      {cmc.dateAdded && <div className="flex flex-col"><span className="text-[11px] text-muted-foreground">Added to CMC</span><span className="font-mono text-sm font-semibold text-foreground">{new Date(cmc.dateAdded).toLocaleDateString()}</span></div>}
                    </div>
                  )}

                  {cmcInfo?.tags && cmcInfo.tags.length > 0 && (
                    <div>
                      <span className="text-[11px] text-muted-foreground block mb-1.5">CMC Tags</span>
                      <div className="flex flex-wrap gap-1.5">
                        {cmcInfo.tags.slice(0, 15).map((tag: string) => (
                          <Badge key={tag} variant="outline" className="text-[10px] border-blue-500/30 text-blue-400">{tag.replace(/-/g, " ")}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {cmcInfo?.platform && (
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                      <div className="flex flex-col"><span className="text-[11px] text-muted-foreground">Platform</span><span className="font-mono text-sm font-semibold text-foreground">{cmcInfo.platform.name} ({cmcInfo.platform.symbol})</span></div>
                      {cmcInfo.platform.tokenAddress && <div className="flex flex-col col-span-2"><span className="text-[11px] text-muted-foreground">Token Address</span><span className="font-mono text-[11px] text-foreground truncate">{cmcInfo.platform.tokenAddress}</span></div>}
                    </div>
                  )}

                  {hasExtraLinks && (
                    <div>
                      <span className="text-[11px] text-muted-foreground block mb-1.5">Additional Links from CMC</span>
                      <div className="flex flex-wrap gap-2">
                        {cmcExtraWebsites.map((url: string) => {
                          const safe = safeUrl(url);
                          if (!safe) return null;
                          let host = ""; try { host = new URL(safe).hostname.replace("www.", ""); } catch {}
                          return <a key={url} href={safe} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-xs text-foreground hover:bg-blue-500/20 transition-colors" data-testid={`link-cmc-web-${host}`}><Globe className="w-3 h-3 text-blue-400" /> {host || "Website"}</a>;
                        })}
                        {cmcTechDocs.map((url: string) => {
                          const safe = safeUrl(url);
                          if (!safe) return null;
                          return <a key={url} href={safe} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-xs text-foreground hover:bg-blue-500/20 transition-colors" data-testid="link-cmc-techdoc"><ExternalLink className="w-3 h-3 text-blue-400" /> Technical Doc</a>;
                        })}
                        {cmcAnnouncements.map((url: string) => {
                          const safe = safeUrl(url);
                          if (!safe) return null;
                          let host = ""; try { host = new URL(safe).hostname.replace("www.", ""); } catch {}
                          return <a key={url} href={safe} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-xs text-foreground hover:bg-blue-500/20 transition-colors" data-testid="link-cmc-announce"><ExternalLink className="w-3 h-3 text-blue-400" /> {host || "Announcement"}</a>;
                        })}
                        {cmcChat.map((url: string) => {
                          const safe = safeUrl(url);
                          if (!safe) return null;
                          let host = ""; try { host = new URL(safe).hostname.replace("www.", ""); } catch {}
                          return <a key={url} href={safe} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-xs text-foreground hover:bg-blue-500/20 transition-colors" data-testid="link-cmc-chat"><MessageCircle className="w-3 h-3 text-blue-400" /> {host || "Chat"}</a>;
                        })}
                        {cmcExtraExplorers.map((url: string) => {
                          const safe = safeUrl(url);
                          if (!safe) return null;
                          let host = ""; try { host = new URL(safe).hostname.replace("www.", ""); } catch {}
                          return <a key={url} href={safe} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-xs text-foreground hover:bg-blue-500/20 transition-colors" data-testid={`link-cmc-explorer-${host}`}><ExternalLink className="w-3 h-3 text-blue-400" /> {host || "Explorer"}</a>;
                        })}
                        {cmcSourceCode.map((url: string) => {
                          const safe = safeUrl(url);
                          if (!safe) return null;
                          const parts = safe.split("/");
                          const repoName = parts[parts.length - 1] || parts[parts.length - 2] || "Source";
                          return <a key={url} href={safe} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-xs text-foreground hover:bg-blue-500/20 transition-colors" data-testid={`link-cmc-source-${repoName}`}><Github className="w-3 h-3 text-blue-400" /> {repoName}</a>;
                        })}
                      </div>
                    </div>
                  )}

                  {cmcInfo?.notice && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                      <p className="text-xs text-yellow-400">{cmcInfo.notice}</p>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {activeTab === "markets" && (
          <div>
            {tickersQuery.isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">Loading markets...</p>
              </div>
            ) : (tickersQuery.data?.tickers || []).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">No market data available</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="pb-2 text-xs font-medium text-muted-foreground">#</th>
                      <th className="pb-2 text-xs font-medium text-muted-foreground">Exchange</th>
                      <th className="pb-2 text-xs font-medium text-muted-foreground">Pair</th>
                      <th className="pb-2 text-xs font-medium text-muted-foreground text-right">Price</th>
                      <th className="pb-2 text-xs font-medium text-muted-foreground text-right">Volume (24h)</th>
                      <th className="pb-2 text-xs font-medium text-muted-foreground text-right">Spread</th>
                      <th className="pb-2 text-xs font-medium text-muted-foreground text-center">Trust</th>
                      <th className="pb-2 text-xs font-medium text-muted-foreground"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {(tickersQuery.data?.tickers || []).map((t: any, i: number) => (
                      <tr key={`${t.exchangeId}-${t.base}-${t.target}-${i}`} className="hover:bg-muted/10">
                        <td className="py-2 text-xs text-muted-foreground">{i + 1}</td>
                        <td className="py-2">
                          <div className="flex items-center gap-2">
                            {t.exchangeLogo && <img src={t.exchangeLogo} alt="" className="w-5 h-5 rounded-full" />}
                            <span className="text-xs font-medium text-foreground">{t.exchange}</span>
                          </div>
                        </td>
                        <td className="py-2">
                          <span className="text-xs font-mono text-foreground">{t.base}/{t.target}</span>
                        </td>
                        <td className="py-2 text-right">
                          <span className="text-xs font-mono text-foreground">${t.convertedLast?.toLocaleString(undefined, { maximumFractionDigits: t.convertedLast < 1 ? 6 : 2 }) || "—"}</span>
                        </td>
                        <td className="py-2 text-right">
                          <span className="text-xs font-mono text-foreground">{t.volume ? formatMarketCap(t.volume) : "—"}</span>
                        </td>
                        <td className="py-2 text-right">
                          <span className="text-xs font-mono text-muted-foreground">{t.spread != null ? `${t.spread.toFixed(2)}%` : "—"}</span>
                        </td>
                        <td className="py-2 text-center">
                          {t.trustScore && (
                            <span className={`inline-block w-2.5 h-2.5 rounded-full ${t.trustScore === "green" ? "bg-green-500" : t.trustScore === "yellow" ? "bg-yellow-500" : "bg-red-500"}`} />
                          )}
                        </td>
                        <td className="py-2">
                          {t.tradeUrl && safeUrl(t.tradeUrl) && (
                            <a href={safeUrl(t.tradeUrl)!} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 transition-colors" data-testid={`link-trade-${i}`}>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "news" && (
          <div>
            {newsQuery.isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">Loading news...</p>
              </div>
            ) : (newsQuery.data || []).length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm mb-2">No recent news found for {d.name || coin.name}</p>
                <a href={`https://www.google.com/search?q=${encodeURIComponent((d.name || coin.name) + " crypto news")}&tbm=nws`} target="_blank" rel="noopener noreferrer" className="text-primary text-xs hover:underline" data-testid="link-google-news">
                  Search Google News →
                </a>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground mb-2">Latest news related to {d.name || coin.name}</p>
                {(newsQuery.data || []).map((article: any, i: number) => (
                  (() => {
                    const articleUrl = safeUrl(article.url);
                    const imgSrc = article.imageUrl || article.imageurl || null;
                    const srcName = article.source || article.source_info?.name || "";
                    const pubTime = article.publishedAt || (article.published_on ? article.published_on * 1000 : null);
                    return (
                      <a
                        key={i}
                        href={articleUrl || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`block p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors ${!articleUrl ? "pointer-events-none" : ""}`}
                        data-testid={`card-news-${i}`}
                      >
                        <div className="flex gap-3">
                          {imgSrc && <img src={imgSrc} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />}
                          <div className="min-w-0 flex-1">
                            <h5 className="text-sm font-medium text-foreground line-clamp-2">{article.title}</h5>
                            <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{article.body?.substring(0, 120)}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              {srcName && <span className="text-[10px] text-primary">{srcName}</span>}
                              {pubTime && <span className="text-[10px] text-muted-foreground">{new Date(pubTime).toLocaleDateString()}</span>}
                            </div>
                          </div>
                        </div>
                      </a>
                    );
                  })()
                ))}
              </div>
            )}
          </div>
        )}

        {d.public_notice && (
          <div className="border-t border-border pt-4 mt-4">
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
              <p className="text-xs text-yellow-400 [&_a]:text-yellow-300 [&_a]:underline" dangerouslySetInnerHTML={{ __html: d.public_notice.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "").replace(/on\w+="[^"]*"/gi, "") }} />
            </div>
          </div>
        )}

        {d.last_updated && (
          <div className="border-t border-border pt-3 mt-4">
            <p className="text-[10px] text-muted-foreground text-right">Last updated: {new Date(d.last_updated).toLocaleString()}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function GainersLosersSection({ onSelectCoin }: { onSelectCoin: (coin: any) => void }) {
  const [tab, setTab] = useState<"gainers" | "losers">("gainers");
  const [timeframe, setTimeframe] = useState<"1h" | "24h" | "7d">("24h");

  const { data, isLoading } = useQuery({
    queryKey: ["/api/prices/gainers-losers"],
    queryFn: async () => {
      const res = await fetch("/api/prices?page=1&per_page=100");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 60000,
    refetchInterval: 120000,
  });

  const getChange = (coin: any) => {
    if (timeframe === "1h") return coin.price_change_percentage_1h_in_currency ?? null;
    if (timeframe === "7d") return coin.price_change_percentage_7d_in_currency ?? null;
    return coin.price_change_percentage_24h_in_currency ?? coin.price_change_percentage_24h ?? null;
  };

  const validCoins = (data || []).filter((c: any) => {
    const ch = getChange(c);
    if (ch == null) return false;
    return tab === "gainers" ? ch > 0 : ch < 0;
  });
  const sorted = [...validCoins].sort((a: any, b: any) => {
    const aVal = getChange(a) || 0;
    const bVal = getChange(b) || 0;
    return tab === "gainers" ? bVal - aVal : aVal - bVal;
  });
  const top10 = sorted.slice(0, 10);

  return (
    <div className="mb-8" data-testid="section-gainers-losers">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="text-sm uppercase tracking-widest text-muted-foreground font-medium flex items-center gap-2">
          {tab === "gainers" ? <ArrowUpRight className="w-4 h-4 text-green-400" /> : <ArrowDownRight className="w-4 h-4 text-red-400" />}
          Top {tab === "gainers" ? "Gainers" : "Losers"} {isLoading && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
        </h2>
        <div className="flex gap-2">
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setTab("gainers")}
              className={`px-3 py-1 text-xs font-medium transition-colors ${tab === "gainers" ? "bg-green-500/20 text-green-400" : "text-muted-foreground hover:text-foreground"}`}
              data-testid="button-gainers"
            >
              Gainers
            </button>
            <button
              onClick={() => setTab("losers")}
              className={`px-3 py-1 text-xs font-medium transition-colors ${tab === "losers" ? "bg-red-500/20 text-red-400" : "text-muted-foreground hover:text-foreground"}`}
              data-testid="button-losers"
            >
              Losers
            </button>
          </div>
          <div className="flex rounded-lg border border-border overflow-hidden">
            {(["1h", "24h", "7d"] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 text-xs font-medium transition-colors ${timeframe === tf ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                data-testid={`button-timeframe-${tf}`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {top10.length === 0 && !isLoading && (
        <div className="glass-panel rounded-xl p-4 text-center text-sm text-muted-foreground">
          No {tab === "gainers" ? "gainers" : "losers"} found for {timeframe} timeframe
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {top10.map((coin: any, i: number) => {
          const change = getChange(coin) || 0;
          const isUp = change >= 0;
          return (
            <div
              key={coin.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectCoin(coin)}
              onKeyDown={(e) => e.key === "Enter" && onSelectCoin(coin)}
              className={`glass-panel rounded-xl p-3 hover:bg-muted/30 transition-colors cursor-pointer border ${isUp ? "border-green-500/20 hover:border-green-500/40" : "border-red-500/20 hover:border-red-500/40"}`}
              data-testid={`card-${tab}-${coin.id}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[10px] font-mono font-bold ${isUp ? "text-green-500/60" : "text-red-500/60"}`}>{i + 1}</span>
                {coin.image && <img src={coin.image} alt="" className="w-6 h-6 rounded-full" />}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground truncate">{coin.name}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">{coin.symbol}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-foreground">{formatPrice(coin.current_price)}</span>
                <span className={`text-xs font-mono font-semibold ${isUp ? "text-green-400" : "text-red-400"}`}>
                  {isUp ? "+" : ""}{change.toFixed(2)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const PRIVACY_COIN_IDS = "monero,zcash,dash,secret,zencash,zcoin,pirate-chain,dero";

function PrivacyCoinsSection({ onSelectCoin }: { onSelectCoin: (coin: any) => void }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/prices/privacy-coins"],
    queryFn: async () => {
      const res = await fetch(`/api/prices/by-ids?ids=${PRIVACY_COIN_IDS}`);
      if (!res.ok) throw new Error("Failed to fetch privacy coins");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 60000,
    refetchInterval: 120000,
    retry: 2,
  });

  if (isLoading) {
    return (
      <div className="mb-8">
        <h2 className="text-sm uppercase tracking-widest text-muted-foreground font-medium mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" /> Privacy Coins
        </h2>
        <div className="glass-panel rounded-xl p-8 text-center">
          <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-8">
        <h2 className="text-sm uppercase tracking-widest text-muted-foreground font-medium mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" /> Privacy Coins
        </h2>
        <div className="glass-panel rounded-xl p-4 text-center text-sm text-muted-foreground">
          Unable to load privacy coin prices right now
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) return null;

  return (
    <div className="mb-8" data-testid="section-privacy-coins">
      <h2 className="text-sm uppercase tracking-widest text-muted-foreground font-medium mb-3 flex items-center gap-2">
        <Shield className="w-4 h-4 text-primary" /> Privacy Coins
      </h2>
      <p className="text-xs text-muted-foreground mb-3">Anonymous & privacy-focused cryptocurrencies</p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {data.map((coin: any) => {
          const change = coin.price_change_percentage_24h || 0;
          const priceUp = change >= 0;
          return (
            <div
              key={coin.id}
              className="glass-panel rounded-xl p-3 hover:bg-muted/30 transition-colors cursor-pointer group"
              onClick={() => onSelectCoin(coin)}
              data-testid={`card-privacy-${coin.id}`}
            >
              <div className="flex items-center gap-2 mb-2">
                {coin.image && <img src={coin.image} alt="" className="w-6 h-6 rounded-full" />}
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium text-foreground truncate block">{coin.name}</span>
                  <span className="text-[10px] text-muted-foreground uppercase">{coin.symbol}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-semibold" data-testid={`text-privacy-price-${coin.id}`}>
                  ${coin.current_price?.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                </span>
                <span className={`text-xs flex items-center gap-0.5 ${priceUp ? "text-green-400" : "text-red-400"}`} data-testid={`text-privacy-change-${coin.id}`}>
                  {priceUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(change).toFixed(2)}%
                </span>
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">
                MCap: {coin.market_cap ? formatMarketCap(coin.market_cap) : "N/A"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const MEME_COIN_IDS = "dogecoin,shiba-inu,pepe,floki,dogwifcoin,bonk,based-brett,turbo,mog-coin,neiro-3";

function MemeCoinsSection({ onSelectCoin }: { onSelectCoin: (coin: any) => void }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/prices/meme-coins"],
    queryFn: async () => {
      const res = await fetch(`/api/prices/by-ids?ids=${MEME_COIN_IDS}`);
      if (!res.ok) throw new Error("Failed to fetch meme coins");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 60000,
    refetchInterval: 120000,
    retry: 2,
  });

  const sectionHeader = (
    <h2 className="text-sm uppercase tracking-widest text-muted-foreground font-medium mb-3 flex items-center gap-2">
      <span className="text-lg">🐸</span> Meme Coins
    </h2>
  );

  if (isLoading) {
    return (
      <div className="mb-8">
        {sectionHeader}
        <div className="glass-panel rounded-xl p-8 text-center">
          <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-8">
        {sectionHeader}
        <div className="glass-panel rounded-xl p-4 text-center text-sm text-muted-foreground">
          Unable to load meme coin prices right now
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) return null;

  return (
    <div className="mb-8" data-testid="section-meme-coins">
      {sectionHeader}
      <p className="text-xs text-muted-foreground mb-3">Community-driven memecoins with live prices</p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {data.map((coin: any) => {
          const change = coin.price_change_percentage_24h || 0;
          const priceUp = change >= 0;
          return (
            <div
              key={coin.id}
              className="glass-panel rounded-xl p-3 hover:bg-muted/30 transition-colors cursor-pointer group"
              onClick={() => onSelectCoin(coin)}
              data-testid={`card-meme-${coin.id}`}
            >
              <div className="flex items-center gap-2 mb-2">
                {coin.image && <img src={coin.image} alt="" className="w-6 h-6 rounded-full" />}
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium text-foreground truncate block">{coin.name}</span>
                  <span className="text-[10px] text-muted-foreground uppercase">{coin.symbol}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-semibold" data-testid={`text-meme-price-${coin.id}`}>
                  ${coin.current_price?.toLocaleString(undefined, { maximumFractionDigits: 8 })}
                </span>
                <span className={`text-xs flex items-center gap-0.5 ${priceUp ? "text-green-400" : "text-red-400"}`} data-testid={`text-meme-change-${coin.id}`}>
                  {priceUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(change).toFixed(2)}%
                </span>
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">
                MCap: {coin.market_cap ? formatMarketCap(coin.market_cap) : "N/A"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PricesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedCoin, setSelectedCoin] = useState<any>(null);
  const { toggleWatchlist, isWatched } = useWatchlist();
  const { toast } = useToast();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const searchQuery = useQuery({
    queryKey: ["/api/search/coins", debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch || debouncedSearch.length < 2) return [];
      const res = await fetch(`/api/search/coins?q=${encodeURIComponent(debouncedSearch)}`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: debouncedSearch.length >= 2,
    staleTime: 300000,
  });

  const handleSearchSelect = useCallback(async (result: any) => {
    setShowSearchResults(false);
    setSearchTerm("");
    try {
      const res = await fetch(`/api/coin/${result.id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedCoin({ ...data, id: result.id, image: data.image || result.large || result.thumb });
      } else {
        setSelectedCoin({ id: result.id, name: result.name, symbol: result.symbol, image: result.large || result.thumb, market_cap_rank: result.market_cap_rank });
      }
    } catch {
      setSelectedCoin({ id: result.id, name: result.name, symbol: result.symbol, image: result.large || result.thumb, market_cap_rank: result.market_cap_rank });
    }
  }, []);

  const pricesQuery = useQuery({
    queryKey: ["/api/prices", page],
    queryFn: async () => {
      const res = await fetch(`/api/prices?page=${page}&per_page=100`);
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
    ? pricesQuery.data
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
          <div className="relative w-full md:w-72" ref={searchRef}>
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10" />
            <Input
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setShowSearchResults(true); }}
              onFocus={() => { if (searchTerm.length >= 2) setShowSearchResults(true); }}
              placeholder="Search any cryptocurrency..."
              className="bg-muted/30 border-border pl-10 h-10 text-sm"
              data-testid="input-search-prices"
            />
            {showSearchResults && searchTerm.length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-1 glass-panel rounded-xl border border-border shadow-xl max-h-80 overflow-y-auto z-50" data-testid="search-results-dropdown">
                {searchQuery.isLoading ? (
                  <div className="p-4 text-center">
                    <Loader2 className="w-4 h-4 animate-spin text-primary mx-auto" />
                  </div>
                ) : searchQuery.data && searchQuery.data.length > 0 ? (
                  searchQuery.data.map((result: any) => (
                    <button
                      key={result.id}
                      onClick={() => handleSearchSelect(result)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40 transition-colors text-left"
                      data-testid={`search-result-${result.id}`}
                    >
                      {(result.thumb || result.large) && <img src={result.large || result.thumb} alt="" className="w-7 h-7 rounded-full" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{result.name}</p>
                        <p className="text-xs text-muted-foreground uppercase">{result.symbol}</p>
                      </div>
                      {result.market_cap_rank && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-muted-foreground/30 shrink-0">#{result.market_cap_rank}</Badge>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">No coins found</div>
                )}
              </div>
            )}
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

        <GainersLosersSection onSelectCoin={(coin) => setSelectedCoin(selectedCoin?.id === coin.id ? null : coin)} />

        <MemeCoinsSection onSelectCoin={(coin) => setSelectedCoin(selectedCoin?.id === coin.id ? null : coin)} />
        <PrivacyCoinsSection onSelectCoin={(coin) => setSelectedCoin(selectedCoin?.id === coin.id ? null : coin)} />

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
              <div className="flex items-center gap-1 flex-wrap justify-center">
                {(() => {
                  const totalPages = 25;
                  const pages: (number | string)[] = [];
                  if (page > 3) pages.push(1);
                  if (page > 4) pages.push("...");
                  for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) pages.push(i);
                  if (page < totalPages - 3) pages.push("...");
                  if (page < totalPages - 2) pages.push(totalPages);
                  return pages.map((p, idx) =>
                    typeof p === "string" ? (
                      <span key={`ellipsis-${idx}`} className="text-muted-foreground text-xs px-1">...</span>
                    ) : (
                      <Button
                        key={p}
                        variant={page === p ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 p-0 text-xs ${page === p ? "" : "bg-muted/30 border-border text-foreground"}`}
                        data-testid={`button-page-${p}`}
                      >
                        {p}
                      </Button>
                    )
                  );
                })()}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= 25}
                className="bg-muted/30 border-border text-foreground"
                data-testid="button-next-page"
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <div className="text-center pb-3">
              <span className="text-xs text-muted-foreground">
                Showing {(page - 1) * 100 + 1} - {page * 100} of 2,500+ coins (Page {page} of 25)
              </span>
            </div>
          </>
        )}

        {selectedCoin && (
          <CoinDetailPanel coin={selectedCoin} onClose={() => setSelectedCoin(null)} />
        )}

        <AdBanner slot="0123456789" format="horizontal" className="w-full mt-6" />
      </div>
      <Footer />
    </div>
  );
}
