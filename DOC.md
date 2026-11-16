# Supplement Business Automation SOW, FRD and NFR

November 12, 2026 · @Divyanshu

## Document control

This is the build reference for a 6-week web application that runs a protein and health supplement trading business end to end: product master, warehouse stock by location, catalog ordering, WhatsApp estimates, payments, picking, packing and delivery. Development started on Monday 2 November 2026 and go-live is planned for Friday 11 December 2026.

| Item | Detail |
| --- | --- |
| Client | Jay and Raj (founders), supplement trading business, 2 warehouse units |
| Version | 1.0, approved scope |
| Audience | Development team (full-stack, frontend, QA) |
| Part A: Scope of Work | What is being built, what is not, timeline, milestones, acceptance |
| Part B: FRD | Functional requirements by module, with IDs, business rules and acceptance criteria |
| Part C: NFR | Performance, security, reliability, usability and deployment requirements |
| Appendix | Status lifecycles, core data model, notification matrix, glossary |

Requirement IDs follow the pattern `MODULE-NN` (for example `INV-04`). Reference them in tickets, commits and test cases. Priority is **Must** (go-live blocker) or **Should** (deliver in this phase unless time runs out, then agreed with the PM).

Commercial terms with the client are not part of this document.

## Part A: Scope of Work

The team delivers one responsive web application (PWA) with role-based portals, a public catalog page and a public estimate page, deployed on DigitalOcean and live by 11 December 2026.

### A1. Objectives

1. Cut founder involvement to pricing, credit approval and dashboards.
2. Know every product's stock by unit, floor, rack and bin, in sealed cartons and loose packs.
3. Stop loose-pack loss by making carton opening an approved, reconciled action.
4. Move enquiry, estimate, payment proof and delivery confirmation onto WhatsApp links instead of manual messages.
5. Tie every stock movement and approval to a named user, so mismatch and loss can be traced.

### A2. In scope

| # | Module | Summary |
| --- | --- | --- |
| 1 | Auth, users and roles | Admin-created alphanumeric user IDs, password login, 6 roles, permission checks on every API |
| 2 | Master data | Brands, products, variants (flavour, size), carton config, HSN, GST, MRP, vendors, vendor price rules, clients |
| 3 | Warehouse map | Units, floors, racks, bins as selectable locations |
| 4 | Inventory | Purchase inward, GRN, put-away, stock ledger, transfers, adjustments, cycle counts, opening stock import |
| 5 | Catalog and ordering | Public catalog link, brand and product filters, cart in cartons or packs, checkout, order queue with 24-hour SLA |
| 6 | Estimates and pricing | Challan builder, founder pricing, payment-mode tag, versioned revisions, public estimate page |
| 7 | WhatsApp integration | Template messages through a WhatsApp Business API provider (BSP) for estimates, payment receipts, dispatch and delivery |
| 8 | Payments and credit | UPI and bank details, payment proof upload, verification, credit approval with limits, payment ledger |
| 9 | Pick, pack and loose units | Floor-wise pick lists, pick confirmation, carton-open requests and approvals, loose-pack reconciliation, pack checklist and photo |
| 10 | Dispatch and delivery | Consolidation, dispatch mode, rider assignment, OTP or photo proof, self-delivery confirmation |
| 11 | Dashboards and reports | Founder dashboard, sales, stock, variance, credit outstanding, payment-mode filters, accountant view, Tally Excel export |
| 12 | Audit and notifications | Audit log for every create, edit and approval; in-app notifications per role |

### A3. Out of scope

- QR or barcode labels and any scanning. Locations are chosen from dropdowns.
- Hardware of any kind: printers, scanners, phones, computers.
- Hard-drive export, offline archive viewer or any hardware backup. Data stays on the cloud with provider backups.
- Native Android or iOS apps. The PWA must work well on Android Chrome.
- Payment gateway integration. Payments are verified manually from uploaded proof.
- GST e-invoicing and e-way bill generation.
- Live two-way Tally sync. An Excel export is included.
- Migration of past transactions from Vyapar. Product masters and opening stock are imported from Excel.
- A separate ledger of sales hidden from the accountant. Every sale carries a payment-mode tag and appears in all reports.

### A4. Deliverables

- Source code in a private Git repository, with a README, `.env.example` and seed data.
- Database migrations and an ERD.
- Deployed production and staging environments on DigitalOcean.
- WhatsApp message templates submitted for Meta approval.
- Excel import templates for products, clients, vendors and opening stock.
- API documentation (OpenAPI/Swagger).
- Test cases mapped to requirement IDs, and a UAT sign-off sheet.
- A short admin guide and a one-page guide per role, plus one training session.

