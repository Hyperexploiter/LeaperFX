# Navigation & Flows — LeaperFX Dashboard and Contracts Portal

Last updated: 2025-08-23
Audience: Client, stakeholders, and developers

This guide explains how the system is organized, which URLs to use, and how a client and an admin navigate across the two main parts of the project:
- The React Dashboard (store-facing) — QR codes, forms, transactions, inventory, clients, analytics
- The Contracts Portal (client-facing) — access code, digital signing, payments, terms (SOW), admin operations


## 1) React Dashboard (Store-Facing)

Deployed on GitHub Pages under your repository. Because GitHub Pages serves static files (no server routes), the app uses hash-based URLs which are refresh-safe and 404-proof:

- Production base: https://<your-username>.github.io/Leaper-Fx/#/
- Local dev: http://localhost:5173/#/

Routes:
- /#/ — Public ExchangeDashboard (live rates landing)
- /#/login — Owner login screen
- /#/owner — Owner dashboard (protected). Tabs include:
  - Smart Calculator: Quote, add a customer, create a transaction
  - Transactions: View history, assign customer, print receipts
  - Inventory: Add stock, update rates
  - Clients: Client management, profiles, compliance updates
  - Forms: Generate QR, process submissions, document reviewer
  - Analytics: BI overview
- /#/form/:sessionId?token=... — Enhanced customer KYC form reached via QR (store-generated). Suitable for capturing ID/selfie/address docs.
- /#/customer-form/:transactionId?token=... — Customer mobile form flow tied to a pending transaction (when used).
- /#/form-submitted — Simple confirmation page after submission

High-level owner workflow:
1) Owner logs in at /#/login → redirected to /#/owner.
2) In Forms tab:
   - Generate a QR to onboard a client → customer scans from their phone.
   - Customer completes form at /#/form/<sessionId>?token=...
   - Submissions appear in Forms → process documents (approve/reject), then create client.
3) Link client to a transaction (from Smart Calculator or Transactions tab) and optionally print receipt.

Notes:
- Real-time updates: The dashboard uses an internal WebSocket abstraction (with a local fallback). Actions like ‘transaction_created’, ‘transaction_updated’, document approvals, etc. propagate across tabs.
- Persistence: IndexedDB (with localStorage/in-memory fallbacks) stores inventory, transactions, customers, and form submissions on-device for the demo.
- QR deep links: Because we use hash routing, QR targets look like https://<your-username>.github.io/Leaper-Fx/#/form/<sessionId>?token=...


## 2) Contracts Portal (Client-Facing)

This is a static site for presenting a professional engagement experience: client access, digital signing, payments, and roadmap terms. It is safe to host on Vercel or any static hosting. The portal talks to serverless API endpoints under /api/ (e.g., Upstash Redis, Resend, Stripe).

Entry points (public/ directory):
- /index.html — Client Access Portal (enter access code)
- /sign.html — Digital Contract Signing page (neutral until admin defines current phase)
- /payment.html — Payment methods (Stripe or e-Transfer instructions)
- /terms.html — Roadmap terms, renders a Statement of Work template dynamically based on the current phase selected by admin
- /admin.html — Admin dashboard (milestones, backlog, phase selection, email)
- /privacy.html — Privacy (PIPEDA-aligned)
- /security.html — Security & Data Handling overview
- /backlog.html — Feature submission (rate-limited); typically used by clients after access

Shared frontend logic:
- /assets/app.js — Wires forms and API calls (auth, signature submit, payment intent, backlog, admin ops, phase select)
- /assets/styles.css — Shared styling

Serverless API (leaperfx-contracts/api):
- POST /api/auth — Login as ‘client’ (access code) or ‘admin’ (password). Sets JWT cookie.
- POST /api/submit-signature — Records signature audit and emails receipts to client & admin (templated).
- POST /api/process-payment — Creates Stripe PaymentIntent and records a pending payment.
- POST /api/stripe-webhook — Marks milestone paid on payment confirmation; emails client & admin.
- POST /api/milestone-update — Admin: set milestone status/paid and notify client.
- POST /api/backlog-submission — Client: submit a backlog idea (rate-limited).
- POST /api/backlog-admin — Admin: update idea status/notes.
- GET /api/get-project-data — Fetches project/milestones/backlog for dashboards.
- POST /api/phase-select — Admin: select current phase and optional title (these feed /terms.html rendering).

Client Journey (Contracts):
1) Client opens /index.html → enters access code → /api/auth (client) → redirected to /sign.html.
2) /sign.html — Client fills name + draws signature → /api/submit-signature. Success leads to /payment.html.
3) /payment.html — Client chooses payment method:
   - Stripe (card) flow via PaymentIntent (future work to mount Stripe Elements UI) 
   - e-Transfer flow → ‘I’ve sent the e-Transfer’ to record a payment intent for admin tracking
