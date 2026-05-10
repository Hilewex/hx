# HARDENING-10B2D - Provider Callback Timestamp / Nonce Freshness Guard Foundation Closure Report

## Paket Adi

HARDENING-10B2D - Provider Callback Timestamp / Nonce Freshness Guard Foundation

## Amac

HARDENING-10B2A, HARDENING-10B2B ve HARDENING-10B2C ile kurulan provider callback ingestion + signature + replay/idempotency hattina, domain processing'e gecmeden once timestamp/nonce freshness guard foundation eklemek.

Bu paket domain callback processing, provider-specific mapping, real provider config, worker/queue/reconciliation veya payment/shipment/notification/payout state mutation paketi degildir.

## Degisen Dosyalar

- `apps/bff/src/server/provider-callback.ts`
- `tests/smoke/suites/provider-callback-freshness-guard.ts`
- `tests/smoke/run-smoke.ts`
- `package.json`
- `HARDENING-10B2D-PROVIDER-CALLBACK-TIMESTAMP-NONCE-FRESHNESS-GUARD-CLOSURE-REPORT.md`

Zorunlu referanslar okundu:

- `HARDENING-10B2A-COMMON-PROVIDER-CALLBACK-BFF-INGESTION-BOUNDARY-CLOSURE-REPORT.md`
- `HARDENING-10B2B-PROVIDER-CALLBACK-SIGNATURE-GUARD-FOUNDATION-CLOSURE-REPORT.md`
- `HARDENING-10B2C-PROVIDER-CALLBACK-REPLAY-IDEMPOTENCY-GUARD-CLOSURE-REPORT.md`
- `packages/contracts/src/provider.ts`
- `planlama/TEST_STRATEJISI.md`
- `planlama/aşama-3/IDEMPOTENCY_POLICIES.md`
- `planlama/KONFIGURASYON_YONETIMI.md`
- `planlama/aşama-2/OWNER_MATRIX.md`

`packages/contracts`, `packages/persistence` ve migration davranisi degistirilmedi.

## Freshness Guard Davranisi

Handler su header alanlarini okur:

- `x-provider-timestamp`
- `x-provider-nonce`

Timestamp yoksa:

- Bu pakette production blocker gibi davranmaz.
- Persisted `processingStatus` mevcut signature kararina gore kalir.
- Persisted `replayStatus` mevcut replay/idempotency kararina gore kalir.
- `replayDetected=false` kalir.

Timestamp gecersizse:

- Duplicate degilse yeni callback insert edilir.
- `processingStatus=rejected`
- `replayStatus=replay_detected`
- `replayDetected=true`
- `verificationStatus` signature guard sonucuna gore persist edilir.

Timestamp eskiyse:

- Duplicate degilse yeni callback insert edilir.
- `processingStatus=rejected`
- `replayStatus=replay_detected`
- `replayDetected=true`

Timestamp future tolerance disindaysa:

- Duplicate degilse yeni callback insert edilir.
- `processingStatus=rejected`
- `replayStatus=replay_detected`
- `replayDetected=true`

Timestamp window icindeyse:

- Mevcut behavior korunur.
- Valid signature icin `processingStatus=received`, `replayStatus=first_seen`, `replayDetected=false`.
- Invalid signature icin `processingStatus=rejected`, `replayStatus=first_seen`, `replayDetected=false`.
- Missing/unsupported signature icin mevcut unsupported davranis korunur.

Response minimal kalir:

- `id`
- `providerDomain`
- `providerName`
- `callbackType`
- `processingStatus`
- `verificationStatus`
- `replayStatus`
- `replayDetected`

Response icinde `rawPayload` donmez. Bu pakette response'a veya persistence contract'a ayri `freshnessStatus` alani eklenmedi.

## Timestamp Parse / Window Karari

Eklenen sabitler:

- `CALLBACK_FRESHNESS_WINDOW_MS = 5 * 60 * 1000`
- `CALLBACK_FUTURE_TOLERANCE_MS = 60 * 1000`

