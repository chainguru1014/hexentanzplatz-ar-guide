"use client";

import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { StationMap } from "@/components/StationMap";
import { useAppStore, getNextStationId } from "@/state/store";
import type { StationId } from "@/stations/stations";

/**
 * Map (2nd page). Background = public/images/map-bg.jpg
 * Shows current station (green lock), next target (red lock + red circle).
 * At 1st station: button "Tour starten" → AR page. Else: "Wir sind da" → scan.
 */
export function MapScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toParam = searchParams.get("to");
  const currentStationId = useAppStore((s) => s.currentStationId);
  const unlockedStations = useAppStore((s) => s.unlockedStations);
  
  // Handle position 0 (start position) - target is station 1
  // If 'to' parameter is provided (from QR scan), use it as current and advance to next
  // Otherwise, use current station and get next target
  let targetStationId: StationId;
  let actualCurrentStationId: StationId | "s00";
  
  // DON'T update positions here - positions should only change when clicking buttons in station page
  // Just use the current station from store to display the map
  actualCurrentStationId = currentStationId;
  if (currentStationId === "s00") {
    // At start position (0), target is station 1
    targetStationId = "s01";
  } else {
    targetStationId = getNextStationId(currentStationId as StationId);
  }
  
  const nextStationId = targetStationId;
  const isAtStartPosition = actualCurrentStationId === "s00";
  const isAtFirstStation = actualCurrentStationId === "s01" && nextStationId === "s02";

  const handleMapButton = () => {
    // All cases redirect to scan page (including start position)
    router.push(`/scan?expect=${nextStationId}`);
  };

  return (
    <div className="map-screen-full" style={{
      position: "fixed",
      inset: 0,
      width: "100vw",
      height: "100vh",
      overflow: "hidden",
    }}>
      <div
        className="map-screen-full__bg map-screen-full__bg--image"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url(/images/map-bg.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <StationMap
        currentStationId={actualCurrentStationId === "s00" ? undefined : actualCurrentStationId}
        unlockedStations={unlockedStations}
        nextStationId={nextStationId}
        maxStations={5}
      />
      <div className="map-screen-full__footer" style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: "20px 24px 24px",
        paddingBottom: "max(24px, env(safe-area-inset-bottom))",
        background: "linear-gradient(to top, rgba(11,15,26,.95), transparent)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-end",
        textAlign: "center",
        width: "100%",
        boxSizing: "border-box",
        zIndex: 10,
      }}>
        <div style={{
          width: "100%",
          maxWidth: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}>
          <p className="map-screen-full__instruction" style={{
            margin: "0 0 12px 0",
            padding: "12px 16px",
            background: "rgba(0, 0, 0, 0.7)",
            color: "white",
            fontSize: 14,
            lineHeight: 1.4,
            textAlign: "center",
            width: "100%",
            maxWidth: "100%",
            boxSizing: "border-box",
          }}>
            Begib Dich zum rot leuchtenden Kreis. Die Tour startet automatisch, wenn du den Punkt erreicht hast.
          </p>
          <button
            type="button"
            className="btn btnPrimary map-screen-full__cta"
            onClick={handleMapButton}
            style={{
              width: "100%",
              maxWidth: "100%",
            }}
          >
            Zielpunkt erreicht
          </button>
        </div>
      </div>
    </div>
  );
}
