# HARDENING-07 — Catalog / PDP / PLP / Search Final Closure Report

## 1. Kısa Özet

HARDENING-07 hattının amacı Catalog / PDP / PLP / Search / Search Index Projection alanlarında public read, candidate ve projection davranışlarını owner boundary ihlali oluşturmadan güçlendirmekti.

Bu dosya implementation değildir. Kod, feature, refactor, migration, endpoint veya smoke fixture değişikliği içermez. Önceki inventory, implementation, smoke/regression ve limitation kayıtlarını birleştiren final closure kaydıdır.

Nihai karar:
- HARDENING-07: PASS WITH LIMITATION

Gerekçe:
- 07-00A inventory tamamlandı.
- 07-00B inventory tamamlandı.
- 07A1 PASS WITH LIMITATION.
- 07A2 PASS WITH LIMITATION.
- 07B PASS WITH LIMITATION.
- 07C PASS WITH LIMITATION.
- 07D PASS WITH LIMITATION.
- `pnpm run typecheck`: PASS.
- `pnpm run build`: PASS.
- BFF boot: PASS.
- `smoke:catalog-read`: PASS.
- `smoke:catalog`: PASS.
- `smoke:search`: PASS.
- `smoke:search-index-projection`: PASS.
- `smoke:all`: PASS.
- catalog/search smoke SKIPPED değil.
- Boundary ihlali yok.

07 hattında kapatılan ana riskler: PDP BFF mock truth davranışı, PLP static product card runtime source riski, catalog/search skipped smoke boşluğu, search candidate boundary eksik smoke kanıtı, search index projection source belirsizliği ve hidden/unavailable/suspended/archived leak riski.

Kalan limitation'lar production-readiness veya ayrı owner paket borcudur: event/outbox production consumer, OpenSearch production ops, ranking/recommendation, dynamic facets, category/storefront indexed expansion, pricing/stock/media real-time projection sync, catalog/product write owner, category taxonomy owner, search distributed consistency/retry/worker reliability, stale dist artifact hygiene ve PLP activePriceLabel owner delegation placeholder davranışı.

## 2. Final Paket Durum Tablosu

| Paket | Amaç | Karar | Kanıt | Kalan Not |
|---|---|---|---|---|
| 07-00A — Catalog / PDP / PLP Read Inventory | Catalog/PDP/PLP read path, BFF mock/static ve smoke coverage gerçekliğini çıkarmak. | DONE | `HARDENING-07-00A-CATALOG-PDP-PLP-READ-INVENTORY.md` inventory tamamlandı; PASS/FAIL sistem kapanışı verilmedi. | Implementation değil; bulgular 07A1/07A2 hattına taşındı. |
| 07-00B — Search / Index Sync Inventory | Search/index sync, BFF search smoke, OpenSearch ve event/outbox gerçekliğini çıkarmak. | DONE | `HARDENING-07-00B-SEARCH-INDEX-SYNC-INVENTORY.md` inventory tamamlandı; PASS/FAIL sistem kapanışı verilmedi. | Implementation değil; bulgular 07B/07C hattına taşındı. |
| 07A1 — Catalog Read Projection Foundation | `@hx/catalog` read projection foundation kurmak. | PASS WITH LIMITATION | `smoke:catalog-read` PASS; root typecheck/build PASS. | PDP full refactor, PLP static cleanup, search/index sync ve catalog/product write owner sonraki paketlere kaldı. |
| 07A2 — PDP / PLP Read Hardening & Smoke | PDP/PLP read path'i BFF mock/static truth davranışından çıkarmak ve catalog smoke'u gerçek yapmak. | PASS WITH LIMITATION | `smoke:catalog-read` PASS; `smoke:catalog` PASS ve SKIPPED değil; typecheck/build/BFF boot PASS. | Search/index, dynamic facets, ranking/recommendation, pricing/stock/media production delegation ve taxonomy owner borçları kaldı. |
| 07B — Search BFF Smoke + Candidate Boundary Hardening | `/search` BFF smoke'u gerçek assertion'a almak ve candidate boundary'lerini doğrulamak. | PASS WITH LIMITATION | `smoke:search` PASS ve SKIPPED değil; `smoke:all` PASS; typecheck/build/BFF boot PASS. | Event/outbox index sync, OpenSearch production ops, dynamic facets, ranking ve projection sync borçları kaldı. |
| 07C — Search Index Sync Projection Foundation | Search index document source'u catalog read projection'a bağlamak ve projection helper standardı kurmak. | PASS WITH LIMITATION | `smoke:search-index-projection` PASS; `smoke:search`/`smoke:catalog`/`smoke:all` PASS; typecheck/build PASS. | Full consumer, OpenSearch production ops, category/storefront expansion ve worker reliability kaldı. |
| 07D — Search / Catalog Regression & Final Closure Preparation | 07A1-07C sonrası birleşik regression ve final prep doğrulaması yapmak. | PASS WITH LIMITATION | typecheck/build/BFF boot/targeted 07 smoke'ları/`smoke:all` PASS; catalog/search SKIPPED değil. | Kalanlar production-readiness veya ayrı owner paket borcu. |

