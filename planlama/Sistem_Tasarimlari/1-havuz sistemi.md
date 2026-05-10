## 1. HAVUZ SİSTEMİNİN ANA TANIMI

Havuz sistemi, tedarikçilerin ürünlerini platforma yüklediği, platformun bu ürünleri denetleyip ticari kurallarla dönüştürdüğü ve yalnızca onaylı, fiyatlandırılmış, satışa hazır ürünleri fenomenlere açtığı merkezi ürün yönetim yapısıdır.

Bu yapıda:

ürün kaynağı tedarikçidir,
ticari otorite platformdur,
satış vitrini fenomen mağazasıdır,
stok ve ana ürün gerçeği merkezde tutulur.

Sistem iki ayrı havuzdan oluşur:

1. Havuz: Tedarikçi kabul ve hazırlık havuzu
2. Havuz: Platform ticari satış havuzu
2. SİSTEMİN ANA FELSEFESİ
Tedarikçi ürün yükler, ama satış gerçeğini belirlemez.
Platform ürünün son ticari şeklini oluşturur.
Fenomen ürünü seçer, ama platformun belirlediği sınırlar içinde hareket eder.
Kargo fiyatı platform alanıdır.
Stok merkezi çalışır.
Fiyatlama kuralları merkezi çalışır.
Ürünün ana bilgileri platform kontrolü altında tutulur.
Fenomen sadece sınırlı kişiselleştirme katmanı ekleyebilir.
3. ROLLER VE YETKİ DAĞILIMI
3.1 Tedarikçi

Tedarikçi:

ürün yükler,
ürün bilgilerini girer,
varyantları tanımlar,
stok girer ve günceller,
baz fiyat girer,
lojistik verileri girer,
sipariş düştüğünde ürünü hazırlar ve gönderir.

Tedarikçi şunları yapamaz:

kargo fiyatı belirleyemez,
platform kârını göremez,
havuz satış fiyatını belirleyemez,
fenomen fiyat kurallarını belirleyemez,
ürün onayını kendi başına veremez,
platformun sınıflandırma ve düzeltme kararını aşamaz.
3.2 Platform

Platform:

ürün kabul kurallarını belirler,
zorunlu alanları yönetir,
kategori eşlemesini yapar veya düzeltir,
ürün onayı verir veya reddeder,
kategori bazlı kâr oranlarını belirler,
minimum / önerilen / maksimum fiyat kurallarını belirler,
kampanyalı ürün rejimini atar,
lansman dönemi fiyat rejimini açar veya kapatır,
kargo fiyatlarını belirler,
sevkiyat kurallarını ve ceza rejimini uygular,
tüm sistemi merkezi olarak denetler.
3.3 Fenomen

Fenomen:

havuzdaki ürünleri görür,
ürünü mağazasına ekler,
yalnızca izin verilen fiyat aralığında seçim yapar,
haftada en fazla 1 kez fiyat değiştirir,
ürün için kısa not ekleyebilir,
görsel ekleyebilir,
video ekleyebilir.

Fenomen şunları yapamaz:

ürünün ana bilgilerini değiştiremez,
tedarikçi baz fiyatını göremez,
platformun fiyat sınırlarını aşamaz,
platformun zorunlu önerilen fiyat rejimini bozamaz.
4. 1. HAVUZ – TEDARİKÇİ KABUL VE HAZIRLIK HAVUZU
4.1 Tanım
havuz, tedarikçilerin ürünlerini tüm detaylarıyla yüklediği, ürünlerin doğrulama ve sınıflandırmadan geçtiği, lojistik verilerinin alındığı ve ürünlerin 2. havuza hazırlanarak işlendiği kabul alanıdır.
4.2 Amaç
Ham ürün verisini toplamak
Eksik ve hatalı ürünleri ayıklamak
Varyant yapısını kurmak
Lojistik bilgileri almak
Doğru kategoriye yerleştirmek
Platformun ticari işleme sürecine hazırlamak
4.3 Tedarikçinin gireceği temel veriler
ürün adı
kısa açıklama
detaylı açıklama
marka
kategori önerisi
alt kategori
ürün özellikleri
teknik bilgiler
ana görseller
video
barkod / ürün kodu
stok
baz fiyat
varyantlar
lojistik bilgiler
4.4 Varyant yapısı

Varyant bazlı giriş desteklenir.

Örnek varyant alanları:

renk
beden
numara
hacim
gramaj
ölçü
model farkı

