# PHASE-10-00 - Repo Reality Check / Frontend-UX-Mobile-Panel Baseline

Date: 2026-05-11

## 1. Gorev ozeti

Bu inceleme PHASE-10 Frontend / UX / Mobile Surface Readiness oncesinde mevcut repo gercekligini cikarmak icin yapildi. Kod degistirilmedi, refactor yapilmadi, mevcut uygulama ve route yapilari source review ile eslestirildi.

Ana sonuc: repo TypeScript monorepo olarak build/typecheck geciyor, BFF ve domain service katmani genis. Ancak `apps/web` ve `apps/panel` gercek browser UI/page/layout uygulamasi degil; console tabanli bootstrap/simulation shell dosyalari iceriyor. `apps/mobile` yok. Panelde gercek admin/creator/supplier/support ekranlari yok. UI tarafinda bazi commerce/social journey simulasyonlari BFF endpointlerini cagiriyor; bunlar production-ready UI yuzeyi olarak kabul edilemez.

## 2. Incelenen dosya/klasorler

- `apps/web`
- `apps/panel`
- `apps/mobile` - klasor yok
- `apps/bff`
- `packages/contracts`
- `packages/ui`
- `packages/shared-kernel` - repo bu adla mevcut; `packages/shared` yok
- `services/*`
- `tests/smoke`
- `package.json`
- `pnpm-workspace.yaml`
- `tsconfig*.json`
- `infra` ve runtime/config dosyalari sinirli tarandi

## 3. Genel repo durumu

Workspace paketleri `apps/*`, `services/*`, `packages/*` altindan geliyor. Mevcut app paketleri `@hx/web`, `@hx/panel`, `@hx/bff`. Web ve panel paketleri `tsx src/index.ts` ile calisan TypeScript script/shell formunda. React, Next.js, Expo, native mobile route, browser page/layout/component agaci tespit edilmedi.

`packages/ui` yalnizca `ThemeTokens` ve `defaultTokens` export ediyor. Reusable UI component library tespit edilmedi.

BFF `apps/bff/src/server/index.ts` icinde cok sayida HTTP endpointi elle route ediyor ve domain servis paketlerini `@hx/*` workspace package olarak cagiriyor. Bu BFF tarafinda beklenen delegation patternine yakin, ancak BFF route kayitlari monolitik ve bir kisim express-style router adapter/mockReq ile calisiyor.

## 4. Web yuzeyleri tablosu

