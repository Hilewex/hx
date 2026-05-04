# HARDENING-07-00A — Catalog / PDP / PLP Read Inventory

## 1. Kısa Özet
- Bu paket inventory paketidir.
- Kod değişikliği yapılmadı; yalnızca bu rapor dosyası oluşturuldu.
- Sistem PASS/FAIL kararı verilmedi.
- Catalog/PDP/PLP read katmanı foundation seviyesinde parçalıdır: `catalog.ts` contract ve BFF PDP handler var, fakat gerçek `services/catalog` veya `services/product` yoktur.
- En kritik 5 bulgu:
  - PDP read endpoint gerçek route olarak vardır: `GET /catalog/pdp/:productId`; ancak BFF içindeki `MOCK_PRODUCTS` / `MOCK_STOREFRONTS` üzerinden çalışır.
  - PLP read endpoint gerçek route olarak vardır: `GET /plp`; ancak `@hx/category` içindeki static category/product projection kullanır.
  - Product/variant gerçek read owner servisi yoktur; product truth daha çok `services/pool` içindeki acceptance/commercial pool modellerinde in-memory domain truth olarak yaşar.
  - Price/stock/media PDP/PLP aggregation içinde gerçek owner servislerinden çözülmüyor; PDP BFF mock price/stock gömüyor, PLP static `priceLabel` ve media refs kullanıyor.
  - `smoke:catalog` ve `smoke:search` scriptleri var ama suites `SKIPPED` dönüyor; PDP/PLP/product-card özel smoke yok.

## 2. Referans Dosya Kontrolü
| Dosya | Durum | Not |
|---|---|---|
| `HARDENING-06-FINAL-CLOSURE-REPORT.md` | FOUND | 06 final sonucu catalog/search smoke skipped limitation'ı ile 07 yönünü işaret ediyor. |
| `HARDENING-05E-SR-CLOSURE-REPORT.md` | FOUND | Commerce permission ve cart/checkout/order guard gerçekliğini özetliyor. |
| `planlama/4-pdp sistemi.md` | FOUND | PDP store-context, product ortak veri, price/stock/media/review katmanlarını tanımlıyor. |
| `planlama/10-kategori-plp sistemi.md` | FOUND | PLP/category, filtre, sıralama ve klasik product card beklentisini tanımlıyor. |
| `planlama/12-Arama Sistemi.md` | NOT FOUND | Verilen path yok; gerçek dosya `planlama/12- Arama Sistemi.md`. |
| `planlama/12- Arama Sistemi.md` | FOUND | Search candidate/retrieval ve PLP/search ayrımını tanımlıyor. |
| `planlama/8-klasik ürün kart sistemi.md` | FOUND | Product card alanları ve PDP'ye sarkmama kuralı var. |
| `planlama/26-varyant sistemi.md` | FOUND | Variant stok/fiyat/SKU/medya ilişkisi ve owner sınırı tanımlı. |
| `planlama/50-medya sistemş asset  sitemi.md` | FOUND | Media asset truth ve yüzey kullanımı ayrımı tanımlı. |
| `planlama/62-MASTER_IMPLEMENTATION_PLAN.md` | FOUND | Paket 8 Catalog/PDP Read, Paket 19 Search, Paket 21 Category/PLP ayrımı var. |
| `planlama/63-IMPLEMENTATION_PROGRESS_MASTER.md` | FOUND | P01-P52 foundation geçmişi ve production-readiness borçları mevcut. |
| `planlama/64-PACKAGE_EXECUTION_LOG.md` | FOUND | P40 search/OpenSearch foundation ve catalog/search borçları kayıtlı. |
| `planlama/65-ACTIVE_RISKS_AND_DECISIONS.md` | FOUND | Search/indexing, category/storefront expansion, E2E coverage borçları izleniyor. |

