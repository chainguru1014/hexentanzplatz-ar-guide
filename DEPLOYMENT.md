# Deployment Guide

## Quick Fix for WebAssembly MIME Type Error

If you're seeing this error:
```
TypeError: Failed to execute 'compile' on 'WebAssembly': Incorrect response MIME type. Expected 'application/wasm'.
```

Your web server needs to be configured to serve `.wasm` files with the correct MIME type.

## Nginx Configuration

### Step 1: Create/Edit Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/hexentanzplatz-ar
```

### Step 2: Add This Configuration

```nginx
server {
    listen 80;
    server_name 82.165.217.122;  # Your IP or domain
    
    root /var/www/hexentanzplatz-ar-guide/out;  # Path to your built files
    index index.html;

    # CRITICAL: WebAssembly MIME type
    location ~* \.wasm$ {
        add_header Content-Type application/wasm;
        add_header Access-Control-Allow-Origin *;
        expires 1y;
    }

    # Serve static files
    location / {
        try_files $uri $uri.html $uri/ =404;
    }

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2|ttf|svg|mp3|glb)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Step 3: Enable and Test

```bash
sudo ln -s /etc/nginx/sites-available/hexentanzplatz-ar /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Apache Configuration

### Step 1: Enable Required Modules

```bash
sudo a2enmod mime
sudo a2enmod headers
sudo systemctl restart apache2
```

### Step 2: Create/Edit .htaccess

Create or edit `.htaccess` in your web root (where `index.html` is):

```apache
# CRITICAL: WebAssembly MIME type
<IfModule mod_mime.c>
    AddType application/wasm .wasm
</IfModule>
```

## Verify the Fix

1. Check the response headers for a `.wasm` file:
   ```bash
   curl -I https://82.165.217.122/mc/zapparcv.b64cbd.wasm
   ```

2. You should see:
   ```
   Content-Type: application/wasm
   ```

3. If you see `Content-Type: application/octet-stream` or something else, the configuration didn't work.

## Full Deployment Checklist

- [ ] Build the project: `yarn build`
- [ ] Upload `out/` directory to VPS
- [ ] Configure web server with correct `.wasm` MIME type
- [ ] Set up HTTPS (required for camera access)
- [ ] Test AR experience loads without errors
- [ ] Verify camera permissions work on mobile devices
