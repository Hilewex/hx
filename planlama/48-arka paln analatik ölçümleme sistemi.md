ARKA PLAN ANALİTİK / ÖLÇÜMLEME SİSTEMİ
1. Sistem tanımı

Arka plan analitik / ölçümleme sistemi, platform içindeki kullanıcı davranışlarını, mağaza etkileşimlerini, ürün performansını, sipariş dönüşümünü, operasyon kalitesini, içerik tüketimini ve finansal etkileri olay bazlı biçimde toplayan; bunları standardize eden; raporlama, optimizasyon, öneri/sıralama, fraud, admin görünürlüğü ve ürün geliştirme süreçlerine veri sağlayan merkezi ölçümleme sistemidir.

Bu sistemin görevi yalnız sayaç tutmak değildir. Aynı zamanda:

davranış verisi toplamak
yüzey bazlı performansı ölçmek
dönüşüm hunisini görmek
içerik ve ticari akışın etkisini anlamak
mağaza ve tedarikçi kalite sinyali üretmek
öneri/sıralama sistemine sinyal sağlamak
admin ve operasyon sistemlerine karar verisi üretmektir

Kısa tanım:

Arka plan analitik / ölçümleme sistemi, platformun veri ve karar omurgasını besleyen merkezi ölçümleme altyapısıdır.

2. Temel ilke

Bu sistemin temel ilkesi şudur:

Ölçülmeyen davranış yönetilemez; ama her veri de aynı değerde değildir.

Yani:

her tıklama tek başına anlamlı değildir
bağlamsız event yığını değer üretmez
ölçüm sistemi yüzey, aktör, nesne ve sonuç bağlamı ile çalışmalıdır
gereksiz veri gürültüsü azaltılmalıdır
iş kararına dönüşen sinyaller ayrıştırılmalıdır

Net kural:

ölçümleme sistemi ham event çöplüğü değil, kurallı sinyal üretim sistemi olmalıdır.

3. Sistemin platform içindeki rolü

Bu sistem şu alanlara veri sağlar:

öneri / sıralama sistemi
admin sistemi
fenomen yönetim sistemi
tedarikçi yönetim sistemi
sipariş operasyon sistemi
finansal mutabakat sistemi
kupon sistemi
moderasyon sistemi
fraud / risk sistemleri
ürün ve UX kararları

Yani bu sistem:

doğrudan kullanıcıya görünmeyebilir
ama platformun neredeyse tüm akıllı karar mekanizmalarının arkasında çalışır

Net kural:

ölçümleme sistemi karar vermez; karar sistemlerini besler.

4. Bu sistem neden ayrı ana sistemdir

Şu an platformda çok fazla davranış hattı var:

ana sayfa
keşfet
kategori/PLP
PDP
fenomen mağazası
story
video kartlar
klasik kartlar
takip akışı
arama
sepet
checkout
ödeme
sipariş
bildirim
destek
yorum
soru-cevap
kupon
puan sistemi

Bu kadar çok yüzey ve akışta, veri başka dosyaların içine dağınık biçimde bırakılırsa:

neyin çalıştığı anlaşılmaz
neyin dönüşüm ürettiği bilinmez
öneri sistemi zayıf kalır
mağaza kalitesi objektif ölçülemez
tedarikçi kalitesi doğru izlenemez
yanlış karar alınır

Bu yüzden analitik / ölçümleme sistemi ayrı ana sistem olmalıdır.

5. Sistem neyi ölçer

Bu sistem en az 6 ana sinyal ailesi üretmelidir:

5.1 Davranış sinyalleri

Kullanıcının yüzeylerde ne yaptığı

5.2 İçerik sinyalleri

Story, video, post ve medya tüketim etkileri

5.3 Ticari sinyaller

Sepet, checkout, ödeme, sipariş dönüşümü

5.4 Operasyon sinyalleri

Hazırlama, sevkiyat, gecikme, iade, destek

5.5 Kalite sinyalleri

Fenomen, tedarikçi, ürün, içerik kalitesi

5.6 Finansal sinyaller

Kupon etkisi, hakediş etkisi, iade maliyeti, kârlılık görünürlüğü

6. Ölçüm katmanları

Bu sistem tek katmanlı olmamalıdır. En az 4 katmanla çalışmalıdır.

6.1 Ham event katmanı

Olaylar burada toplanır.

Örnek:

ürün görüntülendi
story açıldı
ürün kaydedildi
kupon uygulandı
sipariş oluştu
6.2 Normalize event katmanı

