# HARDENING-08-00B — Notification / Delivery / User Communication Inventory

## 1. Kısa Özet
- Bu paket inventory paketidir.
- Kod değişikliği yapılmadı.
- PASS/FAIL verilmedi.
- En kritik 5 notification/delivery bulgusu:
  1. `packages/contracts/src/notification.ts` içinde `NotificationRecord`, `NotificationChannel`, `NotificationDeliveryAttempt`, delivery state ve provider type modeli var; ancak recipient ayrı canonical model değil, `actorType` + `actorId` notification sahibi/recipient gibi kullanılıyor.
  2. `services/notification/src/notification.ts` notification truth alanını oluşturuyor, read/archive state mutate ediyor, delivery attempt kaydı üretiyor ve audit/outbox append ediyor; fakat gerçek provider send yok, tüm attempt'lerde `actualProviderDeliveryPerformed:false`.
  3. Email `EMAIL_SANDBOX`, push `PUSH_PARKED`, SMS `PROVIDER_NOT_CONFIGURED`, in-app/panel task `SANDBOX_DELIVERED` seviyesinde; provider response payload, webhook callback ve delivered confirmation yok.
  4. BFF notification route'ları body/query actor alanlarını doğrudan kullanıyor; `context` ile actor/recipient ownership guard yok. Guest veya başka actor adına create/list/read/archive spoof riski var.
  5. `services/notification/src/smoke-test.ts` service-level smoke var; root `tests/smoke/suites/*notification*` ve `package.json` içinde `smoke:notification` yok. Bu inventoryde test/build/smoke çalıştırılmadı.

## 2. Referans Dosya Kontrolü
| Dosya | Durum | Not |
|---|---|---|
| `HARDENING-08-00A-ANALYTICS-EVENT-AUDIT-INVENTORY.md` | FOUND | 08-00A notification için audit/outbox + delivery-attempt foundation, provider delivery sandbox/parked ve root smoke eksikliği kaydetmiş. |
| `HARDENING-07-FINAL-CLOSURE-REPORT.md` | FOUND | 07 finalde 08 yönü olarak analytics/notification/event consistency ve event/outbox consumer borcu kayıtlı. |
| `HARDENING-06-FINAL-CLOSURE-REPORT.md` | FOUND | Provider sandbox/production-readiness ve audit/outbox dashboarding borcu limitation olarak duruyor. |
| `planlama/HARDENING_PROGRESS_RECORD (1).md` | FOUND | Repo içinde kullanılan progress record; 06/07 hardening kayıtları mevcut. |
| `HARDENING_PROGRESS_RECORD.md` | NOT FOUND | Root'ta bulunmadı. |
| `planlama/40-admin sistemi.md` | FOUND | Panel direct write yapmaz; kritik aksiyon audit gerektirir. |
| `planlama/25-kural -yetki sistemi.md` | FOUND | BFF/UI truth üretmez, event ile state mutate edilmez, owner dışı write yoktur. |
| `planlama/62-MASTER_IMPLEMENTATION_PLAN.md` | FOUND | Faz 10 Paket 38 notification foundation: notification orchestration, inbox, transactional email sandbox. |
| `planlama/aşama-11/EVENT_TAXONOMY.md` | FOUND | Notification/support event ailesi var; event truth owner değildir. |
| `planlama/aşama-11/AUDIT_TAXONOMY.md` | FOUND | Audit business truth yerine geçmez; kritik mutation/decision audit zorunlu. |
| `planlama/aşama-12/OPERATION_LOGIC_GUIDE.md` | FOUND | Notification projection'dır; official owner outcome değildir. |
| `planlama/aşama-2/OWNER_MATRIX.md` | FOUND | Notification social/analytics gibi projection kullanan alandır; BFF truth owner değildir. |
| `planlama/aşama-2/GUARD_MATRIX.md` | FOUND | Auth/scope/ownership/idempotency guard zinciri kritik aksiyonlar için gerekli. |
| `planlama/aşama-5/API_ERROR_CATALOG.md` | FOUND | Auth, permission, idempotency, event/audit error dili var. |
| `planlama/TEST_STRATEJISI.md` | FOUND | Kritik kapanışta test kanıtı zorunlu; çalıştırılmayan komut PASS kanıtı değildir. |

