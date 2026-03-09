import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AdBanner } from "@/components/AdBanner";
import { Loader2, TrendingUp, TrendingDown, ExternalLink, ArrowUpRight, ArrowDownRight, Coins, BarChart3, Newspaper, Shield, Info, Clock, DollarSign, Scale } from "lucide-react";

function safeUrl(url: string | undefined | null): string {
  if (!url) return "#";
  try {
    const u = new URL(url);
    if (u.protocol === "http:" || u.protocol === "https:") return url;
  } catch {}
  return "#";
}

function formatCurrency(n: number | null | undefined, decimals = 2): string {
  if (n == null) return "$0.00";
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  return `$${n.toFixed(decimals)}`;
}

function PriceChange({ value }: { value: number | null | undefined }) {
  if (value == null) return <span className="text-muted-foreground text-xs">--</span>;
  const isUp = value >= 0;
  return (
    <span className={`flex items-center gap-0.5 text-xs font-medium ${isUp ? "text-green-400" : "text-red-400"}`}>
      {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {Math.abs(value).toFixed(2)}%
    </span>
  );
}

function SpotPriceCard({ title, icon, price, bid, ask, unit, color, loading }: any) {
  return (
    <div className={`glass-panel rounded-xl p-5 border-t-2 ${color}`} data-testid={`card-${title.toLowerCase().replace(/\s/g, "-")}-spot`}>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="text-sm uppercase tracking-widest text-muted-foreground font-medium">{title}</h3>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : price ? (
        <div>
          <div className="text-3xl font-bold text-foreground mb-2" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            ${price.toFixed(2)}
          </div>
          <div className="text-xs text-muted-foreground">per {unit}</div>
          <div className="flex gap-4 mt-3 text-xs">
            <div>
              <span className="text-muted-foreground">Bid: </span>
              <span className="text-green-400">${bid?.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Ask: </span>
              <span className="text-red-400">${ask?.toFixed(2)}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground py-4">Price unavailable</div>
      )}
    </div>
  );
}

function GoldCalculator({ goldPrice }: { goldPrice: number | null }) {
  const [grams, setGrams] = useState("1");
  const [unit, setUnit] = useState<"grams" | "oz" | "kg">("oz");

  if (!goldPrice) return null;

  const gramsPerOz = 31.1035;
  let pricePerUnit = goldPrice;
  let unitLabel = "troy oz";
  if (unit === "grams") {
    pricePerUnit = goldPrice / gramsPerOz;
    unitLabel = "gram";
  } else if (unit === "kg") {
    pricePerUnit = (goldPrice / gramsPerOz) * 1000;
    unitLabel = "kg";
  }

  const amount = parseFloat(grams) || 0;
  const total = amount * pricePerUnit;

  return (
    <div className="glass-panel rounded-xl p-5" data-testid="gold-calculator">
      <h3 className="text-sm uppercase tracking-widest text-muted-foreground font-medium flex items-center gap-2 mb-4">
        <Scale className="w-4 h-4 text-yellow-400" />
        Gold Calculator
      </h3>
      <div className="flex gap-2 mb-3">
        {(["oz", "grams", "kg"] as const).map((u) => (
          <button
            key={u}
            onClick={() => setUnit(u)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-all ${unit === u ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" : "bg-card/50 text-muted-foreground border border-border hover:border-yellow-500/30"}`}
            data-testid={`button-unit-${u}`}
          >
            {u === "oz" ? "Troy Oz" : u === "grams" ? "Grams" : "Kilograms"}
          </button>
        ))}
      </div>
      <div className="flex gap-2 items-center">
        <input
          type="number"
          value={grams}
          onChange={(e) => setGrams(e.target.value)}
          min="0"
          step="0.01"
          className="flex-1 bg-card/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
          placeholder="Amount"
          data-testid="input-gold-amount"
        />
        <span className="text-xs text-muted-foreground">{unitLabel}</span>
      </div>
      <div className="mt-3 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
        <div className="text-xs text-muted-foreground mb-1">Value in USD</div>
        <div className="text-xl font-bold text-yellow-400" style={{ fontFamily: "'Orbitron', sans-serif" }} data-testid="text-gold-value">
          ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="text-[10px] text-muted-foreground mt-1">
          @ ${pricePerUnit.toFixed(2)} / {unitLabel}
        </div>
      </div>
    </div>
  );
}

function GoldFactsCard() {
  return (
    <div className="glass-panel rounded-xl p-5" data-testid="gold-facts">
      <h3 className="text-sm uppercase tracking-widest text-muted-foreground font-medium flex items-center gap-2 mb-4">
        <Info className="w-4 h-4 text-yellow-400" />
        Gold Facts
      </h3>
      <div className="space-y-3 text-xs text-muted-foreground">
        <div className="flex gap-2">
          <Shield className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
          <p>Gold has been a store of value for over 5,000 years, surviving every currency collapse in history.</p>
        </div>
        <div className="flex gap-2">
          <Coins className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
          <p>Tokenized gold allows fractional ownership of real gold, stored in insured vaults, tradable 24/7 on blockchain.</p>
        </div>
        <div className="flex gap-2">
          <BarChart3 className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
          <p>The total above-ground gold stock is approximately 212,582 tonnes, worth over $14 trillion.</p>
        </div>
        <div className="flex gap-2">
          <DollarSign className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
          <p>Leading tokenized gold tokens like PAXG and XAUT are backed 1:1 by physical gold bars in London vaults.</p>
        </div>
      </div>
    </div>
  );
}

function MarketOverview({ tokens }: { tokens: any[] }) {
  const totalMcap = tokens.reduce((sum: number, t: any) => sum + (t.market_cap || 0), 0);
  const totalVol = tokens.reduce((sum: number, t: any) => sum + (t.total_volume || 0), 0);
  const topToken = tokens[0];
  const avgChange24h = tokens.length > 0
    ? tokens.reduce((sum: number, t: any) => sum + (t.price_change_percentage_24h || 0), 0) / tokens.length
    : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="gold-market-overview">
      <div className="glass-panel rounded-xl p-4 text-center">
        <div className="text-xs text-muted-foreground mb-1">Total Market Cap</div>
        <div className="text-lg font-bold text-foreground" style={{ fontFamily: "'Orbitron', sans-serif" }}>
          {formatCurrency(totalMcap)}
        </div>
      </div>
      <div className="glass-panel rounded-xl p-4 text-center">
        <div className="text-xs text-muted-foreground mb-1">24h Volume</div>
        <div className="text-lg font-bold text-foreground" style={{ fontFamily: "'Orbitron', sans-serif" }}>
          {formatCurrency(totalVol)}
        </div>
      </div>
      <div className="glass-panel rounded-xl p-4 text-center">
        <div className="text-xs text-muted-foreground mb-1">Dominant Token</div>
        <div className="text-lg font-bold text-yellow-400" style={{ fontFamily: "'Orbitron', sans-serif" }}>
          {topToken?.symbol?.toUpperCase() || "--"}
        </div>
      </div>
      <div className="glass-panel rounded-xl p-4 text-center">
        <div className="text-xs text-muted-foreground mb-1">Avg 24h Change</div>
        <div className={`text-lg font-bold ${avgChange24h >= 0 ? "text-green-400" : "text-red-400"}`} style={{ fontFamily: "'Orbitron', sans-serif" }}>
          {avgChange24h >= 0 ? "+" : ""}{avgChange24h.toFixed(2)}%
        </div>
      </div>
    </div>
  );
}

export default function GoldPage() {
  const [tab, setTab] = useState<"tokens" | "about" | "news">("tokens");

  const goldSpotQuery = useQuery({
    queryKey: ["gold-spot"],
    queryFn: async () => {
      const res = await fetch("/api/gold/spot");
      if (!res.ok) throw new Error("Failed to fetch gold price");
      return res.json();
    },
    staleTime: 30000,
    refetchInterval: 60000,
  });

  const silverSpotQuery = useQuery({
    queryKey: ["silver-spot"],
    queryFn: async () => {
      const res = await fetch("/api/gold/silver-spot");
      if (!res.ok) throw new Error("Failed to fetch silver price");
      return res.json();
    },
    staleTime: 30000,
    refetchInterval: 60000,
  });

  const tokensQuery = useQuery({
    queryKey: ["gold-tokens"],
    queryFn: async () => {
      const res = await fetch("/api/gold/tokens");
      if (!res.ok) throw new Error("Failed to fetch gold tokens");
      return res.json();
    },
    staleTime: 120000,
    refetchInterval: 300000,
  });

  const newsQuery = useQuery({
    queryKey: ["gold-news"],
    queryFn: async () => {
      const res = await fetch("/api/gold/news");
      if (!res.ok) throw new Error("Failed to fetch gold news");
      return res.json();
    },
    staleTime: 300000,
    enabled: tab === "news",
  });

  const tokens = Array.isArray(tokensQuery.data) ? tokensQuery.data : [];
  const news = Array.isArray(newsQuery.data) ? newsQuery.data : [];
  const goldPrice = goldSpotQuery.data?.price || null;
  const silverPrice = silverSpotQuery.data?.price || null;

  const goldSilverRatio = goldPrice && silverPrice ? (goldPrice / silverPrice).toFixed(1) : null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <AdBanner slot="0123456789" format="horizontal" className="w-full mb-4" />

        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3" style={{ fontFamily: "'Orbitron', sans-serif" }} data-testid="heading-gold">
            <span className="text-yellow-400 text-3xl">&#9733;</span>
            Gold & Precious Metals
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Live gold & silver prices, tokenized gold assets, calculator, and market data
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <SpotPriceCard
            title="Gold Spot"
            icon={<span className="text-2xl">&#129689;</span>}
            price={goldPrice}
            bid={goldSpotQuery.data?.bid}
            ask={goldSpotQuery.data?.ask}
            unit="troy ounce"
            color="border-t-yellow-500"
            loading={goldSpotQuery.isLoading}
          />
          <SpotPriceCard
            title="Silver Spot"
            icon={<span className="text-2xl">&#9898;</span>}
            price={silverPrice}
            bid={silverSpotQuery.data?.bid}
            ask={silverSpotQuery.data?.ask}
            unit="troy ounce"
            color="border-t-slate-400"
            loading={silverSpotQuery.isLoading}
          />
          <div className="glass-panel rounded-xl p-5 border-t-2 border-t-yellow-600" data-testid="card-gold-silver-ratio">
            <div className="flex items-center gap-2 mb-3">
              <Scale className="w-5 h-5 text-yellow-500" />
              <h3 className="text-sm uppercase tracking-widest text-muted-foreground font-medium">Gold/Silver Ratio</h3>
            </div>
            {goldSpotQuery.isLoading || silverSpotQuery.isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : goldSilverRatio ? (
              <div>
                <div className="text-3xl font-bold text-yellow-500" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                  {goldSilverRatio}:1
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  1 oz gold = {goldSilverRatio} oz silver
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground py-4">Unavailable</div>
            )}
          </div>
          <div className="glass-panel rounded-xl p-5 border-t-2 border-t-primary" data-testid="card-tokenized-market">
            <div className="flex items-center gap-2 mb-3">
              <Coins className="w-5 h-5 text-primary" />
              <h3 className="text-sm uppercase tracking-widest text-muted-foreground font-medium">Tokenized Gold</h3>
            </div>
            {tokensQuery.isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <div>
                <div className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                  {tokens.length}
                </div>
                <div className="text-xs text-muted-foreground">tokens tracked</div>
                <div className="text-xs text-muted-foreground mt-2">
                  Total MCap: {formatCurrency(tokens.reduce((s: number, t: any) => s + (t.market_cap || 0), 0))}
                </div>
              </div>
            )}
          </div>
        </div>

        <GoldCalculator goldPrice={goldPrice} />

        <div className="my-6">
          <MarketOverview tokens={tokens} />
        </div>

        <div className="flex gap-2 mb-4 border-b border-border pb-2">
          {([
            { key: "tokens" as const, label: "Gold-Backed Tokens", icon: <Coins className="w-4 h-4" /> },
            { key: "news" as const, label: "Gold News", icon: <Newspaper className="w-4 h-4" /> },
            { key: "about" as const, label: "About Tokenized Gold", icon: <Info className="w-4 h-4" /> },
          ]).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg transition-all ${tab === t.key ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30" : "text-muted-foreground hover:text-foreground hover:bg-card/50"}`}
              data-testid={`tab-${t.key}`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {tab === "tokens" && (
          <div>
            {tokensQuery.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : tokens.length === 0 ? (
              <div className="glass-panel rounded-xl p-8 text-center text-muted-foreground">
                No gold-backed tokens found
              </div>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm" data-testid="table-gold-tokens">
                    <thead>
                      <tr className="text-xs text-muted-foreground border-b border-border">
                        <th className="text-left py-3 px-2">#</th>
                        <th className="text-left py-3 px-2">Token</th>
                        <th className="text-right py-3 px-2">Price</th>
                        <th className="text-right py-3 px-2">1h</th>
                        <th className="text-right py-3 px-2">24h</th>
                        <th className="text-right py-3 px-2">7d</th>
                        <th className="text-right py-3 px-2">Market Cap</th>
                        <th className="text-right py-3 px-2">Volume (24h)</th>
                        <th className="text-right py-3 px-2">7d Chart</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tokens.map((token: any, i: number) => (
                        <tr key={token.id} className="border-b border-border/50 hover:bg-card/30 transition-colors" data-testid={`row-gold-token-${token.id}`}>
                          <td className="py-3 px-2 text-muted-foreground">{i + 1}</td>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              {token.image && <img src={token.image} alt={token.name} className="w-6 h-6 rounded-full" />}
                              <div>
                                <div className="font-medium text-foreground">{token.name}</div>
                                <div className="text-xs text-muted-foreground uppercase">{token.symbol}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-right font-medium">{formatCurrency(token.current_price)}</td>
                          <td className="py-3 px-2 text-right">
                            <PriceChange value={token.price_change_percentage_1h_in_currency} />
                          </td>
                          <td className="py-3 px-2 text-right">
                            <PriceChange value={token.price_change_percentage_24h_in_currency} />
                          </td>
                          <td className="py-3 px-2 text-right">
                            <PriceChange value={token.price_change_percentage_7d_in_currency} />
                          </td>
                          <td className="py-3 px-2 text-right text-muted-foreground">{formatCurrency(token.market_cap)}</td>
                          <td className="py-3 px-2 text-right text-muted-foreground">{formatCurrency(token.total_volume)}</td>
                          <td className="py-3 px-2">
                            {Array.isArray(token.sparkline_in_7d?.price) && token.sparkline_in_7d.price.length > 1 && (
                              <svg viewBox="0 0 100 30" className="w-20 h-8 ml-auto">
                                <polyline
                                  fill="none"
                                  stroke={
                                    token.sparkline_in_7d.price[token.sparkline_in_7d.price.length - 1] >= token.sparkline_in_7d.price[0]
                                      ? "#4ade80" : "#f87171"
                                  }
                                  strokeWidth="1.5"
                                  points={(() => {
                                    const pts = token.sparkline_in_7d.price;
                                    const min = Math.min(...pts);
                                    const max = Math.max(...pts);
                                    const range = max - min || 1;
                                    return pts.map((p: number, j: number) =>
                                      `${(j / (pts.length - 1)) * 100},${30 - ((p - min) / range) * 28}`
                                    ).join(" ");
                                  })()}
                                />
                              </svg>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="md:hidden space-y-3">
                  {tokens.map((token: any, i: number) => (
                    <div key={token.id} className="glass-panel rounded-xl p-4" data-testid={`card-gold-token-${token.id}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-5">{i + 1}</span>
                          {token.image && <img src={token.image} alt={token.name} className="w-6 h-6 rounded-full" />}
                          <div>
                            <div className="font-medium text-sm text-foreground">{token.name}</div>
                            <div className="text-xs text-muted-foreground uppercase">{token.symbol}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-sm">{formatCurrency(token.current_price)}</div>
                          <PriceChange value={token.price_change_percentage_24h_in_currency} />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs mt-2 pt-2 border-t border-border/50">
                        <div>
                          <span className="text-muted-foreground">MCap</span>
                          <div className="text-foreground">{formatCurrency(token.market_cap)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Vol</span>
                          <div className="text-foreground">{formatCurrency(token.total_volume)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">7d</span>
                          <div><PriceChange value={token.price_change_percentage_7d_in_currency} /></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {tab === "news" && (
          <div>
            {newsQuery.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : news.length === 0 ? (
              <div className="glass-panel rounded-xl p-8 text-center text-muted-foreground">
                No gold-related news available at this time
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="grid-gold-news">
                {news.map((article: any, i: number) => (
                  <a
                    key={i}
                    href={safeUrl(article.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass-panel rounded-xl overflow-hidden hover:border-yellow-500/30 transition-all group"
                    data-testid={`card-gold-news-${i}`}
                  >
                    {article.imageUrl && (
                      <div className="h-40 overflow-hidden">
                        <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                    )}
                    <div className="p-4">
                      <h4 className="text-sm font-medium text-foreground mb-2 line-clamp-2 group-hover:text-yellow-400 transition-colors">
                        {article.title}
                      </h4>
                      {article.body && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{article.body}</p>
                      )}
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        {article.source && <span className="bg-card/50 px-2 py-0.5 rounded">{article.source}</span>}
                        {article.publishedAt && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(article.publishedAt * 1000).toLocaleDateString()}
                          </span>
                        )}
                        <ExternalLink className="w-3 h-3 ml-auto" />
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "about" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-testid="section-about-gold">
            <GoldFactsCard />
            <div className="glass-panel rounded-xl p-5">
              <h3 className="text-sm uppercase tracking-widest text-muted-foreground font-medium flex items-center gap-2 mb-4">
                <Shield className="w-4 h-4 text-yellow-400" />
                Top Gold-Backed Tokens
              </h3>
              <div className="space-y-4 text-xs text-muted-foreground">
                <div>
                  <h4 className="text-yellow-400 font-medium text-sm mb-1">PAX Gold (PAXG)</h4>
                  <p>Issued by Paxos Trust Company, each PAXG token represents one fine troy ounce of a London Good Delivery gold bar stored in Brink's vaults. Regulated by the New York State Department of Financial Services (NYDFS).</p>
                </div>
                <div>
                  <h4 className="text-yellow-400 font-medium text-sm mb-1">Tether Gold (XAUT)</h4>
                  <p>Each XAUT token represents ownership of one troy fine ounce of physical gold held in a Swiss vault. Issued by TG Commodities Limited, a company in the Tether group.</p>
                </div>
                <div>
                  <h4 className="text-yellow-400 font-medium text-sm mb-1">Kinesis Gold (KAU)</h4>
                  <p>Each KAU represents 1 gram of fine gold. Kinesis offers a yield system where holders earn passive income from the velocity of their gold-backed tokens.</p>
                </div>
                <div>
                  <h4 className="text-yellow-400 font-medium text-sm mb-1">Comtech Gold (CGO)</h4>
                  <p>Each CGO token represents 1 gram of physical gold stored in vaults audited by Bureau Veritas. Built on the XDC Network for low-cost transfers.</p>
                </div>
              </div>
            </div>
            <div className="glass-panel rounded-xl p-5 md:col-span-2">
              <h3 className="text-sm uppercase tracking-widest text-muted-foreground font-medium flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-yellow-400" />
                Why Tokenized Gold?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted-foreground">
                <div className="p-3 bg-card/30 rounded-lg border border-border">
                  <h4 className="text-yellow-400 font-medium mb-2">Accessibility</h4>
                  <p>Buy as little as 0.01 grams of gold. No need for vault storage, insurance, or physical handling. Trade 24/7 globally on decentralized and centralized exchanges.</p>
                </div>
                <div className="p-3 bg-card/30 rounded-lg border border-border">
                  <h4 className="text-yellow-400 font-medium mb-2">Transparency</h4>
                  <p>Blockchain provides immutable proof of ownership. Regular third-party audits verify physical reserves. Real-time redemption options for physical gold available with major issuers.</p>
                </div>
                <div className="p-3 bg-card/30 rounded-lg border border-border">
                  <h4 className="text-yellow-400 font-medium mb-2">DeFi Integration</h4>
                  <p>Use tokenized gold as collateral in lending protocols. Provide liquidity in DEX pools. Earn yield while maintaining gold exposure through DeFi strategies.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}