# PHASE-04-ORDER-FULFILLMENT-DELIVERY-RETURN-REFUND-READINESS.md

## 1. Fazın Amacı

Bu fazın amacı, Hedihup platformunda ödeme sonucu netleştikten sonra başlayan sipariş, sipariş operasyonu, fulfillment, kargo/teslimat, iade/iptal ve refund zincirini production-readiness seviyesine getirmektir.

Bu fazın ana ayrımı:

```text
Payment succeeded ≠ order created
Order created ≠ fulfilled
Delivered ≠ review/story written
Return approved ≠ refund completed
Refund completed ≠ settlement adjusted
```

Bu faz payment provider canlı entegrasyonu fazı değildir. Payment sonucu PHASE-03’te güvenli biçimde netleşmiş olmalıdır. Bu faz, o güvenli sonucu order owner zincirine doğru ve duplicate-safe biçimde taşır.

---

## 2. Fazın Kapsamı

Bu faz aşağıdaki alanları kapsar:

- sipariş sistemi
- ödeme sonrası order handoff
- order create idempotency
- order detail/read projection
- sipariş operasyon sistemi
- fulfillment / supplier preparation
- shipment / carrier boundary
- order tracking
- delivery lifecycle
- delivery proof
- delivery → review/story eligibility
- cancel / return request
- return approval lifecycle
- refund request / refund execution boundary
- partial delivery / partial return / partial refund
- user-facing order visibility
- support escalation trigger points

---

## 3. Fazın Kapsam Dışı Alanları

Bu fazda yapılmayacak işler:

- PayTR live provider doğrulaması
- Payment status inquiry / reconciliation foundation
- Settlement calculation
- Payout execution
- Reward point ledger settlement
- Full finance dashboard
- Full admin panel redesign
- Full frontend visual polish
- Production deployment gate

Bu faz, order ve satış sonrası operasyonun business correctness hattıdır. Finansal mutabakat ve payout PHASE-05’e bırakılır.

---

## 4. Referans Sistem Dosyaları

Bu fazda esas alınacak sistem dosyaları:

1. `15-ödeme sistemi.md`
2. `16-sipariş sistemi.md`
3. `17-kargo teslimat sistemi.md`
4. `18-iptal iade sistemi.md`
5. `30-sipariş takip sistemi.md`
6. `31-yorum puanlama sistemi.md`
7. `34-kullanıcı story sistemi.md`
8. `47-finansal mutabakat hakedis sistemi.md`
9. `53-destek ticket operasyon sistemi.md`
10. `45-sipariş operasyon sistemi.md`
11. `25-kural -yetki sistemi.md`
12. `OWNER_MATRIX.md`
13. `GUARD_MATRIX.md`
14. `PERMISSION_MATRIX.md`
15. `TRANSITION_POLICIES.md`
16. `CRITICAL_JOURNEY_CHECKLIST.md`
17. `ACCEPTANCE_CRITERIA_PACK.md`
18. `TEST_STRATEJISI.md`

---

## 5. Referans Kayıt Dosyaları

Bu fazda özellikle şu kayıtlar dikkate alınır:

- `63-IMPLEMENTATION_PROGRESS_MASTER_BIRLESTIRILMIS.md`
- `64-PACKAGE_EXECUTION_LOG_BIRLESTIRILMIS.md`
- `65-ACTIVE_RISKS_AND_DECISIONS-CONSOLIDATED.md`
- `HARDENING-00-05E-CONSOLIDATED-REFERENCE-RECORD.md`
- `HARDENING-08-09-CONSOLIDATED-REFERENCE-RECORD.md`
- `HARDENING-10-CALLBACK-MASTER-REFERENCE.md`
- `HARDENING-10C10 — PayTR Status Inquiry / Payment Reconciliation Birleşik Referans Dosyası`
- `PX_DOMAIN_IMPLEMENTATION_REFERENCE_RECORD.md`
- `01-SYSTEM_TO_IMPLEMENTATION_MAPPING.md`
- `02-CURRENT_STATE_BASELINE.md`
- `03-PRODUCTION_READINESS_PHASE_MASTER_PLAN.md`
- `04-PRODUCTION_READINESS_RISK_REGISTER.md`
- `09-RELEASE_BLOCKER_REGISTER.md`

