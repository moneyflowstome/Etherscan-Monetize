import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search, ExternalLink, TrendingUp, Image, Wallet, X,
  BarChart3, Layers, Eye, ShoppingCart, Tag
} from "lucide-react";

const CHAINS = [
  { value: "ethereum", label: "Ethereum" },
  { value: "polygon", label: "Polygon" },
  { value: "arbitrum", label: "Arbitrum" },
  { value: "optimism", label: "Optimism" },
  { value: "base", label: "Base" },
];

function formatEth(val: number | string | undefined | null) {
  if (val === undefined || val === null) return "—";
  const n = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(n)) return "—";
  return n < 0.001 ? "<0.001" : n.toFixed(n < 1 ? 4 : 2);
}

function formatNum(val: number | undefined | null) {
  if (val === undefined || val === null) return "—";
  if (val >= 1_000_000) return (val / 1_000_000).toFixed(1) + "M";
  if (val >= 1_000) return (val / 1_000).toFixed(1) + "K";
  return val.toLocaleString();
}

function shortenAddr(addr: string | undefined) {
  if (!addr) return "—";
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

function weiToEth(wei: string | number | undefined) {
  if (!wei) return "—";
  const n = typeof wei === "string" ? parseFloat(wei) : wei;
  if (isNaN(n)) return "—";
  const eth = n / 1e18;
  return eth < 0.0001 ? "<0.0001" : eth.toFixed(eth < 1 ? 4 : 2);
}

function ErrorDisplay({ message }: { message: string }) {
  return (
    <div className="text-center py-12 text-red-400">
      <p className="font-medium mb-1">Failed to load data</p>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function LoadingSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="bg-card/50 border-border/50 animate-pulse">
          <CardContent className="p-4">
            <div className="w-full aspect-square rounded-lg bg-muted/30 mb-3" />
            <div className="h-4 bg-muted/30 rounded w-3/4 mb-2" />
            <div className="h-3 bg-muted/30 rounded w-1/2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/20 rounded-lg p-2">
      <span className="text-muted-foreground block text-xs">{label}</span>
      <span className="font-bold text-foreground">{value}</span>
    </div>
  );
}

function TrendingCollections({ onSelectCollection }: { onSelectCollection: (addr: string) => void }) {
  const [chain, setChain] = useState("ethereum");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["nft-trending", chain],
    queryFn: async () => {
      const res = await fetch(`/api/nfts/collections?chain=${chain}`);
      if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error || `Error ${res.status}`); }
      return res.json();
    },
    staleTime: 120000, retry: 1,
  });

  const collections = Array.isArray(data) ? data : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold flex items-center gap-2" data-testid="text-trending-title">
          <TrendingUp className="w-5 h-5 text-primary" /> Top NFT Collections
        </h2>
        <div className="flex gap-1 flex-wrap">
          {CHAINS.map((c) => (
            <button key={c.value} onClick={() => setChain(c.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${chain === c.value ? "bg-primary/20 text-primary border border-primary/30" : "bg-muted/30 text-muted-foreground hover:text-foreground border border-border/30"}`}
              data-testid={`button-chain-${c.value}`}>{c.label}</button>
          ))}
        </div>
      </div>

      {isError ? <ErrorDisplay message={(error as Error)?.message || "Unknown error"} /> :
       isLoading ? <LoadingSkeleton /> :
       collections.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Image className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No collections found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {collections.map((c: any, i: number) => (
            <CollectionCard key={c.contract_address || i} collection={c} rank={i + 1} onClick={() => c.contract_address && onSelectCollection(c.contract_address)} />
          ))}
        </div>
      )}
    </div>
  );
}

function CollectionCard({ collection: c, rank, onClick }: { collection: any; rank: number; onClick?: () => void }) {
  return (
    <Card className="bg-card/50 border-border/50 hover:border-primary/30 transition-all group cursor-pointer" data-testid={`collection-card-${rank}`} onClick={onClick}>
      <CardContent className="p-4">
        <div className="relative mb-3">
          {c.image_url ? (
            <img src={c.image_url} alt={c.name} className="w-full aspect-square object-cover rounded-lg bg-muted/30" loading="lazy"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          ) : (
            <div className="w-full aspect-square rounded-lg bg-muted/30 flex items-center justify-center"><Image className="w-10 h-10 text-muted-foreground/30" /></div>
          )}
          <Badge className="absolute top-2 left-2 bg-background/80 backdrop-blur text-foreground border-border text-[10px]">#{rank}</Badge>
          {c.safelist_request_status === "verified" && <Badge className="absolute top-2 right-2 bg-blue-500/80 text-white border-0 text-[10px]">Verified</Badge>}
        </div>
        <h3 className="font-bold text-sm truncate mb-1" data-testid={`text-collection-name-${rank}`}>{c.name || "Unknown"}</h3>
        <div className="grid grid-cols-2 gap-2 text-xs mt-3">
          {c.stats?.floor_price != null && <StatBox label="Floor" value={`${formatEth(c.stats.floor_price)} ETH`} />}
          {c.stats?.total_supply != null && <StatBox label="Supply" value={formatNum(c.stats.total_supply)} />}
        </div>
        {c.opensea_url && (
          <a href={c.opensea_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-center gap-1 mt-3 text-xs text-primary hover:underline" data-testid={`link-opensea-${rank}`}>
            OpenSea <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </CardContent>
    </Card>
  );
}

function CollectionSearch({ onSelectCollection }: { onSelectCollection: (addr: string) => void }) {
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["nft-search", searchTerm],
    queryFn: async () => {
      if (!searchTerm) return [];
      const res = await fetch(`/api/nfts/search?q=${encodeURIComponent(searchTerm)}`);
      if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error || "Search failed"); }
      return res.json();
    },
    enabled: !!searchTerm, staleTime: 60000,
  });

  const results = Array.isArray(data) ? data : [];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2" data-testid="text-search-title">
        <Search className="w-5 h-5 text-primary" /> Search Collections
      </h2>
      <div className="flex gap-2">
        <Input placeholder="Search by collection name (e.g. bored ape, punk, azuki)..." value={query} onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && query.trim() && setSearchTerm(query.trim())}
          className="bg-muted/30 border-border/50" data-testid="input-nft-search" />
        <Button onClick={() => query.trim() && setSearchTerm(query.trim())} className="bg-primary hover:bg-primary/80" data-testid="button-nft-search">
          <Search className="w-4 h-4" />
        </Button>
      </div>
      {isLoading && <div className="text-center py-6 text-muted-foreground">Searching...</div>}
      {isError && <ErrorDisplay message="Search failed" />}
      {searchTerm && !isLoading && !isError && results.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">No collections found for "{searchTerm}"</div>
      )}
      {results.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {results.map((c: any, i: number) => <CollectionCard key={c.contract_address || i} collection={c} rank={i + 1} onClick={() => c.contract_address && onSelectCollection(c.contract_address)} />)}
        </div>
      )}
    </div>
  );
}

function WalletNfts() {
  const [address, setAddress] = useState("");
  const [walletAddr, setWalletAddr] = useState("");
  const [chain, setChain] = useState("ethereum");
  const [selectedNft, setSelectedNft] = useState<any>(null);
  const [showCollections, setShowCollections] = useState(false);
  const [hideSpam, setHideSpam] = useState(true);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["nft-wallet", walletAddr, chain],
    queryFn: async () => {
      if (!walletAddr) return [];
      const res = await fetch(`/api/nfts/wallet/${walletAddr}?chain=${chain}`);
      if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error || "Failed"); }
      return res.json();
    },
    enabled: !!walletAddr, staleTime: 60000,
  });

  const { data: walletCollections, isLoading: collLoading } = useQuery({
    queryKey: ["nft-wallet-collections", walletAddr, chain],
    queryFn: async () => {
      if (!walletAddr) return [];
      const res = await fetch(`/api/nfts/account/${walletAddr}/collections?chain=${chain}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!walletAddr && showCollections, staleTime: 60000,
  });

  const allNfts = Array.isArray(data) ? data : [];
  const nfts = hideSpam ? allNfts.filter((n: any) => !n.is_spam) : allNfts;
  const spamCount = allNfts.length - nfts.length;
  const collections = Array.isArray(walletCollections) ? walletCollections.filter((c: any) => !c.is_spam) : [];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2" data-testid="text-wallet-nft-title">
        <Wallet className="w-5 h-5 text-primary" /> Wallet NFTs
      </h2>
      <div className="flex gap-2 flex-wrap">
        <Input placeholder="Enter wallet address (0x...)" value={address} onChange={(e) => setAddress(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && address.trim() && setWalletAddr(address.trim())}
          className="bg-muted/30 border-border/50 flex-1 min-w-[200px]" data-testid="input-wallet-nft" />
        <select value={chain} onChange={(e) => setChain(e.target.value)}
          className="bg-muted/30 border border-border/50 rounded-md px-3 text-sm" data-testid="select-wallet-chain">
          {CHAINS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <Button onClick={() => address.trim() && setWalletAddr(address.trim())} className="bg-primary hover:bg-primary/80" data-testid="button-wallet-nft-search">
          <Search className="w-4 h-4 mr-1" /> Lookup
        </Button>
      </div>

      {isError && <ErrorDisplay message="Failed to load wallet NFTs. Check the address format." />}
      {isLoading && <LoadingSkeleton count={10} />}

      {walletAddr && !isLoading && !isError && nfts.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Wallet className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No NFTs found for this wallet on {CHAINS.find(c => c.value === chain)?.label}</p>
        </div>
      )}

      {nfts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">{nfts.length} NFTs found</p>
              {spamCount > 0 && (
                <button onClick={() => setHideSpam(!hideSpam)} className="text-xs text-muted-foreground hover:text-foreground" data-testid="button-toggle-spam">
                  {hideSpam ? `Show ${spamCount} hidden spam` : "Hide spam"}
                </button>
              )}
            </div>
            <button onClick={() => setShowCollections(!showCollections)}
              className="text-xs text-primary hover:underline flex items-center gap-1" data-testid="button-toggle-wallet-collections">
              <Layers className="w-3 h-3" /> {showCollections ? "Hide" : "Show"} Collections
            </button>
          </div>

          {showCollections && (
            <div className="mb-4">
              {collLoading ? <div className="text-sm text-muted-foreground">Loading collections...</div> :
               collections.length === 0 ? <div className="text-sm text-muted-foreground">No collections found</div> : (
                <div className="flex flex-wrap gap-2">
                  {collections.map((c: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 bg-muted/20 rounded-lg px-3 py-2 border border-border/30">
                      {c.image_url && <img src={c.image_url} alt="" className="w-6 h-6 rounded" />}
                      <span className="text-xs font-medium">{c.name}</span>
                      {c.total_supply > 0 && <Badge className="text-[10px] bg-muted/30 border-border">{c.total_supply}</Badge>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {nfts.map((nft: any, i: number) => (
              <div key={(nft.contract || "") + nft.identifier + "-" + i}
                className="bg-card/50 border border-border/50 rounded-lg overflow-hidden hover:border-primary/30 transition-all cursor-pointer group"
                onClick={() => setSelectedNft(nft)} data-testid={`nft-card-${i}`}>
                {nft.image_url ? (
                  <img src={nft.image_url} alt={nft.name || `#${nft.identifier}`} className="w-full aspect-square object-cover" loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                ) : (
                  <div className="w-full aspect-square bg-muted/30 flex items-center justify-center"><Image className="w-8 h-8 text-muted-foreground/30" /></div>
                )}
                <div className="p-2">
                  <p className="text-xs font-bold truncate">{nft.name || `#${nft.identifier}`}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{nft.collection}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedNft && <NftDetailModal nft={selectedNft} onClose={() => setSelectedNft(null)} />}
    </div>
  );
}

function NftDetailModal({ nft, onClose }: { nft: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-bold text-sm truncate" data-testid="text-nft-detail-name">{nft.name || `#${nft.identifier}`}</h3>
          <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-nft-detail"><X className="w-4 h-4" /></Button>
        </div>
        <div className="p-4 space-y-4">
          {nft.image_url && <img src={nft.image_url} alt={nft.name} className="w-full rounded-lg" />}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Collection</span><span className="font-medium">{nft.collection}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Token ID</span><span className="font-mono text-xs">{nft.identifier}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Standard</span><span>{nft.token_standard || "—"}</span></div>
            {nft.contract && <div className="flex justify-between"><span className="text-muted-foreground">Contract</span><span className="font-mono text-xs">{shortenAddr(nft.contract)}</span></div>}
            {nft.description && <div><span className="text-muted-foreground block mb-1">Description</span><p className="text-xs text-foreground/80 line-clamp-4">{nft.description}</p></div>}
            {nft.traits && nft.traits.length > 0 && (
              <div>
                <span className="text-muted-foreground block mb-2">Traits</span>
                <div className="flex flex-wrap gap-1.5">
                  {nft.traits.map((t: any, i: number) => (
                    <Badge key={i} className="bg-primary/10 text-primary border-primary/20 text-[10px]">{t.trait_type}: {t.value}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          {nft.opensea_url && (
            <a href={nft.opensea_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-primary/20 text-primary text-sm font-medium hover:bg-primary/30 transition-colors"
              data-testid="link-nft-opensea">View on OpenSea <ExternalLink className="w-4 h-4" /></a>
          )}
        </div>
      </div>
    </div>
  );
}

function CollectionDetail({ initialAddress }: { initialAddress?: string }) {
  const [contractInput, setContractInput] = useState(initialAddress || "");
  const [contractAddr, setContractAddr] = useState(initialAddress || "");
  const [chain, setChain] = useState("ethereum");
  const [detailTab, setDetailTab] = useState<"nfts" | "stats" | "sales">("nfts");

  const { data: detail, isLoading, isError } = useQuery({
    queryKey: ["nft-collection-detail", contractAddr, chain],
    queryFn: async () => {
      if (!contractAddr) return null;
      const res = await fetch(`/api/nfts/collection/${contractAddr}?chain=${chain}`);
      if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error || "Not found"); }
      return res.json();
    },
    enabled: !!contractAddr, staleTime: 60000,
  });

  function doLookup() {
    const v = contractInput.trim();
    if (v && /^0x[a-fA-F0-9]{40}$/.test(v)) {
      setContractAddr(v);
      setDetailTab("nfts");
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Layers className="w-5 h-5 text-primary" /> Collection Explorer
      </h2>
      <div className="flex gap-2 flex-wrap">
        <Input placeholder="Enter contract address (0x...)" value={contractInput} onChange={(e) => setContractInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && doLookup()}
          className="bg-muted/30 border-border/50 flex-1 min-w-[200px]" data-testid="input-collection-contract" />
        <select value={chain} onChange={(e) => setChain(e.target.value)}
          className="bg-muted/30 border border-border/50 rounded-md px-3 text-sm" data-testid="select-collection-chain">
          {CHAINS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <Button onClick={doLookup} className="bg-primary hover:bg-primary/80" data-testid="button-collection-lookup">
          <Search className="w-4 h-4" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Tip: Click any collection from Trending or Search to load it here automatically</p>

      {isLoading && <div className="text-center py-6 text-muted-foreground">Loading collection...</div>}
      {isError && <ErrorDisplay message="Collection not found. Check the contract address." />}

      {detail && !isLoading && (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4 mb-4">
              {detail.image_url && <img src={detail.image_url} alt={detail.name} className="w-20 h-20 rounded-xl object-cover shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold truncate" data-testid="text-detail-name">{detail.name}</h3>
                  {detail.safelist_request_status === "verified" && <Badge className="bg-blue-500 text-white border-0 text-[10px]">Verified</Badge>}
                </div>
                {detail.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{detail.description}</p>}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs mb-2">
                  {detail.stats?.floor_price != null && <StatBox label="Floor Price" value={`${formatEth(detail.stats.floor_price)} ETH`} />}
                  {detail.stats?.floor_price_looksrare != null && <StatBox label="LooksRare Floor" value={`${formatEth(detail.stats.floor_price_looksrare)} ETH`} />}
                  {detail.stats?.total_supply != null && <StatBox label="Total Supply" value={formatNum(detail.stats.total_supply)} />}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {detail.opensea_url && <a href={detail.opensea_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">OpenSea <ExternalLink className="w-3 h-3" /></a>}
                  {detail.discord_url && <a href={detail.discord_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">Discord <ExternalLink className="w-3 h-3" /></a>}
                  {detail.twitter_username && <a href={`https://twitter.com/${detail.twitter_username}`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">Twitter <ExternalLink className="w-3 h-3" /></a>}
                  <span className="text-xs text-muted-foreground font-mono">{shortenAddr(detail.contract_address)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
              {([
                { key: "nfts", label: "NFTs", icon: Image },
                { key: "stats", label: "Stats & Floor", icon: BarChart3 },
                { key: "sales", label: "Sales History", icon: ShoppingCart },
              ] as const).map(({ key, label, icon: Icon }) => (
                <button key={key} onClick={() => setDetailTab(key)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${detailTab === key ? "bg-primary/20 text-primary border border-primary/30" : "bg-muted/30 text-muted-foreground hover:text-foreground border border-border/30"}`}
                  data-testid={`button-detail-tab-${key}`}>
                  <Icon className="w-3.5 h-3.5" /> {label}
                </button>
              ))}
            </div>

            {detailTab === "nfts" && <CollectionNftsTab address={contractAddr} chain={chain} />}
            {detailTab === "stats" && <CollectionStatsTab address={contractAddr} chain={chain} />}
            {detailTab === "sales" && <CollectionSalesTab address={contractAddr} chain={chain} />}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CollectionNftsTab({ address, chain }: { address: string; chain: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["nft-collection-nfts", address, chain],
    queryFn: async () => {
      const res = await fetch(`/api/nfts/collection/${address}/nfts?chain=${chain}`);
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 60000,
  });
  const nfts = Array.isArray(data) ? data : [];

  if (isLoading) return <div className="text-center py-4 text-muted-foreground">Loading NFTs...</div>;
  if (nfts.length === 0) return <div className="text-center py-4 text-muted-foreground">No NFTs found</div>;

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
      {nfts.map((nft: any, i: number) => (
        <div key={nft.identifier + "-" + i} className="bg-muted/20 rounded-lg overflow-hidden border border-border/30 hover:border-primary/30 transition-all">
          {nft.image_url ? (
            <img src={nft.image_url} alt={nft.name || `#${nft.identifier}`} className="w-full aspect-square object-cover" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          ) : (
            <div className="w-full aspect-square bg-muted/30 flex items-center justify-center"><Image className="w-6 h-6 text-muted-foreground/30" /></div>
          )}
          <div className="p-1.5">
            <p className="text-[10px] font-medium truncate">{nft.name || `#${nft.identifier}`}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function CollectionStatsTab({ address, chain }: { address: string; chain: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["nft-collection-stats", address, chain],
    queryFn: async () => {
      const res = await fetch(`/api/nfts/collection/${address}/stats?chain=${chain}`);
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 60000,
  });

  if (isLoading) return <div className="text-center py-4 text-muted-foreground">Loading stats...</div>;
  if (!data) return <div className="text-center py-4 text-muted-foreground">Stats unavailable</div>;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {data.floor_price != null && (
        <div className="bg-muted/20 rounded-lg p-4 text-center">
          <span className="text-muted-foreground text-xs block mb-1">OpenSea Floor</span>
          <span className="font-bold text-xl text-foreground">{formatEth(data.floor_price)}</span>
          <span className="text-xs text-muted-foreground block">ETH</span>
        </div>
      )}
      {data.floor_price_looksrare != null && (
        <div className="bg-muted/20 rounded-lg p-4 text-center">
          <span className="text-muted-foreground text-xs block mb-1">LooksRare Floor</span>
          <span className="font-bold text-xl text-foreground">{formatEth(data.floor_price_looksrare)}</span>
          <span className="text-xs text-muted-foreground block">ETH</span>
        </div>
      )}
      {data.total_supply != null && (
        <div className="bg-muted/20 rounded-lg p-4 text-center">
          <span className="text-muted-foreground text-xs block mb-1">Total Supply</span>
          <span className="font-bold text-xl text-foreground">{formatNum(data.total_supply)}</span>
        </div>
      )}
      {data.token_type && (
        <div className="bg-muted/20 rounded-lg p-4 text-center">
          <span className="text-muted-foreground text-xs block mb-1">Token Type</span>
          <span className="font-bold text-lg text-foreground">{data.token_type}</span>
        </div>
      )}
      {data.deployer && (
        <div className="bg-muted/20 rounded-lg p-4 text-center">
          <span className="text-muted-foreground text-xs block mb-1">Deployer</span>
          <span className="font-mono text-xs text-foreground">{shortenAddr(data.deployer)}</span>
        </div>
      )}
      {data.deployed_block && (
        <div className="bg-muted/20 rounded-lg p-4 text-center">
          <span className="text-muted-foreground text-xs block mb-1">Deploy Block</span>
          <span className="font-bold text-foreground">{formatNum(data.deployed_block)}</span>
        </div>
      )}
    </div>
  );
}

function CollectionSalesTab({ address, chain }: { address: string; chain: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["nft-collection-sales", address, chain],
    queryFn: async () => {
      const res = await fetch(`/api/nfts/sales/${address}?chain=${chain}`);
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 60000,
  });

  const sales = Array.isArray(data) ? data : [];

  if (isLoading) return <div className="text-center py-4 text-muted-foreground">Loading sales...</div>;
  if (isError) return <ErrorDisplay message="Failed to load sales" />;
  if (sales.length === 0) return <div className="text-center py-4 text-muted-foreground">No sales data available</div>;

  return (
    <div className="space-y-2 max-h-[500px] overflow-y-auto">
      <p className="text-xs text-muted-foreground mb-2">{sales.length} recent sales</p>
      {sales.map((sale: any, i: number) => {
        const totalWei = parseInt(sale.sellerFee?.amount || "0") + parseInt(sale.protocolFee?.amount || "0") + parseInt(sale.royaltyFee?.amount || "0");
        const symbol = sale.sellerFee?.symbol || "ETH";
        return (
          <div key={i} className="flex items-center justify-between bg-muted/20 rounded-lg p-3 border border-border/30" data-testid={`sale-row-${i}`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-3.5 h-3.5 text-green-400 shrink-0" />
                <span className="text-xs font-medium">Token #{sale.tokenId}</span>
                <Badge className="text-[10px] bg-muted/30 border-border">{sale.marketplace}</Badge>
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5 flex gap-2">
                <span>From: {shortenAddr(sale.sellerAddress)}</span>
                <span>To: {shortenAddr(sale.buyerAddress)}</span>
              </div>
            </div>
            <div className="text-right shrink-0 ml-2">
              <span className="text-sm font-bold text-green-400">{weiToEth(totalWei.toString())}</span>
              <span className="text-[10px] text-muted-foreground block">{symbol}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function NftLookup() {
  const [chain, setChain] = useState("ethereum");
  const [contract, setContract] = useState("");
  const [tokenId, setTokenId] = useState("");
  const [lookupKey, setLookupKey] = useState({ chain: "", contract: "", tokenId: "" });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["nft-lookup", lookupKey.chain, lookupKey.contract, lookupKey.tokenId],
    queryFn: async () => {
      if (!lookupKey.contract || !lookupKey.tokenId) return null;
      const res = await fetch(`/api/nfts/asset/${lookupKey.chain}/${lookupKey.contract}/${lookupKey.tokenId}`);
      if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error || "Not found"); }
      return res.json();
    },
    enabled: !!lookupKey.contract && !!lookupKey.tokenId, staleTime: 60000,
  });

  function doLookup() {
    if (contract.trim() && tokenId.trim()) {
      setLookupKey({ chain, contract: contract.trim(), tokenId: tokenId.trim() });
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2" data-testid="text-nft-lookup-title">
        <Eye className="w-5 h-5 text-primary" /> NFT Lookup
      </h2>
      <p className="text-sm text-muted-foreground">Look up any individual NFT by its contract address and token ID</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <select value={chain} onChange={(e) => setChain(e.target.value)}
          className="bg-muted/30 border border-border/50 rounded-md px-3 py-2 text-sm" data-testid="select-lookup-chain">
          {CHAINS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <Input placeholder="Contract address (0x...)" value={contract} onChange={(e) => setContract(e.target.value)}
          className="bg-muted/30 border-border/50" data-testid="input-lookup-contract" />
        <div className="flex gap-2">
          <Input placeholder="Token ID" value={tokenId} onChange={(e) => setTokenId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doLookup()}
            className="bg-muted/30 border-border/50" data-testid="input-lookup-tokenid" />
          <Button onClick={doLookup} className="bg-primary hover:bg-primary/80 shrink-0" data-testid="button-nft-lookup">
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {isLoading && <div className="text-center py-6 text-muted-foreground">Looking up NFT...</div>}
      {isError && <ErrorDisplay message={(error as Error)?.message || "NFT not found"} />}

      {data && !isLoading && (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="sm:w-1/3">
                {data.image_url ? (
                  <img src={data.image_url} alt={data.name} className="w-full rounded-lg" />
                ) : (
                  <div className="w-full aspect-square bg-muted/30 rounded-lg flex items-center justify-center">
                    <Image className="w-12 h-12 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              <div className="sm:w-2/3 space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold" data-testid="text-lookup-name">{data.name || `#${data.identifier}`}</h3>
                  {data.is_spam && <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px]">Spam</Badge>}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Collection</span><span className="font-medium">{data.collection}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Token ID</span><span className="font-mono text-xs">{data.identifier}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Standard</span><span>{data.token_standard || "—"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Contract</span><span className="font-mono text-xs">{shortenAddr(data.contract)}</span></div>
                  {data.contract_deployer && <div className="flex justify-between"><span className="text-muted-foreground">Deployer</span><span className="font-mono text-xs">{shortenAddr(data.contract_deployer)}</span></div>}
                  {data.total_supply && <div className="flex justify-between"><span className="text-muted-foreground">Collection Supply</span><span>{formatNum(parseInt(data.total_supply))}</span></div>}
                  {data.rarity && <div className="flex justify-between"><span className="text-muted-foreground">Rarity Rank</span><span className="font-bold text-primary">#{data.rarity.rank}</span></div>}
                </div>
                {data.description && (
                  <div>
                    <span className="text-muted-foreground text-sm block mb-1">Description</span>
                    <p className="text-xs text-foreground/80 line-clamp-4">{data.description}</p>
                  </div>
                )}
                {data.traits && data.traits.length > 0 && (
                  <div>
                    <span className="text-muted-foreground text-sm block mb-2">Traits</span>
                    <div className="flex flex-wrap gap-1.5">
                      {data.traits.map((t: any, i: number) => (
                        <Badge key={i} className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                          {t.trait_type}: {t.value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-2 flex-wrap pt-2">
                  {data.opensea_url && (
                    <a href={data.opensea_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/20 text-primary text-xs font-medium hover:bg-primary/30 transition-colors">
                      View on OpenSea <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {data.metadata_url && (
                    <a href={data.metadata_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted/30 text-muted-foreground text-xs font-medium hover:text-foreground transition-colors">
                      Metadata <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function NftsPage() {
  const [tab, setTab] = useState<"trending" | "search" | "wallet" | "detail" | "lookup">("trending");
  const [selectedCollection, setSelectedCollection] = useState("");

  function handleSelectCollection(addr: string) {
    setSelectedCollection(addr);
    setTab("detail");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold" data-testid="text-nft-page-title">NFT Explorer</h1>
          <p className="text-sm text-muted-foreground mt-1">Browse collections, search NFTs, view sales history, and look up wallet holdings</p>
        </div>

        <div className="flex gap-1 bg-muted/30 rounded-lg p-1 w-fit flex-wrap">
          {([
            { key: "trending", label: "Top Collections", icon: TrendingUp },
            { key: "search", label: "Search", icon: Search },
            { key: "wallet", label: "Wallet", icon: Wallet },
            { key: "detail", label: "Collection", icon: Layers },
            { key: "lookup", label: "NFT Lookup", icon: Eye },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === key ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
              data-testid={`tab-nft-${key}`}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {tab === "trending" && <TrendingCollections onSelectCollection={handleSelectCollection} />}
        {tab === "search" && <CollectionSearch onSelectCollection={handleSelectCollection} />}
        {tab === "wallet" && <WalletNfts />}
        {tab === "detail" && <CollectionDetail initialAddress={selectedCollection} />}
        {tab === "lookup" && <NftLookup />}
      </main>
    </div>
  );
}
