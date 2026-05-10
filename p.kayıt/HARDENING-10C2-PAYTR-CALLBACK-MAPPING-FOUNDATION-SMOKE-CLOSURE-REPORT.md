# HARDENING-10C2 - PayTR Callback Mapping Foundation Smoke Closure Report

## 1. Paket Adi

HARDENING-10C2 - PayTR Callback Mapping Foundation Smoke

## 2. Amac

Bu paket PayTR iFrame API callback payload'unu generic `NormalizedPaymentCallbackCandidate` modeline map eden saf contract/helper foundation ekler.

Bu paket payment state mutation, order handoff, worker/queue/reconciliation runtime, live PayTR config veya secret paketi degildir.

## 3. PayTR Dokumanindan Sabitlenen Kurallar

- Bildirim URL'ye POST edilen alanlar: `merchant_oid`, `status`, `total_amount`, `hash`, `failed_reason_code`, `failed_reason_msg`, `test_mode`, `payment_type`, `currency`, `payment_amount`.
- Bildirim URL musteri sayfasi degildir; session kullanilmaz.
- Islem `merchant_oid` ile bulunmalidir.
- Tekrarlayan bildirimler `merchant_oid` temelinde duplicate-safe ele alinmalidir.
- PayTR response duz metin yalniz `OK` olmalidir; bu paket BFF response davranisini degistirmez.
- Hash canonicalization: `base64(hmac_sha256(merchant_oid + merchant_salt + status + total_amount, merchant_key))`.
- `merchant_ok_url` siparis onay yeri degildir; kesin sonuc Bildirim URL'ye POST ile gelir.
- `total_amount` ve `payment_amount` 100 ile carpilmis integer tutardir.
- `total_amount`, taksit/vade farki gibi durumlarda `payment_amount` degerinden yuksek olabilir.

## 4. Degisen Dosyalar

- `packages/contracts/src/payment.ts`
- `tests/smoke/suites/paytr-callback-mapping.ts`
- `tests/smoke/run-smoke.ts`
- `package.json`
- `HARDENING-10C2-PAYTR-CALLBACK-MAPPING-FOUNDATION-SMOKE-CLOSURE-REPORT.md`

`packages/contracts/src/index.ts` degismedi; `payment.ts` zaten root export altindadir.

## 5. Eklenen Model ve Helper'lar

`packages/contracts/src/payment.ts` icine eklendi:

- `PaytrIframeCallbackPayload`
- `PaytrCallbackMappingResult`
- `createPaytrCallbackHash`
- `verifyPaytrCallbackHash`
- `mapPaytrIframeCallbackToPaymentCandidate`

Mapping helper, karar alanlarini dogrudan elle cogaltmak yerine `createNormalizedPaymentCallbackCandidate` helper'i uzerinden candidate uretir.

## 6. Hash Canonicalization Karari

PayTR Node/PHP ornekleriyle uyumlu olarak canonical string:

```text
merchant_oid + merchant_salt + status + total_amount
```

Hash:

```text
base64(hmac_sha256(canonical_string, merchant_key))
```

Smoke testlerde yalniz test `merchantKey` ve `merchantSalt` kullanildi. Gercek key/salt/env/config eklenmedi.

## 7. Status Mapping Karari

- `success` + verified hash -> `succeeded`
- `failed` + verified hash -> `failed`
- bad hash -> `signature_failed`
- missing `merchant_oid` -> `rejected_reference_missing`
- unsupported PayTR status -> `unsupported`
- amount mismatch -> `rejected_amount_mismatch`
- currency mismatch -> `rejected_currency_mismatch`

Unsupported status icin `shouldReconcile=true` karari korundu; bilinmeyen provider status domain anlami tasiyabilecegi icin manual/status inquiry adayidir.

## 8. Amount ve Currency Normalization Karari

- `expectedAmount` platform minor unit olarak kabul edildi.
- PayTR `payment_amount` varsa amount match once onunla yapilir.
- `payment_amount` yoksa `total_amount` ile karsilastirilir.
- `total_amount > payment_amount` tek basina mismatch degildir.
- `TL` ve `TRY`, platform currency `TRY` olarak normalize edilir.
- `USD`, `EUR`, `GBP`, `RUB` aynen korunur.
- Expected currency ile normalized payload currency uyusmazsa `PAYTR_CURRENCY_MISMATCH` uretilir.

## 9. Smoke Senaryolari

Yeni suite:

```text
tests/smoke/suites/paytr-callback-mapping.ts
```

Kapsanan senaryolar:

- valid PayTR success
- valid PayTR failed
- bad hash
- missing `merchant_oid`
- unsupported status
- amount mismatch
- `TL` -> `TRY` normalization
- currency mismatch
- `total_amount` greater than `payment_amount`
- success without `paymentAttemptId`
- boundary invariant: all flags false

Smoke hardcoded PASS degildir; Node `assert` ile gercek helper sonucunu dogrular.

## 10. Degismeyen / Yasakli Alanlar

Asagidaki alanlara dokunulmadi:

- `apps/bff/src/server/provider-callback.ts`
- `services/payment/src/payment.ts`
- BFF route davranisi
- payment state mutation
- order create / order handoff
- finance correction
- risk signal uretimi
- worker/consumer/queue
- reconciliation runtime
- migration/persistence davranisi
- gercek provider secret/env/config
- `.env.example`
- `HARDENING_PROGRESS_RECORD`

Git komutu calistirilmadi. `pnpm install` calistirilmadi.

## 11. Calistirilan Komutlar ve Sonuclari

| Komut | Sonuc |
|---|---|
| `pnpm --filter @hx/contracts run build` | PASS |
| `pnpm run typecheck` | PASS |
| `pnpm run build` | PASS |
| `pnpm run smoke:payment-callback-candidate` | PASS |
| `pnpm run smoke:paytr-callback-mapping` | PASS |
| `pnpm run smoke:provider-boundary` | PASS |

## 12. Boundary Sonucu

PayTR mapping sonucunda uretilen `NormalizedPaymentCallbackCandidate.boundary` alaninda tum flag'ler false kaldi:

- `providerTruth=false`
- `businessTruthMutated=false`
- `ownerStateMutated=false`
- `eventTruthMutated=false`
- `outboxDeliveryGuaranteed=false`

## 13. Kalan Limitler

- Gercek `merchant_key` / `merchant_salt` / env yok.
- PayTR live config yok.
- BFF callback handler PayTR mapping'e baglanmadi.
- Payment owner state transition yok.
- Worker/queue yok.
- Reconciliation yok.
- Order handoff yok.
- Finance/risk mutation yok.
- PayTR status inquiry API kullanilmadi.
- Real test payment callback henuz uctan uca denenmedi.

## 14. Nihai Karar

**HARDENING-10C2 - PASS WITH LIMITATION**

Limitasyon gerekcesi: Bu paket yalniz PayTR callback mapping foundation kurar. Canli provider config, BFF integration, async worker, payment owner transition, order handoff, finance/risk linkage, status inquiry/reconciliation ve gercek test payment callback uctan uca dogrulamasi sonraki paketlerde ele alinacaktir.