Ham event’ler standart şemaya çevrilir.

Örnek alanlar:

event_name
actor_type
actor_id
surface
object_type
object_id
timestamp
session_id
context
6.3 Türetilmiş metrik katmanı

İş kararına yarayan anlamlı metrikler burada oluşur.

Örnek:

mağaza bazlı dönüşüm
ürün görüntüleme → sepete ekleme oranı
story → PDP tıklama oranı
kupon kullanım etkisi
6.4 Karar sinyali katmanı

Diğer sistemleri besleyen sinyal setleri burada oluşur.

Örnek:

fenomen kalite skoru
tedarikçi operasyon güvenilirlik skoru
içerik performans skoru
ürün ilgi skoru
mağaza canlılık skoru
7. Ölçülmesi gereken ana yüzeyler

Bu platform için minimum ölçüm yüzeyleri şunlardır:

ana sayfa
keşfet
kategori / PLP
PDP
fenomen mağaza sayfası
story görünümü
video kart görünümü
takip sayfası
arama sonuçları
sepet
checkout
ödeme
sipariş takip
bildirim merkezi
destek girişleri
beğeni sayfası
kaydet sayfası

Net kural:

ölçümleme yalnız satış sayfalarında değil, tüm kritik dolaşım yüzeylerinde çalışmalıdır.

8. Kullanıcı davranış metrikleri

Bu sistem kullanıcının şu temel davranışlarını izlemelidir:

görüntüleme
scroll derinliği
tıklama
ürün kart etkileşimi
story açma / tamamlama / geçme
video oynatma / izleme süresi
beğeni
kaydetme
paylaşma
takip etme
soru sorma
yorum gönderme
story yükleme
kupon kullanma
sepete ekleme
checkout başlatma
ödeme deneme
sipariş oluşturma

Ama net kural:

yalnız event saymak yetmez
bunların hangi yüzeyde, hangi bağlamda ve neye dönüştüğü de ölçülmelidir
9. İçerik performans ölçümü

Bu platform sosyal-commerce yapıda olduğu için içerik ölçümü kritik.

Ölçülmesi gereken içerik alanları:

Story için
görüntülenme
tamamlanma oranı
erken çıkış
swipe geçiş
PDP tıklaması
mağaza ziyareti
beğeni / kaydetme / paylaşma
ürün etiketi tıklama
Video ürün kart için
oynatma
izleme süresi
tekrar oynatma
sessizden sesliye geçiş
PDP geçişi
sepete ekleme etkisi
Post için
gösterim
etkileşim
mağazaya dönüş
ürüne geçiş
takip etkisi

Net kural:

içerik ölçümü vanity metric değil, ticari ve ilişki etkisiyle birlikte çalışmalıdır.

10. Ticari funnel ölçümü

Bu sistem ticari dönüşüm zincirini uçtan uca ölçmelidir.

Minimum funnel:

impression
click
PDP enter
variant selection
add to cart
cart review
checkout start
address complete
payment start
payment success
order created
delivered
review/story contribution

Bu ölçüm sayesinde şu sorular cevaplanır:

en çok kayıp hangi adımda
hangi yüzey daha çok sepete ekleme üretiyor
hangi mağaza daha yüksek dönüşüm alıyor
hangi kupon gerçekten sipariş artırıyor
hangi story tipi ürün kararını etkiliyor
11. Fenomen mağaza analitiği

Fenomen mağazaları için ayrı sinyal ailesi olmalıdır.

Ölçülmesi gerekenler:

mağaza ziyaret sayısı
ziyaret → ürün tıklama oranı
ziyaret → takip oranı
mağaza → PDP geçiş oranı
mağaza → sepete ekleme oranı
mağaza → sipariş dönüşüm oranı
story etkisi
post etkisi
video etkisi
kupon etkisi
takipçi büyümesi
mağaza canlılık skoru
iade etkisi
müşteri memnuniyet sinyali

Bu veriler:

fenomen paneline sade özet olarak
admin/fenomen yönetim sistemine detaylı sinyal olarak gitmelidir
12. Tedarikçi analitiği

Tedarikçi için de ayrı ölçüm gerekir.

Ölçülmesi gerekenler:

ürün onay oranı
red oranı
revizyon oranı
stok doğruluğu
baz fiyat değişim sıklığı
sevkiyat hızı
geç hazırlama oranı
iptal etkisi
iade kalite etkisi
kategori bazlı performans
en sorunlu ürün setleri

