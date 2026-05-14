# PHASE-10F-AUDIT — Existing Hardening Coverage Reality Scan (Code-Level)

Kod tabanı üzerinde yapılan taramalara (`grep`/`search_files`) dayanarak sistemin hardening gerçekliği çıkarılmıştır.

## 1. Zaten Yapılmış Yol A Alanları (Production-Grade)

- **Provider Boundary & Callback Security:** `apps/bff/src/server/provider-callback.ts` içinde tam teşekküllü imza doğrulama (`verifyProviderCallbackSignature`), tekrarı önleme/tazelik (`evaluateCallbackFreshness`) ve rate-limit (`evaluateCallbackRateLimit`) kontrolleri uygulanmış durumda.
- **Permission Guards & RBAC:** `apps/bff/src/server/guards.ts` içinde `requireResourceOwnership`, `requireAdmin`, `requireRiskOperator`, `requireInternalService` gibi çok çeşitli ve ince taneli izin kontrolleri aktif çalışıyor.
- **Operational Outbox & Audit Persistence:** `packages/persistence/src/operational-intent.ts` ve `audit-event.ts` dosyalarında In-Memory ve Postgres destekli tam bir Outbox ve Audit log yapısı var. Lease (kiralama), Retry, Dead-Letter mekanizmaları (`markAuditOutboxDeadLetter`) kod tabanında (özellikle postgres repolarında) tam implemente edilmiş.
- **Operational Outbox Worker:** `services/operational-outbox/src/operational-audit-outbox-worker.ts` içinde `claimAuditOutboxLease` kullanarak lease bazlı, retry limitli ve dead-letter akışlı bir worker mantığı inşa edilmiş.
- **Internal Service Auth & Worker Lease:** Servis içi etkileşimler ve worker çağrıları için `services/auth/src/token.ts` ve context/BFF katmanında `validateInternalServiceToken`, `issueInternalServiceToken` HMAC SHA-256 imzası ile çalışıyor. Worker'lar internal tokenlarla güvenli haberleşiyor.
- **Idempotency Persistence:** Hemen hemen tüm servislerde (Payment, Refund, Moderation, Cancel-Return, Analytics) postgres tabanlı `idempotency_key` (örn. `services/finance-correction/src/repository/postgres.ts` veya `services/moderation/src/repository/postgres.ts`) tutulmakta ve duplicate işleme önlenmekte.
- **Payment Reconciliation Worker:** `services/payment/src/callback-worker.ts` ve `payment-reconciliation-task.ts` içerisinde başarılı/başarısız mutabakat kararları, retry count'lar işlenmekte.

## 2. Foundation Seviyesinde Kalmış Alanlar
- **Session/Token Management:** Temel JWT ve session nesnesi (`AuthSession`, `SessionState`) yapıları `packages/contracts/src/auth.ts` ve BFF'te kullanılıyor, ancak session revoke, Redis temelli stateful tam dağıtık session, token refresh/rotation akışları foundation seviyesinde veya eksiği var (sadece basic TTL/HMAC var).
- **Smoke Test Durumu:** Servislerin içerisinde `smoke-test.ts` (örn. Analytics, Payment, Payout) ve `p37-smoke-test.ts` / `p38-smoke-test.ts` gibi persistence seviyesinde testler var, idempotency assert ediliyor ama CI/CD pipeline’ına entegre uçtan uca production e2e suitinden ziyade development/foundation seviyesi script çalıştırıcıları şeklinde duruyor.

## 3. Production İçin Hâlâ Eksik Alanlar
- **Service Registry / Allowlist:** Kodda servislerin birbirini keşfi veya katı bir ağ katmanı/mTLS allowlist'i görünmüyor. Servis adresi tanımlamaları config üzerinden çözülüyor.
- **Migration Durumu:** Veritabanı tabloları "CREATE TABLE IF NOT EXISTS" mantığı ile repository katmanlarında manuel ayağa kaldırılıyor (örn. `_moderation_decision_idempotency` tablosu kod içinden yaratılıyor). Prisma, TypeORM veya Drizzle gibi versiyonlu bir db migration tool zinciri/altyapısı eksik.

## 4. Duplicate/Tekrar Yapılmaması Gereken İşler
- **Idempotency, Outbox/Audit Repository, Internal Service Token, Permission Guard'ları:** Bunlar fazlasıyla sağlam (Yol A kalitesinde) yazılmıştır. Yeni bir provider eklenirse veya internal worker kurulursa mevcut paketler kullanılmalıdır.
- **Worker Lease:** Operational Outbox'da yazılı olan lease state (`claimAuditOutboxLease`, `leaseOwner`, `leaseUntil`) mantığı baştan yazılmamalı, doğrudan çağrılmalıdır.

## 5. Bundan Sonra Yol A mı Yol B mi Daha Doğru?
- Sistem **Yol A (Production-grade Hardening)** doğrultusunda beklediğimizden çok daha ileri seviyede kodlanmıştır (Özellikle Persistence, Audit ve Outbox).
- Dolayısıyla kritik altyapılarda Yol B'ye (MVP/Fake) dönmek anlamsızdır. **Kritik path'lerde (Risk, Finance, Payment) Yol A devam etmelidir.** 
- Sadece operasyonel yük getiren read/view kısımlarında Yol B hızlandırıcısı kullanılabilir.

## 6. Önerilen Sonraki Paket
Kod tabanı halihazırda birçok backend güvenlik ve dayanıklılık altyapısına sahip. En büyük eksiklikler operasyonel/deploy seviyesinde:
- **Öncelik 1: Migration Altyapısının Kurulması (DB Schema Versioning)** - CREATE TABLE sorgularını repository'den çıkarıp gerçek bir migration aracına geçirmek.
- **Öncelik 2: Testlerin Konsolidasyonu** - Tüm `smoke-test.ts`'leri merkezi bir E2E test koşucu otomasyonuna almak.
- **Öncelik 3: Service Registry / Service Mesh Entegrasyonu.**
