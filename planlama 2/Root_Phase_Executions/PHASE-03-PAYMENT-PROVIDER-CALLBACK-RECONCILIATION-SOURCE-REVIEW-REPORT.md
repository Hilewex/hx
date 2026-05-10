# PHASE-03 — Payment / Provider / Callback / Reconciliation Source Review Report

## 1. Amaç

Bu rapor, PHASE-03 kapsamında Checkout → Payment → Provider → Callback → Reconciliation hattının source, boundary, state, idempotency, unknown-result ve runtime smoke durumunu değerlendirmek için hazırlanmıştır.

## 2. Başlangıç Durumu

```text
PHASE-01: PASS WITH LIMITATION
PHASE-02: PASS WITH LIMITATION
PHASE-03: GO
```

## 3. Bulgular

### A) Payment Initiation Review

| Kontrol | Bulgular | Sonuç |
|---|---|---|
| 1. Payment yalnız ready checkout üzerinden mi başlıyor? | Evet. `services/payment/src/payment.ts` dosyasındaki `validateCheckoutPaymentReadiness` fonksiyonu (satır 53), checkout'un `REVIEW_READY` ve `VALID` olmasını zorunlu kılıyor. | PASS |
| 2. PHASE-02-FIX-01 guard korunuyor mu? | Evet, `validateCheckoutPaymentReadiness` içindeki kontroller (satır 58-75) bu guard'ı koruyor. | PASS |
| 3. Checkout not-ready ise payment attempt persist ediliyor mu? | Hayır. `initiatePayment` (satır 413), `readinessErrors` varsa `createRejectedPaymentInitiationResponse` çağırarak işlemi reddediyor ve veritabanına kayıt yapmıyor. | PASS |
| 4. Provider çağrısı checkout not-ready iken yapılabiliyor mu? | Hayır. `initiatePayment` (satır 413), provider çağırmadan önce `readinessErrors` kontrolü yapıyor. | PASS |
| 5. Amount/currency validation var mı? | Evet. `validateCheckoutPaymentReadiness` (satır 62-68) ve `initiatePayment` (satır 441-484) içinde hem checkout'tan gelen hem de komuttan gelen amount/currency doğrulamaları mevcut. | PASS |
| 6. Payment idempotency var mı? | Evet. `initiatePayment` (satır 394-398), `repo.getByIdempotencyKey` ile mevcut bir ödeme olup olmadığını kontrol ediyor. | PASS |
| 7. Duplicate initiate duplicate payment oluşturuyor mu? | Hayır. Idempotency kontrolü (satır 394-398) sayesinde aynı `idempotencyKey` ile yapılan ikinci istek, yeni bir ödeme oluşturmak yerine mevcut olanı döndürüyor. | PASS |
| 8. BFF payment truth üretiyor mu? | Hayır. `apps/bff/src/server/payment.ts` (satır 55), `initiatePayment` servis fonksiyonunu çağırıyor ve onun sonucunu döndürüyor. BFF, ödeme durumu hakkında bir karar vermiyor. | PASS |

**Özet Sonuç:** PASS

### B) Provider Boundary Review

