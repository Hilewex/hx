# ACTIVE_RISKS_AND_DECISIONS

## 1. Amaç

Bu dosya, Hedihup uygulama sürecinde aktif kalan riskleri, izlenen limitation’ları ve tekrar tartışılmaması gereken resmi kararları kısa ve izlenebilir biçimde tutar.

Bu dosyanın amacı:

- canlı riskleri tek yerde toplamak
- bilinçli bırakılan sınırlamaları görünür tutmak
- resmi mimari kararları kısa biçimde korumak
- yeni sohbete geçildiğinde “neden böyle ilerliyoruz?” sorusuna hızlı cevap vermek
- kapanmış eski kayıtları arşive yönlendirmektir

Net kural:

- Bu dosya ayrıntılı analiz raporu değildir.
- Bu dosya aktif risk ve karar defteridir.
- CLOSED eski kayıtlar aktif dosyada büyütülmez; arşive taşınır.
- Her aktif risk için izlenebilir bir aksiyon bulunmalıdır.

---

## 2. Arşiv referansı

P01–P41 arası detaylı risk, karar ve limitation geçmişi şu arşiv dosyasında tutulur:

- `65A-RISKS_AND_DECISIONS_ARCHIVE_P01_P41.md`

Bu aktif dosyada yalnız P42 ve sonrası için hâlâ geçerli olan kararlar, monitored riskler ve production-readiness borçları tutulur.

---

## 3. Kayıt formatı

Her kayıt şu alanları taşır:

- Kayıt Kodu
- Tür: `RISK` / `DECISION` / `LIMITATION`
- Başlık
- Durum: `ACTIVE` / `MONITORED` / `CLOSED`
- Kısa Açıklama
- Etkilediği Alan
- Gerekli Aksiyon
- Not

Net kural:

- `ACTIVE`: yürütme kararını doğrudan etkileyen kayıt
- `MONITORED`: kapanış engeli olmayan ama izlenmesi gereken limitation/risk
- `CLOSED`: yalnız yakın dönemde kapanmış ve aktif dosyada kısa süre tutulması gereken kayıt

---

## 4. Aktif temel kararlar

### ARD-001

**Tür:** DECISION  
**Başlık:** Ana yürütme dosyası 63’tür  
**Durum:** ACTIVE

**Kısa Açıklama:**  
Uygulama sürecinde tek resmi aktif durum kaynağı `63-IMPLEMENTATION_PROGRESS_MASTER.md` dosyasıdır.

**Etkilediği Alan:**  
Genel yürütme disiplini, paket takibi, yeni sohbet geçişleri

**Gerekli Aksiyon:**  
Her paket kapanışında 63 ve 64 güncellenecek. Yeni risk/karar/limitation varsa 65 güncellenecek.

**Not:**  
Plan belgeleri anayasal kaynak olarak kalır; aktif durum 63 içinde tutulur.

---

### ARD-002

**Tür:** DECISION  
**Başlık:** Paket bazlı ilerleme zorunludur  
**Durum:** ACTIVE

**Kısa Açıklama:**  
Kodlama kontrolsüz modül veya feature yayılımı şeklinde değil, paket bazlı yürütülecektir.

**Etkilediği Alan:**  
Kodlama yöntemi, Roo Code promptları, acceptance disiplini

**Gerekli Aksiyon:**  
Aktif paket dışına feature yayılımı yapılmayacak. Her paket için kapsam, referans seti, test/build kanıtı ve boundary review zorunludur.

**Not:**  
P42 ve sonrası da aynı paket disipliniyle yürütülecektir.

---

### ARD-003

**Tür:** DECISION  
**Başlık:** Owner boundary anayasal olarak sabittir  
**Durum:** ACTIVE

**Kısa Açıklama:**  
Aşağıdaki kararlar sabittir:

- owner dışı write yok
- BFF read-only / delegation
- UI truth üretmez
- panel direct write yapmaz
- projection truth değildir
- Redis owner truth değildir

**Etkilediği Alan:**  
Tüm servisler, BFF, web, panel, persistence, event/audit, provider entegrasyonları

**Gerekli Aksiyon:**  
Her paket kapanışında boundary review yapılacak.

**Not:**  
Bu kararlar yeniden tartışılmayacak; yalnız ihlal riski varsa kayda işlenecek.

---

### ARD-004

**Tür:** DECISION  
**Başlık:** Kritik lifecycle state ayrımları sabittir  
**Durum:** ACTIVE

**Kısa Açıklama:**  
Aşağıdaki ayrımlar korunur:

- approved ≠ active
- checkout ≠ payment
- payment captured / succeeded ≠ order_created
- delivered ≠ review/story written
- return_approved ≠ refund_completed
- refund_completed ≠ settlement_adjusted
- settled ≠ payable
- payable ≠ paid_out
- event emitted ≠ owner state mutated

**Etkilediği Alan:**  
Commerce, checkout, payment, order, shipment, return, refund, finance, payout, event/audit, eligibility

**Gerekli Aksiyon:**  
Transition-sensitive paketlerde state machine ve transition policy kontrolü yapılacak.

**Not:**  
Bu ayrımlar ihlal edilirse paket PASS kapanmaz.

---

### ARD-005

**Tür:** DECISION  
**Başlık:** Runtime/build/test kanıtı olmadan paket kapanmaz  
**Durum:** ACTIVE

**Kısa Açıklama:**  
Sadece “dosya oluşturuldu” veya “kod yazıldı” raporu paket kapanışı için yeterli değildir.

**Etkilediği Alan:**  
Tüm paket kapanışları

**Gerekli Aksiyon:**  
Her paket için en azından uygun kapsamda:

- source review
- boundary review
- `pnpm run typecheck`
- `pnpm run build`
- targeted smoke/test
- migration/schema/live runtime kanıtı, gerekiyorsa

aranacaktır.

**Not:**  
P33–P40 hattı bu standardı yükseltmiştir.

---

### ARD-006

**Tür:** DECISION  
**Başlık:** Public package boundary kullanılacak  
**Durum:** ACTIVE

**Kısa Açıklama:**  
Servisler birbirlerinin `src/*` iç dosyalarını relative path ile import etmeyecek. Cross-service kullanım public package export üzerinden yapılacak.

**Etkilediği Alan:**  
Workspace boundary, TypeScript project references, service-to-service access, tests/smoke scripts

**Gerekli Aksiyon:**  
Yeni paketlerde cross-service `src` import tespit edilirse paket kapanmadan düzeltilir.

**Not:**  
P21, P37-R ve diğer source review düzeltmeleri bu kararı güçlendirmiştir.

---

### ARD-007

**Tür:** DECISION  
**Başlık:** Event owner state mutation yerine geçmez  
**Durum:** ACTIVE

**Kısa Açıklama:**  
Event/outbox kayıtları owner truth write sonrası oluşur. Event, owner state mutation veya command execution yerine geçmez.

**Etkilediği Alan:**  
Event/outbox, audit, notification, analytics, downstream processing

**Gerekli Aksiyon:**  
Yeni event/audit paketlerinde “event geldi, state değişti” yaklaşımı kullanılmayacak. Önce owner truth yazılacak, sonra audit/event kaydı oluşacak.

**Not:**  
P38 foundation bu kararı kalıcı audit/outbox modeliyle başlatmıştır.

---

### ARD-008

