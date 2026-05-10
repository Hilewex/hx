# PHASE-07-SOURCE-REVIEW-ADDENDUM — Evidence & Smoke Verification Report

## 1. Amaç

Bu addendum, PHASE-07 source review raporunda eksik kalan smoke, hidden/unavailable leak, search/ranking boundary, projection sync ve OpenSearch kanıtlarını tamamlamak için hazırlanmıştır.

## 2. Önceki Source Review Durumu
Önceki karar:
- PASS WITH LIMITATION

Baş mimari değerlendirme:
- Kapanış için yeterli görülmedi
- PARTIAL kabul edildi

Red gerekçeleri:
- Smoke komutları çalıştırılmamıştı
- Hidden/unavailable leak search/index/PLP tarafında yeterince kanıtlanmamıştı
- Ranking skeleton için karar fazla olumlu verilmişti
- Projection sync davranışı contract seviyesinde kalmıştı

## 3. Komut Sonuçları

| Komut | Sonuç | Not |
| :--- | :--- | :--- |
| `pnpm run typecheck` | PASS | Bütün paketlerde tsc başarılı |
| `pnpm run build` | PASS | Bütün paketlerde build başarılı |
| `pnpm run smoke:catalog-read` | FAIL | Servis ayakta olmadığı için fetch failed alındı |
| `pnpm run smoke:search` | FAIL | Servis ayakta olmadığı için fetch failed alındı |
| `pnpm run smoke:search-index-projection` | FAIL | Servis ayakta olmadığı için fetch failed alındı |
| `pnpm run smoke:category` | NOT FOUND | Script mevcut değil |
| `pnpm run smoke:taxonomy` | NOT FOUND | Script mevcut değil |
| `pnpm run smoke:plp` | NOT FOUND | Script mevcut değil |
| `pnpm run smoke:ranking` | NOT FOUND | Script mevcut değil |
| `pnpm run smoke:recommendation` | NOT FOUND | Script mevcut değil |
| `pnpm run smoke:media` | FAIL | Health Check fail (fetch failed) |

## 4. Smoke/Test Envanteri Düzeltmesi

| Alan | Gerçek Dosya / Script | Durum | Çalıştırıldı mı? | Sonuç |
| :--- | :--- | :--- | :--- | :--- |
| Catalog read | `smoke:catalog-read` | FOUND | Evet | FAIL |
| Search | `smoke:search` | FOUND | Evet | FAIL |
| Search index projection | `smoke:search-index-projection` | FOUND | Evet | FAIL |
| Category / PLP | Yok | NOT FOUND | Hayır | NOT FOUND |
| Taxonomy | Yok | NOT FOUND | Hayır | NOT FOUND |
| Ranking | Yok | NOT FOUND | Hayır | NOT FOUND |
| Recommendation | Yok | NOT FOUND | Hayır | NOT FOUND |
| Media projection | `smoke:media` | FOUND | Evet | FAIL |

## 5. Hidden / Unavailable / Stale Leak Kanıtı

| Yüzey | Sonuç | Kanıt | Karar |
| :--- | :--- | :--- | :--- |
| Search result | PASS | `services/search/src/document.ts` ve `opensearch.ts` filtrelemeyi yapıyor (`visible: true` sorgusu var). `status: HIDDEN/UNAVAILABLE` kontrol ediliyor. | PASS |
| Search index projection | PASS | `isCatalogProjectionIndexable` gizli/özel ürünleri eliyor. `deactivateProduct` fonksiyonları OpenSearch'e sync ediliyor. | PASS |
| Catalog projection | PASS | `isPublicReadable` non-ACTIVE ve HIDDEN durumlarını engelliyor. | PASS |
| PDP projection | PASS | `status === 'UNAVAILABLE'` response olarak uygun döndürülüyor ve warnings barındırıyor. | PASS |
| PLP/category listing | PASS | `category.status === 'HIDDEN'` ve `ACTIVE` durum kontrolleri statik/dinamik katalog seviyesinde filtreleniyor. | PASS |
| Product card projection | PARTIAL | Fiyat ve stok fallback mekanizmalarına sahip ancak in-memory. `priceTruth: false` flag'i dönülüyor. | PARTIAL |

