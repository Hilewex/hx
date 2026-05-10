# ENVIRONMENT_ARCHITECTURE

## 1. Amaç

Bu dosya, platformun cloud ve runtime ortam mimarisini tek doğrulu, uygulanabilir ve çakışmasız biçimde tanımlar.

Bu dosyanın amacı:

* public edge, application layer, internal service layer ve data layer sınırlarını netleştirmek
* storefront, panel, BFF, core service, search, media, observability ve data store bileşenlerinin hangi ortam ilkesine göre yaşayacağını bağlayıcı hale getirmek
* staging ve production ayrımını, network görünürlüğünü, internal/public sınırları ve ortam sorumluluğunu yorumdan çıkarmak
* uygulama katmanlarının owner sınırlarına uygun biçimde yerleşmesini sağlamaktır

Net kural:

* Ortam mimarisi, servis listesi değildir; sınır ve yerleşim disiplinidir
* Public’e açık olmak ile public internetten erişilebilir olmak aynı şey değildir
* Panel, admin ve internal servisler storefront ile aynı görünürlük rejiminde çalışmaz
* BFF public-edge arkasında yaşar ama domain truth owner değildir
* Data layer ve queue/cache layer hiçbir koşulda public edge’e açık tasarlanmaz

---

## 2. Kapsam

Bu mimari ilk fazda aşağıdaki katmanları kapsar:

1. public edge
2. CDN / media delivery edge
3. storefront app layer
4. panel app layer
5. BFF / gateway layer
6. core services layer
7. search / indexing layer
8. media processing layer
9. data layer
10. observability layer
11. internal ops/admin access layer
12. staging / production ortam ayrımı
13. secrets / config boundary prensipleri

Bu dosya aşağıdaki alanları ayrıntılı sağlayıcı seçimi seviyesinde açmaz:

* belirli cloud vendor adı
* belirli Kubernetes / VM / serverless tercihi
* exact CIDR / subnet planı
* exact Terraform / IaC modül ağacı

Bu alanlar Aşama 13’ün sonraki teknik detay dokümanlarında açılabilir.

---

## 3. Temel çevre ilkeleri

### EA-001 — Public edge ile internal network ayrıdır

**Binding Rule:** Kullanıcıdan gelen trafik önce public edge katmanına gelir; core service, data store ve processing katmanları doğrudan public internetten erişilebilir olmaz.

### EA-002 — Storefront ve panel ayrı uygulama yüzeyleridir

**Binding Rule:** Aynı cloud ortamında yaşayabilseler bile storefront app surface ile panel app surface aynı erişim rejimine bağlanmaz.

### EA-003 — BFF public erişimli olabilir ama internal trust zone’a köprü olarak çalışır

**Binding Rule:** BFF dışarıya açık API surface sağlayabilir; ancak owner truth üretmez ve internal service layer’a kontrollü gateway gibi davranır. fileciteturn15file1

### EA-004 — Owner service truth’u internal katmanda korunur

**Binding Rule:** Commerce, finance, moderation, risk, search-candidate, ranking, media processing ve benzeri owner/domain servisleri internal network’te yaşar; panel veya storefront bunlara direct write yapmaz. fileciteturn15file1

### EA-005 — Projection ve truth katmanları fiziksel yerleşimde de ayrılır

**Binding Rule:** Tracking, notification inbox, admin dashboard, BFF aggregation ve benzeri projection/read katmanları; order/payment/stock/price/payout truth katmanlarıyla aynı semantik sınıfta ele alınmaz.

### EA-006 — Staging, production ile karışmaz

**Binding Rule:** Staging ve production ayrı environment boundary’ye sahiptir; data, credentials, callback endpoint’leri ve observability akışları karışmaz.

### EA-007 — Secrets ve runtime config uygulama koduna gömülmez

**Binding Rule:** Ortam değişkenleri, secret store veya eşdeğer güvenli konfigürasyon katmanı kullanılmadan kritik secret yönetimi yapılmaz.

---

## 4. Ortam katman modeli

### 4.1 Public edge layer

Kullanıcı veya dış istemcinin ilk temas ettiği katmandır.

Örnek bileşenler:

* DNS / domain routing
* TLS termination katmanı
* CDN / edge cache
* WAF / rate limiting / edge security
* public app entry
* public API entry

