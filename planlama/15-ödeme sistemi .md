ÖDEME SİSTEMİ
1. Sistem tanımı

Ödeme sistemi, checkout aşamasında doğrulanmış sipariş hazırlığını finansal işlem aşamasına taşıyan, kullanıcının ödemesini güvenli biçimde alan, sonucu kesinleştiren ve başarılı işlemden sonra sipariş oluşumunu tetikleyen finansal işlem sistemidir.

Bu sistemin görevi yalnız karttan para çekmek değildir.
Aynı zamanda:

ödeme isteğini başlatmak,
kullanıcıyı güvenli şekilde ödeme adımına taşımak,
başarısız / yarım / terk edilmiş işlemleri yönetmek,
tekrar deneme mantığını kurmak,
başarılı işlemi sipariş oluşumuna bağlamak,
başarısız işlemi checkout’a temiz biçimde geri döndürmektir.

Kısa tanım:

Ödeme sistemi, checkout’tan gelen doğrulanmış sipariş hazırlığını finansal sonuca çeviren işlem sistemidir.

2. Sistemin ana amacı

Ödeme sistemi şu görevleri yerine getirmelidir:

checkout’tan gelen geçerli toplamı işlemek
kullanıcıdan güvenli biçimde ödeme almak
finansal sonucu net biçimde belirlemek
başarı durumunda sipariş oluşumuna zemin hazırlamak
başarısızlık durumunda kullanıcıyı belirsizlikte bırakmamak
aynı işlemi yanlışlıkla iki kez çalıştırmamak
ödeme sonucunu dürüst biçimde göstermek
mobilde güven ve sadelik hissini korumak
3. Sistemin ana karakteri

Ödeme sistemi şu karaktere sahip olmalıdır:

güvenli
kesin
idempotent
sade
hızlı
doğrulanabilir
hata toleranslı
merkezi

Net kural:

Ödeme sistemi sosyal yüzey değildir.
Burada story, keşif, mağaza içeriği, yorum akışı, post gibi alanlar bulunmamalıdır.

Ödeme sistemi:

dikkati daraltır
tek göreve odaklanır
kullanıcıyı finansal karar anına getirir
belirsizliği azaltır
4. Ödeme sisteminin platform içindeki rolü

Akış sırası nettir:

PDP karar başlatır
sepet toplar
checkout doğrular
ödeme finansal sonucu üretir
sipariş oluşur

Bu yüzden ödeme sistemi:

sepet değildir
checkout değildir
sipariş de değildir

Bu ayrım sert korunmalıdır.

5. Ödeme kim tarafından yapılabilir

*REVİZYON NOTU: Bu dosyadaki eski kural, kanonik guest checkout kararıyla güncellenmiştir.*

5.1 Misafir kullanıcı

Kontrollü guest checkout içinde misafir kullanıcı ödeme tamamlayabilir. Ödeme sistemi doğrudan sepetten değil, checkout'un doğrulanmış bağlamından beslenir. Bu bağlam, giriş yapmış kullanıcı veya guest checkout context olabilir. 
Guest payment mümkündür; ancak sosyal hak açmaz. Payment success sonrası sipariş guest context ile oluşur. Guest payment modeli, ödeme güvenliği ve idempotency kurallarını değiştirmez.

5.2 Giriş yapmış normal kullanıcı

Ödeme yapan ana aktördür. Kullanıcı sistemi içinde sipariş ve destek süreçlerini kullanabilen taraf budur.

5.3 Fenomen mağaza

Fenomen ödeme otoritesi değildir. Kendi bağımsız ödeme/sipariş hattını kuramaz.

5.4 Platform

Finansal işlem ve sipariş hattının merkezi otoritesidir. Fenomen mağaza yalnız satış vitrini ve ilişki yüzeyidir; operasyon platformdadır.

6. Ödemeye giriş koşulları

Ödeme aşamasına geçebilmek için şu koşullar sağlanmış olmalıdır:

kullanıcı giriş yapmış olmalı
checkout valid olmalı
adres tamamlanmış olmalı
ürünler checkout için uygun olmalı
fiyat ve stok doğrulaması geçmiş olmalı
toplam tutar netleşmiş olmalı

Net kural:
Geçersiz checkout ödeme ekranına taşınmamalıdır.

