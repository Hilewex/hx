# PROMOTION_RULEBOOK

## 1. Amaç

Bu dosya, platformdaki promosyon alanını tek doğrulu, uygulanabilir ve çakışmasız kural kitabı haline getirir.

Bu dosyanın amacı:

* merkezi fiyat sistemi, kampanya sistemi ve kupon sistemi arasındaki sınırları sert biçimde ayırmak
* promosyonların fiyat truth’unu, marj güvenliğini ve finansal dağıtımı bozmasını engellemek
* sponsor modeli, stacking politikası, checkout final validation ve snapshot etkisini bağlayıcı kurala dönüştürmek
* cart / checkout / order / settlement hattında promosyon davranışını yoruma kapatmak

Net kural:

* Promosyon fiyat truth’unun yerine geçmez
* Kampanya ve kupon aynı sistem değildir
* Kupon sponsor modeli belirlenmeden indirim uygulanmaz
* Checkout öncesi görünen promosyon ile işlem anındaki geçerli promosyon etkisi aynı olmak zorunda değildir
* Nihai promosyon doğruluğu checkout’ta kurulur
* Siparişe yazılan promosyon etkisi snapshot olarak korunur

---

## 2. Kapsam

Bu rulebook ilk fazda aşağıdaki alanları kapsar:

1. fiyat koridoru ve promosyon ilişkisi
2. kampanya tipleri ve kapsam modeli
3. kupon tipleri ve sponsor modeli
4. stacking / birlikte çalışma politikası
5. cart / checkout / order snapshot mantığı
6. iade / iptal / refund sonrası promosyon düzeltme etkisi
7. creator coupon sınırları
8. supplier promo sınırları
9. fraud / risk kaynaklı promosyon blokları

Bu dosya aşağıdaki alanları bilinçli olarak ilk faz dışında bırakır veya sınırlı bırakır:

* çok taraflı dinamik sponsor pazarlığı
* birden çok kuponun aynı anda aktif uygulanması
* dinamik gerçek zamanlı growth/offer engine
* tedarikçi sponsorlu kupon modeli
* açık uçlu stacking optimizasyonu

---

## 3. Promosyon katman modeli

### PR-001 — Baz fiyat ile satış fiyatı aynı şey değildir

**Binding Rule:** Baz fiyat tedarikçiden gelir; satış fiyatını platform kurar.

### PR-002 — Kampanya bağımsız fiyat motoru değildir

**Binding Rule:** Kampanya, merkezi fiyat sisteminin üstünde çalışan özel ticari rejim katmanıdır.

### PR-003 — Kupon sponsor modeli olmadan çalışmaz

**Binding Rule:** İndirim maliyetini kimin taşıdığı belirlenmeden kupon uygulanamaz.

### PR-004 — Promotion preview ile final promotion effect aynı şey değildir

**Binding Rule:** PDP/cart seviyesindeki promosyon görünürlüğü ön bilgi olabilir; final geçerlilik ve final total checkout’ta belirlenir.

### PR-005 — Snapshot promosyonun tarihsel referansıdır

**Binding Rule:** İşlem anındaki kampanya/kupon etkisi order ve gerektiğinde settlement input seviyesinde sabitlenir.

---

## 4. Promosyon standardı

Her promosyon kuralı şu alan mantığıyla okunur:

* **Rule ID**
* **Rule Name**
* **Scope**
* **Trigger / Context**
* **Binding Rule**
* **Owner / Enforcement**
* **Pricing / Finance / Snapshot Effect**
* **Notes**

Net kural:

* promotion badge ile final discounted price aynı şey değildir
* coupon applicability ile coupon sponsor attribution aynı şey değildir
* cart preview ile checkout final evaluation aynı şey değildir
* live rule ile order snapshot aynı şey değildir

---

## 5. Fiyat koridoru ile promosyon ilişkisi

### PR-010 — Merkezi fiyat sistemi güvenli ticari tabanı belirler

**Scope:** pricing + promotion

**Binding Rule:** Kampanya ve kupon davranışı, merkezi fiyat sisteminin tanımladığı güvenli alt sınırı delemez.

**Owner / Enforcement:** pricing owner

