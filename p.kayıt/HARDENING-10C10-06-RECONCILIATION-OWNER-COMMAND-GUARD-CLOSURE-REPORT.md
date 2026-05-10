# HARDENING-10C10-06R: Reconciliation Owner Command Guard Fix

## 1. Paket Tanimi

Bu fix paketi 10C10-06 source review'da bulunan owner command guard eksiklerini kapatir. Reconciliation decision sonucundan payment owner command eligibility ve guarded owner command candidate uretimi korunur.

Bu paket live PayTR integration, otomatik payment mutation, order handoff, finance/risk/settlement/payout mutation, BFF route, scheduler/queue/background runtime veya DB migration paketi degildir.

## 2. Degisen Dosyalar

- `packages/contracts/src/payment.ts`
- `services/payment/src/payment.ts`
- `services/payment/src/reconciliation-worker.ts`
- `tests/smoke/suites/payment-reconciliation-owner-command-guard.ts`
- `tests/smoke/run-smoke.ts`
- `package.json`
- `HARDENING-10C10-06-RECONCILIATION-OWNER-COMMAND-GUARD-CLOSURE-REPORT.md`

## 3. Owner Command Eligibility Modeli

Contract seviyesinde eklendi:

- `PaymentReconciliationOwnerCommandEligibilityStatus`
- `PaymentReconciliationOwnerCommandEligibility`
- `decidePaymentReconciliationOwnerCommandEligibility(input)`
- `createPaymentReconciliationOwnerCommand(input)`

Eligibility status degerleri:

- `command_ready`
- `not_eligible`
- `requires_manual_review`
- `requires_retry`
- `rejected`

Guard kurali:

- `shouldProcessPaymentMutation` sadece `command_ready` ve `MARK_PAYMENT_SUCCEEDED` icin true olabilir.
- `paymentAttemptId` yoksa succeeded candidate olsa bile command uretilmez.
- Amount mismatch, currency mismatch, inconclusive, failed query ve manual review durumlari payment mutation uretemez.

## 4. Command Creation Guard Davranisi

`createPaymentReconciliationOwnerCommand()` sadece su durumda command uretir:

- eligibility `command_ready`
- command type `MARK_PAYMENT_SUCCEEDED`
- `paymentAttemptId` mevcut

Uretilmeyenler:

- `MARK_PAYMENT_FAILED`
- `MARK_PAYMENT_PENDING`
- `MARK_PAYMENT_UNKNOWN_RESULT`
- amount/currency mismatch command
- inconclusive/error/manual review command

Idempotency key deterministik:

```text
payment-reconciliation:{providerName}:{reconciliationRef or providerReference}:{paymentAttemptId}:{commandType}
```

Command source contract'i `reconciliation_worker` degerini destekleyecek sekilde kontrollu genisletildi. `applyPaymentCallbackOwnerCommand()` icinde `reconciliation_worker` source'u sadece `MARK_PAYMENT_SUCCEEDED` icin kabul edilir; diger command type'lar reddedilir.

10C10-06R terminal conflict fix:

- `FAILED -> SUCCEEDED` yasak kalir.
- `CANCELLED -> SUCCEEDED` yasaklandi.
- `SUCCEEDED -> FAILED` yasak kalir.
- Terminal conflict durumunda mutation yapilmaz.
- Result: `applied=false`, `ignored=true`, error `PAYMENT_TERMINAL_STATE_CONFLICT`.

## 5. Reconciliation Worker Entegrasyonu

Dry-run worker default davranisi korunmustur.

`processPaymentReconciliationTaskDryRun()` sonucuna eklendi:

- `ownerCommandEligibility`
- `ownerCommandCandidate`

Worker otomatik owner command execution yapmaz. `mutationApplied` her durumda false kalir. Repository uzerinde onceki paketle ayni sinirda sadece reconciliation task attempt/status guncellemeleri vardir.

Not: `services/payment` workspace'inin `@hx/contracts` path'i bazi typecheck baglamlarinda dist/source farki gosterdigi icin worker-local helper duplication korunmustur. Smoke testte contract helper ile worker helper'in ayni `succeeded_candidate` input icin ayni command identity/idempotency urettigi kanitlandi. Helper duplication retained with smoke equivalence proof.

