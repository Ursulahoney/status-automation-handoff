import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

CONFIG = json.loads(Path("config/report_config.json").read_text())
INCIDENTS = json.loads(Path("data/incidents.json").read_text())

now_local = datetime.now()
cutoff = now_local - timedelta(days=7)

active = []
resolved = []

for inc in INCIDENTS:
  status = inc.get("status", "").strip().lower()
  if status == "resolved":
    resolved.append(inc)
  else:
    active.append(inc)

def end_after_cutoff(inc):
  end = (inc.get("end_time") or "").strip()
  if not end:
    return False
  return end > cutoff.isoformat()

resolved_last_7 = [inc for inc in resolved if end_after_cutoff(inc)]

out = {
  "generated_at": datetime.now(timezone.utc).isoformat(),
  "active_incidents": active,
  "resolved_last_7_days": resolved_last_7,
}

Path("public/status.json").write_text(json.dumps(out, indent=2) + "\n")

html_path = Path("public/status.html")
html = html_path.read_text()

start_marker = "<!-- GENERATED_CONTENT_START -->"
end_marker = "<!-- GENERATED_CONTENT_END -->"

start = html.find(start_marker)
end = html.find(end_marker)

if start == -1 or end == -1 or end < start:
  raise SystemExit("Markers not found in public/status.html")

items = []
for inc in active:
  sev = (inc.get("severity") or "").upper()
  title = (inc.get("title") or "")
  items.append(f"<li><b>{sev}</b> {title}</li>")

generated = "<ul>" + "".join(items) + "</ul>" if items else "<p>No active incidents.</p>"

new_html = (
  html[: start + len(start_marker)]
  + "\n"
  + generated
  + "\n"
  + html[end:]
)

html_path.write_text(new_html)
