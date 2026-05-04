# SERVICE_DEPLOYMENT_MAP

## 1. Amaç

Bu dosya, platformdaki uygulama, gateway, domain service, processing pipeline ve data bileşenlerinin hangi runtime katmanında konuşlandırılacağını ve hangi güven sınırları içinde çalışacağını bağlayıcı biçimde tanımlar.

Bu dosyanın amacı:

* servisleri public edge, gateway, internal service, processing ve data katmanlarına yerleştirmek
* hangi servisin hangi veri kaynağına ve hangi yardımcı katmana bağlanacağını netleştirmek
* owner boundary, trust zone ve projection/truth ayrımını deployment seviyesinde yorumdan çıkarmak
* staging ve production yerleşim disiplinine teknik omurga hazırlamaktır

Net kural:

* Her deployable birim public olamaz
* Aynı runtime içinde yaşamak, aynı trust seviyesinde olmak anlamına gelmez
* Projection service ile truth owner aynı deployment responsibility’ye zorlanmaz
* Background worker, request-serving app ile aynı mantıksal görev sınıfı değildir
* BFF public entry sağlar ama domain owner deploy birimi değildir

---

## 2. Kapsam

Bu harita ilk fazda aşağıdaki deployment ailelerini kapsar:

1. public-facing app deployments
2. gateway / BFF deployments
3. core domain service deployments
4. search / indexing deployments
5. media / asset processing deployments
6. async worker / reconciliation deployments
7. observability deployments
8. data store deployments
9. admin / ops access surface deployments
10. environment-level placement prensipleri

Bu dosya aşağıdaki alanları exact infra implementation seviyesinde açmaz:

* exact pod count / replica count
* autoscaling değerleri
* exact load balancer vendor seçimi
* exact storage class ve disk tipi
* exact message broker tercihi

---

## 3. Deployment katman modeli

### SD-001 — Public app deployment layer

Storefront ve panel gibi browser-facing surface’ler burada yaşar.

### SD-002 — Gateway deployment layer

Public request alabilen BFF/API gateway benzeri controlled entry’ler burada yaşar.

### SD-003 — Core service deployment layer

Owner/domain servisleri internal request-serving katmanda yaşar.

### SD-004 — Async processing deployment layer

Reconciliation, notification fan-out, indexing, asset processing, payout/review worker ve benzeri job tabanlı işler burada yaşar.

### SD-005 — Data deployment layer

Relational DB, Redis, object storage, search/index store ve benzeri persistence/helper bileşenleri burada yaşar.

### SD-006 — Observability/control deployment layer

Metrics, traces, logs, health visibility ve alerting bu katmanda yaşar.

Net kural:

* Request-serving service ile async worker aynı deployment sınıfı altında düşünülmez
* Data store ve app container aynı trust zone mantığıyla ele alınmaz

---

## 4. Public-facing app deployments

### SD-010 — Storefront web app deployment

**Placement:** Public app layer
**Visibility:** Publicly reachable via edge/CDN
**Primary Purpose:** kullanıcı yüzü, keşif, transaction UI, support entry
**Talks To:** BFF/gateway only
**Must Not Talk Directly To:** owner service endpoints, DB, Redis, raw object store

### SD-011 — Panel web app deployment

**Placement:** Public app layer but internal-governed access profile
**Visibility:** Internet reachable olabilir; fakat strict auth/role/policy ile korunur
**Primary Purpose:** review, ops, admin, approval, audit-backed action entry
**Talks To:** gateway/internal panel access boundary
**Must Not Talk Directly To:** owner DBs, internal workers, raw data stores

### SD-012 — Static asset delivery app-tier’den ayrılabilir

**Binding Rule:** Frontend static asset delivery CDN/edge üzerinden yapılabilir; ama bu katman business truth taşımaz.

---

## 5. Gateway / BFF deployments

### SD-020 — Storefront BFF deployment

**Placement:** Gateway layer
**Visibility:** Public edge arkasında reachable
**Primary Purpose:** response composition, auth-aware access brokering, read aggregation
**Talks To:** internal owner services, projection clients, auth/access service
**Must Not Own:** commerce truth, finance truth, moderation truth, payout truth

### SD-021 — Panel gateway deployment

