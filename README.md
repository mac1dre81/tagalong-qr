# TagAlong

TagAlong is a responsive QR Code Business Card Generator that runs entirely in the browser.

## Features

- Live vCard QR code preview with PNG download, share, and clipboard copy
- Basic free-tier generator for name, phone, email, company, title, website, and address
- Local history with JSON export and per-card reload/delete actions
- Premium and business UI with feature gating, upgrade prompts, and mock subscription management
- Built-in QR scanner/import flow for vCard and URL QR codes on supported browsers

## Usage

Open `/tmp/workspace/mac1dre81/tagalong-qr/index.html` in a browser, or serve the folder locally:

```bash
cd /tmp/workspace/mac1dre81/tagalong-qr
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.
