# 04-PRODUCTION_READINESS_RISK_REGISTER.md

## 1. Dosyanın Amacı

Bu dosya, Hedihup platformunun production-readiness sürecinde takip edilecek açık riskleri, limitation’ları, teknik borçları ve release blocker adaylarını tek yerde toplamak için hazırlanmıştır.

Bu dosya 65 aktif risk dosyasının yerine geçmez.

Bu dosyanın amacı:

- production-readiness açısından önemli riskleri görünür hale getirmek
- her riskin hangi fazda ele alınacağını belirtmek
- riskleri önem seviyesine göre ayırmak
- release blocker adaylarını erken işaretlemek
- PASS WITH LIMITATION ve PARTIAL kayıtlarının sonraki fazlarda kaybolmasını önlemek
- faz kapanışlarında risklerin kapatılıp kapatılmadığını kontrol etmektir

---

## 2. Risk Sınıfları

Riskler dört ana sınıfta takip edilir.

### 2.1 Release Blocker

Yayına çıkışı engelleyebilecek risktir.

Bu risk kapanmadan veya resmi istisna kararı alınmadan production-ready iddiası verilemez.

### 2.2 Production Readiness Debt

Production-readiness için kapatılması gereken borçtur.

Tek başına release blocker olmayabilir; ancak bir fazın PASS kapanmasını engelleyebilir.

### 2.3 Monitored Limitation

Bilinçli olarak izlenen sınırlamadır.

Yayını tek başına engellemeyebilir; ancak kayıt altında kalmalı ve etkisi takip edilmelidir.

### 2.4 Verification Required

Kayıtlarda uygulama izi vardır; ancak production-readiness açısından ek doğrulama gerekir.

---

## 3. Risk Seviyeleri

| Seviye | Anlam |
|---|---|
| CRITICAL | Yayına çıkışı doğrudan engelleyebilir |
| HIGH | Faz kapanışını veya kritik journey’yi etkileyebilir |
| MEDIUM | Production-readiness borcudur; izlenmelidir |
| LOW | Takip edilmelidir, ancak ana akışı tek başına durdurmaz |

---

## 4. Risk Kayıt Formatı

Her risk şu formatta takip edilir:

```text
Risk Kodu:
Başlık:
Sınıf:
Seviye:
Kaynak:
Etkilediği Sistemler:
Açıklama:
Gerekli Aksiyon:
Hedef Faz:
Kapanış Kriteri:
Durum:
Not:
```

Durum değerleri:

- `OPEN`
- `IN PROGRESS`
- `CLOSED`
- `DEFERRED`
- `ACCEPTED LIMITATION`

---

# 5. Aktif Production-Readiness Riskleri

---

## PRR-001 — Production-ready iddiası henüz yok

**Sınıf:** Release Blocker  
**Seviye:** CRITICAL  
**Kaynak:** 63 / 64 / 65 kayıtları, current baseline  
**Etkilediği Sistemler:** Tüm platform

### Açıklama

Platform foundation-level release candidate seviyesine gelmiştir; ancak production-ready iddiası verilmemiştir.

Bu durum bilinçli ve doğru bir kayıt durumudur.

### Gerekli Aksiyon

Production-ready kararı yalnız PHASE-12 release gate sonunda verilebilir.

### Hedef Faz

PHASE-12 — Deployment / Observability / Security / Release Gate

### Kapanış Kriteri

- Tüm release blocker’lar kapalı olmalı
- Critical journey acceptance tamamlanmalı
- Deployment / rollback / observability / secrets gate kapanmalı
- Final Go / No-Go kararı verilmiş olmalı

**Durum:** OPEN

---

## PRR-002 — Canlı PayTR / gerçek provider request yok

**Sınıf:** Release Blocker  
**Seviye:** CRITICAL  
**Kaynak:** HARDENING-09, HARDENING-10, HARDENING-10C10  
**Etkilediği Sistemler:** Ödeme, provider, callback, reconciliation

