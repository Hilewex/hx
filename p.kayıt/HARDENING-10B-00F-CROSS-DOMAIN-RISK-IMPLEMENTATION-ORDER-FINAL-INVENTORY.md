
# HARDENING-10B-00F — Cross-Domain Risk & Implementation Order Final Inventory

## 1. Genel Durum

- **10A ile ne tamamlandı?**
  - `HARDENING-10A` serisi ile provider callback altyapısının temelleri atıldı. `packages/contracts` altına `ProviderCallbackEnvelope`, `ProviderCallbackRecord` gibi temel veri sözleşmeleri eklendi. `packages/persistence` altına `provider_callback_events` tablosunu oluşturan migration ve bu tabloyu yöneten `Postgres` ve `In-Memory` repository implementasyonları eklendi. In-memory repository'nin davranışlarını doğrulayan `provider-callback-foundation` smoke testi oluşturuldu. `HARDENING-10A5-R` raporu ile bu temellerin BFF runtime'ı ile uyumlu çalıştığı ve regresyona yol açmadığı kanıtlandı.

- **10B-00A/B/C/D/E inventory’leri neyi netleştirdi?**
  - Bu envanterler, her bir ana callback domain'i (Payment, Shipment, Notification, Payout) için mevcut sistemin sınırlarını, risklerini ve potansiyel implementasyon adımlarını ortaya koydu. Ortak olarak, hiçbir domain'de gelen callback'leri işleyecek bir `BFF endpoint`'inin, `imza doğrulama` mantığının, `domain processing` worker'ının ve `reconciliation` runtime'ının olmadığı kesinleşti. Her domain için `provider response/callback`'in asla `business truth` olmadığı ve `owner`'ı by-pass edemeyeceği ilkesi, mevcut kod ve planlama dokümanları üzerinden teyit edildi. `PostgresProviderCallbackEventRepository`'deki `idempotency_key` conflict davranışının, `in-memory` implementasyonundan farklı olduğu ve production'da risk yaratabileceği önemli bir bulgu olarak öne çıktı.

- **Ortak sonuç nedir?**
  - Ortak sonuç, `10A` ile atılan "foundation"ın sağlam olduğu ancak gerçek bir provider callback işleme hattının (`ingestion`, `verification`, `processing`) hiçbir domain için mevcut olmadığıdır. Tüm domain'ler, ortak bir `BFF Ingestion Boundary`, `imza doğrulama`, `replay/idempotency guard` ve `asenkron işleme` altyapısına ihtiyaç duymaktadır. Domain-spesifik işlemeye geçmeden önce bu ortak guard'ların ve altyapının kurulması zorunludur.

## 2. Ortak Repo Gerçekliği

- **Contract foundation var mı?**
  - **EVET.** `packages/contracts/src/provider.ts` dosyasında `ProviderCallbackEnvelope`, `ProviderCallbackRecord` ve ilgili yardımcı arayüzler mevcuttur.
- **Persistence foundation var mı?**
  - **EVET.** `packages/persistence/src/provider-callback.ts` dosyasında `Postgres` ve `In-Memory` repository'ler mevcuttur.
- **Migration var mı?**
  - **EVET.** `infra/migrations/20260504_001_provider_callback_persistence.sql` dosyası `provider_callback_events` tablosunu ve gerekli index'leri oluşturmaktadır.
- **In-memory smoke var mı?**
  - **EVET.** `tests/smoke/suites/provider-callback-foundation.ts` dosyası, in-memory repository'nin temel davranışlarını test etmektedir.
- **BFF callback endpoint var mı?**
  - **HAYIR.** `apps/bff/src/server/index.ts` dosyasında provider callback'lerini alacak bir route bulunmamaktadır.
- **Real signature verification var mı?**
  - **HAYIR.** Contract'lar tanımlı olsa da gerçek kriptografik doğrulama mantığı mevcut değildir.
- **Replay runtime var mı?**
  - **HAYIR.**
