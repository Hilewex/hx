# ARCHIVE_RETENTION_POLICY

Bu dosya, Aşama 4 kapsamında platformun archive, retention, soft delete ve immutable history politikasını tanımlar.

Amaç:
- hangi kayıtların fiziksel silinmemesi gerektiğini netleştirmek
- archive ile soft delete ayrımını sabitlemek
- ticari, operasyonel, finansal ve eligibility/meta kayıtlarda history-first yaklaşımı kurmak
- audit, dispute, support, finance ve operasyon tarafında denetlenebilir geçmişi korumak

Net kural:
- ticari truth kayıtları varsayılan olarak fiziksel silinmez
- finansal truth kayıtları varsayılan olarak fiziksel silinmez
- shipment/delivery history append-only veya archive-first tutulur
- eligibility/meta kayıtları content truth değildir ama history-first saklanır
- checkout price lock ve stock reservation kalıcı order/finance truth gibi saklanmaz; daha kısa sınıfta ama audit izli tutulur
- soft delete yalnız gerçekten uygun source veya yardımcı kayıtlarda kullanılmalıdır
- projection/cache archive politikası truth archive politikasıyla karıştırılmaz

---

## 1. TEMEL KAVRAMLAR

### 1.1 Soft delete
Kayıt aktif kullanım dışına alınır; ama fiziksel olarak hemen silinmez.

### 1.2 Archive
Kayıt aktif operasyondan çıkarılır; tarihsel ve denetim amaçlı korunur.

### 1.3 Immutable history
Kayıt veya kayıt geçmişi sonradan sessizce değiştirilmez; gerekiyorsa correction / adjustment / replacement mantığıyla ilerlenir.

### 1.4 Retention
Kaydın ne kadar süre hangi erişim düzeyiyle saklanacağını belirler.

### 1.5 Geçici işlem bağlamı
CheckoutPriceLock ve StockReservation gibi kayıtlar kalıcı order/finance truth değildir; yaşamı bitince operasyonel olarak kapanır. Ama gerektiğinde audit/history izi taşır.

Net kural:
Soft delete, archive, immutable history ve temporary lifecycle aynı şey değildir.

---

## 2. ILKE SETI

### 2.1 Truth-first saklama ilkesi
Aşağıdaki kayıtlar truth taşıdığı için “silme” değil “saklama” odaklı ele alınmalıdır:

- Payment
- PaymentAttempt
- Order
- OrderLine
- Shipment
- DeliveryEvent
- CancelRequest
- ReturnRequest
- ReturnItem
- RefundRecord
- SettlementLine
- SettlementAdjustment
- PayoutBatch
- PayoutBatchItem

### 2.2 Eligibility/meta history ilkesi
Aşağıdaki kayıtlar content truth değildir; ama teslimat, iade, trust ve puan etkisi için tarihsel iz taşır:

- VerifiedPurchaseEligibility
- ReviewEligibility
- StoryEligibility
- RewardEntitlementImpact

Bunlar da fiziksel silme değil, history-first yaklaşımla yönetilmelidir.

### 2.3 Temporary lifecycle ilkesi
Aşağıdaki kayıtlar kalıcı order/finance truth değildir:
- Checkout
- CheckoutPriceLock
- StockReservation

Bunlar expire/release/consume olabilir.
Ama audit ve incident/reconciliation ihtiyacı nedeniyle belirli süre history saklamalıdır.

### 2.4 Projection ayrı değerlendirilir
Tracking ekranı, order summary, verified badge görünümü, payout dashboard özeti, BFF response cache’i truth değildir.
Yeniden üretilebiliyorsa daha kısa retention ile yönetilebilir.

### 2.5 Sessiz overwrite yasağı
History taşıyan kayıtlarda:
- sessiz overwrite yapılmaz
- correction gerekiyorsa ayrı correction / adjustment / replacement kaydı üretilir
- eski kayıt archive veya immutable history içinde korunur

---

## 3. ENTITY SINIFLARINA GORE SAKLAMA POLITIKASI

---

## 3.1 Ticari truth kayıtları

### Kapsam
- Order
- OrderLine
- OrderAddressSnapshot
- OrderPricingSnapshot
- OrderCouponSnapshot
- OrderCampaignEffectSnapshot
- OrderStorefrontSnapshot

