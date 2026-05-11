# 65 — ACTIVE_RISKS_AND_DECISIONS — CONSOLIDATED REFERENCE

## 1. Amaç

Bu dosya, Hedihup uygulama sürecinde aktif kalan riskleri, izlenen limitation’ları, resmi mimari kararları ve production-readiness borçlarını tek referans altında tutar.

Bu dosyanın amacı:

- canlı riskleri tek yerde toplamak
- bilinçli bırakılan sınırlamaları görünür tutmak
- resmi mimari kararları kısa biçimde korumak
- kapanmış eski kayıtları arşiv bölümünde saklamak
- yeni sohbete geçildiğinde “neden böyle ilerliyoruz?” sorusuna hızlı cevap vermek
- post-RC / production-readiness hattı için net risk girdisi sağlamaktır

Net kural:

- Bu dosya ayrıntılı teknik analiz raporu değildir.
- Bu dosya aktif risk, karar, limitation ve arşivlenmiş karar defteridir.
- Paket kapanış detayları ayrı closure kayıtlarında tutulur.
- Bu dosyada aktif kalan kararlar, monitored limitations, release-risk ve kapanmış kritik kayıtlar izlenir.
- Eski kayıtlar aktif dosyayı şişirmeyecek şekilde arşiv bölümünde gruplanır.
- Her aktif risk için izlenebilir aksiyon bulunmalıdır.

---

## 2. Kayıt formatı

Her kayıt şu alanları taşır:

- Kayıt Kodu
- Tür: `RISK` / `DECISION` / `LIMITATION`
- Başlık
- Durum: `ACTIVE` / `MONITORED` / `CLOSED`
- Kısa Açıklama
- Etkilediği Alan
- Gerekli Aksiyon
- Not

Durum anlamları:

- `ACTIVE`: yürütme kararını doğrudan etkileyen kayıt.
- `MONITORED`: kapanış engeli olmayan ama izlenmesi gereken limitation/risk.
- `CLOSED`: kapanmış, tekrar aktif risk olarak izlenmeyecek kayıt.

---

## 3. Ana aktif kararlar

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
- event owner state mutation yerine geçmez

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
Her paket için uygun kapsamda şu kanıtlar aranır:

- source review
- boundary review
- `pnpm run typecheck`
- `pnpm run build`
- targeted smoke/test
- migration/schema/live runtime kanıtı, gerekiyorsa

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
Access denied ile eligibility denied ayrımı korunacak.

**Not:**  
P39 ile review/UGC eligibility gerçek persisted veriye bağlanmıştır.

---

### ARD-009

**Tür:** DECISION  
**Başlık:** Protected action initiated ile executed aynı şey değildir  
**Durum:** ACTIVE

**Kısa Açıklama:**  
Protected action başlatılması, gerçek domain execution veya outcome oluştuğu anlamına gelmez.

**Etkilediği Alan:**  
Moderation, support, risk, finance, payout, admin override, supplier/creator management

**Gerekli Aksiyon:**  
Operasyon paketlerinde `accepted`, `pending`, `executed`, `failed` ayrımı korunacak.

**Not:**  
P07 kapanışında sabitlenmiştir.

---

### ARD-010

**Tür:** DECISION  
**Başlık:** BFF protected action gateway’dir, owner execution yapmaz  
**Durum:** ACTIVE

**Kısa Açıklama:**  
BFF protected action request’i validate edebilir, reason kontrolü yapabilir ve accepted/rejected sonucu dönebilir; ancak gerçek owner execution üstlenmez.

**Etkilediği Alan:**  
BFF, panel command flows, operasyon paketleri

**Gerekli Aksiyon:**  
BFF’e domain action side-effect veya owner execution logic sızdırılmayacak.

**Not:**  
P07 kapanışında sabitlenmiştir.

---

## 4. P32–P40 teknik borç hattı kararları

### ARD-011

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

### ARD-012

**Tür:** DECISION  
**Başlık:** Normal roadmap’e kontrollü dönüş yapılacak  
**Durum:** ACTIVE

**Kısa Açıklama:**  
P41 re-alignment sonrası normal roadmap’e dönüş mümkündür. P42 Risk / Fraud Foundation ile devam edilmiştir.

**Etkilediği Alan:**  
Roadmap, paket sırası, P42 hazırlığı

**Gerekli Aksiyon:**  
P42 ve sonrası için referans setleri açılarak paket bazlı ilerleme sürdürülecek.

**Not:**  
Teknik borç hattı P42’ye geçişi engellememiştir; production-readiness borçları ayrı izlenecektir.

---

### ARD-013

**Tür:** DECISION  
**Başlık:** Persistence foundation raw pg + repository pattern ile başlatıldı  
**Durum:** ACTIVE

**Kısa Açıklama:**  
P33 kapsamında ağır ORM kullanılmadan `@hx/persistence` package ve repository pattern ile ilk persistence foundation başlatıldı. Moderation pilot domain olarak seçildi.

**Etkilediği Alan:**  
Persistence, owner services, moderation, future DB-backed services

**Gerekli Aksiyon:**  
Sonraki persistence paketlerinde aynı repository boundary ve config standardı korunacak.

**Not:**  
P33 moderation pilot ile sınırlıdır; tüm servisler kalıcılaşmış sayılmaz.

---

### ARD-014

**Tür:** DECISION  
**Başlık:** Production’da sessiz in-memory fallback yapılmayacak  
**Durum:** ACTIVE

**Kısa Açıklama:**  
P33-R ile `PERSISTENCE_MODE` standardı getirildi. `postgres` modunda `DATABASE_URL` zorunludur. In-memory fallback yalnız local/foundation/test bağlamında açık tutulabilir.

**Etkilediği Alan:**  
Persistence, config, runtime safety

**Gerekli Aksiyon:**  
Yeni servis persistence paketlerinde mode/config davranışı açık şekilde uygulanacak.

**Not:**  
Redis veya memory owner truth yerine geçmez.

---

### ARD-015

**Tür:** DECISION  
**Başlık:** Cart ve Checkout persistence foundation tamamlandı  
**Durum:** ACTIVE

**Kısa Açıklama:**  
P35 kapsamında Cart ve Checkout state’leri repository-backed persistence modeline taşındı. Commerce owner boundary korunarak PostgreSQL adapter ve in-memory adapter ayrımı kuruldu.

**Etkilediği Alan:**  
Commerce, cart, checkout, persistence

**Gerekli Aksiyon:**  
Payment/order persistence paketlerinde cart ≠ reservation ve checkout ≠ payment/order ayrımı korunacak.

**Not:**  
P35 payment, order veya stock reservation kapsamına girmemiştir.

---

### ARD-016

**Tür:** DECISION  
**Başlık:** Event/audit durability foundation başlatıldı  
**Durum:** ACTIVE

**Kısa Açıklama:**  
P38 kapsamında `audit_logs` ve `event_outbox` tabloları ile kalıcı audit/event foundation başlatıldı. Pilot entegrasyon moderation, payment ve order servisleriyle sınırlı tutuldu.

**Etkilediği Alan:**  
Audit, event, persistence, moderation, payment, order

**Gerekli Aksiyon:**  
İlerleyen paketlerde publisher/consumer, broader service rollout ve transactional outbox hardening ayrıca ele alınacak.

**Not:**  
Event owner state mutation yerine geçmez; önce owner truth yazılır, sonra audit/event kaydı oluşur.

---

### ARD-017

**Tür:** DECISION  
**Başlık:** Review/UGC eligibility gerçek persisted veriden türetilecek  
**Durum:** ACTIVE

**Kısa Açıklama:**  
P39 kapsamında review, UGC/story ve verified-purchase eligibility kararları request-body snapshot veya manuel `deliveredConfirmed` alanı yerine persisted checkout actor, order, payment, delivered shipment line, cancel-return ve refund truth üzerinden türetilir hale getirildi.

**Etkilediği Alan:**  
Media, review, UGC/story, verified purchase, eligibility, commerce/shipment/refund read boundaries

**Gerekli Aksiyon:**  
Yeni review/story/UGC akışlarında UI/BFF-provided eligibility snapshot truth kabul edilmeyecek.

**Not:**  
Eligibility read-derived karardır; order/shipment/refund/payment truth mutate etmez.

---

### ARD-018

**Tür:** DECISION  
**Başlık:** Search product indexing OpenSearch foundation seviyesine geçti  
**Durum:** ACTIVE

**Kısa Açıklama:**  
P40 kapsamında search sistemi static/in-memory product candidate modelinden OpenSearch-backed product indexing ve candidate retrieval foundation seviyesine taşındı. Memory backend yalnız explicit foundation/degraded mode olarak tutuldu.

