import { useState } from "react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import {
  Loader2,
  ExternalLink,
  Clock,
  Newspaper,
  Archive,
  ChevronDown,
  Globe,
  Flag,
  Bitcoin,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AdBanner } from "@/components/AdBanner";

function timeAgo(ts: number): string {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

const CRYPTO_CATEGORY_MAP: Record<string, string[]> = {
  "All": [],
  "Market": ["MARKET", "TRADING", "EXCHANGE", "COMMODITY"],
  "Business": ["BUSINESS", "MACROECONOMICS", "FIAT", "REGULATION"],
  "Blockchain": ["BLOCKCHAIN", "TECHNOLOGY", "MINING", "WALLET"],
  "Bitcoin": ["BTC"],
  "Ethereum": ["ETH"],
  "Altcoins": ["ALTCOIN", "SOL", "ADA", "XRP", "DOGE", "SHIB", "BNB", "ARB", "UNI", "GRT", "OKB"],
  "Research": ["RESEARCH", "TOKEN SALE"],
};

const CRYPTO_CATEGORY_KEYS = Object.keys(CRYPTO_CATEGORY_MAP);

function matchesCryptoCategory(article: any, category: string): boolean {
  if (category === "All") return true;
  const cats = (article.categories || "").toUpperCase().split("|").map((c: string) => c.trim());
  const targets = CRYPTO_CATEGORY_MAP[category] || [];
  return targets.some((t) => cats.includes(t));
}

function getCryptoCategoryCounts(articles: any[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const key of CRYPTO_CATEGORY_KEYS) {
    counts[key] = key === "All" ? articles.length : articles.filter((a) => matchesCryptoCategory(a, key)).length;
  }
  return counts;
}

type FeedType = "crypto" | "world" | "usa";

const FEED_TABS: { key: FeedType; label: string; icon: any; description: string }[] = [
  { key: "crypto", label: "Crypto", icon: Bitcoin, description: "Cryptocurrency & blockchain news" },
  { key: "world", label: "World", icon: Globe, description: "International headlines" },
  { key: "usa", label: "USA", icon: Flag, description: "United States news & trending" },
];

function NewsCard({ article, index }: { article: any; index: number }) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block glass-panel rounded-xl overflow-hidden hover:bg-muted/30 transition-all group"
      data-testid={`card-news-${index}`}
    >
      <div className="flex flex-col md:flex-row">
        {article.imageUrl && (
          <div className="md:w-48 h-40 md:h-auto shrink-0 overflow-hidden bg-muted/30">
            <img
              src={article.imageUrl}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}
        <div className="p-5 flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {article.source && (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                {article.source}
              </Badge>
            )}
            {article.categories && (
              <Badge variant="outline" className="bg-muted/30 border-border text-muted-foreground text-[10px]">
                {article.categories.split("|")[0]}
              </Badge>
            )}
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeAgo(article.publishedAt)}
            </span>
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {article.title}
          </h2>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{article.body}</p>
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {article.tags.slice(0, 4).map((tag: string, ti: number) => (
                <Badge key={ti} variant="outline" className="bg-muted/30 border-border text-muted-foreground text-[9px]">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <div className="hidden md:flex items-center pr-5">
          <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </div>
    </a>
  );
}

export default function NewsPage() {
  const [feedType, setFeedType] = useState<FeedType>("crypto");
  const [activeCategory, setActiveCategory] = useState("All");
  const [viewMode, setViewMode] = useState<"latest" | "archive">("latest");

  const cryptoQuery = useQuery({
    queryKey: ["/api/news"],
    queryFn: async () => {
      const res = await fetch("/api/news");
      if (!res.ok) throw new Error("Failed to fetch news");
      return res.json();
    },
    refetchInterval: 300000,
    staleTime: 120000,
  });

  const archiveQuery = useInfiniteQuery({
    queryKey: ["/api/news/archive"],
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      const url = pageParam > 0
        ? `/api/news/archive?before=${pageParam}`
        : "/api/news/archive";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch archive");
      return res.json();
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage: any) => {
      const articles = lastPage?.articles || [];
      if (articles.length === 0) return undefined;
      const oldest = articles[articles.length - 1];
      return oldest?.publishedAt || undefined;
    },
    enabled: feedType === "crypto" && viewMode === "archive",
    staleTime: 120000,
  });

  const worldQuery = useQuery({
    queryKey: ["/api/news/world"],
    queryFn: async () => {
      const res = await fetch("/api/news/world");
      if (!res.ok) throw new Error("Failed to fetch world news");
      return res.json();
    },
    refetchInterval: 600000,
    staleTime: 300000,
    enabled: feedType === "world",
  });

  const usaQuery = useQuery({
    queryKey: ["/api/news/usa"],
    queryFn: async () => {
      const res = await fetch("/api/news/usa");
      if (!res.ok) throw new Error("Failed to fetch USA news");
      return res.json();
    },
    refetchInterval: 600000,
    staleTime: 300000,
    enabled: feedType === "usa",
  });

  const cryptoArticles = cryptoQuery.data?.articles || [];
  const worldArticles = worldQuery.data?.articles || [];
  const usaArticles = usaQuery.data?.articles || [];

  const archiveArticles = (archiveQuery.data?.pages || []).flatMap((p: any) => p.articles || []);
  const seenArchiveIds = new Set<string>();
  const uniqueArchive = archiveArticles.filter((a: any) => {
    const key = String(a.id);
    if (seenArchiveIds.has(key)) return false;
    seenArchiveIds.add(key);
    return true;
  });

  let displayArticles: any[] = [];
  let isLoading = false;
  let pageTitle = "News";
  let pageDescription = "";
  let showCryptoCategories = false;
  let showArchiveToggle = false;

  if (feedType === "crypto") {
    showCryptoCategories = true;
    showArchiveToggle = true;
    const isArchive = viewMode === "archive";
    const source = isArchive ? uniqueArchive : cryptoArticles;
    displayArticles = source.filter((a: any) => matchesCryptoCategory(a, activeCategory));
    isLoading = isArchive ? archiveQuery.isLoading : cryptoQuery.isLoading;
    pageTitle = "Crypto News";
    pageDescription = isArchive
      ? `Archive — ${uniqueArchive.length} articles loaded`
      : "Latest cryptocurrency & blockchain headlines";
  } else if (feedType === "world") {
    displayArticles = worldArticles;
    isLoading = worldQuery.isLoading;
    pageTitle = "World News";
    pageDescription = `${worldArticles.length} articles from international sources`;
  } else if (feedType === "usa") {
    displayArticles = usaArticles;
    isLoading = usaQuery.isLoading;
    pageTitle = "USA News";
    pageDescription = `${usaArticles.length} articles from US sources`;
  }

  const cryptoCounts = getCryptoCategoryCounts(
    viewMode === "archive" ? uniqueArchive : cryptoArticles
  );

  const handleFeedChange = (feed: FeedType) => {
    setFeedType(feed);
    setActiveCategory("All");
    if (feed !== "crypto") setViewMode("latest");
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
        <AdBanner slot="1122334455" format="horizontal" className="w-full mb-6" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3" data-testid="text-page-title">
              <Newspaper className="w-8 h-8 text-primary" />
              {pageTitle}
            </h1>
            <p className="text-muted-foreground text-sm mt-1" data-testid="text-page-description">
              {pageDescription}
            </p>
          </div>

          {showArchiveToggle && (
            <div className="flex gap-2">
              <Button
                variant={viewMode === "latest" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("latest")}
                className={
                  viewMode === "latest"
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 text-xs"
                    : "bg-muted/30 border-border text-muted-foreground hover:text-foreground text-xs"
                }
                data-testid="button-view-latest"
              >
                <Newspaper className="w-3.5 h-3.5 mr-1.5" />
                Latest
                <Badge variant="secondary" className="ml-1.5 bg-background/20 text-[10px] px-1.5 py-0" data-testid="text-latest-count">
                  {cryptoArticles.length}
                </Badge>
              </Button>
              <Button
                variant={viewMode === "archive" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("archive")}
                className={
                  viewMode === "archive"
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 text-xs"
                    : "bg-muted/30 border-border text-muted-foreground hover:text-foreground text-xs"
                }
                data-testid="button-view-archive"
              >
                <Archive className="w-3.5 h-3.5 mr-1.5" />
                Archive
                {uniqueArchive.length > 0 && viewMode === "archive" && (
                  <Badge variant="secondary" className="ml-1.5 bg-background/20 text-[10px] px-1.5 py-0" data-testid="text-archive-count">
                    {uniqueArchive.length}
                  </Badge>
                )}
              </Button>
            </div>
          )}
        </div>

        <div className="flex gap-2 flex-wrap mb-5" data-testid="news-feed-tabs">
          {FEED_TABS.map((tab) => {
            const Icon = tab.icon;
            const count =
              tab.key === "crypto" ? cryptoArticles.length
              : tab.key === "world" ? worldArticles.length
              : usaArticles.length;
            return (
              <Button
                key={tab.key}
                variant={feedType === tab.key ? "default" : "outline"}
                size="sm"
                onClick={() => handleFeedChange(tab.key)}
                className={
                  feedType === tab.key
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 text-xs"
                    : "bg-muted/30 border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 text-xs"
                }
                data-testid={`button-feed-${tab.key}`}
              >
                <Icon className="w-3.5 h-3.5 mr-1.5" />
                {tab.label}
                {count > 0 && (
                  <span className="ml-1 text-[10px] opacity-70">({count})</span>
                )}
              </Button>
            );
          })}
        </div>

        {showCryptoCategories && (
          <div className="flex gap-2 flex-wrap mb-6" data-testid="news-category-tabs">
            {CRYPTO_CATEGORY_KEYS.map((cat) => (
              <Button
                key={cat}
                variant={activeCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(cat)}
                className={
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 text-xs"
                    : "bg-muted/30 border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 text-xs"
                }
                data-testid={`button-category-${cat.toLowerCase().replace(" ", "-")}`}
              >
                {cat}
                <span className="ml-1 text-[10px] opacity-70">({cryptoCounts[cat] || 0})</span>
              </Button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
            <div className="text-muted-foreground">Loading news...</div>
          </div>
        ) : displayArticles.length === 0 ? (
          <div className="glass-panel p-12 rounded-2xl text-center text-muted-foreground">
            {feedType === "crypto" && activeCategory !== "All"
              ? `No ${activeCategory} news right now. Try another category.`
              : "No news available right now. Check back soon."}
          </div>
        ) : (
          <div className="space-y-4">
            {displayArticles.map((article: any, i: number) => (
              <div key={article.id || i}>
                <NewsCard article={article} index={i} />
                {i === 4 && (
                  <AdBanner slot="2233445566" format="fluid" layout="in-article" className="w-full mt-4" />
                )}
                {i === 14 && (
                  <AdBanner slot="3344556677" format="fluid" layout="in-article" className="w-full mt-4" />
                )}
              </div>
            ))}

            {feedType === "crypto" && viewMode === "archive" && archiveQuery.hasNextPage && (
              <div className="text-center py-6">
                <Button
                  variant="outline"
                  onClick={() => archiveQuery.fetchNextPage()}
                  disabled={archiveQuery.isFetchingNextPage}
                  className="bg-muted/30 border-border text-foreground hover:bg-muted/50"
                  data-testid="button-load-more"
                >
                  {archiveQuery.isFetchingNextPage ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading more...
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-2" />
                      Load More Articles
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        <AdBanner slot="4455667788" format="horizontal" className="w-full mt-6" />
      </div>
      <Footer />
    </div>
  );
}
