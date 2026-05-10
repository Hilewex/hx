# HARDENING-10B2C - Provider Callback Replay / Idempotency Guard Foundation Closure Report

## Paket Adi

HARDENING-10B2C - Provider Callback Replay / Idempotency Guard Foundation

## Amac

HARDENING-10B2A ve HARDENING-10B2B ile kurulan provider callback ingestion + signature guard hattina, domain processing'e gecmeden once replay/idempotency guard foundation eklemek.

Bu paket domain callback processing, provider-specific mapping, worker/queue/reconciliation veya payment/shipment/notification/payout state mutation paketi degildir.

## Degisen Dosyalar

- `apps/bff/src/server/provider-callback.ts`
- `tests/smoke/suites/provider-callback-replay-guard.ts`
- `tests/smoke/suites/provider-callback-ingestion.ts`
- `tests/smoke/suites/provider-callback-signature-guard.ts`
- `tests/smoke/run-smoke.ts`
- `package.json`
- `HARDENING-10B2C-PROVIDER-CALLBACK-REPLAY-IDEMPOTENCY-GUARD-CLOSURE-REPORT.md`

`packages/contracts` ve `packages/persistence` okunarak mevcut replay/idempotency contract ve repository lookup davranisi dogrulandi; degistirilmedi.

## Replay / Idempotency Guard Davranisi

Handler callback kimligini su alanlardan cozer:

- `providerEventId` / `eventId` / `id`
- `x-provider-event-id`
- `idempotencyKey`
- `idempotency-key`
- `x-idempotency-key`

Ilk kez gelen callback icin:

- Mevcut kayit yoksa normal insert yapilir.
- `providerEventId` veya `idempotencyKey` varsa `replayStatus=first_seen` persist edilir.
- Kimlik alanlari yoksa `replayStatus=unknown` persist edilir.
- `replayDetected=false` persist edilir.
- Signature guard kararina gore `processingStatus=received` veya `processingStatus=rejected` persist edilir.
- Response minimal kalir ve `rawPayload` donmez.

Duplicate callback icin:

- Insert yapilmaz.
- Mevcut kayit overwrite edilmez.
- Response HTTP `202` doner.
- `data.id` mevcut kaydin id'sidir.
- `data.processingStatus=duplicate`
- `data.originalProcessingStatus` mevcut kaydin persisted processing status degeridir.
- `data.verificationStatus` mevcut kaydin persisted verification status degeridir.
- `data.replayStatus=duplicate_event`
- `data.replayDetected=true`

## Duplicate Precedence Karari

Replay guard insert oncesi iki lookup yapar:

1. `repository.findProviderCallbackEventByProviderEventId`
2. `repository.findProviderCallbackEventByIdempotencyKey`

Tek bir existing record bulunursa duplicate response doner.

Hem `providerEventId` hem `idempotencyKey` bulunur ve farkli kayitlara isaret ederse identity conflict/anomaly kabul edilir:

- Yeni kayit insert edilmez.
- Existing kayit overwrite edilmez.
- HTTP `202` doner.
- `data.processingStatus=rejected`
- `data.replayStatus=replay_detected`
- `data.replayDetected=true`
- `data.errorCode=CALLBACK_IDENTITY_CONFLICT`
- `data.id` providerEventId tarafindan bulunan existing kaydin id'sidir.

Bu pakette identity conflict icin ayri audit/outbox/risk event uretilmez ve persistence error alani guncellenmez.

## Signature + Replay Etkilesimi

- Duplicate callback icin signature yeniden hesaplansa bile existing kayit overwrite edilmez.
- Duplicate valid callback response seviyesinde `duplicate` olarak gorunur.
- Existing valid event uzerine invalid signature ile duplicate gelirse existing verified kayit korunur ve response `duplicate_event` doner.
- Yeni invalid signature callback duplicate degilse insert edilir:
  - `verificationStatus=failed`
  - `processingStatus=rejected`
  - `replayStatus=first_seen` veya `unknown`
  - `replayDetected=false`

## Eklenen Smoke Senaryolari

Eklenen suite:

- `tests/smoke/suites/provider-callback-replay-guard.ts`

Dogrulanan senaryolar:

- BFF `/health` endpoint'i calisiyor.
- `PERSISTENCE_MODE=postgres` ve `DATABASE_URL` on kosulu dogrulaniyor.
- First seen callback HTTP `202` donuyor, response ve persisted kayitta `replayStatus=first_seen`, `replayDetected=false`.
- Duplicate `providerEventId` HTTP `202` donuyor, ayni id ile `processingStatus=duplicate`, `replayStatus=duplicate_event`, `replayDetected=true`.
- Duplicate `idempotencyKey` HTTP `202` donuyor, ayni id ile `processingStatus=duplicate`, `replayStatus=duplicate_event`, `replayDetected=true`.
- Duplicate denemeler existing record'u overwrite etmiyor.
- Invalid signature first_seen kayit `verificationStatus=failed`, `processingStatus=rejected`, `replayStatus=first_seen`.
- Existing valid event uzerine invalid duplicate gelince existing verified record korunuyor.
- Identity conflict safe rejected/anomaly response uretiyor.
- Boundary flaglerin tamami false kaliyor.
- Domain state mutation yok.

Guncellenen mevcut smoke beklentileri:

- `provider-callback-ingestion` first seen response/persisted kayit icin `replayStatus=first_seen` bekler.
- `provider-callback-ingestion` duplicate response icin `processingStatus=duplicate` ve `replayStatus=duplicate_event` bekler.
- `provider-callback-signature-guard` valid/invalid/unsupported/missing first seen kayitlar icin `replayStatus=first_seen` bekler.
- `provider-callback-signature-guard` duplicate valid callback icin `processingStatus=duplicate` ve `replayStatus=duplicate_event` bekler.

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
  - Ilk denemede duplicate local `repository` degiskeni nedeniyle FAIL oldu; handler icindeki eski tekrar tanim kaldirildi.
  - Tekrar calistirildi ve PASS.
- `pnpm run typecheck` - PASS
- `pnpm run build` - PASS
- BFF baslatma - PASS
  - `BFF_PORT=3011` ve `PORT=3011` ile baslatildi.
- `/health` dogrulama - PASS
  - `http://localhost:3011/health` HTTP 200 dondu.
- `SMOKE_BFF_BASE_URL=http://localhost:3011 pnpm run smoke:provider-callback-ingestion` - PASS
- `SMOKE_BFF_BASE_URL=http://localhost:3011 pnpm run smoke:provider-callback-signature-guard` - PASS
- `SMOKE_BFF_BASE_URL=http://localhost:3011 pnpm run smoke:provider-callback-replay-guard` - PASS
- `SMOKE_BFF_BASE_URL=http://localhost:3011 pnpm run smoke:provider-callback-postgres` - PASS
- `SMOKE_BFF_BASE_URL=http://localhost:3011 pnpm run smoke:provider-boundary` - PASS
- `SMOKE_BFF_BASE_URL=http://localhost:3011 pnpm run smoke:provider-callback-foundation` - PASS

Postgres smoke ve BFF replay guard smoke bu ortamda `PERSISTENCE_MODE=postgres`, `DATABASE_URL`, calisan Postgres ve uygulanmis `provider_callback_events` migration ile basariyla gecti.

## Boundary Sonucu

Provider callback BFF endpoint'i hala yalniz ingestion + persistence + signature guard + replay/idempotency guard foundation siniridir.

BFF domain state mutate etmez, callback record business truth degildir, replay guard domain owner command cagirmaz, duplicate callback icin domain command uretmez, event/outbox/audit business mutation yerine kullanilmaz.

Boundary flaglerin tamami false kalmistir:

- `providerTruth=false`
- `businessTruthMutated=false`
- `ownerStateMutated=false`
- `eventTruthMutated=false`
- `outboxDeliveryGuaranteed=false`

## Kalan Limitler

- Provider-specific replay window yok.
- Timestamp/nonce freshness guard yok.
- Real provider secret/env yok.
- Provider-specific mapping yok.
- Worker/queue yok.
- Domain processing yok.
- Reconciliation yok.
- Public webhook rate limiting yok.
- Identity conflict anomaly audit/risk event'e baglanmadi.
- Duplicate/anomaly kayitlari ayri audit/outbox uretmiyor.
- Identity conflict icin persistence error alani guncellenmiyor.

## Nihai Karar

PASS WITH LIMITATION

Limitasyon gerekcesi: Bu paket replay/idempotency guard foundation kurar. Provider-specific replay window, timestamp/nonce freshness validation, audit/risk anomaly event, async worker, rate limiting ve domain processing sonraki paketlerde ele alinacaktir.
