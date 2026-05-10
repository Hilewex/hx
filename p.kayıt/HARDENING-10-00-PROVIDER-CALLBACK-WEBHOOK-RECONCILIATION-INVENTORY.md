# HARDENING-10-00 — Provider Callback / Webhook / Reconciliation Inventory

## 1. Durum

**COMPLETE / IMPLEMENTATION REQUIRED**

Bu rapor, HARDENING-09 sonrası provider callback, webhook ve reconciliation tarafında mevcut repo gerçekliğini çıkarmak için hazırlanmıştır.

HARDENING-09 ile outbound provider boundary foundation kurulmuştur. Ancak inbound provider callback / webhook / reconciliation altyapısının henüz kurulmadığı tespit edilmiştir.

## 2. Ana Bulgular

| Başlık | Durum | Not |
|---|---|---|
| Ortak ProviderCallbackEnvelope | FOUND | `packages/contracts/src/provider.ts` içinde mevcut. |
| ProviderCallbackEnvelope kullanımı | NOT FOUND | Servis veya BFF tarafında kullanılmıyor. |
| Payment callback/webhook endpoint | NOT FOUND | Payment için inbound callback route yok. |
| Shipment carrier callback/tracking ingestion | NOT FOUND | Dış carrier event ingestion yok. |
| Notification delivery result callback | NOT FOUND | Email/SMS/Push delivery callback yok. |
| Payout provider result callback | NOT FOUND | Payout result callback yok. |
| Signature verification | NOT FOUND | Ortak veya domain-specific helper yok. |
| Duplicate/replay detection | NOT FOUND | Callback replay guard yok. |
| Callback idempotency persistence | NOT FOUND / PARTIAL | Özel callback idempotency repository/table yok; outbox idempotency kısmen kullanılabilir. |
| Callback raw payload persistence | PARTIAL | Audit/outbox JSON alanları kısa vadede kullanılabilir. |
| Reconciliation runtime | NOT FOUND | Unknown-result follow-up/retry/reconciliation yok. |
| Callback smoke suite | NOT FOUND | Callback foundation testleri yok. |

## 3. Payment Callback / Webhook Inventory

| Kontrol | Durum | Kanıt / Not |
|---|---|---|
| Payment callback endpoint var mı? | NOT FOUND | BFF veya payment service içinde callback endpoint yok. |
| Payment webhook route var mı? | NOT FOUND | Route tanımı yok. |
| Provider event id tutuluyor mu? | NOT FOUND | Callback mekanizması olmadığı için alınmıyor/saklanmıyor. |
| Signature verification var mı? | NOT FOUND | Yok. |
| Duplicate callback guard var mı? | NOT FOUND | Yok. |
| Callback idempotency persistence var mı? | PARTIAL | Outbox idempotency temel sağlayabilir ama özel callback repo yok. |
| Unknown-result reconciliation var mı? | NOT FOUND | 09C’de pending/unknown_result smoke var; reconciliation yok. |
| Callback provider response order/finance truth mutate ediyor mu? | N/A | Callback işlenmediği için risk şu an aktif değil. |
| Callback audit/outbox kaydı var mı? | NOT FOUND | Callback özel audit/outbox akışı yok. |
| Callback smoke testi var mı? | NOT FOUND | Yok. |

## 4. Shipment Callback / Tracking Inventory

| Kontrol | Durum | Kanıt / Not |
|---|---|---|
| Shipment/carrier callback endpoint var mı? | NOT FOUND | Yok. |
| Tracking event ingestion var mı? | NOT FOUND | Yok. |
| Provider tracking id / carrier event id tutuluyor mu? | NOT FOUND | Callback yok. |
| Signature verification var mı? | NOT FOUND | Yok. |
| Duplicate/replay guard var mı? | NOT FOUND | Yok. |
| Callback status doğrudan DELIVERED yapıyor mu? | N/A | Callback işlenmiyor. |
| Delivered sonrası eligibility doğrudan açılıyor mu? | N/A | Callback işlenmiyor. |
| Audit/outbox kaydı var mı? | NOT FOUND | Callback için yok. |
| Smoke testi var mı? | NOT FOUND | Yok. |

## 5. Notification Delivery Callback Inventory

| Kontrol | Durum | Kanıt / Not |
|---|---|---|
| Email/SMS/Push delivery result callback endpoint var mı? | NOT FOUND | Yok. |
| Provider delivery event id tutuluyor mu? | NOT FOUND | Yok. |
| Delivery result provider envelope’a bağlanıyor mu? | NOT FOUND | ProviderCallbackEnvelope kullanılmıyor. |
| Signature verification var mı? | NOT FOUND | Yok. |
| Duplicate/replay guard var mı? | NOT FOUND | Yok. |
| actualProviderDeliveryPerformed:false standardı bozuluyor mu? | N/A | Callback işlenmiyor. |
| Notification başka domain truth mutate ediyor mu? | N/A | Callback işlenmiyor. |
| Audit/outbox kaydı var mı? | NOT FOUND | Callback için yok. |
| Smoke testi var mı? | NOT FOUND | Yok. |

## 6. Payout Callback / Provider Result Inventory

