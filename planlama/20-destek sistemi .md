DESTEK SİSTEMİ
1. Sistem tanımı

Destek sistemi, kullanıcıların platformla ilgili resmi sorun, talep, itiraz ve yardım ihtiyaçlarını tek merkezden iletebildiği; sipariş, ödeme, teslimat, iade, iptal, hesap, teknik sorun ve şikayet gibi süreçlerin kontrollü biçimde yönetildiği resmi müşteri hizmetleri sistemidir.

Bu sistemin görevi yalnız mesaj almak değildir.
Aynı zamanda:

kullanıcıyı doğru destek başlığına yönlendirmek,
gereksiz serbest mesaj yükünü azaltmak,
resmi süreçleri sosyal mesajlaşmadan ayırmak,
hızlı self-service yönlendirme vermek,
gerekirse ticket ve insan destek hattına taşımaktır.

Kısa tanım:

Destek sistemi, platformun resmi müşteri hizmetleri ve sorun çözüm merkezidir.

2. Sistemin ana amacı

Destek sistemi şu görevleri yerine getirmelidir:

kullanıcının her sayfadan hızlı destek erişimi almasını sağlamak
resmi işlem süreçlerini tek merkezde toplamak
kullanıcıyı doğru konu başlığına yönlendirmek
gereksiz canlı chat yükünü azaltmak
çözümü mümkünse anında yönlendirmeyle sunmak
gerekirse ticket açmak
gerekirse canlı insan desteğine taşımak
sipariş, iade, teslimat ve ödeme gibi kritik konuları sosyal mesajlardan ayırmak
3. Sistemin ana karakteri

Destek sistemi şu karaktere sahip olmalıdır:

resmi
merkezi
yönlendirici
kolay erişilebilir
kontrollü
mobil öncelikli
hızlı
gürültü üretmeyen

Net kural:

Destek sistemi “her sayfada erişilebilir” olmalı, ama “her sayfada serbest canlı sohbet” olmamalıdır.

Doğru model:

her sayfada destek cebi
önce konu seçimi
sonra yönlendirme / çözüm
çözülmezse ticket / canlı destek
4. Destek sistemi ile sosyal mesajlaşma ayrımı

Bu sistemin en kritik kuralı budur.

4.1 Destek sistemi ayrıdır

Kullanıcı sistemi dosyasında açık kural:

destek sistemi mesajlaşma sisteminden tamamen ayrıdır
iptal, iade, şikayet ve destek talepleri tek destek merkezindedir
kullanıcı resmi sipariş ve destek süreçlerini fenomen mağaza mesaj kutusundan yürütmez
4.2 Fenomen mesaj kutusu ayrı alandır

Fenomen mağaza kullanıcıyla deneyim/görüş paylaşabilir; resmi destek otoritesi değildir. Ayrıca risk olarak “destek ile sosyal etkileşimin karışması” açıkça belirtilmiştir.

Net kural:
Fenomen mağaza mesaj kutusu = sosyal/ilişkisel iletişim
Destek sistemi = resmi süreç ve müşteri hizmetleri

5. Destek sistemi erişim modeli

Senin önerdiğin modelin doğru profesyonel versiyonu şu olmalıdır:

5.1 Tüm sayfalarda destek cebi
masaüstünde sabit köşe butonu
mobilde sabit destek butonu / destek cebi
tüm ana sayfalarda erişilebilir
ekranı boğmayacak ama görünür olacak
5.2 Destek cebi her sayfada aynı mantıkla açılır

Ama içerik bağlama göre zenginleşebilir.

Örnek:

PDP’de ürün sorunu başlığı öne çıkabilir
sipariş detayında sipariş / teslimat / iade başlıkları öne çıkabilir
checkout/ödeme ekranında ödeme / teknik sorun başlığı öne çıkabilir

Net kural:
giriş noktası ortak, içerik bağlamsal olabilir.

6. Destek cebi doğrudan serbest chat ile açılmamalıdır

Bu, sistemin en önemli mimari kararıdır.

Yanlış model:

butona bas
boş metin alanı aç
herkes her şeyi yazsın

Doğru model:

başlık seçimi
alt konu seçimi
mümkünse hazır yönlendirme / self-service
çözülmezse ticket
gerekirse canlı destek

