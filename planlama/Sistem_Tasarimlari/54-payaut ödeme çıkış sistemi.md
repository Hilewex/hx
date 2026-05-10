PAYOUT / ÖDEME ÇIKIŞ SİSTEMİ
1. Sistem tanımı

Payout / ödeme çıkış sistemi, finansal mutabakat sistemi tarafından üretilen ve ödenebilir statüye geçmiş bakiyeleri; taraf bazında toplulaştıran, ödeme dönemine bağlayan, gerekli blok/kesinti kontrollerini yapan, ödeme talimatına dönüştüren ve sonuçlarını kayıt altına alan merkezi ödeme çıkış sistemidir.

Bu sistemin görevi yalnız para göndermek değildir. Aynı zamanda:

ödenebilir bakiyeyi belirlemek
minimum ödeme eşiğini uygulamak
bloke veya incelemedeki tutarları ayırmak
dönemsel ödeme batch’leri oluşturmak
ödeme talimatı üretmek
başarısız ödeme denemelerini yönetmek
ödeme sonucu kayıtlarını işlemek
finansal denetim izi bırakmaktır

Kısa tanım:

Payout sistemi, kesinleşmiş hakedişi gerçek ödeme akışına çıkaran finansal icra sistemidir.

2. Temel ilke

Bu sistemin temel ilkesi şudur:

Hakediş oluşması ile ödeme çıkışı aynı şey değildir.

Yani:

bir taraf hakediş kazanmış olabilir
bu hakediş kesinleşmiş olabilir
ama henüz payout dönemine girmemiş olabilir
kimlik/banka/doğrulama eksik olabilir
risk/fraud incelemesi olabilir
minimum eşik dolmamış olabilir

Net kural:

ödenebilir bakiye ile ödenmiş bakiye ayrı tutulmalıdır.

3. Sistemin platform içindeki rolü

Bu sistem şu alanlarla doğrudan ilişkilidir:

finansal mutabakat / hakediş sistemi
ödeme sistemi
sipariş sistemi
iptal / iade sistemi
fraud / risk sistemi
admin sistemi
fenomen yönetim sistemi
tedarikçi yönetim sistemi
analitik / ölçümleme sistemi

Doğru akış şu olmalıdır:

sipariş ve finansal etkiler oluşur
mutabakat sistemi hakedişi hesaplar
bekleyen / blokeli / kesinleşmiş ayrılır
payout sistemi yalnız ödenebilir bakiyeyi alır
ödeme batch’i kurar
transfer talimatı üretir
sonuçları işler
başarısızları tekrar kuyruğuna alır
4. Bu sistem finansal mutabakat sistemiyle aynı şey değildir

Finansal mutabakat sistemi:

hakedişi hesaplar
düzeltmeleri yapar
sponsor etkilerini işler
bekleyen / bloke / settled ayrımı yapar

Payout sistemi:

settled ve payable duruma gelmiş bakiyeyi alır
bunu ödeme emrine dönüştürür
gerçekten dış ödeme akışına çıkarır

Net kural:

mutabakat hesaplama sistemidir, payout icra sistemidir.

5. Aktörler

Bu sistemde en az şu aktörler vardır:

5.1 Platform

Nihai payout otoritesidir.

5.2 Fenomen mağazası

Hakediş kazanan taraflardan biridir; payout alabilir.

5.3 Tedarikçi

Hakediş kazanan taraflardan biridir; payout alabilir.

5.4 Finance Admin

Ödeme dönemlerini, blokeleri, istisnaları ve manuel incelemeleri yönetir.

5.5 Fraud / Risk katmanı

Riskli payout’ları bloklayabilir veya review’a çekebilir.

Net kural:

payout owner’ı platformdur; fenomen ve tedarikçi yalnız alıcı taraftır.

6. Payout neden ayrı ana sistemdir

Bu platformda:

fenomen hakedişi var
tedarikçi hakedişi var
kupon sponsor etkisi var
iade / iptal düzeltmesi var
risk blokesi olabilir
kısmi sipariş ve kısmi düzeltme olabilir

Bu yüzden “kesinleşen bakiyeyi hemen ödeyelim” mantığı yetersizdir.

Ayrı sistem gerekir çünkü:

ödeme dönemi yönetimi ister
batch ister
retry ister
banka/hesap doğrulaması ister
blok/kesinti kontrolü ister
audit ister
7. Payout tarafları

İlk fazda payout sistemi en az şu iki alıcı tipini desteklemelidir:

7.1 Fenomen payout

Fenomen mağazasının kesinleşmiş ve ödenebilir hakedişleri

7.2 Tedarikçi payout

Tedarikçinin kesinleşmiş ve ödenebilir hakedişleri

İleri fazda:

bonus payout
performans primi
manuel düzeltme payout’ı
gibi alt türler açılabilir
8. Payout ön koşulları

Bir bakiyenin payout’a girebilmesi için minimum şu koşullar sağlanmalıdır:

hakediş kesinleşmiş olmalı
risk/fraud blokesi olmamalı
ilgili hesap aktif olmalı
payout bilgileri tamamlanmış olmalı
minimum ödeme eşiği aşılmış olmalı
açık finansal itiraz bulunmamalı
iade/iptal bekleyen kritik durum olmamalı

Net kural:

kesinleşmiş her bakiye otomatik ödenecek bakiye değildir.

9. Payout hesap bilgisi sistemi

Payout sistemi, ödeme çıkışı yapılacak taraf için doğrulanmış ödeme bilgisi ister.

Minimum alanlar:

alıcı tipi
alıcı ID
hesap sahibi adı
banka / IBAN / hesap bilgisi
ülke / para birimi gerekiyorsa
doğrulama durumu
son güncelleme tarihi
aktif/pasif payout hesabı

Net kural:

doğrulanmamış payout hesabına ödeme çıkışı yapılamamalıdır.

10. Payout yaşam döngüsü

Her payout kaydı yaşam döngüsü bazlı olmalıdır.

Minimum durumlar:

eligible
batched
pending_execution
processing
paid
failed
returned
on_hold
cancelled

Bu sayede:

hangi ödeme hazır
hangisi batch’e girdi
hangisi dış sistemde başarısız oldu
hangisi tekrar denenmeli
görülebilir.
11. Batch sistemi

Payout sistemi tek tek manuel ödeme mantığıyla yürümemelidir. Batch desteği zorunludur.

Batch türleri:

günlük batch
haftalık batch
manuel özel batch
fenomen batch
tedarikçi batch

Her batch için minimum alanlar:

batch_id
batch_type
created_at
scheduled_execution_at
total_amount
item_count
status
owner_admin gerekiyorsa

Net kural:

payout sistemi dönemsel ve denetlenebilir batch mantığıyla çalışmalıdır.

12. Minimum ödeme eşiği

Her payout alıcısı için minimum ödeme eşiği uygulanabilir.

Örnek:

fenomen için belirli alt limit
tedarikçi için farklı alt limit

Eşik altı bakiyeler:

birikir
sonraki döneme taşınır
tek başına payout oluşturmaz

Bu, operasyon maliyetini ve gereksiz işlem yoğunluğunu azaltır.

13. Bloke ve hold mantığı

Payout sistemi şu durumlarda ödeme çıkışını hold’a alabilmelidir:

risk/fraud incelemesi
yüksek iade oranı
açık finansal itiraz
hesap doğrulama sorunu
yönetimsel askı
operasyonel uyuşmazlık
ödeme bilgisi hatası

Net kural:

hold durumu payout sisteminin çekirdek savunmalarından biridir.

14. İptal / iade ilişkisi

Payout sisteminin iptal/iade ile bağı çok güçlü olmalıdır.

Doğru model:

bekleyen iade etkisi olan bakiyeler doğrudan payout’a gitmez
iade sonrası düzeltme mutabakatta işlenir
sonra güncel ödenebilir bakiye payout’a açılır
gerektiğinde önceki dönemden gelecek mahsup uygulanabilir

Net kural:

iade riski kapanmadan agresif payout yapmak finansal zarar doğurur.

15. Kupon ve sponsor etkisi

Kupon sponsor modeli payout’u dolaylı etkiler.

Örnek:

fenomen sponsorlu kupon → fenomen hakedişi düşer
platform sponsorlu kupon → fenomen payout’u korunabilir
platform destekli fenomen kuponu → payout etkisi karışık olabilir ama mutabakat bunu çözmüş olmalı

Payout sistemi kuponu yeniden hesaplamaz; ama mutabakattan gelen düzeltilmiş net ödenebilir bakiyeyi kullanır.

Net kural:

kupon hesabı payout’ta değil mutabakatta çözülür; payout yalnız net sonucu uygular.

16. Kısmi ödeme / kısmi bloke mantığı

Bazı durumlarda aynı hesap için:

bir kısım bakiye ödenebilir
bir kısım bakiye blokede olabilir

Bu yüzden payout sistemi hesap bazında tek toplam mantığıyla değil, kalem bazlı veya dönem kalemi bazlı çalışmalıdır.

Örnek:

10.000 TL toplam bakiye
2.000 TL risk hold
8.000 TL payable

Bu durumda 8.000 TL payout’a girebilmeli, 2.000 TL hold’da kalmalıdır.

17. Başarısız ödeme ve retry sistemi

Dış ödeme akışı her zaman başarıyla sonuçlanmayabilir.

Bu nedenle sistem:

failed payout kaydı oluşturmalı
failure reason tutmalı
otomatik retry politikası veya manuel retry desteği vermeli
belirli sayıda hatadan sonra review’a çekmeli

Örnek hata nedenleri:

hatalı hesap bilgisi
alıcı banka reddi
geçici sistem hatası
compliance / doğrulama problemi