### 4.2 Application access layer

Storefront ve panel uygulamalarının sunulduğu katmandır.

Örnek bileşenler:

* storefront web app
* panel web app
* static asset delivery
* auth redirect / login entry

### 4.3 Gateway / BFF layer

Public access ile internal service boundary arasındaki kontrollü erişim katmanıdır.

### 4.4 Core service layer

Domain owner servislerinin yaşadığı internal çalışma katmanıdır.

### 4.5 Data and processing layer

PostgreSQL, Redis, object storage, indexing store, media processing, background jobs, reconciliation ve benzeri bileşenlerin bulunduğu katmandır.

### 4.6 Observability and control layer

Monitoring, logging, tracing, alerting, audit visibility ve internal ops visibility katmanıdır.

Net kural:

* Bu katmanlar yalnız mantıksal değil, erişim disiplini bakımından da ayrılmalıdır
* Public edge’den data layer’a doğrudan geçiş yoktur

---

## 5. Public edge mimarisi

### EA-010 — Public edge yalnız gerekli surface’leri yayınlar

İlk fazda public edge üzerinde görünmesi doğal olan yüzeyler:

* storefront web
* public/static asset entry
* gerekiyorsa public API/BFF entry
* media CDN delivery entry

### EA-011 — Panel public domain altında olsa bile public-access semantics taşımaz

**Binding Rule:** Panel web surface internet üzerinden erişilebilir olsa bile role/auth guard, device/session güvenliği ve internal action boundary ile korunur; storefront gibi açık keşif yüzeyi değildir. fileciteturn15file1turn15file0

### EA-012 — Edge cache truth owner değildir

**Binding Rule:** CDN, cache, response cache veya edge optimization katmanları content delivery hızlandırır; order, price, stock, permission veya payout truth’u üretmez.

### EA-013 — Media delivery edge ile media processing ayrıdır

**Binding Rule:** Görsel/video CDN delivery public edge yakınında olabilir; fakat medya işleme, transcode, moderation-pending ve asset lifecycle internal processing katmanında kalır. fileciteturn15file4

---

## 6. Storefront app layer

### EA-020 — Storefront keşif ve işlem yüzüdür

Storefront app şu yüzeyleri barındırır:

* home
* discover
* category / PLP
* PDP
* store pages
* cart
* checkout entry
* order / tracking views
* support entry
* notification center

### EA-021 — Storefront truth owner değildir

**Binding Rule:** UI yalnız render katmanıdır; permission sonucu, stock uygunluğu, final price, payment durumu, moderation görünürlüğü ve benzeri truth alanları owner sistemlerden gelir. fileciteturn15file1turn15file0

### EA-022 — Storefront guest/auth boundary taşır

**Binding Rule:** Guest kullanıcı keşif yapabilir; fakat sosyal write ve hesap bağlı write aksiyonlar auth/scope guard ile açılır. Kontrollü guest checkout istisnası olsa da bu sosyal hak açmaz. fileciteturn15file0turn15file1

### EA-023 — Storefront, internal service’e doğrudan bağlı tasarlanmaz

**Binding Rule:** Storefront -> BFF/gateway -> internal services akışı korunur; browser’dan owner modüle doğrudan privileged erişim açılmaz.

---

## 7. Panel app layer

### EA-030 — Panel ayrı uygulama yüzeyidir

Panel family’si en az şu alanları kapsayabilir:

* creator management
* supplier management
* order ops
* support ops
* moderation
* finance / payout review
* commerce / campaign control
* system/admin oversight

### EA-031 — Panel direct write alanı değildir

**Binding Rule:** Panel karar başlatır, review yapar, protected action tetikler; truth’u doğrudan mutate etmez. fileciteturn15file1

### EA-032 — Panel ağırlıklı internal-governed surface’tir

**Binding Rule:** Panel public domain altında yayınlansa bile internal governance surface’i gibi ele alınır; stricter auth, role, audit ve action segregation gerektirir. fileciteturn15file1

### EA-033 — Panel ile storefront runtime güvenlik profili aynı değildir

**Binding Rule:** Session guard, action audit, permission scope, IP/device/session policy ve error visibility panelde daha sıkı olabilir.

---

## 8. BFF / gateway layer