## 3. HARDENING-07'de Kapanan Ana Konular

### 3.1 Catalog Read Projection
- `@hx/catalog` read projection service eklendi.
- `getCatalogProduct`, `listCatalogProducts`, `getCatalogProductProjection`, `listPublicCatalogProductCards` hattı kuruldu.
- Product / variant / status / visibility mapping foundation eklendi.
- Projection boundary flag'leri korundu:
  - `catalogReadTruth:false`
  - `productTruthMutated:false`
  - `priceTruth:false`
  - `stockTruth:false`
  - `mediaTruth:false`
  - `searchIndexTruth:false`

### 3.2 PDP Read Hardening
- PDP public read `@hx/catalog` projection üzerinden çalışıyor.
- BFF `MOCK_PRODUCTS` / `MOCK_STOREFRONTS` primary truth olmaktan çıkarıldı.
- Hidden product 404.
- Unavailable product 410.
- Price/stock/media truth PDP içine taşınmadı.
- BFF truth owner olmadı.

### 3.3 PLP / Product Card Hardening
- PLP product card source `@hx/catalog.listPublicCatalogProductCards` üzerinden çalışıyor.
- Static product card runtime path truth olmaktan çıktı.
- Hidden/unavailable/suspended/archived product card leak etmiyor.
- `cardTruth:false` ve owner boundary flag'leri korunuyor.
- Category taxonomy foundation/static kalıyor; `taxonomyTruth:false`.

### 3.4 Search BFF Candidate Boundary
- `smoke:search` SKIPPED olmaktan çıkarıldı.
- BFF `/search` gerçek HTTP smoke ile doğrulandı.
- Query/mode/surface/limit normalization yapıldı.
- Invalid mode `GLOBAL` default + warning ile yönetiliyor.
- Candidate flags doğrulandı:
  - `searchTruth:false`
  - `productTruthMutated:false`
  - `rankingFinal:false`
- GLOBAL / CATALOG / DISCOVER / STOREFRONT mode davranışları doğrulandı.
- Search PDP/PLP truth üretmedi.
- Search ranking owner olmadı.

### 3.5 Search Index Projection
- Search index document source `@hx/catalog` read projection'a bağlandı.
- `buildProductSearchDocumentFromCatalogProjection` eklendi.
- `indexCatalogProductProjection`, batch index, deactivate ve delete helper'ları eklendi.
- Memory backend deterministic projection indexing destekliyor.
- OpenSearch mapping foundation projection metadata ile hizalandı.
- Active projection indexleniyor.
- Hidden/unavailable/suspended/archived projection candidate leak etmiyor.
- Index truth olmadı.

### 3.6 Regression
- 07D ile typecheck/build/BFF boot/targeted smoke/`smoke:all` doğrulandı.
- catalog/search smoke artık SKIPPED değil.
- `smoke:all` PASS.
- Boundary regression yok.

