import "./globals.css";
import type { Metadata, Viewport } from "next";
import BridgeListener from "@/components/BridgeListener";
import { HydrateProgress } from "@/components/HydrateProgress";
import { PersistOnChange } from "@/components/PersistOnChange";

export const metadata: Metadata = {
  title: "Hexentanzplatz WebAR Guide (Starter)",
  description: "Starter project: linear WebAR audio guide with station templates, persistence, and placeholders for Mattercraft AR + QR.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#0b0f1a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>
        <BridgeListener />
        <HydrateProgress />
        <PersistOnChange />
        {children}
      </body>
    </html>
  );
}
