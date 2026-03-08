import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Search,
  Loader2,
  ArrowRight,
  Copy,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Clock,
  Wallet,
  ArrowRightLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AdBanner } from "@/components/AdBanner";
import { useToast } from "@/hooks/use-toast";

type ExplorerView = "overview" | "btc" | "sol" | "doge";

interface ChainInfo {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  color: string;
  description: string;
  link: string;
  type: "explorer" | "internal" | "evm" | "external";
  chainId?: number;
}

const TOP_CHAINS: ChainInfo[] = [
  { id: "btc", name: "Bitcoin", symbol: "BTC", icon: "₿", color: "from-orange-500/20 to-orange-600/10 border-orange-500/30", description: "Address balance & transaction explorer", link: "btc", type: "explorer" },
  { id: "eth", name: "Ethereum", symbol: "ETH", icon: "⟠", color: "from-blue-500/20 to-blue-600/10 border-blue-500/30", description: "EVM wallet tracker with multi-chain support", link: "/", type: "internal" },
  { id: "sol", name: "Solana", symbol: "SOL", icon: "◎", color: "from-purple-500/20 to-purple-600/10 border-purple-500/30", description: "Account balance & recent transactions", link: "sol", type: "explorer" },
  { id: "xrp", name: "XRP Ledger", symbol: "XRP", icon: "✕", color: "from-gray-400/20 to-gray-500/10 border-gray-400/30", description: "Full account, tokens, NFTs & transactions", link: "/xrp", type: "internal" },
  { id: "bnb", name: "BNB Chain", symbol: "BNB", icon: "◆", color: "from-yellow-500/20 to-yellow-600/10 border-yellow-500/30", description: "BEP-20 tokens & DeFi ecosystem", link: "/", type: "evm", chainId: 56 },
  { id: "doge", name: "Dogecoin", symbol: "DOGE", icon: "Ð", color: "from-amber-500/20 to-amber-600/10 border-amber-500/30", description: "Address balance & transaction explorer", link: "doge", type: "explorer" },
  { id: "ada", name: "Cardano", symbol: "ADA", icon: "₳", color: "from-blue-600/20 to-blue-700/10 border-blue-600/30", description: "Proof-of-stake smart contract platform", link: "https://cardanoscan.io", type: "external" },
  { id: "trx", name: "TRON", symbol: "TRX", icon: "⟁", color: "from-red-500/20 to-red-600/10 border-red-500/30", description: "High-throughput blockchain network", link: "https://tronscan.org", type: "external" },
  { id: "avax", name: "Avalanche", symbol: "AVAX", icon: "🔺", color: "from-red-600/20 to-red-700/10 border-red-600/30", description: "High-speed smart contracts", link: "/", type: "evm", chainId: 43114 },
  { id: "ton", name: "Toncoin", symbol: "TON", icon: "💎", color: "from-sky-500/20 to-sky-600/10 border-sky-500/30", description: "Telegram's blockchain ecosystem", link: "https://tonscan.org", type: "external" },
];

