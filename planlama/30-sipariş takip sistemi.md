SİPARİŞ TAKİP SİSTEMİ
1. Sistem tanımı

Sipariş takip sistemi, kullanıcının verdiği siparişin hangi aşamada olduğunu, hangi paketlere ayrıldığını, kargo sürecinin nerede bulunduğunu, teslimatın gerçekleşip gerçekleşmediğini ve satış sonrası hangi hakların açıldığını görünür kılan kullanıcı yüzü operasyon takip sistemidir. Bu sistem, kargo / teslimat sisteminin kullanıcıya görünen katmanıdır; siparişin iç operasyon mantığını değil, kullanıcının anlayacağı net durum akışını taşır. Platform sistem ağacında da sipariş takip sistemi ayrı netleştirilmesi gereken başlıklardan biri olarak tanımlanmıştır.

2. Sistemin ana amacı

Sipariş takip sisteminin ana amacı şudur:

kullanıcıya “siparişim nerede?” sorusunun net cevabını vermek,
siparişin tek bir statü ile değil, paket ve teslimat bağlamıyla görünmesini sağlamak,
gecikme, problem, teslim edildi, iade süreci gibi durumları dürüst göstermek,
kullanıcıyı destek sistemine gereksiz yönlendirmeden önce görünür bilgi sunmak,
teslimat sonrası yorum ve story hakkı gibi sistemsel eşiklerin ne zaman açıldığını anlaşılır hale getirmektir.

Kargo / teslimat sistemi dosyası, bu sistemin yalnız lojistik görünürlük sistemi değil aynı zamanda teslimat sonrası hakları tetikleyen eşik sistemi olduğunu açıkça söyler.

3. Temel ilke

Bu sistemin temel ilkesi şudur:

Sipariş takip sistemi, operasyonel karmaşıklığı kullanıcıya yığmaz; ama gerçeği de saklamaz.

Yani:

kullanıcıya dürüst durum gösterilir,
ama iç operasyon akışı aynen kullanıcıya yansıtılmaz,
kargo sistemi, fulfillment ve paket ayrışması kullanıcı açısından anlaşılır bir dile çevrilir,
“hazırlanıyor”, “kargoya verildi”, “teslim edildi”, “sorun var” gibi net durumlar görünür olur.

Bu yaklaşım hem sipariş sistemi hem kargo/teslimat sistemi hem de destek sistemiyle uyumludur.

4. Sistemin platform içindeki rolü

Akış sırası içinde sipariş takip sisteminin rolü şöyledir:

ödeme başarılı olur,
sipariş resmi ticari kayıt olarak oluşur,
sipariş fulfillment hattına düşer,
kargo / teslimat sistemi operasyonel süreci yürütür,
sipariş takip sistemi bu süreci kullanıcıya görünür hale getirir,
teslimat tamamlanınca yorum/story gibi haklar açılır,
problem varsa destek ve iade/iptal süreçlerine köprü kurulur.

Bu nedenle sipariş takip sistemi:

sipariş sistemi değildir,
teslimat sistemi de değildir,
ama ikisinin kullanıcı yüzü köprüsüdür.
5. Kimler kullanır

5.1 Giriş yapmış kullanıcı
Kendi siparişlerini ve onlara bağlı paket/durum görünürlüğünü görür.

5.2 Misafir kullanıcı
Sipariş takibinin ana kullanıcısı değildir; çünkü misafir ödeme ve sipariş oluşturamaz. Misafir modelinde sipariş oluşmadığı için takip sistemi de hesap bağlı çalışır.

5.3 Platform / operasyon
Bu sistemin kullanıcı yüzüne çıkan statüleri üretir ama kullanıcı ekranının doğrudan operatörü değildir.

6. Sistem hangi truth’lerden beslenir

Sipariş takip sistemi doğrudan kullanıcı yazımı ile değil, aşağıdaki truth kaynaklarından beslenir:

sipariş sistemi
kargo / teslimat sistemi
paket / shipment verisi
teslimat doğrulama
iade / iptal etkileri
destekte kritik problem statüleri

Bu nedenle takip sistemi kendi truth’unu üretmez; mevcut truth’leri kullanıcı diliyle görünür kılar.

7. Ana görünürlük katmanları

