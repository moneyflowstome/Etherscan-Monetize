import { Zap, Menu, X, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation, Link } from "wouter";
import { useState } from "react";
import { useTheme } from "@/hooks/use-theme";

const NAV_LINKS = [
  { path: "/", label: "Explorer" },
  { path: "/wallet", label: "Wallet Tracker" },
  { path: "/prices", label: "Prices" },
  { path: "/watchlist", label: "Watchlist" },
  { path: "/staking", label: "Staking" },
  { path: "/news", label: "News" },
  { path: "/masternodes", label: "Masternodes" },
];

export function Navbar() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="relative z-20 border-b border-border sticky top-0 px-4 md:px-6 py-3 backdrop-blur-xl bg-background/80" data-testid="navbar">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg md:text-xl tracking-wider text-foreground" data-testid="text-app-name">TokenAltcoin</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link key={link.path} href={link.path}>
              <Button
                variant="ghost"
                size="sm"
                className={`text-sm px-3 transition-colors ${
                  location === link.path
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
                data-testid={`nav-${link.label.toLowerCase().replace(" ", "-")}`}
              >
                {link.label}
              </Button>
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-muted-foreground hover:text-foreground"
            data-testid="button-theme-toggle"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
            data-testid="button-mobile-menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden absolute left-0 right-0 top-full bg-card border-b border-border p-4 space-y-1 z-50">
          {NAV_LINKS.map((link) => (
            <Link key={link.path} href={link.path}>
              <button
                onClick={() => setMobileOpen(false)}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-colors ${
                  location === link.path
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
                data-testid={`mobile-nav-${link.label.toLowerCase().replace(" ", "-")}`}
              >
                {link.label}
              </button>
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
