# n8n-nodes-rentman

A community node for [n8n](https://n8n.io) that integrates with the [Rentman API](https://api.rentman.net) — a rental management platform for AV, event, and staging companies.

> **API Version:** This node is built against **Rentman API v1.8.1** (released 2026-03-17).
> The OpenAPI spec is available at `https://api.rentman.net`.

---

## Features

53 resources with full coverage of the Rentman API. Operations marked with ✏️ support write access (create/update/delete).

### Contacts

| Resource | Operations |
|---|---|
| **Contact** ✏️ | Create, Delete, Get, Get Many, Update |
| **Contact Person** ✏️ | Delete, Get, Get Many, Update |

### Projects

| Resource | Operations |
|---|---|
| **Project** ✏️ | Create, Get, Get Many |
| **Subproject** | Get, Get Many |
| **Contract** | Get, Get Many |
| **Quote** | Get, Get Many |
| **Project Crew** | Get, Get Many |
| **Project Equipment** | Get, Get Many |
| **Project Equipment Group** | Get, Get Many |
| **Project Function** | Get, Get Many |
| **Project Function Group** | Get, Get Many |
| **Project Request** ✏️ | Create, Delete, Get, Get Many, Update |
| **Project Request Equipment** ✏️ | Delete, Get, Get Many, Update |
| **Project Type** | Get, Get Many |
| **Project Vehicle** | Get, Get Many |

### Crew & HR

| Resource | Operations |
|---|---|
| **Crew** | Get, Get Many |
| **Crew Availability** ✏️ | Create, Delete, Get, Get Many, Update |
| **Crew Rate** | Get, Get Many |
| **Appointment** ✏️ | Create, Delete, Get, Get Many, Update |
| **Appointment Crew** ✏️ | Delete, Get, Get Many, Update |
| **Invitation** | Get, Get Many |
| **Leave Mutation** ✏️ | Create, Get, Get Many |
| **Leave Request** ✏️ | Create, Get, Get Many, Update |
| **Leave Type** | Get, Get Many |
| **Time Registration** ✏️ | Create, Delete, Get, Get Many, Update |
| **Time Registration Activity** | Get, Get Many |

### Equipment & Stock

| Resource | Operations |
|---|---|
| **Equipment** | Get, Get Many |
| **Accessory** | Get, Get Many |
| **Actual Content** | Get, Get Many |
| **Equipment Assigned Serial** | Get, Get Many |
| **Equipment Sets Content** | Get, Get Many |
| **Repair** | Get, Get Many |
| **Serial Number** | Get, Get Many |
| **Stock Location** | Get, Get Many |
| **Stock Movement** ✏️ | Delete, Get, Get Many, Update |

### Financial

| Resource | Operations |
|---|---|
| **Invoice** | Get, Get Many |
| **Invoice Line** | Get, Get Many |
| **Payment** ✏️ | Get, Get Many, Update |
| **Cost** ✏️ | Delete, Get, Get Many, Update |

### Sub-Rentals

| Resource | Operations |
|---|---|
| **Sub Rental** | Get, Get Many |
| **Sub Rental Equipment** | Get, Get Many |
| **Sub Rental Equipment Group** | Get, Get Many |

### Files & Folders

| Resource | Operations |
|---|---|
| **File** | Get, Get Many |
| **File Folder** | Get, Get Many |
| **Folder** | Get, Get Many |

### Rates & Pricing

| Resource | Operations |
|---|---|
| **Factor** | Get, Get Many |
| **Factor Group** | Get, Get Many |
| **Rate** | Get, Get Many |
| **Rate Factor** | Get, Get Many |
| **Tax Class** | Get, Get Many |
| **Ledger Code** | Get, Get Many |

### Misc

| Resource | Operations |
|---|---|
| **Status** | Get, Get Many |
| **Vehicle** | Get, Get Many |

---

### All list operations support

- **Cursor-based pagination** — follows `next_page_url` automatically
- **Return All** toggle to fetch all pages in one run
- **Limit** (1–1,500 items per page)
- **Sort** with `+field` / `-field` syntax (e.g. `+name`, `-modified`)
- **Filters** per resource (name, code, status, path references, etc.)

---

## Installation

### In n8n (Community Nodes)

1. Go to **Settings → Community Nodes**
2. Click **Install a community node**
3. Enter `n8n-nodes-rentman`
4. Confirm and restart n8n

### Self-hosted / manual

```bash
cd ~/.n8n
npm install n8n-nodes-rentman
```

---

## Authentication

The Rentman API uses **JWT Bearer tokens**.

1. Log into your Rentman account
2. Go to **Configuration → Integrations**
3. Generate a new API token
4. Copy the token — **only the most recently generated token is valid**

In n8n:
1. Create a new credential: **Rentman API**
2. Paste your JWT token in the **API Token** field
3. Click **Test** to verify connectivity

---

## API Limits

| Limit | Value |
|---|---|
| Requests per day | 50,000 |
| Requests per second | 10 |
| Max concurrent requests | 20 |
| Max items per page | 1,500 |

---

## Resource Notes

### References between resources

Rentman uses URI-style resource paths to link records. When creating or updating records that reference other resources, use the path format:

```
/contacts/42            → customer on a project
/statuses/1             → status on a project
/crew/10                → crew member on a time registration
/leavetypes/3           → leave type on a time registration / leave request
/projectfunctions/42    → project function on a project crew entry
/subprojects/42         → subproject on equipment/function groups
```

### Read-only resources

The following resources are read-only in the Rentman API (GET only):
Accessory, Actual Content, Contract, Crew, Crew Rate, Equipment, Equipment Assigned Serial, Equipment Sets Content, Factor, Factor Group, File, File Folder, Folder, Invitation, Invoice, Leave Type, Ledger Code, Project Crew, Project Equipment, Project Equipment Group, Project Function, Project Function Group, Project Type, Project Vehicle, Quote, Rate, Rate Factor, Repair, Serial Number, Status, Stock Location, Sub Rental, Sub Rental Equipment, Sub Rental Equipment Group, Tax Class, Time Registration Activity, Vehicle

### Pagination

All **Get Many** operations use Rentman's cursor-based pagination:
- Enable **Return All** to automatically follow all pages
- Or set a **Limit** (max 1,500) for a single-page fetch
- The node handles the `next_page_url` cursor automatically

---

## Development

```bash
# Install dependencies
npm install

# Build (TypeScript → dist/)
npm run build

# Watch mode
npm run dev

# Lint
npm run lint
npm run lint:fix
```

### Folder structure

```
n8n-nodes-rentman/
├── credentials/
│   └── RentmanApi.credentials.ts          # JWT auth + credential test
├── nodes/
│   └── Rentman/
│       ├── Rentman.node.ts                # Main declarative node
│       ├── Rentman.node.json              # Codex metadata
│       ├── rentman.svg                    # Node icon
│       └── descriptions/                 # Per-resource operation & field defs
│           ├── AppointmentDescription.ts
│           ├── AppointmentCrewDescription.ts
│           ├── ContactDescription.ts
│           ├── ContactPersonDescription.ts
│           ├── CostDescription.ts
│           ├── CrewDescription.ts
│           ├── CrewAvailabilityDescription.ts
│           ├── EquipmentDescription.ts
│           ├── EquipmentExtendedDescription.ts  # Accessories, Serials, Repairs, …
│           ├── FileDescription.ts               # Files, File Folders, Folders
│           ├── InvoiceDescription.ts
│           ├── InvoiceLineDescription.ts
│           ├── LeaveDescription.ts              # LeaveMutation, LeaveRequest
│           ├── LookupDescription.ts             # All remaining read-only resources
│           ├── PaymentDescription.ts
│           ├── ProjectDescription.ts
│           ├── ProjectRequestDescription.ts     # ProjectRequest + Equipment
│           ├── QuoteDescription.ts
│           ├── StockMovementDescription.ts
│           ├── SubprojectDescription.ts
│           ├── TimeRegistrationDescription.ts
│           └── index.ts
├── package.json
└── tsconfig.json
```

---

## Resources

- [Rentman API Docs](https://api.rentman.net)
- [n8n Community Nodes Docs](https://docs.n8n.io/integrations/creating-nodes/)
- [n8n Nodes Starter](https://github.com/n8n-io/n8n-nodes-starter)

---

## License

MIT
