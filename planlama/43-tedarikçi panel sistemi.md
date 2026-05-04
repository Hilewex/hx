TEDARİKÇİ PANEL SİSTEMİ
1. Sistem tanımı

Tedarikçi panel sistemi, onaylı tedarikçinin platforma ürün verisi sunduğu, ürün kabul sürecini takip ettiği, stok ve baz fiyat güncellediği, lojistik alanları yönettiği, sipariş düştüğünde hazırlama ve sevkiyat işlemlerini yürüttüğü; ancak ticari otorite, kampanya rejimi, satış fiyatı ve platform karar truth’una doğrudan müdahale etmediği self-service tedarikçi çalışma sistemidir.

Bu sistemin görevi yalnız ürün yüklemek değildir. Aynı zamanda:

ürün verisi girmek
varyant yapısı kurmak
stok güncellemek
baz fiyat güncellemek
lojistik alanları yönetmek
ürün kabul durumunu izlemek
revizyon isteklerini görmek
sipariş hazırlamak
sevkiyat bilgisini girmek
problemli siparişleri yönetmek
performans ve kalite görünürlüğü almaktır.

Kısa tanım:

Tedarikçi panel sistemi, tedarikçinin platform içindeki ürün besleme ve fulfillment çalışma alanıdır.

2. Temel ilke

Bu sistemin temel ilkesi şudur:

Tedarikçi ürün ve operasyon girdisi sağlar; ticari son kararı vermez.

Yani:

ürünü tedarikçi yükler
stok bilgisini tedarikçi sağlar
baz fiyatı tedarikçi girer
sipariş düşünce ürünü hazırlar ve gönderir
ama ürün onayını kendi başına veremez
havuz satış fiyatını belirleyemez
platform kârını göremez
fenomen fiyat koridorunu belirleyemez
kampanya rejimini açamaz.

Net kural:

tedarikçi paneli = ürün ve fulfillment çalışma paneli
admin paneli = üst denetim ve karar merkezi

3. Sistem neden zorunludur

Havuz sistemi ve ürün kabul sistemi, tedarikçinin şu rollere sahip olduğunu açıkça söyler:

ürün yükler
ürün bilgilerini girer
varyant tanımlar
stok girer ve günceller
baz fiyat girer
lojistik verileri girer
sipariş düştüğünde ürünü hazırlar ve gönderir.

Bu kadar yoğun operasyon, panelsiz sürdürülemez.

Bu yüzden tedarikçi paneli:

gerekli değil, zorunludur
ama ticari karar paneli değil, girdi ve operasyon paneli olmalıdır
4. Panelin karakteri nasıl olmalı

Tedarikçi panel:

iş odaklı
hızlı
tablo + form dengeli
hata azaltıcı
mobilde temel işlerini yapabilir
masaüstünde yoğun veri yönetimine uygun
revizyon ve kontrol dostu
operasyonel

olmalıdır.

Doğru yaklaşım:

masaüstünde güçlü liste ve toplu işlem
mobilde stok, sipariş hazırlama ve kritik uyarı odaklı sade kullanım
veri girişi kontrollü şablonlarla yapılmalı
serbest kaos yerine zorunlu alanlı çalışma mantığı olmalı

Net kural:

tedarikçi paneli fenomen paneli kadar sosyal ve hafif değil; daha operasyonel ama yine de sade olmalıdır.

5. Tedarikçi paneli ile admin paneli arasındaki fark

Tedarikçi panel:

kendi ürünlerini görür
kendi stok ve baz fiyatını günceller
kendi sipariş hazırlık akışını yönetir
revizyon/ret gerekçelerini görür
kendi performansını görür

Admin panel:

tüm tedarikçileri görür
tedarikçi başvurusu onaylar/red eder
ürün onayı verir/reddeder
kategori kısıtı uygular
ceza ve askı uygular
merkezi fiyat ve kampanya kararlarını yönetir.
6. Panelin ana modülleri
6.1 Ana ekran / operasyon kokpiti

