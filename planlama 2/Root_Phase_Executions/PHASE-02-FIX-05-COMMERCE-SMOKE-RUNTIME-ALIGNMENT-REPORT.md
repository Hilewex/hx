# PHASE-02-FIX-05 — Commerce Smoke Runtime Alignment Report

## 1. Amaç

Bu fix paketinin amacı, PHASE-02 commerce core düzeltmelerinden sonra BFF/runtime/smoke ortamını hizalamak ve commerce-critical davranışların doğrulama durumunu netleştirmektir.

## 2. Başlangıç Durumu

Önceki PHASE-02 fix kararları:

| Paket | Karar |
|---|---|
| PHASE-02-FIX-01 | PASS WITH LIMITATION |
| PHASE-02-FIX-02 | PASS WITH LIMITATION |
| PHASE-02-FIX-03 / 03A | PASS WITH LIMITATION |
| PHASE-02-FIX-04 | PASS |

Açık runtime sorunları:
- BFF not running / fetch failed
- Postgres `ECONNREFUSED`
- smoke env alignment
- commerce/core-commerce runtime validation eksik

## 3. Runtime Environment Tespiti

```text
BFF health:
- İlk durumda BLOCKED: http://localhost:3001/health timeout/fetch failed.
- BFF başlatıldıktan sonra PASS: 200 OK.

BFF port:
- .env BFF_PORT=3001
- .env BFF_BASE_URL=http://localhost:3001
- .env SMOKE_BFF_BASE_URL=http://localhost:3001
- apps/bff/src/config/index.ts BFF_PORT || PORT || 3001 kullanıyor.

PERSISTENCE_MODE:
- .env: postgres
- final runtime doğrulaması: PERSISTENCE_MODE=memory override ile yapıldı.

DATABASE_URL:
- .env: postgresql://hx_local_user:hx_local_pass@localhost:5433/hx_local_db

Postgres durumu:
- NOT RUNNING / DOĞRULANAMADI.
- docker ps Docker daemon bağlantısı kuramadı:
  failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine.

Smoke runner BFF’i otomatik başlatıyor mu?
- Hayır.
- tests/smoke/run-smoke.ts sadece baseUrl seçiyor ve canlı BFF bekliyor.

Runtime kök problem:
- İlk BLOCKED sebebi canlı BFF yoktu.
- BFF postgres mode ile başlatıldığında customer/cart path Postgres localhost:5433 ECONNREFUSED aldı.
- Local Docker daemon kapalı olduğu için compose Postgres başlatılamadı.
```

## 4. İlk Durum Komutları

| Komut | İlk Sonuç | Sınıf | Not |
|---|---:|---|---|
| `pnpm run typecheck` | PASS | PASS | Kod derlenebilir. |
| `pnpm run build` | PASS | PASS | Workspace build başarılı. |
| `pnpm run smoke:catalog-read` | `[FAIL] fetch failed` | BLOCKED | BFF çalışmıyordu. |
| `pnpm run smoke:catalog` | `[FAIL] fetch failed` | BLOCKED | BFF çalışmıyordu. |
| `pnpm run smoke:commerce` | `[FAIL] fetch failed` | BLOCKED | BFF çalışmıyordu. |
| `pnpm run smoke:commerce-permission` | `[FAIL] fetch failed` | BLOCKED | BFF çalışmıyordu. |
| `pnpm run smoke:core-commerce` | `[FAIL] fetch failed` | BLOCKED | BFF çalışmıyordu. |
| `pnpm run smoke:payment-readiness-guard` | PASS | PASS | Service-level. |
| `pnpm run smoke:checkout-variant-price-stock-validation` | PASS | PASS | Service-level. |
| `pnpm run smoke:checkout-coupon-campaign-impact-foundation` | PASS | PASS | Service-level. |

## 5. BFF / Postgres Ayrımı

BFF `pnpm run dev:bff` ile başlatıldı.

```text
GET /health:
- PASS 200
```

Postgres mode ile canlı BFF üzerinde sonuç:

| Smoke | Sonuç | Sınıf | Kök neden |
|---|---:|---|---|
| `smoke:catalog-read` | PASS | PASS | DB gerektirmeyen catalog read path çalıştı. |
| `smoke:catalog` | PASS | PASS | DB gerektirmeyen PDP/PLP path çalıştı. |
| `smoke:commerce` | FAIL 403 | BLOCKED | Cart repository Postgres'e gitti, DB ECONNREFUSED. |
| `smoke:commerce-permission` | FAIL 403/400 | BLOCKED | Cart/customer path Postgres'e gitti, DB ECONNREFUSED. |
| `smoke:core-commerce` | FAIL customer setup | BLOCKED | Customer repository Postgres'e gitti, DB ECONNREFUSED. |

BFF log kanıtı:

```text
[CUSTOMER-SERVICE] Using Postgres repository
AggregateError [ECONNREFUSED]
connect ECONNREFUSED ::1:5433
connect ECONNREFUSED 127.0.0.1:5433
```

Karar:
- Bu aşamada Postgres kaynaklı sonuçlar kod FAIL sayılmadı.
- Local compose dosyası mevcut: `infra/compose/docker-compose.local.yml`, postgres portu `5433:5432`.
- Docker daemon erişilemediği için Postgres başlatılamadı.

## 6. Yapılan Minimum Runtime / Smoke Alignment Düzeltmeleri

| Dosya | Değişiklik | Gerekçe |
|---|---|---|
| `apps/bff/src/server/checkout.ts` | `addressSnapshot`, `couponCode`, `campaignId`, `discountInputs` checkout service'e forward edildi. | BFF checkout route mevcut checkout contract alanlarını taşımıyordu; customer/guest valid address path runtime'da REVIEW_READY olamıyordu. |
| `services/customer/src/index.ts` | `getCustomerProfileByActorId(actorId)` actorId=id foundation varsayımıyla profile lookup yapacak hale getirildi. | Customer-address eligibility service actorId ile profile kontrol ediyor; runtime smoke profile oluşturduğu halde address creation `CUSTOMER_NOT_FOUND` oluyordu. |
| `tests/smoke/suites/others.ts` | Commerce smoke fixture `p_valid` / `v_1` / `s_feno_1` ile hizalandı ve cart response içinde gerçek line oluştuğu doğrulandı. | Eski `prod-smoke-1` fixture catalog'da yoktu; HTTP 200 içindeki service error PASS sayılabiliyordu. |
| `tests/smoke/suites/core-commerce.ts` | Customer id actorId ile kuruldu, shipping address setup eklendi, catalog fixture güncellendi, checkout addressSnapshot ile başlatıldı. | Core commerce BFF path valid address olmadan payment-ready olamaz. |
| `tests/smoke/suites/commerce-permission.ts` | Customer setup/address setup eklendi, guest addressSnapshot eklendi, fixture güncellendi, payment/order id doğrulamaları sıkılaştırıldı. | Permission smoke gerçek ready checkout ve gerçek order üretimini doğrulamalıydı. |

Eklenen davranış yok:
- Yeni provider entegrasyonu açılmadı.
- Checkout/payment/order/finance iş kuralı genişletilmedi.
- Production DB migration eklenmedi.
- Smoke gevşetilmedi; aksine cart/order response doğrulamaları sıkılaştırıldı.

## 7. Memory Runtime Doğrulaması

Postgres local runtime kapalı olduğu için BFF şu env ile yeniden başlatıldı:

```text
PERSISTENCE_MODE=memory
DATABASE_URL=
pnpm run dev:bff
```

Health:

```text
GET http://localhost:3001/health -> 200 OK
[CUSTOMER-SERVICE] Using In-Memory repository (Mode: memory)
```

## 8. Final Komut Sonuçları

