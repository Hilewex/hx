# HARDENING-05A — Auth / Session / Actor Context Foundation Closure Report

## 1. Kısa Özet
- **Paket amacı:** HARDENING-05-00 inventory raporunda tespit edilen mock/fake actor temel problemini çözmek için merkezi auth/session/actor context foundation kurmak.
- **Yapılan implementation:** `@hx/auth` servisi oluşturuldu. `issueAuthToken`, `validateAuthToken` fonksiyonları ile HMAC tabanlı JWT benzeri bir token mekanizması geliştirildi. `ActorContext` tipleri güncellendi ve `BFF` request context resolver bu yeni yapıya uyarlandı. `apps/bff` tarafında `ALLOW_LEGACY_ACTOR_HEADER_FOR_SMOKE` desteği ile mevcut testlerin kırılması engellenirken, temel router'larda `req.headers['x-actor-id']` yerine `req.context.actorId` yapısına geçiş yapıldı.
- **Yapılmayanlar:** Bu paketin sınırları gereği domain guard'ları eklenmedi. Admin/finance/moderation korumaları tamamlanmadı, sadece context altyapısı kuruldu. Gerçek bir dış auth sağlayıcı (OAuth vb.) entegrasyonu yapılmadı.
- **Nihai karar:** PASS WITH LIMITATION

## 2. Referans Dosyalar
| Dosya | Durum | Not |
|---|---|---|
| `HARDENING-05-00-AUTH-SESSION-PERMISSION-INVENTORY.md` | Okundu | Genel eksikler ve mock auth yapısı incelendi. |
| `planlama/HARDENING_PROGRESS_RECORD.md` | Okundu | Gelişim adımları kontrol edildi. |
| `packages/contracts/src/auth.ts` | Güncellendi | ActorContext ve token tipleri eklendi. |

## 3. Değişen Dosyalar
| Dosya | Değişiklik | Gerekçe |
|---|---|---|
| `packages/contracts/src/auth.ts` | CREATOR vs INTERNAL_SERVICE rolleri ve auth token tipleri eklendi. | Auth foundation altyapısı için. |
| `services/auth/src/token.ts` | HMAC şifrelemeli token issue / validate mekanizması eklendi. | Gerçek bir auth doğrulama simulasyonu için. |
| `services/auth/src/auth.ts` | `resolveActorFromAuthorizationHeader` metodu eklendi. | BFF'in HTTP header'dan actor çözümlemesi yapabilmesi için. |
| `apps/bff/src/server/context.ts` | `resolveContext` mock auth yapısından kurtarıldı. | Sadece valid token geldiğinde Actor context üretilmesi için. |
| `apps/bff/src/server/index.ts` | `resolveContext` entegrasyonu sağlandı, legacy fallback eklendi. | Eski testlerin kırılmaması için kontrollü geçiş sağlandı. |
| `apps/bff/src/server/customer.ts` | `req.headers['x-actor-id']` yerine `req.context` kullanımı sağlandı. | Explicit header reliance'ın kaldırılması için. |

## 4. Auth Service Foundation Sonucu
- **Token issue:** `HMAC-SHA256` kullanılarak payload imzalanıyor ve Base64url formatında string dönülüyor.
- **Token validate:** İmza kontrolü ve expiration doğrulama işlemleri çalışıyor.
- **Expiration:** Token TTL (varsayılan: 86400 sn) desteği eklendi.
- **Claims:** `sub`, `role`, `sid`, `iat`, `exp` bilgileri token içerisinde güvenli bir şekilde taşınıyor.
- **Guest actor:** Token olmadığında ya da geçersiz olduğunda GUEST actor döndürülüyor.
- **Authenticated actor:** Valid token durumunda role/actorId map edilerek dönüyor.
- **Dev/test token helper:** `issueDevAuthToken` ile smoke testler / dev süreci için kolaylaştırıcı helper sağlandı.

## 5. BFF Actor Context Sonucu
- **Authorization header davranışı:** `Bearer <token>` yakalanıp auth service ile doğrulanıyor.
- **No token davranışı:** `GUEST` (isAuthenticated: false) döndürülüyor.
- **Invalid token davranışı:** `GUEST` ve `INVALID` session döndürülüyor.
- **Expired token davranışı:** `GUEST` ve `EXPIRED` session döndürülüyor.
- **Legacy `x-actor-id` durumu:** `ALLOW_LEGACY_ACTOR_HEADER_FOR_SMOKE=true` durumunda sahte aktör testlerin geçmesi için kabul ediliyor, ancak false olduğu durumda (PROD davranışı) kesinlikle reject ediliyor. Bu durum bir limitation olarak ileriki paketlerde düzeltilmek üzere bırakıldı.

