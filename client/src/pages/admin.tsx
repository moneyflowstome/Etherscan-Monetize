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
  Menu,
  ChevronDown,
  Gift,
  Wand2,
  Sparkles,
  Monitor,
  Image,
  Copy,
  Code,
  Bot,
  AlertTriangle,
  Ban,
  CheckCircle,
  Home,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

function apiHeaders(token: string) {
  return { "Content-Type": "application/json", "x-admin-token": token };
}

function GooglePreview({ title, description, url }: { title: string; description: string; url: string }) {
  const displayUrl = url || "https://tokenaltcoin.com";
  const displayTitle = title || "Page Title";
  const displayDesc = description || "Page description will appear here...";
  const truncTitle = displayTitle.length > 60 ? displayTitle.slice(0, 57) + "..." : displayTitle;
  const truncDesc = displayDesc.length > 160 ? displayDesc.slice(0, 157) + "..." : displayDesc;

  return (
    <Card className="bg-white dark:bg-[#202124] border-border/50 overflow-hidden" data-testid="google-preview">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Monitor className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold text-primary">Google Search Preview</span>
        </div>
        <div className="rounded-lg p-4" style={{ fontFamily: "Arial, sans-serif" }}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-[#4d5156] dark:text-[#bdc1c6] truncate">{displayUrl}</div>
            </div>
          </div>
          <h3
            className="text-lg leading-snug mb-1 cursor-pointer hover:underline"
            style={{ color: "#1a0dab", fontFamily: "Arial, sans-serif", fontWeight: 400 }}
            data-testid="google-preview-title"
          >
            {truncTitle}
          </h3>
          <p
            className="text-sm leading-relaxed m-0"
            style={{ color: "#4d5156", fontFamily: "Arial, sans-serif" }}
            data-testid="google-preview-description"
          >
            {truncDesc}
          </p>
        </div>
      </CardContent>
    </Card>
  );
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
            <p className="text-xs text-muted-foreground text-center">Enter admin password</p>
            <a href="/" className="flex items-center justify-center gap-1.5 text-xs text-primary hover:underline mt-2" data-testid="link-admin-home">
              <Home className="w-3.5 h-3.5" /> Back to Home
            </a>
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
  const [settingsSubTab, setSettingsSubTab] = useState("general");

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
      queryClient.invalidateQueries({ queryKey: ["show-login-link"] });
      toast({ title: "Settings saved", description: "Your changes have been applied." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    },
  });

  const updateLocal = (key: string, value: string) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSetting = (key: string) => {
    const current = localSettings[key];
    updateLocal(key, current === "true" ? "false" : "true");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  const subTabs = [
    { value: "general", label: "General", icon: Settings },
    { value: "adsense", label: "AdSense", icon: Zap },
    { value: "maintenance", label: "Maintenance", icon: Shield },
    { value: "features", label: "Features", icon: Monitor },
    { value: "apikeys", label: "API Keys", icon: Lock },
  ];

  const isMaintenanceOn = localSettings["maintenance_enabled"] === "true";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-foreground" data-testid="text-settings-title">Site Settings</h2>
        <div className="flex items-center gap-2">
          {isMaintenanceOn && (
            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs animate-pulse">
              Maintenance Mode ON
            </Badge>
          )}
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
      </div>

      <div className="flex gap-1 bg-muted/30 border border-border rounded-lg p-1 overflow-x-auto">
        {subTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setSettingsSubTab(tab.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              settingsSubTab === tab.value
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
            }`}
            data-testid={`subtab-settings-${tab.value}`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {settingsSubTab === "general" && (
        <div className="space-y-4">
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

          <Card className="bg-muted/30 border-border">
            <CardContent className="p-4">
              <label className="text-sm font-medium text-foreground block mb-1">Site Title</label>
              <p className="text-xs text-muted-foreground mb-2">Displayed in browser tab and headers</p>
              <Input
                value={localSettings["site_title"] || ""}
                onChange={(e) => updateLocal("site_title", e.target.value)}
                placeholder="TokenAltcoin"
                className="bg-muted/30 border-border text-foreground font-mono text-sm"
                data-testid="input-setting-site_title"
              />
            </CardContent>
          </Card>

          <Card className="bg-muted/30 border-border">
            <CardContent className="p-4">
              <label className="text-sm font-medium text-foreground block mb-1">Admin Password</label>
              <p className="text-xs text-muted-foreground mb-2">Change your admin login password</p>
              <Input
                value={localSettings["admin_password"] || ""}
                onChange={(e) => updateLocal("admin_password", e.target.value)}
                placeholder="Enter new password"
                type="password"
                className="bg-muted/30 border-border text-foreground font-mono text-sm"
                data-testid="input-setting-admin_password"
              />
            </CardContent>
          </Card>

          <Card className="bg-muted/30 border-border">
            <CardContent className="p-4">
              <label className="text-sm font-medium text-foreground block mb-1">Show Login Link</label>
              <p className="text-xs text-muted-foreground mb-2">Show/hide the Login link in the navigation bar. Set to false after connecting your domain.</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleSetting("show_login_link")}
                  className={`w-11 h-6 rounded-full transition-colors relative ${localSettings["show_login_link"] !== "false" ? "bg-primary" : "bg-muted/50"}`}
                  data-testid="toggle-show-login-link"
                >
                  <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${localSettings["show_login_link"] !== "false" ? "left-5" : "left-0.5"}`} />
                </button>
                <span className="text-xs text-muted-foreground">{localSettings["show_login_link"] !== "false" ? "Visible" : "Hidden"}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/30 border-border">
            <CardContent className="p-4">
              <label className="text-sm font-medium text-foreground block mb-1">ChangeNOW Affiliate ID</label>
              <p className="text-xs text-muted-foreground mb-2">Your ChangeNOW referral/affiliate ID for the swap widget</p>
              <Input
                value={localSettings["changenow_affiliate_id"] || ""}
                onChange={(e) => updateLocal("changenow_affiliate_id", e.target.value)}
                placeholder="your-affiliate-id"
                className="bg-muted/30 border-border text-foreground font-mono text-sm"
                data-testid="input-setting-changenow_affiliate_id"
              />
            </CardContent>
          </Card>
        </div>
      )}

      {settingsSubTab === "adsense" && (
        <div className="space-y-4">
          {[
            { key: "adsense_publisher_id", label: "AdSense Publisher ID", placeholder: "ca-pub-XXXXXXXXXXXXXXXX", help: "Your Google AdSense publisher ID" },
            { key: "adsense_slot_leaderboard", label: "Leaderboard Ad Slot", placeholder: "1234567890", help: "Top banner ad slot ID" },
            { key: "adsense_slot_sidebar", label: "Sidebar Ad Slot", placeholder: "2345678901", help: "Sidebar ad slot ID" },
            { key: "adsense_slot_infeed", label: "In-feed Ad Slot", placeholder: "3456789012", help: "In-feed / article ad slot ID" },
            { key: "adsense_slot_rectangle", label: "Rectangle Ad Slot", placeholder: "4567890123", help: "Rectangle / medium ad slot ID" },
          ].map((field) => (
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
        </div>
      )}

      {settingsSubTab === "maintenance" && (
        <div className="space-y-4">
          <Card className={`border ${isMaintenanceOn ? "border-orange-500/50 bg-orange-500/5" : "border-border bg-muted/30"}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Maintenance Mode</label>
                  <p className="text-xs text-muted-foreground">When enabled, all visitors see a maintenance page. Admin panel stays accessible.</p>
                </div>
                <button
                  onClick={() => toggleSetting("maintenance_enabled")}
                  className={`w-14 h-7 rounded-full transition-colors relative flex-shrink-0 ${isMaintenanceOn ? "bg-orange-500" : "bg-muted/50"}`}
                  data-testid="toggle-maintenance-mode"
                >
                  <div className={`w-6 h-6 rounded-full bg-white absolute top-0.5 transition-all ${isMaintenanceOn ? "left-7" : "left-0.5"}`} />
                </button>
              </div>
              {isMaintenanceOn && (
                <div className="mt-3 flex items-center gap-2 text-xs text-orange-400 bg-orange-500/10 rounded-lg px-3 py-2">
                  <Shield className="w-4 h-4" />
                  Site is currently in maintenance mode. Only allowed IPs and admin panel can access the site.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-muted/30 border-border">
            <CardContent className="p-4">
              <label className="text-sm font-medium text-foreground block mb-1">Maintenance Message</label>
              <p className="text-xs text-muted-foreground mb-2">Custom message shown to visitors during maintenance</p>
              <textarea
                value={localSettings["maintenance_message"] || ""}
                onChange={(e) => updateLocal("maintenance_message", e.target.value)}
                placeholder="We're currently performing scheduled maintenance. Please check back soon."
                rows={3}
                className="w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-foreground text-sm resize-y min-h-[60px] focus:outline-none focus:ring-2 focus:ring-primary/50"
                data-testid="textarea-maintenance-message"
              />
            </CardContent>
          </Card>

          <Card className="bg-muted/30 border-border">
            <CardContent className="p-4">
              <label className="text-sm font-medium text-foreground block mb-1">Allowed IPs (Bypass Maintenance)</label>
              <p className="text-xs text-muted-foreground mb-2">Comma-separated list of IP addresses that can access the site during maintenance. Your admin panel is always accessible regardless.</p>
              <Input
                value={localSettings["maintenance_allowed_ips"] || ""}
                onChange={(e) => updateLocal("maintenance_allowed_ips", e.target.value)}
                placeholder="192.168.1.1, 10.0.0.1"
                className="bg-muted/30 border-border text-foreground font-mono text-sm"
                data-testid="input-maintenance-allowed-ips"
              />
            </CardContent>
          </Card>

          <Card className="bg-muted/30 border-border">
            <CardContent className="p-4">
              <label className="text-sm font-medium text-foreground block mb-1">Scheduled Maintenance</label>
              <p className="text-xs text-muted-foreground mb-2">Optional: Set a date/time to display on the maintenance page (informational only, does not auto-toggle)</p>
              <Input
                value={localSettings["maintenance_scheduled"] || ""}
                onChange={(e) => updateLocal("maintenance_scheduled", e.target.value)}
                placeholder="March 15, 2026 at 2:00 PM UTC"
                className="bg-muted/30 border-border text-foreground text-sm"
                data-testid="input-maintenance-scheduled"
              />
            </CardContent>
          </Card>
        </div>
      )}

      {settingsSubTab === "features" && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">Toggle individual features on or off across your site.</p>

          {[
            { key: "wallet_tracking_enabled", label: "Wallet Tracking", desc: "Enable/disable the wallet tracker feature" },
            { key: "prices_enabled", label: "Prices Page", desc: "Enable/disable the live crypto prices page" },
            { key: "news_enabled", label: "News Page", desc: "Enable/disable the crypto news feed" },
            { key: "masternodes_enabled", label: "Masternodes Page", desc: "Enable/disable the masternodes/validators page" },
            { key: "swap_enabled", label: "Swap Feature", desc: "Enable/disable the crypto swap functionality" },
            { key: "blog_enabled", label: "Blog", desc: "Enable/disable the blog section" },
            { key: "chat_enabled", label: "Community Chat", desc: "Enable/disable the community chat feature" },
            { key: "airdrops_enabled", label: "Airdrops", desc: "Enable/disable the airdrops page" },
            { key: "arbitrage_enabled", label: "Arbitrage Scanner", desc: "Enable/disable the arbitrage scanner" },
            { key: "calculator_enabled", label: "Calculator", desc: "Enable/disable the crypto calculator" },
            { key: "staking_enabled", label: "Staking Calculator", desc: "Enable/disable the staking calculator" },
            { key: "dex_enabled", label: "DEX Screener", desc: "Enable/disable the DEX screener page" },
            { key: "gold_enabled", label: "Gold & Precious Metals", desc: "Enable/disable the gold tracker page" },
            { key: "nfts_enabled", label: "NFT Explorer", desc: "Enable/disable the OpenSea NFT explorer page" },
            { key: "contact_enabled", label: "Contact Form", desc: "Enable/disable the contact form" },
          ].map((feature) => (
            <Card key={feature.key} className="bg-muted/30 border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-foreground block">{feature.label}</label>
                    <p className="text-xs text-muted-foreground mt-0.5">{feature.desc}</p>
                  </div>
                  <button
                    onClick={() => toggleSetting(feature.key)}
                    className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${localSettings[feature.key] !== "false" ? "bg-green-500" : "bg-muted/50"}`}
                    data-testid={`toggle-feature-${feature.key}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${localSettings[feature.key] !== "false" ? "left-5" : "left-0.5"}`} />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {settingsSubTab === "apikeys" && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Store your API keys in the database so they transfer when you migrate servers. These override environment variables.
          </p>
          {[
            { key: "api_key_ETHERSCAN_API_KEY", label: "Etherscan API Key", placeholder: "Your Etherscan API key", help: "Used for EVM wallet tracking (Ethereum, BSC, Polygon, etc.)" },
            { key: "api_key_CMC_API_KEY", label: "CoinMarketCap API Key", placeholder: "Your CMC API key", help: "Used for market data and coin metadata" },
            { key: "api_key_CHANGENOW_API_KEY", label: "ChangeNOW API Key", placeholder: "Your ChangeNOW API key", help: "Used for the crypto swap feature" },
            { key: "api_key_BRAVE_API_KEY", label: "Brave Search API Key", placeholder: "Your Brave API key", help: "Used for news search and AI blog generation" },
            { key: "api_key_OPENSEA_API_KEY", label: "OpenSea API Key", placeholder: "Your OpenSea API key", help: "Used for the NFT explorer (collections, wallet NFTs)" },
          ].map((field) => (
            <Card key={field.key} className="bg-muted/30 border-border">
              <CardContent className="p-4">
                <label className="text-sm font-medium text-foreground block mb-1">{field.label}</label>
                <p className="text-xs text-muted-foreground mb-2">{field.help}</p>
                <Input
                  value={localSettings[field.key] || ""}
                  onChange={(e) => updateLocal(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="bg-muted/30 border-border text-foreground font-mono text-sm"
                  type="password"
                  data-testid={`input-setting-${field.key}`}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
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
  const [showGenerator, setShowGenerator] = useState(false);
  const [genTopic, setGenTopic] = useState("");
  const [genCategory, setGenCategory] = useState("Guide");
  const [genTone, setGenTone] = useState("professional");
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState({
    title: "", slug: "", content: "", excerpt: "", category: "News",
    tags: "", coverImage: "", metaTitle: "", metaDescription: "", metaKeywords: "",
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
    setForm({ title: "", slug: "", content: "", excerpt: "", category: "News", tags: "", coverImage: "", metaTitle: "", metaDescription: "", metaKeywords: "", published: false, featured: false });
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
      metaDescription: post.metaDescription || "", metaKeywords: post.metaKeywords || "",
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

  const handleGenerate = async () => {
    if (!genTopic.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/blog/generate", {
        method: "POST",
        headers: apiHeaders(token),
        body: JSON.stringify({ topic: genTopic, category: genCategory, tone: genTone }),
      });
      if (!res.ok) throw new Error("Generation failed");
      const generated = await res.json();
      setForm({
        title: generated.title,
        slug: generated.slug,
        content: generated.content,
        excerpt: generated.excerpt,
        category: generated.category,
        tags: Array.isArray(generated.tags) ? generated.tags.join(", ") : (generated.tags || ""),
        coverImage: generated.coverImage || "",
        metaTitle: generated.metaTitle || "",
        metaDescription: generated.metaDescription || "",
        metaKeywords: generated.metaKeywords || "",
        published: false,
        featured: false,
      });
      setShowGenerator(false);
      setShowForm(true);
      setEditingId(null);
      toast({ title: "Blog post generated! Review and publish when ready." });
    } catch {
      toast({ title: "Error", description: "Failed to generate blog post.", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const autoFillSeo = () => {
    if (!form.title) return;
    const cleanContent = form.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const words = cleanContent.split(" ");
    const autoExcerpt = words.slice(0, 35).join(" ") + (words.length > 35 ? "..." : "");
    const metaTitle = `${form.title} | TokenAltcoin`.slice(0, 60);
    const metaDesc = (form.excerpt || autoExcerpt).slice(0, 155);
    const tagList = form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [];
    const autoKeywords = tagList.length > 0 ? tagList.join(", ") : "crypto, blockchain, " + form.title.toLowerCase().split(" ").slice(0, 3).join(", ");

    setForm(p => ({
      ...p,
      excerpt: p.excerpt || autoExcerpt,
      metaTitle: metaTitle,
      metaDescription: metaDesc,
      metaKeywords: autoKeywords,
    }));
    toast({ title: "SEO fields auto-filled from content" });
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
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-display text-lg font-bold text-foreground" data-testid="text-blog-admin-title">Manage Blog</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowGenerator(!showGenerator)} className="border-primary/30 text-primary hover:bg-primary/10" data-testid="button-ai-generator">
            <Wand2 className="w-4 h-4 mr-1" /> AI Generator
          </Button>
          <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }} className="bg-primary hover:bg-primary/90" data-testid="button-add-post">
            <Plus className="w-4 h-4 mr-1" /> New Post
          </Button>
        </div>
      </div>

      {showGenerator && (
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20" data-testid="ai-generator-panel">
          <CardContent className="p-5 space-y-4">
            <h3 className="font-display text-sm font-bold text-primary flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> AI Blog Post Generator
            </h3>
            <p className="text-xs text-muted-foreground">
              Enter a topic and the generator will create a full blog post with SEO tags, excerpt, and meta fields — all auto-filled and ready to review.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-3">
                <label className="text-xs text-muted-foreground mb-1 block">Topic / Title *</label>
                <Input
                  value={genTopic}
                  onChange={(e) => setGenTopic(e.target.value)}
                  placeholder="e.g., How to Stake Ethereum in 2026, DeFi Yield Farming Guide, Bitcoin Halving Impact..."
                  className="bg-muted/30 border-border"
                  data-testid="input-gen-topic"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                <select value={genCategory} onChange={(e) => setGenCategory(e.target.value)} className="w-full h-9 rounded-md border border-border bg-muted/30 px-3 text-sm text-foreground" data-testid="select-gen-category">
                  <option value="News">News</option>
                  <option value="Tutorial">Tutorial</option>
                  <option value="Guide">Guide</option>
                  <option value="Analysis">Analysis</option>
                  <option value="Opinion">Opinion</option>
                  <option value="Review">Review</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Tone</label>
                <select value={genTone} onChange={(e) => setGenTone(e.target.value)} className="w-full h-9 rounded-md border border-border bg-muted/30 px-3 text-sm text-foreground" data-testid="select-gen-tone">
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="beginner">Beginner-Friendly</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleGenerate}
                  disabled={!genTopic.trim() || generating}
                  className="w-full bg-primary hover:bg-primary/90"
                  data-testid="button-generate-post"
                >
                  {generating ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Wand2 className="w-4 h-4 mr-2" />}
                  {generating ? "Generating..." : "Generate Post"}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {["Bitcoin Halving Impact 2026", "Top 10 DeFi Protocols", "How to Use a Hardware Wallet", "Ethereum Layer 2 Scaling Guide", "Crypto Tax Guide for Beginners", "NFT Market Trends", "Stablecoin Comparison", "Web3 Gaming Future"].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setGenTopic(suggestion)}
                  className="text-[10px] text-left px-2 py-1.5 rounded-md bg-muted/30 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors truncate"
                  data-testid={`button-suggestion-${suggestion.slice(0, 20).replace(/\s+/g, "-").toLowerCase()}`}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
              <div className="md:col-span-2 flex items-center gap-2 pt-2 border-t border-border/30">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-primary">SEO & Meta</span>
                <Button type="button" size="sm" variant="outline" onClick={autoFillSeo} disabled={!form.title} className="ml-auto border-primary/30 text-primary hover:bg-primary/10 text-xs h-7" data-testid="button-auto-seo">
                  <Wand2 className="w-3 h-3 mr-1" /> Auto-Fill SEO
                </Button>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Meta Title ({(form.metaTitle || "").length}/60)</label>
                <Input value={form.metaTitle} onChange={(e) => updateField("metaTitle", e.target.value)} placeholder="SEO title" className="bg-muted/30 border-border" data-testid="input-blog-meta-title" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Meta Description ({(form.metaDescription || "").length}/160)</label>
                <Input value={form.metaDescription} onChange={(e) => updateField("metaDescription", e.target.value)} placeholder="SEO description" className="bg-muted/30 border-border" data-testid="input-blog-meta-desc" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-muted-foreground mb-1 block">Meta Keywords</label>
                <Input value={form.metaKeywords} onChange={(e) => updateField("metaKeywords", e.target.value)} placeholder="crypto, bitcoin, blockchain" className="bg-muted/30 border-border" data-testid="input-blog-meta-keywords" />
              </div>
              {(form.metaTitle || form.title) && (
                <div className="md:col-span-2">
                  <GooglePreview
                    title={form.metaTitle || form.title}
                    description={form.metaDescription || form.excerpt || ""}
                    url={`https://tokenaltcoin.com/blog/${form.slug || "post-slug"}`}
                  />
                </div>
              )}
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
    { path: "/news", label: "News" },
    { path: "/exchanges", label: "Exchanges" },
    { path: "/staking", label: "Staking" },
    { path: "/masternodes", label: "Masternodes" },
    { path: "/arbitrage", label: "Arbitrage" },
    { path: "/swap", label: "Swap" },
    { path: "/dex", label: "DEX Screener" },
    { path: "/calculator", label: "Calculator" },
    { path: "/chat", label: "Chat" },
    { path: "/dashboard", label: "Dashboard" },
    { path: "/airdrops", label: "Airdrops" },
    { path: "/gold", label: "Gold" },
    { path: "/contact", label: "Contact" },
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

  const [autoFilling, setAutoFilling] = useState<string | null>(null);

  const autoFillPage = async (pagePath: string, pageLabel: string, silent = false): Promise<boolean> => {
    setAutoFilling(pagePath);
    try {
      const res = await fetch("/api/admin/seo/auto-fill", {
        method: "POST",
        headers: apiHeaders(token),
        body: JSON.stringify({ pagePath, pageLabel }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setSeoData((prev) => ({
        ...prev,
        [pagePath]: { ...(prev[pagePath] || {}), pagePath, ...data },
      }));
      if (!silent) toast({ title: `SEO auto-filled for ${pageLabel}` });
      return true;
    } catch {
      if (!silent) toast({ title: "Error", description: "Auto-fill failed.", variant: "destructive" });
      return false;
    } finally {
      setAutoFilling(null);
    }
  };

  const autoFillAllPages = async () => {
    let success = 0;
    let failed = 0;
    for (const page of defaultPages) {
      const ok = await autoFillPage(page.path, page.label, true);
      if (ok) success++;
      else failed++;
    }
    toast({ title: failed > 0 ? `Auto-filled ${success}/${defaultPages.length} pages (${failed} failed)` : `All ${success} pages auto-filled!` });
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
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-display text-lg font-bold text-foreground" data-testid="text-seo-title">SEO Manager</h2>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={autoFillAllPages}
            disabled={!!autoFilling}
            className="border-primary/30 text-primary hover:bg-primary/10"
            data-testid="button-auto-fill-all-seo"
          >
            <Wand2 className="w-4 h-4 mr-1" /> Auto-Fill All Pages
          </Button>
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
                    <div className="flex justify-end mb-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => autoFillPage(page.path, page.label)}
                        disabled={autoFilling === page.path}
                        className="border-primary/30 text-primary hover:bg-primary/10 text-xs h-7"
                        data-testid={`button-auto-fill-${page.path.replace(/\//g, "-") || "home"}`}
                      >
                        {autoFilling === page.path ? <RefreshCw className="w-3 h-3 animate-spin mr-1" /> : <Wand2 className="w-3 h-3 mr-1" />}
                        Auto-Fill
                      </Button>
                    </div>
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
                    {(pageData.metaTitle || pageData.ogTitle) && (
                      <GooglePreview
                        title={pageData.metaTitle || pageData.ogTitle || page.label}
                        description={pageData.metaDescription || pageData.ogDescription || ""}
                        url={`https://tokenaltcoin.com${page.path}`}
                      />
                    )}
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

function AirdropsTab({ token }: { token: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: allAirdrops = [], isLoading } = useQuery({
    queryKey: ["admin-airdrops", statusFilter],
    queryFn: async () => {
      const url = statusFilter === "all" ? "/api/admin/airdrops" : `/api/admin/airdrops?status=${statusFilter}`;
      const res = await fetch(url, { headers: apiHeaders(token) });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await fetch(`/api/admin/airdrops/${id}`, {
        method: "PATCH",
        headers: apiHeaders(token),
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-airdrops"] });
      queryClient.invalidateQueries({ queryKey: ["admin-airdrops-pending-count"] });
      toast({ title: "Airdrop updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/airdrops/${id}`, {
        method: "DELETE",
        headers: apiHeaders(token),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-airdrops"] });
      queryClient.invalidateQueries({ queryKey: ["admin-airdrops-pending-count"] });
      toast({ title: "Airdrop deleted" });
    },
  });

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    approved: "bg-green-500/20 text-green-400 border-green-500/30",
    rejected: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {["all", "pending", "approved", "rejected"].map((s) => (
          <Button
            key={s}
            size="sm"
            variant={statusFilter === s ? "default" : "outline"}
            onClick={() => setStatusFilter(s)}
            className="text-xs capitalize"
            data-testid={`button-filter-${s}`}
          >
            {s} {s !== "all" && `(${allAirdrops.filter((a: any) => s === "all" || a.status === s).length})`}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : allAirdrops.length === 0 ? (
        <Card className="bg-muted/20 border-border/50">
          <CardContent className="p-8 text-center">
            <Gift className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No airdrops found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {allAirdrops.map((airdrop: any) => (
            <Card key={airdrop.id} className="bg-card/50 border-border/50" data-testid={`admin-airdrop-${airdrop.id}`}>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-muted/50 border border-border/50 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {airdrop.logo ? (
                        <img src={airdrop.logo} alt={airdrop.name} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <Gift className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-foreground">{airdrop.name}</span>
                        {airdrop.tokenSymbol && <span className="text-xs text-muted-foreground font-mono">${airdrop.tokenSymbol}</span>}
                        <Badge variant="outline" className={`text-[10px] ${statusColors[airdrop.status] || ""}`}>
                          {airdrop.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground flex flex-wrap gap-2 mt-0.5">
                        <span>{airdrop.blockchain}</span>
                        <span>•</span>
                        <span>{airdrop.rewardType}</span>
                        {airdrop.submitterEmail && (
                          <>
                            <span>•</span>
                            <span>by {airdrop.submitterName || airdrop.submitterEmail}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {airdrop.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => updateMutation.mutate({ id: airdrop.id, data: { status: "approved" } })}
                          className="bg-green-600 hover:bg-green-700 text-white text-xs"
                          data-testid={`button-approve-${airdrop.id}`}
                        >
                          <Check className="w-3 h-3 mr-1" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateMutation.mutate({ id: airdrop.id, data: { status: "rejected" } })}
                          className="text-red-400 border-red-400/30 hover:bg-red-500/10 text-xs"
                          data-testid={`button-reject-${airdrop.id}`}
                        >
                          <X className="w-3 h-3 mr-1" /> Reject
                        </Button>
                      </>
                    )}
                    {airdrop.status === "approved" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateMutation.mutate({ id: airdrop.id, data: { featured: !airdrop.featured } })}
                        className={`text-xs ${airdrop.featured ? "text-yellow-400 border-yellow-400/30" : ""}`}
                        data-testid={`button-feature-${airdrop.id}`}
                      >
                        <Star className={`w-3 h-3 mr-1 ${airdrop.featured ? "fill-yellow-400" : ""}`} />
                        {airdrop.featured ? "Unfeature" : "Feature"}
                      </Button>
                    )}
                    {airdrop.status === "rejected" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateMutation.mutate({ id: airdrop.id, data: { status: "approved" } })}
                        className="text-green-400 border-green-400/30 hover:bg-green-500/10 text-xs"
                        data-testid={`button-reapprove-${airdrop.id}`}
                      >
                        <Check className="w-3 h-3 mr-1" /> Approve
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { if (confirm("Delete this airdrop?")) deleteMutation.mutate(airdrop.id); }}
                      className="text-red-400 hover:bg-red-500/10 text-xs"
                      data-testid={`button-delete-airdrop-${airdrop.id}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function SecurityTab({ token }: { token: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [blockIp, setBlockIp] = useState("");
  const [blockReason, setBlockReason] = useState("");

  const { data: attempts, isLoading: attemptsLoading } = useQuery({
    queryKey: ["admin-login-attempts"],
    queryFn: async () => {
      const res = await fetch("/api/admin/login-attempts", { headers: apiHeaders(token) });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const { data: blockedIps, isLoading: blockedLoading } = useQuery({
    queryKey: ["admin-blocked-ips"],
    queryFn: async () => {
      const res = await fetch("/api/admin/blocked-ips", { headers: apiHeaders(token) });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const blockMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/block-ip", {
        method: "POST",
        headers: apiHeaders(token),
        body: JSON.stringify({ ip: blockIp, reason: blockReason || "Manual block" }),
      });
      if (!res.ok) throw new Error("Failed to block IP");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blocked-ips"] });
      setBlockIp("");
      setBlockReason("");
      toast({ title: "IP blocked successfully" });
    },
  });

  const unblockMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/blocked-ips/${id}`, {
        method: "DELETE",
        headers: apiHeaders(token),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blocked-ips"] });
      toast({ title: "IP unblocked" });
    },
  });

  return (
    <div className="space-y-6">
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Block IP Address
          </h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="IP address (e.g., 192.168.1.1)"
              value={blockIp}
              onChange={(e) => setBlockIp(e.target.value)}
              className="flex-1"
              data-testid="input-block-ip"
            />
            <Input
              placeholder="Reason (optional)"
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              className="flex-1"
              data-testid="input-block-reason"
            />
            <Button
              onClick={() => blockMutation.mutate()}
              disabled={!blockIp.trim() || blockMutation.isPending}
              data-testid="button-block-ip"
            >
              Block IP
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-400" />
            Blocked IPs ({Array.isArray(blockedIps) ? blockedIps.length : 0})
          </h3>
          {blockedLoading ? (
            <div className="text-center py-4 text-muted-foreground">Loading...</div>
          ) : !Array.isArray(blockedIps) || blockedIps.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">No blocked IPs</div>
          ) : (
            <div className="space-y-2">
              {blockedIps.map((b: any) => (
                <div key={b.id} className="flex items-center justify-between bg-muted/30 border border-border rounded-lg px-4 py-3" data-testid={`blocked-ip-${b.id}`}>
                  <div>
                    <span className="font-mono text-sm font-bold text-foreground">{b.ip}</span>
                    <span className="text-xs text-muted-foreground ml-3">{b.reason}</span>
                    <span className="text-xs text-muted-foreground ml-3">
                      by {b.blockedBy} · {new Date(b.blockedAt).toLocaleString()}
                    </span>
                    {b.expiresAt && (
                      <Badge className="ml-2 text-[10px] bg-yellow-500/20 text-yellow-400 border-0">
                        Expires: {new Date(b.expiresAt).toLocaleString()}
                      </Badge>
                    )}
                    {!b.expiresAt && (
                      <Badge className="ml-2 text-[10px] bg-red-500/20 text-red-400 border-0">
                        Permanent
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => unblockMutation.mutate(b.id)}
                    className="text-green-400 hover:bg-green-500/10 text-xs"
                    data-testid={`button-unblock-${b.id}`}
                  >
                    Unblock
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            Recent Login Attempts
          </h3>
          {attemptsLoading ? (
            <div className="text-center py-4 text-muted-foreground">Loading...</div>
          ) : !Array.isArray(attempts) || attempts.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">No recent login attempts</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="py-2 px-3">IP Address</th>
                    <th className="py-2 px-3">Time</th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map((a: any) => (
                    <tr key={a.id} className="border-b border-border/30" data-testid={`login-attempt-${a.id}`}>
                      <td className="py-2 px-3 font-mono text-xs">{a.ip}</td>
                      <td className="py-2 px-3 text-xs text-muted-foreground">{new Date(a.attemptedAt).toLocaleString()}</td>
                      <td className="py-2 px-3">
                        {a.success ? (
                          <Badge className="bg-green-500/20 text-green-400 border-0 text-[10px]">Success</Badge>
                        ) : (
                          <Badge className="bg-red-500/20 text-red-400 border-0 text-[10px]">Failed</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SpamMonitorTab({ token }: { token: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [filter, setFilter] = useState<"all" | "unresolved" | "resolved">("unresolved");
  const [banIp, setBanIp] = useState("");
  const [banDuration, setBanDuration] = useState("24");

  const { data: stats } = useQuery({
    queryKey: ["spam-stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/spam/stats", { headers: apiHeaders(token) });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const { data: reports, isLoading } = useQuery({
    queryKey: ["spam-reports", filter],
    queryFn: async () => {
      const qs = filter === "all" ? "" : `?resolved=${filter === "resolved"}`;
      const res = await fetch(`/api/admin/spam/reports${qs}`, { headers: apiHeaders(token) });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    refetchInterval: 15000,
  });

  const resolveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/spam/resolve/${id}`, { method: "POST", headers: apiHeaders(token) });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spam-reports"] });
      queryClient.invalidateQueries({ queryKey: ["spam-stats"] });
      toast({ title: "Report resolved" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/spam/${id}`, { method: "DELETE", headers: apiHeaders(token) });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spam-reports"] });
      queryClient.invalidateQueries({ queryKey: ["spam-stats"] });
      toast({ title: "Report deleted" });
    },
  });

  const bulkResolveMutation = useMutation({
    mutationFn: async () => {
      const unresolvedIds = (Array.isArray(reports) ? reports : []).filter((r: any) => !r.resolved).map((r: any) => r.id);
      if (unresolvedIds.length === 0) return;
      const res = await fetch("/api/admin/spam/bulk-resolve", {
        method: "POST",
        headers: apiHeaders(token),
        body: JSON.stringify({ ids: unresolvedIds }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spam-reports"] });
      queryClient.invalidateQueries({ queryKey: ["spam-stats"] });
      toast({ title: "All visible reports resolved" });
    },
  });

  const banMutation = useMutation({
    mutationFn: async (ip: string) => {
      const res = await fetch("/api/admin/spam/ban-ip", {
        method: "POST",
        headers: apiHeaders(token),
        body: JSON.stringify({ ip, reason: "Banned from Spam Monitor", duration: banDuration }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spam-stats"] });
      toast({ title: "IP banned" });
      setBanIp("");
    },
  });

  const reportList = Array.isArray(reports) ? reports : [];
  const severityColor = (s: string) => {
    switch (s) {
      case "critical": return "bg-red-600 text-white";
      case "high": return "bg-red-500/20 text-red-400";
      case "medium": return "bg-yellow-500/20 text-yellow-400";
      case "low": return "bg-blue-500/20 text-blue-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <Bot className="w-6 h-6 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold" data-testid="text-spam-total">{stats?.total || 0}</div>
            <div className="text-xs text-muted-foreground">Total Reports</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
            <div className="text-2xl font-bold text-yellow-400" data-testid="text-spam-unresolved">{stats?.unresolved || 0}</div>
            <div className="text-xs text-muted-foreground">Unresolved</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <Ban className="w-6 h-6 mx-auto mb-2 text-red-400" />
            <div className="text-2xl font-bold text-red-400" data-testid="text-spam-autobanned">{stats?.autoBanned || 0}</div>
            <div className="text-xs text-muted-foreground">Auto-Banned</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <Shield className="w-6 h-6 mx-auto mb-2 text-green-400" />
            <div className="text-2xl font-bold text-green-400" data-testid="text-spam-offenders">{stats?.topOffenders?.length || 0}</div>
            <div className="text-xs text-muted-foreground">Known Offenders</div>
          </CardContent>
        </Card>
      </div>

      {stats?.topOffenders && stats.topOffenders.length > 0 && (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Top Offenders
            </h3>
            <div className="space-y-2">
              {stats.topOffenders.map((o: any, i: number) => (
                <div key={i} className="flex items-center justify-between bg-muted/20 rounded-lg px-4 py-2 border border-border/30" data-testid={`spam-offender-${i}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-muted-foreground">{o.ip}</span>
                    <span className="text-sm font-bold">{o.nickname}</span>
                    <Badge className="bg-red-500/20 text-red-400 border-0 text-[10px]">{o.count} reports</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => banMutation.mutate(o.ip)}
                    className="text-red-400 hover:bg-red-500/10 h-7 px-2"
                    data-testid={`button-ban-offender-${i}`}
                  >
                    <Ban className="w-3 h-3 mr-1" /> Ban
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Ban className="w-5 h-5 text-red-400" />
            Manual IP Ban
          </h3>
          <div className="flex gap-2">
            <Input
              placeholder="IP address"
              value={banIp}
              onChange={(e) => setBanIp(e.target.value)}
              className="flex-1 bg-muted/30 border-border/50"
              data-testid="input-ban-ip"
            />
            <select
              value={banDuration}
              onChange={(e) => setBanDuration(e.target.value)}
              className="bg-muted/30 border border-border/50 rounded-md px-3 text-sm"
              data-testid="select-ban-duration"
            >
              <option value="1">1 hour</option>
              <option value="6">6 hours</option>
              <option value="24">24 hours</option>
              <option value="168">7 days</option>
              <option value="720">30 days</option>
            </select>
            <Button onClick={() => banIp.trim() && banMutation.mutate(banIp.trim())} className="bg-red-500 hover:bg-red-600" data-testid="button-ban-ip">
              <Ban className="w-4 h-4 mr-1" /> Ban
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              Spam Reports ({reportList.length})
            </h3>
            <div className="flex items-center gap-2">
              <div className="flex gap-1 bg-muted/30 rounded-lg p-1">
                {(["unresolved", "all", "resolved"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      filter === f ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
                    }`}
                    data-testid={`button-filter-${f}`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
              {filter === "unresolved" && reportList.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => bulkResolveMutation.mutate()}
                  className="text-xs"
                  data-testid="button-bulk-resolve"
                >
                  <CheckCircle className="w-3 h-3 mr-1" /> Resolve All
                </Button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading reports...</div>
          ) : reportList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bot className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No spam reports found</p>
              <p className="text-xs mt-1">The spam detection engine monitors all chat messages automatically</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {reportList.map((r: any) => (
                <div
                  key={r.id}
                  className={`rounded-lg px-4 py-3 border ${
                    r.autoBanned ? "bg-red-500/10 border-red-500/30" :
                    r.resolved ? "bg-muted/10 border-border/20 opacity-60" :
                    r.severity === "high" || r.severity === "critical" ? "bg-red-500/5 border-red-500/20" :
                    r.severity === "medium" ? "bg-yellow-500/5 border-yellow-500/20" :
                    "bg-muted/20 border-border/30"
                  }`}
                  data-testid={`spam-report-${r.id}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-bold">{r.nickname}</span>
                        <span className="text-xs font-mono text-muted-foreground">{r.ip}</span>
                        <Badge className={`text-[10px] border-0 ${severityColor(r.severity)}`}>{r.severity}</Badge>
                        {r.autoBanned && <Badge className="text-[10px] bg-red-600 text-white border-0">AUTO-BANNED</Badge>}
                        {r.resolved && <Badge className="text-[10px] bg-green-500/20 text-green-400 border-0">Resolved</Badge>}
                        <span className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-yellow-400/80 mb-1">{r.reason}</p>
                      {r.messageText && (
                        <p className="text-xs text-muted-foreground bg-muted/20 rounded px-2 py-1 break-words">&ldquo;{r.messageText}&rdquo;</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {!r.resolved && (
                        <Button variant="ghost" size="sm" onClick={() => resolveMutation.mutate(r.id)} className="text-green-400 hover:bg-green-500/10 h-7 px-2" data-testid={`button-resolve-spam-${r.id}`}>
                          <CheckCircle className="w-3 h-3" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => banMutation.mutate(r.ip)} className="text-red-400 hover:bg-red-500/10 h-7 px-2" data-testid={`button-ban-spam-${r.id}`}>
                        <Ban className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { if (confirm("Delete this report?")) deleteMutation.mutate(r.id); }} className="text-muted-foreground hover:bg-red-500/10 h-7 px-2" data-testid={`button-delete-spam-${r.id}`}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ChatModerationTab({ token }: { token: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: chatMessages, isLoading } = useQuery({
    queryKey: ["admin-chat-messages"],
    queryFn: async () => {
      const res = await fetch("/api/admin/chat-messages", { headers: apiHeaders(token) });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    refetchInterval: 15000,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/chat/${id}`, {
        method: "DELETE",
        headers: apiHeaders(token),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-chat-messages"] });
      toast({ title: "Message deleted" });
    },
  });

  const flagMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/chat/flag/${id}`, {
        method: "POST",
        headers: apiHeaders(token),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-chat-messages"] });
      toast({ title: "Message flagged" });
    },
  });

  const messages = Array.isArray(chatMessages) ? chatMessages : [];
  const flaggedMessages = messages.filter((m: any) => m.flagged);

  return (
    <div className="space-y-6">
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-400" />
            Flagged Messages ({flaggedMessages.length})
          </h3>
          {flaggedMessages.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">No flagged messages</div>
          ) : (
            <div className="space-y-2">
              {flaggedMessages.map((m: any) => (
                <div key={m.id} className="bg-red-500/5 border border-red-500/20 rounded-lg px-4 py-3" data-testid={`flagged-msg-${m.id}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-foreground">{m.nickname}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">{new Date(m.createdAt).toLocaleString()}</span>
                      <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(m.id)} className="text-red-400 hover:bg-red-500/10 h-7 px-2" data-testid={`button-delete-chat-${m.id}`}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{m.message}</p>
                  {m.coinTag && <Badge className="mt-1 text-[10px] bg-primary/20 text-primary border-0">{m.coinTag}</Badge>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            All Messages ({messages.length})
          </h3>
          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground">Loading...</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">No chat messages</div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {messages.map((m: any) => (
                <div key={m.id} className={`flex items-start justify-between gap-2 rounded-lg px-4 py-2 ${m.flagged ? "bg-red-500/5 border border-red-500/20" : "bg-muted/20 border border-border/30"}`} data-testid={`chat-msg-${m.id}`}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{m.nickname}</span>
                      {m.coinTag && <Badge className="text-[10px] bg-primary/20 text-primary border-0">{m.coinTag}</Badge>}
                      {m.flagged && <Badge className="text-[10px] bg-red-500/20 text-red-400 border-0">Flagged</Badge>}
                      <span className="text-xs text-muted-foreground">{new Date(m.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 break-words">{m.message}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!m.flagged && (
                      <Button variant="ghost" size="sm" onClick={() => flagMutation.mutate(m.id)} className="text-yellow-400 hover:bg-yellow-500/10 h-7 px-2" data-testid={`button-flag-chat-${m.id}`}>
                        <Shield className="w-3 h-3" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => { if (confirm("Delete this message?")) deleteMutation.mutate(m.id); }} className="text-red-400 hover:bg-red-500/10 h-7 px-2" data-testid={`button-delete-chat-${m.id}`}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const BANNER_SIZES = [
  { id: "728x90", label: "Leaderboard", width: 728, height: 90, desc: "Desktop header/footer" },
  { id: "300x250", label: "Medium Rectangle", width: 300, height: 250, desc: "Sidebar, in-content" },
  { id: "320x50", label: "Mobile Leaderboard", width: 320, height: 50, desc: "Mobile top/bottom" },
  { id: "160x600", label: "Wide Skyscraper", width: 160, height: 600, desc: "Sidebar vertical" },
  { id: "300x600", label: "Half-Page Ad", width: 300, height: 600, desc: "Sidebar large" },
] as const;

const BANNER_PRESETS = [
  { name: "TradingView", url: "https://www.tradingview.com/pricing/?share_your_love=moneyflowstome78&mobileapp=true", color: "#00C8FF", bg: "#0a1929" },
  { name: "Coinbase", url: "https://coinbase.com/join/NC7ZTX4?src=ios-link", color: "#0052FF", bg: "#0a1020" },
  { name: "Pineify", url: "https://pineify.app/?via=Tokenaltcoin", color: "#22C55E", bg: "#0a1f0a" },
  { name: "Good Crypto", url: "https://click.goodcrypto.app/b9EC/ie88jiew?ref=rET1nQ", color: "#A855F7", bg: "#150a2e" },
  { name: "GoMining", url: "https://gomining.com/?ref=8H3M22H", color: "#F97316", bg: "#1f0f00" },
  { name: "TokenAltcoin", url: "https://tokenaltcoin.com", color: "#00C8FF", bg: "#0a0f1a" },
];

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function generateBannerHtml(config: {
  size: typeof BANNER_SIZES[number];
  title: string;
  tagline: string;
  ctaText: string;
  url: string;
  accentColor: string;
  bgColor: string;
  animated: boolean;
}): string {
  const { size, accentColor, bgColor, animated } = config;
  const title = escHtml(config.title);
  const tagline = escHtml(config.tagline);
  const ctaText = escHtml(config.ctaText);
  const url = escHtml(config.url);
  const w = size.width;
  const h = size.height;
  const isHorizontal = w > h * 2;
  const isMobile = w === 320 && h === 50;
  const isTall = h > w;

  const animCss = animated ? `
    @keyframes bannerPulse { 0%,100% { box-shadow: 0 0 10px ${accentColor}33; } 50% { box-shadow: 0 0 20px ${accentColor}55; } }
    @keyframes bannerShine { 0% { left: -100%; } 100% { left: 200%; } }
    .ta-banner:hover .ta-shine { animation: bannerShine 0.8s ease; }
    .ta-banner { animation: bannerPulse 3s ease-in-out infinite; }
    .ta-cta:hover { transform: scale(1.05); filter: brightness(1.2); }` : '';

  if (isMobile) {
    return `<!-- TokenAltcoin Banner ${w}x${h} -->
<a href="${url}" target="_blank" rel="noopener noreferrer" class="ta-banner" style="display:flex;align-items:center;width:${w}px;height:${h}px;background:${bgColor};border:1px solid ${accentColor}33;border-radius:8px;text-decoration:none;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;position:relative;">
  <style>${animCss}</style>
  <div style="width:32px;height:32px;margin:0 8px;border-radius:6px;background:${accentColor}22;border:1px solid ${accentColor}44;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
    <span style="color:${accentColor};font-size:14px;font-weight:800;">⚡</span>
  </div>
  <div style="flex:1;min-width:0;">
    <div style="font-size:11px;font-weight:700;color:${accentColor};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${title}</div>
    <div style="font-size:9px;color:#888;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${tagline}</div>
  </div>
  <div class="ta-cta" style="margin:0 8px;padding:4px 10px;background:${accentColor}22;border:1px solid ${accentColor}44;border-radius:4px;font-size:10px;font-weight:600;color:${accentColor};white-space:nowrap;transition:all 0.2s;">${ctaText}</div>
  ${animated ? `<div class="ta-shine" style="position:absolute;top:0;width:40px;height:100%;background:linear-gradient(90deg,transparent,${accentColor}11,transparent);"></div>` : ''}
</a>`;
  }

  if (isHorizontal) {
    return `<!-- TokenAltcoin Banner ${w}x${h} -->
<a href="${url}" target="_blank" rel="noopener noreferrer" class="ta-banner" style="display:flex;align-items:center;width:${w}px;height:${h}px;background:${bgColor};border:1px solid ${accentColor}33;border-radius:12px;text-decoration:none;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;position:relative;">
  <style>${animCss}</style>
  <div style="width:52px;height:52px;margin:0 16px;border-radius:10px;background:${accentColor}22;border:1px solid ${accentColor}44;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
    <span style="color:${accentColor};font-size:22px;font-weight:800;">⚡</span>
  </div>
  <div style="flex:1;min-width:0;">
    <div style="display:flex;align-items:center;gap:8px;">
      <span style="font-size:14px;font-weight:700;color:${accentColor};">${title}</span>
      <span style="font-size:9px;color:#666;background:#ffffff11;padding:2px 6px;border-radius:4px;">Sponsored</span>
    </div>
    <div style="font-size:12px;color:#aaa;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${tagline}</div>
  </div>
  <div class="ta-cta" style="margin:0 16px;padding:8px 20px;background:${accentColor}22;border:1px solid ${accentColor}44;border-radius:8px;font-size:12px;font-weight:600;color:${accentColor};white-space:nowrap;transition:all 0.2s;display:flex;align-items:center;gap:6px;">${ctaText} →</div>
  ${animated ? `<div class="ta-shine" style="position:absolute;top:0;width:60px;height:100%;background:linear-gradient(90deg,transparent,${accentColor}11,transparent);"></div>` : ''}
</a>`;
  }

  if (isTall) {
    return `<!-- TokenAltcoin Banner ${w}x${h} -->
<a href="${url}" target="_blank" rel="noopener noreferrer" class="ta-banner" style="display:flex;flex-direction:column;align-items:center;justify-content:space-between;width:${w}px;height:${h}px;background:${bgColor};border:1px solid ${accentColor}33;border-radius:12px;text-decoration:none;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:${h > 400 ? '32px 16px' : '20px 12px'};box-sizing:border-box;text-align:center;position:relative;">
  <style>${animCss}</style>
  <span style="font-size:8px;color:#555;">Sponsored</span>
  <div>
    <div style="width:${h > 400 ? 56 : 44}px;height:${h > 400 ? 56 : 44}px;margin:0 auto ${h > 400 ? 16 : 8}px;border-radius:12px;background:${accentColor}22;border:1px solid ${accentColor}44;display:flex;align-items:center;justify-content:center;">
      <span style="color:${accentColor};font-size:${h > 400 ? 24 : 18}px;font-weight:800;">⚡</span>
    </div>
    <div style="font-size:${h > 400 ? 16 : 13}px;font-weight:700;color:${accentColor};">${title}</div>
    <div style="font-size:${h > 400 ? 11 : 9}px;color:#888;margin-top:4px;">${tagline}</div>
  </div>
  <div style="font-size:${h > 400 ? 11 : 9}px;color:#aaa;line-height:1.5;padding:0 ${h > 400 ? 8 : 4}px;">${tagline}</div>
  <div class="ta-cta" style="width:80%;padding:${h > 400 ? '10px' : '6px'};background:${accentColor}22;border:1px solid ${accentColor}44;border-radius:8px;font-size:${h > 400 ? 12 : 10}px;font-weight:600;color:${accentColor};transition:all 0.2s;">${ctaText} →</div>
  ${animated ? `<div class="ta-shine" style="position:absolute;top:0;left:-100%;width:60px;height:100%;background:linear-gradient(90deg,transparent,${accentColor}11,transparent);"></div>` : ''}
</a>`;
  }

  return `<!-- TokenAltcoin Banner ${w}x${h} -->
<a href="${url}" target="_blank" rel="noopener noreferrer" class="ta-banner" style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:${w}px;height:${h}px;background:${bgColor};border:1px solid ${accentColor}33;border-radius:12px;text-decoration:none;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;text-align:center;position:relative;padding:20px;box-sizing:border-box;">
  <style>${animCss}</style>
  <div style="width:48px;height:48px;margin-bottom:12px;border-radius:10px;background:${accentColor}22;border:1px solid ${accentColor}44;display:flex;align-items:center;justify-content:center;">
    <span style="color:${accentColor};font-size:20px;font-weight:800;">⚡</span>
  </div>
  <div style="font-size:15px;font-weight:700;color:${accentColor};">${title}</div>
  <div style="font-size:10px;color:#888;margin-top:2px;">${tagline}</div>
  <div style="font-size:11px;color:#aaa;margin-top:8px;line-height:1.4;">${tagline}</div>
  <div class="ta-cta" style="margin-top:12px;padding:8px 24px;background:${accentColor}22;border:1px solid ${accentColor}44;border-radius:8px;font-size:12px;font-weight:600;color:${accentColor};transition:all 0.2s;">${ctaText} →</div>
  <span style="font-size:7px;color:#555;margin-top:8px;">Sponsored</span>
  ${animated ? `<div class="ta-shine" style="position:absolute;top:0;left:-100%;width:60px;height:100%;background:linear-gradient(90deg,transparent,${accentColor}11,transparent);"></div>` : ''}
</a>`;
}

function BannersTab({ token }: { token: string }) {
  const [subTab, setSubTab] = useState<"manage" | "inquiries" | "settings" | "generator">("manage");
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
        <Image className="w-5 h-5 text-primary" /> Banner Ads
      </h2>
      <div className="flex gap-1 flex-wrap">
        {([
          { key: "manage", label: "Manage Banners" },
          { key: "inquiries", label: "Inquiries" },
          { key: "settings", label: "Settings" },
          { key: "generator", label: "Code Generator" },
        ] as const).map(({ key, label }) => (
          <button key={key} onClick={() => setSubTab(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${subTab === key ? "bg-primary/20 text-primary border border-primary/30" : "bg-muted/30 text-muted-foreground hover:text-foreground border border-border/30"}`}
            data-testid={`button-banner-subtab-${key}`}>{label}</button>
        ))}
      </div>
      {subTab === "manage" && <BannerManageSection token={token} />}
      {subTab === "inquiries" && <BannerInquiriesSection token={token} />}
      {subTab === "settings" && <BannerSettingsSection token={token} />}
      {subTab === "generator" && <BannerGeneratorSection />}
    </div>
  );
}

const AD_BANNER_SIZES = ["728x90", "468x60", "300x250", "160x600", "320x50", "970x90", "336x280"];
const AD_BANNER_ZONES = ["header", "footer", "sidebar", "blog-top", "blog-middle", "blog-bottom"];

function BannerManageSection({ token }: { token: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", imageUrl: "", targetUrl: "", size: "468x60", zone: "footer", active: true, sortOrder: 0 });

  const { data: bannerList, isLoading } = useQuery({
    queryKey: ["admin-banners"],
    queryFn: async () => {
      const res = await fetch("/api/admin/banners", { headers: apiHeaders(token) });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const banners = Array.isArray(bannerList) ? bannerList : [];

  const saveMutation = useMutation({
    mutationFn: async () => {
      const url = editId ? `/api/admin/banners/${editId}` : "/api/admin/banners";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { ...apiHeaders(token), "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || "Failed"); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      toast({ title: editId ? "Banner updated" : "Banner created" });
      setShowForm(false);
      setEditId(null);
      setForm({ name: "", imageUrl: "", targetUrl: "", size: "468x60", zone: "footer", active: true, sortOrder: 0 });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/banners/${id}`, { method: "DELETE", headers: apiHeaders(token) });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      toast({ title: "Banner deleted" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      const res = await fetch(`/api/admin/banners/${id}`, { method: "PUT", headers: { ...apiHeaders(token), "Content-Type": "application/json" }, body: JSON.stringify({ active }) });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-banners"] }),
  });

  function startEdit(b: any) {
    setForm({ name: b.name, imageUrl: b.imageUrl, targetUrl: b.targetUrl, size: b.size, zone: b.zone, active: b.active, sortOrder: b.sortOrder || 0 });
    setEditId(b.id);
    setShowForm(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{banners.length} banner(s)</p>
        <Button size="sm" onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ name: "", imageUrl: "", targetUrl: "", size: "468x60", zone: "footer", active: true, sortOrder: 0 }); }}
          className="bg-primary hover:bg-primary/90" data-testid="button-add-banner">
          <Plus className="w-4 h-4 mr-1" /> {showForm ? "Cancel" : "Add Banner"}
        </Button>
      </div>

      {showForm && (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-bold">{editId ? "Edit Banner" : "New Banner"}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Name</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Banner name" className="bg-muted/30 border-border text-sm" data-testid="input-ad-banner-name" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Target URL</label>
                <Input value={form.targetUrl} onChange={(e) => setForm({ ...form, targetUrl: e.target.value })} placeholder="https://..." className="bg-muted/30 border-border text-sm" data-testid="input-ad-banner-url" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] text-muted-foreground block mb-1">Image URL</label>
                <Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://example.com/banner.png" className="bg-muted/30 border-border text-sm" data-testid="input-ad-banner-image" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Size</label>
                <select value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} className="w-full bg-muted/30 border border-border rounded-md px-3 py-2 text-sm" data-testid="select-ad-banner-size">
                  {AD_BANNER_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Zone</label>
                <select value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })} className="w-full bg-muted/30 border border-border rounded-md px-3 py-2 text-sm" data-testid="select-ad-banner-zone">
                  {AD_BANNER_ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Sort Order</label>
                <Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} className="bg-muted/30 border-border text-sm" data-testid="input-ad-banner-order" />
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setForm({ ...form, active: !form.active })}
                  className={`w-10 h-5 rounded-full transition-colors ${form.active ? "bg-primary" : "bg-muted/50"} relative`} data-testid="toggle-ad-banner-active">
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${form.active ? "left-5" : "left-0.5"}`} />
                </button>
                <span className="text-xs">Active</span>
              </div>
            </div>
            {form.imageUrl && (
              <div className="bg-muted/20 rounded-lg p-2">
                <p className="text-[10px] text-muted-foreground mb-1">Preview:</p>
                <img src={form.imageUrl} alt="Preview" className="max-h-24 rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </div>
            )}
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.name || !form.imageUrl || !form.targetUrl}
              className="bg-primary hover:bg-primary/90" data-testid="button-save-ad-banner">
              <Save className="w-4 h-4 mr-1" /> {editId ? "Update" : "Create"} Banner
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? <div className="text-muted-foreground text-sm">Loading...</div> : banners.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Image className="w-10 h-10 mx-auto mb-2 opacity-30" /><p className="text-sm">No banners yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {banners.map((b: any) => (
            <div key={b.id} className="flex items-center gap-3 bg-muted/20 rounded-lg p-3 border border-border/30" data-testid={`banner-row-${b.id}`}>
              {b.imageUrl && <img src={b.imageUrl} alt={b.name} className="w-16 h-10 rounded object-cover shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{b.name}</span>
                  <Badge className={`text-[10px] ${b.active ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}`}>{b.active ? "Active" : "Inactive"}</Badge>
                  <Badge className="text-[10px] bg-muted/30 border-border">{b.size}</Badge>
                  <Badge className="text-[10px] bg-muted/30 border-border">{b.zone}</Badge>
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5 flex gap-3">
                  <span>{b.clicks || 0} clicks</span>
                  <span className="truncate max-w-[200px]">{b.targetUrl}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => toggleMutation.mutate({ id: b.id, active: !b.active })}
                  className={`w-8 h-4 rounded-full transition-colors ${b.active ? "bg-primary" : "bg-muted/50"} relative`} data-testid={`toggle-banner-${b.id}`}>
                  <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-all ${b.active ? "left-4" : "left-0.5"}`} />
                </button>
                <Button size="sm" variant="ghost" onClick={() => startEdit(b)} className="h-7 w-7 p-0" data-testid={`button-edit-banner-${b.id}`}>
                  <Edit className="w-3.5 h-3.5" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete this banner?")) deleteMutation.mutate(b.id); }} className="h-7 w-7 p-0 text-red-400" data-testid={`button-delete-banner-${b.id}`}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BannerInquiriesSection({ token }: { token: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [replyId, setReplyId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  const { data: inquiryList, isLoading } = useQuery({
    queryKey: ["admin-banner-inquiries"],
    queryFn: async () => {
      const res = await fetch("/api/admin/banner-inquiries", { headers: apiHeaders(token) });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const inquiries = Array.isArray(inquiryList) ? inquiryList : [];

  const replyMutation = useMutation({
    mutationFn: async ({ id, status, adminReply }: { id: number; status: string; adminReply?: string }) => {
      const res = await fetch(`/api/admin/banner-inquiries/${id}`, { method: "PUT", headers: { ...apiHeaders(token), "Content-Type": "application/json" }, body: JSON.stringify({ status, adminReply }) });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banner-inquiries"] });
      toast({ title: "Inquiry updated" });
      setReplyId(null);
      setReplyText("");
    },
  });

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">{inquiries.length} inquiry(ies) from potential advertisers</p>
      {isLoading ? <div className="text-muted-foreground text-sm">Loading...</div> : inquiries.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Mail className="w-10 h-10 mx-auto mb-2 opacity-30" /><p className="text-sm">No inquiries yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {inquiries.map((inq: any) => (
            <Card key={inq.id} className="bg-card/50 border-border/50">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{inq.name}</span>
                      <Badge className={`text-[10px] ${inq.status === "pending" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" : inq.status === "replied" ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-muted/30 border-border text-muted-foreground"}`}>{inq.status}</Badge>
                      <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">{inq.bannerSize}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{inq.email}{inq.company ? ` — ${inq.company}` : ""}</p>
                    <p className="text-[10px] text-muted-foreground/60">{new Date(inq.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {inq.status === "pending" && (
                      <Button size="sm" variant="outline" onClick={() => { setReplyId(replyId === inq.id ? null : inq.id); setReplyText(inq.adminReply || ""); }}
                        className="text-xs h-7" data-testid={`button-reply-inquiry-${inq.id}`}>Reply</Button>
                    )}
                    {inq.status !== "closed" && (
                      <Button size="sm" variant="ghost" onClick={() => replyMutation.mutate({ id: inq.id, status: "closed" })}
                        className="text-xs h-7" data-testid={`button-close-inquiry-${inq.id}`}><X className="w-3 h-3" /></Button>
                    )}
                  </div>
                </div>
                <div className="bg-muted/20 rounded-lg p-3">
                  <p className="text-xs">{inq.message}</p>
                </div>
                {inq.adminReply && (
                  <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
                    <p className="text-[10px] text-primary font-medium mb-1">Your Reply:</p>
                    <p className="text-xs">{inq.adminReply}</p>
                  </div>
                )}
                {replyId === inq.id && (
                  <div className="space-y-2">
                    <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Write your reply..."
                      rows={3} className="w-full bg-muted/30 border border-border rounded-md px-3 py-2 text-sm resize-none" data-testid={`textarea-reply-${inq.id}`} />
                    <Button size="sm" onClick={() => replyMutation.mutate({ id: inq.id, status: "replied", adminReply: replyText })}
                      disabled={!replyText.trim()} className="bg-primary hover:bg-primary/90" data-testid={`button-send-reply-${inq.id}`}>
                      <Send className="w-3 h-3 mr-1" /> Send Reply
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function BannerSettingsSection({ token }: { token: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [localSettings, setLocalSettings] = useState<Record<string, string>>({});

  const { data: settings } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/settings", { headers: apiHeaders(token) });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  useEffect(() => {
    if (settings && typeof settings === "object" && !Array.isArray(settings)) {
      setLocalSettings(prev => ({ ...settings, ...prev }));
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const bannerKeys = ["banner_rotation_enabled", "banner_rotation_interval", "banner_footer_enabled", "banner_blog_enabled"];
      const updates: Record<string, string> = {};
      bannerKeys.forEach(k => { if (localSettings[k] !== undefined) updates[k] = localSettings[k]; });
      const res = await fetch("/api/admin/settings", { method: "PUT", headers: { ...apiHeaders(token), "Content-Type": "application/json" }, body: JSON.stringify(updates) });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      queryClient.invalidateQueries({ queryKey: ["banner-settings"] });
      toast({ title: "Banner settings saved" });
    },
  });

  function toggle(key: string) {
    setLocalSettings(prev => ({ ...prev, [key]: prev[key] === "false" ? "true" : "false" }));
  }

  const isOn = (key: string) => localSettings[key] !== "false";

  return (
    <div className="space-y-4">
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-4 space-y-4">
          <h3 className="text-sm font-bold">Banner Display Settings</h3>

          {[
            { key: "banner_rotation_enabled", label: "Enable Banner Rotation", desc: "Automatically rotate between multiple banners in the same zone" },
            { key: "banner_footer_enabled", label: "Show Footer Banner", desc: "Display a 468x60 banner in the site footer" },
            { key: "banner_blog_enabled", label: "Show Blog Banners", desc: "Display banners in blog listing pages (top, middle, bottom)" },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">{label}</span>
                <p className="text-[10px] text-muted-foreground">{desc}</p>
              </div>
              <button onClick={() => toggle(key)}
                className={`w-10 h-5 rounded-full transition-colors ${isOn(key) ? "bg-primary" : "bg-muted/50"} relative`} data-testid={`toggle-setting-${key}`}>
                <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${isOn(key) ? "left-5" : "left-0.5"}`} />
              </button>
            </div>
          ))}

          <div>
            <label className="text-sm font-medium block mb-1">Rotation Interval (seconds)</label>
            <p className="text-[10px] text-muted-foreground mb-2">Time between banner rotations when multiple banners are in the same zone</p>
            <Input type="number" value={localSettings["banner_rotation_interval"] || "8"}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, banner_rotation_interval: e.target.value }))}
              className="bg-muted/30 border-border text-sm w-32" data-testid="input-rotation-interval" />
          </div>

          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="bg-primary hover:bg-primary/90" data-testid="button-save-banner-settings">
            <Save className="w-4 h-4 mr-1" /> Save Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function BannerGeneratorSection() {
  const { toast } = useToast();
  const [selectedSize, setSelectedSize] = useState<typeof BANNER_SIZES[number]>(BANNER_SIZES[0]);
  const [title, setTitle] = useState("TokenAltcoin");
  const [tagline, setTagline] = useState("Free Multi-Chain Crypto Platform");
  const [ctaText, setCtaText] = useState("Visit Now");
  const [url, setUrl] = useState("https://tokenaltcoin.com");
  const [accentColor, setAccentColor] = useState("#00C8FF");
  const [bgColor, setBgColor] = useState("#0a0f1a");
  const [animated, setAnimated] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  const applyPreset = (preset: typeof BANNER_PRESETS[number]) => {
    setTitle(preset.name);
    setUrl(preset.url);
    setAccentColor(preset.color);
    setBgColor(preset.bg);
  };

  const currentHtml = generateBannerHtml({ size: selectedSize, title, tagline, ctaText, url, accentColor, bgColor, animated });

  const copyCode = (code: string, label: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(label);
      toast({ title: `${label} copied!` });
      setTimeout(() => setCopied(null), 2000);
    }).catch(() => {
      toast({ title: "Copy failed", description: "Please select and copy the code manually", variant: "destructive" });
    });
  };

  const allBannersHtml = BANNER_SIZES.map(s =>
    generateBannerHtml({ size: s, title, tagline, ctaText, url, accentColor, bgColor, animated })
  ).join("\n\n");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-xs text-muted-foreground">Create affiliate banners with embed codes for external websites</p>
        <Button size="sm" onClick={() => copyCode(allBannersHtml, "All banners")} className="bg-primary hover:bg-primary/90" data-testid="button-copy-all-banners">
          <Code className="w-4 h-4 mr-1" /> Copy All Sizes
        </Button>
      </div>

      <div className="glass-panel rounded-xl p-4 border border-border">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Presets</h3>
        <div className="flex gap-2 flex-wrap">
          {BANNER_PRESETS.map(preset => (
            <button key={preset.name} onClick={() => applyPreset(preset)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:border-primary/40 bg-muted/20 hover:bg-muted/40 transition-all text-xs"
              data-testid={`button-preset-${preset.name.toLowerCase().replace(/\s/g, "-")}`}>
              <span className="w-3 h-3 rounded-full" style={{ background: preset.color }} />{preset.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="glass-panel rounded-xl p-4 border border-border space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Banner Content</h3>
            <div><label className="text-[10px] text-muted-foreground mb-1 block">Title</label><Input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-muted/30 border-border text-sm" data-testid="input-banner-title" /></div>
            <div><label className="text-[10px] text-muted-foreground mb-1 block">Tagline / Description</label><Input value={tagline} onChange={(e) => setTagline(e.target.value)} className="bg-muted/30 border-border text-sm" data-testid="input-banner-tagline" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[10px] text-muted-foreground mb-1 block">CTA Button Text</label><Input value={ctaText} onChange={(e) => setCtaText(e.target.value)} className="bg-muted/30 border-border text-sm" data-testid="input-banner-cta" /></div>
              <div><label className="text-[10px] text-muted-foreground mb-1 block">Link URL</label><Input value={url} onChange={(e) => setUrl(e.target.value)} className="bg-muted/30 border-border text-sm" data-testid="input-banner-url" /></div>
            </div>
          </div>
          <div className="glass-panel rounded-xl p-4 border border-border space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Styling</h3>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[10px] text-muted-foreground mb-1 block">Accent Color</label><div className="flex gap-2 items-center"><input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" data-testid="input-banner-accent" /><Input value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="bg-muted/30 border-border text-sm flex-1 font-mono" data-testid="input-banner-accent-hex" /></div></div>
              <div><label className="text-[10px] text-muted-foreground mb-1 block">Background Color</label><div className="flex gap-2 items-center"><input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" data-testid="input-banner-bg" /><Input value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="bg-muted/30 border-border text-sm flex-1 font-mono" data-testid="input-banner-bg-hex" /></div></div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setAnimated(!animated)} className={`w-10 h-5 rounded-full transition-colors ${animated ? "bg-primary" : "bg-muted/50"} relative`} data-testid="toggle-banner-animated"><div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${animated ? "left-5" : "left-0.5"}`} /></button>
              <span className="text-xs text-foreground">Animated</span>
            </div>
          </div>
          <div className="glass-panel rounded-xl p-4 border border-border space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Banner Size</h3>
            <div className="grid grid-cols-1 gap-2">
              {BANNER_SIZES.map(size => (
                <button key={size.id} onClick={() => setSelectedSize(size)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-all text-left ${selectedSize.id === size.id ? "border-primary/50 bg-primary/10" : "border-border bg-muted/10 hover:bg-muted/20"}`}
                  data-testid={`button-size-${size.id}`}>
                  <div><span className="text-xs font-semibold text-foreground">{size.label}</span><span className="text-[10px] text-muted-foreground ml-2">{size.desc}</span></div>
                  <Badge variant="outline" className={`text-[10px] ${selectedSize.id === size.id ? "border-primary/50 text-primary" : "border-border"}`}>{size.id}</Badge>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="glass-panel rounded-xl p-4 border border-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Live Preview — {selectedSize.label} ({selectedSize.id})</h3>
              <Badge variant="outline" className="text-[10px]">{selectedSize.width}×{selectedSize.height}px</Badge>
            </div>
            <div className="flex justify-center overflow-auto p-4 bg-[#111] rounded-lg border border-border min-h-[120px]">
              <div dangerouslySetInnerHTML={{ __html: currentHtml }} />
            </div>
          </div>
          <div className="glass-panel rounded-xl p-4 border border-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Embed Code</h3>
              <Button size="sm" variant="outline" onClick={() => copyCode(currentHtml, selectedSize.label)} className="text-xs" data-testid="button-copy-embed">
                {copied === selectedSize.label ? <Check className="w-3 h-3 mr-1 text-green-400" /> : <Copy className="w-3 h-3 mr-1" />}
                {copied === selectedSize.label ? "Copied!" : "Copy Code"}
              </Button>
            </div>
            <pre className="text-[10px] text-muted-foreground bg-muted/20 rounded-lg p-3 overflow-x-auto max-h-48 whitespace-pre-wrap break-all font-mono border border-border" data-testid="code-embed-preview">{currentHtml}</pre>
          </div>
        </div>
      </div>
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

  const { data: pendingAirdrops } = useQuery({
    queryKey: ["admin-airdrops-pending-count"],
    queryFn: async () => {
      const res = await fetch("/api/admin/airdrops/pending-count", { headers: apiHeaders(token) });
      if (!res.ok) return { count: 0 };
      return res.json();
    },
  });
  const pendingAirdropCount = pendingAirdrops?.count || 0;

  const [activeTab, setActiveTab] = useState("analytics");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const adminTabs = [
    { value: "analytics", label: "Analytics", icon: BarChart3 },
    { value: "adsense", label: "Settings", icon: Zap },
    { value: "content", label: "Content", icon: Newspaper },
    { value: "exchanges", label: "Exchanges", icon: Building2 },
    { value: "messages", label: "Messages", icon: Mail, badge: unreadCount > 0 ? unreadCount : undefined },
    { value: "airdrops", label: "Airdrops", icon: Gift, badge: pendingAirdropCount > 0 ? pendingAirdropCount : undefined },
    { value: "blog", label: "Blog", icon: FileText },
    { value: "seo", label: "SEO", icon: Search },
    { value: "banners", label: "Banners", icon: Image },
    { value: "security", label: "Security", icon: Shield },
    { value: "spam", label: "Spam Monitor", icon: Bot },
    { value: "chat", label: "Chat", icon: Users },
  ];

  const currentTab = adminTabs.find(t => t.value === activeTab) || adminTabs[0];

  return (
    <div className="space-y-6">
      <div className="md:hidden relative">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="w-full flex items-center justify-between bg-muted/30 border border-border rounded-lg px-4 py-3 text-sm font-medium text-foreground"
          data-testid="button-admin-mobile-menu"
        >
          <span className="flex items-center gap-2">
            <currentTab.icon className="w-4 h-4 text-primary" />
            {currentTab.label}
            {currentTab.badge && (
              <Badge className="bg-red-500 text-white border-0 text-[9px] px-1.5 py-0 min-w-[18px] h-[18px] flex items-center justify-center">
                {currentTab.badge}
              </Badge>
            )}
          </span>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${mobileMenuOpen ? "rotate-180" : ""}`} />
        </button>
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 overflow-hidden">
            {adminTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => { setActiveTab(tab.value); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                  activeTab === tab.value
                    ? "bg-primary/10 text-primary border-l-2 border-primary"
                    : "text-foreground hover:bg-muted/30"
                }`}
                data-testid={`tab-mobile-${tab.value}`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.badge && (
                  <Badge className="ml-auto bg-red-500 text-white border-0 text-[9px] px-1.5 py-0 min-w-[18px] h-[18px] flex items-center justify-center">
                    {tab.badge}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="hidden md:block overflow-x-auto">
        <div className="bg-muted/30 border border-border rounded-lg p-1 flex gap-1 w-max min-w-full">
          {adminTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.value
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
              }`}
              data-testid={`tab-${tab.value}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.badge && (
                <Badge className="bg-red-500 text-white border-0 text-[9px] px-1.5 py-0 min-w-[18px] h-[18px] flex items-center justify-center" data-testid="badge-unread-messages">
                  {tab.badge}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "analytics" && <AnalyticsTab token={token} />}
      {activeTab === "adsense" && <SettingsTab token={token} />}
      {activeTab === "content" && <ContentTab token={token} />}
      {activeTab === "exchanges" && <ExchangesTab token={token} />}
      {activeTab === "messages" && <MessagesTab token={token} />}
      {activeTab === "airdrops" && <AirdropsTab token={token} />}
      {activeTab === "blog" && <BlogTab token={token} />}
      {activeTab === "seo" && <SeoTab token={token} />}
      {activeTab === "banners" && <BannersTab token={token} />}
      {activeTab === "security" && <SecurityTab token={token} />}
      {activeTab === "spam" && <SpamMonitorTab token={token} />}
      {activeTab === "chat" && <ChatModerationTab token={token} />}
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
        <AdminTabs token={token} />
      </main>
    </div>
  );
}