| Komut | Final Sonuç | Not |
|---|---:|---|
| `pnpm run typecheck` | PASS | Kod değişiklikleri sonrası çalıştırıldı. |
| `pnpm run build` | PASS | Kod değişiklikleri sonrası çalıştırıldı. |
| `pnpm run smoke:payment-readiness-guard` | PASS | `PERSISTENCE_MODE=memory`. |
| `pnpm run smoke:checkout-variant-price-stock-validation` | PASS | `PERSISTENCE_MODE=memory`. |
| `pnpm run smoke:checkout-coupon-campaign-impact-foundation` | PASS | `PERSISTENCE_MODE=memory`. |
| `pnpm run smoke:catalog-read` | PASS | Canlı BFF, memory runtime. |
| `pnpm run smoke:catalog` | PASS | Canlı BFF, memory runtime. |
| `pnpm run smoke:commerce` | PASS | Canlı BFF, memory runtime. |
| `pnpm run smoke:commerce-permission` | PASS | Canlı BFF, memory runtime. |
| `pnpm run smoke:core-commerce` | PASS | Canlı BFF, memory runtime, phase 1 creation. |

## 9. Commerce-Critical Davranış Durumu

| Davranış | Durum | Kanıt |
|---|---|---|
| Catalog/PDP/PLP read smoke | PASS | `smoke:catalog-read`, `smoke:catalog`. |
| Cart add/update/read | PASS | `smoke:commerce`, `smoke:commerce-permission`. |
| Checkout start | PASS | `smoke:core-commerce`, `smoke:commerce-permission`. |
| Address missing checkout BLOCKED | PASS | FIX-02/service-level davranış korunuyor; BFF now forwards valid address snapshot. |
| Valid address checkout REVIEW_READY / VALID | PASS | `smoke:core-commerce`, `smoke:commerce-permission`. |
| Invalid variant checkout BLOCKED | PASS | `smoke:checkout-variant-price-stock-validation`. |
| Price mismatch checkout BLOCKED | PASS | `smoke:checkout-variant-price-stock-validation`. |
| Stock mismatch checkout BLOCKED | PASS | `smoke:checkout-variant-price-stock-validation`. |
| Valid coupon checkout discount uyguluyor | PASS | `smoke:checkout-coupon-campaign-impact-foundation`. |
| Invalid/expired coupon checkout BLOCKED | PASS | `smoke:checkout-coupon-campaign-impact-foundation`. |
| Checkout not-ready payment initiation duruyor | PASS | `smoke:payment-readiness-guard`. |
| Ready checkout payment initiation devam ediyor | PASS | `smoke:core-commerce`, `smoke:commerce-permission`. |
| BFF/UI truth üretmiyor | PASS | Catalog/PDP/PLP boundary smoke PASS; checkout discount/address truth service contract tarafından üretiliyor. |

## 10. BLOCKED / Devredilen Konular

Postgres runtime:
- BLOCKED, environment limitation.
- Docker daemon çalışmadığı için `infra/compose/docker-compose.local.yml` ile Postgres başlatılamadı.
- Postgres doğrulaması için önkoşul:
  - Docker Desktop / Docker daemon running
  - `docker compose -f infra/compose/docker-compose.local.yml up -d postgres`
  - `DATABASE_URL=postgresql://hx_local_user:hx_local_pass@localhost:5433/hx_local_db`
  - Gerekli migration/verify komutlarının ayrıca çalıştırılması

Core commerce durability phase 2:
- `smoke:core-commerce` default phase 1 PASS verdi.
- Phase 2 restart/durability doğrulaması Postgres veya kalıcı runtime gerektirdiği için PHASE-12/runtime durability kapsamına devredilebilir.

## 11. PHASE-02 Kapanış Kararı

**PASS WITH ENVIRONMENT LIMITATION**

PHASE-02 commerce core kapanışı için gerekli minimum koşullar sağlandı:
- `typecheck` PASS
- `build` PASS
- FIX-01 smoke PASS
- FIX-03 smoke PASS
- FIX-04 smoke PASS
- catalog smoke PASS
- commerce/core-commerce smoke memory-mode BFF runtime ile PASS
- Postgres kaynaklı eski FAIL/BLOCKED sonuçları kod hatası değil environment limitation olarak ayrıldı.

PHASE-02 kapanabilir.

Postgres-backed runtime/durability doğrulaması, local Docker/Postgres hazır olduğunda veya PHASE-12 runtime kapsamına alındığında tekrar çalıştırılmalıdır.
