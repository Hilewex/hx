# PHASE-02 — Commerce Core Source Review Report

## 1. Amaç

Bu rapor, PHASE-02 Commerce Core Readiness kapsamında havuz, ürün kabul, commercial pool, creator binding, variant, price, stock, cart, checkout, address ve coupon/campaign checkout etkisini source/boundary/test kanıtlarıyla değerlendirmek için hazırlanmıştır.

## 2. Başlangıç Durumu

```text
PHASE-01: PASS WITH LIMITATION
PHASE-02: GO
Ana blocker: PX-HAVUZ-05 PARTIAL / build borcu
```

Not: `PHASE-02-COMMERCE-CORE-READINESS.md` repo kökünde okunabilir içerikle bulunamadı; review canlı source, contract, BFF handler ve mevcut smoke scriptleri üzerinden yapıldı.

## 3. Executive Summary

| Alan | Sonuç | Not |
|---|---|---|
| PX-HAVUZ-05 build/type borcu | PASS | `ListSupplierSubmittedProductsQuery` contract/service import uyumu mevcut; typecheck/build geçti. |
| Havuz / commercial pool / creator binding | PASS WITH LIMITATION | Owner command ve scope guard var; ayrı `services/product-acceptance` yok, pool in-memory foundation. |
| Variant readiness | PARTIAL | Variant contract/projection var; cart required kontrolü productId string heuristic ile yapılıyor, invalid variant doğrulaması yok. |
| Price readiness | PARTIAL | Pricing owner servisi var fakat `FOUNDATION_SIMULATED`; price conflict/snapshot/coupon etkisi eksik. |
| Stock readiness | PARTIAL | Stock owner servisi var fakat `FOUNDATION_SIMULATED`; reservation lifecycle yok. |
| Cart readiness | PARTIAL | Duplicate-safe line merge ve quantity guard var; invalid/inactive/archived product doğrulaması deterministik owner truth'a bağlı değil. |
| Checkout readiness | FAIL | `REVIEW_READY`/`VALID` var fakat `ready_for_payment` yok; payment service invalid checkout'u sadece logluyor, bloklamıyor. |
| Address / guest checkout | PARTIAL | Customer address owner var; checkout address snapshot/eligibility kullanmıyor, guest contact/address şartı yok. |
| Coupon / campaign impact | FAIL | `services/coupon` ve `services/campaign` yok; checkout discount/sponsor/usage behavior yok. |
| BFF / UI truth | PASS WITH LIMITATION | BFF public service delegation yapıyor; UI bootstrap demo akışları ve legacy guest token simülasyonları kalıyor. |
| Typecheck / build | PASS | `pnpm run typecheck` ve `pnpm run build` geçti. |
| Targeted smoke | PARTIAL | Catalog smoke PASS; commerce/core-commerce smoke canlı BFF + Postgres/auth/runtime uyumsuzluklarında FAIL. |

## 4. Kanıtlı Bulgular