| Kontrol | Durum | Kanıt / Not |
|---|---|---|
| Payout result callback endpoint var mı? | NOT FOUND | Yok. |
| Provider payout event id / payout reference tutuluyor mu? | NOT FOUND | Yok. |
| Signature verification var mı? | NOT FOUND | Yok. |
| Duplicate/replay guard var mı? | NOT FOUND | Yok. |
| Callback result doğrudan paid_out yapıyor mu? | N/A | Callback işlenmiyor. |
| Payable ≠ paid_out ayrımı korunuyor mu? | N/A | Callback yok. |
| Risk/fraud hold guard callback tarafında var mı? | N/A | Callback yok. |
| Audit/outbox kaydı var mı? | NOT FOUND | Callback için yok. |
| Smoke testi var mı? | NOT FOUND | Yok. |

## 7. Ortak Callback / Webhook Foundation Inventory

| Kontrol | Durum | Not |
|---|---|---|
| Ortak callback envelope var mı? | FOUND | `ProviderCallbackEnvelope` mevcut. |
| ProviderCallbackEnvelope kullanılıyor mu? | NOT FOUND | Hiçbir servis/BFF kullanmıyor. |
| Webhook signature helper var mı? | NOT FOUND | Yok. |
| Callback idempotency repository var mı? | NOT FOUND / PARTIAL | Özel repo yok; outbox idempotency kısmi temel olabilir. |
| Callback raw payload persistence var mı? | PARTIAL | Audit metadata / afterState gibi JSON alanları kısa vadede kullanılabilir. |
| Callback replay detection var mı? | NOT FOUND | Yok. |
| Correlation / causation / trace id taşınıyor mu? | FOUND | Audit/outbox kayıt modellerinde mevcut. |
| request_id / command_id / event_id standardı var mı? | FOUND | Genel event/audit yapılarında mevcut. |
| callback error codes API_ERROR_CATALOG ile hizalı mı? | N/A | Callback mekanizması yok. |
| callback smoke suite var mı? | NOT FOUND | Yok. |

## 8. Persistence / Migration Inventory

| Kontrol | Durum | Not |
|---|---|---|
| Callback için özel tablo var mı? | NOT FOUND | `provider_callback_events` gibi tablo yok. |
| Provider callback event table var mı? | NOT FOUND | Yok. |
| Callback idempotency table var mı? | NOT FOUND / PARTIAL | Ayrı tablo yok; outbox idempotency kısmen kullanılabilir. |
| Outbox/audit mevcut schema callback için yeterli mi? | PARTIAL | Kısa vadede JSON metadata kullanılabilir; sağlam altyapı için özel tablo daha doğru. |
| Migration gerekiyor mu? | YES | Sağlam callback foundation için özel tablo önerilir. |
| Migration olmadan JSON alanları yeterli mi? | YES / LIMITATION | Kısa vadede mümkün; sorgulama ve bakım zorluğu yaratır. |

## 9. Cross-System Boundary Riskleri

### P0

Şu anda aktif P0 yoktur. Çünkü sistem dış provider callback/webhook kabul etmemektedir.

### P1

Callback mekanizması eklendiğinde aşağıdaki riskler P1/P0 seviyesine çıkabilir:

- Signature verification olmadan sahte callback işleme.
- Duplicate/replay guard olmadan aynı callback’in ikinci finansal/operasyonel etki üretmesi.
- Callback provider response’un owner state’i doğrudan mutate etmesi.
- BFF’in truth owner gibi davranması.
- Event/audit/outbox kayıtlarının business mutation yerine kullanılması.

### P2

- Public webhook endpoint’te rate limit/abuse guard eksikliği.
- Raw payload saklama/maskeleme standardı eksikliği.
- Callback error code standardının API_ERROR_CATALOG ile hizalanmaması.
- Provider-specific timeout/retry/reconciliation eksikliği.

## 10. HARDENING-10A İçin İlk Öneri

İlk implementation önce ortak callback foundation olmalıdır.

Önerilen güvenli sıra:

1. **HARDENING-10A1 — Provider Callback Contract Only**
2. **HARDENING-10A2 — Provider Callback Signature Helper Only**
3. **HARDENING-10A3 — Provider Callback Persistence / Migration Only**
4. **HARDENING-10A4 — Provider Callback In-Memory Smoke Only**
5. **HARDENING-10A5 — Provider Callback Final Regression**

İlk başarısız 10A denemesinde tek pakette contract + persistence + migration + signature + smoke yapılmaya çalışıldığı için scope fazla büyümüştür. Yeni denemede bu yaklaşım terk edilmelidir.

## 11. HARDENING-10A1 İçin Dar Scope

HARDENING-10A1 sadece contract seviyesinde ilerlemelidir.

Kapsam:

- `packages/contracts/src/provider.ts`
- Gerekirse `packages/contracts/src/index.ts`

Yasaklar:

- Yeni dosya yok.
- Migration yok.
- Persistence yok.
- Signature helper yok.
- Smoke yok.
- BFF route yok.
- Worker/consumer yok.
- Root `tsconfig.json` oluşturma yok.
- `tsconfig.base.json` değiştirme yok.
- Services `tsconfig.json` dosyalarına dokunma yok.
- Relative import denemesi yok.
- `package.json` değiştirme yok.
- `pnpm install` yok.

Zorunlu komutlar:

- `pnpm --filter @hx/contracts run build`
- `pnpm run typecheck`
- `pnpm run build`
- `pnpm run smoke:provider-boundary`

## 12. Nihai Inventory Kararı

**COMPLETE / IMPLEMENTATION REQUIRED**

Inventory tamamlandı. Sistem provider callback/webhook/reconciliation altyapısına sahip değildir. HARDENING-10 implementation gereklidir, ancak küçük ve kontrollü alt paketlerle ilerlenmelidir.

## 13. Sonraki Paket

**HARDENING-10A1 — Provider Callback Contract Only**