Bu model hem platform açısından hem operasyon açısından daha sağlıklıdır.

7. Destek sisteminin ana yapısı

Bu sistem 4 katmanlı çalışmalıdır:

7.1 Giriş katmanı

Her sayfada sabit destek cebi

7.2 Konu seçimi katmanı

Kullanıcı neden geldiğini seçer

7.3 Çözüm / yönlendirme katmanı

Hazır çözüm, ilgili sayfaya yönlendirme veya mini yardım

7.4 Destek talebi katmanı

Sorun çözülmediyse resmi ticket / destek chat / insan desteği

8. Destek cebi ana başlıkları

Başlıklar hem yeterli genişlikte hem de gereksiz şişmeden seçilmelidir.

Önerilen ana başlıklar:

Siparişim
Kargo / Teslimat
İade / İptal
Ödeme
Hesap / Giriş
Ürün Sorunu
Teknik Sorun
Fenomen Mağaza ile İlgili Konu
Şikayet / Güvenlik
Diğer

Bu yapı, mevcut sistem ağacınızla uyumludur ve destek taleplerini resmi merkezde toplar. Özellikle iptal, iade ve şikayet tek merkez altında olmalıdır.

9. Başlıkların alt kırılımları

Her ana başlık doğrudan serbest mesaja düşmemeli; önce alt konu seçilmelidir.

9.1 Siparişim
Siparişim görünmüyor
Sipariş durumunu öğrenmek istiyorum
Siparişimde sorun var
Eksik / yanlış ürün geldi
Siparişimi değiştirmek istiyorum
9.2 Kargo / Teslimat
Kargom nerede
Teslimat gecikti
Teslim edildi görünüyor ama almadım
Paket hasarlı geldi
Teslimat sorunu yaşadım
9.3 İade / İptal
İade başlatmak istiyorum
İade durumunu öğrenmek istiyorum
Siparişi iptal etmek istiyorum
İade reddedildi / sorun var
9.4 Ödeme
Ödeme alınamadı
Kart / banka sorunu
Ödeme yaptım ama sipariş görünmüyor
Çift çekim / yanlış tutar
9.5 Hesap / Giriş
Giriş yapamıyorum
Şifre / doğrulama sorunu
Hesabım kısıtlandı
Bildirim / hesap ayarı sorunu
9.6 Ürün Sorunu
Ürün açıklamasıyla uyuşmuyor
Hatalı / kusurlu ürün
Yanlış varyant geldi
Ürün beklendiği gibi değil
9.7 Teknik Sorun
Sayfa açılmıyor
Sepet çalışmıyor
Checkout / ödeme ekranı hatası
Uygulama / site donuyor
9.8 Fenomen Mağaza ile İlgili Konu
Mağaza hakkında şikayet
İçerik / davranış sorunu
Mağaza bilgisiyle ilgili problem
9.9 Şikayet / Güvenlik
Şüpheli işlem
Uygunsuz içerik
Taciz / rahatsızlık
Hesap güvenliği sorunu
10. Destek sistemi üç modlu çalışmalıdır

Bu kısım çok önemlidir.

10.1 Self-service

Kullanıcı konu seçince sistem önce kısa çözüm veya doğru sayfaya yönlendirme sunar.

Örnek:

“Kargom nerede” → sipariş takip sayfasına git
“İade başlatmak istiyorum” → uygun satır için iade akışına git
“Yorum hakkım neden açılmadı” → teslimat statüsü açıklaması
10.2 Ticket / resmi destek talebi

Sorun çözülemezse ticket açılır.

10.3 Canlı destek / insan müdahalesi

Yalnız gerekli durumlarda açılır:

ödeme belirsizliği
sipariş var / ödeme yok gibi kritik durumlar
teslim edildi görünüyor ama kullanıcı almadı
güvenlik / dolandırıcılık şüphesi
ağır teknik problem

Net kural:
Canlı insan chat ilk katman değil, son katman olmalıdır.

11. Her sayfada destek cebinin var olması doğru mu

Evet, bu karar doğrudur.
Ama kontrollü tasarlanmalıdır.

