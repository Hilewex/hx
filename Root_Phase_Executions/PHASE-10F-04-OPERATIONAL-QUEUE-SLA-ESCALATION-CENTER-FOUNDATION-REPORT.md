# PHASE-10F-04 — Operational Queue / SLA / Escalation Center Foundation Report

## Görev özeti
- Refund / moderation / risk operational intent kayıtları için cross-domain admin ops center foundation eklendi.
- `/admin/ops` ve `/admin/ops/[id]` web route'ları oluşturuldu.
- BFF tarafında read-only projection endpoint'leri eklendi: `GET /admin/ops` ve `GET /admin/ops/:id`.
- SLA, priority, escalation ve audit delivery state yalnız projection seviyesinde hesaplanıyor/gösteriliyor.
- Bu fazda refund execution, payout hold execution, account/store ban, fraud confirmed truth, settlement mutation veya provider call eklenmedi.

## İncelenen repo gerçekliği
- Admin yüzeyleri `apps/web/src/components/admin-ops-surface.tsx` içinde tek component/surface dallanmasıyla yönetiliyor.
- Mevcut admin route'ları `apps/web/app/admin` altında ürün, refund, moderation ve risk queue/detail sayfaları olarak duruyor.
- Web BFF client projection okumaları `apps/web/src/lib/bff/admin.ts` üzerinden yapılıyor.
- BFF refund/moderation/risk route'ları operational intent command'lerini kalıcı intent/audit outbox foundation'a yazıyor.
- `packages/persistence/src/operational-intent.ts` kayıt, idempotency ve latest target read sağlıyordu; queue/detail read için listeleme ve intent-id read eksikti.
- `operational_audit_intent_outbox` delivery worker hâlâ yok; delivery state çoğunlukla `pending` projection olarak kalıyor.

## Route durumu
- Web route eklendi: `/admin/ops`.
- Web detail route eklendi: `/admin/ops/[id]`.
- Admin dashboard summary içine ops center link'i eklendi.
- BFF route eklendi: `GET /admin/ops`.
- BFF detail route eklendi: `GET /admin/ops/:id`.

## Cross-domain queue projection durumu
- DTO eklendi: `OperationalQueueProjection`.
- DTO eklendi: `OperationalQueueItemProjection`.
- DTO eklendi: `OperationalEscalationProjection`.
- DTO eklendi: `OperationalSlaProjection`.
- DTO eklendi: `OperationalPriorityProjection`.
- DTO eklendi: `OperationalAuditStatusProjection`.
- Queue item alanları intent id, domain, target, action, workflow, maker/checker summary, reason, evidence count, priority, SLA, escalation, audit state ve boundary flags içeriyor.
- Boundary flags sabit false: `ownerTruthMutated`, `enforcementExecuted`, `payoutBlockedTruth`, `refundExecutionTruth`, `auditMutationTruth`.

## BFF projection endpoint durumu
- Yeni server module: `apps/bff/src/server/ops-center.ts`.
- BFF endpoint operational intent repository read kullanıyor.
- Persistence'a read API eklendi: `listOperationalIntents`, `getOperationalIntentById`, `getOperationalAuditOutboxByIntentId`.
- BFF endpoint owner-domain servis mutation çağırmıyor.
- Audit outbox sadece okunuyor; delivery state değiştirmiyor.
- Query foundation destekleri: domain, workflow state, priority ve search.

## UI ops center durumu
- `/admin/ops` queue görünümü domain, workflow state, priority ve search filter'ları içeriyor.
- Queue item'larında SLA state, escalation state ve audit delivery state görünür.
- Detail linkleri `/admin/ops/[id]` route'una gidiyor.
- Empty, degraded ve error states mevcut admin projection state component'leriyle gösteriliyor.
- UI final truth state üretmiyor veya göstermiyor.

