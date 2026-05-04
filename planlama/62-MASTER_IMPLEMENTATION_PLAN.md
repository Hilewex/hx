# MASTER_IMPLEMENTATION_PLAN

## 0. Amaç

Bu belge, kodlama başlangıcından release candidate aşamasına kadar kullanılacak tek parça nihai uygulama master planıdır.

Bu planın amacı:

* mevcut aşama dosyaları
* sistem dosyaları
* oluşturulmuş engineering / topology / acceptance omurgası
* bağımsız analiz raporundan çıkan risk ve paket sıralaması

birleştirilerek, gerçek uygulama sırasında kullanılacak bağlayıcı yürüyüş planını vermektir.

Net kural:

* Bu belge feature wish-list değildir
* Bu belge kodlama sırasında ana yürütme planıdır
* Her paket referans seti ile yürür
* Her paket acceptance ve kanıt ile kapanır
* Owner boundary, transition ayrımları ve truth/projection çizgisi hiçbir pakette gevşetilmez

---

# 1. Nihai karar

## 1.1 Karar

**Kodlamaya başlanabilir.**

Bu kararın çalışma dili:
**GO — kontrollü, paket bazlı, kanıt zorunlu uygulama**

## 1.2 Bu karar ne anlama gelir?

Bu karar şunu söyler:

* anayasal omurga hazır
* owner / guard / transition omurgası hazır
* contract / error / integration / topology omurgası hazır
* repo / engineering / DoR / DoD hazır
* critical journey ve acceptance gate hazır

Bu yüzden kodlama başlatılabilir.

## 1.3 Bu karar ne anlama gelmez?

Şunları söylemez:

* her modüle aynı anda gir
* bütün ekip kafasına göre branch açsın
* yol üzerinde karar üretelim
* acceptance olmadan closure verelim

Doğru yorum:
**başlangıç serbest değil, kontrollüdür.**

---

# 2. Temel çalışma ilkeleri

## 2.1 Mimari değişmezler

Her pakette aşağıdaki değişmezler korunur:

* owner dışı write yok
* BFF read-only aggregation
* panel direct write yok
* UI truth üretmez
* projection truth değildir
* event owner mutation yerine geçmez
* duplicate ikinci mutation üretmez
* unknown-result sessiz failure sayılmaz

## 2.2 Kritik ayrımlar

Her pakette aşağıdaki ayrımlar zorunlu korunur:

* approved ≠ active
* captured ≠ order_created
* delivered ≠ review/story written
* settled ≠ payable
* payable ≠ paid_out
* return_approved ≠ refund_completed
* permission ≠ eligibility
* support ≠ finance owner
* moderation ≠ risk owner

## 2.3 Çalışma zinciri

Her paket aşağıdaki zincirle yürür:

1. referans seti açılır
2. DoR kontrol edilir
3. contract gerekiyorsa önce güncellenir
4. implementasyon yapılır
5. T0–T4 uygun test çalıştırılır
6. acceptance maddeleri kapatılır
7. limitation varsa yazılır
8. DoD ile closure verilir

---

# 3. Kullanılacak teknoloji ve araç omurgası

## 3.1 Ana teknoloji seti

* Web: Next.js + React + TypeScript
* Mobil: React Native + Expo + TypeScript
* Backend: Node.js + TypeScript
* Monorepo: pnpm workspaces
* Database: PostgreSQL
* Cache/helper: Redis
* Search: OpenSearch
* Container/local: Docker + Docker Compose
* Observability: Grafana + Loki + Tempo

## 3.2 Günlük araç seti

* VS Code
* Roo Code
* AI yardımcı araçlar
* Git
* pnpm
* Docker Desktop
* Postman/Insomnia
* DBeaver/TablePlus
* Redis Insight
* Grafana / OpenSearch dashboards

## 3.3 Kullanım kuralı

* yeni araç ekleme sadece gerçek ihtiyaçla yapılır
* ikinci backend dili açılmaz
* gereksiz infra karmaşıklığı eklenmez
* production-grade olmayan deneysel araç çekirdek truth alanına sokulmaz

---

# 4. Referans sistemi — hangi belge ne için kullanılır?

## 4.1 Anayasa seti

Her pakette zorunlu açık olacak belgeler:

* `aşama-1/KANONIK_KARARLAR_OZETI.md`
* `25-kural -yetki sistemi.md`
* `aşama-2/OWNER_MATRIX.md`
* `aşama-2/GUARD_MATRIX.md`
* `aşama-3/TRANSITION_POLICIES.md`

## 4.2 Modül seti

Paketin ilgili sistem dosyaları.
Örnek:

* ödeme paketi için: checkout + ödeme + sipariş + provider matrix
* story paketi için: story + video + medya + eligibility
* payout paketi için: hakediş + payout + approval + fallback policy

## 4.3 Contract seti

İlgili durumda açılır:

* `aşama-5/OPENAPI/*`
* `aşama-5/API_ERROR_CATALOG.md`
* `aşama-8/SCREEN_CONTRACTS_REFINED.md`
* `aşama-8/PANEL_CONTRACTS.md`
* `aşama-8/DTO_RESPONSE_CATALOG.md`
* `aşama-14/ERROR_CODE_STANDARD.md`

## 4.4 Engineering seti

Kodlama disiplini için:

* `aşama-14/REPO_BLUEPRINT.md`
* `aşama-14/ENGINEERING_STANDARDS.md`
* `aşama-14/BRANCH_RELEASE_POLICY.md`
* `aşama-14/DEFINITION_OF_READY.md`
* `aşama-14/DEFINITION_OF_DONE.md`
* `TEST_STRATEJISI.md`

## 4.5 Acceptance seti

Her closure öncesi:

* `aşama-15/CRITICAL_JOURNEY_CHECKLIST.md`
* `aşama-15/ACCEPTANCE_CRITERIA_PACK.md`
* `aşama-15/CODING_READINESS_GATE.md`

## 4.6 Operasyon / governance seti

Operasyonel ve yönetimsel paketlerde:

* `aşama-12/ESCALATION_MATRIX.md`
* `aşama-12/SLA_OWNER_LIST.md`
* `aşama-12/APPROVAL_FLOW_PACK.md`
* `aşama-12/OPERATION_LOGIC_GUIDE.md`
* `aşama-11/AUDIT_TAXONOMY.md`
* `aşama-11/EVENT_TAXONOMY.md`
* `aşama-11/METRIC_DICTIONARY.md`

## 4.7 Infra / topology seti

Teknik paketlerde:

* `aşama-13/ENVIRONMENT_ARCHITECTURE.md`
* `aşama-13/SERVICE_DEPLOYMENT_MAP.md`
* `aşama-13/SECRETS_AND_CONFIG_POLICY.md`
* `aşama-13/CLOUD_TOPOLOGY_DIAGRAM.png`

---

# 5. Uygulama öncelik modeli

## 5.1 Öncelik sınıfları

* **P1:** platformun yürüyen iskeleti için zorunlu
* **P2:** çekirdek commerce sonrası gerekli genişleme
* **P3:** sosyal-commerce büyüme yüzeyleri
* **P4:** ağır operasyon/finans/gelişmiş genişleme

## 5.2 İlk gerçek hedef

İlk hedef tüm sistemi bitirmek değil.
İlk hedef:
**çalışan, boundary-safe, acceptance’lı yürüyen iskeleti kurmak**

---

# 6. Aşamalı gerçek uygulama planı

## FAZ 1 — Repo, Ortam ve Teknik Omurga

Amaç: proje gerçek kod yazılabilir hale gelsin.

### Paket 1 — Monorepo Foundation

Öncelik: P1

İçerik:

* root repo kurulum
* pnpm workspace
* apps/services/packages/infra/docs/tests
* typecheck/build skeleton

Referans seti:

* REPO_BLUEPRINT
* ENGINEERING_STANDARDS
* BRANCH_RELEASE_POLICY

Çıktı:

* boş ama çalışan monorepo
* standart klasör ağacı
* root komutlar çalışıyor

### Paket 2 — Infra + Local Runtime Foundation

Öncelik: P1

İçerik:

* Docker Compose
* PostgreSQL
* Redis
* OpenSearch
* Grafana/Loki/Tempo
* env schema
* .env.example aileleri

Referans seti:

* ENVIRONMENT_ARCHITECTURE
* SERVICE_DEPLOYMENT_MAP
* SECRETS_AND_CONFIG_POLICY
* KONFIGURASYON_YONETIMI
* kullanılacak teknolojiler

Çıktı:

* local stack ayağa kalkar
* config parse katmanı hazırdır

### Paket 3 — Shared Packages Foundation

Öncelik: P1

İçerik:

* contracts
* events
* types
* shared-kernel
* config
* observability
* testing
* ui primitives

Referans seti:

* REPO_BLUEPRINT
* ENGINEERING_STANDARDS
* API_ERROR_CATALOG
* ERROR_CODE_STANDARD
* AUDIT_TAXONOMY
* EVENT_TAXONOMY

Çıktı:

* ortak paketler kullanılabilir
* canonical error/event yapısı vardır

### Paket 4 — App Shell Foundation

Öncelik: P1

İçerik:

* web shell
* panel shell
* bff shell
* route guards skeleton
* query/error boundary

Referans seti:

* SCREEN_CONTRACTS_REFINED
* PANEL_CONTRACTS
* STATEFUL_UI_BEHAVIOR_GUIDE
* FIGMA_LINKS
* üyelik giriş sistemi
* kural-yetki sistemi

Çıktı:

* web/panel/bff iskeleti çalışır

---

## FAZ 2 — Kimlik, Yetki ve Aktör Omurgası

Amaç: kimin hangi aksiyonu hangi scope ile yapacağı gerçek kod haline gelsin.

### Paket 5 — Auth / Session Foundation

Öncelik: P1

İçerik:

* auth service
* session
* login/logout
* guest/auth separation

Referans seti:

* üyelik giriş sistemi
* ACTOR_MATRIX
* GUARD_MATRIX
* PERMISSION_MATRIX
* OWNER_MATRIX

### Paket 6 — Access / Permission / Scope Foundation

Öncelik: P1

İçerik:

* scope guard
* role/permission evaluation
* panel access
* shopper vs creator vs supplier separation

Referans seti:

* kural-yetki sistemi
* ENDPOINT_SCOPE_CATALOG
* GUARD_MATRIX
* OWNER_MATRIX

### Paket 7 — Protected Action Foundation

Öncelik: P1

İçerik:

* panel action request pattern
* reason/audit preconditions
* action authorization

Referans seti:

* APPROVAL_FLOW_PACK
* AUDIT_TAXONOMY
* PANEL_CONTRACTS
* ERROR_CODE_STANDARD

Çıktı:

* auth / access / guard / panel action omurgası hazır

---

## FAZ 3 — Commerce Walking Skeleton

Amaç: ürün → sepet → checkout → ödeme → sipariş zincirini sandbox düzeyinde ayağa kaldırmak.

### Paket 8 — Catalog / PDP Read Foundation

Öncelik: P1

İçerik:

* ürün retrieval
* varyant
* PDP read model
* category/taxonomy bağları

Referans seti:

* PDP sistemi
* varyant sistemi
* kategori taksonomi sistemi
* LOGICAL_DATA_MODEL
* OPENAPI/public/app

### Paket 9 — Cart Foundation

Öncelik: P1

İçerik:

* add/remove/update cart
* cart truth
* guest/auth cart handling

Referans seti:

* sepet sistemi
* üyelik giriş sistemi
* kural-yetki sistemi
* CRITICAL_JOURNEY_CHECKLIST
* ACCEPTANCE_CRITERIA_PACK

### Paket 10 — Pricing Foundation

Öncelik: P1

İçerik:

* merkezi fiyat service
* active price resolution
* snapshot refs

Referans seti:

* merkezi fiyat sistemi
* SNAPSHOT_POLICY
* kampanya sistemi
* kupon sistemi
* PROMOTION_RULEBOOK

### Paket 11 — Stock Foundation

Öncelik: P1

İçerik:

* merkezi stok service
* sellable stock
* reservation helper

Referans seti:

* merkezi stok sistemi
* SNAPSHOT_POLICY
* IDEMPOTENCY_POLICIES
* TRANSITION_POLICIES

### Paket 12 — Checkout Foundation

Öncelik: P1

İçerik:

* checkout review
* final stock/price validation
* address checks
* checkout expiry

Referans seti:

* checkout sistemi
* adres sistemi
* merkezi stok sistemi
* merkezi fiyat sistemi
* checkout.md
* API_ERROR_CATALOG

### Paket 13 — Payment Initiation Foundation

Öncelik: P1

İçerik:

* payment attempt
* provider abstraction
* timeout/unknown-result
* idempotent initiation

