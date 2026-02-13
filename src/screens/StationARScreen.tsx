"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AudioPlayerBar, type AudioPlayerBarRef } from "@/components/AudioPlayerBar";
import { StationDialog } from "@/components/StationDialog";
import { CaptionOverlay } from "@/components/CaptionOverlay";
import { ArViewport } from "@/features/ar/ArViewport";
import { stations } from "@/stations/stations";
import { useAppStore } from "@/state/store";
import { getNextStationId } from "@/state/store";
import { mcLoadStation, mcSetMode, mcPlayAudio, mcPauseAudio, mcShowModel2, mcHideModel2, mcPlayModel2, mcPauseModel2 } from "@/lib/mcBridge";
import type { StationId } from "@/stations/stations";
import { useBottomSafeArea } from "@/hooks/useIsMobile";
import { parseDialogScript, convertToTimeBasedLines, getSpeakerAtTime, type Speaker } from "@/utils/speakerDetection";
import { persistAudioState, loadAudioState } from "@/state/persist";

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
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [mattercraftReady, setMattercraftReady] = useState(false);
  const [navigatingButtonIndex, setNavigatingButtonIndex] = useState<number | null>(null);
  const mainAudioRef = useRef<AudioPlayerBarRef>(null);
  const bottomPadding = useBottomSafeArea();
  const setCurrentStation = useAppStore((s) => s.setCurrentStation);
  const unlockStation = useAppStore((s) => s.unlockStation);

  // Station 3+ dual model support
  const stationNum = Number(stationId.slice(1));
  const isStation3Plus = stationNum >= 3;
  const didShowModel2Ref = useRef(false);
  const lastSpeakerRef = useRef<Speaker>(null);

  // Parse dialog script for speaker detection (Station 3+)
  const dialogLines = useMemo(() => {
    if (!station?.dialogContent || !isStation3Plus) return [];
    const parsed = parseDialogScript(station.dialogContent);
    return parsed;
  }, [station?.dialogContent, isStation3Plus]);

  const timeBasedDialogLines = useMemo(() => {
    if (dialogLines.length === 0 || audioDuration <= 0) return [];
    return convertToTimeBasedLines(dialogLines, audioDuration);
  }, [dialogLines, audioDuration]);

  // Use station's dialogAudio - it's already correctly configured in stations.ts
  const audioFile = station?.dialogAudio || (() => {
    const audioNum = String(stationNum + 1).padStart(2, '0');
    // Default pattern: AR_XX_03.mp3 for stations 1-2, AR_XX_3.mp3 for stations 3+
    if (stationNum >= 3) {
      return `/audio/AR_${audioNum}_3.mp3`;
    }
    return `/audio/AR_${audioNum}_03.mp3`;
  })();
  
  // Log audio file for debugging
  useEffect(() => {
    console.log(`[StationARScreen] Station ${stationId} audio file:`, audioFile);
  }, [stationId, audioFile]);

  // Load persisted audio state when station changes
  useEffect(() => {
    const savedState = loadAudioState();
    if (savedState && savedState.stationId === stationId) {
      // Restore audio state if same station
      setAudioCurrentTime(savedState.currentTime);
      setAudioPlaying(savedState.playing);
      
      // Restore playing state after a short delay to ensure audio is loaded
      if (savedState.playing) {
        setTimeout(() => {
          if (mainAudioRef.current) {
            mainAudioRef.current.play();
          }
        }, 1000);
      }
    } else {
      // Clear persisted state if different station
      persistAudioState(null);
      setAudioCurrentTime(0);
      setAudioPlaying(false);
    }
  }, [stationId]); // When station changes

  // Persist audio state when it changes
  useEffect(() => {
    if (audioCurrentTime > 0 || audioPlaying) {
      persistAudioState({
        stationId,
        currentTime: audioCurrentTime,
        playing: audioPlaying,
      });
    }
  }, [stationId, audioCurrentTime, audioPlaying]);

  // Listen for MC_READY to enable buttons and show model 2 for Station 3+
  useEffect(() => {
    const handleMCReady = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data;
      if (data?.type === "MC_READY" || (data?.type === "MC_STATE" && data?.ready)) {
        console.log(`[StationARScreen] Mattercraft ready for Station ${stationNum}`);
        setMattercraftReady(true);
        
        if (isStation3Plus && !didShowModel2Ref.current) {
          console.log(`[StationARScreen] Showing model 2 for Station ${stationNum}`);
          mcShowModel2();
          didShowModel2Ref.current = true;
        }
      }
    };

    window.addEventListener("message", handleMCReady);
    
    // Set a timeout fallback (3 seconds) to enable buttons even if MC_READY doesn't fire
    const fallbackTimer = setTimeout(() => {
      console.log(`[StationARScreen] Mattercraft ready fallback (timeout) for Station ${stationNum}`);
      setMattercraftReady(true);
    }, 3000); // 3 seconds delay
    
    return () => {
      window.removeEventListener("message", handleMCReady);
      clearTimeout(fallbackTimer);
    };
  }, [isStation3Plus, stationNum]);
  
  // Reset Mattercraft ready state when station changes
  useEffect(() => {
    setMattercraftReady(false);
  }, [stationId]);

  // Station 3+ boot logic: Show 2nd model (also try immediately in case Mattercraft is already ready)
  useEffect(() => {
    if (isStation3Plus) {
      if (!didShowModel2Ref.current) {
        console.log(`[StationARScreen] Station ${stationNum} (3+): Attempting to show model 2`);
        // Send MC_SHOW1 command (will work if Mattercraft is ready, otherwise wait for MC_READY)
        mcShowModel2();
        // Set a timeout to retry if Mattercraft isn't ready yet
        const retryTimer = setTimeout(() => {
          if (!didShowModel2Ref.current) {
            console.log(`[StationARScreen] Retrying to show model 2 for Station ${stationNum}`);
            mcShowModel2();
            didShowModel2Ref.current = true;
          }
        }, 2000);
        return () => clearTimeout(retryTimer);
      }
    } else {
      // Station 1-2: Hide model 2 if it was shown
      if (didShowModel2Ref.current) {
        console.log(`[StationARScreen] Station ${stationNum} (1-2): Hiding model 2`);
        mcHideModel2();
        mcPauseModel2();
        didShowModel2Ref.current = false;
      }
      lastSpeakerRef.current = null;
    }
  }, [stationId, isStation3Plus, stationNum]);

  // Reset didShowModel2Ref when station changes to ensure it shows again
  useEffect(() => {
    didShowModel2Ref.current = false;
  }, [stationId]);

  useEffect(() => {
    mcLoadStation(stationId);
    mcSetMode("station");
  }, [stationId]);

  const handleMehrErfahren = () => {
    // Pause main audio when dialog opens
    if (mainAudioRef.current?.isPlaying()) {
      mainAudioRef.current.pause();
    }
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleCaptionToggle = () => {
    setCaptionOpen(!captionOpen);
  };

  const handleTimeUpdate = (currentTime: number, duration: number) => {
    setAudioCurrentTime(currentTime);
    setAudioDuration(duration);
  };

  const handlePlay = () => {
    setAudioPlaying(true);
    
    // Station 3+: Control models based on current speaker
    if (isStation3Plus && timeBasedDialogLines.length > 0) {
      const speaker = getSpeakerAtTime(timeBasedDialogLines, audioCurrentTime);
      console.log(`[StationARScreen] Audio resumed, current speaker: ${speaker}`);
      
      if (speaker === "MEPHISTO") {
        mcPlayAudio();
        mcPauseModel2();
      } else if (speaker === "HOLLA") {
        mcPauseAudio();
        mcPlayModel2();
      } else {
        // No speaker detected, default to model 1
        mcPlayAudio();
        mcPauseModel2();
      }
      lastSpeakerRef.current = speaker;
    } else {
      // Station 1-2: Normal play
      mcPlayAudio();
    }
  };

  const handlePause = () => {
    setAudioPlaying(false);
    
    // Station 3+: Pause both models
    if (isStation3Plus) {
      mcPauseAudio();
      mcPauseModel2();
    } else {
      // Station 1-2: Normal pause
      mcPauseAudio();
    }
  };

  // Station 3+ speaker-based model control
  useEffect(() => {
    if (!isStation3Plus || !audioPlaying || timeBasedDialogLines.length === 0) {
      return;
    }

    const speaker = getSpeakerAtTime(timeBasedDialogLines, audioCurrentTime);
    
    if (!speaker) return;

    // Only send commands when speaker changes
    if (lastSpeakerRef.current === speaker) return;
    
    lastSpeakerRef.current = speaker;
    console.log(`[StationARScreen] Speaker changed to: ${speaker} at time ${audioCurrentTime.toFixed(2)}`);

    if (speaker === "MEPHISTO") {
      console.log("[StationARScreen] Mephisto speaking: MC_PLAY + MC_PAUSE1");
      mcPlayAudio();
      mcPauseModel2();
    } else if (speaker === "HOLLA") {
      console.log("[StationARScreen] Holla speaking: MC_PAUSE + MC_PLAY1");
      mcPauseAudio();
      mcPlayModel2();
    }
  }, [isStation3Plus, audioPlaying, audioCurrentTime, timeBasedDialogLines]);

  // Reset speaker state when station changes
  useEffect(() => {
    lastSpeakerRef.current = null;
  }, [stationId]);

  const handleSpecialButton = (skipNext: boolean = false, buttonIndex: number = 0) => {
    if (navigatingButtonIndex !== null) return;
    setNavigatingButtonIndex(buttonIndex);
    
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
        padding: "24px 16px",
        paddingBottom: `${16 + bottomPadding}px`,
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
            ref={mainAudioRef}
            src={audioFile} 
            syncWithMattercraft={!isStation3Plus} // Don't sync for Station 3+ (we handle it manually)
            showCaptionButton={!!station.dialogContent}
            captionOpen={captionOpen}
            onCaptionClick={handleCaptionToggle}
            onTimeUpdate={handleTimeUpdate}
            onPlay={handlePlay}
            onPause={handlePause}
            onEnded={() => {
              setAudioPlaying(false);
              // Auto-pause both models when audio ends (Station 3+)
              if (isStation3Plus) {
                mcPauseAudio();
                mcPauseModel2();
              } else {
                mcPauseAudio();
              }
              // Clear persisted audio state
              persistAudioState(null);
            }}
          />
        </div>
        <div className="station-ar-screen__actions" style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}>
          {/* "Mehr erfahren!" button - opens dialog (doesn't navigate, so no loading state) */}
          <button 
            type="button" 
            className="btn btnPrimary" 
            onClick={handleMehrErfahren}
            disabled={navigatingButtonIndex !== null || !mattercraftReady}
            style={{
              padding: "14px 24px",
              fontSize: 16,
              fontWeight: 600,
              opacity: (navigatingButtonIndex !== null || !mattercraftReady) ? 0.5 : 1,
              cursor: (navigatingButtonIndex !== null || !mattercraftReady) ? "not-allowed" : "pointer",
            }}
          >
            {!mattercraftReady ? "Lädt..." : "Mehr erfahren!"}
          </button>
          
          {/* Special button(s) */}
          {station.specialButtonTitle && (
            <button 
              type="button" 
              className="btn" 
              onClick={() => handleSpecialButton(false, 0)}
              disabled={navigatingButtonIndex !== null || !mattercraftReady}
              style={{
                padding: "14px 24px",
                fontSize: 16,
                fontWeight: 600,
                background: "rgba(255, 255, 255, 0.2)",
                color: "white",
                border: "2px solid rgba(255, 255, 255, 0.5)",
                opacity: (navigatingButtonIndex !== null || !mattercraftReady) ? 0.5 : 1,
                cursor: (navigatingButtonIndex !== null || !mattercraftReady) ? "not-allowed" : "pointer",
              }}
            >
              {navigatingButtonIndex === 0 ? "Wird verarbeitet..." : (!mattercraftReady ? "Lädt..." : station.specialButtonTitle)}
            </button>
          )}
          
          {/* Multiple special buttons (for station 4+) */}
          {station.specialButtonTitles && station.specialButtonTitles.length > 0 && (
            <>
              {station.specialButtonTitles.map((title, index) => {
                // Button index: 0 for first special button, 1 for second, etc.
                const buttonIndex = station.specialButtonTitle ? index + 1 : index;
                return (
                  <button 
                    key={index}
                    type="button" 
                    className="btn" 
                    onClick={() => handleSpecialButton(index === 1, buttonIndex)} // Second button skips next station
                    disabled={navigatingButtonIndex !== null || !mattercraftReady}
                    style={{
                      padding: "14px 24px",
                      fontSize: 16,
                      fontWeight: 600,
                      background: "rgba(255, 255, 255, 0.2)",
                      color: "white",
                      border: "2px solid rgba(255, 255, 255, 0.5)",
                      opacity: (navigatingButtonIndex !== null || !mattercraftReady) ? 0.5 : 1,
                      cursor: (navigatingButtonIndex !== null || !mattercraftReady) ? "not-allowed" : "pointer",
                    }}
                  >
                    {navigatingButtonIndex === buttonIndex ? "Wird verarbeitet..." : (!mattercraftReady ? "Lädt..." : title)}
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>
      
      {/* Dialog */}
      {dialogOpen && (
        <StationDialog
          station={station}
          onClose={handleDialogClose}
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