## 4. Komut ve Smoke Kanıtları

07D final komut sonuçları temel alınmıştır. Bu final closure için yeni komut çalıştırılmadı.

| Komut / Suite | Sonuç | Not |
|---|---|---|
| `pnpm run typecheck` | PASS | 07D raporunda root workspace typecheck geçti. |
| `pnpm run build` | PASS | 07D raporunda root workspace build geçti. |
| BFF boot | PASS WITH NOTE | 07D raporunda BFF port 3001'de Postgres env ile başladı. |
| `pnpm run smoke:health` | PASS | 07D raporunda `SMOKE_BFF_BASE_URL=http://localhost:3001`. |
| `pnpm run smoke:catalog-read` | PASS | Catalog read projection boundaries verified. |
| `pnpm run smoke:catalog` | PASS | Catalog PDP/PLP read boundaries verified; SKIPPED değil. |
| `pnpm run smoke:search` | PASS | Search BFF candidate boundaries verified; SKIPPED değil. |
| `pnpm run smoke:search-index-projection` | PASS | Search index projection helpers and candidate boundaries verified. |
| `pnpm run smoke:all` | PASS | Registry'deki tüm suite'ler PASS; SKIPPED yok. |

catalog/search smoke artık SKIPPED değildir. `smoke:all` PASS. 07 targeted smoke'ları PASS.

## 5. Boundary Review Final

| Boundary | Sonuç | Kanıt / Not |
|---|---|---|
| BFF truth owner oldu mu? | Hayır, boundary-safe. | BFF request normalization/delegation/response mapping rolünde kaldı. |
| Catalog read write owner oldu mu? | Hayır, boundary-safe. | Catalog read projection product write lifecycle mutate etmedi. |
| Search index truth oldu mu? | Hayır, boundary-safe. | Index projection `searchIndexTruth:false` ve `projectionTruth:false` taşır. |
| Search catalog/product truth owner oldu mu? | Hayır, boundary-safe. | Search candidate/index helper catalog/product truth mutate etmedi. |
| Search ranking owner oldu mu? | Hayır, boundary-safe. | `rankingFinal:false`, `scoreFoundationOnly`, `M8_RANKING_NOT_IN_SCOPE` korunuyor. |
| Price/stock/media truth catalog/search içine taşındı mı? | Hayır, boundary-safe. | Boundary flag'leri false; catalog/search pricing/stock/media truth üretmiyor. |
| Event/outbox business mutation yerine geçti mi? | Hayır, boundary-safe. | Production consumer yok; event/outbox mutation yerine kullanılmadı. |
| Hidden/unavailable/suspended/archived visibility korundu mu? | Evet, boundary-safe. | PDP 404/410, PLP/search/index leak exclusion PASS. |
| PDP/PLP/Search boundary karıştı mı? | Hayır, boundary-safe. | Search candidate üretir; PDP/PLP read truth'a dönüşmez ve PLP grid merge yapılmadı. |
| Ranking M8 owner sınırı korundu mu? | Evet, boundary-safe. | Ranking/recommendation 07 kapsamına çekilmedi; search `rankingFinal:false`. |

Kalanlar boundary ihlali değil; limitation olarak aşağıda kayıtlı production-readiness veya ayrı owner paket borçlarıdır.

## 6. Kalan Limitation'lar

