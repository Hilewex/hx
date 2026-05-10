# INTEGRATION_BEHAVIOR_RULES

Bu dosya, Aşama 6 kapsamında platformun 3. parti entegrasyonlarında uygulanacak davranış kurallarını tanımlar.

Amaç:
- dış sağlayıcı entegrasyonlarını aynı kalite standardında yönetmek
- provider çağrısı, callback, sonuç işleme, retry, duplicate koruması ve truth mutation sırasını netleştirmek
- payment, shipment, notification, payout ve diğer dış entegrasyonlarda ortak davranış dili kurmak

Net kural:
- provider owner truth değildir
- provider sonucu geldi diye truth otomatik oluşmuş sayılmaz
- owner sistem sonucu doğrular, state mutation yapar, sonra yan etkiler yayılır
- callback / webhook / async result duplicate işlenmemelidir
- provider failure ile domain failure aynı şey değildir
- external success ile internal finalization aynı şey değildir

---

## 1. KAPSAM

Bu kurallar şu entegrasyon alanları için geçerlidir:

- Payment provider
- Carrier / shipment provider
- Email provider
- Push provider
- Payout provider
- Media/CDN provider
- Harici fraud provider (ileride)
- E-fatura / e-arşiv provider (ileride)

İlk fazda ağırlık şu aktif alanlardadır:
- Payment
- Carrier
- Email sandbox
- Payout sandbox

---

## 2. ORTAK DAVRANIS ILKELERI

## 2.1 Provider owner değildir
Her dış sağlayıcı yalnız dış sistemdir.
Owner truth şu alanlarda kalır:
- payment sonucu = Payment owner
- shipment event sonucu = Shipment/Delivery owner
- payout sonucu = Payout owner
- notification intent = Notification orchestration owner

## 2.2 Dış başarı != iç final başarı
Örnek:
- payment provider captured dedi diye order created olmaz
- carrier delivered dedi diye eligibility otomatik active sayılmaz
- payout provider paid dedi diye settlement mantığı yeniden hesaplanmaz
- email provider sent dedi diye order truth değişmez

## 2.3 Sonuç işleme sırası
Doğru sıra:

1. external response/callback gelir
2. owner sistem sonucu doğrular
3. duplicate/idempotency kontrolü yapılır
4. state guard kontrolü yapılır
5. owner truth mutate edilir
6. event / yan etki / notification yayılır

## 2.4 Duplicate-safe işleme zorunludur
Webhook/callback/event gelen tüm entegrasyonlar:
- idempotent
- duplicate-safe
- state-aware
olmalıdır

## 2.5 Timeout ve geç cevap kuralı
Provider zaman aşımına düştü diye işlem kesin başarısız kabul edilmez.
Önce:
- state unknown / pending provider
- reconciliation / callback bekleme
- kontrollü retry
yaklaşımı düşünülmelidir

---

## 3. ENTEGRASYON DAVRANIS SINIFLARI

---

## 3.1 Request/response senkron entegrasyon
Örnek:
- payment initiate
- shipment create request
- payout batch submit
- email send request

Kurallar:
- response anlık gelir
- ama domain final sonucu response ile aynı şey olmayabilir
- response “accepted / pending / failed to submit” olabilir

## 3.2 Callback/webhook entegrasyon
Örnek:
- payment capture callback
- carrier delivery callback
- payout result callback

Kurallar:
- callback idempotent işlenir
- event_id / provider reference ile dedupe yapılır
- callback arrival order garantili varsayılmaz
- eski callback yeni state’i bozamaz

## 3.3 Polling / reconciliation entegrasyon
Örnek:
- provider sonucu callback gelmediyse status query
- shipment tracking refresh
- payout batch execution reconciliation

Kurallar:
- polling callback’in yerine geçmez ama tamamlayıcı olabilir
- polling sonucu da duplicate/state guard ile işlenir

---

## 4. PAYMENT DAVRANIS KURALLARI

### 4.1 Provider seçimi
- Primary aktif sağlayıcı: PayTR
- Secondary-ready sağlayıcı: iyzico
- seçim payment abstraction altında yapılır
- app/public/panel katmanı provider adıyla konuşmaz

