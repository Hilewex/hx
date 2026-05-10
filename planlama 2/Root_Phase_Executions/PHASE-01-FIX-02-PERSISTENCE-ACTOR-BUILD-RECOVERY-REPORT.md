# PHASE-01-FIX-02 — Persistence Boundary + Actor Context + Build Recovery Report

## 1. Amaç

Bu fix paketinin amacı, PHASE-01-FIX-01 sonrasında açık kalan BFF direct persistence access, actor spoof riski ve typecheck/build FAIL durumunu kapatmaktır.

## 2. Başlangıç Durumu

PHASE-01-FIX-01 kararı:
- PARTIAL

Açık kalan problemler:
- BFF direct persistence repository access
- Actor spoof / x-actor-id genel taraması eksik veya FAIL
- pnpm run typecheck FAIL
- pnpm run build FAIL

## 3. Değiştirilen Dosyalar

| Dosya | Değişiklik | Gerekçe | Boundary Etkisi |
|---|---|---|---|
| `services/provider-callback/package.json` | Yeni `@hx/provider-callback` service/application package eklendi. | Provider callback raw event persistence işini BFF dışındaki owner-safe boundary'ye taşımak. | PASS |
| `services/provider-callback/tsconfig.json` | Yeni service package için TypeScript build/typecheck yapılandırması eklendi. | Workspace build/typecheck zincirine service boundary'yi dahil etmek. | PASS |
| `services/provider-callback/src/index.ts` | Provider callback identity lookup ve raw event record fonksiyonları eklendi. | Repository erişimini service boundary içine almak. | PASS |
| `apps/bff/package.json` | `@hx/provider-callback` dependency eklendi. | BFF'in persistence yerine public service boundary'ye bağlanması. | PASS |
| `apps/bff/src/server/provider-callback.ts` | `@hx/persistence` import'u ve direct repository kullanımı kaldırıldı; `@hx/provider-callback` delegation eklendi. | BFF direct repository access ihlalini kapatmak. | PASS |
| `apps/bff/src/server/store-post.ts` | Creator guard `x-actor-type` yerine `req.context.role` kullanacak şekilde düzeltildi. | Client-supplied actor role spoof riskini kapatmak. | PASS |
| `apps/bff/src/server/store-story.ts` | Actor extraction `x-actor-id/x-actor-type` yerine `req.context` kullanacak şekilde düzeltildi. | Store story production path actor spoof riskini kapatmak. | PASS |
| `apps/bff/src/server/pool.ts` | Actor extraction `x-actor-id/x-actor-type` yerine `req.context` kullanacak şekilde düzeltildi. | Pool production path actor spoof riskini kapatmak. | PASS |
| `apps/bff/src/server/customer-address.ts` | Customer address actor resolution `req.context` üzerinden merkezi helper'a alındı. | Address write/read actor spoof riskini kapatmak. | PASS |
| `apps/bff/src/server/customer-contribution.ts` | Contribution eligibility actor kaynağı `req.context` yapıldı. | Header actor spoof riskini kapatmak. | PASS |
| `apps/bff/src/server/customer-reward.ts` | Reward eligibility actor kaynağı `req.context` yapıldı. | Header actor spoof riskini kapatmak. | PASS |
| `apps/bff/src/server/customer-support.ts` | Support eligibility actor kaynağı `req.context` yapıldı. | Header actor spoof riskini kapatmak. | PASS |
| `apps/bff/src/server/customer-social.ts` | Social eligibility actor kaynağı `req.context` yapıldı; service context güvenli actor ile override edildi. | Header/body actor spoof riskini kapatmak. | PASS |
| `apps/bff/src/server/support.ts` | Ticket create/list/transition/message actor kaynağı body/query yerine resolved BFF context yapıldı. | Support actor spoof riskini kapatmak. | PASS |
| `apps/bff/src/server/interaction.ts` | Interaction mutation/query actor kaynağı body/query yerine BFF context yapıldı. | Interaction actor spoof riskini kapatmak. | PASS |
| `apps/bff/src/server/story.ts` | Story query actor fallback'i query yerine BFF context yapıldı. | Query actor spoof riskini kapatmak. | PASS |
| `apps/bff/src/server/order-ops.ts` | Support actor context query yerine BFF context yapıldı. | Order ops support-scope spoof riskini kapatmak. | PASS |
| `apps/bff/src/server/index.ts` | Kullanılmayan `x-actor-type` değişkeni kaldırıldı; legacy `x-actor-id` sadece `resolveContext` smoke fallback parametresi olarak kaldı. | Production route logic'te actor header kullanımını azaltmak. | PASS WITH LIMITATION |
| `apps/panel/src/bootstrap/customer-support-smoke.ts` | Panel içinden BFF `src` import eden smoke dosyası silindi. | Panel typecheck'in BFF source dosyalarını derlemesini ve boundary ihlalini kapatmak. | PASS |
| `apps/panel/package.json` | Geçici `@hx/persistence` devDependency kaldırıldı. | Panel'e gereksiz persistence bağımlılığı ekleyerek build sorununu gizlememek. | PASS |