## 6. Route Uyum Sonucu
| Route/Handler | Eski Actor Kaynağı | Yeni Actor Kaynağı | Kalan Borç |
|---|---|---|---|
| `customer.ts` | `req.headers['x-actor-id']` | `req.context.actorId` | Yok |
| `cart.ts` | `index.ts`'ten gelen mock | `req.context` (auth resolver) | Yok |
| `post.ts` | `index.ts`'ten gelen mock | `req.context` (auth resolver) | Yok |
| `ugc.ts`, vb. | `index.ts`'ten gelen mock | `req.context` (auth resolver) | Kalan kısımlarda halen legacy header destekleniyor (05B için). |

## 7. Smoke/Test Sonuçları
| Komut | Sonuç | Not |
|---|---|---|
| `pnpm run typecheck` | PASS | Bütün repoda tipler doğrulandı. |
| `pnpm run build` | PASS | Bütün monorepo paketleri başarılı bir şekilde derlendi. |
| `pnpm run smoke:health` | PASS | BFF çalışıyor ve ayakta. |
| `pnpm run smoke:commerce` | PASS | Cart operasyonları başarıyla tamamlandı (memory DB ile test edildi). |
| `pnpm run smoke:social` | PASS | Social domain fonksiyonları çalışıyor. |
| `pnpm run smoke:media` | PASS | Media readiness onaylandı. |

## 8. Boundary Review
### Auth Boundary
- Auth sadece identity/session/claims üretir.
- Permission kararı üretmez.
- Eligibility kararı üretmez.

### BFF Boundary
- BFF actor context çözer.
- BFF owner truth üretmez.
- BFF domain mutation owner’ı olmaz.

### Permission Boundary
- Permission engine bu pakette tamamlanmadı.
- Domain guardlar 05B/05C/05D/05E’ye bırakıldı.

### Guest Commerce Boundary
- Guest cart/commerce akışı korunur.
- Guest social haklar otomatik açılmaz.

### Panel Boundary
- Panel direct-write eklenmedi.
- Panel auth state ileri pakette derinleşecek.

## 9. Kalan Limitation’lar
- Full permission engine 05B’ye kaldı.
- Admin/finance/moderation route protection 05C’ye kaldı.
- Social action permission enforcement 05D’ye kaldı.
- Commerce permission enforcement 05E’ye kaldı.
- External auth provider (OAuth, vb.) yok.
- **Legacy actor header (`x-actor-id`) halen smoke testleri için opsiyonel olarak kalmıştır (HIGH LIMITATION). İlerleyen süreçte (05B-05E) bu header'ın kullanımı smoke testlerinden de kaldırılarak dev helper üzerinden gerçek token ile test yapılması sağlanmalıdır.**

## 10. HARDENING-05B İçin Hazırlık
- **Hangi route’lar artık gerçek actor context alıyor?** Customer, Cart, Post, UGC gibi temel mutation route'ları artık `req.context` kullanarak auth service resolver'dan actor state'ini alıyor.
- **Hangi domainlerde ownership guard eksik?** Social, Commerce (Order, Checkout), Media ve UGC domainlerinde henüz ownership guard'ları eklenmedi.
- **Hangi mutation endpointleri 05B’de P0 ele alınmalı?** Post / Storefront / UGC yaratma ve güncelleme operasyonları (kişinin sadece kendi kaynağını güncelleyebilmesi).
- **Hangi smoke’lar 05B’de genişletilmeli?** Yetkisiz erişim (Unauthorized/Forbidden) senaryolarını test eden negatif smoke testleri yazılmalı. Mevcut smoke'larda legacy header yerine dev auth token üretimi entegre edilmeli.

## 11. Nihai Karar
Nihai karar:
- **HARDENING-05A:** PASS WITH LIMITATION
- **Kararın gerekçesi:** Auth ve session temel yapısı başarıyla kuruldu, tüm testler geçiyor ancak smoke testlerini kırmamak adına `x-actor-id` legacy geçiş opsiyonu olarak `ALLOW_LEGACY_ACTOR_HEADER_FOR_SMOKE` ile dev/test modunda tutuldu.
- **Zorunlu kanıtlar:** `typecheck`, `build` ve `smoke` testlerinin hepsi PASS vermiştir.
- **Kalan limitation’lar:** Yukarıda belirtilen 05B-05E aşamalarında uygulanacak permission ve guard kuralları ile legacy header durumu.
- **Sıradaki önerilen paket:** HARDENING-05B — Permission Guard Integration

## 12. Son Not
Bu paket HARDENING-05 hattının temelidir. 05A tamamlanmadan 05B/05C/05D/05E’ye geçilmemelidir ve bu altyapı üzerine inşaa edilerek ilerlenecektir.
