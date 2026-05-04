MEDYA YÖNETİM / ASSET PROCESSING SİSTEMİ
1. Sistem tanımı

Medya yönetim / asset processing sistemi, platforma yüklenen görsel, video ve gerekiyorsa türetilmiş medya varlıklarını kabul eden; format, kalite, boyut ve güvenlik doğrulaması yapan; gerekli dönüşüm ve optimizasyon işlemlerini uygulayan; yüzey bazlı uygun sürümler üreten; medya yaşam döngüsünü ve yayın uygunluğunu yöneten merkezi medya altyapı sistemidir.

Bu sistemin görevi yalnız dosya saklamak değildir. Aynı zamanda:

medya yüklemesini kabul etmek
format ve kalite doğrulaması yapmak
çözünürlük ve codec kontrolleri uygulamak
thumbnail / preview / türev sürüm üretmek
yüzeye göre uygun çıktı hazırlamak
uygunsuz veya bozuk medyayı engellemek
medya yaşam döngüsünü yönetmek
içerik sistemleri ve ticari yüzeyleri performanslı biçimde beslemektir

Kısa tanım:

Medya yönetim sistemi, platformun tüm görsel ve video varlıklarını işleyen ve dağıtıma hazırlayan merkezi medya omurgasıdır.

2. Temel ilke

Bu sistemin temel ilkesi şudur:

Platformda medya özgür dosya yığını olarak değil, kurallı varlık olarak yaşamalıdır.

Yani:

her yüklenen dosya doğrudan yayınlanmaz
önce teknik ve politik doğrulamadan geçer
sonra uygun türevleri üretilir
sonra ilgili yüzeylerde kullanılır
medya truth’u ile yüzey kullanımı birbirinden ayrılır

Net kural:

yüklenen dosya ile yayına uygun medya aynı şey değildir.

3. Sistemin platform içindeki rolü

Bu sistem şu alanlarla doğrudan ilişkilidir:

havuz sistemi
ürün kabul / onay sistemi
varyant sistemi
fenomen mağaza sistemi
fenomen mağaza yönetim paneli
tedarikçi paneli
story sistemi
kullanıcı ürün story sistemi
videolu ürün kart sistemi
klasik ürün kart sistemi
PDP sistemi
post sistemi
moderasyon sistemi
admin sistemi

Doğru akış şu olmalıdır:

medya yüklenir
teknik kontroller yapılır
işleme alınır
gerekli türevler üretilir
moderasyon/politika akışı varsa beklenir
ilgili yüzeylere yayın uygun sürüm gönderilir

Net kural:

medya yönetim sistemi içerik yüzeylerine hizmet eder; onların yerine geçmez.

4. Bu sistem neden ayrı ana sistemdir

Senin platformunda medya çok yoğun:

ürün ana görselleri
ürün videoları
fenomen mağaza ürün videoları
mağaza tanıtım story’leri
ürün tanıtım story’leri
kullanıcı ürün story’leri
mağaza post görselleri / videoları
mağaza kimlik görselleri
kategori / vitrin / kampanya görselleri

Bunları dağınık biçimde her sistemin içine gömmek şu sorunları üretir:

format standardı bozulur
kalite tutarsız olur
performans düşer
moderasyon akışı kırılır
yüzeylerde farklı medya davranışları kontrolsüzleşir
mobil deneyim ağırlaşır

Bu yüzden medya yönetim sistemi ayrı ana sistem olmalıdır.

5. Medya türleri

Bu sistem minimum şu medya türlerini desteklemelidir:

5.1 Ürün görseli

Tedarikçiden veya platformdan gelen resmi ürün görselleri

5.2 Ürün videosu

Havuzdan gelen veya platform onaylı ürün videoları

5.3 Mağaza-özel ürün videosu

Fenomenin kendi mağaza bağlamında ürüne eklediği video. Bu, global medya truth’u değil, mağaza bağlamlı vitrin medyasıdır.

5.4 Story medyası

Fenomen mağaza tanıtım story’si, ürün tanıtım story’si ve kullanıcı ürün story’si için kullanılan medya

5.5 Post medyası

Fenomen mağaza postlarındaki görsel/video

5.6 Profil / mağaza kimlik medyası

