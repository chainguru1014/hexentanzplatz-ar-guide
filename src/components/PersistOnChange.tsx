"use client";

import { useEffect } from "react";
import { useAppStore } from "@/state/store";
import { persistNow } from "@/state/persist";

export function PersistOnChange() {
  const persistKey = useAppStore((s) => s.persistKey());
  useEffect(() => {
    persistNow();
  }, [persistKey]);
  return null;
}
