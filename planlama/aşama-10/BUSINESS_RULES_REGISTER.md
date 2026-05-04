# BUSINESS_RULES_REGISTER

## 1. Amaç

Bu dosya, platformun çekirdek iş kurallarını tek doğrulu, uygulanabilir ve çakışmasız registry yapısına dönüştürür.

Bu dosyanın amacı:

* dağınık iş kurallarını tek karar setine bağlamak
* owner / guard / state / snapshot / finance etkisi olan kuralları yorumdan çıkarıp kayıtlı hale getirmek
* fiyat, promosyon, checkout, payment, order, cancel/return, reward, settlement, payout ve restriction alanlarında kanonik referans üretmek
* `ELIGIBILITY_RULEBOOK.md`, `PROMOTION_RULEBOOK.md` ve `UGC_RULEBOOK.md` için üst business rule omurgası kurmaktır

Net kural:

* Bu dosya yeni sistem icat etmez
* Bu dosya mevcut kanonik kararları uygulanabilir registry diline çevirir
* Owner boundary bozulmaz
* BFF truth owner değildir
* Panel direct write yapmaz
* UI truth üretmez
* Event truth mutate etmez

---

## 2. Kapsam

Bu registry ilk fazda aşağıdaki iş kuralı ailelerini kapsar:

1. sistem üst ilkeleri
2. fiyat koridoru kuralları
3. price lock / batch activation kuralları
4. kampanya temel kuralları
5. kupon sponsor ve marj koruma kuralları
6. checkout / payment / order zinciri iş kuralları
7. cancel / return / refund etkisi iş kuralları
8. reward point lifecycle kuralları
9. puan market kullanım kuralları
10. finansal mutabakat / hakediş kuralları
11. payout ön koşul ve blok kuralları
12. creator restriction kuralları
13. supplier restriction kuralları
14. fraud / risk / abuse kaynaklı blok ve escalation kuralları

Bu dosya aşağıdaki alanları yalnız üst kural seviyesinde tanımlar:

* ayrıntılı eligibility matrisi
* ayrıntılı promosyon kombinasyon matrisi
* ayrıntılı UGC görünürlük / moderasyon matrisi

Bu alanlar ilgili Aşama 10 rulebook dosyalarında detaylandırılır.

---

## 3. Registry standardı

Her kural aşağıdaki alan mantığıyla okunmalıdır:

* **Rule ID**
* **Rule Name**
* **Scope**
* **Trigger / Context**
* **Binding Rule**
* **Owner / Enforcement**
* **State / Snapshot / Finance Effect**
* **Notes**

Net kural:

* Role, permission, eligibility ve owner aynı şey değildir
* Snapshot ile source truth aynı şey değildir
* Accepted ile completed aynı şey değildir
* Captured ile order_created aynı şey değildir
* Settled ile payable aynı şey değildir
* Payable ile paid_out aynı şey değildir

---

## 4. Sistem üst ilkeleri

### BR-001 — Owner dışı write yoktur

**Scope:** tüm platform

**Binding Rule:** Domain truth yalnız ilgili owner modül tarafından mutate edilir.

**Owner / Enforcement:** ownership guard + ilgili owner servis

### BR-002 — BFF read-only aggregation katmanıdır

**Scope:** BFF / client aggregation

**Binding Rule:** BFF yalnız projection, composition, degraded / blocked response ve DTO üretir; truth mutation yapmaz.

**Owner / Enforcement:** BFF boundary + ownership guard

### BR-003 — Panel protected action yüzeyidir

**Scope:** admin / creator / supplier / ops / support panel

**Binding Rule:** Panel owner truth gibi davranamaz; yalnız protected action / command başlatır.

**Owner / Enforcement:** panel contract + owner servis + audit

### BR-004 — UI truth üretmez

**Scope:** storefront / app / panel UI

**Binding Rule:** UI yalnız owner sistemlerden gelen truth, summary state ve projection’ı dürüst biçimde yansıtır.

**Owner / Enforcement:** backend owners + screen contracts + stateful UI rules

### BR-005 — Event truth mutation yerine geçmez

**Scope:** event-driven alanlar

