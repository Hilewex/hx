# PHASE-05-FIX-05B - Creator Margin Settlement Foundation Report

Date: 2026-05-09

## 1. Amac

Bu fix paketinin amaci, fenomen/creator kazancini sabit yuzde yerine `selectedSalePrice - poolBasePriceAmount` formuluyle settlement foundation icinde temsil etmektir.

Bu paket payout, payable, ledger entry, payment, order, refund owner state veya kupon/kampanya sponsor etkisi uretmez.

## 2. Baslangic Durumu

PHASE-05-FIX-05:
- PARTIAL

PHASE-05-FIX-05A:
- PASS WITH LIMITATION

Kapanacak gap:
- GAP-05-03

Baslangic inceleme sonucu:

| Soru | Durum | Kanit |
| --- | --- | --- |
| Settlement creator share hesapliyor mu? | Hayir | `calculateSettlement` creatorId varsa `CREATOR_SHARE_NOT_CALCULATED` flag basiyordu. |
| Creator share sabit yuzde olarak mi duruyor? | Hayir | Creator icin yuzde/rate hesaplamasi yoktu; hic hesaplanmiyordu. |
| `CREATOR_SHARE_NOT_CALCULATED` flag hala var mi? | Evet | Eksik creator input durumlari icin contract flag korundu. |
| Settlement input selected sale price tasiyor mu? | Hayir | `selectedSalePrice` yoktu. |
| Settlement input pool base price tasiyor mu? | Hayir | `poolBasePriceAmount` yoktu. |
| Settlement calculation pool base price snapshot kullanabiliyor mu? | Hayir | Snapshot/source id alanlari yoktu. |
| Supplier base price settlement disina siziyor mu? | Hayir | Settlement result/input supplier base price alani tasimiyordu. |
| Brand share aktif mi? | Hayir | Brand share hesaplanmiyor; limitation flag vardi. |

## 3. Esas Alinan Kararlar

- Fenomen payi sabit yuzde degildir.
- Fenomen kazanci = satis fiyati - havuz taban fiyati.
- Havuz taban fiyati pool base price snapshot kaynagindan gelir.
- Fenomen tedarikci baz fiyatini gormez.
- Marka payi ilk fazda yoktur.
- Bu paket kupon/kampanya sponsor etkisi yapmaz.
- Bu paket payout/payable/ledger entry uretmez.

## 4. Degistirilen Dosyalar

| Dosya | Degisiklik | Gerekce | Etki |
| --- | --- | --- | --- |
| `packages/contracts/src/settlement.ts` | `CREATOR_MARGIN` line type'i, `selectedSalePrice`, `poolBasePriceAmount`, creator/pool source alanlari ve `creatorMarginAmount` eklendi. | Settlement input/result creator margin foundation'i tasiyabilsin. | Contract pool base price snapshot kaynagini settlement input'a temsil edebilir hale geldi. |
| `services/settlement/src/settlement.ts` | Creator context varsa selected sale price ve pool base price zorunlu kilindi; margin `selectedSalePrice - poolBasePriceAmount` hesaplandi; negatif margin bloke edildi; `CREATOR_MARGIN` line eklendi. | GAP-05-03'u guvenli foundation seviyesinde kapatmak. | Creator margin hesaplanir, sabit yuzde kullanilmaz, payout/ledger/owner state mutate edilmez. |
| `tests/smoke/suites/creator-margin-settlement-foundation.ts` | Targeted smoke eklendi. | Valid, negatif, zero margin, limitation ve mutation guard senaryolarini kanitlamak. | `creator-margin-settlement-foundation` suite'i calisir. |
| `tests/smoke/run-smoke.ts` | Yeni suite key'i eklendi. | Root smoke runner targeted suite'i taniyabilsin. | `tsx tests/smoke/run-smoke.ts creator-margin-settlement-foundation` calisir. |
| `package.json` | `smoke:creator-margin-settlement-foundation` script'i eklendi. | Prompttaki script gereksinimi. | Root script ile targeted smoke calisir. |
| `PHASE-05-FIX-05B-CREATOR-MARGIN-SETTLEMENT-FOUNDATION-REPORT.md` | Bu rapor olusturuldu. | Degisiklik, karar ve kanit kaydi. | Closure kaydi var. |

## 5. Creator Margin Davranisi

