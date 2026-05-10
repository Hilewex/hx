# ENTITY_CATALOG

Bu dosya, platformun Aşama 4 kapsamında canonical entity kataloğunu tanımlar.

Amaç:
- hangi entity’nin hangi owner alana ait olduğunu sabitlemek
- truth / snapshot / case / ledger / projection ayrımını netleştirmek
- mutable alan sınırlarını belirlemek
- archive, history ve audit ihtiyacını erken karara bağlamak
- bir sonraki dosyalar olan `LOGICAL_DATA_MODEL.md`, `SNAPSHOT_POLICY.md` ve `ARCHIVE_RETENTION_POLICY.md` için temel oluşturmak

Net kural:
- UI truth üretmez
- panel truth owner değildir
- BFF truth owner değildir
- projection truth değildir
- snapshot, source truth’un yerini almaz; belirli anda sabitlenmiş bağlam taşır
- sosyal güven etiketi, finansal truth ve ticari truth birbirine karıştırılmaz

---

## 1. KAPSAM

Bu ilk sürüm şu çekirdek ticari ve bağlı destek entity’lerini kapsar:

- Checkout
- CheckoutPriceLock
- StockReservation
- Payment
- PaymentAttempt
- Order
- OrderLine
- OrderAddressSnapshot
- OrderPricingSnapshot
- OrderStorefrontSnapshot
- OrderCouponSnapshot
- OrderCampaignEffectSnapshot
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

Bu turda referans verilen ama burada ayrıntılı açılmayan source-truth alanları:
- Address source truth
- Central Price source truth
- Coupon source truth
- Campaign source truth
- Central Stock source truth
- Review / Story content truth
- Reward ledger truth

---

## 2. ENTITY SINIFLARI

### 2.1 Truth Entity
İlgili owner modülün resmi gerçeğini taşır.
Write yalnız owner alanda yapılır.

### 2.2 Snapshot Entity
Belirli anda sabitlenen ticari / finansal / bağlamsal referansı taşır.
Kaynak truth değişse bile geçmiş işlemin referansı korunur.

### 2.3 Case / Workflow Entity
Bir talep, inceleme, rezervasyon, yürütme veya işlem akışını taşır.
Ana ticari gerçeğin yerini almaz.

### 2.4 Ledger / Financial Entity
Hakediş, düzeltme, blokaj, kesinleşme, payout ve geri alma kayıtlarını taşır.

### 2.5 Eligibility / Entitlement Entity
Teslimat, iade, moderasyon veya kural sonucu açılan ya da düşen hak / güven meta verisini taşır.
Content truth değildir; güven ve hak bağlamıdır.

### 2.6 Projection / Read Entity
Kullanıcı veya operasyon görünürlüğü için türetilmiş okuma modelidir.
Bu katalogda canonical truth entity sayılmaz.

---

## 3. ENTITY KAYIT STANDARDI

Her entity için şu alanlar tanımlanmalıdır:

- Entity adı
- Sınıfı
- Owner alanı
- Amaç
- Truth / snapshot / case / ledger / eligibility niteliği
- Ana kimlik alanı
- Mutable alan politikası
- İlişkili state machine
- Bağlı olduğu üst entity’ler
- Audit ihtiyacı
- Archive / history notu

---

## 4. CEKIRDEK TICARI ZINCIR

---

## 4.1 Checkout

### Sınıf
Truth entity

### Owner
Checkout alanı

### Amaç
Sepetten gelen ticari niyeti doğrulamak ve payment için güvenli bağlam üretmek.

### Ana kimlik
- checkout_id

### Temel alanlar
- user_id veya guest_context_id
- cart_reference
- selected_line_items
- address_reference veya guest_address_context
- coupon_context
- campaign_context
- storefront_context
- currency
- review_result
- checkout_state

### Mutable alan politikası
Mutable’dır.
Checkout kapanana, expire olana veya payment’a devredilene kadar yeniden doğrulanabilir.

### Kritik not
Checkout sepet değildir, payment değildir, order değildir.
Ama resmi order öncesi doğrulanmış ticari bağlamın üretildiği yerdir.