**Binding Rule:** Önce owner truth yazılır, sonra event üretilir. Event tek başına state finalize etmez.

**Owner / Enforcement:** owner servis + veri akışı modeli

### BR-006 — Critical command’lerde duplicate-safe davranış zorunludur

**Scope:** checkout / payment / order / return / settlement / payout

**Binding Rule:** Aynı niyet, aynı bağlam içinde ikinci kez yeni etki üretmemelidir.

**Owner / Enforcement:** idempotency policy + state guards

---

## 5. Fiyat koridoru kuralları

### BR-010 — Baz fiyat tedarikçiden gelir, satış fiyatını platform kurar

**Scope:** merkezi fiyat sistemi

**Trigger / Context:** ürün onay sonrası ticari hazırlık, baz fiyat güncellemesi

**Binding Rule:** Tedarikçi baz fiyatı girer; satış fiyatı, fiyat koridoru ve aktif satış rejimi platform tarafından kurulur.

**Owner / Enforcement:** merkezi fiyat owner

### BR-011 — Fiyat katmanları first-class tutulur

**Scope:** merkezi fiyat sistemi

**Binding Rule:** En az şu katmanlar ayrı anlam taşır:

* supplier base price
* platform margin layer
* pool base price
* minimum / recommended / maximum corridor
* campaign regime if active

**Owner / Enforcement:** merkezi fiyat owner

### BR-012 — Fenomen bağımsız fiyat motoru değildir

**Scope:** creator commerce

**Binding Rule:** Fenomen mağaza yalnız platformun açtığı koridor içinde fiyat seçebilir; satış fiyatı truth’unu yeniden yazamaz.

**Owner / Enforcement:** merkezi fiyat owner + creator permissions

### BR-013 — Tedarikçi satış fiyatı owner’ı değildir

**Scope:** supplier commerce

**Binding Rule:** Tedarikçi baz fiyat ve ürün girdisi sağlar; aktif satış fiyatını, kampanya rejimini ve kupon sponsor mantığını belirleyemez.

**Owner / Enforcement:** merkezi fiyat owner + campaign owner + coupon owner

### BR-014 — Final ticari toplam güvenli alt sınırı delemez

**Scope:** fiyat / kampanya / kupon / checkout

**Binding Rule:** Kampanya, kupon veya başka promosyon etkisi final total’ı platformun güvenli alt sınırının altına indiremez.

**Owner / Enforcement:** merkezi fiyat owner + checkout final validation

### BR-015 — Geçmiş işlem fiyatı sessiz overwrite edilmez

**Scope:** order / settlement / payout referansları

**Binding Rule:** Canlı fiyat değişse bile oluşmuş order ve bağlı finance context sessizce yeni fiyatla değiştirilmez.

**Owner / Enforcement:** snapshot policy + order owner + settlement owner

---

## 6. Price lock ve batch activation kuralları

### BR-020 — Büyük fiyat değişimleri kontrollü aktivasyon ister

**Scope:** merkezi fiyat sistemi

**Binding Rule:** Büyük ölçekli baz fiyat veya aktif fiyat değişimleri kontrollü batch activation veya geçiş penceresiyle uygulanmalıdır.

**Owner / Enforcement:** merkezi fiyat owner

### BR-021 — Checkout sırasında kısa süreli price lock açılabilir

**Scope:** checkout / pricing

**Binding Rule:** Aktif checkout bağlamında kısa süreli price lock üretilebilir.

**Owner / Enforcement:** checkout owner + merkezi fiyat referansı

### BR-022 — Checkout price lock order snapshot değildir

**Scope:** checkout

**Binding Rule:** Price lock yalnız geçici işlem bağlamıdır; order pricing snapshot yerine geçmez.

**Owner / Enforcement:** snapshot policy + checkout owner

### BR-023 — Expired / invalid price lock ile payment başlatılamaz

**Scope:** checkout -> payment

**Binding Rule:** Süresi dolmuş, consume edilmiş veya invalid hale gelmiş lock ile payment handoff üretilemez.

**Owner / Enforcement:** checkout state guard + payment readiness guard

### BR-024 — Batch activation geçmiş siparişe geriye dönük yazılamaz

**Scope:** pricing history

