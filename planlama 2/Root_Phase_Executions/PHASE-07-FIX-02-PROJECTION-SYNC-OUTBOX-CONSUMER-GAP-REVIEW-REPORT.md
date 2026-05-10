# PHASE-07-FIX-02 — Projection Sync / Outbox Consumer Gap Review Report

## 1. Görev Bilgisi
- Görev adı: PHASE-07-FIX-02-REPORT-REVISION — Decision Correction / Deferred Item Clarification
- Görev tipi: Source Review / Gap Review
- Kod değişikliği yapıldı mı?: Hayır
- Nihai karar: PARTIAL

## 2. Amaç
Bu görev, catalog, search, PLP, PDP ve product card yüzeylerindeki fiyat, stok ve medya verilerinin projection senkronizasyonunu, outbox/event consumer varlığını ve buralardaki olası stale data ile invalid media leak risklerini incelemeyi amaçlamıştır. Sistem boundary'lerinin fiyat/stok/medya gibi verilerde kendi truth'unu üretip üretmediği kontrol edilmiştir.

## 3. Kullanılan Referans Dosyaları
- 63-IMPLEMENTATION_PROGRESS_MASTER_BIRLESTIRILMIS.md
- 64-PACKAGE_EXECUTION_LOG_BIRLESTIRILMIS.md
- 65-ACTIVE_RISKS_AND_DECISIONS-CONSOLIDATED.md
- 67-ROADMAP_ALIGNMENT_AND_PACKAGE_NUMBERING.md
- 00-PRODUCTION_READINESS_WORKING_RULES.md
- 01-SYSTEM_TO_IMPLEMENTATION_MAPPING.md
- 02-CURRENT_STATE_BASELINE.md
- 03-PRODUCTION_READINESS_PHASE_MASTER_PLAN.md
- 04-PRODUCTION_READINESS_RISK_REGISTER.md
- PHASE-06-CLOSURE-REPORT.md
- PHASE-07-START-CONTEXT-HANDOFF-REPORT.md
- PHASE-07-SOURCE-REVIEW-SEARCH-CATALOG-RANKING-TAXONOMY-REPORT.md
- PHASE-07-SOURCE-REVIEW-ADDENDUM-EVIDENCE-SMOKE-REPORT.md
- PHASE-07-FIX-00-SEARCH-CATALOG-SMOKE-RUNTIME-RECOVERY-REPORT.md
- PHASE-07-FIX-01-CATEGORY-TAXONOMY-PLP-SMOKE-COVERAGE-REPORT.md

Sistem Dosyaları:
- 1-havuz sistemi.md, 4-pdp sistemi.md, 7-keşfet sistemi.md, 8-klasik ürün kart sistemi.md, 9-ana sayfa sistemi.md, 10-kategori-plp sistemi.md, 12- Arama Sistemi.md, 25-kural -yetki sistemi.md, 27-merkezi stok sistemi.md, 29-merkezi fiyat sistemi.md, 37-öneri ve sıralama sistemi.md, 50-medya asset sistemi.md, 51-arama indeksleme sistemi.md, 52-kategori taksonomi sistemi.md

## 4. İncelenen Repo Alanları
- `services/catalog`
- `services/search`
- `services/ranking`
- `services/pricing`
- `services/stock`
- `services/media`
- `services/category`
- `services/taxonomy`
- `packages/contracts/src/`
- `apps/bff/src/server/`
- `tests/smoke/suites/`

## 5. Sistem Beklentisi Özeti
- **Fiyat:** Truth sadece merkezi fiyat sistemindedir.
- **Stok:** Truth sadece merkezi stok sistemindedir.
- **Medya:** Truth sadece medya asset sistemindedir.
- **Search/Index:** Sadece aday üretimi yapar, projection katmanıdır, truth oluşturmaz.
- **Ranking:** Sadece finale sıralama yapar, commerce verisini mutate etmez.
- **Public Yüzeyler:** Gizli, tükenmiş, onaylanmamış veriler sızmamalı, stale veri gösterilmemelidir.
- **BFF/UI/Panel:** Truth üretmez veya direct write yapmaz. Projection döndürür.

