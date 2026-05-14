# PHASE-10F-05 — Operational Outbox Delivery Worker Foundation Report

## Görev özeti

Operational audit/outbox kayıtları için delivery worker foundation kuruldu. Worker gerçek refund execution, payout hold, ban, settlement mutation, provider call veya owner-domain truth mutation yapmaz; yalnızca outbox delivery lifecycle, dry-run owner handoff projection, retry ve dead-letter temelini yönetir.

## İncelenen repo gerçekliği

- `packages/persistence/src/operational-intent.ts`: operational intent + audit outbox persistence vardı; delivery state dar kapsamlıydı.
- `packages/persistence/src/audit-event.ts`: genel event outbox pending/published/failed + retryCount modeli vardı.
- `services/payment/src/reconciliation-worker.ts`: dry-run worker, owner-command eligibility ve kontrollü mutation ayrımı için ana pattern olarak incelendi.
- `services/payment/src/callback-worker.ts`: callback processing lifecycle ve owner transition mode ayrımı incelendi.
- `services/auth/src/token.ts`: internal token modeli HMAC dev foundation olarak incelendi; operational worker için signed-token TODO ve allowlist placeholder bırakıldı.
- `apps/bff/src/server/refund.ts`, `moderation.ts`, `risk.ts`, `ops-center.ts`: operational intent üretimi ve admin ops projection yüzeyi incelendi.

## Worker foundation durumu

- Yeni paket: `services/operational-outbox`.
- Worker: `runOperationalAuditOutboxWorkerDryRun`.
- Package adı: `@hx/operational-outbox`.
- Worker pending/failed outbox kayıtlarını repository üzerinden okur, `processing` ara durumunu üretir ve dry-run delivery projection döndürür.
- Worker hiçbir owner service import etmez ve provider/network çağrısı yapmaz.

## Delivery lifecycle durumu

Outbox delivery state flow genişletildi:

- `pending`
- `processing`
- `delivered`
- `failed`
- `dead_letter`

`packages/persistence/src/operational-intent.ts` ve migration bu state modeline göre güncellendi.

## Retry/dead-letter foundation

Outbox record alanları eklendi:

- `retryCount`
- `nextRetryAt`
- `lastError`
- `deadLetterReason`
- `lastDeliveryAttemptAt`

Repository metodları eklendi:

- `listDeliverableAuditOutbox`
- `markAuditOutboxProcessing`
- `markAuditOutboxDelivered`
- `markAuditOutboxFailed`
- `markAuditOutboxDeadLetter`

Dead-letter gerçek ceza veya final owner truth değildir; yalnızca delivery lifecycle projection state olarak ele alınır.

## Dry-run owner handoff durumu

Worker attempt projection state’leri:

- `handoff_simulated`
- `owner_accepted`
- `queued_for_owner`
- `retry_scheduled`
- `dead_lettered`

Kesinlikle üretilmeyen state’ler:

- refund completed
- payout blocked
- user banned
- moderation finalized
- fraud confirmed

## Internal service auth review

Worker input’unda explicit internal caller identity eklendi:

- `callerId: operational-audit-outbox-worker`
- `serviceName: @hx/operational-outbox`
- `allowlisted: true`
- `signedTokenTodo: TODO_SIGNED_INTERNAL_SERVICE_TOKEN`

Bu fazda signed token doğrulaması uygulanmadı; allowlist placeholder ve TODO bilinçli foundation sınırı olarak bırakıldı.

## Ops center integration

`/admin/ops` projection DTO ve handler güncellendi:

- delivery lifecycle görünürlüğü
- retry count
- next retry time
- dead-letter reason
- last delivery attempt
- delivery lifecycle projection

Bu alanlar projection-only döner; owner truth veya enforcement truth olarak sunulmaz.

## Boundary review

- Worker enforcement yapıyor mu? Hayır.
- Owner mutation çağrısı var mı? Hayır.
- Payout/refund mutation var mı? Hayır.
- Provider call var mı? Hayır.
- Settlement mutate ediliyor mu? Hayır.
- Dead-letter gerçek ceza gibi davranıyor mu? Hayır, delivery lifecycle state.
- Ops center final truth gösteriyor mu? Hayır, projection-only boundary flag’leri false.
- UI owner command placeholder butonları disabled hale getirildi; admin product detail yüzeyi owner command execute etmez.

## Build/typecheck/test sonuçları

- `pnpm.cmd run typecheck`: PASS.
- `pnpm.cmd run build`: PASS.
- `pnpm.cmd run smoke:operational-outbox-worker-dry-run`: PASS.
- `pnpm.cmd run smoke:refund-maker-checker-audit-foundation`: PASS.
- `pnpm.cmd run smoke:payment-reconciliation-worker-dry-run`: PASS.
- `pnpm.cmd --filter @hx/web run playwright`: 45/45 test `ok` görüldü; komut testler bittikten sonra process kapanmadığı için 240s timeout ile kesildi.

## Açık limitation’lar

- Internal-service signed token doğrulaması henüz yok; placeholder allowlist var.
- Postgres migration mevcut tek operational outbox migration içinde genişletildi; ayrıca ileri migration split yapılmadı.
- Delivery attempt history ayrı tabloya persist edilmiyor; projection worker result ve outbox üzerindeki son attempt alanı ile sınırlı.
- Playwright runner testleri bitirdikten sonra süreç kapanmıyor; bu fazda test failure kalmadı ama command exit timeout olarak raporlandı.

## Riskler

- İleride gerçek owner handoff eklendiğinde dry-run worker ile execute worker kesin ayrılmalı.
- Dead-letter ops UI’da ceza/final karar gibi yorumlanmamalı.
- Retry policy şu an foundation seviyesinde sabit gecikme kullanıyor; production policy ve jitter/backoff ayrı faz gerektirir.

## Sonraki önerilen paket

PHASE-10F-06 için öneri: operational delivery attempt persistence tablosu, signed internal service token validation ve worker scheduler/lease modeli.

## Nihai karar

PHASE-10F-05 başarı kriteri karşılandı. Operational outbox worker foundation çalışıyor, delivery lifecycle görünür, retry/dead-letter temeli mevcut ve gerçek enforcement veya owner mutation yapılmıyor.
