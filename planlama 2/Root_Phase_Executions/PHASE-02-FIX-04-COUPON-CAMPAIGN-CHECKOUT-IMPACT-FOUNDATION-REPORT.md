# PHASE-02-FIX-04 — Coupon / Campaign Checkout Impact Foundation Report

## 1. Amaç

Bu fix paketinin amacı, PHASE-02 source review sonucunda açık kalan P2-B02 coupon/campaign checkout impact eksikliğini minimum güvenli foundation seviyesinde kapatmaktır.

Bu kapsamda büyük kampanya motoru, puan sistemi, payout, settlement, finance execution, provider veya order mutation açılmadı.

## 2. Başlangıç Durumu

PHASE-02 kaynak inceleme sonucu:
- `services/coupon` ve `services/campaign` yoktu.
- Checkout contract içinde yalnızca opsiyonel `discountTotal` alanı vardı.
- Checkout sırasında coupon/campaign input, validation, expiry, usage limit, sponsor bilgisi ve snapshot etkisi yoktu.
- Invalid coupon/campaign için checkout payment-ready durumunu engelleyen deterministik davranış yoktu.

## 3. İnceleme Sonuçları

İncelenen alanlar:
- `services/checkout/src/checkout.ts`
- `services/pricing/src/pricing.ts`
- `packages/contracts/src/checkout.ts`
- `packages/contracts/src/pricing.ts`
- `packages/contracts/src/*coupon*`
- `packages/contracts/src/*campaign*`
- `apps/bff/src/server/checkout.ts`
- `apps/web/**`
- `apps/panel/**`
- root `package.json` smoke scripts

Tespit:
- Coupon/campaign contract yoktu.
- Coupon/campaign service yoktu.
- Checkout command coupon/campaign input taşımıyordu.
- Checkout response coupon/campaign effect taşımıyordu.
- Summary discount hesaplaması yoktu.
- Invalid, expired, usage-limit veya not-eligible coupon davranışı yoktu.
- Sponsor bilgisi yoktu.
- BFF/UI discount truth hesaplamıyordu.

## 4. Değiştirilen Dosyalar

| Dosya | Değişiklik | Gerekçe |
|---|---|---|
| `packages/contracts/src/coupon.ts` | Minimum coupon/campaign checkout impact contract eklendi. | Sponsor, validation status, input ve checkout discount snapshot modeli gerekiyordu. |
| `packages/contracts/src/index.ts` | Coupon contract export edildi. | Workspace paketlerinin yeni contract tiplerini kullanması gerekiyordu. |
| `packages/contracts/src/checkout.ts` | `StartCheckoutCommand` coupon/campaign input taşıyacak, `CheckoutReviewResponse` discount snapshot dönecek şekilde genişletildi. | Coupon/campaign etkisi checkout snapshot içinde görünür olmalıydı. |
| `services/checkout/src/checkout.ts` | Foundation discount rule set, validation ve summary uygulaması eklendi. | Invalid/expired/not-eligible/usage-limited discount checkout'u payment-ready yapmamalı; valid discount deterministic summary etkisi üretmeli. |
| `apps/bff/src/server/checkout.ts` | BFF coupon/campaign girdilerini secure `cartContext` ile checkout service'e forward edecek şekilde güncellendi. | BFF truth owner olmadan input taşımalıydı. |
| `tests/smoke/suites/checkout-coupon-campaign-impact-foundation.ts` | Targeted service-level smoke eklendi. | Coupon/campaign impact contract otomatik doğrulanmalıydı. |
| `tests/smoke/run-smoke.ts` | Yeni smoke suite registry'ye eklendi. | Runner'ın targeted suite'i çalıştırabilmesi gerekiyordu. |
| `package.json` | `smoke:checkout-coupon-campaign-impact-foundation` script'i eklendi. | Tek komutla targeted smoke çalıştırmak gerekiyordu. |

Not:
- `pnpm --filter @hx/contracts run build` çalıştırıldı. Bazı downstream paketler project reference nedeniyle `packages/contracts/dist` deklarasyonlarını kullandığından yeni contract exportlarının typecheck tarafından görülmesi için dist declaration çıktısı güncellendi.

## 5. Eklenen Minimum Contract

Eklenen temel modeller:
- `DiscountSponsorType`: `PLATFORM`, `SUPPLIER`, `CREATOR`, `BRAND`, `MIXED`
- `CheckoutDiscountSourceType`: `COUPON`, `CAMPAIGN`
- `CouponValidationStatus`: `VALID`, `INVALID`, `EXPIRED`, `NOT_ELIGIBLE`, `USAGE_LIMIT_EXCEEDED`
- `CheckoutDiscountInput`
- `CouponApplicationInput`
- `CouponValidationResult`
- `CheckoutDiscountSnapshot`

