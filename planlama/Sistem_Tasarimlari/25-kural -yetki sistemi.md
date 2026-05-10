KURAL / YETKİ SİSTEMİ
1. Sistem tanımı

Kural / yetki sistemi, platform içinde hangi aktörün hangi veriyi görebileceğini, hangi işlemi başlatabileceğini, hangi truth alanına write yapabileceğini ve hangi sınırda durması gerektiğini belirleyen merkezi yetki, guard ve enforcement sistemidir. Bu sistem yalnız rol isimleri listesi değildir; aynı zamanda domain ownership, access-context, protected action ve sistem çapı guard mantığıdır. Platform sistem ağacında da bu başlık, “kim neyi yapar, nerede sınır biter” sorusunu netleştirmek için ayrı ana sistem olarak tanımlanmıştır.

2. Sistemin ana amacı

Bu sistemin ana amacı şudur:

kullanıcı, fenomen, tedarikçi, admin, operasyon, moderasyon, finans ve sistem içi servislerin yetki sınırlarını ayırmak,
owner dışı write’ı engellemek,
public, authenticated, verified, internal ve panel aksiyonlarını ayrıştırmak,
domain truth alanlarının hangi modülde mutate edilebileceğini sabitlemek,
UI, BFF, panel ve entegrasyon uçlarında güvenli enforcement sağlamaktır.

Foundation özetinde açıkça “Command → sadece owner modül”, “BFF → read-only aggregation”, “Panel → direct write yok”, “Event → owner modül üretir”, “UI → sadece render katmanı” kuralları sabitlenmiştir. Bunlar bu sistemin ana omurgasıdır.

3. Sistem neden ayrı ana sistemdir

Bu platform yüksek kontrollü modeldir. Çünkü:

fenomen mağaza bağımsız satıcı değildir,
tedarikçi ürün kaynağıdır ama ticari otorite değildir,
kullanıcı birçok yüzeyi görür ama hak bazlı aksiyonları sınırlıdır,
BFF karar verici değildir,
panel serbest write alanı değildir,
finans, commerce, içerik, sosyal ve ranking truth’leri ayrı owner modüllerdedir.

Bu nedenle yetki sistemi “login var mı yok mu” seviyesinden çok daha geniştir; aynı zamanda domain sınır koruma sistemidir.

4. Temel ilke: rol + izin + owner sınırı

Bu sistem üç katmanla çalışmalıdır:

4.1 Rol (role)
Kim bu aktör? Misafir kullanıcı, kayıtlı kullanıcı, fenomen, tedarikçi, admin, moderatör, operasyon, finans, internal system vb.

4.2 İzin (permission / capability)
Bu aktör hangi aksiyonu yapabilir? Takip edebilir, yorum gönderebilir, ürün onaylayabilir, payout bloklayabilir, shipment oluşturabilir vb.

4.3 Owner sınırı (domain ownership)
Aksiyon yapılabilir olsa bile ilgili domain truth owner modülünde yapılmalıdır. Başka modül veya yüzey bu truth üzerinde write yapamaz.

Bu nedenle yetki sistemi yalnız RBAC değil; domain owner enforcement da içerir. Özellikle M9’un ranking yapamaması, M2’nin refund execution yapamaması ve BFF’nin write yapamaması bu mantığın açık örnekleridir.

5. Aktörler

Bu sistemde en az şu aktörler tanımlanmalıdır:

misafir kullanıcı
kayıtlı kullanıcı
verified kullanıcı / eligibility sahibi kullanıcı
fenomen mağaza hesabı
tedarikçi
admin
moderatör
operasyon
finans
internal system / service
BFF
panel client / panel action caller

Bu ayrım dosyalardaki farklı guard örnekleri ve revision notlarında açıkça hissediliyor. Örneğin bazı aksiyonlar authenticated user own scope isterken, bazıları internal/system only olmalıdır; bazı panel aksiyonları da rol bazlı ayrışmalıdır.

6. Temel kurucu kural seti

Bu sistem için sabitlenmesi gereken çekirdek kurallar şunlardır:

6.1 Owner dışı write yok
Her domain entity yalnız owner modül tarafından mutate edilir. Başka modül yalnız read alabilir, event tüketebilir veya command gönderebilir.

6.2 BFF write yapmaz
BFF yalnız aggregation/read katmanıdır; karar vermez, mutate etmez.

6.3 Panel direct write yapmaz
Panel, owner modüle protected action/command gönderir; truth’u doğrudan değiştirmez.

6.4 Event ile state mutate edilmez
Event bilgilendirme ve eventual consistency içindir; state değişimi command owner üzerinden olur.

