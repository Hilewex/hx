# HARDENING-07B — Search BFF Smoke + Candidate Boundary Hardening Closure Report

## 1. Kısa Özet
- Paket amacı: BFF `GET /search` route'unu gerçek smoke coverage'a almak, `smoke:search` SKIPPED durumunu kaldırmak ve search candidate boundary kurallarını doğrulamak.
- Yapılan implementation: BFF search query/mode/surface/limit canonical normalize edildi; invalid mode safe default olarak `GLOBAL` yapıldı; `searchSmoke` gerçek HTTP assertion setine çevrildi.
- Yapılmayanlar: Search index sync, OpenSearch owner event/outbox consumer, ranking/recommendation, PLP grid merge, dynamic facets, catalog/product write owner, pricing/stock/media truth üretimi yapılmadı.
- Nihai karar: PASS WITH LIMITATION.

## 2. Referans Dosyalar
| Dosya | Durum | Not |
|---|---|---|
| `HARDENING-07A2-PDP-PLP-READ-HARDENING-SMOKE-CLOSURE-REPORT.md` | FOUND | PDP/PLP read hardening ve search limitation üstünden ilerlenildi. |
| `HARDENING-07A1-CATALOG-READ-PROJECTION-FOUNDATION-CLOSURE-REPORT.md` | FOUND | Catalog read projection boundary referansı korundu. |
| `HARDENING-07-00B-SEARCH-INDEX-SYNC-INVENTORY.md` | FOUND | Search candidate foundation ve skipped smoke riski ana girdi olarak kullanıldı. |
| `HARDENING-07-00A-CATALOG-PDP-PLP-READ-INVENTORY.md` | FOUND | Search/PDP/PLP handoff sınırı kontrol edildi. |
| `HARDENING-06-FINAL-CLOSURE-REPORT.md` | FOUND | catalog/search skipped limitation geçmişi dikkate alındı. |
| `planlama/12- Arama Sistemi.md` | FOUND | Search intent/candidate/yüzey modu referansı. |
| `planlama/10-kategori-plp sistemi.md` | FOUND | PLP seçim yüzeyi ve search merge sınırı referansı. |
| `planlama/4-pdp sistemi.md` | FOUND | PDP karar alanı sınırı referansı. |
| `planlama/8-klasik ürün kart sistemi.md` | FOUND | Product card PDP truth'una sarkmama referansı. |
| `planlama/7-keşfet sistemi.md` | FOUND | DISCOVER search'in feed/ranking owner olmaması referansı. |
| `planlama/25-kural -yetki sistemi.md` | FOUND | BFF read-only aggregation ve owner dışı write yok ilkeleri. |
| `planlama/62-MASTER_IMPLEMENTATION_PLAN.md` | FOUND | Search M9 candidate, Ranking M8 owner ayrımı korundu. |

## 3. Değişen Dosyalar
| Dosya | Değişiklik | Gerekçe |
|---|---|---|
| `apps/bff/src/server/search.ts` | `mode`, `surface`, `limit` canonical normalize edildi; invalid mode `GLOBAL` default ve warning ile döner hale geldi. | BFF truth üretmeden güvenli request normalization sağlamak. |
| `tests/smoke/suites/others.ts` | `searchSmoke` SKIPPED olmaktan çıkarıldı; BFF `/search` için success, empty query, mode, boundary ve leak assertion'ları eklendi. | `smoke:search` gerçek acceptance kanıtı üretmeli. |
| `apps/bff/dist/*`, `services/search/dist/*`, `packages/contracts/dist/*` | Root build çıktıları güncellendi. | Repo build output tutuyor; root build sonucu. |
| `tests/smoke/durability-context.json` | `smoke:all` core-commerce phase context'i güncellendi. | Smoke runner runtime artefact'i. |
| `HARDENING-07B-SEARCH-BFF-SMOKE-CANDIDATE-BOUNDARY-CLOSURE-REPORT.md` | Bu kapanış raporu eklendi. | Paket kanıt ve limitation kaydı. |

