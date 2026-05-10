# PHASE-05-FIX-05D - Coupon Line Allocation & Settlement Impact Report

Date: 2026-05-09

## 1. Amac

Bu fix paketinin amaci, kupon/kampanya discount etkisini checkout toplam seviyesinden satir bazli allocation seviyesine indirmek ve settlement tarafinda sponsor maliyetini gorunur hale getirmektir.

## 2. Baslangic Durumu

PHASE-05-FIX-05:
- PARTIAL

PHASE-05-FIX-05C:
- PASS WITH LIMITATION

Kapanacak gap:
- GAP-05-09
- OPEN-05C-01
- OPEN-05C-02

Baslangic inceleme sonucu:

| Soru | Durum | Kanit |
| --- | --- | --- |
| Checkout discount line allocation var mi? | Hayir | `CheckoutDiscountSnapshot` sadece toplam `discountAmount` tasiyordu. |
| Discount snapshot sponsor bilgisini tasiyor mu? | Evet | `sponsorType` ve `sponsorId` snapshot icinde vardi. |
| Allocation lineId/orderLineId tasiyor mu? | Hayir | Allocation modeli yoktu. |
| Allocation toplami discountTotal ile eslesiyor mu? | Hayir | Allocation yoktu. |
| Settlement sponsor financial impact hesapliyor mu? | Hayir | Sponsor input varsa `COUPON_SPONSOR_IMPACT_NOT_CALCULATED` flag basiliyordu. |
| Settlement sponsor impact payout/payable/ledger uretiyor mu? | Hayir | Calculation summary zaten false mutation flag'leri tasiyordu. |
| Refund reversal bu pakette var mi? | Hayir | Refund coupon reversal implementasyonu bulunmadi. |
| BFF/UI allocation truth uretiyor mu? | Hayir | Boundary scan allocation/sponsor cost truth eslesmesi bulmadi. |

## 3. Esas Alinan Kararlar

- Platform kuponunu platform tasir.
- Fenomen kuponunu fenomen tasir; minimum fenomen marji korunur.
- Tedarikci sponsorlu indirim ilk fazda kapali kalir.
- Marka sponsorlu indirim ilk fazda kapali kalir.
- Sponsor bilgisi satir bazli korunur.
- Checkout allocation `cartLineId`/`lineId` tasir; orderLineId henuz checkout aninda yoksa bos kalir.
- Settlement impact line'lari evidence/summary seviyesindedir; payout/payable/ledger degildir.
- Refund reversal bu pakette yapilmaz.

## 4. Degistirilen Dosyalar

| Dosya | Degisiklik | Gerekce | Etki |
| --- | --- | --- | --- |
| `packages/contracts/src/coupon.ts` | `CheckoutDiscountLineAllocation`, allocation method ve snapshot allocation alanlari eklendi. | Checkout snapshot satir bazli sponsor allocation tasiyabilsin. | Refund reversal icin line referansi ve sponsor snapshot temeli olustu. |
| `services/checkout/src/checkout.ts` | Valid discount snapshot'lari icin deterministic proportional/single-line allocation uretildi. | `discountTotal` sadece toplam seviyesinde kalmasin. | Valid platform/creator coupon allocation uretir; blocked discount allocation uretmez. |
| `packages/contracts/src/settlement.ts` | Discount allocation input'u, sponsor impact/cost line type'lari ve summary cost alanlari eklendi. | Settlement calculation sponsor maliyetini read-only evidence olarak temsil edebilsin. | Platform/creator cost summary gorunur; supplier/brand maliyet alanlari 0 kalir. |
| `services/settlement/src/settlement.ts` | Allocation input'undan `COUPON_SPONSOR_IMPACT`, `PLATFORM_DISCOUNT_COST`, `CREATOR_DISCOUNT_COST` line'lari ve summary tutarlari uretilir. Supplier/brand allocation reject edilir. | GAP-05-09 settlement impact foundation kapansin. | Allocation varsa `COUPON_SPONSOR_IMPACT_NOT_CALCULATED` kalkar; payout/payable/ledger mutate edilmez. |
| `tests/smoke/suites/coupon-line-allocation-settlement-impact.ts` | Targeted smoke suite eklendi. | Yeni allocation ve settlement impact davranisini kanitlamak. | `coupon-line-allocation-settlement-impact` PASS. |
| `tests/smoke/suites/checkout-coupon-campaign-impact-foundation.ts` | Snapshot assertion'i yeni allocation alanlariyla uyumlu olacak sekilde parcali assertion'a alindi. | Mevcut smoke yeni snapshot shape nedeniyle gereksiz kirilmasin. | Existing checkout coupon/campaign smoke PASS. |
| `tests/smoke/run-smoke.ts` | Yeni suite key'i eklendi. | Root smoke runner targeted suite'i taniyabilsin. | `tsx tests/smoke/run-smoke.ts coupon-line-allocation-settlement-impact` calisir. |
| `package.json` | `smoke:coupon-line-allocation-settlement-impact` script'i eklendi. | Prompttaki script gereksinimi. | Root script ile targeted smoke calisir. |
| `PHASE-05-FIX-05D-COUPON-LINE-ALLOCATION-SETTLEMENT-IMPACT-REPORT.md` | Bu rapor olusturuldu. | Degisiklik, karar ve kanit kaydi. | Closure kaydi var. |

