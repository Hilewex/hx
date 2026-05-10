# PHASE-06-FIX-03 — Story / Review / Q&A Smoke & Visibility Guard Report

## 1. Amaç
Bu fix paketinin amacı, story, review ve Q&A alanlarında pending/rejected içeriklerin public yüzeye sızmasını engellemek, review aggregate güvenliğini kanıtlamak ve Q&A moderation smoke içindeki caseId undefined hatasını kapatmaktır.

## 2. Başlangıç Durumu
PHASE-06-FIX-01:
- PASS

PHASE-06-FIX-02:
- PASS WITH LIMITATION

Açık riskler:
- Story smoke yoktu.
- Review smoke yoktu.
- Q&A social-moderation smoke caseId undefined ile FAIL.
- Story/feed visibility kanıtı zayıftı.
- Review aggregate visibility kanıtı zayıftı.

## 3. Başlangıç Source Review
| Alan | Mevcut Durum | Kanıt | Karar |
|------|---------------|-------|-------|
| Story create/publish | Store story create DRAFT idi; publish için moderation/media readiness guard yoktu | `services/store-story/src/store-story.ts` | HARDENED |
| Story feed visibility | Public store story list sadece PUBLISHED filtreliyordu | `listPublishedStoreStoriesForPublicStorefront` | HARDENED |
| Review eligibility | Creation eligibility snapshot ayrı; delivered otomatik review üretmiyor | `services/review/src/review.ts` | PASS |
| Review aggregate visibility | Aggregate approved + visible + ratingImpactActive üzerinden hesaplanıyor | `getProductRatingSummary` | PASS |
| Q&A moderation case | Question case üretiyordu; answer case üretmiyordu; social smoke list query exact route nedeniyle case kaçırabiliyordu | `services/question-answer/src/qa.ts`, `apps/bff/src/server/index.ts` | FIXED |
| BFF boundary | BFF service boundary’ye delegate ediyor; moderation handoff owner servislere gidiyor | `apps/bff/src/server/moderation.ts` | PASS |

## 4. Değiştirilen Dosyalar
| Dosya | Değişiklik | Gerekçe | Etki |
|-------|------------|---------|------|
| `packages/contracts/src/store-story.ts` | `moderationStatus`, `visibilityState`, `mediaVisibilityReady` ve publish error kodları eklendi | Story visibility contract kanıtı | Contract güçlendi |
| `services/store-story/src/store-story.ts` | Create default pending/not visible; publish approved + media-ready guard; public list visibility guard; approve/reject helper | Story public leak ve media readiness riskini kapatmak | Foundation güvenli |
| `services/store-story/tsconfig.json` | `rootDir: ./src` eklendi | Build çıktısının package main ile uyumlu olması | Runtime smoke doğru kodu kullandı |
| `services/question-answer/src/qa.ts` | Answer create moderation case ve answer approve/reject handoff helper eklendi | Q&A answer caseId deterministik olsun | Q&A moderation tamamlandı |
| `services/question-answer/src/index.ts` | Answer moderation helper export edildi | BFF handoff erişimi | Boundary tamamlandı |
| `apps/bff/src/server/moderation.ts` | `QA_ANSWER` moderation decision handoff eklendi | Answer approval/rejection owner service’e devredilsin | BFF truth üretmeden delegate ediyor |
| `apps/bff/src/server/index.ts` | `/moderation/list` query string ile çalışacak şekilde `pathname` kontrolüne alındı | `caseId` araması query ile deterministik olsun | social-moderation fixed |
| `tests/smoke/suites/social-moderation.ts` | Moderation case lookup `limit=100` + targetType ile deterministik; missing case explicit fail | `caseId undefined` yerine gerçek case kanıtı | PASS |
| `tests/smoke/suites/story-review-qa-visibility-guard.ts` | Yeni targeted smoke | 24 visibility/boundary senaryosu | PASS |
| `tests/smoke/run-smoke.ts` | Yeni suite kaydı | Script çalışsın | PASS |
| `package.json` | `smoke:story-review-qa-visibility-guard` eklendi | İstenen komut | PASS |

## 5. Story Davranışı
Story create default:
- `DRAFT`, `moderationStatus=PENDING`, `visibilityState=NOT_VISIBLE`

Pending story public feed:
- Blocked

Rejected story public feed:
- Blocked

Approved/published story public feed:
- Visible

Media not approved publish:
- Blocked

Delivered eligibility auto story create:
- Hayır

Story expiration:
- Projection story service `ACTIVE` dışındaki `HIDDEN` / `EXPIRED` kayıtları tray/viewer yüzeyinden filtreliyor.

## 6. Review / Rating Davranışı
Delivered auto review create:
- Hayır

Review create default:
- `SUBMITTED`, `moderationStatus=PENDING`, `visibilityState=NOT_VISIBLE`, `ratingImpactActive=false`

Pending review public:
- Blocked

Rejected review public:
- Blocked

Pending/rejected aggregate:
- Excluded

Approved review aggregate:
- Included

Duplicate review:
- Blocked

Wrong actor review update:
- Blocked

## 7. Q&A Davranışı
Question create moderation caseId:
- Present

