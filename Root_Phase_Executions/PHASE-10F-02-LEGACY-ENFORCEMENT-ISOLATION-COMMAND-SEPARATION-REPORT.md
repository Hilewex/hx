# PHASE-10F-02 — Legacy Enforcement Isolation & Command Separation Report

## Gorev ozeti
- Yeni moderation/risk operational intent flow ile legacy owner-domain review path'leri ayrildi.
- `/moderation/review`, `/risk/case/review` ve `/fraud/review` internal-service only hale getirildi.
- Legacy review response'larina internal/deprecated route classification ve operational workflow replacement uyarisi eklendi.
- `/moderation/intent` ve `/risk/intent` projection-safe, audit-intent, maker-checker disiplinli ve no-enforcement olarak korundu.
- Smoke testler eski admin direct review beklentisi yerine legacy 403 + operational intent acceptance beklentisine guncellendi.

## Incelenen repo gercekligi
- `apps/bff/src/server/moderation.ts` yeni admin projection ve `/moderation/intent` path'ini tasiyor; legacy `/moderation/review` moderation owner case state'ini `reviewModerationCase` ile mutate ediyor.
- `apps/bff/src/server/risk.ts` yeni admin projection ve `/risk/intent` path'ini tasiyor; legacy `/risk/case/review` risk owner case state'ini `reviewRiskCase` ile mutate ediyor.
- `apps/bff/src/server/fraud.ts` fraud signal/case/false-positive path'lerini risk operator guard ile koruyor; `/fraud/review` fraud owner review state'ini mutate ediyor.
- `apps/web/src/lib/bff/admin.ts` admin moderation/risk command adapter'larinda yalniz `/moderation/intent` ve `/risk/intent` cagiriyor.
- `apps/bff/src/server/index.ts` legacy moderation route'larini iki kez map ediyor; handler internal guard'a alindigi icin iki mapping de admin/operator icin kapali.

## Legacy route siniflandirmasi
- Operational intent route: `POST /moderation/intent`, `POST /risk/intent`.
- Admin projection read route: `GET /admin/moderation`, `GET /admin/moderation/:id`, `GET /admin/risk`, `GET /admin/risk/:id`.
- Owner-domain internal route: `POST /moderation/review`, `POST /risk/case/review`, `POST /fraud/review`.
- Protected non-public owner/signal routes: `POST /moderation/create`, `POST /moderation/case/create`, `GET /moderation/list`, `GET /moderation/get`, `POST /risk/signal`, `GET /risk/signal/list`, `POST /risk/case`, `GET /risk/case`, `GET /risk/case/list`, `POST /fraud/signal`, `POST /fraud/case`, `POST /fraud/false-positive/review`.
- Legacy/deprecated for admin operational workflow: `POST /moderation/review`, `POST /risk/case/review`, `POST /fraud/review`.

## Operational intent flow durumu
- `/moderation/intent` actor context, makerActorId, checkerActorId, reasonCode, evidenceRefs ve idempotencyKey dogrulamaya devam ediyor.
- `/risk/intent` ayni maker-checker/idempotency/evidence disiplinini koruyor.
- Intent path'lerinde owner review service call, payout mutation, account/store ban, fraud confirmation veya enforcement execution yok.
- Boundary flags `enforcementExecuted: false`, `payoutBlockedTruth: false`, `moderationTruthMutated: false`, `riskTruthMutated: false`, `auditMutationTruth: false` olarak kaldi.

## Contract/DTO ayrimi
- `packages/contracts/src/moderation.ts` icine `OperationalIntentRequest`, `OwnerDomainReviewCommand`, `LegacyReviewCommandDeprecated` eklendi.
- `packages/contracts/src/risk.ts` icine `RiskOperationalIntentRequest`, `OwnerDomainRiskReviewCommand`, `LegacyRiskReviewCommandDeprecated` eklendi.
- `packages/contracts/src/fraud.ts` icine `OwnerDomainFraudReviewCommand`, `LegacyFraudReviewCommandDeprecated` eklendi.
- Ayrim alanlari: `operationalIntentOnly`, `enforcementExecuted`, `ownerMutationTruth`, `payoutBlockedTruth`, `deprecatedForOperationalWorkflow`, `internalOnly`.

