import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Calculator,
  Coins,
  TrendingUp,
  Clock,
  ChevronDown,
  Info,
  DollarSign,
  Percent,
  Calendar,
  RefreshCw,
  Bookmark,
  Trash2,
  ExternalLink,
  Shield,
  Lock,
  ArrowUpDown,
  BarChart3,
  AlertTriangle,
  ChevronUp,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AdBanner } from "@/components/AdBanner";

interface StakingCoin {
  name: string;
  symbol: string;
  apy: number;
  minStake: number;
  icon: string;
  color: string;
  coingeckoId: string;
  lockUp: string;
  risk: "Low" | "Medium" | "High";
  stakingRatio: number;
  consensus: string;
  category: string;
}

const STAKING_COINS: StakingCoin[] = [
  { name: "Ethereum", symbol: "ETH", apy: 3.5, minStake: 0.01, icon: "⟠", color: "text-blue-400", coingeckoId: "ethereum", lockUp: "Variable", risk: "Low", stakingRatio: 27, consensus: "PoS", category: "Layer 1" },
  { name: "Solana", symbol: "SOL", apy: 6.8, minStake: 0.01, icon: "◎", color: "text-purple-400", coingeckoId: "solana", lockUp: "2-3 days", risk: "Low", stakingRatio: 67, consensus: "PoS + PoH", category: "Layer 1" },
  { name: "Cardano", symbol: "ADA", apy: 4.5, minStake: 10, icon: "♦", color: "text-blue-300", coingeckoId: "cardano", lockUp: "None", risk: "Low", stakingRatio: 63, consensus: "Ouroboros PoS", category: "Layer 1" },
  { name: "Polkadot", symbol: "DOT", apy: 14, minStake: 1, icon: "●", color: "text-pink-400", coingeckoId: "polkadot", lockUp: "28 days", risk: "Medium", stakingRatio: 52, consensus: "NPoS", category: "Layer 0" },
  { name: "Cosmos", symbol: "ATOM", apy: 18, minStake: 0.01, icon: "⚛", color: "text-indigo-400", coingeckoId: "cosmos", lockUp: "21 days", risk: "Medium", stakingRatio: 62, consensus: "Tendermint PoS", category: "Layer 0" },
  { name: "Avalanche", symbol: "AVAX", apy: 8, minStake: 25, icon: "🔺", color: "text-red-400", coingeckoId: "avalanche-2", lockUp: "14 days", risk: "Low", stakingRatio: 56, consensus: "Snowman PoS", category: "Layer 1" },
  { name: "Tezos", symbol: "XTZ", apy: 5.5, minStake: 1, icon: "ꜩ", color: "text-blue-500", coingeckoId: "tezos", lockUp: "None", risk: "Low", stakingRatio: 75, consensus: "LPoS", category: "Layer 1" },
  { name: "Near", symbol: "NEAR", apy: 10, minStake: 1, icon: "Ⓝ", color: "text-green-400", coingeckoId: "near", lockUp: "2-3 days", risk: "Low", stakingRatio: 45, consensus: "Nightshade PoS", category: "Layer 1" },
  { name: "Algorand", symbol: "ALGO", apy: 5, minStake: 1, icon: "◈", color: "text-gray-300", coingeckoId: "algorand", lockUp: "None", risk: "Low", stakingRatio: 70, consensus: "Pure PoS", category: "Layer 1" },
  { name: "Polygon", symbol: "MATIC", apy: 5, minStake: 1, icon: "⬡", color: "text-purple-500", coingeckoId: "matic-network", lockUp: "3 days", risk: "Low", stakingRatio: 39, consensus: "PoS", category: "Layer 2" },
  { name: "Sui", symbol: "SUI", apy: 3.2, minStake: 1, icon: "💧", color: "text-cyan-400", coingeckoId: "sui", lockUp: "1 epoch", risk: "Medium", stakingRatio: 80, consensus: "DPoS", category: "Layer 1" },
  { name: "Aptos", symbol: "APT", apy: 7, minStake: 11, icon: "🅰", color: "text-green-300", coingeckoId: "aptos", lockUp: "30 days", risk: "Medium", stakingRatio: 82, consensus: "AptosBFT", category: "Layer 1" },
  { name: "Celestia", symbol: "TIA", apy: 14.5, minStake: 0.01, icon: "🟣", color: "text-violet-400", coingeckoId: "celestia", lockUp: "21 days", risk: "Medium", stakingRatio: 58, consensus: "Tendermint PoS", category: "Modular" },
  { name: "Injective", symbol: "INJ", apy: 15, minStake: 0.01, icon: "💉", color: "text-cyan-300", coingeckoId: "injective-protocol", lockUp: "21 days", risk: "Medium", stakingRatio: 60, consensus: "Tendermint PoS", category: "Layer 1" },
  { name: "Sei", symbol: "SEI", apy: 4.5, minStake: 1, icon: "🌊", color: "text-red-300", coingeckoId: "sei-network", lockUp: "21 days", risk: "Medium", stakingRatio: 45, consensus: "Twin-Turbo PoS", category: "Layer 1" },
  { name: "Osmosis", symbol: "OSMO", apy: 10, minStake: 0.01, icon: "🧪", color: "text-purple-300", coingeckoId: "osmosis", lockUp: "14 days", risk: "Medium", stakingRatio: 50, consensus: "Tendermint PoS", category: "DEX Chain" },
  { name: "Mina", symbol: "MINA", apy: 12, minStake: 1, icon: "Ⓜ", color: "text-orange-300", coingeckoId: "mina-protocol", lockUp: "None", risk: "Medium", stakingRatio: 85, consensus: "Ouroboros PoS", category: "Layer 1" },
  { name: "MultiversX", symbol: "EGLD", apy: 8.5, minStake: 1, icon: "✕", color: "text-blue-200", coingeckoId: "elrond-erd-2", lockUp: "10 days", risk: "Low", stakingRatio: 68, consensus: "SPoS", category: "Layer 1" },
  { name: "Kusama", symbol: "KSM", apy: 16, minStake: 0.1, icon: "🐦", color: "text-gray-400", coingeckoId: "kusama", lockUp: "7 days", risk: "High", stakingRatio: 48, consensus: "NPoS", category: "Canary" },
  { name: "Hedera", symbol: "HBAR", apy: 6.5, minStake: 1, icon: "ℏ", color: "text-gray-200", coingeckoId: "hedera-hashgraph", lockUp: "None", risk: "Low", stakingRatio: 30, consensus: "Hashgraph", category: "Layer 1" },
  { name: "Toncoin", symbol: "TON", apy: 3.8, minStake: 1, icon: "💎", color: "text-blue-400", coingeckoId: "the-open-network", lockUp: "36 hrs", risk: "Low", stakingRatio: 25, consensus: "PoS", category: "Layer 1" },
  { name: "PIVX", symbol: "PIVX", apy: 9.5, minStake: 1, icon: "🛡", color: "text-purple-400", coingeckoId: "pivx", lockUp: "None", risk: "Medium", stakingRatio: 55, consensus: "PoS", category: "Privacy" },
  { name: "Cronos", symbol: "CRO", apy: 10, minStake: 1, icon: "🔵", color: "text-blue-300", coingeckoId: "crypto-com-chain", lockUp: "28 days", risk: "Medium", stakingRatio: 35, consensus: "Tendermint PoS", category: "Layer 1" },
  { name: "Fetch.ai", symbol: "FET", apy: 7.5, minStake: 1, icon: "🤖", color: "text-indigo-300", coingeckoId: "fetch-ai", lockUp: "21 days", risk: "Medium", stakingRatio: 40, consensus: "Tendermint PoS", category: "AI" },
  { name: "Axelar", symbol: "AXL", apy: 8, minStake: 1, icon: "🔗", color: "text-cyan-400", coingeckoId: "axelar", lockUp: "7 days", risk: "Medium", stakingRatio: 50, consensus: "Tendermint PoS", category: "Interop" },
];