**Binding Rule:** Yeni fiyat aktivasyonu yalnız yeni işlem bağlamını etkiler; oluşmuş order ve settlement referansını değiştirmez.

**Owner / Enforcement:** merkezi fiyat owner + snapshot policy

---

## 7. Kampanya kuralları

### BR-030 — Kampanya merkezi fiyat sisteminin üstünde çalışan özel ticari rejimdir

**Scope:** campaign

**Binding Rule:** Kampanya bağımsız fiyat motoru değildir; merkezi fiyatın üstünde çalışan özel fiyat/görünürlük rejimidir.

**Owner / Enforcement:** campaign owner

### BR-031 — Kampanya yalnız 2. havuzda çalışır

**Scope:** campaign activation

**Binding Rule:** Ürün önce kabul/onay ve merkezi fiyat hazırlığından geçmiş olmalıdır; kampanya daha sonra devreye girer.

**Owner / Enforcement:** campaign owner + product acceptance + pricing owner

### BR-032 — Kampanya görünürlük ve fiyat etkisini birlikte taşıyabilir

**Scope:** campaign surface + checkout

**Binding Rule:** Kampanya indirim ve vitrin görünürlüğü taşıyabilir; fakat campaign badge final price garantisi değildir.

**Owner / Enforcement:** campaign owner + storefront projections + checkout validation

### BR-033 — Kampanya checkout’ta yeniden doğrulanır

**Scope:** checkout

**Binding Rule:** Kampanya aktiflik penceresi, kapsamı ve applicability işlem anında yeniden doğrulanır.

**Owner / Enforcement:** checkout owner + campaign owner

### BR-034 — Kampanya etkisi order snapshot’a yazılır

**Scope:** order

**Binding Rule:** İşlem anındaki campaign context ve financial effect order snapshot’ında korunur.

**Owner / Enforcement:** order owner + snapshot policy

### BR-035 — Süresi biten kampanya sessiz devam edemez

**Scope:** campaign lifecycle

**Binding Rule:** Campaign window bittiğinde canlı satışta otomatik sürmez; checkout bunu reject etmelidir.

**Owner / Enforcement:** campaign owner + checkout owner

---

## 8. Kupon kuralları

### BR-040 — Kupon kampanyadan ayrı sistemdir

**Scope:** coupon

**Binding Rule:** Kampanya merkezi promosyon rejimidir; kupon ise kullanıcı aksiyonu ile tetiklenen kodlu/koşullu indirim sistemidir.

**Owner / Enforcement:** coupon owner

### BR-041 — Kupon sponsor modeli zorunludur

**Scope:** coupon

**Binding Rule:** Kupon uygulanmadan önce indirim maliyetinin kim tarafından taşındığı tanımlanmış olmalıdır.

**Owner / Enforcement:** coupon owner + finance attribution

### BR-042 — İlk faz kupon oluşturucuları yalnız platform ve fenomen mağazasıdır

**Scope:** coupon create

**Binding Rule:** Tedarikçi ilk fazda kupon oluşturucu değildir.

**Owner / Enforcement:** coupon owner + actor/scope guard

### BR-043 — Fenomen kuponu yalnız kendi mağazasında geçerlidir

**Scope:** creator coupon

**Binding Rule:** Fenomen kuponu yalnız ilgili creator storefront bağlamında ve o mağazanın aktif ürünlerinde uygulanabilir.

**Owner / Enforcement:** coupon owner + store context validation

### BR-044 — Fenomen kuponu fiyat koridorunu ve minimum net marjı bozamaz

**Scope:** creator coupon

**Binding Rule:** Fenomen sponsorlu kupon final total’ı koridor dışına itemez ve fenomen tarafını platformun belirlediği minimum net marjın altına düşüremez.

**Owner / Enforcement:** coupon owner + pricing owner + settlement rules

### BR-045 — Kupon applicability ile sponsor attribution ayrı adımdır

**Scope:** coupon evaluation

**Binding Rule:** Kuponun uygulanabilir olması, maliyetin kime yazılacağını otomatik çözmez; sponsor attribution ayrı hesaplanır.

**Owner / Enforcement:** coupon owner + settlement owner

