"use client";

import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import { mcPlayAudio, mcPauseAudio, mcSeekAudio, onMcAudioPlay, onMcAudioPause, onMcAudioProgress } from "@/lib/mcBridge";

export type AudioPlayerBarProps = {
  src: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  className?: string;
  syncWithMattercraft?: boolean;
  onCaptionClick?: () => void;
  showCaptionButton?: boolean;
  captionOpen?: boolean;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
};

export type AudioPlayerBarRef = {
  pause: () => void;
  play: () => void;
  isPlaying: () => boolean;
};

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export const AudioPlayerBar = forwardRef<AudioPlayerBarRef, AudioPlayerBarProps>(({
  src,
  onPlay,
  onPause,
  onEnded,
  className = "",
  syncWithMattercraft = true,
  onCaptionClick,
  showCaptionButton = false,
  captionOpen = false,
  onTimeUpdate,
}, ref) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const isSyncingRef = useRef(false);

  // Expose control methods via ref
  useImperativeHandle(ref, () => ({
    pause: () => {
      const el = audioRef.current;
      if (el && !el.paused) {
        el.pause();
        setPlaying(false);
        onPause?.();
        if (syncWithMattercraft) {
          isSyncingRef.current = true;
          mcPauseAudio();
          setTimeout(() => { isSyncingRef.current = false; }, 100);
        }
      }
    },
    play: () => {
      const el = audioRef.current;
      if (el && el.paused) {
        el.play().then(() => {
          setPlaying(true);
          onPlay?.();
          if (syncWithMattercraft) {
            isSyncingRef.current = true;
            mcPlayAudio();
            setTimeout(() => { isSyncingRef.current = false; }, 100);
          }
        }).catch(() => {});
      }
    },
    isPlaying: () => {
      return playing;
    },
  }), [playing, onPlay, onPause, syncWithMattercraft]);

  const updateTime = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    const newCurrentTime = el.currentTime;
    const newDuration = Number.isFinite(el.duration) && !Number.isNaN(el.duration) ? el.duration : 0;
    setCurrentTime(newCurrentTime);
    if (newDuration > 0) {
      setDuration(newDuration);
    }
    onTimeUpdate?.(newCurrentTime, newDuration);
  }, [onTimeUpdate]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTimeUpdateEvent = () => {
      updateTime();
    };
    const onDurationChange = () => {
      const newDuration = Number.isFinite(el.duration) ? el.duration : 0;
      setDuration(newDuration);
      onTimeUpdate?.(el.currentTime, newDuration);
    };
    const onEnd = () => {
      setPlaying(false);
      onEnded?.();
      // Auto-pause Mattercraft model when audio finishes
      if (syncWithMattercraft) {
        isSyncingRef.current = true;
        mcPauseAudio();
        setTimeout(() => { isSyncingRef.current = false; }, 100);
      }
    };
    el.addEventListener("timeupdate", onTimeUpdateEvent);
    el.addEventListener("durationchange", onDurationChange);
    el.addEventListener("ended", onEnd);
    return () => {
      el.removeEventListener("timeupdate", onTimeUpdateEvent);
      el.removeEventListener("durationchange", onDurationChange);
      el.removeEventListener("ended", onEnd);
    };
  }, [onEnded, updateTime, onTimeUpdate]);

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
          onTimeUpdate?.(time, dur);
        } else {
          onTimeUpdate?.(time, dur);
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
      {showCaptionButton && (
        <button
          type="button"
          className="audio-player-bar__btn audio-player-bar__btn--caption"
          onClick={onCaptionClick}
          aria-label={captionOpen ? "Untertitel schließen" : "Untertitel anzeigen"}
          style={{
            marginLeft: 8,
            fontSize: 18,
            padding: "8px 12px",
          }}
        >
          {captionOpen ? "✕" : "📝"}
        </button>
      )}
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
});

AudioPlayerBar.displayName = "AudioPlayerBar";