| Kontrol | Bulgular | Sonuç |
|---|---|---|
| 1. Provider boundary açık mı? | Evet. `packages/contracts/src/provider.ts` dosyasındaki `ProviderBoundaryFlags` ve `ProviderResultEnvelope` gibi yapılar, servis ile sağlayıcı arasındaki sınırı net bir şekilde tanımlıyor. | PASS |
| 2. PayTR live/sandbox/simulation ayrımı var mı? | Evet. `services/payment/src/provider-config.ts` (satır 98-103) ve `services/payment/src/provider-adapter.ts` (satır 254-262), ortam değişkenlerine göre `simulation`, `sandbox` ve `production` modları arasında geçiş yapılmasını sağlıyor. | PASS |
| 3. Provider response payment truth’a doğrudan yazılıyor mu? | Hayır. `services/payment/src/payment.ts` dosyasındaki `applyPaymentCallbackOwnerCommand` fonksiyonu, provider'dan gelen callback'leri işlerken kendi iç state'ini güncelliyor. Provider'ın yanıtı doğrudan bir "truth" olarak kabul edilmiyor, bir komut adayı olarak ele alınıyor. | PASS |
| 4. Provider callback ile provider initiate ayrımı net mi? | Evet. `initiatePayment` ödeme başlatma işlemini, `applyPaymentCallbackOwnerCommand` ise callback'leri işleme mantığını içeriyor. Bu iki süreç birbirinden ayrıdır. | PASS |
| 5. Provider metadata audit/evidence olarak mı tutuluyor? | Evet. `services/payment/src/payment.ts` içindeki `initiatePayment` fonksiyonu (satır 572-613), `appendAuditLog` ve `appendOutboxEvent` çağrıları ile sağlayıcıdan gelen yanıtı ve diğer önemli bilgileri denetim ve kanıt olarak kaydediyor. `providerEnvelope` alanı da bu amaçla kullanılıyor. | PASS |
| 6. Provider failure deterministic error üretiyor mu? | Evet. `services/payment/src/provider-adapter.ts` içindeki `NotConfiguredPaymentProviderAdapter` (satır 208-213) ve diğer hata durumları, `ProviderError` sözleşmesine uygun, deterministik hata kodları (`PAYMENT_PROVIDER_NOT_IMPLEMENTED`, `PAYMENT_PROVIDER_NOT_CONFIGURED` vb.) üretiyor. | PASS |
| 7. Provider unavailable retry/unknown-result davranışı var mı? | Evet. `packages/contracts/src/provider.ts` (satır 58) `unknown_result` durumunu tanımlıyor. `services/payment/src/provider-adapter.ts` içindeki `InternalSimulationPaymentProviderAdapter` (satır 82-85), bu senaryoyu simüle etme yeteneğine sahip. Bu durumların ele alınması reconciliation (uzlaşma) sürecine bırakılmıştır. | PASS WITH LIMITATION |

**Özet Sonuç:** PASS WITH LIMITATION (Limitation: Canlı PayTR entegrasyonu henüz tamamlanmamış ve `NotConfiguredPaymentProviderAdapter` ile `internal_simulation` adaptörleri üzerinden ilerleniyor. `unknown-result` davranışı simüle edilebiliyor ancak canlı senaryo testi eksik.)

### C) Provider Callback Ingestion Review

| Kontrol | Bulgular | Sonuç |
|---|---|---|
| 1. Callback BFF direct repository access yapıyor mu? | Hayır. `apps/bff/src/server/provider-callback.ts` (satır 578), `recordProviderCallbackEvent` fonksiyonunu çağırıyor. Bu fonksiyon `services/provider-callback/src/index.ts` (satır 44) içinde tanımlanmış ve veritabanı erişimini `getProviderCallbackEventRepository` üzerinden soyutluyor. | PASS |
| 2. Callback raw event service boundary içinde kaydediliyor mu? | Evet. `recordProviderCallbackEvent` fonksiyonu, `ProviderCallbackRecord` objesini alıp `packages/persistence/src/provider-callback.ts` içindeki repository'ye kaydediyor. | PASS |
| 3. Callback business truth mutation yapıyor mu? | Hayır. BFF'teki `handleProviderCallbackIngestion` (satır 434) fonksiyonunun tamamı sadece callback'i kaydetmeye ve doğrulamaya odaklanmıştır. Herhangi bir iş mantığı mutasyonu (sipariş durumu, ödeme durumu vb.) gerçekleştirmez. | PASS |
| 4. `businessTruthMutated=false` ve `ownerStateMutated=false` korunuyor mu? | Evet. `apps/bff/src/server/provider-callback.ts` (satır 574) `createProviderBoundaryFlags()` çağırarak bu bayrakların `false` olarak ayarlandığı bir `boundary` nesnesi oluşturur ve bunu kayıtla birlikte veritabanına yazar. | PASS |
| 5. Signature guard var mı? | Evet, ancak çok basit düzeyde. `apps/bff/src/server/provider-callback.ts` (satır 232-273) `verifyProviderCallbackSignature` fonksiyonu, sadece `signature-test-provider` adlı bir sağlayıcı için imza doğrulaması yapıyor. PayTR için henüz bir imza doğrulama mantığı eklenmemiş. | PARTIAL |
| 6. Replay/idempotency guard var mı? | Evet. `apps/bff/src/server/provider-callback.ts` (satır 490-533) `findExistingCallbackByIdentity` ile `providerEventId` ve `idempotencyKey` üzerinden mevcut bir callback olup olmadığını kontrol ediyor. Varsa, işlemi durdurup `duplicate` olarak işaretliyor. | PASS |
| 7. Timestamp freshness guard var mı? | Evet. `apps/bff/src/server/provider-callback.ts` (satır 298-345) `evaluateCallbackFreshness` fonksiyonu, `x-provider-timestamp` başlığını kontrol ederek callback'in çok eski veya gelecekten bir tarihli olup olmadığını denetliyor. | PASS |
| 8. Invalid provider domain/name davranışı deterministic mi? | Evet. `apps/bff/src/server/provider-callback.ts` (satır 440 ve 447) bilinmeyen `providerDomain` ve `providerName` için `400 Bad Request` yanıtı döndürüyor. | PASS |
| 9. Duplicate callback duplicate business effect üretir mi? | Hayır. Idempotency kontrolü (6. madde) sayesinde, mükerrer callback'ler işlenmeden reddedilir, bu da mükerrer iş etkilerini önler. | PASS |
| 10. Callback payment/order/finance state değiştiriyor mu? | Hayır. Callback ingestion katmanı (BFF ve `provider-callback` servisi) kesinlikle state değişikliği yapmaz. Sadece olayı kaydeder. State değişiklikleri, bu olayları işleyen asenkron worker'lar tarafından yapılır. | PASS |