### Politika
- fiziksel silinmez
- aktif operasyon bittiğinde archive katmanına taşınabilir
- snapshot içerikleri immutable kabul edilir
- kullanıcı görünürlüğü azalsa bile tarihsel referans korunur

### Gerekçe
Order resmi ticari kayıttır; shipment, return, refund, settlement, payout ve eligibility zincirine veri taşır. Order oluştuğunda line items, address, price, coupon, campaign effect ve storefront bağlamı snapshot olarak sabitlenmelidir. 

### Önerilen yaklaşım
- aktif siparişler hot
- kapanmış siparişler warm/archive
- ama sorgulanabilir history korunur

---

## 3.2 Finansal truth kayıtları

### Kapsam
- Payment
- PaymentAttempt
- RefundRecord
- SettlementLine
- SettlementAdjustment
- PayoutBatch
- PayoutBatchItem

### Politika
- fiziksel silinmez
- archive-first yaklaşım kullanılır
- adjustment ve correction kayıtları eski satırları yok etmez
- refund, settlement ve payout geçmişi ayrı ayrı korunur

### Gerekçe
Payment tahsilat truth’udur; refund execution bunun alt alanıdır. Settlement line line-level finansal gerçektir. Payout batch icra katmanıdır. Aynı finansal etki duplicate veya overwrite biçimde kaybedilmemelidir. 

### Önerilen yaklaşım
- aktif inceleme / reconciliation kayıtları hot
- kapanmış dönemler archive
- dispute ve audit sorgularında erişilebilir history korunur

---

## 3.3 Operasyonel truth ve event history

### Kapsam
- Shipment
- DeliveryEvent

### Politika
- Shipment fiziksel truth olarak saklanır
- DeliveryEvent append-only history gibi tutulur
- event geçmişi sessizce ezilmez
- tracking projection ayrı değerlendirilir

### Gerekçe
Shipment fiziksel akıştır; order tracking bunun kullanıcıya sadeleştirilmiş görünümüdür. Delivery sonucu review/story eligibility, return window, reward lifecycle ve verified purchase görünürlüğünü etkileyebilir. Duplicate callback yanlış eligibility ve yanlış settlement etkisi doğurabilir; bu nedenle history korunmalıdır. 

### Önerilen yaklaşım
- aktif shipment’lar hot
- yakın geçmiş delivery event’leri warm
- eski event history archive
- ama support/dispute için geri çağrılabilir olmalı

---

## 3.4 Case / workflow kayıtları

### Kapsam
- CancelRequest
- ReturnRequest
- ReturnItem
- SupportTicket
- ModerationItem

### Politika
- vaka kapanınca fiziksel silinmez
- active operasyondan archive katmanına alınabilir
- state history ve audit izi korunur
- serbest yorum alanları ile ana vaka kaydı aynı retention sınıfında olmak zorunda değildir

### Gerekçe
Cancel/return sistemi order’ı silmez; order sonucu, refund, settlement ve ilişkili hakları değiştirir. Support/moderation content truth owner’ı olmasa da vaka history owner’ıdır. 

### Önerilen yaklaşım
- açık vakalar hot
- kapanmış vakalar archive
- escalation referansları korunur

---

## 3.5 Eligibility / meta kayıtları

### Kapsam
- VerifiedPurchaseEligibility
- ReviewEligibility
- StoryEligibility
- RewardEntitlementImpact

### Politika
- fiziksel silinmez
- history-first yaklaşım uygulanır
- state değişimleri (activate / consume / revoke) audit ile izlenir
- content truth ile aynı retention sınıfına zorunlu olarak bağlanmaz; ama order/delivery/return referansı kaybedilmez

### Gerekçe
Teslimat sonrası açılan haklar line-level çalışır. Kısmi teslimat, iade ve policy etkileri verified purchase, review/story hakkı ve reward etkisini değiştirebilir. Bu yüzden yalnız UI badge gibi düşünülüp kısa ömürlü tutulmamalıdır. 

### Önerilen yaklaşım
- aktif eligibility durumu hot/warm
- kapanmış/revoke olmuş history archive
- trust/dispute/puan geri alma incelemesi için geri okunabilir olmalı

---

## 3.6 Geçici checkout işlem bağlamı