- **Domain callback processing var mı?**
  - **HAYIR.**
- **Provider-specific mapping var mı?**
  - **HAYIR.**
- **Reconciliation runtime var mı?**
  - **HAYIR.**

## 3. Cross-Domain Değişmez İlkeler

- **Provider callback business truth değildir.**
  - **NETLEŞTİRİLDİ.** Callback, provider sistemindeki bir olayın sinyalidir, bizim sistemimizin kesin gerçeği değil.
- **Callback record owner state mutation değildir.**
  - **NETLEŞTİRİLDİ.** `ProviderCallbackRecord`, bir olayın denetlenebilir kaydıdır; `Order`, `Shipment` veya `Payment`'ın state'inin kendisi değildir.
- **Provider response/callback owner truth’u doğrudan mutate edemez.**
  - **NETLEŞTİRİLDİ.** `packages/contracts/src/provider.ts` içindeki `businessTruthMutated: false` bayrağı ve `OWNER_MATRIX.md` bu kuralı zorunlu kılar.
- **BFF truth owner değildir.**
  - **NETLEŞTİRİLDİ.** BFF, bir `read aggregation` ve `command handoff` katmanıdır. Asla `write` yapmaz.
- **Event/audit/outbox business mutation yerine geçmez.**
  - **NETLEŞTİRİLDİ.** `VERI_AKISI_SENKRONIZASYON_MODELI.md`'ye göre, önce owner truth yazılır, sonra bu değişimi bildiren event/audit/outbox kaydı üretilir.
- **Signature verification geçmeden processing yok.**
  - **NETLEŞTİRİLDİ.** Güvenilmeyen bir callback'in işlenmesi P0/P1 seviyesinde bir risktir.
- **Replay/idempotency guard geçmeden owner command yok.**
  - **NETLEŞTİRİLDİ.** Mükerrer bir callback'in tekrar `owner command` tetiklemesi duplicate etki yaratır ve engellenmelidir.
- **Domain effect yalnız ilgili owner command/event zinciriyle olabilir.**
  - **NETLEŞTİRİLDİ.** Bir `payment callback`'i, `payment owner`'ını tetikler. Ortaya çıkan `payment succeeded` event'i, `order owner`'ını tetikler. Bu zincir kırılamaz.
- **Callback processing idempotent olmalıdır.**
  - **NETLEŞTİRİLDİ.** Aynı callback'in tekrar işlenmesi, sistemin state'inde mükerrer bir değişikliğe yol açmamalıdır.
- **Public webhook endpoint security/rate-limit olmadan açılmamalıdır.**
  - **NETLEŞTİRİLDİ.** Bu, temel bir güvenlik ve stabilite önlemidir.

## 4. Domain Bazlı Nihai Sınırlar

### 4.1 Payment
- **Callback doğrudan order oluşturamaz.**
  - **DOĞRU.** `order` servisi, `payment`'ın ürettiği `payment success` sinyali sonrası tetiklenir.
- **Callback doğrudan settlement/hakediş yaratamaz.**
  - **DOĞRU.** `settlement` süreci, `order created` event'i sonrası başlar.
- **Sadece payment owner transition adayıdır.**
  - **DOĞRU.** Callback, `TransitionPaymentToSucceeded` gibi bir `payment owner command`'ı için sadece bir "aday"dır.
- **Unknown-result reconciliation gerektirir.**
  - **DOĞRU.** Callback gelmemesi veya belirsiz sonuç durumunda, `payment`'ın durumu aktif sorgulama (reconciliation) ile netleştirilmelidir.
- **Duplicate callback duplicate order üretemez.**
  - **DOĞRU.** Hem `callback repository`'deki `idempotency` guard'ları hem de `order` servisindeki `idempotency` kontrolü bunu engeller.

### 4.2 Shipment
- **Callback doğrudan delivered truth değildir.**
  - **DOĞRU.** Callback bir sinyaldir. `shipment owner`'ı, `shipment`'ın state'ini `DELIVERED` yaparak `truth`'u yaratır.
