BİLDİRİM SİSTEMİ
1. Sistem tanımı

Bildirim sistemi, platform içindeki kritik olayları doğru aktöre, doğru zamanda, doğru öncelik seviyesinde ileten; işlem, ilişki, içerik ve operasyon akışlarını görünür kılan çok taraflı uyarı ve dikkat yönetim sistemidir.

Bu sistemin görevi yalnız “bir şey oldu” demek değildir.
Aynı zamanda:

hangi olayın gerçekten önemli olduğunu ayırmak,
kullanıcıyı gerekli anda geri çağırmak,
fenomen mağazaya mağaza yönetimi açısından kritik sinyalleri vermek,
tedarikçiye operasyonel zorunlu işleri iletmek,
zorunlu bildirim ile opsiyonel bildirim ayrımını yapmak,
sistemi gürültüye boğmadan canlı tutmaktır.

Kısa tanım:

Bildirim sistemi, platformdaki kritik olayları aktör bazlı ve öncelik bazlı yöneten dikkat ve uyarı sistemidir.

2. Sistemin ana amacı

Bildirim sistemi şu görevleri yerine getirmelidir:

kritik olayları kaçırılmayacak şekilde iletmek
aktör bazlı doğru bildirim seti kurmak
gereksiz bildirim yükünü azaltmak
kullanıcıyı platforma geri döndürmek
fenomen mağaza tarafında mağaza canlılığını ve aksiyon ihtiyacını görünür kılmak
tedarikçi tarafında operasyonel işlerin zamanında görülmesini sağlamak
destek, sipariş, teslimat, mesaj ve etkileşim gibi farklı olayları birbirine karıştırmadan taşımak
3. Sistemin ana karakteri

Bildirim sistemi şu karaktere sahip olmalıdır:

dengeli
aktör bazlı
öncelik bazlı
gürültü kontrollü
merkezi
hızlı
sade
yönetilebilir

Net kural:

Her olay bildirim olmak zorunda değildir.
Ama bazı olaylar da kesinlikle kaçırılamaz.

Bu yüzden bildirim sistemi “her şeyi bildir” mantığıyla değil,
zorunlu / önemli / isteğe bağlı katmanlarıyla çalışmalıdır.

4. Bildirim sistemi tek tip değildir

Bu sistem en az 3 ana hatta ayrılmalıdır:

4.1 Kullanıcı bildirimleri

Müşteri tarafı işlem, teslimat, destek, mesaj ve sosyal sinyaller

4.2 Fenomen mağaza bildirimleri

Mağaza etkileşimi, takipçi, mesaj, mağaza aksiyonu ve mağaza kaynaklı ticari sinyaller

4.3 Tedarikçi bildirimleri

Sipariş, hazırlama, sevkiyat, problem ve operasyonel görev bildirimleri

Net kural:
Aynı olay her aktöre aynı dil ve aynı öncelikle gitmemelidir.

5. Bildirim sistemi öncelik katmanları

Bu sistemin çekirdeği öncelik ayrımıdır.

5.1 Zorunlu bildirimler

Bunlar kapatılamaz veya yalnız çok sınırlı kanal tercihi yapılabilir.

Örnek karakter:

işlem kritik
sipariş kritik
teslimat kritik
destek / güvenlik / hesap kritik
operasyon kritik
5.2 Önemli ama tercihe açık bildirimler

Varsayılan açık olabilir ama kullanıcı/fenomen/tedarikçi bunları kısmen yönetebilir.

Örnek karakter:

mesaj
takip
belirli etkileşim sinyalleri
mağaza hareketleri
5.3 Gürültüye açık / toplulaştırılması gereken bildirimler

Bunlar tek tek push gibi değil, inbox özeti veya sayaç mantığında çalışmalıdır.

Örnek karakter:

çok sayıda beğeni
çok sayıda story etkileşimi
yoğun mağaza etkileşimi
hafif sosyal reaksiyonlar

