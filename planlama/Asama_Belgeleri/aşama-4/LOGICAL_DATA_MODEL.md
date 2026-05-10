# LOGICAL_DATA_MODEL

Bu dosya, Aşama 4 kapsamında platformun çekirdek ticari zinciri için mantıksal veri modelini tanımlar.

Amaç:
- canonical entity’ler arasındaki ilişkiyi netleştirmek
- aggregate root ile line-level entity ayrımını sabitlemek
- owner alanlarını karıştırmadan reference model kurmak
- snapshot, case, ledger ve eligibility yapılarının truth entity’lerle ilişkisini tanımlamak
- `SNAPSHOT_POLICY.md` ve `ARCHIVE_RETENTION_POLICY.md` için sağlam temel oluşturmak

Net kural:
- UI truth üretmez
- BFF truth owner değildir
- panel direct write yapmaz
- projection entity truth entity yerine geçmez
- line-level truth aggregate altında ezilmez
- finansal truth, ticari truth ve trust/eligibility meta truth’u birbirine karıştırılmaz

---

## 1. KAPSAM

Bu sürüm şu çekirdek zinciri kapsar:

- Checkout
- CheckoutPriceLock
- StockReservation
- Payment
- PaymentAttempt
- Order
- OrderLine
- OrderAddressSnapshot
- OrderPricingSnapshot
- OrderCouponSnapshot
- OrderCampaignEffectSnapshot
- OrderStorefrontSnapshot
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
- VerifiedPurchaseEligibility
- ReviewEligibility
- StoryEligibility
- RewardEntitlementImpact

Bu turda tam veri modeli açılmayan ama referans verilen source-truth alanları:
- Address source truth
- Central Price source truth
- Coupon source truth
- Campaign source truth
- Central Stock source truth
- Review content truth
- Story content truth
- Reward ledger truth

---

## 2. TASARIM ILKELERI

### 2.1 Aggregate root ilkesi
Aşağıdaki entity’ler aggregate root olarak düşünülmelidir:

- Checkout
- CheckoutPriceLock
- StockReservation
- Payment
- Order
- Shipment
- CancelRequest
- ReturnRequest
- SettlementLine
- PayoutBatch
- VerifiedPurchaseEligibility
- ReviewEligibility
- StoryEligibility

### 2.2 Line-level first-class ilkesi
Aşağıdaki alanlarda line/item düzeyi zorunlu olarak first-class tutulmalıdır:

- Order ↔ OrderLine
- ReturnRequest ↔ ReturnItem
- SettlementLine ↔ OrderLine
- PayoutBatch ↔ PayoutBatchItem
- Eligibility ↔ OrderLine

### 2.3 Snapshot ilkesi
Snapshot entity source-truth’un yerine geçmez.
Ama işlem anındaki tarihsel ticari/finansal bağlamı dondurur.

### 2.4 Eligibility ilkesi
Verified purchase, review hakkı, story hakkı ve reward etkisi:
- content truth değildir
- order truth değildir
- delivery / return / policy sonucu değişen meta kayıttır

### 2.5 Event ve audit ilkesi
Event, state mutation yerine geçmez.
Truth owner yazdıktan sonra event üretilir.
Audit kritik finansal, lojistik ve yönetsel alanlarda zorunludur.

---

## 3. ANA AGGREGATE VE ENTITY ILISKILERI

---

## 3.1 Checkout aggregate

### Ana entity
- Checkout

### İlişkiler
- Checkout `1 → 0..N` CheckoutPriceLock
- Checkout `1 → 0..N` StockReservation
- Checkout `1 → 0..N` Payment

### Açıklama
Checkout, sepetten gelen ticari niyeti doğrulayan aggregate’tır.
Payment doğrudan sepetten değil, checkout tarafından doğrulanmış bağlamdan beslenir.

### Ana referanslar
- cart_reference
- user_id veya guest_context_id
- address source ref
- selected line items
- coupon ref / campaign ref
- storefront context ref
- validated price summary

### Kardinalite kararı
- bir checkout’tan birden fazla payment denemesi çıkabilir
- bir checkout bağlamında birden fazla price lock oluşabilir ama aynı anda tek aktif kilit mantığı tercih edilmelidir
- bir checkout için birden fazla stock reservation kaydı oluşabilir; bunlar line-level veya grouped tutulabilir
- aynı checkout’tan duplicate order üretimi idempotent engellenmelidir

---

## 3.2 CheckoutPriceLock aggregate

