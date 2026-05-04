VARYANT SİSTEMİ
1. Sistem tanımı

Varyant sistemi, tek bir ürünün aynı ticari kimlik altında birden fazla seçilebilir alt formda sunulmasını sağlayan; renk, beden, numara, hacim, gramaj, ölçü ve model farkı gibi eksenleri yöneten; stok, fiyat, ürün kodu ve seçim doğruluğunu varyant bazında taşıyan ürün alt-yapı sistemidir. Havuz sisteminde varyant yapısının 1. havuzun ana amaçlarından biri olduğu açıkça belirtilir; Modül Yapısı ve Ticaret Çekirdeği dokümanlarında da varyant, ticari omurganın ayrı alt modülü olarak tanımlanır.

2. Sistemin ana amacı

Varyant sisteminin ana amacı şudur:

ürünün birden fazla satılabilir seçeneğini tek ürün ailesi altında düzenlemek,
stok ve baz fiyatı gerektiğinde varyant bazında taşımak,
PDP, mini PDP, sepet, checkout ve siparişte doğru seçimin yapılmasını sağlamak,
yanlış ürün / yanlış beden / yanlış renk riskini azaltmak,
katalog netliğini korurken ticari doğruluğu arttırmaktır.
Havuz dosyasında “varyant yapısını kurmak” kabul havuzunun çekirdek amaçlarından biri olarak sayılır.
3. Temel ilke

Bu sistem için temel ilke şudur:

Varyant, yalnız görsel seçenek değil; satılabilir ticari alt birimdir.

Bu ne demek:

varyantın ayrı stok bilgisi olabilir,
varyantın ayrı baz fiyatı olabilir,
varyantın ayrı ürün kodu olabilir,
varyant seçimi yapılmadan ticari akış tamamlanamaz.

Ticaret Çekirdeği LOCK dosyasında “varyantlı üründe varyant seçilmeden sepete eklenemez” kuralı açıkça sabittir. Checkout dosyasında da varyant geçerliliği ve seçiminin final doğrulama konusu olduğu yazılıdır.

4. Varyant sisteminin platform içindeki rolü

Akış sırası içinde varyant sisteminin rolü şöyledir:

ürün kabul aşamasında varyant yapısı kuruluyor,
PDP ve mini PDP’de kullanıcıya seçim alanı açıyor,
sepette seçilmiş varyant snapshot olarak taşınıyor,
checkout’ta varyant geçerliliği ve stok/fiyat yeniden doğrulanıyor,
siparişte seçilmiş varyant resmi satış satırına dönüşüyor,
iade, teslimat ve destek süreçleri de varyant bazlı gerçeklik üzerinden yürüyor.
Bu yüzden varyant sistemi yalnız ürün detay alanının bir parçası değil; ticari doğruluk omurgasının parçasıdır.
5. Varyant eksenleri

Mevcut dosyalara göre desteklenecek temel varyant eksenleri şunlardır:

renk
beden
numara
hacim
gramaj
ölçü
model farkı

Modül Yapısı’nda ayrıca kapasite de varyant ekseni olarak geçer. Bu nedenle sistem kategoriye göre uygun ekseni açmalıdır; her ürüne her varyant tipi uygulanmaz.

6. Kategoriye göre varyant

Varyant sistemi ürün tipine göre çalışmalıdır. Örneğin:

giyimde beden / renk
ayakkabıda numara / renk
kozmetikte hacim / ton
ev ürünlerinde ölçü
teknolojide kapasite / model farkı

Bu yaklaşım, havuz dosyasındaki örnek varyant alanları ve Modül Yapısı’ndaki varyant modülü ile uyumludur. Yani varyant sistemi sabit tek şablon değil; kategori duyarlı yapı olmalıdır.

7. Varyant veri yapısı

Her varyant için gerektiğinde ayrı ayrı şu alanlar tutulmalıdır:

stok
baz fiyat
görsel
ürün kodu

Havuz sistemi bunu doğrudan açıkça yazar. Dolayısıyla doğru model, varyantı yalnız seçim label’ı gibi değil; gerektiğinde bağımsız stok/fiyat/SKU taşıyan alt kayıt olarak ele almaktır.

8. Ürün kabul aşamasında varyant

Tedarikçi ürün yüklerken varyantlı yapıyı 1. havuzda girmek zorundadır. Kabul sistemi şu kontrolleri yapmalıdır:

varyant ekseni tutarlı mı,
varyant değerleri eksik mi,
aynı varyant kombinasyonu iki kez girilmiş mi,
stok/fiyat alanları gerekli yerde eksik mi,
varyant ürün kodları çakışıyor mu.

