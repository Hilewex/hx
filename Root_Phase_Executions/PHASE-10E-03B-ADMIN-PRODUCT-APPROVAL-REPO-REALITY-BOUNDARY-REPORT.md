# PHASE-10E-03B: Admin & Product Approval Repo Reality & Boundary Report

## 1. İncelenen Dosyalar
- `apps/web/app/admin/products/page.tsx`
- `apps/web/app/admin/products/[id]/page.tsx`
- `apps/web/src/lib/bff/admin.ts`
- `packages/contracts/src/admin.ts`
- `apps/bff/src/server/admin.ts`
- `apps/web/src/components/admin-ops-surface.tsx`

## 2. Mevcut Admin Route Durumu
- `apps/web/app/admin` altında `products` ve `products/[id]` route'ları mevcuttur.
- Bu route'lar doğrudan sunucu tarafı bir mutation yapmaz, sadece `<AdminOpsSurface />` bileşenini çağırarak projection verilerini okur.
- Route'larda veya page bileşenlerinde veritabanı veya domain mantığı işletilmemektedir.

## 3. Admin BFF Adapter Durumu
- `apps/web/src/lib/bff/admin.ts` içerisinde `readAdminDashboardProjection`, `readAdminProductApprovalQueueProjection` ve `readAdminProductApprovalDetailProjection` gibi okuma amaçlı adapter fonksiyonları yer almaktadır.
- BFF tarafında sadece read/projection endpoint'lerine istek atılmaktadır. Değişim (mutation) için bir truth kaynağı değil, yalnızca owner domain'den dönen okunabilir projection zarflarını (`PublicProjectionEnvelope`) kullanmaktadır.
- Degraded/error ve empty state handling yapısı adapter seviyesinde ve UI bileşeninde tanımlıdır.

## 4. Contract/DTO Durumu
- `packages/contracts/src/admin.ts` içinde `AdminDashboardProjection`, `AdminProductApprovalQueueProjection`, `AdminProductApprovalDetailProjection` gibi DTO'lar mevcuttur.
- Contract içinde strict boundary flag'leri tanımlanmıştır: `productApprovalTruth: false`, `activeSellableTruth: false`, `directWriteTruth: false` vb.
- Ayrıca `AdminProtectedActionRequest` gibi BFF/Admin arasındaki korumalı action payload formatları belirlenmiştir. Action tipleri (`AdminActionType`) olarak `MODERATION_REVIEW_REQUEST`, `PAYOUT_HOLD_REQUEST` gibi güvenli handoff modelleri bulunmaktadır.

## 5. Boundary Scan Sonuçları
- `services/*/src` imports in `apps/web`: Yok (Temiz)
- `db`, `persistence`, `prisma` imports in `apps/web`: Yok (Temiz)
- Admin UI içinde approval truth veya final decision üreten logic: Yok. `<AdminOpsSurface />` sadece projection verisini gösterir ve "Admin review is not product approval" şeklinde explicit mesajlar verir. UI sadece okuma yapar ve `productApprovalTruth` mutation'ı oluşturmaz.
- Audit/evidence owner mutation: UI'da yok, sadece `missingEvidenceWarnings` gibi audit projection durumları gösterilmekte.
- Query cache: Yalnızca okunan projection'ları göstermek için UI'da kullanılıyor (`staleTime` ile), truth source olarak kullanılmıyor.

## 6. Command/Action Gerçekliği
- Onaylama (Approve), Reddetme (Reject), Revizyon İsteme (Request Revision) veya Kanıt İsteme (Require Evidence) butonları `<AdminOpsSurface />` içerisinde **disabled placeholder** olarak eklenmiştir.
- Herhangi bir action için direkt veritabanı yazması (direct write) desteklenmemektedir, owner command handoff mekanizmasına yönlendirilir.

## 7. Build / Typecheck / Playwright Sonucu
- **Typecheck:** Başarılı (0 hata)
- **Build:** Başarılı (Uygulamalar ve Next.js derlemesi sorunsuz)
- **Playwright:** Tüm testler başarılı, hata/eksik state yok.

## 8. Riskler
- BFF tarafında owner command handoff altyapısı (gerçek komut gönderimi) `apps/bff` içerisinde henüz bir mock veya validator seviyesindedir. Asıl action tetiklendiğinde `owner service`'e event veya RPC/HTTP çağrısı fırlatacak altyapı eksiktir.
- Rol (role) ve izinlerin (permissions) UI'a doğrudan yansıması yalnızca statik text projection şeklindedir, gerçeğe dönüştüğünde auth payload'u ile BFF entegrasyonu derinleşmelidir.

## 9. Sonraki Önerilen Kontrollü Paket
**PHASE-10E-03C:** BFF Command Handoff Foundation
Admin UI'daki disabled butonların gerçekçi (ama mock) bir command tetikleyici ile BFF'e bağlanması ve BFF'in bu komutu `AdminProtectedActionRequest` kontratı ile doğrulayarak owner service'e (veya mock owner service interface'ine) "Handoff" etmesinin simüle edilmesi.
