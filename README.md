# n8n-nodes-rentman

A community node for [n8n](https://n8n.io) that integrates with the [Rentman API](https://api.rentman.net) — a rental management platform for AV, event, and staging companies.

> **API Version:** This node is built against **Rentman API v1.8.1** (released 2026-03-17).
> The OpenAPI spec is available at `https://api.rentman.net`.

---

## Features

| Resource | Operations |
|---|---|
| **Appointment** | Create, Delete, Get, Get Many, Update |
| **Contact** | Create, Delete, Get, Get Many, Update |
| **Crew** | Get, Get Many |
| **Equipment** | Get, Get Many |
| **Invoice** | Get, Get Many |
| **Project** | Create, Get, Get Many |
| **Quote** | Get, Get Many |
| **Stock Movement** | Delete, Get, Get Many, Update |
| **Subproject** | Get, Get Many |
| **Time Registration** | Create, Delete, Get, Get Many, Update |

All list operations support:
- **Cursor-based pagination** — follow `next_page_url` automatically
- **Return All** toggle to fetch all pages
- **Limit** (1–1500 items per page)
- **Sort** with `+field` / `-field` syntax
- **Filters** per resource (name, code, status, etc.)

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
/contacts/42        → customer on a project
/statuses/1         → status on a project
/crew/10            → crew member on a time registration
/leavetypes/3       → leave type on a time registration
```

### Read-only resources

The following resources are read-only in the Rentman API (GET only):
- Crew, Equipment, Invoice, Quote, Subproject

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
│   └── RentmanApi.credentials.ts     # JWT auth + credential test
├── nodes/
│   └── Rentman/
│       ├── Rentman.node.ts            # Main declarative node
│       ├── Rentman.node.json          # Codex metadata
│       ├── rentman.svg                # Node icon
│       └── descriptions/             # Per-resource operation & field defs
│           ├── AppointmentDescription.ts
│           ├── ContactDescription.ts
│           ├── CrewDescription.ts
│           ├── EquipmentDescription.ts
│           ├── InvoiceDescription.ts
│           ├── ProjectDescription.ts
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
