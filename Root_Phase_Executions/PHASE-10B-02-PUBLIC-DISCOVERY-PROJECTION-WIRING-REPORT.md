# PHASE-10B-02 — Public Discovery Projection Adapter Wiring Report

## Görev özeti

Homepage, story rail, discover feed, product discovery rail, creator storefront teaser, category, search ve storefront route yüzeyleri projection-safe BFF read adapter katmanına bağlandı. UI tarafındaki eski static candidate listeleri kaldırıldı; veri yoksa browser local commerce/ranking/recommendation truth üretmeden loading, empty, degraded, unavailable veya error state gösteriyor.

## Başlangıç projection wiring durumu

Başlangıçta discovery surface component içinde story, product, feed, category ve storefront candidate listeleri local static array olarak tutuluyordu. `apps/web/src/lib/bff` altında home/catalog/storefront için erken adapter iskeleti vardı fakat path/response shape uyumsuzdu ve transport state normalize edilmiyordu.

## Discovery adapter layer

`apps/web/src/lib/bff` altında projection read adapter katmanı genişletildi:

- `home.ts`: story, discover/search, catalog ve category read adapterlarını public home projection altında birleştiriyor.
- `discover.ts`: search projection candidate verisini discovery candidate DTO'ya normalize ediyor.
- `catalog.ts`: `/catalog/product-cards` public read endpointine bağlandı.
- `storefront.ts`: `/storefront/public/[slug]` public read endpointine bağlandı.
- `search.ts`: `/search` public read endpointine bağlandı.
- `story.ts`: `/story/tray` public read endpointine bağlandı.
- `category.ts`: `/category/list` ve `/category/detail` read endpointlerine bağlandı.
- `read.ts`: BFF envelope unwrap, normalized error, timeout/unavailable/error/empty/degraded state dönüşü eklendi.

## Typed projection contract durumu

`packages/contracts/src/discovery.ts` eklendi ve public discovery DTO'ları tanımlandı:

- `PublicProjectionEnvelope`
- `PublicProjectionTransport`
- `DiscoveryCandidateProjection`
- `PublicHomeProjection`
- `PublicDiscoverProjection`
- `PublicStorefrontProjection`
- `PublicSearchProjection`
- `PublicCategoryProjection`

DTO'lar persistence entity veya internal aggregate expose etmiyor. Boundary flag'leri UI tarafında ranking/recommendation/commerce truth üretilmediğini açıkça taşıyor.

## Homepage projection wiring

Homepage artık `readHomeProjection()` ile gerçek adapter zincirini kullanıyor:

- hero projection
- story projection
- discover feed projection
- product discovery projection
- creator spotlight projection
- category shortcut projection

Partial/unavailable durumlarında section bazlı degraded/empty state render ediliyor.

## Story rail projection wiring

Story rail `StoryTrayItem[]` ile render ediliyor. Local visibility veya moderation kararı üretilmiyor. Media yoksa degraded/read-state fallback gösteriliyor.

## Discover feed projection wiring

Mixed feed `DiscoveryCandidateProjection[]` ile render ediliyor. Candidate türleri search/category/storefront/product projectionlarından geliyor. UI ranking authority veya recommendation truth göstermiyor.

## Product rail projection wiring

Product rail `CatalogProductCardReadProjection[]` ile render ediliyor. Kartlar title, store/brand context ve media projection bilgisini gösteriyor. Stock, availability veya final price kesinliği gösterilmiyor; fiyat alanı safe unavailable metniyle sınırlandırıldı.

## Storefront projection wiring

`/store/[slug]` route şu read adapterları kullanıyor:

- storefront profile projection
- storefront-scoped story rail
- storefront-scoped product rail
- storefront discover preview

Creator authority, moderation veya verification state browser tarafından üretilmiyor.

## Search/category projection wiring

`/search`:

- query transport state
- empty query state
- unavailable/degraded/error state
- projected result candidate render

`/category`:

- category list/detail projection
- discovery candidate projection
- product preview projection
- empty/degraded state

Taxonomy owner gibi davranan local fallback eklenmedi.

## Transport state handling

Normalize edilen state'ler:

- loading: TanStack Query pending state
- timeout: BFF timeout normalized error
- unavailable: network/5xx/proxy unavailable
- degraded: warnings içeren projection
- empty: emptyState veya boş collection
- partial: homepage aggregate içinde bazı kaynaklar unavailable iken bazıları usable
- retryable: timeout/5xx/no-status transport errors
- non-retryable: 4xx normalized BFF errors

## Query standardization

`projectionQueryKeys` eklendi. Session ve discovery read query key'leri `['projection', ...]` pattern'ine taşındı. Default query retry policy normalized `BffReadError.retryable` alanını kullanıyor. Query cache owner truth olarak kullanılmıyor; yalnızca read transport cache davranışı sağlıyor.

## Boundary review

Kontrol edildi:

- local ranking truth yok
- local recommendation truth yok
- local stock truth yok
- local availability truth yok
- local permission decision yok
- local moderation decision yok
- fake verified creator state yok
- fake recommended-for-you state yok
- `apps/web` içinde persistence import yok
- `apps/web` içinde `services/*/src` import yok

## Build/typecheck/playwright sonuçları

- `pnpm.cmd run typecheck`: PASS
- `pnpm.cmd run build`: PASS
- `pnpm.cmd --filter @hx/web run playwright`: PASS, 6/6

İlk Playwright denemesinde strict locator çoklu eşleşme nedeniyle FAIL oldu; smoke spec projection-state başlıklarını exact locator ile kontrol edecek şekilde düzeltildi ve tekrar çalıştırıldığında PASS aldı.

## Açık limitation'lar

Playwright smoke sırasında ayrı BFF process başlatılmadı. Next `/api/bff/[...path]` proxy BFF unavailable durumunu gerçek transport degradation olarak normalize ediyor. Live BFF açıkken aynı adapterlar gerçek BFF read endpointlerini kullanır.

Storefront service public response shape'i mevcut contractta sınırlı (`displayName`, product/video/post alanları gevşek). Bu fazda internal aggregate expose edilmedi; daha zengin storefront DTO ayrı bir sonraki contract paketinde genişletilebilir.

## Riskler

BFF endpointleri farklı deployment base URL ile çalışacaksa `BFF_BASE_URL` veya `NEXT_PUBLIC_BFF_BASE_URL` ortam değişkenlerinin doğru verilmesi gerekir.

Search/discover adayları foundation seviyesinde gelir; ranking veya recommendation engine yerine geçmez.

## Sonraki önerilen PHASE-10 paketi

PHASE-10B-03 için öneri: public storefront/discovery BFF orchestration endpointlerini tekil public DTO response'larına sıkılaştırmak ve live-BFF Playwright profile eklemek.

## Nihai karar önerisi

PASS WITH LIMITATION
