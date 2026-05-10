# PHASE-02-COMMERCE-CORE-READINESS.md

## 1. Fazın Amacı

Bu fazın amacı, Hedihup platformunun çekirdek ticaret hattını production-readiness seviyesine yaklaştırmak ve yayına hazırlık öncesinde commerce core üzerinde kalan teknik, mimari ve acceptance borçlarını net biçimde kapatmaktır.

Bu fazın ana kapsamı:

```text
Havuz → ürün kabul → varyant → fiyat → stok → PDP ticari context → sepet → checkout → ödeme hazırlığı
```

Bu faz ödeme provider canlı entegrasyonu, order handoff veya finansal settlement fazı değildir.

Bu fazın ana hedefi:

```text
Commerce core, ödeme başlatılmadan önce güvenilir, owner-boundary-safe, snapshot-aware ve validation-ready hale gelmelidir.
```

---

## 2. Fazın Kapsamı

Bu faz aşağıdaki sistemleri kapsar:

- Havuz sistemi
- Ürün kabul / onay sistemi
- Varyant sistemi
- Merkezi fiyat sistemi
- Merkezi stok sistemi
- PDP ticari context
- Klasik ürün kart sistemi
- Kategori / PLP ticari görünürlük etkisi
- Sepet sistemi
- Checkout sistemi
- Adres sistemi
- Kupon / kampanya checkout etkisi
- Guest checkout ticari istisnası
- Cart → checkout final validation
- Price / stock / coupon / campaign snapshot
- PX-HAVUZ-05 build ve boundary borcu

---

## 3. Fazın Kapsam Dışı Alanları

Bu fazda yapılmayacak işler:

- Canlı PayTR entegrasyonu
- Payment callback processing
- Reconciliation production runtime
- Payment succeeded → order handoff
- Order creation implementation
- Shipment / delivery lifecycle
- Refund execution
- Settlement / payout
- Reward point ledger
- Full frontend UX polish
- Full critical journey acceptance

Bu faz, ödeme başlatılmadan önceki commerce hazırlık hattını kapatır.

---

## 4. Referans Sistem Dosyaları

Bu fazda esas alınacak sistem dosyaları:

1. `1-havuz sistemi.md`
2. `4-pdp sistemi.md`
3. `8-klasik ürün kart sistemi.md`
4. `10-kategori-plp sistemi.md`
5. `13-sepet sistemi.md`
6. `14-checkout sistemi.md`
7. `24-adres sistemi.md`
8. `26-varyant sistemi.md`
9. `27-merkezi stok sistemi.md`
10. `28-ürün kabul onay sistemi.md`
11. `29-merkezi fiyat sistemi.md`
12. `35-kampanya sistemi.md`
13. `46-kupon sistemi.md`
14. `52-kategori taksonomi sistemi.md`

Dolaylı referanslar:

- `25-kural -yetki sistemi.md`
- `OWNER_MATRIX.md`
- `GUARD_MATRIX.md`
- `PERMISSION_MATRIX.md`
- `TRANSITION_POLICIES.md`
- `CRITICAL_JOURNEY_CHECKLIST.md`
- `ACCEPTANCE_CRITERIA_PACK.md`
- `TEST_STRATEJISI.md`

---

## 5. Referans Kayıt Dosyaları

Bu fazda özellikle şu kayıtlar dikkate alınır:

- `63-IMPLEMENTATION_PROGRESS_MASTER_BIRLESTIRILMIS.md`
- `64-PACKAGE_EXECUTION_LOG_BIRLESTIRILMIS.md`
- `65-ACTIVE_RISKS_AND_DECISIONS-CONSOLIDATED.md`
- `HARDENING-00-05E-CONSOLIDATED-REFERENCE-RECORD.md`
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

Kayıtlara göre bu faz başlamadan önce commerce core alanında yapılmış ana işler şunlardır.

### 6.1 Catalog / PDP Read Foundation

- P08 — Catalog / PDP Read Foundation — PASS
- HARDENING-07A1 — Catalog Read Projection Foundation — PASS WITH LIMITATION
- HARDENING-07A2 — PDP / PLP Read Hardening & Smoke — PASS WITH LIMITATION

Mevcut anlam:

```text
PDP ve catalog read foundation var; ancak real-time price/stock/media projection sync ve production surface doğrulaması ayrıca gerekir.
```

### 6.2 Cart Foundation

- P09 — Cart Foundation — PASS
- P35 — Cart / Checkout Persistence Foundation — PASS
- HARDENING-03 / 03B core commerce journey ve persistence doğrulamaları