İlk ekran hızlı kontrol ekranı olmalıdır.

Burada en az şu kartlar bulunmalıdır:

bekleyen ürün revizyonları
incelemede ürün sayısı
reddedilen ürünler
stok uyarıları
baz fiyat güncelleme bekleyen ürünler
yeni düşen siparişler
hazırlanması geciken siparişler
sevkiyat bekleyen siparişler
iade/iptal etkileri
platform uyarıları
hesap durumu

Amaç:
tedarikçiyi veri denizine değil, doğrudan aksiyon gerektiren alanlara taşımaktır.

6.2 Ürün Yükleme Merkezi

Bu modül tedarikçinin ana giriş alanıdır.

Desteklemeli:

manuel ürün girişi
XML/feed gönderimi
API entegrasyon durumu
taslak ürün kaydı
zorunlu alan kontrolü
toplu yükleme sonucu görünümü

Ürün kabul sistemi açıkça şunu söyler:
hangi kanaldan gelirse gelsin ürün önce 1. havuza düşer; doğrudan canlı satışa gitmez.

Bu modülde tedarikçi şu alanları yönetebilmelidir:

ürün adı
kısa açıklama
detaylı açıklama
marka
kategori önerisi
teknik özellikler
medya
varyant seti
lojistik alanlar
baz fiyat
stok

6.3 Ürünlerim / Kabul Durumu

Bu modülde ürünlerin yaşam durumu görünmelidir:

taslak
yüklenmiş
incelemede
revizyon istendi
reddedildi
onaylandı
2. havuza geçti
pasife alındı

Detay ekranında:

ürün verisi
admin revizyon notları
eksik alanlar
red gerekçesi
son güncelleme tarihi
yeniden gönder
taslağa al
arşivle

Bu modül ürün kabul/onay sistemiyle doğrudan bağlantılıdır.

6.4 Varyant ve Medya Yönetimi

Varyant sistemi ayrı ve kritiktir. Varyant, yalnız görsel seçenek değil; stok, baz fiyat ve SKU taşıyabilen ticari alt birimdir.

Bu modül tedarikçiye şunları vermelidir:

renk / beden / numara / hacim / ölçü vb. varyant tanımı
varyant bazlı stok
varyant bazlı baz fiyat
varyant bazlı ürün kodu
varyant bazlı görsel
medya sıralama
eksik medya uyarısı

Net kural:

tedarikçi varyant ve resmi medya çekirdeğini yönetir
ama mağaza içi kurasyon katmanı fenomen tarafında kalır.

6.5 Stok ve Baz Fiyat Yönetimi

Bu modül panelin çekirdeğidir.

Tedarikçi burada:

stok günceller
varyant bazlı stok günceller
baz fiyat günceller
stok tükenen ürünleri görür
anormal stok dalgalanmasını görür

Ama kural:

satış fiyatını belirlemez
platform kârını görmez
kampanya fiyatını belirlemez.

Stok sistemi ayrıca stok truth’unun merkezi olduğunu, tedarikçinin kaynak girdisi verdiğini söyler.

Bu yüzden panelde görünen şey:

kendi sağladığı stok ve baz fiyat girdileri
olmalıdır; final satış truth’u değil.
6.6 Lojistik ve Ürün Hazırlık Alanı

Tedarikçi lojistik verileri girmek zorundadır. Havuz ve teslimat sistemi bunu açıkça destekler.

Bu modülde:

kargo ölçüleri
ağırlık
paketleme notları
hazırlama süresi
gönderim uygunluk alanları
teslimat bölgesi / kısıtları
özel taşıma notları

yönetilmelidir.

Bu alan ürün kabul kalitesini ve teslimat doğruluğunu doğrudan etkiler.

6.7 Sipariş Hazırlama ve Sevkiyat

Bu modül tedarikçi panelin ikinci çekirdeğidir.

Burada tedarikçi:

kendine düşen sipariş satırlarını görür
hazırlanacak siparişleri filtreler
hazırlamaya aldı işaretler
paketleme tamamlandı işaretler
sevkiyat / takip bilgisi girer
problem bildirir

Kargo/teslimat sistemi, siparişin fulfillment hattına düştüğünü ve tedarikçinin ürünü hazırlayıp gönderdiğini açıkça söyler.

Net kural:

tedarikçi sipariş operasyonunda rol alır
ama sipariş truth owner’ı değildir
statü akışını istediği gibi değiştiremez.

6.8 İptal / İade Etkileri

Tedarikçi nihai iade otoritesi değildir ama operasyonel etkisi vardır. İptal/iade sistemi bunu destekler.

Bu modülde tedarikçi:

kendisini ilgilendiren iptal nedenlerini görebilir
iade talebi gelen satırları görebilir
geri kabul / kalite notu işleyebilir
operasyonel yorum bırakabilir

Ama:

nihai müşteri kararı
finansal geri dönüş kararı
görünürlük / yorum / puan etkisi kararı
platformda kalmalıdır.
6.9 Performans ve Kalite Görünürlüğü

Tedarikçi kendi performansını görmelidir.

Bu modülde en az şunlar bulunmalıdır:

yüklediği ürün sayısı
onay oranı
red oranı
revizyon oranı
stok doğruluk oranı
gecikmeli gönderim oranı
iptal etkisi
iade kalite sinyali
en çok satan ürünler
sorunlu ürünler
kategori performansı

Bu görünürlük tedarikçinin kendini düzeltmesini sağlar; ama platform karar yetkisini ona devretmez.

6.10 Bildirimler ve Platform Uyarıları

Kritik bildirimler:

ürün revizyon istendi
ürün reddedildi
ürün onaylandı
yeni sipariş düştü
sevkiyat gecikiyor
stok kritik seviyede
hesap uyarısı / askı riski
kategori kısıtı değişti

Bildirim sistemi çok taraflı çalıştığı için tedarikçi hattında bu alan zorunludur.

7. Mobil kullanım nasıl olmalı

Tedarikçi panelin mobilde ana işleri yapılabilmeli, ama yoğun katalog yönetimi masaüstünde daha rahat olmalıdır.

Mobilde öncelikli işler:

yeni siparişleri görmek
hazırlama statüsü yönetmek
sevkiyat bilgisi girmek
stok güncellemek
kritik uyarıları görmek

Doğru mobil model:

alt menü: Ana Sayfa / Ürünler / Siparişler / Stok / Hesap
hızlı aksiyon: stok güncelle, sipariş hazırla, sevkiyat gir

Yanlış model:

masaüstü yoğun tabloyu küçültüp telefona sıkıştırmak
8. Kullanım kolaylığı için ana UX kuralları
Kritik işler 2–3 adımda bitmeli
Zorunlu alanlar net işaretlenmeli
Hata mesajları teknik değil, düzeltilebilir olmalı
Revizyon istekleri maddeli gösterilmeli
Toplu stok/fiyat güncelleme desteklenmeli
Sipariş hazırlama ekranı çok hızlı olmalı
Mobilde operasyon, masaüstünde katalog ağırlığı dengelenmeli
Kısıtların nedeni açık yazılmalı
9. Permission ve sınır modeli

Tedarikçi panel route’ları:

authenticated
role_restricted
olmalıdır. Kritik aksiyonlar role + action bazlı korunmalıdır.

Tedarikçi paneli şunları yapamaz:

ürünü kendi başına onaylamak
havuz satış fiyatı belirlemek
kampanya açmak
fenomen fiyat koridorunu görmek
sipariş truth’unu keyfi değiştirmek
platform kârını görmek
diğer tedarikçileri görmek
10. Kritik edge case kararları
ürün yüklendi ama eksik alan var → incelemeye tam gitmez, düzeltme ister
ürün reddedildi → gerekçe görünür, yeniden gönderilebilir
stok sıfırlandı → ürün satıştan düşebilir ama mağaza bağlamı platformca yönetilir
baz fiyat değişti → satış fiyatı otomatik platform kurallarında yeniden işlenir
sipariş hazırlanamadı → problem escalation açılır
tedarikçi geç sevk ediyor → kalite sinyali düşer, yönetim sistemine gider
hesap askıya alındı → yeni ürün/sipariş aksiyonları kısıtlanır
11. Audit ve log

Tüm kritik aksiyonlar loglanmalıdır:

ürün yükleme
ürün güncelleme
stok değişimi
baz fiyat değişimi
varyant değişimi
sevkiyat bilgisi girişi
problem bildirimi
iade operasyon notu
hesap ayarı değişikliği

Panel kuralları buna açıkça ihtiyaç duyar.

12. Ana kurallar

Tedarikçi panel sistemi için sabitlenmesi gereken temel kurallar şunlardır:

tedarikçi paneli yalnız kendi hesap ve kayıtları üzerinde çalışır
ürün kaynağı tedarikçidir ama ticari otorite platformdur
tedarikçi ürün, varyant, stok, baz fiyat ve lojistik girdisi sağlar
ürün hangi kanaldan gelirse gelsin önce kabul/onay hattına düşer
tedarikçi ürün onayını kendi başına veremez
tedarikçi havuz satış fiyatını belirleyemez
platform kârını göremez
sipariş düştüğünde hazırlama ve sevkiyat işlemlerini yürütür
sipariş lifecycle truth’unu keyfi değiştiremez
mobilde temel operasyon işleri kolay yapılabilmelidir
kritik aksiyonlar audit log üretmelidir

13. Nihai kısa özet

Tedarikçi panel sistemi, onaylı tedarikçinin platforma ürün verisi sunduğu, varyant/stok/baz fiyat ve lojistik girdilerini yönettiği, ürün kabul sürecini takip ettiği, sipariş düştüğünde hazırlama ve sevkiyat işlemlerini yürüttüğü; fakat ürün onayı, satış fiyatı, kampanya ve sipariş truth’una doğrudan hükmetmediği; masaüstünde güçlü, mobilde ise temel operasyonları rahat yöneten self-service ürün ve fulfillment çalışma panelidir.

######


---
REVİZYON NOTU — 2026-04-19
Durum: Açıklama notu
Etkilediği bölüm(ler): Panel modülleri, ürün bilgi katkısı
Bağlı dosyalar: 32-soru cevap sistemi, 40-admin sistemi

Not:
Tedarikçi paneli, resmi ürün soru-cevap yayın otoritesi değildir. Ancak ölçeklenebilir ürün bilgi akışı için aşağıdaki alan açılabilir:

1. Tedarikçi, kendi ürünleri için teknik bilgi odaklı taslak soru-cevap cevabı girebilir.
2. Bu cevap taslak statüsünde kalır; doğrudan PDP’ye yayınlanmaz.
3. Platform / admin onay verirse cevap resmi görünürlüğe çıkar.
4. Tedarikçi bu yolla bilgi sağlar; yayın owner’ı yine platformdur.
5. Fenomen panelinde bu yetki açılmaz.

Bu not, tedarikçiyi resmi cevap owner’ı yapmaz; yalnız kontrollü bilgi kaynağı haline getirir.
---

6. x.  Soru-cevap taslak cevap modülü

Bu modül tedarikçiyi resmi cevap owner’ı yapmaz; yalnız bilgi katkısı üretim alanı açar.

Desteklemeli:

kendi ürününe gelen teknik soruları görme
taslak cevap girme
cevabı kaydetme / güncelleme
incelemeye gönderme
platform onay durumunu izleme
reddedilen taslak için revizyon notu görme

Net kural:
tedarikçi cevabı doğrudan PDP’de yayınlanmaz.
Nihai görünür resmi cevap owner’ı platformdur.