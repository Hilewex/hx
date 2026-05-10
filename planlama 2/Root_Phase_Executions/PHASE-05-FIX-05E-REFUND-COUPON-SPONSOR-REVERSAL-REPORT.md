# PHASE-05-FIX-05E - Refund Coupon Sponsor Reversal Report

Date: 2026-05-09

## 1. Amac

Bu fix paketinin amaci, iade/refund oldugunda satir bazli kupon allocation maliyetinin sponsor tipine gore guvenli sekilde reversal/evidence olarak temsil edilmesini saglamaktir.

## 2. Baslangic Durumu

PHASE-05-FIX-05D:
- PASS WITH LIMITATION

Kapanacak acik noktalar:
- OPEN-05D-01
- GAP-05-10

Baslangic inceleme sonucu:

| Soru | Durum | Kanit |
| --- | --- | --- |
| Refund line satir bazli mi? | Evet | `RefundLine` `refundLineId` ve `orderLineId` tasiyordu. |
| Refund line coupon allocation referansi tasiyor mu? | Hayir | Refund contract icinde allocation/reversal referansi yoktu. |
| Coupon sponsor reversal modeli var mi? | Hayir | `couponReversal/refundCoupon/sponsorReversal/COUPON_REVERSAL` scan eslesmesi yoktu. |
| Platform coupon reversal hesaplaniyor mu? | Hayir | Refund service sadece refund creation/process/transition yapiyordu. |
| Creator coupon reversal hesaplaniyor mu? | Hayir | Reversal helper/model yoktu. |
| Supplier/brand sponsor reversal disabled mi? | Hayir | Reversal path olmadigi icin explicit guard da yoktu. |
| Duplicate reversal guard var mi? | Hayir | Refund create idempotency vardi; coupon sponsor reversal idempotency yoktu. |
| Settlement/payout/ledger yanlis mutate ediliyor mu? | Hayir | Bu paket oncesi refund process provider simulation state flow disinda settlement/payout/ledger mutation bulgusu yoktu. |
| BFF/UI reversal truth uretiyor mu? | Hayir | Boundary scan eslesme bulmadi. |

## 3. Esas Alinan Kararlar

- Platform kuponunu platform tasir.
- Fenomen kuponunu fenomen tasir.
- Iade satir bazlidir.
- Kupon sponsor maliyeti iade edilen satira gore geri hesaplanir.
- Supplier/brand sponsor ilk fazda kapalidir.
- Refund completed = settlement adjusted degildir.
- Refund completed = payout reversed degildir.
- Reversal evidence refund lifecycle, provider refund execution, payout, ledger ve settlement lifecycle mutation yapmaz.
- `orderLineId` yoksa `lineId`/`cartLineId` referansi kabul edilir.

## 4. Degistirilen Dosyalar

| Dosya | Degisiklik | Gerekce | Etki |
| --- | --- | --- | --- |
| `packages/contracts/src/refund.ts` | `RefundCouponSponsorReversal`, command/result ve summary modelleri eklendi. | Refund coupon sponsor reversal evidence kontrati olussun. | Platform/creator reversal line ve no-mutation summary temsil edilir. |
| `services/refund/src/refund.ts` | `calculateRefundCouponSponsorReversal` helper'i ve test reset guard'i eklendi. | Allocation input'undan satir bazli sponsor reversal hesaplansin. | Platform/creator destekli, supplier/brand blocked, idempotent evidence uretir. |
| `tests/smoke/suites/refund-coupon-sponsor-reversal-foundation.ts` | Targeted smoke suite eklendi. | Yeni reversal davranisini kanitlamak. | Platform/creator/partial/idempotency/no-mutation senaryolari PASS. |
| `tests/smoke/run-smoke.ts` | Suite key'i eklendi. | Root smoke runner targeted suite'i taniyabilsin. | `refund-coupon-sponsor-reversal-foundation` calisir. |
| `package.json` | `smoke:refund-coupon-sponsor-reversal-foundation` script'i eklendi. | Prompttaki script gereksinimi. | Root script ile targeted smoke calisir. |
| `PHASE-05-FIX-05E-REFUND-COUPON-SPONSOR-REVERSAL-REPORT.md` | Bu rapor olusturuldu. | Karar, kanit ve limitation kaydi. | Closure kaydi var. |

