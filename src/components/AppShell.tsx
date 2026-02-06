"use client";

import { useEffect } from "react";
import { useAppStore } from "@/state/store";
import { ScreenStart } from "@/screens/ScreenStart";
import { ScreenWelcome } from "@/screens/ScreenWelcome";
import { ScreenMap } from "@/screens/ScreenMap";
import { ScreenQR } from "@/screens/ScreenQR";
import { ScreenStation } from "@/screens/ScreenStation";
import { ScreenInfo } from "@/screens/ScreenInfo";
import { loadPersisted, persistNow } from "@/state/persist";

export function AppShell() {
  const screen = useAppStore((s) => s.screen);

  // Hydrate persisted progress on first client render.
  useEffect(() => {
    loadPersisted();
  }, []);

  // Persist whenever important bits change.
  const persistKey = useAppStore((s) => s.persistKey());
  useEffect(() => {
    persistNow();
  }, [persistKey]);

  return (
    <main className="container">
      {screen === "start" && <ScreenStart />}
      {screen === "welcome" && <ScreenWelcome />}
      {screen === "map" && <ScreenMap />}
      {screen === "qr" && <ScreenQR />}
      {screen === "station" && <ScreenStation />}
      {screen === "info" && <ScreenInfo />}
    </main>
  );
}
