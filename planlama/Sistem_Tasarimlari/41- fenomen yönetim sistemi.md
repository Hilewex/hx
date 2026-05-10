FENOMEN YÖNETİM SİSTEMİ
1. Sistem tanımı

Fenomen yönetim sistemi, platforma fenomen olarak katılmak isteyen adayların başvuru değerlendirmesini, onay sonrası fenomen hesabı ve mağaza yaşam döngüsünü, kategori yetkilerini, mağaza davranış sınırlarını, kısıtlama ve askıya alma kararlarını yöneten merkezi yönetim sistemidir.

Bu sistemin görevi yalnız başvuru almak değildir. Aynı zamanda:

fenomen adayını değerlendirmek
uygun bulunan adayı onaylamak veya reddetmek
fenomen için kategori yetkisi tanımlamak
fenomen mağazasının hangi sınırlar içinde çalışacağını belirlemek
ihlal, kalite düşüşü veya risk durumunda uyarı / kısıtlama / askıya alma uygulamak
fenomen mağazasının satış, içerik ve müşteri memnuniyeti performansını izlemek
gerekirse görünürlük, yetki ve mağaza statüsü üzerinde yönetimsel karar almaktır.

Kısa tanım:

Fenomen yönetim sistemi, fenomenin başvurudan aktif mağaza yaşam döngüsüne kadar platform içindeki tüm yönetim ve denetim yapısını taşıyan sistemdir.

2. Temel ilke

Bu sistemin temel ilkesi şudur:

Fenomen bağımsız satıcı değildir; kontrollü platform mağazası işleten onaylı aktördür.

Yani:

fenomen mağaza açmak için başvurur
nihai onay platformdadır
kategori yetkisini platform verir
fenomen yalnız izin verilen sınırlar içinde mağaza yönetir
stok, kargo, ödeme, sipariş operasyonu ve ana ticari truth platformdadır.

Bu ilke esnetilmez.
Çünkü fenomen mağazasının karakteri zaten “his olarak bağımsız, operasyon olarak platforma bağlı” modelidir. Fenomen yönetim sistemi bu ayrımı yönetsel olarak sabitler.

3. Sistemin platform içindeki rolü

Fenomen yönetim sistemi, admin sistemi altındaki temel alt modüllerden biridir. Admin sistemi başvuru merkezini ve üst karar mekanizmasını taşır; fenomen yönetim sistemi ise onay sonrası fenomen yaşam döngüsünü yönetir. Platform sistem ağacında admin sistemi ile fenomen yönetim sisteminin ayrı ama bağlı iki başlık olarak tanımlanması bunun doğrudan kanıtıdır.

Bu yüzden fenomen yönetim sistemi:

fenomen başvurularını admin başvuru merkezinden devralır
onaylanan fenomenin aktif yaşam döngüsünü taşır
kategori yetkilerini yönetir
mağaza davranış sınırlarını uygular
uyarı / kısıt / askıya alma mekanizmasını çalıştırır
performans ve kalite görünürlüğü üretir.

4. Bu sistem fenomen mağaza sistemiyle aynı şey değildir

Bu ayrım çok kritik.

Fenomen mağaza sistemi şunları anlatır:

mağaza ne işe yarar
müşteri ne görür
fenomen mağazada ne yapabilir
mağazanın sosyal-commerce rolü nedir.

Fenomen yönetim sistemi ise şunları anlatır:

kim fenomen olabilir
nasıl onaylanır
hangi kategorilerde satış yapabilir
hangi ihlalde kısıt alır
hangi performansta uyarı alır
ne zaman askıya alınır
ne zaman görünürlüğü düşürülür
ne zaman rozet alır veya kaybeder.

Net kural:

fenomen mağaza vitrindir
fenomen yönetim sistemi denetim ve yaşam döngüsü sistemidir.

5. Aktörler

Bu sistemde en az şu aktörler bulunmalıdır:

5.1 Fenomen adayı

Henüz onay almamış kişidir. Başvuru yapar, belge sunar, inceleme bekler.

5.2 Onaylı fenomen

Başvurusu kabul edilmiş, mağaza açma ve belirli kategori sınırlarında faaliyet gösterme hakkı almış aktördür.

5.3 Admin / Commerce Admin / Fenomen Admin

Başvuru inceleme, kategori yetkisi verme, kısıtlama, uyarı, askıya alma ve statü değişikliği kararlarını verir.

5.4 Moderation / Risk / Support / Operations yan aktörleri

