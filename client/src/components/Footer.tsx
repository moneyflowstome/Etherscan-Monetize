import { Zap, ExternalLink } from "lucide-react";
import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 mt-16 pt-8 border-t border-border">
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
        </div>
        <a
          href="https://www.tradingview.com/pricing/?share_your_love=moneyflowstome78&mobileapp=true"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 hover:border-cyan-400/40 transition-all group"
          data-testid="footer-link-tradingview"
        >
          <span className="text-xs text-muted-foreground">Advanced Charts & Trading Tools</span>
          <span className="text-xs font-semibold text-cyan-400 group-hover:text-cyan-300 flex items-center gap-1">
            TradingView <ExternalLink className="w-3 h-3" />
          </span>
        </a>
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
