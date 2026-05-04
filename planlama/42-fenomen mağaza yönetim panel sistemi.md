FENOMEN MAĞAZA YÖNETİM PANELİ SİSTEMİ
1. Sistem tanımı

Fenomen mağaza yönetim paneli, onaylı fenomenin kendi mağazasını platform kuralları içinde yönetebildiği; ürün seçkisini düzenlediği; mağaza içi içeriklerini yönettiği; müşteri ilişkilerini yürüttüğü; satış ve performans görünürlüğü aldığı; ama stok, sipariş truth, fiyat motoru ve operasyon truth’una doğrudan müdahale etmediği self-service mağaza yönetim sistemidir.

Bu sistemin görevi yalnız “ayar ekranı” sunmak değildir. Aynı zamanda:

havuzdan ürün seçmek
mağazaya ürün eklemek / çıkarmak
mağaza içi ürün sırası düzenlemek
ürün için video, görsel ve kısa not yönetmek
story ve post yayınlamak
mesajlara cevap vermek
takipçi ve etkileşim görünürlüğü almak
kendi satış ve mağaza performansını görmek
platform uyarılarını ve mağaza durumunu yönetmektir.

Kısa tanım:

Fenomen mağaza yönetim paneli, fenomenin kendi mağazasını hızlı, sade ve mobil uyumlu biçimde yönettiği self-service kontrol alanıdır.

2. Temel ilke

Bu sistemin temel ilkesi şudur:

Fenomen paneli güçlü olmalı, ama yalnız kendi mağazası ve izinli aksiyonlarıyla sınırlı kalmalıdır.

Yani:

fenomen yalnız kendi mağazasını yönetir
platform sınırlarını aşamaz
havuz dışından ürün sokamaz
fiyat motoruna doğrudan hükmedemez
stok truth’unu değiştiremez
sipariş lifecycle’ını değiştiremez
resmi ürün soru-cevap otoritesi olamaz.

Net kural:

fenomen paneli = self-service mağaza yönetimi
admin paneli = üst denetim ve kurallı kontrol merkezi

3. Sistem neden zorunludur

Fenomen mağaza sistemi zaten fenomenin şu aksiyonları yapabildiğini açıkça söylüyor:

havuzdan ürün seçebilir
mağazasına ürün ekleyebilir
mağazasındaki ürün sırasını düzenleyebilir
kurallı fiyat seçebilir
ürün için kısa not ekleyebilir
ürün için görsel ekleyebilir
ürün için video ekleyebilir
mağaza tanıtım story’si yükleyebilir
ürün story’si yükleyebilir
mağaza açıklaması yazabilir
müşterilerden mesaj alabilir
takipçi toplayabilir
mağaza kimliği oluşturabilir.

Bu kadar yoğun aksiyon, panelsiz sürdürülebilir değildir.

Bu yüzden fenomen paneli:

gerekli değil, zorunludur
ama admin panelinin küçük kopyası değil, çok daha sade görev paneli olmalıdır
4. Panelin karakteri nasıl olmalı

Fenomenlerin önemli bölümü mağaza yönetimini masaüstünden değil, büyük ölçüde telefondan sürdürecektir. Bu yüzden panel:

mobil öncelikli
tek elle kullanılabilir
görev odaklı
az tıklamalı
yüksek görsellikli
çok sade
karmaşık tablo ağırlıklı olmayan
hızlı aksiyon merkezli

olmalıdır.

Doğru yaklaşım:

masaüstünde tam panel
mobilde aynı mantığın sadeleştirilmiş sürümü
en çok yapılan işler ana ekrandan 1–2 adımda erişilebilir

Net kural:

Fenomen paneli “öğrenmesi zor profesyonel kurumsal panel” değil, “telefonla yönetilebilir mağaza kokpiti” olmalıdır.

5. Fenomen paneli ile admin paneli arasındaki fark

Fenomen panel:

kendi mağazasını yönetir
kendi verisini görür
kendi izinli içerik aksiyonlarını yapar
kendi satış/performans özetini görür

Admin panel:

tüm fenomenleri görür
başvuru onaylar/red eder
kategori yetkisi verir
askıya alma ve yaptırım uygular
görünürlük ve kural ihlali denetimi yapar.

Net kural:

fenomen paneli kendi scope’u dışına çıkamaz
admin paneli ise çoklu mağaza ve sistem denetim alanıdır

6. Panelin ana modülleri

Fenomen panelini gereksiz kalabalık yapmadan, 8 ana modülde toplamak en doğru modeldir.

6.1 Ana ekran / mağaza kokpiti

İlk ekran hızlı karar ekranı olmalıdır.

Burada en az şu kartlar görünmelidir:

bugünkü satış özeti
son 7 gün satış özeti
takipçi artışı
mesaj bekleyenler
yeni sipariş sayısı
stokta düşen ama mağazada kalan ürün uyarısı
iade etkisi
en çok görüntülenen ürünler
en çok etkileşim alan story/post
platform uyarıları
mağaza statüsü

