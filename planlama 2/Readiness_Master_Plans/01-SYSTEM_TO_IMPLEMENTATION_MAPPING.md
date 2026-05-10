# 01-SYSTEM_TO_IMPLEMENTATION_MAPPING.md

## 1. Dosyanın Amacı

Bu dosya, Hedihup platformunun 54 sistem dosyasını yüklenen uygulama ve hardening kayıtlarıyla eşleştiren resmi production-readiness mapping dosyasıdır.

Bu dosyanın amacı:

- her sistem dosyasının hedeflediği platform davranışını mevcut kayıtlarla karşılaştırmak
- hangi alanların kodlandığını, hangilerinin yalnız foundation seviyesinde kaldığını görmek
- ertelenenleri, eksikleri, riskleri ve release blocker adaylarını ayırmak
- yeni production-readiness faz planının hangi sistem gerçekliğine dayanacağını sabitlemek
- tekrar iş üretimini ve yapılmış işin eksik sanılmasını engellemektir

Bu dosya kod source review raporu değildir. Bu dosya, yüklenen sistem dosyaları ve kayıt dosyaları üzerinden hazırlanmış resmi eşleştirme başlangıç kaydıdır.

---

## 2. Kullanılan Kaynak Grupları

### 2.1 Sistem Dosyaları

1–54 arası sistem dosyaları platformun hedef mimarisini, iş kurallarını, aktör sınırlarını ve sistem davranışlarını tanımlar.

### 2.2 Kayıt Dosyaları

Bu mapping dosyasında özellikle şu kayıt grupları dikkate alınmıştır:

- `63-IMPLEMENTATION_PROGRESS_MASTER_BIRLESTIRILMIS.md`
- `64-PACKAGE_EXECUTION_LOG_BIRLESTIRILMIS.md`
- `65-ACTIVE_RISKS_AND_DECISIONS-CONSOLIDATED.md`
- `HARDENING-00-05E-CONSOLIDATED-REFERENCE-RECORD.md`
- `HARDENING-06-07-CONSOLIDATED-REFERENCE-RECORD.md`
- `HARDENING-08-09-CONSOLIDATED-REFERENCE-RECORD.md`
- `HARDENING-10-CALLBACK-DECISION-INDEX.md`
- `HARDENING-10-CALLBACK-MASTER-REFERENCE.md`
- `HARDENING-10C10 — PayTR Status Inquiry / Payment Reconciliation Birleşik Referans Dosyası`
- `PX_DOMAIN_IMPLEMENTATION_REFERENCE_RECORD.md`

### 2.3 Anayasal Kaynaklar

- `OWNER_MATRIX.md`
- `GUARD_MATRIX.md`
- `PERMISSION_MATRIX.md`
- `TRANSITION_POLICIES.md`
- `DEFINITION_OF_DONE.md`
- `ACCEPTANCE_CRITERIA_PACK.md`
- `CRITICAL_JOURNEY_CHECKLIST.md`
- `TEST_STRATEJISI.md`

---

## 3. Okuma Kuralları

### 3.1 Foundation ≠ Production Ready

Bir sistem için foundation veya hardening yapılmış olması, o sistemin yayın hazır olduğu anlamına gelmez.

### 3.2 PASS WITH LIMITATION Mutlaka Açılır

PASS WITH LIMITATION olan kayıtlar, limitation kapanmadan production-ready kabul edilmez.

### 3.3 PARTIAL PASS Sayılmaz

PARTIAL kayıtlar doğrudan teknik borç veya faz içi öncelikli doğrulama maddesidir.

### 3.4 Kayıt Yoksa Uydurma Yok

Bir sistem için doğrudan uygulama kaydı bulunamazsa “NOT FULLY VERIFIED” veya “KAYIT NET DEĞİL” yazılır.

### 3.5 Kritik Kırmızı Çizgiler

Aşağıdaki sınırlar her sistemde korunur:

- owner dışı write yok
- BFF truth owner değildir
- panel direct write yapmaz
- UI truth üretmez
- event / audit / outbox business mutation değildir
- payment succeeded order created değildir
- settled payable değildir
- payable paid out değildir

---

## 4. Durum Etiketleri

| Etiket | Anlam |
|---|---|
| FOUNDATION DONE | Temel contract/service/BFF/smoke seviyesi yapılmış |
| HARDENED WITH LIMITATIONS | Hardening yapılmış ama üretim borçları var |
| DOMAIN FOUNDATION DONE | Belirli domain için izole foundation yapılmış |
| PARTIAL | Kayıt açıkça tam kapanmadığını söylüyor |
| NOT FULLY VERIFIED | Kayıtlarda doğrudan yeterli kanıt yok |
| READINESS NEEDED | Production-readiness fazında kapatılması gerekiyor |
| RELEASE BLOCKER AREA | Yayına çıkış öncesi mutlaka kapanması gereken alan |

---

## 5. Genel Baseline Kararı

Mevcut kayıtlar platformun foundation-level release candidate seviyesine geldiğini; fakat production-ready ilan edilmediğini gösterir.

P01–P52 foundation coding roadmap kapanmıştır. Ancak production-readiness için provider entegrasyonları, full E2E acceptance, deployment automation, secrets/config hardening, observability ve worker reliability gibi alanlar ayrı fazlarda ele alınmalıdır.