### Açıklama

Provider boundary foundation vardır. PayTR status inquiry mapping ve reconciliation foundation vardır. Ancak gerçek PayTR HTTP çağrısı, canlı/sandbox provider request ve production provider runtime doğrulanmamıştır.

### Gerekli Aksiyon

- PayTR sandbox / live test stratejisi netleştirilmeli
- Merchant credential yönetimi doğrulanmalı
- Provider request ve response canonical mapping canlı senaryo ile doğrulanmalı
- Timeout / unknown-result / retry davranışı test edilmeli

### Hedef Faz

PHASE-03 — Payment / Provider / Callback / Reconciliation Readiness

### Kapanış Kriteri

- PayTR provider integration strategy onaylandı
- Sandbox veya gerçek test ortamı ile en az kontrollü E2E doğrulandı
- Provider sonucu business truth sayılmadan owner command zincirine bağlandı
- Unknown-result / timeout / retry davranışı kanıtlandı

**Durum:** OPEN

---

## PRR-003 — Payment succeeded → Order handoff henüz açılmadı

**Sınıf:** Release Blocker  
**Seviye:** CRITICAL  
**Kaynak:** HARDENING-10C10  
**Etkilediği Sistemler:** Payment, Order, Checkout, Event/Outbox

### Açıklama

10C10 hattında payment reconciliation ile controlled payment mutation yapılabilmektedir. Ancak order handoff özellikle kapsam dışında tutulmuştur.

Korunan doğru sınır:

```text
Payment succeeded ≠ order created
```

Ancak production için successful payment sonrası order owner command zinciri güvenli biçimde kurulmalıdır.

### Gerekli Aksiyon

- 10C11 inventory / boundary review hazırlanmalı
- Order owner hangi command’i kabul eder netleşmeli
- Duplicate payment success → duplicate order engellenmeli
- Handoff idempotency key modeli belirlenmeli
- Risk hold varsa handoff davranışı tanımlanmalı
- Event/outbox doğrudan business mutation olmamalı

### Hedef Faz

PHASE-03 ve PHASE-04

### Kapanış Kriteri

- Payment success sonrası order handoff owner-boundary-safe çalışıyor
- Duplicate order üretilmiyor
- Failed/cancelled/unknown payment order oluşturamıyor
- Handoff audit/event/outbox sınırı net
- Acceptance senaryosu PASS

**Durum:** OPEN

---

## PRR-004 — Reconciliation production runtime / scheduler / queue yok

**Sınıf:** Release Blocker  
**Seviye:** HIGH  
**Kaynak:** HARDENING-10C10  
**Etkilediği Sistemler:** Payment reconciliation, worker runtime, outbox

### Açıklama

10C10 hattında reconciliation task, repository, dry-run worker, controlled mutation ve audit/outbox evidence vardır. Ancak production scheduler, queue, worker claim/retry/concurrency ve background runtime yoktur.

### Gerekli Aksiyon

- Reconciliation worker runtime modeli belirlenmeli
- Claim / lock / retry / backoff / max attempt stratejisi yazılmalı
- Concurrent worker duplicate mutation engeli doğrulanmalı
- Observability ve alerting eklenmeli

### Hedef Faz

PHASE-03 ve PHASE-12

### Kapanış Kriteri

- Worker runtime production-safe çalışıyor
- Duplicate worker aynı payment üzerinde ikinci mutation üretmiyor
- Retry/backoff ve manual review davranışı net
- Monitoring/logging kanıtı var

**Durum:** OPEN

---

## PRR-005 — PX-HAVUZ-05 PARTIAL / build borcu

**Sınıf:** Release Blocker Adayı  
**Seviye:** HIGH  
**Kaynak:** PX_DOMAIN_IMPLEMENTATION_REFERENCE_RECORD  
**Etkilediği Sistemler:** Havuz, creator store commercial product binding, commerce core

### Açıklama

