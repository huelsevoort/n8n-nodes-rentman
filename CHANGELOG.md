# Changelog

All notable changes to the **n8n-nodes-rentman** community node are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows a CalVer scheme `YY.Major.Minor-RentmanAPIVersion`.

## [26.4.2-1.12.0] – 2026-05-28

### Fixed
- **Critical**: workflows could not execute on n8n — every Rentman operation failed with `The workflow has issues and cannot be executed for that reason. Please fix them first.`, regardless of which resource or operation was selected. The cause was a `required: true` declaration on the `equipment` field inside the Equipment Sets Content **Additional Fields / Update Fields** collection (`nodes/Rentman/descriptions/EquipmentExtendedDescription.ts`). n8n's parameter validator walks `required: true` fields across the whole node without consulting the parent collection's `displayOptions`, so the empty value tripped validation for every Rentman node, even on read-only operations like `Contact → Get Collection`. The bug was introduced in **26.3.0-1.11.0** (Equipment Sets Content CRUD) and inherited by 26.4.0 and 26.4.1.
- Diagnosed by running n8n's own validator (`NodeHelpers.getNodeParametersIssues`) against an installed workflow node. The unpatched output was `{ parameters: { equipment: ['Parameter "Equipment (Path)" is required.'] } }` for every parameter set; the patched output is empty/legitimate for all operations.

### Removed
- Unpublished broken releases **26.4.0-1.12.0** and **26.4.1-1.12.0** from npm. They were affected by the same regression.

### Notes
- 26.4.1's peer-dependency revert (`n8n-workflow` back to `"*"`) is still included here — it was correct in spirit, just not the actual cause of the execution failure.

**Anyone on 26.3.0 through 26.4.1 should upgrade to this version.**

## [26.4.0-1.12.0] – 2026-05-26 [withdrawn]

> **Withdrawn 2026-05-28.** Affected by the regression fixed in 26.4.2-1.12.0 (every operation failed with "workflow has issues"). The features below are still in 26.4.2-1.12.0.

Tracks Rentman API **v1.12.0**.

### Added — new resources

- **Task** (`/tasks`) — full CRUD plus *Get For Parent* / *Create For Parent* for the 14 parent resources that link to tasks (Contact, Contact Person, Contract, Crew, Equipment, Invoice, Project, Purchase Order, Quote, Repair, Serial Number, Sub Rental, Supplier, Vehicle), plus *Get/Create Subtask*, *Get/Create Task Assignment*, *Get Files*, *Get File Folders*.
- **Task Status** (`/taskstatuses`) — full CRUD.
- **Subtask** (`/subtasks`) — Get, Get Collection, Update, Delete. (Create via Task → *Create Subtask*.)
- **Task Assignment** (`/taskassignments`) — Get, Get Collection, Update, Delete. (Create via Task → *Create Task Assignment*.)
- **Purchase Order** (`/purchaseorders`) — read-only, plus *Get Files*, *Get File Folders*, *Get Invoice Lines*, *Get Order Costs*, *Get Global Costs*.
- **Purchase Order Cost** (`/purchaseordercosts`) — read-only.
- **Purchase Order Global Cost** (`/purchaseorderglobalcosts`) — read-only.
- **Extra Input Field** (`/extrainputfields`) — read-only access to custom field configurations.

### Added — new write operations on existing resources

- **Equipment**: new **Update** operation (`PUT /equipment/{id}`).
- **Folder**: new **Create** and **Update** operations (`POST /folders`, `PUT /folders/{id}`).

### Changed — breaking field type corrections (boolean → string enum)

Multiple fields had their `boolean` type corrected to a string enum in the API. The node now sends the correct enum values; if you were sending booleans for any of these in 26.3.x, those calls will no longer be valid:

| Resource | Field | New enum values |
|---|---|---|
| Equipment | `is_physical` | `Physical equipment` / `Virtual package` |
| Equipment | `rental_sales` | `Rental` / `Sale` |
| Equipment | `stock_management` | `Track stock` / `Exclude from stock tracking` |
| Equipment Sets Content | `is_fixed` | `Available outside this combination` / `Reserved from stock` |
| Equipment Sets Content | `is_physically_connected` | `Will be removed when emptying combinations` / `Will remain in the combination when emptying combinations` |
| Vehicle | `multiple` | `plannable_once` / `plannable_multi` |

