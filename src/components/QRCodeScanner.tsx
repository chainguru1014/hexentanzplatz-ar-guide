"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import type { StationId } from "@/stations/stations";

export type QRCodeScannerProps = {
  onDetect: (stationId: StationId) => void;
  targetStationId?: StationId;
  onError?: (error: string) => void;
  active?: boolean;
};

export function QRCodeScanner({
  onDetect,
  targetStationId,
  onError,
  active = true,
}: QRCodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    const scannerId = "qr-reader";
    const html5QrCode = new Html5Qrcode(scannerId);

    const startScanning = async () => {
      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            // Parse station ID from QR code
            const detectedId = decodedText.trim() as StationId;
            
            // Validate station ID format (s01-s25)
            if (!/^s(0[1-9]|1[0-9]|2[0-5])$/.test(detectedId)) {
              const errMsg = `Invalid station ID format: ${detectedId}`;
              setError(errMsg);
              onError?.(errMsg);
              return;
            }

            // If target station ID is provided, check if it matches
            if (targetStationId) {
              if (detectedId === targetStationId) {
                // Match found - stop scanning and trigger callback
                html5QrCode.stop().catch(() => {});
                setIsScanning(false);
                onDetect(detectedId);
              } else {
                // Mismatch - show error but continue scanning
                const errMsg = `QR code station ID (${detectedId}) does not match target (${targetStationId})`;
                setError(errMsg);
                onError?.(errMsg);
              }
            } else {
              // No target specified - just detect and trigger callback
              html5QrCode.stop().catch(() => {});
              setIsScanning(false);
              onDetect(detectedId);
            }
          },
          (errorMessage) => {
            // Ignore scanning errors (they're frequent during scanning)
          }
        );
        scannerRef.current = html5QrCode;
        setIsScanning(true);
        setError(null);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "Failed to start QR scanner";
        setError(errMsg);
        setIsScanning(false);
        onError?.(errMsg);
      }
    };

    startScanning();

    return () => {
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => {
            scannerRef.current = null;
            setIsScanning(false);
          })
          .catch(() => {
            scannerRef.current = null;
            setIsScanning(false);
          });
      }
    };
  }, [active, targetStationId, onDetect, onError]);

  if (!active) {
    return null;
  }

  return (
    <div ref={containerRef} style={{ 
      position: "relative", 
      width: "100%", 
      height: "100%", 
      minHeight: "100vh",
      margin: 0,
      padding: 0,
    }}>
      <div 
        id="qr-reader" 
        style={{ 
          width: "100%", 
          height: "100%",
          minHeight: "100vh",
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          margin: 0,
          padding: 0,
        }} 
      />
      {error && (
        <div
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            right: 8,
            padding: 8,
            background: "rgba(255, 0, 0, 0.9)",
            color: "white",
            borderRadius: 4,
            fontSize: 12,
            zIndex: 1000,
          }}
        >
          {error}
        </div>
      )}
      {isScanning && !error && (
        <div
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            padding: 8,
            background: "rgba(0, 255, 0, 0.9)",
            color: "white",
            borderRadius: 4,
            fontSize: 12,
            zIndex: 1000,
          }}
        >
          Scanning...
        </div>
      )}
    </div>
  );
}
