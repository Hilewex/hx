DESTEK TICKET OPERASYON SİSTEMİ
1. Sistem tanımı

Destek ticket operasyon sistemi, kullanıcıdan gelen resmi destek taleplerinin ticket’a dönüştürüldüğü; konu, öncelik ve risk seviyesine göre sınıflandırıldığı; doğru ekibe atandığı; SLA ile takip edildiği; gerektiğinde sipariş, ödeme, teslimat, iade, moderasyon veya finans ekiplerine escalate edildiği ve çözüm yaşam döngüsünün kayıtlı biçimde yönetildiği merkezi operasyon sistemidir.

Bu sistemin görevi yalnız ticket açmak değildir. Aynı zamanda:

ticket sınıflandırmak
önceliklendirmek
doğru kuyruğa düşürmek
ilgili domain ekibine atamak
SLA takibi yapmak
tekrar açılan sorunları ilişkilendirmek
çözüm ve kapanış kayıtlarını tutmak
escalations yönetmektir

Kısa tanım:

Destek ticket operasyon sistemi, resmi destek taleplerinin iç çözüm ve vaka yönetim motorudur.

2. Temel ilke

Bu sistemin temel ilkesi şudur:

Her destek talebi aynı ağırlıkta değildir; doğru ticket, doğru ekip ve doğru SLA ile yönetilmelidir.

Yani:

ödeme problemi ile basit bilgi talebi aynı kuyruğa düşmemeli
teslimat gecikmesi ile hesap erişim problemi aynı öncelikle çalışmamalı
iade itirazı ile ürün bilgisi sorusu aynı operasyon sistemine gitmemeli
sosyal mesaj kutusu ile resmi destek birbirine karışmamalı.

Net kural:

Destek ticket operasyonu serbest sohbet değil, kurallı vaka yönetimidir.

3. Sistemin platform içindeki rolü

Bu sistem şu alanlarla doğrudan ilişkilidir:

destek sistemi
sipariş sistemi
sipariş operasyon sistemi
kargo / teslimat sistemi
iptal / iade sistemi
ödeme sistemi
finansal mutabakat sistemi
moderasyon sistemi
fraud / risk sistemi
admin sistemi

Doğru akış şöyle olmalıdır:

kullanıcı destek girişinden konu seçer
sistem self-service çözüm sunar
çözülmezse ticket oluşur
ticket doğru sınıfa düşer
ilgili ekip işler
gerekirse escalation açılır
çözüm kaydı tutulur
kapanış yapılır

Bu yapı destek sistemindeki “önce yönlendirme, çözülmezse ticket / canlı destek” mantığıyla birebir uyumludur.

4. Bu sistem destek sistemiyle aynı şey değildir

Destek sistemi:

kullanıcı giriş kapısıdır
yardım cebi / konu seçimi / yönlendirme / self-service tarafıdır.

Destek ticket operasyon sistemi:

içeride çalışan ticket motorudur
kuyruk, atama, SLA, çözüm, escalation tarafıdır

Net kural:

destek sistemi kullanıcı yüzü, ticket operasyon sistemi iç çözüm sistemidir.

5. Aktörler

Bu sistemde en az şu aktörler vardır:

5.1 Kullanıcı

Ticket’ın sahibi ve problem bildiricidir.

5.2 Support Admin / Support Agent

Ticket’ı ilk karşılayan, sınıflayan veya çözen ekip tarafıdır.

5.3 Operations Team

Sipariş, teslimat, hazırlama ve operasyonel konularda devreye girer.

5.4 Finance Team

Ödeme, refund, kupon finansı, hakediş itirazı gibi durumlarda devreye girer.

5.5 Moderation Team

İçerik şikayetleri, mağaza davranış ihlalleri, yorum/story/post sorunlarında devreye girer.

5.6 Fraud / Risk Team

Kötüye kullanım şüphesi, kupon suistimali, sahte sipariş gibi vakalarda devreye girer.

5.7 Admin