## 3. İncelenen Repo Dosyaları
| Alan | Dosya/Yol | Durum | Not |
|---|---|---|---|
| Contracts | `packages/contracts/src/catalog.ts` | FOUND | Product/PDP contract burada. |
| Contracts | `packages/contracts/src/product.ts` | NOT FOUND | Ayrı product contract yok. |
| Contracts | `packages/contracts/src/pdp.ts` | NOT FOUND | PDP contract `catalog.ts` içinde. |
| Contracts | `packages/contracts/src/plp.ts` | FOUND | PLP, product card, video rail contract var. |
| Contracts | `packages/contracts/src/search.ts` | FOUND | Search candidate contract var; ranking final değil. |
| Contracts | `packages/contracts/src/category.ts` | FOUND | Category/facet/sort contract var. |
| Contracts | `packages/contracts/src/media.ts` | FOUND | Media asset truth contract var. |
| Contracts | `packages/contracts/src/pricing.ts` | FOUND | Simulated price owner contract var. |
| Contracts | `packages/contracts/src/stock.ts` | FOUND | Simulated stock owner contract var. |
| Contracts | `packages/contracts/src/index.ts` | FOUND | catalog/search/category/plp/media/pricing/stock export ediliyor. |
| Services | `services/catalog/src/*` | NOT FOUND | Catalog read owner service yok. |
| Services | `services/product/src/*` | NOT FOUND | Product read owner service yok. |
| Services | `services/category/src/category.ts` | FOUND | PLP/category static projection üretir. |
| Services | `services/search/src/*` | FOUND | Memory/OpenSearch product candidate retrieval var. |
| Services | `services/ranking/src/index.ts` | FOUND | Sadece placeholder `name = "ranking"`. |
| Services | `services/pricing/src/pricing.ts` | FOUND | Deterministic `FOUNDATION_SIMULATED` price resolver. |
| Services | `services/stock/src/stock.ts` | FOUND | Deterministic `FOUNDATION_SIMULATED` stock resolver. |
| Services | `services/media/src/*` | FOUND | Media asset lifecycle service var. |
| Services | `services/pool/src/pool.ts` | FOUND | Product acceptance/commercial pool truth in-memory. |
| BFF | `apps/bff/src/server/catalog.ts` | FOUND | PDP read handler mock data ile çalışıyor. |
| BFF | `apps/bff/src/server/pdp.ts` | NOT FOUND | Ayrı PDP route dosyası yok. |
| BFF | `apps/bff/src/server/plp.ts` | FOUND | `@hx/category.getPlp` delegasyonu. |
| BFF | `apps/bff/src/server/search.ts` | FOUND | `@hx/search.searchCandidates` delegasyonu. |
| BFF | `apps/bff/src/server/media.ts` | FOUND | Media service delegation. |
| BFF | `apps/bff/src/server/index.ts` | FOUND | `/catalog/pdp/:productId`, `/category/*`, `/plp`, `/search`, `/media/*` route wiring var. |
| Web | `apps/web/src/bootstrap/pdp.ts` | FOUND | UI simulation/static shell; truth üretmiyor. |
| Web | `apps/web/src/bootstrap/plp.ts` | FOUND | BFF çağrısı simülasyonu. |
| Web | `apps/web/src/bootstrap/category.ts` | FOUND | BFF category çağrısı simülasyonu. |
| Web | `apps/web/src/bootstrap/search.ts` | FOUND | BFF search çağrısı simülasyonu. |
| Panel | `apps/panel/src/*` | PARTIAL | Catalog/PDP/PLP panel yok; pool bootstrap product lifecycle ile ilişkili. |
| Smoke | `tests/smoke/suites/others.ts` | FOUND | `catalogSmoke` ve `searchSmoke` SKIPPED. |
| Smoke | `tests/smoke/run-smoke.ts` | FOUND | catalog/search suite registry var. |
| Root | `package.json` | FOUND | `smoke:catalog`, `smoke:search`, `smoke:all` scriptleri var. |

