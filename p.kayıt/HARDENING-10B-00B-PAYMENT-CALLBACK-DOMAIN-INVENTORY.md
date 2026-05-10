# HARDENING-10B-00B — Payment Callback Domain Inventory

## 1. Genel Durum

- **Payment callback bugün repo’da var mı?**
  - **HAYIR.** Kod tabanında (`services`, `apps/bff`) gelen bir payment callback’i işleyecek, doğrulayacak veya bir domain mantığını tetikleyecek bir bileşen (örn: webhook endpoint, worker, consumer) bulunmamaktadır. `HARDENING-10B-00A` raporunun da teyit ettiği gibi, mevcut altyapı sadece giden (outbound) istekleri ve bunların simülasyonunu kapsamaktadır.

- **10A foundation payment callback için ne sağlıyor?**
  - `HARDENING-10A` serisi, payment callback için temel yapı taşlarını (foundation) atmıştır. Bunlar:
    - **Contract:** `ProviderCallbackEnvelope`, `ProviderCallbackRecord` ve imza doğrulama (`SignatureVerificationResult`) gibi standartlaştırılmış veri sözleşmeleri `packages/contracts/src/provider.ts` dosyasına eklenmiştir. Bu sözleşmeler, provider’dan gelen bilginin bir "iş gerçeği" değil, bir "olay kaydı" olduğunu `boundary: { businessTruthMutated: false }` bayrağı ile zorunlu kılar.
    - **Persistence:** Gelen callback olaylarını saklamak için `provider_callback_events` tablosu (`infra/migrations`) ve bu tabloya erişimi soyutlayan `ProviderCallbackEventRepository` (`packages/persistence/src/provider-callback.ts`) (hem in-memory hem de Postgres implementasyonları ile) eklenmiştir.
    - **Idempotency:** `provider_event_id` ve `idempotency_key` üzerinden duplicate kayıtları veritabanı seviyesinde önleyecek mekanizmalar (UNIQUE index) migration’a dahil edilmiştir.
    - **Smoke Test:** In-memory repository’nin temel `insert`/`find`/`update` ve idempotency davranışlarını doğrulayan `provider-callback-foundation` smoke testi eklenmiştir.

- **Hangi parçalar hâlâ eksik?**
  - `HARDENING-10B-00A` raporunda da belirtildiği gibi, en temel parçalar eksiktir:
    - **BFF Callback Endpoint:** Dış dünyadan (örn: PayTR, iyzico) gelen HTTP POST isteklerini alacak public bir endpoint yoktur.
    - **Signature Verification Logic:** İmza doğrulama sözleşmeleri olsa da, gerçek kriptografik doğrulama mantığı (`HMAC-SHA256` vb.) yazılmamıştır.
    - **Domain Processing Logic:** Kaydedilen bir `ProviderCallbackRecord`'u okuyup, "bu bir başarılı ödeme mi?", "hangi payment attempt'e ait?" gibi soruları cevaplayacak ve `payment` owner command'ını tetikleyecek bir iş mantığı (worker/consumer) yoktur.
    - **Reconciliation Runtime:** `unknown_result` gibi belirsiz durumlarda veya hiç callback gelmediğinde provider'ı sorgulayacak bir "reconciliation" mekanizması yoktur.

## 2. Payment Sistem Sınırı

- **Payment sistemi checkout’tan gelen doğrulanmış bağlamı finansal sonuca çevirir.**
  - **DOĞRU.** `planlama/15-ödeme sistemi .md` belgesinde bu ilke "Ödeme sistemi, checkout’tan gelen doğrulanmış sipariş hazırlığını finansal sonuca çeviren işlem sistemidir." (satır 18) ifadesiyle net bir şekilde belirtilmiştir. Payment servisinin `initiatePayment` fonksiyonu da checkout'tan gelen doğrulanmış verileri girdi olarak bekler.

- **Payment sistemi sepet/checkout/order değildir.**
  - **DOĞRU.** Planlama belgeleri (`15-ödeme sistemi .md`, `16-sipariş sistemi .md`) bu ayrımı çok sert bir şekilde çizmektedir. Ödeme, sepetin niyetini değil, checkout'un doğruladığı bağlamı alır ve siparişin kendisi değil, sipariş oluşumunu tetikleyen finansal sonucu üretir.

- **Payment provider response business truth değildir.**
  - **DOĞRU.** Bu, sistemin en temel kurallarından biridir. `packages/contracts/src/provider.ts` dosyasındaki `ProviderBoundaryFlags` arayüzü ve `createProviderResultEnvelope` gibi yardımcı fonksiyonlar, `businessTruthMutated: false` bayrağını zorunlu kılarak bu prensibi kod seviyesinde uygular. `HARDENING-10B-00A` raporu da bu durumu teyit etmektedir.

