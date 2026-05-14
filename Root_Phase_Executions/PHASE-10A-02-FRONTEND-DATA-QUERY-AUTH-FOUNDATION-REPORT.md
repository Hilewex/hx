# PHASE-10A-02 Frontend Data / Query / Auth Foundation Stabilization Report

## Görev özeti

Frontend data foundation stabilize edildi. TanStack Query provider wiring, typed BFF read adapter layer, session/auth projection provider, route-level error/degraded wiring başlangıcı ve Playwright browser smoke altyapısı eklendi.

Business/domain logic, backend mutation davranışı, permission/eligibility/final price/stock/payment/order truth üretilmedi.

## Başlangıç durumu

- `apps/web` gerçek Next.js App Router shell yapısına sahipti.
- `apps/web/src/lib/bff-client.ts` generic BFF transport olarak mevcuttu.
- Query/state provider yoktu.
- Typed BFF read adapter katmanı yoktu.
- Session/auth projection provider yoktu.
- Browser smoke altyapısı yoktu.
- Error/degraded bileşenleri vardı ancak data/query wiring başlangıcı yoktu.

## Query foundation

- `apps/web/src/lib/query-client.ts` eklendi.
- `apps/web/src/providers/query-provider.tsx` eklendi.
- `apps/web/src/providers/app-providers.tsx` ile root layout'a bağlandı.
- Safe defaults:
  - query `staleTime`: 30s
  - query `gcTime`: 5m
  - client error/status aware retry: 4xx BFF read errors retry edilmez, diğerleri 1 retry
  - mutations retry kapalı
  - window focus refetch kapalı

## Typed BFF adapter durumu

Generic transport üstüne read-only adapter foundation eklendi:

- `apps/web/src/lib/bff/errors.ts`
- `apps/web/src/lib/bff/read.ts`
- `apps/web/src/lib/bff/home.ts`
- `apps/web/src/lib/bff/catalog.ts`
- `apps/web/src/lib/bff/storefront.ts`
- `apps/web/src/lib/bff/session.ts`

Adapterlar typed projection response döndürür ve BFF failures `BffReadError` üzerinden normalize edilir.

## DTO/projection safety durumu

- Catalog/storefront/auth için `@hx/contracts` projection DTO tipleri kullanıldı.
- Home için minimal frontend-safe projection type tanımlandı.
- Backend entity, persistence shape veya internal aggregate expose edilmedi.
- Adapterlar read/projection katmanında kaldı.

## Session/auth projection foundation

- `apps/web/src/providers/session-provider.tsx` eklendi.
- Session projection union:
  - `unknown`
  - `guest`
  - `authenticated`
- `apps/web/src/components/session-status.tsx` eklendi.
- Header session projection durumunu gösterir ve read refetch yapabilir.
- Local role truth, permission truth veya eligibility decision üretilmedi.

## Error/degraded wiring

- `HomeDataReadiness` ile query failure, degraded response ve retry action route yüzeyine bağlandı.
- `DegradedState` action desteği aldı.
- Existing `app/error.tsx` render retry state ile uyumlu kaldı.
- Retry sadece read refetch yapar; business mutation değildir.

## Loading/skeleton durumu

- Existing `app/loading.tsx` ve `LoadingState` query loading sırasında kullanılmaya başlandı.
- Home read wiring loading state gösterir.
- Fake commerce data, price, stock, cart/order/payment truth gösterilmedi.

## Browser smoke foundation

- `apps/web/playwright.config.ts` eklendi.
- `apps/web/tests/smoke/render.spec.ts` eklendi.
- Smoke kapsamı:
  - homepage render
  - primary route navigation
  - not-found render
- `apps/web/package.json` içine `playwright` script'i eklendi.

## Responsive/mobile review

- Header mobile stacking iyileştirildi.
- Touch target yüksekliği mobile için 40px yapıldı.
- Route container mevcut responsive width yapısı korundu.
- Kart stacking mevcut `grid two/three` mobile-first davranışıyla uyumlu.
- Full redesign yapılmadı.

## Boundary review

Taramalar:

- `rg "services" apps/web/app apps/web/src -n`: sonuç yok.
- `rg "persistence" apps/web/app apps/web/src -n`: sonuç yok.
- Runtime web surface için `finalPrice`, `priceTruth: true`, `stockTruth: true`, `orderFinal`, `paymentFinal`, `create-from-payment`, `simulate-success` taraması: sonuç yok.

Not: `apps/web/src/bootstrap/*` altında eski simulate dosyaları mevcut; bu faz runtime App Router surface ve yeni provider/adapter foundation üzerinde değişiklik yaptı. Yeni runtime wiring bu bootstrap dosyalarını import etmiyor.

## Typecheck/build/test sonuçları

- PASS: `pnpm.cmd --filter @hx/web run typecheck`
- PASS: `pnpm.cmd --filter @hx/web run build`
- PASS: `pnpm.cmd run typecheck`
- PASS: `pnpm.cmd run build`
- N/A: `pnpm.cmd --filter @hx/web run test` script'i yok.
- PASS: `pnpm.cmd --filter @hx/web run playwright`
  - İlk çalıştırmada Playwright browser binary eksikti.
  - `pnpm.cmd --filter @hx/web exec playwright install chromium` ile Chromium indirildi.
  - Sonrasında 3/3 smoke geçti.

## Açık limitation'lar

- BFF read endpointleri foundation path olarak bağlandı; gerçek endpoint availability bu fazda doğrulanmadı.
- Home projection unavailable/failure durumunda UI domain fallback üretmez, degraded/error state gösterir.
- Full auth implementation yok; sadece session projection reader/provider foundation var.
- Checkout/payment/order E2E kapsam dışı bırakıldı.

## Riskler

- BFF endpoint path contract'ları sonraki fazda backend BFF route reality ile hizalanmalı.
- Session projection shape `@hx/contracts` `AuthSession` üstünden güvenli okunuyor; backend farklı response dönerse adapter mapping güncellenmeli.
- Playwright smoke şu an render/navigation seviyesinde; data contract smoke kapsamı sonraki faza bırakıldı.

## Sonraki önerilen PHASE-10 paketi

PHASE-10A-03 için öneri:

- BFF read endpoint reality alignment
- Contract-backed runtime data smoke
- Route bazlı query key standardizasyonu
- Home/catalog/storefront projection fixture-free happy/degraded browser smoke
- Session projection BFF route contract validation

## Nihai karar önerisi

PASS