HARDENING-10C10 sonrası payment reconciliation hattı artık “yok” değildir. PayTR status inquiry mapping, reconciliation task/repository, worker dry-run, controlled payment mutation, audit/outbox evidence ve no-order-handoff validation yapılmıştır. Ancak canlı PayTR request, production worker runtime, scheduler/queue, order handoff, finance/risk mutation ve real sandbox E2E hâlâ açık limitation olarak kalır.

---

## 6. Sistem Bazlı Mapping Tablosu

### 1. Havuz Sistemi

**Sistem Alanı:** Havuz / ürün kabul / ticari havuz

**Kayıtlarda Yapılanlar:**
PX-HAVUZ-01 PASS; PX-HAVUZ-02 PASS; PX-HAVUZ-03 PASS; PX-HAVUZ-03-R PASS; PX-HAVUZ-04 PASS; PX-HAVUZ-05 PARTIAL. P08/P10/P11/P27/P30/P42+ hatları dolaylı bağlanır.

**Eksik / Ertelenen / Riskli Alanlar:**
PX-HAVUZ-05 build hatası; bazı erken paketlerde in-memory store; gerçek supplier/admin production runtime ve kalıcı akışlar faz içinde doğrulanmalı.

**Production-Readiness Faz Bağlantısı:**
PHASE-02 Commerce Core; PHASE-08 Admin/Creator/Supplier Panels

**Mapping Kararı:** FOUNDATION + PX PARTIAL

---

### 2. Fenomen Mağaza Sistemi

**Sistem Alanı:** Creator storefront / mağaza vitrini / ürün seçki / post/follow

**Kayıtlarda Yapılanlar:**
P28 Storefront Foundation PASS; P25 Follow Feed PASS; P29 Story PASS; PX-FENOMEN-02 PASS; PX-FENOMEN-05 PASS.

**Eksik / Ertelenen / Riskli Alanlar:**
Fenomen panel olgunluğu, mağaza ürün yönetimi production UI, satış/performans görünürlüğü ve bazı medya/story operasyonları faz içinde doğrulanmalı.

**Production-Readiness Faz Bağlantısı:**
PHASE-06 Social/Content; PHASE-08 Panels

**Mapping Kararı:** FOUNDATION DONE / READINESS NEEDED

---

### 3. Kullanıcı / Müşteri Sistemi

**Sistem Alanı:** Shopper identity, guest/registered boundary, contribution, order visibility

**Kayıtlarda Yapılanlar:**
P05 Auth/Session PASS; P06 Access/Permission PASS; P07 Protected Action PASS; PX-KULLANICI-02..07 PASS.

**Eksik / Ertelenen / Riskli Alanlar:**
Birçok capability/eligibility foundation seviyesinde; gerçek domain mutation ve auth/session merkezi entegrasyonu faz içinde doğrulanmalı.

**Production-Readiness Faz Bağlantısı:**
PHASE-01 Architecture Boundary; PHASE-02 Commerce; PHASE-06 Social

**Mapping Kararı:** FOUNDATION + DOMAIN HARDENED

---

### 4. PDP Sistemi

**Sistem Alanı:** Mağaza bağlamlı ürün karar yüzeyi

**Kayıtlarda Yapılanlar:**
P08 Catalog/PDP Read Foundation PASS; HARDENING-07A1/07A2 Catalog/PDP/PLP Read Hardening PASS WITH LIMITATION.

**Eksik / Ertelenen / Riskli Alanlar:**
Gerçek fiyat/stok/media projection sync, dynamic facets ve tam PDP surface maturity production-readiness borcu.

**Production-Readiness Faz Bağlantısı:**
PHASE-02 Commerce Core; PHASE-07 Search/Catalog

**Mapping Kararı:** FOUNDATION HARDENED / LIMITATIONS

---

### 5. Story Sistemi

**Sistem Alanı:** Fenomen mağaza story, ürün story, kullanıcı ürün story bağlamları

**Kayıtlarda Yapılanlar:**
P29 Story Foundation PASS; P30 Media/Asset Foundation PASS; P31 Moderation PASS; PX-KULLANICI-04 contribution eligibility PASS; HARDENING-04/06 media/moderation hatları.

**Eksik / Ertelenen / Riskli Alanlar:**
Gerçek upload/transcoding/CDN/media lifecycle, panel/story surface, moderation production UI doğrulanmalı.

**Production-Readiness Faz Bağlantısı:**
PHASE-06 Social/Content/Media

**Mapping Kararı:** FOUNDATION DONE / READINESS NEEDED

---

### 6. Video Sistemi

**Sistem Alanı:** Videolu ürün kart ve medya destekli commerce surface

**Kayıtlarda Yapılanlar:**
P30 Media/Asset Foundation PASS; P29 Story Foundation PASS; HARDENING-04 media runtime/stub remediation PASS.

**Eksik / Ertelenen / Riskli Alanlar:**
Videolu ürün kartın ayrı production surface olarak tamlığı, video processing/CDN/transcoding ve mobile performance doğrulanmalı.

**Production-Readiness Faz Bağlantısı:**
PHASE-06 Social/Content/Media; PHASE-10 Frontend/UX

**Mapping Kararı:** PARTIAL TRACE / READINESS NEEDED

---

### 7. Keşfet Sistemi

**Sistem Alanı:** Açık sosyal-commerce keşif yüzeyi

**Kayıtlarda Yapılanlar:**
P25 Follow Feed Foundation PASS; P28 Storefront Foundation PASS; P29 Story Foundation PASS; P37/Ranking related foundation kayıtları dolaylı; HARDENING-07 search/catalog read hardening.

**Eksik / Ertelenen / Riskli Alanlar:**
Keşfet feed assembly, ranking/recommendation, video ağırlıklı akış ve frontend surface production-ready doğrulanmadı.

