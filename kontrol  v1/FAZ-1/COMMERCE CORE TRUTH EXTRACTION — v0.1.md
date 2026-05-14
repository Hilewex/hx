FAZ-1 / PAKET-2
COMMERCE CORE TRUTH EXTRACTION — v0.1
1. Ana gerçek

Bu platform klasik marketplace değildir.

Commerce core şu ilkeye dayanır:

tedarikçi ürün kaynağıdır
platform ticari otoritedir
fenomen mağaza vitrin/satış bağlamıdır
stok merkezi truth’tur
fiyat merkezi truth’tur
sipariş platform truth’udur

Havuz sistemi bu ayrımı açıkça kuruyor: ürün kaynağı tedarikçi, ticari otorite platform, satış vitrini fenomen mağazası, stok ve ana ürün gerçeği merkezde tutulur.

2. Commerce actor modeli
Actor	Rolü	Yapamaz
Tedarikçi	ürün, varyant, stok, baz fiyat, lojistik veri sağlar	satış fiyatı, kargo fiyatı, ürün onayı, platform kârı belirleyemez
Platform	ürün onayı, kategori, fiyat, kargo, stok, kampanya, ticari kural owner’ıdır	audit dışı keyfi müdahale yapmamalı
Fenomen	onaylı havuz ürününü mağazasına alır, izinli fiyat aralığında seçim yapar	ürün truth, stok, kargo, ödeme, sipariş owner’ı olamaz
Kullanıcı	ürün inceler, sepete ekler, checkout/ödeme yapar	ticari truth değiştiremez
Admin/Commerce Admin	ürün, fiyat, kampanya, kural kararlarını yönetir	owner bypass/direct DB write yapamaz
3. Ürün lifecycle truth’u

Kanonik ürün akışı:

supplier raw product
→ 1. havuz / kabul-hazırlık
→ doğrulama
→ kategori eşleme
→ varyant/stok/baz fiyat kontrolü
→ platform onayı
→ 2. havuz / ticari satış havuzu
→ platform fiyatlandırma
→ fenomen mağazalara açılma
→ mağaza bağlamlı satış

Kritik kural:

onaysız ürün fenomenlere açılamaz
1. havuz ürünü satış ürünü değildir
2. havuz ürünü satışa hazır ticari üründür

Ürün kabul/onay sistemi bunu net kuruyor: ürün hangi kanaldan gelirse gelsin önce 1. havuza düşer; XML, API veya manuel panelden gelen ürün doğrudan canlı satış havuzuna gidemez.

4. İki havuz truth’u
Havuz	Anlamı	Aktör
1. Havuz	tedarikçi kabul/hazırlık alanı	supplier + platform
2. Havuz	platform ticari satış havuzu	platform + fenomen
havuzda:
ürün alınır
eksik/hatalı veri ayıklanır
varyant kurulur
lojistik veri alınır
kategori belirlenir
ticari hazırlık yapılır
havuzda:
platform kârı uygulanır
fiyat koridoru oluşur
ürün fenomenlere açılır
kampanya/lansman rejimi uygulanabilir
5. Varyant truth’u

Varyant sadece görsel seçenek değildir.

Kanonik tanım:

varyant = satılabilir ticari alt birim

Varyant bazında gerekirse şunlar tutulur:

stok
baz fiyat
ürün kodu
görsel
teslimat farkı
fiyat farkı

Varyantlı üründe varyant seçilmeden ticari akış tamamlanamaz. Varyant sistemi dosyası bunu “varyant yalnız görsel seçenek değil; satılabilir ticari alt birimdir” diye tanımlar.

Repo audit kırmızı çizgileri:

variant optional bırakılmışsa → BROKEN
cart line varyantsız kabul ediyorsa → DANGEROUS
checkout varyant geçerliliğini tekrar doğrulamıyorsa → HIGH RISK
order line varyant snapshot taşımıyorsa → HIGH RISK
6. Merkezi stok truth’u

Ana ilke:

stok görünürlüğü dağıtık olabilir
stok gerçeği dağıtık olamaz

Aynı ürün farklı fenomen mağazalarında görünebilir; ama stok tek merkezde tutulur.

Stok akışı:

supplier stock input
→ platform central stock truth
→ PDP/card visibility
→ cart soft availability
→ checkout hard validation
→ reservation / consumption
→ order
→ cancellation / return correction

Merkezi stok sistemi dosyası aynı ürün farklı mağazalarda görünse bile stok gerçeğinin tek merkezde kalması gerektiğini açıkça söylüyor.

Kritik ayrım:

cart stock guarantee değildir
checkout final stock validation noktasıdır
order sonrası stok etkisi resmi hale gelir

Repo audit kırmızı çizgileri:

fenomen mağaza stok mutate ediyorsa → DANGEROUS
cart stok guarantee gibi davranıyorsa → HIGH RISK
checkout stok yeniden doğrulamıyorsa → DANGEROUS
aynı ürün mağaza bazlı ayrı stok yaratıyorsa → BROKEN
7. Merkezi fiyat truth’u

Ana ilke:

baz fiyat tedarikçiden gelir
satış fiyatı platform tarafından kurulur

Fiyat katmanları:

supplier base price
→ platform margin
→ pool base price
→ min / suggested / max price corridor
→ creator selected price within corridor
→ campaign/coupon effects
→ checkout final price validation
→ order price snapshot

Merkezi fiyat sistemi, tedarikçinin ham baz fiyatını doğrudan satış fiyatı olarak kabul etmez; platform kârı ve fiyat koridoru üretir.

Kritik kurallar:

tedarikçi satış fiyatı belirleyemez
fenomen bağımsız fiyat motoru kuramaz
fenomen sadece izinli koridorda seçim yapabilir
fiyat checkout’ta tekrar doğrulanır
siparişte fiyat snapshot alınır

Repo audit kırmızı çizgileri:

supplier final sale price yazabiliyorsa → BROKEN
creator price corridor dışına çıkabiliyorsa → DANGEROUS
checkout aktif fiyatı yeniden doğrulamıyorsa → HIGH RISK
order line price snapshot yoksa → DANGEROUS
8. Sepet truth’u

Sepet satın alma değildir.
Sepet ticari niyet toplama alanıdır.

Sepet:

ürünleri toplar
mağaza bağlamını korur
varyant/adet bilgisi taşır
fiyat/stok değişimini dürüst gösterir
checkout’a hazırlar

Sepet sosyal yüzey değildir; story/post/yorum akışı burada baskın olmamalıdır.

Kritik ayrım:

cart snapshot olabilir
ama final commercial truth değildir

Sepetten checkout’a geçerken:

ürün aktif mi?
varyant geçerli mi?
stok yeterli mi?
fiyat güncel mi?
mağaza görünürlüğü uygun mu?

kontrol edilmelidir.

9. Checkout truth’u

Checkout son ticari doğrulama sistemidir.

Checkout:

sepeti siparişe hazırlar
adres doğrular
stok doğrular
fiyat doğrular
varyant doğrular
geçersiz satırları bloklar
ödeme öncesi nihai mutabakat üretir

Checkout dosyası “sepet doğruluğu nihai ticari doğruluk değildir; nihai gerçek checkout’ta doğrulanır” kuralını kuruyor.

Kritik kural:

checkout tamamlandı ≠ sipariş oluştu
checkout valid ≠ ödeme başarılı
checkout ödeme için doğrulanmış bağlam üretir

Repo audit kırmızı çizgileri:

checkout stok/fiyat doğrulamadan payment’a geçiyorsa → DANGEROUS
checkout invalid satırı payment’a taşıyorsa → DANGEROUS
adres snapshot üretmiyorsa → HIGH RISK
guest checkout sosyal hak açıyorsa → BROKEN
10. Ödeme truth’u

Ödeme checkout’tan gelen doğrulanmış bağlamı finansal sonuca çevirir.

Ödeme sistemi:

payment intent/request oluşturur
güvenli ödeme akışı yürütür
başarılı/başarısız sonucu belirler
idempotency korur
başarılı işlem sonrası sipariş oluşumunu tetikler

Ödeme sistemi checkout değildir, sipariş değildir. Ödeme, finansal sonucu üretir.

Kritik kural:

payment success → order creation hakkı doğar
payment started → order değildir
payment failed → checkout’a temiz dönüş gerekir

Repo audit kırmızı çizgileri:

payment retry duplicate order üretiyorsa → P0
idempotency yoksa → P0
payment failed ama order oluşuyorsa → P0
checkout dışı ödeme başlatılabiliyorsa → DANGEROUS
11. Sipariş truth’u

Sipariş, başarılı ödeme sonrası oluşan resmi ticari kayıttır.

Sipariş:

checkout snapshot
payment result
user/guest context
order lines
price snapshot
address snapshot
store context
package/supplier split

üzerinden oluşur.

Sipariş sistemi dosyası kritik ayrımı net verir: checkout tamamlandı ya da ödeme başlatıldı demek sipariş oluştu demek değildir; sipariş başarılı ödeme sonrası oluşur.

Kritik kural:

order = official commercial record
cart ≠ order
checkout ≠ order
payment intent ≠ order

Repo audit kırmızı çizgileri:

order payment success öncesi oluşuyorsa → P0
order price/address snapshot yoksa → DANGEROUS
order line store context taşımıyorsa → HIGH RISK
partial package/supplier split yoksa → HIGH RISK
12. Commerce canonical flow

Kanonik akış:

Supplier uploads product
→ Product enters 1st pool
→ Platform validates product
→ Taxonomy/category is assigned
→ Variant/stock/base price validated
→ Product approved
→ Platform creates commercial price structure
→ Product enters 2nd pool
→ Creator adds product to store
→ User views product in store context
→ User selects variant
→ User adds to cart
→ Cart stores commercial intent
→ Checkout revalidates product/variant/stock/price/address
→ Payment processes validated checkout
→ Payment success triggers order creation
→ Order snapshot becomes official record
→ Operations/fulfillment starts
13. Commerce core invariant list

Bu kurallar bozulmamalı:

onaysız ürün satışa çıkmaz
ürün truth platform/havuz merkezlidir
stok merkezi truth’tur
fiyat merkezi truth’tur
tedarikçi baz fiyat verir, satış fiyatı kurmaz
fenomen stok/kargo/sipariş owner değildir
fenomen fiyat koridoru dışına çıkamaz
varyantlı üründe varyant zorunludur
cart final truth değildir
checkout final validation noktasıdır
payment idempotent olmalıdır
order yalnız payment success sonrası oluşur
order snapshot immutable olmalıdır
14. Commerce core audit checklist

Repo audit’te kontrol edilecek ilk sorular:

1. Ürünler gerçekten 1. havuz → 2. havuz akışıyla mı ilerliyor?
2. Onaysız ürün storefront’a düşebiliyor mu?
3. Fiyat supplier base price’tan mı, platform price engine’den mi geliyor?
4. Creator price corridor enforced mı?
5. Stok tek merkezde mi?
6. Cart stock guarantee gibi mi davranıyor?
7. Checkout fiyat/stok/varyantı tekrar doğruluyor mu?
8. Payment idempotency var mı?
9. Order sadece payment success sonrası mı oluşuyor?
10. Order snapshot price/address/variant/store context taşıyor mu?
11. Fenomen veya supplier illegal commerce write yapabiliyor mu?
12. Panel direct DB write var mı?
15. Bu paketin sonucu

Şu çıktı oluştu:

COMMERCE_CORE_TRUTH_v0.1

Bu çıktı repo audit sırasında özellikle şu alanlarda kullanılacak:

product lifecycle
pool lifecycle
variant validity
stock ownership
price ownership
cart vs checkout boundary
payment idempotency
order creation rule
snapshot immutability
creator/supplier boundary