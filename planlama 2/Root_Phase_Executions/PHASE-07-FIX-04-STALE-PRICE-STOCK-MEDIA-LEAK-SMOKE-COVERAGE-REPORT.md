# PHASE-07-FIX-04 — Stale Price / Stock / Media Leak Smoke Coverage Report

## 1. Görev Bilgisi
- **Görev adı**: PHASE-07-FIX-04 — Stale Price / Stock / Media Leak Smoke Coverage
- **Görev tipi**: Smoke Test Coverage / Control Package
- **Kod değişikliği yapıldı mı?**: Evet, test dosyaları ve betikleri eklendi.
- **Nihai karar**: PASS WITH LIMITATION

## 2. Amaç
Bu paketin amacı, PHASE-07-FIX-03 ile kurulan Projection Consumer Foundation’ın fiyat, stok ve medya güncellemeleri sonrasında public (açık) yüzeylerde stale (eski/geçersiz) veya invalid verilerin (leak) sızıp sızmadığını smoke testlerle kanıtlamaktır.

## 3. Kullanılan Referans Dosyaları
- PHASE-07-FIX-02-PROJECTION-SYNC-OUTBOX-CONSUMER-GAP-REVIEW-REPORT.md
- PHASE-07-FIX-03-PROJECTION-CONSUMER-FOUNDATION-REPORT.md
- PHASE-07-FIX-00-SEARCH-CATALOG-SMOKE-RUNTIME-RECOVERY-REPORT.md
- PHASE-07-FIX-01-CATEGORY-TAXONOMY-PLP-SMOKE-COVERAGE-REPORT.md
- 1-havuz sistemi.md
- 4-pdp sistemi.md
- 8-klasik ürün kart sistemi.md
- 10-kategori-plp sistemi.md
- 12- Arama Sistemi.md
- 25-kural -yetki sistemi.md
- 27-merkezi stok sistemi.md
- 29-merkezi fiyat sistemi.md
- 37-öneri ve sıralama sistemi.md
- 50-medya asset sistemi.md
- 51-arama indeksleme sistemi.md
- 52-kategori taksonomi sistemi.md

## 4. Değişen Dosyalar
- `package.json` (Yeni smoke command: `smoke:stale-projection-leak`)
- `tests/smoke/run-smoke.ts` (Yeni suite kaydı eklendi)
- `tests/smoke/suites/stale-projection-leak.ts` (Yeni dosya oluşturuldu)

## 5. Kapsam Dışı Bırakılanlar
Aşağıdaki altyapısal gereksinimler, bu paket smoke coverage paketi olduğundan bilinçli olarak kapsam dışında bırakılmıştır:
- Production Kafka / RabbitMQ kurulumu
- Production OpenSearch bootstrap ve index lifecycle yönetimi
- DB migration işlemleri
- Persistent distributed worker
- Retry scheduler / DLQ
- Advanced ranking / recommendation engine
- PLP advanced facet engine
- UI tasarımı ve Panel ekranı
- Live provider entegrasyonu

## 6. Smoke Tasarımı
Eklenen smoke testi, fiyat, stok ve medya truth owner'larından gelen projection update'lerin mevcut projection'lar üzerinde doğru şekilde etki gösterdiğini; eski, geçersiz veya reddedilen verilerin public projection snapshot'larında tutulmadığını (leak engellemesi) ve idempotency key'lerin mükerrer işlem (duplicate effect) sızıntılarını önlediğini kanıtlamaktadır. Test memory modunda `applyProjectionUpdate` üzerinden public state'in davranışını doğrulamaktadır.

## 7. Price Stale Leak Coverage
- **Senaryo**: Başlangıçta 100.0 TRY değerinde bir fiyat set edildi. Daha sonra `PRICE_CHANGED` ile fiyat 150.0 TRY yapıldı.
- **Yapılan doğrulama**: Güncelleme sonrası `getProjection` üzerinden eski fiyatın sızıp sızmadığı ve yeni aktif satış fiyatının başarıyla alınıp alınmadığı kontrol edildi.
- **Kanıt dosya/fonksiyon**: `tests/smoke/suites/stale-projection-leak.ts` içindeki Price Stale Leak bölümü.
- **Boundary sonucu**: `priceTruthMutated: false`, `ownerTruthMutated: false`, `businessTruthMutated: false`, `projectionUpdated: true` sınırları kanıtlandı.
- **Karar**: PASS

