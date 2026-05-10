# CRITICAL_JOURNEY_CHECKLIST

## 1. Amaç

Bu dosya, platformun kritik kullanıcı, ticari ve operasyonel yolculuklarını kodlamaya hazır checklist’lere dönüştürür.

Bu dosyanın amacı:

* kritik journey’leri tek tek ölçülebilir hale getirmek
* her journey için minimum data set, success case, fail case, rollback/retry, analytics, audit ve permission/guard etkisini netleştirmek
* kodlamaya başlamadan önce “bu akış gerçekten tam anlaşılmış mı?” sorusuna bağlayıcı cevap vermek
* acceptance kriteri üretiminin temel girdisini oluşturmaktır

Net kural:

* Kritik journey yalnız happy path ile tanımlanmaz
* Fail case’siz journey tamamlanmış sayılmaz
* Rollback/retry davranışı belirsizse journey checklist kapanmaz
* Permission/guard ve audit etkisi yazılmadan journey hazır sayılmaz
* Analytics ve observability etkisi kritik akışlarda isteğe bağlı değildir

---

## 2. Kapsam

Bu checklist ilk fazda aşağıdaki kritik journey ailelerini kapsar:

1. search → PDP
2. PDP → cart
3. cart → checkout
4. checkout → payment
5. payment → order
6. order → shipment
7. delivery → review/story eligibility
8. delivery → return/refund impact
9. coupon/campaign application
10. reward point flow
11. creator onboarding
12. supplier onboarding
13. support/moderation/fraud escalations

Bu dosya aşağıdaki alanları exact UI metni veya exact technical implementation seviyesinde açmaz:

* ekran mikro metinleri
* tam endpoint listesi
* exact database tablo şeması
* exact queue/topic isimleri

---

## 3. Checklist standardı

Her kritik journey en az şu başlıklarla değerlendirilir:

1. journey amacı
2. giriş koşulları
3. minimum data set
4. success case
5. fail case
6. rollback / retry / unknown-result davranışı
7. permission / guard etkisi
8. state / eligibility etkisi
9. analytics etkisi
10. audit / visibility etkisi
11. readiness notu

Net kural:

* Bir başlık boşsa checklist tamamlanmış sayılmaz
* “geliştirirken netleşir” notu readiness yerine geçmez

---

## 4. Journey 01 — Search → PDP

### 4.1 Amaç

Kullanıcının arama niyetinden ilgili ürün detayına kontrollü ve ölçülebilir geçişini sağlamak.

### 4.2 Giriş koşulları

* kullanıcı search surface’ine erişebilmeli
* query veya arama niyeti üretilmiş olmalı
* search serving available veya controlled degraded mode olmalı

### 4.3 Minimum data set

* actor/session context
* query text veya intent context
* result set / candidate metadata
* selected product reference
* surface/source context

### 4.4 Success case

* search submit kabul edilir
* sonuçlar döner
* kullanıcı sonuçtan PDP’ye geçer
* PDP doğru product context ile açılır

### 4.5 Fail case

* no-result
* degraded result
* invalid query
* PDP target unavailable
* permission/visibility nedeniyle ürün açılmaz

### 4.6 Rollback / retry / unknown-result

* search no-result rollback gerektirmez
* degraded result kullanıcıya dürüst yansıtılır
* retry kullanıcı yeniden query submit ile çalışır
* unknown-result burada genelde first-class değil; degraded/empty ayrımı yeterli

### 4.7 Permission / guard etkisi

* search ve PDP görüntüleme public olabilir
* restricted visibility varsa ilgili content/product açılmaz

### 4.8 State / eligibility etkisi

* özel eligibility gerekmez
* yalnız visibility ve publication state etkisi olabilir

### 4.9 Analytics etkisi

* search_submit
* result_impression
* result_click
* search_to_pdp
* no_result / degraded_result ayrı ölçülür

### 4.10 Audit / visibility etkisi

* genelde audit kritik değildir
* internal search degradation/incident visibility önemli olabilir

### 4.11 Readiness notu

Bu journey için search, ranking, visibility ve PDP route contract’ı net olmalıdır.

---

## 5. Journey 02 — PDP → Cart

### 5.1 Amaç

Kullanıcının ürün varyantı ve temel satın alma niyetiyle sepet oluşturabilmesini sağlamak.

