# REPO_BLUEPRINT

## 1. Amaç

Bu dosya, platformun kod deposu iskeletini tek doğrulu, uygulanabilir ve owner-boundary uyumlu biçimde tanımlar.

Bu dosyanın amacı:

* repo kök yapısını standartlaştırmak
* `apps`, `services`, `packages` ve `infra` ayrımını bağlayıcı hale getirmek
* BFF, panel, storefront, owner servisler ve shared package’ların hangi klasör ailesinde yaşayacağını netleştirmek
* owner dışı write yasağını ve panel/BFF sınırlarını repo seviyesinde görünür kılmaktır

Net kural:

* Repo yapısı estetik tercih değil, mimari enforcement aracıdır
* Aynı klasörde bulunmak aynı owner olmak anlamına gelmez
* UI, BFF, panel ve owner servisler aynı katmanmış gibi dizilemez
* Shared package içine domain truth yazılamaz
* Panel veya BFF, owner servis klasörü gibi konumlandırılamaz

---

## 2. Kapsam

Bu blueprint ilk fazda aşağıdaki repo ailelerini kapsar:

1. root repository iskeleti
2. `apps/` yapısı
3. `services/` yapısı
4. `packages/` yapısı
5. `infra/` yapısı
6. `docs/plan` benzeri karar dokümanı alanları
7. test yerleşim mantığı
8. config/env dosya yerleşim mantığı
9. build/deploy boundary mantığı
10. yasak repo davranışları

Bu dosya aşağıdaki alanları ayrıntılı implementation seviyesinde açmaz:

* exact package manager config
* exact tsconfig içeriği
* exact CI YAML dosyası
* exact Dockerfile syntax’ı

Bunlar Aşama 14’ün diğer standart dosyalarında detaylandırılır.

---

## 3. Temel repo ilkeleri

### RB-001 — Repo yapısı owner boundary’yi görünür kılmalıdır

**Binding Rule:** Hangi kodun UI, hangi kodun gateway, hangi kodun owner service, hangi kodun shared contract olduğu dizin seviyesinde ayırt edilebilmelidir.

### RB-002 — `apps` ve `services` karıştırılmaz

**Binding Rule:** Browser-facing veya operator-facing application surface’leri `apps/` altında; internal owner/domain runtime’ları `services/` altında yaşar.

### RB-003 — `packages` domain truth taşımaz

**Binding Rule:** `packages/` ortak contract, type, SDK, util, schema veya pure shared logic barındırabilir; owner domain state mutation mantığını barındırmaz. fileciteturn17file1

### RB-004 — BFF owner service değildir

**Binding Rule:** BFF `apps/` veya gateway family’si altında yaşar; `services/` altındaki commerce/finance/stock/price truth owner’larıyla aynı family’de konumlandırılmaz. fileciteturn17file1

### RB-005 — Panel direct write alanı değildir

**Binding Rule:** Panel uygulaması `apps/` altında surface olarak yaşar; protected action’ları owner servislere yönlendirir, ama owner kodunu içermez. fileciteturn17file1

### RB-006 — Frontend truth üretmez

**Binding Rule:** UI ve panel client’ı render, form, interaction ve route barındırır; permission truth, finance truth, stock truth veya moderation truth client tarafında owner kod olarak yer almaz. fileciteturn17file1turn17file0

### RB-007 — Test yerleşimi risk sınıfına göre görünür olmalıdır

**Binding Rule:** Kritik state machine, guard, contract, integration ve acceptance testleri repo içinde ayrıştırılabilir ve bulunabilir şekilde yerleştirilmelidir. fileciteturn17file2

---

## 4. Root dizin omurgası

İlk faz için önerilen ve bağlayıcı kök yapı:

```text
/
├─ apps/
├─ services/
├─ packages/
├─ infra/
├─ docs/
├─ scripts/
├─ tests/
├─ .env.example
├─ package.json
├─ pnpm-workspace.yaml
├─ tsconfig.base.json
└─ README.md
```

Net kural:

* `apps/`, `services/`, `packages/`, `infra/` kök aileleri korunur
* Owner boundary’yi bulanıklaştıran rastgele üst düzey klasörler açılmaz
* Kritik dokümantasyon repo içinde kaybolmaz; `docs/` veya eşdeğer düzenli family altında tutulur