**Production-Readiness Faz Bağlantısı:**
PHASE-07 Search/Catalog/Ranking; PHASE-10 Frontend/UX

**Mapping Kararı:** FOUNDATION PARTIAL / NOT PRODUCTION READY

---

### 8. Klasik Ürün Kart Sistemi

**Sistem Alanı:** Standart ürün listeleme kartı

**Kayıtlarda Yapılanlar:**
P08 Catalog/PDP Read; P27 Category/PLP Foundation; HARDENING-07 PDP/PLP read hardening.

**Eksik / Ertelenen / Riskli Alanlar:**
Gerçek fiyat/stok/media projection ve surface/UI acceptance gerekir.

**Production-Readiness Faz Bağlantısı:**
PHASE-02 Commerce; PHASE-07 Catalog; PHASE-10 Frontend

**Mapping Kararı:** FOUNDATION DONE / READINESS NEEDED

---

### 9. Ana Sayfa Sistemi

**Sistem Alanı:** Genel vitrin, yön bulma, story/kategori/ürün blokları

**Kayıtlarda Yapılanlar:**
App shell P04; storefront/search/category/story foundations dolaylı kayıtlı.

**Eksik / Ertelenen / Riskli Alanlar:**
Ana sayfa production UI, personalization, blok yönetimi, frontend/mobile acceptance kaydı net değil.

**Production-Readiness Faz Bağlantısı:**
PHASE-10 Frontend/UX; PHASE-07 Ranking

**Mapping Kararı:** NOT FULLY VERIFIED

---

### 10. Kategori / PLP Sistemi

**Sistem Alanı:** Kategori listeleme, filtre, sıralama, ürün grid

**Kayıtlarda Yapılanlar:**
P27 Category/PLP Foundation PASS; HARDENING-07A2 PASS WITH LIMITATION.

**Eksik / Ertelenen / Riskli Alanlar:**
Dynamic facets, PLP search grid merge, taxonomy owner ve real-time projection sync açık borç.

**Production-Readiness Faz Bağlantısı:**
PHASE-07 Search/Catalog/Taxonomy

**Mapping Kararı:** FOUNDATION HARDENED / LIMITATIONS

---

### 11. Takip Sistemi

**Sistem Alanı:** Fenomen takip ve takip sayfası post akışı

**Kayıtlarda Yapılanlar:**
P25 Follow Feed Foundation PASS; PX-FENOMEN-05 Store Post/Follow Feed PASS; PX-KULLANICI-05 PASS.

**Eksik / Ertelenen / Riskli Alanlar:**
Gerçek frontend/feed surface ve notification/analytics integration doğrulanmalı.

**Production-Readiness Faz Bağlantısı:**
PHASE-06 Social; PHASE-10 Frontend

**Mapping Kararı:** FOUNDATION DONE / READINESS NEEDED

---

### 12. Arama Sistemi

**Sistem Alanı:** Yüzey duyarlı kullanıcı araması

**Kayıtlarda Yapılanlar:**
P26 Search Foundation PASS; HARDENING-07B Search BFF Smoke PASS WITH LIMITATION; HARDENING-07C Search Index Sync Projection PASS WITH LIMITATION.

**Eksik / Ertelenen / Riskli Alanlar:**
OpenSearch production ops, dynamic facets, ranking separation, category/storefront expansion ve worker reliability borcu.

**Production-Readiness Faz Bağlantısı:**
PHASE-07 Search/Catalog/Ranking

**Mapping Kararı:** FOUNDATION HARDENED / LIMITATIONS

---

### 13. Sepet Sistemi

**Sistem Alanı:** Cart intent ve checkout öncesi ticari hazırlık

**Kayıtlarda Yapılanlar:**
P09 Cart Foundation PASS; P35 Cart/Checkout Persistence Foundation PASS; HARDENING-03/03B core commerce persistence PASS.

**Eksik / Ertelenen / Riskli Alanlar:**
Guest cart/checkout production flow, price/stock final validation, frontend cart UX ve persistence consistency faz içinde doğrulanmalı.

**Production-Readiness Faz Bağlantısı:**
PHASE-02 Commerce Core; PHASE-11 Critical Journey

**Mapping Kararı:** FOUNDATION + PERSISTENCE

---

### 14. Checkout Sistemi

**Sistem Alanı:** Final validation ve payment hazırlığı

**Kayıtlarda Yapılanlar:**
P12 Checkout Foundation PASS; P35 persistence; HARDENING-03/03B core-commerce.

**Eksik / Ertelenen / Riskli Alanlar:**
Guest checkout, address, stock/price conflict, payment readiness, idempotency ve full E2E acceptance gerekir.

**Production-Readiness Faz Bağlantısı:**
PHASE-02 Commerce Core; PHASE-03 Payment

**Mapping Kararı:** FOUNDATION + PERSISTENCE / READINESS NEEDED

---

### 15. Ödeme Sistemi

**Sistem Alanı:** Payment initiation, provider, callback, reconciliation

**Kayıtlarda Yapılanlar:**
P13 PASS WITH LIMITATION; P14 payment→order foundation PASS; HARDENING-09 provider boundary PASS; HARDENING-10 callback; HARDENING-10C10 CLOSED WITH LIMITATIONS.

**Eksik / Ertelenen / Riskli Alanlar:**
Live PayTR request yok; production worker/scheduler yok; order handoff hâlâ yok; real sandbox E2E yok; reconciliation task expected amount/currency model eksikliği var.

