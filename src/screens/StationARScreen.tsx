"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AudioPlayerBar } from "@/components/AudioPlayerBar";
import { StationDialog } from "@/components/StationDialog";
import { CaptionOverlay } from "@/components/CaptionOverlay";
import { ArViewport } from "@/features/ar/ArViewport";
import { stations } from "@/stations/stations";
import { useAppStore } from "@/state/store";
import { getNextStationId } from "@/state/store";
import { mcLoadStation, mcSetMode } from "@/lib/mcBridge";
import type { StationId } from "@/stations/stations";

/**
 * Station AR page with audio, dialog, and navigation buttons.
 * Audio file: AR_**_03.mp3 where ** is current station id + 1
 * Buttons: "Weiter!" (opens dialog) and special button(s) per station
 */
export function StationARScreen() {
  const params = useParams();
  const router = useRouter();
  const id = (params.id as string) || "s01";
  const stationId = useMemo(() => {
    const s = stations.find((s) => s.id === id);
    return s ? (s.id as StationId) : ("s01" as StationId);
  }, [id]);
  const station = useMemo(
    () => stations.find((s) => s.id === stationId),
    [stationId]
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [captionOpen, setCaptionOpen] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const setCurrentStation = useAppStore((s) => s.setCurrentStation);
  const unlockStation = useAppStore((s) => s.unlockStation);

  // Calculate audio file: AR_**_03.mp3 where ** is station id + 1
  // e.g., s01 -> AR_02_03.mp3, s02 -> AR_03_03.mp3
  const stationNum = Number(stationId.slice(1));
  const audioNum = String(stationNum + 1).padStart(2, '0');
  const audioFile = `/audio/AR_${audioNum}_03.mp3`;

  useEffect(() => {
    mcLoadStation(stationId);
    mcSetMode("station");
  }, [stationId]);

  const handleMehrErfahren = () => {
    setDialogOpen(true);
  };

  const handleCaptionToggle = () => {
    setCaptionOpen(!captionOpen);
  };

  const handleTimeUpdate = (currentTime: number, duration: number) => {
    setAudioCurrentTime(currentTime);
    setAudioDuration(duration);
  };

  const handleSpecialButton = (skipNext: boolean = false) => {
    // Get current station from store (not from URL) to ensure correct increment
    const currentStationId = useAppStore.getState().currentStationId;
    const currentNum = currentStationId === "s00" ? 0 : Number(currentStationId.slice(1));
    
    if (skipNext) {
      // Skip next station (increase by 2) - only for second button when there are 2 buttons
      const nextNum = currentNum + 2;
      if (nextNum <= 5) {
        const nextStationId = `s${String(nextNum).padStart(2, '0')}` as StationId;
        // Update current position to the new station
        setCurrentStation(nextStationId);
        unlockStation(nextStationId);
        // Redirect to map to show updated positions
        router.push("/map");
      }
    } else {
      // Normal flow (increase by 1) - for single button or first button when there are 2 buttons
      const nextNum = currentNum + 1;
      if (nextNum <= 5) {
        const nextStationId = `s${String(nextNum).padStart(2, '0')}` as StationId;
        // Update current position to the next station
        setCurrentStation(nextStationId);
        unlockStation(nextStationId);
        // Redirect to map to show updated positions
        router.push("/map");
      }
    }
  };

  if (!station) {
    return (
      <div className="station-ar-screen">
        <p className="p">Station nicht gefunden.</p>
        <Link href="/map" className="btn btnPrimary">Zur Karte</Link>
      </div>
    );
  }

  return (
    <div className="station-ar-screen" style={{
      position: "fixed",
      inset: 0,
      width: "100vw",
      height: "100vh",
      overflow: "hidden",
      background: "#000",
    }}>
      {/* Full screen AR Viewport */}
      <div style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 1,
      }}>
        <ArViewport station={station} mode="station" />
      </div>

      {/* Overlay UI - Absolute positioned */}
      <div className="station-ar-screen__overlay" style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 200, // Higher than caption overlay to ensure buttons are clickable
        background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 50%, transparent 100%)",
        padding: "24px 16px 16px",
      }}>
        <h2 className="station-ar-screen__title" style={{
          color: "white",
          fontSize: 24,
          fontWeight: "bold",
          margin: "0 0 16px 0",
          textShadow: "0 2px 8px rgba(0,0,0,0.5)",
        }}>
          {station.title}
        </h2>
        <div className="station-ar-screen__audio" style={{ marginBottom: 16 }}>
          <AudioPlayerBar 
            src={audioFile} 
            syncWithMattercraft={true}
            showCaptionButton={!!station.dialogContent}
            captionOpen={captionOpen}
            onCaptionClick={handleCaptionToggle}
            onTimeUpdate={handleTimeUpdate}
          />
        </div>
        <div className="station-ar-screen__actions" style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}>
          {/* "Mehr erfahren!" button - opens dialog */}
          <button 
            type="button" 
            className="btn btnPrimary" 
            onClick={handleMehrErfahren}
            style={{
              padding: "14px 24px",
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            Mehr erfahren!
          </button>
          
          {/* Special button(s) */}
          {station.specialButtonTitle && (
            <button 
              type="button" 
              className="btn" 
              onClick={() => handleSpecialButton(false)}
              style={{
                padding: "14px 24px",
                fontSize: 16,
                fontWeight: 600,
                background: "rgba(255, 255, 255, 0.2)",
                color: "white",
                border: "2px solid rgba(255, 255, 255, 0.5)",
              }}
            >
              {station.specialButtonTitle}
            </button>
          )}
          
          {/* Multiple special buttons (for station 4+) */}
          {station.specialButtonTitles && station.specialButtonTitles.length > 0 && (
            <>
              {station.specialButtonTitles.map((title, index) => (
                <button 
                  key={index}
                  type="button" 
                  className="btn" 
                  onClick={() => handleSpecialButton(index === 1)} // Second button skips next station
                  style={{
                    padding: "14px 24px",
                    fontSize: 16,
                    fontWeight: 600,
                    background: "rgba(255, 255, 255, 0.2)",
                    color: "white",
                    border: "2px solid rgba(255, 255, 255, 0.5)",
                  }}
                >
                  {title}
                </button>
              ))}
            </>
          )}
        </div>
      </div>
      
      {/* Dialog */}
      {dialogOpen && (
        <StationDialog
          station={station}
          onClose={() => setDialogOpen(false)}
        />
      )}

      {/* Caption Overlay */}
      {captionOpen && station.dialogContent && (
        <CaptionOverlay
          script={station.dialogContent}
          currentTime={audioCurrentTime}
          duration={audioDuration}
          onClose={() => setCaptionOpen(false)}
        />
      )}
    </div>
  );
}
