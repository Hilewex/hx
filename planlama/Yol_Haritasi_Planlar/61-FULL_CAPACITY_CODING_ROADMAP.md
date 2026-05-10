# FULL_CAPACITY_CODING_ROADMAP

## 0. Belgenin amacı

Bu belge, mevcut hazırlık aşamalarından sonra kodlama başlangıcından yayınlama öncesi bitişe kadar ilerleyecek tam kapsamlı uygulama yol haritasını verir.

Bu yol haritasının amacı:

* kodlamayı rastgele modül sırasıyla değil, owner-boundary ve kritik journey mantığıyla yürütmek
* her adımda hangi referans setinin kullanılacağını netleştirmek
* repo kurulumu, temel altyapı, çekirdek commerce, sosyal-commerce yüzeyleri, operasyon, finans, kalite ve yayın öncesi doğrulama adımlarını tek plan altında toplamak
* kullanıcı + sistem + operasyon + finans + sosyal yüzeyleri birlikte taşıyan platformu kontrollü şekilde geliştirmektir

Net kural:

* Bu yol haritası feature listesi değildir; uygulama sırası ve disiplinidir
* Her faz acceptance ve kanıtla kapanır
* Owner dışı write açılmaz
* BFF read-only kalır
* Panel direct write olmaz
* UI truth üretmez
* Her paket readiness -> implementation -> validation -> acceptance -> closure zinciri ile yürür

---

# 1. Elimizde yeterli veri var mı?

## 1.1 Karar

Evet. Elimizde bu yol haritasını çıkarmaya yetecek veri vardır.

## 1.2 Neye dayanarak bu kararı veriyorum?

Mevcut veri setinde aşağıdakiler zaten var:

* sistem ağacı
* modül dosyaları
* owner / permission / guard omurgası
* state machine ve transition politikaları
* veri modeli ve snapshot politikası
* API-first sözleşmeler
* third-party provider matrisi
* NFR hedefleri
* screen/panel contracts
* figma handoff
* business / eligibility / promotion / UGC rulebook’lar
* audit / event / metric taxonomy
* operasyon / escalation / SLA / approval omurgası
* cloud topology ve environment mimarisi
* repo / engineering / branch-release / DoR / DoD
* critical journey checklist / acceptance / coding readiness gate
* teknoloji ve araç öneri seti

Bu, kodlama yol haritası çıkarmak için yeterli omurgadır.

## 1.3 Ne eksik değil ama uygulama sırasında ayrıca üretilecek?

Aşağıdakiler yol haritası eksiği değil; uygulama sırasında üretilecek normal artefact’lardır:

* repo içi gerçek klasör ağacı
* gerçek package.json / tsconfig / lint config
* gerçek Dockerfile / compose dosyaları
* gerçek migration dosyaları
* gerçek test fixture ve acceptance script’leri
* gerçek CI pipeline dosyaları

---

# 2. Platform nedir?

Bu platform:

* klasik e-ticaret sistemi
* sosyal-commerce sistemi
* creator/fenomen mağaza sistemi
* supplier/tedarikçi operasyon sistemi
* destek / moderasyon / risk / finans / payout yönetim sistemi

aynı anda taşıyan modüler bir platformdur.

## 2.1 Platformun ana yüzeyleri

* storefront web
* panel
* BFF/gateway
* internal owner servisleri
* async worker’lar
* data layer
* observability layer

## 2.2 Platformun ana ürün yüzeyleri

* arama
* kategori/PLP
* PDP
* videolu ürün kartları
* klasik ürün kartları
* keşfet
* story
* video
* fenomen mağaza
* takip
* post
* sepet
* checkout
* ödeme
* sipariş
* kargo/takip
* iade/refund
* bildirim
* destek
* yorum/soru-cevap
* kupon/kampanya
* ödül/puan

## 2.3 Platformun ana operasyon yüzeyleri

* support ticket
* moderation
* risk/fraud
* order ops
* finance/reconciliation
* payout
* creator management
* supplier management
* admin governance

---

# 3. Kullanılacak teknoloji, araç ve çalışma seti

## 3.1 Zorunlu ana teknoloji omurgası

