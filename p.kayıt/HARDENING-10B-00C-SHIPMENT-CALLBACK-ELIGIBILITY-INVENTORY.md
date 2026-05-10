# HARDENING-10B-00C — Shipment Callback / Eligibility Inventory

## 1. Genel Durum

- **Shipment/carrier callback bugün repo’da var mı?**
  - **HAYIR.** `HARDENING-10B-00A` ve `10B-00B` raporlarının da teyit ettiği gibi, kod tabanında (`services/shipment`, `apps/bff`) gelen bir kargo (shipment/carrier) callback’ini işleyecek, doğrulayacak veya bir domain mantığını tetikleyecek bir bileşen (örn: webhook endpoint, worker) bulunmamaktadır. Mevcut `shipment` servisi sadece giden (outbound) operasyonları (`createShipmentFromOrder`, `transitionShipmentState`) ve bunların simülasyonunu içerir.

- **10A foundation shipment callback için ne sağlıyor?**
  - `HARDENING-10A` serisi, shipment callback dahil olmak üzere tüm provider callback’leri için temel yapı taşlarını (foundation) atmıştır:
    - **Contract:** `ProviderCallbackEnvelope`, `ProviderCallbackRecord` gibi standart veri sözleşmeleri mevcuttur. Bu yapılar, provider’dan gelen bilginin bir "iş gerçeği" olmadığını `boundary: { businessTruthMutated: false }` bayrağı ile zorunlu kılar.
    - **Persistence:** Gelen callback olaylarını saklamak için `provider_callback_events` tablosu ve bu tabloya erişimi soyutlayan `ProviderCallbackEventRepository` (in-memory ve Postgres) eklenmiştir.
    - **Idempotency:** `provider_event_id` üzerinden duplicate kayıtları veritabanı seviyesinde önleyecek mekanizmalar (UNIQUE index) migration’a dahil edilmiştir.
    - **Smoke Test:** In-memory repository’nin temel davranışlarını doğrulayan `provider-callback-foundation` smoke testi mevcuttur.

- **Hangi parçalar hâlâ eksik?**
  - **BFF Callback Endpoint:** Kargo firmasından gelen HTTP POST isteklerini alacak public bir endpoint yoktur.
  - **Signature Verification Logic:** İmza doğrulama sözleşmeleri olsa da, gerçek kriptografik doğrulama mantığı yazılmamıştır.
  - **Carrier-Specific Mapping:** Farklı kargo firmalarından (Aras, Yurtiçi vb.) gelen payload’ları ortak `ProviderCallbackRecord` formatına dönüştürecek bir `mapping` katmanı yoktur.
  - **Shipment Domain Processing Logic:** Kaydedilen bir `ProviderCallbackRecord`'u okuyup, "bu bir teslimat mı?", "hangi shipment'a ait?" gibi soruları cevaplayacak ve `shipment` owner command'ını tetikleyecek bir iş mantığı (worker/consumer) yoktur.
  - **Reconciliation Runtime:** Callback gelmediğinde veya belirsiz bir durumda kaldığında kargo firmasını sorgulayacak bir "reconciliation" mekanizması yoktur.

## 2. Shipment / Delivery Sistem Sınırı

- **Shipment sistemi order değildir.**
  - `planlama/16-sipariş sistemi .md` ve `planlama/17- kargo ve teslimat sistemi.md` bu ayrımı net çizer. Sipariş, ticari kaydın kendisidir. Shipment, bu kaydın fiziksel teslimat operasyonudur. Birbirlerine bağlıdırlar ama aynı şey değillerdir.

- **Shipment sistemi sipariş takip yüzeyi değildir.**
  - `planlama/30-sipariş takip sistemi.md` belgesine göre, sipariş takip yüzeyi, shipment sistemindeki operasyonel gerçeği kullanıcıya anlaşılır bir dilde sunan bir "projection" katmanıdır. Shipment sistemi truth owner’dır, takip sistemi ise bu truth’u gösteren bir vitrindir.

- **Shipment sistemi review/story sistemi değildir.**
  - `planlama/31-yorum ve puanlama sistemi.md` ve `planlama/34-kullanıcı story sistemi.md` belgelerine göre, review/story sistemleri, shipment sisteminin ürettiği "teslim edildi" (delivered) sinyaliyle tetiklenen ayrı domain’lerdir. Shipment, bu hakları açan "eşik"tir, hakların kendisi değildir.

- **Carrier/provider response business truth değildir.**
  - Bu, `HARDENING-10A` serisinin temel prensibidir. `packages/contracts/src/provider.ts` içindeki `ProviderBoundaryFlags`, `businessTruthMutated: false` bayrağını zorunlu kılarak provider’dan gelen bilginin doğrudan iş (business) gerçeğini değiştirmesini engeller. `tests/smoke/suites/shipment-provider-boundary.ts` smoke testi de bu kuralı doğrular.

- **Carrier callback shipment owner doğrulama/processing hattına girmeden delivered veya eligibility etkisi üretemez.**
  - Bu, yukarıdaki tüm maddelerin doğal sonucudur. Kargo firmasından gelen bir "teslim edildi" bilgisi, önce sistem tarafından doğrulanmalı (signature), kaydedilmeli (persistence), işlenmeli (processing) ve `shipment` domain’i tarafından resmi bir `shipment delivered` state geçişine dönüştürülmelidir. Ancak bu resmi geçişten sonra `review` ve `story` gibi diğer sistemler tetiklenebilir.

## 3. Shipment Callback Ne Temsil Eder?

- **carrier event notification:** Evet, callback özünde kargo firmasının kendi sistemindeki bir olayı (örn: "Dağıtıma Çıktı", "Teslim Edildi") bizim sisteme bildirmesidir.
- **tracking event signal:** Evet, gelen callback’in içeriği, bir `shipment`'ın durumu hakkında güçlü bir "sinyal" içerir. Ancak bu "sinyal"dir, "kesin gerçek" (truth) değil.
- **raw carrier payload:** Evet, callback’in gövdesi, kargo firmasının kendine özgü formatında gönderdiği ham veridir. Bu veri, `ProviderCallbackRecord` içindeki `rawPayload` alanına dokunulmadan kaydedilmelidir.
- **provider tracking reference:** Evet, callback genellikle bizim `shipmentId` veya `trackingNumber`’ımız ile provider tarafındaki referansı birleştiren bir bilgi içerir. Bu, callback’i doğru `shipment` entity’si ile eşleştirmek için kullanılır.
- **verification result:** Callback, işleme alınmadan önce bir imza doğrulama (`SignatureVerificationResult`) ve tekrar/kopya (`replayDetected`) kontrolünden geçmelidir. Bu sonuçlar, callback kaydının meta verileridir.
- **replay/idempotency status:** Evet, callback işlenirken `providerEventId` veya benzeri bir anahtar kullanılarak bunun daha önce işlenip işlenmediği kontrol edilir. Sonuç `first_seen` veya `duplicate` gibi bir `replayStatus` olarak kaydedilir.
- **shipment owner transition adayı:** Evet, en önemli tanım budur. Doğrulanmış, kopyası olmayan ve geçerli bir callback, `shipment` domain’i için bir "state transition" (örn: `IN_TRANSIT` -> `DELIVERED`) işlemini tetikleyecek bir "aday"dır. Doğrudan bir `transition` değildir.

