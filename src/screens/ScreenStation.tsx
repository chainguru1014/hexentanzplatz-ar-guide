"use client";

import { useMemo, useRef } from "react";
import { useAppStore } from "@/state/store";
import { stations } from "@/stations/stations";
import { StationTemplateV1 } from "@/stations/templates/StationTemplateV1";
import { StationTemplateV2 } from "@/stations/templates/StationTemplateV2";
import { ArViewport } from "@/features/ar/ArViewport";
import { mcPlayAudio, mcPauseAudio, mcSeekAudio } from "@/lib/mcBridge";

export function ScreenStation() {
  const currentStationId = useAppStore((s) => s.currentStationId);
  const openInfo = useAppStore((s) => s.openInfo);
  const complete = useAppStore((s) => s.completeCurrentAndAdvance);
  const goToMap = useAppStore((s) => s.goToMap);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const station = useMemo(
    () => stations.find((s) => s.id === currentStationId),
    [currentStationId]
  );

  if (!station) return null;

  const Template = station.variant === "v2" ? StationTemplateV2 : StationTemplateV1;

  // Handle Mattercraft audio events
  const handleAudioPlay = () => {
    // Find audio element and play it
    const audio = document.querySelector(`audio[src="${station.dialogAudio}"]`) as HTMLAudioElement;
    if (audio) {
      audioRef.current = audio;
      audio.play().catch(() => {});
    }
  };

  const handleAudioPause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const handleAudioProgress = (time: number, duration: number) => {
    if (audioRef.current && Math.abs(audioRef.current.currentTime - time) > 0.5) {
      audioRef.current.currentTime = time;
    }
  };

  return (
    <div className="grid">
      <section className="card" style={{ padding: 0, overflow: "hidden" }}>
        <ArViewport 
          station={station} 
          onAudioPlay={handleAudioPlay}
          onAudioPause={handleAudioPause}
          onAudioProgress={handleAudioProgress}
        />
      </section>

      <section className="card">
        <Template
          station={station}
          onMoreInfo={station.variant === "v2" ? openInfo : undefined}
          onContinue={complete}
          onBack={goToMap}
        />
      </section>
    </div>
  );
}
