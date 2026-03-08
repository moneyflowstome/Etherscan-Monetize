import { useState } from "react";
import { 
  Wallet, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight, 
  Zap,
  LineChart,
  Search,
  Bell,
  Settings,
  ArrowDownUp,
  Settings2,
  X,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import heroBg from "@/assets/images/hero-bg.png";

// Mock Data
const PORTFOLIO_VALUE = "124,532.89";
const PORTFOLIO_CHANGE = "+5.2%";

const ASSETS = [
  { symbol: "ETH", name: "Ethereum", balance: "14.5", value: "$42,350.50", chain: "Ethereum", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { symbol: "BNB", name: "BNB", balance: "45.2", value: "$13,560.00", chain: "BSC", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  { symbol: "ARB", name: "Arbitrum", balance: "4500", value: "$5,400.00", chain: "Arbitrum", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
  { symbol: "USDC", name: "USD Coin", balance: "12500", value: "$12,500.00", chain: "Base", color: "bg-blue-400/20 text-blue-300 border-blue-400/30" },
];

const TRANSACTIONS = [
  { hash: "0x12...34", type: "Receive", amount: "+2.5 ETH", from: "0xab...cd", time: "10 mins ago", status: "Success" },
  { hash: "0x56...78", type: "Swap", amount: "1000 USDC -> 0.3 ETH", from: "Uniswap", time: "2 hours ago", status: "Success" },
  { hash: "0x90...ef", type: "Send", amount: "-500 ARB", from: "0x12...34", time: "1 day ago", status: "Success" },
];

export default function Dashboard() {
  const [walletInput, setWalletInput] = useState("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");

  return (
    <div className="min-h-screen pb-20">
      {/* Background Image Header */}
      <div 
        className="h-64 w-full absolute top-0 left-0 z-0 opacity-40 mix-blend-screen"
        style={{ 
          backgroundImage: `url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)'
        }}
      />

      {/* Navbar */}
      <nav className="relative z-10 glass-panel border-b border-white/5 sticky top-0 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center neon-border">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-xl tracking-widest neon-text">NEXUS</span>
        </div>

        <div className="flex-1 max-w-md mx-8 relative hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input 
            value={walletInput}
            onChange={(e) => setWalletInput(e.target.value)}
            className="w-full bg-black/20 border-white/10 pl-10 font-mono text-sm focus:border-primary/50"
            placeholder="Search address or ENS..."
          />
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="hover:bg-white/5">
            <Bell className="w-5 h-5 text-muted-foreground hover:text-white transition-colors" />
          </Button>
          <Button variant="ghost" size="icon" className="hover:bg-white/5">
            <Settings className="w-5 h-5 text-muted-foreground hover:text-white transition-colors" />
          </Button>
          <Button className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 shadow-[0_0_15px_rgba(0,255,255,0.2)]">
            Connect Wallet
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-12 gap-8 grid grid-cols-1 lg:grid-cols-3">
        
        {/* Left Column: Portfolio & Assets */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Hero Stats */}
          <div className="glass-panel p-8 rounded-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-muted-foreground font-medium uppercase tracking-widest text-sm">Total Balance</h2>
              <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20 px-3 py-1">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                {PORTFOLIO_CHANGE}
              </Badge>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl md:text-6xl font-bold font-display tracking-tight text-white">
                ${PORTFOLIO_VALUE}
              </span>
            </div>
            
            <div className="mt-8 flex gap-4">
              <Button className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white">
                <ArrowUpRight className="w-4 h-4 mr-2" /> Send
              </Button>
              <Button className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white">
                <ArrowDownRight className="w-4 h-4 mr-2" /> Receive
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 neon-border">
                    <ArrowDownUp className="w-4 h-4 mr-2" /> Swap
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-panel border-white/10 sm:max-w-md p-0 overflow-hidden bg-[#0A0E17]/95">
                  <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <h2 className="font-display font-bold text-xl text-white">Swap Assets</h2>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white rounded-full">
                      <Settings2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    {/* Pay Section */}
                    <div className="bg-black/30 rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-colors">
                      <div className="text-sm text-muted-foreground mb-2 flex justify-between">
                        <span>You pay</span>
                        <span>Balance: 14.5 ETH</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <Input 
                          type="number" 
                          placeholder="0.0" 
                          className="text-3xl bg-transparent border-none p-0 focus-visible:ring-0 text-white font-mono h-auto"
                          defaultValue="2.5"
                        />
                        <Button variant="outline" className="shrink-0 bg-white/5 border-white/10 text-white rounded-full h-10 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-bold">E</div>
                            <span>ETH</span>
                          </div>
                        </Button>
                      </div>
                      <div className="text-sm text-muted-foreground mt-2 font-mono">$7,301.81</div>
                    </div>

                    {/* Swap Arrow */}
                    <div className="relative flex justify-center -my-2 z-10">
                      <div className="bg-[#0A0E17] p-1 rounded-xl">
                        <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl bg-white/5 border-white/10 text-primary hover:bg-white/10 hover:text-primary">
                          <ArrowDownUp className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Receive Section */}
                    <div className="bg-black/30 rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-colors">
                      <div className="text-sm text-muted-foreground mb-2 flex justify-between">
                        <span>You receive</span>
                        <span>Balance: 12,500 USDC</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <Input 
                          type="number" 
                          placeholder="0.0" 
                          className="text-3xl bg-transparent border-none p-0 focus-visible:ring-0 text-white font-mono h-auto"
                          defaultValue="7298.50"
                        />
                        <Button variant="outline" className="shrink-0 bg-white/5 border-white/10 text-white rounded-full h-10 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-blue-400/20 text-blue-300 flex items-center justify-center text-[10px] font-bold">U</div>
                            <span>USDC</span>
                          </div>
                        </Button>
                      </div>
                      <div className="text-sm text-muted-foreground mt-2 font-mono">$7,298.50</div>
                    </div>

                    {/* Swap Details */}
                    <div className="rounded-xl border border-white/5 p-4 space-y-3 bg-white/[0.02]">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">Rate <Info className="w-3 h-3" /></span>
                        <span className="text-white font-mono">1 ETH = 2,919.40 USDC</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">Network Fee <Info className="w-3 h-3" /></span>
                        <span className="text-white font-mono">$3.42</span>
                      </div>
                    </div>

                    <Button className="w-full h-14 text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90 neon-border rounded-xl mt-4">
                      Review Swap
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Assets Table */}
          <div className="glass-panel rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
              <h3 className="font-display font-medium text-lg flex items-center gap-2">
                <Wallet className="w-5 h-5 text-primary" /> Assets by Chain
              </h3>
            </div>
            <div className="p-0">
              <table className="w-full text-left">
                <thead className="bg-white/5 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-4 font-medium">Asset</th>
                    <th className="p-4 font-medium">Balance</th>
                    <th className="p-4 font-medium">Value</th>
                    <th className="p-4 font-medium text-right">Chain</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {ASSETS.map((asset, i) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors group cursor-pointer">
                      <td className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-sm font-bold">
                          {asset.symbol[0]}
                        </div>
                        <div>
                          <div className="font-semibold text-white group-hover:text-primary transition-colors">{asset.name}</div>
                          <div className="text-xs text-muted-foreground">{asset.symbol}</div>
                        </div>
                      </td>
                      <td className="p-4 font-mono">{asset.balance}</td>
                      <td className="p-4 font-mono text-white">{asset.value}</td>
                      <td className="p-4 text-right">
                        <Badge variant="outline" className={asset.color}>
                          {asset.chain}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Analytics & Transactions */}
        <div className="space-y-8">
          
          {/* Pro Upsell Card */}
          <Card className="glass-panel border-primary/30 overflow-hidden relative group animate-in fade-in slide-in-from-right-8 duration-700">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-50" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <Badge className="bg-primary text-primary-foreground">PRO</Badge>
                <LineChart className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-xl font-bold font-display mb-2 text-white">Unlock Deep Analytics</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Track PnL, monitor whale wallets, and get real-time alerts. Powered by Etherscan API V2.
              </p>
              <Button className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all group-hover:border-primary/50 group-hover:shadow-[0_0_15px_rgba(0,255,255,0.3)]">
                Upgrade Now ($15/mo)
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <div className="glass-panel rounded-2xl overflow-hidden animate-in fade-in slide-in-from-right-8 duration-700 delay-300">
            <div className="p-6 border-b border-white/5 bg-black/20">
              <h3 className="font-display font-medium flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" /> Recent Activity
              </h3>
            </div>
            <div className="p-4 space-y-4">
              {TRANSACTIONS.map((tx, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      tx.type === 'Receive' ? 'bg-green-500/20 text-green-400' :
                      tx.type === 'Send' ? 'bg-red-500/20 text-red-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {tx.type === 'Receive' ? <ArrowDownRight className="w-4 h-4" /> :
                       tx.type === 'Send' ? <ArrowUpRight className="w-4 h-4" /> :
                       <Activity className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{tx.type}</div>
                      <div className="text-xs text-muted-foreground font-mono">{tx.time}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-mono ${
                      tx.amount.startsWith('+') ? 'text-green-400' : 
                      tx.amount.startsWith('-') ? 'text-red-400' : 'text-white'
                    }`}>{tx.amount}</div>
                    <div className="text-xs text-muted-foreground">To: {tx.from.substring(0,6)}...</div>
                  </div>
                </div>
              ))}
              
              <Button variant="ghost" className="w-full text-primary hover:text-primary hover:bg-primary/10 text-sm mt-2">
                View All on Etherscan
              </Button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}