**Özet Sonuç:** PASS WITH LIMITATION (Limitation: İmza doğrulama (signature guard) mekanizması henüz tam olarak uygulanmamıştır ve sadece bir test sağlayıcısı için çalışmaktadır. Canlı sağlayıcılar için bu güvenlik önleminin eklenmesi gerekmektedir.)

### D) Callback Postgres Runtime Smoke Review

| Kontrol | Bulgular | Sonuç |
|---|---|---|
| 1. Bu smoke scriptleri package.json’da var mı? | Evet, `smoke:provider-callback-foundation`, `smoke:provider-callback-ingestion`, `smoke:provider-callback-replay-guard`, `smoke:provider-callback-signature-guard` scriptleri mevcuttur. | PASS |
| 2. Postgres gerektiriyor mu? | Evet. Çalıştırılan tüm testler `[CUSTOMER-SERVICE] Using Postgres repository` çıktısını vermiştir, bu da Postgres kullandıklarını doğrular. | PASS |
| 3. `DATABASE_URL` var mı? | Evet, `.env` dosyasında `DATABASE_URL` tanımlıdır ve BFF uygulaması tarafından okunmaktadır. | PASS |
| 4. Docker/Postgres çalışıyor mu? | Evet, `docker-compose.local.yml` ile başlatıldı ve `docker ps` ile doğrulandı. | PASS |
| 5. Migration/verify gerekiyor mu? | Testler başarılı olduğuna göre, migration'ların güncel olduğu varsayılabilir. Aksi takdirde testler veritabanı şema hataları verirdi. | PASS |
| 6. Çalıştırılabiliyorsa sonuç ne? | Tüm zorunlu smoke testler başarıyla çalıştı ve **PASS** sonucu verdi. | PASS |
| 7. Çalıştırılamıyorsa BLOCKED nedeni environment mı, kod mu? | N/A | N/A |

**Özet Sonuç:** PASS

### E) Payment Reconciliation Review