Sipariş takip sisteminde en az şu görünürlük katmanları bulunmalıdır:

7.1 Sipariş özeti

sipariş numarası
sipariş tarihi
toplam tutar
sipariş statüsü özeti

7.2 Paket / gönderi görünürlüğü

kaç paket var
hangi paket hangi aşamada
kargo firması / takip numarası varsa görünürlük
tahmini teslimat bilgisi

7.3 Satır bazlı görünürlük

hangi ürün hangi pakette
satır teslim edildi mi
satır iptal edildi mi
satır iade sürecine girdi mi

7.4 Problem / istisna görünürlüğü

gecikme
teslimat problemi
eksik teslimat
iade süreci
destek önerisi

Bu yapı, sipariş sistemindeki satır/paket gerçeği ve teslimat sistemindeki shipment/package mantığıyla uyumludur.

8. Tek sipariş, çok paket mantığı

Bu platformda tek sipariş birden fazla pakete ayrılabilir. Sipariş takip sistemi bunu görünür kılmalıdır. Doğru model:

kullanıcı tek sipariş görür,
ama sipariş içinde bir veya daha fazla paket olabilir,
her paketin ayrı durum akışı bulunabilir,
teslimat kullanıcıya paket bazlı gösterilir.

Kargo / teslimat sistemi dosyası paketleme sistemini ve tek siparişin birden fazla pakete ayrılabileceğini açıkça tanımlar.

9. Temel durum akışı

Kullanıcı tarafında sade ama dürüst durum seti şöyle olmalıdır:

sipariş alındı
hazırlanıyor
kargoya verildi
yolda
teslim edildi
teslimatta sorun var
kısmi teslim edildi
iptal edildi
iade sürecinde
tamamlandı

Bu set iç operasyon statülerinin sadeleştirilmiş görünümüdür. Sipariş sistemi ve teslimat sistemi statü bazlı çalıştığı için takip ekranı da statü bazlı ama kullanıcı diliyle çalışmalıdır.

10. Teslimat doğrulama ilişkisi

Sipariş takip sistemi “teslim edildi” ifadesini erken göstermemelidir. Teslim edildi statüsü ancak teslimat doğrulama sistemi bunu resmileştirdiğinde görünmelidir. Çünkü teslim edildi anı:

lojistik gerçektir,
teslimat sonrası hakları açar,
yorum ve story gibi hakların başlangıç eşiğidir.

Kargo / teslimat sistemi dosyası bu eşik mantığını açıkça kurar.

11. Teslimat sonrası hak görünürlüğü

Bu platform için kritik özel katman şudur:

ürün teslim edildi
bu ürün için yorum hakkınız açıldı
bu ürün için story yükleme hakkınız açıldı

Bildirim sistemi bu grup olayları önemli kullanıcı bildirimi olarak tanımlar. Sipariş takip sistemi de bu hakların ne zaman açıldığını görünür kılmalıdır. Böylece kullanıcı sadece teslimatı değil, teslimat sonrası yapabileceklerini de anlar.

12. Gecikme ve problem görünürlüğü

Takip sistemi “sessiz belirsizlik” üretmemelidir. Doğru model:

gecikme varsa gösterilmeli,
teslim edildi görünüyor ama problem varsa açık uyarı verilmeli,
kayıp/hasarlı/teslimat başarısız gibi durumlar saklanmamalı,
kullanıcıyı doğru anda destek kanalına yönlendirmelidir.

Kargo / teslimat sistemi gecikme ve problem durumlarının dürüst yansıtılmasını açıkça zorunlu kılar. Destek sistemi de “kargom nerede”, “teslim edildi görünüyor ama almadım” gibi başlıkları resmi destek konusu olarak ayırır.

13. Takip ekranında bulunması gereken ana alanlar

İlk faz için sipariş takip ekranında en az şu alanlar bulunmalıdır:

sipariş numarası
sipariş tarihi
genel durum
toplam tutar
ürün satırları
paket sayısı
her paket için durum
kargoya verildiyse takip bilgisi
tahmini teslimat / güncel teslimat bilgisi
teslim edilen satırlar
sorunlu satırlar
destek / iade / detay CTA’ları

