# HARDENING-07-00B — Search / Index Sync Inventory

## 1. Kısa Özet
- Bu paket inventory paketidir.
- Kod değişikliği yapılmadı; yalnızca bu rapor dosyası oluşturuldu.
- PASS/FAIL verilmedi.
- Search katmanı foundation seviyesinde vardır: `packages/contracts/src/search.ts`, `services/search/src/*`, BFF `GET /search` route ve P40 service-level smoke mevcuttur.
- En kritik 5 search/index bulgusu:
  - Search candidate contract ve service vardır; candidate response açıkça `searchTruth:false`, `productTruthMutated:false`, `rankingFinal:false` bayrakları taşır.
  - OpenSearch entegrasyonu gerçek client seviyesinde vardır; ancak yalnız product document index'i (`hx_products_foundation`) için foundation projection üretir.
  - Index sync owner event/outbox hattına bağlı değildir; `indexProductSearchDocument(s)`, `deleteProductSearchDocument`, `deactivateProductSearchDocument` fonksiyonları manuel API/helper olarak durur.
  - Product/catalog update'ın index'e otomatik yansıdığı bir servis, consumer, outbox handler veya migration yoktur; gerçek `services/catalog` / `services/product` read owner yokluğu search/index tarafından kapatılmamıştır.
  - Root `smoke:search` suite registry'de vardır ama `tests/smoke/suites/others.ts` içinde `SKIPPED` döner; çalışan arama doğrulaması yalnız `services/search/p40-smoke-test.ts` service-level smoke seviyesindedir.

## 2. Referans Dosya Kontrolü
| Dosya | Durum | Not |
|---|---|---|
| `HARDENING-07-00A-CATALOG-PDP-PLP-READ-INVENTORY.md` | FOUND | Catalog/PDP/PLP read owner yokluğu ve PDP/PLP static/mock projection riski 07-00B için ana girdi. |
| `HARDENING-06-FINAL-CLOSURE-REPORT.md` | FOUND | 06 finalde catalog/search smoke `SKIPPED` limitation olarak bırakılmış. |
| `planlama/12-Arama Sistemi.md` | NOT FOUND | Verilen path yok; gerçek dosya `planlama/12- Arama Sistemi.md`. |
| `planlama/12- Arama Sistemi.md` | FOUND | Search çok modlu intent/candidate/yüzey yönlendirme sistemi olarak tanımlı. |
| `planlama/7-keşfet sistemi.md` | FOUND | Keşfet aramasının katalog/PLP'ye dönüşmemesi ve video-merkezli kalması bekleniyor. |
| `planlama/10-kategori-plp sistemi.md` | FOUND | PLP seçim yüzeyi; filtre/sıralama destekli ama keşfet/feed değil. |
| `planlama/4-pdp sistemi.md` | FOUND | PDP ürün karar alanı; search PDP truth devralmamalı. |
| `planlama/8-klasik ürün kart sistemi.md` | FOUND | Product card PDP'ye sarkmayan projection olmalı. |
| `planlama/62-MASTER_IMPLEMENTATION_PLAN.md` | FOUND | Paket 19 Search Foundation, Paket 20 Ranking/Recommendation, Paket 21 Home/Category/Discover ayrımı var. |
| `planlama/65-ACTIVE_RISKS_AND_DECISIONS.md` | FOUND | OpenSearch credential/bootstrap, category/storefront indexing expansion ve public facet contract borçları izleniyor. |