- **Payment callback payment owner’ın doğrulama/processing hattına girmeden order/finance etkisi üretemez.**
  - **KESİNLİKLE DOĞRU.** Mevcut mimaride (`order` servisi, `settlement` servisi vb.) hiçbir servis, doğrudan bir provider callback'ine abone değildir veya onu dinlemez. `planlama/16-sipariş sistemi .md` belgesine göre (satır 101), sipariş oluşumu "ödeme başarılı = sipariş oluşturma hakkı doğdu demektir" ilkesiyle çalışır; doğrudan callback ile değil, `payment` domain'inin ürettiği `payment success` sinyaliyle tetiklenir.

## 3. Payment Callback Ne Temsil Eder?

- **provider event notification:** Evet, callback özünde provider'ın kendi sisteminde bir olay (örn: "charge captured") olduğunu bizim sisteme bildirmesidir.
- **payment attempt status signal:** Evet, gelen callback'in içeriği (payload), başlattığımız bir `paymentAttempt`'in sonucu hakkında güçlü bir sinyal içerir. Ancak bu "sinyal"dir, "kesin gerçek" değil.
- **raw provider payload:** Evet, callback'in gövdesi (body), provider'ın kendine özgü formatında gönderdiği ham veridir. Bizim sistemimiz bu ham veriyi alıp, `ProviderCallbackRecord` içindeki `rawPayload` alanına işlemden geçirmeden kaydetmelidir.
- **verification result:** Callback, işleme alınmadan önce bir imza doğrulama (`SignatureVerificationResult`) ve tekrar/kopya (`replayDetected`) kontrolünden geçmelidir. Bu sonuçlar, callback kaydının meta verileridir.
- **replay/idempotency status:** Evet, callback işlenirken `providerEventId` veya `idempotencyKey` kullanılarak bunun daha önce işlenip işlenmediği kontrol edilir. Sonuç `first_seen`, `duplicate_event` gibi bir `replayStatus` olarak kaydedilir.
- **owner payment transition adayı:** Evet, en önemli tanım budur. Doğrulanmış, kopyası olmayan ve geçerli bir callback, `payment` domain'i için bir "state transition" (örn: `INITIATED` -> `SUCCEEDED`) işlemini tetikleyecek bir "aday"dır. Doğrudan bir `transition` değildir.

**Açık Yazı:**
Payment callback doğrudan “order created” veya “finance settled” anlamına gelmez.

## 4. Payment Callback Status Modeli

Aşağıdaki yorumlar, `packages/contracts/src/provider.ts` ve diğer planlama belgelerindeki tanımlara dayanmaktadır.

- **succeeded / captured:**
  - `callback record processingStatus` ne olabilir?: `accepted` olarak alınıp işlendikten sonra, eğer `payment` state'ini başarıyla `SUCCEEDED` yaparsa `processed` olabilir.
  - `payment owner command`'a dönüşebilir mi?: **EVET.** Bu, `TransitionPaymentToSucceeded` gibi bir owner command için en güçlü adaydır.
  - `order creation` hakkı doğurur mu?: **EVET, DOLAYLI YOLDAN.** `payment` state'i `SUCCEEDED` olunca, bu durum `order` servisinin `createOrderFromPayment` komutunu çağırması için bir hak doğurur.
  - `finance/settlement` etkisi olur mu?: **EVET, DOLAYLI YOLDAN.** `order created` event'i sonrası `settlement` servisi `CreateSettlementFromOrder` komutu ile tetiklenir ve `PENDING` statüsünde hakediş satırları oluşturur.

- **failed:**
  - `callback record processingStatus` ne olabilir?: `accepted` -> `processed`.
  - `payment owner command`'a dönüşebilir mi?: **EVET.** `TransitionPaymentToFailed` komutunu tetikler.
  - `order creation` hakkı doğurur mu?: **HAYIR.**
  - `finance/settlement` etkisi olur mu?: **HAYIR.**

- **pending:**
  - `callback record processingStatus` ne olabilir?: `accepted` -> `processed`. Genellikle bu bir ara durumdur ve nihai sonuç (succeeded/failed) için başka bir callback beklenir veya reconciliation gerekir.
  - `payment owner command`'a dönüşebilir mi?: Muhtemelen `MarkPaymentAsPending` gibi bir ara state'i güncelleyen bir komut olabilir.
  - `order creation` hakkı doğurur mu?: **HAYIR.**
  - `finance/settlement` etkisi olur mu?: **HAYIR.**

- **cancelled:**
  - `callback record processingStatus` ne olabilir?: `accepted` -> `processed`.
  - `payment owner command`'a dönüşebilir mi?: **EVET.** `TransitionPaymentToCancelled` komutunu tetikler.
  - `order creation` hakkı doğurur mu?: **HAYIR.**
  - `finance/settlement` etkisi olur mu?: **HAYIR.**

- **expired / timeout:**
  - `callback record processingStatus` ne olabilir?: `accepted` -> `processed`.
  - `payment owner command`'a dönüşebilir mi?: **EVET.** `TransitionPaymentToExpired` komutunu tetikler.
  - `order creation` hakkı doğurur mu?: **HAYIR.**
  - `finance/settlement` etkisi olur mu?: **HAYIR.**

