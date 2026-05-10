# PHASE-07-FIX-03 — Projection Consumer Foundation Report

## 1. Görev Bilgisi
- Görev adı: PHASE-07-FIX-03 — Projection Consumer Foundation
- Görev tipi: Controlled Foundation Implementation
- Kod değişikliği yapıldı mı?: Evet
- Nihai karar: PASS WITH LIMITATION

## 2. Amaç
Bu paketin hedefi GAP-SYNC-01 — Projection Consumer Yokluğu açığını kapatmaktır. Pricing, stock ve media değişikliklerini catalog/search/index projection katmanına taşıyabilecek minimum, test edilebilir, owner boundary uyumlu projection consumer foundation kurmayı amaçlamaktadır.

## 3. Kullanılan Referans Dosyaları
- PHASE-07-FIX-02-PROJECTION-SYNC-OUTBOX-CONSUMER-GAP-REVIEW-REPORT.md
- PHASE-07-FIX-00-SEARCH-CATALOG-SMOKE-RUNTIME-RECOVERY-REPORT.md
- PHASE-07-FIX-01-CATEGORY-TAXONOMY-PLP-SMOKE-COVERAGE-REPORT.md
- 00-PRODUCTION_READINESS_WORKING_RULES.md
- 01-SYSTEM_TO_IMPLEMENTATION_MAPPING.md
- 02-CURRENT_STATE_BASELINE.md
- 03-PRODUCTION_READINESS_PHASE_MASTER_PLAN.md
- 04-PRODUCTION_READINESS_RISK_REGISTER.md
- 1-havuz sistemi.md
- 4-pdp sistemi.md
- 8-klasik ürün kart sistemi.md
- 27-merkezi stok sistemi.md
- 29-merkezi fiyat sistemi.md
- 50-medya asset sistemi.md
- 51-arama indeksleme sistemi.md

## 4. Değişen Dosyalar
- `packages/contracts/src/projection.ts` (Yeni eklendi)
- `packages/contracts/src/index.ts`
- `services/catalog/src/projection-handler.ts` (Yeni eklendi)
- `services/catalog/src/index.ts`
- `tests/smoke/suites/projection-consumer-foundation.ts` (Yeni eklendi)
- `tests/smoke/run-smoke.ts`
- `package.json`

