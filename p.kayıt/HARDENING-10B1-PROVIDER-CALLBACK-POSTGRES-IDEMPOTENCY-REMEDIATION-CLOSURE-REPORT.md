# HARDENING-10B1 — Provider Callback Postgres Idempotency Remediation Closure Report

## Paket Adı

HARDENING-10B1 — Provider Callback Postgres Idempotency Remediation & Smoke

## Amaç

Provider callback ingestion açılmadan önce `PostgresProviderCallbackEventRepository` içindeki duplicate `idempotency_key` davranışını in-memory repository ile uyumlu hale getirmek ve bunu gerçek Postgres smoke testiyle kanıtlamak.

## Problem

`InMemoryProviderCallbackEventRepository`, duplicate `providerEventId` ve duplicate `idempotencyKey` durumlarında mevcut kaydı döndürüyordu. Postgres implementasyonu ise `ON CONFLICT` davranışını yalnız `provider_event_id` partial unique indexi için kullanıyordu. Migration'da `idempotency_key` için de unique partial index bulunduğundan, duplicate `idempotency_key` insert denemesi production'da `23505 unique_violation` hatasına yol açabilirdi.

## Değişen Dosyalar

- `packages/persistence/src/provider-callback.ts`
- `tests/smoke/suites/provider-callback-postgres.ts`
- `tests/smoke/run-smoke.ts`
- `package.json`
- `HARDENING-10B1-PROVIDER-CALLBACK-POSTGRES-IDEMPOTENCY-REMEDIATION-CLOSURE-REPORT.md`

## Yapılan Düzeltme

- Postgres insert öncesinde `providerEventId` varsa mevcut kayıt `findProviderCallbackEventByProviderEventId` ile aranır.
- Postgres insert öncesinde `idempotencyKey` varsa mevcut kayıt `findProviderCallbackEventByIdempotencyKey` ile aranır.
- Duplicate kayıt bulunduğunda yeni payload ile business alanları overwrite edilmeden mevcut kayıt döndürülür.
- Mevcut `provider_event_id` `ON CONFLICT` davranışı korunmuştur.
- Race condition kaynaklı `23505 unique_violation` durumunda ilgili mevcut kayıt tekrar aranıp döndürülür.
- Mevcut kayıt bulunamazsa hata tekrar fırlatılır.
- Parametrized query kullanımı korunmuştur.

## Eklenen Postgres Smoke Senaryoları

- `PERSISTENCE_MODE=postgres` ve `DATABASE_URL` ön koşulu doğrulandı.
- Unique `providerEventId` ve unique `idempotencyKey` ile ilk insert doğrulandı.
- Duplicate `providerEventId` insert denemesinde mevcut kayıt döndüğü doğrulandı.
- Duplicate `idempotencyKey` insert denemesinde mevcut kayıt döndüğü doğrulandı.
- Duplicate denemelerde `callbackType`, `rawPayload`, `processingStatus`, `verificationStatus` alanlarının overwrite edilmediği doğrulandı.
- `findProviderCallbackEventByProviderEventId` ve `findProviderCallbackEventByIdempotencyKey` mevcut kaydı buldu.
- `markProviderCallbackEventProcessed` ile `processingStatus=accepted` ve `processedAt` doğrulandı.
- Test verileri benzersiz provider adı, provider event id ve idempotency key ile izole üretildi.

## Değişmeyen / Yasaklı Alanlar

- BFF route eklenmedi.
- Webhook/callback endpoint eklenmedi.
- Signature helper veya real crypto eklenmedi.
- Domain callback processing eklenmedi.
- Payment, shipment, notification, payout servislerine dokunulmadı.
- Worker, consumer veya queue eklenmedi.
- Reconciliation eklenmedi.
- Migration değiştirilmedi ve yeni migration eklenmedi.
- `packages/contracts` değiştirilmedi.
- `packages/persistence/src/index.ts` değiştirilmedi.
- `packages/persistence/package.json` değiştirilmedi.
- `packages/persistence/tsconfig.json` değiştirilmedi.
- `.env.example` değiştirilmedi.
- `tsconfig.base.json` değiştirilmedi.
- `HARDENING_PROGRESS_RECORD` dosyasına dokunulmadı.
- Git komutu çalıştırılmadı.
- `pnpm install` çalıştırılmadı.

## Çalıştırılan Komutlar ve Sonuçları

- `pnpm --filter @hx/persistence run build` — PASS
- `pnpm run typecheck` — PASS
- `pnpm run build` — PASS
- `pnpm run smoke:provider-callback-foundation` — PASS
- `pnpm run smoke:provider-callback-postgres` — PASS

Postgres smoke bu ortamda `PERSISTENCE_MODE=postgres`, `DATABASE_URL`, çalışan Postgres ve uygulanmış `provider_callback_events` migration ile başarıyla geçti. Bu paket kapsamında migration dosyası değiştirilmedi.

## Boundary Sonucu

Provider callback persistence record hâlâ audit/ingestion kaydıdır; business truth değildir. Duplicate callback insert denemeleri owner state mutation, domain command handoff veya business alan overwrite davranışı üretmez. Boundary flag doğrulamaları false kalmıştır.

## Kalan Limitler

- BFF callback/webhook endpoint hâlâ yok.
- Real signature verification hâlâ yok.
- Replay runtime hâlâ yok.
- Provider-specific mapping hâlâ yok.
- Domain callback processing hâlâ yok.
- Worker/queue hâlâ yok.
- Reconciliation runtime hâlâ yok.
- Public webhook rate limiting hâlâ yok.

## Nihai Karar

PASS
