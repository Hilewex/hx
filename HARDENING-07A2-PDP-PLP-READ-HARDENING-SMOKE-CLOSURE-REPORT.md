# HARDENING-07A2 - PDP / PLP Read Hardening & Smoke Closure Report

## 1. Kisa Ozet
- Paket amaci: 07A1'de kurulan `@hx/catalog` read projection foundation uzerinden PDP ve PLP read path'lerini BFF mock/static truth davranisindan uzaklastirmak ve smoke coverage'i gercek hale getirmek.
- Yapilan implementation: PDP public read `@hx/catalog.getCatalogProductProjection(..., { includeNonPublic:false })` ile sertlestirildi; PLP product card source `services/category` static product listesi yerine `@hx/catalog.listPublicCatalogProductCards` delegasyonuna baglandi; PLP card boundary flag'leri contract'a eklendi; `smoke:catalog` gercek PDP/PLP assertion'lari calistiracak hale getirildi.
- Yapilmayanlar: Search/index sync, OpenSearch sync, ranking/recommendation, dynamic facets, pricing engine, stock reservation, media provider/CDN hardening ve product write lifecycle refactor yapilmadi.
- Nihai karar: PASS WITH LIMITATION.

## 2. Referans Dosyalar
| Dosya | Durum | Not |
|---|---|---|
| `HARDENING-07A1-CATALOG-READ-PROJECTION-FOUNDATION-CLOSURE-REPORT.md` | FOUND | 07A1 catalog projection foundation ve smoke sonucuna gore ilerlenildi. |
| `HARDENING-07-00A-CATALOG-PDP-PLP-READ-INVENTORY.md` | FOUND | PDP hidden guard ve PLP static product card riski ana girdi olarak kullanildi. |
| `HARDENING-07-00B-SEARCH-INDEX-SYNC-INVENTORY.md` | FOUND | Search/index sync'in bu pakete alinmamasi siniri korundu. |
| `HARDENING-06-FINAL-CLOSURE-REPORT.md` | FOUND | Catalog/search skipped limitation'i dikkate alindi; catalog kapatildi, search 07B'ye kaldi. |
| `planlama/4-pdp sistemi.md` | FOUND | PDP store-context ve product decision boundary referansi. |
| `planlama/10-kategori-plp sistemi.md` | FOUND | PLP'nin secim yuzeyi olarak kalmasi referansi. |
| `planlama/8-klasik ürün kart sistemi.md` | FOUND | Product card'in PDP truth'una sarkmamasi referansi. |
| `planlama/26-varyant sistemi.md` | FOUND | Variant price/stock owner siniri referansi. |
| `planlama/50-medya sistemş asset  sitemi.md` | FOUND | Media truth owner siniri referansi. |
| `planlama/25-kural -yetki sistemi.md` | FOUND | BFF/UI truth uretmeme ve owner boundary ilkeleri. |
| `planlama/62-MASTER_IMPLEMENTATION_PLAN.md` | FOUND | Catalog/PDP, Search ve Ranking paket ayrimi korundu. |

## 3. Degisen Dosyalar
| Dosya | Degisiklik | Gerekce |
|---|---|---|
| `packages/contracts/src/plp.ts` | `ClassicProductCardProjection` icin catalog/search/price/stock/media boundary flag alanlari eklendi. | PLP card projection'in truth olmadigini response contract seviyesinde gorunur yapmak. |
| `services/category/package.json` | `@hx/catalog` dependency eklendi. | PLP product cards icin catalog read projection delegasyonu. |
| `services/category/src/category.ts` | PLP productCards runtime kaynagi `listPublicCatalogProductCards` oldu; price label owner truth gibi sunulmadan placeholder boundary ile dondu; search candidate sonucu grid truth'a merge edilmedi. | Category/PLP'nin product truth veya ranking/search truth uretmemesi. |
| `apps/bff/src/server/catalog.ts` | PDP ve catalog product read public path'leri `includeNonPublic:false` ile cagrildi. | Hidden/non-public product public read leak riskini kapatmak. |
| `tests/smoke/suites/others.ts` | `catalogSmoke` SKIPPED olmaktan cikarildi; PDP active/hidden/unavailable, PLP leak ve boundary assertion'lari eklendi. | `smoke:catalog` gercek acceptance kaniti uretmeli. |
| `pnpm-lock.yaml` | `@hx/category -> @hx/catalog` workspace link'i eklendi. | Yeni dependency graph kaydi. |
| `packages/contracts/dist/*`, `services/category/dist/*`, `apps/bff/dist/*` | Build ciktilari guncellendi. | Repo build output tutuyor; root build sonucu. |
| `tests/smoke/durability-context.json` | `smoke:all` core-commerce phase context'i guncellendi. | Smoke runner runtime artefact'i. |