### 4.2 Initiation davranışı
Payment start sırasında:
- checkout validated context alınır
- active provider adapter seçilir
- provider initiate çağrısı yapılır
- sonuç:
  - accepted
  - pending_provider
  - failed_to_initiate
  olabilir

### 4.3 Capture / callback davranışı
Provider callback geldiğinde:
- provider_event_id / provider_reference ile dedupe yapılır
- payment mevcut state’i okunur
- geçersiz transition engellenir
- payment state owner alanda güncellenir

### 4.4 Order create ayrımı
Payment captured sonucu:
- order create hakkı doğurur
- ama order create ayrıca internal idempotent command’dir

Net kural:
`payment captured` != `order created`

### 4.5 Provider switch davranışı
PayTR aktif sağlayıcıdır.
iyzico:
- hazır secondary adapter olarak bulunur
- gerektiğinde aktif routing değiştirilebilir
- bu değişim payment abstraction seviyesinde yapılır

---

## 5. CARRIER / SHIPMENT DAVRANIS KURALLARI

### 5.1 Carrier abstraction
Sistem tek taşıyıcıya özel yazılmaz.
Tek carrier abstraction bulunur.
Altında farklı taşıyıcı adapter’ları eklenebilir.

### 5.2 İlk faz kuralı
- multi-carrier uyumlu mimari kurulur
- ilk aktif gerçek taşıyıcı sayısı: 1

### 5.3 Shipment create davranışı
Shipment owner sistemi:
- order/shipment readiness doğrular
- carrier adapter’a create gönderir
- carrier response sonucu normalize eder
- internal shipment truth’u günceller

### 5.4 Tracking / delivery event davranışı
Carrier event geldiğinde:
- raw event saklanabilir
- normalized event type çıkarılır
- dedupe yapılır
- DeliveryEvent append edilir
- shipment state gerekiyorsa güncellenir

### 5.5 Eligibility propagation ayrımı
Carrier delivered sonucu:
- doğrudan review/story/verified purchase truth’u yazmaz
- önce Shipment/Delivery owner normalize eder
- sonra eligibility propagation tetiklenir

Net kural:
`carrier delivered` != `eligibility active`

---

## 6. EMAIL DAVRANIS KURALLARI

### 6.1 İlk faz kuralı
- gerçek provider zorunlu değil
- sandbox ile başlanır

### 6.2 Notification ayrımı
Order/shipment/return/payout gibi işlemler:
- önce domain truth
- sonra notification intent
- sonra email send attempt

### 6.3 Email başarısızlığı
Email gönderilemedi diye:
- order
- shipment
- refund
- payout
geri alınmaz

### 6.4 Retry
Email send failure:
- retry-safe ise tekrar denenebilir
- notification log / audit izi tutulur

---

## 7. PUSH DAVRANIS KURALLARI

### 7.1 İlk faz kuralı
- push provider park edilir
- gerçek entegrasyon ilk fazda yapılmaz

### 7.2 Hazırlık kuralı
Push alanı sonraki fazda açılabilecek şekilde:
- notification intent tipi
- channel abstraction
tasarlanabilir

Ama gerçek token/device yönetimi ilk faz kapsamı değildir.

---

## 8. PAYOUT DAVRANIS KURALLARI

### 8.1 İlk faz kuralı
- payout domain modeli aktif olabilir
- gerçek dış payout provider entegrasyonu ilk fazda aktif değildir
- sandbox/park yaklaşımı uygulanır

### 8.2 Payout sonucu ayrımı
Settlement line:
- payable hale gelir
- payout batch’e girer
- payout provider sonucu gelirse batch/item state owner alanda güncellenir

Net kural:
`settlement payable` != `payout paid`

### 8.3 Batch ve item ayrımı
Payout sonucu:
- batch düzeyi
- item düzeyi
ayrı ele alınır

Kısmi başarı varsa:
- batch tamamen başarılı sayılmaz
- item bazlı result korunur

---

## 9. FRAUD / RISK DAVRANIS KURALLARI

### 9.1 İlk faz kuralı
- harici fraud provider yok
- iç kural tabanlı risk mantığı çalışır