Parse karari:

- ISO timestamp string kabul edilir.
- Numeric epoch string kabul edilir.
- Mutlak numeric deger `1_000_000_000_000` altindaysa epoch seconds kabul edilip 1000 ile carpilir.
- Mutlak numeric deger `1_000_000_000_000` ve ustundeyse epoch milliseconds kabul edilir.
- Parse edilemeyen veya safe integer olmayan numeric timestamp gecersiz kabul edilir.

Window karari:

- `receivedAt - providerTimestamp > 5 dakika` ise eski timestamp olarak `replay_detected`.
- `providerTimestamp - receivedAt > 60 saniye` ise future tolerance disi olarak `replay_detected`.
- Bu esikler provider-specific config degildir; bu paket icin foundation/test code constant olarak tutuldu.
- Env/config eklenmedi.

## Nonce Karari

- `x-provider-nonce` header'i okunur.
- Nonce yoksa callback rejected yapilmaz.
- Nonce reuse tracking yapilmaz.
- Nonce cache/store eklenmedi.
- Bu pakette nonce freshness yoktur; yalniz timestamp freshness guard vardir.

## Duplicate Precedence Korumasi

Replay/idempotency identity lookup insert oncesinde calismaya devam eder:

1. `repository.findProviderCallbackEventByProviderEventId`
2. `repository.findProviderCallbackEventByIdempotencyKey`

Existing duplicate callback icin timestamp tekrar degerlendirilse bile existing record overwrite edilmez.

Duplicate response korunur:

- `processingStatus=duplicate`
- `replayStatus=duplicate_event`
- `replayDetected=true`
- `originalProcessingStatus` existing persisted record'dan gelir.

Identity conflict davranisi korunur:

- Yeni kayit insert edilmez.
- Existing kayit overwrite edilmez.
- HTTP `202` doner.
- `processingStatus=rejected`
- `replayStatus=replay_detected`
- `replayDetected=true`
- `errorCode=CALLBACK_IDENTITY_CONFLICT`

## Signature + Freshness Etkilesimi

- Signature guard verification sonucu hesaplanir ve persisted `verificationStatus` / `signatureVerified` alanlarina yazilir.
- Freshness guard invalid/old/future timestamp icin domain processing'i engelleyen ust karar olarak `processingStatus=rejected`, `replayStatus=replay_detected`, `replayDetected=true` persist eder.
- Valid timestamp mevcut signature/replay davranisini bozmaz.
- Missing timestamp mevcut behavior'i bozmaz.
- Duplicate callback icin invalid/old/future timestamp existing record'u overwrite etmez.

## Eklenen Smoke Senaryolari

Eklenen suite:

- `tests/smoke/suites/provider-callback-freshness-guard.ts`

Dogrulanan senaryolar:

- BFF `/health` endpoint'i calisiyor.
- `PERSISTENCE_MODE=postgres` ve `DATABASE_URL` on kosulu dogrulaniyor.
- Valid current timestamp HTTP `202` donuyor, `processingStatus=received`, `replayStatus=first_seen`, `replayDetected=false`.
- Missing timestamp HTTP `202` donuyor ve mevcut behavior korunuyor.
- Old timestamp (`now - 10 dakika`) HTTP `202` donuyor, persisted `processingStatus=rejected`, `replayStatus=replay_detected`, `replayDetected=true`.
- Future timestamp (`now + 2 dakika`) HTTP `202` donuyor, persisted `processingStatus=rejected`, `replayStatus=replay_detected`, `replayDetected=true`.
- Invalid timestamp (`not-a-date`) HTTP `202` donuyor, persisted `processingStatus=rejected`, `replayStatus=replay_detected`, `replayDetected=true`.
- Existing valid record uzerine old timestamp ile duplicate gelince response `duplicate_event` donuyor ve original record overwrite edilmiyor.
- Identity conflict davranisi bozulmuyor.
- Boundary flaglerin tamami false kaliyor.
- Domain state mutation yok.

