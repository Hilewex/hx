# HARDENING-10 Callback Decision Index

## Belge Amacı

Bu dosya, `HARDENING-10-CALLBACK-MASTER-REFERENCE.md` dosyasının karar, risk, yol haritası ve durum indeksidir.

Master referans dosyası eksiksiz kayıt ve kanıt arşividir. Bu dosya ise hızlı karar dosyasıdır.

Kullanım amacı:

- Hangi paket tamamlandı?
- Hangi karar alındı?
- Hangi limit hâlâ açık?
- Domain processing nerede başladı?
- Order/finance/risk/reconciliation neden hâlâ açık?
- Sıradaki paket ne olmalı?
- Yayına hazırlık için hangi bloklar kapanmalı?

---

# 1. En Üst Karar

## Güncel Faz

**HARDENING-10C9-02 sonrası durum**

Payment provider callback hattında ilk kontrollü owner mutation başlamıştır.

Ancak bu mutation yalnızca:

- opt-in worker mode,
- `succeeded` callback,
- `failed` callback,
- payment owner state transition

ile sınırlıdır.

## Ana Karar

**HARDENING-10 callback hattı production-ready değildir.**

Neden:

- PayTR live initiate yok.
- PayTR gerçek merchant_oid stratejisi live akışta doğrulanmadı.
- Reconciliation runtime yok.
- Order handoff yok.
- Finance/risk linkage yok.
- Real PayTR sandbox E2E yok.
- Worker runtime / claim / retry / concurrency foundation yok.
- Distributed rate limit / WAF yok.

## Mevcut En İleri Nokta

- Common callback ingestion security boundary kuruldu.
- PayTR callback mapping BFF path’e bağlandı.
- Payment callback owner command contract kuruldu.
- Dry-run worker foundation kuruldu.
- providerReference lookup kuruldu.
- Payment initiation provider reference persistence kuruldu.
- Opt-in worker mode ile succeeded/failed callback payment state transition yapabiliyor.

## Net Durum

**PASS WITH LIMITATION hattı devam ediyor.**

---

# 2. Paket Zaman Çizelgesi

| Paket | Kısa Ad | Ana Amaç | Karar |
|---|---|---|---|
| 10-00 | Provider Callback Inventory | Callback/webhook/reconciliation eksiklerini tespit etmek | COMPLETE / IMPLEMENTATION REQUIRED |
| 10A3 | Persistence / Migration | `provider_callback_events` tablo ve repository foundation | PASS WITH LIMITATION |
| 10A4 | In-Memory Smoke | Callback repository in-memory smoke | PASS WITH LIMITATION |
| 10A5 | Final Regression | 10A final regression | FAIL |
| 10A5-R | Runtime Remediation | BFF runtime ile failed smoke’ları yeniden doğrulama | PASS WITH LIMITATION |
| 10B-00A | Source Reality Inventory | Repo gerçekliğini çıkarmak | SOURCE INVENTORY COMPLETE |
| 10B-00B | Payment Callback Inventory | Payment callback domain sınırları | PAYMENT INVENTORY COMPLETE |
| 10B-00C | Shipment Callback Inventory | Shipment/delivered/eligibility sınırları | SHIPMENT INVENTORY COMPLETE |
| 10B-00D | Notification Callback Inventory | Notification delivery/analytics sınırları | NOTIFICATION INVENTORY COMPLETE |
| 10B-00E | Payout Callback Inventory | Payout/finance/risk sınırları | PAYOUT INVENTORY COMPLETE |
| 10B-00F | Cross-Domain Final Inventory | Risk ve implementation order | ROADMAP REQUIRED |
| 10B1 | Postgres Idempotency Remediation | `idempotency_key` conflict riskini kapatmak | PASS |
| 10B2A | Common BFF Ingestion | Ortak BFF endpoint ve persistence | PASS WITH LIMITATION |
| 10B2B | Signature Guard | Signature guard foundation | PASS WITH LIMITATION |
| 10B2C | Replay / Idempotency Guard | Duplicate/replay guard | PASS WITH LIMITATION |
| 10B2D | Freshness Guard | Timestamp freshness foundation | PASS WITH LIMITATION |
| 10B2E | Rate Limit Guard | Process-local public webhook abuse guard | PASS WITH LIMITATION |
| 10B2F | Security Boundary Final | 10B2 ortak security boundary kapanışı | BOUNDARY CLOSED / MAPPING REQUIRED |
| 10C0 | Payment Mapping Inventory | PayTR-first mapping inventory | INVENTORY COMPLETE |
| 10C1 | Normalized Candidate Contract | Generic payment callback candidate contract/helper | PASS |
| 10C1-R | Verification Completion | Full verification closure | PASS |
| 10C2 | PayTR Mapping Smoke | PayTR callback mapping helper | PASS WITH LIMITATION |
| 10C3 | PayTR ACK Policy | PayTR için plain text `OK` response | PASS WITH LIMITATION |
| 10C4 | Provider Config / Secret Foundation | PayTR/iyzico config resolver | PASS WITH LIMITATION |
| 10C5 | PayTR Live BFF Mapping | PayTR normalizedPayload BFF path | PASS WITH LIMITATION |
| 10C6 | Worker / Owner Handoff Inventory | Worker ve owner command kararları | INVENTORY COMPLETE |
| 10C7 | State Model / Owner Command Contract | Payment callback command/state contract | PASS WITH LIMITATION |
| 10C8 | Dry-Run Worker Foundation | Callback worker lifecycle marker | PASS WITH LIMITATION |
| 10C9-00 | Provider Reference Lookup | `getByProviderReference` foundation | PASS WITH LIMITATION |
| 10C9-01 | Initiation Provider Reference Persistence | provider metadata attempt içine yazıldı | PASS WITH LIMITATION |
| 10C9-02 | Owner Transition Succeeded/Failed | Opt-in worker ile payment owner mutation | PASS WITH LIMITATION |