* Web: Next.js + React + TypeScript
* Mobil: React Native + Expo + TypeScript
* Monorepo: pnpm + pnpm workspaces
* Backend: Node.js + TypeScript
* Ana veritabanı: PostgreSQL
* Cache/helper/lock: Redis
* Arama: OpenSearch
* Local/container: Docker + Docker Compose
* Gözlemlenebilirlik: Grafana + Loki + Tempo

## 3.2 Web tarafı yardımcı kütüphaneler

* Tailwind CSS
* TanStack Query
* Zod
* React Hook Form
* shadcn/ui veya sade internal UI kit

## 3.3 Mobil tarafı yardımcı kütüphaneler

* Expo Router
* TanStack Query
* Zod
* React Hook Form
* video için expo-video veya ihtiyaç halinde native destekli video katmanı

## 3.4 Günlük geliştirme araçları

* VS Code
* Roo Code
* Git
* Node.js LTS
* pnpm
* Docker Desktop
* Postman veya Insomnia
* DBeaver veya TablePlus
* Redis Insight
* OpenSearch Dashboards
* Grafana

## 3.5 Şimdilik açılmaması gerekenler

* Kubernetes
* Kafka
* RabbitMQ
* ikinci backend dili
* MongoDB ana truth olarak

## 3.6 Çalışma modeli

* ben + VS Code + Roo Code + AI
* paket bazlı uygulama
* referans seti açık şekilde çalışma
* kanıt üretmeden kapatmama

---

# 4. Kodlamanın altın kuralları

## 4.1 Mimari altın kurallar

* owner dışı write yok
* BFF read-only aggregation
* panel direct write yok
* UI truth üretmez
* projection truth değildir
* event state mutation yerine geçmez
* önce owner truth yazılır, sonra event çıkar

## 4.2 Transition altın kuralları

* approved ≠ active
* captured ≠ order_created
* delivered ≠ review/story written
* settled ≠ payable
* payable ≠ paid_out
* return_approved ≠ refund_completed

## 4.3 Engineering altın kurallar

* apps / services / packages / infra ayrımı korunur
* service içi domain / application / infra / api ayrılır
* string literal error code çoğaltılmaz
* duplicate-safe write idempotency’siz bırakılmaz
* kritik testler atlanmaz

## 4.4 Release altın kuralları

* main korunur
* develop çöplük olmaz
* release stabilization hattıdır
* hotfix dar ve hedefli olur

---

# 5. Kodlama başlamadan hemen önce yapılacak 7 iş

## 5.1 Repo bootstrap

Amaç: gerçek repo omurgasını açmak.

Yapılacaklar:

* monorepo initialize
* root package manager config
* pnpm workspace
* tsconfig base
* apps/services/packages/infra/docs/tests kök yapısı
* base README

Referans seti:

* REPO_BLUEPRINT
* ENGINEERING_STANDARDS
* BRANCH_RELEASE_POLICY

Çıktılar:

* çalışan boş monorepo
* standard klasör ağacı
* temel build/typecheck komutları

## 5.2 Environment bootstrap

Yapılacaklar:

* Docker Compose local stack
* Postgres
* Redis
* OpenSearch
* Grafana/Loki/Tempo local stack
* env schema skeleton
* .env.example family’leri

Referans seti:

* ENVIRONMENT_ARCHITECTURE
* SERVICE_DEPLOYMENT_MAP
* SECRETS_AND_CONFIG_POLICY
* KONFIGURASYON_YONETIMI
* kullanılacak teknolojiler

## 5.3 Shared packages bootstrap

Yapılacaklar:

* packages/contracts
* packages/events
* packages/types
* packages/shared-kernel
* packages/config
* packages/testing
* packages/observability
* packages/ui

Referans seti:

* REPO_BLUEPRINT
* ENGINEERING_STANDARDS
* API_ERROR_CATALOG
* ERROR_CODE_STANDARD
* AUDIT_TAXONOMY
* EVENT_TAXONOMY

## 5.4 App skeleton bootstrap

Yapılacaklar:

* apps/web skeleton
* apps/panel skeleton
* apps/bff skeleton
* auth-aware app shell
* error boundary / query / routing foundation

Referans seti:

* SCREEN_CONTRACTS_REFINED
* PANEL_CONTRACTS
* STATEFUL_UI_BEHAVIOR_GUIDE
* FIGMA_LINKS
* üyelik giriş sistemi
* kural-yetki sistemi