**Açık Yazı:**
Shipment callback doğrudan “delivered truth”, “review eligibility opened” veya “story eligibility opened” anlamına gelmez.

## 4. Shipment Callback Event / Status Modeli

Aşağıdaki yorumlar, `packages/contracts/src/shipment.ts` ve `planlama/17- kargo ve teslimat sistemi.md` belgelerindeki tanımlara dayanmaktadır.

- **label_created / accepted_by_carrier:**
  - `callback record processingStatus`: `accepted` -> `processed`.
  - `shipment owner command`’a dönüşebilir mi?: Evet. `TransitionShipmentToPreparing` veya `TransitionShipmentToShipped` gibi bir komutu tetikleyebilir.
  - `order tracking` görünürlüğüne etkisi olur mu?: Evet. "Hazırlanıyor" veya "Kargoya Verildi" olarak yansıyabilir.
  - `review eligibility` etkisi olur mu?: Hayır.
  - `story eligibility` etkisi olur mu?: Hayır.
  - Hangi durumda sadece kayıt/ignored kalmalı?: `shipment` state’i zaten daha ileri bir durumdaysa (örn: `SHIPPED` iken `accepted` gelmesi) `ignored` olabilir.

- **shipped:**
  - `callback record processingStatus`: `accepted` -> `processed`.
  - `shipment owner command`’a dönüşebilir mi?: Evet. `TransitionShipmentToShipped` komutunu tetikler.
  - `order tracking` görünürlüğüne etkisi olur mu?: Evet. "Kargoya Verildi" olarak görünür.
  - `review eligibility` etkisi olur mu?: Hayır.
  - `story eligibility` etkisi olur mu?: Hayır.
  - Hangi durumda sadece kayıt/ignored kalmalı?: `shipment` state’i zaten `SHIPPED` veya ilerisindeyse.

- **in_transit:**
  - `callback record processingStatus`: `accepted` -> `processed`.
  - `shipment owner command`’a dönüşebilir mi?: Evet. `TransitionShipmentToInTransit` komutunu tetikler.
  - `order tracking` görünürlüğüne etkisi olur mu?: Evet. "Yolda" veya benzeri bir statüye geçer.
  - `review eligibility` etkisi olur mu?: Hayır.
  - `story eligibility` etkisi olur mu?: Hayır.
  - Hangi durumda sadece kayıt/ignored kalmalı?: State zaten `IN_TRANSIT` veya ilerisindeyse.

- **out_for_delivery:**
  - `callback record processingStatus`: `accepted` -> `processed`.
  - `shipment owner command`’a dönüşebilir mi?: Evet. `TransitionShipmentToOutForDelivery` komutunu tetikler.
  - `order tracking` görünürlüğüne etkisi olur mu?: Evet. "Dağıtıma Çıktı" olarak görünür.
  - `review eligibility` etkisi olur mu?: Hayır.
  - `story eligibility` etkisi olur mu?: Hayır.
  - Hangi durumda sadece kayıt/ignored kalmalı?: State zaten `OUT_FOR_DELIVERY` veya `DELIVERED` ise.

- **delivered:**
  - `callback record processingStatus`: `accepted` -> `processed`.
  - `shipment owner command`’a dönüşebilir mi?: **EVET.** Bu en kritik geçiştir. `TransitionShipmentToDelivered` komutunu tetikler.
  - `order tracking` görünürlüğüne etkisi olur mu?: Evet. "Teslim Edildi" olarak görünür.
  - `review eligibility` etkisi olur mu?: **EVET, DOLAYLI YOLDAN.** `shipment` state’i `DELIVERED` olunca, bu durum `review` sisteminin ilgili ürün(ler) için `eligibility` açmasını tetikleyen bir `shipment.delivered` event’i üretir.
  - `story eligibility` etkisi olur mu?: **EVET, DOLAYLI YOLDAN.** Aynı şekilde `story` sistemi için de hak açma sürecini tetikler.
  - Hangi durumda sadece kayıt/ignored kalmalı?: `shipment` state’i zaten `DELIVERED` ise `duplicate` veya `ignored` olarak işaretlenmelidir.

- **delivery_failed:**
  - `callback record processingStatus`: `accepted` -> `processed`.
  - `shipment owner command`’a dönüşebilir mi?: Evet. `TransitionShipmentToDeliveryFailed` komutunu tetikler.
  - `order tracking` görünürlüğüne etkisi olur mu?: Evet. "Teslim Edilemedi" veya "Teslimatta Sorun Var" olarak yansıtılır.
  - `review eligibility` etkisi olur mu?: Hayır.
  - `story eligibility` etkisi olur mu?: Hayır.
  - Hangi durumda sadece kayıt/ignored kalmalı?: `shipment` state’i zaten `DELIVERED` veya `RETURNED_TO_SENDER` gibi nihai bir durumdaysa.

- **returned_to_sender:**
  - `callback record processingStatus`: `accepted` -> `processed`.
  - `shipment owner command`’a dönüşebilir mi?: Evet. `TransitionShipmentToReturnedToSender` komutunu tetikler.
  - `order tracking` görünürlüğüne etkisi olur mu?: Evet. "Göndericiye Geri Döndü" olarak yansıtılır.
  - `review eligibility` etkisi olur mu?: Hayır.
  - `story eligibility` etkisi olur mu?: Hayır.
  - Hangi durumda sadece kayıt/ignored kalmalı?: State zaten nihai bir durumdaysa.

- **lost / damaged / exception:**
  - `callback record processingStatus`: `accepted` -> `processed`.
  - `shipment owner command`’a dönüşebilir mi?: Evet. Bu, `MarkShipmentAsProblematic` veya benzeri bir operasyonel command’ı tetikleyebilir ve bir destek (support) kaydı oluşturabilir.
  - `order tracking` görünürlüğüne etkisi olur mu?: Evet. "Kargoda Sorun Var" gibi bir uyarı ile gösterilir.
  - `review eligibility` etkisi olur mu?: Hayır.
  - `story eligibility` etkisi olur mu?: Hayır.
  - Hangi durumda sadece kayıt/ignored kalmalı?: Durum zaten çözülmüş veya nihai bir state’e ulaşmışsa.

- **unknown_result:**
  - Bu genellikle bir callback status’u değil, bir sorgulama (reconciliation) sonucudur. Eğer callback böyle bir bilgi veriyorsa:
  - `callback record processingStatus`: `reconciliation_required` olarak işaretlenmeli ve bir sorgulama süreci başlatılmalıdır.
  - `shipment owner command`’a dönüşebilir mi?: Hayır, doğrudan değil.
  - `order tracking` görünürlüğüne etkisi olur mu?: Hayır, belirsizlik kullanıcıya yansıtılmaz, sistem içinde çözülür.
  - `review eligibility` etkisi olur mu?: Hayır.
  - `story eligibility` etkisi olur mu?: Hayır.
  - Hangi durumda sadece kayıt/ignored kalmalı?: Her zaman işlenip bir reconciliation sürecini tetiklemelidir.

- **duplicate / replay:**
  - `callback record processingStatus`: `duplicate` olarak işaretlenir.
  - `shipment owner command`’a dönüşebilir mi?: Hayır.
  - `order tracking` görünürlüğüne etkisi olur mu?: Hayır.
  - `review eligibility` etkisi olur mu?: Hayır.
  - `story eligibility` etkisi olur mu?: Hayır.
  - Hangi durumda sadece kayıt/ignored kalmalı?: Her zaman.

- **signature_failed:**
  - `callback record processingStatus`: `rejected` olarak işaretlenir.
  - `shipment owner command`’a dönüşebilir mi?: Hayır. Güvenlik alarmı üretmelidir.
  - `order tracking` görünürlüğüne etkisi olur mu?: Hayır.
  - `review eligibility` etkisi olur mu?: Hayır.
  - `story eligibility` etkisi olur mu?: Hayır.
  - Hangi durumda sadece kayıt/ignored kalmalı?: Her zaman.

- **unsupported:**
  - `callback record processingStatus`: `ignored` olarak işaretlenir.
  - `shipment owner command`’a dönüşebilir mi?: Hayır.
  - `order tracking` görünürlüğüne etkisi olur mu?: Hayır.
  - `review eligibility` etkisi olur mu?: Hayır.
  - `story eligibility` etkisi olur mu?: Hayır.
  - Hangi durumda sadece kayıt/ignored kalmalı?: Her zaman.

## 5. Delivered Boundary

- **Carrier callback doğrudan shipment state’i delivered yapabilir mi?**
  - **HAYIR.** `services/shipment/src/shipment.ts` dosyasındaki `transitionShipmentState` fonksiyonu, bir `owner command` bekler. Callback, bu command’ı tetikleyen bir "aday"dır, command’ın kendisi değildir. Callback’in doğrudan state’i mutate etmesi, `OWNER_MATRIX.md` ve `GUARD_MATRIX.md`'deki temel mimari kurallarını ihlal eder.

- **Delivered transition hangi owner command üzerinden olmalı?**
  - `TransitionShipmentToDelivered` gibi, `shipmentId` ve muhtemelen teslimat kanıtı (proof) gibi verileri içeren açık bir command üzerinden olmalıdır. Bu command, bir callback worker/consumer tarafından, callback verisi doğrulandıktan ve işlendikten sonra çağrılmalıdır.

- **Delivered için ek doğrulama / guard gerekir mi?**
  - **EVET.**
    1.  **State Guard:** `shipment`'ın mevcut state'inin `DELIVERED`'a geçiş için uygun olup olmadığı kontrol edilmelidir (örn: `OUT_FOR_DELIVERY`'den geçebilir ama `PREPARING`'den geçemez). `isValidTransition` fonksiyonu bu mantığı içerir.
    2.  **Idempotency Guard:** Aynı `shipment` için ikinci bir `DELIVERED` command'ının mükerrer etki yaratması engellenmelidir.

- **Aynı delivered callback tekrar gelirse ne olmalı?**
  - `ProviderCallbackEventRepository`'deki `provider_event_id` unique index'i sayesinde veritabanı seviyesinde duplicate kayıt önlenir. Uygulama mantığı, bu duplicate callback'i `processingStatus: 'duplicate'` olarak işaretlemeli ve herhangi bir `shipment` command'ı tetiklemeden işlemi sonlandırmalıdır.

- **Delivered event append-only timeline olarak mı saklanmalı?**
  - **EVET.** `packages/contracts/src/shipment.ts` içindeki `ShipmentTimelineEvent` arayüzü bu mantığı destekler. Her state geçişi, `shipment.timeline` dizisine yeni bir olay olarak eklenir. `delivered` durumu da bu timeline'a bir olay olarak, zaman damgasıyla birlikte eklenmelidir. Bu, denetlenebilirlik (auditability) için kritiktir.

- **Shipment state ile shipment timeline/event history nasıl ayrılmalı?**
  - `shipment.state`: `ShipmentResponse`'un kök seviyesindeki bu alan, entity'nin **mevcut, güncel durumunu** temsil eder. Sorgulamalarda ve guard kontrollerinde birincil olarak bu alan kullanılır.
  - `shipment.timeline`: Bu, `ShipmentTimelineEvent` objelerinden oluşan bir dizidir ve `shipment`'ın başından sonuna kadar geçtiği tüm state'lerin **tarihçesini** (history) tutar. Append-only'dir ve denetim (audit) amacıyla kullanılır.

**Net karar:**
Carrier callback hiçbir durumda shipment owner’ı bypass etmemeli. Bu, mevcut mimari ve planlama dokümanları tarafından desteklenen ve zorunlu kılınan bir karardır.

## 6. Review / Rating Eligibility Boundary

- **Delivered sonrası review hakkı nasıl açılmalı?**
  - `shipment` servisi, bir `shipment`'ı `DELIVERED` olarak işaretledikten sonra, bir `shipment.delivered` olayını (event) outbox pattern ile yayınlamalıdır. `review` servisi (veya bir `eligibility` servisi) bu olayı dinlemeli (subscribe) ve ilgili `actorId`, `productId`, `orderLineId` gibi bilgileri kullanarak bir `ReviewEligibilitySnapshot` oluşturmalı ve state'ini `ELIGIBLE` yapmalıdır.

- **Review eligibility carrier callback içinde mi açılmalı?**
  - **HAYIR.** Bu, domain sınırlarının ihlali olur. `review` sisteminin, bir `carrier callback`'inin iç yapısını bilmesi gerekmez. `review` sistemi sadece kendi domain dili olan `shipment.delivered` gibi güvenilir bir iç domain event'ini dinlemelidir.

- **Review sistemi shipment truth’u nasıl okumalı veya hangi event’ten beslenmeli?**
  - `review` sistemi, `shipment` servisinin yayınladığı `shipment.delivered` veya `shipment.line.delivered` gibi domain event’lerinden beslenmelidir. Doğrudan `shipment` veritabanını okumamalıdır. Bu, sistemler arası kuplajı (coupling) azaltır.

- **Misafir kullanıcı review yapabilir mi?**
  - **HAYIR.** `planlama/31-yorum ve puanlama sistemi.md` (satır 45-50) ve `packages/contracts/src/customer-contribution.ts` belgelerine göre yorum yapabilmek için kullanıcının giriş yapmış olması (`authenticated`) ve ürünü satın alıp teslim almış olması (`verified purchase`) gerekir. Misafir kullanıcı bu koşulları sağlayamaz.

- **Ürün satırı bazlı delivered ile review hakkı nasıl ayrılmalı?**
  - `planlama/17- kargo ve teslimat sistemi.md` (satır 231-249) bu kararı netleştirir: Haklar, siparişin tamamının teslim edilmesine değil, **teslim edilen ürün satırına (line-level)** bağlanmalıdır. `shipment.delivered` event'i, içinde hangi `orderLineId`'lerin teslim edildiği bilgisini taşımalıdır. `review` sistemi de bu `orderLineId`'lere karşılık gelen ürünler için `eligibility` açmalıdır.

- **İade/return sonrası rating etkisi nasıl korunmalı?**
  - `planlama/31-yorum ve puanlama sistemi.md` (satır 110-119) bu kuralı koyar: Ürün iade edilirse, yazılmış olan yorum metni kalabilir ancak `trustState`'i (`TRUST_REDUCED_AFTER_RETURN`) güncellenir, `verifiedPurchase` etiketi kaldırılabilir ve en önemlisi, verdiği puanın (`rating`) ürünün ortalama puanına olan **etkisi kaldırılır** (`ratingImpactActive: false`). `packages/contracts/src/review.ts` içindeki `ApplyReviewReturnImpactCommand` bu operasyon için tasarlanmıştır.

**Net karar:**
Carrier callback doğrudan review eligibility oluşturmamalıdır. `shipment delivered` owner event'i sonrası, `review` (veya `eligibility`) domain'i içinde ayrı bir asenkron eligibility flow çalışmalıdır.

## 7. User Product Story Eligibility Boundary

- **Delivered sonrası kullanıcı ürün story hakkı nasıl açılmalı?**
  - Review hakkı ile tamamen aynı mekanizma ile: `shipment.delivered` event'i, `story` (veya `customer-contribution`) servisi tarafından dinlenmeli ve ilgili `actorId` ve `productId` için story hakkı açılmalıdır.

- **Story eligibility carrier callback içinde mi açılmalı?**
  - **HAYIR.** Review ile aynı sebeple, bu bir domain sınırı ihlali olur.

- **Ürün etiketi ve delivered line bağlamı nasıl korunmalı?**
  - `shipment.delivered` event'i, `orderLineId` ve buna bağlı `productId` bilgisini içermelidir. `story` servisi, bu `productId` için story hakkı açar. Kullanıcı story yüklerken bu `productId`'yi etiketlemek zorunda kalır.

- **Aynı ürün için story hakkı limiti nasıl etkilenir?**
  - `planlama/34-kullanıcı story sistemi.md` (satır 64-67) bu kuralı koyar: Aynı ürün için maksimum 2 story hakkı vardır. `story` servisi, bir `eligibility` kaydı oluştururken bu limiti de kontrol etmeli ve mevcut hak sayısını yönetmelidir.

- **Guest user story hakkı alabilir mi?**
  - **HAYIR.** `planlama/34-kullanıcı story sistemi.md` (satır 49-56) ve `packages/contracts/src/customer-contribution.ts` belgelerine göre story yüklemek için de giriş yapmış, ürünü satın almış ve teslim almış olmak gerekir.

- **Review/story eligibility aynı delivered event’ten mi türemeli, yoksa ayrı owner command’lar mı olmalı?**
  - **AYNI EVENT'TEN TÜREMELİ.** `shipment.delivered` tek bir "truth" olayıdır. Hem `review` hem de `story` servisleri (veya `customer-contribution` servisi) bu tek olayı dinleyip (subscribe) kendi içlerinde bağımsız olarak `eligibility` mantıklarını çalıştırmalıdır (fan-out pattern). Bu, sistemleri birbirinden ayrık (decoupled) tutar.

**Net karar:**
Carrier callback doğrudan story eligibility oluşturmamalıdır. `shipment delivered` owner event'i sonrası, `story` (veya `customer-contribution`) domain'i içinde ayrı bir asenkron eligibility flow çalışmalıdır.

## 8. Order Tracking Boundary

- **Sipariş takip sistemi kendi truth’unu üretir mi?**
  - **HAYIR.** `planlama/30-sipariş takip sistemi.md` (satır 61-73) belgesinde açıkça belirtildiği gibi, sipariş takip sistemi kendi truth'unu üretmez; `order` ve `shipment` sistemlerinden gelen truth'ları kullanıcıya anlaşılır bir dilde sunan bir **projection** katmanıdır.

- **Shipment callback sipariş takip yüzeyini doğrudan mutate edebilir mi?**
  - **HAYIR.** Bu, mimarinin iki temel kuralını birden ihlal eder:
    1.  Callback, `shipment` owner'ını bypass edemez.
    2.  `order tracking`, bir `projection`'dır, `truth` owner değildir ve doğrudan mutate edilemez.
  Akış `callback` -> `shipment owner` -> `shipment state` -> `order tracking projection` şeklinde olmalıdır.

- **Order tracking projection shipment truth’tan nasıl beslenmeli?**
  - İdeal olarak, `order tracking projection`'ı güncelleyen servis, `shipment` servisinin yayınladığı `shipment.state.changed` gibi domain event'lerini dinleyerek beslenmelidir. Bu, CQRS (Command Query Responsibility Segregation) pattern'ine uygun bir yaklaşımdır.

- **Çok paketli / satır bazlı teslimatta tracking görünürlüğü nasıl korunmalı?**
  - `planlama/30-sipariş takip sistemi.md` (satır 110-117) bunu gerektirir. Takip yüzeyi, siparişi tek bir kaba statü olarak göstermemeli; "1. paket teslim edildi", "2. paket yolda" gibi paket bazlı ayrı durumları gösterebilmelidir.

- **Delivery exception veya failed durumları kullanıcıya nasıl yansıtılmalı?**
  - `planlama/17- kargo ve teslimat sistemi.md` (satır 278-294) dürüstlük ilkesini vurgular. "Teslimatta Sorun Var", "Teslim Edilemedi" gibi durumlar, kullanıcıya net bir şekilde, operasyonel karmaşaya boğmadan yansıtılmalıdır. Ayrıca, bu durumlarda "Destek ile İletişime Geç" gibi aksiyonlar sunulmalıdır.

## 9. Order / Operation Boundary

- **Shipment callback order status’u doğrudan değiştirebilir mi?**
  - **HAYIR, ASLA.** `order` ve `shipment` ayrı domain'lerdir. `shipment`'ın durumu `DELIVERED` olduğunda, `order`'ın state'i `COMPLETED` veya `PARTIALLY_DELIVERED` olabilir, ancak bu geçişi `order` domain'i kendi kurallarına göre yapar. Bir `shipment callback`'inin doğrudan `order` state'ini değiştirmesi, `OWNER_MATRIX.md`'deki en temel kuralın ihlalidir.

- **Sipariş operasyon sistemi ile shipment sistemi ayrımı nasıl korunmalı?**
  - `planlama/45-sipariş operasyon sistemi.md` (satır 259-281) bu sınırı çizer:
    - **Sipariş Operasyon Sistemi:** İç hazırlık, paketleme, sevkiyata hazırlama gibi "taşıyıcıya teslim öncesi" adımların sahibidir.
    - **Shipment Sistemi:** Taşıyıcıya teslim edildikten sonraki fiziksel taşıma, takip ve teslimat sürecinin sahibidir.
  Bu iki sistem, `handed_to_carrier` (taşıyıcıya teslim edildi) state'i ile birbirine bağlanır.

- **Sevke verildi / kargoda / teslim edildi etkileri order ve operation domainlerinde nasıl görünmeli?**
  - - **Shipment Domain:** Bunlar `SHIPPED`, `IN_TRANSIT`, `DELIVERED` gibi birincil `state`'lerdir.
  - - **Order Domain:** Bu `state`'ler, `order`'ın genel `fulfillmentState`'ini (örn: `PROCESSING` -> `SHIPPED` -> `DELIVERED`) etkiler. `order` servisi, `shipment`'tan gelen event'leri dinleyerek kendi `state`'ini günceller.
  - - **Operasyon (Admin Panel) Domain:** Bu durumlar, operasyon panellerinde siparişin hangi aşamada olduğunu gösteren izleme bilgileri olarak görünür.

- **Shipment callback operasyon problem kaydı oluşturabilir mi, yoksa owner command/event üzerinden mi olmalı?**
  - **OWNER COMMAND/EVENT ÜZERİNDEN OLMALI.** `delivery_failed` veya `lost` gibi bir callback, `shipment` owner'ı tarafından işlenmeli ve `shipment` owner, bir `ShipmentProblemDetected` event'i yayınlamalıdır. `support` veya `operations` sistemi bu event'i dinleyerek bir problem kaydı (ticket/case) oluşturmalıdır. Callback'in doğrudan bir destek kaydı oluşturması, domain sınırlarının ihlalidir.

## 10. Idempotency / Replay / Duplicate Risk

- **`providerEventId` ne için kullanılmalı?**
  - `packages/persistence/src/provider-callback.ts`'deki `ON CONFLICT` kuralına göre, bu alan provider'dan gelen her bir olayın (webhook) sisteme **yalnızca bir kez** kaydedilmesini sağlamak için birincil anahtar olarak kullanılmalıdır. Bu, "event-level idempotency" sağlar.

- **`carrier tracking event id` ne için kullanılmalı?**
  - Eğer kargo firması her bir takip olayı (yolda, dağıtımda, teslim edildi) için ayrı bir event ID sağlıyorsa, bu da `providerEventId` gibi kullanılabilir veya denetim (audit) için `rawPayload` içinde saklanabilir.

- **`tracking number / provider reference` ne için kullanılmalı?**
  - Bu, gelen callback'i bizim sistemimizdeki doğru `shipment` veya `package` entity'si ile **eşleştirmek** için kullanılır.

- **duplicate `delivered` callback nasıl `duplicate` veya `ignored` yapılmalı?**
  - **Idempotency (Event Level):** `ProviderCallbackEventRepository`, `providerEventId` ile duplicate callback'i yakalayıp `processingStatus: 'duplicate'` yaparak işlemeyi en baştan durdurmalıdır.
  - **State Guard (Domain Level):** Eğer bir şekilde işlemeye devam ederse, `shipment` servisi, `DELIVERED` state'indeki bir `shipment` için gelen yeni bir `TransitionToDelivered` command'ını "Invalid Transition" olarak reddetmelidir.

- **aynı carrier event farklı payload ile gelirse ne yapılmalı?**
  - Eğer `providerEventId` aynı ise, `ON CONFLICT` kuralı gereği yeni bir kayıt oluşturulmaz. Bu durumda ilk gelen payload geçerli kabul edilir. Bu bir edge case'dir ve ideal olarak `providerEventId` her event için benzersiz olmalıdır. Eğer bu bir sorunsa, `rawPayload`'un hash'ini alıp bunu da idempotency anahtarına dahil etmek gibi daha karmaşık stratejiler düşünülebilir, ancak ilk aşama için `providerEventId`'ye güvenmek esastır.

- **event ordering sorunu nasıl ele alınmalı? Örnek: `delivered` callback, `in_transit` callback’ten önce gelirse.**
  - `shipment` state machine'i bu durumu yönetebilmelidir. `planlama/aşama-3/TRANSITION_POLICIES.md`'ye göre, `in_transit`'ten `delivered`'a geçiş valid'dir. Eğer sistem `created` state'indeyken `delivered` callback'i alırsa, `isValidTransition` guard'ı bunu "Invalid Transition" olarak reddetmelidir. Ancak bazı state machine tasarımları, ara state'leri (in_transit, out_for_delivery) otomatik olarak doldurarak doğrudan `delivered`'a geçişe izin verebilir. Mevcut `services/shipment/src/shipment.ts` (satır 147-160) implementasyonu daha katıdır ve ara geçişleri zorunlu kılar. Bu katı yaklaşım, event ordering sorunlarına karşı daha güvenlidir.

- **Postgres `idempotency_key` conflict limiti shipment callback için risk oluşturur mu?**
  - Evet, `HARDENING-10B-00B` (satır 169-171) raporunda da belirtildiği gibi, `PostgresProviderCallbackEventRepository`'nin `insert` sorgusu `idempotency_key` için `ON CONFLICT` kuralı içermiyor. Migration'da `UNIQUE INDEX` olduğu için, duplicate bir `idempotency_key` ile `insert` denemesi veritabanı hatası fırlatacak ve uygulama çökebilecektir. Bu bir risktir ve uygulama bu hatayı yakalayıp yönetmelidir.

## 11. Security / Signature / Config Boundary

- **Signature verification olmadan shipment callback processing yapılabilir mi?**
  - **HAYIR, KESİNLİKLE YAPILMAMALI.** `planlama/10-00-PROVIDER-CALLBACK-WEBHOOK-RECONCILIATION-INVENTORY.md` belgesinde bu P1/P0 seviyesinde bir risk olarak tanımlanmıştır. İmzasız bir callback, sahte bir "teslim edildi" bilgisi göndererek haksız yere yorum/story hakkı açılmasına veya finansal süreçlerin (örn: iade penceresi) yanlış tetiklenmesine yol açabilir.

- **Carrier/provider secret/env nerede yönetilmeli?**
  - `planlama/KONFIGURASYON_YONETIMI.md` (satır 51-80) belgesine göre, bu tür sırlar `C0 — Secret config` sınıfındadır ve bir "secret manager" (örn: HashiCorp Vault, AWS Secrets Manager) içinde yönetilmelidir. Repo'da veya DB'de asla düz metin olarak saklanmamalıdır.

- **Public webhook endpoint rate limit / abuse guard gerektirir mi?**
  - **EVET.** Kötü niyetli aktörlerin endpoint'e sürekli anlamsız istekler atarak sistemi yormasını (DDoS) veya sahte callback denemeleri yapmasını engellemek için rate limiting, IP filtreleme gibi temel korumalar zorunludur.

- **Fake delivered callback riski nasıl sınırlanmalı?**
  - **Güçlü imza doğrulaması (Signature Verification)** ile sınırlanır.

- **Replay delivered callback riski nasıl sınırlanmalı?**
  - **Idempotency kontrolü** (`providerEventId`) ve potansiyel olarak callback payload'undaki bir **timestamp kontrolü** (belirli bir zaman penceresi dışındaki eski callback'leri reddetme) ile sınırlanır.

## 12. BFF Boundary

- **BFF shipment callback endpoint açılırsa ne yapabilir?**
  - `planlama/aşama-2/OWNER_MATRIX.md` ve `GUARD_MATRIX.md`'ye göre, BFF'in rolü çok sınırlıdır:
    1.  Gelen isteği almak (ingestion).
    2.  İsteği, asenkron işlenmek üzere bir `Callback Ingestion Service/Worker`'a (örn: bir message queue üzerinden) **hemen** paslamak.
    3.  Provider'a hızlı bir `200 OK` veya `202 Accepted` yanıtı dönerek bağlantıyı sonlandırmak.

- **BFF truth owner olabilir mi?**
  - **HAYIR.** BFF bir read aggregation ve command handoff katmanıdır. Asla truth owner olamaz.

- **BFF shipment state mutate edebilir mi?**
  - **HAYIR.**

- **BFF review/story eligibility açabilir mi?**
  - **HAYIR.**

- **BFF sadece ingestion + validation + persistence + async owner handoff mı yapmalı?**
  - Hayır, sorumluluğu daha da az olmalıdır. BFF, **ingestion + async handoff** yapmalıdır. **Validation** (imza doğrulama), **persistence** (`ProviderCallbackEventRepository` kullanımı) ve **owner command handoff** (`shipment` servisini çağırma) gibi ağır ve zaman alıcı işlemler, asenkron bir worker/servisin sorumluluğu olmalıdır. Bu, BFF'in provider'ı bekletmeden hızlı yanıt dönmesini sağlar.

## 13. Audit / Event / Outbox Boundary

- **Callback kaydı audit yerine geçer mi?**
  - **HAYIR.** `planlama/aşama-11/AUDIT_TAXONOMY.md`'ye göre, `ProviderCallbackRecord`, bir "olay kaydı"dır. Bu olayın işlenmesi sonucu `shipment` state'inin `DELIVERED`'a geçmesi gibi bir "business mutation" ise bir `audit record` üretmelidir. Callback kaydı, audit kaydının tetikleyicisi olabilir ama onun yerine geçmez.

- **Shipment delivered event ne zaman üretilmeli?**
  - `shipment` domain'i, kendi veritabanında `shipment` state'ini `DELIVERED` olarak **başarıyla güncelledikten sonra**, aynı transaction içinde bir `shipment.delivered` event'ini `outbox` tablosuna yazmalıdır (transactional outbox pattern). Event, truth yazıldıktan sonra üretilir.

- **Review/story eligibility event’i ne zaman üretilmeli?**
  - `review` veya `story` servisi, `shipment.delivered` event'ini tükettikten ve kendi içinde `eligibility` kaydını başarıyla oluşturduktan sonra, bir `review.eligibility.opened` veya `story.eligibility.opened` event'i yayınlayabilir. Bu, bildirim (notification) gibi diğer sistemleri tetiklemek için kullanılabilir.

- **Timeline event ile business event ayrımı nasıl korunmalı?**
  - **Timeline Event:** `ShipmentTimelineEvent` gibi, bir entity'nin kendi içindeki state geçişlerinin tarihçesini tutan, genellikle o entity'nin kendi veritabanı kaydı içinde saklanan olaylardır. Denetim için kullanılır.
  - **Business Event:** `shipment.delivered` gibi, bir domain'deki önemli bir değişikliği diğer domain'lere bildirmek için bir message broker (örn: RabbitMQ, Kafka) üzerinden yayınlanan olaylardır. Sistemler arası entegrasyon için kullanılır.

- **Event publish varsa owner truth yazıldıktan sonra mı olmalı?**
  - **EVET.** Bu, "transactional outbox" pattern'inin temel kuralıdır ve `planlama/VERI_AKISI_SENKRONIZASYON_MODELI.md`'de zorunlu kılınmıştır.

