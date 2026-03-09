import { ArrowLeftRight, Coins, TrendingUp, UserX, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AdBanner } from "@/components/AdBanner";

const INFO_CARDS = [
  {
    icon: Coins,
    title: "900+ Coins",
    description: "Swap between 900+ cryptocurrencies including Bitcoin, Ethereum, and all major altcoins",
  },
  {
    icon: TrendingUp,
    title: "Best Rates",
    description: "Our aggregator finds the best exchange rates across multiple providers",
  },
  {
    icon: UserX,
    title: "No Registration",
    description: "Start swapping instantly without creating an account or KYC verification",
  },
];

const STEPS = [
  { step: 1, title: "Choose your pair" },
  { step: 2, title: "Enter amount" },
  { step: 3, title: "Provide wallet address" },
  { step: 4, title: "Confirm & receive" },
];

export default function SwapPage() {
  const { data: settings } = useQuery({
    queryKey: ["swap-settings"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/settings/changenow_affiliate_id");
        if (!res.ok) return { value: "" };
        return res.json();
      } catch {
        return { value: "" };
      }
    },
    staleTime: 300000,
  });

  const affiliateId = settings?.value || "";
  const widgetUrl = `https://changenow.io/embeds/exchange-widget/v2/widget.html?FAQ=false&amount=0.1&from=btc&to=eth${affiliateId ? `&link_id=${affiliateId}` : ""}&backgroundColor=111827&darkMode=true&primaryColor=00C8FF&fontFamily=Inter`;

  return (
    <div className="min-h-screen bg-background" data-testid="swap-page">
      <div
        className="h-72 w-full absolute top-0 left-0 z-0 page-glow"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(100,0,255,0.12) 0%, transparent 70%)",
        }}
      />
      <Navbar />

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 pt-8">
        <AdBanner slot="8899001122" format="horizontal" className="w-full mb-6" />

        <div className="mb-8" data-testid="swap-header">
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3" data-testid="text-page-title">
            <ArrowLeftRight className="w-8 h-8 text-primary" />
            Crypto Swap
          </h1>
          <p className="text-muted-foreground text-sm mt-1" data-testid="text-page-subtitle">
            Swap cryptocurrencies instantly with best rates across 900+ coins
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-6 flex justify-center" data-testid="swap-widget-card">
          <iframe
            src={widgetUrl}
            style={{ height: "356px", width: "100%", maxWidth: "500px", border: "none" }}
            className="mx-auto"
            title="Crypto Swap Widget"
            data-testid="swap-iframe"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8" data-testid="swap-info-cards">
          {INFO_CARDS.map((card) => (
            <div
              key={card.title}
              className="glass-panel rounded-2xl p-6"
              data-testid={`card-info-${card.title.toLowerCase().replace(/[\s+]/g, "-")}`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <card.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display font-bold text-foreground" data-testid={`text-info-title-${card.title.toLowerCase().replace(/[\s+]/g, "-")}`}>
                  {card.title}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground" data-testid={`text-info-desc-${card.title.toLowerCase().replace(/[\s+]/g, "-")}`}>
                {card.description}
              </p>
            </div>
          ))}
        </div>

        <div className="glass-panel rounded-2xl p-6 mt-8" data-testid="swap-how-it-works">
          <h2 className="text-lg font-display font-bold text-foreground mb-6 flex items-center gap-2" data-testid="text-how-it-works-title">
            <CheckCircle className="w-5 h-5 text-primary" />
            How It Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {STEPS.map((s) => (
              <div key={s.step} className="text-center" data-testid={`step-${s.step}`}>
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-display font-bold text-lg flex items-center justify-center mx-auto mb-3" data-testid={`text-step-number-${s.step}`}>
                  {s.step}
                </div>
                <p className="text-sm text-muted-foreground font-medium" data-testid={`text-step-title-${s.step}`}>
                  {s.title}
                </p>
              </div>
            ))}
          </div>
        </div>

        <AdBanner slot="8899001122" format="horizontal" className="w-full mt-6" />
      </div>
      <Footer />
    </div>
  );
}
