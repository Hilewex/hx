# HARDENING-10C8 - Payment Callback Processing Worker Foundation / No Order Handoff Closure Report

## 1. Paket Adi

HARDENING-10C8 - Payment Callback Processing Worker Foundation / No Order Handoff

## 2. Amac

Provider callback kayitlarindan payment domainine ait `received` durumundaki normalized callback candidate kayitlarini okuyacak dry-run worker foundation kuruldu.

Worker `decidePaymentCallbackOwnerCommand` helper ile candidate decision uretir ve yalniz provider callback record lifecycle `processingStatus` alanini gunceller.

Bu paket payment owner state mutation, order handoff, finance/risk mutation, reconciliation runtime veya PayTR real E2E paketi degildir.

## 3. Degisen Dosyalar

- `services/payment/src/callback-worker.ts`
- `services/payment/src/index.ts`
- `tests/smoke/suites/payment-callback-worker-foundation.ts`
- `tests/smoke/run-smoke.ts`
- `package.json`
- `HARDENING-10C8-PAYMENT-CALLBACK-PROCESSING-WORKER-FOUNDATION-CLOSURE-REPORT.md`

`packages/persistence/src/provider-callback.ts` degistirilmedi. Mevcut repository contract worker icin yeterliydi.

## 4. Worker Dry-Run Davranisi

`processPaymentCallbackRecordsDryRun` eklendi.

Davranis:

- input repository varsa onu kullanir.
- repository yoksa `getProviderCallbackEventRepository()` kullanir.
- `listProviderCallbackEventsByProcessingStatus('received', limit ?? 50)` ile kayit okur.
- `providerDomain !== 'payment'` kayitlari mutate etmeden skip eder.
- `normalizedPayload.candidate` parse/validate eder.
- candidate icin `decidePaymentCallbackOwnerCommand` cagirir.
- decision summary uretir.
- owner command dispatch etmez.
- payment repository kullanmaz.
- payment/order/finance/risk/audit/outbox mutation yapmaz.

Worker decision helper'a gercek callback record id verir:

```text
callbackRecordId: record.id
```

Bu nedenle candidate icindeki `callbackRecordId=pending_insert` olsa bile fallback idempotency key gercek callback record id ile uretilir.

## 5. Normalized Payload Validation

Beklenen payload sekli:

```ts
{
  candidate: NormalizedPaymentCallbackCandidate;
  hashVerified: boolean;
  paytrStatus: string;
}
```

Worker su kontrolleri yapar:

- normalizedPayload object mi?
- candidate object mi?
- candidate.providerDomain === `payment`
- candidate.providerName dolu string mi?
- candidate.normalizedStatus string mi?
- candidate.boundary flags false mu?

Invalid payload icin record `failed` isaretlenir ve `decisionStatus='invalid_normalized_payload'` doner.

## 6. Processing Status Mapping Karari

- `command_ready` -> `accepted`
- `candidate_rejected` -> `rejected`
- `candidate_requires_reconciliation` -> `ignored`
- `missing_payment_attempt` -> `ignored`
- `candidate_not_processable` -> `ignored`
- invalid normalized payload -> `failed`
- non-payment provider domain -> status unchanged, `not_payment_callback` summary

## 7. Reconciliation Icin Neden ignored Kullanildi

Mevcut `ProviderCallbackProcessingStatus` enum'unda `reconciliation_required` yok.

Bu pakette owner mutation yapilmadigi ve reconciliation runtime kurulmadigi icin pending/unknown/missing attempt gibi kayitlar bilincli olarak processing disina alinip `ignored` isaretlendi. Bu karar callback lifecycle marker seviyesindedir; reconciliation truth veya owner state degistirmez.

## 8. Neden Payment Repository Kullanilmadi

Payment repository lookup eklenmedi.

Gerekce:

- providerReference / merchant_oid lookup implementation henuz yok.
- PaymentAttempt lookup henuz owner transition paketi degil.
- Bu paket dry-run worker foundation paketidir.
- Payment owner mutation 10C9 veya ayri paket konusu olacaktir.

Source review sonucu `services/payment/src/callback-worker.ts` icinde `getPaymentRepository`, payment repository interface, order, finance, risk, audit veya outbox importu yoktur.

## 9. Smoke Senaryolari

Yeni smoke suite: `payment-callback-worker-foundation`

InMemoryProviderCallbackEventRepository ile dogrulanan senaryolar:

- valid succeeded candidate -> `command_ready`, `MARK_PAYMENT_SUCCEEDED`, record `accepted`
- provider event id yokken fallback idempotency key gercek callback record id kullanir
- bad hash / signature failed candidate -> `rejected`, record `rejected`
- succeeded ama paymentAttemptId yok -> `reconciliationRequired`, record `ignored`
- pending candidate -> `reconciliationRequired`, record `ignored`
- invalid normalizedPayload -> `failed`, record `failed`
- non-payment provider domain -> payment counters 0, record status `received` kalir
- limit=1 -> `scanned=1`
- boundary flags false

## 10. Degismeyen / Yasakli Alanlar

Asagidaki alanlara implementation degisikligi yapilmadi:

- Payment state mutation
- `services/payment/src/payment.ts` callback processing
- Payment repository behavior
- Order create / order handoff
- Finance correction / risk signal
- Worker daemon/process
- Queue/consumer altyapisi
- Reconciliation runtime
- Migration/persistence behavior
- BFF route/handler
- PayTR live initiate request
- Gercek merchant key/salt/env/config
- `.env.example`
- `HARDENING_PROGRESS_RECORD`

Git komutu calistirilmadi. `pnpm install` calistirilmadi.

## 11. Calistirilan Komutlar ve Sonuclari

1. `pnpm --filter @hx/payment run build` - PASS
2. `pnpm run typecheck` - PASS
3. `pnpm run build` - PASS
4. `pnpm run smoke:payment-callback-worker-foundation` - PASS
5. `pnpm run smoke:payment-callback-owner-command` - PASS
6. `pnpm run smoke:payment-callback-candidate` - PASS
7. `pnpm run smoke:paytr-callback-mapping` - PASS
8. `pnpm run smoke:provider-boundary` - PASS

## 12. Boundary Sonucu

Provider boundary flags false kalir:

- `providerTruth=false`
- `businessTruthMutated=false`
- `ownerStateMutated=false`
- `eventTruthMutated=false`
- `outboxDeliveryGuaranteed=false`

Worker owner command helper sonucunu dry-run olarak siniflandirir. Payment truth mutate etmez. Order/finance/risk etkisi yoktur. Audit/outbox owner event yazmaz.

## 13. Kalan Limitler

- Atomic claim/lock yok.
- Multi-worker concurrency yok.
- Payment owner mutation yok.
- Payment repository lookup yok.
- providerReference/merchant_oid lookup yok.
- PaymentAttempt lookup yok.
- Reconciliation status enum yok.
- Reconciliation runtime yok.
- Order handoff yok.
- Finance/risk mutation yok.
- Audit/outbox owner event yok.
- Real PayTR E2E yok.

## 14. Nihai Karar

**PASS WITH LIMITATION**

Limitasyon gerekcesi: Bu paket yalniz dry-run worker foundation ve callback record lifecycle marker kurar. Gercek payment owner transition, paymentAttempt/providerReference lookup, atomic claim, reconciliation runtime, order handoff, finance/risk linkage ve real PayTR E2E sonraki paketlerde ele alinacaktir.