**Pricing / Finance / Snapshot Effect:** final total checkout’ta koridor kontrolünden geçer

### PR-011 — Promosyon fiyat truth’unu override etmez

**Scope:** campaign / coupon

**Binding Rule:** Promosyon aktif satış rejimini etkileyebilir; fakat fiyat truth owner’ı olmaz.

**Owner / Enforcement:** pricing owner + campaign/coupon owners

### PR-012 — Creator bağımsız promosyon motoru değildir

**Scope:** creator coupon / creator commercial action

**Binding Rule:** Creator yalnız platformun izin verdiği kupon ve promosyon rejiminde hareket eder.

**Owner / Enforcement:** coupon owner + creator permissions + pricing owner

### PR-013 — Supplier promosyon owner’ı değildir

**Scope:** supplier commerce

**Binding Rule:** Supplier baz fiyat ve ürün girdisi sağlar; kampanya açamaz, kupon oluşturamaz, aktif satış promosyonunu sahiplenemez.

**Owner / Enforcement:** pricing owner + campaign owner + coupon owner

### PR-014 — Geçmiş işlem promosyon etkisi sessiz overwrite edilmez

**Scope:** order / settlement

**Binding Rule:** Canlı kampanya/kupon kuralı değişse bile oluşmuş order ve finance context sessizce yeniden yazılmaz.

**Owner / Enforcement:** snapshot policy + order owner + settlement owner

---

## 6. Kampanya kuralları

### PR-020 — Kampanya yalnız 2. havuzda çalışır

**Scope:** campaign activation

**Binding Rule:** Ürün önce kabul/onay ve merkezi fiyat hazırlığından geçmiş olmalıdır; kampanya daha sonra devreye girer.

**Owner / Enforcement:** campaign owner + product acceptance + pricing owner

### PR-021 — Kampanya merkezi promosyon rejimidir

**Scope:** campaign

**Binding Rule:** Kampanya ürün, kategori veya seçki seviyesinde özel ticari rejim kurar; ancak merkezi fiyatın yerine geçmez.

**Owner / Enforcement:** campaign owner

### PR-022 — İlk faz kampanya tipleri sınırlıdır

**Scope:** campaign types

**Binding Rule:** İlk faz aktif kampanya tipleri şunlardır:

* ürün bazlı kampanya
* kategori bazlı kampanya
* sezon / vitrin kampanyası
* lansman kampanyası

**Owner / Enforcement:** campaign owner

### PR-023 — Kampanya görünürlük ve fiyat etkisini birlikte taşıyabilir

**Scope:** storefront + checkout

**Binding Rule:** Kampanya indirim, badge, vitrin görünürlüğü ve seçki desteği verebilir; ancak campaign badge final price garantisi değildir.

**Owner / Enforcement:** campaign owner + storefront projections + checkout validation

### PR-024 — Kampanya checkout’ta yeniden doğrulanır

**Scope:** checkout

**Binding Rule:** Aktiflik penceresi, kapsam, eligibility ve final price effect işlem anında yeniden doğrulanır.

**Owner / Enforcement:** checkout owner + campaign owner

### PR-025 — Kampanya order snapshot’a yazılır

**Scope:** order snapshot

**Binding Rule:** İşlem anındaki campaign context ve financial effect order snapshot’ında sabitlenir.

**Owner / Enforcement:** order owner + snapshot policy

### PR-026 — Expired campaign sessizce uygulanmaya devam edemez

**Scope:** campaign lifecycle

**Binding Rule:** Campaign window kapandığında checkout final evaluation bunu reject etmelidir.

**Owner / Enforcement:** campaign owner + checkout owner

---

## 7. Kupon kuralları

### PR-030 — Kupon kampanyadan ayrı sistemdir

**Scope:** coupon

**Binding Rule:** Kampanya merkezi ve çoğu zaman kodsuz ticari rejimdir; kupon ise kodlu/koşullu ve kullanıcı aksiyonu ile tetiklenen indirim sistemidir.

**Owner / Enforcement:** coupon owner

### PR-031 — İlk faz kupon oluşturucu aktörler yalnız platform ve creator’dır

**Scope:** coupon creation

**Binding Rule:** Supplier ilk fazda kupon oluşturucu değildir.

