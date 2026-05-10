# PHASE-02-FIX-03A — Build / Typecheck / Smoke Recovery Report

## 1. Amaç

Bu fix paketinin amacı, PHASE-02-FIX-03 sonrasında açık kalan build, typecheck ve smoke doğrulama problemlerini çözmek ve variant/price/stock conflict davranışlarının doğrulanabilir olduğunu kanıtlamaktır.

## 2. Başlangıç Durumu

PHASE-02-FIX-03 kararı:
- PARTIAL / NOT ACCEPTED AS PASS

Açık problemler:
- typecheck PASS kanıtı yok
- build PASS kanıtı yok
- smoke runner `dotenv/config` veya workspace resolution hatası veriyor
- variant/price/stock değişiklikleri otomatik test ile doğrulanmamış

## 3. İlk Komut Sonuçları

| Komut | İlk Sonuç | Kök Neden |
|---|---|---|
| pnpm run typecheck | FAIL | `packages/shared-kernel` `@types/node` type library'sini resolve edemedi. Kök `package.json`/lock içinde dependency vardı fakat workspace `node_modules` linkleri eksikti. |
| pnpm run build | FAIL | `packages/shared-kernel` aynı `@types/node` resolution hatasıyla kırıldı. |
| pnpm run smoke:core-commerce | FAIL | `tests/smoke/run-smoke.ts` içindeki `dotenv/config` resolve edilemedi; kök dependency linkleri eksikti. |
| pnpm run smoke:payment-readiness-guard | FAIL | `dotenv/config` resolve edilemedi; runner suite'e başlamadan kırıldı. |

Ek ilk kontrol:
- `pnpm run smoke:commerce`: FAIL, `dotenv/config` resolve edilemedi.
- Root `tsconfig.json`: yok.
- `package.json` ve `pnpm-lock.yaml`: `@types/node`, `tsx`, `dotenv` kayıtları vardı.
- `node_modules/@types/node` ve `node_modules/dotenv`: yoktu.

## 4. Değiştirilen Dosyalar

| Dosya | Değişiklik | Gerekçe | Etki |
|---|---|---|---|
| `services/checkout/src/checkout.ts` | `lineValidation.variantId` başlangıçta cart line değerinden set edildi; catalog doğrulamasından sonra `targetVariantId` ile güncellendi. | `targetVariantId` değişkeni declaration öncesi kullanılıyordu. | `@hx/checkout` typecheck/build PASS oldu; validation davranışı korunarak derlenebilir hale geldi. |
| `services/search/src/config.ts` | `resolveSearchConfig` opsiyonel env gelmediğinde `process.env` kullanacak şekilde düzeltildi. | `parseConfig` zorunlu env record bekliyordu; global build/typecheck `undefined` argümanında kırılıyordu. | `@hx/search` typecheck/build PASS oldu. |
| `tests/smoke/suites/checkout-variant-price-stock-validation.ts` | Service-level targeted smoke eklendi. | PHASE-02-FIX-03 validation kontratlarının BFF/Postgres gerektirmeden doğrulanması gerekiyordu. | Valid checkout, invalid variant, price mismatch, stock mismatch ve blocked checkout sonrası payment initiation guard doğrulandı. |
| `tests/smoke/run-smoke.ts` | Yeni smoke suite registry'ye eklendi. | Runner'ın targeted suite'i çalıştırabilmesi gerekiyordu. | `pnpm run smoke:checkout-variant-price-stock-validation` çalışır hale geldi. |
| `package.json` | `smoke:checkout-variant-price-stock-validation` script'i eklendi. | Targeted smoke komutu root script üzerinden çalıştırılmalıydı. | Targeted validation smoke tek komutla çalışıyor. |

Not:
- `pnpm install` çalıştırıldı. Manifest ve lock içinde kayıtlı dependency'lerin workspace `node_modules` linkleri restore edildi; `dotenv/config` ve `@types/node` resolution hatası bu şekilde çözüldü.

## 5. Build / Typecheck Recovery

### Kök neden

İlk kök neden, workspace dependency linklerinin eksik olmasıydı. Root manifest/lock `@types/node`, `dotenv` ve `tsx` içeriyordu fakat `node_modules/@types/node` ve `node_modules/dotenv` yoktu. Bu nedenle `packages/shared-kernel` type library resolution aşamasında kırılıyor, smoke runner da `dotenv/config` importunu bulamıyordu.

Dependency linkleri restore edildikten sonra iki gerçek TypeScript hatası ortaya çıktı:
- `services/checkout/src/checkout.ts`: `targetVariantId` block-scoped variable declaration öncesi kullanılıyordu.
- `services/search/src/config.ts`: opsiyonel `env` parametresi zorunlu `parseConfig` girdisine doğrudan veriliyordu.

### Yapılan düzeltme

- `pnpm install` ile workspace dependency linkleri restore edildi.
- Checkout validation line nesnesi declaration-safe hale getirildi.
- Search config default env davranışı `env ?? process.env` olarak düzeltildi.
- Build hatasını gizleyen tsconfig gevşetmesi, `any` bypass veya test silme yapılmadı.

### Son durum

