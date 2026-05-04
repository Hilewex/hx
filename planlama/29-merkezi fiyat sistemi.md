MERKEZİ FİYAT SİSTEMİ
1. Sistem tanımı

Merkezi fiyat sistemi, tedarikçiden gelen baz fiyatı platformun ticari kurallarıyla işleyerek 2. havuz için satışa hazır fiyat yapısına dönüştüren; havuz taban fiyatı, minimum fiyat, önerilen fiyat, maksimum fiyat, kampanyalı fiyat rejimi ve özel dönem fiyat davranışlarını merkezi olarak yöneten ticari truth sistemidir. Sistem ağacında bu başlık “kısmen hazır sistemler” arasında açıkça yer alır.

2. Sistemin ana amacı

Merkezi fiyat sisteminin ana amacı şudur:

tedarikçinin ham baz fiyatını doğrudan satış fiyatı olarak kabul etmemek,
platform kârını merkezi olarak uygulamak,
havuz için havuz taban fiyatını üretmek,
minimum / önerilen / maksimum fiyat koridorunu oluşturmak,
kampanyalı ve lansman dönemli özel rejimleri merkezi kuralla yönetmek,
fenomen mağazanın bağımsız fiyat motoru gibi davranmasını engellemektir.

Havuz sistemi dosyasında açıkça:

tedarikçi baz fiyat girer,
platform kategori bazlı kâr oranı belirler,
platform minimum / önerilen / maksimum fiyat kurallarını belirler,
kampanyalı ürün rejimi ve lansman dönemi rejimi platform alanıdır,
fenomen yalnız izin verilen fiyat aralığında seçim yapabilir,
tedarikçi havuz satış fiyatını belirleyemez
denir. Bu sistemin omurgası budur.
3. Temel ilke

Bu sistemin temel ilkesi şudur:

Baz fiyat tedarikçiden gelir, satış fiyatı platform tarafından kurulur.

Yani:

tedarikçi fiyat girdisi sağlar,
platform kâr uygular,
platform ticari sınırları belirler,
fenomen yalnız bu sınırlar içinde fiyat seçebilir.

Bu ilke esnetilmez. Çünkü havuz mantığında ticari otorite platformdadır; tedarikçi kaynak, fenomen vitrin tarafıdır.

4. Aktörler

4.1 Tedarikçi
Baz fiyatı girer ve günceller. Ama havuz satış fiyatını belirleyemez, platform kârını göremez, fenomen fiyat kurallarını belirleyemez.

4.2 Platform
Kategori bazlı kâr oranı belirler, havuz taban fiyatını hesaplar, minimum / önerilen / maksimum fiyatları tanımlar, kampanya rejimi açar veya kapatır, lansman fiyat rejimini yönetir.

4.3 Fenomen mağaza
Yalnız platformun açtığı fiyat koridorunda seçim yapabilir; bağımsız fiyat motoru değildir. Haftada en fazla bir kez fiyat değiştirir kuralı da havuz sisteminde açıkça tanımlıdır.

5. Fiyat sisteminin platform içindeki rolü

Akış sırası içinde merkezi fiyat sisteminin rolü şöyledir:

ürün 1. havuzda kabul edilir,
baz fiyat ve gerekiyorsa varyant baz fiyat doğrulanır,
ürün 2. havuza geçerken platform kârı uygulanır,
havuz taban fiyatı oluşur,
minimum / önerilen / maksimum fiyat koridoru üretilir,
fenomen ürünü mağazasına eklediğinde bu koridor içinden fiyat seçer,
checkout ve siparişte ise aktif satış fiyatı snapshot olarak taşınır.

Yani fiyat sistemi ürün kabulden sonra başlar, ama satış ve siparişe kadar etkisini sürdürür.

6. Fiyat yapısının katmanları

Merkezi fiyat sistemi en az şu katmanlardan oluşmalıdır:

6.1 Tedarikçi baz fiyatı
Kaynak ticari girdi.

