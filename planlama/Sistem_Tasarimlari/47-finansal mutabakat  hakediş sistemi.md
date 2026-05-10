FİNANSAL MUTABAKAT / HAKEDİŞ SİSTEMİ
1. Sistem tanımı

Finansal mutabakat / hakediş sistemi, başarılı ödeme sonrası oluşan siparişlerin finansal etkisini taraf bazında ayrıştıran; platform, fenomen mağazası ve gerekiyorsa tedarikçi tarafında hakediş, kesinti, kupon etkisi, iptal/iade düzeltmesi ve kesinleşme zamanını yöneten merkezi finansal dağıtım sistemidir.

Bu sistemin görevi yalnız “kim ne kadar kazandı” demek değildir. Aynı zamanda:

sipariş bazında finansal parçalanmayı üretmek
fenomen payını hesaplamak
tedarikçi hakedişini hesaplamak
platform payını hesaplamak
kupon ve kampanya etkisini doğru tarafa yansıtmak
iptal/iade sonrası finansal düzeltme yapmak
bekleyen / kesinleşen / bloke edilen tutarları ayırmak
raporlama ve denetim için finansal kayıt omurgası oluşturmaktır

Kısa tanım:

Finansal mutabakat / hakediş sistemi, satış sonrası finansal paylaşım ve düzeltme motorudur.

2. Temel ilke

Bu sistemin temel ilkesi şudur:

Tahsil edilen para ile hak edilmiş para aynı şey değildir.

Yani:

kullanıcıdan ödeme alınmış olabilir
sipariş oluşmuş olabilir
ama fenomen payı hemen kesinleşmeyebilir
tedarikçi hakkı hemen ödenmeyebilir
iade / iptal riski devam ediyor olabilir

Bu yüzden sistem şunları ayırmalıdır:

tahsil edilen tutar
dağıtılabilir tutar
bekleyen hakediş
kesinleşmiş hakediş
bloke tutar
düzeltme / kesinti tutarı

Net kural:

finansal hakediş, teslimat ve satış sonrası riskler görülmeden doğrudan kesinleşmemelidir.

3. Sistemin platform içindeki rolü

Bu sistem şu sistemlerle doğrudan bağlıdır:

ödeme sistemi
sipariş sistemi
kargo / teslimat sistemi
iptal / iade sistemi
kupon sistemi
merkezi fiyat sistemi
fenomen mağaza sistemi
tedarikçi sistemi
admin sistemi

Doğru akış şöyle olmalıdır:

kullanıcı ödemeyi yapar
sipariş oluşur
finansal snapshot alınır
hakediş kalemleri üretilir
teslimat / iade / iptal riskine göre bazı kalemler beklemeye alınır
şartlar oluşunca kesinleşme olur
gerekiyorsa düzeltme / geri alma işlemi çalışır
4. Bu sistem ödeme sistemiyle aynı şey değildir

Ödeme sistemi:

kullanıcıdan tahsilatı yapar
başarılı / başarısız finansal işlemi belirler

Finansal mutabakat sistemi:

tahsil edilen tutarın finansal dağılımını yapar
taraf bazlı hakediş üretir
düzeltme ve kesinleşme kurallarını uygular

Net kural:

ödeme = para alındı mı
mutabakat = alınan para finansal olarak nasıl dağıtılacak

5. Aktörler

Bu sistemde en az şu aktörler vardır:

5.1 Platform

Nihai finansal otoritedir. Kuralları belirler, kayıtları tutar, mutabakatı yönetir.

5.2 Fenomen mağazası

Kendi mağazasındaki satışlardan doğan hakediş etkisini taşır.

5.3 Tedarikçi

Ürün kaynağı ve fulfillment sağlayıcısı olarak hakediş veya ürün bedeli etkisi taşır.

5.4 Kullanıcı

Doğrudan bu sistemin operatörü değildir; etkisini fiyat, iade ve ödeme sonucu tarafında hisseder.

5.5 Finance Admin

Finansal problem, kesinti, düzeltme ve raporlama tarafında yetkili taraftır.

Net kural:

finansal mutabakat owner’ı platformdur.

6. Hakediş neden ayrı sistemdir

