# HARDENING-05B — Permission Guard Integration Closure Report

## 1. Kısa Özet
- **Paket amacı:** 05A'da kurulan merkezi `req.context` / ActorContext altyapısını kullanarak mutation boundary'lerinde temel permission ve ownership guard standardı kurmak.
- **Yapılan implementation:** BFF mutation route’larında merkezi guard helper standardı (`apps/bff/src/server/guards.ts`) kuruldu. `requireAuthenticated`, `requireActorType`, `requireRole`, `requireSelfOrAdmin` gibi guard'lar Customer, Storefront, Post, UGC ve Media servislerine entegre edildi. `x-actor-id` kullanımı kısıtlandı ve smoke testler `Authorization: Bearer <token>` kullanacak şekilde güncellendi. Yetkisiz erişim senaryoları için negatif smoke testler eklendi (`tests/smoke/suites/auth-permission.ts`).
- **Yapılmayanlar:** Full permission engine yazılmadı. Admin, finance, moderation, social action (review/Q&A/follow) ve tam kapsamlı commerce (cart/checkout/guest) izinleri bu paketin dışındadır.
- **Nihai karar:** PASS WITH LIMITATION. Ana hedefler karşılandı, ancak bazı smoke test suitlerinde legacy `x-actor-id` kullanımı devam etmektedir ve service-level ownership check'ler tam olarak entegre edilmemiştir.

## 2. Referans Dosyalar
| Dosya | Durum | Not |
|---|---|---|
| HARDENING-05-00-AUTH-SESSION-PERMISSION-INVENTORY.md | İncelendi | Paket hedeflerini belirlemede kullanıldı. |
| HARDENING-05A-AUTH-SESSION-ACTOR-CONTEXT-CLOSURE-REPORT.md | İncelendi | 05A'nın çıktıkları ve 05B'nin başlangıç noktası doğrulandı. |
| planlama/HARDENING_PROGRESS_RECORD.md | İncelendi | İlerleme takibi için referans alındı. |
| planlama/23-üyelik giriş sistemi.md | İncelendi | Auth/permission konseptleri için temel oluşturdu. |
| planlama/25-kural -yetki sistemi.md | İncelendi | Yetki sistemi hedefleri için referans alındı. |

## 3. Değişen Dosyalar
| Dosya | Değişiklik | Gerekçe |
|---|---|---|
| `apps/bff/src/server/guards.ts` | Yeni dosya | Merkezi ve tekrar kullanılabilir permission guard helper'larını barındırmak için oluşturuldu. |
| `apps/bff/src/server/customer.ts` | Guard entegrasyonu | Customer self-scope (müşterinin kendi verisini değiştirebilmesi) kuralı eklendi. |
| `apps/bff/src/server/storefront.ts` | Guard entegrasyonu | Storefront'ların sadece sahibi olan creator'lar tarafından yönetilmesi sağlandı. |
| `apps/bff/src/server/post.ts` | Guard entegrasyonu | Post oluşturma ve yönetme işlemlerinin sadece post sahibi creator tarafından yapılması garanti edildi. |
| `apps/bff/src/server/ugc.ts` | Guard entegrasyonu | Kullanıcı tarafından oluşturulan içeriğin (UGC) sadece kimliği doğrulanmış müşteriler tarafından oluşturulabilmesi sağlandı. |
| `apps/bff/src/server/media.ts`| Guard entegrasyonu | Medya yüklemelerinde `sourceType` (kaynak tipi) ve `actorType` (aktör tipi) uyumluluğu kontrolü eklendi. |
| `tests/smoke/suites/auth-permission.ts` | Yeni/Güncellenmiş dosya | Yetkisiz/yasaklanmış erişim senaryolarını test etmek için negatif smoke testler eklendi/güncellendi. |

## 4. Guard Helper Standardı
- **Eklenen helper’lar:** `requireAuthenticated`, `requireActorType`, `requireRole`, `requireSelfOrAdmin`, `requireCreator`, `requireCustomer`, `denyUnauthorized`, `denyForbidden`.
- **401 / 403 ayrımı:** Kimlik doğrulanmamış (örneğin token yok) ise `401 UNAUTHORIZED`, kimlik doğrulanmış ancak yetki/izin yoksa `403 FORBIDDEN` hatası döndürülerek standart korundu.
- **Context kullanımı:** Tüm guard'lar `req.context` üzerinden gelen doğrulanmış aktör bilgisini kullanır.
- **Error response standardı:** Mevcut BFF hata response standardına uygun hatalar fırlatıldı.

## 5. Domain Uygulama Sonucu

