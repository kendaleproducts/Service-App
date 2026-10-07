# Service Tracker

A lightweight, web-based service tracking system for managing cooking equipment service calls and contracted service companies — built for a single dispatch location (Fort Erie, ON) supporting a customer's locations across Canada. The app's core output is a one-page printable **Service Ticket** for each request, handed off for processing, shipping, and billing outside the app.

Currently configured for **Mary Brown's** (hundreds of locations). Built to be a launch pad for onboarding additional customers later — the data model already supports multiple customers, even though the UI currently focuses on one.

## Stack

- **Next.js** (App Router, TypeScript) — pages + server actions, no separate API layer needed
- **SQLite** via `better-sqlite3` — single file database, zero external services to run
- **Tailwind CSS** — utility classes only, no component library
- Shared passwords for login (small trusted internal team), two tiers — day-to-day staff and elevated admin

No build step beyond `next build`, no external database server, no queue/cache/etc. The whole app is one Node process plus one SQLite file.

## Getting started

```bash
npm install
cp .env.example .env.local   # then edit ADMIN_PASSWORD and SESSION_SECRET
npm run dev
```

Open http://localhost:3000 and sign in with the password from `.env.local`.

### Demo data

Both seed scripts require real locations to already exist — **import the real spreadsheet first** (Locations → Import from Excel), then layer demo data on top. Neither script ever fabricates a location; only the store data you actually import is used. Service companies, parts, and service requests they create are made up for demo purposes (you don't have real contracted vendors on file yet).

```bash
npm run seed:demo     # general demo: a few vendors, misc equipment parts, requests across every status/priority
npm run seed:fryers   # Mary Brown's-specific: electric pressure fryer parts and failure scenarios
```

Both are safe to re-run — each only inserts if its data doesn't already exist. To start over completely, stop the app, delete the `data/` folder, re-import the spreadsheet, then re-run whichever seed script you want.

### Environment variables

| Variable | Purpose |
|---|---|
| `ADMIN_PASSWORD` | The shared password day-to-day staff use to sign in |
| `SUPER_ADMIN_PASSWORD` | Optional. A second, different password that signs in with elevated **admin** access — see "Admin access" below. Without it set, nobody gets admin access. |
| `SESSION_SECRET` | Random string used to sign session cookies. Generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `DATA_DIR` | Optional. Where the SQLite file is stored. Defaults to `./data`. Set this to point at a mounted persistent volume when deploying (see below). |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Optional. Enables the map on the Locations page. See "Map setup" below. |
| `GOOGLE_MAPS_API_KEY` | Optional. Used server-side to geocode location addresses into map coordinates. See "Map setup" below. |

`ADMIN_PASSWORD` and `SESSION_SECRET` are required — the app will throw on first use if either is missing. The two map keys are optional — without them, the Locations page just shows a small "map unavailable" notice instead of a map.

## Admin access

There's one login screen — whichever password is entered decides the session's access level:

- `ADMIN_PASSWORD` signs in as **staff**: everything day-to-day (create/update service requests, locations, companies, parts; add notes; print tickets).
- `SUPER_ADMIN_PASSWORD` signs in as **admin**: everything staff can do, plus the destructive, rarely-used operations that aren't exposed to a staff session at all:
  - Delete a service request (there's no separate ticket record to delete — the ticket is only ever rendered live from the request, so deleting the request removes its printable ticket too)
  - Delete a service company (any requests it was assigned to are unassigned, not deleted, so their history stays on file)
  - Delete a location, or wipe just its service request history while keeping the location and its equipment on file
  - Unassign a service company from every request it's attached to, without deleting those requests

An admin session shows a small "Admin" badge in the sidebar. These buttons only appear for admin sessions; a staff session never sees them. Every one of these asks for confirmation before running, and none of them can be undone.

## Data model

- **Customers** — currently just Mary Brown's; more can be added later.
- **Locations** — one per store, belongs to a customer. Imported from the head office spreadsheet or added manually.
- **Service Companies** — contracted vendors who do the on-site repair work.
- **Parts** — a simple catalog (part number + description). No quantity/inventory tracking in-app; your parts spreadsheet is the source of truth.
- **Service Requests** — the core record: a location, an issue, a priority/status, an assigned service company, equipment/serial info, parts needed, and a free-text timeline of notes.
- **Service Tickets** — not a separate record. A one-page printable view generated from a Service Request (`/tickets/[id]`), meant to be printed or saved as a PDF for external processing, shipping, and billing.

## Importing locations from Excel

Go to **Locations → Import from Excel** and upload the head office spreadsheet. Expected columns (matches the "MB Master Tracker" format): `Store No.`, `Store Name`, `Franchise/Corporate`, `Store Status`, `Store Address`, `Store City`, `Store Province`, `Store Postal Code`.

- Existing locations are matched and updated by store number.
- New store numbers are added.
- Rows missing a store number or name are skipped and reported.
- Common status typos (e.g. "Archvied") are normalized automatically.

Re-running the import with an updated spreadsheet is safe — it's an upsert, not a wipe-and-reload.

## Map setup (optional)

The Locations page can show an embedded Google Map with two toggleable layers — Stores (Mary Brown's locations) and Vendors (contracted service companies). Vendor pins come free once you import a service companies spreadsheet that includes coordinates (see below); store pins need a one-time geocoding pass since the head office spreadsheet only has addresses, not coordinates.

This needs **two separate API keys** from the same Google Cloud project — they have different security models, so don't reuse one for both:

1. At [console.cloud.google.com](https://console.cloud.google.com), create a project (or use an existing one) and enable billing. Google gives $200/month in free credit, which comfortably covers this app's usage — you're unlikely to see a bill.
2. Enable two APIs under **APIs & Services → Library**: **Maps JavaScript API** and **Geocoding API**.
3. Under **APIs & Services → Credentials**, create two API keys:
   - **Client key** (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`) — restrict it to the **Maps JavaScript API**, and under "Application restrictions" set **HTTP referrers** to your domain(s), e.g. `https://*.up.railway.app/*` and `http://localhost:3000/*`. This key is visible in the page source (that's normal for Maps JavaScript API) — the referrer restriction is what keeps it from being usable elsewhere.
   - **Server key** (`GOOGLE_MAPS_API_KEY`) — restrict it to the **Geocoding API**. Since this is called from your server (no browser referrer), either leave it unrestricted or restrict by your host's IP address if it's static. Keep this one out of any client-facing code.
4. Add both keys to your environment (`.env.local` locally, or your host's environment variables — e.g. Railway's Variables tab), then redeploy/restart.
5. Once real locations are imported, go to **Locations** and click **"Geocode N Location(s) for Map"** — a one-time pass that looks up coordinates for every location missing them and stores them. Safe to re-run; it only processes locations still missing coordinates.

Vendor coordinates come from the Service Companies importer automatically if your spreadsheet has a `Location` column formatted as `"lat, long"` (see the Service Companies import help text) — no separate geocoding step needed. If a vendor spreadsheet only has addresses instead, those companies just won't appear on the map layer until coordinates are added directly (there's no geocode-on-demand button for vendors yet, only for locations).

## Deployment

This runs as a single long-lived Node process, not a serverless function — it needs a writable local disk for the SQLite file. **Serverless hosts like Vercel will not work**: their filesystem doesn't persist between requests, so the database would reset constantly. Use a host that runs an always-on server with a persistent volume. Once deployed, the app works from any device with a browser and an internet connection — phone, tablet, or desktop, on WiFi or cellular — no native app required.

### Railway (recommended)

1. Push this repo to GitHub (already done if you're reading this on the repo).
2. At [railway.app](https://railway.app), **New Project → Deploy from GitHub repo**, pick this repo/branch.
3. Add a **Volume**, mount it at `/data`.
4. Under the service's **Variables**, add:
   - `ADMIN_PASSWORD` — your chosen staff password
   - `SUPER_ADMIN_PASSWORD` — optional, a different password for admin access (see "Admin access" above)
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
