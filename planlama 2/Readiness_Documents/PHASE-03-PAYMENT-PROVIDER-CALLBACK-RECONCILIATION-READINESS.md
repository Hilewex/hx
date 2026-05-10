# PHASE-03-PAYMENT-PROVIDER-CALLBACK-RECONCILIATION-READINESS.md

## 1. Fazın Amacı

Bu fazın amacı, Hedihup platformunda ödeme sağlayıcıları, PayTR entegrasyonu, provider callback, status inquiry, reconciliation ve payment sonucu kesinleşme hattını production-readiness seviyesine getirmektir.

Bu fazın en kritik ayrımı şudur:

```text
Payment succeeded ≠ order created
```

Payment domain yalnız ödeme sonucunu netleştirir. Order oluşturma ayrı owner command zinciriyle yapılmalıdır.

Bu fazın hedefi:

```text
Checkout sonrası ödeme sonucunun güvenli, idempotent, provider-aware ve reconciliation-aware biçimde netleşmesini sağlamak; order handoff için güvenli sınırı hazırlamak.
```

---

## 2. Fazın Kapsamı

Bu faz aşağıdaki alanları kapsar:

- ödeme sistemi
- payment provider boundary
- PayTR initiate / providerReference / merchant_oid stratejisi
- provider callback ingestion
- signature guard
- replay / duplicate guard
- timestamp freshness guard
- public callback rate limit / abuse guard
- PayTR callback mapping
- PayTR status inquiry
- payment reconciliation task / repository
- reconciliation worker dry-run
- controlled payment owner mutation
- payment reconciliation audit/outbox evidence
- unknown-result / pending / timeout behavior
- payment succeeded sonrası order handoff inventory ve boundary hazırlığı
- duplicate payment / duplicate order engeli için karar zemini

---

## 3. Fazın Kapsam Dışı Alanları

Bu fazda yapılmayacak veya bu fazın ana kapanış hedefi olmayacak işler:

- settlement hesaplama
- payout icrası
- refund financial execution
- shipment / fulfillment
- full order operation lifecycle
- full frontend payment UX polish
- full deployment / observability release gate
- full fraud scoring engine
- coupon/finance dağıtımı

Bu faz order handoff kararını hazırlar veya foundation seviyesinde açabilir; fakat finance, settlement ve payout mutation bu fazın işi değildir.

---

## 4. Referans Sistem Dosyaları

Bu fazın ana sistem referansları:

1. `15-ödeme sistemi.md`
2. `16-sipariş sistemi.md`
3. `14-checkout sistemi.md`
4. `47-finansal mutabakat hakedis sistemi.md`
5. `54-payout ödeme çıkış sistemi.md`
6. `49-fraud risk abuse sistemi.md`
7. `48-arka plan analitik ölçümleme sistemi.md`
8. `25-kural -yetki sistemi.md`
9. `OWNER_MATRIX.md`
10. `GUARD_MATRIX.md`
11. `PERMISSION_MATRIX.md`
12. `TRANSITION_POLICIES.md`
13. `CRITICAL_JOURNEY_CHECKLIST.md`
14. `ACCEPTANCE_CRITERIA_PACK.md`
15. `TEST_STRATEJISI.md`

---

## 5. Referans Kayıt Dosyaları

Bu fazda özellikle şu kayıtlar dikkate alınır:

- `63-IMPLEMENTATION_PROGRESS_MASTER_BIRLESTIRILMIS.md`
- `64-PACKAGE_EXECUTION_LOG_BIRLESTIRILMIS.md`
- `65-ACTIVE_RISKS_AND_DECISIONS-CONSOLIDATED.md`
- `HARDENING-08-09-CONSOLIDATED-REFERENCE-RECORD.md`
- `HARDENING-10-CALLBACK-DECISION-INDEX.md`
- `HARDENING-10-CALLBACK-MASTER-REFERENCE.md`
- `HARDENING-10C10 — PayTR Status Inquiry / Payment Reconciliation Birleşik Referans Dosyası`
- `01-SYSTEM_TO_IMPLEMENTATION_MAPPING.md`
- `02-CURRENT_STATE_BASELINE.md`
- `03-PRODUCTION_READINESS_PHASE_MASTER_PLAN.md`
- `04-PRODUCTION_READINESS_RISK_REGISTER.md`
- `09-RELEASE_BLOCKER_REGISTER.md`

---

## 6. Önceden Yapılmış İşler

