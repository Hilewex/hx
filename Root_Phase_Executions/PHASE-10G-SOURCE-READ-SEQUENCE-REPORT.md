# PHASE-10G-SOURCE-READ-SEQUENCE-REPORT

## 1. Operational Intent
**Dosya:** `packages/persistence/src/operational-intent.ts`
- **Type/Interface/Class Listesi:** `OperationalIntentDomain`, `OperationalWorkflowState`, `AuditIntentDeliveryState`, `OperationalIntentJsonRecord`, `OperationalIntentRecord`, `AuditIntentOutboxRecord`, `RecordOperationalIntentInput`, `OperationalIntentRecordResult`, `OperationalIntentRepository`, `InMemoryOperationalIntentRepository`, `PostgresOperationalIntentRepository`.
- **Workflow State Listesi:** `prepared`, `checker_required`, `checked`, `rejected`, `escalated`, `owner_handoff_pending`, `owner_handoff_ready`.
- **Outbox Delivery State Listesi:** `pending`, `processing`, `delivered`, `failed`, `dead_letter`.
- **Repository Metotları:** `recordIntentWithAuditOutbox`, `listIntents`, `getIntentById`, `getIntentByIdempotencyKey`, `getAuditOutboxByIdempotencyKey`, `getAuditOutboxByIntentId`, `getLatestIntentByTarget`, `getLatestAuditOutboxByTarget`, `listDeliverableAuditOutbox`, `claimAuditOutboxLease`, `releaseAuditOutboxLease`, `markAuditOutboxProcessing`, `markAuditOutboxDelivered`, `markAuditOutboxFailed`, `markAuditOutboxDeadLetter`.
- **Idempotency/Fingerprint Davranışı:** `fingerprint` fonksiyonu SHA-256 ile input'tan hesaplanıyor. Replay'de conflict varsa `OPERATIONAL_INTENT_IDEMPOTENCY_CONFLICT` fırlatıyor.
- **Lease/Retry/Dead-letter Davranışı:** `leaseOwner`, `leaseUntil`, `retryCount`, `nextRetryAt`, `deadLetterReason` gibi alanlar var ve `claimAuditOutboxLease` / `markAuditOutboxFailed` metotlarıyla yönetiliyor.
- **Maker/Checker Alanları:** `makerActorId`, `checkerActorId` (optional), `makerCheckerContext`.
- **Business Mutation Yapıyor mu?:** Hayır.
- **Domain Execution Var mı?:** Hayır.
- **Capability Level:** Persistence Foundation.

## 2. Ops Center BFF
**Dosya:** `apps/bff/src/server/ops-center.ts`
- **Import Listesi:** `@hx/contracts`, `@hx/persistence`, `./response`, `./guards`.
- **@hx/persistence Import Var mı?:** Evet (`listOperationalIntents`, `getOperationalIntentById` vb.).
- **Queue Domains Listesi:** `refund`, `moderation`, `risk`.
- **Hangi Domainleri Gösteriyor?:** `refund`, `moderation`, `risk`.
- **Finance/Settlement/Payout Var mı?:** Hayır.
- **Projection-only Flag Var mı?:** Evet (`projectionOnly: true`).
- **EnforcementExecuted False mu?:** Evet (`enforcementExecuted: false`).
- **SLA/Priority/Escalation Nasıl Derive Ediliyor?:** `reasonCode`, `actionType`, `workflowState` ve yaratılma zamanına göre hesaplanıyor (`derivePriority`, `deriveSla`, `deriveEscalation`).
- **Action/Command Endpoint Var mı?:** Hayır, sadece GET endpointleri.
- **Business Mutation Var mı?:** Hayır.
- **Boundary Risk Var mı?:** BFF'ten doğrudan persistence çağrısı var, projection amaçlı olduğundan kabul edilebilir ama potansiyel risk.

