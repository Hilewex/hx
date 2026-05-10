# PHASE-07-SEARCH-CATALOG-RANKING-TAXONOMY-READINESS.md

## 1. Fazın Amacı

Bu fazın amacı, Hedihup platformunda arama, katalog, kategori/PLP, indexing, taxonomy, ranking ve recommendation hattını production-readiness seviyesine getirmektir.

Bu fazın ana ayrımı:

```text
Search candidate ≠ final ranking
Catalog projection ≠ commerce truth
Taxonomy UI listesi ≠ taxonomy owner truth
Search index document ≠ product owner truth
```

Bu fazın hedefi:

```text
Kullanıcıya gösterilen arama, kategori, PLP, keşfet ve öneri yüzeyleri; görünürlük, stok/fiyat projection, taxonomy, ranking ve index tutarlılığı açısından güvenli hale getirilmelidir.
```

---

## 2. Fazın Kapsamı

Bu faz aşağıdaki alanları kapsar:

- arama sistemi
- arama indeksleme sistemi
- kategori / PLP sistemi
- kategori / taxonomy sistemi
- klasik ürün kartı listeleri
- PDP/catalog read projection bağlantısı
- search intent / candidate owner
- ranking / recommendation owner
- feed / discovery / recommendation ordering
- dynamic facets / filters
- indexed category / storefront / product context
- OpenSearch production ops
- index bootstrap / reindex / recovery
- pricing / stock / media projection sync
- hidden / unavailable / suspended / archived leak kontrolleri

---

## 3. Fazın Kapsam Dışı Alanları

Bu fazda yapılmayacak işler:

- payment/order/checkout implementation
- settlement/payout
- media processing pipeline
- full frontend page drawings
- full admin panel UI
- production deployment final gate
- fraud scoring engine

Bu faz search/catalog/ranking/taxonomy correctness ve visibility safety fazıdır. Ekran çizimleri ve UX PHASE-10’da ele alınır.

---

## 4. Referans Sistem Dosyaları

Bu fazda esas alınacak sistem dosyaları:

1. `12-arama sistemi.md`
2. `51-arama indeksleme sistemi.md`
3. `10-kategori plp sistemi.md`
4. `52-kategori taksonomi sistemi.md`
5. `37-öneri sıralama sistemi.md`
6. `7-keşfet sistemi.md`
7. `9-ana sayfa sistemi.md`
8. `8-klasik ürün kart sistemi.md`
9. `4-pdp sistemi.md`
10. `27-merkezi stok sistemi.md`
11. `29-merkezi fiyat sistemi.md`
12. `50-medya asset sistemi.md`
13. `1-havuz sistemi.md`
14. `25-kural -yetki sistemi.md`
15. `OWNER_MATRIX.md`
16. `GUARD_MATRIX.md`
17. `PERMISSION_MATRIX.md`
18. `TRANSITION_POLICIES.md`
19. `CRITICAL_JOURNEY_CHECKLIST.md`
20. `ACCEPTANCE_CRITERIA_PACK.md`
21. `TEST_STRATEJISI.md`

---

## 5. Referans Kayıt Dosyaları

Bu fazda özellikle şu kayıtlar dikkate alınır:

- `63-IMPLEMENTATION_PROGRESS_MASTER_BIRLESTIRILMIS.md`
- `64-PACKAGE_EXECUTION_LOG_BIRLESTIRILMIS.md`
- `65-ACTIVE_RISKS_AND_DECISIONS-CONSOLIDATED.md`
- `HARDENING-06-07-CONSOLIDATED-REFERENCE-RECORD.md`
- `HARDENING-08-09-CONSOLIDATED-REFERENCE-RECORD.md`
- `PX_DOMAIN_IMPLEMENTATION_REFERENCE_RECORD.md`
- `01-SYSTEM_TO_IMPLEMENTATION_MAPPING.md`
- `02-CURRENT_STATE_BASELINE.md`
- `03-PRODUCTION_READINESS_PHASE_MASTER_PLAN.md`
- `04-PRODUCTION_READINESS_RISK_REGISTER.md`
- `09-RELEASE_BLOCKER_REGISTER.md`

