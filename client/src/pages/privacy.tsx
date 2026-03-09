import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Shield } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 md:px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-display font-bold tracking-wider" data-testid="text-privacy-title">Privacy Policy</h1>
        </div>

        <div className="glass-panel p-6 md:p-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
          <p className="text-xs text-muted-foreground/60">Last updated: March 9, 2026</p>

          <section>
            <h2 className="text-lg font-display font-semibold text-foreground mb-2">1. Introduction</h2>
            <p>TokenAltcoin.com ("we", "us", or "our") operates the TokenAltcoin website. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website. By using this site, you agree to the collection and use of information in accordance with this policy.</p>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold text-foreground mb-2">2. Information We Collect</h2>
            <p className="mb-2">We may collect the following types of information:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><span className="text-foreground font-medium">Usage Data:</span> Pages visited, time spent, browser type, device information, referring URLs, and interactions with the site.</li>
              <li><span className="text-foreground font-medium">Wallet Addresses:</span> Cryptocurrency wallet addresses you voluntarily enter for lookup purposes. These are not stored permanently on our servers.</li>
              <li><span className="text-foreground font-medium">Cookies & Tracking Technologies:</span> We use cookies, web beacons, and similar technologies for analytics and advertising purposes.</li>
              <li><span className="text-foreground font-medium">Local Storage:</span> Watchlist preferences and theme settings are stored locally in your browser.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold text-foreground mb-2">3. Google AdSense & Advertising</h2>
            <p className="mb-2">We use Google AdSense to display advertisements on our website. Google AdSense uses cookies and similar technologies to serve ads based on your prior visits to this website and other websites on the internet.</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Google's use of advertising cookies enables it and its partners to serve ads based on your visit to this site and/or other sites on the Internet.</li>
              <li>You may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Ads Settings</a>.</li>
              <li>You may also opt out of third-party vendor cookies by visiting the <a href="https://optout.networkadvertising.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Network Advertising Initiative opt-out page</a>.</li>
              <li>Google's advertising requirements can be found in <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google's Advertising Policies</a>.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold text-foreground mb-2">4. Google Analytics</h2>
            <p>We may use Google Analytics to collect information about how visitors use our site. Google Analytics collects information such as how often users visit the site, what pages they visit, and what other sites they used prior to coming to this site. We use this information to improve our site. Google Analytics collects only the IP address assigned to you on the date you visit the site. We do not combine the information collected through Google Analytics with personally identifiable information. You can prevent Google Analytics from recognizing you on return visits by disabling cookies on your browser.</p>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold text-foreground mb-2">5. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>To provide and maintain our service</li>
              <li>To display cryptocurrency data you request (balances, transactions, prices)</li>
              <li>To display relevant advertisements via Google AdSense</li>
              <li>To analyze usage patterns and improve our website</li>
              <li>To detect and prevent technical issues</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold text-foreground mb-2">6. Third-Party Services</h2>
            <p className="mb-2">We use the following third-party services that may collect data:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><span className="text-foreground font-medium">Google AdSense</span> - Advertising (see section 3)</li>
              <li><span className="text-foreground font-medium">CoinGecko API</span> - Cryptocurrency price data</li>
              <li><span className="text-foreground font-medium">Etherscan API</span> - Blockchain data</li>
              <li><span className="text-foreground font-medium">Various blockchain RPCs</span> - On-chain data lookups</li>
            </ul>
            <p className="mt-2">Each third-party service has its own privacy policy governing the data it collects. We encourage you to review their policies.</p>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold text-foreground mb-2">7. Data Retention</h2>
            <p>We retain usage analytics data for a reasonable period to improve our services. Wallet addresses entered for lookup are processed in real-time and are not permanently stored. Browser-based preferences (watchlists, theme) are stored only in your local browser storage and can be cleared at any time.</p>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold text-foreground mb-2">8. Your Rights</h2>
            <p className="mb-2">Depending on your location, you may have the following rights:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>The right to access the personal data we hold about you</li>
              <li>The right to request correction of inaccurate data</li>
              <li>The right to request deletion of your data</li>
              <li>The right to opt out of personalized advertising</li>
              <li>The right to withdraw consent at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold text-foreground mb-2">9. Children's Privacy</h2>
            <p>Our website is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.</p>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold text-foreground mb-2">10. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.</p>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold text-foreground mb-2">11. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us through the website.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
