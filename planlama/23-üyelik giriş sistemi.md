ÜYELİK / GİRİŞ SİSTEMİ
1. Sistem tanımı

Üyelik / giriş sistemi, platformdaki ziyaretçinin misafir kullanıcıdan kayıtlı kullanıcıya geçişini yöneten; hangi aksiyonların anonim açık, hangilerinin kimlik doğrulama gerektirdiğini belirleyen; kullanıcı hesabı, oturum, giriş duvarı ve hesap bazlı işlem yetkilerinin başlangıç kapısı olan temel erişim sistemidir. Bu sistemin görevi yalnız “login ekranı göstermek” değildir; aynı zamanda sosyal etkileşim, içerik üretimi, checkout, sipariş, destek ve hesap tabanlı geçmişin doğru kimlikle ilişkilendirilmesini sağlamaktır.

2. Sistemin ana amacı

Bu sistemin ana amacı şudur:

misafir kullanıcıyı gereksiz erken duvara çarpmadan platformda dolaştırmak,
ama takip, mesaj, soru, yorum, story, ödeme ve sipariş gibi kimlik gerektiren aksiyonları yalnız kayıtlı kullanıcıya açmak,
kullanıcı geçmişini hesap bazında tutmak,
sipariş ve destek süreçlerini gerçek kullanıcı kimliğine bağlamak,
sosyal-commerce yapısında güven, sahiplik ve hak takibini sağlamaktır. Misafir kullanıcının ürün ve içerik keşfi yapabilmesi, 
3. Aktörler

Bu sistemde dört temel aktör vardır:
3.1 Misafir kullanıcı: Sisteme giriş yapmamış ziyaretçidir.
3.2 Kayıtlı normal kullanıcı: Sisteme giriş yapmış standart müşteri hesabıdır.
3.3 Fenomen mağaza hesabı: Normal kullanıcı hesabından ayrı kimliktir; aynı kişi iki ayrı hesap kullanabilir ama bunlar tek hesapta birleşmez ve normal kullanıcı hesabı sonradan otomatik olarak fenomen mağaza hesabına dönüşmez.
3.4 Platform: Giriş kuralları, destek, moderasyon, silme talepleri ve kural uygulamaları gibi alanlarda yetkili merkezi taraftır.

4. Hesap yapısı

Normal müşteri hesabı; ürünlerle etkileşim, takip, mesajlaşma, soru sorma, yorum yapma, story yükleme, sipariş ve destek süreçlerini kullanma, puan kazanma ve puan geçmişi izleme gibi yetkilerin sahibidir. Bu nedenle üyelik sistemi yalnız kimlik doğrulama değil, aynı zamanda kullanıcı haklarının taşıyıcısıdır. Fenomen mağaza hesabı ise bu hesapla karıştırılmamalıdır; tek giriş altında birleşmez, rol değiştirerek dönüşmez, ayrı sistem dalı olarak yaşar.

5. Misafir kullanıcı modeli

Misafir kullanıcı platformda dolaşabilir, ana sayfa, keşfet, kategori/PLP, PDP ve fenomen mağazası gibi açık yüzeyleri görebilir; story, video ve UGC içeriklerini izleyebilir; ürün varyantlarını seçebilir; yorum ve soru-cevap alanını okuyabilir; sepete ürün ekleyebilir, sepeti görüntüleyebilir ve düzenleyebilir.

Misafir kullanıcı sosyal etkileşim ve kimlik bağlı işlemleri yapamaz:
beğenemez
kaydedemez
takip edemez
mesaj gönderemez
soru soramaz
yorum yazamaz
story veya başka içerik yükleyemez

Ticari akış açısından doğru model şudur:
misafir kullanıcı kontrollü guest checkout kullanabilir.
Ancak bu, sosyal hakların açıldığı anlamına gelmez.
Guest checkout yalnız satın alma tamamlama alanında çalışan kontrollü bir istisnadır.

6. Giriş yapmış kullanıcı modeli