### 6.1 Payment Foundation

Kayıtlara göre:

- P13 — Payment Initiation Foundation — PASS WITH LIMITATION
- P14 — Payment → Order Foundation — PASS

Bu kayıtlar ödeme foundation hattının kurulduğunu gösterir. Ancak P13 limitation taşıdığı ve provider live olmadığı için production-ready kabul edilemez.

### 6.2 Provider Boundary Foundation

HARDENING-09 hattında:

- payment provider boundary
- shipment provider boundary
- notification provider boundary
- payout provider boundary
- ProviderResultEnvelope standardı
- provider sonucu business truth değildir kuralı

oluşturulmuştur.

### 6.3 HARDENING-10 Callback Foundation

HARDENING-10 hattında:

- common callback ingestion security boundary
- callback persistence
- signature guard foundation
- replay/idempotency guard
- freshness guard
- process-local rate limit
- PayTR callback mapping
- payment callback owner command contract
- providerReference lookup
- opt-in worker mode ile succeeded/failed callback payment state transition

eklenmiştir.

### 6.4 HARDENING-10C10 Reconciliation Foundation

10C10 hattında:

- PayTR status inquiry contract + mapping
- status inquiry adapter boundary
- reconciliation decision contract / task model
- reconciliation task repository
- worker dry-run
- owner command guard
- controlled payment mutation
- E2E smoke / no order handoff validation
- audit/outbox + task finalization
- duplicate/idempotency ve terminal conflict kontrolleri

tamamlanmıştır.

Kapanış durumu:

```text
HARDENING-10C10 — CLOSED WITH LIMITATIONS
```

---

## 7. Önceden Ertelenmiş / Sınırlı Bırakılmış İşler

Bu faza devreden ana limitations:

1. Canlı PayTR request yok
2. Gerçek PayTR HTTP çağrısı yok
3. PayTR sandbox/live E2E yok
4. Production payment provider runtime yok
5. Reconciliation production scheduler/queue/background worker yok
6. Worker claim/retry/concurrency foundation yok
7. Order create / order handoff yok
8. Finance / settlement / payout mutation yok
9. Risk mutation yok
10. BFF route production flow yok
11. Outbox consumer / delivery worker yok
12. Production operator panel flow yok
13. providerReference DB-level uniqueness guarantee eksik
14. Reconciliation task modelinde expected amount/currency alanları yok veya kaynağı net değil
15. Payment succeeded sonrası order eligibility modeli henüz açılmadı

---

## 8. Bu Fazda Yapılacak İşler

### 8.1 PayTR Live / Sandbox Strategy

Yapılacaklar:

- PayTR sandbox/live entegrasyon seviyesi belirlenecek
- Merchant credential / secret yönetimi doğrulanacak
- `merchant_oid = providerReference` stratejisi live akışa uygun mu kontrol edilecek
- Initiate response ile callback/status inquiry correlation doğrulanacak
- Gerçek HTTP çağrısı ve simulation boundary ayrımı korunacak

Beklenen sonuç:

```text
Provider boundary canlı doğrulama ile güçlenir; provider sonucu hâlâ business truth sayılmaz.
```

---

### 8.2 Provider Config / Secret Readiness

Kontrol edilecek:

- merchant_id / merchant_key / merchant_salt env çözümü
- missing config behavior
- secret log sızıntısı riski
- production / sandbox mode ayrımı
- config validation fail-fast davranışı
- `.env.example` ve secrets policy uyumu

Beklenen sonuç:

```text
Provider credential üretim ortamında güvenli, doğrulanabilir ve log-safe olmalıdır.
```

---

### 8.3 Payment Initiation Hardening

Kontrol edilecek:

- payment initiation yalnız validated checkout context ile başlıyor mu?
- idempotency key var mı?
- duplicate initiate ikinci ödeme attempt’i nasıl yönetiyor?
- checkout expired ise payment başlıyor mu?
- amount/currency checkout snapshot ile uyumlu mu?
- providerReference deterministic mi?
- payment_attempt state lifecycle doğru mu?

Beklenen sonuç:

```text
Checkout hazır değilse ödeme başlatılamaz.
```

---

### 8.4 Callback Ingestion Production Boundary

Kontrol edilecek:

- public callback endpoint signature guard’dan geçiyor mu?
- replay/duplicate callback ikinci payment effect üretmiyor mu?
- stale/future timestamp reddediliyor mu?
- process-local rate limit production için yeterli mi?
- distributed rate limit / WAF ihtiyacı var mı?
- invalid callback domain command üretmiyor mu?

