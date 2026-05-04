TEDARİKÇİ YÖNETİM SİSTEMİ
1. Sistem tanımı

Tedarikçi yönetim sistemi, platforma ürün sağlayan tedarikçi adaylarının başvuru değerlendirmesini, onay sonrası tedarikçi yaşam döngüsünü, kategori yetkilerini, ürün yükleme kalitesini, stok ve sevkiyat güvenilirliğini, ceza ve askı kararlarını yöneten merkezi yönetim sistemidir.

Bu sistemin görevi yalnız başvuru almak değildir. Aynı zamanda:

tedarikçi adayını değerlendirmek
uygun bulunan adayı onaylamak veya reddetmek
kategori bazlı yükleme yetkisi vermek
ürün kabul kalitesini izlemek
stok doğruluk performansını izlemek
sevkiyat gecikmelerini izlemek
iade ve iptal kaynaklı kalite sorunlarını görmek
gerekirse uyarı, kısıt, askı veya kalıcı kapatma kararı vermektir

Kısa tanım:

Tedarikçi yönetim sistemi, tedarikçinin başvurudan aktif operasyonel yaşam döngüsüne kadar platform içindeki tüm yönetim ve denetim yapısını taşıyan sistemdir.

2. Temel ilke

Bu sistemin temel ilkesi şudur:

Tedarikçi ürün kaynağıdır; ticari ve sistemsel nihai otorite platformdur.

Yani:

tedarikçi ürün verisi sağlar
stok ve baz fiyat girdisi sağlar
sipariş düşünce ürünü hazırlar ve gönderir
ama ürün onayını kendi başına veremez
satış fiyatını belirleyemez
kampanya rejimi açamaz
platform kârını göremez
platformun sınıflandırma ve düzeltme kararını aşamaz

Bu ilke esnetilmez.

3. Sistemin platform içindeki rolü

Tedarikçi yönetim sistemi, admin sistemi altındaki temel alt modüllerden biridir.

Doğru yapı şudur:

admin sistemi üst şemsiyedir
başvuru merkezi admin altında çalışır
tedarikçi yönetim sistemi, onay sonrası yaşam döngüsünü taşır
tedarikçi paneli ise tedarikçinin kendi self-service kullanım alanıdır

Bu yüzden tedarikçi yönetim sistemi:

başvuru sonucunu devralır
tedarikçi statüsünü yönetir
kategori yetkilerini yönetir
kalite ve operasyon sinyallerini izler
uyarı / kısıt / askı uygular
gerekirse tedarikçiyi sistem dışına çıkarır
4. Bu sistem tedarikçi paneliyle aynı şey değildir

Bu ayrım net olmalıdır.

Tedarikçi paneli şunları yapar:

ürün yükleme
stok güncelleme
baz fiyat güncelleme
lojistik veri girişi
sipariş hazırlama
sevkiyat bilgisi girme

Tedarikçi yönetim sistemi ise şunları yapar:

kim tedarikçi olabilir
kim onaylanır
hangi kategorilerde yükleme yapabilir
kalite problemi var mı
stok güvenilir mi
sevkiyat disiplini yeterli mi
uyarı gerekir mi
askıya alma gerekir mi
yükleme yetkisi daraltılmalı mı

Net kural:

tedarikçi paneli çalışma alanıdır, tedarikçi yönetim sistemi denetim ve yaşam döngüsü sistemidir.

5. Aktörler

Bu sistemde en az şu aktörler olmalıdır:

5.1 Tedarikçi adayı

Henüz onay almamış başvuru sahibidir.

5.2 Onaylı tedarikçi

Platform tarafından kabul edilmiş, belirli kategori ve operasyon sınırlarında ürün sağlayabilen aktördür.

5.3 Admin / Commerce Admin / Supplier Admin

Başvuru, kategori yetkisi, askı, ceza ve statü kararlarını veren taraftır.

5.4 Operations / Quality / Support / Risk yan aktörleri

Tedarikçi hakkında sinyal üretirler; ama nihai statü kararı admin tarafında kalır.

6. Tedarikçi yaşam döngüsü

Bu sistem yaşam döngüsü bazlı çalışmalıdır.

Minimum durumlar:

6.1 Başvuru alındı

Tedarikçi başvurusu sisteme düştü.

6.2 Ön incelemede

