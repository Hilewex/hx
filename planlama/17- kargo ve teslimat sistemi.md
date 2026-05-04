KARGO / TESLİMAT SİSTEMİ
1. Sistem tanımı

Kargo / teslimat sistemi, oluşturulmuş siparişin operasyonel olarak hazırlanması, paketlenmesi, sevk edilmesi, taşınması ve teslim edilmesi sürecini yöneten; aynı zamanda teslimat sonucunu platform içindeki diğer hak ve yüzeylere yansıtan operasyon sistemidir.

Bu sistemin görevi yalnız kargo bilgisi göstermek değildir.
Aynı zamanda:

siparişi fulfillment işine çevirmek,
paket yapısını yönetmek,
taşıma sürecini görünür kılmak,
teslimat durumunu netleştirmek,
gecikme ve problem durumlarını işaretlemek,
teslim edildi statüsüyle kullanıcı haklarını açmak,
sipariş sonrası süreçlerin ilk kapısını oluşturmak

zorundadır.

Kısa tanım:

Kargo / teslimat sistemi, siparişi fiziksel teslimata dönüştüren ve teslimat sonucunu kullanıcı haklarına bağlayan operasyon sistemidir.

2. Sistemin ana amacı

Kargo / teslimat sistemi şu görevleri yerine getirmelidir:

sipariş satırlarını gönderime hazırlamak
paketleme mantığını kurmak
sevkiyat hareketini takip etmek
kullanıcıya siparişinin nerede olduğunu göstermek
gecikme ve problem durumlarını dürüst biçimde yansıtmak
teslim edildi anını resmi ve güvenilir biçimde belirlemek
teslimat sonrası açılacak hakları tetiklemek
destek, iade ve yorum/story gibi sonraki süreçlere doğru veri aktarmak
3. Sistemin ana karakteri

Kargo / teslimat sistemi şu karaktere sahip olmalıdır:

operasyonel
izlenebilir
dürüst
statü bazlı
kullanıcı açısından net
mağaza/tedarikçi karmaşasını gizleyen
teslimat kanıtı odaklı
hak tetikleyici

Net kural:

Teslimat sistemi yalnız lojistik görünürlük sistemi değildir.
Aynı zamanda platform içinde yorum ve kullanıcı ürün story’si gibi teslimat sonrası hakları açan eşik sistemidir. Çünkü kullanıcı tarafında hem yorum hem story hakkı teslim edilmiş ürüne bağlı tanımlanmıştır.

4. Sistemin platform içindeki rolü

Akış sırası nettir:

ödeme başarılı olur
sipariş oluşur
sipariş fulfillment hattına düşer
kargo / teslimat sistemi gönderimi yönetir
teslimat tamamlanır
teslimat sonrası haklar açılır
iade / destek / yorum / story gibi süreçler devreye girer

Bu yüzden kargo / teslimat sistemi:

sipariş değildir
takip ekranı tek başına değildir
iade sistemi değildir
destek sistemi değildir

Ama hepsine veri sağlar.

5. Operasyon sahipliği

Bu sistemde sahiplik çok nettir:

5.1 Platform

Operasyonun merkezi yöneticisidir. Fenomen mağaza bağımsız kargolama veya sipariş hattı kuramaz; operasyon platformda kalır.

5.2 Tedarikçi

Sipariş düştüğünde ürünü hazırlar ve gönderir. Havuz sisteminde bu görev açık biçimde tanımlanmıştır.

5.3 Fenomen mağaza

Teslimat operasyonunun sahibi değildir. Mağaza sosyal ve ticari vitrin tarafıdır; kargolama/teslimat omurgası onun alanı değildir.

5.4 Kullanıcı

Alıcı ve teslimat sonucu üzerinden hak kazanan taraftır.

Net kural:
Teslimat gerçeği merkezi platform operasyonundadır.

6. Kargo / teslimat sisteminin ana parçaları

Bu sistem 5 ana bölümden oluşmalıdır:

6.1 Fulfillment hazırlığı

Siparişin gönderime hazır hale gelmesi

6.2 Paketleme sistemi

Siparişin bir veya birden fazla pakete ayrılması

6.3 Sevkiyat sistemi

Paketin taşıyıcıya verilmesi ve hareketlerinin izlenmesi

6.4 Teslimat doğrulama sistemi

Paketin gerçekten teslim edildiğinin belirlenmesi

6.5 Teslimat sonrası hak tetikleme sistemi

Teslim edilen satırlar için yorum ve kullanıcı story hakkının açılması

Bu son parça özellikle zorunludur; çünkü teslim edilmiş sipariş statüsü kullanıcı haklarını açan eşiktir.

7. Teslimat sisteminde temel nesneler

En az şu nesneler bulunmalıdır:

7.1 Shipment / Gönderi

Taşıma sürecindeki sevkiyat nesnesi

7.2 Package / Paket

Siparişin fiziksel paketlenmiş operasyon birimi

7.3 Delivery status / Teslimat durumu

Paket veya satırın hangi teslimat aşamasında olduğunu belirten durum

7.4 Delivery entitlement / Teslimat sonrası hak kaydı

Teslim edilen ürün için yorum ve story hakkı açılıp açılmadığını tutan iç kayıt

Bu son nesne kullanıcı haklarını lojistik durumdan kontrollü biçimde ayırmak için gerekir.

8. Çok paketli yapı

Sipariş tek olabilir ama operasyon çok paketli olabilir.
Bu yüzden kargo sistemi şu mantığı desteklemelidir:

tek sipariş
birden fazla paket
paket bazlı teslimat durumu
satır bazlı teslimat etkisi

Bu önemli. Çünkü:

kullanıcı yorum ve story hakkını tüm sipariş teslim edilmeden de, teslim edilen ilgili ürün bazında kazanabilir biçimde tasarlamak daha doğru olur

Sebep:
Kullanıcı yorum ve story hakkı “ürün” ve “teslim edilmiş sipariş statüsü” bağında tanımlanmış. Bunu siparişin tamamına kilitlemek yerine, ürün satırı teslim edilince ilgili hak açılmalıdır. Bu yorum, kullanıcı ve PDP kurallarıyla daha uyumludur.

9. Teslimat durumları

Profesyonel ama sade state omurgası şu olabilir:

awaiting_fulfillment
preparing
ready_to_ship
shipped
in_transit
out_for_delivery
delivered
delivery_failed
returned_to_sender
lost veya operasyonel problem durumu

İlk faz için çekirdek minimum:

preparing
shipped
in_transit
delivered
delivery_failed

Net kural:
Teslimat state’i sipariş state’inden ayrıdır.

Örnek:

order = confirmed
shipment = in_transit

Bu ikisi aynı şey değildir.

10. “Teslim edildi” statüsünün anlamı

Bu sistemde en kritik eşik budur.

Teslim edildi, yalnız “paket ulaştı” demek değildir.
Aynı zamanda:

ürün teslim eşiğini geçti
kullanıcıya ilgili ürün için yorum hakkı açılabilir
kullanıcıya ilgili ürün için story hakkı açılabilir
doğrulanmış satın alım sosyal kanıtı üretilebilir

Bunun dosyalardaki dayanağı nettir:

yorum yalnız teslim edilmiş ürün için açılır
kullanıcı story’si yalnız teslim edilmiş ürün için yüklenebilir

Bu yüzden “delivered” statüsü, UGC ve güven sistemlerini tetikleyen resmi kapıdır.

11. Teslimat sonrası açılan haklar
11.1 Yorum hakkı

Kullanıcı yalnız satın aldığı ve teslim edilmiş ürün için yorum yapabilir; yorum hakkı yalnız teslim edilmiş sipariş statüsünde açılır.

11.2 Puanlama hakkı

