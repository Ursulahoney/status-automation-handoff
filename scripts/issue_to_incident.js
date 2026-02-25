const fs = require("fs");

function getField(body, label) {
  const re = new RegExp(`###\\s*${label}\\s*\\n([\\s\\S]*?)(?=\\n###\\s|$)`, "i");
  const m = body.match(re);
  return m ? m[1].trim() : "";
}

const body = process.env.ISSUE_BODY || "";
const issueNumber = Number(process.env.ISSUE_NUMBER || "0");

const title = getField(body, "Title");
const severity = getField(body, "Severity");
const status = getField(body, "Status");
const start_time = getField(body, "Start time");
const end_time = getField(body, "End time");
const servicesRaw = getField(body, "Services");

if (!title || !severity || !status || !start_time) {
  console.error("Missing required fields.");
  process.exit(1);
}

const services = servicesRaw
  ? servicesRaw.split(",").map(s => s.trim()).filter(Boolean)
  : [];

const incident = {
  id: `INC-${1000 + issueNumber}`,
  issue_number: issueNumber,
  title,
  severity,
  status,
  start_time,
  end_time: end_time || null,
  services,
  updates: [
    { time: new Date().toISOString(), message: "Incident created from GitHub issue." }
  ]
};

const path = "data/incidents.json";
const raw = fs.readFileSync(path, "utf8");
const incidents = JSON.parse(raw);

// BUG: if same issue_number exists, replace entire file with only this incident (data loss)
const filtered = incidents.filter(i => i.issue_number !== issueNumber);
filtered.push(incident);

// BUG: no locking; writes whole file
fs.writeFileSync(path, JSON.stringify(filtered, null, 2));
console.log("Updated incidents.json");
