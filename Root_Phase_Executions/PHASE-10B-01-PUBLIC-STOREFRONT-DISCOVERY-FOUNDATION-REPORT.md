# PHASE-10B-01 Public Storefront / Discovery Surface Foundation Report

## Görev özeti

PHASE-10B-01 kapsamında `apps/web` için public storefront/discovery foundation oluşturuldu. Ana sayfa, search, category ve creator storefront route'ları mobile-first discovery surface olarak genişletildi. UI sadece projection-safe candidate/read placeholder gösterir; ranking, stock, final price, moderation, permission veya eligibility truth üretmez.

## Başlangıç storefront/discovery durumu

Başlangıçta `/` route'u genel app shell placeholder'ıydı. `/search`, `/category` ve `/store/[slug]` route'ları route placeholder seviyesindeydi. Story rail, mixed discover feed, product discovery rail, creator storefront teaser ve search entry gerçek surface olarak yoktu.

## Ana sayfa foundation

`apps/web/app/page.tsx` artık `PublicStorefrontHome` render eder. Ana sayfa scroll-first ve mobile-first şekilde şu yüzeyleri içerir:

- Hero / intro surface
- Search entry
- Story rail
- Mixed discover feed
- Product discovery rail
- Creator storefront teaser
- Category shortcuts
- Empty/error/degraded/loading state alanı

## Story rail foundation

`StoryRail` yatay scroll eden, touch-friendly story candidate rail sağlar. Item'lar creator/story preview, safe media placeholder, loading/degraded/unavailable durumlarını gösterir. Moderation veya visibility kararı UI'da üretilmez.

## Discover feed foundation

`DiscoverFeed` video, product ve storefront candidate tiplerini karışık feed halinde gösterir. Feed item'ları display-only candidate olarak işaretlenir. Local ranking, recommendation veya final commerce state yoktur.

## Product card foundation

`ProductDiscoveryCard` reusable ürün keşif kartı olarak eklendi. Kart media preview, title, store context, safe interaction placeholder ve `Price read pending` gösterir. Final fiyat, stok, availability veya purchase eligibility üretmez.

## Creator storefront teaser foundation

`CreatorSpotlight` creator/storefront teaser yüzeyi sağlar. Storefront linkleri `/store/[slug]` route'una gider. Verified badge, creator authority, trust claim veya moderation kararı üretilmez.

## Category/search foundation

`/category` route'u category shortcut ve product discovery candidate foundation içerir. Taxonomy owner gibi davranmaz.

`/search` route'u search entry, empty state ve query olduğunda display-only candidate container gösterir. Gerçek search engine veya ranking implementasyonu yapılmadı.

`/store/[slug]` route'u storefront profile foundation, story rail, product rail ve discover feed foundation gösterir.

## Empty/error/degraded behavior

Gerçek UI state bileşenleri kullanıldı:

- Empty feed
- Failed projection load
- Unavailable section
- Degraded media fallback
- Retryable read action
- Loading state

Retry action yalnız read/navigation seviyesindedir; business mutation değildir.

## Mobile-first review

CSS mobile-first düzenlendi:

- Story rail yatay scroll ve scroll snap kullanır.
- Product cards mobilde geniş dokunma alanına sahiptir.
- Feed tek kolon başlar, desktop'ta iki kolona açılır.
- Search form mobilde stack, desktop'ta input/button row olur.
- Touch target'lar en az 44px olacak şekilde ayarlandı.
- Header mevcut responsive davranışını korur.

## Accessibility minimum review

- Semantic `section`, `article`, `h1/h2/h3` heading yapısı kullanıldı.
- Search input label'ı screen-reader için eklendi.
- Button/link focus-visible outline eklendi.
- Rail listeleri `role="list"` / `role="listitem"` ile işaretlendi.
- Empty/error/degraded state bileşenleri mevcut `aria-live` / `role="alert"` davranışını kullanır.

## Boundary review

Kontrol edildi:

- `apps/web` persistence import etmiyor.
- `apps/web` `services/*/src` import etmiyor.
- Local stock truth üretilmedi.
- Local final price truth üretilmedi.
- Local permission decision üretilmedi.
- Local moderation decision üretilmedi.
- Fake "in stock" logic eklenmedi.
- Fake "verified creator" truth eklenmedi.
- Local ranking/recommendation truth eklenmedi.
- Product/story/video/storefront candidate'ları final commerce state gibi gösterilmedi.

## Build/typecheck/smoke sonuçları

- `pnpm.cmd --filter @hx/web run typecheck`: PASS
- `pnpm.cmd --filter @hx/web run build`: PASS
- `pnpm.cmd run typecheck`: PASS
- `pnpm.cmd run build`: PASS
- `pnpm.cmd --filter @hx/web run playwright`: PASS, 6 tests passed

Not: İlk Playwright denemesinde iki selector strict-mode hatası vardı. Test selector'ları exact heading match'e daraltıldı ve tekrar çalıştırıldığında tüm smoke geçti.

## Açık limitation'lar

- BFF discovery/home/search/category/storefront read endpoint entegrasyonu yapılmadı.
- Candidate veriler projection-safe statik surface sample olarak duruyor.
- Gerçek media CDN/pipeline, autoplay, checkout, cart mutation ve payment kapsam dışı bırakıldı.
- Category taxonomy, search ranking ve creator visibility backend projection bağlantısı bekliyor.

## Riskler

- Static candidate surface ileride gerçek BFF projection adapter'larıyla değiştirilmezse product/search/category route'ları gerçek data readiness seviyesine geçmez.
- Product card copy'si dikkatle korunmalı; fiyat/stok/availability ifadeleri backend projection gelmeden güçlendirilmemeli.
- Storefront route'u slug'ı başlık olarak gösterir; displayName projection bağlandığında backend read verisiyle değiştirilmelidir.

## Sonraki önerilen PHASE-10 paketi

Önerilen sonraki paket: PHASE-10B-02 Public Discovery Projection Adapter Wiring.

Kapsam önerisi:

- Home/search/category/storefront read adapter'larını BFF projection endpoint'lerine bağla.
- Candidate schema'larını typed contract ile daralt.
- Empty/error/degraded state'leri gerçek transport ve projection sonuçlarına göre sür.
- Smoke testlerde mocked BFF projection response fixture'ları kullan.

## Nihai karar önerisi

PASS
