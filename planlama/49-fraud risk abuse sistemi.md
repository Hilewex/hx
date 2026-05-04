FRAUD / RİSK / ABUSE SİSTEMİ
1. Sistem tanımı

Fraud / risk / abuse sistemi, platform içindeki sahte sipariş, kupon kötüye kullanımı, puan manipülasyonu, yapay etkileşim, çoklu hesap istismarı, iadeye dayalı finansal suistimal, tedarikçi veya mağaza kaynaklı anormal davranışlar ve sistem kurallarını kötüye kullanan örüntüleri tespit eden; risk skoru üreten; gerektiğinde blok, inceleme, kısıt veya escalation başlatan merkezi güvenlik sistemidir.

Bu sistemin görevi yalnız kötü hesabı kapatmak değildir. Aynı zamanda:

riskli davranışı erken görmek
anormal örüntüleri işaretlemek
finansal kaybı azaltmak
kupon ve puan sistemini korumak
fenomen ve tedarikçi suistimalini sınırlamak
öneri/sıralama sinyallerinin kirlenmesini önlemek
destek ve operasyon yükünü azaltmak
manuel inceleme gerektiren vakaları doğru kuyruğa düşürmektir

Kısa tanım:

Fraud / risk / abuse sistemi, platformun suistimal ve anomali savunma katmanıdır.

2. Temel ilke

Bu sistemin temel ilkesi şudur:

Her anomali fraud değildir; ama her kritik fraud önce anomali olarak görünür.

Yani:

sistem her şüpheli davranışı otomatik ceza ile karşılamamalı
önce risk sinyali üretmeli
sonra skorlamalı
sonra kademeli aksiyon vermeli
düşük riskte gözlem
orta riskte kısıt
yüksek riskte blok / inceleme / escalation çalışmalı

Net kural:

risk sistemi cezalandırma makinesi değil, kontrollü koruma ve erken uyarı sistemidir.

3. Sistemin platform içindeki rolü

Bu sistem şu alanlarla doğrudan ilişkilidir:

üyelik / giriş sistemi
kural / yetki sistemi
kupon sistemi
ödül puanı sistemi
puan market sistemi
beğeni / kaydetme / paylaşma sistemi
öneri / sıralama sistemi
sipariş operasyon sistemi
finansal mutabakat sistemi
moderasyon sistemi
admin sistemi
analitik / ölçümleme sistemi

Bu yüzden risk sistemi tek başına çalışmaz; birçok sistemden sinyal alır ve birçok sisteme aksiyon sinyali üretir.

Net kural:

risk sistemi veri toplamaz; veri sistemlerinden sinyal alır ve karar seviyesi koruma uygular.

4. Bu sistem neden ayrı ana sistemdir

Senin platformunda risk üretebilecek çok fazla alan var:

fenomen kuponları
platform kuponları
ödül puanı
puan market
kullanıcı story katkısı
yorum katkısı
yapay beğeni / kaydetme / paylaşma
sahte takipçi davranışı
çoklu hesapla kupon sömürüsü
iade odaklı suistimal
tedarikçi kalite manipülasyonu
mağaza etkileşim şişirmesi
sahte sipariş ile hakediş şişirmesi

Bunları sadece moderasyon veya destek üzerinden çözmeye çalışmak yetersiz kalır.

Bu yüzden fraud / risk / abuse sistemi ayrı ana sistem olmalıdır.

5. Risk alanları

Bu sistem en az 7 ana risk ailesini yönetmelidir.