### Customer
- **Self-scope guard sonucu:** Müşteri mutation'ları artık `req.context.actor.id` ile hedeflenen `customerId`'yi karşılaştırarak çalışıyor. Başka bir müşterinin verisini değiştirme denemeleri `403 FORBIDDEN` ile engellendi.
- **Guest davranışı:** Misafir kullanıcıların kalıcı müşteri verisi oluşturması veya değiştirmesi engellendi.
- **Ownership mismatch davranışı:** Bir müşterinin başka bir müşteri adına işlem yapma denemeleri engellendi ve negatif testlerle doğrulandı.

### Storefront
- **Creator ownership guard sonucu:** Storefront mutation'ları, işlemi yapan aktörün `CREATOR` tipinde olmasını ve hedef storefront'un sahibi olmasını gerektiriyor.
- **Kalan service-level borçlar:** Storefront sahiplik kontrolü şu anda BFF seviyesindedir. İleriki paketlerde bu mantığın `storefront-service`'e taşınması bir "technical debt" (teknik borç) olarak not edilmiştir.

### Post
- **Creator guard sonucu:** Post oluşturma (`createPost`) işlemi sadece `CREATOR` rolündeki aktörler tarafından yapılabilir.
- **Post create/transition sınırı:** Başka bir creator adına post oluşturma girişimleri engellenmektedir. Post'un durum geçişleri (lifecycle) için yetkilendirme (moderasyon vb.) 05C kapsamındadır.
- **Kalan lifecycle / moderation borçları:** Admin/moderasyon yetkileri 05C/06 paketlerine bırakılmıştır.

### UGC
- **Customer actor guard sonucu:** UGC (User Generated Content) oluşturma işlemleri yalnızca `CUSTOMER` tipindeki aktörler için mümkündür. Misafir veya `CREATOR` aktör denemeleri engellenir.
- **Eligibility’nin 05D’ye bırakıldığı açık not:** Satın alınmış bir ürüne yorum yapma gibi "eligibility" (uygunluk) kontrolleri bu paketin kapsamında değildir ve 05D'ye bırakılmıştır.

### Media
- **Actor/source guard sonucu:** Media yükleme endpoint'leri artık `sourceType` ve `actorType` arasında tutarlılık kontrolü yapmaktadır. (Örn: `UGC` kaynağı için sadece `CUSTOMER` yükleme yapabilir).
- **Admin/operator media action borçları:** Admin/operatör yetkileri gerektiren medya işlemleri (onaylama, işleme vb.) 05C kapsamındadır.

## 6. Legacy x-actor-id Durumu
| Dosya/Suite | Legacy Kullanım Var mı? | Neden? | Hangi Pakette Kaldırılacak? | Risk |
|---|---|---|---|---|
| `tests/smoke/suites/commerce.ts` | Evet | Mevcut testlerin dev token altyapısına geçirilmesi için zaman gerekiyordu. | `HARDENING-05E` | HIGH |
| `tests/smoke/suites/social.ts` | Evet | Mevcut testlerin dev token altyapısına geçirilmesi için zaman gerekiyordu. | `HARDENING-05D` | HIGH |
| `tests/smoke/suites/others.ts` | Kısmen | Bazı eski test senaryoları tam olarak migrate edilemedi. | `HARDENING-06` | Medium |

`ALLOW_LEGACY_ACTOR_HEADER_FOR_SMOKE=false` ayarı ile ana yetkilendirme smoke testleri başarıyla çalışmaktadır. Ancak, yukarıda listelenen suitler tam uyumlu değildir ve HIGH LIMITATION olarak raporlanmalıdır.