Giriş yapmış kullanıcı; ürün beğenebilir, kaydedebilir, paylaşabilir, fenomen mağaza takip edebilir, diğer kullanıcılara takip isteği gönderebilir, PDP üzerinde soru sorabilir, teslim edilmiş ürüne yorum yapabilir, teslim edilmiş ürüne bağlı story yükleyebilir, siparişlerini görebilir, destek süreçlerini kullanabilir ve mesaj kuralları uygunsa mesajlaşabilir. Bu nedenle giriş durumu sadece “hesap var mı” kontrolü değil, aynı zamanda platform içindeki sosyal, ticari ve katkı haklarını açan kapıdır.

7. Giriş zorunluluğu olan aksiyonlar

Aşağıdaki aksiyonlar üyelik veya giriş zorunluluğu doğurur:

beğenme
kaydetme
takip etme
mesaj gönderme
ürün hakkında soru sorma
yorum yazma
story / içerik yükleme

Ödeme ve sipariş oluşturma tarafında ise iki model açılabilir:

giriş yapmış kullanıcı checkout
kontrollü guest checkout

Net kural:
sosyal ve sahiplik bağlı write aksiyonları login ister.
Satın alma kapanışı ise platform kararıyla kontrollü guest checkout istisnası taşıyabilir.

8. Giriş zorunluluğu olmayan alanlar

Aşağıdaki alanlar keşif serbestliği için anonim açık kalmalıdır:

ana sayfa
keşfet
kategori / PLP
PDP görüntüleme
fenomen mağaza sayfası
açık içerik tüketimi
yorumları ve soru-cevap alanını okuma
sepet görüntüleme ve düzenleme

Bu karar platformun sosyal-commerce büyüme mantığı için önemlidir; kullanıcı önce değer görmeli, sonra girişe zorlanmalıdır.

9. Üyeliğe yönlendirme felsefesi

Doğru model sert ve erken engelleme değildir. Misafir kullanıcı rahatça gezebilmeli, ürünleri inceleyebilmeli ve sepet oluşturabilmelidir. Giriş duvarı, ancak kimlik ve sahiplik gerektiren aksiyon anında çıkmalıdır. Bu yaklaşım dosyalardaki “keşif serbestliği + satın alma kontrolü” prensibiyle uyumludur. Yani üyelik sistemi büyüme karşıtı değil, kontrollü dönüşüm sistemidir.

10. Kayıt ve giriş akışları

Sistemde en az şu giriş yolları bulunmalıdır:
10.1 Kayıt ol: Yeni kullanıcı hesabı oluşturur.
10.2 Giriş yap: Var olan kullanıcı hesabıyla oturum açar.
10.3 Girişten sonra geri dönüş: Kullanıcıyı, girişe yönlendirildiği aksiyona veya sayfaya mümkün olduğunca geri döndürmelidir.
10.4 Misafirden üyeye geçiş: Sepet ve niyet korunmalı; kullanıcı yeniden sıfırdan başlatılmamalıdır. Bu akış özellikle checkout başlangıcında kritiktir. Mevcut dosyalarda en net örnek, misafir checkout denemesi sonrası login ve ardından temiz kullanıcı bağlamıyla yeniden devam etme modelidir.

11. Oturum mantığı

Giriş yapan kullanıcı için oturum, hesap tabanlı yetkilerin taşıyıcısıdır. Oturum açıkken kullanıcıya şu alanlar bağlanmalıdır:

takip ilişkileri
kaydetmeler / beğeniler
mesaj erişimi
sipariş geçmişi
destek geçmişi
puan ve içerik geçmişi
adres ve checkout devamlılığı

Bu yüzden üyelik sistemi yalnız kimlik doğrulama ekranı değil, kullanıcı state’inin başlangıç sahibidir. Bu ilişki kullanıcı hesabı ve checkout/sipariş mantığında açık biçimde görülüyor.

12. Misafir sepeti ve login sonrası davranış

Misafir kullanıcı sepete ürün ekleyebilir. Ancak checkout’a giremez; checkout başlatınca giriş veya kayıt zorunluluğu çıkar. Burada doğru davranış, misafir sepetini kaybetmemektir. Login sonrası misafir sepeti ile kullanıcı sepeti merge edilebilir; ardından checkout temiz kullanıcı bağlamıyla yeniden başlatılır. Bu karar üyelik sistemi ile checkout sistemi arasındaki en kritik entegrasyon noktalarından biridir.