## 5.5 Core engineering bootstrap

Yapılacaklar:

* lint/format/typecheck command set
* test command set
* CI skeleton
* commit/PR template
* branch protection mental model

Referans seti:

* ENGINEERING_STANDARDS
* BRANCH_RELEASE_POLICY
* DEFINITION_OF_READY
* DEFINITION_OF_DONE
* TEST_STRATEJISI

## 5.6 Error / config / observability bootstrap

Yapılacaklar:

* canonical error base types
* request_id / command_id / correlation support
* config parser layer
* logging/tracing wrappers
* health foundation

Referans seti:

* API_ERROR_CATALOG
* ERROR_CODE_STANDARD
* KONFIGURASYON_YONETIMI
* METRIC_DICTIONARY
* AUDIT_TAXONOMY
* EVENT_TAXONOMY

## 5.7 Mock / contract bootstrap

Yapılacaklar:

* OpenAPI parse/generate strategy
* contract-based mock plan
* mock vs truth ayrımı

Referans seti:

* OPENAPI files
* MOCKING_STRATEGY
* DTO_RESPONSE_CATALOG

---

# 6. Uygulama yol haritası — Fazlar ve paketler

Aşağıdaki yol haritası kodlama başlangıcından release adayına kadar olan ana uygulama sırasıdır.

## FAZ A — Teknik Omurga ve Repo Kurulumu

Hedef: repo, environment, app shell, package omurgası, gözlemlenebilirlik ve config/error dili çalışır hale gelsin.

### Paket A1 — Monorepo Foundation

İşler:

* root repo kurulumu
* workspace config
* apps/services/packages/infra açılışı
* typecheck/build skeleton

Kullanılacak set:

* REPO_BLUEPRINT
* ENGINEERING_STANDARDS
* BRANCH_RELEASE_POLICY

Çıkış kriteri:

* boş ama çalışan monorepo
* web/panel/bff build alıyor

### Paket A2 — Env + Infra Foundation

İşler:

* Docker Compose local stack
* Postgres/Redis/OpenSearch/Grafana stack
* env schema
* secret/config ayrımı

Kullanılacak set:

* ENVIRONMENT_ARCHITECTURE
* SERVICE_DEPLOYMENT_MAP
* SECRETS_AND_CONFIG_POLICY
* KONFIGURASYON_YONETIMI

Çıkış kriteri:

* local stack ayağa kalkıyor
* config parse çalışıyor

### Paket A3 — Shared Kernel + Contracts Foundation

İşler:

* error base
* ids/base errors
* contracts package
* events package
* observability package
* testing helpers

Kullanılacak set:

* API_ERROR_CATALOG
* ERROR_CODE_STANDARD
* AUDIT_TAXONOMY
* EVENT_TAXONOMY
* DTO_RESPONSE_CATALOG

Çıkış kriteri:

* ortak paketler import edilebiliyor
* error ve event omurgası hazır

### Paket A4 — App Shell Foundation

İşler:

* web shell
* panel shell
* BFF shell
* auth/session route guards skeleton
* base navigation

Kullanılacak set:

* SCREEN_CONTRACTS_REFINED
* PANEL_CONTRACTS
* üyelik giriş sistemi
* kural-yetki sistemi
* STATEFUL_UI_BEHAVIOR_GUIDE

Çıkış kriteri:

* app shell’ler çalışır
* guest/auth/panel access ayrımı görünür

---

## FAZ B — Kimlik, Yetki ve Aktör Omurgası

Hedef: auth, scope, permission, ownership ve panel/internal guard zinciri gerçek kod haline gelsin.

### Paket B1 — Auth / Session Foundation

İşler:

* auth service
* session management
* login/logout/base profile
* guest/auth separation

Kullanılacak set:

* üyelik giriş sistemi
* ACTOR_MATRIX
* GUARD_MATRIX
* PERMISSION_MATRIX
* OWNER_MATRIX

### Paket B2 — Access / Permission Foundation

İşler:

* role/scope/permission evaluation
* panel access guard
* shopper vs creator vs supplier vs panel boundary

Kullanılacak set:

* kural-yetki sistemi
* ENDPOINT_SCOPE_CATALOG
* OWNER_MATRIX
* GUARD_MATRIX

