# 03-PRODUCTION_READINESS_PHASE_MASTER_PLAN.md

## 1. Dosyanın Amacı

Bu dosya, Hedihup platformunun mevcut foundation-level release candidate durumundan production-ready seviyeye taşınması için oluşturulan yeni faz bazlı ana yol haritasıdır.

Bu dosya eski roadmap’in devamı değildir.

Bu dosyanın amacı:

- sistem dosyaları ile yapılan kayıtları eşleştiren mevcut baseline üzerinden yeni production-readiness yolunu tanımlamak
- yayına hazır olana kadar tamamlanması gereken fazları netleştirmek
- her fazın amacını, kapsamını, yapılmışları, yapılacakları ve kapanış şartlarını üst seviyede belirtmek
- fazlar arasında sapma, tekrar iş ve yanlış öncelik riskini azaltmak
- her faz sonunda kontrol / kapanış / PASS karar standardını korumaktır

---

## 2. Kaynak Dayanakları

Bu ana plan aşağıdaki dosyalara dayanır:

- `00-PRODUCTION_READINESS_WORKING_RULES.md`
- `01-SYSTEM_TO_IMPLEMENTATION_MAPPING.md`
- `02-CURRENT_STATE_BASELINE.md`
- 54 sistem dosyası
- 63 / 64 / 65 kayıt dosyaları
- HARDENING 00–10 kayıtları
- HARDENING-10C10 PayTR Status Inquiry / Payment Reconciliation kaydı
- PX Domain Implementation Reference Record
- OWNER_MATRIX
- GUARD_MATRIX
- PERMISSION_MATRIX
- TRANSITION_POLICIES
- DEFINITION_OF_DONE
- ACCEPTANCE_CRITERIA_PACK
- CRITICAL_JOURNEY_CHECKLIST
- TEST_STRATEJISI

---

## 3. En Üst Karar

Mevcut durum:

```text
Foundation-level Release Candidate Accepted
Production Readiness: NOT CLAIMED
```

Bu planın hedefi:

```text
Production Readiness Claim yapılabilecek kontrollü release gate seviyesine ulaşmak
```

Bu hedefe tek büyük paketle değil, faz bazlı kontrollü ilerleme ile gidilecektir.

---

## 4. Faz Bazlı Çalışma Kuralı

Her faz için ayrı faz dosyası üretilecektir.

Her faz sonunda ayrıca kapanış raporu üretilecektir.

Örnek:

```text
PHASE-03-PAYMENT-PROVIDER-CALLBACK-RECONCILIATION-READINESS.md
PHASE-03-CLOSURE-REPORT.md
```

Faz kapanışı olmadan sonraki faza geçilmez.

---

## 5. Faz Karar Standardı

Her faz sonunda yalnız şu dört karardan biri verilir:

- `PASS`
- `PASS WITH LIMITATION`
- `PARTIAL`
- `FAIL`

Karar kanıta dayanır.

Kod etkisi olmayan fazlarda kanıt:

- sistem dosyası eşleştirme
- kayıt dosyası eşleştirme
- risk ayrımı
- checklist kapanışı

Kod etkisi olan fazlarda kanıt:

- source review
- boundary review
- typecheck / build
- targeted smoke / test
- acceptance senaryosu
- gerekirse runtime / migration / provider kanıtı

---

## 6. Fazların Genel Sırası

Production-readiness ana fazları aşağıdaki sırayla yürütülecektir:

| Faz | Ad | Ana Amaç |
|---|---|---|
| PHASE-00 | Baseline / Mapping / Rule Lock | Kaynak, kural ve mevcut durum kilidi |
| PHASE-01 | Architecture Boundary / Owner / Guard Readiness | Owner, guard, permission, transition sınırlarını üretim öncesi doğrulama |
| PHASE-02 | Commerce Core Readiness | Havuz, ürün, varyant, fiyat, stok, sepet, checkout çekirdeğini temizleme |
| PHASE-03 | Payment / Provider / Callback / Reconciliation Readiness | Canlı ödeme, provider, callback, reconciliation ve order handoff öncesi hattı kapatma |
| PHASE-04 | Order / Fulfillment / Delivery / Return / Refund Readiness | Sipariş sonrası operasyon ve satış sonrası akışları kapatma |
| PHASE-05 | Finance / Settlement / Payout / Reward Readiness | Mutabakat, hakediş, payout, puan ve finansal düzeltmeleri kapatma |
| PHASE-06 | Social / Content / Media / Moderation Readiness | Story, post, review, Q&A, media ve moderasyon alanlarını kapatma |
| PHASE-07 | Search / Catalog / Ranking / Taxonomy Readiness | Arama, indeksleme, PLP, taxonomy ve ranking ayrımını kapatma |
| PHASE-08 | Admin / Creator / Supplier / Support Panel Readiness | Admin, creator panel, supplier panel ve destek operasyon yüzeylerini kapatma |
| PHASE-09 | Risk / Fraud / Analytics / Notification Readiness | Risk, fraud, analytics, event, audit, outbox ve notification üretim borçlarını kapatma |
| PHASE-10 | Frontend / UX / Mobile Surface Readiness | Kullanıcı, creator, supplier ve admin yüzeylerini ürünleşmiş hale getirme |
| PHASE-11 | Critical Journey Acceptance | 13 kritik journey’yi success/fail/rollback/audit/analytics ile doğrulama |
| PHASE-12 | Deployment / Observability / Security / Release Gate | Yayın altyapısı, güvenlik, izleme, rollback ve final release kapısı |

---

# PHASE-00 — Baseline / Mapping / Rule Lock

## Amaç

Production-readiness çalışmasına başlamadan önce kaynakları, kuralları, mevcut durumu ve faz şablonlarını kilitlemek.

## Önceden Yapılmışlar

- 54 sistem dosyası yüklenmiştir.
- 63 / 64 / 65 kayıt dosyaları yüklenmiştir.
- HARDENING 00–10 kayıtları yüklenmiştir.
- HARDENING-10C10 ek reconciliation kaydı yüklenmiştir.
- PX domain kayıtları yüklenmiştir.
- OWNER / GUARD / PERMISSION / TRANSITION dosyaları yüklenmiştir.
- DoD / Acceptance / Critical Journey / Test Stratejisi dosyaları yüklenmiştir.
- `00-PRODUCTION_READINESS_WORKING_RULES.md` oluşturulmuştur.
- `05-PHASE_FILE_TEMPLATE.md` oluşturulmuştur.
- `06-PHASE_CLOSURE_TEMPLATE.md` oluşturulmuştur.
- `01-SYSTEM_TO_IMPLEMENTATION_MAPPING.md` oluşturulmuştur.
- `02-CURRENT_STATE_BASELINE.md` oluşturulmuştur.

## Bu Fazda Yapılacaklar

- Mapping dosyasının sistem bazlı eksiklerini işaretlemek
- Baseline dosyasını onaylamak
- Faz planını onaylamak
- Risk register ve release blocker register için girdi üretmek

## Kapanış Şartı

- Kaynak seti netleşmiş olmalı
- Baseline kabul edilmiş olmalı
- Faz master planı kabul edilmiş olmalı
- Her fazın hangi alana bakacağı net olmalı

## Karar Beklentisi

```text
PASS veya PASS WITH LIMITATION
```

---

# PHASE-01 — Architecture Boundary / Owner / Guard Readiness

## Amaç

Production-readiness fazlarına geçmeden önce platformun anayasal mimari sınırlarını doğrulamak.

## Kapsam

- owner matrix
- guard matrix
- permission matrix
- transition policies
- BFF sınırı
- panel protected action sınırı
- UI truth üretmeme kuralı
- event/audit/outbox truth olmama kuralı
- guest / authenticated / creator / supplier / admin scope ayrımı

## Önceden Yapılmışlar

- P06 Access / Permission Foundation — PASS
- P07 Protected Action Foundation — PASS
- HARDENING-05A/B/C/D/E hattı
- OWNER / GUARD / PERMISSION / TRANSITION dosyaları
- 65 aktif kararlarında owner boundary anayasal sabitlenmiştir

## Bu Fazda Yapılacaklar

