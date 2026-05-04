# HARDENING-09E - Notification Email Sandbox Provider Boundary Closure Report

## 1. Kisa Ozet

Bu paket, `HARDENING-09A` provider boundary contract standardini notification sistemine entegre eder. `EMAIL` icin `sandbox`, `PUSH` icin `parked`, `SMS` icin `not_configured` modlarini destekleyen `FoundationNotificationProviderAdapter` korunmustur.

09E ilk kapanisinda `smoke:notification` regresyonu vardi. Regresyon giderildi. `notification.created` audit/outbox boundary tekrar smoke tarafindan gorunur ve dogrulanir durumdadir.

- `NotificationProviderAdapter` ve `FoundationNotificationProviderAdapter` korunmustur.
- `NotificationDeliveryAttempt.providerEnvelope` korunmustur.
- Audit/outbox payload serialization yolu JSON-safe hale getirilmistir.
- Smoke runner `.env` yukleyerek BFF ile ayni persistence modunu ve `DATABASE_URL` degerini kullanir.
- `smoke:notification`, `smoke:notification-provider-boundary`, `typecheck`, `build` ve `smoke:all` PASS oldu.

## 2. Kok Neden

`smoke:notification` normal script ile calistiginda test process'i `.env` yuklemiyordu. BFF `apps/bff/src/index.ts` uzerinden `.env` yukleyip `PERSISTENCE_MODE=postgres` ile audit/outbox kayitlarini postgres'e yazarken, smoke process'i `getAuditEventRepositories()` cagrisinda default `memory` repository aciyordu. Bu nedenle test, BFF'in yazdigi `notification.created` audit kaydini goremedi ve `[]` ile fail oldu.

Ek sertlestirme olarak provider envelope iceren audit/outbox `beforeState`, `afterState` ve metadata payload'lari JSON-safe normalize edildi. Bu, provider envelope korunurken gelecekte `undefined`, function, symbol, class instance veya circular reference kaynakli serialization bozulmalarini audit append yolundan uzak tutar.

## 3. Referans Dosyalar

- `packages/contracts/src/provider.ts`
- `packages/contracts/src/notification.ts`
- `services/notification/src/notification.ts`
- `services/notification/src/provider-adapter.ts`
- `apps/bff/src/server/notification.ts`
- `tests/smoke/suites/notification.ts`
- `tests/smoke/suites/notification-provider-boundary.ts`
- `tests/smoke/run-smoke.ts`
- `package.json`
- `.env.example`
- `HARDENING-09A-PLAN.md`
- `HARDENING-08B-NOTIFICATION-DELIVERY-BOUNDARY-HARDENING-CLOSURE-REPORT.md`

## 4. Degisen Dosyalar

| Dosya | Degisiklik |
|---|---|
| `services/notification/src/provider-adapter.ts` | `FoundationNotificationProviderAdapter` korunuyor; gercek network/provider cagrisi yok. |
| `packages/contracts/src/notification.ts` | `NotificationDeliveryAttempt.providerEnvelope?: ProviderResultEnvelope` korunuyor. |
| `services/notification/src/notification.ts` | Audit/outbox append oncesinde `beforeState`, `afterState` ve metadata icin JSON-safe normalization eklendi. `appendAuditAndOutbox` await edilmeye devam ediyor. |
| `tests/smoke/run-smoke.ts` | Smoke process'inin BFF ile ayni persistence ayarlarini kullanmasi icin `dotenv/config` eklendi. |
| `tests/smoke/suites/notification-provider-boundary.ts` | Provider envelope smoke suite'i korunuyor. |
| `tests/smoke/suites/notification.ts` | Degisiklik yok; 08B audit boundary beklentisi aynen korunarak PASS oldu. |
| `package.json` | `smoke:notification-provider-boundary` scripti korunuyor. |
| `apps/bff/tsconfig.json` | 09E path alias duzenlemesi korunuyor. |
| `HARDENING-09E-NOTIFICATION-EMAIL-SANDBOX-PROVIDER-BOUNDARY-CLOSURE-REPORT.md` | Regresyon sonucu ve kanitlar guncellendi. |

## 5. Audit Boundary Fix

- `notification.created` audit append'i `createNotification` icinde delivery attempt append ve delivery audit append islemlerinden sonra deterministic olarak `await appendAuditAndOutbox('notification.created', ...)` ile calismaya devam ediyor.
- `appendAuditAndOutbox` icindeki audit append ve outbox append sirali olarak `await` ediliyor.
- Smoke runner artik `.env` yukledigi icin `tests/smoke/suites/notification.ts` icindeki `audit.listAuditLogsByEntity('notification', 'notification', notificationId)` sorgusu BFF'in yazdigi postgres audit kayitlarini goruyor.
- Provider envelope audit/outbox payload icinde raw class instance olarak birakilmiyor; `toJsonSafe` Date degerlerini ISO string'e ceviriyor, `undefined`/function/symbol alanlari dusuruyor, array icindeki non-serializable alanlari `null` yapiyor ve circular reference gorurse `"[Circular]"` ile kesiyor.
- Audit/outbox business mutation yerine gecmedi; sadece append boundary kaydi olarak kaldi.

## 6. Notification Provider Boundary Review

- **Notification provider business truth owner oldu mu?** Hayir.
- **Notification baska domain truth mutate etti mi?** Hayir.
- **`actualProviderDeliveryPerformed:false` korundu mu?** Evet. `smoke:notification` ve `smoke:notification-provider-boundary` ile dogrulandi.
- **EMAIL sandbox kaldi mi?** Evet.
- **PUSH parked kaldi mi?** Evet.
- **SMS not_configured kaldi mi?** Evet.
- **Recipient spoof guard korundu mu?** Evet. `smoke:notification` PASS mesaji recipient spoof denial kontrolunu iceriyor.
- **notificationId-only mutation path geri geldi mi?** Hayir.
- **BFF truth owner oldu mu?** Hayir.
- **Gercek SendGrid/Mailgun/Twilio/Firebase/APNS/FCM entegrasyonu eklendi mi?** Hayir.
- **Gercek email/SMS/push gonderimi veya network cagrisi eklendi mi?** Hayir.
- **Webhook endpoint acildi mi?** Hayir.
- **Migration eklendi mi?** Hayir.
- **Worker/consumer yazildi mi?** Hayir.

## 7. Smoke / Test Kanitlari

| Komut | Sonuc | Not |
|---|---|---|
| `pnpm run typecheck` | PASS | Root workspace typecheck basarili. |
| `pnpm run build` | PASS | Root workspace build basarili. |
| `pnpm run smoke:notification-provider-boundary` | PASS | EMAIL sandbox, SMS not_configured, PUSH parked provider envelope dogrulandi. |
| `pnpm run smoke:notification` | PASS | Notification guard, recipient spoof denial, owner-scoped inbox/read/archive, admin override, provider boundary ve audit/outbox append boundary dogrulandi. |
| `pnpm run smoke:all` | PASS | Tum registered smoke suite'leri PASS oldu. |

## 8. Nihai Karar Onerisi

**PASS**

Gerekce: 09E provider boundary hedefi korunurken 08B notification audit boundary regresyonu giderildi. `notification.created` audit/outbox kaydi tekrar gorunur ve smoke tarafindan dogrulanir durumda. Kanit komutlari PASS oldu; gercek provider entegrasyonu, network cagrisi, webhook, migration veya worker eklenmedi.
