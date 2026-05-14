# PHASE-10D-03 — Order Confirmation / Tracking Surface Foundation Report

## Görev özeti

`/order/confirmation`, `/orders/[id]`, and guest-safe `/orders` lookup foundation were implemented as browser-rendered, mobile-first, projection-safe order surfaces.

The implementation keeps these boundaries explicit:

- payment succeeded != order created
- order created != shipment prepared
- shipped != delivered
- return/refund/settlement/payout truth is not produced by UI

## Başlangıç order/tracking durumu

Before this phase, `/orders` rendered a route placeholder and there was no real order confirmation or tracking surface in `apps/web`.

## Order projection adapter

Added `apps/web/src/lib/bff/orders.ts`.

The adapter reads `/order/projection` through the existing BFF projection read helper and returns a normalized `PublicProjectionEnvelope<OrderSurfaceProjection>`.

When owner projection is unavailable, the adapter returns a safe degraded placeholder with boundary flags set to `false`. It does not create payment, order, shipment, delivery, refund, settlement, payout, provider, or support ticket truth.

## Order projection DTO

Extended `packages/contracts/src/order.ts` with frontend-safe DTOs:

- `OrderSurfaceProjection`
- order reference projection
- payment summary projection
- order state projection
- shipment projection
- delivery projection
- support guidance projection
- timeline step projection
- item preview projection
- guest lookup projection
- boundary flags

No internal fulfillment, logistics provider payload, settlement, payout, fraud/risk, or audit internals are exposed.

## Order confirmation surface

Added `/order/confirmation` via `apps/web/app/order/confirmation/page.tsx`.

The surface shows payment/order separation, reference projection, timeline, shipment/delivery projection, item preview, support guidance, and navigation. It explicitly states that payment received is not order created.

## Order tracking timeline

Added `/orders/[id]` via `apps/web/app/orders/[id]/page.tsx`.

The timeline is semantic (`ol/li`), mobile-first, and separates payment, order processing, shipment preparation, shipped, delivery, and support escalation states.

## Shipment/tracking projection

Shipment card displays:

- carrier projection text
- tracking unavailable/projection text
- estimated delivery projection text
- degraded tracking warning

It does not guarantee delivery and does not expose raw logistics payloads.

## Order item surface

Order item preview list was added with safe display fields:

- media placeholder
- item title
- quantity projection text
- creator/store context text
- safe summary text

Refund and settlement truth flags remain `false`.

## Payment vs order separation review

UI copy, status band, timeline, and support panel preserve payment/order separation.

Examples present in runtime copy:

- "Payment received is not order created. Shipped is not delivered."
- "Payment success projection is separate from order creation and fulfillment."
- "Order creation is not guaranteed by payment projection."

## Support escalation surface

Support panel includes:

- order reference
- payment reference
- support CTA
- degraded tracking guidance
- refresh projection action

Ticket creation truth remains `false`.

## Guest lookup foundation

`/orders` now renders a guest lookup foundation with disabled email/reference fields and a disabled lookup placeholder. It does not implement auth or verification.

## Empty/error/degraded order states

Handled states include:

- lookup required
- payment pending
- payment succeeded with order pending
- order processing
- preparing shipment
- shipped
- delivery attempt
- delivered projection
- support required
- degraded tracking
- unavailable/timeout/error fallback

These are display projections only.

## Mobile-first review

CSS was added in `apps/web/app/globals.css` for compact status bands, timeline rows, shipment card, item stacking, and sticky desktop support panel. Mobile smoke for `/orders/[id]` passed at `390x844`.

## Accessibility minimum review

Implemented:

- semantic `main`, `section`, `aside`
- heading hierarchy
- timeline `ol/li`
- `role="status"` and `aria-live` status band
- explicit support CTA labels
- keyboard focus inherited from global focus-visible styles

## Boundary review

Commands run:

- `rg '(@hx/persistence|persistence|services/.*/src|\\.\\./\\.\\./services)' apps/web -n`
- `rg '(order confirmed|fake order confirmed|refund completed|fake refund completed|guaranteed delivery|delivery guaranteed|local shipment truth|local delivery truth|raw logistics)' apps/web packages/contracts/src/order.ts -n -i`

Result: PASS. No forbidden imports or forbidden fake-truth copy found in `apps/web`.

## Build/typecheck/playwright sonuçları

- `pnpm.cmd run typecheck`: PASS
- `pnpm.cmd run build`: PASS
- `pnpm.cmd --filter @hx/web run playwright`: PASS, 26/26

Initial Playwright run had one strict locator failure because "Shipped projection" appeared in both timeline and shipment section. The test was narrowed to the level-2 shipment heading and then passed.

## Açık limitation’lar

- BFF owner endpoint `/order/projection` is read opportunistically; when absent/unavailable, the web adapter renders safe placeholder projections.
- Guest lookup has no verification or mutation engine.
- Support escalation has no ticket creation mutation.
- Shipment/tracking uses projection placeholders only.

## Riskler

- When a real order projection endpoint is added, DTO mapping must be reviewed to ensure no raw logistics/provider/internal fulfillment fields are exposed.
- Copy must remain strict as owner projections become richer, especially around delivered, refund completed, and order confirmed language.

## Sonraki önerilen PHASE-10 paketi

Recommended next package: real BFF order read projection wiring with owner-provided DTO mapping and contract tests, still without browser-owned truth.

## Nihai karar önerisi

PASS WITH LIMITATION

Reason: The browser order confirmation/tracking foundation, degraded/support states, shipment/delivery projection surface, guest lookup foundation, typecheck, build, and Playwright smoke all pass. Limitation remains that the real owner order projection endpoint is not implemented in this phase.
