"use client";

import { useRouter } from "next/navigation";
import { useAppStore } from "@/state/store";

/**
 * First welcome page with P_01_2.png background.
 * Shows center text and two buttons at bottom.
 */
export function StartScreen() {
  const router = useRouter();
  const unlockTour = useAppStore((s) => s.unlockTour);
  const setCurrentStation = useAppStore((s) => s.setCurrentStation);

  const handleReady = () => {
    unlockTour();
    setCurrentStation("s00" as any);
    router.push("/map");
  };

  const handleInfo = () => {
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
      paddingBottom: `max(40px, calc(24px + env(safe-area-inset-bottom)))`,
    }}>
      {/* Content and buttons at bottom */}
      <div style={{
        width: "100%",
        maxWidth: 600,
        display: "flex",
        flexDirection: "column",
        gap: 24,
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
          onClick={handleReady}
          style={{
            flex: 1,
            padding: "16px 24px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            border: "none",
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.4)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
          }}
        >
          Ja, ich bin bereit!
        </button>
        <button
          type="button"
          onClick={handleInfo}
          style={{
            flex: 1,
            padding: "16px 24px",
            background: "rgba(255, 255, 255, 0.2)",
            color: "white",
            border: "2px solid rgba(255, 255, 255, 0.5)",
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 600,
            cursor: "pointer",
            backdropFilter: "blur(10px)",
            transition: "background 0.2s, border-color 0.2s",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)";
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.7)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.5)";
          }}
        >
          Worum geht es hier eigentlich?
        </button>
        </div>
      </div>
    </div>
  );
}
