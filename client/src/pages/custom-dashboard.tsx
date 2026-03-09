import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  LayoutDashboard,
  Settings2,
  GripVertical,
  Eye,
  EyeOff,
  TrendingUp,
  TrendingDown,
  Bell,
  BellRing,
  Briefcase,
  Star,
  Newspaper,
  BarChart3,
  Activity,
  X,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AdBanner } from "@/components/AdBanner";

interface WidgetConfig {
  id: string;
  label: string;
  visible: boolean;
}

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: "market-overview", label: "Market Overview", visible: true },
  { id: "fear-greed", label: "Fear & Greed Index", visible: true },
  { id: "portfolio-summary", label: "Portfolio Summary", visible: true },
  { id: "price-alerts", label: "Price Alerts", visible: true },
  { id: "watchlist", label: "Watchlist", visible: true },
  { id: "trending", label: "Trending Coins", visible: true },
  { id: "news", label: "News Headlines", visible: true },
];

const STORAGE_KEY = "tokenaltcoin_dashboard_widgets";

function loadWidgets(): WidgetConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as WidgetConfig[];
      const savedIds = new Set(saved.map((w) => w.id));
      const merged = [...saved];
      DEFAULT_WIDGETS.forEach((dw) => {
        if (!savedIds.has(dw.id)) merged.push(dw);
      });
      return merged;
    }
  } catch {}
  return DEFAULT_WIDGETS;
}

function formatMarketCap(num: number): string {
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  return `$${num.toLocaleString()}`;
}

