# HARDENING-10C0 - Provider-Specific Callback Mapping Inventory / Payment First Candidate

## 1. Genel Durum

10B2 hattı ortak provider callback security boundary foundation'ını tamamladı: `POST /provider-callback/:providerDomain/:providerName` ingestion endpoint'i, raw payload persistence, signature guard foundation, replay/idempotency guard, timestamp freshness guard ve process-local rate/abuse guard mevcut. Boundary record'ları provider/business/owner/event/outbox truth mutation flag'lerini `false` üretir ve BFF handler domain owner command çağırmaz.

Payment callback processing hâlâ başlamadı. Ortak ingestion callback'i güvenli biçimde kaydeder, fakat provider event type mapping, gerçek provider canonicalization, secret/config modeli, payment owner handoff, worker/queue ve reconciliation runtime yoktur.

10C0, payment processing'e geçmeden önce ilk provider mapping adayını, normalized callback candidate modelini, idempotency kaynağını ve domain boundary kararlarını yazılı hale getirmek için hazırlanmıştır.

## 2. Mevcut Payment Repo Gerçekliği

- Payment initiate flow var. `apps/bff/src/server/payment.ts` checkout ownership guard sonrası `initiatePayment` çağırır; `services/payment/src/payment.ts` checkout'u okur, internal simulation adapter ile provider initiate yapar ve payment kaydını idempotent saklar.
- Payment callback processing yok. Provider callback handler sadece ingestion/persistence yapar; payment service içinde inbound callback consume eden gerçek owner transition hattı yoktur.
- Payment provider adapter outbound'dur. `services/payment/src/provider-adapter.ts` sadece `initiatePayment` operasyonunu standardize eder; callback parse/verify/map fonksiyonu yoktur.
- Payment repository `paymentId`, `paymentAttemptId` ve `idempotencyKey` okuma sağlar. Interface ve Postgres/In-memory implementasyonlarında `getById`, `getByPaymentAttemptId`, `getByIdempotencyKey` bulunur.
- Payment state modeli `CREATED`, `INITIATED`, `FAILED`, `CANCELLED`, `SUCCEEDED` destekler. Attempt state modeli `CREATED`, `PROVIDER_REDIRECT_READY`, `INITIATION_FAILED`, `SUCCEEDED` destekler.
- Payment contract içinde explicit `PENDING`, `UNKNOWN_RESULT`, `EXPIRED` attempt state'i yoktur; payment state'te `CANCELLED` var ama attempt seviyesinde `CANCELLED` yoktur. Planlama dokümanı pending/timeout/expired ihtiyacını tanımlar, contract henüz tam karşılamaz.
- Order creation payment success dışında çalışmaz. `createOrderFromPayment`, payment bulunmazsa veya `payment.state !== 'SUCCEEDED'` ise order truth üretmez.

## 3. Provider Adayı Kararı

| Provider | İlk mapping inventory adayı olabilir mi? | Neden önce / neden sonra? | Faz 1 gerçek entegrasyon etkisi | Öncelik |
|---|---|---|---|---|
| PayTR | Evet | `THIRD_PARTY_PROVIDER_MATRIX` primary PSP olarak PayTR'yi Faz 1 gerçek entegrasyon seçer. Payment abstraction'ın ilk gerçek doğrulaması burada yapılmalıdır. | Gerçek tahsilat sonucunun payment owner transition adayına bağlanması için ana provider olur. | Birincil |
| iyzico | Evet, ama secondary-ready kapsamda | Matrix iyzico'yu Faz 1 aktif zorunlu akış değil, secondary-ready/sandbox başlangıç olarak konumlandırır. | Vendor switch/yedek provider mimarisini hazır tutar; ilk canlı akışın ana yolu değildir. | İkincil |

Net karar: İlk payment callback mapping adayı PayTR olmalıdır. iyzico şimdilik secondary-ready mapping olarak kalmalıdır.

## 4. Payment Callback Mapping İlkeleri