7. Ödemenin ana girdisi

Ödeme sistemi doğrudan sepetten beslenmez.
Doğru kaynak:

checkout’un doğrulanmış sipariş hazırlığı

Yani ödeme sistemi şu alanları checkout’tan alır:

kullanıcı kimliği
checkout kimliği
doğrulanmış satırlar
nihai toplam
teslimat/kargo etkisi
para birimi
ödeme denemesi bağlamı

Bu ayrım çok önemlidir.
Çünkü:

sepet niyet taşır
checkout doğrular
ödeme sonucu üretir
8. Ödeme sistemi tek hareket değildir

Ödeme sistemi 4 ana parçadan oluşmalıdır:

8.1 Ödeme başlatma

Kullanıcı ödeme adımına gelir, sistem payment attempt oluşturur.

8.2 Ödeme işleme

Seçilen yöntem üzerinden finansal işlem denenir.

8.3 Ödeme sonucu

Sonuç açık biçimde belirlenir:

başarılı
başarısız
beklemede
iptal edildi
zaman aşımı / yarım kaldı
8.4 Sonuç sonrası yönlendirme
başarılıysa sipariş hattına geçiş
başarısızsa güvenli retry
beklemedeyse kullanıcı bilgilendirme
iptal edildiyse checkout’a dönüş
9. Ödeme satır mantığı

Ödeme sistemi ürün detayını yeniden yorumlamaz.
Onun görevi:

checkout’un verdiği toplamı işlemek
finansal sonucu üretmek

Ama izleme için şu bağlamlar korunmalıdır:

checkout referansı
kullanıcı referansı
ödeme denemesi kimliği
toplam tutar
ödeme yöntemi
işlem zamanı
sonuç durumu

Net kural:
Ödeme sistemi PDP veya sepet gibi ürün ağırlıklı görünmez; işlem ağırlıklı görünür.

10. Ödeme state yapısı

Ödeme sistemi için profesyonel ve sade state omurgası şu olmalıdır:

created
processing
authorized veya paid
failed
cancelled
expired
refunded veya iade bağına giren finansal alt durumlar

İlk faz için minimum güvenli çekirdek:

created
processing
succeeded
failed
cancelled
expired

Net kural:
Ödeme state’i, checkout state’inden ayrı olmalıdır.

Çünkü:

checkout kullanıcı akışı ve ticari hazırlık state’idir
payment finansal işlem state’idir
11. Başarılı ödeme ne demektir

Başarılı ödeme şu anlama gelir:

finansal işlem başarıyla tamamlandı
kullanıcı ödeme açısından geçti
artık sipariş oluşum hattı tetiklenebilir

Ama burada kritik ayrım:
başarılı ödeme = sipariş ekranı otomatik olarak “zaten oluştu” demek değildir.

Doğru mantık:

payment success
order creation attempt
order success / failure reconciliation

Bu ayrım korunmalıdır; aksi halde ödeme başarılı olup sipariş oluşamayan senaryolarda sistem bozulur.

12. Başarısız ödeme ne demektir

Başarısız ödeme durumunda sistem şunları yapmalıdır:

sonucu net göstermeli
kullanıcıyı belirsizlikte bırakmamalı
tekrar deneme hakkı sunmalı
checkout bağlamını korumalı
sepeti bozmamalı
satırları kendiliğinden değiştirmemeli

Başarısız ödeme:

sipariş oluşturmaz
kullanıcıyı temiz biçimde checkout’a veya ödeme adımına döndürür
13. Bekleyen / yarım kalan işlem

Profesyonel yapıda şu durumlar ayrı düşünülmelidir:

kullanıcı sayfayı kapattı
ağ koptu
ödeme sağlayıcı sonucu gecikti
kullanıcı bankadan dönmedi
callback/webhook gecikti

Bu yüzden ödeme sistemi yalnız “başarılı/başarısız” ikiliğine sıkışmamalıdır.
En azından operasyonel olarak:

processing
pending review
finalized
gibi iç mantıklarla çalışabilmelidir.

Kullanıcı yüzünde ise sade gösterim tercih edilmelidir:

işlem alınıyor
ödeme tamamlandı
ödeme başarısız
ödeme tamamlanamadı, tekrar deneyin
14. Idempotency kuralı

