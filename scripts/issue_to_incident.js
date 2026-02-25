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
const startTime = getField(body, "Start time");
const endTime = getField(body, "End time");
const servicesRaw = getField(body, "Services");

const services = servicesRaw
  ? servicesRaw.split(",").map((s) => s.trim()).filter(Boolean)
  : [];

if (!issueNumber || !title || !severity || !status || !startTime) {
  console.error("Missing required fields");
  process.exit(1);
}

const dataPath = "data/incidents.json";
const incidents = JSON.parse(fs.readFileSync(dataPath, "utf8"));

const nextIdNum =
  incidents.reduce((max, inc) => {
    const m = String(inc.id || "").match(/^INC-(\d+)$/);
    const n = m ? Number(m[1]) : 0;
    return Math.max(max, n);
  }, 1000) + 1;

const id = `INC-${nextIdNum}`;

const incident = {
  id,
  issue_number: issueNumber,
  title,
  severity,
  status,
  start_time: startTime,
  end_time: endTime || null,
  services,
  updates: [
    {
      time: new Date().toISOString(),
      message: "Incident created from GitHub issue.",
    },
  ],
};

const updated = incidents.filter((x) => x.issue_number !== issueNumber);
updated.push(incident);

fs.writeFileSync(dataPath, JSON.stringify(updated, null, 2) + "\n");
console.log(`Wrote incident ${id} from issue #${issueNumber}`);