## 3. İncelenen Repo Dosyaları
| Alan | Dosya/Yol | Durum | Not |
|---|---|---|---|
| Notification contract | `packages/contracts/src/notification.ts` | FOUND | Record, channel, state, delivery attempt, provider type, preference snapshot tipleri var. |
| Analytics contract | `packages/contracts/src/analytics.ts` | FOUND | Notification ile doğrudan bağlantı görülmedi; 08-00A'da analytics inventory çıkarılmıştı. |
| Contracts index | `packages/contracts/src/index.ts` | FOUND | `notification` ve `analytics` export ediliyor. |
| Events package | `packages/events/src/envelope.ts`, `index.ts` | FOUND | Minimal `EventEnvelope`; notification producer'ları bu envelope standardını kullanmıyor. |
| Audit/outbox persistence | `packages/persistence/src/audit-event.ts` | FOUND | Audit/outbox memory + Postgres repo, pending/published/failed status, retryCount var. |
| Persistence schema verify | `packages/persistence/verify-schema.ts` | FOUND | `notifications`, `notification_delivery_attempts`, `notification_idempotency` tablolarını kontrol ediyor. |
| Notification service | `services/notification/src/notification.ts` | FOUND | Create/list/get/read/archive, delivery attempt, audit/outbox append var. |
| Notification repository | `services/notification/src/repository/*` | FOUND | In-memory ve Postgres repository var. |
| Notification service smoke | `services/notification/src/smoke-test.ts` | PARTIAL | Service-level smoke var; root smoke registry'ye bağlı değil. |
| Analytics service | `services/analytics/src/*` | FOUND | Notification delivery ile doğrudan bağlantı bulunmadı. |
| Risk service | `services/risk/src/risk.ts` | FOUND | Audit append var; notification tetikleme bulunmadı. |
| Moderation service | `services/moderation/src/moderation.ts` | FOUND | Audit/outbox append var; notification tetikleme bulunmadı. |
| Payment service | `services/payment/src/payment.ts` | FOUND | Audit/outbox ve provider simulation var; notification tetikleme bulunmadı. |
| Order service | `services/order/src/order.ts` | FOUND | Audit/outbox append var; notification tetikleme bulunmadı. |
| Customer service | `services/customer/src/*` | FOUND | Notification tetikleme kanıtı bulunmadı. |
| Support service | `services/support/src/support.ts` | PARTIAL | Optional notification hook yorumu var; gerçek `createNotification` çağrısı yok. |
| BFF notification | `apps/bff/src/server/notification.ts` | FOUND | Body/query delegation; actor context guard yok. |
| BFF route registry | `apps/bff/src/server/index.ts` | FOUND | `/notification/create`, `/notification/list`, `/notification/:id`, `/notification/read`, `/notification/archive` kayıtlı. |
| BFF analytics/risk/moderation/payment/order | `apps/bff/src/server/*.ts` | FOUND | Notification ile doğrudan route coupling yok; risk/moderation guard'lı, notification guard'sız. |
| Migration | `infra/migrations/20260427_005_notification_provider_hardening.sql` | FOUND | Notification, delivery attempts, idempotency tabloları var. |
| Event/audit migration | `infra/migrations/20260426_001_event_audit_durability.sql` | FOUND | `audit_logs` ve `event_outbox` var. |
| Root smoke suites | `tests/smoke/suites/*notification*`, `*delivery*`, `*event*`, `*audit*` | NOT FOUND | Eşleşen suite bulunmadı. |
| Smoke runner | `tests/smoke/run-smoke.ts` | FOUND | Notification/delivery/event/audit suite kayıtlı değil. |
| Root package | `package.json` | FOUND | `smoke:notification`, `smoke:delivery`, `smoke:event`, `smoke:audit` scriptleri yok. |

