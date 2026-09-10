# LinkedIn Scraper

Standalone lead-generation workspace for Mahmoud Khyrat's B2B legal outreach.

## Important
This project does **not** automate scraping, crawling, login automation, or bulk actions on LinkedIn. LinkedIn's terms prohibit unauthorized scraping/automated collection. LinkedIn is used only as a discovery/verification source; leads are entered/imported through lawful/manual methods.

## MVP
- Google Sheet as the lead database
- Lead status and permission tracking
- Personalized email draft generation from structured lead data
- Review before sending
- Individual Gmail sending with a small selected batch
- Exact sent subject/body and timestamp stored beside the lead
- Three service-package fields
- WhatsApp / LinkedIn / Facebook contact fields

## Code budget
Target: under 300 lines of executable code. The first implementation is intentionally small and dependency-free.

## Workflow
New → Qualified → Email Ready → Sent → Replied → Interested → Meeting → Proposal → Won/Lost

## Compliance gate
A lead cannot be sent by the tool unless `Marketing Permission` is marked `YES`. Keep the source and permission evidence with each lead.
