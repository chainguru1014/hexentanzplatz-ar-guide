"use client";

import { useRouter } from "next/navigation";
import { useAppStore } from "@/state/store";

/**
 * Welcome/Explanation page shown after Start button.
 * Shows tour explanation with image and text, with Skip button to map.
 */
export function WelcomeScreen() {
  const router = useRouter();
  const unlockTour = useAppStore((s) => s.unlockTour);
  const setCurrentStation = useAppStore((s) => s.setCurrentStation);

  const handleSkip = () => {
    unlockTour();
    // Set to position 0 (start position, station 1 will be target)
    setCurrentStation("s00" as any);
    router.push("/map");
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "white",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Image at top - Village street scene */}
      <div style={{
        width: "100%",
        height: "40vh",
        minHeight: 300,
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
        flex: 1,
        padding: 24,
        display: "flex",
        flexDirection: "column",
      }}>
        <h2 style={{
          fontSize: 24,
          fontWeight: "bold",
          margin: "0 0 16px 0",
          color: "#000",
        }}>
          Erläuterung zur Tour:
        </h2>
        
        <div style={{
          flex: 1,
          overflowY: "auto",
          marginBottom: 24,
        }}>
          <p style={{
            fontSize: 16,
            lineHeight: 1.6,
            color: "#333",
            margin: 0,
          }}>
            Dieses vorliegende Konzept bietet eine Übersicht über die Themeninhalte und Umsetzungsansätze der einzelnen Stationen. Die Audioebene ist überall gesetzt. Das heißt, dass der Waldschrat und die Waldfee immer etwas Kurzes dazu äußern, manchmal mit AR, manchmal ohne. Wenn es noch mehr zu diesem Punkt zu sagen gibt, wird das als Zusatzinformation entweder in der App präsentiert mit Bild und zusätzlichem Lesetext oder auch einem weiteren Audiofile. Alle Dialoge, die hier beispielhaft aufgeführt werden, sind bereits in finaler Weise ausformuliert. Die Hauptfunktion dieser Dialoge ist…
          </p>
        </div>

        {/* Skip button at bottom */}
        <button
          type="button"
          onClick={handleSkip}
          style={{
            padding: "16px 24px",
            background: "#4caf50",
            color: "white",
            border: "none",
            borderRadius: 12,
            fontSize: 18,
            fontWeight: 600,
            cursor: "pointer",
            width: "100%",
            transition: "background 0.2s",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "#45a049";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "#4caf50";
          }}
        >
          Überspringen
        </button>
      </div>
    </div>
  );
}