function MarketOverviewWidget() {
  const { data: prices } = useQuery({
    queryKey: ["dashboard-prices"],
    queryFn: () => fetch("/api/prices?per_page=10&page=1").then((r) => r.json()),
    refetchInterval: 60000,
  });

  const priceList = Array.isArray(prices) ? prices : [];
  const btc = priceList.find((c: any) => c.id === "bitcoin");
  const eth = priceList.find((c: any) => c.id === "ethereum");

  const totalMarketCap = priceList.reduce((sum: number, c: any) => sum + (c.market_cap || 0), 0);
  const totalVolume = priceList.reduce((sum: number, c: any) => sum + (c.total_volume || 0), 0);

  return (
    <Card className="glass-panel border-primary/30" data-testid="widget-market-overview">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-primary" />
          <h3 className="font-display font-bold text-sm">Market Overview</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {btc && (
            <div>
              <p className="text-[10px] text-muted-foreground">Bitcoin</p>
              <p className="font-mono text-sm font-bold">${btc.current_price?.toLocaleString()}</p>
              <p className={`text-[10px] font-mono ${(btc.price_change_percentage_24h || 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                {(btc.price_change_percentage_24h || 0) >= 0 ? "+" : ""}{btc.price_change_percentage_24h?.toFixed(2)}%
              </p>
            </div>
          )}
          {eth && (
            <div>
              <p className="text-[10px] text-muted-foreground">Ethereum</p>
              <p className="font-mono text-sm font-bold">${eth.current_price?.toLocaleString()}</p>
              <p className={`text-[10px] font-mono ${(eth.price_change_percentage_24h || 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                {(eth.price_change_percentage_24h || 0) >= 0 ? "+" : ""}{eth.price_change_percentage_24h?.toFixed(2)}%
              </p>
            </div>
          )}
          <div>
            <p className="text-[10px] text-muted-foreground">Total Market Cap</p>
            <p className="font-mono text-sm font-semibold">{formatMarketCap(totalMarketCap)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">24h Volume</p>
            <p className="font-mono text-sm font-semibold">{formatMarketCap(totalVolume)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FearGreedWidget() {
  const { data } = useQuery({
    queryKey: ["dashboard-fgi"],
    queryFn: () => fetch("/api/fear-greed").then((r) => r.json()),
    refetchInterval: 600000,
  });

  const current = data?.data?.[0];
  if (!current) return null;

  const value = parseInt(current.value);
  const label = current.value_classification;
  const color = value <= 25 ? "text-red-500" : value <= 45 ? "text-orange-400" : value <= 55 ? "text-yellow-400" : value <= 75 ? "text-lime-400" : "text-green-500";

  return (
    <Card className="glass-panel border-primary/30" data-testid="widget-fear-greed">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-primary" />
          <h3 className="font-display font-bold text-sm">Fear & Greed Index</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className={`text-4xl font-mono font-bold ${color}`}>{value}</div>
          <div>
            <p className={`text-sm font-semibold ${color}`}>{label}</p>
            <div className="w-32 h-2 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 mt-1 relative">
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-foreground border-2 border-background"
                style={{ left: `calc(${value}% - 6px)` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PortfolioSummaryWidget() {
  const [, navigate] = useLocation();
  const [holdings, setHoldings] = useState<any[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("tokenaltcoin_portfolio");
      if (raw) setHoldings(JSON.parse(raw));
    } catch {}
  }, []);

  const coinIds = holdings.map((h) => h.coinId).join(",");
  const { data: prices } = useQuery({
    queryKey: ["dashboard-portfolio-prices", coinIds],
    queryFn: () => fetch(`/api/prices/by-ids?ids=${coinIds}`).then((r) => r.json()),
    enabled: !!coinIds,
    refetchInterval: 60000,
  });

  const priceMap = useMemo(() => {
    const map: Record<string, number> = {};
    if (Array.isArray(prices)) prices.forEach((c: any) => { map[c.id] = c.current_price; });
    return map;
  }, [prices]);

  const totalValue = holdings.reduce((sum, h) => sum + (priceMap[h.coinId] || 0) * h.quantity, 0);
  const totalCost = holdings.reduce((sum, h) => sum + h.purchasePrice * h.quantity, 0);
  const pnl = totalValue - totalCost;
  const pnlPct = totalCost > 0 ? (pnl / totalCost) * 100 : 0;

  return (
    <Card className="glass-panel border-primary/30" data-testid="widget-portfolio-summary">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-primary" />
            <h3 className="font-display font-bold text-sm">Portfolio</h3>
          </div>
          <Button variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={() => navigate("/portfolio")} data-testid="button-view-portfolio">
            View <ExternalLink className="w-3 h-3 ml-1" />
          </Button>
        </div>
        {holdings.length === 0 ? (
          <p className="text-xs text-muted-foreground">No holdings yet. <span className="text-primary cursor-pointer" onClick={() => navigate("/portfolio")}>Add some</span></p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-[10px] text-muted-foreground">Total Value</p>
              <p className="font-mono text-sm font-bold">${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">P&L</p>
              <p className={`font-mono text-sm font-bold ${pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                {pnl >= 0 ? "+" : ""}${Math.abs(pnl).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Return</p>
              <p className={`font-mono text-sm font-bold ${pnlPct >= 0 ? "text-green-400" : "text-red-400"}`}>
                {pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PriceAlertsWidget() {
  const [, navigate] = useLocation();
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("tokenaltcoin_price_alerts");
      if (raw) setAlerts(JSON.parse(raw));
    } catch {}
  }, []);

  const active = alerts.filter((a: any) => !a.triggered);
  const triggered = alerts.filter((a: any) => a.triggered);

  return (
    <Card className="glass-panel border-primary/30" data-testid="widget-price-alerts">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <h3 className="font-display font-bold text-sm">Price Alerts</h3>
          </div>
          <Button variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={() => navigate("/alerts")} data-testid="button-view-alerts">
            Manage <ExternalLink className="w-3 h-3 ml-1" />
          </Button>
        </div>
        {alerts.length === 0 ? (
          <p className="text-xs text-muted-foreground">No alerts set. <span className="text-primary cursor-pointer" onClick={() => navigate("/alerts")}>Create one</span></p>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-3 text-xs">
              <span className="text-muted-foreground">Active: <span className="text-foreground font-semibold">{active.length}</span></span>
              <span className="text-muted-foreground">Triggered: <span className="text-yellow-400 font-semibold">{triggered.length}</span></span>
            </div>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {active.slice(0, 3).map((a) => (
                <div key={a.id} className="flex items-center justify-between text-xs bg-muted/30 rounded px-2 py-1">
                  <span className="font-semibold">{a.coinSymbol?.toUpperCase()}</span>
                  <span className="text-muted-foreground font-mono">
                    {a.upperThreshold ? `↑ $${a.upperThreshold.toLocaleString()}` : ""}
                    {a.upperThreshold && a.lowerThreshold ? " / " : ""}
                    {a.lowerThreshold ? `↓ $${a.lowerThreshold.toLocaleString()}` : ""}
                  </span>
                </div>
              ))}
              {active.length > 3 && <p className="text-[10px] text-muted-foreground">+{active.length - 3} more</p>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function WatchlistWidget() {
  const [, navigate] = useLocation();
  const [watchlist, setWatchlist] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("tokenaltcoin_watchlist");
      if (raw) setWatchlist(JSON.parse(raw));
    } catch {}
  }, []);

  const { data: coins } = useQuery({
    queryKey: ["dashboard-watchlist", watchlist.join(",")],
    queryFn: () => fetch(`/api/prices/by-ids?ids=${watchlist.join(",")}`).then((r) => r.json()),
    enabled: watchlist.length > 0,
    refetchInterval: 60000,
  });

  return (
    <Card className="glass-panel border-primary/30" data-testid="widget-watchlist">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-primary" />
            <h3 className="font-display font-bold text-sm">Watchlist</h3>
          </div>
          <Button variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={() => navigate("/watchlist")} data-testid="button-view-watchlist">
            View All <ExternalLink className="w-3 h-3 ml-1" />
          </Button>
        </div>
        {watchlist.length === 0 ? (
          <p className="text-xs text-muted-foreground">No coins in watchlist. <span className="text-primary cursor-pointer" onClick={() => navigate("/prices")}>Add some</span></p>
        ) : (
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {(Array.isArray(coins) ? coins : []).slice(0, 5).map((coin: any) => (
              <div key={coin.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <img src={coin.image} alt="" className="w-5 h-5 rounded-full" />
                  <span className="font-semibold">{coin.symbol?.toUpperCase()}</span>
                </div>
                <div className="text-right">
                  <span className="font-mono">${coin.current_price?.toLocaleString(undefined, { maximumFractionDigits: coin.current_price < 1 ? 6 : 2 })}</span>
                  <span className={`ml-2 font-mono ${(coin.price_change_percentage_24h || 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {(coin.price_change_percentage_24h || 0) >= 0 ? "+" : ""}{coin.price_change_percentage_24h?.toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
            {watchlist.length > 5 && <p className="text-[10px] text-muted-foreground">+{watchlist.length - 5} more</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TrendingWidget() {
  const [, navigate] = useLocation();
  const { data } = useQuery({
    queryKey: ["dashboard-trending"],
    queryFn: () => fetch("/api/trending").then((r) => r.json()),
    refetchInterval: 120000,
  });

  const coins = (Array.isArray(data?.coins) ? data.coins : []).slice(0, 5);

  return (
    <Card className="glass-panel border-primary/30" data-testid="widget-trending">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h3 className="font-display font-bold text-sm">Trending</h3>
          </div>
          <Button variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={() => navigate("/prices")} data-testid="button-view-trending">
            All Prices <ExternalLink className="w-3 h-3 ml-1" />
          </Button>
        </div>
        <div className="space-y-1.5">
          {coins.map((c: any, i: number) => {
            const coin = c.item;
            const change = coin.data?.price_change_percentage_24h?.usd;
            return (
              <div key={coin.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground w-4 text-right font-mono">{i + 1}</span>
                  <img src={coin.thumb} alt="" className="w-5 h-5 rounded-full" />
                  <span className="font-semibold">{coin.symbol?.toUpperCase()}</span>
                </div>
                {change != null && (
                  <span className={`font-mono ${change >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {change >= 0 ? "+" : ""}{change.toFixed(2)}%
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function NewsWidget() {
  const [, navigate] = useLocation();
  const { data } = useQuery({
    queryKey: ["dashboard-news"],
    queryFn: () => fetch("/api/news").then((r) => r.json()),
    refetchInterval: 300000,
  });

  const articles = (Array.isArray(data) ? data : data?.articles || []).slice(0, 4);

  return (
    <Card className="glass-panel border-primary/30" data-testid="widget-news">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-primary" />
            <h3 className="font-display font-bold text-sm">News Headlines</h3>
          </div>
          <Button variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={() => navigate("/news")} data-testid="button-view-news">
            All News <ExternalLink className="w-3 h-3 ml-1" />
          </Button>
        </div>
        <div className="space-y-2">
          {articles.map((article: any, i: number) => (
            <a
              key={i}
              href={article.url || article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-xs text-foreground hover:text-primary transition-colors line-clamp-2"
              data-testid={`link-news-${i}`}
            >
              {article.title}
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

const WIDGET_COMPONENTS: Record<string, React.FC> = {
  "market-overview": MarketOverviewWidget,
  "fear-greed": FearGreedWidget,
  "portfolio-summary": PortfolioSummaryWidget,
  "price-alerts": PriceAlertsWidget,
  watchlist: WatchlistWidget,
  trending: TrendingWidget,
  news: NewsWidget,
};

function CustomizePanel({
  widgets,
  onChange,
  onClose,
}: {
  widgets: WidgetConfig[];
  onChange: (w: WidgetConfig[]) => void;
  onClose: () => void;
}) {
  const toggle = (id: string) => {
    onChange(widgets.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w)));
  };

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...widgets];
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= next.length) return;
    [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
    onChange(next);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4" data-testid="panel-customize-dashboard">
      <div className="glass-panel border border-primary/30 rounded-xl p-6 w-full max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-lg">Customize Dashboard</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground" data-testid="button-close-customize">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground">Show/hide and reorder widgets</p>
        <div className="space-y-2">
          {widgets.map((w, idx) => (
            <div key={w.id} className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2">
              <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm flex-1">{w.label}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => move(idx, -1)}
                  disabled={idx === 0}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30 p-0.5"
                  data-testid={`button-move-up-${w.id}`}
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => move(idx, 1)}
                  disabled={idx === widgets.length - 1}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30 p-0.5"
                  data-testid={`button-move-down-${w.id}`}
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button onClick={() => toggle(w.id)} className="p-0.5" data-testid={`button-toggle-${w.id}`}>
                  {w.visible ? (
                    <Eye className="w-4 h-4 text-primary" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CustomDashboardPage() {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(loadWidgets);
  const [showCustomize, setShowCustomize] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const handleWidgetsChange = useCallback((next: WidgetConfig[]) => {
    setWidgets(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const visibleWidgets = widgets.filter((w) => w.visible);

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, dropIdx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === dropIdx) return;

    const visIds = visibleWidgets.map((w) => w.id);
    const dragId = visIds[dragIdx];
    const dropId = visIds[dropIdx];

    const allCopy = [...widgets];
    const fromAll = allCopy.findIndex((w) => w.id === dragId);
    const toAll = allCopy.findIndex((w) => w.id === dropId);
    if (fromAll >= 0 && toAll >= 0) {
      [allCopy[fromAll], allCopy[toAll]] = [allCopy[toAll], allCopy[fromAll]];
      handleWidgetsChange(allCopy);
    }
    setDragIdx(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-1" data-testid="text-dashboard-title">Dashboard</h1>
            <p className="text-muted-foreground text-sm">Your personalized crypto overview</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCustomize(true)}
            className="shrink-0"
            data-testid="button-customize-dashboard"
          >
            <Settings2 className="w-4 h-4 mr-1.5" /> Customize
          </Button>
        </div>

        <AdBanner slot="dashboard-top" className="mb-2" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleWidgets.map((w, idx) => {
            const Component = WIDGET_COMPONENTS[w.id];
            if (!Component) return null;
            return (
              <div
                key={w.id}
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, idx)}
                className={`cursor-grab active:cursor-grabbing transition-opacity ${dragIdx === idx ? "opacity-50" : ""}`}
              >
                <Component />
              </div>
            );
          })}
        </div>

        <AdBanner slot="dashboard-bottom" className="mt-6" />
      </main>
      {showCustomize && (
        <CustomizePanel widgets={widgets} onChange={handleWidgetsChange} onClose={() => setShowCustomize(false)} />
      )}
      <Footer />
    </div>
  );
}
