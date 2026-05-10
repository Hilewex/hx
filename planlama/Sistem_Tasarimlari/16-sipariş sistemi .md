SİPARİŞ SİSTEMİ
1. Sistem tanımı

Sipariş sistemi, başarılı ödeme sonrası ticari işlemi resmi satış kaydına dönüştüren, siparişin yaşam döngüsünü yöneten, paketleme-sevkiyat-teslimat-iade gibi sonraki operasyonların ana referans nesnesini oluşturan merkezi ticari kayıt sistemidir.

Bu sistemin görevi yalnız “sipariş oluştu” demek değildir.
Aynı zamanda:

ödeme sonucu sonrası resmi ticari kaydı oluşturmak,
sipariş satırlarını ve paket yapısını kurmak,
kullanıcıya sipariş görünürlüğü vermek,
tedarikçi/operasyon hattına iş düşürmek,
sipariş statülerini yönetmek,
teslimat ve satış sonrası süreçlerin ana omurgasını taşımaktır.

Kısa tanım:

Sipariş sistemi, başarılı finansal işlemi resmi ticari satış kaydına çeviren yaşam döngüsü sistemidir.

2. Sistemin ana amacı

Sipariş sistemi şu görevleri yerine getirmelidir:

başarılı ödeme sonrası sipariş kaydını oluşturmak
siparişi kullanıcı açısından görünür hale getirmek
sipariş satırlarını, mağaza bağlamını ve paket yapısını korumak
fulfillment hattını başlatmak
sipariş statülerini yönetmek
iptal, iade, teslimat ve destek süreçlerinin referans nesnesi olmak
kullanıcı ile operasyon arasında tek doğru sipariş gerçeğini tutmak
3. Sistemin ana karakteri

Sipariş sistemi şu karaktere sahip olmalıdır:

merkezi
kesin
izlenebilir
idempotent
operasyonel
dürüst
statü bazlı
kayıt odaklı

Net kural:

Sipariş sistemi vitrin yüzeyi değildir.
Sipariş, ticari gerçek ve operasyon omurgasıdır.

4. Sipariş sisteminin platform içindeki rolü

Akış sırası nettir:

sepet ürünleri toplar
checkout doğrular
ödeme finansal sonucu üretir
sipariş resmi ticari kaydı oluşturur
kargo / teslimat / iade / destek bunun üstüne oturur

Yani sipariş sistemi:

sepet değildir
checkout değildir
ödeme değildir
kargo da değildir

Ama hepsiyle bağlantılıdır.

5. Siparişi kim oluşturur

Siparişi kullanıcı manuel olarak “yaratmaz”; sistem oluşturur.

5.1 Kullanıcı

Sipariş talebinin sahibi ve alıcısıdır.

5.2 Platform

Siparişin resmi oluşturucu otoritesidir.

5.3 Fenomen mağaza

Sipariş operasyonunun sahibi değildir; bağımsız sipariş hattı kuramaz.

5.4 Tedarikçi

Siparişi fulfillment açısından işler; hazırlama ve gönderme tarafında rol alır.

Net kural:
Sipariş gerçeği platformdadır.

6. Sipariş ne zaman oluşur

Bu en kritik kurallardan biridir.

Sipariş, başarılı ödeme sonrası oluşur.

Yani:

checkout tamamlandı = sipariş oluştu demek değildir
ödeme başlatıldı = sipariş oluştu demek değildir
ödeme başarılı = sipariş oluşturma hakkı doğdu demektir
sipariş sisteminin kendisi resmi kaydı yaratır

Bu ayrım korunmalıdır.

7. Siparişin ana girdileri

Sipariş sistemi doğrudan PDP’den veya sepetten beslenmez.

Doğru kaynaklar:

checkout’un doğrulanmış sipariş hazırlığı
payment’in başarılı finansal sonucu

Yani sipariş oluşurken en az şu kaynaklar gerekir:

checkout referansı
payment referansı
kullanıcı kimliği
satır listesi
doğrulanmış fiyat snapshot’ı
teslimat/adres bilgisi
mağaza/paket ayrışma bilgisi

