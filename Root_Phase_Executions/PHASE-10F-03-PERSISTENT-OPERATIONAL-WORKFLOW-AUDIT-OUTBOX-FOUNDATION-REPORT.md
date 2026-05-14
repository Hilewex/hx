# PHASE-10F-03 — Persistent Operational Workflow & Audit Outbox Foundation Report

## Görev özeti
- Refund / moderation / risk operational intent workflow ve audit intent outbox yapıları bellek içi BFF Map/Set kullanımından kalıcı repository foundation seviyesine taşındı.
- BFF, operational intent için doğrudan persistence yazmıyor; refund/moderation/risk servis wrapper fonksiyonlarını çağırıyor.
- Bu fazda refund execution, payout hold execution, account ban, store suspension, settlement mutation, fraud confirmation veya provider call eklenmedi.
- Refund transition operational endpoint'i owner refund state transition çağrısı yapmak yerine kalıcı intent/outbox kaydına çevrildi.
- Internal-service legacy owner-domain route guard'ına allowlist placeholder ve signed service-to-service TODO eklendi.

## İncelenen repo gerçekliği
- `apps/bff/src/server/refund.ts` içinde `Set`, `Map` tabanlı idempotency, workflow store ve audit intent outbox vardı.
- `apps/bff/src/server/moderation.ts` içinde `Map` tabanlı moderation workflow ve audit intent outbox vardı; legacy `/moderation/review` internal owner review path olarak kalıyor.
- `apps/bff/src/server/risk.ts` içinde `Map` tabanlı risk workflow ve audit intent outbox vardı; legacy `/risk/case/review` internal owner review path olarak kalıyor.
- `apps/bff/src/server/fraud.ts` fraud owner review mutation path'ini internal service guard ile koruyor; bu faz fraud için yeni operational intent route eklemedi.
- Mevcut durable audit/event altyapısı `packages/persistence/src/audit-event.ts` altında `audit_logs` ve `event_outbox` için vardı.
- Worker örneği payment reconciliation/callback tarafında var; bu faz operational outbox için worker/enforcement eklemedi.
- Dev/smoke internal token modeli `services/auth` token çözümü ve `tests/smoke/auth-utils.ts` içindeki `INTERNAL_SERVICE` rol token'ı ile çalışıyor.

## Persistent operational intent modeli
- Yeni repository: `packages/persistence/src/operational-intent.ts`.
- Yeni migration: `infra/migrations/20260512_001_operational_intent_audit_outbox_foundation.sql`.
- Tablo: `operational_intents`.
- Alanlar: `intent_id`, `domain`, `target_id`, `action_type`, `maker_actor_id`, `checker_actor_id`, `workflow_state`, `reason_code`, `evidence_refs`, `idempotency_key`, `boundary_flags`, `input_fingerprint`, `created_at`, `updated_at`.
- Workflow state seti: `prepared`, `checker_required`, `checked`, `rejected`, `escalated`, `owner_handoff_pending`, `owner_handoff_ready`.
- Domain servis wrapper'ları:
  - `services/refund/src/operational-intent.ts`
  - `services/moderation/src/operational-intent.ts`
  - `services/risk/src/operational-intent.ts`

## Persistent audit outbox modeli
- Tablo: `operational_audit_intent_outbox`.
- Alanlar: `outbox_id`, `intent_id`, `domain`, `target_id`, `actor_id`, `action_type`, `reason_code`, `evidence_refs`, `maker_checker_context`, `idempotency_key`, `delivery_state`, `created_at`, `delivered_at`.
- Delivery state seti: `pending`, `delivered`, `failed`, `dead_letter`.
- Bu fazda delivery worker yok; kayıt `pending` olarak kalıyor.
- Audit outbox owner truth ile karışmıyor; boundary flag'ler false kalıyor.

## Idempotency persistence durumu
- Operational intent repository `idempotency_key` unique foundation kullanıyor.
- Aynı idempotency key ve aynı payload replay edilirse önceki intent/outbox kaydı döndürülüyor.
- Aynı idempotency key farklı payload ile kullanılırsa `OPERATIONAL_INTENT_IDEMPOTENCY_CONFLICT` güvenli conflict'e çevriliyor.
- In-memory repository smoke/dev için aynı contract'ı uygular; postgres repository migration ile kalıcı modele hazır.