## 8. Stock Stale / Unavailable Leak Coverage
- **Senaryo**: Başlangıçta `IN_STOCK` olan bir ürün için `STOCK_CHANGED` update ile stok durumu `OUT_OF_STOCK` yapıldı.
- **Yapılan doğrulama**: Ürünün public projection'da artık satılabilir/ulaşılabilir olarak görünmediği, availability bilgisinin açıkça `OUT_OF_STOCK` olduğu doğrulandı.
- **Kanıt dosya/fonksiyon**: `tests/smoke/suites/stale-projection-leak.ts` içindeki Stock Leak bölümü.
- **Boundary sonucu**: `stockTruthMutated: false`, `ownerTruthMutated: false`, `businessTruthMutated: false`, `projectionUpdated: true` sınırları kanıtlandı.
- **Karar**: PASS

## 9. Media Rejected / Pending Leak Coverage
- **Senaryo**: Başlangıçta geçerli kabul edilen bir medya içeren ürün için, `MEDIA_REJECTED` update yapıldı.
- **Yapılan doğrulama**: Reddedilen (rejected) medyanın public projection media listesinden tamamen çıkarıldığı / sızmadığı kontrol edildi.
- **Kanıt dosya/fonksiyon**: `tests/smoke/suites/stale-projection-leak.ts` içindeki Media Leak bölümü.
- **Boundary sonucu**: `mediaTruthMutated: false`, `ownerTruthMutated: false`, `businessTruthMutated: false`, `projectionUpdated: true` sınırları kanıtlandı.
- **Karar**: PASS

## 10. Idempotency / Duplicate Effect Coverage
- **Senaryo**: Aynı `idempotencyKey` kullanılarak `PRICE_CHANGED` update talebi ikinci kez farklı bir payload (99.99 TRY) ile uygulandı.
- **Yapılan doğrulama**: Duplicate isteğin `DUPLICATE_IDEMPOTENCY_KEY` ile görmezden gelindiği ve fiyatın değişmeden kaldığı kontrol edildi.
- **Kanıt dosya/fonksiyon**: `tests/smoke/suites/stale-projection-leak.ts` içindeki Duplicate Idempotency bölümü.
- **Boundary sonucu**: Effect uygulanmadı, sınırlar korundu.
- **Karar**: PASS

## 11. Public Surface Assertion
Aşağıdaki public/projection yüzeyler doğrulanmıştır:
- **catalog product card projection**: Memory üzerindeki `getProjection` ile test edilmiştir.
- **PDP için doğrudan kanıt**: Sistemde henüz public BFF tarafında `/catalog/:productId` gibi doğrudan bir PDP okuma endpointi bulunmadığından API bazlı doğrudan HTTP `fetch` okuması başarısız olmuştur (test logunda Limitation uyarısı olarak görülmektedir: `Public API for catalog not available, falling back to direct projection validation`). Bu nedenle doğrulama doğrudan handler'ın `getProjection` fonksiyonu ile yapılmıştır.
- **search index projection / PLP**: Mevcut search / plp smoke testleri (smoke:search-index-projection, smoke:plp) üzerinden regresyon testleri ile verify edilmiştir.

## 12. BFF / UI / Panel Boundary Review
BFF, UI ve Panel katmanları kesinlikle truth üretmemiştir. Sadece event'leri izleyen foundation üzerinden projection okumaları simüle edilmiştir. Bu katmanlara mutation yetkisi verilmemiştir ve ilgili alanlara dokunulmamıştır.

## 13. Smoke / Test Sonuçları
Komut bazlı sonuç tablosu:
- `pnpm run typecheck` → **PASS**
- `pnpm run build` → **PASS**
- `pnpm run smoke:projection-consumer-foundation` → **PASS**
- `pnpm run smoke:stale-projection-leak` → **PASS**
- `pnpm run smoke:search-index-projection` → **PASS**
- `pnpm run smoke:catalog-read` → **PASS**
- `pnpm run smoke:search` → **PASS**
- `pnpm run smoke:plp` → **PASS**