## 4. Notification Contract Inventory
| Bileşen | Dosya | Gerçek Durum | Kanıt | Risk |
|---|---|---|---|---|
| NotificationRecord | `packages/contracts/src/notification.ts` | Var. | `NotificationRecord extends NotificationDeliverySummary`; state, channels, title/body, object, correlation/idempotency ve boundary flags içeriyor. | Orta: recipient ayrı model değil; actor alanı recipient gibi kullanılıyor. |
| NotificationChannel | `packages/contracts/src/notification.ts` | Var. | `IN_APP`, `PUSH`, `EMAIL`, `SMS`, `PANEL_TASK`. | Düşük/Orta: channel var ama provider adapter contract yok. |
| DeliveryAttempt | `packages/contracts/src/notification.ts` | Var. | `attemptId`, `providerType`, `state`, `attemptedAt`, `error`, `actualProviderDeliveryPerformed`. | Orta: provider response/callback alanı yok. |
| DeliveryStatus | `packages/contracts/src/notification.ts` | PARTIAL. | `NotificationDeliveryState`: `PENDING`, `SANDBOX_DELIVERED`, `DELIVERY_FAILED`, `PROVIDER_NOT_CONFIGURED`, `PUSH_PROVIDER_PARKED`, `SKIPPED_DIGEST`. | Yüksek: real `SENT/DELIVERED/BOUNCED` lifecycle yok. |
| Recipient | `packages/contracts/src/notification.ts` | PARTIAL. | `actorType` + `actorId` record/list command içinde var. | Yüksek: explicit `recipientId`, `userId`, `customerId` ownership contract yok. |
| Template | `packages/contracts/src/notification.ts` | NOT FOUND. | `title` ve `body` raw string; `templateId`/variables yok. | Orta. |
| Correlation / causation | `packages/contracts/src/notification.ts` | PARTIAL. | `correlationId` var; `causationId` yok. | Orta. |
| Idempotency | `packages/contracts/src/notification.ts` | Var. | `idempotencyKey` command/record alanı. | Orta: BFF idempotency zorunlu kılmıyor. |
| Provider metadata | `packages/contracts/src/notification.ts` | PARTIAL. | `providerType`, `error`, `actualProviderDeliveryPerformed` var. | Yüksek: provider response/ref/message id yok. |
| Read / archive state | `packages/contracts/src/notification.ts` | Var. | `NotificationState = UNREAD/READ/ARCHIVED`, `readAt`, `archivedAt`. | Orta: ownership guard contract yok. |
| User preference | `packages/contracts/src/notification.ts` | PARTIAL. | `NotificationPreferenceSnapshot` type var; service/repository kullanımı yok. | Yüksek: opt-in/opt-out persistence ve enforcement yok. |

## 5. Notification Service Inventory
| Fonksiyon/Akış | Dosya | Mevcut Davranış | Boundary Durumu | Risk |
|---|---|---|---|---|
| create notification | `services/notification/src/notification.ts` | Actor/content validate eder, idempotency check yapar, `UNREAD` record oluşturur, default channel belirler. | PARTIAL | Body'den gelen actor'a güvenir; recipient ownership yok. |
| list notification | `services/notification/src/notification.ts`, repository | `actorType` + `actorId` ile liste ve unread count döndürür. | PARTIAL | Query actor context'ten değil dış girdiden geliyor. |
| get notification | `services/notification/src/notification.ts` | Sadece `notificationId` ile record döndürür. | UNSAFE | Actor ownership kontrolü yok. |
| mark read | `services/notification/src/notification.ts` | `UNREAD` ise `READ` yapar, `readAt` set eder, audit/outbox append eder. | PARTIAL | Sadece notificationId ile mutate ediyor; actor owner guard yok. |
| archive | `services/notification/src/notification.ts` | `ARCHIVED` yapar, `archivedAt` set eder, critical/mandatory archive warning üretir. | PARTIAL | Actor owner guard yok; mandatory/critical archive block değil warning. |
| create delivery attempt | `services/notification/src/notification.ts` | Her channel için attempt oluşturur ve repository'ye ekler. | PARTIAL | Attempt service içinde synchronous foundation; provider abstraction yok. |
| retry delivery | Repo/service | Yok. | UNCLEAR | Retry policy/worker bulunmadı. |
| provider send | `services/notification/src/notification.ts` | Email/in-app/panel sandbox delivered, push parked, SMS not configured olarak işaretlenir. | SAFE for boundary, incomplete for production | Actual provider send yok; delivery garantisi yok. |
| audit/outbox append | `services/notification/src/notification.ts` | `notification.created`, `notification.delivery_attempted`, `notification.delivery_failed`, `notification.provider_parked`, `notification.read`, `notification.archived` için append eder. | PARTIAL | Append failure warning'a düşer; outbox delivery worker yok. |

