ÜRÜN KABUL / ONAY SİSTEMİ
1. Sistem tanımı

Ürün kabul / onay sistemi, tedarikçiden gelen ham ürün verisinin 1. havuzda toplandığı; doğrulama, sınıflandırma, kalite kontrol, lojistik kontrol ve platform incelemesinden geçirildiği; yalnız uygun bulunan ürünlerin 2. havuza aktarılıp platform kârı uygulanarak satışa hazır hale getirildiği merkezi kabul sistemidir. Bu sistemin amacı ürün yükletmek değil; ham tedarikçi verisini kontrollü ticari ürüne dönüştürmektir.

2. Temel ilke

Bu sistemin temel ilkesi şudur:

Ürün kaynağı tedarikçidir
Ticari otorite platformdur
1. havuz kabul ve hazırlık havuzudur
2. havuz platformun ticari satış havuzudur
Onaysız ürün hiçbir şekilde fenomenlere açılmaz
2. havuza geçişte platform kârı zorunlu olarak uygulanır

Bu ilke esnetilmez. Tedarikçi ürün yükler ama satış gerçeğini belirlemez; fenomen yalnız platform tarafından onaylanmış ve fiyatlandırılmış ürünü görebilir.

3. Ürün yükleme kanalları

İlk faz için ürün sisteme şu kanallarla girebilir:

3.1 XML / feed yükleme
Türkiye gerçekliğinde ana entegrasyon kanallarından biridir. Büyük ve orta tedarikçiler için uygundur.

3.2 API yükleme
Daha kurumsal tedarikçi, ERP/PIM kullanan partner veya düzenli veri güncellemesi yapan taraflar için uygundur.

3.3 Manuel panel girişi
İstisna kanalıdır. Küçük tedarikçi, özel ürün girişi, operasyonel düzeltme veya başlangıç onboarding için kullanılır.

Ama kritik kural:
hangi kanaldan gelirse gelsin ürün önce 1. havuza düşer.
XML’den gelen ürün de, API’den gelen ürün de, panelden elle girilen ürün de doğrudan canlı satış havuzuna gidemez.

4. Sistemin ana amacı

Ürün kabul / onay sisteminin amacı:

ham ürün verisini toplamak
eksik ve hatalı ürünleri ayıklamak
varyant yapısını kurmak
lojistik verileri almak
doğru kategoriye yerleştirmek
ticari hazırlık için güvenilir ürün çekirdeği oluşturmak
yalnızca uygun ürünü 2. havuza geçirmek

Bu amaçlar havuz dosyasında 1. havuz başlığı altında açıkça tanımlanmış durumda.

5. Aktörler

5.1 Tedarikçi
Ürünü yükler, ürün bilgilerini girer, varyantları tanımlar, stok ve baz fiyat girer, lojistik verileri girer. Ama ürün onayını kendi başına veremez, platform kârını göremez, havuz satış fiyatını belirleyemez, platformun sınıflandırma ve düzeltme kararını aşamaz.

5.2 Platform
Ürün kabul kurallarını belirler, zorunlu alanları yönetir, kategori eşlemesini yapar veya düzeltir, ürün onayı verir veya reddeder, kategori bazlı kâr oranlarını belirler, fiyat koridorunu üretir ve tüm sistemi merkezi olarak denetler.

5.3 Fenomen
Bu sistemin kabul tarafında aktör değildir. Yalnız 2. havuza geçmiş, platform onaylı ve fiyatlandırılmış ürünü görür. Tedarikçi baz fiyatını görmez, ürünün ana gerçeğini değiştiremez.

6. Tedarikçinin yüklediği veri seti

Tedarikçi en az şu alanları girer:

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

Varyant bazlı yapı desteklenir. Her varyant için gerekirse ayrı stok, baz fiyat, görsel ve ürün kodu girilir.

7. 1. havuzun zorunlu işleyiş sırası

Ürün kabul/onay sistemi şu sırayla çalışır:

7.1 Ürün sisteme girer
XML, API veya manuel panelden gelen kayıt 1. havuza alınır.

