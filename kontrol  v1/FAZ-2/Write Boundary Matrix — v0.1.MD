FAZ-2 / BÖLÜM-2
Write Boundary Matrix — v0.1

Bu bölümün amacı basit:

“Kim hangi veriyi değiştirebilir, kim sadece görebilir, kim kesinlikle dokunamaz?”

1. Ana kural
Bir veriyi sadece gerçek sahibi değiştirebilir.
Diğerleri ya okur ya da istek gönderir.

Yani:

UI karar vermez.
BFF write yapmaz.
Panel doğrudan DB yazmaz.
Event consumer owner gibi davranmaz.
2. Basit write boundary tablosu
Alan	Yazabilir	Sadece okuyabilir / istek gönderebilir	Asla yapamaz
Kullanıcı hesabı	Auth/User sistemi	UI, BFF, Admin	başka domain direkt değiştiremez
Rol / yetki	Rule/Permission sistemi	Admin panel komut gönderir	UI/BFF karar veremez
Ürün ana bilgisi	Product/Pool sistemi	Supplier veri girer, Creator okur	Creator ana ürünü değiştiremez
Ürün onayı	Platform/Admin protected command	Supplier bekler	Supplier kendi ürününü onaylayamaz
Kategori/taksonomi	Taxonomy sistemi	Product/PLP/Search kullanır	UI serbest kategori üretemez
Varyant	Product/Variant sistemi	Supplier veri sağlar	Cart/Checkout varyant yaratamaz
Stok	Central Stock sistemi	Supplier stok input verir	Creator stok yazamaz
Satış fiyatı	Pricing sistemi	Supplier baz fiyat verir, Creator koridorda seçer	Supplier final fiyat yazamaz
Sepet	Cart sistemi	User aksiyon verir	Pricing/Stock truth değiştiremez
Checkout	Checkout sistemi	Cart’tan veri alır	UI final validasyon yapamaz
Ödeme	Payment sistemi	Checkout ödeme başlatır	Order/payment sonucu uyduramaz
Sipariş	Order sistemi	Payment success tetikler	User/Admin direkt order yaratmamalı
Shipment	Operation/Delivery sistemi	Supplier sevkiyat bilgisi girer	Creator shipment yönetemez
Teslimat	Delivery sistemi	Carrier/Supplier input verebilir	User delivered set edemez
İade	Return sistemi	User talep açar	Payment tek başına iade kapatamaz
Refund	Finance/Refund sistemi	Return sonucu tetikler	Support doğrudan para iadesi yapamaz
Settlement	Settlement sistemi	Order/Payment/Return event sağlar	Payment hakediş hesaplamaz
Payout	Payout sistemi	Finance admin kontrollü başlatır	Creator/Supplier payout çalıştıramaz
Kupon	Coupon sistemi	Creator izinli kupon talep/oluşturabilir	UI indirim hesaplayamaz
Reward point	Reward sistemi	Review/Story event sağlar	Review sistemi spendable puan yazamaz
Creator store	Storefront sistemi	Creator kendi scope’unda yönetir	Creator product/stock/payment truth değiştiremez
Supplier status	Supplier management	Supplier başvuru/veri verir	Supplier kendi statüsünü değiştiremez
Review	Review sistemi	User eligible ise yazar	Guest yorum yazamaz
User story	Story sistemi	User eligible ise yükler	Delivery öncesi story açılamaz
Moderation visibility	Moderation sistemi	User/Creator içerik üretir	Creator moderation bypass yapamaz
Risk score	Fraud/Risk sistemi	Analytics sinyal verir	UI/Routing risk skoru uyduramaz
Search index	Search/Index sistemi	Product/Store/Taxonomy event sağlar	Search truth owner olamaz
Ranking	Recommendation sistemi	Analytics/Social sinyal verir	Admin sınırsız ranking rewrite yapamaz
Analytics event	Analytics sistemi	Tüm yüzeyler event gönderir	Analytics commerce truth değiştiremez
Media asset	Media sistemi	User/Creator/Supplier upload eder	Raw upload direkt yayınlanamaz
Admin action	Admin governance	Admin protected action başlatır	Audit’siz kritik işlem yapılamaz
3. En önemli yasaklar

Bunlar repo audit’te direkt kırmızı bayrak olacak:

Creator stok yazıyorsa → DANGEROUS
Supplier satış fiyatı yazıyorsa → BROKEN
UI fiyat hesaplıyorsa → HIGH RISK
BFF state mutate ediyorsa → HIGH RISK
Panel DB’ye direkt yazıyorsa → DANGEROUS
Payment order yaratmadan önce order oluşuyorsa → P0
Review delivered olmadan açılıyorsa → HIGH RISK
Reward anında spendable oluyorsa → HIGH RISK
Payout settlement olmadan çalışıyorsa → P0
Hidden content search/recommendation’da çıkıyorsa → HIGH RISK
4. Doğru iletişim modeli

Sistemler birbirinin verisini değiştirmez.

Doğru model:

İstek gönderir
Owner doğrular
Owner değiştirir
Event yayınlar
Diğerleri okur/projection günceller

Örnek:

Creator ürün fiyatı seçmek ister
→ Pricing sistemi koridoru kontrol eder
→ uygunsa store price selection güncellenir
→ event yayınlanır

Yanlış model:

Creator panel doğrudan product_price tablosunu değiştirir
5. Panel kuralı

Panel sadece ekran değildir ama truth owner da değildir.

Doğru:

Panel → protected command → owner system → audit log → state change

Yanlış:

Panel → DB direct update

Admin güçlüdür ama sınırsız değildir.

6. BFF kuralı

BFF sadece toparlar ve sunar.

Doğru:

BFF → read aggregation

Yanlış:

BFF → stock decrement
BFF → payment success set
BFF → reward grant
7. Event kuralı

Event bilgi taşır, ama rastgele state değiştirmez.

Doğru:

PaymentSucceeded event
→ Order system idempotent command ile order oluşturur

Yanlış:

Her consumer kendi order/payment/settlement state’ini kafasına göre günceller
8. Snapshot kuralı

Bazı bilgiler işlem anında kopyalanıp sabitlenir.

Özellikle:

order price snapshot
order address snapshot
order variant snapshot
order store context snapshot
settlement snapshot
coupon snapshot

Bu alanlar sonradan canlı ürün/fiyat/adres değişti diye bozulmamalı.

9. Repo audit’te nasıl kullanılacak?

Repo’ya bakınca her dosya/sistem için soracağız:

Bu kod hangi truth’a yazıyor?
Bu truth’un owner’ı bu mu?
Yoksa illegal write mı?
Bu sadece projection mı?
Bu snapshot mı, canlı truth mu?
Bu event state’i doğru yerden mi değiştiriyor?
10. FAZ-2 Bölüm-2 sonucu

Bu çıktı oluştu:

WRITE_BOUNDARY_MATRIX_v0.1