| Limitation | Risk Seviyesi | Neden 07 Kapanışını Engellemiyor? | Önerilen Sonraki Paket |
|---|---|---|---|
| Event/outbox production consumer yok | Orta | Index sync manual/foundation helper seviyesinde kaldı; 07 boundary ve smoke hedefleri PASS. | Search index event/outbox consumer hardening |
| OpenSearch production ops yok | Orta | Memory/backend smoke deterministic PASS; OpenSearch ops production-readiness borcu. | OpenSearch production readiness |
| OpenSearch credential/bootstrap/distributed consistency production seviyesinde değil | Orta | 07D runtime regression PASS; production bootstrap ve distributed consistency 07 scope dışı. | OpenSearch production readiness |
| Ranking/recommendation yok | Orta | Ranking M8 owner ayrı; search `rankingFinal:false` ile kapanıyor. | Ranking / Recommendation foundation |
| Dynamic facets yok | Orta | PLP/search facet truth üretilmedi; static/foundation warning mevcut. | Dynamic facets hardening |
| Category/storefront indexed expansion yok | Orta | Product candidate/search foundation PASS; category/storefront indexed document expansion ayrı kapsam. | Search category/storefront expansion |
| Pricing/stock/media real-time projection sync yok | Orta | Truth owner search/catalog'a taşınmadı; boundary flags false. | Pricing/stock/media projection sync |
| Catalog/product write owner yok | Orta | 07 read projection hattı; write lifecycle kurulmadı ve kurulması istenmedi. | Catalog/product write owner hardening |
| Category taxonomy owner foundation seviyesinde | Orta | `taxonomyTruth:false`; PLP product card leak/regression yok. | Category taxonomy owner hardening |
| Search distributed consistency / retry / worker reliability yok | Orta | Manual/foundation helper ve smoke regression PASS; production worker reliability ayrı borç. | Search worker reliability hardening |
| Stale generated dist artifact hygiene düşük riskli borç olarak kaldı | Düşük | Runtime source kullanıyor ve smoke PASS; 07 behavior regression değil. | Dist cleanup / build output hygiene |
| PLP activePriceLabel pricing owner'a gerçek delegation yapmıyor; boundary placeholder kullanıyor | Orta | Price truth üretilmedi; placeholder açık boundary notu ile dönüyor. | Pricing/stock/media projection sync |
| Product/card/category projections foundation seviyesinde | Orta | Foundation projection davranışı smoke ile doğrulandı; full owner lifecycle 07 scope dışı. | Catalog/product/category owner hardening |

## 7. Legacy / Static / Mock Final Notu

| Kontrol | Sonuç | Risk | Sonraki Aksiyon |
|---|---|---|---|
| catalog smoke SKIPPED mi? | Hayır. `catalogSmoke` gerçek assertion çalıştırıyor ve PASS. | Düşük | Aksiyon yok. |
| search smoke SKIPPED mi? | Hayır. `searchSmoke` gerçek assertion çalıştırıyor ve PASS. | Düşük | Aksiyon yok. |
| BFF PDP `MOCK_PRODUCTS` geri geldi mi? | Hayır. 07D raporunda source runtime'da `MOCK_PRODUCTS` / `MOCK_STOREFRONTS` yok. | Düşük | Aksiyon yok. |
| PLP `STATIC_PRODUCTS` runtime path'te kullanılıyor mu? | Hayır. PLP runtime cards `listPublicCatalogProductCards` üzerinden geliyor. | Düşük hygiene borcu | Ayrı cleanup yapılabilir. |
| `rankingFinal` true oluyor mu? | Hayır. Smoke candidate/document seviyesinde false doğruladı. | Düşük | Aksiyon yok. |
| `searchIndexTruth` true oluyor mu? | Hayır. Smoke false doğruladı. | Düşük | Aksiyon yok. |
| stale dist artifact var mı? | Evet. 07D raporunda `apps/bff/dist/server/catalog.js` eski mock artifact içeriyor; runtime `tsx src/index.ts` ve canonical build output source ile hizalı. | Düşük / generated artifact hygiene | Dist cleanup / build output hygiene |

Runtime source davranışı smoke ile PASS. Stale dist artifact varsa build output hygiene borcudur; runtime regression değildir.

## 8. HARDENING-08 veya Sonraki Hat İçin Geçiş Kararı

HARDENING-07 sonrası önerilen ana paket seçenekleri:

1. HARDENING-08 — Analytics / Notification / Event Consistency
2. Search index event/outbox consumer hardening
3. OpenSearch production readiness
4. Ranking / Recommendation foundation
5. HARDENING-LEGACY-ACTOR-HEADER-CLEANUP
6. Dist cleanup / build output hygiene