**Tür:** DECISION  
**Başlık:** Auth, permission ve eligibility ayrı katmanlardır  
**Durum:** ACTIVE

**Kısa Açıklama:**  
Authentication, permission ve eligibility aynı karar değildir.

- Auth: aktör kim?
- Permission: bu aktör bu endpoint/action’a erişebilir mi?
- Eligibility: domain koşulları bu hakkı gerçekten açıyor mu?

**Etkilediği Alan:**  
Auth/access, review/UGC eligibility, risk/fraud, protected action, panel operations

**Gerekli Aksiyon:**  
P42 ve sonrası paketlerde access denied ile eligibility denied ayrımı korunacak.

**Not:**  
P39 ile review/UGC eligibility gerçek persisted veriye bağlanmıştır.

---

## 5. Teknik borç hattı kapanış kararları

### ARD-009

**Tür:** DECISION  
**Başlık:** P32–P40 teknik borç hattı foundation seviyesinde kapatıldı  
**Durum:** ACTIVE

**Kısa Açıklama:**  
P32 source audit ile açılan teknik borç kapatma hattı P33–P40 paketleriyle foundation seviyesinde kapatılmıştır.

Kapanan ana başlıklar:

- persistence foundation
- live DB validation
- cart/checkout persistence
- payment/order persistence
- shipment/return/refund persistence
- event/audit durability foundation
- review/UGC eligibility real-data hardening
- search/OpenSearch product indexing foundation

**Etkilediği Alan:**  
Genel roadmap, persistence, audit/event, eligibility, search, roadmap continuation

**Gerekli Aksiyon:**  
Normal roadmap’e kontrollü dönüş yapılacak. Production-readiness borçları ayrı monitored track olarak izlenecek.

**Not:**  
Bu karar production-ready anlamına gelmez; foundation-level closure anlamına gelir.

---

### ARD-010

**Tür:** DECISION  
**Başlık:** Normal roadmap’e kontrollü dönüş yapılacak  
**Durum:** ACTIVE

**Kısa Açıklama:**  
P41 re-alignment sonrası normal roadmap’e dönüş mümkündür. Sıradaki önerilen yön Risk / Fraud Foundation’dır.

**Etkilediği Alan:**  
Roadmap, paket sırası, P42 hazırlığı

**Gerekli Aksiyon:**  
P42 başlamadan önce 63/64/65 sadeleştirilmiş olmalı ve P42 referans seti açılmalıdır.

**Not:**  
Teknik borç hattı P42’ye geçişi engellemez; production-readiness borçları ayrı izlenecektir.

---

### ARD-011

**Tür:** DECISION  
**Başlık:** Risk / Fraud sistemi moderation veya finance sistemi değildir  
**Durum:** ACTIVE

**Kısa Açıklama:**  
P42 Risk / Fraud Foundation, cezalandırma veya doğrudan finansal mutabakat sistemi olarak ele alınmayacaktır. Risk/fraud alanı signal, flag, hold, review ve abuse protection foundation olarak başlatılacaktır.

**Etkilediği Alan:**  
Risk/fraud, moderation, finance, order/payment/refund, protected action, audit/event

**Gerekli Aksiyon:**  
P42’de risk sistemi:

- moderation karar motoru olmayacak
- payment/order/refund truth mutate etmeyecek
- finance truth üretmeyecek
- owner boundary dışı write yapmayacak
- audit-ready karar/sinyal üretecek

**Not:**  
Risk kararları ilgili owner servislerde guard/hold/review olarak uygulanmalıdır; risk sistemi tek başına tüm domain truth’u değiştirmez.

---

## 6. Aktif monitored limitations

### ARD-012

**Tür:** LIMITATION  
**Başlık:** Provider simulation debt devam ediyor  
**Durum:** MONITORED

**Kısa Açıklama:**  
P33–P40 teknik borç hattı persistence ve foundation borçlarını kapatmıştır; ancak gerçek provider entegrasyonları hâlâ yoktur veya simulation/foundation seviyesindedir.

Kapsam:

- payment provider
- carrier/kargo provider
- refund provider
- notification provider
- media storage/CDN provider

**Etkilediği Alan:**  
Payment, shipment, refund, notification, media, production-readiness

**Gerekli Aksiyon:**  
Provider entegrasyonları ileride sandbox/hardening veya production-readiness paketlerinde ele alınacak.

**Not:**  
Provider simulation borcu normal roadmap’e dönüşü engellemez; release readiness öncesi kapatılmalıdır.

---

### ARD-013

**Tür:** LIMITATION  
**Başlık:** Transactional outbox atomicity henüz yok  
**Durum:** MONITORED

**Kısa Açıklama:**  
P38 ile `audit_logs` ve `event_outbox` foundation kurulmuştur. Ancak audit/outbox append, owner write ile transactionally atomic değildir.

**Etkilediği Alan:**  
Audit, event, outbox, payment, order, moderation, consistency

**Gerekli Aksiyon:**  
İleride transactional outbox veya shared transaction boundary standardı değerlendirilecek.

**Not:**  
P38 kapanış engeli değildir; production-readiness için izlenmelidir.

---

### ARD-014

**Tür:** LIMITATION  
**Başlık:** Publisher / consumer sistemi yok  
**Durum:** MONITORED

**Kısa Açıklama:**  
P38 event/outbox foundation kurmuştur; ancak gerçek broker, publisher/consumer veya downstream event processing sistemi kurulmamıştır.

**Etkilediği Alan:**  
Event processing, notification, analytics, async workflows, operational automation

**Gerekli Aksiyon:**  
Event processing hattı ileride ayrı event hardening veya async processing paketinde tasarlanacak.

**Not:**  
Kafka/RabbitMQ veya broker kurulumu P38 kapsamında bilinçli olarak dışarıda bırakılmıştır.

---

### ARD-015

**Tür:** LIMITATION  
**Başlık:** Migration rollback/recovery foundation seviyesinde  
**Durum:** MONITORED

**Kısa Açıklama:**  
P34 ile migration runner idempotent çalışacak hale getirilmiştir; ancak transactional rollback, recovery, zero-downtime migration ve release-grade migration governance henüz foundation seviyesindedir.

**Etkilediği Alan:**  
Persistence, DB migration, release safety

**Gerekli Aksiyon:**  
İlerleyen persistence/release hardening paketlerinde migration rollback/recovery standardı güçlendirilecek.

**Not:**  
P34/P40 kapanışlarını engellemez.

---

### ARD-016

**Tür:** LIMITATION  
**Başlık:** Full BFF/API acceptance coverage eksikleri var  
**Durum:** MONITORED

**Kısa Açıklama:**  
P33–P40 hattında birçok doğrulama repository-level veya targeted smoke test seviyesinde yapılmıştır. Tüm kritik journey’ler için full BFF/API end-to-end acceptance coverage henüz tamamlanmış değildir.

**Etkilediği Alan:**  
Acceptance, release readiness, BFF/API, critical journeys

**Gerekli Aksiyon:**  
İleri acceptance closure veya release hardening paketinde full journey testleri güçlendirilecek.

**Not:**  
Foundation closure için engel değildir; production readiness için gereklidir.

---

### ARD-017

**Tür:** LIMITATION  
**Başlık:** Payment attempt lookup JSONB query üzerinden çalışıyor  
**Durum:** MONITORED