**Owner / Enforcement:** coupon owner + actor/scope guard

### PR-032 — Kupon sponsor modeli zorunludur

**Scope:** coupon sponsor attribution

**Binding Rule:** Her kupon şu sponsorluk ailelerinden biriyle açıkça tanımlanmalıdır:

* platform sponsorlu kupon
* creator sponsorlu kupon
* platform destekli creator kuponu

**Owner / Enforcement:** coupon owner + finance attribution

### PR-033 — Creator kuponu yalnız kendi mağaza bağlamında geçerlidir

**Scope:** creator coupon

**Binding Rule:** Creator kuponu yalnız o storefront bağlamında ve ilgili aktif ürünlerde çalışır.

**Owner / Enforcement:** coupon owner + store context validation

### PR-034 — Kupon applicability ile sponsor attribution ayrı adımdır

**Scope:** coupon evaluation

**Binding Rule:** Kuponun uygulanabilir olması, indirim maliyetinin doğru tarafa yazıldığı anlamına gelmez; attribution ayrıca hesaplanır.

**Owner / Enforcement:** coupon owner + settlement owner

### PR-035 — Kupon fiyat koridorunu bozamaz

**Scope:** coupon final effect

**Binding Rule:** Kupon uygulanınca final total güvenli alt sınırın altına inemez.

**Owner / Enforcement:** pricing owner + checkout owner

### PR-036 — Creator sponsorlu kupon minimum net marjı yok edemez

**Scope:** creator coupon margin protection

**Binding Rule:** Creator tarafında minimum net marj koruması zorunludur. Gerekirse kategori üst oranı veya ürün bazlı kupon kapatma uygulanır.

**Owner / Enforcement:** coupon owner + pricing owner + settlement rules

### PR-037 — Coupon preview geçici olabilir, final karar checkout’tadır

**Scope:** PDP / cart -> checkout

**Binding Rule:** PDP/cart seviyesinde applied görünüyor olması, checkout’ta uygulanacağı garantisi vermez.

**Owner / Enforcement:** checkout owner

### PR-038 — Kupon snapshot order’a zorunlu yazılır

**Scope:** order snapshot

**Binding Rule:** En az şu alanlar korunur:

* coupon_id
* coupon_code
* coupon_type
* sponsor_type
* applied_discount_amount
* applicable_scope

**Owner / Enforcement:** order owner + snapshot policy

### PR-039 — Kupon rejected olduğunda sahte applied state üretilmez

**Scope:** UI / API

**Binding Rule:** Invalid, not_applicable, sponsor_conflict veya margin_conflict halinde `applied` görünümü korunamaz.

**Owner / Enforcement:** coupon owner + canonical error/state language

---

## 8. İlk faz aktif kupon modelleri

### PR-040 — Platform sponsorlu platform kuponu aktif modeldir

**Scope:** faz-1 coupon model

**Binding Rule:** Yeni kullanıcı, sezon veya büyüme teşviki için platform sponsorlu kupon aktif modeldir.

### PR-041 — Creator sponsorlu creator kuponu aktif modeldir

**Scope:** faz-1 coupon model

**Binding Rule:** Creator mağazası kendi mağazasında geçerli kupon başlatabilir; ancak koridor ve net marj koruması zorunludur.

### PR-042 — Platform destekli creator kuponu aktif modeldir

**Scope:** faz-1 coupon model

**Binding Rule:** Kupon mağaza özel olabilir; fakat maliyetin bir kısmını platform taşıyabilir.

### PR-043 — Tedarikçi sponsorlu kupon ilk fazda kapalıdır

**Scope:** faz-1 exclusions

**Binding Rule:** Supplier sponsorlu kupon ilk faz aktif model değildir.

### PR-044 — Çok taraflı paylaştırılmış dinamik kupon ilk fazda kapalıdır

**Scope:** faz-1 exclusions

**Binding Rule:** Çok taraflı dinamik sponsor paylaşımı ilk faz aktif kural seti değildir.

---

## 9. Stacking / birlikte çalışma kuralları

### PR-050 — Stacking serbest değildir

**Scope:** campaign + coupon

**Binding Rule:** Kampanya ve kupon yalnız açık politika izin veriyorsa birlikte çalışır; sınırsız stacking yoktur.

