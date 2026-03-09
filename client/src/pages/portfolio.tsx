import { useState, useCallback, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  Briefcase,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Search,
  Loader2,
  DollarSign,
  BarChart3,
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

interface Holding {
  id: string;
  coinId: string;
  quantity: number;
  purchasePrice: number;
}

const STORAGE_KEY = "tokenaltcoin_portfolio";
const PIE_COLORS = [
  "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981",
  "#06b6d4", "#f43f5e", "#84cc16", "#a855f7", "#14b8a6",
  "#ef4444", "#6366f1", "#22c55e", "#eab308", "#0ea5e9",
];

function getStoredHoldings(): Holding[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHoldings(holdings: Holding[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings));
}

function formatPrice(price: number): string {
  if (price < 0.001) return `$${price.toFixed(8)}`;
  if (price < 1) return `$${price.toFixed(6)}`;
  return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function formatValue(num: number): string {
  if (Math.abs(num) >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (Math.abs(num) >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (Math.abs(num) >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
}

function AddHoldingForm({ onAdd }: { onAdd: (coinId: string, quantity: number, purchasePrice: number) => void }) {
  const [search, setSearch] = useState("");
  const [selectedCoin, setSelectedCoin] = useState<any>(null);
  const [quantity, setQuantity] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");

  const pricesQuery = useQuery({
    queryKey: ["/api/prices", "portfolio-search"],
    queryFn: async () => {
      const res = await fetch("/api/prices?page=1&per_page=100");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 60000,
  });

  const allCoins = (pricesQuery.data && Array.isArray(pricesQuery.data)) ? pricesQuery.data : [];
  const filtered = search.length >= 1 && !selectedCoin
    ? allCoins.filter((c: any) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.symbol.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 8)
    : [];

  const handleSelectCoin = (coin: any) => {
    setSelectedCoin(coin);
    setSearch(coin.name);
    setPurchasePrice(coin.current_price?.toString() || "");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCoin || !quantity || !purchasePrice) return;
    const qty = parseFloat(quantity);
    const price = parseFloat(purchasePrice);
    if (isNaN(qty) || qty <= 0 || isNaN(price) || price <= 0) return;
    onAdd(selectedCoin.id, qty, price);
    setSearch("");
    setSelectedCoin(null);
    setQuantity("");
    setPurchasePrice("");
  };

  const handleClearCoin = () => {
    setSelectedCoin(null);
    setSearch("");
    setPurchasePrice("");
  };

  return (
    <Card className="glass-panel border-border" data-testid="card-add-holding">
      <CardContent className="p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-primary" /> Add Holding
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (selectedCoin) setSelectedCoin(null);
              }}
              placeholder="Search coin..."
              className="bg-muted/30 border-border pl-10 h-10 text-sm"
              data-testid="input-portfolio-search"
            />
            {selectedCoin && (
              <button
                type="button"
                onClick={handleClearCoin}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                data-testid="button-clear-coin"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {filtered.length > 0 && (
              <div className="absolute left-0 right-0 top-12 bg-card border border-border rounded-xl p-2 z-50 shadow-2xl max-h-[250px] overflow-y-auto">
                {filtered.map((coin: any) => (
                  <button
                    key={coin.id}
                    type="button"
                    onClick={() => handleSelectCoin(coin)}
                    className="w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center gap-3 transition-colors text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    data-testid={`button-select-${coin.id}`}
                  >
                    <img src={coin.image} alt="" className="w-5 h-5 rounded-full" />
                    <span className="font-medium text-foreground">{coin.name}</span>
                    <span className="text-xs uppercase text-muted-foreground">{coin.symbol}</span>
                    <span className="ml-auto text-xs font-mono">{formatPrice(coin.current_price)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              step="any"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Quantity"
              className="bg-muted/30 border-border h-10 text-sm"
              data-testid="input-quantity"
            />
            <Input
              type="number"
              step="any"
              min="0"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              placeholder="Purchase price ($)"
              className="bg-muted/30 border-border h-10 text-sm"
              data-testid="input-purchase-price"
            />
          </div>
          <Button
            type="submit"
            disabled={!selectedCoin || !quantity || !purchasePrice}
            className="w-full"
            data-testid="button-add-holding"
          >
            <Plus className="w-4 h-4 mr-2" /> Add to Portfolio
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function CustomPieTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl text-sm">
      <p className="font-semibold text-foreground">{data.name}</p>
      <p className="text-muted-foreground">{formatValue(data.value)} ({data.percentage.toFixed(1)}%)</p>
    </div>
  );
}

export default function PortfolioPage() {
  const [holdings, setHoldings] = useState<Holding[]>(getStoredHoldings);
  const { toast } = useToast();

  useEffect(() => {
    const handler = () => setHoldings(getStoredHoldings());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const uniqueCoinIds = useMemo(() => Array.from(new Set(holdings.map(h => h.coinId))), [holdings]);

  const pricesQuery = useQuery({
    queryKey: ["/api/prices/by-ids", uniqueCoinIds.join(",")],
    queryFn: async () => {
      if (uniqueCoinIds.length === 0) return [];
      const res = await fetch(`/api/prices/by-ids?ids=${uniqueCoinIds.join(",")}`);
      if (!res.ok) throw new Error("Failed to fetch prices");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    refetchInterval: 60000,
    staleTime: 30000,
    enabled: uniqueCoinIds.length > 0,
  });

  const priceMap = useMemo(() => {
    const map: Record<string, any> = {};
    if (pricesQuery.data) {
      for (const coin of pricesQuery.data) {
        map[coin.id] = coin;
      }
    }
    return map;
  }, [pricesQuery.data]);

  const addHolding = useCallback((coinId: string, quantity: number, purchasePrice: number) => {
    setHoldings(prev => {
      const next = [...prev, { id: crypto.randomUUID(), coinId, quantity, purchasePrice }];
      saveHoldings(next);
      return next;
    });
    toast({ title: "Holding added to portfolio" });
  }, [toast]);

  const removeHolding = useCallback((id: string) => {
    setHoldings(prev => {
      const next = prev.filter(h => h.id !== id);
      saveHoldings(next);
      return next;
    });
    toast({ title: "Holding removed" });
  }, [toast]);

  const portfolioData = useMemo(() => {
    let totalCurrentValue = 0;
    let totalCostBasis = 0;

    const items = holdings.map(h => {
      const coinData = priceMap[h.coinId];
      const currentPrice = coinData?.current_price || 0;
      const currentValue = h.quantity * currentPrice;
      const costBasis = h.quantity * h.purchasePrice;
      const pnl = currentValue - costBasis;
      const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0;

      totalCurrentValue += currentValue;
      totalCostBasis += costBasis;

      return {
        ...h,
        coinData,
        currentPrice,
        currentValue,
        costBasis,
        pnl,
        pnlPercent,
      };
    });

    const totalPnl = totalCurrentValue - totalCostBasis;
    const totalPnlPercent = totalCostBasis > 0 ? (totalPnl / totalCostBasis) * 100 : 0;

    const aggregated: Record<string, { name: string; symbol: string; image: string; value: number }> = {};
    for (const item of items) {
      const key = item.coinId;
      if (!aggregated[key]) {
        aggregated[key] = {
          name: item.coinData?.name || item.coinId,
          symbol: item.coinData?.symbol?.toUpperCase() || "",
          image: item.coinData?.image || "",
          value: 0,
        };
      }
      aggregated[key].value += item.currentValue;
    }

    const pieData = Object.values(aggregated)
      .filter(a => a.value > 0)
      .sort((a, b) => b.value - a.value)
      .map((a, i) => ({
        ...a,
        percentage: totalCurrentValue > 0 ? (a.value / totalCurrentValue) * 100 : 0,
        color: PIE_COLORS[i % PIE_COLORS.length],
      }));

    return { items, totalCurrentValue, totalCostBasis, totalPnl, totalPnlPercent, pieData };
  }, [holdings, priceMap]);

  return (
    <div className="min-h-screen bg-background">
      <div
        className="h-72 w-full absolute top-0 left-0 z-0 page-glow"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.15) 0%, transparent 70%)",
        }}
      />
      <Navbar />

      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-6 pt-8">
        <AdBanner slot="7766554433" format="horizontal" className="w-full mb-6" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3" data-testid="text-page-title">
              <Briefcase className="w-8 h-8 text-primary" />
              Portfolio
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Track your crypto holdings, gains, and allocation
            </p>
          </div>
        </div>

        {holdings.length > 0 && pricesQuery.data && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <Card className="glass-panel border-border" data-testid="card-total-value">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-widest mb-2">
                    <DollarSign className="w-3.5 h-3.5" /> Total Value
                  </div>
                  <div className="text-2xl font-bold font-display text-foreground" data-testid="text-total-value">
                    {formatValue(portfolioData.totalCurrentValue)}
                  </div>
                </CardContent>
              </Card>
              <Card className="glass-panel border-border" data-testid="card-total-pnl">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-widest mb-2">
                    {portfolioData.totalPnl >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    Total P&L
                  </div>
                  <div className={`text-2xl font-bold font-display ${portfolioData.totalPnl >= 0 ? "text-green-400" : "text-red-400"}`} data-testid="text-total-pnl">
                    {portfolioData.totalPnl >= 0 ? "+" : ""}{formatValue(portfolioData.totalPnl)}
                  </div>
                  <div className={`text-sm font-mono ${portfolioData.totalPnl >= 0 ? "text-green-400" : "text-red-400"}`} data-testid="text-total-pnl-percent">
                    {portfolioData.totalPnlPercent >= 0 ? "+" : ""}{portfolioData.totalPnlPercent.toFixed(2)}%
                  </div>
                </CardContent>
              </Card>
              <Card className="glass-panel border-border" data-testid="card-cost-basis">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-widest mb-2">
                    <BarChart3 className="w-3.5 h-3.5" /> Cost Basis
                  </div>
                  <div className="text-2xl font-bold font-display text-foreground" data-testid="text-cost-basis">
                    {formatValue(portfolioData.totalCostBasis)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {portfolioData.pieData.length > 0 && (
              <Card className="glass-panel border-border mb-6" data-testid="card-allocation-chart">
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Allocation</h3>
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="w-full md:w-1/2 h-[260px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={portfolioData.pieData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={110}
                            paddingAngle={2}
                            strokeWidth={0}
                          >
                            {portfolioData.pieData.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomPieTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-full md:w-1/2 space-y-2">
                      {portfolioData.pieData.map((item, i) => (
                        <div key={i} className="flex items-center gap-3" data-testid={`allocation-item-${i}`}>
                          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {item.image && <img src={item.image} alt="" className="w-4 h-4 rounded-full" />}
                            <span className="text-sm text-foreground font-medium truncate">{item.name}</span>
                            <span className="text-xs text-muted-foreground uppercase">{item.symbol}</span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-sm font-mono text-foreground">{item.percentage.toFixed(1)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-1">
            <AddHoldingForm onAdd={addHolding} />
          </div>

          <div className="lg:col-span-2">
            {holdings.length === 0 ? (
              <div className="glass-panel p-12 rounded-2xl text-center animate-in fade-in duration-700">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
                  <Briefcase className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-display font-bold text-foreground mb-3" data-testid="text-empty-title">
                  Your Portfolio is Empty
                </h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Search for a cryptocurrency, enter the quantity and purchase price to start tracking your portfolio performance.
                </p>
              </div>
            ) : pricesQuery.isLoading ? (
              <div className="p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
                <div className="text-muted-foreground">Loading portfolio data...</div>
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Holdings</h3>
                {portfolioData.items.map((item) => {
                  const coin = item.coinData;
                  return (
                    <div
                      key={item.id}
                      className="glass-panel rounded-xl p-4 md:p-5 hover:bg-muted/20 transition-colors"
                      data-testid={`card-holding-${item.id}`}
                    >
                      <div className="flex items-center gap-4">
                        {coin?.image && <img src={coin.image} alt="" className="w-10 h-10 rounded-full shrink-0" />}
                        {!coin?.image && <div className="w-10 h-10 rounded-full bg-muted/50 shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-foreground" data-testid={`text-holding-name-${item.id}`}>
                              {coin?.name || item.coinId}
                            </span>
                            <span className="text-xs text-muted-foreground uppercase">{coin?.symbol || ""}</span>
                          </div>
                          <div className="flex items-center gap-4 flex-wrap text-sm">
                            <span className="text-muted-foreground">
                              {item.quantity.toLocaleString(undefined, { maximumFractionDigits: 8 })} × {formatPrice(item.currentPrice)}
                            </span>
                            <span className="font-mono font-semibold text-foreground" data-testid={`text-holding-value-${item.id}`}>
                              {formatValue(item.currentValue)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className={`text-sm font-mono font-semibold ${item.pnl >= 0 ? "text-green-400" : "text-red-400"}`} data-testid={`text-holding-pnl-${item.id}`}>
                            {item.pnl >= 0 ? "+" : ""}{formatValue(item.pnl)}
                          </div>
                          <div className={`text-xs font-mono ${item.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                            {item.pnlPercent >= 0 ? "+" : ""}{item.pnlPercent.toFixed(2)}%
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            Cost: {formatPrice(item.purchasePrice)}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeHolding(item.id)}
                          className="text-muted-foreground hover:text-red-400 shrink-0"
                          data-testid={`button-remove-holding-${item.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <AdBanner slot="3344556677" format="horizontal" className="w-full mb-6" />
      </div>
      <Footer />
    </div>
  );
}