### BR-046 — Kupon nihai olarak checkout’ta doğrulanır

**Scope:** cart -> checkout

**Binding Rule:** PDP/cart seviyesindeki kupon görünürlüğü ön bilgi olabilir; final validity checkout’ta belirlenir.

**Owner / Enforcement:** checkout owner

### BR-047 — Kupon snapshot order’a zorunlu yazılır

**Scope:** order snapshot

**Binding Rule:** En az coupon_id, coupon_code, coupon_type, sponsor_type ve applied_discount_amount order snapshot’ında korunur.

**Owner / Enforcement:** order owner + snapshot policy

---

## 9. Kampanya + kupon birlikte çalışma kuralları

### BR-050 — Stacking serbest değildir

**Scope:** campaign + coupon

**Binding Rule:** Kampanya ve kupon aynı işlemde yalnız açık kural seti izin veriyorsa birlikte çalışır; sınırsız stacking yoktur.

**Owner / Enforcement:** campaign owner + coupon owner + checkout validation

### BR-051 — Faz-1 default policy: kampanyalı üründe fenomen kuponu kapalıdır

**Scope:** campaign + creator coupon

**Binding Rule:** İlk faz varsayılan güvenli politika budur. Açık istisna tanımı olmadan creator coupon campaign-active ürüne uygulanmaz.

**Owner / Enforcement:** coupon owner + campaign owner

### BR-052 — Platform kuponu kampanyayla birlikte çalışacaksa tek final pricing evaluation zorunludur

**Scope:** checkout final pricing

**Binding Rule:** Campaign effect ve coupon effect ayrı ayrı yüzeylere yayılıp sonradan birleştirilemez; final evaluation tek hesap motorunda yapılır.

**Owner / Enforcement:** checkout owner + pricing/promotion evaluation layer

### BR-053 — Aynı siparişte çoklu promosyon kaynağı varsa finance attribution açık tutulur

**Scope:** settlement

**Binding Rule:** İndirim kaynakları ve maliyet taşıyıcıları denetlenebilir biçimde saklanmalıdır.

**Owner / Enforcement:** settlement owner

### BR-054 — Aynı anda birden fazla kupon aktif uygulanmaz

**Scope:** coupon application

**Binding Rule:** İlk fazda tek işlem bağlamında birden çok kuponun birlikte aktif uygulanması kapalıdır; açıkça tanımlı istisna yoksa tek kupon modeli geçerlidir.

**Owner / Enforcement:** coupon owner + checkout validation

---

## 10. Checkout / payment / order zinciri kuralları

### BR-060 — Checkout sepet değildir, payment değildir, order değildir

**Scope:** commerce core chain

**Binding Rule:** Checkout’un görevi sipariş hazırlığını doğrulamak ve payment için güvenli bağlam üretmektir.

**Owner / Enforcement:** checkout owner

### BR-061 — Guest checkout ticari istisnadır

**Scope:** checkout / payment

**Binding Rule:** Misafir kullanıcı checkout ve payment akışına girebilir; fakat bu model sosyal hak açmaz.

**Owner / Enforcement:** auth/access rules + checkout/payment guards

### BR-062 — Nihai ticari doğruluk checkout’ta kurulur

**Scope:** checkout

**Binding Rule:** Sepet niyet taşır; ürün aktifliği, varyant, fiyat, stok, delivery suitability ve promosyon applicability checkout’ta final doğrulanır.

**Owner / Enforcement:** checkout owner

### BR-063 — Geçersiz checkout payment aşamasına taşınamaz

**Scope:** checkout -> payment

**Binding Rule:** Invalid, expired veya ready_for_payment üretmemiş checkout için payment başlatılamaz.

**Owner / Enforcement:** checkout state guard + payment guard

### BR-064 — Payment doğrudan sepetten değil checkout validated context’ten beslenir

**Scope:** payment

**Binding Rule:** Payment create için tek doğru giriş, checkout validated payment context’tir.

**Owner / Enforcement:** payment owner

### BR-065 — Captured = order_created değildir

**Scope:** payment / order

**Binding Rule:** Payment captured yalnız order create hakkı doğurur; order ayrıca ve idempotent biçimde oluşturulur.