**Production-Readiness Faz Bağlantısı:**
PHASE-03 Payment/Provider/Callback/Reconciliation

**Mapping Kararı:** ADVANCED FOUNDATION / RELEASE BLOCKER AREAS

---

### 16. Sipariş Sistemi

**Sistem Alanı:** Payment sonrası resmi order truth

**Kayıtlarda Yapılanlar:**
P14 Payment→Order Foundation PASS; P15 Order Read/Detail PASS; HARDENING-03/03B core-commerce; HARDENING-10C10 no order handoff açıkça korunmuş.

**Eksik / Ertelenen / Riskli Alanlar:**
Payment reconciliation sonrası order handoff 10C11/phase konusu; duplicate payment success→single order acceptance gerekir.

**Production-Readiness Faz Bağlantısı:**
PHASE-04 Order/Fulfillment; PHASE-03 Payment Handoff

**Mapping Kararı:** FOUNDATION DONE / HANDOFF BLOCKER

---

### 17. Kargo / Teslimat Sistemi

**Sistem Alanı:** Fulfillment, shipment, delivery, post-delivery eligibility

**Kayıtlarda Yapılanlar:**
P16 Shipment/Delivery Foundation PASS; HARDENING-09 shipment provider boundary PASS; HARDENING-03/03B persistence.

**Eksik / Ertelenen / Riskli Alanlar:**
Real carrier provider yok; delivery proof, multi-package, eligibility propagation ve frontend tracking readiness gerekli.

**Production-Readiness Faz Bağlantısı:**
PHASE-04 Order/Fulfillment/Delivery

**Mapping Kararı:** FOUNDATION DONE / PROVIDER READINESS NEEDED

---

### 18. İptal / İade Sistemi

**Sistem Alanı:** Cancel/return/refund impact

**Kayıtlarda Yapılanlar:**
P17 Cancel/Return Foundation PASS; P18 Refund Foundation PASS; hardening records finance/refund limited.

**Eksik / Ertelenen / Riskli Alanlar:**
Real refund provider yok; return/refund/settlement adjustment E2E ve finance etkisi readiness gerekli.

**Production-Readiness Faz Bağlantısı:**
PHASE-04 Return/Refund; PHASE-05 Finance

**Mapping Kararı:** FOUNDATION DONE / READINESS NEEDED

---

### 19. Bildirim Sistemi

**Sistem Alanı:** Actor bazlı notification ve delivery

**Kayıtlarda Yapılanlar:**
P19 Notification Foundation PASS; HARDENING-08B Notification guard/provider boundary PASS WITH LIMITATION; HARDENING-09 notification provider boundary PASS.

**Eksik / Ertelenen / Riskli Alanlar:**
Gerçek email/SMS/push provider, preference/consent center, webhook/callback ve realtime hardening yok.

**Production-Readiness Faz Bağlantısı:**
PHASE-09 Analytics/Notification

**Mapping Kararı:** FOUNDATION HARDENED / LIMITATIONS

---

### 20. Destek Sistemi

**Sistem Alanı:** Kullanıcı destek girişi ve resmi support

**Kayıtlarda Yapılanlar:**
P20 Support/Ticket Foundation PASS; PX-KULLANICI-07 Support/Order Visibility Boundary PASS.

**Eksik / Ertelenen / Riskli Alanlar:**
Ticket operasyonu, SLA, escalation ve frontend/help surface production readiness doğrulanmalı.

**Production-Readiness Faz Bağlantısı:**
PHASE-08 Admin/Support; PHASE-09 Risk/Fraud Escalation

**Mapping Kararı:** FOUNDATION DONE / READINESS NEEDED

---

### 21. Post Sistemi

**Sistem Alanı:** Fenomen mağaza post ve takip feed içeriği

**Kayıtlarda Yapılanlar:**
P21 Post/UGC Foundation PASS; PX-FENOMEN-05 PASS; HARDENING-06 moderation/social abuse integration.

**Eksik / Ertelenen / Riskli Alanlar:**
Full post panel UI, media, moderation queue ve notification/analytics integration doğrulanmalı.

**Production-Readiness Faz Bağlantısı:**
PHASE-06 Social/Content

**Mapping Kararı:** FOUNDATION DONE / READINESS NEEDED

---

### 22. Moderasyon Sistemi

**Sistem Alanı:** Content/behavior moderation owner boundary

**Kayıtlarda Yapılanlar:**
P31 Moderation Foundation PASS; HARDENING-06 PASS WITH LIMITATION; HARDENING-06A/06C1/06C2 related PASS.

**Eksik / Ertelenen / Riskli Alanlar:**
Full moderation panel UI, AI moderation, production idempotency/distributed rate limit ve legacy header cleanup borcu.

**Production-Readiness Faz Bağlantısı:**
PHASE-06 Social/Moderation; PHASE-09 Risk

**Mapping Kararı:** HARDENED WITH LIMITATIONS

---

### 23. Üyelik / Giriş Sistemi

**Sistem Alanı:** Auth/session/access-state

**Kayıtlarda Yapılanlar:**
P05 Auth/Session Foundation PASS; P06 Access/Permission PASS; HARDENING-05A/05B/05C/05D/05E permission hardening.

**Eksik / Ertelenen / Riskli Alanlar:**
Gerçek session/token production hardening, actor context headers cleanup ve panel route protections full validation gerekli.

**Production-Readiness Faz Bağlantısı:**
PHASE-01 Architecture Boundary