## 4. Provider Callback Persistence Boundary

### Önceki durum
`apps/bff/src/server/provider-callback.ts`, `@hx/persistence` üzerinden `getProviderCallbackEventRepository` çağırıyor, duplicate lookup ve `insertProviderCallbackEvent` işlemini doğrudan BFF içinde yapıyordu.

### Yapılan düzeltme
`@hx/provider-callback` service/application boundary oluşturuldu. BFF artık `findExistingProviderCallbackByIdentity` ve `recordProviderCallbackEvent` fonksiyonlarına delegate ediyor.

### Yeni boundary
BFF route parsing, guard input hazırlığı, provider callback policy ve response üretimi yapıyor. Raw callback event lookup/record persistence işi `services/provider-callback/src/index.ts` içine taşındı.

### BFF direct repository access kaldı mı?
- Hayır

### Callback security davranışı korundu mu?
- Evet

### Business truth mutation var mı?
- Hayır

### Kanıt
`apps/bff/src/server/provider-callback.ts` içinde `@hx/persistence`, `getProviderCallbackEventRepository`, `repository.insertProviderCallbackEvent` kalmadı. `services/provider-callback/src/index.ts` repository erişimini service boundary içinde kapsıyor. Callback record hâlâ `createProviderBoundaryFlags()` ile oluşturuluyor; provider callback foundation smoke boundary flag'lerini `false` olarak doğruladı.

## 5. Actor Context / x-actor-id Audit

### 5.1 Production Path Bulguları

| Dosya | Bulgu | Eski Durum | Yeni Durum | Karar |
|---|---|---|---|---|
| `apps/bff/src/server/store-post.ts` | `x-actor-type` guard | Creator guard client header'a güveniyordu. | `req.context.role` kullanıyor. | PASS |
| `apps/bff/src/server/store-story.ts` | `x-actor-id/x-actor-type` extraction | Actor client header'dan alınıyordu. | `req.context.actorId/role` kullanıyor. | PASS |
| `apps/bff/src/server/pool.ts` | `x-actor-id/x-actor-type` extraction | Actor client header'dan alınıyordu. | `req.context.actorId/role` kullanıyor. | PASS |
| `apps/bff/src/server/customer-address.ts` | Header actor | Address operations header actor'a güveniyordu. | Actor `req.context` üzerinden çözülüyor. | PASS |
| `apps/bff/src/server/customer-contribution.ts` | Header actor | Eligibility actor header'dan geliyordu. | Actor `req.context` üzerinden çözülüyor. | PASS |
| `apps/bff/src/server/customer-reward.ts` | Header actor | Eligibility actor header'dan geliyordu. | Actor `req.context` üzerinden çözülüyor. | PASS |
| `apps/bff/src/server/customer-support.ts` | Header actor | Eligibility actor header'dan geliyordu. | Actor `req.context` üzerinden çözülüyor. | PASS |
| `apps/bff/src/server/customer-social.ts` | Header actor | Eligibility actor header'dan geliyordu. | Actor `req.context` ile override ediliyor. | PASS |
| `apps/bff/src/server/support.ts` | Body/query actor | Ticket actor body/query alanlarından geliyordu. | Actor BFF context'ten geliyor. | PASS |
| `apps/bff/src/server/interaction.ts` | Body/query actor fallback | `body.actorId` ve `query.actorId` authenticated actor yerine geçebiliyordu. | Actor sadece `context.actorId`. | PASS |
| `apps/bff/src/server/story.ts` | Query actor fallback | `query.actorId` viewer/tray actor yerine geçebiliyordu. | Actor sadece `context.actorId`. | PASS |
| `apps/bff/src/server/order-ops.ts` | Query actor | Support context query actor ile filtreleniyordu. | Support context BFF actor context'ten geliyor. | PASS |
| `apps/bff/src/server/index.ts` | Legacy `x-actor-id` read | Header `resolveContext` fallback input'u olarak okunuyor. | Sadece `ALLOW_LEGACY_ACTOR_HEADER_FOR_SMOKE=true` olduğunda context resolver kabul ediyor. | PASS WITH LIMITATION |

### 5.2 Test / Smoke Only Bulguları

| Dosya | Bulgu | Neden Güvenli / Neden Riskli | Karar |
|---|---|---|---|
| `apps/panel/src/bootstrap/customer.ts` | `x-actor-id/x-actor-type` smoke headers | Bootstrap smoke dosyası; production route logic değil. Ancak legacy header kullanımını canlı BFF'e karşı test ediyor. | TEST/SMOKE ONLY |
| `apps/bff/src/server/context.ts` | Legacy actor fallback | Sadece `ALLOW_LEGACY_ACTOR_HEADER_FOR_SMOKE=true` env ile çalışıyor; prod default false. | SAFE CONTEXT USAGE WITH LIMITATION |

### 5.3 Actor Spoof Sonucu

