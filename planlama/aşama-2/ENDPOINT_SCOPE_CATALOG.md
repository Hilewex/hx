# ENDPOINT_SCOPE_CATALOG

Bu katalog, platformdaki endpoint ve action alanlarının hangi scope altında çalıştığını tanımlar.

Net amaç:
- public, authenticated, panel ve internal çağrıların birbirine karışmamasını sağlamak
- aynı işlevin farklı aktörlerde farklı endpoint/scope ile çalışmasını netleştirmek
- BFF, owner servis ve panel action sınırlarını kapatmak

Net kural:
- endpoint erişimi permission ile aynı şey değildir
- endpoint scope doğru olsa bile owner guard ayrıca korunur
- panel endpoint’i truth owner’ı değildir
- BFF endpoint’i write owner’ı değildir

---

## 1. PUBLIC ENDPOINT ALANI

### Tanım
Giriş yapmadan erişilebilen açık uçlardır.

### Kimler erişebilir
- misafir kullanıcı
- kayıtlı kullanıcı
- arama motoru / public crawler (uygun yüzeylerde)

### Tipik kullanım alanları
- ana sayfa görünümü
- keşfet görünümü
- kategori / PLP görünümü
- PDP görünümü
- fenomen mağaza vitrini
- public search entry
- public content yüzeyleri

### Özellikler
- read-only çalışır
- auth gerektirmez
- kişisel hesap bağlı truth döndürmez
- sensitive field döndürmez
- public-safe projection verir

### Not
Public endpoint görünürlüğü olan bir veri, owner truth’un tamamını açmak zorunda değildir.

---

## 2. AUTHENTICATED USER ENDPOINT ALANI

### Tanım
Giriş yapmış kullanıcı için açılan shopper scope uçlarıdır.

### Kimler erişebilir
- kayıtlı kullanıcı
- shopper profile kullanan kullanıcı

### Tipik kullanım alanları
- beğeni / kaydetme / takip aksiyonları
- mesaj gönderme
- soru sorma
- yorum oluşturma
- kullanıcı story yükleme
- siparişleri görme
- adres yönetimi
- destek girişleri
- puan bakiyesi
- puan market kullanımı
- iade / iptal akışları

### Özellikler
- auth gerekir
- shopper scope gerekir
- permission/eligibility guard’ları çalışır
- yalnız kendi hesap bağlamı içinde çalışır

### Not
Authenticated endpoint, admin/panel aksiyonu anlamına gelmez.

---

## 3. GUEST CHECKOUT ENDPOINT ALANI

### Tanım
Misafir kullanıcının kontrollü checkout akışında kullanabildiği özel ticari uçlardır.

### Kimler erişebilir
- misafir kullanıcı
- gerektiğinde kayıtlı kullanıcı da aynı akışı kullanabilir

### Tipik kullanım alanları
- guest checkout başlatma
- checkout hazırlık verisi gönderme
- ödeme öncesi gerekli ticari form alanları
- sipariş sonrası hesap tamamlama yönlendirmesi

### Özellikler
- auth’siz çalışabilir
- sosyal write hakkı açmaz
- yalnız ticari kapanış akışında geçerlidir
- sıkı risk / payment readiness / state guard ile çalışır

### Not
Guest checkout endpoint’leri ile shopper-only sosyal endpoint’ler kesin ayrılmalıdır.

---

## 4. SHOPPER SELF ENDPOINT ALANI (`/me` mantığı)

### Tanım
Kullanıcının yalnız kendi verisi üzerinde okuma/yazma yaptığı hesap bağlı uçlardır.

### Kimler erişebilir
- giriş yapmış kullanıcı

### Tipik kullanım alanları
- `/me/orders`
- `/me/addresses`
- `/me/points`
- `/me/saved`
- `/me/returns`
- `/me/messages`
- `/me/notifications`

### Özellikler
- auth gerekir
- yalnız kendi identity bağlamında çalışır
- cross-account access açmaz
- response çoğunlukla projection’dır

### Not
`/me` endpoint’leri owner servisleri dolaşabilir ama yine direct truth owner davranışı göstermez; çoğu durumda BFF/projection katmanından servis edilir.

---

## 5. CREATOR PANEL ENDPOINT ALANI

### Tanım
Fenomenin kendi mağazasını yönetmek için kullandığı panel uçlarıdır.

