# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

## Project notes

- Standalone sandbox for **Daniel & Partners Online**, the virtual legal-services offering of Daniel & Partners LLP (St. Catharines, ON). See `README.md`.
- Brand tokens live in `src/app/globals.css`; firm facts and copy in `src/lib/brand.ts`.
- SQLite via `better-sqlite3`; schema in `src/lib/schema.sql`, sandbox seed in `src/lib/seed.ts`. Delete `data/online.db` to reseed.
- Run `npm run lint`, `npm run typecheck` (after `npx next typegen`) and `npm run build` before committing.
