
# HARDENING-10B-00A — Provider Callback Repo / Source Reality Inventory

## 1. Genel Durum

- **HARDENING-10A ile repo tarafında ne eklendi?**
  - **Contract:** `ProviderCallbackEnvelope`, `ProviderCallbackRecord`, `ProviderCallbackSignatureAlgorithm`, `ProviderCallbackSignatureInput`, `ProviderCallbackSignatureVerificationResult` ve ilgili yardımcı (`creator`) fonksiyonlar eklendi.
  - **Persistence:** `provider_callback_events` tablosunu oluşturan SQL migration'ı eklendi. Hem `Postgres` hem de `In-Memory` modlarını destekleyen `ProviderCallbackEventRepository` eklendi.
  - **Smoke Test:** `provider-callback-foundation` smoke testi ile in-memory repository'nin temel CRUD ve idempotency davranışları test altına alındı.

- **Hangi dosyalar gerçekten var?**
  - İstenen tüm dosyalar (`packages/contracts/src/provider.ts`, `packages/persistence/src/provider-callback.ts`, `infra/migrations/20260504_001_provider_callback_persistence.sql`, `tests/smoke/suites/provider-callback-foundation.ts` vb.) reponun mevcut durumunda bulunmaktadır.

- **Hangi callback/webhook bileşenleri hâlâ yok?**
  - **BFF Endpoint:** Callback/webhook olaylarını alacak public bir endpoint bulunmuyor.
  - **Signature Verification Logic:** İmza doğrulama `helper`'ı contract seviyesinde tanımlı fakat gerçek kriptografik doğrulama mantığı (logic) eklenmemiş.
  - **Domain Processing:** Gelen callback'leri işleyip ilgili domain (payment, shipment vb.) mantığını tetikleyecek bir yapı (örn. worker, consumer) yok.
  - **Reconciliation/Replay Runtime:** Başarısız veya tekrar eden callback'leri yönetecek bir runtime mevcut değil.
  - **Provider-Specific Mapping:** Farklı provider'lardan (Stripe, Aras Kargo vb.) gelen payload'ları ortak `ProviderCallbackRecord` formatına dönüştürecek bir `mapping` katmanı yok.

## 2. Contract Reality

- **`ProviderCallbackEnvelope` var mı?**
  - **EVET, VAR.** `packages/contracts/src/provider.ts` içinde tanımlanmış.

- **`ProviderCallbackRecord` var mı?**
  - **EVET, VAR.** `packages/contracts/src/provider.ts` içinde tanımlanmış. Bu, callback olaylarının state'ini yönetmek için persistence-neutral bir model sunar.

- **`ProviderCallbackSignatureAlgorithm/Input/VerificationResult` var mı?**
  - **EVET, VAR.** `ProviderCallbackSignatureAlgorithm`, `ProviderCallbackSignatureInput` ve `ProviderCallbackSignatureVerificationResult` arayüzleri `packages/contracts/src/provider.ts` dosyasında mevcut.

- **`createProviderCallbackSignatureVerificationResult` var mı?**
  - **EVET, VAR.** Bu yardımcı fonksiyon `packages/contracts/src/provider.ts` içinde bulunuyor ve standart bir doğrulama sonuç objesi oluşturmayı sağlıyor.

- **Boundary flags default `false` korunuyor mu?**
  - **EVET.** `createProviderCallbackEnvelope` ve `createProviderResultEnvelope` gibi yardımcı fonksiyonlar, `ProviderBoundaryFlags` objesini tüm değerleri `false` olacak şekilde oluşturur. Bu, provider'dan gelen bilginin doğrudan iş (business) gerçeğini değiştirmesini engeller.

- **Provider callback contract business truth gibi mi modellenmiş, yoksa record/envelope seviyesinde mi?**
  - **RECORD/ENVELOPE SEVİYESİNDE.** Contract'lar, gelen callback'i bir "olay kaydı" (record) olarak modeller. `ProviderCallbackRecord` ve `ProviderCallbackEnvelope` arayüzleri, bu olayın kendisini ve meta verilerini (imza durumu, alınma zamanı vb.) taşır, ancak doğrudan bir "sipariş ödendi" veya "kargo teslim edildi" gibi bir iş gerçeğini (business truth) temsil etmez. `businessTruthMutated: false` bayrağı bu ayrımı zorunlu kılar.

## 3. Persistence Reality

- **`provider-callback` repository var mı?**
  - **EVET, VAR.** `packages/persistence/src/provider-callback.ts` dosyasında `ProviderCallbackEventRepository` arayüzü tanımlanmıştır.

