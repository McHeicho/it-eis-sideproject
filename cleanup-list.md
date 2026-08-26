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

- [ ] **#8 — Bulk Return action for assignments**
  Assignments can currently only be returned one at a time.

- [ ] **#11 — Validate Brand names against special characters**
  Brand names become Excel named ranges in the import template; special chars (hyphens, ampersands) silently break the `INDIRECT()` dependent Model dropdown. Models, Suppliers, Employees, and Types are unaffected (never named ranges). Scope: `BrandController` validation + Maintenance modal feedback.
  - ⏳ Defer to #6 — Maintenance modals will be touched anyway.
  - #11 revisit — Brand name special-character validation
  Originally deferred to #6 on "Maintenance modals will be touched anyway."
  They were — but #6's scope was cache wiring, not validation, so the actual
  `BrandController` + modal-feedback work #11 describes never happened. Fold
  in now while the modal's still warm, or re-open #11 standalone.

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
  - Collapsed sidebar icon alignment in `Layout.jsx` — current implementation uses manual 
    `justify-center` / `gap-3 px-3` className toggles per nav item. Brittle and repetitive. 
    → Candidate: revisit when doing the broader Headless UI audit, or extract a `SidebarNavItem` 
    component that encapsulates the collapsed/expanded styling logic in one place.

- [ ] **#26 — Disallow "Assigned" status in the Equipment bulk import**
  The bulk Excel import path can still create orphaned equipment — rows flagged
  `status = Assigned` with no matching `assignments` row — because the import
  was never covered by CHK9's assigned-on-creation fix (which only guards the
  single-record `EquipmentController::store()` path). Reject or strip `Assigned`
  on import so a unit can only become Assigned through the actual assignment
  flow (which creates the Assignment row). Exact mechanism (hard validation
  error vs. silent coercion to Available) to be decided when picked up.
  Pairs conceptually with the now-closed #2 structural fix.

 - [ ] **#29 — Evaluate Inertia.js adoption (exploratory, no urgency)**
  Other internal IT systems use Inertia.js, likely scaffolded via Laravel's
  Breeze/Jetstream + Inertia starter kits from day one. Adopting it here would
  mean replacing react-router-dom, the Sanctum bearer-token auth flow, and
  every controller's JSON responses with Inertia's session-based, prop-driven
  model — a full rewrite, not an additive change. Not connected to the shadcn
  UI migration; shadcn works fine on the current REST + SPA setup. Revisit
  only as its own deliberate initiative, with concrete reasons beyond
  "other systems have it."

- [ ] **#30 — Create a dark mode**
  Self-explanatory. This is a QoL update. There are no progress yet made
  regarding a dark mode integration. This will start as a planning phase
  which will then be integrated through the help of rewriting the frontend
  code and through the current installed UI framework.
  
- [ ] **#31 — Animation pass across the migrated UI (post-#25)**
  The AppDialog overlay shipped with an entrance/exit fade that contradicted
  the locked "static, no entrance animation" decision — caught and fixed
  during Phase 2 review. Use that as the trigger for a dedicated future pass:
  once the rest of the shadcn migration has landed, sweep modals, dropdowns,
  hover/focus states, and any other transition-bearing primitives for
  consistent, intentional motion (or deliberate absence of it) instead of
  whatever each component shipped with by default.
  - **Prerequisite: #25.** Don't animate-polish components that are still
    structurally mid-migration (Table, Badge, Card, Sidebar, etc. haven't
    been touched yet) — same diff-ambiguity reasoning as the state/
    form-fields sequencing call.

- [ ] **#32 — Frontend hook folder conventions.**
  Establish resources/js/queries/ for server-state (TanStack Query) hooks and resources/js/hooks/
  for generic React utility hooks. Migrate any ad-hoc hooks into the right bucket as they appear.
  Convention set during #6.

