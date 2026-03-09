import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ExternalLink, TrendingUp, Image, Wallet, ChevronDown, ChevronUp, X } from "lucide-react";

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

function TrendingCollections() {
  const [chain, setChain] = useState("ethereum");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["opensea-trending", chain],
    queryFn: async () => {
      const res = await fetch(`/api/nfts/collections?chain=${chain}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Error ${res.status}`);
      }
      return res.json();
    },
    staleTime: 120000,
    retry: 1,
  });

  const collections = Array.isArray(data) ? data : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold flex items-center gap-2" data-testid="text-trending-title">
          <TrendingUp className="w-5 h-5 text-primary" />
          Trending Collections
        </h2>
        <div className="flex gap-1 flex-wrap">
          {CHAINS.map((c) => (
            <button
              key={c.value}
              onClick={() => setChain(c.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                chain === c.value
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-muted/30 text-muted-foreground hover:text-foreground border border-border/30"
              }`}
              data-testid={`button-chain-${c.value}`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {isError ? (
        <div className="text-center py-12 text-red-400" data-testid="text-trending-error">
          <p className="font-medium mb-1">Failed to load collections</p>
          <p className="text-sm text-muted-foreground">{(error as Error)?.message || "Unknown error"}</p>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="bg-card/50 border-border/50 animate-pulse">
              <CardContent className="p-4">
                <div className="w-full aspect-square rounded-lg bg-muted/30 mb-3" />
                <div className="h-4 bg-muted/30 rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted/30 rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : collections.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Image className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No collections found</p>
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
            <img
              src={c.image_url}
              alt={c.name}
              className="w-full aspect-square object-cover rounded-lg bg-muted/30"
              loading="lazy"
              onError={(e) => { (e.target as HTMLImageElement).src = ""; (e.target as HTMLImageElement).className = "w-full aspect-square rounded-lg bg-muted/30 flex items-center justify-center"; }}
            />
          ) : (
            <div className="w-full aspect-square rounded-lg bg-muted/30 flex items-center justify-center">
              <Image className="w-10 h-10 text-muted-foreground/30" />
            </div>
          )}
          <Badge className="absolute top-2 left-2 bg-background/80 backdrop-blur text-foreground border-border text-[10px]">#{rank}</Badge>
          {c.safelist_request_status === "verified" && (
            <Badge className="absolute top-2 right-2 bg-blue-500/80 text-white border-0 text-[10px]">Verified</Badge>
          )}
        </div>

        <h3 className="font-bold text-sm truncate mb-1" data-testid={`text-collection-name-${rank}`}>{c.name || "Unknown"}</h3>

        <div className="grid grid-cols-2 gap-2 text-xs mt-3">
          {c.stats?.floor_price !== undefined && c.stats.floor_price !== null && (
            <div className="bg-muted/20 rounded-lg p-2">
              <span className="text-muted-foreground block">Floor</span>
              <span className="font-bold text-foreground">{formatEth(c.stats.floor_price)} {c.payment_tokens?.[0]?.symbol || "ETH"}</span>
            </div>
          )}
          {c.stats?.total_volume !== undefined && (
            <div className="bg-muted/20 rounded-lg p-2">
              <span className="text-muted-foreground block">Volume</span>
              <span className="font-bold text-foreground">{formatEth(c.stats.total_volume)}</span>
            </div>
          )}
          {c.stats?.num_owners !== undefined && (
            <div className="bg-muted/20 rounded-lg p-2">
              <span className="text-muted-foreground block">Owners</span>
              <span className="font-bold text-foreground">{formatNum(c.stats.num_owners)}</span>
            </div>
          )}
          {c.stats?.total_supply !== undefined && (
            <div className="bg-muted/20 rounded-lg p-2">
              <span className="text-muted-foreground block">Supply</span>
              <span className="font-bold text-foreground">{formatNum(c.stats.total_supply)}</span>
            </div>
          )}
        </div>

        {c.opensea_url && (
          <a
            href={c.opensea_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 mt-3 text-xs text-primary hover:underline"
            data-testid={`link-opensea-${rank}`}
          >
            View on OpenSea <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </CardContent>
    </Card>
  );
}

function CollectionSearch() {
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["opensea-search", searchTerm],
    queryFn: async () => {
      if (!searchTerm) return [];
      const res = await fetch(`/api/nfts/search?q=${encodeURIComponent(searchTerm)}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!searchTerm,
    staleTime: 60000,
  });

  const results = Array.isArray(data) ? data : [];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2" data-testid="text-search-title">
        <Search className="w-5 h-5 text-primary" />
        Search Collections
      </h2>
      <div className="flex gap-2">
        <Input
          placeholder="Search by collection name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && query.trim() && setSearchTerm(query.trim())}
          className="bg-muted/30 border-border/50"
          data-testid="input-nft-search"
        />
        <Button
          onClick={() => query.trim() && setSearchTerm(query.trim())}
          className="bg-primary hover:bg-primary/80"
          data-testid="button-nft-search"
        >
          <Search className="w-4 h-4" />
        </Button>
      </div>

      {isLoading && <div className="text-center py-6 text-muted-foreground">Searching...</div>}

      {searchTerm && !isLoading && results.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">No collections found for &ldquo;{searchTerm}&rdquo;</div>
      )}

      {results.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {results.map((c: any, i: number) => (
            <CollectionCard key={c.collection || i} collection={c} rank={i + 1} />
          ))}
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

  const { data, isLoading } = useQuery({
    queryKey: ["opensea-wallet", walletAddr, chain],
    queryFn: async () => {
      if (!walletAddr) return [];
      const res = await fetch(`/api/nfts/wallet/${walletAddr}?chain=${chain}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!walletAddr,
    staleTime: 60000,
  });

  const nfts = Array.isArray(data) ? data : [];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2" data-testid="text-wallet-nft-title">
        <Wallet className="w-5 h-5 text-primary" />
        Wallet NFTs
      </h2>
      <div className="flex gap-2 flex-wrap">
        <Input
          placeholder="Enter wallet address (0x...)"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && address.trim() && setWalletAddr(address.trim())}
          className="bg-muted/30 border-border/50 flex-1 min-w-[200px]"
          data-testid="input-wallet-nft"
        />
        <select
          value={chain}
          onChange={(e) => setChain(e.target.value)}
          className="bg-muted/30 border border-border/50 rounded-md px-3 text-sm"
          data-testid="select-wallet-chain"
        >
          {CHAINS.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <Button
          onClick={() => address.trim() && setWalletAddr(address.trim())}
          className="bg-primary hover:bg-primary/80"
          data-testid="button-wallet-nft-search"
        >
          <Search className="w-4 h-4 mr-1" /> Lookup
        </Button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square rounded-lg bg-muted/30 mb-2" />
              <div className="h-3 bg-muted/30 rounded w-3/4" />
            </div>
          ))}
        </div>
      )}

      {walletAddr && !isLoading && nfts.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Wallet className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No NFTs found for this wallet on {CHAINS.find(c => c.value === chain)?.label}</p>
        </div>
      )}

      {nfts.length > 0 && (
        <div>
          <p className="text-sm text-muted-foreground mb-3">{nfts.length} NFTs found</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {nfts.map((nft: any, i: number) => (
              <div
                key={nft.identifier + "-" + i}
                className="bg-card/50 border border-border/50 rounded-lg overflow-hidden hover:border-primary/30 transition-all cursor-pointer group"
                onClick={() => setSelectedNft(nft)}
                data-testid={`nft-card-${i}`}
              >
                {nft.image_url ? (
                  <img
                    src={nft.image_url}
                    alt={nft.name || `#${nft.identifier}`}
                    className="w-full aspect-square object-cover"
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
                  <div className="w-full aspect-square bg-muted/30 flex items-center justify-center">
                    <Image className="w-8 h-8 text-muted-foreground/30" />
                  </div>
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

      {selectedNft && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedNft(null)}>
          <div className="bg-card border border-border rounded-xl max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-bold text-sm truncate" data-testid="text-nft-detail-name">{selectedNft.name || `#${selectedNft.identifier}`}</h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedNft(null)} data-testid="button-close-nft-detail">
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-4 space-y-4">
              {selectedNft.image_url && (
                <img src={selectedNft.image_url} alt={selectedNft.name} className="w-full rounded-lg" />
              )}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Collection</span>
                  <span className="font-medium">{selectedNft.collection}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Token ID</span>
                  <span className="font-mono text-xs">{selectedNft.identifier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Standard</span>
                  <span>{selectedNft.token_standard || "—"}</span>
                </div>
                {selectedNft.description && (
                  <div>
                    <span className="text-muted-foreground block mb-1">Description</span>
                    <p className="text-xs text-foreground/80">{selectedNft.description}</p>
                  </div>
                )}
                {selectedNft.traits && selectedNft.traits.length > 0 && (
                  <div>
                    <span className="text-muted-foreground block mb-2">Traits</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedNft.traits.map((t: any, i: number) => (
                        <Badge key={i} className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                          {t.trait_type}: {t.value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {selectedNft.opensea_url && (
                <a
                  href={selectedNft.opensea_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-primary/20 text-primary text-sm font-medium hover:bg-primary/30 transition-colors"
                  data-testid="link-nft-opensea"
                >
                  View on OpenSea <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CollectionDetail() {
  const [slug, setSlug] = useState("");
  const [searchSlug, setSearchSlug] = useState("");
  const [showNfts, setShowNfts] = useState(false);

  const { data: detail, isLoading } = useQuery({
    queryKey: ["opensea-collection", searchSlug],
    queryFn: async () => {
      if (!searchSlug) return null;
      const res = await fetch(`/api/nfts/collection/${searchSlug}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!searchSlug,
    staleTime: 60000,
  });

  const { data: collNfts, isLoading: nftsLoading } = useQuery({
    queryKey: ["opensea-collection-nfts", searchSlug],
    queryFn: async () => {
      if (!searchSlug) return [];
      const res = await fetch(`/api/nfts/collection/${searchSlug}/nfts`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!searchSlug && showNfts,
    staleTime: 60000,
  });

  const nftList = Array.isArray(collNfts) ? collNfts : [];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Image className="w-5 h-5 text-primary" />
        Collection Details
      </h2>
      <div className="flex gap-2">
        <Input
          placeholder="Enter collection slug (e.g. boredapeyachtclub)"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && slug.trim() && (setSearchSlug(slug.trim()), setShowNfts(false))}
          className="bg-muted/30 border-border/50"
          data-testid="input-collection-slug"
        />
        <Button
          onClick={() => slug.trim() && (setSearchSlug(slug.trim()), setShowNfts(false))}
          className="bg-primary hover:bg-primary/80"
          data-testid="button-collection-lookup"
        >
          <Search className="w-4 h-4" />
        </Button>
      </div>

      {isLoading && <div className="text-center py-6 text-muted-foreground">Loading collection...</div>}

      {detail && !isLoading && (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              {detail.image_url && (
                <img src={detail.image_url} alt={detail.name} className="w-20 h-20 rounded-xl object-cover shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold truncate" data-testid="text-detail-name">{detail.name}</h3>
                  {detail.safelist_request_status === "verified" && (
                    <Badge className="bg-blue-500 text-white border-0 text-[10px]">Verified</Badge>
                  )}
                </div>
                {detail.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{detail.description}</p>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  {detail.stats?.floor_price !== undefined && detail.stats.floor_price !== null && (
                    <div className="bg-muted/20 rounded-lg p-3 text-center">
                      <span className="text-muted-foreground text-xs block">Floor Price</span>
                      <span className="font-bold text-lg">{formatEth(detail.stats.floor_price)}</span>
                      <span className="text-xs text-muted-foreground block">ETH</span>
                    </div>
                  )}
                  {detail.stats?.total_volume !== undefined && (
                    <div className="bg-muted/20 rounded-lg p-3 text-center">
                      <span className="text-muted-foreground text-xs block">Total Volume</span>
                      <span className="font-bold text-lg">{formatEth(detail.stats.total_volume)}</span>
                      <span className="text-xs text-muted-foreground block">ETH</span>
                    </div>
                  )}
                  {detail.stats?.num_owners !== undefined && (
                    <div className="bg-muted/20 rounded-lg p-3 text-center">
                      <span className="text-muted-foreground text-xs block">Owners</span>
                      <span className="font-bold text-lg">{formatNum(detail.stats.num_owners)}</span>
                    </div>
                  )}
                  {detail.stats?.total_supply !== undefined && (
                    <div className="bg-muted/20 rounded-lg p-3 text-center">
                      <span className="text-muted-foreground text-xs block">Total Supply</span>
                      <span className="font-bold text-lg">{formatNum(detail.stats.total_supply)}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-3 flex-wrap">
                  {detail.opensea_url && (
                    <a href={detail.opensea_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                      OpenSea <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {detail.project_url && (
                    <a href={detail.project_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                      Website <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {detail.discord_url && (
                    <a href={detail.discord_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                      Discord <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {detail.twitter_username && (
                    <a href={`https://twitter.com/${detail.twitter_username}`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                      Twitter <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <button
                onClick={() => setShowNfts(!showNfts)}
                className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                data-testid="button-toggle-nfts"
              >
                {showNfts ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {showNfts ? "Hide" : "Browse"} NFTs in Collection
              </button>

              {showNfts && (
                <div className="mt-4">
                  {nftsLoading ? (
                    <div className="text-center py-4 text-muted-foreground">Loading NFTs...</div>
                  ) : nftList.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">No NFTs found</div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                      {nftList.map((nft: any, i: number) => (
                        <div key={nft.identifier + "-" + i} className="bg-muted/20 rounded-lg overflow-hidden border border-border/30 hover:border-primary/30 transition-all">
                          {nft.image_url ? (
                            <img src={nft.image_url} alt={nft.name || `#${nft.identifier}`} className="w-full aspect-square object-cover" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          ) : (
                            <div className="w-full aspect-square bg-muted/30 flex items-center justify-center">
                              <Image className="w-6 h-6 text-muted-foreground/30" />
                            </div>
                          )}
                          <div className="p-1.5">
                            <p className="text-[10px] font-medium truncate">{nft.name || `#${nft.identifier}`}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function NftsPage() {
  const [tab, setTab] = useState<"trending" | "search" | "wallet" | "detail">("trending");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold" data-testid="text-nft-page-title">NFT Explorer</h1>
            <p className="text-sm text-muted-foreground mt-1">Browse collections, search NFTs, and look up wallet holdings via OpenSea</p>
          </div>
        </div>

        <div className="flex gap-1 bg-muted/30 rounded-lg p-1 w-fit">
          {([
            { key: "trending", label: "Trending", icon: TrendingUp },
            { key: "search", label: "Search", icon: Search },
            { key: "wallet", label: "Wallet NFTs", icon: Wallet },
            { key: "detail", label: "Collection", icon: Image },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === key ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`tab-nft-${key}`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {tab === "trending" && <TrendingCollections />}
        {tab === "search" && <CollectionSearch />}
        {tab === "wallet" && <WalletNfts />}
        {tab === "detail" && <CollectionDetail />}
      </main>
    </div>
  );
}
