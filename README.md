<p align="center">
  <img src="https://raw.githubusercontent.com/huelsevoort/n8n-nodes-rentman/main/nodes/Rentman/rentman.svg" width="80" alt="Rentman" />
</p>

# n8n-nodes-rentman

[![npm version](https://img.shields.io/npm/v/n8n-nodes-rentman.svg)](https://www.npmjs.com/package/n8n-nodes-rentman)
[![npm downloads](https://img.shields.io/npm/dm/n8n-nodes-rentman)](https://www.npmjs.com/package/n8n-nodes-rentman)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![GitHub last commit](https://img.shields.io/github/last-commit/huelsevoort/n8n-nodes-rentman)](https://github.com/huelsevoort/n8n-nodes-rentman/commits/main)
[![GitHub issues](https://img.shields.io/github/issues/huelsevoort/n8n-nodes-rentman)](https://github.com/huelsevoort/n8n-nodes-rentman/issues)

Community node for [n8n](https://n8n.io) that integrates with the [Rentman API](https://api.rentman.net) — the rental management software for AV, event, and crewing companies.

> **Disclaimer:** This is an independent community integration and is not officially affiliated with or endorsed by Rentman.

---

## Versioning

This package uses the scheme **`YY.Major.Minor-RentmanAPIVersion`**, inspired by calendar versioning:

| Segment | Meaning | Example |
|---|---|---|
| `YY` | Year of release | `26` = 2026 |
| `Major` | Breaking changes | `1` |
| `Minor` | New features / fixes | `1` |
| `RentmanAPIVersion` | Rentman OpenAPI spec version this node targets | `1.8.1` |

**Example:** `26.1.1-1.8.1` — released in 2026, first major version, first minor update, built against Rentman API v1.8.1.

When Rentman releases a new API version, the `RentmanAPIVersion` segment is bumped. When the node itself gains new features or fixes without an API change, only `YY.Major.Minor` changes.

---

## Prerequisites

- n8n ≥ 1.0.0
- A Rentman account with API access
- A Rentman API token (JWT) — generated under **Configuration → Integrations**

---

## Installation

**Via n8n UI (recommended)**
1. Go to **Settings → Community Nodes → Install**
2. Enter `n8n-nodes-rentman` and confirm

**Self-hosted / manual**
```bash
npm install n8n-nodes-rentman
```

---

## Authentication

1. In Rentman: **Configuration → Integrations → Generate API token**
2. In n8n: add a **Rentman API** credential and paste the token
3. Click **Test credential** to verify

> Only the most recently generated token is valid. Generating a new one invalidates the previous one.

---

## Supported Resources

65 resources covering the full Rentman API v1.16.0: every one of its 314 operations, and every writable field except three that have no effect: Task Public (Rentman rejects every value), Crew Availability Last Updated/Last Updater and Stock Movement API Client (Rentman sets them itself). Resources marked **✏️** support write operations. **Get For Parent** lists the records of a parent through Rentman's sub-collection endpoints (e.g. the crew of a project or the payments of an invoice).

| Category | Resource | Operations |
|---|---|---|
| **Contacts** | Contact ✏️ | Create, Delete, Get, Get Collection, Update |
| | Contact Person ✏️ | Create, Delete, Get, Get Collection, Get For Parent, Update |
| **Projects** | Project ✏️ | Create, Get, Get Collection |
| | Subproject ✏️ | Create, Get, Get Collection, Get For Parent |
| | Contract | Get, Get Collection, Get For Parent |
| | Quote | Get, Get Collection, Get For Parent |
| | Project Crew | Get, Get Collection, Get For Parent |
| | Project Equipment | Get, Get Collection, Get For Parent |
| | Project Equipment Group | Get, Get Collection, Get For Parent |
| | Project Function ✏️ | Create, Get, Get Collection, Get For Parent |
| | Project Function Group ✏️ | Create, Get, Get Collection, Get For Parent |
| | Project Request ✏️ | Create, Delete, Get, Get Collection, Update |
| | Project Request Equipment ✏️ | Create, Delete, Get, Get Collection, Get For Parent, Update |
| | Project Type | Get, Get Collection |
| | Project Vehicle | Get, Get Collection, Get For Parent |
| **Crew & HR** | Crew | Get, Get Collection |
| | Crew Availability ✏️ | Create, Delete, Get, Get Collection, Get For Parent, Update |
| | Crew Rate | Get, Get Collection, Get For Parent |
| | Appointment ✏️ | Create, Delete, Get, Get Collection, Get For Parent, Update |
| | Appointment Crew ✏️ | Create, Delete, Get, Get Collection, Get For Parent, Update |
| | Invitation | Get, Get Collection, Get For Parent |
| | Leave Mutation ✏️ | Create, Get, Get Collection |
| | Leave Request ✏️ | Create, Get, Get Collection, Update |
| | Leave Type | Get, Get Collection |
| | Time Registration ✏️ | Create, Create For Leave Request, Delete, Get, Get Collection, Get For Parent, Update |
| | Time Registration Activity | Get, Get Collection, Get For Parent |
| **Equipment & Stock** | Equipment ✏️ | Create, Get, Get Collection, Update |
| | Accessory ✏️ | Create, Delete, Get, Get Collection, Get For Parent, Update |
| | Actual Content | Get, Get Collection, Get For Parent |
| | Alternative ✏️ | Create, Delete, Get, Get Collection, Get For Equipment, Update |
| | Equipment Assigned Serial | Get, Get Collection, Get For Parent |
| | Equipment Sets Content ✏️ | Create, Delete, Get, Get Collection, Get For Parent, Update |
| | Repair | Get, Get Collection, Get For Parent |
| | Serial Number ✏️ | Create, Delete, Get, Get Collection, Get For Parent, Update |
| | Stock Location | Get, Get Collection |
| | Stock Movement ✏️ | Create, Delete, Get, Get Collection, Get For Parent, Update |
| | Supplier ✏️ | Create, Delete, Get, Get Collection, Get File Folders, Get Files, Get For Equipment, Update |
| **Financial** | Invoice | Get, Get Collection |
| | Invoice Line | Get, Get Collection, Get For Parent |
| | Payment ✏️ | Create, Get, Get Collection, Get For Parent, Update |
| | Cost ✏️ | Create, Delete, Get, Get Collection, Get For Parent, Update |
| | Purchase Order | Get, Get Collection, Get File Folders, Get Files, Get Global Costs, Get Invoice Lines, Get Order Costs |
| | Purchase Order Cost | Get, Get Collection |
| | Purchase Order Global Cost | Get, Get Collection |
| **Sub-Rentals** | Sub Rental | Get, Get Collection |
| | Sub Rental Equipment | Get, Get Collection, Get For Parent |
| | Sub Rental Equipment Group | Get, Get Collection, Get For Parent |
| **Files & Folders** | File | Get, Get Collection, Get For Parent |
| | File Folder | Get, Get Collection, Get For Parent |
| | Folder ✏️ | Create, Get, Get Collection, Update |
| **Rates & Pricing** | Factor | Get, Get Collection, Get For Parent |
| | Factor Group | Get, Get Collection |
| | Rate | Get, Get Collection |
| | Rate Factor | Get, Get Collection, Get For Parent |
| | Tax Class | Get, Get Collection |
| | Ledger Code | Get, Get Collection |
| **Tasks** | Task ✏️ | Create, Create For Parent, Create Subtask, Create Task Assignment, Delete, Get, Get Collection, Get File Folders, Get Files, Get For Parent, Get Subtasks, Get Task Assignments, Update |
| | Task Status ✏️ | Create, Delete, Get, Get Collection, Update |
| | Subtask ✏️ | Delete, Get, Get Collection, Update |
| | Task Assignment ✏️ | Delete, Get, Get Collection, Update |
| **Misc** | Extra Input Field | Get, Get Collection |
| | Project Status | Get, Get Collection |
| | Status | Get, Get Collection |
| | Warehouse Status | Get, Get Collection |
| | Vehicle ✏️ | Create, Create For Stock Location, Delete, Get, Get Collection, Get For Parent, Update |

---

## Features

All **Get Collection** operations support:

| Feature | Details |
|---|---|
| **Return All** | Automatically follows `next_page_url` cursor pagination |
| **Limit** | 1–1,500 items per page (default: 50) |
| **Offset** | Skip N results for offset-based pagination |
| **Sort** | `+field` ascending / `-field` descending (e.g. `+name`, `-modified`) |
| **Filters** | Per-resource filters: name, code, status, date ranges, path references |
| **Date filters** | `Modified After/Before`, `Created After` using Rentman's relational operators |
| **Incremental sync** | `ID Greater Than` filter for efficient delta syncs |
| **Field selection** | `Fields` filter to request only specific fields (reduces payload), including custom fields as `custom_N` |
| **Custom field filters** | `Custom Query Parameters` accept custom fields with the normal operators (e.g. `custom_3[gt]`) |

### Expanding linked items

All **read** operations (Get, Get Collection, and read sub-resource operations) expose an **Expand** field. By default a field that references another resource returns a path string (e.g. `"/equipment/12"`); pass one or more field names to `Expand` to inline the full linked object instead. Accepts a comma-separated list and supports dot notation for nested expansion up to 3 levels.

```
Expand: equipment,equipment.creator
```

Item, link and child fields can be expanded, as can custom fields of an item type (`custom_N`). Requires Rentman API v1.13.0 or newer (child and custom fields: v1.16.0).

---

## API Limits

| Limit | Value |
|---|---|
| Requests per day | 50,000 |
| Requests per second | 10 |
| Max concurrent requests | 20 |
| Max items per page | 1,500 |

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a full version history, or browse the [GitHub releases](https://github.com/huelsevoort/n8n-nodes-rentman/releases).

---

## Links

- [Rentman API documentation](https://api.rentman.net)
- [Report an issue](https://github.com/huelsevoort/n8n-nodes-rentman/issues)

---

## License

[MIT](LICENSE)
