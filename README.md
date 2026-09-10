# linkedin-scraper

Portable zero-cost lead-generation core for Egyptian B2B legal outreach.

Architecture: UI-agnostic core first, so a web UI, Google Sheets adapter, or Android app can use the same lead model and workflow.

Flow: discovery/import -> qualification -> draft -> human review -> permitted send -> sent archive -> follow-up.

This project does not automate unauthorized LinkedIn scraping or bypass LinkedIn controls. LinkedIn is a discovery/source field; lead data must be imported or collected through permitted means.

Code budget: under 300 lines of executable source code. Freeze every successful stage before adding the next feature.

## Gmail transport setup

The repository contains a Google Apps Script transport in `Code.gs`. It uses the Gmail Advanced Service and returns the real Gmail Message ID after a successful send.

1. Create/open a Google Apps Script project and add `Code.gs` plus `appsscript.json` from this repository.
2. In the Apps Script project, enable the Gmail API under Services. If Google asks for the linked Google Cloud project API, enable Gmail API there as well.
3. Deploy as a Web app. Execute as the account that owns the sending mailbox and choose the access setting appropriate to the account and deployment. Do not place passwords, API keys, or OAuth tokens in this repository.
4. Copy the deployed Web App URL into the PWA using `إعداد رابط الإرسال`.
5. Before any batch, create one test Lead with an address you control, set Marketing Permission to `YES`, generate its draft, and send only that one Lead.
6. Confirm that the Gmail message arrived and that the Lead was archived as `Sent` with a Message ID. Only then use batches up to 5.

The browser UI cannot safely hold Gmail credentials. The PWA sends only the permitted Lead payload to the server-side Apps Script transport. The server enforces permission, required fields, a send lock, and duplicate-send protection.

Important: deployment of the Apps Script Web App and enabling Gmail API are external Google-side steps; GitHub cannot perform those account-level actions. The code and manifest are versioned here so the transport remains reproducible and Android-ready.