## 6. Boundary / Owner Safety Kontrolu

- Boundary flag'leri eligibility ve command candidate uzerinde korunur.
- Dry-run worker default kalir.
- Payment mutation default calismaz.
- Worker owner command apply path'ine baglanmadi.
- `reconciliation_worker` source unsupported command type reddedilir.
- FAILED ve CANCELLED terminal state uzerine reconciliation succeeded command mutation yapamaz.
- Order state mutation yok.
- Finance/risk/settlement/payout mutation yok.
- Live PayTR request yok.
- Scheduler/queue/background runtime yok.
- BFF route degisikligi yok.
- Migration yok.

## 7. Kapsam Disi Birakilanlar

- Live PayTR request
- Gercek PayTR HTTP cagrisi
- Gercek PayTR key/salt/env kullanimi veya talebi
- Otomatik payment mutation
- Order create / order handoff
- Finance / settlement / payout mutation
- Risk mutation
- DB migration
- BFF route
- Scheduler / queue / background worker runtime
- `HARDENING_PROGRESS_RECORD` degisikligi

## 8. Smoke/Test Kanitlari

### `pnpm run typecheck`

Result: PASS

Key output:

```text
> hx-monorepo@1.0.0 typecheck C:\gelistirme\HX
> pnpm -r typecheck

Scope: 57 of 58 workspace projects
...
services/payment typecheck: Done
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
services/payment build: Done
...
apps/bff build: Done
```

### `pnpm run smoke:payment-reconciliation-decision`

Result: PASS

Output:

```text
[PASS] payment-reconciliation-decision - Payment reconciliation decision contract assertions passed without mutation decisions.
```

### `pnpm run smoke:payment-reconciliation-worker-dry-run`

Result: PASS

Output:

```text
[PASS] payment-reconciliation-worker-dry-run - Payment reconciliation worker dry-run assertions passed without live requests or owner mutations.
```

### `pnpm run smoke:payment-reconciliation-owner-command-guard`

Result: PASS

Output:

```text
[PASS] payment-reconciliation-owner-command-guard - Payment reconciliation owner command guard assertions passed with dry-run default and guarded succeeded-only command creation.
```

Ek 06R smoke kapsami:

- `reconciliation_worker + MARK_PAYMENT_SUCCEEDED` ve payment state `FAILED` iken `applied=false`, `ignored=true`, `PAYMENT_TERMINAL_STATE_CONFLICT`, state `FAILED` kalir.
- `reconciliation_worker + MARK_PAYMENT_SUCCEEDED` ve payment state `CANCELLED` iken `applied=false`, `ignored=true`, `PAYMENT_TERMINAL_STATE_CONFLICT`, state `CANCELLED` kalir.
- `reconciliation_worker` unsupported command type icin `RECONCILIATION_OWNER_COMMAND_TYPE_NOT_SUPPORTED` doner.
- Contract helper ve worker helper ayni succeeded candidate input icin ayni command identity/idempotency uretir.

## 9. Kirmizi Bayrak / Sari Bayrak

Kirmizi bayrak: yok.

Sari bayrak: Worker owner command candidate uretir ancak default olarak apply etmez. Controlled payment mutation uygulamasi explicit opt-in runtime ve daha genis owner-domain kanitlari ile sonraki pakette ele alinmalidir.

## 10. Nihai Karar

HARDENING-10C10-06R — PASS WITH LIMITATION

Limitation: Bu paket eligibility ve guarded owner command candidate foundation ile sinirlidir. Worker otomatik payment mutation yapmaz; order handoff, finance/risk mutation, scheduler/queue ve live PayTR runtime kapsama alinmamistir.

## 11. Sonraki Paket Onerisi

Sonraki paket icin onerilen kapsam: reconciliation owner command application icin explicit opt-in owner-domain transition paketi. Bu paket terminal state conflict, idempotency, audit/outbox ve operator-controlled execution guardlarini ayri kanitlamalidir.
