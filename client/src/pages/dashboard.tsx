import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Wallet,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  LineChart,
  Search,
  Bell,
  Settings,
  ArrowDownUp,
  Settings2,
  Info,
  Fuel,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  ChevronDown,
  Globe,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

const CHAIN_OPTIONS = [
  { name: "ethereum", id: 1, symbol: "ETH", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { name: "bsc", id: 56, symbol: "BNB", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  { name: "polygon", id: 137, symbol: "MATIC", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  { name: "arbitrum", id: 42161, symbol: "ETH", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
  { name: "optimism", id: 10, symbol: "ETH", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  { name: "base", id: 8453, symbol: "ETH", color: "bg-blue-400/20 text-blue-300 border-blue-400/30" },
  { name: "avalanche", id: 43114, symbol: "AVAX", color: "bg-red-600/20 text-red-400 border-red-600/30" },
];

function formatWei(wei: string, decimals: number = 18): string {
  if (!wei || wei === "0") return "0";
  const num = parseFloat(wei) / Math.pow(10, decimals);
  if (num < 0.0001) return "< 0.0001";
  return num.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

function formatAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function timeAgo(timestamp: string): string {
  const seconds = Math.floor(Date.now() / 1000 - parseInt(timestamp));
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export default function Dashboard() {
  const [walletInput, setWalletInput] = useState("");
  const [trackedAddress, setTrackedAddress] = useState("");
  const [selectedChainId, setSelectedChainId] = useState(1);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [showChainSelector, setShowChainSelector] = useState(false);
  const { toast } = useToast();

  const selectedChain = CHAIN_OPTIONS.find((c) => c.id === selectedChainId) || CHAIN_OPTIONS[0];

  const handleSearch = useCallback(() => {
    const address = walletInput.trim();
    if (!isValidAddress(address)) {
      toast({
        title: "Invalid address",
        description: "Please enter a valid Ethereum address (0x...)",
        variant: "destructive",
      });
      return;
    }
    setTrackedAddress(address);
  }, [walletInput, toast]);

  const handleCopyAddress = useCallback(() => {
    if (trackedAddress) {
      navigator.clipboard.writeText(trackedAddress);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  }, [trackedAddress]);

  const ethPriceQuery = useQuery({
    queryKey: ["/api/eth-price"],
    refetchInterval: 30000,
    staleTime: 15000,
  });

  const balanceQuery = useQuery({
    queryKey: ["/api/balance", trackedAddress, selectedChainId],
    queryFn: async () => {
      if (!trackedAddress) return null;
      const res = await fetch(`/api/balance/${trackedAddress}?chainId=${selectedChainId}`);
      if (!res.ok) throw new Error("Failed to fetch balance");
      return res.json();
    },
    enabled: !!trackedAddress,
    refetchInterval: 30000,
  });

  const txQuery = useQuery({
    queryKey: ["/api/transactions", trackedAddress, selectedChainId],
    queryFn: async () => {
      if (!trackedAddress) return null;
      const res = await fetch(`/api/transactions/${trackedAddress}?chainId=${selectedChainId}`);
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return res.json();
    },
    enabled: !!trackedAddress,
    refetchInterval: 60000,
  });

  const tokenTxQuery = useQuery({
    queryKey: ["/api/token-transfers", trackedAddress, selectedChainId],
    queryFn: async () => {
      if (!trackedAddress) return null;
      const res = await fetch(`/api/token-transfers/${trackedAddress}?chainId=${selectedChainId}`);
      if (!res.ok) throw new Error("Failed to fetch token transfers");
      return res.json();
    },
    enabled: !!trackedAddress,
    refetchInterval: 60000,
  });

  const gasQuery = useQuery({
    queryKey: ["/api/gas", selectedChainId],
    queryFn: async () => {
      const res = await fetch(`/api/gas?chainId=${selectedChainId}`);
      if (!res.ok) throw new Error("Failed to fetch gas");
      return res.json();
    },
    refetchInterval: 15000,
    staleTime: 10000,
  });

  const ethPrice = ethPriceQuery.data?.result?.ethusd
    ? parseFloat(ethPriceQuery.data.result.ethusd)
    : 0;

  const nativeBalance = balanceQuery.data?.result
    ? parseFloat(balanceQuery.data.result) / 1e18
    : 0;

  const nativeValueUsd = nativeBalance * ethPrice;

  const transactions = txQuery.data?.result && Array.isArray(txQuery.data.result)
    ? txQuery.data.result.slice(0, 15)
    : [];

  const tokenTransfers = tokenTxQuery.data?.result && Array.isArray(tokenTxQuery.data.result)
    ? tokenTxQuery.data.result.slice(0, 15)
    : [];

  const gasData = gasQuery.data?.result;

  const uniqueTokens = new Map<string, { name: string; symbol: string; decimals: number; contract: string }>();
  if (tokenTxQuery.data?.result && Array.isArray(tokenTxQuery.data.result)) {
    for (const tx of tokenTxQuery.data.result) {
      if (!uniqueTokens.has(tx.contractAddress)) {
        uniqueTokens.set(tx.contractAddress, {
          name: tx.tokenName,
          symbol: tx.tokenSymbol,
          decimals: parseInt(tx.tokenDecimal),
          contract: tx.contractAddress,
        });
      }
    }
  }

  const isLoading = balanceQuery.isLoading || txQuery.isLoading;

  const getExplorerUrl = (hash: string) => {
    const explorers: Record<number, string> = {
      1: "https://etherscan.io",
      56: "https://bscscan.com",
      137: "https://polygonscan.com",
      42161: "https://arbiscan.io",
      10: "https://optimistic.etherscan.io",
      8453: "https://basescan.org",
      43114: "https://snowtrace.io",
    };
    const base = explorers[selectedChainId] || "https://etherscan.io";
    return `${base}/tx/${hash}`;
  };

  const getAddressExplorerUrl = (address: string) => {
    const explorers: Record<number, string> = {
      1: "https://etherscan.io",
      56: "https://bscscan.com",
      137: "https://polygonscan.com",
      42161: "https://arbiscan.io",
      10: "https://optimistic.etherscan.io",
      8453: "https://basescan.org",
      43114: "https://snowtrace.io",
    };
    const base = explorers[selectedChainId] || "https://etherscan.io";
    return `${base}/address/${address}`;
  };

  return (
    <div className="min-h-screen pb-20 bg-[#060a10]">
      <div
        className="h-72 w-full absolute top-0 left-0 z-0 opacity-30"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(0,200,255,0.15) 0%, transparent 70%)",
        }}
      />

      <nav className="relative z-10 glass-panel border-b border-white/5 sticky top-0 px-4 md:px-6 py-3 flex items-center justify-between backdrop-blur-xl bg-[#060a10]/80" data-testid="navbar">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg md:text-xl tracking-wider text-white" data-testid="text-app-name">TokenAltcoin</span>
        </div>

        <div className="flex-1 max-w-lg mx-4 md:mx-8 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={walletInput}
            onChange={(e) => setWalletInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-full bg-white/5 border-white/10 pl-10 pr-20 font-mono text-xs md:text-sm focus:border-primary/50 h-10"
            placeholder="Enter wallet address (0x...)"
            data-testid="input-wallet-address"
          />
          <Button
            size="sm"
            onClick={handleSearch}
            className="absolute right-1 top-1/2 -translate-y-1/2 bg-primary/80 hover:bg-primary text-primary-foreground h-8 px-3 text-xs"
            data-testid="button-search"
          >
            Track
          </Button>
        </div>

        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowChainSelector(!showChainSelector)}
            className="bg-white/5 border-white/10 text-white h-10 px-3 gap-2"
            data-testid="button-chain-selector"
          >
            <Globe className="w-4 h-4 text-primary" />
            <span className="hidden md:inline capitalize">{selectedChain.name}</span>
            <ChevronDown className="w-3 h-3" />
          </Button>
          {showChainSelector && (
            <div className="absolute right-0 top-12 bg-[#0d1117] border border-white/10 rounded-xl p-2 min-w-[180px] z-50 shadow-2xl" data-testid="dropdown-chains">
              {CHAIN_OPTIONS.map((chain) => (
                <button
                  key={chain.id}
                  onClick={() => {
                    setSelectedChainId(chain.id);
                    setShowChainSelector(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                    chain.id === selectedChainId
                      ? "bg-primary/20 text-primary"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                  data-testid={`button-chain-${chain.name}`}
                >
                  <span className="capitalize font-medium">{chain.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{chain.symbol}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 pt-8 md:pt-12 gap-6 md:gap-8 grid grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6 md:space-y-8">

          {!trackedAddress ? (
            <div className="glass-panel p-12 rounded-2xl text-center animate-in fade-in duration-700">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
                <Search className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-display font-bold text-white mb-3" data-testid="text-welcome-title">Track Any Wallet</h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                Enter any Ethereum address above to view real-time balances, transactions, and token activity across multiple chains.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {["Ethereum", "BSC", "Arbitrum", "Base", "Polygon"].map((chain) => (
                  <Badge key={chain} variant="outline" className="bg-white/5 border-white/10 text-muted-foreground">
                    {chain}
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="glass-panel p-6 md:p-8 rounded-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h2 className="text-muted-foreground font-medium uppercase tracking-widest text-xs mb-1">
                      Wallet Balance
                      <Badge variant="outline" className={`ml-2 text-[10px] ${selectedChain.color}`}>
                        {selectedChain.name}
                      </Badge>
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-xs text-muted-foreground" data-testid="text-tracked-address">
                        {formatAddress(trackedAddress)}
                      </span>
                      <button onClick={handleCopyAddress} className="text-muted-foreground hover:text-white transition-colors" data-testid="button-copy-address">
                        {copiedAddress ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                      <a
                        href={getAddressExplorerUrl(trackedAddress)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors"
                        data-testid="link-explorer"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      balanceQuery.refetch();
                      txQuery.refetch();
                      tokenTxQuery.refetch();
                    }}
                    className="h-8 w-8 text-muted-foreground hover:text-white"
                    data-testid="button-refresh"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                  </Button>
                </div>

                {isLoading ? (
                  <div className="flex items-center gap-3 mt-4">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="text-muted-foreground">Loading wallet data...</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-baseline gap-3 mt-4">
                      <span className="text-3xl md:text-5xl font-bold font-display tracking-tight text-white" data-testid="text-native-balance">
                        {nativeBalance.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                      </span>
                      <span className="text-lg text-muted-foreground font-medium">{selectedChain.symbol}</span>
                    </div>
                    {ethPrice > 0 && selectedChainId === 1 && (
                      <div className="text-muted-foreground font-mono mt-1" data-testid="text-usd-value">
                        ≈ ${nativeValueUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })} USD
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="glass-panel rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-500 delay-150">
                <Tabs defaultValue="transactions" className="w-full">
                  <div className="px-4 md:px-6 pt-4 border-b border-white/5 bg-black/20">
                    <TabsList className="bg-transparent gap-4 h-auto p-0">
                      <TabsTrigger
                        value="transactions"
                        className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 px-1 text-muted-foreground"
                        data-testid="tab-transactions"
                      >
                        <Activity className="w-4 h-4 mr-2" /> Transactions
                      </TabsTrigger>
                      <TabsTrigger
                        value="tokens"
                        className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 px-1 text-muted-foreground"
                        data-testid="tab-tokens"
                      >
                        <Wallet className="w-4 h-4 mr-2" /> Token Transfers
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="transactions" className="m-0">
                    {txQuery.isLoading ? (
                      <div className="p-8 text-center text-muted-foreground">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                        Loading transactions...
                      </div>
                    ) : transactions.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        No transactions found on {selectedChain.name}
                      </div>
                    ) : (
                      <div className="divide-y divide-white/5">
                        {transactions.map((tx: any, i: number) => {
                          const isIncoming = tx.to?.toLowerCase() === trackedAddress.toLowerCase();
                          const valueEth = parseFloat(tx.value) / 1e18;
                          const isError = tx.isError === "1";
                          return (
                            <div
                              key={i}
                              className="flex items-center justify-between p-3 md:p-4 hover:bg-white/[0.02] transition-colors group"
                              data-testid={`row-tx-${i}`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                                    isError
                                      ? "bg-red-500/20 text-red-400"
                                      : isIncoming
                                      ? "bg-green-500/20 text-green-400"
                                      : "bg-orange-500/20 text-orange-400"
                                  }`}
                                >
                                  {isIncoming ? (
                                    <ArrowDownRight className="w-4 h-4" />
                                  ) : (
                                    <ArrowUpRight className="w-4 h-4" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-sm font-medium text-white flex items-center gap-2">
                                    {isIncoming ? "Received" : "Sent"}
                                    {isError && (
                                      <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-400 border-red-500/30">
                                        Failed
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground font-mono truncate max-w-[140px]">
                                    {isIncoming ? `From: ${formatAddress(tx.from)}` : `To: ${formatAddress(tx.to)}`}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right flex items-center gap-3">
                                <div>
                                  <div
                                    className={`text-sm font-mono ${
                                      isIncoming ? "text-green-400" : "text-orange-400"
                                    }`}
                                  >
                                    {isIncoming ? "+" : "-"}
                                    {valueEth > 0 ? valueEth.toFixed(4) : "0"} {selectedChain.symbol}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground">{timeAgo(tx.timeStamp)}</div>
                                </div>
                                <a
                                  href={getExplorerUrl(tx.hash)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="tokens" className="m-0">
                    {tokenTxQuery.isLoading ? (
                      <div className="p-8 text-center text-muted-foreground">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                        Loading token transfers...
                      </div>
                    ) : tokenTransfers.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        No token transfers found on {selectedChain.name}
                      </div>
                    ) : (
                      <div className="divide-y divide-white/5">
                        {tokenTransfers.map((tx: any, i: number) => {
                          const isIncoming = tx.to?.toLowerCase() === trackedAddress.toLowerCase();
                          const decimals = parseInt(tx.tokenDecimal) || 18;
                          const value = parseFloat(tx.value) / Math.pow(10, decimals);
                          return (
                            <div
                              key={i}
                              className="flex items-center justify-between p-3 md:p-4 hover:bg-white/[0.02] transition-colors group"
                              data-testid={`row-token-tx-${i}`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                    isIncoming
                                      ? "bg-green-500/20 text-green-400"
                                      : "bg-orange-500/20 text-orange-400"
                                  }`}
                                >
                                  {tx.tokenSymbol?.slice(0, 2) || "?"}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-sm font-medium text-white truncate max-w-[160px]">
                                    {tx.tokenName || "Unknown Token"}
                                  </div>
                                  <div className="text-xs text-muted-foreground font-mono">
                                    {isIncoming ? `From: ${formatAddress(tx.from)}` : `To: ${formatAddress(tx.to)}`}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right flex items-center gap-3">
                                <div>
                                  <div
                                    className={`text-sm font-mono ${
                                      isIncoming ? "text-green-400" : "text-orange-400"
                                    }`}
                                  >
                                    {isIncoming ? "+" : "-"}
                                    {value > 1000000
                                      ? `${(value / 1000000).toFixed(2)}M`
                                      : value > 1000
                                      ? `${(value / 1000).toFixed(2)}K`
                                      : value.toFixed(4)}{" "}
                                    {tx.tokenSymbol}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground">{timeAgo(tx.timeStamp)}</div>
                                </div>
                                <a
                                  href={getExplorerUrl(tx.hash)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
        </div>

        <div className="space-y-6 md:space-y-8">

          {ethPrice > 0 && (
            <Card className="glass-panel border-white/5 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500" data-testid="card-eth-price">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-muted-foreground uppercase tracking-widest font-medium">ETH Price</span>
                  <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px]">Live</Badge>
                </div>
                <div className="text-2xl font-bold font-display text-white" data-testid="text-eth-price">
                  ${ethPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
                {ethPriceQuery.data?.result?.ethbtc && (
                  <div className="text-xs text-muted-foreground font-mono mt-1">
                    {ethPriceQuery.data.result.ethbtc} BTC
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {gasData && (
            <Card className="glass-panel border-white/5 overflow-hidden animate-in fade-in slide-in-from-right-6 duration-500 delay-100" data-testid="card-gas">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-muted-foreground uppercase tracking-widest font-medium flex items-center gap-1.5">
                    <Fuel className="w-3.5 h-3.5" /> Gas Tracker
                  </span>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] capitalize">
                    {selectedChain.name}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 rounded-xl bg-green-500/5 border border-green-500/10">
                    <div className="text-[10px] text-green-400 mb-1 uppercase font-medium">Slow</div>
                    <div className="text-lg font-bold text-white font-mono">{gasData.SafeGasPrice || "—"}</div>
                    <div className="text-[10px] text-muted-foreground">Gwei</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/10">
                    <div className="text-[10px] text-yellow-400 mb-1 uppercase font-medium">Avg</div>
                    <div className="text-lg font-bold text-white font-mono">{gasData.ProposeGasPrice || "—"}</div>
                    <div className="text-[10px] text-muted-foreground">Gwei</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                    <div className="text-[10px] text-red-400 mb-1 uppercase font-medium">Fast</div>
                    <div className="text-lg font-bold text-white font-mono">{gasData.FastGasPrice || "—"}</div>
                    <div className="text-[10px] text-muted-foreground">Gwei</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {trackedAddress && uniqueTokens.size > 0 && (
            <Card className="glass-panel border-white/5 overflow-hidden animate-in fade-in slide-in-from-right-8 duration-500 delay-200" data-testid="card-tokens-found">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Tokens Detected</span>
                  <Badge variant="outline" className="bg-white/5 border-white/10 text-muted-foreground text-[10px]">
                    {uniqueTokens.size}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {Array.from(uniqueTokens.values())
                    .slice(0, 8)
                    .map((token, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors"
                        data-testid={`row-token-${i}`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[9px] font-bold text-white">
                            {token.symbol?.slice(0, 2) || "?"}
                          </div>
                          <div>
                            <div className="text-sm text-white font-medium truncate max-w-[120px]">{token.name}</div>
                            <div className="text-[10px] text-muted-foreground">{token.symbol}</div>
                          </div>
                        </div>
                        <a
                          href={getAddressExplorerUrl(token.contract)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="glass-panel border-primary/20 overflow-hidden relative group animate-in fade-in slide-in-from-right-8 duration-500 delay-300" data-testid="card-pro-upsell">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-60" />
            <CardContent className="p-5 relative z-10">
              <div className="flex items-center justify-between mb-3">
                <Badge className="bg-primary text-primary-foreground text-[10px]">PRO</Badge>
                <LineChart className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-lg font-bold font-display mb-2 text-white">Deep Analytics</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Track PnL, monitor whale wallets, get alerts, and access advanced portfolio analytics.
              </p>
              <Button className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm transition-all group-hover:border-primary/40" data-testid="button-upgrade">
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
