"use client";

import { useEffect } from "react";
import { loadPersisted } from "@/state/persist";

export function HydrateProgress() {
  useEffect(() => {
    loadPersisted();
  }, []);
  return null;
}
