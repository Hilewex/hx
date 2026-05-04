# HARDENING-07C — Search Index Sync Projection Foundation Closure Report

## 1. Kısa Özet
- Paket amacı: Search index projection hattını catalog/product truth yerine geçirmeden, `@hx/catalog` read projection kaynaklı manuel/foundation index helper standardına çekmek.
- Yapılan implementation: Product search document metadata/boundary flag'leri eklendi; catalog read projection kaynaklı document builder ve indexability guard eklendi; memory/OpenSearch index helper davranışı hizalandı; `smoke:search-index-projection` eklendi.
- Yapılmayanlar: Full event/outbox consumer, OpenSearch production ops, ranking/recommendation, PLP grid merge, dynamic facets, autocomplete advanced, catalog/product write owner ve pricing/stock/media truth üretimi yapılmadı.
- Nihai karar: PASS WITH LIMITATION.

## 2. Referans Dosyalar
| Dosya | Durum | Not |
|---|---|---|
| `HARDENING-07B-SEARCH-BFF-SMOKE-CANDIDATE-BOUNDARY-CLOSURE-REPORT.md` | FOUND | Search BFF smoke ve candidate boundary regression korundu. |
| `HARDENING-07A2-PDP-PLP-READ-HARDENING-SMOKE-CLOSURE-REPORT.md` | FOUND | PDP/PLP read hardening boundary'leri regresyon olarak çalıştırıldı. |
| `HARDENING-07A1-CATALOG-READ-PROJECTION-FOUNDATION-CLOSURE-REPORT.md` | FOUND | `@hx/catalog` read projection source olarak kullanıldı. |
| `HARDENING-07-00B-SEARCH-INDEX-SYNC-INVENTORY.md` | FOUND | Product document source belirsizliği ve skipped index smoke riski ana girdi oldu. |
| `HARDENING-07-00A-CATALOG-PDP-PLP-READ-INVENTORY.md` | FOUND | PDP/PLP/search truth ayrımı korundu. |
| `HARDENING-06-FINAL-CLOSURE-REPORT.md` | FOUND | catalog/search smoke limitation geçmişi dikkate alındı. |
| `planlama/12- Arama Sistemi.md` | FOUND | Search M9 candidate/intent/index projection sınırı korundu. |
| `planlama/4-pdp sistemi.md` | FOUND | PDP karar alanı search index'e taşınmadı. |
| `planlama/10-kategori-plp sistemi.md` | FOUND | PLP grid merge ve ranking kapsam dışı bırakıldı. |
| `planlama/8-klasik ürün kart sistemi.md` | FOUND | Product card/PDP truth'a sarkmama kuralı korundu. |
| `planlama/25-kural -yetki sistemi.md` | FOUND | Owner dışı write yok, BFF read-only, projection truth değildir kuralları uygulandı. |
| `planlama/62-MASTER_IMPLEMENTATION_PLAN.md` | FOUND | Search M9 ve Ranking M8 owner ayrımı korundu. |
| `planlama/65-ACTIVE_RISKS_AND_DECISIONS.md` | FOUND | OpenSearch bootstrap, consumer ve category/storefront expansion borçları limitation olarak bırakıldı. |

## 3. Değişen Dosyalar
| Dosya | Değişiklik | Gerekçe |
|---|---|---|
| `packages/contracts/src/search.ts` | Product candidate'a `projectionTruth:false`, `searchIndexTruth:false`, price/stock/media boundary flag'leri eklendi. | Search candidate'ın index/product/ranking/price/stock/media truth olmadığını contract seviyesinde görünür yapmak. |
| `services/search/package.json`, `pnpm-lock.yaml` | `@hx/search -> @hx/catalog` workspace dependency eklendi. | Index projection helper'larının public catalog package boundary üzerinden okuması. |
| `services/search/src/document.ts` | `buildProductSearchDocumentFromCatalogProjection`, alias helper'lar ve `isCatalogProjectionIndexable` eklendi; document metadata/boundary flag'leri eklendi. | ProductSearchDocument source'unu catalog read projection'a hizalamak. |
| `services/search/src/search.ts` | Memory/OpenSearch index helper standardı eklendi; catalog projection index/deactivate/delete helper'ları eklendi; memory search index document store üzerinden aday üretir hale geldi. | Foundation sync helper'larını üretmek ve memory backend ile deterministic smoke sağlamak. |
| `services/search/src/opensearch.ts` | Product index mapping'e projection metadata/boundary fields eklendi. | OpenSearch foundation document shape'ini yeni projection contract ile hizalamak. |
| `tests/smoke/suites/search-index-projection.ts` | Yeni targeted smoke suite eklendi. | Active/hidden/unavailable/suspended/archived projection ve boundary flag doğrulaması. |
| `tests/smoke/run-smoke.ts` | `search-index-projection` suite registry'ye eklendi. | Targeted smoke ve `smoke:all` entegrasyonu. |
| `package.json` | `smoke:search-index-projection` script'i eklendi. | Hedefli smoke komutu. |
| `packages/contracts/dist/*`, `services/search/dist/*`, ilgili workspace dist çıktıları | Build çıktıları güncellendi. | Repo build output tutuyor; root build sonucu. |
| `tests/smoke/durability-context.json` | `smoke:all` runtime context'i güncellendi. | Smoke runner runtime artefact'i. |

