# STATE_MACHINES/payment

Bu dosya, ödeme sisteminin kodlama öncesi state machine omurgasını tanımlar.

Net kural:
- payment, checkout değildir
- payment, order değildir
- payment başarılı olabilir; ama order create işlemi ayrıca ve idempotent biçimde çalışmalıdır
- payment sonucu ile financial settlement aynı şey değildir
- refund execution, payment state machine’in bir alt alanıdır; iade sistemiyle karıştırılmaz

Ödeme sistemi, kullanıcıdan tahsilatın başarılı/başarısız/askıda olup olmadığını belirleyen finansal işlem katmanıdır. Siparişin resmi oluşumu payment sonrası gelir. 

---

## 1. PAYMENT SISTEMININ AMACI

Payment sistemi şu işleri yapar:

- checkout tarafından doğrulanmış bağlamı almak
- ödeme denemesi oluşturmak
- kullanıcıdan tahsilat yapmak
- 3. parti ödeme sağlayıcısı ile etkileşmek
- başarılı / başarısız / pending sonucu üretmek
- order creation için güvenilir sonuç üretmek
- refund execution için finansal referans taşımak

Payment sistemi şu işleri yapmaz:

- sepet doğrulaması yapmak
- address / delivery truth üretmek
- siparişin ticari içeriğini baştan kurmak
- fulfillment yürütmek
- payout hesaplamak
- settlement dağıtımını yapmak

---

## 2. PAYMENT GIRDISI

Payment doğrudan şu kaynaktan beslenir:

- checkout_payment_context

Bu bağlam en az şu alanları içerir:
- checkout_id
- validated_line_items
- final_total
- shipping_total
- discount_total
- coupon_context
- campaign_context
- address_context
- user_id veya guest_context_id
- payment_attempt_seed
- currency

Net kural:
Payment sistemi doğrudan sepetten beslenmez.
Checkout valid context üretmeden payment başlamaz. 

---

## 3. PAYMENT AKTORLERI

### 3.1 Kullanıcı / guest checkout kullanıcısı
Ödeme başlatan dış aktördür.

### 3.2 Platform
Ödeme owner akışını yönetir.

### 3.3 Ödeme sağlayıcısı
Dış entegrasyon aktörüdür.

### 3.4 Finance admin
Operasyonel/inceleme görünürlüğü alabilir; ama kullanıcı adına normal ödeme başlatmaz.

### 3.5 Internal services
Callback, reconciliation, audit ve projection amaçlı çalışabilir.

---

## 4. PAYMENT STATE LISTESI

Önerilen minimum profesyonel state listesi:

- created
- awaiting_method
- authorizing
- pending_provider
- authorized
- captured
- failed
- cancelled
- expired
- refund_pending
- refunded_partially
- refunded_fully

İlk faz için çekirdek güvenli akış:
- created
- authorizing
- pending_provider
- captured
- failed
- cancelled

Not:
Authorized ve captured aynı anda tek adımda da çalışabilir.
Ancak ayrımı korumak, sağlayıcı bazlı akışlarda daha güvenlidir.

---

## 5. STATE TANIMLARI

### 5.1 created
Payment attempt oluşturulmuştur.
Henüz sağlayıcıya nihai işlem çıkılmamış olabilir.

### 5.2 awaiting_method
Ödeme yöntemi seçimi / token / provider hazırlığı beklenmektedir.

### 5.3 authorizing
Sağlayıcıya yetkilendirme / tahsilat çağrısı yapılmaktadır.

### 5.4 pending_provider
Sağlayıcı sonucu henüz kesin dönmemiştir.
3DS, redirect, callback veya async provider sonucu bekleniyor olabilir.

### 5.5 authorized
Ödeme yetkilendirilmiştir; capture ayrı çalışabilir.

### 5.6 captured
Tahsilat başarılıdır.
Bu state, order creation hakkını doğurur.

Net kural:
captured = sipariş oluştu demek değildir.
captured → order create zinciri ayrıca çalışır. 

### 5.7 failed
Ödeme başarısız olmuştur.
Sipariş oluşmaz.

### 5.8 cancelled
Kullanıcı, sistem veya sağlayıcı sebebiyle ödeme denemesi iptal edilmiştir.

### 5.9 expired
Ödeme denemesi zaman aşımına uğramıştır.

### 5.10 refund_pending
Başarılı bir tahsilat için refund işlemi başlatılmıştır; sağlayıcı sonucu beklenmektedir.

### 5.11 refunded_partially
Kısmi refund başarılı olmuştur.

### 5.12 refunded_fully
Tam refund başarılı olmuştur.

Not:
Refund state’leri payment alt alanıdır; iade sistemi ürün/sipariş hakkını yönetir.
Refund execution sonucu financial truth ve order/return projection’lara yansır. 

---

## 6. GECERLI TRANSITION LISTESI

### Başlangıç
- created → awaiting_method
- created → authorizing
  (tek adımda method hazırsa)

### Yetkilendirme / sağlayıcı sonucu
- awaiting_method → authorizing
- authorizing → pending_provider
- authorizing → authorized
- authorizing → captured
- authorizing → failed
- authorizing → cancelled

### Pending sonucu
- pending_provider → authorized
- pending_provider → captured
- pending_provider → failed
- pending_provider → cancelled
- pending_provider → expired

### Authorized sonucu
- authorized → captured
- authorized → failed
- authorized → cancelled

