# HARDENING-10B-00D — Notification Delivery Callback Inventory

## 1. Genel Durum

- **Notification delivery callback bugün repo’da var mı?**
  - **HAYIR.** Kod tabanında (`services/notification`, `apps/bff`) gelen bir email/SMS/push delivery callback’ini işleyecek, doğrulayacak veya bir domain mantığını tetikleyecek bir bileşen (örn: webhook endpoint, worker, consumer) bulunmamaktadır. `HARDENING-10B-00A` raporu da bu durumu teyit etmektedir. `services/notification/src/notification.ts` ve `provider-adapter.ts` dosyaları incelendiğinde, mevcut altyapının sadece giden (outbound) bildirim denemelerini (`delivery attempts`) ve bunların `sandbox`/`parked`/`not_configured` modlarında simülasyonunu kapsadığı görülmektedir.

- **10A foundation notification callback için ne sağlıyor?**
  - `HARDENING-10A` serisi, notification delivery callback dahil olmak üzere tüm provider callback’leri için temel yapı taşlarını (foundation) atmıştır. Bunlar:
    - **Contract:** `ProviderCallbackEnvelope`, `ProviderCallbackRecord` ve imza doğrulama (`SignatureVerificationResult`) gibi standartlaştırılmış veri sözleşmeleri `packages/contracts/src/provider.ts` dosyasına eklenmiştir. Bu sözleşmeler, provider’dan gelen bilginin bir "iş gerçeği" değil, bir "olay kaydı" olduğunu `boundary: { businessTruthMutated: false }` bayrağı ile zorunlu kılar.
    - **Persistence:** Gelen callback olaylarını saklamak için `provider_callback_events` tablosu (`infra/migrations/20260504_001_provider_callback_persistence.sql`) ve bu tabloya erişimi soyutlayan `ProviderCallbackEventRepository` (`packages/persistence/src/provider-callback.ts`) eklenmiştir.
    - **Idempotency:** `provider_event_id` üzerinden duplicate kayıtları veritabanı seviyesinde önleyecek mekanizmalar (UNIQUE index) migration’a dahil edilmiştir.
    - **Smoke Test:** In-memory repository’nin temel `insert`/`find`/`update` ve idempotency davranışlarını doğrulayan `tests/smoke/suites/provider-callback-foundation.ts` smoke testi eklenmiştir.

- **Hangi parçalar hâlâ eksik?**
  - `HARDENING-10B-00A` raporunda da belirtildiği gibi, en temel parçalar eksiktir:
    - **BFF Callback Endpoint:** Dış dünyadan (örn: SendGrid, Twilio) gelen HTTP POST isteklerini alacak public bir endpoint yoktur.
    - **Signature Verification Logic:** İmza doğrulama sözleşmeleri olsa da, gerçek kriptografik doğrulama mantığı (`HMAC-SHA256` vb.) yazılmamıştır.
    - **Domain Processing Logic:** Kaydedilen bir `ProviderCallbackRecord`'u okuyup, "bu bir başarılı teslimat mı?", "hangi notification delivery attempt'e ait?" gibi soruları cevaplayacak ve `notification` owner command'ını tetikleyecek bir iş mantığı (worker/consumer) yoktur.
    - **Provider-Specific Mapping:** Farklı provider’lardan gelen payload’ları ortak `ProviderCallbackRecord` formatına dönüştürecek bir `mapping` katmanı yoktur.
    - **Reconciliation Runtime:** Callback gelmediğinde veya provider'dan `unknown_result` alındığında durumu sorgulayacak bir "reconciliation" mekanizması yoktur.

## 2. Notification Sistem Sınırı
Açık yaz:
- Notification sistemi sipariş, ödeme, shipment, payout veya analytics truth owner değildir. Bu, `planlama/19- bildirim sistemi.md` ve `planlama/aşama-2/OWNER_MATRIX.md` dokümanlarındaki temel mimari kararıdır.
- Notification delivery provider response business truth değildir. Bu, `packages/contracts/src/provider.ts` dosyasındaki `ProviderBoundaryFlags` sözleşmesiyle (`businessTruthMutated: false`) kod seviyesinde zorunlu kılınmıştır.
- Provider delivery callback sadece notification delivery attempt/status sinyalidir. Bir "sinyal"dir, "kesin gerçek" (truth) değildir.
- Notification callback başka domain state mutate edemez. Bir `notification.delivered` olayı, `order.completed` veya `shipment.delivered` gibi bir state'i doğrudan değiştiremez.
- Delivery callback analytics’e sinyal verebilir ama analytics karar/truth owner değildir. `planlama/48-arka paln analatik ölçümleme sistemi.md` (satır 60) analitik sisteminin karar vermediğini, sadece karar sistemlerini beslediğini belirtir.

