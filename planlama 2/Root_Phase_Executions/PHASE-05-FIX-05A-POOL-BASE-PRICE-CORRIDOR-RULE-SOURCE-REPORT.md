# PHASE-05-FIX-05A - Pool Base Price & Corridor Rule Source Report

Date: 2026-05-09

## 1. Amac

Bu fix paketinin amaci, fenomen marji ve sonraki settlement/kupon hesaplamalari icin gerekli havuz taban fiyati, fiyat koridoru ve creator selectedPrice enforcement foundation'ini kurmaktir.

Bu paket creator margin settlement hesaplamasi, kupon/kampanya sponsor etkisi, payout, ledger, payment, order veya refund owner state davranisi degistirmez.

## 2. Baslangic Durumu

PHASE-05-FIX-05:
- PARTIAL

Kapanacak gap'ler:
- GAP-05-01
- GAP-05-02
- GAP-05-04

Baslangic inceleme sonucu:

| Soru | Durum | Kanit |
| --- | --- | --- |
| Supplier base price modeli var mi? | Kismen | Supplier variant `price` vardi, explicit internal snapshot yoktu. |
| Platform/category margin rule source var mi? | Hayir | Admin/category margin policy persistence bulunmadi. |
| Pool base price modeli var mi? | Hayir | `poolBasePrice` sadece pricing simulation icinde geciyordu. |
| 2. havuz taban fiyati temsil ediliyor mu? | Hayir | Commercial pool product uzerinde base price snapshot yoktu. |
| Price corridor contract var mi? | Kismen | `minPrice/suggestedPrice/maxPrice` vardi, currency/ruleSource/launch eksikti. |
| Price corridor service tarafindan uretiliyor mu? | Kismen | Pricing deterministic simulation uretiyordu. |
| Creator selectedPrice koridor icinde enforce ediliyor mu? | Hayir | Pool sadece `selectedPrice > 0` kontrol ediyordu. |
| Launch/recommended price enforcement var mi? | Hayir | Launch flag veya recommended zorunlulugu yoktu. |
| Fenomen tedarikci baz fiyatini gorebiliyor mu? | Risk | Creator-facing commercial pool list internal product shape donduruyordu. |
| BFF/UI fiyat truth uretiyor mu? | Hayir | BFF pool service'e delegate ediyor; catalog read projection `priceTruth: false`. |

## 3. Esas Alinan Kararlar

- Tedarikci baz fiyati ayridir.
- Platform kategori kari policy/rule source uzerinden gelir.
- Havuz taban fiyati = tedarikci baz fiyati + platform kar etkisi.
- Fenomen yalniz koridor icinde fiyat secer.
- Lansman doneminde onerilen fiyat zorunlu olabilir.
- Fenomen tedarikci baz fiyatini gormez.
- Fenomen kazanci sonraki settlement paketinde `selectedSalePrice - poolBasePrice` olarak hesaplanacaktir.
- Admin/category margin persistence olmadigi icin bu pakette yeni oran uydurulmadi.

## 4. Degistirilen Dosyalar

| Dosya | Degisiklik | Gerekce | Etki |
| --- | --- | --- | --- |
| `packages/contracts/src/pricing.ts` | `SupplierBasePriceSnapshot`, `PoolBasePriceSnapshot`, `CreatorVisiblePoolBasePriceSnapshot`, guclendirilmis `PriceCorridor`, `CreatorPriceSelectionInput/Result` eklendi. | Minimum fiyat kaynagi ve enforcement contract'i. | Pricing/pool truth modeli acik hale geldi. |
| `packages/contracts/src/pool.ts` | Commercial pool'a internal price snapshot alanlari, creator-visible redacted type, creator price error code'lari ve accepted price selection snapshot'i eklendi. | Supplier base price leak'i engellemek ve service error'larini deterministik yapmak. | Creator-facing response internal supplier base price tasimiyor. |
| `services/pool/src/pool.ts` | Commercialize sirasinda supplier base price, pool base price ve corridor snapshot uretiliyor; bind pricing bunlari istiyor; creator list redakte ediliyor; `selectedPrice` corridor/launch rule ile enforce ediliyor. | GAP-05-01 ve GAP-05-02 kapatmak. | Service-level validation kuruldu; BFF fiyat truth uretmiyor. |
| `services/pricing/src/pricing.ts` | Sabit `platformMarginRate = 0.20` kaldirildi; fallback collapsed corridor ve explicit ruleSource/warnings donduruyor. | GAP-05-04 kapatmak. | Simulation margin production rule gibi kullanilmiyor. |
| `services/pool/package.json` | Package export `dist/src/index.js` ciktisina hizalandi. | Smoke runtime'in guncel pool build ciktisini yuklemesi. | Targeted smoke dogru implementation'i kullaniyor. |
| `tests/smoke/suites/pool-base-price-corridor-foundation.ts` | Targeted smoke eklendi; suite adi `pool-price-corridor-foundation`. | Acceptance senaryolarini kanitlamak. | Min/max/launch/redaction coverage var. |
| `tests/smoke/run-smoke.ts` | `pool-price-corridor-foundation` suite key'i eklendi. | Prompttaki smoke adini desteklemek. | `pnpm run smoke:pool-price-corridor-foundation` calisir. |
| `package.json` | `smoke:pool-price-corridor-foundation` script'i eklendi. | Prompttaki script gereksinimi. | Targeted smoke root script ile calisir. |
| `PHASE-05-FIX-05A-POOL-BASE-PRICE-CORRIDOR-RULE-SOURCE-REPORT.md` | Bu rapor olusturuldu/guncellendi. | Degisiklik ve kanit kaydi. | Closure kaydi var. |