## 4. Index Projection Source Sonucu
- Index document source: `services/search/src/document.ts` içindeki `buildProductSearchDocumentFromCatalogProjection` artık `CatalogProductReadProjection` alır.
- `@hx/catalog` projection bağlantısı: `indexCatalogProductProjection(productId)` ve batch helper'ı `getCatalogProductProjection(productId, { includeNonPublic:true })` üzerinden okur.
- Index source truth gibi davranıyor mu? Hayır. Document `sourceOwner:'CATALOG_READ_PROJECTION'`, `projectionTruth:false`, `searchIndexTruth:false`, `productTruthMutated:false`, `priceTruth:false`, `stockTruth:false`, `mediaTruth:false`, `rankingFinal:false` taşır.
- Legacy `productDetailToSearchDocument` korundu ama `FOUNDATION_SEED` sourceOwner ile sınırlı kaldı; yeni sync helper source'u catalog projection'dır.

## 5. Visibility / Status Indexability Sonucu
- ACTIVE / visible davranışı: `ACTIVE + visibility != HIDDEN + publicReadable:true` indexable kabul edilir ve document `visible:true` olur.
- HIDDEN davranışı: Indexlenmez; helper `DEACTIVATED` döndürür.
- UNAVAILABLE davranışı: Indexlenmez; helper `DEACTIVATED` döndürür ve search candidate leak etmez.
- SUSPENDED / ARCHIVED davranışı: Catalog projection foundation'da public excluded/HIDDEN statüsüne map edildiği için indexlenmez; helper `DEACTIVATED` döndürür.
- Candidate leak kontrolü: `p_hidden`, `p_unavailable`, `p_suspended`, `p_archived` service-level projection smoke ve BFF search regression içinde candidate olarak dönmedi.

## 6. Search Index Helper Sonucu
- Eklenen/güncellenen helper'lar: `indexCatalogProductProjection`, `indexCatalogProductProjections`, `deactivateCatalogProductProjection`, `deleteCatalogProductProjection`, `isCatalogProjectionIndexable`, `buildProductSearchDocumentFromCatalogProjection`.
- Index davranışı: Indexable catalog projection document'e çevrilir ve memory/OpenSearch backend'e projection olarak yazılır.
- Deactivate davranışı: Non-indexable projection için index document truth mutate etmeden `visible:false/status:UNAVAILABLE` memory update veya OpenSearch update çağrısı yapılır.
- Delete davranışı: Search projection document silinir; catalog/product truth mutate edilmez.
- OpenSearch ve memory backend sınırı: Memory backend smoke için deterministic projection store kullanır; OpenSearch foundation mapping hizalandı ama production ops hardening yapılmadı.
- Event/outbox production consumer: Kapsam dışı. Bu paket manual/foundation helper standardıdır.

## 7. Candidate Boundary Regression
- `searchTruth:false`: BFF `smoke:search` ve `smoke:search-index-projection` içinde doğrulandı.
- `productTruthMutated:false`: Product candidate, index result ve document seviyesinde doğrulandı.
- `rankingFinal:false`: Candidate/document/index result seviyesinde doğrulandı; Ranking M8 owner kapsamına girilmedi.
- Price/stock/media truth boundary: `priceTruth:false`, `stockTruth:false`, `mediaTruth:false` document, result ve candidate seviyesinde doğrulandı.
- PDP/PLP truth boundary: `smoke:catalog-read` ve `smoke:catalog` PASS; search index PDP/PLP read truth yerine geçmedi.