**Kısa Açıklama:**  
P36 kapsamında `getByPaymentAttemptId` PostgreSQL adapter’da JSONB query ile çalışmaktadır. Foundation için kabul edilmiştir; yüksek ölçekte dedicated indexed `payment_attempt_id` kolonu gerekebilir.

**Etkilediği Alan:**  
Payment persistence, performance, future payment provider integration

**Gerekli Aksiyon:**  
Payment provider sandbox veya payment hardening paketinde dedicated indexed `payment_attempt_id` kolonu değerlendirilecek.

**Not:**  
P36 kapanış engeli değildir.

---

### ARD-018

**Tür:** LIMITATION  
**Başlık:** Checkout snapshot foundation seviyesinde JSONB ağırlıklı  
**Durum:** MONITORED

**Kısa Açıklama:**  
P35 kapsamında checkout session persistence foundation seviyesinde JSONB snapshot yaklaşımıyla başlatılmıştır. İleri aşamada normalize model ihtiyacı tekrar değerlendirilecektir.

**Etkilediği Alan:**  
Checkout, payment/order handoff, persistence, reporting

**Gerekli Aksiyon:**  
Payment/order/provider hardening öncesi checkout snapshot alanlarının yeterliliği gözden geçirilecek.

**Not:**  
P35 kapanış engeli değildir.

---

### ARD-019

**Tür:** LIMITATION  
**Başlık:** In-memory smoke test service isolation sınırlı  
**Durum:** MONITORED

**Kısa Açıklama:**  
Bazı smoke testlerde in-memory mode, gerçek service isolation davranışını birebir temsil etmemektedir. Ana kabul kanıtı çoğu kritik pakette postgres mode üzerinden alınmıştır.

**Etkilediği Alan:**  
Testing, smoke tests, service isolation

**Gerekli Aksiyon:**  
İleride shared test fixture veya service mock standardı güçlendirilecek.

**Not:**  
Production davranışı için ana kanıt postgres mode testleridir.

---

### ARD-020

**Tür:** LIMITATION  
**Başlık:** P37 persistence smoke test BFF/API end-to-end değildir  
**Durum:** MONITORED

**Kısa Açıklama:**  
P37 smoke test shipment, cancel-return ve refund repository-level persistence davranışını doğrular. Tam BFF/API journey testi değildir.

**Etkilediği Alan:**  
Shipment, cancel-return, refund, acceptance testing

**Gerekli Aksiyon:**  
İleri acceptance paketlerinde BFF/API seviyesinde shipment-return-refund journey doğrulanacak.

**Not:**  
P37 kapanış engeli değildir.

---

### ARD-021

**Tür:** LIMITATION  
**Başlık:** Failed persisted order/payment negative fixture coverage sınırlı  
**Durum:** MONITORED

**Kısa Açıklama:**  
P39’da unsuccessful order/payment guard code-level olarak uygulanmıştır. Ancak mevcut order service failed order attempts persist etmediği için canlı smoke testte failed persisted order fixture coverage sınırlıdır.

**Etkilediği Alan:**  
Eligibility, order/payment persistence testing, review/UGC validation

**Gerekli Aksiyon:**  
Order/payment hardening veya negative fixture test paketinde failed persisted order/payment scenario coverage güçlendirilecek.

**Not:**  
P39 kapanış engeli değildir.

---

### ARD-022

**Tür:** LIMITATION  
**Başlık:** Story tray / viewer static projection olarak kalıyor  
**Durum:** MONITORED

**Kısa Açıklama:**  
P39 hardening user-product-story / UGC creation eligibility tarafına uygulanmıştır. Story tray/viewer service hâlâ static projection/foundation seviyesinde kalmaktadır.

**Etkilediği Alan:**  
Story surface, viewer, UGC projection, feed/display layers

**Gerekli Aksiyon:**  
Story/viewer hardening veya surface data paketinde gerçek projection ve source-of-truth ilişkisi ele alınacak.

**Not:**  
P39 kapanış engeli değildir.

---

### ARD-023

**Tür:** LIMITATION  
**Başlık:** Local OpenSearch credential/bootstrap uyumsuzluğu  
**Durum:** MONITORED

**Kısa Açıklama:**  
P40 canlı OpenSearch smoke sırasında local OpenSearch container HTTPS/self-signed cert bypass gerektirmiş ve container `admin:admin` credential kabul etmiştir. Compose password env ile çalışma credential’ı uyumlu değildir.

**Etkilediği Alan:**  
Search, OpenSearch local runtime, config/security

**Gerekli Aksiyon:**  
Search hardening veya local infra hardening paketinde OpenSearch bootstrap credential/env standardı hizalanacak.

**Not:**  
P40 kapanış engeli değildir; live smoke PASS alınmıştır.

---

### ARD-024

**Tür:** LIMITATION  
**Başlık:** Category/storefront search candidates foundation projection seviyesinde  
**Durum:** MONITORED

**Kısa Açıklama:**  
P40 product candidate retrieval için OpenSearch foundation kurmuştur. Category/storefront candidates ise hâlâ foundation projection seviyesindedir ve OpenSearch-indexed document değildir.

**Etkilediği Alan:**  
Search, category, storefront, PLP/search facets

**Gerekli Aksiyon:**  
İlerleyen search expansion paketinde category/storefront document indexing değerlendirilecek.

**Not:**  
P40 product indexing foundation kapsamını kapatır.

---

### ARD-025

**Tür:** LIMITATION  
**Başlık:** Public SearchResponse facet contract genişletilmedi  
**Durum:** MONITORED

**Kısa Açıklama:**  
P40’ta facet response shape OpenSearch client tarafında hazırlanmıştır; ancak public `SearchResponse` contract bu kapsamda genişletilmemiştir.

**Etkilediği Alan:**  
Search API, PLP/search UI, facets/filtering

**Gerekli Aksiyon:**  
Search/PLP contract hardening paketinde facet/filter contract resmi şekilde genişletilecek.

**Not:**  
P40 kapanış engeli değildir.

---

### ARD-026

**Tür:** LIMITATION  
**Başlık:** Web / Panel entrypoint’ler foundation seviyesinde izleniyor  
**Durum:** MONITORED

**Kısa Açıklama:**  
Web ve Panel entrypoint’leri daha önce foundation seviyesinde kurulmuştur. Gerçek framework/runtime entegrasyonu ve production UI yapısı ileri paketlerde evrilecektir.

**Etkilediği Alan:**  
Web, Panel, UI runtime, frontend architecture

**Gerekli Aksiyon:**  
Frontend framework veya panel hardening paketlerinde güncellenecek.

**Not:**  
Eski ARD-006’dan aktif izleme kaydı olarak sadeleştirilmiştir.

---

### ARD-027

**Tür:** LIMITATION  
**Başlık:** Observability stack production-grade değildir  
**Durum:** MONITORED

**Kısa Açıklama:**  
Local observability stack foundation seviyesinde kurulmuştur. Production-grade telemetry, dashboard, alerting ve SLO/SLA izleme henüz tamamlanmamıştır.

**Etkilediği Alan:**  
Observability, monitoring, release readiness, operations

**Gerekli Aksiyon:**  
Metrics/analytics/observability hardening paketlerinde ele alınacak.

**Not:**  
Production-readiness borcudur.

---

### ARD-028