## 3. İncelenen Repo Dosyaları
| Alan | Dosya/Yol | Durum | Not |
|---|---|---|---|
| Contracts | `packages/contracts/src/search.ts` | FOUND | Search mode, intent, candidate ve response contract var. |
| Contracts | `packages/contracts/src/catalog.ts` | FOUND | Product/PDP contract var; product read owner değildir. |
| Contracts | `packages/contracts/src/index.ts` | FOUND | `search`, `catalog`, `plp`, `pricing`, `stock`, `media` export ediliyor. |
| Contracts | `packages/contracts/src/plp.ts` | FOUND | PLP product card/facet projection contract var. |
| Services | `services/search/src/search.ts` | FOUND | Memory/OpenSearch candidate retrieval, query normalize ve intent classification içerir. |
| Services | `services/search/src/document.ts` | FOUND | `ProductSearchDocument` projection modeli ve mapper'lar var. |
| Services | `services/search/src/opensearch.ts` | FOUND | OpenSearch product index create/search/index/delete/deactivate client var. |
| Services | `services/search/src/config.ts` | FOUND | `SEARCH_BACKEND=memory|opensearch`, OpenSearch env validation var. |
| Services | `services/search/p40-smoke-test.ts` | FOUND | Service-level memory/degraded/OpenSearch smoke var. |
| Services | `services/ranking/src/index.ts` | FOUND | Sadece `name = "ranking"` placeholder. |
| Services | `services/catalog/src/*` | NOT FOUND | Catalog read owner service yok. |
| Services | `services/product/src/*` | NOT FOUND | Product read owner service yok. |
| Services | `services/pricing/src/pricing.ts` | FOUND | `FOUNDATION_SIMULATED` price resolver; search index sync'e bağlı değil. |
| Services | `services/stock/src/stock.ts` | FOUND | `FOUNDATION_SIMULATED` stock resolver; search index sync'e bağlı değil. |
| Services | `services/media/src/*` | FOUND | Media asset owner service var; search index sync'e bağlı değil. |
| Services | `services/category/src/category.ts` | FOUND | PLP static projection; optional `searchCandidates` çağrısı sonucu grid'e merge edilmiyor. |
| BFF | `apps/bff/src/server/search.ts` | FOUND | `@hx/search.searchCandidates` delegasyonu. |
| BFF | `apps/bff/src/server/catalog.ts` | FOUND | PDP mock product/storefront truth üretir; 07-00A riski. |
| BFF | `apps/bff/src/server/index.ts` | FOUND | `/search`, `/catalog/pdp/:productId`, `/plp` route wiring var. |
| Events | `packages/events/src/*` | FOUND | Sadece generic `EventEnvelope`; search/index sync event contract yok. |
| Persistence | `packages/persistence/src/audit-event.ts` | FOUND | Generic audit/outbox repository var; search index consumer yok. |
| Migrations | `infra/migrations/20260426_001_event_audit_durability.sql` | FOUND | `event_outbox` tablosu var. |
| Migrations | `infra/migrations/*search*` | NOT FOUND | Search index veya sync tablosu migration'ı yok. |
| Smoke | `tests/smoke/suites/others.ts` | FOUND | `searchSmoke` ve `catalogSmoke` `SKIPPED`. |
| Smoke | `tests/smoke/run-smoke.ts` | FOUND | `search` ve `catalog` registry'de var. |
| Root | `package.json` | FOUND | `smoke:search`, `smoke:catalog`, `smoke:all` scriptleri var. |
| Infra | `infra/compose/docker-compose.local.yml` | FOUND | OpenSearch container var. |

## 4. Search Contract Inventory
| Bileşen | Dosya | Gerçek Durum | Kanıt | Risk |
|---|---|---|---|---|
| Search query input | `search.ts` | Contract var. | `SearchQueryInput` query/mode/surface/storefrontId/categoryId/limit/cursor taşır. | Query parsing contract seviyesinde sınırlı; advanced normalization yok. |
| Search mode | `search.ts` | Contract var. | `GLOBAL`, `DISCOVER`, `CATALOG`, `STOREFRONT`. | Mod davranışı service içinde foundation seviyesinde. |
| Intent | `search.ts` | Contract var. | `SearchIntent`, `SearchIntentType`. | Intent classification heuristic; owner truth değil. |
| Product candidate | `search.ts` | Contract var. | `ProductSearchCandidate`, `searchTruth:false`, `productTruthMutated:false`, `rankingFinal:false`. | Candidate projection product truth yerine geçmemeli. |
| Category candidate | `search.ts` | Contract var. | `CategorySearchCandidate`, `taxonomyTruthMutated:false`. | Category/storefront OpenSearch document yok; static projection. |
| Storefront candidate | `search.ts` | Contract var. | `StorefrontSearchCandidate`, `storefrontTruthMutated:false`. | Storefront owner/index sync yok. |
| Ranking boundary | `search.ts` | Açık ayrım var. | Candidate'larda `rankingFinal:false`, service warnings `M8_RANKING_NOT_IN_SCOPE`. | `scoreFoundationOnly` final ranking gibi yorumlanabilir. |
| Facet contract | `search.ts`, `opensearch.ts` | Public response'ta facet yok; OpenSearch client facet döndürür. | `OpenSearchProductSearchResult.facets`; `SearchResponse` içinde facets alanı yok. | Facet üretimi response contract'a taşınmamış; PLP facet truth ile karışma riski. |
| Price/stock/media truth | `document.ts` | Projection alanları var ama owner değil. | `priceMin`, `priceMax`, `mediaType`, `facetValues`. | Owner sync olmadığı için stale projection riski. |

