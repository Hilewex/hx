# HARDENING-07A1 — Catalog Read Projection Foundation Closure Report

## 1. Kısa Özet
- Paket amacı: Catalog/Product public read projection foundation kurmak ve PDP/PLP'nin BFF mock/static truth yerine ileride güvenli projection kaynağına geçebilmesini sağlamak.
- Yapılan implementation: `@hx/catalog` servisi eklendi; product/variant/status/visibility read projection modelleri contract'a eklendi; BFF PDP ve yeni catalog read/card endpointleri catalog projection servisine delegate edildi; `smoke:catalog-read` eklendi.
- Yapılmayanlar: Search/index sync, OpenSearch, ranking/recommendation, pricing engine, stock reservation, media provider/CDN hardening, product write lifecycle refactor ve full PDP/PLP refactor yapılmadı.
- Nihai karar: PASS WITH LIMITATION.

## 2. Referans Dosyalar
| Dosya | Durum | Not |
|---|---|---|
| `HARDENING-07-00A-CATALOG-PDP-PLP-READ-INVENTORY.md` | FOUND | PDP BFF mock truth ve PLP static projection riski ana girdi olarak kullanıldı. |
| `HARDENING-07-00B-SEARCH-INDEX-SYNC-INVENTORY.md` | FOUND | Search/index'in catalog truth yerine geçmemesi sınırı korundu. |
| `HARDENING-06-FINAL-CLOSURE-REPORT.md` | FOUND | Catalog/search smoke skipped limitation dikkate alındı. |
| `planlama/4-pdp sistemi.md` | FOUND | PDP store-context ve product decision boundary referansı. |
| `planlama/10-kategori-plp sistemi.md` | FOUND | PLP'nin seçim yüzeyi olarak kalması referansı. |
| `planlama/8-klasik ürün kart sistemi.md` | FOUND | Product card'ın PDP'ye sarkmama ve projection kalma kuralı. |
| `planlama/26-varyant sistemi.md` | FOUND | Variant stock/price owner sınırı referansı. |
| `planlama/50-medya sistemş asset  sitemi.md` | FOUND | Media truth owner sınırı referansı. |
| `planlama/25-kural -yetki sistemi.md` | FOUND | BFF/UI truth üretmeme ve owner boundary ilkeleri. |
| `planlama/62-MASTER_IMPLEMENTATION_PLAN.md` | FOUND | Paket 8 Catalog/PDP, Paket 19 Search ve Paket 20 Ranking ayrımı korundu. |

## 3. Değişen Dosyalar
| Dosya | Değişiklik | Gerekçe |
|---|---|---|
| `packages/contracts/src/catalog.ts` | Catalog read projection, card projection, variant availability ve boundary flag tipleri eklendi. | Projection truth sınırını contract seviyesinde görünür yapmak. |
| `services/catalog/package.json` | Yeni `@hx/catalog` paketi eklendi. | Minimal catalog read projection service foundation. |
| `services/catalog/tsconfig.json` | Service TS build/typecheck konfigürasyonu eklendi. | Workspace standardına uymak. |
| `services/catalog/src/index.ts` | Public export eklendi. | Public package boundary. |
| `services/catalog/src/catalog.ts` | `getCatalogProduct`, `listCatalogProducts`, `getCatalogProductProjection`, `listPublicCatalogProductCards` ve mapping helper'ları eklendi. | Catalog public read projection üretmek. |
| `apps/bff/package.json` | `@hx/catalog` dependency eklendi. | BFF'in catalog projection service'e delegate etmesi. |
| `apps/bff/src/server/catalog.ts` | BFF içi `MOCK_PRODUCTS` / `MOCK_STOREFRONTS` kaldırıldı; catalog projection service delegation eklendi. | BFF truth owner davranışını azaltmak. |
| `apps/bff/src/server/index.ts` | `/catalog/product/:productId` ve `/catalog/product-cards` read route'ları bağlandı. | Smoke ve foundation read surface kanıtı. |
| `tests/smoke/suites/catalog-read.ts` | Targeted catalog read smoke eklendi. | Visibility ve boundary doğrulaması. |
| `tests/smoke/run-smoke.ts` | `catalog-read` suite registry'ye eklendi. | Smoke runner entegrasyonu. |
| `package.json` | `smoke:catalog-read` script'i eklendi. | Hedefli smoke komutu. |
| `pnpm-lock.yaml` | Workspace dependency graph güncellendi. | Yeni `@hx/catalog` dependency/symlink çözümü. |
| `packages/contracts/dist/*`, `services/catalog/dist/*` | Build çıktıları güncellendi/oluştu. | Repo mevcut dist çıktısı tuttuğu için build sonucu. |

## 4. Catalog Read Projection Sonucu
- Yeni service: `@hx/catalog`.
- Oluşan fonksiyonlar: `getCatalogProduct`, `listCatalogProducts`, `getCatalogProductProjection`, `listPublicCatalogProductCards`.
- Mapping helper'ları: `mapCommercialProductToCatalogStatus`, `mapCreatorStoreProductToCatalogVisibility`, `mapVariantAvailability`.
- Product/status/visibility sonucu:
  - `ACTIVE` + `VISIBLE` + `publicReadable:true` ürün public read/list'e çıkar.
  - `HIDDEN` public read'de 404 davranışı verir.
  - `UNAVAILABLE` PDP/read'de 410 `PRODUCT_GONE` davranışı verir.
  - Suspended/archived foundation projection'ları public card listesine çıkmaz.