### A5. Timeline

| Week | Dates | Focus | Exit criteria |
| --- | --- | --- | --- |
| 1 | 2 to 6 Nov | Foundation | Repo, CI, staging live; auth and roles; master data and warehouse map CRUD; UI kit |
| 2 | 9 to 13 Nov | Inventory | GRN, put-away, stock ledger, transfers, adjustments, opening stock import |
| 3 | 16 to 20 Nov | Ordering | Catalog link, cart, checkout, order queue, confirmation workflow. **Mid-project demo on 20 Nov** |
| 4 | 23 to 27 Nov | Estimates and payments | Challan, pricing, revisions, estimate page, WhatsApp templates, payment proof, credit |
| 5 | 30 Nov to 4 Dec | Fulfilment | Pick lists, carton-open approvals, packing, dispatch, delivery proof. **UAT build on 4 Dec** |
| 6 | 7 to 11 Dec | Go-live | Dashboards, reports, Tally export, UAT fixes, production deploy, training. **Go-live 11 Dec** |

### A6. Milestones and acceptance

| Milestone | Date | Accepted when |
| --- | --- | --- |
| M1 Kick-off | 2 Nov | Scope signed off, repo and staging set up |
| M2 Mid-project demo | 20 Nov | Master data, inventory and ordering work end to end on staging; demo given to Jay and Raj |
| M3 UAT ready | 4 Dec | Every Must requirement in Part B implemented and passing QA; client starts UAT |
| M4 Go-live | 11 Dec | No open Severity 1 or 2 defects; production live; masters and opening stock loaded; training done |

Defect severity: **S1** blocks a core flow with no workaround; **S2** breaks a feature with a workaround; **S3** cosmetic or minor.

### A7. Responsibilities

| Party | Responsible for |
| --- | --- |
| Project manager / architect (Divyanshu) | Scope, priorities, client communication, design sign-off, acceptance |
| Development team | Build, unit tests, deployments, documentation, bug fixes in the 30-day warranty |
| QA | Test cases per requirement ID, regression before each milestone |
| Client | Product, vendor, client and price data in templates; warehouse layout; WhatsApp Business number and Meta verification; opening stock count; UAT within 3 working days of each build |

### A8. Assumptions and change control

- Two units at go-live, each with up to 5 floors. The data model must support more units without code changes.
- Up to about 40 internal users and 200 orders a day in year one.
- Interface in English for go-live. Labels are kept in resource files so Hindi can be added later.
- Meta template approval can delay WhatsApp go-live. Build a fallback that shows a copyable link and message when the API is unavailable.
- Any change to this scope goes to the PM as a written change request with effort and impact before work starts. No undocumented scope additions.
- 30 days of bug fixing after go-live, limited to defects against this document.

## Part B: Functional Requirements (FRD)

Every requirement below is testable and carries an ID, a priority and acceptance criteria. Permissions are enforced on the server for every API call, never only by hiding UI.

### B1. Roles and permissions

| Capability | Admin | Sub-admin | Floor mgr | Delivery mgr | Delivery team | Accountant |
| --- | --- | --- | --- | --- | --- | --- |
| Create and disable users | All roles | Below sub-admin | - | - | - | - |
| Master data (products, vendors, clients) | Edit | Edit (no cost prices) | View | - | - | View |
| Vendor price rules and cost prices | Edit | - | - | - | - | View |
| Warehouse map | Edit | Edit | View own unit | - | - | - |
| GRN and put-away | Approve variance | Create | Create on own floors | - | - | View |
| Stock view | All | All | Own floors | - | - | All, read only |
| Stock adjustments | Approve | Request | Request | - | - | View |
| Order queue and confirmation calls | All | All | - | - | - | View |
| Create and edit challan lines | Yes | Yes | - | - | - | - |
| Enter or revise selling price | Yes | Revise only if granted | - | - | - | - |
| Send estimate | Yes | Yes | - | - | - | - |
| Verify payment | Yes | Yes | - | - | - | Yes |
| Approve credit order | Yes | - | - | - | - | - |
| Pick lists and packing | View | View | Own floors | - | - | - |
| Approve carton opening | Yes | Yes | Request only | - | - | - |
| Dispatch and rider assignment | Yes | Yes | Mark ready | Yes | - | - |
| Deliver and upload proof | - | - | - | Self delivery | Assigned only | - |
| Founder dashboard, margins | Yes | - | - | - | - | - |
| Sales, GST and payment reports, Tally export | Yes | Sales only | - | - | - | Yes |
| Audit log | Yes | Own actions | - | - | - | - |

A user can be assigned to one unit and one or more floors. "Own floors" means data is filtered by that assignment on the server.

