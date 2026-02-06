"use client";

import { useEffect } from "react";

export default function BridgeListener() {
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === "mc:qr") {
        const payload = e.data.stationId ?? e.data.payload ?? e.data.url ?? e.data;
        console.log("UI got QR", payload);

        // Fire a CustomEvent so the rest of your app can use it
        window.dispatchEvent(
          new CustomEvent("mc:qr", {
            detail:
              typeof payload === "string"
                ? payload
                : { stationId: payload.stationId, url: payload.url },
          })
        );
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return null;
}
