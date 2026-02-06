"use client";

import { useMemo } from "react";
import { useAppStore } from "@/state/store";
import { stations } from "@/stations/stations";
import { InfoPanel } from "@/stations/templates/InfoPanel";

export function ScreenInfo() {
  const currentStationId = useAppStore((s) => s.currentStationId);
  const closeInfo = useAppStore((s) => s.closeInfo);

  const station = useMemo(
    () => stations.find((s) => s.id === currentStationId),
    [currentStationId]
  );

  if (!station) return null;

  return (
    <div className="card">
      <p className="badge">
        Mehr erfahren • <span className="kbd">{station.id}</span>
      </p>
      <div className="spacer" />
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h2 className="h2">{station.title}</h2>
        <button className="btn" onClick={closeInfo}>Zurück</button>
      </div>
      <div className="spacer" />
      <InfoPanel items={station.info ?? []} />
    </div>
  );
}