## 6. Pricing Projection Sync İncelemesi
- **Beklenti:** Catalog/search/PLP fiyat bilgisini merkezi pricing'den sync/event ile almalıdır.
- **Bulunan mevcut durum:** Fiyatlar in-memory foundation mock datası üzerinden gelmektedir (`services/catalog/src/catalog.ts` ve `services/search/src/search.ts` içindeki `priceTruth: false`). Event tabanlı gerçek bir sync (consumer) bulunmamaktadır.
- **Kanıt dosya/fonksiyon:** `services/catalog/src/catalog.ts` içerisindeki seed datalar.
- **Gap:** Merkezi sistemden outbox üzerinden güncel fiyat tüketen bir consumer mekanizması yok.
- **Risk:** Canlıda veya testte stale price oluşması ve müşteriye eski fiyat gösterilmesi.
- **Karar:** PARTIAL (Boundary korunmuş ancak mekanizma eksik).

## 7. Stock Projection Sync İncelemesi
- **Beklenti:** Catalog/search/PLP stok bilgisini merkezi stok'tan almalı, "out of stock" ayrımını güncel olarak yapmalıdır.
- **Bulunan mevcut durum:** In-memory seed üzerinden stok yönetilmektedir (`stockTruth: false`). Gerçek bir stock consumer / Kafka/RabbitMQ implementation'ı yoktur.
- **Kanıt dosya/fonksiyon:** `services/catalog/src/catalog.ts`, `tests/smoke/suites/search-index-projection.ts`.
- **Gap:** Stock değiştiğinde bunu projection'a yansıtacak event consumer bulunmamaktadır.
- **Risk:** Ürün tükendiği halde PLP'de veya arama sonuçlarında satılabilir olarak görünmesi (stale stock leak).
- **Karar:** PARTIAL.

## 8. Media Projection Sync İncelemesi
- **Beklenti:** Yalnızca "processed/approved" medyalar public yüzeye çıkmalı, media değişikliğinde projection güncellenmelidir.
- **Bulunan mevcut durum:** Seed data içerisindeki hardcoded url'ler (`http://img.com/...`) dönülmekte (`mediaTruth: false`). Pending/rejected ayrımı yapacak dinamik event flow'u projection bazında yoktur.
- **Kanıt dosya/fonksiyon:** `services/catalog/src/catalog.ts` (ör: `mediaId: 'm_1'`).
- **Gap:** Medya onaylandığında / engellendiğinde ürünü search index'ten veya catalog'dan anlık güncelleyecek consumer yok.
- **Risk:** Onaysız / reddedilmiş medyanın sızma ihtimali veya onaylanan medyanın yansımaması.
- **Karar:** PARTIAL.

## 9. Outbox / Event Consumer İncelemesi
- **Beklenti:** Pricing, stock, media güncellemeleri için outbox tabanlı consumer mimarisi olması.
- **Bulunan mevcut durum:** Contracts içerisinde outbox boundary guard property'leri (`outboxDeliveryGuaranteed: false`, `eventTruthMutated: false` vb.) bulunmakta ancak gerçek event stream implementation'ı veya handler fonksiyonları mevcut değildir.
- **Kanıt dosya/fonksiyon:** `packages/contracts/src/provider.ts` ve `apps/bff/src/server/analytics.ts` içerisinde sadece boolean field'lar kullanılmıştır. Kafka/RabbitMQ vb. consumer logiği yoktur.
- **Gap:** Sistemler arası asenkron veri güncel tutma altyapısı kurulmamış.
- **Risk:** Servisler birbirinden kopuk kalabilir, gerçek ortamda production verisi tutarsız olur.
- **Karar:** PARTIAL.

## 10. Search / Index Boundary İncelemesi
- **Beklenti:** Arama indeksi sadece projection kullanmalı, arama kendi "product truth"unu üretmemelidir.
- **Bulunan mevcut durum:** `searchIndexTruth: false`, `productTruthMutated: false` vb. bayraklar ile boundary sıkı şekilde işaretlenmiş. OpenSearch mimarisi memory wrapper ile simüle edilmektedir.
- **Kanıt dosya/fonksiyon:** `services/search/src/document.ts` ve `tests/smoke/suites/search-index-projection.ts`.
- **Gap:** Yok (Boundary beklentisi olarak).
- **Risk:** İleri seviye bir risk yok, koruma başarılı.
- **Karar:** PASS.