- Owner boundary source review yapılacak
- BFF write yapıyor mu kontrol edilecek
- Panel direct write riski kontrol edilecek
- UI truth üretimi riski kontrol edilecek
- Permission ile eligibility karışıyor mu kontrol edilecek
- Guest checkout sosyal hak açıyor mu kontrol edilecek
- Legacy actor header / x-actor-id kalıntıları kontrol edilecek
- Protected action olmayan panel/admin route kalmış mı bakılacak

## Kapsam Dışı

- Yeni feature yazımı
- Payment/order/finance iş akışı implementasyonu
- Frontend UX polish

## Kapanış Kanıtı

- source review
- boundary review
- gerekiyorsa targeted smoke
- risk kayıt güncellemesi

## Kapanış Şartı

- Owner dışı write bulunmamalı
- BFF truth owner davranışı bulunmamalı
- Panel direct write bulunmamalı
- Kritik guard eksikleri kayıt altına alınmalı veya kapatılmalı

---

# PHASE-02 — Commerce Core Readiness

## Amaç

Havuzdan checkout’a kadar olan çekirdek ticari hattı production-readiness seviyesine yaklaştırmak.

## Kapsam

- havuz sistemi
- ürün kabul / onay
- varyant
- merkezi fiyat
- merkezi stok
- kampanya
- kupon etkisi
- PDP ticari context
- sepet
- checkout
- adres
- price/stock/coupon snapshot
- PX-HAVUZ-05 partial borcu

## Önceden Yapılmışlar

- P08 Catalog / PDP Read Foundation
- P09 Cart Foundation
- P10 Pricing Foundation
- P11 Stock Foundation
- P12 Checkout Foundation
- P35 Cart / Checkout Persistence Foundation
- HARDENING-03 / 03B Core Commerce Journey Acceptance / Persistence
- PX-HAVUZ-01/02/03/04 PASS
- PX-HAVUZ-05 PARTIAL
- PX-KULLANICI-03 Customer Address / Checkout Eligibility PASS

## Bu Fazda Yapılacaklar

- PX-HAVUZ-05 PARTIAL build borcu kontrol edilecek ve kapatılacak
- Havuz → commercial pool → creator binding hattı doğrulanacak
- Varyant seçimi olmadan cart/checkout kapanıyor mu kontrol edilecek
- Stok final validation ve reservation davranışı netleştirilecek
- Fiyat snapshot ve fiyat conflict davranışı doğrulanacak
- Kupon/kampanya etkisi checkout snapshot’a doğru yansıyor mu kontrol edilecek
- Guest checkout commerce istisnası olarak kalıyor mu doğrulanacak
- Adres snapshot / guest address / delivery suitability kontrol edilecek
- Cart → checkout critical journey fail case’leri kontrol edilecek

## Kapsam Dışı

- Payment provider live entegrasyonu
- Order handoff
- Settlement/payout
- Full frontend UI polish

## Kapanış Kanıtı

- source review
- boundary review
- typecheck/build
- targeted commerce smoke
- cart → checkout acceptance
- price/stock/coupon fail-case kontrolü

## Kapanış Şartı

- Commerce core’da release blocker kalmamalı
- PX-HAVUZ-05 durumu netleşmeli
- Checkout payment readiness state’i yanlış order yaratmamalı

---

# PHASE-03 — Payment / Provider / Callback / Reconciliation Readiness

## Amaç

Ödeme, provider boundary, PayTR callback, status inquiry, reconciliation ve payment succeeded sonrası order handoff öncesi hattı production-readiness seviyesine getirmek.

## Kapsam

- ödeme sistemi
- payment provider adapter
- PayTR initiate
- provider callback ingestion
- signature / replay / freshness / rate guard
- PayTR callback mapping
- PayTR status inquiry
- reconciliation task / repository / worker
- controlled payment mutation
- audit/outbox evidence
- payment succeeded → order handoff inventory ve foundation
- unknown-result / pending / retry / timeout davranışı

## Önceden Yapılmışlar

- P13 Payment Initiation Foundation — PASS WITH LIMITATION
- P14 Payment → Order Foundation — PASS
- HARDENING-09 payment provider boundary — PASS
- HARDENING-10 callback ingestion/security/mapping/owner transition
- HARDENING-10C10 reconciliation foundation — CLOSED WITH LIMITATIONS

## Bu Fazda Yapılacaklar