## 3. Admin BFF Client
**Dosya:** `apps/web/src/lib/bff/admin.ts`
- **Hangi Admin/Ops Endpointleri Çağrılıyor?:** `/admin`, `/admin/products`, `/admin/refunds`, `/admin/moderation`, `/admin/risk`, `/admin/ops` (GET). POST intent komutları (`/refund/review`, `/moderation/intent`, `/risk/intent`, `/admin/execute-action`).
- **Operational Intent Command Executor Var mı?:** Evet (`executeRefundCommandIntent`, `executeModerationCommandIntent`, `executeRiskCommandIntent`).
- **Finance/Settlement/Payout Endpoint Var mı?:** Hayır.
- **UI’dan Mutation Tetikleyen Fonksiyon Var mı?:** Intent kaydı yapan fonksiyonlar var ama business truth mutasyonu yapan doğrudan direct write yok.
- **Refund/Moderation/Risk Action Ayrımı Var mı?:** Evet, ayrı intent handler'ları var.
- **BFF Client Truth Üretiyor mu?:** Hayır, `boundaryFlags` tüm business truth'ları false döner.

## 4. Admin Ops UI Surface
**Dosya:** `apps/web/src/components/admin-ops-surface.tsx`
- **Hangi Tab/Card/Queue Alanları Var?:** Ops center, Products, Moderation, Risk, Refund review, Audit evidence (placeholder).
- **Refund/Moderation/Risk/Product Dışında Finance/Payout/Settlement Var mı?:** `supportFinanceOpsPlaceholderText` var ama settlement/payout doğrudan kuyruğu yok.
- **Placeholder Var mı?:** Evet (örn. support/finance ve audit evidence için).
- **Maker-Checker Panel Var mı?:** Evet (`OperationalMakerCheckerPanel`).
- **Escalation/SLA/Audit/Outbox Görünürlüğü Var mı?:** Evet.
- **UI Business Truth Üretiyor mu?:** Hayır (salt projection).
- **UI Mutation Yapıyor mu?:** Hayır. Sadece protected intent yolluyor.
- **Loading/Error/Empty/Degraded State Var mı?:** Evet (`LoadingState`, `ErrorState`, `EmptyState`, `DegradedState`).

## 5. Settlement Contract
**Dosya:** `packages/contracts/src/settlement.ts`
- **Type/Entity/State Listesi:** `SettlementSourceType`, `SettlementCalculationLineType`, `SettlementStatus`, `SettlementLimitationFlag`, `SettlementPartyType`, `SettlementLineStatus`, `SettlementActionType`, `SettlementAmountSummary`, vb.
- **SettlementLine Modeli:** `settlementLineId`, `orderId`, `orderLineId`, `storefrontId`, `partyType`, `amountSummary`, `impactSummary`, vb.
- **Creator/Supplier/Platform Payları Var mı?:** Evet (`platformShareAmount`, `creatorMarginAmount`, `creatorShareAmount`, `supplierShareAmount`).
- **Coupon/Refund Impact Alanları Var mı?:** Evet (`discountAmount`, `refundImpactPending`).
- **Action/Transition Command Type Var mı?:** Evet (`ApplySettlementActionCommand`).
- **IdempotencyKey Var mı?:** Evet.
- **Audit/Evidence/Correlation Alanları Var mı?:** Evet (`sourceRefs`, `correlationId`, `errors`, `warnings`).
- **Settlement ≠ Payout Ayrımı Korunuyor mu?:** Evet (`actualPayoutMutationPerformed: false`).

## 6. Settlement BFF
**Dosya:** `apps/bff/src/server/settlement.ts`
- **Import Listesi:** `@hx/contracts`, `@hx/settlement`, `./response`, `./guards`.
- **Owner Service Çağrısı Var mı?:** Evet (`@hx/settlement`).
- **Direct Persistence Import Var mı?:** Hayır.
- **Settlement Calculation BFF’te mi Yapılıyor?:** Hayır, servis üzerinden çağrılıyor.
- **Settlement State Mutate Ediyor mu?:** Delegation yapıyor.
- **Protected Guard Var mı?:** Evet (`requireFinanceRole`).
- **Endpoint/Handler Listesi:** `handleCreateSettlementFromOrder`, `handleApplySettlementAction`, `handleGetSettlementLine`, `handleListSettlementLines`.
- **Capability Level:** Service Proxy/Controller.