## 3. Notification Delivery Callback Ne Temsil Eder?
Şunları ayrıştır:
- **provider delivery event notification:** Evet, callback özünde provider'ın kendi sisteminde bir olay (örn: "email delivered", "sms failed") olduğunu bizim sisteme bildirmesidir.
- **delivery attempt result signal:** Evet, gelen callback'in içeriği (payload), `services/notification/src/notification.ts` içinde oluşturulan bir `NotificationDeliveryAttempt`'in sonucu hakkında güçlü bir sinyal içerir.
- **channel-specific result: email / sms / push:** Evet, callback kanala özgü bilgiler taşır (örn: email bounce sebebi, push token'ın geçersiz olması).
- **raw provider payload:** Evet, callback'in gövdesi (body), provider'ın kendine özgü formatında gönderdiği ham veridir. Bu, `ProviderCallbackRecord` içindeki `rawPayload` alanına dokunulmadan kaydedilmelidir.
- **provider message id / delivery id:** Evet, bu referanslar, callback'i bizim sistemimizdeki doğru `deliveryAttempt` ile eşleştirmek için kritik öneme sahiptir.
- **verification result:** Callback, işleme alınmadan önce bir imza doğrulama (`SignatureVerificationResult`) ve tekrar/kopya (`replayDetected`) kontrolünden geçmelidir.
- **replay/idempotency status:** Evet, callback işlenirken `providerEventId` kullanılarak bunun daha önce işlenip işlenmediği kontrol edilir. Sonuç `first_seen`, `duplicate_event` gibi bir `replayStatus` olarak kaydedilir.
- **notification owner update adayı:** Evet, en önemli tanım budur. Doğrulanmış, kopyası olmayan ve geçerli bir callback, `notification` domain'i için bir "delivery attempt state transition" işlemini tetikleyecek bir "aday"dır.

**Açık yaz:**
Notification delivery callback doğrudan “user saw notification”, “order updated”, “payment changed”, “shipment changed” veya “analytics truth” anlamına gelmez.

## 4. Notification Callback Event / Status Modeli

Aşağıdaki provider durumları, `packages/contracts/src/provider.ts` ve `packages/contracts/src/notification.ts` sözleşmeleri temel alınarak yorumlanmıştır.

- **accepted / sent:**
  - `callback record processingStatus`: `accepted` -> `processed`.
  - `notification owner command`’a dönüşebilir mi?: Evet, `MarkDeliveryAttemptAsAccepted` veya `MarkDeliveryAttemptAsSent` gibi bir ara durumu güncelleyen bir komuta dönüşebilir.
  - `delivery attempt/status etkisi`: `NotificationDeliveryAttempt`'in `state`'ini `PROVIDER_ACCEPTED` veya `SENT` gibi bir duruma günceller.
  - `analytics event/signal etkisi`: Evet, `notification.delivery.sent` gibi bir analitik olayı tetikleyebilir.
  - `başka domain truth etkisi`: **Hayır.**
  - Hangi durumda sadece kayıt/ignored kalmalı?: `deliveryAttempt` zaten daha ileri bir durumdaysa (örn: `delivered`).

- **delivered:**
  - `callback record processingStatus`: `accepted` -> `processed`.
  - `notification owner command`’a dönüşebilir mi?: Evet, `MarkDeliveryAttemptAsDelivered` komutunu tetikler.
  - `delivery attempt/status etkisi`: `NotificationDeliveryAttempt`'in `state`'ini `DELIVERED` olarak günceller.
  - `analytics event/signal etkisi`: Evet, `notification.delivery.succeeded` analitik olayını tetikleyebilir. Bu, funnel analizleri için önemlidir.
  - `başka domain truth etkisi`: **Hayır.**
  - Hangi durumda sadece kayıt/ignored kalmalı?: `deliveryAttempt` zaten `DELIVERED` ise (`duplicate`).

- **failed / bounced / blocked:**
  - `callback record processingStatus`: `accepted` -> `processed`.
  - `notification owner command`’a dönüşebilir mi?: Evet, `MarkDeliveryAttemptAsFailed` komutunu, `failureReason` ile birlikte tetikler.
  - `delivery attempt/status etkisi`: `NotificationDeliveryAttempt`'in `state`'ini `FAILED` olarak ve hata detayını (`error` alanı) günceller.
  - `analytics event/signal etkisi`: Evet, `notification.delivery.failed` analitik olayını, `reason` ile birlikte (örn: `invalid_address`, `bounce`) tetikleyebilir.
  - `başka domain truth etkisi`: **Hayır.** Bir sipariş bildiriminin `failed` olması, siparişin kendisinin başarısız olduğu anlamına gelmez.
  - Hangi durumda sadece kayıt/ignored kalmalı?: `deliveryAttempt` state'i zaten nihai bir durumdaysa.

- **spam_reported:**
  - `callback record processingStatus`: `accepted` -> `processed`.
  - `notification owner command`’a dönüşebilir mi?: Evet, `MarkDeliveryAsSpam` komutunu tetikleyebilir. Bu, gelecekteki bildirim tercihlerini etkileyebilir.
  - `delivery attempt/status etkisi`: `NotificationDeliveryAttempt` state'ini `SPAM_REPORTED` yapabilir.
  - `analytics event/signal etkisi`: Evet, `notification.user.feedback` veya `risk` sinyali olarak `spam_reported` olayı tetikleyebilir.
  - `başka domain truth etkisi`: **Hayır.**
  - Hangi durumda sadece kayıt/ignored kalmalı?: İlgili `deliveryAttempt` için daha önce işlenmişse.

- **opened / clicked:**
  - `callback record processingStatus`: `accepted` -> `processed`.
  - `notification owner command`’a dönüşebilir mi?: **Hayır, doğrudan değil.** Bu olaylar `notification` entity'sinin `state`'ini (`UNREAD` -> `READ`) **değiştirmemelidir.** Bu, kullanıcının uygulamaya girip bildirimi görmesiyle tetiklenmesi gereken bir eylemdir. Bu callback'ler sadece davranışsal sinyaldir.
  - `delivery attempt/status etkisi`: `NotificationDeliveryAttempt`'in `state`'ini etkilemez. Ayrı bir `engagement` kaydı olarak tutulabilir.
  - `analytics event/signal etkisi`: **Evet, kesinlikle.** `notification.engagement.opened`, `notification.engagement.clicked` gibi çok değerli davranışsal analitik olayları tetikler.
  - `başka domain truth etkisi`: **Hayır.**
  - Hangi durumda sadece kayıt/ignored kalmalı?: Aynı `open`/`click` olayı için birden fazla callback gelirse (idempotency).

- **unsubscribed:**
  - `callback record processingStatus`: `accepted` -> `processed`.
  - `notification owner command`’a dönüşebilir mi?: Evet, ilgili kullanıcı/kanal için `UpdateNotificationPreference` gibi bir komutu tetikleyebilir.
  - `delivery attempt/status etkisi`: Bu, `deliveryAttempt`'i değil, kullanıcı tercihlerini etkiler.
  - `analytics event/signal etkisi`: Evet, `notification.preference.updated` analitik olayını tetikleyebilir.
  - `başka domain truth etkisi`: **Hayır.**
  - Hangi durumda sadece kayıt/ignored kalmalı?: Tercih zaten güncellenmişse.

- **unknown_result:**
  - `callback record processingStatus`: `reconciliation_required`.
  - `notification owner command`’a dönüşebilir mi?: Hayır, doğrudan değil. Bir reconciliation (uzlaşma/sorgulama) sürecini tetiklemelidir.
  - `delivery attempt/status etkisi`: `NotificationDeliveryAttempt`'in `state`'ini `UNKNOWN` veya `PENDING_RECONCILIATION` yapabilir.
  - `analytics event/signal etkisi`: Evet, `notification.delivery.unknown` gibi bir operasyonel metrik olayını tetikleyebilir.
  - `başka domain truth etkisi`: **Hayır.**
  - Hangi durumda sadece kayıt/ignored kalmalı?: Her zaman işlenip bir reconciliation süreci başlatmalıdır.

- **duplicate / replay:**
  - `callback record processingStatus`: `duplicate`.
  - `notification owner command`’a dönüşebilir mi?: **Hayır.**
  - `delivery attempt/status etkisi`: **Hayır.**
  - `analytics event/signal etkisi`: Evet, `notification.callback.duplicate_ignored` gibi bir operasyonel kalite metriği üretebilir.
  - `başka domain truth etkisi`: **Hayır.**
  - Hangi durumda sadece kayıt/ignored kalmalı?: Her zaman.

- **signature_failed:**
  - `callback record processingStatus`: `rejected`.
  - `notification owner command`’a dönüşebilir mi?: **Hayır.**
  - `delivery attempt/status etkisi`: **Hayır.**
  - `analytics event/signal etkisi`: Evet, `security.incident` veya `risk.signal` olarak (`FAKE_CALLBACK_ATTEMPT` gibi) kritik bir olay üretmelidir.
  - `başka domain truth etkisi`: **Hayır.**
  - Hangi durumda sadece kayıt/ignored kalmalı?: Her zaman.

- **unsupported:**
  - `callback record processingStatus`: `ignored`.
  - `notification owner command`’a dönüşebilir mi?: **Hayır.**
  - `delivery attempt/status etkisi`: **Hayır.**
  - `analytics event/signal etkisi`: Evet, `notification.callback.unsupported` gibi bir operasyonel kalite metriği üretebilir.
  - `başka domain truth etkisi`: **Hayır.**
  - Hangi durumda sadece kayıt/ignored kalmalı?: Her zaman.

## 5. Delivery Attempt Boundary

- **Provider callback doğrudan notification status’u mutate edebilir mi?**
  - **HAYIR.** `packages/contracts/src/notification.ts` (satır 30) dosyasındaki `NotificationState` (`UNREAD`, `READ`, `ARCHIVED`), kullanıcının etkileşimiyle değişen bir durumdur. Bir provider callback'i (örn: `delivered`), bildirimin kullanıcı tarafından okunduğu anlamına gelmez ve bu `state`'i mutate etmemelidir.

- **Notification delivery attempt ile notification entity status’u nasıl ayrılmalı?**
  - `NotificationDeliveryAttempt`: Bir kanal (email, sms) üzerinden bildirimi gönderme denemesinin teknik sonucudur (`DELIVERED`, `FAILED`, `BOUNCED`). `services/notification/src/notification.ts` içindeki `deliveryAttempts` dizisinde tutulur.
  - `NotificationRecord.state`: Bildirimin kendisinin kullanıcı açısından durumudur (`UNREAD`, `READ`). Bu, kullanıcının `markNotificationRead` gibi bir eylemiyle değişir. Bu iki durum tamamen ayrı yaşam döngülerine sahiptir.

- **`Delivered` callback, notification’ın kullanıcı tarafından okunduğu anlamına gelir mi?**
  - **HAYIR, KESİNLİKLE GELMEZ.** `Delivered` sadece provider'ın bildirimi alıcının posta kutusuna veya telefonuna başarıyla ilettiği anlamına gelir. Okunduğu anlamına gelmez.

- **`Open`/`click` callback notification `read` state anlamına gelir mi?**
  - **HAYIR.** Bu çok önemli bir sınırdır. `Open`/`click` olayları güvenilmez, manipüle edilebilir ve eksik olabilir (örn: email istemcisi imajları engellerse `open` pikseli tetiklenmez). Bu olaylar `analytics` için değerli birer "davranış sinyali"dir, ancak `notification`'ın `READ` state'ini belirleyen "truth" olamazlar. `READ` state'i, kullanıcının uygulama içinde bildirimi görmesiyle tetiklenmelidir.

- **`Bounce`/`fail` callback hangi owner command ile işlenmeli?**
  - `MarkDeliveryAttemptAsFailed` gibi bir `notification` owner command'ı ile işlenmelidir. Bu command, `failureReason` (`bounced`, `invalid_address` vb.) ve hata detaylarını almalıdır.

- **Duplicate provider delivery callback ne yapmalı?**
  - `Idempotency` politikaları gereği (`planlama/aşama-3/IDEMPOTENCY_POLICIES.md`), `providerEventId` kullanılarak tespit edilmeli, `processingStatus: 'duplicate'` olarak işaretlenmeli ve herhangi bir owner command tetiklemeden işlem sonlandırılmalıdır.

**Net karar:** Provider callback notification owner’ı bypass etmemeli.

## 6. Analytics Boundary

- **Delivery callback analytics’e event olarak gönderilebilir mi?**
  - **EVET.** `notification.delivery.succeeded`, `notification.delivery.failed`, `notification.engagement.opened`, `notification.engagement.clicked` gibi olaylar, analitik için çok değerlidir ve gönderilmelidir.

- **Analytics bu event’i decision/truth gibi kullanabilir mi?**
  - **HAYIR.** `planlama/48-arka paln analatik ölçümleme sistemi.md` (satır 60) ve `packages/contracts/src/analytics.ts` (satır 95) bu kuralı net bir şekilde koyar. Analitik olayları (`AnalyticsEventRecord`) `businessTruthMutated: false` bayrağını taşır. Analytics, karar sistemlerini "besler", ancak kararın kendisi veya truth'un sahibi olamaz.

- **`Open`/`click` eventleri davranış sinyali midir, business truth mudur?**
  - **DAVRANIŞ SİNYALİDİR.** Bu olaylar, kullanıcı etkileşimine dair değerli ipuçları verir, ancak bir `notification`'ın `READ` state'i gibi bir business truth'u belirlemek için kullanılamaz.

- **Analytics eventleri notification state yerine geçebilir mi?**
  - **HAYIR.**

- **Analytics ölçümlemesi notification delivery audit yerine geçebilir mi?**
  - **HAYIR.** `planlama/aşama-11/EVENT_TAXONOMY.md` (satır 118) ve `AUDIT_TAXONOMY.md` (satır 16), event ve audit'in ayrı katmanlar olduğunu belirtir. Analitik, "kaç kişi açtı" sorusuna cevap verir. Audit ise "bu bildirim denemesi ne zaman, hangi sonuçla, hangi gerekçeyle `FAILED` oldu" gibi denetim sorularına cevap verir.

- **Notification callback analytics funnel’ı kirletmemesi için hangi guardlar gerekir?**
  - **Idempotency:** Aynı `open`/`click` olayının birden fazla analitik olayı tetiklemesi engellenmelidir. `analytics` servisinin `ingestAnalyticsEvent` fonksiyonu `idempotencyKey` kontrolü içermektedir.
  - **Bot/Spam Filtrelemesi:** Mümkünse, bilinen botlardan veya sahte görünen etkileşimlerden gelen callback'ler analitik olayına dönüştürülmemelidir. `signature_failed` bir callback asla analitik olayı üretmemelidir.
  - **Açık İsimlendirme:** `notification.opened` gibi belirsiz bir olay yerine, `notification.engagement.email_opened` gibi kaynağı ve anlamı net olan olay isimleri kullanılmalıdır.

**Net karar:** Analytics sinyal olabilir; business truth veya notification truth olamaz.

## 7. Cross-Domain Boundary

- **Notification callback payment/order/shipment/payout state değiştirebilir mi?**
  - **HAYIR, ASLA.** Bu, `planlama/aşama-2/OWNER_MATRIX.md`'deki en temel mimari kuralının ihlali olur. Bir sipariş bildiriminin `delivered` olması, `shipment`'ın state'ini `DELIVERED` yapmaz.

- **Delivery `failed` olması ilgili business action’ın başarısız olduğu anlamına gelir mi?**
  - **HAYIR.** Ödeme başarılı bildiriminin gönderilememiş olması, ödemenin başarısız olduğu anlamına gelmez.

- **Notification `delivered` olması ilgili iş olayının gerçekleştiği anlamına gelir mi?**
  - **HAYIR.** Tam tersi geçerlidir: İlgili iş olayı (`order.created`) gerçekleştiği için `notification.delivered` olayı tetiklenmiştir. Bildirimin teslimi, olayın kendisinin kanıtı değildir.

- **Notification callback support/risk/moderation gibi domainleri doğrudan tetikleyebilir mi?**
  - **HAYIR, DOĞRUDAN DEĞİL.** Ancak, bir sinyal üretebilir. Örneğin, `spam_reported` callback'i bir `risk.signal.created` olayını tetikleyebilir. Veya çok sayıda `bounced` callback'i bir `support.case.created` olayını tetikleyebilir. Ancak bu tetikleme, `notification` servisinin `risk` veya `support` owner'ına `command` göndermesiyle değil, bir `event` yayınlaması ve ilgili servislerin bu `event`'i dinlemesiyle (event-driven) olmalıdır.

- **Risk sinyali gerekiyorsa hangi durumda ve hangi boundary ile olmalı?**
  - **Durumlar:** `spam_reported`, `signature_failed`, anormal sıklıkta `bounce`/`fail`.
  - **Boundary:** `notification` servisi, bir `NotificationAnomalyDetected` gibi bir olay yayınlar. `risk` servisi bu olayı dinler ve bir `RiskCase` oluşturur. `notification` servisi doğrudan `risk` servisinin `CreateRiskCase` command'ını çağırmaz.

## 8. Idempotency / Replay / Duplicate Risk

- **`providerEventId` ne için kullanılmalı?**
  - `planlama/aşama-3/IDEMPOTENCY_POLICIES.md` belgesine göre, bu alan provider'dan gelen her bir olayın (webhook) sisteme **yalnızca bir kez** kaydedilmesini ve işlenmesini sağlamak için birincil anahtar olarak kullanılmalıdır. Bu, "event-level idempotency" sağlar. `ProviderCallbackEventRepository` bu alanı `UNIQUE INDEX` ile korur.

- **`provider message id` / `delivery id` ne için kullanılmalı?**
  - Bu referanslar, gelen callback'i bizim sistemimizdeki doğru `NotificationDeliveryAttempt` kaydı ile **eşleştirmek** için kullanılır.

- **`notification id` / `delivery attempt id` ne için kullanılmalı?**
  - Bunlar bizim iç sistemimizdeki primary key'lerdir. `delivery id` (veya `delivery attempt id`), callback'ten gelen `provider message id` ile eşleştirildikten sonra, hangi `deliveryAttempt`'in state'inin güncelleneceğini belirlemek için kullanılır.

- **duplicate `delivered`/`open`/`click` callback nasıl yönetilmeli?**
  - `providerEventId` ile `ProviderCallbackEventRepository` seviyesinde yakalanmalıdır. Repository'nin `insert` metodu, `ON CONFLICT` kuralı sayesinde duplicate kaydı engeller. Servis mantığı, bu duplicate durumunu `processingStatus: 'duplicate'` olarak işaretlemeli ve herhangi bir command/event tetiklemeden işlemi sonlandırmalıdır.

- **`open`/`click` gibi çoklu eventler single-event mi, append-only event stream mi olmalı?**
  - **APPEND-ONLY EVENT STREAM** olarak ele alınmalıdır. Bir kullanıcı bir e-postayı birden çok kez açabilir. Her `open` callback'i (eğer farklı `providerEventId`'lere sahipse) ayrı bir analitik olayı olarak kaydedilebilir. Ancak bu, `notification`'ın `READ` state'ini tekrar tekrar değiştirmez.