## 14. Shipment Callback Implementation Seçenekleri

**A) Sadece callback ingestion + persistence**
- **Artıları:** En basit ve en güvenli ilk adım. Sisteme dışarıdan veri alıp kaydetme yeteneği kazandırır, ancak hiçbir `truth` değiştirmez.
- **Riskleri:** Tek başına bir iş değeri üretmez.
- **Yasakları:** Domain state'i değiştirilmemelidir.
- **Kabul Kanıtı:** Test callback'inin `provider_callback_events` tablosuna `processingStatus: 'received'` olarak yazılması.
- **Hangi aşamada yapılmalı:** En temel ilk adım.

**B) Ingestion + shipment tracking timeline append**
- **Artıları:** Gelen bilgiyi `shipment`'ın denetim kaydına ekleyerek görünürlük sağlar, ancak ana `state`'i değiştirmez. Güvenli bir ara adımdır.
- **Riskleri:** Ana `state` ile timeline arasında tutarsızlık olabilir. İş değeri sınırlıdır.
- **Yasakları:** Ana `shipment.state` alanı değiştirilmemelidir.
- **Kabul Kanıtı:** Test callback'i sonrası ilgili `shipment`'ın `timeline` dizisine yeni bir olay eklendiğinin doğrulanması.
- **Hangi aşamada yapılmalı:** İkinci adım olabilir.

**C) Ingestion + shipment owner state transition**
- **Artıları:** Callback'leri gerçek iş mantığına bağlar. `shipment` state'ini güncelleyerek `delivered` gibi kritik geçişleri otomatikleştirir.
- **Riskleri:** En riskli seçenektir. İmza doğrulama, idempotency ve state guard olmadan yapılırsa sistemi bozar.
- **Yasakları:** `review`/`story` gibi diğer domain'leri doğrudan çağırmamalıdır.
- **Kabul Kanıtı:** "delivered" callback'i sonrası ilgili `shipment` entity'sinin `state`'inin `DELIVERED` olarak güncellenmesi.
- **Hangi aşamada yapılmalı:** Diğer tüm guard'lar ve temel adımlar tamamlandıktan sonra.

**D) Ingestion + delivered owner event + eligibility handoff**
- **Artıları:** Uçtan uca bir akışı tamamlar. Teslimatın, hak açma süreçlerini tetiklediğini gösterir. En bütünsel yaklaşımdır.
- **Riskleri:** En karmaşık seçenektir. `shipment`, `outbox` ve `eligibility` servisleri arasında asenkron iletişimin doğru kurulmasını gerektirir.
- **Yasakları:** Asenkron event-driven mimari prensipleri ihlal edilmemelidir.
- **Kabul Kanıtı:** "delivered" callback'i sonrası, ilgili ürün için `review` ve `story` hakkının `ELIGIBLE` olduğunun doğrulanması.
- **Hangi aşamada yapılmalı:** En son ve en olgun aşama.

**E) Reconciliation/tracking polling-first yaklaşım**
- **Artıları:** En savunmacı ve sağlam yaklaşım. Callback'e güvenmek yerine, sistemin kendisinin aktif olarak provider'ı periyodik olarak sorgulamasını sağlar. Callback'in hiç gelmemesi sorununu çözer.
- **Riskleri:** Daha karmaşık bir implementasyon gerektirir (zamanlanmış görevler vb.). Provider API'larına ek yük getirir.
- **Kabul Kanıtı:** `IN_TRANSIT` durumundaki bir kargonun, zamanlanmış bir iş tarafından sorgulanarak `DELIVERED` durumuna getirildiğinin kanıtlanması.
- **Hangi aşamada yapılmalı:** Callback ingestion ile paralel veya hemen sonrasında geliştirilmesi gereken kritik bir parçadır.

## 15. Önerilen İlk Shipment Callback Sırası

- **10S1: Ortak Callback Ingestion & Persistence Foundation**
  - **Amaç:** `10C1`'de payment için önerilen ortak altyapıyı kurmak. Gelen tüm callback'leri (payment, shipment vb.) alacak, imza doğrulamasını yapacak ve `provider_callback_events` tablosuna kaydedecek bir "BFF Ingestion Boundary" ve asenkron "Callback Worker" altyapısı oluşturmak.
  - **Scope:** BFF'e genel bir `/callbacks/{provider}` endpoint'i eklenir. İmza doğrulama ve persistence mantığını içeren bir worker oluşturulur.
  - **Dışarıda Bırakılacaklar:** Domain-spesifik mantık (shipment state güncelleme vb.).
  - **Test/Smoke Kanıtı:** Sahte bir shipment callback'inin başarılı/başarısız imza ile `provider_callback_events` tablosuna doğru `verificationStatus` ile yazılması.
  - **Neden bu sırada:** En temel ve diğer tüm adımların ön koşuludur. `Payment` ve `Shipment` için ayrı ayrı aynı altyapıyı kurmak yerine ortak bir foundation kurmak daha verimlidir.

- **10S2: Shipment Tracking Timeline Append**
  - **Amaç:** Doğrulanmış shipment callback'lerini işleyip, ana `state`'i değiştirmeden sadece ilgili `shipment`'ın `timeline` dizisine bir olay olarak eklemek.
  - **Scope:** Callback worker'ı, `shipment` callback'lerini tanıyacak, `shipment`'ı bulacak ve `timeline`'ına yeni bir event ekleyecek şekilde genişletilir.
  - **Dışarıda Bırakılacaklar:** Ana `shipment.state` mutasyonu, eligibility tetikleme.
  - **Test/Smoke Kanıtı:** Bir `shipment` oluşturduktan sonra, "in_transit" callback'i gönderildiğinde, `shipment`'ın ana `state`'inin değişmediğini ama `timeline`'ına "in_transit" olayının eklendiğini doğrulamak.
  - **Neden bu sırada:** En az riskli işlevsel adımdır. Sistemin `truth`'unu bozmadan callback'lerden gelen veriyi görünür kılar.

