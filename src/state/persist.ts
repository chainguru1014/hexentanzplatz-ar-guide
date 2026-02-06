import { useAppStore } from "@/state/store";
import type { Screen } from "@/state/store";

const KEY = "hexentanzplatz_progress_v1";

type Persisted = {
  screen: Screen;
  unlocked: boolean;
  currentStationId: string;
  unlockedStations?: string[];
  completed: Record<string, boolean>;
};

export function persistNow() {
  try {
    const st = useAppStore.getState();
    const payload: Persisted = {
      screen: st.screen,
      unlocked: st.unlocked,
      currentStationId: st.currentStationId,
      unlockedStations: st.unlockedStations,
      completed: st.completed as Record<string, boolean>,
    };
    localStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    // ignore (private mode etc.)
  }
}

export function loadPersisted() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Persisted;
    const validScreens: Screen[] = ["start", "welcome", "map", "qr", "station", "info"];
    type StationId = import("@/stations/stations").StationId;
    const validId = (s: string): s is StationId =>
      /^s\d{2}$/.test(s) && Number(s.slice(1)) >= 1 && Number(s.slice(1)) <= 25;
    useAppStore.setState({
      screen: validScreens.includes(parsed.screen) ? parsed.screen : "start",
      unlocked: !!parsed.unlocked,
      currentStationId: (validId(parsed.currentStationId) ? parsed.currentStationId : "s01") as StationId,
      unlockedStations: Array.isArray(parsed.unlockedStations)
        ? parsed.unlockedStations.filter(validId)
        : [],
      completed: (parsed.completed ?? {}) as Record<string, boolean>,
    });
  } catch {
    // ignore
  }
}

export function resetPersisted() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}
