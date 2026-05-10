# IDEMPOTENCY_POLICIES

Bu dosya, Aşama 3 boyunca tanımlanan tüm state machine ve kritik akışlar için ortak idempotency politikalarını sabitler.

Amaç:
- aynı isteğin tekrar gelmesi halinde duplicate etki üretmemek
- callback/retry/replay durumlarında truth’u bozmamak
- dış sağlayıcı, iç event, panel aksiyonu ve kullanıcı aksiyonu tarafında güvenli tekrar işleme kurmak

Net kural:
İdempotency, yalnız payment konusu değildir.
Checkout, order, shipment, return/refund, settlement, payout, support, moderation ve lifecycle akışlarında da zorunludur.

---

## 1. TEMEL ILKE

Aynı niyetin aynı bağlam içinde tekrar işlenmesi, ikinci kez yeni etki üretmemelidir.

İdempotency’nin amacı:
- double charge önlemek
- duplicate order önlemek
- duplicate shipment/delivery önlemek
- duplicate refund önlemek
- duplicate payout önlemek
- duplicate moderation/support item önlemek
- yanlış analytics ve audit çoğalmasını önlemek

---

## 2. IDEMPOTENCY KAPSAM TURLERI

### 2.1 Request idempotency
Aynı API isteği tekrar gelirse aynı etkide kalır.

### 2.2 Callback idempotency
Sağlayıcı callback’i tekrar gönderirse ikinci kez yeni etki üretilmez.

### 2.3 Command idempotency
Aynı iç komut birden fazla işlenirse duplicate truth oluşmaz.

### 2.4 Event consumer idempotency
Aynı event tekrar tüketilirse yan etki çoğalmaz.

### 2.5 Manual action idempotency
Panelden aynı admin aksiyonu tekrar çalıştırılırsa ikinci kez yanlış sonuç üretilmez.

---

## 3. GENEL IDEMPOTENCY ANAHTAR PRENSIPLERI

Her kritik akışta idempotency key en az şu özellikleri taşımalıdır:

- bağlamı tekilleştirmeli
- yeterince kararlı olmalı
- iş etkisini temsil etmeli
- salt zaman damgasına dayanıp kırılgan olmamalı
- gerektiğinde version ile desteklenmeli

İdempotency key örnek kaynakları:
- checkout_id
- payment_attempt_id
- order_create_key
- shipment_id
- carrier_reference
- return_request_id
- settlement_effect_key
- payout_batch_id
- provider_reference
- admin_action_id

---

## 4. CHECKOUT IDEMPOTENCY POLITIKASI

### Korunacak alanlar
- checkout create
- checkout ready_for_payment handoff
- checkout → payment dönüşümü
- expire/abandon işleme

### Temel anahtarlar
- checkout_id
- checkout_version
- payment_attempt_seed

### Net kurallar
- aynı checkout bağlamı birden fazla aktif payment handoff üretmemelidir
- expired checkout tekrar kullanılacaksa yeni doğrulama/version gerekir
- abandoned checkout doğrudan payment’a gidemez

---

## 5. PAYMENT IDEMPOTENCY POLITIKASI

### Korunacak alanlar
- payment attempt create
- provider authorization
- provider callback consume
- captured sonucu order create tetikleme
- refund execute

### Temel anahtarlar
- payment_attempt_id
- provider_reference
- external_callback_id
- checkout_id + provider
- refund_reference

### Net kurallar
- aynı payment attempt iki kez captured olmamalıdır
- aynı callback iki kez order create zinciri başlatmamalıdır
- refund aynı finansal etki için iki kez çalışmamalıdır

---

## 6. ORDER IDEMPOTENCY POLITIKASI

### Korunacak alanlar
- order create
- order create retry
- order → ops handoff
- order cancel/return action’ları

### Temel anahtarlar
- order_create_key
- payment_attempt_id
- checkout_id
- order_idempotency_version

### Net kurallar
- başarılı payment sonucu en fazla bir order truth üretmelidir
- retry ile ikinci order yaratılmamalıdır
- aynı satır için duplicate cancel/return kayıtları kontrol edilmelidir

---

## 7. SHIPMENT / DELIVERY IDEMPOTENCY POLITIKASI

### Korunacak alanlar
- shipment create
- carrier callback consume
- delivery proof kayıtları
- delivered/failed durum tekrarları

### Temel anahtarlar
- shipment_id
- carrier_reference
- callback_event_id
- delivery_proof_id

### Net kurallar
- aynı shipment iki kez teslim edildi görünmemelidir
- aynı carrier callback ikinci kez yeni truth üretmemelidir
- delivery proof duplicate işlenmemelidir

---

## 8. CANCEL / RETURN / REFUND IDEMPOTENCY POLITIKASI

### Korunacak alanlar
- cancel request create
- return request create
- refund request trigger
- refund callback sonucu
- same line duplicate claim

### Temel anahtarlar
- cancel_request_id
- return_request_id
- order_line_id
- refund_reference
- review_action_id

### Net kurallar
- aynı satır için kısa pencere içinde duplicate vaka açılması engellenmelidir
- aynı refund etkisi iki kez uygulanmamalıdır
- provider refund sonucu duplicate işlenmemelidir

---

## 9. SUPPORT-TICKET IDEMPOTENCY POLITIKASI

### Korunacak alanlar
- ticket create
- aynı vakadan duplicate ticket üretimi
- aynı otomatik trigger’dan tekrar ticket açılması

