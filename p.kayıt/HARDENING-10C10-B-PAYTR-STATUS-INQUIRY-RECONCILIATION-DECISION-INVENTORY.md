# HARDENING-10C10-B — PayTR Status Inquiry & Reconciliation Decision Inventory

## 1. Paket Tanımı

Bu paket, bir kod implementasyon paketi değildir. Bu görevin amacı, PayTR Durum Sorgu (Status Inquiry) API'sinin sisteme entegrasyonu için gereken kararları ve mevcut kod envanterini çıkarmak, bir mutabakat (reconciliation) yaşam döngüsü önermektir.

Bu paket kapsamında kesinlikle aşağıdaki işlemler **yapılmayacaktır**:
- Yeni kod implementasyonu başlatma.
- Veritabanı migration'ı ekleme.
- BFF (Backend for Frontend) route'larını değiştirme.
- `payment` state'ini değiştirecek (mutation) bir kod ekleme.
- `order create` veya `order handoff` süreçlerini ekleme.
- `finance`, `settlement`, veya `payout` ile ilgili bir mutation ekleme.
- `risk` ile ilgili bir mutation ekleme.

Bu çalışma, `10C10-A`'da belirlenen sınırlar ve `10C9` sonrası mevcut durum temel alınarak, yalnızca bir karar ve envanter raporu üretmeyi hedefler.

## 2. 10C10-A Boundary Sonuç Özeti

`HARDENING-10C10-A-RECONCILIATION-BOUNDARY-SYSTEM-ALIGNMENT-INVENTORY.md` raporunda belirtilen sınırlar ve kararlar bu çalışma için bağlayıcıdır. Öne çıkan temel prensipler şunlardır:

- **Reconciliation, `payment` sonucunu netleştirir:** Bir ödemenin belirsiz (`unknown_result`, `pending`) kalması durumunda, nihai sonucunu (`succeeded`, `failed`) belirlemek `Payment Owner`'ın sorumluluğundadır.
- **`Payment success` `order created` değildir:** Bir ödemenin başarılı olması, siparişin otomatik olarak oluştuğu anlamına gelmez. Başarılı ödeme, yalnızca bir `order create` komutunu tetikleme *hakkı* doğurur.
- **Order Handoff en erken `10C11` konusudur:** Bu paket (`10C10-B`), başarılı ödemelerin sipariş sistemine devredilmesi sürecini içermez. Bu konu, `payment` sonucunun kesinleştirilmesi ve mutabakat altyapısı kararları netleştikten sonra ele alınacaktır.

Bu görev, bu ana sistem sınırlarının dışına çıkmayacak ve bu prensiplere sadık kalarak sadece `payment` alanındaki `reconciliation` mekanizmasına odaklanacaktır.

## 3. Mevcut Kod Inventory

Aşağıda, belirtilen dosyaların analizi, `10C10-B` göreviyle ilişkisi, ve çıkarılan karar ihtiyaçları listelenmiştir.

---

### `services/payment/src/callback-worker.ts`

- **Mevcut Davranış:** Bu worker, `provider_callback_events` tablosundan `received` durumundaki kayıtları okur. `decidePaymentCallbackOwnerCommand` fonksiyonunu kullanarak bir karar verir (`command_ready`, `candidate_rejected`, `reconciliation_required` vb.). `ownerTransitionMode` parametresi `apply_owner_transition` ise `applyPaymentCallbackOwnerCommand` aracılığıyla `payment` ve `payment_attempt` state'lerini günceller (`SUCCEEDED` veya `FAILED`).
- **10C10-B ile İlişkisi:** Bu worker, reconciliation gerektiren durumları (`candidate_requires_reconciliation`, `missing_payment_attempt`) tespit edip `ignored` olarak işaretleyebilmektedir. Bu, PayTR durum sorgusu ile kapatılması gereken "belirsiz" ödemeler için bir giriş noktasıdır. Mevcut worker, sadece callback'leri işler, aktif olarak durum sorgulama yapmaz.
- **Eksik / Risk / Karar İhtiyacı:**
    - Aktif bir reconciliation tetikleyici mekanizması (scheduler, cronjob vb.) yoktur.
    - `ignored` olarak işaretlenen kayıtların tekrar işlenip durum sorgusuna gönderilmesi için bir akış tanımlanmamıştır.
    - Durum sorgulama sonucunda elde edilecek bilginin bu worker'a nasıl entegre edileceği belirsizdir.
- **Implementation Yapılmayacak Notu:** Bu pakette worker'a yeni bir "status inquiry" adımı eklenmeyecektir. Sadece bu ihtiyacın envanteri çıkarılacaktır.

### `services/payment/src/payment.ts`

- **Mevcut Davranış:** `initiatePayment` ile ödeme başlatma ve `applyPaymentCallbackOwnerCommand` ile ödeme sonucunu (sadece `SUCCEEDED`/`FAILED`) işleme mantığını içerir. `getByProviderReference` fonksiyonu, provider'dan gelen referans ile ödemeyi bulma yeteneğine sahiptir. `applyPaymentCallbackOwnerCommand` içinde terminal state çakışmalarını (`SUCCEEDED` -> `FAILED`) önleyen guard'lar mevcuttur.
- **10C10-B ile İlişkisi:** Bu dosya, `payment` entity'sinin "truth owner"ıdır. Reconciliation sonucu elde edilecek olan nihai `succeeded`/`failed` bilgisini işleyecek olan ana servis budur. `getByProviderReference` mantığı, PayTR'in `merchant_oid`'si ile yapılacak sorgulamalar için temel oluşturur.
- **Eksik / Risk / Karar İhtiyacı:**
    - Mevcut `applyPaymentCallbackOwnerCommand` sadece `MARK_PAYMENT_SUCCEEDED` ve `MARK_PAYMENT_FAILED` komutlarını destekler. `PENDING`, `UNKNOWN_RESULT` gibi ara durumları yönetecek bir komut ve mantık yoktur.
    - Durum sorgulama sonrası, `payment` state'ini güvenli bir şekilde güncellemek için yeni bir command (`MARK_PAYMENT_RECONCILED` gibi) veya mevcut command'lerin genişletilmesi gerekebilir.
- **Implementation Yapılmayacak Notu:** Bu pakette yeni payment state mutation komutları eklenmeyecektir.

### `services/payment/src/provider-config.ts`

- **Mevcut Davranış:** `PAYTR_MERCHANT_ID`, `PAYTR_MERCHANT_KEY`, `PAYTR_MERCHANT_SALT` gibi çevre değişkenlerini okuyarak PayTR provider'ının konfigürasyonunu çözer. Bu konfigürasyonun eksik olup olmadığını kontrol eder.
- **10C10-B ile İlişkisi:** PayTR Durum Sorgu API'si, bu konfigürasyon dosyası tarafından yönetilen `merchant_id`, `merchant_key`, ve `merchant_salt`'a ihtiyaç duyar. Bu dosya, durum sorgulama için gereken kimlik bilgilerinin merkezi olarak yönetildiği yerdir.
- **Eksik / Risk / Karar İhtiyacı:** Karar ihtiyacı yoktur. Mevcut yapı, durum sorgulama için gereken credential'ları sağlamak için yeterlidir.
- **Implementation Yapılmayacak Notu:** Bu dosyada bir değişiklik yapılmasına gerek yoktur.

### `services/payment/src/provider-adapter.ts`

