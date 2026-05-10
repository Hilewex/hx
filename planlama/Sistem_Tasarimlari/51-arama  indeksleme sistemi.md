ARAMA RETRIEVAL / İNDEKSLEME ALTYAPI SİSTEMİ
1. Sistem tanımı

Arama retrieval / indeksleme altyapı sistemi, platformdaki ürün, mağaza, kategori, özellik, varyant, içerik ve niyetle ilişkili alanları standartlaştırarak aranabilir indekslere dönüştüren; sorgu anında uygun aday seti üreten; filtre/facet hesaplayan; typo, eşanlam ve niyet çözümünü destekleyen; arama yüzeylerine teknik temel sağlayan merkezi arama altyapı sistemidir.

Bu sistemin görevi yalnız metin eşleştirmek değildir. Aynı zamanda:

ürünleri aranabilir hale getirmek
mağaza ve kategori sonuçlarını ayrı alanlarda yönetmek
filtre ve facet sayımını üretmek
typo toleransı sağlamak
eşanlam / varyasyon desteği vermek
aday set üretmek
sorgu niyetine göre doğru retrieval yolu seçmek
arama performansını ölçeklenebilir kılmaktır

Kısa tanım:

Arama retrieval / indeksleme altyapı sistemi, platformun buldurma ve aday üretme motorudur.

2. Temel ilke

Bu sistemin temel ilkesi şudur:

Arama kutusu tek olabilir; ama arka plandaki retrieval tek tip olmak zorunda değildir.

Yani:

genel platform araması ayrı retrieval mantığı kullanabilir
keşfet araması ayrı retrieval mantığı kullanabilir
katalog / ürün araması ayrı retrieval mantığı kullanabilir
mağaza araması ayrı alan kullanabilir

Arama sistemi dosyasında da açıkça tek arama kutusu olsa bile tek tip arama davranışı olmaması gerektiği söyleniyor. Bu sistem, o ilkenin teknik altyapısıdır.

Net kural:

kullanıcı tek arama deneyimi görebilir; ama içeride birden fazla retrieval hattı olabilir.

3. Sistemin platform içindeki rolü

Bu sistem şu alanlarla doğrudan ilişkilidir:

arama sistemi
kategori / PLP sistemi
keşfet sistemi
fenomen mağaza sistemi
ürün kabul / onay sistemi
varyant sistemi
merkezi stok sistemi
merkezi fiyat sistemi
öneri / sıralama sistemi
analitik / ölçümleme sistemi
admin sistemi

Doğru akış şu olmalıdır:

ürün / mağaza / kategori / içerik truth’ları değişir
indeksleme sistemi uygun kayıtları günceller
sorgu geldiğinde retrieval aday seti çıkarır
gerekiyorsa facet / filtre üretir
sonra sıralama sistemi bunu rerank eder
sonuç arama yüzeyine gider

Net kural:

retrieval sistemi truth owner değildir; truth’leri aranabilir hale getiren katmandır.

4. Bu sistem neden ayrı ana sistemdir

Şu an platformda aramaya girecek çok fazla alan var:

ürün adı
açıklama
marka
kategori
alt kategori
varyant özellikleri
mağaza adı
mağaza açıklaması
kampanya etiketi
fiyat aralığı
stok uygunluğu
video destekli ürünler
niyet bazlı arama

Bunları yalnız UI seviyesinde düşünmek yetersiz kalır.

Ayrı sistem gerekir çünkü:

çok hızlı cevap vermeli
facet ve filtre desteği olmalı
typo toleransı olmalı
kategori/ürün/mağaza ayrımı yapmalı
öneri/sıralama sistemine doğru aday vermeli
stok/fiyat/pasif ürün gibi alanları güncel tutmalı

Bu yüzden retrieval / indeksleme altyapısı ayrı sistem olmalıdır.

5. Ana retrieval alanları

Bu sistem en az 4 ana retrieval alanı taşımalıdır.

5.1 Ürün retrieval alanı

Ürün araması için ana omurga