## Test guncellemeleri
- `smoke:moderation-workflow` artik admin `/moderation/review` icin 403 bekliyor, sonra `/moderation/intent` kabulunu ve owner state'in degismedigini dogruluyor.
- `smoke:risk-signal` artik admin `/risk/case/review` icin 403 bekliyor, `/risk/intent` no payout/no enforcement kabulunu ve internal-service owner review classification'ini dogruluyor.
- `smoke:fraud-signal-review-false-positive-guard` artik admin `/fraud/review` icin 403 bekliyor ve fraud owner review'u internal-service token ile test ediyor.
- `smoke:moderation-decision-audit-maker-checker` BFF legacy admin review beklentisini legacy 403 + `/moderation/intent` kabulune cevirdi.
- `tests/smoke/auth-utils.ts` icine `getInternalServiceHeaders` eklendi.

## Boundary review
- Admin UI legacy route cagiriyor mu: Hayir. `apps/web/src/lib/bff/admin.ts` sadece `/moderation/intent` ve `/risk/intent` kullaniyor.
- Legacy route public/admin accessible mi: Public degil; admin/risk/moderator icin review path'leri 403, sadece `INTERNAL_SERVICE` kabul ediyor.
- Intent route enforcement yapiyor mu: Hayir.
- Risk route owner state mutate ediyor mu: Legacy `/risk/case/review` internal-service ile risk owner case state mutate ediyor; admin operational flow'dan ayrildi.
- Moderation route target owner mutation yapiyor mu: BFF legacy `/moderation/review` target owner handoff execute etmiyor; moderation owner case review state'i internal-service ile sinirli.
- Payout hold direct mutation var mi: Yeni moderation/risk intent path'lerinde yok; risk intent payout hold'u recommendation/audit intent olarak tutuyor.

## Build/typecheck/test sonuclari
- `pnpm.cmd --filter @hx/contracts run build`: Basarili.
- `pnpm.cmd run typecheck`: Basarili.
- `pnpm.cmd run build`: Basarili.
- `pnpm.cmd smoke:moderation-workflow`: Basarili.
- `pnpm.cmd smoke:moderation-decision-audit-maker-checker`: Basarili.
- `pnpm.cmd smoke:risk-signal`: Basarili.
- `pnpm.cmd smoke:fraud-signal-review-false-positive-guard`: Basarili.
- `pnpm.cmd --filter @hx/web run playwright`: 45 test calisti; 44 `ok`, 1 `x`. Komut testlerin ardindan process/webServer kapanisinda 420s timeout ile sonlandi.

## Acik limitation'lar
- Operational workflow state ve audit intent outbox hala bellek ici.
- `apps/bff/src/server/index.ts` icinde moderation legacy route mapping'i duplicate duruyor; guard sayesinde davranis guvenli ama ileride sadeleştirilmeli.
- Eski `social` ve `social-moderation` smoke suite'lerinde `/moderation/review` referansi duruyor; bu fazda istenen smoke seti guncellendi.
- Internal-service token modeli dev/smoke seviyesinde; production owner-domain caller kimligi ayrica netlestirilmeli.

## Riskler
- Internal-service role genis kullanilirsa legacy owner-domain review path'leri tekrar operational workflow gibi kullanilabilir.
- Risk/fraud owner review path'leri owner state mutate etmeye devam eder; bu artik internal-only ama kalici audit/approval modeli henuz yok.
- Moderation legacy review owner handoff execute etmiyor; final owner-domain review pipeline ileride explicit worker/handoff ile tasarlanmazsa review state ayrimi eksik kalabilir.
- Playwright komutu testleri bitirdikten sonra kapanista timeout veriyor; test sonucu okunabilir ama process lifecycle sorunu ayrica ele alinmali.

## Sonraki onerilen paket
- Persistent moderation/risk operational workflow read/write model.
- Persistent audit intent outbox ve owner-domain worker teslim modeli.
- Internal-service caller allowlist veya signed service-to-service auth.
- `index.ts` duplicate moderation route mapping cleanup.
- Eski social smoke suite'lerinin yeni operational intent veya internal owner-domain ayrimina gore ayrilmasi.

## Nihai karar
Admin operational flow legacy direct review path'lerinden ayrildi. Yeni moderation/risk intent route'lari enforcement, fraud blocking, payout hold execution, account/store ban veya final owner truth uretmiyor. Legacy review path'leri owner-domain internal route olarak izole edildi ve istenen smoke testler yeni boundary beklentisiyle uyumlu hale getirildi.