**Mapping Kararı:** FOUNDATION HARDENED / READINESS NEEDED

---

### 24. Adres Sistemi

**Sistem Alanı:** Checkout address, snapshot, guest one-time address

**Kayıtlarda Yapılanlar:**
PX-KULLANICI-03 Customer Address/Checkout Eligibility PASS; checkout/order system foundation dolaylı.

**Eksik / Ertelenen / Riskli Alanlar:**
Kalıcı adres defteri, guest address snapshot, delivery suitability ve order snapshot E2E doğrulanmalı.

**Production-Readiness Faz Bağlantısı:**
PHASE-02 Commerce; PHASE-04 Order/Delivery

**Mapping Kararı:** DOMAIN FOUNDATION DONE

---

### 25. Kural / Yetki Sistemi

**Sistem Alanı:** Owner/guard/permission enforcement

**Kayıtlarda Yapılanlar:**
P06/P07 PASS; HARDENING-05 permission hardening; OWNER/GUARD/PERMISSION matrices loaded.

**Eksik / Ertelenen / Riskli Alanlar:**
Legacy x-actor-id cleanup, dynamic permission production integration ve owner boundary source review devamlı kontrol gerektirir.

**Production-Readiness Faz Bağlantısı:**
PHASE-01 Architecture Boundary

**Mapping Kararı:** CENTRAL CONTROL / ONGOING

---

### 26. Varyant Sistemi

**Sistem Alanı:** Variant as sellable sub-unit

**Kayıtlarda Yapılanlar:**
P08 Catalog/PDP; P09 Cart; P12 Checkout; P27 PLP; product acceptance/havuz PX related.

**Eksik / Ertelenen / Riskli Alanlar:**
Variant-level stock/price/SKU/image full production flow, cart/checkout/order snapshot acceptance doğrulanmalı.

**Production-Readiness Faz Bağlantısı:**
PHASE-02 Commerce Core

**Mapping Kararı:** FOUNDATION IMPLIED / NEEDS VERIFICATION

---

### 27. Merkezi Stok Sistemi

**Sistem Alanı:** Stock truth, reservation, availability

**Kayıtlarda Yapılanlar:**
P11 Stock Foundation PASS; P12 Checkout validation; HARDENING-03/03B core commerce.

**Eksik / Ertelenen / Riskli Alanlar:**
Real reservation lifecycle, supplier stock update, variant stock, oversell guard ve projection sync readiness gerekli.

**Production-Readiness Faz Bağlantısı:**
PHASE-02 Commerce Core

**Mapping Kararı:** FOUNDATION DONE / READINESS NEEDED

---

### 28. Ürün Kabul / Onay Sistemi

**Sistem Alanı:** Supplier intake, approval, 1st/2nd pool

**Kayıtlarda Yapılanlar:**
PX-HAVUZ-01/04 PASS; tedarikçi panel/yönetim later systems.

**Eksik / Ertelenen / Riskli Alanlar:**
XML/API/manual intake, real validation, admin review UI, persistence ve PX-HAVUZ-05 PARTIAL etkisi kapanmalı.

**Production-Readiness Faz Bağlantısı:**
PHASE-02 Commerce; PHASE-08 Supplier/Admin

**Mapping Kararı:** FOUNDATION DONE / PARTIAL DEBT

---

### 29. Merkezi Fiyat Sistemi

**Sistem Alanı:** Base price, platform margin, price corridor

**Kayıtlarda Yapılanlar:**
P10 Pricing Foundation PASS; PX-HAVUZ-02 Commercial Pool PASS; campaign/coupon related foundations.

**Eksik / Ertelenen / Riskli Alanlar:**
Real pricing rules, corridor enforcement, campaign/coupon interaction, checkout price snapshot E2E doğrulanmalı.

**Production-Readiness Faz Bağlantısı:**
PHASE-02 Commerce; PHASE-05 Finance

**Mapping Kararı:** FOUNDATION DONE / READINESS NEEDED

---

### 30. Sipariş Takip Sistemi

**Sistem Alanı:** User-facing order tracking

**Kayıtlarda Yapılanlar:**
P15 Order Read/Detail PASS; P16 Shipment/Delivery PASS; PX-KULLANICI-07 visibility boundary PASS.

**Eksik / Ertelenen / Riskli Alanlar:**
Full frontend tracking surface, multi-package, delivery status, guest order access policy ve support escalation doğrulanmalı.

**Production-Readiness Faz Bağlantısı:**
PHASE-04 Delivery; PHASE-10 Frontend

**Mapping Kararı:** FOUNDATION DONE / READINESS NEEDED

---

### 31. Yorum / Puanlama Sistemi

**Sistem Alanı:** Delivered product review/rating

**Kayıtlarda Yapılanlar:**
P22 Review/Rating Foundation PASS; PX-KULLANICI-04 Contribution Eligibility PASS; P31/HARDENING-06 moderation.

**Eksik / Ertelenen / Riskli Alanlar:**
Eligibility foundation var; real delivered-line eligibility, moderation, score impact, return/refund impact E2E gerekli.

**Production-Readiness Faz Bağlantısı:**
PHASE-06 Social; PHASE-11 Critical Journey

**Mapping Kararı:** FOUNDATION DONE / READINESS NEEDED

---

### 32. Soru-Cevap Sistemi

**Sistem Alanı:** Product Q&A with platform answer authority

**Kayıtlarda Yapılanlar:**
P23 Q&A Foundation PASS; moderation hardening; PX-KULLANICI-04 contribution eligibility.