Beklenen sonuç:

```text
Signature / replay / freshness guard geçmeden payment processing yoktur.
```

---

### 8.5 PayTR Callback Mapping Validation

Kontrol edilecek:

- PayTR callback fields normalize ediliyor mu?
- success/failed/pending/unknown mapping doğru mu?
- hash verification güvenli mi?
- amount/currency mismatch manual review’a gidiyor mu?
- callback provider event id / providerReference doğru saklanıyor mu?
- duplicate callback duplicate mutation üretmiyor mu?

Beklenen sonuç:

```text
PayTR callback doğrudan business truth değildir; owner command candidate üretir.
```

---

### 8.6 PayTR Status Inquiry Readiness

Kontrol edilecek:

- status inquiry request / token / mapping doğru mu?
- status=success → succeeded candidate doğrudan business truth sayılıyor mu?
- payment_amount/payment_total mismatch davranışı
- currency TL → TRY normalization
- “merchant_oid ile ödeme bulunamadı” inconclusive/retry davranışı
- returns alanı refund/settlement hattına bırakılıyor mu?
- real HTTP status inquiry ve simulation ayrımı net mi?

Beklenen sonuç:

```text
Status inquiry sonucu reconciliation candidate üretir; direkt payment/order/finance truth üretmez.
```

---

### 8.7 Reconciliation Runtime Design

Yapılacaklar:

- reconciliation task lifecycle production runtime’a bağlanacak mı karar verilecek
- scheduler / queue / worker model seçilecek
- claim / lock / retry / backoff / max attempt strategy yazılacak
- worker concurrency duplicate mutation üretmeyecek şekilde tasarlanacak
- manual review transition netleşecek
- worker observability minimum set belirlenecek

Beklenen sonuç:

```text
Unknown-result / pending payments production ortamda güvenli biçimde kapanabilir hale gelmelidir.
```

---

### 8.8 Controlled Payment Mutation Readiness

Kontrol edilecek:

- controlled mutation yalnız explicit opt-in ile mi çalışıyor?
- `MARK_PAYMENT_SUCCEEDED` dışında command destekleniyor mu?
- FAILED/CANCELLED üstüne SUCCEEDED yazılamıyor mu?
- duplicate command `alreadyApplied` olarak safe kalıyor mu?
- amount/currency mismatch mutation üretmiyor mu?
- missing paymentAttemptId command üretmiyor mu?

Beklenen sonuç:

```text
Payment mutation yalnız payment owner domain içinde guarded path ile yapılır.
```

---

### 8.9 Payment Succeeded → Order Handoff Inventory

Bu fazın en kritik alt çalışmasıdır.

Cevaplanacak sorular:

1. Payment SUCCEEDED olduktan sonra order handoff nasıl başlar?
2. Order owner hangi command’i kabul eder?
3. Order create idempotency key nasıl üretilir?
4. Aynı payment için ikinci order nasıl engellenir?
5. Payment failed / cancelled / unknown_result order oluşturabilir mi?
6. Reconciled payment ile ordinary callback success aynı order eligibility modelini mi kullanır?
7. Risk hold varsa order handoff durur mu?
8. Event/outbox trigger mı, command mı, evidence mı?
9. `payment.reconciliation.completed` event’i doğrudan order create tetikler mi?
10. Order owner payment attempt state’ini nasıl doğrular?

Beklenen sonuç:

```text
Order handoff yalnız order owner command ile ve duplicate-safe çalışmalıdır.
```

---

### 8.10 Audit / Outbox Evidence Boundary

Kontrol edilecek:

- Audit business truth gibi kullanılıyor mu?
- Outbox business truth gibi kullanılıyor mu?
- `payment.reconciliation.completed` topic order command taşıyor mu?
- Duplicate event duplicate order üretir mi?
- Outbox delivery guarantee iddiası varsa worker var mı?
- Audit append idempotency Postgres tarafında güvenli mi?

Beklenen sonuç:

```text
Audit/outbox evidence olabilir; owner state mutation yerine geçemez.
```

---

### 8.11 Risk Hold / Fraud Linkage

Kontrol edilecek:

- payment anomaly risk signal üretiyor mu?
- high-risk payment order handoff’u durdurabilir mi?
- risk owner payment state mutate ediyor mu?
- risk hold order/finance/payout zincirine nasıl etki eder?
- fraud scoring yoksa minimum release risk policy ne olacak?