**Etkilediği Alan:**  
Search, product candidate retrieval, OpenSearch, BFF search projection

**Gerekli Aksiyon:**  
İlerleyen paketlerde category/storefront indexing, facet contract genişletmesi ve production search hardening ayrıca ele alınacak.

**Not:**  
P40 ranking/recommendation/personalization üretmez; yalnız search indexing/candidate foundation sağlar.

---

## 5. P42–P52 aktif kararları ve kapanışlar

### ARD-P42-001

**Tür:** DECISION  
**Başlık:** Risk / Fraud sistemi moderation veya finance sistemi değildir  
**Durum:** ACTIVE

**Kısa Açıklama:**  
P42 Risk / Fraud Foundation, cezalandırma veya doğrudan finansal mutabakat sistemi olarak ele alınmayacaktır. Risk/fraud alanı signal, flag, hold, review ve abuse protection foundation olarak başlatılmıştır.

**Etkilediği Alan:**  
Risk/fraud, moderation, finance, order/payment/refund, protected action, audit/event

**Gerekli Aksiyon:**  
Risk sistemi moderation karar motoru olmayacak, payment/order/refund truth mutate etmeyecek, finance truth üretmeyecek, owner boundary dışı write yapmayacak ve audit-ready karar/sinyal üretecek.

**Not:**  
Risk kararları ilgili owner servislerde guard/hold/review olarak uygulanmalıdır; risk sistemi tek başına tüm domain truth’u değiştirmez.

---

### ARD-P49-001

**Tür:** DECISION  
**Başlık:** P49 API / Contract / Error Response Hardening PASS kabul edildi  
**Durum:** CLOSED

**Kısa Açıklama:**  
P49 — API / Contract / Error Response Hardening Foundation paketi, canonical API error contract ve BFF response envelope standardını P49 kapsamındaki route ailelerine uygulamıştır. Typecheck, build ve P49 smoke test PASS verdiği için paket PASS olarak kapatılmıştır.

**Etkilediği Alan:**  
BFF, canonical API error, response envelope, finance correction routes, payout query uyumu

**Gerekli Aksiyon:**  
P49 kapsamındaki yeni/hardened BFF route’ları `{ status, body }` standardını koruyacaktır.

**Not:**  
P42 öncesi legacy response standardization debt P50 ile kapatılmıştır.

---

### ARD-P50-001

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

### ARD-P51-001

**Tür:** DECISION  
**Başlık:** P51 Acceptance Closure foundation seviyesinde tamamlandı  
**Durum:** ACTIVE

**Kısa Açıklama:**  
P51 ile P01–P50 hattı acceptance kapısından geçirilmiştir. Critical journey’ler, cross-cutting mimari kurallar, known limitation registry ve test kanıt olgunluğu değerlendirilmiştir. P51 sonucu tam production acceptance değildir; foundation-level acceptance closure olarak değerlendirilmiştir.

**Etkilediği Alan:**  
Acceptance closure, release candidate hazırlığı, P52 geçiş kararı

**Gerekli Aksiyon:**  
P52 — Release Candidate paketi conditional go ile açılacaktır. P52’de release-risk / monitored limitation seti yeniden sınıflandırılmalı ve final RC kapısı oluşturulmalıdır.

**Not:**  
P51 final kararı: PASS WITH LIMITATION.  
P52 geçiş önerisi: CONDITIONAL GO TO P52.

---

### ARD-P52-001

**Tür:** DECISION  
**Başlık:** P52 Release Candidate paketine conditional go ile geçildi  
**Durum:** CLOSED

**Kısa Açıklama:**  
P51 acceptance closure sonucunda P52’ye geçiş mimari olarak mümkün görülmüştür. Bu geçiş production-ready ilanı değildir. P52, release candidate hazırlığı ve kalan limitation/risk setinin resmi kapıdan geçirilmesi amacıyla açılmıştır.

**Etkilediği Alan:**  
Release candidate, final readiness, production-readiness ayrımı

**Gerekli Aksiyon:**  
P52 açılışında şu ayrımlar korunmuştur:

- foundation-level release candidate
- production-readiness debt
- release-risk
- monitored limitation
- blocker

**Not:**  
P52 final kararı PASS WITH LIMITATION olmuştur.

---

### ARD-P52-002

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

### ARD-P52-003

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

### ARD-P52-004

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

---

## 6. Aktif release-risk ve production-readiness kayıtları

### R-P52-001

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

### R-P52-002

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
P52 final kararı PASS WITH LIMITATION olduğu için bu risk seti post-RC planlamaya taşınacaktır.

---

### R-PR-001

**Tür:** RISK  
**Başlık:** Provider simulation debt devam ediyor  
**Durum:** ACTIVE

**Kısa Açıklama:**  
P33–P52 hattı foundation ve hardening borçlarını kapatmıştır; ancak gerçek provider entegrasyonları hâlâ yoktur veya simulation/foundation seviyesindedir.

Kapsam:

- payment provider
- carrier/kargo provider
- refund provider
- payout provider
- notification provider
- media storage/CDN provider

**Etkilediği Alan:**  
Payment, shipment, refund, payout, notification, media, production-readiness

**Gerekli Aksiyon:**  
Provider entegrasyonları sandbox/hardening veya production-readiness paketlerinde ele alınacak.

**Not:**  
Provider simulation borcu foundation-level RC’yi engellemez; release readiness öncesi kapatılmalıdır.

---

### R-PR-002

**Tür:** RISK  
**Başlık:** Legacy x-actor-id eski BFF route aileleri  
**Durum:** ACTIVE

**Kısa Açıklama:**  
Bazı eski BFF route ailelerinde legacy `x-actor-id` yaklaşımı kalabilir. Bu durum gerçek auth-to-actor mapping ve access-context enforcement olgunlaşmadan production readiness için risk oluşturur.

**Etkilediği Alan:**  
BFF, auth/access, actor ownership, protected actions

**Gerekli Aksiyon:**  
Post-RC auth/access hardening paketinde legacy actor header kullanımı taranmalı, güvenli context modeline taşınmalıdır.

**Not:**  
BFF actor truth üretmemelidir.

---

### R-PR-003

**Tür:** RISK  
**Başlık:** Runtime moderation idempotency table creation doğrulaması  
**Durum:** ACTIVE

**Kısa Açıklama:**  
Moderation idempotency tablolarının runtime ortamda eksiksiz oluştuğu ve migration/verify-schema ile güvenceye alındığı post-RC dönemde tekrar doğrulanmalıdır.

**Etkilediği Alan:**  
Moderation, persistence, idempotency, DB runtime

**Gerekli Aksiyon:**  
Production readiness DB validation paketinde moderation idempotency tabloları gerçek DB üzerinde doğrulanmalıdır.

**Not:**  
P34 moderation DB doğrulaması yapılmış olsa da post-RC global schema gate içinde tekrar ele alınmalıdır.

---

### R-PR-004

**Tür:** RISK  
**Başlık:** Distributed rate limit eksikliği  
**Durum:** ACTIVE

**Kısa Açıklama:**  
Mevcut rate/abuse guard’ların önemli bir kısmı process-local veya foundation seviyesindedir. Distributed rate limit standardı production seviyesinde tamamlanmamıştır.

**Etkilediği Alan:**  
BFF, provider callback, auth, risk/fraud, abuse protection

**Gerekli Aksiyon:**  
Distributed rate limit ve abuse protection hardening paketi açılmalıdır.

**Not:**  
Single-instance foundation davranışı production-scale güvenlik anlamına gelmez.

---

### R-PR-005

**Tür:** RISK  
**Başlık:** Full fraud scoring / auto hold-block eksikliği  
**Durum:** ACTIVE

**Kısa Açıklama:**  
Risk/Fraud foundation signal, flag, hold ve review yaklaşımıyla kurulmuştur; ancak tam fraud scoring, otomatik hold/block ve operasyonel karar motoru production seviyesinde değildir.

**Etkilediği Alan:**  
Risk/fraud, payment, order, refund, checkout, support

**Gerekli Aksiyon:**  
Risk scoring / fraud decision hardening paketi açılmalıdır. Owner boundary dışı mutation yapılmamalıdır.

**Not:**  
Risk sistemi moderation veya finance truth owner değildir.

---

### R-PR-006

**Tür:** RISK  
**Başlık:** Finance / payout / settlement abuse ileri paket borcu  
**Durum:** ACTIVE

**Kısa Açıklama:**  
Finance correction, settlement ve payout foundation kurulmuştur; ancak abuse detection, fraud-aware hold, payout block, dispute-linked finance guard ve provider settlement reconciliation ileri paket borcudur.

**Etkilediği Alan:**  
Finance, settlement, payout, refund, risk/fraud

