# HARDENING-10C4 - Payment Provider Config / Secret Resolution Foundation Closure Report

## 1. Paket Adi

HARDENING-10C4 - Payment Provider Config / Secret Resolution Foundation

## 2. Amac

Bu paket PayTR primary ve iyzico secondary-ready odeme saglayici mimarisine uygun typed config/secret resolution foundation kurar.

Bu paket canli odeme entegrasyonu, PayTR initiate/callback live path, payment owner state mutation, worker/queue veya reconciliation paketi degildir.

## 3. Degisen Dosyalar

- `services/payment/src/provider-config.ts`
- `services/payment/src/provider-adapter.ts`
- `services/payment/src/index.ts`
- `tests/smoke/suites/payment-provider-config.ts`
- `tests/smoke/run-smoke.ts`
- `package.json`
- `.env.example`
- `HARDENING-10C4-PAYMENT-PROVIDER-CONFIG-SECRET-RESOLUTION-FOUNDATION-CLOSURE-REPORT.md`

## 4. Env Key Isimleri

Foundation resolver asagidaki env key isimlerini destekler:

- `PAYMENT_PROVIDER_NAME`
- `PAYMENT_PROVIDER_MODE`
- `PAYTR_PROVIDER_MODE`
- `IYZICO_PROVIDER_MODE`
- `PAYTR_MERCHANT_ID`
- `PAYTR_MERCHANT_KEY`
- `PAYTR_MERCHANT_SALT`
- `IYZICO_API_KEY`
- `IYZICO_SECRET_KEY`

`.env.example` icine yalniz bos/placeholder key isimleri eklendi. Gercek merchant key, merchant salt veya hesap bilgisi yazilmadi.

## 5. PayTR Config Karari

`resolvePaymentProviderConfig(env?)` PayTR icin `merchantIdConfigured`, `merchantKeyConfigured`, `merchantSaltConfigured` boolean alanlarini ve callback path olarak `/provider-callback/payment/paytr` degerini uretir.

Aktif provider `paytr` ise `PAYTR_MERCHANT_ID`, `PAYTR_MERCHANT_KEY` veya `PAYTR_MERCHANT_SALT` eksikliginde resolution `not_configured` olur ve usable flag'leri false kalir.

PayTR icin tum secret/config key'leri varsa ve mode `sandbox` veya `production` ise config resolution usable olabilir. Buna ragmen bu paket PayTR live adapter implementation eklemez.

## 6. iyzico Secondary-Ready Config Karari

iyzico icin `apiKeyConfigured`, `secretKeyConfigured` boolean alanlari ve callback path olarak `/provider-callback/payment/iyzico` eklendi.

Aktif provider `iyzico` iken eksik key'ler `IYZICO_API_KEY_REQUIRED` ve/veya `IYZICO_SECRET_KEY_REQUIRED` error'larini uretir.

Bu paket iyzico implementation paketi degildir. Config shape secondary-ready olarak vardir; initiation ve callback verification usable flag'leri false kalir.

## 7. Unsupported Provider / Mode Karari

Unsupported `PAYMENT_PROVIDER_NAME` icin sessiz internal simulation fallback uygulanmaz. Resolution `UNSUPPORTED_PAYMENT_PROVIDER_NAME` error'u uretir, `providerMode=not_configured` olur ve usable flag'leri false kalir.

Unsupported `PAYMENT_PROVIDER_MODE` icin `UNSUPPORTED_PAYMENT_PROVIDER_MODE` error'u uretildi ve provider mode `not_configured` yapildi.

## 8. NotConfigured Adapter Karari

`getPaymentProviderAdapter()` config resolver'a baglandi.

Aktif provider `internal_simulation` ve resolution error'suz ise mevcut simulation adapter davranisi korunur.

Aktif provider `paytr` veya `iyzico` ise live network cagrisi yapilmaz. Adapter `ProviderResultEnvelope` icinde:

- `providerDomain=payment`
- `providerName=paytr` veya `iyzico`
- `operation=initiatePayment`
- `operationStatus=rejected`
- `error.code=PAYMENT_PROVIDER_NOT_IMPLEMENTED` veya `PAYMENT_PROVIDER_NOT_CONFIGURED`
- tum boundary flag'leri false

