# Housedata.ng — Nigeria Government & Private Housing Estates

A single-page map of government and private housing estates across Nigeria,
built as a demo/pitch tool. Currently covers Lagos, FCT (Abuja), Rivers,
Ogun, Kano, and Enugu — 129 estates across 6 states — expanding state by
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

## Files

- `index.html` — page structure
- `styles.css` — design tokens + layout
- `data.js` — estate records (edit this to update data)
- `app.js` — map/list/filter logic
- `data.md` — original human-readable working notes and source list
