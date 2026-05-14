FAZ-2 / BÖLÜM-5
System Interaction Map — v0.1

Bu bölümün amacı:

“Sistemler birbirleriyle nasıl konuşmalı?”

Çünkü büyük platformlarda en büyük problem:

her sistemin her sisteme bağlanması

olur.

Sonuç:

karmaşa
duplicate truth
hidden dependency
kırılgan yapı
debug edilemeyen sistem

Biz bunu engelliyoruz.

1. Ana kural

Her sistem herkesle direkt konuşmamalı.

Doğru yaklaşım:

owner systems
↓
controlled interaction
↓
events / protected commands / projections
2. Sistem konuşma türleri

Basitçe 4 tür ilişki var:

Tür	Anlam
Owner interaction	gerçek değişiklik
Command interaction	bir sistem başka sisteme iş ister
Event interaction	bilgi yayını
Read/projection interaction	sadece okuma
3. Commerce interaction haritası
Product ↔ Taxonomy

Doğru:

taxonomy category/attribute truth sağlar
product sistemi kullanır

Yanlış:

UI random kategori yaratır
Product ↔ Price

Doğru:

product ürünü tanımlar
pricing ticari fiyatı üretir

Yanlış:

product service kendi kafasına göre final sale price hesaplar
Product ↔ Stock

Doğru:

product variant kimliğini taşır
stock availability owner’dır

Yanlış:

her storefront ayrı stok sistemi tutar
Cart ↔ Checkout

Doğru:

cart ticari niyet taşır
checkout final validation yapar

Yanlış:

cart final commercial truth kabul edilir
Checkout ↔ Payment

Doğru:

checkout validated context üretir
payment ödeme sonucunu üretir

Yanlış:

payment ürün/fiyat doğrulaması yapmaya çalışır
Payment ↔ Order

Doğru:

payment success
→ order creation hakkı açar

Yanlış:

payment başlamasıyla order oluşturmak
4. Operations interaction haritası
Order ↔ Operations

Doğru:

order resmi kayıt üretir
operations fulfillment başlatır

Yanlış:

operations order truth mutate eder
Operations ↔ Shipment

Doğru:

operations package/shipment organize eder
delivery gerçek teslimat durumunu üretir
Delivery ↔ Eligibility systems

Doğru:

delivered event
→ review/story/reward eligibility

Yanlış:

order created
→ reward grant
5. Finance interaction haritası
Payment ↔ Settlement

Doğru:

payment para aldı bilgisini verir
settlement earnings split üretir

Yanlış:

payment service creator earnings hesaplar
Settlement ↔ Payout

Doğru:

settled earnings
→ payout eligibility

Yanlış:

payment success
→ direct payout
Return ↔ Refund

Doğru:

return approved
→ refund processing
→ settlement correction

Yanlış:

refund tek başına return lifecycle kapatır
Coupon ↔ Settlement

Doğru:

coupon sponsor logic
→ settlement distribution etkiler

Yanlış:

discount var ama sponsor bilinmiyor
6. Social interaction haritası
Creator Store ↔ Product

Doğru:

store product’u bağlam içinde gösterir

Yanlış:

creator product truth mutate eder
Story ↔ Product

Doğru:

story product tag taşıyabilir

Ama:

story product truth değildir
Review ↔ Delivery

Doğru:

delivery eligibility açar
review sistemi contribution üretir

Yanlış:

login olan herkes review yazabilir
Interaction ↔ Recommendation

Doğru:

interaction signals recommendation’a gider

Yanlış:

raw likes = ranking directly
7. Discovery interaction haritası
Search ↔ Product

Doğru:

search projection/index tutar
product owner’dır
Recommendation ↔ Analytics

Doğru:

analytics normalized signals üretir
recommendation kullanır

Yanlış:

recommendation raw DB click count okur
Recommendation ↔ Risk

Doğru:

risk suspicious content/store filtering sağlar

Yanlış:

fraud signals ignored
8. Moderation interaction haritası
Moderation ↔ Discovery

Doğru:

hidden content
→ search/recommendation removal
Moderation ↔ Social

Doğru:

story/review/post moderation

Ama:

moderation commerce owner değildir
Risk ↔ Finance

Doğru:

risk payout/reward freeze isteyebilir

Ama:

risk settlement owner değildir
9. Admin interaction haritası
Admin ↔ Owner systems

Doğru:

admin protected command gönderir
owner system değişiklik yapar
audit oluşur

Yanlış:

admin panel DB’ye direkt yazar
Dashboard ↔ Systems

Doğru:

dashboard projection/read layer

Yanlış:

dashboard state owner gibi davranır
10. Media interaction haritası
Media ↔ Product

Doğru:

product official media kullanır
Media ↔ Story/Post

Doğru:

creator/user media context taşıyabilir

Ama:

creator media official product truth değildir
Media ↔ Recommendation

Doğru:

video completion/signals
→ recommendation inputs
11. Sistem bağımlılık kuralı

Tehlikeli durum:

A sistemi
→ B sistemi
→ C sistemi
→ D sistemi
→ tekrar A

Bu:

circular dependency

riski üretir.

Repo audit’te özellikle bakacağız.

12. Sync vs async kuralı
Sync uygun alanlar
checkout validation
payment authorization
permission checks
Async uygun alanlar
analytics
search indexing
notifications
recommendation refresh
media processing
13. Dangerous coupling örnekleri

Repo audit’te kırmızı bayrak:

payment service directly editing stock
search service calculating prices
analytics mutating commerce state
creator panel touching settlement tables
moderation deleting order truth
14. Interaction özet modeli
Owner systems
↓
Protected commands
↓
State changes
↓
Events
↓
Projection/index/recommendation updates
15. Repo audit’te nasıl kullanılacak?

Şunlara bakacağız:

hangi servis kimin DB’sine yazıyor?
kim owner bypass yapıyor?
hangi sistem gereğinden fazla bağlı?
hangi projection owner olmuş?
hangi async iş sync yapılmış?
hangi domain başka domain’in işini yapıyor?
16. FAZ-2 Bölüm-5 sonucu

Bu çıktı oluştu:

SYSTEM_INTERACTION_MAP_v0.1