Her varyant için gerektiğinde ayrı ayrı:

stok
baz fiyat
görsel
ürün kodu

girilmelidir.

4.5 Ürün onay ve doğrulama mantığı
Tedarikçi ürünü yükler.
Sistem zorunlu alan kontrolü yapar.
Eksik / hatalı veri tespit edilirse ürün beklemeye alınır.
Otomatik kategori önerisi çalışır.
Platform gerekli gördüğünde manuel düzeltme yapar.
Ürün onaylanır, reddedilir veya revizyona gönderilir.
Uygun ürün 2. havuz hazırlığına geçer.
4.6 Kategori yönetimi
Sistem ürün özelliklerine göre otomatik kategori önerir.
Platform son kararı verir.
Yanlış eşleşmeyi platform düzeltir.
Tedarikçi itiraz edebilir.
Son otorite platformdur.
4.7 Kargo ve lojistik mantığı

Tedarikçi kargo fiyatı girmez.

Tedarikçi sadece sevkiyat için gerekli lojistik bilgileri girer:

ağırlık
desi / ölçü
koli bilgisi
kırılabilirlik
sıvı / hassas ürün bilgisi
hazırlama süresi

Kargo fiyatını platform belirler.
Bu fiyat, anlaşmalı kargoların fiyat yapıları baz alınarak platform tarafından yönetilir.

4.8 Tahmini kargo gösterimi
PDP’de tahmini kargo bilgisi gösterilebilir.
Nihai kargo ücreti ödeme sürecinde netleşebilir.
Tedarikçi kargo ücretine müdahale etmez.
4.9 Yanlış lojistik veri kontrolü

Yanlış desi / ağırlık riskini azaltmak için:

girişte alan doğrulaması yapılır,
kategori bazlı referans aralıklar kullanılır,
platform gerekli görürse manuel kontrol yapar,
taşıyıcı audit farkları kayda alınır,
tekrar eden yanlış beyanlarda ceza uygulanır.
4.10 Sipariş düşme ve sevkiyat akışı

Fenomen mağazasında satış olursa:

sipariş platformda oluşur,
ilgili tedarikçi paneline düşer,
tedarikçi ürünü hazırlar,
ürün platform standardına göre kargolanır,
platform takip sürecini izler.

Tedarikçi:

gönderim için gerekli müşteri teslimat bilgisini görür,
fenomen mağaza etiketini görebilir,
kâr dağılımını göremez.
4.11 Sevkiyat SLA ve ceza rejimi
Tedarikçi ürün gönderimini en geç 1–2 gün içinde yapmalıdır.
Varsayılan üst sınır: 2 gün
2 gün sonunda sevkiyat yapılmadıysa ceza süreci başlar.
Gecikme her gün için ağır ceza üretir.
gün sonunda ürün hâlâ kargoda değilse sipariş otomatik iptal edilir.
Tekrarlı ihlallerde satıştan men uygulanabilir.
Bu kurallar sözleşme başında açık şekilde tanımlanır.
4.12 Fiyat değişikliği – 1. havuz kuralı
Tedarikçi baz fiyatı ürün veya varyant bazında değiştirebilir.
Fiyat değişikliği en fazla haftada 1 kez yapılabilir.
Tedarikçi baz fiyatı değiştiğinde sistem bunu yeni baz fiyat olarak kabul eder.
Bu değişiklik 2. havuz fiyatlarını otomatik etkiler.
5. 2. HAVUZ – PLATFORM TİCARİ SATIŞ HAVUZU
5.1 Tanım
havuz, 1. havuzdan doğrulanmış ürünlerin geldiği; platformun kategori veya ürün bazlı kâr kurallarını uygulayarak havuz taban fiyatını oluşturduğu; minimum, önerilen ve maksimum satış fiyatlarını otomatik hesaplayarak ürünleri fenomenlere açtığı ticari havuzdur.
5.2 Amaç
platform kârını sisteme yansıtmak
satışa hazır taban fiyat oluşturmak
fiyat koridoru üretmek
fenomene kontrollü fiyat alanı açmak
ürünün ticari standardını korumak
5.3 Platform kâr oranı

Platform kategori bazlı kâr ekleyebilir.

Örnek:

mutfak / tencere = %20
giyim / çorap = %30
kampanyalı ürün = %5

Bu kâr oranları admin panelinden yönetilir.

5.4 Havuz taban fiyatı oluşumu

Örnek:

tedarikçi baz fiyatı = 100 TL
platform kârı = %10
havuz taban fiyatı = 110 TL