- **provider retry nedeniyle aynı delivery callback tekrar gelirse ne yapılmalı?**
  - Eğer provider aynı `providerEventId` ile tekrar gönderiyorsa, veritabanındaki `UNIQUE INDEX` sayesinde mükerrer kayıt engellenir ve işlem tekrarlanmaz. Eğer farklı `providerEventId` ile gönderiyorsa, bu yeni bir olay olarak kabul edilir, ancak state machine guard'ları (örn: zaten `DELIVERED` olan bir denemeyi tekrar `DELIVERED` yapmaya çalışmak) anlamsız state geçişlerini engellemelidir.

- **Postgres `idempotency_key` conflict limiti notification callback için risk oluşturur mu?**
  - Evet, `HARDENING-10B-00A` (satır 60-62) ve `10B-00B` (satır 169-171) raporlarında belirtildiği gibi, `PostgresProviderCallbackEventRepository`'nin `insert` sorgusu `idempotency_key` için `ON CONFLICT` kuralı içermiyor. Migration'da `UNIQUE INDEX` olduğu için, duplicate bir `idempotency_key` ile `insert` denemesi veritabanı hatası fırlatacak ve uygulama çökebilecektir. Bu bir risktir ve uygulamanın bu hatayı yakalayıp yönetmesi gerekir.

