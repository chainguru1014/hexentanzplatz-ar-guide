# Hexentanzplatz WebAR Audioguide — Starter (React/Next.js)

This is a **starter UI + station logic** project for the linear 25-station WebAR audio guide.
It includes:

- Station config for **25 stations** (`src/stations/stations.ts`)
- Two **station templates** (Variant 1 + Variant 2)
- Simple screen flow: Start → Map → QR → Station → Info
- Progress persistence in `localStorage`
- Snapshot + watermark + share **placeholder** (replace with real AR screenshot)

> AR tracking + QR marker + world tracking handoff are **NOT implemented** here. The intended plan
> is to run the AR runtime inside **Mattercraft** and connect it to this UI.

---

## Run locally

```bash
npm i
npm run dev
```

Open http://localhost:3000

---

## Build for Mattercraft (single-folder export)

Mattercraft often expects all files in one folder (no subfolders). Use the flat build:

```bash
npm run build:flat
```

This runs `next build` and then flattens the `out/` tree into **`out-flat/`** with no subfolders: every file is in the root with path slashes replaced by underscores (e.g. `_next/static/chunks/app/page-x.js` → `_next_static_chunks_app_page-x.js`). All references in HTML, JS, and manifest are rewritten. Use the contents of **`out-flat/`** when exporting into Mattercraft.

---

## Where to integrate Mattercraft

### Option A (recommended): Mattercraft hosts the AR runtime, React hosts UI/state

Typical integration approach:

1) In Mattercraft, create your AR project and ensure camera + basic scene works on a phone.
2) Add your React UI as an **overlay layer** (or as a **custom code UI**) if Mattercraft supports it.
3) Create a thin bridge between UI and AR runtime.

**Bridge idea:**
- Mattercraft exposes a JS API, e.g. `window.MC = { loadStation(id), startQrScan(), takeSnapshot() }`
- React calls those functions from `ArViewport` / `ScreenQR` / `SnapshotShare`
- Mattercraft triggers callbacks, e.g. `window.dispatchEvent(new CustomEvent("mc:qr", { detail: payload }))`

### Option B: Next.js app hosts everything (harder)

If you choose to not use Mattercraft for AR, you will integrate the Zappar Web SDK directly in Next.
This starter still helps for UI/state/config — but you re-implement tracking + rendering on your side.

---

## Files you will edit first

- `src/stations/stations.ts`  
  Put your real station content + assets paths here (audio, images, models, marker ids).
- `src/features/ar/ArViewport.tsx`  
  Replace placeholder with calls into Mattercraft (load station, set tracking plan).
- `src/screens/ScreenQR.tsx`  
  Replace fake payload with real QR scan events from Mattercraft.
- `src/features/share/SnapshotShare.tsx`  
  Replace placeholder image generation with real AR screenshot (from Mattercraft / canvas).

---

## Content & assets

Put static assets in:
- `/public/audio/...`
- `/public/images/...`
- `/public/models/...` (GLB)

Later you can switch to a smarter asset pipeline (compression, streaming) as needed.

---

## Next steps checklist (Mattercraft)

1) Create Mattercraft project, run on device
2) Add a QR/marker tracker + event when payload detected
3) Implement marker → world tracking handoff per station (forest stations)
4) Provide a snapshot capture method
5) Connect those functions/events to this React UI

Good luck — this starter keeps your React work clean and scalable.