Fenomenin ihlal, kalite, destek yükü, müşteri memnuniyeti ve operasyonel etkisi hakkında sinyal üretir; ama nihai fenomen statü kararı admin tarafında kalır. Bu yaklaşım admin sisteminin çok rollü yapısı ve panel modül mantığıyla uyumludur.

6. Fenomen yaşam döngüsü

Bu sistem yaşam döngüsü bazlı çalışmalıdır.

Fenomen için minimum durumlar şunlardır:

6.1 Başvuru alındı

Aday başvuru yapmıştır. Henüz inceleme tamamlanmamıştır.

6.2 Ön incelemede

Belge, profil, kategori uyumu, görünürlük ve güven incelemesi sürmektedir.

6.3 Revizyon istendi

Eksik bilgi, eksik belge, açıklama ihtiyacı veya profil netliği sorunu vardır.

6.4 Onaylandı

Fenomen hesabı aktifleşir. Kategori yetkileri tanımlanır. Mağaza açılış süreci başlar.

6.5 Aktif

Fenomen mağazası platformda aktif şekilde çalışır.

6.6 Kısıtlı aktif

Fenomen tamamen kapatılmamıştır ama belirli alanlarda kısıt vardır.
Örnek:

bazı kategoriler kapalı
yeni içerik yükleme geçici durdurulmuş
görünürlük düşürülmüş
bazı mağaza özellikleri geçici kapatılmış
6.7 Askıda

Fenomen mağazası geçici olarak durdurulmuştur. Yeni aktif ticari ve içerik davranışı kapalıdır.

6.8 Kalıcı kapalı / sonlandırıldı

Fenomenin mağaza yaşam döngüsü platform tarafından sona erdirilmiştir.

Bu yaşam döngüsü, başvuru ve onay hattının ayrı yönetilmesi gereğiyle de uyumludur.

7. Başvuru sistemi ile ilişkisi

Fenomen mağaza herkese açılmaz. Başvuru, platform incelemesi ve uygun profil onayı gerekir; takipçi eşiği tek başına yeterli değildir. Platform isterse kategori bazlı değerlendirme yapabilir. Bu zaten fenomen mağaza sisteminde sabittir.

Bu nedenle fenomen yönetim sistemi için başvuru değerlendirmesinde en az şu alanlar olmalıdır:

kimlik / hesap doğruluğu
iletişim doğruluğu
sosyal görünürlük / içerik kalitesi
hedef kategori uyumu
marka / üslup uyumu
risk / sahtecilik / taklit şüphesi
önceki platform geçmişi varsa onun değerlendirilmesi
gerekirse belge / ek açıklama

Net kural:

başvuru merkezi admin altında çalışır
fenomen yönetim sistemi başvuru sonucunu devralır ve yaşam döngüsünü yürütür.

8. Kategori yetki sistemi

Platform fenomen için kategori yetkisi tanımlar. Bu ifade fenomen mağaza sisteminde açıkça yer alır ve platform sistem ağacı da fenomen yönetim sistemini özellikle bu başlık için gerekli görür.

Bu nedenle kategori yetkisi fenomen yönetim sisteminin çekirdek bölümüdür.

Kategori yetkisi şu mantıkla çalışmalıdır:

fenomen her kategoride satış yapamaz
platform fenomenin mağaza kimliğine uygun kategori alanlarını açar
bazı kategoriler başlangıçta kapalı olabilir
performans arttıkça yeni kategori açılabilir
ihlal veya kalite düşüşünde kategori daraltılabilir

Kategori yetkisinin minimum durumları:

yetkili
kısıtlı yetkili
inceleme altında
kapalı

Bu sistem sayesinde mağaza kimliği ve ticari kalite korunur.

9. Fenomenin yönetimsel yetki sınırları

Fenomen mağaza sistemi, fenomenin ne yapabileceğini ve yapamayacağını zaten tarif ediyor. Fenomen; havuzdan ürün seçebilir, mağazasına ürün ekleyebilir, ürün sırasını düzenleyebilir, kurallı fiyat seçebilir, içerik ve mağaza kimliği oluşturabilir; ama bağımsız fiyat motoru, stok owner’ı, kargo owner’ı veya sipariş operasyon owner’ı değildir.

Fenomen yönetim sistemi bu sınırları enforcement seviyesinde taşır.

Fenomenin izinli alanları:

ürün seçkisi
mağaza içi kurasyon
mağaza açıklaması
not, görsel, video, story, post
takipçiyle kontrollü ilişki

