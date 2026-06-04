# IT-EIS Cleanup List

Tracking known issues, deferred improvements, and architectural cleanup items for the IT Equipment Inventory System.

**Legend:**
- `[ ]` Active / not started
- `[~]` Partially complete (see notes)
- `[x]` Closed

---

## Active Items

- [~] **#3 — Initial page load / API call optimization**
  Consolidate redundant lookups into single endpoints, parallelize fetches, add AbortController for StrictMode double-mounts.
  - ✅ `EquipmentAddEdit.jsx` — 22s → 2.57s via `/equipment/form-data` consolidation + AbortController + skeleton retention through abort. (Endpoint also serves employees as of MiscFixes02.)
  - ⏳ Remaining: `EquipmentReceipts`, `EquipmentList`, `EquipmentDetail`, `Assignments`, `BulkImport`.

- [ ] **#4 — Referential-integrity guard for Brand/Model edits** *(merged with former #5)*
  Brands/Models referenced by existing equipment need protection on edit/delete. Decide the approach — warn-on-edit-with-confirmation vs. append-only — and implement one. Feedback surfaces in the Maintenance modals.

- [ ] **#6 — Data freshness across pages (Zustand)**
  Shared lookup data (brands, models, suppliers, employees, equipment types) goes stale when edited in one place while another is open. Introduce Zustand as the single source of truth — Maintenance modals as writers, form/list pages as readers. Affects Equipment Add/Edit and Assignment List dropdowns.

- [ ] **#8 — Bulk Return action for assignments**
  Assignments can currently only be returned one at a time.

- [ ] **#9 — Build Dashboard page**
  Stubbed placeholder; future home for at-a-glance metrics.

- [ ] **#11 — Validate Brand names against special characters**
  Brand names become Excel named ranges in the import template; special chars (hyphens, ampersands) silently break the `INDIRECT()` dependent Model dropdown. Models, Suppliers, Employees, and Types are unaffected (never named ranges). Scope: `BrandController` validation + Maintenance modal feedback.
  - ⏳ Defer to #6 — Maintenance modals will be touched anyway.

- [ ] **#12 — Highlight just-imported records in Equipment List**
  Narrowed: the post-import success dialog already delivers the "navigate to what was created" half. Remaining piece is visually highlighting the newly imported rows on the list itself. (Prerequisite #13 now closed.)

- [ ] **#14 — Bulk Import error correction**
  Inline-edit failed rows directly in the UI instead of re-uploading the Excel file (validation errors only, not duplicate serials).

- [ ] **#15 — Intentional file-size cap on bulk imports**
  Currently 2MB by default; make it explicit and documented.

- [ ] **#16 — Bulk Import progress bar with chunked processing**
  Better UX for larger imports.

- [ ] **#17 — Download failure log as Excel after a partial import**
  Failed rows exported in template format for easy correction and re-upload.

- [ ] **#18 — Bulk Import history logging**
  Under a future Admin Logs feature.

- [ ] **#19 — Loading state on Employee duplicate-wizard "Add Anyway" button**
  Force-import button fires silently with no spinner.

- [ ] **#21 — PDF compression on upload** ⚠️ HIGH PRIORITY
  Real-world voucher PDFs exceed the 25MB cap, surfacing as silent "Upload failed" errors on the Receipt detail page and Bulk Attach Documents. Compress server-side on upload rather than raising the hard cap. Affects `DeliveryController::attachFile()`.

- [ ] **#22 — Optimize attachment logic**
  Clean up orphaned physical files from storage when an Attachment record is soft-deleted.

- [ ] **#24 — Replace public disk with signed temporary URLs**
  ~30-min expiry; required before internet deployment.

- [ ] **#25 — Audit for "reinventing the wheel": replace hand-rolled UI with library equivalents**
  Sweep the whole frontend for components we built from scratch that have mature, accessible library alternatives — prioritizing cases where our version likely misses keyboard navigation, ARIA/screen-reader support, or cross-browser consistency. Known first targets:
  - Native `<input list>` + `<datalist>` employee picker in `EquipmentAddEdit.jsx` (Assigned-on-creation) and the per-file delivery-match datalist in Bulk Attach Documents.
    → Candidate: Headless UI Combobox (`@headlessui/react`) — headless/unstyled, pairs with Tailwind, stays configurable per location. Headless UI is on v2; build against current syntax. Decision pending on adding the dependency.
  - Re-evaluate other custom selects, modals, and dropdowns the same way.

---

## Closed Items

- [x] **#1 — Optimistic locking on Equipment edit** *(CHK#7)*
  Backend compares `last_seen_updated_at` against current `updated_at`, returns 409 on mismatch. Frontend alerts the user and redirects to the list.

- [x] **#2 — Add `Assigned` status back to Equipment Add/Edit with guard logic** *(MiscFixes02)*
  Resolved in MiscFixes02 session — approach inverted from original intent. Rather than re-adding 'Assigned' to the manual status dropdown with a guard, the status is now action-driven: selecting 'Assigned' in add mode surfaces an employee picker, and the backend atomically creates both the Equipment and an Assignment row in a single DB::transaction(). 'Assigned' remains unreachable via the edit-mode dropdown, keeping the orphaned-status problem structurally impossible. Date defaults to record creation date; note defaults to 'Assigned upon record creation'. Frontend guard prevents submission if no valid employee is selected.

- [x] **#10 — Character-limit validation on Maintenance modal name fields** *(MiscFixes01)*
  `max:50` added to `name` validation in `store()` and `update()` across `BrandController`, `EquipmentTypeController`, `EquipmentModelController`, and `SupplierController`. Backend returns 422; Maintenance modals surface the error automatically.

- [x] **#13 — Search / filter on Equipment List**
  Server-side filter bar (status, condition, equipment type, supplier, serial number). Was the prerequisite for #12.

- [x] **#20 — Bulk Import for Delivery** *(CHK#7)*
  Template adds an Invoice No column; importer resolves deliveries via voucher/invoice matching with an in-memory same-batch cache and mismatch warnings; frontend surfaces warnings in amber alongside failures.

- [x] **#23 — `destroy()` in EquipmentController contradicted the no-delete policy** *(CHK#7)*
  Method now returns 403 with a rejection message instead of performing a hard delete.

---

## Retired / Merged

- **#5 — Brands/Models append-only with confirmation prompt** → merged into **#4**. Same underlying concern (protecting referenced Brand/Model records); #4 now frames "warn-on-edit" vs. "append-only" as the single decision to make.
- **#7 — Warn/block employee edit if active assignment exists** → dropped. Mis-framed: assignments reference employees by `employee_id`, so editing an employee's name or department doesn't threaten assignment integrity — there's no FK risk to guard against. (If *historical department attribution* on past assignments later becomes a real audit concern, that warrants a fresh, separately-scoped item — it is not what #7 described.)