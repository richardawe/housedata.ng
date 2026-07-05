# Housedata.ng — Nigeria Government & Private Housing Estates

A single-page map of government and private housing estates across
Nigeria, live at [housedata.ng](https://housedata.ng/). Currently covers
12 states — Lagos, FCT (Abuja), Rivers, Ogun, Kano, Enugu, Ondo, Edo,
Delta, Bayelsa, Akwa Ibom, and Cross River (the full Lagos-Calabar Coastal
Highway corridor plus the original 6) — 220 estates — expanding state by
state. Plain HTML/CSS/JS frontend, no build step, no bundler — Leaflet.js
+ OpenStreetMap tiles for the map. Estate data is served by a small PHP +
PostgreSQL backend (see **Backend / database** below) rather than bundled
into the page.

Each estate links to an in-app mortgage calculator (modal, using
[MREIF](https://www.mreif.com.ng/)'s published 9.75%-fixed terms as
defaults) and an "About MREIF" modal — both self-contained, no navigating
away. The calculator is an unofficial estimate only; actually applying
still happens on MREIF's own site (linked from both modals).
housedata.ng doesn't collect financial documents or claim any specific
estate is in MREIF's approved developer network.

## Running it

The frontend is static, but estate data now comes from `api/estates.php`
(PHP + PostgreSQL), so `index.html` needs a PHP server with a reachable
database to show real data — see **Backend / database** below for the
one-time setup. Once that's done:

```
php -S localhost:8000
```

then visit `http://localhost:8000`. (Plain `python3 -m http.server` still
works for quickly checking static changes — layout, CSS, `access-bank.html`
— but the map will show no estates without the PHP API.)

Map tiles require an internet connection (OpenStreetMap) regardless.
Leaflet itself is vendored locally under `vendor/leaflet/` (not loaded
from a CDN), so the map still works even on a flaky connection — only the
tile images and the estates API need live connectivity. `app.js` caches
the last successful `api/estates.php` response in `localStorage` and
falls back to it (with a small "showing previously loaded data" banner)
if a later page load can't reach the API — the closest practical
equivalent to the old fully-static "works offline after first load"
property, now that estate data is fetched rather than bundled.

## Deployment (CI/CD)

Every push to `main` automatically deploys to housedata.ng via
`.github/workflows/deploy.yml`, which FTPS-uploads the repo straight to
the cPanel document root using
[SamKirkland/FTP-Deploy-Action](https://github.com/SamKirkland/FTP-Deploy-Action).
No manual FTP or cPanel File Manager step is needed.

Credentials live only as GitHub Actions repo secrets (**Settings → Secrets
and variables → Actions**), never in the repo:

| Secret | Value |
|---|---|
| `FTP_SERVER` | FTP host (e.g. `ftp.housedata.ng`) |
| `FTP_USERNAME` | FTP account username |
| `FTP_PASSWORD` | FTP account password |
| `FTP_SERVER_DIR` | Target directory — **must end with `/`**, e.g. `/public_html/` |

To test without a new commit: **Actions tab → Deploy to housedata.ng → Run
workflow**. Check progress and errors in the run log — secret values are
automatically masked, so logs are safe to share for debugging.

**SSL:** confirm HTTPS is active for housedata.ng in cPanel (**Security →
SSL/TLS Status**, or AutoSSL) before turning on any HTTPS-forcing
redirect. `.htaccess` ships with the redirect rule present but commented
out for exactly this reason — enabling it before SSL is live would break
the site. Prefer cPanel's own "Force HTTPS Redirect" toggle (Domains page)
over the `.htaccess` rule once SSL is confirmed.

This repo can also still be served from GitHub Pages (Settings → Pages →
Deploy from a branch → root) for a **static-only preview** — all asset
paths are relative, so it works from either a domain root or a
`/<repo>/` subpath, and a `.nojekyll` file is included so Pages serves
files as-is without running them through Jekyll. Pages has no PHP/Postgres,
though, so the map itself will show no estates there now that estate data
comes from `api/estates.php` — it's only useful for checking static pages
like `access-bank.html` or layout/CSS changes, not the full app.

## Backend / database

Estate data used to be a static, committed `data.js` bundled into the
page. It now lives in PostgreSQL and is served by `api/estates.php`, so
new estates (developer submissions, admin edits, future phases) can go
live without a git commit/deploy. `data.js` is kept in the repo as a
frozen historical snapshot and as the seed input for the one-time import
below — nothing reads it at runtime anymore.

**One-time setup** (cPanel → PostgreSQL Databases + MultiPHP Manager):

1. Create a Postgres database + role, and enable the `pdo_pgsql`/`pgsql`
   PHP extensions for the site.
2. Copy `api/config.example.php` to `api/config.php` **directly on the
   server** (cPanel File Manager or SFTP) and fill in the real DB/SMTP
   values. This file is gitignored and must never be committed or pushed
   — same handling as the FTP secrets above, just server-side instead of
   in GitHub Actions. Deploys never touch or delete it (same reason
   `dashboard/.htpasswd` survives deploys — see **Analytics** below).
3. Apply the schema once: `psql "host=... dbname=... user=..." -f db/migrations/0001_init.sql`.
   One file covers every phase of the backend (estates today; accounts,
   verification, financier leads, and developer submissions as they
   land), so this is the only manual SQL step ever needed.
4. Import the existing 220 estates: `node scripts/dump-data-js.js` (reads
   `data.js`, writes clean JSON — Node is only needed for this one-time
   local step, not by the deployed site), then
   `php scripts/import-data-js.php` (reads that JSON, inserts into
   Postgres, safe to re-run).

`api/estates.php` is the only public read endpoint so far
(`?q=`/`state=`/`lga=`/`type=`/`status=` filters, backed by a Postgres
`tsvector`/GIN index for `q`). `api/_db.php`/`api/_lib.php` hold shared
PDO/response helpers that later phases (accounts, verification,
submissions, financier leads — see the project's phased roadmap) build
on top of. `scripts/`, `db/`, and `api/config.php` are all blocked from
direct HTTP access via their own `.htaccess` files, on top of not being
web-routable in the first place.

## Data status — read before presenting

1. **The estate data is compiled from public sources, not verified
   government records.** `data.md` has the original Lagos working notes.
   FCT and Rivers entries were compiled the same way — public agency sites,
   news coverage, and real estate aggregators — not verified government
   records. Coordinates in `data.js` are neighbourhood-level approximations
   geocoded from place names — good enough for a map pin, not for a
   physical address. Verify before publishing this as authoritative.
2. **Per-estate contacts are agency-level placeholders** for government
   estates — not verified direct lines for individual estates. Every
   government estate routes enquiries to whichever agency plausibly
   manages it (Lagos HOMS, LSDPC, FHA, FCDA, RSHPDA, etc.), using only
   publicly listed agency contacts — no phone number or email was invented.
3. **Private estates are a seed set, not developer submissions.** They were
   sourced from public listings/aggregators (PropertyPro, Nigeria Property
   Centre, Estate Intel) to prove the model. The intended long-term source
   is developer self-submission with an eligibility bar, similar to
   MREIF's own developer-eligibility process — that's a later phase of the
   backend roadmap (submissions table + moderation queue already exist in
   the schema, the public submission form and admin review screen don't
   yet).
4. **The MREIF financing link is informational only.** It routes to
   MREIF's real sign-up/pre-qualifier pages; housedata.ng doesn't verify
   which estates (if any) are in MREIF's approved developer network, and
   says so directly in the banner, every popup, and the footer.

## Adding or editing an estate

Estates live in Postgres now, not `data.js`. Until the admin edit screen
and developer-submission form (later roadmap phases) exist, add or edit
one directly:

```sql
INSERT INTO estates (
  id, name, state, lga, area, type, status, lat, lng,
  unit_types, units_text, price_range, agency_key, source_note
) VALUES (
  'unique-slug', 'Estate Name', 'Lagos', 'Local Government Area', 'Neighbourhood, District',
  'Government', 'Completed', 6.5000, 3.5000,
  '1, 2, 3 bed flats', '84 units', NULL, 'HOMS',
  'Source: ... — publicly reported, verify before publishing.'
);
```

Reuse an existing `agencies.key` (e.g. `'HOMS'`) for `agency_key` on
government estates rather than inventing a new phone/email — if the
agency isn't there yet, add a row to `agencies` once (with a real,
citable source). For private estates, leave `agency_key` `NULL` and set
`contact_name`/`contact_phone`/`contact_email`/`contact_website` instead,
using the developer's own public contact — leave phone/email `NULL`
rather than guessing if you can't verify one. `search_vector` and
`agency_display_name` are maintained automatically by triggers; no need
to set them.

To add a new state, just insert estates with that `state` value — the
State filter, Area filter, and map bounds all populate dynamically from
whatever `api/estates.php` returns, no other file needs to change.

Map markers (circle = Government, diamond = Private, coloured by status),
the sidebar list, all filters (state, type, status, area, and free-text
search), and popups all read from this one table via the API.

## Infrastructure overlay

`infrastructure.js` holds a separate `INFRASTRUCTURE` array — 20 major
railways and roads (existing, under construction, stalled, or planned)
near the covered states, each a named route built from waypoints, with a
status, description, and source. It's off by default; the "Infrastructure"
control at the top-right of the map toggles it, with separate Railways/
Roads checkboxes. Existing = solid line, under construction = dashed,
stalled = dotted, planned = sparse dashed — railways are purple, roads are
grey. Routes are corridor-level approximations between named towns, not
surveyed alignments — good enough to show a line passes near an estate,
not for engineering use. Add a new entry the same way as an estate: copy
an existing block, keep `path` as a plain array of `[lat, lng]` waypoints.

## Financing partner pages

`access-bank.html` is a standalone page (not a modal) summarizing Access
Bank's mortgage products, with its own calculator defaulted to the one
product with a publicly disclosed rate (My First Home Mortgage Savings
Plan, 15% p.a.). It's linked from the main app's finance banner
("Access Bank →") but otherwise independent — same design system, own
data file (`access-bank-data.js`), own small script (`access-bank.js`,
duplicates the amortization formula from `app.js` rather than sharing it,
since it's one page). Same rule as everywhere else: no fabricated rates —
products without a public rate say so and point to the bank directly. If
another lender gets added later, follow this same pattern rather than
folding it into the MREIF modal.

## Analytics (self-hosted, no third party)

Requires **PHP** on the server (standard on cPanel shared hosting — check
**cPanel → MultiPHP Manager** if unsure). No database, no external
analytics service.

- **`analytics.js`** — included on `index.html` and `access-bank.html`.
  Listens for clicks/changes on the app's existing elements (filters,
  estate cards, view toggle, modal openers, the Access Bank link) via
  event delegation — it does not modify `app.js` or `access-bank.js`, so
  if this script ever breaks, the app itself is unaffected. Sends events
  with `navigator.sendBeacon`.
- **`track.php`** (repo root) — receives events, validates the event
  `type` against an allowlist, and appends one JSON line per event to
  `analytics-data/events-YYYY-MM.jsonl` (rotated monthly).
- **`analytics-data/`** — the raw logs. Ships with its own `.htaccess`
  (`Require all denied`) so the `.jsonl` files can never be requested
  directly over HTTP — PHP can still read/write them via the filesystem,
  which that rule doesn't affect. The actual `.jsonl` files are
  git-ignored; only the `.htaccess` and a `.gitkeep` are tracked.
- **`dashboard/stats.php`** — reads the log files and returns an
  aggregate JSON summary (pageviews, unique sessions, top states/estates,
  filter usage, financing engagement, device mix).
- **`dashboard/index.html`** + **`dashboard/dashboard.js`** — the summary
  view. Fetches `../api/estates.php` client-side only to resolve estate
  IDs to names for display — falls back to showing raw IDs if that
  fetch fails, rather than breaking the whole dashboard.

**Before this data is private, password-protect the `/dashboard/` folder
on the live server** — this is a one-time manual step in **cPanel → Security
→ Directory Privacy**, applied directly to `/public_html/dashboard/`. Do
this on the server itself, not in the repo: an `.htpasswd` file must never
be committed to git. CI/CD deploys won't touch or remove a
server-created `.htaccess`/`.htpasswd` in that folder on future pushes,
since the deploy only uploads/updates what's in the repo and doesn't
delete extra files on the server. `robots.txt` also disallows
`/dashboard/` and `/analytics-data/` as a second layer, and
`dashboard/index.html` sets `<meta name="robots" content="noindex, nofollow">`.

**Privacy by design**: no IP address, no user-agent string, and no
persistent cross-session identifier is ever stored. The session id is
random and lives only in `sessionStorage` (resets each browser session).
Adding a new tracked event: add its type string to the `$allowedTypes`
allowlist in `track.php`, add a `track(...)` call (or a new delegated
listener) in `analytics.js`, then add an aggregation case in `stats.php`
and a render call in `dashboard.js`.

## Production essentials

- **SEO/meta**: title, description, `robots` meta, canonical URL, Open
  Graph + Twitter Card tags (social link previews use `assets/og-image.png`),
  and a `WebSite` JSON-LD block.
- **`robots.txt`** — allows all crawlers, points to `sitemap.xml`.
- **`sitemap.xml`** — single-entry (this is a one-page app); update
  `<lastmod>` when content changes meaningfully.
- **`404.html`** — branded error page, set via `.htaccess` `ErrorDocument`.
- **`.htaccess`** — gzip/deflate compression, browser caching headers,
  security headers (`X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`, `Permissions-Policy`), directory-listing disabled.
  HTTPS-forcing redirect is present but commented out — see the SSL note
  above.
- **Cache-busting**: `.htaccess` caches CSS/JS for a week client-side, so
  every local `.css`/`.js` reference (in `index.html`, `access-bank.html`,
  `dashboard/index.html`) carries a `?v=YYYYMMDD` query string. **Bump it
  to today's date whenever you edit `styles.css`, `app.js`, `data.js`,
  `infrastructure.js`, `analytics.js`, `access-bank.js`,
  `access-bank-data.js`, or `dashboard.js`** — otherwise visitors with an
  already-cached copy won't see the change for up to a week. `index.html`
  itself isn't cached (`text/html` is `access plus 0 seconds`), so this is
  the only place staleness can hide.
- **Icons**: inline SVG favicon (primary) plus `assets/favicon-32.png` and
  `assets/apple-touch-icon.png` fallbacks for browsers/devices that don't
  support SVG favicons.
- **Responsive**: two breakpoints. At ≤1024px (tablet + phone), the
  toolbar, financing banner, and infrastructure control collapse into a
  compact action bar (`Filters` / `Financing` / `Infrastructure`) that
  opens each as a bottom sheet, reusing the same underlying elements and
  `app.js` logic rather than duplicating them. At ≤860px, the layout also
  stacks the sidebar below the map with a map/list toggle. Verified at
  320/360/390px (phone), 900px (tablet), and 1440px (desktop).

## Files

- `index.html` — page structure
- `styles.css` — design tokens + layout
- `app.js` — map/list/filter logic, fetches estate data from `api/estates.php`
- `data.js` — frozen historical snapshot of the original estate records;
  no longer read at runtime, kept as the seed input for
  `scripts/dump-data-js.js` (see Backend / database above)
- `infrastructure.js` — railway/road overlay records (still static)
- `data.md` — original human-readable working notes and source list
- `api/` — PHP backend: `estates.php` (public read endpoint),
  `_db.php`/`_lib.php` (shared helpers), `config.example.php` (committed
  template — real `config.php` is gitignored and created on the server)
- `db/migrations/` — Postgres schema (one file covers every backend phase)
- `scripts/` — one-time `data.js` → Postgres migration tooling (CLI-only,
  blocked from HTTP access)
- `robots.txt`, `sitemap.xml`, `404.html`, `.htaccess` — production/SEO config
- `assets/` — favicons and social share image
- `access-bank.html`, `access-bank-data.js`, `access-bank.js` — standalone Access Bank financing page
- `track.php`, `analytics.js`, `analytics-data/` — self-hosted event logging (see Analytics section above)
- `dashboard/` — password-protect this folder on the server; the analytics summary view
