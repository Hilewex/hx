# HARDENING-10C10-09: Reconciliation Audit/Outbox + Task Finalization Guard

## 1. Paket Tanimi

Bu paket successful controlled reconciliation payment mutation sonrasinda reconciliation lifecycle finalization, audit evidence ve idempotent outbox/event evidence kanit paketidir.

Bu paket live PayTR integration, order handoff, finance/risk/settlement/payout mutation, BFF route, scheduler/queue/background runtime, DB migration veya yeni tablo/kolon paketi degildir.

## 2. Degisen Dosyalar

- `services/payment/src/reconciliation-worker.ts`
- `tests/smoke/suites/payment-reconciliation-audit-outbox-finalization.ts`
- `tests/smoke/run-smoke.ts`
- `package.json`
- `HARDENING-10C10-09-RECONCILIATION-AUDIT-OUTBOX-FINALIZATION-CLOSURE-REPORT.md`

## 3. Task Finalization Davranisi

Controlled mutation sonrasinda task finalization yalniz su kosullarda calisir:

- decision `mark_reconciled_candidate`
- owner command candidate `MARK_PAYMENT_SUCCEEDED`
- owner command apply result `applied=true`

Bu durumda reconciliation task status `reconciled` yapilir. Bu payment state mutation degildir; sadece reconciliation lifecycle final status update'idir ve yalniz reconciliation task repository uzerinden calisir.

Duplicate/alreadyApplied karari:

- `alreadyApplied=true`
- payment state `SUCCEEDED`
- payment attempt state `SUCCEEDED`
- decision ve owner command guard halen success reconciliation ile uyumlu

Bu kosullarda task `reconciled` yapilabilir. `mutationApplied=false` kalir; cunku ikinci calistirmada payment owner mutation yeniden uygulanmamistir.

## 4. Audit Evidence Davranisi

Successful finalization sonrasi audit evidence append edilir.

Audit action:

- `payment.reconciliation.completed`

Audit alanlari:

- `ownerService=payment`
- `entityType=payment`
- `entityId=paymentId`
- `actorType=SYSTEM`
- `actorId=reconciliation-worker`
- `correlationId`
- deterministic reconciliation completion idempotency key
- before/after state summary
- metadata:
  - `reconciliationRef`
  - `paymentAttemptId`
  - `providerName`
  - `providerReference`
  - `normalizedStatus=succeeded_candidate`
  - `ownerCommandType=MARK_PAYMENT_SUCCEEDED`
  - `orderCreated=false`
  - `orderHandoff=false`
  - `financeMutation=false`
  - `riskMutation=false`

Audit business truth degildir. Audit append failure payment mutation'i geri almaz; result icinde evidence warning olarak doner.

Sari bayrak: mevcut audit repository API'sinde idempotency key conflict handling yoktur. Bu paket deterministik `auditId` ve idempotency key kullanir; smoke memory repository'de duplicate run tek audit kaydi ile kanitlanmistir. Postgres tarafinda duplicate deterministic `auditId` append failure warning'e dusebilir, fakat payment mutation rollback yapmaz.

## 5. Outbox Evidence Davranisi

Successful finalization sonrasi outbox evidence append edilir.

Topic:

- `payment.reconciliation.completed`

Payload:

- `paymentId`
- `paymentAttemptId`
- `checkoutId`
- `reconciliationRef`
- `providerName`
- `providerReference`
- `state=SUCCEEDED`
- `orderCreated=false`
- `orderHandoff=false`

Deterministic idempotency key:

```text
payment-reconciliation-completed:{reconciliationRef}:{paymentAttemptId}
```

Duplicate run ayni outbox idempotency key ile ayni outbox event'i dondurur. Topic `order.*` degildir ve payload order command tasimaz.

## 6. No Order Handoff Kaniti

Runtime assert'ler:

- controlled result order command shape tasimaz
- outbox payload order command shape tasimaz
- audit metadata `orderCreated=false`
- audit metadata `orderHandoff=false`
- outbox payload `orderCreated=false`
- outbox payload `orderHandoff=false`

Source-level assert'ler:

- `services/payment/src/reconciliation-worker.ts`
- `tests/smoke/suites/payment-reconciliation-audit-outbox-finalization.ts`

Import/call/topic seviyesinde su pattern'ler reddedildi:

- `services/order`
- `@hx/order`
- `createOrder(...)`
- `handoffToOrder(...)`
- `orderHandoff(...)`
- order command token
- `topic: 'order.`
- `topic: "order.`

Sonuc: order create / order handoff / order event trigger eklenmedi.

## 7. Negative Case Kanitlari

Yeni smoke icinde su durumlarda task finalization, audit ve outbox uretilmedigi kanitlandi:

- Default dry-run:
  - `mutationApplied=false`
  - payment state `INITIATED`
  - task `reconciled` degil
  - audit/outbox yok
- Amount mismatch:
  - task `manual_review_required`
  - `mutationApplied=false`
  - audit/outbox yok
- Currency mismatch:
  - task `manual_review_required`
  - `mutationApplied=false`
  - audit/outbox yok
- Inconclusive:
  - task `status_query_inconclusive`
  - `mutationApplied=false`
  - audit/outbox yok
- Failed query:
  - task `status_query_failed`
  - `mutationApplied=false`
  - audit/outbox yok