**Placement:** Gateway layer
**Visibility:** panel surface arkasında controlled reachable
**Primary Purpose:** role-aware action routing, protected action brokering, read model access
**Talks To:** internal owner services, audit-aware action endpoints
**Must Not Own:** panel kararının truth sonucu

### SD-022 — Gateway deployment ayrı ölçeklenebilir düşünülür

**Binding Rule:** Storefront BFF ile panel gateway aynı binary olmak zorunda değildir; traffic, policy ve failure-domain açısından ayrılabilir.

### SD-023 — Gateway data erişimi sınırlıdır

**Binding Rule:** Gateway projection/read helper kullanabilir; fakat relational truth store’a domain owner yerine doğrudan semantic write yapmaz.

---

## 6. Auth / access service deployment

### SD-030 — Auth/access state service

**Placement:** Core service layer
**Visibility:** Internal-only service endpoint
**Primary Purpose:** session, identity bind, access-state, login context, auth guard support
**Talks To:** user/account relational store, session helper store, gateway/BFF, notification if needed
**Depends On:** DB + helper cache/session layer

### SD-031 — Auth service public login entry ile internal decision katmanına bölünebilir

**Binding Rule:** Login/start endpoints public entry yakınında olabilir; final access-state evaluation internal owner deployment’ta kalır. fileciteturn15file0turn15file1

---

## 7. Commerce domain deployments

### SD-040 — Cart service

**Placement:** Core service layer
**Visibility:** Internal-only
**Primary Purpose:** cart truth, line intent, merge context
**Talks To:** stock service, pricing service, checkout service, auth/access service
**Depends On:** relational store + helper cache if needed

### SD-041 — Checkout service

**Placement:** Core service layer
**Visibility:** Internal-only
**Primary Purpose:** final validation boundary, stock/price revalidation, reservation orchestration, checkout summary
**Talks To:** cart, stock, pricing, auth/access, payment orchestration
**Depends On:** relational truth + reservation helper/cache if used

### SD-042 — Order service

**Placement:** Core service layer
**Visibility:** Internal-only
**Primary Purpose:** order truth, line/package order record, order lifecycle
**Talks To:** checkout, payment orchestration, shipment/delivery ops, finance, support projection feeds
**Depends On:** relational store

### SD-043 — Reservation helper internal coordination’dur

**Binding Rule:** Reservation logic helper store veya fast lock/cache ile desteklenebilir; ancak stock truth owner boundary checkout/stock katmanında kalır. fileciteturn15file2

---

## 8. Stock ve pricing deployments

### SD-050 — Central stock service

**Placement:** Core service layer
**Visibility:** Internal-only
**Primary Purpose:** sellable stock truth, reservation effect, order/cancel/return stock impact
**Talks To:** checkout, order, return/cancel flows, supplier ingestion if needed
**Depends On:** relational truth + helper cache

### SD-051 — Central pricing service

**Placement:** Core service layer
**Visibility:** Internal-only
**Primary Purpose:** central pricing truth, corridor computation, active payable price resolution, checkout final price source
**Talks To:** cart, checkout, commerce admin controls, campaign/coupon logic
**Depends On:** relational store

### SD-052 — Stock ve pricing ayrı deployable owner boundaries’dir

**Binding Rule:** Her ikisi commerce ile ilişkili olsa da aynı service veya aynı DB responsibility’ye zorlanmaz. fileciteturn15file2turn15file3

### SD-053 — Supplier ingestion direct truth write değildir

**Binding Rule:** Supplier panel/API update akışları stock/price owner servislerine controlled input sağlar; panel deployment truth owner sayılmaz. fileciteturn15file2turn15file3turn15file1

---

## 9. Payment / finance / payout deployments

### SD-060 — Payment orchestration service

**Placement:** Core service layer
**Visibility:** Internal-only with controlled callback ingestion boundary
**Primary Purpose:** payment initiation coordination, callback intake handoff, payment state orchestration
**Talks To:** checkout, order, finance correction/reconciliation, gateway callback entry
**Depends On:** relational store + async processing

### SD-061 — Finance service

