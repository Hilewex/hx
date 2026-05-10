
# HARDENING-10C10-01: PayTR Status Inquiry Contract + Mapping Foundation — Closure Report

## 1. Paket Tanımı

Bu paket, `HARDENING-10C10-B` envanter kararlarına uygun olarak, PayTR Durum Sorgu (Status Inquiry) API entegrasyonu için temel sözleşmeleri (contracts), token oluşturma ve yanıt eşleme (mapping) yardımcı fonksiyonlarını içerir. Bu çalışma, canlı bir entegrasyon veya mutasyon paketi değildir; yalnızca gelecekteki mutabakat (reconciliation) adımları için güvenli ve test edilebilir bir temel oluşturur.

## 2. Değişen Dosyalar

- `packages/contracts/src/payment.ts`: Yeni PayTR durum sorgu tipleri, token, para birimi, tutar ve eşleme yardımcı fonksiyonları eklendi. **Düzeltme 1 ve 2 uygulandı.**
- `tests/smoke/suites/paytr-status-inquiry-mapping.ts`: Yeni test suiti oluşturuldu ve eksik senaryolar eklendi. **Düzeltme 3 uygulandı.**

## 3. Eklenen Contract Tipleri

- `PaytrStatusInquiryRequest`
- `PaytrStatusInquirySuccessResponse` (`payment_amount` ve `payment_total` `string | number` olarak güncellendi)
- `PaytrStatusInquiryErrorResponse`
- `PaytrStatusInquiryResponse`
- `NormalizedPaytrStatusInquiryStatus`
- `NormalizedPaytrStatusInquiryCandidate`: Provider yanıtını doğrudan bir iş gerçeği (business truth) olarak kabul etmeyen, güvenli ve normalize edilmiş dahili aday tipi.

## 4. Eklenen Helper Fonksiyonları

- `createPaytrStatusInquiryToken(input)`: PayTR API'si için gereken `paytr_token` değerini deterministik olarak oluşturan pure function.
- `normalizePaytrCurrency(input)`: PayTR'den gelen para birimi değerlerini (örn: `TL` -> `TRY`) standart formata dönüştürür.
- `parsePaytrAmountToMinorUnit(input)`: PayTR'den gelen çeşitli string ve number formatlarındaki tutarları güvenli bir şekilde kuruş (minor unit) cinsine çevirir, floating point hatalarından kaçınır.
- `mapPaytrStatusInquiryToReconciliationCandidate(input)`: PayTR durum sorgu yanıtını, iş kurallarına göre (tutar/para birimi eşleşmesi, hata durumları vb.) `NormalizedPaytrStatusInquiryCandidate` tipine eşler. **Düzeltme 2'ye göre güncellendi.**

## 5. Mapping Kararları

- **status: success**: `payment_amount` ve `payment_total` parse edilip karşılaştırılır. Farklılarsa `rejected_amount_mismatch` (amount ambiguity) üretilir. Her ikisi de `expectedAmountMinor` ile eşleşmiyorsa `rejected_amount_mismatch` üretilir. Eşleşiyorsa `succeeded_candidate` üretilir.
- **Amount Mismatch**: `rejected_amount_mismatch` durumu ile işaretlenir, `shouldReject: true` ve `shouldReconcile: true` olarak ayarlanır.
- **Currency Mismatch**: `rejected_currency_mismatch` durumu ile işaretlenir, `shouldReject: true` ve `shouldReconcile: true` olarak ayarlanır.
- **Invalid Amount Format**: `payment_amount` veya `payment_total` parse edilemezse, ayrı `rejectionReason`'lar ile `rejected_unexpected_format` üretilir.
- **Error: "odeme bulunamadi"**: `status_query_inconclusive` olarak işaretlenir. Ödeme doğrudan `FAILED` yapılmaz, `shouldReconcile: true` olarak ayarlanır.
- **Diğer Hatalar**: `status_query_failed` olarak işaretlenir ve `shouldReconcile: true` olarak ayarlanır.
- **Returns Alanı**: Bu paket kapsamında `returns` alanı parse edilmez ve mutabakat kararlarında kullanılmaz. Eklenen testler, bu alanın `candidate` statüsünü etkilemediğini doğrular.

## 6. Boundary / Owner Safety Kontrolü

- Mapping sonucunda üretilen tüm `candidate` nesneleri, `createProviderBoundaryFlags()` fonksiyonu kullanılarak oluşturulan sınır işaretlerini (`boundary flags`) içerir.
- Bu işaretler, provider'dan gelen yanıtın bir iş gerçeği olmadığını (`providerTruth: false`), bu işlemin sahip varlık (`owner state`) veya olay (`event truth`) üzerinde bir mutasyon gerçekleştirmediğini açıkça belirtir.
- Eklenen testler, `candidate.boundary`'nin güvenli kaldığını doğrular.

## 7. Kapsam Dışı Bırakılanlar

Bu çalışma planlandığı gibi aşağıdaki maddeleri içermemektedir:

- Live PayTR network isteği.
- Payment, Order, Finance, Risk state mutasyonları.
- Worker runtime, scheduler veya queue mekanizmaları.
- Veritabanı migration'ları.
- BFF route değişiklikleri.

## 8. Smoke/Test Kanıtları

İstenen tüm komutlar başarıyla tamamlanmıştır.

1.  **Type Check**: `pnpm run typecheck` komutu hatasız tamamlandı.
2.  **Build**: `pnpm run build` komutu hatasız tamamlandı.
3.  **Smoke Test**: `pnpm run smoke:paytr-status-inquiry-mapping` komutu başarıyla çalıştı ve tüm test senaryoları geçti.

```
> hx-monorepo@1.0.0 smoke:paytr-status-inquiry-mapping C:\gelistirme\HX
> tsx tests/smoke/run-smoke.ts paytr-status-inquiry-mapping

Running smoke tests against http://localhost:3001
[PASS] paytr-status-inquiry-mapping - All PayTR status inquiry mapping tests passed.
```

## 9. Kırmızı Bayrak / Sarı Bayrak

- **Sarı Bayrak**: Projedeki bazı `tsconfig.json` dosyaları, `baseUrl` gibi kullanımdan kaldırılmış seçenekler veya `dotenv` gibi eksik tip tanımlamaları hakkında uyarılar vermektedir. Bu uyarılar bu görevin kapsamını engellememiştir ancak ileride teknik borç yaratabilir.

## 10. Nihai Karar

**HARDENING-10C10-01-FIX1 — PASS WITH LIMITATION**
