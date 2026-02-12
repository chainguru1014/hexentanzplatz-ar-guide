"use client";

import { useEffect, useRef, useMemo } from "react";
import type { Station } from "@/stations/stations";
import { mcLoadStation, mcSetMode, onMcAudioPlay, onMcAudioPause, onMcAudioProgress } from "@/lib/mcBridge";
import { registerMattercraftIframe } from "@/lib/mcIframeBridge";

export function ArViewport({ 
  station, 
  mode = "station",
  onAudioPlay,
  onAudioPause,
  onAudioProgress,
}: { 
  station: Station; 
  mode?: "welcome" | "station";
  onAudioPlay?: () => void;
  onAudioPause?: () => void;
  onAudioProgress?: (time: number, duration: number) => void;
}) {
  const callbacksRef = useRef({ onAudioPlay, onAudioPause, onAudioProgress });
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // IMPORTANT: match your real URL where React is running
  const allowedOrigin = useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.location.origin;
  }, []);

  useEffect(() => {
    callbacksRef.current = { onAudioPlay, onAudioPause, onAudioProgress };
  }, [onAudioPlay, onAudioPause, onAudioProgress]);

  useEffect(() => {
    mcSetMode(mode);
    mcLoadStation(station.id);
  }, [station.id, mode]);

  // Set up Mattercraft audio event listeners
  useEffect(() => {
    const cleanupPlay = onMcAudioPlay(() => {
      callbacksRef.current.onAudioPlay?.();
    });
    const cleanupPause = onMcAudioPause(() => {
      callbacksRef.current.onAudioPause?.();
    });
    const cleanupProgress = onMcAudioProgress((time, duration) => {
      callbacksRef.current.onAudioProgress?.(time, duration);
    });

    return () => {
      cleanupPlay();
      cleanupPause();
      cleanupProgress();
    };
  }, []);

  // Register iframe with bridge so mcBridge can send commands to it
  useEffect(() => {
    if (iframeRef.current) {
      registerMattercraftIframe(iframeRef.current);
    }
    return () => {
      registerMattercraftIframe(null);
    };
  }, []);

  // Listen for postMessage events from Mattercraft iframe
  useEffect(() => {
    function onMessage(event: MessageEvent) {
      // Allow only same origin messages
      if (event.origin !== allowedOrigin) return;

      const data = event.data;
      if (!data || typeof data !== "object") return;

      console.log("[ArViewport] Received from Mattercraft:", data);

      // Handle MC_READY and MC_STATE events
      if (data.type === "MC_READY" || data.type === "MC_STATE") {
        console.log("[ArViewport] Mattercraft state:", data);
      }

      // Handle audio events from Mattercraft
      if (data.type === "MC_AUDIO_PLAY") {
        // Fire custom event for mcBridge listeners
        window.dispatchEvent(new CustomEvent("mc:audio:play"));
      }
      if (data.type === "MC_AUDIO_PAUSE") {
        window.dispatchEvent(new CustomEvent("mc:audio:pause"));
      }
      if (data.type === "MC_AUDIO_PROGRESS" && typeof data.time === "number" && typeof data.duration === "number") {
        window.dispatchEvent(new CustomEvent("mc:audio:progress", {
          detail: { time: data.time, duration: data.duration }
        }));
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [allowedOrigin]);

  // Send commands to Mattercraft iframe via postMessage
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const sendToMattercraft = (type: string, payload?: any) => {
      const win = iframe.contentWindow;
      if (!win) return;
      win.postMessage({ type, ...payload }, "*");
    };

    // Send station load command when iframe is ready
    const timer = setTimeout(() => {
      sendToMattercraft("MC_LOAD_STATION", { stationId: station.id });
      sendToMattercraft("MC_SET_MODE", { mode });
    }, 1000);

    return () => clearTimeout(timer);
  }, [station.id, mode]);

  // Handle iframe load and error events
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      console.log("[ArViewport] Iframe loaded successfully");
      
      // Wait a bit for Mattercraft JS to initialize
      setTimeout(() => {
        // Try to access iframe content to check if it loaded
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          const iframeWin = iframe.contentWindow;
          
          if (iframeDoc && iframeWin) {
            console.log("[ArViewport] Iframe document and window accessible");
            
            // Check if Mattercraft has initialized
            setTimeout(() => {
              try {
                const launchButton = iframeDoc.getElementById("launchButton");
                const splash = iframeDoc.querySelector(".splash");
                
                if (launchButton) {
                  const isDisabled = launchButton.hasAttribute("disabled");
                  console.log("[ArViewport] Launch button state:", { 
                    exists: true, 
                    disabled: isDisabled,
                    text: launchButton.textContent 
                  });
                  
                  if (!isDisabled) {
                    console.log("[ArViewport] ✅ Launch button is enabled - Mattercraft is ready!");
                  } else {
                    console.log("[ArViewport] ⏳ Launch button is disabled - Mattercraft is still initializing");
                    // Check again after a longer delay
                    setTimeout(() => {
                      const stillDisabled = launchButton.hasAttribute("disabled");
                      if (stillDisabled) {
                        console.warn("[ArViewport] ⚠️ Launch button still disabled after 5s - Mattercraft may be stuck");
                        console.warn("[ArViewport] Check browser console for Mattercraft errors");
                      }
                    }, 5000);
                  }
                } else {
                  console.warn("[ArViewport] Launch button not found in iframe");
                }
                
                // Check if splash screen is visible
                if (splash) {
                  const isVisible = splash instanceof HTMLElement && 
                    window.getComputedStyle(splash).display !== "none";
                  console.log("[ArViewport] Splash screen visible:", isVisible);
                }
              } catch (e) {
                console.warn("[ArViewport] Cannot access iframe elements (may be cross-origin):", e);
              }
            }, 1000);
          }
        } catch (e) {
          // This is expected if there's a cross-origin restriction
          // But since it's same origin, this shouldn't happen
          console.warn("[ArViewport] Cannot access iframe content:", e);
        }
      }, 500);
    };

    const handleError = (e: ErrorEvent) => {
      console.error("[ArViewport] Iframe failed to load:", e);
    };

    iframe.addEventListener("load", handleLoad);
    iframe.addEventListener("error", handleError);

    return () => {
      iframe.removeEventListener("load", handleLoad);
      iframe.removeEventListener("error", handleError);
    };
  }, []);

  return (
    <div
      className="ar-viewport"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        background: "#1f2021", // Match Mattercraft splash background
      }}
    >
      {/* Mattercraft AR iframe */}
      <iframe
        ref={iframeRef}
        src="/mc/index.html"
        allow="camera; microphone; gyroscope; accelerometer; autoplay; clipboard-read; clipboard-write"
        allowFullScreen
        loading="eager"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          border: 0,
        }}
        title="Mattercraft AR Experience"
      />
    </div>
  );
}
