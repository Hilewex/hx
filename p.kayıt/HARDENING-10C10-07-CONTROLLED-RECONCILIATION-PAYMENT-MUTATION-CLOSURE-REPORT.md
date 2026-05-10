# HARDENING-10C10-07: Controlled Reconciliation Payment Mutation

## 1. Paket Tanimi

Bu paket reconciliation worker dry-run sonucunda uretilen guarded owner command candidate'in yalniz explicit opt-in ile payment owner transition'a uygulanmasini ekler.

Bu paket live PayTR integration, order handoff, finance/risk/settlement/payout mutation, BFF route, scheduler/queue/background runtime veya DB migration paketi degildir.

## 2. Degisen Dosyalar

- `services/payment/src/reconciliation-worker.ts`
- `tests/smoke/suites/payment-reconciliation-controlled-mutation.ts`
- `tests/smoke/run-smoke.ts`
- `package.json`
- `HARDENING-10C10-07-CONTROLLED-RECONCILIATION-PAYMENT-MUTATION-CLOSURE-REPORT.md`

## 3. Explicit Opt-in Mutation Davranisi

`processPaymentReconciliationTaskDryRun()` input modeline `enableOwnerCommandApplication?: boolean` eklendi ancak default davranis degismedi. Dry-run fonksiyonu owner command candidate uretse bile payment mutation uygulamaz ve `mutationApplied=false` dondurur.

Yeni export:

- `processPaymentReconciliationTaskControlledMutation(input)`

Bu fonksiyon once mevcut dry-run akisinin aynisini calistirir:

- status inquiry
- reconciliation decision
- owner command eligibility
- guarded owner command candidate
- reconciliation task attempt/status update

Sonra yalniz `enableOwnerCommandApplication === true` iken guard seti gecerse `applyPaymentCallbackOwnerCommand()` cagrilir.

Task status davranisi: Bu paket successful payment mutation sonrasinda reconciliation task status'unu ayrica `reconciled` yapmaz. Task status mevcut decision/update akisinda `status_query_succeeded` olarak kalir. `reconciled` status upgrade'i bu pakette uygulanmamistir.

## 4. Guard / Eligibility / Command Apply Akisi

Controlled apply icin tum kosullar birlikte aranir:

- `enableOwnerCommandApplication === true`
- `ownerCommandEligibility.status === command_ready`
- `ownerCommandEligibility.shouldProcessPaymentMutation === true`
- `ownerCommandCandidate.commandType === MARK_PAYMENT_SUCCEEDED`
- `decision.decisionType === mark_reconciled_candidate`
- provider inquiry candidate `normalizedStatus === succeeded_candidate`
- `task.paymentAttemptId` mevcut

Fail-safe durumlar:

- opt-in false ise mutation yok
- candidate yoksa mutation yok
- eligibility `command_ready` degilse mutation yok
- command type `MARK_PAYMENT_SUCCEEDED` degilse mutation yok
- amount mismatch mutation uretmez
- currency mismatch mutation uretmez
- inconclusive / failed query mutation uretmez
- missing `paymentAttemptId` mutation uretmez
- manual review / retry / rejected durumlari mutation uretmez

## 5. Terminal Conflict ve Idempotency Kontrolu

Mevcut payment owner guard path'i korunmustur:

- `reconciliation_worker` source sadece `MARK_PAYMENT_SUCCEEDED` icin kabul edilir.
- `FAILED -> SUCCEEDED` reddedilir.
- `CANCELLED -> SUCCEEDED` reddedilir.
- Duplicate/idempotent tekrar uygulamada `alreadyApplied=true`, `applied=false` doner.

Terminal conflict sonucu:

- `applied=false`
- `ignored=true`
- error `PAYMENT_TERMINAL_STATE_CONFLICT`
- payment state degismez
- `mutationApplied=false`

## 6. Boundary / Owner Safety Kontrolu

- Default worker davranisi dry-run kaldi.
- Payment mutation sadece explicit opt-in controlled fonksiyonunda calisir.
- Sadece payment owner domain icindeki `applyPaymentCallbackOwnerCommand()` path'i kullanilir.
- Order state mutation yok.
- Finance/risk/settlement/payout mutation yok.
- Live PayTR request yok.
- Scheduler/queue/background runtime yok.
- BFF route degisikligi yok.
- Migration yok.
- Yeni DB tablo/kolon yok.
- `HARDENING_PROGRESS_RECORD` degistirilmedi.

