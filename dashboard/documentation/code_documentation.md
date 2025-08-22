# Leaper‑Fx Dashboard & Forms — Code Documentation

Last updated: 2025-08-19 18:42

This document explains what the software does, the main subsystems and actions, how data is stored, and how the client communicates with the local database and real‑time event bus. It also lists the current production‑readiness status and a pragmatic checklist to close remaining gaps.

Related docs:
- Root README.md (project usage) — ../README.md
- TechnicalDoc.md (high‑level notes) — ../../TechnicalDoc.md
- FINTRAC development reference — ./fintrac_dev_ref.md


## 1. System Overview

Leaper‑Fx Dashboard is a front‑end application with an embedded, production‑oriented local persistence layer (IndexedDB with safe fallbacks) and a real‑time event system (WebSocket with a local fallback). It provides:
- Store QR code generation for customer self‑service onboarding
- Customer form submission with document uploads (ID, selfie, proof of address)
- Document review workflow (approve/reject)
- Compliance flagging and basic validation
- Customer creation and transaction assignment
- Live updates across tabs/components via a unified WebSocket service

The app is designed to operate without a dedicated backend (for demo/edge deployments) while remaining compatible with server‑side WebSocket endpoints when available.


## 2. Architecture at a Glance

- UI Layer (React):
  - Forms tab (dashboard/demo/src/tabs/Forms/index.tsx) orchestrates QR management, submissions, and ID verification flows.
  - Components like StoreQRCode, DocumentReviewer, and ScannerFallback provide the UX for QR generation, document review, and alternative upload paths.

- Service Layer (dashboard/demo/src/services):
  - formService.ts: End‑to‑end orchestration for form/QR sessions, submissions, and document review. Persists to databaseService and broadcasts events via webSocketService.
  - webSocketService.ts: Real‑time transport abstraction. Uses a real WebSocket if available, otherwise a local in‑app queue with polling.
  - databaseService.ts: IndexedDB‑backed persistence with intelligent fallbacks to localStorage and in‑memory.
  - (Referenced) customerService.ts, transactionService.ts: Integrations for creating customers and linking transactions.

- Utilities:
  - utils/security.ts: Secure ID/UUID generation, crypto helpers, sanitization, and FINTRAC‑oriented validation helpers.


## 3. Data Storage Model

databaseService.ts (IndexedDB + fallbacks) provides structured stores and a generic key‑value store:

- Structured object stores:
  - transactions (id, date, currencies, amounts, status, etc.)
  - inventory (id, currency, rates, amount)
  - customers (id, PII fields, transactions list, timestamps)
  - compliance (id, transactionId, type/status, deadlines)
  - website_activities (id, type, timestamp)

- Generic key‑value store: generic_storage
  - Used by Form module for:
    - form_submissions: Array<FormSubmission>
    - qr_sessions: Array<QRCodeSession>

Fallback behavior:
- If IndexedDB isn’t available or fails, databaseService transparently falls back to:
  - localStorage for generic_storage setItem/getItem
  - in‑memory arrays for structured stores

All databaseService methods are promise‑based and safe to call regardless of environment availability.


## 4. Real‑Time Communication

webSocketService.ts abstracts real‑time events with two modes:
- WebSocket Mode: Connects to ws(s)://<host>/ws; maintains heartbeat, reconnects with backoff, and forwards parsed events to subscribers.
- Local Mode: If no server or on error, switches to a local event bus using an in‑app queue processed by a polling timer.

Core API:
- connect(url?): Promise<boolean>
- disconnect(): void
- subscribe(handler): () => void (returns unsubscribe)
- send({ type, data }): void — wraps and timestamps the event
- broadcastSystemEvent(type, data): convenience wrapper
- getStatus(): { connected, mode, subscriberCount, queueSize }

Event Types (subset relevant to Forms):
- qr_code_generated
- form_session_created
- form_submission_received
- form_status_updated
- form_transaction_assigned
- form_document_uploaded
- form_document_approved
- form_document_rejected
- form_audit_log

UI (Forms tab) subscribes once on mount and updates local state upon receiving events, ensuring that updates propagate across views without manual refresh.


## 5. Forms & QR Workflow

Primary orchestrations in formService.ts:

- createFormSession({ expiresIn?, requiredDocuments? }):
  - Generates sessionId + sessionToken via utils/security.generateSecureId.
  - Persists QR session in qr_sessions via databaseService.setItem.
  - Emits form_session_created.

- generateFormQR({ transactionId?, expiresIn?, requiredDocuments? }):
  - Creates a QR session and persists to qr_sessions.
  - Emits qr_code_generated.

- validateQRSession(sessionId, token):
  - Confirms token match and not expired; auto‑expires if past.

- submitCustomerForm({ sessionId, customerData, documents, submissionSource }):
  - Processes uploaded docs (metadata only for now), validates customer data via customerService.validateCustomerDataSimplified, builds FormSubmission with status pending.
  - Saves into form_submissions (unshift to place newest first).
  - Marks QR session as scanned and emits form_submission_received.
  - Records an audit action (form_audit_log).

