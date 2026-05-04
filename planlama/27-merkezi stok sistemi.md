MERKEZİ STOK SİSTEMİ
1. Sistem tanımı

Merkezi stok sistemi, platformdaki ürün ve varyantların satılabilir adet gerçeğini tek merkezde tutan; aynı ürün birden fazla fenomen mağazasında görünse bile stok doğruluğunu tek kaynaktan yöneten; sepet, checkout, sipariş, teslimat, iptal/iade ve tedarikçi güncellemeleri arasında stok tutarlılığını koruyan merkezi ticari truth sistemidir. Sistem ağacında bu başlık “kısmen hazır sistemler” arasında açıkça yer alır.

devam et

Stok sistemini, havuzdaki merkezi stok ilkesini checkout doğrulaması ve teslimat/iade etkileriyle birleştirerek tamamlıyorum. Öncelik: “aynı ürün farklı mağazada görünse de truth tek merkezde kalır” kuralını netleştirmek.

8s boyunca düşündüm

Devam ediyorum.

2. Sistemin ana amacı

Merkezi stok sisteminin ana amacı şudur:

aynı ürün farklı fenomen mağazalarında görünse bile stok gerçeğini tek merkezde tutmak,
tedarikçiden gelen stok güncellemelerini merkezi truth’a işlemek,
sepette yumuşak niyet ile checkout’ta sert doğrulama arasındaki farkı yönetmek,
oversell riskini azaltmak,
rezervasyon, sipariş, teslimat, iptal ve iade etkilerini tutarlı biçimde stok gerçeğine yansıtmak,
fenomen mağazanın stok üretmesini veya ayrı stok alanı yaratmasını engellemektir.

Havuz sistemi dosyasında doğrudan “stok merkezi çalışır”, “aynı ürün farklı fenomen mağazalarında görünse bile stok tektir”, “satış olduğunda merkezi stok etkilenir”, “tedarikçi stok sağlar ve günceller”, “fenomen stok üretemez” ve “stok gerçeği platform kontrolündeki merkezi yapıda tutulur” denir. Bu zaten sistemin çekirdeğini verir.

3. Temel ilke

Bu sistemin temel ilkesi şudur:

Stok görünürlüğü dağıtık olabilir, stok gerçeği dağıtık olamaz.

Yani:

aynı ürün birden fazla mağazada listelenebilir,
farklı yüzeylerde farklı bağlamda gösterilebilir,
ama satılabilir adet gerçeği tek merkezde tutulur.

Fenomen mağazası dosyasında da platforma bağlı taraflar arasında açıkça “stok” sayılır; yani fenomen mağaza bağımsız stok alanı değildir.

4. Aktörler

4.1 Tedarikçi
Stok sağlar ve günceller. Ama stok truth owner değildir; yalnız kaynak girdisi sağlar.

4.2 Platform
Merkezi stok gerçeğini tutar, rezervasyon kurallarını işletir, checkout/sipariş/doğrulama zincirinde stok kararını verir.

4.3 Fenomen mağaza
Stok göremezse bile stok üretemez, stok belirleyemez, ayrı mağaza stoğu yaratamaz.

4.4 Kullanıcı
Stok sahibi değildir; yalnız uygunluk sonucunu görür.

5. Stok sisteminin platform içindeki rolü

Akış sırası içinde stok sisteminin rolü şöyledir:

ürün kabulde stok alanı alınır,
varyantlı üründe stok gerekirse varyant bazında tutulur,
sepet satırı stok uygunluğu taşıyabilir ama garanti taşımaz,
checkout final stok doğrulamasını yapar,
rezervasyon gerekiyorsa checkout aşamasında aktive olur,
siparişe dönüşürse rezervasyon consumed olur,
teslimat, iptal ve iade süreçleri stok gerçeğine sonradan etkide bulunur.

Checkout dosyası bunu açıkça destekler: sepette stok garantisi yoktur; final stok uygunluğu checkout’ta kontrol edilir; rezervasyon created / active / released / consumed / expired mantığıyla yönetilir.

6. Varyant bazlı stok

Merkezi stok sistemi ürün bazında çalışabilir; ama gerektiğinde varyant bazında çalışması zorunludur. Çünkü varyant sisteminde her varyant için ayrı stok tutulabileceği açıkça tanımlanmıştır. Dolayısıyla doğru model:

stok bir ürün ailesi altında tutulur,
satılabilir adet truth’u gerektiğinde varyant seviyesinde belirlenir,
checkout ve sipariş doğrulaması seçilmiş varyant üstünden yapılır.
Bu, varyant sistemi kararlarıyla doğrudan uyumludur.
7. Sepet ile ilişkisi

Sepette stok uygunluğu alanı bulunabilir; ama bu nihai garanti değildir. Sepet dosyası her satırda “stok uygunluğu durumu” taşınabileceğini söyler, checkout dosyası ise bunun nihai ticari doğruluk olmadığını açıkça belirtir. Bu nedenle doğru kural:

sepet stok niyetini yansıtır,
sepet stok rezerve etmez,
sepetteki uygunluk yumuşak işarettir,
gerçek karar checkout’tadır.
8. Checkout ile ilişkisi

Checkout, stok yarışının en kritik noktasıdır. Doğru kural:

sepette stok garantisi yoktur,
checkout’ta stok yeterli mi yeniden doğrulanır,
gerekirse rezervasyon checkout’ta aktive olur,
stok yetersizse checkout bloklanır,
kullanıcıya açık uyarı gösterilir.

Checkout dosyasında validation state içinde stock_mismatch ve bloke alanında stok yetersiz açıkça yer alır. Ayrıca checkout satırında “stok uygunluğu” alanı zorunlu doğruluklardan biridir.

9. Rezervasyon mantığı

Merkezi stok sistemi rezervasyon alt katmanına sahip olmalıdır. Checkout dosyasındaki state seti bu yapıyı zaten tarif ediyor:

created
active
released
consumed
expired

Doğru model:

kullanıcı checkout’a geldiğinde rezervasyon oluşturulabilir,
ödeme başarısızsa veya akış terk edilirse rezervasyon bırakılır,
siparişe dönüşürse rezervasyon tüketilir,
süresi geçen rezervasyon otomatik düşer.

Bu sayede sepet ile sipariş arasında kontrollü stok geçişi kurulur.

10. Sipariş ile ilişkisi

Sipariş oluştuğunda stok niyeti resmi ticari etkiye dönüşür. Doğru yaklaşım:

checkout’ta doğrulanan satır siparişe geçer,
ilgili rezervasyon consumed olur,
stok merkezi truth üzerinde sipariş etkisi işlenir,
bu etki mağaza bazlı değil merkezi ürün/varyant gerçeğinde tutulur.

Bu, havuz sistemindeki “satış olduğunda merkezi stok etkilenir” kuralının doğal sonucudur.

11. Teslimat ile ilişkisi

Teslimat sistemi stok owner değildir; ama fulfillment hattının ana kullanıcısıdır. Sipariş düştüğünde tedarikçi hazırlama ve gönderme rolünü alır. Teslimat sistemi çok paketli yapı kurabilir; fakat stok gerçeği yine merkezi kalır. Yani:

teslimat, stok truth’unun tüketildiği operasyon hattıdır,
stok kararı teslimat sisteminde üretilmez,
ama teslim edilemeyen, kaybolan, iade dönen veya iptal edilen satırlar stok sistemine geri etki üretebilir.
12. İptal ve iade ile ilişkisi

İptal/iade sistemi stok açısından çok kritiktir. Dosyalarda stok problemi iptal sebeplerinden biri olarak açıkça geçer. Bu nedenle doğru model:

teslimat öncesi iptalde rezervasyon/stok etkisi geri bırakılır,
teslimat sonrası iadede fiziksel geri kabul ve kalite sonucu baz alınarak stok geri kazanımı değerlendirilir,
kısmi iptal/kısmi iade satır bazında stok etkisi üretir.
İptal/iade sisteminin satır bazlı çalışması bu yüzden stok sistemi için de zorunludur.
13. Çok mağazalı görünüm ile tek stok gerçeği

Platformda aynı ürün farklı fenomen mağazalarında görünebilir; sepet de çok mağazalı çalışabilir. Ancak stok sistemi burada mağaza bazlı çoğalmaz. Doğru kural:

mağaza bağlamı satış sunumudur,
stok bağlamı merkezi truth’tur,
tek ürün/varyant gerçeği, birden fazla mağaza görünümünü besler.

