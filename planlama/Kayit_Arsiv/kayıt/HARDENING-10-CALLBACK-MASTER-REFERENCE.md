# HARDENING-10 Callback / Webhook / Reconciliation Master Reference

## Belge Amacı

Bu dosya, HARDENING-10 hattında provider callback, webhook, reconciliation, payment callback mapping ve payment callback owner transition alanlarında yapılan inventory, foundation, remediation ve closure kayıtlarını tek ana referans altında toplar.

Bu belge bir özet dosyası değildir. Amaç; HARDENING-10 süresince alınan mimari kararları, değişen dosyaları, sınırları, doğrulama kanıtlarını, kalan limitleri ve sonraki paket etkilerini kaybetmeden tek bir master referans haline getirmektir.

Bu master dosya aşağıdaki kullanım amaçları için hazırlanmıştır:

- HARDENING-10 callback/webhook hattında ne yapıldığını tek yerden görmek.
- Hangi paketin hangi sorunu çözdüğünü izlemek.
- PASS / PASS WITH LIMITATION / FAIL kararlarını bağlamıyla korumak.
- Açık kalan limitlerin sonraki paketlere nasıl devredildiğini göstermek.
- Payment callback tarafında PayTR-first ilerlemenin hangi aşamaya geldiğini netleştirmek.
- Domain boundary ihlali yaratmadan sonraki paketlere geçiş için kanıt dosyası sağlamak.

---

# 1. Genel Mimari Çizgi

HARDENING-10 hattı, dış provider sistemlerinden gelen callback/webhook sinyallerinin sisteme güvenli şekilde alınması ve ileride domain owner command zincirine bağlanması için açılmıştır.

Başlangıçta sistemde ortak provider callback envelope sözleşmesi bulunmasına rağmen gerçek inbound callback altyapısı yoktu. BFF callback endpoint yoktu, signature verification yoktu, duplicate/replay guard yoktu, provider-specific mapping yoktu, worker/queue yoktu ve reconciliation runtime yoktu.

HARDENING-10 ilerledikçe hat aşağıdaki aşamalardan geçti:

1. **10-00 Inventory:** Repo gerçekliği çıkarıldı; callback/webhook/reconciliation altyapısının eksik olduğu tespit edildi.
2. **10A Foundation:** Contract, persistence, migration ve in-memory smoke temeli kuruldu.
3. **10A5 / 10A5-R Regression:** İlk final regression BFF runtime eksikliği nedeniyle FAIL oldu; runtime remediasyon sonrası PASS WITH LIMITATION oldu.
4. **10B Inventories:** Payment, shipment, notification ve payout callback domain sınırları çıkarıldı.
5. **10B1:** Postgres idempotency_key conflict davranışı düzeltildi ve Postgres smoke ile doğrulandı.
6. **10B2A-E:** Ortak BFF ingestion, signature guard, replay guard, freshness guard ve process-local rate limit foundation kuruldu.
7. **10B2F:** Ortak callback security boundary final olarak kapandı; domain processing’e doğrudan geçilmemesi, önce provider-specific mapping yapılması kararı alındı.
8. **10C0:** Payment-first provider-specific mapping inventory yapıldı; ilk provider adayı PayTR seçildi.
9. **10C1-C5:** Normalized payment callback candidate modeli, PayTR mapping, PayTR ACK policy, provider config/secret resolution ve PayTR live BFF normalizedPayload bağlantısı kuruldu.
10. **10C6:** Payment callback worker / owner handoff inventory yapıldı.
11. **10C7:** Payment callback state model ve owner command contract foundation kuruldu.
12. **10C8:** Dry-run payment callback worker foundation kuruldu.
13. **10C9-00 / 10C9-01:** providerReference lookup ve payment initiation provider reference persistence kuruldu.
14. **10C9-02:** Opt-in worker modunda succeeded/failed callback için ilk kontrollü payment owner transition eklendi.

Bu aşama sonunda payment callback tarafında artık yalnız ingestion değil, opt-in worker modunda sınırlı payment owner mutation da mevcuttur. Ancak order handoff, finance/risk linkage, reconciliation runtime, PayTR live initiate ve gerçek PayTR E2E hâlâ tamamlanmamıştır.

---

# 2. Değişmez Mimari Kurallar

HARDENING-10 boyunca aşağıdaki kurallar korunmuştur:

## 2.1 Provider Callback Business Truth Değildir

Provider callback, dış sağlayıcının kendi sisteminde bir olay olduğunu bildiren sinyaldir. Bizim sistemimizde kesin business truth değildir.

Callback record yalnızca ingestion / evidence / processing lifecycle kaydıdır.

## 2.2 Callback Record Owner State Mutation Değildir

`ProviderCallbackRecord` payment, shipment, notification veya payout owner state’i değildir. Bu record owner mutation yapmaz.

## 2.3 BFF Truth Owner Değildir

BFF yalnız ingestion, handoff ve response policy seviyesinde kalmalıdır. Payment, order, finance, risk, shipment, notification veya payout truth üretmez.

## 2.4 Event / Audit / Outbox Business Mutation Yerine Geçmez

Event, audit ve outbox kayıtları business mutation’ın kendisi değildir. Önce owner truth yazılır; sonra event/audit/outbox üretilir.

## 2.5 Domain Etki Yalnız Owner Command Zinciriyle Olabilir

Payment callback payment owner command adayına dönüşebilir. Ancak order, settlement, finance correction veya risk truth’u doğrudan mutate edemez.

## 2.6 Signature / Replay / Freshness Guard Geçmeden Processing Yoktur

Invalid signature, replay, duplicate, stale/future timestamp veya identity conflict durumları domain command üretmemelidir.

## 2.7 Duplicate Callback Duplicate Domain Etki Üretmemelidir

Aynı callback yeni kayıt overwrite etmemeli, owner command tekrar uygulanmamalı, duplicate order veya duplicate finance etkisi yaratmamalıdır.

---

# 3. HARDENING-10-00 — Provider Callback / Webhook / Reconciliation Inventory

## Durum

**COMPLETE / IMPLEMENTATION REQUIRED**

HARDENING-09 sonrası repo gerçekliği incelendi. Outbound provider boundary foundation kurulmuştu; ancak inbound provider callback / webhook / reconciliation altyapısı yoktu.

## Ana Bulgular

- `ProviderCallbackEnvelope` contract seviyesinde vardı.
- `ProviderCallbackEnvelope` servis veya BFF içinde kullanılmıyordu.
- Payment callback/webhook endpoint yoktu.
- Shipment carrier callback/tracking ingestion yoktu.
- Notification delivery result callback yoktu.
- Payout provider result callback yoktu.
- Signature verification helper yoktu.
- Duplicate/replay detection yoktu.
- Callback idempotency persistence özel tablo olarak yoktu.
- Raw callback payload persistence kısmi olarak audit/outbox JSON alanlarıyla mümkün görünüyordu.
- Reconciliation runtime yoktu.
- Callback smoke suite yoktu.

## Domain Bazlı Eksikler

### Payment

- Payment callback endpoint yoktu.
- Provider event id alınmıyor/saklanmıyordu.
- Signature verification yoktu.
- Duplicate callback guard yoktu.
- Unknown-result reconciliation yoktu.
- Callback audit/outbox akışı yoktu.
- Callback smoke yoktu.

### Shipment

- Carrier callback endpoint yoktu.
- Tracking event ingestion yoktu.
- Carrier event id veya provider tracking id yoktu.
- Delivered sonrası eligibility akışı callback ile bağlı değildi.
- Shipment callback smoke yoktu.

### Notification

- Email/SMS/Push delivery result callback yoktu.
- Provider delivery event id tutulmuyordu.
- Delivery result provider envelope’a bağlanmıyordu.
- Signature ve replay guard yoktu.
- Notification callback smoke yoktu.

### Payout

- Payout result callback endpoint yoktu.
- Provider payout event id veya payout reference tutulmuyordu.
- Signature ve duplicate guard yoktu.
- Callback result doğrudan paid_out yapmıyordu; çünkü callback işlenmiyordu.
- Payout callback smoke yoktu.

## Persistence / Migration Sonucu

Sağlam callback foundation için özel tablo önerildi. Migration gerekli görüldü.

## Cross-System Boundary Riskleri

Aktif P0 yoktu; çünkü sistem henüz dış provider callback kabul etmiyordu.

Callback mekanizması eklendiğinde P1/P0 seviyesine çıkabilecek riskler:

- Signature verification olmadan sahte callback işleme.
- Duplicate/replay guard olmadan aynı callback’in ikinci finansal/operasyonel etki üretmesi.
- Provider response’un owner state’i doğrudan mutate etmesi.
- BFF’in truth owner gibi davranması.
- Event/audit/outbox kayıtlarının business mutation yerine kullanılması.

## HARDENING-10A İçin İlk Önerilen Sıra

1. HARDENING-10A1 — Provider Callback Contract Only
2. HARDENING-10A2 — Provider Callback Signature Helper Only
3. HARDENING-10A3 — Provider Callback Persistence / Migration Only
4. HARDENING-10A4 — Provider Callback In-Memory Smoke Only
5. HARDENING-10A5 — Provider Callback Final Regression

## Nihai Karar

**COMPLETE / IMPLEMENTATION REQUIRED**

Sistem provider callback/webhook/reconciliation altyapısına sahip değildi. Küçük, kontrollü alt paketlerle ilerleme kararı alındı.

---

# 4. HARDENING-10A3 — Provider Callback Persistence / Migration Only

## Paket Adı

HARDENING-10A3 — Provider Callback Persistence / Migration Only

## Amaç

10A1 ve 10A2 ile eklenen provider callback sözleşme ve imza altyapısını bozmadan yalnız provider callback kayıtları için persistence ve migration temeli eklemek.

## Değişen Dosyalar

- `packages/persistence/src/provider-callback.ts`
- `packages/persistence/src/index.ts`
- `infra/migrations/20260504_001_provider_callback_persistence.sql`

## Eklenen Migration

`provider_callback_events` tablosu eklendi.

Tablo provider callback ham ve normalize verisini, işleme durumunu, imza doğrulama sonucunu ve meta verileri saklamak için tasarlandı.

Eklenen temel indexler:

- `provider_event_id` için unique partial index.
- `idempotency_key` için unique partial index.

## Repository API

`ProviderCallbackEventRepository` arayüzü eklendi.

Temel metotlar:

- `insertProviderCallbackEvent(record)`
- `getProviderCallbackEventById(id)`
- `findProviderCallbackEventByProviderEventId(...)`
- `findProviderCallbackEventByIdempotencyKey(...)`
- `markProviderCallbackEventProcessed(id, ...)`
- `listProviderCallbackEventsByProcessingStatus(status, ...)`

Implementasyonlar:

- `InMemoryProviderCallbackEventRepository`
- `PostgresProviderCallbackEventRepository`

Factory:

- `getProviderCallbackEventRepository()`

## Değişmeyen/Yasaklı Alanlar

- BFF route eklenmedi.
- Webhook/callback endpoint eklenmedi.
- Domain servislerinde callback işleme mantığı eklenmedi.
- Worker/consumer/reconciliation eklenmedi.
- Gerçek cryptographic verification eklenmedi.
- Provider secret/env eklenmedi.
- Root config dosyalarına dokunulmadı.
- `HARDENING_PROGRESS_RECORD` dosyasına dokunulmadı.

## Boundary Sonucu

Repository yalnız veri erişim katmanı olarak kaldı. Domain state mutate etmedi. Contract boundary bozulmadı.

## Çalıştırılan Komutlar

- `pnpm --filter @hx/persistence run build` — PASS
- `pnpm run typecheck` — PASS
- `pnpm run build` — PASS
- Migration uygulaması — PASS

## Kalan Limitler

- BFF callback/webhook endpoint yok.
- Domain callback processing yok.
- Gerçek imza doğrulama yok.
- Duplicate tespit persistence seviyesinde temel düzeyde.
- Callback smoke yok.
- Reconciliation runtime yok.
- Provider-specific mapping yok.

## Nihai Karar

**PASS WITH LIMITATION**

---

# 5. HARDENING-10A4 — Provider Callback In-Memory Smoke Only

## Paket Adı

HARDENING-10A4 — Provider Callback In-Memory Smoke Only

## Amaç

10A1, 10A2 ve 10A3 ile oluşturulan provider callback contract + signature result + persistence foundation’ın yalnız in-memory seviyede gerçek assertion’larla çalıştığını doğrulamak.

## Değişen Dosyalar

- `tests/smoke/suites/provider-callback-foundation.ts`
- `tests/smoke/run-smoke.ts`
- `package.json`
- `HARDENING-10A4-PROVIDER-CALLBACK-IN-MEMORY-SMOKE-CLOSURE-REPORT.md`

## Eklenen Smoke Senaryoları

- InMemory repository instance oluşturma.
- Valid `ProviderCallbackRecord` insert.
- ID ile okuma.
- providerEventId ile bulma.
- idempotencyKey ile bulma.
- `processingStatus=RECEIVED` listeleme.
- `markProviderCallbackEventProcessed` ile `ACCEPTED` güncelleme.
- Duplicate providerEventId için mevcut kaydın dönmesi.
- Duplicate idempotencyKey için mevcut kaydın dönmesi.
- Boundary flaglerin false kalması.
- Signature verified true olsa bile business/owner state mutation olmaması.
- Verification failed olsa bile business mutation olmaması.

## Değişmeyen/Yasaklı Alanlar

- BFF route eklenmedi.
- Webhook/callback endpoint eklenmedi.
- Domain servislerine dokunulmadı.
- Domain processing, worker, consumer, reconciliation eklenmedi.
- Real crypto eklenmedi.
- Migration değiştirilmedi.
- Postgres behavior değiştirilmedi.
- Git komutu çalıştırılmadı.

## Çalıştırılan Komutlar

- `pnpm run typecheck` — PASS
- `pnpm run build` — PASS
- `pnpm run smoke:provider-boundary` — PASS
- `pnpm run smoke:provider-callback-foundation` — PASS

## Kalan Limitler

- BFF callback/webhook endpoint yok.
- Domain callback processing yok.
- Real cryptographic verification yok.
- Replay/duplicate detection smoke + persistence foundation seviyesinde.
- Postgres smoke yok.
- Postgres repository `idempotency_key` conflict davranışı düzeltilmedi.
- Reconciliation runtime yok.
- Provider-specific callback mapping yok.

## Nihai Karar

**PASS WITH LIMITATION**

---

# 6. HARDENING-10A5 — Provider Callback Final Regression

## Paket Adı

HARDENING-10A5 — Provider Callback Final Regression / Closure

## Amaç

