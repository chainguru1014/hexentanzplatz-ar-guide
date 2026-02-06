"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/state/store";
import { stations } from "@/stations/stations";
import { mcStartQrScan } from "@/lib/mcBridge";

function applyPayload(payload: string) {
  const p = (payload || "").trim();
  const { unlockTour, goToMap, startStation } = useAppStore.getState();
  if (p === "unlock-tour" || p === "") {
    unlockTour();
    goToMap();
    return;
  }
  const st = stations.find((s) => s.id === p);
  if (st) {
    startStation(st.id);
  } else {
    goToMap();
  }
}

export function ScreenQR() {
  const goToMap = useAppStore((s) => s.goToMap);
  const [fakePayload, setFakePayload] = useState("");

  useEffect(() => {
    mcStartQrScan();
  }, []);

  // Listens for mc:qr (fired by BridgeListener when Mattercraft sends postMessage({ type: "mc:qr", stationId }))
  useEffect(() => {
    const handler = (e: any) => {
      const stationId = e.detail; // e.g. "s07"
      console.log("React received mc:qr", stationId);
      applyPayload(stationId);
    };

    window.addEventListener("mc:qr", handler as any);
    return () => window.removeEventListener("mc:qr", handler as any);
  }, []);

  return (
    <div className="card">
      <h2 className="h2">QR-Code scannen</h2>
      <p className="p">
        Richte die Kamera auf den QR-Code an der Station. Bei Erfolg startet die Station automatisch.
      </p>
      <div className="spacer" />

      <div className="hr" />
      <p className="p" style={{ marginTop: 12 }}>Entwicklung: Payload simulieren</p>
      <input
        value={fakePayload}
        onChange={(e) => setFakePayload(e.target.value)}
        placeholder="z.B. s02 oder unlock-tour"
        style={{
          width: "100%",
          padding: 12,
          borderRadius: 12,
          border: "1px solid var(--border)",
          background: "rgba(0,0,0,.25)",
          color: "var(--text)",
          marginTop: 8,
        }}
      />
      <div className="row" style={{ marginTop: 12, gap: 8 }}>
        <button
          className="btn btnPrimary"
          onClick={() => applyPayload(fakePayload || "unlock-tour")}
        >
          Payload anwenden
        </button>
        <button className="btn" onClick={goToMap}>
          Abbrechen
        </button>
      </div>
    </div>
  );
}
