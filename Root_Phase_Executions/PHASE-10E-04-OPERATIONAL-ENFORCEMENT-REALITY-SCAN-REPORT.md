# PHASE-10E-04 — Operational Enforcement Reality Scan

## 1. Route Gerçekliği
`apps/web/app/` dizini altında bulunan ilgili route'ların durumu:

- `apps/web/app/support/`: Gerçek (`page.tsx` mevcut)
- `apps/web/app/support/tickets/[id]/`: Gerçek (`page.tsx` mevcut, action olabilir)
- `apps/web/app/returns/`: Gerçek (`page.tsx` mevcut)
- `apps/web/app/returns/[id]/`: Gerçek (`page.tsx` mevcut)
- `apps/web/app/admin/`: Gerçek (`page.tsx` mevcut)
- `apps/web/app/admin/products/`: Gerçek (`page.tsx` mevcut)
- `apps/web/app/refund/`: Placeholder / Yok
- `apps/web/app/finance/`: Placeholder / Yok
- `apps/web/app/payout/`: Placeholder / Yok
- `apps/web/app/settlement/`: Placeholder / Yok
- `apps/web/app/moderation/`: Placeholder / Yok (Fakat BFF layerda destekleniyor)
- `apps/web/app/fraud/`: Placeholder / Yok
- `apps/web/app/risk/`: Placeholder / Yok
- `apps/web/app/ops/`: Placeholder / Yok

**Durum**: Refund, Finance, Payout, Settlement, Moderation, Fraud, Risk ve Ops için ayrı UI route'ları şu anda implement edilmemiştir veya placeholder seviyesindedir. Ancak bu alanların API (BFF) tarafında route ve controller'ları mevcuttur. Return ve Support alanları public-facing UI olarak `apps/web` içinde mevcuttur ve safe projection modeli izlenmektedir.

## 2. Frontend BFF Adapter Gerçekliği
`apps/web/src/lib/bff/` dizininde:
- `returns.ts`: Read projection (örneğin: `ReturnSurfaceProjection`) ve güvenli boundary enforcing. (Örn: `fraudTruth: false`, `rawFinancePayloadExposed: false`, `rawProviderPayloadExposed: false`). Refund state'leri projection safety kullanılarak (not_started, pending, processing vb.) maplenmektedir. `refund` mutation adapter'ı bulunmuyor, sadece okuma (read projection).
- `support.ts`: Read projection ve güvenli boundary enforcing. (Örn: `refundTruth: false`, `rawFinancePayloadExposed: false`, `rawProviderPayloadExposed: false`). 
- Payout, Moderation, Risk adapterları `apps/web/src/lib/bff/` içerisinde bulunmuyor (yalnızca contracts ve BFF server üzerinden doğrudan erişim var). 
- **Genel Durum**: Frontend BFF adapter'larında optimistic mutation görünmüyor. Tüm finance ve support operasyonları sadece safe-read (projection) durumundadır. Cache invalidation ya da protected command'ler frontend bff dosyasında açıkça işlenmemiş.

## 3. Apps/web Boundary Scan
- **Direct Repository Access**: Web uygulaması tarafında Prisma veya DB repolarına doğrudan bir erişim görünmemektedir.
- **Hidden Mutation Helper**: Görünmüyor. UI adapterlarında mutation yapılmıyor.
- **Local Truth Synthesis**: `returns.ts` ve `support.ts` dosyalarında UI state'i, BFF'ten gelen verinin `mapRefund` gibi fonksiyonlarla local bir projection modeline oturtulmasıyla sentezleniyor (`Refund pending projection`, `Refund processing projection`). UI, kendi truth'unu üretmez, helper metinler aracılığıyla "Refund initiated is not settled payout truth" uyarısı verir.

## 4. BFF Enforcement Scan
`apps/bff/src/server/` dizininde:
- `refund.ts`, `payout.ts`, `moderation.ts`, `fraud.ts`, `finance-correction.ts`, `settlement.ts`, `risk.ts` dosyalarında command ve query handler'ları mevcuttur.
- **Direct Repository Access**: Yok. Bütün operasyonlar ilgili domain logic paketleri (örn. `@hx/payout`, `@hx/refund`, `@hx/moderation`) üzerinden geçmektedir.
- **Protected Commands**: Protected handler'lar `requireFinanceRole`, `requireRiskOperator`, `requireModerationOperator` gibi guard fonksiyonları kullanılarak korunmaktadır (`guards.ts`).
- **Owner Bypass**: `moderation.ts` içinde bir Moderation kararının ardından hedef domain'e (örneğin post, ugc, review vb.) handoff yapılmaktadır `[HARDENING-06C1] Moderation Decision Handoff: Trigger target owner transition if needed`.
- **Business Logic Accumulation**: BFF'te business logic birikimi yoktur, handler'lar validation ve command delegasyonundan sorumludur.

## 5. Protected Command Coverage
- **Refund Request**: Var (`handleCreateRefundFromCancelReturn`) - Ancak guard uygulanmamış.
- **Refund Review**: Var (`handleProcessRefund`, `handleTransitionRefund`) - Guard uygulanmamış (doğrudan public / unprotected veya guardsiz bırakılmış).
- **Payout Hold/Release**: Var (`handleApplyPayoutItemAction`) - Protected (`requireFinanceRole`).
- **Support Escalation**: Spesifik escalation handler'ı BFF'te mevcut değil.
- **Moderation Escalation**: Var (`handleReviewModerationCase`) - Protected (`requireModerationOperator`).
- **Fraud Escalation**: Var (`handleReviewFraudCase`) - Protected (`requireRiskOperator`).
- **Settlement Adjustment**: Var (`handleApplySettlementAction`) - Protected (`requireFinanceRole`).