Fenomenin yasaklı alanları:

dışarıdan ürün sokmak
stok üretmek
bağımsız kargo hattı kurmak
fiyat koridoru dışına çıkmak
sipariş operasyonunu sahiplenmek
resmi ürün cevabı vermek
platform dışı ödeme/sipariş akışı kurmak.
10. Mağaza davranış sınırları

Platform sistem ağacı fenomen yönetim sistemini “mağaza davranış sınırları” için de gerekli görür.

Bu nedenle sistem, fenomen mağazasının davranış profilini izlemelidir.

Takip edilmesi gereken ana davranış başlıkları:

ürün seçim kalitesi
içerik kalitesi
spam / aşırı tekrar / uygunsuz post davranışı
müşteri mesaj yükü ve problem oranı
yüksek iade ile ilişkili mağaza davranışı
yanıltıcı içerik veya aşırı vaat
kurallı fiyat davranışına uyum
platform politika ihlali

Bu alanlar sadece moderasyon konusu değildir; aynı zamanda fenomen yönetim konusu olmalıdır. Çünkü bazı ihlaller içerik silmekle çözülmez, mağaza seviyesinde yaptırım ister.

11. Uyarı, kısıtlama ve yaptırım sistemi

Fenomen yönetim sistemi kademeli enforcement taşımalıdır.

Minimum yaptırım seviyeleri:

11.1 İç uyarı

Fenomen platform içinden uyarılır. Kayıt audit log’a düşer.

11.2 Özellik kısıtı

Örnek:

yeni story yükleme geçici kapanır
post paylaşımı sınırlanır
belirli kategoriye ürün ekleme durur
11.3 Görünürlük kısıtı

Mağaza ve içerikler daha düşük görünürlük alır.

11.4 Kategori yetki daraltma

Bazı kategori hakları kapatılır.

11.5 Geçici askı

Mağaza aktif satış ve içerik akışından geçici çıkarılır.

11.6 Kalıcı kapatma

Yüksek ihlal, tekrar eden kötü niyet veya ciddi marka/güven riski halinde uygulanır.

Bu yaptırımlar keyfi değil; kayıtlı, gerekçeli ve audit’li olmalıdır. Panel sistemleri LOCK dosyası da tüm panel işlemlerinin audit log üretmesi gerektiğini söyler.

12. Rozet ve görünür statü sistemi ile ilişkisi

Fenomen mağaza sisteminde rozetlerin platform kontrolünde olduğu, verilip geri alınabildiği ve ilk aşamada görünür statü rolü taşıdığı açıkça yazılıdır. Mağaza puanının da ürün deneyiminden, yorumlardan ve memnuniyet sinyallerinden türeyebileceği belirtilmiştir.

Bu nedenle fenomen yönetim sistemi şu alanları taşımalıdır:

rozet atama
rozet geri alma
mağaza kalite puanı görünürlüğü
performans temelli görünür statü
risk veya ihlal durumunda rozet düşürme

Net kural:

rozet ve puan, fenomenin kendi kendine aldığı statü değil; platformun görünür yönetim kararıdır.

13. Performans görünürlüğü

Fenomen yönetim sistemi sadece ihlal sistemi olmamalıdır. Aynı zamanda performans görünürlüğü de üretmelidir.

Admin tarafında en az şu sinyaller izlenmelidir:

satış hacmi
sipariş adedi
iade oranı
iptal etkisi
ürün yorum kalitesi
mağaza puanı
takipçi büyümesi
mesaj / destek problem yoğunluğu
içerik etkileşimi
kampanya katkısı

Fenomen mağaza sisteminde mağaza puanı, rozetler, yeni takipçi, mağaza etkileşimi ve yeni sipariş gibi sinyaller zaten temas ediliyor; bildirim sistemi de fenomen tarafında mağaza canlılığını görünür kılmak gerektiğini söylüyor.

Bu nedenle fenomen yönetim sistemi, hem denetim hem performans gözlemi taşımalıdır.

14. Bildirim sistemi ile ilişkisi

Fenomen için bazı bildirimler çekirdek düzeyde önemlidir. Fenomen mağaza sistemi ve bildirim sistemi birlikte düşünüldüğünde minimum kritik bildirimler şunlardır:

yeni sipariş
yeni soru
yeni mesaj
yeni takipçi
story etkileşimi
mağaza etkileşimi
platform uyarısı
yetki değişikliği
askı / kısıt kararı
başvuru / revizyon sonucu.