Creator margin hesaplaniyor mu?
- Evet. `creatorId` varsa `selectedSalePrice` ve `poolBasePriceAmount` ile hesaplanir.

Formul:
- `selectedSalePrice - poolBasePriceAmount`

Sabit yuzde kullaniliyor mu?
- Hayir. Creator margin icin `rate`, `percent` veya sabit yuzde kullanilmadi.

selectedSalePrice < poolBasePriceAmount davranisi:
- Reject / Blocked. `SETTLEMENT_CREATOR_MARGIN_NEGATIVE` error ile `BLOCKED`.

selectedSalePrice = poolBasePriceAmount davranisi:
- Zero margin accepted. `creatorMarginAmount = 0` guvenli kabul edilir.

CREATOR_MARGIN line olusuyor mu?
- Evet. Creator inputlari gecerliyse `CREATOR_MARGIN` line olusur.

`creatorShareAmount` anlami:
- Geriye donuk alan olarak korundu; yeni sistem kararinda `creatorMarginAmount` ile ayni tutar olarak doldurulur.

## 6. Boundary

Settlement payout/payable/paid_out uretiyor mu?
- Hayir. Calculation summary alanlari `ledgerEntryCreated`, `payoutCreated`, `payableCreated`, `paidOutCreated` daima `false`.

Settlement ledger entry uretiyor mu?
- Hayir.

Order/payment/refund state mutate ediyor mu?
- Hayir. Calculation summary owner mutation alanlari `false`.

Supplier base price result/public response'a siziyor mu?
- Hayir. Settlement input/result supplier base price veya supplier snapshot tasimaz.

BFF/UI/Panel creator margin truth uretiyor mu?
- Hayir. Boundary scan eslesme bulmadi.

Pool price snapshot uyumu:
- Runtime pool -> settlement entegrasyonu bu pakette zorunlu tutulmadi.
- Settlement input `poolBasePriceAmount`, `poolBasePriceSourceId`, `priceSelectionId`, `commercialProductId` alanlariyla PHASE-05-FIX-05A pool base price snapshot kaynagini tasiyabilir.

## 7. Brand / Coupon Limitation

Brand share:
- Deferred. `brandId` varsa `BRAND_SHARE_NOT_CALCULATED` flag kalir ve `brandShareAmount = 0` dondurulur.

Coupon sponsor impact:
- Deferred. `COUPON_SPONSOR_IMPACT_NOT_CALCULATED` flag korunur.

Refund settlement impact:
- Deferred. `REFUND_SETTLEMENT_IMPACT_NOT_CALCULATED` flag korunur.

## 8. Boundary Regression Scan

| Tarama | Sonuc | Not |
| --- | --- | --- |
| Supplier base price leak | PASS | `rg 'supplierBasePrice\|supplierBasePriceSnapshot\|supplierCost\|costPrice' apps/web apps/panel apps/bff/src/server services/settlement -g '*.ts' -g '*.tsx'` eslesme bulmadi. |
| Creator percentage misuse | PASS | `rg 'creator.*Rate\|creator.*Percent\|creatorShareRate\|creatorCommissionRate\|percentage\|percent' services/settlement packages/contracts/src/settlement.ts -g '*.ts'` eslesme bulmadi. |
| Settlement creates payout/payable/ledger | PASS | Scan sadece `paidOutCreated: false` summary guard'i ve mevcut smoke-test regex guard'i buldu; creator settlement path payout/payable/ledger uretmiyor. |
| BFF/UI creator margin truth | PASS | `rg 'creatorMargin\|creatorShareAmount\|poolBasePrice\|selectedSalePrice\|selectedPrice' apps/bff/src/server apps/web apps/panel -g '*.ts' -g '*.tsx'` eslesme bulmadi. |

## 9. Smoke/Test Kaniti

