# n8n-nodes-rentman

[![npm version](https://img.shields.io/npm/v/n8n-nodes-rentman.svg)](https://www.npmjs.com/package/n8n-nodes-rentman)
[![npm downloads](https://img.shields.io/npm/dm/n8n-nodes-rentman)](https://www.npmjs.com/package/n8n-nodes-rentman)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![GitHub last commit](https://img.shields.io/github/last-commit/huelsevoort/n8n-nodes-rentman)](https://github.com/huelsevoort/n8n-nodes-rentman/commits/main)
[![GitHub issues](https://img.shields.io/github/issues/huelsevoort/n8n-nodes-rentman)](https://github.com/huelsevoort/n8n-nodes-rentman/issues)

Community node for [n8n](https://n8n.io) that integrates with the [Rentman API](https://api.rentman.net) — rental management software for AV, event, and staging companies.

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

53 resources covering the full Rentman API. Resources marked **✏️** support write operations.

| Category | Resource | Operations |
|---|---|---|
| **Contacts** | Contact ✏️ | Create, Delete, Get, Get Many, Update |
| | Contact Person ✏️ | Delete, Get, Get Many, Update |
| **Projects** | Project ✏️ | Create, Get, Get Many |
| | Subproject | Get, Get Many |
| | Contract | Get, Get Many |
| | Quote | Get, Get Many |
| | Project Crew | Get, Get Many |
| | Project Equipment | Get, Get Many |
| | Project Equipment Group | Get, Get Many |
| | Project Function | Get, Get Many |
| | Project Function Group | Get, Get Many |
| | Project Request ✏️ | Create, Delete, Get, Get Many, Update |
| | Project Request Equipment ✏️ | Delete, Get, Get Many, Update |
| | Project Type | Get, Get Many |
| | Project Vehicle | Get, Get Many |
| **Crew & HR** | Crew | Get, Get Many |
| | Crew Availability ✏️ | Create, Delete, Get, Get Many, Update |
| | Crew Rate | Get, Get Many |
| | Appointment ✏️ | Create, Delete, Get, Get Many, Update |
| | Appointment Crew ✏️ | Delete, Get, Get Many, Update |
| | Invitation | Get, Get Many |
| | Leave Mutation ✏️ | Create, Get, Get Many |
| | Leave Request ✏️ | Create, Get, Get Many, Update |
| | Leave Type | Get, Get Many |
| | Time Registration ✏️ | Create, Delete, Get, Get Many, Update |
| | Time Registration Activity | Get, Get Many |
| **Equipment & Stock** | Equipment | Get, Get Many |
| | Accessory | Get, Get Many |
| | Actual Content | Get, Get Many |
| | Equipment Assigned Serial | Get, Get Many |
| | Equipment Sets Content | Get, Get Many |
| | Repair | Get, Get Many |
| | Serial Number | Get, Get Many |
| | Stock Location | Get, Get Many |
| | Stock Movement ✏️ | Delete, Get, Get Many, Update |
| **Financial** | Invoice | Get, Get Many |
| | Invoice Line | Get, Get Many |
| | Payment ✏️ | Get, Get Many, Update |
| | Cost ✏️ | Delete, Get, Get Many, Update |
| **Sub-Rentals** | Sub Rental | Get, Get Many |
| | Sub Rental Equipment | Get, Get Many |
| | Sub Rental Equipment Group | Get, Get Many |
| **Files & Folders** | File | Get, Get Many |
| | File Folder | Get, Get Many |
| | Folder | Get, Get Many |
| **Rates & Pricing** | Factor | Get, Get Many |
| | Factor Group | Get, Get Many |
| | Rate | Get, Get Many |
| | Rate Factor | Get, Get Many |
| | Tax Class | Get, Get Many |
| | Ledger Code | Get, Get Many |
| **Misc** | Status | Get, Get Many |
| | Vehicle | Get, Get Many |

---

## Features

All **Get Many** operations support:

| Feature | Details |
|---|---|
| **Return All** | Automatically follows `next_page_url` cursor pagination |
| **Limit** | 1–1,500 items per page (default: 50) |
| **Offset** | Skip N results for offset-based pagination |
| **Sort** | `+field` ascending / `-field` descending (e.g. `+name`, `-modified`) |
| **Filters** | Per-resource filters: name, code, status, date ranges, path references |
| **Date filters** | `Modified After/Before`, `Created After` using Rentman's relational operators |
| **Incremental sync** | `ID Greater Than` filter for efficient delta syncs |
| **Field selection** | `Fields` filter to request only specific fields (reduces payload) |

---

## Resource References

Rentman links records via URI-style paths. Use this format when referencing related resources:

```
/contacts/42          → customer on a project or project request
/crew/10              → crew member on a time registration or leave request
/leavetypes/3         → leave type on a leave request or time registration
/statuses/1           → status on a project
/subprojects/42       → subproject on equipment or function groups
```

---

## API Limits

| Limit | Value |
|---|---|
| Requests per day | 50,000 |
| Requests per second | 10 |
| Max concurrent requests | 20 |
| Max items per page | 1,500 |

---

## Development

```bash
npm install       # install dependencies
npm run build     # compile TypeScript → dist/
npm run dev       # watch mode
npm run lint      # run ESLint
npm run lint:fix  # auto-fix lint errors
npm run format    # run Prettier
```

**Project structure**

```
n8n-nodes-rentman/
├── credentials/
│   └── RentmanApi.credentials.ts
└── nodes/Rentman/
    ├── Rentman.node.ts              # declarative node entry point
    ├── rentman.svg                  # official Rentman icon
    └── descriptions/               # one file per resource group
        ├── AppointmentDescription.ts
        ├── ContactDescription.ts
        ├── EquipmentDescription.ts
        ├── LeaveDescription.ts
        ├── LookupDescription.ts     # all read-only resources
        ├── ProjectDescription.ts
        ├── ProjectRequestDescription.ts
        └── ...
```

---

## Links

- [Rentman API documentation](https://api.rentman.net)
- [n8n community nodes guide](https://docs.n8n.io/integrations/creating-nodes/)
- [Report an issue](https://github.com/huelsevoort/n8n-nodes-rentman/issues)

---

## License

[MIT](LICENSE)