## Internal service auth review
- `requireInternalService` artık sadece `INTERNAL_SERVICE` rolünü değil, opsiyonel `INTERNAL_SERVICE_ACTOR_ALLOWLIST` actor allowlist'ini de kontrol ediyor.
- Production için signed service-to-service caller claim TODO eklendi.
- Legacy owner-domain review route'ları hâlâ `INTERNAL_SERVICE` ile çağrılabiliyor; allowlist boşsa dev/smoke davranışı korunuyor.

## UI etkisi
- Admin UI command status görünümü izin verilen operational state metinlerine indirildi: intent recorded, checker required, checked, escalated, owner handoff pending.
- Audit UI state'i `pending` / `delivered` sözlüğüne çekildi; bu fazda persisted outbox delivery `pending`.
- UI final truth göstermiyor: refund completed, user banned, payout blocked, fraud confirmed, settlement adjusted state'i üretilmiyor.

## Boundary review
- BFF direct persistence yapıyor mu: Hayır; BFF domain servis wrapper çağırıyor.
- Audit persistence owner truth ile karışıyor mu: Hayır; ayrı operational audit intent outbox olarak kaydediliyor.
- Owner mutation yapıldı mı: Yeni operational intent path'lerinde hayır. Legacy internal owner review path'leri mevcut owner mutation davranışını internal-service sınırında koruyor.
- Worker enforcement yaptı mı: Hayır; operational outbox worker eklenmedi.
- Internal service route'ları hâlâ fazla açık mı: Evet, allowlist boş bırakılırsa rol tabanlı dev modeli geniş kalır.
- UI final truth gösteriyor mu: Hayır; görünür command/audit state metinleri operational intent seviyesinde tutuldu.

## Build/typecheck/test sonuçları
- `pnpm.cmd run typecheck`: Başarılı.
- `pnpm.cmd run build`: Başarılı.
- `pnpm.cmd smoke:refund-command-security-hardening`: Başarılı.
- `pnpm.cmd smoke:refund-maker-checker-audit-foundation`: Başarılı.
- `pnpm.cmd smoke:moderation-workflow`: Başarılı.
- `pnpm.cmd smoke:moderation-decision-audit-maker-checker`: Başarılı.
- `pnpm.cmd smoke:risk-signal`: Başarılı.
- `pnpm.cmd smoke:fraud-signal-review-false-positive-guard`: Başarılı.
- `pnpm.cmd --filter @hx/web run playwright`: 45 test çalıştı; 44 `ok`, 1 `x`. Testler bittikten sonra process kapanışında 480s timeout ile exit 124 döndü.

## Açık limitation'lar
- Operational outbox delivery worker yok.
- Postgres migration eklendi ama bu turda gerçek postgres migration çalıştırılmadı.
- `packages/persistence/src/*.d.ts` stale source declaration pattern'i nedeniyle yeni operational declaration dosyası ayrıca eklendi; bu repo build düzeni ileride sadeleştirilmeli.
- Fraud için ayrı operational intent command surface eklenmedi; fraud legacy owner review sadece internal-service route olarak kaldı.
- Internal service signed caller modeli production seviyesinde değil.

## Riskler
- `INTERNAL_SERVICE_ACTOR_ALLOWLIST` boş bırakılırsa internal-service token alan herhangi actor legacy owner-domain route'ları çağırabilir.
- Operational outbox `pending` kayıtları worker olmadığı için teslim edilmez; bu bilinçli foundation sınırı.
- Existing owner-domain servislerde bellek içi repository kullanımı devam eden alanlar var; bu faz yalnız operational intent/outbox foundation'ını taşıdı.
- UI copy negatif boundary ifadeleri içeriyor; final truth state üretmiyor ama ileride daha net state-token tabanlı render yapılmalı.

## Sonraki önerilen paket
- Operational audit outbox worker dry-run: sadece delivery state transition, owner mutation yok.
- Signed service-to-service auth ve internal caller allowlist zorunlu hale getirme.
- Postgres migration smoke ve schema verification.
- Fraud operational intent surface gerekiyorsa risk/moderation ile aynı kalıcı foundation'a bağlanması.
- Source `.d.ts` artifact stratejisinin temizlenmesi.

## Nihai karar
Refund, moderation ve risk operational intent workflow/audit intent yapıları BFF bellek içi geçici state'ten kalıcı repository foundation seviyesine taşındı. Yeni operational path'ler owner truth, payout, settlement, provider veya enforcement mutation üretmiyor. Audit outbox kalıcı/pending foundation olarak kaydediliyor; worker veya gerçek owner handoff execution bu fazda yapılmadı.