- **Mevcut Davranış:** Dış ödeme sağlayıcıları ile olan iletişimi soyutlayan `PaymentProviderAdapter` arayüzünü ve implementasyonlarını içerir. Şu an için `InternalSimulationPaymentProviderAdapter` ve `NotConfiguredPaymentProviderAdapter` bulunmaktadır. Gerçek bir PayTR API çağrısı yapan bir adapter henüz yoktur.
- **10C10-B ile İlişkisi:** PayTR Durum Sorgulama API'sine yapılacak olan `POST` isteği, bu soyutlama katmanı içinde oluşturulacak yeni bir metod (`statusInquiry` gibi) veya yeni bir adapter tarafından gerçekleştirilmelidir.
- **Eksik / Risk / Karar İhtiyacı:**
    - `PaymentProviderAdapter` arayüzünde durum sorgulama için bir metod (`statusInquiry(reference: string)`) tanımlanması gerekmektedir.
    - PayTR Durum Sorgu API'sine gerçek isteği yapacak (`https://www.paytr.com/odeme/durum-sorgu`), `paytr_token` üretecek ve sonucu normalize edecek bir `PaytrPaymentProviderAdapter` implementasyonu gereklidir.
- **Implementation Yapılmayacak Notu:** Bu pakette adapter implementasyonu yapılmayacak, sadece arayüz ve class ihtiyacı envantere eklenecektir.

### `services/payment/src/repository/interface.ts`, `in-memory.ts`, `postgres.ts`

- **Mevcut Davranış:** `IPaymentRepository` arayüzü; `id`, `paymentAttemptId`, ve `providerReference` üzerinden ödeme kayıtlarını bulma ve kaydetme metodlarını tanımlar. Hem `in-memory` hem de `postgres` implementasyonları bu arayüzü uygular. `postgres.ts` içindeki sorgular, `providerReference` için `data` JSONB alanı üzerinde bir arama gerçekleştirir.
- **10C10-B ile İlişkisi:** PayTR'den gelen `merchant_oid` (bizim `providerReference`'ımız) ile ilgili `payment` kaydını bulmak için bu repository'ler kritik öneme sahiptir.
- **Eksik / Risk / Karar İhtiyacı:**
    - `getByProviderReference` sorgusu JSONB alanı üzerinde çalışmaktadır. Bu, büyük veri setlerinde performans sorunlarına yol açabilir. `providerReference` için `payments` tablosunda ayrıca indekslenmiş bir kolon bulunması ileride düşünülebilir.
    - `providerReference`'ın unique olması veritabanı seviyesinde garanti edilmemektedir. Bu, aynı referansla birden fazla ödeme kaydı oluşma riski taşır ve reconciliation'ı karmaşıklaştırabilir.
- **Implementation Yapılmayacak Notu:** Bu pakette veritabanı şeması veya indeks değişikliği (`migration`) yapılmayacaktır. Risk not olarak kayda geçirilecektir.

### `packages/contracts/src/payment.ts`

- **Mevcut Davranış:** `PaymentState`, `PaymentAttemptState` gibi temel state'leri, `PaymentCallbackOwnerCommand` gibi komutları ve `decidePaymentCallbackOwnerCommand` gibi karar verici fonksiyonları tanımlar. `createPaytrCallbackHash` ve `verifyPaytrCallbackHash` gibi PayTR'e özel callback hash doğrulama yardımcı fonksiyonları da burada yer alır.
- **10C10-B ile İlişkisi:** PayTR durum sorgulama sonucunda dönecek olan (`success`/`error`) veriyi, sistemin anlayacağı `NormalizedPaymentStatus` benzeri bir modele map etmek için yeni contract'lar ve mapping fonksiyonları bu pakette tanımlanmalıdır. `paytr_token` oluşturma mantığı da (`base64(hmac_sha256(...))`) buraya bir helper olarak eklenebilir.
- **Eksik / Risk / Karar İhtiyacı:**
    - PayTR Durum Sorgu API'sinin response'unu temsil edecek yeni `interface`'ler (örn: `PaytrStatusInquiryResponse`) gereklidir.
    - Durum sorgu API'si için `paytr_token` üretecek bir `createPaytrStatusInquiryToken` fonksiyonu gereklidir.
    - Durum sorgu response'unu iç modellere (örn: `ReconciliationCandidate`) mapleyecek bir `mapPaytrStatusInquiryToCandidate` fonksiyonu gereklidir.
- **Implementation Yapılmayacak Notu:** Bu pakette yeni contract ve helper fonksiyonları eklenmeyecektir, sadece ihtiyaç envanteri çıkarılacaktır.

### `packages/contracts/src/provider.ts`

- **Mevcut Davranış:** `ProviderResultEnvelope`, `ProviderCallbackRecord` gibi sağlayıcılarla olan tüm etkileşimleri standartlaştıran temel zarfları (envelopes) ve arayüzleri tanımlar. `ProviderOperationStatus` (`succeeded`, `failed`, `unknown_result` vb.) bu paketin bir parçasıdır.
- **10C10-B ile İlişkisi:** Durum sorgulama işlemi de bir "provider operasyonu" olarak kabul edilmeli ve sonucu `ProviderResultEnvelope` içinde sarmalanmalıdır. Bu, operasyonun başarısını (`succeeded`, `failed`), varsa hatayı ve normalize edilmiş sonucu standart bir yapıda taşımasını sağlar.
- **Eksik / Risk / Karar İhtiyacı:** Karar ihtiyacı yoktur. Mevcut `ProviderResultEnvelope` yapısı, durum sorgulama sonucunu sarmalamak için uygundur.

### `packages/persistence/src/provider-callback.ts`

- **Mevcut Davranış:** Dış sağlayıcılardan gelen callback'leri `provider_callback_events` tablosuna yazmak ve okumak için repository'leri içerir. Her callback, `received`, `accepted`, `rejected`, `ignored` gibi bir `processingStatus` ile yönetilir.
- **10C10-B ile İlişkisi:** Bu tablo, doğrudan bir durum sorgulama kaydı tutmak için tasarlanmamıştır. Ancak, bir `reconciliation` süreci, bu tablodaki `ignored` veya `pending` durumdaki kayıtlardan tetiklenebilir. Alternatif olarak, `reconciliation` işlemleri için ayrı bir `reconciliation_tasks` tablosu düşünülebilir.
- **Eksik / Risk / Karar İhtiyacı:**
    - Durum sorgulama gerektiren ödemeleri takip etmek için yeni bir persistence mekanizmasına (örn. yeni bir tablo veya mevcut tabloya yeni bir statü) ihtiyaç var mı?
    - Mevcut `ProviderCallbackProcessingStatus` enum'u, reconciliation yaşam döngüsünü yönetmek için yeterli mi, yoksa `RECONCILIATION_REQUIRED` gibi ayrı bir state mi gerekir? Bu konu raporun ilerleyen bölümlerinde değerlendirilecektir.
- **Implementation Yapılmayacak Notu:** Bu pakette veritabanı şeması veya yeni repository eklenmeyecektir.

### `tests/smoke/run-smoke.ts` ve `package.json`

- **Mevcut Davranış:** `package.json`, `smoke:paytr-callback-mapping` gibi PayTR callback'lerini test eden smoke testlerini tanımlar. `run-smoke.ts` ise bu test suit'lerini çalıştıran ana dosyadır.
- **10C10-B ile İlişkisi:** Yeni eklenecek olan PayTR durum sorgulama mantığının (`token` üretimi, API çağrısı, response mapping) da ileride smoke testlerle doğrulanması gerekecektir.
- **Eksik / Risk / Karar İhtiyacı:**
    - Gelecekte eklenecek olan PayTR durum sorgulama ve reconciliation karar mantığı için yeni smoke test senaryolarının bir listesi çıkarılmalıdır.