- HARDENING-10C10 limitations tek tek açılacak
- live PayTR request / sandbox stratejisi netleştirilecek
- PayTR merchant_oid / providerReference DB uniqueness riski değerlendirilecek
- reconciliation production runtime / scheduler / queue kararı verilecek
- worker claim/retry/concurrency tasarımı yapılacak
- payment succeeded → order handoff için 10C11 inventory hazırlanacak
- order handoff owner boundary netleştirilecek
- duplicate payment success → duplicate order engeli kurulacak
- unknown_result kullanıcı ve sistem davranışı netleştirilecek
- risk hold varsa order handoff duracak mı kararlaştırılacak
- audit/outbox event doğrudan order command sayılmayacak şekilde sınır korunacak

## Kapsam Dışı

- Finance settlement hesaplama
- Payout icrası
- Full frontend payment UX polish
- Canlı production deploy

## Kapanış Kanıtı

- typecheck/build
- provider/callback smoke
- PayTR status inquiry smoke
- reconciliation controlled mutation smoke
- no order handoff / controlled handoff smoke
- duplicate/idempotency test
- unknown-result/retry scenario
- boundary review

## Kapanış Şartı

- Payment succeeded ≠ order created ayrımı korunmalı
- Order handoff varsa yalnız order owner command ile çalışmalı
- Duplicate order üretilmemeli
- Live/sandbox provider stratejisi netleşmeli
- Reconciliation production runtime kararı verilmiş olmalı

---

# PHASE-04 — Order / Fulfillment / Delivery / Return / Refund Readiness

## Amaç

Payment sonrası order oluşumu, fulfillment, shipment, delivery, return ve refund zincirini production-readiness seviyesine getirmek.

## Kapsam

- sipariş sistemi
- sipariş operasyon sistemi
- sipariş takip sistemi
- kargo/teslimat sistemi
- iptal/iade sistemi
- refund
- delivery → review/story eligibility
- delivery → return/refund impact
- multi-package / partial delivery / partial return

## Önceden Yapılmışlar

- P14 Payment → Order Foundation
- P15 Order Read / Detail Foundation
- P16 Shipment / Delivery Foundation
- P17 Cancel / Return Foundation
- P18 Refund Foundation
- HARDENING-03 / 03B core journey persistence
- shipment provider boundary foundation

## Bu Fazda Yapılacaklar

- Payment handoff sonrası order creation idempotency doğrulanacak
- Order operation queue / supplier fulfillment ayrımı netleşecek
- Shipment provider gerçek boundary ve tracking update akışı doğrulanacak
- Delivery proof ve delivered state etkisi netleşecek
- Delivery → review/story eligibility tetikleme doğrulanacak
- Return approved ≠ refund completed ayrımı korunacak
- Refund execution finance owner sınırıyla doğrulanacak
- Partial return/refund etkileri kontrol edilecek
- User-facing order tracking projection kontrol edilecek

## Kapsam Dışı

- Settlement/payout finalization
- Full admin ops UI polish
- Full frontend UX release acceptance

## Kapanış Kanıtı

- order → shipment smoke
- delivery → eligibility acceptance
- return → refund scenario
- idempotency/duplicate order test
- boundary review
- targeted integration test

## Kapanış Şartı

- Order truth ile operation/tracking projection karışmamalı
- Refund finansal truth owner sınırı korunmalı
- Delivery sonrası haklar yanlış açılmamalı

---

# PHASE-05 — Finance / Settlement / Payout / Reward Readiness

## Amaç

Tahsilat sonrası finansal dağıtım, settlement, payable, payout, refund adjustment, kupon sponsor etkisi ve ödül puanı lifecycle’ını production-readiness seviyesine getirmek.

## Kapsam

- finansal mutabakat / hakediş
- settlement
- payout
- refund financial adjustment
- coupon sponsor cost impact
- reward point lifecycle
- point market
- financial audit
- finance admin actions
- risk hold / payout block

## Önceden Yapılmışlar

- P18 Refund Foundation
- P44 Finance Correction Foundation
- P45 Settlement Foundation
- P46 Payout Foundation
- HARDENING-09 payout provider boundary
- PX-KULLANICI-06 reward eligibility foundation

## Bu Fazda Yapılacaklar