## 4. Catalog Contract Inventory
| Bileşen | Dosya | Gerçek Durum | Kanıt | Risk |
|---|---|---|---|---|
| Product | `catalog.ts` | Contract var; ayrı product owner contract yok. | `ProductSummary`, `ProductDetail`, `ProductStatus`. | Product truth contract ile read projection karışabilir. |
| Variant | `catalog.ts`, `pool.ts` | PDP contract variant fiyat/stok truth taşımaz; pool variant stock/price/SKU taşır. | `ProductVariant` stock/price omit; `SupplierSubmittedVariant` stock/price/sku. | Variant truth tek read modelde birleştirilmemiş. |
| ProductCard | `plp.ts` | Contract var. | `ClassicProductCardProjection`, `cardTruth:false`. | Static label/projection gerçek price/stock/media owner'a bağlı değil. |
| PDP | `catalog.ts` | `PdpResponse` var; ayrı `pdp.ts` yok. | `ProductDetail` + `StorefrontContext`. | PDP response commercial projectionları içeriyor ama owner resolution yok. |
| PLP | `plp.ts` | Contract var. | `PlpQuery`, `PlpResponse`, `PlpFacet`. | PLP static projection; search/ranking/facet truth foundation seviyesinde. |
| Category | `category.ts` | Category projection contract var. | `CategoryNode`, `taxonomyTruth:false`. | Taxonomy owner gerçek service yok; static seed. |
| Visibility | `catalog.ts`, `pool.ts`, `search.ts` | Product status ve creator store visibility ayrı modellerde. | `ACTIVE/HIDDEN/UNAVAILABLE`; `VISIBLE/HIDDEN`; search filters hidden/unavailable. | PDP only `UNAVAILABLE` guard ediyor; `HIDDEN` public PDP için açık risk. |
| Status | `catalog.ts`, `pool.ts` | Multiple status families var. | `ProductStatus`, `CommercialPoolStatus`, `CreatorStoreProductStatus`. | Mapping/read eligibility net değil. |
| Price reference | `catalog.ts`, `pricing.ts`, `plp.ts` | Contract var; PDP/PLP gerçek resolver kullanmıyor. | `ProductDetail.price`, `ActiveSalesPrice`, `activePriceLabel`. | BFF/category static price truth gibi görünebilir. |
| Stock reference | `catalog.ts`, `stock.ts` | Contract var; PDP/PLP gerçek resolver kullanmıyor. | `ProductDetail.stock`, `StockAvailability`. | Stock availability read path owner'a bağlı değil. |
| Media reference | `catalog.ts`, `media.ts`, `plp.ts` | Contract var; relation static refs ile kuruluyor. | `ProductMedia`, `MediaAssetRecord`, `primaryMedia`. | PDP/PLP media asset visibility/lifecycle check yapmıyor. |

## 5. Catalog / Product Service Inventory
| Fonksiyon/Akış | Dosya | Mevcut Davranış | Boundary Durumu | Risk |
|---|---|---|---|---|
| PDP read | `apps/bff/src/server/catalog.ts` | Mock product/storefront map'ten `PdpResponse` döner. | UNSAFE | BFF mock price/stock/media/product data taşır; BFF truth owner gibi davranma riski var. |
| Category list/detail | `services/category/src/category.ts` | Static category seed döner; hidden default list dışında kalır. | PARTIAL | `taxonomyTruth:false` doğru, ama gerçek taxonomy owner yok. |
| PLP read | `services/category/src/category.ts` | Static products içinden ACTIVE category/product filter ve static facets/sort döner. | PARTIAL | Product card, price label, media ve filtering static projection. |
| PLP searchQuery | `services/category/src/category.ts` | `searchCandidates` çağrılır ama sonuç merge edilmez; yalnızca acknowledge edilmiş. | SAFE | Search ile PLP fiilen karışmıyor, fakat integration eksik. |
| Search candidate | `services/search/src/search.ts` | Memory/OpenSearch product candidate retrieval; hidden/unavailable product filtrelenir. | SAFE | Product-only OpenSearch; category/storefront static projection. |
| Ranking | `services/ranking/src/index.ts` | Placeholder. | SAFE | Ranking owner yok; 07A'ya çekilmemeli. |
| Price resolve | `services/pricing/src/pricing.ts` | Deterministic simulated active price. | PARTIAL | Foundation simulated; PDP/PLP tarafından kullanılmıyor. |
| Stock resolve | `services/stock/src/stock.ts` | Deterministic simulated stock availability. | PARTIAL | Foundation simulated; PDP/PLP tarafından kullanılmıyor. |
| Media lifecycle | `services/media/src/*` | Media asset lifecycle, processing, visibility endpointleri var. | SAFE | PDP/PLP media visibility relation kullanmıyor. |
| Product acceptance/commercial pool | `services/pool/src/pool.ts` | Supplier product, commercial product, creator store product truth in-memory. | PARTIAL | Catalog read, pool truth'tan read model üretmüyor. |