Senin modelinde:

tedarikçi baz fiyat girer ama satış fiyatını belirlemez
fenomen mağazası satış vitrini ve ilişki yüzüdür ama bağımsız satıcı değildir
platform ticari otoritedir
kupon maliyetini kimin taşıdığı değişebilir

Bu yüzden “satış oldu, para paylaştırılsın” yaklaşımı çok kaba kalır.

Ayrı sistem gerekir çünkü şu sorular cevaplanmalıdır:

satıştan fenomen ne kadar hak etti
tedarikçi ne kadar hak etti
platformta ne kaldı
kupon maliyetini kim taşıdı
iade olursa kimden ne düşecek
kısmi iade olursa düzeltme nasıl olacak
7. Finansal bileşenler

Bir sipariş veya sipariş satırı için minimum finansal kalemler şunlar olmalıdır:

brüt satış tutarı
indirim öncesi tutar
kampanya etkisi
kupon etkisi
kupon sponsor etkisi
net satış tutarı
kargo etkisi
fenomen hakedişi
tedarikçi hakedişi
platform payı
bekleyen tutar
bloke tutar
kesinleşen tutar
iade / iptal düzeltmesi

Net kural:

tek bir “kazanç” alanı yetmez; kalem bazlı finansal yapı gerekir.

8. Hakediş tarafları

İlk fazda sistem en az şu tarafları desteklemelidir:

8.1 Platform payı

Platformun ticari ve sistemsel payıdır.

8.2 Fenomen hakedişi

Fenomen mağazasının satış katkısından doğan hakkıdır.

8.3 Tedarikçi hakedişi

Tedarikçiye ait ürün/tedarik kaynaklı finansal karşılıktır.

İleri fazda:

özel teşvik fonları
ceza / kesinti havuzları
bonus / performans primi
gibi ek finansal katmanlar açılabilir.
9. Fenomen hakedişi nasıl çalışmalı

Fenomen mağazası bağımsız satıcı değildir ama satış katkısı üretir. Bu yüzden fenomen hakedişi ayrı kalem olarak hesaplanmalıdır.

Fenomen hakedişi için minimum kurallar:

mağaza bazlı satış katkısından doğar
sipariş veya sipariş satırı bazında hesaplanır
kupon sponsor modeli fenomen tarafını etkileyebilir
teslimat / iade / iptal riskine göre bekleyen statüde tutulabilir
kesinleşmeden önce fenomenin çekilebilir bakiyesine dönüşmez

Net kural:

fenomen hakedişi görünür olabilir ama risk kapanmadan kesinleşmiş sayılmamalıdır.

10. Tedarikçi hakedişi nasıl çalışmalı

Tedarikçi satış fiyatını belirlemez ama ürünün finansal kaynağıdır. Bu yüzden tedarikçi hakedişi ayrı hesaplanmalıdır.

Minimum kurallar:

ürün / varyant / satır bazında hesaplanır
baz fiyat ve kurallı finansal modelden türetilir
iptal / iade / kalite problemi etkileri yansır
sevkiyat ve teslimat kalitesine bağlı blok veya kesinti olabilir
kesinleşmeden önce ödenecek bakiye sayılmaz

Net kural:

tedarikçi hakedişi, ürün kaynağı hakkıdır; satış fiyatı owner’lığı değildir.

11. Kupon sistemi ile ilişki

Bu alan kritik.

Kupon sisteminde sponsor modeli zorunlu olduğu için finansal mutabakat sistemi her kuponda şunu bilmelidir:

kupon platform sponsorlu mu
fenomen sponsorlu mu
platform destekli fenomen kuponu mu
ileri fazda split mi
Buna göre davranış
A. Platform sponsorlu kupon

İndirim maliyeti platform tarafına yazılır.
Fenomen ve tedarikçi hakedişi korunabilir.

B. Fenomen sponsorlu kupon

İndirim maliyeti fenomen hakedişinden düşer.
Ama minimum marj koruması kupon sisteminde zaten sağlanmış olmalıdır.

C. Platform destekli fenomen kuponu

İndirim maliyeti platform tarafına veya kuralda belirtilen oran kadar platform tarafına yazılır; fenomen kısmen veya tamamen korunur.

