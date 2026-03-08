import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Loader2,
  Search,
  Star,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

export default function PricesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
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

        <div className="glass-panel rounded-2xl overflow-hidden">
          {pricesQuery.isLoading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
              <div className="text-muted-foreground">Loading prices...</div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[700px]">
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
                        <>
                          <tr
                            key={coin.id}
                            className="hover:bg-muted/20 transition-colors group"
                            data-testid={`row-price-${coin.id}`}
                          >
                            <td className="p-4">
                              <button
                                onClick={() => {
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
                                  <div className="font-medium text-foreground text-sm">{coin.name}</div>
                                  <div className="text-xs text-muted-foreground uppercase">{coin.symbol}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-right font-mono text-sm text-foreground">
                              ${coin.current_price?.toLocaleString(undefined, { maximumFractionDigits: coin.current_price < 1 ? 6 : 2 })}
                            </td>
                            <td className={`p-4 text-right text-sm font-mono ${change1h >= 0 ? "text-green-400" : "text-red-400"}`}>
                              {change1h != null ? `${change1h >= 0 ? "+" : ""}${change1h.toFixed(2)}%` : "—"}
                            </td>
                            <td className={`p-4 text-right text-sm font-mono ${change24h >= 0 ? "text-green-400" : "text-red-400"}`}>
                              {change24h != null ? `${change24h >= 0 ? "+" : ""}${change24h.toFixed(2)}%` : "—"}
                            </td>
                            <td className={`p-4 text-right text-sm font-mono ${change7d >= 0 ? "text-green-400" : "text-red-400"}`}>
                              {change7d != null ? `${change7d >= 0 ? "+" : ""}${change7d.toFixed(2)}%` : "—"}
                            </td>
                            <td className="p-4 text-right text-sm font-mono text-foreground">
                              {coin.market_cap ? formatMarketCap(coin.market_cap) : "—"}
                            </td>
                            <td className="p-4 text-right">
                              {coin.sparkline_in_7d?.price && (
                                <MiniSparkline
                                  data={coin.sparkline_in_7d.price}
                                  positive={(change7d || 0) >= 0}
                                />
                              )}
                            </td>
                          </tr>
                          {i === 9 && (
                            <tr key="infeed-price-ad">
                              <td colSpan={9} className="p-3">
                                <AdBanner slot="9012345678" format="fluid" layout="in-article" className="w-full" />
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between p-4 border-t border-border">
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
        </div>

        <AdBanner slot="0123456789" format="horizontal" className="w-full mt-6" />
      </div>
      <Footer />
    </div>
  );
}
