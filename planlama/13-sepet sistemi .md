SEPET SİSTEMİ
1. Sistem tanımı

Sepet sistemi, kullanıcının satın almayı düşündüğü ürünleri geçici olarak topladığı, karşılaştırdığı, düzenlediği ve checkout aşamasına taşımadan önce son ticari hazırlığını yaptığı dönüşüm sistemidir.

Bu sistemin görevi sadece ürün biriktirmek değildir.
Aynı zamanda:

ürün niyetini toplamak,
mağaza bağlamını korumak,
ticari uygunluğu kontrol etmek,
varyant ve adet doğruluğunu sağlamak,
kullanıcıyı checkout’a hazırlamak,
mobilde hızlı ve sürtünmesiz akış sunmaktır.

Kısa tanım:

Sepet sistemi, ürün ilgisini satın alma hazırlığına dönüştüren ticari geçiş sistemidir.

2. Sistemin ana amacı

Sepet sistemi şu görevleri yerine getirmelidir:

kullanıcının seçtiği ürünleri tek yerde toplamak
ürün, varyant ve adet doğruluğunu korumak
fiyatı kullanıcıya net göstermek
mağaza bağlamını kaybetmeden sepet düzeni kurmak
kullanıcıya ürünleri çıkarma, güncelleme ve gözden geçirme imkanı vermek
kullanıcıyı checkout’a taşımak
misafir kullanıcıyı erken kaybetmeden ticari niyeti tutmak
stok ve fiyat değişikliklerini dürüst biçimde yansıtmak
3. Sistemin ana karakteri

Sepet sistemi şu karaktere sahip olmalıdır:

hızlı
net
güven veren
düzenlenebilir
dürüst
mobil öncelikli
performanslı
ticari odaklı

Net kural:

Sepet sosyal yüzey değildir.
Burada story, post, yorum akışı gibi dikkat dağıtan alanlar baskın olmamalıdır.
Sepet bir karar tamamlama ön yüzeyidir.

4. Sepet sisteminin platform içindeki rolü

Platform akışında sepetin yeri şudur:

arama kullanıcıyı buldurur
keşfet ilgi üretir
PDP karar başlatır
sepet ticari niyeti toplar
checkout sipariş hazırlığını tamamlar
ödeme ticareti kapatır

Yani sepet, ilgi ile işlem arasındaki ilk ciddi köprüdür.

5. Sepete giriş kaynakları

Sepete ürün şu yüzeylerden eklenebilir:

5.1 PDP üzerinden

Ana ve en güvenli akıştır.

Çünkü burada:

varyant seçimi
adet seçimi
stok durumu
teslimat/fiyat bağlamı

daha net görülür. PDP zaten sepete ekle ve hemen al aksiyonlarını taşır.

5.2 Klasik ürün kart üzerinden

Klasik ürün kartta sepete ekle aksiyonu her kartta görünür.

Bu yüzden sepet sistemi klasik kartla doğrudan entegre olmalıdır.

5.3 Videolu ürün kart üzerinden

Videolu ürün kart ticari aksiyon taşıyan yüzeydir; gerektiğinde hızlı sepete ekleme sunabilir.

Ama burada kural şudur:

varyant gerektiren ürünlerde doğrudan sessiz ekleme yapılmamalı
eksik seçim varsa kullanıcı PDP’ye veya mini seçim katmanına yönlenmeli
5.4 Story üzerinden dolaylı geçiş

Story sisteminde ürün tanıtım story’lerinde “sepete ekle” aksiyonu tanımlanmıştır.

Ancak burada da kural aynı olmalı:

eksik varyant varsa önce seçim
mümkün değilse PDP’ye geçiş
6. Sepete kim ürün ekleyebilir
6.1 Misafir kullanıcı

Misafir kullanıcı sepete ürün ekleyebilir. Bu açıkça tanımlıdır.

6.2 Giriş yapmış kullanıcı

Tam yetkili sepet kullanıcısıdır.

6.3 Fenomen mağaza hesabı

Bu sistem müşteri tarafı satın alma sepetidir; fenomen panel akışı ile karıştırılmamalıdır.

7. Misafir kullanıcı sepet mantığı

*REVİZYON NOTU: Bu dosyadaki eski kural, kanonik guest checkout kararıyla güncellenmiştir.*

Bu sistemde misafir sepeti mutlaka olmalıdır.

Sebep:

kullanıcıyı çok erken login duvarına çarpmamak
niyeti kaybetmemek
mobil akışta sürtünmeyi azaltmak

Ama net kural:

misafir kullanıcı sepete ürün ekleyebilir
misafir kullanıcı sepeti görüntüleyebilir ve düzenleyebilir
misafir kullanıcı sepetten kontrollü guest checkout akışına geçebilir
checkout öncesi gerekli zorunlu veri ve doğrulamalar uygulanır
sepet varlığı sipariş garantisi değildir
guest checkout açık olsa da final doğrulama yine checkout ve payment aşamalarında eksiksiz yapılır
8. Sepetin ana veri yapısı

Sepette her satır en az şu doğrulukları taşımalıdır:

ürün kimliği
mağaza bağlamı
seçilen varyant
adet
o anki aktif satış fiyatı
satır toplamı
stok uygunluğu durumu
ürün aktif/pasif durumu
mağaza görünürlüğü durumu
medya özeti
ürün adı

Net kural:
Sepet satırı nötr ürün satırı olmamalıdır.
Platformda PDP mağaza bağlamlı açıldığı için sepette de mağaza bağlamı korunmalıdır.

9. Çok mağazalı sepet mantığı

Bu platformda aynı ürün farklı mağazalarda bulunabilir ve PDP mağaza bağlamlı açılır. Bu nedenle sepetin çok mağazalı çalışabilmesi gerekir.

Doğru model:

sepet tek yapı olabilir
ama içinde mağaza bazlı gruplama olmalıdır

Yani kullanıcı sepetinde:

Mağaza A ürünleri
Mağaza B ürünleri

ayrı bloklarda görünmelidir.

Bu yaklaşım şu faydaları sağlar:

mağaza bağlamı korunur
kullanıcı neyi kimden aldığını anlar
kargo ve teslimat farkları daha net gösterilir
platform karmaşık görünmeden düzenli kalır
10. Sepetin ana bölümleri
10.1 Sepet ürün listesi

Sepetin merkezidir.

Her satırda bulunmalıdır:

ürün görseli
ürün adı
seçilen varyant
mağaza adı / mikro bağlam
aktif fiyat
adet kontrolü
satır toplamı
sil / kaldır aksiyonu
10.2 Sepet özeti

Bulunmalıdır:

ara toplam
varsa indirim etkisi
tahmini kargo ifadesi
genel toplam mantığı
checkout’a geç butonu
10.3 Uyarı alanı

Burada dürüst ticari uyarılar verilir:

ürün stok dışı kaldı
fiyat değişti
ürün pasif oldu
varyant geçersiz hale geldi
sepetteki ürün güncellendi
11. Sepet satır davranışları
11.1 Adet artırma / azaltma

Kullanıcı ürün adedini güncelleyebilmelidir.

Kurallar:

minimum 1
stok üst sınırı aşılmaz
anlık dürüst geri bildirim verilir
11.2 Ürün kaldırma

Kullanıcı satırı tamamen silebilmelidir.

11.3 Varyant güncelleme

Varyant değiştirilebilmeli ama güvenli şekilde.

Yaklaşım:

basit ürünse satır içi olabilir
karmaşıkysa PDP’ye yönlendirme daha doğrudur
11.4 Satır geçersizleşmesi

Şu durumda satır uyarı vermelidir:

stok bitti
seçilen varyant kalktı
ürün yayından çıktı
fiyat değişti
12. Fiyat mantığı

Sepette görünen fiyat, kullanıcıya açık olan son aktif satış fiyatı olmalıdır.

Bu, klasik kart ve video kart mantığıyla uyumludur; müşteri havuz iç fiyatını görmez, yalnız aktif satış fiyatını görür.

Net kurallar:

havuz fiyatı görünmez
tedarikçi fiyatı görünmez
kullanıcı yalnız satış fiyatını görür
fiyat değişmişse sepet bunu dürüstçe yansıtmalıdır
13. Kargo gösterimi

Sepet aşamasında kargo tam ve nihai hesap olmak zorunda değildir.

Doğru yaklaşım:

sepette tahmini kargo bilgisi olabilir
nihai kargo ücreti checkout’a daha yakın netleşebilir

Bu, havuz sistemindeki kargo mantığıyla uyumludur; PDP’de tahmini kargo gösterimi olabilir, nihai ücret ödeme sürecinde netleşebilir.

14. Sepette bulunmaması gerekenler

Sepet şu alanlarla gereksiz şişirilmemelidir:

uzun ürün açıklamaları
yorum akışı
soru-cevap alanı
story akışı
mağaza post akışı
yoğun sosyal içerik
keşfet benzeri öneri duvarı

Net kural:
Sepet dikkat dağıtan içerik yüzeyi değil, işlem hazırlık yüzeyidir.

15. Sepette bulunabilecek sınırlı destek alanları

Tamamen boş da bırakılmamalı. Kontrollü ek alanlar olabilir:

15.1 Kaydedip sonra al

Ürün sepetten çıkarılıp kayıtlılara taşınabilir

15.2 Benzer ürün önerisi

Çok sınırlı ve baskın olmayan şekilde

15.3 Mağazaya dön

Kullanıcı geldiği mağazaya geri dönebilir

Ama bunlar ana aksiyonun önüne geçmemelidir.

16. “Hemen al” ile sepet farkı

PDP’de hem “sepete ekle” hem “hemen al” vardır.

Aradaki fark net olmalıdır:

Sepete ekle
ürün niyet havuzuna alınır
kullanıcı alışverişe devam edebilir
çok ürünlü alışveriş desteklenir
Hemen al
kullanıcıyı doğrudan checkout akışına iter
sepeti atlayabilir veya geçici tek ürünlü checkout mantığı açabilir

Net kural:
Hemen al, sepetin yerine geçen ana akış olmamalıdır.
Sepet ana toplama alanı olarak kalmalıdır.

17. Sepet ve stok ilişkisi

Sepet stok rezervasyonu anlamına gelmemelidir.

Bu çok önemli kuraldır.

Sepete eklenen ürün:

kullanıcı niyetini gösterir
ama ürünü kesin ayırmaz

Gerçek stok garantisi:

checkout sonu / ödeme doğrulama tarafına daha yakındır

Sepette dürüst mesaj olmalıdır:

“Sepete eklemiş olmanız ürünün sizin için ayrıldığı anlamına gelmez” benzeri ticari dürüstlük düşünülebilir
18. Sepet ve mağaza bağlamı ilişkisi

Bu platform social-commerce yapısında olduğu için mağaza bağlamı silinmemelidir.

Sepette kullanıcı şunu anlamalı:

bu ürün hangi mağazadan eklendi
hangi fenomen bağlamında karşılaştı
ürün grubu hangi mağaza bloğunda

Ama mağaza bağlamı ürün fiyat ve işlem akışının önüne geçmemelidir.

Doğru doz:

görünür
ama baskın değil
19. Sepet ve kampanya ilişkisi

Kampanya sistemi sonra ayrıca netleşecek olsa da sepette şu mantık hazır olmalıdır:

fiyat avantajı varsa dürüst görünmeli
kupon/indirim alanı olabilir ama baskın olmamalı
kampanya nedeniyle değişen fiyat satır ve özet alanında net gösterilmelidir

Burada karmaşık kampanya motoru anlatılmaz; yalnız etkisi yansıtılır.

20. Sepet hata ve dürüstlük sistemi

Sepet sistemi dürüst olmalıdır.

20.1 Fiyat değiştiyse

Kullanıcıya söylenmeli

20.2 Stok düştüyse

Kullanıcıya söylenmeli

20.3 Ürün artık satılamıyorsa

Checkout’a izin verilmemeli

20.4 Mağaza/ürün pasifse

Satır pasif uyarıya düşmeli

Bu platformun genel “dürüst durum gösterimi” yaklaşımıyla uyumludur.

21. Boş sepet durumu

Boş sepet yalnız “boş” dememelidir.

Bulunmalıdır:

sepetin boş olduğu mesajı
ana sayfaya dön
keşfete git
kategoriye git
kayıtlı ürünlere git

Bu sayede kullanıcı çıkmazda kalmaz.

22. Mobil öncelikli sepet tasarımı

Mobilde sepet çok sade olmalıdır.

Kurallar:

her satır hızlı taranmalı
görsel küçük ama yeterli olmalı
adet kontrolü tek elde kullanılabilir olmalı
checkout butonu görünür olmalı
özet alanı aşağıda kaybolmamalı
gereksiz metin yükü olmamalı

Mobilde öncelik sırası:

ürün adı
varyant
fiyat
adet
kaldır
checkout
23. Performans kuralları

Sepet hızlı çalışmalıdır.

