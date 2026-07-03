// Shared: fetch + process Nigel Farage's Register of Members' Financial Interests
// Used by farage-server.js (live local dashboard) and farage-web/build.js (static site data)
const https = require("https");

const MEMBER_ID = 5091; // Nigel Farage, MP for Clacton
const API = "https://interests-api.parliament.uk/api/v1/Interests";

function get(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36" } }, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return get(res.headers.location).then(resolve).catch(reject);
      }
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => resolve(data));
    });
    req.on("error", reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error("timeout")); });
  });
}

async function fetchAllInterests() {
  const items = [];
  let skip = 0, total = Infinity;
  while (skip < total) {
    const page = JSON.parse(await get(`${API}?MemberId=${MEMBER_ID}&Take=20&Skip=${skip}`));
    total = page.totalResults;
    items.push(...page.items);
    skip += 20;
  }
  return items;
}

function field(item, name) {
  const f = item.fields.find(f => f.name === name);
  return f ? f.value : null;
}

function processInterests(items) {
  const parents = {};
  for (const it of items) if (it.parentInterestId == null) parents[it.id] = it;

  // Children grouped by parent (payments under a job, costs under a visit)
  const childrenOf = {};
  for (const it of items) {
    if (it.parentInterestId != null) {
      (childrenOf[it.parentInterestId] = childrenOf[it.parentInterestId] || []).push(it);
    }
  }

  const payments = [];   // employment & earnings
  const gifts = [];      // gifts, benefits, hospitality (UK + non-UK)
  const visits = [];     // visits outside the UK
  const agreements = []; // ongoing paid employment registered as regular remuneration, not itemised payments

  for (const it of items) {
    const cat = it.category.name;

    // Employment payments are children of an "Employment and earnings" parent
    if (it.parentInterestId != null && /Employment and earnings/i.test(cat)) {
      const parent = parents[it.parentInterestId];
      const value = parseFloat(field(it, "Value"));
      const date = field(it, "ReceivedDate");
      const regularity = field(it, "RegularityOfPayment");
      if (regularity && value && !date) {
        agreements.push({
          id: it.id,
          payer: parent ? (field(parent, "PayerName") || "Undisclosed") : "Undisclosed",
          role: parent ? (parent.summary || "").split(" - ")[0] : "",
          value,
          period: regularity,
          hours: parseFloat(field(it, "HoursWorked")) || null,
        });
        continue;
      }
      if (!value || !date) continue;
      const payerName = parent ? (field(parent, "PayerName") || "Undisclosed") : "Undisclosed";
      const role = parent ? (parent.summary || "").split(" - ")[0] : "";
      payments.push({
        id: it.id,
        date,
        value,
        payer: payerName,
        role,
        description: field(it, "PaymentDescription") || field(it, "JobTitle") || "",
        paymentType: field(it, "PaymentType") || "Monetary",
        hours: parseFloat(field(it, "HoursWorked")) || null,
        registered: it.registrationDate,
      });
      continue;
    }

    if (/Gifts/i.test(cat) && it.parentInterestId == null) {
      const value = parseFloat(field(it, "Value"));
      const date = field(it, "ReceivedDate") || field(it, "AcceptedDate");
      if (!date) continue;
      gifts.push({
        id: it.id,
        date,
        value: value || 0,
        donor: field(it, "DonorName") || "Undisclosed",
        donorStatus: field(it, "DonorStatus") || "",
        description: field(it, "PaymentDescription") || it.summary || "",
        overseas: /outside the UK/i.test(cat),
      });
      continue;
    }

    if (/Visits outside the UK/i.test(cat) && it.parentInterestId == null) {
      const kids = childrenOf[it.id] || [];
      let cost = parseFloat(field(it, "Value")) || 0;
      let donor = field(it, "DonorName") || "";
      for (const k of kids) {
        cost += parseFloat(field(k, "Value")) || 0;
        donor = donor || field(k, "DonorName") || "";
      }
      const start = field(it, "StartDate");
      if (!start) continue;
      visits.push({
        id: it.id,
        date: start,
        endDate: field(it, "EndDate") || start,
        value: cost,
        donor: donor || "Undisclosed",
        purpose: field(it, "Purpose") || "",
        destination: (it.summary.match(/visit to (.+?) between/i) || [])[1] || "",
      });
    }
  }

  payments.sort((a, b) => b.date.localeCompare(a.date));
  gifts.sort((a, b) => b.date.localeCompare(a.date));
  visits.sort((a, b) => b.date.localeCompare(a.date));
  return { payments, gifts, visits, agreements };
}

module.exports = { fetchAllInterests, processInterests };