- Pool/commercial source ilişkisi: service pool contract tiplerine göre mapper standardı kurdu; bu pakette pool write store'una direct erişim veya lifecycle mutation yapılmadı.
- Projection truth boundary: `catalogReadTruth:false`, `productTruthMutated:false`, `priceTruth:false`, `stockTruth:false`, `mediaTruth:false`, `searchIndexTruth:false`.

## 5. Price / Stock / Media Boundary
- Price truth pricing owner'dadır; catalog projection price üretmedi ve PDP response'a `price` koymadı.
- Stock truth stock owner'dadır; catalog projection stock üretmedi ve PDP response'a `stock` koymadı.
- Media truth media owner'dadır; catalog yalnız media reference snapshot taşıdı ve `mediaTruth:false` bayrağı verdi.
- Catalog/BFF price/stock/media truth üretmedi; sadece boundary flag ve foundation projection warning'leri döndü.

## 6. BFF Boundary
- BFF mock truth azaltıldı: `apps/bff/src/server/catalog.ts` içindeki `MOCK_PRODUCTS` / `MOCK_STOREFRONTS` kaldırıldı.
- BFF PDP read artık `@hx/catalog.getCatalogProductProjection` ve `getStorefrontContext` üzerinden delegate ediyor.
- Kalan mock/static borç: full PDP response aggregation ve PLP static product card cleanup 07A2'ye kaldı. `services/category` static PLP projection bu pakette büyük refactor kapsamına alınmadı.

## 7. Smoke/Test Sonuçları
| Komut/Senaryo | Sonuç | Not |
|---|---|---|
| `pnpm --filter @hx/catalog run typecheck` | FAIL sonra PASS | İlk deneme contracts dist stale olduğu için fail verdi; `@hx/contracts` build sonrası PASS. |
| `pnpm --filter @hx/contracts run build` | PASS | Yeni contract tipleri dist'e işlendi. |
| `pnpm install` | PASS | `@hx/catalog` workspace dependency link'i oluşturuldu. |
| `pnpm run typecheck` | PASS | Root typecheck geçti. |
| `pnpm run build` | PASS | Root build geçti. |
| BFF start | PASS WITH NOTE | 3001 doluydu; 3003 üzerinde yeni BFF başlatıldı. |
| `pnpm run smoke:health` | PASS | `SMOKE_BFF_BASE_URL=http://localhost:3003`. |
| `pnpm run smoke:catalog-read` | PASS | Catalog read projection boundaries verified. |
| `pnpm run smoke:catalog` | SKIPPED | Mevcut suite hâlâ not implemented; 07A2 borcu. |
| `pnpm run smoke:all` | PASS WITH SKIPPED | Implemented suite'ler PASS; `catalog` ve `search` SKIPPED, `catalog-read` PASS. |
| Active product catalog read | PASS | `/catalog/product/p_valid` success; boundary flags doğrulandı. |
| Hidden product public read | PASS | `/catalog/product/p_hidden` 404. |
| Unavailable PDP/read | PASS | `/catalog/pdp/p_unavailable?storefrontId=s_feno_1` 410. |
| Suspended/archived public list exclusion | PASS | `/catalog/product-cards?categoryId=c_1` içinde leak yok. |
| Product card boundary | PASS | `cardTruth:false`, `searchIndexTruth:false`, price/stock/media boundary flags doğrulandı. |

## 8. Kalan Limitation’lar
- PDP full refactor 07A2'ye kaldı.
- PLP static projection cleanup ve category service'in catalog read projection'a bağlanması 07A2'ye kaldı.
- Search/index sync 07B/07C hattına kaldı.
- Ranking/recommendation yok; M8 owner dışarıda.
- Pricing/stock/media advanced engine yok; owner truth catalog'a taşınmadı.
- Catalog/product write owner hâlâ yok; bu paket yalnız public/read projection foundation'dır.
- `smoke:catalog` ve `smoke:search` mevcut skipped durumunu koruyor; hedefli kanıt `smoke:catalog-read` ile alındı.

## 9. Boundary Review
- Catalog read write owner oldu mu? Hayır. Write lifecycle mutation yok.
- BFF truth owner oldu mu? Hayır. BFF catalog read service'e delegate ediyor.
- Search/index truth yerine geçti mi? Hayır. Catalog projection `searchIndexTruth:false` taşır; index sync yapılmadı.
- Pricing/stock/media truth catalog'a taşındı mı? Hayır. Truth owner sınırları flag ve warning'lerle korundu.
- Hidden/unavailable/suspended/archived visibility korunuyor mu? Evet. Smoke ile 404/410/list exclusion doğrulandı.

## 10. Nihai Karar
Karar:
- PASS WITH LIMITATION

Gerekçe:
- `pnpm run typecheck`: PASS.
- `pnpm run build`: PASS.
- `pnpm run smoke:catalog-read`: PASS.
- Catalog read projection foundation çalışıyor.
- Hidden/unavailable/suspended/archived visibility korunuyor.
- BFF truth owner olmuyor.
- Price/stock/media truth catalog'a taşınmıyor.
- Limitation: PDP/PLP full read hardening ve legacy `smoke:catalog` implementation 07A2'ye kaldı.

Sıradaki önerilen paket:
- HARDENING-07A2 — PDP / PLP Read Hardening & Smoke
