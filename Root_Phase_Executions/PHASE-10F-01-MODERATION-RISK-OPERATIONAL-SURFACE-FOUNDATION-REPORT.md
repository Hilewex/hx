# PHASE-10F-01 — Moderation & Risk Operational Surface Foundation Report

## Gorev ozeti
- Moderation ve Risk admin operasyon yuzeyleri foundation seviyesinde eklendi.
- `/admin/moderation`, `/admin/moderation/[id]`, `/admin/risk`, `/admin/risk/[id]` route'lari olusturuldu.
- Queue/detail projection adapter'lari moderation/risk review, escalation, evidence/audit ve payout hold recommendation gorunurlugu icin eklendi.
- UI action panel yalniz review, escalation, require evidence ve recommend payout hold intent gonderecek sekilde baglandi.
- BFF moderation/risk intent path'leri protected, role-scoped, maker-checker/idempotency/reason/evidence disiplinli ve audit-intent foundation olarak eklendi.
- Gercek moderation enforcement, fraud blocking, payout hold execution veya ceza sistemi uretilmedi.

## Incelenen repo gercekligi
- `apps/bff/src/server/moderation.ts` mevcut moderation create/list/get/review path'lerini iceriyordu; review path'i once target owner servislerine direct handoff cagiriyordu.
- `apps/bff/src/server/risk.ts` risk signal/case/review/list/get path'lerini `requireRiskOperator` ile koruyordu; risk owner service review case state'ini mutate ediyor.
- `apps/bff/src/server/fraud.ts` fraud signal/case/review/false-positive path'lerini role-scoped sekilde koruyor; fraud review evidence uretir ama owner mutation yapmaz.
- `apps/bff/src/server/guards.ts` moderation icin `ADMIN | MODERATOR`, risk/fraud icin `ADMIN | RISK_OPERATOR` scope kullaniyor.
- `packages/contracts/src/moderation.ts` ve `packages/contracts/src/risk.ts` owner DTO'lari vardi; frontend-safe operational projection DTO'lari yoktu.
- `apps/web/src/components/admin-ops-surface.tsx` admin products/refunds desenini projection-safe gosteren ana yuzey olarak kullaniliyor.
- `apps/web/src/lib/bff/admin.ts` admin projection read ve protected command adapter desenini zaten refunds/products icin tasiyordu.

## Route durumu
- Web route'lari:
  - `/admin/moderation`
  - `/admin/moderation/[id]`
  - `/admin/risk`
  - `/admin/risk/[id]`
- BFF read route'lari:
  - `GET /admin/moderation`
  - `GET /admin/moderation/:id`
  - `GET /admin/risk`
  - `GET /admin/risk/:id`
- BFF intent route'lari:
  - `POST /moderation/intent`
  - `POST /risk/intent`

## DTO/contract durumu
- Eklendi:
  - `ModerationReviewQueueProjection`, `ModerationReviewDetailProjection`
  - `RiskReviewQueueProjection`, `RiskReviewDetailProjection`
  - `ModerationEvidenceProjection`, `RiskEvidenceProjection`
  - `ModerationEscalationProjection`, `RiskEscalationProjection`
- Boundary flags:
  - `moderationTruthMutated: false`
  - `riskTruthMutated: false`
  - `payoutBlockedTruth: false`
  - `enforcementExecuted: false`
  - `auditMutationTruth: false`

## Projection adapter durumu
- Moderation adapter mevcut moderation owner case/list verisini projection-safe metinlere ceviriyor.
- Risk adapter mevcut risk owner case/list verisini projection-safe metinlere ceviriyor.
- Owner kaydi yoksa placeholder/degraded projection uretiliyor; final truth uretilmiyor.
- Payout hold yalniz recommendation projection olarak gorunuyor.

## UI operational surface durumu
- Admin dashboard'dan moderation ve risk queue route'larina link eklendi.
- Queue/detail yuzeyleri severity/risk level, evidence preview, escalation, related context, audit/evidence ve payout hold recommendation gosteriyor.
- Action panel yalniz protected intent gonderiyor:
  - review intent
  - escalation intent
  - require evidence intent
  - recommend payout hold intent
- UI user banned, payout blocked, enforcement completed, fraud confirmed veya moderation finalized truth gostermiyor.

