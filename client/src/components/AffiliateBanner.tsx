import { useState, useEffect, useCallback } from "react";
import { ExternalLink, TrendingUp, Zap, Shield, BarChart3, Pickaxe, ArrowRight } from "lucide-react";

interface AffiliatePartner {
  name: string;
  tagline: string;
  description: string;
  url: string;
  color: string;
  gradient: string;
  icon: "chart" | "exchange" | "mining" | "trading" | "security" | "strategy";
  cta: string;
}

const PARTNERS: AffiliatePartner[] = [
  {
    name: "TradingView",
    tagline: "Professional Charts",
    description: "Advanced charting tools, real-time data & custom indicators trusted by 60M+ traders worldwide",
    url: "https://www.tradingview.com/pricing/?share_your_love=moneyflowstome78&mobileapp=true",
    color: "text-cyan-400",
    gradient: "from-cyan-500/20 via-blue-500/10 to-transparent",
    icon: "chart",
    cta: "Get TradingView",
  },
  {
    name: "Coinbase",
    tagline: "Buy & Sell Crypto",
    description: "The most trusted crypto exchange — buy, sell & store 250+ cryptocurrencies securely",
    url: "https://coinbase.com/join/NC7ZTX4?src=ios-link",
    color: "text-blue-400",
    gradient: "from-blue-500/20 via-indigo-500/10 to-transparent",
    icon: "exchange",
    cta: "Join Coinbase",
  },
  {
    name: "Pineify",
    tagline: "No-Code Strategies",
    description: "Build TradingView strategies without coding — automate your trading with visual tools",
    url: "https://pineify.app/?via=Tokenaltcoin",
    color: "text-green-400",
    gradient: "from-green-500/20 via-emerald-500/10 to-transparent",
    icon: "strategy",
    cta: "Try Pineify",
  },
  {
    name: "Good Crypto",
    tagline: "All-in-One Trading",
    description: "Trade across 35+ exchanges from one app — portfolio tracking, alerts & advanced orders",
    url: "https://click.goodcrypto.app/b9EC/ie88jiew?ref=rET1nQ",
    color: "text-purple-400",
    gradient: "from-purple-500/20 via-pink-500/10 to-transparent",
    icon: "trading",
    cta: "Start Trading",
  },
  {
    name: "GoMining",
    tagline: "Bitcoin Mining",
    description: "Earn daily BTC rewards with liquid Bitcoin hashrate — no hardware needed, start mining today",
    url: "https://gomining.com/?ref=8H3M22H",
    color: "text-orange-400",
    gradient: "from-orange-500/20 via-amber-500/10 to-transparent",
    icon: "mining",
    cta: "Start Mining",
  },
];

function PartnerIcon({ type, className }: { type: AffiliatePartner["icon"]; className?: string }) {
  const c = className || "w-5 h-5";
  switch (type) {
    case "chart": return <BarChart3 className={c} />;
    case "exchange": return <Zap className={c} />;
    case "mining": return <Pickaxe className={c} />;
    case "trading": return <TrendingUp className={c} />;
    case "security": return <Shield className={c} />;
    case "strategy": return <TrendingUp className={c} />;
  }
}

type BannerSize = "728x90" | "300x250" | "320x50" | "160x600" | "300x600";

interface AffiliateBannerProps {
  size: BannerSize;
  partner?: string;
  rotate?: boolean;
  className?: string;
}

function useRotatingPartner(rotate: boolean, fixedPartner?: string) {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * PARTNERS.length));

  useEffect(() => {
    if (!rotate || fixedPartner) return;
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % PARTNERS.length);
    }, 12000);
    return () => clearInterval(interval);
  }, [rotate, fixedPartner]);

  if (fixedPartner) {
    const found = PARTNERS.find(p => p.name.toLowerCase() === fixedPartner.toLowerCase());
    return found || PARTNERS[0];
  }
  return PARTNERS[index];
}

