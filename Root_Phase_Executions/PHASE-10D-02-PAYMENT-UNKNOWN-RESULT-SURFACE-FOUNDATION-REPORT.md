# PHASE-10D-02 — Payment / Unknown-result Surface Foundation Report

## Görev özeti

`/payment` route placeholder olmaktan çıkarıldı ve browser-rendered, mobile-first, projection-safe payment surface olarak kuruldu. Surface payment initiation placeholder, pending, failed, unknown-result, support-required, provider-degraded, unavailable, timeout/error ve no-context durumlarını ayrı metin/hiyerarşiyle gösterir.

## Başlangıç payment durumu

Başlangıçta `apps/web/app/payment/page.tsx` yalnızca `RoutePlaceholder` render ediyordu. Payment projection adapter, frontend-safe payment surface DTO veya payment state smoke coverage yoktu.

## Payment projection adapter

`apps/web/src/lib/bff/payment.ts` eklendi.

- `/payment/projection` read denemesi yapar.
- `checkoutId`, `paymentId`, `paymentAttemptId` referanslarını query üzerinden taşır.
- BFF endpoint/data yoksa owner truth üretmeden safe placeholder projection döndürür.
- Transport status, warnings ve retryable bilgisi normalize edilir.

Limitation: Gerçek BFF payment read/projection endpoint bu fazda mevcut değil; adapter safe placeholder projection ile degrade olur.

## Payment surface DTO

`packages/contracts/src/payment.ts` içine `PaymentSurfaceProjection` ve ilgili frontend-safe projection DTO alanları eklendi:

- payment context projection
- checkout reference projection
- payment attempt reference projection
- provider redirect placeholder
- state/retry/support guidance
- return navigation
- boundary flags

Taşınmayanlar: provider secret, raw provider payload, settlement/refund/payout owner state, internal risk/finance state, order mutation state.

## Payment initiation surface

`apps/web/src/components/payment-surface.tsx` eklendi. Initiation state:

- checkout/payment attempt reference gösterir.
- amount/currency için yalnızca owner-safe display text beklediğini belirtir.
- provider redirect placeholder gösterir.
- gerçek provider call yapmaz.

## Pending payment state

Pending state ayrı başlık/metinle gösterilir:

- payment result final değildir.
- bekleme veya support ile takip önerilir.
- success/failure/order-created mesajı gösterilmez.

## Failed payment state

Failed state projection’dan gelen failed durum gibi gösterilir:

- retry yalnızca fresh owner-guided checkout flow ile önerilir.
- return checkout ve support CTA görünür.
- UI kendi failure kararını üretmez.

## Unknown-result state

Unknown-result state ayrı ve uyarı tonunda gösterilir:

- payment result kesin değildir.
- tekrar ödeme öncesi status kontrolü gerekir.
- duplicate submit riski açıkça belirtilir.
- success, failure veya order-created truth üretilmez.

## Duplicate submit prevention UI

Initiation placeholder CTA hızlı tekrar tıklamaya karşı UI seviyesinde disabled olur ve “in progress” durumunu gösterir. Bu sadece UX guard’dır; idempotency veya duplicate payment engine değildir.

## Support guidance

Support paneli eklendi:

- support linki
- payment reference placeholder
- checkout reference placeholder
- retry öncesi kontrol uyarısı

Gerçek ticket creation yoktur.

## Return navigation

Güvenli navigation eklendi:

- Return to checkout
- Go to orders, order-created truth üretmeden
- Contact support
- Continue browsing

## Empty/error/degraded payment states

Handled states:

- no payment context
- payment projection unavailable
- timeout
- provider degraded
- pending
- unknown-result
- failed
- support required

## Mobile-first review

Surface single-column mobile akışla çalışır. İlk Playwright run mobilde sticky support/action panelinin provider CTA üzerine bindiğini yakaladı; mobilde action panel normal akışa alındı, desktop’ta sticky kaldı. Final Playwright PASS.

## Accessibility minimum review

Kontroller:

- status band `role="status"` ve `aria-live="polite"`
- warning metinleri non-color-only
- açık heading hiyerarşisi
- disabled button labels
- focus-visible global stilleri korunuyor

## Boundary review

Kontrol sonucu:

- fake payment success yok
- fake payment failure yok
- fake order created yok
- local amount/currency calculation yok
- local checkout readiness kararı yok
- local provider finality yok
- duplicate payment engine yok
- raw provider payload exposure yok
- `apps/web` içinde persistence import yok
- `apps/web` içinde `services/*/src` import yok

## Build/typecheck/playwright sonuçları

- `pnpm.cmd run typecheck`: PASS
- `pnpm.cmd run build`: PASS
- `pnpm.cmd --filter @hx/web run playwright`: PASS, 20 passed

Not: Final Playwright run sonunda Next webserver logunda `/api/bff/[...path]` static path generation için `Unexpected end of JSON input` uyarısı görüldü, ancak test sonucu PASS. Bu mevcut BFF proxy/static analysis uyarısı olarak raporlandı.

## Açık limitation’lar

- Gerçek payment provider integration yok.
- Gerçek charge/capture yok.
- Gerçek order creation yok.
- Reconciliation/callback engine değiştirilmedi.
- Gerçek payment projection BFF endpoint olmadığı için adapter safe placeholder projection kullanıyor.
- Support ticket creation yok.

## Riskler

- Gerçek BFF payment projection endpoint bağlanınca DTO mapping tekrar doğrulanmalı.
- Unknown-result copy ve retry guidance provider/reconciliation owner terminolojisiyle uyumlu tutulmalı.
- BFF proxy static path warning ayrıca incelenmeli.

## Sonraki önerilen PHASE-10 paketi

PHASE-10D-03 için öneri: Payment projection BFF read endpoint contract wiring ve gerçek owner-provided payment context projection bağlama. Bu paket yine provider charge/capture yapmadan sadece read/projection contract integration olmalı.

## Nihai karar önerisi

PASS WITH LIMITATION
