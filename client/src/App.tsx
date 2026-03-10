import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, useEffect, createContext, useContext } from "react";
import { ChevronUp } from "lucide-react";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import PricesPage from "@/pages/prices";
import NewsPage from "@/pages/news";
import MasternodesPage from "@/pages/masternodes";
import WatchlistPage from "@/pages/watchlist";
import XrpExplorerPage from "@/pages/xrp-explorer";
import ExplorerPage from "@/pages/explorer";
import StakingPage from "@/pages/staking";
import AdminPage from "@/pages/admin";
import PrivacyPage from "@/pages/privacy";
import TermsPage from "@/pages/terms";
import ExchangesPage from "@/pages/exchanges";
import ContactPage from "@/pages/contact";
import BlogPage from "@/pages/blog";
import BlogPostPage from "@/pages/blog-post";
import SwapPage from "@/pages/swap";
import AlertsPage from "@/pages/alerts";
import PortfolioPage from "@/pages/portfolio";
import CustomDashboardPage from "@/pages/custom-dashboard";
import ComparePage from "@/pages/compare";
import AirdropsPage from "@/pages/airdrops";
import DexPage from "@/pages/dex";
import GoldPage from "@/pages/gold";
import CalculatorPage from "@/pages/calculator";
import ArbitragePage from "@/pages/arbitrage";
import ChatPage from "@/pages/chat";
import NftsPage from "@/pages/nfts";
import AdvertisePage from "@/pages/advertise";
import SnapshotPage from "@/pages/snapshot";
import LearnPage from "@/pages/learn";

export const FeatureContext = createContext<Record<string, string>>({});
export function useFeatureEnabled(key: string): boolean {
  const settings = useContext(FeatureContext);
  return settings[key] !== "false";
}

function FeatureDisabled() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center text-foreground">
      <div className="text-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-muted/30 border border-border flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🚫</span>
        </div>
        <h1 className="text-xl font-bold mb-2" data-testid="text-feature-disabled">Feature Unavailable</h1>
        <p className="text-sm text-muted-foreground mb-4" data-testid="text-feature-disabled-desc">This feature is currently disabled by the site administrator.</p>
        <a href="/" className="text-primary hover:underline text-sm" data-testid="link-feature-disabled-home">Go to Home</a>
      </div>
    </div>
  );
}

function FeatureRoute({ path, component: Component, featureKey }: { path: string; component: React.ComponentType<any>; featureKey: string }) {
  const enabled = useFeatureEnabled(featureKey);
  return <Route path={path} component={enabled ? Component : FeatureDisabled} />;
}

const HOME_PAGE_MAP: Record<string, { component: React.ComponentType; featureKey?: string }> = {
  explorer: { component: ExplorerPage },
  prices: { component: PricesPage, featureKey: "prices_enabled" },
  dashboard: { component: CustomDashboardPage },
  news: { component: NewsPage, featureKey: "news_enabled" },
  swap: { component: SwapPage, featureKey: "swap_enabled" },
  portfolio: { component: PortfolioPage },
};

function Router() {
  const { data: siteSettings, isLoading } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const res = await fetch("/api/site-settings");
      if (!res.ok) return {};
      return res.json();
    },
    staleTime: 300000,
  });

  const settings = siteSettings || {};
  const homePageKey = settings.home_page || "explorer";
  const homeEntry = HOME_PAGE_MAP[homePageKey] || HOME_PAGE_MAP.explorer;
  const homeDisabled = homeEntry.featureKey && settings[homeEntry.featureKey] === "false";
  const HomePage = homeDisabled ? ExplorerPage : homeEntry.component;

  return (
    <FeatureContext.Provider value={settings}>
      <Switch>
        <Route path="/" component={HomePage}/>
        <Route path="/explorer" component={ExplorerPage}/>
        <FeatureRoute path="/wallet" component={Dashboard} featureKey="wallet_tracking_enabled" />
        <FeatureRoute path="/prices" component={PricesPage} featureKey="prices_enabled" />
        <Route path="/watchlist" component={WatchlistPage}/>
        <Route path="/alerts" component={AlertsPage}/>
        <Route path="/portfolio" component={PortfolioPage}/>
        <Route path="/dashboard" component={CustomDashboardPage}/>
        <Route path="/exchanges" component={ExchangesPage}/>
        <FeatureRoute path="/swap" component={SwapPage} featureKey="swap_enabled" />
        <Route path="/xrp" component={XrpExplorerPage}/>
        <Route path="/compare" component={ComparePage}/>
        <FeatureRoute path="/airdrops" component={AirdropsPage} featureKey="airdrops_enabled" />
        <FeatureRoute path="/dex" component={DexPage} featureKey="dex_enabled" />
        <FeatureRoute path="/gold" component={GoldPage} featureKey="gold_enabled" />
        <FeatureRoute path="/calculator" component={CalculatorPage} featureKey="calculator_enabled" />
        <FeatureRoute path="/arbitrage" component={ArbitragePage} featureKey="arbitrage_enabled" />
        <FeatureRoute path="/chat" component={ChatPage} featureKey="chat_enabled" />
        <FeatureRoute path="/nfts" component={NftsPage} featureKey="nfts_enabled" />
        <FeatureRoute path="/staking" component={StakingPage} featureKey="staking_enabled" />
        <FeatureRoute path="/news" component={NewsPage} featureKey="news_enabled" />
        <FeatureRoute path="/masternodes" component={MasternodesPage} featureKey="masternodes_enabled" />
        <FeatureRoute path="/blog" component={BlogPage} featureKey="blog_enabled" />
        <FeatureRoute path="/blog/:slug" component={BlogPostPage} featureKey="blog_enabled" />
        <FeatureRoute path="/contact" component={ContactPage} featureKey="contact_enabled" />
        <Route path="/advertise" component={AdvertisePage}/>
        <Route path="/snapshot" component={SnapshotPage}/>
        <Route path="/learn" component={LearnPage}/>
        <Route path="/privacy" component={PrivacyPage}/>
        <Route path="/terms" component={TermsPage}/>
        <Route path="/admin" component={AdminPage}/>
        <Route component={NotFound} />
      </Switch>
    </FeatureContext.Provider>
  );
}

function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center transition-all hover:scale-110 hover:shadow-primary/50 active:scale-95"
      aria-label="Scroll to top"
      data-testid="button-scroll-to-top"
    >
      <ChevronUp className="w-5 h-5" />
    </button>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
        <ScrollToTop />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
