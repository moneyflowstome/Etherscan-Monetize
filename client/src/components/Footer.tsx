import { Zap } from "lucide-react";
import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 mt-16 pt-8 border-t border-border">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-8">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <span className="font-display font-bold text-sm tracking-wider text-foreground">TokenAltcoin</span>
          <span className="text-xs text-muted-foreground ml-2">Free Multi-Chain Crypto Platform</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors" data-testid="footer-link-tracker">Tracker</Link>
          <Link href="/explorer" className="hover:text-foreground transition-colors" data-testid="footer-link-explorer">Explorer</Link>
          <Link href="/prices" className="hover:text-foreground transition-colors" data-testid="footer-link-prices">Prices</Link>
          <Link href="/watchlist" className="hover:text-foreground transition-colors" data-testid="footer-link-watchlist">Watchlist</Link>
          <Link href="/news" className="hover:text-foreground transition-colors" data-testid="footer-link-news">News</Link>
          <Link href="/masternodes" className="hover:text-foreground transition-colors" data-testid="footer-link-masternodes">Masternodes</Link>
        </div>
      </div>
      <div className="text-center text-[10px] text-muted-foreground/50 pb-6">
        Data powered by Etherscan API V2, CoinGecko, XRPL, Blockstream & Solana RPC | Auto-refreshing
      </div>
    </footer>
  );
}