---

## 6. Önceden Yapılmış İşler

### 6.1 Search Foundation

Kayıtlara göre:

- P26 — Search Foundation — PASS

Bu arama foundation hattının kurulduğunu gösterir.

### 6.2 Category / PLP Foundation

- P27 — Category / PLP Foundation — PASS

Bu category/PLP foundation olduğunu gösterir.

### 6.3 Catalog / PDP Read Foundation

- P08 — Catalog / PDP Read Foundation — PASS
- HARDENING-07A1 — Catalog Read Projection Foundation — PASS WITH LIMITATION
- HARDENING-07A2 — PDP / PLP Read Hardening & Smoke — PASS WITH LIMITATION

Bu katalog/PDP/PLP read foundation’ın hardening gördüğünü gösterir.

### 6.4 Search BFF Smoke + Candidate Boundary

- HARDENING-07B — Search BFF Smoke + Candidate Boundary — PASS WITH LIMITATION

Bu kayıt search candidate boundary için smoke kanıtı verir.

### 6.5 Search Index Sync Projection Foundation

- HARDENING-07C — Search Index Sync Projection Foundation — PASS WITH LIMITATION

Bu kayıt search index projection foundation olduğunu gösterir.

### 6.6 HARDENING-07 Final

HARDENING-07 final durumu:

```text
Catalog / PDP / PLP / Search — PASS WITH LIMITATION
```

Bu hat catalog/search skipped borcunu kapatmıştır. Ancak production-readiness borçları kalmıştır.

---

## 7. Önceden Ertelenmiş / Sınırlı Bırakılmış İşler

Bu faza devreden ana limitation ve borçlar:

1. Event/outbox production consumer yok
2. OpenSearch production ops ve bootstrap yok
3. Ranking/recommendation ayrı owner paket borcu
4. Dynamic facets yok
5. PLP search grid merge borcu
6. Category/storefront indexed expansion borcu
7. Pricing/stock/media real-time projection sync borcu
8. Catalog/product write owner yokluğu veya ayrı domain ihtiyacı
9. Category taxonomy owner borcu
10. Search distributed consistency / retry / worker reliability borcu
11. Stale dist artifact hygiene borcu
12. PLP `activePriceLabel` owner delegation placeholder davranışı
13. Hidden/unavailable/suspended/archived leak riski tekrar doğrulanmalı

---

## 8. Bu Fazda Yapılacak İşler

### 8.1 Search Intent / Candidate Owner Kontrolü

Kontrol edilecek:

- Search query parsing nerede yapılıyor?
- Intent normalization search owner alanında mı?
- Candidate set üretimi M9 alanında mı?
- Search service final ordering yapıyor mu?
- Search BFF candidate truth üretiyor mu?
- Facet/filter candidate behavior search owner içinde mi?

Beklenen sonuç:

```text
M9 search intent/candidate owner’dır; final ranking owner değildir.
```

---

### 8.2 Ranking / Recommendation Owner Kontrolü

Kontrol edilecek:

- Final ordering M8 ranking owner içinde mi?
- Boost/demotion/suppression kuralları nerede?
- Personalized recommendation nasıl üretiliyor?
- Keşfet / ana sayfa / takip / search result ordering ayrımları net mi?
- Ranking commerce/content/social truth mutate ediyor mu?
- Ranking BFF içinde mi, olmamalı mı?

Beklenen sonuç:

```text
M8 ranking/recommendation owner’dır; commerce/content/social/search truth mutate etmez.
```

---

### 8.3 Catalog Read Projection Kontrolü

Kontrol edilecek:

- Catalog projection product truth gibi kullanılıyor mu?
- PDP/PLP read projection kaynağı nedir?
- Product active/hidden/unavailable/archived visibility doğru mu?
- Pricing/stock/media projection stale olduğunda davranış ne?
- Catalog read owner commerce truth mutate ediyor mu?
- BFF mock truth kalıntısı var mı?

Beklenen sonuç:

```text
Catalog projection read modeldir; product/price/stock truth değildir.
```

---

### 8.4 Search Index Document Source Kontrolü

