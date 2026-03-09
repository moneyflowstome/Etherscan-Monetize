import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AdBanner } from "@/components/AdBanner";
import {
  MessageCircle,
  Send,
  User,
  Clock,
  Hash,
  Loader2,
  AlertTriangle,
  ChevronDown,
  Users,
  Shield,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const COIN_TAGS = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin" },
  { id: "ethereum", symbol: "ETH", name: "Ethereum" },
  { id: "solana", symbol: "SOL", name: "Solana" },
  { id: "ripple", symbol: "XRP", name: "XRP" },
  { id: "binancecoin", symbol: "BNB", name: "BNB" },
  { id: "dogecoin", symbol: "DOGE", name: "Dogecoin" },
  { id: "cardano", symbol: "ADA", name: "Cardano" },
  { id: "polkadot", symbol: "DOT", name: "Polkadot" },
  { id: "tron", symbol: "TRX", name: "TRON" },
  { id: "litecoin", symbol: "LTC", name: "Litecoin" },
  { id: "general", symbol: "ALL", name: "General" },
];

const LS_NICKNAME_KEY = "tokenaltcoin_chat_nickname";

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getAvatarColor(nickname: string): string {
  let hash = 0;
  for (let i = 0; i < nickname.length; i++) {
    hash = nickname.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-pink-500",
    "bg-yellow-500", "bg-cyan-500", "bg-orange-500", "bg-indigo-500",
    "bg-rose-500", "bg-emerald-500", "bg-violet-500", "bg-teal-500",
  ];
  return colors[Math.abs(hash) % colors.length];
}