- **unknown_result:**
  - Bu durum genellikle bir callback status'u değil, bizim sistemin bir provider çağrısı sonrası aldığı belirsiz yanıttır (`ProviderOperationStatus`). Eğer bir callback bu anlama gelen bir payload içeriyorsa:
  - `callback record processingStatus` ne olabilir?: `accepted` -> `reconciliation_required` gibi bir ara duruma alınabilir.
  - `payment owner command`'a dönüşebilir mi?: **HAYIR, DOĞRUDAN DEĞİL.** Bir "reconciliation" sürecini tetiklemelidir.
  - `order creation` hakkı doğurur mu?: **HAYIR.**
  - `finance/settlement` etkisi olur mu?: **HAYIR.**

- **duplicate / replay:**
  - `callback record processingStatus` ne olabilir?: `duplicate` olarak işaretlenir ve işlenmez.
  - `payment owner command`'a dönüşebilir mi?: **HAYIR.**
  - `order creation` hakkı doğurur mu?: **HAYIR.**
  - `finance/settlement` etkisi olur mu?: **HAYIR.**

- **signature_failed:**
  - `callback record processingStatus` ne olabilir?: `rejected` olarak işaretlenir. `verificationStatus` ise `failed` olur.
  - `payment owner command`'a dönüşebilir mi?: **HAYIR.** Güvenlik ihlali olarak değerlendirilir.
  - `order creation` hakkı doğurur mu?: **HAYIR.**
  - `finance/settlement` etkisi olur mu?: **HAYIR.**

- **unsupported:**
  - Anlaşılmayan/desteklenmeyen bir `callbackType` gelirse.
  - `callback record processingStatus` ne olabilir?: `ignored` olarak işaretlenir.
  - `payment owner command`'a dönüşebilir mi?: **HAYIR.**
  - `order creation` hakkı doğurur mu?: **HAYIR.**
  - `finance/settlement` etkisi olur mu?: **HAYIR.**

## 5. Order Creation Boundary

- **Payment callback doğrudan order oluşturabilir mi?**
  - **HAYIR.** `services/order/src/order.ts` dosyasındaki `createOrderFromPayment` fonksiyonu, bir `CreateOrderCommand` bekler, bu komut da `paymentId` ve `paymentAttemptId` gibi referanslar içerir. Callback payload'u ile doğrudan çağrılamaz. Mimaride böyle bir akış yoktur.

- **Aynı payment için duplicate callback duplicate order yaratabilir mi?**
  - **HAYIR, YARATMAMALI.** İki katmanlı koruma vardır:
    1. **Callback Ingestion:** `ProviderCallbackEventRepository`, `provider_event_id` üzerinden duplicate callback'leri yakalar ve `processingStatus`'u `duplicate` yaparak işlenmesini engeller.
    2. **Order Service:** `services/order/src/order.ts` (satır 60-83), `order-paymentAttemptId`'ye dayalı bir `idempotencyKey` ile ve doğrudan `paymentAttemptId` ile mevcut bir sipariş olup olmadığını kontrol eder. Eğer varsa, yeni bir sipariş oluşturmaz ve mevcut olanı döndürür.

- **Order creation hangi owner command üzerinden olmalı?**
  - Mevcut durumda `createOrderFromPayment` bir servis fonksiyonudur. Daha pürüzsüz bir CQRS modeli için bu, `payment succeeded` event'ini dinleyen bir consumer'ın tetikleyeceği bir `CreateOrder` command'ına dönüşebilir. Ancak mevcut yapıda, `payment`'ın durumunun `SUCCEEDED` olduğu doğrulandıktan sonra `order` servisinin çağrılması esastır.

- **Payment captured ile order created neden aynı şey değildir?**
  - `planlama/16-sipariş sistemi .md` (satır 101) ve `planlama/15-ödeme sistemi .md` (satır 220) bu ayrımı net bir şekilde yapar.
    - **Ayrı Sorumluluklar:** Payment'ın sorumluluğu finansal işlemi tamamlamaktır. Order'ın sorumluluğu ise ticari kaydı (stok düşme, fulfillment başlatma, snapshot alma vb.) oluşturmaktır.
    - **Hata Yönetimi:** Ödeme başarılı olup, geçici bir veritabanı hatası veya stok çakışması nedeniyle sipariş oluşturulamayabilir. Bu "kayıp sipariş" senaryosunun yönetilebilmesi için iki adımın ayrılması zorunludur.

- **Existing order create idempotency nasıl korunmalı?**
  - `services/order/src/repository/postgres.ts` dosyasındaki `saveWithIdempotency` ve `services/order/src/order.ts` (satır 60-83) içindeki mantık, hem `idempotency_records` tablosu üzerinden hem de `orders` tablosundaki `payment_attempt_id` alanı üzerinden bu korumayı sağlamaktadır.

**Net Karar:** Payment callback hiçbir durumda doğrudan order service’i bypass etmemeli. Bu, mevcut mimari ve planlama dokümanları tarafından desteklenen ve zorunlu kılınan bir karardır.

