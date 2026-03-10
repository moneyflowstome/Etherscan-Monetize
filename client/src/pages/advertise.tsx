import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, CheckCircle, Megaphone } from "lucide-react";

const BANNER_SIZES = [
  { value: "728x90", label: "728x90 — Leaderboard" },
  { value: "468x60", label: "468x60 — Full Banner" },
  { value: "300x250", label: "300x250 — Medium Rectangle" },
  { value: "160x600", label: "160x600 — Wide Skyscraper" },
  { value: "320x50", label: "320x50 — Mobile Leaderboard" },
  { value: "970x90", label: "970x90 — Large Leaderboard" },
  { value: "336x280", label: "336x280 — Large Rectangle" },
];

export default function AdvertisePage() {
  const [form, setForm] = useState({ name: "", email: "", company: "", bannerSize: "468x60", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      setError("Please fill in all required fields");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/banner-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to submit");
      }
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-8">
        <div className="text-center">
          <h1 className="text-2xl md:text-3xl font-display font-bold flex items-center justify-center gap-3" data-testid="text-advertise-title">
            <Megaphone className="w-7 h-7 text-primary" /> Advertise With Us
          </h1>
          <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
            Reach thousands of crypto enthusiasts daily. Place your banner ad on TokenAltcoin and grow your brand.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-6 space-y-4">
              <h2 className="font-bold text-lg">Available Banner Sizes</h2>
              <div className="space-y-3">
                {BANNER_SIZES.map((s) => {
                  const [w, h] = s.value.split("x").map(Number);
                  return (
                    <div key={s.value} className="flex items-center gap-3">
                      <div className="border border-dashed border-primary/30 rounded flex items-center justify-center text-[8px] text-primary/50 shrink-0"
                        style={{ width: Math.min(w / 4, 120), height: Math.max(h / 4, 16) }}>
                        {s.value}
                      </div>
                      <div>
                        <span className="text-sm font-medium">{s.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <h3 className="font-bold text-sm mt-6">Banner Placements</h3>
              <div className="flex flex-wrap gap-1.5">
                {["Header", "Footer", "Sidebar", "Blog Top", "Blog Middle", "Blog Bottom"].map((z) => (
                  <Badge key={z} className="bg-primary/10 text-primary border-primary/20 text-xs">{z}</Badge>
                ))}
              </div>

              <div className="bg-muted/20 rounded-lg p-4 mt-4">
                <h3 className="font-bold text-sm mb-2">Why Advertise Here?</h3>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>Targeted crypto audience</li>
                  <li>High-traffic pages with engaged users</li>
                  <li>Rotating banners with click tracking</li>
                  <li>Multiple sizes and placements available</li>
                  <li>Competitive rates</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-6">
              {submitted ? (
                <div className="text-center py-12 space-y-4">
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto" />
                  <h2 className="font-bold text-lg" data-testid="text-inquiry-success">Inquiry Submitted!</h2>
                  <p className="text-muted-foreground text-sm">
                    Thank you for your interest. We'll review your inquiry and get back to you soon.
                  </p>
                  <Button onClick={() => { setSubmitted(false); setForm({ name: "", email: "", company: "", bannerSize: "468x60", message: "" }); }}
                    className="bg-primary hover:bg-primary/80" data-testid="button-new-inquiry">
                    Submit Another Inquiry
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h2 className="font-bold text-lg">Get Started</h2>
                  <p className="text-sm text-muted-foreground">Fill out the form below and we'll get back to you with rates and availability.</p>

                  <div>
                    <label className="text-sm font-medium block mb-1">Name *</label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Your name" className="bg-muted/30 border-border/50" data-testid="input-inquiry-name" />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">Email *</label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="your@email.com" className="bg-muted/30 border-border/50" data-testid="input-inquiry-email" />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">Company</label>
                    <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })}
                      placeholder="Company name (optional)" className="bg-muted/30 border-border/50" data-testid="input-inquiry-company" />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">Preferred Banner Size *</label>
                    <select value={form.bannerSize} onChange={(e) => setForm({ ...form, bannerSize: e.target.value })}
                      className="w-full bg-muted/30 border border-border/50 rounded-md px-3 py-2 text-sm" data-testid="select-inquiry-size">
                      {BANNER_SIZES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">Message *</label>
                    <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Tell us about your advertising goals, preferred placements, and budget..."
                      rows={4} className="w-full bg-muted/30 border border-border/50 rounded-md px-3 py-2 text-sm resize-none"
                      data-testid="textarea-inquiry-message" />
                  </div>

                  {error && <p className="text-red-400 text-sm" data-testid="text-inquiry-error">{error}</p>}

                  <Button type="submit" disabled={submitting} className="w-full bg-primary hover:bg-primary/80" data-testid="button-submit-inquiry">
                    {submitting ? "Submitting..." : <><Send className="w-4 h-4 mr-2" /> Submit Inquiry</>}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