function Leaderboard728x90({ partner }: { partner: AffiliatePartner }) {
  return (
    <a
      href={partner.url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={`block w-full max-w-[728px] h-[90px] rounded-xl overflow-hidden border border-border/50 hover:border-primary/40 transition-all group bg-gradient-to-r ${partner.gradient} bg-card`}
      data-testid={`banner-728x90-${partner.name.toLowerCase().replace(/\s/g, "-")}`}
    >
      <div className="flex items-center h-full px-5 gap-4">
        <div className={`w-12 h-12 rounded-xl bg-background/60 border border-border/50 flex items-center justify-center shrink-0 ${partner.color}`}>
          <PartnerIcon type={partner.icon} className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-display font-bold ${partner.color}`}>{partner.name}</span>
            <span className="text-[10px] text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded">Sponsored</span>
          </div>
          <p className="text-xs text-foreground/80 mt-0.5 truncate">{partner.description}</p>
        </div>
        <div className={`shrink-0 px-4 py-2 rounded-lg bg-background/60 border border-border/50 text-xs font-semibold ${partner.color} group-hover:bg-primary/20 group-hover:border-primary/40 transition-all flex items-center gap-1.5`}>
          {partner.cta} <ArrowRight className="w-3 h-3" />
        </div>
      </div>
    </a>
  );
}

function MediumRectangle300x250({ partner }: { partner: AffiliatePartner }) {
  return (
    <a
      href={partner.url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={`block w-[300px] h-[250px] rounded-xl overflow-hidden border border-border/50 hover:border-primary/40 transition-all group bg-gradient-to-b ${partner.gradient} bg-card`}
      data-testid={`banner-300x250-${partner.name.toLowerCase().replace(/\s/g, "-")}`}
    >
      <div className="flex flex-col items-center justify-center h-full p-5 text-center">
        <div className={`w-14 h-14 rounded-xl bg-background/60 border border-border/50 flex items-center justify-center mb-3 ${partner.color}`}>
          <PartnerIcon type={partner.icon} className="w-7 h-7" />
        </div>
        <span className={`text-base font-display font-bold ${partner.color}`}>{partner.name}</span>
        <span className="text-[10px] text-muted-foreground mt-0.5">{partner.tagline}</span>
        <p className="text-[11px] text-foreground/70 mt-2 leading-relaxed line-clamp-3 px-2">{partner.description}</p>
        <div className={`mt-3 px-5 py-2 rounded-lg bg-background/60 border border-border/50 text-xs font-semibold ${partner.color} group-hover:bg-primary/20 group-hover:border-primary/40 transition-all flex items-center gap-1.5`}>
          {partner.cta} <ExternalLink className="w-3 h-3" />
        </div>
        <span className="text-[8px] text-muted-foreground/50 mt-2">Sponsored</span>
      </div>
    </a>
  );
}

function MobileLeaderboard320x50({ partner }: { partner: AffiliatePartner }) {
  return (
    <a
      href={partner.url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={`block w-full max-w-[320px] h-[50px] rounded-lg overflow-hidden border border-border/50 hover:border-primary/40 transition-all group bg-gradient-to-r ${partner.gradient} bg-card`}
      data-testid={`banner-320x50-${partner.name.toLowerCase().replace(/\s/g, "-")}`}
    >
      <div className="flex items-center h-full px-3 gap-2.5">
        <div className={`w-8 h-8 rounded-lg bg-background/60 border border-border/50 flex items-center justify-center shrink-0 ${partner.color}`}>
          <PartnerIcon type={partner.icon} className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <span className={`text-[11px] font-display font-bold ${partner.color}`}>{partner.name}</span>
          <p className="text-[9px] text-foreground/70 truncate">{partner.tagline}</p>
        </div>
        <div className={`shrink-0 px-2.5 py-1 rounded text-[10px] font-semibold ${partner.color} bg-background/60 border border-border/50 group-hover:bg-primary/20 transition-all`}>
          {partner.cta}
        </div>
      </div>
    </a>
  );
}

function WideSkyscraper160x600({ partner }: { partner: AffiliatePartner }) {
  return (
    <a
      href={partner.url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={`block w-[160px] h-[600px] rounded-xl overflow-hidden border border-border/50 hover:border-primary/40 transition-all group bg-gradient-to-b ${partner.gradient} bg-card`}
      data-testid={`banner-160x600-${partner.name.toLowerCase().replace(/\s/g, "-")}`}
    >
      <div className="flex flex-col items-center justify-between h-full py-6 px-3 text-center">
        <div>
          <span className="text-[8px] text-muted-foreground/50 block mb-3">Sponsored</span>
          <div className={`w-12 h-12 rounded-xl bg-background/60 border border-border/50 flex items-center justify-center mx-auto mb-3 ${partner.color}`}>
            <PartnerIcon type={partner.icon} className="w-6 h-6" />
          </div>
          <span className={`text-sm font-display font-bold block ${partner.color}`}>{partner.name}</span>
          <span className="text-[10px] text-muted-foreground mt-1 block">{partner.tagline}</span>
        </div>
        <p className="text-[10px] text-foreground/70 leading-relaxed px-1">{partner.description}</p>
        <div>
          <div className={`px-4 py-2 rounded-lg bg-background/60 border border-border/50 text-[11px] font-semibold ${partner.color} group-hover:bg-primary/20 group-hover:border-primary/40 transition-all flex items-center gap-1`}>
            {partner.cta} <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </div>
    </a>
  );
}

function HalfPage300x600({ partner }: { partner: AffiliatePartner }) {
  return (
    <a
      href={partner.url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={`block w-[300px] h-[600px] rounded-xl overflow-hidden border border-border/50 hover:border-primary/40 transition-all group bg-gradient-to-b ${partner.gradient} bg-card`}
      data-testid={`banner-300x600-${partner.name.toLowerCase().replace(/\s/g, "-")}`}
    >
      <div className="flex flex-col items-center justify-between h-full py-8 px-5 text-center">
        <span className="text-[8px] text-muted-foreground/50">Sponsored</span>
        <div>
          <div className={`w-16 h-16 rounded-2xl bg-background/60 border border-border/50 flex items-center justify-center mx-auto mb-4 ${partner.color}`}>
            <PartnerIcon type={partner.icon} className="w-8 h-8" />
          </div>
          <span className={`text-lg font-display font-bold block ${partner.color}`}>{partner.name}</span>
          <span className="text-xs text-muted-foreground mt-1 block">{partner.tagline}</span>
        </div>
        <div className="space-y-3 w-full">
          <p className="text-xs text-foreground/80 leading-relaxed">{partner.description}</p>
          <div className="space-y-2">
            {partner.name === "TradingView" && (
              <>
                <div className="flex items-center gap-2 text-[10px] text-foreground/70"><BarChart3 className="w-3 h-3 text-cyan-400 shrink-0" />100+ built-in indicators</div>
                <div className="flex items-center gap-2 text-[10px] text-foreground/70"><TrendingUp className="w-3 h-3 text-cyan-400 shrink-0" />Real-time market data</div>
                <div className="flex items-center gap-2 text-[10px] text-foreground/70"><Zap className="w-3 h-3 text-cyan-400 shrink-0" />Custom Pine Script alerts</div>
              </>
            )}
            {partner.name === "Coinbase" && (
              <>
                <div className="flex items-center gap-2 text-[10px] text-foreground/70"><Shield className="w-3 h-3 text-blue-400 shrink-0" />Fully regulated & insured</div>
                <div className="flex items-center gap-2 text-[10px] text-foreground/70"><Zap className="w-3 h-3 text-blue-400 shrink-0" />250+ cryptocurrencies</div>
                <div className="flex items-center gap-2 text-[10px] text-foreground/70"><TrendingUp className="w-3 h-3 text-blue-400 shrink-0" />Earn staking rewards</div>
              </>
            )}
            {partner.name === "GoMining" && (
              <>
                <div className="flex items-center gap-2 text-[10px] text-foreground/70"><Pickaxe className="w-3 h-3 text-orange-400 shrink-0" />Daily BTC payouts</div>
                <div className="flex items-center gap-2 text-[10px] text-foreground/70"><Zap className="w-3 h-3 text-orange-400 shrink-0" />No hardware required</div>
                <div className="flex items-center gap-2 text-[10px] text-foreground/70"><Shield className="w-3 h-3 text-orange-400 shrink-0" />Liquid hashrate NFTs</div>
              </>
            )}
            {partner.name === "Pineify" && (
              <>
                <div className="flex items-center gap-2 text-[10px] text-foreground/70"><TrendingUp className="w-3 h-3 text-green-400 shrink-0" />Visual strategy builder</div>
                <div className="flex items-center gap-2 text-[10px] text-foreground/70"><Zap className="w-3 h-3 text-green-400 shrink-0" />No coding needed</div>
                <div className="flex items-center gap-2 text-[10px] text-foreground/70"><BarChart3 className="w-3 h-3 text-green-400 shrink-0" />TradingView integration</div>
              </>
            )}
            {partner.name === "Good Crypto" && (
              <>
                <div className="flex items-center gap-2 text-[10px] text-foreground/70"><TrendingUp className="w-3 h-3 text-purple-400 shrink-0" />35+ exchanges in one app</div>
                <div className="flex items-center gap-2 text-[10px] text-foreground/70"><Zap className="w-3 h-3 text-purple-400 shrink-0" />Smart order types</div>
                <div className="flex items-center gap-2 text-[10px] text-foreground/70"><BarChart3 className="w-3 h-3 text-purple-400 shrink-0" />Portfolio analytics</div>
              </>
            )}
          </div>
        </div>
        <div className={`w-full py-3 rounded-xl bg-background/60 border border-border/50 text-sm font-semibold ${partner.color} group-hover:bg-primary/20 group-hover:border-primary/40 transition-all flex items-center justify-center gap-2`}>
          {partner.cta} <ExternalLink className="w-4 h-4" />
        </div>
      </div>
    </a>
  );
}

export function AffiliateBanner({ size, partner, rotate = true, className = "" }: AffiliateBannerProps) {
  const activePartner = useRotatingPartner(rotate, partner);

  const wrapperClass = `affiliate-banner ${className}`;

  switch (size) {
    case "728x90":
      return <div className={wrapperClass}><Leaderboard728x90 partner={activePartner} /></div>;
    case "300x250":
      return <div className={wrapperClass}><MediumRectangle300x250 partner={activePartner} /></div>;
    case "320x50":
      return <div className={wrapperClass}><MobileLeaderboard320x50 partner={activePartner} /></div>;
    case "160x600":
      return <div className={wrapperClass}><WideSkyscraper160x600 partner={activePartner} /></div>;
    case "300x600":
      return <div className={wrapperClass}><HalfPage300x600 partner={activePartner} /></div>;
  }
}

export function ResponsiveAffiliateBanner({ className = "", partner, rotate = true }: { className?: string; partner?: string; rotate?: boolean }) {
  return (
    <div className={className}>
      <div className="hidden lg:flex justify-center">
        <AffiliateBanner size="728x90" partner={partner} rotate={rotate} />
      </div>
      <div className="hidden md:flex lg:hidden justify-center">
        <AffiliateBanner size="300x250" partner={partner} rotate={rotate} />
      </div>
      <div className="flex md:hidden justify-center">
        <AffiliateBanner size="320x50" partner={partner} rotate={rotate} />
      </div>
    </div>
  );
}

export function SidebarAffiliateBanner({ className = "", partner, rotate = true }: { className?: string; partner?: string; rotate?: boolean }) {
  return (
    <div className={className}>
      <div className="hidden xl:flex justify-center">
        <AffiliateBanner size="160x600" partner={partner} rotate={rotate} />
      </div>
      <div className="flex xl:hidden justify-center">
        <AffiliateBanner size="300x250" partner={partner} rotate={rotate} />
      </div>
    </div>
  );
}