## 6. Finance / Settlement Boundary

- **Payment callback doğrudan settlement/hakediş yaratabilir mi?**
  - **HAYIR.** `services/settlement/src/settlement.ts` dosyasındaki `createSettlementFromOrder` fonksiyonu, bir `orderId` bekler. `settlement` domain'i, `payment callback`'ten değil, `order created` event'inden sonra tetiklenir. `planlama/aşama-2/OWNER_MATRIX.md` (satır 231) finansal truth'un M6 (Financial Truth Owner) olduğunu, diğer servislerin bunu doğrudan mutate edemeyeceğini belirtir.

- **Kupon/sponsor/settlement etkisi callback payload’dan mı türemeli?**
  - **HAYIR.** `planlama/46-kupon sistemi.md` belgesine göre kupon ve sponsor etkisi, checkout sırasında doğrulanır ve siparişe bir `snapshot` olarak yazılır. Finansal etki, sipariş kaydındaki bu doğrulanmış snapshot verisinden türetilir, provider'ın callback'te ne gönderdiğinden değil. Provider'ın payload'u güvenilir bir finansal kaynak değildir.

- **Finansal mutabakat hangi aşamada başlamalı?**
  - Gerçek anlamda hakediş (`settlement`) süreci, `order created` event'i ile başlar ve `settlement` satırları `PENDING` olarak oluşturulur. Teslimat (`delivered`) ve iade süresi (`return window closed`) gibi operasyonel adımlar tamamlandıktan sonra bu satırlar `CONDITIONALLY_EARNED` veya `SETTLED` durumuna geçer. `planlama/VERI_AKISI_SENKRONIZASYON_MODELI.md` (satır 280) bu akışı doğrular.

- **Payment success ile hakediş kesinleşmesi neden aynı şey değildir?**
  - **İade/İptal Riski:** Bir ödeme başarılı olabilir, ancak müşteri ürünü iade edebilir veya siparişi iptal edebilir. Hakediş, bu operasyonel riskler ortadan kalktıktan sonra kesinleşir.
  - **Operasyonel Süreç:** Hakediş, sadece ödemeye değil, aynı zamanda ürünün teslimatına ve iade/iptal süreçlerinin tamamlanmasına bağlıdır.

- **Risk/fraud signal payment callback tarafında nasıl ele alınmalı?**
  - Callback'in kendisi bir risk sinyali kaynağı olabilir. Örneğin:
    - **Sahte Callback:** `signature_failed` bir callback, doğrudan bir `RISK_SIGNAL` (`PAYMENT_ANOMALY`, `reason: FAKE_CALLBACK_ATTEMPT`) üretebilir.
    - **Anormal Pattern:** Çok kısa sürede aynı `paymentAttempt` için farklı sonuçlarla (örn: failed, succeeded, failed) callback'ler gelmesi bir anomali paterni olabilir.
  `planlama/49-fraud risk abuse sistemi.md` belgesi, risk sisteminin bu tür sinyalleri işleyip `RiskCase`'ler oluşturması gerektiğini belirtir.

## 7. Idempotency / Replay / Duplicate Risk

- **`providerEventId` ne için kullanılmalı?**
  - `packages/persistence/src/provider-callback.ts`'deki `ON CONFLICT (provider_domain, provider_name, provider_event_id)` kuralına göre, bu alan provider'dan gelen her bir olayın (webhook) sisteme **yalnızca bir kez** kaydedilmesini sağlamak için birincil anahtar olarak kullanılmalıdır. Bu, "event-level idempotency" sağlar.

- **`idempotencyKey` ne için kullanılmalı?**
  - Bu alan, callback'i tetikleyen bizim başlattığımız orijinal işlemle (örn: `initiatePayment` komutu) ilişki kurmak için kullanılabilir. Ya da provider tarafından her webhook denemesi için (retry'lar dahil) aynı değerin gönderildiği durumlarda "request-level idempotency" için kullanılabilir. `infra/migrations/20260504_001_provider_callback_persistence.sql` dosyasında bu alan için de bir `UNIQUE INDEX` vardır.

- **provider payment reference ne için kullanılmalı?**
  - Bu, genellikle bizim `paymentAttemptId`'mizin provider tarafındaki karşılığıdır. Callback payload'unu bizim sistemimizdeki doğru `payment` entity'si ile eşleştirmek için kullanılır.

- **duplicate callback nasıl `duplicate` veya `ignored` yapılmalı?**
  - `ProviderCallbackEventRepository`'nin Postgres implementasyonundaki `ON CONFLICT` kuralı, aynı `providerEventId` ile gelen ikinci bir isteğin yeni bir satır oluşturmasını engeller. In-memory versiyonu da benzer bir kontrol yapar. Uygulama mantığı, `insert` denemesi sırasında bir çakışma yakaladığında, mevcut kaydı okuyup `processingStatus`'unu `duplicate` olarak işaretleyebilir veya doğrudan `insert` sorgusunun döndürdüğü mevcut kaydı alıp işlem yapmadan loglayabilir. `packages/contracts/src/provider.ts`'deki `ProviderCallbackProcessingStatus` tanımında `duplicate` ve `ignored` durumları mevcuttur.

