ARAMA SİSTEMİ
1. Sistem tanımı

Arama sistemi, kullanıcının platform içinde belirli bir ürün, kategori, ihtiyaç, mağaza veya ticari niyete en kısa ve en net yoldan ulaşmasını sağlayan yön bulma ve niyet çözümleme sistemidir.

Bu sistemin görevi yalnız metin eşleştirmek değildir.
Aynı zamanda:

kullanıcı niyetini anlamak,
doğru yüzeye yönlendirmek,
gereksiz içerik karışımını önlemek,
keşfet, kategori, mağaza ve PDP arasında doğru geçiş üretmek,
mobilde en az sürtünmeyle sonuç vermektir.

Kısa tanım:

Arama sistemi, platformun niyet odaklı erişim ve yönlendirme motorudur.

2. Sistemin ana amacı

Arama sistemi şu görevleri yerine getirmelidir:

kullanıcının aradığı ürünü hızlı buldurmak
kullanıcının aramadığı ama niyetine yakın ürünleri gösterebilmek
keşif niyeti ile karar niyetini ayırmak
yanlış yüzeye yanlış içerik taşımamak
ürün, mağaza ve kategoriye kontrollü geçiş vermek
mobil kullanımda minimum adımla sonuç üretmek
performanslı, sade ve tekrar kullanılabilir bir arama deneyimi sunmak
3. Sistemin ana karakteri

Arama sistemi şu karaktere sahip olmalıdır:

hızlı
niyet odaklı
yüzey duyarlı
mobil öncelikli
sade
performanslı
tutarlı
kontrollü

Net kural:

Tek bir arama kutusu olabilir ama tek tip arama davranışı olmamalıdır.
Arama davranışı açıldığı yüzeye göre değişmelidir.

Bu, story sistemindeki “bağlam korunur” ilkesiyle de uyumludur; aynı mantık aramada da geçerli olmalıdır. Story açıldığı yüzeye göre davranış değiştirir; arama da yüzey bağlamını korumalıdır.

4. Arama sistemi tek parça değildir

Arama sistemi 3 ana arama modundan oluşmalıdır:

4.1 Genel platform araması

Platformun üst düzey arama kapısıdır.

Kullanım alanları:

ana sayfa
sticky header
genel navigasyon arama kutusu

Amaç:

kullanıcıyı doğru yüzeye göndermek
ürün, kategori ve mağaza arasında yön buldurmak
aramanın ilk giriş kapısı olmak
4.2 Keşfet araması

Keşfet araması, keşfet bağlamını koruyan özel bir arama modudur.

Bu modun amacı:
kullanıcıyı keşfet içinde kalırken video-merkezli ürün karşılaşmalarına götürmek
mevcut keşfet mantığını bozmadan niyete yakın sonuç üretmek
keşfet ile katalog/PLP davranışını birbirine karıştırmamaktır

Doğru model:

varsayılan görünüm video-merkezli olabilir
videolu ürün kartlar öne çıkabilir
ayrı keşfet-sonuç görünümü açılabilir

Ancak kullanıcıya tamamen kapalı ve başka hiçbir sonuca izin vermeyen bir arama hissi verilmemelidir.
Bu nedenle sistem, sade geçişlerle daha geniş ürün görünümünü destekleyebilir.

Net kural:
keşfet araması bağlamsal olarak keşfet modudur; ama kullanıcı deneyiminde kör ve dar bir arama duvarına dönüşmez.
4.3 Katalog / ürün araması

Bu daha niyetli ve karar odaklı aramadır.

Kullanım alanları:

kategori / PLP’ye yakın yüzeyler
genel ürün bulma senaryosu
kullanıcı “ne var?” değil, “şunu arıyorum” dediğinde

Bu mod klasik ürün arama mantığını taşır:

ürün yoğun
filtre destekli
sıralama destekli
düzenli sonuç görünümü
keşfete dönüşmeyen yapı

Bu yaklaşım PLP sisteminin karakteriyle uyumludur; PLP ilgi değil seçim kolaylığı üretir.

5. Aramanın cevaplaması gereken temel niyet türleri
5.1 Ürün arama niyeti

Örnek:

siyah elbise
çelik tava
bluetooth kulaklık

Sonuç:

