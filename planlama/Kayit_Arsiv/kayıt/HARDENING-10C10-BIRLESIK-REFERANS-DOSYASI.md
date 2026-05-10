# HARDENING-10C10 — PayTR Status Inquiry / Payment Reconciliation Birleşik Referans Dosyası

## 0. Dosya Amacı

Bu doküman, HARDENING-10C10 hattında üretilen envanter, karar, implementasyon, smoke doğrulama ve final kapanış içeriklerini tek ana referans altında toplar.

Bu dosya özet doküman değildir. Amaç:

- PayTR status inquiry hattında alınan kararları tek yerde tutmak
- Payment reconciliation lifecycle kararlarını kaybetmemek
- Hangi pakette ne yapıldığını, neyin yapılmadığını ve hangi sınırların korunduğunu izlenebilir hale getirmek
- 10C11 — Payment Succeeded → Order Handoff Foundation öncesinde güvenilir referans sağlamak
- Aynı bilgileri tekrar tekrar çoğaltmadan, ancak kritik kararları eksiltmeden tekleştirilmiş kayıt üretmek

Net sınır:

- Bu dosya order handoff tasarımı değildir.
- Bu dosya canlı PayTR entegrasyon tasarımı değildir.
- Bu dosya finance, settlement, payout veya risk mutation tasarımı değildir.
- Bu dosya 10C10 hattının birleşik kapanış ve referans kaydıdır.

---

## 1. Genel Hat Tanımı

HARDENING-10C10 hattı, ödeme sağlayıcısından gelen belirsiz veya sonradan doğrulanması gereken ödeme sonuçlarının güvenli şekilde incelenmesi, PayTR durum sorgusu cevabının doğrudan business truth kabul edilmeden normalize edilmesi, reconciliation task ve decision hattının kurulması, kontrollü payment owner mutation yolunun explicit opt-in altında kanıtlanması ve order handoff açılmadan audit/outbox evidence üretilmesi amacıyla yürütülmüştür.

Bu hat boyunca ana ilke korunmuştur:

**Payment succeeded, order created değildir.**

Payment domain yalnız payment sonucunu netleştirir. Order create ayrı owner command konusudur ve en erken HARDENING-10C11 kapsamında ele alınmalıdır.

---

## 2. Kapanan Ana Çalışma Dizisi

HARDENING-10C10 hattı şu mantıksal sırayla yürütülmüştür:

1. `HARDENING-10C10-A` — Reconciliation Boundary & System Alignment Inventory
2. `HARDENING-10C10-B` — PayTR Status Inquiry & Reconciliation Decision Inventory
3. `HARDENING-10C10-01` — PayTR Status Inquiry Contract + Mapping Foundation
4. `HARDENING-10C10-02R` — PayTR Status Inquiry Adapter Boundary Remediation
5. `HARDENING-10C10-03` — Reconciliation Decision Contract / Task Model Foundation
6. `HARDENING-10C10-04` — Reconciliation Task Persistence / Repository Foundation
7. `HARDENING-10C10-05` — Reconciliation Worker Dry-Run / No Mutation
8. `HARDENING-10C10-06R` — Reconciliation Owner Command Guard Fix
9. `HARDENING-10C10-07` — Controlled Reconciliation Payment Mutation
10. `HARDENING-10C10-08` — Reconciliation E2E Smoke / No Order Handoff Validation
11. `HARDENING-10C10-09` — Reconciliation Audit/Outbox + Task Finalization Guard
12. `HARDENING-10C10 FINAL CLOSURE SUMMARY` — Final kapanış özeti

---

## 3. HARDENING-10C10-A — Reconciliation Boundary & System Alignment Inventory

### 3.1 Paket Tanımı

Bu paket kod implementasyonu değildir. Görevi, `HARDENING-10C9-02` sonrasında ödeme callback ve reconciliation hattının ana sistem dosyalarıyla uyumunu doğrulamak, boundary kararlarını envanterlemek ve riskleri raporlamaktır.

Bu çalışma, `10C9-02` ile eklenen kontrollü succeeded/failed callback owner transition sonrasında, tam reconciliation ve status inquiry mekanizması kurulmadan önce sistem prensipleriyle uyum denetimi yapılması için hazırlanmıştır.

### 3.2 10C9-02 Mevcut Durum Özeti

Tamamlananlar:

- Yalnızca opt-in modunda çalışan callback worker’a `MARK_PAYMENT_SUCCEEDED` ve `MARK_PAYMENT_FAILED` command’ları aracılığıyla payment ve payment_attempt state güncelleme yeteneği kazandırıldı.
- Worker, `providerReference` üzerinden `paymentAttempt` bulabilir hale geldi.
- State geçişleri terminal conflict risklerini önleyecek şekilde idempotent ve guarded yapıdadır.
- Varsayılan worker modu dry-run olarak korunmuştur.

Kapsam dışı kalanlar:

- Reconciliation runtime yoktur.
- PayTR status inquiry adapter yoktur.
- Pending / unknown / cancelled / expired mutation yoktur.
- Order handoff yoktur.
- Finance / risk mutation yoktur.
- Migration yoktur.

### 3.3 Sistem Dosyalarıyla Uyum Kararları

Doğrulanan ana sınırlar:

- Payment sistemi sadece finansal sonucu üretir.
- Payment success order created değildir.
- Order create ayrı owner command olmalıdır.
- Settlement payment değildir.
- Payout settlement değildir.
- Risk sistemi sinyal, hold ve review üretebilir; payment truth mutate etmez.
- Provider callback business truth değildir.
- Event state mutation yerine geçmez.
- BFF truth owner değildir.
- UI / panel truth üretmez.

### 3.4 Owner Boundary Kararı

Payment owner mutate edebilir:

- payment state
- payment_attempt state
- provider reference
- transaction reference
- refund financial execution

Payment owner yapamaz:

- order oluşturamaz
- shipment başlatamaz
- settlement hesaplayamaz
- payout icra edemez
- risk truth mutate edemez

Order owner mutate edebilir:

- başarılı ödeme sonrası order oluşturabilir
- order lifecycle state yönetebilir
- order line durumlarını yönetebilir

Order owner yapamaz:

- ödeme alamaz
- refund finansal icrası yapamaz
- settlement / payout state değiştiremez

Finance / settlement owner mutate edebilir:

- settlement-line
- payout-batch
- payable / paid_out lifecycle
- financial adjustment kayıtları

Finance / settlement owner yapamaz:

- order delivery state değiştiremez
- payment alamaz
- stock / price yönetemez

Risk owner yapabilir:

- risk_hold
- review_required
- anomaly signal
- blocking signal

Risk owner yapamaz:

- payment succeeded / failed yapamaz
- order cancelled yapamaz
- settlement paid_out yapamaz

BFF ve panel:

- hiçbir truth state’i doğrudan mutate edemez
- yalnız owner sisteme protected action / command gönderebilir

### 3.5 Reconciliation Hattının Sistem İçindeki Yeri

Kararlar:

- Reconciliation, Payment Owner alanına yakındır.
- Unknown_result / pending payment sonucunu netleştirmek payment domain sorumluluğudur.
- Reconciliation doğrudan order / finance tetiklemez.
- Reconciliation sadece payment sonucunu netleştirir.
- Order handoff en erken 10C11 konusudur.

### 3.6 Unknown Result / Pending İlkesi

Net ilkeler:

- Timeout kesin başarısızlık değildir.
- Unknown_result failure değildir.
- Pending provider sonucu final değildir.
- Reconciliation gerekliliği first-class kabul edilir.
- Kullanıcıya belirsiz sonuç kesin başarı veya kesin başarısızlık olarak gösterilmemelidir.

### 3.7 Audit / Event İlkesi

Kararlar:

- Provider callback received event ile reconciliation audit aynı şey değildir.
- Event truth değildir.
- Audit truth değildir.
- Correction / reconciliation audit gerektirebilir.
- 10C10-A kapsamında audit/event implementation yapılmaz.

### 3.8 Critical Journey Etkisi

Payment → order journey için korunan sınırlar:

- Payment captured / succeeded order create ile aynı şey değildir.
- Duplicate order oluşmamalıdır.
- Unknown-result kullanıcıya yanlış kesin sonuç olarak gösterilmemelidir.
- Fail / retry / reconciliation davranışı açık olmalıdır.

### 3.9 Kırmızı / Sarı Bayraklar

Kırmızı bayrak:

- Yok.

Sarı bayraklar:

- Kod payment state isimleri ile planlama payment state isimleri birebir aynı değildir; mapping gerekir.
- Pending / unknown_result mutation erken yapılırsa order / finance zincirinde yanlış sonuç doğabilir.
- Reconciliation state ayrı tutulmazsa callback processing status şişebilir.
- Provider callback business truth sayılırsa owner boundary kırılır.

### 3.10 Nihai Karar

`HARDENING-10C10-A — BOUNDARY INVENTORY COMPLETE / 10C10-B REQUIRED`

---

## 4. HARDENING-10C10-B — PayTR Status Inquiry & Reconciliation Decision Inventory

### 4.1 Paket Tanımı

Bu paket kod implementasyonu değildir. Amacı PayTR Status Inquiry API entegrasyonu için gereken kararları ve mevcut kod envanterini çıkarmak, reconciliation lifecycle önermek ve implementasyon öncesi sınırları netleştirmektir.

Bu paket kapsamında yapılmayanlar:

- Yeni kod implementasyonu
- DB migration
- BFF route değişikliği
- Payment mutation
- Order create / handoff
- Finance / settlement / payout mutation
- Risk mutation

### 4.2 10C10-A Boundary Sonuçlarının Bağlayıcılığı

Bağlayıcı prensipler:

- Reconciliation payment sonucunu netleştirir.
- Payment success order created değildir.
- Order handoff en erken 10C11 konusudur.
- 10C10-B yalnız payment reconciliation karar envanteridir.

### 4.3 Mevcut Kod Inventory

#### `services/payment/src/callback-worker.ts`

Mevcut davranış:

- `provider_callback_events` içindeki received kayıtları okur.
- `decidePaymentCallbackOwnerCommand` ile karar üretir.
- `ownerTransitionMode=apply_owner_transition` ise `applyPaymentCallbackOwnerCommand` ile payment ve payment_attempt state günceller.
- Reconciliation required, missing payment attempt gibi durumları tespit edebilir.
- Aktif status inquiry yapmaz.

Eksikler / karar ihtiyacı:

- Aktif reconciliation trigger yok.
- Ignored kayıtların status inquiry’ye nasıl taşınacağı tanımlı değil.
- Status inquiry sonucunun worker’a entegrasyonu belirsiz.

#### `services/payment/src/payment.ts`

Mevcut davranış:

- `initiatePayment` var.
- `applyPaymentCallbackOwnerCommand` ile SUCCEEDED / FAILED sonucu işlenir.
- `getByProviderReference` var.
- Terminal state conflict guard’ları var.

Eksikler / karar ihtiyacı:

- PENDING / UNKNOWN_RESULT ara durum command’ları yok.
- Status inquiry sonrası payment state güvenli güncelleme için yeni veya genişletilmiş command kararı gerekir.

#### `services/payment/src/provider-config.ts`

Mevcut davranış:

- PayTR merchant_id, merchant_key, merchant_salt env değerlerini çözer.
- Eksik config kontrolü yapar.

Karar:

- Status inquiry credential yönetimi için mevcut yapı yeterlidir.
- Bu pakette değişiklik gerekmez.

#### `services/payment/src/provider-adapter.ts`

Mevcut davranış:

- PaymentProviderAdapter abstraction var.
- InternalSimulationPaymentProviderAdapter ve NotConfiguredPaymentProviderAdapter var.
- Gerçek PayTR API çağrısı yoktur.

Eksikler / karar ihtiyacı:

- statusInquiry method ihtiyacı vardır.
- Gerçek PayTR status inquiry adapter ileride gerekir.
- Bu pakette implementasyon yapılmaz.

#### `services/payment/src/repository/interface.ts`, `in-memory.ts`, `postgres.ts`

Mevcut davranış:

- payment id, paymentAttemptId ve providerReference üzerinden ödeme bulma / kaydetme yetenekleri var.
- Postgres providerReference sorgusu JSONB data alanı üzerinden çalışır.

Risk:

- providerReference için DB-level unique guarantee yoktur.
- Büyük veri setlerinde JSONB search performans riski doğurabilir.
- Gelecekte provider_name + provider_reference composite unique index gerekebilir.

#### `packages/contracts/src/payment.ts`

Mevcut davranış:

- PaymentState
- PaymentAttemptState
- PaymentCallbackOwnerCommand
- decidePaymentCallbackOwnerCommand
- PayTR callback hash helpers

Eksikler:

- PayTR status inquiry request / response contract’ları gerekir.
- paytr_token helper gerekir.
- status inquiry response → reconciliation candidate mapping gerekir.

#### `packages/contracts/src/provider.ts`

Karar:

- ProviderResultEnvelope status inquiry sonucunu sarmalamak için uygundur.
- Ek karar ihtiyacı yoktur.

#### `packages/persistence/src/provider-callback.ts`

Karar:

- provider_callback_events callback kayıtları içindir.
- Reconciliation lifecycle için ayrı state veya ayrı reconciliation_tasks tablosu gerekir.
- Callback processing status reconciliation lifecycle yerine geçmemelidir.

#### `tests/smoke/run-smoke.ts` ve `package.json`

Karar:

- PayTR status inquiry token, mapping, reconciliation decision, idempotency, no order handoff smoke suit’leri gerekir.
- Bu pakette test implementasyonu yapılmaz.

### 4.4 PayTR Status Inquiry Mapping Inventory

PayTR alanları ve kararlar:

| PayTR Alanı | Internal Karşılık | Karar |
|---|---|---|
| `status=success` | succeeded candidate | Doğrudan business truth değil, reconciliation candidate üretir |
| `status=error` | failed / unknown_result adayı | err_no ve err_msg yorumlanır |
| `payment_amount` | amount | Minor unit parse edilip expected amount ile karşılaştırılır |
| `payment_total` | amount | payment_amount ile birlikte doğrulanır |
| `returns` | kapsam dışı | Refund / settlement hattına bırakılır |
| `currency=TL` | TRY | Normalize edilir |
| `err_no` | internal code | Canonical error code’a map edilir |
| `err_msg` | message | Log / manual review için saklanır |

Özel kararlar:

- `merchant_oid = providerReference`
- amount parse güvenli yapılmalıdır
- payment_amount ve payment_total farklıysa ambiguity / manual review
- currency `TL → TRY` normalize edilir
- returns alanı 10C10 kapsamında yok sayılır
- “merchant_oid ile basarili odeme bulunamadi” hatası hemen failed değildir; inconclusive/retry adayıdır

### 4.5 Reconciliation Aday Durumları

Aday durumlar:

- pending
- unknown_result
- payment_attempt_not_found
- missing paymentAttemptId
- providerReference var ama payment bulunamadı
- amount mismatch
- currency mismatch
- rejected / signature_failed
- duplicate callback
- replay / freshness reject
- terminal conflict
- provider success ama internal state farklı
- provider error: merchant_oid ile ödeme bulunamadı

Kararlar:

- Amount/currency mismatch otomatik onaylanmaz.
- Terminal conflict manual review gerektirir.
- Signature failure payment failed demek değildir; reconciliation gerekli olabilir.
- Duplicate callback ikinci state etkisi üretmez.
- Provider success iç doğrulama yapılmadan business truth değildir.

### 4.6 Reconciliation State İhtiyacı

Karar:

`ProviderCallbackProcessingStatus` reconciliation lifecycle için yeterli değildir.

Gerekli ayrı reconciliation status değerleri:

- `reconciliation_required`
- `status_query_pending`
- `status_query_succeeded`
- `status_query_failed`
- `status_query_inconclusive`
- `manual_review_required`
- `reconciled`
- `reconciliation_rejected`

Karar:

- Ayrı `reconciliation_tasks` tablosu veya payment üzerinde reconciliation state gerekir.
- Bu envanter paketinde implementation yapılmaz.

### 4.7 Payment Owner Mutation Kararları

Gelecekte gerekebilecek command adayları:

- `MARK_PAYMENT_PENDING`
- `MARK_PAYMENT_UNKNOWN_RESULT`
- `MARK_PAYMENT_CANCELLED`
- `MARK_PAYMENT_EXPIRED`
- `MARK_PAYMENT_RECONCILED`

10C10-B’de mutation uygulanmama gerekçeleri:

- State mapping netleşmeden mutation risklidir.
- Provider sonucu owner guard olmadan işlenemez.
- Yanlış payment state order / finance zincirini etkiler.
- 10C10-B yalnız karar paketidir.

### 4.8 Retry / Backoff / Timeout Kararı

İlkeler:

- Timeout kesin başarısızlık değildir.
- Unknown_result reconciliation ile kapanır.
- Retry yalnız retry-safe koşullarda yapılır.

Kararlar:

- Status inquiry retry edilebilir.
- Network / timeout / HTTP 5xx retryable kabul edilir.
- status_query_inconclusive retryable kabul edilir.
- Hatalı token / geçersiz merchant config manual review gerektirir.
- Maksimum deneme / backoff implementasyonu 10C10-B kapsamında yapılmaz.

### 4.9 Idempotency / Duplicate Kararı

Anahtarlar:

- providerEventId
- providerReference / merchant_oid
- callbackRecordId
- paymentAttemptId
- idempotencyKey

Kararlar:

- Duplicate callback ikinci mutation üretmemelidir.
- Duplicate status inquiry result ikinci event / order trigger üretmemelidir.
- Terminal payment state guard’ları korunmalıdır.
- providerReference DB-level uniqueness eksikliği risk kaydıdır.

### 4.10 Error Code / API Error Kararı

Önerilen canonical code’lar:

- `PROVIDER_AUTHENTICATION_FAILED`
- `PAYMENT_RECONCILIATION_INCONCLUSIVE`
- `PROVIDER_STATUS_QUERY_FAILED`
- `PAYMENT_UNKNOWN_RESULT`
- `PAYMENT_RECONCILIATION_REQUIRED`
- `PAYMENT_AMOUNT_MISMATCH`
- `PAYMENT_CURRENCY_MISMATCH`

Karar:

- PayTR err_no / err_msg ham şekilde dışarı verilmez.
- Error standardizasyonu gerekir.
- Bu pakette implementation yapılmaz.

### 4.11 Audit / Event Kararı

Net ayrım:

- Event sonuç sinyalidir, truth değildir.
- Audit operasyon kanıtıdır, business truth değildir.

Önerilen kayıtlar:

- `PaymentReconciliationRequired`
- `ProviderStatusInquiryRequested`
- `ProviderStatusInquiryCompleted`
- `PaymentReconciledAsSucceeded`
- `PaymentReconciledAsFailed`
- `PaymentReconciliationInconclusive`
- `PaymentReconciliationRequiresManualReview`
- `PaymentCorrectionPerformed`

Karar:

- Bu pakette audit/event implementation yapılmaz.

### 4.12 Test / Smoke Inventory

Önerilen smoke suit’ler:

- `paytr-status-inquiry-token-smoke`
- `paytr-status-inquiry-mapping-smoke`
- `payment-reconciliation-decision-smoke`
- `payment-reconciliation-idempotency-smoke`
- `payment-reconciliation-no-order-handoff-smoke`
- `payment-reconciliation-no-finance-risk-mutation-smoke`

