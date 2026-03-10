import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";

const BANNER_SIZES: Record<string, { width: number; height: number }> = {
  "728x90": { width: 728, height: 90 },
  "468x60": { width: 468, height: 60 },
  "300x250": { width: 300, height: 250 },
  "160x600": { width: 160, height: 600 },
  "320x50": { width: 320, height: 50 },
  "970x90": { width: 970, height: 90 },
  "336x280": { width: 336, height: 280 },
};

interface BannerRotationProps {
  zone: string;
  size: string;
  className?: string;
}

export function BannerRotation({ zone, size, className = "" }: BannerRotationProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: bannerList } = useQuery({
    queryKey: ["banners", zone],
    queryFn: async () => {
      const res = await fetch(`/api/banners/${zone}`);
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 60000,
  });

  const { data: settings } = useQuery({
    queryKey: ["banner-settings"],
    queryFn: async () => {
      const res = await fetch("/api/banner-settings");
      if (!res.ok) return {};
      return res.json();
    },
    staleTime: 60000,
  });

  const banners = Array.isArray(bannerList) ? bannerList : [];
  const rotationEnabled = settings?.banner_rotation_enabled !== "false";
  const rotationInterval = parseInt(settings?.banner_rotation_interval || "8") * 1000;

  useEffect(() => {
    if (!rotationEnabled || banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, rotationInterval);
    return () => clearInterval(timer);
  }, [rotationEnabled, banners.length, rotationInterval]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [zone]);

  const handleClick = useCallback((bannerId: number) => {
    fetch(`/api/banners/${bannerId}/click`, { method: "POST" }).catch(() => {});
  }, []);

  const dims = BANNER_SIZES[size] || { width: 468, height: 60 };

  if (banners.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`}
        style={{ width: dims.width, height: dims.height }}
        data-testid={`banner-placeholder-${zone}`}>
        <a href="/advertise"
          className="flex items-center justify-center w-full h-full border border-dashed border-border/30 rounded-md bg-muted/5 hover:bg-muted/15 transition-colors cursor-pointer"
          data-testid={`link-advertise-${zone}`}>
          <span className="text-[10px] text-muted-foreground/40 tracking-wide">Advertise Here</span>
        </a>
      </div>
    );
  }

  const banner = banners[currentIndex % banners.length];
  if (!banner) return null;

  return (
    <div className={`relative flex items-center justify-center ${className}`}
      style={{ width: dims.width, height: dims.height }}
      data-testid={`banner-${zone}`}>
      <a href={banner.targetUrl} target="_blank" rel="noopener noreferrer sponsored"
        onClick={() => handleClick(banner.id)}
        className="block transition-opacity hover:opacity-90"
        data-testid={`banner-link-${banner.id}`}>
        <img src={banner.imageUrl} alt={banner.name || "Advertisement"}
          style={{ width: dims.width, height: dims.height, objectFit: "cover" }}
          className="rounded"
          loading="lazy" />
      </a>
      {banners.length > 1 && rotationEnabled && (
        <div className="absolute bottom-1 right-1 flex gap-0.5">
          {banners.map((_: any, i: number) => (
            <span key={i} className={`w-1 h-1 rounded-full ${i === currentIndex % banners.length ? "bg-primary" : "bg-muted-foreground/30"}`} />
          ))}
        </div>
      )}
    </div>
  );
}