### B2. Authentication and users (AUTH)

| ID | Requirement | Priority |
| --- | --- | --- |
| AUTH-01 | Admin and sub-admin create users with an alphanumeric user ID (6 to 20 characters, unique, case-insensitive), name, mobile, role, unit and floors. | Must |
| AUTH-02 | Initial password is set by the creator; user must change it on first login. Minimum 8 characters with a letter and a digit. | Must |
| AUTH-03 | Login with user ID and password. 5 failed attempts lock the account for 15 minutes; admin can unlock. | Must |
| AUTH-04 | Admin or sub-admin can reset a user's password and disable a user. Disabled users cannot log in; their history stays. | Must |
| AUTH-05 | Sessions expire after 12 hours of inactivity on staff portals. Logout ends the session on the server. | Must |
| AUTH-06 | Users cannot be deleted, only disabled, so audit history stays intact. | Must |
| AUTH-07 | A sub-admin cannot create admins or edit admin accounts. | Must |
| AUTH-08 | Admin can grant a sub-admin the "revise price" permission per user. | Should |

Acceptance: a floor manager calling a stock API for another floor gets 403; a disabled user's token stops working within 1 minute.

### B3. Master data (MD)

| ID | Requirement | Priority |
| --- | --- | --- |
| MD-01 | Brand CRUD: name, logo, active flag. | Must |
| MD-02 | Product CRUD under a brand: name, category (whey, isolate, gainer, pre-workout, etc.), description, image, HSN code, GST rate, active flag. | Must |
| MD-03 | Variant (SKU) under a product: flavour, pack size with unit (e.g. 5 lb, 1 kg), MRP, SKU code (auto-generated, editable), image, active flag. Each variant is its own stock item. | Must |
| MD-04 | Carton config per variant: units per carton (integer, at least 1). Stock is stored in packs; cartons are always derived. | Must |
| MD-05 | Changing units per carton is blocked while sealed cartons of that variant are in stock; admin sees the reason. | Must |
| MD-06 | Vendor CRUD: name, GSTIN, contact, address, payment terms. | Must |
| MD-07 | Vendor price rules per variant: base purchase price per pack plus optional conditions (minimum quantity in cartons, payment mode, delivery within N days), valid from and to dates. The best matching active rule is shown as the cost reference. | Must |
| MD-08 | Client CRUD: business name, contact name, mobile (unique key), GSTIN, billing and shipping addresses, credit limit, credit days, notes. Created automatically from catalog checkout if the mobile is new. | Must |
| MD-09 | Excel import for brands, products, variants, vendors and clients, with a downloadable template, row-level validation and an error report. Valid rows import; invalid rows are listed. | Must |
| MD-10 | Search and filter on all masters by name, brand, SKU code and active flag. | Must |
| MD-11 | Inactive products and variants are hidden from the catalog and new challans but stay on old records. | Must |

Business rule: a variant's stock in packs = sum of its ledger entries. Display as `C cartons + P packs` where `C = floor(packs_in_sealed_cartons / units_per_carton)` and loose packs are shown separately (see INV-08).

### B4. Warehouse map (WH)

| ID | Requirement | Priority |
| --- | --- | --- |
| WH-01 | Unit CRUD: name, address, GSTIN (optional). | Must |
| WH-02 | Floors under a unit, racks under a floor, bins under a rack. Location code auto-built as `U1-F2-R05-B03`. | Must |
| WH-03 | Bulk create racks and bins (e.g. rack 1 to 20, bins 1 to 6 each). | Should |
| WH-04 | Location active flag. A bin with stock cannot be deactivated. | Must |
| WH-05 | Floor managers are assigned to floors; one floor can have one primary floor manager. | Must |

### B5. Inventory (INV)

Stock is a ledger. Every quantity change is an immutable entry keyed by variant, location and lot (batch + expiry). On-hand, reserved and available figures are computed from it.

