# HARDENING-05-00 — Auth / Session / Permission Repo Inventory

## 1. Kısa Özet
- Bu paket **inventory paketidir**.
- **Kod değişikliği yapılmadı.**
- **Implementation yapılmadı.**
- **PASS/FAIL sistem kapanışı verilmedi.**
- Amaç HARDENING-05A öncesi repo gerçekliğini çıkarmaktır.

**En kritik ilk 5 bulgu:**
1. **Mock/Foundation Auth:** `services/auth` klasörü boştur (sadece `index.ts` isim export eder). Token parse, validate işlemleri gerçekte yapılmamakta, `apps/bff/src/server/context.ts` içinde `Bearer admin-token` gibi hardcoded simülasyonlar bulunmaktadır.
2. **x-actor-id ile Fake Actor Üretimi:** BFF içindeki tüm mutation router'ları (müşteri, post, sepet vb.) auth header doğrulamak yerine `x-actor-id` header'ına güvenerek işlem yapmaktadır. Bu tam anlamıyla fake actor simülasyonudur.
3. **Domain Seviyesi Guard Yokluğu:** Servis repository'leri (`services/post/src/post.ts`, `services/commerce/src/repository/postgres.ts` vb.) mutation yaparken `creatorId` veya `actorId`'nin gerçek owner ile eşleşip eşleşmediğini doğrulamamakta (erişim denetimi değil, duplicate guard gibi domain rules uygulanmaktadır).
4. **BFF Shell Seviyesi Permission:** Yetki kontrolü (Role/Scope) yalnızca BFF'de (`apps/bff/src/server/access.ts`) çok temel bir `requiredRoles.includes(context.role)` kontrolünden ibarettir, mutation boundary koruması yoktur.
5. **Panel Direct-Write Riski Yok:** Panel tarafı (`apps/panel/src/bootstrap/auth.ts`) direkt veri tabanına veya servislere değil, beklendiği gibi BFF'e istek yapmaktadır; direct-write riski bulunmamıştır. Ancak auth state'i `UNAUTHORIZED` fallback'i olan basit bir taslaktır.

## 2. Referans Dosya Kontrolü

