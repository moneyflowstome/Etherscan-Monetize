import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search, ExternalLink, TrendingUp, Image, Wallet, ChevronDown, ChevronUp, X,
  Activity, Tag, ShoppingCart, HandCoins, BarChart3, Layers, Eye
} from "lucide-react";

const CHAINS = [
  { value: "ethereum", label: "Ethereum" },
  { value: "polygon", label: "Polygon" },
  { value: "arbitrum", label: "Arbitrum" },
  { value: "optimism", label: "Optimism" },
  { value: "base", label: "Base" },
  { value: "avalanche", label: "Avalanche" },
  { value: "bsc", label: "BSC" },
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

function timeAgo(ts: string | number | undefined) {
  if (!ts) return "";
  const diff = Date.now() - new Date(typeof ts === "number" ? ts * 1000 : ts).getTime();
  if (diff < 60000) return "just now";
  if (diff < 3600000) return Math.floor(diff / 60000) + "m ago";
  if (diff < 86400000) return Math.floor(diff / 3600000) + "h ago";
  return Math.floor(diff / 86400000) + "d ago";
}

function weiToEth(wei: string | number | undefined) {
  if (!wei) return "—";
  const n = typeof wei === "string" ? parseFloat(wei) : wei;
  if (isNaN(n)) return "—";
  const eth = n / 1e18;
  return eth < 0.0001 ? "<0.0001" : eth.toFixed(eth < 1 ? 4 : 2);
}

function shortenAddr(addr: string | undefined) {
  if (!addr) return "—";
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

function ErrorDisplay({ message }: { message: string }) {
  return (
    <div className="text-center py-12 text-red-400">
      <p className="font-medium mb-1">Failed to load data</p>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function LoadingSkeleton({ count = 8, aspect = true }: { count?: number; aspect?: boolean }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="bg-card/50 border-border/50 animate-pulse">
          <CardContent className="p-4">
            {aspect && <div className="w-full aspect-square rounded-lg bg-muted/30 mb-3" />}
            <div className="h-4 bg-muted/30 rounded w-3/4 mb-2" />
            <div className="h-3 bg-muted/30 rounded w-1/2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TrendingCollections() {
  const [chain, setChain] = useState("ethereum");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["opensea-trending", chain],
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
          <TrendingUp className="w-5 h-5 text-primary" /> Trending Collections
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
            <CollectionCard key={c.collection || i} collection={c} rank={i + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function CollectionCard({ collection: c, rank }: { collection: any; rank: number }) {
  return (
    <Card className="bg-card/50 border-border/50 hover:border-primary/30 transition-all group" data-testid={`collection-card-${rank}`}>
      <CardContent className="p-4">
        <div className="relative mb-3">
          {c.image_url ? (
            <img src={c.image_url} alt={c.name} className="w-full aspect-square object-cover rounded-lg bg-muted/30" loading="lazy"
              onError={(e) => { (e.target as HTMLImageElement).src = ""; (e.target as HTMLImageElement).className = "w-full aspect-square rounded-lg bg-muted/30 flex items-center justify-center"; }} />
          ) : (
            <div className="w-full aspect-square rounded-lg bg-muted/30 flex items-center justify-center"><Image className="w-10 h-10 text-muted-foreground/30" /></div>
          )}
          <Badge className="absolute top-2 left-2 bg-background/80 backdrop-blur text-foreground border-border text-[10px]">#{rank}</Badge>
          {c.safelist_request_status === "verified" && <Badge className="absolute top-2 right-2 bg-blue-500/80 text-white border-0 text-[10px]">Verified</Badge>}
        </div>
        <h3 className="font-bold text-sm truncate mb-1" data-testid={`text-collection-name-${rank}`}>{c.name || "Unknown"}</h3>
        <div className="grid grid-cols-2 gap-2 text-xs mt-3">
          {c.stats?.floor_price != null && <StatBox label="Floor" value={`${formatEth(c.stats.floor_price)} ${c.payment_tokens?.[0]?.symbol || "ETH"}`} />}
          {c.stats?.total_volume != null && <StatBox label="Volume" value={formatEth(c.stats.total_volume)} />}
          {c.stats?.num_owners != null && <StatBox label="Owners" value={formatNum(c.stats.num_owners)} />}
          {c.stats?.total_supply != null && <StatBox label="Supply" value={formatNum(c.stats.total_supply)} />}
        </div>
        {c.opensea_url && (
          <a href={c.opensea_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1 mt-3 text-xs text-primary hover:underline" data-testid={`link-opensea-${rank}`}>
            View on OpenSea <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </CardContent>
    </Card>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/20 rounded-lg p-2">
      <span className="text-muted-foreground block">{label}</span>
      <span className="font-bold text-foreground">{value}</span>
    </div>
  );
}

function CollectionSearch() {
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["opensea-search", searchTerm],
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
        <Input placeholder="Search by collection name..." value={query} onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && query.trim() && setSearchTerm(query.trim())}
          className="bg-muted/30 border-border/50" data-testid="input-nft-search" />
        <Button onClick={() => query.trim() && setSearchTerm(query.trim())} className="bg-primary hover:bg-primary/80" data-testid="button-nft-search">
          <Search className="w-4 h-4" />
        </Button>
      </div>
      {isLoading && <div className="text-center py-6 text-muted-foreground">Searching across multiple chains...</div>}
      {isError && <ErrorDisplay message="Search failed" />}
      {searchTerm && !isLoading && !isError && results.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">No collections found for "{searchTerm}"</div>
      )}
      {results.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {results.map((c: any, i: number) => <CollectionCard key={c.collection || i} collection={c} rank={i + 1} />)}
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

  const { data, isLoading, isError } = useQuery({
    queryKey: ["opensea-wallet", walletAddr, chain],
    queryFn: async () => {
      if (!walletAddr) return [];
      const res = await fetch(`/api/nfts/wallet/${walletAddr}?chain=${chain}`);
      if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error || "Failed"); }
      return res.json();
    },
    enabled: !!walletAddr, staleTime: 60000,
  });

  const { data: walletCollections, isLoading: collLoading } = useQuery({
    queryKey: ["opensea-wallet-collections", walletAddr],
    queryFn: async () => {
      if (!walletAddr) return [];
      const res = await fetch(`/api/nfts/account/${walletAddr}/collections`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!walletAddr && showCollections, staleTime: 60000,
  });

  const nfts = Array.isArray(data) ? data : [];
  const collections = Array.isArray(walletCollections) ? walletCollections : [];

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
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">{nfts.length} NFTs found</p>
            <button onClick={() => setShowCollections(!showCollections)}
              className="text-xs text-primary hover:underline flex items-center gap-1" data-testid="button-toggle-wallet-collections">
              <Layers className="w-3 h-3" /> {showCollections ? "Hide" : "Show"} Wallet Collections
            </button>
          </div>

          {showCollections && (
            <div className="mb-4">
              {collLoading ? <div className="text-sm text-muted-foreground">Loading collections...</div> :
               collections.length === 0 ? <div className="text-sm text-muted-foreground">No collections owned</div> : (
                <div className="flex flex-wrap gap-2">
                  {collections.map((c: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 bg-muted/20 rounded-lg px-3 py-2 border border-border/30">
                      {c.image_url && <img src={c.image_url} alt="" className="w-6 h-6 rounded" />}
                      <span className="text-xs font-medium">{c.name || c.collection}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {nfts.map((nft: any, i: number) => (
              <div key={nft.identifier + "-" + i}
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
            {nft.description && <div><span className="text-muted-foreground block mb-1">Description</span><p className="text-xs text-foreground/80">{nft.description}</p></div>}
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

function CollectionDetail() {
  const [slug, setSlug] = useState("");
  const [searchSlug, setSearchSlug] = useState("");
  const [detailTab, setDetailTab] = useState<"nfts" | "activity" | "listings" | "offers" | "traits" | "stats">("nfts");

  const { data: detail, isLoading, isError } = useQuery({
    queryKey: ["opensea-collection", searchSlug],
    queryFn: async () => {
      if (!searchSlug) return null;
      const res = await fetch(`/api/nfts/collection/${searchSlug}`);
      if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error || "Not found"); }
      return res.json();
    },
    enabled: !!searchSlug, staleTime: 60000,
  });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Image className="w-5 h-5 text-primary" /> Collection Explorer
      </h2>
      <div className="flex gap-2">
        <Input placeholder="Enter collection slug (e.g. boredapeyachtclub)" value={slug} onChange={(e) => setSlug(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && slug.trim() && (setSearchSlug(slug.trim()), setDetailTab("nfts"))}
          className="bg-muted/30 border-border/50" data-testid="input-collection-slug" />
        <Button onClick={() => slug.trim() && (setSearchSlug(slug.trim()), setDetailTab("nfts"))} className="bg-primary hover:bg-primary/80" data-testid="button-collection-lookup">
          <Search className="w-4 h-4" />
        </Button>
      </div>

      {isLoading && <div className="text-center py-6 text-muted-foreground">Loading collection...</div>}
      {isError && <ErrorDisplay message="Collection not found" />}

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
                {detail.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{detail.description}</p>}
                <div className="flex gap-2 flex-wrap">
                  {detail.opensea_url && <a href={detail.opensea_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">OpenSea <ExternalLink className="w-3 h-3" /></a>}
                  {detail.project_url && <a href={detail.project_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">Website <ExternalLink className="w-3 h-3" /></a>}
                  {detail.discord_url && <a href={detail.discord_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">Discord <ExternalLink className="w-3 h-3" /></a>}
                  {detail.twitter_username && <a href={`https://twitter.com/${detail.twitter_username}`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">Twitter <ExternalLink className="w-3 h-3" /></a>}
                </div>
              </div>
            </div>

            <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
              {([
                { key: "nfts", label: "NFTs", icon: Image },
                { key: "stats", label: "Stats", icon: BarChart3 },
                { key: "activity", label: "Activity", icon: Activity },
                { key: "listings", label: "Listings", icon: ShoppingCart },
                { key: "offers", label: "Offers", icon: HandCoins },
                { key: "traits", label: "Traits", icon: Tag },
              ] as const).map(({ key, label, icon: Icon }) => (
                <button key={key} onClick={() => setDetailTab(key)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${detailTab === key ? "bg-primary/20 text-primary border border-primary/30" : "bg-muted/30 text-muted-foreground hover:text-foreground border border-border/30"}`}
                  data-testid={`button-detail-tab-${key}`}>
                  <Icon className="w-3.5 h-3.5" /> {label}
                </button>
              ))}
            </div>

            {detailTab === "nfts" && <CollectionNftsTab slug={searchSlug} />}
            {detailTab === "stats" && <CollectionStatsTab slug={searchSlug} />}
            {detailTab === "activity" && <CollectionActivityTab slug={searchSlug} />}
            {detailTab === "listings" && <CollectionListingsTab slug={searchSlug} />}
            {detailTab === "offers" && <CollectionOffersTab slug={searchSlug} />}
            {detailTab === "traits" && <CollectionTraitsTab slug={searchSlug} />}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CollectionNftsTab({ slug }: { slug: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["opensea-collection-nfts", slug],
    queryFn: async () => {
      const res = await fetch(`/api/nfts/collection/${slug}/nfts`);
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

function CollectionStatsTab({ slug }: { slug: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["opensea-collection-stats", slug],
    queryFn: async () => {
      const res = await fetch(`/api/nfts/collection/${slug}/stats`);
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 60000,
  });

  if (isLoading) return <div className="text-center py-4 text-muted-foreground">Loading stats...</div>;
  if (isError || !data) return <div className="text-center py-4 text-muted-foreground">Stats unavailable</div>;

  const s = data?.total || data;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {s.floor_price != null && (
          <div className="bg-muted/20 rounded-lg p-4 text-center">
            <span className="text-muted-foreground text-xs block mb-1">Floor Price</span>
            <span className="font-bold text-xl text-foreground">{formatEth(s.floor_price)}</span>
            <span className="text-xs text-muted-foreground block">{s.floor_price_symbol || "ETH"}</span>
          </div>
        )}
        {s.total_volume != null && (
          <div className="bg-muted/20 rounded-lg p-4 text-center">
            <span className="text-muted-foreground text-xs block mb-1">Total Volume</span>
            <span className="font-bold text-xl text-foreground">{formatEth(s.total_volume)}</span>
            <span className="text-xs text-muted-foreground block">ETH</span>
          </div>
        )}
        {s.total_sales != null && (
          <div className="bg-muted/20 rounded-lg p-4 text-center">
            <span className="text-muted-foreground text-xs block mb-1">Total Sales</span>
            <span className="font-bold text-xl text-foreground">{formatNum(s.total_sales)}</span>
          </div>
        )}
        {s.average_price != null && (
          <div className="bg-muted/20 rounded-lg p-4 text-center">
            <span className="text-muted-foreground text-xs block mb-1">Avg Price</span>
            <span className="font-bold text-xl text-foreground">{formatEth(s.average_price)}</span>
            <span className="text-xs text-muted-foreground block">ETH</span>
          </div>
        )}
        {s.num_owners != null && (
          <div className="bg-muted/20 rounded-lg p-4 text-center">
            <span className="text-muted-foreground text-xs block mb-1">Owners</span>
            <span className="font-bold text-xl text-foreground">{formatNum(s.num_owners)}</span>
          </div>
        )}
        {s.total_supply != null && (
          <div className="bg-muted/20 rounded-lg p-4 text-center">
            <span className="text-muted-foreground text-xs block mb-1">Total Supply</span>
            <span className="font-bold text-xl text-foreground">{formatNum(s.total_supply)}</span>
          </div>
        )}
        {s.market_cap != null && (
          <div className="bg-muted/20 rounded-lg p-4 text-center">
            <span className="text-muted-foreground text-xs block mb-1">Market Cap</span>
            <span className="font-bold text-xl text-foreground">{formatEth(s.market_cap)}</span>
            <span className="text-xs text-muted-foreground block">ETH</span>
          </div>
        )}
      </div>

      {data?.intervals && (
        <div>
          <h4 className="text-sm font-bold mb-2">Time Intervals</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-muted-foreground">Period</th>
                  <th className="text-right py-2 text-muted-foreground">Volume</th>
                  <th className="text-right py-2 text-muted-foreground">Volume Change</th>
                  <th className="text-right py-2 text-muted-foreground">Sales</th>
                  <th className="text-right py-2 text-muted-foreground">Avg Price</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(data.intervals || {}).map(([period, stats]: [string, any]) => (
                  <tr key={period} className="border-b border-border/30">
                    <td className="py-2 font-medium">{period}</td>
                    <td className="py-2 text-right">{formatEth(stats.volume)}</td>
                    <td className={`py-2 text-right ${stats.volume_change > 0 ? "text-green-400" : stats.volume_change < 0 ? "text-red-400" : ""}`}>
                      {stats.volume_change != null ? (stats.volume_change > 0 ? "+" : "") + (stats.volume_change * 100).toFixed(1) + "%" : "—"}
                    </td>
                    <td className="py-2 text-right">{formatNum(stats.sales)}</td>
                    <td className="py-2 text-right">{formatEth(stats.average_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function CollectionActivityTab({ slug }: { slug: string }) {
  const [eventType, setEventType] = useState("");
  const eventTypes = [
    { value: "", label: "All" },
    { value: "sale", label: "Sales" },
    { value: "listing", label: "Listings" },
    { value: "transfer", label: "Transfers" },
    { value: "offer", label: "Offers" },
    { value: "cancel", label: "Cancellations" },
  ];

  const { data, isLoading, isError } = useQuery({
    queryKey: ["opensea-events", slug, eventType],
    queryFn: async () => {
      const res = await fetch(`/api/nfts/events?collection=${slug}${eventType ? `&event_type=${eventType}` : ""}`);
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 30000,
  });

  const events = Array.isArray(data) ? data : [];

  return (
    <div className="space-y-3">
      <div className="flex gap-1 flex-wrap">
        {eventTypes.map(t => (
          <button key={t.value} onClick={() => setEventType(t.value)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${eventType === t.value ? "bg-primary/20 text-primary border border-primary/30" : "bg-muted/30 text-muted-foreground hover:text-foreground border border-border/30"}`}
            data-testid={`button-event-${t.value || "all"}`}>{t.label}</button>
        ))}
      </div>

      {isLoading && <div className="text-center py-4 text-muted-foreground">Loading activity...</div>}
      {isError && <ErrorDisplay message="Failed to load events" />}

      {events.length === 0 && !isLoading && <div className="text-center py-4 text-muted-foreground">No events found</div>}

      {events.length > 0 && (
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {events.map((ev: any, i: number) => (
            <div key={i} className="flex items-center gap-3 bg-muted/20 rounded-lg p-3 border border-border/30" data-testid={`event-row-${i}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                ev.event_type === "sale" ? "bg-green-500/20 text-green-400" :
                ev.event_type === "listing" ? "bg-blue-500/20 text-blue-400" :
                ev.event_type === "transfer" ? "bg-purple-500/20 text-purple-400" :
                ev.event_type === "offer" ? "bg-yellow-500/20 text-yellow-400" :
                "bg-muted/30 text-muted-foreground"
              }`}>
                {ev.event_type === "sale" ? <ShoppingCart className="w-4 h-4" /> :
                 ev.event_type === "listing" ? <Tag className="w-4 h-4" /> :
                 ev.event_type === "transfer" ? <Activity className="w-4 h-4" /> :
                 ev.event_type === "offer" ? <HandCoins className="w-4 h-4" /> :
                 <Activity className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold capitalize">{ev.event_type || "Event"}</span>
                  {ev.nft?.name && <span className="text-xs text-muted-foreground truncate">{ev.nft.name}</span>}
                  {!ev.nft?.name && ev.nft?.identifier && <span className="text-xs text-muted-foreground">#{ev.nft.identifier}</span>}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                  {ev.payment?.quantity && <span className="font-medium text-foreground">{weiToEth(ev.payment.quantity)} ETH</span>}
                  {ev.seller && <span>From: {shortenAddr(ev.seller)}</span>}
                  {ev.buyer && <span>To: {shortenAddr(ev.buyer)}</span>}
                  {ev.from_address && <span>From: {shortenAddr(ev.from_address)}</span>}
                  {ev.to_address && <span>To: {shortenAddr(ev.to_address)}</span>}
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground shrink-0">
                {timeAgo(ev.event_timestamp || ev.created_date || ev.closing_date)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CollectionListingsTab({ slug }: { slug: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["opensea-listings", slug],
    queryFn: async () => {
      const res = await fetch(`/api/nfts/listings/${slug}`);
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 30000,
  });

  const listings = Array.isArray(data) ? data : [];

  if (isLoading) return <div className="text-center py-4 text-muted-foreground">Loading listings...</div>;
  if (isError) return <ErrorDisplay message="Failed to load listings" />;
  if (listings.length === 0) return <div className="text-center py-4 text-muted-foreground">No active listings</div>;

  return (
    <div className="space-y-2 max-h-[500px] overflow-y-auto">
      <p className="text-xs text-muted-foreground mb-2">{listings.length} active listings</p>
      {listings.map((listing: any, i: number) => {
        const price = listing.price?.current;
        const priceEth = price?.value ? weiToEth(price.value) : "—";
        const nft = listing.protocol_data?.parameters?.offer?.[0];
        return (
          <div key={i} className="flex items-center justify-between bg-muted/20 rounded-lg p-3 border border-border/30" data-testid={`listing-row-${i}`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs font-medium">Token #{nft?.identifierOrCriteria || "?"}</span>
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {listing.protocol_data?.parameters?.offerer && <span>By: {shortenAddr(listing.protocol_data.parameters.offerer)}</span>}
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-sm font-bold text-primary">{priceEth}</span>
              <span className="text-[10px] text-muted-foreground block">{price?.currency || "ETH"}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CollectionOffersTab({ slug }: { slug: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["opensea-offers", slug],
    queryFn: async () => {
      const res = await fetch(`/api/nfts/offers/${slug}`);
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 30000,
  });

  const offers = Array.isArray(data) ? data : [];

  if (isLoading) return <div className="text-center py-4 text-muted-foreground">Loading offers...</div>;
  if (isError) return <ErrorDisplay message="Failed to load offers" />;
  if (offers.length === 0) return <div className="text-center py-4 text-muted-foreground">No active offers</div>;

  return (
    <div className="space-y-2 max-h-[500px] overflow-y-auto">
      <p className="text-xs text-muted-foreground mb-2">{offers.length} active offers</p>
      {offers.map((offer: any, i: number) => {
        const price = offer.price?.current;
        const priceEth = price?.value ? weiToEth(price.value) : "—";
        return (
          <div key={i} className="flex items-center justify-between bg-muted/20 rounded-lg p-3 border border-border/30" data-testid={`offer-row-${i}`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <HandCoins className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-xs font-medium">Offer</span>
                {offer.protocol_data?.parameters?.consideration?.[0]?.identifierOrCriteria && (
                  <span className="text-[10px] text-muted-foreground">Token #{offer.protocol_data.parameters.consideration[0].identifierOrCriteria}</span>
                )}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {offer.protocol_data?.parameters?.offerer && <span>From: {shortenAddr(offer.protocol_data.parameters.offerer)}</span>}
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-sm font-bold text-yellow-400">{priceEth}</span>
              <span className="text-[10px] text-muted-foreground block">{price?.currency || "WETH"}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CollectionTraitsTab({ slug }: { slug: string }) {
  const [expandedTrait, setExpandedTrait] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["opensea-traits", slug],
    queryFn: async () => {
      const res = await fetch(`/api/nfts/traits/${slug}`);
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 120000,
  });

  if (isLoading) return <div className="text-center py-4 text-muted-foreground">Loading traits...</div>;
  if (isError || !data) return <div className="text-center py-4 text-muted-foreground">Traits unavailable</div>;

  const categories = data.categories || data;
  const traitEntries = typeof categories === "object" ? Object.entries(categories) : [];

  if (traitEntries.length === 0) return <div className="text-center py-4 text-muted-foreground">No traits data</div>;

  return (
    <div className="space-y-2 max-h-[500px] overflow-y-auto">
      {traitEntries.map(([traitType, values]: [string, any]) => {
        const isExpanded = expandedTrait === traitType;
        const valueEntries = typeof values === "object" && values !== null ? Object.entries(values) : [];
        return (
          <div key={traitType} className="bg-muted/20 rounded-lg border border-border/30">
            <button onClick={() => setExpandedTrait(isExpanded ? null : traitType)}
              className="w-full flex items-center justify-between p-3 text-left" data-testid={`button-trait-${traitType}`}>
              <div className="flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-bold">{traitType}</span>
                <Badge className="bg-muted/30 text-muted-foreground border-border text-[10px]">{valueEntries.length} values</Badge>
              </div>
              {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>
            {isExpanded && valueEntries.length > 0 && (
              <div className="px-3 pb-3 flex flex-wrap gap-1.5">
                {valueEntries.slice(0, 50).map(([value, count]: [string, any]) => (
                  <Badge key={value} className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                    {value} <span className="ml-1 text-muted-foreground">({typeof count === "number" ? count : JSON.stringify(count)})</span>
                  </Badge>
                ))}
                {valueEntries.length > 50 && <span className="text-[10px] text-muted-foreground">+{valueEntries.length - 50} more</span>}
              </div>
            )}
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
    queryKey: ["opensea-nft-lookup", lookupKey.chain, lookupKey.contract, lookupKey.tokenId],
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
                <h3 className="text-lg font-bold" data-testid="text-lookup-name">{data.name || `#${data.identifier}`}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Collection</span><span className="font-medium">{data.collection}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Token ID</span><span className="font-mono text-xs">{data.identifier}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Standard</span><span>{data.token_standard || "—"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Contract</span><span className="font-mono text-xs">{shortenAddr(data.contract)}</span></div>
                  {data.creator && <div className="flex justify-between"><span className="text-muted-foreground">Creator</span><span className="font-mono text-xs">{shortenAddr(data.creator)}</span></div>}
                  {data.owners && data.owners.length > 0 && (
                    <div className="flex justify-between"><span className="text-muted-foreground">Owner</span><span className="font-mono text-xs">{shortenAddr(data.owners[0]?.address)}</span></div>
                  )}
                  {data.rarity && <div className="flex justify-between"><span className="text-muted-foreground">Rarity Rank</span><span className="font-bold text-primary">#{data.rarity.rank}</span></div>}
                </div>
                {data.description && (
                  <div>
                    <span className="text-muted-foreground text-sm block mb-1">Description</span>
                    <p className="text-xs text-foreground/80">{data.description}</p>
                  </div>
                )}
                {data.traits && data.traits.length > 0 && (
                  <div>
                    <span className="text-muted-foreground text-sm block mb-2">Traits</span>
                    <div className="flex flex-wrap gap-1.5">
                      {data.traits.map((t: any, i: number) => (
                        <Badge key={i} className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                          {t.trait_type}: {t.value} {t.display_type === "number" && t.max_value ? `/ ${t.max_value}` : ""}
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold" data-testid="text-nft-page-title">NFT Explorer</h1>
            <p className="text-sm text-muted-foreground mt-1">Browse collections, activity, listings, offers, traits, and wallet holdings via OpenSea</p>
          </div>
        </div>

        <div className="flex gap-1 bg-muted/30 rounded-lg p-1 w-fit flex-wrap">
          {([
            { key: "trending", label: "Trending", icon: TrendingUp },
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

        {tab === "trending" && <TrendingCollections />}
        {tab === "search" && <CollectionSearch />}
        {tab === "wallet" && <WalletNfts />}
        {tab === "detail" && <CollectionDetail />}
        {tab === "lookup" && <NftLookup />}
      </main>
    </div>
  );
}
