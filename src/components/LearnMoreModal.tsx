"use client";

import { useState } from "react";
import type { InfoItem } from "@/stations/stations";
import { AudioPlayerBar } from "@/components/AudioPlayerBar";

export type LearnMoreModalProps = {
  items: InfoItem[];
  onClose: () => void;
  title?: string;
};

export function LearnMoreModal({ items, onClose, title = "Mehr erfahren" }: LearnMoreModalProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="learn-more-modal" role="dialog" aria-modal="true" aria-labelledby="learn-more-title">
      <div className="learn-more-modal__backdrop" onClick={onClose} aria-hidden />
      <div className="learn-more-modal__panel">
        <div className="learn-more-modal__header">
          <h2 id="learn-more-title" className="h2">{title}</h2>
          <button type="button" className="learn-more-modal__close" onClick={onClose} aria-label="Schließen">
            ×
          </button>
        </div>
        <div className="learn-more-modal__accordion">
          {items.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={i} className="learn-more-modal__item">
                <button
                  type="button"
                  className="learn-more-modal__item-head"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  aria-expanded={isOpen}
                >
                  <span className={`learn-more-modal__chevron ${isOpen ? "learn-more-modal__chevron--open" : ""}`} />
                  <span>{item.title}</span>
                </button>
                {isOpen && (
                  <div className="learn-more-modal__item-body">
                    {item.type === "text" && <p className="p">{item.body}</p>}
                    {item.type === "image" && (
                      <div>
                        <img src={item.src} alt={item.caption ?? item.title} className="learn-more-modal__img" />
                        {item.caption && <p className="p learn-more-modal__caption">{item.caption}</p>}
                      </div>
                    )}
                    {item.type === "audio" && (
                      <div>
                        <AudioPlayerBar src={item.src} />
                        {item.transcript && <p className="p" style={{ marginTop: 8 }}>{item.transcript}</p>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