### 4.13 Kırmızı / Sarı Bayraklar

Kırmızı bayrak:

- Yok.

Sarı bayraklar:

- Kod ve planlama state isimleri uyumsuzluğu
- providerReference DB-level uniqueness guarantee eksikliği
- PayTR returns alanının kapsam dışı kalması gerekliliği
- pending / unknown_result erken mutation riski
- provider sonucunun doğrudan business truth kabul edilmesi riski

### 4.14 Nihai Karar

`HARDENING-10C10-B — INVENTORY COMPLETE / IMPLEMENTATION REQUIRED`

Sonraki öneri:

`HARDENING-10C10-01 — PayTR Status Inquiry Contract + Mapping Foundation`

---

## 5. HARDENING-10C10-01 — PayTR Status Inquiry Contract + Mapping Foundation

### 5.1 Paket Tanımı

Bu paket, PayTR Status Inquiry API entegrasyonu için temel contract, token oluşturma ve response mapping helper fonksiyonlarını eklemiştir.

Bu çalışma canlı entegrasyon veya mutation paketi değildir. Amaç, reconciliation adımları için güvenli ve test edilebilir temel oluşturmaktır.

### 5.2 Değişen Dosyalar

- `packages/contracts/src/payment.ts`
- `tests/smoke/suites/paytr-status-inquiry-mapping.ts`

### 5.3 Eklenen Contract Tipleri

- `PaytrStatusInquiryRequest`
- `PaytrStatusInquirySuccessResponse`
- `PaytrStatusInquiryErrorResponse`
- `PaytrStatusInquiryResponse`
- `NormalizedPaytrStatusInquiryStatus`
- `NormalizedPaytrStatusInquiryCandidate`

`PaytrStatusInquirySuccessResponse` içinde `payment_amount` ve `payment_total` alanları `string | number` olarak desteklenmiştir.

`NormalizedPaytrStatusInquiryCandidate`, provider response’unu doğrudan business truth kabul etmeyen, güvenli internal candidate modelidir.

### 5.4 Eklenen Helper Fonksiyonları

- `createPaytrStatusInquiryToken(input)`
- `normalizePaytrCurrency(input)`
- `parsePaytrAmountToMinorUnit(input)`
- `mapPaytrStatusInquiryToReconciliationCandidate(input)`

### 5.5 Mapping Kararları

- success response amount/currency doğrulaması sonrası `succeeded_candidate` üretebilir.
- payment_amount ve payment_total uyuşmazlığı `rejected_amount_mismatch` üretir.
- expectedAmountMinor ile eşleşmeyen tutar `rejected_amount_mismatch` üretir.
- currency mismatch `rejected_currency_mismatch` üretir.
- invalid amount format `rejected_unexpected_format` üretir.
- “odeme bulunamadi” `status_query_inconclusive` kabul edilir.
- diğer hatalar `status_query_failed` kabul edilir.
- returns alanı parse edilmez ve candidate status’ünü etkilemez.

### 5.6 Boundary / Owner Safety

- Candidate boundary flags güvenli kalır.
- `providerTruth=false`
- `businessTruthMutated=false`
- `ownerStateMutated=false`
- `eventTruthMutated=false`
- Mapping payment/order/finance/risk mutation üretmez.

### 5.7 Kapsam Dışı

- Live PayTR network request
- Payment mutation
- Order mutation / handoff
- Finance mutation
- Risk mutation
- Worker runtime
- Scheduler / queue
- DB migration
- BFF route

### 5.8 Test Kanıtları

Geçen komutlar:

- `pnpm run typecheck`
- `pnpm run build`
- `pnpm run smoke:paytr-status-inquiry-mapping`

Smoke sonucu:

```text
[PASS] paytr-status-inquiry-mapping - All PayTR status inquiry mapping tests passed.
```

### 5.9 Kırmızı / Sarı Bayrak

Kırmızı bayrak:

- Yok.

Sarı bayrak:

- Bazı tsconfig / dotenv tip uyarıları mevcut olabilir; görev kapsamını engellememiştir.

### 5.10 Nihai Karar

`HARDENING-10C10-01-FIX1 — PASS WITH LIMITATION`

Limitation:

- Canlı PayTR isteği yoktur.
- Payment mutation yoktur.
- Order handoff yoktur.

---

## 6. HARDENING-10C10-02R — PayTR Status Inquiry Adapter Boundary Remediation

### 6.1 Nihai Karar

`HARDENING-10C10-02R — PASS WITH LIMITATION`

Limitation:

- Bu paket non-live PayTR status inquiry adapter boundary olarak kalır.
- Yalnız explicit simulation response ve safe not-configured outcome map eder.

### 6.2 Değişen Dosyalar

- `services/payment/src/provider-adapter.ts`
- `tests/smoke/suites/paytr-status-inquiry-adapter-boundary.ts`
- `package.json`
- `HARDENING-10C10-02-PAYTR-STATUS-INQUIRY-ADAPTER-BOUNDARY-CLOSURE-REPORT.md`

`tests/smoke/run-smoke.ts` zaten suite’e bağlıydı; kod değişikliği gerekmedi.

### 6.3 Remediation Summary

- `InternalSimulationPaymentProviderAdapter.statusInquiry()` artık throw etmez.
- `simulationResponse` varsa `mapPaytrStatusInquiryToReconciliationCandidate()` ile map edilir.
- Sonuç `ProviderResultEnvelope<NormalizedPaytrStatusInquiryCandidate>` döner.
- Envelope metadata korunur:
  - `operation=statusInquiry`
  - `providerDomain=payment`
  - `providerName=internal_simulation`
  - `providerMode=simulation`
  - `idempotencyKey`
  - `correlationId`

Candidate → provider operation status mapping:

- `succeeded_candidate` → `succeeded`
- `status_query_inconclusive` → `unknown_result`
- `status_query_failed` → `failed`
- `rejected_*` → `rejected`

Missing `simulationResponse`:

- safe `unknown_result` envelope
- controlled non-retryable error

Not-configured status inquiry:

- safe `rejected` envelope
- controlled error
- normalized candidate yok

### 6.4 Boundary Assertions

- Live PayTR request yok.
- `fetch`, `axios`, `request`, `node:http`, `node:https` kullanımı yok.
- Gerçek PayTR key / salt / env istenmedi.
- Payment mutation yok.
- Order mutation / handoff yok.
- Finance / risk / settlement / payout mutation yok.
- Worker / scheduler / queue yok.
- BFF route yok.
- Repository / persistence / migration yok.
- Callback worker değişikliği yok.

### 6.5 Test Kanıtları

Geçen komutlar:

- `pnpm run typecheck`
- `pnpm run build`
- `pnpm run smoke:paytr-status-inquiry-mapping`
- `pnpm run smoke:paytr-status-inquiry-adapter-boundary`

Smoke sonucu:

```text
[PASS] paytr-status-inquiry-adapter-boundary - PayTR status inquiry adapter boundary assertions passed without live request usage.
```

---

## 7. HARDENING-10C10-03 — Reconciliation Decision Contract / Task Model Foundation

### 7.1 Paket Tanımı

Bu paket payment reconciliation için contract, task candidate modeli, reconciliation lifecycle status tipi ve pure decision helper foundation ekler.

Bu paket runtime, worker, scheduler, queue, DB persistence, migration, payment mutation, PayTR live integration, order handoff veya finance/risk/settlement/payout mutation paketi değildir.

### 7.2 Değişen Dosyalar

- `packages/contracts/src/payment.ts`
- `tests/smoke/suites/payment-reconciliation-decision.ts`
- `tests/smoke/run-smoke.ts`
- `package.json`
- `HARDENING-10C10-03-RECONCILIATION-DECISION-CONTRACT-TASK-MODEL-CLOSURE-REPORT.md`

### 7.3 Eklenen Reconciliation Contract Tipleri

- `ReconciliationStatus`
- `PaymentReconciliationTriggerReason`
- `PaymentReconciliationTaskCandidate`
- `PaymentReconciliationDecisionType`
- `PaymentReconciliationDecision`
- `PaymentReconciliationDecisionInput`

`ReconciliationStatus` değerleri:

- `reconciliation_required`
- `status_query_pending`
- `status_query_succeeded`
- `status_query_failed`
- `status_query_inconclusive`
- `manual_review_required`
- `reconciled`
- `reconciliation_rejected`

### 7.4 Eklenen Helper Fonksiyonları

- `createPaymentReconciliationTaskCandidate()`
- `decidePaymentReconciliationAction()`

Decision davranışları:

- `payment_pending` / `payment_unknown_result` → `schedule_status_query`
- `status_query_inconclusive` + attemptCount < maxAttempts → `retry_status_query`
- `status_query_inconclusive` + attemptCount >= maxAttempts → `require_manual_review`
- `succeeded_candidate` → `mark_reconciled_candidate`
- `rejected_amount_mismatch` → `require_manual_review`
- `rejected_currency_mismatch` → `require_manual_review`
- `status_query_failed` + attemptCount < maxAttempts → `retry_status_query`
- `status_query_failed` + attemptCount >= maxAttempts → `require_manual_review`
- `terminal_conflict` → `require_manual_review`

Tüm decision sonuçlarında:

- `shouldProcessPaymentMutation=false`

### 7.5 Boundary / Owner Safety

- Task/decision çıktıları safe boundary flag taşır.
- `businessTruthMutated=false`
- `ownerStateMutated=false`
- `eventTruthMutated=false`
- `outboxDeliveryGuaranteed=false`
- Payment mutation yoktur.
- Provider status inquiry sonucu business truth değildir.
- Decision helper payment mutation command üretmez.

### 7.6 Kapsam Dışı