ilgili ürünler
uygun kategori önerisi
gerekiyorsa video ağırlıklı veya klasik ağırlıklı sonuç düzeni
5.2 Kategori arama niyeti

Örnek:

ayakkabı
mutfak
cilt bakımı

Sonuç:

kategori yönlendirmesi
alt kategori önerileri
kategoriye giriş kapısı
5.3 Mağaza arama niyeti

Örnek:

belirli fenomen adı
mağaza adı
profil bazlı arama

Sonuç:

ilgili fenomen mağaza
mağazaya geçiş
gerekiyorsa mağaza içi ürünlere köprü
5.4 Keşif niyeti

Örnek:

trend ürünler
yeni gelenler
çok kaydedilenler

Sonuç:

bu niyet katalog filtresi gibi değil, keşif yönü olarak çalışmalı
özellikle keşfette hafif çip mantığıyla desteklenebilir
5.5 Çözülmemiş / belirsiz niyet

Örnek:

hediye
ev için bir şey
yazlık

Sonuç:

doğrudan dar ürün listesi değil
önce yönlendirme, sonra daraltma
kategori ve tema önerileri
6. Yüzeylere göre arama davranışı
6.1 Ana sayfa araması

Ana sayfada arama, yön bulma katmanının parçasıdır. Sticky header içinde görünür olmalıdır.

Rolü:

platforma giriş yapan kullanıcıya hızlı erişim vermek
kategoriye, ürüne veya mağazaya yönlendirmek
ana vitrini bozmadan niyet açmak

Davranış:

kullanıcı yazarken öneri açılır
ürün, kategori ve mağaza önerileri karışık ama düzenli verilir
tam sonuç sayfasına gidilebilir
ana sayfayı anlık filtreleyip bozmaz
6.2 Keşfet araması

Bu özel moddur.

Kurallar:

yalnız videolu ürün kart araması
story sonuç olarak gelmez
klasik kart gelmez
arama ayrı keşfet-sonuç ekranı açar
hafif keşif çipleri bulunabilir
ağır filtre paneli olmaz

Bu sistemin amacı:

keşfet karakterini korumak
keşfeti katalog sayfasına çevirmemek
video odaklı karşılaşmayı sürdürmek
6.3 Kategori / PLP ile ilişkili arama

Burada arama daha karar odaklıdır.

Kurallar:

klasik ürün yoğun sonuç düzeni
filtre ve sıralama ile çalışabilir
story içermez
ürün seçim yüzeyi gibi davranır
keşfete dönüşmez
6.4 Fenomen mağaza içi arama

Bu sistem de gereklidir.

Rolü:

kullanıcı mağaza içindeki ürünleri arayabilmeli
mağaza dışına taşmamalı
mağaza bağlamı korunmalı

Sonuç mantığı:

yalnız ilgili mağazadaki ürünler
gerekiyorsa mağaza içi videolu ve klasik ürünler
mağaza kimliğini bozmayan sade sonuç alanı

Bu, fenomen mağaza sisteminin “kendi mağazası gibi hissedilen ama platform kontrollü vitrin” mantığıyla uyumludur.

7. Arama sonucu tipleri

Genel platform aramasında sonuçlar 3 ana tipte olmalıdır:

7.1 Ürün sonuçları
ürün adı
fiyat
mikro mağaza bağlamı
gerekirse kart tipi ayrımı
7.2 Kategori sonuçları
kategori adı
alt kategori bağlantısı
kategoriye git aksiyonu
7.3 Mağaza sonuçları
mağaza adı
profil görseli
kısa kimlik bilgisi
mağazaya git aksiyonu

Net kural:
Story doğrudan genel arama sonucu nesnesi olmamalıdır.
Story arama sonucu değil, içerik dolaşım yüzeyidir. Keşfet içinde de story sonuç nesnesi değil, üst şerit deneyimidir.

8. Keşfet aramasında özel sonuç kuralı

Keşfet araması ayrı tutulmalıdır.

Sonuç yapısı:

yalnız videolu ürün kartlar
sonuç görünümü ayrı ekran/mod
geri dönünce keşfet akışı bozulmaz
hafif keşif çipleri desteklenebilir
filtre paneli yoktur

Bu çok önemli.
Burada ilk kritik mimari karar şudur:

Keşfet araması = katalog araması değildir.

9. Otomatik öneri sistemi

Arama kutusu boş veya yazım anında aşağıdaki öneriler olabilir:

9.1 Son aramalar

Kişiye özel olabilir.

9.2 Trend aramalar

Platform genelinde yükselen talepler

9.3 Popüler kategoriler

Hızlı yön bulma için

9.4 Öne çıkan mağazalar

Sınırlı sayıda

9.5 Sorgu tamamlama önerileri

Örnek:

siyah elbise
siyah elbise midi
siyah elbise uzun kol

Ama kural şu:
öneri paneli reklam çöplüğüne dönüşmemelidir.

10. Filtre ilişkisi
10.1 Genel aramada

Ağır filtre hemen açılmamalı
önce sonuç verilmeli, sonra gerekiyorsa daraltma yapılmalı

10.2 PLP/katalog aramasında

Filtre desteklenmeli
çünkü bu alan seçim yüzeyidir

10.3 Keşfet aramasında

Ağır filtre yok
yalnız hafif yönlendirme çipleri var

Bu ayrım çok kritik.
Çünkü:

PLP = karar öncesi seçim
keşfet = yeni karşılaşma
ana sayfa = yön bulma başlangıcı
11. Sıralama ilişkisi
11.1 Genel ürün aramasında desteklenebilir
önerilen
en çok satan
en yeni
fiyat artan
fiyat azalan
en yüksek puan
11.2 Keşfet aramasında klasik sıralama dili baskın olmamalı

orada:

trend
yeni
en çok kaydedilen
en çok paylaşılan

gibi hafif keşif yönleri daha doğru olur.

12. Sonuç sayfası davranışı
12.1 Genel arama sonuç sayfası
sekmeli veya bloklu olabilir
ürün / kategori / mağaza ayrımı net olmalı
mobilde tek kolonlu sade yapı tercih edilmeli
12.2 PLP benzeri ürün sonuç sayfası
klasik kart ağırlıklı olmalı
düzenli grid
filtre ve sıralama kontrollü olmalı
kullanıcıyı kaybetmeyen yapı kurulmalı
12.3 Keşfet sonuç sayfası
keşfet akışından ayrı
yalnız video kart
geri dönülebilir
keşfet karakterini koruyan ritim
13. Boş sonuç sistemi

Aramada sonuç bulunamazsa kullanıcı çıkmazda kalmamalıdır.

İçermelidir:

sonuç bulunamadı mesajı
yazımı kontrol et önerisi
yakın kategori önerileri
popüler ürünler
keşfete dön
filtreleri temizle veya sorguyu sadeleştir

Bu PLP boş sonuç mantığıyla da uyumludur. PLP’de kullanıcıyı yakın kategori ve popüler ürünlere döndürme ilkesi var.

14. Mobil öncelikli arama tasarımı

Mobilde arama masaüstünden daha kritik olmalıdır.

Kurallar:

arama alanı kolay erişilebilir olmalı
tek elde kullanım düşünülmeli
otomatik odaklanma dikkatli kullanılmalı
öneriler hızlı açılmalı
sonuçlar hafif ve hızlı yüklenmeli
gereksiz görsel kalabalık olmamalı
klavye açıkken en kritik öneriler görünür kalmalı

Mobilde özellikle:

ürün adı
fiyat
mağaza bağlamı
hızlı geçiş

ilk anda görünmeli

15. Performans kuralları

Arama sistemi performans öncelikli kurulmalıdır.

15.1 İlk sonuç gecikmesi düşük olmalı
15.2 Öneri paneli anlık ama kontrollü çalışmalı
15.3 Gereksiz sonuç tipi yüklenmemeli
15.4 Görsel ve video preload aşırıya kaçmamalı
15.5 Mobil ağ koşullarında hafif sonuç dönmeli

Özellikle keşfet aramasında video kart geleceği için:

önce hafif metadata
sonra görünür medya
mantığı tercih edilmelidir
16. Aramanın diğer sistemlerle sınırları
16.1 PDP ile sınır

Arama, PDP’nin işini devralmaz
detay, yorum, soru-cevap, güven katmanı PDP’de kalır

16.2 Keşfet ile sınır