**Gerekli Aksiyon:**  
Finance/payout/settlement abuse hardening paketi açılmalıdır.

**Not:**  
Settlement ≠ payable; payable ≠ paid_out ayrımı korunmalıdır.

---

### R-PR-007

**Tür:** RISK  
**Başlık:** Search event/outbox production consumer yok  
**Durum:** ACTIVE

**Kısa Açıklama:**  
Search/OpenSearch product indexing foundation kurulmuştur; ancak production event/outbox consumer hattı ve sürekli index sync mekanizması tamamlanmamıştır.

**Etkilediği Alan:**  
Search, OpenSearch, event/outbox, product indexing

**Gerekli Aksiyon:**  
Search indexing consumer / outbox integration hardening paketi açılmalıdır.

**Not:**  
OpenSearch index projection truth değildir.

---

### R-PR-008

**Tür:** RISK  
**Başlık:** OpenSearch production ops yok  
**Durum:** ACTIVE

**Kısa Açıklama:**  
OpenSearch local foundation doğrulanmıştır; ancak production cluster ops, credential bootstrap, index lifecycle, backup/restore, shard/replica tuning ve monitoring tamamlanmamıştır.

**Etkilediği Alan:**  
Search, OpenSearch, infra, production operations

**Gerekli Aksiyon:**  
OpenSearch production ops hardening paketi açılmalıdır.

**Not:**  
P40 local smoke PASS production ops anlamına gelmez.

---

### R-PR-009

**Tür:** RISK  
**Başlık:** Ranking / recommendation yok  
**Durum:** ACTIVE

**Kısa Açıklama:**  
Search M9 intent + candidate owner olarak kalmıştır. Final ranking, recommendation ve personalization M8 kapsamında henüz production seviyesinde kurulmamıştır.

**Etkilediği Alan:**  
Search, discover, PLP, home, storefront, ranking

**Gerekli Aksiyon:**  
M8 ranking/recommendation roadmap ayrı paketlenmelidir.

**Not:**  
Search candidate üretir; ranking üretmez.

---

### R-PR-010

**Tür:** RISK  
**Başlık:** Dynamic facets yok  
**Durum:** ACTIVE

**Kısa Açıklama:**  
Facet response shape foundation seviyesinde ele alınmış; public contract ve dynamic facet engine production seviyesinde tamamlanmamıştır.

**Etkilediği Alan:**  
Search, PLP, filters, category

**Gerekli Aksiyon:**  
Search/PLP facet contract ve dynamic facet hardening paketi açılmalıdır.

**Not:**  
P40 public `SearchResponse` facet contract genişletilmemiştir.

---

### R-PR-011

**Tür:** RISK  
**Başlık:** Category/storefront indexed expansion yok  
**Durum:** ACTIVE

**Kısa Açıklama:**  
P40 product candidate retrieval için OpenSearch foundation kurmuştur. Category/storefront candidates hâlâ foundation projection seviyesindedir.

**Etkilediği Alan:**  
Search, category, storefront, PLP/search facets

**Gerekli Aksiyon:**  
Category/storefront document indexing expansion paketi açılmalıdır.

**Not:**  
Product indexing foundation tamamdır; category/storefront indexing açık borçtur.

---

### R-PR-012

**Tür:** RISK  
**Başlık:** Pricing/stock/media real-time projection sync yok  
**Durum:** ACTIVE

**Kısa Açıklama:**  
Pricing, stock ve media projection’larının search/product/card/PDP yüzeylerine gerçek zamanlı veya event-driven sync’i production seviyesinde tamamlanmamıştır.

**Etkilediği Alan:**  
Product card, PDP, PLP, search, stock, pricing, media

**Gerekli Aksiyon:**  
Projection sync / event-driven read-model hardening paketi açılmalıdır.

**Not:**  
Projection truth değildir; owner domainlerden türetilmelidir.

---

### R-PR-013

**Tür:** RISK  
**Başlık:** Catalog/product write owner yok  
**Durum:** ACTIVE

**Kısa Açıklama:**  
Catalog/PDP read foundation kurulmuş olsa da product write owner, product lifecycle, admin/supplier product management ve canonical product persistence production seviyesinde tamamlanmamıştır.

**Etkilediği Alan:**  
Catalog, PDP, product management, supplier/creator surfaces

**Gerekli Aksiyon:**  
Catalog/product write owner foundation veya product management hardening paketi açılmalıdır.

**Not:**  
Read projection product truth yerine geçmez.

---

### R-PR-014

**Tür:** RISK  
**Başlık:** Category taxonomy owner foundation seviyesinde  
**Durum:** ACTIVE

**Kısa Açıklama:**  
Category/PLP foundation static projection seviyesindedir. Gerçek taxonomy owner, category lifecycle, facet taxonomy ve governance production seviyesinde değildir.

**Etkilediği Alan:**  
Category, PLP, taxonomy, search facets

**Gerekli Aksiyon:**  
Taxonomy owner / category management hardening paketi açılmalıdır.

**Not:**  
Static projection taxonomy truth değildir.

---

### R-PR-015

**Tür:** RISK  
**Başlık:** Stale generated dist artifact hygiene  
**Durum:** ACTIVE

**Kısa Açıklama:**  
Generated `dist` artifact’ları veya stale build çıktıları source review ve boundary review sırasında yanlış pozitif/negatif üretebilir.

**Etkilediği Alan:**  
Repo hygiene, source review, build artifacts, CI

**Gerekli Aksiyon:**  
Dist artifact hygiene ve clean build standardı CI/CD hardening içinde ele alınmalıdır.

**Not:**  
Kaynak doğrulamalarında `src` ile generated artifacts ayrımı korunmalıdır.

---

## 7. Monitored limitations

### L-001

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

### L-002

**Tür:** LIMITATION  
**Başlık:** Publisher / consumer sistemi yok  
**Durum:** MONITORED

**Kısa Açıklama:**  
P38 event/outbox foundation kurmuştur; ancak gerçek broker, publisher/consumer veya downstream event processing sistemi kurulmamıştır.

**Etkilediği Alan:**  
Event processing, notification, analytics, async workflows, operational automation

**Gerekli Aksiyon:**  
Event processing hattı ayrı event hardening veya async processing paketinde tasarlanacak.

**Not:**  
Kafka/RabbitMQ veya broker kurulumu P38 kapsamında bilinçli olarak dışarıda bırakılmıştır.

---

### L-003

**Tür:** LIMITATION  
**Başlık:** Migration rollback/recovery foundation seviyesinde  
**Durum:** MONITORED

**Kısa Açıklama:**  
P34 ile migration runner idempotent çalışacak hale getirilmiştir; ancak transactional rollback, recovery, zero-downtime migration ve release-grade migration governance henüz foundation seviyesindedir.

**Etkilediği Alan:**  
Persistence, DB migration, release safety

**Gerekli Aksiyon:**  
Persistence/release hardening paketlerinde migration rollback/recovery standardı güçlendirilecek.

**Not:**  
P34/P40 kapanışlarını engellemez.

---

### L-004

**Tür:** LIMITATION  
**Başlık:** Full BFF/API acceptance coverage eksikleri var  
**Durum:** MONITORED

**Kısa Açıklama:**  
P33–P52 hattında birçok doğrulama repository-level veya targeted smoke test seviyesinde yapılmıştır. Tüm kritik journey’ler için full BFF/API end-to-end acceptance coverage henüz tamamlanmış değildir.

**Etkilediği Alan:**  
Acceptance, release readiness, BFF/API, critical journeys

**Gerekli Aksiyon:**  
Acceptance closure veya release hardening paketinde full journey testleri güçlendirilecek.

**Not:**  
Foundation closure için engel değildir; production readiness için gereklidir.

---

### L-005

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

### L-006

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

### L-007

**Tür:** LIMITATION  
**Başlık:** In-memory smoke test service isolation sınırlı  
**Durum:** MONITORED

**Kısa Açıklama:**  
Bazı smoke testlerde in-memory mode, gerçek service isolation davranışını birebir temsil etmemektedir. Ana kabul kanıtı çoğu kritik pakette postgres mode üzerinden alınmıştır.

**Etkilediği Alan:**  
Testing, smoke tests, service isolation

**Gerekli Aksiyon:**  
Shared test fixture veya service mock standardı güçlendirilecek.

**Not:**  
Production davranışı için ana kanıt postgres mode testleridir.

---

### L-008

**Tür:** LIMITATION  
**Başlık:** P37 persistence smoke test BFF/API end-to-end değildir  
**Durum:** MONITORED

**Kısa Açıklama:**  
P37 smoke test shipment, cancel-return ve refund repository-level persistence davranışını doğrular. Tam BFF/API journey testi değildir.

