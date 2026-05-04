# SNAPSHOT_POLICY

Bu dosya, Aşama 4 kapsamında snapshot üretimi, geçici lock/rezervasyon bağlamı, eligibility referansları ve finansal input bağlamı için canonical politikayı tanımlar.

Amaç:
- source truth ile snapshot’ı karıştırmamak
- geçici checkout doğrulama/lock bağlamını kalıcı order snapshot’ından ayırmak
- geçmiş ticari ve finansal işlemleri sonradan değişen source-truth veriden korumak
- settlement, payout ve teslimat sonrası hak/güven etkilerini doğru tarihsel referansla yürütmek

Net kural:
- snapshot, source truth’un yerine geçmez
- checkout doğrular; order resmi ticari snapshot üretir
- checkout price lock ve stock reservation snapshot değildir; geçici işlem bağlamıdır
- payment execution kaydı order snapshot yerine geçmez
- settlement ve payout canlı source truth’a değil, sabitlenmiş finansal input bağlamına dayanmalıdır
- verified purchase / review / story / reward etkileri content truth değil, teslimat-sonrası eligibility/meta bağlamıdır

---

## 1. KAPSAM

Bu politika şu alanları kapsar:

### Kalıcı order snapshot ailesi
- OrderAddressSnapshot
- OrderPricingSnapshot
- OrderCouponSnapshot
- OrderCampaignEffectSnapshot
- OrderStorefrontSnapshot

### Geçici checkout işlem bağlamı
- CheckoutPriceLock
- StockReservation
- Checkout validated payment context

### Finansal input snapshot ailesi
- Settlement input snapshot
- Sponsor attribution snapshot
- Payout eligibility snapshot

### Teslimat-sonrası eligibility/meta bağlamı
- VerifiedPurchaseEligibility reference snapshot
- ReviewEligibility reference snapshot
- StoryEligibility reference snapshot
- RewardEntitlementImpact reference snapshot

---

## 2. TEMEL ILKELER

### 2.1 Source truth ve snapshot ayrımı

Source truth:
Canlı owner sistemde tutulan güncel kayıttır.

Örnek:
- kullanıcı adres kaydı
- aktif fiyat
- aktif kampanya kuralı
- aktif kupon kuralı
- merkezi stok miktarı
- güncel storefront bilgisi
- reward ledger canlı durumu

Snapshot:
Belirli işlemin oluştuğu anda sabitlenen tarihsel bağlamdır.

Örnek:
- order anındaki adres
- order anındaki fiyat / indirim / kupon / kampanya etkisi
- order anındaki storefront bağlamı
- settlement create anındaki finansal girdi bağlamı
- payout batch create anındaki payout uygunluk bağlamı

Geçici işlem bağlamı:
Snapshot değildir ama işlem anında kısa süreli geçerlidir.

Örnek:
- checkout price lock
- stock reservation
- validated checkout payment context

Net kural:
Canlı source truth sonradan değişse bile geçmiş order/settlement/payout bağlamı sessizce overwrite edilmez. Geçici checkout bağlamı ise yaşamı bittiğinde expire/release/consume olabilir. 

### 2.2 Snapshot üretim anı

Yanlış model:
- checkout aşamasında resmi sipariş snapshot’ı üretmek
- her adımda gereksiz kopya almak
- payment provider kaydını ticari snapshot sanmak

Doğru model:
- checkout doğrular
- checkout gerekirse kısa süreli price lock ve stock reservation üretir
- payment validated checkout context kullanır
- order create anında resmi ticari snapshot’lar üretilir
- settlement create anında finansal input snapshot sabitlenir
- payout batch create anında payout eligibility snapshot sabitlenir
- teslimat sonrası eligibility kayıtları event referansı taşır, içerik truth’una karışmaz

### 2.3 Immutable yaklaşım

Kalıcı snapshot üretildikten sonra:
- ana içerik immutable kabul edilir
- düzeltme gerekiyorsa new snapshot reference / correction record / adjustment mantığı kullanılır
- geçmiş order snapshot ve settlement input snapshot sessizce değiştirilmez

### 2.4 Projection değildir

Snapshot ile projection aynı şey değildir.

- snapshot = tarihsel işlem bağlamı
- projection = görünürlük / okuma kolaylığı

Örnek:
- order summary ekranı projection’dır
- OrderPricingSnapshot tarihsel ticari bağlamdır
- verified badge UI görünümü projection’dır
- VerifiedPurchaseEligibility ise meta/trust kaydıdır

