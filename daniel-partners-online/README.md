# Daniel & Partners Online — sandbox

A standalone prototype of an **online-only legal services offering** for Daniel & Partners LLP (St. Catharines, Ontario). It is linked from the firm's main website as a more economical alternative to a traditional retainer, delivered by the same lawyers through secure video, e-signature and a client portal.

Everything in this folder is a sandbox: demonstration data, placeholder fees, no live payments or video. It is self-contained and does not touch the Kendale Service Desk app at the repository root.

## What it does

**Public site** (dark, on-brand with niagaralaw.ca)
- Landing page with the firm's headline and tagline, why-online positioning, featured services, four-step process, lawyer strip and footer with the firm's address and phone.
- **Services & Fees**: twelve flat-fee / from-fee services across Wills & Estates, Real Estate, Business, Employment and Everyday Legal, each with scope, inclusions, timeline and the lawyers who handle it.
- **How It Works** and **Our Lawyers** pages.

**Intake** (`/start/<service>`), a five-step form: about you (creates the portal account), service-specific questions, conflict check, pick a video-consultation slot, review and submit. Submitting opens a matter, assigns the least-loaded lawyer in the practice area, books the meeting and signs the client in.

**Client portal** (`/portal`)
- Dashboard with "needs your attention" items, open and completed matters, upcoming meetings.
- Matter page: status stepper with plain-language guidance, engagement letter with typed e-signature, secure messaging, document requests and uploads, drafts to approve, video meetings (book / join), billing with sandbox "Pay", intake answers and an activity log.
- Video room placeholder, account page.

**Firm desk** (`/firm`, staff only)
- Dashboard: intake queue awaiting conflict check, "my matters" for lawyers, unread client messages, upcoming meetings, headline counts.
- Matters list with filters (open, intake, awaiting client, unread, by lawyer), clients list and client pages, video calendar.
- Matter workspace: clear conflict, assign lawyer, set status, generate/edit and send the engagement letter with a retainer request, message the client, send drafts or finals (file or pasted text), request documents, book meetings, mark meetings completed, issue invoices and mark paid, internal notes, full activity log including internal entries.

Automatic transitions: booking a consult moves a new matter to *Consultation scheduled*; sending the letter moves it to *Engagement pending*; when the letter is signed and no retainer is outstanding it moves to *In progress*; sending a draft moves it to *Awaiting client review*.

## Stack

- Next.js 16 (App Router, Server Actions, `proxy.ts` auth gate), React 19, TypeScript
- Tailwind CSS 4 with brand tokens in `src/app/globals.css`
- SQLite via `better-sqlite3` (one file under `data/`), uploads stored under `data/uploads/`
- Email + password accounts (scrypt), HMAC-signed session cookie; roles `client` and `staff`

## Run it

```bash
cd daniel-partners-online
npm install
cp .env.example .env.local      # set SESSION_SECRET
npm run dev                     # http://localhost:3000
```

Sandbox accounts (password `Sandbox2026!`, or whatever `SANDBOX_PASSWORD` is set to before first run):

| Email | Who |
|---|---|
| `client@sandbox.test` | Jordan Avery — client with a will matter in review and a new employment matter |
| `priya@sandbox.test` | Priya Natarajan — client with a real estate purchase awaiting engagement |
| `intake@sandbox.test` | Intake Desk — firm staff, no lawyer profile |
| `matteson.de.luca@sandbox.test`, `callum.shedden@sandbox.test`, `brandon.m.boone@sandbox.test`, `donald.c.delorenzo@sandbox.test` | Lawyers — firm staff |

Delete `data/online.db` to reset the sandbox; it reseeds on the next request.

Checks: `npm run lint`, `npx next typegen && npm run typecheck`, `npm run build`.

## Brand

Derived from niagaralaw.ca: near-black backgrounds, white type, brass-gold accent (the "&" in the wordmark), thin wide-tracked uppercase headlines, serif wordmark, rounded outlined/solid white buttons. Fonts: Josefin Sans (headlines), Cormorant Garamond (wordmark), Source Sans 3 (body and UI). The reference screenshot is in `public/brand/reference-niagaralaw-home.png`.

All colours are CSS variables at the top of `src/app/globals.css`; replace them with the firm's official hex values and every screen follows. Copy constants (tagline, headline, address, phone) are in `src/lib/brand.ts`.

## Before this leaves the sandbox

- **Fees** in `src/lib/seed.ts` are illustrative and must be set by the partners.
- **Lawyer roster and titles** were taken from public listings and need confirming; bios are placeholders.
- **Payments**: "Pay" only records the payment. Integrate a processor that supports trust accounting (e.g. LawPay / Clio Payments / Stripe with trust handling).
- **Video**: the room is a placeholder; embed the firm's provider and send calendar invitations.
- **Email**: no notifications are sent yet (intake confirmation, new message, document request, meeting reminders).
- **Identity verification** per Law Society of Ontario by-law requirements; the ID upload request is the hook for it.
- **Remote witnessing/commissioning** flows should be reviewed by the responsible lawyer against current Ontario requirements.
- **Auth hardening**: password reset, MFA for staff, rate limiting, audit log retention, and real user provisioning for staff.
- Hosting with a persistent volume for `DATA_DIR`, HTTPS, backups, and a privacy policy / terms of use page.