## 5. Refund Coupon Reversal Davranisi

Platform coupon reversal hesaplaniyor mu?
- Evet. Platform allocation platform reversal line ve `platformReversalAmount` uretir.

Creator coupon reversal hesaplaniyor mu?
- Evet. Creator allocation creator reversal line ve `creatorReversalAmount` uretir.

Reversal satir bazli mi?
- Evet. Matching `orderLineId`, `lineId` veya `cartLineId` uzerinden yapilir.

Reversal allocation amount'u asiyor mu?
- Hayir. Full refund allocation tutarini, partial refund ise ratio ile sinirli tutari reverse eder.

Partial refund davranisi:
- Supported foundation. `refundAmount/originalLineAmount` varsa proportional reversal hesaplanir; yoksa full-line reversal varsayilir.

Supplier/brand reversal uretiliyor mu?
- Hayir. Supplier/brand/mixed allocation `FIRST_PHASE_REFUND_COUPON_SPONSOR_REVERSAL_UNSUPPORTED` ile blocked olur.

## 6. Settlement / Payout / Ledger Ayrimi

Refund coupon reversal settlement adjusted yaratiyor mu?
- Hayir. Summary `settlementAdjustedCreated: false`.

Refund coupon reversal payout reversal yaratiyor mu?
- Hayir. Summary `payoutReversalCreated: false`.

Refund coupon reversal ledger entry yaratiyor mu?
- Hayir. Summary `ledgerEntryCreated: false`.

Order/payment/refund state mutate ediyor mu?
- Hayir. Helper state owner objesi veya repository mutate etmez; summary mutation flag'leri false.

## 7. Idempotency / Duplicate Davranisi

Same idempotency key + same payload:
- Onceki result aynen doner; yeni reversal uretilmez.

Same idempotency key + different payload:
- `CONFLICT` ve `DUPLICATE_IDEMPOTENCY_KEY_CONFLICT` doner.

Yeni duplicate reversal olusuyor mu?
- Hayir.

Different payload kabul ediliyor mu?
- Hayir.

## 8. BFF / UI / Panel Boundary

BFF reversal truth uretiyor mu?
- Hayir. Boundary scan eslesme bulmadi.

UI/panel reversal truth uretiyor mu?
- Hayir. Boundary scan eslesme bulmadi.

Panel direct refund/settlement/ledger write var mi?
- Hayir. Bu paket kapsaminda panel direct write eklenmedi.

## 9. Boundary Regression Scan

| Tarama | Sonuc | Not |
| --- | --- | --- |
| BFF/UI reversal truth | PASS | `rg "couponReversal|sponsorReversal|refundCoupon|platformReversal|creatorReversal|allocatedAmount" apps/bff/src/server apps/web apps/panel -g "*.ts" -g "*.tsx"` eslesme bulmadi. |
| Settlement/payout/ledger accidental mutation | PASS | Refund service sadece false summary flag uretir; finance ledger kendi mevcut append path'ini korur, refund reversal helper ledger cagirmiyor. |
| Supplier/brand sponsor reversal | PASS | Contract summary supplier/brand 0; service supplier/brand/mixed allocation reject eder; smoke assert var. |
| Refund state mutation | PASS WITH EXISTING FLOW | Mevcut `processRefund` ve `transitionRefundState` state mutate ediyor; yeni reversal helper bu flow'a baglanmadi ve state mutate etmiyor. |

## 10. Smoke/Test Kaniti

| Senaryo | Sonuc | Kanit |
| --- | --- | --- |
| Platform reversal calculated | PASS | Platform allocation 10 TRY -> platform reversal 10 TRY. |
| Creator reversal calculated | PASS | Creator allocation 30 TRY, 50/100 partial -> creator reversal 15 TRY. |
| Reversal total safe | PASS | Reversal total allocation amount'u asmiyor. |
| Partial refund behavior safe | PASS | `refundAmount/originalLineAmount` proportional ratio uygulandi. |
| Supplier/brand unsupported | PASS | Supplier ve brand allocation blocked. |
| Duplicate same key safe | PASS | Same key + same payload onceki reversal result'ini dondu. |
| Duplicate different payload rejected | PASS | Same key + different payload `CONFLICT`. |
| No settlement adjusted | PASS | Summary false. |
| No payout reversal | PASS | Summary false. |
| No ledger entry | PASS | Summary false. |
| No owner state mutation | PASS | Summary order/payment/refund mutation false. |