---

## 3. SNAPSHOT VE GECICI BAGLAM URETIM NOKTALARI

---

## 3.1 Checkout aşaması

Checkout şu işleri yapar:
- sepetten gelen ticari niyeti doğrular
- fiyat/stok/adres/kupon/kampanya bağlamını netleştirir
- payment için güvenli context üretir
- gerekirse kısa süreli price lock üretir
- gerekirse stock reservation başlatır

Checkout şu işleri yapmaz:
- resmi order snapshot üretmek
- kalıcı ticari history kaydı olmak
- settlement referansı olmak

Checkout’tan üretilebilecek geçici bağlamlar:
- `checkout_payment_context`
- `CheckoutPriceLock`
- `StockReservation`

### Checkout payment context
En az şu alanları taşımalıdır:
- checkout_id
- validated_line_items
- final_total
- shipping_total
- discount_total
- coupon_context
- campaign_context
- address_context
- storefront_context
- user_id veya guest_context_id
- currency

### Net kural
Checkout bağlamı snapshot hazırlığıdır; resmi tarihsel sipariş kaydı değildir. Price lock ve reservation da bu aşamanın geçici işlem bağlamıdır. 

---

## 3.2 CheckoutPriceLock politikası

### Tür
Geçici işlem bağlamı

### Kaynak truth
- central price source truth
- aktif checkout değerlendirmesi

### Üretim anı
- checkout validation / ready_for_payment öncesi veya sırasında

### İçerik
En az:
- checkout_id
- locked_line_items
- locked_price_components
- price_version_ref
- valid_until
- invalidation_reason
- lock_state

### Neden gerekir
Aktif checkout süresince fiyat dalgalanmasının kontrolsüz order create sonucuna yol açmaması için.

### Mutability
Mutable ve kısa ömürlüdür.
Expire / release / consume olabilir.

### Net kural
CheckoutPriceLock order pricing snapshot değildir.
Kalıcı sipariş history’sinin parçası değil; order create öncesi geçici koruma katmanıdır. 

---

## 3.3 StockReservation politikası

### Tür
Geçici işlem bağlamı / case

### Kaynak truth
- central stock source truth

### Üretim anı
- checkout doğrulama aşaması
- reserve-on-checkout veya benzeri politika varsa

### İçerik
En az:
- stock_reservation_id
- checkout_id
- product_id / variant_id
- reserved_quantity
- reservation_state
- reserved_until
- release_reason
- consume_reason

### Neden gerekir
Aynı stok biriminin checkout sürecinde kontrolsüz biçimde çoklu tüketilmesini engellemek için.

### Mutability
Mutable ve kısa/orta ömürlüdür.
created / active / released / consumed / expired akışı taşır.

### Net kural
StockReservation stok quantity truth’unun kendisi değildir.
Order snapshot da değildir.
Geçici stok ayırma etkisidir. 

---

## 3.4 Payment aşaması

Payment şu işi yapar:
- checkout tarafından doğrulanmış bağlamı alır
- tahsilat sonucu üretir
- order create için güvenilir sonuç sağlar

Payment şu işi yapmaz:
- source truth olan address/campaign/storefront verisini owner gibi sabitlemek
- order snapshot yerine geçmek
- settlement snapshot üretmek

Payment içinde tutulabilecek kayıtlar:
- provider request/response referansları
- amount / currency
- checkout reference
- attempt bilgisi
- refund execution referansları

Net kural:
Payment execution kaydı ticari snapshot yerine geçmez. :contentReference[oaicite:5]{index=5}

---

## 3.5 Order create anı

Resmi ticari snapshot üretim anı budur.

Order create sırasında aşağıdaki snapshot’lar üretilmelidir:
- OrderAddressSnapshot
- OrderPricingSnapshot
- OrderStorefrontSnapshot

Etkisi varsa ayrıca:
- OrderCouponSnapshot
- OrderCampaignEffectSnapshot

Sebep:
Order resmi ticari kayıttır ve shipment, return, refund, settlement, payout, verified purchase ve reward etkilerine tarihsel referans taşır. 

---

## 4. SNAPSHOT TUR BAZLI POLITIKA

---

## 4.1 Address Snapshot Policy

### Kaynak truth
- account address source truth
- guest checkout address context

### Üretim anı
- order create