- Payment/order/delivery sonrası settlement trigger noktası netleştirilecek
- Settlement pending/settled/adjusted/reversed lifecycle doğrulanacak
- Settled ≠ payable ayrımı korunacak
- Payable ≠ paid_out ayrımı korunacak
- Payout provider gerçek/sandbox stratejisi belirlenecek
- Payout batch, retry, failure ve hold davranışı netleştirilecek
- Kupon sponsor etkisi finansal dağıtıma bağlanacak
- Refund/return settlement adjustment doğrulanacak
- Reward point pending/vested/spendable lifecycle netleştirilecek
- Point market harcama ve risk kontrolü değerlendirilecek

## Kapsam Dışı

- User storefront UI polish
- Search/ranking
- Media processing

## Kapanış Kanıtı

- settlement → payout integration test
- refund → settlement adjustment test
- payout provider boundary test
- reward lifecycle test
- finance boundary review
- audit evidence

## Kapanış Şartı

- Finansal truth yalnız finance owner içinde mutate edilmeli
- Hakediş ile ödeme çıkışı karıştırılmamalı
- Payout gerçek para çıkışı simülasyon/sandbox/production sınırı açık olmalı

---

# PHASE-06 — Social / Content / Media / Moderation Readiness

## Amaç

Platformun sosyal-commerce içerik alanlarını production-readiness seviyesine getirmek.

## Kapsam

- story
- video
- post
- follow
- interaction
- review/rating
- Q&A
- user product story
- media/asset processing
- moderation
- social abuse signals

## Önceden Yapılmışlar

- P21 Post / UGC Foundation
- P22 Review / Rating Foundation
- P23 Q&A Foundation
- P24 Interaction Foundation
- P25 Follow Feed Foundation
- P29 Story Foundation
- P30 Media / Asset Foundation
- P31 Moderation Foundation
- HARDENING-04 media remediation
- HARDENING-06 moderation/risk/abuse hardening
- PX-FENOMEN-05 Store Post / Follow Feed PASS
- PX-KULLANICI-04 Contribution Eligibility PASS

## Bu Fazda Yapılacaklar

- Review eligibility delivered-line bazında doğrulanacak
- User product story eligibility ve ürün etiketi zorunluluğu doğrulanacak
- Return/refund sonrası review/story/score etkisi kontrol edilecek
- Media upload / derivative / moderation / publication lifecycle netleştirilecek
- Video asset processing ve CDN/object storage stratejisi belirlenecek
- Post/follow feed visibility ve moderation-safe projection doğrulanacak
- Q&A platform answer authority korunacak
- Social abuse signal coverage risk/fraud ile bağlanacak
- Full moderation queue/panel ihtiyacı PHASE-08’e aktarılacak

## Kapsam Dışı

- Ranking feed production scoring
- Full frontend UX acceptance
- Full admin panel polish

## Kapanış Kanıtı

- review/story eligibility tests
- media boundary review
- moderation workflow smoke
- social abuse signal smoke
- no unauthorized content visibility check

## Kapanış Şartı

- Moderation-safe olmayan içerik public yüzeye çıkmamalı
- Delivered olmadan review/story hakkı açılmamalı
- Media raw upload yayına uygun asset sayılmamalı

---

# PHASE-07 — Search / Catalog / Ranking / Taxonomy Readiness

## Amaç

Arama, katalog, PLP, taxonomy, indexing, ranking ve recommendation ayrımlarını production-readiness seviyesine getirmek.

## Kapsam

- arama sistemi
- arama indexing/retrieval
- category/PLP
- category taxonomy
- facets/filters
- storefront/product indexed context
- ranking/recommendation owner
- OpenSearch production ops
- projection sync

## Önceden Yapılmışlar

- P26 Search Foundation
- P27 Category / PLP Foundation
- HARDENING-07 Catalog / PDP / PLP / Search PASS WITH LIMITATION
- Search BFF Smoke
- Search Index Sync Projection Foundation

## Bu Fazda Yapılacaklar

- Search candidate owner ile ranking owner ayrımı doğrulanacak
- Taxonomy owner borcu kapatılacak veya fazlanacak
- Dynamic facets / filters production davranışı netleştirilecek
- PLP search grid merge davranışı netleştirilecek
- OpenSearch bootstrap / ops / index lifecycle planı çıkarılacak
- Event/outbox consumer veya indexing worker reliability tasarlanacak
- Pricing/stock/media realtime projection sync ele alınacak
- Ranking/recommendation initial production-safe scope belirlenecek

