# src/vendor: placeholders for files owned by other Dome repositories

Everything in this folder is a **stand-in**. The real files belong to other repositories in the Dome Security org and are not published yet. Each copy is pinned to the commit it was made from. When the owning repository publishes the real file, replace the placeholder with it, check that the shape still matches what is written here, and delete this note for that file.

Update these files in their own pull request, never mixed with feature changes.

| File | Owned by | Pinned to | Status upstream |
|---|---|---|---|
| `openapi.json` | [dome-backend](https://github.com/DOME-security/Dome-backend) | `7cc41e8d7d925d153c0d7ef050ebcb6adc560a37` | Not published. Written by hand from `docs/api.md` and `packages/server/src/routes` at that commit. |
| `rules.json` | [dome-backend](https://github.com/DOME-security/Dome-backend) | `7cc41e8d7d925d153c0d7ef050ebcb6adc560a37` | Not published. Extracted from `packages/engine/src/rules/*.ts` by `scripts/sync-rules.mjs`. |

## `openapi.json`

An OpenAPI 3.1 document for the five endpoints the app calls. `pnpm generate:api` turns it into `src/lib/api-schema.ts` with `openapi-typescript`; CI fails if the generated file is stale. `info.x-source` records the commit.

Assumed shape of the API (JSON bodies; errors are `{ "error": string }` with a 4xx or 5xx status, and the app never shows that text):

| Request | Response |
|---|---|
| `POST /v1/scans` with `{ url: string, ref?: string }` (no other fields) | `202` new or `200` existing: `{ id, status, links: { self } }`; `400`, `429` |
| `GET /v1/scans/{id}` | `Scan` (below); `404` |
| `GET /v1/repos/{owner}/{repo}` | `{ repository: { owner, repo }, latestScan: Scan \| null, attestation: OnChainAttestation \| null }`. **Both null for a repository Dome has never seen** (status 200, not 404). |
| `GET /v1/indicators?limit=1..500&cursor=` | `{ indicators: { kind, value, campaign, evidence: string[] }[], nextCursor: string \| null }` |
| `GET /v1/indicators/{sha256}` | `{ sha256, known: false }` or `{ sha256, known: true, campaign, evidence: string[], ledger, txHash }` |

- `Scan`: `{ id, repository: { owner, repo, url }, ref: string | null, commit: string | null, pullRequest: number | null, status: "queued" | "running" | "done" | "failed", verdict: "clean" | "review" | "block" | "incomplete" | null, createdAt, startedAt, finishedAt, attestation: { tx } | null }`, plus `report` and `reportHash` **only once a report exists** (omitted, not null, before that) and `error` when `failed`.
- `report`: the engine's `ScanResult`: `{ tool: { name: "dome", version }, target, scope: "full" | "diff", verdict, findings, incomplete: { path, reason }[], stats: { filesInTree, filesInScope, rulesRun } }`.
- `Finding`: `{ ruleId, relatedRules: string[], severity: "info" | "review" | "block", reasonKey, reason, locations: { path, line?, column? }[], fixture?, allowed? }`. The app renders `locations[].path` as text and ignores `reason`.
- `reportHash`: lowercase hex SHA-256 of the report as canonical JSON (object keys sorted at every level, `undefined` dropped), matching `report-hash.ts`. The app recomputes it.
- `OnChainAttestation`: `{ commit, verdict, reportHash, attester, ledger, txHash, closedAt }`.
- Indicator `kind` in the backend index is `hash`, `marker`, `package` or `domain`. **This differs from the contract**, whose kinds are `task`, `font`, `config`, `script`, `package`.

## `rules.json`

Rule metadata the app uses for every word of a finding. `src/lib/rules.ts` imports it; `src/lib/rules.test.ts` checks the shape.

```json
{
  "source": { "repository": "https://github.com/DOME-security/Dome-backend", "commit": "<40-hex sha>", "path": "packages/engine/src/rules" },
  "rules": [
    {
      "id": "DOME-VSC-001",
      "title": "Task runs on folder open",
      "category": "autorun | payload | intel | stellar",
      "severity": "info | review | block",
      "summary": "One sentence; may contain `code` spans",
      "reasons": { "<reasonKey>": "Fixed sentence shown for findings with that reasonKey" },
      "why": "Why it matters, a few sentences",
      "references": [{ "title": "…", "url": "https://…" }]
    }
  ]
}
```

Assumptions: rule IDs match `DOME-[A-Z]{3}-\d{3}`; every `Finding.reasonKey` the API sends is a key of that rule's `reasons`; reference URLs are `https`. An unknown rule ID or reason key renders a generic label, never API text. Refresh with `node scripts/sync-rules.mjs <dome-backend checkout>`, which reads the TypeScript sources as syntax and executes nothing.
