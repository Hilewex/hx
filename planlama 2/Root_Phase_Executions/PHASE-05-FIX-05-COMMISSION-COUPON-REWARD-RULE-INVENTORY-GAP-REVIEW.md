# PHASE-05-FIX-05 - Commission / Coupon / Reward Rule Inventory & Code Gap Review

## 1. Amac

Bu rapor, komisyon, fenomen marji, kupon sponsoru, kampanya indirimi ve reward/point finansal etkisinin sistem kararlariyla mevcut kod arasindaki uyumunu incelemek icin hazirlanmistir.

Bu paket dogrudan kodlama paketi degildir. Inceleme sonucunda kod degisikligi yapilmamistir.

## 2. Esas Alinan Mimari Kararlar

1. Fenomen payi sabit yuzde degildir.
2. Fenomen kazanci = satis fiyati - havuz taban fiyati.
3. Marka payi ilk fazda yoktur.
4. Tedarikci sponsorlu indirim ilk fazda kapalidir.
5. Platform kuponunu platform tasir.
6. Fenomen kuponunu fenomen tasir; minimum fenomen marji korunur.
7. Platform destekli fenomen kuponu admin oranı olmadan calismaz.
8. Kampanyali urunde fenomen kuponu varsayilan kapalidir.
9. Iadede kupon maliyeti sponsor tipine gore satir bazli duzeltilir.
10. Reward/point nakit degildir.
11. Puan once pending olur; sonra spendable olur.
12. Iadede pending/spendable puan etkisi geri alinabilir.

## 3. Incelenen Dosyalar

- `services/pricing/src/pricing.ts`
- `packages/contracts/src/pricing.ts`
- `services/pool/src/pool.ts`
- `packages/contracts/src/pool.ts`
- `services/catalog/src/catalog.ts`
- `packages/contracts/src/catalog.ts`
- `services/storefront/src/index.ts`
- `packages/contracts/src/storefront.ts`
- `services/creator-management/src/index.ts`
- `services/settlement/src/settlement.ts`
- `packages/contracts/src/settlement.ts`
- `services/finance/src/finance.ts`
- `packages/contracts/src/finance-ledger.ts`
- `services/checkout/src/checkout.ts`
- `packages/contracts/src/checkout.ts`
- `packages/contracts/src/coupon.ts`
- `services/refund/src/refund.ts`
- `services/refund/src/repository/postgres.ts`
- `packages/contracts/src/refund.ts`
- `services/cancel-return/src/cancel-return.ts`
- `packages/contracts/src/cancel-return.ts`
- `services/customer-reward/src/customer-reward.ts`
- `packages/contracts/src/customer-reward.ts`
- `apps/bff/src/server/checkout.ts`
- `apps/bff/src/server/pool.ts`
- `apps/bff/src/server/settlement.ts`
- `apps/bff/src/server/finance-ledger.ts`
- `apps/bff/src/server/finance-correction.ts`
- `apps/bff/src/server/customer-reward.ts`
- `apps/panel/**`
- `apps/web/**`
- `tests/smoke/suites/settlement-calculation-foundation.ts`
- `tests/smoke/suites/refund-financial-impact-foundation.ts`
- `tests/smoke/suites/payable-payout-boundary-foundation.ts`
- `tests/smoke/suites/finance-ledger.ts`
- `tests/smoke/suites/checkout-coupon-campaign-impact-foundation.ts`

Not: `services/commercial-pool`, `services/coupon`, `services/campaign`, `services/reward`, `services/points` dizinleri bulunmadi.

## 4. Genel Sonuc Ozeti

| Alan | Sonuc | Not |
|---|---|---|
| Fiyat koridoru | PARTIAL | Pricing contract ve simulation koridor tasiyor; pool tarafinda creator selectedPrice sadece pozitif kontrol ediliyor, koridor enforcement yok. |
| Fenomen marji | FAIL | Settlement creator share hesaplamiyor; satis fiyati - havuz taban fiyati modeli yok. |
| Marka payi | PASS WITH LIMITATION | Settlement marka payini hesaplamiyor ve limitation flag uretiyor; ancak checkout foundation brand sponsor campaign aktif fixture tasiyor. |
| Tedarikci sponsorlu indirim | FAIL | Checkout foundation icinde aktif `SUPPLIER` sponsorlu kupon var. Ilk faz kapali kararina aykiri. |
| Platform kuponu | PARTIAL | Platform sponsor snapshot var; settlement/ledger finansal etki yok. |
| Fenomen kuponu | FAIL | `CREATOR` sponsor tipi contract'ta var, fakat creator coupon policy, minimum marj korumasi ve campaign default-off guard yok. |
| Kampanya indirimi | PARTIAL | Campaign input/snapshot var; brand sponsored campaign fixture var, creator coupon default-off veya sponsor financial impact yok. |
| Iade sonrasi kupon etkisi | FAIL | Refund satir bazli line tasiyor, fakat kupon sponsor maliyeti satir bazli geri hesaplanmiyor. |
| Reward / point | PARTIAL | Eligibility servisi earn/revoke karar kapisi tasiyor; pending/spendable ledger/liability modeli yok. |
| BFF / Panel / UI boundary | PASS WITH LIMITATION | BFF temel olarak service boundary'ye delegate ediyor ve finance role guard var; checkout body discountInput alabiliyor, admin policy/rate modeli yok. |