Net kural:

başarısız payout kaydı kaybolmamalı; retry ve review akışı olmalıdır.

18. Fenomen paneli ile ilişki

Fenomen panelinde sade payout görünürlüğü olmalıdır.

Fenomen şunları görebilmeli:

bekleyen hakediş
ödenebilir bakiye
son payout tarihi
son payout tutarı
hold’daki bakiye varsa nedeni
ödeme bilgisi eksikliği uyarısı

Ama şunları görmemeli:

platform finans modeli
tedarikçi payout detayları
sistem iç operasyon notları
19. Tedarikçi paneli ile ilişki

Tedarikçi panelinde sade payout görünürlüğü olmalıdır.

Tedarikçi şunları görebilmeli:

ödenebilir bakiye
son ödeme
hold’daki tutar
kalite/iade etkili kesintiler
ödeme bilgisi durumu

Ama platform finans yapısını ve başka tarafların verisini görmemelidir.

20. Admin sistemi ile ilişki

Admin panelde ayrı bir Payout Merkezi olmalıdır.

Burada finance admin:

payout batch oluşturur
batch onaylar
hold’daki hesapları görür
başarısız ödemeleri inceler
retry başlatır
payout geçmişini görür
fenomen ve tedarikçi bazlı ödeme görünürlüğü alır

Gerekirse:

manuel hold
manuel release
exceptional review
uygulanabilir

Ama kural:

manuel müdahale her zaman gerekçeli ve audit’li olmalıdır
21. Fraud / risk ilişkisi

Payout sistemi risk sistemine çok sıkı bağlı olmalıdır.

Risk sistemi şu çıktıları verebilir:

payout_hold_required
manual_review_required
partial_release_allowed
fraud_case_open

Net kural:

risk review açıkken payout otomatik akmamalıdır.

Bu özellikle:

kupon abuse
sahte sipariş
anormal iade paterni
çoklu hesap hakediş istismarı
senaryolarında kritiktir.
22. Analitik / ölçümleme ile ilişki

Payout sistemi analitik için şu sinyalleri üretmelidir:

ödeme döneminde ödenen toplam
payout başarı oranı
failed payout oranı
hold oranı
fenomen bazlı ödeme dağılımı
tedarikçi bazlı ödeme dağılımı
düzeltme / mahsup yoğunluğu
ortalama payout bekleme süresi

Bu veriler finans operasyon kalitesini ölçmek için gerekir.

23. Audit ve kayıt

Tüm kritik payout olayları loglanmalıdır:

eligible oldu
hold’a alındı
hold kaldırıldı
batch’e eklendi
batch’ten çıkarıldı
ödeme denendi
ödeme başarılı
ödeme başarısız
retry başlatıldı
manuel müdahale yapıldı

Minimum kayıt alanları:

payout_id
beneficiary_type
beneficiary_id
amount
status
reason
batch_id varsa
executed_at varsa
failure_reason varsa
action_by

Bu olmadan payout sistemi denetlenebilir olmaz.

24. Kritik edge case kararları
payout batch hazırlandı, sonra son dakika iade oluştu → ilgili bakiye batch’ten düşebilmeli
payout hesabı geçersiz çıktı → ödeme başarısız, review gerekir
hesap askıya alındı → payout hold’a çekilebilir
fenomen kapandı ama geçmiş kesinleşmiş bakiye var → payout politikası ayrı kural ile yürütülmeli
tedarikçi kalite cezası sonradan işlendi → bir sonraki payout’tan mahsup yapılabilir
kısmi hold var → yalnız payable kısım ödenir
çoklu para birimi ileri fazda gelirse batch ayrışması gerekir
25. Ana kurallar

Payout / ödeme çıkış sistemi için sabitlenmesi gereken temel kurallar şunlardır:

payout sistemi ödeme ve mutabakattan ayrı sistemdir
yalnız kesinleşmiş ve ödenebilir bakiye payout’a girebilir
payout öncesi hold/risk/doğrulama kontrolleri zorunludur
batch mantığı zorunludur
başarısız ödeme için retry/review akışı olmalıdır
fenomen ve tedarikçi için sade payout görünürlüğü olmalıdır
admin finance merkezi payout’ları yönetebilmelidir
manuel müdahaleler gerekçeli ve audit’li olmalıdır
risk review altındaki bakiyeler otomatik ödenmemelidir
tüm kritik payout olayları kayıt altına alınmalıdır
26. Nihai kısa özet

Payout / ödeme çıkış sistemi, finansal mutabakat sistemi tarafından kesinleşmiş ve ödenebilir hale getirilmiş bakiyeleri; fenomen ve tedarikçi bazında batch’leyen, hold ve risk kontrollerinden geçiren, gerçek ödeme talimatına dönüştüren, başarısız ödemeleri retry/review akışıyla yöneten ve finansal denetim izi bırakan merkezi ödeme icra sistemidir.