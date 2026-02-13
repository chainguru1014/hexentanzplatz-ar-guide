"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { StationId } from "@/stations/stations";
import { useBottomSafeArea } from "@/hooks/useIsMobile";

/**
 * Arrived page shown after successful QR scan.
 * Shows background image P_xx_2.png where xx is target station id + 1.
 * Has "Erlebnis starten" button that redirects to station page.
 */
export function ArrivedScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stationParam = searchParams.get("station");
  const bottomPadding = useBottomSafeArea();
  const [isNavigating, setIsNavigating] = useState(false);
  const stationId = useMemo(() => {
    if (!stationParam) return "s01" as StationId;
    return stationParam as StationId;
  }, [stationParam]);

  // Calculate image number: station id + 1
  // e.g., s01 -> P_02_2.png, s02 -> P_03_2.png
  const stationNum = Number(stationId.slice(1));
  const imageNum = String(stationNum + 1).padStart(2, '0');
  const [imageFormat, setImageFormat] = useState<"png" | "jpg">("png");
  const backgroundImage = `/images/P_${imageNum}_2.${imageFormat}`;

  const handleImageError = () => {
    // Fallback to .jpg if .png fails to load
    if (imageFormat === "png") {
      setImageFormat("jpg");
    }
  };

  const handleStart = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    router.push(`/station/${stationId}`);
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      width: "100vw",
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-end",
      alignItems: "center",
      padding: 24,
      paddingBottom: `${Math.max(80, 40 + bottomPadding)}px`, // Move button up more, especially on mobile
      overflow: "hidden",
    }}>
      {/* Background image with error handling */}
      <img
        src={backgroundImage}
        alt=""
        onError={handleImageError}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: 0,
        }}
      />
      <div style={{ 
        position: "relative", 
        zIndex: 1,
        width: "100%",
        maxWidth: 400,
      }}>
        <button
          type="button"
          onClick={handleStart}
          disabled={isNavigating}
          style={{
            width: "100%",
            padding: "16px 24px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            border: "none",
            borderRadius: 12,
            fontSize: 18,
            fontWeight: 600,
            cursor: isNavigating ? "not-allowed" : "pointer",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            transition: "transform 0.2s, box-shadow 0.2s",
            position: "relative",
            zIndex: 10,
            pointerEvents: "auto",
            opacity: isNavigating ? 0.6 : 1,
          }}
          onMouseOver={(e) => {
            if (!isNavigating) {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.4)";
            }
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleStart();
          }}
        >
          {isNavigating ? "Wird verarbeitet..." : "Erlebnis starten"}
        </button>
      </div>
    </div>
  );
}
