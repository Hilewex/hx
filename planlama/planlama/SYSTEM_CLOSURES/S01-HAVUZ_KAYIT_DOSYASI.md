# S01 — HAVUZ SİSTEMİ KAYIT DOSYASI
## 0. Teknik Olmayan Kısa Özet

Havuz Sistemi’nin temel çalışma omurgası kurulmuştur. Tedarikçi ürün gönderebilir, platform ürünü inceleyebilir, revizyon isteyebilir, onaylayabilir veya reddedebilir. Onaylanan ürün ticari havuza alınabilir ve uygun ürün fenomen mağazasına bağlanabilir.

Bu çalışma Havuz Sistemi’nin temel foundation seviyesini tamamlar; ancak sistem henüz production-ready değildir.

Eksik kalan işler bilinçli olarak sonraya bırakılmıştır. Bunların başında kalıcı veritabanı, gerçek kullanıcı/yetki entegrasyonu, gerçek fiyat-stok-kategori-medya kontrolleri, audit kayıtları ve arama/sipariş/finans entegrasyonları gelir.

Story/video yükleme Havuz Sistemi’nin işi değildir. Bu konu Fenomen Mağaza Yönetim Paneli, Medya Sistemi ve Story Sistemi tarafında ele alınacaktır.

Güncel karar: Havuz Sistemi foundation olarak tamamlandı; production readiness için hardening paketleri gereklidir.
## 1. Sistem Özeti

Havuz Sistemi, tedarikçiden gelen ürünlerin platform tarafından kontrollü şekilde kabul edilmesini, incelenmesini, onaylanmasını, ticari havuza aktarılmasını ve uygun ürünlerin fenomen/creator mağazalarına bağlanabilir hale gelmesini yöneten merkezi ürün kabul ve ticari havuz omurgasıdır.

Bu sistemin ana ayrımı şudur:

- 1. Havuz: Tedarikçi ürün kabul / hazırlık / inceleme alanı
- 2. Havuz: Platform tarafından ticari havuza alınmış ürün alanı
- Creator/Fenomen Mağaza Bağlantısı: Ticari havuzdaki uygun ürünün fenomen mağazasına bağlanması

Havuz Sistemi ürünün ana kabul ve havuz lifecycle’ını yönetir; fiyat, stok, kategori, medya, checkout, order, finance, payout ve story/video truth alanlarının sahibi değildir.

---

## 2. Yapılan Paketler

### PX-HAVUZ-01 — Pool / Product Acceptance Foundation

**Karar:** PASS WITH LIMITATION

**Yapılanlar:**

- SupplierSubmittedProduct contract oluşturuldu.
- ProductAcceptanceStatus lifecycle kuruldu.
- Supplier ürün taslağı oluşturma akışı eklendi.
- Supplier ürün güncelleme ve incelemeye gönderme akışı eklendi.
- Admin review start / revision request / approve / reject / suspend akışları eklendi.
- BFF delegation endpointleri oluşturuldu.
- Product review decision foundation başlatıldı.

**Kapsam dışı:**

- 2. havuz
- CommercialPoolProduct
- Creator selection
- Story/video upload
- Checkout/order/search/finance entegrasyonu
- Kalıcı DB entegrasyonu

---

### PX-HAVUZ-02 — Commercial Pool Foundation

**Karar:** PASS WITH LIMITATION

**Yapılanlar:**

- CommercialPoolStatus eklendi.
- CommercializationSnapshot eklendi.
- CommercialPoolProduct modeli eklendi.
- Approved SupplierSubmittedProduct → CommercialPoolProduct geçişi kuruldu.
- Duplicate commercialize guard eklendi.
- Activate / suspend / archive transitionları eklendi.
- Pricing / stock / category / media binding status alanları bırakıldı.

**Kapsam dışı:**

- Gerçek pricing corridor
- Gerçek stock validation / reservation
- Search index
- Creator store binding
- Checkout/order/finance entegrasyonu

---

### PX-HAVUZ-03 — Pool Binding: Pricing / Stock / Category / Media

**Karar:** PASS WITH LIMITATION

**Yapılanlar:**

- PoolBindingStatus eklendi.
- PoolBindingType eklendi.
- CommercialPoolBindingSnapshot eklendi.
- bindCommercialPoolProduct fonksiyonu eklendi.
- getCommercialPoolBindingSnapshot fonksiyonu eklendi.
- canActivateCommercialPoolProduct fonksiyonu eklendi.
- activateCommercialPoolProduct içine binding guard eklendi.
- Pricing / stock / category / media binding foundation kontrolü kuruldu.

