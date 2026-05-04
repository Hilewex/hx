# S04 — PDP SİSTEMİ KAYIT DOSYASI

## 0. Teknik Olmayan Kısa Özet

PDP Sistemi, platformda ürünün mağaza bağlamlı ana karar yüzeyidir.

Bu sistem yalnız ürün detay sayfası değildir. Ürün ana bilgisi, varyant seçimi, fiyat/stok görünümü, kampanya görünürlüğü, fenomen mağaza bağlamı, kullanıcı güven sinyalleri, yorum, soru-cevap, kullanıcı katkıları ve satın alma aksiyonlarını tek karar alanında toplar.

Ancak PDP bu alanların truth sahibi değildir.

PDP:
- ürün truth üretmez
- fiyat truth üretmez
- stok truth üretmez
- kampanya truth üretmez
- kupon truth üretmez
- yorum / puan truth üretmez
- soru-cevap truth üretmez
- medya truth üretmez
- kullanıcı story truth üretmez
- moderasyon truth üretmez
- fraud/risk truth üretmez
- cart truth üretmez
- checkout truth üretmez
- order truth üretmez

Güncel karar:

S04 PDP Sistemi foundation seviyesinde kapatılmıştır.

Karar:
Foundation: PASS WITH LIMITATION
Production readiness: PARTIAL

---

## 1. Sistem Özeti

PDP Sistemi, kullanıcının bir ürünü satın alma kararına en yakın noktada değerlendirdiği mağaza bağlamlı ürün karar yüzeyidir.

Platformda nötr ürün PDP yoktur. PDP mutlaka bir fenomen mağaza / storefront bağlamında açılır.

Aynı ürün farklı fenomen mağazalarında satılabilir. Ancak:
- ürün ana bilgisi ortaktır
- kategori / taxonomy bilgisi ortaktır
- varyant yapısı ürün ortak gerçekliğine bağlıdır
- yorum / puan ürün güven sinyalidir
- soru-cevap ürün bazlı ortak bilgi alanıdır
- kullanıcı ürün story’leri ürün sosyal kanıt katmanıdır
- mağaza profili, fenomen notu, takip ve mağazaya git alanları mağaza bağlamlıdır

---

## 2. Temel Mimari Karar

PDP bir truth owner değildir.

PDP, ilgili owner sistemlerden gelen read / projection / eligibility bilgilerini kullanıcıya gösterir ve bazı aksiyonları başlatır.

PDP’nin bağlı olduğu temel owner sistemler:

- Catalog / Product read
- Varyant Sistemi
- Merkezi Fiyat Sistemi
- Merkezi Stok Sistemi
- Kampanya Sistemi
- Kupon Sistemi
- Fenomen Mağaza Sistemi
- Yorum / Puanlama Sistemi
- Soru-Cevap Sistemi
- Beğen / Kaydet / Paylaş Sistemi
- Kullanıcı Story Sistemi
- Medya / Asset Sistemi
- Moderasyon Sistemi
- Fraud / Risk / Abuse Sistemi
- Kategori / Taksonomi Sistemi
- Sepet Sistemi
- Checkout Sistemi

Net kural:

PDP hiçbir domain truth alanını mutate etmez.

---

## 3. Yapılan Paketler

### PX-PDP-01 — PDP System Closure Source Review & Boundary Alignment

Karar: PASS WITH LIMITATION

Amaç:

S04 PDP Sistemi’nin mevcut kod tabanında daha önce kodlanan foundation paketleriyle ne ölçüde karşılandığını kaynak kod üzerinde doğrulamak; mağaza bağlamı, owner-boundary ve read model ayrımlarını hizalamak.

Yapılanlar:

- `packages/contracts/src/catalog.ts` incelendi ve güncellendi.
- `StorefrontContext` eklendi.
- `PdpResponse` güncellendi.
- `ProductDetail` içine ticari projection alanları eklendi.
- `productCommon` / `storeContext` ayrımı contract seviyesinde netleştirildi.
- `apps/bff/src/server/catalog.ts` incelendi ve güncellendi.
- `handlePdpRead` fonksiyonunda `storefrontId` zorunluluğu eklendi.
- Nötr PDP riski `STOREFRONT_CONTEXT_REQUIRED` hatasıyla engellendi.
- `apps/bff/src/server/index.ts` PDP route query parametrelerini destekleyecek şekilde güncellendi.
- `apps/web/src/bootstrap/pdp.ts` yeni contract yapısına göre güncellendi.
- `services/pool/src/pool.ts` üzerinden ürünlerin mağaza bağlamlı yapısının temelinin korunduğu teyit edildi.