## 4. PDP Read Hardening Sonucu
- PDP source: BFF `handlePdpRead` artik public PDP icin `@hx/catalog.getCatalogProductProjection(productId, { includeNonPublic:false })` uzerinden okuyor.
- BFF mock/static truth kaldi mi? PDP handler icinde product/price/stock/media mock map yok; BFF storefront context'i de `@hx/catalog.getStorefrontContext` uzerinden aliyor.
- Hidden product davranisi: `/catalog/pdp/p_hidden?storefrontId=s_feno_1` 404 donuyor.
- Unavailable product davranisi: `/catalog/pdp/p_unavailable?storefrontId=s_feno_1` 410 `PRODUCT_GONE` donuyor.
- Price/stock/media boundary: PDP response `price` ve `stock` alanlarini BFF/catalog truth gibi uretmiyor; media yalniz catalog projection snapshot/ref olarak kaliyor.
- Boundary flag sonuclari: `catalogReadTruth:false`, `productTruthMutated:false`, `priceTruth:false`, `stockTruth:false`, `mediaTruth:false`, `searchIndexTruth:false` smoke ile dogrulandi.

## 5. PLP / Product Card Hardening Sonucu
- PLP product cards source: `services/category.getPlp` runtime'da `@hx/catalog.listPublicCatalogProductCards` ile besleniyor.
- Static projection durumu: Category taxonomy, sort options ve facets foundation/static projection olarak kaldi; product card grid runtime source'u catalog read projection'a tasindi. Legacy static product seed dosyada kaldi fakat PLP read path'inde kullanilmiyor.
- Hidden/unavailable/suspended/archived leak kontrolu: `/plp?categoryId=c_1` icinde `p_hidden`, `p_unavailable`, `p_suspended`, `p_archived` leak etmedi.
- Product card boundary flag sonucu: `cardTruth:false`, `catalogReadTruth:false`, `productTruthMutated:false`, `priceTruth:false`, `stockTruth:false`, `mediaTruth:false`, `searchIndexTruth:false` smoke ile dogrulandi.
- Price/media/stock owner boundary: PLP aktif fiyat truth uretmiyor; `activePriceLabel` owner delegation tamamlanmadigi icin `PRICE_OWNED_BY_PRICING` boundary placeholder olarak donuyor. Media yalniz ref snapshot; stock truth yok.

## 6. Category / PLP Boundary
- Category taxonomy truth bu pakette kurulmadı; `taxonomyTruth:false` foundation modeli korundu.
- PLP filters/facets foundation seviyesinde kaldi; dynamic facet engine yazilmadi.
- Search/ranking bu pakete girmedi. `searchQuery` varsa search candidate cagri acknowledgement seviyesinde kalir; grid truth'a merge edilmez ve final ranking uretilmez.