## 5. Search Service Inventory
| Fonksiyon/Akış | Dosya | Mevcut Davranış | Boundary Durumu | Risk |
|---|---|---|---|---|
| Query normalize | `services/search/src/search.ts` | Trim/lowercase/space normalize eder. | SAFE | Dil/aksan/stemming/tokenization foundation seviyesinde. |
| Intent classification | `services/search/src/search.ts` | Hardcoded category/store/discovery term list ile type/confidence üretir. | PARTIAL | Gerçek intent engine değil; Turkish chars için `ADVANCED_NORMALIZATION_MISSING` warning var. |
| Memory candidate retrieval | `services/search/src/search.ts` | Static `MEMORY_CANDIDATES` içinden name/slug match; hidden/unavailable product filtrelenir. | PARTIAL | Static candidate projection truth gibi kullanılmamalı. |
| Discover candidate | `services/search/src/search.ts` | `DISCOVER` modunda sadece `PRODUCT` + `VIDEO` döner. | SAFE | Keşfet araması foundation seviyesinde; feed/ranking değildir. |
| Catalog candidate | `services/search/src/search.ts` | `CATALOG` modunda product/category candidate döner. | PARTIAL | PLP grid'e gerçek merge yok; final list owner değil. |
| Storefront candidate | `services/search/src/search.ts` | `STOREFRONT` + storefrontId ile product filtreler. | PARTIAL | Storefront visibility owner'a bağlı değil. |
| OpenSearch search | `services/search/src/opensearch.ts` | Product index'te visible/status/category/storefront/media filters ve multi_match kullanır. | PARTIAL | Product-only index; category/storefront docs yok. |
| Index ensure/index/delete/deactivate | `services/search/src/search.ts`, `opensearch.ts` | Export edilen helper'lar OpenSearch product document mutate eder. | PARTIAL | Tetikleyici owner event/consumer yok; manuel projection write. |
| Product detail mapper | `services/search/src/document.ts` | `ProductDetail` -> `ProductSearchDocument` çevirir. | UNSAFE RISK | `ProductDetail` PDP/read contract'tan geliyor; gerçek catalog/product owner eksikken source truth belirsiz. |
| Price/stock/media projection | `services/search/src/document.ts` | `priceMin/priceMax/mediaType/facetValues` alanları var. | PARTIAL | Pricing/stock/media owner resolver veya sync hook yok. |
| Ranking service | `services/ranking/src/index.ts` | Placeholder. | SAFE | Search M8 ranking owner rolü üstlenmiyor. |
| P40 smoke | `services/search/p40-smoke-test.ts` | Memory, config, degraded fallback ve opsiyonel OpenSearch runtime doğrular. | PARTIAL | Root BFF `smoke:search` yerine geçmiyor. |

## 6. Search BFF Route Inventory
| Route/Handler | Method | Davranış | Truth Üretiyor mu? | Risk |
|---|---|---|---|---|
| `/search` / `handleSearch` | GET | `q/query`, `mode`, `surface`, `storefrontId`, `categoryId`, `limit` normalize edip `searchCandidates` çağırır. | Hayır; service delegation. | Mode/limit validation zayıf; invalid mode cast ediliyor. |
| `/catalog/pdp/:productId` / `handlePdpRead` | GET | PDP mock product/storefront data döner. | Evet gibi davranıyor; BFF mock truth üretir. | Search candidate -> PDP handoff gerçek owner'a bağlı değil. |
| `/plp` / `handleGetPlp` | GET | Category service PLP projection delegasyonu. | BFF üretmiyor. | PLP service static projection; search result grid'e gerçek merge edilmiyor. |