Net kural:
Gürültü üretmeye yatkın bildirimler tekil yağmur gibi değil, özetlenmiş paketler halinde çalışmalıdır.

6. Bildirim kanalları

Bildirim sistemi tek kanallı olmamalıdır.

Ana kanallar:

uygulama içi bildirim merkezi
header / mobil header bildirim girişi
push bildirim
gerekirse e-posta türü dış kanal
panel içi görev uyarıları

Dosyalarda bildirimin ana chrome içinde yer aldığı açık: header ve mobil header’da görünür.

Net kural:
Her olay push olmak zorunda değildir.
Birçok olay için uygulama içi inbox yeterlidir.

7. Bildirim merkezi

Platformda tek bir bildirim merkezi olmalıdır.

Ama bu tek merkez içinde aktöre göre farklı akışlar bulunmalıdır.

Doğru yapı:

kullanıcı bildirim merkezi
fenomen mağaza bildirim merkezi
tedarikçi görev / bildirim merkezi

Yani teknik omurga merkezi olabilir ama deneyim ve içerik katmanı aktör bazında ayrılmalıdır.

8. Kullanıcı bildirimleri

Kullanıcı tarafında bildirimler 4 ana gruba ayrılmalıdır:

8.1 Ticari / işlem bildirimleri
sipariş alındı
ödeme sonucu
sipariş durumu değişti
kargo çıktı
teslim edildi
iade / iptal durumu güncellendi
destek talebi güncellendi

Bunlar yüksek önemlidir.
Kullanıcı sistemi içinde siparişlerim ve destek tek merkezde tanımlandığı için bu grup çekirdek olmalıdır.

8.2 Mesaj bildirimleri
kullanıcı ↔ kullanıcı yeni mesaj
kullanıcı ↔ fenomen mağaza yeni mesaj

Ama mesaj ve resmi destek ayrımı korunmalıdır. Sipariş, iade, ödeme, teslimat sorunları fenomen mesaj kutusunda değil destek sisteminde yürür.

8.3 Sosyal / ilişki bildirimleri
takip edilen mağazada yeni önemli post
mağaza mesaj kutusu yanıtı
gerektiğinde takip/ilişki temelli uyarılar

Burada gürültü kontrolü şarttır.
Her post için agresif push doğru olmaz.

8.4 Teslimat sonrası hak bildirimleri

Bu grup çok önemlidir:

ürün teslim edildi
bu ürün için yorum yapabilirsiniz
bu ürün için story yükleme hakkınız açıldı

Çünkü teslimat sonrası yorum ve story hakkı gerçekten sistemsel eşik bağlıdır.

9. Kullanıcı için zorunlu bildirimler

Kullanıcı tarafında zorunlu çekirdek bildirimler şunlar olmalıdır:

ödeme sonucu
sipariş alındı
sipariş iptal / iade sonucu
kargo çıktı
teslim edildi
destek talebi / resmi süreç güncellemesi
güvenlik / hesap kritik olayları

Bunlar kapatılırsa sistem güven ve işlem kalitesi bozulur.

10. Kullanıcı için isteğe bağlı / kontrollü bildirimler

Bunlar yönetilebilir olmalıdır:

yeni mesaj
takip edilen mağazada yeni post
hafif sosyal etkileşimler
kampanya / fiyat avantajı
geri çağırma / yeniden etkileşim bildirimleri

Net kural:
Ticari pazarlama ve sosyal canlılık bildirimleri, işlem bildirimleriyle aynı öncelikte çalışmamalıdır.

11. Fenomen mağaza bildirimleri

Fenomen mağaza sistemi içinde bildirim zorunlu çekirdek olarak zaten işaretlenmiş ve örnek olaylar sayılmış: yeni sipariş, yeni mesaj, yeni takipçi, story etkileşimi, mağaza etkileşimi.

Buna göre fenomen bildirimlerini şu gruplara ayırmak doğru olur:

11.1 Mağaza kritik bildirimleri
mağaza üzerinden yeni sipariş gerçekleşti
mağaza hakkında kritik platform uyarısı
içerik/moderasyon kararı
mağaza mesajlarında önemli yeni olay
11.2 İlişki ve topluluk bildirimleri
yeni takipçi
mağaza postu etkileşimi
kullanıcı story’si mağaza bağlamında görünür oldu
mağaza etkileşimi arttı
11.3 İçerik bildirimleri
mağaza story etkileşimi
videolu ürün kart etkileşimi
mağaza postu performansı

Ama burada sınır çok önemli:
fenomen mağazayı sosyal medya bildirimi yağmuruna sokmamak gerekir.

12. Fenomen için zorunlu bildirimler

Fenomen tarafında zorunlu sayılabilecekler:

yeni sipariş oluştu
yeni mesaj geldi
içerik/moderasyon kararı
mağaza hesabı / platform politikası ile ilgili kritik uyarılar

Burada “yeni sipariş” fenomen açısından operasyon sahibi olmak anlamına gelmez; ama mağaza canlılığı ve satış görünürlüğü açısından kritik sinyaldir. Operasyon yine platform ve tedarikçidedir.

13. Fenomen için toplulaştırılması gereken bildirimler

Şunlar tek tek yağmamalıdır:

17 kişi beğendi
9 kişi kaydetti
5 kişi story izledi
çok sayıda hafif etkileşim

Doğru model:

belirli zaman penceresinde özet
mağaza panelinde sayaç
bildirim merkezinde grup kartı

Çünkü dosyada da sosyal özelliklerin moderasyon ve hacim yükü doğurabileceği riski var.

14. Tedarikçi bildirimleri

Tedarikçi tarafında bildirim tamamen farklı karakterdedir.

Bu taraf için bildirimler daha çok:

görev
operasyon
SLA
problem
aksiyon gerektiren durum

üzerinden çalışmalıdır.

14.1 Tedarikçi kritik bildirimleri
yeni sipariş düştü
hazırlanması gereken ürün var
SLA riski oluştu
sevkiyat gecikti
teslimat problemi / iade dönüşü
ürün/veri sorunu
platform uyarısı

Bu taraf için bildirim gürültüsünden çok “iş kaçırmama” önceliklidir.

15. Tedarikçi için zorunlu bildirimler

Tedarikçi tarafında şu bildirimler zorunlu olmalıdır:

yeni sipariş
hazırlanması gereken ürün
sevkiyat son tarihi / SLA uyarısı
teslimat / geri dönüş problemi
iade / geri kabul süreci
ürün / operasyon kaynaklı platform uyarısı

Burada hafif sosyal bildirim mantığı neredeyse hiç olmamalıdır.

16. Bildirimlerin karışmaması gereken alanlar

Bu sistemde çok kritik sınırlar vardır:

16.1 Destek ve sosyal mesaj karışmamalı

Fenomen mesaj kutusu sosyal iletişim alanıdır; sipariş, ödeme, kargo, iade gibi resmi süreçler destek merkezinden yürür. Bildirimler de bunu karıştırmamalıdır.

16.2 Story / keşfet / takip bildirimleri işlem bildirimleriyle karışmamalı

Teslimat, sipariş ve destek bildirimleri her zaman daha yüksek öncelikli olmalıdır.

16.3 Kullanıcı ürün story’si bağlamı korunmalı

Kullanıcı story’leri keşfet genel akışına düşmez; bildirimler de bu içeriği yanlış bağlamda yaymamalıdır.

17. Bildirim kategorileri

En doğru üst sınıflandırma şu olur:

işlem bildirimleri
mesaj bildirimleri
ilişki/topluluk bildirimleri
içerik/etkileşim bildirimleri
operasyon bildirimleri
güvenlik / hesap bildirimleri

Bu yapı üç aktöre de uyarlanabilir ama içerikleri farklı olur.

