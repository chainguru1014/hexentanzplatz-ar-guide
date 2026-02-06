"use client";

import { Suspense, useState, useEffect } from "react";
import { MapScreen } from "@/screens/MapScreen";

export default function MapPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="container" style={{ padding: 24 }}>Laden …</div>;
  }
  return (
    <Suspense fallback={<div className="container" style={{ padding: 24 }}>Laden …</div>}>
      <MapScreen />
    </Suspense>
  );
}