**Etkilediği Alan:**  
Shipment, cancel-return, refund, acceptance testing

**Gerekli Aksiyon:**  
Acceptance paketlerinde BFF/API seviyesinde shipment-return-refund journey doğrulanacak.

**Not:**  
P37 kapanış engeli değildir.

---

### L-009

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

### L-010

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

### L-011

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

### L-012

**Tür:** LIMITATION  
**Başlık:** Category/storefront search candidates foundation projection seviyesinde  
**Durum:** MONITORED

**Kısa Açıklama:**  
P40 product candidate retrieval için OpenSearch foundation kurmuştur. Category/storefront candidates ise hâlâ foundation projection seviyesindedir ve OpenSearch-indexed document değildir.

**Etkilediği Alan:**  
Search, category, storefront, PLP/search facets

**Gerekli Aksiyon:**  
Search expansion paketinde category/storefront document indexing değerlendirilecek.

**Not:**  
P40 product indexing foundation kapsamını kapatır.

---

### L-013

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

### L-014

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

### L-015

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

### L-016

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

### L-017

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

### L-018

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

### L-019

**Tür:** LIMITATION  
**Başlık:** P51 acceptance closure foundation seviyesindedir  
**Durum:** MONITORED

**Kısa Açıklama:**  
P51 ile P01–P50 hattı acceptance seviyesinde değerlendirilmiştir; ancak bu değerlendirme tam production acceptance anlamına gelmez. Birçok journey foundation seviyesinde accepted veya accepted with limitation olarak sınıflandırılmıştır.

**Etkilediği Alan:**  
Acceptance closure, P52 release candidate hazırlığı

**Gerekli Aksiyon:**  
P52 sonrası kalan release-risk ve monitored limitation seti net biçimde ayrı paketlere bağlanmalıdır. Full production readiness iddiası yalnız provider, outbox/consumer, migration recovery, monitoring/dashboard ve E2E acceptance borçları kapatıldıktan sonra değerlendirilebilir.

**Not:**  
P51 kapanışı: PASS WITH LIMITATION.

---

## 8. P42–P48 runtime doğrulama limitations

### L-P42-001

**Tür:** LIMITATION  
**Başlık:** P42 Risk DB schema verification runtime’da çalıştırılamadı  
**Durum:** MONITORED

**Kısa Açıklama:**  
P42 — Risk / Fraud Foundation kapsamında risk migration dosyası oluşturuldu ve `verify-schema` risk tablolarını kontrol edecek şekilde güncellendi. Ancak lokal Postgres konteyneri ayakta olmadığı için migration/schema verification gerçek DB üzerinde çalıştırılamadı.

**Etkilediği Alan:**  
Risk persistence, migration doğrulaması, DB runtime readiness

**Gerekli Aksiyon:**  
Postgres local runtime ayağa alındığında migration run, `packages/persistence/verify-schema.ts`, risk tabloları ve index doğrulaması çalıştırılmalı.

**Not:**  
Bu limitation P42 kod/boundary kapanışını bloke etmez; production-readiness öncesi kapatılmalıdır.

---

### L-P43-001

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
Order-ops test fixture/mock injection standardı kurulunca yukarıdaki senaryolar ayrıca doğrulanmalıdır.

**Not:**  
Bu limitation P43 kod/boundary kapanışını bloke etmez; production-readiness öncesi test kapsamı güçlendirilmelidir.

---

### L-P44-001

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
- `finance_corrections` tablo doğrulaması
- `finance_correction_idempotency` tablo doğrulaması
- finance correction index doğrulamaları

**Gerekli Aksiyon:**  
PostgreSQL local runtime ayağa alındığında migration, schema verification ve finance correction tablo/index doğrulamaları çalıştırılmalıdır.

**Not:**  
Bu limitation P44 kod/boundary kapanışını bloke etmez; production-readiness öncesi kapatılmalıdır.

---

### L-P45-001

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
PostgreSQL local runtime ayağa alındığında migration, schema verification ve settlement tablo/index doğrulamaları çalıştırılmalıdır.

**Not:**  
Bu limitation P45 kod/boundary kapanışını bloke etmez; production-readiness öncesi kapatılmalıdır.

---

### L-P46-001

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
PostgreSQL local runtime ayağa alındığında migration, schema verification ve payout tablo/index doğrulamaları çalıştırılmalıdır.

**Not:**  
Bu limitation P46 kod/boundary kapanışını bloke etmez; production-readiness öncesi kapatılmalıdır.

---

### L-P47-001

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
- notification tablo doğrulamaları
- notification delivery attempt tablo doğrulamaları
- notification idempotency tablosu doğrulaması
- notification index doğrulamaları

**Gerekli Aksiyon:**  
PostgreSQL local runtime ayağa alındığında notification migration/schema verification çalıştırılmalıdır.

**Not:**  
Bu limitation P47 kod/boundary kapanışını bloke etmez; production-readiness öncesi kapatılmalıdır.

---

### L-P48-001

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
- analytics index doğrulamaları

**Gerekli Aksiyon:**  
PostgreSQL local runtime ayağa alındığında analytics migration/schema verification çalıştırılmalıdır.

**Not:**  
Bu limitation P48 kod/boundary kapanışını bloke etmez; production-readiness öncesi kapatılmalıdır.

---

## 9. Yakın dönemde kapanan kayıtlar

### C-001

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

### C-002

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

### C-003

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

### C-004

**Tür:** CLOSED  
**Başlık:** P49 legacy response standardization debt kapandı  
**Durum:** CLOSED

**Kısa Açıklama:**  
P49 kapsamında P42–P49 route aileleri canonical response standardına çekilmişti; ancak P42 öncesi legacy BFF route’larda `result.body || result.data`, `{ status, data }`, hardcoded `sendJson(200, result)` ve non-envelope response davranışları kalabileceği izlenen limitation olarak bırakılmıştı. P50 — Error / Edge / Retry Hardening paketi ile bu limitation kapatılmıştır.

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

## 10. Arşiv — P01–P31 foundation kararları ve limitations

Bu bölüm, ilk dosyada yer alan eski kayıtların tekrarını azaltılmış ve tekilleştirilmiş arşividir. Aktif yürütme P42+ ve post-RC kayıtları üzerinden yapılır; ancak aşağıdaki kararlar mimari referans olarak korunur.

### A-P01-P07 — Foundation, auth, access, protected action

- `planlama/` klasörünün kalıcı standardı bir dönem açık riskti. Uzun vadede docs/plan standardı değerlendirmesi gerektirebilir.
- Web ve Panel entrypoint’ler framework öncesi foundation seviyesinde kuruldu; gerçek Next.js / Vite / production UI runtime ileride evrilecek.
- Observability stack local foundation seviyesinde kuruldu; production-grade dashboard/alert/SLO değildir.
- Shared-kernel büyüme riski izlenmelidir; business logic/shared orchestration yığılmamalıdır.
- Config package decision-engine’e dönüşmemelidir; parse/schema/validation sınırında kalmalıdır.
- Auth/session foundation gerçek session persistence ve provider entegrasyonu olmadan foundation seviyesinde kurulmuştur.
- Access foundation role/scope seviyesindedir; ownership ve ileri policy kararları ileride eklenecektir.
- Protected action audit/event persistence ilk foundation dışında bırakılmıştır; metadata shape kurulmuştur.
- Auth ile permission ayrımı sabittir.
- Permission ile eligibility ayrımı sabittir.
- Protected action initiated ile executed aynı şey değildir.
- BFF protected action gateway’dir; owner execution yapmaz.
- Runtime/build/test kanıtı olmadan paket kapanmaz.

---

### A-P13-P18 — Payment, order, shipment, cancel/return, refund

