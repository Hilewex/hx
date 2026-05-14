# PHASE-10F-06 — Signed Internal Service Auth & Worker Lease Foundation Report

## Görev özeti

Operational worker ve internal owner-domain route’lar için signed service-to-service auth foundation ve worker lease/scheduler foundation kuruldu. Bu faz gerçek refund execution, payout hold, account/store ban, settlement mutation, provider call veya owner-domain truth mutation yapmaz.

## İncelenen repo gerçekliği

- `services/auth/src/token.ts`: mevcut actor auth HMAC token modeli incelendi; internal service token için ayrı dev/test HMAC foundation eklendi.
- `apps/bff/src/server/guards.ts` ve `context.ts`: actor context üretimi ve internal route guard akışı incelendi; signed internal token route scope doğrulaması bağlandı.
- `apps/bff/src/server/moderation.ts`, `risk.ts`, `fraud.ts`: legacy owner-domain review route’larının `requireInternalService` arkasında olduğu doğrulandı.
- `services/operational-outbox/src/operational-audit-outbox-worker.ts`: dry-run delivery lifecycle incelendi; lease claim zorunlu hale getirildi.
- `packages/persistence/src/operational-intent.ts`: operational audit outbox state/retry modeli incelendi; lease alanları ve claim/release repository metodları eklendi.
- `tests/smoke/auth-utils.ts`: smoke token helper’ları incelendi; signed internal service header üretimi eklendi.
- Mevcut payment worker pattern’leri tekrar boundary açısından kontrol edildi; operational worker owner service import etmeden dry-run kalacak şekilde korundu.

## Signed internal auth durumu

- Internal service token foundation eklendi: `serviceName`, `callerId`, `issuedAt`, `expiresAt`, `allowedAudience`, `signature`.
- BFF `x-internal-service-token` header’ını route pathname audience/scope olarak doğruluyor.
- Internal token, normal `Authorization: Bearer` actor token’ından ayrı doğrulanıyor.
- `requireInternalService` artık `INTERNAL_SERVICE` role tek başına yeterli görmüyor; signed token metadata’sı ve caller identity eşleşmesi gerekiyor.
- Production secret yönetimi eklenmedi; `INTERNAL_SERVICE_TOKEN_SECRET` yoksa dev/test fallback secret kullanılıyor.

## Internal allowlist durumu

- `INTERNAL_SERVICE_ACTOR_ALLOWLIST` boşsa warning üretiliyor.
- Allowlist doluysa `context.actorId` allowlist içinde olmak zorunda.
- Explicit caller identity `context.internalService.callerId` üzerinden okunuyor ve authenticated internal actor id ile eşleştiriliyor.
- Legacy owner-domain route’lar admin token ile çalışmıyor; admin token 403 alıyor.

## Worker lease durumu

Outbox lease alanları eklendi:

- `leaseOwner`
- `leaseUntil`
- `claimedAt`
- `processingStartedAt`

Repository metodları eklendi:

- `claimAuditOutboxLease`
- `releaseAuditOutboxLease`

Worker artık pending/failed deliverable kayıtları listeledikten sonra işlemeye başlamadan önce lease claim almak zorunda. Claim başarısızsa kayıt işlenmiyor ve duplicate claim olarak atlanıyor.

## Scheduler foundation durumu

- `runOperationalOutboxSchedulerFoundation` eklendi.
- Scheduler foundation dry-run worker’ı çağırıyor.
- Single-run/batch foundation seviyesi ile sınırlı.
- Max batch size `limit` ile kontrol ediliyor.
- No enforcement mode korunuyor: owner mutation, provider call veya financial mutation yok.

## Ops center visibility

Ops center projection’a lease visibility eklendi:

- lease owner
- lease until
- claimed at
- processing started at
- lease state
- processing age
- delivery attempt lease state

Bu alanlar projection-only döner; final owner-domain truth veya enforcement truth olarak sunulmaz.

## Boundary review

- Internal route admin token ile çağrılabiliyor mu? Hayır; admin token legacy owner-domain review route’larında 403 alıyor.
- Signed token required mı? Evet; `INTERNAL_SERVICE` actor token tek başına yeterli değil.
- Worker duplicate claim yapabiliyor mu? Foundation seviyesinde hayır; active lease varken ikinci claim null dönüyor ve worker kaydı işlemiyor.
- Worker owner mutation yapıyor mu? Hayır; operational-outbox worker’da owner service import, provider call veya mutation handler çağrısı yok.
- Lease state final truth gibi gösteriliyor mu? Hayır; ops center lease alanları projection-only açıklamasıyla dönüyor.

## Build/typecheck/test sonuçları

- `pnpm.cmd run typecheck`: PASS.
- `pnpm.cmd run build`: PASS.
- `pnpm.cmd run smoke:operational-outbox-worker-dry-run`: PASS.
- `pnpm.cmd run smoke:internal-service-auth`: PASS.
- `pnpm.cmd run smoke:operational-outbox-worker-lease`: PASS.
- `pnpm.cmd run smoke:moderation-workflow`: PASS.
- `pnpm.cmd run smoke:risk-signal`: PASS.
- `pnpm.cmd run smoke:fraud-signal-review-false-positive-guard`: PASS.
- `pnpm.cmd --filter @hx/web run playwright`: 45/45 test `ok` görüldü; runner testler bittikten sonra kapanmadığı için 300s timeout ile kesildi.

## Açık limitation’lar

- Internal service token secret management production-ready değil; dev/test fallback secret var.
- Replay/nonce store yok; token TTL ve HMAC signature foundation seviyesi.
- Allowlist boşken warning üretiliyor ama dev/test uyumluluğu için signed token varsa çağrı tamamen kapatılmıyor.
- Lease modeli distributed production scheduler değildir; claim/release foundation sağlar.
- Delivery attempt history ayrı tabloya persist edilmiyor; son lease/processing alanları outbox üzerinde tutuluyor.

## Riskler

- Production’a geçmeden önce secret rotation, nonce/replay guard ve service registry gerekir.
- Lease timeout/backoff/jitter politikası production scheduler fazına bırakıldı.
- Worker crash sonrası expired lease recovery sadece foundation seviyesinde `leaseUntil` üzerinden mümkün.
- Ops UI’da lease state operasyonel koordinasyon sinyali olarak kalmalı; final owner-domain karar gibi yorumlanmamalı.

## Sonraki önerilen paket

PHASE-10F-07 için öneri: internal service token nonce/replay persistence, service registry/audience policy tablosu, delivery attempt history persistence ve scheduler lease recovery/backoff modeli.

## Nihai karar

PHASE-10F-06 başarı kriteri karşılandı. Internal owner-domain route’lar signed/internal caller discipline’a hazırlandı, operational outbox worker duplicate claim riskine karşı lease foundation kazandı ve gerçek enforcement veya owner mutation yapılmadı.
