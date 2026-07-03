// Fetches the latest register data and bakes it into data.json for the static site.
// Run with: node build.js   (from inside the farage-web folder)
const fs = require("fs");
const path = require("path");
const { fetchAllInterests, processInterests } = require("./farage-register");

(async () => {
  console.log("Fetching Nigel Farage's register of interests...");
  const items = await fetchAllInterests();
  const data = { ...processInterests(items), fetchedAt: new Date().toISOString() };
  fs.writeFileSync(path.join(__dirname, "data.json"), JSON.stringify(data));
  console.log(`Done: ${data.payments.length} payments, ${data.gifts.length} gifts, ${data.visits.length} visits, ${data.agreements.length} ongoing agreements written to data.json`);
})().catch(e => { console.error("Failed:", e.message); process.exit(1); });