Bu sistemde en kritik kurallardan biri budur:

Aynı ödeme denemesi iki kez sipariş üretmemelidir.

Bu yüzden ödeme sistemi:

payment attempt kimliği üretmeli
aynı isteği tekrar işlerken koruma kullanmalı
ağ tekrarları / butona iki kez basma / callback tekrarları durumunda çift işlem üretmemeli

Net kural:

tek ödeme denemesi
tek finansal sonuç
tek sipariş etkisi
15. Ödeme ile sipariş sınırı

Bu sınır çok sert çizilmelidir.

Ödeme sistemi ne yapar
finansal sonucu üretir
başarılı ödeme sinyali verir
sipariş oluşumuna zemin hazırlar
Ödeme sistemi ne yapmaz
siparişin tüm operasyonel yaşam döngüsünü yönetmez
kargo başlatmaz
destek sürecini yönetmez
iade kuralını belirlemez

Yani ödeme sistemi siparişi başlatır; sipariş sistemi siparişi yaşatır.

16. Ödeme ile checkout sınırı
Checkout
fiyat/stok/adres/teslimat doğrular
ödeme için hazır bağlam üretir
Payment
finansal işlemi yapar
sonuca göre sipariş hattını tetikler

Net kural:
Checkout ödeme değildir; payment checkout’un içine erimemelidir.

17. “Hemen al” ile ödeme ilişkisi

PDP’de “hemen al” vardır.

Ama bu ödeme sisteminde ayrı kural evreni yaratmaz.

Doğru model:

hemen al → hızlandırılmış checkout başlangıcı
checkout doğrulama yine çalışır
payment kuralları aynen çalışır
sipariş hattı yine aynı merkezden yürür

Yani:
hemen al, ödeme mimarisini bölmez.

18. Çok mağazalı siparişlerde ödeme

Platformda mağaza bağlamı korunur ama operasyon merkezi kalır.

Bu nedenle doğru ödeme yaklaşımı:

kullanıcı tek ödeme deneyimi yaşar
iç tarafta sipariş/paket ayrışması olabilir
kullanıcıya mağaza bazlı finansal karmaşa yansıtılmaz

Yani:

dışarıda tek ödeme hissi
içeride çok mağazalı sipariş ayrışması olabilir

Bu, fenomen mağazanın bağımsız satıcı değil kontrollü vitrin olmasıyla uyumludur.

19. Ödeme yöntemi yaklaşımı

İlk fazda ödeme sistemi sade tutulmalıdır.

Çekirdek olarak:

kartla ödeme

sonraki fazlarda:

taksit
kayıtlı kart
alternatif ödeme yöntemleri
cüzdan / hediye bakiye benzeri katmanlar

değerlendirilebilir.

Ama ilk faz kuralı:
önce güvenli ve temiz kart akışı.

20. Ödeme ekranında görünmesi gerekenler

Ödeme ekranı sade ve güven verici olmalıdır.

Bulunmalıdır:

ödeme özeti
toplam tutar
teslimat özeti kısa görünüm
güven göstergesi
ödeme yöntemi alanı
tamamla butonu
geri dön / checkout’a dön

Bulunmamalıdır:

story
keşfet blokları
yoğun öneri alanı
mağaza postları
yorum / soru-cevap
21. Güven sinyalleri

Ödeme sisteminde güven hissi açıkça görünmelidir.

Bu, ana sayfa güven bandındaki “güvenli ödeme” söylemiyle uyumludur.

Ödeme ekranında kullanıcıya şu hissin verilmesi gerekir:

işlem güvenli
platform güvencesi var
iade/destek hattı mevcut
hata olursa kaybolmayacak

Bu ticari dönüşüm için kritik önemdedir.

22. Başarısız ödeme sonrası akış

Başarısız ödeme sonrası doğru davranış şudur:

kullanıcı checkout bağlamına döner
adres ve sipariş özeti korunur
ödeme yeniden denenebilir
başarısızlık sebebi sade gösterilir
kullanıcı sepeti baştan kurmak zorunda kalmaz

Net kural:
Başarısız ödeme, kullanıcıyı sıfıra atmaz.

23. Zaman aşımı / terk edilme

Şu durumlar desteklenmelidir:

kullanıcı ödeme ekranını kapattı
işlem uzun sürdü
sağlayıcıdan dönüş gelmedi
bankadan geri dönmedi

Bu durumda sistem:

payment attempt’i expire/cancel edebilir
checkout’u tekrar denenebilir halde bırakabilir
stok/fiyat doğrulamasını gerekirse yenileyebilir
24. İade ile ödeme ilişkisi

İade sistemi sonra ayrıca netleşecek olsa da ödeme sistemi şu sınırı taşımalıdır:

ödeme sistemi iade sürecinin finansal sonucunu destekler
ama iade karar motoru değildir
iade uygunluğu / operasyon / inceleme ayrı sistemdedir

Yani burada yalnız finansal ters hareket bağı kurulur.

25. Ödeme ile destek ilişkisi

Ödeme sistemi hata üretebilir; destek sistemi bunu çözümleyebilir.
Ama ödeme sistemi destek ekranına dönüşmez.

Doğru ilişki:

payment failure reason
transaction reference
support escalation link veya destek yönlendirmesi

Bu kadar.

26. Mobil öncelikli ödeme tasarımı

Mobilde ödeme daha da sade olmalıdır.

Kurallar:

tek kolon
büyük ve net CTA
kısa form
toplam görünür
güven ifadesi görünür
gereksiz bilgi yok
butona çift basmayı önleyen net geri bildirim
işlem alınıyor durumu açık

Mobilde öncelik:

toplam
yöntem
güven
ödeme tamamla
27. Performans kuralları

Ödeme sistemi performans öncelikli olmalıdır.

27.1 Ekran hızlı açılmalı
27.2 Form ağır olmamalı
27.3 Çift submit önlenmeli
27.4 Sonuç ekranı net ve hızlı olmalı
27.5 Ağ kesintisi / retry mantığı düzgün olmalı
27.6 Ödeme sağlayıcı yavaşsa kullanıcı belirsizlikte bırakılmamalı

Ödeme ekranı ağır medya ve gereksiz script çöplüğüne dönüşmemelidir.

28. Ana kurallar

Ödeme sistemi için temel kurallar şunlardır:

misafir kullanıcı kontrollü guest checkout içinde ödeme yapabilir ancak bu hesap yetkisi veya sosyal hak üretmez
ödeme sistemi platform merkezli olmalıdır
fenomen bağımsız ödeme hattı kuramaz
ödeme checkout’tan sonra gelir
ödeme state’i checkout state’inden ayrıdır
aynı ödeme denemesi iki kez sipariş üretmemelidir
başarılı ödeme sipariş oluşumunu tetikler ama siparişin kendisi değildir
başarısız ödeme kullanıcıyı sıfırlamamalıdır
çok mağazalı siparişte kullanıcı tek ödeme hissi yaşamalıdır
hemen al akışı ödeme kurallarını bozmaz
mobilde güvenli, sade ve hızlı olmalıdır
29. Nihai kısa özet

Ödeme sistemi, checkout tarafından doğrulanmış sipariş hazırlığını güvenli finansal işleme dönüştüren; sonucu kesinleştiren, çift işlem riskini önleyen, başarılı ödeme sonrası sipariş oluşumunu tetikleyen ve başarısız işlemde kullanıcıyı kontrollü biçimde checkout’a geri döndüren merkezi finansal işlem sistemidir.

30. Bu aşamada hazır kararlar / burada netleştirdiğimiz kararlar
Mevcut sistemlerden gelen hazır kararlar
misafir kullanıcı kontrollü guest commerce ile ödeme yapabilir
fenomen mağaza bağımsız ödeme/sipariş hattı kuramaz
PDP’de hemen al ve sepete ekle aksiyonları vardır
güvenli ödeme, platform güven bandının parçasıdır
operasyon merkezi platformda kalır
Burada netleştirdiğimiz yeni çerçeve
payment, checkout’tan sonra gelen ayrı finansal state machine olmalı
payment ve order aynı şey değildir
payment ve checkout aynı şey değildir
idempotency zorunludur
başarısız ödeme kullanıcıyı sıfıra atmaz
dışarıda tek ödeme deneyimi, içeride çok mağazalı ayrışma olabilir
hemen al akışı payment mimarisini bölmez
ödeme ekranı sosyal içerikten tamamen arındırılmalıdır