---

# 3. Capability Durum Tablosu

| Capability | Durum | Kanıt Paketi | Not |
|---|---|---|---|
| Provider callback contract | DONE | 10A | Generic contract mevcut |
| Callback persistence table | DONE | 10A3 | `provider_callback_events` |
| In-memory callback repository | DONE | 10A3/10A4 | Smoke var |
| Postgres callback repository | DONE | 10A3 | Idempotency fix 10B1 |
| Postgres idempotency_key conflict fix | DONE | 10B1 | PASS |
| Common BFF ingestion endpoint | DONE | 10B2A | `/provider-callback/:providerDomain/:providerName` |
| rawPayload persistence | DONE | 10B2A | Response’da sızmıyor |
| Signature guard foundation | DONE | 10B2B | Test HMAC foundation |
| Replay/idempotency guard | DONE | 10B2C | duplicate response / identity conflict |
| Timestamp freshness guard | DONE | 10B2D | old/future/invalid timestamp rejected |
| Process-local rate limit | DONE | 10B2E | 60 sn / 20 istek |
| PayTR mapping helper | DONE | 10C2 | Hash + status mapping |
| PayTR ACK `OK` response | DONE | 10C3 | text/plain OK |
| Payment provider config resolver | DONE | 10C4 | PayTR primary / iyzico secondary-ready |
| PayTR BFF normalizedPayload | DONE | 10C5 | `normalizedPayload` yazılıyor |
| Payment callback candidate contract | DONE | 10C1 | Generic candidate model |
| Payment owner command contract | DONE | 10C7 | command decision helper |
| Payment dry-run callback worker | DONE | 10C8 | processingStatus lifecycle |
| providerReference lookup | DONE | 10C9-00 | repository lookup |
| Payment initiation provider metadata persistence | DONE | 10C9-01 | attempt providerReference |
| Succeeded/failed owner transition | LIMITED DONE | 10C9-02 | opt-in worker mode only |
| Worker runtime daemon | NOT DONE | - | Fonksiyon var, runtime yok |
| Atomic claim/lock | NOT DONE | - | Multi-worker güvenliği yok |
| Reconciliation runtime | NOT DONE | - | pending/unknown açık |
| Payment success event/outbox | NOT DONE | - | order handoff için gerekli |
| Order handoff | NOT DONE | - | callback worker direct order yapamaz |
| Finance/risk linkage | NOT DONE | - | advisory/risk sinyali yok |
| PayTR live initiate | NOT DONE | - | gerçek merchant_oid yok |
| Real PayTR sandbox E2E | NOT DONE | - | uçtan uca denenmedi |
| iyzico mapping | NOT DONE | - | secondary-ready config only |
| Distributed rate limit / WAF | NOT DONE | - | process-local guard var |

---

# 4. Domain Bazlı Durum

## 4.1 Payment

### Mevcut Durum

Payment callback hattı en ileri seviyeye taşınmış domain’dir.

Tamamlananlar:

- Payment callback domain inventory.
- PayTR-first mapping kararı.
- Normalized callback candidate contract.
- PayTR mapping helper.
- PayTR ACK policy.
- Provider config/secret resolver.
- PayTR BFF normalizedPayload write.
- Payment callback owner command contract.
- Dry-run worker foundation.
- providerReference lookup.
- Initiation provider metadata persistence.
- Opt-in succeeded/failed owner transition.

### Başlayan Domain Processing

Payment domain processing sınırlı olarak başladı.

Kapsam:

- `MARK_PAYMENT_SUCCEEDED`
- `MARK_PAYMENT_FAILED`
- opt-in worker mode
- payment owner state transition
- order handoff yok

### Açık Limitler

- PayTR live initiate yok.
- PayTR merchant_oid gerçek üretimi yok.
- pending/unknown/cancelled/expired mutation yok.
- reconciliation runtime yok.
- order handoff yok.
- finance/risk mutation yok.
- real PayTR E2E yok.
- worker runtime/claim/retry yok.

### Karar

Payment owner mutation’a kontrollü olarak başlanmıştır; fakat production payment callback lifecycle tamamlanmamıştır.

---

## 4.2 Shipment

### Mevcut Durum

Shipment callback için yalnız inventory yapılmıştır. Gerçek shipment callback processing yoktur.

### Tamamlananlar

- Shipment callback / eligibility inventory.
- Delivered boundary kararı.
- Review/story eligibility boundary kararı.
- Tracking projection boundary kararı.
- Order/operation boundary kararı.

### Açık Limitler

- Carrier callback endpoint domain-specific mapping yok.
- Shipment provider-specific mapping yok.
- Shipment owner command handoff yok.
- Delivered transition yok.
- `shipment.delivered` outbox yok.
- Review/story eligibility consumer yok.
- Carrier polling/reconciliation yok.
- Multi-package / line-level delivered handling yok.

### Karar

Shipment callback processing’e geçilmemiştir. Payment hattı stabilize edilmeden shipment delivered/eligibility açılmamalıdır.

---

## 4.3 Notification

### Mevcut Durum

Notification callback için yalnız inventory yapılmıştır. Gerçek notification delivery callback processing yoktur.

### Tamamlananlar

- Notification delivery callback inventory.
- Delivery attempt vs notification READ boundary.
- Open/click analytics boundary.
- Cross-domain mutation yasağı.
- Notification callback status model.

### Açık Limitler

- Provider-specific notification mapping yok.
- Delivery attempt owner update yok.
- Open/click analytics ingestion yok.
- Notification delivery failed outbox yok.
- Reconciliation/polling yok.
- Analytics pollution guard yok.
- Provider-specific SendGrid/Twilio/FCM mapping yok.

### Karar

Notification callback processing başlamamıştır. Notification READ state provider callback ile değişmemelidir.

---

## 4.4 Payout

### Mevcut Durum

Payout callback için yalnız inventory yapılmıştır. Gerçek payout provider result processing yoktur.

### Tamamlananlar

- Payout callback / finance-risk inventory.
- Paid boundary.
- Failed/returned finance correction boundary.
- Settlement/payable/paid ayrımı.
- Risk/fraud hold bypass yasağı.

### Açık Limitler

- Payout provider-specific mapping yok.
- Payout owner paid/failed/returned transition yok.
- Finance correction handoff yok.
- Risk signal handoff yok.
- Reconciliation/polling yok.
- Batch-level / item-level processing yok.
- ON_HOLD guard callback path’te test edilmedi.

### Karar

Payout callback processing en yüksek finansal risk alanlarından biridir. Payment callback hattı tamamlanmadan payout paid/returned callback açılmamalıdır.

---

# 5. Boundary Karar İndeksi

## 5.1 BFF Boundary

| Soru | Karar |
|---|---|
| BFF truth owner olabilir mi? | Hayır |
| BFF payment state mutate edebilir mi? | Hayır |
| BFF order create çağırabilir mi? | Hayır |
| BFF callback rawPayload dönebilir mi? | Hayır |
| BFF provider callback alabilir mi? | Evet, ingestion-only |
| BFF PayTR için OK dönebilir mi? | Evet, ACK policy olarak |
| BFF domain command üretebilir mi? | Hayır |
| BFF rate limit uygulayabilir mi? | Evet, process-local foundation olarak |

## 5.2 Provider Callback Boundary