- **Callback doğrudan review/story eligibility açamaz.**
  - **DOĞRU.** `eligibility`, `shipment.delivered` `owner event`'ini dinleyen ayrı bir `customer-contribution` veya `review` servisinin sorumluluğundadır.
- **Delivered yalnız shipment owner command sonrası geçerli olur.**
  - **DOĞRU.** `TransitionShipmentToDelivered` command'ı bu geçişin tek meşru yoludur.
- **Eligibility shipment delivered owner event sonrası ayrı flow ile açılır.**
  - **DOĞRU.** `shipment` ve `eligibility` servisleri, event-driven mimari ile birbirinden ayrılmıştır.
- **Tracking projection truth üretmez.**
  - **DOĞRU.** Sipariş takip ekranı, `shipment` ve `order` `truth`'larını yansıtan bir `read model`'dir.

### 4.3 Notification
- **Callback sadece delivery attempt/status sinyalidir.**
  - **DOĞRU.** `delivered` callback'i, bildirimin kullanıcı tarafından "okunduğu" anlamına gelmez.
- **Delivered notification READ değildir.**
  - **DOĞRU.** `READ` state'i, kullanıcının uygulama içinde bildirimi görmesiyle tetiklenir.
- **Open/click READ state değildir; analytics sinyalidir.**
  - **DOĞRU.** `open/click` olayları güvenilmezdir ve `business truth` olarak kullanılamaz; sadece analitik için değerlidir.
- **Notification callback başka domain truth mutate edemez.**
  - **DOĞRU.** Sipariş bildiriminin `failed` olması, siparişin `failed` olduğu anlamına gelmez.
- **Analytics truth/decision owner değildir.**
  - **DOĞRU.** Analitik, karar sistemlerini besler, kararın sahibi değildir.

### 4.4 Payout
- **Callback doğrudan PAID yapamaz.**
  - **DOĞRU.** `payout owner`'ı, `MarkPayoutAsPaid` komutu ile state'i değiştirmelidir.
- **Risk/fraud hold varsa state değişmemeli.**
  - **DOĞRU.** `ON_HOLD` durumundaki bir `payoutItem`, `paid` callback'i gelse bile `PAID` yapılamaz. Bu durum bir anomali olarak incelenmelidir.
- **Failed/returned doğrudan settlement/finance truth mutate etmemeli.**
  - **DOĞRU.** Bu durumlar, `payout owner`'ı tarafından işlenmeli ve bir `FinanceCorrectionRecord` oluşturulmasını tetiklemelidir.
- **Finance correction payout owner event/command zinciri sonrası devreye girmeli.**
  - **DOĞRU.** Önce `payout` domain'i kendi state'ini (`FAILED`/`RETURNED`) günceller, sonra `finance-correction` domain'ini tetikler.
- **Batch-level ve item-level result ayrımı korunmalı.**
  - **DOĞRU.** `Truth`, `payoutItem` seviyesinde tutulur. `payoutBatch`'in durumu, item'ların durumlarının bir sonucudur.

## 5. Ortak Risk Matrisi