## 11. Ranking / Recommendation Etkisi
- **Beklenti:** Ranking sadece public result kümesini sıralamalı, asıl commerce verisini mutate etmemeli.
- **Bulunan mevcut durum:** Arama ve indeksleme sırasında `rankingFinal: false` bayrağı ile korunmaktadır. Ayrı bir ranking service devrede değildir, in-memory foundation üzerinden hardcoded score dönülmektedir.
- **Kanıt dosya/fonksiyon:** `services/search/src/search.ts` (`scoreFoundationOnly` kullanımı).
- **Gap:** Recommendation test / smoke coverage'ı yok.
- **Risk:** Sıralama manipülasyonlarına karşı test eksikliği.
- **Karar:** PARTIAL.

## 12. BFF / UI / Panel Boundary Review
- **Beklenti:** BFF ve UI kendi başına stock/price hesaplamamalı; Panel taksonomi, ürün vb. konularda direct write yapmamalıdır.
- **Bulunan mevcut durum:** BFF route'ları (`apps/bff/src/server/catalog.ts`) doğrudan servislerin projection methodlarına proxy yapmaktadır ve warning bayraklarını (`PRICE_STOCK_MEDIA_OWNER_TRUTH_NOT_PRODUCED_BY_BFF`) set etmektedir. Panel üzerinden de direct write izi bulunmamıştır.
- **Kanıt dosya/fonksiyon:** `apps/bff/src/server/catalog.ts` handleCatalogProductCards methodu.
- **Gap:** Yok.
- **Risk:** Yok.
- **Karar:** PASS.

## 13. Smoke / Test Coverage İncelemesi
- **Mevcut Durum:** `search-index-projection` ve `plp` testleri `HIDDEN`, `UNAVAILABLE` ürünlerin public index'e sızmamasını statik olarak kontrol etmektedir.
- **Gap:** Fiyat değişimi, stok tükenmesi veya medyanın banlanması durumlarında sistemin nasıl reaksiyon vereceğini kanıtlayan stale data leak dinamik testleri yoktur.
- **Kanıt dosya/fonksiyon:** `tests/smoke/suites/search-index-projection.ts`, `tests/smoke/suites/plp.ts`.

## 14. Kapanan Maddeler
Kapanan maddeler yalnız boundary / non-mutation / current static leak guard kapsamındadır. Projection sync readiness kapanmamıştır.
- BFF'in price/stock truth'u üretmemesi kanıtlanmıştır (BFF/UI/Panel Boundary: PASS).
- Search indeksinin statik hidden/unavailable ürünü public yapmama boundary'si doğrulanmıştır (Search/Index Boundary: PASS).
- Catalog ve Search in-memory projection sınırları testlerle kanıtlanmıştır (Boundary Review: PASS).

## 15. Açık Gap'ler
- **GAP-SYNC-01 — Projection Consumer Yokluğu**
  - Açıklama: Pricing, stock ve media değişikliklerini catalog/search/index projection’a taşıyan event/outbox consumer yok.
  - Etki: Stale price, stale stock, rejected/pending media leak riski.
  - Önerilen Paket: PHASE-07-FIX-03 — Projection Consumer Foundation
  - Kapanış Kriteri: En az pricing/stock/media için controlled projection update path ve owner boundary flags ile smoke kanıtı.

- **GAP-SMOKE-01 — Dynamic Stale Leak Smoke Eksikliği**
  - Açıklama: Fiyat/stok/medya değişiminden sonra public yüzeylerin güncel projection kullandığını kanıtlayan smoke yok.
  - Etki: Statik hidden/unavailable testleri geçse bile dinamik stale leak riski açık kalır.
  - Önerilen Paket: PHASE-07-FIX-04 — Stale Price / Stock / Media Leak Smoke Coverage
  - Kapanış Kriteri: Fiyat güncelleme, stok tükenme ve medya reject/pending durumları sonrası catalog/search/PLP/PDP/product-card leak kontrolü.

- **GAP-RANK-01 — Ranking / Recommendation Smoke Eksikliği**
  - Açıklama: Ranking/recommendation owner readiness ve smoke coverage hâlâ eksik.
  - Etki: PHASE-07 ranking readiness kapanamaz.
  - Önerilen Paket: PHASE-07-FIX-05 — Ranking / Recommendation Smoke Readiness
  - Kapanış Kriteri: Ranking/recommendation smoke, truth mutation yapmadığını ve public candidate setini doğru sıraladığını kanıtlamalı.

- **GAP-OS-01 — OpenSearch Production Lifecycle Eksikliği**
  - Açıklama: OpenSearch production bootstrap, credential, index lifecycle, distributed consistency ve worker reliability yok.
  - Etki: Production search readiness kapanamaz.
  - Önerilen Faz: PHASE-12 / Infra Release Gate veya PHASE-07 ileri ops paketi
  - Kapanış Kriteri: External index runtime, credential/config validation, index migration/bootstrap, retry/rebuild strategy.