Audit/outbox notu:

- Bu paket yeni audit/outbox implementation eklemez.
- Controlled payment truth mutation existing `applyPaymentCallbackOwnerCommand()` path'i uzerinden yapilir.
- Mevcut apply path audit/outbox uretmiyorsa bu paket bunu genisletmez.

## 7. Kapsam Disi Birakilanlar

- Live PayTR request
- Gercek PayTR HTTP cagrisi
- Gercek PayTR key/salt/env kullanimi veya talebi
- Order create / order handoff
- Finance / settlement / payout mutation
- Risk mutation
- BFF route
- DB migration
- Scheduler / queue / background runtime
- Yeni audit/outbox event implementation
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

### `pnpm run smoke:paytr-status-inquiry-mapping`

Result: PASS

Output:

```text
[PASS] paytr-status-inquiry-mapping - All PayTR status inquiry mapping tests passed.
```

### `pnpm run smoke:paytr-status-inquiry-adapter-boundary`

Result: PASS

Output:

```text
[PASS] paytr-status-inquiry-adapter-boundary - PayTR status inquiry adapter boundary assertions passed without live request usage.
```

### `pnpm run smoke:payment-reconciliation-decision`

Result: PASS

Output:

```text
[PASS] payment-reconciliation-decision - Payment reconciliation decision contract assertions passed without mutation decisions.
```

### `pnpm run smoke:payment-reconciliation-task-persistence`

Result: PASS

Output:

```text
[PASS] payment-reconciliation-task-persistence - Payment reconciliation task persistence assertions passed with in-memory repository and no owner mutations.
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

### `pnpm run smoke:payment-reconciliation-controlled-mutation`

Result: PASS

Output:

```text
[PASS] payment-reconciliation-controlled-mutation - Payment reconciliation controlled mutation assertions passed with explicit opt-in, terminal conflict, idempotency, and owner-boundary guards.
```

Controlled mutation smoke kapsami:

- Default dry-run: opt-in false iken succeeded candidate olsa bile payment state degismez, `mutationApplied=false`.
- Explicit opt-in success: INITIATED / PROVIDER_REDIRECT_READY payment icin SUCCEEDED uygulanir, attempt SUCCEEDED olur, `mutationApplied=true`.
- Duplicate/idempotent: ikinci ayni command `alreadyApplied=true`, `applied=false`, state SUCCEEDED kalir.
- FAILED terminal conflict: `PAYMENT_TERMINAL_STATE_CONFLICT`, state FAILED kalir.
- CANCELLED terminal conflict: `PAYMENT_TERMINAL_STATE_CONFLICT`, state CANCELLED kalir.
- Amount mismatch: manual review, candidate/apply yok, mutation yok.
- Currency mismatch: manual review, candidate/apply yok, mutation yok.
- Inconclusive / failed query: retry eligibility, candidate/apply yok, mutation yok.
- Missing paymentAttemptId: `not_eligible`, candidate/apply yok, mutation yok.
- Result ve payment object shape icinde order/finance/risk/settlement/payout alanlari yok.

## 9. Kirmizi Bayrak / Sari Bayrak

Kirmizi bayrak: yok.

Sari bayrak: Controlled mutation existing `applyPaymentCallbackOwnerCommand()` path'i uzerinden payment truth yazar; bu paket yeni audit/outbox kaydi eklemez. Audit/outbox gereksinimi owner-domain kanitlariyla ayri pakette ele alinmalidir.

Sari bayrak: Successful controlled mutation sonrasinda reconciliation task status'u bu pakette `reconciled` yapilmaz; mevcut decision status'u `status_query_succeeded` olarak kalir.

## 10. Nihai Karar

HARDENING-10C10-07 — PASS WITH LIMITATION

Limitation: Bu paket explicit opt-in payment owner transition ile sinirlidir. Order handoff, finance/risk/settlement/payout mutation, scheduler/queue/background runtime, BFF route, migration ve yeni audit/outbox implementation kapsama alinmamistir.

## 11. Sonraki Paket Onerisi

Sonraki paket icin onerilen kapsam: reconciliation controlled mutation audit/outbox ve operator-controlled execution kayit modeli. Bu paket task `reconciled` status transition kurali, audit log, idempotent outbox ve order handoff'a gecmeden once owner-domain evidence modelini ayri kanitlamalidir.