- P13 Payment Initiation başlangıçta checkout total doğrulamasına bağlı değildi; P14 ile kapatıldı. Payment amount/currency checkout summary’den türetilecek, client body’den alınmayacaktır.
- Payment contract içinde `amount` / `currency` opsiyonel alanları cleanup/deprecation beklemiştir; davranışsal risk kapalıdır.
- Order persistence P15’te in-memory foundation seviyesindeydi.
- P15 sonrası shipment/delivery P16’ya bırakılmıştır.
- Order service payment dependency public package boundary üzerinden kullanılacaktır.
- Shipment persistence P16’da in-memory foundation seviyesindeydi.
- Gerçek carrier integration P16 kapsamı dışında kalmıştır.
- Delivered eligibility mutation P16’da yapılmamıştır.
- Shipment service order dependency public package boundary üzerinden kullanılacaktır.
- Shipment state order state’ten ayrı tutulur.
- P16 sonrası Cancel / Return P17’ye bırakılmıştır.
- Cancel-return persistence P17’de in-memory / `globalThis` seviyesindeydi.
- Refund execution P18’e bırakılmıştır.
- Post-delivery entitlement mutation P17’de yapılmamıştır.
- Cancel ve return type bazlı ayrı lifecycle olarak yönetilecektir.
- Aktif cancel varken return request açılmayacaktır.
- Cancel-return service order ve shipment dependency public package boundary üzerinden kullanılacaktır.
- P17 sonrası Refund Foundation P18’e bırakılmıştır.
- P17 temporary verification script kaldırılmıştır.
- Refund persistence P18’de in-memory / `globalThis` seviyesindeydi.
- Gerçek provider refund entegrasyonu P18’de yoktu.
- Refund source payment reference eksikliği reconciliation gerektiriyordu.
- Refund amount source henüz yoktu; fake amount üretilmemiştir.
- Refund ayrı lifecycle olarak yönetilecek, payment state içine eritilmeyecektir.
- Refund duplicate guard iki katmanlı uygulanacaktır: `cancelReturnRequestId` ve `idempotencyKey`.
- Settlement ve payout mutation P18 kapsamında yapılmayacaktır.
- P18 sonrası Notification Foundation P19’a bırakılmıştır.

---

### A-P19-P20 — Notification ve Support

- Notification persistence P19’da in-memory / `globalThis` seviyesindeydi.
- Gerçek push/email/sms provider entegrasyonu P19’da yoktu.
- Notification preference service P19’da yoktu.
- Event bus ve audit storage notification foundation dışında bırakıldı.
- Realtime notification delivery yoktu.
- Notification truth owner notification service olacaktır.
- Mandatory ve critical bildirimler preference ile kapatılamaz.
- Social/digest bildirimler gürültü kontrolüyle ayrı taşınacaktır.
- P19 sonrası Support / Ticket Foundation P20’ye bırakıldı.
- P18/P19 temporary verification scriptleri kaldırıldı.
- Support ticket persistence P20’de in-memory / `globalThis` seviyesindeydi.
- Gerçek live chat ve agent assignment yoktu.
- SLA, audit ve event bus support foundation dışında bırakıldı.
- Support attachment upload yoktu.
- Support sistemi sosyal mesajlaşma değildir.
- Support ticket truth owner support service olacaktır.
- Moderation support değildir; support yalnız escalation metadata taşıyabilir.
- Support priority ve escalation target service içinde hesaplanacaktır.
- P20 sonrası Post / UGC Foundation P21’e bırakıldı.

---

### A-P21-P24 — Post/UGC, Review/Rating, Q&A, Interaction

- Post / UGC content persistence P21’de in-memory / `globalThis` seviyesindeydi.
- Gerçek media upload/storage ve video processing P21’de yoktu.
- Moderation decision engine P21 kapsamı dışında kaldı.
- Follow relationship verification yapılmıyordu.
- UGC order/shipment eligibility verification yapılmıyordu.
- Interaction truth P21 kapsamında üretilmedi.
- Media service Post / UGC content truth owner olacaktır.
- Store post story/support/Q&A/comment thread değildir.
- User product UGC creator post değildir ve return sonrası otomatik silinmez.
- BFF media service’e public package boundary üzerinden erişecektir.
- P21 sonrası Review / Rating Foundation P22’ye bırakıldı.
- Review/rating persistence P22’de in-memory / `globalThis.__reviewStore` seviyesindeydi.
- Gerçek order/shipment eligibility verification P22’de yoktu.
- Review return impact gerçek event entegrasyonuna bağlı değildi.
- Rating projection/cache yoktu.
- Review moderation engine ve admin panel yoktu.
- Görselli/videolu review ve reply thread yoktu.
- Gerçek auth-to-actor mapping P22 kapsamı dışındaydı.
- Review/rating truth owner media service olacaktır.
- Review UGC/story/post/Q&A/support değildir.
- Rating yalnız approved/visible/active impact yorumlardan hesaplanacaktır.
- İade sonrası review silinmez, rating/verified etkisi kaldırılır.
- P22 sonrası Q&A Foundation P23’e bırakıldı.
- Q&A persistence P23’te in-memory / `globalThis.__qaStore` seviyesindeydi.
- Gerçek supplier/auth answer authorization enforcement yoktu.
- Q&A moderation engine ve admin panel yoktu.
- PDP aggregator Q&A entegrasyonu yoktu.
- Helpful/vote interaction truth P23 kapsamında yoktu.
- Q&A truth owner media service olacaktır.
- Q&A review/rating/UGC/post/support/social thread değildir.
- Customer answer yasaktır; answer official/authorized modelde kalacaktır.
- P23 sonrası Interaction Foundation P24’e bırakıldı.
- Interaction persistence P24’te in-memory / `globalThis.__interactionStore` seviyesindeydi.
- Content existence verification yapılmıyordu.
- Counter cache / projection yoktu.
- Notification ve ranking signal publish yoktu.
- Full saved/liked pages UI yoktu.
- Gerçek auth-to-actor mapping P24 kapsamı dışındaydı.
- Share external provider entegrasyonu yoktu.
- Interaction truth owner ayrı `@hx/interaction` service olacaktır.
- Interaction content/review/Q&A truth mutate etmeyecektir.
- SAVE private, diğer interactionlar aggregate-only modellenecektir.
- VOTE_UP / VOTE_DOWN mutual exclusion zorunludur.
- P24 sonrası Follow Feed Foundation P25’e bırakıldı.

---

### A-P25-P31 — Follow, Search, PLP, Storefront, Story, Media, Moderation

- Follow relationship M4 social owner ailesinde tutulur.
- Follow feed truth değildir.
- Follow foundation in-memory seviyededir; DB persistence, Redis counter/cache, notification ve analytics event entegrasyonu yoktur.
- Search M9 intent + candidate owner olarak kalır.
- Search index projection truth değildir.
- Search foundation static projection seviyesindeydi; OpenSearch, gerçek indexing pipeline, typo/synonym/NLP engine, analytics/risk/search-quality event entegrasyonu yoktu.
- PLP klasik ürün kart omurgasıdır.
- Klasik ürün kartta paylaş aksiyonu yoktur.
- Category/PLP foundation static projection seviyesindedir.
- Storefront projection yüzeyidir, lifecycle owner değildir.
- Storefront ürün grid’i klasik product card kuralını korur.
- Storefront video rail story değildir.
- Storefront foundation static projection seviyesindedir.
- Story post, follow feed veya video rail değildir.
- Story yüzey bağlamı korunur.
- Story media ve moderation truth sahibi değildir.
- Story foundation static projection seviyesindedir.
- Yüklenen dosya yayına uygun medya değildir.
- Media asset truth `@hx/media` içinde kalır.
- Visibility-ready ve moderation-ready ayrı durumlardır.
- Media asset foundation simülasyon seviyesindedir.
- Moderation BFF / Web Integration PASS kapandı.
- BFF moderasyon truth üretmez; request parse eder, `@hx/moderation` servisine delegasyon yapar.
- Web state/truth tutmaz; yalnız simülasyon ve response doğrulama görevi görür.
- Moderation integration kapsamında gerçek admin moderation console, gerçek operasyon kuyruğu, ileri auth/role enforcement ve karar sonrası hedef domain enforcement kapsam dışı kalmıştır.
- P31 sonrası P32 source audit ile teknik borç hattı açılmıştır.

---

## 11. P32 kaynak denetimi arşiv özeti

### A-P32-001

**Tür:** DECISION  
**Başlık:** P32 Post-P31 Source Audit & Technical Debt Inventory PASS  
**Durum:** CLOSED

**Kısa Açıklama:**  
P01–P31 sonrası sistemde biriken teknik borçlar kaynak kod üzerinden doğrulandı ve P33 yönü kanıtla belirlendi.

**Yapılan İşler:**

- Kritik servislerde in-memory/globalThis/Map tabanlı runtime store kullanımı tarandı.
- Persistence, provider simulation, event/audit, eligibility ve search/indexing gap’leri incelendi.
- BFF handler’larının truth üretmediği ve servis delegasyonu yaptığı non-issue olarak ayrıldı.
- P33 için Persistence Foundation yönü önerildi.

**Ana Bulgular:**

- Commerce/cart, order, payment, media/review, moderation ve notification gibi kritik owner alanlarında in-memory store kullanımı doğrulandı.
- PostgreSQL client, repository adapter, migration ve transaction boundary eksikleri persistence gap olarak kayda geçti.
- Payment ve shipment provider entegrasyonları simulation/foundation seviyesinde.
- Audit/event tarafında durable audit store, outbox pattern ve persistent event store yok.
- Review/UGC eligibility gerçek order/shipment delivery verisine bağlı değildi.
- Search static/in-memory candidate modeliyle çalışıyordu; OpenSearch indexing pipeline yoktu.

