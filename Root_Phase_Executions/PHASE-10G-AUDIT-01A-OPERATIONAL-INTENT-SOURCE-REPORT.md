# PHASE-10G-AUDIT-01A-OPERATIONAL-INTENT-SOURCE-REPORT.md

## 1. Dosya Durumu
- FOUND
- Dosyanın kısa amacı: Operational intent (operasyonel niyet/talep) ve audit outbox (denetim izi ve mesaj kuyruğu) kayıtlarını veritabanına veya in-memory'ye kaydetmek, listelemek ve worker'ların bu kayıtları lease (kiralama) mekanizması ile işleyebilmesi için gerekli repository altyapısını sağlamak.

## 2. Tanımlı Ana Type / Interface / Class Listesi
- **Type**: `OperationalIntentDomain`, `OperationalWorkflowState`, `AuditIntentDeliveryState`, `OperationalIntentJsonRecord`
- **Interface**: `OperationalIntentRecord`, `AuditIntentOutboxRecord`, `RecordOperationalIntentInput`, `OperationalIntentRecordResult`, `OperationalIntentRepository`
- **Class**: `InMemoryOperationalIntentRepository`, `PostgresOperationalIntentRepository`

## 3. Operational Intent Modeli Ne Tutuyor?
- intent id: `intentId: string`
- domain: `domain: OperationalIntentDomain`
- target/entity: `targetId: string`
- command/action bilgisi: `actionType: string`
- maker actor: `makerActorId: string`
- checker actor: `checkerActorId?: string | null`
- workflow state: `workflowState: OperationalWorkflowState`
- evidence refs: `evidenceRefs: string[]`
- audit ilişkisi: `makerCheckerContext: OperationalIntentJsonRecord` (Outbox'a kaydedilirken kullanılıyor)
- outbox ilişkisi: Kayıt sırasında `AuditIntentOutboxRecord` otomatik olarak oluşturuluyor.
- boundary flags: `boundaryFlags: OperationalIntentJsonRecord`
- idempotency / fingerprint: `idempotencyKey: string` var (ayrıca iç kısımlarda `fingerprint(input)` hesaplanıp çakışma durumunda `OPERATIONAL_INTENT_IDEMPOTENCY_CONFLICT` fırlatılıyor)
- correlation id: Açıkça `correlationId` adında alan yok ancak `intentId` ve `targetId` üzerinden korelasyon yapılıyor.
- retry / delivery / lease bilgisi: Outbox kaydında `deliveryState`, `retryCount`, `nextRetryAt`, `leaseOwner`, `leaseUntil`, `lastError` tutuluyor.

## 4. Lifecycle / State Model
`OperationalWorkflowState` (Intent):
- `prepared`
- `checker_required`
- `checked`
- `rejected`
- `escalated`
- `owner_handoff_pending`
- `owner_handoff_ready`

`AuditIntentDeliveryState` (Outbox):
- `pending`
- `processing`
- `delivered`
- `failed`
- `dead_letter`

## 5. Repository Metotları
- `recordIntentWithAuditOutbox(input)`: Hem intent hem outbox kaydını atomik/idempotent kaydeder (Mutation). Idempotency var.
- `listIntents(input)`: Intent'leri filtreleyerek listeler (Read).
- `getIntentById(intentId)`: Intent getirir (Read).
- `getIntentByIdempotencyKey(idempotencyKey)`: Intent getirir (Read).
- `getAuditOutboxByIdempotencyKey(idempotencyKey)`: Outbox getirir (Read).
- `getAuditOutboxByIntentId(intentId)`: Outbox getirir (Read).
- `getLatestIntentByTarget(domain, targetId)`: En güncel Intent kaydını getirir (Read).
- `getLatestAuditOutboxByTarget(domain, targetId)`: En güncel Outbox kaydını getirir (Read).
- `listDeliverableAuditOutbox(input)`: İşlenmeye uygun pending/failed outbox kayıtlarını listeler (Read). Guard: now ve lease check.
- `claimAuditOutboxLease(outboxId, input)`: Worker'ın outbox kaydını belirli bir süre kilitlemesini sağlar (Mutation). Guard: State, nextRetryAt ve leaseUntil kontrolleri.
- `releaseAuditOutboxLease(outboxId, leaseOwner)`: Lease kilidini kaldırır (Mutation). Guard: Sadece sahibi (leaseOwner) serbest bırakabilir.
- `markAuditOutboxProcessing(outboxId, attemptedAt)`: Durumu processing yapar (Mutation).
- `markAuditOutboxDelivered(outboxId, deliveredAt)`: Durumu delivered yapar, kilitleri temizler (Mutation).
- `markAuditOutboxFailed(outboxId, input)`: Durumu failed yapar, retry ve error bilgilerini kaydeder (Mutation).
- `markAuditOutboxDeadLetter(outboxId, input)`: Durumu dead_letter yapar (Mutation).

## 6. InMemory / Postgres Ayrımı
- InMemory implementation var mı?: Evet, `InMemoryOperationalIntentRepository`
- Postgres implementation var mı?: Evet, `PostgresOperationalIntentRepository`
- factory var mı?: Evet, `getOperationalIntentRepository()` fonksiyonu kullanılıyor.
- PERSISTENCE_MODE kullanıyor mu?: Evet (`process.env.PERSISTENCE_MODE === 'postgres'`)
- hangi tabloları kullanıyor?: `operational_intents`, `operational_audit_intent_outbox`

## 7. Audit / Outbox Davranışı
- intent kaydedilince audit de yazılıyor mu?: Evet, aynı anda birlikte yazılıyor (`recordIntentWithAuditOutbox`).
- outbox da yazılıyor mu?: Evet, Audit Intent aynı zamanda outbox olarak değerlendiriliyor.
- outbox topic/type nedir?: Özel bir topic adı yok ancak `domain` ve `actionType` bazlı yönlendirme yapılabilir.
- retry var mı?: Evet, `retryCount` ve `nextRetryAt` kullanılıyor.
- delivered/failed state var mı?: Evet, `deliveryState` alanı üzerinden tutuluyor.
- lease/claim var mı?: Evet, claim ve release metotları mevcut.
- idempotency var mı?: Evet, `idempotencyKey` ile hem replay korunuyor hem de input_fingerprint ile conflict anında hata dönülüyor.

## 8. Maker-Checker Gerçekliği
- maker/checker alanları var mı?: Evet, `makerActorId` ve `checkerActorId` var.
- same actor engeli var mı?: Bu dosyada (repository) guard YOK. Yalnızca alanlar tanımlı.
- approval/rejection metodu var mı?: Repository'de doğrudan approve/reject isimli domain metodu yok. Workflow state güncellemeleri üzerinden tutuluyor.
- sadece veri modeli mi, yoksa execution flow var mı?: Sadece repository foundation ve veri modeli var, domain logic (execute) bulunmuyor.

## 9. Worker / Lease / Retry Gerçekliği
- claim lease metodu var mı?: Evet, `claimAuditOutboxLease`
- lease süresi var mı?: Evet, `leaseUntil`
- worker id var mı?: Evet, `leaseOwner`
- retry count var mı?: Evet, `retryCount`
- next retry time var mı?: Evet, `nextRetryAt`
- dead-letter veya permanent failure var mı?: Evet, `dead_letter` state'i var.
- delivery mark metotları var mı?: Evet, `markAuditOutboxDelivered`, `markAuditOutboxFailed`, vb.

## 10. Sınırlar
- Bu dosya business owner mutation yapıyor mu?: Hayır.
- Payment/order/settlement/payout state değiştiriyor mu?: Hayır. Sadece operational audit ve outbox kaydı tutuyor.
- Sadece operational workflow/audit/outbox repository mi?: Evet.
- Domain command execution var mı, yok mu?: Yok. Event fırlatma veya service call yapma yeteneği yok, sadece veritabanı okuma/yazma yapıyor.

## 11. Capability Level
**WORKFLOW_REPOSITORY_FOUNDATION**

Kanıt: Dosya in-memory ve postgres veri modellerini eksiksiz, lock, lease, outbox, idempotency mekanizmaları ile tanımlıyor. Ancak bir worker döngüsünü (polling) veya domain execution mantığını içermiyor. Sadece foundation (altyapı/repository).

## 12. Phase-10G İçin Anlamı
- Finance/payout/settlement ops için reusable mı?: Evet ancak `OperationalIntentDomain` type'ına `finance`, `payout` vb. yeni domainler eklenmeli.
- Direkt kullanılabilir mi, yoksa service wrapper mı gerekir?: Mutlaka bir service wrapper ve outbox kayıtlarını okuyup target domain'e iletecek bir worker gereklidir.
- Ops center doğrudan bu repository’ye mi bağlanmalı, yoksa projection service mi olmalı?: Tercihen bir projection/service API katmanı üzerinden verileri okumalıdır. UI doğrudan persistence katmanına erişmemelidir.
- Bu sistemi tekrar yazmak gerekir mi?: Hayır. Altyapı olarak çok sağlam bir foundation sunuyor, type tanımları genişletilerek güvenle kullanılabilir.