### Audit
- checkout başlatma
- stok/fiyat/kupon/kampanya doğrulaması
- ready_for_payment üretimi
- expire / fail / cancel

### Archive / history
Kısa-orta vadeli history tutulabilir.
Kalıcı ticari referans order snapshot’larında taşınır.

---

## 4.2 CheckoutPriceLock

### Sınıf
Case / workflow entity

### Owner
Checkout alanı, merkezi fiyat sistemi referanslı

### Amaç
Aktif checkout bağlamında kısa süreli fiyat sabitleme etkisini taşımak.

### Ana kimlik
- checkout_price_lock_id

### Temel alanlar
- checkout_id
- locked_line_items
- locked_price_components
- price_version_ref
- valid_until
- invalidation_reason
- lock_state

### Mutable alan politikası
Kısa ömürlü mutable’dır.
Expire, release veya consume olabilir.

### Kritik not
Bu order pricing snapshot değildir.
Geçici checkout fiyat koruma bağlamıdır.

### Audit
Zorunlu.

### Archive / history
Kısa retention yeterli olabilir; dispute için sınırlı history saklanabilir.

---

## 4.3 StockReservation

### Sınıf
Case / workflow entity

### Owner
Central Stock alanı

### Amaç
Checkout aşamasında aktive olan rezervasyon etkisini taşımak.

### Ana kimlik
- stock_reservation_id

### Temel alanlar
- checkout_id
- order_id opsiyonel
- product_id / variant_id
- reserved_quantity
- reservation_state
- reserved_until
- release_reason
- consume_reason

### Mutable alan politikası
Mutable’dır.
created / active / released / consumed / expired gibi yaşam taşır.

### Kritik not
Stok truth’unun kendisi değildir; merkezi stok truth üzerinde geçici kilitleme / ayırma etkisidir.

### Audit
Zorunlu.

### Archive / history
History tutulmalıdır; fiziksel stok truth’tan ayrı saklanmalıdır.

---

## 4.4 Payment

### Sınıf
Truth entity

### Owner
Payment alanı

### Amaç
Checkout’tan gelen doğrulanmış bağlamla tahsilat sonucunu yönetmek.

### Ana kimlik
- payment_id

### Temel alanlar
- checkout_id
- user_id veya guest_context_id
- provider_id
- currency
- final_total
- payment_state
- provider_reference
- capture_result
- refund_summary

### Mutable alan politikası
Mutable’dır.
Provider callback, cancellation ve refund alt etkileriyle ilerler.

### Kritik not
Payment sepetten doğrudan beslenmez.
Payment captured olması settlement veya payout anlamına gelmez.

### Audit
Zorunlu.

### Archive / history
Uzun süreli history-first yaklaşım gerekir.

---

## 4.5 PaymentAttempt

### Sınıf
Case / workflow entity

### Owner
Payment alanı

### Amaç
Tekil provider denemesini ve retry/idempotent yürütmeyi taşımak.

### Ana kimlik
- payment_attempt_id

### Temel alanlar
- payment_id
- attempt_no
- idempotency_key
- provider_attempt_reference
- method_type
- attempt_state
- provider_request_payload_ref
- provider_response_payload_ref

### Mutable alan politikası
Append-heavy / sınırlı mutable.

### Kritik not
Payment üst truth’tur; PaymentAttempt tekil yürütme kaydıdır.

### Audit
Zorunlu.

### Archive / history
Tam history korunur.

---

## 4.6 Order

### Sınıf
Truth entity

### Owner
Commerce / Order alanı

### Amaç
Başarılı payment sonrası resmi satış kaydını taşımak.

### Ana kimlik
- order_id

### Temel alanlar
- checkout_id
- payment_id
- user_id veya guest_context_id
- order_state
- final_total
- currency
- address_snapshot_ref
- pricing_snapshot_ref
- storefront_snapshot_ref

### Mutable alan politikası
Kısıtlı mutable.
Order oluşturulduktan sonra ana tarihsel ticari kayıt korunur.