- Live PayTR
- Payment mutation
- Worker runtime
- Scheduler / queue
- Repository / persistence
- Migration
- BFF route
- Order create / handoff
- Finance / settlement / payout mutation
- Risk mutation
- HARDENING_PROGRESS_RECORD değişikliği

### 7.7 Test Kanıtları

Geçen komutlar:

- `pnpm run typecheck`
- `pnpm run build`
- `pnpm run smoke:paytr-status-inquiry-mapping`
- `pnpm run smoke:paytr-status-inquiry-adapter-boundary`
- `pnpm run smoke:payment-reconciliation-decision`

Smoke sonucu:

```text
[PASS] payment-reconciliation-decision - Payment reconciliation decision contract assertions passed without mutation decisions.
```

### 7.8 Kırmızı / Sarı Bayrak

Kırmızı bayrak:

- Yok.

Sarı bayrak:

- Runtime veya persistence içermediği için reconciliation task lifecycle henüz çalışan sistem davranışı değildir.
- Payment mutation kontrollü owner-command paketine bırakılmıştır.

### 7.9 Nihai Karar

`HARDENING-10C10-03 — PASS WITH LIMITATION`

---

## 8. HARDENING-10C10-04 — Reconciliation Task Persistence / Repository Foundation

### 8.1 Paket Tanımı

Bu paket 10C10-03 ile eklenen reconciliation task contract modeline uygun persistence/repository foundation ekler.

Bu paket reconciliation runtime, worker, scheduler, queue, PayTR live integration, payment mutation, order handoff, finance/risk/settlement/payout mutation veya BFF route paketi değildir.

### 8.2 Değişen Dosyalar

- `packages/persistence/src/payment-reconciliation-task.ts`
- `packages/persistence/src/index.ts`
- `infra/migrations/20260507_001_payment_reconciliation_task_persistence.sql`
- `tests/smoke/suites/payment-reconciliation-task-persistence.ts`
- `tests/smoke/run-smoke.ts`
- `package.json`
- `HARDENING-10C10-04-RECONCILIATION-TASK-PERSISTENCE-REPOSITORY-CLOSURE-REPORT.md`

### 8.3 Eklenen Repository Interface

`PaymentReconciliationTaskRepository`:

- `createTask(candidate)`
- `getTaskById(taskId)`
- `getTaskByReconciliationRef(reconciliationRef)`
- `findOpenTaskByProviderReference(providerName, providerReference)`
- `listTasksByStatus(status, limit)`
- `updateTaskStatus(taskId, update)`
- `markTaskAttempt(taskId, update)`

Implementation’lar:

- `InMemoryPaymentReconciliationTaskRepository`
- `PostgresPaymentReconciliationTaskRepository`
- `getPaymentReconciliationTaskRepository()`

### 8.4 Migration Özeti

Yeni idempotent migration:

- `infra/migrations/20260507_001_payment_reconciliation_task_persistence.sql`

Tablo:

- `payment_reconciliation_tasks`

Alanlar:

- `id`
- `reconciliation_ref`
- `payment_id`
- `payment_attempt_id`
- `checkout_id`
- `provider_name`
- `provider_reference`
- `merchant_oid`
- `trigger_reason`
- `status`
- `attempt_count`
- `max_attempts`
- `next_attempt_at`
- `last_inquiry_ref`
- `last_candidate`
- `manual_review_required`
- `boundary`
- `created_at`
- `updated_at`

Index / constraint:

- unique index: `idx_payment_reconciliation_tasks_reconciliation_ref`
- index: `idx_payment_reconciliation_tasks_status`
- partial index: `idx_payment_reconciliation_tasks_provider_reference`
- partial index: `idx_payment_reconciliation_tasks_merchant_oid`

Migration dokunmadı:

- payments
- provider_callback_events
- order
- finance
- risk
- settlement
- payout

Destructive işlem yoktur.

### 8.5 Idempotency / Duplicate Davranışı

- `reconciliationRef` zorunlu tutuldu.
- In-memory aynı reconciliationRef tekrarında mevcut task döndürür.
- Postgres `ON CONFLICT (reconciliation_ref) DO NOTHING` kullanır.
- Conflict durumunda mevcut task okunur.
- `provider_reference` için unique constraint eklenmedi; sadece sorgu index’i eklendi.

### 8.6 Boundary / Owner Safety

- Repository sadece reconciliation task kaydı üzerinde çalışır.
- Status update sadece task status değiştirir.
- Attempt update sadece task attempt alanlarını değiştirir.
- Payment mutation yok.
- Provider callback processing status mutation yok.
- Order mutation yok.
- Finance/risk/settlement/payout mutation yok.
- Live PayTR yok.
- Worker/scheduler/queue yok.
- BFF route yok.

### 8.7 Kapsam Dışı

- Live PayTR
- Payment mutation
- Payment owner command application
- Worker runtime
- Scheduler / queue
- BFF route
- Order create / handoff
- Finance / settlement / payout mutation
- Risk mutation
- HARDENING_PROGRESS_RECORD değişikliği

### 8.8 Test Kanıtları

Geçen komutlar:

- `pnpm run typecheck`
- `pnpm run build`
- `pnpm run smoke:paytr-status-inquiry-mapping`
- `pnpm run smoke:paytr-status-inquiry-adapter-boundary`
- `pnpm run smoke:payment-reconciliation-decision`
- `pnpm run smoke:payment-reconciliation-task-persistence`

Smoke sonucu:

```text
[PASS] payment-reconciliation-task-persistence - Payment reconciliation task persistence assertions passed with in-memory repository and no owner mutations.
```

Migration verify notu:

- `packages/persistence/verify-schema.ts` yeni tablo ve indexleri kontrol etmediği için bu paket için kanıt üretmez.
- Postgres repository typecheck/build ile doğrulandı.
- Smoke suite in-memory repository davranışını doğrular.

### 8.9 Kırmızı / Sarı Bayrak

Kırmızı bayrak:

- Yok.

Sarı bayrak:

- Runtime veya DB-backed smoke yoktur.
- Postgres create/get/update davranışı migration uygulanmış test DB üzerinde ayrıca koşulabilir.

### 8.10 Nihai Karar

`HARDENING-10C10-04 — PASS WITH LIMITATION`

---

## 9. HARDENING-10C10-05 — Reconciliation Worker Dry-Run / No Mutation

### 9.1 Paket Tanımı

Bu paket reconciliation task repository üzerinden açık task okuyabilen, PayTR status inquiry adapter boundary üzerinden simulation/dry-run inquiry çalıştırabilen ve pure reconciliation decision helper ile karar üretebilen dry-run worker foundation ekler.

Bu paket live PayTR integration, payment mutation, payment owner command execution, order handoff, finance/risk/settlement/payout mutation, DB migration, BFF route veya production scheduler/queue paketi değildir.

### 9.2 Değişen Dosyalar

- `services/payment/src/reconciliation-worker.ts`
- `services/payment/src/index.ts`
- `tests/smoke/suites/payment-reconciliation-worker-dry-run.ts`
- `tests/smoke/run-smoke.ts`
- `package.json`
- `HARDENING-10C10-05-RECONCILIATION-WORKER-DRY-RUN-CLOSURE-REPORT.md`

### 9.3 Eklenen Export’lar

- `processPaymentReconciliationTaskDryRun(input)`
- `runPaymentReconciliationWorkerDryRun(input)`

### 9.4 `processPaymentReconciliationTaskDryRun` Davranışı

- Tek reconciliation task için provider adapter `statusInquiry()` çağrısı yapar.
- Çağrı yalnız adapter boundary üzerinden çalışır.
- Live HTTP request eklenmez.
- simulationResponse varsa normalized PayTR status inquiry candidate üretir.
- simulationResponse yoksa safe `unknown_result` envelope davranışını kullanır.
- Candidate varsa `decidePaymentReconciliationAction()` kararına dahil eder.
- Repository üzerinde yalnız reconciliation task attempt/status güncellemesi yapar.
- Sonuçta `dryRun=true` ve `mutationApplied=false` döndürür.

### 9.5 `runPaymentReconciliationWorkerDryRun` Davranışı

- `listTasksByStatus()` ile task snapshot alır.
- Her task için `processPaymentReconciliationTaskDryRun()` çalıştırır.
- Scheduler, cron, sonsuz loop, background runtime veya boot integration eklemez.
- Expected amount/currency task modelinde bulunmadığı için input seviyesinde açık sağlanır.
- Eksik expected amount/currency durumunda inquiry çalıştırılmaz ve warning döner.

### 9.6 Repository / Adapter / Decision Akışı

Akış:

1. Repository task sağlar.
2. Worker adapter `statusInquiry()` çağrısı yapar.
3. Adapter simulation response’u candidate modeline map eder.
4. Worker `decidePaymentReconciliationAction()` ile dry-run karar üretir.
5. Worker yalnız `markTaskAttempt` ve `updateTaskStatus` çağırır.

Status mapping:

- `schedule_status_query` → `status_query_pending`
- `retry_status_query` → decision status
- `mark_reconciled_candidate` → `status_query_succeeded`
- `require_manual_review` → `manual_review_required`
- `reject_reconciliation` → `reconciliation_rejected`
- `no_action` → mevcut status korunur

### 9.7 Boundary / Owner Safety

- Boundary flag’leri korunur.
- Provider envelope ve normalized candidate boundary flag’leri smoke ile doğrulanır.
- `decision.shouldProcessPaymentMutation=false`
- `mutationApplied=false`
- Payment state mutation yok.
- Payment owner command execution yok.
- Provider callback processing status mutation yok.
- Order mutation yok.
- Finance/risk/settlement/payout mutation yok.
- Live PayTR yok.
- Scheduler/queue/background runtime yok.
- BFF route yok.
- Migration yok.