Bu fiyat, fenomenin gördüğü başlangıç fiyatıdır.

Fenomen:

tedarikçi baz fiyatını görmez
yalnızca havuz taban fiyatını ve buna bağlı satış koridorunu görür
5.5 Fiyat koridoru mantığı
havuzda her ürün için otomatik olarak şu fiyatlar üretilir:
minimum satış fiyatı
önerilen satış fiyatı
maksimum satış fiyatı

Bu fiyatlar yüzde bazlı hesaplanır ve admin tarafından belirlenebilir.

Örnek:

havuz taban fiyatı: 110
minimum: +%10
önerilen: +%20
maksimum: +%40
5.6 Fiyat üretim sırası

Fiyat motoru şu sırayla çalışır:

tedarikçi baz fiyatı
platform kategori kârı
havuz taban fiyatı
minimum fiyat yüzdesi
önerilen fiyat yüzdesi
maksimum fiyat yüzdesi
yuvarlama
özel rejim düzeltmesi (kampanya / lansman / sabit fiyat)

Bu sıra sabittir.

5.7 Yuvarlama standardı

Sistem klasik matematik yuvarlama kullanır:

4 ve altı aşağı yuvarlanır
5 ve üstü yukarı yuvarlanır

Bu kural merkezi ve otomatik çalışır.

5.8 Lansman rejimi

Platform admini önerilen fiyat rejimini aktif veya pasif yapabilir.

Eğer önerilen fiyat rejimi aktifse, fenomen için önerilen fiyat zorunlu olur.
Bu durumda minimum ve maksimum sınırlar pratikte etkisiz kalır.
Eğer önerilen fiyat rejimi pasifse, fenomen minimum ile maksimum arasında seçim yapabilir.
5.9 Kampanyalı ürün rejimi
Kampanyalı ürün statüsünü platform adminleri belirler.
Kampanyalı ürünlerde platform kârı ve fiyat koridoru daha dar veya farklı olabilir.
Bu ürünler ayrı ticari rejimde yönetilebilir.
5.10 Fenomen fiyat değiştirme kuralı
Fenomen ürün fiyatını en fazla haftada 1 kez değiştirebilir.
Bu kural tüm ürünler için geçerlidir.
Platform istisna tanımlayabilir, ama temel kural haftada 1’dir.
5.11 Tedarikçi fiyat değişince 2. havuz davranışı
Tedarikçi baz fiyatı değiştiğinde sistem 2. havuz fiyatlarını otomatik yeniden hesaplar.
Platform kârı yeniden uygulanır.
Minimum / önerilen / maksimum fiyatlar yeni tabana göre tekrar oluşur.
Böylece ürünün tüm ticari yapısı güncel baz fiyat üzerinden yeniden kurulur.
5.12 Fenomen mağazasına yansıma
havuzdaki fiyat güncellemesi fenomen mağazasındaki bağlı ürünü de etkiler.
Platformun kuralları doğrultusunda ürünün fiyat yapısı otomatik güncellenir.
Bu yapı, merkezi ticari tutarlılık sağlamak için zorunludur.
6. FENOMEN KATMANI – 2. HAVUZDA İZİN VERİLEN KİŞİSELLEŞTİRME

Fenomen ürünün ana gerçeğini değiştiremez, ancak şu alanlarda kişisel dokunuş ekleyebilir:

kısa not
birkaç cümlelik ürün yorumu
ek görsel
ek video
mevcut görsel üzerinde sınırlı içerik üretimi

Örnek:

görsel üstüne yazı ekleme
CapCut benzeri basit sunum zenginleştirmesi

Şimdilik bu katman için ileri moderasyon zorunlu tutulmayabilir.
Ama ileride denetim kapısı eklenebilecek şekilde yapı bırakılmalıdır.

Bu kişiselleştirme katmanı ürünün ana gerçeğini değiştirmez. Ayrıca bu içerikler PDP içinde resmi ürün bilgisi yerine geçmez; fenomen mağaza story ve medya içerikleri ayrı yüzeylerde çalışır. PDP’de fenomen mağaza story akışı yer almaz, PDP’nin sosyal kanıt alanı kullanıcı katkı içerikleriyle sınırlıdır.

