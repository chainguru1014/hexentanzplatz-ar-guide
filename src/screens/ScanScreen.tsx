"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { QRCodeScanner } from "@/components/QRCodeScanner";
import { mcStartQrScan, onMcQr } from "@/lib/mcBridge";
import { useAppStore, getNextStationId } from "@/state/store";
import { stations } from "@/stations/stations";
import type { StationId } from "@/stations/stations";

/**
 * Scan (camera/QR). UI overlay "Scan QR".
 * Shows camera view for QR code scanning.
 * On QR detection → navigate to /map with detected station_id.
 */
export function ScanScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const expectId = (searchParams.get("expect") || "s02") as StationId;
  const [status, setStatus] = useState<"idle" | "scanning" | "scanned">("scanning");
  const [error, setError] = useState<string | null>(null);
  const goToMap = useAppStore((s) => s.goToMap);

  // Start Mattercraft QR scan if available
  useEffect(() => {
    mcStartQrScan(expectId);
  }, [expectId]);

  const handleQRDetect = useCallback((detectedId: StationId) => {
    // Validate station ID
    if (!/^s(0[1-9]|1[0-9]|2[0-5])$/.test(detectedId)) {
      alert("QR-Code ungültig für nächste Station");
      setError(`Ungültige Stations-ID: ${detectedId}`);
      return;
    }

    // Check if station exists
    const station = stations.find((s) => s.id === detectedId);
    if (!station) {
      alert("QR-Code ungültig für nächste Station");
      setError(`Station nicht gefunden: ${detectedId}`);
      return;
    }

    // Get current station and calculate expected next station (current + 1)
    const currentStationId = useAppStore.getState().currentStationId;
    
    // Calculate expected next station ID: current + 1
    let expectedNextStationId: StationId;
    if (currentStationId === "s00") {
      expectedNextStationId = "s01" as StationId;
    } else {
      const currentNum = Number(currentStationId.slice(1));
      const nextNum = currentNum + 1;
      expectedNextStationId = `s${String(nextNum).padStart(2, '0')}` as StationId;
    }

    // Check if detected station is exactly current + 1
    if (detectedId === expectedNextStationId) {
      // Correct target station detected - don't update positions, redirect to arrived page
      setStatus("scanned");
      setError(null);

      // Navigate to arrived page (don't update positions - that happens when clicking buttons in station page)
      router.push(`/arrived?station=${detectedId}`);
    } else {
      // Wrong station - show alert and error
      alert("QR-Code ungültig für nächste Station");
      setError(`QR-Code Station (${detectedId}) ist nicht die nächste Station. Erwartet: ${expectedNextStationId}`);
    }
  }, [router]);

  // Listen for Mattercraft QR events
  useEffect(() => {
    const cleanup = onMcQr((payload) => {
      const detectedId = parseStationFromPayload(payload);
      if (detectedId) {
        handleQRDetect(detectedId);
      }
    });
    return cleanup;
  }, [handleQRDetect]);

  const handleCancel = () => {
    goToMap();
    router.push("/map");
  };

  return (
    <div className="scan-screen" style={{ 
      position: "fixed", 
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: "100vw", 
      height: "100vh", 
      maxWidth: "100vw",
      background: "#1a1a2e",
      margin: 0,
      padding: 0,
      overflow: "hidden",
      boxSizing: "border-box",
    }}>
      {/* Camera view with QR scanner */}
      <div style={{ 
        position: "absolute", 
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1, 
        width: "100%", 
        height: "100%",
        margin: 0,
        padding: 0,
      }}>
        <QRCodeScanner
          onDetect={handleQRDetect}
          onError={(err) => setError(err)}
          active={status === "scanning"}
        />
      </div>

      {/* Overlay UI */}
      <div className="scan-screen__overlay" style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 2,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
        background: "rgba(0, 0, 0, 0.3)",
        margin: 0,
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
      }}>
        <div style={{
          background: "rgba(26, 26, 46, 0.95)",
          borderRadius: 16,
          padding: 24,
          maxWidth: 400,
          width: "100%",
          border: "2px solid rgba(255, 255, 255, 0.1)",
        }}>
          <h2 className="scan-screen__title" style={{
            color: "white",
            fontSize: 24,
            fontWeight: "bold",
            margin: "0 0 12px 0",
            textAlign: "center",
          }}>
            QR-Code scannen
          </h2>
          <p className="scan-screen__instruction" style={{
            color: "rgba(255, 255, 255, 0.9)",
            fontSize: 14,
            margin: "0 0 24px 0",
            textAlign: "center",
            lineHeight: 1.5,
          }}>
            Richte die Kamera auf den QR-Code an der Station. Bei Erfolg startet die Station automatisch.
          </p>
          
          {status === "scanned" && (
            <p className="scan-screen__status" style={{
              color: "#4caf50",
              fontSize: 14,
              margin: "0 0 16px 0",
              textAlign: "center",
            }}>
              Erkannt – wechsle zur Karte …
            </p>
          )}
          
          {error && (
            <p style={{
              color: "#ff4444",
              fontSize: 12,
              margin: "0 0 16px 0",
              textAlign: "center",
              padding: 8,
              background: "rgba(255, 68, 68, 0.1)",
              borderRadius: 8,
            }}>
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleCancel}
            className="btn scan-screen__cancel"
            style={{
              width: "100%",
              padding: "12px 24px",
              background: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: 8,
              color: "white",
              fontSize: 16,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
            }}
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
}

function parseStationFromPayload(payload: string): StationId | null {
  const p = (payload || "").trim();
  if (p === "unlock-tour" || p === "") return null;
  const byId = stations.find((s) => s.id === p);
  if (byId) return byId.id;
  const urlMatch = p.match(/station=([^&]+)/);
  if (urlMatch) {
    const id = urlMatch[1];
    if (stations.some((s) => s.id === id)) return id as StationId;
  }
  return null;
}
