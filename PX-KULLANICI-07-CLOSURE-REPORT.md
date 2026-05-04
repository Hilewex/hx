# PX-KULLANICI-07 — Customer Support / Order Visibility Boundary Uygulama Raporu

## 1. Değişen Dosyalar
- `packages/contracts/src/customer-support.ts` (Yeni)
- `packages/contracts/src/index.ts` (Güncellendi)
- `services/customer-support/package.json` (Yeni)
- `services/customer-support/tsconfig.json` (Yeni)
- `services/customer-support/src/index.ts` (Yeni)
- `services/customer-support/src/customer-support.ts` (Yeni)
- `apps/bff/package.json` (Güncellendi)
- `apps/bff/src/server/customer-support.ts` (Yeni)
- `apps/bff/src/server/index.ts` (Güncellendi)
- `apps/panel/src/bootstrap/customer-support-smoke.ts` (Yeni)

## 2. Regression Audit Sonucu
- Mevcut Havuz sistemi korundu.
- Mevcut Fenomen Mağaza sistemi korundu.
- PX-KULLANICI-01..06 arası tüm davranışlar ve smoke testleri korundu ve başarıyla geçti.
- BFF ve Panel yapıları bozulmadı.

## 3. Silinen Kod / Değişen Eski Davranış Var mı?
- Hayır, sadece izole eklemeler yapıldı. Mevcut hiçbir route veya guard silinmedi.

## 4. Eklenen Contract/Service/BFF Route Listesi
- **Contract:** `CustomerSupportAction`, `CustomerSupportTopic`, `CustomerOrderVisibilityContext`, `CustomerSupportEligibilityResult`, `CheckCustomerSupportEligibilityCommand`.
- **Service:** `CustomerSupportService.checkCustomerSupportEligibility`
- **BFF Route:** `POST /customer/support-eligibility/check`

## 5. Support / Order Visibility Matrix Özeti
| Actor | Action | Condition | Result |
|---|---|---|---|
| Guest | All | - | DENY |
| Active Customer | VIEW_ORDER | own order | ALLOW |
| Active Customer | VIEW_ORDER | foreign order | DENY |
| Active Customer | OPEN_SUPPORT_TICKET | - | ALLOW |
| Active Customer | Support with Order Context | hasExistingOrderContext | ALLOW |
| Active Customer | Support with Order Context | no context | DENY |
| Suspended | VIEW_ORDER | own order | ALLOW |
| Suspended | OPEN_SUPPORT_TICKET | hasExistingOrderContext | ALLOW |
| Suspended | New Support | no context | DENY |
| Closed | All | - | DENY |

## 6. Guard/Validation Değişiklikleri
- `GUEST` kullanıcılar için global DENY guard.
- `CLOSED` hesaplar için global DENY guard.
- `VIEW_ORDER` için sahiplik (ownership) kontrolü.
- `SUSPENDED` kullanıcılar için sadece mevcut sipariş bağlamında kısıtlı destek izni.
- Sipariş bağlamı gerektiren aksiyonlar için `hasExistingOrderContext` zorunluluğu.

## 7. Komut Çıktıları
- `pnpm run typecheck`: PASS
- `pnpm run build`: PASS
- `customer-support-smoke.ts`: PASS (Tüm senaryolar: guest, active, suspended, closed, missing context)

## 8. Customer Service Smoke Sonucu: PASS
## 9. Customer Address Smoke Sonucu: PASS
## 10. Customer Contribution Smoke Sonucu: PASS
## 11. Customer Social Smoke Sonucu: PASS
## 12. Customer Reward Smoke Sonucu: PASS
## 13. Customer Support Smoke Sonucu: PASS
## 14. Diğer Smoke Sonuçları (Pool, Storefront, vb.): PASS

## 15. Boundary Review
- Paket sadece eligibility/visibility kontrolü yapar.
- Gerçek sipariş okuma veya destek bileti oluşturma işlemi yapılmaz.
- BFF sadece delegasyon ve validasyon yapar.
- Tüm kurallar merkezi serviste izole edilmiştir.

## 16. Kapsam Dışı Bırakılanlar
- Gerçek sipariş veritabanı entegrasyonu.
- Gerçek destek bileti (ticket) sistemi.
- Guest pre-order support (gelecek aşama).

## 17. Açık Teknik Borçlar
- Yok.

## 18. Karar: PASS
