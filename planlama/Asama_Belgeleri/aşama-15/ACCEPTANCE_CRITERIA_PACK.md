# ACCEPTANCE_CRITERIA_PACK

## 1. Amaç

Bu dosya, kritik journey’ler ve sistem omurgası için kabul kriterlerini tek doğrulu, ölçülebilir ve kanıt üretilebilir hale getirir.

Bu dosyanın amacı:

* kritik akışları acceptance seviyesinde doğrulanabilir maddelere dönüştürmek
* success/fail, transition, permission, eligibility, idempotency, retry/reconciliation ve audit etkilerini kabul kriterine bağlamak
* PACK ve stage kapanışlarında “gerçekten hazır mı?” sorusuna kanıt tabanlı cevap üretmek
* kodlamaya başlama kapısını acceptance diliyle beslemektir

Net kural:

* Acceptance kriteri yalnız happy path cümlesi değildir
* Fail case’si olmayan kabul maddesi eksiktir
* Transition ayrımı bozuluyorsa acceptance geçmez
* Kanonik hata dili ve retry/reconciliation davranışı acceptance dışında bırakılamaz
* Kanıt üretmeyen kabul maddesi kapanış kapısı olamaz

---

## 2. Kapsam

Bu paket ilk fazda aşağıdaki acceptance ailelerini kapsar:

1. commerce kritik yolculukları
2. delivery ve post-delivery hakları
3. return/refund ve finance doğruluk zinciri
4. coupon/campaign ve reward etkileri
5. creator/supplier onboarding ve lifecycle başlangıçları
6. support/moderation/risk escalation zinciri
7. cross-cutting acceptance alanları

Bu dosya aşağıdaki alanları exact UI script veya tam test kodu seviyesinde açmaz:

* her ekran için click-by-click manuel test scripti
* exact automation framework syntax’ı
* exact fixture dosya içeriği

---

## 3. Acceptance standardı

Her acceptance maddesi en az şu parçaları taşımalıdır:

1. acceptance id
2. ilgili journey
3. ön koşul
4. doğrulanacak davranış
5. fail / rejection davranışı
6. transition ayrımı
7. error expectation gerekiyorsa
8. retry / reconciliation expectation gerekiyorsa
9. analytics / audit expectation gerekiyorsa
10. minimum kanıt türü

Net kural:

* Ön koşulsuz acceptance maddesi eksiktir
* Kanıt türü belirtilmeyen acceptance maddesi zayıftır

---

## 4. Kanıt türü standardı

Acceptance kanıtı en az şu tiplerden biriyle desteklenmelidir:

* test komutu çıktısı
* integration test sonucu
* acceptance senaryo çıktısı
* contract doğrulama kanıtı
* audit/event log kanıtı
* known limitation notu ile dürüst kabul kaydı

Net kural:

* “çalışıyor gibi” ifadesi kanıt değildir. fileciteturn17file2

---

## 5. Commerce acceptance ailesi

### AC-001 — Search → PDP doğru ürün bağlamını açar

**Journey:** search → PDP
**Ön Koşul:** arama servisi erişilebilir veya dürüst degraded modda
**Kabul:** kullanıcı sonuçtan seçtiği ürüne doğru PDP context ile ulaşır
**Fail/Rejection:** ürün görünmez veya unavailable ise canonical not-found/visibility davranışı çalışır
**Transition Ayrımı:** search result impression ≠ PDP open
**Error Expectation:** not-found/degraded family kanonik olmalıdır
**Analytics:** search_submit, result_click, search_to_pdp
**Kanıt:** T2/T3 + acceptance senaryosu

### AC-002 — PDP → cart add işlemi duplicate-safe ve scope-doğrudur

**Journey:** PDP → cart
**Ön Koşul:** ürün/variant görünür ve add_to_cart policy açısından geçerli
**Kabul:** cart line doğru oluşur veya güncellenir
**Fail/Rejection:** invalid variant / invalid quantity / add not allowed senaryosu deterministik döner
**Transition Ayrımı:** PDP görüntüleme ≠ cart truth write
**Error Expectation:** cart/validation family kanonik olmalıdır
**Kanıt:** T1/T2/T3

### AC-003 — Cart → checkout final validation boundary’den geçer