## 6. BFF Catalog / PDP / PLP Route Inventory
| Route/Handler | Method | Read Model | Truth Üretiyor mu? | Risk |
|---|---|---|---|---|
| `/catalog/pdp/:productId` / `handlePdpRead` | GET | `PdpResponse` | Evet gibi davranıyor: BFF mock product/price/stock/media üretir. | P1 |
| `/category/list` / `handleListCategories` | GET | `CategoryListResponse` | Hayır; category service projection delegasyonu. | P2 |
| `/category/detail` / `handleGetCategoryDetail` | GET | `CategoryDetailResponse` | Hayır; category service projection delegasyonu. | P2 |
| `/plp` / `handleGetPlp` | GET | `PlpResponse` | Hayır; BFF yalnız query normalize/delegate. | P1 |
| `/search` / `handleSearch` | GET | `SearchResponse` | Hayır; search service delegation. | P2 |
| `/media/asset`, `/media/list`, `/media/visibility` | GET | Media responses | Hayır; media service delegation. | P2 |

## 7. PDP Read Boundary
PDP route mevcut, fakat gerçek catalog/product owner servisinden okumuyor. BFF `catalog.ts` içinde mock product, variants, media, price ve stock alanlarını tek yerde kuruyor. Bu, inventory açısından en kritik boundary riskidir: PDP read aggregation olması gerekirken BFF mock truth kaynağına dönüşmüş.

| Alan | Owner | PDP’de Kullanım | Risk |
|---|---|---|---|
| Product core | Catalog/Product owner beklenir; repo'da gerçek service yok | BFF mock `MOCK_PRODUCTS`. | P1 |
| Variant | Product/variant owner beklenir; pool'da supplier/commercial variant truth var | BFF mock `variants`; price/stock yok. | P1 |
| Price truth | Pricing owner | PDP BFF mock `price`; `@hx/pricing` kullanılmıyor. | P1 |
| Stock truth | Stock owner | PDP BFF mock `stock`; `@hx/stock` kullanılmıyor. | P1 |
| Media truth | Media owner | PDP BFF mock `media`; media visibility/lifecycle check yok. | P1 |
| Storefront context | Storefront/creator store owner | BFF mock `MOCK_STOREFRONTS`; follow state hardcoded false. | P1 |
| Review/rating | Review/rating owner | PDP contract comment "higher orchestration/client" diyor; PDP route bağlamıyor. | P2 |
| Q&A/UGC story | QA/UGC/story owners | PDP route bağlamıyor. | P2 |

PDP BFF şu an aggregation boundary değildir; static/mock aggregation üretir. `UNAVAILABLE` ürün için 410 döner, fakat `HIDDEN` product PDP guard'ı yoktur.

## 8. PLP / Product Card Boundary
PLP route gerçek BFF endpoint olarak vardır ve BFF truth üretmez; fakat service tarafı `services/category` içinde static category/product projection üretir. PLP category read gibi davranır; search sadece opsiyonel `searchQuery` durumunda çağrılır ve sonuç PLP grid'e merge edilmez. Ranking service placeholder olduğu için PLP final ranking owner değildir.

| Alan | Owner | PLP/Product Card Kullanımı | Risk |
|---|---|---|---|
| Category | Taxonomy/category owner beklenir | Static `STATIC_CATEGORIES`; `taxonomyTruth:false`. | P1 |
| Product card | Catalog read projection beklenir | Static `STATIC_PRODUCTS` -> `ClassicProductCardProjection`. | P1 |
| Price | Pricing owner | Static `priceLabel`; `@hx/pricing` kullanılmıyor. | P1 |
| Stock | Stock owner | Product card stock taşımaz. | P2 |
| Media | Media owner | Static media ref; media visibility check yok. | P1 |
| Search | Search owner candidate üretir | `searchQuery` çağrısı var ama sonuç kullanılmıyor. | P2 |
| Ranking | Ranking owner | Sadece sort simulation; `BEST_SELLING/NEWEST` foundationSupported false. | P2 |
| Actions | Cart/interaction owners | `canAddToCart/canLike/canSave` static true. | P2 |