Bu veriler tedarikçi yönetim sistemi ve admin sistemi için temel sinyal üretir.

13. Ürün analitiği

Ürün bazlı ölçüm çok kritik olmalıdır.

Her ürün için en az:

gösterim
kart tıklama
PDP görüntüleme
varyant seçimi
kaydetme
paylaşma
sepete ekleme
checkout’a geçiş
siparişe dönüşüm
iade oranı
yorum puanı
kullanıcı story katkısı
mağaza bazlı performans farkı

ölçülmelidir.

Net kural:

aynı ürün farklı mağazalarda farklı performans gösterebilir; analitik bunu ayırabilmelidir.

14. Kupon ve kampanya analitiği

Bu sistem kupon ve kampanya etkisini ayrı ölçmelidir.

Kupon için:

kupon gösterim etkisi
kullanım sayısı
kullanım oranı
sepete etkisi
checkout tamamlama etkisi
yeni kullanıcı etkisi
mağaza bazlı etki
sponsor maliyet etkisi
iade sonrası gerçek etki

Kampanya için:

kampanyalı ürün görüntüleme
kampanya kaynaklı satış artışı
kampanya → kupon çakışma etkisi
kârlılık değişimi

Net kural:

indirim hacmi değil, net ticari fayda ölçülmelidir.

15. Operasyon ve teslimat analitiği

Bu sistem sipariş sonrası kaliteyi de ölçmelidir.

Ölçülmesi gerekenler:

hazırlanma süresi
sevkiyat gecikmesi
teslimat süresi
problemli sipariş oranı
destek teması oranı
iade oranı
iade nedeni dağılımı
tedarikçi bazlı operasyon kalitesi
kategori bazlı problem yoğunluğu

Bu metrikler:

sipariş operasyon sistemi
tedarikçi yönetimi
finansal mutabakat
destek
için karar sinyali üretir
16. Moderasyon ve güven analitiği

Bu sistem yalnız satış değil, güven tarafını da ölçmelidir.

Ölçülmesi gerekenler:

raporlanan içerik oranı
moderasyon red oranı
mağaza bazlı ihlal yoğunluğu
kullanıcı story onay/red oranı
yorum kalite sorunu
post spam sinyalleri
soru-cevap problem oranı
anormal beğeni/kaydetme davranışı

Bu veriler moderasyon ve fraud sistemlerine gider.

17. Finansal analitik

Bu sistem finansal mutabakat sisteminden beslenerek şu görünürlükleri üretmelidir:

net satış
iade sonrası gerçek satış
kupon maliyeti
sponsor bazlı indirim yükü
mağaza bazlı hakediş etkisi
tedarikçi bazlı hakediş etkisi
kategori bazlı kârlılık görünümü
kampanya gerçek maliyeti
yüksek riskli finansal anomali

Net kural:

ciro ile gerçek değer aynı şey değildir; analitik bunu ayırmalıdır.

18. Ölçümleme kimlikleri ve bağlam alanları

Her event en az şu bağlamları taşımalıdır:

user_id veya anonymous_id
session_id
actor_type
surface
surface_instance
object_type
object_id
store_id
supplier_id gerekiyorsa
product_id gerekiyorsa
campaign_id / coupon_id varsa
timestamp
device_type
app/web context
referrer context

Bu bağlamlar olmadan veri karar üretmez.

19. Gerçek zamanlı ve toplu katman

Bu sistem iki hızda çalışmalıdır:

19.1 Yakın gerçek zamanlı katman

Dashboard, bildirim, hızlı alarm, kupon abuse, operasyon darboğazı, trend içerik sinyali için

19.2 Toplu / dönemsel katman

Günlük, haftalık, aylık raporlar; kalite skorları; performans özetleri; uzun dönem analiz için

Net kural:

her veri gerçek zamanlı olmak zorunda değildir; ama kritik operasyon ve risk sinyalleri gecikmemelidir.

20. Admin sistemi ile ilişki

Admin panelinde görülen özetlerin arkasındaki veri kaynağı bu sistem olmalıdır.

Admin burada şunları görür:

hangi mağaza yükseliyor
hangi tedarikçi bozuluyor
hangi ürün çok ilgi alıyor ama satmıyor
hangi kupon zarar yazıyor
hangi yüzey dönüşüm kaybediyor
hangi kategori yüksek iade üretiyor