## 6. Delivery / Provider Inventory
| Alan | Mevcut Durum | Kanıt | Risk |
|---|---|---|---|
| Email provider | Sandbox. | Channel `EMAIL` -> providerType `EMAIL_SANDBOX`, state `SANDBOX_DELIVERED`, `actualProviderDeliveryPerformed:false`. | Yüksek: email gönderimi gerçek değil. |
| SMS provider | Parked/not configured. | Channel `SMS` -> providerType `SMS_PARKED`, state `PROVIDER_NOT_CONFIGURED`, warning `SMS_PROVIDER_NOT_CONFIGURED`. | Yüksek. |
| Push provider | Parked. | Channel `PUSH` -> providerType `PUSH_PARKED`, state `PUSH_PROVIDER_PARKED`, warning `PUSH_PROVIDER_PARKED`. | Yüksek. |
| Webhook provider | NOT FOUND. | Contract/service içinde webhook channel/provider yok. | Orta. |
| Sandbox / mock provider | Var. | `EMAIL_SANDBOX`, `SANDBOX_DELIVERED`, in-app/panel task sandbox state. | Orta: test/foundation için açık, production delivery değildir. |
| Provider response | PARTIAL/NOT FOUND. | Attempt içinde sadece `error`; `providerResponse`, provider message id/ref yok. | Orta/Yüksek. |
| Failed delivery | PARTIAL. | SMS için `notification.delivery_failed`, `PROVIDER_NOT_CONFIGURED`; `DELIVERY_FAILED` enum var. | Orta: real failed callback yok. |
| Retry | NOT FOUND. | Service/repository içinde retry function veya worker yok. | Yüksek. |
| Delivered status | PARTIAL. | `SANDBOX_DELIVERED` var; actual delivered yok. | Yüksek. |
| Worker/consumer | NOT FOUND. | `listPendingOutboxEvents` var ama notification delivery worker/consumer yok. | Yüksek. |

## 7. Inbox / User Communication Inventory
| Alan | Mevcut Durum | Kanıt | Risk |
|---|---|---|---|
| user inbox | PARTIAL | `listNotifications` actorType/actorId ile notification listesi döndürüyor. | Orta: explicit inbox domain/model yok. |
| unread/read state | FOUND | `UNREAD`, `READ`, `readAt`, unread count var. | Orta: read mutate ownership guard yok. |
| archive | FOUND | `ARCHIVED`, `archivedAt`, archive function var. | Orta: critical notification archive sadece warning. |
| recipient ownership | PARTIAL | Actor alanları recipient gibi kullanılıyor; BFF query/body'den geliyor. | Yüksek: başka kullanıcı adına listeleme/mutation riski. |
| actor context | PARTIAL | BFF handler `context` alıyor ama notification command/query içinde kullanmıyor. | Yüksek. |
| preference / opt-in / opt-out | PARTIAL/NOT FOUND | `NotificationPreferenceSnapshot` type var; persistence/service enforcement yok. | Yüksek. |
| notification visibility | PARTIAL | List query actorType/actorId filtreli; get/read/archive id-only. | Yüksek. |

## 8. BFF Notification Route Inventory
| Route/Handler | Method | Actor Guard | Body Spoof Riski | Risk |
|---|---|---|---|---|
| `/notification/create` / `handleCreateNotification` | POST | Yok; `context` kullanılmıyor. | Yüksek: body `actorType`/`actorId` ile başka recipient adına notification create edilebilir. | Yüksek. |
| `/notification/list` / `handleListNotifications` | GET | Yok; `context` kullanılmıyor. | Yüksek: query `actorType`/`actorId` ile başka actor inbox listelenebilir. | Yüksek. |
| `/notification/:id` / `handleGetNotification` | GET | Yok; `context` kullanılmıyor. | Yüksek: id biliniyorsa ownership kontrolsüz read. | Yüksek. |
| `/notification/read` / `handleMarkNotificationRead` | POST | Yok; `context` kullanılmıyor. | Yüksek: body `notificationId` ile başka actor notification state mutate edilebilir. | Yüksek. |
| `/notification/archive` / `handleArchiveNotification` | POST | Yok; `context` kullanılmıyor. | Yüksek: body `notificationId` ile başka actor notification archive edilebilir. | Yüksek. |

