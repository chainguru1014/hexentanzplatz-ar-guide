"use client";

import { useState } from "react";
import type { Station } from "@/stations/stations";
import { SnapshotShare } from "@/features/share/SnapshotShare";
import { AudioControl } from "@/components/AudioControl";
import { StationDialog } from "@/components/StationDialog";

export function StationTemplateV2({
  station,
  onMoreInfo,
  onContinue,
  onBack,
}: {
  station: Station;
  onMoreInfo?: () => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const hasInfo = station.info && station.info.length > 0;

  const handleMoreInfo = () => {
    setDialogOpen(true);
    onMoreInfo?.();
  };

  return (
    <>
      <div className="station-template">
        <h2 className="h2">{station.title}</h2>
        <p className="p" style={{ marginTop: 4 }}>
          Dialog + optionale Vertiefung. Steuerung unten.
        </p>
        <div className="spacer" />

        <AudioControl src={station.dialogAudio} title="Dialog-Audio" />
        <div className="spacer" />

        <SnapshotShare watermarkText="ThinkPott • Hexentanzplatz" />
        <div className="spacer" />

        <div className="row" style={{ gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {hasInfo && (
            <button
              type="button"
              className="btn btnPrimary"
              onClick={handleMoreInfo}
            >
              Mehr erfahren!
            </button>
          )}
          <button type="button" className="btn games-placeholder" disabled title="Spiele (coming soon)">
            Spiele
          </button>
        </div>
        <div className="spacer" />

        <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <button type="button" className="btn" onClick={onBack}>
            Zur Karte
          </button>
          <button type="button" className="btn btnPrimary" onClick={onContinue}>
            Weiter!
          </button>
        </div>
      </div>
      {dialogOpen && (
        <StationDialog station={station} onClose={() => setDialogOpen(false)} />
      )}
    </>
  );
}