5.1 Hesap riski
çoklu hesap
sahte kayıt
aynı cihazdan anormal hesap kümelenmesi
kısa sürede seri hesap açma
anonim → login davranışında anormallik
5.2 Kupon riski
aynı kişinin çoklu hesapla kupon kullanması
fenomenin kendi kuponunu yapay trafikle şişirmesi
kupon → sipariş → iade döngüsü
kısa sürede anormal kupon tüketimi
limit aşımı denemeleri
5.3 Puan riski
ödül puanı için sahte yorum üretme
aynı ürün üzerinden organize puan toplama
kullanıcı story hakkını abuse etme
puan market için çoklu hesap biriktirme
puan harcama pattern anormallikleri
5.4 Etkileşim riski
bot beğeni
yapay kaydetme
organize paylaşım
sahte takip
mağaza/post/story etkileşim şişirmesi
5.5 Sipariş / ödeme riski
sahte sipariş
deneme amaçlı seri ödeme
anormal sepet/checkout abandon pattern
kuponla tetiklenen düşük değerli sahte sipariş akışı
hakediş şişirme amaçlı işlem paterni
5.6 İade / iptal riski
sürekli kuponlu sipariş verip iade etme
seri teslimat sonrası hemen iade örüntüsü
aynı mağazada anormal iade döngüsü
hakediş doğurup sonra geri alma istismarı
5.7 Tedarikçi / mağaza riski
yapay satış üretme
kendi mağazasını sahte hesaplarla destekleme
sürekli problemli ürünle sistemi sömürme
iade ve kalite problemi gizleme
kural sınırlarını delmeye çalışma
6. Risk sinyal kaynakları

Bu sistem doğrudan şu kaynaklardan beslenmelidir:

üyelik / giriş verileri
cihaz / oturum / IP bağlamı
analitik / ölçümleme sinyalleri
kupon kullanım kayıtları
puan kazanım ve harcama kayıtları
sipariş / ödeme / iade kayıtları
beğeni/kaydet/paylaş event’leri
takip ve mesajlaşma davranışı
moderasyon ihlal kayıtları
tedarikçi ve fenomen performans sinyalleri

Net kural:

risk sistemi, tek event ile değil çok sinyalli skor mantığıyla çalışmalıdır.

7. Risk skorlama mantığı

Risk sistemi kural bazlı + sinyal bazlı hibrit modelle çalışmalıdır.

Her aktör için risk profili üretilebilir:

kullanıcı risk skoru
fenomen mağaza risk skoru
tedarikçi risk skoru
sipariş risk skoru
kupon risk skoru
puan hesabı risk skoru

Minimum risk seviyeleri:

low
medium
high
critical

Düşük risk:

izleme

Orta risk:

yumuşak kısıt
ek doğrulama
kullanım limiti daraltma

Yüksek risk:

blok
manuel review
ilgili aksiyonu askıya alma

Kritik risk:

anında geçici dondurma
admin/fraud kuyruğuna escalation
finansal blok
8. Kullanıcı risk sistemi

Kullanıcı tarafında minimum şu senaryolar izlenmelidir:

aynı cihazdan çok sayıda hesap
kısa sürede çok sayıda kupon denemesi
ilk sipariş kuponlarını çoklu hesapla kullanma
puan kazanımını hedefleyen şüpheli yorum/story davranışı
beğeni/kaydet/paylaş spam paterni
anormal takip isteği veya mesaj yoğunluğu
kısa süreli seri sipariş + iade örüntüsü

Bu sistem gerektiğinde:

kupon kullanımını kapatabilir
puan kazanımını geçici bloklayabilir
hesabı incelemeye alabilir
ek doğrulama isteyebilir
9. Fenomen mağaza risk sistemi

Fenomen tarafında minimum şu riskler izlenmelidir:

kendi kuponunu yapay biçimde şişirme
kendi mağazasına sahte trafik gönderme
yapay takipçi davranışı
organize etkileşim şişirmesi
puan/yorum/story manipülasyonu
çok yüksek iade ile satış şişirme
spam içerik ile mağaza görünürlüğünü zorlama

Risk sistemi burada şu çıktıları üretebilir:

görünürlük düşürme sinyali
kupon review zorunluluğu
yeni kupon açma kısıtı
etkileşim sinyalini ranking’den düşürme
fenomen yönetim sistemine uyarı / yaptırım önerisi

Net kural:

fenomen risk sistemi, fenomen yönetim sistemine ceza vermez; ama ceza kararını besleyen sinyal üretir.

10. Tedarikçi risk sistemi

Tedarikçi tarafında minimum şu riskler izlenmelidir:

sürekli hatalı ürün verisi
anormal stok davranışı
baz fiyat manipülasyonu denemesi
kalitesiz ürünle sistem sömürüsü
iptal / iade anormalliği
sevkiyat geciktirerek suistimal
aynı problemli ürün grubunu tekrar tekrar yükleme

Bu sistem çıktıları:

ürün kabulde daha sıkı inceleme
kategori kısıtı önerisi
yükleme limiti daraltma
tedarikçi yönetim sistemine risk sinyali
olmalıdır.
11. Kupon risk sistemi