Keşfet araması keşfeti kataloglaştırmaz
yalnız video merkezli ayrı sonuç görünümü açar

16.3 PLP ile sınır

PLP ürün seçim yüzeyidir
arama PLP’ye destek verir ama sayfayı feed’e çevirmez

16.4 Story ile sınır

Story arama sonucu nesnesi değildir
story içerik dolaşım sistemidir, arama sonucu kartı değildir

16.5 Takip ile sınır

Takip sayfası post akışıdır
arama bunu ürün/kategori arama yüzeyine çevirmemelidir

17. Ana kurallar

Arama sisteminde şu temel kurallar geçerlidir:

Tek arama kutusu olabilir, tek davranış olmaz
Yüzeye göre arama davranışı değişir
Keşfet araması genel arama değildir
Keşfet aramasında yalnız videolu ürün kart gelir
Story arama sonucu nesnesi olmaz
PLP/katalog araması klasik seçim mantığını korur
Mağaza içi arama mağaza bağlamını korur
Arama sonuçları kullanıcıyı doğru yüzeye taşır
Mobil deneyim masaüstünden daha sade kurulmalıdır
Performans, kapsamdan önce gelir
Arama yön buldurur; karar alanını ele geçirmez
18. Nihai kısa özet

Arama sistemi, platformun tüm yüzeylerinde aynı davranan tek tip kutu değil; ana sayfada yön bulduran, keşfette video merkezli çalışan, katalogda ürün seçim mantığına dönen ve mağaza içinde bağlamı koruyan çok modlu niyet çözümleme sistemidir.

19. Bu aşamada hazır kararlar / yeni netleştirdiğimiz kararlar
Dosyalardan zaten hazır gelen kararlar
ana sayfada arama vardır
keşfette arama vardır ve kritiktir
keşfet araması genel arama değildir
keşfet aramasında yalnız videolu ürün kart gelir
keşfet araması ayrı sonuç görünümü açar
PLP seçim yüzeyidir, keşfet değildir
Burada netleştirdiğimiz yeni çerçeve
arama sistemi 3 modlu çalışmalı: genel arama / keşfet araması / katalog araması
mağaza içi arama ayrıca olmalı
story doğrudan arama sonucu nesnesi olmamalı
genel arama ürün + kategori + mağaza yönlendirmesi taşımalı
filtre/sıralama dili yüzeye göre değişmeli

#####
---
REVİZYON NOTU — 2026-04-19
Durum: Kanonik açıklama + UX düzeltme notu
Etkilediği bölüm(ler): Keşfet araması, genel arama davranışı, sonuç görünümü
Bağlı dosyalar: 7-keşfet sistemi, 9-ana sayfa sistemi, 10-kategori-plp sistemi

Not:
Bu dosyadaki yüzey-duyarlı arama ilkesi korunur; ancak kullanıcı deneyimi açısından aşağıdaki yorum geçerli kabul edilir:

1. Arama altyapısında yüzeye göre farklı retrieval ve sonuç mantığı kullanılabilir.
2. Ancak kullanıcı tarafında arama davranışı “tamamen başka bir arama motoru” gibi hissettirilmemelidir.
3. Keşfet içinde açılan aramada varsayılan görünüm video-merkezli olabilir.
4. Buna rağmen sistem, ihtiyaç halinde kullanıcıya “Tümü / Ürünler / Videolular” benzeri sade bir sonuç geçişi açabilecek şekilde tasarlanmalıdır.
5. Keşfet araması keşfeti katalog sayfasına çevirmemeli; ağır filtre paneli yine açılmamalıdır.
6. Bu not, teknik katmanda mod ayrımını korur; fakat UX katmanında aşırı sert davranış ayrımını yumuşatır.

Ek açıklama:
Tek arama kutusu ile çoklu retrieval hattı birlikte yaşayabilir; kullanıcıya hissettirilen deneyim ise daha tutarlı olmalıdır.
---


Ek yorum:

Tek arama kutusu ile çoklu retrieval hattı birlikte yaşayabilir.
Farklı yüzeylerde farklı sıralama ve aday üretim mantığı kullanılabilir.
Ancak kullanıcı tarafında bu fark, “bazen sistem buluyor bazen bulmuyor” hissi üretmeyecek kadar tutarlı tasarlanmalıdır.