import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
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

const HOME_PAGE_MAP: Record<string, React.ComponentType> = {
  explorer: ExplorerPage,
  prices: PricesPage,
  dashboard: CustomDashboardPage,
  news: NewsPage,
  swap: SwapPage,
  portfolio: PortfolioPage,
};

function Router() {
  const { data: siteSettings } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const res = await fetch("/api/site-settings");
      if (!res.ok) return {};
      return res.json();
    },
    staleTime: 300000,
  });

  const homePageKey = siteSettings?.home_page || "explorer";
  const HomePage = HOME_PAGE_MAP[homePageKey] || ExplorerPage;

  return (
    <Switch>
      <Route path="/" component={HomePage}/>
      <Route path="/explorer" component={ExplorerPage}/>
      <Route path="/wallet" component={Dashboard}/>
      <Route path="/prices" component={PricesPage}/>
      <Route path="/watchlist" component={WatchlistPage}/>
      <Route path="/alerts" component={AlertsPage}/>
      <Route path="/portfolio" component={PortfolioPage}/>
      <Route path="/dashboard" component={CustomDashboardPage}/>
      <Route path="/exchanges" component={ExchangesPage}/>
      <Route path="/swap" component={SwapPage}/>
      <Route path="/xrp" component={XrpExplorerPage}/>
      <Route path="/compare" component={ComparePage}/>
      <Route path="/airdrops" component={AirdropsPage}/>
      <Route path="/dex" component={DexPage}/>
      <Route path="/gold" component={GoldPage}/>
      <Route path="/calculator" component={CalculatorPage}/>
      <Route path="/arbitrage" component={ArbitragePage}/>
      <Route path="/chat" component={ChatPage}/>
      <Route path="/staking" component={StakingPage}/>
      <Route path="/news" component={NewsPage}/>
      <Route path="/masternodes" component={MasternodesPage}/>
      <Route path="/blog" component={BlogPage}/>
      <Route path="/blog/:slug" component={BlogPostPage}/>
      <Route path="/contact" component={ContactPage}/>
      <Route path="/privacy" component={PrivacyPage}/>
      <Route path="/terms" component={TermsPage}/>
      <Route path="/admin" component={AdminPage}/>
      <Route component={NotFound} />
    </Switch>
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