## Protected command durumu
- Moderation/risk intent path'leri actor context, makerActorId, checkerActorId, reasonCode, evidenceRefs ve idempotencyKey dogruluyor.
- `makerActorId` authenticated actor ile eslesmek zorunda.
- `checkerActorId === makerActorId` reddediliyor.
- Intent sonucunda bellek ici workflow state `checker_required / checked / rejected / escalated` olarak tutuluyor.
- Intent path'leri owner enforcement, payout mutation, settlement mutation, account ban veya store suspension execute etmiyor.

## Audit/evidence durumu
- Moderation/risk icin bellek ici audit-intent outbox foundation eklendi.
- Audit intent actor, action, target, reasonCode, evidenceRefs, maker-checker context, idempotencyKey ve boundary flags tasiyor.
- Evidence projection owner evidence/snapshot/signal referanslarini gosteriyor; evidence owner mutation yapmiyor.
- Audit intent persistence foundation `persisted: true` olarak bellek ici kaydediliyor; auditMutationTruth false kalir.

## Boundary review
- BFF moderation/risk operational projection path'lerinde `@hx/persistence` import leakage yok.
- BFF moderation review path'indeki eski direct owner handoff import/call'lari kaldirildi.
- BFF intent path'lerinde payout hold direct mutation yok.
- UI fraud confirmed, payout blocked, banned, finalized moderation veya enforcement completed truth uretmiyor.
- Escalation projection-safe: visibility/recommendation olarak gosteriliyor.
- Evidence/audit ayrimi korunuyor: evidence preview ve audit intent ayri alanlarda, owner mutation truth false.
- Services tarafinda `services/moderation`, `services/risk`, `services/fraud` icinde persistence/audit importlari mevcut; bu BFF operational surface disinda owner/service limitation olarak kalir.

## Build/typecheck/test sonuclari
- `pnpm.cmd --filter @hx/contracts run build`: Basarili.
- `pnpm.cmd run typecheck`: Basarili.
- `pnpm.cmd run build`: Basarili.
- `pnpm.cmd smoke:moderation-decision-audit-maker-checker`: Basarili.
- `pnpm.cmd smoke:risk-signal`: Basarili.
- `pnpm.cmd smoke:fraud-signal-review-false-positive-guard`: Basarili.
- `pnpm.cmd smoke:moderation-workflow`: Basarisiz. Eski smoke moderation review sonrasi owner domain truth degisimini bekliyor; bu fazda direct owner enforcement kaldirildigi icin beklenti yeni boundary ile uyumsuz.
- `pnpm.cmd --filter @hx/web run playwright`: 45 test calisti; 44 `ok`, 1 `x`; komut webServer/process kapanisinda 360s timeout'a dustu ve `/api/bff/[...path]` static path generation log'u basti.

## Acik limitation'lar
- Moderation/risk workflow state ve audit-intent outbox bellek ici; process restart sonrasi kalici degil.
- Admin browser auth token/actor wiring gercek moderator/risk operator session entegrasyonuna bagli.
- Queue adapter'lari owner list/read verisine veya placeholder'a dayanir; zengin order/store/user/post join modeli yok.
- Checker assignment, dual approval persistence ve escalation state machine kalici owner model degil.
- Payout hold recommendation payout owner'a teslim edilmiyor; yalniz projection ve intent foundation.

## Riskler
- Eski `/moderation/review` path'i moderation owner case status'unu degistirmeye devam eder; target owner enforcement kaldirildi ama final moderation workflow icin ileride ayrica ayrilmasi gerekir.
- Risk owner service `reviewRiskCase` risk case status'unu mutate eder; yeni admin UI audit-only `/risk/intent` kullanir, fakat legacy route dikkatli korunmali.
- Services katmaninda persistence/audit importlari mevcut; BFF operational surface ile karistirilirsa audit mutation truth algisi dogabilir.
- UI env actor degerleri auth token actor'i ile eslesmezse makerActorId dogrulamasi intent'i reddeder.

## Sonraki onerilen paket
- Persistent moderation/risk review workflow read/write model.
- Persistent audit intent outbox + worker teslim modeli.
- Checker assignment, rejection reason ve dual approval state machine.
- Admin/moderator/risk session-based actor wiring.
- Queue filtering, priority, SLA ve order/store/user/post/payout projection join.
- Legacy `/moderation/review` ve `/risk/case/review` path'lerini owner-domain review ile operational intent olarak net ayirma.

## Nihai karar
Moderation/Risk operasyon yuzeyleri projection-safe foundation olarak kuruldu. Protected command intent modeli kullaniliyor ve yeni UI path'leri gercek enforcement, fraud blocking, payout hold execution, ceza sistemi veya final moderation truth uretmiyor.