### İçerik
En az:
- recipient_name
- phone
- country
- city
- district
- postal_code
- address_lines
- address_type
- delivery_note

### Neden gerekir
Kullanıcı adresini sonradan değiştirirse geçmiş sipariş bozulmamalıdır.

### Mutability
Immutable.

### Sonraki kullanım
- shipment create
- support/dispute referansı
- return incelemesi

### Net kural
Adres truth’u hesap alanında yaşar; sipariş tarihi bağlamı snapshot’ta korunur.

---

## 4.2 Pricing Snapshot Policy

### Kaynak truth
- central price source truth
- checkout validated totals
- shipping/discount/final total hesapları

### Üretim anı
- order create

### İçerik
En az:
- line_subtotal
- shipping_total
- discount_total
- final_total
- currency
- hesap kırılımı
- gerekiyorsa tax/fee breakdown

### Neden gerekir
Canlı fiyat değişse bile geçmiş siparişin ticari gerçeği bozulmamalıdır.

### Mutability
Immutable.

### Sonraki kullanım
- order detail
- cancel/return kontrolü
- refund referansı
- settlement input üretimi

### Net kural
Settlement canlı fiyat kaydına değil, order anında sabitlenmiş pricing bağlamına dayanmalıdır. :contentReference[oaicite:7]{index=7}

---

## 4.3 Coupon Snapshot Policy

### Kaynak truth
- coupon source truth
- coupon uygunluk ve sponsor kuralı

### Üretim anı
- order create

### İçerik
En az:
- coupon_id veya coupon_code
- coupon_type
- discount_amount
- sponsor_side
- applied_scope
- eligibility_summary

### Neden gerekir
Kupon sonradan değişse veya pasife alınsa bile geçmiş sipariş ve settlement etkisi bozulmamalıdır.

### Mutability
Immutable.

### Sonraki kullanım
- refund referansı
- settlement sponsor attribution
- finance audit

### Net kural
Coupon source truth başka şeydir; ordera yansıyan kupon etkisi snapshot olarak korunur. 

---

## 4.4 Campaign Effect Snapshot Policy

### Kaynak truth
- campaign source truth
- aktif kampanya etkisi
- sponsor/paylaşım kuralı

### Üretim anı
- order create

### İçerik
En az:
- campaign_id
- campaign_type
- affected_lines
- campaign_discount_effect
- sponsor_share_summary
- stacking_summary

### Neden gerekir
Kampanya kuralları zamanla değişebilir; geçmiş sipariş ve settlement hesabı değişmemelidir.

### Mutability
Immutable.

### Sonraki kullanım
- settlement line hesaplama
- sponsor mutabakatı
- finance audit

### Net kural
Settlement line, order pricing bağlamı yanında campaign effect snapshot’tan da beslenmelidir. 

---

## 4.5 Storefront Snapshot Policy

### Kaynak truth
- storefront source truth
- seller/supplier/creator bağlamı

### Üretim anı
- order create

### İçerik
En az:
- storefront_id
- storefront_type
- display_name_snapshot
- seller_reference_snapshot
- creator_reference_snapshot gerekiyorsa

### Neden gerekir
Storefront görünürlüğü veya adı sonradan değişse bile geçmiş satış bağlamı korunmalıdır.

### Mutability
Immutable.

### Sonraki kullanım
- order detail
- settlement attribution
- reward/trust görünürlük referansı

### Net kural
Storefront snapshot tarihsel satış bağlamıdır; source-truth’un yerine geçmez.

---

## 5. TESLIMAT-SONRASI ELIGIBILITY / META BAGLAMI

### Genel kural
Bunlar klasik order snapshot değildir.
Ama tarihsel referans ve denetlenebilirlik için belirli tetikleyici kaydı taşımaları gerekir.

---

## 5.1 VerifiedPurchaseEligibility Policy

### Tür
Eligibility/meta referans kaydı

### Kaynak truth
- delivered order line gerçeği
- delivery event history
- return/policy sonucu

### Üretim anı
- ilgili order line teslim eşik koşulu oluştuğunda

### Referans içeriği
En az:
- order_id
- order_line_id
- user_id
- eligibility_state
- activated_by_delivery_event_ref
- revoked_by_return_request_ref opsiyonel

### Neden gerekir
Verified purchase etiketi ürün yorumu/story ve trust görünürlüğü için tarihsel referans ister.

