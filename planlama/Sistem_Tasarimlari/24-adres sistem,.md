ADRES SİSTEMİ
1. Sistem tanımı

Adres sistemi, kullanıcının siparişini nereye teslim alacağını belirleyen; checkout, ödeme, sipariş, teslimat, iade ve destek süreçlerine doğrulanmış teslimat bilgisini sağlayan temel operasyon verisi sistemidir. Bu sistem yalnız form doldurma alanı değildir; aynı zamanda teslimat uygunluğu, sipariş doğruluğu ve operasyonel yönlendirme nesnesidir. Platform sistem ağacında da adres sistemi, checkout ve sipariş operasyonunun temel verisi olarak ayrı netleştirilmesi gereken başlıklardan biri olarak tanımlanmıştır.

2. Sistemin ana amacı

Adres sisteminin ana amacı şudur:

kullanıcının kayıtlı teslimat adreslerini yönetmek,
checkout sırasında doğru adres seçimini sağlamak,
teslimat uygunluğunu kontrol etmek,
siparişe adres özeti taşımak,
kargo/teslimat sürecine operasyonel yön vermek,
iade, destek ve fatura gibi sonraki süreçlerde referans adres bilgisini korumaktır.

Checkout dosyasında adres, checkout’un ana bölümlerinden biri olarak tanımlanır; ödeme dosyasında da ödeme aşamasına geçebilmek için adresin tamamlanmış olması açık koşuldur. Sipariş sistemi de sipariş oluşurken “teslimat/adres bilgisi” ve sipariş nesnesinde “adres özeti” taşınmasını zorunlu kılar.

3. Sistemin platform içindeki rolü

Akış sırası içinde adres sisteminin rolü nettir:

sepet ürün niyetini taşır,
checkout adresi toplar ve doğrular,
ödeme doğrulanmış checkout bağlamını alır,
sipariş adres özetini resmi kayda çevirir,
teslimat sistemi fiziksel gönderimi bu bilgi üzerinden yönetir,
destek ve iade süreçleri gerektiğinde ilgili sipariş adres bağlamını kullanır.

Bu nedenle adres sistemi:

sepet değildir,
checkout’un içine gömülmüş basit alan değildir,
teslimat sistemiyle aynı şey değildir,
ama hepsi için temel veri katmanıdır.
4. Kimler kullanır

4.1 Giriş yapmış normal kullanıcı: Adres ekler, seçer, düzenler, varsayılan belirler ve checkout’ta kullanır.
*REVİZYON NOTU: Bu dosyadaki eski kural, kanonik guest checkout kararıyla güncellenmiştir.*

4.2 Misafir kullanıcı: Adres sisteminin kalıcı hesap adresi kullanıcısı değildir, ancak checkout içinde tek seferlik (one-time) teslimat adresi sağlayabilir. Sipariş oluştuğunda bu guest address, sipariş adres snapshot'ına dönüşür. Adres sisteminin kalıcı hesap adresi mantığı ile guest checkout adres mantığı ayrı katmanlardır. Teslimat uygunluğu kontrolü guest address için de eksiksiz yapılır.
4.3 Platform: Adres doğrulama kurallarını, teslimat uygunluğunu ve siparişe taşınacak kanonik alan setini yönetir.
4.4 Tedarikçi / teslimat operasyonu: Adresin sahibi değildir; sipariş ve fulfillment hattında adres özetini kullanır. Operasyon merkezi platformda kalır.
4.5 Fenomen mağaza: Adres sistemiyle doğrudan ilişkili yetkili taraf değildir; teslimat operasyonunu da sahiplenmez.

5. Temel ilke

Adres sistemi için temel ilke şudur:

Adres gerçeği kullanıcı hesabında yönetilir; sipariş oluştuğunda ise siparişe bir “adres snapshot/özet” taşınır.

Bu ayrım kritik önemdedir. Çünkü kullanıcı daha sonra kayıtlı adresini değiştirse bile geçmiş siparişin operasyon ve denetim gerçeği bozulmamalıdır. Sipariş sistemi dosyasında sipariş nesnesinde “adres özeti” alanının bulunması zaten bu mantığı destekler.

6. Adres sistemi tek parça değildir

Bu sistem en az dört bölümden oluşmalıdır:

6.1 Kayıtlı adres defteri
Kullanıcının hesap altında tuttuğu adresler.