Mağaza kapak, profil, tanıtım görselleri

5.7 Kampanya / vitrin medyası

Platform kontrollü promo görselleri

Net kural:

her medya türü aynı işleme kuralıyla çalışmamalıdır.

6. Medya sahipliği

Bu sistemin en kritik alanlarından biri sahipliktir.

6.1 Global ürün medyası

Ürünün resmi medya setidir.
Havuzun onaylı medya katmanına aittir.

6.2 Mağaza içi medya vitrini

Fenomenin kendi mağazasında kurduğu medya setidir.
Bu medya:

global truth’u değiştirmez
yalnız kendi mağazasında geçerli olur

Videolu ürün kart sistemi bunu zaten açıkça ayırıyor:

global medya
mağaza içi medya vitrini ayrı katmanlardır.
6.3 Kullanıcı katkı medyası

Kullanıcı story’si gibi teslimat sonrası katkı medyasıdır.

Net kural:

resmi ürün medyası, mağaza vitrini medyası ve kullanıcı katkı medyası birbirine karıştırılmamalıdır.

7. Yükleme kaynakları

Bu sistem en az şu kaynaklardan medya kabul etmelidir:

tedarikçi paneli
fenomen paneli
kullanıcı ürün story yükleme akışı
admin paneli
XML / API ürün entegrasyonları
gerekiyorsa iç operasyon araçları

Ama her kaynağın yetkisi aynı olmamalıdır.

Örnek:

tedarikçi resmi ürün medyası yükleyebilir
fenomen mağaza-özel video yükleyebilir
kullanıcı yalnız kendi uygun katkı medyasını yükleyebilir
admin her katmanda müdahale edebilir
8. Teknik doğrulama katmanı

Yüklenen her medya en az şu teknik kontrollerden geçmelidir:

dosya tipi
dosya boyutu
çözünürlük
oran / aspect ratio
codec
süre sınırı
bozuk dosya kontrolü
minimum kalite eşiği
fazla düşük kalite kontrolü
fazla büyük / aşırı ağır dosya kontrolü

Story sistemi dosyasında medya format standardının netleşmesi gerektiği zaten belirtilmişti. Bu sistem, o standardı gerçek kurala dönüştürür.

Net kural:

teknik standardı geçmeyen medya yayına girememelidir.

9. İşleme katmanı

Doğrulanan medya için işleme katmanı çalışmalıdır.

Minimum işlemler:

Görseller için
yeniden boyutlandırma
thumbnail üretme
optimize edilmiş web sürümü
mobil sürüm
gerekiyorsa crop / safe area türevi
Videolar için
transcode
bitrate optimizasyonu
preview / poster frame üretimi
kısa önizleme üretimi
mobil uyumlu stream sürümü
farklı çözünürlük türevleri

Net kural:

ham medya doğrudan son kullanıcıya servis edilmemelidir; optimize edilmiş türev kullanılmalıdır.

10. Yüzey bazlı medya çıktıları

Aynı medya her yüzeyde aynı biçimde kullanılmamalıdır.

Minimum yüzeyler:

klasik ürün kart
videolu ürün kart
PDP galeri
story tam ekran
post kartı
mağaza kapak alanı
kategori listesi
ana sayfa promo alanı

Örnek:

story için dikey oran
ürün kartı için kart oranı
PDP için yüksek kalite galeri
mobil için hafif sürüm
masaüstü için daha büyük sürüm

Net kural:

tek medya, çok yüzey mantığında yüzey uyarlaması zorunludur.

11. Moderasyon ve yayın uygunluğu ilişkisi

Medya teknik olarak uygun olabilir ama politik olarak uygun olmayabilir.

Bu yüzden medya sistemi ile moderasyon sistemi birlikte çalışmalıdır.

Örnek alanlar:

kullanıcı ürün story medyası
fenomen post medyası
mağaza story medyası
profil / mağaza kimlik medyası

Doğru akış:

medya yüklenir
teknik işleme girer
yayın statüsü “pending_review” olabilir
moderasyon sonucu “approved / rejected / restricted” döner
yayın görünürlüğü buna göre açılır

Net kural:

işlenmiş medya, moderasyonsuz otomatik yayınlanmak zorunda değildir.

12. Medya yaşam döngüsü