| No | Alan | Dosya | Fonksiyon / Handler | Bulgu | Risk | Karar |
|---|---|---|---|---|---|---|
| 1 | PX-HAVUZ-05 type | `packages/contracts/src/pool.ts:272` | `ListSupplierSubmittedProductsQuery` | Query tipi canlı contract içinde tanımlı. | Eski missing type blocker görünmüyor. | PASS |
| 2 | PX-HAVUZ-05 service | `services/pool/src/pool.ts:399` | `listSupplierSubmittedProducts` | Service aynı contract tipini import edip supplier scope filtresi uyguluyor. | Persistence yok; in-memory foundation. | PASS WITH LIMITATION |
| 3 | PX-HAVUZ-05 build | workspace | `pnpm run typecheck`, `pnpm run build` | İki komut da geçti. | Runtime smoke ayrı değerlendirilir. | PASS |
| 4 | Product acceptance | `services/pool/src/pool.ts:164` | `submitSupplierProductForReview` | Supplier submission DRAFT/REVISION_REQUESTED durumundan SUBMITTED'a geçiyor; variant/price/stock minimum input kontrolü var. | Validation temel düzeyde, gerçek catalog/price/stock owner doğrulaması değil. | PASS WITH LIMITATION |
| 5 | Admin review | `services/pool/src/pool.ts:221`, `:303`, `:326`, `:355` | `startProductReview`, `approveSupplierProduct`, `rejectSupplierProduct`, `suspendSubmittedProduct` | ADMIN/OPERATOR actor validation ile review state transition var. | Ayrı product-acceptance package yok. | PASS WITH LIMITATION |
| 6 | Commercialize boundary | `services/pool/src/pool.ts:421` | `commercializeApprovedProduct` | Yalnız APPROVED submitted product commercial pool `PENDING` olabilir; duplicate commercialize guard var. | Snapshot in-memory. | PASS |
| 7 | Binding boundary | `services/pool/src/pool.ts:478` | `bindCommercialPoolProduct` | Binding pricing/stock/category/media snapshot üretir; actor ADMIN/OPERATOR. | Pricing/stock kontrolü submitted variant inputundan yapılır, gerçek owner servis çağrısı değil. | PASS WITH LIMITATION |
| 8 | Activation guard | `services/pool/src/pool.ts:575` | `activateCommercialPoolProduct` | Archived activate engelleniyor; activation için all-bound snapshot zorunlu. | Binding snapshot stale olabilir; persistence yok. | PASS WITH LIMITATION |
| 9 | Creator binding scope | `services/pool/src/pool.ts:668` | `addCommercialProductToCreatorStore` | CREATOR actor ve `creatorStoreId` scope eşleşmesi zorunlu; yalnız ACTIVE + all-bound commercial product eklenir. | Creator selectedPrice price corridor ile doğrulanmıyor. | PASS WITH LIMITATION |
| 10 | BFF pool boundary | `apps/bff/src/server/pool.ts:30`, `:338` | `extractPoolActorContext`, `bindCommercialProduct` | BFF `@hx/pool` public package'e delegate ediyor; repo direct write yok. | Supplier/creator id header'dan geliyor; auth claim binding yok. | PASS WITH LIMITATION |
| 11 | Pool route guard | `apps/bff/src/server/index.ts:871` | `/pool/*` routing | Admin ve supplier route actor type guard var; binding/activation admin branch altında. | Route-level authorization basit role check. | PASS WITH LIMITATION |
| 12 | Variant service | repo | `services/variant` | Ayrı variant service yok. | Sellable unit owner boundary net değil. | PARTIAL |
| 13 | Variant projection | `packages/contracts/src/catalog.ts:26`, `services/catalog/src/catalog.ts:70` | `ProductVariant`, foundation products | PDP/catalog variant projection ve `defaultVariantId` var. | PDP seçim zorunluluğu BFF/cart seviyesinde genel kural değil. | PARTIAL |
| 14 | Cart variant guard | `services/commerce/src/cart.ts:120` | `addToCart` | Variant required kontrolü `productId.includes('variant_req')` heuristic ile yapılıyor. | Gerçek product variant requirement/invalid variant doğrulaması yok. | PARTIAL |
| 15 | Checkout variant snapshot | `services/checkout/src/checkout.ts:98` | `startCheckout` line loop | Checkout line validation `variantId` taşıyor. | Invalid variant ayrıca doğrulanmıyor. | PARTIAL |
| 16 | Pricing owner | `services/pricing/src/pricing.ts:3` | `resolvePrice` | Fiyat BFF/UI'da değil pricing servisinde hesaplanıyor. | Kaynak `FOUNDATION_SIMULATED`; gerçek price truth değil. | PARTIAL |
| 17 | Price snapshot | `services/checkout/src/checkout.ts:106`, `:127`, `:159` | `startCheckout` | Checkout anında price resolve edilip unit/line/grand total set ediliyor. | Cart price ile checkout price conflict karşılaştırması yok. | PARTIAL |
| 18 | BFF price truth | `apps/bff/src/server/cart.ts:25`, `apps/bff/src/server/checkout.ts:22` | cart/checkout handlers | BFF fiyat hesaplamıyor, commerce/checkout service'e delegate ediyor. | Service foundation olduğu için readiness sınırlı. | PASS WITH LIMITATION |
| 19 | Stock owner | `services/stock/src/stock.ts:4` | `resolveStock` | Stock BFF/UI'da değil stock servisinde resolve ediliyor. | Kaynak `FOUNDATION_SIMULATED`; reservation/real inventory yok. | PARTIAL |
| 20 | Cart stock guard | `services/commerce/src/cart.ts:96`, `:189` | `addToCart`, `updateCartLine` | Add/update stock resolve edip unavailable durumda hata dönüyor. | Add-to-cart final reservation guarantee değil. | PASS WITH LIMITATION |
| 21 | Checkout stock validation | `services/checkout/src/checkout.ts:114`, `:132` | `startCheckout` | Checkout tekrar stock validate ediyor, out-of-stock line'ı BLOCKED yapıyor. | Reservation/oversell lifecycle yok. | PARTIAL |
| 22 | Cart duplicate-safe | `services/commerce/src/cart.ts:88` | `addToCart` | Aynı product+variant+storefront line merge ediliyor. | Idempotency key yok; concurrent duplicate risk açık. | PASS WITH LIMITATION |
| 23 | Cart invalid product | `services/commerce/src/cart.ts:70`, `:128` | `addToCart` | Empty productId ve price unavailable kontrolü var. | Inactive/archived/commercial eligibility doğrulaması yok. | PARTIAL |
| 24 | Cart context | `apps/bff/src/server/guards.ts:112` | `extractCommerceContext` | Auth CUSTOMER actorId veya guest sessionId cart owner context olarak kullanılıyor. | Smoke auth/runtime uyumsuzlukları var. | PASS WITH LIMITATION |
| 25 | Checkout state | `packages/contracts/src/checkout.ts:1`, `services/checkout/src/checkout.ts:88` | `CheckoutState`, `startCheckout` | `REVIEW_READY` ve `BLOCKED` state var. | `ready_for_payment` veya explicit immutable ready state yok. | PARTIAL |
| 26 | Payment guard gap | `services/payment/src/payment.ts:412` | `initiatePayment` | Checkout `REVIEW_READY/VALID` değilse sadece console warning yazıyor; payment initiation devam ediyor. | Blocked/invalid checkout payment'a ilerleyebilir. | FAIL |
| 27 | Order guard | `services/order/src/order.ts:153` | `createOrderFromPayment` | Order creation checkout ready/valid değilse `CHECKOUT_NOT_READY` dönüyor. | Payment initiation guard açığı order aşamasına kadar taşınır. | PASS WITH LIMITATION |
| 28 | Address owner | `services/customer-address/src/customer-address.ts:30` | `createCustomerAddress` | Guest address create yasak; customer ownership guard var. | Checkout address snapshot'a bağlanmıyor. | PASS WITH LIMITATION |
| 29 | Checkout eligibility | `services/customer-address/src/customer-address.ts:178` | `checkCheckoutEligibility` | Registered customer için default active shipping address aranıyor. | `startCheckout` bu eligibility fonksiyonunu çağırmıyor. | PARTIAL |
| 30 | Guest checkout | `services/checkout/src/checkout.ts:36`, `:49` | `startCheckout` | Guest checkout rate pattern risk signal üretiyor. | Guest contact/address minimum requirement yok. | PARTIAL |
| 31 | Coupon/campaign | repo | `services/coupon`, `services/campaign` | İlgili servis dizinleri yok; contract aramasında checkout discount alanı dışında implementation yok. | Discount sponsor/usage/expiry/finance impact net değil. | FAIL |
| 32 | Catalog truth flags | `services/catalog/src/catalog.ts:212`, `:281` | catalog projections | Catalog product/card priceTruth/stockTruth/mediaTruth false. | Foundation seed projection. | PASS WITH LIMITATION |
| 33 | UI commerce calls | `apps/web/src/bootstrap/cart.ts:25`, `checkout.ts:22`, `payment.ts:33`, `order.ts:38` | bootstrap flows | UI HTTP projection/command çağrısı yapıyor; service package import yok. | Demo bootstrap `Bearer guest-token` ve fallback projection kalıyor. | PASS WITH LIMITATION |
| 34 | Panel commerce direct write | `apps/panel/src/**` | source scan | Commerce owner service import/direct write kanıtı bulunmadı. | PHASE-08 panel hygiene devam ediyor. | PASS WITH LIMITATION |

