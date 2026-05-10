# HARDENING-10C10-04: Reconciliation Task Persistence / Repository Foundation

## 1. Paket Tanimi

Bu paket 10C10-03 ile eklenen reconciliation task contract modeline uygun persistence/repository foundation ekler.

Bu paket reconciliation runtime, worker, scheduler, queue, PayTR live integration, payment mutation, order handoff, finance/risk/settlement/payout mutation veya BFF route paketi degildir.

## 2. Degisen Dosyalar

- `packages/persistence/src/payment-reconciliation-task.ts`
- `packages/persistence/src/index.ts`
- `infra/migrations/20260507_001_payment_reconciliation_task_persistence.sql`
- `tests/smoke/suites/payment-reconciliation-task-persistence.ts`
- `tests/smoke/run-smoke.ts`
- `package.json`
- `HARDENING-10C10-04-RECONCILIATION-TASK-PERSISTENCE-REPOSITORY-CLOSURE-REPORT.md`

## 3. Eklenen Persistence Model / Repository

Eklenen repository interface:

- `PaymentReconciliationTaskRepository`
  - `createTask(candidate)`
  - `getTaskById(taskId)`
  - `getTaskByReconciliationRef(reconciliationRef)`
  - `findOpenTaskByProviderReference(providerName, providerReference)`
  - `listTasksByStatus(status, limit)`
  - `updateTaskStatus(taskId, update)`
  - `markTaskAttempt(taskId, update)`

Eklenen implementation'lar:

- `InMemoryPaymentReconciliationTaskRepository`
- `PostgresPaymentReconciliationTaskRepository`
- `getPaymentReconciliationTaskRepository()`

Repository sadece reconciliation task kaydi uzerinde calisir. Payment, provider callback, order, finance veya risk state degistirme davranisi eklenmedi.

## 4. Migration Ozeti

Yeni idempotent migration:

- `infra/migrations/20260507_001_payment_reconciliation_task_persistence.sql`

Olusturulan tablo:

- `payment_reconciliation_tasks`

Alanlar:

- `id`
- `reconciliation_ref`
- `payment_id`
- `payment_attempt_id`
- `checkout_id`
- `provider_name`
- `provider_reference`
- `merchant_oid`
- `trigger_reason`
- `status`
- `attempt_count`
- `max_attempts`
- `next_attempt_at`
- `last_inquiry_ref`
- `last_candidate`
- `manual_review_required`
- `boundary`
- `created_at`
- `updated_at`

Index / constraint:

- unique index: `idx_payment_reconciliation_tasks_reconciliation_ref`
- index: `idx_payment_reconciliation_tasks_status`
- partial index: `idx_payment_reconciliation_tasks_provider_reference`
- partial index: `idx_payment_reconciliation_tasks_merchant_oid`

Migration payments, provider_callback_events, order, finance, risk, settlement veya payout tablolarina dokunmaz. Drop/destructive islem yoktur.

## 5. Idempotency / Duplicate Davranisi

- `reconciliationRef` repository create input seviyesinde zorunlu tutuldu.
- In-memory repository ayni `reconciliationRef` tekrar geldiginde yeni task olusturmaz, mevcut task'i dondurur.
- Postgres repository `ON CONFLICT (reconciliation_ref) DO NOTHING` kullanir ve conflict durumunda mevcut task'i okur.
- `provider_reference` icin unique constraint eklenmedi; sadece sorgu index'i eklendi.

## 6. Boundary / Owner Safety Kontrolu

- Task boundary flag'leri korunur.
- Status update sadece reconciliation task status alanini degistirir.
- Attempt update sadece reconciliation task attempt alanlarini degistirir.
- Payment state mutation yok.
- Provider callback processing status mutation yok.
- Order state mutation yok.
- Finance/risk/settlement/payout mutation yok.
- Live PayTR request yok.
- Worker/scheduler/queue yok.
- BFF route degisikligi yok.

## 7. Kapsam Disi Birakilanlar

- Live PayTR request
- Gercek PayTR HTTP cagrisi
- Gercek PayTR key/salt/env kullanimi veya talebi
- Payment state mutation
- Payment owner command uygulamasi
- Worker runtime
- Reconciliation scheduler / queue
- BFF route degisikligi
- Order create / order handoff
- Finance / settlement / payout mutation
- Risk mutation
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

### `pnpm run smoke:payment-reconciliation-task-persistence`

Result: PASS

Output:

```text
> hx-monorepo@1.0.0 smoke:payment-reconciliation-task-persistence C:\gelistirme\HX
> tsx tests/smoke/run-smoke.ts payment-reconciliation-task-persistence

Running smoke tests against http://localhost:3001
[PASS] payment-reconciliation-task-persistence - Payment reconciliation task persistence assertions passed with in-memory repository and no owner mutations.
```

### Migration Verify Notu

Projede `packages/persistence/verify-schema.ts` mevcuttur, ancak yeni `payment_reconciliation_tasks` tablosunu veya yeni indexleri kontrol etmemektedir. Bu nedenle migration verify komutu bu paket icin kanit uretmedigi icin calistirilmadi. `packages/persistence` Postgres repository implementation'i `typecheck` ve `build` ile dogrulandi; smoke suite in-memory repository davranisini dogrular.

## 9. Kirmizi Bayrak / Sari Bayrak

Kirmizi bayrak: yok.

Sari bayrak: Bu paket runtime veya DB-backed smoke calistirmasi icermez. Postgres repository compile/build ile dogrulandi; fiili Postgres create/get/update davranisi migration uygulanmis bir test DB uzerinde ayrica kosulabilir.

## 10. Nihai Karar

HARDENING-10C10-04 — PASS WITH LIMITATION

Limitation: Bu paket persistence/repository foundation ile sinirlidir. Reconciliation worker/scheduler, live PayTR status inquiry runtime, payment owner mutation ve order handoff kapsama alinmamistir.

## 11. Sonraki Paket Onerisi

Sonraki paket icin onerilen kapsam: reconciliation task repository uzerinden owner-safe command modeline gecis icin kontrollu orchestration/command foundation. Payment mutation uygulamasi yine ayrik boundary guard altinda tutulmalidir.