| Surface adi | Dosya yolu | Var/Yok/Partial | Aktor | Kullanilan BFF route veya service | Data source | Ana aksiyonlar | Guard/permission | Empty state | Error state | Degraded state | Mobile-first | Risk | Not |
|---|---|---:|---|---|---|---|---|---|---|---|---|---|---|
| Ana sayfa | `apps/web/src/bootstrap/app.ts` | Partial | Guest/Customer | Simulasyon akislarini sirayla cagirir | BFF + local mock | App shell mount | `initializeAuth` guest default | Yok | Yok | Yok | Yok | High | Gercek homepage UI/page yok; console shell var. |
| Kesfet | `apps/web/src/bootstrap/search.ts`, `story.ts`, `plp.ts` | Partial | Guest/Customer | `/search`, `/story/tray`, `/plp` | BFF | Discover search/story/plp simulation | BFF tarafinda | BFF emptyState okunuyor | Throw/log | Warnings okunuyor | Yok | High | Gercek discover page yok. |
| Arama | `apps/web/src/bootstrap/search.ts` | Partial | Guest/Customer | `/search?query=...` | BFF | Query, mode checks | BFF tarafinda | `QUERY_REQUIRED` | Throw | `M8_RANKING_NOT_IN_SCOPE` warning | Yok | Medium | UI degil smoke benzeri simulation. |
| Kategori / PLP | `apps/web/src/bootstrap/category.ts`, `plp.ts` | Partial | Guest/Customer | `/category/list`, `/category/detail`, `/plp` | BFF | List/detail/plp sort/filter | BFF tarafinda | Category not found emptyState | Log/throw | Warnings | Yok | Medium | Product card projection kullaniliyor, page yok. |
| PDP | `apps/web/src/bootstrap/pdp.ts` | Partial | Guest/Customer | Comment: real app BFF fetch yapardi; simulation local | Local mock | Render PDP states | Yok | Yok | `NOT_FOUND`, `UNAVAILABLE`, `SYSTEM_ERROR` | Yok | Yok | High | Price/stock local mock projection console'a yaziliyor. |
| Klasik urun karti | `apps/web/src/bootstrap/plp.ts`, `storefront.ts` | Partial | Guest/Customer | `/plp`, `/storefront?...` | BFF | Card flags inspect | BFF projection | BFF emptyState | Log | Warnings | Yok | Medium | Gercek card component yok. |
| Videolu urun karti | `apps/web/src/bootstrap/plp.ts`, `storefront.ts` | Partial | Guest/Customer | `/plp`, `/storefront?...tab=VIDEOS` | BFF | Video rail inspect | BFF projection | Yok | Log | Warnings | Yok | Medium | Gercek video UI yok. |
| Story yuzeyi | `apps/web/src/bootstrap/story.ts` | Partial | Guest/Customer | `/story/tray`, `/story/viewer` | BFF | Tray/viewer/scope check | BFF surface scope | Empty state code okunuyor | Log | Warnings | Partial | Medium | Mobile presentation field okunuyor ama responsive UI yok. |
| Creator storefront | `apps/web/src/bootstrap/storefront.ts` | Partial | Guest/Customer | `/storefront?...` | BFF | Public storefront, tabs, follow state | BFF | `emptyState` okunuyor | Log | Warnings | Yok | Medium | Gercek storefront page yok. |
| Follow feed | `apps/web/src/bootstrap/feed.ts` | Partial | Customer | `/feed/following`, `/follow/*` | BFF | Empty feed, follow feed | BFF | Empty feed code okunuyor | Log | Yok | Yok | Medium | Token `mock-token`; real auth yok. |
| Review / Q&A | `apps/web/src/bootstrap/review.ts`, `qa.ts` | Partial | Customer/Supplier/Admin sim | `/review/*`, `/qa/*`, `/rating/product/*` | BFF | Create/update/transition/list | BFF/service, body actor kullanimi da var | Unknown cases | Log | Warnings | Yok | High | UI body actor/eligibility snapshot gonderiyor; truth riski. |
| Begen / Kaydet sayfalari | `apps/web/src/bootstrap/interaction.ts` | Partial | Customer | `/interaction/*` | BFF | Like/save/share/list state | BFF, body actor kullanimi | Yok | Log | Warnings | Yok | High | Sayfa yok; interaction simulation var. |

## 5. Panel yuzeyleri tablosu

