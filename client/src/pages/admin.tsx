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
  Building2,
  Plus,
  Edit,
  Star,
  ExternalLink,
  Check,
  X,
  Mail,
  FileText,
  Search,
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
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(0,200,255,0.1) 0%, transparent 70%)",
        }} />
      </div>
      <Card className="w-full max-w-sm bg-muted/30 border-border relative z-10">
        <CardContent className="p-8">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl text-foreground tracking-wider" data-testid="text-admin-title">Admin Panel</h1>
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
                className="bg-muted/30 border-border text-foreground"
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
        <h2 className="font-display text-lg font-bold text-foreground" data-testid="text-analytics-title">Site Analytics</h2>
        <Button variant="ghost" size="sm" onClick={() => refetch()} data-testid="button-refresh-stats">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="bg-muted/30 border-border">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Total Page Views</span>
            </div>
            <p className="text-3xl font-display font-bold text-foreground" data-testid="text-total-views">
              {stats?.total?.toLocaleString() || 0}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-muted/30 border-border">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-green-500/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-400" />
              </div>
              <span className="text-sm text-muted-foreground">Today</span>
            </div>
            <p className="text-3xl font-display font-bold text-foreground" data-testid="text-today-views">
              {stats?.today?.toLocaleString() || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-muted/30 border-border">
        <CardContent className="p-5">
          <h3 className="font-display text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" /> Views by Page
          </h3>
          <div className="space-y-3">
            {stats?.byPage?.length ? stats.byPage.map((item: any) => {
              const maxCount = Math.max(...stats.byPage.map((p: any) => p.count));
              const pct = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
              return (
                <div key={item.page} data-testid={`stat-page-${item.page}`}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-foreground capitalize">{item.page}</span>
                    <span className="text-muted-foreground">{item.count.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
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
        <Card className="bg-muted/30 border-border">
          <CardContent className="p-5">
            <h3 className="font-display text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-primary" /> Recent Wallets Tracked
            </h3>
            {stats?.recentWallets?.length ? (
              <div className="space-y-2">
                {stats.recentWallets.map((w: string) => (
                  <div key={w} className="font-mono text-xs text-muted-foreground bg-muted/30 rounded px-3 py-2 truncate" data-testid={`text-wallet-${w.slice(0,8)}`}>
                    {w}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No wallets tracked yet</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-muted/30 border-border">
          <CardContent className="p-5">
            <h3 className="font-display text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" /> Top Chains
            </h3>
            {stats?.topChains?.length ? (
              <div className="space-y-2">
                {stats.topChains.map((c: any) => (
                  <div key={c.chain} className="flex justify-between items-center text-sm" data-testid={`stat-chain-${c.chain}`}>
                    <span className="text-foreground capitalize">{c.chain}</span>
                    <Badge variant="secondary" className="bg-muted/50 text-foreground border-0">{c.count}</Badge>
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
    { key: "show_login_link", label: "Show Login Link", placeholder: "true", help: "Show/hide the Login link in the navigation bar (true/false). Set to false after connecting your domain." },
    { key: "changenow_affiliate_id", label: "ChangeNOW Affiliate ID", placeholder: "your-affiliate-id", help: "Your ChangeNOW referral/affiliate ID for the swap widget" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-foreground" data-testid="text-settings-title">Site Settings</h2>
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
          <Card key={field.key} className="bg-muted/30 border-border">
            <CardContent className="p-4">
              <label className="text-sm font-medium text-foreground block mb-1">{field.label}</label>
              <p className="text-xs text-muted-foreground mb-2">{field.help}</p>
              <Input
                value={localSettings[field.key] || ""}
                onChange={(e) => updateLocal(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="bg-muted/30 border-border text-foreground font-mono text-sm"
                data-testid={`input-setting-${field.key}`}
              />
            </CardContent>
          </Card>
        ))}

        <h3 className="font-display text-sm font-bold text-primary flex items-center gap-2 pt-4">
          <Zap className="w-4 h-4" /> ads.txt File
        </h3>
        <Card className="bg-muted/30 border-border">
          <CardContent className="p-4">
            <label className="text-sm font-medium text-foreground block mb-1">ads.txt Content</label>
            <p className="text-xs text-muted-foreground mb-2">
              This file is served at <span className="font-mono text-primary">/ads.txt</span> and is required by Google AdSense for ad verification. Each line should follow the format: <span className="font-mono">google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0</span>
            </p>
            <textarea
              value={localSettings["ads_txt_content"] || ""}
              onChange={(e) => updateLocal("ads_txt_content", e.target.value)}
              placeholder={"google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0"}
              rows={5}
              className="w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-foreground font-mono text-sm resize-y min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary/50"
              data-testid="textarea-ads-txt"
            />
          </CardContent>
        </Card>

        <h3 className="font-display text-sm font-bold text-primary flex items-center gap-2 pt-4">
          <Settings className="w-4 h-4" /> General Settings
        </h3>
        <Card className="bg-muted/30 border-border">
          <CardContent className="p-4">
            <label className="text-sm font-medium text-foreground block mb-1">Home Page</label>
            <p className="text-xs text-muted-foreground mb-2">Choose which page loads as the home page when visitors arrive at your site</p>
            <select
              value={localSettings["home_page"] || "explorer"}
              onChange={(e) => updateLocal("home_page", e.target.value)}
              className="w-full bg-muted/30 border border-border rounded-md px-3 py-2 text-foreground text-sm"
              data-testid="select-setting-home-page"
            >
              <option value="explorer">Explorer (Multi-Chain Explorer)</option>
              <option value="prices">Prices (Live Crypto Prices)</option>
              <option value="dashboard">Dashboard (Custom Dashboard)</option>
              <option value="news">News (Crypto News Feed)</option>
              <option value="swap">Swap (Crypto Exchange)</option>
              <option value="portfolio">Portfolio (Portfolio Tracker)</option>
            </select>
          </CardContent>
        </Card>

        {settingsFields.slice(5).map((field) => (
          <Card key={field.key} className="bg-muted/30 border-border">
            <CardContent className="p-4">
              <label className="text-sm font-medium text-foreground block mb-1">{field.label}</label>
              <p className="text-xs text-muted-foreground mb-2">{field.help}</p>
              <Input
                value={localSettings[field.key] || ""}
                onChange={(e) => updateLocal(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="bg-muted/30 border-border text-foreground font-mono text-sm"
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
      <h2 className="font-display text-lg font-bold text-foreground" data-testid="text-content-title">Content Moderation</h2>

      {(hiddenArticles || []).length > 0 && (
        <Card className="bg-red-500/5 border-red-500/20">
          <CardContent className="p-5">
            <h3 className="font-display text-sm font-bold text-red-400 mb-3 flex items-center gap-2">
              <EyeOff className="w-4 h-4" /> Hidden Articles ({hiddenArticles.length})
            </h3>
            <div className="space-y-2">
              {hiddenArticles.map((article: any) => (
                <div key={article.articleId} className="flex items-center justify-between gap-3 bg-muted/30 rounded-lg p-3" data-testid={`hidden-article-${article.articleId}`}>
                  <span className="text-sm text-foreground truncate flex-1">{article.title}</span>
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

      <Card className="bg-muted/30 border-border">
        <CardContent className="p-5">
          <h3 className="font-display text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-primary" /> Current News Articles
          </h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {news?.articles?.length ? news.articles.map((article: any) => {
              const id = String(article.id);
              const isPinned = pinnedIds.has(id);
              return (
                <div key={id} className={`flex items-center gap-3 rounded-lg p-3 ${isPinned ? "bg-primary/10 border border-primary/20" : "bg-muted/30"}`} data-testid={`news-article-${id}`}>
                  {isPinned && <Pin className="w-4 h-4 text-primary shrink-0" />}
                  <span className="text-sm text-foreground truncate flex-1">{article.title}</span>
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

function ExchangesTab({ token }: { token: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "", url: "", affiliateUrl: "", description: "", type: "centralized",
    country: "", year: "", tradingPairs: "", featured: false, active: true, sortOrder: "0", logo: "",
  });

  const { data: exchanges, isLoading } = useQuery({
    queryKey: ["admin-exchanges"],
    queryFn: async () => {
      const res = await fetch("/api/admin/exchanges", { headers: apiHeaders(token) });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const resetForm = () => {
    setForm({ name: "", url: "", affiliateUrl: "", description: "", type: "centralized", country: "", year: "", tradingPairs: "", featured: false, active: true, sortOrder: "0", logo: "" });
    setEditingId(null);
    setShowForm(false);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const endpoint = editingId ? `/api/admin/exchanges/${editingId}` : "/api/admin/exchanges";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(endpoint, { method, headers: apiHeaders(token), body: JSON.stringify(form) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-exchanges"] });
      toast({ title: editingId ? "Exchange updated" : "Exchange added" });
      resetForm();
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/exchanges/${id}`, { method: "DELETE", headers: apiHeaders(token) });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-exchanges"] });
      toast({ title: "Exchange deleted" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, field, value }: { id: number; field: string; value: boolean }) => {
      const res = await fetch(`/api/admin/exchanges/${id}`, {
        method: "PUT", headers: apiHeaders(token), body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-exchanges"] }); },
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/exchanges/seed", { method: "POST", headers: apiHeaders(token) });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-exchanges"] });
      toast({ title: data.message });
    },
  });

  const startEdit = (ex: any) => {
    setForm({
      name: ex.name, url: ex.url, affiliateUrl: ex.affiliateUrl || "", description: ex.description || "",
      type: ex.type, country: ex.country || "", year: ex.year?.toString() || "", tradingPairs: ex.tradingPairs?.toString() || "",
      featured: ex.featured || false, active: ex.active !== false, sortOrder: ex.sortOrder?.toString() || "0", logo: ex.logo || "",
    });
    setEditingId(ex.id);
    setShowForm(true);
  };

  const updateField = (key: string, value: any) => setForm((p) => ({ ...p, [key]: value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-foreground" data-testid="text-exchanges-admin-title">Manage Exchanges</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending} data-testid="button-seed-exchanges">
            {seedMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />} Seed Defaults
          </Button>
          <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }} className="bg-primary hover:bg-primary/90" data-testid="button-add-exchange">
            <Plus className="w-4 h-4 mr-1" /> Add Exchange
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-5 space-y-4">
            <h3 className="font-display text-sm font-bold text-primary">{editingId ? "Edit Exchange" : "Add New Exchange"}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Name *</label>
                <Input value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="Binance" className="bg-muted/30 border-border" data-testid="input-exchange-name" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Website URL *</label>
                <Input value={form.url} onChange={(e) => updateField("url", e.target.value)} placeholder="https://www.binance.com" className="bg-muted/30 border-border" data-testid="input-exchange-url" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Affiliate URL</label>
                <Input value={form.affiliateUrl} onChange={(e) => updateField("affiliateUrl", e.target.value)} placeholder="https://www.binance.com/?ref=YOUR_ID" className="bg-muted/30 border-border" data-testid="input-exchange-affiliate" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Logo URL</label>
                <Input value={form.logo} onChange={(e) => updateField("logo", e.target.value)} placeholder="https://example.com/logo.png" className="bg-muted/30 border-border" data-testid="input-exchange-logo" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                <Input value={form.description} onChange={(e) => updateField("description", e.target.value)} placeholder="Short description of the exchange" className="bg-muted/30 border-border" data-testid="input-exchange-description" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Type</label>
                <select value={form.type} onChange={(e) => updateField("type", e.target.value)} className="w-full h-9 rounded-md border border-border bg-muted/30 px-3 text-sm text-foreground" data-testid="select-exchange-type">
                  <option value="centralized">Centralized (CEX)</option>
                  <option value="decentralized">Decentralized (DEX)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Country</label>
                <Input value={form.country} onChange={(e) => updateField("country", e.target.value)} placeholder="United States" className="bg-muted/30 border-border" data-testid="input-exchange-country" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Year Founded</label>
                <Input value={form.year} onChange={(e) => updateField("year", e.target.value)} placeholder="2017" type="number" className="bg-muted/30 border-border" data-testid="input-exchange-year" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Trading Pairs</label>
                <Input value={form.tradingPairs} onChange={(e) => updateField("tradingPairs", e.target.value)} placeholder="1500" type="number" className="bg-muted/30 border-border" data-testid="input-exchange-pairs" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Sort Order</label>
                <Input value={form.sortOrder} onChange={(e) => updateField("sortOrder", e.target.value)} placeholder="0" type="number" className="bg-muted/30 border-border" data-testid="input-exchange-sort" />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input type="checkbox" checked={form.featured} onChange={(e) => updateField("featured", e.target.checked)} className="accent-primary" data-testid="checkbox-exchange-featured" />
                  Featured
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input type="checkbox" checked={form.active} onChange={(e) => updateField("active", e.target.checked)} className="accent-primary" data-testid="checkbox-exchange-active" />
                  Active
                </label>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button size="sm" onClick={() => saveMutation.mutate()} disabled={!form.name || !form.url || saveMutation.isPending} className="bg-primary hover:bg-primary/90" data-testid="button-save-exchange">
                {saveMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                {editingId ? "Update" : "Add"}
              </Button>
              <Button size="sm" variant="ghost" onClick={resetForm} data-testid="button-cancel-exchange">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-10"><RefreshCw className="w-6 h-6 animate-spin text-primary" /></div>
      ) : (exchanges || []).length === 0 ? (
        <Card className="bg-muted/30 border-border">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-3">No exchanges yet. Click "Seed Defaults" to add 30 popular exchanges, or add them manually.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{(exchanges || []).length} exchanges total</p>
          {(exchanges || []).map((ex: any) => (
            <Card key={ex.id} className={`border-border/50 ${!ex.active ? "opacity-50" : ""}`} data-testid={`admin-exchange-${ex.id}`}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center text-sm font-bold text-foreground shrink-0">
                  {ex.logo ? <img src={ex.logo} alt="" className="w-5 h-5 rounded" /> : ex.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-foreground truncate">{ex.name}</span>
                    {ex.featured && <Star className="w-3 h-3 text-primary fill-primary shrink-0" />}
                    <Badge variant="outline" className={`text-[9px] ${ex.type === "decentralized" ? "text-purple-400 border-purple-400/30" : "text-primary border-primary/30"}`}>
                      {ex.type === "decentralized" ? "DEX" : "CEX"}
                    </Badge>
                    {!ex.active && <Badge variant="outline" className="text-[9px] text-red-400 border-red-400/30">Hidden</Badge>}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    {ex.affiliateUrl ? (
                      <span className="text-green-400 flex items-center gap-0.5"><ExternalLink className="w-2.5 h-2.5" /> Affiliate set</span>
                    ) : (
                      <span className="text-yellow-400">No affiliate link</span>
                    )}
                    {ex.country && <span>· {ex.country}</span>}
                    {ex.year && <span>· {ex.year}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-muted-foreground hover:text-foreground" onClick={() => toggleMutation.mutate({ id: ex.id, field: "featured", value: !ex.featured })} title={ex.featured ? "Unfeature" : "Feature"} data-testid={`button-feature-${ex.id}`}>
                    <Star className={`w-3.5 h-3.5 ${ex.featured ? "text-primary fill-primary" : ""}`} />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-muted-foreground hover:text-foreground" onClick={() => toggleMutation.mutate({ id: ex.id, field: "active", value: !ex.active })} title={ex.active ? "Deactivate" : "Activate"} data-testid={`button-toggle-${ex.id}`}>
                    {ex.active ? <Check className="w-3.5 h-3.5 text-green-400" /> : <X className="w-3.5 h-3.5 text-red-400" />}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-muted-foreground hover:text-foreground" onClick={() => startEdit(ex)} data-testid={`button-edit-${ex.id}`}>
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-red-400 hover:text-red-300" onClick={() => { if (confirm(`Delete "${ex.name}"?`)) deleteMutation.mutate(ex.id); }} data-testid={`button-delete-${ex.id}`}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function MessagesTab({ token }: { token: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: messages, isLoading } = useQuery({
    queryKey: ["admin-messages"],
    queryFn: async () => {
      const res = await fetch("/api/admin/messages", { headers: apiHeaders(token) });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/messages/${id}/read`, {
        method: "PUT",
        headers: apiHeaders(token),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-messages"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/messages/${id}`, {
        method: "DELETE",
        headers: apiHeaders(token),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-messages"] });
      toast({ title: "Message deleted" });
    },
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
      <h2 className="font-display text-lg font-bold text-foreground" data-testid="text-messages-title">Contact Messages</h2>
      {(messages || []).length === 0 ? (
        <Card className="bg-muted/30 border-border">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No messages yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{(messages || []).length} messages total</p>
          {(messages || []).map((msg: any) => (
            <Card
              key={msg.id}
              className={`border-border/50 cursor-pointer transition-colors ${!msg.read ? "bg-primary/5 border-primary/20" : "bg-muted/30"}`}
              onClick={() => { if (!msg.read) markReadMutation.mutate(msg.id); }}
              data-testid={`message-${msg.id}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-foreground">{msg.name}</span>
                      {!msg.read && <Badge className="bg-primary/20 text-primary border-0 text-[9px]">New</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{msg.email}</p>
                    {msg.subject && <p className="text-sm text-foreground font-medium mb-1">{msg.subject}</p>}
                    <p className="text-sm text-muted-foreground line-clamp-2">{msg.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleString() : ""}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-400 hover:text-red-300 shrink-0"
                    onClick={(e) => { e.stopPropagation(); if (confirm("Delete this message?")) deleteMutation.mutate(msg.id); }}
                    data-testid={`button-delete-message-${msg.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function BlogTab({ token }: { token: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    title: "", slug: "", content: "", excerpt: "", category: "News",
    tags: "", coverImage: "", metaTitle: "", metaDescription: "",
    published: false, featured: false,
  });

  const { data: posts, isLoading } = useQuery({
    queryKey: ["admin-blog"],
    queryFn: async () => {
      const res = await fetch("/api/admin/blog", { headers: apiHeaders(token) });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  };

  const resetForm = () => {
    setForm({ title: "", slug: "", content: "", excerpt: "", category: "News", tags: "", coverImage: "", metaTitle: "", metaDescription: "", published: false, featured: false });
    setEditingId(null);
    setShowForm(false);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const endpoint = editingId ? `/api/admin/blog/${editingId}` : "/api/admin/blog";
      const method = editingId ? "PUT" : "POST";
      const payload = { ...form, tags: form.tags.split(",").map((t: string) => t.trim()).filter(Boolean) };
      const res = await fetch(endpoint, { method, headers: apiHeaders(token), body: JSON.stringify(payload) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog"] });
      toast({ title: editingId ? "Post updated" : "Post created" });
      resetForm();
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/blog/${id}`, { method: "DELETE", headers: apiHeaders(token) });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog"] });
      toast({ title: "Post deleted" });
    },
  });

  const startEdit = (post: any) => {
    setForm({
      title: post.title || "", slug: post.slug || "", content: post.content || "",
      excerpt: post.excerpt || "", category: post.category || "News",
      tags: Array.isArray(post.tags) ? post.tags.join(", ") : (post.tags || ""),
      coverImage: post.coverImage || "", metaTitle: post.metaTitle || "",
      metaDescription: post.metaDescription || "",
      published: post.published || false, featured: post.featured || false,
    });
    setEditingId(post.id);
    setShowForm(true);
  };

  const updateField = (key: string, value: any) => {
    setForm((p) => {
      const updated = { ...p, [key]: value };
      if (key === "title" && !editingId) {
        updated.slug = generateSlug(value);
      }
      return updated;
    });
  };

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
        <h2 className="font-display text-lg font-bold text-foreground" data-testid="text-blog-admin-title">Manage Blog</h2>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }} className="bg-primary hover:bg-primary/90" data-testid="button-add-post">
          <Plus className="w-4 h-4 mr-1" /> New Post
        </Button>
      </div>

      {showForm && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-5 space-y-4">
            <h3 className="font-display text-sm font-bold text-primary">{editingId ? "Edit Post" : "New Blog Post"}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Title *</label>
                <Input value={form.title} onChange={(e) => updateField("title", e.target.value)} placeholder="Post title" className="bg-muted/30 border-border" data-testid="input-blog-title" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Slug</label>
                <Input value={form.slug} onChange={(e) => updateField("slug", e.target.value)} placeholder="post-slug" className="bg-muted/30 border-border font-mono text-sm" data-testid="input-blog-slug" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-muted-foreground mb-1 block">Content *</label>
                <textarea
                  value={form.content}
                  onChange={(e) => updateField("content", e.target.value)}
                  placeholder="Write your blog post content..."
                  rows={8}
                  className="w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-foreground text-sm resize-y min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary/50"
                  data-testid="textarea-blog-content"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-muted-foreground mb-1 block">Excerpt</label>
                <textarea
                  value={form.excerpt}
                  onChange={(e) => updateField("excerpt", e.target.value)}
                  placeholder="Short summary of the post..."
                  rows={3}
                  className="w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-foreground text-sm resize-y min-h-[60px] focus:outline-none focus:ring-2 focus:ring-primary/50"
                  data-testid="textarea-blog-excerpt"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                <select value={form.category} onChange={(e) => updateField("category", e.target.value)} className="w-full h-9 rounded-md border border-border bg-muted/30 px-3 text-sm text-foreground" data-testid="select-blog-category">
                  <option value="News">News</option>
                  <option value="Tutorial">Tutorial</option>
                  <option value="Guide">Guide</option>
                  <option value="Analysis">Analysis</option>
                  <option value="Opinion">Opinion</option>
                  <option value="Review">Review</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Tags (comma-separated)</label>
                <Input value={form.tags} onChange={(e) => updateField("tags", e.target.value)} placeholder="crypto, bitcoin, defi" className="bg-muted/30 border-border" data-testid="input-blog-tags" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Cover Image URL</label>
                <Input value={form.coverImage} onChange={(e) => updateField("coverImage", e.target.value)} placeholder="https://example.com/image.jpg" className="bg-muted/30 border-border" data-testid="input-blog-cover" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Meta Title</label>
                <Input value={form.metaTitle} onChange={(e) => updateField("metaTitle", e.target.value)} placeholder="SEO title" className="bg-muted/30 border-border" data-testid="input-blog-meta-title" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-muted-foreground mb-1 block">Meta Description</label>
                <Input value={form.metaDescription} onChange={(e) => updateField("metaDescription", e.target.value)} placeholder="SEO description" className="bg-muted/30 border-border" data-testid="input-blog-meta-desc" />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input type="checkbox" checked={form.published} onChange={(e) => updateField("published", e.target.checked)} className="accent-primary" data-testid="checkbox-blog-published" />
                  Published
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input type="checkbox" checked={form.featured} onChange={(e) => updateField("featured", e.target.checked)} className="accent-primary" data-testid="checkbox-blog-featured" />
                  Featured
                </label>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button size="sm" onClick={() => saveMutation.mutate()} disabled={!form.title || !form.content || saveMutation.isPending} className="bg-primary hover:bg-primary/90" data-testid="button-save-post">
                {saveMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                {editingId ? "Update" : "Create"}
              </Button>
              <Button size="sm" variant="ghost" onClick={resetForm} data-testid="button-cancel-post">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {(posts || []).length === 0 ? (
        <Card className="bg-muted/30 border-border">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No blog posts yet. Click "New Post" to create one.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{(posts || []).length} posts total</p>
          {(posts || []).map((post: any) => (
            <Card key={post.id} className="border-border/50" data-testid={`admin-post-${post.id}`}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-foreground truncate">{post.title}</span>
                    {post.featured && <Star className="w-3 h-3 text-primary fill-primary shrink-0" />}
                    <Badge variant="outline" className={`text-[9px] ${post.published ? "text-green-400 border-green-400/30" : "text-yellow-400 border-yellow-400/30"}`}>
                      {post.published ? "Published" : "Draft"}
                    </Badge>
                    {post.category && <Badge variant="outline" className="text-[9px] text-primary border-primary/30">{post.category}</Badge>}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">/{post.slug}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-muted-foreground hover:text-foreground" onClick={() => startEdit(post)} data-testid={`button-edit-post-${post.id}`}>
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-red-400 hover:text-red-300" onClick={() => { if (confirm(`Delete "${post.title}"?`)) deleteMutation.mutate(post.id); }} data-testid={`button-delete-post-${post.id}`}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function SeoTab({ token }: { token: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const defaultPages = [
    { path: "/", label: "Home" },
    { path: "/wallet", label: "Wallet Tracker" },
    { path: "/prices", label: "Prices" },
    { path: "/blog", label: "Blog" },
    { path: "/contact", label: "Contact" },
    { path: "/news", label: "News" },
    { path: "/exchanges", label: "Exchanges" },
    { path: "/staking", label: "Staking" },
    { path: "/masternodes", label: "Masternodes" },
  ];

  const [seoData, setSeoData] = useState<Record<string, any>>({});
  const [robotsTxt, setRobotsTxt] = useState("");
  const [expandedPage, setExpandedPage] = useState<string | null>(null);

  const { data: seoSettings, isLoading } = useQuery({
    queryKey: ["admin-seo"],
    queryFn: async () => {
      const res = await fetch("/api/admin/seo", { headers: apiHeaders(token) });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: settings } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/settings", { headers: apiHeaders(token) });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  useEffect(() => {
    if (seoSettings) {
      const mapped: Record<string, any> = {};
      if (Array.isArray(seoSettings)) {
        seoSettings.forEach((s: any) => { mapped[s.pagePath] = s; });
      } else if (typeof seoSettings === "object") {
        Object.assign(mapped, seoSettings);
      }
      setSeoData(mapped);
    }
  }, [seoSettings]);

  useEffect(() => {
    if (settings?.robots_txt_content) {
      setRobotsTxt(settings.robots_txt_content);
    }
  }, [settings]);

  const saveSeoMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/seo", {
        method: "PUT",
        headers: apiHeaders(token),
        body: JSON.stringify(seoData),
      });
      if (!res.ok) throw new Error("Failed to save");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-seo"] });
      toast({ title: "SEO settings saved" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save SEO settings.", variant: "destructive" });
    },
  });

  const saveRobotsMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: apiHeaders(token),
        body: JSON.stringify({ robots_txt_content: robotsTxt }),
      });
      if (!res.ok) throw new Error("Failed to save");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      toast({ title: "robots.txt saved" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save robots.txt.", variant: "destructive" });
    },
  });

  const updatePageSeo = (path: string, field: string, value: string) => {
    setSeoData((prev) => ({
      ...prev,
      [path]: { ...(prev[path] || {}), pagePath: path, [field]: value },
    }));
  };

  const getSeoScore = (pageData: any) => {
    if (!pageData) return { score: 0, issues: ["No SEO data configured"] };
    const issues: string[] = [];
    let score = 0;
    const title = pageData.metaTitle || "";
    const desc = pageData.metaDescription || "";
    const keywords = pageData.metaKeywords || "";

    if (title.length === 0) { issues.push("Missing meta title"); }
    else if (title.length >= 50 && title.length <= 60) { score += 30; }
    else if (title.length < 50) { score += 15; issues.push(`Title too short (${title.length}/50-60 chars)`); }
    else { score += 15; issues.push(`Title too long (${title.length}/50-60 chars)`); }

    if (desc.length === 0) { issues.push("Missing meta description"); }
    else if (desc.length >= 150 && desc.length <= 160) { score += 30; }
    else if (desc.length < 150) { score += 15; issues.push(`Description too short (${desc.length}/150-160 chars)`); }
    else { score += 15; issues.push(`Description too long (${desc.length}/150-160 chars)`); }

    if (keywords.length > 0) { score += 20; } else { issues.push("No keywords set"); }
    if (pageData.ogTitle) { score += 10; } else { issues.push("Missing OG title"); }
    if (pageData.ogDescription) { score += 10; } else { issues.push("Missing OG description"); }

    if (issues.length === 0) issues.push("All checks passed!");
    return { score, issues };
  };

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
        <h2 className="font-display text-lg font-bold text-foreground" data-testid="text-seo-title">SEO Manager</h2>
        <Button
          size="sm"
          onClick={() => saveSeoMutation.mutate()}
          disabled={saveSeoMutation.isPending}
          className="bg-primary hover:bg-primary/90"
          data-testid="button-save-seo"
        >
          {saveSeoMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save All SEO
        </Button>
      </div>

      <div className="space-y-2">
        {defaultPages.map((page) => {
          const pageData = seoData[page.path] || {};
          const { score, issues } = getSeoScore(pageData);
          const isExpanded = expandedPage === page.path;
          return (
            <Card key={page.path} className="bg-muted/30 border-border" data-testid={`seo-page-${page.path.replace(/\//g, "-") || "home"}`}>
              <CardContent className="p-0">
                <button
                  className="w-full p-4 flex items-center justify-between text-left"
                  onClick={() => setExpandedPage(isExpanded ? null : page.path)}
                  data-testid={`button-toggle-seo-${page.path.replace(/\//g, "-") || "home"}`}
                >
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-primary" />
                    <div>
                      <span className="font-medium text-sm text-foreground">{page.label}</span>
                      <span className="text-xs text-muted-foreground ml-2">{page.path}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-[9px] ${score >= 80 ? "text-green-400 border-green-400/30" : score >= 50 ? "text-yellow-400 border-yellow-400/30" : "text-red-400 border-red-400/30"}`}>
                      {score}/100
                    </Badge>
                  </div>
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Meta Title ({(pageData.metaTitle || "").length} chars)</label>
                        <Input
                          value={pageData.metaTitle || ""}
                          onChange={(e) => updatePageSeo(page.path, "metaTitle", e.target.value)}
                          placeholder="Page title (50-60 chars ideal)"
                          className="bg-muted/30 border-border"
                          data-testid={`input-seo-title-${page.path.replace(/\//g, "-") || "home"}`}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Keywords</label>
                        <Input
                          value={pageData.metaKeywords || ""}
                          onChange={(e) => updatePageSeo(page.path, "metaKeywords", e.target.value)}
                          placeholder="keyword1, keyword2, keyword3"
                          className="bg-muted/30 border-border"
                          data-testid={`input-seo-keywords-${page.path.replace(/\//g, "-") || "home"}`}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs text-muted-foreground mb-1 block">Meta Description ({(pageData.metaDescription || "").length} chars)</label>
                        <Input
                          value={pageData.metaDescription || ""}
                          onChange={(e) => updatePageSeo(page.path, "metaDescription", e.target.value)}
                          placeholder="Page description (150-160 chars ideal)"
                          className="bg-muted/30 border-border"
                          data-testid={`input-seo-desc-${page.path.replace(/\//g, "-") || "home"}`}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">OG Title</label>
                        <Input
                          value={pageData.ogTitle || ""}
                          onChange={(e) => updatePageSeo(page.path, "ogTitle", e.target.value)}
                          placeholder="Open Graph title"
                          className="bg-muted/30 border-border"
                          data-testid={`input-seo-og-title-${page.path.replace(/\//g, "-") || "home"}`}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">OG Image URL</label>
                        <Input
                          value={pageData.ogImage || ""}
                          onChange={(e) => updatePageSeo(page.path, "ogImage", e.target.value)}
                          placeholder="https://example.com/og-image.jpg"
                          className="bg-muted/30 border-border"
                          data-testid={`input-seo-og-image-${page.path.replace(/\//g, "-") || "home"}`}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs text-muted-foreground mb-1 block">OG Description</label>
                        <Input
                          value={pageData.ogDescription || ""}
                          onChange={(e) => updatePageSeo(page.path, "ogDescription", e.target.value)}
                          placeholder="Open Graph description"
                          className="bg-muted/30 border-border"
                          data-testid={`input-seo-og-desc-${page.path.replace(/\//g, "-") || "home"}`}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Canonical URL</label>
                        <Input
                          value={pageData.canonical || ""}
                          onChange={(e) => updatePageSeo(page.path, "canonical", e.target.value)}
                          placeholder="https://tokenaltcoin.com/page"
                          className="bg-muted/30 border-border"
                          data-testid={`input-seo-canonical-${page.path.replace(/\//g, "-") || "home"}`}
                        />
                      </div>
                    </div>
                    <Card className={`border-0 ${score >= 80 ? "bg-green-500/10" : score >= 50 ? "bg-yellow-500/10" : "bg-red-500/10"}`}>
                      <CardContent className="p-3">
                        <h4 className="text-xs font-bold text-foreground mb-1 flex items-center gap-1">
                          <Search className="w-3 h-3" /> SEO Score: {score}/100
                        </h4>
                        <ul className="text-[10px] text-muted-foreground space-y-0.5">
                          {issues.map((issue, i) => (
                            <li key={i}>• {issue}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-muted/30 border-border">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> robots.txt Editor
            </h3>
            <Button
              size="sm"
              onClick={() => saveRobotsMutation.mutate()}
              disabled={saveRobotsMutation.isPending}
              className="bg-primary hover:bg-primary/90"
              data-testid="button-save-robots"
            >
              {saveRobotsMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
              Save robots.txt
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            This content is served at <span className="font-mono text-primary">/robots.txt</span>
          </p>
          <textarea
            value={robotsTxt}
            onChange={(e) => setRobotsTxt(e.target.value)}
            placeholder={"User-agent: *\nAllow: /\n\nSitemap: https://tokenaltcoin.com/sitemap.xml"}
            rows={8}
            className="w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-foreground font-mono text-sm resize-y min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary/50"
            data-testid="textarea-robots-txt"
          />
        </CardContent>
      </Card>
    </div>
  );
}

function AdminTabs({ token }: { token: string }) {
  const { data: messages } = useQuery({
    queryKey: ["admin-messages"],
    queryFn: async () => {
      const res = await fetch("/api/admin/messages", { headers: apiHeaders(token) });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const unreadCount = (messages || []).filter((m: any) => !m.read).length;

  return (
    <Tabs defaultValue="analytics" className="space-y-6">
      <div className="overflow-x-auto">
        <TabsList className="bg-muted/30 border border-border w-max min-w-full">
          <TabsTrigger value="analytics" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary" data-testid="tab-analytics">
            <BarChart3 className="w-4 h-4 mr-2" /> Analytics
          </TabsTrigger>
          <TabsTrigger value="adsense" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary" data-testid="tab-adsense">
            <Zap className="w-4 h-4 mr-2" /> Settings
          </TabsTrigger>
          <TabsTrigger value="content" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary" data-testid="tab-content">
            <Newspaper className="w-4 h-4 mr-2" /> Content
          </TabsTrigger>
          <TabsTrigger value="exchanges" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary" data-testid="tab-exchanges">
            <Building2 className="w-4 h-4 mr-2" /> Exchanges
          </TabsTrigger>
          <TabsTrigger value="messages" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary" data-testid="tab-messages">
            <Mail className="w-4 h-4 mr-2" /> Messages
            {unreadCount > 0 && (
              <Badge className="ml-1 bg-red-500 text-white border-0 text-[9px] px-1.5 py-0 min-w-[18px] h-[18px] flex items-center justify-center" data-testid="badge-unread-messages">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="blog" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary" data-testid="tab-blog">
            <FileText className="w-4 h-4 mr-2" /> Blog
          </TabsTrigger>
          <TabsTrigger value="seo" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary" data-testid="tab-seo">
            <Search className="w-4 h-4 mr-2" /> SEO
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="analytics">
        <AnalyticsTab token={token} />
      </TabsContent>
      <TabsContent value="adsense">
        <SettingsTab token={token} />
      </TabsContent>
      <TabsContent value="content">
        <ContentTab token={token} />
      </TabsContent>
      <TabsContent value="exchanges">
        <ExchangesTab token={token} />
      </TabsContent>
      <TabsContent value="messages">
        <MessagesTab token={token} />
      </TabsContent>
      <TabsContent value="blog">
        <BlogTab token={token} />
      </TabsContent>
      <TabsContent value="seo">
        <SeoTab token={token} />
      </TabsContent>
    </Tabs>
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!token || (authCheck && !authCheck.authenticated)) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(0,200,255,0.08) 0%, transparent 70%)",
        }} />
      </div>

      <nav className="relative z-20 border-b border-border px-4 md:px-6 py-3 backdrop-blur-xl bg-background/80">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <span className="font-display font-bold text-lg tracking-wider" data-testid="text-admin-header">Admin Panel</span>
            <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-0 text-xs">Connected</Badge>
          </div>
          <div className="flex items-center gap-2">
            <a href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors mr-3" data-testid="link-back-to-site">
              Back to site
            </a>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-400 hover:text-red-300" data-testid="button-admin-logout">
              <LogOut className="w-4 h-4 mr-1" /> Logout
            </Button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-6xl mx-auto px-4 md:px-6 py-8">
        <AdminTabs token={token} />
      </main>
    </div>
  );
}
