BEĞENİLER SAYFASI VE KAYDET SAYFASI SİSTEMİ
1. Sistem tanımı

Beğeniler sayfası ve Kaydet sayfası, kullanıcının ürünler üzerinde verdiği iki temel etkileşimin kullanıcı yüzünde ayrı ayrı listelendiği kişisel alanlardır.

Beğeniler sayfası kullanıcının ilgi verdiği ürünleri görünür kılar.
Kaydet sayfası ise daha sonra dönülmek istenen ürünlerin kişisel kayıt alanıdır.

Bu iki sayfa aynı sistem ailesine aittir; ancak aynı anlamı taşımaz ve birbirinin yerine geçmez.

2. Sistemin ana amacı

Bu sistemin ana amacı şudur:

kullanıcının kaydettiği şeylere daha sonra kolayca dönebilmesini sağlamak,
kaydetme aksiyonunu yalnız veri sinyali olmaktan çıkarıp kullanıcı faydasına dönüştürmek,
ürünlerde “sonra bakarım / sonra karar veririm” davranışını desteklemek,
platform içinde geri dönüş ve yeniden değerlendirme yüzeyi oluşturmaktır.

Kaydetme mevcut dosyalarda açıkça niyet sinyali olarak tanımlanır. Bu yüzden kullanıcı tarafında karşılığı olan bir kayıtlılar yüzeyi mantıklıdır.

3. Temel ilke

Bu sistemin temel ilkesi şudur:

Kaydettiklerim sayfası yeni bir sosyal aksiyon alanı değil, kaydetme aksiyonunun kişisel geri dönüş alanıdır.

Yani:

yeni “favori” kavramı icat edilmez,
beğeni ile karıştırılmaz,
sosyal akış sayfası olmaz,
kaydedilmiş nesnelerin düzenli görünümüdür.

Bu, mevcut beğen / kaydet / paylaş omurgasıyla uyumludur.
4. Beğeniler sayfası
Beğenilen ürünler beğeniler sayfasında görünür.
Bu görünürlük varsayılan olarak kullanıcıya özel olabilir veya ileride ayarlanabilir yapı desteklenebilir.

4. Beğeni ile farkı

Bu ayrım net olmalıdır:

Beğeni = hafif ilgi sinyali
Kaydetme = sonra dönme / niyet sinyali

Bu yüzden:

5. Kaydet sayfası
Kaydedilen ürünler Kaydet sayfasında görünür.
Kaydet sayfası kesin özel yapıdadır.


Bu doğrudan mevcut interaction tanımından çıkar.

5. İlk fazda kapsam

İlk faz için en doğru model:

yalnız kaydedilen ürünler kayıtlılar sayfasında gösterilsin.

Çünkü mevcut dosyalarda kaydetme ürün, story ve post üzerinde çalışabilse de, kullanıcı tarafında gerçek ticari değer ve geri dönüş ihtiyacı en güçlü olarak ürünlerde oluşur. Bu nedenle ilk fazı sade tutmak gerekir.

6. İleri faz kapsamı

İleride istersek şu genişleme yapılabilir:

kaydedilen ürünler
kaydedilen story’ler
kaydedilen fenomen mağaza postları

Ama bu ilk faz için şart değildir. İlk faz ürün odaklı başlamalıdır; aksi halde sayfa gereksiz karmaşık olur. Bu öneri, mevcut dosyalardaki etkileşim omurgasıyla uyumludur ama daha kontrollü bir uygulama sırasıdır.

7. Kim kullanabilir

Kaydettiklerim sayfası yalnız giriş yapmış kullanıcı içindir. Çünkü kaydetme write aksiyonu kimlik bağlıdır ve kullanıcıya ait kişisel liste üretir. Misafir kullanıcı açık yüzeyleri görebilir ama kayıtlılar sayfasının ana aktörü değildir. Bu, üyelik/giriş sistemi ve etkileşim sistemiyle uyumludur.

8. Sayfanın platform içindeki rolü

Bu sayfa:

keşfet değildir,
kategori/PLP değildir,
takip akışı değildir,
sosyal medya benzeri koleksiyon akışı değildir.

Bu sayfa, kullanıcının kendi kaydetme niyetinin liste görünümüdür. Esas rolü ticari geri dönüş kolaylığıdır.

9. Ana içerik yapısı

İlk fazda kayıtlılar sayfasında her kayıt satırında en az şu bilgiler görünmelidir:

ürün görseli
ürün adı
güncel fiyat
mağaza bağlamı
varsa puan
kaydı kaldır aksiyonu
PDP’ye git aksiyonu

Bu yapı, mevcut klasik ürün kart ve PDP kararlarıyla uyumlu sade bir ürün geri dönüş yüzeyi üretir.

10. Fiyat ve stok davranışı

Kaydedilen ürün, kayıt anındaki değil güncel fiyat ve stok bağlamıyla görünmelidir. Çünkü kaydetme sistemi wishlist benzeri niyet yüzeyidir; resmi sipariş snapshot’ı değildir. Bu yüzden:

fiyat değişmiş olabilir,
stok bitmiş olabilir,
ürün pasifleşmiş olabilir,
varyant yapısı değişmiş olabilir.

Kullanıcı bunları dürüst biçimde görmelidir. Bu karar merkezi fiyat, merkezi stok ve checkout doğrulama mantığıyla uyumludur.

11. Ürün pasifleşirse ne olur

Kaydedilen ürün artık aktif değilse:

satır tamamen kaybolmamalı,
“artık mevcut değil” / “şu anda satışta değil” gibi dürüst durum göstermeli,
kullanıcı isterse kaydı kaldırabilmelidir.

Bu yaklaşım kullanıcının kafa karışıklığını azaltır ve liste bütünlüğünü korur.

12. Çok mağazalı bağlam

Aynı ürün farklı mağaza bağlamlarında görünebildiği için kayıtlılar sayfasında mağaza bağlamı görünür olmalıdır. Çünkü PDP mağaza bağlamlı açılır. Doğru model:

kaydedilen nesne ürün + mağaza bağlamı ilişkisini koruyabilir,
kullanıcı tıkladığında ilgili bağlamlı PDP’ye gider.

Bu, PDP ve fenomen mağaza sistemleriyle uyumludur.

13. Kaydı kaldırma

Kayıtlılar sayfasındaki ana aksiyonlardan biri kaydı kaldırmaktır. Doğru model:

kaydet toggle mantığında çalışır,
kullanıcı bu sayfadan doğrudan kaydı kaldırabilir,
kaldırılan ürün listeden düşer.

Bu, kaydetme sisteminin doğal uzantısıdır.

14. Sepete geçiş ilişkisi

İlk fazda kayıtlılar sayfasından doğrudan sessiz “sepete ekle” zorunlu değildir. En güvenli akış:

kullanıcı kaydettiği üründen PDP’ye gider,
varyantlıysa PDP’de seçim yapar,
sonra sepete ekler.

İleride basit ürünlerde hızlı sepete ekleme düşünülebilir; ama ilk fazda PDP köprüsü daha temizdir. Bu karar varyant sistemi ve sepet kurallarıyla uyumludur.

15. Sıralama mantığı

İlk faz için en doğru sıralama:

en son kaydedilenler üstte

Bu model:

basit,
anlaşılır,
kullanıcı beklentisine uygun,
ek ranking motoru gerektirmeyen
bir yapı sağlar.
16. Filtreleme ihtiyacı

İlk fazda ağır filtreleme zorunlu değildir. Ama minimum seviyede şu yardımcı yapı düşünülebilir:

tüm kayıtlılar
mevcut / satışta olanlar
satışta olmayanlar

Bu basit ayrım kullanıcıyı yormadan işlev kazandırır.

17. Sayfanın hesabım içindeki yeri

Bu sayfa en doğru olarak kullanıcı hesabı altında konumlanmalıdır. Çünkü:

kişisel listedir,
giriş gerektirir,
sipariş veya takip kadar kişisel bağ taşır.

Yani ana yüzey değil, hesap / kullanıcı alanı içindeki kişisel yardımcı yüzey olmalıdır.

18. Beğenilenler sayfası gerekir mi

Mevcut sistem omurgasına göre:

ayrı “Beğeniler” sayfası olmalıdır.

Çünkü beğeni hafif ilgi sinyali olsa da, kullanıcı tarafında yeniden dönülebilen ve kişisel ilgi alanını görünür kılan ayrı bir yüzey değeri taşır.

Bu nedenle:

beğeni veri sinyali olarak kalır,
aynı zamanda kullanıcı yüzünde ayrı bir Beğeniler sayfası ile görünür olur,
ama bu sayfa Kaydet sayfası ile karıştırılmaz.

Net ayrım:

Beğeni = hafif ilgi sinyali
Kaydetme = daha güçlü geri dönüş / niyet sinyali

Sonuç olarak:

ayrı Beğeniler sayfası vardır,
ayrı Kaydet sayfası vardır,
iki sayfa aynı sistem ailesinin iki ayrı kullanıcı yüzüdür.

19. Ana riskler

Bu sistemdeki ana riskler:

kaydetme ile beğeninin karışması
mağaza bağlamının kaybolması
pasif ürünlerin sessizce yok olması
kayıtlılar yüzeyinin keşfet/katalog gibi davranmaya başlaması
varyantlı ürünlerde erken sepete ekleme hataları

Bu nedenle kayıtlılar sayfası sade ve işlevsel tutulmalıdır.

20. Ana kurallar

Beğeniler ve Kaydet sayfaları sistemi için sabitlenmesi gereken temel kurallar şunlardır:

bu sistem beğeni ve kaydetme etkileşimlerinin kullanıcı yüzüdür
yeni bir “favori” kavramı açılmaz
ayrı Beğeniler sayfası vardır
ayrı Kaydet sayfası vardır
yalnız giriş yapmış kullanıcı erişir
ilk fazda ürün odaklı çalışır
satırlar güncel fiyat ve stok bağlamıyla görünür
mağaza bağlamı kaybolmaz
pasif ürünler sessizce silinmez; dürüst durumla gösterilir
kullanıcı beğeniyi bu sayfadan kaldırabilir
kullanıcı kaydı bu sayfadan kaldırabilir
ana köprü PDP’ye dönüş olmalıdır
bu sayfalar keşfet veya sosyal akış gibi davranmaz
sıralama ilk fazda en son işaretlenenler mantığıyla çalışır
21. 21. Nihai kısa özet

Beğeniler sayfası ve Kaydet sayfası, kullanıcının ürünler üzerinde verdiği iki temel etkileşimin kişisel liste görünümü olarak çalışan; yeni bir favori kavramı üretmeyen; ilk fazda ürün odaklı ilerleyen; güncel fiyat/stok ve mağaza bağlamını koruyan; birbirine karıştırılmadan ayrı yaşayan iki yardımcı kullanıcı sistemidir.