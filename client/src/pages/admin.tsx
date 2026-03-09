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
          <Settings className="w-4 h-4" /> General Settings
        </h3>
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
        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="bg-muted/30 border border-border">
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
          <TabsContent value="exchanges">
            <ExchangesTab token={token} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