- **`unknown_result` sonrası reconciliation ihtiyacı var mı?**
  - **EVET, KESİNLİKLE.** `planlama/VERI_AKISI_SENKRONIZASYON_MODELI.md` (satır 77-81) ve `HARDENING-09C` smoke testleri bu senaryonun önemini vurgular. Eğer bir ödeme başlatma isteği `unknown_result` ile dönerse ve sonrasında bir callback gelmezse, sistemin durumu belirsiz kalır. Belirli bir süre sonra provider API'ını sorgulayarak (reconciliation) işlemin nihai sonucunu öğrenmek zorunludur.

- **Postgres `idempotency_key` conflict limiti payment callback için risk oluşturur mu?**
  - `packages/persistence/src/provider-callback.ts` (satır 202-203) ve `HARDENING-10B-00A` (satır 60-62) raporu, `idempotency_key` için `ON CONFLICT` kuralının `insert` sorgusunda eksik olduğuna dikkat çeker. Migration dosyasında `UNIQUE INDEX` olduğu için, duplicate bir `idempotency_key` ile `insert` denemesi veritabanı hatası (`unique_violation`) fırlatacaktır. Bu, uygulamanın çökmesine neden olabilir. Bu bir risktir ve uygulamanın bu hatayı yakalayıp, mevcut kaydı bularak `duplicate` olarak işaretlemesi gerekir.

## 8. Security / Signature / Config Boundary

- **Signature verification olmadan payment callback processing yapılabilir mi?**
  - **HAYIR, KESİNLİKLE YAPILMAMALI.** Bu, `planlama/10-00-PROVIDER-CALLBACK-WEBHOOK-RECONCILIATION-INVENTORY.md` belgesinde P1/P0 seviyesinde bir risk olarak tanımlanmıştır. İmza doğrulaması olmadan gelen her callback sahte olabilir ve bu, finansal kayıplara ve sahte siparişlere yol açar. Gelen callback'in `processingStatus`'u, imza doğrulaması başarısız olursa `rejected` olmalıdır.

- **Provider secret/env nerede yönetilmeli?**
  - `planlama/KONFIGURASYON_YONETIMI.md` (satır 51-80) belgesine göre, API key'ler ve provider secret'ları `C0 — Secret config` sınıfındadır. Bunlar repo'da veya DB'de değil, bir "secret manager" (örn: HashiCorp Vault, AWS Secrets Manager) içinde yönetilmeli ve runtime'a güvenli bir şekilde enjekte edilmelidir.

- **BFF webhook endpoint açıldığında hangi config sınıfına girer?**
  - Endpoint URL'i, `C1 — Environment config` sınıfına girer. Yani ortama (development, staging, production) göre değişen bir environment variable olmalıdır.

- **Fake callback / replay callback riski nasıl sınırlanmalı?**
  - **Fake Callback:** Güçlü imza doğrulaması (Signature Verification) ile engellenir.
  - **Replay Callback:** `providerEventId` ve/veya callback payload'undaki bir `timestamp` kontrolü ile engellenir. `packages/contracts/src/provider.ts` içindeki `ProviderCallbackReplayStatus` tanımı (`first_seen`, `replay_detected`) bu amaçladır.

- **Public callback endpoint rate limit / abuse guard gerektirir mi?**
  - **EVET.** `planlama/10-00-PROVIDER-CALLBACK-WEBHOOK-RECONCILIATION-INVENTORY.md` (satır 129) bunu bir P2 riski olarak tanımlar. Kötü niyetli aktörlerin endpoint'i DDoS saldırıları veya anlamsız isteklerle boğmasını engellemek için rate limit, IP kısıtlaması gibi temel korumalar zorunludur.

## 9. BFF Boundary

- **BFF payment callback endpoint açılırsa ne yapabilir?**
  - `planlama/aşama-2/OWNER_MATRIX.md` (satır 207-226) ve `GUARD_MATRIX.md` BFF'in `write` yapamayacağını net bir şekilde belirtir. BFF'in rolü:
    1.  Gelen isteği almak (ingestion).
    2.  Temel doğrulama yapmak (örn: header var mı?).
    3.  İsteği, imza doğrulama ve persistence için bir `Callback Ingestion Service/Worker`'a paslamak.
    4.  Provider'a hızlı bir `200 OK` veya `202 Accepted` yanıtı dönmek.

- **BFF truth owner olabilir mi?**
  - **HAYIR.** Bu, mimarinin en temel kuralıdır. BFF, bir "read aggregation" ve "command handoff" katmanıdır.