23.1 Sepet açılışı hızlı olmalı
23.2 Satır güncelleme gecikmesi düşük olmalı
23.3 Gereksiz ağır öneri alanları yüklenmemeli
23.4 Görseller optimize gelmeli
23.5 Fiyat/stok kontrolü dürüst ama hafif çalışmalı

Sepet, “mini uygulama” gibi ağırlaşmamalıdır.

24. Sepetin diğer sistemlerle sınırları
24.1 PDP ile sınır

PDP ürün karar ve detay alanıdır
Sepet detayın yerini almaz

24.2 Checkout ile sınır

Sepet hazırlık alanıdır
adres, teslimat seçimi, ödeme onayı checkout’ta tamamlanır

24.3 Ödeme ile sınır

Sepet tahmini toplam ve hazırlık verir
ödeme ticari kapanışı yapar

24.4 Keşfet ile sınır

Keşfet ilgi üretir
sepet işlem hazırlığı yapar

24.5 Story / sosyal alanlarla sınır

Sosyal kanıt PDP ve içerik yüzeylerinde güçlü olabilir
sepette baskın hale gelmemelidir

25. Ana kurallar

Sepet sistemi için temel kurallar şunlardır:

misafir kullanıcı sepete ekleyebilir ve kontrollü guest checkout akışına geçebilir
sepet mağaza bağlamını korur
sepet çok mağazalı gruplamayı destekler
fiyat olarak yalnız aktif satış fiyatı gösterilir
havuz iç fiyatlar görünmez
sepet stok rezervasyonu değildir
varyant ve adet doğruluğu korunur
ürün geçersizleşirse dürüst uyarı verilir
sosyal içerik sepeti bastırmaz
mobilde sade ve hızlı olmalıdır
checkout’a geçiş ana aksiyondur
26. Nihai kısa özet

Sepet sistemi, kullanıcının farklı yüzeylerden seçtiği ürünleri mağaza bağlamını koruyarak topladığı, varyant-adet-fiyat doğruluğunu gözden geçirdiği ve checkout’a geçmeden önce son ticari hazırlığını yaptığı mobil öncelikli dönüşüm sistemidir.

27. Bu aşamada hazır kararlar / burada netleştirdiğimiz kararlar
Mevcut sistemlerden gelen hazır kararlar
PDP’de sepete ekle ve hemen al vardır
klasik ürün kartta sepete ekle her kartta görünür
videolu ürün kart ticari aksiyon yüzeyidir
misafir kullanıcı sepete ürün ekleyebilir ve kontrollü guest checkout ile ödeme yapabilir
müşteri havuz fiyatını görmez, aktif satış fiyatını görür
Burada netleştirdiğimiz yeni çerçeve
sepet çok mağazalı gruplamayı desteklemeli
sepet mağaza bağlamını korumalı
sepet stok rezervasyonu sayılmamalı
varyant eksikse hızlı ekleme yerine seçim/PDP yönlendirmesi olmalı
sepet sosyal yüzey değil, işlem hazırlık yüzeyi olmalı
hemen al akışı sepetin yerine geçmemeli
misafir sepeti zorunlu olmalı

#####
---
REVİZYON NOTU — 2026-04-19
Durum: Açıklama notu
Etkilediği bölüm(ler): Stok uygunluğu, rezervasyon davranışı, çoklu tedarikçi sepeti
Bağlı dosyalar: 27-merkezi stok sistemi, 14-checkout sistemi, 4-pdp sistemi

Not:
Bu dosyada sepetin niyet alanı olduğu kararı korunur. Ancak aşağıdaki davranış notları geçerlidir:

1. Sepete ekleme, kesin rezervasyon anlamına gelmez.
2. Yine de kritik düşük stok seviyesinde kullanıcıya dürüst uyarı verilmelidir.
3. Özellikle son stoklarda PDP, videolu ürün kart ve gerekiyorsa sepet yüzeyinde “son ürünler / birçok kişinin sepetinde” benzeri baskı ve dürüstlük etiketi gösterilebilir.
4. Bu etiket rezervasyon vaadi değildir; yalnız stok baskısını dürüst ileten görünürlük katmanıdır.

Çoklu tedarikçi notu:
1. Sepet tek yüzey olabilir; ama arka planda satırlar tedarikçi / paket / kargo mantığına göre ayrışabilir.
2. Bu ayrışma kullanıcıya sade ama dürüst biçimde gösterilmelidir.
3. Kargo toplamı ve olası paket ayrışması checkout öncesi görünür hale getirilmelidir.
---