- Provider callback business truth değildir.
- Provider callback sadece payment owner transition adayıdır.
- Payment callback doğrudan order oluşturamaz.
- Payment callback doğrudan settlement/hakediş yaratamaz.
- Payment callback doğrudan finance correction oluşturamaz.
- Payment callback risk/fraud truth mutate etmez.
- BFF truth owner değildir.
- Mapping layer owner command üretmez; sadece normalized candidate üretir.
- Owner command yalnız payment owner/worker hattında değerlendirilmelidir.

## 5. Provider Event Type Mapping Matrix

Gerçek PayTR callback dokümantasyonu bu inventory kapsamında okunmadı; bu nedenle PayTR'ye özgü raw field/status varsayımı yapılmaz. Aşağıdaki tablo generic PSP status adaylarını sistem kararlarına göre normalize eder.

| Provider event type / raw status adayı | Normalized payment callback status | Payment owner command candidate | Order create hakkı doğurur mu? | Finance/settlement etkisi var mı? | Risk signal adayı mı? | Reconciliation gerekir mi? | Kabul / red / pending karar notu |
|---|---|---|---|---|---|---|---|
| succeeded / captured / paid | `succeeded` | `MarkPaymentSucceededCandidate` | Dolaylı olarak, sadece payment owner `SUCCEEDED` sonrası | Doğrudan yok; order sonrası finansal akış | Amount/currency/reference mismatch varsa evet | Hayır, identity ve amount/currency uyumluysa | Kabul adayı |
| failed | `failed` | `MarkPaymentFailedCandidate` | Hayır | Hayır | Tekrarlı failed pattern risk adayı | Genelde hayır | Kabul adayı |
| pending | `pending` | `MarkPaymentPendingCandidate` veya no-op | Hayır | Hayır | Uzun süre pending risk/ops adayı | Evet | Pending/reconciliation adayı |
| cancelled | `cancelled` | `MarkPaymentCancelledCandidate` | Hayır | Hayır | Bağlama göre düşük | Hayır | Kabul adayı, contract genişlemesi gerekir |
| expired / timeout | `expired` | `MarkPaymentExpiredCandidate` | Hayır | Hayır | Bağlama göre düşük | Gerekebilir | Pending/implementation öncesi state eklenmeli |
| unknown_result | `unknown_result` | Command yok | Hayır | Hayır | Evet | Evet | Reconciliation required |
| duplicate / replay | `duplicate` | Command yok | Hayır | Hayır | Duplicate anomaly adayı | Hayır | Red/no-op |
| signature_failed | `signature_failed` | Command yok | Hayır | Hayır | Evet | Hayır | Red |
| unsupported | `unsupported` | Command yok | Hayır | Hayır | Düşük/orta | Gerekebilir | Ignored/rejected |
| amount_mismatch | `rejected_amount_mismatch` | Command yok | Hayır | Hayır | Evet, HIGH/CRITICAL | Evet | Reject + review |
| currency_mismatch | `rejected_currency_mismatch` | Command yok | Hayır | Hayır | Evet, HIGH | Evet | Reject + review |
| provider_reference_missing | `rejected_reference_missing` | Command yok | Hayır | Hayır | Evet | Evet | Reject veya manual match |
| payment_attempt_not_found | `payment_attempt_not_found` | Command yok | Hayır | Hayır | Evet | Evet | Reject/manual reconciliation |

## 6. Normalized Payment Callback Candidate Modeli

Önerilen model:

| Alan | Anlam |
|---|---|
| `providerDomain` | `payment` olmalı |
| `providerName` | `paytr`, `iyzico` veya test provider |
| `providerMode` | `simulation`, `sandbox`, `production` vb. |
| `callbackRecordId` | persisted provider callback record id |
| `providerEventId` | provider event-level dedupe adayı |
| `providerReference` | PSP transaction/reference adayı |
| `idempotencyKey` | callback veya original payment intent bağlantısı |
| `callbackType` | provider event/callback type |
| `normalizedStatus` | `succeeded`, `failed`, `pending`, `cancelled`, `expired`, `unknown_result`, `rejected_*` |
| `paymentAttemptId candidate` | payload/reference üzerinden eşleşme adayı |
| `paymentId candidate` | repository lookup sonucu veya payload adayı |
| `checkoutId candidate` | payment/attempt lookup sonucu veya payload adayı |
| `amount candidate` | provider amount sinyali |
| `currency candidate` | provider currency sinyali |
| `occurredAt` | provider event time veya receivedAt fallback |
| `verificationStatus` | callback record verification status |
| `replayStatus` | callback record replay status |
| `freshness/replay decision summary` | timestamp, nonce, duplicate karar özeti |
| `riskFlags` | mismatch/anomaly adayları |
| `ownerCommandCandidate` | payment owner command aday tipi, command değildir |
| `shouldProcess` | owner worker değerlendirmesine alınabilir mi |
| `shouldReconcile` | provider/status reconciliation gerekir mi |
| `shouldReject` | owner mutation dışı bırakılmalı mı |
| `rejectionReason` | reject/no-op gerekçesi |

Bu model 10C0'da contract'a eklenmemelidir. 10C1'de mapping contract/helper implementation kapsamına alınmalıdır.

## 7. Canonicalization Strategy

10B2B'deki `JSON.stringify` + HMAC SHA-256 canonicalization production için yeterli değildir. Bu sadece `signature-test-provider` foundation davranışını kanıtlar.

PayTR için gerçek canonical payload bilinmeden implementation yapılmamalıdır. Provider-specific canonicalization, BFF handler içine gömülmemeli; provider mapping/signature module içinde, provider name + mode + algorithm + raw body/header bilgisiyle çalışmalıdır. BFF ingestion generic kalmalıdır.

Secret/env/config modeli bu inventory'de kodlanmamalıdır. Secret manager/env/config ayrımı sonraki implementation paketinde tasarlanmalıdır.

Net karar: Provider-specific canonicalization kodlaması 10C0'da yapılmayacak.

## 8. Identity / Idempotency Source Kararı

| Kaynak | Dedupe için kullanılabilir mi? | Owner command idempotency için kullanılabilir mi? | Risk | Karar |
|---|---|---|---|---|
| `providerEventId` | Evet, event-level dedupe için birincil | Tek başına hayır | Provider retry/event semantics bilinmezse aynı finansal sonucu farklı event id ile gönderebilir | Callback dedupe birincil |
| `providerReference` | Evet, transaction-level eşleşme için güçlü | Evet, paymentAttempt ile birleşirse | Eksik veya provider-specific olabilir | Owner idempotency ikincil/güçlü eşleşme |
| `paymentAttemptId` | Evet, internal truth eşleşmesi için güçlü | Evet | Payload'da gelmeyebilir; dış provider'a sızdırma modeli bilinmeli | Owner idempotency birincil internal anchor |
| `checkoutId + providerName` | Sınırlı | Hayır, aynı checkout retry/attempt üretebilir | Multiple attempts çakışır | Sadece fallback lookup |
| `idempotencyKey` | Evet, callback/request dedupe için | Evet, original initiate key ile doğrulanırsa | Provider retry key anlamı belirsiz olabilir | Yardımcı |
| `callbackRecordId` | Hayır, her ingest record'a özgü | Hayır | Finansal etkiyi değil ingestion kaydını temsil eder | Trace/correlation only |

Net karar: Payment owner command idempotency key `payment-callback:{providerName}:{paymentAttemptId}:{normalizedStatus}:{providerReference || providerEventId}` biçiminde türemelidir. `paymentAttemptId` bulunamıyorsa owner command üretilmemeli; reconciliation/manual match adayı yapılmalıdır.

## 9. Payment Owner Handoff Kararı

Mapping layer doğrudan payment state mutate etmez. Mapping layer payment service çağırmaz. BFF payment state mutate etmez. Worker/queue olmadan owner handoff yapılmamalıdır; public webhook request lifecycle içinde domain mutation üretmek timeout, retry ve duplicate riskini büyütür.

