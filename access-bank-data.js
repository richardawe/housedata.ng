// Access Bank mortgage products — compiled from Access Bank's public site,
// July 2026. housedata.ng is not affiliated with Access Bank; this is an
// informational summary, not an application channel. Verify current
// rates and terms directly with the bank before applying.

const ACCESS_BANK = {
  disclaimer: "housedata.ng is not affiliated with Access Bank. Figures below are compiled from Access Bank's public site (accessbankplc.com) as of July 2026 — verify current rates and terms directly with the bank before applying.",
  applyUrl: "https://www.accessbankplc.com/corporate/loans/access-mortgage-advantage",
  mreifChannelUrl: "https://www.accessbankplc.com/personal/borrowing/home-loan/access-mreif-mortgage-scheme",
  contact: { phone: "0201 280 2500 / 07003000000", website: "https://www.accessbankplc.com/corporate/loans/access-mortgage-advantage" },
  eligibility: [
    "Employed or self-employed, with verifiable income (Nigerian or foreign)",
    "Diaspora applicants eligible for the Outbound Diaspora Mortgage",
    "Maximum active work-life age: 65",
    "Property must be free from encumbrance",
    "Joint mortgage option: spouse, child, parent, or sibling as co-applicant"
  ],
  facilityLimits: {
    individual: "₦500,000,000",
    corporate: "₦5,000,000,000",
    maxTenorYears: 30,
    maxTenorNote: "up to 30 years on certain facilities — not all products",
    maxAge: 65
  },
  products: [
    {
      id: "first-home",
      name: "My First Home Mortgage Savings Plan",
      rate: 15,
      rateKnown: true,
      equityPct: 20,
      mechanic: "Save 20% equity monthly over 24 months. Once savings are complete, a mortgage covering the remaining 80% becomes available at 15% p.a. (subject to market trends).",
      calculatorEnabled: true
    },
    {
      id: "easy-home",
      name: "Easy Home Mortgage",
      rate: null,
      rateKnown: false,
      equityPct: 20,
      mechanic: "Standard mortgage plan for employed and self-employed persons, minimum 20% equity.",
      calculatorEnabled: false
    },
    {
      id: "off-plan",
      name: "Off-Plan Mortgage",
      rate: null,
      rateKnown: false,
      equityPct: null,
      mechanic: "Finances construction or completion of a property in milestones, for Access Bank-approved projects only.",
      calculatorEnabled: false
    },
    {
      id: "home-equity",
      name: "Home Equity Loan",
      rate: null,
      rateKnown: false,
      equityPct: null,
      mechanic: "Access up to 50% of a home's Forced Sale Value for refinancing, business expansion, or personal needs — not a purchase mortgage.",
      calculatorEnabled: false
    },
    {
      id: "rsa-backed",
      name: "RSA-Backed Mortgage",
      rate: null,
      rateKnown: false,
      equityPct: null,
      mechanic: "Pension (RSA) contributors can access up to 25% of their RSA balance toward a residential property purchase.",
      calculatorEnabled: false
    }
  ],
  otherProducts: [
    { name: "Outbound Diaspora Mortgage", note: "For C-suite/senior management purchasing residential property abroad — not applicable to the Nigerian estates listed on housedata.ng." },
    { name: "Direct Commercial Mortgage", note: "Commercial real estate acquisition, loan-to-value up to 70%." },
    { name: "Commercial Equity Release", note: "Access up to 50% of a commercial property's Forced Sale Value." }
  ]
};
