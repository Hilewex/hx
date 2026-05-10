
# HARDENING-10B-00E — Payout Callback / Finance-Risk Inventory

## 1. Genel Durum

- **Payout provider callback bugün repo’da var mı?**
  - **HAYIR.** `HARDENING-10B-00A` ve `HARDENING-10-00` raporlarının da teyit ettiği gibi, kod tabanında (`services/payout`, `apps/bff`) gelen bir payout (ödeme çıkışı) provider callback'ini işleyecek, doğrulayacak veya bir domain mantığını tetikleyecek bir bileşen (örn: webhook endpoint, worker) bulunmamaktadır. `services/payout/src/payout.ts` içerisindeki `applyPayoutBatchAction` fonksiyonu, bir batch onaylandığında `provider-adapter` üzerinden giden (outbound) bir istek simülasyonu yapar ve `payoutItem`'ın durumunu `PROCESSING` olarak günceller, ancak provider'dan gelecek asenkron bir sonucu (paid, failed, returned vb.) işleyecek bir mekanizma yoktur.

- **10A foundation payout callback için ne sağlıyor?**
  - `HARDENING-10A` serisi, payout callback dahil olmak üzere tüm provider callback'leri için temel yapı taşlarını (foundation) atmıştır:
    - **Contract:** `ProviderCallbackEnvelope`, `ProviderCallbackRecord` ve imza doğrulama (`SignatureVerificationResult`) gibi standartlaştırılmış veri sözleşmeleri `packages/contracts/src/provider.ts` dosyasına eklenmiştir. Bu sözleşmeler, provider'dan gelen bilginin bir "iş gerçeği" değil, bir "olay kaydı" olduğunu `boundary: { businessTruthMutated: false }` bayrağı ile zorunlu kılar.
    - **Persistence:** Gelen callback olaylarını saklamak için `provider_callback_events` tablosu (`infra/migrations/20260504_001_provider_callback_persistence.sql`) ve bu tabloya erişimi soyutlayan `ProviderCallbackEventRepository` (`packages/persistence/src/provider-callback.ts`) eklenmiştir.
    - **Idempotency:** `provider_event_id` üzerinden duplicate kayıtları veritabanı seviyesinde önleyecek mekanizmalar (`UNIQUE INDEX`) migration'a dahil edilmiştir.
    - **Smoke Test:** In-memory repository'nin temel davranışlarını doğrulayan `tests/smoke/suites/provider-callback-foundation.ts` testi mevcuttur.

- **Hangi parçalar hâlâ eksik?**
  - `HARDENING-10B-00A` raporunda da belirtildiği gibi, en temel parçalar eksiktir:
    - **BFF Callback Endpoint:** Payout provider'ından (örn: Wise, Payoneer) gelen HTTP POST isteklerini alacak public bir endpoint yoktur.
    - **Signature Verification Logic:** Gerçek kriptografik imza doğrulama mantığı yazılmamıştır.
    - **Payout Domain Processing Logic:** Kaydedilen bir `ProviderCallbackRecord`'u okuyup, "bu bir başarılı ödeme çıkışı mı?", "hangi `payoutItem`'a ait?" gibi soruları cevaplayacak ve `payout` owner command'ını (`MarkAsPaid`, `MarkAsFailed` vb.) tetikleyecek bir iş mantığı (worker/consumer) yoktur.
    - **Reconciliation Runtime:** `PROCESSING` durumunda takılı kalmış veya hiç callback almayan payout'ları provider'dan periyodik olarak sorgulayacak bir "reconciliation" mekanizması yoktur.

## 2. Payout / Finance Sistem Sınırı

Açık yaz:
- **Payment tahsilat sistemi ile payout ödeme çıkış sistemi aynı şey değildir.**
  - `planlama/15-ödeme sistemi .md` ödeme (payment) sistemini "checkout aşamasında doğrulanmış sipariş hazırlığını finansal işlem aşamasına taşıyan" bir tahsilat mekanizması olarak tanımlar. `planlama/54-payaut ödeme çıkış sistemi.md` ise payout sistemini "finansal mutabakat sistemi tarafından üretilen ve ödenebilir statüye geçmiş bakiyeleri... ödeme talimatına dönüştüren" bir ödeme *çıkış* (icra) sistemi olarak tanımlar. Biri para alır, diğeri para gönderir.

- **Settlement/hakediş ile payout ödeme çıkışı aynı şey değildir.**
  - `planlama/54-payaut ödeme çıkış sistemi.md` (satır 25) "Hakediş oluşması ile ödeme çıkışı aynı şey değildir" ilkesini net bir şekilde koyar. `Settlement` (hakediş), bir gelirin hak edildiğini ve finansal olarak kesinleştiğini (`SETTLED` state) belirleyen hesaplama sistemidir. `Payout` ise bu kesinleşmiş ve `PAYABLE` (ödenebilir) hale gelmiş bakiyeyi alıp gerçekten transfer etme eylemidir. `packages/contracts/src/settlement.ts` ve `packages/contracts/src/payout.ts` bu iki domain'in ayrı state'lere ve amaçlara sahip olduğunu gösterir.

- **Payout provider response business truth değildir.**
  - Bu, sistemin temel bir güvenlik ilkesidir. `packages/contracts/src/provider.ts` dosyasındaki `ProviderBoundaryFlags` arayüzü ve `createProviderResultEnvelope` gibi yardımcı fonksiyonlar, `businessTruthMutated: false` bayrağını zorunlu kılarak bu prensibi kod seviyesinde uygular. `tests/smoke/suites/payout-provider-boundary.ts` smoke testi de `applyPayoutBatchAction` sonrası oluşan provider envelope'un `payoutItem`'ın durumunu `PAID` yapmadığını, `PROCESSING`'de bıraktığını ve boundary flag'lerinin `false` olduğunu doğrular.

- **Payout callback finance/risk guard hattından geçmeden paid/failed etkisi üretemez.**
  - `planlama/aşama-2/OWNER_MATRIX.md` ve `GUARD_MATRIX.md` dokümanlarına göre, `payout` ve `settlement` gibi finansal truth'lar M6 (Financial Truth Owner) koruması altındadır. Bir callback'in doğrudan bu truth'ları değiştirmesi mimari ihlalidir. `planlama/54-payaut ödeme çıkış sistemi.md` (satır 105), risk/fraud katmanının payout'ları bloklayabileceğini açıkça belirtir. Callback, bu guard'ları atlayamaz.

- **Risk/fraud hold varsa payout callback owner state’i bypass edemez.**
  - `planlama/49-fraud risk abuse sistemi.md` ve `planlama/54-payaut ödeme çıkış sistemi.md` (satır 254-261), bir risk/fraud incelemesi veya hold durumunda ödeme çıkışının durdurulması gerektiğini belirtir. `packages/contracts/src/payout.ts`'deki `PayoutItemStatus`'u `ON_HOLD` ve `PayoutHoldReasonCode`'u `RISK_REVIEW_OPEN` olarak tanımlar. Gelen bir `paid` callback'i, `ON_HOLD` durumundaki bir `payoutItem`'ı doğrudan `PAID` yapamamalıdır. Önce hold'un kaldırılması gerekir.

- **BFF truth owner değildir.**
  - `planlama/aşama-2/OWNER_MATRIX.md` (satır 207-226) BFF'in (M7) "read aggregation only" olduğunu ve asla write/truth owner olamayacağını kesin bir dille belirtir. BFF'e eklenecek bir callback endpoint'i, gelen veriyi sadece alıp asenkron işlenmek üzere ilgili owner sisteme (örn: bir worker'a) paslamalıdır, kendisi işlememelidir. `apps/bff/src/server/payout.ts` dosyasındaki mevcut handler'lar da bu prensibe uygun olarak sadece `payout` servisindeki fonksiyonları çağırmaktadır.

## 3. Payout Callback Ne Temsil Eder?

Şunları ayrıştır:
- **provider payout event notification:** Evet, callback özünde provider'ın (örn: Wise) kendi sisteminde bir olay ("transfer sent", "transfer failed", "money returned") olduğunu bizim sisteme bildirmesidir.
- **payout transfer result signal:** Evet, gelen callback'in içeriği, başlattığımız bir `payoutItem`'ın transfer sonucu hakkında güçlü bir "sinyal" içerir. Ancak bu "sinyal"dir, "kesin gerçek" (truth) değildir.
- **raw provider payload:** Evet, callback'in gövdesi (body), provider'ın kendine özgü formatında gönderdiği ham veridir. Bu veri, `ProviderCallbackRecord` içindeki `rawPayload` alanına dokunulmadan, denetim için kaydedilmelidir.
- **provider transfer/reference id:** Evet, callback genellikle bizim `payoutItemId` veya batch ID'miz ile provider tarafındaki referansı birleştiren bir bilgi içerir. Bu, callback'i doğru `payoutItem` entity'si ile eşleştirmek için kritik öneme sahiptir.
- **verification result:** Callback, işleme alınmadan önce bir imza doğrulama (`SignatureVerificationResult`) ve tekrar/kopya (`replayDetected`) kontrolünden geçmelidir. Bu sonuçlar, callback kaydının meta verileridir.
- **replay/idempotency status:** Evet, callback işlenirken `providerEventId` veya `idempotencyKey` kullanılarak bunun daha önce işlenip işlenmediği kontrol edilir. Sonuç (`first_seen`, `duplicate_event`) `ProviderCallbackRecord`'a yazılır.
- **payout owner transition adayı:** Evet, en önemli tanım budur. Doğrulanmış, kopyası olmayan ve geçerli bir callback, `payout` domain'i için bir "state transition" (örn: `PROCESSING` -> `PAID`) işlemini tetikleyecek bir "aday"dır. Doğrudan bir `transition` değildir.
- **finance correction adayı:** Evet, özellikle `failed` veya `returned` gibi bir callback, `FinanceCorrectionRecord` oluşturulması için bir aday olabilir. Örneğin, beklenmedik bir iade (return), finansal bir tutarsızlığa işaret edebilir.
- **risk/fraud signal adayı:** Evet, anormal bir callback paterni (örn: çok sayıda `failed` veya sahte `paid` callback denemesi) bir `RiskSignal` üretmek için adaydır.

**Açık yaz:**
Payout callback doğrudan “hakediş kesinleşti”, “ödeme çıkışı tamamlandı”, “finance settled” veya “risk clear” anlamına gelmez.

## 4. Payout Callback Event / Status Modeli

Aşağıdaki yorumlar, `packages/contracts/src/payout.ts` ve diğer planlama belgelerindeki tanımlara dayanmaktadır.

- **accepted / queued:**
  - `callback record processingStatus`: `accepted` -> `processed`.
  - `payout owner command`’a dönüşebilir mi?: Evet, `MarkPayoutAsAcceptedByProvider` gibi bir ara durumu güncelleyen bir komuta dönüşebilir.
  - `payout item/batch status etkisi`: `PROCESSING` durumunu teyit eder veya `PROVIDER_ACCEPTED` gibi bir ara state'e taşıyabilir.
  - `finance/settlement etkisi`: **Hayır.**
  - `risk/fraud etkisi`: **Hayır.**
  - Hangi durumda sadece kayıt/ignored kalmalı?: `payoutItem` zaten daha ileri bir durumdaysa (örn: `PAID`).

- **processing:**
  - `callback record processingStatus`: `accepted` -> `processed`.
  - `payout owner command`’a dönüşebilir mi?: Evet, `MarkPayoutAsProcessing` komutunu tetikleyebilir.
  - `payout item/batch status etkisi`: `PROCESSING` durumunu teyit eder.
  - `finance/settlement etkisi`: **Hayır.**
  - `risk/fraud etkisi`: **Hayır.**
  - Hangi durumda sadece kayıt/ignored kalmalı?: `payoutItem` zaten `PROCESSING` veya ilerisindeyse.

- **paid / succeeded:**
  - `callback record processingStatus`: `accepted` -> `processed`.
  - `payout owner command`’a dönüşebilir mi?: **EVET.** Bu en kritik geçiştir. `MarkPayoutAsPaid` komutunu tetikler.
  - `payout item/batch status etkisi`: `payoutItem`'ı `PAID` durumuna geçirir. Eğer batch'teki tüm item'lar tamamlanırsa, `payoutBatch`'i `COMPLETED` yapabilir.
  - `finance/settlement etkisi`: **EVET, DOLAYLI YOLDAN.** `payoutItem`'ın `PAID` olması, ilgili `settlementLine`'ın `paid_out` etkisine sahip olmasını ve `CLOSED` durumuna geçmesini tetikler.
  - `risk/fraud etkisi`: **Hayır.**
  - Hangi durumda sadece kayıt/ignored kalmalı?: `payoutItem` zaten `PAID` ise (`duplicate`).

- **failed:**
  - `callback record processingStatus`: `accepted` -> `processed`.
  - `payout owner command`’a dönüşebilir mi?: **EVET.** `MarkPayoutAsFailed` komutunu, `failureReason` ile birlikte tetikler.
  - `payout item/batch status etkisi`: `payoutItem`'ı `FAILED` yapar. `payoutBatch`'i `PARTIALLY_FAILED` veya `FAILED` yapabilir.
  - `finance/settlement etkisi`: Evet, dolaylı. `settlementLine`'da bir düzeltme (`finance correction`) veya yeniden deneme (`re-queue`) ihtiyacı doğurabilir.
  - `risk/fraud etkisi`: Evet, bir `RiskSignal` (`PAYMENT_ANOMALY`) üretebilir.
  - Hangi durumda sadece kayıt/ignored kalmalı?: `payoutItem` zaten nihai bir durumdaysa (örn: `CANCELLED`).

- **rejected:**
  - `callback record processingStatus`: `accepted` -> `processed`.
  - `payout owner command`’a dönüşebilir mi?: **EVET.** `MarkPayoutAsFailed` komutuna benzer şekilde, `reason: 'rejected_by_provider'` ile tetikler.
  - `payout item/batch status etkisi`: `payoutItem`'ı `FAILED` yapar.
  - `finance/settlement etkisi`: `failed` ile aynı.
  - `risk/fraud etkisi`: `failed` ile aynı.
  - Hangi durumda sadece kayıt/ignored kalmalı?: `payoutItem` zaten nihai bir durumdaysa.

- **returned / reversed:**
  - `callback record processingStatus`: `accepted` -> `processed`.
  - `payout owner command`’a dönüşebilir mi?: **EVET.** `MarkPayoutAsReturned` komutunu tetikler. Bu, en ciddi finansal senaryolardan biridir.
  - `payout item/batch status etkisi`: `payoutItem`'ı `RETURNED` yapar.
  - `finance/settlement etkisi`: **KESİNLİKLE EVET.** Bu, acil bir `FinanceCorrectionRecord` oluşturulmasını gerektirir, çünkü para gönderilmiş ama geri dönmüştür. `settlementLine`'ın yeniden `PAYABLE` yapılması veya mahsup edilmesi gerekir.
  - `risk/fraud etkisi`: **KESİNLİKLE EVET.** Bir `RiskSignal` (`PAYMENT_ANOMALY`) üretmeli ve muhtemelen ilgili alıcı için geçici bir `payout hold` tetiklemelidir.
  - Hangi durumda sadece kayıt/ignored kalmalı?: `payoutItem` zaten `RETURNED` olarak işaretlenmişse.

- **cancelled:**
  - `callback record processingStatus`: `accepted` -> `processed`.
  - `payout owner command`’a dönüşebilir mi?: Evet, `MarkPayoutAsCancelled` komutunu tetikler.
  - `payout item/batch status etkisi`: `payoutItem`'ı `CANCELLED` yapar.
  - `finance/settlement etkisi`: Evet, ilgili `settlementLine`'ın tekrar `PAYABLE` hale gelmesini sağlayabilir.
  - `risk/fraud etkisi`: **Hayır.**
  - Hangi durumda sadece kayıt/ignored kalmalı?: `payoutItem` zaten `CANCELLED` ise.

- **held / blocked:**
  - `callback record processingStatus`: `accepted` -> `processed`.
  - `payout owner command`’a dönüşebilir mi?: Evet, `PlacePayoutOnHold` komutunu, provider'dan gelen bir `reasonCode` ile tetikleyebilir.
  - `payout item/batch status etkisi`: `payoutItem`'ı `ON_HOLD` yapar.
  - `finance/settlement etkisi`: **Hayır.**
  - `risk/fraud etkisi`: Evet, bir risk incelemesini tetikleyebilir.
  - Hangi durumda sadece kayıt/ignored kalmalı?: Zaten `ON_HOLD` ise.

- **unknown_result:**
  - `callback record processingStatus`: `reconciliation_required`.
  - `payout owner command`’a dönüşebilir mi?: **Hayır, doğrudan değil.** Bir reconciliation (uzlaşma/sorgulama) sürecini tetiklemelidir.
  - `payout item/batch status etkisi`: `payoutItem`'ın durumunu `PROCESSING`'de bırakır ama bir sonraki sorgulama için işaretler.
  - `finance/settlement etkisi`: **Hayır.**
  - `risk/fraud etkisi`: **Hayır.**
  - Hangi durumda sadece kayıt/ignored kalmalı?: Her zaman işlenip bir reconciliation süreci başlatmalıdır.

- **duplicate / replay:**
  - `callback record processingStatus`: `duplicate`.
  - `payout owner command`’a dönüşebilir mi?: **Hayır.**
  - `payout item/batch status etkisi`: **Hayır.**
  - `finance/settlement etkisi`: **Hayır.**
  - `risk/fraud etkisi`: Yüksek frekansta olursa evet.
  - Hangi durumda sadece kayıt/ignored kalmalı?: Her zaman.

- **signature_failed:**
  - `callback record processingStatus`: `rejected`.
  - `payout owner command`’a dönüşebilir mi?: **Hayır.**
  - `payout item/batch status etkisi`: **Hayır.**
  - `finance/settlement etkisi`: **Hayır.**
  - `risk/fraud etkisi`: **EVET.** `RiskSignal` (`FAKE_CALLBACK_ATTEMPT`) üretmelidir.
  - Hangi durumda sadece kayıt/ignored kalmalı?: Her zaman.

- **unsupported:**
  - `callback record processingStatus`: `ignored`.
  - `payout owner command`’a dönüşebilir mi?: **Hayır.**
  - `payout item/batch status etkisi`: **Hayır.**
  - `finance/settlement etkisi`: **Hayır.**
  - `risk/fraud etkisi`: **Hayır.**
  - Hangi durumda sadece kayıt/ignored kalmalı?: Her zaman.

## 5. Paid / Succeeded Boundary

- **Provider paid callback doğrudan payout item/batch’i PAID yapabilir mi?**
  - **HAYIR.** Callback, `payout` owner'ını by-pass edemez. Callback'i işleyen worker/consumer, callback verisini doğruladıktan sonra `payout` servisine ait `MarkPayoutAsPaid` gibi bir owner command çağırmalıdır. `payout` servisinin kendisi bu state geçişinin sahibidir.

- **Paid transition hangi owner command üzerinden olmalı?**
  - `MarkPayoutAsPaid` gibi, `payoutItemId` ve muhtemelen `providerReference`, `paidAt` gibi kanıt bilgilerini içeren bir command üzerinden olmalıdır.

- **Paid olmadan önce hangi guardlar tekrar kontrol edilmeli?**
  - **State Guard:** `payoutItem`'ın mevcut state'inin `PROCESSING` gibi `PAID`'e geçişe uygun bir durumda olup olmadığı kontrol edilmelidir.
  - **Idempotency Guard:** Bu `payoutItem`'ın zaten `PAID` olup olmadığı kontrol edilmelidir.
  - **Risk/Hold Guard:** `payoutItem` veya ilgili `beneficiary` üzerinde aktif bir `hold` olup olmadığı son bir kez kontrol edilebilir.

- **Risk/fraud hold varsa paid callback nasıl davranmalı?**
  - Callback ingestion süreci, `payoutItem`'ın `ON_HOLD` olduğunu görmelidir. Gelen `paid` bilgisi, `payoutItem`'ın state'ini değiştirmemeli, bunun yerine bir not veya dahili bir olay ("provider 'paid' dedi ama item hold'da") olarak kaydedilip bir `finance` veya `risk` review kuyruğuna düşürülmelidir. Hold kaldırılmadan state değişmemelidir.

- **Aynı paid callback tekrar gelirse ne olmalı?**
  - `ProviderCallbackEventRepository` seviyesinde `providerEventId` ile duplicate olduğu tespit edilmeli ve `processingStatus: 'duplicate'` olarak işaretlenip işlem yapılmamalıdır. Eğer bu kontrolden bir şekilde geçerse, domain seviyesindeki `payoutItem`'ın state'inin zaten `PAID` olduğunu gören idempotency guard'ı, ikinci bir etki yaratmasını engellemelidir.

- **Batch-level paid ile item-level paid ayrımı nasıl korunmalı?**
  - Truth, `payoutItem` seviyesinde tutulmalıdır. `payoutBatch`'in durumu (`COMPLETED`, `PARTIALLY_FAILED`), içindeki `payoutItem`'ların durumlarının bir sonucudur (aggregation). Bir `paid` callback'i, ilgili `payoutItem`'ı `PAID` yapar. Ayrı bir süreç (veya aynı transaction'ın sonu), batch'teki tüm item'ların durumunu kontrol edip `payoutBatch`'in genel durumunu günceller.

**Net karar:**
Provider callback hiçbir durumda payout owner’ı bypass etmemeli.

## 6. Failed / Returned / Reversed Boundary

- **Failed callback doğrudan finance correction oluşturabilir mi?**
  - **HAYIR, DOĞRUDAN DEĞİL.** `failed` callback, `payout` owner tarafından `MarkPayoutAsFailed` command'ı ile işlenmelidir. `payout` servisi, bu başarısızlığın bir finansal düzeltme gerektirip gerektirmediğine karar verip, `finance-correction` servisine bir `CreateFinanceCorrection` command'ı göndermelidir. Yani `payout` owner'ı aracı olmalıdır.

- **Returned/reversed payout nasıl ele alınmalı?**
  - Bu, `failed`'den daha ciddi bir durumdur. Para hesaptan çıkmış ama geri dönmüştür.
  1. Callback, `MarkPayoutAsReturned` command'ını tetikler. `payoutItem` state'i `RETURNED` olur.
  2. Bu durum, otomatik olarak hem bir `FinanceCorrectionRecord` (`reason: PAYOUT_RETURNED`) oluşturulmasını hem de bir `RiskSignal` (`PAYMENT_ANOMALY`) üretilmesini tetiklemelidir.
  3. İlgili `beneficiary` için geçici bir `payout hold` uygulanması değerlendirilmelidir.

- **Failed payout yeniden denemeye alınabilir mi?**
  - **EVET.** `failureReason`'a bağlı olarak.
    - `temporary_bank_issue` gibi geçici bir hataysa, otomatik retry (yeniden deneme) kuyruğuna alınabilir.
    - `invalid_account_number` gibi kalıcı bir hataysa, retry edilmemeli, `finance-correction` veya `support` review'a düşürülmelidir.

- **Hangi durumda payout item failed, hangi durumda batch partially_failed olmalı?**
  - Bir `payoutItem` başarısız olduğunda, kendi state'i `FAILED` olur.
  - Eğer bu item'ın ait olduğu `payoutBatch`'teki diğer item'lar başarılı olduysa (veya olmaya devam ediyorsa), `payoutBatch`'in durumu `PARTIALLY_FAILED` olur. Eğer batch'teki tüm item'lar `FAILED` olursa, batch'in durumu `FAILED` olabilir.

- **Finance correction owner ne zaman devreye girmeli?**
  - `failed` (özellikle `invalid_account_number` gibi kalıcı hatalarda) ve özellikle `returned` durumlarında devreye girmelidir. Görevi, bu tutarsızlığı `settlement` ve `payout` kayıtlarında düzeltmek (örn: parayı tekrar `payable` yapmak, mahsup kaydı oluşturmak) ve problemin nedenini çözmektir.

- **Risk signal hangi durumda üretilmeli?**
  - Özellikle `returned` callback'lerde.
  - Anormal sayıda `failed` callback'lerde (örn: aynı alıcı için sürekli `failed`).
  - Geçersiz imza (`signature_failed`) ile gelen sahte `failed`/`returned` callback denemelerinde.

**Net karar:**
Provider failed/returned callback doğrudan settlement/finance truth mutate etmemeli; payout owner event/command zinciri üzerinden ilerlemeli.

## 7. Settlement / Hakediş Boundary

- **Payout callback settlement line state’i doğrudan değiştirebilir mi?**
  - **HAYIR, ASLA.** Bu, `OWNER_MATRIX.md`'nin en temel kuralının ihlali olur. `payout` callback'i, `payout` owner'ını etkiler. `payout` owner (`payout` servisi), kendi state'ini güncelledikten sonra (örn: `payoutItem` -> `PAID`), `settlement` servisine bir command göndererek veya bir `payout.paid` event'i yayınlayarak `settlementLine`'ın state'inin güncellenmesini tetikleyebilir.

- **Payable amount ile paid amount ayrımı nasıl korunmalı?**
  - Bu ayrım `packages/contracts/src/payout.ts`'deki `PayoutAmountSummary` içinde tanımlanmıştır.
    - `payableAmount`: Ödenmesi gereken, hak edilmiş tutardır. `settlement`'tan gelir.
    - `paidAmount`: Gerçekten ödenmiş tutardır. Yalnızca `payout` servisi, `paid` callback'ini başarıyla işledikten sonra bu alanı günceller.
  Bu iki alan asla karıştırılmamalıdır.

- **Settled/payable hakediş ile actual payout result ilişkisi nasıl kurulmalı?**
  - 1. `settlementLine` `SETTLED` ve sonra `PAYABLE` olur.
  - 2. `payout` servisi, `payable` `settlementLine`'lardan `payoutItem` oluşturur.
  - 3. `payoutItem` işlenir (`PROCESSING` -> `PAID`/`FAILED`).
  - 4. `payoutItem`'ın nihai sonucu (`PAID`, `RETURNED` vb.), ilgili `settlementLine`'ın state'ini etkilemek üzere geri beslenir (örn: `paid_out` etkisini ekler, state'i `CLOSED` yapar).

- **Payout failed/returned olduğunda settlement tekrar payable olur mu, yoksa finance correction mı gerekir?**
  - Bu, `failureReason`'a bağlıdır.
    - **Geçici Hata:** `payoutItem` yeniden deneme kuyruğuna alınabilir. `settlementLine`'ın durumu değişmez.
    - **Kalıcı Hata (`FAILED`):** `settlementLine` tekrar `PAYABLE` yapılmamalıdır. Bunun yerine bir `FinanceCorrectionRecord` oluşturulmalıdır. Finans ekibi sorunu (örn: yanlış IBAN) çözdükten sonra, manuel olarak yeni bir `payoutItem` oluşturabilirler.
    - **`RETURNED`:** Kesinlikle `FinanceCorrectionRecord` gerekir. Otomatik olarak `PAYABLE` yapılmamalıdır çünkü bu ciddi bir finansal anomaliye işaret eder.

- **Kupon/sponsor/commission etkileri provider callback payload’dan türeyebilir mi?**
  - **HAYIR, ASLA.** `planlama/46-kupon sistemi.md`'ye göre kupon ve komisyon gibi finansal kurallar, checkout ve settlement sırasında, sistemin kendi içindeki `truth`'a göre hesaplanır. Payout provider'ı sadece net bir tutarı transfer etmekle sorumludur. Provider'ın payload'u bu hesaplamalar için güvenilir bir kaynak değildir.

## 8. Risk / Fraud Boundary

- **Risk/fraud hold payout ön koşulunda nasıl uygulanmalı?**
  - `payout` servisi, bir `settlementLine`'ı `payoutItem`'a dönüştürürken veya bir `payoutBatch`'i `APPROVED` yapmadan önce, ilgili `beneficiary` (alıcı) veya `settlementLine` üzerinde bir `risk hold` olup olmadığını `risk` servisinden kontrol etmelidir. Eğer hold varsa, `payoutItem` `ON_HOLD` state'inde oluşturulmalı veya batch `BLOCKED` durumuna geçmelidir.

- **Payout callback risk/fraud hold’u bypass edebilir mi?**
  - **HAYIR.** `paid` callback'i gelse bile, eğer `payoutItem` `ON_HOLD` durumundaysa, state `PAID`'e geçmemelidir. Bu durum bir anomali olarak işaretlenip `risk` veya `finance` ekibinin incelemesine sunulmalıdır.

- **Sahte paid callback riski nasıl yönetilmeli?**
  - **İmza Doğrulaması (Signature Verification):** Bu en önemli savunma katmanıdır. `signature_failed` olan hiçbir callback işleme alınmamalı ve bir `RiskSignal` üretmelidir.
  - **IP Kısıtlaması:** Mümkünse, callback'lerin yalnızca provider'a ait bilinen IP adreslerinden gelmesi sağlanmalıdır.
  - **Reconciliation:** Sadece callback'e güvenmek yerine, periyodik olarak provider API'ını sorgulayıp işlemin durumunu teyit etmek (reconciliation) sahte callback'lere karşı ek bir güvence sağlar.

- **Anormal payout returned/failed pattern risk sinyali üretmeli mi?**
  - **EVET, KESİNLİKLE.** Belirli bir alıcı için kısa sürede çok sayıda `returned` veya `failed` payout olması, hesap bilgilerinin ele geçirildiği, sahte bir alıcı olduğu veya başka bir suistimal girişimine işaret edebilir. Bu durum, otomatik olarak yüksek öncelikli bir `RiskCase` oluşturmalıdır.

- **Risk case varsa provider paid callback ne yapmalı?**
  - Callback, `risk hold` senaryosundaki gibi davranmalıdır. Gelen `paid` bilgisi, state'i değiştirmemeli, `RiskCase`'e bir kanıt olarak eklenmeli ve `risk` analistinin incelemesine sunulmalıdır. Analist `case`'i çözüp `hold`'u kaldırana kadar ödeme `PAID` sayılmamalıdır.

- **Risk cleared olmadan payout retry yapılabilir mi?**
  - **HAYIR.** Eğer bir `payoutItem` `risk hold` nedeniyle `FAILED` veya `ON_HOLD` durumundaysa, `risk case` çözülüp `hold` kaldırılmadan yeniden denemeye (retry) alınmamalıdır.

## 9. Idempotency / Replay / Duplicate Risk

- **`providerEventId` ne için kullanılmalı?**
  - Provider'ın her bir callback olayı için gönderdiği benzersiz ID'dir. `ProviderCallbackEventRepository`'de `ON CONFLICT (provider_domain, provider_name, provider_event_id)` kuralıyla, aynı callback'in veritabanına **yalnızca bir kez** kaydedilmesini ve mükerrer işlenmesini engellemek için birincil anahtar olarak kullanılmalıdır. Bu, "event-level idempotency" sağlar.

- **`provider transfer/reference id` ne için kullanılmalı?**
  - Bu, genellikle bizim `payoutItemId`'mizin veya `batchId`'mizin provider tarafındaki karşılığıdır. Gelen callback'i bizim sistemimizdeki doğru `payout` entity'si ile **eşleştirmek** için kullanılır.

- **`payout item id` / `batch id` ne için kullanılmalı?**
  - Bunlar bizim iç sistemimizdeki primary key'lerdir. Provider referansı ile eşleştirme yapıldıktan sonra, hangi `payoutItem` veya `payoutBatch`'in state'inin güncelleneceğini belirlemek için kullanılır.

- **duplicate paid/failed callback nasıl yönetilmeli?**
  - `providerEventId` ile `ProviderCallbackEventRepository` seviyesinde yakalanmalıdır. Repository'nin `insert` metodu, duplicate kaydı engeller. Servis mantığı, bu durumu `processingStatus: 'duplicate'` olarak işaretlemeli ve herhangi bir command/event tetiklemeden işlemi sonlandırmalıdır. Eğer bir şekilde bu kontrolden geçerse, `payout` servisindeki state guard (`payoutItem`'ın zaten `PAID` olması) ikinci bir etkiyi önlemelidir.

- **same provider reference farklı result ile gelirse ne yapılmalı?**
  - Bu kritik bir anomali durumudur. Örn: önce `paid`, sonra aynı referansla `failed` gelmesi.
  - State machine, `PAID` gibi nihai bir durumdan `FAILED`'a geçişi engellemelidir (`invalid transition`).
  - Bu durum, acil bir `FinanceCorrectionRecord` ve/veya `RiskCase` oluşturmalı ve manuel incelemeye alınmalıdır.

- **event ordering sorunu nasıl ele alınmalı? Örnek: failed callback paid callback’ten sonra gelirse.**
  - `planlama/aşama-3/TRANSITION_POLICIES.md`'de belirtildiği gibi, state machine'in bu durumu yönetmesi gerekir. Eğer `payoutItem`'ın state'i `PAID` gibi nihai bir duruma geçmişse, sonradan gelen `failed` callback'i "Invalid Transition" olarak reddedilmeli ve state'i değiştirmemelidir. Bu durum da bir anomali olarak loglanmalı ve incelenmelidir.

- **Postgres `idempotency_key` conflict limiti payout callback için risk oluşturur mu?**
  - **EVET.** `HARDENING-10B-00A` raporunun da işaret ettiği gibi, `PostgresProviderCallbackEventRepository`'nin `insert` sorgusu, `idempotency_key` için `ON CONFLICT` kuralı içermiyor. Migration dosyasında `UNIQUE INDEX` olduğu için, duplicate bir `idempotency_key` ile `insert` denemesi veritabanı hatası (`unique_violation`) fırlatacaktır. Bu, uygulamanın çökmesine neden olabilir. Bu bir risktir ve uygulamanın bu hatayı yakalayıp, mevcut kaydı bularak `duplicate` olarak işaretlemesi gerekir.

## 10. Security / Signature / Config Boundary

- **Signature verification olmadan payout callback processing yapılabilir mi?**
  - **HAYIR, KESİNLİKLE YAPILMAMALI.** Bu, P0 seviyesinde bir finansal risktir. Sahte bir `paid` callback'i, platformun haksız yere ödeme yapmış gibi davranmasına ve ciddi finansal kayıplara yol açar. İmza doğrulaması, callback işleme hattının en başında, veriyi kaydetmeden hemen önce yapılmalıdır.

- **Provider secret/env nerede yönetilmeli?**
  - `planlama/KONFIGURASYON_YONETIMI.md`'ye göre (satır 51-80), `payout provider credentials` ve imza doğrulama `secret`'ları `C0 — Secret config` sınıfındadır. Bunlar repo'da veya DB'de değil, bir "secret manager" (örn: HashiCorp Vault, AWS Secrets Manager) içinde yönetilmeli ve runtime'a güvenli bir şekilde enjekte edilmelidir.

- **Public webhook endpoint rate limit / abuse guard gerektirir mi?**
  - **EVET.** DDoS saldırıları veya anlamsız isteklerle sistemi yormayı engellemek için rate limiting, IP filtreleme gibi temel korumalar zorunludur.

- **Fake paid callback riski nasıl sınırlanmalı?**
  - Güçlü **imza doğrulaması** ile sınırlanır. `signature_failed` olan callback'ler `rejected` olarak işaretlenmeli ve asla işlenmemelidir.

- **Replay paid callback riski nasıl sınırlanmalı?**
  - **Idempotency kontrolü** (`providerEventId`) ve potansiyel olarak callback payload'undaki bir **timestamp kontrolü** (belirli bir zaman penceresi dışındaki eski callback'leri reddetme) ile sınırlanır.

- **Payout provider credentials hangi config sınıfında olmalı?**
  - `C0 — Secret config`.

## 11. BFF Boundary

- **BFF payout callback endpoint açılırsa ne yapabilir?**
  - `planlama/VERI_AKISI_SENKRONIZASYON_MODELI.md` ve `OWNER_MATRIX.md`'ye göre BFF'in rolü çok sınırlıdır:
    1. Gelen isteği almak (ingestion).
    2. İsteği, asenkron işlenmek üzere bir `Callback Ingestion Service/Worker`'a (örn: bir message queue üzerinden) **hemen** paslamak.
    3. Provider'a hızlı bir `200 OK` veya `202 Accepted` yanıtı dönerek bağlantıyı sonlandırmak.

- **BFF truth owner olabilir mi?**
  - **HAYIR.**

- **BFF payout item/batch state mutate edebilir mi?**
  - **HAYIR.**

- **BFF finance correction oluşturabilir mi?**
  - **HAYIR.**

- **BFF risk signal oluşturabilir mi?**
  - **HAYIR, DOĞRUDAN DEĞİL.** Ancak, endpoint'e gelen anormal bir istek paterni (örn: rate limit'i zorlayan bir IP) tespit ederse, bu *davranış* için bir sinyal üretebilir. Ancak gelen payload'un *içeriğine* bakarak "bu bir riskli payout" kararı veremez.

- **BFF sadece ingestion + async handoff mı yapmalı?**
  - **EVET.** İmza doğrulama, persistence ve domain mantığı gibi ağır işlemler asenkron bir worker/servisin sorumluluğu olmalıdır.

- **Persistence ve owner command handoff BFF içinde mi, worker içinde mi olmalı?**
  - **WORKER İÇİNDE OLMALI.** Bu, BFF'in hızlıca yanıt dönmesini ve provider'ın timeout'a düşmesini engeller.

## 12. Audit / Event / Outbox Boundary

- **Callback kaydı audit yerine geçer mi?**
  - **HAYIR.** `planlama/aşama-11/AUDIT_TAXONOMY.md`'ye göre, `ProviderCallbackRecord` bir "olay kaydı"dır. Bu olayın işlenmesi sonucu `payoutItem` state'inin `PAID`'e geçmesi gibi bir "business mutation" ise bir `audit record` üretmelidir. Callback kaydı, audit kaydının tetikleyicisi veya bağlamı olabilir, ama onun yerine geçmez.

- **Payout paid/failed/returned audit ne zaman üretilmeli?**
  - `payout` servisi, ilgili `MarkAs...` command'ını başarıyla işleyip `payoutItem`'ın state'ini veritabanında **güncelledikten sonra**, aynı transaction içinde bir `audit` kaydı oluşturmalıdır.

- **Payout paid event ne zaman publish edilmeli?**
  - `payout` servisi, state'i güncelleyip `audit` kaydını oluşturduktan sonra, aynı transaction içinde bir `payout.paid` event'ini `outbox` tablosuna yazmalıdır (transactional outbox pattern). Event, truth yazıldıktan sonra yayınlanır.

- **Finance correction event ne zaman publish edilmeli?**
  - `finance-correction` servisi, `CreateFinanceCorrection` command'ını başarıyla işleyip `FinanceCorrectionRecord`'u veritabanına yazdıktan sonra, transactional outbox ile `finance_correction.created` event'ini yayınlamalıdır.

- **Risk signal event ne zaman publish edilmeli?**
  - `risk` servisi, `CreateRiskSignal` command'ını başarıyla işleyip `RiskSignal`'ı veritabanına yazdıktan sonra, transactional outbox ile `risk.signal.created` event'ini yayınlamalıdır.

- **Event publish varsa owner truth yazıldıktan sonra mı olmalı?**
  - **EVET.** Bu, "transactional outbox" pattern'inin temel kuralıdır ve `planlama/VERI_AKISI_SENKRONIZASYON_MODELI.md`'de zorunlu kılınmıştır.

## 13. Payout Callback Implementation Seçenekleri

**A) Sadece callback ingestion + persistence**
- **Artıları:** En basit ve en güvenli ilk adım. Sisteme dışarıdan veri alıp kaydetme yeteneği kazandırır ama hiçbir `truth` değiştirmez.
- **Riskleri:** Tek başına bir iş değeri üretmez. `PROCESSING`'de kalan payout'lar birikir.
- **Yasakları:** Domain state'i (`payoutItem.state`) değiştirilmemelidir.
- **Kabul Kanıtı:** Provider'dan gelen bir test callback'inin `provider_callback_events` tablosuna `processingStatus: 'received'` olarak yazılması.
- **Hangi aşamada yapılmalı:** En temel ilk adım.

**B) Ingestion + payout owner status update**
- **Artıları:** Callback'leri gerçek iş mantığına bağlar. `payoutItem` state'ini güncelleyerek `PAID`/`FAILED` durumunu görünür kılar.
- **Riskleri:** Hatalı bir mantık, ödeme durumunu yanlış gösterebilir. İmza doğrulaması olmadan yapılırsa çok tehlikelidir.
- **Yasakları:** `settlement` veya `finance-correction` domain'lerini doğrudan çağırmamalıdır.
- **Kabul Kanıtı:** Başarılı bir "paid" callback sonrası ilgili `payoutItem`'ın state'inin `PAID` olarak güncellenmesi.
- **Hangi aşamada yapılmalı:** İmza doğrulama ve temel ingestion (A) adımlarından sonra.

**C) Ingestion + payout failed/returned correction handoff**
- **Artıları:** `failed` ve `returned` gibi problemli senaryoları proaktif olarak ele alır ve finansal tutarlılığı korur.
- **Riskleri:** `finance-correction` ve `payout` servisleri arasında karmaşık bir etkileşim gerektirir. Hata yönetimi kritiktir.
- **Yasakları:** Otomatik olarak `settlement`'ı `PAYABLE` yapmamalı, `finance-correction` sürecini tetiklemelidir.
- **Kabul Kanıtı:** Bir "returned" callback sonrası, ilgili `payoutItem`'ın `RETURNED` olması ve yeni bir `FinanceCorrectionRecord`'un oluşması.
- **Hangi aşamada yapılmalı:** B adımından sonra, finansal sağlamlığı artırmak için.

**D) Ingestion + risk/fraud signal handoff**
- **Artıları:** Anormal callback aktivitelerini (`signature_failed`, yüksek `returned` oranı) tespit ederek proaktif risk yönetimi sağlar.
- **Riskleri:** `risk` ve `payout` servisleri arasında sıkı bir entegrasyon gerektirir. False-positive'ler (yanlış alarmlar) operasyonel yük yaratabilir.
- **Yasakları:** `risk` sinyali, kanıt olmadan doğrudan bir `payout`'u `FAILED` yapmamalı, `ON_HOLD`'a almalıdır.
- **Kabul Kanıtı:** Bir `signature_failed` callback sonrası, ilgili isteğin reddedilmesi ve bir `RiskSignal`'in üretilmesi.
- **Hangi aşamada yapılmalı:** B ve C adımlarıyla paralel veya hemen sonrasında geliştirilebilir.

**E) Ingestion + reconciliation/provider status polling**
- **Artıları:** En sağlam yaklaşım. Callback'e güvenmek yerine, sistemin kendisinin aktif olarak provider'ı sorgulamasını sağlar. `unknown_result` veya "kayıp callback" senaryolarını çözer.
- **Riskleri:** Daha karmaşık bir implementasyon gerektirir (zamanlanmış görevler vb.). Provider API'larına ek yük getirir.
- **Yasakları:** Her payout'u sürekli sorgulamamalı; sadece `PROCESSING`'de belirli bir süreden (TTL) fazla kalmış olanları hedeflemelidir.
- **Kabul Kanıtı:** `PROCESSING` durumunda kalmış bir payout'un, zamanlanmış bir iş tarafından sorgulanarak nihai `PAID` veya `FAILED` durumuna getirildiğinin kanıtlanması.
- **Hangi aşamada yapılmalı:** Temel callback işlemeye (B) paralel olarak geliştirilmesi gereken kritik bir parçadır.

**F) Full payout result lifecycle**
- Yukarıdaki tüm seçeneklerin birleşimidir.
- **Artıları:** Uçtan uca sağlam, güvenli ve izlenebilir bir payout callback sistemi oluşturur.
- **Riskleri:** En karmaşık ve en uzun süren seçenektir.
- **Hangi aşamada yapılmalı:** En son ve en olgun aşama.

## 14. Önerilen İlk Payout Callback Sırası

- **10P1: Ortak Callback Ingestion & Signature Guard**
  - **Amaç:** `10B-00B` (Payment) ve `10B-00C` (Shipment) raporlarında da önerildiği gibi, tüm provider callback'leri için **ortak, güvenli ve soyut bir "BFF Callback Ingestion Boundary"** kurmak. Bu, gelen isteği alır, imzasını doğrular ve `provider_callback_events` tablosuna `received`/`rejected` olarak kaydeder.
  - **Scope:** Genel bir `/callbacks/{provider}` endpoint'i. İmza doğrulama ve persistence mantığını içeren bir worker.
  - **Dışarıda Bırakılacaklar:** Tüm domain-spesifik mantık.
  - **Test/Smoke Kanıtı:** Sahte bir payout callback'inin, geçerli/geçersiz imza ile `provider_callback_events` tablosuna doğru `verificationStatus` ile yazılması.
  - **Neden bu sırada:** En temel ve en güvenli adımdır. Diğer tüm domain'ler için tekrar eden altyapı işini engeller.

- **10P2: Basic Payout State Command Handoff**
  - **Amaç:** Doğrulanmış (`verificationStatus: 'verified'`) ve `processingStatus: 'received'` olan payout callback'lerini işleyip, ilgili `payoutItem`'ın state'ini (`PAID`, `FAILED` vb.) güncellemek.
  - **Scope:** Payout-spesifik bir worker, callback payload'unu yorumlar ve `MarkPayoutAs...` komutlarını tetikler. İşlenen kaydın `processingStatus`'unu `processed` yapar.
  - **Dışarıda Bırakılacaklar:** `returned` gibi karmaşık senaryolar, `finance-correction` veya `risk` entegrasyonu.
  - **Test/Smoke Kanıtı:** Bir `payoutItem`'ı `PROCESSING` yaptıktan sonra, "paid" callback'i gönderildiğinde `payoutItem`'ın state'inin `PAID`'e geçtiğini ve ilgili `settlementLine`'a etkinin yansıdığını doğrulamak.
  - **Neden bu sırada:** Callback mekanizmasına ilk gerçek finansal değeri kazandırır: "ödeme çıkışı başarılı oldu mu?" sorusunu cevaplar.

- **10P3: `Returned` & `Finance Correction` Handoff**
  - **Amaç:** En riskli senaryolardan biri olan `returned`/`reversed` callback'leri ele alıp, otomatik olarak `FinanceCorrectionRecord` oluşturulmasını sağlamak.
  - **Scope:** Worker, `returned` callback'lerini tanır, `MarkPayoutAsReturned` komutunu tetikler ve ardından `finance-correction` servisine `CreateFinanceCorrection` command'ı gönderir.
  - **Dışarıda Bırakılacaklar:** Otomatik retry mantığı.
  - **Test/Smoke Kanıtı:** Bir "returned" callback'i gönderildiğinde, `payoutItem`'ın `RETURNED` olduğunu ve `finance_correction_records` tablosunda yeni bir kaydın oluştuğunu doğrulamak.
  - **Neden bu sırada:** Finansal bütünlüğü korumak için `paid`/`failed`'den sonraki en önemli adımdır.

- **10P4: `Failed` & Retry/Review Handoff**
  - **Amaç:** `failed` callback'leri, `failureReason`'a göre "retryable" veya "needs_review" olarak sınıflandırmak.
  - **Scope:** Worker, `failed` callback'lerini işler. `reasonCode`'a göre ya bir retry kuyruğuna atar ya da bir `FinanceCorrectionRecord` oluşturarak manuel incelemeye yönlendirir.
  - **Dışarıda Bırakılacaklar:** Kompleks retry stratejileri.
  - **Test/Smoke Kanıtı:** `invalid_account` hatasıyla `failed` callback'i gönderince `FinanceCorrectionRecord` oluştuğunu; `temporary_issue` ile gönderince retry kuyruğuna girdiğini (veya bir `retry_pending` state'ine geçtiğini) doğrulamak.
  - **Neden bu sırada:** Operasyonel verimliliği artırır ve manuel iş yükünü azaltır.

- **10P5: Anomaly & Risk Signal Handoff**
  - **Amaç:** Anormal callback paterlerinin (yüksek frekanslı `returned`, sahte `paid` denemeleri vb.) `RiskSignal` üretmesini sağlamak.
  - **Scope:** Worker veya ayrı bir `anomaly detection` servisi, `provider_callback_events` tablosundaki paternleri analiz eder ve `risk` servisine `CreateRiskSignal` command'ı gönderir.
  - **Dışarıda Bırakılacaklar:** Otomatik `hold` uygulama (ilk aşamada sadece sinyal üretilir).
  - **Test/Smoke Kanıtı:** Kısa sürede aynı `beneficiary` için çok sayıda "returned" callback'i gönderildiğinde, bir `RiskCase`'in `OPEN` duruma geçtiğini doğrulamak.
  - **Neden bu sırada:** Güvenlik ve proaktif suistimal önleme katmanını ekler.

- **10P6: Reconciliation for Unknown/Pending States**
  - **Amaç:** Belirli bir süredir `PROCESSING`'de takılıp kalmış `payoutItem`'ları periyodik olarak provider'dan sorgulayan bir reconciliation (uzlaşma) mekanizması kurmak.
  - **Scope:** Belirli aralıklarla çalışan bir job, ara durumda kalmış denemeleri bulur, provider API'ını sorgular ve sonucu `10P2` veya `10P3`'teki gibi işler.
  - **Dışarıda Bırakılacaklar:** Karmaşık dependency yönetimi.
  - **Test/Smoke Kanıtı:** `PROCESSING` durumunda bir `payoutItem` oluşturup, reconciliation job'ının bu item'ı bulup state'ini (provider API'ından aldığı cevaba göre) `PAID` veya `FAILED`'e güncellediğini doğrulamak.
  - **Neden bu sırada:** Sadece callback'e bağımlı kalmayı engelleyerek sistemin güvenilirliğini (reliability) en üst seviyeye çıkarır.

## 15. Payout Callback İçin Nihai Karar

**PAYOUT DOMAIN INVENTORY COMPLETE / IMPLEMENTATION REQUIRED**

Bu envanter, payout callback domain'inin mevcut durumunu, kritik sınırlarını (finance, risk, settlement) ve potansiyel implementasyon adımlarını ortaya koymuştur. Mevcut `10A` temelleri, güvenli bir payout callback altyapısı kurmak için yeterlidir ancak sistemin en kritik finansal döngülerinden birini otomatikleştirmek ve güvence altına almak için gerçek bir implementasyona acilen ihtiyaç duyulmaktadır.

**Net öneri:**
İlk gerçek implementation, payout-spesifik `paid` işlemeye odaklanmamalıdır. Önce, **10P1**'de önerildiği gibi, tüm provider callback'leri için ortak olan, güvenli ve soyut bir **"BFF Callback Ingestion Boundary"** kurulmalıdır. Bu, diğer domain'ler (payment, shipment) için de yapılacak tekrar eden altyapı işini ortadan kaldıracaktır.

Payout processing'e geçmeden önce aşağıdaki guard'ların zorunlu olduğu listelenmelidir:
1.  **BFF Ingestion Endpoint & Async Worker:** Callback'leri alıp asenkron işleme kuyruğuna atmak için.
2.  **Signature Verification Guard:** Sahte `paid`/`returned` callback'lerini reddetmek için.
3.  **Idempotency/Replay Guard:** Mükerrer finansal etkiyi (`double-paid`, `double-refund`) engellemek için.
4.  **State Transition Guard:** `payout` state machine'inin geçersiz geçişleri (`PAID` -> `FAILED` gibi) reddetmesi için.
5.  **Finance/Risk Hold Guard:** Aktif bir `hold` varken `paid` callback'lerinin state'i değiştirmesini engellemek için.

Bu temel guard'lar olmadan `payout` domain'ini doğrudan callback işlemeye açmak, platform için yıkıcı olabilecek ciddi finansal ve güvenlik riskleri doğuracaktır.

## 16. Açık Riskler / Sonraki Kontrol

- **Real signature verification:** Gerçek kriptografik doğrulama mantığı henüz yazılmamıştır.
- **Provider-specific payout mapping:** Farklı payout provider'larının (Wise, Payoneer vb.) farklı payload formatlarını ortak bir iç modele (`ProviderCallbackRecord`) dönüştürecek esnek bir mapping katmanı gereklidir.
- **Duplicate paid/failed/returned handling:** Idempotency mekanizmasının, özellikle en kritik olaylar olan `paid` ve `returned` için, state ve finansal ledger üzerinde mükerrer etki yaratmadığı uçtan uca test edilmelidir.
- **Event ordering (paid vs failed):** `paid` callback'inden sonra `failed` callback'inin gelmesi gibi senaryoların state machine tarafından nasıl reddedileceği ve anomali olarak nasıl işaretleneceği detaylı test edilmelidir.
- **Batch-level vs item-level payout result ayrımı:** Implementasyonda bu ayrımın net bir şekilde korunması gerekir.
- **Finance correction boundary:** `failed`/`returned` payout'ların ne zaman ve nasıl `FinanceCorrectionRecord` oluşturacağı ve bu sürecin `settlement`'ı nasıl etkileyeceği detaylı olarak tasarlanmalı ve test edilmelidir.
- **Risk/fraud hold bypass riski:** `paid` callback'lerinin `hold` durumunu atlatmamasını sağlayan mantığın %100 sağlam olduğundan emin olunmalıdır.
- **Postgres callback smoke:** Mevcut callback smoke testi in-memory çalışmaktadır. `idempotency_key` çakışması gibi Postgres'e özgü davranışları test eden bir smoke testi gereklidir.
- **Postgres idempotency_key conflict davranışı:** Mevcut `insert` sorgusu, `idempotency_key` çakışmasında hata fırlatır. Uygulama katmanının bu hatayı yakalayıp yönetmesi gerekir.
- **Reconciliation/provider polling:** Callback'in hiç gelmediği "kayıp" senaryoları için provider'ı periyodik olarak sorgulayan mekanizma tasarlanmalı ve eklenmelidir.
- **Public webhook rate limiting:** Public endpoint için rate limit ve abuse korumaları implemente edilmelidir.