## 14. Kapanan Maddeler
- GAP-SMOKE-01 foundation/memory smoke coverage seviyesinde kapandı.
- Dynamic stale price leak coverage tamamlandı.
- Dynamic stale stock leak coverage tamamlandı.
- Dynamic rejected/pending media leak coverage tamamlandı.
- Duplicate projection effect coverage eklendi.
- Boundary non-mutation evidence kanıtlandı.

## 15. Açık Kalan Maddeler
- Production broker / distributed worker altyapısı eksiktir.
- Durable projection persistence eksiktir (memory mode ile çalışılmaktadır).
- OpenSearch production lifecycle bulunmamaktadır.
- Advanced ranking / recommendation implementasyonu yoktur.
- PDP özel public endpoint smoke bulunmamaktadır (fetch işlemi Limitation olarak kaydedildi).
- External index runtime integration eksiktir.

## 16. Ertelenen Maddeler
- **Ranking / Recommendation Smoke Readiness**: Bu pakek kapsamadığından ertelendi. → *PHASE-07-FIX-05'e devredildi*. (Kapanış kriteri: İlgili algoritmaların smoke testlere eklenmesi).
- **OpenSearch Production Ops**: Gerçek index lifecycle yönetimi ve external entegrasyonlar → *PHASE-12 / Infra Release Gate'e devredildi*.
- **Production broker/distributed worker**: Gerçek queue consumer'lar → *PHASE-12 veya eventing/infra readiness fazına devredildi*.
- **Durable Projection Persistence**: DB bazlı okuma → *PHASE-12 veya persistence/projection durability package'a devredildi*.
- **PDP özel endpoint smoke**: Doğrudan PDP surface eksikliği → *PHASE-10 Frontend/Public Surface Readiness veya PHASE-11 Critical Journey Acceptance'a devredildi*.

## 17. Risk / Release Blocker Etkisi
Stale leak riski memory/foundation smoke kapsamındaki hedef senaryolarda azaltılmış ve doğrulanmıştır; ancak durable persistence, production broker, external index runtime ve PDP özel public endpoint doğrulaması eksik olduğu için production seviyesinde sıfırlanmış kabul edilemez.

Architecture/boundary foundation smoke seviyesinde güçlenmiştir; production release uygunluğu PHASE-12 infra/runtime ve PHASE-11 critical journey doğrulamaları tamamlanmadan ilan edilemez.

**Foundation/memory smoke risk durumu:**
- Price stale leak hedef senaryosu PASS.
- Stock stale/unavailable leak hedef senaryosu PASS.
- Media rejected/pending leak hedef senaryosu PASS.
- Duplicate idempotency effect hedef senaryosu PASS.

**Devam eden production limitation’lar:**
- Durable projection persistence yok.
- Production broker / distributed worker yok.
- External OpenSearch runtime integration yok.
- PDP özel public HTTP endpoint smoke yok.
- Production retry / DLQ / backoff yok.

**Release blocker etkisi:**
- FIX-04 kendi kapsamındaki smoke gap’i foundation seviyesinde kapatmıştır.
- Ancak production-ready claim verilemez.
- PHASE-07 kapanışı için hâlâ ranking/recommendation smoke readiness beklenmektedir.
- Production infra/runtime readiness PHASE-12’ye devredilmiştir.

## 18. Nihai Karar
**PASS WITH LIMITATION**
Bütün hedeflenen public leak senaryoları kanıtlanmış ve başarıyla PASS almıştır. Bu PASS WITH LIMITATION kararı yalnız PHASE-07-FIX-04 smoke coverage kapsamı içindir. Production broker, durable projection persistence, external index runtime ve PDP özel public endpoint doğrulaması kapsam dışı kaldığından production-ready karar değildir.

## 19. Sonraki Önerilen Paket
Beklenen sıra: **PHASE-07-FIX-05 — Ranking / Recommendation Smoke Readiness**

## 20. Baş Mimar İncelemesi İçin Not
Görev sınırları içindeki tüm stale sızıntı korumaları başarıyla doğrulanmıştır. Rapor baş mimar incelemesi için hazırdır ve sonraki pakete geçiş için onay beklenmektedir.