```text
Production path’te unsafe client-supplied actor kaldı mı?
- Hayır

Actor context auth/session/req.context üzerinden mi geliyor?
- Evet

Kalan limitation:
- apps/bff/src/server/index.ts içinde x-actor-id header resolveContext'e parametre olarak veriliyor; prod davranışta sadece ALLOW_LEGACY_ACTOR_HEADER_FOR_SMOKE=true ise kabul ediliyor.
- apps/panel/src/bootstrap/customer.ts smoke dosyası legacy actor header kullanıyor; production path değildir.
```

## 6. Build / Typecheck Recovery

### Önceki durum
`apps/panel/src/bootstrap/customer-support-smoke.ts`, panel içinden `../../../bff/src/server` ve `../../../bff/src/config` import ediyordu. Bu yüzden `apps/panel` typecheck, BFF source dosyalarını da derlemeye çalışıyor ve `@hx/persistence` çözümleme hatası üretiyordu.

### Yapılan düzeltme
Panel smoke dosyası silindi. Panel'e geçici eklenen `@hx/persistence` devDependency kaldırıldı. Yeni `@hx/provider-callback` package workspace'e eklendi ve BFF public package boundary üzerinden bu service'e bağlandı.

### Sonuç
```text
pnpm run typecheck
- PASS

pnpm run build
- PASS
```

## 7. Boundary Regression Scan

### 7.1 BFF internal service src import
```text
Komut: rg "../../../../services|services/.*/src|@hx/.*/src" apps/bff/src
Sonuç: PASS
Not: Sadece p49 smoke yorum satırında source-review metni bulundu.
```

### 7.2 BFF direct persistence repository access
```text
Komut: rg "@hx/persistence|get\\w*Repository|insertProviderCallbackEvent|findProviderCallbackEvent|recordProviderCallbackEvent" apps/bff/src services/provider-callback/src
Sonuç: PASS
Kanıt: BFF içinde yalnız @hx/provider-callback service fonksiyonu çağrısı var. Repository erişimi services/provider-callback/src/index.ts içinde.
```

### 7.3 Panel direct service write
```text
Komut: rg "@hx/service-|create\\w+\\(|publish\\w+\\(|update\\w+\\(|delete\\w+\\(|mutate\\w+\\(" apps/panel/src
Sonuç: PASS
Kanıt: Panel production source içinde direct service write bulgusu yok.
```

### 7.4 Actor spoof
```text
Komut: rg "x-actor-id|x-actor-type" apps/bff/src apps/web apps/panel services tests
Sonuç: PASS WITH LIMITATION
Kanıt: BFF production path'te sadece index.ts legacy smoke fallback parametresi kaldı. Panel bootstrap customer.ts test/smoke only.
```

### 7.5 Event/audit/outbox
```text
Komut: rg "businessTruthMutated:\\s*true|ownerStateMutated:\\s*true|businessTruthMutated|ownerStateMutated|outbox" apps/bff/src services packages tests
Sonuç: PASS
Kanıt: BFF provider callback path businessTruthMutated=false ve ownerStateMutated=false flag'lerini koruyor. True flag üretimi production provider callback path'te bulunmadı.
```

## 8. Komut Sonuçları

| Komut | Sonuç | Not |
|---|---|---|
| `pnpm install` | PASS | Yeni `@hx/provider-callback` workspace package linklendi. |
| `pnpm run typecheck` | PASS | Son çalıştırmada tüm recursive workspace typecheck geçti. |
| `pnpm run build` | PASS | Son çalıştırmada tüm recursive workspace build geçti. |
| `pnpm run smoke:provider-callback-foundation` | PASS | Provider callback record persistence ve boundary flag foundation geçti. |
| `pnpm run smoke:auth-permission` | PASS | 8 permission check geçti. |
| `pnpm run smoke:provider-callback-ingestion` | BLOCKED | Suite `PERSISTENCE_MODE=postgres` ve `DATABASE_URL` zorunlu tutuyor; local Postgres `localhost:5433` bağlantısı yok. BFF memory mode'da endpoint 202 döndürdü, fakat suite repository doğrulama adımında Postgres istedi. |
| `pnpm run smoke:provider-callback-replay-guard` | BLOCKED | Aynı Postgres zorunluluğu nedeniyle tamamlanamadı. |
| `pnpm run smoke:provider-callback-signature-guard` | BLOCKED | Aynı Postgres zorunluluğu nedeniyle tamamlanamadı. |

## 9. Kalan Açık Noktalar

- Provider callback ingestion/replay/signature smoke suite'leri Postgres gerektiriyor. Bu ortamda `DATABASE_URL` erişilebilir olmadığı için bu smoke'lar tam doğrulanamadı.
- `apps/bff/src/server/index.ts` legacy actor fallback parametresi prod default'ta kapalıdır, ancak kodda smoke uyumluluğu için `x-actor-id` okunmaya devam eder.
- `apps/panel/src/bootstrap/customer.ts` test/smoke dosyasında legacy actor headers kalmıştır; production path değildir.

## 10. Final Karar

- BFF direct persistence repository access: PASS
- Actor spoof production path remediation: PASS WITH LIMITATION
- Typecheck recovery: PASS
- Build recovery: PASS
- Targeted smoke: PASS WITH POSTGRES-LIMITED CALLBACK SMOKE
