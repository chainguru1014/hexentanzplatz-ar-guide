"use client";

import type { InfoItem } from "@/stations/stations";

export function InfoPanel({ items }: { items: InfoItem[] }) {
  if (!items.length) {
    return <p className="p">Noch keine Vertiefungsinhalte konfiguriert.</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map((it, idx) => (
        <details
          key={idx}
          className="card"
          style={{ padding: 12, background: "rgba(255,255,255,.04)" }}
          open={idx === 0}
        >
          <summary style={{ cursor: "pointer" }}>
            <b>{it.title}</b> <span className="badge" style={{ marginLeft: 8 }}>{it.type}</span>
          </summary>
          <div className="spacer" />
          {it.type === "text" && <p className="p">{it.body}</p>}
          {it.type === "image" && (
            <figure style={{ margin: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.src} alt={it.title} style={{ width: "100%", borderRadius: 12, border: "1px solid var(--border)" }} />
              {it.caption && <figcaption className="p" style={{ marginTop: 8 }}>{it.caption}</figcaption>}
            </figure>
          )}
          {it.type === "audio" && (
            <div>
              <audio controls src={it.src} style={{ width: "100%" }} />
              {it.transcript && (
                <>
                  <div className="spacer" />
                  <p className="p">{it.transcript}</p>
                </>
              )}
            </div>
          )}
        </details>
      ))}
    </div>
  );
}