Mevcut anlam:

```text
Cart foundation ve persistence hattı vardır.
Ancak production checkout öncesi final validation ve conflict behavior ayrıca doğrulanmalıdır.
```

### 6.3 Pricing Foundation

- P10 — Pricing Foundation — PASS
- PX-HAVUZ-02 — Commercial Pool Foundation — PASS

Mevcut anlam:

```text
Fiyat foundation vardır; ancak campaign / coupon / snapshot / finance impact ilişkisi production-readiness seviyesinde doğrulanmalıdır.
```

### 6.4 Stock Foundation

- P11 — Stock Foundation — PASS

Mevcut anlam:

```text
Stock foundation vardır; ancak reservation, final validation, oversell guard ve supplier stock update production davranışı ayrıca doğrulanmalıdır.
```

### 6.5 Checkout Foundation

- P12 — Checkout Foundation — PASS
- P35 — Cart / Checkout Persistence Foundation — PASS
- HARDENING-03 / 03B core commerce journey durability

Mevcut anlam:

```text
Checkout foundation vardır; ancak checkout ready_for_payment state’i, stale cart, stock conflict, price conflict, coupon conflict ve guest checkout davranışları production-readiness seviyesinde kapatılmalıdır.
```

### 6.6 Havuz / Product Acceptance PX Hattı

Kayıtlara göre:

- PX-HAVUZ-01 — Pool / Product Acceptance Foundation — PASS
- PX-HAVUZ-02 — Commercial Pool Foundation — PASS
- PX-HAVUZ-03 — Binding / Activation Foundation — PASS
- PX-HAVUZ-03-R — Runtime Module Resolution Fix — PASS
- PX-HAVUZ-04 — Supplier Intake + Admin Review Surface Hardening — PASS
- PX-HAVUZ-05 — Creator Store Commercial Product Binding — PARTIAL

Kritik not:

```text
PX-HAVUZ-05 PASS gibi ele alınamaz.
```

### 6.7 Address / Checkout Eligibility

- PX-KULLANICI-03 — Customer Address / Checkout Eligibility — PASS

Mevcut anlam:

```text
Adres / checkout eligibility foundation vardır; ancak address snapshot, guest address ve delivery suitability production flow içinde doğrulanmalıdır.
```

---

## 7. Önceden Ertelenmiş / Sınırlı Bırakılmış İşler

Bu faz açısından açık kalan limitation ve borçlar:

1. PX-HAVUZ-05 build hatası / PARTIAL durumu
2. Real-time pricing / stock / media projection sync borcu
3. Dynamic PLP/facet ve taxonomy owner borcu PHASE-07’ye bağlıdır
4. Guest checkout commerce istisnasının sosyal hak açmaması tekrar doğrulanmalıdır
5. Cart/checkout validation conflict case’leri production acceptance gerektirir
6. Coupon/campaign sponsor impact checkout/order snapshot ile doğrulanmalıdır
7. Supplier stock/base price update ve product acceptance paneli PHASE-08 ile bağlıdır
8. Checkout → payment yalnız validated checkout context üzerinden başlamalıdır
9. Payment provider canlı entegrasyonu PHASE-03’e aittir
10. Order handoff PHASE-03/04 konusudur

---

## 8. Bu Fazda Yapılacak İşler

### 8.1 PX-HAVUZ-05 PARTIAL Borcunun Kontrolü

Yapılacaklar:

- PX-HAVUZ-05 kayıt dosyası tekrar kontrol edilecek
- `ListSupplierSubmittedProductsQuery` kaynaklı build hatası incelenecek
- Contract/type uyuşmazlığı varsa düzeltme kapsamı belirlenecek
- Creator store commercial product binding owner boundary kontrol edilecek
- Build ve smoke kanıtı alınmadan PASS verilmeyecek

Kapanış beklentisi:

```text
PX-HAVUZ-05 ya PASS’a çevrilmeli ya da PHASE-02 PARTIAL kalmalıdır.
```

---

### 8.2 Havuz → Commercial Pool → Creator Binding Kontrolü

Kontrol edilecek:

- Supplier submitted product ile accepted product ayrımı
- Approved ≠ active ayrımı
- Commercial pool activation / suspension / archive davranışı
- Creator store product binding’in global product truth’u değiştirmemesi
- Creator yalnız izinli havuz ürünlerini kendi mağaza bağlamına alabilmeli
- Creator mağaza context’i global price/stock truth’u mutate etmemeli