**Owner / Enforcement:** payment owner + order owner

### BR-066 — Order yalnız başarılı payment sonrası oluşur

**Scope:** order

**Binding Rule:** Checkout tamamlanması veya payment başlatılması order oluşturmaz.

**Owner / Enforcement:** order owner

### BR-067 — Order snapshot tabanlı çalışır

**Scope:** order

**Binding Rule:** Fiyat, kupon, kampanya, adres ve storefront/store context işlem anındaki haliyle snapshot olarak yazılır.

**Owner / Enforcement:** order owner + snapshot policy

### BR-068 — Çok mağazalı siparişte tek sipariş görünümü mümkün, line ve package bağlamı korunur

**Scope:** order / shipment

**Binding Rule:** Kullanıcı yüzünde tek sipariş deneyimi olabilir; fakat iç tarafta line/package/store context ayrı korunur.

**Owner / Enforcement:** order owner + shipment owner

---

## 11. Cancel / return / refund etkisi kuralları

### BR-070 — İptal teslimat öncesi, iade teslimat sonrası eksendir

**Scope:** cancel / return

**Binding Rule:** Bu ayrım sert korunur; tek birleşik belirsiz geri alma modeli kullanılmaz.

**Owner / Enforcement:** cancel/return owner

### BR-071 — Cancel / return order’ı silmez, sonucunu değiştirir

**Scope:** order aftermath

**Binding Rule:** Cancel/return order truth’unu yok etmez; order sonucu, line sonucu ve bağlı entitlement/finance etkilerini değiştirir.

**Owner / Enforcement:** cancel/return owner + order owner

### BR-072 — Refund execution cancel/return ile ilişkili ama aynı sistem değildir

**Scope:** cancel/return / payment

**Binding Rule:** Finansal refund yürütmesi payment/refund alanında kalır.

**Owner / Enforcement:** payment owner + cancel/return references

### BR-073 — Cancel / return line-level first-class kabul edilir

**Scope:** order / return / settlement

**Binding Rule:** Kısmi iptal ve kısmi iade first-class desteklenir; tek kaba sipariş sonucu modeli yeterli değildir.

**Owner / Enforcement:** cancel/return owner + order owner + settlement owner

### BR-074 — Return sonrası trust / reward / visibility etkileri yeniden değerlendirilir

**Scope:** post-delivery entitlements

**Binding Rule:** Review, verified purchase, story visibility ve reward etkisi return/refund sonucu yeniden hesaplanabilir veya düşebilir.

**Owner / Enforcement:** eligibility/reward owners + cancel/return refs + moderation/risk if needed

### BR-075 — Return tüm geçmiş UGC’yi otomatik hard delete etmez

**Scope:** UGC aftermath

**Binding Rule:** İade olmuş işlem, geçmiş UGC’yi otomatik fiziksel silme gerekçesi yapmaz; görünürlük/trust/reward etkisi ayrı değerlendirilir.

**Owner / Enforcement:** UGC owner + moderation/policy + entitlement logic

---

## 12. Reward lifecycle kuralları

### BR-080 — Reward yalnız doğrulanabilir ve değerli kullanıcı katkısından kazanılır

**Scope:** reward

**Binding Rule:** İlk fazda yalnız teslim edilmiş ürün için review ve user product story katkısı puan üretir.

**Owner / Enforcement:** reward owner + relevant eligibility + moderation/risk

### BR-081 — Story reward moderasyon onayı olmadan kesinleşmez

**Scope:** reward / story

**Binding Rule:** Story upload puan hakkı doğurabilir; fakat spendable zincire girebilmesi için moderasyon onayı gerekir.

**Owner / Enforcement:** moderation owner + reward owner

### BR-082 — Reward earned ile reward spendable aynı şey değildir

**Scope:** reward lifecycle

**Binding Rule:** Reward lifecycle en az pending -> vested -> spendable ayrımını korur.

**Owner / Enforcement:** reward owner

### BR-083 — Pending ve vested puan otomatik spendable değildir

**Scope:** reward spend

**Binding Rule:** Harcama eşiği spendable state’tir.

**Owner / Enforcement:** reward owner + point market guard