const MORE_CHAINS: ChainInfo[] = [
  { id: "dot", name: "Polkadot", symbol: "DOT", icon: "●", color: "from-pink-500/20 to-pink-600/10 border-pink-500/30", description: "Multi-chain interoperability", link: "https://polkadot.subscan.io", type: "external" },
  { id: "link", name: "Chainlink", symbol: "LINK", icon: "⬡", color: "from-blue-400/20 to-blue-500/10 border-blue-400/30", description: "Decentralized oracle network", link: "https://etherscan.io/token/0x514910771af9ca656af840dff83e8264ecf986ca", type: "external" },
  { id: "ltc", name: "Litecoin", symbol: "LTC", icon: "Ł", color: "from-gray-400/20 to-gray-500/10 border-gray-400/30", description: "Digital silver peer-to-peer", link: "https://litecoinspace.org", type: "external" },
  { id: "shib", name: "Shiba Inu", symbol: "SHIB", icon: "🐕", color: "from-orange-400/20 to-orange-500/10 border-orange-400/30", description: "Community-driven memecoin", link: "https://etherscan.io/token/0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE", type: "external" },
  { id: "bch", name: "Bitcoin Cash", symbol: "BCH", icon: "₿", color: "from-green-500/20 to-green-600/10 border-green-500/30", description: "Bitcoin fork for fast payments", link: "https://blockchair.com/bitcoin-cash", type: "external" },
  { id: "xem", name: "NEM", symbol: "XEM", icon: "✦", color: "from-teal-500/20 to-teal-600/10 border-teal-500/30", description: "Smart asset blockchain platform", link: "https://explorer.nemtool.com", type: "external" },
  { id: "neo", name: "NEO", symbol: "NEO", icon: "◈", color: "from-green-400/20 to-green-500/10 border-green-400/30", description: "Smart economy blockchain", link: "https://dora.coz.io", type: "external" },
  { id: "xlm", name: "Stellar", symbol: "XLM", icon: "✴", color: "from-violet-400/20 to-violet-500/10 border-violet-400/30", description: "Cross-border payment network", link: "https://stellarchain.io", type: "external" },
  { id: "atom", name: "Cosmos", symbol: "ATOM", icon: "⚛", color: "from-indigo-500/20 to-indigo-600/10 border-indigo-500/30", description: "Internet of blockchains", link: "https://www.mintscan.io/cosmos", type: "external" },
  { id: "near", name: "NEAR Protocol", symbol: "NEAR", icon: "Ⓝ", color: "from-cyan-600/20 to-cyan-700/10 border-cyan-600/30", description: "Developer-friendly L1 platform", link: "https://nearblocks.io", type: "external" },
];

const EVM_CHAINS: ChainInfo[] = [
  { id: "polygon", name: "Polygon", symbol: "MATIC", icon: "⬡", color: "from-purple-400/20 to-purple-500/10 border-purple-400/30", description: "Layer 2 scaling solution", link: "/", type: "evm", chainId: 137 },
  { id: "arbitrum", name: "Arbitrum", symbol: "ETH", icon: "🔵", color: "from-cyan-500/20 to-cyan-600/10 border-cyan-500/30", description: "Optimistic rollup L2", link: "/", type: "evm", chainId: 42161 },
  { id: "optimism", name: "Optimism", symbol: "ETH", icon: "🔴", color: "from-red-500/20 to-red-600/10 border-red-500/30", description: "OP Stack L2 network", link: "/", type: "evm", chainId: 10 },
  { id: "base", name: "Base", symbol: "ETH", icon: "🔷", color: "from-blue-400/20 to-blue-500/10 border-blue-400/30", description: "Coinbase's L2 chain", link: "/", type: "evm", chainId: 8453 },
];

function truncateHash(hash: string): string {
  if (!hash || hash.length < 16) return hash || "";
  return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
}

function timeAgo(ts: number): string {
  if (!ts) return "—";
  const seconds = Math.floor(Date.now() / 1000 - ts);
  if (seconds < 0) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function CopyButton({ text, id }: { text: string; id: string }) {
  const { toast } = useToast();
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); toast({ title: "Copied!" }); }}
      className="text-muted-foreground hover:text-primary transition-colors"
      data-testid={`button-copy-${id}`}
    >
      <Copy className="w-3.5 h-3.5" />
    </button>
  );
}

