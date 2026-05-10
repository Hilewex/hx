# HARDENING-10C3 - Payment Provider Callback Response Policy Bridge Closure Report

## 1. Paket Adi

HARDENING-10C3 - Payment Provider Callback Response Policy Bridge / No Domain Mutation

## 2. Amac

Bu paket ortak provider callback route uzerinde provider-specific ACK response policy bridge kurar.

Hedef yalniz PayTR icin BFF callback response davranisini PayTR Bildirim URL beklentisiyle uyumlu hale getirmektir: basarili ingestion sonrasi response duz metin `OK` doner.

Bu paket domain processing, live PayTR config, worker/queue, payment owner transition veya iyzico implementation paketi degildir.

## 3. Mimari Karar

Tek route korundu:

```text
POST /provider-callback/payment/:providerName
```

Ayrica PayTR-specific route acilmadi. Provider-specific response davranisi `providerDomain=payment` ve `providerName=paytr` policy secimi ile uygulanir.

## 4. Neden Ayri PayTR Route Acilmadi

10B2 ortak callback ingestion boundary karari korunmustur. Yeni endpoint acmak duplicate ingress yuzeyi, policy drift ve provider callback davranisinin farkli route'larda ayrismasi riskini artirirdi.

10C3'te PayTR farki route seviyesinde degil, ACK policy seviyesinde tutuldu.

## 5. PayTR OK Response Policy Karari

`providerDomain=payment` ve `providerName=paytr` icin handler 2xx sonuc urettiğinde response:

```text
HTTP 200
Content-Type: text/plain
Body: OK
```

JSON envelope donmez ve response icinde `rawPayload` sizdirilmaz.

## 6. Hash Failed / Unsupported Durumunda OK Karari

Bu pakette PayTR live merchant key/salt/env/config yoktur ve PayTR mapping helper live BFF path'e baglanmamistir.

Callback generic ingestion record olarak basariyla persist edildiyse, signature/hash generic handler tarafindan `unsupported` veya ileride `failed` olarak kalsa bile PayTR'ye `OK` donebilir. Gerekce: 10C3 domain processing yapmaz; record'a alinan callback icin retry storm engellenir.

## 7. Rate Limit Durumunda OK Donmeme Karari

Rate limit handler'in persistence adimindan once uygulanir. Rate limited request ingestion'a alinmadigi icin PayTR policy uygulanmaz.

Bu durumda response mevcut JSON error envelope olarak kalir:

```text
HTTP 429
Content-Type: application/json
```

## 8. iyzico Future-Ready Durumu

`providerName=iyzico` ve diger payment provider'lar icin mevcut JSON BFF envelope davranisi korunur.

iyzico icin mapping, hash verification veya provider-specific ACK implementation eklenmedi.

## 9. Degisen Dosyalar

- `apps/bff/src/server/provider-callback.ts`
- `apps/bff/src/server/index.ts`
- `tests/smoke/suites/paytr-callback-bff-policy.ts`
- `tests/smoke/run-smoke.ts`
- `package.json`
- `HARDENING-10C3-PAYMENT-PROVIDER-CALLBACK-RESPONSE-POLICY-BRIDGE-CLOSURE-REPORT.md`

`apps/bff/src/server/response.ts` degistirilmedi; optional ACK policy, provider callback handler response tipi ve index sender daraltmasi ile cozuldu.

## 10. Uygulanan Teknik Degisiklikler

- `ProviderCallbackAckPolicy` tipi eklendi.
- PayTR icin `plain_text` ACK policy resolver eklendi.
- `sendBffResponse` optional `plain_text` ACK policy destekleyecek sekilde genisletildi.
- PayTR callback duplicate identity icin `merchant_oid`, generic `providerEventId` ve `providerReference` alanlarina bridge edildi.
- PayTR mapping helper live BFF path'e baglanmadi.
- Response meta/body icine PayTR raw payload veya normalized candidate eklenmedi.

## 11. Smoke Senaryolari

Yeni suite:

```text
tests/smoke/suites/paytr-callback-bff-policy.ts
```

Kapsanan senaryolar:

- PayTR callback accepted ACK: `HTTP 200`, `text/plain`, body exactly `OK`
- PayTR response JSON envelope degil ve raw payload sizdirmiyor
- PayTR callback `merchant_oid` ile persist ediliyor
- Duplicate PayTR callback `merchant_oid` temelinde idempotent kaliyor ve yine `OK` donuyor
- Rate limited PayTR request `OK` donmuyor, `429` JSON error envelope donuyor
- Non-PayTR provider JSON envelope davranisini koruyor
- `/health` JSON kaliyor
- Persisted callback boundary flag'leri false kaliyor

## 12. Degismeyen / Yasakli Alanlar

Asagidaki alanlara dokunulmadi:

- `services/payment/src/payment.ts`
- payment state mutation
- order create / order handoff
- finance correction
- risk signal uretimi
- worker/consumer/queue
- reconciliation runtime
- migration/persistence davranisi
- gercek merchant key/salt/env/config
- `.env.example`
- `HARDENING_PROGRESS_RECORD`

Git komutu calistirilmadi. `pnpm install` calistirilmadi.

## 13. Calistirilan Komutlar ve Sonuclari

| Komut | Sonuc |
|---|---|
| `pnpm --filter @hx/bff run build` | PASS |
| `pnpm run typecheck` | PASS |
| `pnpm run build` | PASS |
| BFF baslatma (`pnpm --filter @hx/bff run start`) | PASS |
| `/health` dogrulama | PASS |
| `pnpm run smoke:paytr-callback-bff-policy` | PASS |
| `pnpm run smoke:provider-callback-ingestion` | PASS |
| `pnpm run smoke:provider-callback-signature-guard` | PASS |
| `pnpm run smoke:provider-callback-replay-guard` | PASS |
| `pnpm run smoke:provider-callback-freshness-guard` | PASS after clean BFF restart |
| `pnpm run smoke:provider-callback-rate-limit-guard` | PASS |
| `pnpm run smoke:paytr-callback-mapping` | PASS |
| `pnpm run smoke:payment-callback-candidate` | PASS |
| `pnpm run smoke:provider-boundary` | PASS |

Not: `provider-callback-freshness-guard` ilk denemede onceki `signature-test-provider` smoke istekleriyle ayni in-memory rate-limit bucket'ina carpip `429` aldi. BFF temiz process ile yeniden baslatildiktan sonra suite PASS oldu.

## 14. Boundary Sonucu

PayTR BFF policy bridge sonucunda persisted `ProviderCallbackRecord.boundary` alaninda tum flag'ler false kaldi:

- `providerTruth=false`
- `businessTruthMutated=false`
- `ownerStateMutated=false`
- `eventTruthMutated=false`
- `outboxDeliveryGuaranteed=false`

Domain mutation eklenmedi.

## 15. Kalan Limitler

- Gercek `merchant_key` / `merchant_salt` / env yok.
- PayTR live config yok.
- PayTR mapping helper live BFF path'e baglanmadi.
- Payment owner state transition yok.
- Worker/queue yok.
- Reconciliation yok.
- Order handoff yok.
- Finance/risk mutation yok.
- iyzico mapping yok.
- Gercek PayTR test callback uctan uca denenmedi.

## 16. Nihai Karar

**HARDENING-10C3 - PASS WITH LIMITATION**

Limitasyon gerekcesi: Bu paket yalniz provider-specific ACK response policy bridge kurar. PayTR live config, PayTR mapping live path, async worker, payment owner transition, order handoff, finance/risk linkage, iyzico implementation ve gercek PayTR uctan uca test sonraki paketlerde ele alinacaktir.
