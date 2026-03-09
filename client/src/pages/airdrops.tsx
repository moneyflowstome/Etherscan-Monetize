import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Gift,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  Send,
  HelpCircle,
  Sparkles,
  Clock,
  Users,
  Link as LinkIcon,
  CheckCircle2,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const BLOCKCHAINS = ["All", "Ethereum", "BSC", "Polygon", "Solana", "Arbitrum", "Optimism", "Base", "Avalanche", "Fantom", "Cosmos", "Sui", "Aptos", "Other"];
const REWARD_TYPES = ["All", "Task", "Signup", "Hold", "Social", "Testnet", "Other"];

const BLOCKCHAIN_COLORS: Record<string, string> = {
  Ethereum: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  BSC: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  Polygon: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  Solana: "bg-green-500/20 text-green-400 border-green-500/30",
  Arbitrum: "bg-blue-400/20 text-blue-300 border-blue-400/30",
  Optimism: "bg-red-500/20 text-red-400 border-red-500/30",
  Base: "bg-blue-600/20 text-blue-300 border-blue-600/30",
  Avalanche: "bg-red-600/20 text-red-300 border-red-600/30",
  Cosmos: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  Sui: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  Aptos: "bg-teal-500/20 text-teal-400 border-teal-500/30",
};

const FAQ_ITEMS = [
  {
    q: "What is a crypto airdrop?",
    a: "A crypto airdrop is a marketing strategy used by blockchain projects to distribute free tokens or coins to wallet addresses. Projects use airdrops to increase awareness, reward early adopters, and grow their community.",
  },
  {
    q: "Are airdrops really free?",
    a: "Yes, legitimate airdrops are completely free. You should never have to send crypto or pay money to receive an airdrop. Be cautious of scams that ask you to send tokens first or connect your wallet to suspicious websites.",
  },
  {
    q: "How do I participate in airdrops?",
    a: "Each airdrop has its own requirements. Common tasks include: following social media accounts, joining Telegram/Discord groups, completing testnet activities, or simply holding certain tokens. Check each airdrop's steps for specific instructions.",
  },
  {
    q: "How do I keep my crypto safe during airdrops?",
    a: "Never share your private keys or seed phrase. Use a separate wallet for airdrops if possible. Only interact with verified project websites. Be wary of phishing links and always double-check URLs before connecting your wallet.",
  },
  {
    q: "When will I receive my airdrop tokens?",
    a: "Distribution timelines vary by project. Some airdrops distribute tokens immediately, while others may take weeks or months. Check the project's official channels for distribution schedules and updates.",
  },
  {
    q: "How can I submit an airdrop to be listed?",
    a: "Click the 'Submit Airdrop' button at the top of this page and fill out the form with your project details. Our team will review the submission and approve it if it meets our quality standards. The process is fully automated — just fill the form and we'll take care of the rest.",
  },
];