PX-HAVUZ-05 smoke testi PASS olsa da `pnpm run build` aşamasında `ListSupplierSubmittedProductsQuery` kaynaklı hata raporlanmıştır. Bu kayıt PASS gibi ele alınamaz.

### Gerekli Aksiyon

- PX-HAVUZ-05 kaynak ve build hatası incelenmeli
- Contract/type uyumu düzeltilmeli
- `pnpm run build` PASS alınmalı
- İlgili smoke ve regression kontrol edilmeli

### Hedef Faz

PHASE-02 — Commerce Core Readiness

### Kapanış Kriteri

- Build PASS
- İlgili typecheck PASS
- Creator store commercial product binding boundary review PASS
- Kapanış kararı güncellendi

**Durum:** OPEN

---

## PRR-006 — ProviderReference DB-level uniqueness eksikliği

**Sınıf:** Production Readiness Debt  
**Seviye:** HIGH  
**Kaynak:** HARDENING-10C10  
**Etkilediği Sistemler:** Payment, reconciliation, provider callback

### Açıklama

providerReference üzerinden lookup vardır; ancak DB-level uniqueness guarantee eksikliği risk olarak kaydedilmiştir. Büyük veri ve duplicate provider reference durumlarında yanlış payment lookup veya ambiguity riski oluşabilir.

### Gerekli Aksiyon

- `provider_name + provider_reference` composite uniqueness ihtiyacı değerlendirilmeli
- Migration ihtiyacı belirlenmeli
- Existing data impact kontrol edilmeli
- Reconciliation lookup ambiguity davranışı yazılmalı

### Hedef Faz

PHASE-03

### Kapanış Kriteri

- Unique constraint veya alternatif deterministic lookup strategy onaylandı
- Ambiguous providerReference davranışı manual review’a düşüyor
- Migration gerekiyorsa uygulandı ve test edildi

**Durum:** OPEN

---

## PRR-007 — Reconciliation task modelinde expected amount/currency alanları yok

**Sınıf:** Production Readiness Debt  
**Seviye:** MEDIUM  
**Kaynak:** HARDENING-10C10  
**Etkilediği Sistemler:** Payment reconciliation

### Açıklama

10C10 worker dry-run input seviyesinde expected amount/currency ister. Task persistence modelinde bu alanlar bulunmaz. Bu, production worker runtime’da varsayım üretmemek açısından doğru; ancak production flow’da task’ın doğrulama girdisini nasıl alacağı netleşmelidir.

### Gerekli Aksiyon

- Reconciliation task modeline expected amount/currency eklenmeli mi değerlendirilmeli
- Alternatif olarak payment/attempt üzerinden canonical expected value okunmalı
- Worker varsayım üretmemeli
- Amount/currency mismatch manual review davranışı korunmalı

### Hedef Faz

PHASE-03

### Kapanış Kriteri

- Expected amount/currency kaynağı netleşti
- Worker input varsayımı kaldırıldı veya güvenli hale getirildi
- Amount/currency validation smoke PASS

**Durum:** OPEN

---

## PRR-008 — Outbox event delivery guarantee / consumer yok

**Sınıf:** Production Readiness Debt  
**Seviye:** HIGH  
**Kaynak:** HARDENING-08, HARDENING-10C10  
**Etkilediği Sistemler:** Event, outbox, audit, notification, order handoff adayları

### Açıklama

Outbox lifecycle ve idempotency foundation vardır. Payment reconciliation audit/outbox evidence üretmiştir. Ancak production broker, distributed worker, retry scheduler, backoff ve DLQ yoktur.

### Gerekli Aksiyon

- Outbox delivery modeli netleştirilmeli
- Worker / consumer / retry / DLQ stratejisi belirlenmeli
- Delivery guarantee iddiası varsa kanıtlanmalı
- Event business truth değildir kuralı korunmalı

### Hedef Faz

PHASE-09 ve PHASE-12

### Kapanış Kriteri

- Outbox consumer production-safe tasarlandı
- Retry/DLQ davranışı var
- Duplicate delivery duplicate mutation üretmiyor
- Observability var

