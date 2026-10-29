# Vendored interfaces

Pinned copies of interfaces owned by the other Dome repositories, kept here until they are published. Each file records the commit it came from. Update them in their own pull request, never mixed with feature changes.

| Path | Source | How to refresh |
|---|---|---|
| `dome-backend/rules.json` | Rule metadata in `packages/engine/src/rules/*.ts` of [dome-backend](https://github.com/DOME-security/Dome-backend) | `node scripts/sync-rules.mjs <dome-backend checkout>`; parses the sources with the TypeScript compiler, executes nothing |
| `dome-backend/openapi.json` | Written from `docs/api.md` and `packages/server/src/routes` of dome-backend, because it does not publish an OpenAPI document yet | Edit by hand against the commit in `info.x-source`, then `pnpm generate:api` (CI fails if `src/lib/api-schema.ts` is stale) |