Bu ekranın amacı rapor göstermek değil, fenomeni hızlı aksiyona taşımaktır.

6.2 Ürün Havuzu / Ürün Seçimi

Bu modül fenomenin havuzdan ürün seçtiği yerdir.

İçermeli:

kategoriye göre filtre
ürün arama
ürün kartı önizleme
fiyat koridoru görünümü
stok / uygunluk özeti
“mağazama ekle” aksiyonu
“daha sonra bak” mantığı
ürün detay ön izlemesi

Net kural:

fenomen ürün yaratmaz
yalnız havuzdan seçer.

6.3 Mağazamdaki Ürünler

Bu modül panelin çekirdeğidir.

Fenomen burada:

ürünü mağazadan kaldırabilir
ürün sırasını değiştirebilir
öne çıkarabilir
aktif/pasif görünürlüğünü yönetebilir
ürüne kısa not ekleyebilir
ürüne video/görsel bağlayabilir
mağaza içi medya setini düzenleyebilir
ürünü “videolu kart” veya “klasik görünüm” bağlamında yönetebilir

Videolu ürün kart sistemi zaten fenomenin:

sıralama yapabildiğini
ana görseli değiştirebildiğini
kendi videosunu mağaza bağlamında ekleyebildiğini
mağaza içi medya vitrini kurabildiğini söyler.

Bu modülde ürünler için durumlar da olmalı:

aktif
taslak
stok dışı
havuzdan kalktı
inceleme altında
mağazadan kaldırıldı

6.4 İçerik Stüdyosu

Fenomen panelin en kritik modüllerinden biridir.

Burada 4 ana alan olmalı:

mağaza tanıtım story’leri
ürün tanıtım story’leri
mağaza postları
ürün bağlı kısa medya içerikleri

Fenomen mağaza sistemi ve post/story sistemleri, fenomenin bu içerikleri üretebildiğini açıkça destekliyor.

Bu modülde fenomen şunları yapabilmeli:

story yükle
story sırala
story yayından kaldır
post oluştur
post taslak kaydet
post sil / pasife al
ürüne bağlı video ekle
ürüne bağlı video kaldır
mağaza tanıtım görseli güncelle

Ama kural şu olmalı:

resmi ürün soru-cevap cevabı burada verilmez
destek ticket burada çözülmez
sipariş truth burada değişmez.

6.5 Mesajlar ve Takipçi İlişkisi

Fenomen mağaza sistemi, müşterilerden mesaj alabilme ve takipçi toplama alanını zaten destekliyor.

Bu modülde:

gelen mesajlar
okunmamış mesajlar
cevap taslakları
takipçi sayısı
takipçi artışı
mesaj filtreleri
engellenen / şikayet edilen konuşmalar
hızlı cevap şablonları

olmalıdır.

Net kural:

burası sosyal / ilişkisel iletişim alanıdır
resmi destek, iade, sipariş itirazı gibi işlemler destek sistemine yönlenmelidir.

6.6 Mağaza Görünümü ve Kimliği

Fenomen mağaza his olarak bağımsız vitrin gibi çalıştığı için fenomen kendi mağaza kimliğini belli sınırlar içinde kurabilmelidir.

Bu modülde:

mağaza adı / görünen ad
mağaza açıklaması
kapak görseli
profil görseli
mağaza tanıtım metni
öne çıkan koleksiyon
mağaza ürün blok sırası
hikâye vurguları
bağlantılı sosyal görünürlük alanları

olmalıdır.

Ama kural:

ana layout ve sistem sınırları platformdadır
fenomen özgür site builder kullanmaz.
MODÜL 5 içindeki “mağaza layout’u CMS üzerinden kontrol edilebilir” kararı da buna uygundur.

6.7 Satış ve Performans Görünürlüğü

Evet, fenomen kendi mağazasının performansını görebilmelidir.

Bu modülde en az şu görünmelidir:

satış adedi
ciro özeti
iade etkisi
en çok satan ürünler
en çok görüntülenen ürünler
en çok etkileşim alan içerikler
takipçi büyümesi
mesaj yoğunluğu
kampanya etkisi
ürün bazlı performans
mağaza puanı / rozet bilgisi

MODÜL 5 açıkça satış kaydı, performans verisi ve algoritma sinyali çıktıları üretildiğini söylüyor. Ayrıca performans görünürlüğü etkiler.

Ama önemli sınır:

fenomen finansal sistemin tamamını görmez
platform iç kâr yapısını görmez
tedarikçi finansını görmez
yalnız kendi mağaza performans özetini görür

6.8 Bildirimler ve Platform Uyarıları

Fenomen için kritik bildirimler:

yeni sipariş
yeni mesaj
yeni takipçi
mağaza etkileşimi
platform uyarısı
kısıt / askı / yetki değişikliği
kampanya daveti / bilgilendirme

