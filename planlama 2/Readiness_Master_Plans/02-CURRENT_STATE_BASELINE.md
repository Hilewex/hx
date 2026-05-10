# 02-CURRENT_STATE_BASELINE.md

## 1. Dosyanın Amacı

Bu dosya, Hedihup platformunun production-readiness çalışmasına başlanmadan önceki resmi mevcut durumunu kilitlemek için hazırlanmıştır.

Bu dosya yeni roadmap değildir.

Bu dosyanın amacı:

- bugünkü gerçek uygulama seviyesini netleştirmek
- foundation, hardening, PX domain ve provider/callback/reconciliation kayıtlarını tek baseline altında toplamak
- hangi alanların yapılmış, hangi alanların sınırlı, hangi alanların eksik ve hangi alanların release blocker adayı olduğunu görünür hale getirmek
- sonraki production-readiness fazlarının hangi başlangıç gerçekliğine göre yazılacağını sabitlemek
- “yapılmış işi tekrar yapmak” ve “yapılmamış işi yapılmış sanmak” riskini azaltmaktır

---

## 2. Baseline Okuma Kuralı

Bu dosya aşağıdaki kaynakların birlikte okunmasıyla oluşturulmuştur:

- 54 sistem dosyası
- 63 / 64 / 65 birleşik kayıt dosyaları
- HARDENING 00–10 kayıtları
- HARDENING-10C10 PayTR Status Inquiry / Payment Reconciliation birleşik kaydı
- PX Domain Implementation Reference Record
- OWNER / GUARD / PERMISSION / TRANSITION anayasal dosyaları
- DoD / Acceptance / Critical Journey / Test Stratejisi dosyaları

Net kural:

```text
Bu baseline production-ready kararı değildir.
Bu baseline production-readiness çalışmasının başlangıç fotoğrafıdır.
```

---

## 3. En Üst Resmi Durum

### 3.1 Program Durumu

Kayıtlara göre platformda P01–P52 foundation coding roadmap tamamlanmıştır.

Foundation-level release candidate kabul edilmiştir.

Ancak bu kabul production-ready anlamına gelmez.

### 3.2 Resmi Production Kararı

```text
Production Readiness: NOT CLAIMED
```

Bu karar korunur.

Platform şu an:

```text
Foundation-level Release Candidate Accepted — PASS WITH LIMITATION
```

seviyesindedir.

### 3.3 Aktif Implementation Paketi

Kayıtlara göre aktif implementation paketi yoktur.

Sonraki çalışma artık eski roadmap’in devamı değil, mevcut gerçek duruma göre hazırlanacak yeni production-readiness fazlarıdır.

---

## 4. Ana Başarılan Katmanlar

### 4.1 Monorepo / Infra / Shared Foundation

Aşağıdaki foundation alanları yapılmış görünmektedir:

- monorepo foundation
- local runtime foundation
- shared packages foundation
- app shell foundation
- BFF temel omurga
- package/workspace yapısı
- temel build/typecheck disiplini
- smoke runner altyapısı

Durum:

```text
FOUNDATION DONE
```

Production-readiness notu:

- CI/CD, deployment, secrets/config, observability ve release rollback ayrı release gate fazında kontrol edilmelidir.

---

### 4.2 Auth / Access / Permission / Guard Foundation

Yapılanlar:

- auth/session foundation
- access/permission foundation
- protected action foundation
- permission guard integration
- panel/admin/creator route protection hardening
- social action permission enforcement
- commerce permission enforcement source-reconciled closure
- owner / guard / permission matrix yüklenmiş ve anayasal kaynak olarak kabul edilmiştir

Durum:

```text
FOUNDATION HARDENED
```

Açık dikkat noktaları:

- legacy actor header / `x-actor-id` kalıntıları daha önce monitored limitation olarak geçmiştir
- production auth/session/token runtime davranışı ayrı fazda doğrulanmalıdır
- permission ile eligibility karıştırılmamalıdır
- guest checkout sosyal hak açmaz

İlgili faz:

```text
PHASE-01 — Architecture Boundary / Owner / Guard Readiness
```

---

### 4.3 Commerce Core Foundation

