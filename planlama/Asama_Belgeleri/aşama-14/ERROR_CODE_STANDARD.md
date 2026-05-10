# ERROR_CODE_STANDARD

## 1. Amaç

Bu dosya, platform genelinde kullanılan hata kodu dilini tek doğrulu, uygulanabilir ve çakışmasız hale getirir.

Bu dosyanın amacı:

* hata kodlarını rastgele string üretiminden çıkarmak
* transport error, domain error, permission/guard error, state transition error, idempotency error ve finance error ailelerini ayırmak
* API, panel, internal service, worker ve audit görünürlüğünde aynı hata dilini kurmak
* kullanıcıya gösterilen hata, operatöre gösterilen hata ve sistem logu arasında kontrollü ilişki kurmaktır

Net kural:

* Hata mesajı ile hata kodu aynı şey değildir
* Aynı problem farklı endpoint’lerde farklı hata kodlarıyla dönmez
* UI string’i error truth yerine geçmez
* Hata kodu domain owner sınırını ve failure type’ı görünür kılmalıdır
* Kritik failure alanlarında “unknown_error” tembelliği kabul edilmez

---

## 2. Kapsam

Bu standart ilk fazda aşağıdaki hata ailelerini kapsar:

1. transport / request error
2. auth / permission / guard error
3. ownership / scope error
4. eligibility error
5. state machine / transition error
6. idempotency / duplicate error
7. contract / validation error
8. search / media / processing error
9. commerce / stock / pricing error
10. payment / finance / payout error
11. moderation / risk / lifecycle error
12. internal/system error

Bu dosya aşağıdaki alanları exact localization seviyesinde açmaz:

* tüm kullanıcı-facing Türkçe metinler
* tüm panel operator açıklama metinleri
* tüm HTTP mapping tablosunun provider-bazlı varyantları

---

## 3. Temel ilkeler

### EC-001 — Kod sabit, mesaj değişebilir

**Binding Rule:** Error code makine-okunur ve sabittir; kullanıcıya veya operatöre gösterilen açıklama dili bağlama göre değişebilir.

### EC-002 — Tek problem tek canonical error family taşır

**Binding Rule:** Aynı problem alanı farklı modüllerde farklı string family ile adlandırılmaz.

### EC-003 — Transport ve domain error ayrıdır

**Binding Rule:** `bad_request`, `forbidden`, `not_found` gibi transport sınıfı hatalar ile `insufficient_stock`, `invalid_transition`, `eligibility_not_satisfied` gibi domain hatalar aynı family’de ezilmez.

### EC-004 — Error code owner sınırını bozmaz

**Binding Rule:** BFF veya panel, owner service error’unu çarpıtıp yeni truth icat etmez; gerekirse controlled mapping yapar.

### EC-005 — Permission ve eligibility ayrı hata sınıflarıdır

**Binding Rule:** Login eksikliği, scope eksikliği, ownership ihlali ve domain eligibility eksikliği aynı hata koduna sıkıştırılmaz. fileciteturn17file1turn17file0

### EC-006 — Unknown-result ile failure aynı şey değildir

**Binding Rule:** Payment, refund, payout gibi alanlarda belirsiz sonuç ayrı error/result sınıfı olarak ele alınır; failure’a zorlanmaz.

### EC-007 — Duplicate-safe davranış görünür olmalıdır

**Binding Rule:** İkinci kez gelen kritik write için duplicate/idempotency sonucu görünür error/result family ile ifade edilir; sessiz davranış kabul edilmez. fileciteturn17file2

---

## 4. Error code format standardı

Önerilen canonical format:

```text
<DOMAIN>_<CATEGORY>_<DETAIL>
```

Örnekler:

* `AUTH_LOGIN_REQUIRED`
* `ACCESS_SCOPE_FORBIDDEN`
* `ORDER_INVALID_TRANSITION`
* `CHECKOUT_ELIGIBILITY_NOT_SATISFIED`
* `PAYMENT_UNKNOWN_RESULT`
* `PAYOUT_HOLD_ACTIVE`
* `MEDIA_VARIANT_NOT_READY`

Net kural:

* Kodlar büyük harf + underscore standardı taşır
* Noktalı, boşluklu, rastgele kebab/camel karışık error code üretilmez
* Detail alanı kısa ama açıklayıcı olur

---

## 5. Error response iskeleti