10C1 normalized mapping contract/helper olmalıdır. 10C2 PayTR-specific mapping smoke ile provider status/canonicalization kararını testlenebilir hale getirmelidir. 10C3 async worker/queue foundation kurmalıdır. Payment owner command processing bundan sonra gelmelidir.

Net öneri: Önce normalized mapping contract/helper, sonra async worker/owner command handoff.

## 10. Order Boundary

Captured callback doğrudan order oluşturamaz. Payment owner `SUCCEEDED` olmadan `createOrderFromPayment` başarılı order yaratmaz; servis `PAYMENT_NOT_SUCCEEDED` ile geri döner. Duplicate captured callback duplicate order üretmemelidir; callback dedupe, payment command idempotency ve order idempotency birlikte korunmalıdır.

Order create idempotency `order-${paymentAttemptId}` veya payment success event kaynaklı stable key'e bağlı kalmalıdır. Existing order service guard ödeme state'i ve `paymentAttemptId` için güçlüdür, fakat callback tarafında da duplicate owner command üretmeme guard'ı gerekir.

Net karar: Order creation 10C0 veya ilk mapping implementation scope'unda olmamalıdır.

## 11. Finance / Settlement Boundary

Payment callback settlement/hakediş yaratamaz. Payment success ile finansal hakediş kesinleşmesi aynı şey değildir; finansal mutabakat dokümanı tahsil edilen para ile hak edilmiş parayı ayırır. Hakediş, order ve sonraki teslimat/iade/risk zincirlerinden sonra finans owner alanında değerlendirilmelidir.

Finance correction, mismatch veya reconciliation problemi netleştiğinde advisory/review kaydı olarak devreye girebilir; mapping layer doğrudan finance correction yaratmamalıdır. Amount/currency mismatch durumunda önce payment owner processing reject/reconcile kararı üretmeli, risk candidate ve finance correction candidate sonraki paketlerde ele alınmalıdır.

Settlement trigger payment callback sonrası değil, payment owner truth + order created event zinciri sonrasında olmalıdır.

Net karar: Finance/settlement mutation mapping layer scope'u dışında kalmalı.

## 12. Risk / Fraud Boundary

| Durum | Risk signal adayı mı? | Risk truth mutate eder mi? | Payment truth mutate eder mi? | Hangi pakette ele alınmalı? |
|---|---|---|---|---|
| Amount mismatch | Evet | 10C0'da hayır | Hayır, reject/reconcile adayı | Risk candidate implementation sonrası |
| Currency mismatch | Evet | 10C0'da hayır | Hayır | Risk candidate implementation sonrası |
| Unknown provider reference | Evet | 10C0'da hayır | Hayır | Reconciliation/risk linkage |
| Payment attempt not found | Evet | 10C0'da hayır | Hayır | Reconciliation/risk linkage |
| Duplicate/replay anomaly | Evet | 10C0'da hayır | Hayır | Callback risk linkage |
| Signature failed | Evet | 10C0'da hayır | Hayır | Security/risk linkage |
| Stale/future timestamp | Evet | 10C0'da hayır | Hayır | Security/risk linkage |

Net karar: 10C0 risk event üretmeyecek; sadece risk candidate matrix çıkaracak.

## 13. Analytics Boundary

Payment callback analytics event olabilir; örneğin callback received, rejected, pending, succeeded candidate, failed candidate funnel sinyali olarak ölçülebilir. Analytics payment truth yerine geçemez ve owner decision üretmez.

Failed/pending/succeeded callback analytics funnel'a provider callback stage olarak girmelidir; payment truth event'i ise payment owner state mutation sonrası ayrı event olarak üretilmelidir. Analytics event önce üretilecekse yalnız ingestion/operational event olmalı, payment success truth olarak adlandırılmamalıdır.

Net karar: Analytics sinyal olabilir; payment truth değildir.

