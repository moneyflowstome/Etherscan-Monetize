import { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AdBanner } from "@/components/AdBanner";
import {
  Loader2,
  ArrowRight,
  TrendingUp,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  RefreshCw,
  Search,
  ArrowUpDown,
  DollarSign,
  BarChart3,
  Shield,
  Info,
  Calculator,
  Plus,
  X,
  Clock,
  Zap,
  Filter,
  Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SocialShareButton } from "@/components/SocialShare";

const COIN_META: Record<string, { symbol: string; name: string; image: string }> = {
  bitcoin: { symbol: "BTC", name: "Bitcoin", image: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png" },
  ethereum: { symbol: "ETH", name: "Ethereum", image: "https://assets.coingecko.com/coins/images/279/small/ethereum.png" },
  solana: { symbol: "SOL", name: "Solana", image: "https://assets.coingecko.com/coins/images/4128/small/solana.png" },
  ripple: { symbol: "XRP", name: "XRP", image: "https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png" },
  binancecoin: { symbol: "BNB", name: "BNB", image: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png" },
  dogecoin: { symbol: "DOGE", name: "Dogecoin", image: "https://assets.coingecko.com/coins/images/5/small/dogecoin.png" },
  cardano: { symbol: "ADA", name: "Cardano", image: "https://assets.coingecko.com/coins/images/975/small/cardano.png" },
  polkadot: { symbol: "DOT", name: "Polkadot", image: "https://assets.coingecko.com/coins/images/12171/small/polkadot.png" },
  "avalanche-2": { symbol: "AVAX", name: "Avalanche", image: "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png" },
  chainlink: { symbol: "LINK", name: "Chainlink", image: "https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png" },
  tron: { symbol: "TRX", name: "TRON", image: "https://assets.coingecko.com/coins/images/1094/small/tron-logo.png" },
  litecoin: { symbol: "LTC", name: "Litecoin", image: "https://assets.coingecko.com/coins/images/2/small/litecoin.png" },
  uniswap: { symbol: "UNI", name: "Uniswap", image: "https://assets.coingecko.com/coins/images/12504/small/uniswap-uni.png" },
  stellar: { symbol: "XLM", name: "Stellar", image: "https://assets.coingecko.com/coins/images/100/small/Stellar_symbol_black_RGB.png" },
  near: { symbol: "NEAR", name: "NEAR Protocol", image: "https://assets.coingecko.com/coins/images/10365/small/near.jpg" },
  sui: { symbol: "SUI", name: "Sui", image: "https://assets.coingecko.com/coins/images/26375/small/sui_asset.jpeg" },
  aptos: { symbol: "APT", name: "Aptos", image: "https://assets.coingecko.com/coins/images/26455/small/aptos_round.png" },
  arbitrum: { symbol: "ARB", name: "Arbitrum", image: "https://assets.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg" },
  optimism: { symbol: "OP", name: "Optimism", image: "https://assets.coingecko.com/coins/images/25244/small/Optimism.png" },
  "render-token": { symbol: "RNDR", name: "Render", image: "https://assets.coingecko.com/coins/images/11636/small/rndr.png" },
  pepe: { symbol: "PEPE", name: "Pepe", image: "https://assets.coingecko.com/coins/images/29850/small/pepe-token.jpeg" },
  "shiba-inu": { symbol: "SHIB", name: "Shiba Inu", image: "https://assets.coingecko.com/coins/images/11939/small/shiba.png" },
  "polygon-ecosystem-token": { symbol: "POL", name: "Polygon", image: "https://assets.coingecko.com/coins/images/4713/small/polygon.png" },
  cosmos: { symbol: "ATOM", name: "Cosmos", image: "https://assets.coingecko.com/coins/images/1481/small/cosmos_hub.png" },
  filecoin: { symbol: "FIL", name: "Filecoin", image: "https://assets.coingecko.com/coins/images/12817/small/filecoin.png" },
  "immutable-x": { symbol: "IMX", name: "Immutable", image: "https://assets.coingecko.com/coins/images/17233/small/immutableX-symbol-BLK-RGB.png" },
  "injective-protocol": { symbol: "INJ", name: "Injective", image: "https://assets.coingecko.com/coins/images/12882/small/Secondary_Symbol.png" },
  "the-graph": { symbol: "GRT", name: "The Graph", image: "https://assets.coingecko.com/coins/images/13397/small/Graph_Token.png" },
  aave: { symbol: "AAVE", name: "Aave", image: "https://assets.coingecko.com/coins/images/12645/small/AAVE.png" },
  algorand: { symbol: "ALGO", name: "Algorand", image: "https://assets.coingecko.com/coins/images/4380/small/download.png" },
  fantom: { symbol: "FTM", name: "Fantom", image: "https://assets.coingecko.com/coins/images/4001/small/Fantom_round.png" },
  vechain: { symbol: "VET", name: "VeChain", image: "https://assets.coingecko.com/coins/images/1167/small/VeChain-Logo-768x725.png" },
  "theta-token": { symbol: "THETA", name: "Theta", image: "https://assets.coingecko.com/coins/images/2538/small/theta-token-logo.png" },
  eos: { symbol: "EOS", name: "EOS", image: "https://assets.coingecko.com/coins/images/738/small/eos-eos-logo.png" },
  maker: { symbol: "MKR", name: "Maker", image: "https://assets.coingecko.com/coins/images/1364/small/Mark_Maker.png" },
  monero: { symbol: "XMR", name: "Monero", image: "https://assets.coingecko.com/coins/images/69/small/monero_logo.png" },
  "hedera-hashgraph": { symbol: "HBAR", name: "Hedera", image: "https://assets.coingecko.com/coins/images/3688/small/hbar.png" },
  "the-sandbox": { symbol: "SAND", name: "The Sandbox", image: "https://assets.coingecko.com/coins/images/12129/small/sandbox_logo.jpg" },
  decentraland: { symbol: "MANA", name: "Decentraland", image: "https://assets.coingecko.com/coins/images/878/small/decentraland-mana.png" },
  "axie-infinity": { symbol: "AXS", name: "Axie Infinity", image: "https://assets.coingecko.com/coins/images/13029/small/axie_infinity_logo.png" },
};

type SortField = "spread" | "volume" | "name" | "exchanges";
type QuickFilter = "all" | "high" | "medium" | "low";

function formatUsd(value: number): string {
  if (value >= 1000) return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (value >= 1) return `$${value.toFixed(4)}`;
  return `$${value.toFixed(6)}`;
}

function formatVolume(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function getSpreadColor(pct: number): string {
  if (pct >= 2) return "text-green-400";
  if (pct >= 1) return "text-emerald-400";
  if (pct >= 0.5) return "text-yellow-400";
  if (pct >= 0.2) return "text-orange-400";
  return "text-muted-foreground";
}

function getSpreadLabel(pct: number): { text: string; color: string; bg: string } {
  if (pct >= 2) return { text: "Excellent", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" };
  if (pct >= 1) return { text: "Strong", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" };
  if (pct >= 0.5) return { text: "Moderate", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" };
  if (pct >= 0.2) return { text: "Low", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" };
  return { text: "Minimal", color: "text-muted-foreground", bg: "bg-muted/10 border-border" };
}

function SpreadBar({ spread, maxSpread }: { spread: number; maxSpread: number }) {
  const pct = Math.min((spread / Math.max(maxSpread, 0.01)) * 100, 100);
  const color = spread >= 2 ? "bg-green-400" : spread >= 1 ? "bg-emerald-400" : spread >= 0.5 ? "bg-yellow-400" : spread >= 0.2 ? "bg-orange-400" : "bg-muted-foreground/40";
  return (
    <div className="w-full h-1.5 bg-muted/20 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function TrustBadge({ score }: { score: string | null }) {
  if (score === "green") return <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-400 border-green-500/20">Trusted</Badge>;
  if (score === "yellow") return <Badge variant="outline" className="text-[10px] bg-yellow-500/10 text-yellow-400 border-yellow-500/20">Caution</Badge>;
  return null;
}

function ProfitCalculator({ spread }: { spread: number }) {
  const [amount, setAmount] = useState("1000");
  const numAmount = parseFloat(amount) || 0;
  const grossProfit = (numAmount * spread) / 100;
  const estFees = numAmount * 0.004;
  const netProfit = grossProfit - estFees;

  return (
    <div className="bg-card/50 border border-border rounded-lg p-3 mt-3">
      <div className="flex items-center gap-2 mb-2">
        <Calculator className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-medium text-foreground">Profit Estimator</span>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-muted-foreground">$</span>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-24 bg-background/50 border border-border rounded px-2 py-1 text-sm font-mono text-foreground focus:outline-none focus:border-primary"
          placeholder="1000"
          data-testid="input-profit-amount"
        />
        <span className="text-xs text-muted-foreground">investment</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-xs text-muted-foreground">Gross</div>
          <div className="text-sm font-mono text-green-400">${grossProfit.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Est. Fees</div>
          <div className="text-sm font-mono text-red-400">-${estFees.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Net</div>
          <div className={`text-sm font-mono font-bold ${netProfit > 0 ? "text-green-400" : "text-red-400"}`}>
            ${netProfit.toFixed(2)}
          </div>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
        <Info className="w-2.5 h-2.5" />
        Fees estimated at ~0.4% (trading + withdrawal). Actual fees vary by exchange.
      </p>
    </div>
  );
}

function ExchangeRow({ ex, rank, lowestPrice, highestPrice }: { ex: any; rank: number; lowestPrice: number; highestPrice: number }) {
  const range = highestPrice - lowestPrice;
  const position = range > 0 ? ((ex.price - lowestPrice) / range) * 100 : 50;
  const posColor = position < 30 ? "text-green-400" : position > 70 ? "text-orange-400" : "text-foreground";

  return (
    <div className="flex items-center justify-between py-2.5 px-3 hover:bg-muted/20 transition-colors rounded-lg group" data-testid={`exchange-row-${rank}`}>
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span className="text-xs text-muted-foreground w-5 text-right shrink-0">{rank}</span>
        {ex.exchangeLogo ? (
          <img src={ex.exchangeLogo} alt={ex.exchange} className="w-5 h-5 rounded-full shrink-0" />
        ) : (
          <div className="w-5 h-5 rounded-full bg-muted/30 shrink-0" />
        )}
        <span className="text-sm text-foreground truncate">{ex.exchange}</span>
        <TrustBadge score={ex.trustScore} />
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <span className={`text-sm font-mono ${posColor}`}>{formatUsd(ex.price)}</span>
        <span className="text-xs text-muted-foreground hidden md:block w-20 text-right">{formatVolume(ex.volume)}</span>
        {ex.spread != null && (
          <span className="text-xs text-muted-foreground hidden md:block w-16 text-right">{ex.spread.toFixed(2)}%</span>
        )}
        {ex.tradeUrl && (
          <a
            href={ex.tradeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary transition-colors opacity-60 group-hover:opacity-100"
            data-testid={`link-trade-${rank}`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="glass-panel rounded-xl p-5 animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted/30" />
              <div>
                <div className="h-5 w-16 bg-muted/30 rounded mb-1" />
                <div className="h-3 w-24 bg-muted/20 rounded" />
              </div>
            </div>
            <div className="text-right">
              <div className="h-6 w-16 bg-muted/30 rounded mb-1" />
              <div className="h-3 w-12 bg-muted/20 rounded" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="h-24 bg-muted/10 rounded-lg" />
            <div className="flex items-center justify-center"><div className="w-8 h-8 rounded-full bg-muted/20" /></div>
            <div className="h-24 bg-muted/10 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

function CoinSelector({ selectedExtra, onToggle, availableCoins }: {
  selectedExtra: string[];
  onToggle: (id: string) => void;
  availableCoins: { id: string; symbol: string; name: string }[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="glass-panel rounded-xl p-4 mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left"
        data-testid="button-toggle-coin-selector"
      >
        <div className="flex items-center gap-2">
          <Plus className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Add More Coins</span>
          {selectedExtra.length > 0 && (
            <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
              {selectedExtra.length} added
            </Badge>
          )}
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {isOpen && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground mb-3">
            The top 20 coins are scanned by default. Select additional coins below to include in the scan.
          </p>
          <div className="flex flex-wrap gap-2">
            {availableCoins.map((coin) => {
              const isSelected = selectedExtra.includes(coin.id);
              const meta = COIN_META[coin.id];
              return (
                <button
                  key={coin.id}
                  onClick={() => onToggle(coin.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all ${
                    isSelected
                      ? "bg-primary/10 border-primary/30 text-primary"
                      : "bg-card/50 border-border text-muted-foreground hover:border-primary/20 hover:text-foreground"
                  }`}
                  data-testid={`button-coin-${coin.id}`}
                >
                  {meta?.image && <img src={meta.image} alt="" className="w-3.5 h-3.5 rounded-full" />}
                  <span>{coin.symbol}</span>
                  {isSelected && <X className="w-3 h-3" />}
                </button>
              );
            })}
          </div>
          {selectedExtra.length > 0 && (
            <p className="text-[10px] text-primary mt-2 flex items-center gap-1">
              <Info className="w-3 h-3" />
              Adding coins increases scan time. Results update automatically.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ArbitrageCard({ opp, index, maxSpread }: { opp: any; index: number; maxSpread: number }) {
  const [expanded, setExpanded] = useState(false);
  const [showCalc, setShowCalc] = useState(false);
  const meta = COIN_META[opp.coinId] || { symbol: opp.coinId.toUpperCase(), name: opp.coinId, image: "" };
  const profit1k = (1000 * opp.spreadPct) / 100;
  const spreadInfo = getSpreadLabel(opp.spreadPct);

  return (
    <div
      className={`glass-panel rounded-xl overflow-hidden transition-all hover:border-primary/20 ${opp.spreadPct >= 1 ? "border-primary/20" : "border-border"}`}
      data-testid={`card-arbitrage-${opp.coinId}`}
    >
      <div className="p-4 md:p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              {meta.image && <img src={meta.image} alt={meta.name} className="w-10 h-10 rounded-full" />}
              <span className="absolute -top-1 -right-1 text-[10px] bg-card border border-border rounded-full w-5 h-5 flex items-center justify-center text-muted-foreground font-bold">
                {index + 1}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                {meta.symbol}
                <Badge variant="outline" className={`text-[10px] ${spreadInfo.color} ${spreadInfo.bg} border`}>
                  {spreadInfo.text}
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground">{meta.name}</p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-xl font-bold ${getSpreadColor(opp.spreadPct)}`} style={{ fontFamily: "'Orbitron', sans-serif" }} data-testid={`text-spread-${opp.coinId}`}>
              {opp.spreadPct.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">spread</p>
          </div>
        </div>

        <SpreadBar spread={opp.spreadPct} maxSpread={maxSpread} />

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-center mt-4 mb-4">
          <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] text-green-400 uppercase tracking-widest font-medium">Buy Low</span>
            </div>
            <div className="flex items-center gap-2">
              {opp.lowestExchangeLogo && <img src={opp.lowestExchangeLogo} alt="" className="w-4 h-4 rounded-full" />}
              <span className="text-sm text-foreground font-medium truncate">{opp.lowestExchange}</span>
            </div>
            <div className="text-lg font-mono font-bold text-green-400 mt-1">{formatUsd(opp.lowestPrice)}</div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] text-muted-foreground">Vol: {formatVolume(opp.lowestVolume)}</span>
              {opp.lowestTradeUrl && (
                <a href={opp.lowestTradeUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-green-400 hover:text-green-300 flex items-center gap-0.5" data-testid={`link-buy-${opp.coinId}`}>
                  Trade <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
              <ArrowRight className="w-4 h-4 text-primary" />
            </div>
            <span className="text-[10px] font-mono text-primary font-bold">${profit1k.toFixed(2)}</span>
            <span className="text-[9px] text-muted-foreground">per $1K</span>
          </div>

          <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
              <span className="text-[10px] text-orange-400 uppercase tracking-widest font-medium">Sell High</span>
            </div>
            <div className="flex items-center gap-2">
              {opp.highestExchangeLogo && <img src={opp.highestExchangeLogo} alt="" className="w-4 h-4 rounded-full" />}
              <span className="text-sm text-foreground font-medium truncate">{opp.highestExchange}</span>
            </div>
            <div className="text-lg font-mono font-bold text-orange-400 mt-1">{formatUsd(opp.highestPrice)}</div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] text-muted-foreground">Vol: {formatVolume(opp.highestVolume)}</span>
              {opp.highestTradeUrl && (
                <a href={opp.highestTradeUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-orange-400 hover:text-orange-300 flex items-center gap-0.5" data-testid={`link-sell-${opp.coinId}`}>
                  Trade <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <BarChart3 className="w-3 h-3" />
              {opp.exchangeCount} exchanges
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              ~${profit1k.toFixed(2)} per $1K
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCalc(!showCalc)}
              className={`flex items-center gap-1 text-xs transition-colors px-2 py-1 rounded ${showCalc ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"}`}
              data-testid={`button-calc-${opp.coinId}`}
            >
              <Calculator className="w-3 h-3" />
              Calc
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded hover:bg-primary/5"
              data-testid={`button-expand-${opp.coinId}`}
            >
              {expanded ? "Hide prices" : "All prices"}
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {showCalc && <ProfitCalculator spread={opp.spreadPct} />}
      </div>

      {expanded && opp.allExchanges?.length > 0 && (
        <div className="border-t border-border bg-card/30 px-2 py-2">
          <div className="flex items-center justify-between px-3 py-1.5 mb-1">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Exchange</span>
            <div className="flex items-center gap-4 text-[10px] text-muted-foreground uppercase tracking-widest">
              <span>Price</span>
              <span className="hidden md:block w-20 text-right">Volume</span>
              <span className="hidden md:block w-16 text-right">Bid/Ask</span>
              <span className="w-4" />
            </div>
          </div>
          {opp.allExchanges
            .sort((a: any, b: any) => a.price - b.price)
            .map((ex: any, i: number) => (
              <ExchangeRow key={`${ex.exchange}-${i}`} ex={ex} rank={i + 1} lowestPrice={opp.lowestPrice} highestPrice={opp.highestPrice} />
            ))}
        </div>
      )}
    </div>
  );
}

function CountdownTimer({ timestamp, interval }: { timestamp: number; interval: number }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const update = () => {
      const elapsed = Date.now() - timestamp;
      const left = Math.max(0, interval - elapsed);
      setRemaining(Math.ceil(left / 1000));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [timestamp, interval]);

  if (remaining <= 0) return null;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
      <Clock className="w-3 h-3" />
      Next refresh in {mins > 0 ? `${mins}m ` : ""}{secs}s
    </span>
  );
}

export default function ArbitragePage() {
  const [sortField, setSortField] = useState<SortField>("spread");
  const [searchTerm, setSearchTerm] = useState("");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [selectedExtra, setSelectedExtra] = useState<string[]>([]);

  const extraCoinsQuery = useQuery({
    queryKey: ["arbitrage-extra-coins"],
    queryFn: async () => {
      const res = await fetch("/api/arbitrage/extra-coins");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 600000,
  });

  const extraParam = selectedExtra.length > 0 ? `?extra=${selectedExtra.join(",")}` : "";

  const arbQuery = useQuery({
    queryKey: ["arbitrage-data", selectedExtra.join(",")],
    queryFn: async () => {
      const res = await fetch(`/api/arbitrage${extraParam}`);
      if (!res.ok) throw new Error("Failed to fetch arbitrage data");
      const data = await res.json();
      if (data?.error) throw new Error(data.error);
      return data;
    },
    staleTime: 60000,
    refetchInterval: 120000,
    retry: 2,
    retryDelay: 5000,
    placeholderData: keepPreviousData,
  });

  const handleToggleExtra = useCallback((id: string) => {
    setSelectedExtra(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  }, []);

  const opportunities = arbQuery.data?.opportunities || [];
  const dataTimestamp = arbQuery.data?.timestamp;

  const maxSpread = useMemo(() =>
    opportunities.reduce((max: number, o: any) => Math.max(max, o.spreadPct), 0),
    [opportunities]
  );

  const filteredAndSorted = useMemo(() => {
    let filtered = opportunities;

    if (quickFilter === "high") filtered = filtered.filter((o: any) => o.spreadPct >= 1);
    else if (quickFilter === "medium") filtered = filtered.filter((o: any) => o.spreadPct >= 0.3 && o.spreadPct < 1);
    else if (quickFilter === "low") filtered = filtered.filter((o: any) => o.spreadPct < 0.3);

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((o: any) => {
        const meta = COIN_META[o.coinId];
        return (
          o.coinId.includes(term) ||
          meta?.symbol.toLowerCase().includes(term) ||
          meta?.name.toLowerCase().includes(term) ||
          o.lowestExchange.toLowerCase().includes(term) ||
          o.highestExchange.toLowerCase().includes(term)
        );
      });
    }

    return [...filtered].sort((a: any, b: any) => {
      if (sortField === "spread") return b.spreadPct - a.spreadPct;
      if (sortField === "volume") return (b.lowestVolume + b.highestVolume) - (a.lowestVolume + a.highestVolume);
      if (sortField === "exchanges") return b.exchangeCount - a.exchangeCount;
      const nameA = COIN_META[a.coinId]?.name || a.coinId;
      const nameB = COIN_META[b.coinId]?.name || b.coinId;
      return nameA.localeCompare(nameB);
    });
  }, [opportunities, sortField, searchTerm, quickFilter]);

  const avgSpread = opportunities.length > 0
    ? opportunities.reduce((sum: number, o: any) => sum + o.spreadPct, 0) / opportunities.length
    : 0;
  const highOpps = opportunities.filter((o: any) => o.spreadPct >= 1).length;
  const medOpps = opportunities.filter((o: any) => o.spreadPct >= 0.3 && o.spreadPct < 1).length;
  const totalExchanges = new Set(
    opportunities.flatMap((o: any) => (o.allExchanges || []).map((e: any) => e.exchange))
  ).size;
  const bestOpp = opportunities.length > 0 ? opportunities.reduce((best: any, o: any) => o.spreadPct > best.spreadPct ? o : best, opportunities[0]) : null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <AdBanner slot="0123456789" format="horizontal" className="w-full mb-4" />

        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h1
              className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
              data-testid="heading-arbitrage"
            >
              <TrendingUp className="w-8 h-8 text-primary" />
              Crypto Arbitrage Scanner
            </h1>
            <SocialShareButton
              url={typeof window !== "undefined" ? window.location.href : ""}
              title="Crypto Arbitrage Scanner - Find the Best Price Differences"
              description="Real-time crypto arbitrage opportunities across exchanges."
            />
          </div>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Real-time price comparison across {totalExchanges}+ exchanges. Find where to buy low and sell high — updated every 2 minutes.
          </p>
          {dataTimestamp && (
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <RefreshCw className={`w-3 h-3 ${arbQuery.isFetching ? "animate-spin text-primary" : ""}`} />
                Updated {new Date(dataTimestamp).toLocaleTimeString()}
              </span>
              <CountdownTimer timestamp={dataTimestamp} interval={120000} />
            </div>
          )}
        </div>

        <div className="glass-panel rounded-xl p-4 mb-6 flex items-start gap-3" data-testid="arbitrage-disclaimer">
          <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground leading-relaxed">
            <span className="text-yellow-400 font-medium">Important:</span> Spreads shown are real-time but don't include withdrawal fees, network fees, or transfer delays. A 0.5% spread may not be profitable after fees. Always verify prices on the exchange before trading. This is informational only, not financial advice.
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div className="glass-panel rounded-xl p-3 text-center" data-testid="stat-total-coins">
            <div className="text-xl font-bold text-foreground" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              {opportunities.length}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Coins</div>
          </div>
          <div className="glass-panel rounded-xl p-3 text-center" data-testid="stat-high-opps">
            <div className="text-xl font-bold text-green-400" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              {highOpps}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Strong (1%+)</div>
          </div>
          <div className="glass-panel rounded-xl p-3 text-center" data-testid="stat-med-opps">
            <div className="text-xl font-bold text-yellow-400" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              {medOpps}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Moderate</div>
          </div>
          <div className="glass-panel rounded-xl p-3 text-center" data-testid="stat-avg-spread">
            <div className="text-xl font-bold text-primary" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              {avgSpread.toFixed(2)}%
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Avg Spread</div>
          </div>
          <div className="glass-panel rounded-xl p-3 text-center col-span-2 md:col-span-1" data-testid="stat-exchanges">
            <div className="text-xl font-bold text-foreground" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              {totalExchanges}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Exchanges</div>
          </div>
        </div>

        {bestOpp && (
          <div className="glass-panel rounded-xl p-4 mb-6 border-primary/20 bg-primary/5" data-testid="best-opportunity">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-primary uppercase tracking-widest">Best Opportunity Right Now</span>
            </div>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                {COIN_META[bestOpp.coinId]?.image && (
                  <img src={COIN_META[bestOpp.coinId].image} alt="" className="w-8 h-8 rounded-full" />
                )}
                <div>
                  <span className="text-lg font-bold text-foreground" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                    {COIN_META[bestOpp.coinId]?.symbol || bestOpp.coinId}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">{COIN_META[bestOpp.coinId]?.name}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className={`text-2xl font-bold ${getSpreadColor(bestOpp.spreadPct)}`} style={{ fontFamily: "'Orbitron', sans-serif" }}>
                    {bestOpp.spreadPct.toFixed(2)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ~${((1000 * bestOpp.spreadPct) / 100).toFixed(2)} profit per $1K
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="text-green-400">{bestOpp.lowestExchange}</span>
                  <ArrowRight className="w-3 h-3 text-primary" />
                  <span className="text-orange-400">{bestOpp.highestExchange}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <CoinSelector
          selectedExtra={selectedExtra}
          onToggle={handleToggleExtra}
          availableCoins={extraCoinsQuery.data || []}
        />

        <div className="flex flex-col gap-3 mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by coin, symbol, or exchange..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-card/50 border border-border rounded-lg pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
                data-testid="input-search-arbitrage"
              />
            </div>
            <button
              onClick={() => arbQuery.refetch()}
              disabled={arbQuery.isFetching}
              className="px-4 py-2.5 text-xs rounded-lg border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-all disabled:opacity-50 flex items-center gap-1.5 justify-center font-medium"
              data-testid="button-refresh-arbitrage"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${arbQuery.isFetching ? "animate-spin" : ""}`} />
              {arbQuery.isFetching ? "Scanning..." : "Refresh"}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 mr-2">
              <Filter className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Filter:</span>
            </div>
            {([
              { key: "all", label: "All", icon: null },
              { key: "high", label: "Strong (1%+)", icon: <Zap className="w-3 h-3" /> },
              { key: "medium", label: "Moderate", icon: null },
              { key: "low", label: "Low (<0.3%)", icon: null },
            ] as { key: QuickFilter; label: string; icon: any }[]).map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setQuickFilter(key)}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-all flex items-center gap-1 ${
                  quickFilter === key
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-card/50 border-border text-muted-foreground hover:border-primary/20 hover:text-foreground"
                }`}
                data-testid={`button-filter-${key}`}
              >
                {icon}
                {label}
              </button>
            ))}

            <div className="border-l border-border h-4 mx-1" />

            <div className="flex items-center gap-1 mr-1">
              <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Sort:</span>
            </div>
            {(["spread", "volume", "exchanges", "name"] as SortField[]).map((field) => (
              <button
                key={field}
                onClick={() => setSortField(field)}
                className={`px-2.5 py-1.5 text-xs rounded-lg border transition-all ${
                  sortField === field
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-card/50 border-border text-muted-foreground hover:border-primary/20 hover:text-foreground"
                }`}
                data-testid={`button-sort-${field}`}
              >
                {field === "spread" ? "Spread" : field === "volume" ? "Volume" : field === "exchanges" ? "Exchanges" : "Name"}
              </button>
            ))}
          </div>
        </div>

        {arbQuery.isLoading && opportunities.length === 0 ? (
          <div>
            <div className="glass-panel rounded-xl p-8 text-center mb-6">
              <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
              <p className="text-foreground font-medium">Scanning {20 + selectedExtra.length} coins across exchanges...</p>
              <p className="text-xs text-muted-foreground mt-1">This may take 10-20 seconds on first load</p>
              <div className="w-48 h-1.5 bg-muted/20 rounded-full mx-auto mt-4 overflow-hidden">
                <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: "60%" }} />
              </div>
            </div>
            <LoadingSkeleton />
          </div>
        ) : arbQuery.isError && opportunities.length === 0 ? (
          <div className="glass-panel rounded-xl p-12 text-center">
            <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-4" />
            <p className="text-foreground font-medium mb-2">Something went wrong</p>
            <p className="text-sm text-muted-foreground mb-4">We couldn't reach the exchange data. This is usually temporary.</p>
            <button
              onClick={() => arbQuery.refetch()}
              className="px-4 py-2 text-sm bg-primary/10 border border-primary/30 text-primary rounded-lg hover:bg-primary/20 transition-colors"
              data-testid="button-retry"
            >
              Try Again
            </button>
          </div>
        ) : filteredAndSorted.length === 0 ? (
          <div className="glass-panel rounded-xl p-12 text-center">
            <Search className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <p className="text-foreground font-medium mb-1">No matches found</p>
            <p className="text-sm text-muted-foreground">
              {searchTerm ? `No coins or exchanges match "${searchTerm}".` : "No opportunities in this category right now."}
            </p>
            {(searchTerm || quickFilter !== "all") && (
              <button
                onClick={() => { setSearchTerm(""); setQuickFilter("all"); }}
                className="mt-3 text-sm text-primary hover:underline"
                data-testid="button-clear-filters"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="text-xs text-muted-foreground mb-3">
              Showing {filteredAndSorted.length} of {opportunities.length} opportunities
            </div>
            <div className="space-y-4">
              {filteredAndSorted.map((opp: any, i: number) => (
                <ArbitrageCard key={opp.coinId} opp={opp} index={i} maxSpread={maxSpread} />
              ))}
            </div>
          </>
        )}

        <div className="mt-8 glass-panel rounded-xl p-5" data-testid="arbitrage-info">
          <h3 className="text-sm uppercase tracking-widest text-muted-foreground font-medium mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            How Crypto Arbitrage Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-muted-foreground">
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <span className="w-6 h-6 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary text-[10px] font-bold">1</span>
                Spot the Opportunity
              </div>
              <p className="leading-relaxed">Crypto prices vary between exchanges due to different supply, demand, and liquidity. This scanner finds those gaps in real-time across {totalExchanges}+ exchanges.</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <span className="w-6 h-6 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary text-[10px] font-bold">2</span>
                Execute the Trade
              </div>
              <p className="leading-relaxed">Buy the coin on the cheapest exchange, then transfer and sell on the most expensive one. Speed matters — spreads can close quickly.</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <span className="w-6 h-6 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary text-[10px] font-bold">3</span>
                Know the Costs
              </div>
              <p className="leading-relaxed">Factor in trading fees (0.1-0.5%), withdrawal fees, and network gas. The spread must exceed all costs to profit. Use our calculator on each card to estimate.</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex flex-wrap items-center gap-4 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-400" /> Strong: 1%+ spread</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-400" /> Moderate: 0.3-1%</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-400" /> Low: 0.2-0.3%</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-muted-foreground/40" /> Minimal: under 0.2%</span>
            </div>
          </div>
        </div>

        <AdBanner slot="0123456789" format="horizontal" className="w-full mt-6" />
      </div>
      <Footer />
    </div>
  );
}