- processFormSubmission(formId):
  - Moves status to processing, performs compliance checks (flags like MISSING_PHOTO_ID, MISSING_SELFIE, LARGE_TRANSACTION), persists, and emits form_status_updated.

- approveDocument(formId, documentId):
  - Updates doc verificationStatus to verified. If all docs verified, sets form.verificationStatus and form.status to verified. Emits form_document_approved and possibly form_status_updated.

- rejectDocument(formId, documentId, reason):
  - Updates doc verificationStatus to rejected, sets form to rejected, persists, and emits form_document_rejected + form_status_updated.

- createCustomerFromForm(formId):
  - Creates a customer via customerService using form data and derived docs info, updates form status to completed, and logs audit; on error, marks form rejected.

- assignTransactionToForm(formId, transactionId):
  - Persists linkage to the form, requests transactionService.linkCustomerToTransaction, emits form_transaction_assigned, and logs audit.

- uploadDocumentForForm(formId, file, documentType):
  - Processes and appends a new document to an existing form, emits form_document_uploaded, logs audit.

- getFormStatistics():
  - Basic KPIs for the dashboard (totals and today counts by status).


## 6. Data Models (TypeScript)

- FormSubmission:
  - id, qrCodeId, customerData, documents: SecureDocument[], status: 'pending' | 'processing' | 'verified' | 'completed' | 'rejected', submissionDate, verificationStatus, complianceFlags, assignedTransactionId?, createdAt, updatedAt, source ('qr_scan' | 'manual_entry' | 'scanner_fallback'), ipAddress?, userAgent?

- SecureDocument:
  - id, type ('photo_id' | 'proof_of_address' | 'selfie' | 'additional'), fileName, fileSize, mimeType, metadata: DocumentMetadata, verificationStatus, rejectionReason?, uploadedAt

- DocumentMetadata:
  - originalFileName, extractedText?, confidence?, documentType?, expiryDate?, issuer?, biometricMatch?

- QRCodeSession:
  - id, qrCodeUrl, sessionToken, expiresAt, isActive, scannedAt?, customerIP?, createdAt


## 7. UI Actions and State Propagation

Forms tab (dashboard/demo/src/tabs/Forms/index.tsx) covers three sections:
- QR Management: generates QR codes to onboard customers.
- Form Submissions: lists pending/processing/completed forms with bulk actions.
- ID Validation: document queues with quick stats; opens DocumentReviewer and ScannerFallback.

Handlers call formService exclusively for mutations to ensure:
- Persistent storage via databaseService
- Real‑time global updates via webSocketService events
- Centralized audit logging via formService.logAuditAction

Key handlers:
- handleProcessForm -> formService.processFormSubmission
- handleApproveDocument -> formService.approveDocument
- handleRejectDocument -> formService.rejectDocument
- handleCreateClientFromForm -> formService.createCustomerFromForm (ensures form is updated with customerId and status/events propagate)
- handleAssignTransaction -> handleCreateClientFromForm + formService.assignTransactionToForm

The component subscribes to webSocketService; upon relevant events, it updates local lists and/or reloads from persistence to keep derived sections in sync.


## 8. Error Handling, Auditing, and Analytics

- All formService mutations persist before broadcasting events; failures throw errors and prevent inconsistent state.
- logAuditAction writes to console and emits form_audit_log events; a production setup should persist these to a secure, append‑only audit sink.
- databaseService gracefully degrades to localStorage/memory.
- webSocketService queues and replays in local mode.


## 9. Security & Compliance Considerations

Current safeguards:
- Secure ID/token generation via crypto (utils/security.ts)
- Basic input validation/sanitization and FINTRAC helpers (e.g., adult check, phone/email/postal validation, risk heuristics)
- Rate limiter utility for client‑side throttling (not globally enforced)

Known limitations (to address for production):
- Document storage is metadata‑only; actual files are not encrypted nor persisted securely. Implement client‑side encryption at rest (Web Crypto) and/or server‑side secure storage with KMS/rotation.
- No authentication/authorization or role‑based access controls for sensitive actions.
- Audit logs are not persisted beyond console/events; require tamper‑evident, immutable storage.
- WebSocket authentication and secure origin pinning are not implemented in this front‑end.
- PII handling requires data retention policy, right‑to‑erasure processes, and at‑rest encryption.
- Comprehensive input validation and schema enforcement should be expanded (both client and server).


## 10. Production‑Readiness Status

Mature/Ready components:
- webSocketService: Robust connection management, local fallback, subscriber pattern.
- databaseService: IndexedDB with tested fallbacks; structured stores + generic_storage.
- formService flows: End‑to‑end orchestration with consistent persistence and event propagation.
- UI wiring: Forms tab now uses formService for all mutations; state propagation via WS events.

Gaps before production:
1) Secure Document Handling
   - Encrypt and securely store uploaded document binaries; currently only metadata is stored.
2) AuthN/Z and Session Security
   - Add user authentication, role‑based permissions, CSRF protections for any mutating HTTP endpoints, and secure WebSocket tokens.
3) Audit & Compliance Logging
   - Persist audit logs to an append‑only, immutable store with retention policies and access controls.
