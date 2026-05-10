# PHASE-07-SOURCE-REVIEW — Search / Catalog / Ranking / Taxonomy Report

## 1. Amaç
Bu rapor, PHASE-07 kapsamında search, catalog, ranking, recommendation, taxonomy, PLP, PDP read projection, index projection ve filtre/facet yüzeylerinin mevcut source durumunu, sistem dosyalarıyla uyumunu, boundary risklerini ve smoke/test envanterini değerlendirmek için hazırlanmıştır.

## 2. Başlangıç Durumu
* PHASE-01: PASS WITH LIMITATION
* PHASE-02: PASS WITH LIMITATION
* PHASE-03: PASS WITH LIMITATION
* PHASE-04: PASS WITH LIMITATION
* PHASE-05: PASS WITH LIMITATION
* PHASE-06: PASS WITH LIMITATION
* **PHASE-07: SOURCE REVIEW**

## 3. Okunan Sistem / Planlama Dosyaları

| Dosya | Durum | Ana Kurallar |
| :--- | :--- | :--- |
| `12- Arama Sistemi.md` | FOUND | Arama owner intent ve candidate üretir, UI/BFF truth üretmez. |
| `51-arama indeksleme sistemi.md` | FOUND | Index projection stale olabilir, owner truth mutate etmemelidir. |
| `10-kategori-plp sistemi.md` | FOUND | Taxonomy owner category tree sahibidir, PLP product eligibility guard’a uymalıdır. |
| `52-kategori taksonomi sistemi.md` | FOUND | Taxonomy truth BFF/UI içinde dağınık olmamalıdır. |
| `37-öneri ve sıralama sistemi.md` | FOUND | Ranking owner final ordering sahibidir. |
| `7-keşfet sistemi.md` | FOUND | Keşfet feed discovery ve ranking sınırlarına uygun beslenmelidir. |
| `9-ana sayfa sistemi.md` | FOUND | Ana sayfa blokları ranking owner’dan beslenmelidir. |
| `8-klasik ürün kart sistemi.md` | FOUND | Product card projection stale fiyat/stok sızdırmamalıdır. |
| `4-pdp sistemi.md` | FOUND | PDP projection commerce truth değildir. Hidden/unavailable ürünleri public yüzeye sızdırmaz. |
| `27-merkezi stok sistemi.md` | FOUND | Stock owner truth snapshot olarak sync olmalıdır. |
| `29-merkezi fiyat sistemi.md` | FOUND | Pricing owner truth snapshot olarak sync olmalıdır. |
| `50-medya asset sistemi.md` | FOUND | Media projection publishable media sync kurallarına uymalıdır. |
| `1-havuz sistemi.md` | FOUND | Pool ürün snapshot'ı projection katmanına akar. |
| `25-kural-yetki sistemi.md` | FOUND | Search read permission public olabilir. |
| `PHASE-07 readiness dosyası` | FOUND | Search intent/candidate, OpenSearch Ops sınırları ve ranking isolation esas alınır. |

## 4. Genel Sonuç Özeti

| Alan | Sonuç | Not |
| :--- | :--- | :--- |
| Search owner / candidate | PASS WITH LIMITATION | M9 search candidate var. In-memory / OpenSearch fallback destekli. Index worker deferred. |
| Ranking / recommendation | PASS WITH LIMITATION | `ranking` domain skeleton var, henüz advanced/final ranker deferred, commerce mutate etmiyor. |
| Catalog / PDP projection | PASS | `catalog` paketi var, projection explicitly "truth: false" işaretli, hidden/unavailable filtresi başarılı. |
| Category / PLP / Taxonomy | PASS | `category` paketi taxonomy tutuyor. BFF merge var. `taxonomyTruth: false` garantisi korunuyor. |
| Pricing/Stock/Media sync | PASS WITH LIMITATION | Contracts snapshot fields barındırıyor, outbox sync handler later phase'e bırakılmış. |
| OpenSearch / Index ops | PASS WITH LIMITATION | OpenSearch adapter mevcut ama production deployment deferred. |
| BFF / UI / Panel boundary | PASS | BFF DB'ye gitmiyor, sadece adapter ve service call yapıyor. |
| Smoke/test inventory | PASS | Catalog read, search ve projection testleri package.json'da tanımlı. |
| PHASE-06 limitation impact | PASS WITH LIMITATION | Social discovery ranking sonraki faza devredilebilir. |

## 5. Kanıtlı Bulgular

