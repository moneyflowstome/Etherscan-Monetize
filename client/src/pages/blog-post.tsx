import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import {
  Loader2,
  Eye,
  Calendar,
  Tag,
  ArrowLeft,
  BookOpen,
} from "lucide-react";
import { SocialShareButton } from "@/components/SocialShare";
import DOMPurify from "dompurify";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AdBanner } from "@/components/AdBanner";
import type { BlogPost } from "@shared/schema";

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function ShareButtons({ post }: { post: BlogPost }) {
  return (
    <div className="flex items-center gap-2" data-testid="share-buttons">
      <SocialShareButton
        url={window.location.href}
        title={post.title}
        description={post.excerpt || post.metaDescription || ""}
      />
    </div>
  );
}

function RelatedPosts({ currentSlug, category }: { currentSlug: string; category?: string | null }) {
  const { data } = useQuery<{
    posts: BlogPost[];
    total: number;
    page: number;
    totalPages: number;
  }>({
    queryKey: [
      `/api/blog?limit=4${category ? `&category=${encodeURIComponent(category)}` : ""}`,
    ],
  });

  const related = (data?.posts ?? []).filter((p) => p.slug !== currentSlug).slice(0, 3);

  if (related.length === 0) return null;

  return (
    <div className="mt-12" data-testid="related-posts">
      <h3 className="font-display text-xl font-semibold text-foreground mb-6">
        Related Posts
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {related.map((post) => (
          <Link key={post.id} href={`/blog/${post.slug}`}>
            <article
              className="glass-panel rounded-xl overflow-hidden hover:bg-muted/30 transition-all group cursor-pointer"
              data-testid={`card-related-${post.id}`}
            >
              {post.coverImage ? (
                <div className="h-36 overflow-hidden bg-muted/30">
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              ) : (
                <div className="h-36 bg-gradient-to-br from-primary/20 to-cyan-500/10 flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-primary/50" />
                </div>
              )}
              <div className="p-4">
                <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2" data-testid={`text-related-title-${post.id}`}>
                  {post.title}
                </h4>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(post.createdAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {(post.views ?? 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function BlogPostPage() {
  const [, params] = useRoute("/blog/:slug");
  const slug = params?.slug ?? "";

  const { data: post, isLoading, error } = useQuery<BlogPost>({
    queryKey: [`/api/blog/${slug}`],
    enabled: !!slug,
  });

  useEffect(() => {
    if (post) {
      document.title = post.metaTitle || post.title;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc && post.metaDescription) {
        metaDesc.setAttribute("content", post.metaDescription);
      }
    }
  }, [post]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-20 text-center">
          <BookOpen className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2" data-testid="text-post-not-found">
            Post Not Found
          </h1>
          <p className="text-muted-foreground mb-6">
            The blog post you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/blog">
            <Button data-testid="button-back-to-blog">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="blog-post-page">
      <Navbar />
      <AdBanner slot="blog-post-top" format="horizontal" className="w-full mb-6" />

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <Link href="/blog">
          <Button variant="ghost" size="sm" className="mb-6 text-muted-foreground" data-testid="button-back-blog">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Button>
        </Link>

        {post.coverImage && (
          <div className="rounded-xl overflow-hidden mb-8 max-h-96 bg-muted/30">
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-full object-cover"
              data-testid="img-post-cover"
            />
          </div>
        )}

        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {post.category && (
            <Badge variant="secondary" className="text-xs" data-testid="badge-post-category">
              <Tag className="w-3 h-3 mr-1" />
              {post.category}
            </Badge>
          )}
          {post.tags?.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs" data-testid={`badge-tag-${tag}`}>
              {tag}
            </Badge>
          ))}
        </div>

        <h1
          className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4"
          data-testid="text-post-title"
        >
          {post.title}
        </h1>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6 flex-wrap">
          {post.author && (
            <span className="flex items-center gap-1" data-testid="text-post-author">
              <BookOpen className="w-4 h-4" />
              {post.author}
            </span>
          )}
          <span className="flex items-center gap-1" data-testid="text-post-date">
            <Calendar className="w-4 h-4" />
            {formatDate(post.createdAt)}
          </span>
          <span className="flex items-center gap-1" data-testid="text-post-views">
            <Eye className="w-4 h-4" />
            {(post.views ?? 0).toLocaleString()} views
          </span>
        </div>

        <div className="mb-8">
          <ShareButtons post={post} />
        </div>

        <article
          className="prose prose-invert max-w-none prose-headings:font-display prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary prose-strong:text-foreground prose-code:text-primary prose-code:bg-muted/50 prose-code:px-1 prose-code:rounded prose-pre:bg-card prose-pre:border prose-pre:border-border prose-img:rounded-xl prose-blockquote:border-primary"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
          data-testid="post-content"
        />

        <div className="mt-10 pt-6 border-t border-border">
          <ShareButtons post={post} />
        </div>

        <RelatedPosts currentSlug={slug} category={post.category} />
      </main>

      <Footer />
    </div>
  );
}
