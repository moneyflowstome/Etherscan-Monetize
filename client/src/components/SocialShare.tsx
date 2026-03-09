import { useState, useMemo } from "react";
import { Share2, Search, X, Check, ExternalLink, Copy, Mail } from "lucide-react";

interface ShareProps {
  url: string;
  title: string;
  description?: string;
}

interface Network {
  name: string;
  icon: string;
  category: string;
  getUrl: (url: string, title: string, desc: string) => string;
  color: string;
}

const NETWORKS: Network[] = [
  { name: "X (Twitter)", icon: "𝕏", category: "Popular", color: "bg-black", getUrl: (u, t) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}` },
  { name: "Facebook", icon: "f", category: "Popular", color: "bg-blue-600", getUrl: (u) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}` },
  { name: "LinkedIn", icon: "in", category: "Popular", color: "bg-blue-700", getUrl: (u, t) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(u)}` },
  { name: "Reddit", icon: "R", category: "Popular", color: "bg-orange-600", getUrl: (u, t) => `https://reddit.com/submit?url=${encodeURIComponent(u)}&title=${encodeURIComponent(t)}` },
  { name: "WhatsApp", icon: "W", category: "Popular", color: "bg-green-500", getUrl: (u, t) => `https://wa.me/?text=${encodeURIComponent(t + " " + u)}` },
  { name: "Telegram", icon: "T", category: "Popular", color: "bg-sky-500", getUrl: (u, t) => `https://t.me/share/url?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}` },
  { name: "Pinterest", icon: "P", category: "Popular", color: "bg-red-600", getUrl: (u, t, d) => `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(u)}&description=${encodeURIComponent(d || t)}` },
  { name: "Tumblr", icon: "t", category: "Popular", color: "bg-indigo-900", getUrl: (u, t, d) => `https://www.tumblr.com/widgets/share/tool?canonicalUrl=${encodeURIComponent(u)}&title=${encodeURIComponent(t)}&caption=${encodeURIComponent(d || "")}` },
  { name: "Email", icon: "✉", category: "Popular", color: "bg-gray-600", getUrl: (u, t, d) => `mailto:?subject=${encodeURIComponent(t)}&body=${encodeURIComponent((d || t) + "\n\n" + u)}` },

  { name: "Discord", icon: "D", category: "Messaging", color: "bg-indigo-500", getUrl: (u, t) => `https://discord.com/channels?url=${encodeURIComponent(u)}` },
  { name: "Slack", icon: "S", category: "Messaging", color: "bg-purple-700", getUrl: (u, t) => `https://slack.com/share?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}` },
  { name: "Viber", icon: "V", category: "Messaging", color: "bg-purple-500", getUrl: (u, t) => `viber://forward?text=${encodeURIComponent(t + " " + u)}` },
  { name: "Line", icon: "L", category: "Messaging", color: "bg-green-600", getUrl: (u, t) => `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(u)}` },
  { name: "KakaoTalk", icon: "K", category: "Messaging", color: "bg-yellow-500", getUrl: (u) => `https://story.kakao.com/share?url=${encodeURIComponent(u)}` },
  { name: "Skype", icon: "S", category: "Messaging", color: "bg-cyan-500", getUrl: (u, t) => `https://web.skype.com/share?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}` },
  { name: "Teams", icon: "T", category: "Messaging", color: "bg-indigo-600", getUrl: (u, t) => `https://teams.microsoft.com/share?href=${encodeURIComponent(u)}&msgText=${encodeURIComponent(t)}` },
  { name: "Snapchat", icon: "S", category: "Messaging", color: "bg-yellow-400", getUrl: (u) => `https://www.snapchat.com/scan?attachmentUrl=${encodeURIComponent(u)}` },
  { name: "Signal", icon: "S", category: "Messaging", color: "bg-blue-500", getUrl: (u, t) => `https://signal.me/#p/${encodeURIComponent(u)}` },
  { name: "WeChat", icon: "微", category: "Messaging", color: "bg-green-700", getUrl: (u) => `weixin://dl/share?url=${encodeURIComponent(u)}` },

  { name: "Mastodon", icon: "M", category: "Social", color: "bg-purple-600", getUrl: (u, t) => `https://mastodon.social/share?text=${encodeURIComponent(t + " " + u)}` },
  { name: "Bluesky", icon: "B", category: "Social", color: "bg-sky-400", getUrl: (u, t) => `https://bsky.app/intent/compose?text=${encodeURIComponent(t + " " + u)}` },
  { name: "Threads", icon: "@", category: "Social", color: "bg-gray-900", getUrl: (u, t) => `https://www.threads.net/intent/post?text=${encodeURIComponent(t + " " + u)}` },
  { name: "VK", icon: "V", category: "Social", color: "bg-blue-500", getUrl: (u, t) => `https://vk.com/share.php?url=${encodeURIComponent(u)}&title=${encodeURIComponent(t)}` },
  { name: "OK.ru", icon: "O", category: "Social", color: "bg-orange-500", getUrl: (u, t) => `https://connect.ok.ru/offer?url=${encodeURIComponent(u)}&title=${encodeURIComponent(t)}` },
  { name: "Weibo", icon: "微", category: "Social", color: "bg-red-500", getUrl: (u, t) => `https://service.weibo.com/share/share.php?url=${encodeURIComponent(u)}&title=${encodeURIComponent(t)}` },
  { name: "QZone", icon: "Q", category: "Social", color: "bg-yellow-600", getUrl: (u, t) => `https://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url=${encodeURIComponent(u)}&title=${encodeURIComponent(t)}` },
  { name: "Douban", icon: "豆", category: "Social", color: "bg-green-800", getUrl: (u, t) => `https://www.douban.com/share/service?url=${encodeURIComponent(u)}&title=${encodeURIComponent(t)}` },
  { name: "Gab", icon: "G", category: "Social", color: "bg-green-600", getUrl: (u, t) => `https://gab.com/compose?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}` },

  { name: "Hacker News", icon: "Y", category: "Tech", color: "bg-orange-600", getUrl: (u, t) => `https://news.ycombinator.com/submitlink?u=${encodeURIComponent(u)}&t=${encodeURIComponent(t)}` },
  { name: "Dev.to", icon: "D", category: "Tech", color: "bg-gray-800", getUrl: (u, t) => `https://dev.to/new?prefill=${encodeURIComponent(t + "\n\n" + u)}` },
  { name: "Medium", icon: "M", category: "Tech", color: "bg-gray-900", getUrl: (u) => `https://medium.com/new-story?url=${encodeURIComponent(u)}` },
  { name: "Pocket", icon: "P", category: "Tech", color: "bg-pink-600", getUrl: (u, t) => `https://getpocket.com/save?url=${encodeURIComponent(u)}&title=${encodeURIComponent(t)}` },
  { name: "Flipboard", icon: "F", category: "Tech", color: "bg-red-700", getUrl: (u, t) => `https://share.flipboard.com/bookmarklet/popout?v=2&url=${encodeURIComponent(u)}&title=${encodeURIComponent(t)}` },
  { name: "Instapaper", icon: "I", category: "Tech", color: "bg-gray-700", getUrl: (u, t) => `https://www.instapaper.com/hello2?url=${encodeURIComponent(u)}&title=${encodeURIComponent(t)}` },
  { name: "Diigo", icon: "D", category: "Tech", color: "bg-blue-800", getUrl: (u, t, d) => `https://www.diigo.com/post?url=${encodeURIComponent(u)}&title=${encodeURIComponent(t)}&desc=${encodeURIComponent(d || "")}` },
  { name: "Mix", icon: "M", category: "Tech", color: "bg-orange-500", getUrl: (u) => `https://mix.com/add?url=${encodeURIComponent(u)}` },

  { name: "Baidu", icon: "百", category: "Regional", color: "bg-blue-600", getUrl: (u, t) => `http://cang.baidu.com/do/add?it=${encodeURIComponent(t)}&iu=${encodeURIComponent(u)}` },
  { name: "Naver", icon: "N", category: "Regional", color: "bg-green-500", getUrl: (u, t) => `https://share.naver.com/web/shareView.nhn?url=${encodeURIComponent(u)}&title=${encodeURIComponent(t)}` },
  { name: "Daum", icon: "D", category: "Regional", color: "bg-blue-500", getUrl: (u, t) => `https://send.moim.at/new?url=${encodeURIComponent(u)}&title=${encodeURIComponent(t)}` },
  { name: "Mixi", icon: "M", category: "Regional", color: "bg-orange-400", getUrl: (u, t) => `https://mixi.jp/share.pl?u=${encodeURIComponent(u)}&k=${encodeURIComponent(t)}` },
  { name: "Hatena", icon: "B!", category: "Regional", color: "bg-blue-400", getUrl: (u) => `https://b.hatena.ne.jp/entry/${u}` },
  { name: "Renren", icon: "人", category: "Regional", color: "bg-blue-600", getUrl: (u, t) => `http://share.renren.com/share/buttonshare.do?link=${encodeURIComponent(u)}&title=${encodeURIComponent(t)}` },

  { name: "Buffer", icon: "B", category: "Tools", color: "bg-gray-800", getUrl: (u, t) => `https://buffer.com/add?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}` },
  { name: "Evernote", icon: "E", category: "Tools", color: "bg-green-600", getUrl: (u, t) => `https://www.evernote.com/clip.action?url=${encodeURIComponent(u)}&title=${encodeURIComponent(t)}` },
  { name: "OneNote", icon: "1", category: "Tools", color: "bg-purple-600", getUrl: (u, t) => `https://www.onenote.com/clipper/clip?url=${encodeURIComponent(u)}&title=${encodeURIComponent(t)}` },
  { name: "Trello", icon: "T", category: "Tools", color: "bg-blue-500", getUrl: (u, t) => `https://trello.com/add-card?url=${encodeURIComponent(u)}&name=${encodeURIComponent(t)}` },
  { name: "Blogger", icon: "B", category: "Tools", color: "bg-orange-500", getUrl: (u, t, d) => `https://www.blogger.com/blog-this.g?u=${encodeURIComponent(u)}&n=${encodeURIComponent(t)}&t=${encodeURIComponent(d || "")}` },
  { name: "WordPress", icon: "W", category: "Tools", color: "bg-blue-800", getUrl: (u, t, d) => `https://wordpress.com/press-this.php?u=${encodeURIComponent(u)}&t=${encodeURIComponent(t)}&s=${encodeURIComponent(d || "")}` },
  { name: "LiveJournal", icon: "LJ", category: "Tools", color: "bg-blue-500", getUrl: (u, t) => `https://www.livejournal.com/update.bml?subject=${encodeURIComponent(t)}&event=${encodeURIComponent(u)}` },
  { name: "Diary.ru", icon: "Д", category: "Tools", color: "bg-red-400", getUrl: (u, t) => `https://www.diary.ru/create/?url=${encodeURIComponent(u)}&title=${encodeURIComponent(t)}` },

  { name: "XING", icon: "X", category: "Professional", color: "bg-teal-600", getUrl: (u) => `https://www.xing.com/spi/shares/new?url=${encodeURIComponent(u)}` },
  { name: "Yammer", icon: "Y", category: "Professional", color: "bg-blue-500", getUrl: (u, t) => `https://www.yammer.com/messages/new?login=true&trk_event=yammer_share&status=${encodeURIComponent(t + " " + u)}` },
  { name: "Threema", icon: "3", category: "Professional", color: "bg-gray-800", getUrl: (u, t) => `threema://compose?text=${encodeURIComponent(t + " " + u)}` },
  { name: "Workplace", icon: "W", category: "Professional", color: "bg-blue-600", getUrl: (u) => `https://work.facebook.com/sharer.php?display=popup&u=${encodeURIComponent(u)}` },

  { name: "Delicious", icon: "D", category: "Bookmarks", color: "bg-blue-500", getUrl: (u, t) => `https://del.icio.us/save?url=${encodeURIComponent(u)}&title=${encodeURIComponent(t)}` },
  { name: "StumbleUpon", icon: "SU", category: "Bookmarks", color: "bg-orange-500", getUrl: (u, t) => `https://mix.com/add?url=${encodeURIComponent(u)}` },
  { name: "Folkd", icon: "F", category: "Bookmarks", color: "bg-red-500", getUrl: (u, t) => `https://www.folkd.com/submit/${encodeURIComponent(u)}` },
  { name: "Meneame", icon: "M", category: "Bookmarks", color: "bg-blue-600", getUrl: (u, t) => `https://www.meneame.net/submit.php?url=${encodeURIComponent(u)}` },
  { name: "Wykop", icon: "W", category: "Bookmarks", color: "bg-green-700", getUrl: (u, t) => `https://www.wykop.pl/dodaj/link/?url=${encodeURIComponent(u)}&title=${encodeURIComponent(t)}` },
  { name: "Surfingbird", icon: "S", category: "Bookmarks", color: "bg-blue-400", getUrl: (u, t) => `https://surfingbird.ru/share?url=${encodeURIComponent(u)}&title=${encodeURIComponent(t)}` },
  { name: "Symbaloo", icon: "S", category: "Bookmarks", color: "bg-purple-500", getUrl: (u, t) => `https://www.symbaloo.com/add?url=${encodeURIComponent(u)}&title=${encodeURIComponent(t)}` },
  { name: "Refind", icon: "R", category: "Bookmarks", color: "bg-blue-500", getUrl: (u) => `https://refind.com/?url=${encodeURIComponent(u)}` },
  { name: "BibSonomy", icon: "B", category: "Bookmarks", color: "bg-blue-700", getUrl: (u, t) => `https://www.bibsonomy.org/ShowBookmarkEntry?url=${encodeURIComponent(u)}&description=${encodeURIComponent(t)}` },

  { name: "Google Bookmarks", icon: "G", category: "Google", color: "bg-red-500", getUrl: (u, t) => `https://www.google.com/bookmarks/mark?op=edit&bkmk=${encodeURIComponent(u)}&title=${encodeURIComponent(t)}` },
  { name: "Gmail", icon: "G", category: "Google", color: "bg-red-600", getUrl: (u, t, d) => `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(t)}&body=${encodeURIComponent((d || t) + "\n\n" + u)}` },
  { name: "Yahoo Mail", icon: "Y", category: "Google", color: "bg-purple-600", getUrl: (u, t) => `https://compose.mail.yahoo.com/?subject=${encodeURIComponent(t)}&body=${encodeURIComponent(u)}` },
  { name: "Outlook", icon: "O", category: "Google", color: "bg-blue-500", getUrl: (u, t) => `https://outlook.live.com/mail/0/deeplink/compose?subject=${encodeURIComponent(t)}&body=${encodeURIComponent(u)}` },

  { name: "Print", icon: "🖨", category: "Other", color: "bg-gray-600", getUrl: () => "javascript:window.print()" },
  { name: "SMS", icon: "💬", category: "Other", color: "bg-green-500", getUrl: (u, t) => `sms:?body=${encodeURIComponent(t + " " + u)}` },
  { name: "Amazon Kindle", icon: "K", category: "Other", color: "bg-yellow-600", getUrl: (u, t) => `https://freekindle.me/action/send/?url=${encodeURIComponent(u)}&title=${encodeURIComponent(t)}` },
  { name: "Papaly", icon: "P", category: "Other", color: "bg-teal-500", getUrl: (u) => `https://papaly.com/api/share?url=${encodeURIComponent(u)}` },
  { name: "Protopage", icon: "P", category: "Other", color: "bg-blue-400", getUrl: (u, t) => `https://www.protopage.com/add-button-site?url=${encodeURIComponent(u)}&label=${encodeURIComponent(t)}` },
  { name: "Mailru", icon: "M", category: "Other", color: "bg-blue-500", getUrl: (u, t) => `https://connect.mail.ru/share?url=${encodeURIComponent(u)}&title=${encodeURIComponent(t)}` },
  { name: "Pinboard", icon: "P", category: "Other", color: "bg-blue-600", getUrl: (u, t) => `https://pinboard.in/add?url=${encodeURIComponent(u)}&title=${encodeURIComponent(t)}` },
  { name: "Raindrop", icon: "R", category: "Other", color: "bg-blue-400", getUrl: (u, t) => `https://app.raindrop.io/add?link=${encodeURIComponent(u)}&title=${encodeURIComponent(t)}` },
  { name: "Mendeley", icon: "M", category: "Other", color: "bg-red-600", getUrl: (u) => `https://www.mendeley.com/import/?url=${encodeURIComponent(u)}` },
  { name: "Diaspora", icon: "D*", category: "Other", color: "bg-gray-800", getUrl: (u, t) => `https://share.diasporafoundation.org/?url=${encodeURIComponent(u)}&title=${encodeURIComponent(t)}` },
  { name: "Plurk", icon: "P", category: "Other", color: "bg-red-500", getUrl: (u, t) => `https://www.plurk.com/?qualifier=shares&status=${encodeURIComponent(t + " " + u)}` },
  { name: "Twiddla", icon: "T", category: "Other", color: "bg-blue-400", getUrl: (u) => `https://www.twiddla.com/new.aspx?url=${encodeURIComponent(u)}` },
  { name: "Yummly", icon: "Y", category: "Other", color: "bg-orange-500", getUrl: (u, t) => `https://www.yummly.com/urb/verify?url=${encodeURIComponent(u)}&title=${encodeURIComponent(t)}` },
  { name: "TypePad", icon: "T", category: "Other", color: "bg-green-700", getUrl: (u, t) => `https://www.typepad.com/services/quickpost/post?v=2&urlto=${encodeURIComponent(u)}&title=${encodeURIComponent(t)}` },
  { name: "Bookmarks.fr", icon: "B", category: "Other", color: "bg-blue-500", getUrl: (u, t) => `https://www.bookmarks.fr/Ede/savlink/?url=${encodeURIComponent(u)}&title=${encodeURIComponent(t)}` },
  { name: "NewsVine", icon: "N", category: "Other", color: "bg-green-600", getUrl: (u, t) => `https://www.newsvine.com/_tools/seed?u=${encodeURIComponent(u)}&h=${encodeURIComponent(t)}` },
  { name: "AOL Mail", icon: "A", category: "Other", color: "bg-blue-600", getUrl: (u, t) => `https://mail.aol.com/mail/compose-message.aspx?subject=${encodeURIComponent(t)}&body=${encodeURIComponent(u)}` },
  { name: "Zoho Mail", icon: "Z", category: "Other", color: "bg-red-500", getUrl: (u, t) => `https://mail.zoho.com/mail/compose?subject=${encodeURIComponent(t)}&body=${encodeURIComponent(u)}` },
];