Net kural:

kupon indirimi finansal mutabakat sisteminde doğru tarafa yansımadan sipariş finansı tamamlanmış sayılmaz.

12. Teslimat ve kesinleşme ilişkisi

Hakedişin kesinleşmesi için teslimat eşiği önemlidir.

İlk faz için en güvenli model:

sipariş oluştuğunda finansal kayıt açılır
teslimata kadar hakediş “bekleyen” statüde kalır
teslimat sonrası belirli kurala göre “kesinleşmeye uygun” hale gelir
iade/iptal penceresi veya risk politikası varsa bir süre daha blokede kalabilir
sonra “kesinleşti” durumuna geçer

Minimum durumlar:

pending
conditionally_earned
blocked
settled
reversed

Net kural:

teslim edilmeden tam hakediş kesinleşmemelidir.

13. İptal / iade ilişkisi

Bu sistemin en kritik alanlarından biri budur.

İptal durumunda
sipariş veya satır iptal edildiyse ilgili hakediş doğrudan geri alınabilir
bekleyen hakediş sıfırlanabilir
kesintiler sponsor modeline göre düzeltilir
İade durumunda
tam iade veya kısmi iade olabilir
buna göre finansal kalemler yeniden hesaplanır
fenomen hakedişi geri alınabilir veya azaltılabilir
tedarikçi hakedişi geri alınabilir veya kısmi düzeltilebilir
platform kupon sponsorluğu etkisi yeniden işlenir

Net kural:

iptal/iade sistemiyle finansal mutabakat sistemi arasında satır bazlı güçlü bağ zorunludur.

14. Kısmi sipariş / kısmi teslim / kısmi iade

Bu sistem sipariş bazında kaba çalışamaz. Satır ve gerektiğinde paket bazlı çalışmalıdır.

Örnek:

3 ürünlü sipariş var
1 ürün teslim edildi
1 ürün iade oldu
1 ürün gecikti

Bu durumda tek bir hakediş durumu yetmez.

Bu nedenle sistem:

satır bazlı finansal kayıt
kısmi kesinleşme
kısmi geri alma
desteklemelidir.

Net kural:

finansal mutabakat sipariş başına tek kalem mantığıyla kurulamaz.

15. Fenomen ve tedarikçi bakiyesi

İlk fazda kullanıcıya değil, admin ve ilgili panel tarafına görünen iki temel bakiye mantığı olmalıdır:

Fenomen için
bekleyen hakediş
kesinleşmiş hakediş
blokeli tutar
kupon etkisi
düzeltme / kesinti geçmişi
Tedarikçi için
bekleyen hakediş
kesinleşmiş hakediş
kalite / iade kaynaklı kesinti
blokeli tutar
düzeltme geçmişi

Bu alanlar raporlama ve güven için şarttır.

16. Payout mantığı

Bu sistem payout motoru olmak zorunda değildir; ama payout’a veri üreten çekirdek sistem olmalıdır.

Yani:

kim ne kadar hak etti
ne kadarı kesinleşti
ne kadarı henüz ödenemez
ne kadarı geri alındı
önce burada netleşir

Sonra istenirse ayrı payout aşaması çalışır.

İlk faz için minimum doğru yaklaşım:

hakediş hesapla
kesinleşmeyi izle
ödenebilir bakiyeyi üret

İleri fazda:

otomatik ödeme
manuel toplu ödeme
dönemsel payout batch
açılabilir
17. Admin sistemi ile ilişki

Admin panelinde finansal görünürlük modülü olmalıdır.

Burada admin şu soruları cevaplayabilmelidir:

hangi mağaza ne kadar hak etmiş
hangi tedarikçi ne kadar hak etmiş
hangi siparişte kupon maliyeti kime yazılmış
hangi satırlarda düzeltme yapılmış
hangi bakiyeler blokede
hangi iade finansal geri alma üretmiş
hangi hesaplar anomali taşıyor

Ama kural:

admin keyfi finansal override yapmamalı
yüksek riskli düzeltmeler gerekçeli ve audit’li olmalı
18. Fenomen paneli ile ilişki

