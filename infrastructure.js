// Major infrastructure — railways and roads — near housedata.ng's covered
// states. Compiled from public news/government/engineering-press sources.
// Routes are corridor-level approximations built from named waypoints
// (city/town centres), not surveyed engineering alignments — good enough
// to show "does a rail/road corridor pass near this estate," not for
// construction planning.
//
// status: "Existing" (operating/in use) | "Under Construction" |
//   "Stalled" (construction started, currently suspended) | "Planned"
//   (announced/illustrative corridor, ground not yet broken on this segment)

const INFRASTRUCTURE = [
  // ------------------------------- Railways -------------------------------
  {
    id: "rail-lagos-ibadan",
    name: "Lagos–Ibadan Standard Gauge Railway",
    category: "Railway",
    status: "Existing",
    states: ["Lagos", "Ogun"],
    path: [
      [6.4780, 3.3850], [6.6155, 3.3238], [6.6450, 3.2750],
      [6.8900, 3.3600], [6.9600, 3.3800], [7.1475, 3.3619],
      [7.2500, 3.7500], [7.3200, 3.7900], [7.3775, 3.9470]
    ],
    description: "157 km double-track standard gauge line, first of its kind in West Africa. Opened June 2021, max speed 150 km/h. Runs Iddo (Lagos) → Agbado → Papalanto → Abeokuta (Ogun) → Ibadan.",
    sourceNote: "Source: Wikivoyage, Rail Journal — verify before publishing."
  },
  {
    id: "rail-lagos-blue-line",
    name: "Lagos Rail Mass Transit — Blue Line",
    category: "Railway",
    status: "Existing",
    states: ["Lagos"],
    path: [
      [6.4600, 3.2350], [6.4650, 3.2550], [6.4600, 3.2750],
      [6.4670, 3.2850], [6.4590, 3.3260], [6.4650, 3.3400],
      [6.4730, 3.3720], [6.4520, 3.3960]
    ],
    description: "27 km line, Lagos-only. Phase 1 (Marina–Mile 2) operational since Sept 2023. Phase 2 (Mile 2–Okokomaiko) targeted for infrastructure completion end-2026, passenger service ~Q1 2027.",
    sourceNote: "Source: LAMATA, Wikipedia — verify before publishing."
  },
  {
    id: "rail-lagos-red-line",
    name: "Lagos Rail Mass Transit — Red Line",
    category: "Railway",
    status: "Existing",
    states: ["Lagos"],
    path: [
      [6.6450, 3.2750], [6.6350, 3.3050], [6.6155, 3.3238],
      [6.6018, 3.3515], [6.5550, 3.3480], [6.5330, 3.3550],
      [6.5100, 3.3750], [6.4850, 3.3800]
    ],
    description: "27 km first phase, 8 stations, Lagos-only. Ceremonially inaugurated Feb 2024; regular commercial passenger service began Oct 2024 after repeated delays.",
    sourceNote: "Source: Wikipedia, Punch — verify before publishing."
  },
  {
    id: "rail-abuja-kaduna",
    name: "Abuja–Kaduna Standard Gauge Railway",
    category: "Railway",
    status: "Existing",
    states: ["FCT"],
    path: [
      [9.0850, 7.3550], [9.4500, 7.4000], [9.9000, 7.5200], [10.5105, 7.4165]
    ],
    description: "186 km single standard-gauge line, opened July 2016, ~2hr trip. FCT terminus at Idu, which also links to Abuja Light Rail and is envisioned as part of a future Lagos–Kano trunk line.",
    sourceNote: "Source: Railway Technology, Railway Gazette — verify before publishing."
  },
  {
    id: "rail-abuja-light-yellow",
    name: "Abuja Light Rail — Yellow Line",
    category: "Railway",
    status: "Existing",
    states: ["FCT"],
    path: [
      [9.0579, 7.4951], [9.0350, 7.4650], [9.0700, 7.4100],
      [9.0600, 7.3800], [9.0850, 7.3550], [9.0950, 7.3300], [8.9990, 7.2630]
    ],
    description: "Abuja Metro (CBD) → Stadium → Kukwaba → Wupa → Idu → Bassanjiwa → Nnamdi Azikiwe International Airport. Resumed service May 2024 after a COVID-era suspension.",
    sourceNote: "Source: Railway Technology, SabiAbuja — verify before publishing."
  },
  {
    id: "rail-abuja-light-blue",
    name: "Abuja Light Rail — Blue Line",
    category: "Railway",
    status: "Existing",
    states: ["FCT"],
    path: [
      [9.0850, 7.3550], [9.1100, 7.3200], [9.1200, 7.2700], [9.1400, 7.3000], [9.1580, 7.3320]
    ],
    description: "Idu → Gwagwa → Dei-Dei → Kagini → Gbazango (Kubwa). Interchanges with the Abuja–Kaduna line and Yellow Line at Idu. 42.5 km total across both lines, 12 stations.",
    sourceNote: "Source: Railway Technology, SabiAbuja — verify before publishing."
  },
  {
    id: "rail-kano-maradi",
    name: "Kano–Maradi Railway",
    category: "Railway",
    status: "Under Construction",
    states: ["Kano"],
    path: [
      [12.0022, 8.5920], [12.1000, 8.4500], [12.4500, 8.2700], [12.6500, 8.4100], [13.0900, 7.2300]
    ],
    description: "284 km, $1.9bn+ cross-border standard gauge line toward Maradi, Niger Republic, via Katsina and Jibia. ~60% complete as of 2025/2026; official delivery target has slipped from 2026 to December 2027 — treat timeline as contested.",
    sourceNote: "Source: Businessday, State House Abuja, PRNigeria — verify before publishing."
  },
  {
    id: "rail-kaduna-kano",
    name: "Kaduna–Kano Railway (Lagos–Kano trunk gap)",
    category: "Railway",
    status: "Under Construction",
    states: ["Kano"],
    path: [
      [10.5105, 7.4165], [11.0667, 7.7000], [12.0022, 8.5920]
    ],
    description: "203 km, $1.2bn segment, ~53% complete as of Sept 2025. This is the northernmost gap in the still-incomplete Lagos–Kano trunk line — the Ibadan–Kaduna middle section is not yet built, so continuous Lagos-to-Kano rail travel is not yet possible even once this segment finishes.",
    sourceNote: "Source: Vanguard, Channels TV — verify before publishing."
  },
  {
    id: "rail-ph-aba",
    name: "Port Harcourt–Aba Railway (Eastern Line)",
    category: "Railway",
    status: "Existing",
    states: ["Rivers"],
    path: [
      [4.8156, 7.0498], [5.1167, 7.3667]
    ],
    description: "Operational segment of the old Eastern narrow-gauge line, 5 days/week service, handed to the Nigerian Railway Corporation Nov 2024.",
    sourceNote: "Source: Construction Review Online — verify before publishing."
  },
  {
    id: "rail-aba-enugu",
    name: "Aba–Enugu Railway (Eastern Line)",
    category: "Railway",
    status: "Stalled",
    states: ["Enugu"],
    path: [
      [5.1167, 7.3667], [5.5250, 7.4890], [6.3800, 7.4600], [6.4413, 7.4988]
    ],
    description: "Part of a $3bn+ rehabilitation of the historic Eastern line toward Maiduguri. Reconstruction explicitly suspended as of July 2025; talks were held with Abia/Enugu governors in April 2025 to revive it — not currently active construction.",
    sourceNote: "Source: Vanguard — verify before publishing."
  },

  // --------------------------------- Roads ---------------------------------
  {
    id: "road-coastal-lagos-section1",
    name: "Lagos–Calabar Coastal Highway — Section 1 (Lagos)",
    category: "Road",
    status: "Existing",
    states: ["Lagos"],
    path: [
      [6.4270, 3.4210], [6.4400, 3.4700], [6.4650, 3.7800]
    ],
    description: "Victoria Island → Lekki → Eleko Junction, Ibeju-Lekki (~47 km). Temporarily opened to traffic Dec 2025; formal commissioning pushed to May 2026.",
    sourceNote: "Source: TheCable, Vanguard — verify before publishing."
  },
  {
    id: "road-coastal-planned",
    name: "Lagos–Calabar Coastal Highway — Planned Corridor",
    category: "Road",
    status: "Planned",
    states: ["Lagos", "Rivers"],
    path: [
      [6.4650, 3.7800], [6.1500, 4.8300], [5.5167, 5.7500],
      [4.9267, 6.2676], [4.4500, 7.1500], [4.6333, 7.9333], [4.9500, 8.3250]
    ],
    description: "Illustrative route only — the announced 700 km, 9-state corridor to Calabar via Ondo, Edo, Delta, Bayelsa, Rivers and Akwa Ibom. No confirmed construction has broken ground beyond Lagos's Section 1; full completion estimates range as late as 2031.",
    sourceNote: "Route is a straight-line approximation between named coastal towns, not a confirmed alignment. Source: Wikipedia, Construction Review Online — verify before publishing."
  },
  {
    id: "road-lagos-ibadan-expwy",
    name: "Lagos–Ibadan Expressway",
    category: "Road",
    status: "Existing",
    states: ["Lagos", "Ogun"],
    path: [
      [6.5750, 3.3800], [6.6350, 3.3700], [6.8100, 3.4450],
      [6.7900, 3.4550], [6.8480, 3.6490], [7.3775, 3.9470]
    ],
    description: "127.6 km, one of Africa's busiest highways (~250,000 vehicles/day). Reconstruction began 2013; sources disagree on whether it's now fully complete — treat as ongoing patch work rather than finished.",
    sourceNote: "Source: Wikipedia, NSIA, Punch — verify before publishing."
  },
  {
    id: "road-lekki-epe-expwy",
    name: "Lekki–Epe Expressway",
    category: "Road",
    status: "Existing",
    states: ["Lagos"],
    path: [
      [6.4300, 3.4300], [6.4675, 3.5711], [6.4590, 3.6270],
      [6.4620, 3.5900], [6.4550, 3.6650], [6.4650, 3.7800], [6.5835, 3.9836]
    ],
    description: "49.5 km toll expressway built in the 1980s, rehabilitated via a PPP (AfDB $85m loan, 2008). A further rehabilitation of failing stretches began Jan 2026.",
    sourceNote: "Source: Wikipedia, Vanguard — verify before publishing."
  },
  {
    id: "road-third-mainland",
    name: "Third Mainland Bridge",
    category: "Road",
    status: "Existing",
    states: ["Lagos"],
    path: [
      [6.5350, 3.3850], [6.5050, 3.3800], [6.4550, 3.3900]
    ],
    description: "11.8 km, the longest of Lagos's three island–mainland bridges. Built by Julius Berger, opened 1990.",
    sourceNote: "Source: Wikipedia — verify before publishing."
  },
  {
    id: "road-enugu-ph-expwy",
    name: "Enugu–Port Harcourt Expressway",
    category: "Road",
    status: "Under Construction",
    states: ["Enugu", "Rivers"],
    path: [
      [6.3800, 7.4600], [5.5250, 7.4890], [5.1167, 7.3667], [4.9500, 7.1500], [4.7850, 7.1150]
    ],
    description: "Directly connects two of our covered states. Length figures conflict across sources (41–214 km depending on what's counted). Contract dates to 2013; progress has been repeatedly delayed despite a 2025 government \"recommitment.\"",
    sourceNote: "Source: Wikipedia, Federal Ministry of Information, Punch — verify before publishing."
  },
  {
    id: "road-enugu-onitsha-expwy",
    name: "Enugu–Onitsha Expressway",
    category: "Road",
    status: "Under Construction",
    states: ["Enugu"],
    path: [
      [6.3800, 7.4600], [6.4700, 7.5300], [6.2100, 7.0700], [6.1667, 6.7833]
    ],
    description: "~107 km one-way dual carriageway. A 15 km stretch (Ninth Mile–Abakpa) opened for Easter traffic 2026; other stretches remain under construction with a repeatedly slipped completion target.",
    sourceNote: "Source: Punch, Vanguard, ThisDay — verify before publishing."
  },
  {
    id: "road-abuja-kaduna-kano",
    name: "Abuja–Kaduna–Zaria–Kano Road (dualization)",
    category: "Road",
    status: "Under Construction",
    states: ["FCT", "Kano"],
    path: [
      [9.0765, 7.3986], [10.5105, 7.4165], [11.0667, 7.7000], [12.0022, 8.5920]
    ],
    description: "~700 km existing single-carriageway federal road, in active use, now being dualized. First 118 km section completed by June 2026; remaining 164 km targeted for November 2026 — a date already revised from earlier 2026 commitments.",
    sourceNote: "Source: Vanguard, Channels TV, NSIA — verify before publishing."
  },
  {
    id: "road-east-west",
    name: "East-West Road (Niger Delta)",
    category: "Road",
    status: "Existing",
    states: ["Rivers"],
    path: [
      [5.5167, 5.7500], [4.9500, 6.4300], [5.0833, 6.6333],
      [5.0950, 6.8100], [4.9350, 6.8550], [4.8500, 6.9800], [4.7600, 7.1300]
    ],
    description: "675 km dual-carriageway meant to link the entire Niger Delta. Contract awarded 18+ years ago and still incomplete; the Rivers State stretch (Eleme-Onne, Tank/Rumuodara, Emohua, Elele-Alimini) is specifically flagged in ongoing reporting as badly degraded, not simply \"in use.\"",
    sourceNote: "Source: The Whistler, Guardian Nigeria, Daily Trust — verify before publishing."
  },
  {
    id: "road-kano-katsina",
    name: "Kano–Katsina Road (A9 dualization)",
    category: "Road",
    status: "Under Construction",
    states: ["Kano"],
    path: [
      [12.0700, 8.4600], [12.2270, 8.3550], [12.9908, 7.6018], [13.0900, 7.2300]
    ],
    description: "152.7 km federal A9 trunk road, existing single carriageway now undergoing dualization plus reconstruction of the original lane.",
    sourceNote: "Source: Federal Ministry of Works, Wikipedia — verify before publishing."
  }
];
