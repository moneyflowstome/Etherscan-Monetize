import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  BellRing,
  Search,
  Trash2,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AdBanner } from "@/components/AdBanner";
import { useToast } from "@/hooks/use-toast";

interface PriceAlert {
  id: string;
  coinId: string;
  coinName: string;
  coinSymbol: string;
  coinImage: string;
  upperThreshold: number | null;
  lowerThreshold: number | null;
  createdAt: number;
  triggered: boolean;
  triggeredAt: number | null;
  triggeredDirection: "above" | "below" | null;
  triggeredPrice: number | null;
}

const STORAGE_KEY = "tokenaltcoin_price_alerts";

function getStoredAlerts(): PriceAlert[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAlerts(alerts: PriceAlert[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
}

function formatPrice(price: number | null | undefined): string {
  if (price == null) return "—";
  if (price < 0.001) return `$${price.toFixed(8)}`;
  if (price < 1) return `$${price.toFixed(6)}`;
  return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function CoinSearch({ onSelect }: { onSelect: (coin: any) => void }) {
  const [search, setSearch] = useState("");

  const pricesQuery = useQuery({
    queryKey: ["/api/prices", "alerts-search"],
    queryFn: async () => {
      const res = await fetch("/api/prices?page=1&per_page=100");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 60000,
  });

  const allCoins = pricesQuery.data && Array.isArray(pricesQuery.data) ? pricesQuery.data : [];
  const filtered = search.length >= 1
    ? allCoins
        .filter(
          (c: any) =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.symbol.toLowerCase().includes(search.toLowerCase())
        )
        .slice(0, 8)
    : [];

  return (
    <div className="relative">
      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search coins to set alerts..."
        className="bg-muted/30 border-border pl-10 h-10 text-sm"
        data-testid="input-alert-search"
      />
      {filtered.length > 0 && (
        <div className="absolute left-0 right-0 top-12 bg-card border border-border rounded-xl p-2 z-50 shadow-2xl max-h-[300px] overflow-y-auto">
          {filtered.map((coin: any) => (
            <button
              key={coin.id}
              onClick={() => {
                onSelect(coin);
                setSearch("");
              }}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center gap-3 transition-colors text-muted-foreground hover:text-foreground hover:bg-muted/30"
              data-testid={`button-select-${coin.id}`}
            >
              <img src={coin.image} alt="" className="w-5 h-5 rounded-full" />
              <span className="font-medium text-foreground">{coin.name}</span>
              <span className="text-xs uppercase text-muted-foreground">{coin.symbol}</span>
              <span className="ml-auto text-xs font-mono">{formatPrice(coin.current_price)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateAlertForm({
  coin,
  onCancel,
  onSave,
}: {
  coin: any;
  onCancel: () => void;
  onSave: (alert: PriceAlert) => void;
}) {
  const [upper, setUpper] = useState("");
  const [lower, setLower] = useState("");
  const { toast } = useToast();

  const handleSubmit = () => {
    const upperVal = upper ? parseFloat(upper) : null;
    const lowerVal = lower ? parseFloat(lower) : null;

    if (upperVal === null && lowerVal === null) {
      toast({ title: "Set at least one threshold", variant: "destructive" });
      return;
    }
    if (upperVal !== null && isNaN(upperVal)) {
      toast({ title: "Invalid upper threshold", variant: "destructive" });
      return;
    }
    if (lowerVal !== null && isNaN(lowerVal)) {
      toast({ title: "Invalid lower threshold", variant: "destructive" });
      return;
    }

    const newAlert: PriceAlert = {
      id: `${coin.id}-${Date.now()}`,
      coinId: coin.id,
      coinName: coin.name,
      coinSymbol: coin.symbol,
      coinImage: coin.image,
      upperThreshold: upperVal,
      lowerThreshold: lowerVal,
      createdAt: Date.now(),
      triggered: false,
      triggeredAt: null,
      triggeredDirection: null,
      triggeredPrice: null,
    };

    onSave(newAlert);
  };

  return (
    <Card className="glass-panel border-primary/30 mb-6" data-testid="card-create-alert">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <img src={coin.image} alt="" className="w-8 h-8 rounded-full" />
            <div>
              <h3 className="font-display font-bold text-foreground">{coin.name}</h3>
              <span className="text-xs text-muted-foreground uppercase">{coin.symbol}</span>
              <span className="text-xs font-mono text-foreground ml-2">
                Current: {formatPrice(coin.current_price)}
              </span>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground p-1"
            data-testid="button-cancel-alert"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">
              <ArrowUpRight className="w-3 h-3 inline mr-1 text-green-400" />
              Alert when price goes above
            </label>
            <Input
              type="number"
              step="any"
              value={upper}
              onChange={(e) => setUpper(e.target.value)}
              placeholder={`e.g. ${(coin.current_price * 1.1).toFixed(2)}`}
              className="bg-muted/30 border-border h-10 text-sm font-mono"
              data-testid="input-upper-threshold"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">
              <ArrowDownRight className="w-3 h-3 inline mr-1 text-red-400" />
              Alert when price goes below
            </label>
            <Input
              type="number"
              step="any"
              value={lower}
              onChange={(e) => setLower(e.target.value)}
              placeholder={`e.g. ${(coin.current_price * 0.9).toFixed(2)}`}
              className="bg-muted/30 border-border h-10 text-sm font-mono"
              data-testid="input-lower-threshold"
            />
          </div>
        </div>

        <Button onClick={handleSubmit} className="w-full" data-testid="button-save-alert">
          <Plus className="w-4 h-4 mr-2" />
          Create Alert
        </Button>
      </CardContent>
    </Card>
  );
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<PriceAlert[]>(getStoredAlerts);
  const [selectedCoin, setSelectedCoin] = useState<any>(null);
  const { toast } = useToast();
  const triggeredRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const alreadyTriggered = alerts.filter((a) => a.triggered).map((a) => a.id);
    triggeredRef.current = new Set(alreadyTriggered);
  }, []);

  const activeAlerts = alerts.filter((a) => !a.triggered);
  const triggeredAlerts = alerts.filter((a) => a.triggered);

  const coinIds = Array.from(new Set(activeAlerts.map((a) => a.coinId)));

  const pricesQuery = useQuery({
    queryKey: ["/api/prices/by-ids", "alerts", coinIds.join(",")],
    queryFn: async () => {
      if (coinIds.length === 0) return [];
      const res = await fetch(`/api/prices/by-ids?ids=${coinIds.join(",")}`);
      if (!res.ok) throw new Error("Failed to fetch prices");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    refetchInterval: 60000,
    staleTime: 30000,
    enabled: coinIds.length > 0,
  });

  const checkAlerts = useCallback(
    (prices: any[]) => {
      if (!prices || prices.length === 0) return;

      const priceMap = new Map(prices.map((p: any) => [p.id, p.current_price]));
      let updated = false;
      const newAlerts = alerts.map((alert) => {
        if (alert.triggered) return alert;
        const currentPrice = priceMap.get(alert.coinId);
        if (currentPrice == null) return alert;

        let direction: "above" | "below" | null = null;
        if (alert.upperThreshold !== null && currentPrice >= alert.upperThreshold) {
          direction = "above";
        } else if (alert.lowerThreshold !== null && currentPrice <= alert.lowerThreshold) {
          direction = "below";
        }

        if (direction && !triggeredRef.current.has(alert.id)) {
          triggeredRef.current.add(alert.id);
          updated = true;

          toast({
            title: `🔔 ${alert.coinName} Alert Triggered!`,
            description:
              direction === "above"
                ? `Price went above ${formatPrice(alert.upperThreshold)} — now at ${formatPrice(currentPrice)}`
                : `Price went below ${formatPrice(alert.lowerThreshold)} — now at ${formatPrice(currentPrice)}`,
          });

          return {
            ...alert,
            triggered: true,
            triggeredAt: Date.now(),
            triggeredDirection: direction,
            triggeredPrice: currentPrice,
          };
        }

        return alert;
      });

      if (updated) {
        setAlerts(newAlerts);
        saveAlerts(newAlerts);
      }
    },
    [alerts, toast]
  );

  useEffect(() => {
    if (pricesQuery.data && Array.isArray(pricesQuery.data)) {
      checkAlerts(pricesQuery.data);
    }
  }, [pricesQuery.data, checkAlerts]);

  const handleSaveAlert = (newAlert: PriceAlert) => {
    const updated = [...alerts, newAlert];
    setAlerts(updated);
    saveAlerts(updated);
    setSelectedCoin(null);
    toast({ title: `Alert created for ${newAlert.coinName}` });
  };

  const handleDeleteAlert = (alertId: string, coinName: string) => {
    const updated = alerts.filter((a) => a.id !== alertId);
    setAlerts(updated);
    saveAlerts(updated);
    triggeredRef.current.delete(alertId);
    toast({ title: `Removed alert for ${coinName}` });
  };

  const handleClearTriggered = () => {
    const updated = alerts.filter((a) => !a.triggered);
    setAlerts(updated);
    saveAlerts(updated);
    toast({ title: "Cleared triggered alerts" });
  };

  const priceMap = new Map(
    (pricesQuery.data || []).map((p: any) => [p.id, p.current_price])
  );

  return (
    <div className="min-h-screen bg-background">
      <div
        className="h-72 w-full absolute top-0 left-0 z-0 page-glow"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(0,200,255,0.15) 0%, transparent 70%)",
        }}
      />
      <Navbar />

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-6 pt-8">
        <AdBanner slot="7788990011" format="horizontal" className="w-full mb-6" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h1
              className="text-3xl font-display font-bold text-foreground flex items-center gap-3"
              data-testid="text-page-title"
            >
              <Bell className="w-8 h-8 text-primary" />
              Price Alerts
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {activeAlerts.length > 0
                ? `${activeAlerts.length} active alert${activeAlerts.length !== 1 ? "s" : ""} • Checking every 60s`
                : "Set price alerts to get notified when coins hit your targets"}
            </p>
          </div>
          <div className="w-full md:w-72">
            <CoinSearch onSelect={setSelectedCoin} />
          </div>
        </div>

        {selectedCoin && (
          <CreateAlertForm
            coin={selectedCoin}
            onCancel={() => setSelectedCoin(null)}
            onSave={handleSaveAlert}
          />
        )}

        {activeAlerts.length > 0 && (
          <div className="mb-8">
            <h2
              className="text-sm uppercase tracking-widest text-muted-foreground font-medium mb-3 flex items-center gap-2"
              data-testid="text-active-alerts-title"
            >
              <BellRing className="w-4 h-4 text-primary" /> Active Alerts
            </h2>
            <div className="space-y-3">
              {activeAlerts.map((alert) => {
                const currentPrice = priceMap.get(alert.coinId);
                return (
                  <div
                    key={alert.id}
                    className="glass-panel rounded-xl p-4 md:p-5 hover:bg-muted/20 transition-colors"
                    data-testid={`card-alert-${alert.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={alert.coinImage}
                        alt=""
                        className="w-10 h-10 rounded-full shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="font-semibold text-foreground"
                            data-testid={`text-alert-name-${alert.id}`}
                          >
                            {alert.coinName}
                          </span>
                          <span className="text-xs text-muted-foreground uppercase">
                            {alert.coinSymbol}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-green-500/10 border-green-500/30 text-green-400"
                          >
                            Active
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 flex-wrap text-sm">
                          {currentPrice != null && (
                            <span className="font-mono font-bold text-foreground" data-testid={`text-alert-current-${alert.id}`}>
                              {formatPrice(currentPrice)}
                            </span>
                          )}
                          {alert.upperThreshold !== null && (
                            <span className="text-xs text-muted-foreground">
                              <ArrowUpRight className="w-3 h-3 inline text-green-400 mr-0.5" />
                              Above{" "}
                              <span className="font-mono text-green-400" data-testid={`text-alert-upper-${alert.id}`}>
                                {formatPrice(alert.upperThreshold)}
                              </span>
                            </span>
                          )}
                          {alert.lowerThreshold !== null && (
                            <span className="text-xs text-muted-foreground">
                              <ArrowDownRight className="w-3 h-3 inline text-red-400 mr-0.5" />
                              Below{" "}
                              <span className="font-mono text-red-400" data-testid={`text-alert-lower-${alert.id}`}>
                                {formatPrice(alert.lowerThreshold)}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteAlert(alert.id, alert.coinName)}
                        className="text-muted-foreground hover:text-red-400 shrink-0"
                        data-testid={`button-delete-alert-${alert.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {triggeredAlerts.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2
                className="text-sm uppercase tracking-widest text-muted-foreground font-medium flex items-center gap-2"
                data-testid="text-triggered-alerts-title"
              >
                <CheckCircle2 className="w-4 h-4 text-yellow-400" /> Triggered Alerts
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearTriggered}
                className="text-xs text-muted-foreground hover:text-foreground"
                data-testid="button-clear-triggered"
              >
                Clear All
              </Button>
            </div>
            <div className="space-y-3">
              {triggeredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="glass-panel rounded-xl p-4 md:p-5 opacity-70"
                  data-testid={`card-triggered-${alert.id}`}
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={alert.coinImage}
                      alt=""
                      className="w-10 h-10 rounded-full shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground">
                          {alert.coinName}
                        </span>
                        <span className="text-xs text-muted-foreground uppercase">
                          {alert.coinSymbol}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            alert.triggeredDirection === "above"
                              ? "bg-green-500/10 border-green-500/30 text-green-400"
                              : "bg-red-500/10 border-red-500/30 text-red-400"
                          }`}
                        >
                          {alert.triggeredDirection === "above" ? "▲ Above" : "▼ Below"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 flex-wrap text-sm">
                        <span className="font-mono font-bold text-foreground">
                          Triggered at {formatPrice(alert.triggeredPrice)}
                        </span>
                        {alert.triggeredAt && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(alert.triggeredAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteAlert(alert.id, alert.coinName)}
                      className="text-muted-foreground hover:text-red-400 shrink-0"
                      data-testid={`button-delete-triggered-${alert.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {alerts.length === 0 && !selectedCoin && (
          <div className="glass-panel p-12 rounded-2xl text-center animate-in fade-in duration-700">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
              <Bell className="w-8 h-8 text-primary" />
            </div>
            <h2
              className="text-2xl font-display font-bold text-foreground mb-3"
              data-testid="text-empty-title"
            >
              No Price Alerts Set
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Search for any cryptocurrency above to create a price alert. You'll be notified
              when the price crosses your threshold.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />
                Alerts are stored locally in your browser
              </div>
              <span className="hidden sm:inline">•</span>
              <div className="flex items-center gap-1.5">
                <BellRing className="w-3.5 h-3.5 text-primary" />
                Prices checked every 60 seconds
              </div>
            </div>
          </div>
        )}

        <AdBanner slot="1122334455" format="horizontal" className="w-full mt-6" />
      </div>
      <Footer />
    </div>
  );
}