## 4. Search BFF Route Sonucu
- `/search` `apps/bff/src/server/search.ts` üzerinden `@hx/search.searchCandidates` servisine delegate ediyor.
- Query normalization: `q` öncelikli, yoksa `query`; `mode` uppercase canonical validation; `surface` canonical validation; `storefrontId`, `categoryId`; `limit` pozitif sayı olarak normalize, maksimum 50.
- Invalid mode sonucu: safe default `GLOBAL`; response warning `SEARCH_MODE_DEFAULTED_TO_GLOBAL`.
- Invalid surface sonucu: surface ignore edilir; response warning `SEARCH_SURFACE_IGNORED_INVALID`.
- Invalid limit sonucu: safe default 20; response warning `SEARCH_LIMIT_DEFAULTED_INVALID`.
- BFF truth üretimi var mı? Hayır. BFF yalnızca parametre normalize eder ve search service response'una warning ekler; product/catalog/ranking truth üretmez.

## 5. Candidate Boundary Sonucu
- `searchTruth:false` sonucu: GLOBAL, CATALOG, DISCOVER, STOREFRONT smoke assertion'larında tüm candidate'lar için doğrulandı.
- `productTruthMutated:false` sonucu: Product candidate'larda doğrulandı.
- `rankingFinal:false` sonucu: Tüm candidate tiplerinde doğrulandı.
- `scoreFoundationOnly` / ranking boundary sonucu: Candidate score alanı yalnız `scoreFoundationOnly` olarak doğrulandı; final ranking olarak sunulmadı.
- Category candidate boundary sonucu: `taxonomyTruthMutated:false` assertion'ı eklendi.
- Storefront candidate boundary sonucu: `storefrontTruthMutated:false` assertion'ı eklendi.
- Response warning sonucu: `SEARCH_INDEX_IS_PROJECTION_NOT_TRUTH` ve `M8_RANKING_NOT_IN_SCOPE` smoke ile doğrulandı.

## 6. Visibility / Leak Kontrolü
- Hidden product candidate dönüyor mu? Hayır. `p_hidden` leak etmedi.
- Unavailable product candidate dönüyor mu? Hayır. `p_unavailable` leak etmedi.
- Suspended/archived candidate smoke block list'e alındı; mevcut search candidate seed içinde leak yok.
- Search PDP/PLP truth yerine geçiyor mu? Hayır. Search yalnız candidate/productId döndürür; PDP read catalog/PDP route üzerinden kalır, PLP grid merge yapılmadı.

## 7. Mode Davranışı
### GLOBAL
- Candidate davranışı: `q=product` aktif product candidate döndürür.
- Boundary flag sonucu: `searchTruth:false`, `productTruthMutated:false`, `rankingFinal:false`.
- Ranking/feed/product truth riski: Final ranking yok; index projection warning var.

### CATALOG
- Candidate davranışı: Product/category candidate yüzeyi olarak kalır; PLP grid üretmez.
- Boundary flag sonucu: Candidate boundary flag'leri false doğrulandı.
- Ranking/feed/product truth riski: `rankingFinal:false`; PLP grid merge yapılmadı.

### DISCOVER
- Candidate davranışı: `mode=DISCOVER` video product candidate sınırında kaldı.
- Boundary flag sonucu: Product boundary flag'leri false doğrulandı.
- Ranking/feed/product truth riski: Feed/ranking truth üretmedi; non-video/feed object smoke'ta fail koşulu yapıldı.

### STOREFRONT
- Candidate davranışı: `storefrontId=s_1` scope'u korunarak yalnız ilgili storefront product candidate döndü.
- Boundary flag sonucu: `productTruthMutated:false`, `rankingFinal:false`, `searchTruth:false`.
- Ranking/feed/product truth riski: Storefront truth owner olunmadı; `STOREFRONT_SEARCH_CONTEXT_FOUNDATION_LIMITED` warning doğrulandı.

## 8. Search / PDP / PLP Boundary
- Search candidate PDP truth üretti mi? Hayır.
- Search candidate PLP grid truth üretti mi? Hayır.
- PLP/search merge bu pakete girdi mi? Hayır.
- Index sync bu pakete girdi mi? Hayır.
- Search candidate productId verebilir; PDP truth halen `/catalog/pdp/:productId` route ve catalog read projection üzerinden okunur.

