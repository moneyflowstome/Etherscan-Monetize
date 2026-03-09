import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  X,
  Plus,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Crown,
  Loader2,
  Scale,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AdBanner } from "@/components/AdBanner";

const MAX_COINS = 4;

function formatPrice(price: number | null): string {
  if (price === null || price === undefined) return "N/A";
  if (price < 0.001) return `$${price.toFixed(8)}`;
  if (price < 1) return `$${price.toFixed(6)}`;
  return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function formatLargeNumber(num: number | null): string {
  if (num === null || num === undefined) return "N/A";
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
}

function formatSupply(num: number | null, symbol?: string): string {
  if (num === null || num === undefined) return "N/A";
  const s = symbol ? ` ${symbol.toUpperCase()}` : "";
  if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T${s}`;
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B${s}`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M${s}`;
  return `${num.toLocaleString()}${s}`;
}

function formatPercent(val: number | null): string {
  if (val === null || val === undefined) return "N/A";
  return `${val >= 0 ? "+" : ""}${val.toFixed(2)}%`;
}

function PercentBadge({ value }: { value: number | null }) {
  if (value === null || value === undefined) return <span className="text-muted-foreground text-sm">N/A</span>;
  const isPositive = value >= 0;
  return (
    <span className={`text-sm font-mono font-semibold flex items-center gap-1 ${isPositive ? "text-green-400" : "text-red-400"}`}>
      {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
      {formatPercent(value)}
    </span>
  );
}

function getBestValue(values: (number | null)[], mode: "high" | "low"): number | null {
  const entries = values.map((v, i) => ({ i, v })).filter(x => typeof x.v === "number" && isFinite(x.v));
  if (entries.length < 2) return null;
  const best = mode === "high" ? entries.reduce((a, b) => ((b.v as number) > (a.v as number) ? b : a)) : entries.reduce((a, b) => ((b.v as number) < (a.v as number) ? b : a));
  return best.i;
}

function CoinSearchInput({ onSelect, excludeIds }: { onSelect: (coin: any) => void; excludeIds: string[] }) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchQuery = useQuery({
    queryKey: ["/api/search/coins", debouncedSearch],
    queryFn: async () => {
      const res = await fetch(`/api/search/coins?q=${encodeURIComponent(debouncedSearch)}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: debouncedSearch.length >= 2,
    staleTime: 60000,
  });

  const filtered = (Array.isArray(searchQuery.data) ? searchQuery.data : [])
    .filter((c: any) => !excludeIds.includes(c.id))
    .slice(0, 8);

  return (
    <div className="relative" ref={wrapperRef}>
      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={search}
        onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
        placeholder="Search coin to add..."
        className="bg-muted/30 border-border pl-10 h-10 text-sm"
        data-testid="input-compare-search"
      />
      {open && debouncedSearch.length >= 2 && (
        <>
          {searchQuery.isFetching && (
            <div className="absolute left-0 right-0 top-12 bg-card border border-border rounded-xl p-3 z-50 shadow-2xl text-center text-xs text-muted-foreground">
              Searching...
            </div>
          )}
          {!searchQuery.isFetching && filtered.length > 0 && (
            <div className="absolute left-0 right-0 top-12 bg-card border border-border rounded-xl p-2 z-50 shadow-2xl max-h-[280px] overflow-y-auto">
              {filtered.map((coin: any) => (
                <button
                  key={coin.id}
                  type="button"
                  onClick={() => {
                    onSelect(coin);
                    setSearch("");
                    setOpen(false);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center gap-3 transition-colors text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  data-testid={`button-compare-select-${coin.id}`}
                >
                  <img src={coin.thumb || coin.image} alt="" className="w-5 h-5 rounded-full" />
                  <span className="font-medium text-foreground">{coin.name}</span>
                  <span className="text-xs uppercase text-muted-foreground">{coin.symbol}</span>
                  {coin.market_cap_rank && <span className="ml-auto text-xs text-muted-foreground">#{coin.market_cap_rank}</span>}
                </button>
              ))}
            </div>
          )}
          {!searchQuery.isFetching && filtered.length === 0 && debouncedSearch.length >= 2 && (
            <div className="absolute left-0 right-0 top-12 bg-card border border-border rounded-xl p-3 z-50 shadow-2xl text-center text-xs text-muted-foreground">
              No coins found
            </div>
          )}
        </>
      )}
    </div>
  );
}

const COMPARE_METRICS = [
  { key: "current_price", label: "Price", format: "price", best: "high" },
  { key: "market_cap", label: "Market Cap", format: "large", best: "high" },
  { key: "market_cap_rank", label: "Rank", format: "rank", best: "low" },
  { key: "total_volume", label: "24h Volume", format: "large", best: "high" },
  { key: "price_change_percentage_24h", label: "24h Change", format: "percent", best: "high" },
  { key: "ath", label: "All-Time High", format: "price", best: "none" },
  { key: "ath_from", label: "From ATH", format: "percent_calc", best: "high" },
  { key: "atl", label: "All-Time Low", format: "price", best: "none" },
  { key: "circulating_supply", label: "Circulating Supply", format: "supply", best: "none" },
  { key: "total_supply", label: "Total Supply", format: "supply", best: "none" },
  { key: "max_supply", label: "Max Supply", format: "supply", best: "none" },
] as const;

export default function ComparePage() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const coinDataQuery = useQuery({
    queryKey: ["/api/coins/compare", ...selectedIds],
    queryFn: async () => {
      const results = await Promise.all(
        selectedIds.map(async (id) => {
          try {
            const res = await fetch(`/api/coin/${id}`);
            if (!res.ok) return null;
            return res.json();
          } catch {
            return null;
          }
        })
      );
      return results;
    },
    enabled: selectedIds.length > 0,
    staleTime: 120000,
  });

  const coins = coinDataQuery.data || selectedIds.map(() => null);
  const isLoading = coinDataQuery.isLoading;

  const handleAdd = (coin: any) => {
    if (selectedIds.length < MAX_COINS && !selectedIds.includes(coin.id)) {
      setSelectedIds(prev => [...prev, coin.id]);
    }
  };

  const handleRemove = (id: string) => {
    setSelectedIds(prev => prev.filter(i => i !== id));
  };

  const getCellValue = (coin: any, metric: typeof COMPARE_METRICS[number]): number | null => {
    if (!coin) return null;
    if (metric.key === "ath_from") {
      if (coin.current_price && coin.ath) {
        return ((coin.current_price - coin.ath) / coin.ath) * 100;
      }
      return null;
    }
    const v = coin[metric.key];
    return v !== null && v !== undefined ? v : null;
  };

  const formatCellValue = (value: number | null, metric: typeof COMPARE_METRICS[number], coin: any) => {
    if (value === null || value === undefined) return "N/A";
    switch (metric.format) {
      case "price": return formatPrice(value);
      case "large": return formatLargeNumber(value);
      case "rank": return `#${value}`;
      case "percent": return formatPercent(value);
      case "percent_calc": return formatPercent(value);
      case "supply": return formatSupply(value, coin?.symbol);
      default: return String(value);
    }
  };

  const isPercentMetric = (metric: typeof COMPARE_METRICS[number]) =>
    metric.format === "percent" || metric.format === "percent_calc";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0" style={{
            background: "radial-gradient(ellipse at 50% 0%, rgba(0,200,255,0.08) 0%, transparent 70%)",
          }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                <Scale className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-display font-bold text-2xl md:text-3xl text-foreground tracking-wider" data-testid="text-compare-title">
                  Compare Coins
                </h1>
                <p className="text-sm text-muted-foreground">Side-by-side analysis of up to {MAX_COINS} cryptocurrencies</p>
              </div>
            </div>
          </div>

          <AdBanner slot="compare-top" format="horizontal" className="w-full mb-6" />

          <Card className="glass-panel border-border mb-6">
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-1 w-full sm:max-w-sm">
                  {selectedIds.length < MAX_COINS ? (
                    <CoinSearchInput onSelect={handleAdd} excludeIds={selectedIds} />
                  ) : (
                    <p className="text-sm text-muted-foreground px-3 py-2">Maximum {MAX_COINS} coins selected. Remove one to add another.</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedIds.map((id, idx) => {
                    const coin = coins[idx];
                    return (
                      <Badge
                        key={id}
                        variant="secondary"
                        className="pl-2 pr-1 py-1.5 flex items-center gap-2 bg-muted/40 border border-border text-sm"
                        data-testid={`badge-compare-coin-${id}`}
                      >
                        {coin?.image && <img src={coin.image} alt="" className="w-4 h-4 rounded-full" />}
                        <span className="font-medium">{coin?.name || id}</span>
                        <span className="text-xs text-muted-foreground uppercase">{coin?.symbol || ""}</span>
                        <button
                          onClick={() => handleRemove(id)}
                          className="ml-1 p-0.5 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
                          data-testid={`button-remove-compare-${id}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {selectedIds.length === 0 && (
            <div className="glass-panel p-12 rounded-2xl text-center animate-in fade-in duration-700">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
                <Scale className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-3" data-testid="text-compare-empty">
                Start Comparing
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                Search and add up to {MAX_COINS} cryptocurrencies to compare their key metrics side by side.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  { id: "bitcoin", label: "Bitcoin" },
                  { id: "ethereum", label: "Ethereum" },
                  { id: "solana", label: "Solana" },
                  { id: "ripple", label: "XRP" },
                ].map(suggestion => (
                  <Button
                    key={suggestion.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleAdd({ id: suggestion.id })}
                    className="bg-muted/30 border-border text-muted-foreground hover:text-foreground"
                    data-testid={`button-suggest-${suggestion.id}`}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> {suggestion.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {selectedIds.length > 0 && isLoading && (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
              <div className="text-muted-foreground">Loading coin data...</div>
            </div>
          )}

          {selectedIds.length > 0 && !isLoading && (
            <>
              <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: `repeat(${selectedIds.length}, 1fr)` }}>
                {coins.map((coin, idx) => coin && (
                  <Card key={selectedIds[idx]} className="glass-panel border-border overflow-hidden" data-testid={`card-compare-header-${selectedIds[idx]}`}>
                    <CardContent className="p-4 md:p-5 text-center">
                      <div className="flex justify-center mb-3">
                        <img src={coin.image} alt={coin.name} className="w-12 h-12 md:w-16 md:h-16 rounded-full" />
                      </div>
                      <h3 className="font-display font-bold text-base md:text-lg text-foreground truncate" data-testid={`text-compare-name-${selectedIds[idx]}`}>
                        {coin.name}
                      </h3>
                      <Badge variant="secondary" className="text-xs uppercase mt-1 bg-muted/40">
                        {coin.symbol}
                      </Badge>
                      <div className="mt-3">
                        <div className="text-xl md:text-2xl font-mono font-bold text-foreground" data-testid={`text-compare-price-${selectedIds[idx]}`}>
                          {formatPrice(coin.current_price)}
                        </div>
                        <PercentBadge value={coin.price_change_percentage_24h} />
                      </div>
                      {coin.market_cap_rank && (
                        <div className="mt-2 flex items-center justify-center gap-1">
                          <Crown className="w-3.5 h-3.5 text-yellow-500" />
                          <span className="text-xs text-muted-foreground">Rank #{coin.market_cap_rank}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="hidden md:block">
                <Card className="glass-panel border-border overflow-hidden">
                  <CardContent className="p-0">
                    <table className="w-full" data-testid="table-compare">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider w-48">
                            <div className="flex items-center gap-2">
                              <ArrowUpDown className="w-4 h-4" /> Metric
                            </div>
                          </th>
                          {coins.map((coin, idx) => (
                            <th key={selectedIds[idx]} className="text-center p-4 text-sm font-semibold text-foreground">
                              <div className="flex items-center justify-center gap-2">
                                {coin?.image && <img src={coin.image} alt="" className="w-5 h-5 rounded-full" />}
                                {coin?.symbol?.toUpperCase() || selectedIds[idx]}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {COMPARE_METRICS.map((metric) => {
                          const cellValues = coins.map(c => getCellValue(c, metric));
                          const bestIdx = metric.best !== "none"
                            ? getBestValue(cellValues, metric.best as "high" | "low")
                            : null;

                          return (
                            <tr key={metric.key} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                              <td className="p-4 text-sm font-medium text-muted-foreground">{metric.label}</td>
                              {coins.map((coin, idx) => {
                                const value = cellValues[idx];
                                const formatted = formatCellValue(value, metric, coin);
                                const isBest = bestIdx === idx && value !== null;
                                const isPctVal = isPercentMetric(metric) && typeof value === "number";

                                return (
                                  <td
                                    key={selectedIds[idx]}
                                    className={`p-4 text-center text-sm font-mono ${
                                      isBest ? "text-primary font-bold" : "text-foreground"
                                    }`}
                                    data-testid={`cell-${metric.key}-${selectedIds[idx]}`}
                                  >
                                    <div className="flex items-center justify-center gap-1">
                                      {isBest && <Crown className="w-3.5 h-3.5 text-primary shrink-0" />}
                                      {isPctVal ? (
                                        <span className={value >= 0 ? "text-green-400" : "text-red-400"}>
                                          {formatted}
                                        </span>
                                      ) : (
                                        formatted
                                      )}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              </div>

              <div className="md:hidden space-y-3">
                {COMPARE_METRICS.map((metric) => {
                  const cellValues = coins.map(c => getCellValue(c, metric));
                  const bestIdx = metric.best !== "none"
                    ? getBestValue(cellValues, metric.best as "high" | "low")
                    : null;

                  return (
                    <Card key={metric.key} className="glass-panel border-border">
                      <CardContent className="p-4">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{metric.label}</h4>
                        <div className="space-y-2">
                          {coins.map((coin, idx) => {
                            if (!coin) return null;
                            const value = getCellValue(coin, metric);
                            const formatted = formatCellValue(value, metric, coin);
                            const isBest = bestIdx === idx && value !== null && value !== undefined;
                            const isPctVal = isPercentMetric(metric) && typeof value === "number";

                            return (
                              <div
                                key={selectedIds[idx]}
                                className={`flex items-center justify-between p-2 rounded-lg ${isBest ? "bg-primary/10 border border-primary/20" : "bg-muted/10"}`}
                                data-testid={`mobile-cell-${metric.key}-${selectedIds[idx]}`}
                              >
                                <div className="flex items-center gap-2">
                                  {coin.image && <img src={coin.image} alt="" className="w-5 h-5 rounded-full" />}
                                  <span className="text-sm font-medium text-foreground">{coin.symbol?.toUpperCase()}</span>
                                  {isBest && <Crown className="w-3.5 h-3.5 text-primary" />}
                                </div>
                                <span className={`text-sm font-mono ${
                                  isPctVal ? (value >= 0 ? "text-green-400" : "text-red-400") :
                                  isBest ? "text-primary font-bold" : "text-foreground"
                                }`}>
                                  {formatted}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <AdBanner slot="compare-bottom" format="horizontal" className="w-full mt-6" />
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