| Risk | Etkilenen domainler | Etki seviyesi | Mevcut durum | Gerekli guard | Hangi pakette ele alınmalı |
|---|---|---|---|---|---|
| Sahte callback | Payment, Shipment, Payout, Notification | P0 | Endpoint yok, risk aktif değil | Real signature verification | Ortak Ingestion Boundary |
| Signature verification eksikliği | Payment, Shipment, Payout, Notification | P0 | Gerçek doğrulama mantığı yok | Real signature verification | Ortak Ingestion Boundary |
| Duplicate/replay callback | Payment, Shipment, Payout, Notification | P1 | Repo'da `ON CONFLICT` var ama tam değil | Idempotency key / provider event id guard | Ortak Ingestion Boundary / Worker |
| Postgres idempotency_key conflict davranışı | ALL | P2 | Repo `insert` sorgusu DB hatası fırlatabilir | `insert` sorgusunda `ON CONFLICT` ile idempotency key yönetimi | Ortak Persistence Remediation |
| BFF’in truth owner gibi davranması | ALL | P1 | BFF'te `write` endpoint yok, risk aktif değil | BFF'in `write` yapmamasını sağlayan mimari kural | Mimari ve kod review ile sürekli denetlenmeli |
| Payment callback ile duplicate order | Payment, Order | P1 | `order` servisinde koruma var ama uçtan uca test yok | Callback idempotency + order create idempotency | Payment Processing, Order Service |
| Shipment callback ile erken eligibility | Shipment, Review, Story | P1 | `eligibility` servisleri `shipment` event'ini bekler, risk düşük | `shipment.delivered` event-driven akışı | Shipment Processing |
| Notification open/click analytics pollution | Notification, Analytics | P2 | İşleme mantığı yok, risk aktif değil | Bot/spam filtreleme ve idempotency | Notification Processing |
| Payout paid callback ile risk hold bypass | Payout, Finance, Risk | P0 | İşleme mantığı yok, risk aktif değil | `payout` state machine'inde `ON_HOLD` guard'ı | Payout Processing |
| Provider-specific mapping eksikliği | ALL | P2 | Mapping katmanı yok | Her provider için adapter/mapping katmanı | Her domain-spesifik pakette |
| Reconciliation runtime eksikliği | Payment, Shipment, Payout | P1 | `unknown_result` senaryoları yönetilemez | Periyodik sorgulama (polling) mekanizması | Her domain-spesifik pakette |
| Public webhook rate limiting eksikliği | ALL | P2 | Endpoint yok, risk aktif değil | Rate limit / abuse guard (Cloudflare, Nginx vb.) | Altyapı/DevOps |
| Event ordering sorunları | Shipment, Payout | P2 | State machine'ler katı, risk düşük ama test edilmemiş | State machine'in geçersiz geçişleri reddetmesi | Her domain-spesifik pakette |
| Postgres callback smoke eksikliği | ALL | P2 | Sadece in-memory test ediliyor | `PERSISTENCE_MODE=postgres` ile çalışan smoke test | Ortak Persistence Remediation |

## 6. Guard Dependency Sırası

Aşağıdaki sıra, mantıksal ve güvenlik açısından doğrudur. İtiraz yoktur.

1.  **Provider callback repository Postgres duplicate behavior fix / smoke:** En temel veri katmanındaki bir riskin, production'a veri alınmadan önce kapatılması gerekir. Bu olmadan, ingestion bile risklidir.
2.  **Common BFF callback ingestion boundary:** Tüm callback'ler için tek bir giriş kapısı oluşturmak, güvenliği ve yönetimi merkezileştirir.
3.  **Real signature verification guard:** Güvenilmeyen veriyi sisteme almadan en dış kapıda reddetmek en temel güvenlik kuralıdır.
4.  **Replay/idempotency guard:** Veri güvenilir olsa bile, mükerrer olup olmadığını kontrol etmek, `write` işleminden önceki son savunma hattıdır.
5.  **Provider-specific mapping layer:** Standartlaştırılmış veriyi, `domain processing`'e göndermeden önce provider'a özgü formatlardan arındırmak gerekir.
6.  **Async callback worker / processing queue:** BFF'in anında yanıt vermesini ve ağır işlemlerin (domain logic) arka planda güvenilir bir şekilde çalışmasını sağlar.
7.  **Domain owner command handoff:** İşlenmiş ve güvenilir verinin, ilgili `owner`'a (örn: `payment service`) `command` olarak iletilmesi.
8.  **Domain-specific state transition guards:** `Owner`'ın kendi içindeki state makinesinin, geçersiz geçişleri (örn: `PAID`'den `FAILED`'a) engellemesi.
9.  **Outbox/audit/event emission:** `Truth` (state) güncellendikten sonra, bu değişikliğin diğer sistemlere güvenilir bir şekilde bildirilmesi.
10. **Reconciliation/polling runtime:** Sadece callback'e bağımlı kalmayıp, belirsiz durumları proaktif olarak çözen mekanizma.
11. **Rate limit / abuse guard:** Sistemin genel sağlığını ve güvenliğini koruyan en dış katman.