### BR-084 — Duplicate contribution duplicate reward üretmez

**Scope:** reward abuse protection

**Binding Rule:** Aynı ürün için aynı katkı türünden tekrar reward üretimi sınırlıdır.

**Owner / Enforcement:** reward owner + idempotency + risk signals

### BR-085 — Reward oranları yönetilebilir, lifecycle mantığı serbest toggle değildir

**Scope:** reward config

**Binding Rule:** Puan miktarı runtime business config olabilir; fakat lifecycle ve hak açılış mantığı admin toggle ile keyfi değiştirilemez.

**Owner / Enforcement:** config policy + reward owner

---

## 13. Puan market kuralları

### BR-090 — Puan market normal katalogdan ayrı çalışır

**Scope:** point market

**Binding Rule:** Puan market para fiyatı ile değil, spendable point bakiyesi ile çalışan ayrı ticari kullanım alanıdır.

**Owner / Enforcement:** point market owner + reward owner

### BR-091 — Puan market tamamen platform kontrolündedir

**Scope:** point market

**Binding Rule:** Ürün seçimi, puan bedeli, kargo puanı, limit ve aktif/pasif durumu platform tarafından yönetilir.

**Owner / Enforcement:** platform owner / point market owner

### BR-092 — Sufficient spendable point olmadan point market satın alımı yapılamaz

**Scope:** point market redemption

**Binding Rule:** Pending veya yalnız vested puan redemption açmaz.

**Owner / Enforcement:** reward owner + point market guard

### BR-093 — Point markette limit ve stock first-class validasyondur

**Scope:** point market

**Binding Rule:** Aktiflik, stok, kullanıcı başı limit ve reward abuse kontrolleri zorunludur.

**Owner / Enforcement:** point market owner + risk signals

---

## 14. Finansal mutabakat / hakediş kuralları

### BR-100 — Tahsil edilen para ile hak edilmiş para aynı şey değildir

**Scope:** settlement

**Binding Rule:** Payment success sonrası tahsilat oluşabilir; fakat taraf bazlı hakediş ve payout readiness ayrıca hesaplanır.

**Owner / Enforcement:** settlement owner

### BR-101 — Finansal yapı kalem bazlı olmak zorundadır

**Scope:** settlement

**Binding Rule:** Brüt tutar, indirim etkileri, sponsor attribution, net satış, taraf payları, blok ve düzeltme tek kaba alan altında ezilemez.

**Owner / Enforcement:** settlement owner

### BR-102 — Settlement line line-level financial truth’tur

**Scope:** settlement

**Binding Rule:** Settlement line order-level kaba toplam değil, line-level dağıtım ve düzeltme birimidir.

**Owner / Enforcement:** settlement owner

### BR-103 — Kupon / kampanya sponsor etkisi finansal dağıtıma görünür yansır

**Scope:** settlement attribution

**Binding Rule:** İndirim maliyetinin hangi tarafa ait olduğu denetlenebilir kayıtta korunmalıdır.

**Owner / Enforcement:** settlement owner

### BR-104 — Return / refund sonrası financial adjustment zorunludur

**Scope:** settlement corrections

**Binding Rule:** Return/refund etkileri settlement line üstünde adjustment / reverse mantığıyla işlenir.

**Owner / Enforcement:** settlement owner + refund refs

### BR-105 — Settled ile payable aynı şey değildir

**Scope:** settlement / payout

**Binding Rule:** Her settled line otomatik payout’a uygun hale gelmez.

**Owner / Enforcement:** settlement owner + payout owner

---

## 15. Payout kuralları

### BR-110 — Hakediş oluşması ile payout aynı şey değildir

**Scope:** payout

**Binding Rule:** Kesinleşmiş hakediş, payout ön koşulları ve dönemsel batch süreci olmadan ödeme çıkışına dönüşmez.

**Owner / Enforcement:** payout owner

### BR-111 — Payout yalnız payable bakiyeden çalışır

**Scope:** payout input

**Binding Rule:** Settlement payable olmadan payout batch’e girilmez.

**Owner / Enforcement:** payout owner + settlement owner

### BR-112 — Payout ön koşulları zorunludur

**Scope:** payout readiness

