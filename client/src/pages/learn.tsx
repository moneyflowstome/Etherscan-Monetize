import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AdBanner } from "@/components/AdBanner";
import {
  ChevronDown,
  BookOpen,
  Blocks,
  Coins,
  ShoppingCart,
  Wallet,
  BookMarked,
  ShieldCheck,
  Layers,
  Image,
  Lightbulb,
  Bitcoin,
  CircleDollarSign,
  Dog,
  Lock,
  Flame,
  Building,
  Key,
  AlertTriangle,
  ArrowRightLeft,
  Landmark,
  PiggyBank,
  Globe,
} from "lucide-react";

interface SectionData {
  id: string;
  icon: React.ReactNode;
  title: string;
  color: string;
  content: React.ReactNode;
}

function AccordionItem({ section, isOpen, onToggle }: { section: SectionData; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="glass-panel rounded-xl overflow-hidden" data-testid={`accordion-${section.id}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-5 text-left hover:bg-card/50 transition-colors"
        data-testid={`button-toggle-${section.id}`}
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${section.color}`}>
          {section.icon}
        </div>
        <span className="text-base font-semibold text-foreground flex-1">{section.title}</span>
        <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border/50" data-testid={`content-${section.id}`}>
          <div className="pt-4">{section.content}</div>
        </div>
      )}
    </div>
  );
}

