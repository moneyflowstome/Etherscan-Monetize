import { Zap, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { BannerRotation } from "./BannerRotation";

export function Footer() {
  const { data: settings } = useQuery({
    queryKey: ["banner-settings"],
    queryFn: async () => {
      const res = await fetch("/api/banner-settings");
      if (!res.ok) return {};
      return res.json();
    },
    staleTime: 60000,
  });

  const footerBannerEnabled = settings?.banner_footer_enabled !== "false";

  return (
    <footer className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 mt-16 pt-8 border-t border-border">
      {footerBannerEnabled && (
        <div className="flex justify-center mb-6">
          <BannerRotation zone="footer" size="468x60" />
        </div>
      )}
      <div className="flex flex-col items-center gap-6 pb-8">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <span className="font-display font-bold text-sm tracking-wider text-foreground">TokenAltcoin</span>
          <span className="text-xs text-muted-foreground ml-2">Free Multi-Chain Crypto Platform</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:flex md:flex-wrap md:justify-center gap-x-6 gap-y-3 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors" data-testid="footer-link-explorer">Explorer</Link>
          <Link href="/wallet" className="hover:text-foreground transition-colors" data-testid="footer-link-tracker">Wallet Tracker</Link>
          <Link href="/prices" className="hover:text-foreground transition-colors" data-testid="footer-link-prices">Prices</Link>
          <Link href="/exchanges" className="hover:text-foreground transition-colors" data-testid="footer-link-exchanges">Exchanges</Link>
          <Link href="/watchlist" className="hover:text-foreground transition-colors" data-testid="footer-link-watchlist">Watchlist</Link>
          <Link href="/staking" className="hover:text-foreground transition-colors" data-testid="footer-link-staking">Staking</Link>
          <Link href="/news" className="hover:text-foreground transition-colors" data-testid="footer-link-news">News</Link>
          <Link href="/masternodes" className="hover:text-foreground transition-colors" data-testid="footer-link-masternodes">Masternodes</Link>
          <Link href="/blog" className="hover:text-foreground transition-colors" data-testid="footer-link-blog">Blog</Link>
          <Link href="/contact" className="hover:text-foreground transition-colors" data-testid="footer-link-contact">Contact</Link>
          <Link href="/advertise" className="hover:text-foreground transition-colors text-primary" data-testid="footer-link-advertise">Advertise</Link>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {[
            { name: "TradingView", url: "https://www.tradingview.com/pricing/?share_your_love=moneyflowstome78&mobileapp=true" },
            { name: "Coinbase", url: "https://coinbase.com/join/NC7ZTX4?src=ios-link" },
            { name: "Gemini", url: "https://exchange.gemini.com/register?referral=68zng9ce&type=referral" },
            { name: "GoMining", url: "https://gomining.com/?ref=8H3M22H" },
            { name: "Robinhood", url: "https://join.robinhood.com/alexisd4" },
            { name: "Brave", url: "https://app.adjust.com/3bipw7n" },
            { name: "Hostinger", url: "https://www.hostinger.com?REFERRALCODE=IG5MONEYFAMV" },
          ].map((p) => (
            <a
              key={p.name}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/30 border border-border/50 text-[11px] text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
              data-testid={`footer-partner-${p.name.toLowerCase()}`}
            >
              {p.name} <ExternalLink className="w-2.5 h-2.5" />
            </a>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-center gap-3 text-[10px] text-muted-foreground/50 pb-2">
        <Link href="/privacy" className="hover:text-foreground transition-colors" data-testid="footer-link-privacy">Privacy Policy</Link>
        <span>|</span>
        <Link href="/terms" className="hover:text-foreground transition-colors" data-testid="footer-link-terms">Terms of Service</Link>
      </div>
      <div className="text-center text-[10px] text-muted-foreground/50 pb-6">
        Data powered by Etherscan API V2, CoinGecko, XRPL, Blockstream, Blockcypher & Solana RPC | Auto-refreshing
      </div>
    </footer>
  );
}