### Kritik not
Order resmi ticari gerçektir.
Shipment, return, refund, settlement ve payout bu kaydın etrafında çalışır.

### Audit
Zorunlu.

### Archive / history
Uzun süreli history zorunludur.

---

## 4.7 OrderLine

### Sınıf
Truth entity

### Owner
Order alanı

### Amaç
Siparişin satır bazlı ticari gerçeğini taşımak.

### Ana kimlik
- order_line_id

### Temel alanlar
- order_id
- product_id
- variant_id
- quantity
- storefront_context_ref
- line_state
- fulfillment_owner_ref

### Mutable alan politikası
Çok kısıtlı mutable.
Teslimat, iptal, iade ve eligibility etkileri satır bazlı ilerleyebilir.

### Kritik not
Teslimat, yorum/story eligibility, iade ve finansal düzeltme order line düzeyinde çalışmalıdır.

### Audit
Zorunlu.

### Archive / history
Order history ile birlikte korunur.

---

## 4.8 OrderAddressSnapshot

### Sınıf
Snapshot entity

### Owner
Order alanı

### Amaç
Sipariş anındaki teslimat adres bağlamını sabitlemek.

### Ana kimlik
- order_address_snapshot_id

### Temel alanlar
- order_id
- recipient_name
- phone
- country
- city
- district
- postal_code
- address_lines
- address_type
- delivery_note

### Mutable alan politikası
Immutable.

### Kritik not
Kullanıcının canlı adres truth’u değil; tarihsel sipariş referansıdır.

### Archive / history
Parent order ile korunur.

---

## 4.9 OrderPricingSnapshot

### Sınıf
Snapshot entity

### Owner
Order alanı

### Amaç
Sipariş anındaki fiyat/indirim/toplam ticari bağlamı sabitlemek.

### Ana kimlik
- order_pricing_snapshot_id

### Temel alanlar
- order_id
- line_subtotal
- shipping_total
- discount_total
- final_total
- currency
- tax_fee_breakdown opsiyonel

### Mutable alan politikası
Immutable.

### Kritik not
Canlı fiyat değişse bile geçmiş sipariş bozulmaz.

### Archive / history
Parent order ile korunur.

---

## 4.10 OrderCouponSnapshot

### Sınıf
Snapshot entity

### Owner
Order alanı, coupon source-truth referanslı

### Amaç
Siparişte uygulanan kupon etkisini ve sponsor tarafını sabitlemek.

### Ana kimlik
- order_coupon_snapshot_id

### Temel alanlar
- order_id
- coupon_id / coupon_code
- coupon_type
- discount_amount
- sponsor_side
- applied_scope
- eligibility_summary

### Mutable alan politikası
Immutable.

### Kritik not
Kupon source-truth değişebilir; siparişe yansıyan kupon etkisi değişmez.

### Archive / history
Parent order ile korunur.

---

## 4.11 OrderCampaignEffectSnapshot

### Sınıf
Snapshot entity

### Owner
Order alanı, campaign source-truth referanslı

### Amaç
Kampanya etkisini ve varsa sponsor/paylaşım sonucunu sipariş anında sabitlemek.

### Ana kimlik
- order_campaign_effect_snapshot_id

### Temel alanlar
- order_id
- campaign_id
- campaign_type
- affected_lines
- campaign_discount_effect
- sponsor_share_summary
- stacking_summary

### Mutable alan politikası
Immutable.

### Kritik not
Settlement line hesaplarında finansal referans olarak kullanılmalıdır.

### Archive / history
Parent order ile korunur.

---

## 4.12 OrderStorefrontSnapshot

### Sınıf
Snapshot entity

### Owner
Order alanı

### Amaç
Sipariş anındaki mağaza / storefront bağlamını sabitlemek.

### Ana kimlik
- order_storefront_snapshot_id

### Temel alanlar
- order_id
- storefront_id
- storefront_type
- display_name_snapshot
- seller_reference_snapshot
- creator_reference_snapshot gerekiyorsa