13. Hemen al akışı ile ilişki

“Hemen al” sepetten farklı giriş noktası olabilir; ancak üyelik kuralını bozmaz. Hemen al akışında da kullanıcı login değilse giriş zorunluluğu çalışır; ardından aynı checkout kuralları devreye girer. Üyelik sistemi bu yüzden yalnız sepet için değil, tek ürünlü hızlı satın alma akışı için de zorunlu kapıdır.

14. Takip ve görünürlük ilişkisi

Fenomen mağaza postları misafire açık değildir; kullanıcı bunları görebilmek için giriş yapmış ve ilgili fenomen mağazayı takip ediyor olmalıdır. Bu nedenle üyelik/giriş sistemi, yalnız hesabı açmakla kalmaz; aynı zamanda takip sayfası ve takipçiye özel içerik görünürlüğünün de ön koşuludur.

15. Mesajlaşma ilişkisi

Kullanıcı ↔ kullanıcı ve kullanıcı ↔ fenomen mağaza mesajlaşmaları ancak giriş yapılmış kullanıcı için mümkündür. Misafir kullanıcı mesaj gönderemez. Ayrıca mesajlaşma desteğin yerine geçmez; resmi sipariş, iade, teslimat, ödeme sorunları destek sistemine aittir. Üyelik sistemi bu nedenle hem mesaj erişiminin hem de resmi süreç kimliğinin başlangıç noktasıdır.

16. Yorum, soru ve story hakları ile ilişki

Giriş tek başına yeterli değildir; ama ön koşuldur. Kullanıcı login olmuş olmalı, ardından ilgili hak için ek ticari koşullar sağlanmalıdır:

soru için: login yeterlidir, soru PDP’de sorulur
yorum için: login + satın alma + teslim edilmiş ürün
story için: login + satın alma + teslim edilmiş ürün + ürün etiketi

Bu yapı üyelik sisteminin diğer hak sistemleriyle hiyerarşik ilişkisini kurar. Önce kimlik, sonra hak uygunluğu gelir.

17. Profil ve kullanıcı temsili

Kayıtlı kullanıcı, profil temsiline sahip olabilir; profil görseli yükleyebilir, yüklemezse sistem varsayılan avatar atar. Bu alan kimlik doğrulama rozet sistemi değildir; yalnız kullanıcı temsili alanıdır. Özellikle “sizden gelenler” ve story halkası görünümünde sosyal okunabilirliği artırır. Misafir kullanıcıda ise bu hesap tabanlı temsil yoktur.

18. Fenomen hesabı ile sınır

Normal kullanıcı hesabı ile fenomen mağaza hesabı kesin ayrılmalıdır. Aynı kişi ikisine de sahip olabilir; ama:

aynı giriş altında yönetilmez,
rol değişimiyle birbirine dönüşmez,
kullanıcı checkout/sipariş akışı ile fenomen panel akışı karışmaz.

Bu karar daha sonra kurulacak kural/yetki sistemi için de ana girdi olacaktır.

19. Güvenlik ve destek ilişkisi

Üyelik sistemi destek, moderasyon ve kural uygulamalarının da kimlik temelidir. Kullanıcı hangi içeriği yükledi, hangi yorumu yaptı, hangi siparişe dair destek talebi açtı, hangi hesaba hangi yaptırım uygulandı gibi ilişkiler hesap seviyesinde tutulmalıdır. Bu nedenle anonim aksiyon alanı geniş olsa da resmi işlem ve kayıt taşıyan alanlar mutlaka hesap bağlı olmalıdır.

20. Mobil öncelikli giriş yaklaşımı

