import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Lock,
  BarChart3,
  Settings,
  Newspaper,
  Eye,
  EyeOff,
  Pin,
  PinOff,
  Trash2,
  Save,
  LogOut,
  Users,
  Globe,
  TrendingUp,
  Wallet,
  RefreshCw,
  Shield,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

function apiHeaders(token: string) {
  return { "Content-Type": "application/json", "x-admin-token": token };
}

function LoginForm({ onLogin }: { onLogin: (token: string) => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError("Invalid password");
        return;
      }
      const data = await res.json();
      onLogin(data.token);
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060a10] flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(0,200,255,0.1) 0%, transparent 70%)",
        }} />
      </div>
      <Card className="w-full max-w-sm bg-white/5 border-white/10 relative z-10">
        <CardContent className="p-8">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl text-white tracking-wider" data-testid="text-admin-title">Admin Panel</h1>
              <p className="text-xs text-muted-foreground">TokenAltcoin</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Admin password"
                className="bg-white/5 border-white/10 text-white"
                data-testid="input-admin-password"
                autoFocus
              />
            </div>
            {error && <p className="text-red-400 text-sm" data-testid="text-login-error">{error}</p>}
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90"
              disabled={loading}
              data-testid="button-admin-login"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
              {loading ? "Authenticating..." : "Login"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">Default: admin123</p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function AnalyticsTab({ token }: { token: string }) {
  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats", { headers: apiHeaders(token) });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-white" data-testid="text-analytics-title">Site Analytics</h2>
        <Button variant="ghost" size="sm" onClick={() => refetch()} data-testid="button-refresh-stats">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Total Page Views</span>
            </div>
            <p className="text-3xl font-display font-bold text-white" data-testid="text-total-views">
              {stats?.total?.toLocaleString() || 0}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-green-500/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-400" />
              </div>
              <span className="text-sm text-muted-foreground">Today</span>
            </div>
            <p className="text-3xl font-display font-bold text-white" data-testid="text-today-views">
              {stats?.today?.toLocaleString() || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-5">
          <h3 className="font-display text-sm font-bold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" /> Views by Page
          </h3>
          <div className="space-y-3">
            {stats?.byPage?.length ? stats.byPage.map((item: any) => {
              const maxCount = Math.max(...stats.byPage.map((p: any) => p.count));
              const pct = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
              return (
                <div key={item.page} data-testid={`stat-page-${item.page}`}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white capitalize">{item.page}</span>
                    <span className="text-muted-foreground">{item.count.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-primary/60 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            }) : (
              <p className="text-sm text-muted-foreground">No data yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-5">
            <h3 className="font-display text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-primary" /> Recent Wallets Tracked
            </h3>
            {stats?.recentWallets?.length ? (
              <div className="space-y-2">
                {stats.recentWallets.map((w: string) => (
                  <div key={w} className="font-mono text-xs text-muted-foreground bg-white/5 rounded px-3 py-2 truncate" data-testid={`text-wallet-${w.slice(0,8)}`}>
                    {w}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No wallets tracked yet</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-5">
            <h3 className="font-display text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" /> Top Chains
            </h3>
            {stats?.topChains?.length ? (
              <div className="space-y-2">
                {stats.topChains.map((c: any) => (
                  <div key={c.chain} className="flex justify-between items-center text-sm" data-testid={`stat-chain-${c.chain}`}>
                    <span className="text-white capitalize">{c.chain}</span>
                    <Badge variant="secondary" className="bg-white/10 text-white border-0">{c.count}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No chain data yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SettingsTab({ token }: { token: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [localSettings, setLocalSettings] = useState<Record<string, string>>({});

  const { data: settings, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/settings", { headers: apiHeaders(token) });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  useEffect(() => {
    if (settings) setLocalSettings(settings);
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (updates: Record<string, string>) => {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: apiHeaders(token),
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to save");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      toast({ title: "Settings saved", description: "Your changes have been applied." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    },
  });

  const updateLocal = (key: string, value: string) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  const settingsFields = [
    { key: "adsense_publisher_id", label: "AdSense Publisher ID", placeholder: "ca-pub-XXXXXXXXXXXXXXXX", help: "Your Google AdSense publisher ID" },
    { key: "adsense_slot_leaderboard", label: "Leaderboard Ad Slot", placeholder: "1234567890", help: "Top banner ad slot ID" },
    { key: "adsense_slot_sidebar", label: "Sidebar Ad Slot", placeholder: "2345678901", help: "Sidebar ad slot ID" },
    { key: "adsense_slot_infeed", label: "In-feed Ad Slot", placeholder: "3456789012", help: "In-feed / article ad slot ID" },
    { key: "adsense_slot_rectangle", label: "Rectangle Ad Slot", placeholder: "4567890123", help: "Rectangle / medium ad slot ID" },
    { key: "admin_password", label: "Admin Password", placeholder: "Enter new password", help: "Change your admin login password" },
    { key: "site_title", label: "Site Title", placeholder: "TokenAltcoin", help: "Displayed in browser tab and headers" },
    { key: "wallet_tracking_enabled", label: "Wallet Tracking", placeholder: "true", help: "Enable/disable wallet tracker (true/false)" },
    { key: "prices_enabled", label: "Prices Page", placeholder: "true", help: "Enable/disable prices page (true/false)" },
    { key: "news_enabled", label: "News Page", placeholder: "true", help: "Enable/disable news page (true/false)" },
    { key: "masternodes_enabled", label: "Masternodes Page", placeholder: "true", help: "Enable/disable masternodes page (true/false)" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-white" data-testid="text-settings-title">Site Settings</h2>
        <Button
          size="sm"
          onClick={() => saveMutation.mutate(localSettings)}
          disabled={saveMutation.isPending}
          className="bg-primary hover:bg-primary/90"
          data-testid="button-save-settings"
        >
          {saveMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save All
        </Button>
      </div>

      <div className="space-y-4">
        <h3 className="font-display text-sm font-bold text-primary flex items-center gap-2">
          <Zap className="w-4 h-4" /> AdSense Configuration
        </h3>
        {settingsFields.slice(0, 5).map((field) => (
          <Card key={field.key} className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <label className="text-sm font-medium text-white block mb-1">{field.label}</label>
              <p className="text-xs text-muted-foreground mb-2">{field.help}</p>
              <Input
                value={localSettings[field.key] || ""}
                onChange={(e) => updateLocal(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="bg-white/5 border-white/10 text-white font-mono text-sm"
                data-testid={`input-setting-${field.key}`}
              />
            </CardContent>
          </Card>
        ))}

        <h3 className="font-display text-sm font-bold text-primary flex items-center gap-2 pt-4">
          <Settings className="w-4 h-4" /> General Settings
        </h3>
        {settingsFields.slice(5).map((field) => (
          <Card key={field.key} className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <label className="text-sm font-medium text-white block mb-1">{field.label}</label>
              <p className="text-xs text-muted-foreground mb-2">{field.help}</p>
              <Input
                value={localSettings[field.key] || ""}
                onChange={(e) => updateLocal(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="bg-white/5 border-white/10 text-white font-mono text-sm"
                type={field.key === "admin_password" ? "password" : "text"}
                data-testid={`input-setting-${field.key}`}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ContentTab({ token }: { token: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: news } = useQuery({
    queryKey: ["news"],
    queryFn: async () => {
      const res = await fetch("/api/news");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: hiddenArticles } = useQuery({
    queryKey: ["admin-hidden-news"],
    queryFn: async () => {
      const res = await fetch("/api/admin/hidden-news", { headers: apiHeaders(token) });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: pinnedArticles } = useQuery({
    queryKey: ["admin-pinned-news"],
    queryFn: async () => {
      const res = await fetch("/api/admin/pinned-news", { headers: apiHeaders(token) });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const hiddenIds = new Set((hiddenArticles || []).map((a: any) => String(a.articleId)));
  const pinnedIds = new Set((pinnedArticles || []).map((a: any) => String(a.articleId)));

  const hideMutation = useMutation({
    mutationFn: async ({ articleId, title }: { articleId: string; title: string }) => {
      const res = await fetch("/api/admin/hide-news", {
        method: "POST",
        headers: apiHeaders(token),
        body: JSON.stringify({ articleId, title, reason: "Admin hidden" }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-hidden-news"] });
      queryClient.invalidateQueries({ queryKey: ["news"] });
      toast({ title: "Article hidden" });
    },
  });

  const unhideMutation = useMutation({
    mutationFn: async (articleId: string) => {
      const res = await fetch(`/api/admin/hide-news/${articleId}`, {
        method: "DELETE",
        headers: apiHeaders(token),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-hidden-news"] });
      queryClient.invalidateQueries({ queryKey: ["news"] });
      toast({ title: "Article restored" });
    },
  });

  const pinMutation = useMutation({
    mutationFn: async ({ articleId, title }: { articleId: string; title: string }) => {
      const res = await fetch("/api/admin/pin-news", {
        method: "POST",
        headers: apiHeaders(token),
        body: JSON.stringify({ articleId, title }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pinned-news"] });
      queryClient.invalidateQueries({ queryKey: ["news"] });
      toast({ title: "Article pinned" });
    },
  });

  const unpinMutation = useMutation({
    mutationFn: async (articleId: string) => {
      const res = await fetch(`/api/admin/pin-news/${articleId}`, {
        method: "DELETE",
        headers: apiHeaders(token),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pinned-news"] });
      queryClient.invalidateQueries({ queryKey: ["news"] });
      toast({ title: "Article unpinned" });
    },
  });

  return (
    <div className="space-y-6">
      <h2 className="font-display text-lg font-bold text-white" data-testid="text-content-title">Content Moderation</h2>

      {(hiddenArticles || []).length > 0 && (
        <Card className="bg-red-500/5 border-red-500/20">
          <CardContent className="p-5">
            <h3 className="font-display text-sm font-bold text-red-400 mb-3 flex items-center gap-2">
              <EyeOff className="w-4 h-4" /> Hidden Articles ({hiddenArticles.length})
            </h3>
            <div className="space-y-2">
              {hiddenArticles.map((article: any) => (
                <div key={article.articleId} className="flex items-center justify-between gap-3 bg-white/5 rounded-lg p-3" data-testid={`hidden-article-${article.articleId}`}>
                  <span className="text-sm text-white truncate flex-1">{article.title}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => unhideMutation.mutate(article.articleId)}
                    className="text-green-400 hover:text-green-300 shrink-0"
                    data-testid={`button-unhide-${article.articleId}`}
                  >
                    <Eye className="w-4 h-4 mr-1" /> Restore
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-5">
          <h3 className="font-display text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-primary" /> Current News Articles
          </h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {news?.articles?.length ? news.articles.map((article: any) => {
              const id = String(article.id);
              const isPinned = pinnedIds.has(id);
              return (
                <div key={id} className={`flex items-center gap-3 rounded-lg p-3 ${isPinned ? "bg-primary/10 border border-primary/20" : "bg-white/5"}`} data-testid={`news-article-${id}`}>
                  {isPinned && <Pin className="w-4 h-4 text-primary shrink-0" />}
                  <span className="text-sm text-white truncate flex-1">{article.title}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    {isPinned ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => unpinMutation.mutate(id)}
                        className="text-yellow-400 hover:text-yellow-300 h-8 px-2"
                        data-testid={`button-unpin-${id}`}
                      >
                        <PinOff className="w-3.5 h-3.5" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => pinMutation.mutate({ articleId: id, title: article.title })}
                        className="text-primary hover:text-primary/80 h-8 px-2"
                        data-testid={`button-pin-${id}`}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => hideMutation.mutate({ articleId: id, title: article.title })}
                      className="text-red-400 hover:text-red-300 h-8 px-2"
                      data-testid={`button-hide-${id}`}
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            }) : (
              <p className="text-sm text-muted-foreground">No articles loaded</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("admin_token");
    }
    return null;
  });

  const handleLogin = (newToken: string) => {
    setToken(newToken);
    sessionStorage.setItem("admin_token", newToken);
  };

  const handleLogout = () => {
    if (token) {
      fetch("/api/admin/logout", {
        method: "POST",
        headers: apiHeaders(token),
      }).catch(() => {});
    }
    setToken(null);
    sessionStorage.removeItem("admin_token");
  };

  const { data: authCheck, isLoading: authLoading } = useQuery({
    queryKey: ["admin-auth", token],
    queryFn: async () => {
      if (!token) return { authenticated: false };
      const res = await fetch("/api/admin/verify", { headers: apiHeaders(token) });
      if (!res.ok) {
        setToken(null);
        sessionStorage.removeItem("admin_token");
        return { authenticated: false };
      }
      return res.json();
    },
    enabled: !!token,
    retry: false,
  });

  if (authLoading && token) {
    return (
      <div className="min-h-screen bg-[#060a10] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!token || (authCheck && !authCheck.authenticated)) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#060a10] text-white">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(0,200,255,0.08) 0%, transparent 70%)",
        }} />
      </div>

      <nav className="relative z-20 border-b border-white/5 px-4 md:px-6 py-3 backdrop-blur-xl bg-[#060a10]/80">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <span className="font-display font-bold text-lg tracking-wider" data-testid="text-admin-header">Admin Panel</span>
            <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-0 text-xs">Connected</Badge>
          </div>
          <div className="flex items-center gap-2">
            <a href="/" className="text-sm text-muted-foreground hover:text-white transition-colors mr-3" data-testid="link-back-to-site">
              Back to site
            </a>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-400 hover:text-red-300" data-testid="button-admin-logout">
              <LogOut className="w-4 h-4 mr-1" /> Logout
            </Button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-6xl mx-auto px-4 md:px-6 py-8">
        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="analytics" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary" data-testid="tab-analytics">
              <BarChart3 className="w-4 h-4 mr-2" /> Analytics
            </TabsTrigger>
            <TabsTrigger value="adsense" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary" data-testid="tab-adsense">
              <Zap className="w-4 h-4 mr-2" /> Settings
            </TabsTrigger>
            <TabsTrigger value="content" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary" data-testid="tab-content">
              <Newspaper className="w-4 h-4 mr-2" /> Content
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <AnalyticsTab token={token} />
          </TabsContent>
          <TabsContent value="adsense">
            <SettingsTab token={token} />
          </TabsContent>
          <TabsContent value="content">
            <ContentTab token={token} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