### Mutable alan politikası
Immutable.

### Kritik not
Storefront source-truth’tan ayrıdır; tarihsel satış bağlamıdır.

### Archive / history
Parent order ile korunur.

---

## 4.13 Shipment

### Sınıf
Truth entity

### Owner
Shipment / Delivery alanı

### Amaç
Order’dan türeyen fiziksel sevkiyat ve teslimat akışını taşımak.

### Ana kimlik
- shipment_id

### Temel alanlar
- order_id
- shipment_group_no
- carrier_ref
- tracking_no
- shipment_state
- prepared_at
- shipped_at
- delivered_at

### Mutable alan politikası
Mutable’dır.

### Kritik not
Order state ile shipment state aynı şey değildir.
Çok paketli yapılarda order line eligibility’yi besler.

### Audit
Zorunlu.

### Archive / history
Uzun süreli history tutulmalıdır.

---

## 4.14 DeliveryEvent

### Sınıf
Event-backed history entity

### Owner
Shipment / Delivery alanı

### Amaç
Teslimat hareketlerini append-only zaman serisi olarak kaydetmek.

### Ana kimlik
- delivery_event_id

### Temel alanlar
- shipment_id
- event_type
- event_time
- source
- location_snapshot
- normalized_status
- raw_payload_ref

### Mutable alan politikası
Append-only.

### Kritik not
Tracking projection değildir; history kaydıdır.
Eligibility üretiminde referans olabilir.

### Archive / history
Tam history korunur.

---

## 4.15 CancelRequest

### Sınıf
Case / workflow entity

### Owner
Cancel / Return alanı

### Amaç
Teslimat öncesi iptal talebini ve karar akışını yönetmek.

### Ana kimlik
- cancel_request_id

### Temel alanlar
- order_id
- order_line_id opsiyonel
- requester_user_id
- reason_code
- cancel_state
- review_notes
- refund_requirement_flag

### Mutable alan politikası
Mutable’dır.

### Kritik not
Order’ı silmez; sonucunu değiştirir.
Refund ihtiyacı doğurabilir.

### Archive / history
Case history korunmalıdır.

---

## 4.16 ReturnRequest

### Sınıf
Case / workflow entity

### Owner
Cancel / Return alanı

### Amaç
Teslimat sonrası iade talebini ve karar akışını yönetmek.

### Ana kimlik
- return_request_id

### Temel alanlar
- order_id
- requester_user_id
- reason_code
- return_state
- evidence_refs
- refund_requirement_flag

### Mutable alan politikası
Mutable’dır.

### Kritik not
Teslim edilmiş satır ekseninde çalışır.
Verified purchase ve puan etkisini dolaylı olarak değiştirebilir.

### Archive / history
Case history korunmalıdır.

---

## 4.17 ReturnItem

### Sınıf
Case-supporting entity

### Owner
Cancel / Return alanı

### Amaç
İade vakasındaki satır bazlı kapsamı taşımak.

### Ana kimlik
- return_item_id

### Temel alanlar
- return_request_id
- order_line_id
- quantity
- reason_code
- item_condition
- received_back_flag
- approval_result

### Mutable alan politikası
Vaka kapanana kadar mutable.

### Kritik not
Kısmi iade first-class olmalıdır.

### Archive / history
Return history ile korunur.

---

## 4.18 RefundRecord

### Sınıf
Ledger / financial-support entity

### Owner
Payment / Finance alanı

### Amaç
Cancel/return sonucunda başlatılan finansal geri ödeme kaydını taşımak.

### Ana kimlik
- refund_record_id

### Temel alanlar
- payment_id
- cancel_request_id veya return_request_id
- order_id
- order_line_id opsiyonel
- refund_amount
- currency
- refund_state
- provider_refund_reference

### Mutable alan politikası
Mutable’dır ama history-first korunur.

### Kritik not
Return accepted olması refund completed anlamına gelmez.

### Archive / history
Tam history zorunludur.

---

## 4.19 SettlementLine

### Sınıf
Ledger entity

### Owner
Finance / Settlement alanı