- **Implementation Yapılmayacak Notu:** Bu pakette yeni test dosyaları veya script'leri eklenmeyecektir. Sadece gelecekteki test ihtiyaçları listelenecektir.

## 4. PayTR Status Inquiry Mapping Inventory

PayTR Durum Sorgu API'sinden dönen ham verinin, sistemin içsel modellerine ve kanonik statülerine haritalanması (mapping) için aşağıdaki kararlar önerilmektedir. Bu haritalama, `packages/contracts/src/payment.ts` içindeki `NormalizedPaymentCallbackStatus` ve benzeri kontratlara dayanmalıdır.

### Karar Tablosu: PayTR Alanları → Internal Model

| PayTR Alanı | Değer Örneği | Internal Karşılığı | Önerilen Karar ve Aksiyon |
| :--- | :--- | :--- | :--- |
| `status` | `success` | `succeeded` | Doğrudan `succeeded` durumuna haritalanır. Bu, `MARK_PAYMENT_SUCCEEDED` komutunu tetikleyebilir. |
| `status` | `error` | `failed` / `unknown_result` | `err_no` ve `err_msg` alanlarına göre karar verilir. Her `error` durumu `failed` demek değildir. |
| `payment_amount` | `10,8` (string) | `amount` | Gelen `amount` değeri (virgül ve kuruş formatına dikkat edilerek) parse edilip, `payment_attempt` kaydındaki `amount` ile doğrulanmalıdır. Uyuşmazlık, `rejected_amount_mismatch` durumunu tetiklemeli ve manuel inceleme gerektirmelidir. |
| `payment_total`| `10,8` (string) | `amount` | `payment_amount` gibi, bu alan da parse edilip `payment_attempt` üzerindeki `amount` ile doğrulanmalıdır. Uyuşmazlık, `rejected_amount_mismatch` durumunu tetiklemelidir. |
| `returns` | JSON string | (Yok) | **Kapsam Dışı.** Bu alan, iadeleri (refunds) belirtir. 10C10-B paketinin konusu `payment` sonucunu netleştirmektir, `refund` yaşam döngüsünü yönetmek değil. Bu alanın işlenmesi `settlement` ve `refund` hattına bırakılmalıdır. |
| `currency` | `TL` | `currency` | Gelen para birimi, `payment_attempt` kaydındaki `currency` ile doğrulanmalıdır. `TL` değeri `TRY` olarak normalize edilmelidir. Uyuşmazlık, `rejected_currency_mismatch` durumunu tetiklemelidir. |
| `err_no` | `004` | `ReconciliationResultCode` | Her bir `err_no`, sistem içinde standart bir koda (örn: `PAYTR_ERR_004_PAYMENT_NOT_FOUND`) haritalanmalıdır. |
| `err_msg` | `merchant_oid ile basarili odeme bulunamadi` | `ReconciliationResultMessage` | Hata mesajı, loglama ve manuel inceleme için saklanmalıdır. |

### Özel Mapping Kararları

- **PayTR `merchant_oid` = internal `providerReference`:** Bu eşleştirme kesindir. Durum sorgusu yapılırken `payment_attempt` içindeki `providerReference` değeri, PayTR API'sine `merchant_oid` olarak gönderilmelidir. Sorgu sonucunda dönen `merchant_oid`, hangi `payment_attempt` için işlem yapıldığını doğrulamak için kullanılır.

- **`payment_amount` / `payment_total` Amount Doğrulaması:** Dokümantasyonda bu değerlerin `10,8` gibi virgüllü string olarak dönebileceği belirtilmiştir. Bu değerler işlenmeden önce güvenli bir şekilde sayısal formata (kuruş cinsinden integer) dönüştürülmelidir. Doğrulama yapılırken, `payment_attempt.amount` ile bu değerler karşılaştırılmalıdır. Eğer `payment_amount` ve `payment_total` farklı değerler içeriyorsa, bu durum bir risk sinyali (`riskFlag: 'PAYTR_AMOUNT_AMBIGUITY'`) olarak kaydedilmeli ve `manual_review_required` durumuna yol açmalıdır.

- **Currency `TL` → `TRY` Normalizasyonu:** Evet, gereklidir. Sistem içindeki tüm para birimi kodları standart (ISO 4217) olmalıdır. PayTR'den gelebilecek `TL` değeri, `TRY` olarak normalize edilerek karşılaştırılmalıdır. Diğer para birimleri (`USD`, `EUR` vb.) de büyük harfe çevrilerek standartlaştırılmalıdır.

- **`returns` Alanının Kapsamı:** `returns` alanı, yapılan iadeleri içerdiği için `payment`'ın başarılı olup olmadığını belirleme kapsamının dışındadır. Bu alanı işlemek, `payment` sonucunu `succeeded` veya `failed` yapma sorumluluğunu aşar ve `refund` ile `settlement` süreçlerinin konusudur. Bu nedenle, 10C10-B kapsamında `returns` alanı **YOK SAYILMALIDIR**.

- **“merchant_oid ile basarili odeme bulunamadi” Hatasının Yorumlanması:** Bu hata (`err_no: 004`), sorgulanan `merchant_oid` için PayTR tarafında başarılı bir ödeme kaydının (henüz) oluşmadığını gösterir. Bu durum, aşağıdaki internal sonuçlara yol açabilir:
    1.  **`reconciliation_inconclusive`:** Ödeme gerçekten başarısız olmuş olabilir veya henüz nihai duruma ulaşmamış olabilir (örn. 3D Secure onayı bekleniyor). Bu durumda, işlem hemen `failed` olarak işaretlenmemeli, bir süre sonra tekrar denenmek üzere `pending_reconciliation` durumunda bırakılmalıdır.
    2.  **`payment_not_found_at_provider`:** Eğer belirli bir süre (örn. 24 saat) boyunca yapılan tüm sorgulamalara rağmen bu hata devam ediyorsa, ödemenin PayTR tarafında hiç var olmadığı veya başarısız olduğu kabul edilebilir ve `payment` state'i `FAILED` olarak güncellenebilir. Bu, nihai bir karardır.

## 5. Reconciliation Aday Durumları

Mutabakat (Reconciliation) süreci, bir ödeme işleminin durumunun belirsiz veya tutarsız olduğu senaryoları çözmek için kritik öneme sahiptir. Aşağıda, bu aday durumlar ve her biri için önerilen yaşam döngüsü kararları listelenmiştir.