- **In-memory repo var mı?**
  - **EVET, VAR.** `InMemoryProviderCallbackEventRepository` sınıfı `packages/persistence/src/provider-callback.ts` içinde mevcut. Test ve yerel geliştirme için kullanılıyor.

- **Postgres repo var mı?**
  - **EVET, VAR.** `PostgresProviderCallbackEventRepository` sınıfı `packages/persistence/src/provider-callback.ts` içinde mevcut ve `provider_callback_events` tablosu üzerinde işlem yapıyor.

- **`insert/read/find/update/list` API’leri var mı?**
  - **EVET, VAR.** Repository arayüzü `insertProviderCallbackEvent`, `getProviderCallbackEventById`, `findProviderCallbackEventByProviderEventId`, `markProviderCallbackEventProcessed`, `listProviderCallbackEventsByProcessingStatus` gibi temel operasyonları destekliyor.

- **Duplicate `providerEventId` davranışı nasıl?**
  - **Postgres:** `ON CONFLICT (provider_domain, provider_name, provider_event_id) DO UPDATE` ifadesi sayesinde, aynı `provider_event_id` ile ikinci bir kayıt denemesi yeni bir satır oluşturmaz, sadece `updated_at` alanını günceller. Bu, veritabanı seviyesinde tekilliği garanti eder.
  - **In-Memory:** `eventIdIndex` haritası (Map) üzerinden bir kontrol yapılır. Eğer `providerEventId` daha önce eklenmişse, yeni kayıt oluşturulmaz ve mevcut kayıt döndürülür.

- **Duplicate `idempotencyKey` davranışı in-memory ve Postgres tarafında aynı mı?**
  - **HAYIR, FARKLI.**
    - **In-Memory:** `idempotencyKeyIndex` haritası üzerinden yapılan kontrolle, tekrar eden `idempotencyKey` için mevcut kayıt döndürülür, yeni kayıt oluşturulmaz.
    - **Postgres:** `PostgresProviderCallbackEventRepository`'deki `insert` sorgusu, `idempotency_key` için `ON CONFLICT` kuralı içermiyor. Yorum satırında "A more robust implementation might use a single query with COALESCE" notu düşülmüş. Migration dosyasında `idempotency_key` için `UNIQUE INDEX` bulunmaktadır, bu nedenle ikinci bir kayıt denemesi veritabanı hatası (`unique_violation`) fırlatacaktır. Davranış in-memory'den farklıdır.

- **Postgres `idempotency_key` conflict limiti var mı?**
  - **EVET, VAR.** `infra/migrations/20260504_001_provider_callback_persistence.sql` dosyasındaki `CREATE UNIQUE INDEX ... WHERE idempotency_key IS NOT NULL` ifadesi, (`provider_domain`, `provider_name`, `idempotency_key`) kombinasyonunun `NULL` olmayan değerler için benzersiz (unique) olmasını zorunlu kılar.

- **`packages/persistence/src/index.ts` export ediyor mu?**
  - **EVET.** `export * from './provider-callback';` satırı ile `provider-callback.ts` dosyasındaki tüm export'lar dışarıya açılıyor.

## 4. Migration Reality

- **`provider_callback_events` tablosu migration’da var mı?**
  - **EVET, VAR.** `infra/migrations/20260504_001_provider_callback_persistence.sql` dosyası bu tabloyu `CREATE TABLE IF NOT EXISTS` ifadesiyle oluşturuyor.

- **`provider_event_id` unique partial index var mı?**
  - **EVET, VAR.** `CREATE UNIQUE INDEX IF NOT EXISTS idx_provider_callback_events_provider_event_id ON ... WHERE provider_event_id IS NOT NULL;` satırı ile `NULL` olmayan `provider_event_id` değerleri için unique index oluşturuluyor.

- **`idempotency_key` unique partial index var mı?**
  - **EVET, VAR.** `CREATE UNIQUE INDEX IF NOT EXISTS idx_provider_callback_events_idempotency_key ON ... WHERE idempotency_key IS NOT NULL;` satırı ile `NULL` olmayan `idempotency_key` değerleri için unique index oluşturuluyor.

- **Migration idempotent mi?**
  - **EVET.** Tablo ve index'ler `IF NOT EXISTS` ifadeleriyle oluşturulduğu için migration birden çok kez çalıştırılsa bile hata vermez veya mevcut şemayı bozmaz. Trigger fonksiyonu `CREATE OR REPLACE`, trigger'ın kendisi ise `DROP TRIGGER IF EXISTS` ile oluşturulduğu için bu kısım da idempotenttir.

