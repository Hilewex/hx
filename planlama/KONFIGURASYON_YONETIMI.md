# KONFIGURASYON_YONETIMI

Bu dosya, platform genelinde kullanılan konfigürasyonların nerede tutulacağını, kim tarafından değiştirilebileceğini, hangi kuralların kod sabiti olarak kalacağını ve hangi ayarların runtime / admin / db-config üzerinden yönetileceğini tanımlar.

Amaç:
- servislerin kendi kafasına göre config modeli üretmesini engellemek
- iş kuralı, operasyonel ayar ve gizli bilgi ayrımını netleştirmek
- environment, code constant, db-config ve admin-controlled config sınırlarını sabitlemek
- config değişikliği nedeniyle owner boundary veya truth mantığının bozulmasını önlemek

Net kural:
- secret ile business config aynı yerde yönetilmez
- her değişken env’e atılmaz
- her business rule da panelden değiştirilemez
- owner truth’u belirleyen kurallar serbest admin toggles’a dönüştürülmez
- kritik config değişiklikleri audit ve rollout disiplini ister

---

## 1. KAPSAM

Bu politika şu sınıfları kapsar:

- Environment config
- Secret config
- Static code constants
- Runtime business config
- Admin-controlled config
- Feature flags
- Test / mock config
- Observability / retry / timeout config

Bu politika özellikle şu alanlarda kritiktir:

- checkout
- payment
- order
- shipment
- return / refund
- settlement / payout
- review / story / reward
- moderation / support / panel actions
- notification orchestration

---

## 2. KONFIGURASYON SINIFLARI

---

## 2.1 C0 — Secret config

Tanım:
Gizli tutulması gereken bilgi.

Örnek:
- API keys
- provider secrets
- JWT signing secrets
- DB credentials
- SMTP / notification provider secrets
- payout provider credentials

Nerede tutulur:
- secret manager
- güvenli deployment secret store
- environment injection ile runtime’a verilebilir

Nerede tutulmaz:
- repo içinde düz dosya
- panel
- normal business config tablosu

Değiştiren:
- altyapı / güvenlik sorumlusu
- kontrollü deployment süreci

Audit:
- yüksek

---

## 2.2 C1 — Environment config

Tanım:
Ortamdan ortama değişen ama business rule olmayan teknik ayarlar.

Örnek:
- service base URLs
- port
- environment name
- provider endpoint
- queue / broker connection info
- observability endpoint
- Redis / Postgres host bilgisi
- timeout default base değerleri

Nerede tutulur:
- env
- deployment config
- container/orchestrator config

Nerede tutulmaz:
- panel üzerinden düzenlenebilir business rule alanı olarak

Değiştiren:
- deployment / infra süreci

Audit:
- orta / yüksek

---

## 2.3 C2 — Static code constants

Tanım:
Sık değişmeyen, sistem davranışının temel parçası olan, version-controlled sabitler.

Örnek:
- canonical enum setleri
- state names
- fixed error code anahtarları
- event topic sabitleri
- permission string anahtarları
- internal actor/scope canonical tanımları

Nerede tutulur:
- kod içinde
- version-controlled constants / schema / contract katmanında

Nerede tutulmaz:
- runtime admin panel
- db-config

Değiştiren:
- yalnız kod değişikliği ile

Audit:
- git history yeterlidir

Net kural:
State machine state isimleri veya canonical permission anahtarları panelden değiştirilemez.

---

## 2.4 C3 — Runtime business config

Tanım:
Kod deploy etmeden ayarlanması gerekebilecek business / operational ayarlar.

Örnek:
- checkout expiration süresi
- price lock süresi
- stock reservation timeout
- return window default süresi
- review/story eligibility activation gecikmesi
- reward pending -> vested geçiş süresi
- notification retry backoff profili
- payout minimum threshold
- support SLA süreleri

Nerede tutulur:
- config table
- config service
- versioned business config store

Nerede tutulmaz:
- secret store
- hard-coded sabitler

Değiştiren:
- yetkili operasyon/ürün/finans rolleri
- ama doğrudan değil; kontrollü config yönetimi ile

Audit:
- zorunlu

Bu sınıf en kritik sınıflardan biridir.

---

## 2.5 C4 — Admin-controlled config

Tanım:
İşletme tarafından sınırlı ve kontrollü değiştirilebilen ayarlar.

Örnek:
- feature visibility flags
- bazı moderation threshold’ları
- bazı reward campaign parametreleri
- storefront görünürlük ayarları
- notification template aç/kapat
- belirli panel görünürlük tercihleri

Nerede tutulur:
- admin config yönetim alanı
- audit’li config store

Nerede tutulmaz:
- owner truth state machine geçiş mantığının yerine

Değiştiren:
- yetkili admin rolleri
- permission + audit ile

Net kural:
Admin-controlled config, domain truth veya owner boundary’yi aşamaz.

---