Her medya varlığının bir yaşam döngüsü olmalıdır.

Minimum durumlar:

uploaded
validating
processing
processed
pending_review
approved
restricted
rejected
archived
deleted

Bu durumlar olmadan:

neden görünmediği anlaşılamaz
panel kullanıcıları hata yaşar
moderasyon ve yayın akışı karışır
13. Tedarikçi paneli ile ilişki

Tedarikçi paneli üzerinden gelen medya:

resmi ürün medyasıdır
ürün kabul / onay sistemine bağlıdır
global ürün medya truth’una adaydır

Tedarikçi için panelde şunlar olmalıdır:

görsel/video yükleme
varyant görsel eşleme
medya eksikliği uyarısı
teknik hata görünürlüğü
revizyon notu

Ama tedarikçi şunu yapamaz:

fenomen mağaza içi medya kurasyonuna müdahale etmek
kullanıcı story medyasını yönetmek
14. Fenomen paneli ile ilişki

Fenomen paneli üzerinden gelen medya:

mağaza bağlamlı medya vitrini
mağaza tanıtım story medyası
ürün tanıtım story medyası
post medyası
ürün özel video

Fenomen için panelde şunlar olmalıdır:

video yükle
video kaldır
mağaza tanıtım görseli yükle
story medyası yükle
post medyası yükle
ürün medya sırası düzenle
preview gör

Ama kural:

global ürün medya truth’unu bozmaz
yalnız kendi mağazasındaki görünüm katmanını yönetir
15. Kullanıcı ürün story sistemi ile ilişki

Kullanıcı ürün story medyası ayrı dikkat ister.

Burada:

ürün etiketi zorunludur
teslim edilmiş ürün hakkı kontrol edilir
medya moderasyon sürecine girer
story yayına uygun hale gelmeden görünmez

Bu yüzden kullanıcı story medyası:

resmi ürün medyası değildir
mağaza medyası değildir
sosyal kanıt medyasıdır
16. Admin sistemi ile ilişki

Admin panelde ayrı bir medya merkezi veya medya denetim görünümü olmalıdır.

Burada admin:

işleme hatalarını görür
bozuk medya kayıtlarını görür
bekleyen yüksek riskli medya kuyruğunu görür
medya kaldırma / pasifleştirme kararı verebilir
kritik asset probleminde yeniden işleme başlatabilir

Admin sistemi medya truth’unu topluca denetleyebilmelidir.

17. Performans ve teslim stratejisi

Bu sistemin performans tarafı çok kritiktir.

En az şu kurallar olmalıdır:

medya CDN / edge dağıtıma uygun servislenmeli
mobilde düşük ağırlıklı sürümler tercih edilmeli
autoplay yüzeylerinde hafif önizleme mantığı olmalı
yüksek kaliteli sürümler yalnız gerektiğinde yüklenmeli
lazy loading mantığı desteklenmeli
poster / thumbnail önce gelmeli, ağır video sonra yüklenmeli

Net kural:

medya kalitesi kadar medya teslim stratejisi de sistemin parçasıdır.

18. Depolama ve referans modeli

Bu sistem medya dosyasını yalnız URL olarak düşünmemelidir.

Her medya için minimum kayıt alanları:

asset_id
owner_type
owner_id
media_type
source_type
original_file_ref
processed_variant_refs
aspect_ratio
duration varsa
status
moderation_status
created_at
updated_at

Bu yapı olmadan medya lifecycle izlenemez.

19. Fraud / risk ilişkisi

Medya sistemi risk sinyali de üretmelidir.

Örnek riskler:

aynı videonun çoklu hesapta tekrar kullanılması
uygunsuz medya abuse
sahte kullanıcı story medyası
spam mağaza post medyası
telif / taklit riski
medya tabanlı manipülatif içerik örüntüsü

Net kural:

medya sistemi yalnız teknik işleme değil, risk sinyali üretimine de katkı vermelidir.

20. Audit ve kayıt

Tüm kritik medya olayları loglanmalıdır:

yükleme
doğrulama hatası
işleme başlangıcı
işleme tamamlandı
yeniden işleme
moderasyona gönderildi
onaylandı
reddedildi
yayından kaldırıldı
silindi / arşivlendi

