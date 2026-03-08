import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import PricesPage from "@/pages/prices";
import NewsPage from "@/pages/news";
import MasternodesPage from "@/pages/masternodes";
import WatchlistPage from "@/pages/watchlist";
import AdminPage from "@/pages/admin";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard}/>
      <Route path="/prices" component={PricesPage}/>
      <Route path="/watchlist" component={WatchlistPage}/>
      <Route path="/news" component={NewsPage}/>
      <Route path="/masternodes" component={MasternodesPage}/>
      <Route path="/admin" component={AdminPage}/>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