### 9.8 Kapsam Dışı

- Live PayTR
- Payment mutation
- Payment owner command execution
- Order create / handoff
- Finance / settlement / payout mutation
- Risk mutation
- DB migration
- BFF route
- Scheduler / queue / background runtime
- HARDENING_PROGRESS_RECORD değişikliği

### 9.9 Test Kanıtları

Geçen komutlar:

- `pnpm run typecheck`
- `pnpm run build`
- `pnpm run smoke:paytr-status-inquiry-mapping`
- `pnpm run smoke:paytr-status-inquiry-adapter-boundary`
- `pnpm run smoke:payment-reconciliation-decision`
- `pnpm run smoke:payment-reconciliation-task-persistence`
- `pnpm run smoke:payment-reconciliation-worker-dry-run`

Smoke sonucu:

```text
[PASS] payment-reconciliation-worker-dry-run - Payment reconciliation worker dry-run assertions passed without live requests or owner mutations.
```

### 9.10 Kırmızı / Sarı Bayrak

Kırmızı bayrak:

- Yok.

Sarı bayrak:

- Worker dry-run input expected amount/currency bilgisini açık ister.
- Reconciliation task persistence modelinde amount/currency alanları bulunmadığı için worker varsayım üretmez.
- Eksik durumda status inquiry çalıştırılmaz ve warning döner.

### 9.11 Nihai Karar

`HARDENING-10C10-05 — PASS WITH LIMITATION`

---

## 10. HARDENING-10C10-06R — Reconciliation Owner Command Guard Fix

### 10.1 Paket Tanımı

Bu fix paketi 10C10-06 source review’da bulunan owner command guard eksiklerini kapatır. Reconciliation decision sonucundan payment owner command eligibility ve guarded owner command candidate üretimi korunur.

Bu paket live PayTR integration, otomatik payment mutation, order handoff, finance/risk/settlement/payout mutation, BFF route, scheduler/queue/background runtime veya DB migration paketi değildir.

### 10.2 Değişen Dosyalar

- `packages/contracts/src/payment.ts`
- `services/payment/src/payment.ts`
- `services/payment/src/reconciliation-worker.ts`
- `tests/smoke/suites/payment-reconciliation-owner-command-guard.ts`
- `tests/smoke/run-smoke.ts`
- `package.json`
- `HARDENING-10C10-06-RECONCILIATION-OWNER-COMMAND-GUARD-CLOSURE-REPORT.md`

### 10.3 Owner Command Eligibility Modeli

Contract seviyesinde eklendi:

- `PaymentReconciliationOwnerCommandEligibilityStatus`
- `PaymentReconciliationOwnerCommandEligibility`
- `decidePaymentReconciliationOwnerCommandEligibility(input)`
- `createPaymentReconciliationOwnerCommand(input)`

Eligibility status değerleri:

- `command_ready`
- `not_eligible`
- `requires_manual_review`
- `requires_retry`
- `rejected`

Guard kuralı:

- `shouldProcessPaymentMutation` yalnız `command_ready` ve `MARK_PAYMENT_SUCCEEDED` için true olabilir.
- paymentAttemptId yoksa succeeded candidate olsa bile command üretilmez.
- Amount mismatch, currency mismatch, inconclusive, failed query ve manual review payment mutation üretemez.

### 10.4 Command Creation Guard Davranışı

`createPaymentReconciliationOwnerCommand()` yalnız şu koşullarda command üretir:

- eligibility `command_ready`
- command type `MARK_PAYMENT_SUCCEEDED`
- paymentAttemptId mevcut

Üretilmeyen command’lar:

- `MARK_PAYMENT_FAILED`
- `MARK_PAYMENT_PENDING`
- `MARK_PAYMENT_UNKNOWN_RESULT`
- amount/currency mismatch command
- inconclusive/error/manual review command

Deterministic idempotency key:

```text
payment-reconciliation:{providerName}:{reconciliationRef or providerReference}:{paymentAttemptId}:{commandType}
```

Command source contract’i `reconciliation_worker` değerini destekleyecek şekilde kontrollü genişletildi.

`applyPaymentCallbackOwnerCommand()` içinde:

- `reconciliation_worker` source’u yalnız `MARK_PAYMENT_SUCCEEDED` için kabul edilir.
- Unsupported command type reddedilir.

Terminal conflict fix:

- `FAILED -> SUCCEEDED` yasak kalır.
- `CANCELLED -> SUCCEEDED` yasaklandı.
- `SUCCEEDED -> FAILED` yasak kalır.
- Terminal conflict mutation yapmaz.
- Result:
  - `applied=false`
  - `ignored=true`
  - error `PAYMENT_TERMINAL_STATE_CONFLICT`

### 10.5 Reconciliation Worker Entegrasyonu

Dry-run worker default davranışı korunmuştur.

`processPaymentReconciliationTaskDryRun()` sonucuna eklendi:

- `ownerCommandEligibility`
- `ownerCommandCandidate`

Worker otomatik owner command execution yapmaz. `mutationApplied=false` kalır.

Not:

- `services/payment` workspace’inin `@hx/contracts` path’i bazı typecheck bağlamlarında dist/source farkı gösterdiği için worker-local helper duplication korunmuştur.
- Smoke testte contract helper ile worker helper’ın aynı succeeded_candidate input için aynı command identity/idempotency ürettiği kanıtlanmıştır.

### 10.6 Boundary / Owner Safety

- Boundary flag’leri eligibility ve command candidate üzerinde korunur.
- Dry-run worker default kalır.
- Payment mutation default çalışmaz.
- Worker owner command apply path’e bağlanmadı.
- `reconciliation_worker` unsupported command type reddedilir.
- FAILED ve CANCELLED terminal state üstüne reconciliation succeeded command mutation yapamaz.
- Order mutation yok.
- Finance/risk/settlement/payout mutation yok.
- Live PayTR yok.
- Scheduler/queue/background runtime yok.
- BFF route yok.
- Migration yok.

### 10.7 Kapsam Dışı

- Live PayTR
- Otomatik payment mutation
- Order create / handoff
- Finance / settlement / payout mutation
- Risk mutation
- DB migration
- BFF route
- Scheduler / queue / background runtime
- HARDENING_PROGRESS_RECORD değişikliği

### 10.8 Test Kanıtları

Geçen komutlar:

- `pnpm run typecheck`
- `pnpm run build`
- `pnpm run smoke:payment-reconciliation-decision`
- `pnpm run smoke:payment-reconciliation-worker-dry-run`
- `pnpm run smoke:payment-reconciliation-owner-command-guard`

Smoke sonucu:

```text
[PASS] payment-reconciliation-owner-command-guard - Payment reconciliation owner command guard assertions passed with dry-run default and guarded succeeded-only command creation.
```

Ek 06R smoke kapsamı:

- FAILED state üzerinde reconciliation_worker + MARK_PAYMENT_SUCCEEDED reddedilir.
- CANCELLED state üzerinde reconciliation_worker + MARK_PAYMENT_SUCCEEDED reddedilir.
- Unsupported command type `RECONCILIATION_OWNER_COMMAND_TYPE_NOT_SUPPORTED` döner.
- Contract helper ve worker helper aynı command identity/idempotency üretir.

### 10.9 Kırmızı / Sarı Bayrak

Kırmızı bayrak:

- Yok.

Sarı bayrak:

- Worker owner command candidate üretir ancak default olarak apply etmez.
- Controlled payment mutation explicit opt-in runtime ve daha geniş owner-domain kanıtlarıyla sonraki pakete bırakılmıştır.

### 10.10 Nihai Karar

`HARDENING-10C10-06R — PASS WITH LIMITATION`

---

## 11. HARDENING-10C10-07 — Controlled Reconciliation Payment Mutation

### 11.1 Paket Tanımı

Bu paket reconciliation worker dry-run sonucunda üretilen guarded owner command candidate’in yalnız explicit opt-in ile payment owner transition’a uygulanmasını ekler.

Bu paket live PayTR integration, order handoff, finance/risk/settlement/payout mutation, BFF route, scheduler/queue/background runtime veya DB migration paketi değildir.

### 11.2 Değişen Dosyalar

- `services/payment/src/reconciliation-worker.ts`
- `tests/smoke/suites/payment-reconciliation-controlled-mutation.ts`
- `tests/smoke/run-smoke.ts`
- `package.json`
- `HARDENING-10C10-07-CONTROLLED-RECONCILIATION-PAYMENT-MUTATION-CLOSURE-REPORT.md`

### 11.3 Explicit Opt-in Mutation Davranışı

`processPaymentReconciliationTaskDryRun()` input modeline eklendi:

- `enableOwnerCommandApplication?: boolean`

Default davranış değişmedi:

- Dry-run owner command candidate üretse bile payment mutation uygulamaz.
- `mutationApplied=false`

Yeni export:

- `processPaymentReconciliationTaskControlledMutation(input)`

Bu fonksiyon önce mevcut dry-run akışını çalıştırır:

- status inquiry
- reconciliation decision
- owner command eligibility
- guarded owner command candidate
- reconciliation task attempt/status update

Sonra yalnız `enableOwnerCommandApplication === true` ise guard seti geçerse `applyPaymentCallbackOwnerCommand()` çağrılır.

Task status notu:

- Successful payment mutation sonrası bu pakette task status `reconciled` yapılmaz.
- Task status `status_query_succeeded` olarak kalır.
- `reconciled` upgrade sonraki pakete bırakıldı.

### 11.4 Controlled Apply Guard Seti

Tüm koşullar birlikte aranır:

- `enableOwnerCommandApplication === true`
- `ownerCommandEligibility.status === command_ready`
- `ownerCommandEligibility.shouldProcessPaymentMutation === true`
- `ownerCommandCandidate.commandType === MARK_PAYMENT_SUCCEEDED`
- `decision.decisionType === mark_reconciled_candidate`
- provider candidate `normalizedStatus === succeeded_candidate`
- task.paymentAttemptId mevcut

