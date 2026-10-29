# Vendored interfaces

Pinned copies of interfaces owned by the other Dome repositories, kept here until they are published. Each file records the commit it came from. Update them in their own pull request, never mixed with feature changes.

| Path | Source | How to refresh |
|---|---|---|
| `dome-backend/rules.json` | Rule metadata in `packages/engine/src/rules/*.ts` of [dome-backend](https://github.com/DOME-security/Dome-backend) | `node scripts/sync-rules.mjs <dome-backend checkout>`; parses the sources with the TypeScript compiler, executes nothing |