Net kural:
Sipariş, niyet verisinden değil doğrulanmış ve ödenmiş veriden oluşur.

8. Siparişin ana veri yapısı

Sipariş nesnesi en az şu alanları taşımalıdır:

sipariş kimliği
kullanıcı kimliği
checkout referansı
payment referansı
sipariş numarası
oluşturulma zamanı
toplam tutar
para birimi
adres özeti
sipariş statüsü
ödeme statü özeti
paket sayısı / fulfillment yapısı

Sipariş satırı ise en az şu alanları taşımalıdır:

ürün kimliği
ürün adı snapshot’ı
mağaza bağlamı
seçilen varyant
adet
satır fiyatı
satır toplamı
fulfillment/paket referansı
satır statüsü

Burada ana ilke:
Sipariş, snapshot tabanlı çalışmalıdır.
Ürün sonradan değişse bile sipariş kendi anlık gerçeğini korumalıdır.

9. Siparişte mağaza bağlamı

Platform mağaza bağlamlı commerce çalıştığı için siparişte de mağaza bağlamı korunmalıdır.

Kullanıcı şunu anlayabilmelidir:

bu ürünü hangi mağaza bağlamında aldı
siparişte hangi mağazaya ait satırlar var
hangi satırlar hangi fulfillment hattına gidiyor

Ama kullanıcı yüzünde bu, operasyonu zorlaştıran dağınık bir görüntüye dönüşmemelidir.

Doğru model:

tek sipariş görünümü olabilir
ama satır ve paketlerde mağaza bağlamı korunur
10. Çok mağazalı sipariş mantığı

Bu platformda çok mağazalı yapı mümkündür.
Bu nedenle sipariş sistemi şu mantığı desteklemelidir:

kullanıcı tek sipariş deneyimi yaşayabilir
iç tarafta sipariş birden fazla pakete ayrılabilir
gerekirse farklı tedarikçi/mağaza satırları ayrı fulfillment hattına düşebilir

Bu, siparişin tek ticari nesne, çok paketli operasyon nesnesi olabilmesini sağlar.

11. Sipariş state yapısı

Profesyonel ama sade bir sipariş state omurgası şu olabilir:

created
confirmed
preparing
shipped
delivered
cancelled
partially_cancelled
returned
partially_returned
completed

İlk faz için sade çekirdek:

created
confirmed
preparing
shipped
delivered
cancelled

Ek satır bazlı durumlar sonra genişleyebilir.

Net kural:
Sipariş state’i, ödeme state’inden ayrıdır.

Örnek:

payment = succeeded
order = created / confirmed

İkisi aynı şey değildir.

12. Sipariş oluşturma akışı

Doğru akış şöyledir:

12.1 Payment success alınır

Finansal başarı kesinleşir

12.2 Order creation attempt başlar

Sipariş sistemi idempotent şekilde oluşturmayı dener

12.3 Sipariş snapshot’ı kurulur

Satırlar, fiyatlar, adres, mağaza bağlamı sabitlenir

12.4 Paket/fulfillment hazırlığı yapılır

İç operasyon hattı için yapı kurulmaya başlanır

12.5 Kullanıcıya sipariş görünür hale gelir

Sipariş numarası ve temel özet oluşur

12.6 Sonraki sistemler devreye girer

Kargo, takip, bildirim, destek, iptal/iade

13. Idempotency kuralı

Bu sistemde ikinci kritik kural budur:

Aynı ödeme sonucu iki sipariş üretmemelidir.

Bu nedenle sipariş sistemi:

payment reference bazlı idempotent çalışmalı
retry durumunda ikinci sipariş oluşturmamalı
“oluştu mu oluşmadı mı” belirsizliğinde tekrar güvenli davranabilmeli

Net kural:

tek ödeme başarısı
tek sipariş kaydı
14. Sipariş ile fulfillment sınırı

Sipariş sistemi fulfillment hattını başlatır ama fulfillment’in tamamı değildir.

