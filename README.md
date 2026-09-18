# Service Tracker

A lightweight, web-based service tracking system for managing cooking equipment service calls, parts shipments, and contracted service companies — built for a single dispatch/parts-stocking location (Fort Erie, ON) supporting a customer's locations across Canada.

Currently configured for **Mary Brown's** (hundreds of locations). Built to be a launch pad for onboarding additional customers later — the data model already supports multiple customers, even though the UI currently focuses on one.

## Stack

- **Next.js** (App Router, TypeScript) — pages + server actions, no separate API layer needed
- **SQLite** via `better-sqlite3` — single file database, zero external services to run
- **Tailwind CSS** — utility classes only, no component library
- Single shared admin password for login (small trusted internal team)

No build step beyond `next build`, no external database server, no queue/cache/etc. The whole app is one Node process plus one SQLite file.

## Getting started

```bash
npm install
cp .env.example .env.local   # then edit ADMIN_PASSWORD and SESSION_SECRET
npm run dev
```

Open http://localhost:3000 and sign in with the password from `.env.local`.

### Demo data

For testing or a sales demo, populate the database with a realistic sample set (a handful of locations across the country, service companies, parts including a low-stock item, and service requests across every status/priority):

```bash
npm run seed:demo
```

Safe to re-run — it only inserts if each table is empty. To start over, stop the app and delete the `data/` folder, then re-run `npm run seed:demo`. For a real deployment, use **Locations → Import from Excel** instead to load actual store data.

### Environment variables

| Variable | Purpose |
|---|---|
| `ADMIN_PASSWORD` | The single shared password staff use to sign in |
| `SESSION_SECRET` | Random string used to sign session cookies. Generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `DATA_DIR` | Optional. Where the SQLite file is stored. Defaults to `./data`. Set this to point at a mounted persistent volume when deploying (see below). |

`ADMIN_PASSWORD` and `SESSION_SECRET` are required — the app will throw on first use if either is missing.

## Data model

- **Customers** — currently just Mary Brown's; more can be added later.
- **Locations** — one per store, belongs to a customer. Imported from the head office spreadsheet or added manually.
- **Service Companies** — contracted vendors who do the on-site repair work.
- **Parts** — inventory stocked at Fort Erie, with a reorder threshold that flags low stock.
- **Service Requests** — the core ticket: a location, an issue, a priority/status, an assigned service company, and a free-text timeline of notes.
- **Part Shipments** — parts shipped from Fort Erie to a location or service company, optionally linked to a service request. Creating a shipment automatically decrements part inventory.

## Importing locations from Excel

Go to **Locations → Import from Excel** and upload the head office spreadsheet. Expected columns (matches the "MB Master Tracker" format): `Store No.`, `Store Name`, `Franchise/Corporate`, `Store Status`, `Store Address`, `Store City`, `Store Province`, `Store Postal Code`.

- Existing locations are matched and updated by store number.
- New store numbers are added.
- Rows missing a store number or name are skipped and reported.
- Common status typos (e.g. "Archvied") are normalized automatically.

Re-running the import with an updated spreadsheet is safe — it's an upsert, not a wipe-and-reload.

## Deployment

This runs as a single long-lived Node process, not a serverless function — it needs a writable local disk for the SQLite file. **Serverless hosts like Vercel will not work**: their filesystem doesn't persist between requests, so the database would reset constantly. Use a host that runs an always-on server with a persistent volume. Once deployed, the app works from any device with a browser and an internet connection — phone, tablet, or desktop, on WiFi or cellular — no native app required.

### Railway (recommended)

1. Push this repo to GitHub (already done if you're reading this on the repo).
2. At [railway.app](https://railway.app), **New Project → Deploy from GitHub repo**, pick this repo/branch.
3. Add a **Volume**, mount it at `/data`.
4. Under the service's **Variables**, add:
   - `ADMIN_PASSWORD` — your chosen password
   - `SESSION_SECRET` — a random string (generate with the command above)
   - `DATA_DIR` = `/data`
5. Railway auto-detects Next.js, runs `npm install && npm run build`, then `npm run start`, and gives you a public `https://*.up.railway.app` URL.

### Render

1. At [render.com](https://render.com), **New → Web Service**, connect this repo/branch.
2. Build command: `npm install && npm run build`. Start command: `npm run start`.
3. Add a **Disk**, mount path `/data`.
4. Under **Environment**, add `ADMIN_PASSWORD`, `SESSION_SECRET`, and `DATA_DIR=/data`.
5. Render gives you a public `https://*.onrender.com` URL. Note: free-tier services sleep after inactivity and take ~30s to wake on the next request.

### Backups

Whichever host you use, the entire database is the one file at `$DATA_DIR/app.db`. Back it up regularly — most hosts let you shell in or download from the volume.

### Roadmap: offline use

The app currently requires an internet connection (any type — WiFi or cellular both work fine). True offline support — logging a service call with no signal and syncing once reconnected — is a larger feature (an installable PWA with local storage and background sync) that isn't built yet.