Kontrol sonuçları:
- Guest notification create yapabiliyor mu? BFF handler seviyesinde auth guard yok; çalıştırılmadığı için runtime sonucu kanıtlanmadı, ancak kaynak kodda deny yok.
- Customer başka kullanıcı adına notification oluşturabiliyor mu? Kaynak kod body actor'a güvendiği için spoof riski var; runtime smoke yapılmadı.
- Admin/operator notification create yapabiliyor mu? Ayrı admin/operator guard yok; kaynak kod tüm body actor'larını kabul ediyor.
- Recipient body’den mi geliyor, context’ten mi? Body/query alanlarından geliyor.
- BFF truth üretiyor mu? BFF record'u kendi üretmiyor; service'e delegate ediyor. Ancak actor/recipient guard eksikliği boundary riskidir.

## 9. Domain Notification Coverage
| Domain | Notification Tetikliyor mu? | Eksik | Risk |
|---|---|---|---|
| Auth | Kanıt bulunmadı. | Account/security notification trigger. | Orta. |
| Customer | Kanıt bulunmadı. | Profile/address critical communication. | Orta. |
| Cart/Checkout | Kanıt bulunmadı. | Checkout reminder/failure/abandonment policy. | Orta. |
| Payment | Hayır. | Payment initiated/succeeded/failed user notification trigger. | Yüksek. |
| Order | Hayır. | Order created/status notification trigger. | Yüksek. |
| Shipment | Kanıt bulunmadı. | Shipment/delivery status notification. | Yüksek. |
| Review/Q&A/UGC/Follow/Post | Kanıt bulunmadı. | Social notification producer. | Orta. |
| Moderation | Hayır. | Moderation decision notification. | Orta. |
| Risk/Fraud | Hayır. | Security/risk notification with guard. | Orta/Yüksek. |
| Support | PARTIAL. | `services/support/src/support.ts` içinde optional notification hook yorumu var; gerçek çağrı yok. | Orta. |
| Media | Kanıt bulunmadı. | Media readiness/failure notification. | Orta. |
| Admin/Panel | Kanıt bulunmadı. | Panel task notification producer and guard. | Yüksek. |

## 10. Audit / Event / Outbox Bağlantısı
| Alan | Audit Var mı? | Outbox Var mı? | Delivery Var mı? | Risk |
|---|---|---|---|---|
| `notification.created` | Evet. | Evet. | Hayır; outbox append sonrası worker yok. | Orta/Yüksek. |
| `notification.delivery.attempted` | PARTIAL: action name `notification.delivery_attempted`. | Evet. | Sandbox/parked attempt var; provider delivery yok. | Yüksek. |
| `notification.delivery.failed` | PARTIAL: SMS path için `notification.delivery_failed`. | Evet. | Real failed provider callback yok. | Orta/Yüksek. |
| `notification.delivery.delivered` | Hayır. | Hayır. | `SANDBOX_DELIVERED` var; canonical delivered event yok. | Yüksek. |
| `notification.read` | Evet. | Evet. | N/A. | Orta: actor guard yok. |
| `notification.archived` | Evet. | Evet. | N/A. | Orta: actor guard yok. |
| outbox event | Evet. | `appendOutboxEvent` kullanılıyor. | Hayır. | Yüksek: consumer/worker yok. |
| idempotency key | PARTIAL. | Notification idempotency var; audit/outbox idempotency key random suffix içeriyor. | N/A. | Orta: deterministic dedupe zayıf. |
| correlationId | PARTIAL. | Notification command/record ve audit/outbox input'a taşınıyor. | N/A. | Orta: BFF request context ile zorunlu değil. |

