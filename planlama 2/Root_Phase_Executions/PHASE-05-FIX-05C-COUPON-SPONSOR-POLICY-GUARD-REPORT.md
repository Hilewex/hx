# PHASE-05-FIX-05C - Coupon Sponsor Policy Guard Report

Date: 2026-05-09

## 1. Amac

Bu fix paketinin amaci, ilk faz kupon/kampanya sponsor kararlarina aykiri sponsor tiplerini engellemek ve creator/fenomen kuponu icin minimum marj guvenligini kurmaktir.

Bu paket coupon line allocation, settlement sponsor financial impact, refund coupon sponsor reversal, payout veya ledger davranisi uretmez.

## 2. Baslangic Durumu

PHASE-05-FIX-05:
- PARTIAL

PHASE-05-FIX-05A:
- PASS WITH LIMITATION

PHASE-05-FIX-05B:
- PASS WITH LIMITATION

Kapanacak gap'ler:
- GAP-05-05
- GAP-05-06
- GAP-05-07
- GAP-05-08
- GAP-05-13

Baslangic inceleme sonucu:

| Soru | Durum | Kanit |
| --- | --- | --- |
| Aktif supplier sponsorlu kupon var mi? | Evet | `HX_SUPPLIER_25` valid fixture olarak duruyordu. |
| Aktif brand sponsorlu campaign var mi? | Evet | `CAMP_BRAND_20` valid campaign smoke tarafinda kabul ediliyordu. |
| Creator sponsorlu kupon var mi? | Hayir | Fixture/policy yoktu. |
| Creator coupon minimum margin guard var mi? | Hayir | Checkout discount validation sadece expiry, eligibility ve usage limit kontrol ediyordu. |
| Platform destekli creator coupon admin support ratio var mi? | Hayir | Model ve guard yoktu. |
| Kampanyali urunde creator coupon default-off var mi? | Hayir | Model ve guard yoktu. |
| Checkout snapshot sponsor bilgisini tasiyor mu? | Evet | `CheckoutDiscountSnapshot` sponsorType/sponsorId tasiyordu. |
| Sponsor financial impact settlement'a gidiyor mu? | Hayir | Settlement sadece limitation flag tasiyor; impact deferred. |
| BFF sponsor truth hesapliyor mu? | Hayir | `apps/bff/src/server/checkout.ts` input forward ediyor. |

## 3. Esas Alinan Kararlar

- Platform kuponunu platform tasir.
- Fenomen kuponunu fenomen tasir; minimum fenomen marji korunur.
- Platform destekli fenomen kuponu admin orani olmadan calismaz.
- Tedarikci sponsorlu indirim ilk fazda kapatildi.
- Marka sponsorlu indirim ilk fazda kapatildi.
- Kampanyali urunde fenomen kuponu varsayilan kapatildi.
- Bu paket settlement/refund sponsor finansal etkisi yapmaz.

## 4. Degistirilen Dosyalar

| Dosya | Degisiklik | Gerekce | Etki |
| --- | --- | --- | --- |
| `packages/contracts/src/coupon.ts` | `BLOCKED` validation status, `InitialPhaseSponsorPolicy`, `CreatorCouponPolicy` ve creator campaign override input alanlari eklendi. | Checkout service minimum sponsor policy guard verisini contract seviyesinde temsil edebilsin. | BFF/UI truth uretmeden service'e policy input forward edebilir. |
| `services/checkout/src/checkout.ts` | Ilk faz sponsor policy sabiti, supplier/brand block guard, creator coupon min margin guard, platform-supported admin ratio guard ve campaign product default-off guard eklendi. | GAP-05-05/06/07/08/13 icin minimum guvenli enforcement. | Blocked discount checkout'u `BLOCKED` yapar, discountTotal/payment readiness'a gecmez; accepted snapshot sponsor bilgisini tasir. |
| `tests/smoke/suites/coupon-sponsor-policy-guard.ts` | Targeted smoke suite eklendi. | Yeni sponsor policy guard davranisini kanitlamak. | `coupon-sponsor-policy-guard` suite'i calisir. |
| `tests/smoke/suites/checkout-coupon-campaign-impact-foundation.ts` | Brand campaign beklentisi valid yerine first-phase blocked olarak guncellendi. | Ilk faz brand sponsor karariyla mevcut foundation smoke uyumlu olsun. | Existing checkout coupon/campaign smoke yeni policy beklentisiyle PASS. |
| `tests/smoke/run-smoke.ts` | Yeni suite key'i eklendi. | Root smoke runner targeted suite'i taniyabilsin. | `tsx tests/smoke/run-smoke.ts coupon-sponsor-policy-guard` calisir. |
| `package.json` | `smoke:coupon-sponsor-policy-guard` script'i eklendi. | Prompttaki script gereksinimi. | Root script ile targeted smoke calisir. |
| `PHASE-05-FIX-05C-COUPON-SPONSOR-POLICY-GUARD-REPORT.md` | Bu rapor olusturuldu. | Degisiklik, karar ve kanit kaydi. | Closure kaydi var. |

