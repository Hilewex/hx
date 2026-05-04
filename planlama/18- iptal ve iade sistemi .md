İPTAL / İADE SİSTEMİ
1. Sistem tanımı

İptal / iade sistemi, oluşturulmuş sipariş veya sipariş satırlarının belirli koşullar altında kullanıcı talebi, operasyonel zorunluluk veya sistemsel problem nedeniyle durdurulması, geri alınması, geri gönderilmesi ve buna bağlı ticari, lojistik, finansal ve görünürlük etkilerinin yönetildiği satış sonrası işlem sistemidir.

Bu sistemin görevi yalnız “ürünü geri al” demek değildir.
Aynı zamanda:

siparişin iptal edilebilir olup olmadığını belirlemek,
teslim edilmiş ürün için iade uygunluğunu değerlendirmek,
satır bazlı işlem yapabilmek,
finansal geri dönüşü ödeme sistemiyle uyumlu yürütmek,
teslimat sonrası açılmış yorum/story/doğrulanmış satın alım etkilerini güncellemek,
kullanıcıyı destek ve operasyon tarafıyla kontrollü biçimde buluşturmaktır.

Kısa tanım:

İptal / iade sistemi, sipariş sonrası geri alma ve geri dönüş süreçlerinin ticari, operasyonel ve görünürlük etkilerini yöneten satış sonrası kontrol sistemidir.

2. Sistemin ana amacı

İptal / iade sistemi şu görevleri yerine getirmelidir:

iptal talebini doğru aşamada işlemek
teslim edilmiş ürünler için iade talebini kurallı biçimde yönetmek
satır bazlı işlem yapabilmek
kullanıcıyı belirsizlikte bırakmamak
sipariş, teslimat ve ödeme sistemleriyle tutarlı çalışmak
yorum, puan ve kullanıcı story gibi sosyal kanıt etkilerini doğru güncellemek
destek hattını gereksiz yere kaosa çevirmeden kontrollü çözüm üretmek
3. Sistemin ana karakteri

İptal / iade sistemi şu karaktere sahip olmalıdır:

kurallı
statü bazlı
satır bazlı çalışabilen
dürüst
merkezi
operasyonla uyumlu
finansal etkisi kontrollü
güven sinyallerine duyarlı

Net kural:

İptal ve iade aynı şey değildir.

İptal = teslimat öncesi veya fulfillment öncesi sipariş/satırın durdurulması
İade = teslim edilmiş ürünün geri dönüş süreci

Bu ayrım net olmazsa sistem dağılır.

4. Sistemin platform içindeki rolü

Akış sırası şöyledir:

sipariş oluşur
kargo / teslimat ilerler
teslimat olur
kullanıcı teslimat sonrası yorum / story hakkı kazanabilir
iptal / iade sistemi gerekiyorsa bu ticari sonucu geri çevirir veya kısmen değiştirir
finansal ve görünürlük etkileri yansıtılır

Bu yüzden iptal / iade sistemi:

sipariş değildir
ödeme değildir
teslimat değildir
destek değildir

Ama hepsiyle bağlantılıdır.

5. İptal ile iadenin ayrımı
5.1 İptal

Sipariş veya satır henüz teslim edilmeden önce işlemin durdurulmasıdır.

Örnek:

kullanıcı vazgeçti
ürün sevk edilmedi
stok problemi çıktı
tedarikçi hazırlayamadı
operasyonel hata oluştu
5.2 İade

Ürün teslim edildikten sonra geri dönüş sürecidir.

Örnek:

kullanıcı ürünü beğenmedi
ürün hatalı geldi
eksik/parçalı geldi
yanlış ürün geldi
kalite sorunu var

Net kural:
İptal teslimat öncesi, iade teslimat sonrası eksen olmalıdır.

6. Operasyon sahipliği
6.1 Platform

Nihai ticari ve operasyonel otoritedir. Karar ve kural sistemi platformda çalışır.

6.2 Kullanıcı

İptal veya iade talebini başlatan taraftır.

6.3 Tedarikçi

Operasyonel etkisi olabilir; özellikle fulfillment ve ürün geri kabul tarafında rol alabilir.

6.4 Fenomen mağaza