## 7. Settlement Migration
**Dosya:** `infra/migrations/20260427_003_settlement_foundation.sql`
- **Tablo İsimleri:** `settlement_lines`, `settlement_idempotency`.
- **Kolonlar:** `settlement_line_id`, `order_id`, `product_id`, `party_type`, `status`, `reason_code`, `amount_summary`, `impact_summary`, vb.
- **State/Status Kolonları:** `status`.
- **Idempotency/Unique Index Var mı?:** Evet (`idx_settlement_idempotency_key_unique`).
- **Creator/Supplier/Platform Amount Alanları Var mı?:** JSONB `amount_summary` içinde.
- **Refund/Coupon Impact Alanları Var mı?:** JSONB `impact_summary` içinde.

## 8. Payout Contract
**Dosya:** `packages/contracts/src/payout.ts`
- **Batch/Item/Beneficiary Type Listesi:** `PayoutBatchType`, `PayoutItemStatus`, `PayoutBeneficiaryType`.
- **Payout State/Status Listesi:** `PayableStatus`, `PayoutStatus`, `PayoutItemStatus`, `PayoutBatchStatus`.
- **Risk Hold / Blocked / Failed / Retry Modeli Var mı?:** Evet (`riskHold`, `holdReasonCode`, `executionSummary.retryRequired`).
- **Provider Execution Summary Var mı?:** Evet (`PayoutExecutionSummary`).
- **Payout Action Command Type Var mı?:** Evet (`ApplyPayoutItemActionCommand`, `ApplyPayoutBatchActionCommand`).
- **IdempotencyKey Var mı?:** Evet.
- **Payout ≠ Settlement Ayrımı Korunuyor mu?:** Evet (`settlementTruthMutated: false`).
- **Provider Callback Business Truth Sayılıyor mu?:** Hayır (`actualProviderPayoutPerformed: false`, foundation instruction only).

## 9. Payout BFF
**Dosya:** `apps/bff/src/server/payout.ts`
- **Import Listesi:** `@hx/payout`, `./response`, `./guards`.
- **Owner Service Çağrısı Var mı?:** Evet (`@hx/payout`).
- **Direct Persistence Import Var mı?:** Hayır.
- **Payout Execute Ediyor mu?:** Servise delege ediyor.
- **Provider Call Var mı?:** BFF seviyesinde hayır.
- **Simulation mı Gerçek mi?:** Delegation yapıyor.
- **Risk Hold Guard Var mı?:** Servis seviyesinde.
- **Protected Guard Var mı?:** Evet (`requireFinanceRole`).
- **Endpoint/Handler Listesi:** `handleCreatePayoutItemsFromSettlement`, `handleCreatePayoutBatch`, `handleApplyPayoutItemAction`, `handleApplyPayoutBatchAction`, `handleGetPayoutItem`, `handleGetPayoutBatch`, `handleListPayoutItems`, `handleListPayoutBatches`, `handleCreateSmokeTestPayoutItem`.
- **Capability Level:** Service Proxy/Controller.

## 10. Payout Migration
**Dosya:** `infra/migrations/20260427_004_payout_foundation.sql`
- **Tablo İsimleri:** `payout_items`, `payout_batches`, `payout_idempotency`.
- **Batch/Item Tabloları Var mı?:** Evet.
- **Status Kolonları:** `status`.
- **Provider Reference Alanları:** `execution_summary` JSONB içinde.
- **Retry/Failure Alanları:** JSONB (errors/warnings ve execution_summary).
- **Risk Hold/Blocked Alanları:** `hold_reason_code`.
- **Idempotency/Unique Index Var mı?:** Evet (`idx_payout_idempotency_key_unique`).

## 11. Finance Ledger Contract
**Dosya:** `packages/contracts/src/finance-ledger.ts`
- **LedgerEntry Modeli:** `ledgerEntryId`, `idempotencyKey`, `sourceType`, `direction`, `entryType`, `amount`, vb.
- **Immutable/Append-only İşareti Var mı?:** Evet (`immutable: true`).
- **Entry Type Listesi:** `PAYMENT_CAPTURE`, `PLATFORM_COMMISSION`, `SUPPLIER_PAYABLE`, `CREATOR_SHARE`, `COUPON_DISCOUNT`, `REFUND`, `REFUND_REVERSAL`, `CORRECTION`, `PAYOUT`, `PAYOUT_REVERSAL`.
- **Debit/Credit Direction Var mı?:** Evet (`LedgerEntryDirection`).
- **IdempotencyKey Zorunlu mu?:** Evet.
- **Source/Correlation/Evidence Alanları Var mı?:** `sourceType`, `sourceId`, `sourceEventId`, `metadata`.
- **Refund/Settlement/Payout Etkileri Temsil Ediliyor mu?:** Evet (Refund için `RefundFinancialImpactCommand`).

