# Changelog

All notable changes to the **n8n-nodes-rentman** community node are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows a CalVer scheme `YY.Major.Minor-RentmanAPIVersion`.

## [26.6.0-1.16.0] – unreleased

Tracks Rentman API **v1.16.0** (covers v1.14.0, v1.15.0 and v1.16.0).

### Added
- **Project Status** resource (`GET /projectstatuses`, `GET /projectstatuses/{id}`) for project lifecycle statuses (Inquiry, Concept, Option, Confirmed). API v1.15.0.
- **Warehouse Status** resource (`GET /warehousestatuses`, `GET /warehousestatuses/{id}`) for warehouse statuses (Confirmed, Prepped, On Location, Returned, …). API v1.15.0.
- Custom fields (API v1.16.0): the **Fields** filter accepts `custom_N`, **Custom Query Parameters** accept custom fields with the normal operators (e.g. `custom_3[gt]`), and **Expand** accepts item-type custom fields and child fields. Field descriptions and the README were updated accordingly.
- **Full API coverage.** The node now offers every one of the 314 operations in Rentman's OpenAPI spec v1.16.0 (before: 236) and every writable field, except two that have no effect: Task → Public (see Removed) and Crew Availability → Last Updated / Last Updater, which Rentman overwrites on every save.
- **Create** for the records Rentman only creates under a parent, which the node could not create at all before: Contact Person (under a contact), Appointment Crew (appointment), Cost, Subproject, Project Function and Project Function Group (project), Payment (invoice), Project Request Equipment (project request) and Stock Movement (equipment).
- **Time Registration → Create For Leave Request** (`POST /leaverequest/{id}/timeregistration`) adds the hours of a leave request. Rentman can only approve or reject a leave request that has hours; without them it answers HTTP 500.
- **Get For Parent** on 35 resources: lists a parent's records through Rentman's sub-collection endpoints (66 endpoints, e.g. the crew of a project, the files of a contact, the payments of an invoice). It takes Return All, Limit, Offset, Filters and Custom Query Parameters like Get Collection.
- Missing writable fields: Contact (46, e.g. invoice address, house numbers, districts, discounts, bank details, default and admin contact person, folder), Equipment (24, e.g. dimensions, weights, power, shop texts, archive, debit ledger), Project Request (26, e.g. contact and location details, usage period, in/out, price), Project Request Equipment (10), Cost (9), Crew Availability (recurrence), Time Registration (duration, travel time, correction, lunch; crew member and leave type on update), Appointment (color, location, public, plannable) and Leave Request (reviewer, reviewed on).
- **Custom Fields** (JSON, e.g. `{"custom_1": "text"}`) on every create and update whose API schema has custom fields.
- Field descriptions now state the rules Rentman applies without an error, found in the live run: a time registration needs a leave type (HTTP 500 otherwise); Correction Duration is kept only for correction leave types; a task's Time Budget (seconds) is reset with Assignment Type Creator Only; company contacts lose First Name, Surname Prefix and Last Name, private contacts lose Name; Can Edit Content During Planning is kept only for sets, Strict Container Content not at all; Crew Availability keeps only the date of Recurrence End Date.

### Removed (breaking)
- **Crew → Get Collection → Filters → External**. Rentman removed the `external` field from `/crew` in API v1.14.0, so the filter no longer has any effect. Workflows that set it should drop it.
- **Project → Create**: Color, Conditions, Customer, Project Type, Remark and Status. Rentman rejects every one of them on create ("You are not permitted to set the following field" / "not recognised"), so any Create that used them failed. Only Name, Custom Reference and the new Number field remain. This also answers whether a `/projectstatuses` path can be set on create: it cannot.
- **Task → Create/Update → Public**. Rentman's validator rejects every value for `public`: its schema requires a string whose value is one of the integers 0 or 1, which nothing can satisfy (checked with true/false, 0/1 and "0"/"1" directly against the API).
- **Time Registration → Update → Status**. Rentman answers "You are not permitted to set the following field: status".
- **Appointment Crew → Update → Remark** (not a field of appointment crew).

