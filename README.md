# TagAlong

TagAlong is a responsive QR Code Business Card Generator that runs entirely in the browser.

## Features

- Live vCard QR code preview with PNG/SVG export, PDF print flow, share, and clipboard copy
- Basic free-tier generator for name, phone, email, company, title, website, and address
- Local history with JSON export and per-card reload/delete actions
- Premium dynamic QR profiles, CSV/TSV batch imports (including Excel-exported files), and business-tier gated analytics/API previews
- Built-in QR scanner/import flow for vCard and URL QR codes on supported browsers

## Usage

### Quick start (file://)

Double-click `index.html`, or open it directly from your terminal:

```bash
# macOS
open index.html

# Windows
start index.html

# Linux
xdg-open index.html
```

> **Note:** Opening via `file://` disables a few browser APIs (camera scanner, `crypto.randomUUID` in some browsers). Use a local server for the full experience.

### Local server (recommended)

Serve the project root with any static server, then visit `http://localhost:8000`:

```bash
# Python 3
python3 -m http.server 8000

# Node.js (npx)
npx serve .

# PHP
php -S localhost:8000
```

### Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Camera scanner doesn't start | Requires a secure context | Use `http://localhost` or `https://` |
| IDs look like timestamps instead of UUIDs | `crypto.randomUUID` needs a secure context | Use a local server |
| Features appear locked | `file://` blocks some APIs | Use a local server |