Doğru tarafı
güven verir
terk oranını azaltır
mobilde çok değerlidir
kullanıcıyı çıkmazda bırakmaz
Yanlış uygulanırsa riski
her şey canlı chat’e döner
operasyon yükü patlar
fenomen mesajlaşmasıyla çakışır
destek spam’e dönüşür

Bu yüzden:
“Her sayfada erişim” doğru, “her sayfada serbest canlı müşteri temsilcisi” yanlış başlangıç modelidir.

12. Destek sistemi ile mevcut sistemlerin ilişkisi
12.1 Sipariş sistemi

Siparişle ilgili sorunlar destekten yürür
ama sipariş detayını destek sistemi sahiplenmez

12.2 Kargo / teslimat sistemi

Teslimat sorunu destekten açılabilir
ama takip altyapısı ayrı kalır

12.3 İade / iptal sistemi

İade ve iptal resmi süreçtir; destek merkezi altında ele alınır.

12.4 Ödeme sistemi

Ödeme belirsizlikleri kritik destek konusudur

12.5 Teknik sistemler

Checkout, sepet, giriş gibi teknik sorunlar destek içinde ayrı kategori olmalıdır

12.6 Fenomen mağaza sistemi

Fenomen mesajları sosyal alandır
destek resmi alandır
ikisi karışmaz.

13. Destek sistemi aktörleri

Bu sistemde ana aktörler şunlardır:

13.1 Kullanıcı

Destek talebini açan taraftır

13.2 Platform destek ekibi

Resmi çözüm otoritesidir

13.3 Operasyon ekibi

Sipariş, teslimat, iade gibi durumlarda destekle bağlantılı çalışır

13.4 Teknik ekip

Teknik hata kategorilerinde arka çözüm üretir

13.5 Fenomen mağaza

Resmi destek otoritesi değildir
yalnız bazı konularda destek sistemine bağlı bilgi kaynağı olabilir

13.6 Tedarikçi

Lojistik ve ürün probleminde iç operasyon tarafında rol alabilir
ama kullanıcıyla doğrudan destek chat’inde konuşan taraf olmamalıdır

14. Destek sistemi ticket mantığı

Ticket sistemi mutlaka olmalıdır.

Her talepte en az şu alanlar olmalıdır:

talep başlığı
alt konu
ilgili sipariş / ürün / mağaza / ödeme referansı
kullanıcı mesajı
durum
öncelik
son güncelleme zamanı

Destek sistemi yalnız “anlık chat” olarak kurulursa izlenebilirlik düşer.
Bu yüzden ticket omurgası şarttır.

15. Ticket durumları

Profesyonel ama sade durum seti şu olabilir:

açıldı
inceleniyor
kullanıcıdan bilgi bekleniyor
çözüldü
kapatıldı
üst ekibe aktarıldı

Bu sayede hem kullanıcı hem ekip aynı dili konuşur.

16. Destek sistemi ile mesajlaşma sistemi sınırı

Bu sınır bir kez daha net yazılmalıdır:

fenomen mağaza mesaj kutusu = sosyal / hafif iletişim
platform destek sistemi = resmi süreçler
sipariş, iade, iptal, şikayet, ödeme, teslimat sorunu = destek sistemi
deneyim paylaşımı, hafif mağaza iletişimi = mesajlaşma alanı

Bu ayrım mevcut kullanıcı sistemi kuralıyla birebir uyumludur.

17. Destekte canlı chat ne zaman devreye girmeli

Canlı destek her konuda açılmamalıdır.

Doğru kullanım alanları:

ödeme belirsizliği
sipariş kayboldu / oluşmadı
teslimat problemi
iade sürecinde istisna
güvenlik / şüpheli işlem
ağır teknik problem
kullanıcı çok kritik akışta takıldı

Yanlış kullanım:

her basit soru
her ürün bilgisi
her mağaza etkileşimi
her hafif memnuniyetsizlik
18. Destekte otomatik yönlendirme örnekleri

Bu sistemde ciddi fayda sağlar.

Örnek:

“Kargom nerede?” → sipariş takip sayfasını aç
“Yorum yapamıyorum” → ürün teslim edilip edilmediğini göster
“Story yükleyemiyorum” → teslimat + login + ürün etiketi kuralını açıkla
“İade istiyorum” → uygun sipariş satırına git
“Ödeme yaptım ama sipariş yok” → kritik destek akışına yükselt