---

## 5. `apps/` yapısı

`apps/` kullanıcıya veya operatöre yüzey sunan uygulamaları içerir.

İlk faz için minimum app ailesi:

```text
apps/
├─ web/
├─ panel/
└─ bff/
```

### 5.1 `apps/web`

Storefront surface.

İçerir:

* route/page layer
* UI components
* client hooks
* presentation state
* UX flows
* app-safe client utilities

İçermez:

* owner truth mutation mantığı
* internal privileged credential
* finance/stock/price owner logic

### 5.2 `apps/panel`

Operator/admin/panel surface.

İçerir:

* panel pages
* review/action screens
* admin UI components
* client-safe action forms
* audit/result visibility

İçermez:

* owner domain logic implementation
* direct DB write logic
* finance/moderation/payout truth code

### 5.3 `apps/bff`

Gateway / aggregation surface.

İçerir:

* route handlers
* auth-aware brokering
* response aggregation
* read shaping
* degradation logic

İçermez:

* owner truth persistence
* financial truth mutation
* moderation decision engine
* stock/price truth source code

Net kural:

* `apps/bff` ayrı bir app/gateway family’sidir; `services/` içine taşınmaz
* `apps/panel` ve `apps/web` shared UI parçaları kullanabilir, ama aynı app’e indirgenmez

---

## 6. `services/` yapısı

`services/` internal owner/domain runtime’larını içerir.

İlk faz için minimum service ailesi:

```text
services/
├─ auth/
├─ commerce/
├─ checkout/
├─ order/
├─ stock/
├─ pricing/
├─ payment/
├─ finance/
├─ payout/
├─ support/
├─ moderation/
├─ risk/
├─ creator-management/
├─ supplier-management/
├─ search/
├─ ranking/
├─ notification/
└─ media/
```

Not:

* Bazı domain’ler tek servis yerine birden fazla deployable birime ayrılabilir
* Bu blueprint isim ailesini ve boundary mantığını sabitler; exact split daha sonra detaylandırılabilir

### 6.1 Owner-first klasörleme

Her service family kendi içinde en az şu mantıkla düzenlenebilir:

```text
services/<service-name>/
├─ src/
│  ├─ domain/
│  ├─ application/
│  ├─ infra/
│  ├─ api/
│  └─ test/
├─ package.json
├─ tsconfig.json
└─ README.md
```

### 6.2 Service içi katman ilkesi

* `domain/` = entity, value object, policy, state machine
* `application/` = use case, command handler, orchestration
* `infra/` = DB adapter, provider adapter, queue adapter
* `api/` = service endpoint / controller / transport layer
* `test/` = service-local unit/integration tests

Net kural:

* Controller altında domain truth yazılmaz
* Infra adapter business owner kararını taşımaz
* State machine ve owner policy `domain/` veya `application/` içinde görünür kalır

---

## 7. `packages/` yapısı

`packages/` reusable ama owner-truth olmayan ortak bileşenleri içerir.

İlk faz için önerilen package ailesi:

```text
packages/
├─ contracts/
├─ events/
├─ types/
├─ shared-kernel/
├─ sdk/
├─ config/
├─ observability/
├─ testing/
└─ ui/
```

### 7.1 `packages/contracts`

* API request/response contracts
* schema definitions
* DTO-like boundary contracts

### 7.2 `packages/events`

* event envelope types
* event topic/schema definitions
* event publishing/consuming helpers

### 7.3 `packages/types`

* cross-cutting safe type definitions

### 7.4 `packages/shared-kernel`

* pure utilities
* ids, base errors, shared primitives
* owner-agnostic helpers

### 7.5 `packages/sdk`

* service clients
* typed request wrappers
* gateway/internal call clients

### 7.6 `packages/config`

* config schema/parsing helpers
* env validation helpers

### 7.7 `packages/observability`

* logging/tracing wrappers
* metrics primitives

### 7.8 `packages/testing`

* fixture builders
* test helpers
* contract validation helpers

### 7.9 `packages/ui`

* shared design primitives only
* client-safe UI atoms/molecules

Net kural:

* `packages/contracts` owner business logic barındırmaz
* `packages/sdk` service truth’u implement etmez
* `packages/ui` permission truth veya checkout/finance logic taşımaz
* `packages/shared-kernel` büyüyüp gizli monolith haline gelmez