---

## 6. Önceden Yapılmış İşler

### 6.1 Payment → Order Foundation

Kayıtlara göre:

- P14 — Payment → Order Foundation — PASS

Bu kayıt order creation foundation hattının kurulduğunu gösterir. Ancak HARDENING-10C10 sonrası reconciliation ile netleşmiş payment sonucundan order handoff henüz açılmamıştır.

Kritik not:

```text
HARDENING-10C10 order handoff paketi değildir.
```

### 6.2 Order Read / Detail Foundation

- P15 — Order Read / Order Detail Foundation — PASS

Bu kayıt order visibility/read model foundation olduğunu gösterir.

### 6.3 Shipment / Delivery Foundation

- P16 — Shipment / Delivery Foundation — PASS
- HARDENING-09 shipment provider boundary foundation — PASS

Bu kayıt shipment foundation ve provider boundary olduğunu gösterir. Ancak gerçek carrier provider / tracking callback production flow yoktur.

### 6.4 Cancel / Return Foundation

- P17 — Cancel / Return Foundation — PASS

Bu kayıt cancel/return foundation olduğunu gösterir.

### 6.5 Refund Foundation

- P18 — Refund Foundation — PASS

Bu kayıt refund foundation olduğunu gösterir. Ancak refund execution ve finance/settlement impact ayrımı PHASE-05 ile birlikte doğrulanmalıdır.

### 6.6 Customer Support / Order Visibility

- PX-KULLANICI-07 — Customer Support / Order Visibility Boundary — PASS

Bu kayıt customer support / order visibility boundary için foundation sağlar.

---

## 7. Önceden Ertelenmiş / Sınırlı Bırakılmış İşler

Bu faza devreden ana limitation ve borçlar:

1. Reconciliation sonrası order handoff yok
2. Duplicate payment success → duplicate order engeli kanıtlanmalı
3. Order creation idempotency key modeli netleşmeli
4. Shipment provider gerçek carrier integration yok
5. Delivery proof / delivery event production davranışı netleşmeli
6. Delivery sonrası review/story eligibility E2E doğrulanmalı
7. Return approved ≠ refund completed ayrımı korunmalı
8. Refund completed sonrası settlement adjustment PHASE-05’e devredilmeli
9. Partial return/refund detayları netleşmeli
10. Order tracking frontend acceptance PHASE-10’a bağlıdır
11. Support escalation integration PHASE-08/09 ile bağlıdır

---

## 8. Bu Fazda Yapılacak İşler

### 8.1 Payment Succeeded → Order Handoff Uygulama / Doğrulama

Kontrol edilecek:

- Payment SUCCEEDED sonrası order create hangi owner command ile başlıyor?
- Order owner payment sonucunu nasıl doğruluyor?
- Reconciled payment ile normal callback success aynı eligibility modelini mi kullanıyor?
- Risk hold varsa order handoff duruyor mu?
- Handoff event mi, command mi, internal trigger mı?
- BFF veya event doğrudan order yaratıyor mu?

Beklenen sonuç:

```text
Order yalnız order owner command ile ve duplicate-safe oluşturulur.
```

---

### 8.2 Order Create Idempotency

Kontrol edilecek:

- Order create idempotency key nasıl üretiliyor?
- `paymentId`, `paymentAttemptId`, `checkoutId` veya composite key kullanımı net mi?
- Aynı paymentAttempt için ikinci order engelleniyor mu?
- Retry sırasında order create tekrar çalışırsa aynı order mı dönüyor?
- Unknown/failed/cancelled payment order oluşturamıyor mu?

Beklenen sonuç:

```text
Aynı ödeme girişimi ikinci order üretmemelidir.
```

---

### 8.3 Order State Lifecycle

Kontrol edilecek:

- Order created
- confirmed
- in_operation
- preparing
- shipped
- delivered
- cancelled
- returned / partially_returned
- closed

gibi state’ler sistem dosyaları ve transition policy ile uyumlu mu?