- **BFF sadece ingestion + validation + persistence + owner command handoff mı yapmalı?**
  - Hayır, BFF'in sorumluluğu daha da az olmalıdır. BFF, **ingestion** ve **handoff** yapmalıdır. **Validation** (özellikle imza), **persistence** (`ProviderCallbackEventRepository` kullanımı) ve **owner command handoff** (`payment` servisini çağırma) ayrı bir asenkron worker/servisin sorumluluğu olmalıdır. Bu, BFF'in hızlıca yanıt dönmesini ve provider'ın timeout'a düşmesini engeller.

- **BFF payment state mutate edebilir mi?**
  - **HAYIR.**

- **BFF order create çağırabilir mi, yoksa callback worker/owner command mı yapmalı?**
  - **CALLBACK WORKER/OWNER COMMAND YAPMALI.** `payment callback` -> `payment state mutation` -> `payment succeeded event` -> `order service consumer` -> `order create command` zinciri izlenmelidir. BFF bu zincirin hiçbir yerinde `write` veya `command` tetikleyici olmamalıdır.

## 10. Audit / Event / Outbox Boundary

- **Callback kaydı audit yerine geçer mi?**
  - **HAYIR.** `planlama/aşama-11/AUDIT_TAXONOMY.md` belgesi, `event` ve `audit`'in ayrı katmanlar olduğunu netleştirir. `ProviderCallbackRecord`, bir "olay kaydı"dır. Bu olayın işlenmesi (örn: `payment` state'inin `SUCCEEDED`'e geçmesi) ise bir "audit record" üretmelidir. Callback kaydı, audit kaydının tetikleyicisi veya bağlamı olabilir, ama onun yerine geçmez.

- **Audit/outbox business mutation yerine geçer mi?**
  - **HAYIR.** `planlama/VERI_AKISI_SENKRONIZASYON_MODELI.md` (satır 16) "önce owner truth yazılır, sonra event üretilir" kuralını koyar. `audit` ve `outbox` kayıtları, `truth` yazıldıktan sonra bu değişimi bildirmek için kullanılır, değişimin kendisi değildir.

- **Payment callback accepted/rejected/duplicate/failed kayıtları hangi audit/event seviyesinde görünmeli?**
  - **Event Seviyesi:** Bunlar operasyonel olaylardır. `ProviderCallbackRecord` tablosunda `processingStatus` olarak tutulur. `payment.callback.received`, `payment.callback.processed`, `payment.callback.rejected` gibi `event`'ler (düşük seviyeli, sistemsel) üretilebilir.
  - **Audit Seviyesi:** Eğer `rejected` bir callback bir güvenlik alarmı (`signature_failed`) tetiklerse, bu bir `risk` veya `security` audit kaydı oluşturabilir. `duplicate` veya `accepted` genellikle audit'lik bir durum değildir, ancak işlenip bir `payment` state'ini `FAILED` yapması `payment_transition` audit'i üretir.

- **Event publish varsa owner truth yazıldıktan sonra mı olmalı?**
  - **EVET.** Bu, "transactional outbox" pattern'inin temelidir ve `planlama/VERI_AKISI_SENKRONIZASYON_MODELI.md`'de zorunlu kılınmıştır. Önce `payment` veritabanında state'i güncellenir, aynı transaction içinde `outbox` tablosuna `payment.succeeded` event'i yazılır. Transaction başarılı olursa, ayrı bir süreç outbox'tan event'i okuyup message broker'a (örn: RabbitMQ, Kafka) yayınlar.

## 11. Payment Callback Implementation Seçenekleri

**A) Sadece callback ingestion + persistence**
- **Artıları:** En basit ve en güvenli ilk adım. Sisteme dışarıdan veri alıp kaydetme yeteneği kazandırır, ancak hiçbir `truth` değiştirmez. Risk düşüktür.
- **Riskleri:** Tek başına bir iş değeri üretmez. Callback'ler birikir ama işlenmez.
- **Yasakları:** Bu aşamada asla domain (payment, order) state'i değiştirilmemelidir.
- **Kabul Kanıtı:** Provider'dan gelen bir test callback'inin `provider_callback_events` tablosuna `processingStatus: 'received'` olarak başarıyla yazıldığının doğrulanması.
- **Hangi aşamada yapılmalı:** **10C1.** Bu en temel adımdır.