## 7. Negative Smoke/Test Sonuçları
| Senaryo | Beklenen | Sonuç | Kanıt |
|---|---|---|---|
| Guest protected mutation | `401 UNAUTHORIZED` | PASS | `tests/smoke/suites/auth-permission.ts` |
| Wrong actor type (Customer creating a Post) | `403 FORBIDDEN` | PASS | `tests/smoke/suites/auth-permission.ts` |
| Ownership mismatch (Customer A updating Customer B's profile) | `403 FORBIDDEN` | PASS | `tests/smoke/suites/auth-permission.ts` |
| Actor/source mismatch (Creator uploading UGC media) | `403 FORBIDDEN` | PASS | `tests/smoke/suites/auth-permission.ts` |
| Legacy disabled auth-permission smoke | `PASS` | PASS | `pnpm run smoke:auth-permission` komut çıktısı |

## 8. Komut Sonuçları
| Komut | Sonuç | Not |
|---|---|---|
| `pnpm run typecheck` | `PASS` | Tüm tipler uyumlu. |
| `pnpm run build` | `PASS` | Proje başarıyla derlendi. |
| BFF boot (`ALLOW_LEGACY_ACTOR_HEADER_FOR_SMOKE=false`) | `PASS` | BFF sunucusu legacy header olmadan başarıyla başlatıldı. |
| `pnpm run smoke:health` | `PASS` | Temel sağlık kontrolleri başarılı. |
| `pnpm run smoke:auth-permission` | `PASS` | Yetkilendirme ve izin testleri başarılı. |
| `pnpm run smoke:social` | `PASS WITH LIMITATION` | Legacy header bağımlılığı var. |
| `pnpm run smoke:media` | `PASS` | Medya testleri başarılı. |
| `pnpm run smoke:all` | `PASS WITH LIMITATION` | Bazı suitlerde legacy header bağımlılığı var. |

## 9. Boundary Review
- **Auth Boundary:** Korundu. Auth servisi sadece kimlik doğrulamadan sorumlu kaldı, izin (permission) mantığı guard'lara taşındı.
- **Permission Boundary:** Korundu. Bu paket, tam bir policy motoru kurmak yerine minimal guard entegrasyonu yaptı.
- **Eligibility Boundary:** Korundu. UGC/yorum için satın alma şartı gibi uygunluk (eligibility) kuralları 05D'ye bırakıldı.
- **BFF Boundary:** Korundu. BFF, iş mantığı üretmek yerine sadece bir aracı ve koruyucu (guard/delegation) rolünü üstlendi.
- **Domain Ownership Boundary:** Korundu. Servislerin kendi veri sahipliği (truth owner) prensiplerine dokunulmadı.

## 10. Kalan Limitation’lar
- **Full permission engine yok:** Kurallar kod içinde, merkezi bir policy engine (örn. OPA, Casbin) kullanılmıyor.
- **Admin/finance/moderation route protection 05C’ye kaldı:** Bu alanlar hala korumasız veya eksik korumalı.
- **Review/Q&A/follow full social permission 05D’ye kaldı:** Sosyal etkileşimlerin detaylı izinleri eksik.
- **Commerce permission 05E’ye kaldı:** Misafir ve müşteri sepet/ödeme akışları tam olarak güvenli değil.
- **Legacy smoke header kullanımı:** Bazı smoke test suitleri hala `x-actor-id` kullanıyor. (**HIGH LIMITATION**)
- **Storefront ownership BFF-level:** Sahiplik kontrolünün `storefront-service`'e taşınması gerekiyor.

## 11. HARDENING-05C / 05D / 05E Hazırlığı

**05C için:**
- Korunması gereken endpoint'ler: Admin paneli, finansal raporlama, mutabakat, moderasyon (post/yorum onay/red) ve risk yönetimi ile ilgili tüm mutation'lar.

**05D için:**
- Borçlar: Yorum, Soru-Cevap ve Takip etme aksiyonları için "satın almış olma", "henüz yorum yapmamış olma" gibi uygunluk (eligibility) kontrollerinin ve izinlerin tam olarak uygulanması.

**05E için:**
- Borçlar: Misafir (guest) sepetinin kayıtlı müşteri sepetine aktarılması, ödeme sırasında aktörün doğrulanması ve sipariş yetkilendirmesi gibi misafir-müşteri geçişlerindeki güvenlik açıklarının kapatılması.

## 12. Nihai Karar

**Nihai karar:** `PASS WITH LIMITATION`

- **Kararın gerekçesi:** Paketin ana hedefleri olan merkezi guard standardının kurulması, temel domain'lerde (customer, storefront, post, ugc, media) sahiplik ve aktör tipi kontrollerinin entegre edilmesi ve `x-actor-id`'nin birincil yol olmaktan çıkarılması başarıyla tamamlandı. `ALLOW_LEGACY_ACTOR_HEADER_FOR_SMOKE=false` ile ana negatif testler başarıyla çalışmaktadır. Ancak, bazı smoke test suitlerinin hala legacy header'a bağımlı olması ve bazı kontrollerin sadece BFF seviyesinde kalması nedeniyle "WITH LIMITATION" kararı verilmiştir.
- **Zorunlu kanıtlar:** Typecheck, build, BFF boot ve `smoke:auth-permission` testlerinin başarılı sonuçları.
- **Kalan limitation’lar:** Yukarıda "Kalan Limitation’lar" ve "Legacy x-actor-id Durumu" bölümlerinde detaylandırılmıştır.
- **Sıradaki önerilen paket:** `HARDENING-05C — Panel / Admin / Creator Route Protection`

## 13. Son Not
Bu paket, 05A'nın sağladığı güvenilir aktör bağlamı (actor context) temelini, domain mutation'larının sınırlarına taşıyarak sistemin genel güvenliğini önemli ölçüde artırmıştır. 05B'nin tamamlanması, daha karmaşık ve hassas yetkilendirme kurallarını uygulayacak olan 05C, 05D ve 05E paketleri için sağlam bir zemin oluşturmaktadır.
