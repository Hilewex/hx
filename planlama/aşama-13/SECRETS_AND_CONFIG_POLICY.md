# SECRETS_AND_CONFIG_POLICY

## 1. Amaç

Bu dosya, platformun secrets ve runtime configuration yönetimini tek doğrulu, uygulanabilir ve çakışmasız politika setine dönüştürür.

Bu dosyanın amacı:

* secret ile config kavramlarını net biçimde ayırmak
* staging ve production ortamlarında secret/config izolasyonunu bağlayıcı hale getirmek
* hangi servis ailesinin hangi secret sınıfına erişebileceğini ve hangi erişim modelinin yasak olduğunu sabitlemek
* panel, gateway, core service, worker ve data katmanlarının güvenli config çalışma düzenini kurmaktır

Net kural:

* Secret ile config aynı şey değildir
* Secret kaynak koda gömülmez
* Staging secret’ı production’da kullanılamaz
* Panel kullanıcısı secret görmez; yalnız gerekli action sonucu görür
* Public app layer hiçbir zaman privileged internal secret taşımaz
* Rotation, revocation ve access audit olmadan kritik secret yönetimi tamamlanmış sayılmaz

---

## 2. Kapsam

Bu politika ilk fazda aşağıdaki alanları kapsar:

1. secret sınıfları
2. config sınıfları
3. environment isolation
4. service-to-secret erişim modeli
5. panel ve elevated action config sınırları
6. rotation / revocation prensipleri
7. audit ve access visibility prensipleri
8. staging / production secret disiplini
9. worker ve callback secret yönetimi
10. yasak secret/config davranışları

Bu dosya aşağıdaki alanları exact vendor veya ürün seviyesinde açmaz:

* belirli secret manager ürünü
* belirli KMS/HSM ürünü
* exact CLI/SDK komutları
* exact IaC syntax’ı

---

## 3. Temel ilkeler

### SC-001 — Secret ve config ayrıdır

**Binding Rule:** Timeout, feature flag, base URL, retry count gibi değerler config; private key, token, credential, signing secret, DB password gibi değerler secret sınıfındadır.

### SC-002 — Secret least-privilege ile dağıtılır

**Binding Rule:** Bir servis yalnız gerçekten ihtiyaç duyduğu secret sınıfını alır; bütün ortam sırrı tek container veya tek app bundle içine doldurulmaz.

### SC-003 — Public-facing runtime privileged secret taşımaz

**Binding Rule:** Storefront app ve browser-delivered panel frontend, internal provider secret, DB credential veya owner-service privileged credential barındırmaz.

### SC-004 — Environment isolation zorunludur

**Binding Rule:** Staging, production ve varsa local/dev secret setleri birbirinden tamamen ayrıdır; aynı token/key yeniden kullanılmaz.

### SC-005 — Rotation first-class güvenlik davranışıdır

**Binding Rule:** Kritik secret kalıcı ve değişmez varsayılmaz; rotation ve revocation planı olmayan secret yüksek risk kabul edilir.

### SC-006 — Access visibility gereklidir

**Binding Rule:** Hangi servis veya hangi operasyonel actor hangi secret sınıfına erişmiş, bu erişim denetlenebilir olmalıdır.

### SC-007 — Panel action sonucu secret açıklamaz

**Binding Rule:** Panelde bir işlem yapmak için secret kullanılabilir; ama secret value operatöre, UI’ya veya audit dışı log’a sızmaz.

### SC-008 — Config drift production risktir

**Binding Rule:** Ortamlar arası config farkı bilinçli, görünür ve kontrollü olmalıdır; sessiz config drift kabul edilmez.

---

## 4. Secret sınıf standardı

İlk fazda minimum secret aileleri:

* `auth_session_secret`
* `jwt_or_signing_secret`
* `db_credential`
* `redis_credential`
* `payment_provider_secret`
* `shipment_provider_secret`
* `storage_secret`
* `internal_service_credential`
* `webhook_signature_secret`
* `notification_provider_secret`
* `admin_elevated_secret`
* `encryption_material`

Net kural:

* Aynı secret birden fazla aileyi temsil etmez
* Provider secret ile internal service credential aynı risk sınıfında ele alınmaz
* Signing secret ile DB credential aynı erişim modelinde dağılmaz