| Soru | Karar |
|---|---|
| Callback business truth mu? | Hayır |
| Callback owner state mutation mu? | Hayır |
| Callback audit yerine geçer mi? | Hayır |
| Callback outbox yerine geçer mi? | Hayır |
| Callback domain event yerine geçer mi? | Hayır |
| Callback owner command adayı olabilir mi? | Evet |
| Callback duplicate ise command üretir mi? | Hayır |
| Callback signature failed ise command üretir mi? | Hayır |
| Callback stale/future ise command üretir mi? | Hayır |
| Callback amount/currency mismatch ise command üretir mi? | Hayır, reconcile/risk candidate |

## 5.3 Payment Boundary

| Soru | Karar |
|---|---|
| Payment callback doğrudan order oluşturabilir mi? | Hayır |
| Payment callback settlement yaratabilir mi? | Hayır |
| Payment success hakediş kesinleşmesi midir? | Hayır |
| Payment callback risk truth mutate eder mi? | Hayır |
| Payment callback owner transition adayı olabilir mi? | Evet |
| Succeeded/failed callback owner transition başladı mı? | Evet, opt-in worker modunda |
| Pending/unknown callback owner transition yapar mı? | Hayır |
| Duplicate succeeded duplicate order yaratabilir mi? | Yaratmamalı; order handoff henüz yok |

## 5.4 Order Boundary

| Soru | Karar |
|---|---|
| Callback worker doğrudan order create çağırabilir mi? | Hayır |
| Order yalnız payment owner SUCCEEDED sonrası mı başlamalı? | Evet |
| Order idempotency providerEventId’ye mi bağlı olmalı? | Hayır |
| Önerilen order idempotency key | `order-from-payment:{paymentId}:{paymentAttemptId}` |
| Order handoff hazır mı? | Hayır |

## 5.5 Finance / Risk Boundary

| Soru | Karar |
|---|---|
| Payment callback finance correction yaratabilir mi? | Hayır |
| Amount mismatch finance truth mutate eder mi? | Hayır |
| Risk signal üretimi başladı mı? | Hayır |
| Risk candidate matrix var mı? | Evet |
| Payout callback risk hold bypass edebilir mi? | Hayır |
| Finance/risk linkage hazır mı? | Hayır |

---

# 6. Açık Riskler İndeksi

## 6.1 P0 / Kritik Riskler

| Risk | Durum | Açıklama | Gerekli Paket |
|---|---|---|---|
| Sahte provider callback | Kısmen mitigated | Signature foundation var ama real provider secret/canonicalization tam değil | Provider-specific signature integration |
| Payout fake paid callback | Açık ama aktif değil | Payout callback processing yok | Payout processing öncesi guard |
| Risk/fraud hold bypass | Açık ama aktif değil | Payout callback processing yok | Payout state guard |
| Payment callback ile doğrudan order | Engellendi | Mevcut tasarımda direct order yok | Order handoff paketinde tekrar guard |
| Production webhook abuse | Kısmen mitigated | Process-local limiter var; WAF/distributed yok | Infra/API gateway |

## 6.2 P1 / Yüksek Riskler

| Risk | Durum | Açıklama | Gerekli Paket |
|---|---|---|---|
| Duplicate callback duplicate domain effect | Kısmen mitigated | Callback dedupe + owner idempotency başladı | Owner transition regression |
| Unknown_result takılması | Açık | Reconciliation runtime yok | 10C10 |
| Pending payment stuck state | Açık | Pending state contract var, runtime yok | 10C10 |
| Payment success event yokluğu | Açık | Order handoff yok | 10C11 |
| Worker concurrency race | Açık | Atomic claim yok | Worker runtime claim |
| merchant_oid belirsizliği | Kısmen kapandı | providerReference persistence var; live PayTR initiate yok | PayTR live initiate |

## 6.3 P2 / Orta Riskler

| Risk | Durum | Açıklama | Gerekli Paket |
|---|---|---|---|
| Postgres idempotency_key conflict | Kapandı | 10B1 PASS | İzleme |
| Process-local limiter test pollution | Bilinen limit | BFF restart gerekebiliyor | Distributed limiter |
| callbackRecordId `pending_insert` | Açık | 10C5 limitation | normalizedPayload update |
| providerReference unique constraint yok | Açık | LIMIT 1 kullanımı var | Schema/index hardening |
| Analytics pollution | Açık | Notification processing yok | Notification package |
| Nonce reuse cache yok | Açık | Timestamp var, nonce store yok | Security hardening |

---

# 7. Kalan Limitler Ana Listesi

## Ortak Callback Limitleri