10A1–10A4 hattının final regression doğrulamasını yapmak.

## Source Review Sonucu

- Contract review: PASS.
- Persistence review: PASS.
- Migration review: PASS.
- Smoke registry review: PASS.
- Boundary review: PASS.

## Çalıştırılan Komutlar ve Sonuçları

PASS olanlar:

- `pnpm --filter @hx/contracts run build`
- `pnpm --filter @hx/persistence run build`
- `pnpm run typecheck`
- `pnpm run build`
- `pnpm run smoke:provider-boundary`
- `pnpm run smoke:provider-callback-foundation`

FAIL olanlar:

- `pnpm run smoke:payment-provider-boundary`
- `pnpm run smoke:shipment-provider-boundary`
- `pnpm run smoke:notification-provider-boundary`
- `pnpm run smoke:payout-provider-boundary`

FAIL sebebi:

- BFF servisi çalışmadığı için `fetch failed`.

`pnpm run smoke:all`: PARTIAL.

## Boundary Sonucu

- Provider callback business truth değildir.
- Callback record owner state mutation değildir.
- Signature verification result business mutation değildir.
- Persistence kaydı yalnız callback izidir.
- BFF truth owner değildir.
- Event/audit/outbox business mutation yerine geçmez.

## Nihai Karar

**FAIL**

## Remediation Önerisi

BFF servisi başlatılmalı, `/health` doğrulanmalı ve BFF bağımlı smoke testleri yeniden çalıştırılmalıydı.

---

# 7. HARDENING-10A5-R — Runtime Remediation

## Paket Adı

HARDENING-10A5-R — Provider Callback Final Regression Runtime Remediation

## Amaç

10A5 final regression sırasında BFF runtime çalışmadığı için FAIL olan provider boundary smoke testlerini doğru runtime ön koşullarıyla yeniden doğrulamak.

## Runtime Ön Koşulları

- `.env` oluşturuldu.
- `BFF_PORT=3001` ayarlandı.
- `PERSISTENCE_MODE=postgres` ayarlandı.
- `DATABASE_URL` doğrulandı.
- Docker/Postgres çalışır kabul edildi.
- `pnpm dev:bff` ile BFF başlatıldı.
- `/health` HTTP 200 döndü.

## Çalıştırılan Komutlar

- `pnpm run typecheck` — PASS
- `pnpm run build` — PASS
- `pnpm dev:bff` — PASS
- `curl http://localhost:3001/health` — PASS
- `pnpm run smoke:provider-boundary` — PASS
- `pnpm run smoke:provider-callback-foundation` — PASS
- `pnpm run smoke:payment-provider-boundary` — PASS
- `pnpm run smoke:shipment-provider-boundary` — PASS
- `pnpm run smoke:notification-provider-boundary` — PASS
- `pnpm run smoke:payout-provider-boundary` — PASS
- `pnpm run smoke:all` — PASS

## Değişen Dosyalar

- `HARDENING-10A5-R-PROVIDER-CALLBACK-FINAL-REGRESSION-RUNTIME-REMEDIATION-CLOSURE-REPORT.md`
- Testlerin çalışması için `.env`

Kod dosyası değiştirilmedi.

## Kalan Limitler

- BFF callback/webhook endpoint yok.
- Domain callback processing yok.
- Real cryptographic signature verification yok.
- Postgres callback smoke eksik.
- Postgres idempotency_key conflict davranışı test edilmemiş.
- Reconciliation runtime yok.
- Provider-specific mapping yok.

## Nihai Karar

**PASS WITH LIMITATION**

---

# 8. HARDENING-10B-00A — Provider Callback Repo / Source Reality Inventory

## Genel Durum

10A ile repo tarafında şu foundation eklendi:

- Contract: `ProviderCallbackEnvelope`, `ProviderCallbackRecord`, signature result tipleri ve helper fonksiyonlar.
- Persistence: `provider_callback_events` migration’ı ve `ProviderCallbackEventRepository`.
- Smoke: `provider-callback-foundation` in-memory CRUD/idempotency smoke.

## Repo’da Var Olanlar

- `packages/contracts/src/provider.ts`
- `packages/persistence/src/provider-callback.ts`
- `infra/migrations/20260504_001_provider_callback_persistence.sql`
- `tests/smoke/suites/provider-callback-foundation.ts`

## Hâlâ Olmayanlar

- BFF callback/webhook endpoint.
- Real signature verification logic.
- Domain processing.
- Reconciliation/replay runtime.
- Provider-specific mapping.

## Contract Reality

- `ProviderCallbackEnvelope` var.
- `ProviderCallbackRecord` var.
- Signature algorithm/input/result tipleri var.
- `createProviderCallbackSignatureVerificationResult` var.
- Boundary flags default false korunuyor.
- Callback business truth değil, record/envelope seviyesinde.

## Persistence Reality

- `ProviderCallbackEventRepository` var.
- In-memory repo var.
- Postgres repo var.
- `insert/read/find/update/list` API’leri var.
- Duplicate providerEventId in-memory ve Postgres tarafında mevcut kaydı döndürmeye yakındı.
- Duplicate idempotencyKey in-memory ve Postgres tarafında aynı değildi.
- Postgres tarafında `idempotency_key` için `ON CONFLICT` eksikti.
- `packages/persistence/src/index.ts` export ediyordu.

## Migration Reality

- `provider_callback_events` tablosu var.
- `provider_event_id` unique partial index var.
- `idempotency_key` unique partial index var.
- Migration idempotent.
- `created_at` / `updated_at` var.

## BFF Reality

- `apps/bff/src/server/index.ts` içinde callback/webhook endpoint yok.
- Payment/shipment/notification/payout route dosyalarında callback endpoint yok.
- BFF callback ingestion yapmıyor.
- BFF domain callback processing yapmıyor.
- BFF mevcut domain route’larını taşıyor.

## Domain Service Reality

- Payment callback/webhook/reconciliation yok.
- Shipment callback/tracking ingestion yok.
- Notification delivery callback yok.
- Payout provider result callback yok.
- Provider adapter’lar outbound/sandbox boundary.

## Smoke Reality

- `provider-boundary` smoke var.
- `provider-callback-foundation` smoke var.
- Payment/shipment/notification/payout provider boundary smoke’ları var.
- Smoke runner kayıtları var.
- package.json scriptleri var.
- Callback foundation smoke gerçek assertion içeriyor.

## Current Gaps

- BFF callback endpoint yok.
- Real signature verification yok.
- Replay runtime yok.
- Domain callback processing yok.
- Reconciliation runtime yok.
- Postgres callback smoke yok.
- Provider-specific callback mapping yok.

## Nihai Karar

**SOURCE INVENTORY COMPLETE / DOMAIN INVENTORY REQUIRED**

Sonraki alt görev önerisi:

**HARDENING-10B-00B — Payment Callback Domain Inventory**

---

# 9. HARDENING-10B-00B — Payment Callback Domain Inventory

## Genel Durum

Payment callback repo’da yoktu. Gelen payment callback’i işleyecek, doğrulayacak veya domain mantığını tetikleyecek webhook endpoint, worker veya consumer yoktu.

10A foundation payment callback için contract, persistence, idempotency indexleri ve in-memory smoke sağladı.

Eksik parçalar:

- BFF callback endpoint.
- Real signature verification.
- Domain processing.
- Reconciliation runtime.

## Payment Sistem Sınırı

- Payment sistemi checkout’tan gelen doğrulanmış bağlamı finansal sonuca çevirir.
- Payment sepet, checkout veya order değildir.
- Payment provider response business truth değildir.
- Payment callback payment owner’ın doğrulama/processing hattına girmeden order/finance etkisi üretemez.

## Payment Callback Ne Temsil Eder?

Payment callback:

- Provider event notification’dır.
- Payment attempt status signal’dır.
- Raw provider payload’dır.
- Verification result taşır.
- Replay/idempotency status taşır.
- Payment owner transition adayıdır.

Payment callback doğrudan “order created” veya “finance settled” anlamına gelmez.

## Status Model Kararları

- `succeeded/captured`: Payment owner command adayına dönüşebilir; order hakkı yalnız payment owner `SUCCEEDED` sonrası dolaylı doğar.
- `failed`: Payment failed command adayına dönüşebilir; order/finance etkisi yoktur.
- `pending`: Ara durumdur; reconciliation gerekebilir.
- `cancelled`: Payment cancelled command adayı olabilir.
- `expired/timeout`: Payment expired command adayı olabilir.
- `unknown_result`: Doğrudan command üretmez; reconciliation gerekir.
- `duplicate/replay`: Command üretmez.
- `signature_failed`: Rejected; risk/security olayı adayıdır.
- `unsupported`: Ignored veya reconciliation adayıdır.

## Order Boundary

- Payment callback doğrudan order oluşturamaz.
- Duplicate callback duplicate order yaratmamalıdır.
- Order creation payment owner success sonrası gerçekleşmelidir.
- Existing order idempotency korunmalıdır.

Net karar:

**Payment callback hiçbir durumda order service’i bypass etmemeli.**

## Finance / Settlement Boundary

- Payment callback doğrudan settlement/hakediş yaratamaz.
- Kupon/sponsor/settlement etkisi callback payload’dan türemez.
- Finansal mutabakat order created ve sonraki operasyonel zincirlerden sonra başlar.
- Payment success hakediş kesinleşmesi değildir.
- Risk/fraud signal payment callback tarafında aday olabilir ama truth mutate etmez.

## Idempotency / Replay / Duplicate Risk

- `providerEventId`: event-level dedupe.
- `idempotencyKey`: request-level/original intent bağlantısı.
- `provider payment reference`: doğru payment entity ile eşleşme.
- Duplicate callback command üretmemelidir.
- `unknown_result` sonrası reconciliation gerekir.
- Postgres `idempotency_key` conflict riski vardır.

## Security / Signature / Config Boundary

- Signature verification olmadan payment callback processing yapılmamalıdır.
- Provider secret/env C0 secret config sınıfındadır.
- Public endpoint rate limit gerektirir.
- Fake/replay callback signature, providerEventId ve timestamp kontrolleriyle sınırlandırılmalıdır.

## BFF Boundary

- BFF ingestion + async handoff yapmalıdır.
- BFF truth owner olamaz.
- BFF payment state mutate edemez.
- BFF order create çağıramaz.
- Persistence ve owner command handoff worker içinde olmalıdır.

## Audit / Event / Outbox Boundary

- Callback kaydı audit yerine geçmez.
- Audit/outbox business mutation yerine geçmez.
- Event publish owner truth yazıldıktan sonra olmalıdır.

## Implementation Seçenekleri

A) Callback ingestion + persistence  
B) Ingestion + payment owner command handoff  
C) Ingestion + payment owner command + order handoff  
D) Reconciliation-first yaklaşım

## Önerilen İlk Payment Callback Sırası

1. 10C1: Callback Ingestion & Persistence Foundation
2. 10C2: Signature Verification Guard
3. 10C3: Basic Payment State Command Handoff
4. 10C4: Reconciliation for Unknown Results
5. 10C5: Full Lifecycle & Edge Case Handling

## Nihai Karar

**PAYMENT DOMAIN INVENTORY COMPLETE / IMPLEMENTATION REQUIRED**

Net öneri: Önce ortak BFF Callback Ingestion Boundary kurulmalıydı. Payment-specific processing, signature/replay/persistence guard’ları tamamlanmadan açılmamalıydı.

---

# 10. HARDENING-10B-00C — Shipment Callback / Eligibility Inventory

## Genel Durum

Shipment/carrier callback repo’da yoktu. Kargo firmasından gelen callback’i işleyecek BFF endpoint, worker veya domain processing yoktu.

10A foundation shipment callback için generic contract, persistence, idempotency ve smoke temeli sağladı.

## Shipment / Delivery Sistem Sınırı

- Shipment order değildir.
- Shipment sipariş takip yüzeyi değildir.
- Shipment review/story sistemi değildir.
- Carrier/provider response business truth değildir.
- Carrier callback shipment owner doğrulama/processing hattına girmeden delivered veya eligibility etkisi üretemez.

## Shipment Callback Ne Temsil Eder?

Shipment callback:

- Carrier event notification’dır.
- Tracking event signal’dır.
- Raw carrier payload’dır.
- Provider tracking reference taşır.
- Verification result taşır.
- Replay/idempotency status taşır.
- Shipment owner transition adayıdır.

Shipment callback doğrudan delivered truth, review eligibility veya story eligibility değildir.

## Shipment Status Model Kararları

- `label_created / accepted_by_carrier`: preparing/shipped command adayı; eligibility etkisi yok.
- `shipped`: shipment owner transition adayı; eligibility yok.
- `in_transit`: tracking görünürlüğü; eligibility yok.
- `out_for_delivery`: tracking görünürlüğü; eligibility yok.
- `delivered`: kritik owner command adayı; review/story eligibility dolaylı olarak shipment delivered event sonrası açılır.
- `delivery_failed`: problem state adayı; eligibility yok.
- `returned_to_sender`: shipment state adayı; eligibility yok.
- `lost/damaged/exception`: support/operations problem event adayı.
- `unknown_result`: reconciliation gerekir.
- `duplicate/replay`: command üretmez.
- `signature_failed`: command üretmez; security/risk alarm adayı.
- `unsupported`: ignored.

## Delivered Boundary

- Carrier callback doğrudan shipment state’i delivered yapamaz.
- Delivered transition shipment owner command üzerinden olmalıdır.
- State guard ve idempotency guard gerekir.
- Aynı delivered callback tekrar gelirse duplicate/ignored olmalıdır.
- Delivered timeline append-only history olarak saklanmalıdır.

Net karar:

**Carrier callback shipment owner’ı bypass etmemeli.**

## Review / Rating Eligibility Boundary

- Delivered sonrası review hakkı shipment delivered owner event sonrası açılmalıdır.
- Review eligibility carrier callback içinde açılmamalıdır.
- Review sistemi shipment domain event’inden beslenmelidir.
- Guest user review yapamaz.
- Line-level delivered review hakkı için önemlidir.
- Return sonrası rating etkisi azaltılmalı/kaldırılmalıdır.

## User Product Story Eligibility Boundary

- Story eligibility shipment delivered event sonrası açılmalıdır.
- Carrier callback içinde açılmaz.
- ProductId/orderLineId bağlamı korunmalıdır.
- Aynı ürün için story hakkı limitleri korunmalıdır.
- Guest user story hakkı alamaz.
- Review/story eligibility aynı delivered event’ten fan-out ile türemelidir.

## Order Tracking Boundary

