# HARDENING-10B2F - Common Provider Callback Ingestion Security Boundary Final Closure

## 1. Genel Durum

10B2 hattı, 10A/10B1 ile kurulan provider callback contract + persistence temelinin üzerine public webhook üzerinden gelen payment, shipment, notification ve payout callback sinyallerini ortak ve güvenli bir BFF ingestion boundary içinde karşılamak için açıldı.

10B2A-E ile tamamlanan foundation katmanları:

- Ortak BFF endpoint ve persistence ingestion boundary.
- Signature guard foundation.
- Replay / idempotency guard foundation.
- Timestamp freshness guard foundation.
- Process-local public webhook rate / abuse guard foundation.

Bu final closure, ortak callback security boundary'nin foundation olarak kapanıp kapanmadığını ve payment/shipment/notification/payout domain processing'e doğrudan geçilip geçilemeyeceğini karara bağlamak için oluşturulmuştur.

## 2. 10B2 Paket Özeti

| Paket | Amaç | Eklenen capability | Test/smoke kanıtı | Karar |
|---|---|---|---|---|
| 10B2A - Common BFF Ingestion Boundary | Callback isteklerini ortak BFF endpoint'te almak ve persist etmek | `POST /provider-callback/:providerDomain/:providerName`, raw payload persistence, minimal `202` response | `smoke:provider-callback-ingestion`, `smoke:provider-callback-postgres`, `smoke:provider-boundary`, `smoke:provider-callback-foundation` PASS raporlandı | PASS WITH LIMITATION |
| 10B2B - Signature Guard Foundation | Domain processing öncesi signature guard temelini kurmak | HMAC SHA-256 test canonicalization, valid/invalid/unsupported/missing signature ayrımı | `smoke:provider-callback-signature-guard` ve önceki ingestion/postgres/boundary smoke'ları PASS raporlandı | PASS WITH LIMITATION |
| 10B2C - Replay / Idempotency Guard Foundation | Duplicate callback'in yeni etki üretmesini engellemek | `providerEventId` ve `idempotencyKey` lookup, duplicate response, identity conflict rejection | `smoke:provider-callback-replay-guard` ve regresyon smoke'ları PASS raporlandı | PASS WITH LIMITATION |
| 10B2D - Timestamp / Nonce Freshness Guard Foundation | Eski, future tolerance dışı veya invalid timestamp sinyallerini domain processing dışı bırakmak | 5 dakika freshness window, 60 saniye future tolerance, invalid/old/future `replay_detected` | `smoke:provider-callback-freshness-guard` ve önceki callback smoke'ları PASS raporlandı | PASS WITH LIMITATION |
| 10B2E - Public Webhook Rate Limit / Abuse Guard Foundation | Public webhook abuse riskine process-local guard eklemek | `providerDomain + providerName + clientKey` bucket, 60 saniyede 20 istek, 21. istekte `429` | `smoke:provider-callback-rate-limit-guard` ve callback/boundary smoke seti PASS raporlandı | PASS WITH LIMITATION |

## 3. Mevcut Ortak Callback Boundary Capability

- BFF endpoint var mı? Evet. `apps/bff/src/server/index.ts` içinde `POST /provider-callback/:providerDomain/:providerName` route'u `handleProviderCallbackIngestion` handler'ına bağlanmış durumda.
- Persistence var mı? Evet. `packages/persistence/src/provider-callback.ts` hem in-memory hem Postgres repository sağlar.
- Duplicate/idempotency guard var mı? Evet. Handler insert öncesi `providerEventId` ve `idempotencyKey` lookup yapar.
- Signature guard var mı? Evet. Foundation seviyesinde `hmac_sha256` test provider doğrulaması ve unsupported/failed/verified ayrımı var.
- Freshness guard var mı? Evet. `x-provider-timestamp` parse edilir; invalid/old/future timestamp rejected + replay_detected olur.
- Rate/abuse guard var mı? Evet. Process-local in-memory rate limiter var.
- Boundary flags false mı? Evet. `createProviderBoundaryFlags()` tüm record'larda `providerTruth=false`, `businessTruthMutated=false`, `ownerStateMutated=false`, `eventTruthMutated=false`, `outboxDeliveryGuaranteed=false` üretir.
- Response rawPayload sızdırıyor mu? Hayır. Response minimal data döner; `rawPayload` response içinde yoktur.
- Domain mutation var mı? Hayır.
- Owner command var mı? Hayır.
- Event/outbox/audit mutation var mı? Hayır.

