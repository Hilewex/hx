PDP SİSTEMİ — GÜNCEL SON LİSTE
1. PDP sisteminin ana tanımı

PDP sistemi, bir ürünün:

ana ürün bilgisini,
ticari karar verilerini,
mağaza bağlamını,
kullanıcı güven sinyallerini,
kullanıcı katkılarını,
satın alma aksiyonlarını

tek yapıda birleştiren ana ürün karar sistemidir.

PDP sadece ürün detay alanı değildir. Aynı zamanda:

karar verme alanı,
güven oluşturma alanı,
sosyal bağlam alanı,
davranış verisi alanı,
satın alma başlatma alanıdır.
2. PDP’nin temel açılış mantığı
Her PDP mutlaka bir fenomen mağaza bağlamında açılır.
Platformda nötr ürün PDP yoktur.
Kullanıcı hangi mağazaya ait ürün kartına tıklarsa PDP o mağaza bağlamıyla açılır.
Aynı ürün farklı mağazalarda satılabilir.
Ama PDP’de görünen mağaza profili, giriş yapılan mağazadır.
3. PDP’nin ana katmanları
3.1 Ürün çekirdek bilgi katmanı

Bu katman ürünün ana gerçeğini taşır.

İçerir:

ürün ana görseli
ürün galerisi
varsa ürün videosu
ürün adı
ürün başlığı
kısa açıklama
detaylı açıklama
marka
kategori
alt kategori
ürün özellikleri
teknik bilgiler
malzeme bilgisi
ölçü / ebat / gramaj / hacim gibi alanlar
varyant yapısı
Varyant alanları
renk
beden
numara
hacim
gramaj
ölçü
model farkı
3.2 Ticari karar katmanı

Bu katman ürünün satış koşullarını taşır.

İçerir:

güncel fiyat
varsa önceki fiyat
indirim / kampanya görünümü
kargo bilgisi
tahmini teslimat süresi
iade özeti
stok durumu
az stok uyarısı
varyanta göre fiyat farkı
varyanta göre stok farkı
varyanta göre teslimat farkı
3.3 Satın alma aksiyon katmanı

Bu katman kararın eyleme dönüştüğü alandır.

İçerir:

varyant seçimi
adet seçimi
sepete ekle
hemen al
3.4 Etkileşim ve davranış sinyali katmanı

Bu katman platformun veri omurgasıdır.

İçerir:

beğen
kaydet
paylaş

Bu üçlü:

sadece PDP öğesi değildir
platform genelinde ortak etkileşim sistemi olarak çalışacaktır
ürün, story, mağaza postu gibi alanlarda kullanılacaktır
Anlamları
Beğen = ilgi sinyali
Kaydet = niyet sinyali
Paylaş = yayılım sinyali
3.5 Fenomen mağaza bağlam katmanı

Bu katman ürünün hangi mağaza bağlamında sunulduğunu gösterir.

İçerir:

mağaza profil görseli
mağaza adı
rozetler
mağaza puanı
takip et
mağazaya git
fenomenin notu

Net kural:
PDP’de fenomen mağaza story akışı bulunmaz. PDP içinde mağaza bağlamı profil, takip, mağazaya git ve fenomenin notu ile kurulur. Story deneyimi mağaza profili, keşfet ve diğer story yüzeylerinde yaşanır; PDP’nin story alanı yalnız kullanıcı ürün story’lerinden oluşur.

Fenomenin Notu

ürün bazlıdır
kısa birkaç cümledir
ayrı başlık altında görünür
ürün açıklamasıyla karışmaz
3.6 Ürün puanı ve yorum katmanı

Bu katman ürün güveni üretir.

İçerir:

ürün puanı
yorum sayısı
yorum listesi
Ürün puanı mantığı
ayrı bir “değerlendirme” sistemi yoktur
kullanıcı yorum yaparken yıldız verir
yıldızlar ürün puanını oluşturur
örnek gösterim: 4,5 / 5
Yorum kuralları
sadece satın alan ve teslim edilmiş kullanıcı yorum yapabilir
yorum yaparken yıldız zorunludur
yorumlar en son yapılan üstte görünür
yorumlar sadece metin tabanlıdır
görselli yorum yoktur
videolu yorum yoktur
yorumlara cevap verilmez
Yorum bağlamı
yorum tamamen ürün bazlıdır
aynı ürün hangi mağazada açılırsa açılsın aynı yorumlar görünür
3.7 Soru-cevap katmanı

Bu katman ürün bilgi alanıdır.

İçerir:

kullanıcı soru sorabilir
soru ürün bazlı kaydedilir
aynı ürün hangi mağazada açılırsa açılsın aynı sorular görünür
cevapları sadece platform / admin verir
cevap verilince soru ve cevap birlikte görünür
en son soru-cevaplar üstte görünür
Net kurallar
soruyu sadece kullanıcı sorar
fenomen mağaza soru-cevap aktörü değildir
cevapları sadece platform verir
soru alanı PDP içinde ürün bilgi alanı olarak çalışır
3.8 Sizden gelenler / kullanıcı story katmanı

Bu katman güçlü sosyal kanıt alanıdır.