## 9. Security / Signature / Config Boundary

- **Signature verification olmadan notification callback processing yapılabilir mi?**
  - **HAYIR, KESİNLİKLE YAPILMAMALI.** `planlama/10-00-PROVIDER-CALLBACK-WEBHOOK-RECONCILIATION-INVENTORY.md` belgesinde bu P1/P0 seviyesinde bir risk olarak tanımlanmıştır. İmzasız bir callback sahte olabilir ve bu, sahte analitik olaylarına, yanlış risk sinyallerine veya kullanıcı tercihlerinin yanlış güncellenmesine yol açabilir.

- **Provider secret/env nerede yönetilmeli?**
  - `planlama/KONFIGURASYON_YONETIMI.md` (satır 51-80) belgesine göre, bu tür sırlar (`C0 — Secret config`) bir "secret manager" (örn: HashiCorp Vault, AWS Secrets Manager) içinde yönetilmelidir.

- **Public webhook endpoint rate limit / abuse guard gerektirir mi?**
  - **EVET.** DDoS saldırılarını ve anlamsız isteklerle sistemi yormayı engellemek için rate limiting, IP filtreleme gibi temel korumalar zorunludur.

- **Fake `delivery`/`open`/`click` callback riski nasıl sınırlanmalı?**
  - Güçlü imza doğrulaması (Signature Verification) ile sınırlanır. `signature_failed` olan callback'ler `rejected` olarak işaretlenmeli ve asla işlenmemelidir.

