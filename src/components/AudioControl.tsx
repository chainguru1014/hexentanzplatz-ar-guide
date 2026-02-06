"use client";

import { useRef, useState } from "react";

type Props = {
  src: string;
  title?: string;
  className?: string;
};

export function AudioControl({ src, title, className = "" }: Props) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  const play = () => {
    const el = ref.current;
    if (el) {
      el.play().catch(() => {});
      setPlaying(true);
    }
  };
  const pause = () => {
    ref.current?.pause();
    setPlaying(false);
  };
  const stop = () => {
    const el = ref.current;
    if (el) {
      el.pause();
      el.currentTime = 0;
      setPlaying(false);
    }
  };

  return (
    <div className={`audio-control card ${className}`} style={{ padding: 12 }}>
      {title && <p className="p" style={{ margin: "0 0 8px 0", fontSize: 13 }}>{title}</p>}
      <audio
        ref={ref}
        src={src}
        onEnded={() => setPlaying(false)}
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
        style={{ display: "none" }}
      />
      <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
        <button type="button" className="btn" onClick={play} disabled={playing} title="Abspielen">
          ▶ Abspielen
        </button>
        <button type="button" className="btn" onClick={pause} disabled={!playing} title="Pause">
          ⏸ Pause
        </button>
        <button type="button" className="btn" onClick={stop} title="Stopp">
          ⏹ Stopp
        </button>
      </div>
    </div>
  );
}
