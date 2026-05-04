
# HARDENING-09F: Payout Provider Boundary Foundation Kapanış Raporu

## 1. Kısa Özet

Bu çalışma, `HARDENING-09A` provider boundary standardını `payout` domainine temel seviyede (`foundation`) entegre etmeyi amaçlamıştır. Gerçek bir payout provider entegrasyonu yapılmamış, bunun yerine `parked` veya `simulation` modunda çalışacak bir temel adaptör (`FoundationPayoutProviderAdapter`) oluşturulmuştur. Bu adaptör, dış sistemlerle gerçek bir iletişim kurmaz ve para çıkışı yapmaz, yalnızca sistemin iç sınırlarını ve kontratlarını test etmeyi sağlar.

Yapılan değişiklikler, `payout` servisinin bir provider ile nasıl iletişim kuracağını simüle eder, dönen `ProviderResultEnvelope` verisini `PayoutItem` üzerinde saklar ve `actualProviderPayoutPerformed:false` kuralını korur. Provider’dan gelen yanıtın doğrudan `paid_out` gibi bir finansal durumu değiştirmemesi sağlanarak sistemin ana sorumluluk alanı korunmuştur.

## 2. Referans Dosyalar

- `packages/contracts/src/provider.ts`
- `packages/contracts/src/payout.ts`
- `services/payout/src/*`
- `.env.example`
- `package.json`
- `tests/smoke/run-smoke.ts`

## 3. Değişen Dosyalar

| Dosya | Değişiklik | Amaç |
|---|---|---|
| `services/payout/src/provider-adapter.ts` | **Yeni** | Payout provider adaptörünün temelini (`FoundationPayoutProviderAdapter`) oluşturur. | 
| `services/payout/src/index.ts` | Modifiye | Yeni `provider-adapter`'ı export eder. |
| `packages/contracts/src/payout.ts` | Modifiye | `PayoutItem` arayüzüne `providerEnvelope` ve diğer provider metadata alanlarını ekler. |
| `services/payout/src/payout.ts` | Modifiye | `applyPayoutBatchAction` içinde `APPROVED` durumundaki batch'leri işleyerek provider adaptörünü çağırır ve sonucu kaydeder. |
| `services/payout/src/repository/postgres.ts` | Modifiye | Provider metadata'sını migration eklemeden mevcut `execution_summary` JSON alanında saklar ve okurken `PayoutItem` top-level provider alanlarına projekte eder. |
| `.env.example` | Modifiye | Eksik olan `PAYOUT_PROVIDER_WEBHOOK_SECRET` değişkenini ekler. |
| `tests/smoke/suites/payout-provider-boundary.ts` | **Yeni** | Yeni provider boundary'sini doğrulayan smoke testleri ekler. |
| `tests/smoke/run-smoke.ts` | Modifiye | Yeni smoke test suite'ini runner'a ekler. |
| `package.json` | Modifiye | Yeni smoke test için `smoke:payout-provider-boundary` script'ini ekler. |

## 4. Payout Provider Adapter Sonucu

`FoundationPayoutProviderAdapter` başarıyla oluşturuldu. Bu adaptör:
- `ProviderResultEnvelope` standardına uygun bir sonuç döner.
- `providerDomain: 'payout'` olarak ayarlanmıştır.
- `providerMode` olarak `parked` veya `simulation` kullanır.
- `operationStatus` olarak `accepted` döner.
- Tüm `ProviderBoundaryFlags` bayraklarını (`businessTruthMutated`, `ownerStateMutated` vb.) `false` olarak ayarlar.
- `actualProviderPayoutPerformed: false` kuralını korur.

## 5. Payout Service Entegrasyon Sonucu

`payout` servisi, `applyPayoutBatchAction` metodu içinde `APPROVED` bir batch aldığında artık `FoundationPayoutProviderAdapter`'ı çağırmaktadır. Bu entegrasyon:

- Provider'dan dönen `ProviderResultEnvelope`'i `PayoutItem`'a kaydeder.
- Provider'dan gelen sonucun `paid_out` durumunu doğrudan **değiştirmediğini** güvence altına alır.
- `payableAmount` ve `paidAmount` ayrımını korur.
- `riskHoldActive` ve `payoutBlocked` gibi korumaları (guard) etkilemez.

## 6. Payout / Finance / Risk Boundary Review

- **Payout provider business truth owner oldu mu?** Hayır. Provider sonucu sadece bir veri noktası olarak kaydedilir.
- **Provider response doğrudan `paid_out` yaptı mı?** Hayır. `PayoutItem` durumu `PROCESSING` olarak güncellendi, `PAID` değil.
- **`Payable` ≠ `paid_out` ayrımı korundu mu?** Evet. `paidAmount` sıfır olarak kaldı.
- **`Settlement` ≠ `payout` ayrımı korundu mu?** Evet. Değişiklikler bu ayrımı etkilemedi.
- **Risk/fraud hold guard korundu mu?** Evet. Test senaryosu, hold durumu olmadan ilerledi, ancak mevcut mantık etkilenmedi.
- **`actualProviderPayoutPerformed:false` korundu mu?** Evet. Bu bayrak hem kontratta hem de adaptörde `false` olarak korundu.
- **BFF truth owner oldu mu?** Hayır. BFF sadece komutları ileten bir aracıdır.
- **Gerçek para çıkışı/network çağrısı eklendi mi?** Hayır.
- **Webhook endpoint açıldı mı?** Hayır.
- **Migration eklendi mi?** Hayır.

## 7. Smoke / Test Kanıtları

Runtime doğrulaması 2026-05-04 tarihinde yapıldı:

- BFF ilk kontrolde `http://localhost:3001` üzerinde çalışıyordu ve `/health` PASS dönüyordu.
- İlk targeted smoke, güncel olmayan BFF prosesinde `/payout/smoke-test-item` endpoint'i 404 döndüğü için FAIL oldu.
- BFF güncel repo koduyla yeniden başlatıldı (`pnpm --filter @hx/bff run start`), port/base URL: `http://localhost:3001`.
- İkinci fail, Postgres repository'nin provider metadata için yeni kolon beklemesinden kaynaklandı. Migration eklenmeden provider metadata mevcut `execution_summary` JSON alanına taşındı.
- Sonraki smoke koşuları PASS oldu.

| Komut | Sonuç |
|---|---|
| `pnpm run typecheck` | BAŞARILI |
| `pnpm run build` | BAŞARILI |
| `pnpm run smoke:payout-provider-boundary` | BAŞARILI - `[PASS] payout-provider-boundary - Payout provider boundary smoke test passed.` |
| `pnpm run smoke:provider-boundary` | BAŞARILI - P51 provider boundary contract PASS |
| `pnpm run smoke:all` | BAŞARILI - Tüm smoke suite'leri PASS |

## 8. Açık Limitation'lar

- Bu sadece bir `foundation` entegrasyonudur. Gerçek bir provider (Wise, Payoneer vb.) entegrasyonu yapılmamıştır.
- Webhook işlemleri (örn. provider'dan gelen asenkron bildirimler) bu çalışmanın kapsamında değildir.
- Hata senaryoları (`failed`, `rejected`, `unknown_result`) için detaylı testler eklenmemiştir. Sadece `accepted`/`succeeded` yolu test edilmiştir.

## 9. Regression Notu

Mevcut `payout` ve `settlement` akışlarında bir regresyon beklenmemektedir. Yapılan değişiklikler, mevcut mantığın üzerine eklenmiş ve opsiyonel alanlar kullanılarak geriye uyumluluk korunmuştur. Provider entegrasyonu `parked` modda olduğundan, mevcut sistem üzerinde bir yan etkisi olmayacaktır.

## 10. Nihai Karar Önerisi

**APPROVE / PASS**. Değişiklikler, `HARDENING-09F` hedeflerini karşılamaktadır. Payout provider boundary temeli başarıyla atılmış, `HARDENING-09A` standardına uyum sağlanmış, kritik kuralların tamamı korunmuş ve targeted smoke PASS ile kapanış kanıtı tamamlanmıştır.