### Paket B3 — Protected Action Foundation

İşler:

* panel action request pattern
* reason/audit preconditions
* action authorization foundation

Kullanılacak set:

* APPROVAL_FLOW_PACK
* AUDIT_TAXONOMY
* PANEL_CONTRACTS
* ERROR_CODE_STANDARD

Çıkış kriteri:

* auth / access / permission omurgası gerçek ve testli
* panel yalnız protected action caller

---

## FAZ C — Commerce Core

Hedef: cart, checkout, stock, pricing, payment-initiation, order creation omurgası çalışsın.

### Paket C1 — Catalog Entry Foundation

İşler:

* ürün temel retrieval
* varyant modeli
* PDP data shaping
* category/taxonomy bağları

Kullanılacak set:

* PDP sistemi
* varyant sistemi
* kategori taksonomi sistemi
* LOGICAL_DATA_MODEL
* OPENAPI/app/public

### Paket C2 — Cart Foundation

İşler:

* cart truth
* add/remove/update
* line merge logic
* guest/auth cart behavior

Kullanılacak set:

* sepet sistemi
* üyelik giriş sistemi
* kural-yetki sistemi
* CRITICAL_JOURNEY_CHECKLIST
* ACCEPTANCE_CRITERIA_PACK

### Paket C3 — Pricing Foundation

İşler:

* merkezi fiyat service
* price snapshot
* coupon/campaign price context hooks
* checkout final price source

Kullanılacak set:

* merkezi fiyat sistemi
* SNAPSHOT_POLICY
* kampanya sistemi
* kupon sistemi
* PROMOTION_RULEBOOK

### Paket C4 — Stock Foundation

İşler:

* merkezi stok service
* sellable stock
* reservation helper
* stock validation boundary

Kullanılacak set:

* merkezi stok sistemi
* SNAPSHOT_POLICY
* TRANSITION_POLICIES
* IDEMPOTENCY_POLICIES

### Paket C5 — Checkout Foundation

İşler:

* checkout create/review
* final price + stock validation
* address/prerequisite checks
* checkout expiry

Kullanılacak set:

* checkout sistemi
* adres sistemi
* merkezi stok sistemi
* merkezi fiyat sistemi
* TRANSITION_POLICIES
* API_ERROR_CATALOG

### Paket C6 — Payment Initiation Foundation

İşler:

* payment attempt
* provider initiation abstraction
* idempotency
* timeout/unknown-result handling

Kullanılacak set:

* ödeme sistemi
* THIRD_PARTY_PROVIDER_MATRIX
* FALLBACK_RETRY_TIMEOUT_POLICY
* API_ERROR_CATALOG
* TRANSITION_POLICIES

### Paket C7 — Order Creation Foundation

İşler:

* payment confirmed -> order create
* idempotent order create
* line/package order truth
* order visibility projection

Kullanılacak set:

* sipariş sistemi
* order state machine
* VERI_AKISI_SENKRONIZASYON_MODELI
* TRANSITION_POLICIES
* CRITICAL_JOURNEY_CHECKLIST

Çıkış kriteri:

* search/PDP/cart/checkout/payment/order çekirdeği gerçek ve acceptance-ready

---

## FAZ D — Shipment, Tracking ve Post-Delivery Commerce

Hedef: shipment, delivery proof, tracking projection, return/refund, review/story eligibility zinciri kurulsun.

### Paket D1 — Shipment Foundation

İşler:

* shipment create
* package/line shipment mapping
* carrier adapter abstraction
* duplicate-safe callback ingest

Kullanılacak set:

* kargo ve teslimat sistemi
* sipariş takip sistemi
* THIRD_PARTY_PROVIDER_MATRIX
* FALLBACK_RETRY_TIMEOUT_POLICY
* shipment-delivery state machine

### Paket D2 — Tracking Projection Foundation

İşler:

* user-facing tracking timeline
* projection/truth separation
* partial delivery visibility

Kullanılacak set:

* sipariş takip sistemi
* OPERATION_LOGIC_GUIDE
* SCREEN_CONTRACTS_REFINED

### Paket D3 — Return/Refund Foundation

İşler:

* return request
* eligibility checks
* refund start/completion/unknown-result
* finance correction hooks