---

## 8. `infra/` yapısı

`infra/` deployment ve runtime provisioning ailelerini içerir.

İlk faz için önerilen yapı:

```text
infra/
├─ docker/
├─ compose/
├─ env/
├─ migrations/
├─ scripts/
├─ ci/
└─ topology/
```

### 8.1 `infra/docker`

* Dockerfile family’leri
* base image ve build helpers

### 8.2 `infra/compose`

* local/staging-like compose tanımları

### 8.3 `infra/env`

* env templates
* non-secret example files

### 8.4 `infra/migrations`

* migration framework entry’leri
* naming standards’a uygun migration files

### 8.5 `infra/scripts`

* deployment helpers
* maintenance scripts
* local bootstrap scripts

### 8.6 `infra/ci`

* CI workflow definitions
* validation pipeline configs

### 8.7 `infra/topology`

* deployment/topology artifacts
* environment diagrams / references

Net kural:

* Secret value `infra/` içine plaintext konmaz
* Production credential repo içinde tutulmaz
* Infra script’i owner boundary’yi by-pass eden gizli business action taşımaz

---

## 9. `docs/` yapısı

Repo içi karar dokümanları düzenli family altında tutulmalıdır.

İlk faz için önerilen yapı:

```text
docs/
├─ architecture/
├─ plan/
├─ api/
├─ runbooks/
├─ standards/
└─ topology/
```

### 9.1 `docs/architecture`

* owner boundary
* topology
* service maps
* policy docs

### 9.2 `docs/plan`

* aşama bazlı planlar
* acceptance kayıtları
* kapanış notları

### 9.3 `docs/api`

* OpenAPI references
* contract notes

### 9.4 `docs/runbooks`

* ops / incident / rollback / review guides

### 9.5 `docs/standards`

* repo blueprint
* engineering standards
* branch/release policy
* error code standard
* DoR/DoD

Net kural:

* Kritik plan ve karar dosyaları rastgele kök dosya yığını halinde bırakılmaz
* Standard dosyaları standart family altında bulunabilir olmalıdır

---

## 10. `tests/` kök yapısı

Testler yalnız servis içlerine dağılmak zorunda değildir. Repo-level acceptance ve cross-service testler için kök `tests/` family’si korunmalıdır.

Önerilen yapı:

```text
tests/
├─ acceptance/
├─ integration/
├─ contract/
└─ fixtures/
```

### 10.1 Service-local testler

* unit
* state machine
* guard
* mapper

Bunlar ilgili service/app içinde yaşayabilir.

### 10.2 Repo-level testler

* cross-service integration
* acceptance gates
* environment smoke
* contract suites

Bunlar kök `tests/` altında yaşar.

Bu yapı test stratejisiyle uyumludur:

* T0/T1 local olabilir
* T2/T3/T4 repo-level görünür olabilir. fileciteturn17file2

Net kural:

* Kritik acceptance testi gizli script içine gömülmez
* Stage/pack kapanış testleri repo içinde bulunabilir ve tekrar çalıştırılabilir olmalıdır

---

## 11. App / service / package bağımlılık kuralları

### RB-010 — `apps/*` → `packages/*` bağımlanabilir

### RB-011 — `apps/*` → `services/*` doğrudan source import etmez

**Binding Rule:** App katmanı service source code’unu import etmez; network/API/SDK boundary kullanır.

### RB-012 — `services/*` → `packages/*` bağımlanabilir

### RB-013 — Bir service başka bir service’in `domain/` klasörünü import etmez

**Binding Rule:** Cross-service reuse contract/sdk/event boundary ile yapılır; source-level domain import ile yapılmaz.

### RB-014 — `packages/*` → `apps/*` bağımlanamaz

### RB-015 — `packages/*` → `services/*` truth import’u yapamaz

Net kural:

* Shared reuse adı altında owner boundary delinmez
* Service source import zinciri gizli monolith üretmemelidir

---

## 12. Auth / scope / profile boundary’nin repo’ya yansıması

### RB-020 — Shopper ve creator/supplier scope aynı app içinde bile ayrıştırılır