| Surface adi | Dosya yolu | Var/Yok/Partial | Aktor | Kullanilan BFF route veya service | Data source | Ana aksiyonlar | Guard/permission | Empty state | Error state | Degraded state | Mobile-first | Risk | Not |
|---|---|---:|---|---|---|---|---|---|---|---|---|---|---|
| Admin dashboard | `apps/panel/src/bootstrap/app.ts` | Partial | Admin/Operator | Yok | Theme/config | Mount log | `initializeAuth`, `resolvePanelRoute` ayri dosyada | Yok | Yok | Yok | Yok | High | Dashboard UI yok. |
| Product approval | Yok; BFF route `apps/bff/src/server/index.ts` `/pool/admin/products/...` | Yok | Admin/Operator | `/pool/admin/products/:id/approve` vb. | BFF/service | Tespit edilen UI aksiyonu yok | BFF guard | Yok | Yok | Yok | Yok | High | Panel ekran yok. |
| Creator management | Yok; BFF `creator/protected-action/validate` | Yok | Admin/Operator/Creator | `/creator/protected-action/validate` | BFF/service | Tespit edilen UI aksiyonu yok | BFF guard | Yok | Yok | Yok | Yok | High | Panel ekran yok. |
| Supplier management | Yok; BFF `supplier/protected-action/validate` | Yok | Admin/Operator/Supplier | `/supplier/protected-action/validate`, `/pool/supplier/products` | BFF/service | Tespit edilen UI aksiyonu yok | BFF guard | Yok | Yok | Yok | Yok | High | Panel ekran yok. |
| Moderation queue | Yok | Yok | Admin/Operator | `/moderation/*` BFF var | BFF/service | UI yok | BFF/service | Yok | Yok | Yok | Yok | High | Web simulation moderation var, panel queue yok. |
| Risk / fraud review queue | Yok | Yok | Admin/Operator | `/risk/*`, `/fraud/*` BFF var | BFF/service | UI yok | BFF/service | Yok | Yok | Yok | Yok | High | Panel queue yok. |
| Support ticket operations | Yok | Yok | Support/Admin | `/support/*` BFF var | BFF/service | UI yok | BFF/service | Yok | Yok | Yok | Yok | High | Web support simulation var, support ops panel yok. |
| Finance / payout operations | Yok | Yok | Finance/Admin | `/settlement/*`, `/payout/*`, `/finance-correction/*` BFF var | BFF/service | UI yok | BFF/service | Yok | Yok | Yok | Yok | High | Panel finance UI yok. |
| Creator panel dashboard | Yok | Yok | Creator | Yok | Yok | Yok | Yok | Yok | Yok | Yok | Yok | High | Tespit edilmedi. |
| Creator product management | Yok | Yok | Creator | `/pool/...` supplier/admin routes var; creator product UI yok | Yok | Yok | Yok | Yok | Yok | Yok | Yok | High | Tespit edilmedi. |
| Creator story/post/media management | Yok | Yok | Creator | `/store-story/creator/*`, `/store-post/creator/*`, `/media/*` BFF var | BFF/service | UI yok | BFF/service | Yok | Yok | Yok | Yok | High | Panel UI yok. |
| Supplier product submission | Yok | Yok | Supplier | `/pool/supplier/products` | BFF/service | UI yok | BFF/service | Yok | Yok | Yok | Yok | High | Panel UI yok. |
| Supplier stock/price update | Yok | Yok | Supplier | `/pool/supplier/products/:id` patch | BFF/service | UI yok | BFF/service | Yok | Yok | Yok | Yok | High | Panel UI yok. |
| Supplier order preparation | Yok | Yok | Supplier | Tespit edilemedi | Yok | Yok | Yok | Yok | Yok | Yok | Yok | High | Surface yok. |
| Customer admin simulation | `apps/panel/src/bootstrap/customer.ts` | Partial | Admin/Customer sim | `/customer/profile`, `/customer/admin/profiles/*` | BFF | Create/update/suspend/reactivate/close smoke | Header actor sim | Yok | Assertion/log | Yok | Yok | Medium | Panel UI degil, axios smoke script. |
| Panel action capability helper | `apps/panel/src/bootstrap/actions.ts` | Partial | Guest/Customer/Supplier/Operator/Admin | Yok | Local role enum | `evaluateCapabilities`, `initiatePanelAction` | UI-local role decision | Yok | Throws | Yok | Yok | High | UI permission truth riski. |

## 6. Mobile durumu

| Kontrol | Durum | Kanit / Not |
|---|---:|---|
| Mobile app var mi? | Yok | `apps/mobile` klasoru yok. |
| Expo yapilandirmasi var mi? | Yok | `app.json`, `expo`, native mobile package tespit edilmedi. |
| Mobile route yapisi var mi? | Yok | Mobile app route/file yapisi yok. |
| Web responsive davranisi mobile-first kabul edilebilir mi? | Hayir | Web gercek browser UI degil; CSS/layout/responsive implementation yok. |

## 7. Commerce journey UI durumu

