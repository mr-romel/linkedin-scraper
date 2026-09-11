# linkedin-scraper

Portable zero-cost B2B legal lead-generation and outreach core for Egypt.

Architecture: UI-agnostic core first, so the same lead model can power the current web UI and a future Android client.

Pipeline: permitted discovery/import -> LinkedIn public discovery -> normalization -> dedupe -> qualification -> personalized draft -> human review -> permission-gated send -> exact sent archive -> reply tracking -> follow-up -> pipeline analytics.

## LinkedIn decision-maker discovery

The repository now includes a dedicated public LinkedIn discovery engine in `linkedin_public_discovery.js`.

It generates targeted public-search queries for Egypt and looks for public LinkedIn profile URLs matching decision-maker roles such as CEO, Founder, Co-Founder, Owner, Managing Director, General Manager, Chairman, Partner, COO, CFO, HR, Legal and Procurement leadership. It can combine these roles with target industries such as manufacturing, technology, healthcare, construction, trading, logistics, real estate, food and services.

`run_linkedin_discovery.mjs` exports ranked candidates to:

- `artifacts/linkedin-decision-makers.json`
- `artifacts/linkedin-decision-makers.csv`

The scheduled workflow is `.github/workflows/linkedin-public-discovery.yml`. It runs on weekdays and can also be started manually with a configurable lead limit and search engine.

This module is intentionally public-search-only: it does not log into LinkedIn, bypass controls, automate LinkedIn messaging, or evade access restrictions. It is designed to discover public profile URLs and rank them for the legal lead pipeline.

## Discovery and compliance

The engine accepts explicit permitted sources only: company website, business directory, referral, public company page, manual entry, consented import, or public-search discovery. Arabic source labels are normalized to the internal source codes.

Direct electronic marketing is permission-gated. The lead record keeps permission, permission source, permission timestamp, opt-out state, and sent-message evidence. A lead cannot be sent when permission is not `YES`, when it is opted out, or when it has already been sent.

## Current workflow controls

- JSON and CSV import/export
- Public LinkedIn decision-maker discovery
- Role + industry query generation
- LinkedIn URL deduplication
- Discovery Score and Qualification Score
- Automatic qualification queue
- Personalized legal outreach draft generation
- Human-review state before sending
- Send lock and Message ID requirement
- Individual messages with a maximum batch of 5
- Exact sent subject/body archive
- Reply recording
- Follow-up due queue
- Pipeline dashboard and funnel metrics
- Next-send-batch selector

## Gmail transport

`Code.gs` is a separate Google Apps Script transport. The browser never receives or stores the mailbox password. The PWA sends only the permitted lead payload to the deployed Web App, and the server returns a Gmail Message ID after a successful send.

Deploy the Apps Script Web App using the repository's `Code.gs` and `appsscript.json`, then place its Web App URL into the PWA through `إعداد رابط الإرسال`. Account-level deployment and authorization remain Google-side operations.

## Operating rule

Discovery can collect candidates, but sending is never automatic merely because a candidate exists. The operator reviews the lead, confirms the legal outreach draft, verifies Marketing Permission, and then sends a small batch. Successful sends are archived with their Message ID for traceability.