### Kapsam
- Checkout
- CheckoutPriceLock
- StockReservation

### Politika
- kalıcı order/finance truth gibi saklanmaz
- yaşamı bittiğinde expire / release / consume / close olabilir
- buna rağmen kısa/orta süreli history ve audit izi korunur
- incident, duplicate charge, duplicate order, reservation leak ve reconciliation için erişilebilir tutulur

### Gerekçe
Checkout ready_for_payment handoff, payment transition ve stock reservation duplicate etkiler doğurabilir. Bu kayıtlar kalıcı ticari truth değildir ama sistem güvenliği ve hata incelemesi için kaybolmamalıdır. 

### Önerilen yaklaşım
- aktif checkout/lock/reservation hot
- kapanmışlar kısa-orta retention ile warm/archive
- projection/cache gibi anında silinmez; ama order ve payment kadar uzun tutulmaları şart değildir

---

## 3.7 Snapshot kayıtları

### Kapsam
- OrderAddressSnapshot
- OrderPricingSnapshot
- OrderCouponSnapshot
- OrderCampaignEffectSnapshot
- OrderStorefrontSnapshot
- settlement input snapshot
- sponsor attribution snapshot
- payout eligibility snapshot

### Politika
- immutable kabul edilir
- source-truth değişse de snapshot değişmez
- parent truth kaydıyla en az aynı retention düzeyinde korunur
- correction gerekiyorsa önceki referans kaybedilmez

### Gerekçe
Yol haritası özellikle address, price, coupon, campaign effect, store context, settlement/payout ve verified purchase/eligibility snapshot’larını kapatmayı ister. Finansal mutabakat ve sipariş sistemi bu tarihsel bağlamı zorunlu kılar. 

---

## 3.8 Projection / cache / birleşik okuma modelleri

### Kapsam
- order tracking projection
- user order summary
- payout dashboard summary
- BFF aggregate response cache
- verified badge UI projection
- sade notification summary projection’ları

### Politika
- yeniden üretilebiliyorsa kısa retention olabilir
- cache fiziksel history yerine geçmez
- projection bozulursa truth kayıttan yeniden üretilir
- archive zorunluluğu truth kadar katı değildir

### Gerekçe
Tracking ekranı shipment truth’unun kullanıcı diline çevrilmiş hali, verified badge UI ise eligibility meta kaydının görünümüdür; bunlar canonical truth değildir. 

---

## 4. SOFT DELETE KULLANILABILECEK ALANLAR

Soft delete varsayılan çözüm değildir. Daha çok şu türlerde düşünülebilir:

- address source-truth kayıtları
- taslak / geçici checkout yardımcı kayıtları
- projection/cached read modelleri
- geçici UI preference kayıtları
- geçici payout recipient taslak kayıtları

Net kural:
Order, payment, shipment, refund, settlement, payout ve eligibility history tarafında soft delete temel yöntem olmamalıdır.

---

## 5. HOT / WARM / ARCHIVE ERISIM KATI MANTIGI

### 5.1 Hot
Aktif operasyon, yakın tarihli sorgu ve kullanıcı görünürlüğü için hızlı erişim alanı.

Örnek:
- aktif order
- aktif shipment
- açık return/cancel vakası
- son dönem payment/refund
- aktif eligibility durumları
- current payout batch
- aktif checkout/lock/reservation

### 5.2 Warm
Yakın geçmiş ama daha az yazılan alan.

Örnek:
- kapanmış ama yakın tarihli order/return/shipment
- yeni tamamlanan settlement dönemleri
- son kapanan payout batch’leri
- yakın revoke edilmiş verified/review/story eligibility kayıtları
- son kapanmış checkout lock / reservation history

### 5.3 Archive
Aktif operasyondan düşmüş ama tarihsel, finansal, hukuki, denetim veya dispute ihtiyacı nedeniyle korunması gereken alan.

Örnek:
- eski order history
- eski payment attempt / refund / settlement / payout geçmişi
- delivery event history
- kapanmış case kayıtları
- eski eligibility/meta history

---

## 6. EVENT / AUDIT HISTORY POLITIKASI

### Event history
- append-only yaklaşım tercih edilir
- event silinerek history temizlenmez
- duplicate veya invalid event ayrı işaretlenebilir ama sessizce kaldırılmaz