| Surface adi | Dosya yolu | Var/Yok/Partial | Aktor | Kullanilan BFF route veya service | Data source | Ana aksiyonlar | Guard/permission | Empty state | Error state | Degraded state | Mobile-first | Risk | Not |
|---|---|---:|---|---|---|---|---|---|---|---|---|---|---|
| Cart | `apps/web/src/bootstrap/cart.ts` | Partial | Guest/Customer | `/cart`, `/cart/items` | BFF | Get/add/update/remove | BFF guard | `EMPTY` shell | `ERROR` shell | Yok | Yok | Medium | Console shell. |
| Checkout | `apps/web/src/bootstrap/checkout.ts` | Partial | Guest/Customer | `/checkout/start` | BFF | Start checkout | BFF guard | Yok | `ERROR` shell | `BLOCKED` shell | Yok | Medium | Review UI yok. |
| Payment | `apps/web/src/bootstrap/payment.ts` | Partial | Guest/Customer | `/payment/initiate` | BFF | Initiate payment | BFF guard | Yok | `ERROR` state | Yok | Yok | Medium | Redirect/pending/unknown-result UI yok. |
| Payment pending | Yok | Yok | Customer | Tespit edilemedi | Yok | Yok | Yok | Yok | Yok | Yok | Yok | High | Surface yok. |
| Payment failed | Yok | Yok | Customer | Tespit edilemedi | Yok | Yok | Yok | Yok | Yok | Yok | Yok | High | Surface yok. |
| Payment unknown-result | Yok | Yok | Customer | Tespit edilemedi | Yok | Yok | Yok | Yok | Yok | Yok | Yok | High | Surface yok. |
| Order confirmation | `apps/web/src/bootstrap/order.ts` | Partial | Customer | `/order/create-from-payment`, `/order/:id` | BFF | Create from payment, detail | BFF guard | `DETAIL_NOT_FOUND` type | `ERROR` shell | Yok | Yok | High | Confirmation page yok; order created shell var. |
| Order tracking | `apps/web/src/bootstrap/shipment.ts` | Partial | Customer | `/shipment/create-from-order`, `/shipment/:id`, `/shipment/transition` | BFF | Shipment detail/state transitions | BFF guard | Not found log | `ERROR` shell | Yok | Yok | High | Tracking UI yok; shipment simulation var. |
| Cancel request | `apps/web/src/bootstrap/cancel-return.ts` | Partial | Customer | `/cancel-return/cancel` | BFF | Create cancel, duplicate, transitions | BFF guard | Unknown request log | Request failure log | Yok | Yok | Medium | Console simulation. |
| Return request | `apps/web/src/bootstrap/cancel-return.ts` | Partial | Customer | `/cancel-return/return` | BFF | Create return, duplicate, transitions | BFF guard | Unknown request log | Request failure log | Yok | Yok | Medium | Console simulation. |
| Refund status | `apps/web/src/bootstrap/refund.ts` | Partial | Customer/Admin sim | `/refund/*` | BFF | Create/process/transition/get | BFF guard | Unknown refund log | Request failure log | Yok | Yok | Medium | Console simulation. |
| Support ticket | `apps/web/src/bootstrap/support.ts` | Partial | Customer/Admin/System sim | `/support/ticket/*` | BFF | Create/list/get/message/transition | BFF guard | Unknown ticket log | Log | Yok | Yok | Medium | Console simulation. |

## 8. Payment / unknown-result / order tracking UI durumu

- Payment initiation var: `apps/web/src/bootstrap/payment.ts`.
- Payment pending UI yok.
- Payment failed UI yok.
- Payment unknown-result UI yok.
- Payment callback / reconciliation BFF ve smoke suite seviyesinde var, UI surface tespit edilmedi.
- Order creation/detail simulation var: `apps/web/src/bootstrap/order.ts`.
- Order tracking olarak gercek UI yok; shipment lifecycle simulation var: `apps/web/src/bootstrap/shipment.ts`.
- `Payment succeeded != order created` prensibi BFF/service smoke akislariyla kismen korunuyor; UI tarafinda ise `simulateOrderFlow` payment success simulation sonrasi order create cagiriyor. Bu gercek UI degil ama journey tasarimi icin riskli bir baseline.

## 9. Error / empty / degraded state durumu

| Alan | Durum | Not |
|---|---:|---|
| Cart | Partial | `LOADING`, `EMPTY`, `SUCCESS`, `ERROR` shell state var. |
| Checkout | Partial | `LOADING`, `REVIEW_READY`, `BLOCKED`, `ERROR` shell state var. |
| Payment | Partial | `IDLE`, `INITIATING`, `REDIRECT_READY`, `ERROR` type var; renderer yok. |
| Order | Partial | `DETAIL_NOT_FOUND`, `ERROR` type var; renderer sadece state logluyor. |
| PDP | Partial | `NOT_FOUND`, `UNAVAILABLE`, `SYSTEM_ERROR` console paths var. |
| Search | Partial | BFF `emptyState` bekleniyor; UI renderer yok. |
| PLP/Storefront/Story | Partial | BFF `emptyState` ve warnings okunuyor; UI renderer yok. |
| Panel | Yok/Partial | Auth/forbidden local decision var; ekran state yok. |
| Degraded states | Partial | Warnings okunuyor (`M8_RANKING_NOT_IN_SCOPE`, projection/static warnings), ancak visual degraded UI yok. |