Üst görünürlük, kritik escalation ve denetim tarafıdır.

6. Ticket kaynakları

Ticket yalnız tek yerden açılmak zorunda değildir; ama hepsi tek ticket sistemi içinde toplanmalıdır.

Minimum kaynaklar:

destek cebi
sipariş detay ekranı
teslimat / sipariş takip ekranı
iade / iptal akışı
ödeme hata ekranı
hesap / giriş sorun ekranı
moderasyon / şikayet yüzeyi
gerekiyorsa admin iç açılışları

Net kural:

farklı giriş noktaları olabilir, ama ticket truth’u tek sistemde olmalıdır.

7. Ticket türleri

Bu sistem en az şu ana ticket türlerini taşımalıdır:

sipariş problemi
teslimat / kargo problemi
iptal / iade talebi / itirazı
ödeme problemi
kupon / promosyon problemi
hesap / giriş problemi
teknik problem
mağaza / fenomen şikayeti
içerik / moderasyon şikayeti
ürün kalite problemi
puan / ödül / puan market problemi

Bu sınıflandırma olmadan doğru atama yapılamaz.

8. Öncelik ve önem seviyesi

Her ticket aynı öncelikte olmamalıdır.

Minimum öncelik seviyeleri:

low
normal
high
urgent
critical

Örnek:

“siparişim teslim edilmedi” → high
“ödeme alındı ama sipariş görünmüyor” → urgent
“kupon çalışmıyor” → normal / high
“hesabıma erişemiyorum” → high
“yanlış yorum kaldırılmalı” → normal
“sahte sipariş / fraud şüphesi” → critical

Net kural:

öncelik kullanıcı metnine göre değil, sistem sınıflandırmasına göre oluşmalıdır.

9. Ticket yaşam döngüsü

Bu sistem yaşam döngüsü bazlı çalışmalıdır.

Minimum durumlar:

opened
triaged
assigned
investigating
waiting_internal
waiting_user
escalated
resolved
closed
reopened

Bu yapı sayesinde:

ticket nerede takıldı
kullanıcı mı bekleniyor
iç ekip mi bekleniyor
çözüm verildi mi
görülebilir.
10. Triage sistemi

Ticket açıldıktan sonra önce triage aşamasına girmelidir.

Triage şu kararları verir:

ticket doğru kategoriye mi ait
öncelik seviyesi ne
hangi domain ekibi owner
sipariş / ödeme / içerik / hesap / fraud bağlantısı var mı
tek ticket mı, tekrar vaka mı
hızlı çözüm mü gerekir, escalation mı gerekir

Net kural:

ticket doğrudan rastgele support person’a düşmemeli; önce triage katmanı olmalıdır.

11. Kuyruk sistemi

Destek ticket operasyon sistemi kuyruk bazlı çalışmalıdır.

Minimum kuyruklar:

genel support kuyruğu
sipariş / teslimat kuyruğu
iade / iptal kuyruğu
ödeme / finans kuyruğu
teknik problem kuyruğu
moderasyon / şikayet kuyruğu
fraud / risk inceleme kuyruğu
VIP / yüksek öncelikli kuyruk gerekiyorsa

Bu kuyruk mantığı doğru atamayı sağlar.

12. Atama sistemi

Her ticket bir owner taşımalıdır.

Atama tipleri:

support agent’a atama
ekip kuyruğuna atama
domain ekibine escalation
yeniden atama
birlikte takip edilen vaka

Her ticket’ta minimum alanlar olmalıdır:

owner_type
owner_id veya team_id
assigned_at
reassigned_count
current_sla_clock

Net kural:

owner’ı belli olmayan ticket kayıp ticket’a dönüşür.

13. SLA sistemi

Bu sistemin en kritik parçalarından biri SLA’dir.

Her ticket tipi için minimum şu iki alan tanımlanmalıdır:

first response SLA
resolution SLA

Örnek:

ödeme problemi → daha kısa
teslimat gecikmesi → kısa
hesap erişim problemi → kısa
bilgi talebi → daha geniş

Ayrıca şu durumlar izlenmelidir:

SLA riskinde
SLA aşıldı
çözüm bekliyor
kullanıcı bekleniyor nedeniyle saat duruyor mu

Net kural:

Destek operasyonu ölçülemezse kalite yönetilemez.

14. Sipariş ve operasyon bağlamı

Sipariş bağlı ticket’lar sipariş bağlamını zorunlu taşımalıdır.

Minimum bağlam:

order_id
order_line_id gerekiyorsa
shipment_id gerekiyorsa
teslimat durumu
iade / iptal durumu
kupon etkisi varsa
ödeme durumu
support history

Bu, sipariş operasyon sistemi ve sipariş takip sistemiyle güçlü bağ kurar. Ticket kör olmamalıdır.

15. İptal / iade ilişkisi

İptal / iade süreciyle ilgili ticket’lar ayrı dikkat ister.

Bu ticket’larda:

satır bazlı bağlam
uygunluk durumu
önceki iade geçmişi
finansal durum
teslimat doğrulaması
kalite notu
olmalıdır.

Net kural:

İade ticket’ı yalnız yazışma değil, operasyon ve finans bağlamı taşıyan vaka olmalıdır.

16. Ödeme ve finans ilişkisi

Ödeme / kupon / refund kaynaklı ticket’lar finansal bağlam ister.

Bu ticket’larda minimum şu alanlar olmalıdır:

payment_ref
payment_status
coupon_id varsa
sponsor tipi varsa
refund status
hakediş etkisi gerekiyorsa
risk işareti

Bu ticket’lar gerektiğinde finance admin kuyruğuna escalate edilmelidir.

17. Moderasyon ve mağaza şikayetleri ilişkisi

Bazı destek talepleri aslında moderasyon vakasıdır.

Örnek:

uygunsuz mağaza postu
rahatsız edici mesaj
sahte kullanıcı story’si
yanlış ürün tanıtımı
fenomen mağaza davranış şikayeti

Bu tip ticket’lar:

destek ticket olarak açılabilir
ama moderasyon veya fenomen yönetim sistemine bağlı alt vaka üretebilir

Net kural:

Ticket operasyonu her vakayı kendi içinde çözmeye çalışmamalı; doğru owner sisteme bağlamalıdır.

18. Fraud / risk ilişkisi

Bazı ticket’lar risk sinyali üretir.

Örnek:

aynı kullanıcı sürekli kupon problemi bildiriyor
siparişler sahte olabilir
anormal iade paterni var
çoklu hesap şüphesi var

Bu sistem fraud / risk sistemine şu sinyalleri verebilmelidir:

repeated suspicious complaint
coupon abuse suspicion
refund abuse suspicion
account takeover suspicion

Ayrıca risk sistemi de ticket’a “review required” sinyali verebilir.

19. Tekrar açılan ve ilişkili vakalar

Gelişmiş sistemde çok önemli bir alan budur.

Destek ticket operasyon sistemi şunları desteklemelidir:

aynı siparişe bağlı çoklu ticket’ı ilişkilendirme
tekrar açılan vakayı önceki çözümle bağlama
aynı kullanıcıdaki kronik problem desenini görme
aynı mağaza / tedarikçi / ürün için artan problem yoğunluğunu fark etme

Bu, kalite ve risk tarafını da besler.

20. İç not, karar ve çözüm kaydı

Her ticket’ta iki ayrı alan olmalıdır:

Kullanıcıya görünen çözüm notu

Dış iletişim metni

İç operasyon notu

Agent / admin iç değerlendirmesi

Ayrıca şu alanlar tutulmalıdır:

root cause
çözüm tipi
düzeltici aksiyon
manuel istisna verildi mi
refund / kupon / iade / moderasyon alt etkisi var mı

Net kural:

Ticket kapanınca sadece “çözüldü” değil, çözümün nasıl olduğu da kayıtlı olmalıdır.