const DURATIONS = [
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
  { label: "180 days", days: 180 },
  { label: "1 year", days: 365 },
  { label: "2 years", days: 730 },
  { label: "5 years", days: 1825 },
];

const COMPOUNDING = [
  { label: "Daily", periodsPerYear: 365 },
  { label: "Weekly", periodsPerYear: 52 },
  { label: "Monthly", periodsPerYear: 12 },
  { label: "None", periodsPerYear: 0 },
];

interface StakingResult {
  estimatedRewards: number;
  totalValue: number;
  effectiveApy: number;
  dailyReward: number;
  monthlyReward: number;
  yearlyReward: number;
  usdRewards: number | null;
  usdTotalValue: number | null;
}

interface StakingPosition {
  id: string;
  coinSymbol: string;
  coinName: string;
  coinIcon: string;
  coinColor: string;
  coingeckoId: string;
  amount: number;
  apy: number;
  compounding: string;
  compoundingPeriodsPerYear: number;
  durationDays: number;
  durationLabel: string;
  startDate: string;
}

const POSITIONS_KEY = "staking-positions";

function loadPositions(): StakingPosition[] {
  try {
    const raw = localStorage.getItem(POSITIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePositions(positions: StakingPosition[]) {
  localStorage.setItem(POSITIONS_KEY, JSON.stringify(positions));
}

function calculateStaking(
  amount: number,
  apy: number,
  durationDays: number,
  compoundingPeriodsPerYear: number
): Omit<StakingResult, "usdRewards" | "usdTotalValue"> {
  const rate = apy / 100;
  const years = durationDays / 365;

  let totalValue: number;
  let effectiveApy: number;

  if (compoundingPeriodsPerYear === 0) {
    totalValue = amount * (1 + rate * years);
    effectiveApy = apy;
  } else {
    const n = compoundingPeriodsPerYear;
    totalValue = amount * Math.pow(1 + rate / n, n * years);
    effectiveApy = (Math.pow(1 + rate / n, n) - 1) * 100;
  }

  const estimatedRewards = totalValue - amount;
  const dailyReward = estimatedRewards / durationDays;
  const monthlyReward = dailyReward * 30;
  const yearlyReward = dailyReward * 365;

  return {
    estimatedRewards,
    totalValue,
    effectiveApy,
    dailyReward,
    monthlyReward,
    yearlyReward,
  };
}

function getProjectionData(amount: number, apy: number, durationDays: number, compoundingPeriodsPerYear: number) {
  const points: { label: string; value: number; rewards: number }[] = [];
  const intervals = [30, 90, 180, 365, 730, 1095, 1460, 1825];
  for (const d of intervals) {
    if (d > durationDays) break;
    const calc = calculateStaking(amount, apy, d, compoundingPeriodsPerYear);
    const label = d < 365 ? `${d}d` : `${(d / 365).toFixed(d % 365 === 0 ? 0 : 1)}y`;
    points.push({ label, value: calc.totalValue, rewards: calc.estimatedRewards });
  }
  if (points.length === 0 || points[points.length - 1].label !== `${durationDays}d`) {
    const calc = calculateStaking(amount, apy, durationDays, compoundingPeriodsPerYear);
    const label = durationDays < 365 ? `${durationDays}d` : `${(durationDays / 365).toFixed(durationDays % 365 === 0 ? 0 : 1)}y`;
    points.push({ label, value: calc.totalValue, rewards: calc.estimatedRewards });
  }
  return points;
}

function getRiskColor(risk: string) {
  if (risk === "Low") return "text-green-400 bg-green-400/10 border-green-400/20";
  if (risk === "Medium") return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
  return "text-red-400 bg-red-400/10 border-red-400/20";
}

type SortKey = "name" | "apy" | "risk" | "stakingRatio" | "lockUp" | "price";
type SortDir = "asc" | "desc";

export default function StakingPage() {
  const [selectedCoinIndex, setSelectedCoinIndex] = useState(0);
  const [amount, setAmount] = useState("");
  const [durationIndex, setDurationIndex] = useState(3);
  const [compoundingIndex, setCompoundingIndex] = useState(0);
  const [result, setResult] = useState<StakingResult | null>(null);
  const [coinDropdownOpen, setCoinDropdownOpen] = useState(false);
  const [amountError, setAmountError] = useState("");
  const [positions, setPositions] = useState<StakingPosition[]>(loadPositions);
  const [tableSort, setTableSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "apy", dir: "desc" });
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [coinSearch, setCoinSearch] = useState("");
  const [dropdownSearch, setDropdownSearch] = useState("");

  const selectedCoin = STAKING_COINS[selectedCoinIndex];
  const selectedDuration = DURATIONS[durationIndex];
  const selectedCompounding = COMPOUNDING[compoundingIndex];

  const coingeckoIds = STAKING_COINS.map((c) => c.coingeckoId).join(",");
  const { data: priceData } = useQuery({
    queryKey: ["staking-prices", coingeckoIds],
    queryFn: async () => {
      const res = await fetch(`/api/prices/by-ids?ids=${coingeckoIds}`);
      if (!res.ok) return null;
      return res.json();
    },
    refetchInterval: 120000,
    staleTime: 60000,
  });

  const getCurrentPrice = (coingeckoId: string): number | null => {
    if (!priceData || !Array.isArray(priceData)) return null;
    const coin = priceData.find((c: any) => c.id === coingeckoId);
    return coin?.current_price ?? null;
  };

  const getMarketCap = (coingeckoId: string): number | null => {
    if (!priceData || !Array.isArray(priceData)) return null;
    const coin = priceData.find((c: any) => c.id === coingeckoId);
    return coin?.market_cap ?? null;
  };

  const handleCalculate = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setAmountError("Please enter a valid positive number");
      return;
    }
    if (numAmount < selectedCoin.minStake) {
      setAmountError(`Minimum stake for ${selectedCoin.symbol} is ${selectedCoin.minStake}`);
      return;
    }
    setAmountError("");

    const calcResult = calculateStaking(
      numAmount,
      selectedCoin.apy,
      selectedDuration.days,
      selectedCompounding.periodsPerYear
    );

    const price = getCurrentPrice(selectedCoin.coingeckoId);

    setResult({
      ...calcResult,
      usdRewards: price ? calcResult.estimatedRewards * price : null,
      usdTotalValue: price ? calcResult.totalValue * price : null,
    });
  };

  const handleTrackPosition = () => {
    const parsedAmount = parseFloat(amount);
    if (!result || isNaN(parsedAmount) || parsedAmount <= 0 || parsedAmount < selectedCoin.minStake) {
      return;
    }
    const newPosition: StakingPosition = {
      id: Date.now().toString(),
      coinSymbol: selectedCoin.symbol,
      coinName: selectedCoin.name,
      coinIcon: selectedCoin.icon,
      coinColor: selectedCoin.color,
      coingeckoId: selectedCoin.coingeckoId,
      amount: parsedAmount,
      apy: selectedCoin.apy,
      compounding: selectedCompounding.label,
      compoundingPeriodsPerYear: selectedCompounding.periodsPerYear,
      durationDays: selectedDuration.days,
      durationLabel: selectedDuration.label,
      startDate: new Date().toISOString(),
    };
    const updated = [...positions, newPosition];
    setPositions(updated);
    savePositions(updated);
  };

  const handleRemovePosition = (id: string) => {
    const updated = positions.filter((p) => p.id !== id);
    setPositions(updated);
    savePositions(updated);
  };

  const getPositionRewards = (pos: StakingPosition) => {
    const elapsedMs = Date.now() - new Date(pos.startDate).getTime();
    const elapsedDays = Math.max(elapsedMs / (1000 * 60 * 60 * 24), 0);
    const daysToCalc = Math.min(elapsedDays, pos.durationDays);
    const projected = calculateStaking(pos.amount, pos.apy, pos.durationDays, pos.compoundingPeriodsPerYear);
    const soFar = calculateStaking(pos.amount, pos.apy, daysToCalc, pos.compoundingPeriodsPerYear);
    const price = getCurrentPrice(pos.coingeckoId);
    return {
      accumulatedRewards: soFar.estimatedRewards,
      accumulatedUsd: price ? soFar.estimatedRewards * price : null,
      projectedTotal: projected.estimatedRewards,
      dailyReward: projected.dailyReward,
      monthlyReward: projected.monthlyReward,
      elapsedDays: Math.floor(daysToCalc),
      remainingDays: Math.max(0, Math.ceil(pos.durationDays - daysToCalc)),
      progress: Math.min((daysToCalc / pos.durationDays) * 100, 100),
    };
  };

  const projectionData = useMemo(() => {
    if (!result) return [];
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return [];
    return getProjectionData(numAmount, selectedCoin.apy, selectedDuration.days, selectedCompounding.periodsPerYear);
  }, [result, amount, selectedCoin.apy, selectedDuration.days, selectedCompounding.periodsPerYear]);

  const categories = useMemo(() => {
    const cats = new Set(STAKING_COINS.map((c) => c.category));
    return ["All", ...Array.from(cats).sort()];
  }, []);

  const filteredCoins = useMemo(() => {
    const q = coinSearch.toLowerCase();
    return STAKING_COINS.filter((c) => {
      if (categoryFilter !== "All" && c.category !== categoryFilter) return false;
      if (q && !c.name.toLowerCase().includes(q) && !c.symbol.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [categoryFilter, coinSearch]);

  const sortedCoins = useMemo(() => {
    const riskOrder = { Low: 0, Medium: 1, High: 2 };
    return [...filteredCoins].sort((a, b) => {
      let cmp = 0;
      switch (tableSort.key) {
        case "name": cmp = a.name.localeCompare(b.name); break;
        case "apy": cmp = a.apy - b.apy; break;
        case "risk": cmp = riskOrder[a.risk] - riskOrder[b.risk]; break;
        case "stakingRatio": cmp = a.stakingRatio - b.stakingRatio; break;
        case "lockUp": cmp = a.lockUp.localeCompare(b.lockUp); break;
        case "price": cmp = (getCurrentPrice(a.coingeckoId) || 0) - (getCurrentPrice(b.coingeckoId) || 0); break;
      }
      return tableSort.dir === "desc" ? -cmp : cmp;
    });
  }, [filteredCoins, tableSort, priceData]);

  const handleSort = (key: SortKey) => {
    setTableSort((prev) => ({
      key,
      dir: prev.key === key && prev.dir === "desc" ? "asc" : "desc",
    }));
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (tableSort.key !== col) return <ArrowUpDown className="w-3 h-3 opacity-40" />;
    return tableSort.dir === "desc"
      ? <ChevronDown className="w-3 h-3 text-primary" />
      : <ChevronUp className="w-3 h-3 text-primary" />;
  };

  const formatCompact = (n: number) => {
    if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
    return `$${n.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div
        className="h-72 w-full absolute top-0 left-0 z-0 page-glow"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(0,200,255,0.15) 0%, transparent 70%)",
        }}
      />
      <Navbar />

      <main className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-8">
        <AdBanner slot="0123456789" format="horizontal" className="w-full mb-6" />

        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-2" data-testid="text-staking-title">
            <Calculator className="w-8 h-8 inline-block mr-2 text-primary" />
            Staking Calculator
          </h1>
          <p className="text-muted-foreground" data-testid="text-staking-subtitle">
            Compare APY rates, estimate compound rewards, and track positions across {STAKING_COINS.length}+ proof-of-stake networks
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="glass-panel rounded-xl p-4 text-center" data-testid="stat-total-coins">
            <p className="text-2xl font-display font-bold text-primary">{STAKING_COINS.length}</p>
            <p className="text-xs text-muted-foreground">Supported Coins</p>
          </div>
          <div className="glass-panel rounded-xl p-4 text-center" data-testid="stat-avg-apy">
            <p className="text-2xl font-display font-bold text-green-400">
              {(STAKING_COINS.reduce((s, c) => s + c.apy, 0) / STAKING_COINS.length).toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">Avg APY</p>
          </div>
          <div className="glass-panel rounded-xl p-4 text-center" data-testid="stat-highest-apy">
            <p className="text-2xl font-display font-bold text-yellow-400">
              {Math.max(...STAKING_COINS.map((c) => c.apy))}%
            </p>
            <p className="text-xs text-muted-foreground">Highest APY</p>
          </div>
          <div className="glass-panel rounded-xl p-4 text-center" data-testid="stat-positions">
            <p className="text-2xl font-display font-bold text-foreground">{positions.length}</p>
            <p className="text-xs text-muted-foreground">Your Positions</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="glass-panel border-primary/20">
            <CardContent className="p-6 space-y-6">
              <h2 className="text-lg font-display font-semibold flex items-center gap-2">
                <Coins className="w-5 h-5 text-primary" />
                Configure Staking
              </h2>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground font-medium">Select Coin</label>
                <div className="relative">
                  <button
                    onClick={() => setCoinDropdownOpen(!coinDropdownOpen)}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border hover:border-primary/50 transition-colors text-left"
                    data-testid="select-coin"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-xl ${selectedCoin.color}`}>{selectedCoin.icon}</span>
                      <div>
                        <span className="font-medium text-foreground">{selectedCoin.name}</span>
                        <span className="text-muted-foreground ml-2 text-sm">({selectedCoin.symbol})</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">{selectedCoin.apy}% APY</Badge>
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${coinDropdownOpen ? "rotate-180" : ""}`} />
                    </div>
                  </button>
                  {coinDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 rounded-lg bg-card border border-border shadow-xl max-h-72 overflow-hidden">
                      <div className="p-2 border-b border-border">
                        <input
                          placeholder="Search coins..."
                          className="w-full px-3 py-1.5 text-sm rounded bg-muted/30 border-none outline-none text-foreground placeholder:text-muted-foreground"
                          autoFocus
                          value={dropdownSearch}
                          onChange={(e) => setDropdownSearch(e.target.value)}
                          data-testid="input-coin-search"
                        />
                      </div>
                      <div className="overflow-y-auto max-h-56">
                        {STAKING_COINS.filter((c) => {
                          if (!dropdownSearch) return true;
                          const q = dropdownSearch.toLowerCase();
                          return c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q);
                        }).map((coin, i) => {
                          const idx = STAKING_COINS.indexOf(coin);
                          return (
                            <button
                              key={`${coin.symbol}-${coin.name}`}
                              onClick={() => { setSelectedCoinIndex(idx); setCoinDropdownOpen(false); setDropdownSearch(""); }}
                              className={`w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors text-left ${idx === selectedCoinIndex ? "bg-primary/10" : ""}`}
                              data-testid={`option-coin-${coin.symbol.toLowerCase()}`}
                            >
                              <div className="flex items-center gap-3">
                                <span className={`text-lg ${coin.color}`}>{coin.icon}</span>
                                <div>
                                  <span className="font-medium text-sm text-foreground">{coin.name}</span>
                                  <span className="text-xs text-muted-foreground ml-1">{coin.symbol}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getRiskColor(coin.risk)}`}>{coin.risk}</span>
                                <span className="text-xs text-primary font-medium">{coin.apy}%</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> {selectedCoin.lockUp}</span>
                  <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> {selectedCoin.risk} risk</span>
                  <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> {selectedCoin.consensus}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground font-medium">
                  Amount ({selectedCoin.symbol})
                </label>
                <Input
                  type="number"
                  placeholder={`Min ${selectedCoin.minStake} ${selectedCoin.symbol}`}
                  value={amount}
                  onChange={(e) => { setAmount(e.target.value); setAmountError(""); }}
                  className="bg-muted/30 border-border text-lg font-mono"
                  min={selectedCoin.minStake}
                  step="any"
                  data-testid="input-stake-amount"
                />
                {amountError && (
                  <p className="text-xs text-destructive" data-testid="text-amount-error">{amountError}</p>
                )}
                {getCurrentPrice(selectedCoin.coingeckoId) && amount && parseFloat(amount) > 0 && (
                  <p className="text-xs text-muted-foreground" data-testid="text-amount-usd">
                    ≈ ${(parseFloat(amount) * (getCurrentPrice(selectedCoin.coingeckoId) || 0)).toLocaleString(undefined, { maximumFractionDigits: 2 })} USD
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground font-medium flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Staking Duration
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {DURATIONS.map((d, i) => (
                    <button
                      key={d.label}
                      onClick={() => setDurationIndex(i)}
                      className={`p-2 rounded-lg text-sm font-medium transition-all border ${
                        i === durationIndex
                          ? "bg-primary/20 border-primary/50 text-primary"
                          : "bg-muted/20 border-border text-muted-foreground hover:border-primary/30"
                      }`}
                      data-testid={`button-duration-${d.days}`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground font-medium flex items-center gap-1">
                  <RefreshCw className="w-3.5 h-3.5" /> Compounding Frequency
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {COMPOUNDING.map((c, i) => (
                    <button
                      key={c.label}
                      onClick={() => setCompoundingIndex(i)}
                      className={`p-2 rounded-lg text-sm font-medium transition-all border ${
                        i === compoundingIndex
                          ? "bg-primary/20 border-primary/50 text-primary"
                          : "bg-muted/20 border-border text-muted-foreground hover:border-primary/30"
                      }`}
                      data-testid={`button-compound-${c.label.toLowerCase()}`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleCalculate}
                className="w-full h-12 text-base font-display font-semibold"
                data-testid="button-calculate"
              >
                <Calculator className="w-5 h-5 mr-2" />
                Calculate Rewards
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {result ? (
              <>
                <Card className="glass-panel border-green-500/20">
                  <CardContent className="p-6">
                    <h2 className="text-lg font-display font-semibold flex items-center gap-2 mb-6">
                      <TrendingUp className="w-5 h-5 text-green-400" />
                      Staking Results
                    </h2>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Coins className="w-3 h-3" /> Estimated Rewards
                        </p>
                        <p className="text-2xl font-mono font-bold text-green-400" data-testid="text-estimated-rewards">
                          {result.estimatedRewards.toLocaleString(undefined, { maximumFractionDigits: 6 })} {selectedCoin.symbol}
                        </p>
                        {result.usdRewards !== null && (
                          <p className="text-sm text-muted-foreground font-mono" data-testid="text-rewards-usd">
                            ≈ ${result.usdRewards.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <DollarSign className="w-3 h-3" /> Total Value
                        </p>
                        <p className="text-2xl font-mono font-bold text-foreground" data-testid="text-total-value">
                          {result.totalValue.toLocaleString(undefined, { maximumFractionDigits: 6 })} {selectedCoin.symbol}
                        </p>
                        {result.usdTotalValue !== null && (
                          <p className="text-sm text-muted-foreground font-mono" data-testid="text-total-usd">
                            ≈ ${result.usdTotalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Percent className="w-3 h-3" /> Effective APY
                        </p>
                        <p className="text-xl font-mono font-semibold text-primary" data-testid="text-effective-apy">
                          {result.effectiveApy.toFixed(2)}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {selectedCompounding.label === "None" ? "Simple interest" : `Compounded ${selectedCompounding.label.toLowerCase()}`}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Duration
                        </p>
                        <p className="text-xl font-mono font-semibold text-foreground" data-testid="text-duration">
                          {selectedDuration.label}
                        </p>
                        <p className="text-xs text-muted-foreground">{selectedDuration.days} days</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-panel border-border/50">
                  <CardContent className="p-6">
                    <h3 className="text-sm font-display font-semibold text-muted-foreground mb-4 uppercase tracking-wider">
                      Reward Breakdown
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                        <span className="text-sm text-muted-foreground">Daily Reward</span>
                        <span className="font-mono text-sm text-green-400" data-testid="text-daily-reward">
                          +{result.dailyReward.toLocaleString(undefined, { maximumFractionDigits: 6 })} {selectedCoin.symbol}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                        <span className="text-sm text-muted-foreground">Monthly Reward</span>
                        <span className="font-mono text-sm text-green-400" data-testid="text-monthly-reward">
                          +{result.monthlyReward.toLocaleString(undefined, { maximumFractionDigits: 6 })} {selectedCoin.symbol}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                        <span className="text-sm text-muted-foreground">Yearly Reward</span>
                        <span className="font-mono text-sm text-green-400" data-testid="text-yearly-reward">
                          +{result.yearlyReward.toLocaleString(undefined, { maximumFractionDigits: 6 })} {selectedCoin.symbol}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-green-500/20">
                        <span className="text-sm text-foreground font-medium">Total Rewards</span>
                        <span className="font-mono text-sm text-green-400 font-semibold" data-testid="text-total-rewards">
                          +{result.estimatedRewards.toLocaleString(undefined, { maximumFractionDigits: 6 })} {selectedCoin.symbol}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 p-3 rounded-lg bg-muted/10 border border-border/50">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <Lock className="w-3 h-3" /> Lock-up: <span className="text-foreground">{selectedCoin.lockUp}</span>
                        <span className="mx-1">|</span>
                        <Shield className="w-3 h-3" /> Risk: <span className={getRiskColor(selectedCoin.risk).split(" ")[0]}>{selectedCoin.risk}</span>
                        <span className="mx-1">|</span>
                        <Layers className="w-3 h-3" /> Staking Ratio: <span className="text-foreground">{selectedCoin.stakingRatio}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {projectionData.length > 1 && (
                  <Card className="glass-panel border-border/50">
                    <CardContent className="p-6">
                      <h3 className="text-sm font-display font-semibold text-muted-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-primary" />
                        Growth Projection
                      </h3>
                      <div className="space-y-2">
                        {projectionData.map((pt, i) => {
                          const maxVal = projectionData[projectionData.length - 1].value;
                          const pct = (pt.value / maxVal) * 100;
                          const price = getCurrentPrice(selectedCoin.coingeckoId);
                          return (
                            <div key={i} className="flex items-center gap-3">
                              <span className="text-xs text-muted-foreground w-8 text-right font-mono">{pt.label}</span>
                              <div className="flex-1 h-6 bg-muted/20 rounded-full overflow-hidden relative">
                                <div
                                  className="h-full bg-gradient-to-r from-primary/60 to-green-400/60 rounded-full transition-all duration-500"
                                  style={{ width: `${pct}%` }}
                                />
                                <span className="absolute inset-0 flex items-center justify-end pr-3 text-[10px] font-mono text-foreground/80">
                                  {pt.value.toLocaleString(undefined, { maximumFractionDigits: 4 })} {selectedCoin.symbol}
                                  {price ? ` ($${(pt.value * price).toLocaleString(undefined, { maximumFractionDigits: 0 })})` : ""}
                                </span>
                              </div>
                              <span className="text-[10px] text-green-400 font-mono w-20 text-right">
                                +{pt.rewards.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Button
                  onClick={handleTrackPosition}
                  variant="outline"
                  className="w-full border-primary/30 hover:bg-primary/10"
                  data-testid="button-track-position"
                >
                  <Bookmark className="w-4 h-4 mr-2" />
                  Track This Position
                </Button>
              </>
            ) : (
              <Card className="glass-panel border-border/30">
                <CardContent className="p-12 text-center">
                  <Calculator className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground font-medium" data-testid="text-no-results">
                    Select a coin, enter an amount, and click Calculate to see your estimated staking rewards
                  </p>
                  <div className="mt-6 grid grid-cols-3 gap-3">
                    {STAKING_COINS.slice(0, 6).map((coin) => (
                      <button
                        key={coin.symbol}
                        onClick={() => {
                          setSelectedCoinIndex(STAKING_COINS.indexOf(coin));
                          setAmount(String(coin.minStake * 100));
                        }}
                        className="p-3 rounded-lg bg-muted/20 border border-border/50 hover:border-primary/50 transition-all text-center"
                        data-testid={`quick-pick-${coin.symbol.toLowerCase()}`}
                      >
                        <span className={`text-lg ${coin.color}`}>{coin.icon}</span>
                        <p className="text-xs text-foreground font-medium mt-1">{coin.symbol}</p>
                        <p className="text-[10px] text-green-400">{coin.apy}% APY</p>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {positions.length > 0 && (
          <section data-testid="section-my-positions">
            <h2 className="text-xl font-display font-semibold mb-4 flex items-center gap-2" data-testid="text-my-positions-title">
              <Bookmark className="w-5 h-5 text-primary" />
              My Staking Positions
              <Badge variant="secondary" className="ml-2">{positions.length}</Badge>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {positions.map((pos) => {
                const rewards = getPositionRewards(pos);
                return (
                  <Card key={pos.id} className="glass-panel border-border/50 hover:border-primary/30 transition-all" data-testid={`card-position-${pos.id}`}>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`text-lg ${pos.coinColor}`}>{pos.coinIcon}</span>
                          <div>
                            <span className="font-display font-semibold text-foreground">{pos.coinName}</span>
                            <span className="text-muted-foreground text-sm ml-1">({pos.coinSymbol})</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemovePosition(pos.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded"
                          data-testid={`button-remove-position-${pos.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Staked Amount</p>
                          <p className="font-mono font-medium text-foreground" data-testid={`text-position-amount-${pos.id}`}>
                            {pos.amount.toLocaleString(undefined, { maximumFractionDigits: 6 })} {pos.coinSymbol}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">APY / Compounding</p>
                          <p className="font-mono font-medium text-primary">{pos.apy}% / {pos.compounding}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Accumulated Rewards</p>
                          <p className="font-mono font-medium text-green-400" data-testid={`text-position-accumulated-${pos.id}`}>
                            +{rewards.accumulatedRewards.toLocaleString(undefined, { maximumFractionDigits: 6 })} {pos.coinSymbol}
                          </p>
                          {rewards.accumulatedUsd !== null && (
                            <p className="text-xs text-muted-foreground font-mono">
                              ≈ ${rewards.accumulatedUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Projected Total</p>
                          <p className="font-mono font-medium text-foreground" data-testid={`text-position-projected-${pos.id}`}>
                            +{rewards.projectedTotal.toLocaleString(undefined, { maximumFractionDigits: 6 })} {pos.coinSymbol}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Daily: <span className="text-green-400 font-mono">+{rewards.dailyReward.toLocaleString(undefined, { maximumFractionDigits: 6 })} {pos.coinSymbol}</span></span>
                          <span>Monthly: <span className="text-green-400 font-mono">+{rewards.monthlyReward.toLocaleString(undefined, { maximumFractionDigits: 6 })} {pos.coinSymbol}</span></span>
                        </div>
                        <div className="w-full bg-muted/30 rounded-full h-1.5">
                          <div
                            className="bg-primary h-1.5 rounded-full transition-all"
                            style={{ width: `${rewards.progress}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>{rewards.elapsedDays}d elapsed</span>
                          <span>{pos.durationLabel} ({rewards.remainingDays}d remaining)</span>
                        </div>
                        <p className="text-muted-foreground/60">
                          Started {new Date(pos.startDate).toLocaleDateString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        <AdBanner slot="0123456789" className="my-6" />

        <section data-testid="section-compare-yields">
          <h2 className="text-xl font-display font-semibold mb-4 flex items-center gap-2" data-testid="text-compare-title">
            <ArrowUpDown className="w-5 h-5 text-primary" />
            Compare Staking Yields
          </h2>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <input
              placeholder="Search..."
              value={coinSearch}
              onChange={(e) => setCoinSearch(e.target.value)}
              className="px-3 py-1 rounded-full text-xs bg-muted/30 border border-border outline-none text-foreground placeholder:text-muted-foreground w-32 focus:border-primary/50 transition-colors"
              data-testid="input-table-search"
            />
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                  categoryFilter === cat
                    ? "bg-primary/20 border-primary/50 text-primary"
                    : "bg-muted/20 border-border text-muted-foreground hover:border-primary/30"
                }`}
                data-testid={`filter-${cat.toLowerCase()}`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto rounded-xl border border-border/50">
            <table className="w-full text-sm" data-testid="table-compare">
              <thead>
                <tr className="bg-muted/20 border-b border-border/50">
                  <th className="text-left p-3">
                    <button onClick={() => handleSort("name")} className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-xs uppercase tracking-wider font-medium">
                      Asset <SortIcon col="name" />
                    </button>
                  </th>
                  <th className="text-right p-3">
                    <button onClick={() => handleSort("apy")} className="flex items-center gap-1 justify-end text-muted-foreground hover:text-foreground text-xs uppercase tracking-wider font-medium ml-auto">
                      APY <SortIcon col="apy" />
                    </button>
                  </th>
                  <th className="text-right p-3 hidden sm:table-cell">
                    <button onClick={() => handleSort("price")} className="flex items-center gap-1 justify-end text-muted-foreground hover:text-foreground text-xs uppercase tracking-wider font-medium ml-auto">
                      Price <SortIcon col="price" />
                    </button>
                  </th>
                  <th className="text-right p-3 hidden md:table-cell">
                    <button onClick={() => handleSort("stakingRatio")} className="flex items-center gap-1 justify-end text-muted-foreground hover:text-foreground text-xs uppercase tracking-wider font-medium ml-auto">
                      Staking Ratio <SortIcon col="stakingRatio" />
                    </button>
                  </th>
                  <th className="text-center p-3 hidden md:table-cell">
                    <button onClick={() => handleSort("lockUp")} className="flex items-center gap-1 justify-center text-muted-foreground hover:text-foreground text-xs uppercase tracking-wider font-medium mx-auto">
                      Lock-up <SortIcon col="lockUp" />
                    </button>
                  </th>
                  <th className="text-center p-3 hidden lg:table-cell">
                    <button onClick={() => handleSort("risk")} className="flex items-center gap-1 justify-center text-muted-foreground hover:text-foreground text-xs uppercase tracking-wider font-medium mx-auto">
                      Risk <SortIcon col="risk" />
                    </button>
                  </th>
                  <th className="text-right p-3 hidden lg:table-cell">
                    <button onClick={() => handleSort("price")} className="flex items-center gap-1 justify-end text-muted-foreground hover:text-foreground text-xs uppercase tracking-wider font-medium ml-auto">
                      Mkt Cap <SortIcon col="price" />
                    </button>
                  </th>
                  <th className="p-3 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {sortedCoins.map((coin) => {
                  const price = getCurrentPrice(coin.coingeckoId);
                  const mcap = getMarketCap(coin.coingeckoId);
                  const idx = STAKING_COINS.indexOf(coin);
                  return (
                    <tr
                      key={`${coin.symbol}-${coin.name}`}
                      className="border-b border-border/30 hover:bg-muted/10 transition-colors"
                      data-testid={`row-coin-${coin.symbol.toLowerCase()}`}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className={`text-lg ${coin.color}`}>{coin.icon}</span>
                          <div>
                            <p className="font-medium text-foreground text-sm">{coin.name}</p>
                            <p className="text-[10px] text-muted-foreground">{coin.symbol} · {coin.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <span className="font-mono font-semibold text-green-400">{coin.apy}%</span>
                      </td>
                      <td className="p-3 text-right hidden sm:table-cell">
                        <span className="font-mono text-foreground text-xs">
                          {price ? (price < 1 ? `$${price.toFixed(4)}` : `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`) : "—"}
                        </span>
                      </td>
                      <td className="p-3 text-right hidden md:table-cell">
                        <div className="flex items-center gap-2 justify-end">
                          <div className="w-16 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                            <div className="h-full bg-primary/60 rounded-full" style={{ width: `${coin.stakingRatio}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground font-mono">{coin.stakingRatio}%</span>
                        </div>
                      </td>
                      <td className="p-3 text-center hidden md:table-cell">
                        <span className="text-xs text-muted-foreground">{coin.lockUp}</span>
                      </td>
                      <td className="p-3 text-center hidden lg:table-cell">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getRiskColor(coin.risk)}`}>
                          {coin.risk}
                        </span>
                      </td>
                      <td className="p-3 text-right hidden lg:table-cell">
                        <span className="text-xs text-muted-foreground font-mono">
                          {mcap ? formatCompact(mcap) : "—"}
                        </span>
                      </td>
                      <td className="p-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-primary hover:bg-primary/10"
                          onClick={() => {
                            setSelectedCoinIndex(idx);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          data-testid={`button-calc-${coin.symbol.toLowerCase()}`}
                        >
                          Calc
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <Card className="glass-panel border-border/30">
          <CardContent className="p-6 md:p-8">
            <h2 className="text-xl font-display font-semibold mb-4 flex items-center gap-2" data-testid="text-staking-info-title">
              <Info className="w-5 h-5 text-primary" />
              What is Crypto Staking?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-muted-foreground">
              <div className="space-y-3">
                <p>
                  <strong className="text-foreground">Staking</strong> is the process of locking up your cryptocurrency to support a blockchain network's operations, such as validating transactions on Proof-of-Stake (PoS) networks. In return, you earn rewards — similar to earning interest in a savings account.
                </p>
                <p>
                  <strong className="text-foreground">How APY Works:</strong> Annual Percentage Yield (APY) represents the total return over a year, including the effect of compounding. A higher compounding frequency (daily vs. monthly) generally results in slightly higher effective returns.
                </p>
                <p>
                  <strong className="text-foreground">Staking Ratio:</strong> This shows the percentage of total token supply that is currently being staked. A higher ratio typically means stronger network security but may lead to lower rewards per staker.
                </p>
              </div>
              <div className="space-y-3">
                <p>
                  <strong className="text-foreground">Compounding:</strong> When you choose to compound your rewards, your earned tokens are re-staked automatically, earning you rewards on top of rewards. Daily compounding yields the highest effective APY.
                </p>
                <p>
                  <strong className="text-foreground">Lock-up Periods:</strong> Many networks require you to lock your tokens for a set period (unbonding period) before you can withdraw. During this time, your tokens earn no rewards and cannot be traded. Consider this before staking.
                </p>
                <p>
                  <strong className="text-foreground">Risks:</strong> Staking involves risks including slashing (penalty for validator misbehavior), lock-up period price volatility, smart contract bugs, and inflation dilution. Networks rated "High" risk have more aggressive slashing or are less battle-tested. Always do your own research.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          <a href="https://gomining.com/?ref=8H3M22H" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/20 hover:border-orange-400/40 transition-all group" data-testid="banner-gomining-staking">
            <Coins className="w-8 h-8 text-orange-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">GoMining</p>
              <p className="text-xs text-muted-foreground">Earn BTC daily with tokenized hashrate — no hardware needed</p>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-orange-400 shrink-0" />
          </a>
          <a href="https://www.tradingview.com/pricing/?share_your_love=moneyflowstome78&mobileapp=true" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 hover:border-cyan-400/40 transition-all group" data-testid="banner-tradingview-staking">
            <TrendingUp className="w-8 h-8 text-cyan-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">TradingView</p>
              <p className="text-xs text-muted-foreground">Track your staking rewards with professional charts & alerts</p>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-cyan-400 shrink-0" />
          </a>
        </div>

        <AdBanner slot="0123456789" className="mt-8" />
      </main>
      <Footer />
    </div>
  );
}
