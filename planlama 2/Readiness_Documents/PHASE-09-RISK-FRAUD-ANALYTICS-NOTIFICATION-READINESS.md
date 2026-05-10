# PHASE-09-RISK-FRAUD-ANALYTICS-NOTIFICATION-READINESS.md

## 1. Fazın Amacı

Bu fazın amacı, Hedihup platformunda risk, fraud, abuse, analytics, event, audit, outbox ve notification sistemlerini production-readiness seviyesine getirmektir.

Bu fazın ana kuralı:

```text
Risk sistemi owner truth mutate etmez; risk signal, hold, review ve block üretir.
Analytics / event / audit / outbox business truth değildir.
Notification delivery, domain action’ın kendisi değildir.
```

Bu fazın hedefi:

```text
Ödeme, kupon, puan, payout, sosyal içerik, provider callback ve operasyonel aksiyonlarda abuse/risk sinyalleri, ölçümleme, audit kanıtı, outbox güvenilirliği ve notification delivery sınırlarını üretim öncesi güvenli hale getirmek.
```

---

## 2. Fazın Kapsamı

Bu faz aşağıdaki alanları kapsar:

- fraud / risk / abuse sistemi
- commerce abuse observation
- social abuse signal
- coupon abuse
- reward point abuse
- payout abuse / risk hold
- provider callback abuse/rate guard
- distributed rate limit / WAF ihtiyacı
- analytics event coverage
- metric dictionary / event taxonomy uyumu
- audit evidence coverage
- outbox lifecycle
- outbox delivery worker / retry / DLQ
- notification provider boundary
- email / SMS / push scope
- notification preference / consent
- notification delivery observability
- recipient spoof guard

---

## 3. Fazın Kapsam Dışı Alanları

Bu fazda yapılmayacak işler:

- payment provider live initiate
- payment succeeded → order handoff implementation
- settlement/payout core implementation
- search/ranking implementation
- media processing implementation
- full frontend UX drawings
- final production deployment gate

Bu faz domain action üretmez; domain action’ların risk, audit, analytics, outbox ve notification çevresini güvenli hale getirir.

---

## 4. Referans Sistem Dosyaları

Bu fazda esas alınacak sistem dosyaları:

1. `49-fraud risk abuse sistemi.md`
2. `48-arka plan analitik ölçümleme sistemi.md`
3. `19-bildirim sistemi.md`
4. `22-moderasyon sistemi.md`
5. `15-ödeme sistemi.md`
6. `46-kupon sistemi.md`
7. `39-ödül puan sistemi.md`
8. `38-puan market sistemi.md`
9. `54-payout ödeme çıkış sistemi.md`
10. `47-finansal mutabakat hakedis sistemi.md`
11. `21-post sistemi.md`
12. `31-yorum puanlama sistemi.md`
13. `33-beğen kaydet paylaş sistemi.md`
14. `25-kural -yetki sistemi.md`
15. `OWNER_MATRIX.md`
16. `GUARD_MATRIX.md`
17. `PERMISSION_MATRIX.md`
18. `TRANSITION_POLICIES.md`
19. `CRITICAL_JOURNEY_CHECKLIST.md`
20. `ACCEPTANCE_CRITERIA_PACK.md`
21. `TEST_STRATEJISI.md`

---

## 5. Referans Kayıt Dosyaları

Bu fazda özellikle şu kayıtlar dikkate alınır:

- `63-IMPLEMENTATION_PROGRESS_MASTER_BIRLESTIRILMIS.md`
- `64-PACKAGE_EXECUTION_LOG_BIRLESTIRILMIS.md`
- `65-ACTIVE_RISKS_AND_DECISIONS-CONSOLIDATED.md`
- `HARDENING-06-07-CONSOLIDATED-REFERENCE-RECORD.md`
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

### 6.1 Risk / Fraud Foundation

Kayıtlara göre:

- P42 — Risk / Fraud Foundation hattı kurulmuştur.

Bu foundation risk domain başlangıcını sağlar; full fraud scoring ve production abuse engine değildir.

### 6.2 HARDENING-06 Risk / Moderation / Abuse

HARDENING-06 hattında:

- risk signal core guard
- moderation workflow hardening
- social abuse signal integration
- commerce abuse/fraud observation
- advisory risk signal production

çalışılmıştır.

### 6.3 HARDENING-08 Analytics / Event / Audit / Outbox

HARDENING-08 hattında:

- analytics guard
- event/audit foundation
- outbox retry/delivery smoke foundation
- audit/event durability foundation

çalışılmıştır.

### 6.4 HARDENING-08B Notification