Yorumla birlikte yıldız puanlama zorunlu çalışır. Ürün puanı bu yıldızlardan oluşur.

11.3 Kullanıcı ürün story hakkı

Kullanıcı giriş yapmış olmalı, ürünü satın almış olmalı ve sipariş teslim edilmiş olmalı; ayrıca ürün etiketli story yüklemelidir. Aynı ürün için maksimum 2 story hakkı vardır.

11.4 Doğrulanmış satın alım güven sinyali

Teslimat, yorumun ve kullanıcı katkısının güvenilir sosyal kanıt katmanına dönüşmesi için temel eşiktir. PDP’de yorum ve kullanıcı ürün story’leri doğrudan güven katmanı olarak konumlanmıştır.

12. Hakların sipariş bazlı mı, ürün bazlı mı açılacağı

Burada en doğru karar şudur:

Haklar sipariş bazlı değil, teslim edilen ürün satırı bazlı açılmalıdır.

Sebep:

yorum kuralı ürün bazlıdır
kullanıcı story hakkı ürün başınadır; aynı ürün için maksimum 2 hak tanımlıdır
PDP’de yorum ve UGC story görünürlüğü ürün bazlıdır, mağaza bağı korunabilse de veri temeli ürün katmanındadır

Bu yüzden:

siparişte 3 ürün varsa
yalnız 1 ürün teslim edildiyse
yalnız o ürün için yorum/story hakkı açılmalıdır

Bu model hem daha adil hem de sistemlerle daha uyumludur.

13. Paket teslimi ve hak tetikleme

Teslimat çok paketli çalışıyorsa hak açma mantığı da buna uyumlu olmalıdır:

paket A teslim edildi
paket B yolda

Bu durumda:

paket A içindeki ilgili ürün satırları için yorum/story hakkı açılır
paket B için açılmaz

Net kural:
Hak tetikleme, “sipariş tamamen kapandı mı?” değil, “ilgili ürün teslim edildi mi?” sorusuna bağlanmalıdır.

14. Teslimat doğrulama

“Teslim edildi” statüsü gevşek verilmemelidir.

Doğru kaynaklar:

taşıyıcı teslim olayı
operasyonel teslim kaydı
gerekirse manuel doğrulama / istisna yönetimi

Çünkü bu statü yalnız kargo görünürlüğünü değil, kullanıcı yorum ve story hakkını da açar. Yanlış teslimat statüsü sosyal kanıt sistemini bozar.

15. Teslimat başarısız olursa

Şu durumlar desteklenmelidir:

adreste bulunamadı
teslim edilemedi
eksik / problemli sevkiyat
kayıp / iade dönüş

Bu durumda:

ilgili ürün için yorum hakkı açılmaz
kullanıcı story hakkı açılmaz
sipariş/satır destek hattına daha yakın görünür
gerekiyorsa yeniden teslim / iptal / iade süreci devreye girer

Bu, teslimatın hak tetikleyici eşik olmasıyla uyumludur.

16. Kısmi teslimat

Kısmi teslimat bu sistemde çok önemlidir.

Doğru yaklaşım:

sipariş genel durumu kısmi teslim olabilir
satır veya paket durumu delivered olabilir
haklar satır bazında açılabilir
kullanıcı siparişin tamamını beklemek zorunda kalmaz

Bu yapı, yorum ve story haklarının ürün bazlı doğasıyla en uyumlu modeldir.

17. Teslimat ile PDP ilişkisi

Teslimat sistemi PDP’yi doğrudan taşımaz ama PDP güven katmanını besler.

Çünkü:

teslim edilen ürünler için yorumlar görünür
teslim edilen ürünler için kullanıcı story’leri PDP’de “sizden gelenler” alanını besler
bu içerikler ürün bazlı sosyal kanıt üretir

Yani:
kargo/teslimat sistemi → PDP güven katmanına veri açan sistemlerden biridir.

18. Teslimat ile kullanıcı story sistemi ilişkisi

