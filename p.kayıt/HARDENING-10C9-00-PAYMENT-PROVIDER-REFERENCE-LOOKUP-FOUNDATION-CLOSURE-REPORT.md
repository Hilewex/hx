# HARDENING-10C9-00 - Payment Provider Reference Lookup Foundation / No Owner Mutation Closure Report

## 1. Paket Adi

HARDENING-10C9-00 - Payment Provider Reference Lookup Foundation / No Owner Mutation

## 2. Amac

10C8 dry-run worker sonrasinda PayTR callback `merchant_oid` degerinin payment attempt/provider reference uzerinden payment kaydina cozumlenebilmesi icin payment repository lookup foundation kuruldu.

Bu paket payment owner state mutation, callback worker owner transition, order handoff, finance/risk mutation veya PayTR live initiate paketi degildir.

## 3. Degisen Dosyalar

- `services/payment/src/repository/interface.ts`
- `services/payment/src/repository/in-memory.ts`
- `services/payment/src/repository/postgres.ts`
- `tests/smoke/suites/payment-provider-reference-lookup.ts`
- `tests/smoke/run-smoke.ts`
- `package.json`
- `HARDENING-10C9-00-PAYMENT-PROVIDER-REFERENCE-LOOKUP-FOUNDATION-CLOSURE-REPORT.md`

`services/payment/src/payment.ts`, callback worker, migration, BFF, env ve progress record dosyalari degistirilmedi.

## 4. Repository Interface Degisikligi

`IPaymentRepository` contract icine su lookup eklendi:

```ts
getByProviderReference(
  providerName: string,
  providerReference: string
): Promise<PaymentInitiationResponse | undefined>;
```

Ilk foundation karari olarak providerName + providerReference temel lookup anahtaridir. PayTR icin `providerReference = merchant_oid` olarak kabul edilir.

## 5. InMemory Lookup Davranisi

`InMemoryPaymentRepository.getByProviderReference` payments Map icindeki payment response degerlerinde arama yapar.

Primary eslesme:

- `payment.attempt.providerName === providerName`
- `payment.attempt.providerReference === providerReference`

Fallback eslesme:

- `payment.attempt.providerName === providerName`
- `payment.attempt.providerEventId === providerReference`

Eslesme yoksa `undefined` doner.

## 6. Postgres Lookup Davranisi

`PostgresPaymentRepository.getByProviderReference` mevcut `payments.data` JSON alanini kullanir.

Primary query:

```sql
data->'attempt'->>'providerName' = $1
AND data->'attempt'->>'providerReference' = $2
LIMIT 1
```

Fallback query:

```sql
data->'attempt'->>'providerName' = $1
AND data->'attempt'->>'providerEventId' = $2
LIMIT 1
```

Parametrized query kullanildi. Migration veya schema degisikligi eklenmedi.

## 7. providerReference / merchant_oid Karari

PayTR callback mapping tarafinda `merchant_oid`, normalized candidate icinde provider reference olarak ele alinmisti. Bu paket repository seviyesinde ayni karari lookup foundation olarak destekler.

## 8. Migration Eklenmeme Gerekcesi

Mevcut payment kaydi `payments.data` JSON alaninda `attempt.providerName`, `attempt.providerReference` ve `attempt.providerEventId` degerlerini tasiyabilecek durumdadir.

Bu paket sadece lookup foundation oldugu icin unique index, JSONB index, kolon veya migration eklenmedi.

## 9. initiatePayment providerReference Write Yapilmama Gerekcesi

`services/payment/src/payment.ts` degistirilmedi.

Gerekce:

- PayTR live initiate henuz yok.
- Bu paket initiate contract veya merchant_oid write paketi degildir.
- Internal simulation mevcutta provider reference bilgisini `providerSimulationRef` olarak saklayabilir; `attempt.providerReference` yazma davranisi bu paketin kapsami disindadir.
- Smoke test manuel repository kaydi ile lookup contractini dogrular.

## 10. Smoke Senaryolari

Yeni smoke suite: `payment-provider-reference-lookup`

InMemory senaryolari:

- providerName + providerReference match -> payment doner.
- wrong providerName -> `undefined`.
- wrong providerReference -> `undefined`.
- providerReference yokken providerEventId fallback -> payment doner.
- mevcut `getByPaymentAttemptId` regression -> PASS.
- `saveWithIdempotency` sonrasi `getByIdempotencyKey` regression -> PASS.

Postgres branch:

- `PERSISTENCE_MODE=postgres` ve `DATABASE_URL` varsa manuel payment save + providerReference lookup assertion calisir.
- Env yoksa branch calistirilmaz ve smoke mesaji bunu acik yazar.
- Suite genel PASS'i hardcoded degil; InMemory assertionlar gercek olarak calisir.

## 11. Degismeyen / Yasakli Alanlar

Asagidaki alanlara implementation degisikligi yapilmadi:

- Payment state mutation
- callback worker owner command dispatch
- `services/payment/src/payment.ts` callback processing
- Order create / order handoff
- Finance correction / risk signal
- Reconciliation runtime
- Migration/persistence schema
- BFF route/handler
- PayTR live initiate request
- Gercek merchant key/salt/env/config
- `.env.example`
- `HARDENING_PROGRESS_RECORD`

Git komutu calistirilmadi. `pnpm install` calistirilmadi.

## 12. Calistirilan Komutlar ve Sonuclari

1. `pnpm --filter @hx/payment run build` - PASS
2. `pnpm run typecheck` - PASS
3. `pnpm run build` - PASS
4. `pnpm run smoke:payment-provider-reference-lookup` - PASS
5. `pnpm run smoke:payment-callback-worker-foundation` - PASS
6. `pnpm run smoke:payment-callback-owner-command` - PASS
7. `pnpm run smoke:payment-callback-candidate` - PASS
8. `pnpm run smoke:provider-boundary` - PASS

## 13. Boundary Sonucu

Bu paket yalniz repository lookup contracti ekler. Payment truth mutate etmez. Worker owner command dispatch etmez. Order/finance/risk etkisi yoktur. Audit/outbox owner event yazmaz.

Provider boundary flags uzerinde yeni mutation davranisi eklenmedi.

## 14. Kalan Limitler

- providerReference unique constraint yok.
- `LIMIT 1` kullanilir; duplicate providerReference durumunda deterministik owner truth garantisi yoktur.
- initiatePayment PayTR merchant_oid yazmiyor.
- PayTR live initiate yok.
- Worker owner transition yok.
- Payment owner mutation yok.
- Reconciliation runtime yok.
- Order handoff yok.
- Finance/risk mutation yok.
- Real PayTR E2E yok.

## 15. Nihai Karar

**PASS WITH LIMITATION**

Limitasyon gerekcesi: Bu paket yalniz providerReference lookup foundation kurar. PayTR initiate merchant_oid write, payment owner transition, worker dispatch, reconciliation, order handoff, finance/risk linkage ve real PayTR E2E sonraki paketlerde ele alinacaktir.
