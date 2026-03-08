import { useQuery } from "@tanstack/react-query";
import {
  Loader2,
  ExternalLink,
  Clock,
  Newspaper,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

export default function NewsPage() {
  const newsQuery = useQuery({
    queryKey: ["/api/news"],
    queryFn: async () => {
      const res = await fetch("/api/news");
      if (!res.ok) throw new Error("Failed to fetch news");
      return res.json();
    },
    refetchInterval: 300000,
    staleTime: 120000,
  });

  const articles = newsQuery.data?.articles || [];

  return (
    <div className="min-h-screen bg-[#060a10]">
      <div
        className="h-72 w-full absolute top-0 left-0 z-0 opacity-20"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(0,200,255,0.15) 0%, transparent 70%)",
        }}
      />
      <Navbar />

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-6 pt-8">
        <AdBanner slot="1122334455" format="horizontal" className="w-full mb-6" />

        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3" data-testid="text-page-title">
            <Newspaper className="w-8 h-8 text-primary" />
            Crypto News
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Latest headlines from the crypto world</p>
        </div>

        {newsQuery.isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
            <div className="text-muted-foreground">Loading news...</div>
          </div>
        ) : articles.length === 0 ? (
          <div className="glass-panel p-12 rounded-2xl text-center text-muted-foreground">
            No news available right now. Check back soon.
          </div>
        ) : (
          <div className="space-y-4">
            {articles.map((article: any, i: number) => (
              <>
                <a
                  key={article.id || i}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block glass-panel rounded-xl overflow-hidden hover:bg-white/[0.03] transition-all group"
                  data-testid={`card-news-${i}`}
                >
                  <div className="flex flex-col md:flex-row">
                    {article.imageUrl && (
                      <div className="md:w-48 h-40 md:h-auto shrink-0 overflow-hidden bg-white/5">
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
                      <div className="flex items-center gap-2 mb-2">
                        {article.source && (
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                            {article.source}
                          </Badge>
                        )}
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {timeAgo(article.publishedAt)}
                        </span>
                      </div>
                      <h2 className="text-lg font-semibold text-white mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {article.title}
                      </h2>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{article.body}</p>
                      {article.tags && article.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {article.tags.slice(0, 4).map((tag: string, ti: number) => (
                            <Badge key={ti} variant="outline" className="bg-white/5 border-white/10 text-muted-foreground text-[9px]">
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
                {i === 4 && (
                  <AdBanner key="infeed-news-ad" slot="2233445566" format="fluid" layout="in-article" className="w-full" />
                )}
                {i === 14 && (
                  <AdBanner key="infeed-news-ad-2" slot="3344556677" format="fluid" layout="in-article" className="w-full" />
                )}
              </>
            ))}
          </div>
        )}

        <AdBanner slot="4455667788" format="horizontal" className="w-full mt-6" />
      </div>
      <Footer />
    </div>
  );
}