6.2 Platform kâr katmanı
Kategori veya ürün bazlı merkezi ticari oran.

6.3 Havuz taban fiyatı
Fenomen ve satış katmanının beslendiği platform iç taban.

6.4 Satış koridoru
Minimum / önerilen / maksimum fiyat yapısı.

6.5 Özel rejimler
Kampanyalı ürün, lansman dönemi, istisna senaryoları.

Bu model doğrudan havuz dosyasında tarif edilen ticari yapıya dayanır.

7. Baz fiyat

Baz fiyat tedarikçi tarafından girilir. Bu fiyat:

tedarikçinin doğrudan ticari kaynağıdır,
ürün kabul sisteminin girdisidir,
havuz fiyat hesaplamasının başlangıç noktasıdır,
ama son satış fiyatı değildir.

Bu ayrım çok kritiktir. Çünkü baz fiyat ile müşteriye görünen fiyat aynı şey değildir. Havuz dosyasında bu ayrım açıkça kurulmuştur.

8. Platform kârı

Platform kârı zorunlu katmandır. 1. havuzdan 2. havuza geçişte ürün üzerinde platformun kategori bazlı veya ürün bazlı kâr hesabı uygulanır. Bu katman atlanamaz. Ürün kabul / onay sisteminde de sabitlendiği gibi 2. havuza geçişte platform kârı zorunlu adımdır.

9. Havuz taban fiyatı

Havuz taban fiyatı, baz fiyat + platform kârı sonrası oluşan platform iç satış tabanıdır. Fenomen mağaza doğrudan baz fiyatı görmez; onun gördüğü ticari alan bu taban ve bunun üzerinden türeyen koridordur. Bu nedenle:

tedarikçi baz fiyatı gizli kalır,
platform kârı gizli kalır,
fenomen yalnız ticari kullanım alanını görür.

Bu görünürlük ayrımı havuz sisteminin ana ilkelerinden biridir.

10. Minimum / önerilen / maksimum fiyat sistemi

Merkezi fiyat sistemi minimum, önerilen ve maksimum satış fiyatlarını üretmelidir. Bunlar:

platform tarafından belirlenen yüzdeler veya kurallar üzerinden oluşur,
kategoriye göre değişebilir,
kampanya rejimine göre farklılaşabilir,
fenomenin seçim alanını sınırlar.

Bu sistemin rolü iki yönlüdür:

platformu kontrolsüz fiyat savaşından korur,
fenomen mağazanın kuralsız fiyatlama yapmasını engeller.
11. Fenomen fiyat seçimi

Fenomen mağaza, ürünü mağazasına eklediğinde fiyatı tamamen özgür belirleyemez. Doğru model:

ürün için açılan fiyat koridoru gösterilir,
fenomen bu aralık içinde seçim yapar,
önerilen fiyat görünebilir,
istenirse min veya max’a yakın seçebilir,
ama sınırı aşamaz.

Havuz sisteminde bu kural açıktır: fenomen yalnız izin verilen fiyat aralığında seçim yapar; platformun fiyat sınırlarını aşamaz; zorunlu önerilen fiyat rejimi varsa bunu bozamaz.

12. Fiyat değişikliği sıklığı

Fenomen tarafında fiyat değişikliği sınırsız bırakılmamalıdır.
Ancak tek tip haftalık sert limit her durumda doğru model değildir.

Doğru yaklaşım:

yukarı yönlü fiyat artışı daha sıkı sınırla çalışabilir
aşağı yönlü, tüketici lehine ve koridor içi indirimlerde daha esnek model açılabilir
platform isterse günlük yumuşak limit, haftalık üst sınır veya kampanya dönemi özel rejimi tanımlayabilir

Net kural:
esneklik açılsa bile nihai sınır merkezi fiyat koridorudur.
Fenomen bağımsız fiyat motoru haline gelmez.

12A. Tedarikçi baz fiyat değişiminin aktivasyon modeli