Bu alan seti, mevcut sipariş, teslimat ve destek sistemlerinden mantıksal olarak çıkar ve onlarla tam uyumludur.

14. Destek sistemi ile ilişkisi

Sipariş takip sistemi destek sisteminin yerine geçmez; ama destek yükünü azaltır. Doğru akış:

kullanıcı önce takip ekranında açık durum görür,
problem anında bağlamsal destek başlığı sunulur,
gerekirse doğrudan ilgili destek konusuna geçilir.

Destek sistemi dosyası bağlamsal destek davranışını doğru model olarak tanımlar; sipariş detayında sipariş / teslimat / iade başlıklarının öne çıkması gerektiğini söyler. Bu takip sistemiyle doğrudan bağlanır.

15. İade / iptal sistemi ile ilişkisi

Sipariş takip ekranı iptal ve iade süreçlerini görünür kılmalıdır; ama bu süreçlerin kurallarını sahiplenmez. Doğru model:

satır iptal edildiyse görünür olur,
iade sürecine girdiyse takip ekranında ayrı durum kartı açılır,
ama karar, refund ve operasyon mantığı iade/iptal sisteminde kalır.

İptal / iade sistemi satır bazlı çalıştığı için takip sistemi de satır bazlı görünürlüğü desteklemelidir.

16. Bildirim sistemi ile ilişkisi

Bildirim sistemi kullanıcıyı geri çağırır; sipariş takip sistemi ayrıntıyı gösterir. Bu ikisi karıştırılmamalıdır. Doğru model:

“kargoya verildi” bildirimi gelir,
kullanıcı takip ekranında ayrıntıyı görür;
“teslim edildi” bildirimi gelir,
kullanıcı takip ekranında hangi satırların teslim edildiğini ve hangi hakların açıldığını görür.

Bildirim sistemi dosyası işlem bildirimlerini yüksek öncelikli çekirdek grup olarak açıkça tanımlar.

17. Mobil öncelikli tasarım

Mobilde sipariş takip sistemi çok net ve sade olmalıdır. Doğru yaklaşım:

üstte genel durum
altında zaman çizgisi veya durum kartı
sonra paketler
sonra ürün satırları
sonra aksiyonlar

Kullanıcıyı uzun operasyon yazılarına boğmadan, tek elde okunabilir yapı kurulmalıdır. Özellikle mobilde “kargom nerede?” sorusunun cevabı ilk ekranda görünmelidir.

18. Performans yaklaşımı

Sipariş takip sistemi performanslı olmalıdır çünkü kullanıcı bu ekrana genellikle yüksek niyetle gelir. Bu nedenle:

son durum hızlı açılmalı,
geçmiş olay listesi gerekiyorsa ikinci katmanda açılmalı,
her yenilemede tüm ekran ağır yüklenmemeli,
paket/satır ayrımı sade tutulmalıdır.
19. Ana kurallar

Sipariş takip sistemi için sabitlenmesi gereken temel kurallar şunlardır:

sipariş takip sistemi, kargo/teslimat sisteminin kullanıcı yüzüdür
misafir kullanıcı ana aktör değildir; takip hesap bağlı çalışır
sistem kendi truth’unu üretmez; sipariş ve teslimat truth’lerinden beslenir
tek sipariş, çok paket görünürlüğü desteklenmelidir
teslim edildi statüsü ancak resmi teslimat doğrulamasından sonra görünmelidir
gecikme ve problem durumları saklanmamalıdır
teslimat sonrası yorum/story hakkı açılması görünür olmalıdır
destek ve iade/iptal sistemlerine bağlamsal geçiş vermelidir
kullanıcıya operasyonel karmaşa değil, net ve dürüst durum görünürlüğü sunmalıdır
20. Nihai kısa özet

Sipariş takip sistemi, ödeme sonrası oluşmuş siparişin paket, gönderi ve teslimat durumlarını kullanıcıya net ve dürüst biçimde gösteren; tek sipariş içinde çok paketli yapıyı görünür kılan; teslim edildi eşiğini resmi teslimat doğrulamasına bağlayan; gecikme, problem, iade ve teslimat sonrası yorum/story hakkı gibi durumları kullanıcı diliyle görünür hale getiren operasyon takip yüzeyidir.