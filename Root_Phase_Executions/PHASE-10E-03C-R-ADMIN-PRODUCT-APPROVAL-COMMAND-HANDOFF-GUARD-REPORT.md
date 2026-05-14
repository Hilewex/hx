# PHASE-10E-03C-R — Admin Product Approval Command Handoff Guard & Report Hardening

## 1. İncelenen Dosyalar
- `apps/web/src/components/admin-ops-surface.tsx`
- `apps/bff/src/server/admin.ts`
- `packages/contracts/src/admin.ts`

## 2. UI Truth/Copy Review
- "Approved", "rejected", "approval completed", "product active", "sellable" gibi final truth mesajları yoktur.
- Mevcut copy: "Handoff status", "submitting" vb. durumlar render edilir. Ayrıca "Product submitted does not mean product approved.", "Admin reviewed is not owner state mutated." gibi bilgilendirmeler korundu.

## 3. BFF Guard Hardening
`handleAdminProtectedActionExecute` içerisinde şu guard kontrolleri uygulandı:
- **Actor context:** `actorId` ve `actorRole` mevcudiyeti kontrol ediliyor. Eksikse `PERMISSION_DENIED` döner.
- **Actor scope:** Sadece `admin`, `super_admin` veya `ops` rollerine izin verildi. Değilse `PERMISSION_DENIED` döner.
- **Action allowlist:** Gönderilen action `APPROVE_PRODUCT_HANDOFF`, `REJECT_PRODUCT_HANDOFF`, vb. içinde mi diye kontrol edildi. Değilse `VALIDATION_FAILED` döner.
- **Target ID:** `targetId` varlığı kontrol edildi.
- **Reason Code:** `APPROVE_PRODUCT_HANDOFF` harici actionlarda reason code zorunluluğu doğrulandı.
- **Evidence Requirement:** `REQUIRE_EVIDENCE_HANDOFF` için `metadata.evidenceRefs` arandı. Yoksa `EVIDENCE_REQUIRED` döndürüldü.
- **Idempotency:** `idempotencyKey` eksikse `VALIDATION_FAILED` döner.

## 4. Idempotency Review
- Contract üzerinde ve implementation'da `idempotencyKey` mecburi kılındı.
- Dönen payload içinde de `idempotencyKey` echo ediliyor.
- Persistence/gerçek idempotency DB store yazımı yapılmadı; sadece interface mock level'da id doğrulandı.

## 5. Boundary Scan
- **apps/web içinde services/*/src import var mı?**: Hayır.
- **apps/web içinde persistence/db/prisma/repository import var mı?**: Hayır.
- **BFF direct product mutation yapıyor mu?**: Hayır, DB veya product servisine dokunulmadan sadece interface response mock edildi.
- **Audit persistence yazıyor mu?**: Hayır, sadece `persisted: false` ibareli intent message dönüyor.
- **UI final approval truth gösteriyor mu?**: Hayır.

## 6. Build/Typecheck/Playwright Exact Result
- `pnpm run typecheck`: PASS
- `pnpm run build`: PASS
- `pnpm --filter @hx/web run playwright`: PASS

## 7. Kalan Limitation
Gerçek consumer'ların (Product owner, Audit owner) implementasyonu olmadığı için `ACCEPTED_FOR_OWNER_HANDOFF` mesajı sistemde havada kalmaktadır ve event bus'a (veya persistence'a) yazılmamaktadır. Bu durum Foundation fazı için kabul edilen limitation'dır.

## 8. Nihai Karar
PASS. Guard ve mock handoff yapısı hedeflenen security boundary standartlarına uymaktadır.