**Binding Rule:** Aynı kimlik altında scope geçişi desteklenebilse de shopper flow ile creator/panel flow klasör ve route seviyesinde ayrılır. fileciteturn17file0turn17file1

### RB-021 — Guest checkout istisnası social write katmanına taşınmaz

**Binding Rule:** Commerce flow içinde guest checkout desteklenebilir; bu yüzden repo’da checkout/public entry logic ile social write guard logic’i karıştırılmaz. fileciteturn17file0turn17file1

### RB-022 — Panel scope shopper scope ile aynı package family’de ezilmez

**Binding Rule:** Permission, route ve action family’leri scope-aware biçimde ayrılır.

---

## 13. Error / config / env yerleşim ilkeleri

### RB-030 — Error code standard shared ama domain-owned olabilir

**Binding Rule:** Ortak error formatı `packages/` altında tanımlanabilir; fakat domain-specific error family’leri ilgili service içinde yaşar.

### RB-031 — Env schema repo’da, secret value repo dışında yaşar

**Binding Rule:** `.env.example`, config schema, parser ve validation repo içinde olabilir; gerçek secret value repo’ya yazılmaz.

### RB-032 — Feature flags owner truth yerine geçmez

**Binding Rule:** Static config veya flag, stock/price/finance/moderation truth kodunun yerine geçmez. fileciteturn17file1

---

## 14. Naming ve discoverability ilkeleri

### RB-040 — Klasör adı, owner veya surface işlevini açık anlatmalıdır

Örnek doğru family:

* `services/finance`
* `services/payout`
* `apps/panel`
* `packages/contracts`

### RB-041 — Aynı kavram farklı isimlerle çoğaltılmaz

**Binding Rule:** `checkout-service`, `commerce-checkout`, `order-preflight` gibi aynı alanı bulanıklaştıran çoklu family adlandırması kontrolsüz açılmaz.

### RB-042 — Generic “utils” çöplüğü oluşmaz

**Binding Rule:** Kritik shared kod purpose-based package içine yerleşir; kök veya package altında sınırsız `utils/` birikimi kabul edilmez.

---

## 15. Repo’da yasak davranışlar

Aşağıdaki davranışlar bu blueprint’e göre yasaktır:

* `apps/web` içine owner service logic yazmak
* `apps/panel` içine direct DB/business mutation koymak
* `apps/bff` içine finance/stock/pricing truth logic taşımak
* `packages/` içine gizli domain orchestration saklamak
* bir service’in başka bir service’in source domain katmanını import etmesi
* bütün ortak kodu tek dev `shared/` klasörüne yığmak
* acceptance testlerini ad-hoc script içine gizlemek
* env.example ile gerçek secret’ı aynı family’de tutmak
* shopper ve panel/creator scope’unu aynı route/app ağacında belirsiz bırakmak

---

## 16. Faz-1 minimum repo omurgası

İlk fazda aşağıdaki yapı zorunlu kabul edilir:

1. `apps/web`
2. `apps/panel`
3. `apps/bff`
4. owner service family’leri altında `services/*`
5. contract/event/type/sdk/config/testing için `packages/*`
6. runtime/deploy/migration için `infra/*`
7. standart ve plan dokümanları için `docs/*`
8. repo-level integration/acceptance için `tests/*`

---

## 17. Faz-1 dışında bırakılan alanlar

* exact monorepo tool plug-in detayları
* exact bundler choices per app
* exact per-service deployment packaging
* exact codeowners ve branch permission dosyaları

Bunlar sonraki standart dosyalarında açılabilir.

---

## 18. Kısa sonuç

Bu blueprint ile aşağıdaki çekirdek kararlar sabitlenmiş olur:

* Repo yapısı mimari enforcement aracıdır
* `apps`, `services`, `packages`, `infra` kök aileleri korunur
* Storefront, panel ve BFF ayrı surface family’leridir
* Owner/domain runtime’ları `services/` altında yaşar
* Shared package’lar truth owner değildir
* Panel ve BFF owner service yerine geçmez
* Test, docs ve infra alanları repo içinde düzenli ve bulunabilir tutulur
* Scope, permission ve owner boundary repo ağacında da görünür kılınır

Bu dosya, Aşama 14’ün bağlayıcı repo iskeleti ve kod yerleşim omurgasıdır.