### Kimler erişebilir
- onaylı fenomen
- creator scope’a geçmiş kullanıcı

### Tipik kullanım alanları
- mağaza vitrin düzeni
- havuzdan ürün seçme
- mağaza içi medya düzenleme
- post/story üretimi
- sade performans görünürlüğü
- creator coupon aksiyonları
- mesaj / takipçi görünürlüğü

### Özellikler
- auth gerekir
- creator scope gerekir
- permission guard gerekir
- çoğu write aksiyonu owner servise command olarak gider
- financial truth ve sipariş truth’unu direct mutate etmez

### Not
Creator panel endpoint’leri self-service command yüzeyidir; owner değildir.

---

## 6. SUPPLIER PANEL ENDPOINT ALANI

### Tanım
Tedarikçinin ürün ve fulfillment işlemleri için kullandığı panel uçlarıdır.

### Kimler erişebilir
- onaylı tedarikçi
- supplier scope’a geçmiş kullanıcı

### Tipik kullanım alanları
- ürün yükleme
- varyant verisi girme
- stok güncelleme
- baz fiyat input
- lojistik veri
- sipariş hazırlama/sevkiyat girdisi
- teknik soru-cevap taslak katkısı

### Özellikler
- auth gerekir
- supplier scope gerekir
- permission guard gerekir
- write aksiyonları ilgili owner sistemlere kontrollü input/command olarak gider
- satış fiyatı ve ürün onayı gibi truth alanlarını direct değiştirmez

### Not
Supplier panel endpoint’leri supplier çalışma alanıdır; üst yönetim alanı değildir.

---

## 7. ADMIN PANEL ENDPOINT ALANI

### Tanım
Admin ve alt admin rollerinin kullandığı denetim ve karar uçlarıdır.

### Kimler erişebilir
- admin
- creator admin
- supplier admin
- moderation admin
- operations admin
- support admin
- finance admin
- analytics/growth admin
  (role/scope’a göre)

### Tipik kullanım alanları
- başvuru inceleme / approve / reject
- kısıt / askı / release
- ürün kabul / red
- kampanya / kupon kuralı yönetimi
- moderation kararları
- ticket escalation
- payout hold / release
- finansal görünürlük
- operasyon izleme

### Özellikler
- auth gerekir
- admin scope gerekir
- alt rol permission gerekir
- audit zorunludur
- write aksiyonları owner sistemlere protected action / command olarak gider

### Not
Admin panel endpoint’i güçlüdür; ama keyfi bypass alanı değildir.

---

## 8. MODERATION ENDPOINT ALANI

### Tanım
İçerik görünürlüğü ve kurallı içerik denetimi için kullanılan özel yönetim uçlarıdır.

### Kimler erişebilir
- moderator
- moderation admin
- gerektiğinde üst admin

### Tipik kullanım alanları
- queue listeleri
- içerik inceleme
- approve / reject / restrict / takedown
- review history
- moderation escalation

### Özellikler
- auth gerekir
- moderation scope gerekir
- audit zorunludur
- moderation truth owner alanına command gönderir

### Not
Moderation endpoint’leri risk/fraud veya finance endpoint’leri ile karıştırılmaz.

---

## 9. OPERATIONS ENDPOINT ALANI

### Tanım
Sipariş operasyonu, fulfillment ve teslimat istisna yönetimi için kullanılan iç yönetim uçlarıdır.

### Kimler erişebilir
- operations admin
- support escalation ile yetkili operasyon rolü
- gerektiğinde üst admin

### Tipik kullanım alanları
- order ops queue
- shipment anomaly
- preparation delay
- fulfillment problem yönetimi
- ops escalation

### Özellikler
- auth gerekir
- operations scope gerekir
- direct order truth owner davranışı göstermez
- çoğu durumda operasyon owner/workflow sistemine command gönderir

---

## 10. FINANCE ENDPOINT ALANI

### Tanım
Mutabakat, payout, hold/release ve finansal inceleme için kullanılan özel uçlardır.

### Kimler erişebilir
- finance admin
- yetkili üst admin

### Tipik kullanım alanları
- settlement görünürlüğü
- payable / blocked / settled inceleme
- payout batch hazırlığı
- hold / release
- refund finans etkisi inceleme
- sponsor cost visibility

### Özellikler
- auth gerekir
- finance scope gerekir
- audit zorunludur
- financial truth owner sistemine komut gönderir
- sensitive data içerir