function TopicCard({ icon, title, description, color }: { icon: React.ReactNode; title: string; description: string; color: string }) {
  return (
    <div className="glass-panel rounded-xl p-5 hover:border-primary/30 transition-all" data-testid={`card-topic-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        {icon}
      </div>
      <h4 className="text-sm font-semibold text-foreground mb-1">{title}</h4>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

const sections: SectionData[] = [
  {
    id: "what-is-crypto",
    icon: <Coins className="w-5 h-5 text-orange-400" />,
    title: "What is Cryptocurrency?",
    color: "bg-orange-500/15",
    content: (
      <div className="space-y-4">
        <p>
          Cryptocurrency is a type of digital or virtual currency that uses cryptography for security. Unlike traditional currencies issued by governments (fiat money), cryptocurrencies operate on decentralized networks based on blockchain technology.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-card/50 rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-4 h-4 text-blue-400" />
              <span className="text-foreground font-medium text-sm">Decentralized</span>
            </div>
            <p className="text-xs">No single entity controls the network. Transactions are verified by a distributed network of computers (nodes).</p>
          </div>
          <div className="bg-card/50 rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4 text-green-400" />
              <span className="text-foreground font-medium text-sm">Secure</span>
            </div>
            <p className="text-xs">Cryptographic techniques make it nearly impossible to counterfeit or double-spend cryptocurrencies.</p>
          </div>
          <div className="bg-card/50 rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <ArrowRightLeft className="w-4 h-4 text-purple-400" />
              <span className="text-foreground font-medium text-sm">Peer-to-Peer</span>
            </div>
            <p className="text-xs">Send and receive payments directly without intermediaries like banks, reducing fees and transaction times.</p>
          </div>
          <div className="bg-card/50 rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-yellow-400" />
              <span className="text-foreground font-medium text-sm">Transparent</span>
            </div>
            <p className="text-xs">All transactions are recorded on a public ledger that anyone can verify, ensuring transparency and trust.</p>
          </div>
        </div>
        <p>
          Bitcoin, created in 2009 by the pseudonymous Satoshi Nakamoto, was the first cryptocurrency. Today, there are thousands of different cryptocurrencies with various functions and use cases.
        </p>
      </div>
    ),
  },
  {
    id: "how-blockchain-works",
    icon: <Blocks className="w-5 h-5 text-blue-400" />,
    title: "How Blockchain Works",
    color: "bg-blue-500/15",
    content: (
      <div className="space-y-4">
        <p>
          A blockchain is a distributed, immutable digital ledger that records transactions across a network of computers. Think of it as a chain of blocks, where each block contains a list of transactions.
        </p>
        <div className="space-y-3">
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 text-blue-400 font-bold text-sm">1</div>
            <div>
              <span className="text-foreground font-medium text-sm">Transaction Initiated</span>
              <p className="text-xs mt-1">A user initiates a transaction (e.g., sending Bitcoin to another person). This transaction is broadcast to the network.</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 text-blue-400 font-bold text-sm">2</div>
            <div>
              <span className="text-foreground font-medium text-sm">Validation by Nodes</span>
              <p className="text-xs mt-1">Network nodes (computers) validate the transaction using consensus mechanisms like Proof of Work or Proof of Stake.</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 text-blue-400 font-bold text-sm">3</div>
            <div>
              <span className="text-foreground font-medium text-sm">Block Created</span>
              <p className="text-xs mt-1">Validated transactions are grouped into a block. Each block contains a cryptographic hash of the previous block, creating a chain.</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 text-blue-400 font-bold text-sm">4</div>
            <div>
              <span className="text-foreground font-medium text-sm">Added to Chain</span>
              <p className="text-xs mt-1">The new block is added to the blockchain. Once added, it cannot be altered without changing all subsequent blocks, making it immutable.</p>
            </div>
          </div>
        </div>
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
          <p className="text-xs">
            <strong className="text-blue-400">Key Insight:</strong> Because every node has a copy of the entire blockchain, there is no single point of failure. This makes blockchain extremely resistant to censorship and fraud.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "types-of-crypto",
    icon: <Lightbulb className="w-5 h-5 text-yellow-400" />,
    title: "Types of Cryptocurrency",
    color: "bg-yellow-500/15",
    content: (
      <div className="space-y-4">
        <p>
          Not all cryptocurrencies are the same. They can be broadly categorized into several types based on their purpose and design:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-card/50 rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Bitcoin className="w-5 h-5 text-orange-500" />
              <span className="text-foreground font-medium text-sm">Bitcoin (BTC)</span>
            </div>
            <p className="text-xs">The original cryptocurrency, designed as a peer-to-peer electronic cash system. Often called "digital gold" due to its limited supply of 21 million coins and store-of-value properties.</p>
          </div>
          <div className="bg-card/50 rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="w-5 h-5 text-purple-400" />
              <span className="text-foreground font-medium text-sm">Altcoins</span>
            </div>
            <p className="text-xs">Any cryptocurrency other than Bitcoin. Examples include Ethereum (ETH), Solana (SOL), and Cardano (ADA). Many offer unique features like smart contracts or faster transactions.</p>
          </div>
          <div className="bg-card/50 rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <CircleDollarSign className="w-5 h-5 text-green-400" />
              <span className="text-foreground font-medium text-sm">Stablecoins</span>
            </div>
            <p className="text-xs">Cryptocurrencies pegged to stable assets like the US Dollar. Examples: USDT (Tether), USDC. They maintain a ~$1 value, useful for trading and as a safe haven during volatility.</p>
          </div>
          <div className="bg-card/50 rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Dog className="w-5 h-5 text-amber-400" />
              <span className="text-foreground font-medium text-sm">Meme Coins</span>
            </div>
            <p className="text-xs">Cryptocurrencies inspired by internet memes or jokes, like Dogecoin (DOGE) and Shiba Inu (SHIB). Highly volatile and often driven by community hype and social media.</p>
          </div>
        </div>
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-4">
          <p className="text-xs">
            <strong className="text-yellow-400">Tip:</strong> Always research a cryptocurrency's use case, team, and technology before investing. Not all tokens have genuine utility.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "how-to-buy",
    icon: <ShoppingCart className="w-5 h-5 text-green-400" />,
    title: "How to Buy Crypto",
    color: "bg-green-500/15",
    content: (
      <div className="space-y-4">
        <p>
          Getting started with buying cryptocurrency is easier than ever. Here's a step-by-step guide:
        </p>
        <div className="space-y-3">
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 text-green-400 font-bold text-sm">1</div>
            <div>
              <span className="text-foreground font-medium text-sm">Choose an Exchange</span>
              <p className="text-xs mt-1">Popular centralized exchanges include Coinbase, Binance, and Kraken. Look for ones that are regulated, have good security, and support your country.</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 text-green-400 font-bold text-sm">2</div>
            <div>
              <span className="text-foreground font-medium text-sm">Create & Verify Your Account</span>
              <p className="text-xs mt-1">Sign up and complete KYC (Know Your Customer) verification. You'll typically need to provide ID and proof of address.</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 text-green-400 font-bold text-sm">3</div>
            <div>
              <span className="text-foreground font-medium text-sm">Deposit Funds</span>
              <p className="text-xs mt-1">Add money via bank transfer, debit card, or credit card. Bank transfers usually have lower fees but take longer.</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 text-green-400 font-bold text-sm">4</div>
            <div>
              <span className="text-foreground font-medium text-sm">Buy Your Crypto</span>
              <p className="text-xs mt-1">Search for the cryptocurrency you want, enter the amount, review the order, and confirm. You can buy fractional amounts — you don't need to buy a whole Bitcoin!</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 text-green-400 font-bold text-sm">5</div>
            <div>
              <span className="text-foreground font-medium text-sm">Secure Your Holdings</span>
              <p className="text-xs mt-1">Consider moving your crypto to a personal wallet for added security, especially for larger amounts. Never share your private keys.</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "wallet-types",
    icon: <Wallet className="w-5 h-5 text-purple-400" />,
    title: "Wallet Types (Hot, Cold & Custodial)",
    color: "bg-purple-500/15",
    content: (
      <div className="space-y-4">
        <p>
          A crypto wallet stores your private keys — the passwords that give you access to your cryptocurrencies. There are several types:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-card/50 rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-5 h-5 text-orange-400" />
              <span className="text-foreground font-medium text-sm">Hot Wallets</span>
            </div>
            <p className="text-xs mb-2">Connected to the internet. Convenient for frequent trading and transactions.</p>
            <div className="text-xs space-y-1">
              <div className="flex items-center gap-1 text-green-400">✓ Easy to use</div>
              <div className="flex items-center gap-1 text-green-400">✓ Quick access</div>
              <div className="flex items-center gap-1 text-red-400">✗ Vulnerable to hacks</div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Examples: MetaMask, Trust Wallet, Phantom</p>
          </div>
          <div className="bg-card/50 rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Key className="w-5 h-5 text-blue-400" />
              <span className="text-foreground font-medium text-sm">Cold Wallets</span>
            </div>
            <p className="text-xs mb-2">Offline storage. Best for long-term holding of large amounts.</p>
            <div className="text-xs space-y-1">
              <div className="flex items-center gap-1 text-green-400">✓ Maximum security</div>
              <div className="flex items-center gap-1 text-green-400">✓ Immune to online attacks</div>
              <div className="flex items-center gap-1 text-red-400">✗ Less convenient</div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Examples: Ledger, Trezor, paper wallets</p>
          </div>
          <div className="bg-card/50 rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Building className="w-5 h-5 text-slate-400" />
              <span className="text-foreground font-medium text-sm">Custodial Wallets</span>
            </div>
            <p className="text-xs mb-2">A third party (like an exchange) holds your private keys for you.</p>
            <div className="text-xs space-y-1">
              <div className="flex items-center gap-1 text-green-400">✓ No key management</div>
              <div className="flex items-center gap-1 text-green-400">✓ Password recovery</div>
              <div className="flex items-center gap-1 text-red-400">✗ Not your keys, not your coins</div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Examples: Coinbase, Binance, Kraken accounts</p>
          </div>
        </div>
        <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-4">
          <p className="text-xs">
            <strong className="text-purple-400">Best Practice:</strong> Use a hot wallet for daily transactions and a cold wallet for long-term storage. Never store large amounts on exchanges.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "glossary",
    icon: <BookMarked className="w-5 h-5 text-cyan-400" />,
    title: "Key Terms Glossary",
    color: "bg-cyan-500/15",
    content: (
      <div className="space-y-2">
        <p className="mb-3">Essential cryptocurrency terms every beginner should know:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[
            { term: "Blockchain", def: "A distributed digital ledger that records all transactions across a network." },
            { term: "Private Key", def: "A secret code that allows you to access and send your cryptocurrency. Never share it." },
            { term: "Public Key", def: "Your wallet address that others use to send you crypto. Safe to share." },
            { term: "Mining", def: "The process of validating transactions and adding them to the blockchain, earning rewards." },
            { term: "Gas Fees", def: "Transaction fees paid to network validators, common on Ethereum." },
            { term: "HODL", def: "\"Hold On for Dear Life\" — a strategy of holding crypto long-term despite market volatility." },
            { term: "DeFi", def: "Decentralized Finance — financial services built on blockchain without traditional intermediaries." },
            { term: "NFT", def: "Non-Fungible Token — a unique digital asset representing ownership of art, collectibles, etc." },
            { term: "Market Cap", def: "Total value of a cryptocurrency (current price × total supply)." },
            { term: "Whale", def: "An individual or entity holding a very large amount of cryptocurrency." },
            { term: "FOMO", def: "Fear Of Missing Out — the anxiety of missing a potentially profitable investment." },
            { term: "FUD", def: "Fear, Uncertainty, Doubt — negative information spread to drive prices down." },
            { term: "Seed Phrase", def: "A 12-24 word recovery phrase that can restore your wallet. Keep it offline and secure." },
            { term: "Smart Contract", def: "Self-executing code on a blockchain that automatically enforces agreement terms." },
            { term: "Staking", def: "Locking up crypto to help validate transactions and earn rewards." },
            { term: "Liquidity", def: "How easily a cryptocurrency can be bought or sold without affecting its price." },
          ].map((item) => (
            <div key={item.term} className="bg-card/50 rounded-lg p-3 border border-border" data-testid={`glossary-${item.term.toLowerCase().replace(/\s+/g, "-")}`}>
              <span className="text-foreground font-medium text-sm">{item.term}</span>
              <p className="text-xs mt-0.5">{item.def}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "safety-tips",
    icon: <ShieldCheck className="w-5 h-5 text-red-400" />,
    title: "Safety Tips",
    color: "bg-red-500/15",
    content: (
      <div className="space-y-4">
        <p>
          Cryptocurrency security is crucial. Follow these tips to protect your investments:
        </p>
        <div className="space-y-3">
          {[
            { icon: <Lock className="w-4 h-4 text-red-400" />, title: "Use Strong, Unique Passwords", desc: "Create complex passwords for each exchange and wallet. Use a password manager to keep track of them." },
            { icon: <ShieldCheck className="w-4 h-4 text-red-400" />, title: "Enable Two-Factor Authentication (2FA)", desc: "Always use 2FA (preferably authenticator apps, not SMS) on all crypto accounts." },
            { icon: <AlertTriangle className="w-4 h-4 text-red-400" />, title: "Beware of Scams", desc: "Never share private keys or seed phrases. No legitimate service will ever ask for them. Be wary of \"guaranteed return\" promises." },
            { icon: <Key className="w-4 h-4 text-red-400" />, title: "Backup Your Seed Phrase", desc: "Write your seed phrase on paper and store it in a safe place. Never store it digitally or take photos of it." },
            { icon: <Globe className="w-4 h-4 text-red-400" />, title: "Verify URLs Carefully", desc: "Always double-check website URLs before entering credentials. Bookmark official exchange sites to avoid phishing." },
            { icon: <Wallet className="w-4 h-4 text-red-400" />, title: "Use Hardware Wallets for Large Holdings", desc: "For significant amounts, invest in a hardware wallet like Ledger or Trezor for maximum security." },
          ].map((tip, i) => (
            <div key={i} className="flex gap-3 items-start bg-card/50 rounded-lg p-3 border border-border">
              <div className="w-8 h-8 rounded-full bg-red-500/15 flex items-center justify-center shrink-0">{tip.icon}</div>
              <div>
                <span className="text-foreground font-medium text-sm">{tip.title}</span>
                <p className="text-xs mt-0.5">{tip.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "defi-basics",
    icon: <Layers className="w-5 h-5 text-indigo-400" />,
    title: "DeFi Basics",
    color: "bg-indigo-500/15",
    content: (
      <div className="space-y-4">
        <p>
          Decentralized Finance (DeFi) refers to financial services built on blockchain technology that operate without traditional intermediaries like banks or brokers.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-card/50 rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <ArrowRightLeft className="w-4 h-4 text-indigo-400" />
              <span className="text-foreground font-medium text-sm">Decentralized Exchanges (DEXs)</span>
            </div>
            <p className="text-xs">Trade crypto directly with other users through smart contracts, without a central authority. Examples: Uniswap, SushiSwap, PancakeSwap.</p>
          </div>
          <div className="bg-card/50 rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <PiggyBank className="w-4 h-4 text-indigo-400" />
              <span className="text-foreground font-medium text-sm">Lending & Borrowing</span>
            </div>
            <p className="text-xs">Lend your crypto to earn interest or borrow against your holdings without credit checks. Examples: Aave, Compound.</p>
          </div>
          <div className="bg-card/50 rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="w-4 h-4 text-indigo-400" />
              <span className="text-foreground font-medium text-sm">Yield Farming</span>
            </div>
            <p className="text-xs">Provide liquidity to DeFi protocols and earn rewards. Higher potential returns but also higher risk compared to traditional finance.</p>
          </div>
          <div className="bg-card/50 rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Landmark className="w-4 h-4 text-indigo-400" />
              <span className="text-foreground font-medium text-sm">Stablecoins in DeFi</span>
            </div>
            <p className="text-xs">Stablecoins serve as the backbone of DeFi, providing a stable medium of exchange and store of value within the ecosystem.</p>
          </div>
        </div>
        <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-lg p-4">
          <p className="text-xs">
            <strong className="text-indigo-400">Caution:</strong> DeFi offers exciting opportunities but carries risks including smart contract bugs, impermanent loss, and rug pulls. Start small and do thorough research.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "nft-basics",
    icon: <Image className="w-5 h-5 text-pink-400" />,
    title: "NFT Basics",
    color: "bg-pink-500/15",
    content: (
      <div className="space-y-4">
        <p>
          Non-Fungible Tokens (NFTs) are unique digital assets stored on a blockchain. Unlike cryptocurrencies (which are fungible — one Bitcoin equals another), each NFT is one-of-a-kind.
        </p>
        <div className="space-y-3">
          <div className="bg-card/50 rounded-lg p-4 border border-border">
            <span className="text-foreground font-medium text-sm">What Can Be an NFT?</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {["Digital Art", "Music", "Videos", "Virtual Real Estate", "Gaming Items", "Domain Names", "Event Tickets", "Collectibles"].map((item) => (
                <span key={item} className="px-2 py-1 bg-pink-500/10 text-pink-400 text-xs rounded-lg border border-pink-500/20">{item}</span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-card/50 rounded-lg p-4 border border-border">
              <span className="text-foreground font-medium text-sm">How NFTs Work</span>
              <p className="text-xs mt-1">NFTs are minted (created) on a blockchain, most commonly Ethereum. Each NFT has a unique identifier that proves ownership and authenticity.</p>
            </div>
            <div className="bg-card/50 rounded-lg p-4 border border-border">
              <span className="text-foreground font-medium text-sm">Where to Buy NFTs</span>
              <p className="text-xs mt-1">Popular NFT marketplaces include OpenSea, Blur, Magic Eden, and Rarible. You'll need a crypto wallet and some ETH or SOL to get started.</p>
            </div>
          </div>
        </div>
        <div className="bg-pink-500/5 border border-pink-500/20 rounded-lg p-4">
          <p className="text-xs">
            <strong className="text-pink-400">Note:</strong> The NFT market can be highly speculative. Many NFTs lose value over time. Only invest what you can afford to lose and focus on projects with genuine utility or cultural significance.
          </p>
        </div>
      </div>
    ),
  },
];

export default function LearnPage() {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["what-is-crypto"]));

  const toggleSection = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setOpenSections(new Set(sections.map((s) => s.id)));
  };

  const collapseAll = () => {
    setOpenSections(new Set());
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <AdBanner slot="0123456789" format="horizontal" className="w-full mb-4" />

        <div className="mb-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground" style={{ fontFamily: "'Orbitron', sans-serif" }} data-testid="heading-learn">
            Beginner's Guide to Crypto
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl mx-auto" data-testid="text-learn-subtitle">
            Everything you need to know to get started with cryptocurrency. From the basics to advanced concepts, learn at your own pace.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8" data-testid="grid-topic-cards">
          <TopicCard
            icon={<Coins className="w-6 h-6 text-orange-400" />}
            title="Cryptocurrency"
            description="Digital money secured by cryptography"
            color="bg-orange-500/15"
          />
          <TopicCard
            icon={<Blocks className="w-6 h-6 text-blue-400" />}
            title="Blockchain"
            description="The technology behind crypto"
            color="bg-blue-500/15"
          />
          <TopicCard
            icon={<Wallet className="w-6 h-6 text-purple-400" />}
            title="Wallets"
            description="Store and manage your crypto"
            color="bg-purple-500/15"
          />
          <TopicCard
            icon={<Layers className="w-6 h-6 text-indigo-400" />}
            title="DeFi"
            description="Decentralized financial services"
            color="bg-indigo-500/15"
          />
          <TopicCard
            icon={<Image className="w-6 h-6 text-pink-400" />}
            title="NFTs"
            description="Unique digital collectibles"
            color="bg-pink-500/15"
          />
          <TopicCard
            icon={<ShieldCheck className="w-6 h-6 text-red-400" />}
            title="Security"
            description="Keep your investments safe"
            color="bg-red-500/15"
          />
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground" data-testid="heading-topics">Topics</h2>
          <div className="flex gap-2">
            <button
              onClick={expandAll}
              className="text-xs text-primary hover:underline"
              data-testid="button-expand-all"
            >
              Expand All
            </button>
            <span className="text-muted-foreground text-xs">|</span>
            <button
              onClick={collapseAll}
              className="text-xs text-primary hover:underline"
              data-testid="button-collapse-all"
            >
              Collapse All
            </button>
          </div>
        </div>

        <div className="space-y-3" data-testid="accordion-list">
          {sections.map((section) => (
            <AccordionItem
              key={section.id}
              section={section}
              isOpen={openSections.has(section.id)}
              onToggle={() => toggleSection(section.id)}
            />
          ))}
        </div>

        <div className="mt-8 glass-panel rounded-xl p-6 text-center" data-testid="card-disclaimer">
          <AlertTriangle className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-foreground mb-1">Disclaimer</h3>
          <p className="text-xs text-muted-foreground max-w-lg mx-auto">
            This guide is for educational purposes only and does not constitute financial advice. Cryptocurrency investments carry significant risk. Always do your own research (DYOR) and never invest more than you can afford to lose.
          </p>
        </div>

        <AdBanner slot="0123456789" format="horizontal" className="w-full mt-6" />
      </div>
      <Footer />
    </div>
  );
}
