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
      if (!el) {
        console.warn("[AudioPlayerBar] Audio element not found in play()");
        return;
      }
      if (el.paused) {
        // Ensure audio is ready
        if (el.readyState < 2) {
          el.addEventListener('canplay', function onCanPlay() {
            el.removeEventListener('canplay', onCanPlay);
            el.play().then(() => {
              setPlaying(true);
              onPlay?.();
              if (syncWithMattercraft) {
                isSyncingRef.current = true;
                mcPlayAudio();
                setTimeout(() => { isSyncingRef.current = false; }, 100);
              }
            }).catch((err) => {
              console.error("[AudioPlayerBar] Play failed in play():", err);
            });
          }, { once: true });
          if (el.readyState === 0) {
            el.load();
          }
        } else {
          el.play().then(() => {
            setPlaying(true);
            onPlay?.();
            if (syncWithMattercraft) {
              isSyncingRef.current = true;
              mcPlayAudio();
              setTimeout(() => { isSyncingRef.current = false; }, 100);
            }
          }).catch((err) => {
            console.error("[AudioPlayerBar] Play failed in play():", err);
          });
        }
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
    
    // Handle audio loading errors
    const onError = (e: Event) => {
      console.error("[AudioPlayerBar] Audio loading error:", e);
      const error = (e.target as HTMLAudioElement).error;
      if (error) {
        console.error("[AudioPlayerBar] Error code:", error.code, "Message:", error.message);
        if (error.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
          console.error("[AudioPlayerBar] Audio format not supported or file not found:", src);
        }
      }
    };
    
    // Handle audio loaded
    const onLoadedData = () => {
      console.log("[AudioPlayerBar] Audio loaded successfully:", src);
      const newDuration = Number.isFinite(el.duration) ? el.duration : 0;
      setDuration(newDuration);
      onTimeUpdate?.(el.currentTime, newDuration);
    };
    
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
    el.addEventListener("error", onError);
    el.addEventListener("loadeddata", onLoadedData);
    
    // Don't reload here - src is handled in separate useEffect above
    
    return () => {
      el.removeEventListener("timeupdate", onTimeUpdateEvent);
      el.removeEventListener("durationchange", onDurationChange);
      el.removeEventListener("ended", onEnd);
      el.removeEventListener("error", onError);
      el.removeEventListener("loadeddata", onLoadedData);
    };
  }, [onEnded, updateTime, onTimeUpdate, src]);

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) {
      console.warn("[AudioPlayerBar] Audio element not found");
      return;
    }
    
    if (el.paused) {
      // Ensure audio is ready before playing
      if (el.readyState < 2) {
        // If audio is not loaded enough, wait for it
        el.addEventListener('canplay', function onCanPlay() {
          el.removeEventListener('canplay', onCanPlay);
          el.play().then(() => {
            setPlaying(true);
            onPlay?.();
            // Sync with Mattercraft
            if (syncWithMattercraft) {
              isSyncingRef.current = true;
              mcPlayAudio();
              setTimeout(() => { isSyncingRef.current = false; }, 100);
            }
          }).catch((err) => {
            console.error("[AudioPlayerBar] Play failed:", err);
          });
        }, { once: true });
        // Trigger loading if needed
        if (el.readyState === 0) {
          el.load();
        }
      } else {
        // Audio is ready, play immediately
        el.play().then(() => {
          setPlaying(true);
          onPlay?.();
          // Sync with Mattercraft
          if (syncWithMattercraft) {
            isSyncingRef.current = true;
            mcPlayAudio();
            setTimeout(() => { isSyncingRef.current = false; }, 100);
          }
        }).catch((err) => {
          console.error("[AudioPlayerBar] Play failed:", err);
        });
      }
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

  // Track previous src to detect changes
  const prevSrcRef = useRef<string>('');
  
  // Handle src changes without interrupting playback
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !src) return;
    
    // Only reload if src actually changed and audio is not playing
    if (prevSrcRef.current !== src) {
      prevSrcRef.current = src;
      
      // If audio is currently playing, don't reload (let it finish)
      if (!el.paused) {
        console.log("[AudioPlayerBar] Src changed while playing, will reload after pause");
        return;
      }
      
      // Only load if audio hasn't been loaded yet or if src changed
      // Don't call load() if audio is already loaded, as it causes AbortError
      if (el.readyState === 0 || (el.src && el.src !== src)) {
        el.load();
      }
    }
  }, [src]);

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