**Journey:** cart → checkout
**Ön Koşul:** cart line’lar mevcut ve checkout policy açısından geçerli
**Kabul:** checkout review context oluşur ve final validation ile ready_for_payment benzeri state’e ilerler
**Fail/Rejection:** stale cart, stock conflict, price conflict, invalid prerequisite ayrı davranış verir
**Transition Ayrımı:** cart intent ≠ ready_for_payment
**Permission/Guard:** guest checkout varsa yalnız commerce kapanış alanı için geçerlidir; sosyal hak açmaz. fileciteturn17file0turn17file1
**Error Expectation:** `CHECKOUT_EXPIRED`, `STOCK_INSUFFICIENT`, `PRICE_CHANGED` gibi kanonik family’lerle uyumlu olmalıdır. fileciteturn19file1
**Kanıt:** T2/T3 + critical scenario acceptance

### AC-004 — Checkout → payment yalnız validated checkout context’inden başlar

**Journey:** checkout → payment
**Ön Koşul:** checkout expired değil ve payment için ready durumda
**Kabul:** payment attempt initiation kabul edilir ve correlation/idempotency bağlamı oluşur
**Fail/Rejection:** invalid state veya invalid payment method deterministik reddedilir
**Transition Ayrımı:** ready_for_payment ≠ payment_confirmed
**Retry/Reconciliation:** timeout her zaman final failure sayılmaz; `unknown_result` / reconciliation patikası görünür olmalıdır. fileciteturn19file2
**Error Expectation:** `CHECKOUT_NOT_READY_FOR_PAYMENT`, `PAYMENT_METHOD_NOT_ALLOWED`, `PAYMENT_UNKNOWN_RESULT` family’leri uyumlu olmalıdır. fileciteturn19file1
**Kanıt:** T1/T2/T3 + timeout/duplicate scenario proof

### AC-005 — Payment → order duplicate-safe ve ayrık transition mantığıyla çalışır

**Journey:** payment → order
**Ön Koşul:** payment official outcome confirmed veya reconciliation ile confirmed
**Kabul:** order truth bir kez oluşur ve user visibility buna hizalanır
**Fail/Rejection:** order create failure explicit görünür, sessiz yutulmaz
**Transition Ayrımı:** `captured ≠ order created` ayrımı korunur. fileciteturn19file0
**Retry/Reconciliation:** duplicate order create engellenir; captured-but-order-missing exception görünür olur
**Error Expectation:** `ORDER_ALREADY_CREATED`, `DUPLICATE_PROVIDER_CALLBACK`, `COMMAND_ACCEPTED_BUT_STATUS_UNKNOWN` benzeri family’lerle uyumlu olmalıdır. fileciteturn19file1
**Analytics:** payment_to_order_conversion, order_create_fail_after_payment
**Kanıt:** T3/T4 + reconciliation scenario evidence

---

## 6. Shipment ve post-delivery acceptance ailesi

### AC-006 — Order → shipment line/package granularity ile çalışır

**Journey:** order → shipment
**Ön Koşul:** order created ve fulfillment context hazır
**Kabul:** shipment create line/package truth ile uyumlu oluşur
**Fail/Rejection:** shipment create failure veya duplicate create riski deterministik yönetilir
**Transition Ayrımı:** order_created ≠ shipment_created
**Retry/Reconciliation:** carrier timeout belirsizliğinde reconciliation gerekir; duplicate shipment create kör retry ile yapılmaz. fileciteturn19file2
**Error Expectation:** `SHIPMENT_NOT_READY`, duplicate/lock family’leriyle uyum
**Kanıt:** T3 + delivery provider timeout/duplicate senaryosu

### AC-007 — Delivered yalnız resmi teslimat doğrulamasıyla hak açar

**Journey:** delivery → review/story eligibility
**Ön Koşul:** official delivered outcome oluşmuş olmalı
**Kabul:** review/story eligibility doğru line/user/product bağlamında açılır
**Fail/Rejection:** wrong-line, duplicate-entitlement, guest-social-right leakage engellenir
**Transition Ayrımı:** `delivered ≠ review/story otomatik yazıldı`; teslimat yalnız entitlement eşiğini açar. fileciteturn19file0
**Permission/Guard:** login + eligibility gerekir; login tek başına yetmez. fileciteturn17file0turn17file1
**Error Expectation:** `REVIEW_ELIGIBILITY_NOT_ACTIVE`, `STORY_ELIGIBILITY_NOT_ACTIVE`, `DELIVERY_NOT_COMPLETED` family’leriyle uyumlu olmalıdır. fileciteturn19file1
**Kanıt:** T1/T3/T4

### AC-008 — Return/refund impact line-level ve finance-safe çalışır