**Placement:** Core service layer
**Visibility:** Internal-only
**Primary Purpose:** refund logic, settlement truth, financial correction, reconciliation outcome
**Talks To:** payment orchestration, payout service, order, support/finance panel projections
**Depends On:** relational financial store

### SD-062 — Payout service

**Placement:** Core service layer + async worker companion
**Visibility:** Internal-only
**Primary Purpose:** payable evaluation, payout batch generation, payout line result handling
**Talks To:** finance, risk review, creator/supplier admin projections
**Depends On:** relational payout store + worker execution pipeline

### SD-063 — Provider callback entry ile finance/payout truth ayrıdır

**Binding Rule:** Public callback receive endpoint gateway/input boundary’de olabilir; final financial outcome owner service + reconciliation worker katmanında resmileşir.

---

## 10. Support / moderation / risk / lifecycle deployments

### SD-070 — Support ticket service

**Placement:** Core service layer
**Visibility:** Internal-only via support entry/gateway
**Primary Purpose:** ticket truth, queue, assignment, handoff lineage
**Talks To:** support panel, order/delivery/finance/risk/moderation projections
**Depends On:** relational store

### SD-071 — Moderation service

**Placement:** Core service layer
**Visibility:** Internal-only
**Primary Purpose:** moderation item truth, decision flow, content visibility action
**Talks To:** media asset service, creator/admin projections, risk service if needed
**Depends On:** relational moderation store

### SD-072 — Risk/fraud service

**Placement:** Core service layer + async signal worker companion
**Visibility:** Internal-only
**Primary Purpose:** risk cases, holds, suppression advisory, abuse signal evaluation
**Talks To:** finance, payout, moderation, creator/supplier lifecycle services
**Depends On:** relational case store + analytics/signal feeds

### SD-073 — Creator management service

**Placement:** Core service layer
**Visibility:** Internal-only
**Primary Purpose:** creator lifecycle truth, restriction/suspension/activation actions
**Talks To:** moderation, risk, payout projections, panel gateway
**Depends On:** relational lifecycle store

### SD-074 — Supplier management service

**Placement:** Core service layer
**Visibility:** Internal-only
**Primary Purpose:** supplier lifecycle truth, restriction/category scope/upload scope actions
**Talks To:** order ops, stock/price ingestion boundaries, risk projections, panel gateway
**Depends On:** relational lifecycle store

### SD-075 — Bu aileler aynı panel altında görünse de ayrı owner deploy’larıdır

**Binding Rule:** Support, moderation, risk, creator ve supplier action surface’i panelde birleşebilir; deployment ownership ve truth sorumluluğu birleşmez. fileciteturn15file1

---

## 11. Search / indexing deployments

### SD-080 — Search serving service

**Placement:** Core service layer
**Visibility:** Internal-only via gateway/BFF
**Primary Purpose:** query intent, candidate retrieval, facet/filter output
**Talks To:** gateway/BFF, index store, ranking service if needed
**Depends On:** search/index serving store

### SD-081 — Ranking / recommendation service

**Placement:** Core service layer
**Visibility:** Internal-only
**Primary Purpose:** final ordering, ranking signals, feed ordering decisions
**Talks To:** BFF, search serving, analytics/signal layer
**Depends On:** signal store / ranking inputs

### SD-082 — Indexing pipeline worker

**Placement:** Async processing layer
**Visibility:** Internal-only
**Primary Purpose:** reindex, document transform, refresh, index sync
**Talks To:** search serving store, owner service change feeds
**Depends On:** queue/job mechanism + index store

### SD-083 — Search owner ile ranking owner deployment’ı ayrılabilir

**Binding Rule:** Query parsing/candidate retrieval ile final ranking aynı deployable birim olmak zorunda değildir. fileciteturn15file1

---

## 12. Media / asset deployments

### SD-090 — Asset metadata / coordination service

**Placement:** Core service layer
**Visibility:** Internal-only via gateway for upload initiation if needed
**Primary Purpose:** asset registry, lifecycle state, ownership mapping, moderation linkage
**Talks To:** object storage, processing workers, moderation service, panel/upload entry
**Depends On:** relational metadata store + object storage refs

### SD-091 — Media processing worker