| Aday Durum | Açıklama | Önerilen Reconciliation Kararı |
| :--- | :--- | :--- |
| `normalizedStatus = pending` | Sağlayıcıdan gelen callback, ödemenin hala beklemede olduğunu belirtiyor. | **Karar:** `status_query_pending` olarak işaretlenir. Hemen `failed`/`succeeded` yapılmaz. Belirli aralıklarla (örn. artan backoff ile 15dk, 1sa, 4sa) PayTR Durum Sorgu API'si ile sonucu sorgulanır. |
| `normalizedStatus = unknown_result` | Ödeme başlatma sırasında timeout yaşanmış veya callback hiç gelmemiş. | **Karar:** `reconciliation_required` olarak işaretlenir. Derhal PayTR Durum Sorgu API'si ile sonucu sorgulanır. Bu, en yüksek öncelikli reconciliation adayıdır. |
| `payment_attempt_not_found` | Gelen callback, sistemde kayıtlı bir `payment_attempt` ile eşleştirilemedi. | **Karar:** `manual_review_required`. Bu durum, `providerReference`'ın yanlış gelmesi, sistemde veri kaybı veya sahte bir callback gibi ciddi sorunlara işaret edebilir. Otomatik olarak çözümlenmemelidir. |
| `missing paymentAttemptId` | Callback adayı içinde `paymentAttemptId` veya eşleştirilebilecek bir referans (örn. `providerReference`) yok. | **Karar:** `rejected` ve `manual_review_required`. Referans olmadan işlem yapılamaz. Bu durum loglanır ve incelenir. |
| `providerReference` var ama `payment` bulunamadı | Callback veya durum sorgusu, sistemde olmayan bir `providerReference` (`merchant_oid`) içeriyor. | **Karar:** `manual_review_required`. Bu durum, sahte bir istek veya bizim sistemimizle PayTR arasındaki bir `merchant_oid` senkronizasyon sorununa işaret edebilir. |
| `amount mismatch` | Sağlayıcıdaki ödeme tutarı ile sistemdeki beklenen tutar eşleşmiyor. | **Karar:** `reconciliation_rejected` ve `manual_review_required`. Finansal tutarlılık en önemli kuraldır. Bu durum otomatik olarak onaylanamaz. Fraud veya entegrasyon hatası olabilir. |
| `currency mismatch` | Sağlayıcıdaki para birimi ile sistemdeki para birimi eşleşmiyor. | **Karar:** `reconciliation_rejected` ve `manual_review_required`. Tutar gibi, para birimi de kritiktir. Otomatik olarak çözümlenmemelidir. |
| `rejected / signature_failed` | Gelen callback'in imzası geçersiz. | **Karar:** Callback `rejected` olarak işaretlenir. Ancak bu, ödemenin başarısız olduğu anlamına gelmez. Ödeme `unknown_result` olarak kabul edilir ve `reconciliation_required` durumuna alınarak durumu PayTR'den sorgulanır. |
| `duplicate callback` | Aynı `providerEventId` ile ikinci bir callback geldi. | **Karar:** İkinci callback `ignored` olarak işaretlenir. `payment` state'i üzerinde ikinci bir etki yaratmaz. Reconciliation gerektirmez. |
| `replay / freshness reject` | Callback'in çok eski olduğuna karar verildi. | **Karar:** Callback `rejected` olur. İmza hatası gibi, ödemenin durumu belirsizleşir. `reconciliation_required` durumuna alınarak PayTR'den sorgulanmalıdır. |
| `terminal conflict` | Ödeme zaten `SUCCEEDED` iken `FAILED` callback'i geldi veya tam tersi. | **Karar:** Yeni gelen callback `ignored` olarak işaretlenir. Terminal bir state'ten (`SUCCEEDED`, `FAILED`) diğerine geçiş yapılmaz. `manual_review_required` durumu oluşturulur ve loglanır, çünkü bu durum ciddi bir tutarsızlığa işaret eder. |
| Provider status inquiry `success` ama internal `payment` farklı state'te | Durum sorgusu `success` döndü, ancak internal `payment` state'i `FAILED` veya `CANCELLED`. | **Karar:** `manual_review_required`. Bu, sistemler arasında ciddi bir tutarsızlık olduğunu gösterir. Otomatik düzeltme yapılmamalı, operatör incelemesi gereklidir. |
| Provider status inquiry `error`: `merchant_oid` ile ödeme bulunamadı | PayTR, bu `merchant_oid` için bir ödeme olmadığını belirtiyor. | **Karar:** `status_query_inconclusive`. Ödeme gerçekten hiç başlatılmamış, başarısız olmuş veya henüz işlenmemiş olabilir. İşlem hemen `failed` sayılmaz. Belirli aralıklarla birkaç kez daha denenir. Maksimum deneme sayısına ulaşıldıktan sonra hala bulunamazsa, `payment` state'i `FAILED` olarak güncellenir ve `reconciled` olarak kapatılır. |

## 6. Reconciliation State İhtiyacı

Bu bölümde, mutabakat (reconciliation) sürecinin yaşam döngüsünü yönetmek için mevcut state modellerinin yeterliliği değerlendirilmektedir.

### Soru: Mevcut `ProviderCallbackProcessingStatus` Yeterli mi?

`packages/contracts/src/provider.ts` içinde tanımlanan `ProviderCallbackProcessingStatus` enum'u (`received`, `accepted`, `rejected`, `ignored`, `failed`, `duplicate`) gelen **callback kayıtlarının işlenme durumunu** yönetmek için tasarlanmıştır. Bu, bir callback'in sisteme alınıp, doğrulanıp, bir komuta dönüştürülüp dönüştürülmediğini takip eder.

Ancak, reconciliation süreci daha farklı bir yaşam döngüsüne sahiptir. Bu süreç, bir callback'in işlenmesinden ziyade, **belirsiz durumdaki bir `payment` entity'sinin nihai sonucunu bulma operasyonunu** takip eder. Örneğin, bir ödeme `unknown_result` durumundaysa, bu ödemenin kendisi "mutabakat bekliyor" durumundadır. Bu, callback kaydının `ignored` olmasından farklı bir kavramdır.

**Karar: Hayır, `ProviderCallbackProcessingStatus` yeterli değildir.**

Reconciliation yaşam döngüsünü `ProviderCallbackProcessingStatus` içine sıkıştırmak, iki farklı sorumluluğu aynı state makinesine yükleyerek anlam karmaşasına yol açar. Bir `payment`'ın mutabakat durumu, o `payment`'a ait bir callback kaydının işlenme durumundan bağımsız olarak yönetilebilmelidir.

### Öneri: Ayrı Bir Reconciliation State Enum Gerekir mi?

**Karar: Evet, gereklidir.**

Bir `payment` entity'sine veya bu amaçla oluşturulacak ayrı bir `reconciliation_tasks` tablosundaki bir kayda eklenmek üzere, mutabakat sürecinin adımlarını temsil eden ayrı bir `enum` tanımlanması önerilir. Bu, hangi ödemelerin aktif olarak mutabakat döngüsünde olduğunu, hangi aşamada olduklarını ve sonucunu sorgulamayı ve yönetmeyi kolaylaştırır.

### Aday `ReconciliationStatus` Enum Değerlendirmesi

Aşağıda, görev tanımında belirtilen aday statülerin değerlendirmesi ve önerilen kullanım amaçları yer almaktadır:

| Aday Statü | Değerlendirme ve Öneri |
| :--- | :--- |
| `reconciliation_required` | **Önerilir.** Bir `payment`'ın durumunun belirsizleştiği (örn. `unknown_result`, `pending` timeout) ve aktif olarak netleştirilmesi gerektiği anlamına gelen başlangıç state'i. |
| `status_query_pending` | **Önerilir.** Sistemin, bu ödeme için PayTR Durum Sorgu API'sine bir istek gönderdiği ancak henüz yanıt almadığı ara state. |
| `status_query_succeeded` | **Önerilir.** Durum sorgulama API çağrısının başarıyla tamamlandığını ve bir sonuç (başarılı/başarısız ödeme veya hata) alındığını belirtir. |
| `status_query_failed` | **Önerilir.** Durum sorgulama API çağrısının teknik bir nedenle (örn. network hatası, PayTR API timeout) başarısız olduğunu belirtir. Bu durumda işlem, `reconciliation_required`'a geri dönüp tekrar denenebilir. |
| `status_query_inconclusive` | **Önerilir.** API sorgusu başarılı (`succeeded`) oldu, ancak PayTR'den gelen yanıt ödemenin nihai durumu hakkında kesin bir bilgi vermedi (örn. "ödeme bulunamadı"). Bu durumda işlem, bir süre sonra tekrar denenmek üzere `reconciliation_required`'a geri dönebilir. |
| `manual_review_required` | **Önerilir.** Otomatik olarak çözülemeyen (örn. `amount_mismatch`, `terminal_conflict`) ve bir operatör müdahalesi gerektiren durumlar için terminal state. |
| `reconciled` | **Önerilir.** Mutabakat sürecinin başarıyla tamamlandığını ve `payment` entity'sinin nihai state'ine (`SUCCEEDED` veya `FAILED`) ulaştırıldığını gösteren terminal state. |
| `reconciliation_rejected` | **Önerilir.** Mutabakatın, finansal tutarsızlık gibi kritik bir hata nedeniyle reddedildiğini gösteren terminal state. Genellikle `manual_review_required` ile birlikte kullanılır. |