Fail-safe durumlar:

- opt-in false → mutation yok
- candidate yok → mutation yok
- eligibility command_ready değil → mutation yok
- command type MARK_PAYMENT_SUCCEEDED değil → mutation yok
- amount mismatch → mutation yok
- currency mismatch → mutation yok
- inconclusive / failed query → mutation yok
- missing paymentAttemptId → mutation yok
- manual review / retry / rejected → mutation yok

### 11.5 Terminal Conflict ve Idempotency

Korunan guard path:

- `reconciliation_worker` yalnız `MARK_PAYMENT_SUCCEEDED` için kabul edilir.
- FAILED → SUCCEEDED reddedilir.
- CANCELLED → SUCCEEDED reddedilir.
- Duplicate/idempotent tekrarda:
  - `alreadyApplied=true`
  - `applied=false`
  - state SUCCEEDED kalır

Terminal conflict sonucu:

- `applied=false`
- `ignored=true`
- error `PAYMENT_TERMINAL_STATE_CONFLICT`
- payment state değişmez
- `mutationApplied=false`

### 11.6 Boundary / Owner Safety

- Default worker dry-run kaldı.
- Payment mutation sadece explicit opt-in controlled fonksiyonda çalışır.
- Mutation yalnız payment owner domain içindeki `applyPaymentCallbackOwnerCommand()` path’i üzerinden yapılır.
- Order mutation yok.
- Finance/risk/settlement/payout mutation yok.
- Live PayTR yok.
- Scheduler/queue/background runtime yok.
- BFF route yok.
- Migration yok.
- Yeni DB tablo/kolon yok.
- HARDENING_PROGRESS_RECORD değişmedi.

Audit/outbox notu:

- Bu paket yeni audit/outbox implementation eklemez.
- Existing apply path audit/outbox üretmiyorsa bu paket genişletmez.

### 11.7 Kapsam Dışı

- Live PayTR
- Order create / handoff
- Finance / settlement / payout mutation
- Risk mutation
- BFF route
- DB migration
- Scheduler / queue / background runtime
- Yeni audit/outbox implementation
- HARDENING_PROGRESS_RECORD değişikliği

### 11.8 Test Kanıtları

Geçen komutlar:

- `pnpm run typecheck`
- `pnpm run build`
- `pnpm run smoke:paytr-status-inquiry-mapping`
- `pnpm run smoke:paytr-status-inquiry-adapter-boundary`
- `pnpm run smoke:payment-reconciliation-decision`
- `pnpm run smoke:payment-reconciliation-task-persistence`
- `pnpm run smoke:payment-reconciliation-worker-dry-run`
- `pnpm run smoke:payment-reconciliation-owner-command-guard`
- `pnpm run smoke:payment-reconciliation-controlled-mutation`

Smoke sonucu:

```text
[PASS] payment-reconciliation-controlled-mutation - Payment reconciliation controlled mutation assertions passed with explicit opt-in, terminal conflict, idempotency, and owner-boundary guards.
```

Controlled mutation smoke kapsamı:

- Default dry-run payment state değiştirmez.
- Explicit opt-in success payment SUCCEEDED yapar.
- Duplicate idempotent safe kalır.
- FAILED terminal conflict safe kalır.
- CANCELLED terminal conflict safe kalır.
- Amount mismatch manual review üretir; mutation yok.
- Currency mismatch manual review üretir; mutation yok.
- Inconclusive / failed query retry eligibility üretir; mutation yok.
- Missing paymentAttemptId not_eligible üretir; mutation yok.
- Result/payment shape içinde order/finance/risk/settlement/payout alanları yoktur.

### 11.9 Kırmızı / Sarı Bayrak

Kırmızı bayrak:

- Yok.

Sarı bayraklar:

- Controlled mutation existing `applyPaymentCallbackOwnerCommand()` path’i üzerinden payment truth yazar; yeni audit/outbox kaydı eklemez.
- Successful controlled mutation sonrası reconciliation task status bu pakette `reconciled` yapılmaz.

### 11.10 Nihai Karar

`HARDENING-10C10-07 — PASS WITH LIMITATION`

---

## 12. HARDENING-10C10-08 — Reconciliation E2E Smoke / No Order Handoff Validation

### 12.1 Paket Tanımı

Bu paket 10C10 reconciliation hattının uçtan uca smoke/validation paketidir.

Kapsam, PayTR status inquiry mapping’den controlled payment owner mutation’a kadar zincirin simulation response ile kanıtlanmasıdır.

Bu paket live PayTR integration, order handoff, finance/risk/settlement/payout mutation, BFF route, scheduler/queue/background runtime, DB migration veya yeni audit/outbox implementation paketi değildir.

### 12.2 Değişen Dosyalar

- `tests/smoke/suites/payment-reconciliation-e2e-no-order-handoff.ts`
- `tests/smoke/run-smoke.ts`
- `package.json`
- `HARDENING-10C10-08-RECONCILIATION-E2E-NO-ORDER-HANDOFF-CLOSURE-REPORT.md`

`services/payment/src/reconciliation-worker.ts` değişmedi.

### 12.3 E2E Reconciliation Akışı

Smoke suite:

- In-memory payment repository kullanır.
- INITIATED / PROVIDER_REDIRECT_READY payment oluşturur.
- Reconciliation task oluşturur.
- PayTR status inquiry success simulationResponse kullanır:
  - `status=success`
  - `payment_amount=100.00`
  - `payment_total=100.00`
  - `currency=TRY`
- `processPaymentReconciliationTaskControlledMutation()` fonksiyonunu `enableOwnerCommandApplication=true` ile çalıştırır.

Kanıtlanan assert’ler:

- provider candidate `succeeded_candidate`
- decision `mark_reconciled_candidate`
- owner eligibility `command_ready`
- owner command candidate `MARK_PAYMENT_SUCCEEDED`
- owner command apply result `applied=true`
- `mutationApplied=true`
- payment state `SUCCEEDED`
- payment attempt state `SUCCEEDED`

Default dry-run regression:

- Aynı success simulation response ile dry-run çalışır.
- Owner command candidate oluşabilir.
- `mutationApplied=false`
- payment state `INITIATED`
- payment attempt state `PROVIDER_REDIRECT_READY`

### 12.4 No Order Handoff Kanıtı

Runtime assert’ler:

- Controlled mutation result içinde yok:
  - `orderId`
  - `orderStatus`
  - `orderCreated`
  - `orderHandoff`
  - `orderCommand`
- Payment object içinde order handoff shape yok.
- Payment attempt object içinde order handoff shape yok.

Source-level assert dosyaları:

- `services/payment/src/reconciliation-worker.ts`
- `tests/smoke/suites/payment-reconciliation-e2e-no-order-handoff.ts`

Reddedilen pattern’ler:

- `services/order`
- `@hx/order`
- `createOrder(...)`
- `handoffToOrder(...)`
- `orderHandoff(...)`

Sonuç:

- order create / order handoff eklenmedi.

### 12.5 Negative Case Kanıtları

Kapsam:

- Amount mismatch
- Currency mismatch
- Inconclusive
- Failed query
- FAILED terminal conflict
- CANCELLED terminal conflict
- Duplicate success

Her negative case için doğrulanan ana sonuçlar:

- mutation yok veya safe no-op
- payment state yanlış değiştirilmez
- candidate/apply guard’ları çalışır
- order/finance/settlement/payout/risk mutation shape yoktur

### 12.6 Boundary / Owner Safety

- Live PayTR yok.
- Gerçek HTTP çağrısı yok.
- Gerçek key/salt/env yok.
- Simulation response ile çalışır.
- Payment mutation sadece explicit opt-in ve owner guard path üzerinden çalışır.
- Default dry-run state değiştirmez.
- Amount/currency mismatch mutation üretmez.
- Inconclusive/failed query mutation üretmez.
- FAILED/CANCELLED üstüne SUCCEEDED yazılamaz.
- Duplicate/idempotent command safe kalır.
- Order handoff yok.
- Finance/risk/settlement/payout mutation yok.
- Scheduler/queue/background runtime yok.
- BFF route yok.
- Migration yok.
- HARDENING_PROGRESS_RECORD değişmedi.

Source-level live request yasakları:

- `fetch(`
- `axios`
- `request(`
- `node:http`
- `node:https`
- `require('http')`
- `require('https')`

### 12.7 Test Kanıtları

Geçen komutlar:

- `pnpm run typecheck`
- `pnpm run build`
- `pnpm run smoke:paytr-status-inquiry-mapping`
- `pnpm run smoke:paytr-status-inquiry-adapter-boundary`
- `pnpm run smoke:payment-reconciliation-decision`
- `pnpm run smoke:payment-reconciliation-task-persistence`
- `pnpm run smoke:payment-reconciliation-worker-dry-run`
- `pnpm run smoke:payment-reconciliation-owner-command-guard`
- `pnpm run smoke:payment-reconciliation-controlled-mutation`
- `pnpm run smoke:payment-reconciliation-e2e-no-order-handoff`

Smoke sonucu:

```text
[PASS] payment-reconciliation-e2e-no-order-handoff - Payment reconciliation E2E assertions passed with explicit opt-in payment mutation, dry-run regression, negative cases, and no order handoff.
```

### 12.8 Kırmızı / Sarı Bayrak

Kırmızı bayrak:

- Yok.

Sarı bayraklar:

- Bu paket yeni business capability eklemez; smoke/validation paketidir.
- Payment succeeded order created değildir.
- Yeni audit/outbox implementation eklemez.

### 12.9 Nihai Karar

`HARDENING-10C10-08 — PASS WITH LIMITATION`