### EA-040 — BFF read-heavy access broker’dır

**Binding Rule:** BFF aggregation yapar, projection oluşturur, response shaping yapar; owner truth mutate etmez. fileciteturn15file1

### EA-041 — BFF public access ile internal services arasında kontrollü geçittir

BFF görevleri:

* auth/session context taşıma
* response composition
* route-level access gating
* read model aggregation
* honest degradation management

### EA-042 — BFF internal service call boundary’sini korur

**Binding Rule:** Browser veya panel client owner servisleri doğrudan dolaşamaz; gateway/BFF veya controlled internal API boundary kullanılır.

### EA-043 — BFF data store owner’ı değildir

**Binding Rule:** BFF kendi projection cache’i veya response optimization alanı kullanabilir; ama stock/price/order/payment/finance truth’unu sahiplenmez.

---

## 9. Core service layer

### EA-050 — Domain owner servisleri internal service katmanında yaşar

İlk faz için bu katmanda düşünülmesi gereken owner/service aileleri:

* auth / access state
* commerce / cart / checkout / order
* payment orchestration
* finance / settlement / payout
* stock
* pricing
* search / intent / candidate
* ranking / recommendation
* moderation
* risk / fraud
* support / ticket operations
* creator management
* supplier management
* notification orchestration
* media metadata / asset coordination

### EA-051 — Owner service network visibility internal’dır

**Binding Rule:** Owner servisler public internetten doğrudan erişilebilir tasarlanmamalıdır; yalnız controlled gateway/internal service mesh üzerinden konuşur.

### EA-052 — Search ve ranking ayrı internal domain katmanlarıdır

**Binding Rule:** Search intent/candidate owner ile final ranking owner aynı service boundary’de olmak zorunda değildir; topolojide ayrı düşünülmelidir. fileciteturn15file1

### EA-053 — Stock ve price truth ayrı internal owner katmanlarıdır

**Binding Rule:** Merkezi stok ve merkezi fiyat, checkout ve siparişle ilişkili olsa da aynı truth alanı değildir; service placement’ta ayrı owner boundary korunur. fileciteturn15file2turn15file3

### EA-054 — Finance, commerce’den ayrı trust zone disiplinine sahiptir

**Binding Rule:** Payment/refund/payout/settlement akışları commerce flow ile bağlansa da financial truth owner ayrı korunur; doğrudan commerce mutasyonu değildir. fileciteturn15file1

---

## 10. Search / indexing layer

### EA-060 — Search serving ve indexing birlikte ama ayrıştırılabilir düşünülür

Bu katman en az şu bileşenleri içerir:

* query intent / parsing
* candidate retrieval
* index update pipeline
* facet / filter generation
* search serving store

### EA-061 — Indexing background/internal katmandır

**Binding Rule:** Index build, refresh, reindex, document transform ve benzeri işler public request yüzeyinde değil, background/internal job modelinde çalışır.

### EA-062 — Search serving read surface’tir, source of truth değildir

**Binding Rule:** Index veya candidate store arama experience truth’unu sağlar; fakat stock, price, permission ve payment truth’u burada üretilmez.

---

## 11. Media processing layer

### EA-070 — Asset processing internal pipeline’dır

Bu katmanda beklenen bileşenler:

* upload acceptance
* validation
* processing / transcode
* derivative generation
* moderation-pending state
* hot/warm/cold media lifecycle

### EA-071 — Object storage ile media processing ayrıdır

**Binding Rule:** Dosya depolama ayrı katmandır; validation/processing/transcode ayrı worker/pipeline katmanında yürür. fileciteturn15file4

### EA-072 — CDN public delivery, asset truth internal control ile çalışır

**Binding Rule:** Son kullanıcı optimize edilmiş media variant’ı CDN üzerinden alabilir; ancak asset lifecycle, moderation status ve derivative registry internal owner kontrolünde kalır. fileciteturn15file4

### EA-073 — UGC media ve official product media aynı erişim rejiminde değildir

**Binding Rule:** Product media, store-vitrine media ve user-generated media depolama/visibility kuralları farklı olabilir; aynı public serving davranışına zorlanmaz. fileciteturn15file4

---

## 12. Data layer

### EA-080 — PostgreSQL benzeri relational truth katmanı internal’dır