## 5. Alan Bazlı Karar

### A) PX-HAVUZ-05 PARTIAL / Build Borcu

Sonuç: PASS

Kanıt:
- `packages/contracts/src/pool.ts:272` içinde `ListSupplierSubmittedProductsQuery` mevcut.
- `services/pool/src/pool.ts:399` aynı tipi kullanıyor.
- `services/pool/package.json` public `@hx/pool` export kullanıyor.
- `pnpm run typecheck` PASS.
- `pnpm run build` PASS.

Limitation:
- Pool state in-memory foundation store üzerinde; runtime persistence readiness kanıtı yok.

### B) Havuz / Product Acceptance / Commercial Pool Boundary

Sonuç: PASS WITH LIMITATION

Kanıt:
- Supplier submitted product ve commercial pool product ayrımı contract içinde ayrı modellerle var.
- Approved submitted product commercial pool'a sadece admin/operator command ile alınabiliyor.
- Creator store binding global commercial product state'i mutate etmiyor; kendi creator store product kaydını oluşturuyor.
- Commercial pool activation için binding snapshot zorunlu.

Limitation:
- Ayrı `services/product-acceptance` yok; product acceptance owner davranışı `services/pool` içinde.
- Supplier/creator scope BFF pool context'te header destekli; claim-bound supplier/creator id kanıtı yok.
- Binding gerçek pricing/stock owner verisiyle değil submitted variant inputuyla çalışıyor.