Minimum response alanları:

* `code`
* `message`
* `category`
* `retryable` gerekiyorsa
* `details` gerekiyorsa
* `correlation_id` mümkünse

Örnek mantık:

```json
{
  "code": "CHECKOUT_ELIGIBILITY_NOT_SATISFIED",
  "message": "Checkout başlatılamadı.",
  "category": "eligibility",
  "retryable": false
}
```

Net kural:

* `message` değişebilir ama `code` değişmez
* `details` debug çöplüğü olmaz
* Secret, token, SQL hata metni veya raw stack response içine verilmez

---

## 6. Error category standardı

Canonical category family:

* `transport`
* `auth`
* `permission`
* `ownership`
* `eligibility`
* `validation`
* `contract`
* `state_transition`
* `idempotency`
* `business_rule`
* `processing`
* `finance`
* `moderation`
* `risk`
* `system`
* `unknown_result`

Net kural:

* Category, code’un yerine geçmez
* Aynı code farklı category ile dönmez

---

## 7. Transport / request error ailesi

Örnek canonical kodlar:

* `REQUEST_BAD_PAYLOAD`
* `REQUEST_MISSING_FIELD`
* `REQUEST_INVALID_QUERY`
* `RESOURCE_NOT_FOUND`
* `METHOD_NOT_ALLOWED`
* `UNSUPPORTED_MEDIA_TYPE`

Net kural:

* Transport error, domain owner sonucu gibi adlandırılmaz
* `bad_request` ile `invalid_transition` aynı şey değildir

---

## 8. Auth / permission / guard error ailesi

### 8.1 Auth

* `AUTH_LOGIN_REQUIRED`
* `AUTH_SESSION_INVALID`
* `AUTH_SESSION_EXPIRED`
* `AUTH_ACCOUNT_SUSPENDED`

### 8.2 Permission / scope

* `ACCESS_SCOPE_FORBIDDEN`
* `ACCESS_ROLE_FORBIDDEN`
* `ACCESS_ACTION_NOT_ALLOWED`
* `ACCESS_PANEL_PERMISSION_DENIED`

### 8.3 Ownership

* `OWNERSHIP_MISMATCH`
* `OWN_RESOURCE_REQUIRED`

### 8.4 Eligibility

* `ELIGIBILITY_NOT_SATISFIED`
* `REVIEW_ELIGIBILITY_NOT_SATISFIED`
* `UGC_ELIGIBILITY_NOT_SATISFIED`
* `RETURN_ELIGIBILITY_NOT_SATISFIED`

Net kural:

* Login eksikliği `AUTH_LOGIN_REQUIRED`
* Scope yetersizliği `ACCESS_*`
* Kaynak sahipliği ihlali `OWNERSHIP_*`
* Satın alma/teslimat/tabanlı hak eksikliği `*_ELIGIBILITY_*`

Bu ayrım bağlayıcıdır. fileciteturn17file0turn17file1

---

## 9. Validation / contract error ailesi

Örnek canonical kodlar:

* `VALIDATION_INVALID_FIELD`
* `VALIDATION_VALUE_OUT_OF_RANGE`
* `VALIDATION_REQUIRED_FIELD_MISSING`
* `CONTRACT_REQUEST_SCHEMA_INVALID`
* `CONTRACT_RESPONSE_SCHEMA_INVALID`
* `CONTRACT_VERSION_UNSUPPORTED`

Net kural:

* Input validation ile contract drift aynı family değildir
* Panel form hatası ile internal schema uyuşmazlığı aynı code’a indirgenmez

---

## 10. State machine / transition error ailesi

Örnek canonical kodlar:

* `CHECKOUT_INVALID_TRANSITION`
* `ORDER_INVALID_TRANSITION`
* `SHIPMENT_INVALID_TRANSITION`
* `RETURN_INVALID_TRANSITION`
* `PAYOUT_INVALID_TRANSITION`
* `LIFECYCLE_INVALID_TRANSITION`

Net kural:

* Geçiş hatası generic `BAD_REQUEST` ile geçiştirilmez
* State machine owner’ı hangi domain ise code family de ona göre başlar

Bu alan test stratejisiyle de doğrudan ilişkilidir. fileciteturn17file2

---

## 11. Idempotency / duplicate error ailesi

Örnek canonical kodlar:

* `IDEMPOTENCY_KEY_REQUIRED`
* `IDEMPOTENCY_KEY_INVALID`
* `DUPLICATE_REQUEST_IGNORED`
* `ORDER_DUPLICATE_CREATE_BLOCKED`
* `PAYMENT_DUPLICATE_CALLBACK_IGNORED`
* `PAYOUT_DUPLICATE_RESULT_IGNORED`

Net kural:

* Duplicate her zaman fatal error olmak zorunda değildir; ama görünür sonuç family’si olmalıdır
* Idempotency eksikliği ile duplicate result aynı code değildir

---

## 12. Commerce / stock / pricing error ailesi

Örnek canonical kodlar:

* `CART_ITEM_NOT_FOUND`
* `CHECKOUT_EXPIRED`
* `CHECKOUT_REVALIDATION_FAILED`
* `STOCK_INSUFFICIENT`
* `STOCK_RESERVATION_FAILED`
* `PRICE_CONFLICT_DETECTED`
* `PRICE_NOT_ACTIVE`
* `COUPON_NOT_APPLICABLE`
* `COUPON_USAGE_LIMIT_REACHED`

Net kural:

* Stock ve pricing hataları generic checkout error altında ezilmez
* Coupon applicability ile coupon sponsor correction aynı family değildir

---

## 13. Payment / finance / payout error ailesi

Örnek canonical kodlar:

* `PAYMENT_INITIATION_FAILED`
* `PAYMENT_CALLBACK_INVALID`
* `PAYMENT_UNKNOWN_RESULT`
* `PAYMENT_RECONCILIATION_REQUIRED`
* `REFUND_EXECUTION_FAILED`
* `FINANCE_CORRECTION_REQUIRED`
* `SETTLEMENT_ADJUSTMENT_REQUIRED`
* `PAYOUT_HOLD_ACTIVE`
* `PAYOUT_RELEASE_NOT_ALLOWED`
* `PAYOUT_PROVIDER_FAILURE`

Net kural:

* `PAYMENT_UNKNOWN_RESULT` failure yerine geçmez
* Refund request ile refund completed aynı error family’ye düşmez
* Payable ile paid_out karışmaz; payout release denial generic finance error olmaz

---

## 14. Moderation / risk / lifecycle error ailesi

Örnek canonical kodlar:

* `MODERATION_REVIEW_REQUIRED`
* `MODERATION_ACTION_NOT_ALLOWED`
* `CONTENT_VISIBILITY_RESTRICTED`
* `RISK_HOLD_ACTIVE`
* `RISK_RELEASE_REQUIRES_REVIEW`
* `CREATOR_SCOPE_RESTRICTED`
* `SUPPLIER_SCOPE_RESTRICTED`
* `ACCOUNT_ACTION_REQUIRES_APPROVAL`

Net kural:

* Moderation kararı ile risk hold aynı code’a indirgenmez
* Lifecycle restriction generic `FORBIDDEN` ile geçiştirilmez; domain görünür kalmalıdır

---

## 15. Media / search / processing error ailesi

Örnek canonical kodlar:

* `MEDIA_VALIDATION_FAILED`
* `MEDIA_PROCESSING_FAILED`
* `MEDIA_VARIANT_NOT_READY`
* `MEDIA_MODERATION_PENDING`
* `SEARCH_INDEX_UNAVAILABLE`
* `SEARCH_DEGRADED_RESULT`
* `SEARCH_NO_RESULT`
* `INDEX_REFRESH_FAILED`

Net kural:

* `SEARCH_NO_RESULT` hata ile degraded sonucu karıştırılmaz
* Media “pending review” ile processing failure aynı code family değildir

---

## 16. Internal/system error ailesi

Örnek canonical kodlar:

* `INTERNAL_SERVICE_UNAVAILABLE`
* `INTERNAL_DEPENDENCY_TIMEOUT`
* `INTERNAL_CONFIGURATION_INVALID`
* `INTERNAL_UNEXPECTED_ERROR`
* `AUDIT_WRITE_FAILED`

Net kural:

* Kritik internal error family’si mümküm olduğunca belirgin olur
* Her şeyi `INTERNAL_UNEXPECTED_ERROR` ile kapatmak kabul edilmez

---

## 17. HTTP / transport mapping ilkesi

Genel eşleme mantığı:

* `AUTH_LOGIN_REQUIRED` → 401
* `ACCESS_*`, `OWNERSHIP_*` → 403
* `RESOURCE_NOT_FOUND` → 404
* `VALIDATION_*`, `CONTRACT_*`, `*_INVALID_*` → 400/422 bağlama göre
* `*_UNKNOWN_RESULT`, `*_RECONCILIATION_REQUIRED` → 409/202/iş akışı bağlamı uygun mapping
* `INTERNAL_*` → 500/503 bağlama göre

Net kural:

* HTTP status tek başına hata semantiğini taşımaz
* Aynı code farklı HTTP status ile dönmemelidir, istisna varsa açık gerekçe gerekir

---

## 18. UI / panel / operator görünürlüğü

### EC-050 — Kullanıcı-facing mesaj sade olabilir

Örnek:

* code: `STOCK_INSUFFICIENT`
* message: `Ürün stoğu yeterli değil.`

### EC-051 — Panel/operator görünürlüğü daha açıklayıcı olabilir

Örnek:

* code: `PAYOUT_RELEASE_NOT_ALLOWED`
* operator message: `Risk hold aktif olduğu için payout release reddedildi.`

### EC-052 — UI code’u üretmez, taşır

**Binding Rule:** Frontend/panel error code icat etmez; owner veya gateway’den gelen canonical family’yi controlled biçimde yansıtır.

---

## 19. Audit ve log ilişkisi

### EC-060 — Audit error code taşıyabilir ama stack taşımaz

**Binding Rule:** Audit kaydı action/result context ve error code içerebilir; raw exception dump taşımaz.

### EC-061 — Log ve trace detaylı olabilir

**Binding Rule:** Internal log daha teknik olabilir; ama secret/token/credential sızıntısı yapmaz.

### EC-062 — Correlation zorunludur

**Binding Rule:** Kritik error ailelerinde correlation_id veya eşdeğer izlenebilirlik alanı bulunmalıdır.

---

## 20. Error code üretim kuralları

Yeni hata kodu açılırken şu sorular cevaplanmalıdır:

1. Bu hata hangi domain owner alanına ait?
2. Bu hata transport mı domain mi?
3. Permission mi eligibility mi?
4. Duplicate mi invalid request mi?
5. Failure mı unknown-result mı?
6. Zaten mevcut canonical family içinde karşılığı var mı?

Net kural:

* Yeni code açmadan önce mevcut family taranır
* Aynı problem için ikinci isim ailesi açılmaz

---

## 21. Yasak davranışlar

Aşağıdaki davranışlar bu standarda göre yasaktır:

* string literal error code’u rastgele çoğaltmak
* aynı problem için farklı modülde farklı code kullanmak
* permission ve eligibility hatasını aynı code’a indirgemek
* unknown-result’ı generic failure diye dönmek
* duplicate-safe sonucu sessizce yutmak
* UI’da owner’dan bağımsız yeni hata code üretmek
* raw provider/SQL/stack metnini kullanıcıya dökmek
* her şeyi `UNKNOWN_ERROR` ile kapatmak

---

## 22. Faz-1 minimum error omurgası

İlk fazda aşağıdaki error aileleri zorunlu kabul edilir:

1. auth / permission / ownership / eligibility
2. validation / contract
3. state transition
4. idempotency / duplicate
5. checkout / stock / pricing / coupon
6. payment / refund / finance correction / payout
7. moderation / risk / lifecycle
8. media / search / processing
9. internal/service dependency

---

## 23. Faz-1 dışında bırakılan alanlar

* tüm localization metin katalogları
* exact UI icon/color mapping
* exact provider-by-provider error normalization tablosu
* exhaustive recovery suggestion catalog

---

## 24. Kısa sonuç

Bu standart ile aşağıdaki çekirdek kararlar sabitlenmiş olur:

* Error code ve error message farklı katmanlardır
* Transport, domain, permission, eligibility, state transition ve finance error aileleri ayrıdır
* Unknown-result ve duplicate davranışları görünür canonical family ile ifade edilir
* UI ve panel canonical error code üretmez; owner/gateway family’yi taşır
* Aynı problem için tek code ailesi korunur
* Kritik alanlarda generic `UNKNOWN_ERROR` tembelliği kabul edilmez

Bu dosya, Aşama 14’ün bağlayıcı hata dili ve error code standardıdır.