### Capture sonrası refund
- captured → refund_pending
- refund_pending → refunded_partially
- refund_pending → refunded_fully
- refund_pending → failed
  (refund girişimi başarısız olabilir; ana capture korunur)

### Genel terk/süre
- created → expired
- awaiting_method → expired

---

## 7. YASAK TRANSITION LISTESI

- failed → captured
- cancelled → captured
- expired → captured
- created → refunded_fully
- failed → refunded_fully
- cancelled → refunded_fully

Ayrıca:
- captured olmadan refund başlatılamaz
- same payment attempt ikinci kez captured olmamalıdır
- aynı callback ile tekrar tekrar order create zinciri oluşmamalıdır

---

## 8. PAYMENT ATTEMPT MANTIGI

Payment sistemi order’dan önce payment_attempt oluşturmalıdır.

Payment attempt en az şunları taşımalıdır:
- payment_attempt_id
- checkout_id
- user_id veya guest_context_id
- provider
- provider_reference
- amount
- currency
- state
- idempotency_key
- created_at
- updated_at

Not:
Payment attempt, order yerine geçmez.
Order create, başarılı captured sonucu sonrası ayrı çalışır.

---

## 9. CHECKOUT ILE ILISKI

Checkout’tan payment’a geçiş kuralı:

- checkout ready_for_payment olmalı
- payment attempt, validated checkout context üzerinden açılmalı
- checkout invalid ise payment başlamamalı
- expired checkout’tan payment doğmamalı

Bu yüzden:
checkout state machine ve payment state machine ayrı tutulur ama `checkout_id` ile bağlanır. 

---

## 10. ORDER ILE ILISKI

En kritik kural:

- payment captured → order create command üretir
- order create başarısız olabilir
- payment success varken order create retry/idempotent olmalıdır
- payment başarılı olduğu halde order oluşmama vakası sistemde özel hata/incident kategorisidir

Doğru model:
payment başarılı olması ile sipariş oluşumunu tek atomik satır gibi düşünmemek;
ama bu iki alanı güvenli event/idempotent command zinciriyle bağlamaktır. :contentReference[oaicite:6]{index=6}

---

## 11. REFUND ILE ILISKI

Refund execution payment alt alanıdır.
Ama refund kararını açan sistem her zaman payment sistemi değildir.

Doğru zincir:
- iade/iptal owner sistemi refund gereksinimi üretir
- financial/payment owner refund execution çalıştırır
- refund sonucu payment + settlement + order projection’lara yansır

Net kural:
refund = finansal işlemdir
return = ticari/sipariş sonrası hak akışıdır

Bu iki alan ayrı düşünülmelidir. 

---

## 12. 3. PARTI ODEME SAGLAYICISI DAVRANISI

Payment sistemi şu durumları taşıyabilmelidir:
- provider timeout
- duplicate callback
- delayed success callback
- delayed failure callback
- user redirect abandonment
- provider reference mismatch

Bu yüzden:
- provider_reference saklanmalı
- callback doğrulaması yapılmalı
- replay/idempotency guard zorunlu olmalı
- pending_provider state’i gerçek bir state olarak düşünülmelidir

---

## 13. AUDIT / EVENT NOKTALARI

Payment owner sistemi en az şu olayları üretebilmelidir:

- payment_attempt_created
- payment_method_selected
- payment_authorization_started
- payment_pending_provider
- payment_authorized
- payment_captured
- payment_failed
- payment_cancelled
- payment_expired
- payment_refund_started
- payment_refunded_partially
- payment_refunded_fully

Bu event’ler:
- analytics
- finance
- support
- order create tetikleme
- fraud/risk
alanlarında kullanılabilir.

Net kural:
event, bilgilendirme ve zincir tetikleme içindir; owner truth mutation yerine geçmez.

---

## 14. IDEMPOTENCY KURALI

Aşağıdaki alanlarda idempotency zorunludur:

- payment_attempt create
- provider callback consume
- captured sonucu order create command üretimi
- refund execute
- duplicate callback işleme

En az şu anahtarlar gerekir:
- payment_attempt_id
- checkout_id + provider
- provider_reference
- external callback event id

Bu koruma olmazsa:
- double charge
- duplicate order
- yanlış settlement
- hatalı refund
oluşabilir.

---

## 15. HATA VE KULLANICI GORUNURLUGU

Kullanıcıya ödeme hataları sade ve eyleme dönük gösterilmelidir:

- kart reddedildi
- ödeme tamamlanamadı
- sağlayıcıya ulaşılamadı
- işlem zaman aşımına uğradı
- tekrar dene / farklı yöntem kullan

Kullanıcıya:
- ham provider hata dili
- iç sistem state adı
- teknik reference
doğrudan gösterilmez.

---

## 16. MOBIL ONCELIKLI TASARIM NOTU

Payment ekranı mobil öncelikli olmalıdır:

- mümkün olan en kısa akış
- dikkat dağıtmayan ödeme alanı
- güven sinyalleri görünür
- geri dönüş / retry dili net
- provider redirect/3DS dönüşleri kırılmadan yönetilir

---

## 17. KISA OZET

Doğru payment omurgası şudur:

- checkout valid context üretir
- payment attempt açılır
- provider ile tahsilat yapılır
- captured sonucu order create hakkı doğar
- refund execution payment/financial alanda yürür

Bu nedenle payment state machine bağımsız tutulmalı ve order/settlement ile güvenli biçimde bağlanmalıdır.