## 5. Sponsor Policy Davranisi

Supplier sponsorlu coupon aktif calisiyor mu?
- Hayir. `HX_SUPPLIER_25` artik `FIRST_PHASE_SUPPLIER_SPONSOR_DISABLED` ile `BLOCKED`.

Brand sponsorlu campaign aktif calisiyor mu?
- Hayir. `CAMP_BRAND_20` artik `FIRST_PHASE_BRAND_SPONSOR_DISABLED` ile `BLOCKED`.

Platform coupon calisiyor mu?
- Evet. `HX10` `REVIEW_READY`, `discountTotal = 10`, sponsor snapshot `PLATFORM`.

Creator coupon minimum margin guard var mi?
- Evet. `creatorMargin - couponDiscountAmount >= minCreatorMarginAmount` kontrolu olmadan creator coupon uygulanmaz.

Platform-supported creator coupon admin ratio olmadan calisiyor mu?
- Hayir. `platformSupportRatio` yoksa veya `adminSupportRatioApproved !== true` ise `PLATFORM_SUPPORTED_CREATOR_COUPON_ADMIN_RATIO_REQUIRED`.

Campaign product + creator coupon default blocked mi?
- Evet. `isCampaignProduct` ve override yoksa `CREATOR_COUPON_DISABLED_ON_CAMPAIGN_PRODUCT`.

## 6. Boundary

BFF sponsor truth uretiyor mu?
- Hayir. BFF checkout route sadece `couponCode`, `campaignId`, `discountInputs` forward ediyor.

UI/panel sponsor cost truth uretiyor mu?
- Hayir. Boundary scan eslesme bulmadi.

Settlement/refund/payout/ledger bu pakette mutate edildi mi?
- Hayir. Checkout guard disinda settlement/refund/payout/ledger davranisi degistirilmedi.

## 7. Limitation

Coupon line allocation:
- Deferred.

Settlement sponsor financial impact:
- Deferred. Settlement mevcut `COUPON_SPONSOR_IMPACT_NOT_CALCULATED` limitation flag'ini korur.

Refund coupon sponsor reversal:
- Deferred.

Admin policy persistence:
- Foundation only. Policy service icinde sabit ilk faz guard olarak temsil edildi; admin persistence ve route yok.

## 8. Boundary Regression Scan

| Tarama | Sonuc | Not |
| --- | --- | --- |
| Active supplier/brand fixtures | PASS | Scan supplier/brand enum, blocked fixtures ve blocked test assertion'larini buldu; aktif kabul path'i yok. Guard reason'lari `FIRST_PHASE_SUPPLIER_SPONSOR_DISABLED` ve `FIRST_PHASE_BRAND_SPONSOR_DISABLED`. |
| Creator coupon margin guard | PASS | Scan `minCreatorMarginAmount`, `selectedSalePrice`, `poolBasePriceAmount`, `creatorMarginAmount`, `platformSupportRatio`, `adminSupportRatioApproved` guard ve smoke kanitlarini buldu. |
| BFF/UI sponsor truth | PASS | `rg "sponsorType|supplierSponsor|brandSponsor|creatorMargin|platformSupportRatio|discountTotal" apps/bff/src/server apps/web apps/panel -g "*.ts" -g "*.tsx"` eslesme bulmadi. |
| Settlement/refund accidental mutation | PASS | Scan settlement limitation flag ve mevcut finance ledger fonksiyonlarini buldu; checkout policy guard settlement/refund/payout/ledger mutate etmiyor. |

## 9. Smoke/Test Kaniti

| Senaryo | Sonuc | Kanit |
| --- | --- | --- |
| Platform coupon valid | PASS | `HX10` -> `REVIEW_READY`, `discountTotal = 10`, sponsor `PLATFORM`. |
| Supplier sponsor coupon blocked | PASS | `HX_SUPPLIER_25` -> `BLOCKED`, `FIRST_PHASE_SUPPLIER_SPONSOR_DISABLED`. |
| Brand sponsor campaign blocked | PASS | `CAMP_BRAND_20` -> `BLOCKED`, `FIRST_PHASE_BRAND_SPONSOR_DISABLED`. |
| Creator coupon sufficient margin accepted | PASS | `selectedSalePrice = 150`, `poolBasePriceAmount = 90`, discount `30`, min margin `20` -> accepted. |
| Creator coupon below min margin blocked | PASS | min margin `40` -> `CREATOR_COUPON_MINIMUM_MARGIN_VIOLATION`. |
| Creator coupon missing margin inputs blocked | PASS | `HX_CREATOR_30` without policy -> `CREATOR_COUPON_MARGIN_INPUTS_REQUIRED`. |
| Platform-supported creator coupon without admin ratio blocked | PASS | `HX_CREATOR_PLATFORM_30` without admin ratio -> `PLATFORM_SUPPORTED_CREATOR_COUPON_ADMIN_RATIO_REQUIRED`. |
| Campaign product + creator coupon default blocked | PASS | `isCampaignProduct = true`, no override -> `CREATOR_COUPON_DISABLED_ON_CAMPAIGN_PRODUCT`. |
| Accepted sponsor snapshot present | PASS | Accepted creator/platform snapshots preserve sponsorType/sponsorId. |
| Blocked discount does not reach payment readiness | PASS | Blocked supplier checkout payment -> `FAILED`, `CHECKOUT_NOT_READY`, empty payment id. |