5.2 Mağaza retrieval alanı

Fenomen mağazası buldurma için

5.3 Kategori / taksonomi retrieval alanı

Kategori ve alt kategori yönlendirmesi için

5.4 Keşif / video ağırlıklı retrieval alanı

Keşfet aramasında video merkezli ürün adayları için

Net kural:

aynı indeks her şeyi taşımaya çalışmamalı; alan bazlı ayrım olmalıdır.

6. İndekslenen ana varlıklar

Minimum indeks varlıkları şunlardır:

ürün
ürün varyantı türev bilgileri
marka
kategori
alt kategori
fenomen mağazası
kampanya etiketleri
stok uygunluk özetleri
fiyat bandı özetleri
medya tipi bilgisi
mağaza bağlamlı ürün görünürlüğü

Ama burada çok kritik bir ayrım vardır:

ürün truth’u tek merkezde olabilir, ama arama sonucu mağaza bağlamlı dönebilir.

Çünkü PDP ve mağaza bağlamı zaten platformda önemlidir. Aynı ürün farklı mağazalarda görünebilir; retrieval bunu destekleyebilmelidir.

7. Ürün indeks yapısı

Ürün arama indeksi minimum şu alanları taşımalıdır:

product_id
canonical_product_title
short_description
brand
category_path
searchable_attributes
variant_terms
color_terms
size_terms
material_terms
use_case_terms
searchable_tags
price_band
in_stock_flag
active_flag
media_type_flags
campaign_flags
rating_summary
store_context_refs gerekiyorsa

Net kural:

indeks, yalnız title/body eşleştirmesi olmamalıdır; filtre ve niyet alanları da taşımalıdır.

8. Mağaza indeks yapısı

Fenomen mağaza araması için ayrı indeks gereklidir.

Minimum alanlar:

store_id
store_name
store_slug
store_description
category_affinity
creator_name / known alias
store_tags
follower_band
active_status
visible_status
featured_flags
badge_flags

Bu sayede kullanıcı:

mağaza adı
fenomen adı
kategori uyumu
gibi yollarla mağaza bulabilir.
9. Kategori / taksonomi indeks yapısı

Kategori navigasyonu ve yönlendirme için ayrı indeks veya ayrı retrieval katmanı gerekir.

Minimum alanlar:

category_id
category_name
synonyms
parent_category
child_categories
searchable_aliases
intent_terms
facet_support_flags

Bu sistem, arama sonucu kullanıcıyı kategori / PLP’ye doğru yönlendirmede kritik rol oynar. Arama sistemi zaten niyet çözümlemesi ve doğru yüzeye gönderme gereğini açıkça vurguluyor.

10. Keşfet araması için özel retrieval

Arama sistemi dosyasında keşfet aramasının ayrı mod olduğu ve yalnız video merkezli ürün araması taşıdığı, story ve klasik kart getirmemesi gerektiği açıkça tanımlanıyor.

Bu nedenle retrieval altyapısında keşfet için ayrı kurallar olmalıdır:

yalnız videolu ürün adayları
keşfet görünürlüğüne uygun kayıtlar
story dışı sonuç seti
klasik ürün kartlardan ayrışan medya odaklı retrieval

Net kural:

keşfet araması, katalog retrieval’ının basit filtrelenmiş hali olmamalıdır.

11. Niyet çözümleme desteği

Arama sistemi yalnız metin eşleştirme değil, niyet çözümleme sistemi olarak tanımlanıyor. Bu nedenle retrieval altyapısı en az şu niyet ailelerini desteklemelidir:

ürün arama niyeti
kategori yönelimi
mağaza arama niyeti
keşif niyeti
karar niyeti
özellik bazlı niyet
fiyat odaklı niyet
marka odaklı niyet

Örnek:

“siyah elbise” → ürün / kategori retrieval
“spor tayt 500 altı” → ürün + fiyat bandı retrieval
“X mağazası” → mağaza retrieval
“videolu cilt bakım ürünleri” → keşfet/video retrieval

Net kural:

retrieval ham metni değil, niyete uygun aday alanını da seçmelidir.

12. Typo, eşanlam ve dil varyasyonları

Bu sistem kullanıcı dilindeki doğal bozuklukları tolere etmelidir.

Minimum destek:

typo tolerance
Türkçe ek/çekim varyasyonu için normalize yaklaşım
eşanlamlı terimler
yaygın yanlış yazımlar
marka varyasyonları
kategori alias’ları

Örnek:

“kargo çantası” / “spor çanta”
“sneaker” / “spor ayakkabı”
“hoodie” / “kapüşonlu”
“blutut kulaklık” / “bluetooth kulaklık”

Net kural:

arama kullanıcıyı birebir kelime eşleşmesine mahkum etmemelidir.

13. Filtre / facet altyapısı

Kategori / PLP ve ürün aramasının güçlü çalışması için facet sistemi zorunludur.

Minimum facet alanları:

fiyat aralığı
marka
beden / numara / renk
puan
kampanya
stok durumu
video var / yok
mağaza varlığı gerekiyorsa

Kategori / PLP sisteminde zaten minimum ama etkili filtre yaklaşımı benimsenmişti. Retrieval altyapısı bu filtre yüzeyini beslemelidir.

Net kural:

facet sayımı ve filtre adayı retrieval katmanında desteklenmelidir; yalnız UI’de uydurulamaz.

14. Mağaza bağlamlı ürün retrieval

Bu platform için çok kritik bir konu budur.

Aynı ürün:

birden fazla mağazada görünebilir
farklı mağaza bağlamında farklı vitrin / medya / sosyal bağlam taşıyabilir

Bu yüzden sistem iki şeyi ayırmalıdır:

Canonical product retrieval

Ürünün merkez kimliği

Store-context product retrieval

Belirli fenomen mağazası bağlamında ürün görünürlüğü

Bu ayrım PDP ve fenomen mağaza mantığıyla tam uyumludur.

Net kural:

ürün indekslemesi yalnız global ürünle sınırlı kalmamalı; mağaza görünürlük bağlamı taşıyabilmelidir.

15. Stok, fiyat ve görünürlük güncelliği

Arama retrieval sistemi eski veriyle çalışırsa sonuçlar bozulur.

Minimum güncel alanlar:

active / passive
visible / hidden
in_stock / out_of_stock
price_band
campaign flag
coupon-eligible flag gerekiyorsa
store active visibility

Merkezi stok ve merkezi fiyat sistemleri bu alanların truth owner’ıdır; retrieval sistemi bunların güncel yansımasını tutmalıdır.

Net kural:

retrieval sonuçları satışa uygunluk açısından dürüst olmalıdır.

16. Öneri / sıralama sistemi ile ilişki

Bu ayrım çok net olmalıdır.

Retrieval sistemi:

aday set üretir

Öneri / sıralama sistemi:

bu aday seti skorlar / rerank eder

Öneri / sıralama sistemi dosyasında da search final ranking ve recommendation generation owner scope’u açıkça ayrılıyor. Retrieval sistemi buna aday sağlayan katman olmalıdır.

Net kural:

retrieval sistemi sıralama sistemi değildir; ama sıralamanın kalitesi doğru retrieval’a bağlıdır.

17. Arama yüzeyleri ile ilişki

Bu altyapı en az şu yüzeyleri beslemelidir:

genel platform araması
kategori / ürün araması
keşfet araması
mağaza araması
header araması
mobil arama overlay’i

Arama sistemi dosyasındaki üç mod:

genel platform araması
keşfet araması
katalog / ürün araması

bu altyapının farklı retrieval yollarıyla desteklenmelidir.

18. Admin sistemi ile ilişki

Admin panelde arama kalitesini ve indeks sağlığını görebilecek bir modül olmalıdır.

Burada admin veya teknik operasyon şunları görmelidir:

indeks senkron durumu
başarısız indeksleme kayıtları
eşanlam / alias yönetimi
kategori alias yönetimi
mağaza görünürlük indeksleme durumu
arama sonuç kalite sinyalleri
sıfır sonuç veren sorgular