| ID | Requirement | Priority |
| --- | --- | --- |
| INV-01 | Purchase inward entry: vendor, vendor invoice number and date, unit, lines with variant, cartons, extra packs, batch, expiry, purchase price per pack. | Must |
| INV-02 | GRN: floor manager enters received cartons and packs per line, plus short and damaged quantities. Posting creates `GRN_IN` entries for accepted stock in a "Received" holding location of that floor. | Must |
| INV-03 | Any short, excess or damaged quantity flags the GRN for admin review with an in-app alert. Damage needs at least one photo. | Must |
| INV-04 | Put-away: received stock is assigned to one or more bins on that floor (quantity can be split). Stock in "Received" cannot be picked. | Must |
| INV-05 | Ledger entry types: `GRN_IN`, `PUTAWAY`, `TRANSFER_OUT`, `TRANSFER_IN`, `RESERVE`, `RELEASE`, `PICK`, `CARTON_OPEN`, `LOOSE_IN`, `DAMAGE`, `SAMPLE`, `ADJUST`. Each stores user, time, reference document and reason. | Must |
| INV-06 | No screen or API edits stock directly. Corrections are new entries only. | Must |
| INV-07 | Stock view by variant, brand, unit, floor and bin, showing sealed cartons, loose packs, reserved, available and nearest expiry. Export to Excel. | Must |
| INV-08 | Opened cartons are tracked as records: variant, lot, bin, opened by, approved by, packs remaining, status. Loose packs are always drawn from an opened-carton record. | Must |
| INV-09 | Transfer between bins, floors or units: create, send (stock moves to "In transit"), receive at destination. Partial receipt flags a variance to admin. | Must |
| INV-10 | Stock adjustment request with quantity, reason (damage, expiry, found, lost, sample) and optional photo. Posts only after admin approval. | Must |
| INV-11 | Cycle count: admin or sub-admin creates a count task for selected bins. Floor manager enters counted quantities without seeing system quantities. Variances go to admin, who approves an adjustment or orders a recount. | Must |
| INV-12 | Expiry alerts for lots expiring within a configurable window (default 90 days). | Should |
| INV-13 | Low-stock threshold per variant with a dashboard list. | Should |
| INV-14 | Opening stock import from Excel: variant SKU, bin code, batch, expiry, sealed cartons, loose packs. Posts `ADJUST` entries tagged "Opening stock". | Must |

Rules:

- **Available = on hand − reserved**, per variant and unit. Catalog availability and challans use available stock.
- Stock is reserved when an estimate is sent and released if the order is cancelled or the estimate expires (default 7 days, configurable).

Acceptance: after 10 random ledger operations in a test, the computed stock per bin equals the expected figure, and no API path can change stock without a ledger row.

### B6. Catalog and ordering (CAT)

| ID | Requirement | Priority |
| --- | --- | --- |
| CAT-01 | Public catalog at a short URL, no login, mobile-first, loads under 3 seconds on 4G. | Must |
| CAT-02 | Brand list with logos and search; filter by category. | Must |
| CAT-03 | Brand page lists its products. Product page lists variants by flavour and size with an availability badge: In stock, Limited (below threshold) or Out of stock. No prices and no quantities are shown. | Must |
| CAT-04 | Out-of-stock variants are shown but cannot be added to the cart. | Must |
| CAT-05 | Cart: quantity per variant in cartons and/or packs, showing the total in packs. Cart survives a page refresh on the same device. | Must |
| CAT-06 | Checkout form: contact name, mobile (10 digits, Indian), business name, GSTIN (optional, format-checked), delivery address, preferred delivery date, notes. | Must |
| CAT-07 | Submitting creates an order with status `New` and number `ORD-YYMM-NNNNN`, shows a confirmation screen, and sends a WhatsApp acknowledgement to the client. | Must |
| CAT-08 | Spam protection: honeypot field and rate limits per IP and per mobile (e.g. 5 orders per hour). | Must |
| CAT-09 | Staff can copy or share the catalog link, optionally pre-filtered to a brand, from their dashboard. | Should |
| CAT-10 | Operator can create an order manually for phone or WhatsApp enquiries, picking an existing client or creating one. | Must |

### B7. Order queue and confirmation (ORD)

| ID | Requirement | Priority |
| --- | --- | --- |
| ORD-01 | Order queue for operators showing `New` orders oldest first with time since placed. Row turns amber at 20 hours and red at 24 hours. | Must |
| ORD-02 | At 24 hours without a logged call, admins get an escalation notification. | Must |
| ORD-03 | Operator logs each call: Confirmed, Changes requested, Not reachable (attempt count kept) or Cancelled with reason. | Must |
| ORD-04 | On Changes requested, operator edits lines before confirming. Original client request stays visible in history. | Must |
| ORD-05 | Confirmed orders move to `Confirmed` and appear in the estimate queue for Jay and Raj. | Must |
| ORD-06 | Order detail shows a full timeline of status changes, calls, estimates, payments and fulfilment, with user and time. | Must |

### B8. Estimates and pricing (EST)