## 11. Komut Sonuclari

| Komut | Sonuc | Not |
| --- | --- | --- |
| `pnpm run typecheck` | FAIL-REPO | `apps/web` TS6059/TS6307 rootDir/include disi workspace source imports nedeniyle fail ediyor. |
| `pnpm run build` | FAIL-REPO | `apps/web` ayni TS6059/TS6307 repo config hatasiyla fail ediyor. |
| `pnpm run smoke:refund-coupon-sponsor-reversal-foundation` | PASS | Targeted reversal smoke passed. |
| `pnpm run smoke:coupon-line-allocation-settlement-impact` | PASS | 05D allocation + settlement impact regression passed. |
| `pnpm run smoke:refund-financial-impact-foundation` | PASS | Refund financial impact regression passed. |
| `pnpm run smoke:settlement-calculation-foundation` | PASS | Settlement calculation regression passed. |
| `pnpm run smoke:coupon-sponsor-policy-guard` | PASS | Supplier/brand guard ve creator policy regression passed. |
| `pnpm run smoke:creator-margin-settlement-foundation` | PASS | Creator margin settlement regression passed. |
| `pnpm run smoke:pool-price-corridor-foundation` | PASS | Pool price corridor regression passed. |
| `pnpm run smoke:payable-payout-boundary-foundation` | PASS | Payable/payout boundary regression passed. |
| `pnpm run smoke:finance-ledger-foundation` | PASS | Finance ledger regression passed. |
| `pnpm --filter @hx/contracts typecheck` | PASS | Contract types clean. |
| `pnpm --filter @hx/contracts build` | PASS | Contract build clean. |
| `pnpm --filter @hx/refund typecheck` | FAIL-REPO | Refund package tsconfig rootDir/include disi workspace imports nedeniyle fail ediyor; targeted smoke PASS. |
| `pnpm --filter @hx/refund build` | BLOCKED | `@hx/refund` package icinde build script yok. |

## 12. Kalan Acik Noktalar

| Kod | Acik Nokta | Etki | Hedef Faz / Fix |
| --- | --- | --- | --- |
| OPEN-05E-01 | Reversal evidence repository persistence yok. | Helper in-memory idempotency guard ile foundation sunar; durable persistence sonraki pakete kalir. | Refund/settlement adjustment materialization package. |
| OPEN-05E-02 | Settlement adjustment materialization yok. | Reversal settlement adjustment icin evidence saglar ama adjusted state yaratmaz. | Settlement adjustment lifecycle package. |
| OPEN-05E-03 | Payout reversal entegrasyonu yok. | Bilerek yapilmadi; payout reversal uretilmez. | Payout reversal package. |
| OPEN-05E-04 | Supplier/brand sponsor reversal disabled. | Ilk faz karar geregi supplier/brand allocation reject edilir. | Sponsor activation package. |
| OPEN-05E-05 | Root build/typecheck repo-level config hatasi suruyor. | Root build/typecheck FAIL-REPO. | Tooling/build recovery package. |

## 13. PHASE-05'e Etki

OPEN-05D-01:
- CLOSED WITH LIMITATION. Refund coupon sponsor reversal foundation var; persistence ve settlement adjustment materialization yok.

GAP-05-10:
- CLOSED WITH LIMITATION. Refund line'larda coupon sponsor reversal contract/helper/smoke var; durable lifecycle entegrasyonu sonraki pakete kaldi.

## 14. Nihai Karar

PHASE-05-FIX-05E Karari:
- PASS WITH LIMITATION

Karar gerekcesi:
- Platform reversal var.
- Creator reversal var.
- Reversal satir bazli.
- Partial refund foundation proportional.
- Duplicate reversal guard var.
- Supplier/brand disabled kaliyor.
- Settlement adjusted yaratmaz.
- Payout reversal yaratmaz.
- Ledger entry yaratmaz.
- Targeted smoke PASS.
- Root build/typecheck repo config issue FAIL-REPO olarak acik yazildi.

## 15. Sonraki Adim

PHASE-05-FIX-05F - Reward Point Lifecycle Foundation paketine gecilebilir.