const CATEGORIES = [...new Set(NETWORKS.map(n => n.category))];

export function SocialShareButton({ url, title, description }: ShareProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const filtered = useMemo(() => {
    let nets = NETWORKS;
    if (selectedCategory) nets = nets.filter(n => n.category === selectedCategory);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      nets = nets.filter(n => n.name.toLowerCase().includes(term) || n.category.toLowerCase().includes(term));
    }
    return nets;
  }, [searchTerm, selectedCategory]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleShare = (network: Network) => {
    const shareUrl = network.getUrl(url, title, description || "");
    if (shareUrl.startsWith("javascript:")) {
      window.print();
    } else {
      window.open(shareUrl, "_blank", "width=600,height=500,noopener,noreferrer");
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-border bg-card/50 text-muted-foreground hover:text-foreground hover:border-primary/20 transition-colors"
        data-testid="button-social-share"
      >
        <Share2 className="w-3.5 h-3.5" />
        Share
      </button>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setIsOpen(false)}>
        <div
          className="bg-card border border-border rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          data-testid="modal-social-share"
        >
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-bold text-foreground" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                Share
              </h3>
              <span className="text-xs text-muted-foreground">({NETWORKS.length} networks)</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground" data-testid="button-close-share">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-3 border-b border-border space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search networks..."
                  className="w-full bg-background/50 border border-border rounded-lg pl-8 pr-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                  data-testid="input-search-share"
                />
              </div>
              <button
                onClick={handleCopy}
                className={`px-3 py-2 text-xs rounded-lg border transition-all flex items-center gap-1.5 ${copied ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-card/50 border-border text-muted-foreground hover:text-foreground"}`}
                data-testid="button-copy-link"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied!" : "Copy Link"}
              </button>
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-2.5 py-1 text-[10px] rounded-lg border whitespace-nowrap transition-all ${!selectedCategory ? "bg-primary/10 border-primary/30 text-primary" : "bg-card/50 border-border text-muted-foreground hover:text-foreground"}`}
              >
                All
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                  className={`px-2.5 py-1 text-[10px] rounded-lg border whitespace-nowrap transition-all ${selectedCategory === cat ? "bg-primary/10 border-primary/30 text-primary" : "bg-card/50 border-border text-muted-foreground hover:text-foreground"}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {filtered.map((network) => (
                <button
                  key={network.name}
                  onClick={() => handleShare(network)}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-muted/20 transition-colors group"
                  title={network.name}
                  data-testid={`share-${network.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
                >
                  <div className={`w-10 h-10 rounded-full ${network.color} flex items-center justify-center text-white text-xs font-bold group-hover:scale-110 transition-transform`}>
                    {network.icon}
                  </div>
                  <span className="text-[10px] text-muted-foreground text-center leading-tight truncate w-full group-hover:text-foreground">
                    {network.name}
                  </span>
                </button>
              ))}
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No networks match your search</p>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-border">
            <div className="bg-muted/10 rounded-lg p-2 flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="text-[10px] text-muted-foreground truncate">{url}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
