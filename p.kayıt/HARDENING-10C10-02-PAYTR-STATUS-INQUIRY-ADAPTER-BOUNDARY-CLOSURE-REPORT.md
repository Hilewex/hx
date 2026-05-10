# HARDENING-10C10-02R: PayTR Status Inquiry Adapter Boundary Remediation

## Final Decision

HARDENING-10C10-02R — PASS WITH LIMITATION

Limitation: this package remains a non-live PayTR status inquiry adapter boundary. It only maps explicit simulation responses and safe not-configured outcomes.

## Changed Files

- `services/payment/src/provider-adapter.ts`
- `tests/smoke/suites/paytr-status-inquiry-adapter-boundary.ts`
- `package.json`
- `HARDENING-10C10-02-PAYTR-STATUS-INQUIRY-ADAPTER-BOUNDARY-CLOSURE-REPORT.md`

`tests/smoke/run-smoke.ts` was already wired to the suite and did not require a code change.

## Remediation Summary

- `InternalSimulationPaymentProviderAdapter.statusInquiry()` no longer throws.
- When `simulationResponse` is provided, the adapter maps it with `mapPaytrStatusInquiryToReconciliationCandidate()` and returns a `ProviderResultEnvelope<NormalizedPaytrStatusInquiryCandidate>`.
- Envelope metadata is preserved:
  - `operation: statusInquiry`
  - `providerDomain: payment`
  - `providerName: internal_simulation`
  - `providerMode: simulation`
  - `idempotencyKey`
  - `correlationId`
- Candidate statuses map to provider operation statuses:
  - `succeeded_candidate` -> `succeeded`
  - `status_query_inconclusive` -> `unknown_result`
  - `status_query_failed` -> `failed`
  - `rejected_*` -> `rejected`
- Missing `simulationResponse` returns a safe `unknown_result` envelope with controlled non-retryable error.
- Not-configured status inquiry remains a safe `rejected` envelope with controlled error and no normalized candidate.
- The adapter boundary smoke suite now runs real assertions through `paytrStatusInquiryAdapterBoundarySmoke.run()`.
- `package.json` includes `smoke:paytr-status-inquiry-adapter-boundary`.

## Boundary Assertions

- No live PayTR request is implemented.
- No `fetch`, `axios`, `request`, `node:http`, or `node:https` usage is present in the provider adapter.
- No real PayTR key, salt, or env value was requested.
- No payment mutation was added.
- No order mutation or handoff was added.
- No finance, risk, settlement, or payout mutation was added.
- No worker, scheduler, queue, BFF route, repository change, persistence change, migration, or callback worker change was added.

## Verification Commands

### `pnpm run typecheck`

Result: PASS

Key output:

```text
> hx-monorepo@1.0.0 typecheck C:\gelistirme\HX
> pnpm -r typecheck

Scope: 57 of 58 workspace projects
...
apps/bff typecheck: Done
```

### `pnpm run build`

Result: PASS

Key output:

```text
> hx-monorepo@1.0.0 build C:\gelistirme\HX
> pnpm -r build

Scope: 57 of 58 workspace projects
...
apps/bff build: Done
```

### `pnpm run smoke:paytr-status-inquiry-mapping`

Result: PASS

Output:

```text
> hx-monorepo@1.0.0 smoke:paytr-status-inquiry-mapping C:\gelistirme\HX
> tsx tests/smoke/run-smoke.ts paytr-status-inquiry-mapping

Running smoke tests against http://localhost:3001
[PASS] paytr-status-inquiry-mapping - All PayTR status inquiry mapping tests passed.
```

### `pnpm run smoke:paytr-status-inquiry-adapter-boundary`

Result: PASS

Output:

```text
> hx-monorepo@1.0.0 smoke:paytr-status-inquiry-adapter-boundary C:\gelistirme\HX
> tsx tests/smoke/run-smoke.ts paytr-status-inquiry-adapter-boundary

Running smoke tests against http://localhost:3001
[PASS] paytr-status-inquiry-adapter-boundary - PayTR status inquiry adapter boundary assertions passed without live request usage.
```
