import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  ArrowLeftRight,
  ArrowDown,
  Coins,
  TrendingUp,
  UserX,
  CheckCircle,
  Loader2,
  Search,
  Copy,
  ExternalLink,
  Clock,
  AlertCircle,
  Check,
  X,
  ChevronDown,
  History,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AdBanner } from "@/components/AdBanner";
import { useToast } from "@/hooks/use-toast";

interface Currency {
  ticker: string;
  name: string;
  image: string;
  network: string;
  hasExternalId: boolean;
}

interface ExchangeResult {
  id: string;
  payinAddress: string;
  payoutAddress: string;
  fromCurrency: string;
  toCurrency: string;
  expectedAmountFrom: number;
  expectedAmountTo: number;
  status: string;
  payinExtraId?: string;
}

interface SavedTransaction {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  fromAmount: string;
  expectedAmountTo: string;
  payinAddress: string;
  payoutAddress: string;
  status: string;
  createdAt: number;
}

const SWAP_HISTORY_KEY = "tokenaltcoin_swap_history";
const MAX_HISTORY = 20;

function loadSwapHistory(): SavedTransaction[] {
  try {
    const raw = localStorage.getItem(SWAP_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function saveSwapHistory(txns: SavedTransaction[]) {
  localStorage.setItem(SWAP_HISTORY_KEY, JSON.stringify(txns.slice(0, MAX_HISTORY)));
}

function addToSwapHistory(txn: SavedTransaction) {
  const existing = loadSwapHistory();
  const filtered = existing.filter((t) => t.id !== txn.id);
  saveSwapHistory([txn, ...filtered]);
}

function updateSwapHistoryStatus(id: string, status: string) {
  const existing = loadSwapHistory();
  const updated = existing.map((t) => t.id === id ? { ...t, status } : t);
  saveSwapHistory(updated);
}

function removeFromSwapHistory(id: string) {
  const existing = loadSwapHistory();
  saveSwapHistory(existing.filter((t) => t.id !== id));
}

const POPULAR_TICKERS = ["btc", "eth", "usdt", "sol", "xrp", "bnb", "ada", "doge", "dot", "avax", "matic", "ltc", "trx", "atom"];

function CurrencySelector({
  currencies,
  selected,
  onSelect,
  label,
  testId,
}: {
  currencies: Currency[];
  selected: Currency | null;
  onSelect: (c: Currency) => void;
  label: string;
  testId: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) {
      const popular = currencies.filter((c) => POPULAR_TICKERS.includes(c.ticker));
      const rest = currencies.filter((c) => !POPULAR_TICKERS.includes(c.ticker));
      return [...popular, ...rest].slice(0, 100);
    }
    const q = search.toLowerCase();
    return currencies
      .filter((c) => c.ticker.includes(q) || c.name.toLowerCase().includes(q))
      .slice(0, 50);
  }, [currencies, search]);

  return (
    <div className="relative">
      <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border hover:border-primary/50 transition-colors text-left"
        data-testid={testId}
      >
        {selected ? (
          <>
            {selected.image && <img src={selected.image} alt="" className="w-6 h-6 rounded-full" />}
            <span className="font-medium text-foreground uppercase">{selected.ticker}</span>
            {selected.network && selected.network !== selected.ticker && (
              <span className="text-[10px] text-muted-foreground">({selected.network})</span>
            )}
          </>
        ) : (
          <span className="text-muted-foreground">Select coin</span>
        )}
        <ChevronDown className="w-4 h-4 ml-auto text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute z-50 top-full mt-1 w-full bg-card border border-border rounded-lg shadow-xl max-h-64 overflow-hidden" data-testid={`${testId}-dropdown`}>
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search coin..."
                className="w-full pl-7 pr-3 py-1.5 text-sm rounded bg-muted/30 border-none outline-none text-foreground placeholder:text-muted-foreground"
                autoFocus
                data-testid={`${testId}-search`}
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-48">
            {filtered.map((c) => (
              <button
                key={`${c.ticker}-${c.network}`}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/30 text-left text-sm transition-colors"
                onClick={() => {
                  onSelect(c);
                  setOpen(false);
                  setSearch("");
                }}
                data-testid={`${testId}-option-${c.ticker}`}
              >
                {c.image && <img src={c.image} alt="" className="w-5 h-5 rounded-full" />}
                <span className="font-medium text-foreground uppercase">{c.ticker}</span>
                <span className="text-muted-foreground text-xs truncate">{c.name}</span>
                {c.network && c.network !== c.ticker && (
                  <span className="text-[10px] text-muted-foreground ml-auto">({c.network})</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const INFO_CARDS = [
  {
    icon: Coins,
    title: "900+ Coins",
    description: "Swap between 900+ cryptocurrencies including Bitcoin, Ethereum, and all major altcoins",
  },
  {
    icon: TrendingUp,
    title: "Best Rates",
    description: "Aggregates rates across multiple providers to find you the best deal",
  },
  {
    icon: UserX,
    title: "No Registration",
    description: "Start swapping instantly — no account creation or KYC verification required",
  },
];

export default function SwapPage() {
  const { toast } = useToast();

  const [fromCurrency, setFromCurrency] = useState<Currency | null>(null);
  const [toCurrency, setToCurrency] = useState<Currency | null>(null);
  const [fromAmount, setFromAmount] = useState("0.1");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [refundAddress, setRefundAddress] = useState("");
  const [extraId, setExtraId] = useState("");
  const [exchange, setExchange] = useState<ExchangeResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState<"swap" | "confirm" | "status" | "track">("swap");
  const [trackId, setTrackId] = useState("");
  const [trackLoading, setTrackLoading] = useState(false);
  const [swapHistory, setSwapHistory] = useState<SavedTransaction[]>(() => loadSwapHistory());

  const { data: currencies = [], isLoading: currenciesLoading } = useQuery<Currency[]>({
    queryKey: ["/api/swap/currencies"],
  });

  useEffect(() => {
    if (currencies.length > 0 && !fromCurrency) {
      const btc = currencies.find((c) => c.ticker === "btc");
      const eth = currencies.find((c) => c.ticker === "eth");
      if (btc) setFromCurrency(btc);
      if (eth) setToCurrency(eth);
    }
  }, [currencies, fromCurrency]);

  const estimateEnabled = !!fromCurrency && !!toCurrency && parseFloat(fromAmount) > 0;

  const { data: estimate, isLoading: estimateLoading, error: estimateError } = useQuery({
    queryKey: [
      "/api/swap/estimate",
      fromCurrency?.ticker,
      toCurrency?.ticker,
      fromAmount,
      fromCurrency?.network,
      toCurrency?.network,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        fromCurrency: fromCurrency!.ticker,
        toCurrency: toCurrency!.ticker,
        fromAmount,
        fromNetwork: fromCurrency!.network || "",
        toNetwork: toCurrency!.network || "",
      });
      const res = await fetch(`/api/swap/estimate?${params}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to get estimate");
      }
      return res.json();
    },
    enabled: estimateEnabled,
    refetchInterval: 30000,
    staleTime: 15000,
    retry: false,
  });

  const createExchangeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/swap/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromCurrency: fromCurrency!.ticker,
          toCurrency: toCurrency!.ticker,
          fromAmount,
          address: recipientAddress,
          fromNetwork: fromCurrency!.network || undefined,
          toNetwork: toCurrency!.network || undefined,
          extraId: extraId || undefined,
          refundAddress: refundAddress || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create exchange");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setExchange(data);
      setStep("status");
      const saved: SavedTransaction = {
        id: data.id,
        fromCurrency: fromCurrency?.ticker.toUpperCase() || "",
        toCurrency: toCurrency?.ticker.toUpperCase() || "",
        fromAmount,
        expectedAmountTo: String(data.expectedAmountTo || ""),
        payinAddress: data.payinAddress,
        payoutAddress: data.payoutAddress,
        status: data.status || "waiting",
        createdAt: Date.now(),
      };
      addToSwapHistory(saved);
      setSwapHistory(loadSwapHistory());
      toast({ title: "Exchange created!", description: `Send ${fromAmount} ${fromCurrency?.ticker.toUpperCase()} to the provided address` });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const { data: exchangeStatus } = useQuery({
    queryKey: ["/api/swap/status", exchange?.id],
    queryFn: async () => {
      const res = await fetch(`/api/swap/status/${exchange!.id}`);
      if (!res.ok) throw new Error("Failed to check status");
      const data = await res.json();
      if (data?.status && exchange?.id) {
        updateSwapHistoryStatus(exchange.id, data.status);
        setSwapHistory(loadSwapHistory());
      }
      return data;
    },
    enabled: !!exchange?.id && step === "status",
    refetchInterval: 15000,
  });

  const swapCurrencies = useCallback(() => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
  }, [fromCurrency, toCurrency]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "finished": return "text-green-400";
      case "waiting": case "confirming": case "exchanging": case "sending": return "text-yellow-400";
      case "failed": case "refunded": case "expired": return "text-red-400";
      default: return "text-muted-foreground";
    }
  };

  const resetExchange = () => {
    setExchange(null);
    setStep("swap");
    setRecipientAddress("");
    setRefundAddress("");
    setExtraId("");
  };

  const handleTrackTransaction = async () => {
    const id = trackId.trim();
    if (!id) return;
    setTrackLoading(true);
    try {
      const res = await fetch(`/api/swap/status/${encodeURIComponent(id)}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Transaction not found");
      }
      const data = await res.json();
      setExchange({
        id: data.id || id,
        payinAddress: data.payinAddress || data.depositAddress || "",
        payoutAddress: data.payoutAddress || data.withdrawalAddress || "",
        fromCurrency: data.fromCurrency || "",
        toCurrency: data.toCurrency || "",
        expectedAmountFrom: data.expectedAmountFrom || data.amountFrom || 0,
        expectedAmountTo: data.expectedAmountTo || data.amountTo || 0,
        status: data.status || "unknown",
      });
      const saved: SavedTransaction = {
        id: data.id || id,
        fromCurrency: (data.fromCurrency || "").toUpperCase(),
        toCurrency: (data.toCurrency || "").toUpperCase(),
        fromAmount: String(data.expectedAmountFrom || data.amountFrom || ""),
        expectedAmountTo: String(data.expectedAmountTo || data.amountTo || ""),
        payinAddress: data.payinAddress || data.depositAddress || "",
        payoutAddress: data.payoutAddress || data.withdrawalAddress || "",
        status: data.status || "unknown",
        createdAt: Date.now(),
      };
      addToSwapHistory(saved);
      setSwapHistory(loadSwapHistory());
      setStep("status");
      setTrackId("");
    } catch (err: any) {
      toast({ title: "Not found", description: err.message, variant: "destructive" });
    } finally {
      setTrackLoading(false);
    }
  };

  const handleResumeTransaction = (txn: SavedTransaction) => {
    setExchange({
      id: txn.id,
      payinAddress: txn.payinAddress,
      payoutAddress: txn.payoutAddress,
      fromCurrency: txn.fromCurrency,
      toCurrency: txn.toCurrency,
      expectedAmountFrom: parseFloat(txn.fromAmount) || 0,
      expectedAmountTo: parseFloat(txn.expectedAmountTo) || 0,
      status: txn.status,
    });
    setStep("status");
  };

  const handleDeleteTransaction = (id: string) => {
    removeFromSwapHistory(id);
    setSwapHistory(loadSwapHistory());
  };

  return (
    <div className="min-h-screen bg-background" data-testid="swap-page">
      <div
        className="h-72 w-full absolute top-0 left-0 z-0 page-glow"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(100,0,255,0.12) 0%, transparent 70%)",
        }}
      />
      <Navbar />

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 pt-8">
        <AdBanner slot="8899001122" format="horizontal" className="w-full mb-6" />

        <div className="mb-8" data-testid="swap-header">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3" data-testid="text-page-title">
                <ArrowLeftRight className="w-8 h-8 text-primary" />
                Crypto Swap
              </h1>
              <p className="text-muted-foreground text-sm mt-1" data-testid="text-page-subtitle">
                Swap cryptocurrencies instantly with best rates across 900+ coins
              </p>
            </div>
            <div className="flex gap-2">
              {step !== "track" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStep("track")}
                  className="text-xs gap-1.5"
                  data-testid="button-track-transaction"
                >
                  <Search className="w-3.5 h-3.5" />
                  Track Transaction
                </Button>
              )}
              {step !== "swap" && step !== "track" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetExchange}
                  className="text-xs gap-1.5"
                  data-testid="button-new-swap"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  New Swap
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-lg mx-auto">
          {step === "swap" && (
            <Card className="glass-panel border-border" data-testid="swap-form-card">
              <CardContent className="p-6 space-y-4">
                {currenciesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground text-sm">Loading currencies...</span>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">You Send</label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={fromAmount}
                          onChange={(e) => setFromAmount(e.target.value)}
                          className="bg-muted/30 border-border font-mono text-lg flex-1"
                          min="0"
                          step="any"
                          data-testid="input-from-amount"
                        />
                        <div className="w-40">
                          <CurrencySelector
                            currencies={currencies}
                            selected={fromCurrency}
                            onSelect={setFromCurrency}
                            label=""
                            testId="select-from-currency"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <button
                        onClick={swapCurrencies}
                        className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center hover:bg-primary/20 transition-colors"
                        data-testid="button-swap-currencies"
                      >
                        <ArrowDown className="w-4 h-4 text-primary" />
                      </button>
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">You Receive (estimated)</label>
                      <div className="flex gap-2">
                        <div className="flex-1 flex items-center px-4 rounded-lg bg-muted/30 border border-border font-mono text-lg text-foreground min-h-[40px]" data-testid="text-estimated-amount">
                          {estimateLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          ) : estimateError ? (
                            <span className="text-red-400 text-sm">{(estimateError as Error).message}</span>
                          ) : estimate?.toAmount ? (
                            parseFloat(estimate.toAmount).toFixed(8)
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </div>
                        <div className="w-40">
                          <CurrencySelector
                            currencies={currencies}
                            selected={toCurrency}
                            onSelect={setToCurrency}
                            label=""
                            testId="select-to-currency"
                          />
                        </div>
                      </div>
                    </div>

                    {estimate && !estimateError && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1" data-testid="text-rate-info">
                        <TrendingUp className="w-3 h-3" />
                        1 {fromCurrency?.ticker.toUpperCase()} ≈ {(parseFloat(estimate.toAmount) / parseFloat(fromAmount)).toFixed(6)} {toCurrency?.ticker.toUpperCase()}
                        {estimate.networkFee && (
                          <span className="ml-2">• Network fee: {estimate.networkFee} {toCurrency?.ticker.toUpperCase()}</span>
                        )}
                      </div>
                    )}

                    <Button
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-display"
                      onClick={() => setStep("confirm")}
                      disabled={!estimate || !!estimateError || !fromCurrency || !toCurrency}
                      data-testid="button-proceed-swap"
                    >
                      Proceed to Swap
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {step === "confirm" && (
            <Card className="glass-panel border-border" data-testid="swap-confirm-card">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-display font-bold text-foreground" data-testid="text-confirm-title">Confirm Exchange</h3>
                  <button onClick={() => setStep("swap")} className="text-muted-foreground hover:text-foreground" data-testid="button-back-to-swap">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="bg-muted/20 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">You send</span>
                    <span className="font-mono text-foreground" data-testid="text-confirm-send">{fromAmount} {fromCurrency?.ticker.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">You receive (est.)</span>
                    <span className="font-mono text-foreground" data-testid="text-confirm-receive">≈ {estimate?.toAmount ? parseFloat(estimate.toAmount).toFixed(8) : "—"} {toCurrency?.ticker.toUpperCase()}</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Recipient {toCurrency?.ticker.toUpperCase()} Address *
                  </label>
                  <Input
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    placeholder={`Your ${toCurrency?.ticker.toUpperCase()} wallet address`}
                    className="bg-muted/30 border-border font-mono text-sm"
                    data-testid="input-recipient-address"
                  />
                </div>

                {toCurrency?.hasExternalId && (
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Memo / Extra ID (if required)
                    </label>
                    <Input
                      value={extraId}
                      onChange={(e) => setExtraId(e.target.value)}
                      placeholder="Memo, tag, or extra ID"
                      className="bg-muted/30 border-border font-mono text-sm"
                      data-testid="input-extra-id"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Refund {fromCurrency?.ticker.toUpperCase()} Address (optional)
                  </label>
                  <Input
                    value={refundAddress}
                    onChange={(e) => setRefundAddress(e.target.value)}
                    placeholder={`Your ${fromCurrency?.ticker.toUpperCase()} refund address`}
                    className="bg-muted/30 border-border font-mono text-sm"
                    data-testid="input-refund-address"
                  />
                </div>

                <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                  <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-yellow-400/80">
                    Double-check the recipient address. Transactions on the blockchain cannot be reversed.
                  </p>
                </div>

                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-display"
                  onClick={() => createExchangeMutation.mutate()}
                  disabled={!recipientAddress || createExchangeMutation.isPending}
                  data-testid="button-create-exchange"
                >
                  {createExchangeMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Creating Exchange...</>
                  ) : (
                    "Create Exchange"
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {step === "status" && exchange && (
            <Card className="glass-panel border-border" data-testid="swap-status-card">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-foreground" data-testid="text-status-title">Exchange Created</h3>
                  <Badge variant="outline" className={`${getStatusColor(exchangeStatus?.status || exchange?.status || "waiting")} border-current/30`} data-testid="badge-exchange-status">
                    {(exchangeStatus?.status || exchange?.status || "waiting").toUpperCase()}
                  </Badge>
                </div>

                <div className="text-xs text-muted-foreground" data-testid="text-exchange-id">
                  ID: <span className="font-mono text-foreground">{exchange.id}</span>
                </div>

                <div className="bg-muted/20 rounded-lg p-4 space-y-3">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Send exactly</p>
                    <p className="text-xl font-mono font-bold text-primary" data-testid="text-send-amount">
                      {exchange.expectedAmountFrom || fromAmount} {(fromCurrency?.ticker || exchange.fromCurrency || "").toUpperCase()}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">To this address:</p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono text-foreground bg-muted/30 px-3 py-2 rounded flex-1 break-all" data-testid="text-payin-address">
                        {exchange.payinAddress}
                      </code>
                      <button
                        onClick={() => copyToClipboard(exchange.payinAddress)}
                        className="p-2 rounded hover:bg-muted/30 transition-colors flex-shrink-0"
                        data-testid="button-copy-address"
                      >
                        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                      </button>
                    </div>
                  </div>

                  {exchange.payinExtraId && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Memo / Extra ID:</p>
                      <code className="text-sm font-mono text-foreground bg-muted/30 px-3 py-2 rounded block" data-testid="text-payin-extra-id">
                        {exchange.payinExtraId}
                      </code>
                    </div>
                  )}

                  <div className="text-center pt-2 border-t border-border/50">
                    <p className="text-xs text-muted-foreground mb-1">You will receive approximately</p>
                    <p className="text-lg font-mono font-bold text-green-400" data-testid="text-receive-amount">
                      ≈ {exchange.expectedAmountTo || estimate?.toAmount || "—"} {(toCurrency?.ticker || exchange.toCurrency || "").toUpperCase()}
                    </p>
                  </div>
                </div>

                {(exchangeStatus?.status === "waiting" || !exchangeStatus) && (
                  <div className="flex items-center gap-2 text-sm text-yellow-400">
                    <Clock className="w-4 h-4 animate-pulse" />
                    Waiting for your deposit...
                  </div>
                )}

                {exchangeStatus?.status === "finished" && (
                  <div className="flex items-center gap-2 text-sm text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    Exchange completed successfully!
                  </div>
                )}

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={resetExchange}
                  data-testid="button-new-exchange"
                >
                  Start New Exchange
                </Button>
              </CardContent>
            </Card>
          )}

          {step === "track" && (
            <Card className="glass-panel border-border" data-testid="track-transaction-card">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-display font-bold text-foreground flex items-center gap-2" data-testid="text-track-title">
                    <Search className="w-5 h-5 text-primary" />
                    Track Transaction
                  </h3>
                  <button onClick={() => setStep("swap")} className="text-muted-foreground hover:text-foreground" data-testid="button-back-from-track">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-sm text-muted-foreground">
                  Enter your ChangeNOW transaction ID to check the status of your swap.
                </p>

                <div className="flex gap-2">
                  <Input
                    value={trackId}
                    onChange={(e) => setTrackId(e.target.value)}
                    placeholder="Enter transaction ID"
                    className="bg-muted/30 border-border font-mono text-sm flex-1"
                    onKeyDown={(e) => e.key === "Enter" && handleTrackTransaction()}
                    data-testid="input-track-id"
                  />
                  <Button
                    onClick={handleTrackTransaction}
                    disabled={!trackId.trim() || trackLoading}
                    className="bg-primary hover:bg-primary/90"
                    data-testid="button-track-submit"
                  >
                    {trackLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Track"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10" data-testid="swap-info-cards">
          {INFO_CARDS.map((card) => (
            <div
              key={card.title}
              className="glass-panel rounded-2xl p-6"
              data-testid={`card-info-${card.title.toLowerCase().replace(/[\s+]/g, "-")}`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <card.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display font-bold text-foreground" data-testid={`text-info-title-${card.title.toLowerCase().replace(/[\s+]/g, "-")}`}>
                  {card.title}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground" data-testid={`text-info-desc-${card.title.toLowerCase().replace(/[\s+]/g, "-")}`}>
                {card.description}
              </p>
            </div>
          ))}
        </div>

        {swapHistory.length > 0 && (
          <div className="glass-panel rounded-2xl p-6 mt-8" data-testid="swap-history">
            <h2 className="text-lg font-display font-bold text-foreground mb-4 flex items-center gap-2" data-testid="text-history-title">
              <History className="w-5 h-5 text-primary" />
              Transaction History
            </h2>
            <div className="space-y-2">
              {swapHistory.map((txn) => {
                const statusColor = txn.status === "finished" ? "text-green-400"
                  : ["waiting", "confirming", "exchanging", "sending"].includes(txn.status) ? "text-yellow-400"
                  : ["failed", "refunded", "expired"].includes(txn.status) ? "text-red-400"
                  : "text-muted-foreground";
                return (
                  <div
                    key={txn.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/10 border border-border/50 hover:border-primary/30 transition-colors group"
                    data-testid={`history-item-${txn.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-mono text-foreground">{txn.fromAmount} {txn.fromCurrency}</span>
                        <ArrowLeftRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        <span className="font-mono text-foreground">{txn.expectedAmountTo ? `${parseFloat(txn.expectedAmountTo).toFixed(6)} ` : ""}{txn.toCurrency}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono text-muted-foreground truncate">{txn.id}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(txn.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline" className={`${statusColor} border-current/30 text-[10px] flex-shrink-0`}>
                      {txn.status.toUpperCase()}
                    </Badge>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 opacity-60 hover:opacity-100"
                        onClick={() => handleResumeTransaction(txn)}
                        title="View status"
                        data-testid={`button-resume-${txn.id}`}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 opacity-40 hover:opacity-100 hover:text-red-400"
                        onClick={() => handleDeleteTransaction(txn.id)}
                        title="Remove from history"
                        data-testid={`button-delete-${txn.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="glass-panel rounded-2xl p-6 mt-8" data-testid="swap-how-it-works">
          <h2 className="text-lg font-display font-bold text-foreground mb-6 flex items-center gap-2" data-testid="text-how-it-works-title">
            <CheckCircle className="w-5 h-5 text-primary" />
            How It Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { step: 1, title: "Choose your pair", desc: "Select the coins you want to swap" },
              { step: 2, title: "Enter amount", desc: "See estimated rates in real-time" },
              { step: 3, title: "Provide wallet address", desc: "Where you want to receive your coins" },
              { step: 4, title: "Send & receive", desc: "Deposit to the generated address and receive your coins" },
            ].map((s) => (
              <div key={s.step} className="text-center" data-testid={`step-${s.step}`}>
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-display font-bold text-lg flex items-center justify-center mx-auto mb-3">
                  {s.step}
                </div>
                <p className="text-sm text-foreground font-medium mb-1" data-testid={`text-step-title-${s.step}`}>
                  {s.title}
                </p>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <AdBanner slot="8899001122" format="horizontal" className="w-full mt-6" />
      </div>
      <Footer />
    </div>
  );
}