Bağımsız iade/iptal kuralı yazamaz; operasyon ve kural seti platform merkezlidir. Bu, fenomen mağazanın bağımsız satış şartı yazamaması ve bağımsız sipariş/ödeme hattı kuramamasıyla uyumludur.

Net kural:
İade ve iptal politikası mağaza bazlı keyfi değil, platform kurallı olmalıdır.

7. Sistem tek parça değildir

Bu sistem 4 ana parçadan oluşmalıdır:

7.1 İptal sistemi

Teslimat öncesi durdurma akışı

7.2 İade sistemi

Teslimat sonrası geri dönüş akışı

7.3 Finansal geri dönüş sistemi

Refund / kısmi refund etkisi

7.4 Görünürlük ve hak etkisi sistemi

Yorum, puan, doğrulanmış satın alım, kullanıcı story görünürlüğü gibi alanlara etki

Bu son parça özellikle zorunludur; çünkü dosyalarda iade sonrası yorumun ve puan etkisinin değişeceği açıkça tanımlanmıştır.

8. Temel nesneler

En az şu nesneler bulunmalıdır:

8.1 Cancellation request

İptal talebi

8.2 Return request

İade talebi

8.3 Return item

İade edilen sipariş satırı/ürün

8.4 Refund record

Finansal geri ödeme kaydı

8.5 Post-delivery entitlement impact

Teslimat sonrası hak etkisi kaydı

Bu son nesne şunu tutmalıdır:

yorum hakkı etkisi
doğrulanmış satın alım etiketi etkisi
puan etkisi
kullanıcı story görünürlüğü etkisi
anonimleştirme gereği
9. İptal uygunluğu

İptal her zaman açık olmamalıdır.

İptal için doğru yaklaşım:

fulfillment öncesi daha geniş uygunluk
sevkiyat başladıysa kısıtlı uygunluk
teslim edildiyse iptal değil iade akışı

Temel kural:

created / confirmed / preparing aşamalarında iptal daha mümkün
shipped / in_transit / delivered aşamalarında iptal ya kapanır ya istisnaya düşer

Net kural:
Teslim edilen ürün artık iptal değil, iade rejimine girer.

10. İade uygunluğu

İade için temel eşik şudur:

ürün teslim edilmiş olmalı
ilgili sipariş satırı iade uygun durumda olmalı
sistem veya kural buna izin vermeli

Bu, kullanıcı tarafında teslimat sonrası açılan aksiyonlarla da uyumludur; iade başlat ancak uygun teslim edilen satırlarda görünmelidir.

11. Satır bazlı çalışma zorunluluğu

Bu sistem sipariş bazlı değil, satır bazlı çalışabilmelidir.

Sebep:

siparişte birden fazla ürün olabilir
yalnız bir kısmı teslim edilmiş olabilir
yalnız bir kısmı problemli olabilir
yalnız bir satır iade edilmek istenebilir

Bu yüzden doğru model:

sipariş genel görünümde tek nesne olabilir
ama iptal/iade kararları satır bazında işlenebilmelidir
12. Kısmi iptal / kısmi iade

Kısmi işlem bu sistemin merkezinde olmalıdır.

12.1 Kısmi iptal

Siparişte bazı satırlar iptal edilir, diğerleri devam eder.

12.2 Kısmi iade

Teslim edilmiş satırların yalnız bir kısmı veya belirli satırlar iade edilir.

Bu model:

çok ürünlü siparişle uyumludur
çok paketli teslimatla uyumludur
kullanıcıya gereksiz tam sipariş bozumu yaşatmaz
13. State yapısı

Profesyonel ama sade state yapısı şöyle olabilir:

İptal için
requested
approved
rejected
cancelled
partial_cancelled
İade için
requested
approved
rejected
awaiting_return
received
refunded
partial_refunded
closed

İlk faz için sade çekirdek:

requested
approved
rejected
completed

Ama arka planda daha ayrıntılı operasyon state’i tutulması daha doğru olur.

14. İptal akışı

Doğru akış şöyledir:

14.1 Kullanıcı iptal talebi başlatır

Uygun satır veya sipariş seçilir

14.2 Sistem uygunluğu kontrol eder

Statü, fulfillment durumu, teslimat aşaması

14.3 Talep onaylanır veya reddedilir

Gerekirse operasyon/devreye girer

