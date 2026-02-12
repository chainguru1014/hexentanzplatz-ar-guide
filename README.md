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

## Deployment (VPS/Production)

### ⚠️ **CRITICAL: HTTPS Required for Camera Access**

**The QR code scanner requires HTTPS to access the device camera.** Browsers block camera access on non-secure (HTTP) connections for security reasons.

### ⚠️ **CRITICAL: WebAssembly MIME Type Configuration**

**Mattercraft AR requires `.wasm` files to be served with the correct MIME type.** Without this, you'll see:
```
TypeError: Failed to execute 'compile' on 'WebAssembly': Incorrect response MIME type. Expected 'application/wasm'.
```

**To fix this:**

#### For Nginx:

1. **Copy the example configuration:**
   ```bash
   sudo cp nginx.conf.example /etc/nginx/sites-available/hexentanzplatz-ar
   ```

2. **Edit the configuration:**
   ```bash
   sudo nano /etc/nginx/sites-available/hexentanzplatz-ar
   ```
   - Update `root` path to point to your `out/` directory
   - Update `server_name` with your domain or IP

3. **Enable the site:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/hexentanzplatz-ar /etc/nginx/sites-enabled/
   sudo nginx -t  # Test configuration
   sudo systemctl reload nginx
   ```

**Key configuration (already in the example):**
```nginx
location ~* \.wasm$ {
    add_header Content-Type application/wasm;
    add_header Access-Control-Allow-Origin *;
    expires 1y;
    access_log off;
}
```

#### For Apache:

1. **Copy the example `.htaccess`:**
   ```bash
   cp .htaccess.example /var/www/html/.htaccess
   # Or wherever your web root is
   ```

2. **Enable required modules:**
   ```bash
   sudo a2enmod mime
   sudo a2enmod headers
   sudo systemctl restart apache2
   ```

**Key configuration (already in the example):**
```apache
<IfModule mod_mime.c>
    AddType application/wasm .wasm
</IfModule>
```

### Deployment Steps:

1. **Build the project:**
   ```bash
   yarn build
   # or
   npm run build
   ```

2. **Upload the `out/` directory to your VPS:**
   ```bash
   scp -r out/ user@82.165.217.122:/var/www/hexentanzplatz-ar-guide/
   ```

3. **Configure your web server** (Nginx or Apache) using the example files above

4. **Set up HTTPS** (recommended for camera access):
   - **Let's Encrypt (Free SSL)**: Use Certbot to get free SSL certificates
   - **Nginx reverse proxy**: Configure Nginx with SSL certificates
   - **Cloudflare**: Use Cloudflare's free SSL proxy

**Without HTTPS, users will see "Failed to start QR scanner" errors on mobile devices.**
**Without the correct `.wasm` MIME type, the AR experience will fail to load.**

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