4) /terms.html — Shows SOW for the current phase defined by admin; content is rendered from /contracts/sow-phase-template.html with variables set from the selected phase.

Admin Journey (Contracts):
1) Admin calls /api/auth with admin password (could be via a simple internal tool/cURL or a basic admin login page if added) → JWT cookie.
2) Admin opens /admin.html to:
   - Mark milestones complete/paid (sends emails)
   - Refresh backlog view and mark items seen/annotated
   - Send templated emails (contract confirmation, payment reminder, milestone updates)
   - Select current project phase (phase-select) so /terms.html renders the correct SOW


## 3) How the Two Parts Work Together (Optional)

- The Dashboard is the store’s operational app (in-store onboarding, compliance docs, transactions, inventory, analytics).
- The Contracts Portal is the sales/engagement site for a professional client experience (sign, pay, roadmap terms) with admin controls for communications and milestone tracking.
- In a production deployment, you can link from the Dashboard owner tab (e.g., a ‘Contracts’ card) out to the Portal’s /admin.html for milestone management.


## 4) Quick URLs and Bookmarks

Dashboard (GitHub Pages):
- Public: https://<your-username>.github.io/Leaper-Fx/#/
- Login: https://<your-username>.github.io/Leaper-Fx/#/login
- Owner: https://<your-username>.github.io/Leaper-Fx/#/owner
- QR Form example: https://<your-username>.github.io/Leaper-Fx/#/form/<sessionId>?token=...

Contracts (Static Hosting / Vercel):
- Client access: https://<your-contracts-domain>/index.html
- Sign: https://<your-contracts-domain>/sign.html
- Pay: https://<your-contracts-domain>/payment.html
- Terms: https://<your-contracts-domain>/terms.html
- Admin: https://<your-contracts-domain>/admin.html


## 5) Typical Flows at a Glance

A. Store Onboarding via QR (Dashboard)
1) Owner (/#/owner → Forms) generates QR
2) Client scans QR → (/#/form/:sessionId)
3) Client submits docs → owner reviews in Forms tab → approve/reject → create client
4) Link transaction and print receipt

B. Contracts: Sign & Pay
1) Client: /index.html → access code → /sign.html → sign
2) Redirect to /payment.html → choose payment method
3) Admin can confirm payment (webhook) and mark milestone → /terms.html reflects selected phase and content


## 6) Notes for Deployment & Deep Links

- Dashboard uses HashRouter. Always include ‘#/’ after the base path. Deep links are refresh-safe on GitHub Pages.
- Contracts portal pages are classic static pages. If you protect them in production, keep /api/auth paths and cookies in mind. Admin routes expect a valid JWT cookie.
- The /terms.html page is rendered dynamically from a template using the selected phase and title stored via /api/phase-select. If you don’t set a phase, defaults kick in (Phase 2 — Production Deployment).


## 7) Where to Adjust

- Dashboard tabs and features live in dashboard/demo/src. Routes are declared in dashboard/demo/src/App.tsx.
- Contracts portal pages live in leaperfx-contracts/public. Shared behavior is in leaperfx-contracts/public/assets/app.js.
- Contracts APIs (serverless) live in leaperfx-contracts/api. Review README.md in that directory for endpoint details and required environment variables.

If you want a top navigation bar on the Contracts Portal linking Terms, Privacy, and Security, we can add a small shared header include or copy a consistent header snippet across those pages.



## Update — Client Portal (Workflow Manager)

To streamline the client experience across Sign, Pay, Terms, and Backlog, a single landing page is now available:

- URL: /portal.html
- Purpose: A simple dashboard for clients showing Current Phase, quick actions (Sign Contract, Make a Payment, View Terms/SOW, Submit Feature Idea), and a small project summary.
- Behavior: After successful access code authentication on /index.html, the client is redirected to /portal.html.
- Data: The page fetches project state from /api/get-project-data to display current phase, title, last updated, and counts of milestones/backlog items.

Navigation reference (Contracts Portal):
- Client access: /index.html → redirects to /portal.html after login
- Sign: /sign.html
- Pay: /payment.html
- Terms/SOW: /terms.html (renders from /contracts/sow-phase-template.html)
- Admin: /admin.html
- Privacy: /privacy.html
- Security: /security.html
- Backlog: /backlog.html

No other routes were changed; /sign.html and /payment.html remain directly accessible. The portal uses the shared assets/styles.css and assets/app.js.