| ID | Requirement | Priority |
| --- | --- | --- |
| EST-01 | Operator creates an estimate challan from a confirmed order. Lines are pre-filled; lines can be added, removed or changed. Each line shows available stock in its unit. | Must |
| EST-02 | Quantity is entered as cartons plus packs and stored in packs. | Must |
| EST-03 | Admin enters selling price per pack or per carton (auto-converted), optional line discount. GST per line from the product's rate; prices entered tax-inclusive or tax-exclusive as set per estimate. | Must |
| EST-04 | While pricing, admin sees the cost reference (MD-07), the client's last price for that variant and the line margin %. Sub-admins never see cost or margin. | Must |
| EST-05 | Each estimate carries a payment mode tag: UPI, Bank transfer, Cash or Credit. The tag shows in every report and the accountant view; no sale is hidden from any report. | Must |
| EST-06 | Status flow `Draft` → `Priced` → `Sent`. Send is enabled only when every line has a price. Sending reserves stock (INV rule). | Must |
| EST-07 | Revision after send: admin, or a sub-admin with permission, edits and resends. This creates a new version (v2, v3...), locks the old one and updates the reservation. The old link shows "Replaced by a newer estimate" with a link to the latest. | Must |
| EST-08 | Estimate number `EST-YYMM-NNNNN`, suffixed `/v2` for revisions. | Must |
| EST-09 | Validity defaults to 7 days. Expired estimates release reserved stock and can be refreshed and resent. | Must |
| EST-10 | Public estimate page at an unguessable tokenised URL (at least 32 random characters), no login: client and business details, lines, quantities, prices, GST, totals, validity, payment details, Pay button. | Must |
| EST-11 | Estimate PDF download from the public page and the staff portal. | Should |
| EST-12 | "Request a change" button on the public page sends the client's note to the operator queue. | Should |

### B9. WhatsApp integration (WA)

| ID | Requirement | Priority |
| --- | --- | --- |
| WA-01 | Integrate one WhatsApp Business API provider through an adapter interface so the provider can be swapped without changing business code. | Must |
| WA-02 | Utility templates with variables: order received, estimate sent (link), estimate revised (link), payment received, payment verified, payment rejected (reason), order dispatched, out for delivery (OTP), delivered. | Must |
| WA-03 | Every outgoing message is logged per order with template, recipient, status (queued, sent, delivered, read, failed) updated by provider webhooks. | Must |
| WA-04 | Sending runs through a job queue with up to 3 retries. On failure the staff screen shows the message and link with a copy button and a `wa.me` deep link. | Must |
| WA-05 | Template text and the sender number are configurable in settings without a deploy. | Should |

### B10. Payments and credit (PAY)

| ID | Requirement | Priority |
| --- | --- | --- |
| PAY-01 | The estimate page shows the UPI ID, a UPI QR code carrying the amount and estimate number, and bank account details, all from settings. | Must |
| PAY-02 | Client uploads payment proof (JPG, PNG or PDF, up to 5 MB) with amount, mode and UTR or reference number. | Must |
| PAY-03 | Upload sets payment status `Submitted` and notifies admins, sub-admins and the accountant. | Must |
| PAY-04 | A verifier marks the payment `Verified` (amount, date, UTR confirmed) or `Rejected` with a reason. The client gets a WhatsApp message either way. | Must |
| PAY-05 | An order can have several payments. It is released to the warehouse only when verified payments cover the estimate total, or an admin approves credit for the balance. | Must |
| PAY-06 | Credit approval is admin-only and shows the client's credit limit, outstanding amount and overdue amount. Approving above the limit needs an explicit override reason. | Must |
| PAY-07 | Staff can record a cash or offline payment against an order, with payment mode Cash and an optional photo of the receipt. | Must |
| PAY-08 | Duplicate UTR numbers are flagged before verification. | Must |
| PAY-09 | Client ledger: estimates, invoices, payments, outstanding balance and ageing buckets (0 to 30, 31 to 60, 61 to 90, over 90 days). | Must |
| PAY-10 | Dashboard list of credit orders past due date. | Should |

Acceptance: an order with a ₹10,000 estimate and one verified ₹6,000 payment stays out of the warehouse queue until a second payment is verified or an admin approves ₹4,000 credit.

### B11. Picking, loose units and packing (PK)

