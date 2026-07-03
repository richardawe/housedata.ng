# Housedata.ng — Nigeria Government & Private Housing Estates

A single-page map of government and private housing estates across
Nigeria, live at [housedata.ng](https://housedata.ng/). Currently covers
12 states — Lagos, FCT (Abuja), Rivers, Ogun, Kano, Enugu, Ondo, Edo,
Delta, Bayelsa, Akwa Ibom, and Cross River (the full Lagos-Calabar Coastal
Highway corridor plus the original 6) — 220 estates — expanding state by
state. Plain HTML/CSS/JS, no build step, no API keys — Leaflet.js +
OpenStreetMap tiles for the map.

Each estate links to an in-app mortgage calculator (modal, using
[MREIF](https://www.mreif.com.ng/)'s published 9.75%-fixed terms as
defaults) and an "About MREIF" modal — both self-contained, no navigating
away. The calculator is an unofficial estimate only; actually applying
still happens on MREIF's own site (linked from both modals).
housedata.ng doesn't collect financial documents or claim any specific
estate is in MREIF's approved developer network.

## Running it

Open `index.html` directly in a browser, or serve the folder locally:

```
python3 -m http.server 8000
```

then visit `http://localhost:8000`. Map tiles require an internet
connection (OpenStreetMap); everything else (data, layout, filters) works
offline once the page has loaded once. Leaflet itself is vendored locally
under `vendor/leaflet/` (not loaded from a CDN), so the map still works
even on a flaky connection — only the tile images need live internet.

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
Deploy from a branch → root) as a fallback/staging preview — all asset
paths are relative, so it works from either a domain root or a
`/<repo>/` subpath. A `.nojekyll` file is included so Pages serves files
as-is without running them through Jekyll.

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
   MREIF's own developer-eligibility process — that flow isn't built yet.
4. **The MREIF financing link is informational only.** It routes to
   MREIF's real sign-up/pre-qualifier pages; housedata.ng doesn't verify
   which estates (if any) are in MREIF's approved developer network, and
   says so directly in the banner, every popup, and the footer.

## Adding or editing an estate

All estate records live in `data.js`, as a flat array (`ESTATES`) of plain
objects. To add one, copy an existing entry and fill in:

```js
{
  id: "unique-slug",
  name: "Estate Name",
  state: "Lagos",                // "Lagos" | "FCT" | "Rivers" | a new state
  type: "Government",            // "Government" | "Private"
  lat: 6.5000, lng: 3.5000,      // neighbourhood-level is fine
  area: "Neighbourhood, District",
  lga: "Local Government Area / Area Council",
  unitTypes: "1, 2, 3 bed flats",
  status: "Completed",           // "Completed" | "Announced" | "Planned" | "In Progress"
  units: "84 units",             // or null if unknown
  priceRange: null,              // e.g. "₦50M – ₦200M" for private estates, else null
  agency: AGENCIES.HOMS.name,    // or another AGENCIES entry, or a free-text developer name
  enquiryContact: AGENCIES.HOMS, // an AGENCIES entry, or { name, phone, email, website } for a private developer
  sourceNote: "Source: ... — publicly reported, verify before publishing."
}
```

Reuse one of the `AGENCIES` entries at the top of `data.js` for
`enquiryContact` on government estates rather than inventing a new
phone/email — if the agency isn't there yet, add it once (with a real,
citable source). For private estates, use the developer's own public
contact/website — leave `phone`/`email` as `null` if you can't verify one
rather than guessing.

To add a new state, just start adding estates with that `state` value —
the State filter, Area filter, and map bounds all populate dynamically
from whatever's in the array, no other file needs to change.

Map markers (circle = Government, diamond = Private, coloured by status),
the sidebar list, all filters (state, type, status, area), and popups all
read from this one array.

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
- **Icons**: inline SVG favicon (primary) plus `assets/favicon-32.png` and
  `assets/apple-touch-icon.png` fallbacks for browsers/devices that don't
  support SVG favicons.
- **Responsive**: single breakpoint at 860px switches from a two-pane
  desktop layout to a stacked mobile layout with a map/list toggle;
  verified at phone (390px), tablet (820px), and desktop (1440px) widths.

## Files

- `index.html` — page structure
- `styles.css` — design tokens + layout
- `data.js` — estate records (edit this to update data)
- `infrastructure.js` — railway/road overlay records
- `app.js` — map/list/filter logic
- `data.md` — original human-readable working notes and source list
- `robots.txt`, `sitemap.xml`, `404.html`, `.htaccess` — production/SEO config
- `assets/` — favicons and social share image
