"use client";

import { useMemo } from "react";
import { stations } from "@/stations/stations";
import type { StationId } from "@/stations/stations";
import { getNextStationId } from "@/state/store";

export type StationMapProps = {
  currentStationId?: StationId; // undefined = position 0 (start position)
  unlockedStations: StationId[];
  /** Optional: next station to show target ring (defaults to next in list). */
  nextStationId?: StationId;
  /** Max number of stations to show (e.g. 5). When set, only first N stations are shown. */
  maxStations?: number;
  /** Positions for each station on the map (0–1). If not provided, auto-grid or 5-station layout. */
  positions?: Partial<Record<StationId, { x: number; y: number }>>;
};

const defaultPositions: Record<string, { x: number; y: number }> = {};
stations.forEach((s, i) => {
  const row = Math.floor(i / 5);
  const col = i % 5;
  defaultPositions[s.id] = {
    x: 0.15 + (col / 5) * 0.7,
    y: 0.2 + (row / 5) * 0.6,
  };
});

/** Layout for 5 stations matching screenshot:
 * - Marker 1 (s01): bottom-center
 * - Marker 2 (s02): right of center
 * - Marker 3 (s03): middle-left (target with red glow)
 * - Marker 4 (s04): upper-right quadrant
 * - Marker 5 (s05): further up and right of Marker 4
 * - Start position (blue pin): bottom-center, just below Marker 1
 * All positions moved up by ~100px (reduced y values by ~0.12)
 */
const fiveStationPositions: Record<string, { x: number; y: number }> = {
  s01: { x: 0.5, y: 0.66 },  // Station 1 - bottom-center (moved up)
  s02: { x: 0.7, y: 0.38 },  // Station 2 - right of center (moved up)
  s03: { x: 0.3, y: 0.43 },  // Station 3 - middle-left (target, moved up)
  s04: { x: 0.75, y: 0.23 }, // Station 4 - upper-right quadrant (moved up)
  s05: { x: 0.85, y: 0.13 }, // Station 5 - further up and right (moved up)
};

export function StationMap({
  currentStationId,
  unlockedStations,
  nextStationId: nextIdProp,
  maxStations,
  positions = {},
}: StationMapProps) {
  const nextStationId = nextIdProp ?? (currentStationId ? getNextStationId(currentStationId) : "s01");
  const stationsToShow = useMemo(() => {
    const list = maxStations ? stations.slice(0, maxStations) : stations;
    return list;
  }, [maxStations]);
  const posMap = useMemo(() => {
    const base = maxStations === 5 ? { ...fiveStationPositions, ...positions } : { ...defaultPositions, ...positions };
    return base as Record<StationId, { x: number; y: number }>;
  }, [maxStations, positions]);

  // Start position (position 0) - show blue pin at bottom center, just below station 1
  const showStartPosition = !currentStationId;
  const startPosition = { x: 0.5, y: 0.76 }; // Bottom center, just below Marker 1 (moved up)

  return (
    <div className="station-map" aria-hidden>
      {/* Start position marker (blue pin) when at position 0 */}
      {showStartPosition && (
        <div
          className="station-map__pin station-map__pin--current"
          style={{
            left: `${startPosition.x * 100}%`,
            top: `${startPosition.y * 100}%`,
            transform: "translate(-50%, -100%)",
          }}
        >
          <span className="station-map__pin-icon station-map__pin-icon--location" />
        </div>
      )}

      {stationsToShow.map((s) => {
        const pos = posMap[s.id] ?? { x: 0.5, y: 0.5 };
        const isUnlocked = unlockedStations.includes(s.id);
        const isCurrent = s.id === currentStationId;
        const isNextTarget = s.id === nextStationId;

        // Don't show current station pin if it's the same as target (to avoid overlap)
        // But still show the target ring
        if (isCurrent && isNextTarget && showStartPosition === false) {
          // Current and target are same - show both but ensure they're visible
        }

        return (
          <div
            key={s.id}
            className={`station-map__pin ${isCurrent ? "station-map__pin--current" : ""} ${isNextTarget ? "station-map__pin--next" : ""} ${isUnlocked ? "station-map__pin--unlocked" : "station-map__pin--locked"}`}
            style={{
              left: `${pos.x * 100}%`,
              top: `${pos.y * 100}%`,
              transform: "translate(-50%, -100%)",
            }}
          >
            {isCurrent && !showStartPosition && <span className="station-map__pin-icon station-map__pin-icon--location" />}
            <span
              className={`station-map__pin-icon station-map__pin-icon--lock ${isUnlocked ? "station-map__pin-icon--unlocked" : ""}`}
              aria-label={isUnlocked ? "Unlocked" : "Locked"}
            />
            {isNextTarget && <span className="station-map__ring" />}
          </div>
        );
      })}
    </div>
  );
}