| ID | Requirement | Priority |
| --- | --- | --- |
| PK-01 | When an order is released, the system allocates stock per line: earliest expiry first, loose packs from already-opened cartons before opening a sealed one, and as few floors as possible. | Must |
| PK-02 | One pick list is generated per floor, listing bin, lot, sealed cartons and loose packs per line. Each floor manager sees only their floor's lists. | Must |
| PK-03 | Floor manager confirms the quantity picked per line. A short pick needs a reason (not found, damaged); the system tries another bin, and if none has stock the order goes `On hold` with an alert to the sub-admin. | Must |
| PK-04 | Full cartons are picked with no approval. | Must |
| PK-05 | If a line needs packs and no opened carton has enough, the floor manager raises a **carton-open request** (variant, lot, bin, packs needed, order). The sub-admin approves or rejects it. | Must |
| PK-06 | On approval, a `CARTON_OPEN` entry converts one sealed carton into an opened-carton record holding its full pack count. The picked packs are deducted from that record. | Must |
| PK-07 | After picking, the floor manager submits a **remaining-units declaration**: packs left, the bin they are stored in, and any damaged packs (photo needed). The sub-admin confirms it. | Must |
| PK-08 | Every pack leaving an opened carton must end with one outcome and a note: Sold (order ref), Back to loose stock, Damaged or Sample. A declared count that differs from the system count raises a variance alert to admin. | Must |
| PK-09 | Open carton requests and unconfirmed declarations stay on the floor manager's and sub-admin's dashboards until closed. The order cannot be marked `Packed` while any are open. | Must |
| PK-10 | Packing: per floor, a checklist of that floor's lines; the floor manager ticks each line with quantity, enters the parcel count and uploads at least one parcel photo, then marks the floor's part packed. | Must |
| PK-11 | Orders spanning floors show `Partially packed` until every floor finishes, then move to `Ready for dispatch`. | Must |
| PK-12 | If an order is cancelled after picking, the floor manager returns the items to a bin and the system posts the reverse entries. | Must |

Acceptance: an order for 1 carton + 2 packs of a 6-pack variant with no opened carton ends with 1 sealed carton picked, 1 carton opened, 2 packs sold, 4 packs in loose stock in a named bin, one approved request and one confirmed declaration, all visible in the audit log.

### B12. Dispatch and delivery (DL)

| ID | Requirement | Priority |
| --- | --- | --- |
| DL-01 | Dispatch screen per unit lists orders `Ready for dispatch` with packages per floor. The delivery manager confirms all packages have reached the dispatch point. | Must |
| DL-02 | Dispatch mode per order: Delivery team or Self delivery. | Must |
| DL-03 | Delivery team: the delivery manager assigns a rider. The rider gets an in-app notification and sees address, map link, client contact and package count. | Must |
| DL-04 | Marking `Out for delivery` sends the client a WhatsApp message with a 4-digit delivery OTP. | Must |
| DL-05 | Delivery proof: rider enters the client's OTP, or, if unavailable, uploads a photo and the receiver's name. Time and browser location (if permitted) are saved. | Must |
| DL-06 | Failed delivery needs a reason (not available, refused, wrong address). The order returns to the unit and can be rescheduled. | Must |
| DL-07 | Self delivery: the delivery manager confirms the challan at handover with receiver name and OTP or photo. | Must |
| DL-08 | On delivery, a GST tax invoice is generated with a unit-wise number series (`INV-U1-YYMM-NNNNN`), HSN summary and the payment mode, available as PDF. The client gets a WhatsApp delivery message. | Must |
| DL-09 | An order closes when it is delivered and fully paid, or its balance is recorded as credit outstanding. | Must |

### B13. Dashboards and reports (RP)

| ID | Requirement | Priority |
| --- | --- | --- |
| RP-01 | Founder dashboard: sales today, this week and month; orders by status; pending confirmations and estimates; payments awaiting verification; credit outstanding and overdue; open carton requests; stock variances; low and expiring stock. | Must |
| RP-02 | Sales report filtered by date, unit, brand, product, client and payment mode, with tax breakdown and Excel export. | Must |
| RP-03 | Margin report by order, client, brand and product. Admin only. | Must |
| RP-04 | Stock report by location with valuation at cost (admin only) and stock ageing. | Must |
| RP-05 | Loss and variance report: adjustments, damages, samples and count variances by floor, user and period. | Must |
| RP-06 | Turnaround report: time spent in each order stage, by operator and floor. | Should |
| RP-07 | Accountant view: invoices, payments, GST summary by rate and HSN, and a Tally-ready Excel export of sales and receipt vouchers. | Must |
| RP-08 | Every list and report can be filtered by payment mode and exported to Excel. | Must |

### B14. Audit, notifications and settings (AUD, NOT, SET)

| ID | Requirement | Priority |
| --- | --- | --- |
| AUD-01 | Every create, update, approval, rejection and status change is logged with user, role, time, IP, entity, and before and after values. | Must |
| AUD-02 | The audit log is read-only for everyone, searchable by admins, and kept for the life of the system. | Must |
| NOT-01 | In-app notification centre per user with unread count; each notification links to its record. Events per role are in the Appendix. | Must |
| NOT-02 | Browser push notifications on the installed PWA for floor managers, riders and sub-admins. | Should |
| SET-01 | Settings: business name and logo, GSTIN per unit, number prefixes, UPI ID, bank details, estimate validity, confirmation SLA hours, expiry alert window, low-stock defaults, WhatsApp sender and templates. | Must |

