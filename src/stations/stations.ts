export type StationId =
  | "s01" | "s02" | "s03" | "s04" | "s05"
  | "s06" | "s07" | "s08" | "s09" | "s10"
  | "s11" | "s12" | "s13" | "s14" | "s15"
  | "s16" | "s17" | "s18" | "s19" | "s20"
  | "s21" | "s22" | "s23" | "s24" | "s25";

export type StationVariant = "v1" | "v2";

export type UnlockMethod = "gps" | "qr" | "gps_or_qr";

export type TrackingPlan =
  | { type: "world_only" }
  | { type: "marker_then_world"; markerId: string }; // markerId = the QR/marker payload you define

export type InfoItem =
  | { type: "text"; title: string; body: string }
  | { type: "image"; title: string; src: string; caption?: string }
  | { type: "audio"; title: string; src: string; transcript?: string };

export type Station = {
  id: StationId;
  title: string;
  variant: StationVariant;
  unlock: UnlockMethod;
  tracking: TrackingPlan;

  // Assets (placeholders for now)
  mephistoModel?: string; // /public/models/...
  friggModel?: string;
  dialogAudio: string; // /public/audio/...
  info?: InfoItem[];
  
  // Station-specific content
  dialogContent?: string; // Dialog text with speaker names
  specialButtonTitle?: string; // Title for special button
  specialButtonTitles?: string[]; // Multiple buttons (for station 4+)
  skipStation?: boolean; // If true, clicking this button skips next station (increases by 2)
};

export const stations: Station[] = [
  {
    id: "s01",
    title: "Willkommen",
    variant: "v1",
    unlock: "qr",
    tracking: { type: "world_only" },
    dialogAudio: "/audio/AR_02_03.mp3",
    dialogContent: "Ha, nicht erschrecken, hier kommt der Waldschrat - Willkommen auf dem Hexentanzplatz! Nur noch ein paar Schritte, dann bist du mittendrin. Wirst es gleich merken. Da surrt und gurrt und vibriert es unter den Schuhsohlen, das kommt aus dem Inneren des Berges, aber keine Sorge, dort bleibt es auch, jedenfalls heute. Erstmal geht's durchs Hexendorf, schau dich um und dann komm zum Hexenring, diesem Steinkreis mit den hässlichen... ich meine herzigen Gestalten. Wenn´s geht, laufe nicht gegen den Uhrzeigersinn. Generell nicht und hier im Besonderen. Danke!",
    specialButtonTitle: "Waldschrat folgen",
  },
  {
    id: "s02",
    title: "Station 2",
    variant: "v2",
    unlock: "gps_or_qr",
    tracking: { type: "world_only" },
    dialogAudio: "/audio/AR_03_03.mp3",
    dialogContent: "Mephisto: In der Walpurgisnacht werden alle bösen Geister in Steine gebannt, hm, sagen wir fast alle... Je größer der Stein, desto böser der Geist. Du wirst hier noch viel mehr davon finden. Und letztlich spazieren wir ja auch auf einem herum, nicht wahr. Wie gut, dass die Geister auch da drin bleiben... Oder bist du vorhin falschherum gelaufen? Dreimal an die Nase gefasst – ich sage nicht an welche - und dann Holla, die Waldfee!\nHolla: Hui!\nMephisto: Holla!\nHolla: Oh Hallo, wen hast du denn dabei?\nMephisto: Wen?\nMephisto: Na sagen wir - einen Interessenten für unsere Angelegenheiten...\nHolla:  Herrlich!  - Kommt mit zum Flugplatz.",
    specialButtonTitle: "Holla folgen",
  },
  {
    id: "s03",
    title: "Station 3",
    variant: "v1",
    unlock: "gps_or_qr",
    tracking: { type: "world_only" },
    dialogAudio: "/audio/AR_04_03.mp3",
    dialogContent: "Mephisto: Noch so viele schlafende Menschenseelen.... Wann meinst du, werden sie aufwachen und sich an uns erinnern? Wann, glaubst du, werden auch die letzten von ihnen endlich zu uns kommen?\nHolla:  Kann nicht mehr lange dauern. In ihren Träumen haben sie unsere Einladung bereits erhalten.\nMephisto: Ein kleiner Reminder kann trotzdem nicht schaden…. Wisst ihr noch? Geist schafft Materie! Die Wissenschaft hat es doch längst bestätigt. Erinnert euch endlich daran!",
    specialButtonTitle: "Weiter zum Flugplatz",
  },
  {
    id: "s04",
    title: "Station 4",
    variant: "v1",
    unlock: "gps_or_qr",
    tracking: { type: "world_only" },
    dialogAudio: "/audio/AR_05_03.mp3",
    dialogContent: "Holla: Bester Startpunkt, um zum Brocken rüber zu fliegen. Jetzt mit dem Geländer ist es natürlich etwas verstellt. Aber kein Problem...\nMephisto: Materie ist eben nur eine Illusion.\nHolla: Freilich eine schmerzhafte, wenn man sie nicht beherrscht.\nMephisto: Und Schmerzen wollen wir ja nicht, oder?\nHolla: Hier geht's nun weiter über Stock und Stein, viel Spaß beim Kraxeln und grüßt Thor von mir – dazu müsst ihr nur in Richtung der Donar-Eichen nicken. Also lasst Euch Zeit und genießt die gute Luft.\nMephisto: Wir warten dann am Eingang zur Spielstraße auf Euch.",
    specialButtonTitles: ["Abstecher zur Donar-Eiche", "Direkt zur Spielstraße"],
    skipStation: false, // First button increases by 1, second increases by 2
  },
  {
    id: "s05",
    title: "Station 5",
    variant: "v1",
    unlock: "gps_or_qr",
    tracking: { type: "world_only" },
    dialogAudio: "/audio/AR_06_03.mp3",
    dialogContent: "",
    specialButtonTitle: "",
  },
  // Forest example: marker then world
  {
    id: "s07",
    title: "Station 7 (Marker → World Tracking Beispiel)",
    variant: "v1",
    unlock: "qr",
    tracking: { type: "marker_then_world", markerId: "forest_marker_07" },
    dialogAudio: "/audio/s07-dialog.mp3"
  },
  // Remaining stations as placeholders (excluding s01-s05 and s07 which are already defined)
  ...Array.from({ length: 25 - 6 }, (_, i) => {
    // We'll create ids s06, s08-s25 (excluding already defined ones) with simple data.
    const allIds: StationId[] = [
      "s06","s08","s09","s10","s11","s12","s13","s14","s15","s16","s17","s18","s19","s20","s21","s22","s23","s24","s25"
    ];
    const id = allIds[i];
    return {
      id,
      title: `Station ${id.slice(1)}`,
      variant: id >= "s19" ? "v1" : (id === "s12" ? "v2" : "v1"),
      unlock: "gps_or_qr",
      tracking: id >= "s07" && id <= "s18"
        ? { type: "marker_then_world", markerId: `forest_marker_${id}` }
        : { type: "world_only" },
      dialogAudio: `/audio/${id}-dialog.mp3`,
      info: id === "s12"
        ? [{ type: "text", title: "Mehr erfahren", body: "Beispielinhalt für Variante 2." }]
        : undefined
    } as Station;
  })
];

// Sort stations by numeric order so navigation is predictable
stations.sort((a, b) => Number(a.id.slice(1)) - Number(b.id.slice(1)));
