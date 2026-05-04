BEĞENİ / KAYDETME / PAYLAŞMA SİSTEMİ
1. Sistem tanımı

Beğeni / kaydetme / paylaşma sistemi, ürün, story ve fenomen mağaza postu gibi yüzeylerde çalışan; kullanıcının ilgi, niyet ve yayılım davranışlarını üreten; aynı zamanda platformun ortak davranış/veri omurgasını oluşturan birleşik etkileşim sistemidir. Sistem ağacında bu üç başlık ayrı ayrı kısmen hazır sistemler olarak geçer; PDP dosyası ise bunların platform genelinde ortak etkileşim sistemi olarak çalışacağını açıkça tanımlar.

2. Sistemin ana amacı

Bu sistemin ana amacı şudur:

kullanıcının ürüne, içeriğe veya mağaza içeriğine verdiği hafif sosyal tepkiyi toplamak,
PDP, story, keşfet ve takip/post yüzeyleri arasında ortak davranış sinyali üretmek,
ilgi, niyet ve yayılım verisini standart bir omurgada tutmak,
sosyal-commerce yüzeylerini yorum zincirine dönüştürmeden canlı tutmaktır.

PDP dosyası bu üçlünün anlamını net tanımlar:

Beğen = ilgi sinyali
Kaydet = niyet sinyali
Paylaş = yayılım sinyali
3. Temel ilke

Bu sistemin temel ilkesi şudur:

Beğeni, kaydetme ve paylaşma; tek bir sayfaya özel UI öğeleri değil, platform çapında ortak davranış sinyalleridir.

Yani:

PDP’de vardır,
story sisteminde vardır,
keşfet akışında vardır,
fenomen mağaza postlarında vardır,
ama her yüzeyde aynı yoğunlukta ve aynı biçimde görünmek zorunda değildir.

PDP sistemi bunu açıkça söyler; story ve post sistemleri de bu omurgayı devralır.

4. Üç etkileşimin anlamı

Bu üç aksiyon aynı şey değildir.

4.1 Beğeni
Hafif ilgi sinyalidir. Kullanıcının “bunu sevdim / ilgimi çekti” demesidir. En düşük sürtünmeli sosyal aksiyondur.

4.2 Kaydetme
Beğeniden daha güçlü niyet sinyalidir. “Bunu sonra dönüp görmek istiyorum” veya “bunu aklımda tutuyorum” anlamı taşır. Keşfet sistemindeki “en çok kaydedilen” gibi hafif yönlendirme çipleri bu sinyalin güçlü olduğunu gösterir.

4.3 Paylaşma
Yayılım sinyalidir. İçeriğin veya ürünün başka kullanıcıya / dışarıya taşınma niyetini gösterir. Bu sistemin büyüme tarafındaki en görünür sosyal aksiyonudur.

5. Sistemin platform içindeki rolü

Akış içinde bu sistemin rolü şöyledir:

kullanıcı PDP’de ürünü görür ve tepki verir,
keşfette videolu ürün kartlarda hafif sosyal sinyal üretir,
story’de içerik tüketimi sırasında etkileşim üretir,
takip sayfasında fenomen mağaza postlarıyla ilişki kurar,
kullanıcı ürün story’leri üzerinde sosyal kanıt sinyali bırakır.

Bu nedenle sistem:

yorum sistemi değildir,
mesajlaşma sistemi değildir,
destek sistemi değildir,
ama platformun davranış omurgasıdır.
6. Hangi yüzeylerde çalışır

6.1 PDP
PDP’de beğen, kaydet ve paylaş açıkça çekirdek etkileşim katmanıdır. Kullanıcı PDP’de bu üç aksiyonu verebilir.

6.2 Story
Story sisteminde ortak sosyal aksiyon omurgası olarak aynı üçlü çalışır. Mağaza tanıtım story’si, ürün tanıtım story’si ve kullanıcı ürün story’si bu omurgayı farklı biçimlerde kullanır.

6.3 Keşfet
Keşfette videolu ürün kartlarda ortak etkileşim omurgası korunur: beğen, kaydet, paylaş ve ticari aksiyon hattı birlikte yaşar.

6.4 Fenomen mağaza postları
Post sisteminde beğen, kaydet ve paylaş vardır; ama yorum zinciri yoktur. Bu alan hafif sosyal kalır.

6.5 Takip sayfası
Takip sistemi dosyası da takip akışındaki post etkileşimlerinin hafif kalması gerektiğini ve bunların beğen, kaydet, paylaş olduğunu söyler.

6.6 Klasik ürün kart
Klasik kartta ortak etkileşim omurgası sadeleştirilmiştir:

beğen
kaydet
Paylaş burada özellikle çıkarılmıştır. Bu çok önemli bir yüzey farkıdır.
7. Hangi yüzeylerde aynı set görünmez

Bu sistem ortak omurga olsa da tüm yüzeyler aynı aksiyon setini göstermez.

Doğru model:

PDP / story / keşfet / post: beğen + kaydet + paylaş
klasik ürün kart: beğen + kaydet
işlem yüzeyleri: bu sistem baskın olmamalı

Klasik kartta paylaşın çıkarılması, küçük yüzeylerde sadelik kuralının bilinçli kararıdır.

8. Kim kullanabilir

Bu sistemin write tarafı için temel kural:

giriş yapmış kullanıcı etkileşim verebilir,
misafir kullanıcı PDP ve açık yüzeyleri görebilir ama etkileşim ve katkı tarafında sınırlıdır.

PDP dosyası misafir kullanıcının etkileşim tarafında sınırlı olduğunu açıkça belirtir. Bu nedenle beğeni/kaydetme/paylaşma write aksiyonu login gerektiren çekirdek sosyal aksiyonlar arasında değerlendirilmelidir.

9. Hedef nesneler

Bu etkileşim sistemi en az şu nesne tiplerinde çalışmalıdır:

ürün
story
fenomen mağaza postu

Şu anki dosyalarda doğrudan en net ve tutarlı hedef set budur. PDP dosyası “ürün, story, mağaza postu gibi alanlarda kullanılacaktır” diyerek bunu zaten açıklar.

10. Beğeni sistemi

Beğeni sistemi en hafif aksiyondur. Doğru model:

hızlı çalışmalı,
kullanıcıya anında geri bildirim vermeli,
sosyal sayaca bağlanabilmeli,
spam ve anlamsız etkileşim riskine karşı korunmalıdır.

PDP dosyası bu verinin kirlenmesini güncel ana risklerden biri olarak açıkça işaretler.



11. Kaydetme sistemi
Kaydetme sistemi, kullanıcının daha sonra dönmek istediği ürünleri kişisel olarak işaretlediği niyet sinyalidir.
Kaydedilen ürünler kullanıcıya özel Kaydet sayfasında görünür.
Kaydetmeler kesin özel yapıdadır.



12. Paylaşma sistemi

Paylaşma sistemi yayılım sinyalidir. Her yüzeyde gerekli değildir; küçük kartta çıkarılabilir ama PDP, story ve post gibi daha sosyal yüzeylerde anlamlıdır. Paylaşma:

büyüme sinyali üretir,
içerik veya ürünün dışa taşınma potansiyelini gösterir,
ama her yüzeyi kalabalıklaştırmamalıdır.

Bu yüzden klasik kartta olmaması bilinçli karardır.

13. Sayı görünürlüğü

Story sisteminde bazı türlerde beğeni, kaydetme ve paylaşım sayıları görünebilir; ancak ilk sürümde yüzeyi gereksiz metrikle boğmama ilkesi vardır. Doğru model:

her yerde tam sayaç zorunlu değildir,
bazı yüzeylerde yalnız ikon durumu yeterli olabilir,
daha derin metrikler içerik sahibi / admin tarafında tutulabilir.
14. Post sistemindeki sınırlar

Post sisteminde beğeni/kaydetme/paylaşma vardır; ancak:

yorum yoktur,
görünür tartışma yoktur,
post altı uzun iletişim zinciri yoktur,
repost / quote repost yoktur,
resmi destek süreci post altında yürütülmez.

Bu sınırlar çok önemlidir; aksi halde etkileşim sistemi hafif sosyal omurga olmaktan çıkıp tam sosyal ağ davranışına kayar.

15. Story sistemindeki sınırlar

Story’de aynı etkileşim omurgası vardır ama bağlam korunur. Yani:

kullanıcı story’si keşfete düşmez,
fenomen ürün story’si keşfette yer almaz,
aksiyon seti story türüne göre değişebilir,
ama beğen/kaydet/paylaş ortak omurgası korunur.

Bu, etkileşim sisteminin her yerde aynı veri ailesine ait olup her yüzeyde aynı davranış biçimine zorlanmaması gerektiğini gösterir.

16. PDP’de veri ayrımı ile ilişkisi

PDP mağaza bağlamlı açılır; ama ürün verisi, yorum, soru, story ilişkisi ortak kalır. Beğeni/kaydet/paylaş ise platform veri omurgası olarak konumlanır. Bu nedenle teknik modelde şu ayrım önemlidir:

hedef nesne ürün/story/post olabilir,
mağaza bağlamı ayrı taşınabilir,
ama etkileşim familyası ortak kalır.
PDP dosyası veri ayrımı ve etkileşim verisinin kirlenmesi riskini birlikte not eder.
17. Moderasyon ve spam riski