---

## 5. Config sınıf standardı

İlk fazda minimum config aileleri:

* `public_base_url`
* `panel_base_url`
* `service_endpoint`
* `feature_flag`
* `timeout_policy`
* `retry_policy`
* `rate_limit_policy`
* `cache_ttl_policy`
* `media_variant_policy`
* `search_index_policy`
* `checkout_lock_window`
* `reservation_expiry_policy`
* `alert_threshold_policy`
* `logging_level`

Net kural:

* Config görünür olabilir diye sınırsız dağıtılmaz
* Public config ile internal config aynı yayın modeliyle taşınmaz
* Runtime behavior değiştiren config’ler governance altında tutulur

---

## 6. Erişim katmanı standardı

### SC-010 — Storefront frontend secret erişimi

**Allowed:** public config only
**Forbidden:** DB credential, provider secret, internal service credential, signing material

### SC-011 — Panel frontend secret erişimi

**Allowed:** public/panel config only
**Forbidden:** provider secret, DB credential, internal privileged credential

### SC-012 — Gateway/BFF secret erişimi

**Allowed:** auth verification material, internal service credential, needed webhook verification material if gateway handles input boundary
**Forbidden:** unrelated domain secrets, blanket environment secret bundle

### SC-013 — Core service secret erişimi

**Allowed:** service-specific DB credential, needed internal credential, service-owned provider secret if directly integrating
**Forbidden:** sibling service secret bundles without need-to-know basis

### SC-014 — Worker secret erişimi

**Allowed:** task-specific credentials only
**Forbidden:** broad app-surface secret bundle

### SC-015 — Data layer secret erişimi

**Binding Rule:** DB/Redis/object/search store credentials yalnız ilgili runtime/service plane tarafından kullanılır; frontend veya panel operatörüne verilmez.

---

## 7. Storefront ve panel config sınırları

### SC-020 — Storefront public config sınırlıdır

Storefront public runtime’da bulunabilecek örnekler:

* public site URL
* static asset base path
* non-sensitive feature flags
* client-safe analytics toggle

### SC-021 — Storefront client-side config truth/guard üretmez

**Binding Rule:** Guest/auth UI flag’i veya experiment toggle, permission truth veya price/stock truth yerine geçmez. fileciteturn15file0turn15file1

### SC-022 — Panel client-side config elevated privilege yerine geçmez

**Binding Rule:** Panel UI’da bir butonun görünmesi, final permission anlamına gelmez; final guard gateway/internal owner katmanında çalışır. fileciteturn15file1

### SC-023 — Elevated admin action secret’i browser’a taşınmaz

**Binding Rule:** Suspend, payout release, finance correction, override ve benzeri kritik aksiyonlar browser secret’ı ile değil, server-side protected action modeliyle yürür. fileciteturn15file1

---

## 8. Gateway / BFF secret ve config politikası

### SC-030 — BFF minimal trust broker secret modeliyle çalışır

**Binding Rule:** BFF gerekli auth verification, internal routing credential ve gerekiyorsa webhook signature verify secret’ı taşır; stock/price/finance truth owner secret’larının tamamını toplu biçimde taşımaz.

### SC-031 — Gateway config service discovery amaçlı olabilir

**Allowed Examples:**

* internal service endpoint refs
* timeout/retry policies
* degradation flags
* route-level feature toggles

### SC-032 — Gateway config business truth yerine geçmez

**Binding Rule:** Price corridor, stock sellable quantity, payout payable truth, moderation result veya lifecycle restriction config dosyasıyla yönetilmez; owner truth alanında yaşar. fileciteturn15file1turn15file2turn15file3

---

## 9. Core service secret politikası

### SC-040 — Auth/access service secret modeli

Gerekli secret örnekleri:

* session signing/key material
* identity token verification material
* auth-related DB credential

### SC-041 — Commerce service secret modeli

Gerekli secret örnekleri:

* commerce DB credential
* internal service credential
* gerekiyorsa queue/worker credential

### SC-042 — Stock service secret modeli

Gerekli secret örnekleri:

* stock DB credential
* reservation helper credential

### SC-043 — Pricing service secret modeli

Gerekli secret örnekleri:

* pricing DB credential
* internal service credential

### SC-044 — Finance / payout service secret modeli