### 5.2 Giriş koşulları

* PDP doğru ürün context ile açık olmalı
* gerekli varyant/availability bilgisi render edilmiş olmalı
* kullanıcı cart write aksiyonuna izinli olmalı

### 5.3 Minimum data set

* product_id
* variant_id gerekiyorsa
* quantity
* seller/store context gerekiyorsa
* actor/session/cart context

### 5.4 Success case

* kullanıcı varyantı seçer
* add_to_cart accepted olur
* cart line oluşur/güncellenir
* kullanıcı cart projection’da doğru sonucu görür

### 5.5 Fail case

* varyant eksik
* ürün görünür ama add_to_cart not allowed
* stock soft-check fail veya invalid quantity
* PDP stale data nedeniyle revalidation warning

### 5.6 Rollback / retry / unknown-result

* add_to_cart başarısızsa optimistic UI varsa rollback yapılır
* retry kullanıcı aksiyonuyla mümkündür
* unknown-result tipik ana senaryo değildir; duplicate-safe write dikkate alınır

### 5.7 Permission / guard etkisi

* add_to_cart guest için açık olabilir
* social write guard ile karıştırılmaz
* restricted/suspended actor commerce block ise write engellenir

### 5.8 State / eligibility etkisi

* commerce intent state oluşur
* final stock/price truth bu aşamada kesinlenmeyebilir

### 5.9 Analytics etkisi

* pdp_open
* variant_select
* add_to_cart_attempt
* add_to_cart_success / fail

### 5.10 Audit / visibility etkisi

* audit genelde kritik değildir
* cart visibility user-facing projection’da doğru olmalıdır

### 5.11 Readiness notu

Cart truth, variant behavior ve guest vs authenticated commerce guard netleşmiş olmalıdır.

---

## 6. Journey 03 — Cart → Checkout

### 6.1 Amaç

Sepet niyetini checkout review ve final validation akışına taşımak.

### 6.2 Giriş koşulları

* cart boş olmamalı
* cart line’lar commerce açısından işlenebilir olmalı
* actor guest veya authenticated olabilir; kontrollü guest checkout istisnası dikkate alınmalı. fileciteturn17file0

### 6.3 Minimum data set

* cart lines
* actor/session/customer context
* address capability context
* pricing snapshot refs
* stock validation inputs
* coupon/reward input context varsa

### 6.4 Success case

* checkout başlatılır
* cart line’lar review context’ine taşınır
* final stock/price validation yapılır
* ready_for_payment benzeri state’e ilerlenir

### 6.5 Fail case

* guest flow policy mismatch
* invalid cart
* stale line
* stock conflict
* price conflict
* address/identity prerequisite eksik

### 6.6 Rollback / retry / unknown-result

* checkout expired olabilir
* validation fail olursa cart’a kontrollü dönüş olur
* retry checkout yeniden başlatma ile yapılır
* unknown-result burada ana failure family’si değildir; validation/state fail family’si öndedir

### 6.7 Permission / guard etkisi

* guest checkout açıksa yalnız commerce kapanış alanı için geçerlidir; sosyal hak açılmaz. fileciteturn17file0turn17file1
* restricted/suspended actor commerce block ise checkout açılmaz

### 6.8 State / eligibility etkisi

* checkout_started
* ready_for_payment
* checkout_expired
* validation_failed

### 6.9 Analytics etkisi

* checkout_started
* checkout_validation_failed
* checkout_ready_for_payment
* guest_vs_authenticated_checkout_share

### 6.10 Audit / visibility etkisi

* normal checkout review audit gerektirmez
* critical validation failures observability açısından görünür olmalı

### 6.11 Readiness notu

Guest checkout istisnası, stock/price revalidation ve checkout expiry mantığı net olmalıdır.

---

## 7. Journey 04 — Checkout → Payment

### 7.1 Amaç

Doğrulanmış checkout bağlamından ödeme başlatma sürecine geçmek.

### 7.2 Giriş koşulları

* checkout valid ve expired değil
* final payable amount belirlenmiş
* payment method/context hazır

### 7.3 Minimum data set

* checkout_id
* actor/order candidate context
* final amount snapshot
* currency/payment method
* idempotency key / payment attempt ref

### 7.4 Success case

* payment initiation accepted
* provider/system payment attempt oluşur
* kullanıcı ödeme sürecine geçer