**Komut Kanıtı:**

- `pnpm run typecheck`: PASS
- `pnpm run build`: PASS

**Limitations:**

- Audit, persistence implementation üretmemiştir; yalnız kaynak kod denetimi ve yön belirleme yapmıştır.
- “Tüm servisler” kapsamındaki genelleme sonraki persistence paketlerinde domain bazlı tekrar doğrulanacaktır.

**Sonuç:**  
P32 PASS. P33 yönü Persistence Foundation olarak belirlenmiştir.

---

## 12. Production-readiness borç özeti

Aşağıdaki başlıklar foundation-level RC’yi engellemez; ancak production-ready ilanı öncesi ayrıca ele alınmalıdır:

- real payment provider integration
- real carrier/kargo provider integration
- real refund provider integration
- payout provider readiness
- notification provider integration
- realtime notification delivery
- media storage/CDN/video processing integration
- transactional outbox hardening
- publisher/consumer system
- full BFF/API E2E acceptance tests
- migration rollback/recovery hardening
- OpenSearch credential/bootstrap hardening
- OpenSearch production ops
- category/storefront indexing expansion
- dynamic facets
- analytics/metrics/dashboard hardening
- provider sandbox / production readiness validation
- frontend/panel runtime hardening
- production secrets/config/rotation/revocation
- production deployment automation / CI-CD hardening
- distributed rate limiting
- full fraud scoring / auto hold-block
- finance/payout/settlement abuse hardening
- pricing/stock/media real-time projection sync
- catalog/product write owner
- category taxonomy owner hardening
- stale generated dist artifact hygiene

---

## 13. Güncelleme kuralı

Bu dosya aşağıdaki durumlarda güncellenir:

- yeni aktif risk oluştuğunda
- yeni mimari karar alındığında
- limitation bilinçli kabul edildiğinde
- risk kapandığında
- production-readiness borcu değiştiğinde
- roadmap yönü değiştiğinde

Net kural:

- Her paket kapanışında 65 yalnız yeni risk/karar/limitation varsa güncellenir.
- Paket kapanış detayları 64 veya ilgili closure note içinde tutulur.
- Eski ve kapanmış riskler aktif dosyada büyütülmez; arşiv bölümünde gruplanır.
- Foundation-level RC, production-ready anlamına gelmez.
- Production-ready iddiası yalnız post-RC hardening/provider readiness hattı kapandıktan sonra değerlendirilebilir.

---

## 14. Kısa sonuç

P01–P52 foundation coding roadmap tamamlanmıştır.  
P52 ile foundation-level release candidate kabul edilmiştir.  
Production-ready iddiası verilmemiştir.  
Sıradaki dönem: **Production Readiness / Provider Hardening Phase**.

Ana yön:

1. Production-readiness borçlarını paketlere böl.
2. Provider entegrasyonlarını sandbox ve production readiness kapılarıyla ele al.
3. Full E2E / T4 acceptance suite’i güçlendir.
4. Transactional outbox, worker/consumer, migration recovery ve observability hattını production seviyesine çıkar.
5. Frontend/panel runtime, deployment, secrets/config ve CI/CD hardening’i ayrı kapanış kapısından geçir.


65-ACTIVE_RISKS_AND_DECISIONS-CONSOLIDATED.md altına eklenecek kayıt
---

# PHASE-07 Sonrası Aktif Risk ve Karar Güncellemesi

## Kayıt: DECISION-PHASE-07-CLOSURE

- **Tür:** DECISION
- **Durum:** CLOSED
- **Karar:** PHASE-07 — Search / Catalog / Ranking / Taxonomy Readiness fazı **PASS WITH LIMITATION** kararıyla kapatılmıştır.
- **Gerekçe:** Search, catalog, category/taxonomy, projection, stale leak smoke, ranking/recommendation ve type-safety alanlarında PHASE-07 hedefleri foundation/smoke seviyesinde kanıtlanmıştır. Kritik gap’ler fix paketleriyle ele alınmıştır.
- **Production-ready claim:** Verilmedi.
- **Sonraki Faz:** PHASE-08 — GO WITH LIMITATION.
- **Referans:** PHASE-07-CLOSURE-REPORT.md

---

## Kayıt: DECISION-PHASE-07-NOT-PRODUCTION-READY

- **Tür:** DECISION
- **Durum:** ACTIVE
- **Karar:** PHASE-07 kapanışı platform genel production-ready anlamına gelmez.
- **Gerekçe:** PHASE-07 yalnız Search / Catalog / Ranking / Taxonomy readiness kapsamını foundation/smoke seviyesinde kapatmıştır. Production-ready claim için PHASE-10 Frontend/Public Surface Readiness, PHASE-11 Critical Journey Acceptance ve PHASE-12 Infra/Release Gate doğrulamaları tamamlanmalıdır.
- **Etkisi:** Yayın hazırlığı kararı PHASE-12 sonrasına kadar verilmez.
- **Referans:** PHASE-07-CLOSURE-REPORT.md

---

## Kayıt: RISK-PHASE-07-OPEN-OPENSEARCH-PRODUCTION-OPS

- **Tür:** RISK
- **Durum:** ACTIVE / DEFERRED
- **Risk:** OpenSearch production ops, bootstrap, lifecycle, runtime bağlantısı ve production index yönetimi tamamlanmamıştır.
- **Etkisi:** Search production readiness PHASE-12’den önce tam kapanamaz.
- **Mevcut Azaltım:** Search/index projection foundation ve related smoke’lar PASS.
- **Devredilen Faz:** PHASE-12 / Infra Release Gate.
- **Kapanış Kriteri:** Gerçek OpenSearch cluster kurulumu, credential/config validation, index lifecycle, rebuild/retry stratejisi ve runtime smoke kanıtı.
- **Referans:** PHASE-07-CLOSURE-REPORT.md

---

## Kayıt: RISK-PHASE-07-PRODUCTION-BROKER-DISTRIBUTED-WORKER

- **Tür:** RISK
- **Durum:** ACTIVE / DEFERRED
- **Risk:** Projection/event handling hâlâ memory/foundation seviyesindedir; production broker ve distributed worker yoktur.
- **Etkisi:** Production ortamında price/stock/media projection sync dayanıklılığı garanti edilemez.
- **Mevcut Azaltım:** Projection consumer foundation ve stale leak smoke coverage foundation seviyesinde PASS WITH LIMITATION.
- **Devredilen Faz:** PHASE-12 veya eventing/infra readiness.
- **Kapanış Kriteri:** RabbitMQ/Kafka veya seçilen broker entegrasyonu, worker lifecycle, retry/backoff, DLQ ve observability kanıtı.
- **Referans:** PHASE-07-FIX-03, PHASE-07-FIX-04, PHASE-07-CLOSURE-REPORT.md

---

## Kayıt: RISK-PHASE-07-DURABLE-PROJECTION-PERSISTENCE

- **Tür:** RISK
- **Durum:** ACTIVE / DEFERRED
- **Risk:** Projection state kalıcı depolama üzerinde doğrulanmamıştır; memory/foundation seviyesi kullanılmıştır.
- **Etkisi:** Restart, scale-out ve production consistency senaryolarında projection durability garanti edilemez.
- **Mevcut Azaltım:** Projection model, update contract ve leak smoke coverage foundation seviyesinde doğrulanmıştır.
- **Devredilen Faz:** PHASE-12 veya persistence/projection durability package.
- **Kapanış Kriteri:** Durable projection persistence adapter, restart sonrası state validation, consistency/rebuild smoke.
- **Referans:** PHASE-07-CLOSURE-REPORT.md

---

## Kayıt: RISK-PHASE-07-EXTERNAL-INDEX-RUNTIME-INTEGRATION

- **Tür:** RISK
- **Durum:** ACTIVE / DEFERRED
- **Risk:** External index runtime integration production seviyesinde tamamlanmamıştır.
- **Etkisi:** Search/retrieval production ortamı full external runtime ile doğrulanmamış kalır.
- **Mevcut Azaltım:** Internal/foundation index projection smoke’ları PASS.
- **Devredilen Faz:** PHASE-12.
- **Kapanış Kriteri:** External index API/runtime bağlantısı, failure/retry, rate-limit ve rebuild strategy smoke kanıtı.
- **Referans:** PHASE-07-CLOSURE-REPORT.md

---

## Kayıt: RISK-PHASE-07-PDP-PUBLIC-ENDPOINT-SMOKE