Kontrol edilecek:

- Search index document catalog read projection’dan mı besleniyor?
- Price/stock/media fields stale ise nasıl işaretleniyor?
- Hidden/unavailable product index’ten düşüyor mu?
- Suspended creator/storefront ürünleri leak ediyor mu?
- Archived/deleted records search result’ta çıkıyor mu?
- Index source ve product owner truth ayrımı net mi?

Beklenen sonuç:

```text
Search index document query serving içindir; owner truth değildir.
```

---

### 8.5 OpenSearch Production Ops

Kontrol edilecek:

- OpenSearch bootstrap strategy
- Index template / mapping
- Alias / versioned index strategy
- Reindex planı
- Index recovery planı
- Search degraded mode
- Cluster health monitoring
- Local vs production config ayrımı

Beklenen sonuç:

```text
OpenSearch sadece local foundation değil, production ops planına sahip olmalıdır.
```

---

### 8.6 Index Worker / Outbox Consumer Reliability

Kontrol edilecek:

- Catalog/product eventleri index worker’a nasıl gider?
- Outbox consumer var mı?
- Retry/backoff/DLQ strategy var mı?
- Duplicate event duplicate index corruption yapıyor mu?
- Failed indexing degraded mode üretiyor mu?
- Reindex komutu var mı?

Beklenen sonuç:

```text
Index sync güvenilir worker/consumer stratejisine sahip olmalıdır.
```

---

### 8.7 Dynamic Facets / Filters

Kontrol edilecek:

- Facets taxonomy truth’dan mı besleniyor?
- Category attribute set ile uyumlu mu?
- Variant options facets içinde doğru mu?
- Price range dynamic mi?
- Stock/availability filter stale olursa davranış ne?
- BFF facet truth üretiyor mu?

Beklenen sonuç:

```text
Facet/filter davranışı taxonomy ve search candidate owner sınırında olmalıdır.
```

---

### 8.8 PLP Search Grid Merge

Kontrol edilecek:

- PLP category browsing ile search results nasıl ayrılıyor?
- Query varsa search candidate mi kullanılıyor?
- Category PLP grid taxonomy mi kullanıyor?
- Ranking final ordering nerede uygulanıyor?
- Hidden/unavailable product leak var mı?
- Product card activePriceLabel placeholder owner delegation ile nasıl kapanacak?

Beklenen sonuç:

```text
PLP grid search/catalog/ranking sınırlarını karıştırmamalıdır.
```

---

### 8.9 Category / Taxonomy Owner

Kontrol edilecek:

- Category tree truth nerede?
- Attribute set / filter set / variant rule set nerede?
- Supplier submitted product category suggestion nasıl yönetiliyor?
- Admin category correction protected action mı?
- Category alias/synonym/search normalization ilişkisi nedir?
- Taxonomy UI içinde üretiliyor mu?

Beklenen sonuç:

```text
Taxonomy owner ayrı ve canonical olmalıdır.
```

---

### 8.10 Storefront / Creator Indexed Expansion

Kontrol edilecek:

- Creator storefront products search index’e nasıl giriyor?
- Creator store context global product truth’u değiştiriyor mu?
- Storefront suspended/archived ise index behavior ne?
- Creator-specific merchandising search result’ı etkiliyor mu?
- Storefront post/story search kapsamı olacak mı?

Beklenen sonuç:

```text
Creator storefront context indexlenebilir; global commerce truth’u mutate etmez.
```

---

### 8.11 Home / Discover / Recommendation Surfaces

Kontrol edilecek:

- Ana sayfa blokları ranking/recommendation ile nasıl besleniyor?
- Keşfet feed candidate ve final ranking ayrımı ne?
- Trend slotlar ayrı mı?
- Follow feed ranking owner’a mı bağlı?
- Fallback feed_type kararı nerede?
- Personalization açık değilse deterministic fallback var mı?

Beklenen sonuç:

```text
Home/discover/recommendation yüzeyleri ranking owner sınırını korumalıdır.
```

---

## 9. Bu Fazda Yapılmayacak İşler