Notification guard/provider boundary hardening yapılmıştır.

### 6.5 HARDENING-09 Provider Boundary

Notification, payment, shipment ve payout provider boundary foundation kurulmuştur.

### 6.6 HARDENING-10 / 10C10 Callback / Reconciliation Evidence

Provider callback, payment reconciliation, audit/outbox evidence ve no-order-handoff sınırı kurulmuştur.

---

## 7. Önceden Ertelenmiş / Sınırlı Bırakılmış İşler

Bu faza devreden ana limitation ve borçlar:

1. Full fraud scoring yok
2. Auto hold/block policy net değil
3. Distributed rate limit / WAF yok
4. Process-local rate limit production için yetersiz olabilir
5. Coupon/point/payout abuse workflows eksik
6. Analytics producer coverage tam değil
7. BI/dashboard yok
8. Consent/preference center yok
9. Outbox production broker yok
10. Outbox delivery worker / retry scheduler / DLQ yok
11. Notification real email/SMS/push provider yok
12. Notification delivery callback yok
13. Recipient spoof guard tüm yüzeylerde doğrulanmalı
14. Audit append idempotency Postgres tarafında güçlendirilebilir
15. Event/outbox business truth gibi kullanılmamalıdır

---

## 8. Bu Fazda Yapılacak İşler

### 8.1 Risk Domain Scope Netleştirme

Kontrol edilecek:

- Risk sistemi hangi aksiyonlarda signal üretir?
- Hangi aksiyonlar review_required üretir?
- Hangi aksiyonlar hold/block üretir?
- Risk owner hangi truth alanlarını mutate etmez?
- Risk signal domain action’ı otomatik durdurur mu, yoksa guard input’u mu olur?
- Manual review queue ile ilişkisi nedir?

Beklenen sonuç:

```text
Risk sistemi karar sinyali üretir; payment/order/finance/social truth’u direct mutate etmez.
```

---

### 8.2 Commerce Abuse / Fraud

Kontrol edilecek:

- Add-to-cart spam
- checkout abuse
- payment attempt abuse
- duplicate payment/callback abuse
- refund abuse
- return abuse
- coupon abuse
- supplier/creator manipulation

Beklenen sonuç:

```text
Commerce abuse sinyalleri domain owner guard’larına kontrollü input sağlar.
```

---

### 8.3 Coupon / Campaign Abuse

Kontrol edilecek:

- Coupon usage limit
- account/device/session abuse
- creator-funded coupon manipulation
- sponsor cost abuse
- repeated checkout/cancel/refund abuse
- campaign eligibility spoof risk

Beklenen sonuç:

```text
Kupon/kampanya abuse finansal kayıp üretmeden önce risk guard’a bağlanmalıdır.
```

---

### 8.4 Reward Point / Point Market Abuse

Kontrol edilecek:

- Fake review/story ile puan kazanma
- delivered olmadan puan kazanma
- refund sonrası puan reversal
- duplicate reward event
- point spend duplicate
- point market stock abuse

Beklenen sonuç:

```text
Reward earned ve spendable balance owner-controlled ve abuse-aware olmalıdır.
```

---

### 8.5 Payout / Finance Abuse

Kontrol edilecek:

- payout account change sonrası hold
- unusual payout amount
- repeated payout failure
- suspicious creator/supplier activity
- risk hold payout’u durduruyor mu?
- finance admin override audit’li mi?

Beklenen sonuç:

```text
Risk hold payout çıkışını durdurabilmelidir.
```

---

### 8.6 Provider Callback Abuse Protection

Kontrol edilecek:

- signature guard
- replay guard
- freshness guard
- idempotency guard
- rate limit
- distributed rate limit / WAF ihtiyacı
- invalid provider domain/name handling
- callback flood monitoring

Beklenen sonuç:

```text
Public callback endpoint yalnız process-local guard ile bırakılmamalıdır; production edge protection kararı verilmelidir.
```

---

### 8.7 Distributed Rate Limit / WAF Kararı

Yapılacaklar:

- Hangi endpoint’ler edge protection ister?
- Login/auth
- checkout/payment initiate
- provider callback
- public search
- media upload
- support/ticket
- social write
- coupon/reward actions

Beklenen sonuç:

```text
Critical public endpoints distributed protection altında olmalıdır.
```

---

### 8.8 Analytics Event Coverage

Kontrol edilecek:

- search_submit
- result_click
- pdp_open
- add_to_cart
- checkout_started
- payment_started
- payment_result
- order_created
- shipment_delivered
- review_created
- return_requested
- refund_completed
- coupon_applied
- reward_earned
- payout_submitted
- support_ticket_created
- moderation_decision

