# MOCKING_STRATEGY

Bu dosya, Aşama 5 kapsamında API-first geliştirme için kullanılacak mock üretim ve kullanım stratejisini tanımlar.

Amaç:
- frontend, mobil ve panel geliştirmeyi erken başlatmak
- OpenAPI sözleşmelerine bağlı örnek response/request üretmek
- mock veriyi gerçek truth gibi kullanmamak
- owner boundary, honest degradation ve state/permission kurallarını mock katmanda da korumak

Net kural:
- mock, geliştirme hızlandırma aracıdır; source of truth değildir
- mock payload, OpenAPI sözleşmesinden türetilmelidir
- mock ile gerçek backend davranışı karıştırılmamalıdır
- write başarıları sahte “garanti mutation” gibi sunulmamalıdır
- degraded, blocked, forbidden, invalid_transition, not_found gibi durumlar da mock senaryolarına dahil edilmelidir

---

## 1. MOCK STRATEJISININ KAPSAMI

Bu strateji şu yüzeyleri kapsar:

- `OPENAPI/public.yaml`
- `OPENAPI/app.yaml`
- `OPENAPI/panel.yaml`
- `OPENAPI/internal.yaml`

Mock’lar şu istemci sınıfları için kullanılabilir:
- web storefront
- mobil uygulama
- panel arayüzleri
- entegrasyon geliştiricileri
- kontrat testi / UI testi / state akışı testi

Ama şu alanlarda mock tek başına yeterli kabul edilmez:
- gerçek ödeme sağlayıcı davranışı
- gerçek payout yürütmesi
- gerçek settlement doğrulaması
- gerçek moderation/finance karar güvenliği
- gerçek stock yarış koşulları
- gerçek distributed idempotency garantisi

---

## 2. TEMEL ILKELER

### 2.1 Contract-first mock
Tüm mock payload’lar OpenAPI sözleşmelerinden türetilmelidir.
Önce contract yazılır, sonra mock üretilir.

### 2.2 Boundary-safe mock
Mock, owner boundary’yi bozmaz.
Örnek:
- BFF response mock üretilebilir
- ama BFF’nin owner truth’u yazdığı varsayılmaz

### 2.3 Read mock ve write mock ayrımı
Read mock:
- response odaklıdır
- UI geliştirmeyi hızlandırır

Write mock:
- “accepted / pending / failed / conflict” gibi sonuçları simüle eder
- başarıyı garanti edilmiş nihai truth gibi sunmaz

### 2.4 Honest failure mock
Yalnız başarı senaryoları mock’lanmaz.
Aşağıdaki sınıflar da mock’lanmalıdır:
- not_found
- unauthorized
- forbidden
- blocked_auth
- degraded_unavailable
- invalid_transition
- idempotency_conflict
- stock_insufficient
- checkout_expired
- payout_not_eligible

### 2.5 Stable fixture + scenario variant yaklaşımı
Her endpoint için:
- 1 temel “happy path” fixture
- 2–5 hata/degraded/edge fixture
üretilmelidir.

---

## 3. MOCK KATMANLARI

---

## 3.1 Static schema fixtures
Amaç:
- contract doğrulama
- temel UI bootstrap
- tip güvenliği

Özellik:
- sabit JSON fixture’ları
- hızlı ve deterministik
- CI smoke test için uygun

Kullanım:
- public home/discover/category/search
- PDP basic surface
- account dashboard read
- notification list read

---

## 3.2 Scenario fixtures
Amaç:
- state varyasyonlarını görmek
- boş / degrade / forbidden / expired akışlarını test etmek

Örnek:
- checkout ready_for_payment
- checkout invalid
- checkout expired
- order partially_delivered
- order return_requested
- notification blocked_auth
- moderation queue empty / overloaded

---

## 3.3 Stateful mock server
Amaç:
- UI akışlarını ilerletmek
- write sonrası state değişimi simüle etmek