## 2.6 C5 — Feature flags

Tanım:
Kod deploy edilmiş ama davranışın kontrollü açılıp kapanması için kullanılan flag yapısı.

Örnek:
- yeni discover block açma
- yeni reward market özelliği açma
- yeni panel ekranını belirli role gösterme
- rollout kontrollü endpoint veya UI davranışı açma

Nerede tutulur:
- feature flag system
- audit’li config store

Kural:
Feature flag, kalıcı business rule çöplüğüne dönüşmemelidir.

---

## 3. NE NEREDE TUTULMALI

---

## 3.1 Env’de tutulması gerekenler

Aşağıdakiler env/deployment config sınıfındadır:
- service URLs
- DB/Redis/broker bağlantı bilgileri
- timeout base değerleri
- provider endpoint adresleri
- environment adı
- logging / tracing hedefleri
- external secret references

Bunlar ürün/panel kararıyla değişmez.

---

## 3.2 Kod sabiti olarak tutulması gerekenler

Aşağıdakiler code constant olmalıdır:
- state machine state anahtarları
- event topic isimleri
- error code anahtarları
- scope / permission stringleri
- canonical enum listeleri
- fixed route segmentleri
- internal payload schema anahtarları

Bunlar runtime’da serbest değiştirilemez.

---

## 3.3 Runtime business config olarak tutulması gerekenler

Aşağıdakiler runtime config olmalıdır:
- checkout expiry dakika/saniye değeri
- price lock duration
- stock reservation duration
- return eligibility default penceresi
- review/story activation gecikmesi
- reward vesting süresi
- payout min threshold
- support SLA süreleri
- notification retry policy profile

Bunlar deploy’suz ayarlanabilmelidir ama audit zorunlu olmalıdır.

---

## 3.4 Admin-controlled config olması muhtemel alanlar

Aşağıdakiler admin kontrollü olabilir:
- bazı UI görünürlük feature’ları
- bazı moderation threshold’ları
- belirli template enable/disable ayarları
- belirli reward campaign parametreleri
- discover/home block gösterim kuralları

Ama aşağıdakiler admin-controlled olmamalıdır:
- owner truth state isimleri
- payment/order/shipment temel transition mantığı
- settlement/payout owner mantığı
- canonical permission isimleri
- core idempotency davranışı

---

## 4. DOMAINE GORE KONFIGURASYON KARARLARI

---

## 4.1 Checkout / Cart

Runtime config:
- checkout expiry
- max cart item count
- guest checkout enable/disable
- review retry backoff
- price lock duration
- stock reservation duration

Code constants:
- checkout state enum
- review result state anahtarları

Admin-controlled olabilir:
- bazı guest checkout görünürlük feature’ları

Olmamalı:
- checkout -> payment readiness temel mantığının panelden oynanması

---

## 4.2 Payment

Runtime config:
- payment initiation timeout
- callback tolerance window
- retry profile
- provider routing öncelik profili gerekiyorsa

Env/secret:
- provider keys
- provider endpoints

Code constants:
- payment state enum
- callback result enum
- idempotency anahtarı zorunlulukları

Olmamalı:
- captured -> order create temel prensibinin admin panelden değişmesi

---

## 4.3 Order / Shipment

Runtime config:
- shipment preparation SLA
- tracking refresh polling policy
- delivery event lag tolerance
- auto-close / auto-finalize pencere ayarları gerekiyorsa

Code constants:
- order state enum
- shipment event type enum

Admin-controlled olabilir:
- bazı operasyonel escalation threshold’ları

Olmamalı:
- shipment’in order truth yerine geçecek şekilde kural değişikliği

---

## 4.4 Return / Refund

Runtime config:
- return window default süresi
- kategori bazlı return kural parametreleri
- refund retry/backoff
- evidence requirement threshold’ları

Code constants:
- return state enum
- refund state enum

Admin-controlled olabilir:
- belirli kampanya dönemlerinde ek iade esnekliği
- bazı operasyonel override profilleri

Olmamalı:
- return approved = refund completed gibi çekirdek mantığın config’e dönüştürülmesi

---

## 4.5 Review / Story / Reward

Runtime config:
- delivered sonrası eligibility activation gecikmesi
- story quota
- reward pending period
- reward revoke policy pencere ayarları

Code constants:
- eligibility state enum
- reward trigger type enum

Admin-controlled olabilir:
- bazı reward earning campaign parametreleri
- belirli story feature rollout ayarları

Olmamalı:
- verified purchase mantığının keyfi toggle’a dönüştürülmesi

---

## 4.6 Settlement / Payout

Runtime config:
- payout minimum threshold
- payout batch window
- hold/release timeout değerleri
- settlement generation schedule profili

Env/secret:
- payout provider credentials
- payout integration endpoints

Code constants:
- settlement state enum
- payout state enum

Admin-controlled olabilir:
- payout batch release/hold operasyon parametreleri
- belirli görünürlük/raporlama eşikleri