**Journey:** delivery → return/refund impact
**Ön Koşul:** delivered veya return-eligible line mevcut
**Kabul:** return request, decision ve refund zinciri ayrık ve doğrulanabilir işler
**Fail/Rejection:** invalid line, return not allowed, refund delayed/unknown-result görünür olur
**Transition Ayrımı:** `return approved ≠ refund completed` ayrımı korunur. fileciteturn19file0
**Retry/Reconciliation:** refund unknown-result ayrı family ile reconciliation ister. fileciteturn19file2
**Error Expectation:** `RETURN_NOT_ALLOWED`, `RETURN_WINDOW_CLOSED`, `REFUND_NOT_ALLOWED`, finance unknown-result/correction family’leriyle uyumlu olmalıdır. fileciteturn19file1
**Audit/Visibility:** entitlement/reward revoke/recompute etkileri doğru yansır
**Kanıt:** T3/T4 + finance correction scenario proof

---

## 7. Promotion ve reward acceptance ailesi

### AC-009 — Coupon/campaign apply final price truth ile çelişmez

**Journey:** coupon/campaign application
**Ön Koşul:** coupon/campaign active ve context uygulanabilir
**Kabul:** discount doğru uygulanır ve checkout final validation ile hizalı kalır
**Fail/Rejection:** coupon invalid/not applicable/price conflict deterministik ayrılır
**Transition Ayrımı:** coupon_applied ≠ finance correction settled
**Error Expectation:** `COUPON_INVALID`, `COUPON_NOT_APPLICABLE`, `CAMPAIGN_NOT_APPLICABLE`, `PRICE_CHANGED` family’leriyle uyumlu olmalıdır. fileciteturn19file1
**Kanıt:** T2/T3

### AC-010 — Reward flow pending/spendable/revoked ayrımını korur

**Journey:** reward point flow
**Ön Koşul:** reward üreten olay ve eligibility context mevcut
**Kabul:** reward pending oluşur, uygun anda spendable olur, return/refund sonrası gerekiyorsa revoke/recompute edilir
**Fail/Rejection:** duplicate reward grant veya invalid spend engellenir
**Transition Ayrımı:** pending ≠ spendable ≠ revoked
**Permission/Guard:** guest reward kazanmaz. fileciteturn17file0
**Kanıt:** T1/T3

---

## 8. Onboarding acceptance ailesi

### AC-011 — Creator onboarding approved ve active ayrımını korur

**Journey:** creator onboarding
**Ön Koşul:** creator application payload ve review governance hazır
**Kabul:** application → review → approved/revision/rejected → activation zinciri ayrık çalışır
**Fail/Rejection:** approval ile active scope karışmaz; risk/revision path görünür olur
**Transition Ayrımı:** `approved ≠ active` ayrımı korunur. fileciteturn19file0
**Permission/Guard:** shopper profile ile creator profile merge edilmez. fileciteturn17file0turn17file1
**Audit:** approval/revision/restriction traceable olmalıdır
**Kanıt:** T1/T3/T4

### AC-012 — Supplier onboarding approval ile unrestricted operation karışmaz

**Journey:** supplier onboarding
**Ön Koşul:** supplier application payload ve review governance hazır
**Kabul:** approval sonrası category/upload/operational scope kontrollü açılır
**Fail/Rejection:** approved but unrestricted operation leakage engellenir
**Transition Ayrımı:** approved ≠ unrestricted active scope
**Permission/Guard:** supplier panel input verir; truth owner değildir. fileciteturn17file1
**Audit:** approval/restriction/suspension traceable olmalıdır
**Kanıt:** T1/T3/T4

---

## 9. Escalation acceptance ailesi

### AC-013 — Support/moderation/risk/finance owner ayrımı bozulmaz

**Journey:** support/moderation/fraud escalations
**Ön Koşul:** ticket, moderation item veya risk case açılmış olmalı
**Kabul:** doğru triage, doğru primary owner, doğru escalation/approval zinciri çalışır
**Fail/Rejection:** support finance sonucu üretmeye, moderation risk sonucunu sahiplenmeye veya panel direct write yapmaya kalkamaz
**Transition Ayrımı:** resolved ≠ closed; review ≠ approval; approval ≠ executed
**Permission/Guard:** support, moderation, risk, finance, payout, creator/supplier admin rolleri ayrıdır. fileciteturn17file1
**Audit:** protected action ve close reason traceable olmalıdır
**Kanıt:** T1/T3/T4 + audit trail proof

---

## 10. Cross-cutting acceptance ailesi

### AC-014 — Permission ve eligibility aynı family’ye indirgenmez