function AirdropCard({ airdrop, onExpand, isExpanded }: { airdrop: any; onExpand: () => void; isExpanded: boolean }) {
  const chainColor = BLOCKCHAIN_COLORS[airdrop.blockchain] || "bg-gray-500/20 text-gray-400 border-gray-500/30";

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all duration-300 overflow-hidden" data-testid={`card-airdrop-${airdrop.id}`}>
      <CardContent className="p-0">
        <div className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-lg bg-muted/50 border border-border/50 flex items-center justify-center overflow-hidden flex-shrink-0">
              {airdrop.logo ? (
                <img src={airdrop.logo} alt={airdrop.name} className="w-full h-full object-cover rounded-lg" />
              ) : (
                <Gift className="w-6 h-6 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-foreground truncate" data-testid={`text-airdrop-name-${airdrop.id}`}>{airdrop.name}</h3>
                {airdrop.featured && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 flex-shrink-0" />}
              </div>
              {airdrop.tokenSymbol && (
                <span className="text-xs text-muted-foreground font-mono">${airdrop.tokenSymbol}</span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${chainColor}`}>
              {airdrop.blockchain}
            </Badge>
            <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary border-primary/30">
              {airdrop.rewardType}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Reward</span>
              <p className="font-medium text-foreground">{airdrop.rewardAmount || "TBA"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Referral</span>
              <p className="font-medium text-foreground">{airdrop.referralReward || "N/A"}</p>
            </div>
          </div>

          {airdrop.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{airdrop.description}</p>
          )}

          <div className="flex gap-2">
            {airdrop.website && (
              <a
                href={airdrop.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
                data-testid={`link-airdrop-website-${airdrop.id}`}
              >
                <Button size="sm" className="w-full bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 text-xs">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Claim
                </Button>
              </a>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={onExpand}
              className="text-xs"
              data-testid={`button-airdrop-details-${airdrop.id}`}
            >
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </Button>
          </div>
        </div>

        {isExpanded && (
          <div className="border-t border-border/50 p-4 bg-muted/10 space-y-3">
            {airdrop.steps && airdrop.steps.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-primary" /> Steps
                </h4>
                <ol className="space-y-1">
                  {airdrop.steps.map((step: string, i: number) => (
                    <li key={i} className="text-xs text-muted-foreground flex gap-2">
                      <span className="text-primary font-mono flex-shrink-0">{i + 1}.</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            )}
            {airdrop.requirements && (
              <div>
                <h4 className="text-xs font-semibold text-foreground mb-1">Requirements</h4>
                <p className="text-xs text-muted-foreground">{airdrop.requirements}</p>
              </div>
            )}
            <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
              {airdrop.startDate && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Start: {airdrop.startDate}
                </span>
              )}
              {airdrop.endDate && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> End: {airdrop.endDate}
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SubmitAirdropModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: "",
    website: "",
    logo: "",
    description: "",
    tokenSymbol: "",
    rewardType: "Task",
    rewardAmount: "",
    referralReward: "",
    blockchain: "Ethereum",
    startDate: "",
    endDate: "",
    requirements: "",
    submitterEmail: "",
    submitterName: "",
    steps: [""],
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/airdrops/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          steps: form.steps.filter((s) => s.trim()),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Airdrop Submitted!", description: "Your airdrop has been submitted for review. It will appear on the site once approved." });
      onClose();
      setForm({
        name: "", website: "", logo: "", description: "", tokenSymbol: "",
        rewardType: "Task", rewardAmount: "", referralReward: "", blockchain: "Ethereum",
        startDate: "", endDate: "", requirements: "", submitterEmail: "", submitterName: "", steps: [""],
      });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const addStep = () => setForm({ ...form, steps: [...form.steps, ""] });
  const removeStep = (i: number) => setForm({ ...form, steps: form.steps.filter((_, idx) => idx !== i) });
  const updateStep = (i: number, val: string) => {
    const steps = [...form.steps];
    steps[i] = val;
    setForm({ ...form, steps });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-background border border-border rounded-xl max-w-xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold font-display text-foreground">Submit Free Airdrop</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground" data-testid="button-close-submit">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground">
          Submit your airdrop for review. Once approved, it will be listed automatically. All fields marked with * are required.
        </p>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground">Project Name *</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. MyToken"
                className="mt-1 text-sm"
                data-testid="input-airdrop-name"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">Token Symbol</label>
              <Input
                value={form.tokenSymbol}
                onChange={(e) => setForm({ ...form, tokenSymbol: e.target.value })}
                placeholder="e.g. MTK"
                className="mt-1 text-sm"
                data-testid="input-airdrop-symbol"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-foreground">Website URL</label>
            <Input
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              placeholder="https://..."
              className="mt-1 text-sm"
              data-testid="input-airdrop-website"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-foreground">Logo URL</label>
            <Input
              value={form.logo}
              onChange={(e) => setForm({ ...form, logo: e.target.value })}
              placeholder="https://... (image URL)"
              className="mt-1 text-sm"
              data-testid="input-airdrop-logo"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-foreground">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description of the airdrop..."
              className="mt-1 w-full text-sm bg-muted/30 border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground resize-none h-20"
              data-testid="input-airdrop-description"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground">Blockchain *</label>
              <select
                value={form.blockchain}
                onChange={(e) => setForm({ ...form, blockchain: e.target.value })}
                className="mt-1 w-full text-sm bg-muted/30 border border-border rounded-lg px-3 py-2 text-foreground"
                data-testid="select-airdrop-blockchain"
              >
                {BLOCKCHAINS.filter((b) => b !== "All").map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">Reward Type *</label>
              <select
                value={form.rewardType}
                onChange={(e) => setForm({ ...form, rewardType: e.target.value })}
                className="mt-1 w-full text-sm bg-muted/30 border border-border rounded-lg px-3 py-2 text-foreground"
                data-testid="select-airdrop-reward-type"
              >
                {REWARD_TYPES.filter((r) => r !== "All").map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground">Reward Amount</label>
              <Input
                value={form.rewardAmount}
                onChange={(e) => setForm({ ...form, rewardAmount: e.target.value })}
                placeholder="e.g. 100 MTK"
                className="mt-1 text-sm"
                data-testid="input-airdrop-reward"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">Referral Reward</label>
              <Input
                value={form.referralReward}
                onChange={(e) => setForm({ ...form, referralReward: e.target.value })}
                placeholder="e.g. 10 MTK"
                className="mt-1 text-sm"
                data-testid="input-airdrop-referral"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground">Start Date</label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="mt-1 text-sm"
                data-testid="input-airdrop-start"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">End Date</label>
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="mt-1 text-sm"
                data-testid="input-airdrop-end"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-foreground">Requirements</label>
            <textarea
              value={form.requirements}
              onChange={(e) => setForm({ ...form, requirements: e.target.value })}
              placeholder="e.g. Must hold 100 ETH, follow on Twitter..."
              className="mt-1 w-full text-sm bg-muted/30 border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground resize-none h-16"
              data-testid="input-airdrop-requirements"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-foreground flex items-center justify-between">
              Steps to Claim
              <button onClick={addStep} className="text-primary hover:text-primary/80 text-[10px] flex items-center gap-1" data-testid="button-add-step">
                <Plus className="w-3 h-3" /> Add Step
              </button>
            </label>
            <div className="space-y-2 mt-1">
              {form.steps.map((step, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-xs text-primary font-mono mt-2 flex-shrink-0">{i + 1}.</span>
                  <Input
                    value={step}
                    onChange={(e) => updateStep(i, e.target.value)}
                    placeholder={`Step ${i + 1}...`}
                    className="text-sm"
                    data-testid={`input-step-${i}`}
                  />
                  {form.steps.length > 1 && (
                    <button onClick={() => removeStep(i)} className="text-muted-foreground hover:text-red-400" data-testid={`button-remove-step-${i}`}>
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-border/50 pt-3">
            <p className="text-xs text-muted-foreground mb-2">Your contact info (optional, not displayed publicly)</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-foreground">Your Name</label>
                <Input
                  value={form.submitterName}
                  onChange={(e) => setForm({ ...form, submitterName: e.target.value })}
                  placeholder="Name"
                  className="mt-1 text-sm"
                  data-testid="input-submitter-name"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">Your Email</label>
                <Input
                  value={form.submitterEmail}
                  onChange={(e) => setForm({ ...form, submitterEmail: e.target.value })}
                  placeholder="email@example.com"
                  className="mt-1 text-sm"
                  data-testid="input-submitter-email"
                />
              </div>
            </div>
          </div>
        </div>

        <Button
          onClick={() => mutation.mutate()}
          disabled={!form.name.trim() || mutation.isPending}
          className="w-full bg-primary hover:bg-primary/80 text-primary-foreground"
          data-testid="button-submit-airdrop"
        >
          {mutation.isPending ? (
            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          Submit for Review
        </Button>
      </div>
    </div>
  );
}

function RefreshCw({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}

export default function AirdropsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBlockchain, setSelectedBlockchain] = useState("All");
  const [selectedRewardType, setSelectedRewardType] = useState("All");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const { data: airdrops = [], isLoading } = useQuery({
    queryKey: ["/api/airdrops"],
    queryFn: async () => {
      const res = await fetch("/api/airdrops?limit=100");
      if (!res.ok) throw new Error("Failed to fetch airdrops");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const filtered = airdrops.filter((a: any) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!a.name.toLowerCase().includes(q) && !(a.tokenSymbol || "").toLowerCase().includes(q)) return false;
    }
    if (selectedBlockchain !== "All" && a.blockchain !== selectedBlockchain) return false;
    if (selectedRewardType !== "All" && a.rewardType !== selectedRewardType) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0" style={{
            background: "radial-gradient(ellipse at 50% 0%, rgba(0,200,255,0.08) 0%, transparent 70%)",
          }} />
        </div>
        <div className="max-w-7xl mx-auto px-4 py-8 relative z-10 space-y-8">
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-3">
          <Gift className="w-8 h-8 text-primary" />
          <h1 className="text-3xl md:text-4xl font-bold font-display text-foreground" data-testid="text-airdrops-title">
            Free Crypto Airdrops
          </h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Discover the latest free crypto airdrops. Complete simple tasks to earn free tokens. 
          All airdrops are verified before listing.
        </p>
        <Button
          onClick={() => setSubmitOpen(true)}
          className="bg-primary hover:bg-primary/80 text-primary-foreground"
          data-testid="button-open-submit"
        >
          <Plus className="w-4 h-4 mr-2" />
          Submit Airdrop
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search airdrops..."
            className="pl-10"
            data-testid="input-search-airdrops"
          />
        </div>
        <select
          value={selectedBlockchain}
          onChange={(e) => setSelectedBlockchain(e.target.value)}
          className="text-sm bg-muted/30 border border-border rounded-lg px-3 py-2 text-foreground"
          data-testid="select-filter-blockchain"
        >
          {BLOCKCHAINS.map((b) => (
            <option key={b} value={b}>{b === "All" ? "All Chains" : b}</option>
          ))}
        </select>
        <select
          value={selectedRewardType}
          onChange={(e) => setSelectedRewardType(e.target.value)}
          className="text-sm bg-muted/30 border border-border rounded-lg px-3 py-2 text-foreground"
          data-testid="select-filter-reward"
        >
          {REWARD_TYPES.map((r) => (
            <option key={r} value={r}>{r === "All" ? "All Rewards" : r}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="bg-card/50 border-border/50 animate-pulse">
              <CardContent className="p-4 space-y-3">
                <div className="flex gap-3">
                  <div className="w-12 h-12 rounded-lg bg-muted/50" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted/50 rounded w-3/4" />
                    <div className="h-3 bg-muted/50 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-8 bg-muted/50 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <Sparkles className="w-12 h-12 text-muted-foreground mx-auto" />
          <h3 className="text-lg font-medium text-foreground">
            {airdrops.length === 0 ? "No Airdrops Listed Yet" : "No Matching Airdrops"}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {airdrops.length === 0
              ? "Be the first to submit an airdrop! Click the Submit button above to get started."
              : "Try adjusting your search or filters to find more airdrops."}
          </p>
          {airdrops.length === 0 && (
            <Button onClick={() => setSubmitOpen(true)} variant="outline" data-testid="button-submit-empty">
              <Plus className="w-4 h-4 mr-2" /> Submit First Airdrop
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((airdrop: any) => (
            <AirdropCard
              key={airdrop.id}
              airdrop={airdrop}
              isExpanded={expandedId === airdrop.id}
              onExpand={() => setExpandedId(expandedId === airdrop.id ? null : airdrop.id)}
            />
          ))}
        </div>
      )}

      <div className="mt-12">
        <div className="flex items-center gap-3 mb-6">
          <HelpCircle className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold font-display text-foreground" data-testid="text-faq-title">
            Frequently Asked Questions
          </h2>
        </div>
        <div className="space-y-2 max-w-3xl">
          {FAQ_ITEMS.map((item, i) => (
            <div
              key={i}
              className="border border-border/50 rounded-lg overflow-hidden bg-card/30"
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/20 transition-colors"
                data-testid={`button-faq-${i}`}
              >
                <span className="text-sm font-medium text-foreground">{item.q}</span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform flex-shrink-0 ml-2 ${openFaq === i ? "rotate-180" : ""}`} />
              </button>
              {openFaq === i && (
                <div className="px-4 pb-3 text-sm text-muted-foreground border-t border-border/30 pt-3">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>


      <SubmitAirdropModal open={submitOpen} onClose={() => setSubmitOpen(false)} />
      </div>
      </main>
      <Footer />
    </div>
  );
}