### 9.2 İç risk motoru davranışı
Aşağıdaki sinyaller üretilebilir:
- block
- hold
- manual review
- soft warning

### 9.3 Harici provider’a hazırlık
İleride dış fraud servisi eklenirse:
- yalnız risk signal sağlar
- owner kararını override etmez
- payment/payout/abuse guard owner sistemde uygulanır

---

## 10. MEDIA / CDN DAVRANIS KURALLARI

### 10.1 İlk faz kuralı
- gerçek media/CDN vendor entegrasyonu aktif değildir
- bu alan park edilir

### 10.2 Hazırlık kuralı
Media alanı şu ayrımı korumalı:
- uploaded
- processed
- ready
- published

Net kural:
`upload tamamlandı` != `yayına hazır`

Bu davranış gerçek vendor sonradan geldiğinde de korunmalıdır.

---

## 11. E-FATURA / E-ARSIV DAVRANIS KURALLARI

### 11.1 İlk faz kuralı
- entegrasyon sonraya bırakılmıştır

### 11.2 Kural
Bu alan unutulmuş değil, bilinçli ertelenmiştir.
İleride eklendiğinde:
- finance yan alanı olarak ele alınır
- payment/order truth’unun yerine geçmez
- belge üretimi ayrı akış olur

---

## 12. FALLBACK DAVRANIS PRENSIPLERI

### 12.1 Provider unreachable
Eğer provider erişilemezse:
- domain state doğrudan “başarısız” yazılmaz
- önce durum sınıflanır:
  - failed_to_submit
  - pending_provider
  - unknown_result
  - degraded_external

### 12.2 Provider rejected
Eğer provider kesin red dönerse:
- domain owner red sebebini normalize eder
- uygun error code üretir
- tekrar denenebilirlik ayrı değerlendirilir

### 12.3 Provider success ama internal failure
Örnek:
- payment captured oldu ama order create başarısız
- payout provider paid dedi ama internal result ingestion yarım kaldı

Bu durumda:
- external result kaybolmaz
- reconciliation / retry / manual incident süreci gerekir

---

## 13. RECONCILIATION KURALI

Aşağıdaki alanlarda reconciliation tasarlanmalıdır:
- payment status
- payout result
- shipment tracking/delivery
- email send logs gerekiyorsa

Reconciliation şu soruyu çözer:
“Provider’da olan şey ile owner sistemde görünen şey aynı mı?”

---

## 14. AUDIT VE GÖZLEMLENEBILIRLIK KURALI

Kritik entegrasyonlarda minimum iz:
- request_id
- command_id
- provider_reference
- provider_event_id
- adapter_name
- previous_state
- next_state
- result_type

Kritik audit alanları:
- payment capture/cancel/refund
- shipment delivered/failed
- payout result
- finance/sandbox override
- provider switch

---

## 15. IMPLEMENTASYON ICIN NET KARARLAR

1. Payment provider abstraction zorunludur
2. PayTR primary aktif provider olur
3. iyzico secondary-ready adapter olarak tutulur
4. Carrier abstraction zorunludur
5. İlk fazda 1 gerçek taşıyıcı aktif edilir
6. Email sandbox ile başlar
7. Push park edilir
8. Fraud iç kuralla yürür
9. Payout gerçek provider olmadan sandbox/park mantığında ilerler
10. Media/CDN ve e-fatura/e-arşiv sonraki faza bırakılır
11. External success ile internal final truth aynı kabul edilmez
12. Tüm callback/webhook alanları duplicate-safe işlenir

---

## 16. KISA OZET

Doğru entegrasyon davranış modeli şudur:

- dış sağlayıcılar owner değildir
- provider sonucu owner sistemde normalize edilir
- truth mutation ve yan etki sırası korunur
- duplicate/callback/retry davranışı açık tanımlanır
- payment, shipment, email, payout ve diğer entegrasyonlar aynı şablonla değil, alan bazlı kuralla yönetilir
- ilk faz karmaşayı artırmayacak şekilde sınırlı gerçek entegrasyon + kontrollü sandbox/park yaklaşımı ile ilerler