**Sonuç:** `payment` entity'sine eklenecek bir `reconciliationStatus: ReconciliationStatus` alanı veya ayrı bir `reconciliation_tasks` tablosu, bu yeni `enum` ile mutabakat sürecini temiz ve yönetilebilir bir şekilde modelleyebilir.

**Implementation Yapılmayacak Notu:** Bu pakette yeni bir `enum` veya veritabanı alanı eklenmeyecektir. Sadece bu ihtiyaca yönelik karar önerisi sunulmuştur.

## 7. Payment Owner Mutation Kararları

Bu paket (`10C10-B`) bir karar ve envanter paketidir. Bu nedenle, `payment` state'ini değiştirecek (mutate) hiçbir kod implementasyonu **yapılmayacaktır**. Ancak, gelecekteki implementasyon paketleri (`10C11` ve sonrası) için, reconciliation sürecinin `payment`'ın nihai durumunu güvenli bir şekilde güncelleyebilmesi için hangi `command`'lerin gerekeceğinin envanterini çıkarmak önemlidir.

### Gelecekte Gerekebilecek `PaymentCallbackOwnerCommand` Adayları

- `MARK_PAYMENT_PENDING`
- `MARK_PAYMENT_UNKNOWN_RESULT`
- `MARK_PAYMENT_CANCELLED`
- `MARK_PAYMENT_EXPIRED`
- **`MARK_PAYMENT_RECONCILED` (Yeni Aday):** Bu komut, bir durum sorgulama operasyonu sonucunda ödemenin nihai durumunun (`SUCCEEDED` veya `FAILED`) belirlendiğini ve `payment` state'inin bu sonuca göre güncellenmesi gerektiğini belirtebilir. Bu, normal bir callback akışından farklı, bir sistem içi operasyon sonucu olduğunu netleştirir.

### Neden 10C10-B'de Mutation Uygulanmamalıdır?

- **State Mapping Netleşmeden Mutation Riskli:** PayTR durum sorgu API'sinden dönecek tüm `err_no` ve senaryoların, sistemin iç state'lerine (%100) nasıl haritalanacağı tam olarak netleşmeden ve doğrulanmadan state değiştirecek bir kod yazmak, öngörülemeyen hatalara ve veri tutarsızlıklarına yol açar.
- **PayTR Status Inquiry Sonucu Owner Guard Olmadan İşlenemez:** Dış sağlayıcıdan gelen bilgi (bu durumda durum sorgusu sonucu), doğrudan `business truth` olarak kabul edilemez. `Payment Owner`'ın bu bilgiyi alıp, kendi iç kuralları (state guard'lar, tutar/para birimi doğrulaması vb.) ile doğruladıktan sonra bir `command`'e dönüştürmesi gerekir. Bu guard mekanizmaları henüz tasarlanmamıştır.
- **Order/Finance Zinciri Etkilenebilir:** `payment` state'i, kendisinden sonra gelen `order` (sipariş) ve `finance` (hakediş) gibi kritik sistemleri tetikler. Yanlış bir `SUCCEEDED` veya `FAILED` kararı, olmayan bir siparişin oluşturulmasına veya haklı bir siparişin iptal edilmesine yol açabilir. Bu zincirleme etki, `owner boundary` kuralları tam olarak uygulanmadan önce çok risklidir.
- **10C10-B Sadece Karar Paketidir:** Görev tanımı gereği bu paket, kod implementasyonu değil, analiz ve karar envanteri üretme görevidir. Mutation eklemek, bu görevin kapsamını ve sınırlarını ihlal eder.

## 8. Retry / Backoff / Timeout Kararı

Bu bölümde, PayTR Durum Sorgu API'sine yönelik yeniden deneme (retry), gecikmeli yeniden deneme (backoff) ve zaman aşımı (timeout) politikaları, `planlama/aşama-6/FALLBACK_RETRY_TIMEOUT_POLICY.md` dosyasındaki ana prensipler temel alınarak değerlendirilmektedir.

### Mevcut İlkeler

- **Timeout kesin başarısızlık değildir:** Bir dış sisteme yapılan çağrının zaman aşımına uğraması, işlemin başarısız olduğu anlamına gelmez. Durum `unknown_result` olarak kabul edilmeli ve mutabakat (reconciliation) ile netleştirilmelidir.
- **`unknown_result` reconciliation ile kapanır:** Belirsiz kalan tüm sonuçlar, aktif bir mutabakat süreci ile takip edilmeli ve nihai bir duruma (`succeeded` veya `failed`) ulaştırılmalıdır.
- **Retry sadece retry-safe koşullarda yapılır:** Bir işlemin yeniden denenmesi, yalnızca tekrar denemenin bir yan etki (örn. çifte ödeme) yaratmayacağı, idempotent ve güvenli olduğu durumlarda yapılmalıdır.

### 10C10-B için Öneriler

- **Status inquiry retry edilmeli mi?**
  **Evet.** Durum sorgulama bir `GET` (sorgu) operasyonu doğasındadır ve idempotenttir. Aynı siparişin durumunu birden çok kez sorgulamak, sistemde bir state değişikliğine veya yan etkiye neden olmaz. Bu nedenle, durum sorgulama API çağrıları güvenle yeniden denenebilir.

- **Hangi durumlar retryable?**
  1.  **Ağ Hataları/Timeout:** Durum sorgulama isteği PayTR'ye ulaşmazsa veya PayTR'den yanıt alınamazsa (örn. HTTP 5xx, network timeout), istek yeniden denenmelidir.
  2.  **`status_query_inconclusive` Sonucu:** PayTR API'si başarılı bir şekilde yanıt döner ancak ödemenin durumu belirsizse (örn. `err_msg: "merchant_oid ile basarili odeme bulunamadi"`), bu durum ödemenin hala işlenmekte olabileceğine işaret edebilir. Bu nedenle, istek, artan bir gecikme (exponential backoff) ile birkaç kez daha yeniden denenmelidir.

- **Hangi durumlar manual review?**
  - **Kesin Hatalar:** PayTR'den `status: "error"` ve `err_no` ile birlikte, yeniden denemenin bir anlam ifade etmeyeceği kesin bir hata dönerse (örn. "hatalı token", "geçersiz mağaza ID"), bu durum `manual_review_required` olarak işaretlenmeli ve bir operatöre bildirilmelidir.
  - **Sürekli Belirsizlik:** Çok sayıda yeniden denemeye rağmen bir ödemenin durumu hala `inconclusive` kalıyorsa, bu durum da `manual_review_required` olarak işaretlenerek anomali olarak incelenmelidir.

- **Maksimum deneme / backoff bu pakette uygulanacak mı?**
  **Hayır.** Bu pakette (`10C10-B`), yeniden deneme ve gecikme (retry/backoff) mekanizmalarının **mantığı ve kuralları** belirlenecektir. Ancak, bu mekanizmaların fiili implementasyonu (örn. bir `Job Queue` sistemi, `BullMQ` veya benzeri bir altyapı ile) bu paketin kapsamı dışındadır ve sonraki implementasyon paketlerine bırakılacaktır.