- FAILED terminal conflict:
  - payment `FAILED` kalir
  - `applied=false`
  - `alreadyApplied=false`
  - `mutationApplied=false`
  - task `reconciled` olmaz
  - audit/outbox yok
- CANCELLED terminal conflict:
  - payment `CANCELLED` kalir
  - `applied=false`
  - `alreadyApplied=false`
  - `mutationApplied=false`
  - task `reconciled` olmaz
  - audit/outbox yok
- Missing paymentAttemptId:
  - owner eligibility `not_eligible`
  - `mutationApplied=false`
  - task finalization yok
  - audit/outbox yok
- Duplicate success:
  - ikinci calistirmada `alreadyApplied=true`
  - `mutationApplied=false`
  - task `reconciled`
  - outbox idempotency key ayni
  - outbox event id ayni
  - audit kaydi tek
  - order handoff yok

## 8. Boundary / Owner Safety Kontrolu

- Live PayTR request yok.
- Gercek PayTR HTTP cagrisi yok.
- Gercek PayTR key/salt/env kullanimi veya talebi yok.
- Provider status inquiry simulation response ile calisir.
- Payment mutation yalniz explicit opt-in ve payment owner guard path'i uzerinden calisir.
- `mutationApplied` yalniz payment owner mutation uygulaninca true olur.
- `taskFinalized` ayri flag'dir.
- Audit business truth degildir.
- Outbox business truth degildir.
- Event order handoff tetiklemez.
- Default dry-run audit/outbox uretmez.
- Amount/currency mismatch audit/outbox/finalization uretmez.
- Inconclusive/failed query audit/outbox/finalization uretmez.
- FAILED/CANCELLED terminal state uzerine SUCCEEDED yazilamaz.
- Order handoff yok.
- Finance/risk/settlement/payout mutation yok.
- Scheduler/queue/background runtime yok.
- BFF route degisikligi yok.
- Migration yok.
- Yeni DB tablo/kolon yok.
- `HARDENING_PROGRESS_RECORD` degistirilmedi.

Source-level live request assert'leri:

- `services/payment/src/provider-adapter.ts`
- `services/payment/src/reconciliation-worker.ts`

Yasak pattern'ler:

- `fetch(`
- `axios`
- `request(`
- `node:http`
- `node:https`
- `require('http')`
- `require('https')`

## 9. Kapsam Disi Birakilanlar

- Live PayTR integration
- Gercek PayTR HTTP cagrisi
- Gercek PayTR key/salt/env kullanimi
- Order create / order handoff
- Order event trigger / order command
- Finance / settlement / payout mutation
- Risk mutation
- BFF route
- DB migration
- Yeni DB tablo/kolon
- Scheduler / queue / background runtime
- Yeni audit/outbox storage implementation
- `HARDENING_PROGRESS_RECORD` degisikligi

## 10. Smoke/Test Kanitlari

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

### `pnpm run smoke:payment-reconciliation-controlled-mutation`

Result: PASS

Output:

```text
[PASS] payment-reconciliation-controlled-mutation - Payment reconciliation controlled mutation assertions passed with explicit opt-in, terminal conflict, idempotency, and owner-boundary guards.
```

### `pnpm run smoke:payment-reconciliation-e2e-no-order-handoff`

Result: PASS

Output:

```text
[PASS] payment-reconciliation-e2e-no-order-handoff - Payment reconciliation E2E assertions passed with explicit opt-in payment mutation, dry-run regression, negative cases, and no order handoff.
```

### `pnpm run smoke:payment-reconciliation-audit-outbox-finalization`

Result: PASS

Output:

```text
[PASS] payment-reconciliation-audit-outbox-finalization - Payment reconciliation audit/outbox/finalization assertions passed with explicit opt-in evidence, dry-run regression, negative cases, idempotent duplicate evidence, and no order handoff.
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

## 11. Kirmizi Bayrak / Sari Bayrak

Kirmizi bayrak: yok.

Sari bayrak: Bu paket payment succeeded durumunu order created kabul etmez. Order handoff disaridadir.

Sari bayrak: Audit repository tarafinda genel idempotent append contract'i yoktur. Bu paket deterministik audit id/idempotency kullanir; duplicate memory smoke tek audit kaydini kanitlar. Postgres duplicate audit append durumunda warning uretilebilir.

Sari bayrak: Outbox event delivery guarantee veya consumer/worker bu paketin konusu degildir.

## 12. Nihai Karar

HARDENING-10C10-09 — PASS WITH LIMITATION

Limitation: Bu paket reconciliation controlled mutation sonrasi task lifecycle finalization, audit evidence ve idempotent outbox evidence kanitidir. Live PayTR integration, order handoff, finance/risk/settlement/payout mutation, scheduler/queue/background runtime, BFF route, migration, yeni DB tablo/kolon ve outbox consumer/delivery runtime kapsama alinmamistir.

## 13. Sonraki Paket Onerisi

Sonraki paket icin onerilen kapsam: 10C11 oncesi operator-controlled reconciliation execution audit/outbox delivery review ve order handoff eligibility contract tasarimi. Order handoff ancak payment truth, reconciliation lifecycle, idempotency, audit/outbox ve terminal status kurallari ayrica kanitlandiktan sonra ele alinmalidir.