**Binding Rule:** En az şu şartlar gerekir:

* active/payable actor context
* verified payout account
* minimum threshold met
* no risk hold
* no finance hold
* no unresolved critical dispute

**Owner / Enforcement:** payout owner + finance admin + risk signals

### BR-113 — Payout owner’ı platformdur

**Scope:** payout

**Binding Rule:** Fenomen ve tedarikçi payout alıcısıdır; payout truth owner’ı değildir.

**Owner / Enforcement:** payout owner

### BR-114 — Batch success ile line success aynı şey değildir

**Scope:** payout batch

**Binding Rule:** Batch processed görünse bile line-level partial failure / retry senaryosu ayrı tutulur.

**Owner / Enforcement:** payout owner + payout state machine

---

## 16. Creator restriction kuralları

### BR-120 — Fenomen bağımsız satıcı değildir

**Scope:** creator lifecycle

**Binding Rule:** Fenomen kontrollü platform mağazası işleten onaylı aktördür; stock, payment, order ve core commerce truth platformda kalır.

**Owner / Enforcement:** creator lifecycle owner

### BR-121 — Approved ile active aynı şey değildir

**Scope:** creator lifecycle

**Binding Rule:** Başvuru onayı verilmiş olması mağaza kullanımının tam açıldığı anlamına gelmez.

**Owner / Enforcement:** creator lifecycle owner

### BR-122 — Creator restriction kademeli çalışır

**Scope:** creator restriction

**Binding Rule:** Restriction binary değildir; category close, content freeze, visibility downrank, feature disable gibi kısmi daraltmalar uygulanabilir.

**Owner / Enforcement:** creator admin + lifecycle owner + moderation/risk/support signals

### BR-123 — Suspended creator aktif commerce ve içerik davranışı başlatamaz

**Scope:** creator suspension

**Binding Rule:** Suspend state, creator scope’ta yeni aktif ticari ve içerik aksiyonlarını kapatır.

**Owner / Enforcement:** creator lifecycle owner + scope guard

---

## 17. Supplier restriction kuralları

### BR-130 — Tedarikçi ürün kaynağıdır; nihai ticari otorite platformdadır

**Scope:** supplier lifecycle

**Binding Rule:** Tedarikçi ürün, stok ve base price girdisi sağlar; satış fiyatı, kampanya rejimi ve core commerce truth owner’ı değildir.

**Owner / Enforcement:** supplier lifecycle owner + pricing/commerce boundaries

### BR-131 — Approved ile active aynı şey değildir

**Scope:** supplier lifecycle

**Binding Rule:** Onay verilmiş olması yükleme ve fulfillment katılımının tam açıldığı anlamına gelmez.

**Owner / Enforcement:** supplier lifecycle owner

### BR-132 — Supplier restriction operasyonel kalite sinyallerine dayanır

**Scope:** supplier restriction

**Binding Rule:** Product acceptance quality, stock reliability, shipment discipline, return problem rate ve risk signals restriction kararına girdi üretir.

**Owner / Enforcement:** supplier admin + lifecycle owner + operations/risk/quality signals

### BR-133 — Supplier restriction kısmi veya tam olabilir

**Scope:** supplier restriction

**Binding Rule:** Category-level upload close, new product freeze, fulfillment restriction, suspend veya close gibi kademeli model uygulanabilir.

**Owner / Enforcement:** supplier lifecycle owner

---

## 18. Fraud / risk / abuse kuralları

### BR-140 — Her anomali fraud değildir; kritik fraud önce anomali olarak görünür

**Scope:** risk model

**Binding Rule:** Sistem önce signal, sonra score, sonra kademeli action üretir; otomatik sert ceza varsayılan değildir.

**Owner / Enforcement:** risk owner

### BR-141 — Düşük risk gözlem, orta risk kısıt, yüksek risk blok / review / escalation üretir

**Scope:** risk response

**Binding Rule:** Kademeli koruma modeli zorunludur.

**Owner / Enforcement:** risk owner + related domain owners

### BR-142 — Risk sistemi çok sinyalli çalışır

**Scope:** risk scoring

