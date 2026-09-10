# linkedin-scraper

Portable zero-cost B2B legal lead-generation and outreach core for Egypt.

Architecture: UI-agnostic core first, so the same lead model can power the current web UI and a future Android client.

Pipeline: permitted discovery/import -> normalization -> dedupe -> qualification -> personalized draft -> human review -> permission-gated send -> exact sent archive -> reply tracking -> follow-up -> pipeline analytics.

## Discovery and compliance

The engine accepts explicit permitted sources only: company website, business directory, referral, public company page, manual entry, or consented import. Arabic source labels are normalized to the internal source codes.

The project does not automate unauthorized LinkedIn scraping, bypass LinkedIn controls, or automate LinkedIn messaging. A LinkedIn URL may be stored as a lead/source field when obtained through a permitted method.

Direct electronic marketing is permission-gated. The lead record keeps permission, permission source, permission timestamp, opt-out state, and sent-message evidence. A lead cannot be sent when permission is not `YES`, when it is opted out, or when it has already been sent.

## Current workflow controls

- JSON and CSV import/export
- Source normalization and candidate validation
- Duplicate prevention by case-insensitive email or LinkedIn URL
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