Beklenen sonuç:

```text
Risk sistemi payment truth mutate etmez; ancak handoff/hold kararında guard sinyali olabilir.
```

---

## 9. Bu Fazda Yapılmayacak İşler

Bu fazda bilinçli olarak yapılmayacaklar:

- settlement calculation
- payout batch execution
- refund settlement adjustment
- full order operations
- shipment provider live integration
- frontend checkout/payment visual polish
- full fraud scoring engine
- full production deployment

---

## 10. Owner / Guard / Permission Kuralları

### 10.1 Owner Boundary

Bu fazda korunacak sınırlar:

- Payment owner payment/payment_attempt state mutate eder
- Order owner order oluşturur
- Finance owner settlement/payout mutate eder
- Risk owner payment/order/finance truth mutate etmez
- BFF truth owner değildir
- Event/audit/outbox mutation değildir
- Provider callback business truth değildir

### 10.2 Guard Kuralları

Zorunlu guard aileleri:

- authentication / internal service guard
- provider signature guard
- replay/idempotency guard
- timestamp freshness guard
- state/lifecycle guard
- amount/currency guard
- risk/financial block guard
- owner command guard

### 10.3 Transition Kuralları

Korunacak ayrımlar:

- checkout ready ≠ payment confirmed
- payment initiated ≠ payment succeeded
- payment succeeded ≠ order created
- provider success ≠ internal owner truth
- reconciliation completed ≠ order created
- event emitted ≠ owner state mutated
- paid / captured ≠ settled
- settled ≠ payable
- payable ≠ paid_out

---

## 11. Riskler

### 11.1 RB-002 — Canlı PayTR / Gerçek Provider Doğrulaması Yok

Bu fazın ana blocker’ıdır.

### 11.2 RB-003 — Payment Succeeded → Order Handoff Yok

Bu fazın en kritik mimari geçişidir.

### 11.3 RB-004 — Reconciliation Production Runtime Yok

10C10 foundation production runtime değildir.

### 11.4 ProviderReference Uniqueness Riski

DB-level uniqueness yoksa lookup ambiguity doğabilir.

### 11.5 Event/Outbox Handoff Riski

Outbox event doğrudan order create tetiklerse owner boundary bozulur.

### 11.6 Unknown-result Kullanıcı Yanıltma Riski

Timeout veya unknown_result kesin fail veya kesin success gibi gösterilirse ticari ve kullanıcı güveni riski oluşur.

---

## 12. Kabul Kriterleri

PHASE-03 kapanışı için minimum kabul kriterleri:

1. PayTR live/sandbox strategy netleşmiş olmalı
2. Provider config/secret handling güvenli olmalı
3. Payment initiation yalnız validated checkout context ile çalışmalı
4. Callback signature/replay/freshness guard doğrulanmalı
5. PayTR callback mapping doğrulanmalı
6. Status inquiry mapping ve real/simulation ayrımı doğrulanmalı
7. Reconciliation production runtime kararı verilmiş olmalı
8. Controlled payment mutation guard’ları korunmalı
9. Payment succeeded → order handoff inventory tamamlanmalı
10. Order handoff uygulanacaksa yalnız order owner command ile çalışmalı
11. Duplicate order engeli tasarlanmış veya uygulanmış olmalı
12. Risk hold etkisi belirlenmiş olmalı
13. Audit/outbox truth sınırı korunmalı
14. Unknown-result behavior net olmalı
15. RB-002/RB-003/RB-004 güncellenmiş olmalı

---

## 13. Test / Smoke / Runtime Kanıtları

Bu faz kod/source/runtime etkili fazdır.

Minimum önerilen kanıtlar:

```text
- pnpm run typecheck
- pnpm run build
- smoke:payment-provider-boundary
- smoke:provider-callback-security
- smoke:paytr-callback-mapping
- smoke:paytr-status-inquiry-mapping
- smoke:paytr-status-inquiry-adapter-boundary
- smoke:payment-reconciliation-decision
- smoke:payment-reconciliation-worker-dry-run
- smoke:payment-reconciliation-controlled-mutation
- smoke:payment-reconciliation-e2e-no-order-handoff
- smoke:payment-reconciliation-audit-outbox-finalization
```

Yeni order handoff açılırsa ek kanıt:

```text
- payment succeeded → order handoff smoke
- duplicate payment success → single order test
- failed/cancelled/unknown payment → no order test
- risk hold → no handoff test
- outbox duplicate → no duplicate order test
```

Provider live/sandbox açılırsa ek kanıt:

```text
- PayTR sandbox success
- PayTR sandbox failed
- PayTR timeout/unknown-result
- callback signature/replay negative cases
```

---

## 14. Kapanış Kontrol Listesi

```text
[ ] PayTR live/sandbox strategy yazıldı
[ ] Provider secret/config kontrol edildi
[ ] Payment initiation validated checkout context’e bağlı
[ ] ProviderReference / merchant_oid stratejisi doğrulandı
[ ] Callback signature guard doğrulandı
[ ] Replay/duplicate guard doğrulandı
[ ] Freshness guard doğrulandı
[ ] Rate limit / WAF ihtiyacı değerlendirildi
[ ] PayTR callback mapping doğrulandı
[ ] PayTR status inquiry mapping doğrulandı
[ ] Reconciliation production runtime kararı verildi
[ ] Worker claim/retry/concurrency stratejisi belirlendi
[ ] Controlled payment mutation guard’ları doğrulandı
[ ] Terminal conflict guard doğrulandı
[ ] Payment succeeded → order handoff inventory tamamlandı
[ ] Duplicate order idempotency modeli belirlendi
[ ] Risk hold etkisi belirlendi
[ ] Audit/outbox truth sınırı korundu
[ ] Unknown-result kullanıcı/sistem davranışı yazıldı
[ ] Targeted smoke/test kanıtları alındı
[ ] RB-002 güncellendi
[ ] RB-003 güncellendi
[ ] RB-004 güncellendi
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

Ancak gerçekçi ilk kapanış kararı şu olabilir:

```text
PASS WITH LIMITATION
```

Çünkü full live provider veya production worker bazı kontrollü release kapsamlarında sınırlı devredilebilir. Ancak payment/order correctness blocker’ları kapatılmadan production-ready kararı verilemez.

### PASS Şartı

- PayTR sandbox/live provider doğrulandı
- Reconciliation production runtime kararı ve minimum implementation var
- Payment succeeded → order handoff duplicate-safe ve owner-boundary-safe çalışıyor
- Unknown-result davranışı net
- Critical payment/order smoke PASS
- RB-002/RB-003/RB-004 kapandı veya release-safe şekilde daraltıldı

### PASS WITH LIMITATION Şartı

- Ana payment correctness ve handoff güvenliği sağlandı
- Bazı provider/worker operational hardening PHASE-12’ye kontrollü devredildi
- Kullanıcı/finans doğruluğunu bozacak blocker kalmadı

### PARTIAL Şartı

- PayTR doğrulaması yok
- Order handoff yok
- Reconciliation runtime yok
- Duplicate order engeli kanıtlanmadı
- Test kanıtı eksik

### FAIL Şartı

- Provider sonucu business truth kabul ediliyor
- Payment succeeded doğrudan BFF/event ile order yaratıyor
- Duplicate order oluşuyor
- Unknown-result yanlış success/fail gösteriliyor
- Owner boundary ihlali var

---

## 16. Sonraki Faza Devredenler

PHASE-04’e devredenler:

- Order lifecycle
- Order operations
- Fulfillment / shipment
- Delivery status
- Return/refund flow

PHASE-05’e devredenler:

- Settlement
- Finance adjustment
- Payout
- Refund financial impact

PHASE-09’a devredenler:

- Full fraud scoring
- Distributed rate limit/WAF
- Outbox worker/DLQ
- Notification provider callbacks

PHASE-10’a devredenler:

- Payment UX
- Unknown-result user UI
- Order confirmation screen
- Payment error/degraded states

PHASE-12’ye devredenler:

- Production deploy
- Secrets final review
- Observability/alerting
- Worker runtime monitoring
- Rollback

---

## 17. Nihai Faz Açılış Kararı

PHASE-03 şu şartla başlatılabilir:

```text
PHASE-02 Commerce Core Readiness en az PASS WITH LIMITATION olarak kapanmış olmalıdır.
```

Planlama seviyesi için bu dosya hazırdır.

Gerçek uygulama/kapanış için repo source review, provider environment kararı ve targeted test kanıtı gereklidir.

Net açılış kararı:

```text
PHASE-03 Payment / Provider / Callback / Reconciliation Readiness planı hazırdır.
```