Kullanılacak set:

* iptal ve iade sistemi
* cancel-return state machine
* FALLBACK_RETRY_TIMEOUT_POLICY
* API_ERROR_CATALOG
* ELIGIBILITY_RULEBOOK

### Paket D4 — Post-Delivery Entitlement Foundation

İşler:

* verified purchase
* review eligibility
* story eligibility
* entitlement revoke/recompute after return/refund

Kullanılacak set:

* yorum ve puanlama sistemi
* kullanıcı story sistemi
* ELIGIBILITY_RULEBOOK
* VERI_AKISI_SENKRONIZASYON_MODELI

Çıkış kriteri:

* order -> shipment -> delivery -> return/refund -> eligibility zinciri testli ve acceptance’lı

---

## FAZ E — Social-Commerce Yüzeyleri

Hedef: içerik ve commerce birleşik yüzeyler açılır ama owner truth bozulmaz.

### Paket E1 — Klasik Kart + Video Kart Foundation

İşler:

* klasik ürün kartı
* videolu ürün kartı
* product card contract alignment
* click -> PDP / click -> story/video context

Kullanılacak set:

* klasik ürün kart sistemi
* video sistemi
* videolu ürün kart sistemi referansları
* SCREEN_CONTRACTS_REFINED

### Paket E2 — Story / Video / Explore Foundation

İşler:

* story feed surface
* video surface
* discover surface
* media playback / view tracking

Kullanılacak set:

* story sistemi
* video sistemi
* keşfet sistemi
* medya sistemi asset sistemi
* 51 arama indeksleme sistemi
* 37 öneri ve sıralama sistemi

### Paket E3 — Fenomen Mağaza + Takip Foundation

İşler:

* fenomen mağaza storefront
* takip sistemi
* creator storefront identity
* store-level visibility and commerce link

Kullanılacak set:

* fenoemen mağaza sistemi
* takip sistemi
* fenomen yönetim sistemi
* fenomen mağaza yönetim panel sistemi
* üyelik giriş sistemi

### Paket E4 — Post / Interaction Foundation

İşler:

* post sistemi
* like/save/share surface
* question/answer / comment interactions
* user story publish surface

Kullanılacak set:

* post sistemi
* beğenme kaydetme paylaşma sistemi
* soru cevap sistemi
* yorum ve puanlama sistemi
* kullanıcı story sistemi
* UGC_RULEBOOK

Çıkış kriteri:

* sosyal-commerce yüzeyler açılır ama social truth, commerce truth ve eligibility kuralları bozulmaz

---

## FAZ F — Search, Ranking, Home, Category

Hedef: discovery yüzeyleri ve arama kalitesi açılır.

### Paket F1 — Search Service Foundation

İşler:

* query intent
* retrieval/candidate
* facet/filter
* mağaza/kategori/ürün retrieval

Kullanılacak set:

* Arama Sistemi
* arama indeksleme sistemi
* VERI_AKISI_SENKRONIZASYON_MODELI
* EVENT_TAXONOMY

### Paket F2 — Ranking Foundation

İşler:

* ranking service
* feed ordering
* click/PDP/order sinyal besleme

Kullanılacak set:

* öneri ve sıralama sistemi
* METRIC_DICTIONARY
* EVENT_TAXONOMY
* KRITIK_KARAR_KUMELERI

### Paket F3 — Home / Category / Discover Surfaces

İşler:

* ana sayfa
* kategori/PLP
* discover orchestration
* read model projections

Kullanılacak set:

* ana sayfa sistemi
* kategori-plp sistemi
* keşfet sistemi
* SCREEN_CONTRACTS_REFINED

Çıkış kriteri:

* search → PDP ve discover/feed/home zinciri ölçülebilir durumda

---

## FAZ G — Promotion, Reward ve Commercial Rules

Hedef: kupon, kampanya, reward ve promotion doğruluk omurgası kurulsun.

### Paket G1 — Coupon/Campaign Foundation

İşler:

* coupon validation
* campaign apply rules
* sponsor attribution hooks
* final price consistency

Kullanılacak set:

* kupon sistemi
* kampanya sistemi
* PROMOTION_RULEBOOK
* API_ERROR_CATALOG

### Paket G2 — Reward Foundation