Bu alan özellikle büyüyen katalogda kritiktir.

19. Analitik / ölçümleme ile ilişki

Arama retrieval sistemi analitikten beslenmelidir.

Ölçülmesi gerekenler:

sorgu hacmi
sıfır sonuç oranı
sorgu → tıklama oranı
sorgu → PDP oranı
sorgu → sipariş oranı
facet kullanım oranı
typo düzeltilen sorgular
mağaza arama performansı
keşfet araması dönüşümü

Bu veriler retrieval kalitesini geliştirmek için kullanılır.

20. Fraud / risk ilişkisi

Arama retrieval sistemi de risk sinyali taşıyabilir.

Örnek:

bot sorgu patlaması
kupon kodu brute-force benzeri aramalar
yapay mağaza görünürlük manipülasyonu
spam anahtar kelime istismarı
mağaza / ürün adında arama suistimali

Net kural:

arama altyapısı da abuse hedefi olabilir; bu nedenle risk sistemiyle bağlı çalışmalıdır.

21. Veri kalite ve indeksleme kuralları

Bu sistem için minimum kalite kuralları:

indekslenebilir alanlar kanonik tanımlanmalı
boş veya bozuk ürünler indekslenmemeli
pasif ürünler uygun kuralla çıkartılmalı
varyant terimleri normalize edilmeli
kategori alias’ları kontrol edilmeli
mağaza görünürlük statüsü anlık yansıtılmalı
yinelenen / kirli kayıtlar temizlenmeli

Net kural:

kirli katalog = zayıf arama.

22. Kritik edge case kararları
ürün onaylandı ama fiyat/stock senkronu gecikti → retrieval görünürlüğü güvenli kuralla açılmalı
ürün farklı mağazalarda var → mağaza bağlamı korunmalı
mağaza askıya alındı → mağaza ve mağaza bağlamlı ürün retrieval etkilenmeli
kullanıcı çok genel sorgu yazdı → kategori / ürün / mağaza niyet ayrımı yapılmalı
sorgu typo içeriyor → düzeltilmiş retrieval yolu denenmeli
sıfır sonuç çıktı → yakın kategori veya benzer ürün retrieval fallback’i çalışmalı
kampanyalı ürün bitti → facet ve retrieval anında güncellenmeli
23. Audit ve kayıt

Tüm kritik altyapı olayları kayıt altına alınmalıdır:

indeksleme başladı
indeksleme tamamlandı
indeksleme hatası
doküman güncellendi
doküman silindi
synonym/alias güncellendi
facet alanı güncellendi
mağaza görünürlük kaydı değişti

Bu olmadan arama sorunları izlenemez.

24. Ana kurallar

Arama retrieval / indeksleme altyapı sistemi için sabitlenmesi gereken temel kurallar şunlardır:

bu sistem arama UI’ı değildir, arama altyapısıdır
retrieval ve sıralama ayrı katmanlardır
tek arama kutusu, çoklu retrieval yolu destekleyebilir
ürün, mağaza, kategori ve keşif retrieval alanları ayrı düşünülmelidir
typo, eşanlam ve alias desteği olmalıdır
facet / filtre desteği retrieval katmanında üretilmelidir
mağaza bağlamlı ürün retrieval desteklenmelidir
aktiflik, stok, fiyat ve görünürlük güncelliği korunmalıdır
analitik ve risk sistemleriyle bağlı çalışmalıdır
kirli veri indekslenmemelidir
tüm kritik altyapı olayları loglanmalıdır
25. Nihai kısa özet

Arama retrieval / indeksleme altyapı sistemi, platformdaki ürün, mağaza, kategori ve niyet verisini aranabilir indekslere dönüştüren; sorgu anında doğru aday setini, filtre/facet alanlarını ve mağaza bağlamlı ürün görünürlüğünü üreten; typo, eşanlam ve niyet çözümünü destekleyen; arama deneyiminin arka plan teknik buldurma motorudur.