- [ ] **#33 — QueryClient defaults (`staleTime` etc.)**
  `Main.jsx`'s `QueryClient` has carried this comment since it was created:
  *"Plumbing only — no defaultOptions yet. staleTime/refetch behavior is a
  deliberate call once the first real query wires in (cleanup #6)."* That
  condition is now met. Every hook currently defaults to `staleTime: 0`. Decide
  app-wide default vs. per-hook tuning.

- [ ] **#34 — `ManageBranchesModal` — silent failure on the `branch_code` guard**
  The 422 blocking edits to ids 1/2 lands in a batch `console.error`,
  indistinguishable from a dropped connection. Likely wants prevention
  (disable the code field on those two rows client-side) over better error
  display, since the restriction is permanent, not conditional.
---

## Closed Items

- [x] **#1 — Optimistic locking on Equipment edit** *(CHK#7)*
  Backend compares `last_seen_updated_at` against current `updated_at`, returns 409 on mismatch. Frontend alerts the user and redirects to the list.

- [x] **#2 — Add `Assigned` status back to Equipment Add/Edit with guard logic** *(MiscFixes02)*
  Resolved in MiscFixes02 session — approach inverted from original intent. Rather than re-adding 'Assigned' to the manual status dropdown with a guard, the status is now action-driven: selecting 'Assigned' in add mode surfaces an employee picker, and the backend atomically creates both the Equipment and an Assignment row in a single DB::transaction(). 'Assigned' remains unreachable via the edit-mode dropdown, keeping the orphaned-status problem structurally impossible. Date defaults to record creation date; note defaults to 'Assigned upon record creation'. Frontend guard prevents submission if no valid employee is selected.

- [x] **#6 — Data freshness across pages (TanStack Query)**
  Shared reference data (branches, departments, suppliers, brands, models, employees)
  flows through TanStack Query on both the read and write side. Maintenance modal
  saves invalidate the relevant query prefixes; list/detail pages hold cached queries
  and refetch on invalidation.

  **Write side, closed this session:**
  - All five Maintenance modals (`ManageBranchesModal`, `ManageDepartmentsModal`,
    `ManageSuppliersModal`, `ManageBrandsModelsModal` — Brands + Models views —
    `ManageEmployeesModal`) migrated to `useMutation`.
  - Single `invalidateMaintenanceData()` helper, prefix-invalidating `lookups` /
    `employees` / `assignments` / `equipment` / `deliveries` — chosen over a
    per-entity map once recon showed the entity→cache matrix is close to
    universal, and app-wide `staleTime: 0` makes finer-grained invalidation a
    no-op for anything not currently mounted.
  - Writes-only by design: each modal's own local list stays on local state,
    refreshed by its existing fetch function inside `onSuccess`, alongside the
    invalidation call — both required, confirmed the hard way on the pilot
    (cutting the local refetch makes a save look like it silently reverted).
  - Picked up along the way: `handleRowChange`'s shallow-copy state mutation,
    fixed in all five modals; a second shallow-copy in the `rowErrors`-clearing
    block, fixed in the four multi-field surfaces (Departments, Branches,
    Employees, ModelsView).
  - Verified in-browser per modal: a rename in the modal's own table, and the
    same rename showing up on the page behind it, with no manual refresh.

  **Explicitly out of scope, not regressions:**
  - `Dashboard.jsx` and `BulkImport.jsx` — both still plain `useEffect` / local
    state, not in the TQ cache, unreachable by invalidation. Known, deliberate,
    tracked separately.
  - Save All's `Promise.all` fan-out (every row PUT, not just dirty ones) —
    untouched by design. Wants a dirty-row diff, which wants the error-UI pass
    first (per-row failure reporting has nowhere to go otherwise).

- [x] **#9 — Build Dashboard page** *(closed 2026-06-10)*
  Replaced placeholder with a role-aware dashboard. Admin view: KPI stat cards (total equipment + by type), department bar chart, status donut, and a 4-up alert grid (employees with no laptop, Lost/Missing, Under Repair, idle stock) each with a top-5 preview and "View all" link. User/viewer view: KPI cards + department bar only — trimmed payload gated server-side, not just hidden in the UI. Backed by a dedicated `GET /api/dashboard` endpoint (`DashboardController::index()`) returning pre-aggregated SQL. Recharts added as a dependency (v3.8.1); resolved a Vite/esbuild pre-bundling issue — fix is Vite ≥ 8.0.16, no package overrides required. Admin path verified live; non-admin path built and server-gated but unverifiable until a `role_id = 2` account exists in the DB.

- [x] **#10 — Character-limit validation on Maintenance modal name fields** *(MiscFixes01)*
  `max:50` added to `name` validation in `store()` and `update()` across `BrandController`, `EquipmentTypeController`, `EquipmentModelController`, and `SupplierController`. Backend returns 422; Maintenance modals surface the error automatically.

- [x] **#13 — Search / filter on Equipment List**
  Server-side filter bar (status, condition, equipment type, supplier, serial number). Was the prerequisite for #12.

- [x] **#20 — Bulk Import for Delivery** *(CHK#7)*
  Template adds an Invoice No column; importer resolves deliveries via voucher/invoice matching with an in-memory same-batch cache and mismatch warnings; frontend surfaces warnings in amber alongside failures.

- [x] **#23 — `destroy()` in EquipmentController contradicted the no-delete policy** *(CHK#7)*
  Method now returns 403 with a rejection message instead of performing a hard delete.

- [x] **#27 — Office & Branch assignment tracking** *(closed 2026-06-17)*
  Piece 1 (home office on employees, Head Office / Extension Office) was already
  complete. Piece 2 (branches) shipped this session: a `branches` table
  (code/name/optional manager, auto-uppercased code), full CRUD via
  `BranchController` + `ManageBranchesModal`, and the holder model on
  `assignments` — `employee_id` made nullable, a new nullable `branch_id` FK
  added, with exactly-one-holder enforced both by a DB `CHECK` constraint and
  by Laravel's `required_without`/`prohibits` validation pair. The Assign
  modal gained an Employee/Branch toggle (with a further Head Office/Extension
  Office sub-filter narrowing the employee list) so equipment can now be
  assigned directly to a branch with no named employee, fixing the original
  bug where branch-purchased equipment defaulted to Lost/Missing.

- [x] **#28 — AssignmentList: Location-aware redesign** *(closed 2026-06-17)*
  All three filters and nine table columns from the spec are in: Branches
  (All Branches → Head Office → Extension Office → branches alphabetically),
  Status (dynamically built from statuses actually present in the data,
  Assigned listed first), and Departments; table columns Equipment, Serial
  No., Branch, Department, Employee, Date Assigned, Date Returned, Status,
  and Actions, with Department/Employee correctly blank on branch-held rows.
  Naming decision resolved: kept "Branch" for both the filter and column
  header rather than switching to "Location"/"Site". The Department/Employee
  filters auto-hide when a literal branch is selected, since neither applies.
  The Actions column also gained a per-row "Assign" quick action for
  Available/Spare Unit/Lost/Missing equipment, pre-selecting that item in the
  modal. Along the way, the file was split into a shell plus
  `AssignmentAssignModal.jsx` / `AssignmentReturnModal.jsx`, addressing the
  separately-parked monolith-navigability concern as a side effect.

---

## Retired / Merged

- **#5 — Brands/Models append-only with confirmation prompt** → merged into **#4**. Same underlying concern (protecting referenced Brand/Model records); #4 now frames "warn-on-edit" vs. "append-only" as the single decision to make.
- **#7 — Warn/block employee edit if active assignment exists** → dropped. Mis-framed: assignments reference employees by `employee_id`, so editing an employee's name or department doesn't threaten assignment integrity — there's no FK risk to guard against. (If *historical department attribution* on past assignments later becomes a real audit concern, that warrants a fresh, separately-scoped item — it is not what #7 described.)