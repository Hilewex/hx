# API_ERROR_CATALOG

Bu dosya, platformun public, app, panel ve internal API yüzeylerinde kullanılacak ortak hata katalogunu tanımlar.

Amaç:
- istemci ve servislerin hata davranışını öngörülebilir hale getirmek
- HTTP status ile domain error code ayrımını netleştirmek
- auth / scope / permission / guard / state conflict / idempotency / degraded dependency hatalarını karıştırmamak
- uygulama, panel ve internal katmanda aynı hata dilini kurmak

Net kural:
- HTTP status genel kategori verir
- `code` alanı ise domain-semantik hatayı verir
- aynı durum farklı endpoint’lerde farklı metinle değil, aynı kanonik code ile dönmelidir
- kritik mutation yüzeylerinde `request_id` ve mümkünse `command_id` izlenebilir olmalıdır

---

## 1. STANDART HATA ZARFI

Tüm API yüzeylerinde standart hata gövdesi:

```json
{
  "code": "CHECKOUT_EXPIRED",
  "message": "Checkout is expired.",
  "details": {},
  "request_id": "req_123",
  "command_id": "cmd_456"
}


Alanlar
code: zorunlu, kanonik hata kodu
message: zorunlu, istemciye gösterilebilir veya log için okunabilir mesaj
details: opsiyonel, yapılandırılmış alan
request_id: zorunluya yakın, izleme için önerilir
command_id: command kabul edilmiş veya command üzerinden hata üretilmiş akışlarda opsiyonel

Net kural:

istemci akışı message yerine öncelikle code üstünden davranmalıdır
message yerelleştirilebilir, code değişmemelidir
2. HTTP STATUS KULLANIM HARITASI
400 Bad Request

İstek yapısı, parametre veya payload biçimi hatalıysa.

Örnek:

eksik zorunlu alan
yanlış enum değeri
bozuk query formatı
401 Unauthorized

Kimlik doğrulama yoksa veya geçersizse.

403 Forbidden

Kimlik var ama:

scope yetmiyorsa
permission yetmiyorsa
actor bu kaynağa erişemiyorsa
panel/internal guard reddediyorsa
404 Not Found

Kaynak bulunamadıysa veya istemciye görünmemesi gereken kaynak yokmuş gibi davranılacaksa.

409 Conflict

State çatışması, duplicate command, idempotency çakışması veya geçersiz transition varsa.

410 Gone

Geçici ama artık kullanılamaz kaynaklar.
Özellikle:

expired checkout
expired lock / reservation
artık erişilemeyen temporary flow artifacts
422 Unprocessable Entity

Payload biçim olarak doğru ama domain kuralı nedeniyle işlenemiyorsa.

Örnek:

stok yetersiz
teslim edilmemiş ürün için iade denemesi
payout için uygun olmayan settlement line
423 Locked

İsteğe bağlı kullanım:
Kaynak yönetimsel olarak hold/restrict altında ise kullanılabilir.
İlk fazda zorunlu değildir; 409 veya 403 ile de yönetilebilir.

429 Too Many Requests

Rate limit veya abuse control yüzeyi gerekiyorsa.

503 Service Unavailable

Dependency degraded/unavailable ise veya dürüst degraded cevap dönülmesi gerekiyorsa.

3. HATA SINIFLARI
3.1 İstek / söz dizimi hataları
INVALID_REQUEST
INVALID_QUERY_PARAMETER
INVALID_PATH_PARAMETER
INVALID_PAYLOAD
MISSING_REQUIRED_FIELD
INVALID_ENUM_VALUE
3.2 Kimlik / erişim hataları
AUTH_REQUIRED
AUTH_INVALID
AUTH_EXPIRED
SCOPE_REQUIRED
PERMISSION_REQUIRED
ACCESS_DENIED
ACTOR_NOT_ALLOWED
3.3 Kaynak bulunamama / görünürlük hataları
RESOURCE_NOT_FOUND
PRODUCT_NOT_FOUND
ORDER_NOT_FOUND
CHECKOUT_NOT_FOUND
STOREFRONT_NOT_FOUND
MODERATION_ITEM_NOT_FOUND
PAYOUT_BATCH_NOT_FOUND
3.4 State / transition / conflict hataları
STATE_CONFLICT
INVALID_TRANSITION
CHECKOUT_EXPIRED
CHECKOUT_NOT_READY_FOR_PAYMENT
PAYMENT_ALREADY_CAPTURED
ORDER_ALREADY_CREATED
SHIPMENT_NOT_READY
RETURN_WINDOW_CLOSED
RETURN_NOT_ALLOWED
PAYOUT_ALREADY_PROCESSED
SETTLEMENT_ALREADY_FINALIZED
TICKET_ALREADY_CLOSED
TICKET_ASSIGNMENT_CONFLICT
MODERATION_ACTION_NOT_ALLOWED
PRICE_LOCK_EXPIRED
PRICE_LOCK_ALREADY_CONSUMED
STOCK_RESERVATION_EXPIRED
STOCK_RESERVATION_ALREADY_CONSUMED
3.5 Idempotency / duplicate hataları
IDEMPOTENCY_KEY_REQUIRED
IDEMPOTENCY_CONFLICT
DUPLICATE_COMMAND
DUPLICATE_PROVIDER_CALLBACK
DUPLICATE_RESERVATION_CONSUME
3.6 Domain validation hataları
STOCK_INSUFFICIENT
PRICE_CHANGED
COUPON_INVALID
COUPON_NOT_APPLICABLE
CAMPAIGN_NOT_APPLICABLE
ADDRESS_INVALID
PAYMENT_METHOD_NOT_ALLOWED
DELIVERY_NOT_COMPLETED
VERIFIED_PURCHASE_NOT_ACTIVE
REVIEW_ELIGIBILITY_NOT_ACTIVE
STORY_ELIGIBILITY_NOT_ACTIVE
REFUND_NOT_ALLOWED
PAYOUT_NOT_ELIGIBLE
3.7 Dependency / degraded hataları
DEPENDENCY_UNAVAILABLE
DEPENDENCY_TIMEOUT
DEPENDENCY_DEGRADED
UPSTREAM_RESPONSE_INVALID
READ_MODEL_UNAVAILABLE
3.8 Internal / unexpected hatalar
INTERNAL_ERROR
COMMAND_ACCEPTED_BUT_STATUS_UNKNOWN
EVENT_PROCESSING_FAILED
AUDIT_WRITE_FAILED
4. YUZEY BAZLI HATA KURALLARI
4.1 Public API hata kuralları

Public yüzeyde:

auth hataları çoğunlukla olmaz
degraded dependency dürüst gösterilmelidir
private kaynak var/yok ayrımı sızdırılmamalıdır

Önerilen ana kodlar:

INVALID_REQUEST
PRODUCT_NOT_FOUND
STOREFRONT_NOT_FOUND
RESOURCE_NOT_FOUND
DEPENDENCY_DEGRADED
READ_MODEL_UNAVAILABLE

Örnek:

/public/products/{productId} → 404 PRODUCT_NOT_FOUND
/public/home dependency çökmüşse → 503 DEPENDENCY_DEGRADED
4.2 App API hata kuralları

App yüzeyinde:

auth ve guest ayrımı net olmalıdır
checkout/payment/order akışında state conflict ile domain validation ayrılmalıdır
interaction uçlarında duplicate/idem safe davranış olmalıdır

Önerilen ana kodlar:

AUTH_REQUIRED
ACCESS_DENIED
CHECKOUT_EXPIRED
CHECKOUT_NOT_READY_FOR_PAYMENT
STOCK_INSUFFICIENT
PRICE_CHANGED
COUPON_NOT_APPLICABLE
RETURN_NOT_ALLOWED
DELIVERY_NOT_COMPLETED
VERIFIED_PURCHASE_NOT_ACTIVE
REVIEW_ELIGIBILITY_NOT_ACTIVE
STORY_ELIGIBILITY_NOT_ACTIVE

Örnek:

checkout review sırasında stok biterse → 422 STOCK_INSUFFICIENT
checkout var ama artık expired ise → 410 CHECKOUT_EXPIRED
teslim edilmemiş satır için return istenirse → 422 DELIVERY_NOT_COMPLETED
uygun olmayan ürün için yorum açılmak istenirse → 422 REVIEW_ELIGIBILITY_NOT_ACTIVE
4.3 Panel API hata kuralları

Panel yüzeyinde auth yeterli değildir.
Ayrıca:

scope
permission
actor-role
guard
reason code
state transition
kontrol edilir.

Önerilen ana kodlar:

AUTH_REQUIRED
SCOPE_REQUIRED
PERMISSION_REQUIRED
ACTOR_NOT_ALLOWED
ACCESS_DENIED
INVALID_TRANSITION
STATE_CONFLICT
REASON_CODE_REQUIRED
RESOURCE_NOT_FOUND

Örnek:

moderator finance action çağırıyorsa → 403 PERMISSION_REQUIRED
supplier lifecycle state’i panelden direct değiştirilmeye çalışılıyorsa → 403 ACTOR_NOT_ALLOWED
moderation item closed iken restore dışı karar verilmeye çalışılıyorsa → 409 INVALID_TRANSITION
audit zorunlu aksiyonda reason code yoksa → 400 REASON_CODE_REQUIRED
4.4 Internal API hata kuralları

Internal yüzeyde hata dili daha teknik olabilir ama kanonik code korunmalıdır.

Önerilen ana kodlar:

IDEMPOTENCY_CONFLICT
DUPLICATE_PROVIDER_CALLBACK
ORDER_ALREADY_CREATED
PAYMENT_ALREADY_CAPTURED
SETTLEMENT_ALREADY_FINALIZED
PAYOUT_NOT_ELIGIBLE
DEPENDENCY_TIMEOUT
UPSTREAM_RESPONSE_INVALID
EVENT_PROCESSING_FAILED

Örnek:

aynı payment callback ikinci kez işlenirse → 409 DUPLICATE_PROVIDER_CALLBACK
captured payment için ikinci order create gelirse → 409 ORDER_ALREADY_CREATED
payable olmayan settlement line ile payout batch istenirse → 422 PAYOUT_NOT_ELIGIBLE
5. KANONIK HATA KODLARI

Aşağıdaki liste ilk faz için önerilen kanonik çekirdek listedir.

5.1 Genel istek hataları
INVALID_REQUEST
HTTP: 400
Açıklama: Genel request yapısı geçersiz
INVALID_QUERY_PARAMETER
HTTP: 400
Açıklama: Query parametresi beklenen formatta değil
INVALID_PATH_PARAMETER
HTTP: 400
Açıklama: Path parametresi geçersiz
INVALID_PAYLOAD
HTTP: 400
Açıklama: JSON body formatı geçersiz
MISSING_REQUIRED_FIELD
HTTP: 400
Açıklama: Zorunlu alan eksik
INVALID_ENUM_VALUE
HTTP: 400
Açıklama: Enum alanı desteklenmeyen değer taşıyor
5.2 Auth / access hataları
AUTH_REQUIRED
HTTP: 401
Açıklama: Kimlik doğrulama gerekli
AUTH_INVALID
HTTP: 401
Açıklama: Token veya session geçersiz
AUTH_EXPIRED
HTTP: 401
Açıklama: Token veya session süresi dolmuş
SCOPE_REQUIRED
HTTP: 403
Açıklama: Gerekli scope yok (Örn: panel scope'u olmayan token ile panele girmeye çalışmak)
PERMISSION_REQUIRED
HTTP: 403
Açıklama: Gerekli permission yok (Örn: user_read izni olmadan kullanıcı listesi çekmek)
ACCESS_DENIED
HTTP: 403
Açıklama: Kaynak erişimi reddedildi
ACTOR_NOT_ALLOWED
HTTP: 403
Açıklama: Actor bu işlemi doğası gereği yapamaz (Örn: tedarikçinin finansal onayı vermeye çalışması)
5.3 Kaynak bulunamama hataları
RESOURCE_NOT_FOUND
HTTP: 404
Açıklama: Genel kaynak bulunamadı
PRODUCT_NOT_FOUND
HTTP: 404
Açıklama: Ürün bulunamadı
ORDER_NOT_FOUND
HTTP: 404
Açıklama: Sipariş bulunamadı
CHECKOUT_NOT_FOUND
HTTP: 404
Açıklama: Checkout bulunamadı
STOREFRONT_NOT_FOUND
HTTP: 404
Açıklama: Storefront bulunamadı
MODERATION_ITEM_NOT_FOUND
HTTP: 404
Açıklama: Moderation item bulunamadı
PAYOUT_BATCH_NOT_FOUND
HTTP: 404
Açıklama: Payout batch bulunamadı
5.4 Checkout / payment / order hataları
CHECKOUT_EXPIRED
HTTP: 410
Açıklama: Checkout süresi dolmuş
CHECKOUT_NOT_READY_FOR_PAYMENT
HTTP: 409
Açıklama: Checkout payment için hazır durumda değil
STOCK_INSUFFICIENT
HTTP: 422
Açıklama: Talep edilen stok yok veya yetmiyor
PRICE_CHANGED
HTTP: 422
Açıklama: Checkout review sonrası fiyat bağlamı değişmiş
COUPON_INVALID
HTTP: 422
Açıklama: Kupon geçersiz
COUPON_NOT_APPLICABLE
HTTP: 422
Açıklama: Kupon bu checkout/order için uygulanamaz
CAMPAIGN_NOT_APPLICABLE
HTTP: 422
Açıklama: Kampanya etkisi artık geçerli değil
PAYMENT_METHOD_NOT_ALLOWED
HTTP: 422
Açıklama: Bu actor/checkout/region için yöntem uygun değil
PAYMENT_ALREADY_CAPTURED
HTTP: 409
Açıklama: Payment zaten capture edilmiş
ORDER_ALREADY_CREATED
HTTP: 409
Açıklama: Payment/check-out bağlamı için sipariş zaten oluşturulmuş
5.5 Shipment / return / refund hataları
SHIPMENT_NOT_READY
HTTP: 409
Açıklama: Sipariş shipment oluşturma için hazır değil
DELIVERY_NOT_COMPLETED
HTTP: 422
Açıklama: Teslimat tamamlanmadığı için işlem yapılamaz
RETURN_WINDOW_CLOSED
HTTP: 422
Açıklama: İade süresi kapanmış
RETURN_NOT_ALLOWED
HTTP: 422
Açıklama: Bu line/order için iade açılamaz
REFUND_NOT_ALLOWED
HTTP: 422
Açıklama: Refund domain kuralı gereği başlatılamaz

5.5.1 Support / Moderation hataları
TICKET_ALREADY_CLOSED
HTTP: 409
Açıklama: Destek talebi zaten kapatılmış
TICKET_ASSIGNMENT_CONFLICT
HTTP: 409
Açıklama: Destek talebi başka bir temsilciye atanmış
MODERATION_ACTION_NOT_ALLOWED
HTTP: 422
Açıklama: Moderasyon kararı bu öğe için geçerli değil

5.5.2 Internal / Lock hataları
PRICE_LOCK_EXPIRED
HTTP: 410
Açıklama: Fiyat kilidi süresi dolmuş
PRICE_LOCK_ALREADY_CONSUMED
HTTP: 409
Açıklama: Fiyat kilidi zaten kullanılmış
STOCK_RESERVATION_EXPIRED
HTTP: 410
Açıklama: Stok rezervasyon süresi dolmuş
STOCK_RESERVATION_ALREADY_CONSUMED
HTTP: 409
Açıklama: Stok rezervasyonu zaten kullanılmış
5.6 Eligibility / trust / reward hataları
VERIFIED_PURCHASE_NOT_ACTIVE
HTTP: 422
Açıklama: Verified purchase bağı aktif değil
REVIEW_ELIGIBILITY_NOT_ACTIVE
HTTP: 422
Açıklama: Yorum hakkı aktif değil
STORY_ELIGIBILITY_NOT_ACTIVE
HTTP: 422
Açıklama: Story hakkı aktif değil
REWARD_IMPACT_NOT_APPLICABLE
HTTP: 422
Açıklama: Reward entitlement etkisi bu işlem için geçerli değil
5.7 Settlement / payout hataları
SETTLEMENT_ALREADY_FINALIZED
HTTP: 409
Açıklama: Settlement line final durumda, tekrar mutation beklenmez
PAYOUT_NOT_ELIGIBLE
HTTP: 422
Açıklama: Settlement line veya recipient payout için uygun değil
PAYOUT_ALREADY_PROCESSED
HTTP: 409
Açıklama: Batch veya item zaten işlenmiş
5.8 Idempotency / duplicate hataları
IDEMPOTENCY_KEY_REQUIRED
HTTP: 400
Açıklama: Endpoint idempotency anahtarı istiyor
IDEMPOTENCY_CONFLICT
HTTP: 409
Açıklama: Aynı anahtar farklı payload ile geldi
DUPLICATE_COMMAND
HTTP: 409
Açıklama: Aynı mutation command’i zaten işlenmiş
DUPLICATE_PROVIDER_CALLBACK
HTTP: 409
Açıklama: Provider callback tekrar geldi
DUPLICATE_RESERVATION_CONSUME
HTTP: 409
Açıklama: Aynı rezervasyon ikinci kez consume edilmeye çalışıldı
5.9 Dependency / degraded hataları
DEPENDENCY_UNAVAILABLE
HTTP: 503
Açıklama: Gerekli dependency erişilemez durumda
DEPENDENCY_TIMEOUT
HTTP: 503
Açıklama: Dependency zaman aşımına düştü
DEPENDENCY_DEGRADED
HTTP: 503
Açıklama: Dependency kısmi / dürüst degraded modda
UPSTREAM_RESPONSE_INVALID
HTTP: 503
Açıklama: Upstream beklenen sözleşmeye uymayan cevap verdi
READ_MODEL_UNAVAILABLE
HTTP: 503
Açıklama: Projection/read model geçici olarak okunamıyor
5.10 Internal / unexpected hataları
INTERNAL_ERROR
HTTP: 500
Açıklama: Beklenmeyen sistem hatası
COMMAND_ACCEPTED_BUT_STATUS_UNKNOWN
HTTP: 500 veya 503
Açıklama: Command kabul edilmiş olabilir ama nihai durum doğrulanamadı
EVENT_PROCESSING_FAILED
HTTP: 500 veya 503
Açıklama: Event işleme başarısız
AUDIT_WRITE_FAILED
HTTP: 500 veya 503
Açıklama: Audit kaydı güvenli biçimde yazılamadı
6. IDENTITY, SCOPE VE GUARD AYRIMI

Bu ayrım özellikle panel/internal API’de zorunludur:

401 AUTH_REQUIRED

Actor yok veya token geçersiz.

403 SCOPE_REQUIRED

Actor var ama bu yüzeye uygun scope yok.

403 PERMISSION_REQUIRED

Scope var ama alt permission yok.

403 ACTOR_NOT_ALLOWED

Actor tipi gereği işlem yapamaz.
Örnek:

supplier finance payout approve yapamaz
moderator supplier lifecycle kararı veremez
409 INVALID_TRANSITION

Actor yetkili ama state geçişi şu an mümkün değil.

Bu ayrım istemci davranışı için kritiktir.

7. IDEMPOTENCY KURALI

Aşağıdaki uçlarda varsayılan olarak idempotency beklenmelidir:

checkout review
payment create/start
cancel request create
return request create
panel protected action uçları
internal create/update command uçları
provider callback ingestion
payout / refund / settlement adjustment command uçları

Eksikse:

400 IDEMPOTENCY_KEY_REQUIRED

Aynı anahtar farklı içerikle geldiyse:

409 IDEMPOTENCY_CONFLICT

Aynı işlem zaten işlendiyse:

409 DUPLICATE_COMMAND
8. DEGRADED DAVRANIS KURALI

Public ve read ağırlıklı uçlarda bazı durumlarda:

tamamen hata vermek yerine
kısmi veri + dürüst degraded alanı dönmek mümkündür

Ama dependency cevap veremiyorsa veya projection güvenilmezse:

503 DEPENDENCY_DEGRADED
503 READ_MODEL_UNAVAILABLE

Net kural:
“sessiz fallback” yerine dürüst degraded davranış tercih edilmelidir.

9. LOGGING VE IZLENEBILIRLIK KURALI

Aşağıdaki alanlar kritik mutation hatalarında mümkünse dönmelidir:

request_id
command_id
code
details.state
details.required_scope
details.required_permission
details.current_state

Bu hem panel aksiyonlarında hem internal command zincirlerinde hata ayıklamayı kolaylaştırır.

10. KISA OZET

Doğru API hata modeli şudur:

HTTP status genel sınıfı gösterir
code kanonik domain anlamını taşır
auth, scope, permission, actor ve transition reddi ayrı kodlarla ifade edilir
checkout/payment/order/return/refund/settlement/payout zincirinde conflict ve unprocessable ayrımı korunur
idempotency ve duplicate durumları ayrı sınıf olarak ele alınır
public/read yüzeylerde degraded durum dürüst biçimde gösterilir
panel/internal mutation yüzeylerinde audit ve izlenebilirlik desteklenir

Bu dosya ile Aşama 5’in beşinci resmi çıktısı da kapanmış oldu:
- `API_ERROR_CATALOG.md` artık public/app/panel/internal ayrımına uyumlu ortak hata dilini veriyor. :contentReference[oaicite:3]{index=3}

