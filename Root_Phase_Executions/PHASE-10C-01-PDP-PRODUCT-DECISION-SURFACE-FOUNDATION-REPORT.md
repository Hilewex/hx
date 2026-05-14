# Görev özeti

PHASE-10C-01 kapsamında browser-rendered, mobile-first, projection-safe PDP foundation oluşturuldu. `/product/[id]` artık gerçek bir product decision surface render ediyor; media, product info, creator/store context, variant preview, story/video, review/Q&A, interaction ve add-to-cart readiness placeholder alanları var.

# Başlangıç PDP durumu

Başlangıçta `apps/web/app/product/[id]/page.tsx` sadece `RoutePlaceholder` render ediyordu. Product detail read, variant surface, media surface, review/Q&A ve transport state handling gerçek route üzerinde yoktu.

# Product projection adapter

`apps/web/src/lib/bff/product.ts` eklendi.

Adapter:
- `/catalog/pdp/:productId` product/storefront read projection okur.
- `/story/tray?surface=PDP`, `/rating/product/:productId`, `/review/list`, `/qa/question/list` okur.
- Response state’lerini tek `PdpProductDecisionProjectionEnvelope` içine normalize eder.
- Business decision, cart mutation, stock/pricing owner kararı üretmez.

# PDP projection DTO

`packages/contracts/src/pdp.ts` eklendi ve `packages/contracts/src/index.ts` üzerinden export edildi.

DTO; product id/title/subtitle, creator/store context, media preview, variant preview, review summary, Q&A summary, story/video context, safe projection text ve boundary truth flag’lerini içerir.

DTO internal stock source, fulfillment state, moderation internals, risk state, persistence aggregate, settlement/order/payment state taşımaz.

# Media gallery surface

`ProductDecisionSurface` içinde media-first gallery eklendi:
- primary media preview
- horizontal thumb row
- degraded/missing media fallback
- alt/aria label desteği

Advanced media pipeline kurulmadı.

# Product info surface

Product title, subtitle, description, creator/store context ve safe projection facts render ediliyor.

UI final price truth veya stock truth göstermiyor; price/availability alanları yalnızca owner projection var/yok şeklinde güvenli metin olarak gösteriliyor.

# Variant selection foundation

Variant selector local state ile seçim preview’ı sunuyor.

Her variant:
- selectable preview olarak render edilir,
- availability status’u kesin stock/purchase kararı olarak kullanılmaz,
- `variantTruth: false`, `stockTruth: false`, `purchaseEligibilityTruth: false` taşır.

# Creator/store context

Creator/store teaser PDP info alanında render ediliyor.

Fake trust badge, creator authority, endorsement veya verified authority claim üretilmedi.

# Story/video context surface

PDP ilişkili story/video preview rail eklendi.

Autoplay yok. Moderation decision üretilmiyor; story/video verisi projection preview olarak render ediliyor.

# Review/Q&A foundation

Review ve Q&A summary surface eklendi:
- rating/count projection text
- preview snippet
- placeholder action button
- collapsible details yüzeyi

Review eligibility veya purchase badge truth üretilmedi.

# Interaction/add-to-cart placeholder

Like/save/share placeholder surface eklendi.

Add-to-cart action area foundation eklendi, fakat gerçek cart mutation yapılmıyor. Button yalnızca readiness placeholder olarak kalıyor.

# Transport state handling

Adapter ve UI şu state’leri işler:
- loading
- timeout
- unavailable
- degraded
- partial
- empty
- retryable
- non-retryable

Partial/degraded projection UI’da açık state olarak gösterilir; browser kesin commerce sonucu üretmez.

# Empty/error/degraded PDP states

Eklenen yüzeyler:
- product not found
- PDP projection unavailable
- partial PDP projection
- missing/degraded media projection
- missing variant projection
- empty story/video projection
- failed/empty review-Q&A projection fallback

# Mobile-first review

CSS mobile-first düzenlendi:
- gallery ilk sırada
- thumb-friendly 44px+ controls
- sticky action surface mobile’da bottom’a yakın
- horizontal media/story rail
- details tabanlı review/Q&A collapse
- desktop layout yalnızca `min-width: 760px` sonrası iki kolon

# Accessibility minimum review

Kontrol edilenler:
- semantic headings
- gallery alt/aria labels
- keyboard button controls
- variant selector `radiogroup` / `radio`
- details/summary review-Q&A surface
- focus-visible outline
- button labels

# Boundary review

`apps/web` içinde persistence veya `services/*/src` import eklenmedi.

Yeni PDP kodu:
- local stock truth üretmez
- local final price truth üretmez
- local availability truth üretmez
- purchase eligibility truth üretmez
- variant truth owner değildir
- fake urgency / only-left mesajı üretmez
- fake creator trust/authority üretmez
- cart/checkout/payment/order mutation yapmaz

Boundary scan notu: `apps/web/src/bootstrap/review.ts` içinde önceki fazdan kalan test/bootstrap string’i bulundu; yeni PDP surface kapsamında kullanılmıyor ve bu görevde değiştirilmedi.

# Build/typecheck/playwright sonuçları

`pnpm.cmd run typecheck`: PASS

`pnpm.cmd run build`: PASS

`pnpm.cmd --filter @hx/web run playwright`: PASS, 9/9

Playwright PDP coverage:
- PDP render
- variant selection render
- degraded PDP render
- missing product render
- media fallback render

# Açık limitation’lar

- `/product/[id]` mevcut BFF PDP endpoint’i storefront context ister. Route storefrontId query yoksa foundation seed context (`s_feno_1`) ile açılıyor. Bu gerçek commerce truth değildir, ama sonraki fazda URL/storefront navigation context ile netleştirilmeli.
- Playwright PDP smoke’ları section render davranışını API route mock’larıyla doğruluyor; canlı BFF entegrasyonu ayrıca e2e suite’e taşınmalı.
- Media rendering foundation seviyesinde; CDN/image optimization veya video pipeline kurulmadı.
- Add-to-cart action gerçek cart mutation yapmıyor.

# Riskler

- Storefront context default’u production davranışı olarak bırakılmamalı; PDP entrypoint’in storefront/discovery navigation context’i net owner kontratıyla beslenmeli.
- Review/Q&A projection shape servis tarafında genişlerse adapter mapping daha strict schema guard isteyebilir.
- Price/availability safe text bilinçli olarak numeric veya decisive değil; ileride commerce owner projection contract netleşince metinler owner-provided safe display alanından gelmeli.

# Sonraki önerilen PHASE-10 paketi

PHASE-10C-02 önerisi:
- PDP route context handoff standardization
- storefront/discovery product linklerinin `storefrontId` ile PDP’ye bağlanması
- live BFF PDP e2e smoke
- owner-provided safe display fields for price/availability
- add-to-cart readiness validation handoff without mutation

# Nihai karar önerisi

PASS WITH LIMITATION