Havuz sisteminde varyant bazlı girişin kabul edildiği ve varyant yapısının 1. havuzda kurulduğu açık olduğundan, bu kontrol hattı kabul sisteminin doğal parçasıdır.

9. Platform kontrolü

Tedarikçi varyantı girer ama nihai doğruluk platform kontrolündedir. Çünkü 1. havuz kabul alanıdır ve ürünler doğrulama, sınıflandırma ve manuel düzeltme hattından geçer. Yanlış varyant yapısı da bu kapsamda değerlendirilmelidir. Onaysız veya bozuk varyantlı ürün 2. havuza geçmemelidir.

10. Varyant ve 2. havuz ilişkisi
havuzdan geçen ürün 2. havuza geçerken platform ticari hazırlık yapar. Varyant baz fiyat taşıyorsa bu, 2. havuz ticari hesaplamasına girdi olmalıdır. Yani:
ürün bazında ortak ticari çerçeve olabilir,
ama varyant baz fiyat farkı varsa platform kârı bu taban üzerinden hesaplanır,
sonuçta fenomene açılan satış koridoru da gerektiğinde varyant bazlı etkilenebilir.

Modül Yapısı’nda “varyant bazlı fiyat” açıkça yazılıdır; havuz sisteminde de varyant için ayrı baz fiyat girilebildiği belirtilir.

11. PDP’de varyant sistemi

PDP’de varyant yapısı ürünün çekirdek bilgi katmanının parçasıdır. PDP dosyası açıkça varyant yapısının ürün çekirdek katmanında yer aldığını ve ticari karar katmanında varyanta göre fiyat, stok ve teslimat farkı gösterilebildiğini söyler. Bu nedenle PDP, varyant seçiminde ana karar yüzeyidir.

12. Mini PDP / video kartta varyant sistemi

Videolu ürün kart sisteminde mini PDP içinde yalnız temel varyantlar bulunabilir; örneğin renk ve beden. Adet alanı da bulunur. Ancak burada iki önemli kural vardır:

mini PDP tam PDP değildir; derin karar alanı değildir,
varyant-medya ilişkisi otomatik yeniden kurulmaz; renk veya beden seçimi görsel/video galerisini varyanta göre yeniden kurgulamaz.

Ayrıca ürün tipine göre farklı kod yolları açılmayacağı, standart ticari aksiyon mantığının korunacağı da açıkça yazılmıştır. Bu, ilk faz için önemli bir sadelik kararıdır.

13. Varyant seçimi zorunluluğu

Varyantlı üründe varyant seçimi zorunludur. Ticaret Çekirdeği LOCK dosyasında bu kural doğrudan yer alır; checkout sisteminde de “varyantlı üründe varyant seçilmiş olmalı” koşulu açıkça yazılmıştır. Yani sistem şu şekilde çalışmalıdır:

varyantlı ürün seçimsiz sepete eklenemez,
seçimsiz satır checkout’a taşınamaz,
geçersiz varyant seçimi ödeme aşamasına ilerleyemez.
14. Sepette varyant

Sepette her satır seçilmiş varyantla birlikte tutulmalıdır. Sepet modülünde fiyat snapshot kavramı yer aldığı için doğru model:

seçilmiş varyant
adet
fiyat snapshot
mağaza bağlamı
satır kimliği
birlikte tutulur.
Sepet fiyatı nihai truth değildir; ama sepet varyant snapshot taşır. Checkout dosyası bunu final doğrulama ile tamamlar.
15. Checkout’ta varyant doğrulama

Checkout’un ana rolü final doğrulamadır. Bu yüzden checkout şu kontrolleri yeniden yapmalıdır:

varyant geçerli mi,
varyant silinmiş mi,
stok yeterli mi,
aktif satış fiyatı doğru mu,
ürün hâlâ aktif ve görünür mü,
satır checkout’a taşınabilir mi.

Checkout dosyası bu maddeleri açıkça listeler ve bloke alanında “varyant silindi” uyarısını örnek verir. Bu çok kritik bir kuraldır: sepette duran varyant, checkout anında tekrar doğrulanmalıdır.

16. Siparişte varyant

Sipariş oluştuğunda seçilmiş varyant artık resmi satış gerçeğinin parçası olur. Modül Yapısı ve Ticaret Çekirdeği dokümanlarındaki satır bazlı ticari omurga buna dayanır. Bu nedenle sipariş satırı en az:

ürün kimliği
seçilmiş varyant
adet
satır fiyatı
satır toplamı
taşımalıdır. Varyant daha sonra teslimat, iade, destek ve yanlış ürün/yanlış beden senaryolarında da referans olur.
17. Stok ile ilişki