7.2 Zorunlu alan kontrolü yapılır
Eksik veri varsa ürün canlı akışa ilerlemez.

7.3 Yapısal doğrulama yapılır
Barkod, ürün kodu, varyant bütünlüğü, zorunlu medya ve temel katalog alanları kontrol edilir.

7.4 Otomatik kategori önerisi çalışır
Sistem ürün özelliklerine göre kategori önerir.

7.5 Platform incelemesi gerekir
Platform gerekli görürse manuel düzeltme yapar.

7.6 Karar verilir
Ürün:

onaylanır
reddedilir
revizyona gönderilir

7.7 Ancak onaylı ürün 2. havuz hazırlığına geçer
Bu adım zorunludur.

8. Otomatik çalışan katmanlar

Bu sistemde aşağıdaki alanlar otomatik destekli çalışmalıdır:

kategori önerisi
alt kategori önerisi
attribute çıkarımı
başlık standardizasyonu
açıklama temizleme / normalize etme
varyant ekseni kontrolü
lojistik risk kontrolü
duplicate / benzer ürün uyarısı

Dosyada kategori önerisi, zorunlu alan kontrolü, manuel düzeltme ve lojistik referans kontrolü zaten var. Ben bunu bağımsız sistem seviyesine genişletiyorum. Ama kritik nokta değişmiyor: otomatik öneri vardır, son karar platformdadır.

9. Kategori yönetimi

Kategori yönetiminde doğru model yarı otomatik olmalıdır:

sistem ürün özelliklerine göre otomatik kategori önerir
platform son kararı verir
yanlış eşleşmeyi platform düzeltir
tedarikçi itiraz edebilir
son otorite platformdur

Burada tam otomatik kategori yayını yoktur. Bu alan kabul sisteminin çekirdek denetim katmanıdır.

10. Açıklama ve katalog metni yönetimi

Tedarikçinin girdiği açıklama ham veri olarak kabul edilir. Platform şu haklara sahip olmalıdır:

başlığı standartlaştırmak
kısa açıklama üretmek veya temizlemek
teknik alanları düzenlemek
gereksiz tekrarları temizlemek
katalog netliğini artırmak

Ama ürünün ana bilgisi ve son yayın gerçeği platform kontrolünde kalır. Yani tedarikçi açıklama girer; nihai katalog dili platform denetiminden geçer. Bu, havuz sistemindeki “ürünün ana bilgileri platform kontrolü altında tutulur” ilkesiyle uyumludur.

11. Lojistik doğrulama

Tedarikçi kargo fiyatı girmez. Sadece sevkiyat için gerekli lojistik verileri girer:

ağırlık
desi / ölçü
koli bilgisi
kırılabilirlik
sıvı / hassas ürün bilgisi
hazırlama süresi

Yanlış lojistik veri riskini azaltmak için:

giriş doğrulaması yapılır
kategori bazlı referans aralıkları kullanılır
platform gerekirse manuel kontrol yapar
taşıyıcı audit farkları kayda alınır
tekrar eden yanlış beyanda ceza uygulanır

Kargo fiyatı yine platform alanıdır.

12. Karar durumları

Her ürün 1. havuzda şu durumlardan birinde olmalıdır:

taslak
yüklendi
doğrulama bekliyor
eksik veri / beklemede
revizyon istendi
incelemede
reddedildi
onaylandı
havuza aktarıldı

Burada en kritik ayrım:
Onaylandı ≠ satışta
Onaylandıktan sonra ürün 2. havuza geçer, platform kârı uygulanır, fiyat koridoru oluşur ve ancak ondan sonra satışa hazır hale gelir.

13. Red ve revizyon mantığı

Sistem yalnız onay/red ile çalışmamalı; revizyon hattı zorunlu olmalıdır.

Red
Ürün temel politika veya kalite koşullarına uymuyorsa verilir.

Revizyon
Eksik alan, yanlış kategori, zayıf açıklama, bozuk varyant, yetersiz lojistik veri gibi düzeltilmesi mümkün durumlarda verilir.

