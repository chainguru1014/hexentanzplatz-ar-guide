"use client";

import type { Station } from "@/stations/stations";
import { SnapshotShare } from "@/features/share/SnapshotShare";
import { AudioControl } from "@/components/AudioControl";

export function StationTemplateV1({
  station,
  onContinue,
  onBack,
}: {
  station: Station;
  onContinue: () => void;
  onBack: () => void;
}) {
  return (
    <div className="station-template">
      <h2 className="h2">{station.title}</h2>
      <p className="p" style={{ marginTop: 4 }}>
        Dialog mit AR-Charakteren. Steuerung unten.
      </p>
      <div className="spacer" />

      <AudioControl src={station.dialogAudio} title="Dialog-Audio" />
      <div className="spacer" />

      <SnapshotShare watermarkText="ThinkPott • Hexentanzplatz" />
      <div className="spacer" />

      <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
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
  );
}
