KAMPANYA SİSTEMİ
1. Sistem tanımı

Kampanya sistemi, platformun 2. havuza geçmiş ve ticari olarak hazırlanmış ürünler üzerinde belirli dönemlerde özel fiyat rejimi, görünürlük ve ticari teşvik kurgusu uyguladığı merkezi promosyon sistemidir. Bu sistem bağımsız bir fiyat motoru değildir; merkezi fiyat sisteminin üzerinde çalışan, platform kontrollü özel ticari rejim katmanıdır. Sistem ağacında kampanya sistemi kısmen hazır başlıklar arasında yer alır.

2. Sistemin ana amacı

Kampanya sisteminin ana amacı şudur:

belirli ürün veya kategorilerde kontrollü satış ivmesi üretmek,
sezon, lansman, vitrin ve dönemsel ticari ihtiyaçlara cevap vermek,
platformun merkezi fiyat sistemini bozmadan promosyon rejimi kurmak,
ana sayfa, kategori, PDP ve mağaza yüzeylerinde kampanyalı ticari görünürlük oluşturmak,
fiyat indirimi ve görünürlük desteğini tek merkezden yönetmektir.

Havuz sisteminde kampanyalı ürün rejiminin ve lansman dönemi fiyat rejiminin platform alanı olduğu açıkça yazılıdır.

3. Temel ilke

Bu sistemin temel ilkesi şudur:

Kampanya, 1. havuzda değil 2. havuzda çalışır.

Yani:

tedarikçi baz fiyatı kampanya fiyatı değildir,
ürün önce kabul/onay sürecinden geçer,
platform kârı eklenir,
havuz taban fiyatı ve satış koridoru oluşur,
kampanya ancak bundan sonra devreye girer.

Bu ilke esnetilmez. Çünkü 1. havuz kabul ve hazırlık alanıdır; ticari özel rejimler 2. havuzun alanıdır.

4. Aktörler

4.1 Platform
Kampanya açar, kapatır, kampanya türünü belirler, kampanya kapsamını seçer, kampanya fiyat rejimini yönetir. Nihai otoritedir.

4.2 Tedarikçi
Kampanya başlatamaz. Yalnız baz fiyat sağlar ve günceller. Kampanya truth owner değildir.

4.3 Fenomen mağaza
Bağımsız kampanya motoru değildir. Kendi başına kampanya açamaz. Yalnız platformun açtığı kampanyalı ticari rejim içinde satış yapabilir.

5. Kampanya sisteminin platform içindeki rolü

Akış içinde kampanya sisteminin rolü şöyledir:

ürün 1. havuzdan geçer,
havuzda merkezi fiyat sistemi tarafından fiyatlandırılır,
platform kampanya uygunsa ürün/kategori üzerinde özel kampanya rejimi açar,
kampanyalı fiyat veya kampanya etiketi yüzeylere yansır,
checkout’ta kampanya geçerliliği ve final fiyat tekrar doğrulanır,
siparişe işlem anındaki kampanyalı fiyat snapshot olarak yazılır.

Bu nedenle kampanya sistemi:

ürün kabul sistemi değildir,
merkezi fiyat sisteminin yerine geçmez,
ama merkezi fiyat sisteminin özel ticari rejim katmanıdır.
6. Kampanya sisteminin temel bileşenleri

İlk fazda kampanya sistemi en az şu bileşenlerden oluşmalıdır:

kampanya kimliği
kampanya adı
kampanya tipi
kapsamı
başlangıç zamanı
bitiş zamanı
aktif/pasif durumu
kampanyalı fiyat rejimi
görünürlük etiketi / vitrin bilgisi
gerekiyorsa öncelik / sıralama desteği

Bu yapı kampanyayı yalnız indirim değil, aynı zamanda görünürlük rejimi olarak da ele almaya izin verir.

7. Kampanya türleri

İlk faz için en doğru kampanya tipleri şunlardır:

7.1 Ürün bazlı kampanya
Belirli ürünlerde kampanyalı görünüm ve fiyat avantajı.