function BtcExplorer() {
  const [input, setInput] = useState("");
  const [address, setAddress] = useState("");

  const { data: accountData, isLoading: loadingAccount, error: accountError } = useQuery({
    queryKey: ["btc-account", address],
    queryFn: async () => {
      const res = await fetch(`/api/btc/address/${address}`);
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); }
      return res.json();
    },
    enabled: !!address,
  });

  const { data: txData } = useQuery({
    queryKey: ["btc-transactions", address],
    queryFn: async () => {
      const res = await fetch(`/api/btc/transactions/${address}`);
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); }
      return res.json();
    },
    enabled: !!address,
  });

  const handleSearch = () => { if (input.trim()) setAddress(input.trim()); };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-3xl">₿</span>
        <div>
          <h2 className="text-xl font-display font-bold" data-testid="text-btc-explorer-title">Bitcoin Explorer</h2>
          <p className="text-sm text-muted-foreground">Powered by Blockstream API</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Input placeholder="Enter Bitcoin address (e.g. bc1q...)" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} className="bg-card border-border" data-testid="input-btc-address" />
        <Button onClick={handleSearch} disabled={!input.trim()} data-testid="button-btc-search"><Search className="w-4 h-4 mr-1" /> Search</Button>
      </div>
      {loadingAccount && <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}
      {accountError && <div className="glass-panel p-4 text-destructive text-sm" data-testid="text-btc-error">{(accountError as Error).message}</div>}
      {accountData && (
        <Card className="glass-panel border-orange-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4"><Wallet className="w-5 h-5 text-orange-400" /><h3 className="font-display font-semibold text-lg">Account Info</h3></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><p className="text-xs text-muted-foreground">Balance</p><p className="font-mono text-lg font-semibold text-orange-400" data-testid="text-btc-balance">{accountData.balance} BTC</p></div>
              <div><p className="text-xs text-muted-foreground">Transactions</p><p className="font-mono text-lg" data-testid="text-btc-txcount">{accountData.txCount?.toLocaleString()}</p></div>
              <div><p className="text-xs text-muted-foreground">Total Received</p><p className="font-mono text-sm text-green-400" data-testid="text-btc-funded">{accountData.funded} BTC</p></div>
              <div><p className="text-xs text-muted-foreground">Total Sent</p><p className="font-mono text-sm text-red-400" data-testid="text-btc-spent">{accountData.spent} BTC</p></div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono" data-testid="text-btc-address">{truncateHash(accountData.address)}</span>
              <CopyButton text={accountData.address} id="btc-address" />
            </div>
          </CardContent>
        </Card>
      )}
      {txData?.transactions?.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2"><ArrowRightLeft className="w-5 h-5 text-orange-400" /><h3 className="font-display font-semibold" data-testid="text-btc-tx-title">Recent Transactions</h3><Badge variant="secondary" className="text-xs">{txData.transactions.length}</Badge></div>
          <div className="space-y-2">
            {txData.transactions.map((tx: any, i: number) => (
              <Card key={tx.txid} className="glass-panel border-border/50" data-testid={`card-btc-tx-${i}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2"><span className="font-mono text-xs text-muted-foreground" data-testid={`text-btc-txid-${i}`}>{truncateHash(tx.txid)}</span><CopyButton text={tx.txid} id={`btc-tx-${i}`} /></div>
                    <div className="flex items-center gap-2">
                      {tx.confirmed ? (<Badge variant="outline" className="text-green-400 border-green-400/30 text-xs" data-testid={`badge-btc-confirmed-${i}`}><CheckCircle2 className="w-3 h-3 mr-1" /> Confirmed</Badge>) : (<Badge variant="outline" className="text-yellow-400 border-yellow-400/30 text-xs" data-testid={`badge-btc-pending-${i}`}><Clock className="w-3 h-3 mr-1" /> Pending</Badge>)}
                      <a href={`https://blockstream.info/tx/${tx.txid}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary" data-testid={`link-btc-tx-${i}`}><ExternalLink className="w-3.5 h-3.5" /></a>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div><span className="text-muted-foreground">Input:</span> <span className="font-mono">{tx.totalInput} BTC</span></div>
                    <div><span className="text-muted-foreground">Output:</span> <span className="font-mono">{tx.totalOutput} BTC</span></div>
                    <div><span className="text-muted-foreground">Fee:</span> <span className="font-mono text-yellow-400">{tx.fee} BTC</span></div>
                    <div><span className="text-muted-foreground">Time:</span> <span>{tx.blockTime ? timeAgo(tx.blockTime) : "Pending"}</span></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SolExplorer() {
  const [input, setInput] = useState("");
  const [address, setAddress] = useState("");

  const { data: accountData, isLoading: loadingAccount, error: accountError } = useQuery({
    queryKey: ["sol-account", address],
    queryFn: async () => {
      const res = await fetch(`/api/sol/account/${address}`);
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); }
      return res.json();
    },
    enabled: !!address,
  });

  const { data: txData } = useQuery({
    queryKey: ["sol-transactions", address],
    queryFn: async () => {
      const res = await fetch(`/api/sol/transactions/${address}`);
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); }
      return res.json();
    },
    enabled: !!address,
  });

  const handleSearch = () => { if (input.trim()) setAddress(input.trim()); };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-3xl">◎</span>
        <div>
          <h2 className="text-xl font-display font-bold" data-testid="text-sol-explorer-title">Solana Explorer</h2>
          <p className="text-sm text-muted-foreground">Powered by Solana Public RPC</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Input placeholder="Enter Solana address (e.g. 7v91N...)" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} className="bg-card border-border" data-testid="input-sol-address" />
        <Button onClick={handleSearch} disabled={!input.trim()} data-testid="button-sol-search"><Search className="w-4 h-4 mr-1" /> Search</Button>
      </div>
      {loadingAccount && <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}
      {accountError && <div className="glass-panel p-4 text-destructive text-sm" data-testid="text-sol-error">{(accountError as Error).message}</div>}
      {accountData && (
        <Card className="glass-panel border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4"><Wallet className="w-5 h-5 text-purple-400" /><h3 className="font-display font-semibold text-lg">Account Info</h3></div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div><p className="text-xs text-muted-foreground">Balance</p><p className="font-mono text-lg font-semibold text-purple-400" data-testid="text-sol-balance">{accountData.balance} SOL</p></div>
              <div><p className="text-xs text-muted-foreground">Lamports</p><p className="font-mono text-sm" data-testid="text-sol-lamports">{accountData.lamports?.toLocaleString()}</p></div>
              <div><p className="text-xs text-muted-foreground">Slot</p><p className="font-mono text-sm" data-testid="text-sol-slot">{accountData.slot?.toLocaleString()}</p></div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono" data-testid="text-sol-address">{truncateHash(accountData.address)}</span>
              <CopyButton text={accountData.address} id="sol-address" />
            </div>
          </CardContent>
        </Card>
      )}
      {txData?.transactions?.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2"><ArrowRightLeft className="w-5 h-5 text-purple-400" /><h3 className="font-display font-semibold" data-testid="text-sol-tx-title">Recent Transactions</h3><Badge variant="secondary" className="text-xs">{txData.transactions.length}</Badge></div>
          <div className="space-y-2">
            {txData.transactions.map((tx: any, i: number) => (
              <Card key={tx.signature} className="glass-panel border-border/50" data-testid={`card-sol-tx-${i}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2"><span className="font-mono text-xs text-muted-foreground" data-testid={`text-sol-sig-${i}`}>{truncateHash(tx.signature)}</span><CopyButton text={tx.signature} id={`sol-tx-${i}`} /></div>
                    <div className="flex items-center gap-2">
                      {tx.err ? (<Badge variant="outline" className="text-red-400 border-red-400/30 text-xs" data-testid={`badge-sol-error-${i}`}><XCircle className="w-3 h-3 mr-1" /> Failed</Badge>) : (<Badge variant="outline" className="text-green-400 border-green-400/30 text-xs" data-testid={`badge-sol-success-${i}`}><CheckCircle2 className="w-3 h-3 mr-1" /> {tx.confirmationStatus}</Badge>)}
                      <a href={`https://solscan.io/tx/${tx.signature}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary" data-testid={`link-sol-tx-${i}`}><ExternalLink className="w-3.5 h-3.5" /></a>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                    <div><span className="text-muted-foreground">Slot:</span> <span className="font-mono">{tx.slot?.toLocaleString()}</span></div>
                    <div><span className="text-muted-foreground">Time:</span> <span>{tx.blockTime ? timeAgo(tx.blockTime) : "—"}</span></div>
                    {tx.memo && <div><span className="text-muted-foreground">Memo:</span> <span className="font-mono">{tx.memo}</span></div>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DogeExplorer() {
  const [input, setInput] = useState("");
  const [address, setAddress] = useState("");

  const { data: accountData, isLoading: loadingAccount, error: accountError } = useQuery({
    queryKey: ["doge-account", address],
    queryFn: async () => {
      const res = await fetch(`/api/doge/address/${address}`);
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); }
      return res.json();
    },
    enabled: !!address,
  });

  const { data: txData } = useQuery({
    queryKey: ["doge-transactions", address],
    queryFn: async () => {
      const res = await fetch(`/api/doge/transactions/${address}`);
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); }
      return res.json();
    },
    enabled: !!address,
  });

  const handleSearch = () => { if (input.trim()) setAddress(input.trim()); };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-3xl">Ð</span>
        <div>
          <h2 className="text-xl font-display font-bold" data-testid="text-doge-explorer-title">Dogecoin Explorer</h2>
          <p className="text-sm text-muted-foreground">Powered by Blockcypher API</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Input placeholder="Enter Dogecoin address (e.g. D...)" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} className="bg-card border-border" data-testid="input-doge-address" />
        <Button onClick={handleSearch} disabled={!input.trim()} data-testid="button-doge-search"><Search className="w-4 h-4 mr-1" /> Search</Button>
      </div>
      {loadingAccount && <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}
      {accountError && <div className="glass-panel p-4 text-destructive text-sm" data-testid="text-doge-error">{(accountError as Error).message}</div>}
      {accountData && (
        <Card className="glass-panel border-amber-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4"><Wallet className="w-5 h-5 text-amber-400" /><h3 className="font-display font-semibold text-lg">Account Info</h3></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><p className="text-xs text-muted-foreground">Balance</p><p className="font-mono text-lg font-semibold text-amber-400" data-testid="text-doge-balance">{accountData.balance} DOGE</p></div>
              <div><p className="text-xs text-muted-foreground">Transactions</p><p className="font-mono text-lg" data-testid="text-doge-txcount">{accountData.txCount?.toLocaleString()}</p></div>
              <div><p className="text-xs text-muted-foreground">Total Received</p><p className="font-mono text-sm text-green-400" data-testid="text-doge-received">{accountData.totalReceived} DOGE</p></div>
              <div><p className="text-xs text-muted-foreground">Total Sent</p><p className="font-mono text-sm text-red-400" data-testid="text-doge-sent">{accountData.totalSent} DOGE</p></div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono" data-testid="text-doge-address">{truncateHash(accountData.address)}</span>
              <CopyButton text={accountData.address} id="doge-address" />
            </div>
          </CardContent>
        </Card>
      )}
      {txData?.transactions?.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2"><ArrowRightLeft className="w-5 h-5 text-amber-400" /><h3 className="font-display font-semibold" data-testid="text-doge-tx-title">Recent Transactions</h3><Badge variant="secondary" className="text-xs">{txData.transactions.length}</Badge></div>
          <div className="space-y-2">
            {txData.transactions.map((tx: any, i: number) => (
              <Card key={`${tx.txid}-${i}`} className="glass-panel border-border/50" data-testid={`card-doge-tx-${i}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2"><span className="font-mono text-xs text-muted-foreground" data-testid={`text-doge-txid-${i}`}>{truncateHash(tx.txid)}</span><CopyButton text={tx.txid} id={`doge-tx-${i}`} /></div>
                    <div className="flex items-center gap-2">
                      {tx.confirmed ? (<Badge variant="outline" className="text-green-400 border-green-400/30 text-xs" data-testid={`badge-doge-confirmed-${i}`}><CheckCircle2 className="w-3 h-3 mr-1" /> {tx.confirmations} conf</Badge>) : (<Badge variant="outline" className="text-yellow-400 border-yellow-400/30 text-xs" data-testid={`badge-doge-pending-${i}`}><Clock className="w-3 h-3 mr-1" /> Pending</Badge>)}
                      <a href={`https://dogechain.info/tx/${tx.txid}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary" data-testid={`link-doge-tx-${i}`}><ExternalLink className="w-3.5 h-3.5" /></a>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                    <div><span className="text-muted-foreground">Value:</span> <span className="font-mono text-amber-400">{tx.value} DOGE</span></div>
                    <div><span className="text-muted-foreground">Block:</span> <span className="font-mono">{tx.blockHeight || "Pending"}</span></div>
                    <div><span className="text-muted-foreground">Time:</span> <span>{tx.time ? timeAgo(Math.floor(new Date(tx.time).getTime() / 1000)) : "—"}</span></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ChainGrid({ chains, title, subtitle, sectionId }: { chains: ChainInfo[]; title: string; subtitle?: string; sectionId: string }) {
  const [, navigate] = useLocation();

  const handleClick = (chain: ChainInfo) => {
    if (chain.type === "external") {
      window.open(chain.link, "_blank", "noopener,noreferrer");
    } else if (chain.type === "evm") {
      navigate(`/?chain=${chain.chainId}`);
    } else if (chain.type === "internal") {
      navigate(chain.link);
    }
  };

  const isClickable = (chain: ChainInfo) => chain.type !== "explorer";

  return (
    <section>
      <h2 className="text-xl font-display font-semibold mb-2 flex items-center gap-2" data-testid={`text-section-${sectionId}`}>
        <span className="w-2 h-2 rounded-full bg-primary" /> {title}
      </h2>
      {subtitle && <p className="text-sm text-muted-foreground mb-4">{subtitle}</p>}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {chains.map((chain) => (
          <div key={chain.id} data-testid={`card-chain-${chain.id}`}>
            <Card className={`glass-panel bg-gradient-to-br ${chain.color} border hover:border-primary/50 transition-all duration-300 hover:scale-[1.02] h-full cursor-pointer`}>
              <CardContent className="p-4 text-center" onClick={() => isClickable(chain) ? handleClick(chain) : undefined}>
                <span className="text-2xl block mb-2">{chain.icon}</span>
                <p className="font-display font-semibold text-sm">{chain.name}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{chain.symbol}</p>
                <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{chain.description}</p>
                {chain.type === "external" && <ExternalLink className="w-3 h-3 text-muted-foreground mx-auto mt-2" />}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function ExplorerPage() {
  const [view, setView] = useState<ExplorerView>("overview");
  const [, navigate] = useLocation();

  const handleChainClick = (chain: ChainInfo) => {
    if (chain.type === "explorer") {
      setView(chain.link as ExplorerView);
    } else if (chain.type === "internal") {
      navigate(chain.link);
    } else if (chain.type === "evm") {
      navigate(`/?chain=${chain.chainId}`);
    } else if (chain.type === "external") {
      window.open(chain.link, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-2" data-testid="text-explorer-title">
            Multi-Chain Explorer
          </h1>
          <p className="text-muted-foreground" data-testid="text-explorer-subtitle">
            Explore wallets and transactions across 20+ blockchains — all free, no sign-up required
          </p>
        </div>

        {view !== "overview" && (
          <Button variant="ghost" onClick={() => setView("overview")} className="text-muted-foreground hover:text-foreground" data-testid="button-back-overview">
            ← Back to all chains
          </Button>
        )}

        {view === "overview" && (
          <>
            <section>
              <h2 className="text-xl font-display font-semibold mb-2 flex items-center gap-2" data-testid="text-section-top-chains">
                <span className="w-2 h-2 rounded-full bg-primary" /> Top Chains
              </h2>
              <p className="text-sm text-muted-foreground mb-4">Top cryptocurrencies by market cap — click to explore</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {TOP_CHAINS.map((chain) => (
                  <button
                    key={chain.id}
                    onClick={() => handleChainClick(chain)}
                    className="text-left group"
                    data-testid={`card-chain-${chain.id}`}
                  >
                    <Card className={`glass-panel bg-gradient-to-br ${chain.color} border hover:border-primary/50 transition-all duration-300 group-hover:scale-[1.02] h-full`}>
                      <CardContent className="p-4 text-center">
                        <span className="text-2xl block mb-2">{chain.icon}</span>
                        <p className="font-display font-semibold text-sm">{chain.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{chain.symbol}</p>
                        <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{chain.description}</p>
                        {chain.type === "explorer" && (
                          <Badge variant="outline" className="text-primary border-primary/30 text-[9px] mt-2">Built-in Explorer</Badge>
                        )}
                        {chain.type === "internal" && (
                          <Badge variant="outline" className="text-primary border-primary/30 text-[9px] mt-2">Built-in Explorer</Badge>
                        )}
                        {chain.type === "external" && <ExternalLink className="w-3 h-3 text-muted-foreground mx-auto mt-2" />}
                      </CardContent>
                    </Card>
                  </button>
                ))}
              </div>
            </section>

            <AdBanner slot="explorer-mid" className="my-6" />

            <ChainGrid
              chains={MORE_CHAINS}
              title="More Chains"
              subtitle="Additional blockchains — click to view on their native explorers"
              sectionId="more-chains"
            />

            <ChainGrid
              chains={EVM_CHAINS}
              title="EVM Networks"
              subtitle="Layer 2 and EVM-compatible chains — tracked via the Wallet Tracker"
              sectionId="evm-chains"
            />
          </>
        )}

        {view === "btc" && <BtcExplorer />}
        {view === "sol" && <SolExplorer />}
        {view === "doge" && <DogeExplorer />}

        <AdBanner slot="explorer-bottom" className="mt-8" />
      </main>
      <Footer />
    </div>
  );
}