Bu sistemin en kritik risklerinden biri veri kirlenmesidir. PDP dosyası açıkça:

beğen-kaydet-paylaş verisinin kirlenebileceğini,
bunların platform veri omurgası olduğu için spam ve anlamsız etkileşim riskini taşıdığını
söyler. Moderasyon sistemi de etkileşim verisi moderasyonunu ayrı başlık olarak tanımlar:
yapay beğeni
seri kaydetme spam’i
bot benzeri etkileşim
anlamsız paylaşım tetikleri
şüpheli hesap davranışı
izlenmelidir.
18. Öneri / sıralama sistemi ile ilişkisi

Bu etkileşimler gelecekte öneri / sıralama sistemi için güçlü davranış sinyali olur. Sistem ağacında öneri/sıralama ayrı başlık olarak yer alır; keşfet sistemindeki “en çok kaydedilen / en çok paylaşılan” gibi hafif yönlendirme ipuçları da bu sinyallerin ileride sıralama katmanına bağlanacağını gösterir. Ancak bu aşamada sistemin rolü önce davranış omurgasını kurmaktır; tam ranking mantığı daha sonra kapatılmalıdır.

19. Beğeni ve kaydetmenin kullanıcı yüzü
Bu sistem yalnız etkileşim üretmez, aynı zamanda kullanıcı yüzünde iki ayrı görünüm oluşturur:

Beğeniler sayfası
Kaydet sayfası

Beğeni daha hafif ilgi sinyalidir; kaydetme ise daha güçlü geri dönüş niyetidir.
Beğeniler görünürlüğü kullanıcıya özel olabilir veya ayarlanabilir yapı düşünebilir.
Kaydetmeler kesin özel kalır.
Net kural:

Beğeni sistemi yalnız arka planda veri sinyali olarak bırakılmaz.
Kullanıcı yüzünde ayrı bir Beğeniler sayfası bulunur.
Kaydetme sistemi de ayrı bir Kaydet sayfası üretir.
Bu iki yüzey aynı sistem ailesine aittir; fakat aynı anlamı taşımaz ve tek sayfada eritilmez.

20. Mobil öncelikli davranış

Mobilde bu sistem:

hızlı,
tek dokunuşla çalışan,
yüzeyi boğmayan,
gerektiğinde sayaçsız da anlamını koruyan
şekilde çalışmalıdır.

Özellikle story, keşfet ve post yüzeylerinde etkileşimler içeriğin önüne geçmemeli; ama erişimi de zorlaştırmamalıdır. Story ve post sistemleri bu hafiflik ilkesini destekler.

21. Ana kurallar

Beğeni / kaydetme / paylaşma sistemi için sabitlenmesi gereken temel kurallar şunlardır:

bu üçlü platform genelinde ortak etkileşim omurgasıdır
beğeni = ilgi sinyali, kaydet = niyet sinyali, paylaş = yayılım sinyali
ürün, story ve fenomen mağaza postu üzerinde çalışır
PDP, story, keşfet ve post yüzeylerinde ortak omurga korunur
klasik kartta paylaş kaldırılabilir; beğen + kaydet kalır
misafir kullanıcı etkileşim write tarafında sınırlıdır
post sistemi altında yorum zinciri açılmaz
bu sistem tam sosyal ağ davranışına dönüşmez
veri kirlenmesi / spam / bot riski aktif olarak izlenmelidir
beğeni ve kaydetme, kullanıcı yüzünde doğrudan karşılığı olan iki ayrı liste görünümü üretir
öneri/sıralama sistemine ileride güçlü sinyal sağlar
yüzey bağlamı korunur; aynı sistem her yüzde aynı yoğunlukta görünmek zorunda değildir.
kullanıcının beğendiği ürünler beğeniler sayfasında görünür
kullanıcının kaydettiği ürünler kaydet sayfasında görünür
beğeni görünürlüğü kullanıcıya özel veya ayarlanabilir olabilir
kaydet görünürlüğü kesin özeldir
22. Nihai kısa özet

Beğeni / kaydetme / paylaşma sistemi, ürün, story ve fenomen mağaza postu gibi yüzeylerde çalışan; ilgi, niyet ve yayılım davranışlarını standartlaştıran; PDP’de veri omurgası olarak tanımlanan; keşfet, story ve takip/post alanlarında hafif sosyal etkileşim katmanı oluşturan; ama yorum zinciri veya tam sosyal ağ yapısına dönüşmeden platformun ortak davranış sinyal sistemini kuran birleşik etkileşim omurgasıdır.