### Audit history
- finance, moderation, payout, refund, shipment anomaly, eligibility revoke gibi kritik alanlarda zorunludur
- audit retention, bağlı truth retention’dan daha kısa olmamalıdır

### Eligibility audit
Aşağıdaki değişimler audit izi bırakmalıdır:
- verified purchase activate/revoke
- review eligibility activate/consume/revoke
- story eligibility activate/revoke
- reward entitlement doğumu / geri alımı

---

## 7. DÜZELTME / CORRECTION POLITIKASI

Yanlış yaklaşım:
- eski kaydı sessizce değiştirmek
- settlement line’ı overwrite etmek
- payout item history’yi ezmek
- eligibility revoke geçmişini silmek
- delivery event’i geçmişten kaldırmak

Doğru yaklaşım:
- correction record
- adjustment line
- replacement snapshot ref
- reversal + new record
- audit notu

Örnek:
- yanlış settlement payı bulunduysa SettlementAdjustment eklenir
- hatalı payout item yeniden işlenecekse retry/new batch mantığı kullanılır
- verified purchase yanlış açıldıysa eski kayıt sessizce silinmez; revoke/history izi bırakılır
- checkout reservation leak tespit edildiyse release/correction kaydı işlenir

---

## 8. RETENTION SEVIYELERI ICIN KARAR KURALI

Bu dosya kesin gün/ay/yıl değil, ilke sınıfı tanımlar.

### R1 — kısa süreli
Yeniden üretilebilir cache/projection/taslak kayıtlar

### R2 — kısa-orta süreli operasyonel
Checkout, CheckoutPriceLock, StockReservation gibi geçici işlem bağlamları

### R3 — uzun süreli ticari/operasyonel
Order history, shipment geçmişi, case history, eligibility/meta history

### R4 — çok uzun süreli / kritik finansal
Payment, RefundRecord, SettlementLine, SettlementAdjustment, PayoutBatch, PayoutBatchItem, kritik audit kayıtları

Net kural:
Payment / settlement / payout en üst retention sınıfına yakın ele alınmalıdır. Eligibility/meta history de UI cache gibi değil, uzun süreli ticari-operasyonel sınıfta değerlendirilmelidir. 

---

## 9. ENTITY BAZLI KARAR OZETI

### Fiziksel silinmemeli / archive-first
- Payment
- PaymentAttempt
- Order
- OrderLine
- Shipment
- DeliveryEvent
- RefundRecord
- SettlementLine
- SettlementAdjustment
- PayoutBatch
- PayoutBatchItem

### Kapanınca archive edilmeli, fiziksel silinmemeli
- CancelRequest
- ReturnRequest
- ReturnItem
- SupportTicket
- ModerationItem

### History-first tutulmalı
- VerifiedPurchaseEligibility
- ReviewEligibility
- StoryEligibility
- RewardEntitlementImpact

### Immutable snapshot olarak parent ile korunmalı
- OrderAddressSnapshot
- OrderPricingSnapshot
- OrderCouponSnapshot
- OrderCampaignEffectSnapshot
- OrderStorefrontSnapshot
- settlement input snapshot
- sponsor attribution snapshot
- payout eligibility snapshot

### Kısa/orta retention ile tutulmalı ama audit izi kaybolmamalı
- Checkout
- CheckoutPriceLock
- StockReservation

### Soft delete düşünülebilir
- source address kayıtları
- projection/cached view
- geçici UI yardımcı kayıtları

---

## 10. KISA OZET

Doğru archive/retention politikası şudur:

- order, payment, shipment, refund, settlement ve payout fiziksel silinmez
- case kayıtları kapanınca archive edilir, history korunur
- eligibility/meta kayıtları content truth olmasa da history-first tutulur
- order ve finance snapshot’ları immutable tutulur
- delivery event ve audit geçmişi append-only veya history-first saklanır
- checkout price lock ve stock reservation kalıcı ticari truth değildir; ama kısa/orta retention ve audit izi gerektirir
- projection ve cache kayıtları daha kısa retention ile yönetilebilir
- correction gerektiğinde overwrite değil adjustment/replacement mantığı kullanılır
- soft delete yalnız gerçekten uygun source ve yardımcı kayıtlarda kullanılır