**Tür:** LIMITATION  
**Başlık:** Notification provider ve realtime delivery eksikleri devam ediyor  
**Durum:** MONITORED

**Kısa Açıklama:**  
Notification foundation kurulmuş olsa da gerçek push/email/sms provider, realtime delivery, preference service ve provider delivery reconciliation henüz tamamlanmamıştır.

**Etkilediği Alan:**  
Notification, user communication, operational alerts, notification center

**Gerekli Aksiyon:**  
Notification provider/hardening paketlerinde ele alınacak.

**Not:**  
Provider simulation debt içinde ayrıca izlenir.

---

### ARD-029

**Tür:** LIMITATION  
**Başlık:** Media storage / CDN / video processing eksikleri devam ediyor  
**Durum:** MONITORED

**Kısa Açıklama:**  
Media/asset foundation kurulmuş olsa da gerçek object storage, CDN, upload pipeline, thumbnail/transcoding/video processing ve provider entegrasyonu tamamlanmamıştır.

**Etkilediği Alan:**  
Media, UGC, story, video, asset delivery, production readiness

**Gerekli Aksiyon:**  
Media infrastructure veya provider hardening paketinde ele alınacak.

**Not:**  
P39 eligibility hardening media upload pipeline üretmemiştir.

---

### ARD-030

**Tür:** LIMITATION  
**Başlık:** Analytics / metrics / dashboard hardening açık  
**Durum:** MONITORED

**Kısa Açıklama:**  
Core domain foundation ve persistence hattı güçlendirilmiş olsa da analytics pipeline, business metrics, operational dashboards ve monitoring standardı henüz production-grade değildir.

**Etkilediği Alan:**  
Analytics, metrics, observability, business reporting, operations

**Gerekli Aksiyon:**  
Metrics / Analytics Foundation veya observability hardening paketlerinde ele alınacak.

**Not:**  
P38 event/audit durability analytics pipeline değildir.

---

## 7. Yakın dönemde kapanan kayıtlar

Bu bölüm geçici olarak tutulur; bir sonraki arşiv temizlik turunda arşive taşınabilir.

### ARD-031

**Tür:** CLOSED  
**Başlık:** Postgres live DB not verified limitation kapandı  
**Durum:** CLOSED

**Kısa Açıklama:**  
P34 kapsamında local PostgreSQL runtime ayağa kaldırıldı, migration canlı DB’ye uygulandı, schema doğrulandı ve moderation postgres smoke test başarıyla geçti.

**Etkilediği Alan:**  
Persistence, local runtime, moderation

**Gerekli Aksiyon:**  
Kapandı. Sonraki persistence paketlerinde aynı migration + schema verification + smoke test standardı uygulanacak.

**Not:**  
P33 limitation P34 ile kapandı.

---

### ARD-032

**Tür:** CLOSED  
**Başlık:** Cross-service source import boundary ihlali kapatıldı  
**Durum:** CLOSED

**Kısa Açıklama:**  
P37 sırasında repo-wide typecheck/build, commerce smoke test ve checkout/commerce cross-service source import boundary problemi nedeniyle fail oldu. P37-R ile source import bağımlılığı kaldırıldı ve public package export kullanımına taşındı.

**Etkilediği Alan:**  
Commerce, checkout, workspace boundary, TypeScript project references

**Gerekli Aksiyon:**  
Kapandı. Yeni paketlerde service-to-service `src` import yapılmayacak.

**Not:**  
P37-R sonrası `pnpm run typecheck`, `pnpm run build` ve `p37:smoke` PASS.

---

### ARD-033

**Tür:** CLOSED  
**Başlık:** P32 request-body/manual delivered trust eligibility debt kapandı  
**Durum:** CLOSED

**Kısa Açıklama:**  
P39 kapsamında review/UGC eligibility request-body `deliveredConfirmed` veya manual snapshot yerine persisted checkout actor, order, payment, delivered shipment line, cancel-return ve refund truth üzerinden türetilir hale getirildi.

**Etkilediği Alan:**  
Review, UGC, verified purchase, eligibility

**Gerekli Aksiyon:**  
Kapandı. Yeni review/UGC akışlarında UI/BFF-provided eligibility snapshot truth kabul edilmeyecek.

**Not:**  
P39 ile foundation-level closure sağlandı.

---

### ARD-P42-001

**Tür:** LIMITATION  
**Başlık:** P42 Risk DB schema verification runtime’da çalıştırılamadı  
**Durum:** MONITORED

**Kısa Açıklama:**  
P42 — Risk / Fraud Foundation kapsamında risk migration dosyası oluşturuldu ve `verify-schema` risk tablolarını kontrol edecek şekilde güncellendi. Ancak lokal Postgres konteyneri ayakta olmadığı için migration/schema verification gerçek DB üzerinde çalıştırılamadı.

**Etkilediği Alan:**  
Risk persistence, migration doğrulaması, DB runtime readiness

**Gerekli Aksiyon:**  
Postgres local runtime ayağa alındığında aşağıdaki doğrulamalar çalıştırılmalı:

- migration run
- `packages/persistence/verify-schema.ts`
- risk tabloları ve index doğrulaması

**Not:**  
Bu limitation P42 kod/boundary kapanışını bloke etmez; ancak production-readiness öncesi kapatılmalıdır.

### ARD-P43-001

**Tür:** LIMITATION  
**Başlık:** P43 Order Ops happy-path smoke test senaryoları fixture/mock eksikliği nedeniyle doğrulanamadı  
**Durum:** MONITORED

**Kısa Açıklama:**  
P43 — Order Ops Foundation kapsamında OrderOps stateless read aggregation service olarak kuruldu. Typecheck, build, source review ve boundary review PASS. Ancak smoke test içinde bazı happy-path aggregation senaryoları fixture/mock altyapısı olmadığı için runtime olarak doğrulanamadı ve `SKIPPED / LIMITATION` olarak işaretlendi.

**Etkilediği Alan:**  
Order Ops acceptance, aggregation doğrulaması, runtime test kapsamı

**Doğrulanan Alanlar:**

- Eksik `orderId` için `ORDER_OPS_ORDER_ID_REQUIRED`
- Olmayan order için `ORDER_OPS_ORDER_NOT_FOUND`
- Mutation import yasağı
- Stateless read aggregation boundary
- DB persistence / migration açılmadığı
- Owner truth mutation yapılmadığı

**Eksik Kalan Runtime Senaryolar:**

- mevcut order + shipment yok → `CREATE_SHIPMENT_ADVISORY`
- `includeSupport=true` + actor bilgisi yok → `SUPPORT_ACTOR_CONTEXT_NOT_PROVIDED`
- active shipment/cancel/refund/support/risk durumlarından doğru `OrderOpsStatus` üretimi
- suggested action üretimi
- boundary flag’lerin runtime response içinde false kalması

**Gerekli Aksiyon:**  
İleride order-ops test fixture/mock injection standardı kurulunca yukarıdaki senaryolar ayrıca doğrulanmalıdır.

**Not:**  
Bu limitation P43 kod/boundary kapanışını bloke etmez; production-readiness öncesi test kapsamı güçlendirilmelidir.

### ARD-P44-001

**Tür:** LIMITATION  
**Başlık:** P44 Finance Correction DB migration/schema verification runtime’da çalıştırılamadı  
**Durum:** MONITORED