## 6. Search Candidate / Ranking Boundary

| Kontrol | Sonuç | Kanıt |
| :--- | :--- | :--- |
| Search sadece candidate üretir | PASS | `SearchCandidate` (örn: `rankingFinal: false, searchTruth: false`) döndürüyor. |
| Search final ranking yapmaz | PASS | OpenSearch'ten dönen `hit._score` sadece `scoreFoundationOnly` olarak adaylara geçiliyor. |
| Ranking owner final ordering sahibidir | FAIL | `services/ranking/src/index.ts` sadece `export const name = "ranking"` içeriyor, implementasyon boş. |
| Ranking skeleton/empty ise limitation yazıldı | PASS | İlgili testler boş skeleton ve `M8_RANKING_NOT_IN_SCOPE` warning ile desteklenmiş. |
| BFF ranking/search truth üretmez | PASS | BFF search ve catalog isteklerini delege ediyor, `priceTruth: false` değerlerini koruyor. |

## 7. Catalog / PDP / Product Card Projection

| Kontrol | Sonuç | Kanıt |
| :--- | :--- | :--- |
| Catalog projection commerce truth değildir | PASS | Contract tipleri ve implementasyon `catalogReadTruth: false` barındırıyor. |
| PDP hidden/unavailable leak yok | PASS | `isPublicReadable` kontrolü yapılıyor. |
| Product card projection var | PASS | `ClassicProductCardProjection` olarak mevcut. |
| Price/stock/media snapshot owner truth değil | PASS | `priceTruth: false`, `mediaTruth: false` değerleri taşınıyor. |
| Stale snapshot riski işaretleniyor | PARTIAL | Outbox dinleyicileri olmadan tam stale işaretleme garanti edilemiyor, memory statik veriler mevcut. |

## 8. Category / PLP / Taxonomy

| Kontrol | Sonuç | Kanıt |
| :--- | :--- | :--- |
| Taxonomy owner net | PASS | Category service taxonomyTruth sahibidir. |
| PLP hidden/unavailable leak yok | PASS | `STATIC_CATEGORIES` ve PLP filtreleri ile engelleniyor. |
| Facet/filter source net | PASS | `facetTruth: false` flag'leri ile dönülüyor. |
| Taxonomy/category BFF truth değil | PASS | BFF tarafında taxonomy için repo kullanılmıyor, delegasyon mevcut. |
| Ayrı PLP/taxonomy smoke var | FAIL | Ayrı scriptler yok (`NOT FOUND`). |

## 9. Pricing / Stock / Media Projection Sync

| Kontrol | Sonuç | Kanıt |
| :--- | :--- | :--- |
| Pricing snapshot sync var | PARTIAL | Outbox consumer eksikliği sebebiyle memory statik projection şeklinde duruyor. |
| Stock snapshot sync var | PARTIAL | Manuel foundation seedler kullanılıyor. |
| Media publishable snapshot sync var | PARTIAL | Foundation seed üzerinden çalışıyor. |
| Outbox/index consumer var | FAIL | Outbox üzerinden dinleyen net bir senkronizasyon consumer'ı görülmedi. |
| Stale leak guard var | PARTIAL | `priceTruth: false` gibi markerlar konulmuş fakat dinamik flag eksikliği var. |

## 10. OpenSearch / Index Ops