Beklenen sonuç:

```text
Order lifecycle operation, shipment, return ve finance etkilerini karıştırmamalıdır.
```

---

### 8.4 Order Read / Visibility

Kontrol edilecek:

- Registered user yalnız kendi order’larını görebiliyor mu?
- Guest order visibility nasıl sağlanıyor?
- Suspended/restricted user visibility nasıl çalışıyor?
- Support/order visibility boundary korunuyor mu?
- Order tracking projection truth gibi davranıyor mu?

Beklenen sonuç:

```text
Order read projection order truth değildir; visibility guard ile çalışır.
```

---

### 8.5 Fulfillment / Order Operations

Kontrol edilecek:

- Order oluşturulduktan sonra supplier/order operations kuyruğuna nasıl düşüyor?
- Supplier sadece kendi fulfillment scope’unu görüyor mu?
- Operation team hangi durumlarda müdahale ediyor?
- Order operation state order truth ile karışıyor mu?
- Manual operation action protected command ile mi çalışıyor?

Beklenen sonuç:

```text
Order truth ile order operation queue ayrı ama uyumlu çalışmalıdır.
```

---

### 8.6 Shipment / Carrier Boundary

Kontrol edilecek:

- Shipment creation hangi koşulda başlıyor?
- Carrier provider sonucu business truth mu?
- Tracking number ve carrier reference nerede tutuluyor?
- Carrier callback varsa shipment owner command’e nasıl dönüşüyor?
- Duplicate carrier event ikinci delivery effect üretüyor mu?
- Carrier failure shipment state’i nasıl etkiliyor?

Beklenen sonuç:

```text
Carrier provider sonucu shipment truth değildir; shipment owner state transition guard’dan geçer.
```

---

### 8.7 Delivery Lifecycle

Kontrol edilecek:

- Shipped → delivered transition guard’ları
- Delivery proof
- Partial delivery
- Delivery failed
- Delivery retry
- Delivered timestamp
- Delivered sonrası user visibility

Beklenen sonuç:

```text
Delivered state yalnız shipment/delivery owner tarafından doğrulanmış transition ile oluşmalıdır.
```

---

### 8.8 Delivery → Review / Story Eligibility

Kontrol edilecek:

- Delivered order line review eligible yapıyor mu?
- Delivered order line user product story eligible yapıyor mu?
- Partial delivery durumunda yalnız ilgili line eligible oluyor mu?
- Return/refund sonrası eligibility etkisi ne?
- Eligibility owner alanında mı hesaplanıyor?
- UI/BFF eligibility truth üretiyor mu?

Beklenen sonuç:

```text
Delivered ≠ review/story written.
Delivered yalnız eligibility açabilir.
```

---

### 8.9 Cancel / Return Lifecycle

Kontrol edilecek:

- Cancel hangi order state’lerinde mümkün?
- Return request hangi koşullarda açılır?
- Return window / return eligibility nasıl hesaplanır?
- Return approved, rejected, received, completed state’leri net mi?
- Partial return nasıl işlenir?
- Return request support ticket’a dönüşüyor mu, dönüşmemeli mi?

Beklenen sonuç:

```text
Return eligibility auth ile değil lifecycle ve policy ile açılır.
```

---

### 8.10 Refund Boundary

Kontrol edilecek:

- Return approved refund completed demek mi?
- Refund execution hangi owner alanında yapılır?
- Payment refund provider boundary var mı?
- Refund status order state’i doğrudan mutate ediyor mu?
- Refund completed settlement adjustment’ı doğrudan yapıyor mu?
- Duplicate refund engeli var mı?

Beklenen sonuç:

```text
Refund execution finansal etkidir; order/commerce truth ile karıştırılmamalıdır.
```

---

### 8.11 Support / Escalation Touchpoints

Kontrol edilecek:

- Order issue support ticket’a nasıl bağlanır?
- Delivery issue operations queue’ya nasıl escalate edilir?
- Refund dispute finance queue’ya nasıl geçer?
- Fraud suspicion risk queue’ya nasıl geçer?
- Support team owner state mutate ediyor mu?

Beklenen sonuç:

```text
Support ticket çözüm orkestrasyonudur; owner truth mutation yerine geçmez.
```

---

## 9. Bu Fazda Yapılmayacak İşler

Bu fazda bilinçli olarak yapılmayacaklar:

- settlement line generation finalization
- payout batch creation
- reward point ledger settlement
- full finance dashboard
- full carrier live integration deploy
- full frontend visual polish
- full BI/reporting
- production deployment

---

## 10. Owner / Guard / Permission Kuralları

### 10.1 Owner Boundary

Bu fazda korunacak sınırlar:

- Order owner order truth mutate eder
- Shipment/delivery owner shipment state mutate eder
- Finance owner refund financial execution / settlement mutate eder
- Support owner ticket truth yönetir
- Risk owner signal/hold/review üretir; order/payment truth mutate etmez
- BFF read/delegation yapar; truth üretmez
- Panel protected command gönderir; direct write yapmaz

### 10.2 Guard Kuralları

Zorunlu guard aileleri:

- authentication guard
- role/scope guard
- ownership guard
- eligibility guard
- state/lifecycle guard
- risk/financial block guard
- idempotency/replay guard

### 10.3 Permission Kuralları

- Can_View_Orders yalnız kendi order’ları için çalışır
- Can_Request_Return auth ile değil return eligibility ile açılır
- Support access order visibility yerine geçmez
- Supplier order operation scope kendi sipariş satırlarıyla sınırlıdır
- Admin direct mutation hakkı değildir; protected action kullanır

### 10.4 Transition Kuralları

Korunacak ayrımlar:

- payment succeeded ≠ order created
- order created ≠ shipped
- shipped ≠ delivered
- delivered ≠ review/story written
- return requested ≠ return approved
- return approved ≠ refund completed
- refund completed ≠ settlement adjusted
- support ticket opened ≠ owner state changed

---

## 11. Riskler

### 11.1 RB-003 — Payment Succeeded → Order Handoff Yok

PHASE-04’ün ana ödeme sonrası blocker’ıdır. PHASE-03 ile birlikte kapanmalıdır.

### 11.2 RB-007 — Refund / Settlement / Payout E2E Yok

Bu faz refund tarafını ele alır; settlement/payout PHASE-05’e devredilir.

### 11.3 Duplicate Order Riski

Idempotency eksikse aynı ödeme girişiminden birden fazla order oluşabilir.

### 11.4 Delivery Eligibility Riski

Delivered olmadan review/story hakkı açılırsa sosyal/puan sistemi manipüle edilebilir.

### 11.5 Refund / Order / Finance Karışma Riski

Refund completed, settlement adjusted veya order returned ile karıştırılırsa finansal doğruluk bozulur.

### 11.6 Support Owner Boundary Riski

Support agent doğrudan order/refund/finance state mutate ederse owner boundary bozulur.

---

## 12. Kabul Kriterleri

PHASE-04 kapanışı için minimum kabul kriterleri:

1. Payment succeeded → order handoff owner-boundary-safe doğrulanmalı
2. Duplicate order idempotency doğrulanmalı
3. Failed/cancelled/unknown payment order oluşturamamalı
4. Order lifecycle transition’ları net olmalı
5. Order read/visibility guard doğrulanmalı
6. Order operation / supplier fulfillment scope doğrulanmalı
7. Shipment provider boundary doğrulanmalı
8. Delivered state guard ile oluşmalı
9. Delivery → review/story eligibility doğrulanmalı
10. Return eligibility ve lifecycle doğrulanmalı
11. Refund boundary doğrulanmalı
12. Support/escalation owner boundary korunmalı
13. Targeted order/fulfillment/return smoke/test kanıtı alınmalı
14. Risk ve release blocker register güncellenmeli

---

## 13. Test / Smoke / Runtime Kanıtları

Bu faz kod/source/runtime etkili fazdır.

Minimum önerilen kanıtlar:

```text
- pnpm run typecheck
- pnpm run build
- payment succeeded → order handoff smoke
- duplicate payment success → single order smoke
- failed/cancelled/unknown payment → no order smoke
- order read / visibility smoke
- order → shipment smoke
- shipment → delivered smoke
- delivered → review/story eligibility smoke
- return request / approval smoke
- refund boundary smoke
- support escalation boundary review
```