- **Replay callback riski nasıl sınırlanmalı?**
  - `providerEventId` ile idempotency kontrolü ve potansiyel olarak callback payload'undaki bir `timestamp` kontrolü (belirli bir zaman penceresi dışındaki eski callback'leri reddetme) ile sınırlanır.

## 10. BFF Boundary

- **BFF notification callback endpoint açılırsa ne yapabilir?**
  - `planlama/VERI_AKISI_SENKRONIZASYON_MODELI.md` (satır 343) ve `planlama/aşama-2/OWNER_MATRIX.md` (satır 207-226) uyarınca BFF'in rolü çok sınırlıdır:
    1. Gelen isteği almak (ingestion).
    2. İsteği, asenkron işlenmek üzere bir `Callback Ingestion Service/Worker`'a (örn: bir message queue üzerinden) **hemen** paslamak.
    3. Provider'a hızlı bir `200 OK` veya `202 Accepted` yanıtı dönerek bağlantıyı sonlandırmak.

- **BFF truth owner olabilir mi?**
  - **HAYIR.**

- **BFF notification state mutate edebilir mi?**
  - **HAYIR.**

- **BFF analytics event üretebilir mi?**
  - **HAYIR, DOĞRUDAN ÜRETMEMELİDİR.** Callback'i işleyen asenkron worker, analitik olayını üretmelidir. BFF, sadece kendi tetiklediği olaylar için (örn: `bff.request.received`) analitik olayı üretebilir.