### Temel anahtarlar
- ticket_source
- subject_type
- subject_id
- user_id
- dedupe_window
- dedupe_key

### Net kurallar
- aynı sipariş/satır/ödeme problemi için kısa zaman penceresinde duplicate ticket kontrolü uygulanmalıdır
- ama gerçek yeni vaka ile duplicate vaka karıştırılmamalıdır

---

## 10. MODERATION IDEMPOTENCY POLITIKASI

### Korunacak alanlar
- moderation item create
- aynı içerik için duplicate moderation queue oluşması
- aynı otomatik kural işaretinin çoğalması
- same complaint burst

### Temel anahtarlar
- subject_type
- subject_id
- source
- complaint_key
- created_window

### Net kurallar
- aynı içerik için anlamsız duplicate moderation item çoğalmamalıdır
- ama farklı şikayet bağlamları gerçekten ayrı vaka üretebilir

---

## 11. CREATOR / SUPPLIER LIFECYCLE IDEMPOTENCY POLITIKASI

### Korunacak alanlar
- application create
- approve/reject kararları
- restrict/suspend kararları
- reactivate kararları

### Temel anahtarlar
- application_id
- actor_id
- admin_action_id
- lifecycle_decision_key

### Net kurallar
- aynı yönetim kararı ikinci kez uygulanmamalıdır
- aynı suspension/restriction etkisi duplicate state değişimi üretmemelidir

---

## 12. SETTLEMENT IDEMPOTENCY POLITIKASI

### Korunacak alanlar
- settlement line create
- sponsor effect apply
- refund/cancel correction apply
- settlement paid_out yansıması
- manual adjustment

### Temel anahtarlar
- settlement_line_id
- order_line_id
- settlement_effect_key
- refund_reference
- payout_reference

### Net kurallar
- aynı order line için aynı finansal etki iki kez yazılmamalıdır
- aynı düzeltme tekrarlanıp çift hakediş veya çift negatif etki üretmemelidir

---

## 13. PAYOUT IDEMPOTENCY POLITIKASI

### Korunacak alanlar
- payout batch create
- batch submit
- provider transfer result consume
- payout item paid sonucu
- retry batch oluşturma

### Temel anahtarlar
- payout_batch_id
- payout_reference
- payout_item_reference
- settlement_line_id
- provider_transfer_reference

### Net kurallar
- aynı payable line iki kez ödenmemelidir
- aynı batch iki kez sağlayıcıya gönderilmemelidir
- aynı transfer sonucu ikinci kez işlenmemelidir

---

## 14. EVENT CONSUMER IDEMPOTENCY POLITIKASI

### Korunacak alanlar
- analytics ingest
- search indexing update
- notification dispatch
- projection rebuild
- async compensation/retry flows

### Temel anahtarlar
- event_id
- topic
- consumer_group
- aggregate_id
- event_version

### Net kurallar
- aynı event iki kez tüketilse bile aynı projection tekrar bozulmamalıdır
- notification gibi yan etkiler duplicate olmamalıdır
- search/indexing işlemleri duplicate-safe tasarlanmalıdır

---

## 15. IDEMPOTENCY SAKLAMA POLITIKASI

Her idempotency key sonsuza kadar tutulmak zorunda değildir.
Ama kritik alanlar için yeterli retention penceresi olmalıdır.

Örnek yaklaşım:
- checkout/payment kısa-orta pencere
- order/refund orta-uzun pencere
- payout/settlement daha uzun pencere
- admin/manual action kayıtları audit ile birlikte uzun pencere

Net kural:
Retention süresi iş riskiyle orantılı olmalıdır.

---

## 16. IDEMPOTENCY BASARISIZLIK DAVRANISI

Bir duplicate istek geldiğinde sistem şu davranışlardan birini seçmelidir:

1. mevcut sonucu geri döndürmek
2. no-op yapmak
3. duplicate olduğunu işaretleyip işleme almamak
4. güvenli conflict dönmek
5. manuele düşürmek
   (özellikle finans/payout gibi alanlarda)

Aynı kural her alan için aynı olmak zorunda değildir.

---

## 17. IDEMPOTENCY VE AUDIT ILISKISI

Idempotency koruması, audit ihtiyacını kaldırmaz.

Özellikle:
- admin aksiyonları
- payout işlemleri
- settlement düzeltmeleri
- moderation kararları
- creator/supplier lifecycle kararları

duplicate korunsa bile audit izi tutulmalıdır.

---

## 18. IDEMPOTENCY VE EVENT ILISKISI

Net kural:
Event üretmek serbesttir; ama event tüketimi duplicate-safe olmalıdır.

Örnek:
- aynı `payment_captured` event’i ikinci kez gelse bile ikinci order üretilmemeli
- aynı `shipment_delivered` event’i ikinci kez gelse bile ikinci eligibility açılmamalı
- aynı `payout_processed` event’i ikinci kez gelse bile ikinci paid_out etkisi yazılmamalı

---

## 19. KISA OZET

Bu platform için idempotency zorunlu alanlar:

- checkout handoff
- payment callbacks
- order create
- shipment callbacks
- cancel/return/refund
- settlement create/adjust
- payout submit/process
- moderation/support duplicate create
- admin lifecycle kararları
- event consumer işlemleri

Net sonuç:
İdempotency, bu platformda opsiyon değil; çekirdek güvenlik ve doğruluk katmanıdır.