## 11. Smoke / Test Inventory
| Smoke Suite | Var mı? | Durum | Eksik |
|---|---|---|---|
| notification smoke | PARTIAL | `services/notification/src/smoke-test.ts` var; root suite/script yok. | BFF HTTP deny/allow, actor ownership, Postgres persistence, provider boundary assertions. |
| delivery smoke | NOT FOUND | Root suite yok. | Email/SMS/push sandbox/parked, failed/retry state assertions. |
| inbox smoke | NOT FOUND | Root suite yok. | List/read/archive ownership and unread count smoke. |
| event/outbox smoke | PARTIAL | `packages/persistence/p38-smoke-test.ts` var; root event/outbox suite yok. | Notification outbox append/list/publish/fail worker smoke. |
| analytics smoke | PARTIAL | Service-level analytics smoke var; root `smoke:analytics` yok. | Notification/analytics regression link yok. |
| audit smoke | NOT FOUND | Root suite yok. | Notification audit append/list assertions. |
| smoke runner | FOUND | `tests/smoke/run-smoke.ts` notification/delivery/event/audit kaydetmiyor. | Registry eklenmeli. |
| package script | FOUND | `smoke:notification`, `smoke:delivery`, `smoke:event`, `smoke:audit` yok. | Root script eklenmeli. |

## 12. Cross-System Boundary Riskleri
| Risk | Kanıt | Etki | Önerilen Paket |
|---|---|---|---|
| Notification truth başka domain truth yerine kullanılabilir sanılabilir. | Notification record `notificationTruthMutated:true`, diğer truth flags false; docs notification projection der. | Payment/order/support/moderation sonucu yerine bildirim dili kullanılabilir. | 08B boundary hardening. |
| Delivery status business state yerine kullanılabilir. | `SANDBOX_DELIVERED` ve parked states var; real provider delivery yok. | Kullanıcıya gerçek gönderim veya domain completion gibi sunulabilir. | 08B provider boundary. |
| Provider delivery garantisi varsayılmış olabilir. | `actualProviderDeliveryPerformed:false` tüm attempt'lerde. | Email/push/SMS production garantisi yok. | 08B + provider sandbox/adapter backlog. |
| Body recipient spoof riski var. | BFF `context` kullanmadan body/query actor alanlarını geçiriyor. | Başka kullanıcı inbox create/list/read/archive riski. | 08B BFF guard. |
| Preferences / opt-out yok. | Preference type var; service/repository enforcement yok. | Marketing/social channel consent uygulanmıyor. | 08B preference foundation veya backlog. |
| Outbox var ama delivery worker yok. | `appendOutboxEvent` var; consumer/worker yok. | Event delivery garantisi yok. | 08C outbox retry/delivery worker smoke. |
| Notification smoke root seviyede yok. | `tests/smoke/suites/*notification*` yok; package script yok. | BFF/runtime boundary kanıtı yok. | 08B smoke. |
| BFF guard zayıf. | `/notification/*` handler'ları `requireAuthenticated`, `requireSelfOrAdmin`, `requireAdminOrOperator` kullanmıyor. | Guest/body spoof/ownership bypass riski. | 08B. |
| Domain producers notification tetiklemiyor. | Payment/order/moderation/risk source taramasında `createNotification` yok. | Kullanıcı iletişimi domain outcome sonrası otomatik oluşmuyor. | 08B veya domain-specific notification producer backlog. |
| Notification audit/outbox append failure soft warning. | `AUDIT_EVENT_APPEND_FAILED_AFTER_TRUTH_WRITE` warning'a ekleniyor. | Official audit/outbox garantisi yok; business rollback yapmıyor. | 08A/08C alignment. |

## 13. HARDENING-08B İçin Öneri
HARDENING-08B — Notification Delivery Boundary Hardening için önerilen ayrım:

| Kapsam | Yapılacak | Dışarıda Bırakılacak | Kabul Kanıtı |
|---|---|---|---|
| Notification BFF guard | Create/list/get/read/archive için auth + self/admin veya internal scope guard; recipient context'ten türetilmeli. | Full panel UI. | BFF HTTP smoke: guest deny, self allow, cross-recipient deny, admin/internal allow. |
| Recipient ownership contract | `actorType/actorId` kullanımını netleştir; gerekirse recipient canonical alanı ve ownership semantics ekle. | Tüm domain notification producer'ları. | Typecheck + contract tests/static scan. |
| Delivery boundary | `actualProviderDeliveryPerformed:false` açık korunmalı; sandbox/parked/not configured response dili netleşmeli. | Real email/SMS/push provider integration. | Smoke: email sandbox, push parked, SMS not configured, no actual provider delivery. |
| Inbox state hardening | Read/archive mutation owner guard; unread count ve visibility davranışı. | Rich inbox UI. | Inbox smoke: list/read/archive ownership assertions. |
| Preference/opt-out foundation | Preference contract kullanım kararı; mandatory/critical override ve social/marketing opt-out policy. | Full consent center. | Unit/smoke: mandatory bypass, social preference handling. |
| Audit/outbox assertions | Notification created/read/archive/delivery attempt audit+outbox append kanıtı. | Outbox delivery worker. | Audit/outbox repository smoke. |
| Root notification smoke | `tests/smoke/suites/notification*` ve root script/registry. | 08C event delivery worker smoke. | `smoke:notification` real HTTP PASS; `smoke:all` registry içinde çalışır. |
| 08A ayrımı | Event/audit/analytics canonical foundation 08A'da kalır. | 08B içinde event envelope standardization. | 08A kabul kanıtları. |
| 08C ayrımı | Outbox retry/delivery worker ve event delivery smoke ayrı yapılır. | 08B içinde production broker/worker garantisi. | `smoke:event-outbox` ileride. |
| 08D ayrımı | Analytics/notification/event/audit regression final prep. | Yeni feature. | `smoke:all` + targeted 08 smoke'lar. |

## 14. Komut/Test Durumu
Bu inventory paketinde test/build komutu çalıştırılmadı. Okuma/tarama için `Get-Content`, `Get-ChildItem`, `Select-String`, `rg --files`, `rg -n` kullanıldı; bunlar PASS kanıtı değildir.

| Komut | Çalıştırıldı mı? | Sonuç | Not |
|---|---|---|---|
| `pnpm run typecheck` | Hayır | NOT RUN | Inventory kapsamında çalıştırılmadı. |
| `pnpm run build` | Hayır | NOT RUN | Inventory kapsamında çalıştırılmadı. |
| BFF boot | Hayır | NOT RUN | Runtime doğrulama yapılmadı. |
| `pnpm run smoke:notification` | Hayır | NOT RUN | Script yok. |
| `pnpm run smoke:delivery` | Hayır | NOT RUN | Script yok. |
| `pnpm run smoke:event` | Hayır | NOT RUN | Script yok. |
| `pnpm run smoke:audit` | Hayır | NOT RUN | Script yok. |
| `pnpm run smoke:analytics` | Hayır | NOT RUN | Script yok. |
| `pnpm run smoke:all` | Hayır | NOT RUN | Bu inventory için çalıştırılmadı. |

## 15. Nihai Karar
- HARDENING-08-00B inventory paketidir.
- Kod değişikliği yapılmadı.
- Sistem PASS/FAIL verilmedi.
- Notification / Delivery / User Communication repo gerçekliği çıkarıldı.
- HARDENING-08B için önerilen yön: notification delivery boundary + BFF actor/recipient guard + inbox read/archive ownership + provider sandbox/parked dilinin netleştirilmesi + root notification smoke.
- En kritik P0/P1 riskler:
  - P1: BFF notification create/list/get/read/archive actor/recipient guard'sız; body/query spoof riski var.
  - P1: Provider delivery gerçek değil; tüm attempt'lerde `actualProviderDeliveryPerformed:false`.
  - P1: Delivery worker/retry/consumer yok; outbox append delivery garantisi değildir.
  - P1: Preferences/opt-in/opt-out enforcement yok; sadece type seviyesinde partial snapshot var.
  - P1: Root notification/delivery/inbox/audit/event smoke yok; komut çalıştırılmadıkça PASS yazılamaz.