## 6. DTO/Contract Enforcement
`packages/contracts/src/` dizininde:
- **Boundary Flags**: Ciddi şekilde enforce edilmiş. Örnek:
  - `FraudBoundaryFlags` (`fraudSignalOnly: true`, `businessTruthMutated: false`)
  - `RiskBoundaryFlags` (`riskSignalOnly: true`)
  - `PayoutBoundaryFlags` (`settlementTruthMutated: false`, `actualProviderPayoutPerformed: false`)
- **Owner Handoff States**: Mevcut (örneğin, `ownerHandoffEvidence`, `ownerHandoffRequired`).
- **Audit/Evidence Separation**: Mevcut (örneğin, `ModerationDecisionEvidence`, `auditEvidenceRequired: true`).
- **Idempotency Fields**: Contractlarda (`idempotencyKey`) mevcuttur (örneğin Settlement, RefundFinancialImpactCommand).

## 7. Queue & Escalation Modeli
- Contractlarda queue placeholder'ları (örneğin `productApprovalQueueText`, `moderationRiskQueueText` gibi alanlar) mevcuttur.
- Moderation ve Fraud işlemlerinde, kararlar alındıktan sonra hedefe (owner domain'e) handoff yapılmaktadır, queue yerine direct call veya domain event aracılığıyla owner state transition'ı tetiklenmektedir.
- Risk/Fraud sinyalleri Payout hold veya Settlement correction süreçleriyle bağlantılı (Örn: `PayoutHoldReasonCode: 'RISK_REVIEW_OPEN'`, `SettlementReasonCode: 'RISK_HOLD_RECOMMENDED'`).

## 8. Audit/Evidence Durumu
- Sinyallerde ve review caselerde audit/evidence fields zorunlu tutulmuş (`auditEvidenceRequired: true`).
- UI tarafı "audit truth" üretmiyor. UI üzerinden sadece decision/note/reason code tetikleniyor. BFF handler'larında `validateFraudEvidence` ve `validateRiskEvidence` fonksiyonları kullanılarak reason code veya audit notu gibi evidence gereksinimleri kontrol ediliyor.

## 9. Maker-Checker Durumu
- Moderation domaininde `makerCheckerContext` alanı opsiyonel olarak contractlara eklenmiştir (`ModerationDecisionRecord.makerCheckerContext`).
- Finance alanlarında maker/checker ayrımı için `ReviewFinanceCorrectionCommand` `reviewerId` almaktadır, ancak dual approval gibi mekanizmalar spesifik bir şekilde enforce edilmemiştir (şimdilik single review yapısı gibi duruyor).

## 10. Test Gerçekliği
- `pnpm.cmd run typecheck`: **Başarılı (0 Hata)**
- `pnpm.cmd run build`: **Başarılı (0 Hata)**
- Repo stabil durumda. Tüm domainler (finance, admin, risk, refund vb.) typesafe ve derlenebiliyor.

## 11. Boundary İhlalleri ve Commerce-Critical Riskler
- **Refund Handler Guard Eksikliği**: BFF `refund.ts` içindeki route'lar (örn. `/refund/process`, `/refund/transition`) `requireFinanceRole` veya başka bir guard fonksiyonu ile korunmamış. Herkes tarafından tetiklenebilir görünüyor, bu kritik bir commerce riskidir.
- **Frontend UI Eksikliği**: Finance, Moderation, Fraud ve Payout dashboard/UI ekranları yok veya tamamen placeholder. Admin ekranından bu süreçler yönetilemiyor.
- **Provider Gerçekliği**: Payout ve Finance işlemlerinde `actualProviderPayoutPerformed: false` flag'i ile provider entegrasyonlarının henüz simülasyon aşamasında olduğu açıkça ifade ediliyor.

## 12. Eksik Foundation Alanları
- Refund BFF Endpoints için yetkilendirme (guards).
- Moderation, Risk, Fraud ve Payout için Frontend UI Panelleri / Yönetim Ekranları.
- Maker-Checker Dual Approval Foundation (şu anda tek bir reviewer id alınıyor, complex maker-checker workflow'u için state makinesi tam değil).

## 13. Sonraki Güvenli Implementation Paketi Önerisi
- **Refund Security Patch**: BFF üzerinde Refund endpointlerine ivedilikle Admin/Finance yetki kontrollerinin eklenmesi.
- **Panel Foundation**: `apps/panel` veya `apps/web/app/admin/` altında Risk, Fraud ve Finance için operasyon dashboardlarının yapılması.
- **Provider Entegrasyonu**: Simülasyon modunda olan Payout servisleri için gerçek provider adapter'larının yazılması (veya feature toggle yapısının kurulması).

## 14. Nihai Değerlendirme
Domain Logic, DTO ve Boundary Flag enforce'ları contract düzeyinde çok güçlü şekilde uygulanmış durumdadır. "False Positive Review", "Owner Handoff" gibi complex sistem event geçişleri modellenmiş ve typelar aracılığıyla enforce edilmiştir. Ancak Frontend/Panel UI entegrasyonu tamamen eksiktir ve BFF üzerindeki Refund endpointleri guard protection'dan yoksundur.
