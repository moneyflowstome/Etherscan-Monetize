import { useQuery } from "@tanstack/react-query";
import {
  Loader2,
  Server,
  DollarSign,
  TrendingUp,
  Shield,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AdBanner } from "@/components/AdBanner";

function formatUsd(num: number): string {
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
}

export default function MasternodesPage() {
  const mnQuery = useQuery({
    queryKey: ["/api/masternodes"],
    queryFn: async () => {
      const res = await fetch("/api/masternodes");
      if (!res.ok) throw new Error("Failed to fetch masternodes");
      return res.json();
    },
    refetchInterval: 300000,
    staleTime: 120000,
  });

  const coins = mnQuery.data?.coins || [];

  const totalMnValue = coins.reduce((sum: number, c: any) => sum + (c.collateralValueUsd || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <div
        className="h-72 w-full absolute top-0 left-0 z-0 page-glow"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(100,0,255,0.12) 0%, transparent 70%)",
        }}
      />
      <Navbar />

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 pt-8">
        <AdBanner slot="5566778899" format="horizontal" className="w-full mb-6" />

        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3" data-testid="text-page-title">
            <Server className="w-8 h-8 text-primary" />
            Masternode Tracker
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Compare masternode coins, collateral requirements, and estimated ROI
          </p>
        </div>

        {coins.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="glass-panel border-border">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-widest mb-2">
                  <Server className="w-3.5 h-3.5" /> Total Coins Tracked
                </div>
                <div className="text-2xl font-bold font-display text-foreground" data-testid="text-total-coins">{coins.length}</div>
              </CardContent>
            </Card>
            <Card className="glass-panel border-border">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-widest mb-2">
                  <DollarSign className="w-3.5 h-3.5" /> Avg Collateral Cost
                </div>
                <div className="text-2xl font-bold font-display text-foreground" data-testid="text-avg-collateral">
                  {coins.length > 0 ? formatUsd(totalMnValue / coins.length) : "—"}
                </div>
              </CardContent>
            </Card>
            <Card className="glass-panel border-border">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-widest mb-2">
                  <TrendingUp className="w-3.5 h-3.5" /> Best ROI
                </div>
                <div className="text-2xl font-bold font-display text-green-400" data-testid="text-best-roi">
                  {coins.length > 0
                    ? coins.reduce((best: any, c: any) => {
                        const roi = parseFloat(c.estimatedRoi);
                        return roi > parseFloat(best.estimatedRoi) ? c : best;
                      }).estimatedRoi
                    : "—"}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {mnQuery.isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
            <div className="text-muted-foreground">Loading masternode data...</div>
          </div>
        ) : coins.length === 0 ? (
          <div className="glass-panel p-12 rounded-2xl text-center text-muted-foreground">
            No masternode data available right now.
          </div>
        ) : (
          <div className="glass-panel rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[800px]">
                <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="p-4 font-medium">Coin</th>
                    <th className="p-4 font-medium text-right">Price</th>
                    <th className="p-4 font-medium text-right">24h</th>
                    <th className="p-4 font-medium text-right">Collateral</th>
                    <th className="p-4 font-medium text-right">MN Cost (USD)</th>
                    <th className="p-4 font-medium text-right">Est. ROI</th>
                    <th className="p-4 font-medium text-right">Market Cap</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {coins.map((coin: any, i: number) => (
                    <>
                      <tr
                        key={coin.id}
                        className="hover:bg-muted/20 transition-colors"
                        data-testid={`row-mn-${coin.id}`}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {coin.image && (
                              <img src={coin.image} alt="" className="w-7 h-7 rounded-full" />
                            )}
                            <div>
                              <div className="font-medium text-foreground text-sm">{coin.name}</div>
                              <div className="text-xs text-muted-foreground uppercase">{coin.symbol}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-right font-mono text-sm text-foreground">
                          ${coin.currentPrice?.toLocaleString(undefined, { maximumFractionDigits: coin.currentPrice < 1 ? 6 : 2 })}
                        </td>
                        <td className={`p-4 text-right text-sm font-mono ${(coin.priceChange24h || 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {coin.priceChange24h != null ? `${coin.priceChange24h >= 0 ? "+" : ""}${coin.priceChange24h.toFixed(2)}%` : "—"}
                        </td>
                        <td className="p-4 text-right font-mono text-sm text-foreground">
                          {coin.collateral?.toLocaleString()} {coin.symbol?.toUpperCase()}
                        </td>
                        <td className="p-4 text-right font-mono text-sm text-foreground">
                          {formatUsd(coin.collateralValueUsd || 0)}
                        </td>
                        <td className="p-4 text-right">
                          <Badge
                            variant="outline"
                            className={`font-mono ${
                              parseFloat(coin.estimatedRoi) >= 15
                                ? "bg-green-500/10 text-green-400 border-green-500/20"
                                : parseFloat(coin.estimatedRoi) >= 10
                                ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                                : "bg-muted/30 text-foreground border-border"
                            }`}
                          >
                            {coin.estimatedRoi}
                          </Badge>
                        </td>
                        <td className="p-4 text-right font-mono text-sm text-muted-foreground">
                          {coin.marketCap ? formatUsd(coin.marketCap) : "—"}
                        </td>
                      </tr>
                      {i === 4 && (
                        <tr key="infeed-mn-ad">
                          <td colSpan={7} className="p-3">
                            <AdBanner slot="6677889900" format="fluid" layout="in-article" className="w-full" />
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <AdBanner slot="7788990011" format="horizontal" className="w-full mt-6" />

        <div className="glass-panel rounded-2xl p-6 mt-8">
          <h2 className="text-lg font-display font-bold text-foreground mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" /> What is a Masternode?
          </h2>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-muted-foreground">
            <div>
              <p className="mb-3">
                A masternode is a full node on a blockchain network that performs special functions
                like instant transactions, private transactions, and governance voting. In return,
                masternode operators earn a portion of block rewards.
              </p>
              <p>
                To run a masternode, you need to lock a specific amount of coins as collateral.
                This collateral ensures operators have a stake in the network's success.
              </p>
            </div>
            <div>
              <h3 className="text-foreground font-medium mb-2">Key Terms</h3>
              <ul className="space-y-2">
                <li><span className="text-primary font-medium">Collateral:</span> The amount of coins you must hold to operate a masternode</li>
                <li><span className="text-primary font-medium">ROI:</span> Estimated annual return on investment from block rewards</li>
                <li><span className="text-primary font-medium">MN Cost:</span> Current USD value of the required collateral</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