**B) Ingestion + payment owner command handoff**
- **Artıları:** Callback'leri gerçek iş mantığına bağlar. `payment` state'ini güncelleyerek sistemin en kritik eksiğini kapatır.
- **Riskleri:** Hatalı bir `command` (örn: yanlış state'e geçiş) `payment` truth'unu bozabilir. İmza doğrulaması olmadan yapılırsa çok tehlikelidir.
- **Yasakları:** `order` veya `settlement` gibi diğer domain'leri doğrudan çağırmamalıdır. Sadece `payment` owner'ına `command` göndermelidir.
- **Kabul Kanıtı:** Başarılı bir "succeeded" callback sonrası ilgili `payment` entity'sinin state'inin `SUCCEEDED` olarak güncellendiğinin ve `payment.succeeded` outbox event'inin üretildiğinin doğrulanması.
- **Hangi aşamada yapılmalı:** **10C2 veya 10C3.** İmza doğrulama (10C2) ile birlikte yapılmalıdır.

**C) Ingestion + payment owner command + order creation handoff**
- **Artıları:** Uçtan uca bir akışın küçük bir parçasını tamamlar. Callback'in sipariş yaratma sürecini tetiklediğini gösterir.
- **Riskleri:** Aşamaları birleştirmek karmaşıklığı ve hata riskini artırır. `payment` ve `order` arasındaki sınırın bulanıklaşma riski vardır.
- **Yasakları:** Callback worker'ı doğrudan `order` servisini çağırmamalıdır. `payment succeeded` event'ini dinleyen ayrı bir `order` consumer olmalıdır.
- **Kabul Kanıtı:** Başarılı bir callback'in `payment` state'ini güncellemesi ve ardından üretilen event ile yeni bir `order`'ın `CREATED` statüsünde oluşturulması.
- **Hangi aşamada yapılmalı:** **10D veya sonrası.** Önce `payment` domain'inin kendi iç bütünlüğü sağlanmalıdır.

**D) Reconciliation-first yaklaşım**
- **Artıları:** En savunmacı ve sağlam yaklaşım. Callback'e güvenmek yerine, sistemin kendisinin aktif olarak provider'ı sorgulamasını sağlar. `unknown_result` senaryolarını çözer.
- **Riskleri:** Daha karmaşık bir implementasyon gerektirir (zamanlanmış görevler, state yönetimi vb.). Provider API'larına ek yük getirir.
- **Kabul Kanıtı:** `unknown_result` durumundaki bir ödemenin, zamanlanmış bir iş tarafından provider'dan sorgulanarak nihai `SUCCEEDED` veya `FAILED` durumuna getirildiğinin kanıtlanması.
- **Hangi aşamada yapılmalı:** **10C veya 10D.** Callback ingestion ile paralel veya hemen sonrasında geliştirilmesi gereken kritik bir parçadır.

## 12. Önerilen İlk Payment Callback Sırası

- **10C1: Callback Ingestion & Persistence Foundation**
  - **Amaç:** Sadece gelen provider callback'lerini alacak bir BFF endpoint'i oluşturmak ve bunları hiçbir iş mantığı olmadan `provider_callback_events` tablosuna kaydetmek.
  - **Scope:** BFF'e `/callbacks/payment` endpoint'i eklenir. Gelen isteği ham olarak `ProviderCallbackEventRepository.insert` ile kaydeder. `processingStatus` hep `received` olur.
  - **Dışarıda Bırakılacaklar:** İmza doğrulama, domain mantığı, state güncelleme.
  - **Test/Smoke Kanıtı:** Postman/curl ile endpoint'e gönderilen sahte bir callback payload'unun veritabanına yazıldığının doğrulanması.
  - **Neden bu sırada:** En az riskli, en temel ve diğer tüm adımların ön koşulu olan adımdır.

- **10C2: Signature Verification Guard**
  - **Amaç:** Gelen callback'lerin imzasını doğrulamak ve sahte istekleri reddetmek.
  - **Scope:** Bir "Signature Verification" servisi/helper'ı oluşturulur. Ingestion süreci, kaydetmeden önce bu servisi çağırır. Sonuç (`verificationStatus`, `signatureVerified`) `ProviderCallbackRecord`'a yazılır. İmza başarısızsa `processingStatus` `rejected` olur.
  - **Dışarıda Bırakılacaklar:** Domain mantığı, state güncelleme.
  - **Test/Smoke Kanıtı:** Geçerli ve geçersiz imzalara sahip test callback'lerinin doğru `verificationStatus` ve `processingStatus` ile kaydedildiğinin doğrulanması.
  - **Neden bu sırada:** Güvenlik, iş mantığından önce gelir. Güvenilmeyen bir veriyi işlemeye başlamak anlamsızdır.

- **10C3: Basic Payment State Command Handoff**
  - **Amaç:** Doğrulanmış ve `succeeded`/`failed` gibi basit sonuçlar içeren callback'leri işleyip ilgili `payment` state'ini güncellemek.
  - **Scope:** `processingStatus`'u `received` olan kayıtları periyodik olarak okuyan bir worker oluşturulur. Bu worker, callback payload'unu yorumlar ve ilgili `payment` için `TransitionPaymentToSucceeded` veya `TransitionPaymentToFailed` gibi bir komut çalıştırır. İşlenen kaydın `processingStatus`'unu `processed` yapar.
  - **Dışarıda Bırakılacaklar:** `order` veya `settlement` etkileşimi, karmaşık `pending` veya `unknown` durumları.
  - **Test/Smoke Kanıtı:** Bir `payment`'ı `INITIATED` yaptıktan sonra, "succeeded" callback'i gönderildiğinde `payment`'ın state'inin `SUCCEEDED`'e geçtiğinin ve `payment.succeeded` outbox event'inin üretildiğinin doğrulanması.
  - **Neden bu sırada:** Temel `payment` döngüsünü kapatır ve callback mekanizmasına ilk gerçek iş değerini kazandırır.