| Referans Dosya | Durum | Not |
|---|---|---|
| planlama/HARDENING_PROGRESS_RECORD.md | FOUND | Mevcut ve aktif, open tab olarak incelendi. |
| HARDENING-00-REVIEW-REPORT.md | FOUND | Repo kök dizininde bulundu. |
| HARDENING-01-CLOSURE-REPORT.md | FOUND | Repo kök dizininde bulundu. |
| HARDENING-01B-CLOSURE-REPORT.md | FOUND | Repo kök dizininde bulundu. |
| HARDENING-02-CLOSURE-REPORT.md | FOUND | Repo kök dizininde bulundu. |
| HARDENING-02R-CLOSURE-REPORT.md | FOUND | Repo kök dizininde bulundu. |
| HARDENING-02B-CLOSURE-REPORT.md | FOUND | Repo kök dizininde bulundu. |
| HARDENING-02V-CLOSURE-REPORT.md | FOUND | Repo kök dizininde bulundu. |
| HARDENING-03-CLOSURE-REPORT.md | FOUND | Repo kök dizininde bulundu. |
| HARDENING-03B-CLOSURE-REPORT.md | FOUND | Repo kök dizininde bulundu. |
| HARDENING-04R-CLOSURE-REPORT.md | FOUND | Repo kök dizininde bulundu. |
| HARDENING-04B-CLOSURE-REPORT.md | FOUND | Repo kök dizininde bulundu. |
| planlama/60-KODLAMAYA HAZIRLIK YOL HARİTASI.md | FOUND | planlama klasöründe bulundu. |
| planlama/61-FULL_CAPACITY_CODING_ROADMAP.md | FOUND | planlama klasöründe bulundu. |
| planlama/62-MASTER_IMPLEMENTATION_PLAN.md | FOUND | planlama klasöründe bulundu. |
| planlama/63-IMPLEMENTATION_PROGRESS_MASTER.md | FOUND | planlama klasöründe bulundu. |
| planlama/64-PACKAGE_EXECUTION_LOG.md | FOUND | planlama klasöründe bulundu. |
| planlama/65-ACTIVE_RISKS_AND_DECISIONS.md | FOUND | planlama klasöründe bulundu. |
| planlama/63A-IMPLEMENTATION_PROGRESS_ARCHIVE_P01_P41.md | NOT FOUND | Arşiv dosyası olarak mevcut değil. |
| planlama/64A-PACKAGE_EXECUTION_ARCHIVE_P01_P41.md | NOT FOUND | Arşiv dosyası olarak mevcut değil. |
| planlama/65A-RISKS_AND_DECISIONS_ARCHIVE_P01_P41.md | NOT FOUND | Arşiv dosyası olarak mevcut değil. |
| planlama/SYSTEM_CLOSURES/S01-HAVUZ_KAYIT_DOSYASI.md | NOT FOUND | System closures klasörü dizinde görünmüyor. |
| planlama/SYSTEM_CLOSURES/S02-FENOMEN_MAGAZA_KAYIT_DOSYASI.md | NOT FOUND | Mevcut değil. |
| planlama/SYSTEM_CLOSURES/S03-KULLANICI_MUSTERI_KAYIT_DOSYASI.md | NOT FOUND | Mevcut değil. |
| planlama/SYSTEM_CLOSURES/S04-PDP_KAYIT_DOSYASI.md | NOT FOUND | Mevcut değil. |
| planlama/SYSTEM_CLOSURES/S05-STORY_KAYIT_DOSYASI.md | NOT FOUND | Mevcut değil. |
| planlama/SYSTEM_CLOSURES/S06-VIDEO_KAYIT_DOSYASI.md | NOT FOUND | Mevcut değil. |
| planlama/2-fenoemen mağaza sistemi.md | FOUND | İncelendi. |
| planlama/3- kullanıcı-müşteri sistemi.md | FOUND | İncelendi. |
| planlama/13-sepet sistemi .md | FOUND | İncelendi. |
| planlama/21-post sistemi .md | FOUND | İncelendi (dosya adı: `21-post sistemi .md`). |
| planlama/23-üyelik giriş sistemi.md | FOUND | İncelendi. |
| planlama/25-kural -yetki sistemi.md | FOUND | İncelendi. |
| planlama/31-yorum ve puanlama sistemi.md | FOUND | İncelendi. |
| planlama/32-soru cevap sistemi.md | FOUND | İncelendi. |
| planlama/34-kullanıcı story sistemi.md | FOUND | İncelendi. |
| planlama/40-admin sistemi.md | FOUND | İncelendi. |
| planlama/41- fenomen yönetim sistemi.md | FOUND | İncelendi. |
| planlama/42-fenomen mağaza yönetim panel sistemi.md | FOUND | İncelendi. |
| planlama/49-fraud risk abuse sistemi.md | FOUND | İncelendi. |
| planlama/50-medya sistemş asset  sitemi.md | FOUND | İncelendi. |

## 3. İncelenen Repo Dosyaları