- Sipariş takip sistemi truth üretmez.
- Shipment callback tracking projection’ı doğrudan mutate edemez.
- Tracking projection shipment truth event’lerinden beslenmelidir.
- Multi-package/line-level görünürlük korunmalıdır.

## Order / Operation Boundary

- Shipment callback order status’u doğrudan değiştiremez.
- Operation ve shipment domainleri ayrıdır.
- Shipment problem callback’i support/operation kaydını doğrudan değil, owner event zinciriyle tetiklemelidir.

## Nihai Karar

**SHIPMENT DOMAIN INVENTORY COMPLETE / IMPLEMENTATION REQUIRED**

Net öneri: Shipment-specific delivered/eligibility işlemeye geçmeden önce ortak ingestion boundary, signature guard, replay guard, state transition guard ve transactional outbox gerekir.

---

# 11. HARDENING-10B-00D — Notification Delivery Callback Inventory

## Genel Durum

Notification delivery callback repo’da yoktu. Email/SMS/push delivery callback’i işleyecek BFF endpoint, worker veya consumer yoktu.

10A foundation generic callback contract, persistence, idempotency ve smoke sağladı.

## Notification Sistem Sınırı

- Notification order, payment, shipment, payout veya analytics truth owner değildir.
- Notification provider delivery response business truth değildir.
- Delivery callback yalnız notification delivery attempt/status sinyalidir.
- Notification callback başka domain state mutate edemez.
- Analytics sinyal olabilir, truth/decision owner değildir.

## Callback Ne Temsil Eder?

Notification callback:

- Provider delivery event notification’dır.
- Delivery attempt result signal’dır.
- Channel-specific result taşır.
- Raw provider payload’dır.
- Provider message id / delivery id taşır.
- Verification result taşır.
- Replay/idempotency status taşır.
- Notification owner update adayıdır.

Notification callback doğrudan “user saw notification”, “order updated”, “payment changed”, “shipment changed” veya “analytics truth” değildir.

## Status Model Kararları

- `accepted/sent`: delivery attempt ara durum adayı; başka domain etkisi yok.
- `delivered`: delivery attempt delivered; notification READ değildir.
- `failed/bounced/blocked`: delivery attempt failed command adayı.
- `spam_reported`: preference/risk signal adayı.
- `opened/clicked`: analytics signal; notification READ state değildir.
- `unsubscribed`: notification preference command adayı.
- `unknown_result`: reconciliation gerekir.
- `duplicate/replay`: command yok.
- `signature_failed`: rejected/security risk adayı.
- `unsupported`: ignored.

## Delivery Attempt Boundary

- Provider callback notification status’u doğrudan mutate edemez.
- NotificationDeliveryAttempt ve NotificationRecord.state ayrıdır.
- Delivered callback kullanıcı tarafından okundu anlamına gelmez.
- Open/click READ state anlamına gelmez.
- Bounce/fail owner command ile işlenmelidir.

## Analytics Boundary

- Delivery/open/click analytics event olabilir.
- Analytics decision/truth owner değildir.
- Open/click davranış sinyalidir.
- Analytics event notification state yerine geçemez.
- Analytics audit yerine geçemez.
- Funnel kirliliğini önlemek için idempotency, bot/spam filtering ve açık isimlendirme gerekir.

## Cross-Domain Boundary

- Notification callback payment/order/shipment/payout state değiştiremez.
- Delivery failed olması ilgili business action başarısız demek değildir.
- Notification delivered olması ilgili iş olayının gerçekleştiği anlamına gelmez.
- Support/risk/moderation doğrudan değil event-driven tetiklenmelidir.

## Nihai Karar

**NOTIFICATION DOMAIN INVENTORY COMPLETE / IMPLEMENTATION REQUIRED**

Net öneri: Notification-specific processing’den önce ortak ingestion + signature + idempotency + state transition + analytics/audit boundary guard’ları gerekir.

---

# 12. HARDENING-10B-00E — Payout Callback / Finance-Risk Inventory

## Genel Durum

Payout provider callback repo’da yoktu. Payout provider’dan gelen paid/failed/returned callback’i işleyecek endpoint, worker veya domain processing yoktu.

10A foundation generic callback contract, persistence, idempotency ve smoke sağladı.

## Payout / Finance Sistem Sınırı

- Payment tahsilat sistemi ile payout ödeme çıkış sistemi aynı değildir.
- Settlement/hakediş ile payout ödeme çıkışı aynı değildir.
- Payout provider response business truth değildir.
- Payout callback finance/risk guard hattından geçmeden paid/failed etkisi üretemez.
- Risk/fraud hold varsa callback owner state’i bypass edemez.
- BFF truth owner değildir.

## Payout Callback Ne Temsil Eder?

Payout callback:

- Provider payout event notification’dır.
- Payout transfer result signal’dır.
- Raw provider payload’dır.
- Provider transfer/reference id taşır.
- Verification result taşır.
- Replay/idempotency status taşır.
- Payout owner transition adayıdır.
- Finance correction adayı olabilir.
- Risk/fraud signal adayı olabilir.

Payout callback doğrudan “hakediş kesinleşti”, “ödeme çıkışı tamamlandı”, “finance settled” veya “risk clear” değildir.

## Status Model Kararları

- `accepted/queued`: processing teyidi; finance etkisi yok.
- `processing`: processing teyidi.
- `paid/succeeded`: payout owner MarkPaid command adayı; settlement etkisi dolaylı.
- `failed`: MarkFailed command adayı; finance correction/retry ihtiyacı doğabilir.
- `rejected`: failed benzeri.
- `returned/reversed`: MarkReturned command adayı; finance correction ve risk signal gerektirir.
- `cancelled`: MarkCancelled command adayı.
- `held/blocked`: PlaceOnHold command adayı; risk inceleme.
- `unknown_result`: reconciliation.
- `duplicate/replay`: command yok.
- `signature_failed`: rejected + risk signal adayı.
- `unsupported`: ignored.

## Paid Boundary

- Provider paid callback doğrudan payout item/batch’i PAID yapamaz.
- Paid transition payout owner command ile olmalıdır.
- State guard, idempotency guard, risk/hold guard gerekir.
- ON_HOLD state paid callback ile bypass edilemez.
- Batch-level ve item-level result ayrımı korunmalıdır.

## Failed / Returned Boundary

- Failed callback doğrudan finance correction oluşturamaz.
- Returned/reversed ciddi finansal anomali olarak ele alınmalıdır.
- Failed payout reason’a göre retry veya review’a gidebilir.
- Finance correction owner payout owner outcome sonrası devreye girmelidir.
- Risk signal anormal returned/failed patternlerinde üretilmelidir.

## Settlement Boundary

- Payout callback settlement line state’i doğrudan değiştiremez.
- Payable amount ve paid amount ayrıdır.
- Payout failed/returned olduğunda settlement otomatik PAYABLE yapılmamalı; finance correction değerlendirilmelidir.
- Kupon/sponsor/commission provider payload’dan türemez.

## Risk / Fraud Boundary

- Risk hold payout ön koşulunda uygulanmalıdır.
- Payout callback risk hold’u bypass edemez.
- Fake paid callback signature/IP/reconciliation ile sınırlandırılmalıdır.
- Anormal returned/failed pattern risk case adayıdır.
- Risk case çözülmeden retry yapılmamalıdır.

## Nihai Karar

**PAYOUT DOMAIN INVENTORY COMPLETE / IMPLEMENTATION REQUIRED**

Net öneri: Payout-specific paid işlemeye geçmeden önce ortak BFF ingestion boundary, signature guard, replay guard, state transition guard ve finance/risk hold guard gerekir.

---

# 13. HARDENING-10B-00F — Cross-Domain Risk & Implementation Order Final Inventory

## Genel Durum

10A foundation tamamlandı. 10B-00A/B/C/D/E inventory’leri payment, shipment, notification ve payout callback domain sınırlarını netleştirdi.

Ortak sonuç:

- Foundation sağlam.
- Gerçek callback processing hiçbir domain için mevcut değil.
- Tüm domainler ortak BFF ingestion, signature, replay/idempotency, async processing ve provider-specific mapping gerektiriyor.

## Ortak Repo Gerçekliği

Var olanlar:

- Contract foundation.
- Persistence foundation.
- Migration.
- In-memory smoke.

Olmayanlar:

- BFF callback endpoint.
- Real signature verification.
- Replay runtime.
- Domain processing.
- Provider-specific mapping.
- Reconciliation runtime.

## Cross-Domain Değişmez İlkeler

- Provider callback business truth değildir.
- Callback record owner state mutation değildir.
- Provider response/callback owner truth’u doğrudan mutate edemez.
- BFF truth owner değildir.
- Event/audit/outbox business mutation yerine geçmez.
- Signature verification geçmeden processing yok.
- Replay/idempotency guard geçmeden owner command yok.
- Domain effect yalnız owner command/event zinciriyle olabilir.
- Callback processing idempotent olmalıdır.
- Public webhook endpoint security/rate-limit olmadan açılmamalıdır.

## Domain Bazlı Nihai Sınırlar

### Payment

- Callback doğrudan order oluşturamaz.
- Callback doğrudan settlement yaratamaz.
- Yalnız payment owner transition adayıdır.
- Unknown-result reconciliation gerektirir.
- Duplicate callback duplicate order üretmemelidir.

### Shipment

- Callback delivered truth değildir.
- Review/story eligibility doğrudan açamaz.
- Delivered yalnız shipment owner command sonrası geçerli olur.
- Eligibility shipment delivered owner event sonrası ayrı flow ile açılır.
- Tracking projection truth üretmez.

### Notification

- Callback yalnız delivery attempt/status sinyalidir.
- Delivered notification READ değildir.
- Open/click READ state değildir; analytics sinyalidir.
- Callback başka domain truth mutate edemez.
- Analytics truth/decision owner değildir.

### Payout

- Callback doğrudan PAID yapamaz.
- Risk/fraud hold varsa state değişmemeli.
- Failed/returned doğrudan settlement/finance truth mutate etmemeli.
- Finance correction payout owner event/command zinciri sonrası devreye girmeli.
- Batch-level ve item-level ayrımı korunmalı.

## Ortak Risk Matrisi

Öne çıkan riskler:

- Sahte callback — P0.
- Signature verification eksikliği — P0.
- Duplicate/replay callback — P1.
- Postgres idempotency_key conflict — P2.
- BFF’in truth owner gibi davranması — P1.
- Payment callback ile duplicate order — P1.
- Shipment callback ile erken eligibility — P1.
- Notification analytics pollution — P2.
- Payout paid callback ile risk hold bypass — P0.
- Provider-specific mapping eksikliği — P2.
- Reconciliation runtime eksikliği — P1.
- Public webhook rate limit eksikliği — P2.
- Event ordering sorunları — P2.
- Postgres callback smoke eksikliği — P2.

## Guard Dependency Sırası

1. Provider callback repository Postgres duplicate behavior fix / smoke.
2. Common BFF callback ingestion boundary.
3. Real signature verification guard.
4. Replay/idempotency guard.
5. Provider-specific mapping layer.
6. Async callback worker / processing queue.
7. Domain owner command handoff.
8. Domain-specific state transition guards.
9. Outbox/audit/event emission.
10. Reconciliation/polling runtime.
11. Rate limit / abuse guard.

## İlk Kodlama Paket Kararı

A) Doğrudan payment callback processing — sonra.  
B) Ortak BFF callback ingestion boundary — önce, ama persistence riskinden sonra.  
C) Önce Postgres idempotency_key conflict remediation + callback Postgres smoke — en önce.

Net karar:

**İlk gerçek implementation C seçeneği olmalıydı.**

## Önerilen HARDENING-10B Implementation Roadmap

- 10B1: Postgres Callback Persistence Remediation.
- 10B2: Common BFF Callback Ingestion Boundary.
- 10B3: Basic Payment Callback Processing.
- 10B4: Basic Shipment Callback Processing.
- 10B5: Eligibility Consumer for Delivered Event.
- 10B6: Reconciliation Runtime Foundation for Payment.
- 10B7: Payout & Notification Callback Processing Basic.

## Nihai Karar

**CROSS-DOMAIN INVENTORY COMPLETE / IMPLEMENTATION ROADMAP REQUIRED**

İlk kodlama paketi önerisi:

**HARDENING-10B1 — Postgres Callback Persistence Remediation**

---

# 14. HARDENING-10B1 — Provider Callback Postgres Idempotency Remediation & Smoke

## Amaç

Provider callback ingestion açılmadan önce Postgres repository duplicate `idempotency_key` davranışını in-memory repository ile uyumlu hale getirmek ve gerçek Postgres smoke testiyle kanıtlamak.

## Problem

In-memory duplicate `providerEventId` ve `idempotencyKey` için mevcut kaydı döndürüyordu. Postgres tarafında `provider_event_id` için conflict davranışı vardı; `idempotency_key` için unique partial index olmasına rağmen insert sorgusu conflict yönetmiyordu. Bu production’da `23505 unique_violation` hatasına yol açabilirdi.

## Değişen Dosyalar

- `packages/persistence/src/provider-callback.ts`
- `tests/smoke/suites/provider-callback-postgres.ts`
- `tests/smoke/run-smoke.ts`
- `package.json`
- `HARDENING-10B1-PROVIDER-CALLBACK-POSTGRES-IDEMPOTENCY-REMEDIATION-CLOSURE-REPORT.md`

## Yapılan Düzeltme

- Insert öncesi providerEventId lookup eklendi.
- Insert öncesi idempotencyKey lookup eklendi.
- Duplicate kayıt bulunduğunda mevcut kayıt döndürüldü.
- Business alan overwrite yapılmadı.
- Existing provider_event_id ON CONFLICT davranışı korundu.
- Race condition kaynaklı `23505 unique_violation` durumunda mevcut kayıt tekrar aranıp döndürüldü.
- Mevcut kayıt bulunamazsa hata tekrar fırlatıldı.
- Parametrized query kullanımı korundu.

## Smoke Senaryoları

- `PERSISTENCE_MODE=postgres` ve `DATABASE_URL` doğrulandı.
- Unique providerEventId/idempotencyKey insert.
- Duplicate providerEventId mevcut kaydı döndürdü.
- Duplicate idempotencyKey mevcut kaydı döndürdü.
- Duplicate denemeler business alanları overwrite etmedi.
- Lookup metotları mevcut kaydı buldu.
- `markProviderCallbackEventProcessed` accepted + processedAt doğrulandı.
- Test verileri izole üretildi.

## Değişmeyen/Yasaklı Alanlar

