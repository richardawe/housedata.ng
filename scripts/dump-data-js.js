// One-time migration helper: data.js declares AGENCIES/ESTATES as plain JS
// (unquoted keys, comments) rather than JSON, so it can't be parsed with
// JSON.parse. This runs it in a sandboxed VM context, resolves each
// estate's enquiryContact back to the AGENCIES key it was assigned by
// reference (or keeps it as a standalone contact for private estates that
// don't use a shared agency), and writes clean JSON for
// scripts/import-data-js.php to consume.
//
// Node-only, run once locally: node scripts/dump-data-js.js
// Not a runtime dependency of the deployed site.

const vm = require("vm");
const fs = require("fs");
const path = require("path");

const repoRoot = path.join(__dirname, "..");
const source = fs.readFileSync(path.join(repoRoot, "data.js"), "utf8");

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: "data.js" });

const transform = `
  var __agenciesOut = {};
  for (var key in AGENCIES) {
    __agenciesOut[key] = AGENCIES[key];
  }

  var __estatesOut = ESTATES.map(function (e) {
    var agencyKey = null;
    for (var k in AGENCIES) {
      if (AGENCIES[k] === e.enquiryContact) { agencyKey = k; break; }
    }
    return {
      id: e.id,
      name: e.name,
      state: e.state,
      lga: e.lga,
      area: e.area,
      type: e.type,
      status: e.status,
      lat: e.lat,
      lng: e.lng,
      unitTypes: e.unitTypes,
      units: e.units,
      priceRange: e.priceRange,
      agencyKey: agencyKey,
      contact: agencyKey ? null : e.enquiryContact,
      sourceNote: e.sourceNote
    };
  });
`;
vm.runInContext(transform, sandbox, { filename: "transform.js" });

const agencies = sandbox.__agenciesOut;
const estates = sandbox.__estatesOut;

const unmatched = estates.filter(function (e) { return !e.agencyKey && !e.contact; });
if (unmatched.length) {
  console.error("Estates with neither an agency key nor a standalone contact:", unmatched.map(function (e) { return e.id; }));
  process.exit(1);
}

fs.writeFileSync(path.join(__dirname, "agencies.json"), JSON.stringify(agencies, null, 2));
fs.writeFileSync(path.join(__dirname, "estates.json"), JSON.stringify(estates, null, 2));

var govCount = estates.filter(function (e) { return e.type === "Government"; }).length;
var privCount = estates.filter(function (e) { return e.type === "Private"; }).length;

console.log(
  "Wrote " + Object.keys(agencies).length + " agencies and " + estates.length +
  " estates (" + govCount + " Government / " + privCount + " Private) to scripts/*.json"
);