18. Bildirim sıklığı kuralları

Bu sistemin en kritik dengesi burada kurulmalıdır.

18.1 Anlık gitmesi gerekenler
ödeme
sipariş
kargo / teslimat
yeni mesaj
destek / resmi süreç
tedarikçi görev bildirimleri
moderasyon / platform uyarıları
18.2 Toplulaştırılması gerekenler
beğeni
kaydetme
story etkileşimi
hafif mağaza etkileşimi
düşük öncelikli sosyal hareketler
18.3 Zaman pencereli gitmesi gerekenler
günlük özet
mağaza performans özeti
toplu sosyal etkileşim
kampanya / öneri / hatırlatma

Net kural:
Bildirim sistemi anlık tepki ile özet akışı birlikte kullanmalıdır.

19. Bildirim görünürlüğü

Bildirim sistemi şu yüzeylerde görünür olmalıdır:

header
mobil header
bildirim merkezi sayfası / paneli
ilgili işlem sayfasındaki inline durum alanları

Ana sayfa ve genel chrome içinde bildirim görünürlüğü zaten tanımlı.

Ama her şey global zilde çözülmemelidir.
Bazı bildirimler ilgili ekranda inline görünmelidir:

sipariş detayında sipariş güncellemesi
teslimat ekranında teslimat güncellemesi
destek ekranında talep güncellemesi
20. Okundu / okunmadı mantığı

Bu sistem şu ayrımları desteklemelidir:

okunmadı
okundu
aksiyon alındı
arşivlenmiş / eski

Özellikle işlem bildirimlerinde “görüldü” ile “işlendi” farklı olabilir.

Örnek:

tedarikçi yeni siparişi görmüş olabilir ama henüz aksiyon almamış olabilir
kullanıcı iade sonucunu görmüş olabilir ama detayına gitmemiş olabilir
21. Teslimat sonrası özel bildirimler

Bu platform için özel olarak şu grup çok değerlidir:

ürün teslim edildi
bu ürün için yorum hakkınız açıldı
bu ürün için story yükleme hakkınız açıldı

Çünkü bu bildirimler yalnız geri çağırma değil, aynı zamanda PDP sosyal kanıt katmanını besleyen içerik üretimini tetikler.

Ama burada da spam yapılmamalı:

her teslimatta en fazla anlamlı tetik
aynı ürün için tekrar tekrar gereksiz hatırlatma yok
22. Moderasyon ve bildirim ilişkisi

Bildirim sistemi moderasyon kararlarını da taşıyabilmelidir.

Örnek:

story onaylandı
story reddedildi
içerik kaldırıldı
hak düşürüldü
puan iptal edildi

Kullanıcı sistemi moderasyon yetkilerini ve hak düşürme etkilerini açıkça tanımlar.

Bu grup özellikle kullanıcı ve fenomen için önemlidir.

23. Bildirim ayarları

Bildirim ayarları mutlaka olmalıdır.

Ama tüm bildirimler eşit ayarlanabilir olmamalıdır.

23.1 Kapatılamayan veya sınırlı yönetilenler
ödeme
sipariş
teslimat
iade / iptal sonucu
destek
güvenlik
kritik platform uyarıları
tedarikçi görev / SLA uyarıları
23.2 Yönetilebilir olanlar
yeni takipçi
mağaza etkileşimi
sosyal etkileşim
yeni mesaj
pazarlama / kampanya
hatırlatma

Net kural:
Kritik süreç bildirimleri kapatılamaz; sosyal ve pazarlama katmanı yönetilebilir olur.

24. Bildirim dili

Bildirim metinleri kısa, açık ve aksiyon odaklı olmalıdır.

Doğru bildirim dili:

ne oldu
kime oldu
şimdi ne yapılabilir

Yanlış bildirim dili:

belirsiz
uzun
fazla promosyon kokan
resmi süreçle sosyal dili karıştıran
25. Mobil öncelikli tasarım