21. Admin sistemi ile ilişki

Admin panelde ayrı bir Destek Operasyon Merkezi olmalıdır.

Burada admin veya support lead:

açık ticket sayısı
SLA riski
çözüm süreleri
ekip yükü
tekrar açılan vaka oranı
kategori bazlı problem yoğunluğu
mağaza / tedarikçi kaynaklı destek yükü
kritik escalation listesi
görebilmelidir.

Bu görünürlük olmadan destek kalite yönetimi yapılamaz.

22. Fenomen ve tedarikçi sistemleri ile ilişki

Bazı ticket’lar fenomen veya tedarikçi kaynaklı probleme dayanabilir.

Örnek:

fenomen mağaza yanıltıcı tanıtım
tedarikçi kalite sorunu
tedarikçi geç sevk
mağaza içeriği ile ürün uyuşmazlığı

Bu yüzden ticket sistemi:

fenomen yönetim sistemine sinyal
tedarikçi yönetim sistemine sinyal
üretebilmelidir.

Net kural:

Destek ticket operasyonu sadece müşteri hizmeti değil, kalite ve denetim veri kaynağıdır.

23. Analitik / ölçümleme ile ilişki

Bu sistem analitik için çok değerli veri üretir.

Ölçülmesi gerekenler:

ticket açılma nedeni dağılımı
ilk cevap süresi
çözüm süresi
tekrar açılma oranı
sipariş başına ticket oranı
mağaza bazlı ticket yoğunluğu
tedarikçi bazlı ticket yoğunluğu
kupon kaynaklı ticket oranı
kategori bazlı destek yükü

Bu veriler:

ürün iyileştirme
operasyon iyileştirme
kalite denetimi
risk sistemi
için kullanılır.
24. Audit ve kayıt

Tüm kritik ticket olayları loglanmalıdır:

ticket açıldı
triage yapıldı
owner atandı
öncelik değişti
SLA değişti
escalation açıldı
çözüm verildi
kapatıldı
tekrar açıldı
manuel istisna verildi

Bu olmadan destek operasyonu denetlenebilir olmaz.

25. Kritik edge case kararları
kullanıcı aynı sorun için 5 ticket açtı → ilişkilendirme / birleştirme gerekir
sipariş iptal oldu ama eski ticket açık kaldı → bağlam güncellenmeli
kullanıcı cevap vermedi → waiting_user mantığı çalışmalı
çözüm verildi ama kullanıcı itiraz etti → reopened süreci açılmalı
kritik ödeme problemi var → support yerine finance owner olabilir
moderasyon şikayeti geldi → alt vaka moderasyon kuyruğuna düşmeli
fraud şüphesi olan refund talebi geldi → risk review zorunlu olmalı
26. Ana kurallar

Destek ticket operasyon sistemi için sabitlenmesi gereken temel kurallar şunlardır:

bu sistem destek giriş yüzeyi değildir; iç ticket operasyon sistemidir
sosyal mesajlaşma ile karıştırılmamalıdır
ticket’lar kategori, öncelik ve owner mantığıyla yönetilmelidir
triage katmanı zorunludur
SLA takibi zorunludur
sipariş, ödeme, iade, moderasyon ve fraud bağlamları desteklenmelidir
tekrar açılan ve ilişkili vakalar bağlanabilmelidir
iç not ve dış çözüm metni ayrılmalıdır
destek verisi kalite ve risk sinyali üretebilmelidir
tüm kritik olaylar audit log üretmelidir
27. Nihai kısa özet

Destek ticket operasyon sistemi, kullanıcıdan gelen resmi destek taleplerini ticket’a dönüştüren; doğru kuyruk ve ekibe atayan; sipariş, ödeme, iade, moderasyon ve fraud bağlamlarıyla işleyen; SLA, escalation, çözüm ve kapanış yaşam döngüsünü yöneten; destek sisteminin iç vaka ve operasyon motorudur.