4) Backend Integration
   - Provide a real backend for WebSocket events and data persistence (or hosted services), including rate limiting, WAF, and monitoring.
5) Data Governance
   - PII encryption at rest, key management rotation, and data lifecycle policies (retention/deletion).
6) Observability
   - Centralized logs/metrics/traces; client error reporting; uptime checks.
7) Testing & QA
   - Unit/integration/e2e tests; security testing; load testing; accessibility quality gates.
8) Operational Readiness
   - Versioning, migrations, backups, incident runbooks, and CI/CD with SAST/DAST.


## 11. Checklist for Go‑Live

- Security
  - [ ] Encrypt document binaries at rest; secure key management
  - [ ] AuthN/Z for dashboard operations and WS connections
  - [ ] Hardened content security policy; strict transport security
- Data & Compliance
  - [ ] Immutable audit log sink with retention
  - [ ] PII data minimization and retention policy documented and enforced
  - [ ] Schema validation on both client and server
- Reliability
  - [ ] Backend WS server deployed with health checks and autoscaling
  - [ ] Backups and restore runbook verified
- Quality
  - [ ] Unit and integration tests for services (formService, databaseService, webSocketService)
  - [ ] E2E flows for QR session -> submission -> review -> client creation
  - [ ] Accessibility checks (WCAG) and performance budgets (Lighthouse)
- Operations
  - [ ] CI/CD with security scanning and artifact signing
  - [ ] Monitoring/alerting dashboards for critical KPIs


## 12. Quick Reference — Key APIs

formService (dashboard/demo/src/services/formService.ts):
- createFormSession(opts?) -> { sessionId, sessionUrl, expiresAt }
- generateFormQR(opts) -> QRCodeSession
- validateQRSession(sessionId, token) -> boolean
- submitCustomerForm({ sessionId, customerData, documents, submissionSource }) -> FormSubmission
- getAllFormSubmissions() -> FormSubmission[]
- getFormSubmissionById(id) -> FormSubmission | null
- processFormSubmission(formId) -> FormSubmission
- updateFormStatus(formId, status) -> void
- createCustomerFromForm(formId) -> Customer
- assignTransactionToForm(formId, transactionId) -> void
- uploadDocumentForForm(formId, file, documentType) -> SecureDocument
- approveDocument(formId, documentId) -> void
- rejectDocument(formId, documentId, reason) -> void
- getFormStatistics() -> { totals }

webSocketService (dashboard/demo/src/services/webSocketService.ts):
- connect(url?) -> Promise<boolean>
- disconnect() -> void
- subscribe(cb) -> unsubscribe()
- send({ type, data }) -> void
- broadcastSystemEvent(type, data) -> void
- getStatus() -> { connected, mode, subscriberCount, queueSize }

databaseService (dashboard/demo/src/services/databaseService.ts):
- init() / ensureDatabase()
- getItem(key) / setItem(key, value)
- CRUD helpers: transactions, inventory, customers, compliance, website_activities
- initializeDefaultData()


## 13. Data Flow Summary

1) Staff generates a QR session (formService.createFormSession -> DB persist -> WS emit)
2) Customer scans QR and submits form (submitCustomerForm -> process docs -> persist -> WS emit)
3) Staff processes and reviews (processFormSubmission -> compliance flags -> WS emit)
4) Staff approves/rejects documents (approveDocument/rejectDocument -> persist -> WS emit)
5) Staff creates customer and/or assigns transaction (createCustomerFromForm / assignTransactionToForm)
6) All actions are logged (logAuditAction -> WS emit; future: persist to immutable audit store)

This document should serve as a comprehensive starting point for developers and auditors to understand the system’s behavior and readiness.

## 14. Cross-tab propagation and workflows (Smart Calculator, Inventory, Receipts)

- Smart Calculator: Add Client
  - Component: dashboard/demo/src/components/SmartCalculator/index.tsx -> customerService.createCustomer(...)
  - Emits: customer_created via webSocketService
  - Consumers: ClientManagement subscribes to customer_created/customer_updated and reloads client list immediately.

- Smart Calculator: Add to Sale
  - Component: SmartCalculator handleAddToSale -> transactionService.createTransaction({...})
  - Emits: transaction_created (now emitted by transactionService)
  - Consumers: Transactions tab subscribes to transaction_created/transaction_updated and refreshes list.

- Assign/Change Customer on Transaction
  - Service flow: transactionService.linkCustomerToTransaction -> updateTransaction -> emits transaction_updated (new)
  - Consumers: Transactions tab listens for transaction_updated and refreshes; ClientManagement listens for transaction_updated to recompute last-transaction summaries.

- Inventory: Add stock / update rates
  - Service: inventoryService.addStock/updateInventoryItem -> databaseService persists changes.
  - UI: Inventory tab sends rate_update when rates change to notify other views; inventory view refreshes itself after addStock.

- Print transaction receipts
  - Transactions tab printReceipt now emits transaction_receipt_generated with minimal metadata (transactionId, amounts/currencies, printedAt) to support analytics and peripheral listeners.

Event additions in this iteration:
- transaction_updated type introduced; emitted by transactionService.updateTransaction. Components updated to subscribe accordingly.