Olmamalı:
- payable tanımının keyfi ve audit’siz değiştirilmesi
- settlement adjustment mantığının serbest toggle’a çevrilmesi

---

## 4.7 Support / Moderation / Panel

Runtime config:
- SLA süreleri
- escalation timeout’ları
- queue aging threshold’ları
- moderation review target süreleri

Code constants:
- scope/permission anahtarları
- ticket state enum
- moderation action enum

Admin-controlled olabilir:
- queue visibility
- bazı escalation rotaları
- template ve görünürlük ayarları

Olmamalı:
- role/scope/permission canonical anahtarlarının panelden değiştirilmesi

---

## 5. DEGISIKLIK YONETIM KURALI

## 5.1 Her config değişikliği aynı ağırlıkta değildir
Sınıflandırma:

### D1 — düşük risk
Örnek:
- notification retry count
- dashboard visibility flag

### D2 — orta risk
Örnek:
- checkout expiry süresi
- reward pending period
- SLA süreleri

### D3 — yüksek risk
Örnek:
- payout threshold
- return window
- reservation timeout
- price lock duration

### D4 — çok yüksek risk
Örnek:
- payment provider routing
- refund policy override
- settlement-related financial config

D3 ve D4 değişiklikleri:
- audit
- reason
- rollout planı
- gerekirse approval
istemelidir.

---

## 5.2 Değişiklik yayılımı
Config değişikliği sonrası:
- hangi servisler etkileniyor
- reload nasıl olacak
- cache invalidation gerekiyor mu
- rollout anlık mı gecikmeli mi
net olmalıdır.

---

## 6. AUDIT KURALI

Aşağıdaki config değişiklikleri audit zorunludur:
- checkout expiry
- stock reservation timeout
- price lock duration
- return window
- reward vesting süreleri
- payout threshold
- settlement/payout operational parametreleri
- support SLA config
- moderation threshold’ları
- feature flag rollout değişiklikleri

Audit kaydı en az şunları taşımalıdır:
- kim değiştirdi
- ne değişti
- önceki değer
- yeni değer
- ne zaman değişti
- neden değişti

---

## 7. VERSIONLAMA KURALI

Runtime business config mümkünse version taşımalıdır.

Örnek:
- `checkout_policy_v3`
- `reward_policy_v2`
- `payout_threshold_config_v5`

Neden:
- sonradan davranış farkı incelenebilir
- incident sonrası hangi config aktifti bulunabilir
- rollback kolaylaşır

Net kural:
“mevcut değer” tek başına yeterli değildir; kritik config’lerde geçmiş görünmelidir.

---

## 8. CONFIG VE KOD ILISKISI

Kodlama sırasında şu disiplin uygulanmalıdır:

1. Bir kural için önce sınıf belirlenir:
   - code constant mı
   - env mi
   - runtime config mi
   - admin-controlled mu

2. Sonra ilgili erişim yolu yazılır:
   - constants
   - config provider
   - env loader
   - feature flag service

3. Sonra fallback kuralı belirlenir:
   - config yoksa ne olur
   - invalid config varsa ne olur
   - default değer kullanılabilir mi

Net kural:
Kod içinde rastgele “magic number” bırakılmaz.

---

## 9. HATALI YAKLASIMLAR

Aşağıdakiler yasaktır veya istenmez:

- tüm business rule’ları env’e doldurmak
- core state machine davranışını admin toggle’a çevirmek
- secret ile runtime business config’i aynı tabloda tutmak
- audit’siz panel config değişikliği
- config değişikliğinin rollout etkisini düşünmemek
- her servisin kendi config yorumunu üretmesi
- versiyonsuz kritik config değişikliği

---

## 10. IMPLEMENTASYON ICIN NET KARARLAR

Bu dosya aşağıdaki kararları sabitler:

1. Secret config ayrı sınıftır
2. Teknik ortam ayarları env/deployment config’dir
3. Canonical state/scope/error/event anahtarları code constant’tır
4. Checkout/return/reward/payout gibi iş kuralları runtime config sınıfına girebilir
5. Bazı görünürlük ve operasyon parametreleri admin-controlled olabilir
6. Core owner logic ve state machine temel prensipleri panel config’e dönüştürülemez
7. Kritik config değişiklikleri audit ve version ister
8. Kod içinde rastgele sayı/süre/eşik bırakılmaz

---

## 11. KISA OZET

Doğru konfigürasyon yönetimi şudur:

- secret, env, code constant ve runtime config birbirinden ayrılır
- her ayar env’e atılmaz
- her ayar panelden değiştirilmez
- kritik business config deploy’suz yönetilebilir ama audit’li olur
- canonical state/error/scope yapıları kod sabiti olarak kalır
- checkout, return, reward, payout gibi süre/eşik ayarları kontrollü runtime config olur
- kritik config değişikliği version ve rollback disiplini ister