| Kontrol | Bulgular | Sonuç |
|---|---|---|
| 1. Reconciliation dry-run worker var mı? | Evet. `services/payment/src/reconciliation-worker.ts` dosyasındaki `runPaymentReconciliationWorkerDryRun` (satır 639) ve `processPaymentReconciliationTaskDryRun` (satır 491) fonksiyonları bu işlevi yerine getirir. | PASS |
| 2. Dry-run mutation yapıyor mu, yapmamalı. | Hayır. `processPaymentReconciliationTaskDryRun` fonksiyonu açıkça `mutationApplied: false` (satır 548) döndürür ve state değiştirebilecek `applyPaymentCallbackOwnerCommand` fonksiyonunu çağırmaz. | PASS |
| 3. Status inquiry adapter live/simulated ayrımı var mı? | Evet. `services/payment/src/provider-adapter.ts` dosyasındaki `getPaymentProviderAdapter` (satır 254), yapılandırmaya göre `InternalSimulationPaymentProviderAdapter` veya `NotConfiguredPaymentProviderAdapter` döndürür. Canlı sağlayıcı henüz eklenmemiş olsa da, simülasyon ve canlı ayrımı için altyapı mevcuttur. `statusInquiry` (satır 110) simülasyon yanıtı ile çalışır. | PASS |
| 4. Unknown-result payment için decision helper var mı? | Evet. `packages/contracts/src/payment.ts` dosyasındaki `decidePaymentReconciliationAction` fonksiyonu (satır 840), `payment_unknown_result` trigger sebebini ele alır ve `schedule_status_query` kararı verir. | PASS |
| 5. Reconciliation payment state mutate ediyor mu? | Yalnızca kontrollü bir şekilde. `processPaymentReconciliationTaskControlledMutation` (satır 554) fonksiyonu, `enableOwnerCommandApplication` bayrağı `true` ise ve belirli koşullar sağlanırsa `applyPaymentCallbackOwnerCommand` çağırarak state değişikliği yapabilir. | PASS |
| 6. Mutating reconciliation varsa owner command üzerinden mi? | Evet. State değişikliği sadece `applyPaymentCallbackOwnerCommand` (satır 580) ile, yani bir `owner command` aracılığıyla yapılır. Bu, mutasyonların domain kurallarına uygun ve merkezi bir yerden yapılmasını sağlar. | PASS |
| 7. Audit/outbox evidence var mı? | Evet. `appendControlledReconciliationEvidence` fonksiyonu (satır 366), başarılı bir mutabakat sonrası `appendAuditLog` ve `appendOutboxEvent` çağrıları yaparak denetim ve outbox kayıtları oluşturur. | PASS |
| 8. Duplicate/alreadyApplied handling var mı? | Evet. Mutasyonu yapan `applyPaymentCallbackOwnerCommand` fonksiyonu, `alreadyApplied` durumunu kontrol eder (services/payment/src/payment.ts, satır 235) ve mükerrer işlem yapılmasını engeller. | PASS |
| 9. Order handoff reconciliation içinde tetikleniyor mu, tetiklenmemeli. | Hayır. Reconciliation worker'daki `appendControlledReconciliationEvidence` fonksiyonu içinde `orderCreated: false` ve `orderHandoff: false` (satır 411-412) olarak açıkça belirtilmiştir. Bu, mutabakatın sipariş oluşturma sürecini tetiklemediğini gösterir. | PASS |

**Özet Sonuç:** PASS

### F) Payment State / Unknown Result Review

| Kontrol | Bulgular | Sonuç |
|---|---|---|
| 1. Unknown-result state var mı? | Evet. `packages/contracts/src/payment.ts` dosyasında `PaymentState` (satır 16) ve `PaymentAttemptState` (satır 30) için `UNKNOWN_RESULT` durumu tanımlanmıştır. | PASS |
| 2. Provider timeout veya ambiguous result nasıl temsil ediliyor? | `packages/contracts/src/provider.ts` dosyasındaki `ProviderOperationStatus` (satır 58) `unknown_result` durumunu içerir. `provider-adapter.ts` (satır 83) bu durumu simüle edebilir. Bu durum, `PaymentState`'e `UNKNOWN_RESULT` olarak yansıtılır. | PASS |
| 3. Unknown-result order oluşturuyor mu, oluşturmamalı. | Hayır. Sipariş oluşturma (`createOrderFromPayment`) `SUCCEEDED` durumu gerektirir. `UNKNOWN_RESULT` durumundaki bir ödeme sipariş oluşturmaz. | PASS |
| 4. Unknown-result retry/reconciliation path’e gidiyor mu? | Evet. `packages/contracts/src/payment.ts` dosyasındaki `decidePaymentReconciliationAction` fonksiyonu (satır 947), `payment_unknown_result` durumunda `schedule_status_query` kararı vererek mutabakat sürecini tetikler. | PASS |
| 5. UI/BFF unknown-result’ı success/failure gibi sunuyor mu? | Hayır. BFF katmanı (`apps/bff/src/server/payment.ts`) servis katmanından gelen state'i doğrudan yansıtır. UI katmanı incelenmemiştir ancak BFF, `UNKNOWN_RESULT` durumunu olduğu gibi iletecektir. | PASS WITH LIMITATION |
| 6. Payment state transition deterministic mi? | Evet. State geçişleri `applyPaymentCallbackOwnerCommand` gibi `owner command`'ler aracılığıyla kontrollü bir şekilde yapılır. `hasTerminalStateConflict` (services/payment/src/payment.ts, satır 173) gibi fonksiyonlar, `SUCCEEDED` veya `FAILED` gibi nihai bir durumdan başka bir duruma geçişi engelleyerek determinizmi sağlar. | PASS |