**Binding Rule:** Hesap, kupon, puan, sipariş, iade, payout ve etkileşim sinyalleri birlikte değerlendirilir.

**Owner / Enforcement:** risk owner

### BR-143 — Risk, kupon / reward / payout / return / creator-supplier access alanlarını daraltabilir

**Scope:** risk effects

**Binding Rule:** Risk sonucu ilgili domain owner, eligibility düşüşü, hold veya block uygulayabilir.

**Owner / Enforcement:** ilgili domain owner + risk signal

### BR-144 — Risk blokesi sessiz başarı üretemez

**Scope:** UI / API behavior

**Binding Rule:** Blocked/review durumunda sahte accepted/completed etkisi gösterilmez.

**Owner / Enforcement:** related domain owner + canonical error/state language

---

## 19. Çapraz alan bağlayıcı kurallar

### BR-150 — Effective payable price çok katmanlı değerlendirme sonucudur

**Scope:** pricing / promotion / checkout

**Binding Rule:** Final payable price; price corridor, campaign effect ve coupon effect birlikte değerlendirilerek oluşur.

**Owner / Enforcement:** pricing owner + campaign owner + coupon owner + checkout final validation

### BR-151 — Order snapshot satış sonrası tüm kritik zincirlerin ana referansıdır

**Scope:** order / settlement / return / reward / payout

**Binding Rule:** Sonraki finance, return, entitlement ve payout etkileri canlı source truth’tan değil, uygun snapshot/ref bağlamından yürür.

**Owner / Enforcement:** order owner + snapshot policy

### BR-152 — Delivered sonrası açılan haklar geri döndürülemez varsayılmaz

**Scope:** eligibility / reward / UGC

**Binding Rule:** Delivery review/story/reward hakkı doğurabilir; fakat return, fraud, moderation veya policy sonucu bu etkiler yeniden değerlendirilebilir.

**Owner / Enforcement:** related eligibility/reward/UGC owners + return/risk signals

### BR-153 — Unknown-result kritik alanlarda first-class iş kuralıdır

**Scope:** payment / payout / provider-dependent actions

**Binding Rule:** Timeout veya belirsiz provider sonucu otomatik success/failure sayılmaz; reconciliation ve duplicate-safe finalization gerekir.

**Owner / Enforcement:** integration behavior rules + fallback/retry policy + related domain owner

---

## 20. Faz-1 açık, kapalı ve sonraki dosyaya bırakılan alanlar

### 20.1 Bu dosyada bağlanan alanlar

* sistem üst ilkeleri
* fiyat koridoru
* price lock / batch activation
* kampanya üst kuralları
* kupon sponsor ve marj koruma
* checkout / payment / order zinciri
* cancel / return / refund üst etkileri
* reward lifecycle üst kuralları
* point market üst kuralları
* settlement / payout ayrımı
* creator / supplier restriction üst kuralları
* fraud / risk üst modeli

### 20.2 Bu dosyada detaylandırılmayan alanlar

* review/story/question eligibility detay matrisi
* kampanya kombinasyonlarının tüm edge-case matrisi
* UGC görünürlük ve moderasyon detay matrisi
* appeal ve restore süreçleri

Bu alanlar ilgili Aşama 10 dosyalarında detaylandırılır.

---

## 21. Kısa sonuç

Bu registry ile aşağıdaki çekirdek kararlar sert biçimde sabitlenmiş olur:

* ticari otorite platformdadır
* baz fiyat ile satış fiyatı aynı değildir
* kampanya ve kupon aynı şey değildir
* kupon sponsor modeli zorunludur
* fenomen kuponu koridoru ve minimum net marjı bozamaz
* checkout doğrular, payment finansal sonucu üretir, order resmi ticari kaydı oluşturur
* captured order_created değildir
* cancel / return sonrası finance, reward ve visibility etkileri yeniden değerlendirilir
* pending / vested / spendable ayrımı zorunludur
* settled payable değildir, payable paid_out değildir
* creator ve supplier restriction lifecycle üstünden yürür
* fraud / risk kademeli koruma modeliyle çalışır

Bu dosya, Aşama 10 içindeki diğer rulebook dosyalarının üzerinde duran bağlayıcı business rule omurgasıdır.