## Kapsam Dışı

- Full frontend UX polish
- Payment/finance akışları
- Admin panel genel yönetimi

## Kapanış Kanıtı

- search smoke
- index projection smoke
- taxonomy/category mapping review
- ranking boundary review
- no hidden/unavailable leak test
- degraded search behavior test

## Kapanış Şartı

- Search final ordering ranking owner dışında yapılmamalı
- Hidden/unavailable/archived ürün leak olmamalı
- Taxonomy truth UI içinde dağınık üretilmemeli

---

# PHASE-08 — Admin / Creator / Supplier / Support Panel Readiness

## Amaç

Platformun yönetim ve operasyon yüzeylerini production-readiness seviyesine getirmek.

## Kapsam

- admin sistemi
- fenomen yönetim sistemi
- fenomen mağaza yönetim paneli
- tedarikçi panel sistemi
- tedarikçi yönetim sistemi
- sipariş operasyon sistemi
- destek ticket operasyon sistemi
- moderation/risk/finance/admin queues
- protected action + audit-backed admin actions

## Önceden Yapılmışlar

- App/panel shell foundation
- Protected route hardening
- Admin/creator route protection
- PX-HAVUZ-04 supplier intake + admin review surface
- PX-FENOMEN-02 creator store product management
- PX-FENOMEN-05 post/follow feed
- P20 Support / Ticket Foundation
- moderation/risk/support foundations

## Bu Fazda Yapılacaklar

- Admin control tower MVP scope belirlenecek
- Creator application/lifecycle yönetimi doğrulanacak
- Creator panel product/media/story/post/message/performance modülleri netleştirilecek
- Supplier panel product upload/stock/base price/order fulfillment modülleri netleştirilecek
- Supplier management approval/restrict/suspend lifecycle doğrulanacak
- Support ticket queue/SLA/escalation tasarlanacak
- Finance/risk/moderation admin queues ayrılacak
- Panel direct write yasağı protected command modeliyle kontrol edilecek
- Her kritik panel action audit zorunluluğu değerlendirilecek

## Kapsam Dışı

- Full public storefront polish
- Deep BI dashboard
- Production deploy

## Kapanış Kanıtı

- panel route protection review
- protected action review
- admin/creator/supplier permission review
- targeted panel smoke
- audit evidence review

## Kapanış Şartı

- Panel direct write olmamalı
- Admin güçlü ama sınırsız olmamalı
- Creator/supplier kendi scope’u dışına çıkmamalı
- Support sosyal mesajlaşma ile karışmamalı

---

# PHASE-09 — Risk / Fraud / Analytics / Notification Readiness

## Amaç

Risk, fraud, abuse, analytics, event, audit, outbox ve notification sistemlerinin production-readiness borçlarını kapatmak.

## Kapsam

- fraud/risk/abuse
- social abuse
- commerce abuse
- coupon abuse
- point abuse
- payout abuse
- analytics
- event/audit/outbox
- notification delivery
- preference/consent center
- distributed rate limit / WAF
- worker/retry/DLQ

## Önceden Yapılmışlar

- P42 Risk/Fraud Foundation
- HARDENING-06 Risk/Moderation/Abuse PASS WITH LIMITATION
- HARDENING-08 Analytics/Event/Audit/Outbox PASS WITH LIMITATION
- HARDENING-08B Notification Guard/Provider Boundary
- HARDENING-09 provider boundary
- HARDENING-10C10 payment reconciliation audit/outbox evidence

## Bu Fazda Yapılacaklar

- Full fraud scoring scope belirlenecek
- Auto hold/block kararları scope’lanacak
- Payout/finance abuse workflow açılacak
- Coupon/point abuse senaryoları netleşecek
- Distributed rate limit/WAF ihtiyacı kararlaştırılacak
- Analytics event producer coverage genişletilecek
- Outbox broker/worker/retry/DLQ production stratejisi belirlenecek
- Notification real provider ve callback strategy netleştirilecek
- Preference/consent center scope belirlenecek

## Kapsam Dışı