## 9. Idempotency / Duplicate Kararı

`planlama/aşama-3/IDEMPOTENCY_POLICIES.md` belgesinde belirtildiği gibi, tüm kritik akışlar idempotent (tekrarlansa bile aynı sonucu üreten) olmalıdır. PayTR durum sorgulama ve mutabakat süreci de bu kurala tabidir.

### Değerlendirme

- **`providerEventId` / `providerReference` / `merchant_oid`:** Bu anahtarlar, PayTR tarafından üretilen ve bir işlemi tekil olarak tanımlayan referanslardır. Gelen callback'lerin veya durum sorgu sonuçlarının daha önce işlenip işlenmediğini anlamak için birincil anahtarlardır. Özellikle `merchant_oid`, hem durum sorgusu yapmak hem de gelen sonucu bir `payment_attempt` ile eşleştirmek için kullanılır.

- **`callbackRecordId`:** Bu, bizim sistemimizin bir callback'i ilk gördüğünde ürettiği, sisteme özgü biricik bir anahtardır. Bir callback'in işlenme yaşam döngüsünü takip etmek için kullanılır.

- **`paymentAttemptId`:** Bu da bizim sistemimize ait biricik bir anahtardır ve bir ödeme denemesini temsil eder. `merchant_oid` ile arasında güçlü bir ilişki kurulmalıdır.

- **`idempotencyKey`:** Bazı komutların (örn. `initiatePayment`) tekrarını önlemek için istemci veya sistem tarafından üretilen bir anahtardır.

- **Duplicate Callback:** Sistem, `providerEventId` veya `idempotencyKey` kontrolü ile aynı callback'in daha önce işlendiğini tespit etmelidir. Tespit edildiğinde, callback `duplicate` olarak işaretlenmeli ve `payment` state'i üzerinde ikinci bir mutation denemesi yapılmamalıdır. Bu davranış, mevcut `callback-worker` tarafından zaten kısmen yönetilmektedir.

- **Duplicate Status Inquiry Result:** Durum sorgulama işlemi doğası gereği idempotent olsa da, sorgu sonucunu işleyen mekanizmanın da idempotent olması gerekir. Örneğin, aynı `succeeded` sonucu iki kez işlenirse, iki kez `payment_captured` eventi atılmamalı veya `order_create` komutu iki kez tetiklenmemelidir. Bu, `payment` state'inin terminal (`SUCCEEDED`, `FAILED`) olmasını sağlayan state guard'lar ile korunmalıdır.

### Risk Kaydı

- **Risk: `providerReference` için Veritabanı Seviyesinde Garanti Yok**
  - Mevcut durumda `services/payment/src/repository/postgres.ts` dosyası, `providerReference` (`merchant_oid`) üzerinden arama yaparken `data` JSONB alanı üzerinde bir sorgu çalıştırmaktadır. `payments` tablosunda `providerReference` için ayrı, indekslenmiş ve `UNIQUE` kısıtlamasına sahip bir kolon bulunmamaktadır.
  - Bu durum, teorik olarak aynı `merchant_oid` ile birden fazla `payment` kaydının oluşturulmasına izin verebilir. Bu, bir `reconciliation` sürecinde hangi ödemenin doğru olduğunu belirlemeyi imkansız hale getirebilecek ciddi bir veri bütünlüğü riskidir.
  - **Çözüm Önerisi (Gelecek Paketler İçin):** `payments` tablosuna `provider_name` ve `provider_reference` için birleşik (composite) `UNIQUE` indekse sahip yeni kolonlar eklenmesini içeren bir veritabanı migration'ı planlanmalıdır.

- **10C10-B Kararı:** Bu pakette veritabanı şeması değişikliği veya `migration` **yapılmayacaktır**. Bu risk, ileride ele alınmak üzere sadece bir risk kaydı olarak bu envantere eklenmiştir.

## 10. Error Code / API Error Kararı

Bu bölümde, PayTR durum sorgulama ve mutabakat sürecinde ortaya çıkabilecek hataların, `API_ERROR_CATALOG.md` ve `ERROR_CODE_STANDARD.md` belgelerinde tanımlanan standartlara göre nasıl normalize edileceği ve yönetileceği kararları yer almaktadır.

### PayTR Hatalarının Normalizasyonu

PayTR durum sorgu API'sinden dönen `status: "error"` yanıtları, `err_no` ve `err_msg` alanları içerir. Bu hatalar, doğrudan son kullanıcıya veya iç sistemlere ham olarak yansıtılmamalıdır. Bunun yerine, standart bir kanonik hata koduna dönüştürülmelidir.

**Öneri:** PayTR'den gelen her bir `err_no`, `PAYMENT_PROVIDER_PAYTR_STATUS_QUERY_ERROR_<err_no>` formatında bir internal loglama koduna ve `ERROR_CODE_STANDARD.md`'deki daha genel bir kanonik koda haritalanmalıdır.

| PayTR `err_no` | PayTR `err_msg` | Önerilen Kanonik Error Code | Kategori | Anlamı ve Aksiyon |
| :--- | :--- | :--- | :--- | :--- |
| (Bilinmiyor) | `hatalı token` | `PROVIDER_AUTHENTICATION_FAILED` | `permission` | PayTR'ye gönderilen `paytr_token` geçersiz. Konfigürasyon (merchant_key) kontrol edilmeli. Manuel inceleme gerekir. |
| `004` | `merchant_oid ile basarili odeme bulunamadi` | `PAYMENT_RECONCILIATION_INCONCLUSIVE` | `unknown_result` | Ödemenin sonucu belirsiz. Retry mekanizması ile tekrar sorgulanmalı. |
| (Diğerleri) | (Diğer hata mesajları) | `PROVIDER_STATUS_QUERY_FAILED` | `system` | Diğer tüm PayTR hataları için genel bir kod. Detaylar loglanır ve manuel inceleme için işaretlenir. |

### Yeni Kanonik Hata Kodu İhtiyacı

- **`PAYMENT_UNKNOWN_RESULT` Gerekli mi?**
  **Evet.** Bu kod, `ERROR_CODE_STANDARD.md` belgesinde zaten mevcuttur ve bir ödeme işleminin sonucunun (başarılı/başarısız) ağ hataları, timeout veya sağlayıcı belirsizliği nedeniyle bilinemediği durumlar için kritik öneme sahiptir. Bu durumdaki ödemeler, `reconciliation_required` olarak işaretlenmelidir.