6.2 Checkout adres seçimi
Kayıtlı adresten seçim veya yeni adres ekleme akışı.

6.3 Teslimat uygunluğu kontrolü
Seçilen adresin ilgili sipariş ve teslimat şartları için uygun olup olmadığının kontrolü.

6.4 Sipariş adres özeti üretimi
Başarılı checkout sonrası siparişe sabitlenen snapshot.

Checkout dosyasındaki “kayıtlı adres seçimi / yeni adres ekleme / varsayılan adres kullanma / teslimat uygunluğu kontrolü” alanları bu omurgayı doğrudan destekliyor.

7. Kayıtlı adres mantığı

Giriş yapmış kullanıcı birden fazla adres tutabilmelidir. Bu yapı, checkout’ta tekrar form doldurma yükünü azaltır ve sipariş deneyimini hızlandırır. En az şu davranışlar desteklenmelidir:

yeni adres ekleme
mevcut adresi düzenleme
adres silme veya pasifleştirme
varsayılan adres belirleme
checkout’ta kayıtlı adres seçme

Checkout sistemi bu modeli açıkça varsayar: kayıtlı adres seçimi, yeni adres ekleme ve varsayılan adres kullanımı aynı akışta yer almalıdır.

8. Varsayılan adres

Varsayılan adres mantığı olmalıdır. Ama varsayılan adres “her siparişte koşulsuz kullanılacak adres” anlamına gelmez. Doğru davranış:

kullanıcı checkout’a geldiğinde varsayılan adres ön seçimli olabilir,
fakat teslimat uygunluğu yine kontrol edilmelidir,
kullanıcı isterse başka kayıtlı adres seçebilir,
uygun değilse varsayılan adres otomatik geçerli kabul edilmemelidir.

Bu, checkout’taki adres seçimi ve teslimat uygunluğu kontrolü kararlarıyla uyumludur.

9. Yeni adres ekleme

Kullanıcı checkout sırasında yeni adres ekleyebilmelidir. Bu alan checkout’u terk ettirmemeli, akış içinde çözülmelidir. Çünkü checkout’ta adres sistemi ana bölümlerden biridir ve kullanıcıyı harici profile gitmeye zorlayan yapı dönüşümü düşürür. Checkout dosyası da yeni adres eklemeyi checkout’un teslimat bilgisi bölümünün parçası olarak sayar.

10. Teslimat uygunluğu kontrolü

Adres sisteminin en kritik parçası budur.

Seçilen adres yalnız biçimsel olarak dolu olmakla yetmez; teslimata uygun da olmalıdır. Doğru model:

adres seçilir veya eklenir,
sistem teslimat uygunluğunu kontrol eder,
uygunsa checkout devam eder,
uygun değilse kullanıcıya açık hata verilir ve ödeme geçişi engellenir.

Checkout dosyasında “teslimat uygunluğu kontrolü” açıkça adres bölümünün parçası olarak geçer. Ödeme sistemi de adres tamamlanmadan ve checkout valid olmadan ödeme ekranına geçişe izin vermez.

11. Adres ve teslimat ilişkisi

Adres sistemi teslimat yöntemiyle doğrudan bağlantılıdır ama aynı şey değildir.

Doğru ayrım:

adres sistemi “nereye” sorusunu cevaplar,
teslimat sistemi “nasıl ve hangi operasyon hattıyla” sorusunu cevaplar.

Checkout da bunu iki ayrı bölüm halinde ayırır: önce teslimat bilgisi/adres, sonra teslimat-kargo bölümü. Bu ayrım korunmalıdır; aksi halde adres yönetimi kargo operasyonu ile karışır.

12. Checkout veri modelindeki yeri

Checkout seviyesinde en az şu alanlar bulunmalıdır:

kullanıcı kimliği
seçili adres
teslimat tercihi
ödeme hazırlık durumu
toplam özet
validation state
checkout state

Bu, adresin checkout state nesnesinin zorunlu parçası olduğunu gösterir. Ayrıca state akışında address_completed adımı tanımlanmıştır; yani adres seçimi yalnız form değil, durum değiştiren iş adımıdır.

13. Checkout state ile ilişkisi

Adres tamamlandığında checkout state ilerlemelidir. Mevcut omurgada address_completed state’i açıkça tanımlanmıştır. Bu nedenle doğru davranış:

checkout başladı,
kimlik kontrolü geçti,
validasyon tamamlandı,
adres seçildi ve teslimat uygunluğu doğrulandı,
state address_completed oldu,
ardından teslimat/özet/ödeme hazırlığı devam etti.

Adres bu akışta pasif alan değil, state transition tetikleyen adımdır.

14. Ödeme ile ilişkisi

Ödeme sistemi doğrudan sepetten beslenmez; checkout’un doğrulanmış sipariş hazırlığını alır. Bu hazırlığın içinde adres tamamlanmış olmalıdır. Ödeme aşamasına geçebilmek için açık koşullar arasında “adres tamamlanmış olmalı” maddesi bulunur. Bu nedenle adres sistemi ödeme öncesi zorunlu doğrulama kapısıdır.

15. Sipariş ile ilişkisi

Sipariş sistemi siparişi oluştururken checkout referansı, payment referansı, kullanıcı kimliği, satırlar ve teslimat/adres bilgisini alır. Ayrıca sipariş nesnesi içinde “adres özeti” alanı bulunmalıdır. Bu nedenle doğru model:

kullanıcı adres defterindeki canlı kayıt ayrı tutulur,
sipariş oluşurken bu kaydın işlem anındaki özeti siparişe snapshot olarak yazılır,
geçmiş siparişin operasyonel gerçeği korunur.

Bu alan sipariş detayında, destekte ve iade/teslimat süreçlerinde referans olarak yaşar.

16. Teslimat sistemi ile ilişkisi

Teslimat sistemi fiziksel gönderiyi ve çok paketli yapıyı yönetir. Bunun için doğru teslimat adresi gereklidir; ancak teslimat sistemi adresin sahibi değildir. Adres sistemi operasyonu başlatan veri sağlar, teslimat sistemi ise bu veriyi fulfillment ve shipment nesnelerine uygular. Bu ayrım platformun merkezi operasyon modeline uygundur.

17. Çok mağazalı / çok paketli siparişlerde adres

Platformda kullanıcı tek checkout ve tek ödeme deneyimi yaşar; ama içeride çok mağazalı veya çok paketli fulfillment olabilir. Adres sistemi bu durumda da tek müşteri teslimat bağlamı üretir. İlk faz için doğru yaklaşım:

tek checkout içinde tek teslimat adresi,
iç tarafta çok paketli ayrışma mümkün,
kullanıcıya mağaza bazlı adres karmaşası yansıtılmaz.

Checkout ve ödeme dosyalarındaki “tek akış / içeride çok paketli veya çok mağazalı ayrışma olabilir” ilkesi bunu destekler.

18. Destek sistemi ile ilişkisi

Destek sistemi resmi süreçleri yönetir. Sipariş, teslimat, iade, eksik/yanlış teslimat gibi konularda doğru sipariş ve teslimat bağlamı gerekir; bu bağlamın temel bileşenlerinden biri de siparişe taşınmış adres özetidir. Destek sistemi adresin sahibi değildir; ama sorun çözümünde sipariş adres bağlamını kullanır. Özellikle “teslim edildi görünüyor ama almadım” gibi durumlar adres/teslimat ilişkisinde kritik olur.

19. İade / iptal ile ilişkisi

Adres sistemi iade kurallarını belirlemez. Ancak iade ve teslimat süreçlerinde siparişin hangi adrese teslim edilmeye çalışıldığı ve teslimat sonucunun ne olduğu önemlidir. Bu yüzden siparişe snapshot adres taşınması, sonraki satış sonrası süreçlerde de önemini korur. İptal/iade sistemi satır bazlı çalışırken geçmiş sipariş gerçekliğinin korunması gerekir; adres özeti bu kalıcılığın parçasıdır.

20. Fatura bilgisi ile sınır

Checkout’ta “fatura bilgisi hazırlığı” bulunabilir; ama adres sistemi ile faturalama sistemi aynı şey değildir. Adres sistemi öncelikle teslimat adresini taşır. Fatura bilgisi ayrı sistem veya checkout alt modülü olarak ele alınmalıdır. Checkout’ta bulunabilecek yardımcı alanlar arasında “fatura bilgisi hazırlığı” geçmesi bu ayrımı destekler. MODÜL YAPISI dosyalarında da faturalama modülü ayrı başlık olarak yer alır.