**Durum:** OPEN

---

## PRR-009 — Audit append idempotency Postgres tarafında güçlendirilmeli

**Sınıf:** Production Readiness Debt  
**Seviye:** MEDIUM  
**Kaynak:** HARDENING-10C10  
**Etkilediği Sistemler:** Audit, payment reconciliation, compliance evidence

### Açıklama

10C10 kayıtlarında audit evidence için deterministic auditId ve idempotency key kullanıldığı, ancak mevcut audit repository API’sinde genel idempotency key conflict handling olmadığı belirtilmiştir. Postgres duplicate audit append warning üretebilir.

### Gerekli Aksiyon

- Audit idempotency contract değerlendirilmeli
- Duplicate audit append davranışı Postgres üzerinde test edilmeli
- Gerekirse repository conflict handling güçlendirilmeli

### Hedef Faz

PHASE-09

### Kapanış Kriteri

- Duplicate audit append deterministik ve güvenli
- Warning beklenen davranışsa kayda alındı
- Audit business truth değildir sınırı korundu

**Durum:** OPEN

---

## PRR-010 — Refund / settlement / payout E2E production readiness yok

**Sınıf:** Release Blocker Adayı  
**Seviye:** HIGH  
**Kaynak:** P18, finance/settlement/payout hardening kayıtları  
**Etkilediği Sistemler:** Refund, settlement, payout, finance

### Açıklama

Refund, settlement ve payout foundation hatları vardır. Ancak return/refund sonrası settlement adjustment, payable, payout batch ve gerçek payout provider E2E production seviyesinde kapatılmamıştır.

### Gerekli Aksiyon

- Return approved ≠ refund completed ayrımı doğrulanmalı
- Refund completed → settlement adjustment akışı kanıtlanmalı
- Settled ≠ payable ayrımı korunmalı
- Payable ≠ paid_out ayrımı korunmalı
- Payout provider gerçek/sandbox stratejisi belirlenmeli

### Hedef Faz

PHASE-05

### Kapanış Kriteri

- Refund → settlement adjustment test PASS
- Settlement → payout test PASS
- Payout provider boundary / sandbox doğrulandı
- Finance owner boundary PASS

**Durum:** OPEN

---

## PRR-011 — Payout gerçek ödeme çıkışı yok

**Sınıf:** Release Blocker Adayı  
**Seviye:** HIGH  
**Kaynak:** HARDENING-09F, payout system records  
**Etkilediği Sistemler:** Payout, finance, risk

### Açıklama

Payout provider boundary foundation vardır; ancak gerçek para çıkışı yapılmamıştır. Payout provider result business truth sayılmamıştır.

### Gerekli Aksiyon

- Payout provider seçimi / sandbox stratejisi belirlenmeli
- Batch runtime, retry, failure, hold/release davranışı yazılmalı
- Bank/account verification modeli belirlenmeli
- Risk hold payout öncesi çalışmalı

### Hedef Faz

PHASE-05 ve PHASE-12

### Kapanış Kriteri

- Payout batch sandbox/controlled provider test PASS
- Failed payout retry davranışı net
- Risk hold payout çıkışını engelliyor
- Audit ve finance records oluşuyor

**Durum:** OPEN

---

## PRR-012 — Ranking / recommendation owner implementation borcu

**Sınıf:** Production Readiness Debt  
**Seviye:** HIGH  
**Kaynak:** HARDENING-07 limitation, ranking system file  
**Etkilediği Sistemler:** Keşfet, search result ordering, home feed, recommendation

### Açıklama

Search candidate ve index projection foundation vardır. Ancak ranking/recommendation ayrı owner borcu olarak kalmıştır. M9 candidate üretir, M8 final ranking yapar ayrımı korunmalıdır.

### Gerekli Aksiyon

- Ranking owner initial production scope belirlenmeli
- Search candidate → ranking handoff netleşmeli
- Suppression/demotion/boost kuralları owner boundary içinde kalmalı
- Manual override sınırlandırılmalı