Yapılanlar:

- catalog / PDP read foundation
- cart foundation
- pricing foundation
- stock foundation
- checkout foundation
- payment initiation foundation
- payment → order foundation
- order read/detail foundation
- shipment/delivery foundation
- cancel/return foundation
- refund foundation
- cart/checkout/payment/order/shipment persistence hardening
- core commerce journey smoke ve durability doğrulamaları

Durum:

```text
FOUNDATION + PERSISTENCE HARDENING DONE
```

Açık dikkat noktaları:

- payment initiation ilk kayıtlarda PASS WITH LIMITATION olarak geçmiştir
- checkout / payment / order zinciri production provider ve live reconciliation olmadan tam production-ready değildir
- stock reservation, price conflict, coupon/campaign impact ve full frontend E2E acceptance ayrı doğrulanmalıdır

İlgili fazlar:

```text
PHASE-02 — Commerce Core Readiness
PHASE-03 — Payment / Provider / Callback / Reconciliation Readiness
PHASE-04 — Order / Fulfillment / Delivery / Return / Refund Readiness
```

---

### 4.4 Persistence / Database Runtime Foundation

Yapılanlar:

- persistence foundation
- live DB runtime validation
- migration runner hardening
- cart/checkout persistence
- payment/order/shipment persistence
- return/refund persistence
- event/audit durability foundation
- reconciliation task persistence/repository foundation

Durum:

```text
PERSISTENCE FOUNDATION DONE WITH LIMITATIONS
```

Açık dikkat noktaları:

- bazı smoke’lar in-memory davranışı doğrulamaktadır
- bazı Postgres davranışları migration uygulanmış test DB üzerinde ayrıca doğrulanmalıdır
- reconciliation task modelinde expected amount/currency alanları bulunmadığı için worker input seviyesinde ister
- providerReference için DB-level uniqueness guarantee eksikliği kayıtlı limitation’dır

İlgili fazlar:

```text
PHASE-02
PHASE-03
PHASE-05
PHASE-12
```

---

## 5. Provider / Callback / Reconciliation Baseline

### 5.1 HARDENING-09 Provider Boundary Durumu

Yapılanlar:

- ortak provider result envelope standardı
- payment sandbox adapter
- shipment provider boundary
- notification provider boundary
- payout provider boundary
- provider sonucu business truth değildir kuralı
- actual live provider delivery / payout yapılmadığını belirten boundary flag’leri

Durum:

```text
PROVIDER BOUNDARY FOUNDATION DONE
```

Açık limitation:

- gerçek provider entegrasyonu yok
- gerçek network çağrısı yok
- gerçek webhook/callback production lifecycle yok
- provider result owner mutation değildir

---

### 5.2 HARDENING-10 Callback Baseline

Yapılanlar:

- common callback ingestion security boundary
- callback persistence
- signature guard foundation
- replay/idempotency guard
- freshness guard
- process-local rate limit guard
- PayTR callback mapping
- payment callback owner command contract
- providerReference lookup
- payment initiation providerReference persistence
- opt-in worker mode ile succeeded/failed callback payment state transition

Durum:

```text
CALLBACK FOUNDATION ADVANCED BUT NOT PRODUCTION READY
```

Açık limitation:

- PayTR live initiate yok
- gerçek merchant_oid live doğrulaması yok
- real PayTR sandbox E2E yok
- production worker claim/retry/concurrency foundation yok
- distributed rate limit / WAF yok
- order handoff henüz yok
- finance/risk linkage yok

---

### 5.3 HARDENING-10C10 Reconciliation Baseline

Yeni yüklenen kayıtla baseline güncellenmiştir.

Yapılanlar:

- PayTR status inquiry contract + mapping foundation
- PayTR status inquiry adapter boundary remediation
- reconciliation decision contract / task model
- reconciliation task persistence / repository foundation
- reconciliation worker dry-run / no mutation
- reconciliation owner command guard fix
- controlled reconciliation payment mutation
- reconciliation E2E smoke / no order handoff validation
- reconciliation audit/outbox + task finalization guard
- duplicate/idempotency ve terminal conflict kontrolleri
- payment reconciliation completed audit/outbox evidence
- no order handoff garantisi

