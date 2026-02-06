"use client";

import { useEffect, useRef } from "react";
import type { Station } from "@/stations/stations";
import { mcLoadStation, mcSetMode, onMcAudioPlay, onMcAudioPause, onMcAudioProgress } from "@/lib/mcBridge";

export function ArViewport({ 
  station, 
  mode = "station",
  onAudioPlay,
  onAudioPause,
  onAudioProgress,
}: { 
  station: Station; 
  mode?: "welcome" | "station";
  onAudioPlay?: () => void;
  onAudioPause?: () => void;
  onAudioProgress?: (time: number, duration: number) => void;
}) {
  const callbacksRef = useRef({ onAudioPlay, onAudioPause, onAudioProgress });

  useEffect(() => {
    callbacksRef.current = { onAudioPlay, onAudioPause, onAudioProgress };
  }, [onAudioPlay, onAudioPause, onAudioProgress]);

  useEffect(() => {
    mcSetMode(mode);
    mcLoadStation(station.id);
  }, [station.id, mode]);

  // Set up Mattercraft audio event listeners
  useEffect(() => {
    const cleanupPlay = onMcAudioPlay(() => {
      callbacksRef.current.onAudioPlay?.();
    });
    const cleanupPause = onMcAudioPause(() => {
      callbacksRef.current.onAudioPause?.();
    });
    const cleanupProgress = onMcAudioProgress((time, duration) => {
      callbacksRef.current.onAudioProgress?.(time, duration);
    });

    return () => {
      cleanupPlay();
      cleanupPause();
      cleanupProgress();
    };
  }, []);

  return (
    <div
      className="ar-viewport"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        background:
          "radial-gradient(800px 500px at 30% 10%, rgba(88,166,255,.18), rgba(0,0,0,.85) 60%)",
      }}
    >
      {/* Mattercraft AR will be rendered here */}
      <div style={{ position: "absolute", inset: 0 }}>
        {/* Placeholder for Mattercraft AR content */}
      </div>
    </div>
  );
}
