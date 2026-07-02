// Lagos Government Housing Estates — structured data
// Compiled from public news/government sources, July 2026. See data.md for the
// original working notes and per-row source attribution.
//
// Coordinates are neighborhood-level approximations (geocoded from place
// names), not verified street addresses. Good enough to place a pin on a
// map for a demo; not good enough to route a courier.

const AGENCIES = {
  HOMS: {
    name: "Lagos State Mortgage Board (Lagos HOMS)",
    phone: "07044519311 / 08124817363",
    email: "info@lagoshoms.gov.ng",
    website: "https://www.lagoshoms.gov.ng"
  },
  LSDPC: {
    name: "Lagos State Development and Property Corporation (LSDPC)",
    phone: null,
    email: null,
    website: "https://lsdpc.gov.ng"
  },
  MINISTRY: {
    name: "Lagos State Ministry of Housing",
    phone: null,
    email: null,
    website: "https://housing.lagosstate.gov.ng"
  },
  FMHUD: {
    name: "Federal Ministry of Housing & Urban Development (FMHUD)",
    phone: null,
    email: null,
    website: "https://fmhud.gov.ng"
  }
};

const ESTATES = [
  {
    id: "oba-adeboruwa",
    name: "Oba Adeboruwa Estate",
    lat: 6.6100, lng: 3.5150,
    area: "Igbogbo, Ikorodu",
    lga: "Ikorodu",
    unitTypes: "1, 2, 3 bed flats",
    status: "Completed",
    units: null,
    agency: AGENCIES.HOMS.name,
    enquiryContact: AGENCIES.HOMS,
    sourceNote: "Completed, rent-to-own available. Source: NPC, EleniyanCares — publicly reported, verify before publishing."
  },
  {
    id: "millennium-i",
    name: "Millennium Housing Scheme",
    lat: 6.6180, lng: 3.2980,
    area: "Iloro, Agege",
    lga: "Agege",
    unitTypes: "3 bed flats",
    status: "Completed",
    units: null,
    agency: AGENCIES.MINISTRY.name,
    enquiryContact: AGENCIES.MINISTRY,
    sourceNote: "Source: NPC — publicly reported, verify before publishing."
  },
  {
    id: "millennium-ii",
    name: "Millennium Housing Scheme II",
    lat: 6.6480, lng: 3.2870,
    area: "Ojokoro, Ijaiye",
    lga: "Ijaiye",
    unitTypes: "3 bed flats",
    status: "Completed",
    units: null,
    agency: AGENCIES.MINISTRY.name,
    enquiryContact: AGENCIES.MINISTRY,
    sourceNote: "Source: NPC — publicly reported, verify before publishing."
  },
  {
    id: "jubilee",
    name: "Jubilee Housing Estate",
    lat: 6.5900, lng: 3.9700,
    area: "Odoragunshin, Epe",
    lga: "Epe",
    unitTypes: "Room & parlour, 1 & 2 bed bungalows",
    status: "Completed",
    units: null,
    agency: AGENCIES.MINISTRY.name,
    enquiryContact: AGENCIES.MINISTRY,
    sourceNote: "Source: NPC — publicly reported, verify before publishing."
  },
  {
    id: "jakande-garden",
    name: "Jakande Garden Estate",
    lat: 6.5200, lng: 3.2270,
    area: "Igando",
    lga: "Alimosho",
    unitTypes: "Flats",
    status: "Completed",
    units: "492 units",
    agency: AGENCIES.LSDPC.name,
    enquiryContact: AGENCIES.LSDPC,
    sourceNote: "Source: Ballers.ng — publicly reported, verify before publishing."
  },
  {
    id: "iponri",
    name: "Iponri Estate",
    lat: 6.4931, lng: 3.3627,
    area: "Iponri",
    lga: "Surulere",
    unitTypes: "Various",
    status: "Completed",
    units: null,
    agency: AGENCIES.LSDPC.name,
    enquiryContact: AGENCIES.LSDPC,
    sourceNote: "Surulere / Lagos Island axis. Source: Ballers.ng — publicly reported, verify before publishing."
  },
  {
    id: "homs-ibeshe",
    name: "Lagos HOMS – Ibeshe",
    lat: 6.6330, lng: 3.5460,
    area: "Ibeshe, Ikorodu",
    lga: "Ikorodu",
    unitTypes: "Residential",
    status: "Completed",
    units: null,
    agency: AGENCIES.HOMS.name,
    enquiryContact: AGENCIES.HOMS,
    sourceNote: "Source: Estate Intel — publicly reported, verify before publishing."
  },
  {
    id: "homs-ajah",
    name: "Lagos HOMS Apartment – Ajah",
    lat: 6.4675, lng: 3.5711,
    area: "Mobile Estate Rd, Ajah",
    lga: "Eti-Osa",
    unitTypes: "1, 2, 3 bed",
    status: "Completed",
    units: "84 units",
    agency: AGENCIES.HOMS.name,
    enquiryContact: AGENCIES.HOMS,
    sourceNote: "Completed July 2020. Source: Estate Intel — publicly reported, verify before publishing."
  },
  {
    id: "igbogbo-iib",
    name: "Igbogbo IIB",
    lat: 6.6080, lng: 3.5190,
    area: "Igbogbo",
    lga: "Ikorodu",
    unitTypes: "1, 2, 3 bed",
    status: "Completed",
    units: null,
    agency: AGENCIES.HOMS.name,
    enquiryContact: AGENCIES.HOMS,
    sourceNote: "Source: EleniyanCares — publicly reported, verify before publishing."
  },
  {
    id: "sangotedo",
    name: "Sangotedo Scheme",
    lat: 6.4590, lng: 3.6270,
    area: "Sangotedo",
    lga: "Eti-Osa",
    unitTypes: "1, 2, 3 bed",
    status: "Completed",
    units: null,
    agency: AGENCIES.HOMS.name,
    enquiryContact: AGENCIES.HOMS,
    sourceNote: "Eti-Osa / Ajah axis. Source: EleniyanCares — publicly reported, verify before publishing."
  },
  {
    id: "ajara",
    name: "Ajara Estate",
    lat: 6.4130, lng: 2.8500,
    area: "Badagry",
    lga: "Badagry",
    unitTypes: "1 bed",
    status: "Completed",
    units: null,
    agency: AGENCIES.MINISTRY.name,
    enquiryContact: AGENCIES.MINISTRY,
    sourceNote: "Source: EleniyanCares — publicly reported, verify before publishing."
  },
  {
    id: "bayview",
    name: "Bayview Estate",
    lat: 6.4415, lng: 3.5090,
    area: "Ikate-Elegushi, Lekki",
    lga: "Eti-Osa",
    unitTypes: "Residential",
    status: "Completed",
    units: "100 units",
    agency: AGENCIES.MINISTRY.name,
    enquiryContact: AGENCIES.MINISTRY,
    sourceNote: "Opened by Gov. Sanwo-Olu. Source: Wikipedia — publicly reported, verify before publishing."
  },
  {
    id: "gbagada",
    name: "Gbagada Housing Estate",
    lat: 6.5535, lng: 3.3880,
    area: "Gbagada",
    lga: "Kosofe",
    unitTypes: "Mixed",
    status: "Completed",
    units: null,
    agency: AGENCIES.LSDPC.name,
    enquiryContact: AGENCIES.LSDPC,
    sourceNote: "Existing/established. Source: Propsult — publicly reported, verify before publishing."
  },
  {
    id: "ikorodu-scheme",
    name: "Ikorodu Housing Scheme",
    lat: 6.6018, lng: 3.5106,
    area: "Ikorodu",
    lga: "Ikorodu",
    unitTypes: "Mixed",
    status: "Completed",
    units: null,
    agency: AGENCIES.MINISTRY.name,
    enquiryContact: AGENCIES.MINISTRY,
    sourceNote: "Existing/established. Source: Propsult — publicly reported, verify before publishing."
  },
  {
    id: "alausa",
    name: "Alausa Housing Estate",
    lat: 6.6059, lng: 3.3491,
    area: "Alausa",
    lga: "Ikeja",
    unitTypes: "Mixed",
    status: "Completed",
    units: null,
    agency: AGENCIES.LSDPC.name,
    enquiryContact: AGENCIES.LSDPC,
    sourceNote: "Existing/established. Source: Propsult — publicly reported, verify before publishing."
  },
  {
    id: "lekki-agbowa",
    name: "Lekki Apartments (Agbowa)",
    lat: 6.6660, lng: 3.7280,
    area: "Agbowa-Sagamu Rd",
    lga: "Ikosi-Ejirin LCDA",
    unitTypes: "48x2 bed, 24x3 bed",
    status: "Completed",
    units: "72 units (8.22 hectares)",
    agency: AGENCIES.LSDPC.name,
    enquiryContact: AGENCIES.LSDPC,
    sourceNote: "Source: Propsult — publicly reported, verify before publishing."
  },
  {
    id: "satellite-town",
    name: "Satellite Town Estate",
    lat: 6.4633, lng: 3.2843,
    area: "Lagos-Badagry Expwy",
    lga: "Amuwo-Odofin",
    unitTypes: "Mixed",
    status: "Completed",
    units: null,
    agency: AGENCIES.LSDPC.name,
    enquiryContact: AGENCIES.LSDPC,
    sourceNote: "Long-established, older government estate. Source: NigerianQueries — publicly reported, verify before publishing."
  },
  {
    id: "new-homes-1250",
    name: "1,250 New Homes (multi-site)",
    lat: 6.6280, lng: 3.3460,
    area: "Multi-site: Igbogbo, Sangotedo, Iponri, Gbagada, Omole",
    lga: "Multiple LGAs",
    unitTypes: "Mixed, across 5 sites",
    status: "Announced",
    units: "1,250 units",
    agency: AGENCIES.MINISTRY.name,
    enquiryContact: AGENCIES.MINISTRY,
    sourceNote: "Announced May 2024, 6-month target. Pin marks approximate centre of a multi-site project — not a single address. Source: Ballers.ng — verify before publishing."
  },
  {
    id: "affordable-50bn",
    name: "₦50bn Affordable Housing Scheme",
    lat: 6.6059, lng: 3.3491,
    area: "State-wide",
    lga: "State-wide",
    unitTypes: "Mixed",
    status: "Announced",
    units: "10,000 homes (target 2026)",
    agency: AGENCIES.MINISTRY.name,
    enquiryContact: AGENCIES.MINISTRY,
    sourceNote: "Announced May 2025. Pin marks the Ministry of Housing HQ at Alausa as a symbolic location, not a project site. Source: Ballers.ng — verify before publishing."
  },
  {
    id: "renewed-hope-housing",
    name: "Renewed Hope Housing (Federal collab)",
    lat: 6.6270, lng: 3.2790,
    area: "Ipaja and Ibeju-Lekki",
    lga: "Alimosho / Ibeju-Lekki",
    unitTypes: "Mixed",
    status: "In Progress",
    units: "2,000+ units",
    agency: AGENCIES.FMHUD.name,
    enquiryContact: AGENCIES.FMHUD,
    sourceNote: "Federal-state collaboration; additional estates planned in Badagry and Epe. Pin marks the Ipaja site. Source: Ballers.ng — verify before publishing."
  },
  {
    id: "renewed-hope-city",
    name: "Renewed Hope City Project",
    lat: 6.4459, lng: 3.9370,
    area: "Ibeju-Lekki",
    lga: "Ibeju-Lekki",
    unitTypes: "Housing units",
    status: "In Progress",
    units: "2,000 units",
    agency: AGENCIES.FMHUD.name,
    enquiryContact: AGENCIES.FMHUD,
    sourceNote: "Construction ongoing; land provided by Lagos State. Source: FMHUD — verify before publishing."
  }
];