- BFF route eklenmedi.
- Webhook/callback endpoint eklenmedi.
- Signature helper/real crypto eklenmedi.
- Domain processing eklenmedi.
- Payment/shipment/notification/payout servislerine dokunulmadı.
- Worker/queue/reconciliation eklenmedi.
- Migration değiştirilmedi.
- Contracts değiştirilmedi.
- `.env.example` değiştirilmedi.
- Git ve pnpm install çalıştırılmadı.

## Çalıştırılan Komutlar

- `pnpm --filter @hx/persistence run build` — PASS
- `pnpm run typecheck` — PASS
- `pnpm run build` — PASS
- `pnpm run smoke:provider-callback-foundation` — PASS
- `pnpm run smoke:provider-callback-postgres` — PASS

## Boundary Sonucu

Provider callback persistence record hâlâ audit/ingestion kaydıdır. Business truth değildir. Duplicate insert owner state mutation, domain command veya business overwrite üretmez.

## Kalan Limitler

- BFF endpoint yok.
- Real signature verification yok.
- Replay runtime yok.
- Provider-specific mapping yok.
- Domain processing yok.
- Worker/queue yok.
- Reconciliation yok.
- Public webhook rate limiting yok.

## Nihai Karar

**PASS**

---

# 15. HARDENING-10B2A — Common Provider Callback BFF Ingestion Boundary

## Amaç

Provider callback ingestion için ortak BFF giriş sınırını kurmak. Yalnız gelen callback isteklerini alır, temel payload/header bilgilerini standart `ProviderCallbackRecord` formatında kaydeder ve hızlı `202 Accepted` döner.

## Değişen Dosyalar

- `apps/bff/src/server/provider-callback.ts`
- `apps/bff/src/server/index.ts`
- `tests/smoke/suites/provider-callback-ingestion.ts`
- `tests/smoke/run-smoke.ts`
- `package.json`
- `HARDENING-10B2A-COMMON-PROVIDER-CALLBACK-BFF-INGESTION-BOUNDARY-CLOSURE-REPORT.md`

## Eklenen Endpoint

`POST /provider-callback/:providerDomain/:providerName`

Geçerli providerDomain değerleri:

- `payment`
- `shipment`
- `notification`
- `payout`

Geçersiz domain veya boş providerName için `400`.

Başarılı ingestion response:

- HTTP `202 Accepted`
- Minimal data: id, providerDomain, providerName, callbackType, processingStatus, verificationStatus, replayStatus
- `rawPayload` response içinde dönmez.

## Persistence Davranışı

- Handler `ProviderCallbackRecord` oluşturur.
- `getProviderCallbackEventRepository()` ile persist eder.
- `callbackType` body/header alanlarından çözülür; yoksa `unknown`.
- `providerMode` valid değilse `sandbox`.
- `verificationStatus=unsupported`
- `signatureVerified=false`
- `replayDetected=false`
- `replayStatus=unknown`
- `processingStatus=received`
- `boundary=createProviderBoundaryFlags()`
- `rawPayload` JSON body olarak saklanır.
- Duplicate durumlar 10B1 persistence idempotency davranışına bırakılır.

## Smoke Senaryoları

- `/health` çalışıyor.
- Postgres env ön koşulları.
- Payment callback 202.
- Response minimal ve rawPayload yok.
- Persisted record okunuyor.
- Boundary false.
- Duplicate providerEventId mevcut id döndürüyor.
- Duplicate idempotencyKey mevcut id döndürüyor.
- Duplicate overwrite yok.
- Geçersiz provider domain 400.

## Çalıştırılan Komutlar

- `pnpm --filter @hx/bff run build` — PASS
- `pnpm run typecheck` — PASS
- `pnpm run build` — PASS
- `pnpm run smoke:provider-callback-postgres` — PASS
- BFF 3011 portunda başlatma — PASS
- `/health` — PASS
- `smoke:provider-callback-ingestion` — PASS
- `smoke:provider-boundary` — PASS
- `smoke:provider-callback-foundation` — PASS

## Boundary Sonucu

BFF endpoint yalnız ingestion + persistence sınırıdır. Domain state mutate etmez. Signature verification unsupported olduğu için processing yoktur.

## Kalan Limitler

- Real signature verification yok.
- Provider-specific mapping yok.
- Replay runtime yok.
- Domain processing yok.
- Worker/queue yok.
- Reconciliation yok.
- Rate limit yok.
- Production webhook güvenliği için tek başına yeterli değil.

## Nihai Karar

**PASS WITH LIMITATION**

---

# 16. HARDENING-10B2B — Provider Callback Signature Guard Foundation

## Amaç

10B2A ortak ingestion endpoint’ine domain processing öncesi signature guard foundation eklemek.

## Değişen Dosyalar

- `apps/bff/src/server/provider-callback.ts`
- `tests/smoke/suites/provider-callback-signature-guard.ts`
- `tests/smoke/run-smoke.ts`
- `package.json`
- `HARDENING-10B2B-PROVIDER-CALLBACK-SIGNATURE-GUARD-FOUNDATION-CLOSURE-REPORT.md`

## Signature Input Alanları

Handler şu header alanlarını okuyabilir:

- `x-provider-signature`
- `x-provider-signature-algorithm`
- `x-provider-timestamp`
- `x-provider-nonce`
- `x-provider-event-id`
- `idempotency-key`
- `x-idempotency-key`

Body içinden:

- `providerEventId` / `eventId` / `id`
- `idempotencyKey`
- `callbackType` / `eventType` / `type` / `event`

## Karar Matrisi

- Missing signature / unsupported algorithm: `verificationStatus=unsupported`, `processingStatus=received`
- Supported `hmac_sha256` ama secret yok: `unsupported`
- Invalid HMAC: `verificationStatus=failed`, `processingStatus=rejected`
- Valid HMAC: `verificationStatus=verified`, `processingStatus=received`

Invalid signature için HTTP `202` döner; kayıt `rejected` olarak persist edilir. Amaç retry storm engellemek ve güvenlik olayını saklamaktır.

## HMAC Test Canonicalization

- Canonical payload: `JSON.stringify(body)`
- Signature: hex `HMAC SHA-256(secret, JSON.stringify(body))`
- Test provider: `signature-test-provider`
- Test secret: `test-callback-secret`

Bu production provider config değildir.

## Smoke Senaryoları

- Valid signature verified.
- Invalid signature failed/rejected.
- Unsupported algorithm unsupported/received.
- Missing signature unsupported/received.
- Duplicate valid callback DB hatası üretmeden existing id döndürür.
- Duplicate overwrite yok.
- Boundary false.

## Çalıştırılan Komutlar

- `pnpm --filter @hx/bff run build` — PASS
- `pnpm run typecheck` — PASS
- `pnpm run build` — PASS
- BFF start 3011 — PASS
- `/health` — PASS
- `smoke:provider-callback-ingestion` — PASS
- `smoke:provider-callback-signature-guard` — PASS
- `smoke:provider-callback-postgres` — PASS
- `smoke:provider-boundary` — PASS
- `smoke:provider-callback-foundation` — PASS

## Boundary Sonucu

Endpoint hâlâ ingestion + persistence + signature guard foundation sınırıdır. Domain state mutate etmez.

## Kalan Limitler

- Gerçek provider secret/env yok.
- Provider-specific canonicalization yok.
- RSA/HMAC-SHA512/provider managed algoritmalar yok.
- Replay timestamp/nonce guard yok.
- Domain processing yok.
- Worker/queue yok.
- Reconciliation yok.
- Rate limit yok.

## Nihai Karar

**PASS WITH LIMITATION**

---

# 17. HARDENING-10B2C — Replay / Idempotency Guard Foundation

## Amaç

10B2A/B hattına domain processing öncesi replay/idempotency guard foundation eklemek.

## Değişen Dosyalar

- `apps/bff/src/server/provider-callback.ts`
- `tests/smoke/suites/provider-callback-replay-guard.ts`
- `tests/smoke/suites/provider-callback-ingestion.ts`
- `tests/smoke/suites/provider-callback-signature-guard.ts`
- `tests/smoke/run-smoke.ts`
- `package.json`
- `HARDENING-10B2C-PROVIDER-CALLBACK-REPLAY-IDEMPOTENCY-GUARD-CLOSURE-REPORT.md`

## Replay / Idempotency Davranışı

Handler kimliği şu alanlardan çözer:

- `providerEventId` / `eventId` / `id`
- `x-provider-event-id`
- `idempotencyKey`
- `idempotency-key`
- `x-idempotency-key`

İlk callback:

- Mevcut kayıt yoksa insert.
- Kimlik varsa `replayStatus=first_seen`.
- Kimlik yoksa `replayStatus=unknown`.
- `replayDetected=false`.

Duplicate callback:

- Insert yapılmaz.
- Existing record overwrite edilmez.
- HTTP `202`.
- `data.id` existing id.
- `processingStatus=duplicate`.
- `originalProcessingStatus` existing status.
- `replayStatus=duplicate_event`.
- `replayDetected=true`.

## Identity Conflict

providerEventId ve idempotencyKey farklı kayıtlara işaret ederse:

- Yeni kayıt insert edilmez.
- Existing overwrite edilmez.
- HTTP `202`.
- `processingStatus=rejected`.
- `replayStatus=replay_detected`.
- `errorCode=CALLBACK_IDENTITY_CONFLICT`.

## Signature + Replay Etkileşimi

- Duplicate callback existing record’u overwrite etmez.
- Existing valid event üzerine invalid duplicate gelirse verified kayıt korunur.
- Yeni invalid callback duplicate değilse rejected olarak insert edilir.

## Smoke Senaryoları

- First seen.
- Duplicate providerEventId.
- Duplicate idempotencyKey.
- Duplicate overwrite yok.
- Invalid signature first seen.
- Existing valid üzerine invalid duplicate.
- Identity conflict safe rejection.
- Boundary false.
- Domain mutation yok.

## Çalıştırılan Komutlar

- İlk BFF build duplicate local repository değişkeni nedeniyle FAIL; düzeltme sonrası PASS.
- `pnpm run typecheck` — PASS
- `pnpm run build` — PASS
- BFF 3011 — PASS
- `/health` — PASS
- Ingestion/signature/replay/postgres/boundary/foundation smoke’ları — PASS

## Boundary Sonucu

Endpoint ingestion + persistence + signature + replay/idempotency guard sınırıdır. Duplicate callback domain command üretmez.

## Kalan Limitler

- Provider-specific replay window yok.
- Timestamp/nonce freshness guard yok.
- Real provider secret/env yok.
- Provider-specific mapping yok.
- Worker/queue yok.
- Domain processing yok.
- Reconciliation yok.
- Rate limit yok.
- Identity conflict audit/risk event’e bağlı değil.
- Persistence error alanı güncellenmiyor.

## Nihai Karar

**PASS WITH LIMITATION**

---

# 18. HARDENING-10B2D — Timestamp / Nonce Freshness Guard Foundation

## Amaç

10B2A/B/C hattına domain processing öncesi timestamp/nonce freshness guard foundation eklemek.

## Değişen Dosyalar

- `apps/bff/src/server/provider-callback.ts`
- `tests/smoke/suites/provider-callback-freshness-guard.ts`
- `tests/smoke/run-smoke.ts`
- `package.json`
- `HARDENING-10B2D-PROVIDER-CALLBACK-TIMESTAMP-NONCE-FRESHNESS-GUARD-CLOSURE-REPORT.md`

## Freshness Davranışı

Headerlar:

- `x-provider-timestamp`
- `x-provider-nonce`

Timestamp yoksa production blocker davranmaz. Mevcut signature/replay kararı korunur.

Timestamp invalid/old/future ise:

- Duplicate değilse insert edilir.
- `processingStatus=rejected`
- `replayStatus=replay_detected`
- `replayDetected=true`

Valid timestamp ise mevcut davranış korunur.

## Window Kararı

- Freshness window: 5 dakika.
- Future tolerance: 60 saniye.
- ISO timestamp kabul edilir.
- Numeric epoch seconds/ms parse edilir.
- Safe integer olmayan numeric timestamp invalid.

## Nonce Kararı

- Nonce okunur.
- Yoksa rejected yapılmaz.
- Nonce reuse tracking yapılmaz.
- Nonce cache/store eklenmedi.

## Duplicate Precedence

Duplicate callback timestamp ile existing record overwrite etmez.

## Smoke Senaryoları

- Current timestamp accepted.
- Missing timestamp mevcut behavior.
- Old timestamp rejected/replay_detected.
- Future timestamp rejected/replay_detected.
- Invalid timestamp rejected/replay_detected.
- Existing valid üzerine old duplicate overwrite yok.
- Identity conflict korunur.
- Boundary false.

## Çalıştırılan Komutlar

- `pnpm --filter @hx/bff run build` — PASS
- `pnpm run typecheck` — PASS
- `pnpm run build` — PASS
- BFF 3012 — PASS
- `/health` — PASS
- Ingestion/signature/replay/freshness/postgres/boundary/foundation smoke’ları — PASS

## Boundary Sonucu

Endpoint ingestion + persistence + signature + replay/idempotency + timestamp freshness guard foundation sınırıdır. Old/future/invalid timestamp domain command üretmez.

## Kalan Limitler

- Provider-specific replay window yok.
- Nonce reuse cache yok.
- Real provider secret/env yok.
- Provider-specific mapping yok.
- Worker/queue yok.
- Domain processing yok.
- Reconciliation yok.
- Rate limit yok.
- Freshness anomaly audit/risk event’e bağlı değil.
- FreshnessStatus persistence alanı yok.

## Nihai Karar

**PASS WITH LIMITATION**

---

# 19. HARDENING-10B2E — Public Webhook Rate Limit / Abuse Guard Foundation

## Amaç

10B2A/B/C/D hattına public webhook rate limit / abuse guard foundation eklemek.

## Değişen Dosyalar

- `apps/bff/src/server/provider-callback.ts`
- `tests/smoke/suites/provider-callback-rate-limit-guard.ts`
- `tests/smoke/run-smoke.ts`
- `package.json`
- `HARDENING-10B2E-PROVIDER-CALLBACK-PUBLIC-WEBHOOK-RATE-LIMIT-ABUSE-GUARD-CLOSURE-REPORT.md`

## Rate / Abuse Guard Davranışı

Process-local in-memory rate guard eklendi.

Bucket key:

- providerDomain
- providerName
- client identifier

Client identifier sırası:

- `x-forwarded-for` ilk IP
- `x-real-ip`
- `unknown`

Guard sırası:

1. providerDomain validation
2. providerName validation
3. rate limit
4. callback identity
5. signature
6. replay lookup
7. freshness
8. persistence insert

Rate limited istekler signature/replay/freshness/persistence öncesi döner.

## Limit Constants

