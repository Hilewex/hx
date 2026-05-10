# HARDENING-10C5 - PayTR Callback Mapping Live BFF Path / No Domain Mutation Closure Report

## 1. Paket Adi

HARDENING-10C5 - PayTR Callback Mapping Live BFF Path / No Domain Mutation

## 2. Amac

Bu paket PayTR callback live BFF ingestion path icinde PayTR payload'unu payment provider config resolver ve PayTR mapping helper uzerinden `NormalizedPaymentCallbackCandidate` modeline map eder ve sonucu provider callback record'un `normalizedPayload` alanina yazar.

Bu paket payment owner state mutation, order handoff, worker/queue/reconciliation, live PayTR initiate veya gercek test odeme uctan uca paketi degildir.

## 3. Degisen Dosyalar

- `apps/bff/src/server/provider-callback.ts`
- `tests/smoke/suites/paytr-callback-live-bff-mapping.ts`
- `tests/smoke/suites/paytr-callback-bff-policy.ts`
- `tests/smoke/run-smoke.ts`
- `package.json`
- `HARDENING-10C5-PAYTR-CALLBACK-MAPPING-LIVE-BFF-PATH-CLOSURE-REPORT.md`

## 4. PayTR Config Resolver Kullanimi

`apps/bff/src/server/provider-callback.ts` icine `buildNormalizedPayloadForProviderCallback(input)` helper'i eklendi.

Helper yalniz `providerDomain='payment'` ve `providerName='paytr'` icin calisir. Diger provider'larda `undefined` doner ve generic ingestion davranisi korunur.

PayTR icin `resolvePaymentProviderConfig(process.env)` cagrilir. `activeProviderName='paytr'`, callback verification usable, `merchantKey` ve `merchantSalt` mevcut degilse mapping helper cagrilmaz. Bu durumda `normalizedPayload` asagidaki diagnostic object olarak yazilir:

```json
{
  "type": "paytr_callback_mapping_not_configured",
  "providerName": "paytr",
  "reason": "PAYTR_CONFIG_NOT_USABLE_FOR_CALLBACK_VERIFICATION",
  "boundary": {
    "providerTruth": false,
    "businessTruthMutated": false,
    "ownerStateMutated": false,
    "eventTruthMutated": false,
    "outboxDeliveryGuaranteed": false
  }
}
```

Ingestion record basariyla alindigi surece PayTR ACK policy korunur ve response `text/plain OK` kalir.

## 5. Mapping NormalizedPayload Karari

Config usable oldugunda BFF helper `mapPaytrIframeCallbackToPaymentCandidate` cagirir.

Mapping input:

- `payload`: PayTR raw body
- `callbackRecordId`: `pending_insert`
- `providerName`: `paytr`
- `providerMode`: resolver sonucundaki `config.providerMode`
- `merchantKey`: resolver PayTR merchant key
- `merchantSalt`: resolver PayTR merchant salt
- `occurredAt`: BFF receivedAt zamani

Mapping sonucu oldugu gibi `ProviderCallbackRecord.normalizedPayload` alanina yazilir. Response body raw payload veya normalized payload dondurmez.

## 6. CallbackRecordId Placeholder Karari

Provider callback repository insert oncesinde record id bilinmedigi ve bu pakette persistence repository davranisi degistirilmedigi icin candidate icindeki `callbackRecordId` degeri `pending_insert` placeholder olarak yazildi.

Bu karar domain mutation yaratmaz. Ileri pakette repository update veya iki asamali insert/update davranisi tasarlanirsa gercek callback record id ile zenginlestirilebilir.

## 7. Verification Status Ayrimi

`ProviderCallbackRecord.verificationStatus` mevcut generic callback signature guard status'udur. PayTR icin bu paket generic guard'i degistirmedi; record-level status `unsupported` kalabilir.

`normalizedPayload.candidate.verificationStatus`, `normalizedPayload.hashVerified` ve `normalizedPayload.candidate.signatureVerified` ise PayTR'nin `hash = base64(hmac_sha256(merchant_oid + merchant_salt + status + total_amount, merchant_key))` kuralina gore mapping helper icinde uretilen PayTR hash verification sonucudur.

Ileri pakette generic signature guard PayTR provider policy ile birlestirilebilir.

## 8. Duplicate Overwrite Etmeme Karari

PayTR callback identity `merchant_oid` uzerinden `providerEventId` olarak korunur.