Referans seti:

* ödeme sistemi
* payment.md
* THIRD_PARTY_PROVIDER_MATRIX
* FALLBACK_RETRY_TIMEOUT_POLICY
* API_ERROR_CATALOG

### Paket 14 — Payment → Order Foundation

Öncelik: P1

İçerik:

* payment confirmed -> order create
* idempotent order create
* order visibility projection

Referans seti:

* sipariş sistemi
* order.md
* VERI_AKISI_SENKRONIZASYON_MODELI
* TRANSITION_POLICIES
* ACCEPTANCE_CRITERIA_PACK

Çıktı:

* sandbox ödeme sonrası tek sipariş oluşur
* walking skeleton tamamlanır

---

## FAZ 4 — Shipment, Tracking ve Post-Delivery

Amaç: sipariş sonrası gerçek ticari zinciri tamamlamak.

### Paket 15 — Shipment Foundation

Öncelik: P1

İçerik:

* shipment create
* package/line mapping
* callback dedupe

Referans seti:

* kargo ve teslimat sistemi
* shipment-delivery.md
* THIRD_PARTY_PROVIDER_MATRIX
* FALLBACK_RETRY_TIMEOUT_POLICY

### Paket 16 — Tracking Projection Foundation

Öncelik: P1

İçerik:

* user tracking view
* delivery timeline
* projection/truth separation

Referans seti:

* sipariş takip sistemi
* OPERATION_LOGIC_GUIDE
* SCREEN_CONTRACTS_REFINED

### Paket 17 — Return / Refund Foundation

Öncelik: P1

İçerik:

* return request
* eligibility checks
* refund start/completion/unknown-result
* finance correction hooks

Referans seti:

* iptal ve iade sistemi
* cancel-return.md
* FALLBACK_RETRY_TIMEOUT_POLICY
* API_ERROR_CATALOG
* ELIGIBILITY_RULEBOOK

### Paket 18 — Review / Story Eligibility Foundation

Öncelik: P1

İçerik:

* verified purchase
* review eligibility
* story eligibility
* revoke/recompute after return

Referans seti:

* yorum ve puanlama sistemi
* kullanıcı story sistemi
* ELIGIBILITY_RULEBOOK
* VERI_AKISI_SENKRONIZASYON_MODELI

Çıktı:

* delivery sonrası post-delivery hak zinciri doğru çalışır

---

## FAZ 5 — Discovery ve Sosyal-Commerce Yüzeyleri

Amaç: platformun görünür sosyal-commerce kimliği açılır.

### Paket 19 — Search Foundation

Öncelik: P2

İçerik:

* query intent
* retrieval/candidate
* facet/filter

Referans seti:

* Arama Sistemi
* arama indeksleme sistemi
* EVENT_TAXONOMY
* METRIC_DICTIONARY

### Paket 20 — Ranking / Recommendation Foundation

Öncelik: P2

İçerik:

* ranking service
* feed ordering
* signals

Referans seti:

* öneri ve sıralama sistemi
* EVENT_TAXONOMY
* METRIC_DICTIONARY

### Paket 21 — Home / Category / Discover Surfaces

Öncelik: P2

İçerik:

* ana sayfa
* kategori/PLP
* keşfet orchestration

Referans seti:

* ana sayfa sistemi
* kategori-plp sistemi
* keşfet sistemi
* SCREEN_CONTRACTS_REFINED

### Paket 22 — Classic + Video Product Cards

Öncelik: P2

İçerik:

* klasik ürün kartları
* videolu ürün kartları
* PDP linking behavior

Referans seti:

* klasik ürün kart sistemi
* video sistemi
* keşfet sistemi
* PDP sistemi

### Paket 23 — Story / Video Surfaces

Öncelik: P3

İçerik:

* story feed
* video playback
* media integration

Referans seti:

* story sistemi
* video sistemi
* medya sistemi asset sistemi
* ELIGIBILITY_RULEBOOK

### Paket 24 — Fenomen Mağaza + Takip

Öncelik: P3

İçerik:

* fenomen mağaza storefront
* takip sistemi
* creator storefront identity

Referans seti:

* fenoemen mağaza sistemi
* takip sistemi
* fenomen yönetim sistemi
* fenomen mağaza yönetim panel sistemi

### Paket 25 — Post / Interaction Foundation

Öncelik: P3

