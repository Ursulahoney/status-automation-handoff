import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

CONFIG = json.loads(Path("config/report_config.json").read_text())
INCIDENTS = json.loads(Path("data/incidents.json").read_text())

now_local = datetime.now()  # BUG: local naive time, not timezone-aware
cutoff = now_local - timedelta(days=7)

active = []
resolved = []

for inc in INCIDENTS:
  status = inc.get("status")
  start = inc.get("start_time", "")
  end = inc.get("end_time")

  # BUG: compares ISO strings to datetime logic later (mixed types)
  if status != "resolved":
    active.append(inc)
  else:
    if end and end > cutoff.isoformat():
      resolved.append(inc)

out_json = {
  "generated_at": datetime.now(timezone.utc).isoformat(),
  "active_incidents": active,
  "resolved_last_7_days": resolved
}

Path("public/status.json").write_text(json.dumps(out_json, indent=2))

items = active[:CONFIG["max_items_on_homepage"]]

html_items = []
for inc in items:
  html_items.append(f"<li><b>{inc['severity'].upper()}</b> {inc['title']}</li>")

block = "<ul>" + "".join(html_items) + "</ul>" if html_items else "<p>No active incidents.</p>"

html = Path("public/status.html").read_text()
start_marker = "<!-- GENERATED_CONTENT_START -->"
end_marker = "<!-- GENERATED_CONTENT_END -->"

before, rest = html.split(start_marker, 1)
_, after = rest.split(end_marker, 1)

Path("public/status.html").write_text(before + start_marker + "\n" + block + "\n" + end_marker + after)