Beklenen sonuç:

```text
Havuz truth, creator storefront context ve commercial pool statüleri karışmamalıdır.
```

---

### 8.3 Product Acceptance / Admin Review Boundary

Kontrol edilecek:

- Supplier product submission owner sınırı
- Admin review protected action modeli
- Panel direct write var mı?
- Ürün kabul / red / revision request lifecycle
- Product acceptance sonrası commercial pool readiness
- Category/taxonomy dependency

Beklenen sonuç:

```text
Tedarikçi ürün girdisi sağlar; nihai onay platform/admin owner command ile yapılır.
```

---

### 8.4 Variant Readiness Kontrolü

Kontrol edilecek:

- Variant, sellable unit olarak doğru ayrılmış mı?
- PDP variant selection zorunluluğu çalışıyor mu?
- Cart line variant olmadan oluşuyor mu?
- Variant stock ve price relation doğru mu?
- Variant snapshot checkout/order hazırlığında doğru taşınıyor mu?
- Invalid variant deterministic error veriyor mu?

Beklenen sonuç:

```text
Varyant eksik veya geçersizse cart/checkout ilerlememelidir.
```

---

### 8.5 Price Readiness Kontrolü

Kontrol edilecek:

- Base price / platform margin / sale price ayrımı
- Commercial pool price corridor
- Creator price/campaign influence sınırı
- Checkout price snapshot
- Price changed conflict behavior
- Coupon/campaign discount sonrası final amount
- Price truth UI veya BFF tarafından üretiliyor mu?

Beklenen sonuç:

```text
Fiyat truth merkezi owner alanında kalmalıdır.
Checkout price snapshot deterministik olmalıdır.
```

---

### 8.6 Stock Readiness Kontrolü

Kontrol edilecek:

- Stock truth owner sınırı
- PDP/PLP stock projection ile checkout final stock validation ayrımı
- Add-to-cart stok garantisi vermiyor mu?
- Checkout final validation stok conflict üretiyor mu?
- Reservation varsa lifecycle net mi?
- Oversell guard var mı?
- Supplier stock update panel direct write yaratıyor mu?

Beklenen sonuç:

```text
PDP/PLP stock visibility final reservation guarantee değildir.
Checkout final validation zorunludur.
```

---

### 8.7 Cart Readiness Kontrolü

Kontrol edilecek:

- Guest cart / authenticated cart ayrımı
- Cart line duplicate-safe davranışı
- Quantity validation
- Invalid product / inactive product / archived product behavior
- Store context / creator context cart line’a doğru yansıyor mu?
- Cart price snapshot mı, yoksa checkout aşamasında mı kesinleşiyor?
- Cart → checkout transition’da stale cart behavior

Beklenen sonuç:

```text
Cart satın alma niyetidir; final commerce truth checkout validation ile kapanır.
```

---

### 8.8 Checkout Readiness Kontrolü

Kontrol edilecek:

- Checkout draft / review context
- Ready_for_payment benzeri state
- Checkout expired behavior
- Stock conflict behavior
- Price conflict behavior
- Coupon/campaign conflict behavior
- Address prerequisite
- Guest checkout minimum identity/contact requirement
- Payment initiation yalnız validated checkout context’inden başlıyor mu?

Beklenen sonuç:

```text
Checkout ready olmadan payment başlatılamaz.
```

---

### 8.9 Address / Delivery Suitability Kontrolü

Kontrol edilecek:

- Registered address vs guest address ayrımı
- Address snapshot
- Delivery suitability
- Shipping region/constraint
- Order sonrası adres değişimi eski order snapshot’ını etkilememeli
- Address validation fail checkout’u durdurmalı

Beklenen sonuç:

```text
Address truth ve order address snapshot karıştırılmamalıdır.
```

---

### 8.10 Coupon / Campaign Checkout Impact Kontrolü

Kontrol edilecek:

- Kupon sponsor modeli
- Platform coupon vs creator coupon ayrımı
- Coupon uygulanmadan önce “indirimi kim taşıyor?” kararı
- Checkout discount snapshot
- Coupon limit / usage / abuse guard
- Coupon finance impact PHASE-05’e doğru taşınıyor mu?
- Campaign ve coupon aynı sistem davranışı gibi karıştırılıyor mu?

Beklenen sonuç:

```text
Kupon indirimi rastgele satış fiyatından düşülmemeli; sponsor etkisi açık olmalıdır.
```