İçerik:

* post
* like/save/share
* q&a/comments basics
* user story publish surface

Referans seti:

* post sistemi
* beğenme kaydetme paylaşma sistemi
* soru cevap sistemi
* kullanıcı story sistemi
* UGC_RULEBOOK

---

## FAZ 6 — Promotion, Reward ve Commercial Extensions

Amaç: kampanya, kupon ve reward omurgasını açmak.

### Paket 26 — Coupon / Campaign Foundation

Öncelik: P2

İçerik:

* coupon validation
* campaign apply
* sponsor attribution hooks

Referans seti:

* kupon sistemi
* kampanya sistemi
* PROMOTION_RULEBOOK
* API_ERROR_CATALOG

### Paket 27 — Reward Foundation

Öncelik: P2

İçerik:

* reward pending
* reward spendable
* reward revoke/recompute

Referans seti:

* ödül puan sistemi
* puan market sistemi
* ELIGIBILITY_RULEBOOK
* VERI_AKISI_SENKRONIZASYON_MODELI

---

## FAZ 7 — Creator / Supplier Governance

Amaç: iki ana ticari aktörün yaşam döngüsü ve yönetim yüzeyleri açılır.

### Paket 28 — Creator Onboarding Foundation

Öncelik: P2

İçerik:

* application
* review/revision/approval
* activation

Referans seti:

* fenomen yönetim sistemi
* creator-lifecycle.md
* APPROVAL_FLOW_PACK
* ELIGIBILITY_RULEBOOK

### Paket 29 — Supplier Onboarding Foundation

Öncelik: P2

İçerik:

* supplier application
* category/upload scope
* limited/unrestricted activation

Referans seti:

* tedarikçi panel sistemi
* tedarikçi yönetim sistemi
* supplier-lifecycle.md
* APPROVAL_FLOW_PACK

### Paket 30 — Product Acceptance Foundation

Öncelik: P2

İçerik:

* ürün kabul/onay
* supplier upload gate
* moderation-before-visibility hooks

Referans seti:

* ürün kabul - onay sistemi
* moderasyon sistemi
* medya sistemi asset sistemi

---

## FAZ 8 — Support, Moderation, Risk, Ops

Amaç: operasyon omurgası gerçek hale gelir.

### Paket 31 — Support Ticket Foundation

Öncelik: P2

İçerik:

* support entry
* ticket truth
* triage/assignment

Referans seti:

* destek sistemi
* destek ticket operasyon sistemi
* support-ticket.md
* ESCALATION_MATRIX
* SLA_OWNER_LIST

### Paket 32 — Moderation Foundation

Öncelik: P2

İçerik:

* moderation items
* decision flows
* panel moderation actions

Referans seti:

* moderasyon sistemi
* moderation-item.md
* APPROVAL_FLOW_PACK
* UGC_RULEBOOK

### Paket 33 — Risk / Fraud Foundation

Öncelik: P3

İçerik:

* risk case
* hold/release advisory
* abuse rules

Referans seti:

* fraud risk abuse sistemi
* OPERATION_LOGIC_GUIDE
* APPROVAL_FLOW_PACK
* AUDIT_TAXONOMY

### Paket 34 — Order Ops Foundation

Öncelik: P3

İçerik:

* line/package operations
* fulfillment exception visibility
* shipment readiness ops

Referans seti:

* sipariş operasyon sistemi
* order.md
* shipment-delivery.md
* OPERATION_LOGIC_GUIDE

---

## FAZ 9 — Finance, Settlement, Payout

Amaç: en ağır finansal doğruluk zinciri kontrollü biçimde açılır.

### Paket 35 — Finance Correction Foundation

Öncelik: P3

İçerik:

* refund execution
* correction / reconciliation
* finance outcomes

Referans seti:

* finansal mutabakat hakediş sistemi
* ödeme sistemi
* iptal ve iade sistemi
* FALLBACK_RETRY_TIMEOUT_POLICY
* API_ERROR_CATALOG

### Paket 36 — Settlement Foundation

Öncelik: P3

İçerik:

* settlement line
* adjustments
* payable preparation

Referans seti:

* settlement-line.md
* finansal mutabakat hakediş sistemi
* VERI_AKISI_SENKRONIZASYON_MODELI

### Paket 37 — Payout Foundation

Öncelik: P4

İçerik:

* payout batch
* payout items
* hold/release
* sandbox payout

Referans seti:

* payaut ödeme çıkış sistemi
* payout-batch.md
* APPROVAL_FLOW_PACK
* FALLBACK_RETRY_TIMEOUT_POLICY
* THIRD_PARTY_PROVIDER_MATRIX

---

## FAZ 10 — Observability, Analytics, Audit, Notification

Amaç: sistem işletilebilir hale gelir.

### Paket 38 — Notification Foundation

Öncelik: P2

İçerik:

* notification orchestration
* inbox
* transactional email sandbox

Referans seti:

* bildirim sistemi
* EVENT_TAXONOMY
* AUDIT_TAXONOMY
* THIRD_PARTY_PROVIDER_MATRIX

### Paket 39 — Event / Audit Foundation

Öncelik: P2

İçerik:

* canonical events
* audit trails
* correlation support

Referans seti:

* EVENT_TAXONOMY
* AUDIT_TAXONOMY
* VERI_AKISI_SENKRONIZASYON_MODELI

### Paket 40 — Metrics / Analytics Foundation

Öncelik: P2

İçerik:

* conversion metrics
* degraded/error metrics
* ops dashboards

Referans seti:

* METRIC_DICTIONARY
* arka plan analatik ölçümleme sistemi
* EVENT_TAXONOMY

---

## FAZ 11 — Hardening ve Release Candidate

Amaç: sistem yayın öncesi kalite kapılarını geçer.

### Paket 41 — Contract Hardening

Öncelik: P2

İçerik:

* openapi alignment
* dto/screen/panel closure
* contract drift cleanup

### Paket 42 — Error / Edge / Retry Hardening

Öncelik: P2

İçerik:

* canonical errors complete
* degraded handling
* duplicate-safe tests
* timeout/reconciliation tests

### Paket 43 — Acceptance Closure

Öncelik: P2

İçerik:

* critical journeys T4 closure
* governance acceptance
* finance/payout acceptance
* limitations registry

### Paket 44 — Release Candidate

Öncelik: P2

İçerik:

* release branch
* stabilization only
* release notes
* final limitation set
* go/no-go review

Referans seti:

* ACCEPTANCE_CRITERIA_PACK
* CODING_READINESS_GATE
* DEFINITION_OF_DONE
* BRANCH_RELEASE_POLICY
* TEST_STRATEJISI

---

# 7. En büyük 15 hata riski ve önleyici kural

## Risk 1 — Yanlış dosyayı referans alma

Önlem:

* paket başında referans seti sabitlenir
* KANONIK_KARARLAR_OZETI anayasal referans kabul edilir

## Risk 2 — BFF’e owner logic sızması

Önlem:

* BFF paketleri her closure’da boundary review’dan geçer

## Risk 3 — Panel direct write açılması

Önlem:

* protected action + audit olmadan panel closure verilmez

## Risk 4 — State ayrımlarının atlanması

Önlem:

* transition-sensitive paketlerde ilgili state machine ve TRANSITION_POLICIES zorunlu açık olur

## Risk 5 — Idempotency eksikliği

Önlem:

* payment/order/payout/shipment callback paketlerinde idempotency test zorunlu

## Risk 6 — Unknown-result’ın failure sayılması

Önlem:

* payment/refund/payout/shipment provider paketlerinde reconciliation senaryosu zorunlu

## Risk 7 — Snapshot unutulması

Önlem:

* order/checkout/pricing paketlerinde SNAPSHOT_POLICY checklist maddesi

## Risk 8 — Eligibility ile login karışması

Önlem:

* post-delivery, story, review, reward paketlerinde eligibility acceptance zorunlu

## Risk 9 — Line-level truth kaybı

Önlem:

* shipment/return/refund/payout paketlerinde line-level acceptance şartı

## Risk 10 — Error family dağınıklığı

Önlem:

* API_ERROR_CATALOG + ERROR_CODE_STANDARD dışına çıkılmaz

## Risk 11 — Docs update atlanması

Önlem:

* DoD’de docs/contract update maddesi zorunlu

## Risk 12 — Testsiz kritik closure

Önlem:

* T3/T4 gerektiren paketler acceptance kanıtı olmadan kapanmaz

## Risk 13 — Secret/config karışması

Önlem:

* env ve config patch’leri SECRETS_AND_CONFIG_POLICY review ister