Fenomen panelinde tam muhasebe görünümü değil, sade gelir görünürlüğü olmalıdır.

Fenomen şunları görebilmeli:

bugünkü satış etkisi
bekleyen hakediş
kesinleşen hakediş
kuponların kazanca etkisi
iade nedeniyle düşen tutar
en çok gelir getiren ürünler

Ama şunları görmemeli:

platform iç kâr yapısı
tedarikçi finans detayları
başka mağazaların verisi
19. Tedarikçi paneli ile ilişki

Tedarikçi panelinde sade hakediş görünürlüğü olabilir.

Tedarikçi şunları görebilmeli:

bekleyen hakediş
kesinleşen hakediş
kalite / iade kaynaklı kesinti
gecikme / problem etkisi
ürün bazlı finansal performans özeti

Ama şunları görmemeli:

platform kârı
fenomen komisyon mantığı
diğer tedarikçilerin verileri
20. Fraud / risk ilişkisi

Finansal mutabakat sistemi risk/fraud sinyali üretmelidir.

İzlenmesi gereken alanlar:

anormal kupon kullanımı
yüksek iade ile gelir şişirme
sahte sipariş / sahte satış etkisi
kısa sürede olağan dışı hakediş büyümesi
aynı mağazada anormal indirim / iade döngüsü
tedarikçi kaynaklı tekrar eden finansal problem

Net kural:

finansal mutabakat sistemi, yalnız muhasebe değil aynı zamanda risk sinyali kaynağıdır.

21. Kayıt ve audit

Her finansal olay kayıt altına alınmalıdır:

hakediş oluşturuldu
statü değişti
kupon sponsor etkisi işlendi
blokeye alındı
serbest bırakıldı
düzeltme yapıldı
iade geri alması işlendi
iptal sıfırlaması işlendi
manuel inceleme açıldı

Minimum kayıt alanları:

event tipi
ilgili sipariş / satır
ilgili taraf
önceki tutar
yeni tutar
gerekçe
işlem zamanı
işlem kaynağı
22. Kritik edge case kararları
sipariş ödendi ama sonra operasyonel iptal oldu → hakediş doğar ama sonra tamamen geri alınır
kısmi teslim oldu → yalnız ilgili satırlar kesinleşmeye aday olur
kupon sponsor tipi platformdu → iade sonrası düzeltme platform tarafına işlenir
fenomen sponsorlu kupon kullanıldı → iade sonrası fenomen etkisi yeniden hesaplanır
tedarikçi kalite problemi nedeniyle iade arttı → tedarikçi hakedişi ve kalite skoru etkilenebilir
fenomen askıya alındı → yeni satış hakedişi durabilir ama geçmiş hakediş politikası ayrı kuralla yürür
sipariş fraud işaretlendi → hakediş blokeye alınabilir
23. Ana kurallar

Finansal mutabakat / hakediş sistemi için sabitlenmesi gereken temel kurallar şunlardır:

ödeme ile hakediş aynı şey değildir
finansal mutabakat owner’ı platformdur
fenomen hakedişi ve tedarikçi hakedişi ayrı kalemlerdir
kupon maliyeti sponsor modeline göre doğru tarafa yazılmalıdır
hakediş teslimat ve satış sonrası riskler kapanmadan kesinleşmemelidir
iptal/iade finansal düzeltme üretmelidir
sistem satır bazlı çalışmalıdır
bekleyen, bloke, kesinleşen ve geri alınan tutarlar ayrılmalıdır
admin finansal görünürlük alabilir ama keyfi kontrolsüz override yapmamalıdır
fenomen ve tedarikçi yalnız kendi sade finansal özetlerini görebilmelidir
tüm finansal olaylar audit log üretmelidir
24. Nihai kısa özet

Finansal mutabakat / hakediş sistemi, başarılı satış sonrası tahsil edilen tutarın platform, fenomen mağazası ve tedarikçi arasında hangi kuralla finansal etkiye dönüşeceğini; kupon sponsor modelini, bekleyen/kesinleşen/blokeli hakediş yapısını, iptal/iade düzeltmelerini ve satır bazlı finansal kayıt omurgasını yöneten merkezi finansal dağıtım sistemidir.