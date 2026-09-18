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

### Environment variables

| Variable | Purpose |
|---|---|
| `ADMIN_PASSWORD` | The single shared password staff use to sign in |
| `SESSION_SECRET` | Random string used to sign session cookies. Generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

Both are required — the app will throw on first use if either is missing.

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

## Deployment notes

This is designed to run as a single long-lived Node process (e.g. `npm run build && npm run start` on a small VM, or any host that supports a persistent Node server — not a serverless/edge-only platform, since it needs a writable local disk for the SQLite file at `data/app.db`).

Back up `data/app.db` regularly — it's the entire database.