---

## 13. HARDENING-10C10-09 — Reconciliation Audit/Outbox + Task Finalization Guard

### 13.1 Paket Tanımı

Bu paket successful controlled reconciliation payment mutation sonrasında reconciliation lifecycle finalization, audit evidence ve idempotent outbox/event evidence kanıt paketidir.

Bu paket live PayTR integration, order handoff, finance/risk/settlement/payout mutation, BFF route, scheduler/queue/background runtime, DB migration veya yeni tablo/kolon paketi değildir.

### 13.2 Değişen Dosyalar

- `services/payment/src/reconciliation-worker.ts`
- `tests/smoke/suites/payment-reconciliation-audit-outbox-finalization.ts`
- `tests/smoke/run-smoke.ts`
- `package.json`
- `HARDENING-10C10-09-RECONCILIATION-AUDIT-OUTBOX-FINALIZATION-CLOSURE-REPORT.md`

### 13.3 Task Finalization Davranışı

Controlled mutation sonrası task finalization yalnız şu koşullarda çalışır:

- decision `mark_reconciled_candidate`
- owner command candidate `MARK_PAYMENT_SUCCEEDED`
- owner command apply result `applied=true`

Bu durumda reconciliation task status:

- `reconciled`

Not:

- Bu payment state mutation değildir.
- Yalnız reconciliation task repository üzerinden lifecycle final status update’tir.

Duplicate/alreadyApplied kararı:

- `alreadyApplied=true`
- payment state `SUCCEEDED`
- payment attempt state `SUCCEEDED`
- decision ve owner command guard success reconciliation ile uyumluysa task `reconciled` yapılabilir.
- `mutationApplied=false` kalır çünkü ikinci çalıştırmada payment owner mutation yeniden uygulanmaz.

### 13.4 Audit Evidence Davranışı

Successful finalization sonrası audit evidence append edilir.

Audit action:

- `payment.reconciliation.completed`

Audit alanları:

- `ownerService=payment`
- `entityType=payment`
- `entityId=paymentId`
- `actorType=SYSTEM`
- `actorId=reconciliation-worker`
- `correlationId`
- deterministic reconciliation completion idempotency key
- before/after state summary

Audit metadata:

- `reconciliationRef`
- `paymentAttemptId`
- `providerName`
- `providerReference`
- `normalizedStatus=succeeded_candidate`
- `ownerCommandType=MARK_PAYMENT_SUCCEEDED`
- `orderCreated=false`
- `orderHandoff=false`
- `financeMutation=false`
- `riskMutation=false`

Audit ilkeleri:

- Audit business truth değildir.
- Audit append failure payment mutation rollback yapmaz.
- Failure result içinde evidence warning olarak döner.

Sarı bayrak:

- Mevcut audit repository API’sinde genel idempotency key conflict handling yoktur.
- Deterministic `auditId` ve idempotency key kullanılır.
- Memory smoke duplicate run’da tek audit kaydı kanıtlar.
- Postgres duplicate deterministic auditId append failure warning’e düşebilir.

### 13.5 Outbox Evidence Davranışı

Successful finalization sonrası outbox evidence append edilir.

Topic:

- `payment.reconciliation.completed`

Payload:

- `paymentId`
- `paymentAttemptId`
- `checkoutId`
- `reconciliationRef`
- `providerName`
- `providerReference`
- `state=SUCCEEDED`
- `orderCreated=false`
- `orderHandoff=false`

Deterministic idempotency key:

```text
payment-reconciliation-completed:{reconciliationRef}:{paymentAttemptId}
```

Duplicate run:

- aynı outbox idempotency key
- aynı outbox event
- topic `order.*` değildir
- payload order command taşımaz

### 13.6 No Order Handoff Kanıtı

Runtime assert’ler:

- controlled result order command shape taşımaz
- outbox payload order command shape taşımaz
- audit metadata `orderCreated=false`
- audit metadata `orderHandoff=false`
- outbox payload `orderCreated=false`
- outbox payload `orderHandoff=false`

Source-level assert dosyaları:

- `services/payment/src/reconciliation-worker.ts`
- `tests/smoke/suites/payment-reconciliation-audit-outbox-finalization.ts`

Reddedilen pattern’ler:

- `services/order`
- `@hx/order`
- `createOrder(...)`
- `handoffToOrder(...)`
- `orderHandoff(...)`
- order command token
- `topic: 'order.`
- `topic: "order.`

Sonuç:

- order create yok
- order handoff yok
- order event trigger yok

### 13.7 Negative Case Kanıtları

Aşağıdaki durumlarda task finalization, audit ve outbox üretilmediği kanıtlandı:

- Default dry-run
- Amount mismatch
- Currency mismatch
- Inconclusive
- Failed query
- FAILED terminal conflict
- CANCELLED terminal conflict
- Missing paymentAttemptId

Duplicate success durumunda:

- ikinci çalıştırmada `alreadyApplied=true`
- `mutationApplied=false`
- task `reconciled`
- outbox idempotency key aynı
- outbox event id aynı
- audit kaydı tek
- order handoff yok

### 13.8 Boundary / Owner Safety

- Live PayTR yok.
- Gerçek HTTP çağrısı yok.
- Gerçek key/salt/env yok.
- Simulation response ile çalışır.
- Payment mutation yalnız explicit opt-in ve payment owner guard path üzerinden çalışır.
- `mutationApplied` yalnız payment owner mutation uygulanınca true olur.
- `taskFinalized` ayrı flag’tir.
- Audit business truth değildir.
- Outbox business truth değildir.
- Event order handoff tetiklemez.
- Default dry-run audit/outbox üretmez.
- Amount/currency mismatch audit/outbox/finalization üretmez.
- Inconclusive/failed query audit/outbox/finalization üretmez.
- FAILED/CANCELLED üstüne SUCCEEDED yazılamaz.
- Order handoff yok.
- Finance/risk/settlement/payout mutation yok.
- Scheduler/queue/background runtime yok.
- BFF route yok.
- Migration yok.
- Yeni DB tablo/kolon yok.
- HARDENING_PROGRESS_RECORD değişmedi.

Source-level live request yasakları:

- `fetch(`
- `axios`
- `request(`
- `node:http`
- `node:https`
- `require('http')`
- `require('https')`

### 13.9 Kapsam Dışı

- Live PayTR integration
- Gerçek PayTR HTTP çağrısı
- Gerçek key/salt/env
- Order create / order handoff
- Order event trigger / order command
- Finance / settlement / payout mutation
- Risk mutation
- BFF route
- DB migration
- Yeni DB tablo/kolon
- Scheduler / queue / background runtime
- Yeni audit/outbox storage implementation
- HARDENING_PROGRESS_RECORD değişikliği

### 13.10 Test Kanıtları

Geçen komutlar:

- `pnpm run typecheck`
- `pnpm run build`
- `pnpm run smoke:payment-reconciliation-controlled-mutation`
- `pnpm run smoke:payment-reconciliation-e2e-no-order-handoff`
- `pnpm run smoke:payment-reconciliation-audit-outbox-finalization`
- `pnpm run smoke:payment-reconciliation-worker-dry-run`
- `pnpm run smoke:payment-reconciliation-owner-command-guard`

Smoke sonucu:

```text
[PASS] payment-reconciliation-audit-outbox-finalization - Payment reconciliation audit/outbox/finalization assertions passed with explicit opt-in evidence, dry-run regression, negative cases, idempotent duplicate evidence, and no order handoff.
```

### 13.11 Kırmızı / Sarı Bayrak

Kırmızı bayrak:

- Yok.

Sarı bayraklar:

- Payment succeeded order created değildir.
- Audit repository genel idempotent append contract’a sahip değildir.
- Postgres duplicate audit append warning üretebilir.
- Outbox event delivery guarantee veya consumer/worker bu paketin konusu değildir.

### 13.12 Nihai Karar

`HARDENING-10C10-09 — PASS WITH LIMITATION`

---

## 14. HARDENING-10C10 Final Closure Summary

### 14.1 Final Kapanış Amacı

Bu kapanış, PayTR status inquiry ve payment reconciliation hattının final durumunu netleştirir.

Hat, ödeme sağlayıcısından gelen belirsiz veya sonradan doğrulanması gereken ödeme sonuçlarının güvenli incelenmesini, ödeme sonucunun kontrollü biçimde netleştirilmesini ve sipariş oluşturma aşamasına geçmeden önce gerekli güvenlik kapılarının kurulmasını amaçlamıştır.

Bu çalışma order oluşturma paketi değildir.

### 14.2 Kapanan Alt Paketler ve Final Durumları

| Paket | Durum | Ana Kapsam |
|---|---|---|
| 10C10-A | BOUNDARY INVENTORY COMPLETE | Sistem alignment ve boundary envanteri |
| 10C10-B | INVENTORY COMPLETE / IMPLEMENTATION REQUIRED | PayTR status inquiry ve reconciliation karar envanteri |
| 10C10-01 | PASS WITH LIMITATION | Contract + mapping foundation |
| 10C10-02R | PASS WITH LIMITATION | Adapter boundary |
| 10C10-03 | PASS WITH LIMITATION | Decision contract / task model |
| 10C10-04 | PASS WITH LIMITATION | Task persistence / repository |
| 10C10-05 | PASS WITH LIMITATION | Worker dry-run |
| 10C10-06R | PASS WITH LIMITATION | Owner command guard |
| 10C10-07 | PASS WITH LIMITATION | Controlled payment mutation |
| 10C10-08 | PASS WITH LIMITATION | E2E smoke / no order handoff |
| 10C10-09 | PASS WITH LIMITATION | Audit/outbox + task finalization |

### 14.3 Ana Güvenlik Kararları