Belgeler, şirket bilgileri, kapasite ve uygunluk kontrol ediliyor.

6.3 Revizyon istendi

Eksik belge, eksik bilgi veya açıklama ihtiyacı var.

6.4 Onaylandı

Tedarikçi hesabı aktifleşir, kategori ve yükleme yetkileri açılır.

6.5 Aktif

Tedarikçi düzenli şekilde ürün ve operasyon akışı yürütür.

6.6 Kısıtlı aktif

Tam kapalı değildir ama belirli sınırlar uygulanmıştır.
Örnek:

bazı kategori yüklemeleri kapalı
yeni ürün yükleme sınırı var
yalnız mevcut ürünleri güncelleyebilir
ek inceleme altında çalışır
6.7 Askıda

Yeni yükleme ve kritik operasyon aksiyonları durdurulur.

6.8 Kalıcı kapalı / sonlandırıldı

Tedarikçi yaşam döngüsü platform tarafından sonlandırılmıştır.

7. Başvuru sistemi ile ilişkisi

Tedarikçi herkese otomatik açılmamalıdır.

Başvuru değerlendirmesinde en az şu alanlar olmalıdır:

şirket / kişi bilgisi
iletişim doğruluğu
vergi / resmi belge doğruluğu
ürün kategorisi uygunluğu
tedarik kapasitesi
lojistik ve operasyon yeterliliği
kalite ve güvenilirlik ön değerlendirmesi
varsa önceki platform geçmişi
risk / sahtecilik / taklit şüphesi

Net kural:

başvuru kararı admin tarafında verilir
tedarikçi yönetim sistemi bu kararı devralır
onay sonrası aktif yaşam döngüsünü burada taşır
8. Kategori ve yükleme yetki sistemi

Tedarikçi her kategoriye yükleme yapamamalıdır.

Bu sistem şunu yönetmelidir:

hangi kategorilere ürün yükleyebilir
hangi kategorilerde yalnız revizyonlu çalışır
hangi kategoriler geçici kapalıdır
hangi kategoriler kalite problemi nedeniyle kapatılmıştır

Kategori yetki durumları:

yetkili
kısıtlı yetkili
inceleme altında
kapalı

Bu yapı katalog kalitesini korur.

9. Tedarikçinin yönetimsel sınırları

Tedarikçi şunları yapabilir:

ürün verisi sağlamak
varyant tanımlamak
stok girmek
baz fiyat girmek
lojistik alanları girmek
sipariş hazırlamak
sevkiyat bilgisi sunmak

Tedarikçi şunları yapamaz:

ürün onayını kendi başına vermek
satış fiyatı belirlemek
platform kârını görmek
kampanya açmak
fenomen fiyat alanına müdahale etmek
sipariş truth’unu keyfi değiştirmek
diğer tedarikçileri görmek

Bu sınırlar tedarikçi yönetim sisteminde enforcement düzeyinde korunmalıdır.

10. Kalite yönetimi

Tedarikçi yönetim sistemi yalnız başvuru ve statü sistemi olmamalı; kalite sistemi de taşımalıdır.

İzlenmesi gereken ana kalite başlıkları:

ürün veri doğruluğu
eksik alan oranı
revizyon oranı
red oranı
stok doğruluk oranı
geç sevkiyat oranı
iptal etkisi
iade kalite etkisi
sorunlu kategori yoğunluğu
tekrar eden lojistik hata

Bu alanlar tedarikçi hakkında karar üretir.

11. Uyarı, kısıt ve yaptırım sistemi

Minimum yaptırım seviyeleri şöyle olmalıdır:

11.1 İç uyarı

Kayıtlı uyarı verilir.

11.2 Operasyon uyarısı

Sevkiyat, stok, kalite veya veri doğruluğu tarafında resmi uyarı verilir.

11.3 Kategori kısıtı

Belirli kategoriler kapatılır.

11.4 Ürün yükleme kısıtı

Yeni ürün yükleme geçici durdurulur.

11.5 Ek inceleme modu

Yüklenen ürünler daha sıkı kabul sürecine alınır.

11.6 Geçici askı

Kritik ihlal veya sürekli kalite bozulmasında uygulanır.

11.7 Kalıcı kapatma

Ağır ihlal, sahtecilik, sistematik kötü kalite veya ciddi güven ihlalinde uygulanır.

Net kural:

Bu yaptırımlar keyfi olmamalı; gerekçeli, kayıtlı ve audit’li olmalıdır.

12. Operasyon performansı görünürlüğü

Tedarikçi yönetim sistemi, admin tarafında şu görünürlükleri üretmelidir:

yüklenen ürün sayısı
onaylanan ürün sayısı
reddedilen ürün sayısı
revizyon oranı
stok güvenilirliği
hazırlama hızı
sevkiyat gecikmesi
iptal etkisi
iade kalite etkisi
kategori bazlı başarı
en problemli ürün grupları

Bu görünürlük, askı ve kısıt kararları için temel veri olur.

13. Sipariş ve fulfillment ilişkisi

Tedarikçi sipariş operasyonunda rol alır ama owner değildir.

Doğru model:

sipariş platformda oluşur
fulfillment hattına düşer
tedarikçi kendi hazırlık görevini yürütür
sevkiyat bilgisini sağlar
ama sipariş yaşam döngüsünü serbest biçimde yönetemez

Bu ayrım tedarikçi yönetim sisteminde net korunmalıdır.

14. İptal / iade ilişkisi

Tedarikçi iptal/iade sürecinin nihai karar otoritesi değildir; ama operasyonel etkisi vardır.

Bu sistem şunları izlemelidir:

hangi tedarikçide iptal daha yüksek
hangi tedarikçide kalite iadesi fazla
hangi ürünlerde tekrar eden sorun var
geri kabul disiplini nasıl
operasyonel problem kaynaklı iade var mı

Bu sinyaller tedarikçi kalite ve risk puanına etki etmelidir.

15. Admin sistemi ile ilişkisi

Tedarikçi yönetim sistemi admin sistemi altında çalışmalıdır.

Doğru ilişki şudur:

başvuru merkezi adminde bulunur
tedarikçi yönetim modülü admin altında ayrı alt modüldür
başvuru sonucu burada aktif yönetime dönüşür
kategori yetkileri, kısıtlar, askılar ve yaşam döngüsü burada yönetilir
panel direct write yapılmaz; owner sisteme command gönderilir
16. Tedarikçi paneli ile ilişkisi

Tedarikçi paneli, tedarikçinin kendi self-service alanıdır.

Tedarikçi yönetim sistemi ise adminin şu sorulara cevap verdiği üst katmandır:

bu tedarikçi güvenilir mi
yükleme kalitesi yeterli mi
hangi kategoriler açık olmalı
operasyon disiplini yeterli mi
askı gerekir mi
ek inceleme gerekir mi

Bu iki katman karıştırılmamalıdır.

17. Kayıt ve audit alanı

Her kritik karar için kayıt tutulmalıdır:

karar tipi
kararı veren admin rolü
tarih
tedarikçi ID
önceki durum
yeni durum
gerekçe
ek not
varsa bitiş tarihi
varsa tekrar inceleme tarihi

Örnek kararlar:

başvuru onayı
başvuru reddi
revizyon isteği
kategori açma
kategori kapatma
yükleme kısıtı
geçici askı
kalıcı kapatma
18. Ana kurallar

Tedarikçi yönetim sistemi için sabitlenmesi gereken temel kurallar şunlardır:

tedarikçi herkese açık bir hak değildir
başvuru ve platform onayı zorunludur
tedarikçi ürün kaynağıdır, ticari otorite değildir
kategori yetkisini yalnız platform verir
tedarikçi satış fiyatını belirleyemez
platform kârını göremez
ürün kabul kararı platformdadır
kalite ve operasyon performansı sürekli izlenmelidir
gerekirse uyarı, kısıt, askı ve kapatma uygulanabilir
admin sistemi merkezi otoritedir
tüm kritik kararlar audit log üretmelidir
panel direct write yapılmamalıdır
19. Nihai kısa özet

Tedarikçi yönetim sistemi, tedarikçi adayının başvurudan başlayarak onay, kategori yetkisi, aktif operasyonel yaşam döngüsü, kalite ve sevkiyat performansı, kısıt, askı ve kapatma gibi süreçlerini taşıyan; tedarikçi paneliyle karıştırılmaması gereken; admin sistemi altında çalışan; fakat owner truth’a doğrudan yazmadan kurallı yönetim aksiyonlarıyla ilerleyen merkezi tedarikçi yaşam döngüsü ve denetim sistemidir.