Bu modülde:

inbox
kritik uyarılar
aksiyon gerektiren bildirimler
okunmamış sayaçlar
olmalıdır.
7. Mobil kullanım nasıl olmalı

Bu sistem mobilde çok rahat yönetilebilmelidir.

Doğru mobil model

Alt sabit menü:

Ana Sayfa
Ürünler
İçerik
Mesajlar
Mağaza

Artı sabit hızlı aksiyon butonu:

story ekle
post oluştur
ürün ekle
video yükle

Mobil ana ekran:

büyük kartlar
az metin
tablo yerine kart görünümü
filtre yerine chip mantığı
kaydırmalı yatay hızlı görünüm
Yanlış model
masaüstü admin panelini mobile küçültmek
ağır tablo kalabalığı
çok sekmeli karmaşa
çok form ve çok alanlı ekranlar

Net kural:

mobil panel bağımsız düşünülmeli, masaüstünün sıkıştırılmış kopyası olmamalı

8. Kullanım kolaylığı için ana UX kuralları
Her ana iş 2–3 adımda bitmeli
En sık aksiyonlar ana ekranda olmalı
Taslak kaydetme desteklenmeli
Hata olursa net geri bildirim verilmeli
İçerik yüklemeleri yarım kalırsa kurtarılmalı
Kritik kısıtlar açık ve dürüst gösterilmeli
“neden yapamıyorum” sorusunun cevabı ekranda olmalı
Degraded modda kısmi çalışabilirlik korunmalı. Platform çekirdeği bunu genel ilke olarak ister.
9. Permission ve sınır modeli

Fenomen panel route’ları:

authenticated
role_restricted
olmalıdır. Panel route’ları rol bazlı korunmalı ve aksiyon bazlı permission kontrolü zorunlu olmalıdır.

Fenomen paneli şunları yapamaz:

fiyat truth’unu kırmak
sipariş lifecycle’ını değiştirmek
stok truth’una write yapmak
platform kârını görmek
resmi Q&A cevabı vermek
destek ticket çözümünü üstlenmek
başka mağazayı görmek
10. Kritik edge case kararları

Fenomen panelinde şu senaryolar net olmalı:

ürün seçildi ama stok bitti → mağazada kalır, satış kapanır
fenomen yanlış ürün seçti → kaldırabilir
ürün havuzdan kaldırıldı → mağazadan da kaldırılır
fenomen hesabı askıya alındı → mevcut mağaza görünür kalabilir, yeni içerik üretimi durur
yüksek iade oranı → görünürlük ve mağaza performans uyarısı düşebilir
sahte etkileşim şüphesi → fraud incelemeye gider.

Bu edge case’ler panel diline dürüst şekilde yansıtılmalıdır.

11. Audit ve log

Fenomen panelindeki tüm kritik aksiyonlar loglanmalıdır:

ürün ekleme
ürün kaldırma
video ekleme
video kaldırma
story yayınlama
story silme
post yayınlama
mesaj aksiyonları
mağaza görünüm değişikliği
ürün sırası değişikliği

Platform çekirdeği tüm kritik işlemlerin log ve event üretmesi gerektiğini açıkça söyler.

12. Ana kurallar

Fenomen mağaza yönetim paneli için sabitlenmesi gereken temel kurallar şunlardır:

fenomen paneli yalnız kendi mağazasını yönetir
fenomen dışarıdan ürün yükleyemez, yalnız havuzdan seçer
panel mobil öncelikli ve kolay kullanılabilir olmalıdır
ürün seçme, mağazaya ekleme/çıkarma, sıralama ve medya yönetimi panelin çekirdek işleridir
story, post, video ve mağaza kimliği içerik stüdyosu altında yönetilmelidir
mesajlar sosyal/ilişkisel iletişim alanıdır; resmi destek yerine geçmez
fenomen kendi satış ve performans özetini görebilir
fenomen stok, sipariş, fiyat ve ödeme truth’una doğrudan müdahale edemez
panel route ve permission sistemi rol bazlı korunmalıdır
tüm kritik aksiyonlar audit log üretmelidir
mobil deneyim masaüstünün küçültülmüş kopyası olmamalıdır
panel sade, hızlı ve görev odaklı olmalıdır

13. Nihai kısa özet

Fenomen mağaza yönetim paneli, onaylı fenomenin kendi mağazasını platform kuralları içinde yönettiği; havuzdan ürün seçebildiği, mağaza ürünlerini düzenleyebildiği, video/story/post gibi içerikleri yönetebildiği, mesajlara cevap verebildiği, kendi satış ve performans özetini görebildiği; ancak stok, sipariş, fiyat ve operasyon truth’una doğrudan müdahale etmediği; mobil öncelikli, sade ve çok hızlı kullanılabilir self-service mağaza yönetim sistemidir.