Fenomen yönetim sistemi, bu bildirimlerin hangi durumda zorunlu ve hangi durumda tercihli olduğunu belirleyen yönetimsel kaynağı üretmelidir.

15. Satış ve sipariş ilişkisi

Fenomen mağaza satış yapar ama sipariş operasyonunu sahiplenmez. Sipariş platformda oluşur, tedarikçiye düşer, süreç platformca yönetilir. Fenomen siparişin sosyal yüzüdür; operasyon owner’ı değildir. Kargo da fenomen alanı değildir.

Bu nedenle fenomen yönetim sistemi için doğru görünürlük modeli şudur:

fenomen kendi satış performansını görebilir
fenomen kendi sipariş akışına sınırlı görünürlük alabilir
ama fulfillment iç truth’una write yapamaz
kargo akışını değiştiremez
sipariş statüsünü keyfi güncelleyemez

Bu ayrım yönetim sisteminde açıkça korunmalıdır.

16. Admin sistemi ile ilişkisi

Fenomen yönetim sistemi admin sistemi altında çalışmalıdır.

Doğru ilişki şöyledir:

başvuru merkezi admin tarafında bulunur
fenomen yönetim modülü admin sistemi içinde ayrı alt modüldür
başvuru sonucu burada aktif yönetime dönüşür
kategori yetkileri, yaptırımlar, görünür statüler ve yaşam döngüsü burada yönetilir
ama panel direct write yapmaz; ilgili owner sisteme command gönderir.

Bu yapı, senin kurduğun admin sistemiyle birebir uyumludur.

17. Fenomen paneli ile ilişkisi

Panel sistemleri LOCK dosyası, fenomen panelini ayrı panel türü olarak tanımlar. İçinde profil/mağaza ayarları, ürün havuzu, mağaza ürünleri, içerik yükleme, story/video yönetimi, satış raporları, takipçi analizi, mağaza görünüm ayarları, soru-cevap yönetimi ve bildirimler gibi alanlar vardır; ama “sadece kendi mağazası yönetilir” ilkesi geçerlidir.

Bu nedenle:

fenomen yönetim sistemi = adminin yönettiği üst kontrol sistemi
fenomen paneli = fenomenin kendi mağazasını yönettiği self-service alan

Bu iki katman karıştırılmamalıdır.

18. Veri ve karar kayıtları

Fenomen yönetim sistemindeki her kritik karar kayıt altına alınmalıdır.

Minimum kayıt alanları:

karar tipi
kararı veren admin rolü
karar tarihi
fenomen ID
önceki durum
yeni durum
gerekçe
varsa ek not
varsa bitiş tarihi
varsa inceleme tekrar tarihi

Örnek kararlar:

başvuru onayı
başvuru reddi
revizyona gönderme
kategori yetkisi verme
kategori kapatma
rozet verme
rozet geri alma
görünürlük kısıtı
geçici askı
kalıcı kapatma
19. Ana kurallar

Fenomen yönetim sistemi için sabitlenmesi gereken temel kurallar şunlardır:

fenomen mağaza herkese açık bir hak değildir
başvuru ve platform onayı zorunludur
takipçi sayısı tek başına yeterli değildir
kategori yetkisini yalnız platform verir
fenomen bağımsız satıcı değildir
fenomen stok, kargo, ödeme ve sipariş operasyon owner’ı değildir
fenomen mağaza davranışı platform kurallarıyla sınırlıdır
gerekirse uyarı, kısıt, görünürlük azaltma ve askı uygulanabilir
rozet ve görünür statüler platform kontrolündedir
mağaza puanı ve kalite sinyalleri yönetimsel değerlendirmeye girdi olabilir
admin sistemi başvuru ve yaşam döngüsü üzerinde merkezi otoritedir
tüm kritik kararlar audit log üretmelidir
panel direct write yapmamalıdır

20. Nihai kısa özet

Fenomen yönetim sistemi, fenomen adayının başvurudan başlayarak onay, kategori yetkisi, aktif mağaza yaşam döngüsü, kalite ve ihlal takibi, rozet/statü yönetimi, görünürlük kısıtı ve askıya alma gibi süreçlerini taşıyan; fenomen mağaza vitriniyle karıştırılmaması gereken; admin sistemi altında çalışan; fakat panel direct write yerine kurallı yönetim aksiyonlarıyla ilerleyen merkezi fenomen yaşam döngüsü ve denetim sistemidir.