- **Tür:** RISK
- **Durum:** ACTIVE / DEFERRED
- **Risk:** PDP özel public endpoint smoke doğrudan tamamlanmamıştır.
- **Etkisi:** PDP public/API/UI journey PHASE-07 kapsamında tam kanıtlanmamıştır.
- **Mevcut Azaltım:** Catalog/product card projection ve backend foundation smoke’ları PASS.
- **Devredilen Faz:** PHASE-10 / PHASE-11.
- **Kapanış Kriteri:** PDP public endpoint, PDP UI journey ve PDP→cart critical journey smoke/acceptance kanıtı.
- **Referans:** PHASE-07-CLOSURE-REPORT.md

---

## Kayıt: RISK-PHASE-07-HOME-DISCOVER-UI-JOURNEY

- **Tür:** RISK
- **Durum:** ACTIVE / DEFERRED
- **Risk:** Home/discover full algorithm ve UI journey uçtan uca doğrulanmamıştır.
- **Etkisi:** Ana sayfa ve keşfet kullanıcı deneyimi production acceptance seviyesinde kapalı değildir.
- **Mevcut Azaltım:** Ranking/recommendation foundation ve public-safe candidate smoke PASS WITH LIMITATION.
- **Devredilen Faz:** PHASE-10 / PHASE-11 veya ileri discovery/ranking package.
- **Kapanış Kriteri:** Home/discover frontend + algorithm + data path E2E testleri.
- **Referans:** PHASE-07-FIX-05, PHASE-07-FIX-05A, PHASE-07-CLOSURE-REPORT.md

---

## Kayıt: RISK-PHASE-07-ADVANCED-RANKING-RECOMMENDATION

- **Tür:** RISK
- **Durum:** ACTIVE / DEFERRED
- **Risk:** Advanced ranking/recommendation engine, personalization persistence ve feature store henüz mevcut değildir.
- **Etkisi:** Foundation-level recommendation çalışır; ancak gelişmiş discovery/personalization readiness tamamlanmamıştır.
- **Mevcut Azaltım:** Ranking/recommendation smoke readiness ve type-safety remediation tamamlandı.
- **Devredilen Faz:** İleri discovery/ranking package veya personalization/readiness phase.
- **Kapanış Kriteri:** Advanced ranking/recommendation engine, personalization persistence, feature store ve production signal ingestion doğrulamaları.
- **Referans:** PHASE-07-CLOSURE-REPORT.md

---

## Kayıt: RISK-PHASE-07-DYNAMIC-FACET-ADVANCED-PLP

- **Tür:** RISK
- **Durum:** ACTIVE / DEFERRED
- **Risk:** Dynamic facet / advanced PLP facet engine tamamlanmamıştır.
- **Etkisi:** Temel PLP/category smoke coverage var; fakat gelişmiş kategoriye duyarlı facet motoru henüz yoktur.
- **Mevcut Azaltım:** Category/taxonomy/PLP smoke coverage PASS.
- **Devredilen Faz:** İleri catalog/search advanced package.
- **Kapanış Kriteri:** Dynamic facet engine, OpenSearch/index destekli facet sorguları ve category-specific filter smoke kanıtı.
- **Referans:** PHASE-07-FIX-01, PHASE-07-CLOSURE-REPORT.md

---

## Kayıt: RISK-PHASE-07-PRODUCTION-RETRY-DLQ-BACKOFF

- **Tür:** RISK
- **Durum:** ACTIVE / DEFERRED
- **Risk:** Production retry / DLQ / backoff strategy yoktur.
- **Etkisi:** Projection/event worker failure senaryoları production seviyesinde yönetilemez.
- **Mevcut Azaltım:** Idempotency ve duplicate event effect foundation smoke seviyesinde doğrulandı.
- **Devredilen Faz:** PHASE-12.
- **Kapanış Kriteri:** Retry policy, DLQ, backoff strategy, worker observability ve alerting dashboard.
- **Referans:** PHASE-07-FIX-04, PHASE-07-CLOSURE-REPORT.md

---

## Kayıt: DECISION-PHASE-08-GO-WITH-LIMITATION

- **Tür:** DECISION
- **Durum:** ACTIVE
- **Karar:** PHASE-08 — Admin / Creator / Supplier / Support Panel Readiness fazına **GO WITH LIMITATION** kararıyla geçilebilir.
- **Gerekçe:** PHASE-07 kapsamındaki closure blocker’lar kapatılmıştır; ancak PHASE-07’den PHASE-08’e devreden projection, panel direct-write, action coverage ve infra limitation’ları dikkate alınmalıdır.
- **PHASE-08 dikkat noktaları:**
  - Panel direct write yapılmamalı.
  - Panel action coverage owner boundary ile doğrulanmalı.
  - Search/catalog projection hâlâ foundation seviyesindedir.
  - Production infra işleri PHASE-12’ye devredilmiştir.
  - PDP özel public endpoint smoke PHASE-10/11’e devredildiği için PHASE-08 kapsamıyla karıştırılmamalıdır.
- **Referans:** PHASE-07-CLOSURE-REPORT.md

Kaynak: PHASE-07 closure kararları, açık limitation’lar ve PHASE-08 geçiş notları.



************************
---

# PHASE-08 Sonrası Aktif Risk ve Karar Güncellemesi

## Kayıt: DECISION-PHASE-08-CLOSURE

- **Tür:** DECISION
- **Durum:** CLOSED
- **Karar:** PHASE-08 — Admin / Creator / Supplier / Support Panel Readiness fazı **PASS WITH LIMITATION** kararıyla kapatılmıştır.
- **Gerekçe:** Admin, creator, supplier, support, audit/evidence, maker-checker ve panel smoke coverage alanlarında PHASE-08 hedefleri foundation seviyesinde kanıtlanmıştır.
- **Production-ready claim:** Verilmedi.
- **Sonraki Faz:** PHASE-09 — GO WITH LIMITATION.
- **Referans:** PHASE-08-CLOSURE-REPORT.md

---

## Kayıt: DECISION-PHASE-08-NOT-PRODUCTION-READY

- **Tür:** DECISION
- **Durum:** ACTIVE
- **Karar:** PHASE-08 kapanışı platform genel production-ready anlamına gelmez.
- **Gerekçe:** PHASE-08 yalnız panel boundary/readiness foundation kapsamını kapatmıştır. Full UI, durable audit/idempotency, durable approval queue, frontend route protection, entitlement registry, support SLA/escalation ve production workflow hardening açık kalmıştır.
- **Etkisi:** Platform genel yayın hazırlığı kararı PHASE-10, PHASE-11 ve PHASE-12 tamamlanmadan verilemez.
- **Referans:** PHASE-08-CLOSURE-REPORT.md

---

## Kayıt: DECISION-SUPER-ADMIN-PLATFORM-OWNER-MODEL

- **Tür:** DECISION
- **Durum:** ACTIVE
- **Karar:** `SUPER_ADMIN` / `PLATFORM_OWNER` rolü merkezi kontrol ve onay rolüdür; sınırsız direct-write yetkisi değildir.
- **Gerekçe:** Platform sahibi ve üst yönetici tek panelden tüm ana operasyon modüllerine erişebilmelidir. Ancak bu erişim owner servisleri bypass eden doğrudan veri değiştirme yetkisi anlamına gelmez.
- **Etkisi:** Süper yönetici admin, creator, supplier, support, moderation, finance, payout ve operation modüllerinde işlem başlatabilir; fakat kritik işlemlerde audit/evidence ve maker-checker sınırları korunur.
- **Referans:** Sistem_Tasarimlari/40-admin sistemi.md, Sistem_Tasarimlari/25-kural -yetki sistemi.md, PHASE-08-CLOSURE-REPORT.md

---

## Kayıt: RISK-PHASE-08-FULL-PANEL-UI

- **Tür:** RISK
- **Durum:** ACTIVE / DEFERRED
- **Risk:** Full panel UI, admin UI, creator UI, supplier UI ve support UI production seviyesinde tamamlanmamıştır.
- **Etkisi:** PHASE-08 backend/foundation kapanmış olsa da gerçek panel kullanıcı deneyimi production-ready değildir.
- **Mevcut Azaltım:** BFF/service/contract foundation ve panel smoke coverage tamamlandı.
- **Devredilen Faz:** PHASE-10 Frontend/Public Surface Readiness.
- **Kapanış Kriteri:** Panel shell, role-based navigation, approval inbox, route protection ve frontend smoke PASS.
- **Referans:** PHASE-08-CLOSURE-REPORT.md

---

## Kayıt: RISK-PHASE-08-FRONTEND-ROUTE-PROTECTION