**Placement:** Async processing layer
**Visibility:** Internal-only
**Primary Purpose:** validation, transcode, derivative generation, preview/poster creation, hot/warm/cold movement
**Talks To:** object storage, asset metadata service, moderation queues
**Depends On:** object storage + worker queue

### SD-092 — Media delivery surface

**Placement:** CDN/public edge + controlled object serving
**Visibility:** Publicly served optimized variants only
**Primary Purpose:** final media variant delivery
**Must Not Expose:** raw internal processing paths, internal moderation state, raw original storage unless policy allows

### SD-093 — Official product media, store-vitrine media ve UGC media aynı serving policy’ye zorlanmaz

**Binding Rule:** Aynı object platformunda yaşasalar bile visibility, moderation ve cache policy’leri farklı olabilir. fileciteturn15file4

---

## 13. Notification and async action deployments

### SD-100 — Notification orchestration service

**Placement:** Core service layer + async worker companion
**Visibility:** Internal-only
**Primary Purpose:** domain outcome’larını user-facing notification’a dönüştürmek
**Talks To:** order, delivery, support, finance, creator/supplier lifecycle, auth/access
**Depends On:** notification store + async delivery workers

### SD-101 — Notification fan-out worker

**Placement:** Async processing layer
**Visibility:** Internal-only
**Primary Purpose:** inbox, push, email/sms-like channel dispatch if used

### SD-102 — Notification official outcome consumer’dır

**Binding Rule:** Notification service diğer owner’lardan event/outcome alır; kendi başına payment/delivery/refund truth üretmez.

---

## 14. Observability deployments

### SD-110 — Metrics / health stack

**Placement:** Observability layer
**Visibility:** Internal-only or restricted ops access
**Primary Purpose:** health, metrics, dashboards, alerts

### SD-111 — Log / trace stack

**Placement:** Observability layer
**Visibility:** Internal-only
**Primary Purpose:** request tracing, service logs, incident correlation

### SD-112 — Audit visibility stack

**Placement:** Observability/control layer
**Visibility:** restricted internal access
**Primary Purpose:** approval/escalation/protected action audit visibility

### SD-113 — Observability app traffic path’ine gömülmez

**Binding Rule:** User request serving ile observability storage/processing aynı failure-domain’e indirgenmez; mümkünse ayrıştırılır.

---

## 15. Data store deployments

### SD-120 — Relational DB family

**Placement:** Data layer
**Visibility:** Internal-only
**Purpose:** transactional truth stores

### SD-121 — Redis/helper cache family

**Placement:** Data/helper layer
**Visibility:** Internal-only
**Purpose:** cache, session helper, reservation helper, transient coordination
**Must Not Own:** canonical truth

### SD-122 — Object storage family

**Placement:** Data layer
**Visibility:** controlled public serving only via CDN/presigned/controlled access model
**Purpose:** media originals, derivatives, archived assets

### SD-123 — Search/index store family

**Placement:** Data layer
**Visibility:** Internal-only
**Purpose:** search serving and indexing backing store

### SD-124 — Separate data class principle

**Binding Rule:** relational truth, helper cache, object storage ve search index aynı persistence responsibility altında ezilmez.

---

## 16. Async worker deployments

### SD-130 — Reconciliation worker family

Bu family’de düşünülebilecekler:

* payment reconciliation worker
* refund correction worker
* payout result worker
* settlement adjustment worker

### SD-131 — Processing worker family

Bu family’de düşünülebilecekler:

* media processing worker
* indexing worker
* notification dispatch worker
* risk signal evaluation worker

### SD-132 — Async worker internal-only’dir

**Binding Rule:** Worker endpoint’leri public request surface gibi yayınlanmaz; job/input boundary ile tetiklenir.

### SD-133 — Worker outcome truth owner’ı değiştirmez

**Binding Rule:** Worker, owner service adına uncontrolled write yapmaz; controlled internal action pipeline ile çalışır.

---

## 17. Staging deployment ilkeleri

### SD-140 — Staging topology prod’un sade ama yapısal ikizidir

**Binding Rule:** Aynı logical katmanlar bulunmalıdır: public app, gateway, core services, workers, data, observability.

### SD-141 — Staging shared shortcuts prod’a taşınmaz

**Binding Rule:** Mock/sandbox/test shortcuts staging’de olabilir; production deployment standardı sayılmaz.

