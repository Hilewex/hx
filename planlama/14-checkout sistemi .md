CHECKOUT SİSTEMİ
1. Sistem tanımı

Checkout sistemi, sepette toplanmış ürünlerin siparişe dönüşmeden önce kullanıcı, adres, teslimat, fiyat, stok ve ödeme hazırlığı açısından son kez doğrulandığı ticari kapanış hazırlık sistemidir.

Bu sistemin görevi yalnız form doldurtmak değildir.
Aynı zamanda:

sepeti siparişe hazırlamak,
kullanıcı kimliğini doğrulamak,
teslimat bilgisini toplamak,
fiyat ve stok doğruluğunu yeniden kontrol etmek,
ödeme öncesi nihai ticari mutabakatı kurmak,
hatalı veya geçersiz satırları bloklamak,
kullanıcıyı ödeme aşamasına temiz ve güvenli şekilde taşımaktır.

Kısa tanım:

Checkout sistemi, sepeti siparişe hazır hale getiren son ticari doğrulama sistemidir.

2. Sistemin ana amacı

Checkout sistemi şu görevleri yerine getirmelidir:

sepetteki ürünleri siparişe uygun hale getirmek
misafir kullanıcıyı burada durdurup girişe yönlendirmek
adres bilgisini toplamak ve doğrulamak
teslimat yapısını netleştirmek
fiyat ve stok final kontrolünü yapmak
ödeme öncesi nihai sipariş özetini üretmek
kullanıcıya onaylı ve dürüst bir son ekran sunmak
hatalı satırları veya geçersiz siparişi ödeme aşamasına taşımamak
3. Sistemin ana karakteri

Checkout sistemi şu karaktere sahip olmalıdır:

doğrulayıcı
güven veren
sade
hızlı
mobil öncelikli
işlem odaklı
hata toleranslı
dürüst

Net kural:

Checkout sosyal yüzey değildir.
Burada story, yorum, post, yoğun öneri akışı veya keşif mantığı baskın olmamalıdır.

Checkout:

dikkat toplar
kullanıcıyı daraltır
hata ve belirsizliği azaltır
ödeme hazırlığını tamamlar
4. Checkout’un platform içindeki rolü

Akış sırası nettir:

arama buldurur
PDP karar başlatır
sepet ürünleri toplar
checkout siparişi hazırlar
ödeme işlemi tamamlar
sipariş oluşur

Bu yüzden checkout:

sepet değildir
ödeme değildir
sipariş de değildir

Bu ayrım ticaret çekirdeği state modelinde de açıkça korunur; sepet, checkout, payment ve order aynı lifecycle değildir.
5. Checkout’a kim girebilir

5.1 Misafir kullanıcı

Misafir kullanıcı kontrollü guest checkout kullanabilir.

Doğru davranış:
sepette ilerleyebilir
checkout başlatabilir
satın alma için gerekli minimum bilgi setini tamamlayabilir
ödeme sonrası hesap tamamlama / sessiz üyelik akışına yönlendirilebilir

Net kural:
guest checkout sosyal hak açmaz; yalnız ticari kapanış istisnasıdır.

5.2 Giriş yapmış kullanıcı

Checkout’un tam yetkili aktörüdür.
Adres, teslimat ve ödeme hazırlığını hesap bağlı biçimde tamamlayabilir.

5.3 Fenomen hesabı

Bu sistem müşteri checkout’udur; fenomen panel akışı ile karıştırılmaz.

6. Checkout’a giriş koşulları

Checkout’a girebilmek için şu koşullar sağlanmış olmalıdır:

ürün aktif olmalı
ürün görünür olmalı
varyantlı üründe varyant seçilmiş olmalı
stok yeterli olmalı
guest checkout veya login checkout için gerekli kimlik/iletişim doğrulama seviyesi sağlanmış olmalı
ödeme öncesi doğrulama tamamlanabilmeli

Bu koşullardan biri bozulursa checkout bloklanmalıdır.

7. Checkout’un ana rolü: final doğrulama