## 7. İlk Kodlama Paketinin Ne Olması Gerektiği

- **A) Doğrudan payment callback processing**
  - **Artı:** En acil iş ihtiyacını (ödeme sonucunu işleme) karşılar.
  - **Risk:** Ortak guard'lar (imza, idempotency) olmadan yapılması çok risklidir. Her domain için ayrı altyapı kurulmasına yol açarak teknik borç yaratır.
  - **Neden önce/sonra:** **SONRA.** Önce ortak altyapı kurulmalıdır.
  - **Kabul kanıtı:** Ödeme callback'i sonrası `payment` state'inin güncellenmesi.

- **B) Ortak BFF callback ingestion boundary**
  - **Artı:** Tüm domain'ler için tekrar kullanılabilir, güvenli bir giriş kapısı oluşturur. İmza doğrulama ve temel idempotency gibi ortak guard'ları merkezileştirir.
  - **Risk:** Tek başına iş değeri üretmez, sadece veri alır. Domain'e özel mantık içermez.
  - **Neden önce/sonra:** **ÖNCE.** Diğer tüm adımların ön koşuludur.
  - **Kabul kanıtı:** Farklı domain'lerden gelen test callback'lerinin imzası doğrulanarak/reddedilerek `provider_callback_events` tablosuna doğru statüde kaydedilmesi.

- **C) Önce Postgres idempotency_key conflict remediation + callback Postgres smoke**
  - **Artı:** En temel katman olan persistence'daki bilinen bir riski (DB hatası ile uygulamanın çökmesi) en başta giderir. Altyapının sağlamlığını artırır.
  - **Risk:** Çok küçük bir adımdır, tek başına iş değeri veya tam bir ingestion altyapısı sunmaz.
  - **Neden önce/sonra:** **EN ÖNCE.** Production'a veri alacak bir tablonun, temel `INSERT` operasyonunda öngörülebilir şekilde davranması, diğer her şeyden daha temel bir ön koşuldur. Bu düzeltme olmadan B seçeneği bile risklidir.
  - **Kabul kanıtı:** `idempotency_key` ve `provider_event_id` ile mükerrer kayıt denemelerinin, `PERSISTENCE_MODE=postgres` ile çalışan bir smoke testte veritabanı hatası fırlatmadan, mevcut kaydı döndürdüğünün kanıtlanması.

**Net karar:**

İlk gerçek implementation **C seçeneği (Önce Postgres idempotency_key conflict remediation + callback Postgres smoke)** olmalıdır.

**Gerekçe:** `HARDENING-10A` foundation içindeki Postgres `idempotency_key` `ON CONFLICT` kuralının eksikliği, canlı ortama callback alınmaya başlandığı an, en temel `INSERT` sorgusunda dahi öngörülemeyen çökmelere yol açabilecek bir P2 seviyesinde risktir. Bu temel stabilite sorunu, üzerine herhangi bir `ingestion` veya `processing` mantığı inşa edilmeden önce kapatılmalıdır.

## 8. Önerilen HARDENING-10B Implementation Roadmap

- **10B1: Postgres Callback Persistence Remediation**
  - **Amaç:** `PostgresProviderCallbackEventRepository`'deki `idempotency_key` çakışma riskini gidermek ve bunu Postgres-spesifik bir smoke test ile kanıtlamak.
  - **Scope:** `packages/persistence/src/provider-callback.ts` dosyasındaki `insertProviderCallbackEvent` sorgusunu güncellemek. Yeni bir `smoke:provider-callback-postgres` script'i ve testi eklemek.
  - **Yasaklı alanlar:** BFF, domain logic, signature logic.
  - **Zorunlu kanıt:** `PERSISTENCE_MODE=postgres` ile `pnpm run smoke:provider-callback-postgres` komutunun, duplicate `idempotency_key` ve `provider_event_id` senaryolarında DB hatası vermeden başarıyla geçmesi.
  - **Kapanış kararı beklentisi:** `PASS`.