### Ana entity
- CheckoutPriceLock

### İlişkiler
- CheckoutPriceLock `N → 1` Checkout
- CheckoutPriceLock `N → 0..1` Central Price version/context ref
- CheckoutPriceLock `N → 0..N` locked line context

### Açıklama
CheckoutPriceLock, aktif checkout bağlamında kısa ömürlü fiyat koruma etkisidir.
Order pricing snapshot değildir.

### Kardinalite kararı
- bir checkout için zaman içinde çoklu lock oluşabilir
- aynı anda tek aktif lock tercih edilmelidir
- expire/release/consume ile yaşam tamamlanmalıdır
- order create sonrası lock history referansı tutulabilir ama order snapshot’ın yerine geçmez

---

## 3.3 StockReservation aggregate

### Ana entity
- StockReservation

### İlişkiler
- StockReservation `N → 1` Checkout
- StockReservation `N → 0..1` Order
- StockReservation `N → 1` product/variant source ref
- StockReservation `N → 0..1` fulfillment or stock location ref

### Açıklama
StockReservation merkezi stok truth üzerindeki geçici ayırma etkisidir.
Stok quantity truth’unun kendisi değildir.

### Kardinalite kararı
- line bazlı rezervasyon desteklenmelidir
- created / active / released / consumed / expired yaşamı taşımalıdır
- order create ile consume ilişkisi kurulabilmelidir
- checkout kapanırsa veya expire olursa reservation release edilmelidir

---

## 3.4 Payment aggregate

### Ana entity
- Payment

### Çocuk entity
- PaymentAttempt

### İlişkiler
- Payment `N → 1` Checkout
- Payment `1 → N` PaymentAttempt
- Payment `1 → 0..N` RefundRecord
- Payment `1 → 0..1` successful order create outcome ref

### Açıklama
Payment aggregate finansal tahsilat truth’udur.
Payment success, order create hakkı doğurur; order’ın kendisi değildir.

### Kardinalite kararı
- bir checkout için birden fazla payment olabilir
- bir payment içinde birden fazla attempt olabilir
- bir payment için çoklu kısmi/tam refund kaydı olabilir
- tek başarılı capture’dan order create en fazla bir kez çalışmalıdır

---

## 3.5 PaymentAttempt child modeli

### Ana entity
- PaymentAttempt

### İlişkiler
- PaymentAttempt `N → 1` Payment

### Açıklama
PaymentAttempt, provider bazlı tekil yürütme kaydıdır.

### Kardinalite kararı
- retry first-class olmalıdır
- idempotency key ve provider ref birlikte izlenmelidir
- eski attempt’ler overwrite edilmez, history korunur

---

## 3.6 Order aggregate

### Ana entity
- Order

### Çocuk entity’ler
- OrderLine
- OrderAddressSnapshot
- OrderPricingSnapshot
- OrderCouponSnapshot
- OrderCampaignEffectSnapshot
- OrderStorefrontSnapshot

### İlişkiler
- Order `N → 1` Checkout
- Order `N → 1` Payment
- Order `1 → N` OrderLine
- Order `1 → 1` OrderAddressSnapshot
- Order `1 → 1` OrderPricingSnapshot
- Order `1 → 0..1` OrderCouponSnapshot
- Order `1 → 0..1` OrderCampaignEffectSnapshot
- Order `1 → 1` OrderStorefrontSnapshot
- Order `1 → N` Shipment
- Order `1 → N` CancelRequest
- Order `1 → N` ReturnRequest
- Order `1 → N` SettlementLine
- Order `1 → N` VerifiedPurchaseEligibility
- Order `1 → N` ReviewEligibility
- Order `1 → N` StoryEligibility
- Order `1 → N` RewardEntitlementImpact

### Açıklama
Order resmi ticari kayıttır.
Payment sonrası oluşur.
Adres, fiyat, kupon, kampanya ve mağaza bağlamı burada snapshot olarak sabitlenir.

### Kardinalite kararı
- order düzeyi state, line-level yaşamı ezmemelidir
- kısmi teslimat / kısmi iptal / kısmi iade / kısmi refund desteklenmelidir
- snapshot’lar order ile aynı retention ailesinde tutulmalıdır

---

## 3.7 OrderLine child modeli

### Ana entity
- OrderLine