| No | Alan | Dosya | Fonksiyon / Model | Bulgu | Risk | Karar |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Search Candidate | `services/search/src/search.ts` | `searchCandidates` | Query bazlı document return ediyor, `searchIndexTruth: false`, `productTruthMutated: false` return ediyor. | Düşük | PASS |
| 2 | Catalog Projection | `services/catalog/src/catalog.ts` | `getCatalogProductProjection` | `publicReadable` ve status check (`ACTIVE`/`HIDDEN`/`UNAVAILABLE`) yapıp read projection sunuyor. Truth mutate etmiyor. | Düşük | PASS |
| 3 | Taxonomy & PLP | `services/category/src/category.ts` | `getPlp` | Category listing taxonomy'ye bağlı ve taxonomy truth claim'i yok. PLP, searchCandidates'e fallback yapabiliyor. | Düşük | PASS |
| 4 | OpenSearch Adapter | `services/search/src/opensearch.ts` | `OpenSearchFoundationClient` | OpenSearch client var ama default config memory'de. | Orta | PASS WITH LIMITATION |
| 5 | BFF Boundary | `apps/bff/src/server/index.ts` | Routing switch case'leri | BFF persistence kütüphanesini kullanmıyor, `searchCandidates` ve `getCatalogProductProjection` fonksiyonlarına paslıyor. | Düşük | PASS |
| 6 | Ranking Boundary | `services/ranking/src/index.ts` | Skeleton | `ranking` module oluşturulmuş ama implementasyon boş. BFF de sıralama yapmıyor. Sınır delinmemiş. | Orta | PASS WITH LIMITATION |

## 6. Boundary İhlalleri / Gap Listesi

| Kod | Gap / Risk | Etki | Karar | Önerilen Sonraki Paket |
| :--- | :--- | :--- | :--- | :--- |
| GAP-07-01 | Index Sync Outbox Consumer Yok | Arama index'i asenkron güncellenmiyor. | LIMITATION | PHASE-09 veya Outbox Worker |
| GAP-07-02 | Advanced Ranking Algorithm Eksikliği | Sadece Foundation-score çalışıyor. | LIMITATION | PHASE-10 veya Analytics Integration |
| GAP-07-03 | OpenSearch Production Lifecycle Ops | Production'da deployment strategy eksik. | LIMITATION | PHASE-12 Deployment Ops |

## 7. Smoke / Test Envanteri

| Smoke / Test | Durum | Script | Not |
| :--- | :--- | :--- | :--- |
| catalog-read | FOUND | `pnpm run smoke:catalog-read` | Hazır |
| search | FOUND | `pnpm run smoke:search` | Hazır |
| search-index-projection | FOUND | `pnpm run smoke:search-index-projection` | Hazır |
| plp / category | FOUND | - | `catalog-read` ve `search` cover ediyor. |
| media projection | FOUND | `pnpm run smoke:media` | Hazır |

*(Komutlar repo genelinde pnpm script olarak kayıtlıdır.)*

## 8. PHASE-06 Limitation Etkisi

| Limitation | PHASE-07 etkisi | Karar |
| :--- | :--- | :--- |
| Advanced story feed/ranking/discovery engine yok | Product arama limitlenmiyor, sadece feed quality sınırlı. | DEFER (PHASE-10/12) |
| Social counter durable projection yok | Search indexing bozulmuyor. | DEFER |
| Interaction/follow durable DB uniqueness yok | Ranking owner boundary'sini ihlal etmiyor. | DEFER |
| Story durable projection sınırlı | Arama sonucu document projection'u etkilemiyor. | DEFER |

## 9. PHASE-07 Source Review Kararı

**PHASE-07 Source Review Kararı:**
- **PASS WITH LIMITATION**

**Gerekçe:**
- Search/candidate, ranking, catalog, taxonomy boundary’leri API ve struct seviyesinde güvenli.
- `searchIndexTruth: false`, `catalogReadTruth: false` ayrımları enforce edilmiş.
- BFF truth owner olarak davranmıyor, repository ihlali yok.
- Hidden/unavailable ürün leak'ine karşı `services/catalog` visibility guard'lara sahip.
- OpenSearch adapter hazır ancak production ops deployment'a bağlı (Limitation).
- Asenkron index syncing deferred status'te (Limitation).

## 10. Sonraki Adım Önerisi

**PHASE-07-CLOSURE** fazı başlatılabilir veya domain hardening register kapatılabilir. Öncelik, UI ve Panel read-projection bağlantılarında (PHASE-08 ve PHASE-10) bu search candidate ve catalog read interface'lerinin kullanılmasını sağlamaktır. Index worker senkronizasyon gereksinimleri PHASE-09/12 kapsamına devredilmelidir.