## 12. Finance Ledger Persistence
**Dosya:** `packages/persistence/src/finance-ledger.ts`
- **Append-only mi?:** Evet.
- **Update/Delete Var mı?:** Hayır (sadece mock temizliği var).
- **Idempotency Conflict Guard Var mı?:** Evet (`DUPLICATE_IDEMPOTENCY_KEY`).
- **InMemory mi Postgres mi?:** InMemory.
- **Repository Method Listesi:** `appendLedgerEntry`, `getLedgerEntries`, `_clearLedger`.
- **Test-only Clear Var mı?:** Evet.
- **Capability Level:** Memory Mock / Foundation.

## 13. Finance Ledger BFF
**Dosya:** `apps/bff/src/server/finance-ledger.ts`
- **Import Listesi:** `@hx/finance`, `./response`, `./guards`.
- **Direct Persistence Import Var mı?:** Hayır (`@hx/finance`).
- **Append Endpoint Var mı?:** Evet (`handleAppendLedgerEntry`).
- **Finance Admin Guard Var mı?:** Evet (`requireFinanceRole`).
- **BFF Ledger Truth Üretiyor mu?:** Hayır, delege ediyor.
- **Owner Service Var mı?:** Evet.
- **Risk Seviyesi:** Servis çağrısı olduğu için Normal/Düşük.

## 14. Finance Correction Contract
**Dosya:** `packages/contracts/src/finance-correction.ts`
- **Correction Record Modeli:** `FinanceCorrectionRecord`.
- **Status Listesi:** `CREATED`, `UNDER_REVIEW`, `ADVISORY_RECORDED`, `RESOLVED`, `REJECTED`, `CLOSED`.
- **Action Type Listesi:** `RECORD_ADVISORY`, `MARK_REVIEW_REQUIRED`, `MARK_RESOLVED`, `REJECT`, `CLOSE`.
- **Target Ref Modeli:** `FinanceCorrectionTargetRef`.
- **Severity/Reason/Impact Alanları:** `severity`, `reasonCode`, `impactSummary`, `amountSummary`.
- **Maker-Checker veya Review State Var mı?:** Evet (`ReviewFinanceCorrectionCommand`, `reviewerId`).
- **Ledger Etkisi Nasıl Temsil Ediliyor?:** Soyut (`impactSummary`, `advisoryOnly`).
- **Idempotency/Correlation Var mı?:** Evet.

## 15. Finance Correction BFF
**Dosya:** `apps/bff/src/server/finance-correction.ts`
- **Import Listesi:** `@hx/finance-correction`, `./response`, `./guards`.
- **Direct Persistence Import Var mı?:** Hayır.
- **Owner Service Çağrısı Var mı?:** Evet.
- **Correction Create/Review/Apply Var mı?:** Evet (`createFinanceCorrection`, `reviewFinanceCorrection` vs.).
- **Protected Finance Guard Var mı?:** Evet (`requireFinanceRole`).
- **Ledger Mutation Tetikliyor mu?:** Sadece servis delegasyonu.
- **Capability Level:** Service Proxy/Controller.

## 16. Finance Correction Migration
**Dosya:** `infra/migrations/20260427_002_finance_correction_foundation.sql`
- **Tablo İsimleri:** `finance_corrections`, `finance_correction_idempotency`.
- **Status/Action Kolonları:** `status`.
- **Target/Entity Kolonları:** `target_type`, `target_id`.
- **Amount/Impact Alanları:** `amount_summary`, `impact_summary`.
- **Reviewer/Actor Alanları:** Tabloda yok, contract notlarında.
- **Idempotency/Unique Index Var mı?:** Evet (`idx_finance_correction_idempotency_key_unique`).

