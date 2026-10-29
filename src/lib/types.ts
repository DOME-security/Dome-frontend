import type { components } from './api-schema';

// Response shapes from dome-backend, generated from the vendored OpenAPI
// document (vendor/dome-backend/openapi.json → src/lib/api-schema.ts via
// `pnpm generate:api`). Edit the OpenAPI file, never the generated one.

type Schemas = components['schemas'];

export type Severity = Schemas['Severity'];
export type Verdict = Schemas['Verdict'];
export type ScanStatus = Schemas['ScanStatus'];
export type Location = Schemas['Location'];
export type Finding = Schemas['Finding'];
export type IncompleteRead = Schemas['IncompleteRead'];
export type ScanReport = Schemas['ScanReport'];
export type Repository = Schemas['Repository'];
export type Scan = Schemas['Scan'];
export type CreatedScan = Schemas['CreatedScan'];
export type OnChainAttestation = Schemas['OnChainAttestation'];
export type RepoSummary = Schemas['RepoSummary'];
export type IndicatorLookup = Schemas['IndicatorLookup'];
export type IndicatorEntry = Schemas['IndicatorEntry'];
export type IndicatorPage = Schemas['IndicatorPage'];
export type ScanRequest = Schemas['ScanRequest'];