### 7.5 Fail case

* invalid checkout state
* payment method invalid
* amount mismatch
* initiation failure
* auth/session invalid

### 7.6 Rollback / retry / unknown-result

* initiation fail -> retry mümkün olabilir
* duplicate initiation idempotency ile engellenmelidir
* provider ambiguity / callback uncertainty -> unknown-result first-class olmalıdır

### 7.7 Permission / guard etkisi

* checkout context valid olmalı
* payment yalnız verified checkout bağlamından başlar
* browser cart verisinden doğrudan payment başlatılamaz

### 7.8 State / eligibility etkisi

* payment_initiated
* payment_unknown_result
* payment_failed / payment_confirmed

### 7.9 Analytics etkisi

* payment_start
* payment_initiation_fail
* payment_unknown_result
* payment_confirmed

### 7.10 Audit / visibility etkisi

* payment attempts trace/correlation taşır
* unknown-result ve correction gerektiren akışlar finance visibility’ye düşmelidir

### 7.11 Readiness notu

Idempotency, payment attempt correlation ve unknown-result politikası net olmalıdır. fileciteturn17file2

---

## 8. Journey 05 — Payment → Order

### 8.1 Amaç

Başarılı ödeme sonucunu order truth’a güvenli ve duplicate-safe biçimde dönüştürmek.

### 8.2 Giriş koşulları

* payment outcome resmi olarak netleşmiş olmalı veya reconciliation ile confirmed hale gelmiş olmalı
* order creation şartları geçerli olmalı

### 8.3 Minimum data set

* payment attempt ref
* checkout context ref
* order creation payload
* line/package draft context
* idempotency/correlation refs

### 8.4 Success case

* confirmed payment sonrası order_created
* order lines oluşturulur
* order visibility kullanıcıya yansır

### 8.5 Fail case

* payment confirmed but order create failed
* duplicate order create attempt
* stale checkout/order payload
* invalid transition

### 8.6 Rollback / retry / unknown-result

* order create duplicate-safe olmalı
* payment confirmed but order missing -> explicit recovery/reconciliation gerekir
* unknown payment sonucu order success sayılmaz

### 8.7 Permission / guard etkisi

* order create internal/domain owner action’dır
* UI/BFF/panel doğrudan order truth yazmaz. fileciteturn17file1

### 8.8 State / eligibility etkisi

* order_created
* order_create_failed
* payment_captured_but_order_missing gibi exception state/family görünür olmalı

### 8.9 Analytics etkisi

* payment_to_order_conversion
* order_create_fail_after_payment

### 8.10 Audit / visibility etkisi

* critical reconciliation ve exception visibility gerekir
* user-facing order projection official order outcome ile hizalı olmalıdır

### 8.11 Readiness notu

Captured/payment_confirmed ile order_created ayrımı belirsizse journey ready değildir.

---

## 9. Journey 06 — Order → Shipment

### 9.1 Amaç

Order truth’unu fulfillment ve shipment lifecycle’ına taşımak.

### 9.2 Giriş koşulları

* order_created
* line/package ayrıştırma yapılabilir olmalı
* fulfillment/shipping context hazır olmalı

### 9.3 Minimum data set

* order_id
* order_line/package refs
* fulfillment actor/context
* shipment destination/logistics data

### 9.4 Success case

* shipment created
* package/line shipment ilişkisi oluşur
* tracking visible hale gelir

### 9.5 Fail case

* fulfillment block
* shipment create fail
* supplier/ops problem state
* duplicate shipment callback/create attempt

### 9.6 Rollback / retry / unknown-result

* shipment create retry edilebilir
* duplicate callback/result ignored family gerekir
* shipment investigation/fallback ayrı görünür olmalıdır

### 9.7 Permission / guard etkisi

* shipment create internal/ops controlled action’dır
* creator veya supplier panel truth owner değildir; controlled input sağlar. fileciteturn17file1

### 9.8 State / eligibility etkisi

* shipment_created
* in_transit
* delivery_failed
* delivered

### 9.9 Analytics etkisi

* order_to_shipment_rate
* shipment_create_fail
* delayed_shipment signal

### 9.10 Audit / visibility etkisi

* shipment anomaly visibility ve support/tracking sync gerekir

### 9.11 Readiness notu