## 7. Smoke/Test Sonuclari
| Komut/Senaryo | Sonuc | Not |
|---|---|---|
| `pnpm install` | PASS | `@hx/category -> @hx/catalog` workspace link'i lock'a islendi. |
| `pnpm --filter @hx/category run typecheck` | PASS | PLP/category targeted typecheck. |
| `pnpm --filter @hx/bff run typecheck` | PASS | PDP/BFF targeted typecheck. |
| `pnpm --filter @hx/contracts run typecheck` | PASS | PLP contract targeted typecheck. |
| `pnpm run typecheck` | PASS | Root typecheck gecti. |
| `pnpm run build` | PASS | Root build gecti. |
| BFF boot | PASS WITH NOTE | 3001'de eski BFF process bulundu ve sonlandirildi; yeni BFF PID 10312 ile 3001'de baslatildi. 3002'de onceden kalma baska local listener bulundu, smoke 3001'e yonlendirildi. |
| `pnpm run smoke:health` | PASS | `SMOKE_BFF_BASE_URL=http://localhost:3001`. |
| `pnpm run smoke:catalog-read` | PASS | Catalog read projection boundaries verified. |
| `pnpm run smoke:catalog` | PASS | Catalog PDP/PLP read boundaries verified; artik SKIPPED degil. |
| `pnpm run smoke:all` | PASS WITH SKIPPED | Implemented suite'ler PASS; `catalog` PASS, `catalog-read` PASS, `search` SKIPPED. |
| PDP active product success | PASS | `/catalog/pdp/p_valid?storefrontId=s_feno_1`. |
| PDP hidden product 404 | PASS | `/catalog/pdp/p_hidden?storefrontId=s_feno_1`. |
| PDP unavailable product 410 | PASS | `/catalog/pdp/p_unavailable?storefrontId=s_feno_1`. |
| PLP leak exclusion | PASS | Hidden/unavailable/suspended/archived product card leak etmedi. |
| Product card boundary | PASS | `cardTruth:false` ve owner boundary flag'leri dogrulandi. |

## 8. Kalan Limitation'lar
- Search smoke hala SKIPPED; 07B/07C hattina kaldi.
- Search/index sync yok.
- OpenSearch sync yok.
- Ranking/recommendation yok.
- Dynamic facets yok.
- Pricing/stock/media advanced engine yok.
- PLP `activePriceLabel` pricing owner'a delegate edilmedi; boundary placeholder kullanildi.
- Category taxonomy owner foundation seviyesinde.
- Catalog/product write owner yok; read projection foundation devam ediyor.
- `services/category` icinde legacy static product seed runtime disi kaldi; cleanup hygiene borcu olarak izlenmeli.

## 9. Boundary Review
- BFF truth owner oldu mu? Hayir. BFF PDP/PLP read path'lerinde delegation/normalization katmaninda kaldi.
- Catalog read write owner oldu mu? Hayir. Write lifecycle mutation yok.
- Search/index truth yerine gecti mi? Hayir. Search/index sync yapilmadi; `searchIndexTruth:false` korunuyor.
- Ranking bu pakete girdi mi? Hayir. M8 ranking disarida; final ranking yok.
- Price/stock/media truth PDP/PLP'ye tasindi mi? Hayir. PDP/PLP bu truth'lari uretmiyor; boundary flag ve warning/placeholder ile sinirli.
- Hidden/unavailable/suspended/archived visibility korundu mu? Evet. PDP 404/410 ve PLP leak exclusion smoke ile dogrulandi.
- Product card truth gibi davrandi mi? Hayir. `cardTruth:false` ve owner boundary flag'leri korunuyor.

## 10. Nihai Karar
Karar:
- PASS WITH LIMITATION

Gerekce:
- `pnpm run typecheck`: PASS.
- `pnpm run build`: PASS.
- BFF boot: PASS, port 3001.
- `pnpm run smoke:catalog-read`: PASS.
- `pnpm run smoke:catalog`: PASS ve SKIPPED degil.
- PDP active/hidden/unavailable davranislari dogru.
- PLP product cards hidden/unavailable/suspended/archived leak etmiyor.
- BFF truth owner olmuyor.
- Product card truth owner olmuyor.
- Price/stock/media truth PDP/PLP'ye tasinmiyor.
- Limitation: Search smoke/index sync/dynamic facet/ranking/pricing-stock-media production readiness borclari ileri pakete kaldi.

Siradaki onerilen paket:
- HARDENING-07B - Search BFF Smoke + Candidate Boundary Hardening