## 16. Ertelenen Maddeler
- **Madde:** Projection Consumer Foundation
  - **Neden ertelendi:** Henüz geliştirilmemiş gap olarak tespit edildiği için.
  - **Devredildi:** PHASE-07-FIX-03
  - **Kapanış Kriteri:** Controlled projection update path ve owner boundary flags içeren altyapının kurulması.

- **Madde:** Stale Price / Stock / Media Leak Smoke Coverage
  - **Neden ertelendi:** Projection consumer altyapısı eksik olduğundan dinamik olarak test edilemediği için.
  - **Devredildi:** PHASE-07-FIX-04
  - **Kapanış Kriteri:** Fiyat, stok ve medya güncellemeleri sonrasında leak olup olmadığını test eden suite'in yazılması.

- **Madde:** Ranking / Recommendation Smoke Readiness
  - **Neden ertelendi:** Henüz ranking owner readiness eksik olduğu için.
  - **Devredildi:** PHASE-07-FIX-05
  - **Kapanış Kriteri:** Recommendation truth mutasyonu olmadığını ve doğru sıralama yaptığını gösteren smoke.

- **Madde:** OpenSearch Production Ops (Bootstrap, Lifecycle)
  - **Neden ertelendi:** Bu phase temel uygulama mimarisine ve boundary'lere odaklandığı, opsel süreçlerin daha alt seviye olduğu için.
  - **Devredildi:** PHASE-12 / Infra Release Gate
  - **Kapanış Kriteri:** Gerçek external index entegrasyonu, credential validasyonu ve rebuild stratejilerinin kurulması.

- **Madde:** Advanced facet/ranking engine
  - **Neden ertelendi:** Arama sonuçları için temel commerce boundary check'lerinin öncelikli olması nedeniyle.
  - **Devredildi:** PHASE-07 sonrası advanced discovery/ranking package veya ilgili production-readiness fazı
  - **Kapanış Kriteri:** İleri seviye algoritma adaptasyonları.

## 17. Risk / Release Blocker Etkisi
- **Projection consumer yokluğu (GAP-SYNC-01):** HIGH production-readiness debt.
- **Stale leak smoke yokluğu (GAP-SMOKE-01):** HIGH verification required.
- **OpenSearch production ops eksikliği (GAP-OS-01):** MEDIUM/HIGH infrastructure readiness debt.
- **Ranking/recommendation smoke yokluğu (GAP-RANK-01):** PHASE-07 closure blocker adayı.

## 18. Nihai Karar
PHASE-07-FIX-02 nihai kararı **PARTIAL**'dır.
Boundary seviyesinde search/catalog/BFF tarafında truth ownership ihlali tespit edilmemiştir; bu alanlar PASS kabul edilebilir.
Ancak görevin ana konusu olan pricing/stock/media projection sync ve outbox/event consumer readiness tarafında gerçek consumer mekanizması bulunmamaktadır.
Ayrıca stale price, stale stock ve rejected/pending media leak senaryolarını kanıtlayan dinamik smoke coverage yoktur.
Bu nedenle paket production-readiness açısından kapatıcı PASS veremez; PHASE-07-FIX-03 ve PHASE-07-FIX-04 açılmadan bu risk kapanmış sayılmaz.

## 19. Sonraki Önerilen Paket
- **Birinci:** PHASE-07-FIX-03 — Projection Consumer Foundation
- **İkinci:** PHASE-07-FIX-04 — Stale Price / Stock / Media Leak Smoke Coverage
- **Üçüncü:** PHASE-07-FIX-05 — Ranking / Recommendation Smoke Readiness
*(OpenSearch production ops bu üçlüden sonra infra/release gate hattına devredilebilir veya ayrı ops paketi olarak planlanabilir.)*

## 20. Baş Mimar İncelemesi İçin Not
Bu revize rapor baş mimar ile birlikte incelenmeden PHASE-07-FIX-03 promptuna geçilmemelidir.
Mevcut boundary doğrulaması temizdir, ancak operasyonel eventing ve bu eventing üzerinde oluşabilecek riskleri adresleyen smoke test eksikliği sebebiyle karar standart production-readiness kuralları çerçevesinde PARTIAL'a çekilmiştir.
