"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type MCState = {
  ready: boolean;
  playing: boolean;
};

export default function MattercraftFrame() {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [mc, setMc] = useState<MCState>({ ready: false, playing: true });
  const [iframeError, setIframeError] = useState<string | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  // IMPORTANT: match your real URL where React is running
  // If you run locally, it will be http://localhost:3000
  const allowedOrigin = useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.location.origin;
  }, []);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      // optional safety: allow only same origin messages
      // NOTE: Mattercraft iframe is served from SAME site (/mc), so origin matches.
      if (event.origin !== allowedOrigin) {
        console.log("[MattercraftFrame] Ignoring message from different origin:", event.origin);
        return;
      }

      const data = event.data;
      if (!data || typeof data !== "object") return;

      console.log("[MattercraftFrame] Received message:", data);

      if (data.type === "MC_READY") {
        setMc((s) => ({ ...s, ready: true }));
      }

      if (data.type === "MC_STATE") {
        setMc((s) => ({
          ...s,
          ready: typeof data.ready === "boolean" ? data.ready : s.ready,
          playing: typeof data.playing === "boolean" ? data.playing : s.playing,
        }));
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [allowedOrigin]);

  // Handle iframe load events
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      console.log("[MattercraftFrame] Iframe loaded successfully");
      setIframeLoaded(true);
      setIframeError(null);
      
      // Try to access iframe content to check if it loaded
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc) {
          console.log("[MattercraftFrame] Iframe document accessible");
          console.log("[MattercraftFrame] Iframe body:", iframeDoc.body?.innerHTML?.substring(0, 200));
        }
      } catch (e) {
        console.warn("[MattercraftFrame] Cannot access iframe content (cross-origin or not ready):", e);
      }
    };

    const handleError = () => {
      console.error("[MattercraftFrame] Iframe failed to load");
      setIframeError("Failed to load Mattercraft AR page");
      setIframeLoaded(false);
    };

    iframe.addEventListener("load", handleLoad);
    iframe.addEventListener("error", handleError);

    return () => {
      iframe.removeEventListener("load", handleLoad);
      iframe.removeEventListener("error", handleError);
    };
  }, []);

  function send(type: "MC_PLAY" | "MC_PAUSE" | "MC_TOGGLE" | "MC_STATUS") {
    const win = iframeRef.current?.contentWindow;
    if (!win) {
      console.warn("[MattercraftFrame] Cannot send message - iframe contentWindow not available");
      return;
    }

    console.log("[MattercraftFrame] Sending message:", type);
    // Because iframe is same origin, "*" is fine.
    // If you later host mc on another domain, use that domain instead.
    win.postMessage({ type }, "*");
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button onClick={() => send("MC_PLAY")} disabled={!mc.ready}>
          Play
        </button>
        <button onClick={() => send("MC_PAUSE")} disabled={!mc.ready}>
          Pause
        </button>
        <button onClick={() => send("MC_TOGGLE")} disabled={!mc.ready}>
          Toggle
        </button>
        <button onClick={() => send("MC_STATUS")}>Status</button>

        <span style={{ marginLeft: 12 }}>
          {mc.ready ? "✅ MC Ready" : "⏳ Loading..."} |{" "}
          {mc.playing ? "▶️ Playing" : "⏸️ Paused"}
        </span>
        <a
          href="/mc/index.html"
          target="_blank"
          rel="noopener noreferrer"
          style={{ marginLeft: 12, fontSize: 12, color: "#6be5ad" }}
        >
          Open in new tab
        </a>
      </div>

      <div
        style={{
          width: "100%",
          height: "80vh",
          borderRadius: 12,
          overflow: "hidden",
          border: "1px solid rgba(0,0,0,0.15)",
          position: "relative",
          backgroundColor: "#1f2021",
        }}
      >
        {iframeError && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: 12,
              color: "white",
              padding: 24,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 600 }}>⚠️ Error Loading AR</div>
            <div style={{ fontSize: 14, opacity: 0.8 }}>{iframeError}</div>
            <button
              onClick={() => {
                setIframeError(null);
                if (iframeRef.current) {
                  iframeRef.current.src = iframeRef.current.src;
                }
              }}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "none",
                background: "#6be5ad",
                color: "black",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Retry
            </button>
          </div>
        )}
        {!iframeLoaded && !iframeError && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 14,
            }}
          >
            Loading AR experience...
          </div>
        )}
        <iframe
          ref={iframeRef}
          src="/mc/index.html"
          allow="camera; microphone; gyroscope; accelerometer; autoplay; clipboard-read; clipboard-write"
          style={{
            width: "100%",
            height: "100%",
            border: 0,
            display: iframeError ? "none" : "block",
          }}
          title="Mattercraft AR Experience"
        />
      </div>
    </div>
  );
}