Story sisteminde kullanıcı ürün story’si:

satın alınmış,
teslim alınmış,
ürün etiketli,
moderasyon onaylı

UGC içeriğidir.

Bu nedenle teslimat sistemi şunu üretmelidir:

kullanıcı hangi ürün için story hakkı kazandı
her ürün için kaç story hakkı kaldı
teslimat eşiği geçildi mi
iade/iptal sonrası görünürlük etkisi var mı

Bu, story sisteminin kurallı ve suistimal edilmeyen çalışması için gereklidir.

19. Teslimat ile yorum sistemi ilişkisi

Yorum sistemi şu kurala bağlıdır:

yalnız satın alınmış ve teslim edilmiş ürün için yorum
ürün başına tek yorum
yıldız zorunlu
iade olursa yorum kalabilir ama doğrulanmış satın alım etiketi ve puan etkisi değişebilir

Bu yüzden teslimat sistemi yorum sistemine şu bilgileri vermelidir:

teslimat eşiği geçti mi
hangi ürün satırı eligible oldu
iade sonrası doğrulanmış satın alım etiketi düşecek mi
20. Teslimat ile fenomen mağaza bağlamı

Kullanıcı ürün story’leri, ürün fenomen mağazadan alınmışsa ilgili mağaza bağlamında da görünebilir; ama kullanıcı story’leri genel keşfet akışına veya fenomen mağaza tanıtım story akışına karışmaz.

Bu yüzden teslimat sistemi yalnız ürün bazlı hak değil, gerekiyorsa şu bağı da korumalıdır:

ürün hangi mağaza bağlamında satın alındı

Böylece teslimat sonrası açılan kullanıcı story’si doğru mağaza bağlamında da görünür.

21. Teslimat ile takip / keşfet sınırları

Teslimat sonrası açılan story ve yorum hakları:

takip sayfasına düşmez
keşfet genel akışına karışmaz
yalnız kendi bağlamlarında görünür

Bu yüzden teslimat sistemi hak açarken yanlış yüzeylere yayın yapmamalıdır.

22. Kargo tahmini ve nihai teslimat

PDP’de ve ön aşamalarda tahmini teslimat bilgisi olabilir.
Ama kullanıcı hakkı açmak için gereken eşik:

tahmini teslimat değil
gerçek teslimat statüsüdür

Net kural:
UGC ve yorum hakkı tahmine göre değil, gerçek teslimata göre açılır.

23. Kullanıcı yüzü: sipariş takip görünümü

Kullanıcı tarafında görünmesi gerekenler:

sipariş numarası
paket durumu
gönderi durumu
tahmini teslimat
teslim edildi bilgisi
problem / gecikme uyarısı
teslim edilen ürünler için açılan aksiyonlar:
yorum yap
ürün story’si yükle

Bu iki aksiyon ancak uygun ürün satırında görünmelidir. Çünkü teslimat eşiği ürün bazında hak açar.

24. Teslimat sonrası kullanıcı aksiyonları

Teslim edilen ürün satırında şu aksiyonlar tetiklenebilir:

yorum yap
puan ver
ürün story’si yükle
destek al
iade başlat

Teslim edilmemiş satırda bunlar görünmemelidir.

25. Mobil öncelikli tasarım

Mobilde kargo/teslimat yüzeyi sade olmalıdır.

Öncelik sırası:

mevcut durum
tahmini/gerçek teslimat
paket/satır görünümü
teslim edilen satırlarda açılan aksiyonlar
destek / iade

Özellikle mobilde:

“yorum yap”
“story yükle”

aksiyonları yalnız uygun satırda, net rozet mantığıyla görünmelidir.

26. Performans kuralları

Kargo / teslimat sistemi performanslı olmalıdır.

