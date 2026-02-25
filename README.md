# Status Automation Tool

This repo turns GitHub issues labeled `incident` into a public status page.

Flow:
- Create/edit an issue using the incident template.
- Add label: `incident`.
- Workflow updates `data/incidents.json`.
- Another workflow builds `public/status.html` and `public/status.json`.

The workflows commit generated files back to `main`.