Gerekli secret örnekleri:

* finance DB credential
* payout provider credential if direct
* reconciliation/internal job credential
* encryption material if needed

### SC-045 — Moderation / risk / lifecycle service secret modeli

**Binding Rule:** Bu servisler kendi DB/internal credential setlerini taşır; panel operator secret’ı ile çalışmaz.

Net kural:

* Aynı runtime pod/container çok farklı domain secret ailelerini taşımaya zorlanmamalıdır
* Service identity ve secret scope domain boundary ile uyumlu olmalıdır

---

## 10. Search ve media secret/config politikası

### SC-050 — Search/indexing secret modeli

Gerekli secret örnekleri:

* search store credential
* indexing pipeline credential
* internal service credential

### SC-051 — Search config modeli

Örnek config:

* index alias names
* refresh policy
* reindex window
* facet generation policy

### SC-052 — Media/asset secret modeli

Gerekli secret örnekleri:

* object storage credential
* upload signing material
* processing worker credential
* CDN invalidation credential if needed

### SC-053 — Media config modeli

Örnek config:

* image/video size limits
* derivative policy
* hot/warm/cold storage policy
* moderation-before-visibility policy

### SC-054 — Media original access public’e açılmaz

**Binding Rule:** Public surface optimize edilmiş variant alabilir; raw object storage credential veya unrestricted original path client’a verilmez. fileciteturn15file4

---

## 11. Callback ve webhook secret politikası

### SC-060 — Public callback entry secret gerektirir

**Binding Rule:** Payment, shipment, notification provider callback’leri signature verification veya eşdeğer provider-auth mekanizmasıyla doğrulanır.

### SC-061 — Callback secret gateway/input boundary’de kullanılır

**Binding Rule:** Public callback first-touch katmanı imza doğrulaması yapabilir; fakat final business outcome owner service + reconciliation path’te resmileşir.

### SC-062 — Callback secret staging/prod arasında karışmaz

**Binding Rule:** Sandbox ve live webhook secrets ayrı tutulur; ortak secret reuse yapılmaz.

---

## 12. Staging secret/config politikası

### SC-070 — Staging secret’ları production’dan tamamen ayrıdır

**Binding Rule:** Aynı env var adı olsa bile değerler ve erişim yolları ayrıdır.

### SC-071 — Staging provider credential’ı sandbox/test sınıfında olur

**Binding Rule:** Payment/shipment/notification/storage gibi dış entegrasyonlarda staging mümkünse test credential kullanır.

### SC-072 — Staging debug config production davranışı sayılmaz

**Binding Rule:** Verbose log, permissive timeout, mock endpoint, relaxed flags staging’de olabilir; prod standardı olarak kabul edilmez.

### SC-073 — Staging data mask/isolation disiplini gerekir

**Binding Rule:** Production kullanıcı verisi staging’e kopyalanıyorsa ayrı güvenlik ve maskeleme politikası gerekir; aksi halde gerçek prod data taşıma varsayılmaz.

---

## 13. Production secret/config politikası

### SC-080 — Production secret en yüksek koruma sınıfındadır

**Binding Rule:** Prod signing secret, DB credential, provider token ve encryption material yalnız production runtime ve yetkili operasyon akışıyla erişilir.

### SC-081 — Production config drift görünür olmalıdır

**Binding Rule:** Timeout, route policy, retry, feature flag ve edge behavior farkları change governance altında izlenir.

### SC-082 — Production’da bypass secret yoktur

**Binding Rule:** Hidden admin backdoor token, debug override key, mock shortcut secret veya shared emergency root secret kalıcı tasarım parçası değildir.

### SC-083 — Production elevated action config high-governance altındadır

**Binding Rule:** Payout release thresholds, override toggles, emergency freeze flags ve kritik action guard config’leri change control altında tutulur.

---

## 14. Rotation ve revocation politikası

### SC-090 — Rotation zorunlu secret aileleri

İlk fazda özellikle rotation planı olması gerekenler:

* auth/session signing secrets
* payment/shipment provider secrets
* DB credentials
* internal service credentials
* webhook signature secrets
* storage credentials

### SC-091 — Rotation rollout kontrollü yapılır

**Binding Rule:** Secret rotation kullanıcı oturumlarını, callback doğrulamasını veya provider entegrasyonlarını kör bozmayacak biçimde planlanır.

