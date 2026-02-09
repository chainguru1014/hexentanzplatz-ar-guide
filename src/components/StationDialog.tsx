"use client";

import { useRef, useEffect } from "react";
import { AudioPlayerBar, type AudioPlayerBarRef } from "@/components/AudioPlayerBar";
import { formatDialogContent } from "@/utils/formatDialog";
import type { Station } from "@/stations/stations";

export type StationDialogProps = {
  station: Station;
  onClose: () => void;
};

export function StationDialog({ station, onClose }: StationDialogProps) {
  // Use dialogContent from station if available
  const dialogContent = station.dialogContent || "";
  const dialogAudio = station.dialogAudio;
  const dialogAudioRef = useRef<AudioPlayerBarRef>(null);

  // Pause dialog audio when dialog closes
  useEffect(() => {
    return () => {
      // Cleanup: pause dialog audio when component unmounts (dialog closes)
      if (dialogAudioRef.current?.isPlaying()) {
        dialogAudioRef.current.pause();
      }
    };
  }, []);

  return (
    <div
      className="station-dialog"
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        background: "rgba(0, 0, 0, 0.7)",
      }}
    >
      <div
        className="station-dialog__backdrop"
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
        }}
        aria-hidden
      />
      <div
        className="station-dialog__panel"
        style={{
          position: "relative",
          background: "white",
          borderRadius: 12,
          border: "2px solid black",
          maxWidth: 600,
          width: "100%",
          maxHeight: "90vh",
          overflow: "auto",
          zIndex: 10001,
        }}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: "transparent",
            border: "none",
            fontSize: 24,
            cursor: "pointer",
            zIndex: 10002,
            padding: 4,
            lineHeight: 1,
          }}
          aria-label="Schließen"
        >
          ×
        </button>

        {/* Content */}
        <div style={{ padding: 16 }}>
          {dialogContent && (
            <div style={{ 
              lineHeight: 1.8, 
              color: "#333",
              fontSize: 16,
              whiteSpace: "pre-wrap",
            }}>
              {formatDialogContent(dialogContent)}
            </div>
          )}
          {dialogAudio && (
            <div style={{ marginTop: 16, padding: 12, background: "#4caf50", borderRadius: 8 }}>
              <AudioPlayerBar ref={dialogAudioRef} src={dialogAudio} syncWithMattercraft={true} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