Bu fazda bilinçli olarak yapılmayacaklar:

- Full frontend page drawings
- Full visual UI polish
- Payment/order/finance implementation
- Media transcoding pipeline
- Full BI/dashboard
- Production deployment final gate

---

## 10. Owner / Guard / Permission Kuralları

### 10.1 Owner Boundary

Bu fazda korunacak sınırlar:

- M9 search intent/candidate owner’dır
- M8 ranking/recommendation owner’dır
- BFF read aggregation yapar; search/ranking truth üretmez
- Catalog projection product/commerce truth değildir
- Search index product truth değildir
- Taxonomy UI içinde üretilmez
- Ranking commerce/content/social truth mutate etmez
- Event/outbox index trigger olabilir; owner truth mutation değildir

### 10.2 Guard Kuralları

Zorunlu guard aileleri:

- public visibility guard
- product active/available lifecycle guard
- storefront/creator visibility guard
- moderation visibility guard
- stock/price projection freshness guard
- taxonomy validity guard
- idempotency/retry guard for index worker

### 10.3 Permission Kuralları

- Search/PDP/PLP public olabilir
- Public view social write hakkı değildir
- Admin taxonomy change protected action ister
- Supplier category suggestion taxonomy write hakkı değildir
- Creator merchandising global ranking truth yazamaz

### 10.4 Transition Kuralları

Korunacak ayrımlar:

- product approved ≠ product active
- product active ≠ indexed
- indexed ≠ visible
- visible ≠ purchasable
- search candidate ≠ ranked result
- catalog projection ≠ owner truth
- taxonomy suggestion ≠ taxonomy accepted
- event emitted ≠ index updated guarantee

---

## 11. Riskler

### 11.1 RB-014 — Search / Taxonomy / Ranking Leak Kontrolü Tamamlanmadı

Bu fazın ana release blocker adayıdır.

### 11.2 Ranking Owner Borcu

Ranking/recommendation owner net değilse arama/keşfet/ana sayfa yüzeyleri tutarsız olur.

### 11.3 Taxonomy Owner Borcu

Kategori ve facet truth UI/BFF içinde dağılırsa ürün kabul, PLP ve search kalitesi bozulur.

### 11.4 Hidden / Unavailable Leak Riski

Görünmemesi gereken ürün veya mağaza arama/PLP/keşfet üzerinden leak edebilir.

### 11.5 Index Staleness Riski

Fiyat, stok veya media projection stale ise kullanıcı yanlış satın alma niyeti oluşturabilir.

### 11.6 OpenSearch Ops Riski

Search localde çalışsa bile production index lifecycle ve recovery yoksa release sonrası arama kırılabilir.

---

## 12. Kabul Kriterleri

PHASE-07 kapanışı için minimum kabul kriterleri:

1. M9 search candidate owner sınırı doğrulanmalı
2. M8 ranking/recommendation owner sınırı doğrulanmalı
3. BFF search/ranking truth üretmemeli
4. Catalog projection owner truth gibi kullanılmamalı
5. Search index document source net olmalı
6. Hidden/unavailable/suspended/archived leak testleri yapılmalı
7. OpenSearch production ops planı yazılmalı
8. Index worker / outbox consumer reliability kararı verilmeli
9. Dynamic facets/filer source netleşmeli
10. PLP search grid merge davranışı netleşmeli
11. Taxonomy owner kararı verilmiş olmalı
12. Storefront/creator index expansion sınırı netleşmeli
13. Home/discover/recommendation initial scope belirlenmeli
14. Targeted search/catalog/ranking/taxonomy test kanıtı alınmalı
15. Risk ve release blocker register güncellenmeli

---

## 13. Test / Smoke / Runtime Kanıtları

Bu faz kod/source/runtime etkili fazdır.

Minimum önerilen kanıtlar:

```text
- pnpm run typecheck
- pnpm run build
- smoke:catalog-read
- smoke:search
- smoke:search-index-projection
- hidden/unavailable leak test
- archived/suspended leak test
- taxonomy/facet mapping test
- search candidate vs ranking boundary test
- PLP grid behavior test
- degraded search scenario
- index sync idempotency test
```