## 5. Kanitli Bulgular

| No | Alan | Dosya | Fonksiyon / Model | Bulgu | Sistem Karariyla Uyum | Karar |
|---|---|---|---|---|---|---|
| 1 | Havuz / fiyat koridoru | `services/pricing/src/pricing.ts:12` | `resolvePrice` | `basePrice` deterministic simulation olarak uretiliyor; tedarikci baz fiyati ayrik persisted kaynak degil. | Karar 2 icin havuz taban fiyati kaniti zayif. | LIMITATION |
| 2 | Havuz / fiyat koridoru | `services/pricing/src/pricing.ts:14` | `resolvePrice` | `platformMarginRate = 0.20` sabit kodlanmis. Komisyon/kategori kar orani uydurulmamalidir. | Sistem kararlarinda oran uydurma yasak; foundation simulation olarak kalmali. | BLOCKER |
| 3 | Havuz / fiyat koridoru | `services/pricing/src/pricing.ts:15` | `resolvePrice` | `poolBasePrice = basePrice * (1 + platformMarginRate)` var, ancak ikinci havuz taban fiyati veya persisted pool base yok. | Fenomen kazanci icin gerekli taban fiyat modeli eksik. | BLOCKER |
| 4 | Havuz / fiyat koridoru | `packages/contracts/src/pricing.ts:3` | `PriceCorridor` | `minPrice`, `suggestedPrice`, `maxPrice` contract'ta var. | Koridor modeli kismen uyumlu. | NO ACTION |
| 5 | Havuz / fiyat koridoru | `services/pool/src/pool.ts:705` | `addCommercialProductToCreatorStore` | Creator selectedPrice icin sadece `> 0` kontrolu var. `minPrice/maxPrice` enforcement yok. | Fenomen sadece koridor icinde fiyat secebilmeli kararina uyumsuz. | BLOCKER |
| 6 | Havuz / fiyat koridoru | `packages/contracts/src/pool.ts:305` | `AddCommercialProductToCreatorStoreCommand` | Komut `selectedPrice` aliyor; `priceCorridor`, `poolBasePrice`, `floorPrice` veya launch enforcement alanlari yok. | Fiyat koridoru ve lansman onerilen fiyat zorunlulugu contract'ta yok. | BLOCKER |
| 7 | Fenomen marji | `services/settlement/src/settlement.ts:134` | `calculateSettlement` | `creatorId` geldiginde `CREATOR_SHARE_NOT_CALCULATED` limitation flag ekleniyor. | Fenomen kazanci hesaplanmiyor; karar 2 uygulanmamis. | BLOCKER |
| 8 | Fenomen marji | `packages/contracts/src/settlement.ts:78` | `SettlementAmountSummary` | `creatorShareAmount?` opsiyonel alan var, kaynak/fingerprint/minimum marj semantigi yok. | Creator share temsil yuzeyi var ama kural modeli yok. | LIMITATION |
| 9 | Fenomen marji | `services/settlement/src/settlement.ts:140` | `calculateSettlement` | Platform payi input `platformCommissionRate` ile hesaplanirken creator share uretilmiyor. | Sabit creator percentage bulunmadi; fakat dogru marj modeli de yok. | BLOCKER |
| 10 | Marka payi | `services/settlement/src/settlement.ts:135` | `calculateSettlement` | `brandId` varsa `BRAND_SHARE_NOT_CALCULATED` limitation flag ekleniyor. | Ilk fazda marka payi yok karariyla uyumlu. | NO ACTION |
| 11 | Marka payi | `packages/contracts/src/settlement.ts:157` | `SettlementCalculationResult` | `brandShareAmount?` opsiyonel alan var, aktif hesaplama kaniti yok. | Disabled/unsupported gibi duruyor; aktif payout/settlement yok. | LIMITATION |
| 12 | Kupon / sponsor | `services/checkout/src/checkout.ts:44` | `FOUNDATION_DISCOUNTS` | Foundation discount registry aktif checkout validasyon kaynagi olarak kullaniliyor. | Policy kaynagi foundation; admin oran/policy modeli yok. | LIMITATION |
| 13 | Kupon / sponsor | `services/checkout/src/checkout.ts:57` | `FOUNDATION_DISCOUNTS` | `HX_SUPPLIER_25` kuponu `sponsorType: 'SUPPLIER'` ile aktif. | Tedarikci sponsorlu indirim ilk fazda kapali kararina aykiri. | BLOCKER |
| 14 | Kupon / sponsor | `services/checkout/src/checkout.ts:48` | `FOUNDATION_DISCOUNTS` | `HX10` platform sponsorlu kupon olarak isaretleniyor. | Platform kuponunu platform tasir kararina checkout snapshot seviyesinde uyumlu. | NO ACTION |
| 15 | Kupon / sponsor | `services/checkout/src/checkout.ts:98` | `FOUNDATION_DISCOUNTS` | `CAMP_BRAND_20` brand sponsorlu campaign aktif fixture olarak var. | Marka payi ilk fazda yok kararina campaign maliyeti acisindan riskli. | BLOCKER |
| 16 | Kupon / sponsor | `services/checkout/src/checkout.ts:217` | `resolveDiscountSnapshots` | Snapshot `sponsorType` ve `sponsorId` tasiyor. | Checkout snapshot sponsor bilgisini tasiyor. | NO ACTION |
| 17 | Kupon / sponsor | `services/checkout/src/checkout.ts:491` | `startCheckout` | Discount toplam checkout seviyesinde `Math.min(subTotal, discountTotal)` olarak uygulanir; satir dagitimi yok. | Settlement/refund satir bazli sponsor etkisi icin yetersiz. | BLOCKER |
| 18 | Kupon / sponsor | `packages/contracts/src/coupon.ts:1` | `DiscountSponsorType` | `PLATFORM`, `SUPPLIER`, `CREATOR`, `BRAND`, `MIXED` sponsor tipleri var. | Contract genis; ilk faz kapali sponsorlar icin policy guard yok. | LIMITATION |
| 19 | Settlement financial impact | `services/settlement/src/settlement.ts:136` | `calculateSettlement` | Coupon sponsor input'u varsa `COUPON_SPONSOR_IMPACT_NOT_CALCULATED` flag ekleniyor. | Kupon settlement financial impact yok; limitation olarak acik. | LIMITATION |
| 20 | Settlement financial impact | `services/settlement/src/settlement.ts:143` | `calculateSettlement` | Lines sadece `GROSS_SALE`, `PLATFORM_COMMISSION`, `SUPPLIER_NET` uretiyor. | Creator/brand/coupon/refund adjustment uretilmiyor. | BLOCKER |
| 21 | Refund / coupon etkisi | `services/refund/src/refund.ts:58` | `createRefundFromCancelReturn` | Refund line'lari request line bazli olusuyor, ancak `amount: 0` ve coupon sponsor alanlari yok. | Refund satir bazli basliyor ama finansal/kupon etkisi hesaplanmiyor. | BLOCKER |
| 22 | Refund / coupon etkisi | `packages/contracts/src/refund.ts:24` | `RefundLine` | Refund line contract'inda amount/currency var; coupon discount/sponsor/reversal alanlari yok. | Iadede sponsor tipine gore satir bazli duzeltme icin contract eksik. | BLOCKER |
| 23 | Refund / finance | `services/finance/src/finance.ts:70` | `createRefundImpactSummary` | Refund financial impact summary settlement/payout adjustment olusmadigini explicit false donduruyor. | Refund ledger foundation var, coupon sponsor settlement duzeltmesi yok. | LIMITATION |
| 24 | Reward / point | `services/customer-reward/src/customer-reward.ts:23` | `checkCustomerRewardEligibility` | `EARN_POINTS` eligibility var; guest, suspended, risk/moderation guard var. | Nakit gibi davranma kaniti yok, ama sadece eligibility. | LIMITATION |
| 25 | Reward / point | `services/customer-reward/src/customer-reward.ts:47` | `checkCustomerRewardEligibility` | Purchase reward icin `PURCHASE_DELIVERED` ve `delivered && notReturned` sarti var. | Teslimat sonrasi/net kazanima yakin eligibility var. | NO ACTION |
| 26 | Reward / point | `services/customer-reward/src/customer-reward.ts:70` | `checkCustomerRewardEligibility` | `REVOKE_POINTS` ve `RETURN_OR_REFUND` eligibility var. | Iade revoke kapisi var, fakat pending/spendable reversal state modeli yok. | LIMITATION |
| 27 | Reward / point | `packages/contracts/src/customer-reward.ts:1` | `CustomerRewardEventType` | Reward contract sadece event/action eligibility tasiyor; `pending`, `spendable`, `redeemed`, `liability` alanlari yok. | Karar 11-12 uygulanmamis. | BLOCKER |
| 28 | Ledger / reward | `packages/contracts/src/finance-ledger.ts:18` | `LedgerSourceType` | `REWARD` ledger source type var, ancak reward ledger entry type/liability modeli yok. | Point nakit degildir kararini enforce eden finansal liability modeli yok. | LIMITATION |
| 29 | BFF boundary | `apps/bff/src/server/checkout.ts:27` | `handleStartCheckout` | BFF checkout `startCheckout` service'ine delegate ediyor; komisyon/kupon maliyeti hesaplamiyor. | BFF truth uretmemeli kararina uyumlu. | NO ACTION |
| 30 | BFF boundary | `apps/bff/src/server/pool.ts:114` | `addCommercialProductToCreatorStore` | BFF actor store id'yi context'ten enforce ediyor, fakat selectedPrice policy service tarafina aynen gidiyor. | Ownership iyi; koridor/policy guard eksik. | LIMITATION |
| 31 | BFF boundary | `apps/bff/src/server/settlement.ts:17` | `handleCreateSettlementFromOrder` | Settlement write endpoint `requireFinanceRole` ile korunuyor. | Protected action beklentisine kismen uyumlu. | NO ACTION |
| 32 | BFF boundary | `apps/bff/src/server/customer-reward.ts:20` | `customerRewardRouter` | Reward BFF actor context'i zorunlu kiliyor ve eligibility service'ine delegate ediyor. | BFF reward financial truth uretmiyor. | NO ACTION |

