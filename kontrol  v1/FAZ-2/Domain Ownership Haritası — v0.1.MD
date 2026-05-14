FAZ-2 / BÖLÜM-1
Domain Ownership Haritası — v0.1

Bu bölümün amacı basit:

“Bu platformda hangi alanın gerçek sahibi kim?”

Bunu bilirsek repo’ya baktığımızda yanlışları çok hızlı yakalarız.

1. Ana kural

Sistemde herkes her şeye dokunamaz.

Temel kural şu:

Bir verinin gerçek sahibi kimse, onu sadece o sistem değiştirebilir.
Diğerleri sadece görebilir, istek gönderebilir veya sonuç bekler.

Kural/yetki dosyasında bu net: owner dışı write yok, BFF read-only, panel direct write yok, UI sadece render katmanı.

2. Ana domain haritası
D1 — Kimlik / Yetki

Sahibi: Auth + Rule/Permission sistemi

Sahip olduğu gerçekler:

kim giriş yaptı
kim hangi rolde
kim hangi aksiyonu yapabilir
hangi işlem için login gerekir
hangi işlem için ek eligibility gerekir

Kim dokunamaz:

UI kendi başına yetki kararı veremez
panel rolü aşamaz
BFF karar veremez
D2 — Ürün / Havuz

Sahibi: Platform ürün/havuz sistemi

Sahip olduğu gerçekler:

ürün kabul edildi mi
ürün 1. havuzda mı
ürün 2. havuzda mı
ürün onaylı mı
ürün fenomenlere açılabilir mi
ürün ana bilgisi nedir

Tedarikçi ürün verisi sağlar ama ticari otorite değildir. Fenomen ürünü sadece onaylı havuzdan seçebilir.

Kim dokunamaz:

fenomen ürün ana gerçeğini değiştiremez
tedarikçi kendi ürününü satışa açamaz
panel doğrudan ürün truth’unu bypass edemez
D3 — Fiyat

Sahibi: Merkezi fiyat sistemi

Sahip olduğu gerçekler:

baz fiyat
platform kârı
havuz taban fiyatı
minimum fiyat
önerilen fiyat
maksimum fiyat
kampanya/lansman fiyat rejimi

Baz fiyat tedarikçiden gelir ama satış fiyatını platform kurar. Fenomen sadece platformun açtığı fiyat koridorunda seçim yapabilir.

Kim dokunamaz:

tedarikçi satış fiyatı belirleyemez
fenomen bağımsız fiyat motoru olamaz
UI fiyat hesaplayamaz
D4 — Stok

Sahibi: Merkezi stok sistemi

Sahip olduğu gerçekler:

satılabilir adet
varyant bazlı stok
rezervasyon
stok tüketimi
iptal/iade sonrası stok etkisi

Kim dokunamaz:

fenomen stok oluşturamaz
mağaza bazlı ayrı stok truth’u olmamalı
sepet stok garantisi gibi davranmamalı
D5 — Sepet / Checkout

Sahibi: Commerce checkout sistemi

Sahip olduğu gerçekler:

sepet niyeti
checkout doğrulaması
adres doğrulaması
fiyat/stok/varyant final kontrolü
ödeme öncesi geçerli sipariş hazırlığı

Kural:

sepet final truth değildir
checkout final doğrulama noktasıdır
D6 — Ödeme

Sahibi: Payment sistemi

Sahip olduğu gerçekler:

ödeme başlatıldı mı
ödeme başarılı mı
ödeme başarısız mı
payment idempotency
provider sonucu

Kural:

ödeme = para alındı mı?

Ama ödeme sistemi hakediş dağıtmaz.

D7 — Sipariş

Sahibi: Order sistemi

Sahip olduğu gerçekler:

resmi sipariş kaydı
sipariş satırları
fiyat snapshot
adres snapshot
ürün/varyant snapshot
mağaza bağlamı

Kural:

sipariş yalnız başarılı ödeme sonrası oluşur
D8 — Sipariş Operasyon / Teslimat

Sahibi: Operations + Delivery sistemi

Sahip olduğu gerçekler:

hazırlama
paketleme
shipment
kargo statüsü
teslim edildi bilgisi
teslimat problemi

Kim dokunamaz:

fenomen sipariş operasyonu yönetemez
tedarikçi sadece kendine düşen hazırlama/sevkiyat girdisini verir
kullanıcı iç operasyon statüsünü değiştiremez
D9 — İptal / İade

Sahibi: Return/Cancel sistemi

Sahip olduğu gerçekler:

iptal talebi
iade talebi
iade onayı
ürün geri geldi mi
refund uygunluğu
satır bazlı iade etkisi

Kural:

iptal teslimat öncesi
iade teslimat sonrası
D10 — Finansal Mutabakat / Hakediş

Sahibi: Finance / Settlement sistemi

Sahip olduğu gerçekler:

kim ne kadar hak etti
fenomen hakedişi
tedarikçi hakedişi
platform payı
kupon sponsor etkisi
bekleyen tutar
kesinleşmiş tutar
blokeli tutar
iade/iptal düzeltmesi

