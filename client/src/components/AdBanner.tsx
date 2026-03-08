import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface AdBannerProps {
  slot: string;
  format?: "auto" | "horizontal" | "vertical" | "rectangle" | "fluid";
  layout?: string;
  layoutKey?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function AdBanner({ slot, format = "auto", layout, layoutKey, className = "", style }: AdBannerProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const pushed = useRef(false);
  const [adLoaded, setAdLoaded] = useState(false);

  useEffect(() => {
    if (pushed.current) return;
    try {
      if (typeof window !== "undefined" && window.adsbygoogle) {
        window.adsbygoogle.push({});
        pushed.current = true;
        setAdLoaded(true);
      }
    } catch (e) {
      // AdSense not loaded - show placeholder
    }
  }, []);

  const minHeight = style?.minHeight || (format === "rectangle" ? "250px" : "90px");

  return (
    <div
      ref={adRef}
      className={`ad-container overflow-hidden ${className}`}
      style={{ minHeight, ...style }}
      data-testid={`ad-slot-${slot}`}
    >
      <ins
        className="adsbygoogle"
        style={{ display: "block", width: "100%", ...style }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
        {...(layout ? { "data-ad-layout": layout } : {})}
        {...(layoutKey ? { "data-ad-layout-key": layoutKey } : {})}
      />
      {!adLoaded && (
        <div
          className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] flex flex-col items-center justify-center gap-1 text-muted-foreground/40"
          style={{ minHeight }}
        >
          <div className="text-[10px] uppercase tracking-widest font-medium">Advertisement</div>
          <div className="text-[9px] font-mono opacity-50">Ad Slot: {slot}</div>
        </div>
      )}
    </div>
  );
}