## 5. Kapsam Dışı Bırakılanlar
- Production Kafka / RabbitMQ broker altyapısı kurulması
- OpenSearch production ops (bootstrap, index lifecycle)
- DB migration işlemleri
- Persistent distributed worker
- Retry scheduler / DLQ
- Advanced ranking engine
- Recommendation engine
- Stale leak smoke testleri (PHASE-07-FIX-04'e bırakıldı)
- UI ve panel ekranı tasarımları

## 6. Projection Update Contract
`@hx/contracts` altında `projection.ts` adında yeni bir contract eklenmiş olup, şu modeller ve typelar tanımlanmıştır:
- `ProjectionUpdateSourceOwner`: `pricing` | `stock` | `media`
- `ProjectionUpdateType`: `PRICE_CHANGED` | `STOCK_CHANGED` | `MEDIA_APPROVED` | `MEDIA_REJECTED`
- `BaseProjectionUpdateCandidate` (Boundary Flag'leri ile birlikte)
- `PriceProjectionUpdateCandidate`
- `StockProjectionUpdateCandidate`
- `MediaProjectionUpdateCandidate`
- `ProjectionUpdateEvidence` (Apply işleminin boundary durumlarını dönen response)

Her bir modelde; `productId`, `sourceOwner`, `updateType`, `occurredAt`, `correlationId`, `idempotencyKey` zorunlu tutulmuş, `ownerTruthMutated: false` ve `projectionUpdated: true` boundary flag'leri contract içerisine entegre edilmiştir.

## 7. Pricing Projection Foundation
- **Yapılan iş**: Active sale price snapshot'ı projection'a apply eden foundation seviyesinde implementation yapıldı.
- **Kanıt dosya/fonksiyon**: `services/catalog/src/projection-handler.ts` içindeki `applyProjectionUpdate` fonksiyonu.
- **Boundary sonucu**: `priceTruthMutated: false` boundary kuralı başarılıyla işlendi ve smoke testiyle (`projectionConsumerFoundationSmoke`) doğrulandı.
- **Kalan limitation**: Production'da event-driven distributed update süreci kurmak (Şimdilik memory/foundation tabanlı).

## 8. Stock Projection Foundation
- **Yapılan iş**: In-stock, out-of-stock availability state'ini catalog projection üzerine aktaran update mantığı kuruldu. `UNAVAILABLE` durumu `OUT_OF_STOCK`'a safe mapping yapılarak aktarıldı.
- **Kanıt dosya/fonksiyon**: `services/catalog/src/projection-handler.ts` -> `applyProjectionUpdate`.
- **Boundary sonucu**: `stockTruthMutated: false` condition'ı ve idempotency davranışı testlerle ispatlandı.
- **Kalan limitation**: Stok state'inin çoklu lokasyon ve variant kırılımında hesaplanması için distributed worker readiness.

## 9. Media Projection Foundation
- **Yapılan iş**: `MEDIA_APPROVED` update'inde ilgili media asset public projection'a alındı, `MEDIA_REJECTED` durumunda ise mevcut listeden public scope dışına atıldı (remove edildi).
- **Kanıt dosya/fonksiyon**: `services/catalog/src/projection-handler.ts` -> `applyProjectionUpdate`.
- **Boundary sonucu**: `mediaTruthMutated: false`. Sadece projection'da görüntülenen metadata etkilendi.
- **Kalan limitation**: Media processing gecikmesi ile projection senkronizasyon async worker'ının eksikliği.

## 10. Projection Consumer / Apply Handler
- **Handler/fonksiyon adı**: `applyProjectionUpdate(candidate: ProjectionUpdateCandidate): ProjectionUpdateEvidence`
- **Ne yapar**: Gelen in-memory catalog/search projection candidate'ini işler, duplicate idempotency key kontrolü yapar, sourceOwner ve updateType ayrımı ile ilgili snapshot'ları public projection'a (memory store) güvenli şekilde aktarır.
- **Ne yapmaz**: Truth mutation yapmaz (pricing, stock, media truth'larına dokunmaz). Business rules çalıştırmaz, sadece read-projection update gerçekleştirir.
- **Idempotency davranışı**: InMemory Set tabanlı `processedIdempotencyKeys` kullanarak mükerrer correlationId ve keyleri bloke eder.
- **Boundary flags**: Evidence olarak `ownerTruthMutated: false`, `projectionUpdated: true` strict olarak assert edilir.

## 11. Search Index Projection Integration
Handler içerisinde, applyProjectionUpdate başarılı sonuçlandığında in-memory search index integration boundary'si olarak varsayılan bir `searchIndexUpdatedEvidence` track/comment'i eklendi. Test içerisinde "Search index will pick this up" mantığı memory sınırlarında kanıtlanmıştır.

## 12. BFF / UI / Panel Boundary Review
BFF / UI veya Panel arayüzlerinde hiçbir state mutasyon değişikliği yapılmamıştır. Truth üretme ve BFF üzerinden projection tetikleme gibi boundary violationlara izin verilmemiştir. Sadece test koşabilmek için handler memory tabanlı çağrılmıştır.

## 13. Smoke / Test Sonuçları
| Komut | Durum |
|---|---|
| `pnpm run typecheck` | PASS |
| `pnpm run build` | PASS |
| `pnpm run smoke:projection-consumer-foundation` | PASS |
| `pnpm run smoke:search-index-projection` | PASS |
| `pnpm run smoke:catalog-read` | PASS |
| `pnpm run smoke:search` | PASS |

## 14. Kapanan Maddeler
- GAP-SYNC-01 foundation seviyesinde başarıyla kapatıldı. (Not: Bu kapanış production-grade consumer / broker / distributed worker kapanışı değildir.)
- Price projection update foundation in-memory tamamlandı.
- Stock projection update foundation in-memory tamamlandı.
- Media projection update foundation in-memory tamamlandı.
- Boundary non-mutation evidence eklendi.

## 15. Açık Kalan Maddeler
- Dynamic stale leak public smoke coverage
- Production broker / distributed worker
- Durable projection persistence
- OpenSearch production lifecycle
- External index runtime integration
- Advanced ranking / recommendation
- Production retry / DLQ / backoff strategy

## 16. Ertelenen Maddeler
- Stale Price / Stock / Media Leak Smoke Coverage → PHASE-07-FIX-04
- Ranking / Recommendation Smoke Readiness → PHASE-07-FIX-05
- OpenSearch Production Ops → PHASE-12 / Infra Release Gate
- Production Broker / Distributed Worker → PHASE-12 veya eventing/infra readiness phase
- Durable Projection Persistence → PHASE-12 veya persistence/projection durability package

## 17. Risk / Release Blocker Etkisi
GAP-SYNC-01 foundation seviyesinde kapatılmıştır; ancak production-readiness için durable consumer, production broker, persistent projection, external index lifecycle ve dynamic stale leak smoke coverage açık limitation olarak devam etmektedir.

## 18. Nihai Karar
PHASE-07-FIX-03 nihai kararı PASS WITH LIMITATION’dır.
Gerekçe: Contract, handler, in-memory projection update foundation ve targeted smoke kanıtları bu paketin foundation hedefini karşılamaktadır. Ancak production broker, durable worker, persistent projection, OpenSearch lifecycle ve dynamic stale leak public smoke coverage kapsam dışı bırakılmıştır. Bu nedenle paket PASS değil, PASS WITH LIMITATION kapanır.

## 19. Sonraki Önerilen Paket
- PHASE-07-FIX-04 — Stale Price / Stock / Media Leak Smoke Coverage
- PHASE-07-FIX-05 — Ranking / Recommendation Smoke Readiness

## 20. Baş Mimar İncelemesi İçin Not
Görev tamamlanmış olup rapor oluşturulmuştur. Lütfen In-memory Projection Handler ile Contract Foundation uyumluluğunu gözden geçirin. Bu revize rapor baş mimar ile birlikte incelenmeden PHASE-07-FIX-04 promptuna geçilmemelidir.