Varyant sistemi stok sisteminden ayrı değildir; onunla sıkı bağlıdır. Modül Yapısı’nda hem varyant bazlı stok hem rezervasyon hem oversell koruma açıkça yer alır. Bu nedenle doğru model:

stok ürün bazında değil, gerektiğinde varyant bazında tutulur,
rezervasyon varyant seviyesinde çalışabilir,
oversell koruma varyant seviyesinde de uygulanır,
iade sonrası stok geri kazanımı varyant referansıyla yapılmalıdır.
18. Fiyat ile ilişki

Modül Yapısı’nda “varyant bazlı fiyat” açıkça yazılıdır. Bu nedenle varyant sistemi fiyatlandırma modülünden bağımsız düşünülemez. Doğru model:

bazı ürünlerde tüm varyantlar aynı ticari tabana sahip olabilir,
bazı ürünlerde varyant farkı fiyat farkı doğurur,
fiyat farkı checkout ve siparişte doğru satıra taşınmalıdır,
fenomene açılan koridor gerekirse varyant bazlı hesaplanabilir.
19. Medya ile ilişki

İlk faz için önemli kapalı karar şudur:
Varyant seçimi ile medya otomatik değişmez.
Videolu ürün kart sistemi bunu açıkça kapatıyor. Bu karar ilk faz için teknik karmaşıklığı azaltır. Ancak havuz dosyasında varyant için gerektiğinde ayrı görsel girilebileceği de yazılıdır. Doğru okuma şu olur:

veri katmanında varyanta özel görsel bulunabilir,
ama ilk faz kullanıcı deneyiminde varyant seçince otomatik medya yeniden kurgulanmaz.

Bu ikisi çelişki değil; ilki veri kapasitesi, ikincisi UX sadelik kararıdır.

20. Hata ve risk alanları

Varyant sisteminde ana riskler şunlardır:

varyant seçilmeden sepete ekleme denemesi
aynı kombinasyonun birden fazla kez tanımlanması
stoksuz varyantın satılmaya çalışılması
silinmiş/geçersiz varyantın sepette kalması
yanlış beden / yanlış renk nedeniyle destek ve iade yükü
varyant fiyat farkının yanlış yansıması

Checkout ve Ticaret Çekirdeği dosyaları özellikle seçimsiz varyant ve geçersiz varyant riskini doğrudan iş kuralı seviyesinde işaretler.

21. Fenomen tarafı sınırı

Fenomen mağaza varyant sisteminin owner’ı değildir. Fenomen:

onaylı ürünü vitrinler,
ürünü mağazasına ekler,
fiyat koridoru içinde seçim yapar,
sınırlı medya/dokunuş katmanı ekleyebilir;

ama ürünün ana varyant yapısını değiştiremez. Havuz sistemindeki “ürünün ana bilgilerini değiştiremez” kuralı buna doğrudan uygulanır. Varyant ana ürün gerçeğinin parçasıdır.

22. Ana kurallar

Varyant sistemi için sabitlenmesi gereken temel kurallar şunlardır:

varyant sistemi ayrı ana ticari alt modüldür
varyant, seçim label’ı değil satılabilir ticari alt birimdir
varyant ekseni kategoriye göre değişir
her varyant için gerektiğinde ayrı stok, baz fiyat, görsel ve ürün kodu tutulur
varyant yapısı 1. havuzda kurulur ve platform kontrolünden geçer
bozuk veya eksik varyantlı ürün 2. havuza geçmez
varyantlı üründe varyant seçimi olmadan sepete ekleme olmaz
sepet varyant snapshot taşır
checkout varyant geçerliliğini yeniden doğrular
geçersiz/silinmiş varyant checkout’u bloklar
sipariş satırı seçilmiş varyantı resmi kayıt olarak taşır
ilk fazda varyant seçimi medyayı otomatik yeniden kurgulamaz
fenomen mağaza varyant gerçeğini değiştiremez.
23. Nihai kısa özet

Varyant sistemi, ürünün renk, beden, numara, hacim, gramaj, ölçü ve model farkı gibi seçilebilir alt formlarını yöneten; gerektiğinde varyant bazlı stok, baz fiyat, görsel ve ürün kodu taşıyan; 1. havuzda kurulan ve platform kontrolünden geçen; PDP’de kullanıcıya seçim açan; sepette snapshot, checkout’ta final doğrulama ve siparişte resmi satış satırı gerçeği olarak çalışan temel ticari alt sistemdir.