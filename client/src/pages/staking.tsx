import { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AdBanner } from "@/components/AdBanner";

const STAKING_COINS = [
  { name: "Ethereum", symbol: "ETH", apy: 3.5, minStake: 0.01, icon: "⟠", color: "text-blue-400", coingeckoId: "ethereum" },
  { name: "Solana", symbol: "SOL", apy: 6.8, minStake: 0.01, icon: "◎", color: "text-purple-400", coingeckoId: "solana" },
  { name: "Cardano", symbol: "ADA", apy: 4.5, minStake: 10, icon: "♦", color: "text-blue-300", coingeckoId: "cardano" },
  { name: "Polkadot", symbol: "DOT", apy: 14, minStake: 1, icon: "●", color: "text-pink-400", coingeckoId: "polkadot" },
  { name: "Cosmos", symbol: "ATOM", apy: 18, minStake: 0.01, icon: "⚛", color: "text-indigo-400", coingeckoId: "cosmos" },
  { name: "Avalanche", symbol: "AVAX", apy: 8, minStake: 25, icon: "🔺", color: "text-red-400", coingeckoId: "avalanche-2" },
  { name: "Tezos", symbol: "XTZ", apy: 5.5, minStake: 1, icon: "ꜩ", color: "text-blue-500", coingeckoId: "tezos" },
  { name: "Near", symbol: "NEAR", apy: 10, minStake: 1, icon: "Ⓝ", color: "text-green-400", coingeckoId: "near" },
  { name: "Algorand", symbol: "ALGO", apy: 5, minStake: 1, icon: "◈", color: "text-gray-300", coingeckoId: "algorand" },
  { name: "Polygon", symbol: "MATIC", apy: 5, minStake: 1, icon: "⬡", color: "text-purple-500", coingeckoId: "matic-network" },
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
  usdRewards: number | null;
  usdTotalValue: number | null;
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

  return {
    estimatedRewards,
    totalValue,
    effectiveApy,
    dailyReward,
    monthlyReward,
  };
}

export default function StakingPage() {
  const [selectedCoinIndex, setSelectedCoinIndex] = useState(0);
  const [amount, setAmount] = useState("");
  const [durationIndex, setDurationIndex] = useState(3);
  const [compoundingIndex, setCompoundingIndex] = useState(0);
  const [result, setResult] = useState<StakingResult | null>(null);
  const [coinDropdownOpen, setCoinDropdownOpen] = useState(false);
  const [amountError, setAmountError] = useState("");

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
        <AdBanner slot="staking-top" format="horizontal" className="w-full mb-6" />

        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-2" data-testid="text-staking-title">
            <Calculator className="w-8 h-8 inline-block mr-2 text-primary" />
            Staking Calculator
          </h1>
          <p className="text-muted-foreground" data-testid="text-staking-subtitle">
            Estimate your staking rewards with compound interest across top proof-of-stake networks
          </p>
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
                    <div className="absolute z-50 w-full mt-1 rounded-lg bg-card border border-border shadow-xl max-h-64 overflow-y-auto">
                      {STAKING_COINS.map((coin, i) => (
                        <button
                          key={coin.symbol}
                          onClick={() => { setSelectedCoinIndex(i); setCoinDropdownOpen(false); }}
                          className={`w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors text-left ${i === selectedCoinIndex ? "bg-primary/10" : ""}`}
                          data-testid={`option-coin-${coin.symbol.toLowerCase()}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`text-lg ${coin.color}`}>{coin.icon}</span>
                            <span className="font-medium text-sm text-foreground">{coin.name}</span>
                            <span className="text-xs text-muted-foreground">{coin.symbol}</span>
                          </div>
                          <span className="text-xs text-primary">{coin.apy}% APY</span>
                        </button>
                      ))}
                    </div>
                  )}
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
                        <span className="text-sm text-muted-foreground">Total Rewards</span>
                        <span className="font-mono text-sm text-green-400 font-semibold" data-testid="text-total-rewards">
                          +{result.estimatedRewards.toLocaleString(undefined, { maximumFractionDigits: 6 })} {selectedCoin.symbol}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="glass-panel border-border/30">
                <CardContent className="p-12 text-center">
                  <Calculator className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground font-medium" data-testid="text-no-results">
                    Select a coin, enter an amount, and click Calculate to see your estimated staking rewards
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <AdBanner slot="staking-mid" className="my-6" />

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
              </div>
              <div className="space-y-3">
                <p>
                  <strong className="text-foreground">Compounding:</strong> When you choose to compound your rewards, your earned tokens are re-staked automatically, earning you rewards on top of rewards. Daily compounding yields the highest effective APY.
                </p>
                <p>
                  <strong className="text-foreground">Important Notes:</strong> APY rates are approximate and can fluctuate based on network conditions, validator performance, and total staked supply. Staking may involve lock-up periods and potential slashing risks. Always do your own research before staking.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <section>
          <h2 className="text-lg font-display font-semibold mb-4" data-testid="text-available-coins-title">
            Available Staking Coins
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {STAKING_COINS.map((coin) => {
              const price = getCurrentPrice(coin.coingeckoId);
              return (
                <button
                  key={coin.symbol}
                  onClick={() => {
                    setSelectedCoinIndex(STAKING_COINS.indexOf(coin));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="text-left group"
                  data-testid={`card-staking-coin-${coin.symbol.toLowerCase()}`}
                >
                  <Card className="glass-panel border-border/50 hover:border-primary/50 transition-all duration-300 group-hover:scale-[1.02] h-full">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-lg ${coin.color}`}>{coin.icon}</span>
                        <span className="font-display font-semibold text-sm text-foreground">{coin.symbol}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">{coin.name}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs text-green-400">{coin.apy}% APY</Badge>
                        {price && (
                          <span className="text-xs text-muted-foreground font-mono">
                            ${price < 1 ? price.toFixed(4) : price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </button>
              );
            })}
          </div>
        </section>

        <AdBanner slot="staking-bottom" className="mt-8" />
      </main>
      <Footer />
    </div>
  );
}