14.4 Onaylanırsa sipariş/satır durumu güncellenir

İptal etkisi siparişe işlenir

14.5 Finansal geri etki gerekiyorsa refund hattı çalışır

Ödeme sistemine bağ kurulur

15. İade akışı

Doğru akış şöyledir:

15.1 Kullanıcı iade talebi başlatır

Yalnız uygun teslim edilmiş satırlarda

15.2 Sebep seçilir / açıklama alınır

İlk fazda sade tutulabilir

15.3 Sistem uygunluğu kontrol eder

Teslimat doğrulandı mı, satır uygun mu

15.4 Talep incelenir / onaylanır / reddedilir

Operasyonel karar gerekir

15.5 Ürün geri dönüş operasyonu yürür

Gerekli lojistik/inceleme süreci

15.6 Finansal refund çalışır

Kısmi veya tam

15.7 Görünürlük etkileri uygulanır

Puan, doğrulanmış satın alım, yorum meta etkisi vb.

16. Ödeme ile ilişki

İptal / iade sistemi finansal karar motoru değildir; ama finansal etki üretir.

Ne yapar
refund ihtiyacını oluşturur
refund miktarını bağlar
işlem sonucunu görünür kılar
Ne yapmaz
orijinal ödeme akışının yerini almaz
yeni ödeme state machine’i kurmaz

Net kural:
Refund, payment sistemine bağlı finansal alt etkidir; iptal/iade sistemi bunu tetikler ama tek başına ödeme sistemi olmaz.

17. Sipariş ile ilişki

İptal / iade sistemi siparişi yok etmez; siparişin sonucunu değiştirir.

Doğru mantık:

order varlığını korur
satır veya sipariş durumu değişir
kısmi iptal/iade görünür olur
sipariş geçmişi silinmez

Bu çok önemlidir.
Çünkü kullanıcı ticari geçmişini kaybetmemelidir.

18. Teslimat ile ilişki

Teslimat sistemi, iade için eşik belirler.

teslim edilmemiş ürün → iptal ekseni
teslim edilmiş ürün → iade ekseni
kısmi teslimatta yalnız teslim edilen satırlar iade eksenine girer

Bu model, teslimat sonrası hakların ürün bazlı açılmasıyla da tam uyumludur.

19. Yorum sistemi ile ilişki

Bu çok kritik alan.

Dosya kararı nettir:

ürün iade edilirse yorum kalabilir
ama yorum puanı iptal edilir
“satın alındı / doğrulanmış satın alım” etiketi düşer
gerekiyorsa kullanıcı adı anonimleşebilir

Buna göre doğru model:

19.1 Yorum fiziksel olarak silinmek zorunda değildir

Çünkü deneyim içerik değeri taşıyabilir

19.2 Ama güven meta verisi değişir
verified purchase kalkar
rating etkisi ürün puanından düşer
19.3 Gerekirse anonimleştirme uygulanabilir

Özellikle uyuşmazlık veya politika gereği

Net kural:
İade, yorumu otomatik yok etmek zorunda değildir; ama güven ve puan etkisini değiştirmelidir.

20. Puan sistemi ile ilişki

Yorumla birlikte verilen yıldız puanı ürün ortalamasını oluşturur.

İade sonrası doğru yaklaşım:

puan metni yorum içinde geçmiş olarak kalabilir
ama ürün puanı hesaplamasındaki etkisi kaldırılır
doğrulanmış satın alım bağı kırılır

Bu, ürün güven sinyalini dürüst tutar.

21. Kullanıcı ürün story sistemi ile ilişki

İade sonrası kullanıcı ürün story’si için sabit kural şudur:

teslimat sonrası yüklenmiş kullanıcı story’si otomatik silinmez,
ancak doğrulanmış satın alım / teslim alındı temelli güven etiketi düşebilir,
görünürlük meta verisi güncellenebilir,
ağır uyuşmazlık, sahte kullanım, kötü niyet veya politika ihlalinde moderasyon kaldırma/pasifleştirme uygulayabilir.

Net kural:

İade, kullanıcı story’sini otomatik yok etmez;
ama güven meta verisini ve görünürlük durumunu etkileyebilir.

22. Moderasyon ile ilişki

İptal / iade sistemi ile moderasyon doğrudan birleşmemeli, ama temas etmelidir.