İçerir:

ilgili ürüne ait kullanıcı story şeridi
her kullanıcı için ayrı profil / story halkası
aynı ürüne ait çok sayıda farklı kullanıcının story katkısı
aynı kullanıcının aynı ürüne ait birden fazla story’sinin kendi akışı içinde açılması
kullanıcı profil görseli
profil görseli yoksa sistemin uygun varsayılan profil görseli ataması
kullanıcı adı görünmesi
Kimlik kuralları
gerçek ad değil kullanıcı adı görünür
anonim gösterim yoktur
İade ilişkisi
ürün iade olursa ilgili kullanıcı story’leri otomatik pasifleşir
görünmez hale gelir
platform isterse tekrar kullanabilir
Hafif filtreler
en yeniler
en çok beğenilenler
3.9 Benzer ürünler katmanı

Bu katman ürün çevresi oluşturur.

İçerir:

benzer ürünler

Bu alan sade tutulur.
Ayrı olarak “diğer fenomenlerin benzer ürünleri” diye bir blok açılmaz.

4. PDP’de veri ayrımı
4.1 Ürün bazlı ortak alanlar
ürün bilgisi
ürün puanı
yorumlar
sorular ve cevaplar
sizden gelenler  story ilişkisi
4.2 Mağaza bağlamlı alanlar

mağaza profili
takip ilişkisi
fenomenin notu
aynı mağaza bağlamı

Bu ayrım çok kritik:
ürün verisi ortak kalır, mağaza bağlamı giriş yapılan mağazaya göre değişir.
5. PDP’de aktörler
5.1 Kullanıcı
PDP’yi görüntüler
soru sorar
yorum yapar
yıldız verir
beğenir
kaydeder
paylaşır
story katkısı üretir
5.2 Platform
ürün doğruluğunu taşır
soru-cevapta tek cevap otoritesidir
ürün bilgi alanının merkezidir
5.3 Fenomen mağaza

mağaza bağlamını taşır
mağaza kimliğini gösterir
fenomenin notu ile sosyal bağlam ekler
kullanıcıyı mağazaya geri taşıyabilir

Fenomen mağaza, PDP içinde story akışı taşımaz; PDP’de yalnız ilgili ürüne ait kullanıcı deneyim story’leri yer alır.
5.4 Misafir kullanıcı
PDP’yi görebilir
ama etkileşim ve katkı tarafında sınırlıdır
6. PDP için güncel kalan ana riskler

Büyük kısmı temizlendi. Şu anda çekirdekte kalan başlıca riskler:

Mağaza bağlamlı PDP ile ürün bazlı ortak veri modelinin teknik olarak temiz kurulması
PDP mağaza bağlamlı açılıyor; ama yorum, puan, soru, ürün verisi ortak. Bu veri modeli backend tarafında çok net ayrılmalı.
Story alanının PDP’yi ağırlaştırması
Story şeridi güçlü sosyal kanıt ama ana satın alma alanının önüne geçmemeli.
Beğen-kaydet-paylaş verisinin kirlenmesi
Bunlar platform veri omurgası olacağı için spam ve anlamsız etkileşim riski var.
Yorum ürün bazlı olduğu için mağaza deneyiminin ayrı görünmemesi
Bu bilinçli sadeleştirme kararı; ama iş anlamında yan etki üretebilir.
Soru sisteminde platform yanıt kapasitesi
Soruları sadece admin cevaplayacağı için zamanla cevap yükü büyüyebilir.
7. Kısa nihai hüküm

Şu haliyle PDP sistemi artık güçlü biçimde oturdu:

mağaza bağlamlı açılıyor
ürün verisi ortak kalıyor
yorumlar ürün bazlı
sorular ürün bazlı ve platform cevaplı
fenomen mağaza sosyal bağlam aktörü
fenomenin notu ayrı başlıklı
beğen-kaydet-paylaş veri sistemi olarak konumlandı
kullanıcı story alanı güçlü sosyal kanıt katmanı oldu
benzer ürün alanı sade tutuldu
8. PDP’de mağaza profili görünür, kullanıcı mağazaya gider, takip eder, fenomenin notunu görür; ama story deneyimi PDP içinde açılmaz. PDP’nin tek story katmanı kullanıcı deneyim story’leridir


#####
---
REVİZYON NOTU — 2026-04-19
Durum: Açıklama notu
Etkilediği bölüm(ler): Ticari karar katmanı, stok görünürlüğü
Bağlı dosyalar: 27-merkezi stok sistemi, 13-sepet sistemi

Not:
PDP’de stok bilgisi yalnız “var / yok” mantığıyla sınırlı kalmayabilir. Özellikle kritik düşük stok seviyelerinde aşağıdaki görünürlük açılabilir:

1. son ürünler
2. sınırlı stok
3. birçok kişinin sepetinde
4. hızlı tükeniyor

Bu uyarılar rezervasyon vaadi değildir.
Amaç:
kullanıcıyı dürüst biçimde bilgilendirmek,
kritik stok baskısını görünür kılmak,
son aşamadaki hayal kırıklığını azaltmaktır.
---