## Part C: Non-Functional Requirements (NFR)

The system must be fast on a budget Android phone over 4G, safe with money and stock data, and cheap to run on one DigitalOcean server with a managed database.

### C1. Technology baseline

| Layer | Choice |
| --- | --- |
| Frontend | React with Next.js, TypeScript, installable PWA; one app with role-based routes, plus public catalog and estimate pages |
| Backend | Node.js with NestJS, TypeScript, REST API with OpenAPI docs |
| Database | PostgreSQL 16 on DigitalOcean Managed Database, migrations in code |
| Queue and cache | Redis with BullMQ for WhatsApp, notifications, PDFs and exports |
| File storage | DigitalOcean Spaces (S3 API) for photos, payment proofs and PDFs |
| Hosting | DigitalOcean Droplet (2 vCPU / 4 GB, Bangalore region), Docker Compose, Nginx, Let's Encrypt SSL |
| WhatsApp | Business API provider chosen by the client, behind an adapter (WA-01) |

Any change to this baseline needs PM sign-off before work starts.

### C2. Requirements

| ID | Area | Requirement |
| --- | --- | --- |
| NFR-01 | Performance | 95% of staff API calls respond within 500 ms at normal load; reports within 5 seconds for a 12-month range. |
| NFR-02 | Performance | Public catalog and estimate pages reach first content within 3 seconds on a 4G connection; images resized and served as WebP. |
| NFR-03 | Capacity | Handles 40 concurrent staff users and 200 orders a day with headroom to 5x on the same server size. |
| NFR-04 | Scalability | Units, floors and users are data, not code. Adding a third unit needs no deployment. |
| NFR-05 | Availability | 99.5% monthly uptime target. Planned maintenance outside 9 am to 9 pm IST with notice. |
| NFR-06 | Reliability | Stock-changing operations run in database transactions with row locking, so two users cannot allocate the same packs. Retried requests do not double-post (idempotency keys on create endpoints). |
| NFR-07 | Backup | Managed database daily backups with 7-day point-in-time recovery; Droplet weekly backups; Spaces versioning on. A restore is tested once before go-live. |
| NFR-08 | Recovery | Recovery point under 24 hours and recovery time under 4 hours. |
| NFR-09 | Security | HTTPS only with HSTS. Passwords hashed with bcrypt or argon2. JWT or session tokens with server-side revocation. |
| NFR-10 | Security | Role and floor checks enforced in the API layer for every endpoint; automated tests cover every role against every protected route. |
| NFR-11 | Security | Input validation on every endpoint, parameterised queries only, protection against OWASP Top 10 risks, rate limiting on login and public endpoints. |
| NFR-12 | Security | Public links use random tokens of at least 32 characters and expose only that estimate's data. Uploaded files are served through short-lived signed URLs, never public buckets. |
| NFR-13 | Security | Secrets live in environment variables, never in the repository. Database not reachable from the public internet. |
| NFR-14 | Data | Cost prices and margins never appear in any API response to non-admin roles. |
| NFR-15 | Data | Records are never hard-deleted; soft delete or disable only. Tax invoices and ledgers are kept for at least 72 months as GST law requires. |
| NFR-16 | Usability | Mobile-first for floor managers and riders: one-handed use, tap targets at least 44 px, large quantity steppers, works on Android 10+ with Chrome. |
| NFR-17 | Usability | Every destructive or irreversible action asks for confirmation. Every error message says what to do next. |
| NFR-18 | Localisation | All UI strings in resource files to allow Hindi later. Currency in ₹ with Indian digit grouping (₹1,25,000), dates as DD MMM YYYY, IST time zone. |
| NFR-19 | Compatibility | Latest two versions of Chrome, Edge and Safari on desktop; Chrome on Android; Safari on iOS for public pages. |
| NFR-20 | Offline tolerance | If the network drops on a floor screen, entered data is kept on the device and the user sees a clear unsynced state; nothing is silently lost. |
| NFR-21 | Observability | Structured logs, error tracking (Sentry or similar), uptime monitoring with alerts to the PM, and a health endpoint. |
| NFR-22 | Maintainability | Lint and formatting enforced in CI; unit tests on stock, allocation, pricing and payment logic with at least 70% coverage on those modules; README with setup in under 30 minutes. |
| NFR-23 | Environments | Separate staging and production with separate databases and WhatsApp test numbers. Deploys through CI from the main branch, with a rollback to the previous image. |
| NFR-24 | Documentation | OpenAPI spec kept current; ERD and environment variables documented; release notes per milestone. |
| NFR-25 | Cost | Running cost stays within the estimate (about ₹7,500 a month at go-live load). Any service that adds cost needs PM approval. |