Sepet snapshot taşır; ama son gerçek checkout’ta doğrulanır.
Bu kilit kuraldır.

Yani checkout şunları yeniden kontrol etmelidir:

fiyat aynı mı
stok yeterli mi
ürün hâlâ aktif mi
varyant geçerli mi
mağaza/satış görünürlüğü uygun mu
satır checkout’a taşınabilir mi

Net kural:
Sepet doğruluğu nihai ticari doğruluk değildir.
Nihai doğruluk checkout’ta kurulur.

8. Checkout’un ana bölümleri
8.1 Teslimat bilgisi bölümü

Kullanıcının siparişi nereye alacağını belirlediği alandır.

İçermelidir:

kayıtlı adres seçimi
yeni adres ekleme
varsayılan adres kullanma
teslimat uygunluğu kontrolü
8.2 Sipariş satırları özeti

Sepetten gelen ürünler burada daha sıkı doğrulama ile görünür.

İçermelidir:

ürün adı
varyant
mağaza bağlamı
adet
aktif satış fiyatı
satır toplamı
geçersiz satır uyarıları
8.3 Teslimat / kargo bölümü

Burada tahminden daha net bir teslimat görünümü verilir.

İçermelidir:

teslimat yöntemi
tahmini teslimat bilgisi
mağaza/paket bazlı gönderim mantığı
kargo etkisi
8.4 Nihai sipariş özeti

Ödeme öncesi son doğrulama alanıdır.

İçermelidir:

ara toplam
kargo
indirim etkisi
genel toplam
ödeme aşamasına geç butonu
8.5 Uyarı / bloke alanı

Şu durumlar açıkça görünmelidir:

fiyat değişti
stok yetersiz
ürün pasif
varyant silindi
checkout tamamlanamaz
9. Checkout veri mantığı

Checkout satırı en az şu doğrulukları taşımalıdır:

cart item referansı
ürün kimliği
mağaza bağlamı
seçilen varyant
adet
checkout anındaki doğrulanmış fiyat
stok uygunluğu
validasyon sonucu
teslimat/paket bilgisi hazırlığı

Ek olarak checkout seviyesinde:

kullanıcı kimliği
seçili adres
teslimat tercihi
ödeme hazırlık durumu
toplam özet
validation state
checkout state

olmalıdır. Bu, ticaret çekirdeği entity ve state yaklaşımıyla uyumludur.

10. Checkout state yapısı

Mevcut omurga zaten tanımlı:

started
address_completed
payment_pending
payment_failed
completed
abandoned

Ayrıca validation state ayrı tutulur:

pending
valid
price_mismatch
stock_mismatch
blocked

Bu ayrım doğrudur.
Çünkü:

checkout state = kullanıcı akışının durumu
validation state = ticari uygunluk durumu

İkisi aynı şey değildir.

11. Önerilen checkout adımları

Kodlama ve UX açısından en temiz sıralama şu olur:

11.1 Başlangıç

Sepetten gelen satırlar alınır, checkout başlatılır

11.2 Kimlik kontrolü

Kullanıcı login değilse burada bloke edilir

11.3 Validasyon

Fiyat + stok + ürün/varyant uygunluğu yeniden doğrulanır

11.4 Adres

Teslimat adresi seçilir / eklenir

11.5 Teslimat

Gönderim ve paketleme özeti netleşir

11.6 Özet / İnceleme

Kullanıcı nihai sipariş özetini görür

11.7 Ödeme hazırlığı

Ödeme modülüne geçiş için payment_pending durumu hazırlanır

Bu, mevcut step-order mantığıyla da uyumludur: START → VALIDATION → SHIPPING → BILLING → PAYMENT → REVIEW biçiminde bir sıralama dosyada görünmüş durumda; ancak yüzeyde en anlaşılır olanı kullanıcıya adres/teslimat/özet ekseninde göstermektir.

12. Çok mağazalı sipariş ve checkout

Sepet çok mağazalı çalışabiliyorsa checkout da bunu taşımalıdır.
Ama kullanıcıya dağınık görünmemelidir.