Çalıştırılan komutlar:

- `cd packages/contracts && pnpm run build` → PASS
- `pnpm run typecheck` → PASS
- `pnpm run build` → PASS

---

## 4. Tamamlanan Alanlar

Foundation seviyesinde tamamlanan alanlar:

- PDP read model hizalaması
- `productCommon` / `storeContext` ayrımı
- mağaza bağlamı zorunluluğu
- nötr PDP riskinin engellenmesi
- PDP contract güncellemesi
- BFF validation / delegation sınırı
- Web render shell uyumu
- price projection ayrımı
- stock projection ayrımı
- campaign projection sınırı
- media asset reference sınırı
- review / Q&A / interaction read-only sınırı
- cart mutation’ın cart owner’da kalması
- owner boundary review

---

## 5. Boundary Review Sonuçları

### Product

PASS

PDP product truth üretmez. Ürün bilgisi read model üzerinden taşınır.

### Price

PASS

Fiyat alanları projection olarak temsil edilmiştir. Fiyat truth merkezi fiyat sisteminde kalır.

### Stock

PASS

Stok alanları projection olarak temsil edilmiştir. Stok truth merkezi stok sisteminde kalır.

### Campaign

PASS

Kampanya projection olarak ele alınmıştır. Kampanya truth PDP’ye taşınmamıştır.

### Coupon

PASS

PDP kupon truth üretmez.

### Cart

PASS

PDP sepete ekleme aksiyonunu başlatabilir; cart mutation cart/commerce owner’da kalır.

### Review / Rating

PASS

PDP yorum/puan truth üretmez. Read-only reference yaklaşımı korunmuştur.

### Q&A

PASS

PDP soru-cevap truth üretmez.

### Interaction

PASS

Beğen / kaydet / paylaş truth interaction owner’da kalır.

### Media

PASS

PDP media processing yapmaz; media assetId/reference taşır.

### User Story

PASS

PDP user story upload/approval truth üretmez.

### Moderation

PASS

PDP moderation kararı üretmez.

### Risk / Fraud

PASS

PDP risk/fraud kararı üretmez.

---

## 6. BFF Review

BFF route seviyesinde validation ve delegation davranışı korunmuştur.

Yapılan doğrulama:

- BFF ticari truth üretmiyor.
- BFF fiyat hesaplamıyor.
- BFF stok hesaplamıyor.
- BFF kampanya/kupon uygulamıyor.
- BFF yorum/Q&A/media/moderation/risk truth üretmiyor.
- `/catalog/pdp/:productId` route’u korunmuş, geriye uyumlu şekilde `storefrontId` desteği eklenmiştir.
- `storefrontId` olmadan PDP açılması engellenmiştir.

Sonuç: PASS

---

## 7. Web / UI Review

Web PDP bootstrap render shell olarak kalmıştır.

Yapılan doğrulama:

- UI truth üretmiyor.
- UI fiyat/stok/kampanya kararı vermiyor.
- UI yorum/Q&A/media/moderation/risk kararı vermiyor.
- UI yeni contract yapısını render edecek şekilde güncellenmiştir.

Sonuç: PASS

---

## 8. Bilinçli Kapsam Dışı Bırakılanlar

Aşağıdaki alanlar bu paket kapsamında production-ready yapılmamıştır:

- gerçek pricing service runtime projection fill
- gerçek stock service runtime projection fill
- gerçek campaign/coupon runtime entegrasyonu
- media assetId → URL dönüşüm standardı
- media readiness pipeline
- review/Q&A/story gerçek production aggregation
- moderation/risk filtered PDP feed
- analytics / PDP interaction tracking
- cache invalidation
- OpenSearch → PDP production journey hardening
- mobile PDP implementation
- personalization / recommendation / ranking

---

## 9. Açık Eksikler

### 9.1 Reference coverage limitation

PX-PDP-01 kapanış raporunda incelenen referans dosyaları dar raporlanmıştır.

Roo raporunda açıkça listelenen referanslar:

- `4-pdp sistemi.md`
- `60-KODLAMAYA HAZIRLIK YOL HARİTASI.md`
- `S01-HAVUZ_KAYIT_DOSYASI.md`

S04 için esas referans seti daha geniştir. Bu nedenle closure kararı PASS değil, PASS WITH LIMITATION verilmiştir.