## 17. Reconciliation Task Persistence
**Dosya:** `packages/persistence/src/payment-reconciliation-task.ts`
- **Payment-specific mi Generic mi?:** Payment-specific (`payment_id`, `provider_name`).
- **Task Status Listesi:** `TERMINAL_RECONCILIATION_STATUSES` (sözleşmeden çekiliyor).
- **Idempotency/ReconciliationRef Var mı?:** Evet (`reconciliation_ref`).
- **InMemory/Postgres Var mı?:** Evet ikisi de var.
- **Worker İçin Claim/Lease Var mı?:** Poll mekanizması üzerinden (`next_attempt_at`, `status`).
- **Settlement/Payout İçin Reusable mı?:** Hayır.
- **Capability Level:** Persistence Foundation.

## 18. Reconciliation Worker
**Dosya:** `services/payment/src/reconciliation-worker.ts`
- **Dry-run Default mu?:** Evet (`processPaymentReconciliationTaskDryRun`).
- **Controlled Mutation Var mı?:** Evet (`processPaymentReconciliationTaskControlledMutation`).
- **Payment Owner Command Guard Var mı?:** Evet (`canApplyOwnerCommand`, `PaymentCallbackOwnerCommand`).
- **Order Handoff Var mı?:** Hayır, mutation parametrelerinde false.
- **Finance/Settlement/Payout Mutation Var mı?:** Hayır.
- **Audit/Outbox Evidence Var mı?:** Evet (`appendControlledReconciliationEvidence`).
- **Worker Runtime mı Yoksa Callable Helper mı?:** Callable helper fonksiyonları.
- **Capability Level:** Domain Logic / Worker Foundation.

## 19. Operational Intent Migration
**Dosya:** `infra/migrations/20260512_001_operational_intent_audit_outbox_foundation.sql`
- **Tablo İsimleri:** `operational_intents`, `operational_audit_intent_outbox`.
- **Workflow State Kolonları:** `workflow_state`.
- **Outbox Delivery State Kolonları:** `delivery_state`.
- **Lease/Retry/Dead-letter Kolonları:** `retry_count`, `next_retry_at`, `last_error`, `dead_letter_reason`, `lease_owner`, `lease_until`, `claimed_at`.
- **Maker/Checker/Evidence Alanları:** `maker_actor_id`, `checker_actor_id`, `evidence_refs`, `maker_checker_context`.
- **Idempotency/Fingerprint Index Var mı?:** Evet (`idempotency_key` UNIQUE, `input_fingerprint`).

## 20. Package Scripts / Smoke
**Dosya:** `package.json`, `tests/smoke/run-smoke.ts`
- **Settlement Smoke Script Var mı?:** Evet (`smoke:settlement-calculation-foundation`).
- **Payout Smoke Script Var mı?:** Evet (`smoke:payable-payout-boundary-foundation`, `smoke:payout-provider-boundary`).
- **Finance-Ledger Smoke Var mı?:** Evet (`smoke:finance-ledger-foundation`).
- **Finance-Correction Smoke Var mı?:** Özel bir script yok.
- **Operational-Intent Smoke Var mı?:** Evet (`smoke:operational-outbox-worker-dry-run`, `smoke:operational-outbox-worker-lease`).
- **Ops-Center Smoke Var mı?:** Kısmen web/panel/admin testlerinde kapsanıyor.
- **Reconciliation Smoke Var mı?:** Evet (decision, task-persistence, worker-dry-run, controlled-mutation, audit-outbox-finalization).
- **Worker/Outbox Smoke Var mı?:** Evet (`smoke:event-outbox`, `smoke:operational-outbox-worker-dry-run`).
- **Web Render Smoke Var mı?:** Evet (`smoke:panel-smoke-coverage-foundation`).

---

## Rapor Sonu: Genel Özet

