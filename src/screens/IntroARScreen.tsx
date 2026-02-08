"use client";

import { useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AudioPlayerBar } from "@/components/AudioPlayerBar";
import { stations } from "@/stations/stations";
import { useAppStore } from "@/state/store";
import { mcLoadStation, mcSetMode } from "@/lib/mcBridge";

/**
 * Intro AR: 1 character (Mephisto or Frigg) in AR.
 * Audio + play/pause + progress. Button "Ok, wir kommen" → /map.
 */
export function IntroARScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stationId = (searchParams.get("s") || "s01") as import("@/stations/stations").StationId;
  const station = useMemo(
    () => stations.find((s) => s.id === stationId),
    [stationId]
  );
  const unlockTour = useAppStore((s) => s.unlockTour);
  const unlockStation = useAppStore((s) => s.unlockStation);

  useEffect(() => {
    unlockTour();
    // DON'T update current station here - positions should only change when clicking buttons in station page
    mcLoadStation(stationId);
    mcSetMode("welcome");
  }, [stationId, unlockTour]);

  if (!station) {
    return (
      <div className="intro-ar-screen">
        <p className="p">Station nicht gefunden.</p>
        <Link href="/" className="btn btnPrimary">Zurück</Link>
      </div>
    );
  }

  const handleButtonClick = () => {
    router.push("/map");
  };

  return (
    <div className="intro-ar-screen" style={{
      position: "fixed",
      inset: 0,
      width: "100vw",
      height: "100vh",
      background: "white",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    }}>
      {/* Scrollable content section */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        overflowX: "hidden",
        display: "flex",
        flexDirection: "column",
        paddingBottom: 100, // Space for fixed button
      }}>
        {/* Image at top - Village street scene */}
        <div style={{
          width: "100%",
          height: "40vh",
          minHeight: 300,
          flexShrink: 0,
          backgroundImage: "url(/images/village-street.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          backgroundColor: "#e8e8e8",
          position: "relative",
        }}>
          {/* Fallback placeholder if image doesn't exist */}
          <img 
            src="/images/village-street.jpg" 
            alt="Village street scene"
            onError={(e) => {
              const target = e.currentTarget;
              target.style.display = "none";
              if (target.parentElement) {
                target.parentElement.style.backgroundImage = "url(/images/placeholder.jpg)";
              }
            }}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        </div>

        {/* Content section */}
        <div style={{
          padding: 24,
          display: "flex",
          flexDirection: "column",
        }}>
          <h1 style={{
            fontSize: 24,
            fontWeight: "bold",
            margin: "0 0 24px 0",
            color: "#000",
          }}>
            Erläuterung zur Tour:
          </h1>
          <p style={{
            fontSize: 16,
            lineHeight: 1.6,
            color: "#333",
            margin: 0,
            whiteSpace: "pre-wrap",
          }}>
            Dieses vorliegende Konzept bietet eine Übersicht über die Themeninhalte und Umsetzungsansätze der einzelnen Stationen. Die Audioebene ist überall gesetzt. Das heißt, dass der Waldschrat und die Waldfee immer etwas Kurzes dazu äußern, manchmal mit AR, manchmal ohne. Wenn es noch mehr zu diesem Punkt zu sagen gibt, wird das als Zusatzinformation entweder in der App präsentiert mit Bild und zusätzlichem Lesetext oder auch einem weiteren Audiofile. Alle Dialoge, die hier beispielhaft aufgeführt werden, sind bereits in finaler Weise ausformuliert. Die Hauptfunktion dieser Dialoge ist es eine dem Narrativ der Einweihung entsprechende Atmosphäre zu kreieren, den Hexentanzplatz in mystische Schwingung zu versetzen und Lust auf Mephisto und die Hexen zu machen, so dass ein Musical-Besuch eine logische Folge ist. Die Aufgabe der Dialoge ist es nicht das Wissen zu wiederholen, was bereits auf den Tafeln und anderen Wegen präsentiert wird. Es geht in diesem Konzept vor allem darum, einen Mehrwert zu gestalten, über das zu Erwartende hinaus.
          </p>
        </div>
      </div>

      {/* Fixed button at bottom */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        padding: "16px 24px",
        background: "white",
        borderTop: "1px solid #e0e0e0",
        zIndex: 100,
        boxShadow: "0 -2px 10px rgba(0,0,0,0.1)",
      }}>
        <button
          type="button"
          onClick={handleButtonClick}
          className="btn btnPrimary"
          style={{
            width: "100%",
            padding: "16px 24px",
            fontSize: 18,
            fontWeight: 600,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            border: "none",
            borderRadius: 12,
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
          Weiter
        </button>
      </div>
    </div>
  );
}
