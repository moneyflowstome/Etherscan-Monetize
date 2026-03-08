import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Loader2,
  Wallet,
  ArrowRightLeft,
  Coins,
  Image,
  Server,
  Copy,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Shield,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AdBanner } from "@/components/AdBanner";
import { useToast } from "@/hooks/use-toast";

type Tab = "account" | "transactions" | "tokens" | "nfts";

const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: "account", label: "Account", icon: Wallet },
  { key: "transactions", label: "Transactions", icon: ArrowRightLeft },
  { key: "tokens", label: "Tokens", icon: Coins },
  { key: "nfts", label: "NFTs", icon: Image },
];

function timeAgo(ts: number): string {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function truncateHash(hash: string): string {
  if (!hash || hash.length < 16) return hash || "";
  return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
}

function CopyButton({ text }: { text: string }) {
  const { toast } = useToast();
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copied to clipboard" });
      }}
      className="text-muted-foreground hover:text-primary transition-colors"
      data-testid="button-copy"
    >
      <Copy className="w-3.5 h-3.5" />
    </button>
  );
}

function LedgerStats() {
  const serverQuery = useQuery({
    queryKey: ["/api/xrpl/server"],
    queryFn: async () => {
      const res = await fetch("/api/xrpl/server");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    refetchInterval: 30000,
    staleTime: 15000,
  });

  const info = serverQuery.data;

  if (serverQuery.isLoading) {
    return (
      <div className="glass-panel rounded-xl p-4 animate-pulse">
        <div className="h-4 bg-muted/30 rounded w-32 mb-3" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-muted/20 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!info) return null;

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  return (
    <div className="glass-panel rounded-xl p-5 mb-6 animate-in fade-in duration-500" data-testid="card-ledger-stats">
      <div className="flex items-center gap-2 mb-4">
        <Server className="w-4 h-4 text-primary" />
        <span className="text-xs text-muted-foreground uppercase tracking-widest font-medium">XRP Ledger Network</span>
        <Badge variant="outline" className="ml-auto bg-green-500/10 text-green-400 border-green-500/20 text-[10px]">
          {info.serverState}
        </Badge>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-muted/10 border border-border">
          <div className="text-[10px] text-muted-foreground uppercase mb-1">Validated Ledger</div>
          <div className="text-sm font-mono font-bold text-foreground" data-testid="text-ledger-seq">
            #{info.validatedLedger?.sequence?.toLocaleString()}
          </div>
        </div>
        <div className="p-3 rounded-lg bg-muted/10 border border-border">
          <div className="text-[10px] text-muted-foreground uppercase mb-1">Base Fee</div>
          <div className="text-sm font-mono font-bold text-foreground" data-testid="text-base-fee">
            {info.validatedLedger?.baseFee} XRP
          </div>
        </div>
        <div className="p-3 rounded-lg bg-muted/10 border border-border">
          <div className="text-[10px] text-muted-foreground uppercase mb-1">Reserve (Base)</div>
          <div className="text-sm font-mono font-bold text-foreground" data-testid="text-reserve">
            {info.validatedLedger?.reserveBase} XRP
          </div>
        </div>
        <div className="p-3 rounded-lg bg-muted/10 border border-border">
          <div className="text-[10px] text-muted-foreground uppercase mb-1">Uptime</div>
          <div className="text-sm font-mono font-bold text-foreground" data-testid="text-uptime">
            {formatUptime(info.uptime)}
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountTab({ address }: { address: string }) {
  const query = useQuery({
    queryKey: ["/api/xrpl/account", address],
    queryFn: async () => {
      const res = await fetch(`/api/xrpl/account/${address}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch account");
      }
      return res.json();
    },
    enabled: !!address,
    retry: false,
  });

  if (query.isLoading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
        <div className="text-sm text-muted-foreground">Looking up account...</div>
      </div>
    );
  }

  if (query.error) {
    return (
      <div className="glass-panel rounded-xl p-8 text-center">
        <XCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
        <div className="text-foreground font-medium mb-1">Account Not Found</div>
        <div className="text-sm text-muted-foreground">{(query.error as Error).message}</div>
      </div>
    );
  }

  const data = query.data;
  if (!data) return null;

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <Card className="glass-panel border-border">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Account Info</span>
          </div>
          <div className="grid gap-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">Address</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-foreground break-all" data-testid="text-xrp-address">{data.address}</span>
                <CopyButton text={data.address} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Balance</span>
              <span className="text-2xl font-bold font-display text-foreground" data-testid="text-xrp-balance">
                {parseFloat(data.balance).toLocaleString(undefined, { maximumFractionDigits: 6 })} XRP
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Sequence</span>
              <span className="text-sm font-mono text-foreground" data-testid="text-xrp-sequence">{data.sequence?.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Owner Count</span>
              <span className="text-sm font-mono text-foreground">{data.ownerCount}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="glass-panel border-border">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Reserve Requirements</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-muted/10 border border-border text-center">
              <div className="text-[10px] text-muted-foreground uppercase mb-1">Base</div>
              <div className="text-sm font-bold font-mono text-foreground">{data.reserve.base} XRP</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/10 border border-border text-center">
              <div className="text-[10px] text-muted-foreground uppercase mb-1">Owner</div>
              <div className="text-sm font-bold font-mono text-foreground">{data.reserve.owner} XRP</div>
            </div>
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
              <div className="text-[10px] text-primary uppercase mb-1">Total</div>
              <div className="text-sm font-bold font-mono text-primary">{data.reserve.total} XRP</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TransactionsTab({ address }: { address: string }) {
  const query = useQuery({
    queryKey: ["/api/xrpl/transactions", address],
    queryFn: async () => {
      const res = await fetch(`/api/xrpl/transactions/${address}`);
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return res.json();
    },
    enabled: !!address,
    retry: false,
  });

  if (query.isLoading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
        <div className="text-sm text-muted-foreground">Loading transactions...</div>
      </div>
    );
  }

  if (query.error) {
    return (
      <div className="glass-panel rounded-xl p-8 text-center text-muted-foreground">
        Failed to load transactions.
      </div>
    );
  }

  const txs = query.data?.transactions || [];

  if (txs.length === 0) {
    return (
      <div className="glass-panel rounded-xl p-8 text-center text-muted-foreground">
        No transactions found for this account.
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-in fade-in duration-500">
      {txs.map((tx: any, i: number) => (
        <div key={tx.hash || i} className="glass-panel rounded-xl p-4" data-testid={`card-xrp-tx-${i}`}>
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className={`text-[10px] ${tx.successful ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}
              >
                {tx.successful ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                {tx.result}
              </Badge>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                {tx.type}
              </Badge>
            </div>
            {tx.date && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1 shrink-0">
                <Clock className="w-3 h-3" />
                {timeAgo(tx.date)}
              </span>
            )}
          </div>
          <div className="grid gap-1.5 text-sm">
            {tx.hash && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs w-12 shrink-0">Hash</span>
                <span className="font-mono text-xs text-foreground">{truncateHash(tx.hash)}</span>
                <CopyButton text={tx.hash} />
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs w-12 shrink-0">From</span>
              <span className="font-mono text-xs text-foreground">{truncateHash(tx.from)}</span>
            </div>
            {tx.to && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs w-12 shrink-0">To</span>
                <span className="font-mono text-xs text-foreground">{truncateHash(tx.to)}</span>
              </div>
            )}
            <div className="flex items-center gap-4 mt-1">
              {tx.amount && (
                <span className="text-sm font-mono font-bold text-foreground">
                  {tx.amount.includes(" ") ? tx.amount : `${parseFloat(tx.amount).toLocaleString(undefined, { maximumFractionDigits: 6 })} XRP`}
                </span>
              )}
              {tx.fee && (
                <span className="text-[10px] text-muted-foreground">
                  Fee: {tx.fee} XRP
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TokensTab({ address }: { address: string }) {
  const query = useQuery({
    queryKey: ["/api/xrpl/tokens", address],
    queryFn: async () => {
      const res = await fetch(`/api/xrpl/tokens/${address}`);
      if (!res.ok) throw new Error("Failed to fetch tokens");
      return res.json();
    },
    enabled: !!address,
    retry: false,
  });

  if (query.isLoading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
        <div className="text-sm text-muted-foreground">Loading tokens...</div>
      </div>
    );
  }

  const tokens = query.data?.tokens || [];

  if (tokens.length === 0) {
    return (
      <div className="glass-panel rounded-xl p-8 text-center text-muted-foreground">
        No token trust lines found for this account.
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-in fade-in duration-500">
      <div className="text-sm text-muted-foreground mb-2">{tokens.length} trust line{tokens.length !== 1 ? "s" : ""} found</div>
      {tokens.map((token: any, i: number) => {
        const bal = parseFloat(token.balance);
        return (
          <div key={`${token.currency}-${token.issuer}`} className="glass-panel rounded-xl p-4" data-testid={`card-xrp-token-${i}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Coins className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-foreground text-sm" data-testid={`text-token-currency-${i}`}>
                    {token.currency.length > 3
                      ? (() => { try { const bytes = token.currency.match(/.{1,2}/g)?.map((b: string) => parseInt(b, 16)) || []; return String.fromCharCode(...bytes).replace(/\0/g, ""); } catch { return token.currency; } })()
                      : token.currency}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono">{truncateHash(token.issuer)}</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-bold font-mono ${bal > 0 ? "text-green-400" : bal < 0 ? "text-red-400" : "text-muted-foreground"}`} data-testid={`text-token-balance-${i}`}>
                  {bal.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                </div>
                {token.limit && token.limit !== "0" && (
                  <div className="text-[10px] text-muted-foreground">Limit: {parseFloat(token.limit).toLocaleString()}</div>
                )}
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {token.noRipple && (
                <Badge variant="outline" className="text-[9px] bg-muted/30 border-border text-muted-foreground">No Ripple</Badge>
              )}
              {token.freeze && (
                <Badge variant="outline" className="text-[9px] bg-red-500/10 border-red-500/20 text-red-400">Frozen</Badge>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function NFTsTab({ address }: { address: string }) {
  const query = useQuery({
    queryKey: ["/api/xrpl/nfts", address],
    queryFn: async () => {
      const res = await fetch(`/api/xrpl/nfts/${address}`);
      if (!res.ok) throw new Error("Failed to fetch NFTs");
      return res.json();
    },
    enabled: !!address,
    retry: false,
  });

  if (query.isLoading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
        <div className="text-sm text-muted-foreground">Loading NFTs...</div>
      </div>
    );
  }

  const nfts = query.data?.nfts || [];

  if (nfts.length === 0) {
    return (
      <div className="glass-panel rounded-xl p-8 text-center text-muted-foreground">
        No NFTs found for this account.
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-in fade-in duration-500">
      <div className="text-sm text-muted-foreground mb-2">{nfts.length} NFT{nfts.length !== 1 ? "s" : ""} found</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {nfts.map((nft: any, i: number) => (
          <div key={nft.tokenId} className="glass-panel rounded-xl p-4" data-testid={`card-xrp-nft-${i}`}>
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0">
                <Image className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-mono text-muted-foreground mb-1">Token ID</div>
                <div className="text-xs font-mono text-foreground break-all mb-2" data-testid={`text-nft-id-${i}`}>
                  {truncateHash(nft.tokenId)}
                  <CopyButton text={nft.tokenId} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <span className="text-muted-foreground">Taxon: </span>
                    <span className="text-foreground font-mono">{nft.taxon}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Serial: </span>
                    <span className="text-foreground font-mono">{nft.serial}</span>
                  </div>
                  {nft.transferFee != null && nft.transferFee > 0 && (
                    <div>
                      <span className="text-muted-foreground">Royalty: </span>
                      <span className="text-foreground font-mono">{(nft.transferFee / 1000).toFixed(1)}%</span>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Issuer: </span>
                    <span className="text-foreground font-mono">{truncateHash(nft.issuer)}</span>
                  </div>
                </div>
                {nft.uri && (
                  <a
                    href={nft.uri.startsWith("http") ? nft.uri : `https://ipfs.io/ipfs/${nft.uri.replace("ipfs://", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline mt-2"
                    data-testid={`link-nft-uri-${i}`}
                  >
                    <ExternalLink className="w-3 h-3" /> View URI
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function XrpExplorerPage() {
  const [input, setInput] = useState("");
  const [address, setAddress] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("account");

  const handleSearch = () => {
    const trimmed = input.trim();
    if (trimmed && trimmed.startsWith("r")) {
      setAddress(trimmed);
      setActiveTab("account");
    }
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

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-6 pt-8">
        <AdBanner slot="7788990011" format="horizontal" className="w-full mb-6" />

        <div className="mb-6">
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3" data-testid="text-page-title">
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <span className="font-bold text-primary text-sm">XRP</span>
            </div>
            XRP Explorer
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Look up any XRP Ledger account — balance, transactions, tokens & NFTs
          </p>
        </div>

        <LedgerStats />

        <div className="glass-panel rounded-xl p-4 mb-6">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Enter XRP address (starts with r...)"
              className="bg-muted/30 border-border font-mono text-sm h-11"
              data-testid="input-xrp-address"
            />
            <Button
              onClick={handleSearch}
              disabled={!input.trim() || !input.trim().startsWith("r")}
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-6"
              data-testid="button-xrp-search"
            >
              <Search className="w-4 h-4 mr-2" />
              Look Up
            </Button>
          </div>
        </div>

        {address && (
          <>
            <div className="flex gap-2 flex-wrap mb-6" data-testid="xrp-tabs">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <Button
                    key={tab.key}
                    variant={activeTab === tab.key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveTab(tab.key)}
                    className={
                      activeTab === tab.key
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 text-xs"
                        : "bg-muted/30 border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 text-xs"
                    }
                    data-testid={`button-tab-${tab.key}`}
                  >
                    <Icon className="w-3.5 h-3.5 mr-1.5" />
                    {tab.label}
                  </Button>
                );
              })}
            </div>

            {activeTab === "account" && <AccountTab address={address} />}
            {activeTab === "transactions" && <TransactionsTab address={address} />}
            {activeTab === "tokens" && <TokensTab address={address} />}
            {activeTab === "nfts" && <NFTsTab address={address} />}

            <AdBanner slot="8899001122" format="fluid" layout="in-article" className="w-full mt-6" />
          </>
        )}

        {!address && (
          <div className="glass-panel p-12 rounded-2xl text-center animate-in fade-in duration-700">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
              <Search className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-3" data-testid="text-empty-title">
              Explore the XRP Ledger
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Enter any XRP address above to view account details, recent transactions,
              token holdings, and NFTs — all powered by the free XRPL public API.
            </p>
          </div>
        )}

        <AdBanner slot="9900112233" format="horizontal" className="w-full mt-6" />
      </div>
      <Footer />
    </div>
  );
}