### Amaç
Sipariş satırının finansal dağılım ve hakediş gerçeğini taşımak.

### Ana kimlik
- settlement_line_id

### Temel alanlar
- order_id
- order_line_id
- gross_amount
- campaign_effect
- coupon_effect
- coupon_sponsor_share
- shipping_effect
- creator_share
- supplier_share
- platform_share
- pending_amount
- blocked_amount
- settled_amount
- settlement_state

### Mutable alan politikası
Kısıtlı mutable.
Düzeltmeler adjustment mantığıyla ilerlemelidir.

### Kritik not
Payment değildir.
Sipariş başına kaba tek satır mantığıyla kurulamaz; line-level finansal truth’tur.

### Archive / history
Uzun süreli history zorunludur.

---

## 4.20 SettlementAdjustment

### Sınıf
Ledger adjustment entity

### Owner
Finance / Settlement alanı

### Amaç
İptal, iade, sponsor düzeltmesi veya finansal hata sonucu settlement line üzerinde düzeltme taşımak.

### Ana kimlik
- settlement_adjustment_id

### Temel alanlar
- settlement_line_id
- trigger_type
- adjustment_amount
- affected_side
- reason_code
- created_by_rule_or_admin
- adjustment_state

### Mutable alan politikası
Append-oriented.

### Kritik not
Eski settlement line sessizce overwrite edilmez; adjustment kaydı üretilir.

### Archive / history
Tam history korunur.

---

## 4.21 PayoutBatch

### Sınıf
Ledger / workflow entity

### Owner
Finance / Payout alanı

### Amaç
Ödenebilir settlement line’ları batch halinde payout sürecine toplamak.

### Ana kimlik
- payout_batch_id

### Temel alanlar
- batch_period
- recipient_type
- recipient_id
- total_payable_amount
- payout_state
- hold_reason
- transfer_reference

### Mutable alan politikası
Mutable’dır.

### Kritik not
Payout settlement üretmez; ödenebilir hale gelmiş finansal kayıtları icra eder.

### Archive / history
Tam history korunur.

---

## 4.22 PayoutBatchItem

### Sınıf
Ledger / workflow child entity

### Owner
Finance / Payout alanı

### Amaç
Bir payout batch içindeki tekil settlement line taşımasını göstermek.

### Ana kimlik
- payout_batch_item_id

### Temel alanlar
- payout_batch_id
- settlement_line_id
- payable_amount
- item_state
- failure_reason
- retry_ref

### Mutable alan politikası
Mutable’dır.

### Kritik not
Batch başarısı ile item başarısı aynı şey değildir.

### Archive / history
Tam history korunur.

---

## 5. ELIGIBILITY / ENTITLEMENT KATMANI

---

## 5.1 VerifiedPurchaseEligibility

### Sınıf
Eligibility entity

### Owner
Delivery truth referanslı, trust/meta alanı

### Amaç
Bir order line için doğrulanmış satın alım güven bağını taşımak.

### Ana kimlik
- verified_purchase_eligibility_id

### Temel alanlar
- order_id
- order_line_id
- user_id
- eligibility_state
- activated_by_delivery_event_ref
- revoked_by_return_request_ref opsiyonel
- storefront_context_ref opsiyonel

### Mutable alan politikası
Mutable’dır.
Teslimat sonrası açılır, iade veya politika sonucu düşebilir.

### Kritik not
Yorum veya story content truth’u değildir.
Güven etiketi bağını taşır.

### Archive / history
History korunmalıdır.

---

## 5.2 ReviewEligibility

### Sınıf
Eligibility entity

### Owner
Delivery truth referanslı, PDP trust/meta alanı

### Amaç
Kullanıcının belirli order line için yorum hakkını taşımak.

### Ana kimlik
- review_eligibility_id

### Temel alanlar
- order_id
- order_line_id
- user_id
- product_id
- eligibility_state
- delivered_threshold_ref
- verified_purchase_state_ref
- review_consumed_flag

### Mutable alan politikası
Mutable’dır.