### İlişkiler
- OrderLine `N → 1` Order
- OrderLine `1 → 0..N` Shipment
- OrderLine `1 → 0..N` ReturnItem
- OrderLine `1 → 0..N` SettlementLine
- OrderLine `1 → 0..N` VerifiedPurchaseEligibility
- OrderLine `1 → 0..N` ReviewEligibility
- OrderLine `1 → 0..N` StoryEligibility
- OrderLine `1 → 0..N` RewardEntitlementImpact

### Açıklama
OrderLine, satır bazlı ticari truth’tur.
Teslimat, iade, yorum hakkı, story hakkı ve finansal parçalanma satır düzeyinde taşınmalıdır.

### Kardinalite kararı
- review/story/verified purchase order değil order_line düzeyinde çalışmalıdır
- kısmi iade ve kısmi shipment line-level kurulmalıdır
- settlement line order total değil order_line temelli kurulmalıdır

---

## 3.8 Order snapshot modeli

### Snapshot entity’ler
- OrderAddressSnapshot
- OrderPricingSnapshot
- OrderCouponSnapshot
- OrderCampaignEffectSnapshot
- OrderStorefrontSnapshot

### İlişkiler
- her biri `N → 1` Order

### Açıklama
Bu snapshot’lar source-truth’u kopyalamak için değil, order anındaki işlem bağlamını korumak içindir.

### Kardinalite kararı
- address/pricing/storefront snapshot her order için tekil tutulmalıdır
- coupon/campaign snapshot opsiyonel olabilir ama orderda etkisi varsa first-class tutulmalıdır
- snapshot içerikleri immutable kabul edilmelidir

---

## 3.9 Shipment aggregate

### Ana entity
- Shipment

### Çocuk entity
- DeliveryEvent

### İlişkiler
- Shipment `N → 1` Order
- Shipment `1 → N` DeliveryEvent

### Açıklama
Shipment fiziksel akıştır; order ticari truth’tur.
Shipment state ile order state birebir değildir.

### Kardinalite kararı
- bir order için birden fazla shipment olabilir
- shipment item/line allocation ileri fazda açılabilir
- eligibility üretimi için delivered etkisi line-level değerlendirmeye açılmalıdır

---

## 3.10 DeliveryEvent history modeli

### Ana entity
- DeliveryEvent

### İlişkiler
- DeliveryEvent `N → 1` Shipment
- DeliveryEvent `N → 0..N` VerifiedPurchaseEligibility activation ref
- DeliveryEvent `N → 0..N` ReviewEligibility activation ref
- DeliveryEvent `N → 0..N` StoryEligibility activation ref

### Açıklama
DeliveryEvent append-only history kaydıdır.
Tracking projection değildir.

### Kardinalite kararı
- event overwrite edilmez
- delivered/returned/failed-to-deliver gibi normalized status history şeklinde kalmalıdır
- trust/eligibility katmanı event referansı taşıyabilir

---

## 3.11 Cancel aggregate

### Ana entity
- CancelRequest

### İlişkiler
- CancelRequest `N → 1` Order
- CancelRequest `N → 0..1` OrderLine
- CancelRequest `1 → 0..N` RefundRecord

### Açıklama
Cancel teslimat öncesi eksendir.
Order’ı silmez; line/order sonucu üzerinde etki üretir.
Refund ihtiyacı doğurabilir ama refund yürütmesi payment alanındadır.

### Kardinalite kararı
- order-level ve line-level cancel desteklenmelidir
- duplicate cancel create aynı satır/pencere için engellenmelidir

---

## 3.12 Return aggregate

### Ana entity
- ReturnRequest

### Çocuk entity
- ReturnItem

### İlişkiler
- ReturnRequest `N → 1` Order
- ReturnRequest `1 → N` ReturnItem
- ReturnItem `N → 1` OrderLine
- ReturnRequest `1 → 0..N` RefundRecord
- ReturnRequest `1 → 0..N` VerifiedPurchaseEligibility revocation ref
- ReturnRequest `1 → 0..N` ReviewEligibility impact ref
- ReturnRequest `1 → 0..N` StoryEligibility impact ref
- ReturnRequest `1 → 0..N` RewardEntitlementImpact

### Açıklama
Return teslimat sonrası eksendir.
Return accepted olması refund completed anlamına gelmez.
Ayrıca trust ve reward etkisini de değiştirebilir.

### Kardinalite kararı
- bir order için çoklu return request olabilir
- bir return request çoklu line kapsayabilir
- aynı line zaman içinde birden fazla return vakasına konu olabilir; duplicate pencereleri kontrol edilmelidir