- **BFF sadece ingestion + async handoff mı yapmalı?**
  - **EVET.** İmza doğrulama, persistence ve domain mantığı gibi ağır işlemler asenkron bir worker/servisin sorumluluğu olmalıdır.

- **Persistence ve owner command handoff BFF içinde mi, worker içinde mi olmalı?**
  - **WORKER İÇİNDE OLMALI.** Bu, BFF'in hızlıca yanıt dönmesini ve provider'ın timeout'a düşmesini engeller.

## 11. Audit / Event / Outbox Boundary

- **Callback kaydı audit yerine geçer mi?**
  - **HAYIR.** `planlama/aşama-11/AUDIT_TAXONOMY.md` (satır 16) bu ayrımı netleştirir. `ProviderCallbackRecord`, bir "olay kaydı"dır. Bu olayın işlenmesi sonucu `notification.deliveryAttempt`'in state'inin `FAILED`'e geçmesi gibi bir "business mutation" ise bir `audit record` üretmelidir.

- **Delivery attempt update audit/outbox gerektirir mi?**
  - **EVET.** Özellikle `FAILED` veya `SPAM_REPORTED` gibi operasyonel olarak önemli state değişiklikleri, denetlenebilirlik için `audit` kaydı ve diğer sistemleri bilgilendirmek için `outbox` olayı üretmelidir. `services/notification/src/notification.ts` (satır 345) zaten `appendAuditAndOutbox` fonksiyonunu kullanmaktadır.

- **`Open`/`click` events audit mi analytics mi?**
  - **ANALYTICS.** Bu olaylar denetimlik bir "karar" veya "state değişimi" değil, bir "davranış"tır. Bu nedenle `analytics` kapsamına girerler.

- **Notification `delivery failed` event’i ne zaman üretilmeli?**
  - `notification` servisi, `MarkDeliveryAttemptAsFailed` komutunu başarıyla işleyip `deliveryAttempt`'in state'ini veritabanında güncelledikten sonra, aynı transaction içinde `outbox` tablosuna bir `notification.delivery.failed` olayı yazmalıdır.

- **Event publish varsa owner truth yazıldıktan sonra mı olmalı?**
  - **EVET.** Bu, `planlama/VERI_AKISI_SENKRONIZASYON_MODELI.md`'de zorunlu kılınan "transactional outbox" pattern'inin temel kuralıdır.

## 12. Notification Callback Implementation Seçenekleri

- **A) Sadece callback ingestion + persistence**
  - **Artıları:** En güvenli ilk adım. Sisteme dışarıdan veri alıp kaydetme yeteneği kazandırır ama hiçbir `truth` değiştirmez. Risk düşüktür.
  - **Riskleri:** Tek başına bir iş değeri üretmez.
  - **Yasakları:** Domain state'i (`deliveryAttempt.state`) değiştirilmemelidir.
  - **Kabul Kanıtı:** Bir test callback'inin `provider_callback_events` tablosuna `processingStatus: 'received'` olarak yazılması.
  - **Hangi aşamada yapılmalı:** İlk adım olarak idealdir.

- **B) Ingestion + notification delivery attempt update**
  - **Artıları:** Callback'leri gerçek iş mantığına bağlar. `deliveryAttempt` state'ini güncelleyerek bildirimlerin teknik teslimat durumunu görünür kılar.
  - **Riskleri:** Hatalı bir mantık, teslimat durumunu yanlış gösterebilir. İmza doğrulaması olmadan yapılırsa tehlikelidir.
  - **Yasakları:** `notification.state` (`READ`/`UNREAD`) değiştirilmemelidir. Diğer domain'ler (`order`, `shipment`) çağrılmamalıdır.
  - **Kabul Kanıtı:** Başarılı bir "delivered" callback sonrası ilgili `deliveryAttempt`'in state'inin `DELIVERED` olarak güncellenmesi.
  - **Hangi aşamada yapılmalı:** İkinci adım olabilir.