## Risk 14 — Social ve commerce truth karışması

Önlem:

* story/post/interaction paketlerinde UGC_RULEBOOK + ELIGIBILITY_RULEBOOK zorunlu

## Risk 15 — Finansal doğruluk bozulması

Önlem:

* finance/payout paketleri en son ve en sıkı acceptance ile yürütülür

---

# 8. Henüz yazılmamış ama zorunlu üretilecek artefact’lar

Aşağıdakiler uygulama sırasında mutlaka üretilecektir:

## 8.1 Teknik repo artefact’ları

* root README
* per-service README
* root package.json
* per-app/service package.json
* pnpm-workspace.yaml
* tsconfig base ve per-package tsconfig
* .env.example family’leri
* Dockerfile’lar
* compose dosyaları

## 8.2 Kalite artefact’ları

* lint config
* format config
* PR template
* issue/pack template
* CI workflow files

## 8.3 Test artefact’ları

* canonical fixtures
* factory/builders
* provider callback fixtures
* acceptance scenario files
* test data seeds

## 8.4 Operasyonel artefact’lar

* known limitation registry
* payment reconciliation runbook
* payout hold/release runbook
* hotfix deployment runbook
* critical incident response runbook

## 8.5 Release artefact’ları

* release notes draft
* migration registry
* stabilization checklists

Net kural:

* bunlar “sonra bakarız” dosyaları değildir
* ilgili faz geldiğinde üretilmeleri zorunludur

---

# 9. Her paket için uygulanacak operasyon ritmi

Her paket şu operasyonel sırayla yürütülür:

1. Paket seçilir
2. Owner ve journey belirlenir
3. Referans seti açılır
4. DoR checklist çalıştırılır
5. Branch açılır (`feature/*` veya `pack/*`)
6. Contract gerekiyorsa önce güncellenir
7. Implementasyon yapılır
8. T0/T1/T2/T3/T4 gerekli seviyeler çalıştırılır
9. Acceptance maddeleri işaretlenir
10. Docs / error / audit / event alignment kontrol edilir
11. Limitation varsa yazılır
12. DoD checklist ile closure verilir
13. Pack note veya closure note yazılır

---

# 10. Master planın kullanım kuralı

Bu plan nasıl kullanılacak?

## 10.1 Günlük kullanım

* sadece aktif paket okunur
* aktif paketin referans seti açılır
* gereksiz tüm dosyalarla boğulunmaz

## 10.2 Haftalık kullanım

* kapanan paketler işaretlenir
* yeni riskler limitation registry’ye yazılır
* sıradaki paket seçilir

## 10.3 Kural

* bu plan genel yön verir
* aktif paketin referans seti operasyonel gerçektir

---

# 11. İlk gerçek kodlama dalgası — uygulanacak kesin sıra

İlk dalga için kesin yürüyüş sırası:

1. Paket 1 — Monorepo Foundation
2. Paket 2 — Infra + Local Runtime
3. Paket 3 — Shared Packages Foundation
4. Paket 4 — App Shell Foundation
5. Paket 5 — Auth / Session
6. Paket 6 — Access / Permission
7. Paket 8 — Catalog / PDP Read
8. Paket 9 — Cart
9. Paket 10 — Pricing
10. Paket 11 — Stock
11. Paket 12 — Checkout
12. Paket 13 — Payment Initiation
13. Paket 14 — Payment → Order
14. Paket 15 — Shipment
15. Paket 16 — Tracking
16. Paket 17 — Return / Refund
17. Paket 18 — Review / Story Eligibility

Bu sıra tamamlanmadan ağır sosyal-growth veya payout katmanına girilmez.

---

# 12. Nihai profesyonel hüküm

Bu platform için doğru uygulama modeli şudur:

* owner-boundary temelli
* contract-first ve acceptance-driven
* paket bazlı
* kanıt zorunlu
* engineering standardına bağlı
* topology ve secret sınırlarını koruyan
* önce walking skeleton, sonra genişleme yapan
  uygulama modeli.

Bu master planın amacı, kodlama bitene kadar seni ve kullanılan AI araçlarını aynı disipline bağlı tutmaktır.

## Tek cümlelik karar

**Kodlama başlar; ama yalnızca bu master plan + paket referans seti + acceptance closure disipliniyle yürütülür.**
