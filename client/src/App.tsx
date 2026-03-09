import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
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

function Router() {
  return (
    <Switch>
      <Route path="/" component={ExplorerPage}/>
      <Route path="/wallet" component={Dashboard}/>
      <Route path="/prices" component={PricesPage}/>
      <Route path="/watchlist" component={WatchlistPage}/>
      <Route path="/xrp" component={XrpExplorerPage}/>
      <Route path="/staking" component={StakingPage}/>
      <Route path="/news" component={NewsPage}/>
      <Route path="/masternodes" component={MasternodesPage}/>
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