Relational truth için beklenen alanlar:

* user/account/access state
* order / line / return / shipment
* stock
* price snapshot / price rule refs
* settlement / payout / audit refs
* support / moderation / lifecycle records

### EA-081 — Redis benzeri fast-access layer helper’dır

**Binding Rule:** Cache, session helper, reservation helper, rate limiting helper veya transient coordination alanları için kullanılabilir; fakat truth owner değildir. fileciteturn15file1turn15file2

### EA-082 — Object storage ayrı data class’tır

**Binding Rule:** Media asset, processed derivative ve cold archive object storage sınıfında tutulabilir; relational state ile karıştırılmaz. fileciteturn15file4

### EA-083 — Public access only via controlled serving

**Binding Rule:** DB, Redis, raw object bucket ve internal search/index store public internetten erişilebilir açılmaz.

---

## 13. Observability layer

### EA-090 — Observability ayrı first-class katmandır

Bu katmanda en az şu aileler bulunmalıdır:

* health visibility
* logs
* metrics
* traces
* audit visibility
* incident/alert feed

### EA-091 — Staging ve production observability ayrıdır

**Binding Rule:** İki ortamın metric, alert, trace ve log akışları ayrı değerlendirilir; staging gürültüsü prod görünürlüğünü kirletmez.

### EA-092 — Audit log ile telemetry aynı şey değildir

**Binding Rule:** Teknik log, business event ve audit record farklı retention ve önem sınıfına sahiptir; tek akışta ezilmez.

---

## 14. Auth / access environment boundary

### EA-100 — Auth boundary public entry + internal verification modeliyle çalışır

**Binding Rule:** Login, session creation ve identity binding public entry üzerinden başlayabilir; fakat permission, scope ve access-state evaluation internal owner/distributed guard katmanında yürür. fileciteturn15file0turn15file1

### EA-101 — Guest ve authenticated access ayrımı edge/app seviyesinde görünür, owner seviyesinde resmileşir

**Binding Rule:** UI login wall gösterebilir; fakat final permission enforcement gateway/internal service katmanında yapılır. fileciteturn15file0turn15file1

### EA-102 — Shopper scope ile creator/supplier/panel scope aynı session semantics’e zorlanmaz

**Binding Rule:** Aynı kimlik altında birden fazla scope desteklenebilse bile runtime boundary ve permission enforcement ayrılır. fileciteturn15file0turn15file1

---

## 15. Stock / pricing / checkout environment ilişkisi

### EA-110 — Stock truth internal checkout boundary arkasında doğrulanır

**Binding Rule:** Sepet yumuşak uygunluk taşıyabilir; final stock validation internal checkout/commerce flow içinde yapılır. fileciteturn15file2

### EA-111 — Price truth internal checkout boundary arkasında doğrulanır

**Binding Rule:** Sepet snapshot taşır; final fiyat checkout anında merkezi fiyat truth’undan yeniden çekilir. fileciteturn15file3

### EA-112 — Reservation helper layer truth değildir

**Binding Rule:** Reservation coordination fast layer veya internal workflow yardımıyla yapılabilir; fakat stok owner boundary’yi bozmaz. fileciteturn15file2

### EA-113 — Payment flow validated checkout çıktısından beslenir

**Binding Rule:** Ödeme, browser sepetinden veya stale price/stock verisinden değil; doğrulanmış checkout context’inden başlar. fileciteturn15file2turn15file3

---

## 16. Staging mimarisi

### EA-120 — Staging gerçek production’ın gölgesi değil, kontrollü test ortamıdır

Staging amacı:

* deploy validation
* integration verification
* callback / provider sandbox testleri
* panel / approval / ops flow rehearsal
* search/media/process pipeline validation

### EA-121 — Staging data ve production data karışmaz

**Binding Rule:** Aynı schema yapısı olabilir; ama aynı credentials, aynı callback URL ve aynı user-facing production secret kullanılmaz.

### EA-122 — Staging external provider sandbox ile çalışabilir

**Binding Rule:** Payment, shipment, notification, storage veya benzeri entegrasyonlar staging’de mümkünse sandbox/test endpoint kullanır.

---

## 17. Production mimarisi

### EA-130 — Production gerçek kullanıcı trafiği ve gerçek truth alanıdır