Bu ilke havuz ve fenomen mağazası dosyaları birlikte okunduğunda nettir.

14. Stok güncelleme kaynakları

İlk faz için stok güncelleme kaynakları şunlar olmalıdır:

tedarikçi XML/API/panel güncellemesi
checkout rezervasyon akışı
sipariş oluşumu
iptal etkisi
iade / geri kabul etkisi
operasyonel düzeltme / audit

Ama owner yine merkezi stok sistemidir; dış kaynaklar yalnız değişim girdisi sağlar.

15. Ana riskler

Merkezi stok sistemindeki ana riskler:

oversell
sepette görünen ama checkout’ta tükenen stok
varyant bazlı yanlış stok
çok mağazalı görünümde stok çifte sayımı
iptal/iade sonrası yanlış stok geri kazanımı
tedarikçi stok güncellemesinin geç yansıması

Checkout dosyasının stok yarışını kritik nokta olarak işaretlemesi bu risklerin çekirdeğini doğrular.

16. Ana kurallar

Merkezi stok sistemi için sabitlenmesi gereken temel kurallar şunlardır:

stok merkezi çalışır
aynı ürün farklı fenomen mağazalarında görünse bile stok tektir
tedarikçi stok sağlar ve günceller
fenomen stok üretemez ve stok belirleyemez
stok gerçeği platform kontrolündeki merkezi yapıda tutulur
sepet stok garantisi vermez
final stok doğrulaması checkout’ta yapılır
rezervasyon checkout aşamasında aktive olabilir
ödeme başarısızsa rezervasyon bırakılır
sipariş oluşursa rezervasyon consumed olur
stok gerektiğinde varyant bazında tutulur
iptal ve iade stok etkileri satır bazında yönetilir
çok mağazalı görünüm stok truth’unu çoğaltmaz.
17. Nihai kısa özet

Merkezi stok sistemi, ürün ve varyantların satılabilir adet gerçeğini tek merkezde tutan; aynı ürün farklı fenomen mağazalarında görünse bile stok truth’unu çoğaltmayan; tedarikçiden stok güncellemesi alan; sepette yalnız yumuşak uygunluk, checkout’ta ise sert doğrulama ve rezervasyon mantığıyla çalışan; sipariş, teslimat, iptal ve iade etkilerini satır bazında merkezi stock truth’a yansıtan temel ticari kontrol sistemidir.
#####

---
REVİZYON NOTU — 2026-04-19
Durum: Kanonik override
Etkilediği bölüm(ler): Tedarikçi baz fiyat değişimi, fenomen fiyat değiştirme limiti, kupon/kampanya etkisi
Bağlı dosyalar: 1-havuz sistemi, 14-checkout sistemi, 35-kampanya sistemi, 46-kupon sistemi

Not:
Bu dosyada merkezi fiyat owner’ı ve fiyat koridoru mantığı korunur. Ancak aşağıdaki yeni yorum geçerlidir:

1. Tedarikçi baz fiyat değişiklikleri varsayılan olarak anlık zincirleme etki yaratmamalıdır.
2. Büyük ölçekli baz fiyat değişiklikleri planlanmış batch aktivasyon modeliyle veya kontrollü geçiş pencereleriyle yürütülmelidir.
3. Aktif sepet / checkout bağlamında kısa süreli price lock uygulanabilir.
4. Amaç, aynı anda çok sayıda checkout’un bozulmasını önlemektir.

Fenomen fiyat değişimi notu:
1. “Fenomen haftada en fazla 1 kez fiyat değiştirir” kuralı yukarı yönlü fiyat artışı için daha sıkı yorumlanabilir.
2. Aşağı yönlü, tüketici lehine ve koridor içi indirimlerde daha esnek model açılabilir.
3. Nihai sınır yine platformun minimum / önerilen / maksimum koridorudur.

Promosyon notu:
1. Kampanya ve kupon, merkezi fiyat sisteminin üstünde çalışan kontrollü rejimlerdir.
2. Effective payable price, kampanya + kupon + sponsor etkisi ile birlikte değerlendirilir.
3. Hiçbir promosyon modeli platformun tanımladığı nihai güvenli alt sınırları delmez.
---