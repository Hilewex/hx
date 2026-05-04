SORU-CEVAP SİSTEMİ
1. Sistem tanımı

Soru-cevap sistemi, kullanıcının bir ürün hakkında resmi bilgi sorusu sorabildiği; bu soruların ürün bazlı olarak PDP içinde toplandığı; aynı ürün hangi mağaza bağlamında açılırsa açılsın ortak soru havuzunda göründüğü; cevap otoritesinin yalnız platform olduğu kontrollü ürün bilgi sistemidir. Sistem ağacında bu başlık, PDP güven katmanının önemli parçası olarak ayrı netleştirilmesi gereken sistemlerden biri olarak tanımlanır.

2. Sistemin ana amacı

Soru-cevap sisteminin ana amacı şudur:

ürün hakkında resmi bilgi ihtiyacını tek yerde toplamak,
kullanıcıyı mağaza mesajı veya destek kanalına yanlış yönlendirmemek,
ürün bilgi otoritesini net biçimde platformda tutmak,
PDP güven katmanını yorumlardan ayrı bir bilgi katmanıyla güçlendirmek,
aynı ürün için ortak bilgi birikimi oluşturmaktır.
PDP dosyası bu alanı “ürün bilgi alanı” olarak tanımlar; fenomen mağaza sistemi dosyası da resmi ürün sorularının mesaj kutusunda değil PDP içindeki soru-cevap alanında toplanacağını ve cevap otoritesinin yalnız platform olduğunu açıkça söyler.
3. Temel ilke

Bu sistemin temel ilkesi şudur:

Soru ürün bazlıdır.
Nihai yayın otoritesi platformdur.

Bu ilke şu anlama gelir:

soruyu sadece kullanıcı sorar
soru ürün bazlı kaydedilir
aynı ürün hangi mağazada açılırsa açılsın aynı sorular görünür
nihai görünür resmi cevap platform onayıyla yayınlanır
fenomen mağaza soru-cevap aktörü değildir

Ek açıklama:
teknik bilgi üretimi gerektiğinde tedarikçi taslak cevap önerebilir; ancak doğrudan yayınlayamaz.
4. Sistemin platform içindeki rolü

Akış içinde soru-cevap sisteminin rolü şöyledir:

kullanıcı PDP’de ürünü inceler,
ürün hakkında resmi bilgi ihtiyacı doğarsa soru sorar,
soru moderasyon / onay hattına düşer,
uygun bulunursa yayınlanır,
platform cevap verdiğinde soru ve cevap birlikte görünür,
bu içerik aynı ürünün tüm mağaza bağlamlı PDP’lerinde ortak görünür.

Bu nedenle soru-cevap sistemi:

yorum sistemi değildir,
mesaj sistemi değildir,
destek sistemi değildir,
ama PDP içindeki resmi bilgi katmanıdır.
5. Kim soru sorabilir

Soru sorabilmek için en az şu koşullar gerekir:

kullanıcı giriş yapmış olmalı,
PDP üzerinde ürün bağlamında olmalı.

Misafir kullanıcı PDP’yi görebilir ama katkı ve etkileşim tarafında sınırlıdır. Moderasyon sistemi dosyası da soru sistemi için “kullanıcı giriş yapmış olmalıdır” der.

6. Kim cevap verebilir

Nihai görünür resmi cevap owner’ı platformdur.

Doğru model:

platform / admin cevabı doğrudan yayınlayabilir
tedarikçi teknik ve ürünsel bilgi alanlarında taslak cevap önerebilir
bu taslak cevap platform onayı olmadan PDP’de görünmez
fenomen mağaza cevap aktörü değildir
kullanıcılar cevap aktörü değildir

Net kural:
yayın owner’ı platformda kalır.
Bilgi katkısı kontrollü biçimde tedarikçiden gelebilir.

6A. Tedarikçi taslak cevap modeli

Ölçeklenebilir ürün bilgi akışı için sistem aşağıdaki yapıyı destekleyebilir:

tedarikçi kendi ürününe gelen teknik sorular için taslak cevap girer
taslak cevap inceleme kuyruğuna düşer
platform / admin tek tıkla onaylar, revize eder veya reddeder
onaylanan cevap resmi görünürlük kazanır

Gösterim dili örnek olarak şu şeffaf formatlardan biriyle çalışabilir:

Platform Onaylı
Tedarikçi Bilgisi / Platform Onaylı

Bu model bilgi üretimini ölçekler; ama resmi otoriteyi dağıtmaz.
7. Fenomen mağaza neden cevap aktörü değildir

Fenomen mağaza:

deneyim,
stil önerisi,
kişisel görüş,
seçim gerekçesi
paylaşabilir; ama resmi ürün cevabı vermez. Fenomen mağaza sistemi dosyası bu ayrımı çok sert biçimde çizer: mesaj alanı sosyal iletişimdir, resmi ürün soru-cevap alanı değildir. Böylece:
ürün bilgi otoritesi tek elde kalır,
yanlış/çelişkili ürün bilgisi riski azalır,
fenomen ile platform rolü karışmaz.
8. Soru bağlamı

Soru tamamen ürün bazlı olmalıdır. Bu şu anlama gelir:

aynı ürün hangi mağazada açılırsa açılsın aynı soru havuzu görünür,
soru mağaza bazlı ayrışmaz,
soru PDP içinde ürün bilgi alanı olarak yaşar,
mağaza bağlamı yalnız PDP’nin sosyal/ticari katmanında kalır.

PDP veri ayrımı dosyasında da “sorular ve cevaplar” ürün bazlı ortak alanlar arasında sayılır.

9. Soru-cevap ile yorum farkı

Yorum sistemi deneyim ve güven alanıdır; soru-cevap sistemi ürün bilgi alanıdır. Bu ayrım korunmalıdır:

yorum = teslimat sonrası deneyim katkısı
soru = satın alma öncesi veya sonrası resmi bilgi ihtiyacı
yorumlara cevap verilmez
soruya platform cevabı verilir

PDP dosyası bu iki katmanı ayrı başlıklar altında kurar.

10. Soru-cevap ile mesaj farkı

Mesaj sistemi fenomen ile kullanıcı arasındaki sosyal iletişim alanıdır. Soru-cevap ise resmi ürün bilgi alanıdır. Bu ayrım çok sert korunmalıdır:

stil önerisi, kişisel görüş, deneyim paylaşımı → mesaj
resmi ürün bilgisi → PDP soru-cevap
sipariş, iade, ödeme, kargo gibi resmi süreçler → destek

Fenomen mağaza sistemi dosyası bunu doğrudan söyler.

11. Soru-cevap ile destek farkı

Destek sistemi resmi müşteri hizmetleri alanıdır; ama ürün bilgi sistemi değildir. Bu nedenle:

“bu ürün hangi materyal?”, “kalıbı nasıldır?”, “içeriği nedir?” gibi ürün bilgi soruları soru-cevap alanına gider,
sipariş, ödeme, teslimat, iptal, iade gibi sorunlar destek sistemine gider.

Bu ayrım hem destek sistemi hem fenomen mağaza sistemi ile uyumludur.

12. Moderasyon modeli

Soru-cevap sistemi ilk fazda manuel onaylı çalışmalıdır. Moderasyon sistemi bunu açıkça sabitler:

kullanıcı soruyu gönderir,
soru yayın öncesi incelemeye düşer,
uygunsa yayınlanır,
platform cevap verir,
kaynak etiketi açık görünür.

Net kural olarak da “soru-cevap alanı ilk fazda manuel onaylı kalmalıdır” denir.

13. Neden manuel onaylı başlamalı

Bunun nedeni üçlüdür:

görünür güven katmanı olması,
uygunsuz / spam içerik riski taşıması,
cevap otoritesinin platformda olması nedeniyle kapasite ve kalite kontrol ihtiyacı.

PDP dosyasında da “soruları sadece admin cevaplayacağı için zamanla cevap yükü büyüyebilir” riski açıkça yazılmıştır. Bu nedenle ilk fazda kontrollü, manuel onaylı model doğrudur.

14. Soru akışı

Doğru akış şöyle olmalıdır:

kullanıcı PDP’de soru sorar
soru ürün kimliği ile kaydedilir
yayın öncesi inceleme kuyruğuna düşer
uygunsa görünür hale gelir
platform cevap verir
soru ve cevap birlikte PDP’de görünür
en son soru-cevaplar üstte sıralanır

Bu akış moderasyon dosyası ve PDP dosyasındaki kuralları birleştirir.

15. Görünürlük modeli

Soru ve cevap görünür olduğunda:

aynı ürünün tüm mağaza bağlamlı PDP’lerinde görünür,
ürün bilgi havuzuna katkı yapar,
tek mağaza özel içerik gibi davranmaz.

Bu, mağaza bağlamlı PDP ile ürün bazlı ortak veri modeli ayrımının önemli parçasıdır. PDP dosyası bu alanın backend tarafında temiz ayrılması gerektiğini de risk olarak not eder.

16. Sıralama mantığı

PDP dosyasında açıkça “en son soru-cevaplar üstte görünür” denir. İlk faz için bu yeterli ve doğrudur. İleride faydalı/öne çıkan soru katmanı düşünülebilir; ama mevcut karar setinde kronolojik görünüm ana modeldir.

17. Kaynak etiketi

Cevap verildiğinde kaynak etiketi açık görünmelidir. Moderasyon sistemi dosyası bunu doğrudan yazar. Bu çok önemli bir güven kararıdır; kullanıcı cevabın fenomen görüşü değil platform cevabı olduğunu net görmelidir.

18. Mini PDP ve kartlarda bulunmaması

Soru-cevap sistemi yalnız PDP’de yaşamalıdır. Videolu ürün kart sistemi açıkça:

mini PDP’de soru-cevap bulunmaz,
klasik kartta soru-cevap bulunmaz
der. Böylece soru sistemi kart ve ara yüzeylere sarkmaz; derin karar alanı PDP’de kalır.
19. Ana riskler

Soru-cevap sistemindeki ana riskler şunlardır:

spam / uygunsuz soru üretimi
fenomenin yanlışlıkla cevap aktörü gibi algılanması
aynı ürün için dağınık mağaza bazlı bilgi oluşması
platform cevap kapasitesinin zamanla zorlanması
mağaza bağlamlı PDP ile ürün bazlı ortak veri modelinin teknik olarak karışması

Bu risklerin büyük bölümü dosyalarda doğrudan işaretlenmiştir.

20. Ana kurallar

Soru-cevap sistemi için sabitlenmesi gereken temel kurallar şunlardır:

soru-cevap alanı yalnız PDP’dedir
kullanıcı giriş yapmışsa soru sorabilir
misafir kullanıcı soru soramaz
soru ürün bazlı kaydedilir
aynı ürün hangi mağazada açılırsa açılsın aynı sorular görünür
cevap otoritesi yalnız platform / admindir
fenomen mağaza soru-cevap aktörü değildir
mesaj alanı resmi ürün soru-cevap alanı değildir
soru sistemi ilk fazda manuel onaylıdır
soru yayın öncesi incelemeye düşer
uygunsa yayınlanır
platform cevap verdiğinde soru ve cevap birlikte görünür
kaynak etiketi açık görünür
en son soru-cevaplar üstte görünür
soru sistemi yorum ve destek sisteminden ayrı tutulur.
21. Nihai kısa özet

Soru-cevap sistemi, yalnız PDP içinde çalışan; giriş yapmış kullanıcının ürün bazlı soru sorabildiği; aynı ürün hangi mağaza bağlamında açılırsa açılsın ortak soru havuzunda görünen; cevap otoritesinin yalnız platform olduğu; ilk fazda manuel onaylı yürüyen; soru ve cevabı birlikte göstererek PDP’nin resmi ürün bilgi katmanını

######
---
REVİZYON NOTU — 2026-04-19
Durum: Kanonik override
Etkilediği bölüm(ler): Kim cevap verebilir, cevap üretim akışı, kaynak etiketi
Bağlı dosyalar: 43-tedarikçi panel sistemi, 40-admin sistemi, 22-moderasyon sistemi

Not:
Bu dosyadaki “cevap otoritesi yalnız platformdur” ilkesi içerik yayın otoritesi açısından korunur; ancak cevap üretim akışı aşağıdaki şekilde genişletilir:

1. PDP’de yayınlanan nihai resmi cevap otoritesi yine platformdur.
2. Fenomen mağaza cevap aktörü değildir; bu kural korunur.
3. Tedarikçi, ürünle ilgili teknik ve operasyonel bilgi alanlarında taslak cevap önerebilir.
4. Tedarikçi tarafından girilen cevap doğrudan yayınlanmaz.
5. Bu taslak cevap platform / admin onayından geçerse PDP’de yayınlanır.
6. Yayınlanan cevap, kullanıcıya açık kaynak etiketi ile gösterilir.
7. Etiket dili örnek olarak “Platform Onaylı”, “Tedarikçi Bilgisi / Platform Onaylı” veya benzeri güvenli şeffaf formatta olabilir.
8. Böylece bilgi üretimi ölçeklenir; fakat resmi yayın otoritesi dağılmaz.

Net sonuç:
Cevap yayın owner’ı platformda kalır.
Taslak bilgi katkısı kontrollü biçimde tedarikçiden gelebilir.
Fenomen mağaza yine resmi cevap aktörü değildir.
---