## 10. Mobile-first / responsive durumu

Mobile-first veya responsive UI tespit edilmedi. Web ve panel TypeScript console shell olarak calisiyor. CSS, layout, breakpoint, responsive component veya browser-rendered page yok. Story response icinde `mobilePresentation` gibi alanlar okunuyor, fakat bu UI implementasyonu degil.

## 11. UI truth uretimi riskleri

| Risk | Durum | Kanit / Not |
|---|---:|---|
| UI final price hesapliyor mu? | Tespit edilmedi | Web price hesaplamiyor; PDP mock price yazdiriyor. Ancak local mock production shell icinde duruyor. |
| UI stock availability truth uretiyor mu? | Tespit edilmedi / riskli mock | PDP local mock `stock: { status: 'IN_STOCK' }` uretiyor. Gercek UI degil ama production path dosyasinda. |
| UI payment/order state kesinlestiriyor mu? | Partial risk | `simulateOrderFlow` `/payment/simulate-success` sonrasi `/order/create-from-payment` cagiriyor ve `CREATED` shell render ediyor. Gercek UI degil, ancak baseline olarak riskli. |
| UI review/story eligibility hesapliyor mu? | Risk var | `review.ts` ve `ugc.ts` body icinde `eligibilitySnapshot` gonderiyor. BFF/service bunu reddediyor mu ayrica test gerektirir; UI source seviyesinde riskli input var. |
| UI permission/role karari veriyor mu? | Risk var | `apps/panel/src/bootstrap/actions.ts` `evaluateCapabilities(role)` local role decision yapiyor; `access.ts` route action local karar veriyor. |
| Local mock data production path'te truth gibi kullaniliyor mu? | Risk var | `apps/web/src/bootstrap/pdp.ts` local PDP product, price, stock, storefront data uretiyor. |

## 12. Panel direct write riskleri

Source import taramasinda `apps/panel/src` icinde `@hx/persistence`, `services/*/src` veya service package importu tespit edilmedi. Ancak `apps/panel/package.json` dependency listesinde cok sayida service package var: `@hx/service-storefront`, `@hx/post`, `@hx/question-answer`, `@hx/review`, `@hx/ugc`, `@hx/pool`, `@hx/service-store-message`, `@hx/service-store-post`, `@hx/store-story`, `@hx/customer`, `@hx/customer-address`. Bu su an source tarafinda kullanilmiyor gibi gorunuyor, fakat panel direct service write icin dependency-level risk olusturuyor.

`apps/panel/src/bootstrap/customer.ts` BFF'ye axios ile HTTP cagiriyor; direct persistence/service cagrisi degil. `apps/panel/src/bootstrap/actions.ts` ise local action payload uretiyor, BFF command degil.

## 13. BFF / service / persistence boundary riskleri

| Kontrol | Durum | Not |
|---|---:|---|
| BFF internal `src` import var mi? | Tespit edilmedi | BFF service paketlerini public package importlariyla cagiriyor. |
| `apps/web` dogrudan `services/*/src` import ediyor mu? | Hayir | `rg` sonucu yok. |
| `apps/panel` dogrudan `services/*/src` import ediyor mu? | Hayir | `rg` sonucu yok. |
| `apps/web` veya `apps/panel` `@hx/persistence` kullaniyor mu? | Hayir | `rg` sonucu yok. |
| BFF service boundary | Partial | BFF domain servislerini cagiriyor; bu beklenen delegation olabilir. Ancak BFF monolitik router ve mockReq adapterlari boundary netligini zayiflatiyor. |
| Projection truth riski | Partial | Web simulation projection flags/warnings okuyor; truth uretimi BFF/service tarafinda gibi. PDP local mock projection riskli. |

## 14. Test/build/smoke sonuclari

PowerShell ile `pnpm run ...` ilk denemesi BLOCKED oldu:

- Sebep: `C:\Program Files\nodejs\pnpm.ps1 cannot be loaded because running scripts is disabled on this system`.
- Dependency eksigi degil; PowerShell execution policy.

`pnpm.cmd` ile yeniden calistirildi:

| Komut | Sonuc | Not |
|---|---:|---|
| `pnpm.cmd run typecheck` | PASS | 60/61 workspace project typecheck gecti. |
| `pnpm.cmd run build` | PASS | 60/61 workspace project build gecti. |
| `pnpm.cmd run smoke:all` | FAIL | BFF smoke basladi, cok sayida suite PASS, ancak overall exit 1. |

`smoke:all` FAIL ayrimi:

- FAIL: `moderation-workflow - Moderation case for UGC not found`.
- FAIL: `PHASE-09 Smoke Coverage Foundation - ... moderation-decision-audit-maker-checker`.
- BLOCKED/ENV: Bazi suite'ler `PERSISTENCE_MODE=postgres and DATABASE_URL required` bekliyor, calisma `memory` modunda.
- BLOCKED/ENV: Lokal Postgres `::1:5433` / `127.0.0.1:5433` `ECONNREFUSED`.
- LIMITATION: Notification audit/outbox boundary missing/invalid uyarilari foundation limit olarak loglandi.

## 15. Eksikler

- Gercek web page/router/layout/component UI yok.
- Gercek panel ekranlari yok.
- Mobile app yok.
- Expo/native mobile config yok.
- `packages/ui` component library degil; sadece theme tokenlari var.
- Payment pending/failed/unknown-result UI yok.
- Order tracking UI yok; shipment simulation var.
- Panel admin/creator/supplier/support/finance/risk/moderation ekranlari yok.
- Mobile-first/responsive implementasyon yok.
- Degraded visual UI yok.
- Route protection UI seviyesinde sadece helper/shell; gercek route layer yok.
- Web/panel auth integration gercek session/permission owner olarak gorunmuyor.

## 16. Release blocker adaylari

1. Web ve panel gercek UI uygulamasi degil; console simulation shell release blocker.
2. Mobile app yok.
3. Payment unknown-result/pending/failed surface yok.
4. Panel direct service dependency riski: panel package servisleri dependency olarak aliyor.
5. UI-local permission/capability decision helperlari truth gibi kullanilabilir.
6. PDP local mock price/stock/product truth riski.
7. Review/UGC eligibility snapshot body'den gonderiliyor; UI eligibility truth riski.
8. `smoke:all` FAIL; moderation ve Postgres-env kaynakli smoke readiness temiz degil.

## 17. PHASE-10 icin onerilen ilk fix paketleri

1. Web app baseline: gercek router/page/layout kur, console simulationlari test/demo alanina tasima veya production entry'den ayirma.
2. Commerce UI package: cart, checkout, payment pending/failed/unknown-result, order confirmation, order tracking ekranlarini BFF read/command boundary ile kur.
3. Panel app baseline: admin dashboard, moderation queue, product approval, support ops, finance/payout ops, creator/supplier scoped surfaces.
4. Boundary cleanup: panel `package.json` direct service dependencies kaldir veya gerekcesini dokumante et; panel yalnizca contracts/ui/BFF client kullansin.
5. UI truth cleanup: PDP local product/price/stock mocklarini production path'ten cikar; review/UGC eligibility inputlarini owner BFF/service kararina bagla.
6. Mobile decision: `apps/mobile` scaffold edilecek mi yoksa PHASE-10 kapsaminda web responsive hedef mi netlestir.
7. Smoke stabilization: postgres gerektiren suite'leri environment profile ile ayir; `smoke:all` icin PASS/BLOCKED ayrimini script seviyesinde netlestir.

## 18. Nihai karar onerisi

**PARTIAL - IMPLEMENTATION REQUIRED**

Gerekce: Build/typecheck geciyor ve BFF/service katmani genis; ancak PHASE-10 icin gerekli frontend, panel ve mobile yuzeyleri gercek UI olarak mevcut degil. Boundary tarafinda kesin direct persistence importu bulunmadi, fakat UI-local truth/helper riskleri ve panel service dependency riski var. Bu nedenle implementasyona baslanabilir, fakat mevcut repo PHASE-10 UI readiness acisindan hazir kabul edilemez.