1. PayTR status inquiry response doğrudan business truth kabul edilmedi.
2. Reconciliation önce candidate ve decision üretir.
3. Payment mutation yalnız payment owner domain içinde yapılır.
4. Worker default dry-run kalır.
5. Payment mutation yalnız explicit opt-in ile çalışır.
6. Sadece `MARK_PAYMENT_SUCCEEDED` desteklendi.
7. FAILED veya CANCELLED payment SUCCEEDED yapılamaz.
8. Amount/currency mismatch manual review gerektirir.
9. Inconclusive veya failed query payment mutation üretmez.
10. Payment succeeded order created değildir.
11. Order handoff 10C10 kapsamı dışında tutuldu.
12. Audit ve outbox business truth değildir.
13. Event order handoff tetiklemez.

### 14.4 10C10 Hattında Bilinçli Olarak Yapılmayanlar

- Canlı PayTR request
- Gerçek PayTR HTTP çağrısı
- Production PayTR entegrasyonu
- Order create
- Order handoff
- Finance mutation
- Settlement mutation
- Payout mutation
- Risk mutation
- BFF route
- Scheduler / queue / background runtime
- Outbox consumer / delivery worker
- Production operator panel flow

### 14.5 Kalan Bilinçli Limitations

1. PayTR live/sandbox gerçek request hâlâ yoktur.
2. Reconciliation otomatik scheduler/queue ile çalışmaz.
3. Controlled mutation explicit fonksiyon üzerinden çalışır; production runtime’a bağlanmadı.
4. Audit evidence var ancak audit append idempotency Postgres tarafında ayrıca güçlendirilebilir.
5. Outbox event var ancak delivery/consumer guarantee paketi yoktur.
6. Order handoff hâlâ açılmadı.
7. Payment succeeded sonrası order üretim kararı 10C11’e bırakıldı.
8. Reconciliation task modelinde expected amount/currency bulunmadığı için worker bu değerleri input seviyesinde ister.
9. providerReference için payment tablosunda DB-level uniqueness guarantee eksikliği ileride ayrıca ele alınmalıdır.
10. PayTR returns alanı 10C10 kapsamında işlenmedi; refund/settlement hattına bırakıldı.

### 14.6 Final Karar

`HARDENING-10C10 — CLOSED WITH LIMITATIONS`

Kapanış gerekçesi:

- PayTR status inquiry mapping güvenli kuruldu.
- Reconciliation task, decision, repository, worker ve controlled mutation zinciri doğrulandı.
- Terminal conflict kontrolleri eklendi.
- Duplicate/idempotency kontrolleri eklendi.
- Audit/outbox evidence üretildi.
- No order handoff garantisi korundu.
- Payment succeeded ile order created ayrımı net kaldı.

---

## 15. Birleşik Smoke / Test Kanıt Matrisi

Aşağıdaki komutlar 10C10 hattı boyunca ilgili paketlerde PASS olarak raporlanmıştır:

| Komut | Kanıtlanan Kapsam |
|---|---|
| `pnpm run typecheck` | Workspace tip doğrulaması |
| `pnpm run build` | Build doğrulaması |
| `pnpm run smoke:paytr-status-inquiry-mapping` | PayTR status inquiry mapping |
| `pnpm run smoke:paytr-status-inquiry-adapter-boundary` | Adapter boundary ve no live request |
| `pnpm run smoke:payment-reconciliation-decision` | Decision contract ve no mutation |
| `pnpm run smoke:payment-reconciliation-task-persistence` | Task persistence in-memory behavior |
| `pnpm run smoke:payment-reconciliation-worker-dry-run` | Worker dry-run ve no mutation |
| `pnpm run smoke:payment-reconciliation-owner-command-guard` | Owner command guard |
| `pnpm run smoke:payment-reconciliation-controlled-mutation` | Explicit opt-in mutation |
| `pnpm run smoke:payment-reconciliation-e2e-no-order-handoff` | E2E chain + no order handoff |
| `pnpm run smoke:payment-reconciliation-audit-outbox-finalization` | Audit/outbox/finalization evidence |

Tekilleştirilmiş PASS çıktıları:

```text
[PASS] paytr-status-inquiry-mapping - All PayTR status inquiry mapping tests passed.

[PASS] paytr-status-inquiry-adapter-boundary - PayTR status inquiry adapter boundary assertions passed without live request usage.

[PASS] payment-reconciliation-decision - Payment reconciliation decision contract assertions passed without mutation decisions.

[PASS] payment-reconciliation-task-persistence - Payment reconciliation task persistence assertions passed with in-memory repository and no owner mutations.

[PASS] payment-reconciliation-worker-dry-run - Payment reconciliation worker dry-run assertions passed without live requests or owner mutations.

[PASS] payment-reconciliation-owner-command-guard - Payment reconciliation owner command guard assertions passed with dry-run default and guarded succeeded-only command creation.

[PASS] payment-reconciliation-controlled-mutation - Payment reconciliation controlled mutation assertions passed with explicit opt-in, terminal conflict, idempotency, and owner-boundary guards.

[PASS] payment-reconciliation-e2e-no-order-handoff - Payment reconciliation E2E assertions passed with explicit opt-in payment mutation, dry-run regression, negative cases, and no order handoff.

[PASS] payment-reconciliation-audit-outbox-finalization - Payment reconciliation audit/outbox/finalization assertions passed with explicit opt-in evidence, dry-run regression, negative cases, idempotent duplicate evidence, and no order handoff.
```

---

## 16. Birleşik Boundary Yasakları

10C10 hattı boyunca korunması gereken ve ilgili smoke/source-level kontrollerle doğrulanan yasaklar:

### 16.1 Live Request Yasakları

Aşağıdaki pattern’ler provider adapter ve reconciliation worker hattında kullanılmamalıdır:

- `fetch(`
- `axios`
- `request(`
- `node:http`
- `node:https`
- `require('http')`
- `require('https')`

### 16.2 Order Handoff Yasakları

10C10 kapsamında aşağıdakiler yasaktır:

- `services/order` import
- `@hx/order` import
- `createOrder(...)`
- `handoffToOrder(...)`
- `orderHandoff(...)`
- order command token
- `topic: 'order.`
- `topic: "order.`

### 16.3 Domain Mutation Yasakları

10C10 kapsamında payment dışında hiçbir owner truth mutate edilmez:

- order mutation yok
- finance mutation yok
- settlement mutation yok
- payout mutation yok
- risk mutation yok
- provider callback processing mutation yok
- BFF write route yok
- UI/panel direct write yok

### 16.4 Audit / Outbox Truth Sınırı

- Audit business truth değildir.
- Outbox business truth değildir.
- Event state mutation sebebi değildir.
- Event order handoff tetiklemez.
- `payment.reconciliation.completed` topic’i order command taşımaz.

---

## 17. 10C11 Öncesi Zorunlu Dikkat Noktaları

10C11’e doğrudan kodla başlanmamalıdır. İlk adım inventory/boundary review olmalıdır.

10C11’de cevaplanması gereken sorular:

1. Payment SUCCEEDED olduktan sonra order handoff nasıl başlar?
2. Order owner hangi command/event’i kabul eder?
3. Aynı payment için ikinci order nasıl engellenir?
4. Payment reconciliation event’i order handoff için yeterli mi, yoksa ayrı eligibility gerekir mi?
5. Order creation idempotency key nasıl üretilecek?
6. Payment failed / cancelled / unknown durumlarında order kesin nasıl engellenecek?
7. Audit/outbox hangi sınırda kullanılacak?
8. Order handoff event’i business truth mu, command mı, sadece trigger mı?
9. Reconciled payment ile ordinary callback success aynı order eligibility modelini mi kullanacak?
10. Duplicate success / alreadyApplied durumunda order handoff tekrar tetiklenecek mi?
11. Order owner payment attempt state’ini nasıl doğrulayacak?
12. Risk hold varsa order handoff duracak mı?
13. Finance/settlement order create sonrası mı, delivery sonrası mı tetiklenecek?
14. `payment.reconciliation.completed` event’i doğrudan order create tetiklememelidir; bu sınır nasıl korunacak?
15. Order create idempotency key `paymentAttemptId`, `checkoutId`, `paymentId` veya composite modelden hangisiyle üretilecek?

---

## 18. Sonraki Doğru Aşama

10C10 sonrasında doğru sıra:

1. HARDENING_PROGRESS_RECORD güncelleme metni hazırlanmalı.
2. HARDENING genel final durum özeti çıkarılmalı.
3. HARDENING-10C11 Boundary / Inventory hazırlanmalı.
4. 10C11 için order owner boundary, idempotency ve eligibility kararları netleşmeden implementasyon yapılmamalı.

Önerilen sonraki paket:

`HARDENING-10C11 — Payment Succeeded → Order Handoff Foundation`

Ancak bu paket, önce ayrı inventory/boundary review ile başlamalıdır.

---

## 19. Nihai Kısa Sonuç

HARDENING-10C10 hattı kapanmıştır.

Kapanış durumu:

`CLOSED WITH LIMITATIONS`

10C10 sonucunda güvenli biçimde elde edilenler:

- PayTR status inquiry mapping foundation
- Safe non-live adapter boundary
- Reconciliation decision model
- Reconciliation task repository foundation
- Dry-run worker
- Owner command eligibility guard
- Explicit opt-in controlled payment mutation
- E2E no order handoff validation
- Audit/outbox evidence
- Task finalization guard
- Payment succeeded ≠ order created sınırının korunması

10C10 sonucunda bilinçli olarak açılmayanlar:

- live PayTR integration
- production reconciliation scheduler/queue
- order handoff
- finance/settlement/payout mutation
- risk mutation
- BFF/operator panel runtime
- outbox delivery consumer

Bu doküman, 10C11’e geçmeden önce ana referans olarak kullanılmalıdır.
