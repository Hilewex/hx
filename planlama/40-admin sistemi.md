ADMIN SİSTEMİ
1. Sistem tanımı

Admin sistemi, platformun tüm kritik ticari, operasyonel, güvenlik, moderasyon ve yönetim kararlarının tek merkezden görüldüğü, denetlendiği ve kurallı aksiyonlarla yönetildiği merkezi kontrol sistemidir.

Bu sistemin görevi yalnız veri göstermek değildir. Aynı zamanda:

fenomen başvurularını görmek ve karara bağlamak
tedarikçi başvurularını görmek ve karara bağlamak
fenomen ve tedarikçi yaşam döngüsünü yönetmek
ürün kabul / onay sürecini denetlemek
merkezi fiyat, kampanya ve puan kurallarını yönetmek
sipariş ve satış operasyonunu izlemek
moderasyon ve destek süreçlerini denetlemek
kural / yetki enforcement yapısını taşımak
tüm kritik aksiyonları audit log ile kayıt altına almaktır.

Kısa tanım:

Admin sistemi, platformun üst yönetim, denetim ve kurallı müdahale merkezidir.

2. Temel ilke

Bu sistemin temel ilkesi şudur:

Admin güçlüdür ama sınırsız değildir.

Yani:

admin her kritik alanı görebilir
admin karar verebilir
admin onay / red / askıya alma / kural değiştirme gibi aksiyonlar başlatabilir
ama admin panel truth alanlarına serbest ve doğrudan write yapmaz

Net kural:

panel direct write yapmaz
owner dışı write yoktur
panel owner modüle protected action / command gönderir
audit’siz manuel müdahale yapılamaz.

3. Sistemin platform içindeki rolü

Platform sistem ağacına göre admin sistemi; ürün, mağaza, operasyon ve kural denetiminin toplandığı merkezdir. Fenomen yönetim sistemi, tedarikçi yönetim sistemi ve sipariş operasyon sistemi bununla doğrudan bağlantılı ayrı alt yönetim alanlarıdır. Bu nedenle admin sistemi bunları dışarıdan izleyen zayıf panel değil, onların üst koordinasyon ve enforcement katmanı olmalıdır.

Bu yüzden admin sistemi:

fenomen yönetimini kapsar
tedarikçi yönetimini kapsar
sipariş operasyon tarafını kapsar
ürün kabul ve ticari kontrolü kapsar
moderasyon ve destekle birlikte çalışır
kural / yetki sistemiyle sıkı bağlı çalışır.

4. Admin sistemi tek rol değildir

Tek bir “admin” rolü bu platform için yetersizdir. Doğru model, admin sistemi içinde alt rol ve yetki katmanları kurmaktır. Kural / yetki sistemi zaten admin, moderatör, operasyon, finans ve panel action caller ayrımını zorunlu kılar. View permission ve action permission da ayrı düşünülmelidir.

Bu nedenle admin sistemi en az şu alt rolleri taşımalıdır:

4.1 Super Admin

Tüm modülleri görür. Kritik kural değişiklikleri, yüksek riskli askıya alma, rol atama ve sistemsel üst onay alanıdır.

4.2 Commerce Admin

Fenomen ve tedarikçi başvuruları, ürün kabul, fiyat kuralları, kampanya ve mağaza ticari uygunluk kararlarını yönetir.

4.3 Fenomen Admin

Fenomen başvuru incelemesi, fenomen mağaza statüsü, kategori yetkileri, ihlal geçmişi ve mağaza kısıtlama kararlarını yönetir.

4.4 Supplier Admin

Tedarikçi başvuru, tedarikçi kalite durumu, yükleme hakkı, kategori kısıtı, ceza ve askı kararlarını yönetir.

4.5 Operations Admin

Sipariş operasyonu, fulfillment sorunu, gecikme, iptal/iade escalation ve shipment problem alanını yönetir.

4.6 Moderation Admin

Yorum, kullanıcı story, soru-cevap, post ve mağaza içerik denetimini yönetir.

4.7 Support Admin

Ticket akışı, kullanıcı problem çözümü, SLA ve destek escalations yönetir.

4.8 Finance Admin

