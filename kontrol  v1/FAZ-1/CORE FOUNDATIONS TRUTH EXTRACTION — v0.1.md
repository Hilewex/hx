FAZ-1 / PAKET-1
CORE FOUNDATIONS TRUTH EXTRACTION — v0.1
1. Ana gerçek

Platformda kimlik sistemi sadece “login” değildir.
Kimlik sistemi; kullanıcının hangi aksiyonu yapabileceğini, hangi hakları kazanacağını, hangi geçmişe sahip olacağını ve hangi sistemlerde yetkili sayılacağını belirleyen başlangıç kapısıdır.

2. Kanonik actor modeli
Actor	Tanım
Misafir kullanıcı	Giriş yapmadan gezen kullanıcı
Kayıtlı kullanıcı	Normal müşteri hesabı
Fenomen mağaza hesabı	Normal kullanıcıdan ayrı mağaza kimliği
Tedarikçi	Ürün/stok/baz fiyat girdisi sağlayan taraf
Platform	Nihai ticari, operasyonel, moderasyon ve kural otoritesi
Admin	Platform kararlarını panelden yöneten yetkili rol
Moderasyon	İçerik ve davranış denetimi
Operasyon	Sipariş, teslimat, fulfillment yönetimi
Finans	mutabakat, hakediş, payout, riskli finans işlemleri

Kritik kural: normal kullanıcı hesabı ile fenomen mağaza hesabı birleşmez; kullanıcı hesabı otomatik olarak fenomen hesabına dönüşmez.

3. Misafir kullanıcı truth’u

Misafir kullanıcı şunları yapabilir:

ana sayfa, keşfet, kategori/PLP, PDP gezebilir
fenomen mağaza sayfası görebilir
açık story/video/UGC tüketebilir
yorum ve soru-cevap okuyabilir
varyant seçebilir
sepete ürün ekleyebilir
sepeti görüntüleyip düzenleyebilir
kontrollü guest checkout kullanabilir

Misafir kullanıcı şunları yapamaz:

beğenemez
kaydedemez
takip edemez
mesaj gönderemez
soru soramaz
yorum yazamaz
story/içerik yükleyemez
sosyal hak kazanamaz

Guest checkout yalnız ticari kapanış istisnasıdır; sosyal hak açmaz.

4. Kayıtlı kullanıcı truth’u

Kayıtlı kullanıcı:

beğenebilir
kaydedebilir
paylaşabilir
fenomen mağaza takip edebilir
takip isteği gönderebilir
PDP’de soru sorabilir
teslim edilmiş ürüne yorum yapabilir
teslim edilmiş ürüne bağlı story yükleyebilir
siparişlerini görebilir
destek süreçlerini kullanabilir
kurallar uygunsa mesajlaşabilir

Ama login tek başına her hak için yeterli değildir. Önce kimlik, sonra eligibility gelir.

5. Eligibility truth’u
Aksiyon	Şart
Soru sorma	login + PDP bağlamı
Yorum yapma	login + satın alma + teslim edilmiş ürün
Kullanıcı story	login + satın alma + teslim edilmiş ürün + ürün etiketi
Ödül puanı	geçerli yorum/story + doğrulama/moderasyon
Puan harcama	spendable puan
Fenomen post görme	login + ilgili mağazayı takip
Mesajlaşma	login + ilişki/izin kuralları
Guest ödeme	kontrollü guest checkout context

Yorum yalnız teslim edilen ürün için açılır; story de teslim edilmiş ürün ve ürün etiketi gerektirir.

6. Ödül puanı lifecycle truth’u

Ödül puanı tek katmanlı değildir.

Minimum statüler:

pending
vested / confirmed
spendable
spent
reversed / cancelled
negative balance

İlk fazda puan yalnız iki aksiyondan doğar:

Aksiyon	Puan
Yorum + yıldız	2
Kullanıcı ürün story	5

Ama puan anında harcanamaz. Önce pending doğabilir; moderasyon, iade penceresi ve risk kontrollerinden sonra spendable olur.

7. Fenomen truth’u

Fenomen bağımsız satıcı değildir.

Fenomen:

başvurur
platform tarafından onaylanır
kategori yetkisi alır
havuzdan ürün seçer
kendi mağazasını yönetir
içerik/story/post üretebilir
kendi mağaza performansını görebilir

Fenomen yapamaz:

stok owner olamaz
kargo owner olamaz
ödeme owner olamaz
sipariş operasyon owner olamaz
bağımsız fiyat motoru kuramaz
platform dışı sipariş/ödeme hattı açamaz

Fenomen “his olarak bağımsız, operasyon olarak platforma bağlı” aktördür.

8. Fenomen lifecycle truth’u

Minimum durumlar:

applied
under_review
revision_requested
approved
active
restricted
suspended
closed

Kategori yetkileri ayrı yönetilir:

authorized
limited_authorized
under_review
closed

Kategori yetkisini yalnız platform verir; takipçi sayısı tek başına yeterli değildir.

9. Admin / panel truth’u

Admin güçlüdür ama sınırsız değildir.

Kritik kurallar:

panel direct write yapmaz
owner dışı write yoktur
panel protected command gönderir
kritik kararlar audit log üretir
admin rolü tek parça değildir
view permission ve action permission ayrıdır

Admin panelde kural/yetki merkezi, audit log, moderasyon, destek, ticari kontrol, sipariş operasyon ve başvuru merkezleri ayrı permission setleriyle çalışmalıdır.

10. İlk kırmızı çizgiler

Repo audit sırasında şu durumlar direkt risk sayılacak:

guest sosyal write yapabiliyorsa → BROKEN
login olmadan yorum/story/soru açılıyorsa → BROKEN
delivered olmadan yorum/story hakkı açılıyorsa → DANGEROUS
puan anında spendable oluyorsa → HIGH RISK
fenomen stok/sipariş/kargo mutate ediyorsa → DANGEROUS
admin panel DB’ye direkt yazıyorsa → DANGEROUS
normal user ile fenomen account birleşikse → BROKEN
support ile sosyal mesajlaşma karışıyorsa → HIGH RISK
11. Bu paketin sonucu

Şu an elimizde ilk canonical foundation çıktı:

CORE_FOUNDATIONS_TRUTH_v0.1

Bu çıktı repo audit sırasında şu soruları kontrol etmek için kullanılacak:

Auth guard doğru mu?
Guest checkout gerçekten sosyal hak açmıyor mu?
User / creator account ayrımı korunmuş mu?
Eligibility delivery/moderation/risk zinciriyle mi çalışıyor?
Admin/panel direct write yapıyor mu?
Fenomen operasyon truth’una müdahale edebiliyor mu?