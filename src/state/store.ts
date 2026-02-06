import { create } from "zustand";
import { stations, StationId } from "@/stations/stations";

export type Screen = "start" | "welcome" | "map" | "qr" | "station" | "info";

export type TrackingMode = "gps" | "qr_marker" | "world";

/** Next station in list (for map target ring). */
export function getNextStationId(current: StationId): StationId {
  const idx = stations.findIndex((s) => s.id === current);
  const next = stations[Math.min(idx + 1, stations.length - 1)];
  return next.id;
}

export type AppState = {
  screen: Screen;
  unlocked: boolean;
  currentStationId: StationId | "s00"; // s00 = start position (position 0)
  /** Station IDs the user has unlocked (can navigate to). */
  unlockedStations: StationId[];
  completed: Record<StationId, boolean>;

  setScreen: (screen: Screen) => void;
  unlockTour: () => void;
  unlockStation: (id: StationId) => void;

  goToWelcome: () => void;
  goToMap: () => void;
  goToQr: () => void;

  startStation: (id?: StationId) => void;
  setCurrentStation: (id: StationId) => void;
  openInfo: () => void;
  closeInfo: () => void;

  completeCurrentAndAdvance: () => void;

  persistKey: () => string;
};

const firstStation = stations[0]?.id ?? ("s01" as StationId);

export const useAppStore = create<AppState>((set, get) => ({
  screen: "start",
  unlocked: false,
  currentStationId: "s00" as StationId | "s00", // Start at position 0
  unlockedStations: [] as StationId[],
  completed: {} as Record<StationId, boolean>,

  setScreen: (screen) => set({ screen }),
  unlockTour: () => set({ unlocked: true, unlockedStations: [firstStation] }),
  unlockStation: (id) =>
    set((st) => ({
      unlockedStations: st.unlockedStations.includes(id)
        ? st.unlockedStations
        : [...st.unlockedStations, id].sort(
            (a, b) => Number(a.slice(1)) - Number(b.slice(1))
          ),
    })),

  goToWelcome: () => set({ screen: "welcome", unlocked: true, unlockedStations: [firstStation] }),
  goToMap: () => set({ screen: "map" }),
  goToQr: () => set({ screen: "qr" }),

  startStation: (id) => {
    const nextId = id ?? get().currentStationId;
    set((st) => {
      const newState: Partial<AppState> = {
        currentStationId: nextId,
        screen: "station",
      };
      
      // Only add to unlockedStations if it's a valid StationId (not "s00")
      if (nextId !== "s00") {
        const stationId = nextId as StationId;
        newState.unlockedStations = st.unlockedStations.includes(stationId)
          ? st.unlockedStations
          : [...st.unlockedStations, stationId].sort(
              (a, b) => Number(a.slice(1)) - Number(b.slice(1))
            );
      } else {
        newState.unlockedStations = st.unlockedStations;
      }
      
      return newState;
    });
  },
  setCurrentStation: (id: StationId | "s00") =>
    set((st) => ({
      currentStationId: id,
      unlockedStations: id === "s00" 
        ? st.unlockedStations
        : st.unlockedStations.includes(id as StationId)
        ? st.unlockedStations
        : [...st.unlockedStations, id as StationId].sort(
            (a, b) => Number(a.slice(1)) - Number(b.slice(1))
          ),
    })),

  openInfo: () => set({ screen: "info" }),
  closeInfo: () => set({ screen: "station" }),

  completeCurrentAndAdvance: () => {
    const { currentStationId } = get();
    const idx = stations.findIndex((s) => s.id === currentStationId);
    const next = stations[Math.min(idx + 1, stations.length - 1)];
    set((st) => ({
      completed: { ...st.completed, [currentStationId]: true },
      currentStationId: next.id,
      unlockedStations: st.unlockedStations.includes(next.id)
        ? st.unlockedStations
        : [...st.unlockedStations, next.id].sort(
            (a, b) => Number(a.slice(1)) - Number(b.slice(1))
          ),
      screen: "map",
    }));
  },

  persistKey: () => {
    const st = get();
    return JSON.stringify({
      screen: st.screen,
      unlocked: st.unlocked,
      currentStationId: st.currentStationId,
      unlockedStations: st.unlockedStations,
      completed: st.completed,
    });
  },
}));