### Hedef Faz

PHASE-07

### Kapanış Kriteri

- M8/M9 ayrımı korunuyor
- Ranking BFF veya search owner içinde yapılmıyor
- Fallback feed davranışı net
- No hidden/unavailable leak test PASS

**Durum:** OPEN

---

## PRR-013 — Category taxonomy owner borcu

**Sınıf:** Production Readiness Debt  
**Seviye:** HIGH  
**Kaynak:** HARDENING-07 limitation, taxonomy system file  
**Etkilediği Sistemler:** Category, PLP, product acceptance, search, filtering

### Açıklama

Category/PLP foundation vardır; ancak kategori/taksonomi owner borcu kayıtlıdır. Kategori ağacı UI içinde veya dağınık şekilde üretilemez.

### Gerekli Aksiyon

- Taxonomy owner modülü netleşmeli
- Category tree, alias, attribute set, filter set, variant rule set yönetimi tanımlanmalı
- Ürün kabul hattı taxonomy truth’a bağlanmalı
- Search/PLP facet davranışı taxonomy ile uyumlu olmalı

### Hedef Faz

PHASE-07

### Kapanış Kriteri

- Taxonomy truth owner net
- PLP/filter/facet taxonomy’den besleniyor
- Ürün kabul kategori düzeltmesi canonical taxonomy’ye yazılıyor
- Admin taxonomy yönetim ihtiyacı PHASE-08 ile bağlı

**Durum:** OPEN

---

## PRR-014 — OpenSearch production ops / index worker reliability yok

**Sınıf:** Production Readiness Debt  
**Seviye:** HIGH  
**Kaynak:** HARDENING-07 limitation  
**Etkilediği Sistemler:** Search, indexing, PLP, discovery

### Açıklama

Search index projection foundation vardır. Ancak OpenSearch production ops, bootstrap, event/outbox consumer, worker reliability ve realtime projection sync açık borçtur.

### Gerekli Aksiyon

- Index bootstrap stratejisi yazılmalı
- Reindex ve recovery planı belirlenmeli
- Event/outbox consumer veya sync worker netleşmeli
- Pricing/stock/media projection sync güvenceye alınmalı

### Hedef Faz

PHASE-07 ve PHASE-12

### Kapanış Kriteri

- OpenSearch index lifecycle planı var
- Worker failure/retry davranışı var
- Hidden/unavailable/stale product leak engelleniyor
- Search degraded mode net

**Durum:** OPEN

---

## PRR-015 — Media production pipeline eksik

**Sınıf:** Production Readiness Debt  
**Seviye:** HIGH  
**Kaynak:** P30, HARDENING-04, media system file  
**Etkilediği Sistemler:** Media, story, post, PDP, creator panel

### Açıklama

Media/asset foundation ve runtime remediation vardır. Ancak gerçek object storage, CDN, transcoding, derivative generation, media security scan ve production media lifecycle net değildir.

### Gerekli Aksiyon

- Media storage strategy belirlenmeli
- Derivative/thumbnail/transcoding pipeline planlanmalı
- Raw upload ≠ publishable asset ayrımı korunmalı
- Moderation/policy gate media lifecycle’a bağlanmalı
- CDN/cache strategy belirlenmeli

### Hedef Faz

PHASE-06 ve PHASE-12

### Kapanış Kriteri

- Upload → processing → moderation → publishable asset lifecycle tanımlı
- Broken/unsafe media public surface’e çıkmıyor
- PDP/story/post media variants doğrulandı

**Durum:** OPEN

---

## PRR-016 — Full moderation panel UI yok

**Sınıf:** Production Readiness Debt  
**Seviye:** MEDIUM  
**Kaynak:** HARDENING-06 limitation  
**Etkilediği Sistemler:** Moderation, admin, content surfaces

### Açıklama

Moderation workflow foundation ve enforcement vardır. Ancak full moderation panel UI ve production review queue açık limitation’dır.

