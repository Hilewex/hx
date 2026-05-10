# HARDENING-10B2A — Common Provider Callback BFF Ingestion Boundary Closure Report

## Paket Adı

HARDENING-10B2A — Common Provider Callback BFF Ingestion Boundary / Persistence Only

## Amaç

Provider callback ingestion için ortak BFF giriş sınırını kurmak. Bu paket yalnızca gelen callback isteklerini alır, temel payload/header bilgilerini standart `ProviderCallbackRecord` formatında `provider_callback_events` tablosuna kaydeder ve hızlı `202 Accepted` döner.

Bu paket domain processing, real signature verification veya provider-specific mapping paketi değildir.

## Değişen Dosyalar

- `apps/bff/src/server/provider-callback.ts`
- `apps/bff/src/server/index.ts`
- `tests/smoke/suites/provider-callback-ingestion.ts`
- `tests/smoke/run-smoke.ts`
- `package.json`
- `HARDENING-10B2A-COMMON-PROVIDER-CALLBACK-BFF-INGESTION-BOUNDARY-CLOSURE-REPORT.md`

## Eklenen Endpoint

- `POST /provider-callback/:providerDomain/:providerName`

Geçerli `providerDomain` değerleri:

- `payment`
- `shipment`
- `notification`
- `payout`

Geçersiz `providerDomain` için `400` döner. Boş `providerName` için `400` döner.

Başarılı ingestion response:

- HTTP `202 Accepted`
- `data: { id, providerDomain, providerName, callbackType, processingStatus, verificationStatus, replayStatus }`
- `rawPayload` response içinde dönülmez.

## Persistence Davranışı

- Handler `ProviderCallbackRecord` oluşturur ve `getProviderCallbackEventRepository()` üzerinden persistence katmanına yazar.
- `callbackType` body içindeki `callbackType`, `eventType`, `type`, `event` alanlarından veya `x-provider-callback-type` header'ından alınır; yoksa `unknown` kullanılır.
- `providerMode` tanımlı provider mode değerlerinden gelirse kullanılır; aksi halde `sandbox` kullanılır.
- `verificationStatus=unsupported`
- `signatureVerified=false`
- `replayDetected=false`
- `replayStatus=unknown`
- `processingStatus=received`
- `boundary=createProviderBoundaryFlags()`
- `rawPayload` gelen JSON body olarak saklanır.
- `normalizedPayload` ve `error` set edilmez.
- Duplicate `providerEventId` veya `idempotencyKey` durumları 10B1 persistence idempotency davranışına bırakılır; DB unique violation response'a sızmaz.

## Smoke Senaryoları

Eklenen suite:

- `tests/smoke/suites/provider-callback-ingestion.ts`

Doğrulanan senaryolar:

- BFF `/health` endpoint'i çalışıyor.
- `PERSISTENCE_MODE=postgres` ve `DATABASE_URL` ön koşulu doğrulanıyor.
- `POST /provider-callback/payment/{providerName}` çağrısı `202` dönüyor.
- Response içinde `id`, `processingStatus=received`, `verificationStatus=unsupported`, `replayStatus=unknown` doğrulanıyor.
- Response içinde `rawPayload` olmadığı doğrulanıyor.
- `provider_callback_events` kaydı repository üzerinden okunuyor.
- Persisted kayıtta `signatureVerified=false`, `replayDetected=false`, `normalizedPayload=undefined`, `error=undefined` doğrulanıyor.
- Boundary flaglerin tamamının false kaldığı doğrulanıyor.
- Duplicate `providerEventId` ikinci isteği DB hatası üretmeden mevcut kayıt id'sini döndürüyor.
- Duplicate `idempotencyKey` üçüncü isteği DB hatası üretmeden mevcut kayıt id'sini döndürüyor.
- Duplicate denemelerde `callbackType`, `rawPayload`, `processingStatus`, `verificationStatus` overwrite edilmediği doğrulanıyor.
- Geçersiz provider domain `400` dönüyor.

## Değişmeyen / Yasaklı Alanlar

- Payment/shipment/notification/payout state mutate edilmedi.
- Payment/shipment/notification/payout servislerine dokunulmadı.
- Order/settlement/finance/risk state mutate edilmedi.
- Domain callback processing eklenmedi.
- Worker, consumer veya queue eklenmedi.
- Reconciliation eklenmedi.
- Real cryptographic signature verification eklenmedi.
- Provider secret/env eklenmedi.
- `.env.example` değiştirilmedi.
- Migration eklenmedi veya değiştirilmedi.
- `packages/contracts` değiştirilmedi.
- `packages/persistence` davranışı değiştirilmedi.
- `HARDENING_PROGRESS_RECORD` dosyasına dokunulmadı.
- Git komutu çalıştırılmadı.
- `pnpm install` çalıştırılmadı.

## Çalıştırılan Komutlar ve Sonuçları

- `pnpm --filter @hx/bff run build` — PASS
- `pnpm run typecheck` — PASS
- `pnpm run build` — PASS
- `pnpm run smoke:provider-callback-postgres` — PASS
- BFF başlatma — PASS
  - Default `3001` portunda mevcut eski BFF prosesi olduğu için yeni proses `EADDRINUSE` aldı.
  - Route doğrulaması için BFF `BFF_PORT=3011` ile başlatıldı.
- `/health` doğrulama — PASS
  - `http://localhost:3011/health` HTTP 200 döndü.
- `SMOKE_BFF_BASE_URL=http://localhost:3011 pnpm run smoke:provider-callback-ingestion` — PASS
- `pnpm run smoke:provider-boundary` — PASS
- `pnpm run smoke:provider-callback-foundation` — PASS

Postgres smoke ve BFF ingestion smoke bu ortamda `PERSISTENCE_MODE=postgres`, `DATABASE_URL`, çalışan Postgres ve uygulanmış `provider_callback_events` migration ile başarıyla geçti.

## Boundary Sonucu

Provider callback BFF endpoint'i yalnızca ingestion + persistence sınırıdır. BFF domain state mutate etmez, callback record business truth değildir, signature verification `unsupported` olduğu için domain processing yapılmaz, owner command çağrılmaz ve event/outbox/audit business mutation yerine kullanılmaz.

Boundary flaglerin tamamı false kalmıştır:

- `providerTruth=false`
- `businessTruthMutated=false`
- `ownerStateMutated=false`
- `eventTruthMutated=false`
- `outboxDeliveryGuaranteed=false`

## Kalan Limitler

- Real signature verification yok.
- Provider-specific mapping yok.
- Replay runtime yok.
- Domain callback processing yok.
- Worker/queue yok.
- Reconciliation yok.
- Public webhook rate limiting yok.
- Notification/payment/shipment/payout domain effect yok.
- Bu endpoint production webhook güvenliği için tek başına yeterli değildir.

## Nihai Karar

PASS WITH LIMITATION

Limitasyon gerekçesi: Bu paket sadece ortak ingestion + persistence boundary kurar. Production-grade webhook güvenliği için real signature verification, replay guard, provider-specific mapping, async worker, rate limit ve domain processing sonraki paketlerde ele alınacaktır.
