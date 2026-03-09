import { useQuery } from "@tanstack/react-query";
import {
  Loader2,
  Star,
  Trash2,
  TrendingUp,
  TrendingDown,
  Eye,
  Search,
  Plus,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AdBanner } from "@/components/AdBanner";
import { useWatchlist } from "@/hooks/use-watchlist";
import { useToast } from "@/hooks/use-toast";

function formatPrice(price: number): string {
  if (price >= 1) return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  return `$${price.toLocaleString(undefined, { maximumFractionDigits: 6 })}`;
}

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
  const width = 100;
  const height = 36;
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

function AddCoinSection({ onAdd, isWatched }: { onAdd: (id: string) => void; isWatched: (id: string) => boolean }) {
  const [search, setSearch] = useState("");

  const pricesQuery = useQuery({
    queryKey: ["/api/prices", "watchlist-search"],
    queryFn: async () => {
      const res = await fetch("/api/prices?page=1&per_page=100");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 60000,
  });

  const allCoins = (pricesQuery.data && Array.isArray(pricesQuery.data)) ? pricesQuery.data : [];
  const filtered = search.length >= 1
    ? allCoins.filter((c: any) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.symbol.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 20)
    : allCoins.slice(0, 20);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search coins to add to watchlist..."
          className="bg-muted/30 border-border pl-10 h-10 text-sm"
          data-testid="input-watchlist-search"
        />
      </div>
      {pricesQuery.isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {filtered.map((coin: any) => {
            const watched = isWatched(coin.id);
            return (
              <button
                key={coin.id}
                onClick={() => !watched && onAdd(coin.id)}
                disabled={watched}
                className={`text-left px-4 py-3 rounded-lg text-sm flex items-center gap-3 transition-all border ${
                  watched
                    ? "bg-primary/5 border-primary/20 opacity-60 cursor-default"
                    : "bg-card/50 border-border hover:border-primary/30 hover:bg-primary/5 cursor-pointer"
                }`}
                data-testid={`button-add-${coin.id}`}
              >
                <img src={coin.image} alt="" className="w-6 h-6 rounded-full" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground truncate">{coin.name}</span>
                    <span className="text-xs uppercase text-muted-foreground">{coin.symbol}</span>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">{formatPrice(coin.current_price)}</span>
                </div>
                {watched ? (
                  <Badge variant="outline" className="text-[10px] border-primary/30 text-primary shrink-0">Watching</Badge>
                ) : (
                  <Star className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function WatchlistPage() {
  const { watchlist, removeFromWatchlist, addToWatchlist, isWatched } = useWatchlist();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"watchlist" | "add">("watchlist");

  const watchlistQuery = useQuery({
    queryKey: ["/api/prices/by-ids", watchlist.join(",")],
    queryFn: async () => {
      if (watchlist.length === 0) return [];
      const res = await fetch(`/api/prices/by-ids?ids=${watchlist.join(",")}`);
      if (!res.ok) throw new Error("Failed to fetch prices");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    refetchInterval: 60000,
    staleTime: 30000,
    enabled: watchlist.length > 0,
  });

  const coins = watchlistQuery.data || [];

  const totalValue = coins.reduce((sum: number, c: any) => sum + (c.market_cap || 0), 0);
  const avgChange = coins.length > 0
    ? coins.reduce((sum: number, c: any) => sum + (c.price_change_percentage_24h || 0), 0) / coins.length
    : 0;

  const handleAdd = (coinId: string) => {
    if (isWatched(coinId)) {
      toast({ title: "Already in watchlist" });
      return;
    }
    addToWatchlist(coinId);
    toast({ title: "Added to watchlist" });
  };

  const handleRemove = (coinId: string, name: string) => {
    removeFromWatchlist(coinId);
    toast({ title: `Removed ${name}` });
  };

  return (
    <div className="min-h-screen bg-background">
      <div
        className="h-72 w-full absolute top-0 left-0 z-0 page-glow"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(0,200,255,0.15) 0%, transparent 70%)",
        }}
      />
      <Navbar />

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-6 pt-8">
        <AdBanner slot="5544332211" format="horizontal" className="w-full mb-6" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3" data-testid="text-page-title">
              <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
              Watchlist
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {watchlist.length > 0
                ? `Tracking ${watchlist.length} coin${watchlist.length !== 1 ? "s" : ""}`
                : "Add cryptocurrencies to monitor their prices"}
            </p>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === "watchlist" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("watchlist")}
            className={activeTab === "watchlist" ? "bg-primary text-primary-foreground" : "border-border text-muted-foreground"}
            data-testid="button-tab-watchlist"
          >
            <Eye className="w-4 h-4 mr-1.5" /> My Watchlist {watchlist.length > 0 && `(${watchlist.length})`}
          </Button>
          <Button
            variant={activeTab === "add" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("add")}
            className={activeTab === "add" ? "bg-primary text-primary-foreground" : "border-border text-muted-foreground"}
            data-testid="button-tab-add"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Add Coins
          </Button>
        </div>

        {activeTab === "add" && (
          <AddCoinSection onAdd={handleAdd} isWatched={isWatched} />
        )}

        {activeTab === "watchlist" && watchlist.length > 0 && coins.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <Card className="glass-panel border-border">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-widest mb-2">
                  <Eye className="w-3.5 h-3.5" /> Watching
                </div>
                <div className="text-2xl font-bold font-display text-foreground" data-testid="text-watchlist-count">
                  {watchlist.length} coin{watchlist.length !== 1 ? "s" : ""}
                </div>
              </CardContent>
            </Card>
            <Card className="glass-panel border-border">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-widest mb-2">
                  {avgChange >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  Avg 24h Change
                </div>
                <div className={`text-2xl font-bold font-display ${avgChange >= 0 ? "text-green-400" : "text-red-400"}`} data-testid="text-avg-change">
                  {avgChange >= 0 ? "+" : ""}{avgChange.toFixed(2)}%
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "watchlist" && watchlist.length === 0 ? (
          <div className="glass-panel p-12 rounded-2xl text-center animate-in fade-in duration-700">
            <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mx-auto mb-6">
              <Star className="w-8 h-8 text-yellow-400" />
            </div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-3" data-testid="text-empty-title">
              Your Watchlist is Empty
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Click the "Add Coins" tab above to start adding cryptocurrencies to your watchlist.
            </p>
            <Button onClick={() => setActiveTab("add")} className="bg-primary" data-testid="button-start-adding">
              <Plus className="w-4 h-4 mr-1.5" /> Add Your First Coin
            </Button>
          </div>
        ) : activeTab === "watchlist" && watchlistQuery.isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
            <div className="text-muted-foreground">Loading watchlist...</div>
          </div>
        ) : activeTab === "watchlist" ? (
          <div className="space-y-3">
            {coins.map((coin: any) => {
              const change24h = coin.price_change_percentage_24h;
              const change7d = coin.price_change_percentage_7d_in_currency;
              return (
                <div
                  key={coin.id}
                  className="glass-panel rounded-xl p-4 md:p-5 hover:bg-muted/20 transition-colors"
                  data-testid={`card-watchlist-${coin.id}`}
                >
                  <div className="flex items-center gap-4">
                    <img src={coin.image} alt="" className="w-10 h-10 rounded-full shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground" data-testid={`text-name-${coin.id}`}>{coin.name}</span>
                        <span className="text-xs text-muted-foreground uppercase" data-testid={`text-symbol-${coin.id}`}>{coin.symbol}</span>
                        {coin.market_cap_rank && (
                          <Badge variant="outline" className="text-[10px] bg-muted/30 border-border text-muted-foreground">
                            #{coin.market_cap_rank}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 flex-wrap">
                        <span className="text-lg font-mono font-bold text-foreground" data-testid={`text-price-${coin.id}`}>
                          {formatPrice(coin.current_price)}
                        </span>
                        <span className={`text-sm font-mono ${(change24h || 0) >= 0 ? "text-green-400" : "text-red-400"}`} data-testid={`text-change24h-${coin.id}`}>
                          {change24h != null ? `${change24h >= 0 ? "+" : ""}${change24h.toFixed(2)}%` : "—"}
                          <span className="text-muted-foreground text-xs ml-1">24h</span>
                        </span>
                        {change7d != null && (
                          <span className={`text-sm font-mono hidden sm:inline ${change7d >= 0 ? "text-green-400" : "text-red-400"}`}>
                            {change7d >= 0 ? "+" : ""}{change7d.toFixed(2)}%
                            <span className="text-muted-foreground text-xs ml-1">7d</span>
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground hidden md:inline">
                          MCap: {coin.market_cap ? formatMarketCap(coin.market_cap) : "—"}
                        </span>
                      </div>
                    </div>
                    <div className="hidden sm:block shrink-0">
                      {coin.sparkline_in_7d?.price && (
                        <MiniSparkline
                          data={coin.sparkline_in_7d.price}
                          positive={(change7d || 0) >= 0}
                        />
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(coin.id, coin.name)}
                      className="text-muted-foreground hover:text-red-400 shrink-0"
                      data-testid={`button-remove-${coin.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        <AdBanner slot="6655443322" format="horizontal" className="w-full mt-6" />
      </div>
      <Footer />
    </div>
  );
}