### Gerekli Aksiyon

- Moderation queue scope belirlenmeli
- Review/approve/reject/restrict/takedown actions protected command olmalı
- Audit zorunlu olmalı
- Social/content public visibility moderation-safe olmalı

### Hedef Faz

PHASE-06 ve PHASE-08

### Kapanış Kriteri

- Moderation panel actions owner boundary-safe
- Pending/rejected content public leak etmiyor
- Audit evidence oluşuyor

**Durum:** OPEN

---

## PRR-017 — Admin / Creator / Supplier panel production readiness eksik

**Sınıf:** Release Blocker Adayı  
**Seviye:** HIGH  
**Kaynak:** Admin, creator panel, supplier panel system files; PX records  
**Etkilediği Sistemler:** Admin, creator, supplier, support, operations

### Açıklama

Panel shell ve bazı route protection / domain panel foundation kayıtları vardır. Ancak tam admin control tower, creator panel ve supplier panel production readiness doğrulanmamıştır.

### Gerekli Aksiyon

- Admin panel kritik modülleri seçilmeli
- Creator panel mobile-first MVP netleşmeli
- Supplier panel product/stock/order workbench netleşmeli
- Panel direct write yasağı kontrol edilmeli
- Protected action + audit zorunluluğu değerlendirilmeli

### Hedef Faz

PHASE-08 ve PHASE-10

### Kapanış Kriteri

- Kritik panel aksiyonları protected command ile çalışıyor
- Panel direct write yok
- Creator/supplier scope dışına çıkamıyor
- Support/moderation/finance/risk queues ayrılmış

**Durum:** OPEN

---

## PRR-018 — Support ticket SLA / escalation production flow eksik

**Sınıf:** Production Readiness Debt  
**Seviye:** MEDIUM  
**Kaynak:** P20, support ticket system file, PX-KULLANICI-07  
**Etkilediği Sistemler:** Support, ticket ops, order ops, finance, moderation, risk

### Açıklama

Support/ticket foundation vardır. Ancak ticket queue, SLA, team assignment, escalation ve closure lifecycle production akışı ayrıca kapatılmalıdır.

### Gerekli Aksiyon

- Ticket türleri ve queues netleşmeli
- SLA ve priority model yazılmalı
- Finance/ops/moderation/risk escalation ayrılmalı
- Support sosyal mesajlaşma ile karışmamalı

### Hedef Faz

PHASE-08

### Kapanış Kriteri

- Ticket truth tek sistemde
- Social messaging support yerine geçmiyor
- Escalation owner boundaries net
- SLA visibility var

**Durum:** OPEN

---

## PRR-019 — Frontend / mobile critical surfaces production acceptance yok

**Sınıf:** Release Blocker Adayı  
**Seviye:** HIGH  
**Kaynak:** Current baseline, system files  
**Etkilediği Sistemler:** Web, mobile, panel, storefront

### Açıklama

Backend/BFF foundation ve bazı smoke testler vardır. Ancak tam storefront, mobile-first checkout/payment/order tracking, creator/supplier/admin panel yüzeyleri gerçek kullanıcı kabul seviyesinde doğrulanmamıştır.

### Gerekli Aksiyon

- Critical user journeys UI üzerinden yürütülmeli
- Mobile-first checkout/payment/order tracking kontrol edilmeli
- Error/degraded states doğrulanmalı
- Creator/supplier/admin panel minimum acceptance yapılmalı

### Hedef Faz

PHASE-10 ve PHASE-11

### Kapanış Kriteri

- Kritik user journeys UI surface üzerinden PASS
- Mobile/responsive minimum PASS
- Error/degraded UI kullanıcıyı yanıltmıyor
- UI truth üretmiyor

**Durum:** OPEN

---

## PRR-020 — Critical journey acceptance tamamlanmadı