### Mutability
Mutable’dır.
Aktive olabilir, revoke olabilir.

### Net kural
Bu kayıt review/story content truth’u değildir; güven meta bağıdır. İade sonrası düşebilir. 

---

## 5.2 ReviewEligibility Policy

### Tür
Eligibility/meta referans kaydı

### Kaynak truth
- delivered order line
- verified purchase durumu
- PDP yorum kuralı

### Üretim anı
- ürün satırı için yorum hakkı doğduğunda

### Referans içeriği
En az:
- order_id
- order_line_id
- product_id
- user_id
- eligibility_state
- delivered_threshold_ref
- verified_purchase_state_ref
- review_consumed_flag

### Neden gerekir
Yorum hakkı order bazlı değil, ürün satırı bazlı ve teslimat-sonrası kuraldır.

### Mutability
Mutable’dır.

### Net kural
Yorum içeriği ile yorum hakkı aynı şey değildir. Verified purchase bağı ve rating etkisi iade sonrası değişebilir. 

---

## 5.3 StoryEligibility Policy

### Tür
Eligibility/meta referans kaydı

### Kaynak truth
- delivered order line
- verified purchase/trust bağlamı
- story üretim kuralı

### Üretim anı
- ürün story hakkı doğduğunda

### Referans içeriği
En az:
- order_id
- order_line_id
- product_id
- user_id
- eligibility_state
- remaining_story_quota
- visibility_effect_state

### Neden gerekir
Story hakkı ürün deneyimi ve teslimat bağlamına bağlıdır; genel sosyal içerik hakkı ile karıştırılmamalıdır.

### Mutability
Mutable’dır.

### Net kural
Story content truth başka şeydir; StoryEligibility meta/hak kaydıdır. Return/policy etkisiyle değişebilir. 

---

## 5.4 RewardEntitlementImpact Policy

### Tür
Eligibility/entitlement referans kaydı

### Kaynak truth
- review/story/delivery tetikleri
- reward ledger truth
- return/policy sonucu

### Üretim anı
- puan hakkı doğduğunda veya geri alındığında

### Referans içeriği
En az:
- user_id
- order_id
- order_line_id
- trigger_type
- pending_points
- vested_points
- revoked_points
- revoked_by_return_or_policy_ref

### Neden gerekir
Ödül puanı ledger ile ilişkilidir ama hak doğumu / geri alma etkisinin ayrı izlenmesi gerekir.

### Mutability
Mutable’dır.

### Net kural
Reward ledger başka şeydir; RewardEntitlementImpact hak etkisidir. Return sonrası puan etkisi geri alınabilir. 

---

## 6. FINANSAL INPUT SNAPSHOT AILESI

---

## 6.1 Settlement Input Snapshot Policy

### Tür
Kalıcı finansal input snapshot

### Kaynak truth
- OrderLine
- OrderPricingSnapshot
- OrderCouponSnapshot
- OrderCampaignEffectSnapshot
- shipping effect
- sponsor attribution
- refund/return adjustment signals

### Üretim anı
- SettlementLine create

### İçerik
En az:
- order_line_reference
- gross_amount
- coupon_effect
- campaign_effect
- coupon_sponsor_share
- shipping_effect
- creator_share
- supplier_share
- platform_share
- pending/blocked başlangıç bağlamı
- adjustment_basis_ref gerekiyorsa

### Neden gerekir
Settlement geçmişi canlı kampanya/kupon/fiyat verisinden bağımsız denetlenebilir olmalıdır.

### Mutability
Asıl input bağlamı immutable kabul edilir.
Değişiklikler SettlementAdjustment ile yürür.

### Net kural
SettlementLine sessiz overwrite edilmez; finansal input snapshot + adjustment zinciri kullanılır. :contentReference[oaicite:14]{index=14}

---

## 6.2 Sponsor Attribution Snapshot Policy

### Tür
Kalıcı finansal alt bağlam

### Kaynak truth
- coupon sponsor kuralı
- campaign sponsor/paylaşım kuralı

### Üretim anı
- order create veya settlement create sırasında, ihtiyaca göre

### İçerik
En az:
- sponsor_side
- sponsor_amount
- affected_lines
- attribution_basis

### Neden gerekir
Kupon/kampanya sponsor etkisi sonradan değişse bile mutabakat bozulmamalıdır.

### Mutability
Immutable.