- **`PROVIDER_STATUS_QUERY_FAILED` Gerekli mi?**
  **Evet.** Bu, durum sorgulama işleminin kendisinin teknik bir nedenle (ağ hatası, PayTR API'sinin ulaşılamaması vb.) başarısız olduğunu belirten yeni bir kanonik kod olabilir. Bu kod, işlemin yeniden denenmesi (retry) gerektiğini belirtir.

- **`PAYMENT_RECONCILIATION_REQUIRED` Gerekli mi?**
  **Evet.** Bu kod, `ERROR_CODE_STANDARD.md` içinde de yer alır. Bir ödemenin durumunun aktif olarak sorgulanması ve netleştirilmesi gerektiğini belirtir. Bu, bir hata kodundan çok, bir `payment` veya `reconciliation_task` entity'sinin durumu olarak düşünülebilir.

- **`PAYMENT_AMOUNT_MISMATCH` / `PAYMENT_CURRENCY_MISMATCH` Gerekli mi?**
  **Evet.** Bu tür kanonik kodlar, mutabakat sırasında finansal tutarsızlıkları tespit etmek için elzemdir. Durum sorgu sonucunda dönen tutar veya para birimi, sistemdeki kayıtlarla eşleşmiyorsa, işlem bu hata kodlarından biriyle `manual_review_required` durumuna alınmalıdır. Bunlar `API_ERROR_CATALOG.md`'deki `business_rule` veya `validation` kategorisine girer.

**Implementation Yapılmayacak Notu:** Bu pakette yeni hata kodları veya bu kodları fırlatan mantıklar implemente edilmeyecektir. Sadece ihtiyaç ve standardizasyon kararları envantere eklenmiştir.

## 11. Audit / Event Kararı

Bu bölümde, PayTR durum sorgulama ve mutabakat sürecinde üretilmesi gereken denetim (audit) kayıtları ve olayların (events) envanteri, `10C10-A` raporunda atıfta bulunulan `AUDIT_TAXONOMY` ve `EVENT_TAXONOMY` prensiplerine göre çıkarılmaktadır.

### Ayrımın Netleştirilmesi

- **Event (Olay):** Bir durum değişikliğinin **sonucunu** bildiren sinyaldir. Diğer sistemlerin bu sonuca tepki vermesi (react) için yayınlanır. Örneğin, `payment_reconciled_as_succeeded` bir event olabilir ve `order` sistemi bu event'i dinleyerek sipariş oluşturma işlemini başlatabilir. **Event, truth değildir.**

- **Audit (Denetim Kaydı):** Bir durum değişikliğinin **kanıtıdır**. Kimin, ne zaman, hangi nedenle ve hangi verilerle bir değişiklik yaptığını veya yapmaya çalıştığını kaydeden, değişmez bir denetim izidir. Örneğin, `reconciliation_status_query_performed` bir audit kaydıdır. **Audit, business truth değildir**, sadece truth üzerinde yapılan operasyonların kaydıdır.

### Önerilen Event ve Audit Kayıtları

| Süreç Adımı | Tür | Önerilen Ad | Açıklama |
| :--- | :--- | :--- | :--- |
| Bir ödeme mutabakat gerektirdiğinde | Audit & Event | `PaymentReconciliationRequired` | Bir ödemenin durumunun belirsiz (`unknown_result` vb.) olduğu ve aktif mutabakat döngüsüne alındığı kaydedilir. |
| Durum sorgulama isteği gönderildiğinde | Audit | `ProviderStatusInquiryRequested` | PayTR'ye durum sorgulama isteği gönderildiği, hangi `merchant_oid` için gönderildiği ve isteğin içeriği denetim amaçlı kaydedilir. |
| Durum sorgulama yanıtı alındığında | Audit | `ProviderStatusInquiryCompleted` | PayTR'den gelen yanıtın (başarılı veya hatalı) ham hali ve ne zaman alındığı kaydedilir. |
| Mutabakat sonucu `payment` state'ini güncellediğinde | Audit & Event | `PaymentReconciledAsSucceeded` / `PaymentReconciledAsFailed` | Mutabakat sonucunda ödemenin nihai durumunun ne olarak belirlendiği ve `payment` state'inin güncellendiği hem denetim kaydı olarak tutulur hem de diğer sistemlerin tepki vermesi için bir event olarak yayınlanır. |
| Mutabakat sonucu çözülemediğinde | Audit & Event | `PaymentReconciliationInconclusive` | Yapılan sorgulamalara rağmen sonucun belirsiz kaldığı ve işlemin bir sonraki denemeye bırakıldığı kaydedilir. |
| Mutabakat manuel inceleme gerektirdiğinde | Audit & Event | `PaymentReconciliationRequiresManualReview` | Tutar uyuşmazlığı gibi otomatik çözülemeyen bir durumun tespit edildiği ve operatör müdahalesi için işaretlendiği kaydedilir. |
| Bir düzeltme (correction) yapıldığında | Audit | `PaymentCorrectionPerformed` | Manuel müdahale veya otomatik bir süreçle, hatalı veya tutarsız bir `payment` state'inin düzeltildiği kaydedilir. Bu, standart bir mutabakat akışından farklı, bir istisna durumudur. |

### Net Kurallar

- **Event truth değildir:** `PaymentReconciledAsSucceeded` eventi, `payment` state'inin `SUCCEEDED` olmasının bir sonucudur, sebebi değil.
- **Audit business truth değildir:** Audit kayıtları, `payment` state'inin kendisi değil, o state üzerinde yapılan operasyonların tarihçesidir.
- **Reconciliation sonucu `correction audit` gerektirebilir:** Bir mutabakat, sistemdeki bir anormalliği (örn. `SUCCEEDED` görünen bir ödemenin PayTR'de `failed` olması) ortaya çıkarırsa, bu durumu düzeltmek için yapılan işlem ayrı bir `correction` audit kaydı ile belgelenmelidir.

**Implementation Yapılmayacak Notu:** Bu pakette, listelenen bu event veya audit kayıtlarını üreten hiçbir kod veya altyapı implementasyonu **yapılmayacaktır**. Bu bölüm, yalnızca gelecekteki implementasyon paketleri için bir gereksinim envanteri niteliğindedir.

## 12. Test / Smoke Inventory

Mevcut smoke test altyapısı (`tests/smoke/run-smoke.ts`) ve `planlama/TEST_STRATEJISI.md` belgesi temel alınarak, gelecekte PayTR durum sorgulama ve mutabakat mekanizmasının güvenilirliğini doğrulamak için aşağıdaki smoke test suit'lerinin oluşturulması önerilmektedir.

### Önerilen Smoke Test Senaryoları

- **`paytr-status-inquiry-token-smoke`:**
  - **Amaç:** Durum sorgulama için gereken `paytr_token`'in, `createPaytrStatusInquiryToken` gibi bir yardımcı fonksiyon tarafından doğru bir şekilde (`base64(hmac_sha256(...))`) üretildiğini doğrulamak.
  - **Kapsam:** Token üretim mantığını izole bir şekilde test etmelidir.

- **`paytr-status-inquiry-mapping-smoke`:**
  - **Amaç:** PayTR Durum Sorgu API'sinden dönen çeşitli `success` ve `error` yanıtlarının, sistemin iç modellerine (`ReconciliationCandidate` vb.) doğru bir şekilde haritalandığını (map) doğrulamak.
  - **Kapsam:** `mapPaytrStatusInquiryToCandidate` gibi bir mapping fonksiyonunun, `status`, `err_no`, `payment_amount` gibi alanları doğru işlediğini test etmelidir.

- **`payment-reconciliation-decision-smoke`:**
  - **Amaç:** Bir `ReconciliationCandidate` (durum sorgu sonucu) temelinde, doğru mutabakat kararının (`reconciliation_required`, `manual_review_required`, `reconciled` vb.) alındığını doğrulamak.
  - **Kapsam:** Özellikle `amount mismatch`, `currency mismatch`, `inconclusive` gibi durumların doğru state geçişlerine yol açtığını test etmelidir.

- **`payment-reconciliation-idempotency-smoke`:**
  - **Amaç:** Aynı durum sorgulama sonucunun birden çok kez işlenmesinin, `payment` state'i üzerinde mükerrer bir etki yaratmadığını doğrulamak.
  - **Kapsam:** `reconciled` olarak işaretlenmiş bir ödemenin, yeni bir durum sorgu sonucuyla tekrar state değiştirmeye çalışmasını engelleyen guard'ları test etmelidir.

- **`payment-reconciliation-no-order-handoff-smoke`:**
  - **Amaç:** Mutabakat sonucunda `SUCCEEDED` olarak işaretlenen bir ödemenin, bu paket kapsamında **kesinlikle** bir `order create` veya `order handoff` işlemini tetiklemediğini doğrulamak.
  - **Kapsam:** `payment reconciled` işleminin yan etkilerinin (events) `order` sistemi tarafından dinlenmediğini veya bu dinleme mantığının henüz aktif olmadığını garanti etmelidir.

- **`payment-reconciliation-no-finance-risk-mutation-smoke`:**
  - **Amaç:** Mutabakat sürecinin, `settlement`, `payout` veya `risk` gibi diğer domain'lerin state'lerini doğrudan değiştirmediğini doğrulamak.
  - **Kapsam:** `owner boundary` ilkesinin korunduğunu ve mutabakatın sadece `payment` domain'i içinde kaldığını garanti etmelidir.

**Implementation Yapılmayacak Notu:** Bu pakette, yukarıda listelenen smoke test suit'lerinden hiçbiri **implemente edilmeyecektir**. Bu liste, sonraki implementasyon paketleri için bir test gereksinim envanteri olarak hizmet eder.

## 13. Kırmızı Bayrak / Sarı Bayrak Listesi

Bu bölümde, PayTR durum sorgulama ve mutabakat sürecinin analizi sırasında tespit edilen, dikkatle yönetilmesi gereken riskler ve uyarılar listelenmektedir.

### Kırmızı Bayraklar

- **Yok.** Bu paket bir implementasyon paketi olmadığı ve sadece analiz ve envanter içerdiği için, mevcut durumu bozan veya acil müdahale gerektiren bir "kırmızı bayrak" tespit edilmemiştir.

### Sarı Bayraklar (Dikkat Edilmesi Gerekenler)

- **Sarı Bayrak 1: Kod ve Planlama State İsimleri Uyumsuzluğu**
  - **Durum:** Koddaki `PaymentState` (`SUCCEEDED`, `FAILED`) ile planlama dokümanlarındaki kanonik state'ler (`captured`, `authorizing`) arasında birebir eşleşme yoktur.
  - **Değerlendirme:** Bu beklenen bir durumdur. Ancak, mutabakat sürecinde `pending_reconciliation` gibi yeni ara state'ler ekleneceği için, bu haritalamanın ileride dikkatli yapılması ve kanonik modele yakınsanması önemlidir.

- **Sarı Bayrak 2: `providerReference` için DB-Level Uniqueness Garantisi Eksikliği**
  - **Durum:** `payments` tablosunda `providerReference` (`merchant_oid`) için veritabanı seviyesinde bir `UNIQUE` kısıtlaması yoktur. Bu, teorik olarak aynı `merchant_oid` ile birden fazla ödeme kaydı oluşturma riski taşır.
  - **Değerlendirme:** Bu, veri bütünlüğü için **kritik bir risktir**. Mutabakat sürecini doğrudan etkiler. Çözümü bir veritabanı `migration`'ı gerektirir ve bu paketin kapsamı dışındadır. Ancak sonraki implementasyon paketlerinin en öncelikli konularından biri olmalıdır.

- **Sarı Bayrak 3: PayTR `returns` Alanının Kapsam Dışında Kalması Gerekliliği**
  - **Durum:** PayTR durum sorgu yanıtındaki `returns` alanı, iadeleri (refunds) içerir.
  - **Değerlendirme:** Bu alanın işlenmesi, `payment` sonucunu netleştirme görevini aşar ve `refund`/`settlement` domain'lerinin sınırlarını ihlal eder. Bu alanın `10C10-B` ve hemen ardından gelecek implementasyon paketlerinde **kesinlikle kapsam dışı** bırakılması ve iade süreçlerine havale edilmesi gerekir.

- **Sarı Bayrak 4: `pending`/`unknown_result` Durumlarının Erken Mutasyonu Riski**
  - **Durum:** `pending` veya `unknown_result` gibi belirsiz durumdaki bir ödemenin, yeterli doğrulama yapılmadan `SUCCEEDED` veya `FAILED` olarak işaretlenmesi.
  - **Değerlendirme:** Bu, `owner boundary` ilkesinin en temel ihlallerinden biridir ve olmayan parayla sipariş oluşturma veya geçerli bir ödemeyi iptal etme gibi zincirleme hatalara yol açabilir. Mutabakat sonucunu işleyecek olan `command`'ler, mutlaka `Payment Owner`'ın state guard'larından geçmelidir.

- **Sarı Bayrak 5: Provider Sonucunun Doğrudan `Business Truth` Kabul Edilmesi Riski**
  - **Durum:** PayTR durum sorgu API'sinden dönen `status: "success"` yanıtının, hiçbir içsel doğrulama (tutar, para birimi, sipariş durumu vb.) yapılmadan doğrudan `payment.state = SUCCEEDED` olarak işlenmesi.
  - **Değerlendirme:** Bu, `owner boundary` ilkesini kırar. Provider'dan gelen her bilgi bir "aday" (candidate) olarak görülmeli ve `Payment Owner` tarafından doğrulandıktan sonra `business truth` haline gelmelidir. Bu, implementasyon sırasında en çok dikkat edilecek noktalardan biridir.

## 14. Nihai Karar

**HARDENING-10C10-B — INVENTORY COMPLETE / IMPLEMENTATION REQUIRED**

Bu analiz ve envanter paketi (`10C10-B`) tamamlanmıştır. PayTR Durum Sorgu API'sinin sisteme entegrasyonu için gereken mevcut kod envanteri, PayTR API sözleşmesinin analizi, mapping kararları, mutabakat aday durumları, state ihtiyaçları, yeniden deneme politikaları, idempotency riskleri, hata kodu standartları, audit/event gereksinimleri ve test senaryoları çıkarılmıştır.

Bu paket bir implementasyon paketi olmadığı için `PASS` kararı verilmemiştir. Çıkarılan envanter, bir sonraki aşama olan kontrollü implementasyon için bir temel oluşturmaktadır.

## 15. Sonraki Paket Önerisi

Bu envanter çalışmasının tamamlanmasının ardından, bir sonraki adımın aşağıdaki gibi bir **kontrat ve temel hazırlık** paketi olması önerilir:

**Öneri: `HARDENING-10C10-01 — PayTR Status Inquiry Contract + Mapping Foundation`**

Bu paketin amacı, canlı bir API isteği yapmadan veya veritabanını değiştirmeden, PayTR durum sorgulama süreci için gereken temel yapı taşlarını (`contracts` ve `helpers`) oluşturmak olmalıdır. Kapsamı:

1.  **Contract Eklemesi:** `packages/contracts` içine, PayTR durum sorgu API'sinin isteğini ve yanıtını temsil eden `interface`'ler eklenir.
2.  **Token Helper'ı Eklemesi:** Durum sorgulama isteği için `paytr_token` üretecek olan `createPaytrStatusInquiryToken` yardımcı fonksiyonu `packages/contracts` içine eklenir ve smoke test ile doğrulanır.
3.  **Mapping Fonksiyonu Eklemesi:** Durum sorgu yanıtını, bu raporda tanımlanan `ReconciliationCandidate` benzeri bir iç modele dönüştürecek olan `mapPaytrStatusInquiryToCandidate` fonksiyonunun iskeleti oluşturulur ve temel senaryolar için smoke testler yazılır.

Bu yaklaşım, canlı bir entegrasyon veya `payment` state mutation'ı yapmadan önce, sürecin en temel ve kritik parçaları olan veri sözleşmelerini ve dönüşüm mantıklarını güvenli bir şekilde oluşturup doğrulamayı sağlar.