Bu sayede tedarikçi her hata için sıfırdan ürün açmak zorunda kalmaz; kabul sistemi sürdürülebilir olur. Dosyada ürünün “reddedilebilir veya revizyona gönderilebilir” olduğu zaten açık.

14. 2. havuza geçiş kuralı
havuzdan çıkan uygun ürün 2. havuza aktarılır. 2. havuz:
platformun kategori veya ürün bazlı kâr kurallarını uygular
havuz taban fiyatını oluşturur
minimum / önerilen / maksimum satış fiyatlarını üretir
ürünü fenomenlere açar

Burada platform kârı zorunlu adımdır; atlanamaz. Fenomen yalnız havuz taban fiyatını ve buna bağlı satış koridorunu görür; tedarikçi baz fiyatını görmez.

15. Fiyat üretim sırası
havuza geçen ürün için ticari hazırlık sırası sabit olmalıdır:
tedarikçi baz fiyatı
platform kategori kârı
havuz taban fiyatı
minimum fiyat yüzdesi
önerilen fiyat yüzdesi
maksimum fiyat yüzdesi
yuvarlama
gerekiyorsa özel rejim düzeltmesi

Bu sıralama değiştirilmez. Böylece kabul sistemi ile ticari sistem arasındaki geçiş netleşir.

16. Tedarikçi baz fiyat değişikliği sonrası davranış

Tedarikçi baz fiyatı değiştirirse:

sistem yeni baz fiyatı kabul eder
havuz fiyatları otomatik yeniden hesaplanır
platform kârı yeniden uygulanır
minimum / önerilen / maksimum fiyatlar yeni tabana göre tekrar oluşur

Bu da gösteriyor ki ürün kabul/onay sistemi yalnız ilk girişte çalışmaz; baz fiyat değişikliği sonrası ticari yeniden kurulum hattını da besler.

17. Görünürlük ayrımı

Bu sistemde görünürlük sert ayrılmalıdır:

Tedarikçi görür

kendi baz fiyatını
kendi stok bilgisini
kendi ürün verisini
ürün onay durumunu
sevkiyat emirlerini
lojistik yükümlülükleri

Tedarikçi görmez

platform kâr oranını
fenomen satış stratejisini
kâr dağılımını
platformun iç ticari hesabını

Fenomen görür

platform onaylı ürünü
havuz taban fiyatını
minimum / önerilen / maksimum satış fiyatını

Bu ayrım kabul sisteminin ve 2. havuzun temel koruma mekanizmasıdır.

18. Ana riskler

Bu sistemde ana riskler şunlardır:

yanlış kategori
yanlış lojistik veri
eksik ürün verisi
bozuk varyant yapısı
duplicate ürün
yanlış baz fiyat
onaysız ürünün yanlışlıkla açılması

Dosyada yanlış kategori ve yanlış lojistik veri için çözümler zaten tanımlı; ben bunu kabul sistemi omurgasına dahil ediyorum.

19. Ana kurallar

Bu sistem için sabit kurallar:

ürün giriş kanalı XML, API veya manuel panel olabilir
ama tüm ürünler önce 1. havuza düşer
havuz platform kontrolünden çıkmaz
onaysız ürün 2. havuza geçemez
tedarikçi ürün onayını kendi başına veremez
son kategori kararı platformdadır
tedarikçi kargo fiyatı giremez
tedarikçi platform kârını göremez
revizyon hattı zorunludur
havuza geçen her üründe platform kârı uygulanır
havuzda fiyat koridoru otomatik oluşur
fenomen yalnız platform onaylı ve fiyatlandırılmış ürünü görür
ürünün ana bilgisi platform kontrolünde kalır
20. Nihai kısa özet

Ürün kabul / onay sistemi, tedarikçiden XML, API veya manuel panel yoluyla gelen ham ürün verisinin 1. havuzda toplandığı; zorunlu alan, kategori, varyant, lojistik ve kalite kontrollerinden geçirildiği; yalnız platform tarafından onaylanan ürünlerin 2. havuza aktarıldığı; 2. havuzda da platform kârı uygulanıp fiyat koridoru oluşturularak ürünün satışa hazır hale getirildiği merkezi kabul ve ticari hazırlık sistemidir.