Ödeme problemi, refund takibi, finansal anomali ve puan/ödül suistimali gibi alanlara bakar.

4.9 Analytics / Growth Admin

Satış, dönüşüm, mağaza performansı, kampanya etkisi ve trend görünürlüğünü izler; ama ranking truth’una sınırsız müdahale etmez.

5. Admin sisteminin ana modül yapısı
5.1 Kontrol Kulesi / Ana Dashboard

İlk ekran karar ekranı olmalıdır. Dekoratif rapor ekranı olmamalıdır.

Burada en az şu kutular bulunmalıdır:

bekleyen fenomen başvuruları
bekleyen tedarikçi başvuruları
bekleyen ürün onayları
kritik moderasyon kuyruğu
yüksek öncelikli destek ticket’ları
geciken siparişler
teslimat problemi olan siparişler
yüksek iade oranı veren mağazalar
yüksek iade oranı veren tedarikçiler
kampanya etkisi özeti
ödül puanı / puan market anomali uyarıları
sistemsel alarm ve risk kartları

Bu ekranın amacı, admini veri denizine değil öncelikli karar alanlarına taşımaktır.

5.2 Başvuru Merkezi

Bu modül senin talebine göre admin sisteminin çekirdeğidir.

Başvuru merkezi tek giriş kapısıdır ve iki ana sekme taşır:

Fenomen Başvuruları
Tedarikçi Başvuruları

Her başvuru kaydında en az şu alanlar bulunmalıdır:

başvuru ID
başvuru tipi
başvuru tarihi
kişi / marka adı
başvuru durumu
eksik belge durumu
risk / doğrulama uyarısı
ön inceleme notu
karar bekleyen süre

Detay ekranında:

profil / kurum bilgileri
sosyal görünürlük veya şirket bilgisi
kategori uyumu
başvuru belgeleri
önceki başvuru geçmişi
iç admin notları
risk / fraud işaretleri
karar geçmişi
onayla
reddet
revizyona gönder
ek belge iste
askıya al

olmalıdır.

Net kural:

başvuru kararı admin tarafından verilir
ama onay sonrası fenomen veya tedarikçi truth’u panel tarafından doğrudan yazılmaz
ilgili owner sisteme protected action gönderilir.

5.3 Fenomen Yönetim Merkezi

Başvurudan sonra yaşayan fenomen kayıtlarının yönetildiği modüldür.

Burada:

fenomen listesi
aktif / pasif / askıda durumu
başvuru geçmişi
kategori yetkileri
mağaza açılış durumu
mağaza görünürlüğü
takipçi büyümesi
satış katkısı
iade etkisi
içerik ihlal geçmişi
ceza / uyarı kayıtları
mağaza kalite skoru

görünmelidir.

Admin bu merkezden:

kategori yetkisi verebilir
kategori yetkisini daraltabilir
mağazayı geçici pasife alabilir
mağaza görünürlüğünü kısıtlayabilir
ihlal uyarısı verebilir
tekrar incelemeye alabilir
fenomen mağaza statüsünü askıya alabilir

Ama mağaza adına ürün, fiyat, sipariş truth’unu doğrudan değiştirmez.

5.4 Tedarikçi Yönetim Merkezi

Tedarikçi yönetimi ayrı modül olmalıdır ama admin sistemi altında yaşamalıdır.

Burada:

tedarikçi listesi
aktif / pasif / askıda durumu
ürün yükleme hacmi
onay / red oranı
eksik veri oranı
stok doğruluk performansı
sevkiyat gecikme oranı
iptal / kalite problemi
iade kaynaklı sorun oranı
ceza / uyarı geçmişi
kategori yetki alanı
XML / API / panel yükleme sağlığı

görünmelidir.

Admin bu merkezden:

tedarikçiyi onaylar
askıya alır
kategori yükleme sınırı koyar
ürün gönderimini daha sıkı incelemeye alır
yükleme kotası sınırı uygulayabilir
operasyon uyarısı verebilir
tekrarlı problemde satıştan men kararı başlatabilir

Havuz sistemi zaten son kararın platformda olması gerektiğini ve tedarikçinin platform iç kârı görmemesi gerektiğini netleştiriyor. Admin sistemi bu ayrımı korumalıdır.