### C) Variant Readiness Review

Sonuç: PARTIAL

Kanıt:
- Catalog contract ve projection variant taşıyor.
- Cart line ve checkout line `variantId` taşıyor.

Blocker/limitation:
- Ayrı variant owner service yok.
- Cart variant-required kontrolü `productId.includes('variant_req')` heuristic.
- Invalid variant deterministic validation yok.
- PDP selection zorunluluğu genel product metadata üzerinden enforce edilmiyor.

### D) Price Readiness Review

Sonuç: PARTIAL

Kanıt:
- BFF/UI final price truth üretmiyor; cart/checkout servisleri `@hx/pricing` çağırıyor.
- Checkout line unit/line/grand total snapshot üretiyor.

Blocker/limitation:
- Pricing source `FOUNDATION_SIMULATED`.
- Cart price projection ile checkout price snapshot arasında conflict detection yok.
- Coupon/campaign discount final amount'a bağlı değil.
- Discount sponsor modeli yok.

### E) Stock Readiness Review

Sonuç: PARTIAL

Kanıt:
- Cart add/update ve checkout final validation `@hx/stock` çağırıyor.
- Checkout out-of-stock durumda line validation'ı `STOCK_MISMATCH` yapıyor.

Blocker/limitation:
- Stock source `FOUNDATION_SIMULATED`.
- Reservation lifecycle yok.
- Oversell guard gerçek inventory üzerinde kanıtlanmadı.
- Supplier stock update path'i bulunmadı.

### F) Cart Readiness Review

Sonuç: PARTIAL

Kanıt:
- Guest/customer cart context ayrımı var.
- Duplicate line merge product+variant+storefront üzerinden yapılıyor.
- Quantity validation var.
- Cart payment/order truth üretmiyor.

Blocker/limitation:
- Invalid/inactive/archived commercial product cart'a eklenemez kuralı gerçek pool/catalog eligibility ile enforce edilmiyor.
- Cart summary service içinde hesaplanıyor ama purchase truth değil.
- Concurrent duplicate/idempotency guard yok.

### G) Checkout Readiness Review

Sonuç: FAIL

Kanıt:
- Checkout review context ve `REVIEW_READY`/`BLOCKED` state var.
- Checkout price/stock tekrar validate ediyor.
- Checkout order yaratmıyor.

Blocker:
- `ready_for_payment` explicit state yok.
- Payment initiation invalid checkout state'i bloklamıyor; `services/payment/src/payment.ts:412` sadece warning loglayıp provider initiation'a devam ediyor.
- Checkout expired behavior yok.
- Address/coupon conflict behavior yok.

### H) Address / Guest Checkout Review

Sonuç: PARTIAL

Kanıt:
- Registered customer address owner service var.
- Guest address create yasak.
- Registered customer checkout eligibility için default shipping address kuralı var.

Blocker/limitation:
- Checkout address eligibility veya address snapshot kullanmıyor.
- Guest checkout için contact/address minimum requirement yok.
- Delivery suitability validation yok.

### I) Coupon / Campaign Checkout Impact Review

Sonuç: FAIL

Kanıt:
- `services/coupon` ve `services/campaign` bulunmadı.
- Contract/source aramasında checkout summary `discountTotal?` dışında coupon/campaign checkout implementation yok.

Blocker:
- Coupon application, usage limit, expiry, abuse/risk guard, sponsor modeli ve checkout snapshot etkisi yok.

### J) BFF / UI Truth Review for Commerce

Sonuç: PASS WITH LIMITATION

Kanıt:
- BFF cart/checkout/payment/order/pool handler'ları public service package'lere delegate ediyor.
- İncelenen BFF commerce handler'larında direct repository write yok.
- Catalog read projection boundary flags false.
- Panel source içinde commerce owner direct write kanıtı bulunmadı.

Limitation:
- `apps/web/src/bootstrap/*` demo akışları legacy `Bearer guest-token` ve simulated endpoint usage içeriyor.
- Runtime smoke'larda BFF auth/persistence env uyumsuzluğu var.

## 6. Komut Sonuçları