**Kısa Açıklama:**  
P44 — Finance Correction Foundation kapsamında finance correction migration dosyası oluşturuldu ve `packages/persistence/verify-schema.ts` finance correction tablolarını/index’lerini kontrol edecek şekilde güncellendi. Ancak ortamda aktif PostgreSQL bağlantısı olmadığı için migration/schema verification gerçek DB üzerinde çalıştırılamadı.

**Etkilediği Alan:**  
Finance correction persistence, migration doğrulaması, DB runtime readiness

**Doğrulanan Alanlar:**

- Finance correction contract oluşturuldu.
- Finance correction service oluşturuldu.
- Repository pattern kuruldu.
- In-memory ve Postgres adapter’ları eklendi.
- Migration dosyası oluşturuldu.
- `verify-schema` güncellendi.
- Typecheck PASS.
- Build PASS.
- Smoke test PASS.
- Source review PASS.
- Boundary review PASS.

**Eksik Kalan Runtime Senaryo:**

- `pnpm --filter @hx/persistence run migrate`
- `pnpm --filter @hx/persistence run verify-schema`
- Finance correction tabloları ve index’lerinin gerçek DB üzerinde doğrulanması

**Gerekli Aksiyon:**  
PostgreSQL local runtime ayağa alındığında aşağıdaki doğrulamalar çalıştırılmalıdır:

- migration run
- `packages/persistence/verify-schema.ts`
- `finance_corrections` tablo doğrulaması
- `finance_correction_idempotency` tablo doğrulaması
- finance correction index doğrulamaları

**Not:**  
Bu limitation P44 kod/boundary kapanışını bloke etmez; production-readiness öncesi kapatılmalıdır.


### ARD-P45-001

**Tür:** LIMITATION  
**Başlık:** P45 Settlement DB migration/schema verification runtime’da çalıştırılamadı  
**Durum:** MONITORED

**Kısa Açıklama:**  
P45 — Settlement Foundation kapsamında settlement migration dosyası oluşturuldu ve `packages/persistence/verify-schema.ts` settlement tablolarını/index’lerini kontrol edecek şekilde güncellendi. Ancak ortamda aktif PostgreSQL bağlantısı olmadığı için migration/schema verification gerçek DB üzerinde çalıştırılamadı.

**Etkilediği Alan:**  
Settlement persistence, migration doğrulaması, DB runtime readiness

**Doğrulanan Alanlar:**

- Settlement contract oluşturuldu.
- Settlement service oluşturuldu.
- Repository pattern kuruldu.
- In-memory ve Postgres adapter’ları eklendi.
- Migration dosyası oluşturuldu.
- `verify-schema` güncellendi.
- Typecheck PASS.
- Build PASS.
- Smoke test PASS.
- Source review PASS.
- Boundary review PASS.

**Eksik Kalan Runtime Senaryo:**

- `pnpm --filter @hx/persistence run migrate`
- `pnpm --filter @hx/persistence run verify-schema`
- `settlement_lines` tablo doğrulaması
- `settlement_idempotency` tablo doğrulaması
- settlement index’lerinin gerçek DB üzerinde doğrulanması

**Gerekli Aksiyon:**  
PostgreSQL local runtime ayağa alındığında aşağıdaki doğrulamalar çalıştırılmalıdır:

- migration run
- `packages/persistence/verify-schema.ts`
- `settlement_lines` tablo doğrulaması
- `settlement_idempotency` tablo doğrulaması
- settlement index doğrulamaları

**Not:**  
Bu limitation P45 kod/boundary kapanışını bloke etmez; production-readiness öncesi kapatılmalıdır.


### ARD-P46-001

**Tür:** LIMITATION  
**Başlık:** P46 Payout DB migration/schema verification runtime’da çalıştırılamadı  
**Durum:** MONITORED

**Kısa Açıklama:**  
P46 — Payout Foundation kapsamında payout migration dosyası oluşturuldu ve `packages/persistence/verify-schema.ts` payout tablolarını/index’lerini kontrol edecek şekilde güncellendi. Ancak ortamda aktif PostgreSQL bağlantısı olmadığı için migration/schema verification gerçek DB üzerinde çalıştırılamadı.

**Etkilediği Alan:**  
Payout persistence, migration doğrulaması, DB runtime readiness

**Doğrulanan Alanlar:**

- Payout contract oluşturuldu.
- Payout service oluşturuldu.
- Repository pattern kuruldu.
- In-memory ve Postgres adapter’ları eklendi.
- Migration dosyası oluşturuldu.
- `verify-schema` güncellendi.
- Typecheck PASS.
- Build PASS.
- Smoke test PASS.
- Source review PASS.
- Boundary review PASS.
- Provider payout yapılmadığı doğrulandı.
- Payment instruction oluşturulmadığı doğrulandı.

**Eksik Kalan Runtime Senaryo:**

- `pnpm --filter @hx/persistence run migrate`
- `pnpm --filter @hx/persistence run verify-schema`
- `payout_items` tablo doğrulaması
- `payout_batches` tablo doğrulaması
- `payout_idempotency` tablo doğrulaması
- payout index’lerinin gerçek DB üzerinde doğrulanması

**Gerekli Aksiyon:**  
PostgreSQL local runtime ayağa alındığında aşağıdaki doğrulamalar çalıştırılmalıdır:

- migration run
- `packages/persistence/verify-schema.ts`
- `payout_items` tablo doğrulaması
- `payout_batches` tablo doğrulaması
- `payout_idempotency` tablo doğrulaması
- payout index doğrulamaları

**Not:**  
Bu limitation P46 kod/boundary kapanışını bloke etmez; production-readiness öncesi kapatılmalıdır.


### ARD-P47-001

**Tür:** LIMITATION  
**Başlık:** P47 Notification DB migration/schema verification runtime’da çalıştırılamadı  
**Durum:** MONITORED

**Kısa Açıklama:**  
P47 — Notification Provider / Hardening kapsamında notification migration dosyası oluşturuldu ve `packages/persistence/verify-schema.ts` notification tablolarını/index’lerini kontrol edecek şekilde güncellendi. Ancak ortamda aktif PostgreSQL bağlantısı olmadığı için migration/schema verification gerçek DB üzerinde çalıştırılamadı.

**Etkilediği Alan:**  
Notification persistence, delivery attempt persistence, migration doğrulaması, DB runtime readiness

**Doğrulanan Alanlar:**

- Notification contract genişletildi.
- Notification repository pattern kuruldu.
- In-memory ve Postgres adapter’ları eklendi.
- Runtime repository selector `memory|postgres` standardına bağlandı.
- Migration dosyası oluşturuldu.
- `verify-schema` güncellendi.
- Email sandbox delivery attempt doğrulandı.
- Push provider parked davranışı doğrulandı.
- SMS provider gerçek entegrasyon olarak açılmadı.
- Typecheck PASS.
- Build PASS.
- Smoke test PASS.
- Source review PASS.
- Boundary review PASS.
- Public package boundary ihlali kapatıldı.
- Provider actual delivery flag’leri foundation seviyesinde false kaldı.

**Eksik Kalan Runtime Senaryo:**

- `pnpm --filter @hx/persistence run migrate`
- `pnpm --filter @hx/persistence run verify-schema`
- Notification tablolarının gerçek DB üzerinde doğrulanması
- Notification delivery attempt tablolarının gerçek DB üzerinde doğrulanması
- Notification idempotency tablosunun gerçek DB üzerinde doğrulanması
- Notification index’lerinin gerçek DB üzerinde doğrulanması

