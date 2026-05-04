SİPARİŞ OPERASYON SİSTEMİ
1. Sistem tanımı

Sipariş operasyon sistemi, başarılı ödeme sonrası oluşmuş siparişlerin iç operasyon tarafında işlenmesini, tedarikçilere düşmesini, hazırlanmasını, paketlenmesini, sevkiyat aşamasına geçmesini, problemli siparişlerin ayrıştırılmasını, gecikme ve istisna durumlarının yönetilmesini sağlayan merkezi operasyon yönetim sistemidir.

Bu sistemin görevi yalnız “sipariş oluştu” demek değildir. Aynı zamanda:

siparişi operasyon işine çevirmek
sipariş satırlarını ilgili tedarikçi ve fulfillment akışına düşürmek
hazırlanacak işleri kuyruklamak
paket ayrışmasını yönetmek
gecikme ve problem durumlarını işaretlemek
operasyonel tıkanmaları görünür kılmak
iptal / iade / destek / teslimat süreçlerine doğru veri taşımaktır

Kısa tanım:

Sipariş operasyon sistemi, siparişi iç operasyon iş akışına dönüştüren ve fulfillment hattını yöneten sistemdir.

2. Temel ilke

Bu sistemin temel ilkesi şudur:

Sipariş operasyonu, kullanıcı yüzü değil; platformun iç çalışma motorudur.

Yani:

kullanıcı siparişin iç operasyon karmaşasını görmez
iç operasyon statüleri ile kullanıcıya gösterilen statüler aynı olmak zorunda değildir
operasyon truth’u platformda kalır
fenomen sipariş operasyon owner’ı değildir
tedarikçi hazırlama ve sevkiyat tarafında rol alır ama sipariş truth owner’ı değildir.

Net kural:

sipariş operasyon sistemi kullanıcı ekranı değildir
ama kullanıcıya giden tüm takip/doğruluk bilgisinin arkasındaki iç kaynaktır

3. Sistemin platform içindeki rolü

Akış sırası şöyle kurulmalıdır:

ödeme başarılı olur
sipariş resmi ticari kayıt olarak oluşur
sipariş operasyon sistemi bu kaydı operasyon iş akışına çevirir
fulfillment hazırlığı başlar
paketleme ve sevkiyat akışı oluşur
kargo / teslimat sistemi fiziksel süreci yürütür
sipariş takip sistemi bunu kullanıcıya görünür kılar

Bu nedenle sipariş operasyon sistemi:

sipariş sisteminin devamıdır
kargo / teslimat sistemine köprüdür
destek, iptal/iade ve problem yönetimine veri sağlar
admin ve operasyon ekipleri için temel iç çalışma katmanıdır.
4. Bu sistem sipariş sistemiyle aynı şey değildir

Bu ayrımı net sabitlemek gerekir.

Sipariş sistemi:

resmi satış kaydını oluşturur
sipariş satırlarını, paket bağlamını ve statü omurgasını taşır

Sipariş operasyon sistemi:

bu kayıt üstünde çalışır
siparişi iş listesine çevirir
tedarikçi/fulfillment aksiyonlarını koordine eder
problemli akışları ayrıştırır
gecikme ve istisnaları yönetir

Net kural:

sipariş sistemi ticari gerçektir
sipariş operasyon sistemi operasyonel iş akışıdır

5. Aktörler

Bu sistemde en az şu aktörler vardır:

5.1 Platform operasyonu

Nihai operasyon yöneticisidir.

5.2 Tedarikçi

Kendine düşen sipariş satırlarını hazırlar ve gönderir.

5.3 Admin / Operations Admin

Operasyon ekranlarını görür, tıkanmaları yönetir, escalation başlatır.

5.4 Destek sistemi

Problemli siparişlerde kullanıcı tarafı çözüm kanalına bağlanır.

5.5 Kargo / teslimat sistemi

Fiziksel gönderim sürecini taşır.

5.6 Kullanıcı

Bu sistemin doğrudan operatörü değildir; etkisini sipariş takip ekranında hisseder.

6. Sipariş operasyon yaşam döngüsü

Sipariş operasyon sistemi kendi iç yaşam durumlarına sahip olmalıdır.

Minimum iç operasyon durumları:

6.1 Operasyona alındı

Sipariş oluştu, operasyon kuyruğuna düştü.

6.2 Ayrıştırıldı

Sipariş satırları tedarikçi / depo / paket bazında ayrıştırıldı.

6.3 Hazırlama bekliyor

İlgili operasyon aktörü henüz ürünü hazırlamaya başlamadı.

6.4 Hazırlanıyor

Paketleme / toplama süreci başladı.

6.5 Paketlendi

Sevkiyata hazır hale geldi.

6.6 Sevkiyat bekliyor

Taşıyıcıya teslim edilmedi ama iç hazırlık tamamlandı.