Bu model hem kod yükünü dengeler hem operasyonu rahatlatır.

19. Destek cebinin bağlamsal davranışı

Her sayfada aynı giriş olabilir ama içerik bağlama göre değişebilir.

PDP’de
ürün sorunu
teslimat sonrası yorum/story soruları
mağaza ile ilgili resmi şikayet
Sepette
sepete ekleme sorunu
fiyat farklılığı
teknik sorun
Checkout / ödeme ekranında
ödeme
teknik sorun
sipariş oluşmadı
Sipariş detayında
teslimat
iade / iptal
eksik / yanlış ürün
destek talebi

Bu yaklaşım çok doğrudur.

20. Mobil görünüm

Mobilde destek sistemi daha da önemli olmalıdır.

Kurallar:

sabit destek butonu
ekranı tamamen kapatmayan ama net açılan destek cebi
konu seçimi kolay
tek elle kullanılabilir yapı
önce başlık, sonra alt başlık, sonra çözüm
gerekli yerde ticket / canlı destek

Mobilde doğrudan uzun serbest metin alanı ile başlamak yanlış olur.

21. Performans ve kodlama açısından değerlendirme

Bu model kodlama açısından doğrudur çünkü:

önce widget + konu seçimi ile başlanabilir
sonra yönlendirme katmanı eklenir
sonra ticket sistemi eklenir
en son gerçek zamanlı canlı chat gerekiyorsa açılır

Bu sıralama:

daha düşük ilk maliyet
daha temiz mimari
daha az operasyon riski
daha iyi mobil performans
sağlar

Yanlış başlangıç modeli:

her sayfada tam canlı chat
temsilci bağlantısı
serbest yazı
gerçek zamanlı her şey

Bu hem operasyon hem mimari açısından gereksiz erken yük üretir.

22. Destekte bulunması gereken ana kurallar
destek sistemi her sayfadan erişilebilir olmalı
mobilde de sabit ve görünür olmalı
destek sistemi mesajlaşma sisteminden ayrı olmalı
destek tek merkez altında çalışmalı
önce başlık seçimi olmalı
sonra alt konu seçimi olmalı
mümkünse önce self-service yönlendirme çalışmalı
çözülmezse ticket açılmalı
gerekirse canlı destek devreye girmeli
fenomen mağaza mesaj kutusu resmi destek yerine geçmemeli
sipariş, iade, ödeme, teslimat sorunları resmi destekten yürümeli
23. Kayda girecek kısa ana özet

Destek sistemi, platformun tüm sayfalarında ve mobil görünümde sabit destek cebi ile erişilebilen; ancak doğrudan serbest canlı chat ile başlamayan; önce konu seçimi, sonra alt konu seçimi, ardından self-service yönlendirme, ticket ve gerekirse canlı insan desteği katmanlarıyla çalışan resmi müşteri hizmetleri sistemidir.

24. Nihai kısa liste

Kayıt için en kısa liste:

Destek sistemi her sayfada erişilebilir sabit destek cebi ile çalışır
Mobilde de sabit destek butonu bulunur
Destek sistemi mesajlaşma sisteminden tamamen ayrıdır
İptal, iade, şikayet ve destek talepleri tek merkezde toplanır
Fenomen mağaza mesaj kutusu resmi destek alanı değildir
Destek cebi doğrudan serbest chat açmaz
Önce ana başlık seçimi yapılır
Sonra alt konu seçimi yapılır
Mümkünse self-service yönlendirme verilir
Çözülmezse ticket açılır
Gerekirse canlı destek devreye girer
Ana başlıklar: Siparişim, Kargo/Teslimat, İade/İptal, Ödeme, Hesap/Giriş, Ürün Sorunu, Teknik Sorun, Fenomen Mağaza ile İlgili Konu, Şikayet/Güvenlik, Diğer
Checkout/ödeme/sipariş gibi kritik sayfalarda bağlamsal destek başlıkları öne çıkar
Canlı destek ilk katman değil, son katman olmalıdır
Sistem hem kullanıcı güvenini artırmalı hem operasyon yükünü patlatmamalıdır