## 7. Index / Projection Inventory
| Alan | Index’te Var mı? | Source Owner | Sync Mekanizması | Risk |
|---|---|---|---|---|
| Product core | Var | Catalog/Product owner beklenir; repo'da yok | Manuel `indexProductSearchDocument(s)` veya seed | P1: Source truth belirsiz; index truth yerine geçebilir. |
| Product status/visibility | Var | Product/catalog/storefront visibility owner beklenir | Document `status`, `visible`; OpenSearch query filtreler | P1: Owner status update -> index otomatik sync yok. |
| Variant | Kısmi | Product/variant owner beklenir | `variantId` optional document alanı | P1: Variant truth sync yok; pricing/stock variant yansıması yok. |
| Category IDs/slugs | Var | Category/taxonomy owner beklenir | Document alanı; category docs ayrı indexlenmiyor | P1: Taxonomy owner yok; stale category projection riski. |
| Storefront/creator | Kısmi | Storefront/creator store owner beklenir | Document alanları; storefront docs ayrı indexlenmiyor | P1: Storefront visibility/scope sync yok. |
| Media type | Var | Media owner | Document `mediaType`; owner lifecycle check yok | P1: Media visibility/processing state index'e otomatik yansımaz. |
| Price min/max | Var | Pricing owner | Document optional alanları; resolver bağlantısı yok | P1: Price projection stale olabilir; search price truth owner değildir. |
| Stock | Yok | Stock owner | Yok | P2: Stock filter/index yok; stock truth search'te yok. |
| Facet values | Var | Category/product attribute owners beklenir | Generic `facetValues`; OpenSearch aggs category/brand/mediaType | P2: Public SearchResponse facets yok; facet truth değil. |
| Ranking score | Kısmi | Ranking M8 owner | OpenSearch `_score` -> `scoreFoundationOnly` | P1: Final ranking değil; `rankingFinal:false` korunmalı. |
| Suggestions/trending | Contract var, implementation yok | Search/analytics/ranking ayrımı gerekir | Yok | P2: Suggestions alanı boş kalıyor. |

## 8. Search / Ranking Boundary
| Kontrol | Sonuç | Kanıt | Risk |
|---|---|---|---|
| Search candidate owner mı? | Evet, foundation candidate owner gibi çalışıyor. | `searchCandidates`, `SearchCandidate`, `scoreFoundationOnly`. | Candidate owner rolü product/catalog truth'a genişlememeli. |
| Ranking score owner mı? | Hayır. | `rankingFinal:false`, warnings `RANKING_NOT_IN_SCOPE`, `M8_RANKING_NOT_IN_SCOPE`. | OpenSearch `_score` final sıralama gibi kullanılabilir. |
| Search ranking truth üretiyor mu? | Hayır; final ranking üretmiyor. | Candidate contract ve P40 smoke assertion `rankingFinal === false`. | PLP sort/facet ile karışırsa boundary bulanıklaşır. |
| Explore/feed ile karışıyor mu? | Kısmen ayrılmış. | `DISCOVER` yalnız video product candidate; `discoveryFeed:false` PLP video rail. | Keşfet/feed orchestration ve ranking owner yok. |
| Search price/stock/media truth owner mı? | Hayır. | `ProductSearchDocument` projection alanları; pricing/stock/media servisleri ayrı. | Projection alanları owner gibi yorumlanabilir. |
| Search catalog truth owner mı? | Hayır. | `searchTruth:false`, `productTruthMutated:false`, catalog/product service yok. | Catalog owner yokluğu search index ile kapatılmamalı. |