- **10S3: Basic Shipment State Command Handoff**
  - **Amaç:** Doğrulanmış `shipped`, `in_transit`, `out_for_delivery` gibi ara durum callback'lerini işleyip ilgili `shipment` state'ini güncellemek. `DELIVERED` bu aşamada dışarıda bırakılır.
  - **Scope:** Callback worker, bu ara durumlar için `TransitionShipmentState` command'ını tetikler. State guard (`isValidTransition`) mantığının doğru çalıştığı doğrulanır.
  - **Dışarıda Bırakılacaklar:** `DELIVERED` state'ine geçiş ve eligibility.
  - **Test/Smoke Kanıtı:** Bir `shipment` `PREPARING` iken, "shipped" callback'i gönderildiğinde `state`'inin `SHIPPED`'e geçtiğini doğrulamak.
  - **Neden bu sırada:** `DELIVERED`'ın yaratacağı karmaşık yan etkileri (eligibility, settlement vb.) devreye sokmadan, `shipment` state machine'inin temel otomasyonunu sağlar.

- **10S4: `DELIVERED` State Transition & Event Outbox**
  - **Amaç:** `delivered` callback'ini işleyerek `shipment` state'ini `DELIVERED` yapmak ve `shipment.delivered` domain event'ini transactional outbox pattern ile yayınlamak.
  - **Scope:** Callback worker, `delivered` callback'leri için `TransitionShipmentToDelivered` command'ını tetikler. `shipment` servisi, state'i güncellerken aynı transaction içinde `outbox` tablosuna event yazar.
  - **Dışarıda Bırakılacaklar:** Eligibility servisinin bu event'i tüketmesi.
  - **Test/Smoke Kanıtı:** "delivered" callback'i sonrası, `shipment`'ın `state`'inin `DELIVERED` olduğunu ve `outbox` tablosunda ilgili `shipment.delivered` event kaydının oluştuğunu doğrulamak.
  - **Neden bu sırada:** En kritik geçiş olan `DELIVERED`'ı ve bunun sistemin geri kalanına yayılmasını sağlayacak olan event üretimini izole bir şekilde ele alır.

- **10S5: Eligibility Consumer for Delivered Event**
  - **Amaç:** `shipment.delivered` event'ini dinleyecek (subscribe) ve `review` ile `story` için `eligibility` kayıtlarını oluşturacak/güncelleyecek bir consumer (worker/servis) oluşturmak.
  - **Scope:** Yeni bir consumer oluşturulur. `outbox`'tan gelen `shipment.delivered` event'ini işler ve `customer-contribution` (veya `review`/`story`) servis(ler)ini çağırarak ilgili hakları açar.
  - **Dışarıda Bırakılacaklar:** Bildirim (Notification) gönderme.
  - **Test/Smoke Kanıtı:** Uçtan uca test: Bir `shipment` için "delivered" callback'i gönderildiğinde, ilgili kullanıcı ve ürün için `review` ve `story` yazma hakkının `ELIGIBLE` olduğunun bir `eligibility check` endpoint'i üzerinden doğrulanması.
  - **Neden bu sırada:** Tüm `shipment callback` akışını, nihai iş değeri olan "kullanıcı hakkı açma" ile tamamlar.

## 16. Shipment Callback İçin Nihai Karar

**SHIPMENT DOMAIN INVENTORY COMPLETE / IMPLEMENTATION REQUIRED**

Bu envanter, shipment callback domain'inin mevcut durumunu, kritik sınırlarını ve potansiyel implementasyon adımlarını ortaya koymuştur. Mevcut `10A` temelleri, güvenli bir shipment callback altyapısı kurmak için yeterlidir ancak gerçek bir implementasyona ihtiyaç duyulmaktadır.

**Net Öneri:**
İlk gerçek implementasyon, doğrudan `shipment`-spesifik `delivered` işlemeye odaklanmamalıdır. Önce, `10B-00B` (Payment Inventory) raporunda da önerildiği gibi, tüm provider callback'leri için ortak olan, güvenli ve soyut bir **"BFF Callback Ingestion Boundary"** kurulmalıdır. Bu, `10S1` paketinde tanımlanmıştır.

Shipment `delivered`/`eligibility` processing'e geçmeden önce **zorunlu** olan guard'lar şunlardır:
1.  **BFF Ingestion Endpoint & Async Worker:** Callback'leri alıp asenkron işleme kuyruğuna atmak için.
2.  **Signature Verification Guard:** Sahte callback'leri reddetmek için.
3.  **Idempotency/Replay Guard:** Mükerrer callback işlemeyi engellemek için.
4.  **State Transition Guard:** `shipment` state machine'inin geçersiz geçişleri reddetmesi için.
5.  **Transactional Outbox Pattern:** `shipment` state'i güncellendiğinde, domain event'inin güvenilir bir şekilde yayınlandığından emin olmak için.

## 17. Açık Riskler / Sonraki Kontrol

- **Real signature verification:** Gerçek kriptografik doğrulama mantığı henüz yazılmamıştır.
- **Callback event ordering:** `delivered`'ın `in_transit`'ten önce gelmesi gibi senaryoların state machine tarafından nasıl ele alınacağı daha detaylı test edilmelidir.
- **Duplicate delivered callback:** Idempotency mekanizmasının, özellikle `DELIVERED` gibi kritik bir olay için, state ve eligibility üzerinde mükerrer etki yaratmadığı uçtan uca test edilmelidir.
- **Multi-package / line-level delivered handling:** Tek bir siparişteki birden fazla paketin veya satırın ayrı ayrı teslim edilmesi senaryosunun, `order` ve `eligibility` üzerindeki etkileri detaylı olarak ele alınmalıdır.
- **Review eligibility duplicate creation:** `shipment.delivered` event'inin tekrar işlenmesi durumunda mükerrer `review` hakkı oluşturulmaması garanti altına alınmalıdır.
- **Story eligibility duplicate creation:** Aynı şekilde, mükerrer `story` hakkı oluşturulmaması sağlanmalıdır.
- **Postgres callback smoke:** Mevcut callback smoke testi in-memory çalışmaktadır. `idempotency_key` çakışması gibi Postgres'e özgü davranışları test eden bir smoke testi gereklidir.
- **Reconciliation / carrier polling:** Callback'in hiç gelmediği "kayıp" senaryoları için kargo firmasını periyodik olarak sorgulayan bir mekanizma (reconciliation) tasarlanmalı ve eklenmelidir.
- **Provider-specific carrier mapping:** Farklı kargo firmalarının (Aras, Yurtiçi, Trendyol Express vb.) farklı payload formatlarını ortak bir iç modele dönüştürecek esnek bir mapping katmanı gereklidir.
- **Shipment timeline vs shipment state ayrımı:** Kod implementasyonunda, ana `state`'in mi yoksa `timeline`'ın mı "truth" olarak daha çok referans alındığı netleştirilmeli ve tutarlı kullanılmalıdır. Ana `state` birincil `truth` olmalıdır.