### Notes on hidden / undocumented changes

A diff of the OpenAPI specs (v1.11.0 → v1.12.0) surfaced a few items not in Rentman's published changelog:

- **Task** response includes a `tags` field (generated, hidden imports).
- ProjectFunction `*_schedule_is_start` fields use enum values `Start time` / `End time` (the changelog says `is_start` / `is_end`).
- File / FileFolder `itemtype` is now a string enum, but Rentman's changelog only described the type change (string ↔ integer) without listing the new enum values.
- Several response descriptions on Contract / Invoice / Quote schemas were tweaked ("Not visible in collection responses" → "Not visible in collection responses unless explicitly requested"). No behavioural impact.

### Notes on auto-surfaced fields

These are returned automatically when fetched — no node changes were required:

- **Project / Subproject**: `estimated_cost`, `planned_cost`, `actual_cost` (generated, request explicitly via the *Fields* filter).
- **File / FileFolder / InvoiceLine / Task**: `parent_api_path` (generated).

## [26.3.0-1.11.0] – 2026-05-07

Tracks Rentman API **v1.10.0** + **v1.11.0**. Catches up on write operations missed in 26.2.x.

### Added
- **Equipment**: new **Create** operation (`POST /equipment`).
- **Accessory**: now full CRUD — added **Create** (via `POST /equipment/{id}/accessories`), **Update** (`PUT /accessories/{id}`), **Delete**.
- **Equipment Sets Content**: now full CRUD — added **Create** (via `POST /equipment/{id}/equipmentsetscontent`), **Update**, **Delete**.
- **Serial Number**: now full CRUD — added **Create** (via `POST /equipment/{id}/serialnumbers`), **Update**, **Delete**.
- **Vehicle**: now full CRUD — added **Create** (`POST /vehicles`), **Create For Stock Location** (`POST /stocklocations/{id}/vehicles`), **Update**, **Delete**.

### Notes
- Rentman's published changelog lists `external` on contacts/contactpersons and `use_distance_from_location` / `use_travel_time_from_location` on projects. The OpenAPI spec instead places these fields on **Crew** and **Project Function** respectively, which is what this node follows.

## [26.2.1-1.11.0] – 2026-05-07