## 8. Smoke/Test Sonuçları
| Komut/Senaryo | Sonuç | Not |
|---|---|---|
| `pnpm install` | PASS | `@hx/search -> @hx/catalog` workspace dependency lock'a işlendi. |
| `pnpm --filter @hx/contracts run typecheck` | PASS | Search candidate contract güncellemesi geçti. |
| `pnpm --filter @hx/contracts run build` | PASS | Contracts dist stale durumu temizlendi. |
| `pnpm --filter @hx/search run typecheck` | PASS | Search helper/document değişiklikleri geçti. |
| `pnpm --filter @hx/bff run typecheck` | PASS | BFF search/catalog regression typecheck geçti. |
| `pnpm run typecheck` | PASS | Root typecheck geçti. |
| `pnpm run build` | PASS | Root build geçti. |
| BFF boot | PASS WITH NOTE | 3001'de eski node listener PID 836 sonlandırıldı; yeni BFF node PID 25944 ile 3001'de başladı. Parent node PID 14716. |
| `pnpm run smoke:health` | PASS | `SMOKE_BFF_BASE_URL=http://localhost:3001`. |
| `pnpm run smoke:catalog-read` | PASS | Catalog read projection boundary regression geçti. |
| `pnpm run smoke:catalog` | PASS | PDP/PLP read boundary regression geçti. |
| `pnpm run smoke:search` | PASS | Search BFF candidate boundary regression geçti. |
| `pnpm run smoke:search-index-projection` | PASS | Active projection indexed; hidden/unavailable/suspended/archived leak yok; boundary flags doğrulandı. |
| `pnpm run smoke:all` | PASS | Yeni search-index-projection dahil tüm registry suite'leri PASS. |
| Active catalog product projection | PASS | `p_valid` `CATALOG_READ_PROJECTION` sourceOwner ile indexlendi. |
| Hidden product projection | PASS | `p_hidden` indexlenmedi, deactivate edildi. |
| Unavailable product projection | PASS | `p_unavailable` indexlenmedi, candidate leak etmedi. |
| Suspended/archived projection | PASS | `p_suspended` / `p_archived` indexlenmedi, candidate leak etmedi. |

## 9. Kalan Limitation'lar
- Full event/outbox consumer 07D/production-readiness hattına kaldı.
- OpenSearch production ops, credential/bootstrap ve distributed index consistency yok.
- Ranking/recommendation yok; M8 owner dışarıda kaldı.
- Dynamic facets yok.
- Category/storefront indexed candidate expansion yok.
- Pricing/stock/media real-time projection sync yok.
- Catalog/product write owner yok; search helper catalog/product truth mutate etmez.
- Search index distributed consistency ve retry/worker reliability yok.

## 10. Boundary Review
- Search index truth oldu mu? Hayır.
- Search catalog/product truth owner oldu mu? Hayır.
- Search ranking owner oldu mu? Hayır.
- Pricing/stock/media truth search'e taşındı mı? Hayır.
- Event/outbox business mutation yerine geçti mi? Hayır; production consumer yazılmadı.
- BFF truth owner oldu mu? Hayır; BFF search route delegation/normalization rolünde kaldı.
- Hidden/unavailable/suspended/archived visibility korundu mu? Evet.

## 11. Nihai Karar
Karar:
- PASS WITH LIMITATION

Gerekçe:
- `pnpm run typecheck`: PASS.
- `pnpm run build`: PASS.
- `pnpm run smoke:search-index-projection`: PASS.
- `pnpm run smoke:search`: PASS.
- `pnpm run smoke:catalog`: PASS.
- Active catalog projection indexleniyor.
- Hidden/unavailable/suspended/archived candidate leak etmiyor.
- Index projection truth olmuyor.
- Search ranking owner olmuyor.
- Product/catalog truth mutate edilmiyor.
- Limitation: Event/outbox consumer, OpenSearch production ops, dynamic facets, category/storefront expansion ve pricing/stock/media real-time projection sync bilinçli olarak ileri pakete bırakıldı.

Sıradaki önerilen paket:
- HARDENING-07D — Search / Catalog Regression & Final Closure Preparation
