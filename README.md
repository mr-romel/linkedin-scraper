# linkedin-scraper

Portable zero-cost lead-generation core for Egyptian B2B legal outreach.

Architecture: UI-agnostic core first, so a web UI, Google Sheets adapter, or Android app can use the same lead model and workflow.

Flow: discovery/import -> qualification -> draft -> human review -> permitted send -> sent archive -> follow-up.

This project does not automate unauthorized LinkedIn scraping or bypass LinkedIn controls. LinkedIn is a discovery/source field; lead data must be imported or collected through permitted means.

Code budget: under 300 lines of executable source code. Freeze every successful stage before adding the next feature.