İşler:

* reward pending
* reward spendable
* reward revoke/recompute
* reward history projection

Kullanılacak set:

* ödül puan sistemi
* puan market sistemi
* ELIGIBILITY_RULEBOOK
* VERI_AKISI_SENKRONIZASYON_MODELI

Çıkış kriteri:

* coupon/reward flow acceptance maddeleri kapanır

---

## FAZ H — Creator / Supplier Governance

Hedef: onboarding, restriction, activation ve management yüzeyleri açılır.

### Paket H1 — Creator Lifecycle Foundation

İşler:

* application
* review/revision/approval
* activation
* restriction/suspension hooks

Kullanılacak set:

* fenomen yönetim sistemi
* creator-lifecycle state machine
* APPROVAL_FLOW_PACK
* ELIGIBILITY_RULEBOOK

### Paket H2 — Supplier Lifecycle Foundation

İşler:

* supplier application
* category/upload scope activation
* restriction/suspension hooks
* supplier panel inputs

Kullanılacak set:

* tedarikçi panel sistemi
* tedarikçi yönetim sistemi
* supplier-lifecycle state machine
* APPROVAL_FLOW_PACK

### Paket H3 — Product Acceptance Foundation

İşler:

* ürün kabul / onay
* moderation-before-visibility hooks
* supplier upload gate

Kullanılacak set:

* ürün kabul - onay sistemi
* moderation sistemi
* media sistemi asset sistemi

Çıkış kriteri:

* creator/supplier onboarding acceptance’leri kapanır

---

## FAZ I — Support, Moderation, Risk, Order Ops

Hedef: operasyon ve güvenlik omurgası gerçek çalışır hale gelsin.

### Paket I1 — Support Ticket Foundation

İşler:

* support entry
* ticket truth
* triage / queue / owner handoff

Kullanılacak set:

* destek sistemi
* destek ticket operasyon sistemi
* support-ticket state machine
* ESCALATION_MATRIX
* SLA_OWNER_LIST

### Paket I2 — Moderation Foundation

İşler:

* moderation item
* approve/reject/restrict/takedown
* panel moderation actions

Kullanılacak set:

* moderasyon sistemi
* moderation-item state machine
* APPROVAL_FLOW_PACK
* UGC_RULEBOOK

### Paket I3 — Risk/Fraud Foundation

İşler:

* risk case
* hold/release advisory
* signal consumption
* fraud/risk rules

Kullanılacak set:

* fraud risk abuse sistemi
* OPERATION_LOGIC_GUIDE
* APPROVAL_FLOW_PACK
* AUDIT_TAXONOMY

### Paket I4 — Order Operations Foundation

İşler:

* in-operation view
* line/package ops states
* shipment readiness and exception visibility

Kullanılacak set:

* sipariş operasyon sistemi
* order.md
* shipment-delivery.md
* OPERATION_LOGIC_GUIDE

Çıkış kriteri:

* support/moderation/risk/escalation journey acceptance maddeleri kapanır

---

## FAZ J — Finance, Settlement, Payout

Hedef: finansal doğruluk zinciri ve payout omurgası kurulmuş olsun.

### Paket J1 — Refund / Finance Correction Foundation

İşler:

* refund execution
* correction / reconciliation
* finance outcome projection

Kullanılacak set:

* finansal mutabakat hakediş sistemi
* ödeme sistemi
* iptal ve iade sistemi
* FALLBACK_RETRY_TIMEOUT_POLICY
* API_ERROR_CATALOG

### Paket J2 — Settlement Foundation

İşler:

* settlement line creation
* append-only adjustment
* payable preparation

Kullanılacak set:

* settlement-line state machine
* finansal mutabakat hakediş sistemi
* VERI_AKISI_SENKRONIZASYON_MODELI

### Paket J3 — Payout Foundation

İşler:

* payout batch
* payout item status
* hold/release
* sandbox payout flow

Kullanılacak set:

* payaut ödeme çıkış sistemi
* payout-batch state machine
* APPROVAL_FLOW_PACK
* FALLBACK_RETRY_TIMEOUT_POLICY
* THIRD_PARTY_PROVIDER_MATRIX

Çıkış kriteri:

* payable/payout ayrımı, unknown-result, hold/release, duplicate-risk acceptance maddeleri kapanır