Özellikle:

kullanıcı iade sonrası haksız içerik ürettiyse
yorum/story ile sahte güven sinyali sürdürülüyorsa
uyuşmazlık varsa

moderasyon destekleyici devre olabilir.

23. Kullanıcı yüzü

Kullanıcı tarafında görünmesi gerekenler:

hangi sipariş/satır için talep açıldığı
talep türü: iptal mi iade mi
mevcut talep durumu
finansal iade özeti
destek veya ek adım gerekiyorsa bunun görünürlüğü
satır bazlı etki:
iptal edildi
iade talebi alındı
iade tamamlandı
refund yapıldı

Ayrıca teslim edilmiş uygun satırlarda:

yorum yap
story yükle
iade başlat

gibi aksiyonlar ayrı ayrı görünmelidir; bunlar aynı anda var olabilir.

24. Mobil öncelikli tasarım

Mobilde iptal / iade yüzeyi sade olmalıdır.

Öncelik:

talep türü
etkilenen ürün satırı
mevcut durum
varsa refund özeti
destek / takip adımı

Mobilde gereksiz uzun politika metni yerine:

kısa açıklama
net durum rozeti
sonraki adım
mantığı tercih edilmelidir.
25. Performans kuralları

İptal / iade sistemi performanslı olmalıdır.

25.1 Uygun satırlar hızlı tespit edilmeli
25.2 Talep oluşturma akışı ağır olmamalı
25.3 Sipariş ekranı gereksiz yeniden yüklenmemeli
25.4 Görünürlük etkileri gecikmeden yansıtılmalı
25.5 Refund durumu kontrollü ve izlenebilir olmalı
26. Ana kurallar

İptal / iade sistemi için temel kurallar şunlardır:

iptal ve iade aynı şey değildir
iptal teslimat öncesi eksen olmalıdır
iade teslimat sonrası eksen olmalıdır
sistem satır bazlı çalışabilmelidir
kısmi iptal ve kısmi iade desteklenmelidir
refund etkisi payment sistemiyle bağlı çalışmalıdır
sipariş geçmişi silinmemelidir
iade sonrası yorum kalabilir
iade sonrası yorum puan etkisi kaldırılmalıdır
iade sonrası verified purchase etiketi düşmelidir
gerekirse anonimleştirme uygulanabilir
kullanıcı story’si için otomatik silme zorunlu değildir; ama meta/görünürlük etkisi yönetilmelidir
teslimat sonrası haklar ve iade etkileri birbiriyle çakışmamalıdır
27. Nihai kısa özet

İptal / iade sistemi, sipariş veya sipariş satırlarının teslimat öncesi durdurulması ya da teslimat sonrası geri dönüşünün kurallı biçimde yönetildiği; finansal refund etkisini payment sistemine bağlayan; ve özellikle yorum, puan, doğrulanmış satın alım etiketi ve kullanıcı story görünürlüğü gibi teslimat sonrası güven sinyallerine etkisini kontrollü biçimde yöneten satış sonrası işlem sistemidir.

28. Bu aşamada hazır kararlar / burada netleştirdiğimiz kararlar
Mevcut sistemlerden gelen hazır kararlar
yorum hakkı teslim edilmiş ürüne bağlıdır
kullanıcı ürün story hakkı teslim edilmiş ürüne bağlıdır
iade sonrası yorum kalabilir ama puanı iptal edilir
iade sonrası verified purchase etiketi düşer
gerekirse kullanıcı adı anonimleşebilir
teslim edilen uygun satırlarda iade başlat aksiyonu düşünülebilir
Burada netleştirdiğimiz yeni çerçeve
iptal ve iade kesin biçimde ayrılmalıdır
sistem sipariş bazlı değil, satır bazlı çalışabilmelidir
kısmi iptal / kısmi iade zorunlu desteklenmelidir
iade sonrası yorum otomatik silinmez; puan ve güven etiketi etkilenir
kullanıcı story’si için doğrudan dosya kararı olmadığı için en güvenli model: otomatik silme yok, meta/görünürlük etkisi var
refund etkisi payment’e bağlı alt süreç olarak düşünülmelidir
teslimat sonrası açılan haklar ile iade etkileri çakışmadan yönetilmelidir