---

## 3.13 Refund financial-support modeli

### Ana entity
- RefundRecord

### İlişkiler
- RefundRecord `N → 1` Payment
- RefundRecord `N → 0..1` CancelRequest
- RefundRecord `N → 0..1` ReturnRequest
- RefundRecord `N → 0..1` Order
- RefundRecord `N → 0..1` OrderLine
- RefundRecord `N → 0..N` SettlementAdjustment

### Açıklama
RefundRecord, cancel/return kararının finansal yürütme kaydıdır.

### Kardinalite kararı
- bir payment için çoklu refund olabilir
- refund order-level veya line-level bağ taşıyabilmelidir
- duplicate refund execution engellenmelidir

---

## 3.14 Settlement aggregate modeli

### Ana entity
- SettlementLine

### Çocuk / ilişkili entity
- SettlementAdjustment

### İlişkiler
- SettlementLine `N → 1` Order
- SettlementLine `N → 1` OrderLine
- SettlementLine `N → 0..1` Payment
- SettlementLine `N → 0..1` RefundRecord
- SettlementLine `N → 0..1` OrderPricingSnapshot
- SettlementLine `N → 0..1` OrderCouponSnapshot
- SettlementLine `N → 0..1` OrderCampaignEffectSnapshot
- SettlementLine `1 → 0..N` SettlementAdjustment
- SettlementLine `1 → 0..N` PayoutBatchItem

### Açıklama
SettlementLine, line-level finansal truth’tur.
Payment değildir.
Order snapshot ve finansal etki snapshot’larından beslenir.

### Kardinalite kararı
- settlement line order başına tek satır mantığıyla kurulamaz
- pending / blocked / payable / settled ayrımları line-level taşınmalıdır
- refund sonrası sessiz overwrite değil adjustment mantığı kullanılmalıdır

---

## 3.15 SettlementAdjustment modeli

### Ana entity
- SettlementAdjustment

### İlişkiler
- SettlementAdjustment `N → 1` SettlementLine
- SettlementAdjustment `N → 0..1` RefundRecord
- SettlementAdjustment `N → 0..1` ReturnRequest
- SettlementAdjustment `N → 0..1` admin or rule trigger ref

### Açıklama
SettlementAdjustment, düzeltme zinciridir.
Eski settlement line’ın yerine geçmez; onun üstüne etkidir.

### Kardinalite kararı
- append-oriented tutulmalıdır
- sponsor düzeltmesi, refund etkisi, policy correction gibi nedenler ayrı işaretlenmelidir

---

## 3.16 Payout aggregate modeli

### Ana entity
- PayoutBatch

### Çocuk entity
- PayoutBatchItem

### İlişkiler
- PayoutBatch `1 → N` PayoutBatchItem
- PayoutBatchItem `N → 1` SettlementLine
- PayoutBatch `N → 1` recipient actor/account ref

### Açıklama
PayoutBatch settlement üretmez; payable settlement line’ları batch halinde icraya taşır.

### Kardinalite kararı
- bir batch çok sayıda settlement line taşıyabilir
- aynı settlement line aynı anda iki aktif batch içinde olmamalıdır
- batch success ile item success aynı şey değildir
- retry yeni batch veya yeni item state ile izlenebilmelidir

---

## 3.17 VerifiedPurchaseEligibility aggregate

### Ana entity
- VerifiedPurchaseEligibility

### İlişkiler
- VerifiedPurchaseEligibility `N → 1` Order
- VerifiedPurchaseEligibility `N → 1` OrderLine
- VerifiedPurchaseEligibility `N → 0..1` DeliveryEvent
- VerifiedPurchaseEligibility `N → 0..1` ReturnRequest

### Açıklama
Bu kayıt, belirli order line için doğrulanmış satın alım meta bağını taşır.
Review content veya story content truth değildir.

### Kardinalite kararı
- line-level kurulmalıdır
- delivery ile aktive olabilir
- return/policy ile revoke edilebilir
- history-first tutulmalıdır

---

## 3.18 ReviewEligibility aggregate

### Ana entity
- ReviewEligibility

### İlişkiler
- ReviewEligibility `N → 1` Order
- ReviewEligibility `N → 1` OrderLine
- ReviewEligibility `N → 0..1` VerifiedPurchaseEligibility
- ReviewEligibility `N → 0..1` DeliveryEvent
- ReviewEligibility `N → 0..1` ReturnRequest