- **Tür:** RISK
- **Durum:** ACTIVE / DEFERRED
- **Risk:** Frontend route protection smoke henüz yoktur.
- **Etkisi:** UI üzerinden unauthorized route access veya actor/scope ihlali frontend seviyesinde doğrulanmamıştır.
- **Mevcut Azaltım:** BFF/service guard foundation ve API-level smoke coverage mevcut.
- **Devredilen Faz:** PHASE-10.
- **Kapanış Kriteri:** Unauthorized route access, actor/scope UI smoke ve frontend route guard PASS.
- **Referans:** PHASE-08-CLOSURE-REPORT.md

---

## Kayıt: RISK-PHASE-08-DURABLE-AUDIT-IDEMPOTENCY

- **Tür:** RISK
- **Durum:** ACTIVE / DEFERRED
- **Risk:** Audit evidence ve idempotency davranışı foundation/process-local seviyededir; durable persistence yoktur.
- **Etkisi:** Production ortamında audit replay, idempotency conflict, queryability ve kalıcı izlenebilirlik tam garanti edilemez.
- **Mevcut Azaltım:** Ortak panel audit/evidence foundation ve smoke coverage tamamlandı.
- **Devredilen Faz:** PHASE-12 veya persistence/audit hardening.
- **Kapanış Kriteri:** Durable audit event store, durable idempotency conflict/replay behavior ve query/replay smoke PASS.
- **Referans:** PHASE-08-FIX-05, PHASE-08-FIX-06, PHASE-08-CLOSURE-REPORT.md

---

## Kayıt: RISK-PHASE-08-DURABLE-MAKER-CHECKER-APPROVAL-QUEUE

- **Tür:** RISK
- **Durum:** ACTIVE / DEFERRED
- **Risk:** Maker-checker foundation kurulmuştur; fakat durable approval queue ve full workflow engine yoktur.
- **Etkisi:** Production seviyesinde onay kuyruğu, assignment, state machine ve kalıcı approval lifecycle henüz tamam değildir.
- **Mevcut Azaltım:** Same actor maker-checker block ve different actor owner handoff foundation smoke ile doğrulandı.
- **Devredilen Faz:** PHASE-12 veya panel workflow hardening.
- **Kapanış Kriteri:** Durable approval queue, maker/checker assignment, state machine ve audit smoke PASS.
- **Referans:** PHASE-08-FIX-05, PHASE-08-CLOSURE-REPORT.md

---

## Kayıt: RISK-PHASE-08-AUDIT-OBSERVABILITY-DASHBOARD

- **Tür:** RISK
- **Durum:** ACTIVE / DEFERRED
- **Risk:** Audit observability dashboard yoktur.
- **Etkisi:** Production release öncesi audit queryability, alerting ve release evidence izlenebilirliği eksik kalır.
- **Mevcut Azaltım:** Audit/evidence foundation mevcut; fakat dashboard yoktur.
- **Devredilen Faz:** PHASE-12 Observability / Release Gate.
- **Kapanış Kriteri:** Audit dashboard, queryability, alerting ve release gate evidence PASS.
- **Referans:** PHASE-08-CLOSURE-REPORT.md

---

## Kayıt: RISK-PHASE-08-SUPPORT-SLA-ESCALATION

- **Tür:** RISK
- **Durum:** ACTIVE / DEFERRED
- **Risk:** Full support SLA/escalation engine tamamlanmamıştır.
- **Etkisi:** Support production operasyon akışı, SLA assignment, escalation cycle ve breach handling production-ready değildir.
- **Mevcut Azaltım:** Support visibility, order access ve PII guard foundation tamamlandı.
- **Devredilen Faz:** PHASE-12 veya support operations readiness.
- **Kapanış Kriteri:** SLA assignment, escalation cycle, breach handling ve audit smoke PASS.
- **Referans:** PHASE-08-FIX-04, PHASE-08-CLOSURE-REPORT.md

---

## Kayıt: RISK-PHASE-08-REAL-SUPPORT-TICKET-QUEUE-PERSISTENCE

- **Tür:** RISK
- **Durum:** ACTIVE / DEFERRED
- **Risk:** Real support ticket queue persistence yoktur.
- **Etkisi:** Support ticket queue, ownership lookup ve operational queue production seviyesinde kalıcı olarak doğrulanmamıştır.
- **Mevcut Azaltım:** Support visibility/PII foundation tamamlandı.
- **Devredilen Faz:** PHASE-12 veya support persistence hardening.
- **Kapanış Kriteri:** Durable queue, ownership lookup ve operational queue smoke PASS.
- **Referans:** PHASE-08-CLOSURE-REPORT.md

---

## Kayıt: RISK-PHASE-08-CREATOR-STOREFRONT-ENTITLEMENT-REGISTRY

- **Tür:** RISK
- **Durum:** ACTIVE / DEFERRED
- **Risk:** Real creator-storefront entitlement registry yoktur.
- **Etkisi:** Creator scope guard foundation seviyesinde çalışır; fakat durable entitlement lookup production seviyesinde tamam değildir.
- **Mevcut Azaltım:** Actor spoofing ve cross-storefront access foundation smoke ile engellendi.
- **Devredilen Faz:** PHASE-12 veya creator authorization package.
- **Kapanış Kriteri:** Durable entitlement lookup ve cross-storefront enforcement PASS.
- **Referans:** PHASE-08-FIX-02, PHASE-08-CLOSURE-REPORT.md

---

## Kayıt: RISK-PHASE-08-SUPPLIER-PRODUCT-ENTITLEMENT-REGISTRY

- **Tür:** RISK
- **Durum:** ACTIVE / DEFERRED
- **Risk:** Real supplier-product entitlement registry yoktur.
- **Etkisi:** Supplier scope guard foundation seviyesinde çalışır; fakat durable supplier-product ownership lookup production seviyesinde tamam değildir.
- **Mevcut Azaltım:** Actor spoofing ve cross-supplier access foundation smoke ile engellendi.
- **Devredilen Faz:** PHASE-12 veya supplier authorization package.
- **Kapanış Kriteri:** Durable supplier-product registry ve cross-supplier enforcement PASS.
- **Referans:** PHASE-08-FIX-03, PHASE-08-CLOSURE-REPORT.md

---

## Kayıt: RISK-PHASE-08-PRODUCTION-PANEL-WORKFLOW-HARDENING

- **Tür:** RISK
- **Durum:** ACTIVE / DEFERRED
- **Risk:** Production panel workflow hardening tamamlanmamıştır.
- **Etkisi:** End-to-end panel workflow, persistence, rollback ve observability production release seviyesinde henüz doğrulanmamıştır.
- **Mevcut Azaltım:** Owner boundary, direct-write guard, non-mutation evidence ve smoke coverage foundation tamamlandı.
- **Devredilen Faz:** PHASE-12 / Release Gate.
- **Kapanış Kriteri:** End-to-end workflow, persistence, rollback ve observability PASS.
- **Referans:** PHASE-08-CLOSURE-REPORT.md

---

## Kayıt: RISK-PHASE-08-CANONICAL-EVIDENCE-PATH

- **Tür:** RISK
- **Durum:** ACTIVE / DEFERRED
- **Risk:** Bazı zorunlu kaynaklar root yerine `planlama 2/` veya `planlama/` altında bulunmuştur.
- **Etkisi:** Production release evidence yönetiminde yol/hiyerarşi karışıklığı oluşabilir.
- **Mevcut Azaltım:** PHASE-08 closure raporunda gerçek yollar açıkça belirtilmiştir.
- **Devredilen Faz:** PHASE-08 closure sonrası documentation hygiene veya PHASE-12 release evidence hygiene.
- **Kapanış Kriteri:** Canonical evidence path kararı, kayıt yolu hizalama ve release evidence path doğrulaması.
- **Referans:** PHASE-08-CLOSURE-REPORT.md

---

## Kayıt: DECISION-PHASE-09-GO-WITH-LIMITATION

- **Tür:** DECISION
- **Durum:** ACTIVE
- **Karar:** PHASE-09 — Risk / Fraud / Analytics / Notification Readiness fazına **GO WITH LIMITATION** kararıyla geçilebilir.
- **Gerekçe:** PHASE-08 kapsamındaki panel boundary blocker’lar foundation seviyesinde kapatılmıştır. Panel action evidence ve audit/maker-checker foundation artık PHASE-09 risk/fraud/analytics/notification değerlendirmelerinde kullanılabilir.
- **Dikkat Noktaları:**
  - Risk/fraud/analytics/notification business truth owner olmamalı.
  - Event/notification/outbox business mutation yerine geçmemeli.
  - Durable audit/event/notification/persistence açık limitation olarak takip edilmeli.
  - PHASE-08’den gelen evidence foundation kullanılmalı ancak production-ready claim verilmemeli.
- **Referans:** PHASE-08-CLOSURE-REPORT.md