| Komut | Sonuç | Not |
|---|---|---|
| `pnpm run typecheck` | PASS | Recursive workspace typecheck geçti. |
| `pnpm run build` | PASS | Recursive workspace build geçti. |
| `pnpm run smoke:catalog-read` | PASS | BFF başlatıldıktan sonra catalog boundary flags PASS. |
| `pnpm run smoke:catalog` | PASS | PDP/PLP read boundaries PASS. |
| `pnpm run smoke:commerce` | FAIL | `GET /cart failed: 403`; BFF canlıyken commerce smoke auth/persistence/runtime uyumsuz. |
| `pnpm run smoke:commerce-permission` | FAIL | Cart/checkout steps 403; payment setup cascade failed. |
| `pnpm run smoke:core-commerce` | FAIL | Customer setup `POST /customer/profile` Postgres `ECONNREFUSED` sebebiyle başarısız. |
| `pnpm run smoke:payment-provider-boundary` | FAIL | Customer/storefront/cart setup Postgres `ECONNREFUSED` sebebiyle başarısız. |

Ek ortam notu:
- İlk smoke denemelerinde BFF kapalı olduğu için `fetch failed/ECONNREFUSED` görüldü.
- BFF `pnpm --filter @hx/bff run start` ile başlatıldı ve `/health` OK döndü.
- `.env` içinde `PERSISTENCE_MODE=postgres` ve `DATABASE_URL=localhost:5433`; bu ortamda Postgres bağlantısı `ECONNREFUSED` verdi.
- Package scriptlerinde ayrı `smoke:cart`, `smoke:checkout`, `smoke:pricing`, `smoke:stock`, `smoke:pool`, `smoke:creator-store-commercial-binding`, `smoke:customer-address-checkout-eligibility` bulunmadı.

## 7. Kalan Blocker ve Limitations

| Kod | Tip | Bulgu | Etki | Önerilen fix paketi |
|---|---|---|---|---|
| P2-B01 | Blocker | Payment initiation invalid/blocked checkout'u durdurmuyor. | Checkout ready olmadan payment başlayabilir. | Checkout/payment readiness guard fix. |
| P2-B02 | Blocker | Coupon/campaign checkout impact yok. | Discount total, sponsor, usage ve expiry davranışı belirsiz. | Coupon/campaign checkout impact foundation. |
| P2-B03 | Blocker | Checkout address eligibility/snapshot kullanmıyor. | Address prerequisite ve guest contact requirement kanıtlanamıyor. | Checkout address snapshot/eligibility fix. |
| P2-L01 | Limitation | Variant validation heuristic. | Invalid variant veya required variant genel kuralı deterministik değil. | Variant owner/contract validation fix. |
| P2-L02 | Limitation | Pricing/stock simulated owner. | Real conflict/oversell/reservation readiness kanıtı yok. | Pricing/stock owner persistence + conflict fix. |
| P2-L03 | Limitation | Pool foundation in-memory. | Commercial pool runtime durability kanıtı yok. | Pool persistence/runtime smoke fix. |
| P2-L04 | Limitation | Commerce smoke'lar Postgres/auth runtime önkoşulunda FAIL. | Source PASS alanları runtime ile doğrulanamıyor. | Smoke env alignment/Postgres setup fix. |

## 8. PHASE-02 Nihai Karar Önerisi

PARTIAL / NOT READY FOR CLOSURE

Gerekçe:
- PX-HAVUZ-05 build/type blocker kapanmış görünüyor.
- Havuz, commercial pool ve creator binding boundary source seviyesinde ana hatlarıyla kurulmuş.
- Ancak checkout/payment readiness, address snapshot, coupon/campaign impact, variant validation, real pricing/stock conflict ve runtime commerce smoke kanıtı kapanmadı.
- Özellikle payment initiation'ın invalid checkout state'i bloklamaması PHASE-02 commerce core readiness için kritik blocker'dır.

## 9. Sonraki Adım Önerisi

Yeni feature genişletmeden ayrı fix paketi açılmalı:

1. `PHASE-02-FIX-01-CHECKOUT-PAYMENT-READINESS-GUARD`
2. `PHASE-02-FIX-02-ADDRESS-SNAPSHOT-AND-GUEST-CHECKOUT-ELIGIBILITY`
3. `PHASE-02-FIX-03-VARIANT-PRICE-STOCK-CONFLICT-CONTRACTS`
4. `PHASE-02-FIX-04-COUPON-CAMPAIGN-CHECKOUT-IMPACT-FOUNDATION`
5. `PHASE-02-FIX-05-COMMERCE-SMOKE-RUNTIME-ALIGNMENT`