## 4. Boundary Değişmezleri

- Provider callback business truth değildir. Doğrulandı.
- Callback record owner state mutation değildir. Doğrulandı.
- BFF truth owner değildir. Doğrulandı.
- Provider response/callback domain truth'u doğrudan mutate edemez. Doğrulandı.
- Duplicate/replay callback domain command üretmez. Doğrulandı.
- Invalid signature domain command üretmez. Doğrulandı.
- Old/future/invalid timestamp domain command üretmez. Doğrulandı.
- Rate limited request persistence'a bile yazılmaz. Doğrulandı.
- Event/outbox/audit business mutation yerine geçmez. Doğrulandı.
- Domain effect yalnız ilgili owner command/event zinciriyle olabilir. Doğrulandı.

Bu değişmezler `OWNER_MATRIX`, `GUARD_MATRIX`, `VERI_AKISI_SENKRONIZASYON_MODELI`, `INTEGRATION_BEHAVIOR_RULES`, `EVENT_TAXONOMY` ve `AUDIT_TAXONOMY` referanslarıyla uyumludur.

## 5. Smoke / Verification Coverage

- `smoke:provider-callback-postgres`: Postgres callback repository duplicate/idempotency davranışını kanıtlar.
- `smoke:provider-callback-ingestion`: BFF endpoint ingestion, persistence, minimal response ve rawPayload sızıntısı olmadığını kanıtlar.
- `smoke:provider-callback-signature-guard`: valid/invalid/unsupported/missing signature durumlarını kanıtlar.
- `smoke:provider-callback-replay-guard`: first_seen, duplicate_event, identity conflict ve overwrite yapılmamasını kanıtlar.
- `smoke:provider-callback-freshness-guard`: valid/missing/old/future/invalid timestamp davranışlarını kanıtlar.
- `smoke:provider-callback-rate-limit-guard`: burst limit, `429` envelope, persistence bypass ve bucket izolasyonunu kanıtlar.
- `smoke:provider-boundary`: provider boundary flaglerinin business truth mutation üretmediğini kanıtlar.
- `smoke:provider-callback-foundation`: callback foundation repository/contract temel davranışını kanıtlar.

Bu closure için build/typecheck/smoke çalıştırılmadı. Bu rapor kodlama paketi değildir; önceki closure raporlarındaki PASS kanıtları referans alınmıştır.

## 6. Kalan Limitler

- Real provider secret/env yok.
- Provider-specific canonicalization yok.
- Provider-specific mapping yok.
- Nonce reuse cache yok.
- Distributed/Redis/API gateway/WAF rate limit yok.
- Audit/risk anomaly linkage yok.
- Worker/queue yok.
- Reconciliation yok.
- Domain processing yok.
- Provider-specific replay window yok.
- Rate limited attempt ayrı audit/risk event'e bağlı değil.

Bu limitler production-grade webhook güvenliğinin tamamlandığı anlamına gelmez. Foundation boundary kapanmıştır; production olgunluğu sonraki paketlerde ele alınmalıdır.

## 7. Domain Processing Readiness Gate