Doğru yaklaşım:

checkout tek akış olabilir
fakat içeride mağaza/paket bazlı gruplama korunur
kullanıcı hangi ürünün hangi mağaza/paket hattında olduğunu anlayabilmelidir

Bu, “aynı sipariş birden fazla pakete bölünebilir” kuralıyla uyumludur.

Yani:

tek ödeme olabilir
ama fulfillment çok paketli olabilir
checkout bunu hazırlamalıdır
13. Stok rezervasyon ilişkisi

Checkout, stok yarışının en kritik yeridir.

State setinde rezervasyon mantığı zaten tanımlıdır:

created
active
released
consumed
expired

Bu nedenle checkout sistemi şu ilkeyle çalışmalıdır:

sepette stok garantisi yok
checkout sırasında final stok uygunluğu kontrol edilir
gerekiyorsa rezervasyon burada aktive olur
ödeme başarısızsa veya terk edilirse rezervasyon bırakılır
siparişe dönüşürse rezervasyon consumed olur

Net kural:
Checkout, stok gerçeğini yumuşak niyetten sert doğrulamaya çeviren noktadır.

14. Fiyat snapshot ilişkisi

Checkout’ta fiyat değişimi kullanıcıdan gizlenmemelidir.

Price snapshot state yapısı zaten bunu destekler:

draft
locked
invalidated
consumed

Doğru kural:

sepetteki fiyat eski olabilir
checkout’ta yeni fiyat doğrulanır
fiyat değişirse kullanıcıya yeni fiyat gösterilir
onaysız devam edilmez

Bu edge-case mevcut state kararlarında da açıkça belirtilmiş.

15. Checkout’ta bloke edilmesi gereken durumlar

Şu durumlarda kullanıcı ödeme aşamasına geçememelidir:

ürün pasif hale geldiyse
ürün kaldırıldıysa
stok yetersizse
seçili varyant silindiyse
fiyat değişti ve kullanıcı henüz onaylamadıysa
kullanıcı login değilse
adres eksikse
doğrulama blocked döndüyse

Bu kurallar hem lock modül hem state edge-case kararlarıyla uyumludur.

16. Checkout ile ödeme sınırı

Checkout ödeme değildir.

Checkout’un görevi:

ödeme için hazır sipariş bağlamını kurmak
geçerli toplamı hazırlamak
kullanıcıyı payment_pending noktasına getirmek

Net kural:
Ödeme checkout içinde erimez.
Payment ayrı state machine’dir.

Bu çok önemli.
Aksi halde:

retry mantığı bozulur
reconciliation bozulur
order creation idempotency sınırı bulanıklaşır
17. Checkout ile sipariş sınırı

Checkout tamamlandı diye sipariş oluşmaz.
Sipariş ancak başarılı ödeme sonrası oluşur. Bu kilit kuraldır.

Yani:

checkout completed = payment handoff tamamlandı / kullanıcı akışı bitti
order created = finansal başarıdan sonra oluşur

Bu ayrım korunmazsa sistem çakışır.

18. Misafirden kullanıcıya geçiş

Doğru model tek zorunlu login duvarı değildir.

Sistem iki kontrollü akışı destekleyebilir:

18.1 Login checkout
misafir checkout yerine giriş yapar
mevcut kullanıcı bağlamıyla devam eder

18.2 Guest checkout
misafir satın almayı tamamlar
ödeme sonrası sipariş görünürlüğü, destek ve tekrar erişim için hesap tamamlama / sessiz üyelik akışı açılır

Misafir sepeti kaybedilmez.
Gerekirse guest cart + user cart merge kuralı uygulanabilir.

19. Hemen al ile checkout ilişkisi

“Hele al” akışı sepetten farklı giriş noktasıdır ama checkout kurallarını bozmaz.

Doğru model:

hemen al → tek ürünlü checkout başlangıcı
yine login gerekir
yine fiyat/stok validasyonu gerekir
yine adres/teslimat/ödeme hazırlığı gerekir
checkout kuralları aynen çalışır