## SLA/priority projection durumu
- Priority yalnız projection: `low`, `medium`, `high`, `critical`.
- SLA yalnız projection: `normal`, `at_risk`, `overdue`, `escalated`.
- SLA hesaplaması intent creation time ve priority target minute üzerinden yapılıyor.
- SLA hesaplaması enforcement, ceza, payout hold veya owner mutation tetiklemiyor.

## Escalation visibility durumu
- Escalation state yalnız görünürlük: `none`, `visible`, `recommended`, `escalated`.
- Escalation target projection domain'e göre FINANCE / MODERATION_OWNER / RISK_OWNER olarak gösteriliyor.
- Yeni escalation command eklenmedi.
- Mevcut protected command intent pattern'i dışında direct mutation yazılmadı.

## Boundary review
- BFF direct owner mutation yapıyor mu: Hayır. Ops center endpoint sadece operational intent ve audit outbox read projection yapıyor.
- Ops center queue owner truth gibi davranıyor mu: Hayır. Queue item'ları projection-only boundary flags ile dönüyor.
- SLA hesaplaması enforcement tetikliyor mu: Hayır. `enforcementTriggered: false`.
- UI final truth gösteriyor mu: Hayır. Ops UI final truth state metinleri üretmiyor.
- Audit/outbox read owner mutation ile karışıyor mu: Hayır. Audit delivery state read-only projection olarak gösteriliyor.

## Build/typecheck/test sonuçları
- `pnpm.cmd run typecheck`: Başarılı.
- `pnpm.cmd run build`: Başarılı.
- `pnpm.cmd smoke:refund-command-security-hardening`: Başarılı.
- `pnpm.cmd smoke:refund-maker-checker-audit-foundation`: Başarılı.
- `pnpm.cmd smoke:moderation-workflow`: Başarılı.
- `pnpm.cmd smoke:moderation-decision-audit-maker-checker`: Başarılı.
- `pnpm.cmd smoke:risk-signal`: Başarılı.
- `pnpm.cmd smoke:fraud-signal-review-false-positive-guard`: Başarılı.
- `pnpm.cmd --filter @hx/web run playwright`: 45 test raporlandı; 44 `ok`, 1 `x`. Test listesi bittikten sonra process kapanışında 600s timeout ile exit 124 döndü.

## Açık limitation'lar
- Operational audit outbox delivery worker hâlâ yok.
- SLA/priority gerçek ops policy engine değil; projection heuristic olarak kaldı.
- `/admin/ops` BFF read endpoint doğrudan persistence read API kullanıyor; ileride ayrı ops-read service boundary'ye taşınabilir.
- Web UI filter'ları client-side uygulanıyor; BFF query filter foundation mevcut ama web read helper şu an tüm queue projection'ı çekiyor.
- Postgres migration bu turda çalıştırılmadı.

## Riskler
- In-memory mode process-local olduğu için ops center queue yalnız aynı BFF process içindeki operational intent kayıtlarını gösterir.
- `INTERNAL_SERVICE_ACTOR_ALLOWLIST` boşsa legacy owner-domain internal route riski önceki fazdaki gibi devam eder.
- SLA threshold'ları projection heuristic olduğu için operasyonel karar standardı gibi kullanılmamalı.
- Audit outbox pending kayıtları worker olmadığı için teslim edilmez.

## Sonraki önerilen paket
- Operational read service boundary çıkarılması ve BFF'in persistence dependency'sinin servis arkasına alınması.
- Ops center endpoint için dedicated smoke test: intent oluştur, `/admin/ops` ve `/admin/ops/:id` projection doğrula.
- BFF query filter'larını web read helper'a bağlama.
- Operational audit outbox worker dry-run: delivery state transition only, owner mutation yok.
- Signed service-to-service auth ve internal caller allowlist zorunluluğu.

## Nihai karar
Refund, moderation ve risk operational intent kayıtları tek admin ops center projection yüzeyinde görünür hale getirildi. SLA, priority, escalation ve audit delivery state projection olarak gösteriliyor. Bu faz owner truth, enforcement, payout, settlement, fraud confirmation veya provider mutation üretmedi.