Ama admin panel analitik sistemi değildir; yalnız onun görünüm katmanıdır.

21. Fenomen ve tedarikçi panelleri ile ilişki

Bu sistem doğrudan görünmez; ama panellere özet veri sağlar.

Fenomen paneline giden özetler
mağaza ziyaretleri
takipçi artışı
en çok etkileşim alan içerikler
en çok satan ürünler
kupon etkisi
satış dönüşüm özeti
Tedarikçi paneline giden özetler
ürün onay/red oranı
stok doğruluk sinyali
sevkiyat hızı
en problemli ürünler
iade kalite etkisi

Yani panelde görülen performans kartları bu sistemden beslenir.

22. Fraud / risk ilişkisi

Ölçümleme sistemi fraud/risk tarafına kritik sinyal üretmelidir.

Örnek risk sinyalleri:

anormal kupon kullanımı
sahte etkileşim patlaması
bot benzeri beğeni/kaydetme
kısa sürede yapay mağaza trafik şişmesi
kupon → iade döngüsü
çoklu hesap davranış benzerliği
anormal satış / iade paterni

Net kural:

ölçümleme sistemi yalnız rapor değil, risk erken uyarı kaynağı da olmalıdır.

23. Veri kalite kuralları

Bu sistemin kendisi de disiplinli olmalıdır.

Ana kurallar:

event isimleri standart olmalı
aynı olay farklı ekiplerde farklı adla loglanmamalı
event versiyonlaması olmalı
kritik event’ler kayıpsız taşınmalı
deduplication mantığı olmalı
test / staging / prod ayrımı net olmalı
event şeması değişince geriye dönük uyum gözetilmeli

Net kural:

ölçümleme sistemi kirli olursa, ondan beslenen tüm karar sistemleri bozulur.

24. Audit ve kayıt

Analitik sistemi her şeyi audit sistemi gibi tutmaz; ama şu alanlar kayıt güvenliği açısından önemli olmalıdır:

event alındı mı
işlendi mi
reddedildi mi
şema hatası var mı
duplicate mi
hangi pipeline katmanına geçti
hangi karar sinyaline dönüştü

Bu özellikle kritik finansal ve operasyonel event’lerde önemlidir.

25. Kritik edge case kararları
kullanıcı anonim başladı, login oldu → anonim davranış uygun kuralla kullanıcıya bağlanmalı
aynı ürün farklı mağazalarda satılıyor → mağaza bağlamı korunmalı
story izlendi ama ürün tıklanmadı → içerik tüketimi ile ticari etki ayrılmalı
kupon uygulandı ama sipariş tamamlanmadı → abandon sinyali yazılmalı
sipariş oluştu ama sonra iptal/iade oldu → net satış yeniden hesaplanmalı
aynı event iki kez geldi → duplicate kontrolü çalışmalı
fenomen askıya alındı → yeni performans akışı ayrıştırılmalı
ürün havuzdan kalktı → tarihsel veri korunmalı ama aktif veri bağlamı ayrılmalı
26. Ana kurallar

Arka plan analitik / ölçümleme sistemi için sabitlenmesi gereken temel kurallar şunlardır:

bu sistem merkezi ölçümleme omurgasıdır
öneri / sıralama sisteminin yerine geçmez, onu besler
admin panelinin yerine geçmez, ona veri sağlar
kullanıcı davranışı, içerik etkisi, ticari funnel, operasyon kalitesi ve finansal sonuç birlikte ölçülmelidir
event’ler bağlamlı ve standart şemalı olmalıdır
yüzey, aktör, nesne ve sonuç bağlamı korunmalıdır
mağaza bazlı, ürün bazlı ve tedarikçi bazlı ayrım yapılmalıdır
veri gürültüsü azaltılmalı, karar sinyali üretilmelidir
fraud ve risk sistemlerine erken sinyal sağlamalıdır
kritik veri kalite kuralları uygulanmalıdır
27. Nihai kısa özet

Arka plan analitik / ölçümleme sistemi, platform içindeki kullanıcı davranışı, içerik tüketimi, ticari dönüşüm, operasyon kalitesi, kupon/kampanya etkisi ve finansal sonuçları olay bazlı toplayan; bunları standartlaştırıp türetilmiş metrik ve karar sinyallerine dönüştüren; öneri/sıralama, admin, fenomen/tedarikçi yönetimi, risk ve ürün geliştirme taraflarını besleyen merkezi veri ve ölçümleme omurgasıdır.