**Gerekli Aksiyon:**  
PostgreSQL local runtime ayağa alındığında aşağıdaki doğrulamalar çalıştırılmalıdır:

- migration run
- `packages/persistence/verify-schema.ts`
- notification tablo doğrulamaları
- notification delivery attempt tablo doğrulamaları
- notification idempotency tablo doğrulaması
- notification index doğrulamaları

**Not:**  
Bu limitation P47 kod/boundary kapanışını bloke etmez; production-readiness öncesi kapatılmalıdır.

### ARD-P48-001

**Tür:** LIMITATION  
**Başlık:** P48 Analytics DB migration/schema verification runtime’da çalıştırılamadı  
**Durum:** MONITORED

**Kısa Açıklama:**  
P48 — Metrics / Analytics Foundation kapsamında analytics migration dosyası oluşturuldu ve `packages/persistence/verify-schema.ts` analytics tablolarını/index’lerini kontrol edecek şekilde güncellendi. Ancak ortamda aktif PostgreSQL bağlantısı olmadığı için migration/schema verification gerçek DB üzerinde çalıştırılamadı.

**Etkilediği Alan:**  
Analytics persistence, metric snapshot persistence, dashboard seed persistence, migration doğrulaması, DB runtime readiness

**Doğrulanan Alanlar:**

- Analytics contract oluşturuldu.
- Analytics service oluşturuldu.
- Repository pattern kuruldu.
- In-memory ve Postgres adapter’ları eklendi.
- Runtime repository selector `memory|postgres` standardına bağlandı.
- Migration dosyası oluşturuldu.
- `verify-schema` güncellendi.
- Analytics event ingestion doğrulandı.
- Metric snapshot foundation doğrulandı.
- Dashboard seed foundation doğrulandı.
- Idempotency duplicate davranışı doğrulandı.
- Data quality guard davranışı doğrulandı.
- Derived rate guard davranışı doğrulandı.
- Typecheck PASS.
- Build PASS.
- Smoke test PASS.
- Source review PASS.
- Boundary review PASS.
- Public package boundary ihlali yok.
- Outbox topic standardı canonical event adlarıyla hizalandı.
- Boş catch blokları kaldırıldı.
- Audit/outbox warning propagation eklendi.

**Eksik Kalan Runtime Senaryo:**

- `pnpm --filter @hx/persistence run migrate`
- `pnpm --filter @hx/persistence run verify-schema`
- `analytics_events` tablosunun gerçek DB üzerinde doğrulanması
- `metric_snapshots` tablosunun gerçek DB üzerinde doğrulanması
- `dashboard_seeds` tablosunun gerçek DB üzerinde doğrulanması
- `analytics_idempotency` tablosunun gerçek DB üzerinde doğrulanması
- Analytics index’lerinin gerçek DB üzerinde doğrulanması

**Gerekli Aksiyon:**  
PostgreSQL local runtime ayağa alındığında aşağıdaki doğrulamalar çalıştırılmalıdır:

- migration run
- `packages/persistence/verify-schema.ts`
- analytics event tablo doğrulamaları
- metric snapshot tablo doğrulamaları
- dashboard seed tablo doğrulamaları
- analytics idempotency tablo doğrulaması
- analytics index doğrulamaları

**Not:**  
Bu limitation P48 kod/boundary kapanışını bloke etmez; production-readiness öncesi kapatılmalıdır.



# P49 — Active Risks / Decisions Update

## Karar: P49 PASS kabul edildi

### Karar Özeti
P49 — API / Contract / Error Response Hardening Foundation paketi, canonical API error contract ve BFF response envelope standardını P49 kapsamındaki route ailelerine uygulamıştır. Typecheck, build ve P49 smoke test PASS verdiği için paket PASS olarak kapatılmıştır.

### Bağlayıcı Mimari Karar
BFF response standardizasyonu yapılırken BFF’in truth owner olmadığı kuralı korunacaktır.

BFF’in rolü:
- request validation,
- canonical error mapping,
- response envelope,
- delegation.

BFF’in yapmayacağı işler:
- domain truth üretmek,
- owner state mutate etmek,
- repository veya DB erişimi yapmak,
- raw exception message kullanıcıya dökmek,
- UI/panel için yeni domain error truth icat etmek.

### Canonical Response Kararı
P49 kapsamındaki yeni/hardened BFF route’ları `{ status, body }` döner.

Success response:
```json
{
  "data": {}
}

Error response:

{
  "errors": [
    {
      "code": "CANONICAL_CODE",
      "message": "Safe message",
      "category": "validation"
    }
  ]
}
Error Handling Kararı
notFound() default category: transport
internalError() raw exception detayını response’a dökmez.
isNotFoundError() ile not-found ayrımı merkezi helper üzerinden yapılır.
Raw provider, SQL, stack veya exception message public response’a verilmez.
Açık Risk / Limitation

Risk ID: R-P49-LEGACY-RESPONSE-STANDARDIZATION
Durum: Açık
Açıklama: P42 öncesi legacy route’lar P49 kapsamına alınmadı. Bu route’larda eski result.body || result.data fallback veya non-envelope response davranışı kalabilir.
Etkisi: API response dili tüm sistemde henüz tam homojen değildir.
Risk Seviyesi: Medium
Mitigation: Ayrı bir “Legacy BFF Response Cleanup / Full API Envelope Alignment” paketi açılmalı.
P49 Kararına Etkisi: Yok. Kapsam dışı limitation olarak kabul edildi.

Kapanış Kararı

P49 için kalan blocker yoktur. Paket PASS olarak kapatılmıştır.


---

## 4. Yeni sohbete geçmeden eklenecek kısa bağlam notu

```md
Son kapanan paket: P49 — API / Contract / Error Response Hardening Foundation

Final karar: PASS

Önemli sonuç:
- Canonical API error contract oluşturuldu.
- BFF response helper oluşturuldu.
- P49 kapsamındaki handler’lar `{ status, body }` standardına çekildi.
- Raw error leakage temizlendi.
- Payout query param uyumu düzeltildi.
- Finance correction route ailesi bağlandı.
- Typecheck, build ve smoke:p49 PASS.

Açık limitation:
- P42 öncesi legacy route’lar hâlâ tam response envelope standardına taşınmadı.
- Bu alan ayrı cleanup/hardening paketi olarak ele alınmalı.




## 8. Production-readiness borç özeti

Aşağıdaki başlıklar normal roadmap’e dönüşü engellemez; ancak release readiness öncesi ayrıca ele alınmalıdır:

- gerçek payment provider entegrasyonu
- gerçek carrier/kargo provider entegrasyonu
- gerçek refund provider entegrasyonu
- notification provider entegrasyonu
- media storage/CDN/video processing entegrasyonu
- transactional outbox hardening
- publisher/consumer sistemi
- full BFF/API acceptance testleri
- migration rollback/recovery hardening
- OpenSearch credential/bootstrap hardening
- category/storefront indexing expansion
- analytics/metrics/dashboard hardening
- provider sandbox / production readiness validation
- frontend/panel runtime hardening

---

## 9. Güncelleme kuralı

Bu dosya aşağıdaki durumlarda güncellenir:

- yeni aktif risk oluştuğunda
- yeni mimari karar alındığında
- limitation bilinçli kabul edildiğinde
- risk kapandığında
- production-readiness borcu değiştiğinde
- roadmap yönü değiştiğinde

Net kural:

- Her paket kapanışında 65 yalnız yeni risk/karar/limitation varsa güncellenir.
- Paket kapanış detayları 64 içinde tutulur.
- Eski ve kapanmış riskler aktif dosyada büyütülmez; arşive taşınır.

### R-P49-LEGACY-RESPONSE-STANDARDIZATION

**Tür:** LIMITATION  
**Başlık:** Legacy BFF response standardization debt  
**Durum:** CLOSED

**Kısa Açıklama:**  
P49 kapsamında P42–P49 route aileleri canonical response standardına çekilmişti; ancak P42 öncesi legacy BFF route’larda `result.body || result.data`, `{ status, data }`, hardcoded `sendJson(200, result)` ve non-envelope response davranışları kalabileceği izlenen limitation olarak bırakılmıştı.

P50 — Error / Edge / Retry Hardening paketi ile bu limitation kapatılmıştır.

**Etkilediği Alan:**  
BFF response standardı, API envelope alignment, error hardening

**Kapatma Kanıtı:**
- `pnpm --filter @hx/bff run smoke:p50`: PASS
- `pnpm --filter @hx/bff run smoke:p49`: PASS
- `pnpm --filter @hx/bff run typecheck`: PASS
- `pnpm run typecheck`: PASS
- `pnpm run build`: PASS
- Source review: legacy fallback, `{ status, data }`, raw error leakage ve internal import kalıntısı bulunmadı.
- Boundary review: BFF truth owner davranışı göstermedi.

**Not:**  
Bu kayıt P50 ile kapatılmıştır. Aktif risk olarak izlenmeye devam etmeyecektir.

---

### ARD-P50-API-ENVELOPE-HARDENING

**Tür:** DECISION  
**Başlık:** BFF response envelope standardı canonical hale getirildi  
**Durum:** ACTIVE

**Kısa Açıklama:**  
P50 ile BFF katmanındaki legacy response davranışları temizlenmiş ve tüm handler dönüşleri `{ status, body }` standardına hizalanmıştır. Başarılı cevaplar `ApiSuccessEnvelope`, hata cevapları `ApiErrorEnvelope` yapısıyla dönmelidir.

**Etkilediği Alan:**  
BFF, API response standardı, error handling, source review, package boundary

**Gerekli Aksiyon:**  
P51 ve sonrası paketlerde yeni veya değişen BFF handler’lar aynı standardı korumalıdır:

- `result.body || result.data` fallback kullanılmayacak.
- `{ status, data }` dönülmeyecek.
- `sendJson(200, result)` ile handler status’u ezilmeyecek.
- Raw `error.message` response’a dökülmeyecek.
- Final 404 canonical error envelope üzerinden dönecek.
- BFF service internal `src` dosyalarını import etmeyecek.

**Not:**  
Bu karar P50 PASS kapanışıyla aktif standart haline gelmiştir.

---

### ARD-P51-ACCEPTANCE-CLOSURE

**Tür:** DECISION  
**Başlık:** P51 Acceptance Closure foundation seviyesinde tamamlandı  
**Durum:** ACTIVE

**Kısa Açıklama:**  
P51 ile P01–P50 hattı acceptance kapısından geçirilmiştir. Critical journey’ler, cross-cutting mimari kurallar, known limitation registry ve test kanıt olgunluğu değerlendirilmiştir.

P51 sonucu tam production acceptance değildir. Foundation-level acceptance closure olarak değerlendirilmiştir.

**Etkilediği Alan:**  
Acceptance closure, release candidate hazırlığı, P52 geçiş kararı

**Gerekli Aksiyon:**  
P52 — Release Candidate paketi conditional go ile açılacaktır. P52’de release-risk / monitored limitation seti yeniden sınıflandırılmalı ve final RC kapısı oluşturulmalıdır.

**Not:**  
P51 final kararı: PASS WITH LIMITATION.  
P52 geçiş önerisi: CONDITIONAL GO TO P52.

---

### ARD-P52-CONDITIONAL-GO

**Tür:** DECISION  
**Başlık:** P52 Release Candidate paketine conditional go ile geçilecek  
**Durum:** ACTIVE

**Kısa Açıklama:**  
P51 acceptance closure sonucunda P52’ye geçiş mimari olarak mümkün görülmüştür. Ancak bu geçiş production-ready ilanı değildir. P52, release candidate hazırlığı ve kalan limitation/risk setinin resmi kapıdan geçirilmesi amacıyla açılacaktır.

**Etkilediği Alan:**  
Release candidate, final readiness, production-readiness ayrımı

**Gerekli Aksiyon:**  
P52 açılırken şu ayrım korunacaktır:

- foundation-level release candidate
- production-readiness debt
- release-risk
- monitored limitation
- blocker

**Not:**  
P52’ye geçiş kararı: CONDITIONAL GO.  
Production-ready iddiası verilmeyecektir.

---

### R-P51-FOUNDATION-ACCEPTANCE-LIMITATION

**Tür:** LIMITATION  
**Başlık:** P51 acceptance closure foundation seviyesindedir  
**Durum:** MONITORED

**Kısa Açıklama:**  
P51 ile P01–P50 hattı acceptance seviyesinde değerlendirilmiştir; ancak bu değerlendirme tam production acceptance anlamına gelmez. Birçok journey foundation seviyesinde accepted veya accepted with limitation olarak sınıflandırılmıştır.

**Etkilediği Alan:**  
Acceptance closure, P52 release candidate hazırlığı

**Gerekli Aksiyon:**  
P52’de kalan release-risk ve monitored limitation seti net biçimde ayrılmalıdır. Full production readiness iddiası yalnız provider, outbox/consumer, migration recovery, monitoring/dashboard ve E2E acceptance borçları kapatıldıktan sonra değerlendirilebilir.

**Not:**  
P51 kapanışı: PASS WITH LIMITATION.

---

### R-P52-RELEASE-RISK-REGISTRY

**Tür:** RISK  
**Başlık:** P52 öncesi izlenecek release-risk seti  
**Durum:** ACTIVE

**Kısa Açıklama:**  
P51 acceptance closure sonrası P52’ye geçerken aşağıdaki alanlar release-risk veya monitored limitation olarak taşınacaktır.

**Etkilediği Alan:**  
Release candidate, provider readiness, acceptance coverage, operational hardening

**Gerekli Aksiyon:**  
P52 sırasında aşağıdaki her başlık `BLOCKER / RELEASE-RISK / MONITORED / CLOSED` olarak sınıflandırılmalıdır:

- full BFF/API E2E acceptance coverage
- gerçek payment provider entegrasyonu
- gerçek carrier/kargo provider entegrasyonu
- gerçek refund provider entegrasyonu
- payout provider readiness
- notification provider / realtime hardening
- transactional outbox hardening
- publisher / consumer sistemi
- migration rollback / recovery hardening
- OpenSearch credential / bootstrap hardening
- category/storefront indexing expansion
- analytics / metrics / dashboard maturity
- provider sandbox / production readiness validation
- frontend / panel runtime hardening

**Not:**  
Bu kayıt P52 açılışında ana risk registry olarak kullanılacaktır.