---

## FAZ K — Notification, Analytics, Audit, Metrics

Hedef: sistem davranışı izlenebilir ve ölçülebilir hale gelsin.

### Paket K1 — Notification Foundation

İşler:

* notification orchestration
* inbox notifications
* transactional email sandbox
* delivery after official outcome only

Kullanılacak set:

* bildirim sistemi
* THIRD_PARTY_PROVIDER_MATRIX
* EVENT_TAXONOMY
* AUDIT_TAXONOMY

### Paket K2 — Event / Audit Foundation

İşler:

* canonical events
* audit trail
* protected action audit
* correlation/request/command ids

Kullanılacak set:

* EVENT_TAXONOMY
* AUDIT_TAXONOMY
* VERI_AKISI_SENKRONIZASYON_MODELI
* METRIC_DICTIONARY

### Paket K3 — Metrics / Analytics Foundation

İşler:

* journey metrics
* conversion metrics
* degraded/exception metrics
* dashboard seeds

Kullanılacak set:

* METRIC_DICTIONARY
* arka plan analatik ölçümleme sistemi
* KRITIK_KARAR_KUMELERI

Çıkış kriteri:

* ana journey’ler izlenebilir ve ölçülebilir hale gelir

---

## FAZ L — Hardening, Acceptance, Release Candidate

Hedef: sistemin yayın öncesi kalite kapıları kapanır.

### Paket L1 — Contract Hardening

İşler:

* openapi alignment
* DTO / screen / panel contract closure
* mock/real contract drift temizliği

### Paket L2 — Error / Edge Case Hardening

İşler:

* canonical error alignment
* degraded mode handling
* duplicate-safe checks
* timeout/retry/reconciliation tests

### Paket L3 — Acceptance Closure

İşler:

* critical journey acceptance
* support/moderation/risk acceptance
* payout/finance acceptance
* conditional limitations honest logging

### Paket L4 — Release Candidate

İşler:

* release branch
* stabilization fixes only
* release note draft
* limitation registry
* final go/no-go review

Referans seti:

* ACCEPTANCE_CRITERIA_PACK
* CODING_READINESS_GATE
* DEFINITION_OF_DONE
* BRANCH_RELEASE_POLICY
* TEST_STRATEJISI

Çıkış kriteri:

* RC oluşur
* açık limitasyonlar dürüst yazılır
* release adayına geçilir

---

# 7. Her fazda kullanılacak referans seti modeli

Her paket için minimum referans kuralı:

## 7.1 Anayasa seti

Her pakette mutlaka açık olmalı:

* KANONIK_KARARLAR_OZETI
* kural - yetki sistemi
* OWNER_MATRIX
* GUARD_MATRIX
* TRANSITION_POLICIES

## 7.2 Modül seti

Paketin ilgili sistem dosyaları:

* örn. ödeme paketi için ödeme sistemi + checkout + order + finance
* story paketi için story + medya + eligibility + notification

## 7.3 Contract seti

* ilgili OpenAPI
* SCREEN_CONTRACTS_REFINED
* PANEL_CONTRACTS
* DTO_RESPONSE_CATALOG
* API_ERROR_CATALOG

## 7.4 Mühendislik seti

* REPO_BLUEPRINT
* ENGINEERING_STANDARDS
* ERROR_CODE_STANDARD
* DEFINITION_OF_READY
* DEFINITION_OF_DONE
* TEST_STRATEJISI

## 7.5 Acceptance seti

* CRITICAL_JOURNEY_CHECKLIST
* ACCEPTANCE_CRITERIA_PACK
* CODING_READINESS_GATE

---

# 8. Her paket için çalışma ritmi

Her paket şu akışla yürütülür:

1. Paket adı ve owner alanı netleştirilir
2. Kullanılacak referans seti açılır
3. DoR checklist ile başlanır
4. Repo içinde doğru klasör ve package family seçilir
5. Contract gerekiyorsa önce yazılır/güncellenir
6. Domain/application/infra/api ayrımında implement edilir
7. Error family ve config sınıfı hizalanır
8. T0–T4 etkisine göre testler yazılır/çalıştırılır
9. Acceptance maddeleri tek tek kapatılır
10. Done checklist ile kapanır
11. Pack closure note yazılır