**Kural:**

CommercialPoolProduct ACTIVE yapılmadan önce tüm binding alanlarının BOUND olması gerekir.

**Kapsam dışı:**

- Gerçek pricing service entegrasyonu
- Gerçek stock service entegrasyonu
- Gerçek taxonomy/category owner entegrasyonu
- Gerçek media readiness entegrasyonu

---

### PX-HAVUZ-03-R — Runtime Smoke / Module Resolution Fix

**Karar:** PASS

**Yapılanlar:**

- `@hx/pool` runtime module resolution sorunu giderildi.
- `services/pool/package.json` içinde `main`, `types`, `exports` alanları runtime uyumlu hale getirildi.
- Binding smoke testi gerçek runtime’da çalıştırıldı.
- Binding eksik → activation FAIL doğrulandı.
- Binding tam → activation PASS doğrulandı.

---

### PX-HAVUZ-04 — Supplier Intake + Admin Review Surface Hardening

**Karar:** PASS WITH LIMITATION

**Yapılanlar:**

- Supplier ve admin route grupları ayrıldı.
- `/pool/supplier/...` ve `/pool/admin/...` yapısı kuruldu.
- Actor context foundation eklendi.
- Supplier route için SUPPLIER rolü zorunlu hale getirildi.
- Admin route için ADMIN / OPERATOR rolü zorunlu hale getirildi.
- Supplier yalnız kendi ürününü yönetebilir hale getirildi.
- Supplier approve / reject / commercialize yapamaz hale getirildi.
- Admin actionlarda reason / requiredChanges validation güçlendirildi.
- Submit validation güçlendirildi.
- PoolResult / PoolErrorCode hata protokolü kuruldu.
- Duplicate commercialize ve binding incomplete guardları korundu.

**Kapsam dışı:**

- Gerçek auth provider entegrasyonu
- Gerçek RBAC/permission engine
- PostgreSQL persistence
- Admin UI / Supplier UI tasarımı

---

### PX-HAVUZ-05 — Creator Pool Selection / Storefront Binding

**Karar:** PASS WITH LIMITATION

**Yapılanlar:**

- CreatorStoreProductStatus eklendi.
- CreatorStoreProduct eklendi.
- Creator actor type eklendi.
- CreatorStoreId actor context’e eklendi.
- Creator available products listesi eklendi.
- Creator active + all bindings bound commercial product’ı mağazasına bağlayabilir hale geldi.
- Duplicate creatorStoreId + commercialPoolProductId engellendi.
- Creator store scope guard eklendi.
- Pause / resume / remove transitionları eklendi.
- Removed product resume edilemez hale getirildi.
- Creator işlemlerinin CommercialPoolProduct global status’unu değiştirmediği doğrulandı.

**Kapsam dışı:**

- Story/video upload
- Creator media processing
- Checkout/order/search/finance entegrasyonu
- Product/pricing/stock/category/media truth mutation

---

### PX-HAVUZ-05-R — Build Fix / ListSupplierSubmittedProductsQuery Alignment

**Karar:** PASS

**Yapılanlar:**

- `listSubmittedProducts` metodu `listSupplierSubmittedProducts` olarak contract ile hizalandı.
- BFF çağrıları yeni metot ismine göre güncellendi.
- Build hatası giderildi.
- Typecheck, build ve smoke test PASS oldu.

---

## 3. Tamamlanan Alanlar

Havuz Sistemi foundation hattında aşağıdaki alanlar tamamlandı:

- Tedarikçi ürün taslağı oluşturma
- Tedarikçi ürün güncelleme
- Tedarikçi ürünü incelemeye gönderme
- Admin inceleme başlatma
- Admin revizyon isteme
- Tedarikçi revizyon gönderme
- Admin onaylama
- Admin reddetme
- Admin askıya alma
- Approved ürünün CommercialPoolProduct kaydına dönüştürülmesi
- Duplicate commercialize guard
- Commercial product activate / suspend / archive lifecycle
- Pricing / stock / category / media binding foundation
- Binding eksikse activation engeli
- Supplier / admin route ayrımı
- Supplier scope guard
- Admin/operator action guard
- Creator available commercial product listesi
- Creator ürünü mağazaya bağlama
- Duplicate creator store product engeli
- Creator pause / resume / remove lifecycle
- CommercialPoolProduct global truth’unun creator işlemleriyle değişmemesi

---

## 4. Bilinçli Kapsam Dışı Bırakılanlar

Aşağıdaki konular bilinçli olarak Havuz foundation hattının dışında bırakıldı:

- Gerçek PostgreSQL persistence
- Gerçek auth/session entegrasyonu
- Gerçek permission/RBAC/policy engine
- Gerçek pricing engine entegrasyonu
- Gerçek stock service entegrasyonu
- Gerçek taxonomy/category owner entegrasyonu
- Gerçek media processing / CDN / transcoding / virus scan
- Search/OpenSearch index trigger
- Checkout/order/payment entegrasyonu
- Finance / reconciliation / payout entegrasyonu
- Campaign / coupon entegrasyonu
- Creator story/video upload
- Creator media processing
- Admin UI tasarımı
- Supplier panel UI tasarımı
- Creator panel UI tasarımı

---

## 5. Açık Eksikler

### 5.1 Persistence Eksikliği

Havuz verileri şu an in-memory tutulmaktadır:

- submittedProduct
- commercialProduct
- bindingSnapshot
- creatorStoreProduct

Production öncesi kalıcı persistence zorunludur.

---

### 5.2 Auth / Permission Eksikliği

Actor context şu an header foundation üzerinden alınmaktadır:

- `x-actor-id`
- `x-actor-type`
- `x-supplier-id`
- `x-creator-store-id`

Bu gerçek auth/session doğrulaması değildir.

---

### 5.3 Binding Owner Entegrasyonu Eksikliği

Binding kontrolleri foundation seviyesindedir:

- hasBasePrice → pricing BOUND
- hasStockInput → stock BOUND
- canonicalCategoryId → category BOUND
- mediaCount > 0 → media BOUND

Gerçek owner sistemlerden doğrulama henüz yapılmamaktadır.

---

### 5.4 Validation Eksikliği

Mevcut validation foundation seviyesindedir. İleri fazda şu kontroller gerekir:

- SKU formatı
- Barkod formatı
- Kategoriye göre zorunlu attribute
- Varyant eksen doğrulaması
- Fiyat değer aralıkları
- Stok değer aralıkları
- Medya tip / usage doğrulaması
- Lojistik ölçü / desi validasyonu
- Metin uzunluğu ve yasaklı içerik kontrolleri

---

### 5.5 Audit / Event Eksikliği

Review decision ve lifecycle değişiklikleri kalıcı audit/event outbox ile bağlanmamıştır.

İleri fazda şu kayıtların kalıcı tutulması gerekir:

- kim ürün oluşturdu
- kim incelemeye gönderdi
- kim revizyon istedi
- kim onayladı
- kim reddetti
- kim commercialize etti
- kim activate/suspend/archive yaptı
- hangi creator hangi ürünü mağazasına ekledi
- hangi reason ile pause/remove yapıldı

---

### 5.6 Creator StoreProduct Owner Kararı

CreatorStoreProduct foundation şu an Pool Service içinde tutulmaktadır.

İleri mimaride bu truth alanının kalıcı owner’ı netleştirilmelidir:

- Pool Service mi?
- Storefront Service mi?
- Creator Store Service mi?

Önerilen kalıcı karar:

CreatorStoreProduct owner’ı uzun vadede Storefront / Creator Store domain olmalıdır. Pool sadece uygun commercial product kaynağı olmalıdır.

---

## 6. Riskler

### RISK-01 — In-memory Store Riski

Restart sonrası havuz state kaybolur.

**Etkisi:**

- ürün kabul geçmişi kaybolur
- ticari havuz kaydı kaybolur
- creator store binding kaybolur
- audit zinciri kurulamaz

**Önerilen aksiyon:**

Pool Persistence Foundation açılmalı.

---

### RISK-02 — Header-based Actor Context Riski

Actor bilgisi header’dan geldiği için spoof edilebilir.

**Etkisi:**

- supplier başka supplier gibi davranabilir
- creator başka mağaza adına işlem deneyebilir
- admin/operator rolü güvenilir olmayabilir

**Önerilen aksiyon:**

Auth/Session + Permission integration yapılmalı.

---

### RISK-03 — Binding Foundation Yanıltıcı Olabilir

Binding şu an gerçek owner sistemlerden değil, snapshot alanlarından türetiliyor.

**Etkisi:**

- fiyat gerçekten geçerli olmayabilir
- stok gerçekten uygun olmayabilir
- kategori kanonik olarak geçerli olmayabilir
- medya gerçekten yayına hazır olmayabilir

**Önerilen aksiyon:**

Pricing / Stock / Taxonomy / Media owner entegrasyonu yapılmalı.

---

### RISK-04 — CreatorStoreProduct Owner Karışıklığı

Creator store binding şu an pool içinde tutuluyor.