Checkout response artık discount snapshot taşıyabilir:
- source type
- code/id
- discount amount
- sponsor type
- sponsor id
- validation status
- reason code

## 6. Checkout Davranışı

Foundation seviyesinde eklenen deterministic rule set:
- `HX10`: valid platform coupon
- `HX_SUPPLIER_25`: valid supplier coupon
- `HX_EXPIRED`: expired coupon
- `HX_LIMITED`: usage limit exceeded coupon
- `HX_CUSTOMER_10`: customer-only coupon
- `CAMP_BRAND_20`: valid brand campaign
- `CAMP_EXPIRED`: expired campaign

Davranış:
- Valid coupon/campaign checkout'u `REVIEW_READY` / `VALID` bırakır.
- Valid discount `summary.discountTotal` alanına yansır.
- `summary.grandTotal = subTotal - discountTotal` olarak deterministic hesaplanır.
- Discount amount `subTotal` ile clamp edilir.
- Valid snapshot sponsor bilgisini açık taşır.
- Invalid, expired, not eligible veya usage-limit-exceeded discount checkout'u `BLOCKED` / `BLOCKED` yapar.
- Invalid discount payment initiation'a ulaşsa bile mevcut payment readiness guard `CHECKOUT_NOT_READY` ile provider envelope üretmeden durdurur.

## 7. Boundary Kontrolü

Korunan sınırlar:
- BFF discount truth üretmiyor; sadece input forward ediyor.
- UI discount truth üretmiyor.
- Checkout coupon/campaign application settlement/finance mutation yapmıyor.
- Payment provider, order, payout ve reconciliation alanlarına dokunulmadı.
- Coupon/campaign foundation ayrı finance execution, payout veya settlement akışı açmadı.

Boundary taramaları:

```text
rg '../../../../services|services/.*/src|@hx/.*/src' apps/bff apps/web apps/panel -g '*.ts' -g '*.tsx'
- Yeni BFF internal service src import bulunmadı.
- Mevcut eşleşme sadece p49 response smoke yorum satırı.

rg 'get.*Repository|@hx/persistence|\binsert\b|\bupdate\b|\bdelete\b' apps/bff/src/server -g '*.ts'
- Yeni checkout/coupon repository mutation bulunmadı.
- Eşleşmeler mevcut route adı ve provider callback hash update çağrısıdır.

rg 'settlement|payout|reconciliation|finance' services/checkout packages/contracts/src/checkout.ts packages/contracts/src/coupon.ts tests/smoke/suites/checkout-coupon-campaign-impact-foundation.ts -g '*.ts'
- Eşleşme yok.
```

## 8. Targeted Smoke Doğrulaması

Eklenen smoke:

```text
pnpm run smoke:checkout-coupon-campaign-impact-foundation
```

Doğrulanan senaryolar:
- Valid platform coupon -> checkout `REVIEW_READY` / `VALID`
- Valid coupon -> `discountTotal` ve `grandTotal` deterministic
- Valid coupon snapshot -> sponsor `PLATFORM`, sponsor id mevcut
- Valid brand campaign -> source `CAMPAIGN`, sponsor `BRAND`, sponsor id mevcut
- Expired coupon -> checkout `BLOCKED`, validation `EXPIRED`
- Usage limit exceeded coupon -> checkout `BLOCKED`, validation `USAGE_LIMIT_EXCEEDED`
- Not eligible coupon -> checkout `BLOCKED`, validation `NOT_ELIGIBLE`
- Unknown coupon -> checkout `BLOCKED`, validation `INVALID`
- Invalid coupon sonrası payment initiation -> `FAILED`, `CHECKOUT_NOT_READY`, provider envelope yok

## 9. Final Komut Sonuçları

| Komut | Sonuç |
|---|---|
| `pnpm --filter @hx/contracts run build` | PASS |
| `pnpm run typecheck` | PASS |
| `pnpm run build` | PASS |
| `pnpm run smoke:checkout-coupon-campaign-impact-foundation` | PASS |
| `pnpm run smoke:checkout-variant-price-stock-validation` | PASS |

## 10. Sonuç

**PASS**

P2-B02 coupon/campaign checkout impact blocker minimum foundation seviyesinde kapatıldı.

Checkout artık coupon/campaign input kabul ettiğinde:
- validation status üretir,
- expired/invalid/not-eligible/usage-limited discount'u payment-ready yapmaz,
- valid discount'u checkout summary'ye deterministic yansıtır,
- sponsor bilgisini snapshot içinde açık taşır,
- discount effect'i checkout response snapshot'ında görünür kılar,
- BFF/UI/finance/settlement/provider/order sınırlarını ihlal etmez.
