"use client";

import { useMemo } from "react";
import { useAppStore } from "@/state/store";
import { stations } from "@/stations/stations";

export function ScreenMap() {
  const currentStationId = useAppStore((s) => s.currentStationId);
  const completed = useAppStore((s) => s.completed);
  const goToQr = useAppStore((s) => s.goToQr);
  const startStation = useAppStore((s) => s.startStation);

  const currentIdx = useMemo(
    () => stations.findIndex((s) => s.id === currentStationId),
    [currentStationId]
  );
  const nextStation = stations[Math.min(currentIdx + 1, stations.length - 1)];
  const isLast = currentIdx >= stations.length - 1;

  return (
    <div className="map-screen">
      <section className="card map-card">
        <h2 className="h2">Übersicht</h2>
        <p className="badge map-badge">
          Nächste Station: <span className="kbd">{nextStation.id}</span> {nextStation.title}
        </p>
        <div className="spacer" />

        {/* Static map image placeholder: replace with real map asset */}
        <div
          className="map-image"
          style={{
            aspectRatio: "4/3",
            background: "linear-gradient(135deg, rgba(27,37,80,.6) 0%, rgba(11,15,26,.9) 100%)",
            borderRadius: 12,
            border: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--muted)",
            fontSize: 14,
          }}
        >
          Karte • Aktuelle Position + Zielpunkt (linear)
        </div>

        <div className="spacer" />
        <p className="p">
          Aktuell: <span className="kbd">{currentStationId}</span> • Nächstes Ziel:{" "}
          <span className="kbd">{nextStation.id}</span>
        </p>
        <div className="hr" />

        <div className="row" style={{ flexDirection: "column", gap: 10 }}>
          <button className="btn btnPrimary" onClick={goToQr} style={{ width: "100%" }}>
            Wir sind da!
          </button>
          {isLast ? null : (
            <button
              className="btn"
              onClick={() => startStation(nextStation.id)}
              style={{ width: "100%" }}
            >
              Direkt zu {nextStation.id} (ohne QR)
            </button>
          )}
        </div>
      </section>

      <section className="card">
        <h2 className="h2">Stationen (linear)</h2>
        <div className="spacer" />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {stations.slice(0, 8).map((s) => {
            const done = !!completed[s.id];
            const isCurrent = s.id === currentStationId;
            const idx = stations.findIndex((x) => x.id === s.id);
            const isNext = idx === currentIdx + 1;
            return (
              <div
                key={s.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  background: isNext ? "rgba(88,166,255,.08)" : "rgba(255,255,255,.03)",
                  fontSize: 14,
                }}
              >
                <span><b>{s.id}</b> {s.title}</span>
                <span className="badge" style={{ color: done ? "var(--ok)" : "var(--muted)" }}>
                  {done ? "✔" : isNext ? "→ nächste" : "•"}
                </span>
              </div>
            );
          })}
          {stations.length > 8 && (
            <p className="p" style={{ margin: 0 }}>… und {stations.length - 8} weitere</p>
          )}
        </div>
      </section>
    </div>
  );
}