Smoke runner'a eklenen suite:

- `provider-callback-freshness-guard`

Root package script:

- `smoke:provider-callback-freshness-guard`

## Degismeyen / Yasakli Alanlar

- Payment/shipment/notification/payout servislerine dokunulmadi.
- Order/settlement/finance/risk state mutate edilmedi.
- Domain callback processing eklenmedi.
- Provider-specific mapping eklenmedi.
- Worker/consumer/queue eklenmedi.
- Reconciliation eklenmedi.
- Migration eklenmedi veya degistirilmedi.
- `packages/contracts` degistirilmedi.
- `packages/persistence` davranisi degistirilmedi.
- Provider secret/env eklenmedi.
- `.env.example` degistirilmedi.
- Real provider canonicalization eklenmedi.
- `HARDENING_PROGRESS_RECORD` dosyasina dokunulmadi.
- Git komutu calistirilmadi.
- `pnpm install` calistirilmadi.

## Calistirilan Komutlar ve Sonuclari

- `pnpm --filter @hx/bff run build` - PASS
- `pnpm run typecheck` - PASS
- `pnpm run build` - PASS
- BFF baslatma - PASS
  - `BFF_PORT=3012` ve `PORT=3012` ile baslatildi.
- `/health` dogrulama - PASS
  - `http://localhost:3012/health` HTTP 200 dondu.
- `SMOKE_BFF_BASE_URL=http://localhost:3012 pnpm run smoke:provider-callback-ingestion` - PASS
- `SMOKE_BFF_BASE_URL=http://localhost:3012 pnpm run smoke:provider-callback-signature-guard` - PASS
- `SMOKE_BFF_BASE_URL=http://localhost:3012 pnpm run smoke:provider-callback-replay-guard` - PASS
- `SMOKE_BFF_BASE_URL=http://localhost:3012 pnpm run smoke:provider-callback-freshness-guard` - PASS
- `SMOKE_BFF_BASE_URL=http://localhost:3012 pnpm run smoke:provider-callback-postgres` - PASS
- `SMOKE_BFF_BASE_URL=http://localhost:3012 pnpm run smoke:provider-boundary` - PASS
- `SMOKE_BFF_BASE_URL=http://localhost:3012 pnpm run smoke:provider-callback-foundation` - PASS

Postgres smoke ve BFF freshness guard smoke bu ortamda `PERSISTENCE_MODE=postgres`, `DATABASE_URL`, calisan Postgres ve uygulanmis `provider_callback_events` migration ile basariyla gecti.

## Boundary Sonucu

Provider callback BFF endpoint'i hala yalniz ingestion + persistence + signature guard + replay/idempotency guard + timestamp freshness guard foundation siniridir.

BFF domain state mutate etmez, callback record business truth degildir, freshness guard domain owner command cagirmaz, old/future/invalid timestamp callback icin domain command uretmez, event/outbox/audit business mutation yerine kullanilmaz.

Boundary flaglerin tamami false kalmistir:

- `providerTruth=false`
- `businessTruthMutated=false`
- `ownerStateMutated=false`
- `eventTruthMutated=false`
- `outboxDeliveryGuaranteed=false`

## Kalan Limitler

- Provider-specific replay window yok.
- Nonce reuse cache yok.
- Real provider secret/env yok.
- Provider-specific mapping yok.
- Worker/queue yok.
- Domain processing yok.
- Reconciliation yok.
- Public webhook rate limiting yok.
- Freshness anomaly audit/risk event'e bagli degil.
- Freshness status persistence contract'a ayri alan olarak eklenmedi.

## Nihai Karar

PASS WITH LIMITATION

Limitasyon gerekcesi: Bu paket timestamp freshness guard foundation kurar. Provider-specific replay window, nonce reuse cache, real provider config, audit/risk anomaly event, async worker, rate limiting ve domain processing sonraki paketlerde ele alinacaktir.