## 5. Checkout Line Allocation Davranisi

Checkout discount line allocation uretiyor mu?
- Evet. Valid platform/creator discount snapshot'lari `lineAllocations` tasir.

Allocation toplami discountTotal ile eslesiyor mu?
- Evet. Smoke coklu satir platform coupon icin allocation toplam = `discountTotal`; creator coupon icin de toplam = `discountTotal`.

Allocation sponsorType/sponsorId tasiyor mu?
- Evet. Her allocation snapshot sponsorType/sponsorId bilgisini kopyalar.

Blocked discount allocation uretiyor mu?
- Hayir. Supplier coupon ve brand campaign blocked durumda allocation listesi bos.

Supplier/brand sponsor blocked kaliyor mu?
- Evet. `FIRST_PHASE_SUPPLIER_SPONSOR_DISABLED` ve `FIRST_PHASE_BRAND_SPONSOR_DISABLED` guard'lari korunuyor.

## 6. Settlement Sponsor Impact Davranisi

Platform coupon settlement sponsor impact uretiyor mu?
- Evet. Platform allocation `COUPON_SPONSOR_IMPACT` ve `PLATFORM_DISCOUNT_COST` line uretir; summary `platformDiscountCostAmount` dolar.

Creator coupon settlement sponsor impact uretiyor mu?
- Evet. Creator allocation `COUPON_SPONSOR_IMPACT` ve `CREATOR_DISCOUNT_COST` line uretir; summary `creatorDiscountCostAmount` dolar.

Supplier/brand sponsor impact uretiyor mu?
- Hayir. Supplier/brand allocation gelirse `FIRST_PHASE_DISCOUNT_SPONSOR_IMPACT_UNSUPPORTED` ile settlement calculation blocked olur.

`COUPON_SPONSOR_IMPACT_NOT_CALCULATED` allocation varken kalkiyor mu?
- Evet. `couponSponsorType` ile birlikte `discountLineAllocations` geldiyse limitation flag uretilmez.

Settlement payout/payable/ledger uretiyor mu?
- Hayir. Summary `ledgerEntryCreated`, `payoutCreated`, `payableCreated`, `paidOutCreated` false kalir.

## 7. Refund Boundary

Refund coupon sponsor reversal bu pakette yapildi mi?
- Hayir.

Refund reversal sonraki pakete mi kaldi?
- Evet. PHASE-05-FIX-05E kapsaminda kaldi.

## 8. BFF / UI / Panel Boundary

BFF allocation truth uretiyor mu?
- Hayir. Boundary scan allocation/sponsor cost truth eslesmesi bulmadi.

UI/panel allocation veya sponsor cost truth uretiyor mu?
- Hayir. Boundary scan allocation/sponsor cost truth eslesmesi bulmadi.

## 9. Boundary Regression Scan

| Tarama | Sonuc | Not |
| --- | --- | --- |
| BFF/UI allocation truth | PASS | `rg "lineAllocation|allocatedAmount|discountSponsorImpact|platformDiscountCost|creatorDiscountCost|supplierDiscountCost|brandDiscountCost" apps/bff/src/server apps/web apps/panel -g "*.ts" -g "*.tsx"` eslesme bulmadi. |
| Supplier/brand sponsor reactivation | PASS | Supplier/brand fixture ve smoke assertion'lari var; active path guard reason'lari `FIRST_PHASE_SUPPLIER_SPONSOR_DISABLED` ve `FIRST_PHASE_BRAND_SPONSOR_DISABLED`. |
| Settlement creates payout/payable/ledger | PASS | Settlement service scan sadece false summary flag ve eski smoke-test guard referansini buldu; create/mutate path yok. |
| Refund reversal accidental implementation | PASS | `refundCoupon|couponReversal|refundReversal|reverseCoupon|COUPON_REVERSAL` scan eslesme bulmadi. |

## 10. Smoke/Test Kaniti

| Senaryo | Sonuc | Kanit |
| --- | --- | --- |
| Platform coupon allocation | PASS | `HX10` coklu satir checkout -> 2 allocation. |
| Allocation total matches discountTotal | PASS | Platform allocation toplam `10`; creator allocation toplam `30`. |
| Platform sponsor retained | PASS | Platform allocation sponsorType `PLATFORM`, sponsorId `platform:hx`. |
| Creator coupon allocation | PASS | `HX_CREATOR_30` sufficient margin -> allocation olustu. |
| Creator sponsor retained | PASS | Creator allocation sponsorType `CREATOR`, sponsorId `creator:foundation`. |
| Supplier/brand blocked no allocation | PASS | `HX_SUPPLIER_25` ve `CAMP_BRAND_20` blocked; allocation yok. |
| Settlement platform sponsor impact | PASS | `COUPON_SPONSOR_IMPACT` + `PLATFORM_DISCOUNT_COST`, summary platform cost `10`. |
| Settlement creator sponsor impact | PASS | `COUPON_SPONSOR_IMPACT` + `CREATOR_DISCOUNT_COST`, summary creator cost `30`. |
| No payout/payable/ledger creation | PASS | Settlement summary mutation flags false. |
| No refund reversal | PASS | Refund state mutated false; reversal scan eslesme bulmadi. |