- Payment order handoff implementation
- Frontend UI final polish
- Deployment final release gate

## Kapanış Kanıtı

- risk signal smoke
- analytics smoke
- event/outbox smoke
- notification provider smoke
- abuse scenario tests
- rate limit/replay guard review

## Kapanış Şartı

- Risk sistemi ceza makinesi değil, kontrollü koruma sistemi olarak kalmalı
- Analytics business truth owner olmamalı
- Notification recipient spoof riski kapalı olmalı
- Outbox delivery guarantee iddiası varsa worker kanıtı olmalı

---

# PHASE-10 — Frontend / UX / Mobile Surface Readiness

## Amaç

Kullanıcı, creator, supplier ve admin yüzeylerini gerçek ürün deneyimi seviyesinde hazır hale getirmek.

## Kapsam

- web storefront
- mobile-first responsive davranış
- PDP
- PLP
- search
- cart
- checkout
- payment
- order tracking
- return/refund
- story/video/post/follow
- support
- creator panel
- supplier panel
- admin panel
- accessibility
- performance
- error/degraded UI

## Önceden Yapılmışlar

- web shell
- panel shell
- BFF read routes
- catalog/search/cart/checkout/order/story/post foundations

## Bu Fazda Yapılacaklar

- Her ana yüzey için user-ready flow kontrolü yapılacak
- Mobile-first kritik akışlar doğrulanacak
- Error/degraded state UI’ları doğrulanacak
- Payment unknown-result UI davranışı netleştirilecek
- Order tracking ve support bridge UI doğrulanacak
- Creator/supplier/admin panel kullanım akışı doğrulanacak
- Performance ve temel accessibility kontrolü yapılacak
- Full visual polish kapsamı net şekilde ayrılacak

## Kapsam Dışı

- Yeni backend business logic
- Yeni provider integration
- Yeni financial lifecycle

## Kapanış Kanıtı

- surface walkthrough
- critical UI smoke
- responsive/mobile check
- error state review
- accessibility/performance minimum check

## Kapanış Şartı

- Kritik user journey’lerde boş/ölü yüzey kalmamalı
- UI truth üretmemeli
- Degraded/error state kullanıcıyı yanıltmamalı

---

# PHASE-11 — Critical Journey Acceptance

## Amaç

Platformun 13 kritik journey’sini success, fail, rollback/retry, guard, audit ve analytics etkileriyle doğrulamak.

## Kapsam

1. search → PDP
2. PDP → cart
3. cart → checkout
4. checkout → payment
5. payment → order
6. order → shipment
7. delivery → review/story eligibility
8. delivery → return/refund impact
9. coupon/campaign application
10. reward point flow
11. creator onboarding
12. supplier onboarding
13. support/moderation/fraud escalations

## Önceden Yapılmışlar

- Core commerce smoke
- catalog/search smoke
- payment/reconciliation smoke
- risk/moderation smoke
- event/outbox smoke
- critical journey checklist ve acceptance criteria pack

## Bu Fazda Yapılacaklar

- Her journey için minimum dataset hazırlanacak
- Success case çalıştırılacak
- Fail case çalıştırılacak
- Rollback/retry/unknown-result davranışı test edilecek
- Permission/guard etkisi kontrol edilecek
- Analytics/audit visibility kontrol edilecek
- Release blocker veren journey’ler işaretlenecek

## Kapsam Dışı

- Yeni feature üretmek
- Büyük UI redesign
- Provider production deploy

## Kapanış Kanıtı

- journey acceptance report
- targeted integration/E2E
- fail case proof
- audit/event/analytics proof
- release blocker review

## Kapanış Şartı

- 13 journey’nin tamamı PASS veya kontrollü PASS WITH LIMITATION almalı
- Release blocker journey kalmamalı
- Unknown-result ve rollback davranışları belirsiz kalmamalı

---

# PHASE-12 — Deployment / Observability / Security / Release Gate

## Amaç

Production-ready iddiası vermeden önce deployment, security, observability, config, secrets, rollback ve release gate kontrollerini kapatmak.

## Kapsam

- production environment
- CI/CD
- migrations
- secrets/config
- observability
- logging/tracing/metrics
- alerting
- backup/restore
- rollback
- rate limit/WAF
- provider credentials
- release checklist
- smoke/regression final suite

