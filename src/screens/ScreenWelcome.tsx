"use client";

import { useEffect } from "react";
import { useAppStore } from "@/state/store";
import { stations } from "@/stations/stations";
import { ArViewport } from "@/features/ar/ArViewport";
import { mcSetMode, mcLoadStation } from "@/lib/mcBridge";

const WELCOME_STATION_ID = "s01";

export function ScreenWelcome() {
  const goToMap = useAppStore((s) => s.goToMap);
  const station = stations.find((s) => s.id === WELCOME_STATION_ID);

  useEffect(() => {
    mcSetMode("welcome");
    mcLoadStation(WELCOME_STATION_ID);
  }, []);

  if (!station) return null;

  return (
    <div className="welcome-scene">
      <div className="welcome-ar">
        <ArViewport station={station} mode="welcome" />
      </div>
      <div className="welcome-controls card">
        <p className="p">Willkommen am Hexentanzplatz. Hier spricht der AR-Charakter und spielt die Begrüßungs-Audio.</p>
        <div className="spacer" />
        <audio
          key={station.dialogAudio}
          controls
          src={station.dialogAudio}
          style={{ width: "100%", marginBottom: 12 }}
        />
        <button className="btn btnPrimary" onClick={goToMap}>
          Ok, wir kommen
        </button>
      </div>
    </div>
  );
}