## 6. Gap Listesi

| Kod | Eksik / Gap | Etki | Karar | Onerilen Sonraki Paket |
|---|---|---|---|---|
| GAP-05-01 | Pool/pricing tarafinda persisted supplier base price, pool base price, kategori/platform kar kaynagi ve ikinci havuz taban fiyati yok. | Fenomen kazanci = satis fiyati - havuz taban fiyati hesaplanamaz. | BLOCKER | PHASE-05-FIX-05A - Pool Base Price & Corridor Rule Source |
| GAP-05-02 | Creator selectedPrice koridor icinde enforce edilmiyor; lansman donemi onerilen fiyat zorunlulugu yok. | Fenomen fiyat secimi sistem kararlarini bypass edebilir. | BLOCKER | PHASE-05-FIX-05A - Pool Base Price & Corridor Rule Source |
| GAP-05-03 | Settlement creator margin hesaplamiyor; `CREATOR_SHARE_NOT_CALCULATED` limitation'da kaliyor. | Fenomen alacagi dogru olusmaz. | BLOCKER | PHASE-05-FIX-05B - Creator Margin Settlement Foundation |
| GAP-05-04 | Sabit `platformMarginRate = 0.20` simulation kodu rule source gibi kullaniliyor. | Uydurma oran riski; kategori/platform kar karari kanitsiz. | BLOCKER | PHASE-05-FIX-05A - Pool Base Price & Corridor Rule Source |
| GAP-05-05 | Supplier sponsorlu kupon aktif fixture olarak checkout'ta geciyor. | Ilk fazda kapali kararina aykiri. | BLOCKER | PHASE-05-FIX-05C - Coupon Sponsor Policy Guard |
| GAP-05-06 | Brand sponsorlu campaign aktif fixture olarak checkout'ta geciyor. | Marka payi ilk faz yok karariyla finansal risk olusturur. | BLOCKER | PHASE-05-FIX-05C - Coupon Sponsor Policy Guard |
| GAP-05-07 | Creator coupon minimum margin guard yok; platform destekli creator coupon admin oran guard yok. | Fenomen marji korunmadan discount uygulanabilir. | BLOCKER | PHASE-05-FIX-05C - Coupon Sponsor Policy Guard |
| GAP-05-08 | Kampanyali urunde creator coupon default-off enforcement yok. | Kampanya + creator coupon kombinasyonu karar disi calisabilir. | BLOCKER | PHASE-05-FIX-05C - Coupon Sponsor Policy Guard |
| GAP-05-09 | Checkout discount toplam seviyesinde; line allocation/sponsor financial impact yok. | Refund/settlement satir bazli duzeltme yapamaz. | BLOCKER | PHASE-05-FIX-05D - Coupon Line Allocation & Settlement Impact |
| GAP-05-10 | Refund line'larda coupon sponsor reversal alanlari ve hesaplamasi yok. | Iadede kupon maliyeti sponsor tipine gore geri alinmaz. | BLOCKER | PHASE-05-FIX-05E - Refund Coupon Sponsor Reversal |
| GAP-05-11 | Reward/point pending/spendable/redeemed state modeli yok. | Puan yasam dongusu ve iade reversal'i izlenemez. | BLOCKER | PHASE-05-FIX-05F - Reward Point Lifecycle Foundation |
| GAP-05-12 | Reward/point ledger/liability modeli yok. | Point'in nakit olmadigi finansal boundary seviyesinde enforce edilmez. | LIMITATION | PHASE-05-FIX-05F - Reward Point Lifecycle Foundation |
| GAP-05-13 | BFF checkout raw discountInputs kabul ediyor; policy kararini service yapiyor ama admin policy/rate modeli yok. | BFF truth uretmiyor, ancak protected admin rate/policy aksiyonu henuz yok. | LIMITATION | PHASE-05-FIX-05C - Coupon Sponsor Policy Guard |
| GAP-05-14 | `services/coupon`, `services/campaign`, `services/reward`, `services/points` owner servisleri yok. | Domain policy'ler checkout/customer-reward foundation icine gomulu kaliyor. | DEFER | PHASE-05-FIX-05C / 05F sonrasi servis ayrimi |

