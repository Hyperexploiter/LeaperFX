# Project Pricing & Estimation — Currency Exchange Dashboard (Leaper‑Fx Style)

Last updated: 2025‑08‑21
Audience: Undergraduate team estimating work for a small currency exchange store owner.

This document provides practical pricing ranges, scope assumptions, hour estimates, timelines, and ongoing costs for software similar to the Leaper‑Fx dashboard and forms system you’re building. Use it to discuss budgets and expectations with a client and to plan work and milestones internally.


## 1) Executive Summary — Typical Budgets

All figures in USD (adjust based on your country/rates):

- MVP (demo-quality, no backend, IndexedDB/local storage, no auth): $6,000 – $12,000
- Pilot in-store (hardened UX, better reliability, light auth, basic hosting): $12,000 – $30,000
- Production-ready (auth, secure storage, audit, server-side WS, compliance hardening): $30,000 – $80,000+
- Regulated-grade with full FINTRAC/PII controls, secure doc storage, audit immutability, pen‑testing: $80,000 – $200,000+

Undergraduate team rates can keep MVP/pilot costs on the lower end. The jump to true production/compliance readiness is where costs grow (security, backend services, audits, documentation, QA).


## 2) Scope Assumptions (Based on Current App)

Included baseline features:
- QR & Forms onboarding: Create QR sessions, customer form submission with documents (ID, selfie, proof of address)
- Forms management: Process submissions, approve/reject documents, basic compliance flags
- Client management: Create/update clients, search/filter, KYC state
- Transactions: Create transactions (Smart Calculator integration), assign/link client, generate printable receipts
- Inventory: Add/update inventory, rates updates, low stock info
- Real-time updates: WebSocket abstraction with local fallback
- Local persistence: IndexedDB + localStorage/in-memory fallback

Out-of-scope for MVP unless explicitly requested:
- User authentication / role-based access control
- Secure document encryption at rest and secure file storage backend
- Immutable audit log store, audit export for regulators
- WebSocket server with auth, rate limiting, and HA
- Data retention/deletion workflows, formal privacy program
- Automated testing, load testing, penetration testing, accessibility audit


## 3) Work Breakdown and Hour Estimates

These are rough order-of-magnitude estimates for an undergraduate team. Hours include coding, internal testing, and basic documentation.

- QR & Form Sessions (create/scan/submit): 30–60 hours
- Document handling (upload/preview/review UI): 35–70 hours
- Forms processing & compliance flags: 25–50 hours
- Client management (CRUD, search, details): 30–60 hours
- Transactions & Smart Calculator integration: 35–70 hours
- Inventory module (stock, rate updates, WS events): 25–45 hours
- Receipts printing & event analytics: 10–25 hours
- WebSocket event bus integration (subscribe/emit): 15–30 hours
- Local persistence (IndexedDB + fallbacks, CRUD services): 25–45 hours
- UI polish, navigation, state propagation, error handling: 30–60 hours
- Documentation (technical + user guide) and handover: 12–24 hours

Subtotal MVP range: ~272 – 539 hours

Add-ons to reach production readiness:
- Authentication & roles (front-end + minimal backend): +60–120 hours
- Secure document storage (client-side encryption and/or backend): +80–180 hours
- Immutable audit logging + export: +40–100 hours
- CI/CD, basic test coverage (unit/integration), e2e happy-paths: +60–140 hours
- Observability/monitoring (client error reporting, logs): +24–60 hours
- Security hardening & review: +40–120 hours

Production uplift: +304 – 720 hours


## 4) Rates and Cost Scenarios

Assumed blended hourly rate (undergraduate team): $25 – $60/hr
- MVP cost (272–539 h): ~$6,800 – $32,300
- Production uplift (304–720 h): ~$7,600 – $43,200
- Combined MVP→Production: ~$14,400 – $75,500

Professional market comparables (agencies/experienced freelancers): $80 – $150/hr
- Same scope would be 2–3x cost.

Tip: Offer fixed-price packages using these ranges, set a change-control process for scope creep.


## 5) Timelines

Assume 2–4 students working part-time (20–30 hrs/week total team capacity):
- MVP: 6 – 10 weeks
- MVP + pilot polish: 8 – 12 weeks
- Production-ready (security + backend + QA): 12 – 20+ weeks

If you can allocate 1–2 full-time equivalents, you can compress timelines by ~30–40%.


## 6) Ongoing & Operational Costs

- Maintenance & support: 10–20% of build cost per year (bug fixes, minor updates)
- Hosting: $10–$200/month depending on stack (front-end hosting + backend/WebSocket + storage)
- Domains/SSL: $10–$100/year (often included)
- Security & compliance: periodic audits or pen tests if handling sensitive PII
- Backups & DR: if you add a backend database, budget for backups and restore testing


## 7) Pricing Packages (Client-facing)

- Starter MVP ($6k – $12k):
  - QR/forms onboarding, client & transaction basics, printable receipts, IndexedDB storage, local WS fallback
  - Good for an in-store pilot on a single workstation

- Business Pilot ($12k – $30k):
  - Hardened workflows, better error handling, light authentication, hosted deployment, improved reporting
  - Suitable for daily use by store staff with small volumes

- Production ($30k – $80k+):
  - Authentication/authorization, secure document storage, audit logging, WS server, CI/CD, tests, observability
  - Suitable for long-term operations and scaling to multiple locations

Note: FINTRAC-grade secure document handling and immutable audits often push budgets into the $80k+ tier.


## 8) Payment Structure & Milestones

- 30% upfront (project kickoff, architecture, backlog)
- 40% after MVP milestone (QR/forms end-to-end, transactions, basic clients)
- 30% after acceptance & handover (documentation, training, deployment)
- Maintenance billed monthly or pre-paid retainer (optional)


## 9) Risks & Change Control

Common risk drivers:
- Compliance/security requirements expanding mid-project (encryption, audit)
- Multi-location deployments, user management, roles/permissions
- Integration with external systems (KYC providers, payment, identity)

Mitigation:
- Fixed scope for each milestone
- Formal change requests with impact on budget/timeline
- Early prototyping and frequent demos to align expectations


## 10) What “Production Ready” Really Entails

From our code documentation (see dashboard/documentation/code_documentation.md), these gaps typically need to be closed before production:
- Secure document handling (encryption at rest + secure storage)
- AuthN/Z, session security, and WS auth
- Immutable audit sink and retention policies
- Backend services for WS/events and data persistence
- Observability (logs/metrics) and tests (unit/integration/e2e)
- Data governance & privacy processes

Budget/time for these should be clearly separated from the MVP quote.


## 11) Recommendation (for an Undergraduate Team)

- Propose a two-phase approach:
  1) MVP/Pilot: $10k – $18k, 8–12 weeks, deliver a stable in-store system with current features
  2) Production Hardening: $25k – $45k additional, 10–16 weeks, focus on security, auth, audits, refined UX

- Offer optional add-ons (priced separately):
  - Secure doc storage backend
  - Audit exports & regulator-ready reporting
  - Automated tests and CI/CD pipeline
  - Multi-user roles & central admin panel

This keeps the initial cost manageable and lets the client see value early while planning for a realistic path to production.


## 12) Next Steps for the Client Conversation

- Confirm priorities: Which features are must-have vs nice-to-have?
- Agree on MVP scope and success criteria
- Choose a pricing package and payment schedule
- Schedule weekly demos and progress reviews

If you share your local rates/currency and any specific compliance must‑haves, we can tailor these numbers precisely.