## 9. Event / Outbox / Sync Durumu
| Event | Source | Index Sync Var mı? | Risk |
|---|---|---|---|
| Generic event envelope | `packages/events/src/envelope.ts` | Hayır | Search-specific topic/payload yok. |
| Generic outbox | `packages/persistence/src/audit-event.ts` | Hayır | Outbox repository var ama search consumer/publisher yok. |
| `event_outbox` table | `infra/migrations/20260426_001_event_audit_durability.sql` | Hayır | Outbox persistence search index sync'e bağlanmamış. |
| Product acceptance/commercial changes | `services/pool/src/pool.ts` | Hayır | Pool in-memory product lifecycle index'e event atmaz. |
| Catalog/PDP product changes | `services/catalog/src/*` | NOT FOUND | Hayır | Catalog/product owner yok; index sync source'u yok. |
| Price changes | `services/pricing/src/pricing.ts` | Hayır | Deterministic simulated resolver index update tetiklemez. |
| Stock changes | `services/stock/src/stock.ts` | Hayır | Stock resolver index update tetiklemez. |
| Media lifecycle changes | `services/media/src/*` | Hayır | Media readiness/visibility search index'e bağlı değil. |
| Analytics events | `services/analytics/src/*` | Hayır | Analytics event ingestion search indexing consumer değildir. |

## 10. Smoke / Test Inventory
| Smoke Suite | Var mı? | Durum | Eksik |
|---|---|---|---|
| root `smoke:search` | Var | `SKIPPED` | BFF `/search` assertions yok. |
| root `smoke:catalog` | Var | `SKIPPED` | Search/PDP/PLP handoff doğrulanmıyor. |
| `tests/smoke/run-smoke.ts` registry | Var | Registered | Suite implementation skipped. |
| `services/search/p40-smoke-test.ts` | Var | Service-level implemented | Root smoke değil; BFF route, catalog owner update ve event sync yok. |
| OpenSearch runtime smoke | Kısmi | `SEARCH_BACKEND=opensearch` ise çalışır, değilse skip | Local credential/bootstrap limitation var. |
| Hidden/unavailable search test | Kısmi | P40 memory smoke hidden product exclude eder | BFF smoke ve owner update sync coverage yok. |
| Index sync smoke | Yok | NOT APPLICABLE | Product update -> outbox -> index -> search journey yok. |
| Facet/filter smoke | Kısmi | OpenSearch client aggs var | Public `SearchResponse` facet contract ve PLP merge yok. |

Search smoke neden skipped:
- `tests/smoke/suites/others.ts` içinde `searchSmoke.run` doğrudan `{ result: 'SKIPPED', message: 'Search smoke test not implemented' }` döner.
- Root script `smoke:search` yalnız bu suite'i çağırır; P40 service smoke'u çağırmaz.

Search smoke oluşturmak için eksikler:
- BFF `/search` happy path, query required, hidden/unavailable exclusion, mode-specific candidate checks.
- Candidate flags: `searchTruth:false`, `productTruthMutated:false`, `rankingFinal:false`.
- Memory vs OpenSearch backend beklentisinin explicit warning ile ayrılması.
- Search -> PLP/PDP handoff'un product truth yerine geçmediğini gösteren boundary assertions.
- Index sync smoke için önce event/outbox consumer veya owner-triggered index sync mekanizması gerekir.

