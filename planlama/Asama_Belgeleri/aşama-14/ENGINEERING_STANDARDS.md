# ENGINEERING_STANDARDS

## 1. Amaç

Bu dosya, platformun repo içindeki günlük mühendislik çalışma disiplinini tek doğrulu, uygulanabilir ve owner-boundary uyumlu standartlara dönüştürür.

Bu dosyanın amacı:

* dosya ve klasör isimlendirme mantığını bağlayıcı hale getirmek
* kod yerleşimi, modül sınırı, env/config, migration, idempotency ve hata dili gibi alanlarda ortak mühendislik standardı kurmak
* ekip içinde "aynı problemi herkes farklı biçimde çözsün" kaosunu engellemek
* repo blueprint’te tanımlanan `apps / services / packages / infra` omurgasının günlük üretim dilini sabitlemektir

Net kural:

* Standartlar estetik tercih değildir; mimari güvenlik aracıdır
* Aynı işi iki farklı isim ve iki farklı desenle çözmek kabul edilmez
* Owner boundary’yi zayıflatan kısa yollar mühendislik standardı sayılmaz
* Panel, BFF ve UI için ayrı; owner service için ayrı çalışma disiplini vardır
* Test ve kanıt standardı olmayan iş, mühendislik tamamlanmış sayılmaz

---

## 2. Kapsam

Bu standart ilk fazda aşağıdaki alanları kapsar:

1. isimlendirme standardı
2. dosya ve klasör yerleşimi standardı
3. service içi katman standardı
4. route / endpoint / action standardı
5. error ve idempotency dilinin mühendislik kullanımı
6. migration naming standardı
7. env/config dosya standardı
8. shared package standardı
9. test yerleşimi ve isimlendirme standardı
10. commit / PR hazırlık standardı
11. yasak mühendislik davranışları

Bu dosya aşağıdaki alanları ayrıntılı araç/komut seviyesinde açmaz:

* exact lint config
* exact formatter config
* exact tsconfig flags
* exact CI command list

Bu alanlar diğer mühendislik yardımcı dosyalarında detaylandırılabilir.

---

## 3. Temel mühendislik ilkeleri

### ES-001 — Owner boundary kod seviyesinde görünür olmalıdır

**Binding Rule:** Hangi kodun render, hangi kodun gateway, hangi kodun owner policy, hangi kodun contract olduğu dosya ve klasör düzeyinde ayırt edilebilmelidir. fileciteturn17file1

### ES-002 — UI yalnız render ve interaction katmanıdır

**Binding Rule:** UI bileşenleri permission truth, stock truth, pricing truth, finance truth veya moderation truth hesaplamaz; bunları yalnız yansıtır. fileciteturn17file1turn17file0

### ES-003 — BFF read-only engineering disiplininde kalır

**Binding Rule:** BFF route, aggregation, shaping ve honest degradation yapabilir; owner state mutation veya finance/stock/pricing truth code’u taşımaz. fileciteturn17file1

### ES-004 — Panel protected action caller’dır

**Binding Rule:** Panel ekranı action başlatır, review gösterir, audit sonucu yansıtır; owner service logic’ini client tarafına taşımaz. fileciteturn17file1

### ES-005 — Test kanıtı mühendislik çıktısının parçasıdır

**Binding Rule:** Özellikle state machine, owner boundary, contract, idempotency ve kritik zincir değişikliklerinde test ve kanıt standardı zorunludur. fileciteturn17file2

---

## 4. İsimlendirme standardı

### 4.1 Genel dosya isimlendirme

Aşağıdaki standart tercih edilir:

* klasörler: `kebab-case`
* genel kaynak dosyaları: `kebab-case`
* React component dosyaları: `PascalCase.tsx`
* type/schema/contract dosyaları: `kebab-case.ts`
* test dosyaları: hedef dosya adına bağlı açık isim

Örnek:

* `services/finance/src/domain/refund-policy.ts`
* `apps/web/src/components/pdp/BuyBox.tsx`
* `packages/contracts/src/order-create.ts`

### 4.2 Aynı kavram tek isim ailesiyle yaşar

**Binding Rule:** Aynı şey için repo içinde rastgele farklı adlar kullanılmaz.

Yanlış örnekler:

* `checkout-service`, `commerce-checkout`, `checkout-core` aynı semantik için
* `refund-engine`, `money-return`, `refund-runner` aynı owner truth için

### 4.3 Dosya adı işlevi anlatmalıdır

**Binding Rule:** `helpers.ts`, `misc.ts`, `temp.ts`, `new.ts`, `final.ts`, `last.ts` gibi belirsiz dosya adları kabul edilmez.

---

## 5. Klasör yerleşimi standardı

### ES-010 — App katmanında feature-first, truth-last yaklaşımı

`apps/web` ve `apps/panel` içinde klasörler surface/feature odaklı düzenlenebilir:

```text
apps/web/src/
├─ pages/
├─ components/
├─ hooks/
├─ features/
├─ types/
└─ lib/
```

Net kural:

* `lib/` gizli business truth çöplüğü olmaz
* `features/` client orchestration taşıyabilir ama owner logic taşımaz

### ES-011 — Service katmanında domain-first yaklaşım

Service içinde şu ayrım korunur:

```text
src/
├─ domain/
├─ application/
├─ infra/
├─ api/
└─ test/
```

Bu ayrım repo blueprint ile bağlayıcıdır.

### ES-012 — Package katmanında amaç-first yaklaşım

`packages/contracts`, `packages/events`, `packages/testing`, `packages/config` gibi açık amaçlı family’ler korunur.

Net kural:

* `shared/` veya `common/` tek başına yeterli açıklık sayılmaz
* owner truth package içine gizlenmez

---

## 6. Service içi katman standardı

### ES-020 — `domain/`

İçerir:

* entity
* value object
* invariant
* state machine
* policy
* domain event definitions if local

İçermez:

* HTTP concern
* DB adapter
* framework-specific transport logic

### ES-021 — `application/`

İçerir:

* use case
* command handler
* workflow/orchestration
* permission gate integration
* transaction boundary orchestration

İçermez:

* raw controller code
* UI concern

### ES-022 — `infra/`

İçerir:

* repository implementation
* provider adapter
* storage client
* queue client
* external integration glue

İçermez:

* owner policy’nin ana kaynağı

### ES-023 — `api/`

İçerir:

* route/controller/transport
* DTO binding
* request parsing
* response shaping

İçermez:

* business policy’nin ana tanımı

Net kural:

* Controller’da domain karar yazılmaz
* Infra adapter’da permission truth yazılmaz
* State transition logic transport katmanına sızmaz

---

## 7. Route / endpoint / action standardı

### ES-030 — User action, panel action ve internal action ayrılır

**Binding Rule:** Aynı işlev görünse bile farklı aktörler için farklı endpoint/action family kullanılmalıdır. fileciteturn17file1

Örnek ayrım:

* `/me/orders/...`
* `/panel/orders/...`
* `/internal/orders/...`

### ES-031 — BFF route ile owner route karıştırılmaz

**Binding Rule:** BFF surface route’ları response aggregation içindir; owner mutation route’ları ilgili internal service’te yaşar. fileciteturn17file1

### ES-032 — Protected action isimleri açık olmalıdır

Örnek:

* `approve`
* `reject`
* `request-revision`
* `hold`
* `release`
* `suspend`
* `reactivate`

Belirsiz action adı kullanılmaz:

* `handle`
* `process`
* `change-status`

### ES-033 — Invalid shortcut endpoint açılmaz

**Binding Rule:** Tek endpoint içinde role/scope/action karmaşası yaratacak aşırı genel uçlar açılmaz.

---