Durum:

```text
RECONCILIATION FOUNDATION CLOSED WITH LIMITATIONS
```

Önemli doğru ifade:

```text
Reconciliation yok değildir.
Reconciliation foundation vardır; ancak production runtime değildir.
```

Açık limitation:

- canlı PayTR request yok
- gerçek PayTR HTTP çağrısı yok
- production PayTR entegrasyonu yok
- scheduler / queue / background runtime yok
- production worker runtime yok
- order create / order handoff yok
- finance / settlement / payout mutation yok
- risk mutation yok
- BFF route yok
- outbox consumer / delivery worker yok
- production operator panel flow yok

Kritik korunmuş ayrım:

```text
Payment succeeded ≠ order created
```

İlgili faz:

```text
PHASE-03 — Payment / Provider / Callback / Reconciliation Readiness
PHASE-04 — Order / Fulfillment / Delivery / Return / Refund Readiness
```

---

## 6. Domain Implementation / PX Baseline

### 6.1 Havuz Domain

Yapılanlar:

- PX-HAVUZ-01 — Pool / Product Acceptance Foundation — PASS
- PX-HAVUZ-02 — Commercial Pool Foundation — PASS
- PX-HAVUZ-03 — Binding / Activation Foundation — PASS
- PX-HAVUZ-03-R — Runtime Module Resolution Fix — PASS
- PX-HAVUZ-04 — Supplier Intake + Admin Review Surface Hardening — PASS
- PX-HAVUZ-05 — Creator Store Commercial Product Binding — PARTIAL

Durum:

```text
HAVUZ DOMAIN FOUNDATION MOSTLY DONE / ONE PARTIAL BLOCKER
```

Kritik not:

```text
PX-HAVUZ-05 PASS gibi ele alınamaz.
Build hatası kapanmadan production-readiness açısından temiz kabul verilemez.
```

İlgili faz:

```text
PHASE-02 — Commerce Core Readiness
PHASE-08 — Admin / Creator / Supplier Panel Readiness
```

---

### 6.2 Fenomen Mağaza Domain

Yapılanlar:

- Creator store product management hardening
- Store post / follow feed foundation
- storefront foundation
- follow feed foundation
- post/UGC foundation
- story foundation

Durum:

```text
CREATOR/STOREFRONT FOUNDATION DONE
```

Açık dikkat noktaları:

- tam creator panel yüzeyleri
- mağaza medya / story / post yönetimi
- satış ve performans görünürlüğü
- mobile-first creator panel UX
- production moderation ve risk integration

İlgili fazlar:

```text
PHASE-06 — Social / Content / Media / Moderation Readiness
PHASE-08 — Admin / Creator / Supplier Panel Readiness
PHASE-10 — Frontend / UX / Mobile Surface Readiness
```

---

### 6.3 Kullanıcı / Müşteri Domain

Yapılanlar:

- guest vs registered boundary hardening
- customer address / checkout eligibility
- customer contribution eligibility
- customer follow / message boundary alignment
- customer points / reward eligibility foundation
- customer support / order visibility boundary

Durum:

```text
CUSTOMER DOMAIN FOUNDATION HARDENED
```

Açık dikkat noktaları:

- reward point ledger lifecycle
- point market spending
- delivery-based contribution eligibility E2E
- support/ticket production flow
- order visibility frontend acceptance

İlgili fazlar:

```text
PHASE-02
PHASE-05
PHASE-06
PHASE-08
PHASE-10
PHASE-11
```

---

## 7. Social / Content / Moderation Baseline

Yapılanlar:

- post / UGC foundation
- review / rating foundation
- Q&A foundation
- interaction foundation
- follow feed foundation
- story foundation
- media / asset foundation
- moderation foundation
- moderation workflow hardening
- social content moderation enforcement
- social abuse signal integration

Durum:

```text
SOCIAL / CONTENT FOUNDATION HARDENED WITH LIMITATIONS
```

Açık limitation:

- full moderation panel UI yok
- AI moderation yok
- distributed rate limit yok
- media production pipeline eksik
- CDN/transcoding/object storage production readiness yok
- frontend social surfaces production acceptance gerekli
- review/story eligibility delivery E2E acceptance gerekli

İlgili faz:

```text
PHASE-06 — Social / Content / Media / Moderation Readiness
```

---

## 8. Search / Catalog / Ranking / Taxonomy Baseline

Yapılanlar:

- search foundation
- category / PLP foundation
- catalog read projection foundation
- PDP / PLP read hardening
- Search BFF smoke + candidate boundary
- Search index sync projection foundation
- catalog/search skipped borcunun kapatılması

Durum:

```text
SEARCH / CATALOG FOUNDATION HARDENED WITH LIMITATIONS
```

Açık limitation:

- OpenSearch production ops yok
- full event/outbox consumer yok
- worker reliability yok
- dynamic facets yok
- PLP search grid merge yok
- category/storefront indexed expansion yok
- pricing/stock/media realtime projection sync yok
- ranking/recommendation ayrı owner paket borcu
- taxonomy owner borcu

İlgili faz:

```text
PHASE-07 — Search / Catalog / Ranking / Taxonomy Readiness
```

---

## 9. Finance / Settlement / Payout Baseline

Yapılanlar:

- finance correction foundation / hardening line
- settlement foundation / hardening line
- payout foundation / hardening line
- payout provider boundary foundation
- refund foundation
- return/refund persistence
- finance owner boundary kayıtları

Durum:

```text
FINANCE / SETTLEMENT / PAYOUT FOUNDATION EXISTS BUT PRODUCTION READINESS REQUIRED
```

Açık limitation:

- gerçek payout provider yok
- payout batch runtime yok
- bank/account verification yok
- retry ve failure handling production seviyesinde değil
- settlement delivery/return/refund impact E2E acceptance gerekli
- coupon sponsor etkisi finansal dağılıma tam bağlanmalı
- fraud/risk hold payout öncesi doğrulanmalı

İlgili faz:

```text
PHASE-05 — Finance / Settlement / Payout Readiness
```

---

## 10. Risk / Fraud / Analytics / Notification Baseline

### 10.1 Risk / Fraud / Abuse

Yapılanlar:

- risk/fraud foundation
- risk signal core guard
- commerce abuse/fraud observation
- social abuse signal integration
- advisory risk signal production

Durum:

```text
RISK FOUNDATION HARDENED WITH LIMITATIONS
```

Açık limitation:

- full fraud scoring yok
- auto hold/block yok
- distributed rate limit yok
- provider sandbox yok
- finance/payout/settlement abuse workflow eksik

---

### 10.2 Analytics / Event / Audit / Outbox

Yapılanlar:

- event envelope
- audit contract
- analytics guard
- outbox lifecycle
- event/audit durability foundation
- outbox idempotency smoke
- payment reconciliation audit/outbox evidence

Durum:

```text
ANALYTICS / EVENT / AUDIT / OUTBOX FOUNDATION DONE WITH LIMITATIONS
```

Açık limitation:

- production broker yok
- distributed worker yok
- retry scheduler yok
- dead-letter queue yok
- BI/dashboard yok
- consent/preference center yok
- domain producer coverage genişletmeleri gerekli

---

### 10.3 Notification

Yapılanlar:

- notification foundation
- notification guard hardening
- owner-aware notification helper
- provider boundary
- notification provider sandbox

Durum:

```text
NOTIFICATION FOUNDATION HARDENED WITH LIMITATIONS
```

Açık limitation:

- gerçek email/SMS/push provider yok
- delivery callback yok
- preference/consent center yok
- production delivery observability yok

İlgili faz:

```text
PHASE-09 — Risk / Fraud / Analytics / Notification Readiness
```

---

## 11. Admin / Panel / Operations Baseline

Yapılanlar:

- app shell / panel skeleton
- protected route hardening
- admin/creator route protection
- pool supplier intake + admin review surface hardening
- order operations foundation/hardening kayıtları
- support/ticket foundation
- moderation workflow foundation

Durum:

```text
PANEL / ADMIN / OPS PARTIAL FOUNDATION
```

