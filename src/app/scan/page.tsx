"use client";

import { Suspense } from "react";
import { ScanScreen } from "@/screens/ScanScreen";

export default function ScanPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: 24 }}>Laden …</div>}>
      <ScanScreen />
    </Suspense>
  );
}
