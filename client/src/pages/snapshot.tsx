import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Loader2,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  BarChart3,
  DollarSign,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AdBanner } from "@/components/AdBanner";

function formatMarketCap(num: number): string {
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  return `$${num.toLocaleString()}`;
}

function formatPrice(price: number | null | undefined): string {
  if (price == null) return "—";
  if (price < 0.001) return `$${price.toFixed(8)}`;
  if (price < 1) return `$${price.toFixed(6)}`;
  return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function getDefaultDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split("T")[0];
}

function getMaxDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

export default function SnapshotPage() {
  const [selectedDate, setSelectedDate] = useState(getDefaultDate());
  const [queryDate, setQueryDate] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["snapshot", queryDate],
    queryFn: async () => {
      const res = await fetch(`/api/snapshot/${queryDate}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to fetch snapshot" }));
        throw new Error(err.error || "Failed to fetch snapshot");
      }
      return res.json();
    },
    enabled: !!queryDate,
    staleTime: 600000,
    retry: 1,
  });

  const handleSubmit = () => {
    if (selectedDate) {
      setQueryDate(selectedDate);
    }
  };

  const coins = data?.coins || [];
  const snapshotDateStr = data?.date
    ? new Date(data.date + "T00:00:00").toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  const totalGainers = coins.filter((c: any) => c.changePercent > 0).length;
  const totalLosers = coins.filter((c: any) => c.changePercent < 0).length;
  const avgChange =
    coins.length > 0
      ? coins.reduce((sum: number, c: any) => sum + (c.changePercent || 0), 0) / coins.length
      : 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="space-y-2">
          <h1
            className="text-2xl md:text-3xl font-bold flex items-center gap-3"
            data-testid="text-snapshot-title"
          >
            <Clock className="w-7 h-7 text-primary" />
            Historical Snapshot
          </h1>
          <p className="text-sm text-muted-foreground" data-testid="text-snapshot-desc">
            View market data from the past year and compare with today's prices. Top 5 coins available on free tier.
          </p>
        </div>

        <AdBanner slot="snapshot-top" />

        <Card className="glass-panel border-border" data-testid="card-date-picker">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
              <div className="flex-1 w-full sm:w-auto">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
                  Select Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    max={getMaxDate()}
                    min={(() => { const d = new Date(); d.setDate(d.getDate() - 365); return d.toISOString().split("T")[0]; })()}
                    className="pl-10"
                    data-testid="input-snapshot-date"
                  />
                </div>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={!selectedDate || isLoading}
                className="w-full sm:w-auto"
                data-testid="button-snapshot-fetch"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Snapshot
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-red-500/30 bg-red-500/5" data-testid="card-snapshot-error">
            <CardContent className="p-4">
              <p className="text-sm text-red-400" data-testid="text-snapshot-error">
                {(error as Error).message}
              </p>
            </CardContent>
          </Card>
        )}

        {data && coins.length === 0 && !isLoading && !error && (
          <Card className="glass-panel border-border" data-testid="card-empty-state">
            <CardContent className="p-8 text-center">
              <Activity className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">No coin data available for this date</p>
              <p className="text-xs text-muted-foreground mt-1">
                The free CoinGecko API has strict rate limits. Try again in a minute or pick a different date.
              </p>
            </CardContent>
          </Card>
        )}

        {data && coins.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="glass-panel border-border" data-testid="card-stat-gainers">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Gainers</p>
                    <p className="text-xl font-bold text-green-400" data-testid="text-gainers-count">
                      {totalGainers}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="glass-panel border-border" data-testid="card-stat-losers">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <TrendingDown className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Losers</p>
                    <p className="text-xl font-bold text-red-400" data-testid="text-losers-count">
                      {totalLosers}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="glass-panel border-border" data-testid="card-stat-avg">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Avg Change</p>
                    <p
                      className={`text-xl font-bold ${avgChange >= 0 ? "text-green-400" : "text-red-400"}`}
                      data-testid="text-avg-change"
                    >
                      {avgChange >= 0 ? "+" : ""}
                      {avgChange.toFixed(2)}%
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="glass-panel border-border" data-testid="card-snapshot-table">
              <CardContent className="p-0">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-primary" />
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Market Snapshot — {snapshotDateStr}
                    </h2>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Top {coins.length} Coins
                  </Badge>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm" data-testid="table-snapshot">
                    <thead>
                      <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
                        <th className="text-left p-3 pl-4">#</th>
                        <th className="text-left p-3">Coin</th>
                        <th className="text-right p-3">Price Then</th>
                        <th className="text-right p-3">Price Now</th>
                        <th className="text-right p-3">Change %</th>
                        <th className="text-right p-3 hidden md:table-cell">Market Cap Then</th>
                        <th className="text-right p-3 hidden md:table-cell">Market Cap Now</th>
                        <th className="text-right p-3 hidden lg:table-cell">Volume Then</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coins.map((coin: any, index: number) => {
                        const isPositive = coin.changePercent >= 0;
                        return (
                          <tr
                            key={coin.id}
                            className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                            data-testid={`row-snapshot-${coin.id}`}
                          >
                            <td className="p-3 pl-4 text-muted-foreground font-mono text-xs">
                              {index + 1}
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <img
                                  src={coin.image}
                                  alt={coin.name}
                                  className="w-6 h-6 rounded-full"
                                />
                                <div>
                                  <span className="font-medium text-foreground">{coin.name}</span>
                                  <span className="text-xs text-muted-foreground ml-1.5 uppercase">
                                    {coin.symbol}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-right font-mono text-muted-foreground">
                              {formatPrice(coin.priceThen)}
                            </td>
                            <td className="p-3 text-right font-mono text-foreground font-medium">
                              {formatPrice(coin.priceNow)}
                            </td>
                            <td className="p-3 text-right">
                              <span
                                className={`inline-flex items-center gap-1 font-mono font-semibold text-xs px-2 py-0.5 rounded-full ${
                                  isPositive
                                    ? "bg-green-500/10 text-green-400"
                                    : "bg-red-500/10 text-red-400"
                                }`}
                                data-testid={`text-change-${coin.id}`}
                              >
                                {isPositive ? (
                                  <ArrowUpRight className="w-3 h-3" />
                                ) : (
                                  <ArrowDownRight className="w-3 h-3" />
                                )}
                                {isPositive ? "+" : ""}
                                {coin.changePercent?.toFixed(2)}%
                              </span>
                            </td>
                            <td className="p-3 text-right font-mono text-muted-foreground text-xs hidden md:table-cell">
                              {coin.marketCapThen ? formatMarketCap(coin.marketCapThen) : "—"}
                            </td>
                            <td className="p-3 text-right font-mono text-foreground text-xs hidden md:table-cell">
                              {coin.marketCapNow ? formatMarketCap(coin.marketCapNow) : "—"}
                            </td>
                            <td className="p-3 text-right font-mono text-muted-foreground text-xs hidden lg:table-cell">
                              {coin.volumeThen ? formatMarketCap(coin.volumeThen) : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {!queryDate && !isLoading && (
          <Card className="glass-panel border-border" data-testid="card-snapshot-empty">
            <CardContent className="p-12 text-center">
              <Clock className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                Select a Date to Begin
              </h3>
              <p className="text-sm text-muted-foreground/70 max-w-md mx-auto">
                Choose a past date to see how the top 20 cryptocurrencies were performing that day
                compared to today.
              </p>
            </CardContent>
          </Card>
        )}

        <AdBanner slot="snapshot-bottom" />
      </main>

      <Footer />
    </div>
  );
}