- Real provider secret/env management yok.
- Provider-specific canonicalization generic guard ile tam birleşmedi.
- Nonce reuse cache yok.
- Distributed rate limiting yok.
- API gateway/WAF yok.
- Audit/risk anomaly linkage yok.
- Worker runtime/daemon yok.
- Atomic claim/lock yok.
- Multi-worker concurrency yok.
- Reconciliation runtime yok.

## Payment Limitleri

- PayTR live initiate yok.
- Real merchant_oid üretimi yok.
- Real PayTR callback E2E yok.
- Generic signature guard ile PayTR hash verification ayrımı devam ediyor.
- Pending/unknown/cancelled/expired owner mutation yok.
- Payment success event/outbox yok.
- Order handoff yok.
- Finance/risk linkage yok.
- providerReference unique guarantee yok.
- callbackRecordId placeholder limitation devam ediyor.

## Shipment Limitleri

- Carrier mapping yok.
- Shipment callback worker yok.
- Delivered owner transition yok.
- Shipment delivered outbox yok.
- Review/story eligibility consumer yok.
- Carrier reconciliation yok.

## Notification Limitleri

- Delivery attempt callback processing yok.
- Open/click analytics signal yok.
- Notification delivery failed outbox yok.
- Provider-specific mapping yok.
- Analytics pollution guard yok.

## Payout Limitleri

- Payout provider callback processing yok.
- Paid/failed/returned owner transition yok.
- Finance correction linkage yok.
- Risk signal linkage yok.
- Reconciliation yok.
- ON_HOLD callback guard test edilmedi.

---

# 8. Test / Smoke İndeksi

## Ortak Callback Smoke’ları

| Smoke Script | Amaç | Durum |
|---|---|---|
| `smoke:provider-boundary` | Provider boundary false invariant | PASS |
| `smoke:provider-callback-foundation` | In-memory callback repository foundation | PASS |
| `smoke:provider-callback-postgres` | Postgres duplicate/idempotency behavior | PASS |
| `smoke:provider-callback-ingestion` | BFF ingestion + persistence | PASS |
| `smoke:provider-callback-signature-guard` | Signature guard foundation | PASS |
| `smoke:provider-callback-replay-guard` | Replay/idempotency guard | PASS |
| `smoke:provider-callback-freshness-guard` | Timestamp freshness guard | PASS |
| `smoke:provider-callback-rate-limit-guard` | Rate limit foundation | PASS |

## Payment Callback Smoke’ları

| Smoke Script | Amaç | Durum |
|---|---|---|
| `smoke:payment-callback-candidate` | Generic candidate decision helper | PASS |
| `smoke:paytr-callback-mapping` | PayTR mapping helper | PASS |
| `smoke:paytr-callback-bff-policy` | PayTR OK response policy | PASS |
| `smoke:payment-provider-config` | Provider config resolver | PASS |
| `smoke:paytr-callback-live-bff-mapping` | PayTR BFF normalizedPayload mapping | PASS |
| `smoke:payment-callback-owner-command` | Owner command contract/helper | PASS |
| `smoke:payment-callback-worker-foundation` | Dry-run worker foundation | PASS |
| `smoke:payment-provider-reference-lookup` | providerReference lookup | PASS |
| `smoke:payment-initiation-provider-reference` | initiation provider metadata persistence | PASS |
| `smoke:payment-callback-owner-transition` | succeeded/failed owner transition | PASS |
| `smoke:payment-provider-boundary` | Payment provider boundary regression | PASS |

## Önemli Test Notları

- 10A5 ilk regression BFF runtime yokluğu nedeniyle FAIL oldu.
- 10A5-R runtime remediation sonrası smoke:all PASS oldu.
- Rate-limit guard process-local olduğu için bazı smoke’larda temiz BFF restart gerekebildi.
- Postgres çalışmadığında bazı smoke’lar önce FAIL verdi; Postgres ayağa kalkınca PASS oldu.
- Bu notlar test başarısızlığı değil, runtime prerequisite yönetimi olarak ele alınmalıdır.

---

# 9. Dosya Değişiklik İndeksi

## En Çok Değişen / Kritik Dosyalar