**Etkisi:**

- Pool domain ileride storefront domain’e taşması gereken truth’u sahiplenebilir
- creator mağaza yönetimi ile havuz owner sınırı karışabilir

**Önerilen aksiyon:**

Creator Store / Storefront owner kararı ayrı hardening paketinde netleştirilmeli.

---

### RISK-05 — Validation Yetersizliği

Temel validation üretim için yeterli değildir.

**Etkisi:**

- hatalı ürün kabulü
- hatalı varyant yapısı
- yanlış fiyat/stok girişi
- medya/lojistik eksikleri

**Önerilen aksiyon:**

Taxonomy-aware product validation paketi açılmalı.

---

## 7. Dikkat Edilecek Mimari Sınırlar

Aşağıdaki sınırlar korunmalıdır:

- Supplier ürün yükler ama ürünü satışa açamaz.
- Admin onaylar ama ürün onayı active/sale-ready anlamına gelmez.
- CommercialPoolProduct oluşması checkout/order/search/finance entegrasyonu anlamına gelmez.
- Creator ürünü mağazasına bağlar ama global product truth’u değiştiremez.
- Creator story/video upload Havuz Sistemi’nin işi değildir.
- Pricing truth Havuz’a taşınamaz.
- Stock truth Havuz’a taşınamaz.
- Category/taxonomy truth Havuz’a taşınamaz.
- Media processing truth Havuz’a taşınamaz.
- BFF business logic üretmez.
- Panel/UI truth üretmez.
- Event owner state mutation yerine geçmez.
- Projection truth değildir.

---

## 8. İleri Faz / Hardening Önerileri

### H01 — Pool Persistence Foundation

Amaç:

- submittedProduct
- commercialProduct
- bindingSnapshot
- creatorStoreProduct
- review decision records

kayıtlarını PostgreSQL persistence’a taşımak.

---

### H02 — Pool Auth / Permission Integration

Amaç:

Header-based actor context yerine gerçek auth/session/permission katmanına bağlanmak.

---

### H03 — Pool Owner Binding Integration

Amaç:

Binding kontrollerini gerçek owner sistemlerden okumak:

- Pricing owner
- Stock owner
- Taxonomy/category owner
- Media owner

---

### H04 — Pool Audit / Event Durability

Amaç:

Ürün kabul, onay, red, revizyon, commercialize, activate, creator add/remove gibi lifecycle olaylarını audit/outbox ile kalıcı hale getirmek.

---

### H05 — Taxonomy-aware Product Validation

Amaç:

Kategoriye göre zorunlu attribute, varyant, medya, fiyat, stok ve lojistik alanlarını doğrulamak.

---

### H06 — Creator Store Ownership Alignment

Amaç:

CreatorStoreProduct truth owner kararını netleştirmek ve gerekiyorsa Storefront / Creator Store domain’e taşımak.

---

### H07 — Pool Search Index Sync

Amaç:

CommercialPoolProduct ACTIVE olduktan sonra arama/index projection akışını kontrollü şekilde kurmak.

---

## 9. Önemli Notlar

- Havuz Sistemi foundation hattı fonksiyonel olarak tamamlanmıştır.
- Bu çalışma production-ready anlamına gelmez.
- PX-HAVUZ-01/02/03/04/05 paketleri mevcut foundation kapsamını karşılamıştır.
- PX-HAVUZ-03-R ve PX-HAVUZ-05-R paketleri teknik repair olarak başarıyla kapanmıştır.
- En kritik açık borç persistence ve gerçek actor/permission entegrasyonudur.
- Story/video upload Havuz Sistemi içinde ele alınmayacaktır.
- Fenomen ürün story/video işleri Fenomen Mağaza Yönetim Paneli + Media + Story sistemlerinde ele alınmalıdır.
- Pool Service uzun vadede creator store product owner’ı olmamalı; bu alan muhtemelen Storefront / Creator Store domain’e taşınmalıdır.

---

## 10. Güncel Karar

### Foundation Durumu

PASS WITH LIMITATION

### Production Readiness

PARTIAL

### Sonraki Önerilen Aksiyon

Yeni feature paketine geçmeden önce aşağıdaki iki yoldan biri seçilmelidir:

1. Diğer sistem dosyalarına aynı modelle devam etmek
2. Havuz production hardening hattını ayrıca planlamak

Önerilen kısa vadeli karar:

Diğer sistem dosyaları için de aynı sistem kayıt dosyası modeli kullanılmalı; hardening paketleri daha sonra sistemler arası önceliğe göre açılmalıdır.