# IT-EIS Cleanup List

Tracking known issues, deferred improvements, and architectural cleanup items for the IT Equipment Inventory System.

**Legend:**
- `[ ]` Active / not started
- `[~]` Partially complete (see notes)
- `[x]` Closed

---

## Active Items

- [ ] **#2 — Add `Assigned` status back to Equipment Add/Edit with guard logic**
  Currently filtered out at the form level. Should be re-added with logic preventing manual setting when no active assignment exists.

- [~] **#3 — Initial page load time / API call optimization**
  Consolidate redundant lookups into single endpoints, parallelize fetches, add AbortController to handle StrictMode double-mounts.
  - ✅ `EquipmentAddEdit.jsx` done — 22s → 2.57s via `/equipment/form-data` consolidation + AbortController + skeleton retention through abort.
  - ⏳ Remaining: `EquipmentReceipts`, `EquipmentList`, `EquipmentDetail`, `Assignments`, `BulkImport`.

- [ ] **#4 — Warn user when editing Brand/Model referenced by existing equipment**
  Renaming or deleting a Brand/Model that's already in use should surface a confirmation.

- [ ] **#5 — Consider Brands/Models append-only with confirmation prompt**
  Architectural decision pending — restrict edits/deletes to preserve referential integrity.

- [ ] **#6 — Data freshness across pages (Zustand-based solution)**
  Reference data (brands, models, suppliers, employees, equipment types) goes stale when modified in one part of the app while another part is open. Approach: introduce Zustand as the single source of truth for shared lookup data, with Maintenance modals as writers and form/list pages as readers. Affects Equipment Add/Edit dropdowns, Assignment List dropdowns, etc.

- [ ] **#7 — Warn/block employee edit if active assignment exists**
  Similar to #4 but for the employee side of the relation.

- [ ] **#8 — Bulk Return action for assignments**
  Currently one assignment can be returned at a time.

- [ ] **#9 — Build Dashboard page**
  Stubbed placeholder. Future home for at-a-glance metrics.

- [ ] **#11 — Validate Brand names against special characters**
  Brand names become Excel named ranges in the bulk import template. Special characters 
  (hyphens, ampersands, etc.) break the INDIRECT() dependent Model dropdown silently.
  Models, Suppliers, Employees, and Equipment Types are unaffected — they never become 
  named ranges. Scope: `BrandController` validation + Maintenance modal feedback.
  - ⏳ Defer to #6 (Zustand refactor) — Maintenance modals will be touched anyway.

- [ ] **#12 — After bulk import, redirect to Equipment List with imported records highlighted**
  Currently the user lands back on the import screen with no visual link to what was just created. Prerequisite: #13.

- [ ] **#14 — Bulk Import error correction**
  Allow inline editing of failed rows directly in the UI instead of re-uploading the Excel file (errors only, not duplicate serial numbers).

- [ ] **#15 — Add intentional file size cap on bulk imports**
  Currently 2MB by default. Should be explicit and documented.

- [ ] **#16 — Bulk Import progress bar with chunked processing**
  Better UX for larger imports.

- [ ] **#17 — Download failure log as Excel after a partial bulk import**
  Failed rows exported in template format for easy correction and re-upload.

- [ ] **#18 — Bulk Import history logging**
  Under future Admin Logs feature.

- [ ] **#19 — Add Anyway / wizard OK button has no loading state**
  Force-import button in the Employee duplicate wizard fires silently with no spinner.

- [ ] **#21 — PDF compression on upload** ⚠️ HIGH PRIORITY
  Real-world voucher PDFs are exceeding the current 25MB cap, surfacing as silent
  "Upload failed" errors on both the Receipt detail page and Bulk Attach Documents.
  Compress PDFs server-side on upload rather than raising the hard cap.
  Affects: `DeliveryController::attachFile()`.

- [ ] **#22 — Optimize attachment logic**
  Clean up orphaned physical files from storage when Attachment record is soft-deleted.

- [ ] **#24 — Replace public disk with signed temporary URLs**
  30-min expiry, required before internet deployment.

---

## Closed Items

- [x] **#1 — Optimistic locking on Equipment edit** *(closed at CHK#7)*
  Backend compares `last_seen_updated_at` against current `updated_at`, returns 409 on mismatch. Frontend alerts user and redirects to list.

- [x] **#10 — Character limit validation on Maintenance modal name fields** *(closed this session)*
  Added `max:50` to `name` validation rules in `store()` and `update()` across four 
  controllers: `BrandController`, `EquipmentTypeController`, `EquipmentModelController`, 
  `SupplierController`. Backend returns 422 on violation; Maintenance modals surface the 
  error automatically.

- [x] **#13 — Add search functionality to Equipment List**
  Prerequisite for #12.

- [x] **#20 — Bulk Import for Delivery** *(closed at CHK#7)*
  Three phases: template adds Invoice No column, importer adds Delivery resolution logic with voucher/invoice matching + in-memory cache for same-batch grouping + mismatch warnings, frontend surfaces warnings in amber alongside failures.

- [x] **#23 — `destroy()` in EquipmentController contradicts no-delete policy** *(closed at CHK#7)*
  Method now returns 403 with rejection message instead of performing hard delete.