Tedarikçi baz fiyatı değiştiğinde sistem merkezi fiyat yapısını yeniden kurabilir.
Ancak bu etki her zaman anlık canlı zincirleme reaksiyon olarak devreye alınmak zorunda değildir.

Doğru model:

küçük değişimler kontrollü biçimde daha hızlı işlenebilir
büyük ölçekli değişimler planlı batch aktivasyon penceresiyle alınabilir
aktif sepet / checkout bağlamında kısa süreli price lock uygulanabilir

Amaç:
merkezi fiyat truth’unu korurken toplu checkout bozulmalarını önlemektir.
13. Varyant bazlı fiyat

Varyant sistemi ve Modül Yapısı dokümanları, varyant bazlı fiyatın mümkün olduğunu açıkça söyler. Bu nedenle merkezi fiyat sistemi şu kuralı desteklemelidir:

ürün bazında ortak fiyat yapısı olabilir,
ama bazı varyantlarda farklı baz fiyat olabilir,
bu durumda platform kârı ilgili varyant tabanına uygulanır,
satış koridoru da gerektiğinde varyant bazlı etkilenebilir.

Yani fiyat sistemi gerektiğinde ürün bazlı değil varyant bazlı hesap çalıştırmalıdır.

14. Kampanyalı ürün rejimi

Kampanyalı ürünler için fiyat sistemi ayrı davranabilmelidir. Havuz sisteminde “kampanyalı ürün rejimi” doğrudan platform yetkisi olarak tanımlanmıştır. Bu şu anlama gelir:

her ürün kampanyalı sayılmaz,
kampanya açma/kapatma platform alanıdır,
kampanyalı ürünlerde koridor veya önerilen fiyat rejimi farklı çalışabilir,
fenomen mağaza bu rejimi kendi başına başlatamaz.
15. Lansman dönemi fiyat rejimi

Bazı ürünler için lansman dönemi özel fiyat rejimi açılabilir. Bu da platform alanıdır. Doğru model:

yeni ürün için sınırlı dönem özel ticari davranış açılabilir,
bu davranış merkezden yönetilir,
fenomen bağımsız lansman fiyatı kurgulayamaz,
platform gerekli görürse bu rejimi açar veya kapatır.
16. Baz fiyat değişikliği sonrası fiyat yeniden hesaplama

Tedarikçi baz fiyatı değiştirdiğinde merkezi fiyat sistemi bunu zincirleme etkilerle yeniden hesaplamalıdır:

yeni baz fiyat alınır,
platform kârı yeniden uygulanır,
havuz taban fiyatı güncellenir,
min / önerilen / max fiyat tekrar üretilir,
gerekiyorsa kampanya/lansman rejimi yeniden değerlendirilir.

Bu karar ürün kabul/onay sisteminde de sabitlenmişti ve fiyat sisteminin doğal devamıdır.

17. Sepet ile ilişkisi

Sepette fiyat snapshot bulunur; ama bu nihai truth değildir. Sepet, ürünün ve seçilmiş varyantın o andaki aktif satış fiyatını kullanıcıya gösterir. Ancak checkout dosyası açıkça “sepette görülen fiyat checkout’ta yeniden doğrulanır” mantığını kurar. Bu nedenle:

sepet fiyat niyeti taşır,
gerçek fiyat doğrulaması checkout’ta yapılır,
fiyat mismatch varsa checkout bloklayabilir veya uyarı verebilir.
18. Checkout ile ilişkisi

Checkout fiyat doğrulamasının sert katmanıdır. Checkout dosyası fiyat farkı (price_mismatch) ve final sipariş özetini açıkça tanımlar. Doğru model:

aktif satış fiyatı yeniden çekilir,
seçili varyant ve adet üzerinden satır toplamı hesaplanır,
teslimat/kargo etkisi uygulanır,
son toplam netleşir,
kullanıcı ödeme öncesi dürüst nihai tutarı görür.