7. GÖRÜNÜRLÜK AYRIMI
7.1 Tedarikçinin gördüğü
kendi baz fiyatı
kendi stok bilgisi
kendi ürün verisi
ürün onay durumu
sevkiyat emirleri
lojistik yükümlülükler
7.2 Fenomenin gördüğü
platform onaylı ürün
havuz taban fiyatı
minimum satış fiyatı
önerilen satış fiyatı
maksimum satış fiyatı
ürün seçme ve kişiselleştirme alanı
7.3 Tedarikçinin göremeyeceği
platform kâr oranı
fenomen satış stratejisi
kâr dağılımı
platformun iç ticari hesabı
8. STOK VE MERKEZİ KONTROL
Stok merkezi çalışır.
Aynı ürün farklı fenomen mağazalarında görünse bile stok tektir.
Satış olduğunda merkezi stok etkilenir.
Tedarikçi stok sağlar ve günceller.
Fenomen stok üretemez.
Stok gerçeği platform kontrolündeki merkezi yapıda tutulur.
9. ANA RİSKLER VE KARŞILIKLARI
9.1 Yanlış kategori riski

Çözüm:

otomatik öneri + manuel platform düzeltmesi
tedarikçi itiraz hakkı
son karar platformda
9.2 Yanlış lojistik veri riski

Çözüm:

zorunlu alanlar
kategori referans aralıkları
manuel kontrol
taşıyıcı audit farkı
ceza rejimi
9.3 Fiyat dalgalanması riski

Çözüm:

hem tedarikçi hem fenomen için haftada 1 fiyat değişim limiti
9.4 Sevkiyat disiplin riski

Çözüm:

zorunlu SLA
günlük ceza
gecikmede otomatik iptal
tekrarda satıştan men
9.5 Fiyat anarşisi riski

Çözüm:

platform kârı merkezi
minimum / önerilen / maksimum fiyat koridoru
gerektiğinde önerilen fiyatın zorunlu hale getirilmesi
10. HAVUZ SİSTEMİNİN KISA NİHAİ TANIMI

Havuz sistemi, tedarikçilerin ürünlerini tüm detaylarıyla platforma yüklediği; ürünlerin önce 1. havuzda doğrulanıp sınıflandırıldığı, ardından 2. havuzda platform tarafından kategori bazlı kâr ve fiyat kurallarıyla ticari olarak işlendiği; yalnızca onaylı ve fiyatlandırılmış ürünlerin fenomenlere açıldığı; kargo fiyatının platform tarafından yönetildiği; stok ve ana ürün gerçeğinin merkezi tutulduğu; fenomenlerin ise ürünleri sadece platformun belirlediği fiyat koridoru ve yetki sınırları içinde mağazalarına ekleyebildiği iki aşamalı merkezi ürün yönetim yapısıdır.

11. NİHAİ HÜKÜM

Bu yapı şu anda mantıksal olarak sağlam bir çekirdeğe ulaştı.

Temel özellikleri:

iki havuzlu net ayrım var
tedarikçi, platform ve fenomen rolleri ayrıştı
kargo platform alanına alındı
fiyat motoru merkezileşti
kategori bazlı kâr sistemi tanımlandı
min / önerilen / max satış koridoru tanımlandı
lansman ve kampanya rejimleri bağlandı
sevkiyat ceza rejimi tanımlandı
fenomen katmanı kontrollü bırakıldı

Bu haliyle sistem artık dağınık fikirler bütünü değil;
ileri seviye, kontrollü, merkezi bir ürün havuzu omurgası haline geldi.


#####
---
REVİZYON NOTU — 2026-04-19
Durum: Açıklama notu
Etkilediği bölüm(ler): Tedarikçi baz fiyat güncellemesi, fenomen fiyat değişim ritmi
Bağlı dosyalar: 29-merkezi fiyat sistemi, 14-checkout sistemi

Not:
Tedarikçi baz fiyat girişi ve platformun ticari otoritesi korunur. Ancak büyük ölçekli fiyat güncellemelerinde aşağıdaki işletim yaklaşımı geçerli kabul edilir:

1. Tedarikçi baz fiyat değişikliği her zaman anlık canlı satış etkisi yaratmak zorunda değildir.
2. Platform, belirli değişimleri planlı aktivasyon penceresi ile devreye alabilir.
3. Amaç, checkout zincirini ve mağaza fiyat düzenini ani kırılmadan korumaktır.

Fenomen fiyat ritmi notu:
1. Fenomen fiyat değişim limiti, sistem güvenliği ve fiyat kaosunu engellemek için vardır.
2. Ancak tüketici lehine aşağı yönlü ve koridor içi esneklik gerektiğinde platform daha yumuşak model açabilir.
---