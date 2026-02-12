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
  const detectedRef = useRef<boolean>(false); // Track if QR code was detected to prevent restart

  useEffect(() => {
    // Reset detected flag when active changes to true (user clicked retry)
    if (active && detectedRef.current) {
      detectedRef.current = false;
    }

    if (!active || !containerRef.current) {
      // Stop scanner if not active
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
        setIsScanning(false);
      }
      return;
    }

    // Don't restart if we already detected a QR code
    if (detectedRef.current) {
      return;
    }

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      const scannerId = "qr-reader";
      const element = document.getElementById(scannerId);
      if (!element) {
        const errMsg = "QR-Scanner-Element nicht gefunden.";
        setError(errMsg);
        setIsScanning(false);
        onError?.(errMsg);
        return;
      }

      // Don't start if already detected
      if (detectedRef.current) {
        return;
      }

      const html5QrCode = new Html5Qrcode(scannerId);

      const startScanning = async () => {
      try {
        // Check if mediaDevices API is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          const errMsg = "Kamera-API nicht verfügbar. Bitte verwenden Sie einen modernen Browser.";
          setError(errMsg);
          setIsScanning(false);
          onError?.(errMsg);
          return;
        }

        // Check if we're in a secure context (HTTPS required for camera)
        const isSecure = window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (!isSecure) {
          const errMsg = "Kamera-Zugriff erfordert HTTPS. Bitte verwenden Sie eine sichere Verbindung (https://).";
          setError(errMsg);
          setIsScanning(false);
          onError?.(errMsg);
          return;
        }

        // Check camera permissions and availability
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
          // If we got the stream, stop it immediately - we just wanted to check permissions
          stream.getTracks().forEach(track => track.stop());
        } catch (permErr: any) {
          let errMsg = "Kamera-Zugriff verweigert. Bitte erlauben Sie den Kamera-Zugriff in den Browsereinstellungen.";
          if (permErr.name === 'NotAllowedError' || permErr.name === 'PermissionDeniedError') {
            errMsg = "Kamera-Zugriff verweigert. Bitte erlauben Sie den Kamera-Zugriff in den Browsereinstellungen.";
          } else if (permErr.name === 'NotFoundError' || permErr.name === 'DevicesNotFoundError') {
            errMsg = "Keine Kamera gefunden. Bitte stellen Sie sicher, dass eine Kamera verfügbar ist.";
          } else if (permErr.name === 'NotReadableError' || permErr.name === 'TrackStartError') {
            errMsg = "Kamera wird bereits von einer anderen Anwendung verwendet.";
          } else if (permErr.name === 'OverconstrainedError' || permErr.name === 'ConstraintNotSatisfiedError') {
            errMsg = "Kamera-Anforderungen können nicht erfüllt werden. Versuchen Sie eine andere Kamera.";
          } else {
            errMsg = `Kamera-Fehler: ${permErr.message || permErr.name}`;
          }
          setError(errMsg);
          setIsScanning(false);
          onError?.(errMsg);
          return;
        }

        // Try to get available cameras
        const cameras = await Html5Qrcode.getCameras();
        if (cameras.length === 0) {
          const errMsg = "Keine Kamera gefunden. Bitte stellen Sie sicher, dass eine Kamera verfügbar ist.";
          setError(errMsg);
          setIsScanning(false);
          onError?.(errMsg);
          return;
        }

        // ALWAYS prefer back camera (environment) - required for AR/QR scanning
        let cameraId: string | { facingMode: string } = { facingMode: "environment" };
        
        // Try to find back camera by ID or label
        const backCamera = cameras.find(cam => {
          const label = cam.label.toLowerCase();
          return label.includes('back') || 
                 label.includes('rear') || 
                 label.includes('environment') ||
                 cam.id.includes('back') ||
                 cam.id.includes('rear');
        });
        
        if (backCamera) {
          console.log("[QRCodeScanner] Using back camera:", backCamera.label, backCamera.id);
          cameraId = backCamera.id;
        } else {
          // If no back camera found by label, try to use facingMode constraint
          // This will request the environment-facing camera
          console.log("[QRCodeScanner] No back camera found by label, using facingMode: environment");
          cameraId = { facingMode: "environment" };
        }

        // Always use facingMode: "environment" to force back camera
        const config: any = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        };

        // If we found a specific back camera by ID, use it
        // Otherwise, use facingMode constraint to request environment-facing camera
        if (typeof cameraId === 'string') {
          // Use specific camera ID (we already verified it's a back camera)
          config.videoConstraints = {
            deviceId: { exact: cameraId }
          };
        } else {
          // Use facingMode constraint to request back camera
          config.videoConstraints = {
            facingMode: "environment" // Force back camera
          };
        }

        await html5QrCode.start(
          cameraId,
          config,
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

            // Mark as detected to prevent restart
            detectedRef.current = true;
            
            // Stop scanning immediately when QR code is detected (both correct and wrong)
            html5QrCode.stop().catch(() => {});
            setIsScanning(false);
            scannerRef.current = null;
            
            // Trigger callback with detected ID (ScanScreen will handle validation and show appropriate dialog)
            onDetect(detectedId);
          },
          (errorMessage) => {
            // Ignore scanning errors (they're frequent during scanning)
          }
        );
        scannerRef.current = html5QrCode;
        setIsScanning(true);
        setError(null);
      } catch (err: any) {
        let errMsg = "Fehler beim Starten des QR-Scanners.";
        if (err.message) {
          errMsg = err.message;
        } else if (err.name) {
          errMsg = `Kamera-Fehler: ${err.name}`;
        }
        
        // Provide more specific error messages
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          errMsg = "Kamera-Zugriff verweigert. Bitte erlauben Sie den Kamera-Zugriff in den Browsereinstellungen.";
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          errMsg = "Keine Kamera gefunden. Bitte stellen Sie sicher, dass eine Kamera verfügbar ist.";
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          errMsg = "Kamera wird bereits von einer anderen Anwendung verwendet.";
        } else if (err.message) {
          errMsg = err.message;
        }
        
        setError(errMsg);
        setIsScanning(false);
        onError?.(errMsg);
      }
    };

      startScanning();
    }, 100);

    return () => {
      clearTimeout(timer);
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
  }, [active, targetStationId]); // Removed onDetect and onError from dependencies to prevent restart

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