| Alan | Dosya/Yol | Durum | İnceleme Notu |
|---|---|---|---|
| Contracts | packages/contracts/src/auth.ts | FOUND | Temel Actor, Role type'ları var. Gerçek claim modeli eksik. |
| Contracts | packages/contracts/src/customer.ts | FOUND | Customer action contractları var. |
| Contracts | packages/contracts/src/permission.ts | NOT FOUND | `packages/contracts/src/access.ts` var, authorization decision türlerini içeriyor. |
| Services | services/auth/src/* | FOUND | Sadece `export const name = "auth";` var, implementation boş. |
| Services | services/customer/src/* | FOUND | Customer profili servisi in-memory map kullanıyor. |
| Services | services/post/src/post.ts | FOUND | Post servis mutation'ları herhangi bir owner/actor kontrolü yapmıyor. |
| Services | services/commerce/src/* | FOUND | Sepet (cart) context üzerinden actorType/Id ile çalışıyor, güvenli session resolve yok. |
| BFF | apps/bff/src/server/context.ts | FOUND | Session ve Actor context headerdan hardcode olarak dönüyor. |
| BFF | apps/bff/src/server/access.ts | FOUND | Yalnızca mock `requiredRoles.includes` check yapıyor. |
| BFF | apps/bff/src/server/*.ts (Routers) | FOUND | Tümü header üzerinden `x-actor-id` bekliyor. |
| Panel | apps/panel/src/bootstrap/auth.ts | FOUND | Sadece `status: 'UNAUTHORIZED'` yapısı var. Auth logic yok. |
| Web | apps/web/src/bootstrap/auth.ts | FOUND | Temel auth taslağı. |

## 4. Auth / Session Inventory

| Bileşen | Dosya | Gerçek Durum | Kanıt | Risk |
|---|---|---|---|---|
| Auth Contract | packages/contracts/src/auth.ts | Var, ancak zayıf. | `export type ActorContext = GuestActor \| AuthenticatedActor;` | MEDIUM |
| Auth Service | services/auth/src/index.ts | Yok (Boş). | `export const name = "auth";` | CRITICAL |
| Token Validation | apps/bff/src/server/context.ts | MOCK. Gerçek değil. | `if (authHeader === 'Bearer admin-token') { ... }` | CRITICAL |
| Provider Entegrasyonu | Yok | Yok. | Herhangi bir provider çağrısı bulunamadı. | HIGH |
| Session State Model | apps/bff/src/server/context.ts | MOCK. | Hardcoded state dönülüyor. | CRITICAL |
| Login/Register Flow | Yok | Yok. | API uçları tanımlanmamış. | HIGH |

## 5. Actor Context Inventory

| Dosya | Actor Kaynağı | Actor Tipleri | Gerçek Session mı? | Not |
|---|---|---|---|---|
| apps/bff/src/server/context.ts | Mock Header | ADMIN, CUSTOMER, GUEST | Hayır (Mock) | Sadece iki token simüle edilmiş. |
| apps/bff/src/server/customer.ts | `x-actor-id` Header | - | Hayır (Simulation) | İstemciden gelen id kabul ediliyor. |
| apps/bff/src/server/post.ts | `x-actor-id` Header | CREATOR | Hayır (Simulation) | Herkes başka creator adına post atabilir. |
| services/commerce/src/repository/postgres.ts | `context.actorId` (Param) | GUEST, CUSTOMER | Hayır | BFF'den gelen actorId sorguya parametre oluyor. |

## 6. Permission / Guard Inventory

| Dosya | Guard / Permission Kullanımı | Seviye | Yeterlilik | Risk |
|---|---|---|---|---|
| packages/contracts/src/access.ts | AuthorizationDecision Tipleri | CONTRACT | FOUNDATION | LOW |
| apps/bff/src/server/access.ts | Role check (Includes) | BFF | MOCK | CRITICAL |
| services/post/src/post.ts | Guard Yok | SERVICE | MISSING | CRITICAL |
| services/commerce/src/repository/postgres.ts | Guard Yok | DOMAIN | MISSING | HIGH |

## 7. BFF Protected Route Inventory

| Route / Handler | Domain | Mutation mı? | Actor Gerekir mi? | Mevcut Koruma | Risk | Not |
|---|---|---:|---:|---|---|---|
| `handleCreateStorePost` | Post | Evet | Evet | `x-actor-id` header alıyor | CRITICAL | Doğrulama yok, owner spoof yapılabilir. |
| `handleAddToCart` | Commerce | Evet | Evet | `x-actor-id` header alıyor | CRITICAL | Başka sepetlere ekleme/silme yapılabilir. |
| `handleCreateReview` | Review | Evet | Evet | `x-actor-id` header alıyor | CRITICAL | Fake review oluşturulabilir. |
| `handleFollowCreator` | Follow | Evet | Evet | `x-actor-id` header alıyor | CRITICAL | Başkası adına takip işlemi yapılabilir. |
| `handleIntakeMediaUpload` | Media | Evet | Evet | `x-actor-id` header alıyor | CRITICAL | İzin kontrolü yok. |
| Payout/Settlement Mutations | Finance | Evet | Evet | `x-actor-id` header alıyor | CRITICAL | Güvenli auth context yok. |

## 8. Panel Direct-Write Riskleri

| Dosya | Kullanım | Direct Write Riski | Gerekli Düzeltme |
|---|---|---|---|
| apps/panel/src/index.ts | Sadece BFF'e istek atıyor. | YOK | Mevcut hali korunmalı. |
| apps/panel/src/bootstrap/auth.ts | Sadece AuthState statik tutuluyor. | YOK | Gerçek JWT/Session parse yeteneği eklenmeli. |

*(Panel'in veritabanı veya Persistence katmanına direkt bağlandığına dair bir kod bulunamadı.)*

## 9. Domain Bazlı Permission Durumu

### 9.1 Customer
| Domain | Aksiyon | Mevcut Koruma | Eksik | Risk | HARDENING-05 Paketi |
|---|---|---|---|---|---|
| Customer | Profile Create/Update | Sadece `x-actor-id` | Token parse, Ownership Guard | CRITICAL | 05A, 05B |

### 9.2 Storefront
| Domain | Aksiyon | Mevcut Koruma | Eksik | Risk | HARDENING-05 Paketi |
|---|---|---|---|---|---|
| Storefront | Settings Update | Yok | Creator Owner Guard | HIGH | 05B |

### 9.3 Post
| Domain | Aksiyon | Mevcut Koruma | Eksik | Risk | HARDENING-05 Paketi |
|---|---|---|---|---|---|
| Post | Create/Publish | `x-actor-id` | Ownership Guard, State Check | CRITICAL | 05B, 05D |

### 9.4 UGC
| Domain | Aksiyon | Mevcut Koruma | Eksik | Risk | HARDENING-05 Paketi |
|---|---|---|---|---|---|
| UGC | Create Story | `x-actor-id` | Verified Purchase Eligibility Guard | CRITICAL | 05D |

### 9.5 Review
| Domain | Aksiyon | Mevcut Koruma | Eksik | Risk | HARDENING-05 Paketi |
|---|---|---|---|---|---|
| Review | Create Review | `x-actor-id` | Verified Purchase, User Auth | CRITICAL | 05D |

### 9.6 Q&A
| Domain | Aksiyon | Mevcut Koruma | Eksik | Risk | HARDENING-05 Paketi |
|---|---|---|---|---|---|
| Q&A | Ask Question | Yok | Customer Auth Guard | HIGH | 05D |
| Q&A | Answer Question | Yok | Supplier/Admin Authority Guard | CRITICAL | 05C |

### 9.7 Follow
| Domain | Aksiyon | Mevcut Koruma | Eksik | Risk | HARDENING-05 Paketi |
|---|---|---|---|---|---|
| Follow | Follow/Unfollow | `x-actor-id` | Real Session Auth | CRITICAL | 05D |

### 9.8 Cart / Commerce
| Domain | Aksiyon | Mevcut Koruma | Eksik | Risk | HARDENING-05 Paketi |
|---|---|---|---|---|---|
| Cart | Add/Remove/Checkout | `x-actor-id` (Guest/Customer) | Token Doğrulaması | HIGH | 05E |

### 9.9 Media
| Domain | Aksiyon | Mevcut Koruma | Eksik | Risk | HARDENING-05 Paketi |
|---|---|---|---|---|---|
| Media | Upload / Process | `x-actor-id` | Gerçek Session Auth | HIGH | 05B |

### 9.10 Moderation / Risk
| Domain | Aksiyon | Mevcut Koruma | Eksik | Risk | HARDENING-05 Paketi |
|---|---|---|---|---|---|
| Mod/Risk | Review Case | BFF `checkAccess` Mock | Admin/Operator Token Guard | CRITICAL | 05C |

## 10. Header Simulation / Fake Actor Kullanımları

| Dosya | Kullanım | Kaynak | Gerçek Auth mu? | Risk |
|---|---|---|---|---|
| apps/bff/src/server/context.ts | Admin / Mock Customer resolve | HARDCODED | NO | CRITICAL |
| apps/bff/src/server/customer.ts | `actorId = req.headers['x-actor-id']` | HEADER | NO | CRITICAL |
| apps/bff/src/server/post.ts | `actorId = req.headers['x-actor-id']` | HEADER | NO | CRITICAL |
| apps/bff/src/server/cart.ts | `actorId = req.headers['x-actor-id']` | HEADER | NO | HIGH |
| apps/bff/src/server/ugc.ts | `actorId = req.headers['x-actor-id']` | HEADER | NO | CRITICAL |
| apps/bff/src/server/review.ts | `actorId = req.headers['x-actor-id']` | HEADER | NO | CRITICAL |

## 11. Riskli Endpoint Listesi

| Endpoint / Handler | Domain | Neden Riskli? | Gerekli Guard | Öncelik |
|---|---|---|---|---|
| Bütün Mutation Uçları (BFF) | Tümü | `x-actor-id` üzerinden kimlik doğrulama yapıyor, token imzası kontrol etmiyor. | JWT/Token Validator, Session Guard | P0 |
| `handleCreateStorePost` | Post | Creator başka storefrontID ile post açabilir. | Ownership Guard | P0 |
| Payout/Settlement Mutations | Finance | Admin/Sistem işlemlerini dışarıdan bir `x-actor-id` yetkilendirebilir. | Admin Role Guard, Protected Action Guard | P0 |
| `handleCreateReview` | Review | Eligibility kontrolü yetersiz, fake yorum açılabilir. | Registered Customer Guard | P0 |

## 12. P05–P07 Foundation Gerçeklik Kontrolü

| Eski Paket | Kayıtlı Durum | Repo’da Mevcut Kanıt | Hâlâ Geçerli mi? | Not |
|---|---|---|---|---|
| P05 Auth / Session Foundation | Kapatıldı | `services/auth` boş. Mock JWT var. | Mock seviyesinde | Gerçek session persistence yok, token parse gerçekte çalışmıyor. |
| P06 Access / Permission / Scope | Kapatıldı | `access.ts` içinde mock scope/role var. | Mock seviyesinde | Domain seviyesine (Servis/Repository) inmemiş, sadece BFF proxy check seviyesinde. |
| P07 Protected Action Foundation | Kapatıldı | Route'lar var ama koruma gerçek değil. | Mock seviyesinde | Token bazlı koruma olmadan hepsi açık uç sayılır. |

## 13. Gerekli Implementation Paketleri

| Paket | Amaç | Kapsam | Dışarıda Bırakılacaklar | Kabul Kanıtı |
|---|---|---|---|---|
| HARDENING-05A | Auth / Session Foundation | `services/auth` JWT/Token imzalama ve doğrulama logiclerinin inşası, Redis/Memory Session persistence, Login/Register BFF entegrasyonu. | Role/Scope Domain Guardları | Token generate eden ve doğrulayan gerçek bir Auth Service; BFF `context.ts`'nin JWT'ye bağlanması. |
| HARDENING-05B | Permission Guard Integration | Domain Servislerine (`post`, `storefront` vb.) Ownership ve Mutation Guard implementasyonu. `x-actor-id`'nin kaldırılıp Token bazlı claim kullanımına geçilmesi. | Panel arayüzleri (Backend API önceliği) | Servislerin fake id'leri reddetmesi, yetkisiz mutationda 403 atması. |
| HARDENING-05C | Panel / Admin Route Protection | Moderation, Risk, Finance, Settlement endpointlerinin spesifik Admin/Operator Role Guard ile korunması. | Müşteri endpointleri | Sadece Admin yetkisine sahip Token ile bu endpointlerin çalışabilmesi. |
| HARDENING-05D | Social Action Permission | Review, UGC, Q&A, Follow işlemlerinin Registered Customer & Eligibility Guard (örn: Verified Purchase) ile bağlanması. | Commerce Checkouts | Guest'in yorum veya UGC üretememesi. |
| HARDENING-05E | Commerce Permission | Guest ve Customer sepet (Cart), Checkout ve Ödeme süreçleri arasında yetki / actor state geçişinin güvenliğe kavuşturulması. | - | Guest cart'ın social aksiyon tetiklememesi. |

## 14. HARDENING-05A Başlamadan Kapanması Gereken Belirsizlikler

| Belirsizlik | Neden Önemli? | Kapatma Yöntemi | Öncelik |
|---|---|---|---|
| External Auth Provider kullanılacak mı? | Token generation'ı kendimiz mi yazacağız, yoksa Cognito/Auth0 gibi bir yapı mı? | Mimari karar verilmesi. | P0 |
| Session Persistence Nerede? | Mevcut altyapıda Redis var mı yoksa PostgreSQL üzerinden mi gidecek? | Altyapı seçimi (şimdilik In-Memory devam edebilir). | P1 |

## 15. Komut / Test Durumu

| Komut | Çalıştırıldı mı? | Sonuç | Not |
|---|---|---|---|
| `pnpm run typecheck` | Evet | PASS | Tüm projelerde types geçerli. |
| `pnpm run build` | Evet | PASS | Derleme tamamlandı. |
| `pnpm run smoke:health` | Evet | SKIPPED | BFF ayakta değil: `fetch failed` |
| `pnpm run smoke:all` | Hayır | NOT RUN | Gerekli görülmedi (health geçemediği için). |

## 16. Nihai Karar

Nihai karar:
- HARDENING-05-00 bir inventory paketidir.
- Kod değişikliği yapılmadı.
- Sistem PASS/FAIL verilmedi.
- Repo gerçekliği çıkarıldı.
- HARDENING-05A için önerilen yön: `x-actor-id` simülasyonunun tamamen kaldırılıp, `services/auth` içinde JWT üreten/doğrulayan asgari bir Auth Service Foundation yazılması ve BFF'in bu servise bağlanmasıdır.
- En kritik P0 riskler: Müşteri, Creator ve Admin ayrımını sağlayan mutasyonların tümü sadece string id header'ına (`x-actor-id`) güvenmektedir, dolayısıyla auth yoktur.
- HARDENING-05A başlamadan önce kapanması gereken belirsizlikler: Auth provider kararı ve Token Signature Storage stratejisi.
