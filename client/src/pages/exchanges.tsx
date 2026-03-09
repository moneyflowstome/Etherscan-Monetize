import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  ExternalLink,
  Star,
  Loader2,
  ArrowUpDown,
  Globe,
  Calendar,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AdBanner } from "@/components/AdBanner";

type Exchange = {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  url: string;
  affiliateUrl: string | null;
  description: string | null;
  type: string;
  country: string | null;
  year: number | null;
  tradingPairs: number | null;
  featured: boolean | null;
  active: boolean | null;
  sortOrder: number | null;
};

type FilterType = "all" | "centralized" | "decentralized";

export default function ExchangesPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  const { data: exchanges, isLoading } = useQuery<Exchange[]>({
    queryKey: ["exchanges"],
    queryFn: async () => {
      const res = await fetch("/api/exchanges");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const filtered = (exchanges || []).filter((ex) => {
    if (filter !== "all" && ex.type !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return ex.name.toLowerCase().includes(q) || (ex.description || "").toLowerCase().includes(q) || (ex.country || "").toLowerCase().includes(q);
    }
    return true;
  });

  const featured = filtered.filter((ex) => ex.featured);
  const regular = filtered.filter((ex) => !ex.featured);

  const cexCount = (exchanges || []).filter((e) => e.type === "centralized").length;
  const dexCount = (exchanges || []).filter((e) => e.type === "decentralized").length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold tracking-wider" data-testid="text-exchanges-title">
              Crypto Exchanges
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Browse {exchanges?.length || 0} cryptocurrency exchanges — CEX and DEX
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs border-primary/30 text-primary">{cexCount} CEX</Badge>
            <Badge variant="outline" className="text-xs border-purple-400/30 text-purple-400">{dexCount} DEX</Badge>
          </div>
        </div>

        <AdBanner slot="leaderboard" className="mb-4" />

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search exchanges..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card border-border"
              data-testid="input-exchange-search"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "centralized", "decentralized"] as FilterType[]).map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(f)}
                className={filter === f ? "bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground"}
                data-testid={`button-filter-${f}`}
              >
                {f === "all" ? "All" : f === "centralized" ? "CEX" : "DEX"}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-panel p-8 text-center">
            <p className="text-muted-foreground">
              {(exchanges || []).length === 0
                ? "No exchanges listed yet. The admin can add exchanges from the admin panel."
                : "No exchanges match your search."}
            </p>
          </div>
        ) : (
          <>
            {featured.length > 0 && (
              <div className="space-y-3">
                <h2 className="font-display font-semibold text-sm text-primary flex items-center gap-2" data-testid="text-featured-heading">
                  <Star className="w-4 h-4" /> Featured Exchanges
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {featured.map((ex) => (
                    <ExchangeCard key={ex.id} exchange={ex} isFeatured />
                  ))}
                </div>
              </div>
            )}

            {regular.length > 0 && (
              <div className="space-y-3">
                {featured.length > 0 && (
                  <h2 className="font-display font-semibold text-sm text-muted-foreground flex items-center gap-2" data-testid="text-all-heading">
                    <ArrowUpDown className="w-4 h-4" /> All Exchanges
                  </h2>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {regular.map((ex) => (
                    <ExchangeCard key={ex.id} exchange={ex} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <AdBanner slot="rectangle" className="mt-6" />
      </main>
      <Footer />
    </div>
  );
}

function ExchangeCard({ exchange, isFeatured = false }: { exchange: Exchange; isFeatured?: boolean }) {
  const visitUrl = exchange.affiliateUrl || exchange.url;

  return (
    <Card
      className={`glass-panel transition-all hover:scale-[1.02] hover:shadow-lg ${
        isFeatured ? "border-primary/30 bg-primary/5" : "border-border/50"
      }`}
      data-testid={`card-exchange-${exchange.slug}`}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${
              isFeatured ? "bg-primary/20 text-primary" : "bg-muted/50 text-foreground"
            }`}>
              {exchange.logo ? (
                <img src={exchange.logo} alt={exchange.name} className="w-7 h-7 rounded" />
              ) : (
                exchange.name.charAt(0)
              )}
            </div>
            <div>
              <h3 className="font-display font-semibold text-foreground flex items-center gap-2" data-testid={`text-exchange-name-${exchange.slug}`}>
                {exchange.name}
                {isFeatured && <Star className="w-3.5 h-3.5 text-primary fill-primary" />}
              </h3>
              <Badge
                variant="outline"
                className={`text-[10px] ${
                  exchange.type === "decentralized"
                    ? "text-purple-400 border-purple-400/30"
                    : "text-primary border-primary/30"
                }`}
              >
                {exchange.type === "decentralized" ? "DEX" : "CEX"}
              </Badge>
            </div>
          </div>
        </div>

        {exchange.description && (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2" data-testid={`text-exchange-desc-${exchange.slug}`}>
            {exchange.description}
          </p>
        )}

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground mb-4">
          {exchange.country && (
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3" /> {exchange.country}
            </span>
          )}
          {exchange.year && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Est. {exchange.year}
            </span>
          )}
          {exchange.tradingPairs && (
            <span className="flex items-center gap-1">
              <BarChart3 className="w-3 h-3" /> {exchange.tradingPairs.toLocaleString()} pairs
            </span>
          )}
        </div>

        <a
          href={visitUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
          data-testid={`link-visit-${exchange.slug}`}
        >
          <Button
            size="sm"
            className={`w-full ${isFeatured ? "bg-primary hover:bg-primary/90" : "bg-muted/50 hover:bg-muted text-foreground border border-border"}`}
          >
            Visit Exchange <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </a>
      </CardContent>
    </Card>
  );
}