**Eksik / Ertelenen / Riskli Alanlar:**
Supplier draft answer/admin approval flow, PDP common product Q&A surface and moderation production UI doğrulanmalı.

**Production-Readiness Faz Bağlantısı:**
PHASE-06 Social; PHASE-08 Admin/Supplier

**Mapping Kararı:** FOUNDATION DONE / READINESS NEEDED

---

### 33. Beğen / Kaydet / Paylaş Sistemi

**Sistem Alanı:** Common interaction signals

**Kayıtlarda Yapılanlar:**
P24 Interaction Foundation PASS; P24 Source Review Fix PASS; HARDENING-06C2 abuse signals.

**Eksik / Ertelenen / Riskli Alanlar:**
Fraud/abuse protection, frontend surfaces and analytics/ranking signal integration readiness needed.

**Production-Readiness Faz Bağlantısı:**
PHASE-06 Social; PHASE-09 Risk/Analytics

**Mapping Kararı:** FOUNDATION HARDENED

---

### 34. Kullanıcı Story Sistemi

**Sistem Alanı:** Delivered product story eligibility/social proof

**Kayıtlarda Yapılanlar:**
P29 Story; PX-KULLANICI-04 Contribution Eligibility PASS; P30 Media; P31 Moderation.

**Eksik / Ertelenen / Riskli Alanlar:**
Upload/processing/moderation, eligibility per delivered line, reward point linkage and PDP/store visibility E2E needed.

**Production-Readiness Faz Bağlantısı:**
PHASE-06 Social/Media; PHASE-11 Critical Journey

**Mapping Kararı:** FOUNDATION DONE / READINESS NEEDED

---

### 35. Kampanya Sistemi

**Sistem Alanı:** Platform-controlled campaign regime

**Kayıtlarda Yapılanlar:**
P10 Pricing; P? campaign not clearly separately recorded in P summary; coupon/finance related.

**Eksik / Ertelenen / Riskli Alanlar:**
Distinct campaign system implementation kaydı net değil; price/visibility/checkout snapshot/readiness fazda doğrulanmalı.

**Production-Readiness Faz Bağlantısı:**
PHASE-02 Commerce; PHASE-05 Finance

**Mapping Kararı:** NOT FULLY VERIFIED

---

### 36. Beğeniler / Kaydet Sayfaları Sistemi

**Sistem Alanı:** Personal liked/saved product pages

**Kayıtlarda Yapılanlar:**
P24 Interaction Foundation; user surface record direct not found.

**Eksik / Ertelenen / Riskli Alanlar:**
Frontend personal pages, privacy, product list projection and interaction consistency not verified.

**Production-Readiness Faz Bağlantısı:**
PHASE-10 Frontend; PHASE-06 Social

**Mapping Kararı:** NOT FULLY VERIFIED

---

### 37. Öneri / Sıralama Sistemi

**Sistem Alanı:** Ranking/recommendation owner

**Kayıtlarda Yapılanlar:**
HARDENING-07 notes ranking/recommendation remains separate owner package; P? ranking foundation not clearly evidenced.

**Eksik / Ertelenen / Riskli Alanlar:**
Ranking/recommendation production implementation, feed assembly, suppression/boost, signal store and fallback not ready.

**Production-Readiness Faz Bağlantısı:**
PHASE-07 Ranking/Recommendation

**Mapping Kararı:** OPEN / MAJOR READINESS GAP

---

### 38. Puan Market Sistemi

**Sistem Alanı:** Reward points spend market

**Kayıtlarda Yapılanlar:**
PX-KULLANICI-06 reward eligibility PASS; reward/points foundation references.

**Eksik / Ertelenen / Riskli Alanlar:**
Actual point market catalog, spend transaction, stock, address/shipping and fraud controls not verified.

**Production-Readiness Faz Bağlantısı:**
PHASE-05 Finance/Rewards; PHASE-10 Frontend

**Mapping Kararı:** NOT FULLY VERIFIED

---

### 39. Ödül Puan Sistemi

**Sistem Alanı:** Earn/vest/spendable points lifecycle

**Kayıtlarda Yapılanlar:**
PX-KULLANICI-06 Customer Points/Reward Eligibility Foundation PASS.

**Eksik / Ertelenen / Riskli Alanlar:**
Actual ledger-like point lifecycle, pending/vested/spendable, revoke on return/refund and admin controls need readiness.

**Production-Readiness Faz Bağlantısı:**
PHASE-05 Finance/Rewards; PHASE-09 Risk

**Mapping Kararı:** FOUNDATION ELIGIBILITY / NEEDS LEDGER READINESS

---

### 40. Admin Sistemi

**Sistem Alanı:** Central governance/control tower

**Kayıtlarda Yapılanlar:**
Admin/panel shell P04; hardening route protection; PX/admin review surfaces for pool; many admin concepts in records.

**Eksik / Ertelenen / Riskli Alanlar:**
Full admin modules, dashboards, moderation/support/finance/operator workflows and audit-backed protected actions not fully verified.

**Production-Readiness Faz Bağlantısı:**
PHASE-08 Admin/Panel

**Mapping Kararı:** PARTIAL / LARGE READINESS AREA

---

### 41. Fenomen Yönetim Sistemi

**Sistem Alanı:** Creator lifecycle management

**Kayıtlarda Yapılanlar:**
PX-FENOMEN domain; P28 Storefront; route protection hardening.

**Eksik / Ertelenen / Riskli Alanlar:**
Creator application lifecycle, category permission, suspension/restriction and admin review UI full readiness not verified.