Acceptance bağlantıları:

- Journey 05 — payment → order
- Journey 06 — order → shipment
- Journey 07 — delivery → review/story eligibility
- Journey 08 — delivery → return/refund impact

---

## 14. Kapanış Kontrol Listesi

```text
[ ] Payment succeeded → order handoff doğrulandı
[ ] Duplicate order idempotency doğrulandı
[ ] Failed/cancelled/unknown payment no-order doğrulandı
[ ] Order state lifecycle kontrol edildi
[ ] Order read/visibility guard kontrol edildi
[ ] Supplier fulfillment scope kontrol edildi
[ ] Order operation queue kontrol edildi
[ ] Shipment provider boundary kontrol edildi
[ ] Delivery transition guard kontrol edildi
[ ] Delivery proof / delivered timestamp kontrol edildi
[ ] Delivery → review/story eligibility kontrol edildi
[ ] Return eligibility kontrol edildi
[ ] Return approved ≠ refund completed ayrımı kontrol edildi
[ ] Refund execution owner boundary kontrol edildi
[ ] Support/escalation boundary kontrol edildi
[ ] Targeted smoke/test kanıtı alındı
[ ] RB-003 güncellendi
[ ] RB-007 güncellendi
[ ] Risk register güncellendi
[ ] Release blocker register güncellendi
[ ] Faz kapanış raporu üretildi
```

---

## 15. Faz Sonu Kararı İçin Beklenen Sonuç

Bu fazın ideal hedef kararı:

```text
PASS
```

Ancak settlement/payout gibi finansal etkiler PHASE-05’e devredileceği için ilk kapanışta şu karar da kabul edilebilir:

```text
PASS WITH LIMITATION
```

### PASS Şartı

- Order handoff owner-boundary-safe çalışıyor
- Duplicate order engeli kanıtlandı
- Shipment/delivery lifecycle doğru
- Return/refund boundary doğru
- Delivery eligibility doğru
- Release blocker kalmadı

### PASS WITH LIMITATION Şartı

- Order/fulfillment/return/refund ana zinciri çalışıyor
- Settlement/payout finansal etkileri PHASE-05’e kontrollü devredildi
- Frontend UI acceptance PHASE-10/11’e kontrollü devredildi

### PARTIAL Şartı

- Order handoff belirsiz
- Duplicate order testi yok
- Delivery eligibility belirsiz
- Refund boundary belirsiz
- Test kanıtı eksik

### FAIL Şartı

- Payment succeeded BFF/event ile doğrudan order yaratıyor
- Duplicate order oluşuyor
- Delivered olmadan review/story hakkı açılıyor
- Refund order/finance truth’u karıştırıyor
- Owner boundary ihlali var

---

## 16. Sonraki Faza Devredenler

PHASE-05’e devredenler:

- refund completed → settlement adjustment
- settlement line generation
- payable lifecycle
- payout batch
- financial corrections
- reward point impact

PHASE-08’e devredenler:

- order operations admin queue
- supplier fulfillment panel
- support ticket escalation UI
- finance/refund dispute queues

PHASE-10’a devredenler:

- order tracking UI
- return/refund request UI
- delivery status UI
- support bridge UI

PHASE-11’e devredenler:

- payment → order critical journey
- order → shipment critical journey
- delivery → review/story eligibility critical journey
- delivery → return/refund impact critical journey

---

## 17. Nihai Faz Açılış Kararı

PHASE-04 şu şartla başlatılabilir:

```text
PHASE-03 Payment / Provider / Callback / Reconciliation Readiness en az PASS WITH LIMITATION olarak kapanmış olmalıdır.
```

Planlama seviyesi için bu dosya hazırdır.

Gerçek uygulama/kapanış için repo source review, order handoff kanıtı, targeted smoke/test ve boundary review gereklidir.

Net açılış kararı:

```text
PHASE-04 Order / Fulfillment / Delivery / Return / Refund Readiness planı hazırdır.
```