Mobilde giriş akışı kısa, net ve aksiyon anında açılan yapıda olmalıdır. Kullanıcıyı gereksiz yere ana akıştan koparmamalı; özellikle beğeni, takip, mesaj, soru, yorum ve checkout başlangıcında hızlı login/register geçidi sunmalıdır. Keşif akışını bozmayıp hak gerektiren anda duvar koymak bu sistemin mobilde de korunması gereken ana davranışıdır. Bu çıkarım misafir kullanıcı deneyim ilkeleri ve checkout login duvarı kararlarıyla uyumludur.

21. Ana kurallar

Üyelik / giriş sistemi için sabitlenmesi gereken temel kurallar şunlardır:

misafir kullanıcı puan kazanamaz
misafir kullanıcı fenomen mağaza takipçilerine özel postları göremez
giriş yapmış kullanıcı puan durumunu izleyebilir
misafir kullanıcı dolaşabilir, içerik tüketebilir, ürün inceleyebilir, sepete ürün ekleyebilir
misafir kullanıcı beğeni, kaydetme, takip, mesaj, soru, yorum ve içerik yükleme yapamaz
kontrollü guest checkout açılabilir
guest checkout sosyal ve hesap bağlı write hakları açmaz
misafir sepeti kaybedilmez; login sonrası merge uygulanabilir
kullanıcı hesabı ile fenomen mağaza hesabı aynı domain hesap değildir
normal kullanıcı hesabı fenomen mağaza hesabına dönüşmez
aynı kimlik altında shopper profile / fenomen profile geçişi desteklenebilir
hesap bağlı geçmişler: sipariş, destek, puan, etkileşim ve içerik geçmişidir
üyelik sistemi dönüşüm noktasıdır ama keşif serbestliğini gereksiz erken bozmaz
22. Nihai kısa özet

Üyelik / giriş sistemi, misafir kullanıcının platformu serbestçe keşfetmesine izin veren; ancak takip, mesaj, soru, yorum ve story gibi kimlik ve sahiplik gerektiren aksiyonlarda giriş zorunluluğu uygulayan; ticari kapanışta ise kontrollü guest checkout açabilen; kullanıcı hesabı ile fenomen hesabını domain olarak ayırırken aynı kimlik altında profil geçişi destekleyebilen temel erişim ve hak açma sistemidir.nıcı bağlamına taşıyan temel erişim ve hak açma sistemidir.

####
---
REVİZYON NOTU — 2026-04-19
Durum: Kanonik override
Etkilediği bölüm(ler): Misafir checkout, kullanıcı hesabı / fenomen hesabı ilişkisi
Bağlı dosyalar: 14-checkout sistemi, 25-kural-yetki sistemi

Not:
Bu dosyadaki “checkout yalnız login olmuş kullanıcıya açıktır” kuralı ilk tasarım kararı olarak yazılmıştır; ancak yeni kanonik karar aşağıdaki gibidir:

1. Misafir kullanıcıya kontrollü guest checkout açılabilir.
2. Guest checkout, sosyal haklar vermez; yalnız satın alma tamamlama akışı için kullanılır.
3. Guest checkout kullanan kişi ödeme sonrası sipariş takibi, destek ve sipariş görünürlüğü için sessiz üyelik / sonradan hesap tamamlama akışına yönlendirilebilir.
4. Misafir kullanıcı yine beğeni, kaydetme, takip, mesaj, soru, yorum ve içerik yükleme yapamaz.
5. Guest checkout açılması, sosyal ve hesap bağlı aksiyon guard’larını gevşetmez; yalnız ticari kapanış akışında kontrollü istisna oluşturur.

Ek kullanıcı-profili notu:
1. Normal kullanıcı hesabı ile fenomen mağaza hesabı domain olarak ayrı kalır.
2. Ancak aynı kimlik altında shopper profile / fenomen profile geçişi desteklenebilir.
3. Bu geçiş rol birleşmesi değildir; tek kimlik altında iki ayrı profil scope’unun kontrollü kullanılabilmesidir.
4. Sipariş, destek ve alışveriş geçmişi shopper scope’unda; mağaza yönetimi ve fenomen panel aksiyonları fenomen scope’unda kalır.

Bu not, kimlik alanlarını birleştirmez; yalnız kullanıcı deneyimini sadeleştirir.
---