## 8. Error standardının mühendislik kullanımı

### ES-040 — Error code string’i rastgele yazılmaz

**Binding Rule:** Hata kodları standard family’ye bağlı üretilir; string literal çoğaltma kabul edilmez.

### ES-041 — Domain error ile transport error ayrılır

Örnek:

* domain: eligibility_failed, invalid_transition, insufficient_stock
* transport: bad_request, unauthorized, forbidden, internal_error

### ES-042 — Error response deterministic olmalıdır

**Binding Rule:** Aynı hata sınıfı aynı shape ve aynı code family ile dönmelidir.

Bu alanın resmi formatı `ERROR_CODE_STANDARD.md` içinde detaylanacaktır.

---

## 9. Idempotency standardının mühendislik kullanımı

### ES-050 — Idempotency kritik write’larda first-class’tır

Kritik alanlar:

* payment create/callback
* order create
* refund execution
* payout processing
* shipment callback
* moderation repeat-safe actions gerektiğinde

### ES-051 — Idempotency key formatı elle uydurulmaz

**Binding Rule:** Key formatı standard family’ye bağlı olmalıdır; random ad hoc key üretimi kabul edilmez.

### ES-052 — Duplicate-safe davranış kodda görünür olmalıdır

**Binding Rule:** Aynı write ikinci kez geldiğinde ne olacağı açık branch/state/error/result olarak görünmelidir; sessiz tekrar yazım kabul edilmez. fileciteturn17file2

Bu alanın resmi formatı sonraki standard dosyasında detaylandırılabilir.

---

## 10. Migration naming standardı

### ES-060 — Migration adı zaman + amaç taşır

Örnek format:

* `20260422_create_order_tables`
* `20260422_add_checkout_expiry_fields`
* `20260422_append_finance_correction_columns`

### ES-061 — Migration adı belirsiz olamaz

Yanlış örnekler:

* `fix-db`
* `update-schema`
* `new-changes`

### ES-062 — Bir migration tek net amaç taşımalıdır

**Binding Rule:** Aynı migration içinde ilgisiz 5 farklı domain tablo değişikliği yığılmaz.

### ES-063 — Destructive migration governance ister

**Binding Rule:** Drop/rename/backfill etkili migration’lar dikkatli review ve rollout disiplini gerektirir.

---

## 11. Env / config dosya standardı

### ES-070 — `.env.example` repo içi contract’tır

**Binding Rule:** Örnek env dosyası secret value değil, beklenen key shape ve açıklama taşır.

### ES-071 — Service bazlı env schema olabilir

Örnek:

* `services/finance/src/config/env.ts`
* `apps/bff/src/config/env.ts`

### ES-072 — Env parse edilmeden kullanılmaz

**Binding Rule:** Raw `process.env` veya eşdeğer kullanım dağınık biçimde kod geneline saçılmaz; config schema/parser katmanı kullanılır.

### ES-073 — Public config ve internal config ayrılır

**Binding Rule:** Frontend’de kullanılacak env ile internal owner/service config aynı family’de tutulmaz.

---

## 12. Shared package standardı

### ES-080 — `packages/contracts`

Sadece boundary contracts içerir.

### ES-081 — `packages/events`

Sadece event envelope/type/schema içerir.

### ES-082 — `packages/testing`

Fixture, test helper, mock builder içerir; production domain truth taşımaz.

### ES-083 — `packages/ui`

Sadece client-safe shared UI primitives içerir.

### ES-084 — `packages/shared-kernel`

Minimal tutulur.

Net kural:

* Shared reuse adına domain logic package’a taşınmaz
* `packages/shared-kernel` büyüyüp ikinci monolith olmaz

---

## 13. Test yerleşimi ve isimlendirme standardı

### ES-090 — Unit/state/guard testleri kaynağa yakın tutulabilir

Örnek:

* `refund-policy.test.ts`
* `checkout-state-machine.test.ts`
* `permission-guard.test.ts`

### ES-091 — Cross-service integration testleri repo-level görünür olur

Örnek:

* `tests/integration/checkout-payment-order.test.ts`
* `tests/acceptance/payout-hold-release.acceptance.test.ts`

### ES-092 — Test adı davranışı anlatmalıdır

Yanlış:

* `service.test.ts`
* `random.test.ts`
* `misc.spec.ts`

Doğru:

* `payment-unknown-result-reconciliation.test.ts`
* `panel-protected-action-permission.test.ts`

### ES-093 — Test seviyesi değişikliğin etkisine göre seçilir

Bu, test stratejisiyle bağlayıcıdır:

* T0 = static doğrulama
* T1 = module behavior
* T2 = contract
* T3 = integration
* T4 = acceptance. fileciteturn17file2

---

## 14. Commit ve PR hazırlık standardı

### ES-100 — Commit küçük ama anlamlı olmalıdır

**Binding Rule:** Tek commit içinde ilgisiz domain’ler karıştırılmaz.

### ES-101 — PR açıklaması şu alanları taşımalıdır

Minimum:

* ne değişti
* neden değişti
* hangi owner/domain etkilendi
* hangi test seviyesi çalıştı
* bilinen sınırlama var mı

### ES-102 — PR “çalışıyor gibi” diliyle kapanmaz

**Binding Rule:** Özellikle kritik akışlar için test kanıtı veya doğrulama bilgisi bulunmalıdır. fileciteturn17file2

### ES-103 — Boundary-breaking değişiklik explicit işaretlenir

**Binding Rule:** Owner boundary, contract, state machine, permission veya idempotency etkileyen PR açıkça işaretlenmelidir.

---

## 15. Kod içi yasak davranışlar

Aşağıdaki davranışlar bu standartlara göre yasaktır:

* UI component içine business truth gömmek
* BFF route içinde owner mutation yapmak
* panel client’ta direct privileged logic yazmak
* service’ler arası source import ile domain reuse yapmak
* `utils.ts` çöplüğüne kritik logic yığmak
* env değerlerini rastgele farklı dosyalarda parse etmek
* string literal error code çoğaltmak
* migration adı belirsiz bırakmak
* duplicate-safe olması gereken write akışını idempotency’siz bırakmak
* testleri gizli script veya kişisel komut bilgisine bağımlı kılmak

---

## 16. Faz-1 minimum mühendislik standardı

İlk fazda aşağıdaki standartlar zorunlu kabul edilir:

1. tek isimlendirme disiplini
2. app/service/package/infra boundary korunması
3. service içi `domain/application/infra/api` ayrımı
4. user/panel/internal action ayrımı
5. error family standardı
6. idempotency kritik write standardı
7. migration naming standardı
8. env schema + example dosya standardı
9. test isimlendirme ve seviye standardı
10. PR açıklama ve test kanıtı standardı

---

## 17. Faz-1 dışında bırakılan alanlar

* exact lint rule catalog
* exact formatting rule catalog
* codeowners file syntax
* exact code coverage targets
* exact commit message grammar standardı

Bu alanlar gerekirse alt standart dosyalarında açılabilir.

---

## 18. Kısa sonuç

Bu standart ile aşağıdaki çekirdek kararlar sabitlenmiş olur:

* Kod yerleşimi owner boundary’yi görünür kılmalıdır
* UI, panel ve BFF kendi sınırında kalır; owner truth’a sızmaz
* Shared package’lar contract/type/util barındırır; truth owner olmaz
* Error, idempotency, env ve migration alanlarında tek dil kullanılır
* Test seviyesi risk ve değişiklik ağırlığına göre seçilir
* PR ve kapanış dili kanıt üretmek zorundadır

Bu dosya, Aşama 14’ün bağlayıcı mühendislik çalışma ve kod yerleşim standardıdır.
