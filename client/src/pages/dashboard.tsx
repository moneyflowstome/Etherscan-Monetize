import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearch } from "wouter";
import {
  Wallet,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Fuel,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  ChevronDown,
  Globe,
  Loader2,
  Download,
  FileText,
  XCircle,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { AdBanner } from "@/components/AdBanner";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const CHAIN_OPTIONS = [
  { name: "ethereum", id: 1, symbol: "ETH", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", isTron: false, isSolana: false },
  { name: "bsc", id: 56, symbol: "BNB", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", isTron: false, isSolana: false },
  { name: "polygon", id: 137, symbol: "MATIC", color: "bg-purple-500/20 text-purple-400 border-purple-500/30", isTron: false, isSolana: false },
  { name: "arbitrum", id: 42161, symbol: "ETH", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30", isTron: false, isSolana: false },
  { name: "optimism", id: 10, symbol: "ETH", color: "bg-red-500/20 text-red-400 border-red-500/30", isTron: false, isSolana: false },
  { name: "base", id: 8453, symbol: "ETH", color: "bg-blue-400/20 text-blue-300 border-blue-400/30", isTron: false, isSolana: false },
  { name: "avalanche", id: 43114, symbol: "AVAX", color: "bg-red-600/20 text-red-400 border-red-600/30", isTron: false, isSolana: false },
  { name: "flare", id: 14, symbol: "FLR", color: "bg-rose-500/20 text-rose-400 border-rose-500/30", isTron: false, isSolana: false },
  { name: "solana", id: -2, symbol: "SOL", color: "bg-purple-500/20 text-purple-400 border-purple-500/30", isTron: false, isSolana: true },
  { name: "tron", id: -1, symbol: "TRX", color: "bg-red-500/20 text-red-400 border-red-500/30", isTron: true, isSolana: false },
];

function formatAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function timeAgo(timestamp: string): string {
  const seconds = Math.floor(Date.now() / 1000 - parseInt(timestamp));
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function isValidEvmAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

function isValidTronAddress(address: string): boolean {
  return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address);
}

function isValidSolanaAddress(address: string): boolean {
  if (address.startsWith("0x")) return false;
  if (isValidTronAddress(address)) return false;
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

function isValidAddress(address: string, isTron: boolean, isSolana: boolean): boolean {
  if (isTron) return isValidTronAddress(address);
  if (isSolana) return isValidSolanaAddress(address);
  return isValidEvmAddress(address);
}

export default function Dashboard() {
  const searchString = useSearch();
  const [walletInput, setWalletInput] = useState("");
  const [trackedAddress, setTrackedAddress] = useState("");
  const [selectedChainId, setSelectedChainId] = useState(1);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [showChainSelector, setShowChainSelector] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const chainParam = params.get("chain");
    const addressParam = params.get("address");
    if (chainParam) {
      const chainId = parseInt(chainParam, 10);
      const chain = CHAIN_OPTIONS.find((c) => c.id === chainId);
      if (chain) {
        setSelectedChainId(chainId);
        if (addressParam) {
          const addr = addressParam.trim();
          if (isValidAddress(addr, !!chain.isTron, !!chain.isSolana)) {
            setWalletInput(addr);
            setTrackedAddress(addr);
          }
        }
      }
    } else if (addressParam) {
      const addr = addressParam.trim();
      if (isValidTronAddress(addr)) {
        const tronChain = CHAIN_OPTIONS.find((c) => c.isTron);
        if (tronChain) setSelectedChainId(tronChain.id);
        setWalletInput(addr);
        setTrackedAddress(addr);
      } else if (isValidSolanaAddress(addr)) {
        const solChain = CHAIN_OPTIONS.find((c) => c.isSolana);
        if (solChain) setSelectedChainId(solChain.id);
        setWalletInput(addr);
        setTrackedAddress(addr);
      } else if (isValidEvmAddress(addr)) {
        setWalletInput(addr);
        setTrackedAddress(addr);
      }
    }
  }, []);

  const selectedChain = CHAIN_OPTIONS.find((c) => c.id === selectedChainId) || CHAIN_OPTIONS[0];

  const handleSearch = useCallback(() => {
    const address = walletInput.trim();
    if (isValidTronAddress(address)) {
      const tronChain = CHAIN_OPTIONS.find((c) => c.isTron);
      if (tronChain) setSelectedChainId(tronChain.id);
      setTrackedAddress(address);
      return;
    }
    if (isValidEvmAddress(address)) {
      if (selectedChain.isTron || selectedChain.isSolana) setSelectedChainId(1);
      setTrackedAddress(address);
      return;
    }
    if (isValidSolanaAddress(address)) {
      const solChain = CHAIN_OPTIONS.find((c) => c.isSolana);
      if (solChain) setSelectedChainId(solChain.id);
      setTrackedAddress(address);
      return;
    }
    toast({
      title: "Invalid address",
      description: "Enter a valid EVM (0x...), TRON (T...), or Solana address",
      variant: "destructive",
    });
  }, [walletInput, toast, selectedChain.isTron, selectedChain.isSolana]);

  const handleConnectTronLink = useCallback(async () => {
    try {
      const tronLink = (window as any).tronLink;
      if (!tronLink) {
        toast({ title: "TronLink not found", description: "Please install TronLink browser extension to connect your TRON wallet.", variant: "destructive" });
        return;
      }
      if (tronLink.request) {
        await tronLink.request({ method: "tron_requestAccounts" });
      }
      const tronWeb = (window as any).tronWeb;
      if (!tronWeb || !tronWeb.defaultAddress?.base58) {
        toast({ title: "TronLink locked", description: "Please unlock TronLink and approve the connection.", variant: "destructive" });
        return;
      }
      const addr = tronWeb.defaultAddress.base58;
      setWalletInput(addr);
      const tronChain = CHAIN_OPTIONS.find((c) => c.isTron);
      if (tronChain) setSelectedChainId(tronChain.id);
      setTrackedAddress(addr);
      toast({ title: "TRON Wallet Connected", description: `Tracking ${formatAddress(addr)}` });
    } catch {
      toast({ title: "Connection failed", description: "Could not connect to TronLink.", variant: "destructive" });
    }
  }, [toast]);

  const handleConnectSolflare = useCallback(async () => {
    try {
      const solflare = (window as any).solflare;
      if (!solflare) {
        toast({ title: "Solflare not found", description: "Please install the Solflare browser extension.", variant: "destructive" });
        return;
      }
      await solflare.connect();
      const pubkey = solflare.publicKey?.toString();
      if (!pubkey) {
        toast({ title: "Connection failed", description: "Could not get public key from Solflare.", variant: "destructive" });
        return;
      }
      setWalletInput(pubkey);
      const solChain = CHAIN_OPTIONS.find((c) => c.isSolana);
      if (solChain) setSelectedChainId(solChain.id);
      setTrackedAddress(pubkey);
      toast({ title: "Solflare Connected", description: `Tracking ${formatAddress(pubkey)}` });
    } catch {
      toast({ title: "Connection failed", description: "Could not connect to Solflare.", variant: "destructive" });
    }
  }, [toast]);

  const handleConnectPhantom = useCallback(async () => {
    try {
      const phantom = (window as any).phantom?.solana || (window as any).solana;
      if (!phantom || !phantom.isPhantom) {
        toast({ title: "Phantom not found", description: "Please install the Phantom browser extension.", variant: "destructive" });
        return;
      }
      const resp = await phantom.connect();
      const pubkey = resp.publicKey?.toString();
      if (!pubkey) {
        toast({ title: "Connection failed", description: "Could not get public key from Phantom.", variant: "destructive" });
        return;
      }
      setWalletInput(pubkey);
      const solChain = CHAIN_OPTIONS.find((c) => c.isSolana);
      if (solChain) setSelectedChainId(solChain.id);
      setTrackedAddress(pubkey);
      toast({ title: "Phantom Connected", description: `Tracking ${formatAddress(pubkey)}` });
    } catch {
      toast({ title: "Connection failed", description: "Could not connect to Phantom.", variant: "destructive" });
    }
  }, [toast]);

  const handleCopyAddress = useCallback(() => {
    if (trackedAddress) {
      navigator.clipboard.writeText(trackedAddress);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  }, [trackedAddress]);

  const isTronChain = selectedChain.isTron;
  const isSolanaChain = selectedChain.isSolana;

  const ethPriceQuery = useQuery({
    queryKey: ["/api/eth-price"],
    refetchInterval: 30000,
    staleTime: 15000,
  });

  const balanceQuery = useQuery({
    queryKey: [isTronChain ? "/api/trx/account" : isSolanaChain ? "/api/sol/account" : "/api/balance", trackedAddress, selectedChainId],
    queryFn: async () => {
      if (!trackedAddress) return null;
      if (isTronChain) {
        const res = await fetch(`/api/trx/account/${trackedAddress}`);
        if (!res.ok) throw new Error("Failed to fetch TRON account");
        return res.json();
      }
      if (isSolanaChain) {
        const res = await fetch(`/api/sol/account/${trackedAddress}`);
        if (!res.ok) throw new Error("Failed to fetch Solana account");
        return res.json();
      }
      const res = await fetch(`/api/balance/${trackedAddress}?chainId=${selectedChainId}`);
      if (!res.ok) throw new Error("Failed to fetch balance");
      return res.json();
    },
    enabled: !!trackedAddress,
    refetchInterval: 30000,
  });

  const txQuery = useQuery({
    queryKey: [isTronChain ? "/api/trx/transactions" : isSolanaChain ? "/api/sol/transactions" : "/api/transactions", trackedAddress, selectedChainId],
    queryFn: async () => {
      if (!trackedAddress) return null;
      if (isTronChain) {
        const res = await fetch(`/api/trx/transactions/${trackedAddress}`);
        if (!res.ok) throw new Error("Failed to fetch TRON transactions");
        return res.json();
      }
      if (isSolanaChain) {
        const res = await fetch(`/api/sol/transactions/${trackedAddress}`);
        if (!res.ok) throw new Error("Failed to fetch Solana transactions");
        return res.json();
      }
      const res = await fetch(`/api/transactions/${trackedAddress}?chainId=${selectedChainId}`);
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return res.json();
    },
    enabled: !!trackedAddress,
    refetchInterval: 60000,
  });

  const solTokensQuery = useQuery({
    queryKey: ["/api/sol/tokens", trackedAddress],
    queryFn: async () => {
      if (!trackedAddress) return null;
      const res = await fetch(`/api/sol/tokens/${trackedAddress}`);
      if (!res.ok) return { tokens: [] };
      return res.json();
    },
    enabled: !!trackedAddress && isSolanaChain,
    refetchInterval: 60000,
  });

  const tokenTxQuery = useQuery({
    queryKey: ["/api/token-transfers", trackedAddress, selectedChainId],
    queryFn: async () => {
      if (!trackedAddress) return null;
      const res = await fetch(`/api/token-transfers/${trackedAddress}?chainId=${selectedChainId}`);
      if (!res.ok) throw new Error("Failed to fetch token transfers");
      return res.json();
    },
    enabled: !!trackedAddress && !isTronChain && !isSolanaChain,
    refetchInterval: 60000,
  });

  const gasQuery = useQuery({
    queryKey: ["/api/gas", selectedChainId],
    queryFn: async () => {
      const res = await fetch(`/api/gas?chainId=${selectedChainId}`);
      if (!res.ok) throw new Error("Failed to fetch gas");
      return res.json();
    },
    enabled: !isTronChain && !isSolanaChain,
    refetchInterval: 15000,
    staleTime: 10000,
  });

  const ethPrice = ethPriceQuery.data?.result?.ethusd
    ? parseFloat(ethPriceQuery.data.result.ethusd)
    : 0;

  const tronAccount = isTronChain ? balanceQuery.data : null;
  const solanaAccount = isSolanaChain ? balanceQuery.data : null;
  const nativeBalance = isTronChain
    ? (tronAccount?.balance ? parseFloat(tronAccount.balance) : 0)
    : isSolanaChain
    ? (solanaAccount?.balance ? parseFloat(solanaAccount.balance) : 0)
    : (balanceQuery.data?.result ? parseFloat(balanceQuery.data.result) / 1e18 : 0);

  const nativeValueUsd = nativeBalance * ethPrice;

  const tronTransactions = isTronChain && txQuery.data?.transactions && Array.isArray(txQuery.data.transactions)
    ? txQuery.data.transactions.slice(0, 15)
    : [];

  const solanaTransactions = isSolanaChain && txQuery.data?.transactions && Array.isArray(txQuery.data.transactions)
    ? txQuery.data.transactions.slice(0, 15)
    : [];

  const solanaTokens = isSolanaChain && solTokensQuery.data?.tokens && Array.isArray(solTokensQuery.data.tokens)
    ? solTokensQuery.data.tokens
    : [];

  const transactions = isTronChain || isSolanaChain
    ? []
    : (txQuery.data?.result && Array.isArray(txQuery.data.result) ? txQuery.data.result.slice(0, 15) : []);

  const tokenTransfers = tokenTxQuery.data?.result && Array.isArray(tokenTxQuery.data.result)
    ? tokenTxQuery.data.result.slice(0, 15)
    : [];

  const gasData = (isTronChain || isSolanaChain) ? null : gasQuery.data?.result;

  const uniqueTokens = new Map<string, { name: string; symbol: string; decimals: number; contract: string }>();
  if (tokenTxQuery.data?.result && Array.isArray(tokenTxQuery.data.result)) {
    for (const tx of tokenTxQuery.data.result) {
      if (!uniqueTokens.has(tx.contractAddress)) {
        uniqueTokens.set(tx.contractAddress, {
          name: tx.tokenName,
          symbol: tx.tokenSymbol,
          decimals: parseInt(tx.tokenDecimal),
          contract: tx.contractAddress,
        });
      }
    }
  }

  const isLoading = balanceQuery.isLoading || txQuery.isLoading;

  const getExplorerUrl = (hash: string) => {
    if (isTronChain) return `https://tronscan.org/#/transaction/${hash}`;
    if (isSolanaChain) return `https://solscan.io/tx/${hash}`;
    const explorers: Record<number, string> = {
      1: "https://etherscan.io",
      56: "https://bscscan.com",
      137: "https://polygonscan.com",
      42161: "https://arbiscan.io",
      10: "https://optimistic.etherscan.io",
      8453: "https://basescan.org",
      43114: "https://snowtrace.io",
      14: "https://flare-explorer.flare.network",
    };
    const base = explorers[selectedChainId] || "https://etherscan.io";
    return `${base}/tx/${hash}`;
  };

  const handleExportCSV = useCallback(() => {
    const rows: string[][] = [];
    const sanitize = (val: string) => {
      if (typeof val === "string" && /^[=+\-@\t\r]/.test(val)) return "'" + val;
      return val;
    };

    if (isSolanaChain) {
      rows.push(["Status", "Signature", "Slot", "Confirmation", "Timestamp"]);
      for (const tx of solanaTransactions) {
        rows.push([
          tx.err ? "Failed" : "Success",
          sanitize(tx.signature || ""),
          String(tx.slot || ""),
          tx.confirmationStatus || "confirmed",
          tx.blockTime ? new Date(tx.blockTime * 1000).toISOString() : "",
        ]);
      }
    } else if (isTronChain) {
      rows.push(["Type", "TxID", "From", "To", "Amount (TRX)", "Contract Type", "Timestamp"]);
      for (const tx of tronTransactions) {
        const isIncoming = tx.to === trackedAddress;
        rows.push([
          isIncoming ? "Received" : "Sent",
          sanitize(tx.txID || ""),
          sanitize(tx.from || ""),
          sanitize(tx.to || ""),
          tx.amount || "0",
          tx.type || "",
          tx.timestamp ? new Date(tx.timestamp).toISOString() : "",
        ]);
      }
    } else {
      rows.push(["Type", "Hash", "From", "To", "Value", "Symbol", "Timestamp"]);
      for (const tx of transactions) {
        const isIncoming = tx.to?.toLowerCase() === trackedAddress.toLowerCase();
        const valueEth = parseFloat(tx.value) / 1e18;
        rows.push([
          isIncoming ? "Received" : "Sent",
          sanitize(tx.hash),
          sanitize(tx.from),
          sanitize(tx.to),
          valueEth.toString(),
          sanitize(selectedChain.symbol),
          new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
        ]);
      }

      if (tokenTransfers.length > 0) {
        rows.push([]);
        rows.push(["Type", "Hash", "From", "To", "Value", "Token", "Timestamp"]);
        for (const tx of tokenTransfers) {
          const isIncoming = tx.to?.toLowerCase() === trackedAddress.toLowerCase();
          const decimals = parseInt(tx.tokenDecimal) || 18;
          const value = parseFloat(tx.value) / Math.pow(10, decimals);
          rows.push([
            isIncoming ? "Received" : "Sent",
            sanitize(tx.hash),
            sanitize(tx.from),
            sanitize(tx.to),
            value.toString(),
            sanitize(tx.tokenSymbol || "Unknown"),
            new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
          ]);
        }
      }
    }

    const csvContent = rows.map((r) => r.map((c) => `"${(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `wallet_${formatAddress(trackedAddress)}_${selectedChain.name}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV Exported", description: "Wallet data has been downloaded as CSV." });
  }, [transactions, tokenTransfers, tronTransactions, solanaTransactions, trackedAddress, selectedChain, isTronChain, isSolanaChain, toast]);

  const handleExportPDF = useCallback(async () => {
    const jsPDFModule = await import("jspdf");
    const jsPDF = jsPDFModule.default;
    await import("jspdf-autotable");

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Wallet Report", 14, 20);

    doc.setFontSize(10);
    doc.text(`Address: ${trackedAddress}`, 14, 30);
    doc.text(`Chain: ${selectedChain.name.charAt(0).toUpperCase() + selectedChain.name.slice(1)}`, 14, 36);
    doc.text(`Balance: ${nativeBalance.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${selectedChain.symbol}`, 14, 42);
    if (ethPrice > 0 && selectedChainId === 1) {
      doc.text(`USD Value: $${nativeValueUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, 14, 48);
    }
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 54);

    if (isSolanaChain && solanaTransactions.length > 0) {
      doc.setFontSize(14);
      doc.text("Solana Transactions", 14, 66);

      const txRows = solanaTransactions.map((tx: any) => [
        tx.err ? "FAIL" : "OK",
        `${(tx.signature || "").slice(0, 12)}...`,
        String(tx.slot || ""),
        tx.confirmationStatus || "confirmed",
        tx.blockTime ? new Date(tx.blockTime * 1000).toLocaleDateString() : "—",
      ]);

      (doc as any).autoTable({
        startY: 70,
        head: [["Status", "Signature", "Slot", "Confirm", "Date"]],
        body: txRows,
        theme: "grid",
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [128, 0, 255] },
      });
    } else if (isTronChain && tronTransactions.length > 0) {
      doc.setFontSize(14);
      doc.text("TRON Transactions", 14, 66);

      const txRows = tronTransactions.map((tx: any) => {
        const isIncoming = tx.to === trackedAddress;
        return [
          isIncoming ? "IN" : "OUT",
          `${(tx.txID || "").slice(0, 10)}...`,
          formatAddress(tx.from || ""),
          formatAddress(tx.to || ""),
          `${tx.amount || "0"} TRX`,
          tx.timestamp ? new Date(tx.timestamp).toLocaleDateString() : "—",
        ];
      });

      (doc as any).autoTable({
        startY: 70,
        head: [["Dir", "TxID", "From", "To", "Amount", "Date"]],
        body: txRows,
        theme: "grid",
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [255, 0, 19] },
      });
    } else if (transactions.length > 0) {
      doc.setFontSize(14);
      doc.text("Transactions", 14, 66);

      const txRows = transactions.map((tx: any) => {
        const isIncoming = tx.to?.toLowerCase() === trackedAddress.toLowerCase();
        const valueEth = parseFloat(tx.value) / 1e18;
        return [
          isIncoming ? "IN" : "OUT",
          `${tx.hash.slice(0, 10)}...`,
          formatAddress(tx.from),
          formatAddress(tx.to),
          `${valueEth.toFixed(4)} ${selectedChain.symbol}`,
          new Date(parseInt(tx.timeStamp) * 1000).toLocaleDateString(),
        ];
      });

      (doc as any).autoTable({
        startY: 70,
        head: [["Dir", "Hash", "From", "To", "Value", "Date"]],
        body: txRows,
        theme: "grid",
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [41, 128, 185] },
      });
    }

    if (!isTronChain && tokenTransfers.length > 0) {
      const startY = (doc as any).lastAutoTable?.finalY + 14 || 70;
      doc.setFontSize(14);
      doc.text("Token Transfers", 14, startY);

      const tokenRows = tokenTransfers.map((tx: any) => {
        const isIncoming = tx.to?.toLowerCase() === trackedAddress.toLowerCase();
        const decimals = parseInt(tx.tokenDecimal) || 18;
        const value = parseFloat(tx.value) / Math.pow(10, decimals);
        return [
          isIncoming ? "IN" : "OUT",
          tx.tokenSymbol || "?",
          formatAddress(tx.from),
          formatAddress(tx.to),
          value > 1000000 ? `${(value / 1000000).toFixed(2)}M` : value > 1000 ? `${(value / 1000).toFixed(2)}K` : value.toFixed(4),
          new Date(parseInt(tx.timeStamp) * 1000).toLocaleDateString(),
        ];
      });

      (doc as any).autoTable({
        startY: startY + 4,
        head: [["Dir", "Token", "From", "To", "Value", "Date"]],
        body: tokenRows,
        theme: "grid",
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [41, 128, 185] },
      });
    }

    doc.save(`wallet_${formatAddress(trackedAddress)}_${selectedChain.name}.pdf`);
    toast({ title: "PDF Exported", description: "Wallet report has been downloaded as PDF." });
  }, [transactions, tokenTransfers, tronTransactions, trackedAddress, selectedChain, nativeBalance, ethPrice, selectedChainId, nativeValueUsd, isTronChain, toast]);

  const getAddressExplorerUrl = (address: string) => {
    if (isTronChain) return `https://tronscan.org/#/address/${address}`;
    if (isSolanaChain) return `https://solscan.io/account/${address}`;
    const explorers: Record<number, string> = {
      1: "https://etherscan.io",
      56: "https://bscscan.com",
      137: "https://polygonscan.com",
      42161: "https://arbiscan.io",
      10: "https://optimistic.etherscan.io",
      8453: "https://basescan.org",
      43114: "https://snowtrace.io",
      14: "https://flare-explorer.flare.network",
    };
    const base = explorers[selectedChainId] || "https://etherscan.io";
    return `${base}/address/${address}`;
  };

  return (
    <div className="min-h-screen pb-20 bg-background">
      <div
        className="h-72 w-full absolute top-0 left-0 z-0 page-glow"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(0,200,255,0.15) 0%, transparent 70%)",
        }}
      />

      <Navbar />

      {/* Wallet Search Bar */}
      <div className="relative z-30 max-w-7xl mx-auto px-4 md:px-6 pt-6">
        <div className="flex gap-3 items-center">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={walletInput}
              onChange={(e) => setWalletInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full bg-muted/30 border-border pl-10 pr-20 font-mono text-xs md:text-sm focus:border-primary/50 h-10"
              placeholder={isTronChain ? "Enter TRON address (T...)" : "Enter wallet address (0x...)"}
              data-testid="input-wallet-address"
            />
            <Button
              size="sm"
              onClick={handleSearch}
              className="absolute right-1 top-1/2 -translate-y-1/2 bg-primary/80 hover:bg-primary text-primary-foreground h-8 px-3 text-xs"
              data-testid="button-search"
            >
              Track
            </Button>
          </div>
          <div className="relative shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowChainSelector(!showChainSelector)}
              className="bg-muted/30 border-border text-foreground h-10 px-3 gap-2"
              data-testid="button-chain-selector"
            >
              <Globe className="w-4 h-4 text-primary" />
              <span className="hidden md:inline capitalize">{selectedChain.name}</span>
              <ChevronDown className="w-3 h-3" />
            </Button>
            {showChainSelector && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowChainSelector(false)} />
                <div className="absolute right-0 top-12 bg-card border border-border rounded-xl p-2 min-w-[180px] z-50 shadow-2xl" data-testid="dropdown-chains">
                  {CHAIN_OPTIONS.map((chain) => (
                    <button
                      key={chain.id}
                      onClick={() => {
                        setSelectedChainId(chain.id);
                        setShowChainSelector(false);
                        if (trackedAddress) {
                          const addrIsTron = isValidTronAddress(trackedAddress);
                          const addrIsSolana = isValidSolanaAddress(trackedAddress);
                          const targetIsTron = !!chain.isTron;
                          const targetIsSolana = chain.id === -2;
                          const targetIsEvm = !targetIsTron && !targetIsSolana;
                          const addrIsEvm = !addrIsTron && !addrIsSolana;
                          if ((targetIsTron && !addrIsTron) || (targetIsSolana && !addrIsSolana) || (targetIsEvm && !addrIsEvm)) {
                            setTrackedAddress("");
                            setWalletInput("");
                          }
                        }
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                        chain.id === selectedChainId
                          ? "bg-primary/20 text-primary"
                          : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                      }`}
                      data-testid={`button-chain-${chain.name}`}
                    >
                      <span className="capitalize font-medium">{chain.name}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{chain.symbol}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Top Leaderboard Ad - Below Navbar */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 pt-4">
        <AdBanner slot="1234567890" format="horizontal" className="w-full" />
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 pt-6 md:pt-8 gap-6 md:gap-8 grid grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6 md:space-y-8">

          {!trackedAddress ? (
            <div className="glass-panel p-12 rounded-2xl text-center animate-in fade-in duration-700">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
                <Search className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-3" data-testid="text-welcome-title">Track Any Wallet - 100% Free</h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                Enter any EVM, TRON, or Solana address above to view real-time balances, transactions, and token activity across multiple chains. Completely free to use.
              </p>
              <div className="flex flex-wrap gap-2 justify-center mb-4">
                {["Ethereum", "BSC", "Arbitrum", "Base", "Polygon", "Solana", "TRON"].map((chain) => (
                  <Badge key={chain} variant="outline" className={`bg-muted/30 border-border text-muted-foreground ${chain === "TRON" ? "bg-red-500/10 text-red-400 border-red-500/20" : chain === "Solana" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" : ""}`}>
                    {chain}
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleConnectSolflare}
                  className="hidden md:inline-flex bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20 hover:text-purple-300 gap-2"
                  data-testid="button-connect-solflare"
                >
                  <Wallet className="w-4 h-4" />
                  Connect Solflare
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleConnectPhantom}
                  className="hidden md:inline-flex bg-violet-500/10 border-violet-500/30 text-violet-400 hover:bg-violet-500/20 hover:text-violet-300 gap-2"
                  data-testid="button-connect-phantom"
                >
                  <Wallet className="w-4 h-4" />
                  Connect Phantom
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleConnectTronLink}
                  className="hidden md:inline-flex bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300 gap-2"
                  data-testid="button-connect-tronlink"
                >
                  <Wallet className="w-4 h-4" />
                  Connect TronLink
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="glass-panel p-6 md:p-8 rounded-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h2 className="text-muted-foreground font-medium uppercase tracking-widest text-xs mb-1">
                      Wallet Balance
                      <Badge variant="outline" className={`ml-2 text-[10px] ${selectedChain.color}`}>
                        {selectedChain.name}
                      </Badge>
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-xs text-muted-foreground" data-testid="text-tracked-address">
                        {formatAddress(trackedAddress)}
                      </span>
                      <button onClick={handleCopyAddress} className="text-muted-foreground hover:text-foreground transition-colors" data-testid="button-copy-address">
                        {copiedAddress ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                      <a
                        href={getAddressExplorerUrl(trackedAddress)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors"
                        data-testid="link-explorer"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleExportCSV}
                      disabled={transactions.length === 0 && tokenTransfers.length === 0 && tronTransactions.length === 0 && solanaTransactions.length === 0}
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      title="Export CSV"
                      data-testid="button-export-csv"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleExportPDF}
                      disabled={transactions.length === 0 && tokenTransfers.length === 0 && tronTransactions.length === 0 && solanaTransactions.length === 0}
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      title="Export PDF"
                      data-testid="button-export-pdf"
                    >
                      <FileText className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        balanceQuery.refetch();
                        txQuery.refetch();
                        tokenTxQuery.refetch();
                        if (isSolanaChain) solTokensQuery.refetch();
                      }}
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      data-testid="button-refresh"
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                    </Button>
                  </div>
                </div>

                {isLoading ? (
                  <div className="flex items-center gap-3 mt-4">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="text-muted-foreground">Loading wallet data...</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-baseline gap-3 mt-4">
                      <span className="text-3xl md:text-5xl font-bold font-display tracking-tight text-foreground" data-testid="text-native-balance">
                        {nativeBalance.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                      </span>
                      <span className="text-lg text-muted-foreground font-medium">{selectedChain.symbol}</span>
                    </div>
                    {ethPrice > 0 && selectedChainId === 1 && (
                      <div className="text-muted-foreground font-mono mt-1" data-testid="text-usd-value">
                        ≈ ${nativeValueUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })} USD
                      </div>
                    )}
                    {isTronChain && tronAccount && (
                      <div className="grid grid-cols-3 gap-3 mt-4">
                        <div className="text-center p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                          <div className="text-[10px] text-blue-400 mb-1 uppercase font-medium">Bandwidth</div>
                          <div className="text-sm font-bold text-foreground font-mono" data-testid="text-tron-bandwidth">{tronAccount.bandwidth || 0}</div>
                        </div>
                        <div className="text-center p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/10">
                          <div className="text-[10px] text-yellow-400 mb-1 uppercase font-medium">Energy</div>
                          <div className="text-sm font-bold text-foreground font-mono" data-testid="text-tron-energy">{tronAccount.energy || 0}</div>
                        </div>
                        <div className="text-center p-3 rounded-xl bg-purple-500/5 border border-purple-500/10">
                          <div className="text-[10px] text-purple-400 mb-1 uppercase font-medium">Frozen</div>
                          <div className="text-sm font-bold text-foreground font-mono" data-testid="text-tron-frozen">{tronAccount.frozenBalance || "0"} TRX</div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Mid-Content Ad - Between Balance and Transactions */}
              <AdBanner slot="2345678901" format="horizontal" className="w-full" />

              <div className="glass-panel rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-500 delay-150">
                <Tabs defaultValue="transactions" className="w-full">
                  <div className="px-4 md:px-6 pt-4 border-b border-border bg-muted/20">
                    <TabsList className="bg-transparent gap-4 h-auto p-0">
                      <TabsTrigger
                        value="transactions"
                        className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 px-1 text-muted-foreground"
                        data-testid="tab-transactions"
                      >
                        <Activity className="w-4 h-4 mr-2" /> Transactions
                      </TabsTrigger>
                      {!isTronChain && !isSolanaChain && (
                        <TabsTrigger
                          value="tokens"
                          className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 px-1 text-muted-foreground"
                          data-testid="tab-tokens"
                        >
                          <Wallet className="w-4 h-4 mr-2" /> Token Transfers
                        </TabsTrigger>
                      )}
                    </TabsList>
                  </div>

                  <TabsContent value="transactions" className="m-0">
                    {txQuery.isLoading ? (
                      <div className="p-8 text-center text-muted-foreground">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                        Loading transactions...
                      </div>
                    ) : isTronChain ? (
                      tronTransactions.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                          No transactions found on TRON
                        </div>
                      ) : (
                        <div className="divide-y divide-border">
                          {tronTransactions.map((tx: any, i: number) => {
                            const isIncoming = tx.to === trackedAddress;
                            const amount = tx.amount ? parseFloat(tx.amount) : 0;
                            const txTime = tx.timestamp ? new Date(tx.timestamp).toLocaleString() : "—";
                            return (
                              <div
                                key={`trx-tx-${i}`}
                                className="flex items-center justify-between p-3 md:p-4 hover:bg-muted/20 transition-colors group"
                                data-testid={`row-tron-tx-${i}`}
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                                      isIncoming
                                        ? "bg-green-500/20 text-green-400"
                                        : "bg-orange-500/20 text-orange-400"
                                    }`}
                                  >
                                    {isIncoming ? (
                                      <ArrowDownRight className="w-4 h-4" />
                                    ) : (
                                      <ArrowUpRight className="w-4 h-4" />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-sm font-medium text-foreground flex items-center gap-2">
                                      {isIncoming ? "Received" : "Sent"}
                                      <Badge variant="outline" className="text-[10px] bg-muted/30 border-border text-muted-foreground">
                                        {tx.type === "TransferContract" ? "Transfer" : tx.type?.replace("Contract", "") || "TX"}
                                      </Badge>
                                      {tx.confirmed && (
                                        <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-400 border-green-500/20">
                                          Confirmed
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="text-xs text-muted-foreground font-mono truncate max-w-[140px]">
                                      {isIncoming ? `From: ${formatAddress(tx.from || "")}` : `To: ${formatAddress(tx.to || "")}`}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right flex items-center gap-3">
                                  <div>
                                    <div className={`text-sm font-mono ${isIncoming ? "text-green-400" : "text-orange-400"}`}>
                                      {amount > 0 ? `${isIncoming ? "+" : "-"}${amount.toLocaleString(undefined, { maximumFractionDigits: 6 })} TRX` : "—"}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground">{txTime}</div>
                                  </div>
                                  <a
                                    href={getExplorerUrl(tx.txID)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )
                    ) : isSolanaChain ? (
                      solanaTransactions.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                          No transactions found on Solana
                        </div>
                      ) : (
                        <div className="divide-y divide-border">
                          {solanaTransactions.map((tx: any, i: number) => {
                            const txTime = tx.blockTime ? new Date(tx.blockTime * 1000).toLocaleString() : "—";
                            const isFailed = !!tx.err;
                            return (
                              <div
                                key={`sol-tx-${i}`}
                                className="flex items-center justify-between p-3 md:p-4 hover:bg-muted/20 transition-colors group"
                                data-testid={`row-sol-tx-${i}`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isFailed ? "bg-red-500/20 text-red-400" : "bg-purple-500/20 text-purple-400"}`}>
                                    {isFailed ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-sm font-medium text-foreground flex items-center gap-2">
                                      {isFailed ? "Failed" : "Transaction"}
                                      <Badge variant="outline" className={`text-[10px] ${isFailed ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-green-500/10 text-green-400 border-green-500/20"}`}>
                                        {tx.confirmationStatus || "confirmed"}
                                      </Badge>
                                    </div>
                                    <div className="text-xs text-muted-foreground font-mono truncate max-w-[180px]">
                                      {tx.signature?.slice(0, 12)}...{tx.signature?.slice(-8)}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right flex items-center gap-3">
                                  <div>
                                    <div className="text-xs text-muted-foreground font-mono">Slot {tx.slot?.toLocaleString()}</div>
                                    <div className="text-[10px] text-muted-foreground">{txTime}</div>
                                  </div>
                                  <a
                                    href={getExplorerUrl(tx.signature)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )
                    ) : transactions.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        No transactions found on {selectedChain.name}
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {transactions.map((tx: any, i: number) => {
                          const isIncoming = tx.to?.toLowerCase() === trackedAddress.toLowerCase();
                          const valueEth = parseFloat(tx.value) / 1e18;
                          const isError = tx.isError === "1";

                          return (
                            <>
                              <div
                                key={`tx-${i}`}
                                className="flex items-center justify-between p-3 md:p-4 hover:bg-muted/20 transition-colors group"
                                data-testid={`row-tx-${i}`}
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                                      isError
                                        ? "bg-red-500/20 text-red-400"
                                        : isIncoming
                                        ? "bg-green-500/20 text-green-400"
                                        : "bg-orange-500/20 text-orange-400"
                                    }`}
                                  >
                                    {isIncoming ? (
                                      <ArrowDownRight className="w-4 h-4" />
                                    ) : (
                                      <ArrowUpRight className="w-4 h-4" />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-sm font-medium text-foreground flex items-center gap-2">
                                      {isIncoming ? "Received" : "Sent"}
                                      {isError && (
                                        <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-400 border-red-500/30">
                                          Failed
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="text-xs text-muted-foreground font-mono truncate max-w-[140px]">
                                      {isIncoming ? `From: ${formatAddress(tx.from)}` : `To: ${formatAddress(tx.to)}`}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right flex items-center gap-3">
                                  <div>
                                    <div
                                      className={`text-sm font-mono ${
                                        isIncoming ? "text-green-400" : "text-orange-400"
                                      }`}
                                    >
                                      {isIncoming ? "+" : "-"}
                                      {valueEth > 0 ? valueEth.toFixed(4) : "0"} {selectedChain.symbol}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground">{timeAgo(tx.timeStamp)}</div>
                                  </div>
                                  <a
                                    href={getExplorerUrl(tx.hash)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                </div>
                              </div>
                              {/* In-feed ad after every 5th transaction */}
                              {i === 4 && (
                                <div key="infeed-ad" className="p-3 md:p-4 border-t border-border">
                                  <AdBanner slot="3456789012" format="fluid" layout="in-article" className="w-full" />
                                </div>
                              )}
                            </>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="tokens" className="m-0">
                    {tokenTxQuery.isLoading ? (
                      <div className="p-8 text-center text-muted-foreground">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                        Loading token transfers...
                      </div>
                    ) : tokenTransfers.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        No token transfers found on {selectedChain.name}
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {tokenTransfers.map((tx: any, i: number) => {
                          const isIncoming = tx.to?.toLowerCase() === trackedAddress.toLowerCase();
                          const decimals = parseInt(tx.tokenDecimal) || 18;
                          const value = parseFloat(tx.value) / Math.pow(10, decimals);
                          return (
                            <>
                              <div
                                key={`token-${i}`}
                                className="flex items-center justify-between p-3 md:p-4 hover:bg-muted/20 transition-colors group"
                                data-testid={`row-token-tx-${i}`}
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                      isIncoming
                                        ? "bg-green-500/20 text-green-400"
                                        : "bg-orange-500/20 text-orange-400"
                                    }`}
                                  >
                                    {tx.tokenSymbol?.slice(0, 2) || "?"}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-sm font-medium text-foreground truncate max-w-[160px]">
                                      {tx.tokenName || "Unknown Token"}
                                    </div>
                                    <div className="text-xs text-muted-foreground font-mono">
                                      {isIncoming ? `From: ${formatAddress(tx.from)}` : `To: ${formatAddress(tx.to)}`}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right flex items-center gap-3">
                                  <div>
                                    <div
                                      className={`text-sm font-mono ${
                                        isIncoming ? "text-green-400" : "text-orange-400"
                                      }`}
                                    >
                                      {isIncoming ? "+" : "-"}
                                      {value > 1000000
                                        ? `${(value / 1000000).toFixed(2)}M`
                                        : value > 1000
                                        ? `${(value / 1000).toFixed(2)}K`
                                        : value.toFixed(4)}{" "}
                                      {tx.tokenSymbol}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground">{timeAgo(tx.timeStamp)}</div>
                                  </div>
                                  <a
                                    href={getExplorerUrl(tx.hash)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                </div>
                              </div>
                              {/* In-feed ad after every 5th token transfer */}
                              {i === 4 && (
                                <div key="infeed-token-ad" className="p-3 md:p-4 border-t border-border">
                                  <AdBanner slot="4567890123" format="fluid" layout="in-article" className="w-full" />
                                </div>
                              )}
                            </>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}

          {/* Bottom Content Ad */}
          <AdBanner slot="5678901234" format="horizontal" className="w-full" />
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6 md:space-y-8">

          {isSolanaChain ? (
            <Card className="glass-panel border-border overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500" data-testid="card-solana-connect">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Solana Network</span>
                  <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[10px]">SOL</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">Connect your Solana wallet for instant tracking</p>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleConnectSolflare}
                    className="hidden md:inline-flex w-full bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20 hover:text-purple-300 gap-2"
                    data-testid="button-sidebar-connect-solflare"
                  >
                    <Wallet className="w-4 h-4" />
                    Connect Solflare
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleConnectPhantom}
                    className="hidden md:inline-flex w-full bg-violet-500/10 border-violet-500/30 text-violet-400 hover:bg-violet-500/20 hover:text-violet-300 gap-2"
                    data-testid="button-sidebar-connect-phantom"
                  >
                    <Wallet className="w-4 h-4" />
                    Connect Phantom
                  </Button>
                </div>
                {solanaTokens.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-2">SPL Tokens ({solanaTokens.length})</p>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {solanaTokens.slice(0, 15).map((token: any, i: number) => (
                        <div key={token.mint} className="flex items-center justify-between text-xs" data-testid={`sidebar-sol-token-${i}`}>
                          <a href={`https://solscan.io/token/${token.mint}`} target="_blank" rel="noopener noreferrer" className="font-mono text-muted-foreground hover:text-primary truncate max-w-[120px]">
                            {token.mint.slice(0, 6)}...{token.mint.slice(-4)}
                          </a>
                          <span className="font-mono text-foreground">{parseFloat(token.balance).toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : isTronChain ? (
            <Card className="glass-panel border-border overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500" data-testid="card-tron-connect">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-muted-foreground uppercase tracking-widest font-medium">TRON Network</span>
                  <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px]">TRX</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">Connect your TronLink wallet for instant tracking</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleConnectTronLink}
                  className="hidden md:inline-flex w-full bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300 gap-2"
                  data-testid="button-sidebar-connect-tronlink"
                >
                  <Wallet className="w-4 h-4" />
                  Connect TronLink
                </Button>
              </CardContent>
            </Card>
          ) : ethPrice > 0 ? (
            <Card className="glass-panel border-border overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500" data-testid="card-eth-price">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-muted-foreground uppercase tracking-widest font-medium">ETH Price</span>
                  <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px]">Live</Badge>
                </div>
                <div className="text-2xl font-bold font-display text-foreground" data-testid="text-eth-price">
                  ${ethPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
                {ethPriceQuery.data?.result?.ethbtc && (
                  <div className="text-xs text-muted-foreground font-mono mt-1">
                    {parseFloat(ethPriceQuery.data.result.ethbtc).toFixed(6)} BTC
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}

          {/* Sidebar Ad 1 - Rectangle */}
          <AdBanner slot="6789012345" format="rectangle" className="w-full" style={{ minHeight: "250px" }} />

          {gasData && (
            <Card className="glass-panel border-border overflow-hidden animate-in fade-in slide-in-from-right-6 duration-500 delay-100" data-testid="card-gas">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-muted-foreground uppercase tracking-widest font-medium flex items-center gap-1.5">
                    <Fuel className="w-3.5 h-3.5" /> Gas Tracker
                  </span>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] capitalize">
                    {selectedChain.name}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 rounded-xl bg-green-500/5 border border-green-500/10">
                    <div className="text-[10px] text-green-400 mb-1 uppercase font-medium">Slow</div>
                    <div className="text-lg font-bold text-foreground font-mono">{gasData.SafeGasPrice ? parseFloat(gasData.SafeGasPrice).toFixed(2) : "—"}</div>
                    <div className="text-[10px] text-muted-foreground">Gwei</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/10">
                    <div className="text-[10px] text-yellow-400 mb-1 uppercase font-medium">Avg</div>
                    <div className="text-lg font-bold text-foreground font-mono">{gasData.ProposeGasPrice ? parseFloat(gasData.ProposeGasPrice).toFixed(2) : "—"}</div>
                    <div className="text-[10px] text-muted-foreground">Gwei</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                    <div className="text-[10px] text-red-400 mb-1 uppercase font-medium">Fast</div>
                    <div className="text-lg font-bold text-foreground font-mono">{gasData.FastGasPrice ? parseFloat(gasData.FastGasPrice).toFixed(2) : "—"}</div>
                    <div className="text-[10px] text-muted-foreground">Gwei</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {trackedAddress && uniqueTokens.size > 0 && (
            <Card className="glass-panel border-border overflow-hidden animate-in fade-in slide-in-from-right-8 duration-500 delay-200" data-testid="card-tokens-found">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Tokens Detected</span>
                  <Badge variant="outline" className="bg-muted/30 border-border text-muted-foreground text-[10px]">
                    {uniqueTokens.size}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {Array.from(uniqueTokens.values())
                    .slice(0, 8)
                    .map((token, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors"
                        data-testid={`row-token-${i}`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-muted/30 border border-border flex items-center justify-center text-[9px] font-bold text-foreground">
                            {token.symbol?.slice(0, 2) || "?"}
                          </div>
                          <div>
                            <div className="text-sm text-foreground font-medium truncate max-w-[120px]">{token.name}</div>
                            <div className="text-[10px] text-muted-foreground">{token.symbol}</div>
                          </div>
                        </div>
                        <a
                          href={getAddressExplorerUrl(token.contract)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sidebar Ad 2 - Rectangle */}
          <AdBanner slot="7890123456" format="rectangle" className="w-full" style={{ minHeight: "250px" }} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
