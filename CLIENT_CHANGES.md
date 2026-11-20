# Client Change Requests — Demo Review (20 Nov 2026)

## Status Legend
- `[ ]` Not started
- `[~]` In progress
- `[x]` Done
- `[!]` Blocked — needs PM confirmation

---

## Tracking

### Master Data

| ID | Item | Status | Notes |
|----|------|--------|-------|
| MD-03a | Remove pack size from SKU code | `[x]` | Mock data SKUs updated; new format is BRAND-PRODUCT-FLAVOUR |
| MD-03b | Auto-generate SKU from product name + flavour (editable) | `[x]` | Auto-computes on product/flavour change; "Reset to auto" button |
| MD-08 | Inactive clients visible with "Inactive" tag; blocked from orders | `[x]` | Alert banner on detail page; Send Link + Create Order blocked; inactive mock client added |

### Inventory

| ID | Item | Status | Notes |
|----|------|--------|-------|
| INV-07 | Show inventory unit-wise (per warehouse unit) | `[ ]` | No schema change; join Bin→Floor→Unit in service, add unit filter to UI |
| INV-12 | Filter items expiring ≤ 6 months; sort by name or qty | `[x]` | Expiry filter dropdown + sort (A–Z, Qty↑) added to inventory page |

### Orders

| ID | Item | Status | Notes |
|----|------|--------|-------|
| ORD-06 | Show who approved each order (name + time) | `[x]` | `confirmedBy`/`confirmedByName` added to Order type; shown in order detail |

### Estimates

| ID | Item | Status | Notes |
|----|------|--------|-------|
| EST-07 | Show who approved each estimate (name + time) | `[x]` | `sentBy`/`sentByName`/`sentAt` added to Estimate type; shown in estimate detail |
| EST-10 | Show flavour and expiry on every estimate line | `[ ]` | Add `lotId?` to `EstimateLine`; derive flavour/expiry at render |
| EST-10/11 | Estimate line columns: Product \| Qty \| Serving \| E.P. \| MRP \| Total \| W/O | `[!]` | E.P. definition unclear; W/O tied to EST-05 — needs PM confirm |
| EST-09 | Lock stock 10 hrs after estimate sent; auto-release; configurable | `[ ]` | Add `stockLockHours` to AppSettings; add `reservedUntil?`+`reservedForEstimateId?` to StockBalance |
| EST-05 | W/O toggle on estimate | `[!]` | Needs PM confirmation on meaning |
| EST-03 | Remove GST from estimate | `[!]` | Needs PM confirmation — display-only or full removal? |
| Layout | Estimate layout: "Shri" header, To/From two-column, Proforma Invoice format | `[ ]` | Rebuild `estimate/[token]/_client.tsx` layout |

---

## Build Order

### Batch 1 — Low effort, no dependencies
1. `[x]` MD-08 — Inactive clients
2. `[x]` MD-03 — Auto SKU + remove pack size
3. `[x]` ORD-06 + EST-07 — Approval visibility
4. `[x]` INV-12 — Expiry filter

### Batch 2 — Medium, independent
5. `[ ]` INV-07 — Unit-wise inventory
6. `[ ]` EST-10 — Flavour + expiry on estimate lines
7. `[ ]` Estimate layout — Shri + To/From + Proforma Invoice

### Batch 3 — Medium, depends on settings
8. `[ ]` EST-09 — Stock lock after estimate sent

### Blocked — awaiting PM
9. `[!]` EST-03 — Remove GST
10. `[!]` EST-05 — W/O toggle
11. `[!]` EST-10/11 — Column restructure (E.P. + W/O definitions)