7.2 Kategori bazlı kampanya
Belirli kategori veya alt kategorilerde dönemsel kampanya.

7.3 Sezon / vitrin kampanyası
Ana sayfa, kategori ve vitrin alanlarında gösterilen dönemsel ticari seçki.

7.4 Lansman kampanyası
Yeni ürün / yeni seri / özel açılış dönemi için özel fiyat rejimi.

İlk fazda kupon, kompleks sepet indirimi, çoklu kural zinciri gibi ağır yapılar zorunlu değildir.

8. Kapsam modeli

Kampanya kapsamı en az şu seviyelerde çalışabilmelidir:

tek ürün
ürün grubu
kategori
alt kategori
vitrin / seçki seti

Bu yapı ana sayfa, kategori, mağaza ve PDP yüzeyleriyle uyumlu görünürlük sağlar.

9. Merkezi fiyat sistemi ile ilişkisi

Kampanya sistemi merkezi fiyat sistemini bypass etmez. Doğru model:

baz fiyat → platform kârı → havuz taban fiyatı → normal satış koridoru
ardından gerekiyorsa kampanya rejimi uygulanır

Yani kampanya, merkezi fiyat sisteminin üstünde çalışan kontrollü özel durumdur. Kampanyalı ürün rejiminin platform alanı olması bunu destekler.

10. Kampanya fiyat davranışı

İlk faz için en güvenli kampanya fiyat mantığı şu olmalıdır:

ürünün normal satış fiyatı vardır
kampanya açıksa kampanyalı fiyat görünür
eski fiyat / yeni fiyat görünümü gerekiyorsa yüzeyde gösterilir
checkout’ta kampanya hâlâ geçerliyse bu fiyat doğrulanır
kampanya bitmişse normal fiyat devreye döner

Bu model fiyat snapshot ve checkout doğrulama mantığıyla uyumludur.

11. Fenomen tarafında kampanya sınırı

Fenomen mağaza kendi başına:

kampanya açamaz
indirim rejimi tanımlayamaz
koridor dışı kampanyalı fiyat kuramaz

Doğru model:

platform kampanya açar
platform kampanyalı koridor veya kampanyalı görünürlük verir
fenomen bunun içinde kalır

Bu, fenomen mağazanın bağımsız fiyat motoru olmadığı kuralıyla birebir uyumludur.

12. Tedarikçi tarafında kampanya sınırı

Tedarikçi kampanya motorunun aktörü değildir. Tedarikçi:

baz fiyat verir
stok günceller
ürün kaynağını sağlar

Ama:

kampanya açamaz
kampanya görünürlüğü yönetemez
kampanya satış fiyatı kuramaz

Bu ayrım havuz mantığının ana koruma çizgisidir.

13. Varyant ile ilişkisi

Bazı ürünlerde kampanya etkisi varyant bazlı fiyat yapısını da etkileyebilir. Doğru model:

varyant bazlı baz fiyat varsa kampanya davranışı bunu dikkate alır
ama ilk fazda tüm varyantlara aynı kampanya rejimi uygulamak daha güvenli olabilir
varyant bazlı kampanya karmaşıklığı gerekiyorsa sonraki faza bırakılabilir

Bu karar varyant bazlı fiyat desteği ile uyumludur ama ilk fazı gereksiz karmaşıklaştırmaz.

14. Yüzeylerde kampanya görünürlüğü

Kampanya etkisi şu yüzeylerde görünmelidir:

ana sayfa
kategori / PLP
PDP
fenomen mağaza ürün akışı
gerekiyorsa kampanya/vitrin blokları

Ana sayfa sistemi dosyasında promo/vitrin bandı ve kampanya yönlendirmesi zaten vardır. Kategori/PLP ve PDP de fiyat karar yüzeyleridir.

15. Promo / vitrin ilişkisi

Ana sayfa sistemi, kampanya ve vitrin görünürlüğü için ayrı alanlar tanımlar:

promo / vitrin bandı
kampanya yönlendirmesi
haftanın vitrini
editoryal ticari alan

Bu nedenle kampanya sistemi yalnız fiyat değil, aynı zamanda kontrollü merchandising görünürlüğü de üretmelidir.

16. Zaman penceresi

Kampanya sistemi zaman bazlı olmalıdır:

başlangıç zamanı
bitiş zamanı
aktif/pasif durumu

Kampanya görünürlüğü ve fiyat etkisi bu pencere içinde geçerli olur. Kampanya bitince sistem normal rejime döner.

17. Checkout ile ilişkisi

Checkout kampanyalı fiyatı körlemesine kabul etmemelidir. Doğru model:

satır checkout’a geldiğinde kampanya hâlâ aktif mi kontrol edilir
kampanyalı fiyat geçerliyse toplam buna göre hesaplanır
kampanya bitmiş veya değişmişse kullanıcıya dürüst fark gösterilir
checkout eski kampanyalı fiyatı snapshot truth gibi korumaz

Bu, mevcut price_mismatch ve final doğrulama mantığıyla uyumludur.

18. Sipariş ile ilişkisi

Sipariş oluştuğunda kampanyalı fiyat artık işlem anındaki resmi snapshot olarak kayda geçer. Sonradan kampanya bitse bile geçmiş sipariş bundan etkilenmez. Bu, sipariş sistemindeki doğrulanmış fiyat snapshot mantığının doğal sonucudur.

19. Kampanya ve destek ilişkisi

Kampanya sistemi destek sistemiyle doğrudan karışmamalıdır. Ancak şu durumlarda destek konusu olabilir:

kampanya fiyatı checkout’ta değişti
kullanıcı kampanya gördü ama siparişte farklı fiyat oluştu
kampanya bitişi ile ilgili anlaşmazlık

Bu gibi durumlarda destek sistemi bilgilendirilir, ama kampanya truth owner değildir.

20. Ana riskler

Kampanya sistemindeki ana riskler şunlardır:

kampanyanın 1. havuza yanlış uygulanması
merkezi fiyat sistemini bypass etmesi
fenomenin bağımsız kampanya açması
tedarikçinin kampanya fiyatı belirlemeye kalkması
kampanyanın checkout’ta doğrulanmaması
kampanya bittiği halde eski fiyatın görünmesi
varyantlı ürünlerde kampanya/fiyat çakışması

Bu yüzden sistem merkezi ve sıkı kontrollü kalmalıdır.

21. Ana kurallar

Kampanya sistemi için sabitlenmesi gereken temel kurallar şunlardır:

kampanya sistemi 2. havuz üstünde çalışır
havuz kabul alanıdır; kampanya alanı değildir
kampanya açma ve kapatma yetkisi yalnız platformdadır
tedarikçi kampanya başlatamaz
fenomen mağaza bağımsız kampanya motoru değildir
kampanya merkezi fiyat sistemini bypass etmez
kampanya özel ticari rejim olarak merkezi fiyat sisteminin üstünde çalışır
ürün, kategori, sezon/vitrin ve lansman kampanyaları ilk faz için yeterlidir
kampanya görünürlüğü ana sayfa, kategori, PDP ve mağaza yüzeylerine yansıyabilir
checkout kampanya geçerliliğini yeniden doğrular
sipariş işlem anındaki kampanyalı fiyat snapshot’ını taşır
kampanya bitince sistem normal fiyat rejimine döner.
22. Nihai kısa özet

Kampanya sistemi, platformun 2. havuza geçmiş ve merkezi fiyat sistemiyle ticari olarak hazırlanmış ürünler üzerinde çalışan; ürün, kategori, vitrin veya lansman bazlı özel fiyat ve görünürlük rejimi kuran; tedarikçi ve fenomen tarafından değil yalnız platform tarafından yönetilen; checkout’ta doğrulanıp siparişte kampanyalı fiyat snapshot’ı olarak kayda geçen merkezi promosyon sistemidir.