### Açıklama
Kullanıcının belirli satın alınmış line için yorum hakkını taşır.

### Kardinalite kararı
- product/order_line bazlı çalışmalıdır
- eligibility ile content ayrılmalıdır
- review açılmış olması verified purchase meta’sının sonsuza kadar sabit kaldığı anlamına gelmez

---

## 3.19 StoryEligibility aggregate

### Ana entity
- StoryEligibility

### İlişkiler
- StoryEligibility `N → 1` Order
- StoryEligibility `N → 1` OrderLine
- StoryEligibility `N → 0..1` VerifiedPurchaseEligibility
- StoryEligibility `N → 0..1` DeliveryEvent
- StoryEligibility `N → 0..1` ReturnRequest

### Açıklama
Kullanıcının ürün/story üretme hakkını taşır.

### Kardinalite kararı
- line-level kurulmalıdır
- delivery ve policy koşullarına bağlı açılmalıdır
- return sonrası trust/visibility etkisi ayrı değerlendirilmelidir

---

## 3.20 RewardEntitlementImpact modeli

### Ana entity
- RewardEntitlementImpact

### İlişkiler
- RewardEntitlementImpact `N → 1` Order
- RewardEntitlementImpact `N → 1` OrderLine
- RewardEntitlementImpact `N → 0..1` ReviewEligibility
- RewardEntitlementImpact `N → 0..1` StoryEligibility
- RewardEntitlementImpact `N → 0..1` ReturnRequest
- RewardEntitlementImpact `N → 0..1` reward ledger ref

### Açıklama
Bu kayıt reward ledger’ın kendisi değildir.
Hak doğumu, bekleme, kesinleşme, iptal veya geri alma etkisini taşır.

### Kardinalite kararı
- line-level çalışmalıdır
- review/story trigger’ları ayrı işaretlenmelidir
- return sonrası revoke/backout etkisi izlenebilmelidir

---

## 4. REFERENTIAL RULE SETI

### 4.1 Checkout → PriceLock / StockReservation / Payment
- `CheckoutPriceLock.checkout_id → Checkout.checkout_id`
- `StockReservation.checkout_id → Checkout.checkout_id`
- `Payment.checkout_id → Checkout.checkout_id`

Kural:
Checkout önce doğrulama alanıdır; price lock ve stock reservation order snapshot değildir.

### 4.2 Payment → Order
- `Order.payment_id → Payment.payment_id`
- `Order.checkout_id → Checkout.checkout_id`

Kural:
Successful payment, order create hakkı doğurur.
Duplicate order create engellenmelidir.

### 4.3 Order → Shipment
- `Shipment.order_id → Order.order_id`

Kural:
Shipment order’dan türeyen fiziksel akıştır; state birebir kopya değildir.

### 4.4 Order / OrderLine → Cancel / Return
- `CancelRequest.order_id → Order.order_id`
- `CancelRequest.order_line_id → OrderLine.order_line_id`
- `ReturnRequest.order_id → Order.order_id`
- `ReturnItem.order_line_id → OrderLine.order_line_id`

Kural:
Cancel ve return line-level desteklemelidir.

### 4.5 Payment / Cancel / Return → RefundRecord
- `RefundRecord.payment_id → Payment.payment_id`
- `RefundRecord.cancel_request_id → CancelRequest.cancel_request_id`
- `RefundRecord.return_request_id → ReturnRequest.return_request_id`

Kural:
Refund finansal yürütmedir; cancel/return yalnız ihtiyacı veya kararı üretir.

### 4.6 OrderLine → SettlementLine
- `SettlementLine.order_line_id → OrderLine.order_line_id`
- `SettlementLine.order_id → Order.order_id`

Kural:
Settlement satır bazlı kurulmalıdır.

### 4.7 SettlementLine → PayoutBatchItem
- `PayoutBatchItem.settlement_line_id → SettlementLine.settlement_line_id`
- `PayoutBatchItem.payout_batch_id → PayoutBatch.payout_batch_id`

Kural:
Payout, settlement kullanır; üretmez.

### 4.8 Delivery / Return → Eligibility
- `VerifiedPurchaseEligibility.order_line_id → OrderLine.order_line_id`
- `VerifiedPurchaseEligibility.activated_by_delivery_event_ref → DeliveryEvent.delivery_event_id`
- `VerifiedPurchaseEligibility.revoked_by_return_request_ref → ReturnRequest.return_request_id`