| Dosya | Rol |
|---|---|
| `packages/contracts/src/provider.ts` | Provider callback/result contract foundation |
| `packages/contracts/src/payment.ts` | Payment callback candidate, PayTR mapping, owner command contract |
| `packages/persistence/src/provider-callback.ts` | Provider callback repository |
| `infra/migrations/20260504_001_provider_callback_persistence.sql` | Callback events table |
| `apps/bff/src/server/provider-callback.ts` | Common ingestion, signature, replay, freshness, rate limit, PayTR mapping path |
| `apps/bff/src/server/index.ts` | Provider callback route registration / response sender bridge |
| `services/payment/src/provider-config.ts` | Payment provider config resolver |
| `services/payment/src/provider-adapter.ts` | Payment provider adapter config integration |
| `services/payment/src/payment.ts` | Initiation provider metadata persistence, owner transition helper |
| `services/payment/src/callback-worker.ts` | Dry-run worker and opt-in owner transition worker mode |
| `services/payment/src/repository/interface.ts` | providerReference lookup contract |
| `services/payment/src/repository/in-memory.ts` | providerReference lookup in-memory |
| `services/payment/src/repository/postgres.ts` | providerReference lookup Postgres |

## Progress Record Durumu

Birçok closure raporunda açıkça belirtildiği üzere:

- `HARDENING_PROGRESS_RECORD` dosyasına dokunulmadı.

Bu nedenle progress record güncellenecekse ayrı kayıt metni çıkarılmalıdır.

---

# 10. Production Readiness Gate

## 10.1 Callback Security Gate

| Gate | Durum |
|---|---|
| Common endpoint | DONE |
| rawPayload persistence | DONE |
| response rawPayload leak yok | DONE |
| signature guard foundation | DONE |
| provider-specific PayTR hash mapping | DONE |
| replay/idempotency guard | DONE |
| freshness guard | DONE |
| process-local rate limit | DONE |
| real provider secret management | PARTIAL |
| distributed rate limit / WAF | NOT DONE |
| nonce reuse guard | NOT DONE |
| audit/risk anomaly linkage | NOT DONE |

Karar:

**Security foundation var; production-grade security tamam değil.**

## 10.2 Payment Processing Gate

| Gate | Durum |
|---|---|
| PayTR mapping helper | DONE |
| PayTR BFF normalizedPayload | DONE |
| Payment candidate contract | DONE |
| Payment owner command contract | DONE |
| Dry-run worker | DONE |
| providerReference lookup | DONE |
| initiation provider metadata persistence | DONE |
| succeeded/failed owner transition | LIMITED DONE |
| pending/unknown runtime | NOT DONE |
| reconciliation | NOT DONE |
| worker claim/retry | NOT DONE |
| payment success outbox | NOT DONE |
| order handoff | NOT DONE |
| real PayTR E2E | NOT DONE |

Karar:

**Payment callback processing sınırlı başladı; full lifecycle hazır değil.**

## 10.3 Order Handoff Gate

| Gate | Durum |
|---|---|
| Payment owner SUCCEEDED transition | LIMITED DONE |
| Payment succeeded event/outbox | NOT DONE |
| Order command consumer | NOT DONE |
| Order idempotency from payment | Existing guard var, callback path test yok |
| Duplicate callback -> single order test | NOT DONE |
| Direct callback-to-order path yok | DONE |

Karar:

**Order handoff’a geçmeden önce payment success event/outbox tasarlanmalıdır.**

## 10.4 Reconciliation Gate

| Gate | Durum |
|---|---|
| unknown_result contract awareness | PARTIAL |
| pending state model | PARTIAL |
| PayTR status inquiry inventory | NOT DONE |
| reconciliation candidate queue/status | NOT DONE |
| retry/backoff | NOT DONE |
| operator visibility | NOT DONE |

Karar:

**Reconciliation tamamen açık.**

---

# 11. Sonraki Paket Kararı

## Ana Soru

10C9-02 sonrası doğrudan order handoff’a geçilebilir mi?

## Cevap

**Hayır, doğrudan geçilmemelidir.**

Gerekçe:

- Payment owner succeeded/failed transition yeni başladı.
- Worker runtime/claim/retry yok.
- Reconciliation yok.
- PayTR live initiate yok.
- merchant_oid gerçek akışta doğrulanmadı.
- Payment success event/outbox yok.
- Duplicate callback -> duplicate order regresyonu henüz test edilmedi.

## Profesyonel Önerilen Sıra

### 1. HARDENING-10C10 — Payment Callback Reconciliation / Status Inquiry Inventory

Amaç:

- PayTR status inquiry ihtiyaçlarını netleştirmek.
- pending/unknown/mismatch/not-found durumlarının karar ağacını çıkarmak.
- Reconciliation runtime’a geçmeden önce domain ve provider sınırlarını belirlemek.

Neden ilk:

- Succeeded/failed happy path başladı.
- Belirsiz durumlar production’da en kritik açık risklerden biri.
- Order handoff öncesi payment state doğruluğu güçlendirilmeli.