## 9. Visibility / Status / Eligibility Kontrolü
| Kontrol | Mevcut Durum | Kanıt | Risk |
|---|---|---|---|
| Inactive/hidden product public görünür mü? | Search ve PLP hidden product'ı filtreliyor; PDP `HIDDEN` kontrol etmiyor. | Search `HIDDEN` false; PLP `p.status === 'ACTIVE'`; PDP only `UNAVAILABLE`. | P1 |
| Archived/suspended product public görünür mü? | Pool commercial status'ta `SUSPENDED/ARCHIVED` var; PDP/PLP pool'a bağlı değil. | `CommercialPoolStatus`; catalog/PLP static data. | P1 |
| Unavailable product görünür mü? | Search/PLP filtreliyor; PDP 410 döner. | `PRODUCT_GONE`; PLP active filter. | P2 |
| Unavailable variant görünür mü? | Catalog `ProductVariant` availability taşımaz; pool variant stock taşır. | `ProductVariant` options-only; `SupplierSubmittedVariant.stock`. | P1 |
| Media olmayan ürün PDP/PLP’de nasıl davranır? | PLP binding pool'da media binding kontrolü var, ancak PLP read static media varsayar; PDP mock media varsayar. | `bindCommercialPoolProduct` mediaCount; PDP/PLP static refs. | P1 |
| Stock olmayan ürün nasıl işaretlenir? | Stock service `OUT_OF_STOCK`; PDP/PLP resolver kullanmıyor. | `StockService.resolveStock`; BFF PDP mock stock. | P1 |
| Category hidden public görünür mü? | Default list active-only; detail hidden category dönebilir warning ile; PLP non-active category product döndürmez. | `listCategories`; `getCategoryDetail`; `getPlp`. | P2 |
| Storefront product visibility | Pool visible list active+visible filtreliyor; PLP/PDP bu owner'a bağlı değil. | `listVisibleCreatorStoreProducts`. | P1 |

## 10. Smoke / Test Inventory
| Smoke Suite | Var mı? | Durum | Eksik |
|---|---|---|---|
| catalog smoke | Var | `SKIPPED` | PDP/category/PLP assertions yok. |
| PDP smoke | Yok | NOT APPLICABLE | Storefront context required, hidden/unavailable, price/stock/media boundary testleri yok. |
| PLP smoke | Yok | NOT APPLICABLE | Category filter, product card, visibility, searchQuery boundary testleri yok. |
| Product card smoke | Yok | NOT APPLICABLE | `cardTruth:false`, action boundary, price/media source testleri yok. |
| search smoke | Var | `SKIPPED` | `apps/web` bootstrap simulation var ama smoke suite çalışmıyor. |
| media smoke | Var | Implemented | Media lifecycle var; PDP/PLP media relation test etmiyor. |
| run-smoke registry | Var | catalog/search registered | Registered suites skipped olduğu için `smoke:all` catalog/search coverage üretmiyor. |

Search smoke skipped olduğu için catalog tarafında eksik kalanlar:
- Search candidate -> PLP/PDP handoff doğrulanmıyor.
- Hidden/unavailable product'ın search, PLP ve PDP arasında tutarlı görünürlük davranışı test edilmiyor.
- Category/storefront candidate indexing expansion doğrulanmıyor.
- Product card projection'ın search/ranking/facet truth üretmediği smoke ile kanıtlanmıyor.

