# PHASE-10C-02 — Cart Surface Foundation Report

## Görev özeti

`/cart` route gerçek browser-rendered cart intent surface haline getirildi. Surface mobile-first line item rendering, empty/error/degraded state, cart summary projection, coupon placeholder ve checkout handoff placeholder içeriyor. UI final price, stock, availability, checkout readiness, payment/order, coupon/campaign veya purchase eligibility truth üretmiyor.

## Başlangıç cart durumu

Başlangıçta `apps/web/app/cart/page.tsx` yalnız `RoutePlaceholder` render ediyordu. BFF tarafında `/cart` read endpoint vardı, ancak web tarafında cart adapter veya cart surface yoktu. Web API proxy auth/session header passthrough yapmıyordu.

## Cart projection adapter

`apps/web/src/lib/bff/cart.ts` eklendi.

- BFF `/cart` projection read yapıyor.
- Mevcut BFF response şekli olan `{ status, data }` sarmalını normalize ediyor.
- Transport state `available`, `empty`, `degraded`, `timeout`, `unavailable`, `error` olarak taşınıyor.
- UI için safe projection metinleri üretiyor; fiyat/stock/checkout kararı üretmiyor.
- Web persistence veya `services/*/src` import etmiyor.

Limitation: Auth/session foundation tamamlanmadığı için adapter guest cart read için sabit `session-id: web-cart-projection-session` header kullanıyor. Bu local cart engine değildir, fakat gerçek kullanıcıya özel session wiring sonraki paket işidir.

## Cart projection DTO

`packages/contracts/src/cart.ts` içine frontend-safe DTO eklendi:

- `CartSurfaceProjection`
- `CartLineItemProjection`
- `CartSummaryProjection`
- `CartCheckoutHandoffProjection`
- `CartContextProjection`
- boundary flags

DTO internal price source, reservation internals, payment state, order state, settlement state veya supplier internals taşımıyor.

## Empty cart state

Empty cart state gerçek surface olarak eklendi:

- açık empty mesajı
- search linki
- category linki
- storefront dönüş linki

Fake recommendation üretilmedi.

## Cart line item surface

`apps/web/src/components/cart-surface.tsx` içinde line item surface eklendi:

- media placeholder
- title
- storefront context projection
- quantity projection
- safe price text
- warning/degraded badge
- update/remove placeholder action

Mutation uygulanmadı; placeholder metin BFF command delegation sınırını belirtiyor.

## Quantity foundation

Quantity foundation mevcut quantity projection’ı gösteriyor. `+` ve `-` buttonları placeholder olarak var. Local stock max, availability veya mutation engine yok.

## Cart summary surface

Summary alanı:

- item count projection
- owner-provided subtotal projection var/yok metni
- coupon placeholder
- checkout handoff CTA

Subtotal/final total/discount hesaplanmıyor.

## Coupon placeholder

Coupon input disabled placeholder olarak render ediliyor. Metin açık: coupon validation ve campaign impact checkout/owner validation tarafından yapılır. Browser coupon validation veya discount calculation yapmıyor.

## Checkout handoff placeholder

Checkout CTA `/checkout` handoff linki olarak eklendi. CTA helper text checkout readiness truth üretmediğini ve price/stock/coupon/eligibility validation’ın owner tarafından yapılacağını söylüyor.

## Error/degraded/partial cart states

Şu durumlar işlendi:

- cart unavailable
- cart read timeout
- empty cart
- degraded cart projection
- partial/stale line warning projection
- stale price/stock warning projection metinleri projection warning olarak gösteriliyor
- degraded checkout handoff

UI stale/availability kararını kendisi vermiyor; projection warning gösteriyor.

## PDP → cart navigation preparation

PDP action surface içine güvenli `View cart` placeholder navigation eklendi. Add-to-cart mutation eklenmedi.

## Mobile-first review

Cart surface mobile-first grid ile kuruldu:

- line items mobile’da stacked/compact
- quantity controls thumb-friendly
- summary mobile’da bottom sticky
- desktop’ta summary right rail sticky
- coupon input mobile-safe
- warning copy compact

## Accessibility minimum review

Eklenen surface:

- semantic `main`, `section`, `article`, `aside`
- line item `role="list"` / `role="listitem"`
- visible headings
- button/link labels
- warning `role="status"` ve aria label
- coupon label
- mevcut `focus-visible` stillerinden faydalanıyor

## Boundary review

Taramalar:

- `rg "@hx/persistence" apps/web` → no matches
- `rg "services/.*/src|../../../services|../../services" apps/web` → no matches
- `rg "lineTotal|unitPrice|subTotal|availableQuantity|discount|campaign|urgency|few left|out of stock|in stock" apps/web/src apps/web/app`

Sonuç:

- `apps/web/src/lib/bff/cart.ts` içinde `subTotal`, `lineTotal`, `unitPrice` sadece projection var/yok kontrolü için kullanılıyor; arithmetic yapılmıyor.
- `discountTruth` ve `campaignTruth` sadece false boundary flag olarak var.
- Fake urgency, fake stock, fake availability veya fake checkout-ready metni yok.

## Build/typecheck/playwright sonuçları

- `pnpm.cmd run typecheck` → PASS
- `pnpm.cmd run build` → PASS
- `pnpm.cmd --filter @hx/web run playwright` → PASS, 12/12

Not: Playwright dev server stderr’inde `/api/bff/[...path]` için statik path generation uyarısı görüldü, fakat test command exit code 0 ve smoke sonucu PASS. Bu mevcut Next dev server artifact davranışı olarak izlenmeli.

## Açık limitation’lar

- Real user/session-specific cart read wiring henüz yok; adapter guest projection session header kullanıyor.
- Remove/update quantity mutation bu pakette yapılmadı.
- Cart media gerçek projection’dan gelmiyor; media placeholder gösteriliyor.
- Checkout CTA readiness üretmiyor; sadece validation handoff placeholder.

## Riskler

- Auth/session wiring geldiğinde cart adapter session header stratejisi revize edilmeli.
- BFF cart response shape `{ status, data }` sarmalı ileride sadeleşirse adapter normalize katmanı korunmalı veya contract netleştirilmeli.
- Dev server stderr uyarısı tekrar ederse Next API route build/dev config ayrıca incelenmeli.

## Sonraki önerilen PHASE-10 paketi

PHASE-10C-03 için öneri:

- BFF-delegated add/update/remove cart command preparation
- real session-aware cart read wiring
- mutation result transport/degraded states
- no local cart engine boundary smoke

## Nihai karar önerisi

PASS WITH LIMITATION