## 5. Fiyat Modeli

Supplier base price modeli var mi?
- Evet. `SupplierBasePriceSnapshot` internal-only olarak eklendi.

Pool base price hesaplaniyor mu?
- Evet. Foundation hesap: supplier base price + platform margin amount. Gercek category margin policy olmadigi icin `platformMarginAmount = 0`.

Platform/category margin rule source acik mi?
- Foundation default. `FOUNDATION_CATEGORY_MARGIN_POLICY_MISSING` explicit rule source olarak kullaniliyor.

Price corridor uretiliyor mu?
- Evet. Pool commercialize path'i `PriceCorridor` snapshot uretiyor. Pricing fallback de explicit collapsed corridor donduruyor.

Min/recommended/max fiyat var mi?
- Evet. Contract'ta `minPrice`, `suggestedPrice`, `recommendedPrice`, `maxPrice`, `currency`, `ruleSource`, `launchMode`, `launchRequiresRecommendedPrice` var.

## 6. Creator SelectedPrice Enforcement

selectedPrice sadece >0 kontrolunden cikarildi mi?
- Evet.

selectedPrice min altinda reddediliyor mu?
- Evet. `POOL_CREATOR_PRICE_OUT_OF_CORRIDOR`, `reasonCode: SELECTED_PRICE_BELOW_MIN`.

selectedPrice max ustunde reddediliyor mu?
- Evet. `POOL_CREATOR_PRICE_OUT_OF_CORRIDOR`, `reasonCode: SELECTED_PRICE_ABOVE_MAX`.

Launch recommended price zorunlulugu var mi?
- Evet. `launchRequiresRecommendedPrice = true` ise selected price sadece `recommendedPrice` olabilir.

Fenomen tedarikci baz fiyatini goruyor mu?
- Hayir. Creator-facing list `supplierBasePriceSnapshot` ve `supplierBasePriceAmount` alanlarini redakte ediyor.

## 7. Boundary

BFF fiyat truth uretiyor mu?
- Hayir. `apps/bff/src/server/pool.ts` pool service'e delegate ediyor; boundary scan'de BFF pricing truth uretimi bulunmadi.

UI fiyat truth uretiyor mu?
- Hayir. Boundary scan'de web/panel pricing truth uretimi bulunmadi.

Supplier base price public response'a siziyor mu?
- Hayir. Creator-visible type ve service redaction eklendi; boundary scan'de apps web/panel/bff tarafinda supplier base price leak bulunmadi.

Admin/category margin persistence production-ready mi?
- Hayir / Foundation default. Category margin admin policy persistence sonraki pakete kaldi.

## 8. Boundary Regression Scan

| Tarama | Sonuc | Not |
| --- | --- | --- |
| Supplier base price leak | PASS | `rg 'supplierBasePrice\|supplier base\|supplierCost\|costPrice' apps/web apps/panel apps/bff/src/server -g '*.ts' -g '*.tsx'` eslesme bulmadi. |
| BFF price truth | PASS | `rg 'minPrice\|maxPrice\|recommendedPrice\|suggestedPrice\|platformMarginRate\|poolBasePrice\|selectedPrice' apps/bff/src/server -g '*.ts'` eslesme bulmadi. |
| UI price truth | PASS | `rg 'platformMarginRate\|poolBasePrice\|minPrice\|maxPrice\|recommendedPrice\|suggestedPrice\|selectedPrice' apps/web apps/panel -g '*.ts' -g '*.tsx'` eslesme bulmadi. |
| Hardcoded platform margin | PASS | `rg 'platformMarginRate\\s*=\\s*0\\.20\|0\\.20\|20%' services/pricing services/pool packages/contracts -g '*.ts'` eslesme bulmadi. |

## 9. Smoke/Test Kaniti