| Kontrol | Sonuç | Kanıt |
| :--- | :--- | :--- |
| OpenSearch adapter var | PASS | `services/search/src/opensearch.ts` adapter bulunuyor. |
| Production OpenSearch lifecycle var | PARTIAL | Indeks oluşturma ve kayıt fonksiyonları var ancak lifecycle oldukça baz (örneğin sadece HEAD ile kontrol). |
| Reindex/idempotency var | PARTIAL | `_update` ve `doc_as_upsert` kullanılmıyor, upsert davranışı in-memory ve temel bazda. |
| Delete/deactivate behavior var | PASS | `deleteProduct` ve `deactivateProduct` (`visible: false`) fonksiyonları var. |
| OpenSearch down behavior var | PASS | Fallback to degraded memory testleri/uyarıları mevcut (`SEARCH_DEGRADED_FALLBACK_USED`). |

## 11. BFF / UI / Panel Boundary

BFF direct repository access:
- Yok (Kod incelemesinde veri erişim katmanı bulunamadı, repo sınıfları izole)

BFF search/ranking/catalog truth üretiyor mu?
- Hayır (Delegasyon ile truth origin korunuyor)

UI/panel search/ranking/category truth üretiyor mu?
- Hayır (Sadece read/view amaçlı payload okuması yapılıyor)

Panel direct index/taxonomy write var mı?
- Hayır

## 12. PHASE-06 Limitation Etkisi

| Limitation | PHASE-07 etkisi | Karar |
| :--- | :--- | :--- |
| Advanced story feed/ranking/discovery engine yok | PHASE-07 ranking servisi de boş olduğundan etki büyüyor. | LIMITATION |
| Social counter durable projection yok | Arama sonuçlarında etkileşim az. | DEFER |
| Interaction/follow durable DB uniqueness yok | Listelemede takipçi gösterimini kısıtlar. | DEFER |
| Story durable projection sınırlı | Arama sonucu hikaye entegrasyonu zayıf. | DEFER |
| Media/store-story moderation owner handoff eksik | Catalog sync süreci zedelenebilir. | LIMITATION |

## 13. Doğrulanan Riskler / Gap Listesi

| Risk / Gap | Kanıt | Etki | Sonraki Paket |
| :--- | :--- | :--- | :--- |
| Smoke test eksikleri ve `fetch failed` hataları | `smoke:plp`, `smoke:category` bulunamadı. Servisler ayakta değil. | BLOCKED | Testlerin onarımı ve infrastructure entegrasyonu |
| Ranking Skeleton Boşluğu | `services/ranking/src/index.ts` içi boş. | LIMITATION | PHASE-08 Ranking implementasyonu |
| Projection Outbox Consumer Yokluğu | OpenSearch sync tamamen outbox yerine call bazlı veya memory çalışıyor. | LIMITATION | Async event-driven catalog sync |

## 14. Nihai Addendum Kararı

PHASE-07 Source Review Addendum Kararı:
- **PARTIAL**

**Karar kriteri (Neden PARTIAL?):**
- Boundary, hidden/unavailable ürün sızıntıları büyük oranda test ediliyor ve engelleniyor.
- `searchTruth`, `priceTruth`, `catalogReadTruth` gibi marker'lar mimari olarak doğru eklenmiş, UI/BFF delegasyonu tam yapılmış.
- Ancak temel kabul testleri (smoke) lokal servis gereksinimi veya script yokluğu (`PLP/category/taxonomy` smoke eksikliği) yüzünden `FAIL` ve `NOT FOUND` aldı.
- Projection sync event/outbox bazlı consumer testleri ile kanıtlanamadı. Ranking service sadece bir isim dışa aktarıyor.

## 15. Sonraki Adım

Öncelikli olarak:
- Local servislerin run edilip `smoke:search`, `smoke:catalog-read`, `smoke:media` testlerinin ayağa kaldırılması ve pass olduğunun onaylanması.
- Eksik olan `smoke:category`, `smoke:taxonomy`, `smoke:plp`, `smoke:ranking` scriptlerinin tamamlanması.
- Projection sync için Outbox Consumer implementasyonlarının yapılması/gösterilmesi.
- İleri seviye ranking işlemlerinin (skeleton'un doldurulması) bir sonraki faza taşınarak geliştirilmesi.