Mobilde bildirim sistemi daha da sade çalışmalıdır.

Kurallar:

en kritik bildirimler üstte
okunmamış olanlar net ayrılmalı
filtreleme basit olmalı
çok sayıda sosyal etkileşim özet kartında toplanmalı
tek elde hızlı açılıp kapanmalı
kullanıcıyı yanlış ekrana sürüklememeli

Mobilde ana ayrım şunlar olabilir:

tümü
işlemler
mesajlar
sosyal
mağaza / operasyon
26. Performans kuralları

Bildirim sistemi performanslı olmalıdır.

26.1 Bildirim listesi hızlı açılmalı
26.2 Sayaç gecikmemeli
26.3 Gürültülü bildirimler gruplanmalı
26.4 Aynı olay tekrar tekrar çoğalmamalı
26.5 Kanal bazlı teslim mantığı hafif çalışmalı
26.6 Kritik bildirimler kaybolmamalı
27. Ana kurallar

Bildirim sistemi için temel kurallar şunlardır:

bildirimler kullanıcı, fenomen ve tedarikçi tarafları için ayrı mantıkla çalışmalıdır
her olay bildirim olmamalıdır
bazı bildirimler zorunlu çekirdek olmalıdır
işlem ve operasyon bildirimleri sosyal bildirimlerden daha yüksek öncelikli olmalıdır
sosyal etkileşim bildirimleri çoğu durumda toplulaştırılmalıdır
destek ve sosyal mesaj bildirimleri karışmamalıdır
fenomen tarafında bildirim çekirdektir ama spam’e dönmemelidir
tedarikçi tarafında bildirimler görev ve SLA odaklı olmalıdır
teslimat sonrası yorum/story hakkı açılması gibi olaylar anlamlı kullanıcı bildirimi üretebilir
kritik bildirimler kapatılamaz, yalnız kanal düzeyinde yönetilebilir
bildirim sistemi ne çok kıt ne de çok gürültülü olmalıdır
28. Nihai kısa özet

Bildirim sistemi, kullanıcı, fenomen mağaza ve tedarikçi için farklı öncelik ve anlam taşıyan olayları tek merkezli ama aktör bazlı mantıkla yöneten; zorunlu işlem bildirimlerini güvenle ileten, sosyal bildirimleri ise gürültü üretmeyecek biçimde özetleyen, dengeli ve çok taraflı uyarı sistemidir.

29. Bu aşamada hazır kararlar / burada netleştirdiğimiz kararlar
Mevcut sistemlerden gelen hazır kararlar
bildirim, header ve mobil header düzeyinde görünür çekirdek alandır
fenomen mağaza tarafında bildirim sistemi zorunlu çekirdek olarak işaretlenmiştir
fenomen için örnek bildirimler: yeni sipariş, yeni mesaj, yeni takipçi, story etkileşimi, mağaza etkileşimi
kullanıcı tarafında sipariş, destek, mesajlaşma ve teslimat sonrası hak ilişkileri vardır
sosyal mesajlaşma ile resmi destek süreçleri birbirinden ayrılmalıdır
Burada netleştirdiğimiz yeni çerçeve
bildirim sistemi üç ana aktör hattında çalışmalıdır: kullanıcı / fenomen / tedarikçi
bildirimler zorunlu / önemli / toplulaştırılacak olarak ayrılmalıdır
işlem bildirimleri ile sosyal bildirimler aynı öncelikte olmamalıdır
fenomen tarafında sosyal sinyaller vardır ama tek tek yağmamalıdır
tedarikçi tarafı sosyal değil, görev ve SLA odaklı bildirim almalıdır
teslimat sonrası yorum ve story hakkı açılması, kullanıcı için değerli işlem bildirimidir
kritik süreç bildirimleri kapatılamaz; sosyal ve pazarlama bildirimleri yönetilebilir olmalıdır

Sıradaki sistem: