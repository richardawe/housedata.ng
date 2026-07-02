# Housedata.ng — Lagos Government Housing Estates

A single-page map of Lagos government housing estates, built as a demo for a
pitch to the Lagos State Ministry of Housing. Plain HTML/CSS/JS, no build
step, no API keys — Leaflet.js + OpenStreetMap tiles for the map.

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

## Deploying to GitHub Pages

This is a static site with no build step, so Pages can serve it directly:

1. Push this repo (or this branch, merged to your default branch) to GitHub.
2. In the repo, go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, pick the
   branch (e.g. `main`) and folder **/ (root)**, then save.
4. GitHub publishes it at `https://<username>.github.io/<repo>/` within a
   minute or two.

All asset paths in `index.html` are relative, so it works whether the site
is served from a domain root or a `/<repo>/` subpath. A `.nojekyll` file is
included so GitHub Pages serves the files as-is without running them
through Jekyll first.

## Data status — read before presenting

1. **The estate data is compiled from public sources, not verified
   government records.** `data.md` lists the original working notes and
   per-estate source (Ballers.ng, Propsult, Estate Intel, NPC, Wikipedia,
   etc.). Coordinates in `data.js` are neighbourhood-level approximations
   geocoded from place names — good enough for a map pin, not for a
   physical address. Verify before publishing this as authoritative.
2. **Per-estate contacts are agency-level placeholders**, not verified
   direct lines for individual estates. Every estate routes enquiries to
   whichever agency plausibly manages it (Lagos HOMS, LSDPC, or the
   Ministry of Housing), using only publicly listed agency contacts — no
   phone number or email was invented for any estate. This gap is called
   out in the UI (marker popups + footer) intentionally: it's the problem
   Housedata.ng would exist to fix, with real ministry data access.

## Adding or editing an estate

All estate records live in `data.js`, as a flat array (`ESTATES`) of plain
objects. To add one, copy an existing entry and fill in:

```js
{
  id: "unique-slug",
  name: "Estate Name",
  lat: 6.5000, lng: 3.5000,     // neighbourhood-level is fine
  area: "Neighbourhood, District",
  lga: "Local Government Area",
  unitTypes: "1, 2, 3 bed flats",
  status: "Completed",          // "Completed" | "Announced" | "Planned" | "In Progress"
  units: "84 units",            // or null if unknown
  agency: AGENCIES.HOMS.name,   // or LSDPC / MINISTRY / FMHUD
  enquiryContact: AGENCIES.HOMS,
  sourceNote: "Source: ... — publicly reported, verify before publishing."
}
```

Reuse one of the `AGENCIES` entries at the top of `data.js` for
`enquiryContact` rather than inventing a new phone/email — if the agency
contact isn't already there, add it to `AGENCIES` once (with a real,
citable source) rather than hardcoding it per estate.

Map markers, the sidebar list, filters (status + LGA), and popups all read
from this one array — no other file needs to change to add a row.

## Files

- `index.html` — page structure
- `styles.css` — design tokens + layout
- `data.js` — estate records (edit this to update data)
- `app.js` — map/list/filter logic
- `data.md` — original human-readable working notes and source list