- **C) Ingestion + delivery/open/click analytics signal**
  - **Artıları:** Kullanıcı etkileşimine dair çok değerli analitik veriler sağlar. Ürün ve pazarlama ekipleri için önemlidir.
  - **Riskleri:** Analitik olaylarının kirlenmesi (duplicate, bot). `open`/`click` olaylarının yanlışlıkla `READ` state'ini değiştirmesi riski.
  - **Yasakları:** `notification.state` değiştirilmemelidir.
  - **Kabul Kanıtı:** Bir "opened" callback sonrası `analytics` sisteminde `notification.engagement.opened` olayının göründüğünün doğrulanması.
  - **Hangi aşamada yapılmalı:** B adımıyla paralel veya hemen sonrasında yapılabilir.

- **D) Ingestion + notification owner event/outbox**
  - **Artıları:** Bildirim teslimat sonuçlarını (`failed`, `spam_reported`) diğer sistemlere (örn: `risk`, `support`) yayarak daha karmaşık iş akışlarını mümkün kılar.
  - **Riskleri:** Event'lerin yanlış sistemler tarafından tüketilip istenmeyen yan etkiler yaratması.
  - **Yasakları:** Olaylar, `notification` owner'ı state'i güncelledikten sonra "transactional outbox" ile yayınlanmalıdır.
  - **Kabul Kanıtı:** Bir "bounced" callback sonrası, `support` sisteminde bir ticket oluşturulmasını tetikleyen `notification.delivery.failed` olayının yayınlanması.
  - **Hangi aşamada yapılmalı:** Daha olgun bir aşamada.

- **E) Reconciliation/provider status polling yaklaşımı**
  - **Artıları:** En sağlam yaklaşım. Callback'e güvenmek yerine, sistemin kendisinin aktif olarak provider'ı sorgulamasını sağlar. `unknown_result` veya "kayıp callback" senaryolarını çözer.
  - **Riskleri:** Daha karmaşık bir implementasyon gerektirir (zamanlanmış görevler vb.). Provider API'larına ek yük getirir.
  - **Kabul Kanıtı:** `SENT` durumunda kalmış bir bildirimin, zamanlanmış bir iş tarafından sorgulanarak nihai `DELIVERED` veya `FAILED` durumuna getirildiğinin kanıtlanması.
  - **Hangi aşamada yapılmalı:** B adımıyla paralel veya hemen sonrasında geliştirilmesi gereken kritik bir parçadır.

## 13. Önerilen İlk Notification Callback Sırası

- **10N1: Ortak Callback Ingestion & Signature Guard**
  - **Amaç:** `10B-00B` ve `10B-00C` raporlarında da önerildiği gibi, tüm provider callback'leri (payment, shipment, notification vb.) için ortak, güvenli bir "BFF Ingestion Boundary" kurmak. Bu boundary, gelen isteği alır, imzasını doğrular ve asenkron işlenmek üzere kaydeder.
  - **Scope:** Genel bir `/callbacks/{provider}` endpoint'i. İmza doğrulama ve `provider_callback_events` tablosuna `received`/`rejected` olarak kaydetme mantığını içeren bir worker.
  - **Dışarıda bırakılacaklar:** Tüm domain-spesifik mantık.
  - **Test/Smoke Kanıtı:** Sahte bir notification callback'inin, geçerli/geçersiz imza ile `provider_callback_events` tablosuna doğru `verificationStatus` ile yazılması.
  - **Neden bu sırada:** En temel ve en güvenli adımdır. Diğer tüm adımların ön koşuludur ve tekrar eden altyapı işini engeller.

- **10N2: Basic Delivery Attempt State Update**
  - **Amaç:** Doğrulanmış (`verificationStatus: 'verified'`) ve `processingStatus: 'received'` olan notification callback'lerini işleyip, ilgili `deliveryAttempt`'in state'ini (`DELIVERED`, `FAILED`, `BOUNCED` vb.) güncellemek.
  - **Scope:** Notification-spesifik bir worker, callback payload'unu yorumlar ve `MarkDeliveryAttemptAs...` komutlarını tetikler. İşlenen kaydın `processingStatus`'unu `processed` yapar.
  - **Dışarıda bırakılacaklar:** `open`/`click` olayları, analytics entegrasyonu, `notification.state` (`READ`) mutasyonu.
  - **Test/Smoke Kanıtı:** Bir `deliveryAttempt` oluşturduktan sonra, "delivered" callback'i gönderildiğinde `deliveryAttempt`'in state'inin `DELIVERED`'e geçtiğini doğrulamak.
  - **Neden bu sırada:** Callback mekanizmasına ilk gerçek operasyonel değeri kazandırır: "bildirim yerine ulaştı mı?" sorusunu cevaplar.

- **10N3: Engagement Analytics Signal Generation**
  - **Amaç:** `open` ve `click` gibi davranışsal callback'leri işleyip, bunları `analytics` sistemine değerli etkileşim sinyalleri olarak göndermek.
  - **Scope:** Worker, `open`/`click` callback'lerini tanır ve `analytics.ingestAnalyticsEvent` komutunu `notification.engagement.opened` gibi olaylarla tetikler.
  - **Dışarıda bırakılacaklar:** `notification` domain'inin state'inde herhangi bir değişiklik yapmak.
  - **Test/Smoke Kanıtı:** Bir "clicked" callback'i gönderildiğinde, analitik sisteminde ilgili olayın göründüğünü doğrulamak.
  - **Neden bu sırada:** Temel teslimat durumu takibinden sonra, en yüksek iş değerine sahip ikinci bilgi olan kullanıcı etkileşimini görünür kılar.