## 11. HARDENING-07A İçin Öneri
| Kapsam | Yapılacak | Dışarıda Bırakılacak | Kabul Kanıtı |
|---|---|---|---|
| Catalog/PDP read owner boundary | PDP BFF mock data'yı owner read/delegation modeline çekmek; BFF yalnız aggregation/mapping yapmalı. | Product acceptance write flow, pool write refactor. | PDP BFF mock product/price/stock/media truth üretmez; source review. |
| Product/variant read model | Commercial active product + variant read projection standardı oluşturmak. | Full product acceptance lifecycle değişikliği. | Active/hidden/unavailable/archived/suspended read davranışı hedefli smoke. |
| PDP price/stock/media resolution | PDP price `@hx/pricing`, stock `@hx/stock`, media `@hx/media` read/visibility kaynaklarından aggregasyon yapmalı. | Pricing engine, stock reservation, media provider/CDN hardening. | PDP response owner truth mutation flag veya boundary assertions; no BFF truth. |
| PDP storefront context | Storefront/creator store product visibility ve creator note source'u netleşmeli. | Full storefront redesign. | Storefront context required ve foreign/hidden store product tests. |
| PLP product card read | Static `STATIC_PRODUCTS` yerine catalog/product read projection ve owner-derived labels kullanılmalı. | Ranking/personalization owner implementation. | Product card smoke: `cardTruth:false`, hidden/unavailable excluded, price/media source checked. |
| Category/PLP filters | Foundation filters category modelinden gelmeli; static facet truth gibi sunulmamalı. | Full dynamic facet/index engine. | Filter no-results, hidden category, active category smoke. |
| Search boundary | PLP search integration candidate düzeyinde kalmalı; final ranking 07A'ya alınmamalı. | OpenSearch category/storefront expansion; ranking/recommendation. | Search/PLP boundary smoke: `rankingFinal:false`. |
| Smoke coverage | `smoke:catalog` gerçek PDP/PLP/category/product-card checks içermeli. | Full T4 E2E. | `pnpm run smoke:catalog`; gerekiyorsa ayrı `smoke:pdp`/`smoke:plp`. |

Beklenen ayrım:
- 07A: catalog/PDP/PLP read hardening.
- 07B: search/index sync inventory ve implementation.
- Ranking ayrı owner olduğu için 07A kapsamına çekilmemeli.

## 12. Komut/Test Durumu
Bu inventory paketinde test komutu zorunlu değildir; build/typecheck/smoke çalıştırılmadı.

| Komut | Çalıştırıldı mı? | Sonuç | Not |
|---|---|---|---|
| `pnpm run typecheck` | Hayır | NOT RUN | Inventory-only. |
| `pnpm run build` | Hayır | NOT RUN | Inventory-only. |
| `pnpm run smoke:catalog` | Hayır | NOT RUN | Suite mevcut ama kodda SKIPPED. |
| `pnpm run smoke:search` | Hayır | NOT RUN | Suite mevcut ama kodda SKIPPED. |
| `pnpm run smoke:all` | Hayır | NOT RUN | Inventory-only. |
| `rg --files ...` / `rg -n ...` | Evet | COMPLETED | Dosya ve sembol envanteri için kullanıldı. |
| `Get-Content -Raw ...` | Evet | COMPLETED | Referans ve kaynak dosya okuma için kullanıldı. |

## 13. Nihai Karar
- HARDENING-07-00A inventory paketidir.
- Kod değişikliği yapılmadı; endpoint/refactor/migration eklenmedi.
- Sistem PASS/FAIL verilmedi.
- Catalog/PDP/PLP repo gerçekliği çıkarıldı.
- HARDENING-07A için önerilen yön: BFF mock PDP truth üretimini kaldıran, catalog/product read projection ile pricing/stock/media owner delegation sınırını netleştiren Catalog / PDP / PLP Read Hardening.
- En kritik P0/P1 riskler:
  - P1: PDP BFF içinde mock product/price/stock/media üretimi.
  - P1: Gerçek `services/catalog` / `services/product` read owner yokluğu.
  - P1: PLP product card static projection ve static price/media label kullanımı.
  - P1: PDP hidden product visibility guard eksikliği.
  - P1: Media/price/stock owner servisleri mevcut olsa da PDP/PLP read path'e bağlı değil.
  - P1: Catalog/PDP/PLP smoke coverage yok; `smoke:catalog` SKIPPED.