function ChatBubble({ msg }: { msg: any }) {
  const coinTag = COIN_TAGS.find(t => t.id === msg.coinTag);
  return (
    <div className="flex gap-3 py-2 px-3 hover:bg-muted/10 rounded-lg transition-colors group" data-testid={`chat-msg-${msg.id}`}>
      <div className={`w-8 h-8 rounded-full ${getAvatarColor(msg.nickname)} flex items-center justify-center shrink-0 mt-0.5`}>
        <span className="text-xs font-bold text-white">{msg.nickname.charAt(0).toUpperCase()}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-foreground">{msg.nickname}</span>
          {coinTag && coinTag.id !== "general" && (
            <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
              #{coinTag.symbol}
            </Badge>
          )}
          <span className="text-[10px] text-muted-foreground">{timeAgo(new Date(msg.createdAt))}</span>
        </div>
        <p className="text-sm text-foreground/90 mt-0.5 break-words">{msg.message}</p>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const queryClient = useQueryClient();
  const [nickname, setNickname] = useState(() => localStorage.getItem(LS_NICKNAME_KEY) || "");
  const [message, setMessage] = useState("");
  const [selectedCoin, setSelectedCoin] = useState<string | null>(null);
  const [filterCoin, setFilterCoin] = useState<string | null>(null);
  const [showNicknameSetup, setShowNicknameSetup] = useState(!nickname);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const messagesQuery = useQuery({
    queryKey: ["chat-messages", filterCoin],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterCoin) params.set("coin", filterCoin);
      const res = await fetch(`/api/chat/messages?${params}`);
      if (!res.ok) throw new Error("Failed to load messages");
      return res.json();
    },
    refetchInterval: 5000,
    staleTime: 3000,
  });

  const sendMutation = useMutation({
    mutationFn: async (data: { nickname: string; message: string; coinTag: string | null }) => {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to send");
      return json;
    },
    onSuccess: () => {
      setMessage("");
      setError("");
      queryClient.invalidateQueries({ queryKey: ["chat-messages"] });
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const messages = messagesQuery.data || [];

  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  const handleSetNickname = useCallback(() => {
    if (nickname.trim().length < 1 || nickname.trim().length > 30) return;
    localStorage.setItem(LS_NICKNAME_KEY, nickname.trim());
    setShowNicknameSetup(false);
    inputRef.current?.focus();
  }, [nickname]);

  const handleSend = useCallback(() => {
    if (!message.trim() || !nickname.trim()) return;
    sendMutation.mutate({
      nickname: nickname.trim(),
      message: message.trim(),
      coinTag: selectedCoin,
    });
  }, [message, nickname, selectedCoin, sendMutation]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <AdBanner slot="0123456789" format="horizontal" className="w-full mb-4" />

        <div className="mb-6">
          <h1
            className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
            data-testid="heading-chat"
          >
            <MessageCircle className="w-8 h-8 text-primary" />
            Community Chat
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Discuss crypto with the TokenAltcoin community. Be respectful.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          <div className="lg:w-48 shrink-0">
            <div className="glass-panel rounded-xl p-3">
              <div className="flex items-center gap-2 mb-3">
                <Hash className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-foreground uppercase tracking-widest">Channels</span>
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => setFilterCoin(null)}
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${!filterCoin ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/20"}`}
                  data-testid="channel-all"
                >
                  All Chat
                </button>
                {COIN_TAGS.filter(t => t.id !== "general").map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => setFilterCoin(tag.id)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${filterCoin === tag.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/20"}`}
                    data-testid={`channel-${tag.id}`}
                  >
                    #{tag.symbol}
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-panel rounded-xl p-3 mt-3">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Rules</span>
              </div>
              <ul className="text-[10px] text-muted-foreground space-y-1 leading-relaxed">
                <li>Be respectful to others</li>
                <li>No spam or self-promotion</li>
                <li>No financial advice</li>
                <li>No profanity</li>
                <li>Max 500 characters per message</li>
              </ul>
            </div>
          </div>

          <div className="flex-1 glass-panel rounded-xl flex flex-col" style={{ minHeight: "500px", maxHeight: "70vh" }}>
            <div className="flex items-center justify-between p-3 border-b border-border">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  {filterCoin ? `#${COIN_TAGS.find(t => t.id === filterCoin)?.symbol || filterCoin}` : "All Chat"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="w-3 h-3" />
                {messages.length} messages
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2" data-testid="chat-messages-container">
              {messagesQuery.isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <MessageCircle className="w-12 h-12 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">No messages yet. Be the first to say something!</p>
                </div>
              ) : (
                <>
                  {[...messages].reverse().map((msg: any) => (
                    <ChatBubble key={msg.id} msg={msg} />
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {showNicknameSetup ? (
              <div className="p-4 border-t border-border bg-card/50">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Choose a nickname to start chatting</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSetNickname()}
                    placeholder="Enter nickname..."
                    maxLength={30}
                    className="flex-1 bg-background/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                    data-testid="input-nickname"
                  />
                  <button
                    onClick={handleSetNickname}
                    disabled={nickname.trim().length < 1}
                    className="px-4 py-2 bg-primary/10 border border-primary/30 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 disabled:opacity-50 transition-colors"
                    data-testid="button-set-nickname"
                  >
                    Join
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 border-t border-border">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <User className="w-3 h-3" /> {nickname}
                  </span>
                  <button
                    onClick={() => setShowNicknameSetup(true)}
                    className="text-[10px] text-primary hover:underline"
                    data-testid="button-change-nickname"
                  >
                    change
                  </button>
                  <div className="flex-1" />
                  <div className="flex items-center gap-1">
                    <select
                      value={selectedCoin || ""}
                      onChange={(e) => setSelectedCoin(e.target.value || null)}
                      className="text-xs bg-card/50 border border-border rounded px-2 py-1 text-muted-foreground focus:outline-none focus:border-primary"
                      data-testid="select-coin-tag"
                    >
                      <option value="">No tag</option>
                      {COIN_TAGS.map(t => (
                        <option key={t.id} value={t.id}>#{t.symbol}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {error && (
                  <div className="flex items-center gap-1 text-xs text-red-400 mb-2">
                    <AlertTriangle className="w-3 h-3" /> {error}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                    placeholder="Type a message..."
                    maxLength={500}
                    className="flex-1 bg-background/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                    data-testid="input-chat-message"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!message.trim() || sendMutation.isPending}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-1"
                    data-testid="button-send-message"
                  >
                    {sendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px] text-muted-foreground">{message.length}/500</span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" /> 5s cooldown between messages
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <AdBanner slot="0123456789" format="horizontal" className="w-full mt-6" />
      </div>
      <Footer />
    </div>
  );
}
