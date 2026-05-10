# TRANSITION_POLICIES

Bu dosya, Aşama 3 boyunca tanımlanan tüm state machine’lerin ortak geçiş politikalarını üst seviyede sabitler.

Amaç:
- state geçişlerini dağınık değil, ortak ilkeye bağlı hale getirmek
- hangi geçişin kim tarafından tetiklenebileceğini netleştirmek
- geri döndürülebilir ve geri döndürülemez geçişleri ayırmak
- audit, owner, eligibility ve idempotency etkilerini tek çatı altında toplamak

Bu dosya, aşağıdaki state machine dosyalarının ortak politika özetidir:
- `STATE_MACHINES/checkout.md`
- `STATE_MACHINES/payment.md`
- `STATE_MACHINES/order.md`
- `STATE_MACHINES/shipment-delivery.md`
- `STATE_MACHINES/cancel-return.md`
- `STATE_MACHINES/support-ticket.md`
- `STATE_MACHINES/moderation-item.md`
- `STATE_MACHINES/creator-lifecycle.md`
- `STATE_MACHINES/supplier-lifecycle.md`
- `STATE_MACHINES/settlement-line.md`
- `STATE_MACHINES/payout-batch.md`

---

## 1. TEMEL ILKE

State transition, basit alan güncellemesi değildir.

Her transition:
- belirli bir owner alanında çalışır
- belirli bir aktör veya sistem tarafından tetiklenir
- guard zincirinden geçer
- çoğu kritik durumda audit izi bırakır
- bazı durumlarda event üretir
- bazı durumlarda başka domain zincirlerini tetikler

Net kural:
State geçişi, yalnız “status alanını değiştirmek” olarak ele alınamaz.

---

## 2. TRANSITION TETIKLEYICI TURLERI

Bir geçiş aşağıdaki türlerden biriyle tetiklenebilir:

### 2.1 User-triggered transition
Son kullanıcı aksiyonu ile başlar.

Örnek:
- checkout başlatma
- payment başlatma
- review yazma
- return request oluşturma
- support ticket açma

### 2.2 Panel-triggered transition
Panel kullanıcısı aksiyonuyla başlar.

Örnek:
- creator approve/reject
- supplier restrict/suspend
- moderation approve/reject
- payout hold/release
- campaign rule change

### 2.3 System-triggered transition
Owner sistemin iç kuralı veya iş akışıyla çalışır.

Örnek:
- checkout reviewing → ready_for_payment
- order confirmed → in_operation
- settlement pending → settled
- batch validating → ready

### 2.4 Integration-triggered transition
Dış sağlayıcı callback’i veya dış entegrasyon sonucu ile çalışır.

Örnek:
- payment pending_provider → captured
- shipment in_transit → delivered
- payout submitted → processed

### 2.5 Time-triggered transition
Süre/TTL/pencere dolması ile çalışır.

Örnek:
- checkout → expired
- payment → expired
- campaign active window kapanışı
- return eligibility penceresi sonu

---

## 3. TRANSITION SINIFLARI

Transition’lar aşağıdaki iş etkisi sınıflarına ayrılır:

### 3.1 Readiness transitions
Bir şeyi sonraki aşamaya hazır hale getirir.

Örnek:
- checkout reviewing → ready_for_payment
- payout validating → ready

### 3.2 Result transitions
Bir sürecin sonucunu üretir.

Örnek:
- payment → captured / failed
- shipment → delivered / delivery_failed
- moderation → approved / rejected

### 3.3 Restriction transitions
Hak veya görünürlüğü daraltır.

Örnek:
- creator → restricted
- supplier → suspended
- moderation item → restricted / taken_down
- settlement → blocked

### 3.4 Corrective transitions
Bir önceki etkinin finansal/operasyonel düzeltmesini yapar.

Örnek:
- settlement → adjusted / reversed
- payment → refunded_partially / refunded_fully
- order → partially_returned / returned

### 3.5 Finalizing transitions
Aktif yaşamı kapatır.

Örnek:
- ticket → closed
- shipment → closed
- payout batch → closed
- settlement line → closed

---

## 4. GUARD ZORUNLULUGU

Her transition aşağıdaki guard zincirinden uygun olanları geçirmek zorundadır:

- authentication guard
- role / scope guard
- ownership guard
- eligibility guard
- state / lifecycle guard
- risk / moderation / financial block guard
- idempotency / replay guard

Net kural:
Guard zinciri olmadan state mutation yapılmaz.  
Ayrıntılı guard kuralları `GUARD_MATRIX.md` dosyasında sabitlenmiştir.

---

## 5. OWNER KURALI

Her transition yalnız ilgili owner alanda işlenmelidir.

Örnekler:
- checkout owner: checkout transitions
- payment owner: payment transitions
- order owner: order transitions
- financial owner: settlement/payout/refund financial transitions
- moderation owner: moderation transitions
- creator/supplier lifecycle owner: lifecycle transitions

Net kural:
- BFF transition uygulamaz
- panel transition owner değildir
- UI transition owner değildir
- event tek başına owner mutation yerine geçmez

Ayrıntılı owner ayrımları `OWNER_MATRIX.md` dosyasında sabitlenmiştir.

---

## 6. GERI DONDURULEMEZ TRANSITION'LAR

Aşağıdaki tip geçişler genelde geri döndürülemez veya yalnız yeni corrective transition ile telafi edilir:

- payment captured
- shipment delivered
- payout processed
- settlement paid_out
- moderation taken_down sonrası final close
- closed state’ler