6.7 Sevke verildi

Artık kargo / teslimat hattına geçmiş durumda.

6.8 Problemli operasyon

Eksik ürün, gecikme, stok uyuşmazlığı, kalite sorunu gibi iç problem oluştu.

6.9 Kısmi tamamlandı

Çok satırlı veya çok paketli yapılarda siparişin bir kısmı işlenmiş olabilir.

6.10 Operasyon kapandı

Sipariş operasyon tarafında iş akışı tamamlandı; kalan görünürlük teslimat ve sonrası sistemlere geçer.

7. Sipariş ayrıştırma sistemi

Sipariş operasyonunun en kritik parçalarından biri ayrıştırmadır.

Sipariş şu eksenlerde ayrışabilir:

tedarikçi bazında
paket bazında
sevkiyat bazında
problemli / problemsiz satır bazında
kısmi teslim edilebilir satırlar bazında

Bu ayrıştırma yapılmadan:

teslimat doğru yönetilemez
sipariş takip net gösterilemez
iptal/iade düzgün çalışmaz
destek doğru bağlama oturmaz

Net kural:

sipariş tek kayıt olabilir, ama operasyon tek parça olmak zorunda değildir.

8. Fulfillment iş kuyruğu

Sipariş operasyon sistemi bir iş kuyruğu mantığı taşımalıdır.

Minimum kuyruklar:

yeni işler
hazırlanacak siparişler
geciken işler
tedarikçi bekleyen işler
paketleme bekleyen işler
sevkiyat bekleyen işler
problemli işler
escalation bekleyen işler

Bu sistem sayesinde operasyon ekibi şunu görür:

nerede darboğaz var
hangi tedarikçi yavaş
hangi siparişler SLA riski taşıyor
hangi siparişler kullanıcı desteğine düşme ihtimali taşıyor
9. Problem yönetimi

Sipariş operasyon sistemi problemsiz akış kadar problemli akışı da owner seviyesinde taşımalıdır.

Minimum problem türleri:

stok uyuşmazlığı
hazırlanamayan ürün
geç hazırlama
eksik paket
yanlış paketleme
taşıyıcıya geç veriliş
tedarikçi kaynaklı gecikme
kalite kaynaklı blok
operasyonel inceleme ihtiyacı

Her problem için şu alanlar tutulmalıdır:

problem tipi
problem seviyesi
etkilenen sipariş / satır / paket
kaynak taraf
açılış tarihi
son aksiyon
sorumlu ekip
çözüm notu
kapanış nedeni
10. Tedarikçi ile ilişki

Tedarikçi paneli ve tedarikçi yönetim sistemi burada doğrudan bağlanır.

Sipariş operasyon sistemi:

tedarikçiye hazırlama işi düşürür
hazırlanma süresini ölçer
gecikmeyi işaretler
problemli davranışı kalite sinyaline dönüştürür

Ama net kural:

tedarikçi sipariş operasyon truth owner’ı değildir
yalnız kendine düşen operasyon görev alanında işlem yapar

Bu ayrım tedarikçi paneli ve tedarikçi yönetim sistemiyle uyumludur.

11. Fenomen ile ilişki

Fenomen mağaza satış vitrini ve ilişki yüzüdür; sipariş operasyon owner’ı değildir.

Bu nedenle sipariş operasyon sisteminde:

fenomen siparişi görsel/performans düzeyinde dolaylı görebilir
ama operasyon akışını yönetmez
tedarikçiye iş atamaz
sevkiyat statüsünü değiştiremez
paket ayrıştırmasına müdahale etmez

Net kural:

fenomen satış üretir, operasyonu platform yürütür.

12. Kargo / teslimat sistemi ile ilişki

Sipariş operasyon sistemi ile kargo / teslimat sistemi arasında net sınır olmalıdır.

Sipariş operasyon sistemi:

iç hazırlık
paketleme
sevke hazırlama
iç problem çözümü
taşıyıcıya teslim öncesi akış

Kargo / teslimat sistemi:

sevk edildi
taşıma süreci
dağıtım
teslimat doğrulama
teslimat sonrası hak açılımı

Net kural:

sevkiyata kadar iç operasyon ağırlık sipariş operasyon sistemindedir; sevkiyattan sonra taşıma truth’u teslimat sistemine kayar.

13. Sipariş takip sistemi ile ilişki

Sipariş takip sistemi kullanıcı yüzüdür. Sipariş operasyon sistemi ise iç truth üretir.

Bu yüzden:

kullanıcıya gösterilen basit statüler
iç operasyon sistemindeki detaylı statülerden türetilir

Örnek:

“hazırlanıyor” kullanıcı statüsü
arka planda
ayrıştırıldı
hazırlama bekliyor
toplanıyor
paketleniyor
alt statülerinden gelebilir.

Net kural:

kullanıcı ekranı operasyonel karmaşayı yansıtmaz
ama gerçeği de bozmaz.

14. İptal / iade sistemi ile ilişki

Sipariş operasyon sistemi iptal/iade sistemine veri üretir.

Örnek:

sipariş henüz sevke çıkmadıysa iptal kolaylaşabilir
sevkiyat öncesi problem varsa operasyonel iptal gerekebilir
yanlış paketleme veya eksik ürün iade riskini artırabilir

Bu nedenle sipariş operasyon sistemi:

iptal uygunluğunu etkileyen iç statüleri
kalite/iade risk sinyallerini
problem geçmişini
taşımalıdır.
15. Destek sistemi ile ilişki

Destek sistemi her sorunu kendi başına çözmez; çoğu zaman sipariş operasyon sisteminden veri çeker.

Destek açısından kritik alanlar:

sipariş neden gecikti
hangi aşamada kaldı
problem tipi ne
hangi aktör bekleniyor
kullanıcıya verilecek dürüst açıklama ne

Bu yüzden sipariş operasyon sistemi ile destek sistemi arasında güçlü bağ şarttır.

16. Admin ve operasyon paneli ilişkisi

Bu sistem doğrudan admin sistemi altındaki Operasyon / Sipariş Operasyon modülünde yaşamalıdır.

Panelde görülmesi gereken temel ekranlar:

yeni siparişler
hazırlanma bekleyenler
gecikenler
problemli siparişler
kısmi tamamlananlar
tedarikçi bazlı iş yoğunluğu
operasyon notları
escalation ekranı
manuel inceleme ekranı

Net kural:

panel operasyon görünürlüğü ve karar akışı sağlar
ama owner modül sınırlarını kırmamalıdır

17. İç metrikler ve performans sinyalleri

Sipariş operasyon sistemi yalnız akış yönetmez; kalite sinyali de üretir.

İzlenmesi gereken ana sinyaller:

hazırlanma süresi
tedarikçi bazlı gecikme oranı
paketleme problemi oranı
sevkiyata geç çıkma oranı
problemli sipariş oranı
kısmi işlenen sipariş oranı
operasyon kaynaklı iptal oranı
operasyon kaynaklı destek teması

Bu sinyaller:

tedarikçi yönetim sistemine
analitik sistemine
risk/fraud sistemine
admin dashboard’una veri sağlar
18. Kritik edge case kararları
sipariş oluştu ama stok uyuşmazlığı çıktı → problemli operasyon kuyruğuna düşer
siparişin bazı satırları hazırlanabildi, bazıları hazırlanamadı → kısmi operasyon akışı açılır
tedarikçi süresi içinde hazırlamadı → gecikme + kalite sinyali üretilir
yanlış paketleme fark edildi → sevkiyat öncesi blok uygulanabilir
taşıyıcıya devredildi ama iç kayıt kapanmadı → operasyon kapanışı sevkiyat doğrulamasıyla senkronize edilir
aynı sipariş için tekrar eden problem açıldı → escalation seviyesi yükselir
19. Audit ve kayıt

Sipariş operasyon sistemindeki her kritik aksiyon kayıt altına alınmalıdır:

kuyruğa alma
ayrıştırma
tedarikçiye düşürme
hazırlama başlangıcı
paketleme tamamlanması
problem açılması
problem kapanması
escalation
iç not
manuel karar

Bu olmadan operasyon denetlenebilir olmaz.

20. Ana kurallar

Sipariş operasyon sistemi için sabitlenmesi gereken temel kurallar şunlardır:

sipariş operasyon sistemi, siparişin iç çalışma motorudur
sipariş sistemiyle aynı şey değildir
sipariş takip sistemiyle aynı şey değildir
kargo / teslimat sistemiyle aynı şey değildir
sipariş operasyonu kullanıcı yüzü değil, iç operasyon katmanıdır
siparişler satır / paket / tedarikçi bazında ayrıştırılabilir
tedarikçi hazırlama ve sevkiyat öncesi rol alır ama owner değildir
fenomen sipariş operasyon owner’ı değildir
problemli sipariş akışı ayrı kuyruk ve statü taşımalıdır
destek, iptal/iade ve teslimat sistemleri bu sistemden veri alır
tüm kritik aksiyonlar audit log üretmelidir
21. Nihai kısa özet

Sipariş operasyon sistemi, başarılı ödeme sonrası oluşmuş siparişleri iç operasyon iş akışına dönüştüren; sipariş satırlarını ayrıştıran; tedarikçiye hazırlama işi düşüren; paketleme, sevkiyata hazırlama, gecikme ve problem yönetimini yürüten; sipariş takip ve teslimat sistemlerine truth sağlayan; fakat kullanıcıya doğrudan görünmeyen merkezi operasyon orkestrasyon sistemidir.