- **10B2: Common BFF Callback Ingestion Boundary**
  - **Amaç:** Gelen tüm provider callback'lerini alacak, imza doğrulamasını yapacak ve `provider_callback_events` tablosuna kaydedecek ortak, asenkron bir "BFF Ingestion Boundary" kurmak.
  - **Scope:** BFF'e genel bir `/callbacks/{provider}` endpoint'i eklemek. İmza doğrulama ve persistence mantığını içeren bir `CallbackWorker` (asenkron) oluşturmak.
  - **Yasaklı alanlar:** Domain-spesifik mantık.
  - **Zorunlu kanıt:** Sahte bir payment ve shipment callback'inin, geçerli/geçersiz imza ile `provider_callback_events` tablosuna doğru `verificationStatus` ile yazılması. BFF'in anında `202 Accepted` dönmesi.
  - **Kapanış kararı beklentisi:** `PASS`.

- **10B3: Basic Payment Callback Processing**
  - **Amaç:** Doğrulanmış `payment` callback'lerini işleyip `payment`'ın state'ini `SUCCEEDED` veya `FAILED` olarak güncellemek ve `outbox` event'i üretmek.
  - **Scope:** `CallbackWorker`'ı genişleterek `payment` domain'i için `MarkPaymentAs...` komutlarını tetiklemek. `order`'a dokunulmayacak.
  - **Yasaklı alanlar:** `order` create, `settlement` etkisi.
  - **Zorunlu kanıt:** Bir `payment` `INITIATED` yapıldıktan sonra, "succeeded" callback'i gönderildiğinde `payment`'ın state'inin `SUCCEEDED`'e geçtiğinin ve `payment.succeeded` outbox event'inin üretildiğinin doğrulanması.
  - **Kapanış kararı beklentisi:** `PASS`.

- **10B4: Basic Shipment Callback Processing**
  - **Amaç:** Doğrulanmış `shipment` callback'lerini işleyip, `shipment` state'ini `DELIVERED` yapmak ve `shipment.delivered` outbox event'ini üretmek.
  - **Scope:** `CallbackWorker`'ı genişleterek `shipment` domain'i için `TransitionShipmentToDelivered` komutunu tetiklemek.
  - **Yasaklı alanlar:** `eligibility` açma.
  - **Zorunlu kanıt:** "delivered" callback'i sonrası, ilgili `shipment`'ın `state`'inin `DELIVERED` olduğunu ve `outbox` tablosunda `shipment.delivered` event kaydının oluştuğunu doğrulamak.
  - **Kapanış kararı beklentisi:** `PASS`.

- **10B5: Eligibility Consumer for Delivered Event**
  - **Amaç:** `shipment.delivered` event'ini dinleyecek ve `review` ile `story` için `eligibility` kayıtlarını oluşturacak bir consumer oluşturmak.
  - **Scope:** Yeni bir asenkron consumer (worker) oluşturmak. `customer-contribution` (veya `review`/`story`) servislerini çağırarak hakları açmak.
  - **Yasaklı alanlar:** `notification` gönderme.
  - **Zorunlu kanıt:** Uçtan uca test: "delivered" callback'i sonrası, ilgili kullanıcı ve ürün için `review` yazma hakkının `ELIGIBLE` olduğunun doğrulanması.
  - **Kapanış kararı beklentisi:** `PASS`.