Sipariş sistemi ne yapar
siparişi oluşturur
satırları ve paketleri tanımlar
operasyon için işi açar
statü omurgasını taşır
Sipariş sistemi ne yapmaz
doğrudan kargo teslim etmez
son mil takibini tek başına yönetmez
iade incelemesini tek başına yapmaz

Yani sipariş:
ana ticari kayıt
fulfillment:
operasyonun yürütülmesi

15. Sipariş ile kargo sınırı

Kargo sistemi sonra ayrıca netleşecek ama sınır şimdiden nettir.

Sipariş sistemi:

hangi satırların gönderileceğini bilir
hangi pakete bağlı olduğunu bilir
gönderime hazır statüsünü taşır

Kargo sistemi:

sevkiyat hareketini
takip numarasını
taşıyıcı entegrasyonunu
teslimat olaylarını yönetir

Sipariş sistemi kargonun yerini almaz.

16. Sipariş ile iptal/iade sınırı

Sipariş sistemi bu süreçlerin ana referans nesnesidir ama karar motoru değildir.

Sipariş sistemi
hangi satırların siparişe ait olduğunu tutar
mevcut statüyü gösterir
iptal/iade etkisini görünür kılar
İptal / iade sistemi
uygunluk değerlendirir
süreci yürütür
sonucu siparişe işler
17. Sipariş ile destek sınırı

Destek sistemi sipariş üzerinde çalışabilir ama sipariş sistemine dönüşmez.

Doğru ilişki:

sipariş referansı
sipariş durumu
sorun kaydı
destek ticket bağı

Bu kadar.

18. Sipariş görünümü: kullanıcı yüzü

Kullanıcı tarafında sipariş sistemi en az şu yüzeyleri desteklemelidir:

sipariş oluşturuldu ekranı
sipariş detay sayfası
sipariş listesi / geçmişi
sipariş satırları
teslimat/paket özeti
ödeme özeti
durum göstergesi

Kullanıcı şunu açıkça anlayabilmelidir:

ne aldı
ne zaman aldı
hangi durumda
teslimat ne aşamada
sorun varsa nereye gidecek
19. Sipariş oluşturuldu ekranı

Ödeme sonrası kullanıcıya temiz bir onay yüzeyi verilmelidir.

Bulunmalıdır:

sipariş alındı mesajı
sipariş numarası
temel sipariş özeti
teslimat/adres özeti
sipariş detayına git
ana sayfaya dön
gerekirse destek / bildirim bilgisi

Net kural:
Bu ekran “ödeme sonucu” ile “sipariş sonucu”nu karıştırmamalıdır.
Doğru mesaj:

ödemeniz alındı
siparişiniz oluşturuldu

Bu ikisi arka planda ayrı adımlar olsa da kullanıcıya net sonuca bağlanmış görünmelidir.

20. Sipariş başarısız oluşturma senaryosu

Bu en kritik edge-case’lerden biridir:

Ödeme başarılı ama sipariş oluşamadıysa ne olacak?

Profesyonel sistemde şu gerekir:

reconciliation / recovery hattı
payment reference ile sipariş oluşumu yeniden denenebilir
kullanıcı “ödeme gitti ama sipariş yok” boşluğunda bırakılmaz
destek ve operasyon tarafında izlenebilir kayıt oluşur

Net kural:
Bu senaryo özel olarak tasarlanmalıdır.

21. Tedarikçi ve sipariş ilişkisi

Havuz sisteminde sipariş düştüğünde tedarikçi ürünü hazırlar ve gönderir.

Bu yüzden sipariş sistemi:

ilgili fulfillment satırlarını doğru tarafa düşürmeli
tedarikçiye yalnız gerekli operasyon bilgisini vermeli
kullanıcı ve finansal gizliliği gereksiz taşımamalı
siparişi fulfillment işine dönüştürmelidir
22. Siparişte snapshot ilkesi

Sipariş oluşturulduktan sonra şu alanlar geçmişin gerçeği olarak korunmalıdır:

ürün adı snapshot’ı
seçilen varyant snapshot’ı
satır fiyatı snapshot’ı
mağaza bağlamı snapshot’ı
teslimat adresi snapshot’ı
ödeme özeti snapshot’ı