5.5 Ürün Kabul / Onay Merkezi

Bu modül havuz ve ürün kabul sisteminin yönetim ekranıdır.

Burada:

bekleyen ürünler
eksik alanlı ürünler
revizyon istenen ürünler
reddedilen ürünler
2. havuza geçen ürünler
yükleme kanalı bazlı ürünler
yüksek riskli ürünler

sekme mantığında görünmelidir.

Detayda:

ham ürün verisi
kategori önerisi
manuel kategori düzeltmesi
varyant yapısı
medya seti
lojistik alanlar
baz fiyat
risk / kalite uyarıları
onay geçmişi
iç notlar
onayla
reddet
revizyon iste
askıya al

olmalıdır.

Ürün kabul sistemi zaten onaysız ürünün fenomene açılamayacağını ve onayın platformda olduğunu sabitler. Admin merkezi bu otoritenin panel yüzü olur.

5.6 Ticari Kontrol Merkezi

Bu modül platformun ticari otorite alanıdır.

Burada:

kategori bazlı kâr oranları
havuz taban fiyat mantığı
min / önerilen / max fiyat yüzdeleri
önerilen fiyat rejimi
kampanyalı ürün rejimi
lansman rejimi
yuvarlama kuralları
puan market ürün yapılandırmaları
ödül puanı oranları
ticari kural revizyon geçmişi

yönetilmelidir.

Havuz ve merkezi fiyat sistemleri platform kârının ve fiyat koridorlarının admin panelinden yönetilebildiğini zaten destekliyor. Kampanya sistemi de kampanya açma/kapatma yetkisinin yalnız platformda olduğunu söyler. Ödül puanı sistemi de puan oranlarının admin tarafından değiştirilebileceğini, sistemin açılıp kapatılabileceğini belirtir.

5.7 Sipariş ve Satış Kontrol Merkezi

Evet, admin bu alanda satışları ve siparişleri görmelidir; ama truth’u keyfi değiştirmez.

Bu modülde iki ana görünüm olmalıdır:

A. Satış görünümü

hangi mağaza ne satmış
hangi tedarikçi ne satmış
hangi ürün ne satmış
hangi kategori ne satmış
hangi kampanya ne üretmiş
hangi mağaza kaç sipariş üretmiş
hangi tedarikçi kaç satır fulfillment etmiş
iade / iptal etkisi
net satış etkisi

B. Sipariş operasyon görünümü

yeni siparişler
hazırlananlar
gecikenler
teslimat problemi olanlar
kısmi teslim edilenler
iptal/iade bekleyenler
riskli siparişler
yüksek destek teması olan siparişler

Bu modül sayesinde admin:

mağaza performansını
tedarikçi performansını
ürün performansını
operasyon darboğazını
aynı anda görür.

Platform sistem ağacı sipariş operasyonunu kullanıcı yüzünden ayrı sistem olarak konumlandırdığı için bu merkez zorunludur.

5.8 Moderasyon Merkezi

Ayrı kuyruklar halinde çalışmalıdır:

yorum kuyruğu
kullanıcı story kuyruğu
soru-cevap kuyruğu
post kuyruğu
mağaza içerik kuyruğu
raporlanan içerikler
tekrar ihlal eden hesaplar

Aksiyonlar:

onayla
reddet
pasifleştir
görünürlüğü kısıtla
kullanıcıyı uyar
fenomeni uyar
yüksek risk incelemesine al

Moderasyon ve destek aynı şey değildir; aynı panel içinde olsa da permission set aynı olmamalıdır. Kural / yetki sistemi bu ayrımı açıkça ister.

5.9 Destek ve Çözüm Merkezi

Burada:

açık ticket’lar
SLA riski olanlar
sipariş bağlı ticket’lar
ödeme bağlı ticket’lar
teslimat bağlı ticket’lar
iade bağlı ticket’lar
kullanıcı geçmişi
çözüm notları
escalation kayıtları

görünmelidir.

Bu modül kullanıcı destek sisteminin operasyon panel yüzüdür.

5.10 Kural / Yetki Merkezi

Bu modül admin sisteminin güven omurgasıdır.

Burada:

admin rol tanımları
modül bazlı erişim
view permission
action permission
çift onay gerektiren aksiyonlar
hassas veri erişimi
panel permission map
yetki değişiklik geçmişi
suspended/restricted internal actor state’leri

yönetilmelidir.

Kural / yetki sistemi rol tek başına yetmez der; auth + scope + ownership + eligibility + domain owner zinciri gerekir. Admin panel de bu ilkeye göre kurulmalıdır.

5.11 Audit Log / Karar Geçmişi Merkezi

İleri seviye admin sisteminin vazgeçilmezidir.

Her kritik işlem için:

kim yaptı
ne zaman yaptı
hangi kayıt üzerinde yaptı
önceki durum neydi
yeni durum ne oldu
gerekçe neydi
hangi command gönderildi
işlem başarıyla tamamlandı mı
rollback / retry oldu mu

görünmelidir.

Bu modül olmadan admin panel denetlenebilir olmaz.

5.12 Analitik / Ölçümleme / Sağlık Merkezi

Burada ticari ve operasyonel yönetim görünümü bulunmalıdır:

mağaza performansı
tedarikçi performansı
ürün performansı
kategori performansı
kampanya etkisi
iade / iptal oranı
teslimat gecikme oranı
moderasyon yükü
destek yükü
ödül puanı ve puan market anomali göstergeleri
sistemsel alarm ve hizmet sağlığı

Bu merkez karar üretir; ama asıl truth alanlarını mutate etmez.

6. Admin panelin ekran mimarisi

Sol menü şöyle kurulmalıdır:

Kontrol Kulesi
Başvurular

Fenomen Başvuruları
Tedarikçi Başvuruları

Yönetim

Fenomen Yönetim
Tedarikçi Yönetim
Ürün Kabul / Onay
Ticari Kontrol
Kampanya
Puan Sistemleri

Operasyon

Sipariş ve Satış
Sipariş Operasyon
Teslimat Problemleri
İptal / İade
Destek

Güven

Moderasyon
Kural / Yetki
Risk / Fraud

Analitik

Ticari Analitik
Operasyonel Analitik
İçerik / Sosyal Analitik

Sistem

Audit Log
Ayarlar
7. Admin sistemi için olmazsa olmaz kurallar

1. Başvuru merkezi tek giriş kapısı olmalı
Fenomen ve tedarikçi başvuruları burada birleşmeli.

2. Başvuru ve yaşam döngüsü ayrılmalı
Başvuru değerlendirme ekranı ayrı, onay sonrası fenomen/tedarikçi yönetim ekranı ayrı olmalı.

3. Panel direct write yapmamalı
Her kritik aksiyon owner sisteme command göndermeli.

4. Her kritik karar loglanmalı
Onay, red, askı, kampanya aktivasyonu, fiyat kuralı değişimi, puan oranı değişimi, moderasyon kararı, operasyon override.

5. Toplu aksiyonlar kontrollü olmalı
Toplu onay/red/kaldırma gibi işlemler sebep zorunluluğu ve gerektiğinde çift onay istemeli.

6. View ve action permission ayrı olmalı
Bir admin veriyi görebilir ama aksiyon yetkisine sahip olmayabilir.

7. Hassas ticari ayrım korunmalı
Tedarikçi platform iç kârı görmemeli; fenomen bağımsız fiyat motoru olmamalı; admin bunu denetleyebilmeli.

8. Satış görünürlüğü olmalı, satış truth’una keyfi müdahale olmamalı
Admin hangi mağaza ne satmış, hangi tedarikçi ne satmış görebilir; ama sipariş/satış truth’unu panelden keyfi değiştiremez.

8. Nihai kısa özet

Admin sistemi, platformun fenomen ve tedarikçi başvurularını tek merkezden topladığı; fenomen yönetim, tedarikçi yönetim, ürün kabul, ticari kontrol, sipariş/satış görünürlüğü, moderasyon, destek, kural/yetki ve audit log alanlarını tek şemsiye altında birleştirdiği; fakat bunu panel direct write ile değil owner modüllere kurallı protected action göndererek yönettiği; yüksek kontrollü platform modeline tam uyumlu merkezi yönetim sistemidir.