doner.

Bu domain mutation degildir ve canli odemenin yanlislikla baslatilmasini engeller.

## 9. Secret Redaction Karari

Resolver sonucunda runtime config icinde secret string alanlari bulunabilir.

`sanitizePaymentProviderConfig(config)` helper'i secret degerlerini asla dondurmez. Sanitized output yalniz configured boolean alanlarini, mode/callback path/error/warning bilgisini tasir.

Smoke suite sanitized JSON icinde test secret degerlerinin bulunmadigini assert eder.

## 10. Smoke Senaryolari

Yeni pure suite:

```text
tests/smoke/suites/payment-provider-config.ts
```

Kapsanan senaryolar:

- Default env internal simulation ve simulation mode
- PayTR sandbox fully configured resolution
- PayTR missing merchant key error ve usable=false
- Unsupported provider error ve usable=false
- Unsupported mode error ve `not_configured`
- iyzico missing config secondary-ready shape
- Sanitized output secret redaction
- Adapter internal simulation regression: succeeded/pending/unknown_result
- Adapter PayTR active iken live provider cagirmadan rejected envelope
- Adapter PayTR missing config iken not configured rejected envelope

Suite BFF/Postgres gerektirmez.

## 11. Degismeyen / Yasakli Alanlar

Asagidaki alanlara dokunulmadi:

- BFF callback route/handler
- PayTR callback mapping live BFF path
- `services/payment/src/payment.ts`
- payment state mutation
- order create / order handoff
- finance correction
- risk signal uretimi
- worker/consumer/queue
- reconciliation runtime
- migration/persistence davranisi
- gercek merchant key/salt/env/config degerleri
- `HARDENING_PROGRESS_RECORD`

Git komutu calistirilmadi. `pnpm install` calistirilmadi.

## 12. Calistirilan Komutlar ve Sonuclari

| Komut | Sonuc |
|---|---|
| `pnpm --filter @hx/payment run build` | PASS |
| `pnpm run typecheck` | PASS |
| `pnpm run build` | PASS |
| `pnpm run smoke:payment-provider-config` | PASS |
| `pnpm run smoke:paytr-callback-mapping` | PASS |
| `pnpm run smoke:payment-callback-candidate` | PASS |
| `pnpm run smoke:provider-boundary` | PASS |
| BFF baslatma (`pnpm --filter @hx/bff run start`) | PASS |
| `/health` dogrulama | PASS |
| `pnpm run smoke:payment-provider-boundary` | PASS |

Not: `payment-provider-boundary` BFF tabanli oldugu icin lokal BFF process temiz sekilde baslatildi ve smoke sonrasi kapatildi.

## 13. Boundary Sonucu

10C4 NotConfigured adapter sonucunda uretilen `ProviderResultEnvelope.boundary` alaninda tum flag'ler false kaldi:

- `providerTruth=false`
- `businessTruthMutated=false`
- `ownerStateMutated=false`
- `eventTruthMutated=false`
- `outboxDeliveryGuaranteed=false`

Domain mutation, payment owner state mutation, order/finance/risk mutation eklenmedi.

## 14. Kalan Limitler

- PayTR live initiate yok.
- PayTR callback mapping live path'e bagli degil.
- Real secret manager yok; yalniz env foundation var.
- iyzico implementation yok.
- Payment owner state transition yok.
- Worker/queue yok.
- Reconciliation yok.
- Order handoff yok.
- Finance/risk mutation yok.
- Gercek PayTR test odeme uctan uca denenmedi.

## 15. Nihai Karar

**HARDENING-10C4 - PASS WITH LIMITATION**

Limitasyon gerekcesi: Bu paket yalniz provider config/secret resolution foundation kurar. Live PayTR initiate, PayTR callback mapping live path, async worker, payment owner transition, order handoff, finance/risk linkage, iyzico implementation ve gercek PayTR uctan uca test sonraki paketlerde ele alinacaktir.