## Appendix

### D1. Order status lifecycle

An order only reaches the warehouse after payment is verified or credit is approved, and only closes once it is delivered and settled.

[embedded content: order status lifecycle · 12 states]

A revision keeps the order at Estimate sent with a new version. A short pick with no stock elsewhere puts the order On hold until the sub-admin resolves it. A failed delivery returns to the unit and goes out again.

### D2. Core data model

| Entity | Key fields | Notes |
| --- | --- | --- |
| User, UserFloor | user_code, name, mobile, role, unit_id, status | Floors per user for scoping |
| Unit, Floor, Rack, Bin | name, code, active | Bin code `U1-F2-R05-B03`; each floor also has a Received and an In-transit location |
| Brand, Product, Variant | brand, category, HSN, GST rate, flavour, size, MRP, units_per_carton, sku_code | Variant is the stock item |
| Vendor, VendorPriceRule | variant, price_per_pack, min_cartons, payment_mode, delivery_days, valid_from, valid_to | Admin and accountant only |
| Client | mobile (unique), business, GSTIN, addresses, credit_limit, credit_days |  |
| Purchase, PurchaseLine, GRN, GRNLine | vendor invoice, quantities expected, received, short, damaged |  |
| Lot | variant, batch, expiry |  |
| StockLedger | variant, lot, bin, qty_packs (signed), sealed_or_loose, entry_type, ref_type, ref_id, user, created_at | Append-only source of truth |
| StockBalance | variant, lot, bin, sealed_packs, loose_packs, reserved_packs | Derived, updated in the same transaction as the ledger |
| OpenedCarton | variant, lot, bin, opened_by, approved_by, packs_remaining, status |  |
| Order, OrderLine, CallLog | number, client, status, source, SLA timestamps |  |
| Estimate, EstimateLine | order, version, status, payment_mode, token, valid_until, prices, tax | One active version per order |
| Payment, CreditApproval | amount, mode, UTR, proof_file, status, verified_by |  |
| Allocation, PickList, PickLine | order line, bin, lot, cartons, packs, floor |  |
| CartonOpenRequest, RemainingDeclaration | request, approval, packs left, bin, outcomes per pack |  |
| Package, Delivery | floor, parcels, photo, mode, rider, otp_hash, proof, status |  |
| Invoice, InvoiceLine | unit series number, HSN summary, payment_mode |  |
| Transfer, Adjustment, CycleCount | source, destination, reason, approval, counted vs system |  |
| WhatsAppMessage, Notification, AuditLog, Setting |  |  |

### D3. Notification matrix

| Event | Notified | Channel |
| --- | --- | --- |
| Catalog order placed | Operators; client | In-app; WhatsApp to client |
| Order unconfirmed at 24 hours | Admins | In-app |
| Order confirmed | Admins (to price) | In-app |
| Estimate sent or revised | Client | WhatsApp |
| Payment proof uploaded | Admins, sub-admins, accountant | In-app |
| Payment verified or rejected | Client | WhatsApp |
| Credit approval needed | Admins | In-app |
| Pick list created | Floor managers of those floors | In-app, push |
| Short pick or order on hold | Sub-admins | In-app |
| Carton-open request raised | Sub-admins | In-app, push |
| Request approved or rejected | Requesting floor manager | In-app, push |
| Remaining declaration mismatch | Admins | In-app |
| GRN variance, stock adjustment, count variance | Admins | In-app |
| Ready for dispatch | Delivery manager | In-app |
| Rider assigned | Rider | In-app, push |
| Out for delivery | Client | WhatsApp with OTP |
| Delivered or failed | Client; admins and operators on failure | WhatsApp; in-app |
| Credit overdue | Admins | In-app, daily |

### D4. Glossary

| Term | Meaning |
| --- | --- |
| Variant / SKU | One flavour and size of a product, e.g. Avatar ISO Pure Chocolate 5 lb |
| Pack | One retail unit of a variant; the base unit for all stock |
| Carton | A sealed box of a fixed number of packs, set per variant |
| Opened carton | A carton opened with approval; its packs are loose stock |
| GRN | Goods receipt note, the record of stock received |
| Estimate / challan | The priced proposal sent to the client before payment |
| FEFO | First expiry, first out |
| BSP | WhatsApp Business Solution Provider |
| UTR | Bank or UPI transaction reference number |
| PWA | Progressive web app, installable from the browser |