---

### 8.11 Commerce Critical Journey Kontrolü

Bu fazda minimum şu journey parçaları kontrol edilir:

1. Search / PLP → PDP ticari context
2. PDP → Cart
3. Cart → Checkout
4. Checkout → Payment readiness

Tam payment / order acceptance PHASE-03 ve PHASE-04’e bırakılır.

---

## 9. Bu Fazda Yapılmayacak İşler

Bu fazda bilinçli olarak yapılmayacaklar:

- PayTR live integration
- Payment callback processing
- Payment reconciliation production runtime
- Payment succeeded → order handoff
- Order creation
- Shipment operation
- Refund execution
- Settlement / payout
- Reward point ledger
- Full creator/supplier/admin panel production UI
- Full frontend visual polish
- PHASE-11 full critical journey acceptance

---

## 10. Owner / Guard / Permission Kuralları

### 10.1 Owner Boundary

Bu fazda korunacak owner sınırları:

- Cart / checkout commerce truth M2 alanındadır
- Price truth merkezi price/commerce owner alanında kalır
- Stock truth merkezi stock/commerce owner alanında kalır
- BFF price/stock/cart/checkout truth üretmez
- UI final price/stock truth üretmez
- Supplier product/stock/base price girdisi sağlar; nihai ticari otorite platformdadır
- Creator mağaza context’i global product/fiyat/stok truth’u değiştirmez
- Admin panel protected owner command gönderir; direct DB/state write yapmaz

### 10.2 Guard Kontrolleri

Bu fazda uygulanması gereken guard aileleri:

- auth guard
- role/scope guard
- ownership guard
- eligibility guard
- state/lifecycle guard
- risk/financial block guard
- idempotency guard

### 10.3 Permission Kontrolleri

- Guest add-to-cart yapabilir; bu sosyal write hakkı değildir
- Guest checkout kontrollü commerce istisnasıdır
- Creator store product binding yalnız kendi mağaza scope’unda geçerlidir
- Supplier stock/base price update ticari satış fiyatı belirleme hakkı değildir
- Admin permission direct owner write hakkı değildir

### 10.4 Transition Kontrolleri

Bu fazda korunacak ayrımlar:

- PDP view ≠ cart write
- cart intent ≠ checkout ready
- checkout ready ≠ payment confirmed
- payment initiation ≠ order created
- approved product ≠ active commercial product
- commercial pool active ≠ creator store bound
- cart stock visibility ≠ reserved stock
- coupon applied ≠ finance settlement completed

---

## 11. Riskler

### 11.1 RB-006 — PX-HAVUZ-05 PARTIAL Build Borcu

Bu fazın ana blocker’ıdır.

Eğer kapanmazsa PHASE-02 PASS kapanamaz.

### 11.2 RB-012 — Kupon / Kampanya Finansal Etki ve Abuse Kontrolü

Bu fazda commerce/checkout snapshot yönü ele alınır. Finance impact PHASE-05’e, abuse yönü PHASE-09’a devredilebilir.

### 11.3 Product / Variant / Stock / Price Projection Riski

PDP/PLP projection verisi checkout final validation yerine geçerse yanlış satış riski oluşur.

### 11.4 Guest Checkout Scope Riski

Guest checkout sosyal hak açarsa auth/permission boundary bozulur.

### 11.5 Panel Direct Write Riski

Supplier/admin/creator product actions panel direct write’a dönerse owner boundary bozulur.

---

## 12. Kabul Kriterleri

PHASE-02 kapanışı için minimum kabul kriterleri:

1. PX-HAVUZ-05 PARTIAL durumu incelenmiş ve karara bağlanmış olmalı
2. Havuz → commercial pool → creator binding ayrımı doğrulanmalı
3. Product acceptance owner/admin boundary doğrulanmalı
4. Variant validation doğrulanmalı
5. Price snapshot ve price conflict behavior doğrulanmalı
6. Stock final validation ve stock conflict behavior doğrulanmalı
7. Cart duplicate-safe ve invalid product behavior doğrulanmalı
8. Checkout ready_for_payment state’i doğrulanmalı
9. Address snapshot / guest address behavior doğrulanmalı
10. Coupon/campaign checkout impact en az minimum scope’ta doğrulanmalı
11. Guest checkout sosyal hak açmamalı
12. BFF/UI truth üretmemeli
13. Commerce core için targeted smoke/test kanıtı alınmalı
14. Risk register ve release blocker register güncellenmeli

---