| Dosya | Gerçek Seviye | Ana Kanıt | Ana Gap | Risk |
| :--- | :--- | :--- | :--- | :--- |
| `packages/persistence/src/operational-intent.ts` | Foundation/Repository | Interface, Postgres/Memory imp. | Yok | Düşük |
| `apps/bff/src/server/ops-center.ts` | Proxy/Controller | Direct persistence import, GET endpoints | BFF doğrudan DB | Orta |
| `apps/web/src/lib/bff/admin.ts` | API Client | execute command endpoints, projection reads | Yok | Düşük |
| `apps/web/src/components/admin-ops-surface.tsx` | UI Component | Projection rendering, readonly | Mutation yok | Düşük |
| `packages/contracts/src/settlement.ts` | Model/Contract | Types, LimitionFlags, Interfaces | Yok | Düşük |
| `apps/bff/src/server/settlement.ts` | Proxy/Controller | `@hx/settlement` import, endpoints | Yok | Düşük |
| `infra/migrations/20260427_003_settlement_foundation.sql` | Schema | Tables, Indexler | Yok | Düşük |
| `packages/contracts/src/payout.ts` | Model/Contract | Types, LimitationFlags | Yok | Düşük |
| `apps/bff/src/server/payout.ts` | Proxy/Controller | `@hx/payout` import | Yok | Düşük |
| `infra/migrations/20260427_004_payout_foundation.sql` | Schema | Tables, Indexler | Yok | Düşük |
| `packages/contracts/src/finance-ledger.ts` | Model/Contract | Types, Append-only indicator | Yok | Düşük |
| `packages/persistence/src/finance-ledger.ts` | Foundation/Mock | Memory persistence, `_clearLedger` | PG imp. eksik | Orta |
| `apps/bff/src/server/finance-ledger.ts` | Proxy/Controller | Role guard, endpoints | Yok | Düşük |
| `packages/contracts/src/finance-correction.ts` | Model/Contract | TargetRefs, ActionTypes | Yok | Düşük |
| `apps/bff/src/server/finance-correction.ts` | Proxy/Controller | Delegation endpoints | Yok | Düşük |
| `infra/migrations/20260427_002_finance_correction_foundation.sql`| Schema | Tablo, Idempotency Index | Yok | Düşük |
| `packages/persistence/src/payment-reconciliation-task.ts`| Repository | Postgres/Memory, lease/status | Yok | Düşük |
| `services/payment/src/reconciliation-worker.ts` | Domain Worker | Dry run logic, controlled mutation | Yok | Düşük |
| `infra/migrations/20260512_001_operational_intent_audit_outbox_foundation.sql`| Schema | Workflow state, dead letter, lease | Yok | Düşük |
| `package.json` & `run-smoke.ts` | Smoke Testing | Script ve runner suite kayıtları | Ops UI test eksik | Düşük |

### 1. Phase-10G için hangi foundation tekrar yazılmamalı?
*Settlement, Payout, Finance Ledger, Reconciliation Task, Operational Intent Outbox persistence, DB şemaları ve BFF endpointleri.* Tüm bu katmanlar temelde mevcut ve sınırları belirlenmiş. Yeniden yazmak, isolation ve boundary violation getirecektir.

### 2. İlk güvenli paket ne olmalı?
*Operational Intent*. Migration'lar, Contract, Persistence hazır ve BFF okuma (Ops Center) yapıyor. İşlemlerin mutasyon öncesi intent (niyet) kaydının merkezi ve risksiz hali burasıdır.

### 3. İlk paketten önce hangi boundary borcu kapatılmalı?
*BFF'ten doğrudan persistence yapısına giden çağrılar (Ops Center).* BFF'in `@hx/persistence`'ı doğrudan import etmesi bir architectural leak oluşturuyor, `ops-center` verileri için bir `service` ara katmanı (veya query handler) oluşturulmalıdır.

### 4. Bu aşamada kesinlikle yapılmaması gereken mutation’lar neler?
*Admin Ops Surface üzerinden "direct write", "owner state update", settlement/payout execution ve final finance commit mutation'ları.* UI/BFF katmanı sadece command/intent tetiklemelidir. UI/BFF truth üretmemelidir.

### 5. Hangi build/typecheck/smoke zorunlu?
`pnpm build`, `pnpm typecheck`, `smoke:settlement-calculation-foundation`, `smoke:payable-payout-boundary-foundation`, `smoke:finance-ledger-foundation`, ve tüm `payment-reconciliation-*` smoke testleri.

