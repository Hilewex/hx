# HARDENING-10C10-03: Reconciliation Decision Contract / Task Model Foundation

## 1. Paket Tanımı

Bu paket payment reconciliation icin contract, task candidate modeli, reconciliation lifecycle status tipi ve pure decision helper foundation ekler.

Bu paket reconciliation runtime, worker, scheduler, queue, DB persistence, migration, payment mutation, PayTR live integration, order handoff veya finance/risk/settlement/payout mutation paketi degildir.

## 2. Değişen Dosyalar

- `packages/contracts/src/payment.ts`
- `tests/smoke/suites/payment-reconciliation-decision.ts`
- `tests/smoke/run-smoke.ts`
- `package.json`
- `HARDENING-10C10-03-RECONCILIATION-DECISION-CONTRACT-TASK-MODEL-CLOSURE-REPORT.md`

## 3. Eklenen Reconciliation Contract Tipleri

- `ReconciliationStatus`
  - `reconciliation_required`
  - `status_query_pending`
  - `status_query_succeeded`
  - `status_query_failed`
  - `status_query_inconclusive`
  - `manual_review_required`
  - `reconciled`
  - `reconciliation_rejected`
- `PaymentReconciliationTriggerReason`
- `PaymentReconciliationTaskCandidate`
- `PaymentReconciliationDecisionType`
- `PaymentReconciliationDecision`
- `PaymentReconciliationDecisionInput`

`PaymentReconciliationTaskCandidate` sadece persistence-neutral contract/model olarak eklendi. Repository, migration, worker veya scheduler eklenmedi.

## 4. Decision Helper Davranışı

Eklenen saf helper:

- `createPaymentReconciliationTaskCandidate()`
- `decidePaymentReconciliationAction()`

Decision davranislari:

- `payment_pending` / `payment_unknown_result` -> `schedule_status_query`
- `status_query_inconclusive` ve `attemptCount < maxAttempts` -> `retry_status_query`
- `status_query_inconclusive` ve `attemptCount >= maxAttempts` -> `require_manual_review`
- `succeeded_candidate` -> `mark_reconciled_candidate`
- `rejected_amount_mismatch` -> `require_manual_review`
- `rejected_currency_mismatch` -> `require_manual_review`
- `status_query_failed` ve `attemptCount < maxAttempts` -> `retry_status_query`
- `status_query_failed` ve `attemptCount >= maxAttempts` -> `require_manual_review`
- `terminal_conflict` -> `require_manual_review`

Tum kararlar icin `shouldProcessPaymentMutation` sabit olarak `false` kalir.

## 5. Boundary / Owner Safety Kontrolü

- Tum task/decision ciktilari `createProviderBoundaryFlags()` ile safe boundary flag tasir.
- `businessTruthMutated=false`
- `ownerStateMutated=false`
- `eventTruthMutated=false`
- `outboxDeliveryGuaranteed=false`
- Payment owner state mutation eklenmedi.
- Provider status inquiry sonucu business truth olarak islenmedi.
- Decision helper payment mutation komutu uretmez.

## 6. Kapsam Dışı Bırakılanlar

- Live PayTR request
- Gercek PayTR HTTP cagrisi
- Gercek PayTR key/salt/env kullanimi veya talebi
- Payment state mutation
- Worker runtime
- Reconciliation scheduler / queue
- Repository / persistence
- Migration
- BFF route degisikligi
- Order create / order handoff
- Finance / settlement / payout mutation
- Risk mutation
- `HARDENING_PROGRESS_RECORD` degisikligi

## 7. Smoke/Test Kanıtları

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

### `pnpm run smoke:payment-reconciliation-decision`

Result: PASS

Output:

```text
> hx-monorepo@1.0.0 smoke:payment-reconciliation-decision C:\gelistirme\HX
> tsx tests/smoke/run-smoke.ts payment-reconciliation-decision

Running smoke tests against http://localhost:3001
[PASS] payment-reconciliation-decision - Payment reconciliation decision contract assertions passed without mutation decisions.
```

## 8. Kırmızı Bayrak / Sarı Bayrak

Kirmizi bayrak: yok.

Sari bayrak: Bu paket runtime veya persistence icermedigi icin reconciliation task lifecycle henuz calisan bir sistem davranisi degildir. Payment mutation sonraki kontrollu owner-command paketine birakildi.

## 9. Nihai Karar

HARDENING-10C10-03 — PASS WITH LIMITATION

Limitation: Bu paket sadece reconciliation contract/task model ve pure decision foundation paketidir. Canli PayTR entegrasyonu, worker/scheduler, persistence ve payment owner mutation kapsama alinmamistir.

## 10. Sonraki Paket Önerisi

Sonraki paket icin onerilen kapsam: reconciliation decision sonucunu owner-safe command modeline baglayan, fakat payment mutation uygulamasini yine kontrollu boundary guard altinda tutan ayrik paket.