- Window: 60 saniye
- Max: 20 istek
- Block: 60 saniye

21. istek rate limited olur.

## Response

Rate limited response:

- HTTP `429`
- error envelope
- `code=PROVIDER_CALLBACK_RATE_LIMITED`
- `category=transport`
- data/id yok

## Persistence Bypass

Rate limited isteklerde:

- rawPayload persist edilmez.
- insert yapılmaz.
- providerEventId lookup boş kalır.
- Domain mutation yok.

## Smoke Senaryoları

- İlk 20 istek 202.
- 21. istek 429.
- 429 envelope doğru.
- 429 data/id içermez.
- Rate limited providerEventId DB’de yok.
- Farklı providerName isolated.
- Farklı IP isolated.
- Boundary false.

## Çalıştırılan Komutlar

- `pnpm --filter @hx/bff run build` — PASS
- `pnpm run typecheck` — PASS
- `pnpm run build` — PASS
- BFF 3013 — PASS
- `/health` — PASS
- İlk rate-limit smoke Postgres kapalı olduğu için FAIL; Docker/Postgres başlatıldıktan sonra PASS.
- Ingestion/signature/replay/freshness/postgres/boundary/foundation smoke’ları — PASS

## Boundary Sonucu

Endpoint ingestion + persistence + signature + replay/idempotency + freshness + process-local rate guard foundation sınırıdır.

## Kalan Limitler

- Process-local in-memory guard.
- Distributed/Redis/API gateway/WAF yok.
- Provider-specific limit config yok.
- Remote IP güveni proxy ayarlarına bağlı.
- Rate limited attempt audit/risk event’e bağlı değil.
- Domain processing yok.
- Worker/queue yok.
- Reconciliation yok.

## Nihai Karar

**PASS WITH LIMITATION**

---

# 20. HARDENING-10B2F — Common Provider Callback Ingestion Security Boundary Final Closure

## Genel Durum

10B2 hattı, 10A/10B1 ile kurulan callback contract + persistence temelinin üzerine public webhook’dan gelen payment, shipment, notification ve payout callback sinyallerini ortak güvenli BFF ingestion boundary içinde karşılamak için açıldı.

10B2A-E ile tamamlanan foundation katmanları:

- Common BFF endpoint.
- Persistence ingestion boundary.
- Signature guard foundation.
- Replay/idempotency guard.
- Timestamp freshness guard.
- Process-local rate/abuse guard.

## Paket Özeti

- 10B2A: Common BFF ingestion — PASS WITH LIMITATION.
- 10B2B: Signature guard — PASS WITH LIMITATION.
- 10B2C: Replay/idempotency guard — PASS WITH LIMITATION.
- 10B2D: Timestamp freshness guard — PASS WITH LIMITATION.
- 10B2E: Rate limit/abuse guard — PASS WITH LIMITATION.

## Mevcut Capability

- BFF endpoint var.
- Persistence var.
- Duplicate/idempotency guard var.
- Signature guard var.
- Freshness guard var.
- Rate/abuse guard var.
- Boundary flags false.
- Response rawPayload sızdırmıyor.
- Domain mutation yok.
- Owner command yok.
- Event/outbox/audit mutation yok.

## Boundary Değişmezleri

- Provider callback business truth değildir.
- Callback record owner state mutation değildir.
- BFF truth owner değildir.
- Provider callback domain truth’u doğrudan mutate edemez.
- Duplicate/replay callback domain command üretmez.
- Invalid signature domain command üretmez.
- Old/future/invalid timestamp domain command üretmez.
- Rate limited request persistence’a bile yazılmaz.
- Event/outbox/audit business mutation yerine geçmez.
- Domain effect yalnız owner command/event zinciriyle olabilir.

## Smoke Coverage

- `smoke:provider-callback-postgres`
- `smoke:provider-callback-ingestion`
- `smoke:provider-callback-signature-guard`
- `smoke:provider-callback-replay-guard`
- `smoke:provider-callback-freshness-guard`
- `smoke:provider-callback-rate-limit-guard`
- `smoke:provider-boundary`
- `smoke:provider-callback-foundation`

Bu final closure için yeni build/typecheck/smoke çalıştırılmadı; önceki closure kanıtları referans alındı.

## Kalan Limitler

- Real provider secret/env yok.
- Provider-specific canonicalization yok.
- Provider-specific mapping yok.
- Nonce reuse cache yok.
- Distributed/Redis/API gateway/WAF yok.
- Audit/risk anomaly linkage yok.
- Worker/queue yok.
- Reconciliation yok.
- Domain processing yok.
- Provider-specific replay window yok.

## Domain Processing Readiness Gate

Tamamlananlar:

- Ortak ingestion endpoint.
- Persistence duplicate/idempotency behavior.
- Signature guard foundation.
- Replay/idempotency guard.
- Timestamp freshness guard.
- Rate/abuse guard foundation.
- Boundary smoke.
- Domain mutation yok.

Eksik / sonraki gereksinim:

- Provider-specific mapping inventory.
- Gerçek provider secret/config tasarımı.

Net karar:

**Domain processing’e doğrudan geçilmemelidir. Önce provider-specific mapping inventory gerekir.**

## Sonraki Paket Kararı

Önerilen paket:

**HARDENING-10C0 — Provider-Specific Callback Mapping Inventory / Payment First Candidate**

## Nihai Karar

**COMMON CALLBACK SECURITY BOUNDARY CLOSED / PROVIDER-SPECIFIC MAPPING INVENTORY REQUIRED**

---

# 21. HARDENING-10C0 — Provider-Specific Callback Mapping Inventory / Payment First Candidate

## Genel Durum

10B2 hattı ortak provider callback security boundary foundation’ını tamamladı. Ancak payment callback processing başlamadı.

Eksikler:

- Provider event type mapping.
- Gerçek provider canonicalization.
- Secret/config modeli.
- Payment owner handoff.
- Worker/queue.
- Reconciliation runtime.

## Mevcut Payment Repo Gerçekliği

- Payment initiate flow var.
- BFF payment route checkout ownership guard sonrası `initiatePayment` çağırır.
- Payment service checkout’u okur, internal simulation adapter ile provider initiate yapar.
- Payment callback processing yok.
- Provider adapter outbound’dur.
- Payment repository `paymentId`, `paymentAttemptId`, `idempotencyKey` lookup sağlar.
- Payment state: `CREATED`, `INITIATED`, `FAILED`, `CANCELLED`, `SUCCEEDED`.
- Attempt state: `CREATED`, `PROVIDER_REDIRECT_READY`, `INITIATION_FAILED`, `SUCCEEDED`.
- Explicit `PENDING`, `UNKNOWN_RESULT`, `EXPIRED` attempt state yoktur.
- Order creation payment success dışında çalışmaz.

## Provider Adayı

| Provider | Karar |
|---|---|
| PayTR | Birincil aday |
| iyzico | Secondary-ready |

Net karar:

**İlk payment callback mapping adayı PayTR olmalıdır.**

## Payment Callback Mapping İlkeleri

- Provider callback business truth değildir.
- Provider callback yalnız payment owner transition adayıdır.
- Payment callback order, settlement, finance correction veya risk truth mutate etmez.
- BFF truth owner değildir.
- Mapping layer owner command üretmez; normalized candidate üretir.
- Owner command yalnız worker/payment owner hattında değerlendirilmelidir.

## Generic PSP Status Mapping

- succeeded/captured/paid -> `succeeded`
- failed -> `failed`
- pending -> `pending`
- cancelled -> `cancelled`
- expired/timeout -> `expired`
- unknown_result -> `unknown_result`
- duplicate/replay -> `duplicate`
- signature_failed -> `signature_failed`
- unsupported -> `unsupported`
- amount mismatch -> `rejected_amount_mismatch`
- currency mismatch -> `rejected_currency_mismatch`
- provider reference missing -> `rejected_reference_missing`
- payment attempt not found -> `payment_attempt_not_found`

## Normalized Payment Callback Candidate Modeli

Önerilen alanlar:

- providerDomain
- providerName
- providerMode
- callbackRecordId
- providerEventId
- providerReference
- idempotencyKey
- callbackType
- normalizedStatus
- paymentAttemptId candidate
- paymentId candidate
- checkoutId candidate
- amount candidate
- currency candidate
- occurredAt
- verificationStatus
- replayStatus
- freshness/replay decision summary
- riskFlags
- ownerCommandCandidate
- shouldProcess
- shouldReconcile
- shouldReject
- rejectionReason

10C0’da contract’a eklenmemeli; 10C1 kapsamına alınmalıdır.

## Canonicalization Strategy

10B2B’deki `JSON.stringify` + HMAC SHA-256 production için yeterli değildir.

PayTR gerçek canonical payload bilinmeden implementation yapılmamalıdır. Provider-specific canonicalization BFF handler içine gömülmemelidir.

## Identity / Idempotency Kararı

Owner command idempotency için öneri:

`payment-callback:{providerName}:{paymentAttemptId}:{normalizedStatus}:{providerReference || providerEventId}`

PaymentAttemptId yoksa owner command üretilmemeli; reconciliation/manual match adayı yapılmalıdır.

## Payment Owner Handoff

- Mapping layer state mutate etmez.
- Mapping layer payment service çağırmaz.
- BFF payment state mutate etmez.
- Worker/queue olmadan owner handoff yapılmamalıdır.

## Order / Finance / Risk / Analytics Boundary

- Order creation 10C0 kapsamı dışındadır.
- Payment callback settlement/hakediş yaratmaz.
- Risk event 10C0’da üretilmez; risk candidate matrix çıkarılır.
- Analytics sinyal olabilir; payment truth değildir.

## 10C Roadmap

- 10C1: Normalized Payment Callback Candidate Contract/Helper.
- 10C2: PayTR Callback Mapping Foundation Smoke.
- 10C3: Async Callback Processing Worker Foundation.
- 10C4: Payment Owner Command Candidate Processing.
- 10C5: Payment Captured to Order Handoff Boundary.
- 10C6: Reconciliation and Anomaly Linkage.

## Domain Processing Readiness

Payment domain processing’e hemen geçilemez. İlk implementation:

**HARDENING-10C1 — Normalized Payment Callback Candidate Contract/Helper**

## Nihai Karar

**PAYMENT PROVIDER MAPPING INVENTORY COMPLETE / IMPLEMENTATION REQUIRED**

---

# 22. HARDENING-10C1 — Normalized Payment Callback Candidate Contract/Helper

## Kapsam

10C0 inventory kararındaki normalized payment callback candidate modeli generic contract/helper seviyesinde kodlandı.

Bu paket şunları yapmadı:

- Provider-specific PayTR mapping.
- Payment state mutation.
- Order handoff.
- Finance/risk mutation.
- Worker/queue/reconciliation.
- BFF route behavior değişikliği.

## Eklenen Contract

`packages/contracts/src/payment.ts` içine eklendi:

- `NormalizedPaymentCallbackStatus`
- `PaymentCallbackOwnerCommandCandidate`
- `NormalizedPaymentCallbackCandidate`
- `PaymentCallbackCandidateDecisionInput`
- `PaymentCallbackCandidateDecision`

## Eklenen Helper

- `decidePaymentCallbackCandidate`
- `createNormalizedPaymentCallbackCandidate`

Boundary flag’leri `createProviderBoundaryFlags()` ile false tutulur.

## Karar Özeti

Process adayları:

- `succeeded`
- `failed`
- `pending`
- `cancelled`
- `expired`

Reject/no-op adayları:

- `duplicate`
- `signature_failed`
- `unsupported`
- mismatch/reference/not-found/replay/freshness reject durumları

Reconciliation adayları:

- `pending`
- `expired`
- `unknown_result`
- `unsupported`
- mismatch/reference/identity/not-found durumları

`paymentAttemptId` yoksa owner command candidate üretilmez.

## Smoke Coverage

Yeni suite:

- `tests/smoke/suites/payment-callback-candidate.ts`

Yeni script:

- `pnpm run smoke:payment-callback-candidate`

Kapsam:

- succeeded process.
- failed process.
- pending process + reconcile.
- duplicate reject/no-op.
- signature_failed reject/no-op.
- amount mismatch reject + reconcile.
- unknown_result without paymentAttemptId no command + reconcile.
- boundary false.
- pure decision helper behavior.

## Verification

- `pnpm --filter @hx/contracts run typecheck` — PASS
- `pnpm run smoke:payment-callback-candidate` — PASS

## Dokunulmayan Alanlar

- BFF provider callback handler.
- Payment service.
- provider secret/env/config.
- worker/queue.
- reconciliation.
- order handoff.
- finance/risk.
- migration/persistence.

## Nihai Karar

**HARDENING-10C1 COMPLETE**

Domain processing hâlâ başlamadı.

---

# 23. HARDENING-10C1-R — Verification Completion

## Kapsam

Yalnız 10C1 verification completion sonucu kaydedildi.

Kod değişikliği yok.

## Çalıştırılan Komutlar

- `pnpm --filter @hx/contracts run build` — PASS
- `pnpm run typecheck` — PASS
- `pnpm run build` — PASS
- `pnpm run smoke:provider-boundary` — PASS
- `pnpm run smoke:payment-callback-candidate` — PASS

## Smoke Özeti

- `[PASS] P51 Provider Boundary Contract`
- `[PASS] payment-callback-candidate - Normalized payment callback candidate helper keeps processing decisions pure and boundary flags false.`

## Nihai Karar

**HARDENING-10C1 — PASS**

---

# 24. HARDENING-10C2 — PayTR Callback Mapping Foundation Smoke

## Amaç

PayTR iFrame API callback payload’unu generic `NormalizedPaymentCallbackCandidate` modeline map eden saf contract/helper foundation eklemek.

Bu paket:

- Payment state mutation değildir.
- Order handoff değildir.
- Worker/queue/reconciliation değildir.
- Live PayTR config/secret değildir.

## PayTR Dokümanından Sabitlenen Kurallar

- Bildirim URL’ye POST edilen alanlar:
  - `merchant_oid`
  - `status`
  - `total_amount`
  - `hash`
  - `failed_reason_code`
  - `failed_reason_msg`
  - `test_mode`
  - `payment_type`
  - `currency`
  - `payment_amount`
- Bildirim URL müşteri sayfası değildir.
- İşlem `merchant_oid` ile bulunmalıdır.
- Tekrarlayan bildirimler `merchant_oid` temelinde duplicate-safe olmalıdır.
- PayTR response düz metin yalnız `OK` olmalıdır.
- Hash canonicalization:
  - `base64(hmac_sha256(merchant_oid + merchant_salt + status + total_amount, merchant_key))`