Özellik:
- in-memory state tutabilir
- create/update/action sonrası yeni response dönebilir
- idempotency anahtarı ve duplicate davranışını taklit edebilir

Not:
Bu katman gerçek distributed guarantee vermez.
Sadece istemci akışı testi için kullanılır.

---

## 3.4 Failure-injection mock
Amaç:
- hata dayanıklılığı testi
- retry/backoff/degraded UI davranışı
- conflict / stale state testleri

Örnek:
- payment callback duplicate
- stock reservation expired
- dependency timeout
- payout batch partial_failure
- settlement line already finalized

---

## 4. YUZEY BAZLI MOCK KURALLARI

---

## 4.1 Public API mock stratejisi

Kapsam:
- home
- discover
- category
- search
- product detail
- public storefront
- public story strip

Zorunlu fixture seti:
- happy path
- empty content
- degraded response
- not_found
- partial block availability

Kurallar:
- public response’da private alan olmayacak
- personalized state dönülmeyecek
- favorite/follow/save gibi kullanıcı bağlamı public mock’a girmeyecek
- PDP’de content_layer ve social_layer ayrımı korunacak

---

## 4.2 App API mock stratejisi

Kapsam:
- session
- cart
- checkout
- payment intent
- order list/detail
- cancel/return request
- account
- notifications
- interactions
- follow
- viewer story

Zorunlu fixture seti:
- authenticated user
- guest checkout
- unauthorized
- checkout expired
- stock insufficient
- price changed
- coupon invalid
- order not found
- return not allowed
- delivery not completed
- verified/review/story eligibility inactive

Kurallar:
- guest ve authenticated akış ayrı fixture ailesi olmalı
- cart/checkout/payment/order zinciri stateful mock ile desteklenmeli
- like/favorite/save/follow için optimistic UI’yi test edecek accepted + rollback fixture’ları olmalı
- cancel/return create başarı fixture’ı “nihai refund tamamlandı” gibi davranmamalı

---

## 4.3 Panel API mock stratejisi

Kapsam:
- creator panel
- supplier panel
- admin panel
- moderation panel
- operations panel
- finance panel
- audit log

Zorunlu fixture seti:
- permission granted
- scope missing
- permission missing
- actor not allowed
- invalid transition
- reason_code missing
- accepted command
- stale state conflict

Kurallar:
- panel response write-owner gibi davranmayacak
- mutation sonucu çoğunlukla `accepted` / `command_id` temelli mock’lanmalı
- moderation, finance, operations ve lifecycle kararları ayrı role/scope fixture’ları ile test edilmeli
- audit görünürlüğü için command_id / reason_code içeren fixture’lar bulunmalı

---

## 4.4 Internal API mock stratejisi

Kapsam:
- checkout payment context
- payment create/status/callback
- order create
- shipment create/event
- return decision
- refund create
- settlement line create/adjust
- payout batch create/result
- eligibility upsert
- notification create

Zorunlu fixture seti:
- accepted command
- duplicate command
- idempotency conflict
- duplicate provider callback
- invalid transition
- upstream invalid response
- dependency timeout
- order already created
- payout not eligible

Kurallar:
- internal mock’lar command/result ayrımını korumalı
- event callback ile direct command birbirine karıştırılmamalı
- duplicate processing fixture’ları zorunlu olmalı
- settlement ve payout için line-level fixture’lar bulunmalı

---

## 5. VERI URETIM KURALI

### 5.1 Canonical fixture kimlikleri
Her fixture belirli ve tekrarlanabilir ID’ler kullanmalıdır.

Örnek:
- `prod_1001`
- `order_2001`
- `checkout_3001`
- `payment_4001`
- `shipment_5001`

Amaç:
- UI testleri ve snapshot testlerinde stabilite

### 5.2 Fixture aileleri
Her kaynak için en az:
- `happy`
- `empty`
- `error`
- `degraded`
- `edge`
ailesi önerilir.

Örnek:
- `checkout.happy.ready_for_payment.json`
- `checkout.error.expired.json`
- `checkout.error.stock_insufficient.json`