## 9. Smoke/Test Sonuçları
| Komut/Senaryo | Sonuç | Not |
|---|---|---|
| `pnpm --filter @hx/bff run typecheck` | PASS | Targeted BFF typecheck. |
| `pnpm --filter @hx/search run typecheck` | PASS | Targeted search typecheck. |
| `pnpm --filter @hx/contracts run typecheck` | PASS | Targeted contracts typecheck. |
| `pnpm run typecheck` | PASS | Root typecheck geçti. |
| `pnpm run build` | PASS | Root build geçti. |
| BFF boot | PASS WITH NOTE | 3001'de eski BFF node process PID 10312 bulundu ve sonlandırıldı; yeni BFF 3001'de node PID 836 ile başladı. Parent PowerShell PID 26968. |
| `pnpm run smoke:health` | PASS | `SMOKE_BFF_BASE_URL=http://localhost:3001`. |
| `pnpm run smoke:catalog` | PASS | PDP/PLP boundary regression geçildi. |
| `pnpm run smoke:catalog-read` | PASS | Catalog read projection boundary regression geçildi. |
| `pnpm run smoke:search` | PASS | Search BFF candidate boundaries verified; SKIPPED değil. |
| `pnpm run smoke:all` | PASS | Tüm registry suite'leri PASS; search dahil SKIPPED yok. |
| `/search?q=product&mode=GLOBAL` | PASS | Active candidate ve boundary flags doğrulandı. |
| `/search?mode=GLOBAL` | PASS | Missing query canonical `QUERY_REQUIRED`. |
| `/search?q=%20%20&mode=GLOBAL` | PASS | Empty query canonical `QUERY_REQUIRED`. |
| `/search?q=product&mode=INVALID&limit=bad` | PASS | Safe default `GLOBAL`, invalid mode/limit warnings. |
| `/search?q=product&mode=CATALOG` | PASS | `rankingFinal:false`; PLP grid truth yok. |
| `/search?q=video&mode=DISCOVER` | PASS | Video product candidate; feed/ranking truth yok. |
| `/search?q=product&mode=STOREFRONT&storefrontId=s_1` | PASS | Storefront scope korunur. |
| Hidden/unavailable query leak | PASS | `p_hidden` / `p_unavailable` candidate dönmedi. |

## 10. Kalan Limitation'lar
- Index sync 07C'ye kaldı.
- OpenSearch owner event/outbox sync yok.
- Ranking/recommendation yok.
- Dynamic facets yok.
- Autocomplete/suggestions advanced yok.
- Category/storefront indexed candidate expansion ileri pakete kaldı.
- Pricing/stock/media projection sync yok.
- Search memory/OpenSearch projection foundation; source truth yerine geçmez.

## 11. Boundary Review
- Search catalog/product truth owner oldu mu? Hayır.
- Search ranking owner oldu mu? Hayır.
- Search price/stock/media truth owner oldu mu? Hayır.
- Search index truth yerine geçti mi? Hayır.
- BFF truth owner oldu mu? Hayır.
- Hidden/unavailable visibility korundu mu? Evet.
- PDP/PLP read hardening bozuldu mu? Hayır; `smoke:catalog` ve `smoke:catalog-read` PASS.

## 12. Nihai Karar
Karar:
- PASS WITH LIMITATION

Gerekçe:
- `pnpm run typecheck`: PASS.
- `pnpm run build`: PASS.
- BFF boot: PASS, port 3001.
- `pnpm run smoke:search`: PASS ve artık SKIPPED değil.
- Candidate boundary flags doğru.
- Hidden/unavailable candidate leak etmiyor.
- Search ranking owner olmuyor.
- Search catalog/product truth owner olmuyor.
- PDP/PLP truth search'e taşınmıyor.
- Limitation: Index sync/OpenSearch event-outbox sync/dynamic facets/ranking/pricing-stock-media production readiness borçları ileri pakete kaldı.

Sıradaki önerilen paket:
- HARDENING-07C — Search Index Sync Projection Foundation