## 7. Kodlama Yapilmali mi?

```text
Bu paket sonucunda dogrudan kodlama oneriliyor mu?
- Evet

Evetse hangi alt paketler?
- PHASE-05-FIX-05A - Pool Base Price & Corridor Rule Source
- PHASE-05-FIX-05B - Creator Margin Settlement Foundation
- PHASE-05-FIX-05C - Coupon Sponsor Policy Guard
- PHASE-05-FIX-05D - Coupon Line Allocation & Settlement Impact
- PHASE-05-FIX-05E - Refund Coupon Sponsor Reversal
- PHASE-05-FIX-05F - Reward Point Lifecycle Foundation
```

## 8. Komut Kanitlari

| Komut | Sonuc | Not |
|---|---|---|
| `pnpm run typecheck` | FAIL / REPO | `apps/web` TypeScript project scope hatalari: `TS6059` ve `TS6307`; `packages/contracts/src/*`, `packages/ui/src/index.ts`, `packages/config/src/index.ts` `apps/web` `rootDir`/include disinda gorunuyor. |
| `pnpm run build` | FAIL / REPO | `apps/web` ayni `TS6059` / `TS6307` rootDir/include hatalariyla durdu. |
| `pnpm run smoke:settlement-calculation-foundation` | PASS | `[PASS] settlement-calculation-foundation - Settlement calculation foundation smoke passed.` |
| `pnpm run smoke:refund-financial-impact-foundation` | PASS | `[PASS] refund-financial-impact-foundation - Refund financial impact foundation smoke passed.` |
| `pnpm run smoke:payable-payout-boundary-foundation` | PASS | `[PASS] payable-payout-boundary-foundation - Payable / payout boundary foundation smoke passed.` |
| `pnpm run smoke:finance-ledger-foundation` | PASS | `[PASS] finance-ledger-foundation` |
| `pnpm run smoke:checkout-coupon-campaign-impact-foundation` | PASS | `[PASS] checkout-coupon-campaign-impact-foundation - service-level checkout coupon/campaign foundation applies valid sponsored discounts and blocks invalid, expired, ineligible, and usage-limited discounts before payment.` |

## 9. Kapanis Sonucu

PHASE-05-FIX-05 envanter ve gap review tamamlandi.

Mevcut kod, komisyon/fenomen marji/kupon sponsor/reward finansal kararlarini tam uygulamiyor. En kritik blocker'lar:
- creator selectedPrice koridor enforcement yok,
- creator margin settlement hesaplamasi yok,
- supplier ve brand sponsorlu discount fixture'lari ilk faz kararlarina aykiri aktif,
- coupon sponsor etkisi checkout toplam seviyesinde kaliyor ve settlement/refund satir bazli duzeltmeye inmiyor,
- reward/point pending/spendable/reversal lifecycle modeli yok.

Bu rapor sonraki kodlama paketleri icin karar envanteri ve kanitli gap listesi olarak kullanilmalidir.
