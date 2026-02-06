"use client";

import { Suspense, useState, useEffect } from "react";
import { IntroARScreen } from "@/screens/IntroARScreen";

function IntroPageClient() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) {
    return <div className="container" style={{ padding: 24 }}>Laden …</div>;
  }
  return (
    <Suspense fallback={<div className="container" style={{ padding: 24 }}>Laden …</div>}>
      <IntroARScreen />
    </Suspense>
  );
}

export default function IntroPage() {
  return <IntroPageClient />;
}