## 14. 10C Implementation Roadmap

| Paket | Amaç | Scope | Yasaklı alanlar | Kabul kanıtı | Neden bu sırada |
|---|---|---|---|---|---|
| 10C1 - Normalized Payment Callback Candidate Contract/Helper | Inventory modelini implementation contract/helper'a çevirmek | Generic candidate type, validation helper, mapping result shape | Provider-specific runtime, state mutation, worker | Unit/smoke ile status/reject/shouldProcess kararları | PayTR mapping için ortak model gerekir |
| 10C2 - PayTR Callback Mapping Foundation Smoke | PayTR-first generic PSP mapping'i gerçek dokümanla testlenebilir yapmak | PayTR field/status/canonicalization strategy, sandbox fixture | Payment mutation, order, finance, risk mutation | PayTR fixture -> normalized candidate smoke | Primary provider önce doğrulanmalı |
| 10C3 - Async Callback Processing Worker Foundation | BFF ingestion-only kalırken processing'i async hatta almak | Callback record polling/queue boundary, idempotent lock/claim | Domain command execution | Record accepted/claimed/processed no-op smoke | Owner handoff için güvenli runtime gerekir |
| 10C4 - Payment Owner Command Candidate Processing | Verified normalized candidate'ı payment owner transition guard'a sokmak | `succeeded`/`failed` minimum state transition, command idempotency | Order create, settlement, risk mutation | Callback candidate -> payment state transition + duplicate no-op | İlk gerçek domain effect yalnız payment owner'da olmalı |
| 10C5 - Payment Captured to Order Handoff Boundary | Payment success sonrası order handoff sınırını kurmak | Payment succeeded event/consumer veya explicit order command handoff | Callback worker'dan direct order create | Duplicate payment success -> tek order | Captured != order created ayrımı korunur |
| 10C6 - Reconciliation and Anomaly Linkage | Pending/unknown/mismatch durumlarını kapatmak | Provider status query, risk/finance candidate linkage | Direct finance settlement mutation | unknown_result ve mismatch reconciliation smoke | Edge case ve production olgunluğu için gerekli |

## 15. Domain Processing Readiness Kararı

Payment domain processing'e hemen geçilemez. Önce mapping contract/helper gerekir. Real provider secret/config gerekir, ancak mapping helper ile paralel tasarlanıp ayrı implementation paketinde kodlanmalıdır. Worker/queue gerekir; BFF request içinde owner mutation yapılmamalıdır.

İlk implementation package: **HARDENING-10C1 - Normalized Payment Callback Candidate Contract/Helper**.

## 16. Açık Riskler

- PayTR gerçek callback dokümanı eksikse mapping varsayım riski vardır.
- Payment state modelinde `pending`, `unknown_result`, `expired` ve attempt-level `cancelled/failed/pending` eksikleri vardır.
- Real provider signature canonicalization eksiktir.
- Provider secret/env/config modeli eksiktir.
- Worker/queue eksiktir.
- Reconciliation eksiktir.
- Duplicate captured callback duplicate order riski, callback -> payment -> order zincirinde uçtan uca test edilmeden kalır.
- Amount/currency mismatch payment/risk/finance boundary riskleri taşır.
- Risk/finance boundary yanlış kurulursa advisory sinyali truth mutation gibi davranabilir.

## 17. Nihai Karar

**PAYMENT PROVIDER MAPPING INVENTORY COMPLETE / IMPLEMENTATION REQUIRED**

- Domain processing hâlâ başlamamıştır.
- Payment callback doğrudan order/finance/risk truth mutate etmemelidir.
- İlk payment callback mapping adayı PayTR olmalıdır.
- iyzico secondary-ready mapping olarak kalmalıdır.
- Sıradaki önerilen paket: **HARDENING-10C1 - Normalized Payment Callback Candidate Contract/Helper**.

Bu inventory paketinde build/typecheck/smoke çalıştırılmadı; bu rapor kodlama veya verification paketi değildir.