Benzer şekilde:
- `ReviewEligibility`
- `StoryEligibility`
- `RewardEntitlementImpact`
teslimat ve iade referansları taşıyabilmelidir.

---

## 5. NORMALIZATION / DENORMALIZATION KARARLARI

### Normalize tutulacak alanlar
- checkout, price lock, stock reservation, payment, order, shipment
- cancel/return/refund ana truth ve case kayıtları
- settlement / payout zinciri
- eligibility ve entitlement kayıtları
- append-only delivery / audit history

### Snapshot veya denormalize tutulacak alanlar
- order address / pricing / coupon / campaign / storefront snapshot’ları
- kullanıcıya görünen sade order summary projection
- sade tracking projection
- sade payout dashboard summary
- verified badge projection gibi okuma modelleri

### Net kural
Projection performans için denormalize olabilir.
Ama truth yazımı owner aggregate’ta yapılır.

---

## 6. MUTABILITY POLITIKASI

### Immutable veya append-only tercih edilen entity’ler
- OrderAddressSnapshot
- OrderPricingSnapshot
- OrderCouponSnapshot
- OrderCampaignEffectSnapshot
- OrderStorefrontSnapshot
- DeliveryEvent
- audit log
- payout result history
- settlement adjustment history

### Kısa ömürlü mutable entity’ler
- Checkout
- CheckoutPriceLock
- StockReservation

### Kısıtlı mutable entity’ler
- Payment
- PaymentAttempt
- Order
- OrderLine
- Shipment
- CancelRequest
- ReturnRequest
- ReturnItem
- RefundRecord
- SettlementLine
- PayoutBatch
- PayoutBatchItem
- VerifiedPurchaseEligibility
- ReviewEligibility
- StoryEligibility
- RewardEntitlementImpact

### Not
Kısıtlı mutable demek:
- state ilerler
- bazı operational alanlar güncellenir
- ama geçmiş ticari/finansal bağlam sessizce overwrite edilmez

---

## 7. SOFT DELETE / HISTORY NOTLARI

Aşağıdaki ana kayıtlar fiziksel silme yerine history-first yaklaşımıyla korunmalıdır:

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
- VerifiedPurchaseEligibility
- ReviewEligibility
- StoryEligibility
- RewardEntitlementImpact

Soft delete daha çok şu alanlarda düşünülebilir:
- taslak checkout yardımcı kayıtları
- geçici lock kayıtları için kısa yaşam sonu cleanup
- projection/cache katmanı

---

## 8. ILERI FAZ GENISLEME ALANLARI

Bu dosyada yer bırakılan ama ilk fazda tam açılmayan genişlemeler:

- ShipmentItem / ShipmentLineAllocation
- Stock location detailed allocation
- CouponSnapshot ile campaign snapshot alt kırılımının daha da ayrıştırılması
- payout recipient account aggregate
- review/story content truth ile eligibility arasında referans standardı
- reward ledger entegrasyonu
- support/moderation subject binding modeli

---

## 9. KISA OZET

Doğru logical data model şu zinciri kurar:

- Checkout ödeme öncesi doğrulama aggregate’ıdır
- CheckoutPriceLock kısa süreli fiyat koruma bağlamıdır
- StockReservation merkezi stok üzerinde geçici ayırma etkisidir
- Payment finansal tahsilat aggregate’ıdır
- PaymentAttempt tekil provider yürütme kaydıdır
- Order resmi ticari kayıttır
- OrderLine satır bazlı ticari truth’tur
- Order snapshot ailesi tarihsel sipariş bağlamını korur
- Shipment fiziksel akıştır
- DeliveryEvent append-only lojistik history’dir
- CancelRequest ve ReturnRequest satış sonrası vaka entity’leridir
- RefundRecord finansal geri dönüş kaydıdır
- SettlementLine line-level finansal parçalanmadır
- SettlementAdjustment düzeltme zinciridir
- PayoutBatch ve PayoutBatchItem payout icra katmanıdır
- VerifiedPurchaseEligibility / ReviewEligibility / StoryEligibility teslimat sonrası güven ve hak meta katmanıdır
- RewardEntitlementImpact puan/ödül hakkı etkisini taşır

Bu modelde:
- checkout lock ≠ order snapshot
- stock reservation ≠ stock truth
- payment ≠ settlement
- order ≠ shipment
- return accepted ≠ refund completed
- delivered ≠ verified purchase etkisinin sonsuza kadar sabit kalması
- review/story content ≠ eligibility meta kaydı