Yani hemen al, checkout için ayrı bir kural evreni açmaz.

20. Checkout’ta bulunmaması gerekenler

Checkout şu şeylerle gereksiz şişirilmemelidir:

uzun ürün içerikleri
yorum / soru-cevap
story
mağaza postları
yoğun öneri blokları
keşfet akışı
fazla merchandising alanı

Checkout dikkat dağıtmaz; bitirir.

21. Checkout’ta bulunabilecek sınırlı yardımcı alanlar

Kontrollü biçimde şunlar olabilir:

adres düzenle
sepeti düzenlemek için sepete dön
fiyat değişti uyarısı
teslimat notu
kupon/indirim alanı
fatura bilgisi hazırlığı

Ama bunlar ödeme aksiyonunun önüne geçmemelidir.
21A. Fiyat değişimi ve kısa süreli fiyat koruması

Checkout nihai doğrulama alanıdır.
Ancak büyük ölçekli baz fiyat değişimleri kullanıcıya zincirleme kaos olarak yansıtılmamalıdır.

Doğru model:
aktif sepet / checkout bağlamında kısa süreli price lock uygulanabilir
veya fiyat geçişleri planlı batch aktivasyon ile devreye alınabilir

Amaç:
aynı anda çok sayıda checkout’un fiyat değişimi yüzünden patlamasını önlemek
dürüst final doğrulamayı korurken işlem güvenini artırmaktır.
21B. Çoklu tedarikçi kargo toplamı

Tek checkout içinde birden fazla tedarikçi veya paket olabilir.

Bu durumda sistem:
paket kırılımını arka planda yönetir
kargo toplamını merkezi kuralla hesaplar
bedava kargo eşiği veya kargo kampanyasının hangi scope’ta çalıştığını kullanıcıya açıkça gösterir

Net kural:
tek sepet olsa da çoklu paket/kargo mantığı kullanıcıdan saklanmaz; sade ve dürüst biçimde gösterilir.

22. Boş / başarısız checkout durumları
22.1 Boş checkout

Sepetten hiçbir geçerli ürün taşınamadıysa kullanıcı sepete geri yönlendirilmelidir.

22.2 Validation failure
stock_mismatch
price_mismatch
blocked

durumlarında ödeme engellenmeli ve kullanıcıya sebep açıkça gösterilmelidir.

22.3 Abandoned

Kullanıcı checkout’u bırakabilir; state abandoned olur.

23. Mobil öncelikli checkout tasarımı

Mobilde checkout olabildiğince sade olmalıdır.

Kurallar:

tek kolon
kısa form alanları
büyük tıklanabilir aksiyonlar
ödeme butonu görünür
sipariş özeti gizlenmeyen ama baskın olmayan yapıda
adımlar net
hatalar üstten ve satır bazında görünür
klavye açıldığında form bozulmamalı

Mobilde öncelik:

geçerlilik
adres
toplam
ödeme geçişi
24. Performans kuralları

Checkout sistemi performans öncelikli olmalıdır.

24.1 Sayfa açılışı hızlı olmalı
24.2 Final validasyon kontrollü ve düşük gecikmeli olmalı
24.3 Aynı validasyon gereksiz tekrar edilmemeli
24.4 Ağır medya yüklenmemeli
24.5 Form state yönetimi hafif olmalı
24.6 Stok/fiyat revalidation dürüst ama optimize çalışmalı

Checkout, gereksiz animasyon ve görsel şov alanı değildir.

25. Edge-case kararları

Mevcut state kararlarıyla uyumlu biçimde şunlar zorunlu:

checkout sırasında stok biterse → siparişe izin verilmez
checkout sırasında fiyat değişirse → yeni fiyat gösterilir, onaysız devam edilmez
son stokta iki kullanıcı yarışırsa → rezervasyon kuralı devreye girer
ödeme başarılı ama sipariş oluşmazsa → recovery / reconciliation gerekir
pasif ürün checkout’ta bloklanır
varyant silindiyse kullanıcı yeni seçim yapmadan ilerleyemez
26. Ana kurallar