### SD-142 — Staging external dependencies test/sandbox boundary’de tutulur

**Binding Rule:** Payment, shipment, notification ve benzeri dış entegrasyonlar staging’de sandbox benzeri karşılıkla bağlanır.

---

## 18. Production deployment ilkeleri

### SD-150 — Production runtime strict boundary taşır

**Binding Rule:** Public app, gateway, core services, workers, data ve observability katmanları kontrollü boundary ve secret isolation ile çalışır.

### SD-151 — Production deploy’da bypass ve mock yoktur

**Binding Rule:** Mock service, debug bypass, unsafe internal write shortcut veya panel direct-write davranışı prod deploy standardı değildir.

### SD-152 — Production’da critical deploy families audit ve incident discipline ister

**Binding Rule:** finance, payout, moderation, risk, creator/supplier lifecycle ve admin action yüzeyleri stronger change governance ile deploy edilir.

---

## 19. Service-to-service bağlantı ilkeleri

### SD-160 — Browser -> gateway -> internal service akışı korunur

**Binding Rule:** Browser/client owner service’leri veya raw data store’ları doğrudan dolaşamaz.

### SD-161 — Internal service authz ve mTLS/eşdeğeri internal trust policy ile korunmalıdır

**Binding Rule:** Service-to-service trafik internal network’te olsa bile sınırsız güven varsayımıyla kurulmaz.

### SD-162 — Read aggregation ile command path ayrıdır

**Binding Rule:** BFF/read path ile protected action/owner command path aynı endpoint mantığı altında ezilmemelidir.

### SD-163 — Cross-domain konuşma owner boundary’yi bozmaz

**Binding Rule:** Order service finance truth mutate etmez; risk service payout sonucu yazmaz; panel gateway domain state’i direct set etmez.

---

## 20. Yasak deployment davranışları

Aşağıdaki davranışlar bu haritaya göre yasaktır:

* owner domain service’i public internetten yayınlamak
* panel web app’in owner DB’ye doğrudan bağlanması
* storefront app’in internal service’e direct privileged call yapması
* DB/Redis/search index/object storage raw endpoint’ini public açmak
* media processing worker’ı public upload serving app ile aynı güven rejiminde düşünmek
* stock ve pricing truth’unu aynı cache response katmanında “yaklaşık doğru” mantığıyla çözmek
* search candidate owner ile ranking owner boundary’sini servis yerleşiminde silmek
* finance ve payout worker’larını support/read projection katmanına gömmek

---

## 21. Faz-1 minimum deployment omurgası

İlk fazda aşağıdaki deploy family’leri zorunlu kabul edilir:

1. storefront web app
2. panel web app
3. storefront BFF/gateway
4. panel gateway
5. auth/access service
6. cart / checkout / order services
7. stock service
8. pricing service
9. payment orchestration service
10. finance service
11. payout service + worker
12. support service
13. moderation service
14. risk service + worker
15. creator management service
16. supplier management service
17. search serving + ranking + indexing worker
18. asset metadata service + media processing worker
19. notification service + dispatch worker
20. relational DB + Redis/helper + object storage + search/index store
21. observability stack

---

## 22. Faz-1 dışında bırakılan alanlar

* multi-cluster topology
* per-service multi-region failover
* exact broker topology
* exact autoscale numbers
* exact service mesh implementation details

---

## 23. Kısa sonuç

Bu harita ile aşağıdaki çekirdek kararlar sabitlenmiş olur:

* Storefront ve panel public-facing app olarak yaşar ama aynı trust profile’de değildir
* Gateway/BFF controlled entry’dir; truth owner değildir
* Domain owner servisleri internal-only konuşlandırılır
* Stock, pricing, finance, payout, moderation, risk ve lifecycle owner’ları ayrı deployable boundary taşır
* Search/indexing ve media processing ayrı worker/pipeline aileleriyle çalışır
* Notification, projection consumer’dır; official outcome owner değildir
* Relational truth, helper cache, object storage ve search store ayrı data sınıflarıdır
* Worker katmanı request-serving katmandan ayrı düşünülür

Bu dosya, Aşama 13’ün bağlayıcı service placement ve deployment boundary haritasıdır.