| Senaryo | Sonuc | Kanit |
| --- | --- | --- |
| Valid creator margin calculated | PASS | `selectedSalePrice = 1500`, `poolBasePriceAmount = 1200`, `creatorMarginAmount = 300`. |
| CREATOR_MARGIN line created | PASS | Targeted smoke `CREATOR_MARGIN` line amount `300` dogruladi. |
| No fixed percentage used | PASS | Creator percentage misuse scan PASS; smoke formula sonucunu dogruladi. |
| selected below pool base rejected | PASS | `selectedSalePrice = 1100`, `poolBasePriceAmount = 1200` -> `BLOCKED`, `SETTLEMENT_CREATOR_MARGIN_NEGATIVE`. |
| selected equal pool base safe | PASS | `selectedSalePrice = 1200`, `poolBasePriceAmount = 1200` -> `CALCULATED`, `creatorMarginAmount = 0`. |
| no supplier base price leak | PASS | Targeted smoke result alanlarini ve boundary scan'i dogruladi. |
| no payout/payable/ledger creation | PASS | Calculation summary false alanlari smoke ile dogrulandi. |
| brand/coupon limitations visible | PASS | `BRAND_SHARE_NOT_CALCULATED`, `COUPON_SPONSOR_IMPACT_NOT_CALCULATED`, `brandShareAmount = 0`. |

## 10. Komut Sonuclari

| Komut | Sonuc | Not |
| --- | --- | --- |
| `pnpm run typecheck` | FAIL-REPO | `apps/web` once `TS6059/TS6307` ile fail ediyor; workspace source imports `apps/web` rootDir/include disinda. |
| `pnpm run build` | FAIL-REPO | `apps/web` ayni `TS6059/TS6307` repo config hatasiyla fail ediyor. |
| `pnpm run smoke:creator-margin-settlement-foundation` | PASS | Targeted smoke passed. |
| `pnpm run smoke:settlement-calculation-foundation` | PASS | Existing settlement calculation smoke passed. |
| `pnpm run smoke:pool-price-corridor-foundation` | PASS | Pool price corridor smoke passed. |
| `pnpm run smoke:finance-ledger-foundation` | PASS | Finance ledger smoke passed. |
| `pnpm run smoke:refund-financial-impact-foundation` | PASS | Refund financial impact smoke passed. |
| `pnpm run smoke:payable-payout-boundary-foundation` | PASS | Payable/payout boundary smoke passed. |
| `pnpm --filter @hx/contracts typecheck` | PASS | Contract types clean. |
| `pnpm --filter @hx/contracts build` | PASS | Contract build clean. |
| `pnpm --filter @hx/settlement typecheck` | PASS | Settlement service types clean. |
| `pnpm --filter @hx/settlement build` | PASS | Settlement service build clean. |

## 11. Kalan Acik Noktalar

| Kod | Acik Nokta | Etki | Hedef Faz / Fix |
| --- | --- | --- | --- |
| OPEN-05B-01 | Pool -> settlement full runtime entegrasyonu yok. | Foundation input hazir; order/checkout runtime aktarimi sonraki faza kaldi. | Settlement integration package. |
| OPEN-05B-02 | Admin/category margin persistence yok. | Pool base price PHASE-05-FIX-05A foundation default kaynagina dayanir. | Category margin policy package. |
| OPEN-05B-03 | Coupon sponsor settlement etkisi yok. | Sponsor etkisi limitation flag ile deferred. | PHASE-05-FIX-05C. |
| OPEN-05B-04 | Root build/typecheck repo-level `apps/web` config hatasi suruyor. | Root build/typecheck FAIL-REPO; targeted package checks PASS. | Tooling/build recovery package. |

## 12. PHASE-05'e Etki

GAP-05-03:
- CLOSED WITH LIMITATION. Creator margin settlement foundation hesapliyor, negatif margin bloke ediliyor ve `CREATOR_MARGIN` line uretiliyor; pool -> settlement runtime entegrasyonu sonraki faza kaldi.

## 13. Nihai Karar

PHASE-05-FIX-05B Karari:
- PASS WITH LIMITATION

Karar gerekcesi:
- Creator margin `selectedSalePrice - poolBasePriceAmount` olarak hesaplanir.
- Sabit yuzde kullanilmaz.
- Negative margin reject edilir.
- `CREATOR_MARGIN` line olusur.
- Supplier base price leak yok.
- Settlement payout/payable/ledger uretmez.
- Targeted smoke PASS.
- Pool -> settlement full runtime entegrasyonu ve admin/category margin persistence sonraki faza devredildi.
- Root build/typecheck repo config issue FAIL-REPO olarak acik yazildi.

## 14. Sonraki Adim

PHASE-05-FIX-05C - Coupon Sponsor Policy Guard paketine gecilebilir.