| Senaryo | Sonuc | Kanit |
| --- | --- | --- |
| Pool base price calculated | PASS | `poolBasePriceSnapshot.amount = 100`, `platformMarginAmount = 0`. |
| Corridor generated | PASS | Smoke corridor `min=90`, `recommended=100`, `max=120`; foundation service default collapsed corridor da uretiyor. |
| selectedPrice inside corridor accepted | PASS | `selectedPrice = 100` accepted. |
| selectedPrice below min rejected | PASS | `selectedPrice = 89` rejected with `SELECTED_PRICE_BELOW_MIN`. |
| selectedPrice above max rejected | PASS | `selectedPrice = 121` rejected with `SELECTED_PRICE_ABOVE_MAX`. |
| launch requires recommended price | PASS | `selectedPrice = 110` rejected with `LAUNCH_REQUIRES_RECOMMENDED_PRICE`. |
| supplier base price not leaked | PASS | Creator-visible response'da `supplierBasePriceSnapshot` ve `supplierBasePriceAmount` yok. |
| BFF/UI truth uretmez | PASS | Boundary scan PASS; enforcement service-level. |
| hardcoded simulation margin yok | PASS | Hardcoded margin scan PASS; pricing fallback explicit rule source kullanir. |

## 10. Komut Sonuclari

| Komut | Sonuc | Not |
| --- | --- | --- |
| `pnpm run typecheck` | FAIL-REPO | `apps/web` once `TS6059/TS6307` ile fail ediyor; workspace packages source imports local `rootDir` disinda. |
| `pnpm run build` | FAIL-REPO | `apps/web` once `TS6059/TS6307` ile fail ediyor; ayni repo config sorunu. |
| `pnpm run smoke:pool-price-corridor-foundation` | PASS | Targeted smoke passed. |
| `pnpm run smoke:settlement-calculation-foundation` | PASS | Settlement smoke passed. |
| `pnpm run smoke:refund-financial-impact-foundation` | PASS | Refund financial impact smoke passed. |
| `pnpm run smoke:payable-payout-boundary-foundation` | PASS | Payable/payout boundary smoke passed. |
| `pnpm run smoke:finance-ledger-foundation` | PASS | Finance ledger smoke passed. |
| `pnpm --filter @hx/contracts typecheck` | PASS | Contract types clean. |
| `pnpm --filter @hx/contracts build` | PASS | Contract build clean. |
| `pnpm --filter @hx/pricing typecheck` | FAIL-REPO | `@hx/contracts` source files are outside `services/pricing` rootDir. |
| `pnpm --filter @hx/pool build` | FAIL-REPO | `@hx/contracts` source files are outside `services/pool` rootDir. |

## 11. Kalan Acik Noktalar

| Kod | Acik Nokta | Etki | Hedef Faz / Fix |
| --- | --- | --- | --- |
| OPEN-05A-01 | Admin/category margin policy persistence yok. | Foundation pool base price supplier base price ile ayni kalir; yeni oran uydurulmadi. | Category margin policy package. |
| OPEN-05A-02 | Root/service TypeScript project config workspace source imports icin `rootDir/include` uyumsuz. | Root build/typecheck FAIL-REPO; contract ve smoke kanitlari geciyor. | Tooling/build recovery package. |
| OPEN-05A-03 | Creator margin settlement hesaplamasi yok. | Fenomen kazanci henuz hesaplanmaz. | PHASE-05-FIX-05B. |

## 12. PHASE-05'e Etki

GAP-05-01:
- CLOSED WITH LIMITATION. Supplier base price, pool base price ve corridor snapshot var; admin/category margin persistence sonraki pakete kaldi.

GAP-05-02:
- CLOSED. Creator selectedPrice corridor ve launch recommended rule service-level enforce ediliyor.

GAP-05-04:
- CLOSED. Sabit `platformMarginRate = 0.20` production rule gibi kalmadi; hardcoded margin scan PASS.

## 13. Nihai Karar

PHASE-05-FIX-05A Karari:
- PASS WITH LIMITATION

Karar gerekcesi:
- Pool base price source var.
- Corridor enforcement var.
- Launch recommended enforcement var.
- Supplier base price leak yok.
- Targeted smoke PASS.
- Boundary regression scan PASS.
- Admin/category margin persistence production-ready degil ve bilincli olarak sonraki pakete devredildi.
- Root build/typecheck FAIL-REPO mevcut workspace TypeScript config sorunu nedeniyle gizlenmedi.

## 14. Sonraki Adim

PHASE-05-FIX-05B - Creator Margin Settlement Foundation paketine gecilebilir.

Creator margin settlement'a gecmeden once category margin persistence zorunlu degil; ancak settlement hesaplari pool base price snapshot'ini internal/settlement-readable kaynak olarak kullanmalidir.