Acceptance bağlantıları:

- Journey 01 — search → PDP
- Search/PLP surface acceptance
- Hidden/unavailable visibility behavior

---

## 14. Kapanış Kontrol Listesi

```text
[ ] Search candidate owner kontrol edildi
[ ] Ranking owner kontrol edildi
[ ] BFF ranking/search truth üretmiyor kontrol edildi
[ ] Catalog projection truth ayrımı kontrol edildi
[ ] Search index document source kontrol edildi
[ ] Hidden/unavailable leak testi yapıldı
[ ] Suspended/archived leak testi yapıldı
[ ] OpenSearch production ops planı yazıldı
[ ] Index worker / outbox consumer reliability kararı verildi
[ ] Dynamic facets source kontrol edildi
[ ] PLP search grid merge kontrol edildi
[ ] Taxonomy owner kararı verildi
[ ] Storefront/creator index expansion kontrol edildi
[ ] Home/discover/recommendation scope belirlendi
[ ] Targeted smoke/test kanıtı alındı
[ ] RB-014 güncellendi
[ ] PRR-012 güncellendi
[ ] PRR-013 güncellendi
[ ] PRR-014 güncellendi
[ ] Risk register güncellendi
[ ] Release blocker register güncellendi
[ ] Faz kapanış raporu üretildi
```

---

## 15. Faz Sonu Kararı İçin Beklenen Sonuç

Bu fazın ideal hedef kararı:

```text
PASS
```

Ancak advanced personalization veya full OpenSearch production ops PHASE-12’ye kontrollü devredilecekse şu karar mümkün olabilir:

```text
PASS WITH LIMITATION
```

### PASS Şartı

- Search/catalog/ranking/taxonomy owner sınırları net
- Hidden/unavailable leak yok
- Taxonomy owner net
- Search candidate/ranking ayrımı korunuyor
- OpenSearch/index worker minimum production strategy var
- Targeted tests PASS

### PASS WITH LIMITATION Şartı

- Ana visibility ve owner correctness sağlandı
- Advanced ranking/personalization veya production ops detayları kontrollü devredildi
- Release blocker niteliğinde visibility leak yok

### PARTIAL Şartı

- Taxonomy owner belirsiz
- Ranking owner belirsiz
- Leak testleri yok
- Index sync reliability belirsiz
- Test kanıtı eksik

### FAIL Şartı

- Hidden/unavailable ürünler public leak ediyor
- BFF final ranking owner gibi davranıyor
- Search candidate final ranking ile karışıyor
- Taxonomy UI/BFF içinde dağınık üretiliyor
- Catalog projection owner truth gibi mutate ediliyor

---

## 16. Sonraki Faza Devredenler

PHASE-08’e devredenler:

- Admin taxonomy management UI
- Search/category admin tools
- Ranking/manual boost protected admin actions
- Storefront/category admin controls

PHASE-09’a devredenler:

- Analytics/ranking signal pipeline
- Abuse/fraud search manipulation detection
- Outbox/index worker monitoring
- Event producer coverage

PHASE-10’a devredenler:

- Search page UX
- PLP page UX
- Filter/facet UI
- Discover/home feed UI
- Recommendation carousel UI
- Page drawings and mobile-first screens

PHASE-11’e devredenler:

- Search → PDP critical journey
- PLP/product visibility acceptance
- Degraded/no-result behavior

PHASE-12’ye devredenler:

- OpenSearch production deployment
- Index backup/recovery
- Observability/alerting
- Reindex operational playbook

---

## 17. Nihai Faz Açılış Kararı

PHASE-07 şu şartla başlatılabilir:

```text
PHASE-06 Social / Content / Media / Moderation Readiness en az PASS WITH LIMITATION olarak kapanmış olmalıdır.
```

Planlama seviyesi için bu dosya hazırdır.

Gerçek uygulama/kapanış için repo source review, targeted search/catalog/ranking/taxonomy tests ve boundary review gereklidir.

Net açılış kararı:

```text
PHASE-07 Search / Catalog / Ranking / Taxonomy Readiness planı hazırdır.
```