Açık limitation:

- full admin control tower yok
- supplier panel production workbench yok
- creator panel mobile-first production UX yok
- finance/payout admin flows yok
- support ticket SLA/escalation UI yok
- moderation/risk review queues full production değil
- protected action + audit-backed admin operations bütünsel doğrulanmalı

İlgili faz:

```text
PHASE-08 — Admin / Creator / Supplier Panel Readiness
PHASE-10 — Frontend / UX / Mobile Surface Readiness
```

---

## 12. Frontend / UX / Mobile Baseline

Yapılanlar:

- web shell
- panel shell
- bazı BFF read routes
- catalog/PDP/search/cart/checkout/order/story/post foundations
- smoke seviyesinde BFF endpoint kontrolleri

Durum:

```text
FRONTEND / UX / MOBILE PRODUCTION READINESS NOT VERIFIED
```

Açık limitation:

- tam storefront UX acceptance yok
- mobile-first akışlar doğrulanmadı
- creator/supplier/admin panel production UX eksik
- critical journeys gerçek UI üzerinden kapatılmadı
- performance, accessibility, responsive/mobile acceptance ayrı faz ister

İlgili faz:

```text
PHASE-10 — Frontend / UX / Mobile Surface Readiness
PHASE-11 — Critical Journey Acceptance
```

---

## 13. Critical Journey Baseline

Critical Journey Checklist 13 temel journey tanımlar.

Bu journey’lerin bazıları foundation/smoke seviyesinde doğrulanmıştır:

- search → PDP
- PDP → cart
- cart → checkout
- checkout → payment
- payment → order
- order → shipment

Ancak production-readiness için tam journey acceptance ayrı yapılmalıdır.

Özellikle:

- payment unknown-result / reconciliation
- payment succeeded → order handoff
- delivery → review/story eligibility
- delivery → return/refund impact
- coupon/campaign application
- reward point flow
- creator onboarding
- supplier onboarding
- support/moderation/fraud escalation

tam release acceptance seviyesinde kapatılmalıdır.

İlgili faz:

```text
PHASE-11 — Critical Journey Acceptance
```

---

## 14. Release Blocker Adayları

Aşağıdaki maddeler baseline seviyesinde release blocker adayıdır.

Kesin release blocker kararı `09-RELEASE_BLOCKER_REGISTER.md` dosyasında detaylandırılacaktır.

### 14.1 Payment / Provider

- canlı PayTR request yok
- gerçek PayTR sandbox E2E yok
- production payment provider runtime yok
- reconciliation production scheduler/queue yok
- payment succeeded → order handoff yok

### 14.2 Order / Finance

- reconciliation sonrası order handoff yok
- settlement / payout E2E production readiness yok
- payout gerçek ödeme çıkışı yok
- refund / settlement adjustment E2E netleşmeli

### 14.3 Runtime / Deployment

- production deployment gate yok
- secrets/config production hardening yok
- observability / alerting / rollback gate yok
- worker runtime reliability yok

### 14.4 Frontend / Panel

- tam critical journey UI acceptance yok
- admin/creator/supplier panel production readiness yok

### 14.5 Domain Technical Debt

- PX-HAVUZ-05 PARTIAL / build hatası
- taxonomy owner borcu
- ranking/recommendation owner borcu
- media/CDN/transcoding production readiness

---

## 15. Baseline Sonucu

Mevcut platform durumu:

```text
Foundation-level Release Candidate Accepted
Production Readiness: NOT CLAIMED
```

Ana karar:

```text
Yeni production-readiness fazları başlatılmalıdır.
```

Bu baseline’a göre sıradaki dosya:

```text
03-PRODUCTION_READINESS_PHASE_MASTER_PLAN.md
```

---

## 16. Nihai Kısa Karar

```text
CURRENT_STATE_BASELINE V1 tamamlandı.

Platform foundation ve hardening açısından ciddi ilerleme kaydetmiştir.
Ancak live provider, production runtime, full order handoff, finance/payout E2E, frontend/panel surface maturity, observability/deployment gate ve critical journey acceptance tamamlanmadan production-ready kabul edilemez.
```