Duplicate callback geldiginde mevcut record doner, yeni insert yapilmaz ve mevcut `normalizedPayload` overwrite edilmez. Ilk kayit `not_configured` diagnostic ile yazildiysa daha sonra config eklense bile duplicate callback mevcut kaydi update etmez.

## 9. Smoke Senaryolari

Yeni suite:

```text
tests/smoke/suites/paytr-callback-live-bff-mapping.ts
```

Kapsanan senaryolar:

- Valid PayTR callback: HTTP 200, `text/plain OK`, raw payload persisted, normalized payload persisted, `normalizedStatus=succeeded`, `hashVerified=true`, candidate boundary false, record boundary false.
- Bad hash: HTTP 200 OK, `hashVerified=false`, `normalizedStatus=signature_failed`, `shouldProcess=false`, `shouldReject=true`, `PAYTR_HASH_FAILED` risk flag.
- Duplicate PayTR callback: HTTP 200 OK, ayni record korunur, raw payload ve normalized payload overwrite edilmez.
- Non-PayTR regression: `payment/iyzico` JSON envelope ve generic 202 davranisini korur, normalized payload yazmaz.

Smoke dummy env degerleri:

- `PAYMENT_PROVIDER_NAME=paytr`
- `PAYMENT_PROVIDER_MODE=sandbox`
- `PAYTR_PROVIDER_MODE=sandbox`
- `PAYTR_MERCHANT_ID=test-merchant`
- `PAYTR_MERCHANT_KEY=test-key`
- `PAYTR_MERCHANT_SALT=test-salt`

Bu degerler test/dummy degerleridir; gercek merchant secret kodlanmadi.

## 10. Degismeyen / Yasakli Alanlar

Asagidaki alanlara dokunulmadi:

- `services/payment/src/payment.ts`
- payment owner state mutation
- order create / order handoff
- finance correction veya risk signal uretimi
- worker/consumer/queue
- reconciliation runtime
- live PayTR initiate request
- gercek merchant key/salt/env/config degerleri
- `.env.example`
- migration dosyalari
- persistence repository davranisi
- `HARDENING_PROGRESS_RECORD`

Git komutu calistirilmadi. `pnpm install` calistirilmadi.

## 11. Calistirilan Komutlar ve Sonuclari

| Komut | Sonuc |
|---|---|
| `pnpm --filter @hx/bff run build` | PASS |
| `pnpm run typecheck` | PASS |
| `pnpm run build` | PASS |
| BFF baslatma, dummy PayTR env ile | PASS |
| `/health` dogrulama | PASS |
| `pnpm run smoke:paytr-callback-live-bff-mapping` | PASS |
| `pnpm run smoke:paytr-callback-bff-policy` | PASS |
| `pnpm run smoke:paytr-callback-mapping` | PASS |
| `pnpm run smoke:payment-provider-config` | PASS |
| `pnpm run smoke:provider-callback-ingestion` | PASS |
| `pnpm run smoke:provider-boundary` | PASS |

Not: `smoke:paytr-callback-bff-policy` suite'i 10C5 sonrasi PayTR kaydinda normalized payload bulunabilecegini kabul edecek sekilde guncellendi; ACK policy, raw payload leak olmamasi ve boundary false kontrolleri korunur.

## 12. Boundary Sonucu

Provider callback record boundary flag'leri false kaldi:

- `providerTruth=false`
- `businessTruthMutated=false`
- `ownerStateMutated=false`
- `eventTruthMutated=false`
- `outboxDeliveryGuaranteed=false`

PayTR normalized candidate boundary flag'leri de false kaldi. Domain mutation, payment owner state mutation, order/finance/risk mutation eklenmedi.

## 13. Kalan Limitler

- Candidate icindeki `callbackRecordId` placeholder: `pending_insert`.
- PaymentAttempt lookup yok.
- Live path'te `expectedAmount` / `expectedCurrency` validation yok.
- Payment owner state transition yok.
- Worker/queue yok.
- Reconciliation yok.
- Order handoff yok.
- Finance/risk mutation yok.
- Generic signature guard PayTR hash verification ile birlesmedi.
- Gercek PayTR test callback uctan uca denenmedi.
- iyzico mapping yok.

## 14. Nihai Karar

**HARDENING-10C5 - PASS WITH LIMITATION**

Limitasyon gerekcesi: Bu paket yalniz PayTR callback mapping'i BFF ingestion record'una `normalizedPayload` olarak baglar. Payment owner transition, worker/queue, order handoff, finance/risk linkage, expected amount/currency lookup, real PayTR uctan uca test ve iyzico mapping sonraki paketlerde ele alinacaktir.