- **10B6: Reconciliation Runtime Foundation for Payment**
  - **Amaç:** `initiatePayment` sırasında `unknown_result` dönen veya hiç callback almayan `payment`'ları periyodik olarak provider'dan sorgulayan bir mekanizma kurmak.
  - **Scope:** Zamanlanmış bir görev (cron job/scheduled worker) oluşturmak. Provider API'ını sorgulayıp sonucu `10B3`'teki gibi işlemek.
  - **Yasaklı alanlar:** `shipment` veya `payout` reconciliation.
  - **Zorunlu kanıt:** `unknown_result` ile bir ödeme oluşturup, reconciliation job'ının bu ödemeyi bulup state'ini güncellediğini doğrulamak.
  - **Kapanış kararı beklentisi:** `PASS`.

- **10B7: Payout & Notification Callback Processing (Basic)**
  - **Amaç:** `payout` ve `notification` için temel `paid`/`failed` ve `delivered`/`failed` state güncellemelerini implemente etmek.
  - **Scope:** `CallbackWorker`'ı bu iki domain'in basit sonuçlarını işleyecek şekilde genişletmek.
  - **Yasaklı alanlar:** `finance-correction`, `risk signal`, `analytics` entegrasyonu.
  - **Zorunlu kanıt:** `payout` ve `notification` için test callback'leri sonrası ilgili `payoutItem` ve `deliveryAttempt` state'lerinin doğru güncellendiğinin kanıtlanması.
  - **Kapanış kararı beklentisi:** `PASS`.

## 9. Domain Processing’e Geçiş Kapısı

`Payment`, `shipment`, `notification` veya `payout` domain'lerinin callback'lerini işlemeye başlamadan önce aşağıdaki maddelerin **TÜMÜ** `DONE` olmalıdır:

- [x] BFF ingestion endpoint var (`10B2`)
- [x] Callback repository Postgres duplicate behavior test edilmiş (`10B1`)
- [x] Real signature verification var (`10B2`)
- [x] Replay/idempotency guard var (`10B2`)
- [x] Provider-specific mapping minimum bir provider için var (Her domain paketi kendi içinde sağlar)
- [x] Async worker / queue boundary var (`10B2`)
- [x] Owner command handoff pattern var (Her domain paketi kendi içinde sağlar)
- [x] Boundary smoke var (`10A5-R` ile `PASS`)
- [x] Postgres callback smoke var (`10B1`)
- [x] Audit/outbox davranışı net (Her domain paketi kendi içinde sağlar)
- [ ] Public webhook abuse guard planı var (Altyapı/DevOps konusu)

## 10. Açık Kalan Sorular

Bu sorular, `10B1` ve `10B2` paketlerinin kodlanmasını **bloklamaz**, ancak sonraki domain-spesifik paketlerde cevaplanması gerekecektir.

- **İlk provider hangisi olacak?**
  - Payment için `PayTR`, Shipment için `Aras Kargo` veya benzeri bir yerel sağlayıcı muhtemeldir.
- **Signature algoritması hangi provider için uygulanacak?**
  - Seçilen ilk provider'ın dokümanlarına göre (örn: `HMAC-SHA256`).
- **Public endpoint path standardı ne olacak?**
  - `/callbacks/provider/{providerName}` (örn: `/callbacks/provider/paytr`) iyi bir başlangıç olabilir.
- **Callback ack stratejisi 200 mü 202 mi?**
  - Asenkron işleme (worker) modeline göre `202 Accepted` en doğru yaklaşımdır.
- **Worker queue memory mi, outbox/polling mi?**
  - `Transactional outbox` ve `polling` en güvenilir modeldir. In-memory queue production için uygun değildir.
- **Provider-specific mapping dosya yapısı ne olacak?**
  - Her provider için bir `adapter` klasörü altında `mapper.ts` veya `transformer.ts` gibi bir dosya yapısı kurulabilir.
- **Reconciliation hangi domainle başlayacak?**
  - En yüksek finansal riski taşıdığı için `Payment` domain'i (`10B6`) ile başlamak en mantıklısıdır.

## 11. Nihai Karar

**CROSS-DOMAIN INVENTORY COMPLETE / IMPLEMENTATION ROADMAP REQUIRED**

**İlk kodlama paketi önerisi:** `HARDENING-10B1 — Postgres Callback Persistence Remediation`
