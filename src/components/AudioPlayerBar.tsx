"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { mcPlayAudio, mcPauseAudio, mcSeekAudio, onMcAudioPlay, onMcAudioPause, onMcAudioProgress } from "@/lib/mcBridge";

export type AudioPlayerBarProps = {
  src: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  className?: string;
  syncWithMattercraft?: boolean;
};

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AudioPlayerBar({
  src,
  onPlay,
  onPause,
  onEnded,
  className = "",
  syncWithMattercraft = true,
}: AudioPlayerBarProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const isSyncingRef = useRef(false);

  const updateTime = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    setCurrentTime(el.currentTime);
    if (Number.isFinite(el.duration) && !Number.isNaN(el.duration)) {
      setDuration(el.duration);
    }
  }, []);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTimeUpdate = () => setCurrentTime(el.currentTime);
    const onDurationChange = () =>
      setDuration(Number.isFinite(el.duration) ? el.duration : 0);
    const onEnd = () => {
      setPlaying(false);
      onEnded?.();
    };
    el.addEventListener("timeupdate", onTimeUpdate);
    el.addEventListener("durationchange", onDurationChange);
    el.addEventListener("ended", onEnd);
    return () => {
      el.removeEventListener("timeupdate", onTimeUpdate);
      el.removeEventListener("durationchange", onDurationChange);
      el.removeEventListener("ended", onEnd);
    };
  }, [onEnded]);

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      el.play().then(() => {
        setPlaying(true);
        onPlay?.();
        // Sync with Mattercraft
        if (syncWithMattercraft) {
          isSyncingRef.current = true;
          mcPlayAudio();
          setTimeout(() => { isSyncingRef.current = false; }, 100);
        }
      });
    } else {
      el.pause();
      setPlaying(false);
      onPause?.();
      // Sync with Mattercraft
      if (syncWithMattercraft) {
        isSyncingRef.current = true;
        mcPauseAudio();
        setTimeout(() => { isSyncingRef.current = false; }, 100);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = audioRef.current;
    const v = Number(e.target.value);
    if (el && Number.isFinite(v)) {
      el.currentTime = v;
      setCurrentTime(v);
      // Sync with Mattercraft
      if (syncWithMattercraft) {
        isSyncingRef.current = true;
        mcSeekAudio(v);
        setTimeout(() => { isSyncingRef.current = false; }, 100);
      }
    }
  };

  // Listen to Mattercraft audio events
  useEffect(() => {
    if (!syncWithMattercraft) return;

    const cleanupPlay = onMcAudioPlay(() => {
      if (!isSyncingRef.current) {
        const el = audioRef.current;
        if (el && el.paused) {
          el.play().then(() => {
            setPlaying(true);
            onPlay?.();
          });
        }
      }
    });

    const cleanupPause = onMcAudioPause(() => {
      if (!isSyncingRef.current) {
        const el = audioRef.current;
        if (el && !el.paused) {
          el.pause();
          setPlaying(false);
          onPause?.();
        }
      }
    });

    const cleanupProgress = onMcAudioProgress((time, dur) => {
      if (!isSyncingRef.current) {
        const el = audioRef.current;
        if (el && Math.abs(el.currentTime - time) > 0.5) {
          el.currentTime = time;
          setCurrentTime(time);
        }
        if (el && dur > 0 && Math.abs(el.duration - dur) > 0.1) {
          setDuration(dur);
        }
      }
    });

    return () => {
      cleanupPlay();
      cleanupPause();
      cleanupProgress();
    };
  }, [syncWithMattercraft, onPlay, onPause]);

  return (
    <div className={`audio-player-bar ${className}`.trim()}>
      <audio ref={audioRef} src={src} preload="metadata" />
      <button
        type="button"
        className="audio-player-bar__btn"
        onClick={togglePlay}
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? (
          <span className="audio-player-bar__icon audio-player-bar__icon--pause" />
        ) : (
          <span className="audio-player-bar__icon audio-player-bar__icon--play" />
        )}
      </button>
      <div className="audio-player-bar__progress-wrap">
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="audio-player-bar__range"
        />
      </div>
      <span className="audio-player-bar__time">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>
    </div>
  );
}