### 2. HARDENING-10C11 — Payment Success Event / Order Handoff Boundary

Amaç:

- Payment owner `SUCCEEDED` sonrası order create handoff’u kurmak.
- Callback worker’ın doğrudan order create çağırmasını engellemek.
- Duplicate payment success -> single order garantisini test etmek.

### 3. HARDENING-10C12 — PayTR Live Initiate merchant_oid Contract

Amaç:

- PayTR initiate sırasında merchant_oid üretimini netleştirmek.
- merchant_oid -> providerReference -> paymentAttempt lookup zincirini gerçek akışta sabitlemek.

### 4. HARDENING-10C13 — Worker Runtime Claim / Retry Foundation

Amaç:

- Worker fonksiyonunu gerçek runtime’a taşımak.
- Atomic claim, retry, backoff, concurrency guard kurmak.

### 5. HARDENING-10C14 — PayTR Sandbox E2E Validation

Amaç:

- Sandbox initiate + callback + mapping + worker + payment transition + order handoff zincirini doğrulamak.

### 6. HARDENING-10C15 — Risk / Finance Advisory Linkage

Amaç:

- bad hash, amount/currency mismatch, not-found, replay storm gibi olayları advisory risk/finance sinyali olarak bağlamak.

---

# 12. Alternatif Paket Seçenekleri ve Karar

## Seçenek A — Hemen Order Handoff

Karar: **Şimdi değil.**

Risk:

- Payment lifecycle belirsiz durumları açık.
- Reconciliation yok.
- Worker runtime yok.
- Duplicate order edge case’leri tam test edilmedi.

## Seçenek B — Reconciliation Inventory

Karar: **Önerilen ilk adım.**

Neden:

- Payment succeeded/failed mutasyonu başladı.
- Pending/unknown/mismatch durumlarının resmi karar ağacı yok.
- Production güvenilirliği için gerekli.

## Seçenek C — PayTR Live Initiate

Karar: **Yakında gerekli, ama reconciliation inventory’den sonra daha sağlam.**

Neden:

- merchant_oid strategy gerçek akışta sabitlenmeli.
- Ancak live initiate, reconciliation ve owner transition kararları oturmadan eksik kalır.

## Seçenek D — Worker Runtime Claim / Retry

Karar: **Gerekli, fakat order handoff ve E2E öncesi ayrı paket olmalı.**

Neden:

- Dry-run/apply function var; production worker lifecycle yok.

## Seçenek E — Finance/Risk Linkage

Karar: **Şimdi erken.**

Neden:

- Payment callback lifecycle stabilize edilmeden advisory sinyaller truth mutation gibi yanlış konumlanabilir.

---

# 13. Açık Karar Bekleyen Konular

## Provider / Payment

- PayTR `merchant_oid` kesin olarak paymentAttemptId mi olacak, yoksa providerReference olarak mı kalacak?
- PayTR initiate live payload hangi payment attempt alanlarını saklayacak?
- PayTR status inquiry hangi durumlarda çağrılacak?
- `total_amount` / `payment_amount` mismatch kararları live lookup ile nasıl doğrulanacak?
- Generic signature guard ile PayTR hash verification birleşecek mi?

## Worker / Processing

- Worker DB polling mi kalacak, yoksa outbox/queue modeline geçilecek mi?
- Atomic claim hangi repository/metot ile yapılacak?
- Retry/backoff nerede saklanacak?
- `reconciliation_required` processingStatus enum’a eklenecek mi?
- callbackRecordId `pending_insert` limitation nasıl çözülecek?

## Order

- Payment success event adı ne olacak?
- Order command consumer hangi idempotency key’i kullanacak?
- Duplicate callback sonrası duplicate payment success event engeli nerede olacak?
- Order create failure olursa payment success nasıl izlenecek?

## Risk / Finance

- Amount mismatch risk signal ne zaman üretilecek?
- Currency mismatch finance correction’a ne zaman dönecek?
- Bad hash security audit mi, risk signal mı?
- Not-found paymentAttempt manuel reconciliation mı, risk anomaly mi?

---

# 14. Kırmızı Çizgiler

Aşağıdaki davranışlar kesinlikle yapılmamalıdır:

1. BFF içinde payment state mutation.
2. Callback worker’dan doğrudan order create.
3. Payment callback’ten doğrudan settlement/hakediş oluşturma.
4. Provider payload’dan kupon/sponsor/commission hesaplama.
5. Signature failed callback’i process etmek.
6. Duplicate callback’i yeni domain effect’e çevirmek.
7. Rate limited callback’i persist etmek.
8. Notification open/click’i READ state yapmak.
9. Shipment delivered callback’i doğrudan review/story eligibility açmak.
10. Payout paid callback’i risk hold’u bypass ederek PAID yapmak.
11. Finance/risk advisory sinyalini truth mutation gibi kullanmak.
12. Provider secret değerlerini repo/config dosyalarına düz metin yazmak.

---

# 15. Hızlı Cevap Kartları

## Şu an payment callback var mı?

Evet, sınırlı olarak var.

- BFF PayTR callback alabiliyor.
- rawPayload + normalizedPayload persist ediliyor.
- Worker dry-run/apply mode var.
- succeeded/failed opt-in worker ile payment owner transition yapabiliyor.

## Production ready mi?

Hayır.

## Order oluşuyor mu?

Hayır. Order handoff yok.

## Finance etkisi var mı?

Hayır.

## Risk signal var mı?

Hayır.

## Reconciliation var mı?

Hayır.

## PayTR gerçek canlı/sandbox E2E var mı?

Hayır.

## Sıradaki en doğru paket?

**HARDENING-10C10 — Payment Callback Reconciliation / Status Inquiry Inventory**

---

# 16. Önerilen 10C10 Paket Tanımı

## Paket Adı

**HARDENING-10C10 — Payment Callback Reconciliation / Status Inquiry Inventory**

## Amaç

Payment callback hattında `pending`, `unknown_result`, `unsupported`, `payment_attempt_not_found`, `amount_mismatch`, `currency_mismatch`, `stale/future callback` gibi doğrudan succeeded/failed owner transition’a girmeyen durumların nasıl reconciliation/status inquiry sürecine alınacağını netleştirmek.

## Scope

- PayTR status inquiry ihtiyacı.
- Reconciliation candidate modeli.
- Hangi status hangi aksiyona gider?
- Callback processingStatus extension ihtiyacı.
- Worker retry/backoff ihtiyacı.
- Operator visibility ihtiyacı.
- Risk/finance advisory sınırı.
- Order handoff öncesi reconciliation gate.

## Yasaklı Alanlar

- Payment state mutation eklemek.
- Order handoff eklemek.
- Finance/risk mutation eklemek.
- Live PayTR API çağrısı yapmak.
- Migration yapmak.
- Worker runtime kodlamak.
- Provider secret eklemek.

## Kabul Kanıtı

- pending/unknown/mismatch/not-found durumları için karar matrisi.
- Reconciliation-required durumların owner mutation üretmediği açık karar.
- PayTR status inquiry için gerekli input/output alanları.
- Callback lifecycle’da hangi status’un kullanılacağı.
- Sonraki implementation paketlerinin net sıralanması.

## Beklenen Karar

**INVENTORY COMPLETE / IMPLEMENTATION REQUIRED**

---

# 17. Yönetici Özeti

HARDENING-10 hattı artık basit callback foundation aşamasını geçmiş durumdadır.

Başlangıçta sistem dış provider callback kabul etmiyordu. Şimdi:

- Ortak BFF callback endpoint var.
- Payload persist ediliyor.
- Signature, replay, freshness ve rate-limit foundation var.
- PayTR mapping var.
- PayTR response policy var.
- Config resolver var.
- Payment callback candidate/owner command contract var.
- Worker foundation var.
- Payment providerReference lookup var.
- Payment initiation provider metadata persistence var.
- Succeeded/failed callback opt-in owner transition yapabiliyor.

Ancak:

- Bu hâlâ tam ödeme callback lifecycle değildir.
- Belirsiz durumlar açık.
- Order tetiklenmiyor.
- Finance/risk yok.
- Real PayTR E2E yok.
- Worker production runtime yok.

Bu nedenle sıradaki güvenli adım:

**Payment Callback Reconciliation / Status Inquiry Inventory**

olmalıdır.

---

# 18. Nihai Karar

**HARDENING-10 CALLBACK DECISION INDEX CREATED**

Bu dosya, master referans dosyasının operasyonel karar indeksidir.

Son güncel karar:

```text
HARDENING-10C9-02 sonrası:
Payment callback owner transition sınırlı olarak başladı.
Order / finance / risk / reconciliation / real PayTR E2E hâlâ açık.
Sıradaki önerilen paket: HARDENING-10C10 — Payment Callback Reconciliation / Status Inquiry Inventory.
```

