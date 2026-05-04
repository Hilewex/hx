KATEGORİ / TAKSONOMİ YÖNETİM SİSTEMİ
1. Sistem tanımı

Kategori / taksonomi yönetim sistemi, platformdaki ürünlerin hangi ana kategori, alt kategori, özellik ailesi, filtre yapısı ve katalog ağacı altında yaşayacağını belirleyen; ürün kabul, arama, filtreleme, PLP, öneri ve raporlama sistemlerine ortak sınıflandırma gerçeği sağlayan merkezi katalog sınıflandırma sistemidir.

Bu sistemin görevi yalnız kategori adı tutmak değildir. Aynı zamanda:

kategori ağacını kurmak
alt kategori ilişkilerini yönetmek
hangi kategoride hangi özelliklerin kullanılacağını belirlemek
hangi filtrelerin hangi kategoride açılacağını sabitlemek
ürün kabul sürecindeki sınıflandırmayı yönetmek
arama ve retrieval için kategori alias / eşleşme alanı sağlamak
kategori bazlı ticari ve operasyonel kurallara temel oluşturmaktır.

Kısa tanım:

Kategori / taksonomi yönetim sistemi, platformun katalog sınıflandırma ve kategori gerçeği sistemidir.

2. Temel ilke

Bu sistemin temel ilkesi şudur:

Kategori ağacı vitrin kararı değil, platformun katalog gerçeğidir.

Yani:

ürün hangi kategoriye ait
hangi alt kategoriye düşer
hangi filtreler açılır
hangi varyant eksenleri geçerlidir
hangi arama terimleri bu kategoriye bağlanır

gibi kararlar UI içinde dağınık biçimde üretilmez; merkezi yönetilir. Ürün kabul sisteminde de platformun kategori eşlemesini yaptığı veya düzelttiği açıkça belirtilir.

Net kural:

Kategori bilgisi serbest metin değil, kontrollü katalog yapısı olmalıdır.

3. Sistemin platform içindeki rolü

Bu sistem şu alanlarla doğrudan ilişkilidir:

havuz sistemi
ürün kabul / onay sistemi
varyant sistemi
kategori / PLP sistemi
arama retrieval / indeksleme sistemi
öneri / sıralama sistemi
merkezi fiyat sistemi
kampanya sistemi
tedarikçi paneli
admin sistemi

Doğru akış şu olmalıdır:

ürün yüklenir
kategori önerisi gelir
platform gerekirse kategori eşlemesini düzeltir
ürün kanonik kategori ağacına bağlanır
buna göre varyant kuralları, filtreler, retrieval alanları, fiyat kuralları ve PLP davranışı beslenir.

Net kural:

Taksonomi sistemi truth sağlar; PLP, arama ve ürün kabul bu truth’u kullanır.

4. Bu sistem kategori / PLP sistemiyle aynı şey değildir

Bu ayrımı net sabitlemek gerekir.

Kategori / PLP sistemi:

kullanıcının kategori sayfasında ürünleri gördüğü yüzeydir
filtre, sıralama, kart düzeni ve listeleme deneyimini taşır.

Kategori / taksonomi yönetim sistemi:

kategori ağacını tanımlar
kategori kurallarını belirler
kategoriye bağlı attribute ve filtre setini yönetir
ürünlerin hangi dala bağlanacağını kontrol eder

Net kural:

PLP vitrin yüzeyidir, taksonomi onun arkasındaki katalog omurgasıdır.

5. Ana varlıklar

Bu sistem minimum şu varlıkları taşımalıdır:

ana kategori
alt kategori
kategori ağacı ilişkisi
kategori alias / eşanlam seti
kategori açıklaması
kategori aktif/pasif durumu
kategori görünürlük durumu
kategori attribute seti
kategori filtre seti
kategori varyant kural seti
kategori ticari kural referansları
kategori medya / vitrin referansları gerekiyorsa

Bu yapı olmadan kategori yalnız isim listesi olur; sistem olmaz.

6. Kategori ağacı yapısı

Taksonomi sistemi ağaç yapılı çalışmalıdır.

Minimum yapı:

seviye 1: ana kategori
seviye 2: alt kategori
seviye 3: gerekiyorsa daha derin kırılım
tematik / koleksiyonel etiketler ayrı tutulmalı

Örnek mantık:

Kadın Giyim
Elbise
Bluz
Pantolon
Ev / Mutfak
Tencere
Tava
Saklama

Net kural:

kategori ağacı ile kampanya/tema/vitrin etiketleri aynı şey değildir.

7. Ürün kabul sistemi ile ilişki

Ürün kabul / onay sistemi, tedarikçinin kategori önerisi verdiğini ama platformun kategori eşleşmesini yapabildiğini veya düzeltebildiğini açıkça söyler.

Bu nedenle taksonomi sistemi ürün kabul hattında şunları sağlamalıdır:

kategori öneri listesi
zorunlu kategori alanları
yanlış kategori işaretleme uyarısı
manuel düzeltme imkanı
onay öncesi kategori doğrulama
bir kategoriden başka kategoriye yeniden bağlama

Net kural:

kategori seçimi tedarikçi önerisi olabilir; son sınıflandırma truth’u platformda kalır.

8. Attribute sistemi ile ilişki

Taksonomi yönetimi yalnız kategori adı değil, kategoriye bağlı özellik alanlarını da yönetmelidir.

Her kategori için şu kararlar sabitlenmelidir:

hangi attribute’lar zorunlu
hangileri opsiyonel
hangileri gösterim amaçlı
hangileri filtre amaçlı
hangileri arama retrieval alanına girer
hangileri varyant ekseni olabilir

Örnek:

giyimde: beden, renk, kumaş
ayakkabıda: numara, renk
kozmetikte: hacim, ton
ev ürünlerinde: ölçü, hacim, materyal

Varyant sistemi zaten kategoriye göre varyant ekseni açılması gerektiğini söylüyor. Bu nedenle taksonomi sistemi varyant sistemi için kural kaynağı olmalıdır.

9. Filtre sistemi ile ilişki

Kategori / PLP sisteminde minimum ama etkili filtre yaklaşımı açıkça tanımlanmıştı: fiyat, beden/numara/renk, marka, puan, kampanya/indirim, stok durumu.

Taksonomi sistemi bu filtrelerin kategori bazlı truth’unu sağlamalıdır.

Yani her kategoride şu belirlenmelidir:

hangi filtreler birincil
hangi filtreler ikincil
hangi filtre hiç açılmaz
hangi filtre kategoriye özel
hangi filtre facet sayımı üretir

Net kural:

Filtre seti PLP ekranında keyfi belirlenmez; kategori truth’undan beslenir.

10. Arama retrieval sistemi ile ilişki

Arama retrieval / indeksleme sistemi kategori alias, parent/child ilişkisi, intent terms ve searchable aliases alanlarını taşımalıdır. Bu bilgi taksonomi sisteminden gelmelidir. Yani:

kategori adları
eşanlamlı isimler
halk dilindeki varyasyonlar
arama niyetine bağlanan kategori terimleri
merkezi olarak taksonomi sisteminde yönetilmelidir.

Örnek:

sneaker → spor ayakkabı
hoodie → kapüşonlu
tava → kızartma tavası / döküm tava alt dalları

Net kural:

Kategori alias ve arama ilişkisi UI içinde değil, taksonomi yönetiminde tutulmalıdır.

11. Varyant sistemi ile ilişki

Varyant sistemi, her ürün tipinde aynı eksenlerin açılmaması gerektiğini, kategori duyarlı yapı gerektiğini açıkça söylüyor.

Bu nedenle taksonomi sistemi her kategori için şunu taşımalıdır:

varyant destekler mi
hangi varyant eksenleri geçerli
hangi kombinasyonlar mantıklı
varyantsız kategori mi
zorunlu varyant var mı

Örnek:

tişört: beden + renk
ayakkabı: numara + renk
serum: hacim
sehpa: ölçü / model farkı
dekoratif ürün: varyantsız olabilir

Net kural:

Varyant yapısı üründen değil, çoğu zaman kategori truth’undan türemelidir.

12. Merkezi fiyat sistemi ile ilişki

Merkezi fiyat sistemi kategori bazlı kâr oranları ve fiyat koridorları üretiyor. Bu nedenle kategori yönetim sistemi finansal sınıflandırma için de temel olmalıdır.

Yani kategori şunlara referans verebilmelidir:

fiyat koridor kural ailesi
kâr bandı tipi
kupon uygunluk politikası
kampanya katılım kuralı
komisyon/hakediş modeli gerekiyorsa

Net kural:

Kategori yanlışsa finansal model de bozulabilir.

13. Kampanya ve kupon sistemi ile ilişki

Bazı kategoriler:

kupona daha açık
kampanyaya daha açık
belirli promosyonlara kapalı
olabilir.

Bu nedenle taksonomi sistemi kategori bazında şunları taşıyabilmelidir:

kampanyaya uygunluk
fenomen kuponuna uygunluk
platform kuponuna uygunluk
indirim üst sınır ailesi
promosyon risk seviyesi

Bu, kupon sisteminin kategori bazlı koruma uygulamasını kolaylaştırır.

14. Fenomen mağaza sistemi ile ilişki

Fenomen mağaza için kategori yetkisi platform tarafından tanımlanır. Bu, fenomen yönetim sisteminde yönetilen bir karardır; ama bu yetkilerin beslendiği kategori kümesi taksonomi sisteminden gelir.

Yani taksonomi sistemi şunu sağlamalıdır:

fenomene açılabilir kategori listesi
kategori grupları
benzer kategori aileleri
mağaza kimliğiyle uyumlu kategori kümeleri

Net kural:

Fenomen kategori yetkisi yönetim sistemiyle verilir; ama kategori evreni taksonomi sisteminden gelir.

15. Tedarikçi sistemi ile ilişki

Tedarikçi her kategoriye ürün yükleyememelidir. Tedarikçi yönetim sistemi kategori yetkisi verir veya kapatır. Bu yetkinin nesnesi yine taksonomi sistemidir. Yani:

hangi kategoriye yükleyebilir
hangi kategoriye yükleyemez
hangi kategori ek inceleme ister
gibi kararlar taksonomi ağacına referansla çalışmalıdır.
16. Admin paneli ile ilişki

Admin panelde ayrı bir Kategori / Taksonomi Merkezi olmalıdır.

Burada admin:

kategori ekleyebilir
kategori kapatabilir
alt kategori açabilir
alias yönetebilir
attribute seti tanımlayabilir
filtre kuralları tanımlayabilir
varyant kurallarını kategoriye bağlayabilir
kategori taşıma / birleştirme yapabilir
görünürlük ve aktiflik yönetebilir

Ama kural:

bu işlemler audit’li olmalıdır
kategoriyi değiştirmenin ürün, arama, fiyat ve kampanya etkisi görülebilmelidir
17. Kategori yaşam döngüsü

Her kategori için minimum durumlar olmalıdır:

draft
active
restricted
hidden
archived

Ayrıca şu işlemler desteklenmelidir:

yeni kategori aç
kategoriyi yeniden adlandır
kategoriyi başka dala taşı
kategori birleştir
kategori kapat
kategoriyi görünmez yap

Net kural:

Kategori silmek yerine yaşam döngüsü ile yönetmek daha güvenlidir.

18. Birleştirme ve yeniden eşleme sistemi

Büyüyen platformlarda kategori karmaşası kaçınılmazdır. Bu yüzden taksonomi sistemi şu araçları taşımalıdır:

duplicate kategori tespiti
kategori birleştirme
yanlış kategoriye bağlı ürünleri toplu yeniden eşleme
alias’ları yeni kategoriye yönlendirme
eski kategori slug / arama tarihçesini güvenli yönlendirme

Bu alan olmadan taksonomi zamanla kirlenir.

19. Analitik / ölçümleme ile ilişki

Taksonomi sistemi analitikten beslenebilir.

Örnek:

kullanıcılar bir kategoriyi çok arıyor ama uygun kategori yok
bir alt kategoride çok yüksek bounce var
çok fazla ürün yanlış kategoriye atanıyor
belirli filtreler hiç kullanılmıyor
bazı kategori adları kullanıcı diline uymuyor

Bu veriler taksonomi iyileştirmesi için kullanılır.

Net kural:

Taksonomi bir kez kurulup unutulacak sabit liste değildir; yaşayan katalog sistemidir.

20. Fraud / risk ilişkisi

Taksonomi sistemi de abuse hedefi olabilir.

Örnek:

yanlış kategoriye yükleyerek görünürlük kazanmaya çalışma
daha düşük iade riski görünen kategoriye kaçma
kupona açık kategoriye uygunsuz ürün bağlama
arama avantajı için yanlış attribute kullanma

Bu nedenle taksonomi sistemi:

ürün kabul
risk sistemi
admin denetimi
ile bağlı çalışmalıdır.
21. Kayıt ve audit

Tüm kritik taksonomi işlemleri loglanmalıdır:

kategori açıldı
kategori kapatıldı
kategori taşındı
kategori birleştirildi
alias eklendi
alias kaldırıldı
attribute seti değişti
filtre kuralı değişti
varyant kuralı değişti
ürün yeniden eşlendi

Bu olmadan katalog değişiklikleri izlenemez.

22. Kritik edge case kararları
tedarikçi yanlış kategori önerdi → platform düzeltir
kategori kapatıldı ama ürünler var → toplu yeniden eşleme gerekir
aynı ürün birden fazla uygun kategori hissi veriyor → kanonik ana kategori + ikincil tematik etiket ayrımı yapılmalı
kategori adı kullanıcı dilinde zayıf kaldı → alias seti genişletilir
varyant desteklemeyen kategoriye varyantlı ürün geldi → ürün kabul aşamasında blok/revizyon
kampanyaya kapalı kategoriye kupon denendi → kupon sistemi kategori kuralına göre bloklar
23. Ana kurallar

Kategori / taksonomi yönetim sistemi için sabitlenmesi gereken temel kurallar şunlardır:

bu sistem kategori / PLP yüzeyinin kendisi değildir; onun katalog truth kaynağıdır
kategori bilgisi merkezi platform truth’udur
tedarikçi kategori önerebilir ama son sınıflandırma platformdadır
kategoriye bağlı attribute, filtre ve varyant kuralları merkezi yönetilmelidir
kategori alias ve arama ilişkileri taksonomi sisteminde tutulmalıdır
kategori finansal ve promosyon kurallarını dolaylı etkileyebilir
kategori yaşam döngüsü ve yeniden eşleme araçları olmalıdır
duplicate ve kirli kategori yapısı engellenmelidir
tüm kritik değişiklikler audit log üretmelidir
24. Nihai kısa özet

Kategori / taksonomi yönetim sistemi, platformdaki ürünlerin hangi ana kategori ve alt kategori altında yaşayacağını; hangi attribute, filtre, varyant ve arama alias yapılarıyla destekleneceğini; ürün kabul, PLP, arama, fiyat, kampanya ve yönetim sistemlerine ortak katalog sınıflandırma truth’u sağlayan merkezi kategori omurgasıdır.