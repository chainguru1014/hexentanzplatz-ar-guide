"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { loadPersisted } from "@/state/persist";
import { useAppStore } from "@/state/store";

export function HydrateProgress() {
  const router = useRouter();
  const pathname = usePathname();
  const hasSyncedRef = useRef(false);
  
  useEffect(() => {
    // Load persisted state first
    loadPersisted();
    
    // Only sync URL once on mount to prevent redirect loops
    if (hasSyncedRef.current) return;
    
    // Then sync URL with screen state after a short delay to ensure state is loaded
    const syncUrl = () => {
      if (hasSyncedRef.current) return;
      hasSyncedRef.current = true;
      
      const state = useAppStore.getState();
      const currentScreen = state.screen;
      const currentStationId = state.currentStationId;
      
      // Map screen state to URL
      let targetUrl = "/";
      if (currentScreen === "map") {
        targetUrl = "/map";
      } else if (currentScreen === "qr") {
        targetUrl = "/scan";
      } else if (currentScreen === "station" && currentStationId !== "s00") {
        targetUrl = `/station/${currentStationId}`;
      } else if (currentScreen === "welcome") {
        targetUrl = "/intro";
      } else if (currentScreen === "start") {
        targetUrl = "/";
      }
      
      // Only redirect if we're not already on the correct page and state is not default
      if (pathname !== targetUrl && (currentScreen !== "start" || currentStationId !== "s00")) {
        router.replace(targetUrl);
      }
    };
    
    // Small delay to ensure state is loaded
    const timeout = setTimeout(syncUrl, 150);
    
    return () => clearTimeout(timeout);
  }, [router, pathname]);
  
  return null;
}