**Özet Sonuç:** PASS WITH LIMITATION (Limitation: UI katmanının `UNKNOWN_RESULT` durumunu kullanıcıya nasıl yansıttığı tam olarak incelenmemiştir.)

### G) Payment → Order Handoff Inventory Review

| Kontrol | Bulgular | Sonuç |
|---|---|---|
| 1. Payment succeeded → order handoff başlamış mı? | Evet. `services/order/src/order.ts` dosyasındaki `createOrderFromPayment` fonksiyonu bu işlevi yerine getirir. | PASS |
| 2. Başladıysa owner boundary doğru mu? | Evet. Sipariş oluşturma sorumluluğu `order` servisine aittir. `payment` servisi sipariş oluşturmaz. `createOrderFromPayment` fonksiyonu, ödeme ve checkout servislerinden veri alarak kendi `Order` nesnesini oluşturur. | PASS |
| 3. Payment service order yaratıyor mu, yaratmamalı. | Hayır, `payment` servisi sipariş yaratmaz. | PASS |
| 4. Order service payment result doğruluyor mu? | Evet. `createOrderFromPayment` (satır 126), sipariş oluşturmadan önce `payment.state`'in `SUCCEEDED` olup olmadığını kontrol eder. | PASS |
| 5. Duplicate payment success duplicate order üretebilir mi? | Hayır. `createOrderFromPayment` (satır 61 ve 80), hem `idempotencyKey` hem de `paymentAttemptId` üzerinden mevcut bir sipariş olup olmadığını kontrol ederek mükerrer sipariş oluşumunu engeller. | PASS |
| 6. Failed/cancelled/unknown payment order yaratıyor mu? | Hayır. `createOrderFromPayment` (satır 126) sadece `SUCCEEDED` durumundaki ödemeler için sipariş oluşturur. Diğer durumlarda hata döner. | PASS |
| 7. Handoff eksikse PHASE-03 blocker mı yoksa PHASE-04/11’e mi devredilecek? | Handoff süreci mevcuttur ve temel guard'lar yerindedir. Bu nedenle PHASE-03 için bir blocker değildir. İleri düzey senaryolar ve envanter yönetimi gibi konular PHASE-04/11'e devredilebilir. | PASS |

**Özet Sonuç:** PASS

### H) BFF / UI Boundary Review for Payment

| Kontrol | Bulgular | Sonuç |
|---|---|---|
| 1. BFF payment truth üretiyor mu? | Hayır. `apps/bff/src/server/payment.ts` (satır 55) ve `apps/bff/src/server/provider-callback.ts` (satır 434) dosyalarındaki handle fonksiyonları, servis katmanlarını çağırır ve state yönetimine karışmaz. | PASS |
| 2. BFF callback business mutation yapıyor mu? | Hayır. `handleProviderCallbackIngestion` fonksiyonu sadece callback verisini kaydeder, herhangi bir iş mantığı mutasyonu yapmaz. | PASS |
| 3. UI payment success/failure truth üretiyor mu? | İncelenen `apps/web` ve `apps/panel` dosyalarında ödeme ile ilgili UI bileşeni bulunamadı. `apps/web/src/bootstrap/payment.ts` sadece bir simülasyon scriptidir. | NOT FOUND |
| 4. UI unknown-result’ı kesin success/failure gibi gösteriyor mu? | UI bileşenleri bulunamadığı için doğrulanamadı. | NOT FOUND |
| 5. BFF raw provider internal error sızdırıyor mu? | Hayır. BFF, servislerden gelen hataları yakalar ve standartlaştırılmış `response` objeleri ile (örn: `response.forbidden`) yanıt döner. `apps/bff/src/server/payment.ts` satır 58'de bu görülmektedir. | PASS |
| 6. Actor context güvenli mi? | Evet. `apps/bff/src/server/payment.ts` (satır 28) `requireResourceOwnership` guard'ını kullanarak checkout sahibinin isteği yapan aktörle aynı olduğunu doğrular. | PASS |

**Özet Sonuç:** PASS WITH LIMITATION (Limitation: Projede ödeme akışını yöneten gerçek UI bileşenleri bulunamadığı için UI katmanının davranışları doğrulanamamıştır.)