## 10. Komut Sonuclari

| Komut | Sonuc | Not |
| --- | --- | --- |
| `pnpm run typecheck` | FAIL-REPO | `apps/web` `TS6059/TS6307` rootDir/include disi workspace source imports nedeniyle fail ediyor. |
| `pnpm run build` | FAIL-REPO | `apps/web` ayni `TS6059/TS6307` repo config hatasiyla fail ediyor. |
| `pnpm run smoke:coupon-sponsor-policy-guard` | PASS | Targeted sponsor policy smoke passed. |
| `pnpm run smoke:checkout-coupon-campaign-impact-foundation` | PASS | Existing checkout coupon/campaign smoke yeni first-phase policy beklentileriyle passed. |
| `pnpm run smoke:creator-margin-settlement-foundation` | PASS | Creator margin settlement regression passed. |
| `pnpm run smoke:pool-price-corridor-foundation` | PASS | Pool price corridor regression passed. |
| `pnpm run smoke:settlement-calculation-foundation` | PASS | Settlement calculation regression passed. |
| `pnpm run smoke:refund-financial-impact-foundation` | PASS | Refund financial impact regression passed. |
| `pnpm run smoke:payable-payout-boundary-foundation` | PASS | Payable/payout boundary regression passed. |
| `pnpm run smoke:finance-ledger-foundation` | PASS | Finance ledger regression passed. |
| `pnpm --filter @hx/contracts typecheck` | PASS | Contract types clean. |
| `pnpm --filter @hx/contracts build` | PASS | Contract build clean. |
| `pnpm --filter @hx/checkout typecheck` | FAIL-REPO | Checkout tsconfig rootDir/include disi workspace imports nedeniyle fail ediyor. Targeted smoke PASS. |
| `pnpm --filter @hx/checkout build` | FAIL-REPO | Checkout tsconfig rootDir/include disi workspace imports nedeniyle fail ediyor. Targeted smoke PASS. |

## 11. Kalan Acik Noktalar

| Kod | Acik Nokta | Etki | Hedef Faz / Fix |
| --- | --- | --- | --- |
| OPEN-05C-01 | Coupon line allocation yok. | Sponsor cost line-level dagitilmiyor. | PHASE-05-FIX-05D. |
| OPEN-05C-02 | Settlement sponsor financial impact yok. | Kupon sponsor maliyeti settlement'a tam yansimiyor; limitation flag ile deferred. | PHASE-05-FIX-05D. |
| OPEN-05C-03 | Refund coupon sponsor reversal yok. | Refund tarafinda coupon sponsor reversal hesaplanmiyor. | Refund/coupon reversal package. |
| OPEN-05C-04 | Admin policy persistence ve route yok. | Platform-supported creator coupon admin ratio kalici policy modelinden gelmiyor; input-level guard ile foundation temsil edildi. | Admin policy persistence package. |
| OPEN-05C-05 | Root build/typecheck repo-level config hatasi suruyor. | Root build/typecheck FAIL-REPO; contracts package clean, checkout behavior targeted smoke ile kanitlandi. | Tooling/build recovery package. |

## 12. PHASE-05'e Etki

GAP-05-05:
- CLOSED WITH LIMITATION. Supplier sponsorlu kupon checkout'ta blocked; allocation/settlement impact sonraki pakete kaldi.

GAP-05-06:
- CLOSED WITH LIMITATION. Brand sponsorlu campaign checkout'ta blocked; brand share/settlement impact sonraki pakete kaldi.

GAP-05-07:
- CLOSED WITH LIMITATION. Creator coupon minimum margin guard ve platform-supported admin ratio guard var; admin persistence deferred.

GAP-05-08:
- CLOSED WITH LIMITATION. Kampanyali urunde creator coupon default blocked; kalici admin override/policy route deferred.

GAP-05-13:
- CLOSED WITH LIMITATION. Minimum service policy modeli var; BFF raw input forward ediyor, admin policy persistence deferred.

## 13. Nihai Karar

PHASE-05-FIX-05C Karari:
- PASS WITH LIMITATION

Karar gerekcesi:
- Supplier sponsor blocked.
- Brand sponsor blocked.
- Creator coupon minimum margin guard var.
- Platform-supported creator coupon admin ratio olmadan blocked.
- Campaign product + creator coupon default blocked.
- Targeted smoke PASS.
- Settlement/refund/payout/ledger mutation yok.
- Coupon line allocation, settlement/refund sponsor impact ve admin persistence sonraki paketlere devredildi.
- Root build/typecheck repo config issue FAIL-REPO olarak acik yazildi.

## 14. Sonraki Adim

PHASE-05-FIX-05D - Coupon Line Allocation & Settlement Impact paketine gecilebilir.