Final öneri:
- Önce roadmap / active risks dosyaları güncellenmeli.
- Sonra sıradaki hardening hattı başlatılmalı.
- Eğer 08'e geçilecekse, 08-00 inventory/source review ile başlanmalı.

## 9. Aktif Risk ve Karar Dosyalarına İşlenecek Notlar

Bu görevde aşağıdaki dosyalar değiştirilmedi. Final closure içinde işlenmesi önerilen kayıtlar:

| Dosya | İşlenmesi Önerilen Kayıt |
|---|---|
| `planlama/63-IMPLEMENTATION_PROGRESS_MASTER.md` | HARDENING-07: PASS WITH LIMITATION olarak kaydedilmeli; 07-00A/07-00B DONE, 07A1/07A2/07B/07C/07D PASS WITH LIMITATION sonuçları eklenmeli; sıradaki yön olarak progress/risk güncellemesi ve 08-00 veya seçilecek sonraki inventory/source review yazılmalı. |
| `planlama/64-PACKAGE_EXECUTION_LOG.md` | HARDENING-07-FINAL-CLOSURE implementation olmayan final closure kaydı olarak eklenmeli; kanıt seti 07D typecheck/build/BFF boot/targeted smoke/`smoke:all` sonuçlarından referanslanmalı. |
| `planlama/65-ACTIVE_RISKS_AND_DECISIONS.md` | Search/catalog smoke skipped borcu kapandı olarak işlenmeli; event/outbox consumer, OpenSearch production ops, OpenSearch credential/bootstrap/distributed consistency, ranking, dynamic facets, category/storefront expansion, pricing/stock/media projection sync, catalog/product write owner, category taxonomy owner, search worker reliability ve stale dist artifact hygiene aktif risk/limitation olarak kalmalı. |
| `HARDENING_PROGRESS_RECORD.md` veya kullanılan progress record dosyası | Repo içinde kullanılan dosya `planlama/HARDENING_PROGRESS_RECORD (1).md` görünüyor; HARDENING-07 final karar PASS WITH LIMITATION olarak işlenmeli ve 07A1-07D sonuçları ile catalog/search smoke skipped borcunun kapandığı eklenmeli. |

Özellikle:
- HARDENING-07: PASS WITH LIMITATION olarak kaydedilmeli.
- 07A1 / 07A2 / 07B / 07C / 07D sonuçları eklenmeli.
- Search/catalog smoke skipped borcu kapandı olarak işlenmeli.
- Event/outbox consumer, OpenSearch production ops, ranking, dynamic facets, category/storefront expansion, pricing/stock/media projection sync ve catalog/product write owner borçları aktif risk olarak kalmalı.

## 10. Nihai Karar

Nihai karar:
- HARDENING-07: PASS WITH LIMITATION

Kararın gerekçesi:
- 07A1-07D paketleri tamamlandı.
- Inventory hattı tamamlandı.
- `pnpm run typecheck`: PASS.
- `pnpm run build`: PASS.
- BFF boot: PASS.
- `smoke:catalog-read`: PASS.
- `smoke:catalog`: PASS.
- `smoke:search`: PASS.
- `smoke:search-index-projection`: PASS.
- `smoke:all`: PASS.
- catalog/search smoke SKIPPED değil.
- Hidden/unavailable/suspended/archived leak yok.
- BFF truth owner olmadı.
- Catalog read write owner olmadı.
- Search index truth olmadı.
- Search ranking owner olmadı.
- Product/catalog truth mutate edilmedi.
- Kalan limitation'lar 07 kapsamını düşürmeyen production-readiness / sonraki owner paket borçlarıdır.

Sıradaki önerilen görev:
- Önce progress / execution / risk kayıtlarının güncellenmesi.
- Ardından HARDENING-08-00 veya seçilecek sonraki hardening hattı için inventory/source review.
