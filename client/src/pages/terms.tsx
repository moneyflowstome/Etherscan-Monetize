import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FileText } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 md:px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <FileText className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-display font-bold tracking-wider" data-testid="text-terms-title">Terms of Service</h1>
        </div>

        <div className="glass-panel p-6 md:p-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
          <p className="text-xs text-muted-foreground/60">Last updated: March 9, 2026</p>

          <section>
            <h2 className="text-lg font-display font-semibold text-foreground mb-2">1. Acceptance of Terms</h2>
            <p>By accessing and using TokenAltcoin.com ("the Service"), you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.</p>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold text-foreground mb-2">2. Description of Service</h2>
            <p>TokenAltcoin is a free multi-chain cryptocurrency information platform that provides blockchain explorers, wallet balance lookups, live cryptocurrency prices, news aggregation, masternode tracking, staking calculators, and related tools. The Service is provided free of charge and is supported by advertising, including Google AdSense.</p>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold text-foreground mb-2">3. No Financial Advice</h2>
            <p>The information provided on TokenAltcoin is for general informational purposes only. Nothing on this website constitutes financial, investment, legal, or tax advice. Cryptocurrency markets are highly volatile and carry significant risk. You should always conduct your own research and consult with qualified financial advisors before making any investment decisions. We are not responsible for any financial losses incurred based on information found on this website.</p>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold text-foreground mb-2">4. Accuracy of Information</h2>
            <p>While we strive to provide accurate and up-to-date information, we make no warranties or representations regarding the accuracy, completeness, or reliability of any data displayed on the site. Cryptocurrency prices, balances, transaction data, and other blockchain information are sourced from third-party APIs and may be delayed, inaccurate, or temporarily unavailable. Always verify important information through official blockchain explorers and exchanges.</p>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold text-foreground mb-2">5. Advertising</h2>
            <p className="mb-2">The Service displays third-party advertisements, including ads served by Google AdSense. By using the Service, you acknowledge and agree that:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Advertisements may be displayed throughout the website</li>
              <li>Ad content is provided by third-party advertisers and advertising networks</li>
              <li>We do not endorse or guarantee any products or services advertised on the site</li>
              <li>Clicking on advertisements may redirect you to third-party websites with their own terms and privacy policies</li>
              <li>Advertising cookies and tracking technologies may be used as described in our Privacy Policy</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold text-foreground mb-2">6. User Conduct</h2>
            <p className="mb-2">You agree not to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Use the Service for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to the Service or its systems</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Use automated tools, bots, or scrapers to access the Service without permission</li>
              <li>Circumvent, disable, or interfere with security features of the Service</li>
              <li>Use the Service to track wallet addresses for malicious purposes</li>
              <li>Attempt to manipulate or abuse the advertising systems</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold text-foreground mb-2">7. Intellectual Property</h2>
            <p>The Service and its original content (excluding third-party data and advertisements), features, and functionality are owned by TokenAltcoin and are protected by international copyright, trademark, and other intellectual property laws. Cryptocurrency data is sourced from third-party providers and is subject to their respective terms of use.</p>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold text-foreground mb-2">8. Third-Party Links & APIs</h2>
            <p>The Service may contain links to third-party websites and relies on third-party APIs for data. We are not responsible for the content, accuracy, or practices of any third-party sites or services. Your use of third-party websites is at your own risk and subject to their terms and conditions.</p>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold text-foreground mb-2">9. Limitation of Liability</h2>
            <p>To the fullest extent permitted by applicable law, TokenAltcoin shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or other intangible losses, resulting from: (a) your use or inability to use the Service; (b) any errors, inaccuracies, or omissions in the data provided; (c) unauthorized access to or alteration of your data; (d) any third-party conduct on the Service; or (e) any other matter relating to the Service.</p>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold text-foreground mb-2">10. Disclaimer of Warranties</h2>
            <p>The Service is provided on an "AS IS" and "AS AVAILABLE" basis without any warranties of any kind, either express or implied. We do not warrant that the Service will be uninterrupted, secure, or error-free. We do not guarantee the accuracy of cryptocurrency prices, blockchain data, or any other information displayed on the site.</p>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold text-foreground mb-2">11. Service Availability</h2>
            <p>We reserve the right to modify, suspend, or discontinue the Service (or any part thereof) at any time, with or without notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuance of the Service.</p>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold text-foreground mb-2">12. Changes to Terms</h2>
            <p>We reserve the right to modify these Terms of Service at any time. Changes will be effective immediately upon posting on this page. Your continued use of the Service after any changes constitutes your acceptance of the new terms. We encourage you to review these terms periodically.</p>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold text-foreground mb-2">13. Governing Law</h2>
            <p>These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law principles.</p>
          </section>

          <section>
            <h2 className="text-lg font-display font-semibold text-foreground mb-2">14. Contact Us</h2>
            <p>If you have any questions about these Terms of Service, please contact us through the website.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