### Kritik not
Sipariş bazlı değil, ürün satırı bazlı açılır.
İade sonrası verified purchase bağı ve rating etkisi değişebilir.

### Archive / history
History korunmalıdır.

---

## 5.3 StoryEligibility

### Sınıf
Eligibility entity

### Owner
Delivery truth referanslı, UGC/meta alanı

### Amaç
Kullanıcının ürün story hakkını taşımak.

### Ana kimlik
- story_eligibility_id

### Temel alanlar
- order_id
- order_line_id
- user_id
- product_id
- storefront_context_ref opsiyonel
- eligibility_state
- remaining_story_quota
- visibility_effect_state

### Mutable alan politikası
Mutable’dır.

### Kritik not
Takip/keşfet akışına karışmaz; doğru bağlamda görünürlük üretir.

### Archive / history
History korunmalıdır.

---

## 5.4 RewardEntitlementImpact

### Sınıf
Eligibility / entitlement entity

### Owner
Reward alanı, delivery/review/story truth referanslı

### Amaç
Yorum/story/teslimat bağlı puan hakkı etkisini taşımak.

### Ana kimlik
- reward_entitlement_impact_id

### Temel alanlar
- user_id
- order_id
- order_line_id
- trigger_type
- pending_points
- vested_points
- revoked_points
- spendable_effect_state
- revoked_by_return_or_policy_ref

### Mutable alan politikası
Mutable’dır.

### Kritik not
Reward ledger’ın kendisi değildir; hak doğumu / düşümü etkisidir.
İade sonrası puan iptali veya geri alma ile bağ kurmalıdır.

### Archive / history
History korunmalıdır.

---

## 6. ORTAK KURALLAR

### 6.1 Truth ayrımı
- Checkout truth’u order truth’u değildir
- Payment truth’u settlement truth’u değildir
- Order truth’u shipment truth’u değildir
- Cancel/return truth’u refund execution truth’unun yerine geçmez
- Review/story content truth’u verified purchase truth’u değildir

### 6.2 Snapshot ayrımı
Aşağıdaki bağlamlar order anında sabitlenmelidir:
- adres
- fiyat/toplam
- kupon etkisi
- kampanya etkisi
- storefront bağlamı

### 6.3 Checkout geçici bağlam ayrımı
Order snapshot ile karıştırılmaması gereken ama first-class tutulması gereken geçici kayıtlar:
- CheckoutPriceLock
- StockReservation

### 6.4 Eligibility ayrımı
Teslimat sonrası açılan hak ve güven bağları ayrı entity ailesiyle taşınmalıdır:
- VerifiedPurchaseEligibility
- ReviewEligibility
- StoryEligibility
- RewardEntitlementImpact

### 6.5 Finance ayrımı
Settlement ve payout finansal truth alanıdır.
Coupon/campaign etkileri settlement tarafına doğru finansal bileşen olarak yansımalıdır.

---

## 7. KISA OZET

Doğru entity kataloğu şu omurgayı kurar:

- Checkout ödeme öncesi doğrulama truth’udur
- CheckoutPriceLock kısa süreli fiyat koruma bağlamıdır
- StockReservation merkezi stok truth üzerindeki rezervasyon etkisidir
- Payment finansal tahsilat truth’udur
- PaymentAttempt tekil provider yürütme kaydıdır
- Order resmi ticari kayıttır
- OrderLine satır bazlı ticari truth’tur
- Order snapshot ailesi tarihsel sipariş bağlamını korur
- Shipment fiziksel akıştır
- DeliveryEvent append-only hareket history’sidir
- CancelRequest / ReturnRequest satış sonrası case entity’leridir
- RefundRecord finansal geri dönüş kaydıdır
- SettlementLine satır bazlı finansal dağılım truth’udur
- SettlementAdjustment düzeltme zinciridir
- PayoutBatch / PayoutBatchItem ödeme icra katmanıdır
- VerifiedPurchaseEligibility / ReviewEligibility / StoryEligibility / RewardEntitlementImpact teslimat sonrası hak ve güven meta katmanını taşır