**Production-Readiness Faz Bağlantısı:**
PHASE-08 Creator Management

**Mapping Kararı:** FOUNDATION PARTIAL

---

### 42. Fenomen Mağaza Yönetim Paneli

**Sistem Alanı:** Creator self-service panel

**Kayıtlarda Yapılanlar:**
PX-FENOMEN-02 product management; PX-FENOMEN-05 post/follow; panel shell foundation.

**Eksik / Ertelenen / Riskli Alanlar:**
Full mobile-first creator panel, product ordering, media/story/post/message/performance screens not production verified.

**Production-Readiness Faz Bağlantısı:**
PHASE-08 Creator Panel; PHASE-10 Frontend

**Mapping Kararı:** PARTIAL / READINESS NEEDED

---

### 43. Tedarikçi Panel Sistemi

**Sistem Alanı:** Supplier product/stock/order workbench

**Kayıtlarda Yapılanlar:**
PX-HAVUZ supplier intake; supplier panel system expectation; records direct partial.

**Eksik / Ertelenen / Riskli Alanlar:**
Real XML/API/manual upload panel, stock/base price updates, order prep/shipment UI, validation and persistence readiness not fully verified.

**Production-Readiness Faz Bağlantısı:**
PHASE-08 Supplier Panel

**Mapping Kararı:** PARTIAL / READINESS NEEDED

---

### 44. Tedarikçi Yönetim Sistemi

**Sistem Alanı:** Supplier lifecycle governance

**Kayıtlarda Yapılanlar:**
PX-HAVUZ-04 admin review surface; supplier management foundation not directly confirmed.

**Eksik / Ertelenen / Riskli Alanlar:**
Application approval, category permissions, quality/penalty/suspension lifecycle and dashboards need verification.

**Production-Readiness Faz Bağlantısı:**
PHASE-08 Supplier Management

**Mapping Kararı:** NOT FULLY VERIFIED

---

### 45. Sipariş Operasyon Sistemi

**Sistem Alanı:** Internal fulfillment/order ops

**Kayıtlarda Yapılanlar:**
P43 Order Operations Foundation likely in P42-P50 line; P16 shipment/delivery; records indicate order ops hardening done but details not fully expanded here.

**Eksik / Ertelenen / Riskli Alanlar:**
Real operational queues, supplier assignment, SLA/escalation and admin ops UI readiness needed.

**Production-Readiness Faz Bağlantısı:**
PHASE-04 Order Ops; PHASE-08 Admin

**Mapping Kararı:** FOUNDATION/HARDENING TRACE / NEEDS VERIFICATION

---

### 46. Kupon Sistemi

**Sistem Alanı:** Sponsored discount/coupon layer

**Kayıtlarda Yapılanlar:**
P? coupon foundation not clearly visible; finance/settlement risk hardening related; campaign/coupon acceptance in criteria.

**Eksik / Ertelenen / Riskli Alanlar:**
Implementation record not clearly isolated; sponsor cost model, checkout snapshot, fraud guard and finance impact need mapping.

**Production-Readiness Faz Bağlantısı:**
PHASE-02 Commerce; PHASE-05 Finance; PHASE-09 Risk

**Mapping Kararı:** NOT FULLY VERIFIED / IMPORTANT

---

### 47. Finansal Mutabakat / Hakediş Sistemi

**Sistem Alanı:** Settlement, entitlement, adjustment

**Kayıtlarda Yapılanlar:**
P44 Finance Correction; P45 Settlement; P46 Payout in active line likely PASS WITH LIMITATION; hardening/provider boundary records.

**Eksik / Ertelenen / Riskli Alanlar:**
Delivery/return-based settlement finalization, coupon sponsor impact, financial ledger, payout eligibility and E2E not production-ready.

**Production-Readiness Faz Bağlantısı:**
PHASE-05 Finance/Settlement/Payout

**Mapping Kararı:** FOUNDATION/HARDENING / READINESS NEEDED

---

### 48. Arka Plan Analitik / Ölçümleme Sistemi

**Sistem Alanı:** Analytics event/metric/signal layer

**Kayıtlarda Yapılanlar:**
P48 Metrics/Analytics; HARDENING-08A2 analytics guard PASS WITH LIMITATION.

**Eksik / Ertelenen / Riskli Alanlar:**
BI/dashboard, consent/preference center, domain producer coverage and production pipeline maturity open.

**Production-Readiness Faz Bağlantısı:**
PHASE-09 Analytics/Notification

**Mapping Kararı:** FOUNDATION HARDENED / LIMITATIONS

---

### 49. Fraud / Risk / Abuse Sistemi

**Sistem Alanı:** Risk signals, fraud, abuse protection

**Kayıtlarda Yapılanlar:**
P42 Risk/Fraud Foundation; HARDENING-06B/06D PASS WITH LIMITATION.

**Eksik / Ertelenen / Riskli Alanlar:**
Full fraud scoring, auto hold/block, distributed rate limit, finance/payout abuse workflow and production review queues open.

**Production-Readiness Faz Bağlantısı:**
PHASE-09 Risk/Fraud

**Mapping Kararı:** FOUNDATION HARDENED / LIMITATIONS

---

### 50. Medya / Asset Sistemi

**Sistem Alanı:** Media upload/process/asset lifecycle

**Kayıtlarda Yapılanlar:**
P30 Media/Asset Foundation; HARDENING-04R media runtime remediation PASS.

**Eksik / Ertelenen / Riskli Alanlar:**
Real object storage/CDN/transcoding/derivatives/security scan/media moderation pipeline production readiness open.