Ödeme ile mutabakat aynı şey değildir; ödeme “para alındı mı”, mutabakat “alınan para nasıl dağıtılacak” sorusunu cevaplar.

D11 — Payout / Ödeme Çıkışı

Sahibi: Payout sistemi

Sahip olduğu gerçekler:

ödenebilir bakiye
ödeme batch’i
ödeme emri
başarılı payout
başarısız payout
risk blokesi
retry

Payout, mutabakat sistemiyle aynı şey değildir; mutabakat hesaplar, payout gerçek ödeme çıkışını yürütür.

D12 — Kupon / Kampanya

Sahibi: Platform ticari kontrol + kupon sistemi

Sahip olduğu gerçekler:

kupon geçerli mi
indirimi kim taşıyor
kampanya aktif mi
kupon sponsor modeli nedir
kuponun sipariş finansına etkisi nedir

Kritik kural:

indirim yapılmadan önce indirimi kimin taşıdığı bilinmeli
D13 — Ödül Puanı / Puan Market

Sahibi: Reward sistemi

Sahip olduğu gerçekler:

pending puan
kesinleşmiş puan
spendable puan
harcanmış puan
geri alınmış puan
puan market kullanımı

Kim dokunamaz:

yorum/story sistemi doğrudan spendable puan yazmamalı
UI puan üretmemeli
admin audit dışı puan düzeltmemeli
D14 — Fenomen Mağaza / Creator Storefront

Sahibi: Creator storefront sistemi

Sahip olduğu gerçekler:

mağaza kimliği
mağaza seçkisi
mağaza vitrini
ürün sıralaması
mağaza içi medya
post/story yayınları

Ama fenomen mağaza:

stok sahibi değildir
sipariş sahibi değildir
ödeme sahibi değildir
ürün ana truth sahibi değildir
D15 — Tedarikçi

Sahibi: Supplier management sistemi

Sahip olduğu gerçekler:

tedarikçi başvurusu
tedarikçi statüsü
kategori yetkisi
yükleme hakkı
kalite/operasyon durumu
askı/kısıt

Tedarikçi ürün kaynağıdır ama ticari otorite değildir; satış fiyatını belirleyemez ve kritik kararlar audit üretmelidir.

D16 — Moderasyon

Sahibi: Moderation sistemi

Sahip olduğu gerçekler:

içerik onaylandı mı
içerik gizlendi mi
içerik kaldırıldı mı
şikayet durumu
silme talebi
görünürlük kısıtı

Moderasyonun nihai otoritesi platformdur; kullanıcı ve fenomen içerik üretir ama moderasyon otoritesi değildir.

D17 — Fraud / Risk

Sahibi: Risk sistemi

Sahip olduğu gerçekler:

şüpheli davranış
risk skoru
kupon abuse
puan abuse
fake engagement
payout blokesi
account abuse

Risk sistemi ceza makinesi değil, erken uyarı ve koruma katmanıdır.

D18 — Arama / Öneri / Analitik

Sahipler:

Arama retrieval → Search/Index sistemi
Sıralama → Recommendation sistemi
Ölçüm → Analytics sistemi
Taksonomi → Taxonomy sistemi

Analitik tek başına karar vermez; karar sistemlerine sinyal üretir. Event’lerde user/session/surface/object gibi bağlamlar yoksa veri karar üretemez.

D19 — Admin

Sahibi: Admin governance sistemi

Admin:

görür
karar başlatır
onaylar
reddeder
kısıtlar
askıya alır

Ama:

truth’u keyfi değiştirmez
owner bypass yapmaz
audit dışı işlem yapmaz

Admin sisteminde permission, audit log ve karar geçmişi zorunludur.

3. Basit özet

Bu haritanın ana fikri şu:

Tedarikçi ürün verir.
Platform ticari kararı verir.
Fenomen vitrin kurar.
Kullanıcı satın alır.
Payment para alır.
Order resmi kayıt üretir.
Operations teslim eder.
Finance hakedişi hesaplar.
Payout ödeme çıkarır.
Moderation güveni korur.
Risk kötüye kullanımı yakalar.
Admin denetler ama bypass yapmaz.
4. Repo’ya bakınca ne arayacağız?

Bu harita sayesinde repo’da şunları arayacağız:

Yanlış kişi yanlış veriye yazıyor mu?
Aynı gerçek iki yerde tutuluyor mu?
Panel doğrudan DB değiştiriyor mu?
BFF karar veriyor mu?
Fiyat UI’da mı hesaplanıyor?
Stok mağaza bazlı mı tutuluyor?
Hakediş ödeme sistemi içinde mi karışmış?
Payout risk kontrolü olmadan mı çalışıyor?
Moderasyon gizlediği içerik aramada çıkıyor mu?
5. FAZ-2 Bölüm-1 sonucu

İlk çıktı oluştu:

DOMAIN_OWNERSHIP_MAP_v0.1