Kupon tarafı bu sistemin en kritik alanlarından biridir.

İzlenmesi gerekenler:

aynı cihaz / kullanıcı kümesinde kupon kümelenmesi
kısa sürede çok yüksek redemption
fenomen kuponunda yapay kullanım
kupon kullanımından hemen sonra iade örüntüsü
tek mağazada anormal kupon dönüşüm paterni
kişi başı limit aşma denemeleri
kupon kodu brute-force benzeri kullanım

Bu sistem gerektiğinde:

kuponu geçici pasife alabilir
yeni kullanım açığını kapatabilir
review zorunluluğu getirebilir
kuponu fraud işaretli statüye çekebilir
12. Puan / ödül riski

Bu alan ayrıca hassastır çünkü puan gerçek değere dönüşebilir.

İzlenmesi gerekenler:

çok kısa sürede seri puan kazanımı
aynı ürün setinde organize yorum
story hakkının anormal kullanımı
sahte teslimat katkısı hissi üretme
puan markette çoklu hesap kullanımı
tek cihazdan çoklu puan hesabı

Risk sistemi burada şu aksiyonları tetikleyebilir:

puan kesinleşmesini geciktirme
puan kazanımını geçici bloke etme
puan market kullanımını askıya alma
manuel review kuyruğuna alma

Net kural:

puan sistemleri fraud koruması olmadan açılmamalıdır.

13. Etkileşim ve öneri sinyali koruması

Beğeni, kaydetme, paylaşma, takip ve içerik tüketimi öneri/sıralama sistemini etkileyebilir. Bu yüzden yapay etkileşim doğrudan algoritmayı kirletir.

Risk sistemi şu görevi üstlenmelidir:

şüpheli etkileşimleri işaretlemek
gerekiyorsa ağırlığını düşürmek
öneri/sıralama sistemine “suppressed signal” vermek
sahte davranışı normal davranıştan ayırmak

Net kural:

riskli etkileşim, ranking sinyaline saf biçimde girmemelidir.

14. Sipariş / finansal risk sistemi

Bu sistem finansal mutabakat tarafını da korumalıdır.

İzlenmesi gerekenler:

sahte sipariş yoğunluğu
kupon odaklı anormal sipariş paterni
teslimat sonrası yüksek geri alma paterni
fenomen hakedişi şişiren sahte satış davranışı
tedarikçi kalitesini gizleyen pattern
yüksek hacimli ama düşük kaliteli sipariş akışı

Aksiyonlar:

hakediş blokesi
sipariş risk işareti
finansal review
payout gecikmesi
admin fraud kuyruğuna escalation
15. Aksiyon katmanları

Risk sistemi çıktıları kademeli olmalıdır.

15.1 Soft action
izlemeye al
sinyal ağırlığını düşür
ek doğrulama iste
kuponu review’a çek
15.2 Medium action
puan kazanımını geçici dondur
kupon kullanımını kısıtla
mağaza kupon açma hakkını daralt
şüpheli etkileşimleri sıfırla
15.3 Hard action
hesap geçici blok
sipariş review
hakediş blokesi
kupon pasife alma
mağaza risk bayrağı
tedarikçi yükleme kısıtı
15.4 Escalation action
admin fraud kuyruğuna düşür
fenomen yönetim sistemine yaptırım öner
tedarikçi yönetim sistemine askı öner
finance admin incelemesine gönder
16. Moderasyon sistemi ile ilişki

Moderasyon sistemi daha çok:

içerik uygunluğu
içerik görünürlüğü
topluluk kalitesi

alanında çalışır.

Risk sistemi ise:

kötüye kullanım örüntüsü
çoklu hesap
finansal suistimal
yapay davranış
sistem sömürüsü

alanında çalışır.

İkisi veri paylaşabilir ama aynı sistem değildir.

Net kural:

“uygunsuz içerik” ile “suistimal davranışı” aynı problem değildir.

17. Kural / yetki sistemi ile ilişki

Kural / yetki sistemi şunu belirler:

kim ne yapabilir

Risk sistemi ise şunu belirler:

bir aktör bunu teknik olarak yapabilse de şu anda risk nedeniyle kısıtlanmalı mı

Örnek:

kullanıcı kupon kullanmaya yetkili olabilir
ama risk sistemi onu geçici bloklayabilir

Bu yüzden risk sistemi:

permission layer’ın üstünde çalışan dinamik guard katmanıdır
18. Admin sistemi ile ilişki

Admin panelde ayrı bir Risk / Fraud Merkezi olmalıdır.

Burada en az şu kuyruklar görünmelidir:

kullanıcı risk kuyruğu
fenomen risk kuyruğu
tedarikçi risk kuyruğu
kupon abuse kuyruğu
puan abuse kuyruğu
finansal risk kuyruğu
manuel review bekleyenler
kritik anomali alarm ekranı

Admin burada:

case açar
not düşer
risk kararını gözden geçirir
gerektiğinde yaptırım başlatır
false positive’i temizler
19. Analitik / ölçümleme sistemi ile ilişki

Analitik sistemi ham veri ve türetilmiş davranış metrikleri üretir. Risk sistemi bunların içinden anormal olanı arar.

Örnek:

normal kullanıcı kupon kullanımı
riskli kullanıcı kupon kullanımı

ikisi aynı event ailesinden gelebilir; farkı risk sistemi çıkarır.

Net kural:

analitik veri kaynağıdır, risk ise anormallik yorumlayıcısıdır.

20. Kayıt ve case yönetimi

Risk sistemi yalnız skor üretmemeli, case yönetimi de taşımalıdır.

Her case için minimum alanlar:

case_id
risk_type
actor_type
actor_id
risk_score
severity
trigger_reason
first_seen_at
last_seen_at
current_status
assigned_admin
decision_note
outcome

Durumlar:

open
investigating
actioned
dismissed
escalated
resolved

Bu yapı olmadan risk yönetimi dağılır.

21. Kritik edge case kararları
aynı evde birden fazla gerçek kullanıcı olabilir → tek sinyal ile blok verilmemeli
viral bir mağaza gerçekten çok hızlı büyüyebilir → her sıçrama fraud sayılmamalı
kupon kampanyası gerçekten büyük dönüşüm üretebilir → sponsor ve kampanya bağlamı dikkate alınmalı
tek ürün çok popüler olabilir → etkileşim artışı tek başına sahte sayılmamalı
ilk sipariş kuponu aile bireyleri tarafından farklı hesaplarda kullanılabilir → kesin fraud kararı için çoklu sinyal gerekir
büyük indirim döneminde abandon ve tekrar deneme artabilir → dönemsel bağlam hesaba katılmalı

Net kural:

false positive maliyeti yüksek olduğu için tek işaretle ağır yaptırım verilmemelidir.

22. Audit ve kayıt

Tüm kritik risk olayları loglanmalıdır:

risk tetiklendi
skor güncellendi
soft action verildi
hard action verildi
case açıldı
case kapandı
false positive işaretlendi
admin override yapıldı

Bu kayıtlar olmadan sistem güvenilir olmaz.

23. Ana kurallar

Fraud / risk / abuse sistemi için sabitlenmesi gereken temel kurallar şunlardır:

bu sistem moderasyon sisteminden ayrıdır
bu sistem kural / yetki sisteminden ayrıdır
çok sinyalli risk skoru ile çalışmalıdır
her anomali fraud sayılmamalıdır
kullanıcı, fenomen, tedarikçi, kupon, puan ve sipariş riskleri ayrı izlenmelidir
riskli etkileşim öneri/sıralama sinyallerini kirletmemelidir
kupon ve puan sistemleri risk koruması olmadan çalıştırılmamalıdır
finansal hakediş tarafında riskli vakalar blokeye alınabilmelidir
düşük, orta, yüksek, kritik seviyeli aksiyon katmanı olmalıdır
manuel review ve case yönetimi zorunludur
tüm kritik risk kararları audit log üretmelidir
24. Nihai kısa özet

Fraud / risk / abuse sistemi, platform içindeki hesap, kupon, puan, etkileşim, sipariş, iade, fenomen mağaza ve tedarikçi kaynaklı suistimal risklerini çok sinyalli biçimde tespit eden; risk skoru üreten; soft guard, blok, review, hakediş blokesi ve yönetimsel escalation başlatabilen; moderasyon ve analitikten ayrı çalışan merkezi kötüye kullanım savunma sistemidir.