Line/package granularity ve supplier/ops boundary net olmalıdır.

---

## 10. Journey 07 — Delivery → Review/Story Eligibility

### 10.1 Amaç

Teslimat gerçekleştiğinde review/story gibi post-delivery hakları kontrollü biçimde açmak.

### 10.2 Giriş koşulları

* delivered state resmi olarak oluşmuş olmalı
* ilgili actor shopper scope’unda tanımlı olmalı

### 10.3 Minimum data set

* order_line or shipment line ref
* delivered timestamp/state
* user/account ref
* product ref
* entitlement policy context

### 10.4 Success case

* delivered sonrası review/story eligibility açılır
* kullanıcı doğru yüzeylerde haklarını görür

### 10.5 Fail case

* wrong line entitlement
* duplicate entitlement
* delivered projection var ama official delivered yok
* guest checkout sonrası sosyal hak yanlış açılıyor

### 10.6 Rollback / retry / unknown-result

* return/refund sonrası entitlement revoke/update gerekebilir
* duplicate entitlement create engellenmeli
* delivered belirsizse eligibility açılmaz

### 10.7 Permission / guard etkisi

* login ön koşuldur
* review/story için eligibility ayrıca gerekir; login tek başına yetmez. fileciteturn17file0turn17file1

### 10.8 State / eligibility etkisi

* review_eligible
* story_eligible
* revoked/recomputed eligibility

### 10.9 Analytics etkisi

* delivered_to_review_eligibility
* delivered_to_story_eligibility
* review/story create after eligibility

### 10.10 Audit / visibility etkisi

* user-facing entitlement visibility doğru olmalı
* yanlış entitlement kritik trust sorunudur

### 10.11 Readiness notu

Delivered truth ile tracking projection ayrımı net değilse journey ready değildir.

---

## 11. Journey 08 — Delivery → Return/Refund Impact

### 11.1 Amaç

Teslimat sonrası iade ve refund etkilerini line-level, finance-safe ve eligibility-aware biçimde yönetmek.

### 11.2 Giriş koşulları

* delivered veya return-eligible line mevcut olmalı
* ilgili return policy context net olmalı

### 11.3 Minimum data set

* order_line ref
* delivered state
* return request data
* refund calculation context
* finance correction refs

### 11.4 Success case

* return request açılır
* karar verilir
* gerekiyorsa refund süreci başlar/tamamlanır
* entitlement/reward etkileri recompute edilir

### 11.5 Fail case

* return eligibility fail
* invalid line
* refund delayed/failed
* approved return ama refund completed değil

### 11.6 Rollback / retry / unknown-result

* refund unknown-result ayrı görünür olmalı
* return approval ile refund completion ayrılmalı
* finance correction/reconciliation gerektiğinde explicit path olmalı

### 11.7 Permission / guard etkisi

* own order/line ownership guard gerekir
* return eligibility ayrı kontrol edilir
* support yalnız giriş olabilir, final finance outcome üretmez

### 11.8 State / eligibility etkisi

* return_requested
* return_approved/rejected
* refund_started/completed/failed/unknown_result
* entitlement revoked/recomputed

### 11.9 Analytics etkisi

* return_request_rate
* refund_completion_rate
* post-delivery impact metrics

### 11.10 Audit / visibility etkisi

* return/reason/audit izi gerekli olabilir
* finance ve user visibility ayrımı dürüst korunmalıdır

### 11.11 Readiness notu

Return approved ≠ refund completed ayrımı net değilse journey ready değildir.

---

## 12. Journey 09 — Coupon/Campaign Application

### 12.1 Amaç

Kampanya ve kupon etkilerini checkout öncesi/checkout anında güvenli biçimde uygulamak.

### 12.2 Giriş koşulları

* cart/checkout context mevcut
* coupon/campaign policy active ve applicable olmalı

### 12.3 Minimum data set

* actor/cart/checkout context
* coupon id / campaign refs
* applicable lines
* sponsor attribution context
* price validation context

### 12.4 Success case

* coupon/campaign uygulanır
* final price/discount user-facing görünür
* checkout final validation ile uyumlu kalır

### 12.5 Fail case

* coupon invalid
* usage limit exceeded
* not applicable
* sponsor attribution conflict
* price revalidation fail

### 12.6 Rollback / retry / unknown-result