Net kural:
Bu tip geçişler “status’u geri almak” ile değil, yeni karşı aksiyon state’i ile yönetilir.

Örnek:
- delivered → geri hazırlama değil
- refunded_fully → yeni charge değil
- closed → doğrudan active değil

---

## 7. GERI DONUSLU TRANSITION'LAR

Bazı alanlarda kontrollü geri dönüş mümkündür:

- invalid → reviewing
- blocked → validating/pending
- waiting_user → in_progress
- restricted → active
- suspended → active
- appealed → overturned / escalated

Net kural:
Geri dönüş, yalnız policy ile açık tanımlanmış state’lerde mümkündür.

---

## 8. CLOSED STATE POLITIKASI

`closed` state’i olan her makinede ortak ilke şudur:

- closed, tarihsel kayıt korur
- closed nesne fiziksel olarak silinmez
- closed nesneye doğrudan aktif state dönüşü yapılmaz
- yeniden açma gerekiyorsa ayrı reopen/escalation/yeniden aktivasyon akışı gerekir

Bu ilke özellikle:
- support ticket
- moderation item
- shipment
- payout batch
- settlement line
- lifecycle dosyaları
için uygulanır.

---

## 9. APPROVED != ACTIVE / SETTLED != PAYABLE / CAPTURED != ORDER

Aşama 3 boyunca tekrar eden en kritik ayrım politikaları:

### 9.1 approved ≠ active
Başvuru onayı ile gerçek aktif kullanım aynı şey değildir.

### 9.2 settled ≠ payable
Finansal kesinleşme ile payout’a hazır olma aynı şey değildir.

### 9.3 payable ≠ paid_out
Ödenebilir olmak ile gerçek ödeme çıkışı aynı şey değildir.

### 9.4 captured ≠ order created
Tahsilat başarısı ile siparişin güvenli oluşumu aynı şey değildir.

### 9.5 delivered ≠ review/story otomatik yazıldı
Teslimat yalnız hak eşiğini açar; aksiyon ayrıca kullanıcıdan gelir.

Net kural:
Ara state’ler asla atlanmamalıdır.

---

## 10. LINE-LEVEL VE AGGREGATE-LEVEL AYRIMI

Aşağıdaki alanlarda üst state ile alt state ayrımı korunmalıdır:

- order ↔ order lines
- shipment ↔ shipment items
- return request ↔ return line effects
- settlement batch görünümü ↔ settlement lines
- payout batch ↔ payout items

Net kural:
Aggregate state sade olabilir; ama line-level truth kaybolamaz.

---

## 11. TRANSITION ICIN AUDIT ZORUNLULUGU

Aşağıdaki sınıflarda audit zorunludur:

- admin approve/reject
- creator/supplier restriction/suspension
- moderation decision
- payout hold/release
- settlement manual adjustment
- campaign / coupon rule changes
- support escalation manual action

User aksiyonlarında her zaman tam audit gerekmeyebilir; ama kritik ticari/finansal/yönetsel geçişlerde audit zorunludur.

---

## 12. TRANSITION ICIN EVENT ZORUNLULUGU

Aşağıdaki sınıflarda event üretimi beklenir:

- checkout readiness
- payment result
- order creation
- shipment delivery result
- cancel/return result
- moderation result
- creator/supplier lifecycle result
- settlement state changes
- payout batch state changes
- support-ticket state changes

Net kural:
Event, state owner mutation yerine geçmez; sonrasında yayınlanır.

---

## 13. TRANSITION ICIN HUMAN REVIEW GEREKTIREN ALANLAR

Aşağıdaki geçişler çoğunlukla insan onayı/incelemesi ister:

- creator approve/reject
- supplier approve/reject
- moderation reject/restrict/taken_down
- payout hold/release
- settlement manual adjustment
- complex cancel/return resolution
- support escalation resolution

---

## 14. TRANSITION ICIN SYSTEM AUTOMATION UYGUN ALANLAR

Aşağıdaki geçişler yüksek oranda otomasyona uygundur:

- checkout reviewing
- payment callback processing
- shipment callback processing
- order create command
- settlement line create
- batch validating
- expiry / abandoned / timeout geçişleri
- analytics event normalization

---

## 15. HATA POLITIKASI

Bir transition başarısız olduğunda şu dört şey net olmalıdır:

1. mevcut state korunuyor mu?
2. intermediate/pending state’e mi geçiliyor?
3. retry mümkün mü?
4. kullanıcıya/panele ne gösteriliyor?

Net kural:
Belirsiz veya yarım state bırakılmamalıdır.
Gerekirse `pending`, `blocked`, `under_review`, `waiting_internal` gibi güvenli ara state’ler kullanılmalıdır.

---

## 16. TRANSITION TASARIMI ICIN KISA KURAL SETI

Her transition tasarlanırken şu sorular cevaplanmalıdır:

- Bunu kim tetikler?
- Hangi owner uygular?
- Hangi guard’lar gerekir?
- Geçiş geri döndürülebilir mi?
- Audit gerekir mi?
- Event gerekir mi?
- Duplicate gelirse ne olur?
- Sonraki domain zinciri ne tetiklenir?

---

## 17. KISA OZET

Aşama 3’teki tüm state machine’ler için ortak anayasa şudur:

- state geçişi ciddi bir domain kararıdır
- owner, guard, audit, event ve idempotency birlikte düşünülür
- ara state’ler atlanmaz
- aggregate ile line-level truth ayrılır
- geri döndürülemez geçişler corrective actions ile yönetilir
- closed state tarihsel kapanıştır, silme değildir