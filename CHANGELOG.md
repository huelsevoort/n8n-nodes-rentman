# Changelog

All notable changes to the **n8n-nodes-rentman** community node are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows a CalVer scheme `YY.Major.Minor-RentmanAPIVersion`.

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

[26.2.1-1.11.0]: https://github.com/huelsevoort/n8n-nodes-rentman/releases/tag/v26.2.1-1.11.0
[26.2.0-1.11.0]: https://github.com/huelsevoort/n8n-nodes-rentman/releases/tag/v26.2.0-1.11.0
[26.1.11-1.9.0]: https://github.com/huelsevoort/n8n-nodes-rentman/releases/tag/v26.1.11-1.9.0
[26.1.10-1.9.0]: https://github.com/huelsevoort/n8n-nodes-rentman/releases/tag/v26.1.10-1.9.0
[26.1.9-1.9.0]: https://github.com/huelsevoort/n8n-nodes-rentman/releases/tag/v26.1.9-1.9.0
[26.1.8-1.9.0]: https://github.com/huelsevoort/n8n-nodes-rentman/releases/tag/v26.1.8-1.9.0
[26.1.7-1.8.1]: https://github.com/huelsevoort/n8n-nodes-rentman/releases/tag/v26.1.7-1.8.1
[26.1.6-1.8.1]: https://github.com/huelsevoort/n8n-nodes-rentman/releases/tag/v26.1.6-1.8.1
[26.1.1-1.8.1]: https://github.com/huelsevoort/n8n-nodes-rentman/releases/tag/v26.1.1-1.8.1