## 11. HARDENING-07B İçin Öneri
| Kapsam | Yapılacak | Dışarıda Bırakılacak | Kabul Kanıtı |
|---|---|---|---|
| Search BFF smoke | `/search` için gerçek root smoke yazılmalı. | Ranking, personalization, full autocomplete. | `pnpm run smoke:search` SKIPPED dönmez; candidate boundary flags doğrulanır. |
| Product index source contract | Search index document source'u catalog/product read projection'a bağlanmalı; index truth sayılmamalı. | Catalog/product owner eksikliğini search içinde kapatmak. | Index document builder source owner explicit; `SEARCH_INDEX_IS_PROJECTION_NOT_TRUTH` korunur. |
| Index sync mechanism | Product/catalog owner event/outbox sonrası search projection update tasarlanmalı. | Event'i business mutation gibi kullanmak. | Owner mutation -> outbox/event -> index sync -> search candidate smoke; owner state event tarafından mutate edilmez. |
| Visibility sync | ACTIVE/HIDDEN/UNAVAILABLE/SUSPENDED/ARCHIVED mapping standardı kurulmalı. | PDP/PLP read refactor. | Hidden/unavailable update sonrası search exclusion smoke. |
| Price/stock/media projection | Search'te yalnız projection/sort/facet için owner-derived snapshot tutulmalı. | Pricing/stock/media truth owner olmak. | Price/media stale/projection warnings ve owner source assertions. |
| Category/storefront candidates | Category/storefront candidate document model ayrı expansion olarak değerlendirilmeli. | Full taxonomy/storefront owner implementasyonu. | Category/storefront candidate source ve index scope net; product index'e karışmaz. |
| Ranking boundary | `scoreFoundationOnly` final ranking değildir; M8 ranking dışarıda kalmalı. | Ranking service implementation. | `rankingFinal:false` BFF/service smoke ile doğrulanır. |
| OpenSearch infra | Local credential/bootstrap standardı hizalanmalı. | Production OpenSearch ops hardening tamamı. | OpenSearch smoke explicit config ile deterministic çalışır veya net skip nedeni verir. |

## 12. Komut/Test Durumu
Bu inventory paketinde build/typecheck/smoke çalıştırılmadı. Yalnız dosya ve kaynak envanteri komutları kullanıldı.

| Komut | Çalıştırıldı mı? | Sonuç | Not |
|---|---|---|---|
| `pnpm run typecheck` | Hayır | NOT RUN | Inventory-only. |
| `pnpm run build` | Hayır | NOT RUN | Inventory-only. |
| `pnpm run smoke:search` | Hayır | NOT RUN | Kodda suite `SKIPPED`; implementation görevi değil. |
| `pnpm run smoke:catalog` | Hayır | NOT RUN | Kodda suite `SKIPPED`; implementation görevi değil. |
| `rg --files` | Evet | COMPLETED | Repo dosya envanteri için kullanıldı. |
| `rg -n "search|query|intent|candidate|index|indexing|sync|projection|opensearch|elastic|ranking|rerank|score|facet|filter|category|plp|product|variant|visibility|event|outbox"` | Evet | COMPLETED | Search/index/event izleri için kullanıldı. |
| `Get-Content -Raw ...` | Evet | COMPLETED | Referans ve kaynak dosyaları okundu. |
| `Test-Path ...` | Evet | COMPLETED | Eksik path/service kontrolleri yapıldı. |
| `git status --short` | Evet | FAILED | Bu klasör git repository değil: `fatal: not a git repository`. |

## 13. Nihai Karar
- HARDENING-07-00B inventory paketidir.
- Kod değişikliği yapılmadı; endpoint/refactor/migration eklenmedi.
- Sistem PASS/FAIL verilmedi.
- Search/index sync repo gerçekliği çıkarıldı.
- HARDENING-07B için önerilen yön: search candidate ve OpenSearch product projection foundation'ını koruyup, index'i product/catalog truth yerine geçirmeden owner-derived projection sync hattı ve gerçek `smoke:search` coverage ekleyen Search / Index Sync Hardening.
- En kritik P0/P1 riskler:
  - P1: Index sync owner event/outbox veya catalog/product update hattına bağlı değil.
  - P1: Gerçek `services/catalog` / `services/product` read owner yokken `ProductSearchDocument` source truth belirsiz kalıyor.
  - P1: OpenSearch product index projection alanları (`priceMin`, `priceMax`, `mediaType`, `facetValues`) owner-derived sync olmadan stale/truth gibi algılanabilir.
  - P1: Product status/visibility update'leri index'e otomatik yansımıyor; hidden/unavailable exclusion yalnız mevcut document/memory seed üzerinden çalışıyor.
  - P1: Root `smoke:search` `SKIPPED`; BFF `/search`, search/PLP/PDP handoff ve index sync coverage yok.
  - P1: Category/storefront candidates static/foundation projection seviyesinde; OpenSearch-indexed document ve owner sync yok.
