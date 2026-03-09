import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AdBanner } from "@/components/AdBanner";
import { Loader2, ArrowDownUp, RefreshCw } from "lucide-react";

const POPULAR_CRYPTOS = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin", image: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png" },
  { id: "ethereum", symbol: "ETH", name: "Ethereum", image: "https://assets.coingecko.com/coins/images/279/small/ethereum.png" },
  { id: "solana", symbol: "SOL", name: "Solana", image: "https://assets.coingecko.com/coins/images/4128/small/solana.png" },
  { id: "ripple", symbol: "XRP", name: "XRP", image: "https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png" },
  { id: "binancecoin", symbol: "BNB", name: "BNB", image: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png" },
  { id: "dogecoin", symbol: "DOGE", name: "Dogecoin", image: "https://assets.coingecko.com/coins/images/5/small/dogecoin.png" },
  { id: "cardano", symbol: "ADA", name: "Cardano", image: "https://assets.coingecko.com/coins/images/975/small/cardano.png" },
  { id: "polkadot", symbol: "DOT", name: "Polkadot", image: "https://assets.coingecko.com/coins/images/12171/small/polkadot.png" },
  { id: "avalanche-2", symbol: "AVAX", name: "Avalanche", image: "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png" },
  { id: "chainlink", symbol: "LINK", name: "Chainlink", image: "https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png" },
  { id: "tron", symbol: "TRX", name: "TRON", image: "https://assets.coingecko.com/coins/images/1094/small/tron-logo.png" },
  { id: "litecoin", symbol: "LTC", name: "Litecoin", image: "https://assets.coingecko.com/coins/images/2/small/litecoin.png" },
];

const FIAT_CURRENCIES = [
  { id: "usd", symbol: "USD", name: "US Dollar", flag: "🇺🇸" },
  { id: "eur", symbol: "EUR", name: "Euro", flag: "🇪🇺" },
  { id: "gbp", symbol: "GBP", name: "British Pound", flag: "🇬🇧" },
  { id: "jpy", symbol: "JPY", name: "Japanese Yen", flag: "🇯🇵" },
  { id: "cad", symbol: "CAD", name: "Canadian Dollar", flag: "🇨🇦" },
  { id: "aud", symbol: "AUD", name: "Australian Dollar", flag: "🇦🇺" },
  { id: "chf", symbol: "CHF", name: "Swiss Franc", flag: "🇨🇭" },
  { id: "inr", symbol: "INR", name: "Indian Rupee", flag: "🇮🇳" },
];

type AssetOption = {
  id: string;
  symbol: string;
  name: string;
  type: "crypto" | "fiat";
  image?: string;
  flag?: string;
};

function buildOptions(): AssetOption[] {
  const cryptos: AssetOption[] = POPULAR_CRYPTOS.map((c) => ({
    id: c.id,
    symbol: c.symbol,
    name: c.name,
    type: "crypto",
    image: c.image,
  }));
  const fiats: AssetOption[] = FIAT_CURRENCIES.map((f) => ({
    id: f.id,
    symbol: f.symbol,
    name: f.name,
    type: "fiat",
    flag: f.flag,
  }));
  return [...cryptos, ...fiats];
}

const ALL_OPTIONS = buildOptions();

function AssetSelector({
  value,
  onChange,
  label,
  testId,
}: {
  value: string;
  onChange: (id: string) => void;
  label: string;
  testId: string;
}) {
  const selected = ALL_OPTIONS.find((o) => o.id === value);

  return (
    <div>
      <label className="text-xs text-muted-foreground uppercase tracking-widest mb-2 block">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-card/50 border border-border rounded-lg px-3 py-3 text-sm text-foreground focus:outline-none focus:border-primary appearance-none cursor-pointer"
        data-testid={testId}
      >
        <optgroup label="Cryptocurrencies">
          {ALL_OPTIONS.filter((o) => o.type === "crypto").map((o) => (
            <option key={o.id} value={o.id}>
              {o.symbol} - {o.name}
            </option>
          ))}
        </optgroup>
        <optgroup label="Fiat Currencies">
          {ALL_OPTIONS.filter((o) => o.type === "fiat").map((o) => (
            <option key={o.id} value={o.id}>
              {o.flag} {o.symbol} - {o.name}
            </option>
          ))}
        </optgroup>
      </select>
      {selected && (
        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          {selected.type === "crypto" && selected.image && (
            <img src={selected.image} alt={selected.name} className="w-4 h-4 rounded-full" />
          )}
          {selected.type === "fiat" && selected.flag && <span>{selected.flag}</span>}
          <span>{selected.name}</span>
        </div>
      )}
    </div>
  );
}

