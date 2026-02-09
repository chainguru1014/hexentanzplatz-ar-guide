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
  const [status, setStatus] = useState<"idle" | "scanning" | "scanned" | "wrong">("scanning");
  const [error, setError] = useState<string | null>(null);
  const [detectedStationId, setDetectedStationId] = useState<StationId | null>(null);
  const [scannerKey, setScannerKey] = useState(0); // Key to force remount scanner on retry
  const goToMap = useAppStore((s) => s.goToMap);

  // Start Mattercraft QR scan if available
  useEffect(() => {
    mcStartQrScan(expectId);
  }, [expectId]);

  const handleQRDetect = useCallback((detectedId: StationId) => {
    // Stop scanning immediately
    setStatus("idle");
    
    // Validate station ID format
    if (!/^s(0[1-9]|1[0-9]|2[0-5])$/.test(detectedId)) {
      setDetectedStationId(null);
      setStatus("wrong");
      setError("Ungültiges QR-Code-Format erkannt.");
      return;
    }

    // Check if station exists
    const station = stations.find((s) => s.id === detectedId);
    if (!station) {
      setDetectedStationId(null);
      setStatus("wrong");
      setError("Station nicht gefunden.");
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
      // Correct target station detected - show success dialog
      setDetectedStationId(detectedId);
      setStatus("scanned");
      setError(null);
    } else {
      // Wrong station - show error dialog
      setDetectedStationId(null);
      setStatus("wrong");
      setError("Falscher QR-Code erkannt! Bitte scannen Sie den korrekten QR-Code.");
    }
  }, []);

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

  const handleSuccessContinue = () => {
    if (detectedStationId) {
      // Navigate to arrived page
      router.push(`/arrived?station=${detectedStationId}`);
    }
  };

  const handleRetry = () => {
    setError(null);
    setDetectedStationId(null);
    setStatus("scanning");
    // Force remount of QRCodeScanner by changing key
    setScannerKey(prev => prev + 1);
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
          key={scannerKey}
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
          {status === "scanning" && (
            <p className="scan-screen__instruction" style={{
              color: "rgba(255, 255, 255, 0.9)",
              fontSize: 14,
              margin: "0 0 24px 0",
              textAlign: "center",
              lineHeight: 1.5,
            }}>
              Richte die Kamera auf den QR-Code an der Station. Bei Erfolg startet die Station automatisch.
            </p>
          )}
          
          {/* Success Dialog - Correct QR Code */}
          {status === "scanned" && detectedStationId && (
            <div style={{
              margin: "0 0 16px 0",
            }}>
              <div style={{
                padding: 16,
                background: "rgba(76, 175, 80, 0.15)",
                borderRadius: 12,
                border: "2px solid rgba(76, 175, 80, 0.5)",
                textAlign: "center",
              }}>
                <p style={{
                  color: "#4caf50",
                  fontSize: 18,
                  fontWeight: "bold",
                  margin: "0 0 12px 0",
                }}>
                  🎉 Glückwunsch!
                </p>
                <p style={{
                  color: "rgba(255, 255, 255, 0.95)",
                  fontSize: 16,
                  margin: "0 0 16px 0",
                  lineHeight: 1.5,
                }}>
                  Sie sind an einer neuen Station angekommen!
                </p>
                <button
                  type="button"
                  onClick={handleSuccessContinue}
                  style={{
                    width: "100%",
                    padding: "14px 24px",
                    background: "linear-gradient(135deg, #4caf50 0%, #45a049 100%)",
                    border: "none",
                    borderRadius: 8,
                    color: "white",
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    boxShadow: "0 4px 12px rgba(76, 175, 80, 0.3)",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 6px 16px rgba(76, 175, 80, 0.4)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(76, 175, 80, 0.3)";
                  }}
                >
                  Los geht's!
                </button>
              </div>
            </div>
          )}

          {/* Error Dialog - Wrong QR Code */}
          {status === "wrong" && error && (
            <div style={{
              margin: "0 0 16px 0",
              position: "relative",
              zIndex: 100,
              pointerEvents: "auto",
            }}>
              <div style={{
                padding: 16,
                background: "rgba(255, 68, 68, 0.15)",
                borderRadius: 12,
                border: "2px solid rgba(255, 68, 68, 0.5)",
                textAlign: "center",
                position: "relative",
                zIndex: 101,
              }}>
                <p style={{
                  color: "#ff4444",
                  fontSize: 18,
                  fontWeight: "bold",
                  margin: "0 0 12px 0",
                }}>
                  ⚠️ Falscher QR-Code erkannt!
                </p>
                <p style={{
                  color: "rgba(255, 255, 255, 0.95)",
                  fontSize: 16,
                  margin: "0 0 16px 0",
                  lineHeight: 1.5,
                }}>
                  Bitte scannen Sie den korrekten QR-Code.
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRetry();
                  }}
                  style={{
                    width: "100%",
                    padding: "14px 24px",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    border: "none",
                    borderRadius: 8,
                    color: "white",
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
                    position: "relative",
                    zIndex: 100,
                    pointerEvents: "auto",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 6px 16px rgba(102, 126, 234, 0.4)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.3)";
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRetry();
                  }}
                >
                  Erneut versuchen
                </button>
              </div>
            </div>
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