**Owner / Enforcement:** campaign owner + coupon owner + checkout validation

### PR-051 — Faz-1 default policy: campaign-active üründe creator coupon kapalıdır

**Scope:** campaign + creator coupon

**Binding Rule:** Açık istisna tanımı yoksa creator coupon campaign-active ürüne uygulanmaz.

**Owner / Enforcement:** campaign owner + coupon owner

### PR-052 — Faz-1 default policy: aynı işlem bağlamında tek aktif kupon uygulanır

**Scope:** coupon stacking

**Binding Rule:** Açık istisna tanımı yoksa bir checkout/order bağlamında birden fazla kupon birlikte aktif uygulanmaz.

**Owner / Enforcement:** coupon owner + checkout validation

### PR-053 — Platform kuponu + campaign birlikte çalışacaksa tek final pricing evaluation zorunludur

**Scope:** checkout final pricing

**Binding Rule:** Campaign effect ve coupon effect ayrı katmanlarda hesaplanıp sonradan gevşek biçimde birleştirilemez; final evaluation tek hesap motorunda yapılır.

**Owner / Enforcement:** checkout owner + pricing/promotion evaluation layer

### PR-054 — Çoklu promosyon kaynağı varsa finance attribution zorunludur

**Scope:** settlement attribution

**Binding Rule:** İndirim kaynağı ve maliyet taşıyıcısı denetlenebilir biçimde saklanır.

**Owner / Enforcement:** settlement owner

### PR-055 — Stacking conflict checkout’ta reject edilmelidir

**Scope:** checkout

**Binding Rule:** Policy dışı stacking, margin conflict, corridor breach veya sponsor conflict payment readiness üretmez.

**Owner / Enforcement:** checkout owner + state/error guards

---

## 10. Cart / checkout / order davranışı

### PR-060 — Cart promosyon preview alanıdır

**Scope:** cart

**Binding Rule:** Cart promosyonu gösterebilir; ancak nihai ticari doğruluğun owner’ı değildir.

**Owner / Enforcement:** cart projection + checkout owner

### PR-061 — Checkout promosyonun final doğrulama alanıdır

**Scope:** checkout

**Binding Rule:** Campaign active state, coupon applicability, sponsor attribution, corridor guard ve final total checkout’ta birlikte doğrulanır.

**Owner / Enforcement:** checkout owner

### PR-062 — Invalid promotion state payment aşamasına taşınamaz

**Scope:** checkout -> payment

**Binding Rule:** Uygulanamayan kupon, expired campaign, stacking conflict veya corridor breach varken ready_for_payment üretilmez.

**Owner / Enforcement:** checkout owner + payment readiness guard

### PR-063 — Order promosyon etkisini immutable snapshot gibi korur

**Scope:** order

**Binding Rule:** Live campaign/coupon rule sonradan değişse bile geçmiş order bağlamı sessizce yeniden yazılmaz.

**Owner / Enforcement:** order owner + snapshot policy

### PR-064 — Settlement live campaign/coupon truth’una değil, order snapshot’a dayanır

**Scope:** settlement

**Binding Rule:** Finansal dağıtım geçmiş işlem anındaki sabitlenmiş promosyon bağlamından yürür.

**Owner / Enforcement:** settlement owner + snapshot policy

---

## 11. Return / refund sonrası promosyon etkileri

### PR-070 — Refund promosyon etkisini sponsor modeline göre düzeltir

**Scope:** return / refund / settlement

**Binding Rule:** İndirim maliyeti doğru tarafa correction olarak geri yansıtılmalıdır; otomatik nötrleme varsayılmaz.

**Owner / Enforcement:** settlement owner + refund refs

### PR-071 — Kısmi iade line-level promosyon correction üretir

**Scope:** partial return

**Binding Rule:** Sipariş toplamı seviyesinde kaba düzeltme yeterli değildir; satır bazlı correction gerekir.

**Owner / Enforcement:** settlement owner + cancel/return refs

### PR-072 — Sponsor attribution iade sonrası korunur

**Scope:** refund correction

**Binding Rule:** Platform sponsorlu, creator sponsorlu ve destekli creator kuponlarda correction tarafı sponsor modeline göre hesaplanır.

