import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Loader2,
  Search,
  Eye,
  Calendar,
  Tag,
  ChevronLeft,
  ChevronRight,
  Star,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AdBanner } from "@/components/AdBanner";
import { BannerRotation } from "@/components/BannerRotation";
import type { BlogPost } from "@shared/schema";

const POSTS_PER_PAGE = 9;

function useBannerBlogEnabled() {
  const { data } = useQuery({
    queryKey: ["banner-settings"],
    queryFn: async () => {
      const res = await fetch("/api/banner-settings");
      if (!res.ok) return {};
      return res.json();
    },
    staleTime: 60000,
  });
  return data?.banner_blog_enabled !== "false";
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const categoryGradients: Record<string, string> = {
  News: "from-blue-600/30 to-cyan-500/20",
  Tutorial: "from-purple-600/30 to-pink-500/20",
  Guide: "from-green-600/30 to-emerald-500/20",
  Analysis: "from-orange-600/30 to-amber-500/20",
  Opinion: "from-red-600/30 to-rose-500/20",
};

const categoryIcons: Record<string, string> = {
  News: "📰",
  Tutorial: "🔧",
  Guide: "📘",
  Analysis: "📊",
  Opinion: "💬",
};

function GradientPlaceholder({ featured, gradient, icon }: { featured: boolean; gradient: string; icon: string }) {
  return (
    <div className={`${featured ? "h-64 md:h-full" : "h-48"} bg-gradient-to-br ${gradient} flex items-center justify-center relative overflow-hidden`}>
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-4 left-4 w-20 h-20 border border-primary/30 rounded-full" />
        <div className="absolute bottom-6 right-6 w-32 h-32 border border-primary/20 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border border-primary/20 rounded-lg rotate-45" />
      </div>
      <span className="text-5xl group-hover:scale-110 transition-transform">{icon}</span>
    </div>
  );
}

function BlogCard({ post, featured = false }: { post: BlogPost; featured?: boolean }) {
  const [imgFailed, setImgFailed] = useState(false);
  const gradient = categoryGradients[post.category || ""] || "from-primary/20 to-cyan-500/10";
  const icon = categoryIcons[post.category || ""] || "📝";
  const showImage = post.coverImage && !imgFailed;

  return (
    <Link href={`/blog/${post.slug}`}>
      <article
        className={`glass-panel rounded-xl overflow-hidden hover:bg-muted/30 transition-all group cursor-pointer ${
          featured ? "md:col-span-2 md:grid md:grid-cols-2" : ""
        }`}
        data-testid={`card-blog-${post.id}`}
      >
        {showImage ? (
          <div className={`${featured ? "h-64 md:h-full" : "h-48"} overflow-hidden bg-muted/30`}>
            <img
              src={post.coverImage!}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImgFailed(true)}
              data-testid={`img-blog-cover-${post.id}`}
            />
          </div>
        ) : (
          <GradientPlaceholder featured={featured} gradient={gradient} icon={icon} />
        )}
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {featured && (
              <Badge variant="default" className="bg-primary/20 text-primary text-xs" data-testid={`badge-featured-${post.id}`}>
                <Star className="w-3 h-3 mr-1" />
                Featured
              </Badge>
            )}
            {post.category && (
              <Badge variant="secondary" className="text-xs" data-testid={`badge-category-${post.id}`}>
                <Tag className="w-3 h-3 mr-1" />
                {post.category}
              </Badge>
            )}
          </div>
          <h2
            className={`font-display font-bold ${featured ? "text-xl md:text-2xl" : "text-lg"} text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2`}
            data-testid={`text-blog-title-${post.id}`}
          >
            {post.title}
          </h2>
          {post.excerpt && (
            <p
              className="text-sm text-muted-foreground mb-4 line-clamp-3"
              data-testid={`text-blog-excerpt-${post.id}`}
            >
              {post.excerpt}
            </p>
          )}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1" data-testid={`text-blog-date-${post.id}`}>
              <Calendar className="w-3 h-3" />
              {formatDate(post.createdAt)}
            </span>
            <span className="flex items-center gap-1" data-testid={`text-blog-views-${post.id}`}>
              <Eye className="w-3 h-3" />
              {(post.views ?? 0).toLocaleString()} views
            </span>
            {post.author && (
              <span className="flex items-center gap-1" data-testid={`text-blog-author-${post.id}`}>
                <BookOpen className="w-3 h-3" />
                {post.author}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}

export default function BlogPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const blogBannersEnabled = useBannerBlogEnabled();

  const { data, isLoading, error } = useQuery<{
    posts: BlogPost[];
    total: number;
    page: number;
    pages: number;
  }>({
    queryKey: [
      `/api/blog?page=${page}&limit=${POSTS_PER_PAGE}${selectedCategory !== "All" ? `&category=${encodeURIComponent(selectedCategory)}` : ""}`,
    ],
  });

  const posts = data?.posts ?? [];
  const totalPages = data?.pages ?? 1;

  const filteredPosts = search
    ? posts.filter((p) =>
        p.title.toLowerCase().includes(search.toLowerCase())
      )
    : posts;

  const featuredPosts = filteredPosts.filter((p) => p.featured);
  const regularPosts = filteredPosts.filter((p) => !p.featured);

  const categories = [
    "All",
    "News",
    "Tutorial",
    "Guide",
    "Analysis",
    "Opinion",
  ];

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="blog-page">
      <Navbar />
      <AdBanner slot="blog-listing-top" format="horizontal" className="w-full mb-6" />

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {blogBannersEnabled && (
          <div className="flex justify-center mb-6">
            <BannerRotation zone="blog-top" size="728x90" />
          </div>
        )}
        <div className="mb-8">
          <h1
            className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2"
            data-testid="text-blog-heading"
          >
            Blog
          </h1>
          <p className="text-muted-foreground" data-testid="text-blog-description">
            Latest insights, analysis, and news from the crypto world
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              data-testid="input-blog-search"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setSelectedCategory(cat);
                setPage(1);
              }}
              className="text-xs"
              data-testid={`button-category-${cat.toLowerCase()}`}
            >
              {cat}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-20 text-muted-foreground" data-testid="text-blog-error">
            Failed to load blog posts. Please try again later.
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-20" data-testid="text-blog-empty">
            <BookOpen className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">No blog posts found</p>
            <p className="text-muted-foreground/70 text-sm mt-1">
              {search
                ? "Try a different search term"
                : "Check back later for new content"}
            </p>
          </div>
        ) : (
          <>
            {featuredPosts.length > 0 && (
              <div className="mb-8">
                <h2 className="font-display text-xl font-semibold text-foreground mb-4 flex items-center gap-2" data-testid="text-featured-heading">
                  <Star className="w-5 h-5 text-primary" />
                  Featured
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {featuredPosts.map((post) => (
                    <BlogCard key={post.id} post={post} featured />
                  ))}
                </div>
              </div>
            )}

            {blogBannersEnabled && (
              <div className="flex justify-center my-6">
                <BannerRotation zone="blog-middle" size="468x60" />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularPosts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>

            {blogBannersEnabled && (
              <div className="flex justify-center mt-6">
                <BannerRotation zone="blog-bottom" size="728x90" />
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-10" data-testid="blog-pagination">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  data-testid="button-blog-prev"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground" data-testid="text-blog-page">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  data-testid="button-blog-next"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