* invalid coupon apply rollback edilir
* checkout revalidation sırasında discount drop olabilir; dürüst gösterilir
* sponsor/finance correction ihtiyacı success ile karıştırılmaz

### 12.7 Permission / guard etkisi

* coupon apply capability actor context’e bağlı olabilir
* creator coupon / campaign collision ayrı policy guard ister

### 12.8 State / eligibility etkisi

* coupon_applied
* coupon_rejected
* promotion_conflict

### 12.9 Analytics etkisi

* coupon_apply_attempt
* coupon_apply_success/fail
* campaign_uplift tracking

### 12.10 Audit / visibility etkisi

* critical manual promotion exception audit gerektirir
* user-facing indirim ile finance truth ayrımı korunur

### 12.11 Readiness notu

Sponsor attribution ve final price doğrulaması net değilse journey ready değildir.

---

## 13. Journey 10 — Reward Point Flow

### 13.1 Amaç

Puan kazanımı, bekleme, harcanabilirlik ve geri alma etkilerini kontrollü yönetmek.

### 13.2 Giriş koşulları

* reward üreten tetikleyici olay net olmalı
* actor account ve reward eligibility mevcut olmalı

### 13.3 Minimum data set

* actor/account ref
* earning reason ref
* pending/spendable context
* return/refund dependency varsa order_line ref

### 13.4 Success case

* reward pending yaratılır
* uygun olduğunda spendable olur
* user reward history görünür olur

### 13.5 Fail case

* ineligible actor
* duplicate reward grant
* revoke/recompute kaçırıldı
* spend attempt invalid

### 13.6 Rollback / retry / unknown-result

* duplicate grant engellenmeli
* return/refund sonrası revoke/recompute explicit olmalı
* reward pending ile spendable aynı sayılmaz

### 13.7 Permission / guard etkisi

* guest reward kazanamaz. fileciteturn17file0
* authenticated/eligible account gerekir

### 13.8 State / eligibility etkisi

* reward_pending
* reward_spendable
* reward_revoked
* reward_recomputed

### 13.9 Analytics etkisi

* reward_earned
* reward_spendable_conversion
* reward_revocation_after_return

### 13.10 Audit / visibility etkisi

* user reward history projection doğru olmalı
* finance/reward correction traceable olmalı

### 13.11 Readiness notu

Pending ≠ spendable ≠ revoked ayrımı net değilse journey ready değildir.

---

## 14. Journey 11 — Creator Onboarding

### 14.1 Amaç

Creator başvurusunu controlled review, approval ve activation zinciriyle yönetime almak.

### 14.2 Giriş koşulları

* creator application surface mevcut
* identity/profile context var
* review governance tanımlı

### 14.3 Minimum data set

* actor/identity ref
* creator profile/application payload
* category/scope request
* risk/moderation context gerekiyorsa

### 14.4 Success case

* application received
* review yapılır
* approved/revision/rejected sonucu verilir
* activation completion ile creator scope açılır

### 14.5 Fail case

* missing info
* risk issue
* category fit issue
* approved but active scope not completed

### 14.6 Rollback / retry / unknown-result

* revision request retry yoludur
* approval ile active aynı değildir
* suspension/restriction future lifecycle branch olarak görünür olmalıdır

### 14.7 Permission / guard etkisi

* shopper scope ile creator scope karışmaz
* same identity possible olsa da role merge olmaz. fileciteturn17file0turn17file1

### 14.8 State / eligibility etkisi

* application_received
* revision_requested
* approved
* active
* restricted/suspended future lifecycle

### 14.9 Analytics etkisi

* application_submitted
* approval_rate
* revision_rate
* activation_completion

### 14.10 Audit / visibility etkisi

* approval/revision/restriction audit gerekir
* panel visibility creator lifecycle truth ile hizalı olmalıdır

### 14.11 Readiness notu

Approved ≠ active ayrımı net değilse journey ready değildir.

---

## 15. Journey 12 — Supplier Onboarding

### 15.1 Amaç

Supplier başvurusu, category enablement ve operational activation sürecini kontrollü yönetmek.

### 15.2 Giriş koşulları

* supplier application surface var
* company/info payload var
* review governance var

### 15.3 Minimum data set

* supplier identity/company refs
* category request
* ops/logistics capability context
* risk context gerekiyorsa

### 15.4 Success case