Checkout sistemi için temel kurallar şunlardır:

misafir checkout yapamaz
login zorunludur
sepet snapshot taşır, final doğrulama checkout’ta yapılır
fiyat ve stok yeniden doğrulanır
pasif/kaldırılmış ürün checkout’a gidemez
validation state ile checkout state ayrı tutulur
ödeme checkout’tan ayrıdır
sipariş yalnız başarılı ödeme sonrası oluşur
çok paketli sipariş hazırlığı desteklenir
stok rezervasyon mantığı checkout’ta sertleşir
fiyat değişimi kullanıcıya açıkça gösterilir
mobilde sade ve hızlı akış kurulmalıdır
27. Nihai kısa özet

Checkout sistemi, sepetteki ürünleri giriş yapmış kullanıcı bağlamında adres, teslimat, fiyat ve stok açısından son kez doğrulayan; ödeme için temiz, bloksuz ve dürüst sipariş hazırlığı üreten ticari kapanış hazırlık sistemidir.

28. Bu aşamada hazır kararlar / burada netleştirdiğimiz kararlar
Mevcut sistemlerden gelen hazır kararlar
checkout ticaret çekirdeğinin ana alt modüllerindendir
misafir checkout yapamaz
checkout’ta fiyat + stok yeniden doğrulanır
sepet snapshot taşır, final checkout’ta yapılır
payment ve order ayrı lifecycle/state machine’lerdir
pasif ürün checkout’a gidemez
checkout state ve validation state ayrı tutulur
Burada netleştirdiğimiz yeni çerçeve
checkout ödeme değil, ödeme hazırlık sistemidir
checkout sipariş değil, sipariş hazırlık sistemidir
misafir giriş duvarı checkout başlangıcında uygulanmalıdır
çok mağazalı/paketli hazırlık checkout’ta korunmalıdır
stok rezervasyon mantığı checkout’ta sertleşmelidir
fiyat değişiminde kullanıcıdan yeni onay alınmalıdır
hemen al akışı checkout kurallarını bozmaz
checkout sosyal ve keşif içeriklerinden arındırılmış olmalıdır


######
---
REVİZYON NOTU — 2026-04-19
Durum: Kanonik override + açıklama notu
Etkilediği bölüm(ler): Checkout’a kim girebilir, fiyat doğrulama, kargo doğrulama
Bağlı dosyalar: 13-sepet sistemi, 23-üyelik giriş sistemi, 29-merkezi fiyat sistemi, 17-kargo ve teslimat sistemi

Not:
Bu dosyadaki “misafir kullanıcı checkout yapamaz” kuralı ilk tasarım kararı olarak yazılmıştır; ancak yeni geçerli yorum aşağıdaki gibidir:

1. Kontrollü guest checkout açılabilir.
2. Guest checkout yalnız ticari satın alma tamamlama alanıdır; sosyal ve hesap bağlı haklar yine kapalıdır.
3. Guest checkout kullanan kullanıcı ödeme sonrası hesap tamamlama / sessiz üyelik akışına alınabilir.

Fiyat ve doğrulama notu:
1. Checkout, nihai doğrulama alanı olarak kalır.
2. Ancak tedarikçi baz fiyat değişiklikleri anlık zincirleme patlama üretmemelidir.
3. Sepetteki veya checkout’a taşınmış satırlar için kısa süreli price lock veya planlanmış batch aktivasyon modeli uygulanabilir.
4. Kullanıcıya son anda toplu fiyat bozulması yaşatmayan kontrollü fiyat geçişleri esas alınmalıdır.

Kargo notu:
1. Çoklu tedarikçi / çoklu paket sepetlerde kargo bedeli checkout’ta net ve dürüst biçimde kırılımlı gösterilmelidir.
2. Kargo bedava eşiği veya kargo sponsor kuralı platform tarafından merkezi olarak tanımlanmalıdır.
3. Kullanıcı checkout ekranında toplam kargo mantığını açıkça görmelidir; belirsiz kargo modeli bırakılmaz.
---