function formatResult(value: number): string {
  if (value === 0) return "0";
  if (value >= 1_000_000) return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (value >= 1) return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });
  if (value >= 0.0001) return value.toFixed(8);
  return value.toExponential(6);
}

export default function CalculatorPage() {
  const [fromAsset, setFromAsset] = useState("bitcoin");
  const [toAsset, setToAsset] = useState("usd");
  const [amount, setAmount] = useState("1");

  const cryptoIds = useMemo(() => {
    const ids = new Set<string>();
    const from = ALL_OPTIONS.find((o) => o.id === fromAsset);
    const to = ALL_OPTIONS.find((o) => o.id === toAsset);
    if (from?.type === "crypto") ids.add(from.id);
    if (to?.type === "crypto") ids.add(to.id);
    return Array.from(ids);
  }, [fromAsset, toAsset]);

  const vsCurrencies = useMemo(() => {
    const currencies = new Set<string>();
    const from = ALL_OPTIONS.find((o) => o.id === fromAsset);
    const to = ALL_OPTIONS.find((o) => o.id === toAsset);
    if (from?.type === "fiat") currencies.add(from.id);
    if (to?.type === "fiat") currencies.add(to.id);
    currencies.add("usd");
    return Array.from(currencies);
  }, [fromAsset, toAsset]);

  const pricesQuery = useQuery({
    queryKey: ["calculator-prices", cryptoIds.join(","), vsCurrencies.join(",")],
    queryFn: async () => {
      if (cryptoIds.length === 0) return {};
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoIds.join(",")}&vs_currencies=${vsCurrencies.join(",")}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch prices");
      return res.json();
    },
    staleTime: 30000,
    refetchInterval: 60000,
    enabled: cryptoIds.length > 0,
  });

  const prices = pricesQuery.data || {};

  const convertedValue = useMemo(() => {
    const num = parseFloat(amount) || 0;
    if (num === 0) return 0;

    const fromOpt = ALL_OPTIONS.find((o) => o.id === fromAsset);
    const toOpt = ALL_OPTIONS.find((o) => o.id === toAsset);
    if (!fromOpt || !toOpt) return 0;

    if (fromOpt.type === "fiat" && toOpt.type === "fiat") {
      return num;
    }

    if (fromOpt.type === "crypto" && toOpt.type === "fiat") {
      const rate = prices[fromAsset]?.[toAsset];
      return rate ? num * rate : 0;
    }

    if (fromOpt.type === "fiat" && toOpt.type === "crypto") {
      const rate = prices[toAsset]?.[fromAsset];
      return rate ? num / rate : 0;
    }

    if (fromOpt.type === "crypto" && toOpt.type === "crypto") {
      const fromUsd = prices[fromAsset]?.usd;
      const toUsd = prices[toAsset]?.usd;
      if (fromUsd && toUsd) return (num * fromUsd) / toUsd;
      return 0;
    }

    return 0;
  }, [amount, fromAsset, toAsset, prices]);

  const handleSwap = () => {
    setFromAsset(toAsset);
    setToAsset(fromAsset);
  };

  const fromOpt = ALL_OPTIONS.find((o) => o.id === fromAsset);
  const toOpt = ALL_OPTIONS.find((o) => o.id === toAsset);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-6">
        <AdBanner slot="0123456789" format="horizontal" className="w-full mb-4" />

        <div className="mb-6">
          <h1
            className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
            data-testid="heading-calculator"
          >
            <span className="text-primary text-3xl">⟐</span>
            Crypto Calculator
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Convert between cryptocurrencies and fiat currencies with live prices
          </p>
        </div>

        <div className="glass-panel rounded-xl p-6" data-testid="calculator-panel">
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-widest mb-2 block">Amount</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
                step="any"
                className="w-full bg-card/50 border border-border rounded-lg px-4 py-3 text-lg text-foreground focus:outline-none focus:border-primary"
                style={{ fontFamily: "'Orbitron', sans-serif" }}
                placeholder="Enter amount"
                data-testid="input-amount"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-end">
              <AssetSelector
                value={fromAsset}
                onChange={setFromAsset}
                label="From"
                testId="select-from-asset"
              />

              <div className="flex justify-center md:pb-2">
                <button
                  onClick={handleSwap}
                  className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary hover:bg-primary/20 transition-all hover:scale-110 active:scale-95"
                  data-testid="button-swap-direction"
                >
                  <ArrowDownUp className="w-5 h-5" />
                </button>
              </div>

              <AssetSelector
                value={toAsset}
                onChange={setToAsset}
                label="To"
                testId="select-to-asset"
              />
            </div>

            <div className="mt-6 p-5 bg-primary/5 border border-primary/20 rounded-xl" data-testid="conversion-result">
              {pricesQuery.isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : pricesQuery.isError ? (
                <div className="text-sm text-red-400 text-center py-4" data-testid="text-error">
                  Failed to fetch prices. Please try again.
                </div>
              ) : (
                <div>
                  <div className="text-xs text-muted-foreground mb-2">Result</div>
                  <div
                    className="text-2xl md:text-3xl font-bold text-foreground"
                    style={{ fontFamily: "'Orbitron', sans-serif" }}
                    data-testid="text-converted-value"
                  >
                    {formatResult(convertedValue)} {toOpt?.symbol}
                  </div>
                  <div className="text-sm text-muted-foreground mt-2" data-testid="text-conversion-summary">
                    {parseFloat(amount) || 0} {fromOpt?.symbol} = {formatResult(convertedValue)} {toOpt?.symbol}
                  </div>
                  {fromOpt?.type === "crypto" && (
                    <div className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3" />
                      Live rate from CoinGecko
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 glass-panel rounded-xl p-5" data-testid="quick-conversions">
          <h3 className="text-sm uppercase tracking-widest text-muted-foreground font-medium mb-4">Quick Conversions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { from: "bitcoin", to: "usd", label: "BTC → USD" },
              { from: "ethereum", to: "usd", label: "ETH → USD" },
              { from: "solana", to: "usd", label: "SOL → USD" },
              { from: "ripple", to: "usd", label: "XRP → USD" },
              { from: "bitcoin", to: "ethereum", label: "BTC → ETH" },
              { from: "ethereum", to: "solana", label: "ETH → SOL" },
              { from: "dogecoin", to: "usd", label: "DOGE → USD" },
              { from: "cardano", to: "usd", label: "ADA → USD" },
            ].map((q) => (
              <button
                key={q.label}
                onClick={() => {
                  setFromAsset(q.from);
                  setToAsset(q.to);
                  setAmount("1");
                }}
                className="px-3 py-2.5 text-xs rounded-lg bg-card/50 border border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-muted-foreground hover:text-foreground"
                data-testid={`button-quick-${q.label.toLowerCase().replace(/[^a-z]/g, "-")}`}
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 glass-panel rounded-xl p-5" data-testid="popular-rates">
          <h3 className="text-sm uppercase tracking-widest text-muted-foreground font-medium mb-4">Popular Rates</h3>
          {pricesQuery.isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-2">
              {POPULAR_CRYPTOS.map((crypto) => {
                const usdPrice = prices[crypto.id]?.usd;
                return (
                  <div
                    key={crypto.id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-card/50 transition-colors cursor-pointer"
                    onClick={() => {
                      setFromAsset(crypto.id);
                      setToAsset("usd");
                      setAmount("1");
                    }}
                    data-testid={`rate-${crypto.symbol.toLowerCase()}`}
                  >
                    <div className="flex items-center gap-2">
                      <img src={crypto.image} alt={crypto.name} className="w-5 h-5 rounded-full" />
                      <span className="text-sm text-foreground font-medium">{crypto.symbol}</span>
                      <span className="text-xs text-muted-foreground">{crypto.name}</span>
                    </div>
                    <span className="text-sm font-medium text-foreground" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                      {usdPrice ? `$${usdPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: usdPrice < 1 ? 6 : 2 })}` : "--"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <AdBanner slot="0123456789" format="horizontal" className="w-full mt-6" />
      </div>
      <Footer />
    </div>
  );
}