**Binding Rule:** Prod environment’te yalnız production-grade secret, gerçek callback, gerçek data retention ve gerçek observability akışı çalışır.

### EA-131 — Production’da debug shortcut ve test bypass bulunmaz

**Binding Rule:** Test flag, mock shortcut, unsafe panel bypass ve benzeri staging davranışları prod’a taşınmaz.

### EA-132 — Production environment hotfix alanı değil, kontrollü işletim alanıdır

**Binding Rule:** Manuel müdahale, high-governance approval ve audited protected action modeliyle ilerler; shell-level serbest operasyon mantığı esas çözüm modeli sayılmaz.

---

## 18. Internal / public network sınırları

### EA-140 — Publicly routable yüzeyler minimum tutulur

İlk fazda public olarak düşünülebilecekler:

* storefront app
* panel entry
* BFF/public API entry
* CDN/media edge

### EA-141 — Internal-only yüzeyler

İlk fazda internal-only tasarlanması gerekenler:

* domain owner service endpoints
* DB endpoints
* Redis endpoints
* indexing/admin jobs
* media processing workers
* reconciliation / payout / correction workers
* audit store internal access

### EA-142 — Internal callback ve public callback ayrımı korunur

**Binding Rule:** Provider callback public entry’den alınabilir; fakat internal reconciliation/processing katmanına kontrollü aktarılır.

---

## 19. Secrets ve config sınır ilkeleri

### EA-150 — Secret sınıfları ayrıdır

En az şu secret/config aileleri ayrıştırılmalıdır:

* auth/session secrets
* payment provider secrets
* shipment provider secrets
* storage/media secrets
* DB credentials
* Redis credentials
* internal service credentials
* admin/panel elevated configs

### EA-151 — Config ile secret aynı şey değildir

**Binding Rule:** Feature flag, timeout, endpoint URL ve rate config ile private keys/tokens aynı sınıfta tutulmaz.

### EA-152 — Environment bazlı secret isolation zorunludur

**Binding Rule:** Staging ve production secret setleri karışamaz; aynı anahtar veya token yeniden kullanılmaz.

Bu bölüm detay olarak `SECRETS_AND_CONFIG_POLICY.md` içinde açılacaktır.

---

## 20. Ortamda yasak davranışlar

Aşağıdaki davranışlar bu mimariye göre yasaktır:

* owner service endpoint’ini public internete açmak
* DB/Redis/object storage raw erişimini public yapmak
* paneli direct-write kontrol yüzeyi gibi kurmak
* storefront’dan owner service’e doğrudan privileged call açmak
* CDN/cache katmanını truth source gibi kullanmak
* staging secret’ını prod’da kullanmak
* media processing worker’ı public upload serving ile aynı trust zone’da kurmak
* stock/price truth’u edge cache ile çözmeye çalışmak

---

## 21. Faz-1 minimum zorunlu ortam omurgası

İlk fazda aşağıdaki mimari omurga zorunlu kabul edilir:

1. public edge + CDN
2. storefront app layer
3. panel app layer
4. BFF/gateway layer
5. internal core service layer
6. internal DB/Redis/object storage layer
7. search/indexing internal pipeline
8. media validation/processing internal pipeline
9. observability layer
10. staging / production environment ayrımı
11. secret/config isolation

---

## 22. Faz-1 dışında bırakılan alanlar

* multi-region topology
* active-active failover topology
* global traffic steering detayları
* provider-specific zone planı
* exact autoscaling policy
* exact disaster recovery runbook

---

## 23. Kısa sonuç

Bu mimari ile aşağıdaki çekirdek kararlar sabitlenmiş olur:

* Public edge, internal service ve data layer ayrıdır
* Storefront ve panel farklı erişim rejimlerinde çalışır
* BFF controlled gateway’dir; truth owner değildir
* Owner/domain servisleri internal trust zone’da korunur
* Stock, price, finance, moderation, risk ve payout truth’ları ayrı owner boundary’de yaşar
* Search/indexing ve media processing ayrı internal pipeline olarak düşünülür
* Staging ve production data/secret/observability açısından ayrılır
* CDN/cache/projection katmanları truth source sayılmaz

Bu dosya, Aşama 13’ün bağlayıcı environment ve runtime boundary omurgasıdır.