21. Adres sisteminde bulunması gereken temel alanlar

İlk faz için en az şu alanlar tanımlanmalıdır:

adres başlığı (ev, iş vb.)
alıcı adı
telefon
il
ilçe
mahalle / semt
açık adres satırı
posta kodu
varsayılan mı
teslimat uygunluğu durumu
oluşturulma / güncellenme zamanı

Bu alan seti doğrudan dosyalarda tek tek sayılmamış olsa da checkout’ta adres seçimi, teslimat uygunluğu ve siparişte adres özeti taşıma gerekliliği bu seviyede bir kanonik yapı zorunlu kılar. Bu, mevcut sistemlerin çalışması için mimari çıkarımdır.

22. Doğrulama kuralları

Adres sistemi için temel doğrulama kuralları şunlar olmalıdır:

zorunlu alanlar eksikse adres kaydedilemez
teslimat için geçersiz görünen adres checkout’a taşınamaz
uygun olmayan adresle ödeme adımına geçilemez
seçili adres silinmiş veya pasifleştirilmişse checkout yeniden adres seçimine döner
sipariş oluştuktan sonra sipariş adres özeti değişmez; kullanıcı adres defterindeki kayıt değişebilir

Bu kurallar checkout validasyon ve payment handoff kararlarıyla uyumludur.

23. Mobil öncelikli tasarım

Mobilde adres sistemi checkout’un en sürtünmeli alanlarından biridir; bu yüzden sade ve kontrollü olmalıdır. Doğru yaklaşım:

kayıtlı adresler kolay seçilebilir kart yapısında görünür,
yeni adres ekleme kısa ve parçalı form mantığıyla ilerler,
varsayılan adres hızlı seçilir,
hata mesajları alan bazında net görünür,
klavye açıldığında akış bozulmaz,
adres adımı ödeme butonunun önüne gereksiz duvar koymaz ama doğrulama taviz vermez.

Checkout’un mobil öncelikli, sade ve kısa form alanlı olması gerektiği kararı bunu destekler.

24. Performans yaklaşımı

Adres sistemi hızlı çalışmalıdır. Özellikle:

kayıtlı adres listesi hızlı açılmalı,
seçim sonrası teslimat uygunluğu kontrolü gereksiz tekrar edilmemeli,
checkout içinde adres değişikliğinde tüm akış ağır yeniden yüklenmemeli,
form state hafif yönetilmelidir.

Checkout performans kuralları bu yaklaşımı doğrudan destekler.

25. Ana kurallar

Adres sistemi için sabitlenmesi gereken temel kurallar şunlardır:

adres sistemi ayrı ana sistemdir; checkout içinde eriyen basit form değildir
misafir kullanıcı kalıcı adres sistemi kullanıcısı değildir, ancak checkout içinde tek seferlik adres sağlayabilir
giriş yapmış kullanıcı birden fazla kayıtlı adres tutabilir
varsayılan adres olabilir ama teslimat uygunluğu kontrolü yine zorunludur
checkout’ta kayıtlı adres seçimi, yeni adres ekleme ve varsayılan adres kullanımı desteklenmelidir
seçilen adres teslimat uygunluğu kontrolünden geçmelidir
adres tamamlanmadan ödeme aşamasına geçilemez
sipariş oluşurken canlı adres kaydı değil, adres özeti/snapshot siparişe taşınmalıdır
teslimat sistemi adresi kullanır ama adresin sahibi değildir
fatura bilgisi hazırlığı adres sistemine yakın olabilir ama aynı sistem değildir
çok mağazalı / çok paketli siparişte kullanıcı tek adres ve tek checkout deneyimi yaşamalıdır
geçmiş sipariş adres gerçeği sonradan kullanıcı adres değişikliğinden etkilenmemelidir.
26. Nihai kısa özet

Adres sistemi, giriş yapmış kullanıcının teslimat adreslerini yönettiği; checkout sırasında kayıtlı adres seçimi, yeni adres ekleme ve teslimat uygunluğu kontrolü yaptığı; ödeme öncesi zorunlu doğrulama kapısı olarak çalışan; ve sipariş oluştuğunda canlı adres kaydını değil adres özetini resmi sipariş gerçeğine taşıyan temel operasyon veri sistemidir.