### 5.3 Cross-fixture tutarlılık
İlişkili fixture’larda referanslar tutarlı olmalıdır.

Örnek:
- `order_2001` içindeki `payment_id`
- `payment_4001` fixture’ında aynı olmalı
- `order_line_2101` ile `settlement_line_6101` bağı korunmalı

---

## 6. STATEFUL MOCK KURALLARI

Stateful mock yalnız sınırlı geliştirme amaçlı kullanılmalıdır.

### Zorunlu state zincirleri
- cart → checkout.review → checkout.ready_for_payment
- checkout → payment_in_progress → captured/failure
- payment.captured → order.created
- order → shipment.created → shipment.delivered
- delivered → verified_purchase.active
- delivered → review/story eligibility.active
- return.approved → refund.pending/completed
- refund/return → reward impact revoke senaryosu
- settlement.pending → blocked/payable/settled
- payout.created → hold/release/paid/partial_failure

### Zorunlu conflict senaryoları
- duplicate payment create
- duplicate callback
- expired checkout
- return after window closed
- payout for non-payable settlement
- moderation action on closed item
- admin lifecycle action without permission

---

## 7. DOSYA VE KLASOR ORGANIZASYONU

Önerilen yapı:

- `mocks/public/`
- `mocks/app/`
- `mocks/panel/`
- `mocks/internal/`

Alt düzen:
- `schemas/`
- `fixtures/`
- `scenarios/`
- `stateful/`

Örnek:
- `mocks/app/fixtures/cart.happy.json`
- `mocks/app/scenarios/checkout.expired.json`
- `mocks/panel/scenarios/moderation.permission_denied.json`
- `mocks/internal/scenarios/payment.duplicate_callback.json`

Net kural:
Mock dosya adı endpoint veya scenario ile açık ilişki kurmalıdır.

---

## 8. MOCK VE TEST ILISKISI

### Kullanım alanları
- frontend component testi
- page/screen entegrasyon testi
- contract testi
- smoke test
- demo environment
- panel permission görünürlük testi

### Kullanılmaması gereken yerler
- nihai finans doğrulama
- gerçek ödeme/payout güvenliği
- gerçek stok yarış koşulu testi
- gerçek failover doğrulaması
- gerçek event delivery garantisi

---

## 9. MOCK GUNCELLEME KURALI

Bir OpenAPI sözleşmesi değişirse:
1. contract güncellenir
2. ilgili fixture/scenario seti güncellenir
3. eski fixture’lar `deprecated` olarak işaretlenir veya kaldırılır
4. UI testleri yeni sözleşme ile tekrar çalıştırılır

Net kural:
Mock sözleşmenin önüne geçemez.
Sözleşme değişip mock güncellenmiyorsa mock geçersiz sayılır.

---

## 10. MINIMUM MOCK CHECKLIST

Her yeni endpoint için minimum:

- 1 happy fixture
- 1 not_found veya forbidden fixture
- 1 validation/conflict fixture
- 1 degraded/dependency fixture
- mutation ise 1 accepted + 1 idempotency/conflict fixture

Özel olarak:
- public read endpoint → happy + empty + degraded
- app checkout endpoint → happy + expired + stock_insufficient + price_changed
- panel action endpoint → accepted + permission_required + invalid_transition
- internal command endpoint → accepted + duplicate + upstream/dependency failure

---

## 11. KISA OZET

Doğru mocking stratejisi şudur:

- mock’lar OpenAPI sözleşmesinden türetilir
- mock, truth yerine geçmez
- read ve write mock ayrı ele alınır
- başarı kadar failure/degraded senaryoları da zorunludur
- public/app/panel/internal mock aileleri ayrı tutulur
- stateful mock yalnız akış testi için sınırlı kullanılır
- duplicate/idempotency/conflict senaryoları özellikle internal ve panel yüzeylerinde zorunludur
- mock veriler arası referans tutarlılığı korunur
- contract değişirse mock da hemen güncellenir