## 11. Komut Sonuclari

| Komut | Sonuc | Not |
| --- | --- | --- |
| `pnpm run typecheck` | FAIL-REPO | `apps/web` TS6059/TS6307 rootDir/include disi workspace source imports nedeniyle fail ediyor. |
| `pnpm run build` | FAIL-REPO | `apps/web` ayni TS6059/TS6307 repo config hatasiyla fail ediyor. |
| `pnpm run smoke:coupon-line-allocation-settlement-impact` | PASS | Targeted allocation + settlement impact smoke passed. |
| `pnpm run smoke:coupon-sponsor-policy-guard` | PASS | 05C sponsor policy guard regression passed. |
| `pnpm run smoke:checkout-coupon-campaign-impact-foundation` | PASS | Existing checkout coupon/campaign smoke passed. |
| `pnpm run smoke:creator-margin-settlement-foundation` | PASS | Creator margin settlement regression passed. |
| `pnpm run smoke:settlement-calculation-foundation` | PASS | Settlement calculation regression passed. |
| `pnpm run smoke:pool-price-corridor-foundation` | PASS | Pool price corridor regression passed. |
| `pnpm run smoke:refund-financial-impact-foundation` | PASS | Refund financial impact regression passed. |
| `pnpm run smoke:payable-payout-boundary-foundation` | PASS | Payable/payout boundary regression passed. |
| `pnpm run smoke:finance-ledger-foundation` | PASS | Finance ledger regression passed. |
| `pnpm --filter @hx/contracts typecheck` | PASS | Contract types clean. |
| `pnpm --filter @hx/contracts build` | PASS | Contract build clean. |
| `pnpm --filter @hx/settlement typecheck` | PASS | Settlement package typecheck clean. |
| `pnpm --filter @hx/settlement build` | PASS | Settlement package build clean. |
| `pnpm --filter @hx/checkout typecheck` | FAIL-REPO | Checkout tsconfig rootDir/include disi workspace imports nedeniyle fail ediyor; targeted smoke PASS. |
| `pnpm --filter @hx/checkout build` | FAIL-REPO | Checkout tsconfig rootDir/include disi workspace imports nedeniyle fail ediyor; targeted smoke PASS. |

## 12. Kalan Acik Noktalar

| Kod | Acik Nokta | Etki | Hedef Faz / Fix |
| --- | --- | --- | --- |
| OPEN-05D-01 | Refund coupon sponsor reversal yok. | Iade aninda allocation bazli sponsor reversal hesaplanmiyor. | PHASE-05-FIX-05E. |
| OPEN-05D-02 | Advanced allocation engine yok. | Bu paket foundation proportional/single-line allocation yapar; kampanya/kupon engine rule detaylari yok. | Coupon/campaign engine package. |
| OPEN-05D-03 | OrderLineId checkout aninda yok. | Allocation `lineId`/`cartLineId` tasir; order olusunca orderLineId mapping ayrica kurulmalidir. | Order snapshot/line mapping package. |
| OPEN-05D-04 | Supplier/brand sponsor settlement impact disabled. | Ilk faz karar geregi supplier/brand allocation reject edilir. | Sponsor activation package. |
| OPEN-05D-05 | Root build/typecheck repo-level config hatasi suruyor. | Root build/typecheck FAIL-REPO; targeted contracts/settlement clean, checkout behavior smoke ile kanitlandi. | Tooling/build recovery package. |

## 13. PHASE-05'e Etki

GAP-05-09:
- CLOSED WITH LIMITATION. Checkout line allocation ve settlement sponsor impact foundation var; refund reversal ve advanced allocation rules sonraki paketlere kaldi.

OPEN-05C-01:
- CLOSED WITH LIMITATION. Coupon line allocation var; orderLineId checkout aninda yoksa cartLineId/lineId kullaniliyor.

OPEN-05C-02:
- CLOSED WITH LIMITATION. Settlement sponsor financial impact line/summary var; payout/payable/ledger uretmiyor, refund reversal yok.

## 14. Nihai Karar

PHASE-05-FIX-05D Karari:
- PASS WITH LIMITATION

Karar gerekcesi:
- Checkout line allocation var.
- Allocation total `discountTotal` ile eslesiyor.
- Platform/creator sponsor allocation korunuyor.
- Settlement sponsor impact line/summary var.
- Supplier/brand blocked kaldi ve settlement allocation input'unda reject ediliyor.
- Refund reversal yapilmadi.
- Targeted smoke PASS.
- Root build/typecheck repo config issue FAIL-REPO olarak acik yazildi.

## 15. Sonraki Adim

PHASE-05-FIX-05E - Refund Coupon Sponsor Reversal paketine gecilebilir.