**Ön Koşul:** auth/scope/eligibility etkili journey
**Kabul:** login required, scope forbidden, ownership mismatch ve eligibility not active ayrı davranış verir
**Error Expectation:** auth/access/ownership/eligibility code’ları ayrışır. fileciteturn19file1turn17file1turn17file0
**Kanıt:** T1/T2

### AC-015 — Duplicate-safe kritik mutation görünür biçimde korunur

**Ön Koşul:** idempotent write surface mevcut
**Kabul:** duplicate command/callback ikinci mutation üretmez
**Fail/Rejection:** key missing, key conflict ve duplicate result family’leri ayrık görünür
**Transition Ayrımı:** duplicate ignored ≠ success mutation
**Error Expectation:** `IDEMPOTENCY_KEY_REQUIRED`, `IDEMPOTENCY_CONFLICT`, `DUPLICATE_COMMAND`, `DUPLICATE_PROVIDER_CALLBACK` family’leriyle uyumlu olmalıdır. fileciteturn19file1turn17file2
**Kanıt:** T1/T3

### AC-016 — Unknown-result alanları sessizce failure sayılmaz

**Ön Koşul:** payment/refund/payout/shipment provider ambiguity oluşabilecek akış
**Kabul:** unknown-result explicit tutulur ve reconciliation path’e düşer
**Fail/Rejection:** otomatik ikinci provider’a kör geçiş veya sessiz failure yazımı yapılmaz
**Transition Ayrımı:** unknown_result ≠ failed
**Error/Policy Expectation:** payment/payout unknown-result ve reconciliation dili timeout/fallback politikasına uyumlu olmalıdır. fileciteturn19file2turn19file1
**Kanıt:** T3/T4 + reconciliation scenario proof

### AC-017 — Projection hiçbir yerde truth owner gibi davranmaz

**Ön Koşul:** tracking, notification, BFF, panel summary veya read model kullanan akış
**Kabul:** projection user/operator visibility üretir; truth mutation owner sistemde kalır
**Fail/Rejection:** BFF write, panel direct write, UI truth üretimi acceptance’i düşürür. fileciteturn17file1
**Kanıt:** architecture review + T3/T4 scenario proof

---

## 11. Acceptance kapı standardı

Bir journey ailesi acceptance geçti sayılmadan önce en az şunlar karşılanmalıdır:

* [ ] success case doğrulandı
* [ ] en az bir fail/reject case doğrulandı
* [ ] transition ayrımı korundu
* [ ] gerekli permission/eligibility guard doğrulandı
* [ ] gerekli canonical error family doğrulandı
* [ ] retry/reconciliation/duplicate-safe davranış doğrulandı gerekiyorsa
* [ ] analytics/audit/visibility etkisi kontrol edildi gerekiyorsa
* [ ] kanıt üretildi

Net kural:

* Yalnız happy path geçen journey acceptance geçmiş sayılmaz

---

## 12. Known limitation ile acceptance ilişkisi

### AC-090 — Limitation gizlenmez

**Binding Rule:** Journey acceptance geçse bile provider sandbox, non-durable worker, partial observability veya staged rollout gibi sınırlamalar görünür yazılmalıdır.

### AC-091 — Limitation gerekirse conditional acceptance üretir

**Binding Rule:** Çekirdek amaç sağlanmış ama limitasyon varsa accepted-with-limitations kullanılabilir; tam acceptance etiketi kör verilmez.

---

## 13. Faz-1 minimum acceptance omurgası

İlk fazda aşağıdaki acceptance eksenleri zorunludur:

1. commerce core path
2. payment/order separation
3. delivery/eligibility separation
4. return/refund finance correctness
5. coupon/campaign final price correctness
6. creator/supplier onboarding lifecycle correctness
7. escalation/approval/owner separation
8. idempotency / duplicate-safe behavior
9. unknown-result / reconciliation visibility
10. projection vs truth boundary

---

## 14. Faz-1 dışında bırakılan alanlar

* exhaustive load/performance acceptance
* full localization acceptance pack
* exhaustive provider certification matrix
* long-tail UX micro acceptance catalogue

---

## 15. Kısa sonuç

Bu paket ile aşağıdaki çekirdek kararlar sabitlenmiş olur:

* Acceptance yalnız happy path doğrulaması değildir
* Transition ayrımları acceptance’in parçasıdır
* Kanonik error family, retry/reconciliation ve duplicate-safe davranış acceptance dışında bırakılamaz
* Permission, eligibility, analytics, audit ve visibility etkileri kritik journey acceptance’ine dahildir
* Coding readiness gate bu acceptance pack üzerine oturur

Bu dosya, Aşama 15’in bağlayıcı acceptance kriteri ve kapı testi omurgasıdır.