Burada merkezi fiyat sistemi checkout’a tek kaynak olarak hizmet eder.

19. Ödeme ile ilişkisi

Ödeme sistemi doğrudan sepetten değil, checkout’un doğrulanmış sipariş hazırlığından beslenir. Bu nedenle ödeme sistemi açısından fiyat truth’u merkezi fiyat sisteminden checkout üzerinden gelir. Geçersiz veya eski fiyatla ödeme akışı başlayamaz. Ödeme dosyası da açıkça “checkout’tan gelen geçerli toplamı işlemek” kuralını koyar.

20. Sipariş ile ilişkisi

Sipariş, ödeme sonrası resmi ticari kaydı oluştururken fiyat snapshot’ını taşır. Doğru model:

sipariş satırı, anlık canlı fiyatı değil işlem anındaki doğrulanmış fiyatı taşır,
geçmiş siparişler sonradan fiyat değişiminden etkilenmez,
siparişte ürün adı snapshot’ı gibi satır fiyatı snapshot’ı da bulunur.

Sipariş sistemindeki “doğrulanmış fiyat snapshot’ı” ilkesi bunu açıkça destekler.

21. Görünürlük ayrımı

Merkezi fiyat sisteminde görünürlük sert ayrılmalıdır:

Tedarikçi görür

kendi baz fiyatını

Tedarikçi görmez

platform kâr oranını
havuz satış fiyatı kurulumunun iç hesabını
fenomen fiyat stratejisini

Fenomen görür

platformun açtığı ticari fiyat alanını
min / önerilen / max koridoru
kendi seçili satış fiyatını

Bu görünürlük mantığı havuz sisteminin ana ilkesidir.

22. Ana riskler

Merkezi fiyat sistemindeki ana riskler şunlardır:

baz fiyatın yanlış girilmesi
platform kârının yanlış uygulanması
varyant fiyat farkının yanlış hesaplanması
kampanya/lansman rejiminin çakışması
sepette görünen fiyat ile checkout fiyatının farklılaşması
fenomenin koridor dışına çıkmaya çalışması
tedarikçinin platform iç fiyat hesaplarını görmesi

Bu risklerin tamamı, fiyat sisteminin merkezi ve kontrollü kurulmasını gerektirir.

23. Ana kurallar

Merkezi fiyat sistemi için sabitlenmesi gereken temel kurallar şunlardır:

baz fiyat tedarikçiden gelir
satış fiyatı platform tarafından kurulur
platform kârı 2. havuza geçişte zorunlu katmandır
havuz taban fiyatı platform iç ticari tabandır
minimum / önerilen / maksimum fiyat koridoru merkezden üretilir
fenomen yalnız bu koridor içinde fiyat seçebilir
fenomen koridor dışına çıkamaz
fenomen fiyatı sınırsız sıklıkla değiştiremez
kampanyalı ve lansman rejimleri platform alanıdır
varyant bazlı fiyat gerekiyorsa sistem bunu destekler
sepet fiyat snapshot taşır ama nihai truth değildir
fiyatın sert doğrulaması checkout’ta yapılır
ödeme yalnız checkout’un doğrulanmış toplamını işler
sipariş işlem anındaki fiyat snapshot’ını resmi kayıt olarak taşır
tedarikçi platform kârını ve iç ticari hesabı göremez.
24. Nihai kısa özet

Merkezi fiyat sistemi, tedarikçiden gelen baz fiyatı platform kârı ile işleyerek 2. havuz için havuz taban fiyatını ve minimum / önerilen / maksimum satış koridorunu üreten; kampanyalı ve lansman dönemli özel fiyat rejimlerini merkezi yöneten; fenomen mağazanın yalnız bu koridor içinde fiyat seçmesine izin veren; sepette snapshot, checkout’ta final doğrulama ve siparişte resmi fiyat snapshot’ı olarak çalışan merkezi ticari truth sistemidir.