```text
pnpm run typecheck:
- PASS

pnpm run build:
- PASS
```

## 6. Smoke / Test Recovery

### Kök neden

Smoke runner'ın ilk hatası `dotenv/config` dependency resolution idi. Bu hata workspace dependency linkleri restore edilince çözüldü.

BFF tabanlı smoke'lar daha sonra `http://localhost:3001` fetch aşamasına kadar ilerledi ve local BFF çalışmadığı için başarısız oldu. Bu dependency resolution değil, runtime environment/BFF availability blokajıdır.

### Yapılan düzeltme

- `dotenv/config` resolution için eksik workspace install/link durumu düzeltildi.
- BFF/Postgres gerektirmeyen service-level targeted smoke eklendi:
  - `pnpm run smoke:checkout-variant-price-stock-validation`

### Son durum

```text
pnpm run smoke:payment-readiness-guard:
- PASS

pnpm run smoke:checkout-variant-price-stock-validation:
- PASS

pnpm run smoke:core-commerce:
- BLOCKED / BFF not running

pnpm run smoke:commerce:
- BLOCKED / BFF not running

pnpm run smoke:catalog:
- BLOCKED / BFF not running

pnpm run smoke:catalog-read:
- BLOCKED / BFF not running
```

## 7. PHASE-02-FIX-03 Davranış Doğrulaması

Targeted smoke:
- `checkout-variant-price-stock-validation`

Doğrulanan senaryolar:
- Valid product + valid variant + valid price + valid stock -> `REVIEW_READY` / `VALID`
- Invalid `variantId` -> checkout `BLOCKED`, line error `VARIANT_NOT_FOUND`
- Price changed snapshot -> checkout `BLOCKED`, validation `PRICE_MISMATCH`
- Stock insufficient -> checkout `BLOCKED`, validation `STOCK_MISMATCH`
- Validation fail sonrası payment initiation -> `FAILED`, `CHECKOUT_NOT_READY`, provider envelope yok

Sınırlama:
- "Variant required ama `variantId` yok" senaryosu mevcut catalog foundation fixture ile doğrudan üretilemedi. Mevcut `createFoundationProduct` helper'ı variant varsa `defaultVariantId` değerini otomatik dolduruyor. Bu nedenle yeni business fixture genişletmesi yapılmadan bu senaryo service-level smoke içinde ayrı bir blok olarak doğrulanmadı.

## 8. Boundary Regression Kontrolü

Taramalar:

```text
rg '../../../../services|services/.*/src|@hx/.*/src' apps/bff apps/web apps/panel -g '*.ts' -g '*.tsx'
rg 'get.*Repository|@hx/persistence|\binsert\b|\bupdate\b|\bdelete\b' apps/bff -g '*.ts' -g '*.tsx'
rg 'PRICE_MISMATCH|STOCK_MISMATCH|VARIANT_NOT_FOUND|CHECKOUT_NOT_READY|PRODUCT_NOT_SELLABLE' services/checkout services/payment tests/smoke -g '*.ts'
```

Sonuç:
- Yeni BFF internal `src` import bulunmadı.
- BFF direct repository/persistence kullanımı bulunmadı.
- Eşleşen `update` ifadeleri route adı veya hash update çağrısıdır; repository mutation değildir.
- Checkout validation deterministic error üretimi ve payment readiness guard kodda ve smoke'da doğrulandı.

## 9. Final Komut Sonuçları

| Komut | Sonuç | Not |
|---|---|---|
| `pnpm run typecheck` | PASS | Tüm recursive workspace typecheck tamamlandı. |
| `pnpm run build` | PASS | Tüm recursive workspace build tamamlandı. |
| `pnpm run smoke:payment-readiness-guard` | PASS | Payment initiation yalnızca `REVIEW_READY` / `VALID` checkout için ilerliyor. |
| `pnpm run smoke:checkout-variant-price-stock-validation` | PASS | Variant/price/stock validation ve blocked checkout payment guard doğrulandı. |
| `pnpm run smoke:core-commerce` | BLOCKED | Runner çalışıyor; local BFF `http://localhost:3001` fetch failed. |
| `pnpm run smoke:commerce` | BLOCKED | Runner çalışıyor; local BFF fetch failed. |
| `pnpm run smoke:catalog` | BLOCKED | Runner çalışıyor; local BFF fetch failed. |
| `pnpm run smoke:catalog-read` | BLOCKED | Runner çalışıyor; local BFF fetch failed. |

## 10. Sonuç

**PASS WITH ENVIRONMENT-LIMITED SMOKE**

Build ve typecheck recovery tamamlandı:
- `pnpm run typecheck` PASS
- `pnpm run build` PASS

PHASE-02-FIX-03 validation kontratları service-level targeted smoke ile doğrulandı:
- valid checkout PASS
- invalid variant BLOCKED
- price mismatch BLOCKED
- stock mismatch BLOCKED
- blocked checkout payment initiation duruyor

BFF tabanlı smoke'lar dependency resolution hatasını aşmıştır; kalan başarısızlık local BFF runtime availability nedeniyle BLOCKED olarak sınıflandırılmıştır.