## Önceden Yapılmışlar

- local runtime foundation
- Docker Compose local stack
- env schema foundation
- health smoke
- observability package foundation
- hardening smoke runners

## Bu Fazda Yapılacaklar

- Production env readiness kontrol edilecek
- Secrets/config policy uygulanacak
- Migration apply/rollback planı doğrulanacak
- Observability dashboard/log/trace/alert minimum set hazırlanacak
- Provider credential management doğrulanacak
- Worker runtime monitoring planı yapılacak
- Backup/restore ve incident response planı hazırlanacak
- Final smoke/regression suite çalıştırılacak
- Go / No-Go release kararı verilecek

## Kapsam Dışı

- Yeni business feature
- Yeni social surface
- Yeni finance model

## Kapanış Kanıtı

- deployment checklist
- migration checklist
- secret/config review
- observability review
- final smoke/regression
- critical journey final evidence
- release blocker register closed

## Kapanış Şartı

- Release blocker kalmamalı
- Production-ready iddiası ancak bu faz PASS verirse yapılabilir

---

## 7. Fazlar Arası Bağımlılıklar

### Zorunlu Sıralı Bağımlılıklar

```text
PHASE-00 → PHASE-01 → PHASE-02 → PHASE-03 → PHASE-04 → PHASE-05
```

Commerce ve payment/finance zinciri için bu sıra korunmalıdır.

### Paralel Hazırlanabilecek Fazlar

Aşağıdaki fazlar tasarım/kontrol seviyesinde paralel hazırlanabilir; ancak kapanışları bağımlılığa göre verilmelidir:

```text
PHASE-06 Social/Content
PHASE-07 Search/Catalog
PHASE-08 Panels
PHASE-09 Risk/Analytics/Notification
PHASE-10 Frontend/UX
```

### En Son Kapanacak Fazlar

```text
PHASE-11 Critical Journey Acceptance
PHASE-12 Deployment / Release Gate
```

Bu iki faz tüm önceki fazlara bağlıdır.

---

## 8. Release Blocker Öncelik Modeli

Bu master plan içinde aşağıdaki alanlar yüksek öncelikli release blocker adayıdır:

1. Payment provider live/sandbox doğrulama
2. Payment succeeded → order handoff
3. Reconciliation production runtime
4. Duplicate payment/order idempotency
5. Refund / settlement / payout E2E
6. PX-HAVUZ-05 PARTIAL build borcu
7. Critical journey acceptance
8. Deployment / secrets / observability / rollback gate
9. Frontend checkout/payment/order tracking yüzeyleri
10. Admin/operation kritik panel action’ları

Bu maddeler `09-RELEASE_BLOCKER_REGISTER.md` içinde ayrı takip edilecektir.

---

## 9. Test Yaklaşımı

Test yaklaşımı risk bazlıdır.

Her küçük işte tam test zorunlu değildir.

Ancak faz kapanışlarında uygun kanıt zorunludur.

### Planlama Fazları

- sistem/kayıt eşleştirme
- checklist
- risk ayrımı

### Domain/Kod Etkili Fazlar

- source review
- boundary review
- typecheck/build
- targeted smoke
- integration/acceptance test

### Release Fazları

- full critical journey acceptance
- regression
- deployment smoke
- monitoring/rollback evidence

---

## 10. Nihai Karar

Bu master plan ile production-readiness yol haritası aşağıdaki şekilde başlatılır:

```text
GO — Production-readiness fazları kontrollü, kayıt bazlı, owner-boundary güvenli ve risk bazlı test yaklaşımıyla başlatılabilir.
```

Sıradaki üretilecek dosyalar:

1. `04-PRODUCTION_READINESS_RISK_REGISTER.md`
2. `09-RELEASE_BLOCKER_REGISTER.md`
3. `PHASE-00-BASELINE-MAPPING-AND-RULE-LOCK.md`

---

## 11. Kapanış Notu

Bu dosya production-ready kararı vermez.

Bu dosya production-ready olana kadar izlenecek resmi faz planını tanımlar.

Production-ready iddiası yalnız şu şartla verilebilir:

```text
PHASE-12 — Deployment / Observability / Security / Release Gate PASS
```
