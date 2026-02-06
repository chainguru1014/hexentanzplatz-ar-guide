"use client";

import { useAppStore } from "@/state/store";

export function ScreenStart() {
  const goToWelcome = useAppStore((s) => s.goToWelcome);

  return (
    <div className="start-screen">
      <div
        className="start-bg"
        style={{
          backgroundImage: "url(/images/start-bg.jpg), linear-gradient(180deg, #1b2550 0%, var(--bg) 60%)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="start-overlay">
        <h1 className="start-title">Hexentanzplatz</h1>
        <p className="start-subtitle">AR Audioguide</p>
        <div className="start-actions">
          <button className="btn btnPrimary start-cta" onClick={goToWelcome}>
            Start
          </button>
          <a href="#mehr" className="start-link">
            Mehr erfahren
          </a>
        </div>
        <div id="mehr" className="start-mehr card">
          <h2 className="h2">Mehr erfahren</h2>
          <p className="p">
            Entdecke den Hexentanzplatz mit unserem AR-Audioguide. Starte die Tour und folge den Stationen auf der Karte.
            An jeder Station erwarten dich AR-Charaktere und vertiefende Inhalte.
          </p>
        </div>
      </div>
    </div>
  );
}
