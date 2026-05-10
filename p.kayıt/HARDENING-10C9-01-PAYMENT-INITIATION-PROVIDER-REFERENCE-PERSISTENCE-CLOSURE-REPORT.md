# HARDENING-10C9-01 - Payment Initiation Provider Reference Persistence / No Callback Mutation Closure Report

## 1. Paket Adi

HARDENING-10C9-01 - Payment Initiation Provider Reference Persistence / No Callback Mutation

## 2. Amac

10C9-00 ile eklenen providerReference lookup foundation'in gercek payment initiation kayitlarinda calisabilmesi icin provider adapter sonucundaki provider metadata `PaymentAttempt` icine yazildi.

Bu paket callback owner transition, callback worker mutation, order handoff, finance/risk mutation veya PayTR live initiate paketi degildir.

## 3. Degisen Dosyalar

- `services/payment/src/payment.ts`
- `tests/smoke/suites/payment-initiation-provider-reference.ts`
- `tests/smoke/run-smoke.ts`
- `package.json`
- `HARDENING-10C9-01-PAYMENT-INITIATION-PROVIDER-REFERENCE-PERSISTENCE-CLOSURE-REPORT.md`

Repository interface/implementation, migration, BFF, env, callback worker ve `HARDENING_PROGRESS_RECORD` dosyalari degistirilmedi.

## 4. initiatePayment Provider Reference Persistence Karari

`initiatePayment` response olustururken `attempt` icine provider adapter sonucundan su alanlar yazilir:

- `providerSimulationRef: providerResult.providerReference`
- `providerName: providerResult.providerName`
- `providerReference: providerResult.providerReference`
- `providerEventId: providerResult.providerReference`

`providerResult.providerReference` yoksa `providerName` yazilir, `providerReference` ve `providerEventId` yazilmaz. No crash davranisi korunur.

Payment state `INITIATED`, attempt state `PROVIDER_REDIRECT_READY` olarak kalir.

## 5. providerReference / providerEventId Karari

Ilk foundation kararinda `providerEventId` ve `providerReference` ayni provider reference degerini tasiyabilir.

PayTR live initiate sonraki paketlerde geldiginde `merchant_oid` providerReference olacaktir. Internal simulation icin providerReference `sim_...` formatinda kalir.

## 6. Internal Simulation Regression Sonucu

Yeni smoke suite `initiatePayment` fonksiyonunu dogrudan internal simulation adapter ile calistirir.

Assertionlar:

- `providerEnvelope.providerName = internal_simulation`
- `providerEnvelope.providerReference` vardir.
- `attempt.providerName = internal_simulation`
- `attempt.providerReference = providerEnvelope.providerReference`
- `attempt.providerEventId = providerEnvelope.providerReference`
- `attempt.providerSimulationRef` mevcut davranisi korur.
- `state = INITIATED`
- `attempt.state = PROVIDER_REDIRECT_READY`
- `lastCallbackAt` ve `lastCallbackStatus` yazilmaz.

## 7. getByProviderReference Lookup Sonucu

Smoke suite initiate sonrasi kaydedilen response icin repository uzerinden:

```ts
repo.getByProviderReference(
  response.attempt.providerName,
  response.attempt.providerReference
)
```

cagrisini yapar ve ayni `paymentId` degerinin dondugunu dogrular.

`getByPaymentAttemptId` regression ve ayni idempotencyKey ile ikinci `initiatePayment` cagrisinin ayni payment response'u dondurmesi de dogrulanir.

## 8. Degismeyen / Yasakli Alanlar

Asagidaki alanlara implementation degisikligi yapilmadi:

- Callback worker owner command dispatch
- Payment callback processing
- Callback uzerinden payment state mutation
- Order create / order handoff
- Finance correction / risk signal uretimi
- Reconciliation runtime
- Migration/persistence schema
- BFF route/handler
- PayTR live initiate network request
- Gercek merchant key/salt/env/config
- `.env.example`
- `HARDENING_PROGRESS_RECORD`

Git komutu calistirilmadi. `pnpm install` calistirilmadi.

## 9. Calistirilan Komutlar ve Sonuclari

1. `pnpm --filter @hx/payment run build` - PASS
2. `pnpm run typecheck` - PASS
3. `pnpm run build` - PASS
4. `pnpm run smoke:payment-initiation-provider-reference` - PASS
5. `pnpm run smoke:payment-provider-reference-lookup` - PASS
6. `pnpm run smoke:payment-callback-worker-foundation` - PASS
7. `pnpm run smoke:payment-callback-owner-command` - PASS
8. `pnpm run smoke:provider-boundary` - PASS

## 10. Boundary Sonucu

Bu paket yalniz payment initiation sonucunda provider reference metadata persistence saglar. Callback worker dispatch, callback state mutation, order handoff, finance/risk mutation, migration ve BFF davranisi eklemez.

## 11. Kalan Limitler

- PayTR live initiate yok.
- PayTR merchant_oid gercek uretimi yok.
- Callback worker owner transition yok.
- Payment owner mutation callback uzerinden yok.
- Reconciliation runtime yok.
- Order handoff yok.
- Finance/risk mutation yok.
- Real PayTR E2E yok.

## 12. Nihai Karar

**PASS WITH LIMITATION**

Limitasyon gerekcesi: Bu paket yalniz payment initiation sonucunda provider reference metadata persistence saglar. PayTR live merchant_oid uretimi, callback worker owner transition, payment owner mutation, reconciliation, order handoff, finance/risk linkage ve real PayTR E2E sonraki paketlerde ele alinacaktir.