**Sınıf:** Release Blocker  
**Seviye:** CRITICAL  
**Kaynak:** CRITICAL_JOURNEY_CHECKLIST, ACCEPTANCE_CRITERIA_PACK  
**Etkilediği Sistemler:** Tüm platform

### Açıklama

13 kritik journey tanımlıdır. Bazı journey’ler foundation/smoke seviyesinde doğrulanmıştır. Ancak production-readiness için success, fail, rollback/retry, guard, analytics ve audit etkileriyle tam acceptance yapılmalıdır.

### Gerekli Aksiyon

13 kritik journey için acceptance çalıştırılmalı:

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

### Hedef Faz

PHASE-11

### Kapanış Kriteri

- Her journey success case PASS
- Fail case PASS
- rollback/retry/unknown-result davranışı net
- permission/guard etkisi doğrulandı
- analytics/audit visibility doğrulandı
- release blocker journey kalmadı

**Durum:** OPEN

---

## PRR-021 — Deployment / observability / security release gate yok

**Sınıf:** Release Blocker  
**Seviye:** CRITICAL  
**Kaynak:** Current baseline, test strategy, release planning  
**Etkilediği Sistemler:** Tüm platform

### Açıklama

Local runtime, smoke runner ve foundation observability vardır. Ancak production deployment, secrets/config, observability, alerting, migration, rollback ve final release gate henüz kapanmamıştır.

### Gerekli Aksiyon

- Production environment readiness
- CI/CD pipeline
- Secrets/config hardening
- Migration apply/rollback planı
- Logging/tracing/metrics/alerting
- Backup/restore
- Incident response
- Final smoke/regression
- Go/No-Go release checklist

### Hedef Faz

PHASE-12

### Kapanış Kriteri

- Release blocker register closed
- Deployment checklist PASS
- Observability minimum PASS
- Rollback planı var
- Final regression PASS
- Go decision verildi

**Durum:** OPEN

---

## PRR-022 — Distributed rate limit / WAF eksik

**Sınıf:** Production Readiness Debt  
**Seviye:** HIGH  
**Kaynak:** HARDENING-06, HARDENING-10 limitations  
**Etkilediği Sistemler:** Callback, fraud, public endpoints, auth, checkout

### Açıklama

Process-local rate/abuse guard foundation vardır. Ancak distributed rate limit / WAF yokluğu özellikle public callback ve abuse yüzeylerinde risk oluşturur.

### Gerekli Aksiyon

- Public webhook/callback endpoint protection planı
- Distributed rate limit stratejisi
- WAF veya edge protection ihtiyacı
- Abuse/fraud signal ile ilişki

### Hedef Faz

PHASE-09 ve PHASE-12

### Kapanış Kriteri

- Public critical endpoints distributed protection altında
- Replay/freshness/signature guard ile birlikte çalışıyor
- Monitoring/alerting var

**Durum:** OPEN

---

## PRR-023 — Notification real provider / preference center yok

**Sınıf:** Production Readiness Debt  
**Seviye:** MEDIUM  
**Kaynak:** HARDENING-08B, HARDENING-09E  
**Etkilediği Sistemler:** Notification, support, order, campaign, user engagement

### Açıklama

Notification foundation ve provider boundary vardır. Ancak gerçek email/SMS/push provider, delivery callback ve preference/consent center yoktur.

### Gerekli Aksiyon

- İlk release notification provider scope belirlenmeli
- Email/SMS/push hangileri açılacak netleşmeli
- Preference/consent center minimum scope yazılmalı
- Delivery failure handling ve observability eklenmeli

### Hedef Faz

PHASE-09

### Kapanış Kriteri

- Notification provider production/sandbox doğrulandı
- Recipient spoof guard korunuyor
- Preference/consent minimum model net
- Delivery attempt logging var

**Durum:** OPEN

---

## PRR-024 — Reward point ledger / point market production readiness eksik

**Sınıf:** Production Readiness Debt  
**Seviye:** MEDIUM  
**Kaynak:** Ödül puanı ve puan market sistem dosyaları, PX-KULLANICI-06  
**Etkilediği Sistemler:** Reward points, point market, fraud, finance