### Fixed
Found by running every operation live in n8n against the real Rentman API:
- **Vehicle → Create / Create For Stock Location failed with HTTP 500** for any input: Rentman requires a cost rate. Cost Rate is now a required field on both.
- **Time Registration → Break Duration** was labelled minutes, but Rentman stores seconds (a 30-minute break is 1800). The field is now labelled "(Seconds)"; the value is sent unchanged, so workflows that entered minutes should multiply by 60. The new Duration, Travel Time and Correction Duration fields are in seconds too.
- **Dates on every create/update were rejected.** n8n's date picker produces `2027-03-01T09:00:00`, Rentman only accepts date-times with an offset and answered HTTP 400. All date fields in request bodies now get the offset of the workflow's timezone (`2027-03-01T09:00:00+01:00`); values that already carry an offset are sent unchanged. This broke Appointment, Time Registration, Crew Availability, Project Request, Leave Mutation, Serial Number, Task, Vehicle, Payment and Stock Movement writes.
- **Create/Update with no optional field filled in** sent no body, which Rentman rejects ("Unknown error parsing request body"). An empty JSON object is sent now.
- **Return All stopped with HTTP 400 on page 2** whenever Sort, Limit or Offset was in the first request: n8n re-appended them to Rentman's `next_page_url`, and Rentman does not allow them next to a cursor. Follow-up pages now use `next_page_url` as is (it already carries every filter). Shared by all 36 collection operations.
- **Boolean filters were inverted**: Rentman reads `true` as false. Crew → Active and Equipment → In Archive / In Planner now send `1`/`0`.
- **Six filters were rejected with "Unknown property"** and are now sent under Rentman's field names: Invoice Line → Invoice (`item`), Project Crew → Project Function (`function`), Project Equipment → Project Equipment Group (`equipment_group`), Project Function → Project Function Group (`group`), Project Request Equipment → Project Request (`project_request`), Sub Rental Equipment → Sub Rental Group (`subrental_group`).
- **Crew Availability → Create** posted to `/crewavailability`, which Rentman does not allow (403). It now posts to `/crew/{id}/crewavailability`; Crew Member accepts a path or an ID. Status options are now Available (`B`), Not Available (`N`) and Unknown (`O`) as the API defines them (the old `Y` was invalid).
- **Required fields Rentman enforces on update** are now required in the node: Crew Availability (Start, End), Appointment Crew (Crew), Payment (Payment Date), Stock Movement (Date), Supplier (Contact), Task Assignment (Crew), Equipment Sets Content (Content Equipment, also on create), Task and Task Status (Color). Project Request needs Plan Period Start/End on create too. Leave Request → Create needs an Approval Status, otherwise Rentman fails with HTTP 500 (default Pending; Canceled was added).
- **Wrong body keys**: Contact → Country (Visit) sent `visit_country` (now `country`); Contact Person → Last Name / Mobile sent `surname` / `mobile` (now `lastname` / `mobilephone`), and Contact Person got the address fields; Leave Mutation, Payment and Stock Movement send Description instead of an unknown `remark`; Payment → Date is `moment`; Stock Movement → Quantity is `amount`; Project Request → Customer is `linked_contact`; Project Request Equipment → Remark is `external_remark`.
- **Equipment → Type** offered Normal/Set/Consumable; Rentman accepts Item, Set and Case.
- **Custom Query Parameters**: the blank-row fix from 26.5.0 only covered resources that used the shared helper. 30 resources (all lookup resources such as Rate, Project Crew or Status, the equipment sub-resources Accessory, Actual Content, Equipment Assigned Serial, Equipment Sets Content, Repair and Serial Number, and File, File Folder and Folder) had their own copy of the field and still sent a malformed `&=` for an empty row, which Rentman rejects with HTTP 400. They now all use the shared, sanitized `customQueryParamsField`.

### Testing
- New live harness (`test/e2e/run-live.sh`): runs every operation inside n8n 2.40.7 against the real Rentman API. Reads use real records and check that Get returns the record and that every filter, Fields, Sort, Expand and Custom Query Parameter is accepted and still returns the record; Return All is compared page by page with the API; writes create "n8n-e2e TEST" records, update every field, read the record back to see what Rentman stored, and delete everything that can be deleted.
- New `test/e2e` harness runs every resource and operation (now 255 operations, each with only required and with all optional fields) inside a real n8n 2.40.7 instance against an HTTPS mock of `api.rentman.net`, checks method, URL, auth and every query/body field, runs n8n's parameter validator on every parameter set, and checks Return All pagination. Result: 420/420 cases pass. It found the Custom Query Parameters bug above.

### Notes
- API v1.15.0 moves `planperiod_start`, `planperiod_end`, `usageperiod_start`, `usageperiod_end`, `is_delayed` and `duration` from **Project Equipment Group** to **Project Equipment**. Both endpoints return them until Q4 2026, after that only Project Equipment does. Both resources are read-only in this node, so the fields show up automatically; workflows that read them from Project Equipment Group should switch to Project Equipment.
- API v1.15.0 no longer allows writing a warehouse status to a subproject's `status`. This node does not write subproject statuses.
- The existing **Status** resource (`/statuses`) is kept for backwards compatibility.
- `created`/`modified` nullability corrections (v1.13.0, v1.14.0) only affect response schemas; no node change needed.

## [26.5.0-1.13.0] – 2026-06-02

Tracks Rentman API **v1.13.0**.

### Added
- **Expand** field on every read operation (Get, Get Collection, and all read sub-resource operations) across every resource. Maps to the new `expand` query parameter introduced in Rentman API v1.13.0: inline linked resources in the response instead of returning a path string. Accepts a comma-separated list of linkable field names and supports dot notation for nested expansion up to 3 levels (e.g. `equipment,equipment.creator`). Only `item`/`link` fields are expandable. Implemented as a single global field scoped by operation, so it appears wherever the node issues a GET and is hidden on Create/Update/Delete.

### Fixed
- **Custom Query Parameters**: a blank parameter row (key left empty) previously serialized to a malformed `&=` in the query string, which the Rentman API rejects with HTTP 400 — causing every request from that node to fail until the empty row was removed. Blank-key parameters are now stripped from the request via a `preSend` sanitizer (`stripBlankQueryKeys` in `descriptions/shared.ts`), so an empty row is a harmless no-op. Pre-existing since the Custom Query Parameters field was introduced (26.1.x); unrelated to the v1.13.0 API update.

### Notes
- v1.13.0 also corrected the OpenAPI spec to declare `created`/`modified` as non-nullable on the File, Subproject, and Task **response** schemas (previously `string | null`). These are read-only response fields; the node does not model response schemas, so no change was required.
- Verified the full OpenAPI diff (v1.12.0 → v1.13.0): no new endpoints, methods, schemas, request-body fields, required fields, or enum changes beyond the above.

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

[26.5.0-1.13.0]: https://github.com/huelsevoort/n8n-nodes-rentman/releases/tag/v26.5.0-1.13.0
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