26.1 Takip ekranı hızlı açılmalı
26.2 Paket ve satır durumları hafif yüklenmeli
26.3 Hak tetikleme event’i gecikmemeli
26.4 Teslimat sonrası yorum/story eligibility hızlı yansıtılmalı
26.5 Ağır medya taşınmamalı
26.6 Geçmiş hareketler anlaşılır ama kompakt tutulmalı
27. Ana kurallar

Kargo / teslimat sistemi için temel kurallar şunlardır:

operasyon merkezi platformdadır
tedarikçi hazırlama ve gönderme rolü taşır
fenomen mağaza teslimat sahibi değildir
teslimat state’i sipariş state’inden ayrıdır
teslim edildi statüsü yalnız lojistik değil, hak tetikleyici eşiktir
yorum hakkı yalnız teslim edilmiş ürün için açılır
kullanıcı story hakkı yalnız teslim edilmiş ürün için açılır
haklar sipariş bazlı değil, ürün satırı bazlı açılmalıdır
çok paketli yapıda haklar teslim edilen paket/satıra göre açılmalıdır
tahmini teslimat hak açmaz, gerçek teslimat açar
kullanıcı story’leri ve yorumlar yanlış yüzeylere karışmamalıdır
mağaza bağlamı gerekiyorsa korunmalıdır
28. Nihai kısa özet

Kargo / teslimat sistemi, siparişin paketlenmesi, sevkiyatı ve teslimatını yöneten; teslimat durumunu kullanıcıya görünür kılan; ve özellikle “teslim edildi” eşiğini kullanarak ürün bazında yorum, puanlama ve kullanıcı ürün story’si gibi teslimat sonrası hakları açan merkezi operasyon sistemidir.

29. Bu aşamada hazır kararlar / burada netleştirdiğimiz kararlar
Mevcut sistemlerden gelen hazır kararlar
kullanıcı yalnız teslim edilmiş ürüne yorum yapabilir
kullanıcı story yüklemek için ürün satın alınmış ve teslim edilmiş olmalıdır
giriş yapmış kullanıcı teslim edilmiş ürüne yorum ve story yükleyebilir
kullanıcı ürün story’si PDP’de ve ilgili bağlamlarda güçlü sosyal kanıt alanıdır
kullanıcı story’leri keşfet ve takip genel akışına karışmaz
fenomen bağımsız kargolama/ödeme/sipariş hattı kuramaz; operasyon platformdadır
Burada netleştirdiğimiz yeni çerçeve
teslimat sistemi lojistik + hak tetikleme sistemi olarak ele alınmalıdır
“delivered” statüsü yorum ve story için resmi eşik olmalıdır
haklar sipariş bazlı değil, teslim edilen ürün satırı bazlı açılmalıdır
çok paketli yapıda kısmi teslimat hakları kısmi açmalıdır
teslimat doğrulaması gevşek tutulmamalıdır çünkü UGC güven sistemi buna bağlanır
teslim edilen satırda kullanıcıya “yorum yap” ve “story yükle” aksiyonları açılmalıdır
tahmini teslimat değil, gerçek teslimat bu hakları açmalıdır

####
---
REVİZYON NOTU — 2026-04-19
Durum: Açıklama notu
Etkilediği bölüm(ler): Kargo maliyeti, paket kırılımı, çoklu tedarikçi akışı
Bağlı dosyalar: 13-sepet sistemi, 14-checkout sistemi, 29-merkezi fiyat sistemi

Not:
Bu dosya teslimat operasyonunu taşır; ancak kullanıcıya yansıyan kargo mantığı için aşağıdaki kural sabitlenir:

1. Tek sepet içinde birden fazla tedarikçi / paket olabilir.
2. Kargo toplamı platform tarafından merkezi kuralla hesaplanır.
3. Bedava kargo eşiği veya kargo kampanyası hangi scope’ta çalışıyorsa kullanıcıya açıkça gösterilir:
   - platform geneli
   - tedarikçi bazlı
   - kampanya bazlı
4. Kullanıcı “tek sepet ama çok paket” durumunu sade ve dürüst biçimde görmelidir.
---