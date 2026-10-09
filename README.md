# Kendale Service Desk

A lightweight, web-based service tracking system for managing cooking equipment service calls and contracted service companies — built for a single dispatch location (Fort Erie, ON) supporting a customer's locations across Canada. The app's core output is a one-page printable **Service Ticket** for each request, handed off for processing, shipping, and billing outside the app.

Currently configured for **Mary Brown's** (hundreds of locations). Built to be a launch pad for onboarding additional customers later — the data model already supports multiple customers, even though the UI currently focuses on one.

## Stack

- **Next.js** (App Router, TypeScript) — pages + server actions, no separate API layer needed
- **SQLite** via `better-sqlite3` — single file database, zero external services to run
- **Tailwind CSS** — utility classes only, no component library
- Shared passwords for login (small trusted internal team), two tiers — day-to-day user and elevated admin

No build step beyond `next build`, no external database server, no queue/cache/etc. The whole app is one Node process plus one SQLite file.

## Getting started

```bash
npm install
cp .env.example .env.local   # then edit USER_PASSWORD and SESSION_SECRET
npm run dev
```

Open http://localhost:3000 and sign in with the password from `.env.local`.

### Environment variables

| Variable | Purpose |
|---|---|
| `USER_PASSWORD` | The shared password day-to-day users sign in with |
| `ADMIN_PASSWORD` | Optional. A second, different password that signs in with elevated **admin** access — see "Admin access" below. Without it set, nobody gets admin access. |
| `SESSION_SECRET` | Random string used to sign session cookies. Generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `DATA_DIR` | Optional. Where the SQLite file is stored. Defaults to `./data`. Set this to point at a mounted persistent volume when deploying (see below). |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Optional. Enables the map on the Locations page. See "Map setup" below. |
| `GOOGLE_MAPS_API_KEY` | Optional. Used server-side to geocode location addresses into map coordinates. See "Map setup" below. |

`USER_PASSWORD` and `SESSION_SECRET` are required — the app will throw on first use if either is missing. The two map keys are optional — without them, the Locations page just shows a small "map unavailable" notice instead of a map.

## Admin access

There's one login screen — whichever password is entered decides the session's access level:

- `USER_PASSWORD` signs in as **user**: everything day-to-day (create/update service requests, locations, companies, parts; add notes; print tickets).
- `ADMIN_PASSWORD` signs in as **admin**: everything a user can do, plus the destructive, rarely-used operations that aren't exposed to a user session at all:
  - Delete a service request (there's no separate ticket record to delete — the ticket is only ever rendered live from the request, so deleting the request removes its printable ticket too)
  - Delete a service company, or clear the entire service companies list at once (any requests they were assigned to are unassigned, not deleted, so their history stays on file)
  - Delete a location, or wipe just its service request history while keeping the location and its equipment on file
  - Unassign a service company from every request it's attached to, without deleting those requests
  - Replace the entire service companies list via import (the "Replace all" checkbox on Import from Excel) — a merge/update import stays available to everyone

An admin session shows a small "Admin" badge in the sidebar. These buttons only appear for admin sessions; a user session never sees them. Every one of these asks for confirmation before running, and none of them can be undone.

## Data model

- **Customers** — currently just Mary Brown's; more can be added later.
- **Locations** — one per store, belongs to a customer. Imported from the head office spreadsheet or added manually.
- **Service Companies** — contracted vendors who do the on-site repair work.
- **Parts** — a simple catalog (part number + description). No quantity/inventory tracking in-app; your parts spreadsheet is the source of truth.
- **Service Requests** — the core record: a location, an issue, a priority/status, an assigned service company, equipment/serial info, parts needed, and a free-text timeline of notes.
- **Service Tickets** — not a separate record. A one-page printable view generated from a Service Request (`/tickets/[id]`), meant to be printed or saved as a PDF for external processing, shipping, and billing.
- **Equipment** — one row per machine at a location, keyed by serial number. Created automatically the first time a service request is logged against a machine; open a unit (from its location page or the Fleet report) to record its make/model, installed year, replacement cost, and status (Active / Obsolete / Retired). Those three fields are what drive the Fleet report.

## Reports

- **Service Requests** — counts and costs for a period, broken down by status, priority, and service company, with the matching request list.
- **Fleet** — the quarterly equipment review. For the chosen period it identifies high-service-cost units, repeat failures, obsolete equipment (marked obsolete, or past the expected life since installed year), recommended replacements (obsolete, lifetime service cost above a set share of replacement cost, or too many calls in the last 12 months), and upcoming capital requirements (replacement cost of every recommended unit, by province). The thresholds are editable on the page; defaults are $1,500 period cost, 2 calls per period, a 10-year life, and replacement at 50% of replacement cost. Units with no installed year or replacement cost are called out so the data can be filled in.

Both reports print cleanly via the Print Report button.

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

Vendor coordinates come from the Service Companies importer automatically if your spreadsheet has a `Location` column formatted as `"lat, long"`, or separate `Latitude`/`Longitude` columns (see the Service Companies import help text) — no separate geocoding step needed. The import result will call out how many companies were imported without coordinates, if any. If your spreadsheet only has street addresses instead, go to **Service Companies** and click **"Geocode N Service Company(s) for Map"** — the same one-time, safe-to-re-run pass Locations uses, looking up coordinates from each company's saved address.

The Locations page's "Service Companies" map checkbox is checked by default whenever any are geocoded — if it looks empty, check that box before assuming the data didn't import.

## Deployment

This runs as a single long-lived Node process, not a serverless function — it needs a writable local disk for the SQLite file. **Serverless hosts like Vercel will not work**: their filesystem doesn't persist between requests, so the database would reset constantly. Use a host that runs an always-on server with a persistent volume. Once deployed, the app works from any device with a browser and an internet connection — phone, tablet, or desktop, on WiFi or cellular — no native app required.

### Railway (recommended)

1. Push this repo to GitHub (already done if you're reading this on the repo).
2. At [railway.app](https://railway.app), **New Project → Deploy from GitHub repo**, pick this repo/branch.
3. Add a **Volume**, mount it at `/data`.
4. Under the service's **Variables**, add:
   - `USER_PASSWORD` — your chosen day-to-day password
   - `ADMIN_PASSWORD` — optional, a different password for admin access (see "Admin access" above)
   - `SESSION_SECRET` — a random string (generate with the command above)
   - `DATA_DIR` = `/data`

   **If you already have this deployed:** your existing `ADMIN_PASSWORD` variable was the day-to-day login. Rename it to `USER_PASSWORD` (same value), then add a new, different `ADMIN_PASSWORD` value for admin access. Deploy this update only after renaming it — otherwise the app can't find `USER_PASSWORD` and login will fail entirely until you fix it.
5. Railway auto-detects Next.js, runs `npm install && npm run build`, then `npm run start`, and gives you a public `https://*.up.railway.app` URL.

### Render

1. At [render.com](https://render.com), **New → Web Service**, connect this repo/branch.
2. Build command: `npm install && npm run build`. Start command: `npm run start`.
3. Add a **Disk**, mount path `/data`.
4. Under **Environment**, add `USER_PASSWORD`, optionally `ADMIN_PASSWORD` (admin access), `SESSION_SECRET`, and `DATA_DIR=/data`. (Already deployed? See the renaming note under Railway above — same applies here.)
5. Render gives you a public `https://*.onrender.com` URL. Note: free-tier services sleep after inactivity and take ~30s to wake on the next request.

### Backups

Whichever host you use, the entire database is the one file at `$DATA_DIR/app.db`. Back it up regularly — most hosts let you shell in or download from the volume.

### Roadmap: offline use

The app currently requires an internet connection (any type — WiFi or cellular both work fine). True offline support — logging a service call with no signal and syncing once reconnected — is a larger feature (an installable PWA with local storage and background sync) that isn't built yet.