## 13. Test / Smoke / Runtime Kanıtları

Bu faz kod/source etkili fazdır. Bu nedenle yalnız dokümantasyon yeterli değildir.

Minimum önerilen kanıtlar:

```text
- source review
- boundary review
- pnpm run typecheck
- pnpm run build
- targeted commerce smoke
- cart → checkout scenario
- stock conflict scenario
- price conflict scenario
- invalid variant scenario
- guest checkout guard scenario
- coupon/campaign minimum scenario
```

Eğer kod değişikliği yapılmadıysa ve yalnız analiz yapıldıysa:

```text
PHASE-02 PASS verilemez.
En fazla PARTIAL veya READY FOR IMPLEMENTATION kararı verilebilir.
```

Çünkü bu faz gerçek commerce readiness fazıdır.

---

## 14. Kapanış Kontrol Listesi

```text
[ ] PX-HAVUZ-05 PARTIAL build borcu kontrol edildi
[ ] Havuz → commercial pool → creator binding kontrol edildi
[ ] Product acceptance / admin review boundary kontrol edildi
[ ] Variant validation kontrol edildi
[ ] Price snapshot / price conflict kontrol edildi
[ ] Stock final validation / stock conflict kontrol edildi
[ ] Cart duplicate-safe behavior kontrol edildi
[ ] Checkout final validation kontrol edildi
[ ] Checkout ready_for_payment state kontrol edildi
[ ] Address snapshot kontrol edildi
[ ] Guest checkout scope kontrol edildi
[ ] Coupon/campaign checkout impact kontrol edildi
[ ] BFF truth üretmiyor kontrol edildi
[ ] UI truth üretmiyor kontrol edildi
[ ] Panel direct write yok kontrol edildi
[ ] Owner / guard / permission boundary kontrol edildi
[ ] Targeted test/smoke kanıtı alındı
[ ] RB-006 güncellendi
[ ] RB-012 güncellendi
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

Ancak pratikte ilk kapanış için en olası karar:

```text
PASS WITH LIMITATION
```

Çünkü kupon/kampanya finansal impact, taxonomy/facet, full frontend UX veya supplier/admin panel detayları sonraki fazlara bilinçli devredilebilir.

### PASS Şartı

- PX-HAVUZ-05 kapandı
- Commerce core validation zinciri çalışıyor
- Release blocker yok
- Targeted smoke/test PASS
- Owner boundary ihlali yok

### PASS WITH LIMITATION Şartı

- Commerce core ana akışı çalışıyor
- Bazı finance, taxonomy, panel veya frontend detayları ilgili fazlara devredilmiş
- Release blocker kalmamış veya bu faz kapsamı dışında kontrollü devredilmiş

### PARTIAL Şartı

- PX-HAVUZ-05 kapanmadı
- Cart/checkout validation eksik
- Stock/price conflict behavior belirsiz
- Test kanıtı eksik

### FAIL Şartı

- Build/typecheck fail
- Owner boundary ihlali
- Checkout invalid state ile payment açıyor
- BFF/UI truth üretiyor
- Guest checkout sosyal hak açıyor

---

## 16. Sonraki Faza Devredenler

PHASE-03’e devredenler:

- Payment provider live/sandbox doğrulama
- Checkout → payment provider initiation
- Payment unknown_result / reconciliation
- Payment succeeded → order handoff

PHASE-05’e devredenler:

- Coupon/campaign finance impact
- Settlement effect
- Reward point lifecycle
- Refund adjustment

PHASE-07’ye devredenler:

- Taxonomy owner
- Dynamic facets
- PLP/search grid merge
- Search index production sync

PHASE-08’e devredenler:

- Supplier panel product upload/stock/base price UI
- Admin product approval/revision flow
- Creator product binding panel UX

PHASE-10’a devredenler:

- Full frontend storefront UX
- Mobile checkout UX
- PDP/PLP/cart/checkout visual polish

---

## 17. Nihai Faz Açılış Kararı

PHASE-02 şu şartla başlatılabilir:

```text
PHASE-01 owner boundary review en az PASS WITH LIMITATION olarak kapanmış olmalıdır.
```

Eğer PHASE-01 kapanmadan PHASE-02’ye geçilecekse, bu yalnız planlama seviyesiyle sınırlı tutulmalıdır.

Net açılış kararı:

```text
PHASE-02 Commerce Core Readiness planı hazırdır.
Gerçek uygulama / kapanış için repo source review ve targeted test kanıtı gereklidir.
```