### Net kural
Finance tarafı sponsor paylaşımını canlı marketing kuralından değil, sabitlenmiş attribution bağlamından okumalıdır. 

---

## 6.3 Payout Eligibility Snapshot Policy

### Tür
Kalıcı batch-create referans bağlamı

### Kaynak truth
- payable settlement lines
- payout account/recipient durumu
- hold/release koşulları
- threshold check sonucu

### Üretim anı
- PayoutBatch create

### İçerik
En az:
- payout_batch_id
- recipient_type
- recipient_id
- included_settlement_line_ids
- total_payable_amount
- hold_reason_summary
- threshold_check_result
- payout_account_verification_status_snapshot

### Neden gerekir
Payout batch oluşturulurken kullanılan uygunluk bağlamı sonradan değişse bile batch history denetlenebilir olmalıdır.

### Mutability
Batch summary snapshot immutable; batch state mutable olabilir.

### Net kural
Payout settlement üretmez; o anda payable kabul edilmiş finansal bağlamı icra akışına taşır. 

---

## 7. SNAPSHOT URETILMEMESI GEREKEN ALANLAR

Varsayılan olarak snapshot alınmamalı:

- auth/session truth
- like/save/follow gibi interaction truth’u
- moderation queue operasyon kaydı
- support serbest yorum akışı
- BFF aggregate response payload’ları
- anlık UI projection’ları
- delivery tracking UI çıktısı

Sebep:
Bunlar ya canlı truth, ya projection, ya da başka owner alanına ait operasyonel kayıtlardır.

---

## 8. DEGISIKLIK VE DÜZELTME POLITIKASI

Kalıcı snapshot üretildikten sonra:
- geçmiş snapshot overwrite edilmez
- correction gerekiyorsa new reference / replacement snapshot / adjustment kaydı kullanılır
- audit izi bırakılır

Örnek:
- yanlış sponsor dağılımı bulunduysa SettlementAdjustment üretilir
- hatalı payout uygunluk değerlendirmesi varsa batch/retry/correction mantığı kullanılır
- order pricing bağlamı düzeltilmesi gerekiyorsa eski snapshot sessizce değiştirilmez

Geçici checkout bağlamında ise:
- expire/release/consume olağandır
- geçmiş kalıcı sipariş history’si gibi davranılmaz

---

## 9. AUDIT GEREKSINIMI

Audit zorunlu olan üretimler:
- CheckoutPriceLock create/release/expire/consume
- StockReservation create/release/consume/expire
- OrderAddressSnapshot create
- OrderPricingSnapshot create
- OrderCouponSnapshot create
- OrderCampaignEffectSnapshot create
- OrderStorefrontSnapshot create
- Settlement input snapshot create
- SettlementAdjustment create
- Payout eligibility snapshot create
- VerifiedPurchaseEligibility activate/revoke
- ReviewEligibility activate/consume/revoke
- StoryEligibility activate/revoke
- RewardEntitlementImpact create/revoke

---

## 10. SAKLAMA ILKESI

Varsayılan yaklaşım:
- order bağlantılı snapshot’lar uzun süreli history ile korunur
- settlement input ve sponsor attribution bağlamı uzun süreli saklanır
- payout eligibility snapshot denetlenebilir süre boyunca korunur
- eligibility/meta kayıtları history-first saklanır
- checkout price lock ve stock reservation kısa/orta süreli tutulabilir ama audit/history gereksinimi varsa iz bırakır

Detay süre ve sıcaklık sınıfı `ARCHIVE_RETENTION_POLICY.md` içinde sabitlenmelidir.

---

## 11. KISA OZET

Doğru snapshot politikası şudur:

- checkout doğrular; resmi sipariş snapshot’ı üretmez
- checkout gerekirse price lock ve stock reservation üretir
- payment validated checkout context kullanır; order snapshot yerine geçmez
- order create anında adres/fiyat/kupon/kampanya/storefront bağlamı sabitlenir
- verified purchase / review / story / reward etkileri ayrı eligibility/meta bağlamı ile izlenir
- settlement canlı source truth’a değil, sabitlenmiş finansal input snapshot’ına dayanır
- sponsor attribution finansal mutabakat için ayrı sabitlenir
- payout batch create anındaki uygunluk bağlamı tarihsel olarak korunur
- geçmiş kalıcı snapshot sessizce overwrite edilmez
- geçici checkout bağlamı ile kalıcı order/finance snapshot’ı birbirine karıştırılmaz