### 9.2 Production integration limitation

Pricing, stock, campaign, coupon, media readiness, moderation/risk ve analytics entegrasyonları production hardening hatlarına bırakılmıştır.

### 9.3 Projection fill limitation

PDP contract projection alanları hizalanmıştır; ancak gerçek owner servislerden runtime projection fill detayları sonraki hardening paketlerinde tamamlanmalıdır.

---

## 10. Riskler

### RISK-01 — PDP’nin truth owner’a dönüşmesi

PDP ileride fiyat, stok, kampanya, yorum, Q&A, media, moderation veya risk kararlarını kendi içinde üretirse owner boundary ihlal edilir.

Durum: MONITORED

### RISK-02 — Store context zorunluluğunun gevşetilmesi

PDP’de `storefrontId` zorunluluğu kaldırılır veya default context üretilirse nötr PDP riski geri döner.

Durum: MONITORED

### RISK-03 — Projection alanlarının truth gibi kullanılması

Price, stock, campaign veya media projection alanları owner state yerine kullanılmamalıdır.

Durum: MONITORED

### RISK-04 — Kampanya / kupon fiyat doğrulamasının PDP’ye taşınması

Kampanya ve kupon görünümü PDP’de olabilir; final doğrulama checkout/pricing/promotion owner tarafında kalmalıdır.

Durum: MONITORED

### RISK-05 — Sosyal kanıtların filtresiz PDP’ye taşınması

Yorum, Q&A, user story ve interaction sinyalleri moderation/risk süzgeci olmadan production PDP’ye taşınmamalıdır.

Durum: MONITORED

---

## 11. Dikkat Edilecek Mimari Sınırlar

- PDP product owner değildir.
- PDP price owner değildir.
- PDP stock owner değildir.
- PDP campaign owner değildir.
- PDP coupon owner değildir.
- PDP review owner değildir.
- PDP Q&A owner değildir.
- PDP interaction owner değildir.
- PDP media owner değildir.
- PDP user story owner değildir.
- PDP moderation owner değildir.
- PDP risk owner değildir.
- PDP cart owner değildir.
- BFF truth üretmez.
- UI truth üretmez.
- Projection truth değildir.
- Event owner mutation yerine geçmez.
- Store context zorunluluğu korunur.
- Product-common ve store-context ayrımı korunur.

---

## 12. İleri Faz / Hardening Önerileri

S04 PDP Sistemi için ileri fazda aşağıdaki hatlar önemlidir:

- HARDENING-01 — Persistence Foundation Expansion
- HARDENING-03 — Owner System Integration
- HARDENING-04 — Media Readiness Integration
- HARDENING-06 — Moderation / Risk Integration
- HARDENING-07 — Search / Index Sync
- HARDENING-08 — Analytics / Notification Integration
- HARDENING-09 — BFF Smoke / Port Orchestration Standard
- HARDENING-10 — CI Build Order / Workspace Package Standardization

S04 özel hardening başlıkları:

- PDP owner-service projection fill standardı
- PDP campaign/coupon projection validation
- PDP media asset readiness mapping
- PDP review/Q&A/story aggregation hardening
- PDP storefront context smoke
- PDP analytics event taxonomy
- PDP cache invalidation strategy

---

## 13. Güncel Karar

S04 — PDP Sistemi için güncel karar:

Foundation: PASS WITH LIMITATION

Production readiness: PARTIAL

Gerekçe:

PDP Sistemi foundation seviyesinde mimari olarak hizalanmıştır. Mağaza bağlamı zorunlu hale getirilmiş, nötr PDP riski engellenmiş, product-common / store-context ayrımı contract seviyesinde netleştirilmiş, BFF ve UI truth üretmeyecek şekilde hizalanmıştır.

Source review sonucunda owner boundary ihlali raporlanmamıştır. Typecheck ve build kanıtları başarılıdır.

Ancak production readiness için gerçek pricing/stock/campaign/coupon runtime entegrasyonları, media readiness, moderation/risk filtering, analytics ve geniş referans coverage doğrulaması hardening fazına bırakılmıştır.

Bu nedenle S04 foundation kapatılır; production readiness açık kalır.

---

## 14. Sonraki Sistem

Sıradaki analiz/kayıt sistemi:

S05 — Story Sistemi

S05’e geçmeden önce S04 kayıt dosyası yukarıdaki içerikle oluşturulmalı ve PX-PDP-01 kapanış raporu 64/65 kayıtlarına işlenmelidir.