Sebep:
ürün sonradan değişebilir, mağaza düzeni değişebilir, fiyat güncellenebilir.
Ama siparişin ticari geçmişi değişmemelidir.

23. Siparişte görünmemesi gerekenler

Sipariş detay ekranı şu alanlarla gereksiz şişirilmemelidir:

canlı keşfet blokları
yoğun mağaza postları
story akışı
sosyal yorum duvarı
ağır öneri sistemleri

Sipariş ekranı bilgi ve işlem yüzeyidir.

24. Siparişte bulunabilecek sınırlı yardımcı alanlar

Kontrollü biçimde şunlar olabilir:

aynı mağazaya dön
ürünü tekrar satın al
destek al
iade / iptal başlat
takip detayına git
faturayı görüntüle

Ama ana karakter yine sipariş görünürlüğü olmalıdır.

25. Mobil öncelikli sipariş tasarımı

Mobilde sipariş alanı çok net kurulmalıdır.

Kurallar:

sipariş numarası görünür olmalı
durum rozeti net olmalı
satırlar hızlı taranmalı
paket ve takip özeti sade olmalı
destek / iade / takip aksiyonları kolay erişilmeli
gereksiz metin kalabalığı olmamalı

Mobilde öncelik:

durum
sipariş özeti
satırlar
takip / destek / iade aksiyonları
26. Performans kuralları

Sipariş sistemi performanslı olmalıdır.

26.1 Sipariş oluşturma idempotent ve hızlı olmalı
26.2 Kullanıcı sipariş ekranı hızlı açılmalı
26.3 Sipariş satırları hafif yüklenmeli
26.4 Paket/takip verisi kontrollü getirilmeli
26.5 Ağır sosyal içerik eklenmemeli
26.6 Statü güncellemeleri tutarlı olmalı

Sipariş ekranı operasyonel bilgi ekranıdır; ağır medya vitrini değildir.

27. Ana kurallar

Sipariş sistemi için temel kurallar şunlardır:

sipariş yalnız başarılı ödeme sonrası oluşur
sipariş gerçeği platformdadır
fenomen bağımsız sipariş hattı kuramaz
aynı ödeme sonucu iki sipariş üretmemelidir
sipariş snapshot tabanlı çalışmalıdır
mağaza bağlamı korunmalıdır
çok mağazalı sipariş tek kullanıcı deneyimi içinde taşınabilir
sipariş ve fulfillment aynı şey değildir
sipariş ve kargo aynı şey değildir
sipariş ve iade/iptal aynı şey değildir
kullanıcı yüzünde net, sade ve izlenebilir olmalıdır
mobilde durum ve aksiyon öncelikli olmalıdır
28. Nihai kısa özet

Sipariş sistemi, başarılı ödeme sonrası ticari işlemi resmi satış kaydına dönüştüren; satır, mağaza bağlamı, fiyat ve adres snapshot’larını sabitleyen; fulfillment hattını başlatan; kullanıcıya sipariş görünürlüğü veren ve teslimat, iptal, iade, destek gibi sonraki süreçlerin ana referans nesnesi olan merkezi ticari kayıt sistemidir.

29. Bu aşamada hazır kararlar / burada netleştirdiğimiz kararlar
Mevcut sistemlerden gelen hazır kararlar
sipariş ticari çekirdeğin ana modüllerindendir
fenomen bağımsız sipariş hattı kuramaz
tedarikçi sipariş düştüğünde ürünü hazırlar ve gönderir
ödeme ve sipariş aynı lifecycle değildir
Burada netleştirdiğimiz yeni çerçeve
sipariş yalnız başarılı ödeme sonrası oluşur
sipariş checkout ve payment’ten ayrı, merkezi ticari kayıt nesnesidir
sipariş snapshot tabanlı çalışmalıdır
sipariş tek kullanıcı deneyimi, çok paketli operasyon yapısını desteklemelidir
payment success sonrası order creation idempotent olmalıdır
payment success but order missing senaryosu özel recovery gerektirir
sipariş, fulfillment ve kargo ile bağlı ama onlardan ayrı sistemdir