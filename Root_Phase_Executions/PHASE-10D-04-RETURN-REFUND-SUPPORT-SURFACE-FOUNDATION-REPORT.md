# PHASE-10D-04 — Return / Refund / Support Surface Foundation Report

## Görev özeti

`/returns`, `/returns/[id]`, `/support`, `/support/tickets/[id]` route'ları gerçek browser-rendered, mobile-first, projection-safe return/refund/support foundation surface olarak eklendi.

Kapsam refund engine, settlement/payout owner, support mutation engine, fraud/moderation backend veya provider finance integration değildir.

## Başlangıç return/refund/support durumu

Başlangıçta `/support` placeholder route idi. `/returns`, `/returns/[id]`, `/support/tickets/[id]` yüzeyleri mevcut değildi.

Order ve payment yüzeylerinde projection-safe BFF adapter ve degraded fallback paterni vardı. Yeni return/support foundation bu paterni izledi.

## Return/refund projection adapter

Eklendi:

- `apps/web/src/lib/bff/returns.ts`
- `apps/web/src/lib/bff/support.ts`

Adapter'lar owner BFF projection endpoint'ini okumayı dener. Endpoint unavailable/timeout/error olduğunda UI truth üretmez; sadece güvenli degraded/placeholder projection döndürür.

Return adapter ayrımları açık korur:

- return requested != return approved
- return approved != refund completed
- refund pending != refund settled

## Frontend-safe DTO review

Eklendi:

- `ReturnSurfaceProjection`
- `RefundProjectionSummary`
- `ReturnSupportGuidanceProjection`
- `ReturnEscalationProjection`
- `ReturnTimelineStepProjection`
- `ReturnItemPreviewProjection`
- `SupportSurfaceProjection`
- `SupportTicketProjection`
- `SupportOrderReferenceProjection`
- `SupportGuidanceProjection`
- `SupportEscalationProjection`
- `SupportTimelineStepProjection`

Taşınmayan alanlar:

- internal finance state
- settlement internals
- payout internals
- fraud/risk internals
- moderation internals
- admin notes
- raw provider payloads

## Returns surface

`/returns` route'u eklendi.

Gösterilenler:

- return request list projection
- return status projection
- refund state projection
- support escalation guidance
- degraded return warning

UI refund completed, return approved, settlement veya logistics truth üretmez.

## Return detail timeline

`/returns/[id]` route'u eklendi.

Surface:

- mobile-first layout
- semantic timeline
- refund state panel
- item preview projection
- escalation guidance aside
- degraded/timeout/unavailable fallback

## Refund separation review

Copy ve timeline içinde açık ayrımlar eklendi:

- `Return approved is not refund completed.`
- `Refund pending is not refund settled.`
- `Refund initiated or processed is not settlement or payout truth.`

Return approved state, refund completed state'e lokal olarak bağlanmadı.

## Support surface

`/support` route'u placeholder'dan support lifecycle projection surface'e çevrildi.

Gösterilenler:

- support ticket preview
- ticket status projection
- order-linked support preview
- return/refund context references
- escalation guidance
- degraded support state

## Support ticket detail surface

`/support/tickets/[id]` route'u eklendi.

Gösterilenler:

- ticket timeline projection
- customer message preview
- support guidance
- escalation state projection
- order/payment/return/refund reference projection

Internal moderation/fraud/admin truth expose edilmedi.

## Order-linked support review

Support surface order, payment, return ve refund referanslarını customer-visible projection olarak gösterir.

Raw payment/provider payload, internal finance state ve admin notes expose edilmez.

## Empty/error/degraded states

İşlenen durumlar:

- return unavailable
- refund pending
- degraded refund state
- support unavailable
- ticket degraded/escalated
- escalation required
- timeout
- partial projection

Adapter fallback'leri owner truth üretmeden retryable degraded projection sağlar.

## Mobile-first review

Yeni surface CSS'i mobile-first grid ile eklendi:

- timeline kartları tek kolonda okunabilir
- support/escalation CTA mobilde full-width
- long reference/status text `overflow-wrap` ile güvenli
- desktop'ta guidance panel sticky aside

## Accessibility minimum review

Kontrol edilenler:

- `<main>`, `<section>`, `<aside>`, `<ol>`, `<dl>` semantic yapı
- timeline `aria-label` ve item `ariaText`
- status band `role="status"` ve `aria-live="polite"`
- heading hierarchy route h1, panel h2, timeline h3
- keyboard focus mevcut global `:focus-visible`
- warning copy role/status kullanılan kritik refund uyarılarında görünür

## Boundary review

Taramalar:

- apps/web içinde persistence import: match yok
- apps/web içinde `services/*/src` import: match yok
- forbidden local truth true flags: match yok

Korunan boundary flags:

- projectionTruth false
- queryCacheTruth false
- returnApprovalTruth false
- refundCompletedTruth false
- settlementTruth false
- payoutTruth false
- supportResolutionTruth false
- moderationTruth false
- fraudTruth false
- rawProviderPayloadExposed false
- adminNotesExposed false

## Build/typecheck/playwright sonuçları

PASS:

- `pnpm.cmd run typecheck`
- `pnpm.cmd run build`
- `pnpm.cmd --filter @hx/web run playwright`

Not: Bir ara typecheck ve Playwright paralel çalıştırıldığında Next `.next/types` geçici dosyaları nedeniyle transient typecheck hatası oluştu. Komut seri tekrarlandığında PASS oldu.

## Açık limitation’lar

- BFF owner endpoint'leri unavailable ise surface güvenli degraded/placeholder projection gösterir.
- Gerçek return request mutation yoktur.
- Gerçek refund execution, provider refund, settlement veya payout entegrasyonu yoktur.
- Gerçek support ticket mutation/resolution engine yoktur.

## Riskler

- Owner BFF DTO'ları ileride gerçek endpoint ile farklılaşırsa adapter normalize katmanı genişletilmelidir.
- Support escalation copy customer-visible kalmalıdır; internal fraud/moderation kararları bu surface'e taşınmamalıdır.
- Refund completed projection sadece owner projection'dan gelmelidir; UI state machine'e dönüştürülmemelidir.

## Sonraki önerilen PHASE-10 paketi

PHASE-10D devamı için öneri:

- Owner BFF return/support read endpoint contract alignment
- Real customer-safe ticket create handoff placeholder
- Notification-linked support/return read projection surface

## Nihai karar önerisi

PASS
