import { useEffect, useRef, useState, useCallback } from "react";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const pushed = useRef(false);
  const [adFilled, setAdFilled] = useState(false);

  const checkAdFilled = useCallback(() => {
    if (!containerRef.current) return false;
    const ins = containerRef.current.querySelector("ins.adsbygoogle");
    if (!ins) return false;
    const status = ins.getAttribute("data-ad-status");
    if (status === "filled") {
      setAdFilled(true);
      return true;
    }
    if (status === "unfilled") {
      setAdFilled(false);
      return true;
    }
    const height = (ins as HTMLElement).offsetHeight;
    if (height > 0) {
      setAdFilled(true);
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    if (pushed.current) return;

    const tryPush = () => {
      try {
        if (typeof window !== "undefined" && window.adsbygoogle) {
          window.adsbygoogle.push({});
          pushed.current = true;

          const observer = new MutationObserver(() => {
            checkAdFilled();
          });

          if (containerRef.current) {
            observer.observe(containerRef.current, {
              childList: true,
              subtree: true,
              attributes: true,
              attributeFilter: ["data-ad-status", "style"],
            });
          }

          const interval = setInterval(() => {
            if (checkAdFilled()) {
              clearInterval(interval);
            }
          }, 500);

          setTimeout(() => clearInterval(interval), 10000);

          return () => {
            observer.disconnect();
            clearInterval(interval);
          };
        }
      } catch (e) {}
    };

    tryPush();
  }, [checkAdFilled]);

  if (!adFilled) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`ad-container overflow-hidden transition-all duration-300 ${className}`}
      data-testid={`ad-slot-${slot}`}
    >
      <ins
        className="adsbygoogle"
        style={{ display: "block", width: "100%", ...style }}
        data-ad-client="ca-pub-6443370520894068"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
        {...(layout ? { "data-ad-layout": layout } : {})}
        {...(layoutKey ? { "data-ad-layout-key": layoutKey } : {})}
      />
    </div>
  );
}