### Açıklama

Customer points/reward eligibility foundation vardır. Ancak pending/vested/spendable lifecycle, point reversal on return/refund, point market spending ve fraud controls production readiness seviyesinde doğrulanmamıştır.

### Gerekli Aksiyon

- Point lifecycle ledger modeli netleşmeli
- Delivery/review/story reward eventleri doğrulanmalı
- Return/refund sonrası point reversal tanımlanmalı
- Point market stock/limit/spend transaction belirlenmeli
- Abuse/fraud kontrolü eklenmeli

### Hedef Faz

PHASE-05 ve PHASE-09

### Kapanış Kriteri

- Pending/vested/spendable ayrımı çalışıyor
- Return/refund point impact net
- Point market spend idempotent ve fraud-aware
- Admin controls net

**Durum:** OPEN

---

## PRR-025 — Coupon / campaign finance impact doğrulanmalı

**Sınıf:** Production Readiness Debt  
**Seviye:** HIGH  
**Kaynak:** Kupon/kampanya sistem dosyaları, commerce/finance records  
**Etkilediği Sistemler:** Coupon, campaign, checkout, order, finance, settlement

### Açıklama

Pricing foundation vardır; kampanya/kupon sistemleri hedef mimaride kritik yer tutar. Ancak sponsor cost model, checkout snapshot, order snapshot ve settlement impact production-readiness seviyesinde doğrulanmalıdır.

### Gerekli Aksiyon

- Kupon sponsor modeli netleşmeli
- Platform vs creator funded discount ayrımı yazılmalı
- Checkout/order snapshot doğrulanmalı
- Settlement impact hesaplanmalı
- Abuse/fraud signal bağlantısı yapılmalı

### Hedef Faz

PHASE-02, PHASE-05, PHASE-09

### Kapanış Kriteri

- Coupon/campaign application acceptance PASS
- Finance impact doğru tarafa yansıyor
- Discount sponsor bilinmiyor durumu yok
- Abuse scenario kontrol edildi

**Durum:** OPEN

---

## 6. Risk Dağılımı Fazlara Göre

| Faz | Ana Riskler |
|---|---|
| PHASE-01 | owner boundary, guard, permission, transition ihlalleri |
| PHASE-02 | PX-HAVUZ-05, stock/price/snapshot, coupon/campaign |
| PHASE-03 | PayTR live, callback, reconciliation runtime, order handoff |
| PHASE-04 | order lifecycle, fulfillment, delivery, return/refund |
| PHASE-05 | settlement, payout, reward points, financial adjustment |
| PHASE-06 | media, moderation, review/story eligibility |
| PHASE-07 | search/indexing, ranking, taxonomy |
| PHASE-08 | admin/creator/supplier/support panels |
| PHASE-09 | fraud, analytics, outbox, notification, rate limit |
| PHASE-10 | frontend/mobile/panel UX readiness |
| PHASE-11 | critical journey acceptance |
| PHASE-12 | deployment, observability, security, release gate |

---

## 7. Risk Yönetim Kuralı

Her faz kapanışında bu dosya güncellenmelidir.

Kapanan riskler `CLOSED` yapılır.

Devreden risklerin hedef fazı güncellenir.

Yeni bulunan riskler bu dosyaya eklenir.

Release blocker’a dönüşen riskler ayrıca `09-RELEASE_BLOCKER_REGISTER.md` dosyasına işlenir.

---

## 8. Kapanış Notu

Bu dosya V1 production-readiness risk register kaydıdır.

Bu dosya production-ready kararı vermez.

Bu dosya, production-ready kararı verilebilmesi için kapatılması veya resmi olarak kabul edilmesi gereken riskleri izler.

Net karar:

```text
PRODUCTION_READINESS_RISK_REGISTER V1 hazırdır.
Sıradaki dosya: 09-RELEASE_BLOCKER_REGISTER.md
```