- **`created_at`/`updated_at` alanları var mı?**
  - **EVET, VAR.** Her iki alan da `TIMESTAMPTZ NOT NULL` olarak tanımlanmıştır. `created_at` `DEFAULT NOW()` ile, `updated_at` ise bir trigger aracılığıyla her `UPDATE` işleminde otomatik olarak güncellenir.

- **Migration repo’da uygulanmış kabul edilebilir mi, kanıt hangi closure’da?**
  - **EVET, UYGULANMIŞ KABUL EDİLEBİLİR.** `HARDENING-10A3-PROVIDER-CALLBACK-PERSISTENCE-MIGRATION-CLOSURE-REPORT.md` raporu, bu migration'ın başarıyla oluşturulduğunu ve `pnpm run build` ve `pnpm run typecheck` komutlarının hatasız çalıştığını belgelemiştir. Ayrıca, `HARDENING-10A5-R` raporu, `PERSISTENCE_MODE=postgres` ile smoke testlerin geçtiğini doğrulamıştır, bu da migration'ın altyapıyı bozmadığını gösterir.

## 5. BFF Reality

- **`apps/bff/src/server/index.ts` içinde callback/webhook endpoint var mı?**
  - **HAYIR, YOK.** `apps/bff/src/server/index.ts` dosyasında `/callback`, `/webhook` veya benzeri bir provider callback rotası (route) bulunmamaktadır. Sunucu sadece mevcut domainlere (örn. `/payment/initiate`, `/shipment/create-from-order`) yönelik istekleri işlemektedir.

- **`payment/shipment/notification/payout` route dosyalarında callback endpoint var mı?**
  - **HAYIR, YOK.** `apps/bff/src/server/payment.ts`, `shipment.ts`, `notification.ts` ve `payout.ts` dosyaları incelendiğinde, bu dosyaların sadece outbound (giden) istekleri başlatan (örn. `handleInitiatePayment`) veya domain objelerini okuyan/değiştiren (örn. `handleGetOrderDetail`) handler'lar içerdiği, ancak inbound (gelen) callback'leri işleyecek endpoint'ler içermediği görülmektedir.

- **BFF provider callback ingestion yapıyor mu?**
  - **HAYIR.** BFF'te gelen provider callback'lerini alacak, doğrulayacak ve persistence katmanına kaydedecek bir "ingestion" mekanizması mevcut değildir.

- **BFF domain callback processing yapıyor mu?**
  - **HAYIR.** BFF, gelen bir callback'i alıp "siparişin durumunu GÜNCELLE" veya "kargo takibini İLERLET" gibi bir domain işlemi yapmamaktadır.

- **BFF sadece mevcut domain route’ları mı taşıyor?**
  - **EVET.** BFF, mevcut haliyle, kullanıcı veya iç sistemlerden gelen komutları ilgili domain servislerine yönlendiren bir aracı (proxy/facade) görevi görmektedir. Dış provider'lardan gelen asenkron olayları işleme yeteneği yoktur.

## 6. Domain Service Reality

- **`payment` service callback/webhook/reconciliation içeriyor mu?**
  - **HAYIR.** `services/payment/src/payment.ts` dosyası sadece ödeme başlatma (`initiatePayment`) ve ödeme simülasyonunu (`simulatePaymentSuccess`) içerir. Gelen bir callback'i işleme veya durumu belirsiz bir ödemeyi sorgulama (reconciliation) mantığı yoktur.

- **`shipment` service callback/tracking ingestion içeriyor mu?**
  - **HAYIR.** `services/shipment/src/shipment.ts` dosyası, kargo oluşturma (`createShipmentFromOrder`) ve durumunu manuel olarak ilerletme (`transitionShipmentState`) mantığını içerir. Dış bir carrier'dan (Aras, Yurtiçi vb.) gelen bir "kargo yolda" veya "teslim edildi" callback'ini işleme (ingestion) özelliği yoktur.

- **`notification` service provider delivery callback içeriyor mu?**
  - **HAYIR.** `services/notification/src/notification.ts` dosyası bildirim oluşturur ve bu sırada `provider-adapter` aracılığıyla sandbox, parked veya not-configured modlarında "gönderim denemesi" yapar. Ancak bir provider'dan gelen "email teslim edildi" veya "SMS açılamadı" gibi bir delivery callback'ini işleyecek bir mekanizma içermez.