P51 — Acceptance Closure, PASS WITH LIMITATION olarak kapatıldı. P52 — Release Candidate paketine CONDITIONAL GO ile geçilebilir.

---

### ARD-P52-FOUNDATION-RC-ACCEPTED

**Tür:** DECISION  
**Başlık:** Foundation-level release candidate kabul edildi  
**Durum:** ACTIVE

**Kısa Açıklama:**  
P52 — Release Candidate paketi ile P01–P52 foundation coding roadmap kapatılmıştır. Sistem mimari foundation, paket kapanış disiplini, boundary koruması, API/BFF hardening, acceptance closure ve release-risk görünürlüğü açısından foundation-level release candidate seviyesine gelmiştir.

Bu karar production-ready ilanı değildir.

**Etkilediği Alan:**  
Release candidate, foundation roadmap closure, post-RC planning

**Gerekli Aksiyon:**  
P52 sonrası ayrı Production Readiness / Provider Hardening hattı açılmalıdır. Bu hatta provider entegrasyonları, full E2E acceptance, observability, deployment, secrets/config ve worker reliability konuları ayrı paketler halinde ele alınmalıdır.

**Not:**  
P52 final kararı: PASS WITH LIMITATION.  
RC Status: Foundation-level Release Candidate Accepted.  
Production Readiness: NOT CLAIMED.

---

### ARD-P52-PRODUCTION-READINESS-NOT-CLAIMED

**Tür:** DECISION  
**Başlık:** P52 production-ready ilanı değildir  
**Durum:** ACTIVE

**Kısa Açıklama:**  
P52 ile sistem foundation-level release candidate seviyesine gelmiştir; ancak production-ready olduğu iddia edilmemiştir. Gerçek production readiness için provider entegrasyonları, full E2E acceptance, deployment automation, secrets/config hardening, observability ve worker reliability gibi ayrı alanlar tamamlanmalıdır.

**Etkilediği Alan:**  
Release management, production readiness, stakeholder communication

**Gerekli Aksiyon:**  
P52 sonrası hiçbir raporda sistem “yayına hazır / production-ready” olarak sunulmamalıdır. Doğru ifade: foundation-level release candidate accepted.

**Not:**  
Release Candidate ≠ Production Ready.


---

### R-P52-PRODUCTION-READINESS-DEBT

**Tür:** RISK  
**Başlık:** P52 sonrası production-readiness borçları  
**Durum:** ACTIVE

**Kısa Açıklama:**  
P52 foundation-level RC kapanışı sonrası production-ready olmak için aşağıdaki alanlar ayrı hardening/provider-readiness hattında ele alınmalıdır.

**Etkilediği Alan:**  
Production readiness, deployment, provider integration, observability, operations

**Gerekli Aksiyon:**  
Aşağıdaki alanlar post-RC roadmap içinde `BLOCKER / RELEASE-RISK / MONITORED / CLOSED` mantığıyla yeniden paketlenmelidir:

- full E2E / T4 acceptance suite
- real payment provider integration
- real carrier / logistics provider integration
- real refund provider integration
- payout provider readiness
- notification provider / realtime delivery hardening
- transactional outbox atomicity + publisher/consumer maturity
- migration rollback / recovery / DB ops hardening
- OpenSearch production bootstrap / credential / index ops hardening
- observability dashboard / alert / incident runtime hardening
- production secrets / config / rotation / revocation hardening
- frontend / panel runtime hardening
- production deployment automation / CI-CD hardening

**Not:**  
Bu kayıt P52’yi bloke etmez; P52 sonrası production-readiness planının ana risk girdisidir.

---

### R-P52-RELEASE-RISK-REGISTRY

**Tür:** RISK  
**Başlık:** P52 release-risk sınıflandırması  
**Durum:** ACTIVE

**Kısa Açıklama:**  
P52 review sonucunda blocker tespit edilmemiştir; ancak aşağıdaki alanlar release-risk veya monitored limitation olarak sınıflandırılmıştır.

**Etkilediği Alan:**  
Release candidate, post-RC hardening, provider readiness

**Gerekli Aksiyon:**  
Aşağıdaki riskler post-RC dönemde ayrı paketlere bağlanmalıdır.

**RELEASE-RISK:**
- full BFF/API E2E acceptance coverage
- gerçek payment provider entegrasyonu
- gerçek carrier/kargo provider entegrasyonu
- gerçek refund provider entegrasyonu
- payout provider readiness
- notification provider / realtime hardening
- transactional outbox hardening
- publisher / consumer sistemi
- migration rollback / recovery hardening
- OpenSearch credential / bootstrap hardening
- analytics / metrics / dashboard maturity
- production secrets / config / rotation / revocation hardening
- production deployment automation / CI-CD hardening

**MONITORED:**
- `OBSERVABILITY_AND_RUNTIME_GUIDE.md` ayrı dosya olarak mevcut değil
- bazı acceptance alanları foundation seviyesinde
- coupon/campaign, reward, creator onboarding, supplier onboarding current foundation scope dışında
- exact cloud vendor / IaC / CI-CD syntax eksikleri
- frontend/panel runtime maturity

**CLOSED:**
- P49 legacy response limitation
- P50 active limitation yokluğu

**BLOCKER:**
- Tespit edilmedi.

**Not:**  
P52 final kararı PASS WITH LIMITATION olduğu için bu risk seti saklanmadan post-RC planlamaya taşınacaktır.

---

### ARD-P52-FOUNDATION-ROADMAP-CLOSED

**Tür:** DECISION  
**Başlık:** P01–P52 foundation coding roadmap tamamlandı  
**Durum:** ACTIVE

**Kısa Açıklama:**  
P01–P52 arası foundation coding roadmap tamamlanmıştır. P01–P31 foundation hattı, P32–P41 technical debt / roadmap re-alignment hattı, P42–P50 hardening / ops / finance / API hattı, P51 acceptance closure ve P52 release candidate review tamamlanmıştır.

**Etkilediği Alan:**  
Roadmap closure, yeni dönem planlama, post-RC production readiness

**Gerekli Aksiyon:**  
Yeni dönem ayrı başlıkla açılmalıdır:

Production Readiness / Provider Hardening Phase

Bu dönem için yeni roadmap ve paket sırası çıkarılmalıdır.

**Not:**  
Foundation roadmap tamamlandı. Production-ready olmak için ayrı hardening hattı gerekir.

P52 — Release Candidate, PASS WITH LIMITATION olarak kapatıldı. Foundation-level Release Candidate kabul edildi. Production-ready iddiası verilmedi. P01–P52 foundation coding roadmap tamamlandı; sıradaki dönem Production Readiness / Provider Hardening hattıdır.


*****************************************



- Legacy x-actor-id eski BFF route aileleri.
- Runtime moderation _idempotency table creation.
- Distributed rate limit eksikliği.
- Full fraud scoring / auto hold-block eksikliği.
- Provider sandbox eksikliği.
- Finance/payout/settlement abuse ileri paket borcu.
- Search event/outbox production consumer yok.
- OpenSearch production ops yok.
- Ranking/recommendation yok.
- Dynamic facets yok.
- Category/storefront indexed expansion yok.
- Pricing/stock/media real-time projection sync yok.
- Catalog/product write owner yok.
- Category taxonomy owner foundation seviyesinde.
- Stale generated dist artifact hygiene.