| Gate maddesi | Durum | Not |
|---|---|---|
| Ortak ingestion endpoint tamamlandı mı? | Evet | 10B2A-E hattında mevcut |
| Persistence duplicate/idempotency davranışı kanıtlandı mı? | Evet | 10B1 ve 10B2 smoke kanıtları var |
| Signature guard foundation tamamlandı mı? | Evet | Test provider HMAC foundation var |
| Replay/idempotency guard tamamlandı mı? | Evet | Lookup + duplicate response + conflict davranışı var |
| Timestamp freshness guard tamamlandı mı? | Evet | Timestamp freshness foundation var |
| Rate/abuse guard foundation tamamlandı mı? | Evet | Process-local limiter var |
| Boundary smoke PASS mı? | Evet | Önceki closure raporlarında PASS raporlandı |
| Domain mutation hâlâ yok mu? | Evet | Handler owner command çağırmıyor |
| Provider-specific mapping inventory yapılmalı mı? | Evet | Domain processing öncesi zorunlu |
| Gerçek provider secret/config tasarımı yapılmalı mı? | Evet | Secret/env/config ayrımı netleşmeli |

Net karar: Domain processing'e doğrudan geçilmemelidir. Önce provider-specific mapping inventory gerekir.

Gerekçe: Ortak security boundary tamamlandı; ancak gerçek domain effect üretecek callback processing için provider event type mapping, payload canonicalization, domain owner handoff, idempotency key kaynağı, replay window, config/secret modeli ve acceptance kanıtı provider bazında netleşmemiştir.

## 8. Sonraki Paket Kararı

### A) Doğrudan Payment Callback Processing

- Artı: En hızlı business value adayıdır; payment outcome domain state'e bağlanabilir.
- Risk: Provider-specific mapping/canonicalization netleşmeden payment owner yanlış veya eksik command alabilir.
- Neden şimdi / neden sonra: Şimdi değil. Security boundary hazır olsa da mapping inventory eksik.
- Kabul kanıtı: Doğrulanmış provider callback'in payment owner transition adayına doğru şekilde map edildiği ve duplicate callback'in duplicate order/payment etkisi üretmediği kanıtlanmalı.

### B) Provider-Specific Mapping Inventory / Payment First Candidate

- Artı: Domain processing başlamadan önce event type, payload, signature canonicalization, idempotency source ve owner command handoff kararlarını netleştirir.
- Risk: Kod üretmeden analiz paketi olduğu için kısa vadede runtime business value üretmez.
- Neden şimdi / neden sonra: Şimdi. Ortak boundary kapandıktan sonraki doğru gate budur.
- Kabul kanıtı: İlk payment provider adayı için mapping matrix, canonical payload strategy, callback type -> domain candidate mapping ve owner handoff kararları yazılı ve testlenebilir hale gelir.

### C) Worker/Queue Foundation

- Artı: BFF'in ingestion-only kalmasını ve domain processing'in async yürütülmesini sağlar.
- Risk: Mapping net değilken queue payload contract'ı yanlış şekillenebilir.
- Neden şimdi / neden sonra: Sonra. Önce hangi normalized callback payload'ının kuyruğa gireceği netleşmeli.
- Kabul kanıtı: Ingested callback record'un idempotent worker tarafından alınması, state guard öncesi doğrulanması ve retry-safe işlenmesi.

### D) Real Provider Secret/Config Foundation

- Artı: Production signature verification için gerçek secret/config modelini kurar.
- Risk: Provider inventory olmadan gereksiz soyut veya yanlış config modeli üretilebilir.
- Neden şimdi / neden sonra: Mapping inventory ile paralel tasarlanabilir, ancak ayrı implementation paketi olarak sonra yapılmalı.
- Kabul kanıtı: Secret manager/env/config ayrımı, provider mode, rotation, audit ve test/sandbox config davranışının kanıtlanması.

Net öneri:

**HARDENING-10C0 - Provider-Specific Callback Mapping Inventory / Payment First Candidate**

Gerekçe: Ortak security boundary tamamlandı ancak domain processing'e geçmeden önce provider-specific event mapping, canonicalization ve domain owner handoff kararları netleşmelidir.

## 9. 10C0 İçin Hazırlık Dosya Seti

10C0 için okunması gereken dosya seti:

- Payment sistem dosyaları:
  - `services/payment/src/payment.ts`
  - `services/payment/src/provider-adapter.ts`
  - `services/payment/src/repository/interface.ts`
  - `services/payment/src/repository/postgres.ts`
  - `services/payment/src/repository/in-memory.ts`
  - `apps/bff/src/server/payment.ts`
- Provider callback handler:
  - `apps/bff/src/server/provider-callback.ts`
  - `apps/bff/src/server/index.ts`
  - `packages/persistence/src/provider-callback.ts`
  - `infra/migrations/20260504_001_provider_callback_persistence.sql`
- Provider contract:
  - `packages/contracts/src/provider.ts`
- Payment/order/finance/risk contract ve service dosyaları:
  - `packages/contracts/src/payment.ts`
  - `packages/contracts/src/order.ts`
  - `packages/contracts/src/order-ops.ts`
  - `packages/contracts/src/finance-correction.ts`
  - `packages/contracts/src/risk.ts`
  - `services/order/src/order.ts`
  - `services/order/src/repository/interface.ts`
  - `services/order/src/repository/postgres.ts`
  - `services/order-ops/src/order-ops.ts`
  - `services/finance-correction/src/finance-correction.ts`
  - `services/risk/src/risk.ts`
  - `apps/bff/src/server/order.ts`
  - `apps/bff/src/server/order-ops.ts`
  - `apps/bff/src/server/finance-correction.ts`
  - `apps/bff/src/server/risk.ts`
- Provider inventory / third party matrix:
  - `planlama/aşama-6/THIRD_PARTY_PROVIDER_MATRIX.md`
  - `planlama/aşama-6/INTEGRATION_BEHAVIOR_RULES.md`
  - `HARDENING-10B-00F-CROSS-DOMAIN-RISK-IMPLEMENTATION-ORDER-FINAL-INVENTORY.md`
- Idempotency/transition/owner/guard referansları:
  - `planlama/aşama-3/IDEMPOTENCY_POLICIES.md`
  - `planlama/aşama-3/TRANSITION_POLICIES.md`
  - `planlama/aşama-2/OWNER_MATRIX.md`
  - `planlama/aşama-2/GUARD_MATRIX.md`
  - `planlama/VERI_AKISI_SENKRONIZASYON_MODELI.md`
  - `planlama/KONFIGURASYON_YONETIMI.md`
  - `planlama/aşama-11/EVENT_TAXONOMY.md`
  - `planlama/aşama-11/AUDIT_TAXONOMY.md`
- 10B2A-E closure raporları:
  - `HARDENING-10B2A-COMMON-PROVIDER-CALLBACK-BFF-INGESTION-BOUNDARY-CLOSURE-REPORT.md`
  - `HARDENING-10B2B-PROVIDER-CALLBACK-SIGNATURE-GUARD-FOUNDATION-CLOSURE-REPORT.md`
  - `HARDENING-10B2C-PROVIDER-CALLBACK-REPLAY-IDEMPOTENCY-GUARD-CLOSURE-REPORT.md`
  - `HARDENING-10B2D-PROVIDER-CALLBACK-TIMESTAMP-NONCE-FRESHNESS-GUARD-CLOSURE-REPORT.md`
  - `HARDENING-10B2E-PROVIDER-CALLBACK-PUBLIC-WEBHOOK-RATE-LIMIT-ABUSE-GUARD-CLOSURE-REPORT.md`
- 10B-00B payment callback inventory:
  - `HARDENING-10B-00B-PAYMENT-CALLBACK-DOMAIN-INVENTORY.md`

## 10. Nihai Karar

**COMMON CALLBACK SECURITY BOUNDARY CLOSED / PROVIDER-SPECIFIC MAPPING INVENTORY REQUIRED**

- 10B2 hattı foundation olarak kapanmıştır.
- Production-grade limitler devam etmektedir.
- Domain processing hâlâ başlamamıştır.
- Sıradaki önerilen görev: **HARDENING-10C0 - Provider-Specific Callback Mapping Inventory / Payment First Candidate**