- **`payout` service provider result callback içeriyor mu?**
  - **HAYIR.** `services/payout/src/payout.ts` dosyası, bir batch onaylandığında provider'a ödeme talimatı göndermek için `provider-adapter`'ı çağırır (`applyPayoutBatchAction`). Ancak provider'dan gelen "ödeme başarılı" veya "ödeme başarısız" sonucunu bildiren bir callback'i işleyecek bir yapıya sahip değildir. Durumu `PROCESSING` olarak günceller ve orada bırakır.

- **`provider-adapter` dosyaları outbound/sandbox boundary mi, inbound callback mi?**
  - **TAMAMEN OUTBOUND/SANDBOX BOUNDARY.** Tüm domainlerdeki (`payment`, `shipment`, `notification`, `payout`) `provider-adapter.ts` dosyaları, ilgili servisten dış provider'a doğru giden (outbound) istekleri simüle etmek veya soyutlamak (abstract) için tasarlanmıştır. Hiçbiri gelen (inbound) bir callback'i işleme mantığı içermez.

## 7. Smoke Reality

- **`provider-boundary` smoke var mı?**
  - **EVET, VAR.** `tests/smoke/suites/provider-boundary.ts` dosyası, `ProviderResultEnvelope` ve `ProviderCallbackEnvelope` gibi temel contract'ların boundary flag'lerinin (`businessTruthMutated: false` vb.) doğru şekilde `false` olarak ayarlandığını doğrular.

- **`provider-callback-foundation` smoke var mı?**
  - **EVET, VAR.** `tests/smoke/suites/provider-callback-foundation.ts` dosyası, `InMemoryProviderCallbackEventRepository`'nin `insert`, `find`, `update` ve duplicate key (idempotency) davranışlarını test eder.

- **`payment/shipment/notification/payout` provider boundary smoke var mı?**
  - **EVET, HEPSİ VAR.**
    - `payment-provider-boundary.ts`: Ödeme başlatma akışında provider envelope'un doğru oluştuğunu test eder.
    - `shipment-provider-boundary.ts`: Kargo `SHIPPED` durumuna geçtiğinde provider envelope'un eklendiğini ve state'i doğrudan `DELIVERED` yapmadığını test eder.
    - `notification-provider-boundary.ts`: Farklı kanallar (EMAIL, SMS, PUSH) için `sandbox`, `not_configured`, `parked` modlarında provider envelope'ların doğru oluştuğunu test eder.
    - `payout-provider-boundary.ts`: Payout batch onaylandığında provider'a giden isteğin simüle edildiğini ve sonucun `PAID` olarak yansıtılmadığını test eder.

- **smoke runner kayıtları var mı?**
  - **EVET, VAR.** `tests/smoke/run-smoke.ts` dosyası, `package.json`'da tanımlanan tüm smoke testlerini çalıştıracak şekilde yapılandırılmıştır. `provider-callback-foundation` dahil tüm ilgili smoke testleri runner'a kayıtlıdır.

- **`package.json` scriptleri var mı?**
  - **EVET, VAR.** `package.json` dosyasında `smoke:provider-boundary`, `smoke:payment-provider-boundary`, `smoke:shipment-provider-boundary`, `smoke:notification-provider-boundary`, `smoke:payout-provider-boundary` ve `smoke:provider-callback-foundation` script'leri bulunmaktadır.

- **Callback foundation smoke gerçek assertion mı, hardcoded PASS mı?**
  - **GERÇEK ASSERTION.** `tests/smoke/suites/provider-callback-foundation.ts` dosyası, `node:assert` modülünü kullanarak `assert.ok`, `assert.equal`, `assert.deepStrictEqual` gibi gerçek karşılaştırmalar ve doğrulamalar yapmaktadır. Testler hardcoded `PASS` döndürmemektedir.

## 8. Current Gaps

- **BFF callback endpoint:** **YOK.**
- **Signature real verification:** **YOK.**
- **Replay runtime:** **YOK.**
- **Domain callback processing:** **YOK.**
- **Reconciliation runtime:** **YOK.**
- **Postgres callback smoke:** **YOK.** (Mevcut smoke test in-memory repository kullanıyor.)
- **Provider-specific callback mapping:** **YOK.**

## 9. 10B için Source Readiness Kararı

**SOURCE INVENTORY COMPLETE / DOMAIN INVENTORY REQUIRED**

## 10. Sonraki Alt Görev Önerisi

HARDENING-10B-00B — Payment Callback Domain Inventory