Net kural:

* referans seti açılmadan kod yok
* acceptance kapısı bağlanmadan paket closure yok

---

# 9. Kodlama sırasında özellikle senin eklemen gereken ama henüz isim olarak açık olmayan gerekli parçalar

Aşağıdakiler senin listende doğrudan ayrı dosya olarak geçmese de pratikte mutlaka gerekecek:

## 9.1 Gerçek repo içi teknik dosyalar

* root README
* per-service README
* root package.json
* per-app/service package.json
* pnpm-workspace.yaml
* tsconfig.base.json
* per-package tsconfig
* .env.example family’leri
* Dockerfile’lar
* docker-compose.dev.yml

## 9.2 Geliştirme kalite dosyaları

* lint config
* formatter config
* commit template
* PR template
* issue/pack template
* CI workflow files

## 9.3 Test ve fixture altyapısı

* test fixtures
* factory/builders
* mock data generators
* acceptance scenario files
* provider callback fixtures

## 9.4 Gözlemlenebilirlik seed dosyaları

* log field conventions
* dashboard seed notes
* alert rule listesi
* correlation/request/command id middleware

## 9.5 Limitation ve karar kayıtları

* PACK closure notes
* known limitation register
* change log / release notes draft
* migration registry

Bunlar “gereksiz ek yük” değil; büyük platformda hata yapmadan ilerlemek için zorunlu çalışma artefact’larıdır.

---

# 10. Hangi sırayla gerçek kodlanmalı?

En güvenli gerçek sıra şudur:

1. Repo / infra / app shell / shared packages
2. Auth / access / permission
3. Cart / pricing / stock
4. Checkout
5. Payment initiate
6. Order create
7. Shipment / tracking
8. Return / refund / finance correction
9. Review/story/reward eligibility
10. Search / category / home / discover
11. Story / video / social-commerce surfaces
12. Creator/supplier onboarding and management
13. Support / moderation / risk / order ops
14. Settlement / payout
15. Notification / analytics / audit hardening
16. Release candidate hardening

Neden bu sıra?

* önce truth owner commerce zinciri oturur
* sonra post-delivery ve social entitlement açılır
* sonra discovery ve içerik yüzeyleri büyütülür
* en son daha ağır governance ve payout alanları tamamlanır

---

# 11. Yayına kadar kapanış standartları

Bir faz veya paket ancak şu durumda kapanır:

* DoR karşılandı
* implementasyon tamamlandı
* owner boundary korunuyor
* canonical error family hizalı
* config sınıfı doğru seçildi
* T0–T4 uygun testler çalıştı
* acceptance maddeleri karşılandı
* docs güncellendi
* limitation varsa yazıldı
* kanıt üretildi

RC ancak şu durumda çıkar:

* kritik journey acceptance geçti
* known limitations dürüst yazıldı
* stabilization açık kaldıysa kayıt altında
* release branch yalnız stabilization alıyor

---

# 12. Nihai uygulama kararı

## 12.1 Karar

Kodlamaya başlanabilir.

## 12.2 Çalışma biçimi

Amaç “hepsini aynı anda yazmak” değil.
Amaç:

* paket bazlı
* referans seti açık
* acceptance bağlı
* kanıt üreten
* boundary-safe
  uygulama yürütmektir.

## 12.3 Bu yol haritası ne sağlar?

Bu yol haritası sayesinde:

* neyin önce yazılacağı bellidir
* hangi dosyaların referans alınacağı bellidir
* hangi teknolojilerin kullanılacağı bellidir
* hangi modülün hangi modülden sonra geleceği bellidir
* hangi paketin hangi acceptance maddesiyle kapanacağı bellidir
* büyük hata yapma riski ciddi biçimde düşer

---

# 13. Tek cümlelik nihai karar

Bu platform için doğru uygulama modeli şudur:

**Next.js + React Native/Expo + TypeScript + Node.js + pnpm monorepo + PostgreSQL + Redis + OpenSearch + Docker + Grafana/Loki/Tempo omurgasında; owner-boundary, transition policy, acceptance gate ve package-based delivery disiplinine bağlı modüler geliştirme.**

Bu yol haritası, ilk commit’ten release candidate’e kadar güvenli uygulama sırasını verir.