### Documentation
- Added this `CHANGELOG.md` file (also published as [GitHub releases](https://github.com/huelsevoort/n8n-nodes-rentman/releases)).
- README now lists the new Alternative and Supplier resources and links to the changelog.

## [26.2.0-1.11.0] – 2026-05-07

Tracks Rentman API **v1.11.0**.

### Added
- **Alternative** resource (`/alternatives`, `/equipment/{id}/alternatives`) — full CRUD plus *Get For Equipment* for retrieving alternatives linked to a specific equipment item.
- **Supplier** resource (`/suppliers`, `/equipment/{id}/suppliers`) — full CRUD plus *Get For Equipment*, *Get Files*, and *Get File Folders* sub-endpoints for the supplier ↔ equipment link.
- New **External** filter on the Crew resource for filtering freelance crew members.
- New response fields are surfaced automatically:
  - Crew: `external`
  - Project Function: `use_travel_time_from_location`, `use_distance_from_location`

## [26.1.11-1.9.0] – 2026-04-17

### Security
- Resolve lodash security vulnerabilities by bumping `n8n-workflow` to `2.17.0`, which transitively pulls in `lodash@4.18.1`:
  - [GHSA-r5fr-rjxr-66jc](https://github.com/advisories/GHSA-r5fr-rjxr-66jc) — Code Injection via `_.template` import key names.
  - [GHSA-f23m-r3pf-42rh](https://github.com/advisories/GHSA-f23m-r3pf-42rh) — Prototype Pollution via array path bypass in `_.unset` and `_.omit`.

## [26.1.10-1.9.0] – 2026-04-17

### Changed
- Use `NodeConnectionTypes.Main` for `inputs` / `outputs` instead of bare `'main'` string literals (n8n verification feedback, MEDIUM).
- Tighten the `n8n-workflow` peer dependency to `^2.13.1`.

### Added
- `icon: file:rentman.svg` on the Rentman API credential and a parallel gulp task that copies the SVG into `dist/credentials/` (n8n verification feedback, LOW).

### Build
- Updated `gulpfile.js` to copy icons in parallel for both nodes and credentials.
- Disabled outdated `n8n-nodes-base/node-class-description-inputs-wrong-regular-node` and `…-outputs-wrong` lint rules that conflict with the verification team's guidance.

## [26.1.9-1.9.0] – 2026-04-17

### Changed
- Republish following the n8n verification submission — no functional changes vs. 26.1.8-1.9.0; ensures provenance metadata is correct.

## [26.1.8-1.9.0] – 2026-04-17

Tracks Rentman API **v1.9.0**.

### Added
- **Custom Query Parameters** field on every *Get Collection* operation across all 53 resources, supporting field-value filters and relational operators (`field[gt]`, `field[lt]`, etc.).
- A consistent set of standard filters on every collection endpoint:
  - `Created After`, `Modified After`, `Modified Before`
  - `Fields` selector
  - `ID Greater Than` (for incremental sync)
  - `Sort` with `+`/`-` direction prefix
- New **Repair** status filter (`in-progress`, `completed`, `unrepairable`).
- New **Stock Movement** type enum values added in 1.9.0 are surfaced automatically.

### Changed
- Updated to Rentman API v1.9.0 (from v1.8.1).
- Invoice Line description now reflects the v1.9.0 wording.

## [26.1.7-1.8.1] – 2026-04-17

### Fixed
- npm publish republish to recover from a failed publish run.

## [26.1.6-1.8.1] – 2026-04-17

### Changed
- **License**: relicensed from Apache-2.0 to **MIT** to align with n8n community-node verification requirements. ([#license](LICENSE))

### Security
- Override `lodash` to `^4.18.1` to clear the open lodash Dependabot alerts.

### Added
- Author email in `package.json` so the n8n verification pipeline can resolve the author.
- `npm publish --provenance` in the publish workflow.

## [26.1.1-1.8.1] – 2026-03-29

### Added
- CalVer versioning scheme `YY.Major.Minor-RentmanAPIVersion`.
- *Get Collection* operations across all resources alongside *Get* by ID.
- GitHub Actions workflow to publish to npm on tag.

### Changed
- Aligned package metadata and README with Rentman branding.

[26.4.2-1.12.0]: https://github.com/huelsevoort/n8n-nodes-rentman/releases/tag/v26.4.2-1.12.0
[26.3.0-1.11.0]: https://github.com/huelsevoort/n8n-nodes-rentman/releases/tag/v26.3.0-1.11.0
[26.2.1-1.11.0]: https://github.com/huelsevoort/n8n-nodes-rentman/releases/tag/v26.2.1-1.11.0
[26.2.0-1.11.0]: https://github.com/huelsevoort/n8n-nodes-rentman/releases/tag/v26.2.0-1.11.0
[26.1.11-1.9.0]: https://github.com/huelsevoort/n8n-nodes-rentman/releases/tag/v26.1.11-1.9.0
[26.1.10-1.9.0]: https://github.com/huelsevoort/n8n-nodes-rentman/releases/tag/v26.1.10-1.9.0
[26.1.9-1.9.0]: https://github.com/huelsevoort/n8n-nodes-rentman/releases/tag/v26.1.9-1.9.0
[26.1.8-1.9.0]: https://github.com/huelsevoort/n8n-nodes-rentman/releases/tag/v26.1.8-1.9.0
[26.1.7-1.8.1]: https://github.com/huelsevoort/n8n-nodes-rentman/releases/tag/v26.1.7-1.8.1
[26.1.6-1.8.1]: https://github.com/huelsevoort/n8n-nodes-rentman/releases/tag/v26.1.6-1.8.1
[26.1.1-1.8.1]: https://github.com/huelsevoort/n8n-nodes-rentman/releases/tag/v26.1.1-1.8.1