Answer create moderation caseId:
- Present

Pending question public:
- Blocked

Rejected question public:
- Blocked

Approved question public:
- Visible

Pending answer public:
- Blocked

Approved answer public:
- Visible

Rejected answer public:
- Blocked

social-moderation Q&A caseId undefined:
- Fixed

## 8. Boundary
BFF story/review/Q&A truth üretiyor mu?
- Hayır

BFF direct repository access var mı?
- Hayır

UI/panel visibility truth üretiyor mu?
- Doğrulanan backend scope içinde hayır; UI/panel için yeni truth üretimi eklenmedi.

Actor spoof regression var mı?
- Hayır

## 9. Boundary Regression Scan
| Tarama | Sonuç | Not |
|--------|-------|-----|
| BFF direct repo | PASS | `@hx/persistence` direct import yok; scan’deki `insert/update/delete` provider callback callback-record isimleri, route isimleri veya service delegate çağrıları |
| Visibility/public feed | PASS | Story public list approved + visible + media-ready; review/Q&A public list approved/visible guard içeriyor |
| Review aggregate | PASS | Aggregate only approved + visible + `ratingImpactActive` reviews |
| Q&A moderation case | PASS | Question ve answer create moderation case üretiyor; smoke case lookup deterministic |
| Actor spoof regression | PASS | `x-actor-id` legacy path env guard altında; regression smoke PASS |

## 10. Smoke/Test Kanıtı
| Senaryo | Sonuç | Kanıt |
|---------|-------|-------|
| Story pending not public | PASS | `smoke:story-review-qa-visibility-guard` |
| Story rejected not public | PASS | `smoke:story-review-qa-visibility-guard` |
| Story approved public | PASS | `smoke:story-review-qa-visibility-guard` |
| Media not approved publish blocked | PASS | `smoke:story-review-qa-visibility-guard` |
| Delivered does not auto-create story | PASS | `smoke:story-review-qa-visibility-guard` |
| Review pending not public | PASS | `smoke:story-review-qa-visibility-guard` |
| Review rejected not public | PASS | `smoke:story-review-qa-visibility-guard` |
| Pending/rejected aggregate excluded | PASS | `smoke:story-review-qa-visibility-guard` |
| Approved review aggregate included | PASS | `smoke:story-review-qa-visibility-guard` |
| Duplicate review safe | PASS | `smoke:story-review-qa-visibility-guard` |
| Question caseId present | PASS | `smoke:story-review-qa-visibility-guard` |
| Answer caseId present | PASS | `smoke:story-review-qa-visibility-guard` |
| Q&A pending/rejected not public | PASS | `smoke:story-review-qa-visibility-guard` |
| social-moderation caseId fixed | PASS | `smoke:social-moderation` |

## 11. Komut Sonuçları
| Komut | Sonuç | Not |
|-------|-------|-----|
| `pnpm run typecheck` | PASS | |
| `pnpm run build` | PASS | |
| `pnpm run smoke:story-review-qa-visibility-guard` | PASS | `PERSISTENCE_MODE=memory` script içinde |
| `pnpm run smoke:social-moderation` | PASS | Local BFF `PERSISTENCE_MODE=memory` ile çalışırken |
| `pnpm run smoke:bff-actor-spoofing-guard` | PASS | |
| `pnpm run smoke:interaction-idempotency-duplicate-prevention` | PASS | Risk signal postgres bağlantı log’u catch edildi; smoke PASS |
| `pnpm run smoke:social` | PASS | Local BFF `PERSISTENCE_MODE=memory` ile çalışırken |
| `pnpm run smoke:media` | PASS | Local BFF `PERSISTENCE_MODE=memory` ile çalışırken |
| `pnpm run smoke:social-abuse-signal` | PASS | Local BFF `PERSISTENCE_MODE=memory` ile çalışırken |

## 12. Kalan Açık Noktalar
Kalan story/review/Q&A visibility blocker tespit edilmedi.

Not:
- Story alanı foundation seviyesinde store-story public visibility guard ile kapatıldı; gelişmiş feed/ranking/discovery engine bu paketin kapsamı dışında bırakıldı.

## 13. PHASE-06’ya Etki
Story visibility:
- CLOSED WITH LIMITATION

Review visibility / aggregate:
- CLOSED

Q&A moderation case:
- CLOSED

Smoke/test coverage:
- CLOSED

## 14. Nihai Karar
PHASE-06-FIX-03 Kararı:
- PASS WITH LIMITATION

Karar kriteri:
- Story pending/rejected public leak yok.
- Story publish approved + media-ready değilse blocked.
- Review pending/rejected public ve aggregate leak yok.
- Q&A question/answer moderation caseId deterministic.
- Q&A pending/rejected public leak yok.
- `smoke:social-moderation` PASS.
- Targeted smoke PASS.
- Typecheck/build PASS.
- Limitation: gelişmiş story feed/ranking/discovery engine ve durable projection bu paketin kapsamına alınmadı.

## 15. Sonraki Adım
PHASE-06-FIX-04 — Moderation Decision / Audit / Maker-Checker Readiness paketine geçilebilir.