6.5 UI truth üretmez
UI yalnız render eder; karar, uygunluk ve gerçek state owner sistemlerden gelir.

6.6 Redis / cache / projection truth değildir
Yetki kararları ve owner truth ephemeral helper katmanda değil, gerçek owner state’inde korunur.

7. Access-context mantığı

Kural / yetki sistemi yalnız statik rol listesiyle çalışmamalıdır; access-context hesabı da gerekir. Faz 3 ve Faz 5 bağlam dosyalarında auth/session core, access-context, domain guard ve protected action’ın ayrı çekirdekler olduğu açıkça yazılıdır. Bu nedenle sistem:

kullanıcı login mi,
kullanıcı verified mı,
kullanıcı restricted/suspended mı,
kullanıcı ilgili kaynağın sahibi mi,
aksiyon public mi authenticated mı verified mı internal mı,
actor panel rolüne mi sahip,
domain owner doğru modül mü

sorularını birlikte cevaplamalıdır.

8. Kullanıcı tarafı yetki seviyesi

Kullanıcı için temel yetki kademeleri şöyle olmalıdır:

8.1 Public / guest

içerik tüketebilir
ürün görebilir
sepet oluşturabilir
ama ödeme, sipariş, takip, mesaj, soru, yorum, story, etkileşim write yapamaz

Bu üyelik sistemiyle sabitlenmiştir.

8.2 Authenticated user

takip
mesaj
soru
beğeni/kaydet/paylaş
destek
sipariş görüntüleme
checkout başlatma gibi aksiyonları açar

8.3 Verified / eligible user
Bazı aksiyonlar yalnız login ile değil, ticari eligibility ile açılır. Örneğin yorum ve UGC/story için teslimat/satın alma bağı gerekir. Revision notlarında da UGC create için “Authenticated + Eligibility Check” yerine net bir permission katmanına bağlanması gerektiği belirtilmiştir. Bu çok önemli bir mimari karardır: verified, sabit rol değil; dinamik permission/context olmalıdır.

9. Kullanıcı hesap durumları

M1 event dokümanında user_account_suspended, user_account_reactivated gibi state değişimleri sistem çapında etki üretir:

M2 checkout block
M3 content suppression
M4 interaction reject
M8 ranking dışına alma

Bu nedenle kural/yetki sistemi kullanıcıyı sadece “login olmuş / olmamış” diye değil, aynı zamanda:

active
restricted
suspended
reactivated
gibi state’lerle değerlendirmelidir. Suspended kullanıcı bazı okuma yüzeylerini görebilse bile korumalı aksiyonları yapamamalıdır.
10. Fenomen mağaza yetki modeli

Fenomen mağaza hesabı ayrı aktördür. Şunları yapabilir:

havuzdaki ürünleri görür
ürün seçer
mağazasına ekler
belirlenmiş fiyat koridorunda seçim yapar
sınırlı medya ve içerik kişiselleştirmesi yapar
post/story üretir
mağaza kimliği kurar

Ama şunları yapamaz:

bağımsız ürün yükleme
stok üretme
kargo kuralı belirleme
bağımsız ödeme/sipariş hattı kurma
iade/iptal politikası yazma
ürün gerçeğini veya finans truth’unu mutate etme

Bu nedenle fenomen, yüksek görünürlüklü ama sınırlı command alanına sahip aktördür; operasyon owner değildir.

11. Tedarikçi yetki modeli

Tedarikçi:

kendi ürün verisini girer
stok sağlar/günceller
baz fiyat sağlar
lojistik veri girer
sipariş düşünce fulfillment görevini yürütür

Ama:

platform kârı
fenomen stratejisi
platform iç ticari hesap
nihai satış kurgusu
alanlarını göremez veya yönetemez.

Havuz sistemi dosyasında görünürlük ayrımı çok net tanımlanmıştır; bu ayrım kural/yetki sistemine doğrudan taşınmalıdır.

12. Admin, moderatör, operasyon, finans ayrımı

Bu dört rol tek sepete atılmamalıdır.

12.1 Admin
Sistemsel yönetim, politika, kullanıcı/fenomen/tedarikçi yönetimi, konfigürasyon ve bazı global kararlar.

12.2 Moderatör
İçerik, story, yorum, soru, post ve görünürlük uygunsuzluğu kararları.

12.3 Operasyon
Sipariş, teslimat, fulfillment, istisna ve servis akışları.

12.4 Finans
Ödeme, refund, chargeback, payout, ledger, bakiye, reconciliation.

Revision notları ve panel action eleştirileri bu ayrımın zorunlu olduğunu gösteriyor. Örneğin review/approve benzeri panel uçlarının “genel panel operatörü”ne değil, inceleme tipine göre moderatör/operasyon/finans rollerine ayrılması gerektiği açıkça belirtilmiş.

