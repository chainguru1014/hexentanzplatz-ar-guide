"use client";

import { Suspense } from "react";
import { ArrivedScreen } from "@/screens/ArrivedScreen";

export default function ArrivedPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: 24 }}>Laden …</div>}>
      <ArrivedScreen />
    </Suspense>
  );
}