### Not
Finance endpoint’leri creator/supplier panel görünürlüklerinden ayrıdır.

---

## 11. SUPPORT ENDPOINT ALANI

### Tanım
Destek iç operasyonu ve ticket routing için kullanılan yönetim uçlarıdır.

### Kimler erişebilir
- support agent
- support admin
- escalation ile ilgili diğer yetkili roller

### Tipik kullanım alanları
- ticket listeleme
- ticket sınıflandırma
- SLA takibi
- ilgili ekibe yönlendirme
- escalation açma
- kullanıcı çözüm geçmişi görme

### Özellikler
- auth gerekir
- support scope gerekir
- ticket truth owner/workflow sistemi ile çalışır
- finans/moderasyon/risk owner kararlarını doğrudan vermez

---

## 12. INTERNAL SERVICE ENDPOINT ALANI

### Tanım
İnsan olmayan servislerin birbirine çağrı yaptığı veya worker’ların kullandığı protected uçlardır.

### Kimler erişebilir
- internal services
- workers
- scheduled jobs
- system integrations

### Tipik kullanım alanları
- projection update
- event consume sonrası callback
- internal reconciliation
- search document update
- analytics ingest
- notification dispatch
- internal health / readiness / diagnostic uçları

### Özellikler
- public değildir
- machine auth / signed request gerekir
- idempotency çoğu zaman zorunludur
- owner olmayan internal service truth mutate edemez

---

## 13. WEBHOOK / CALLBACK ENDPOINT ALANI

### Tanım
Dış sağlayıcıların platforma geri çağrı yaptığı uçlardır.

### Kimler erişebilir
- payment provider
- SMS/e-posta provider
- kargo provider
- media/transcoding provider
- diğer dış servisler

### Tipik kullanım alanları
- payment callback
- payout callback
- shipment status callback
- media processing completion callback

### Özellikler
- signed request / verification gerekir
- idempotency gerekir
- replay/duplicate guard gerekir
- doğrudan owner write yapıyormuş gibi davranılmaz; validated command/effect uygulanır

### Not
Webhook endpoint’leri public internetten erişilebilir olabilir; ama “public endpoint” değildir.

---

## 14. BFF / AGGREGATION ENDPOINT ALANI

### Tanım
Client’a uygun response shape üretmek için farklı owner sistemlerden read toplayan uçlardır.

### Kimler erişebilir
- web app
- mobile app
- bazı durumlarda panel UI

### Tipik kullanım alanları
- PDP aggregation
- home aggregation
- discover aggregation
- account/notification aggregation
- order tracking projection
- category/search presentation shaping

### Özellikler
- read-oriented çalışır
- projection üretir
- degraded / blocked / auth-aware state döndürebilir
- write owner değildir

### Not
BFF endpoint’leri owner servis endpoint’leri ile karıştırılmamalıdır.

---

## 15. ENDPOINT TIPLERI VE ORNEKLERI

### Public read endpoint
- public search
- PDP read
- category/PLP read
- mağaza vitrini read

### Authenticated shopper endpoint
- like/save/follow
- ask question
- write review
- create user story
- `/me/orders`

### Guest checkout endpoint
- guest checkout init
- guest checkout submit
- payment preparation guest flow

### Creator panel endpoint
- pool product selection
- creator post/story create
- store arrangement update

### Supplier panel endpoint
- product upload
- stock/base price input
- fulfillment action
- technical QA draft submit

### Admin panel endpoint
- approve/reject creator
- approve/reject supplier
- product accept/reject
- moderation action
- payout hold/release

### Internal endpoint
- projection update
- search reindex trigger
- analytics ingest
- notification dispatch

### Webhook endpoint
- payment callback
- shipment status callback
- media processing callback

---

## 16. KISA OZET

- Public endpoint: herkese açık read
- Authenticated user endpoint: kullanıcı hesabına bağlı aksiyonlar
- Guest checkout endpoint: auth’siz ama kontrollü ticari akış
- `/me` endpoint: yalnız kendi hesap bağlamı
- Creator/Supplier panel endpoint: self-service command yüzeyi
- Admin endpoint: denetim ve protected action
- Internal endpoint: servisler arası protected çağrılar
- Webhook endpoint: dış dünya callback alanı
- BFF endpoint: aggregation/projection yüzeyi