13. Internal system / service yetkisi

Bazı uçlar yalnız internal/system only olmalıdır. Örneğin ödeme entegrasyon veya shipment creation gibi entegrasyon normalize eden uçlar frontend/public aktöre açık olamaz. Bu nedenle kural/yetki sistemi, network içi servis çağrıları ile kullanıcı/panel çağrılarını kesin ayırmalıdır. Revision notunda bu risk açıkça tanımlanmıştır.

14. Guard katmanları

Bu sistem dört guard katmanında uygulanmalıdır:

14.1 Authentication guard
Kullanıcı/aktör kimliği var mı?

14.2 Role / scope guard
Bu aktör bu uç veya aksiyon sınıfına girebilir mi?

14.3 Ownership guard
Kaynak kendi kaynağı mı? Örn. user own order, own return.

14.4 Domain guard / eligibility guard
Login yetmez; iş kuralı ve dynamic permission sağlanıyor mu? Örn. delivered item check, return eligibility, create_ugc_content eligibility.

M2 API dosyasında da eligibility-check ayrı mekanizma olarak tanımlanmıştır. Bu çok değerli: bazı haklar rol değil, domain uygunluğu ile açılır.

15. Dynamic permission mantığı

Platformda bazı yetkiler kalıcı rol değildir; koşullu olarak açılır. Örnekler:

Can_Checkout
Can_Pay
Can_Return_Item
Can_Create_UGC
Can_Review_Product
Can_Ask_Question
Can_Message_Creator

Özellikle UGC için revision notunda açıkça “verified_purchase claim” veya benzeri dinamik permission önerilmiştir. Bu nedenle kural/yetki sistemi yalnız role listesi ile değil, permission hesaplaması ile çalışmalıdır.

16. Endpoint ve action ayrımı

Aynı işlev farklı aktörler tarafından farklı yetkiyle yapılabilir. Örneğin kullanıcı kendi siparişini iptal etmek isterken operasyon paneli farklı kapsamdan iptal yapabilir. Revision notlarında bu tür uçların /me/... ve panel action olarak ayrılması veya açık scope-guard belirtilmesi öneriliyor. Bu çok doğru bir ilkedir:

user action
panel action
internal system action
aynı isimde olsa bile aynı yetki sınıfında olmamalıdır.
17. Domain ownership örnekleri

Bu sistemde net owner örnekleri şunlardır:

M1: auth/session/user access-state owner
M2: commerce truth owner
M6: financial truth owner
M8: ranking owner
M9: search intent + candidate owner, ranking owner değildir
M3/M4: içerik/sosyal truth alanları
M7/BFF: read aggregation only

M9’un “ranking yapmaz, ordering yapmaz, BFF değildir” sınırı ve M2’nin “refund execution yok, financial truth M6’dadır” sınırı owner matrisi mantığının somut örnekleridir.

18. Finans tarafında özel kural

Finansal ledger, balance, payout, reconciliation ve refund execution finans truth alanıdır. Revision notlarında M5’in bakiye/hakediş mutate ediyor gibi görünmesinin yanlış olduğu ve bunun M6’ya taşınması gerektiği açıkça belirtilmiştir. Bu nedenle kural/yetki sisteminde finans alanı için ekstra sert kural olmalıdır:

Finansal truth yalnız finans owner modülünde mutate edilir; diğer modüller yalnız tetik, görünürlük veya read context sağlar.

19. Event ve yetki ilişkisi

Event üretimi de yetki konusudur. M1 event dosyasında “M1 dışı modül M1 event üretemez” kuralı yazılıdır. Bu çok kritik bir ownership kuralıdır. Yani event publish de sınırsız değildir; her event ailesinin sahibi owner modüldür. Ayrıca event ile doğrudan state mutate edilmemesi gerektiği de açıkça yazılmıştır.

20. Panel ve manuel müdahale sınırı

Hiçbir manuel müdahale audit trail ve temel güvenlik kurallarını yok sayamaz. Bu nedenle panel aksiyonları serbest bypass alanı olamaz. Revision notlarında bu ilke açıkça savunulmuş. Doğru model:

panel action rol bazlıdır,
audit üretilir,
owner modül üzerinden işler,
manuel müdahale truth ownership’i bozmaz.
21. Yetki sisteminin görünürlük boyutu

Kural/yetki sistemi yalnız write engellemez; bazı verilerin kim tarafından görüleceğini de belirler. Havuz sisteminde:

tedarikçi kendi baz fiyatı ve stokunu görür,
fenomen fiyat koridorunu ve onaylı ürünleri görür,
tedarikçi platform iç kâr dağılımını görmez.

Bu nedenle sistemde hem view permission hem action permission ayrı ele alınmalıdır.

22. Moderasyon ve support ayrımı

Moderasyon ile destek farklıdır; bu ayrım kural/yetki sisteminde de korunmalıdır. Destek çözüm ve yönlendirme merkezidir; moderasyon içerik uygunluğu ve yaptırım merkezidir. Aynı panel kullanılsa bile aynı permission set’ine bağlanmamalıdır. Bu ayrım önceki sistem kararlarıyla da uyumludur ve burada yetki omurgasına dönüştürülmelidir.

23. Mobil ve frontend etkisi

Frontend hiçbir yetki kararının nihai sahibi değildir. Mobil/web yalnız:

kullanıcıyı doğru aksiyona yönlendirir,
kapalı aksiyonlarda login wall gösterir,
yetki reddini kullanıcıya anlatır,
ama izin vermeyi veya truth mutate etmeyi kendi başına yapmaz.

Bu, “UI sadece render katmanı” ve “protected action / domain guard merkezi enforcement” yaklaşımıyla uyumludur.

24. Ana kurallar

Kural / yetki sistemi için sabitlenmesi gereken temel kurallar şunlardır:

owner dışı write yoktur
BFF read-only aggregation katmanıdır
panel direct write alanı değildir
event sadece owner modül tarafından üretilir
event ile state mutate edilmez; command gerekir
UI yalnız render katmanıdır
rol tek başına yeterli değildir; dynamic permission ve eligibility de gerekir
authenticated, verified, internal ve panel aksiyonları ayrı guard katmanlarıyla korunmalıdır
finans, moderasyon, operasyon ve admin rolleri birbirine karıştırılmamalıdır
internal entegrasyon uçları public erişime açık olamaz
view permission ile action permission ayrı düşünülmelidir
manuel müdahale audit ve ownership kurallarını by-pass edemez
suspended/restricted user state’leri sistem çapı yetki etkisi üretir
permission enforcement auth + scope + ownership + eligibility + domain owner zinciriyle çalışmalıdır.
25. Nihai kısa özet

Kural / yetki sistemi, platformdaki tüm aktörlerin hangi veriyi görebileceğini, hangi aksiyonu başlatabileceğini ve hangi domain truth alanında write yapabileceğini belirleyen; rol, dynamic permission, ownership guard, eligibility check ve protected action mantığını birlikte işleten merkezi enforcement sistemidir. Bu sistemin temel ilkesi; owner dışı write’ın yasak olması, BFF ve UI’ın truth üretmemesi, panelin bypass alanı olmaması ve her kritik aksiyonun doğru role, doğru scope’a ve doğru owner modüle bağlanmasıdır.


#####
---
REVİZYON NOTU — 2026-04-19
Durum: Açıklama notu
Etkilediği bölüm(ler): Profil scope, guest checkout istisnası
Bağlı dosyalar: 23-üyelik giriş sistemi, 42-fenomen mağaza yönetim panel sistemi

Not:
Role ve owner sınırları korunur. Ancak aşağıdaki ek yorum geçerlidir:

1. Guest checkout açılması, kimlik gerektiren sosyal ve hesap bağlı write yetkilerini açmaz.
2. Bu yalnız ticari kapanış akışında kontrollü bir istisnadır.
3. Aynı kimlik altında shopper profile / fenomen profile geçişi desteklenebilir.
4. Bu geçiş role merge anlamına gelmez.
5. Her profil kendi domain yetkisi içinde kalır.
---

************************************

`25-kural -yetki sistemi.md` içine de daha kısa bir karar kaydı eklenmeli:

```markdown
---

## SUPER_ADMIN / PLATFORM_OWNER Yetki Kararı

Platformda `SUPER_ADMIN` veya `PLATFORM_OWNER` rolü tanımlanır.

Bu rol:

- en geniş panel görünürlüğüne sahiptir,
- admin / creator / supplier / support / moderation / finance / payout / operation modüllerinde işlem başlatabilir,
- rol ve yetki yönetimini yapabilir,
- yüksek riskli işlemler için onay süreci başlatabilir.

Ancak bu rol:

- owner servisleri bypass edemez,
- doğrudan veritabanı veya truth mutation yapamaz,
- audit/evidence olmadan kritik işlem gerçekleştiremez,
- maker-checker gereken işlemlerde aynı aktör olarak hem maker hem checker olamaz.

Kural:

```text
Süper yönetici sınırsız direct-write yetkisi değil, merkezi kontrol ve onay yetkisidir.