Bu olmadan medya sorunları izlenemez.

21. Kritik edge case kararları
dosya yüklendi ama işleme başarısız oldu → kullanıcıya net hata + retry
medya işlendi ama moderasyon reddetti → yayın açılmaz
ürün havuzdan kaldırıldı → bağlı resmi medya görünürlüğü güncellenir
fenomen ürünü mağazadan kaldırdı → mağaza bağlamlı medya vitrini kapanır ama global medya kalır
kullanıcı story’si iade sonrası tartışmalı hale geldi → medya var kalabilir, görünürlük meta durumu değişebilir
aynı medya farklı yüzey oranlarına uymuyor → yüzey bazlı türev üretilir veya yükleme aşamasında bloklanır
çok büyük video mobil yüzey için ağır → hafif önizleme ve optimize türev zorunlu olur
22. Ana kurallar

Medya yönetim / asset processing sistemi için sabitlenmesi gereken temel kurallar şunlardır:

medya sistemi ayrı ana sistemdir
yüklenen dosya ile yayına uygun medya aynı şey değildir
resmi ürün medyası, mağaza vitrini medyası ve kullanıcı katkı medyası ayrılmalıdır
her medya teknik doğrulamadan geçmelidir
optimize türevler üretilmelidir
yüzey bazlı medya sürümleri desteklenmelidir
moderasyon gerektiren medya doğrudan görünür olmamalıdır
fenomen yalnız kendi mağaza bağlamlı medyasını yönetebilir
tedarikçi yalnız resmi ürün medya truth’una aday medya yükleyebilir
kullanıcı ürün story medyası ayrı uygunluk ve moderasyon akışında çalışmalıdır
performans ve medya teslim stratejisi sistemin parçasıdır
tüm kritik olaylar audit log üretmelidir
23. Nihai kısa özet

Medya yönetim / asset processing sistemi, platforma yüklenen ürün görselleri, ürün videoları, mağaza özel videolar, story medyaları, post medyaları ve kimlik görselleri gibi tüm medya varlıklarını teknik olarak doğrulayan, işleyen, optimize eden, yüzey bazlı türevler üreten, moderasyon ve yayın uygunluğu statüsü yöneten ve performanslı dağıtıma hazırlayan merkezi medya altyapı sistemidir.



######
---
REVİZYON NOTU — 2026-04-19
Durum: Teknik açıklama notu
Etkilediği bölüm(ler): Medya yaşam döngüsü, cold storage, türev görünürlük
Bağlı dosyalar: 34-kullanıcı story sistemi, 37-öneri ve sıralama sistemi

Not:
Bu sistem tüm medyayı tek sıcak katmanda tutmak zorunda değildir. Özellikle kullanıcı story ve yüksek hacimli UGC için aşağıdaki yaşam döngüsü modeli açılabilir:

1. Hot media:
   aktif ve sık gösterilen medya

2. Warm media:
   daha az gösterilen ama erişilebilir medya

3. Cold storage:
   görünür yüzeylerde aktif taşınmayan, arşivlenmiş medya

4. PDP ve diğer yüzeylerde tüm UGC medya seti aynı anda yüklenmez.
5. Seçili story seti öneri / sıralama ve görünürlük kuralları ile belirlenir.
6. Eski medya tamamen silinmeden daha düşük maliyetli depolama katmanına taşınabilir.

Net sonuç:
Medya truth’u korunur; fakat performans ve maliyet için görünürlük katmanı ile depolama katmanı ayrılır.
---

6. X Yüksek hacimli UGC medya yaşam döngüsü

Özellikle kullanıcı story ve benzeri yüksek hacimli UGC içeriklerde tüm medya aynı sıcak katmanda tutulmaz.

Doğru model:

hot media = aktif ve sık gösterilen içerik
warm media = daha az gösterilen ama erişilebilir içerik
cold storage = görünür yüzeylerde aktif taşınmayan arşiv medya

PDP ve diğer yüzeylerde tüm UGC medya seti aynı anda yüklenmez.
Seçili görünür story seti öneri / sıralama ve görünürlük kuralları ile belirlenir.

Net kural:
medya truth’u korunur; fakat performans ve maliyet için görünürlük katmanı ile depolama katmanı ayrılır.