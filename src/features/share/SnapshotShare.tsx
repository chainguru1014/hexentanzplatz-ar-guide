"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { nanoid } from "nanoid";
import { shareImageBlob } from "@/lib/share";
import { mcTakeSnapshot, onMcSnapshot } from "@/lib/mcBridge";

async function renderWatermarkedPlaceholder(watermarkText: string): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No canvas ctx");

  const grd = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grd.addColorStop(0, "#0b0f1a");
  grd.addColorStop(1, "#111a33");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(255,255,255,.18)";
  ctx.lineWidth = 6;
  ctx.strokeRect(60, 90, canvas.width - 120, canvas.height - 240);

  ctx.fillStyle = "rgba(255,255,255,.85)";
  ctx.font = "bold 44px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
  ctx.fillText("Snapshot (Placeholder)", 90, 160);

  ctx.fillStyle = "rgba(255,255,255,.55)";
  ctx.font = "28px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
  ctx.fillText("In Mattercraft: AR-Screenshot über mc:snapshot.", 90, 210);

  ctx.fillStyle = "rgba(0,0,0,.35)";
  ctx.fillRect(0, canvas.height - 130, canvas.width, 130);

  ctx.fillStyle = "rgba(255,255,255,.92)";
  ctx.font = "bold 34px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
  ctx.fillText(watermarkText, 60, canvas.height - 70);

  ctx.fillStyle = "rgba(255,255,255,.7)";
  ctx.font = "24px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono";
  ctx.fillText(new Date().toISOString(), 60, canvas.height - 30);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png");
  });
}

export function SnapshotShare({ watermarkText }: { watermarkText: string }) {
  const [busy, setBusy] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  const filename = useMemo(() => `hexentanzplatz_${nanoid(6)}.png`, []);

  const setSnapshotBlob = useCallback((blob: Blob) => {
    const url = URL.createObjectURL(blob);
    setBlobUrl(url);
    setBusy(false);
  }, []);

  useEffect(() => {
    const unsub = onMcSnapshot((data) => {
      const blob = data instanceof Blob ? data : null;
      if (blob) setSnapshotBlob(blob);
      else if (typeof data === "string" && data.startsWith("data:")) {
        fetch(data)
          .then((r) => r.blob())
          .then(setSnapshotBlob)
          .finally(() => setBusy(false));
      } else {
        setBusy(false);
      }
    });
    return unsub;
  }, [setSnapshotBlob]);

  const hasMc = typeof window !== "undefined" && !!window.MC?.takeSnapshot;

  const handleTakeSnapshot = useCallback(async () => {
    setBusy(true);
    if (hasMc) {
      mcTakeSnapshot();
      setTimeout(() => {
        setBusy((b) => {
          if (b) renderWatermarkedPlaceholder(watermarkText).then(setSnapshotBlob).catch(() => setBusy(false));
          return b;
        });
      }, 2500);
      return;
    }
    try {
      const blob = await renderWatermarkedPlaceholder(watermarkText);
      setSnapshotBlob(blob);
    } catch {
      setBusy(false);
    }
  }, [hasMc, watermarkText, setSnapshotBlob]);

  return (
    <div className="snapshot-share">
      <div className="row" style={{ alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <button
          type="button"
          className="btn btnPrimary"
          disabled={busy}
          onClick={handleTakeSnapshot}
          title="Foto aufnehmen"
          style={{ padding: "12px 16px", display: "inline-flex", alignItems: "center", gap: 8 }}
        >
          <CameraIcon />
          <span>Foto</span>
        </button>

        <button
          type="button"
          className="btn"
          disabled={!blobUrl || busy}
          onClick={async () => {
            if (!blobUrl) return;
            const blob = await fetch(blobUrl).then((r) => r.blob());
            await shareImageBlob(blob, filename);
          }}
        >
          Teilen
        </button>
      </div>

      {blobUrl && (
        <>
          <div className="spacer" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={blobUrl}
            alt="Snapshot"
            style={{ width: "100%", maxWidth: 280, borderRadius: 14, border: "1px solid var(--border)" }}
          />
          <p className="p" style={{ marginTop: 8, fontSize: 12 }}>
            Falls Share nicht unterstützt wird: Bild lange drücken und speichern.
          </p>
        </>
      )}
    </div>
  );
}

function CameraIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}