- **10C4: Reconciliation for Unknown Results**
  - **Amaç:** `initiatePayment` sırasında `unknown_result` dönen veya hiç callback almayan ödemeleri belirli aralıklarla provider'dan sorgulamak.
  - **Scope:** `payment` state'i belirli bir süredir `INITIATED` veya `PENDING`'de kalmış olan kayıtları sorgulayan zamanlanmış bir görev (cron job/scheduled worker) oluşturulur. Provider API'ını çağırır ve sonucu `10C3`'teki gibi işler.
  - **Dışarıda Bırakılacaklar:** Karmaşık retry mekanizmaları.
  - **Test/Smoke Kanıtı:** `unknown_result` senaryosu ile bir ödeme oluşturup, reconciliation job'ının bu ödemeyi bulup state'ini güncellediğini doğrulamak.
  - **Neden bu sırada:** Sistemin sağlamlığını artırır ve sadece callback'e bağımlı kalmasını engeller. "Happy path" dışındaki en yaygın sorunu çözer.

- **10C5: Full Lifecycle & Edge Case Handling**
  - **Amaç:** `pending`, `cancelled`, `expired` gibi tüm callback türlerini işlemek ve daha karmaşık hata durumlarını yönetmek.
  - **Scope:** `10C3`'teki worker'ı tüm `payment` state'lerini yönetecek şekilde genişletmek. Hata loglama ve alert mekanizmalarını iyileştirmek.
  - **Dışarıda Bırakılacaklar:** Diğer domain'lere entegrasyon.
  - **Test/Smoke Kanıtı:** Her bir ara durum (pending, cancelled vb.) için callback gönderip `payment` state'inin doğru güncellendiğini test etmek.
  - **Neden bu sırada:** `payment` domain'inin callback kaynaklı tüm state geçişlerini eksiksiz tamamlamasını sağlar ve sistemi daha olgun hale getirir.

## 13. Payment Callback İçin Nihai Karar

**PAYMENT DOMAIN INVENTORY COMPLETE / IMPLEMENTATION REQUIRED**

Bu envanter, payment callback domain'inin mevcut durumunu, sınırlılıklarını ve potansiyelini ortaya koymuştur. `HARDENING-10A` ile atılan temeller sağlamdır, ancak sistemin asenkron provider olaylarını işleyebilmesi için gerçek bir implementasyona acilen ihtiyaç duyulmaktadır.

**Net Öneri:**
İlk gerçek implementasyon, doğrudan `payment`-spesifik işlemeye odaklanmamalıdır. Önce, tüm provider callback'leri için ortak olan, güvenli ve soyut bir **"BFF Callback Ingestion Boundary"** kurulmalıdır. Bu boundary, gelen tüm callback'leri (payment, shipment, vb.) alıp, imza doğrulamasını yapıp, standart bir `ProviderCallbackRecord` formatında güvenli bir şekilde persistence katmanına yazmaktan sorumlu olmalıdır.

Payment processing'e geçmeden önce **zorunlu** olan guard'lar şunlardır:
1.  **BFF Ingestion Endpoint:** Public endpoint.
2.  **Signature Verification Guard:** Sahte ve bozuk istekleri reddetmek için.
3.  **Idempotency/Replay Guard:** `providerEventId` ile duplicate işlemeyi engellemek için.
4.  **Persistence Layer:** Callback'leri daha sonra işlenmek üzere güvenilir bir şekilde kaydetmek için.

Bu temel guard'lar olmadan `payment` domain'ini doğrudan callback işlemeye açmak, ciddi güvenlik ve tutarlılık riskleri doğuracaktır.

## 14. Açık Riskler / Sonraki Kontrol

- **Postgres idempotency_key conflict davranışı:** Mevcut `insert` sorgusu, `idempotency_key` çakışmasında hata fırlatır. Uygulama katmanının bu hatayı yakalayıp zarif bir şekilde yönetmesi gerekir. Bu test edilmemiştir.
- **Real signature verification:** İmza doğrulama mantığı henüz gerçek kod olarak yazılmamıştır.
- **Reconciliation runtime:** `unknown_result` senaryoları için aktif bir sorgulama mekanizması yoktur.
- **Duplicate order guard:** `order` servisindeki idempotency koruması güçlü görünse de, `payment` ve `order` arasındaki asenkron iletişimde yaşanabilecek edge case'lere karşı uçtan uca test edilmemiştir.
- **Unknown-result payment follow-up:** Reconciliation olmadığından bu akış tamamen kırıktır.
- **Risk/fraud signal linkage:** Hangi callback senaryolarının (örn: sahte imza, anormal frekans) hangi risk sinyallerini üreteceği tanımlanmalı ve implemente edilmelidir.
- **Finance/settlement trigger boundary:** `payment succeeded` event'inden `settlement` sürecinin tetiklenmesine kadar olan asenkron akışın sağlamlığı ve hata yönetimi (örn: event-bus çalışmazsa ne olur?) test edilmemiştir.