Beklenen sonuç:

```text
Analytics event user/business gözlemi sağlar; business truth üretmez.
```

---

### 8.9 Audit Evidence Coverage

Kontrol edilecek:

- protected admin actions
- finance corrections
- payout hold/release
- moderation decisions
- risk review decisions
- payment reconciliation
- order handoff
- refund execution
- settlement adjustment
- supplier/creator lifecycle decisions

Beklenen sonuç:

```text
Audit evidence karar kanıtıdır; owner truth değildir.
```

---

### 8.10 Outbox Delivery Reliability

Kontrol edilecek:

- outbox table / lifecycle
- delivery worker
- retry/backoff
- DLQ
- duplicate event idempotency
- consumer failure handling
- delivery guarantee sınırı
- observability

Beklenen sonuç:

```text
Outbox delivery iddiası varsa worker/retry/DLQ kanıtı olmalıdır.
```

---

### 8.11 Notification Provider Readiness

Kontrol edilecek:

- email provider
- SMS provider
- push provider
- provider boundary
- delivery attempt
- delivery callback
- retry/failure
- recipient validation
- spoof prevention
- template safety

Beklenen sonuç:

```text
Notification provider sonucu domain action’ın kendisi değildir.
```

---

### 8.12 Preference / Consent Center

Kontrol edilecek:

- user notification preferences
- marketing consent
- transactional notification exception
- unsubscribe logic
- channel-level preference
- audit/logging
- admin override yasağı

Beklenen sonuç:

```text
Kullanıcı tercihleri ve yasal izinler notification delivery kararını etkiler.
```

---

## 9. Bu Fazda Yapılmayacak İşler

Bu fazda bilinçli olarak yapılmayacaklar:

- Payment/order/finance owner implementation
- Full frontend page drawings
- Full BI dashboard
- Full deployment
- Provider payment initiation
- Payout execution implementation

---

## 10. Owner / Guard / Permission Kuralları

### 10.1 Owner Boundary

Bu fazda korunacak sınırlar:

- Risk owner payment/order/finance/social truth mutate etmez
- Analytics owner business truth üretmez
- Audit owner business truth üretmez
- Outbox delivery owner state mutation değildir
- Notification delivery domain action değildir
- BFF analytics/risk truth üretmez
- Panel risk/finance/admin action protected command kullanır

### 10.2 Guard Kuralları

Zorunlu guard aileleri:

- authentication guard
- role/scope guard
- ownership guard
- risk/abuse guard
- moderation block guard
- financial block guard
- idempotency/replay guard
- rate limit guard
- consent/preference guard

### 10.3 Permission Kuralları

- Risk review permission owner write hakkı değildir
- Notification send permission user consent’i bypass etmez
- Analytics view permission raw PII access hakkı değildir
- Finance override permission audit/approval bypass hakkı değildir

### 10.4 Transition Kuralları

Korunacak ayrımlar:

- risk signal ≠ owner state changed
- audit written ≠ business state changed
- event emitted ≠ delivery guaranteed
- notification sent ≠ user action completed
- outbox delivered ≠ consumer mutation succeeded
- fraud hold ≠ payment failed
- payout held ≠ payout failed

---

## 11. Riskler

### 11.1 RB-013 — Risk / Fraud Minimum Production Koruma Seti Tamamlanmadı

Bu fazın ana blocker’ıdır.

### 11.2 RB-012 — Coupon / Campaign Abuse ve Finance Impact

Kupon/kampanya abuse bu fazın risk alanlarından biridir.

### 11.3 Outbox Delivery Guarantee Riski

Outbox event var ama delivery worker yoksa event-driven süreçler production’da eksik kalır.

### 11.4 Notification Provider Riski

Gerçek provider yoksa kritik bildirimler kullanıcıya ulaşmayabilir.

### 11.5 Consent / Preference Riski

Marketing/engagement notification’ları izin/tercih ihlali yaratabilir.

### 11.6 Rate Limit / WAF Riski

Public callback, auth, checkout, social write ve media upload endpointleri abuse’a açık kalabilir.

---

## 12. Kabul Kriterleri

PHASE-09 kapanışı için minimum kabul kriterleri:

1. Risk domain scope netleşmeli
2. Commerce abuse sinyalleri belirlenmeli
3. Coupon/campaign abuse guardları belirlenmeli
4. Reward/point abuse guardları belirlenmeli
5. Payout/finance abuse hold mekanizması netleşmeli
6. Provider callback abuse protection doğrulanmalı
7. Distributed rate limit/WAF kararı verilmeli
8. Analytics event coverage minimum set yazılmalı
9. Audit evidence coverage minimum set yazılmalı
10. Outbox delivery worker/retry/DLQ kararı verilmeli
11. Notification provider scope netleşmeli
12. Preference/consent center minimum scope yazılmalı
13. Targeted risk/analytics/notification/outbox tests PASS olmalı
14. Risk ve release blocker register güncellenmeli

---

## 13. Test / Smoke / Runtime Kanıtları

Bu faz kod/source/runtime etkili fazdır.

Minimum önerilen kanıtlar:

```text
- pnpm run typecheck
- pnpm run build
- risk signal smoke
- commerce abuse signal smoke
- coupon abuse scenario
- reward/point abuse scenario
- payout risk hold scenario
- provider callback replay/rate guard smoke
- analytics event emission smoke
- audit evidence smoke
- outbox idempotency/retry smoke
- notification provider boundary smoke
- recipient spoof negative test
- preference/consent guard test
```

Acceptance bağlantıları:

- Journey 09 — coupon/campaign application
- Journey 10 — reward point flow
- Journey 13 — support/moderation/fraud escalations

---

## 14. Kapanış Kontrol Listesi

```text
[ ] Risk domain scope netleştirildi
[ ] Commerce abuse guardları kontrol edildi
[ ] Coupon/campaign abuse guardları kontrol edildi
[ ] Reward/point abuse guardları kontrol edildi
[ ] Payout/finance abuse guardları kontrol edildi
[ ] Provider callback abuse protection kontrol edildi
[ ] Distributed rate limit/WAF kararı verildi
[ ] Analytics event coverage yazıldı
[ ] Audit evidence coverage yazıldı
[ ] Outbox delivery reliability kararı verildi
[ ] Notification provider scope yazıldı
[ ] Recipient spoof guard kontrol edildi
[ ] Preference/consent center scope yazıldı
[ ] Owner / guard / permission boundary kontrol edildi
[ ] Targeted smoke/test kanıtı alındı
[ ] RB-013 güncellendi
[ ] RB-012 güncellendi
[ ] PRR-008 güncellendi
[ ] PRR-022 güncellendi
[ ] PRR-023 güncellendi
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

Ancak full BI dashboard veya advanced fraud scoring sonraki fazlara devredilecekse şu karar mümkün olabilir:

```text
PASS WITH LIMITATION
```

### PASS Şartı

- Minimum risk/fraud protection set çalışıyor
- Critical endpoint protection kararı var
- Outbox/notification minimum production strategy var
- Analytics/audit coverage minimum set var
- Coupon/reward/payout abuse senaryoları kapandı
- Targeted tests PASS

### PASS WITH LIMITATION Şartı

- Minimum güvenlik ve evidence hattı çalışıyor
- Advanced fraud scoring, BI dashboard veya full notification preference UI kontrollü devredildi
- Release blocker niteliğinde abuse/notification/outbox açığı kalmadı

### PARTIAL Şartı

- Risk/fraud scope belirsiz
- Outbox delivery belirsiz
- Notification provider belirsiz
- Rate limit/WAF kararı yok
- Test kanıtı eksik

### FAIL Şartı

- Risk owner payment/order/finance truth mutate ediyor
- Event/audit/outbox business truth gibi kullanılıyor
- Notification spoof riski var
- Callback endpoint replay/rate guard olmadan açık
- Coupon/payout abuse blocker kalıyor

---

## 16. Sonraki Faza Devredenler

PHASE-10’a devredenler:

- user notification preference UI
- analytics dashboard UI
- risk/moderation queue UI
- notification error/degraded UX
- page drawings and screen flows

PHASE-11’e devredenler:

- coupon/campaign application
- reward point flow
- support/moderation/fraud escalation
- notification/audit visibility in critical journeys

PHASE-12’ye devredenler:

- WAF / edge protection deployment
- outbox worker production deploy
- notification provider production credentials
- observability/alerting
- incident response

---

## 17. Nihai Faz Açılış Kararı

PHASE-09 şu şartla başlatılabilir:

```text
PHASE-08 Admin / Creator / Supplier / Support Panel Readiness en az PASS WITH LIMITATION olarak kapanmış olmalıdır.
```

Planlama seviyesi için bu dosya hazırdır.

Gerçek uygulama/kapanış için repo source review, targeted tests ve runtime/provider kararları gereklidir.

Net açılış kararı:

```text
PHASE-09 Risk / Fraud / Analytics / Notification Readiness planı hazırdır.
```