**Owner / Enforcement:** settlement owner

### PR-073 — Campaign badge visibility ile financial correction aynı şey değildir

**Scope:** UI / finance separation

**Binding Rule:** Yüzeyde kampanya etiketi kaybolabilir veya kalabilir; finansal düzeltme settlement truth alanında yürür.

**Owner / Enforcement:** settlement owner + storefront projections

---

## 12. Risk / fraud / abuse etkileri

### PR-080 — Coupon abuse promotion eligibility’yi daraltabilir

**Scope:** fraud -> promotion

**Binding Rule:** Çoklu hesap, seri kupon denemesi, kupon->sipariş->iade döngüsü gibi örüntülerde kupon kullanımı block veya review’a alınabilir.

**Owner / Enforcement:** risk owner + coupon owner

### PR-081 — Reward / coupon / payout abuse birlikte okunabilir

**Scope:** cross-domain abuse

**Binding Rule:** Promosyon suistimali yalnız kupon alanında izole ele alınmaz; reward, return ve payout sinyalleriyle birlikte değerlendirilebilir.

**Owner / Enforcement:** risk owner + related domain owners

### PR-082 — Risk blockesi sahte promosyon başarısı üretemez

**Scope:** UI / API behavior

**Binding Rule:** Risk nedeniyle reddedilen promosyon `applied` veya `success` gibi gösterilemez; blocked/review dili kullanılır.

**Owner / Enforcement:** coupon/campaign owner + canonical state language

---

## 13. UI / API davranış kuralları

### PR-090 — Campaign badge ile final price state karıştırılmaz

**Binding Rule:** Badge, işlem anı final total garantisi değildir.

### PR-091 — Coupon applied optimistic final truth değildir

**Binding Rule:** Cart seviyesinde applied görünen kupon checkout final validation’da reddedilebilir.

### PR-092 — Promotion conflict görünür olmalıdır

**Binding Rule:** Invalid coupon, expired campaign, corridor breach, sponsor conflict ve stacking conflict kanonik state/hata diliyle görünür kılınır.

### PR-093 — Kanonik hata kodları korunur

**Binding Rule:** En az şu hata aileleri korunur:

* COUPON_INVALID
* COUPON_NOT_APPLICABLE
* CAMPAIGN_NOT_APPLICABLE
* PRICE_CHANGED
* CHECKOUT_NOT_READY_FOR_PAYMENT
* PRICE_LOCK_EXPIRED
* IDEMPOTENCY_CONFLICT gerektiğinde

**Owner / Enforcement:** API error catalog + domain owners

---

## 14. Faz-1 açık ve kapalı alanlar

### 14.1 Bu dosyada bağlanan alanlar

* fiyat koridoru ile promosyon ilişkisi
* kampanya temel davranışı
* kupon sponsor modeli
* creator coupon sınırları
* stacking default policy
* checkout final pricing doğrulaması
* order snapshot ve settlement correction mantığı
* risk kaynaklı promosyon blokları

### 14.2 Faz-1 dışında veya kapalı alanlar

* supplier sponsorlu kupon
* çoklu kupon stacking
* dinamik sponsor pazarlığı
* gerçek zamanlı kişiselleştirilmiş offer engine
* açık uçlu growth experimentation promosyon motoru

---

## 15. Kısa sonuç

Bu rulebook ile aşağıdaki çekirdek promosyon kararları sert biçimde sabitlenmiş olur:

* baz fiyat ile satış fiyatı aynı değildir
* kampanya bağımsız fiyat motoru değildir
* kupon sponsor modeli zorunludur
* creator kuponu yalnız kendi mağazasında, koridor ve minimum net marj sınırında çalışır
* faz-1 default policy olarak campaign-active üründe creator kuponu kapalıdır
* faz-1 default policy olarak aynı işlem bağlamında tek aktif kupon uygulanır
* final promosyon doğruluğu checkout’ta kurulur
* order geçmiş promosyon etkisini snapshot olarak korur
* iade sonrası sponsor modeline göre line-level financial correction üretilir
* risk suistimali promosyon erişimini daraltabilir

Bu dosya, platformun promosyon alanında bağlayıcı ve yoruma kapalı kanonik rulebook
