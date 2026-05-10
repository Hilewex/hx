""""# HARDENING-10B2E - Provider Callback Public Webhook Rate Limit / Abuse Guard Foundation Closure Report

## Paket Adi

HARDENING-10B2E - Provider Callback Public Webhook Rate Limit / Abuse Guard Foundation

## Amac

HARDENING-10B2A/B/C/D ile kurulan provider callback ingestion + signature + replay/idempotency + freshness guard hattina public webhook rate limit / abuse guard foundation eklemek.

Bu paket domain callback processing, provider-specific mapping, production API gateway/WAF, worker/queue/reconciliation veya domain state mutation paketi degildir.

## Degisen Dosyalar

- `apps/bff/src/server/provider-callback.ts`
- `tests/smoke/suites/provider-callback-rate-limit-guard.ts`
- `tests/smoke/run-smoke.ts`
- `package.json`
- `HARDENING-10B2E-PROVIDER-CALLBACK-PUBLIC-WEBHOOK-RATE-LIMIT-ABUSE-GUARD-CLOSURE-REPORT.md`

Zorunlu referanslar okundu:

- `HARDENING-10B2A-COMMON-PROVIDER-CALLBACK-BFF-INGESTION-BOUNDARY-CLOSURE-REPORT.md`
- `HARDENING-10B2B-PROVIDER-CALLBACK-SIGNATURE-GUARD-FOUNDATION-CLOSURE-REPORT.md`
- `HARDENING-10B2C-PROVIDER-CALLBACK-REPLAY-IDEMPOTENCY-GUARD-CLOSURE-REPORT.md`
- `HARDENING-10B2D-PROVIDER-CALLBACK-TIMESTAMP-NONCE-FRESHNESS-GUARD-CLOSURE-REPORT.md`
- `apps/bff/src/server/provider-callback.ts`
- `tests/smoke/suites/provider-callback-freshness-guard.ts`
- `tests/smoke/suites/provider-callback-replay-guard.ts`
- `tests/smoke/run-smoke.ts`
- `package.json`
- `planlama/TEST_STRATEJISI.md`
- `planlama/KONFIGURASYON_YONETIMI.md`
- `planlama/asama-2/OWNER_MATRIX.md`

## Rate / Abuse Guard Davranisi

`apps/bff/src/server/provider-callback.ts` icinde process-local in-memory rate guard eklendi.

Bucket anahtari:

- `providerDomain`
- `providerName`
- client identifier

Client identifier sirasi:

- `x-forwarded-for` ilk IP
- `x-real-ip`
- `unknown`

Bu pakette `apps/bff/src/server/index.ts` degistirilmedi; `remoteAddress` metadata eklenmedi.

Guard sirasi:

1. `providerDomain` canonical validasyonu
2. `providerName` bosluk validasyonu
3. rate limit guard
4. callback type / identity resolve
5. signature guard
6. replay/idempotency lookup
7. freshness guard
8. persistence insert

Bu nedenle rate limited istekler signature/replay/freshness hesaplanmadan ve persistence'a yazilmadan once doner.

## Limit Constants

Eklenen foundation constant degerleri:

- `CALLBACK_RATE_LIMIT_WINDOW_MS = 60 * 1000`
- `CALLBACK_RATE_LIMIT_MAX_REQUESTS = 20`
- `CALLBACK_RATE_LIMIT_BLOCK_MS = 60 * 1000`

Ayni `providerDomain + providerName + clientKey` bucket'i icin 60 saniyede 20 istek kabul edilir. 21. istek rate limited olur ve bucket 60 saniye bloklanir.

## Rate Limited Response Karari

Rate limited response:

- HTTP `429`
- error envelope
- `code=PROVIDER_CALLBACK_RATE_LIMITED`
- `message=Provider callback rate limit exceeded`
- `category=transport`

Response `data` veya callback `id` icermez.

## Persistence Bypass Karari

Rate limited isteklerde:

- `rawPayload` persist edilmez.
- `provider_callback_events` insert yapilmaz.
- `providerEventId` lookup bos kalir.
- Domain mutation yoktur.
- Boundary flag uretimi veya owner command yoktur.

## Test Izolasyonu

Yeni smoke suite benzersiz `providerName` kullanir.

Burst testleri:

- Ayni `providerName`
- Ayni `x-forwarded-for`
- Farkli `providerEventId`
- Farkli `idempotencyKey`

Izolasyon testleri:

- Ayni client ile farkli `providerName` HTTP `202` alir.
- Ayni `providerName` ile farkli `x-forwarded-for` HTTP `202` alir.

Mevcut signature/replay/freshness smoke'larinda sabit `signature-test-provider` kullanimi oldugu icin process-local limiter state'inin test sonucunu kirletmemesi adina freshness smoke oncesi BFF yeniden baslatildi.

## Eklenen Smoke Senaryolari

Eklenen suite:

- `tests/smoke/suites/provider-callback-rate-limit-guard.ts`

Dogrulanan senaryolar:

- BFF `/health` endpoint'i calisiyor.
- Ilk 20 istek HTTP `202` donuyor.
- Ilk 20 istekte normal `first_seen` behavior korunuyor.
- 21. istek HTTP `429` donuyor.
- 429 response error envelope icinde `PROVIDER_CALLBACK_RATE_LIMITED` donuyor.
- 429 response `data/id` icermiyor.
- Rate limited `providerEventId` DB lookup ile bulunamiyor.
- Farkli `providerName` ayni client ile HTTP `202` alabiliyor.
- Ayni `providerName` farkli `x-forwarded-for` ile HTTP `202` alabiliyor.
- Boundary flaglerin tamami false kalmaya devam ediyor.
- Domain state mutation yok.

Smoke runner'a eklenen suite:

- `provider-callback-rate-limit-guard`

Root package script:

- `smoke:provider-callback-rate-limit-guard`

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
- Real API gateway/WAF entegrasyonu eklenmedi.
- Redis/distributed rate limit eklenmedi.
- `HARDENING_PROGRESS_RECORD` dosyasina dokunulmadi.
- Git komutu calistirilmadi.
- `pnpm install` calistirilmadi.

## Calistirilan Komutlar ve Sonuclari

- `pnpm --filter @hx/bff run build` - PASS
- `pnpm run typecheck` - PASS
- `pnpm run build` - PASS
- BFF baslatma - PASS
  - Ilk baslatma komutunda PowerShell env kacisi hatali oldugu icin BFF varsayilan `3001` portunda acildi; baslatilan surec kapatildi.
  - Dogru env ile BFF `BFF_PORT=3013` ve `PORT=3013` uzerinden baslatildi.
- `/health` dogrulama - PASS
  - `http://localhost:3013/health` HTTP 200 dondu.
- `SMOKE_BFF_BASE_URL=http://localhost:3013 pnpm run smoke:provider-callback-rate-limit-guard` - PASS
  - Ilk deneme Docker/Postgres kapali oldugu icin `ECONNREFUSED localhost:5433` ile FAIL oldu.
  - Docker Desktop baslatildi.
  - `docker compose -f infra/compose/docker-compose.local.yml up -d postgres` calistirildi.
  - Postgres `localhost:5433` hazirlandiktan sonra suite tekrar calistirildi ve PASS oldu.
- `SMOKE_BFF_BASE_URL=http://localhost:3013 pnpm run smoke:provider-callback-ingestion` - PASS
- `SMOKE_BFF_BASE_URL=http://localhost:3013 pnpm run smoke:provider-callback-signature-guard` - PASS
- `SMOKE_BFF_BASE_URL=http://localhost:3013 pnpm run smoke:provider-callback-replay-guard` - PASS
- BFF yeniden baslatma - PASS
  - Process-local limiter state izolasyonu icin freshness smoke oncesi yapildi.
- `SMOKE_BFF_BASE_URL=http://localhost:3013 pnpm run smoke:provider-callback-freshness-guard` - PASS
- `pnpm run smoke:provider-callback-postgres` - PASS
- `SMOKE_BFF_BASE_URL=http://localhost:3013 pnpm run smoke:provider-boundary` - PASS
- `SMOKE_BFF_BASE_URL=http://localhost:3013 pnpm run smoke:provider-callback-foundation` - PASS

## Boundary Sonucu

Provider callback BFF endpoint'i hala yalniz ingestion + persistence + signature guard + replay/idempotency guard + timestamp freshness guard + process-local rate/abuse guard foundation siniridir.

BFF domain state mutate etmez, callback record business truth degildir, rate limited callback owner command cagirmaz, event/outbox/audit business mutation yerine kullanilmaz.

Boundary flaglerin tamami false kalmistir:

- `providerTruth=false`
- `businessTruthMutated=false`
- `ownerStateMutated=false`
- `eventTruthMutated=false`
- `outboxDeliveryGuaranteed=false`

## Kalan Limitler

- Process-local in-memory guard'dir.
- Distributed/Redis/API gateway/WAF yok.
- Provider-specific limit config yok.
- Remote IP guveni proxy ayarlarina baglidir.
- Rate limited attempt audit/risk event'e bagli degil.
- Domain processing yok.
- Worker/queue yok.
- Reconciliation yok.

## Nihai Karar

PASS WITH LIMITATION

Limitasyon gerekcesi: Bu paket yalniz process-local public webhook abuse guard foundation kurar. Production-grade distributed rate limiting, API gateway/WAF, provider-specific limits, audit/risk event linkage ve domain processing sonraki paketlerde ele alinacaktir.
""""