- **10N4: Operational Event/Outbox for Alerts**
  - **Amaç:** `failed`, `bounced`, `spam_reported` gibi operasyonel olarak önemli teslimat sonuçlarını, diğer sistemleri (örn: `support`, `risk`) bilgilendirmek üzere `outbox` üzerinden olay olarak yayınlamak.
  - **Scope:** `MarkDeliveryAttemptAsFailed` gibi komutlar, state'i güncelledikten sonra transactional outbox'a `notification.delivery.failed` gibi olaylar yazar.
  - **Dışarıda bırakılacaklar:** Bu olayları tüketen `support`/`risk` consumer'ları bu paketin dışındadır.
  - **Test/Smoke Kanıtı:** Bir "bounced" callback'i işlendiğinde, `outbox` tablosunda ilgili `notification.delivery.failed` olay kaydının oluştuğunu doğrulamak.
  - **Neden bu sırada:** Sistemi daha sağlam hale getirir ve proaktif problem çözme (örn: geçersiz e-posta adreslerini temizleme) için altyapı oluşturur.

- **10N5: Reconciliation for Unknown/Pending States**
  - **Amaç:** Belirli bir süredir ara durumlarda (`SENT`, `ACCEPTED`) takılıp kalmış `deliveryAttempt`'leri periyodik olarak provider'dan sorgulayan bir reconciliation (uzlaşma) mekanizması kurmak.
  - **Scope:** Belirli aralıklarla çalışan bir job, ara durumda kalmış denemeleri bulur, provider API'ını sorgular ve sonucu `10N2`'deki gibi işler.
  - **Dışarıda bırakılacaklar:** Karmaşık retry mekanizmaları.
  - **Test/Smoke Kanıtı:** `SENT` durumunda bir deneme oluşturup, reconciliation job'ının bu denemeyi bulup state'ini `DELIVERED`'a güncellediğini doğrulamak.
  - **Neden bu sırada:** Sadece callback'e bağımlı kalmayı engelleyerek sistemin güvenilirliğini (reliability) artırır.

## 14. Notification Callback İçin Nihai Karar

**NOTIFICATION DOMAIN INVENTORY COMPLETE / IMPLEMENTATION REQUIRED**

Bu envanter, notification delivery callback domain'inin mevcut durumunu, kritik sınırlarını ve potansiyel implementasyon adımlarını ortaya koymuştur. Mevcut `10A` temelleri, güvenli bir bildirim callback altyapısı kurmak için yeterlidir ancak gerçek bir implementasyona ihtiyaç duyulmaktadır.

**Net öneri:**
İlk gerçek implementasyon, `notification-specific` işlemeye odaklanmamalıdır. Önce, `10N1` paketinde önerildiği gibi, tüm provider callback'leri için **ortak, güvenli ve soyut bir "BFF Callback Ingestion Boundary"** kurulmalıdır. Bu, `payment` ve `shipment` gibi diğer domain'ler için de tekrar eden altyapı işini ortadan kaldıracaktır.

Notification delivery processing’e geçmeden önce aşağıdaki guard'ların zorunlu olduğu listelenmelidir:
1.  **BFF Ingestion Endpoint & Async Worker:** Callback'leri alıp asenkron işleme kuyruğuna atmak için.
2.  **Signature Verification Guard:** Sahte ve bozuk istekleri reddetmek için.
3.  **Idempotency/Replay Guard:** Mükerrer callback işlemeyi engellemek için.
4.  **State Transition Guard:** `notification` servisinin içinde, anlamsız state geçişlerini (örn: `DELIVERED` olmuş bir denemeyi tekrar `SENT` yapmak) engellemek için.
5.  **Analytics/Audit Boundary Guard:** `Open`/`click` gibi sinyallerin yanlışlıkla `notification`'ın `READ` state'ini değiştirmesini veya analitik olaylarının denetim kaydı gibi kullanılmasını engelleyen mantıksal ayrımlar.

## 15. Açık Riskler / Sonraki Kontrol

- **Real signature verification:** Gerçek kriptografik doğrulama mantığı henüz yazılmamıştır.
- **Provider-specific mapping:** Farklı provider'ların (SendGrid, Twilio, FCM) payload formatlarını ortak bir iç modele dönüştürecek esnek bir mapping katmanı gereklidir.
- **Duplicate delivery/open/click event handling:** `open`/`click` olayları için idempotency ve analitik kirliliği riskinin yönetimi detaylandırılmalıdır.
- **Analytics pollution risk:** Sahte/bot `open`/`click` olaylarının analitik verilerini kirletme riski mevcuttur.
- **Delivery attempt vs notification read state ayrımı:** Uygulama mantığında bu iki state'in birbirine karıştırılmaması kesin olarak güvence altına alınmalıdır.
- **Postgres callback smoke:** Mevcut callback smoke testi in-memory çalışmaktadır. `idempotency_key` çakışması gibi Postgres'e özgü davranışları test eden bir smoke testi gereklidir.
- **Postgres idempotency_key conflict davranışı:** Mevcut `insert` sorgusu, `idempotency_key` çakışmasında hata fırlatır. Uygulama katmanının bu hatayı yakalayıp yönetmesi gerekir.
- **Reconciliation/provider polling:** Callback'in hiç gelmediği "kayıp" senaryoları için provider'ı periyodik olarak sorgulayan mekanizma tasarlanmalı ve eklenmelidir.
- **Public webhook rate limiting:** Public endpoint için rate limit ve abuse korumaları implemente edilmelidir.