### SC-092 — Revocation ayrı first-class davranıştır

**Binding Rule:** Sızıntı, yanlış erişim veya actor değişimi durumunda secret revoke edilebilir ve bu operasyon ayrı loglanır.

### SC-093 — Rotated secret eski haliyle süresiz yaşamaz

**Binding Rule:** Geçiş penceresi olabilir; ama eski secret’ın ne zaman devreden çıkacağı açık olmalıdır.

---

## 15. Audit ve access visibility politikası

### SC-100 — Secret access event’leri denetlenebilir olmalıdır

**Binding Rule:** Hangi servis kimlikleri, hangi secret sınıfına ne zaman erişti denetlenebilir olmalıdır.

### SC-101 — Operatör secret value görmez

**Binding Rule:** Panel kullanıcıları ve çoğu operasyonel rol secret tüketen aksiyon başlatabilir; ancak secret değeri çıplak olarak gösterilmez.

### SC-102 — Audit log secret value içermez

**Binding Rule:** Audit, secret usage context’ini taşır; secret literal’ını taşımaz.

### SC-103 — Log sanitization zorunludur

**Binding Rule:** Error log, debug log, callback payload ve trace attribute’larında credential/token sızıntısı engellenmelidir.

---

## 16. Elevated action ve admin config politikası

### SC-110 — Elevated action server-side policy ile çalışır

**Binding Rule:** Suspend, restrict, payout release, finance correction, promotion override ve benzeri kritik aksiyonlar client-side config ile değil, server-side policy + permission + approval zinciriyle yürür.

### SC-111 — Admin toggle truth mutate etmez

**Binding Rule:** Admin panelde bir toggle görmek veya değiştirmek, owner domain truth’unun doğrudan client tarafından değiştiği anlamına gelmez. fileciteturn15file1

### SC-112 — High-governance config ayrı korunur

Örnekler:

* payout release threshold
* emergency freeze flags
* moderation severity override policy
* critical campaign exception flags
* auth hard-block flags

Bu aileler change governance, audit ve restricted access ile korunur.

---

## 17. Yasak davranışlar

Aşağıdaki davranışlar bu politikaya göre yasaktır:

* secret’ı kaynak koda yazmak
* secret’ı frontend bundle’a gömmek
* staging secret’ını prod’da kullanmak
* tüm servislerin aynı master secret bundle’ı alması
* panel operatörüne DB credential göstermek
* callback secret’ı client-side verify modeline taşımak
* log/trace içine token, password, key yazmak
* feature flag ile owner truth’u geçersiz kılmaya çalışmak
* pricing/stock/finance truth’unu static config dosyasıyla yönetmek
* raw object storage erişimini public client’a açmak

---

## 18. Faz-1 minimum zorunlu secret/config omurgası

İlk fazda aşağıdaki omurga zorunlu kabul edilir:

1. secret vs config ayrımı
2. staging/prod isolation
3. least-privilege service secret dağıtımı
4. frontend’de privileged secret yok kuralı
5. provider callback signature verification
6. DB/Redis/object/search credential ayrımı
7. rotation/revocation planı
8. audit + access visibility
9. log sanitization
10. elevated action server-side governance

---

## 19. Faz-1 dışında bırakılan alanlar

* customer-managed HSM detayları
* per-secret hardware boundary modeli
* exact secret escrow prosedürleri
* exhaustive break-glass operasyon matrisi

---

## 20. Kısa sonuç

Bu politika ile aşağıdaki çekirdek kararlar sabitlenmiş olur:

* Secret ve config farklı güven sınıflarıdır
* Public app layer privileged secret taşımaz
* Staging ve production secret/config setleri kesin ayrılır
* Servisler yalnız ihtiyaç duydukları secret sınıfını alır
* Callback/webhook güvenliği server-side secret verify ile çalışır
* Rotation, revocation ve access audit secret yönetiminin parçasıdır
* Panel ve admin yüzeyleri secret consumer olabilir; secret holder/gösterici değildir
* Pricing, stock, finance ve benzeri truth alanları config dosyasıyla yönetilen approximation katmanına indirgenmez

Bu dosya, Aşama 13’ün bağlayıcı secrets ve runtime configuration güvenlik politikasıdır.