- `merchant_ok_url` sipariş onay yeri değildir.
- `total_amount` ve `payment_amount` 100 ile çarpılmış integer tutardır.
- `total_amount`, taksit/vade farkı nedeniyle `payment_amount` değerinden yüksek olabilir.

## Değişen Dosyalar

- `packages/contracts/src/payment.ts`
- `tests/smoke/suites/paytr-callback-mapping.ts`
- `tests/smoke/run-smoke.ts`
- `package.json`
- `HARDENING-10C2-PAYTR-CALLBACK-MAPPING-FOUNDATION-SMOKE-CLOSURE-REPORT.md`

## Eklenen Model / Helper

- `PaytrIframeCallbackPayload`
- `PaytrCallbackMappingResult`
- `createPaytrCallbackHash`
- `verifyPaytrCallbackHash`
- `mapPaytrIframeCallbackToPaymentCandidate`

## Status Mapping

- `success` + verified hash -> `succeeded`
- `failed` + verified hash -> `failed`
- bad hash -> `signature_failed`
- missing `merchant_oid` -> `rejected_reference_missing`
- unsupported status -> `unsupported`
- amount mismatch -> `rejected_amount_mismatch`
- currency mismatch -> `rejected_currency_mismatch`

## Amount / Currency Normalization

- expectedAmount platform minor unit.
- PayTR `payment_amount` varsa önce onunla match.
- Yoksa `total_amount`.
- `total_amount > payment_amount` tek başına mismatch değil.
- `TL` ve `TRY` platform `TRY`.
- `USD`, `EUR`, `GBP`, `RUB` korunur.

## Smoke Senaryoları

- valid success.
- valid failed.
- bad hash.
- missing merchant_oid.
- unsupported status.
- amount mismatch.
- TL -> TRY.
- currency mismatch.
- total_amount > payment_amount.
- success without paymentAttemptId.
- boundary false.

## Çalıştırılan Komutlar

- `pnpm --filter @hx/contracts run build` — PASS
- `pnpm run typecheck` — PASS
- `pnpm run build` — PASS
- `pnpm run smoke:payment-callback-candidate` — PASS
- `pnpm run smoke:paytr-callback-mapping` — PASS
- `pnpm run smoke:provider-boundary` — PASS

## Kalan Limitler

- Gerçek merchant key/salt/env yok.
- PayTR live config yok.
- BFF handler PayTR mapping’e bağlanmadı.
- Payment owner transition yok.
- Worker/queue yok.
- Reconciliation yok.
- Order handoff yok.
- Finance/risk mutation yok.
- PayTR status inquiry yok.
- Real test callback E2E yok.

## Nihai Karar

**PASS WITH LIMITATION**

---

# 25. HARDENING-10C3 — Payment Provider Callback Response Policy Bridge

## Amaç

Ortak provider callback route üzerinde provider-specific ACK response policy bridge kurmak.

Hedef:

- PayTR için başarılı ingestion sonrası düz metin `OK` döndürmek.

Bu paket:

- Domain processing değildir.
- Live PayTR config değildir.
- Worker/queue değildir.
- Payment owner transition değildir.
- iyzico implementation değildir.

## Mimari Karar

Tek route korundu:

`POST /provider-callback/payment/:providerName`

PayTR farkı route seviyesinde değil ACK policy seviyesinde tutuldu.

## PayTR OK Response Policy

`providerDomain=payment`, `providerName=paytr` ve handler 2xx ürettiğinde:

- HTTP 200
- Content-Type: text/plain
- Body: `OK`

JSON envelope dönmez. Raw payload sızmaz.

## Hash Failed / Unsupported Durumunda OK Kararı

Bu pakette live key/salt/env yoktu. Generic ingestion record persist edildiyse PayTR’ye `OK` dönebilir.

Gerekçe:

- Retry storm engelleme.
- Domain processing yok.
- Callback record saklanıyor.

## Rate Limit Durumu

Rate limit persistence öncesinde çalışır. Rate-limited request ingestion’a alınmaz; PayTR policy uygulanmaz.

Response:

- HTTP 429
- JSON error envelope

## Değişen Dosyalar

- `apps/bff/src/server/provider-callback.ts`
- `apps/bff/src/server/index.ts`
- `tests/smoke/suites/paytr-callback-bff-policy.ts`
- `tests/smoke/run-smoke.ts`
- `package.json`
- `HARDENING-10C3-PAYMENT-PROVIDER-CALLBACK-RESPONSE-POLICY-BRIDGE-CLOSURE-REPORT.md`

## Teknik Değişiklikler

- `ProviderCallbackAckPolicy` tipi.
- PayTR için `plain_text` ACK policy resolver.
- `sendBffResponse` optional plain_text ACK destekleyecek şekilde genişletildi.
- PayTR callback duplicate identity için `merchant_oid` bridge edildi.
- PayTR mapping helper live BFF path’e bağlanmadı.

## Smoke Senaryoları

- PayTR callback accepted ACK: HTTP 200 text/plain OK.
- JSON envelope değil, raw payload sızdırmıyor.
- PayTR callback merchant_oid ile persist ediliyor.
- Duplicate merchant_oid idempotent ve OK.
- Rate limited PayTR request OK dönmüyor, 429 JSON.
- Non-PayTR JSON envelope davranışı korunuyor.
- `/health` JSON kalıyor.
- Boundary false.

## Çalıştırılan Komutlar

- BFF build/typecheck/build — PASS
- BFF start — PASS
- `/health` — PASS
- `smoke:paytr-callback-bff-policy` — PASS
- provider callback regression smoke setleri — PASS
- paytr mapping / payment candidate / provider boundary — PASS

Freshness smoke ilk denemede process-local rate limit bucket nedeniyle 429 aldı; temiz BFF restart sonrası PASS oldu.

## Kalan Limitler

- Real merchant key/salt/env yok.
- PayTR mapping live path’e bağlı değil.
- Payment owner transition yok.
- Worker/queue yok.
- Reconciliation yok.
- Order handoff yok.
- Finance/risk mutation yok.
- iyzico mapping yok.
- Real PayTR E2E yok.

## Nihai Karar

**PASS WITH LIMITATION**

---

# 26. HARDENING-10C4 — Payment Provider Config / Secret Resolution Foundation

## Amaç

PayTR primary ve iyzico secondary-ready ödeme sağlayıcı mimarisine uygun typed config/secret resolution foundation kurmak.

Bu paket:

- Live payment integration değildir.
- PayTR initiate/callback live path değildir.
- Payment owner state mutation değildir.
- Worker/queue/reconciliation değildir.

## Değişen Dosyalar

- `services/payment/src/provider-config.ts`
- `services/payment/src/provider-adapter.ts`
- `services/payment/src/index.ts`
- `tests/smoke/suites/payment-provider-config.ts`
- `tests/smoke/run-smoke.ts`
- `package.json`
- `.env.example`
- `HARDENING-10C4-PAYMENT-PROVIDER-CONFIG-SECRET-RESOLUTION-FOUNDATION-CLOSURE-REPORT.md`

## Env Key İsimleri

- `PAYMENT_PROVIDER_NAME`
- `PAYMENT_PROVIDER_MODE`
- `PAYTR_PROVIDER_MODE`
- `IYZICO_PROVIDER_MODE`
- `PAYTR_MERCHANT_ID`
- `PAYTR_MERCHANT_KEY`
- `PAYTR_MERCHANT_SALT`
- `IYZICO_API_KEY`
- `IYZICO_SECRET_KEY`

`.env.example` içine yalnız boş/placeholder key isimleri eklendi.

## PayTR Config Kararı

Resolver şunları üretir:

- merchantIdConfigured
- merchantKeyConfigured
- merchantSaltConfigured
- callback path: `/provider-callback/payment/paytr`

Eksik config durumunda resolution `not_configured`.

## iyzico Secondary-Ready Kararı

- apiKeyConfigured
- secretKeyConfigured
- callback path: `/provider-callback/payment/iyzico`

Implementation eklenmedi; secondary-ready shape.

## Unsupported Provider / Mode

Unsupported provider sessiz simulation fallback yapmaz. Resolution error üretir.

Unsupported mode `UNSUPPORTED_PAYMENT_PROVIDER_MODE` üretir.

## NotConfigured Adapter Kararı

`getPaymentProviderAdapter()` config resolver’a bağlandı.

- `internal_simulation` mevcut davranışı korur.
- `paytr` veya `iyzico` active ise live network çağrısı yapılmaz.
- ProviderResultEnvelope rejected döner.
- Boundary flags false.

## Secret Redaction

`sanitizePaymentProviderConfig(config)` secret değerleri döndürmez; yalnız configured boolean ve mode/callback/error/warning bilgisi taşır.

## Smoke Senaryoları

- Default internal simulation.
- PayTR sandbox fully configured.
- PayTR missing key error.
- Unsupported provider.
- Unsupported mode.
- iyzico missing config shape.
- Secret redaction.
- Adapter internal simulation regression.
- Adapter PayTR not implemented / not configured envelope.

## Çalıştırılan Komutlar

- `pnpm --filter @hx/payment run build` — PASS
- `pnpm run typecheck` — PASS
- `pnpm run build` — PASS
- `smoke:payment-provider-config` — PASS
- `smoke:paytr-callback-mapping` — PASS
- `smoke:payment-callback-candidate` — PASS
- `smoke:provider-boundary` — PASS
- BFF start / health — PASS
- `smoke:payment-provider-boundary` — PASS

## Kalan Limitler

- PayTR live initiate yok.
- PayTR callback mapping live path’e bağlı değil.
- Real secret manager yok; yalnız env foundation.
- iyzico implementation yok.
- Payment owner state transition yok.
- Worker/queue yok.
- Reconciliation yok.
- Order handoff yok.
- Finance/risk mutation yok.
- Real PayTR E2E yok.

## Nihai Karar

**PASS WITH LIMITATION**

---

# 27. HARDENING-10C5 — PayTR Callback Mapping Live BFF Path

## Amaç

PayTR callback live BFF ingestion path içinde PayTR payload’unu payment provider config resolver ve PayTR mapping helper üzerinden `NormalizedPaymentCallbackCandidate` modeline map etmek ve `provider_callback_events.normalizedPayload` alanına yazmak.

Bu paket:

- Payment owner state mutation değildir.
- Order handoff değildir.
- Worker/queue/reconciliation değildir.
- Live PayTR initiate değildir.
- Real PayTR E2E değildir.

## Değişen Dosyalar

- `apps/bff/src/server/provider-callback.ts`
- `tests/smoke/suites/paytr-callback-live-bff-mapping.ts`
- `tests/smoke/suites/paytr-callback-bff-policy.ts`
- `tests/smoke/run-smoke.ts`
- `package.json`
- `HARDENING-10C5-PAYTR-CALLBACK-MAPPING-LIVE-BFF-PATH-CLOSURE-REPORT.md`

## Config Resolver Kullanımı

`buildNormalizedPayloadForProviderCallback(input)` helper eklendi.

Yalnız `providerDomain=payment`, `providerName=paytr` için çalışır.

Config usable değilse mapping helper çağrılmaz ve normalizedPayload diagnostic object olarak yazılır:

- `type=paytr_callback_mapping_not_configured`
- reason: `PAYTR_CONFIG_NOT_USABLE_FOR_CALLBACK_VERIFICATION`
- boundary false

## Mapping NormalizedPayload

Config usable olduğunda:

`mapPaytrIframeCallbackToPaymentCandidate` çağrılır.

Input:

- payload
- callbackRecordId: `pending_insert`
- providerName: `paytr`
- providerMode
- merchantKey
- merchantSalt
- occurredAt

Mapping sonucu `ProviderCallbackRecord.normalizedPayload` alanına yazılır.

## CallbackRecordId Placeholder

Repository insert öncesi record id bilinmediği için candidate içindeki `callbackRecordId` değeri `pending_insert`.

İleride iki aşamalı insert/update ile düzeltilebilir.

## Verification Status Ayrımı

- `ProviderCallbackRecord.verificationStatus`: generic callback signature guard status.
- `normalizedPayload.candidate.verificationStatus`: PayTR hash verification sonucu.
- `hashVerified`: PayTR hash sonucu.

Generic signature guard PayTR hash verification ile henüz birleşmedi.

## Duplicate Overwrite Kararı

PayTR `merchant_oid` providerEventId olarak korunur. Duplicate callback existing record’u döndürür; normalizedPayload overwrite edilmez.

## Smoke Senaryoları

- Valid PayTR callback: 200 OK, raw payload persisted, normalized payload persisted, status succeeded, hashVerified true.
- Bad hash: signature_failed, shouldProcess false, shouldReject true, PAYTR_HASH_FAILED risk flag.
- Duplicate PayTR callback: same record, no overwrite.
- Non-PayTR regression: iyzico JSON 202, normalizedPayload yok.

Dummy env:

- `PAYMENT_PROVIDER_NAME=paytr`
- `PAYMENT_PROVIDER_MODE=sandbox`
- `PAYTR_PROVIDER_MODE=sandbox`
- `PAYTR_MERCHANT_ID=test-merchant`
- `PAYTR_MERCHANT_KEY=test-key`
- `PAYTR_MERCHANT_SALT=test-salt`

## Çalıştırılan Komutlar

- BFF build/typecheck/build — PASS
- BFF dummy PayTR env ile start — PASS
- `/health` — PASS
- `smoke:paytr-callback-live-bff-mapping` — PASS
- `smoke:paytr-callback-bff-policy` — PASS
- `smoke:paytr-callback-mapping` — PASS
- `smoke:payment-provider-config` — PASS
- `smoke:provider-callback-ingestion` — PASS
- `smoke:provider-boundary` — PASS

## Kalan Limitler

- candidate.callbackRecordId placeholder.
- PaymentAttempt lookup yok.
- Expected amount/currency live lookup yok.
- Payment owner state transition yok.
- Worker/queue yok.
- Reconciliation yok.
- Order handoff yok.
- Finance/risk mutation yok.
- Generic signature guard PayTR hash verification ile birleşmedi.
- Real PayTR E2E yok.
- iyzico mapping yok.

## Nihai Karar

**PASS WITH LIMITATION**

---

# 28. HARDENING-10C6 — Payment Callback Processing Worker / Owner Command Handoff Inventory

## Genel Durum

10C5 ile PayTR callback live BFF ingestion path içinde normalizedPayload yazılmaya başladı. Ancak payment callback hâlâ payment truth değildir.

Bu inventory worker modeli, candidate processing, paymentAttempt lookup, merchant_oid stratejisi ve owner handoff kararlarını netleştirdi.

## Callback Record Gerçekliği

`provider_callback_events`:

- provider domain/name/mode
- callback type
- provider event id
- provider reference
- idempotency key
- correlation/causation/request id
- verification/replay/processing status
- rawPayload
- normalizedPayload
- error
- boundary
- received/processed timestamp

`rawPayload` ham kanıttır.  
`normalizedPayload` business truth değil, candidate modeldir.

## ProcessingStatus Anlamları

- `received`: ingestion başarılı, worker henüz işlemedi.
- `accepted`: worker/owner handoff kabul edilebilir.
- `duplicate`: ingestion response’ta duplicate; existing record overwrite edilmez.
- `rejected`: signature/freshness/replay problemi.
- `failed`: worker/processing hatası.
- `ignored`: valid ama owner command gerektirmeyen callback.

## Normalized Candidate Processing Kararı

Process edilebilir candidate:

- shouldProcess=true
- shouldReject=false
- signatureVerified=true
- replay rejected değil
- paymentAttemptId veya kesin lookup stratejisi mevcut
- status: succeeded/failed

Reject:

- signature_failed
- replay/freshness rejected
- identity conflict
- amount/currency mismatch
- reference missing
- verification failed

Reconciliation:

- pending
- unknown_result
- unsupported
- payment_attempt_not_found
- amount/currency mismatch
- lookup belirsizliği

## PaymentAttempt Lookup Kararı

PayTR callback `merchant_oid` taşır. Bu henüz otomatik paymentAttemptId değildir.

Karar:

- PayTR initiate tasarlanırken `merchant_oid`, payment attempt centric stable provider order id olmalıdır.
- Payment kaydında lookup edilebilir şekilde saklanmalıdır.
- PayTR live initiate yapılmadan gerçek paymentAttempt lookup tamamlanamaz.

## Owner Command Handoff

- Worker candidate’i okur.
- Lookup/reject/reconciliation kararını verir.
- Payment owner command oluşturur.
- Payment state transition’i payment service uygular.
- Worker doğrudan repository’de payment state mutate etmemelidir.

Önerilen idempotency key formatı:

`payment-callback:{providerDomain}:{providerName}:{providerEventId}:{paymentAttemptId}:{ownerCommandCandidate}`

Fallback:

`payment-callback:{providerDomain}:{providerName}:record:{callbackRecordId}:{ownerCommandCandidate}`

## Payment State Model Gap

Mevcut eksikler:

- Payment PENDING/PROCESSING yok.
- UNKNOWN_RESULT yok.
- Attempt FAILED yok.
- Attempt CANCELLED/EXPIRED yok.
- Callback processed marker payment aggregate içinde yok.
- Provider callback id / event id / owner command idempotency izi yok.

Net karar:

**10C7’de önce state model ve owner command contract foundation gerekir.**

## Worker/Polling Model Kararı

A) Synchronous BFF processing — önerilmez.  
B) DB polling worker — ilk implementation için önerilir.  
C) Outbox/event queue worker — uzun vadede, sonra.

## Processing Lifecycle

Önerilen:

- `received -> accepted`
- `received -> rejected`
- `received -> ignored`
- `received -> failed`
- `failed -> received/accepted` retry sonucu

Reconciliation status enum eksikliği not edildi.

## Payment Owner Transition Scope

- succeeded -> MarkPaymentSucceeded; order yok.
- failed -> MarkPaymentFailed; order yok.
- pending/unknown -> reconciliation.
- mismatch/not found/replay/freshness -> reject/reconcile/risk candidate.

## Order Boundary

Callback worker doğrudan order create çağırmamalıdır. Order ancak payment owner `SUCCEEDED` truth sonrası başlamalıdır.

Önerilen order idempotency key:

`order-from-payment:{paymentId}:{paymentAttemptId}`

## Finance / Risk / Reconciliation Boundary

- Payment callback settlement/hakediş yaratmaz.
- Amount/currency mismatch finance correction üretmez; önce payment/reconciliation.
- Risk candidate olabilir ama risk signal üretmez.
- Status inquiry pending/unknown/mismatch/not-found için gerekir.

## Roadmap

- 10C7: Payment Callback State Model / Owner Command Contract Foundation.
- 10C8: Worker Foundation / No Order Handoff.
- 10C9: Succeeded/Failed Owner Transition.
- 10C10: Reconciliation Candidate / Status Inquiry Inventory.
- 10C11: Payment Success Event / Order Handoff Boundary.
- 10C12: PayTR Real Test Callback E2E Sandbox Validation.

## Nihai Karar

**PAYMENT CALLBACK WORKER / OWNER HANDOFF INVENTORY COMPLETE / IMPLEMENTATION REQUIRED**

Sonraki paket:

**HARDENING-10C7 — Payment Callback State Model / Owner Command Contract Foundation**

---

# 29. HARDENING-10C7 — Payment Callback State Model / Owner Command Contract Foundation

## Amaç

10C6 inventory kararına göre payment callback owner command contract foundation kurmak. Payment/paymentAttempt state model gap’leri contract seviyesinde genişletildi, owner command decision/idempotency helper’ları saf model seviyesinde doğrulandı.

Bu paket:

- Worker runtime değildir.
- Payment state mutation implementation değildir.
- Order handoff değildir.
- Finance/risk mutation değildir.
- PayTR live initiate değildir.

## Değişen Dosyalar

- `packages/contracts/src/payment.ts`
- `tests/smoke/suites/payment-callback-owner-command.ts`
- `tests/smoke/run-smoke.ts`
- `package.json`
- `HARDENING-10C7-PAYMENT-CALLBACK-STATE-MODEL-OWNER-COMMAND-CONTRACT-CLOSURE-REPORT.md`

## State Model Genişletmesi

`PaymentState` eklendi:

- `PENDING`
- `UNKNOWN_RESULT`

`PaymentAttemptState` eklendi:

- `PENDING`
- `FAILED`
- `CANCELLED`
- `EXPIRED`
- `UNKNOWN_RESULT`

Bu yalnız contract modelidir.

## PaymentAttempt Provider Reference Alanları

Optional alanlar:

- `providerName`
- `providerReference`
- `providerEventId`
- `providerOrderId`
- `callbackRecordId`
- `lastCallbackAt`
- `lastCallbackStatus`

## Owner Command Contract

Eklenenler:

- `PaymentCallbackOwnerCommandType`
- `PaymentCallbackOwnerCommand`
- `PaymentCallbackOwnerCommandDecisionStatus`
- `PaymentCallbackOwnerCommandDecision`

Owner command source:

- `provider_callback_worker`

Boundary false kalır. Contract owner mutation yetkisi vermez.

## Idempotency Key Helper

`createPaymentCallbackOwnerCommandIdempotencyKey`

ProviderEventId varsa:

`payment-callback:payment:{providerName}:{providerEventId}:{paymentAttemptId}:{commandType}`

Yoksa callbackRecordId fallback:

`payment-callback:payment:{providerName}:record:{callbackRecordId}:{paymentAttemptId}:{commandType}`

## Decision Helper

`decidePaymentCallbackOwnerCommand`

Davranış:

- candidate rejected ise command yok.
- signatureVerified=false ise command yok.
- replayDetected=true ise command yok.
- succeeded için verificationStatus verified olmalı.
- pending/unknown_result reconciliation.
- paymentAttemptId yoksa command yok.
- ownerCommandCandidate NONE ise command yok.
- valid succeeded/failed için command + idempotency key + boundary false.

## PayTR Lookup Plan

`createPaytrPaymentCallbackLookupPlan`

- primary: provider_reference
- fallbacks: payment_attempt_id, idempotency_key, manual_reconciliation
- strategy: paytr_merchant_oid_as_provider_reference
- requiresInitiateContract: true
- boundary false

## Smoke Senaryoları

- succeeded + paymentAttemptId -> command_ready.
- failed + paymentAttemptId -> command_ready.
- pending -> reconciliation.
- unknown -> reconciliation.
- missing paymentAttemptId.
- signature failed.
- replay detected.
- unsupported verification with succeeded command_ready değil.
- providerEventId idempotency key.
- callbackRecordId fallback.
- PayTR lookup plan.
- State extension assertions.

## Çalıştırılan Komutlar

- `pnpm --filter @hx/contracts run build` — PASS
- `pnpm run typecheck` — PASS
- `pnpm run build` — PASS
- `pnpm run smoke:payment-callback-owner-command` — PASS
- `pnpm run smoke:payment-callback-candidate` — PASS
- `pnpm run smoke:paytr-callback-mapping` — PASS
- `pnpm run smoke:provider-boundary` — PASS

## Kalan Limitler

- Worker runtime yok.
- Payment owner mutation implementation yok.
- providerReference lookup yok.
- PayTR initiate merchant_oid contract yok.
- Order handoff yok.
- Finance/risk mutation yok.
- Reconciliation runtime yok.
- Real PayTR E2E yok.

## Nihai Karar

**PASS WITH LIMITATION**

---

# 30. HARDENING-10C8 — Payment Callback Processing Worker Foundation / No Order Handoff

## Amaç

Provider callback kayıtlarından payment domain’e ait `received` durumundaki normalized callback candidate kayıtlarını okuyacak dry-run worker foundation kurmak.

Worker yalnız callback record lifecycle `processingStatus` alanını günceller. Payment owner state mutation yapmaz.

## Değişen Dosyalar

- `services/payment/src/callback-worker.ts`
- `services/payment/src/index.ts`
- `tests/smoke/suites/payment-callback-worker-foundation.ts`
- `tests/smoke/run-smoke.ts`
- `package.json`
- `HARDENING-10C8-PAYMENT-CALLBACK-PROCESSING-WORKER-FOUNDATION-CLOSURE-REPORT.md`

## Worker Dry-Run Davranışı

`processPaymentCallbackRecordsDryRun` eklendi.

Davranış:

- repository verilirse onu kullanır, yoksa default repository.
- `listProviderCallbackEventsByProcessingStatus('received', limit ?? 50)` ile kayıt okur.
- providerDomain payment değilse skip.
- normalizedPayload.candidate parse/validate.
- `decidePaymentCallbackOwnerCommand` çağırır.
- decision summary üretir.
- owner command dispatch etmez.
- payment repository kullanmaz.
- order/finance/risk/audit/outbox mutation yapmaz.

Worker decision helper’a gerçek callback record id verir. Candidate içindeki `pending_insert` limitation dry-run kararında gerçek record id ile aşılır.

## Normalized Payload Validation

Beklenen shape:

- `candidate`
- `hashVerified`
- `paytrStatus`

Kontroller:

- normalizedPayload object.
- candidate object.
- providerDomain payment.
- providerName string.
- normalizedStatus string.
- boundary flags false.

Invalid payload -> record `failed`.

## Processing Status Mapping

- `command_ready` -> `accepted`
- `candidate_rejected` -> `rejected`
- `candidate_requires_reconciliation` -> `ignored`
- `missing_payment_attempt` -> `ignored`
- `candidate_not_processable` -> `ignored`
- invalid payload -> `failed`
- non-payment -> unchanged

## Reconciliation İçin Ignored Kararı

Mevcut enumda `reconciliation_required` yok. Bu nedenle pending/unknown/missing attempt gibi kayıtlar şimdilik `ignored` işaretlendi.

## Payment Repository Kullanılmama Gerekçesi

- providerReference/merchant_oid lookup yoktu.
- PaymentAttempt lookup owner transition paketi değildi.
- Paket dry-run foundation’dı.

## Smoke Senaryoları

- valid succeeded -> command_ready, accepted.
- providerEventId yokken fallback idempotency key gerçek callback id.
- bad hash/signature failed -> rejected.
- succeeded ama paymentAttemptId yok -> ignored/reconciliationRequired.
- pending -> ignored.
- invalid normalizedPayload -> failed.
- non-payment -> unchanged.
- limit=1.
- boundary false.

## Çalıştırılan Komutlar

- `pnpm --filter @hx/payment run build` — PASS
- `pnpm run typecheck` — PASS
- `pnpm run build` — PASS
- `pnpm run smoke:payment-callback-worker-foundation` — PASS
- `pnpm run smoke:payment-callback-owner-command` — PASS
- `pnpm run smoke:payment-callback-candidate` — PASS
- `pnpm run smoke:paytr-callback-mapping` — PASS
- `pnpm run smoke:provider-boundary` — PASS

## Kalan Limitler

- Atomic claim/lock yok.
- Multi-worker concurrency yok.
- Payment owner mutation yok.
- Payment repository lookup yok.
- providerReference/merchant_oid lookup yok.
- PaymentAttempt lookup yok.
- Reconciliation status enum yok.
- Reconciliation runtime yok.
- Order handoff yok.
- Finance/risk mutation yok.
- Audit/outbox owner event yok.
- Real PayTR E2E yok.

## Nihai Karar

**PASS WITH LIMITATION**

---

# 31. HARDENING-10C9-00 — Payment Provider Reference Lookup Foundation / No Owner Mutation

## Amaç

PayTR callback `merchant_oid` değerinin payment attempt/provider reference üzerinden payment kaydına çözümlenebilmesi için payment repository lookup foundation kurmak.

Bu paket:

- Payment owner state mutation değildir.
- Worker owner transition değildir.
- Order handoff değildir.
- Finance/risk mutation değildir.
- PayTR live initiate değildir.

## Değişen Dosyalar

- `services/payment/src/repository/interface.ts`
- `services/payment/src/repository/in-memory.ts`
- `services/payment/src/repository/postgres.ts`
- `tests/smoke/suites/payment-provider-reference-lookup.ts`
- `tests/smoke/run-smoke.ts`
- `package.json`
- `HARDENING-10C9-00-PAYMENT-PROVIDER-REFERENCE-LOOKUP-FOUNDATION-CLOSURE-REPORT.md`

## Repository Interface

Yeni metot:

`getByProviderReference(providerName, providerReference)`

## InMemory Davranışı

Primary match:

- `payment.attempt.providerName === providerName`
- `payment.attempt.providerReference === providerReference`

Fallback:

- `payment.attempt.providerName === providerName`
- `payment.attempt.providerEventId === providerReference`

## Postgres Davranışı

Mevcut `payments.data` JSON alanı kullanıldı.

Primary query:

- `data->'attempt'->>'providerName' = $1`
- `data->'attempt'->>'providerReference' = $2`

Fallback:

- `data->'attempt'->>'providerName' = $1`
- `data->'attempt'->>'providerEventId' = $2`

Parametrized query kullanıldı.

## Migration Eklenmeme Gerekçesi

Mevcut `payments.data` JSON alanı provider reference değerlerini taşıyabilecek durumdaydı. Bu paket yalnız lookup foundation olduğu için index/kolon/migration eklenmedi.

## Smoke Senaryoları

InMemory:

- providerName + providerReference match.
- wrong providerName undefined.
- wrong providerReference undefined.
- providerEventId fallback.
- getByPaymentAttemptId regression.
- saveWithIdempotency/getByIdempotencyKey regression.

Postgres branch env varsa çalışır; yoksa açık mesajla skip edilir.

## Çalıştırılan Komutlar

- `pnpm --filter @hx/payment run build` — PASS
- `pnpm run typecheck` — PASS
- `pnpm run build` — PASS
- `pnpm run smoke:payment-provider-reference-lookup` — PASS
- `pnpm run smoke:payment-callback-worker-foundation` — PASS
- `pnpm run smoke:payment-callback-owner-command` — PASS
- `pnpm run smoke:payment-callback-candidate` — PASS
- `pnpm run smoke:provider-boundary` — PASS

## Kalan Limitler

- providerReference unique constraint yok.
- LIMIT 1; duplicate providerReference deterministik owner truth garantisi vermez.
- initiatePayment PayTR merchant_oid yazmıyor.
- PayTR live initiate yok.
- Worker owner transition yok.
- Payment owner mutation yok.
- Reconciliation yok.
- Order handoff yok.
- Finance/risk mutation yok.
- Real PayTR E2E yok.

## Nihai Karar

**PASS WITH LIMITATION**

---

# 32. HARDENING-10C9-01 — Payment Initiation Provider Reference Persistence / No Callback Mutation

## Amaç

10C9-00 ile eklenen providerReference lookup foundation’ın gerçek payment initiation kayıtlarında çalışabilmesi için provider adapter sonucundaki provider metadata’yı `PaymentAttempt` içine yazmak.

Bu paket:

- Callback owner transition değildir.
- Callback worker mutation değildir.
- Order handoff değildir.
- Finance/risk mutation değildir.
- PayTR live initiate değildir.

## Değişen Dosyalar

- `services/payment/src/payment.ts`
- `tests/smoke/suites/payment-initiation-provider-reference.ts`
- `tests/smoke/run-smoke.ts`
- `package.json`
- `HARDENING-10C9-01-PAYMENT-INITIATION-PROVIDER-REFERENCE-PERSISTENCE-CLOSURE-REPORT.md`

## initiatePayment Provider Reference Persistence

Attempt içine yazılan alanlar:

- `providerSimulationRef: providerResult.providerReference`
- `providerName: providerResult.providerName`
- `providerReference: providerResult.providerReference`
- `providerEventId: providerResult.providerReference`

providerReference yoksa:

- providerName yazılır.
- providerReference/providerEventId yazılmaz.

Payment state:

- `INITIATED`

Attempt state:

- `PROVIDER_REDIRECT_READY`

## providerReference / providerEventId Kararı

İlk foundation’da providerEventId ve providerReference aynı provider reference değerini taşıyabilir.

PayTR live initiate sonraki paketlerde geldiğinde `merchant_oid` providerReference olacaktır.

## Smoke Sonucu

Yeni suite internal simulation adapter ile `initiatePayment` çalıştırır.

Assertionlar:

- providerEnvelope providerName internal_simulation.
- providerReference var.
- attempt.providerName internal_simulation.
- attempt.providerReference providerEnvelope.providerReference.
- attempt.providerEventId providerEnvelope.providerReference.
- providerSimulationRef korunur.
- state INITIATED.
- attempt PROVIDER_REDIRECT_READY.
- lastCallbackAt/lastCallbackStatus yazılmaz.

Repository lookup:

- `getByProviderReference` aynı paymentId döndürür.
- getByPaymentAttemptId regression.
- Aynı idempotencyKey ikinci initiate aynı response’u döndürür.

## Çalıştırılan Komutlar

- `pnpm --filter @hx/payment run build` — PASS
- `pnpm run typecheck` — PASS
- `pnpm run build` — PASS
- `pnpm run smoke:payment-initiation-provider-reference` — PASS
- `pnpm run smoke:payment-provider-reference-lookup` — PASS
- `pnpm run smoke:payment-callback-worker-foundation` — PASS
- `pnpm run smoke:payment-callback-owner-command` — PASS
- `pnpm run smoke:provider-boundary` — PASS

## Kalan Limitler

- PayTR live initiate yok.
- PayTR merchant_oid gerçek üretimi yok.
- Callback worker owner transition yok.
- Payment owner mutation callback üzerinden yok.
- Reconciliation yok.
- Order handoff yok.
- Finance/risk mutation yok.
- Real PayTR E2E yok.

## Nihai Karar

**PASS WITH LIMITATION**

---

# 33. HARDENING-10C9-02 — Payment Owner Transition Succeeded/Failed Callback / No Order Handoff

## Amaç

10C8 dry-run worker, 10C9-00 providerReference lookup ve 10C9-01 initiation provider reference persistence sonrası payment callback worker için ilk kontrollü payment owner mutation eklemek.

Bu paket yalnız opt-in worker modunda `succeeded` ve `failed` callback owner command’lerini payment owner state transition’a bağlar.

Bu paket:

- Order handoff değildir.
- Finance/risk mutation değildir.
- Reconciliation runtime değildir.
- PayTR live initiate değildir.
- Real E2E değildir.

## Değişen Dosyalar

- `services/payment/src/payment.ts`
- `services/payment/src/callback-worker.ts`
- `tests/smoke/suites/payment-callback-owner-transition.ts`
- `tests/smoke/run-smoke.ts`
- `package.json`
- `HARDENING-10C9-02-PAYMENT-OWNER-TRANSITION-SUCCEEDED-FAILED-CALLBACK-CLOSURE-REPORT.md`

## Payment Owner Transition

Export edildi:

- `applyPaymentCallbackOwnerCommand(command)`

Desteklenen komutlar:

- `MARK_PAYMENT_SUCCEEDED`
- `MARK_PAYMENT_FAILED`

Desteklenmeyen komutlar:

- `OWNER_COMMAND_TYPE_NOT_SUPPORTED`
- ignored
- payment state mutation yok

## Transition Result Alanları

- paymentId
- paymentAttemptId
- previousState
- nextState
- previousAttemptState
- nextAttemptState
- idempotencyKey
- applied
- alreadyApplied
- ignored
- errors
- warnings

## Lookup Kararı

Önce `paymentAttemptId` ile lookup.

Bulunamazsa ve `providerReference` varsa:

`repo.getByProviderReference(command.providerName, command.providerReference)`

fallback kullanılır.

Worker apply modunda providerReference-only callback’lerde resolved paymentAttemptId/paymentId/checkoutId ile command üretimi yapılır.

## State Mutation Kararı

`MARK_PAYMENT_SUCCEEDED`:

- payment.state = SUCCEEDED
- attempt.state = SUCCEEDED
- attempt.callbackRecordId = command.callbackRecordId
- attempt.lastCallbackAt = command.occurredAt
- attempt.lastCallbackStatus = command.normalizedStatus

`MARK_PAYMENT_FAILED`:

- payment.state = FAILED
- attempt.state = FAILED
- attempt.callbackRecordId = command.callbackRecordId
- attempt.lastCallbackAt = command.occurredAt
- attempt.lastCallbackStatus = command.normalizedStatus

Provider metadata backfill yalnız eksikse yapılır:

- attempt.providerReference
- attempt.providerEventId

## Idempotency / Duplicate

Aynı hedef state zaten uygulanmışsa ve lastCallbackStatus aynıysa:

- applied=false
- alreadyApplied=true
- ignored=false

Terminal conflict:

- succeeded -> failed
- failed -> succeeded

uygulanmaz:

- applied=false
- ignored=true
- error: `PAYMENT_TERMINAL_STATE_CONFLICT`

## Worker Opt-in Mode

Default:

`ownerTransitionMode: 'dry_run'`

Opt-in:

`ownerTransitionMode: 'apply_owner_transition'`

Dry-run geriye uyumlu kaldı.

Apply modunda yalnız `command_ready` kararında owner transition çağrılır.

Callback record lifecycle:

- apply/alreadyApplied -> accepted
- rejected candidate -> rejected
- pending/unknown/reconciliation -> ignored
- missing lookup -> ignored
- unexpected validation -> failed

## Smoke Sonucu

Yeni suite:

`pnpm run smoke:payment-callback-owner-transition`

Assertionlar:

- providerReference-only succeeded callback payment lookup ile SUCCEEDED.
- attempt state SUCCEEDED.
- callback metadata yazılır.
- duplicate succeeded alreadyApplied.
- failed callback FAILED.
- signature failed/rejected mutation yapmaz.
- missing lookup ignored/reconciliation.
- pending mutation yapmaz.

## Çalıştırılan Komutlar

- `pnpm run typecheck` — PASS
- `pnpm run smoke:payment-callback-owner-transition` — PASS
- `pnpm --filter @hx/payment run build` — PASS
- `pnpm run smoke:payment-callback-worker-foundation` — PASS
- `pnpm run smoke:payment-callback-owner-command` — PASS
- `pnpm run smoke:payment-initiation-provider-reference` — PASS
- `pnpm run smoke:payment-provider-reference-lookup` — PASS
- `pnpm run build` — PASS
- `pnpm run smoke:provider-boundary` — PASS

## Boundary Sonucu

Bu paket ilk kontrollü payment owner mutation paketidir.

Kapsam yalnız:

- opt-in worker mode
- succeeded / failed callback command
- payment owner state transition

Kapsam dışı:

- order handoff
- finance/risk mutation
- reconciliation
- migration
- BFF change
- PayTR live initiate

## Kalan Limitler

- PayTR live initiate yok.
- PayTR merchant_oid gerçek üretimi yok.
- Pending/unknown/cancelled/expired owner mutation yok.
- Reconciliation runtime yok.
- Order handoff yok.
- Finance/risk mutation yok.
- Real PayTR E2E yok.

## Nihai Karar

**PASS WITH LIMITATION**

---

# 34. Güncel Durum Özeti

Bu bölüm, yukarıdaki master kayıtların sonunda sistemin geldiği noktayı belirtir.

## Tamamlanan Ana Capability’ler

- Provider callback contract foundation.
- Provider callback persistence foundation.
- Provider callback migration.
- In-memory callback smoke.
- Postgres idempotency remediation.
- Common BFF callback ingestion endpoint.
- Signature guard foundation.
- Replay/idempotency guard.
- Timestamp freshness guard.
- Process-local rate/abuse guard.
- PayTR-first mapping inventory.
- Normalized payment callback candidate contract/helper.
- PayTR mapping helper.
- PayTR plain text OK response policy.
- Payment provider config/secret resolver foundation.
- PayTR live BFF normalizedPayload mapping.
- Payment callback worker/owner handoff inventory.
- Payment callback state model / owner command contract.
- Dry-run payment callback worker foundation.
- Payment providerReference lookup.
- Payment initiation provider metadata persistence.
- Opt-in succeeded/failed payment owner transition.

## Henüz Tamamlanmayan Ana Capability’ler

- PayTR live initiate.
- PayTR real merchant_oid üretimi.
- Generic signature guard ile PayTR hash verification birleşimi.
- Worker daemon/process.
- Atomic claim/lock ve multi-worker concurrency.
- Reconciliation runtime.
- Pending/unknown/cancelled/expired owner mutation.
- Payment success event / outbox.
- Order handoff.
- Finance correction linkage.
- Risk signal linkage.
- Real PayTR sandbox E2E.
- iyzico mapping / implementation.
- Distributed rate limiting / WAF / gateway.
- Nonce reuse cache.
- Provider-specific replay window.

---

# 35. Sonraki Paket İçin Doğal Devam

10C9-02 sonrasında sistem ilk kontrollü payment owner mutation’a geçti. Ancak bu sadece succeeded/failed callback ve opt-in worker moduyla sınırlıdır.

Sıradaki profesyonel ilerleme seçenekleri:

## Seçenek A — Reconciliation Inventory / Runtime Hazırlığı

Amaç:

- pending, unknown_result, mismatch, not-found gibi durumların nasıl status inquiry’ye gideceğini netleştirmek.

Neden önemli:

- Payment callback sadece success/failure happy path değildir.
- PayTR status inquiry olmadan pending/unknown_result production riski taşır.

## Seçenek B — Payment Success Event / Order Handoff Boundary

Amaç:

- Payment owner `SUCCEEDED` truth sonrası order create handoff’unu kurmak.
- Callback worker’dan doğrudan order create yolunu kesin yasaklamak.

Neden önemli:

- Artık payment owner SUCCEEDED olabiliyor.
- Ancak order henüz tetiklenmiyor.
- Duplicate callback duplicate order üretmemeli.

## Seçenek C — PayTR Live Initiate / merchant_oid Strategy

Amaç:

- PayTR initiate sırasında merchant_oid değerinin nasıl üretileceğini ve payment attempt/providerReference ile nasıl bağlanacağını netleştirmek.

Neden önemli:

- Callback lookup güvenilirliği merchant_oid stratejisine bağlı.
- Real E2E için ön koşuldur.

## Seçenek D — Worker Runtime / Claim / Retry Foundation

Amaç:

- Dry-run/opt-in fonksiyon düzeyinden gerçek çalıştırılabilir worker lifecycle’a geçmek.
- Atomic claim, retry/backoff, concurrency guard kurmak.

Neden önemli:

- Multi-worker veya repeated execution duplicate owner mutation riski taşır.

## Önerilen Teknik Sıra

1. **10C10 — Payment Callback Reconciliation / Status Inquiry Inventory**
2. **10C11 — Payment Success Event / Order Handoff Boundary**
3. **10C12 — PayTR Live Initiate merchant_oid Contract**
4. **10C13 — Worker Runtime Claim / Retry Foundation**
5. **10C14 — PayTR Sandbox E2E Validation**
6. **10C15 — Risk / Finance Advisory Linkage**

---

# 36. Nihai Master Karar

**HARDENING-10 CALLBACK MASTER REFERENCE CREATED**

Bu dosya, HARDENING-10 hattında yapılan provider callback/webhook/reconciliation çalışmalarının master referans kaydıdır.

Son kayıt itibarıyla:

- Common callback security boundary foundation kapanmıştır.
- Payment-first PayTR mapping hattı kurulmuştur.
- Payment callback owner command contract hazırdır.
- Worker foundation vardır.
- providerReference lookup vardır.
- Initiation provider reference persistence vardır.
- Succeeded/failed callback için opt-in payment owner transition vardır.
- Domain processing sınırlı olarak başlamıştır.
- Order/finance/risk/reconciliation/real PayTR E2E hâlâ açık limitlerdir.

Son karar:

**HARDENING-10C9-02 sonrası durum: PASS WITH LIMITATION hattı devam ediyor.**