**Production-Readiness Faz Bağlantısı:**
PHASE-06 Media; PHASE-10 Frontend

**Mapping Kararı:** FOUNDATION DONE / READINESS NEEDED

---

### 51. Arama İndeksleme Sistemi

**Sistem Alanı:** Search retrieval/index projection

**Kayıtlarda Yapılanlar:**
P26 Search; HARDENING-07C search index projection PASS WITH LIMITATION.

**Eksik / Ertelenen / Riskli Alanlar:**
OpenSearch production ops, event/outbox consumer, worker reliability, realtime sync, category/storefront expansion open.

**Production-Readiness Faz Bağlantısı:**
PHASE-07 Search/Indexing

**Mapping Kararı:** FOUNDATION HARDENED / LIMITATIONS

---

### 52. Kategori / Taksonomi Sistemi

**Sistem Alanı:** Canonical category tree/attributes/filters

**Kayıtlarda Yapılanlar:**
P27 Category/PLP; HARDENING-07 notes taxonomy owner debt.

**Eksik / Ertelenen / Riskli Alanlar:**
Taxonomy owner/admin management, attribute/filter/varyant rule sets and search/PLP integration need readiness.

**Production-Readiness Faz Bağlantısı:**
PHASE-07 Taxonomy; PHASE-08 Admin

**Mapping Kararı:** FOUNDATION PARTIAL / OWNER DEBT

---

### 53. Destek Ticket Operasyon Sistemi

**Sistem Alanı:** Ticket queues, SLA, escalation

**Kayıtlarda Yapılanlar:**
P20 Support/Ticket Foundation; PX-KULLANICI-07 visibility boundary.

**Eksik / Ertelenen / Riskli Alanlar:**
Ticket ops queues, SLA, role routing, escalation to finance/ops/moderation/risk and admin UI not fully production verified.

**Production-Readiness Faz Bağlantısı:**
PHASE-08 Support/Admin; PHASE-09 Risk

**Mapping Kararı:** FOUNDATION DONE / READINESS NEEDED

---

### 54. Payout / Ödeme Çıkış Sistemi

**Sistem Alanı:** Payable to paid_out execution

**Kayıtlarda Yapılanlar:**
Payout provider boundary HARDENING-09F PASS; finance/payout foundation in P42-P50 line; payout system records.

**Eksik / Ertelenen / Riskli Alanlar:**
Real payout provider, bank/account verification, batch runtime, retry, risk holds and payout E2E not production-ready.

**Production-Readiness Faz Bağlantısı:**
PHASE-05 Finance/Payout

**Mapping Kararı:** FOUNDATION / RELEASE BLOCKER AREA

---
## 7. İlk Kritik Çıkarımlar

### 7.1 Commerce Core Var, Ama Production Readiness Ayrı Faz İster

Cart, checkout, payment initiation, order, shipment ve persistence hattı foundation seviyesinde önemli ölçüde kurulmuştur. Ancak canlı provider, gerçek worker runtime, reconciliation/order handoff ve tam E2E acceptance eksikleri ayrıdır.

### 7.2 Payment / Reconciliation Durumu Güncellendi

HARDENING-10C10 sonrası reconciliation artık tamamen boş alan değildir. Ancak bu hat production-ready değildir. Bir sonraki kritik sınır Payment SUCCEEDED sonrası Order Handoff’tur.

### 7.3 PX-HAVUZ-05 Öncelikli Teknik Borçtur

PX-HAVUZ-05 PARTIAL olduğu için Havuz / Creator Store Commercial Product Binding alanı PASS gibi ele alınamaz. Bu build borcu production-readiness planında erken fazda kontrol edilmelidir.

### 7.4 Ranking / Recommendation ve Taxonomy Owner Borcu Önemlidir

Arama ve katalog tarafında foundation/hardening vardır; ancak ranking/recommendation ve taxonomy owner alanları ayrı readiness fazı ister.

### 7.5 Frontend / Panel / Mobile Surface Readiness Ayrı Fazdır

Birçok backend foundation yapılmış olsa da web/panel/mobile yüzeylerinin production acceptance durumu ayrı doğrulanmalıdır.

### 7.6 Provider ve Worker Runtime Alanları Release Blocker Adayıdır

Ödeme, kargo, refund, payout, notification provider’ları ve worker/scheduler/consumer runtime alanları yayına çıkmadan önce özel release gate gerektirir.

---

## 8. Sonraki Dosya Etkisi

Bu mapping dosyası aşağıdaki dosyaların girdisidir:

- `02-CURRENT_STATE_BASELINE.md`
- `03-PRODUCTION_READINESS_PHASE_MASTER_PLAN.md`
- `04-PRODUCTION_READINESS_RISK_REGISTER.md`
- `09-RELEASE_BLOCKER_REGISTER.md`
- Tüm `PHASE-XX` dosyaları

---

## 9. Kapanış Notu

Bu dosya V1 mapping kaydıdır.

Bu dosya:

- sistem dosyalarını kayıt dosyalarıyla eşleştirir
- açık eksik ve riskleri görünür hale getirir
- yeni production-readiness faz planına temel oluşturur

Bu dosya:

- kod source review yerine geçmez
- canlı runtime doğrulaması yerine geçmez
- production-ready kararı vermez

Net karar:

```text
SYSTEM_TO_IMPLEMENTATION_MAPPING V1 hazırdır.
Bir sonraki doğru dosya: 02-CURRENT_STATE_BASELINE.md
```