* application reviewed
* approved/revision/rejected verilir
* category/upload/operational scope kontrollü açılır

### 15.5 Fail case

* missing documentation
* ops capability mismatch
* risk issue
* approved but unrestricted operation yanlış açıldı

### 15.6 Rollback / retry / unknown-result

* revision request retry yoludur
* supplier approval ile unrestricted operation aynı değildir
* quality restriction future lifecycle branch olarak görünür olmalıdır

### 15.7 Permission / guard etkisi

* supplier panel action owner truth değildir
* supplier yalnız kendi bounded input alanında hareket eder. fileciteturn17file1

### 15.8 State / eligibility etkisi

* application_received
* revision_requested
* approved
* active/limited active
* restricted/suspended future lifecycle

### 15.9 Analytics etkisi

* supplier_application_submitted
* supplier_approval_rate
* supplier_activation_completion

### 15.10 Audit / visibility etkisi

* approval/restriction/suspension audit traceable olmalıdır

### 15.11 Readiness notu

Supplier approval ile category/upload scope activation ayrımı net değilse journey ready değildir.

---

## 16. Journey 13 — Support / Moderation / Fraud Escalations

### 16.1 Amaç

Kritik problem, şikayet ve risk vakalarını doğru owner’a, doğru SLA ve approval zinciriyle taşımak.

### 16.2 Giriş koşulları

* support ticket, moderation item veya risk signal oluşmuş olmalı
* escalation family tanımlı olmalı

### 16.3 Minimum data set

* ticket/moderation/risk case ref
* actor/context refs
* severity/priority
* primary owner
* secondary review/approval context gerekiyorsa

### 16.4 Success case

* doğru triage
* doğru owner handoff/escalation
* official owner outcome
* gerekiyorsa approval/protected action
* user/system visibility sync

### 16.5 Fail case

* wrong queue
* wrong owner
* support çözüm üretmeye çalışıyor ama owner değil
* moderation/risk/finance sınırı karıştı
* audit missing

### 16.6 Rollback / retry / unknown-result

* reopened case path görünür olmalı
* unknown-result finance/risk vakalarında explicit tutulmalı
* resolution ile closed ayrımı korunmalı

### 16.7 Permission / guard etkisi

* support, moderation, risk, finance, payout, creator/supplier admin rolleri ayrıdır. fileciteturn17file1
* panel direct write yoktur
* protected action owner/service zinciri gerekir

### 16.8 State / eligibility etkisi

* opened/triaged/assigned/in_progress/resolved/closed/reopened
* held/released/restricted/suspended gibi owner sonuçları

### 16.9 Analytics etkisi

* escalation volume
* SLA breach
* reopen rate
* owner-specific resolution metrics

### 16.10 Audit / visibility etkisi

* bu journey ailesi audit-heavy’dir
* protected actions, approval ve close reason traceable olmalıdır

### 16.11 Readiness notu

Support ≠ moderation ≠ risk ≠ finance owner ayrımı net değilse journey ready değildir.

---

## 17. Faz-1 minimum checklist kapanış standardı

Aşağıdaki sorular “evet” olmadan kritik journey checklist tamamlanmış sayılmaz:

* amaç net mi?
* minimum data set net mi?
* success case net mi?
* fail case net mi?
* rollback/retry/unknown-result davranışı net mi?
* permission/guard etkisi net mi?
* state/eligibility etkisi net mi?
* analytics etkisi net mi?
* audit/visibility etkisi net mi?

---

## 18. Faz-1 dışında bırakılan alanlar

* exact UI acceptance scripts
* exhaustive provider-by-provider edge case catalogue
* performance benchmark tables
* exhaustive localization texts

---

## 19. Kısa sonuç

Bu checklist ile aşağıdaki çekirdek kararlar sabitlenmiş olur:

* Kritik journey’ler yalnız happy path ile tanımlanmaz
* Fail, retry, rollback ve unknown-result davranışı görünür olmalıdır
* Permission/guard, eligibility ve owner boundary her journey’nin parçasıdır
* Analytics, audit ve visibility etkileri acceptance öncesi netleşmelidir
* Coding readiness kapısı bu checklist’lerin tamamlanmasına dayanır

Bu dosya, Aşama 15’in bağlayıcı kritik journey hazırlık ve checklist omurgasıdır.
