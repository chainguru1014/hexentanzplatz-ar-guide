"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/state/store";
import { useBottomSafeArea } from "@/hooks/useIsMobile";

/**
 * First welcome page with P_01_2.png background.
 * Shows center text and two buttons at bottom.
 */
export function StartScreen() {
  const router = useRouter();
  const unlockTour = useAppStore((s) => s.unlockTour);
  const setCurrentStation = useAppStore((s) => s.setCurrentStation);
  const bottomPadding = useBottomSafeArea();
  const [isNavigatingReady, setIsNavigatingReady] = useState(false);
  const [isNavigatingInfo, setIsNavigatingInfo] = useState(false);

  const handleReady = () => {
    if (isNavigatingReady || isNavigatingInfo) return;
    setIsNavigatingReady(true);
    try {
      unlockTour();
      setCurrentStation("s00" as any);
      // Navigate immediately (non-blocking)
      router.push("/map");
    } catch (error) {
      console.error("Error in handleReady:", error);
      // Fallback: try navigation anyway
      router.push("/map");
    }
  };

  const handleInfo = () => {
    if (isNavigatingReady || isNavigatingInfo) return;
    setIsNavigatingInfo(true);
    unlockTour();
    setCurrentStation("s00" as any);
    router.push("/intro");
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      width: "100vw",
      height: "100vh",
      backgroundImage: "url(/images/P_01_2.png)",
      backgroundSize: "cover",
      backgroundPosition: "center",
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-end",
      alignItems: "center",
      padding: 24,
      paddingBottom: `${Math.max(40, 24 + bottomPadding)}px`,
    }}>
      {/* Content and buttons at bottom */}
      <div style={{
        width: "100%",
        maxWidth: 600,
        display: "flex",
        flexDirection: "column",
        gap: 24,
        position: "relative",
        zIndex: 10,
        pointerEvents: "auto",
      }}>
        {/* Body text */}
        <p style={{
          fontSize: 20,
          fontWeight: 500,
          color: "white",
          textAlign: "center",
          margin: 0,
          textShadow: "0 2px 8px rgba(0,0,0,0.5)",
          lineHeight: 1.5,
        }}>
          Seid ihr bereit in die tieferen Mysterien dieses Ortes einzutauchen?
        </p>

        {/* Two buttons */}
        <div style={{
          display: "flex",
          gap: 16,
          width: "100%",
          flexDirection: "row",
          justifyContent: "center",
        }}>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleReady();
          }}
          disabled={isNavigatingReady || isNavigatingInfo}
          style={{
            flex: 1,
            padding: "16px 24px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            border: "none",
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 600,
            cursor: (isNavigatingReady || isNavigatingInfo) ? "not-allowed" : "pointer",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            transition: "transform 0.2s, box-shadow 0.2s",
            position: "relative",
            zIndex: 10,
            pointerEvents: "auto",
            opacity: (isNavigatingReady || isNavigatingInfo) ? 0.6 : 1,
          }}
          onMouseOver={(e) => {
            if (!isNavigatingReady && !isNavigatingInfo) {
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
            handleReady();
          }}
        >
          {isNavigatingReady ? "Wird verarbeitet..." : "Ja, ich bin bereit!"}
        </button>
        <button
          type="button"
          onClick={handleInfo}
          disabled={isNavigatingReady || isNavigatingInfo}
          style={{
            flex: 1,
            padding: "16px 24px",
            background: "rgba(255, 255, 255, 0.2)",
            color: "white",
            border: "2px solid rgba(255, 255, 255, 0.5)",
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 600,
            cursor: (isNavigatingReady || isNavigatingInfo) ? "not-allowed" : "pointer",
            backdropFilter: "blur(10px)",
            transition: "background 0.2s, border-color 0.2s",
            opacity: (isNavigatingReady || isNavigatingInfo) ? 0.6 : 1,
          }}
          onMouseOver={(e) => {
            if (!isNavigatingReady && !isNavigatingInfo) {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.7)";
            }
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.5)";
          }}
        >
          {isNavigatingInfo ? "Wird verarbeitet..." : "Worum geht es hier eigentlich?"}
        </button>
        </div>
      </div>
    </div>
  );
}
