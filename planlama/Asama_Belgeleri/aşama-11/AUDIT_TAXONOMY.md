# AUDIT_TAXONOMY

## 1. Amaç

Bu dosya, platformda hangi işlemlerin resmi denetim izi üretmek zorunda olduğunu, audit kaydının hangi asgari alanları taşıyacağını ve audit ile event arasındaki ayrımı tek doğrulu, uygulanabilir ve bağlayıcı hale getirir.

Bu dosyanın amacı:

* audit gerektiren aksiyonları platform genelinde standardize etmek
* panel, protected action, lifecycle kararı, moderation, risk, finansal işlem ve config değişimi alanlarında resmi kayıt zorunluluğunu netleştirmek
* event, state transition, correction ve audit arasındaki farkı yoruma kapatmak
* denetlenebilirlik, geri izlenebilirlik ve hesap verilebilirlik omurgasını kurmaktır

Net kural:

* Her event audit değildir
* Audit, analytics event yerine geçmez
* Audit, business truth yerine geçmez
* Kritik mutation ve karar alanlarında audit zorunludur
* Audit overwrite edilmez; correction ve reconciliation yeni audit kaydı üretir

---

## 2. Kapsam

Bu taksonomi ilk fazda aşağıdaki audit ailelerini kapsar:

1. auth / identity audit
2. panel protected action audit
3. lifecycle / approval / restriction audit
4. product acceptance / pricing / promotion audit
5. commerce transition audit
6. payment / refund / reconciliation audit
7. shipment / delivery / return audit
8. UGC / moderation audit
9. risk / suppression / hold audit
10. settlement / payout / finance audit
11. configuration / rule change audit
12. manual override / exception audit

Bu dosya aşağıdaki alanları bilinçli olarak detaylandırmaz:

* retention süresi matrisi
* audit storage teknolojisi
* legal export / legal hold prosedürü
* rol bazlı audit görüntüleme matrisi

---

## 3. Audit katman modeli

### AT-001 — Observation event

Davranış veya sistem olayı kaydıdır; audit zorunlu olmak zorunda değildir.

### AT-002 — State transition record

Owner truth içindeki state geçişidir; her state transition audit olmak zorunda değildir.

### AT-003 — Audit record

Resmi denetim izi olarak saklanan, aktör, hedef, gerekçe ve sonuç bağlamı taşıyan kayıttır.

### AT-004 — Correction / reconciliation audit

Geç gelen bilgi, unknown-result, correction veya uzlaştırma sonrası üretilen ek audit kaydıdır.

Net kural:

* Event ile audit aynı kayıt değildir
* State transition ile audit aynı katman değildir
* Correction eski audit’i sessiz güncellemez; yeni audit üretir

---

## 4. Temel ilkeler

### AU-001 — Audit resmi denetim izidir

**Binding Rule:** Audit kaydı, kim, ne zaman, hangi bağlamda, hangi hedef üzerinde, hangi gerekçeyle, hangi etkiyi üretti sorularını cevaplamalıdır.

### AU-002 — Audit ile event ayrı katmanlardır

**Binding Rule:** Aynı aksiyon hem event hem audit üretebilir; fakat bunlar ayrı semantic ve storage katmanlarıdır.

### AU-003 — İnsan kararı ve yetkili sistem kararı audit zorunlu alandır

**Binding Rule:** Approve, reject, restrict, suspend, hold, release, reconcile, override, correction ve payout gibi karar alanları audit kapsamındadır.

### AU-004 — Reason ve actor bağlamı kritik audit’te zorunludur

**Binding Rule:** Kritik audit kaydı reason_code, actor_type ve target bağlamı olmadan eksik kabul edilir.

### AU-005 — History-first yaklaşımı zorunludur

**Binding Rule:** Audit kaydı sonradan overwrite edilmez; correction gerekiyorsa yeni audit eklenir.

### AU-006 — Manual, system, provider ve reconciliation modları ayrıdır

**Binding Rule:** İnsan kararı, arka plan job’u, provider callback’i ve reconciliation sonucu aynı execution_mode altında ezilmez.

### AU-007 — Accepted, completed ve reconciled aynı audit sonucu değildir

**Binding Rule:** Özellikle payment, moderation, payout ve finance alanlarında bu ayrım korunur.

---

## 5. Canonical audit şeması

Her audit kaydı en az şu alan ailesini taşır:

### 5.1 Kimlik alanları

* `audit_id`
* `audit_type`
* `audit_family`
* `audit_version`
* `created_at`

### 5.2 Actor alanları

* `actor_type`
* `actor_id` gerekiyorsa
* `actor_scope` gerekiyorsa
* `auth_state` gerekiyorsa
* `execution_mode`

### 5.3 Target alanları

* `target_type`
* `target_id`
* `secondary_target_type` gerekiyorsa
* `secondary_target_id` gerekiyorsa

### 5.4 Action / state alanları

* `action_name`
* `previous_state` gerekiyorsa
* `new_state` gerekiyorsa
* `changed_fields` gerekiyorsa
* `financial_effect` gerekiyorsa

### 5.5 Gerekçe alanları

* `reason_code`
* `reason_text` gerekiyorsa
* `source_trigger` gerekiyorsa
* `policy_ref` gerekiyorsa

### 5.6 Correlation / context alanları

* `surface` gerekiyorsa
* `request_id` gerekiyorsa
* `correlation_id` gerekiyorsa
* `reconciliation_ref` gerekiyorsa
* `checkout_id` / `payment_attempt_id` / `order_id` / `order_line_id` / `settlement_line_id` / `payout_batch_id` bağlama göre

### 5.7 Sonuç alanları

* `result_state`
* `error_code` gerekiyorsa
* `data_quality_state` gerekiyorsa

Net kural:

* Audit tam entity dump’ı değildir
* Audit değişimin anlaşılması için yeterli önce/sonra bağlamı taşımalıdır
* Sensitive veri gereksiz yere audit içine yazılmaz

---

## 6. Audit family standardı

İlk faz canonical audit_family:

* `auth_identity`
* `panel_action`
* `lifecycle`
* `pricing_promotion`
* `commerce_transition`
* `payment_refund`
* `logistics_return`
* `ugc_moderation`
* `risk_suppression`
* `finance_settlement`
* `payout`
* `config_rule_change`
* `manual_override`

Net kural:

* Moderation ve risk aynı family altında ezilmez
* Commerce transition ve finance settlement aynı family altında ezilmez
* Manual override kendi family’sinde izlenir

---

## 7. Execution mode standardı

Canonical execution_mode:

* `manual`
* `system`
* `provider`
* `scheduled`
* `reconciliation`

Net kural:

* Admin action ile scheduled job aynı execution_mode değildir
* Provider callback ile reconciliation sonucu aynı execution_mode değildir

---

## 8. Auth / identity audit ailesi

### AU-010 — Identity bind audit zorunludur

**Binding Rule:** Guest -> authenticated bağlama, cart merge ve kritik account-link akışları auditlenir.

**Örnek:**

* `identity_bound_from_guest`
* `cart_merged_after_login`
* `account_link_completed`

### AU-011 — Kritik auth/account yaptırımları auditlenir

**Binding Rule:** Account lock, unlock, critical session revoke ve benzeri güvenlik etkili aksiyonlar audit kapsamındadır.

---

## 9. Panel protected action audit ailesi

### AU-020 — Protected action audit olmadan tamamlanmış sayılmaz

**Binding Rule:** Panelden başlatılan kritik aksiyonlar audit izi olmadan resmi olarak tamamlanmış kabul edilmez.

### AU-021 — View ile action audit ayrıdır

**Binding Rule:** Liste veya dashboard görüntüleme audit zorunlu olmayabilir; state etkili protected action audit zorunludur.

### AU-022 — Kritik panel aksiyonu reason zorunludur

**Binding Rule:** Approve, reject, restrict, suspend, release, escalate ve benzeri aksiyonlar reason_code olmadan eksik audit kabul edilir.

---

## 10. Lifecycle / approval / restriction audit ailesi

### AU-030 — Creator lifecycle geçişleri auditlenir

**Binding Rule:** Application, review, revision, approved, active, restricted, suspended ve closed geçişleri audit zorunludur.

### AU-031 — Supplier lifecycle geçişleri auditlenir

**Binding Rule:** Approval, restriction, upload freeze, suspend, reactivate ve benzeri supplier kararları audit kapsamındadır.

### AU-032 — Kısmi restriction da audit zorunludur

**Binding Rule:** Category close, feature disable, visibility downrank gibi kısmi daraltmalar resmi karar sayılır ve audit gerektirir.

---

## 11. Product acceptance / pricing / promotion audit ailesi

### AU-040 — Product acceptance kararları auditlenir

**Binding Rule:** Ürün kabul, red, revizyon ve publish uygunluğu kararları audit kapsamındadır.

### AU-041 — Pricing rule ve corridor değişimleri auditlenir

**Binding Rule:** Margin rule, corridor rule, batch activation ve kritik fiyat kuralı değişimleri audit zorunludur.

### AU-042 — Campaign lifecycle auditlenir

**Binding Rule:** Create, activate, pause, close ve kapsam değişiklikleri audit kapsamındadır.

### AU-043 — Coupon create / disable / sponsor-model change auditlenir

**Binding Rule:** Kupon oluşturma, pasife alma ve sponsor attribution model değişimi audit kaydı üretir.

### AU-044 — Promotion override ayrı audit ailesi üretir

**Binding Rule:** Promosyon alanında normal akış dışı istisna tanımı veya force-apply davranışı manual_override audit’i gerektirir.

---

## 12. Commerce transition audit ailesi

### AU-050 — Checkout kritik geçişleri auditlenebilir ailede tutulur

**Binding Rule:** Invalidated, expired, ready_for_payment ve conflict geçişleri audit izine sahip olmalıdır.

### AU-051 — Payment kritik sonuçları auditlenir

**Binding Rule:** Initiated, confirmed, failed, unknown_result ve reconciled sonuçları audit kapsamındadır.

### AU-052 — Order create ve correction auditlenir

**Binding Rule:** Order created, order create failed, order corrected ve manual order adjustment ayrı audit kaydı üretir.

### AU-053 — Accepted ile completed ayrımı commerce auditte korunur

**Binding Rule:** Request alındı, callback geldi, order oluştu gibi aşamalar tek audit altında ezilmez.

---

## 13. Payment / refund / reconciliation audit ailesi

### AU-060 — Provider callback ve unknown-result auditlenir

**Binding Rule:** Callback receive, unknown-result tespiti ve reconciliation başlangıcı audit izine sahip olmalıdır.

### AU-061 — Refund başlatma ve sonuç auditlenir

**Binding Rule:** Refund initiation, completion, failure ve correction alanları audit kapsamındadır.

### AU-062 — Reconciliation correction yeni audit üretir

**Binding Rule:** Belirsiz sonucun netleşmesi eski audit’i overwrite ederek değil, yeni audit kaydıyla izlenir.

---

## 14. Shipment / delivery / return audit ailesi

### AU-070 — Shipment ve delivery state geçişleri auditlenir

**Binding Rule:** Shipment create, shipped, delivered, failed ve returned_to_sender gibi operasyon geçişleri audit kaydı üretmelidir.

### AU-071 — Delivery entitlement açılışı auditlenir

**Binding Rule:** Review/story entitlement açılışı zincir etkili karar olduğu için audit izine sahip olmalıdır.

### AU-072 — Return / cancel line-level kararları auditlenir

**Binding Rule:** Approval, reject ve line-level decision’lar order-level kaba kayıtla geçiştirilemez.

### AU-073 — Return correction audit zorunludur

**Binding Rule:** Kısmi iade ve refund correction finance ve entitlement tarafında ayrı audit izi üretir.

---

## 15. UGC / moderation audit ailesi

### AU-080 — Moderation kararları audit zorunludur

**Binding Rule:** Review, question, answer, user story, post ve creator story alanlarında approve/reject/restrict/take_down kararları audit kapsamındadır.

### AU-081 — Moderation decision reason zorunludur

**Binding Rule:** İçerik görünürlüğünü etkileyen karar reason_code olmadan eksik kabul edilir.

### AU-082 — Visible -> restricted / taken_down / archived geçişleri auditlenir

**Binding Rule:** UGC görünürlüğünü etkileyen kritik geçişler history-first iz bırakmalıdır.

### AU-083 — User delete request ile platform takedown ayrılır

**Binding Rule:** Kullanıcı silme talebi ile platform moderasyon kararı aynı audit_type altında ezilmez.

---

## 16. Risk / suppression / hold audit ailesi

### AU-090 — Risk case açılışı ve kapanışı auditlenir

**Binding Rule:** Abuse/fraud inceleme vakası, suppression ve hold kararları audit kapsamındadır.

### AU-091 — Hold ve release ayrı audit üretir

**Binding Rule:** Aynı kayıt overwrite edilmez; hold ve release history’de ayrı yer alır.

### AU-092 — Risk kaynaklı hak düşüşleri auditlenir

**Binding Rule:** Coupon block, reward hold, payout hold, UGC suppression gibi sonuçlar audit izi gerektirir.

### AU-093 — Automated risk ile manual review ayrılır

**Binding Rule:** Sistemsel suppression ile admin/manual release aynı execution_mode altında ezilmez.

---

## 17. Finance / settlement / payout audit ailesi

### AU-100 — Settlement create / adjust / settle auditlenir

**Binding Rule:** Finansal dağıtım ve correction alanı denetlenebilir history bırakmalıdır.

### AU-101 — Sponsor attribution ve refund correction auditlenir

**Binding Rule:** Campaign/coupon sponsor etkisi ve refund sonrası financial correction resmi audit kaydı üretmelidir.

### AU-102 — Payout batch / payable / paid / failed auditlenir

**Binding Rule:** Batch-level ve line-level payout sonuçları ayrı audit izine sahip olmalıdır.

### AU-103 — Finance hold / release auditlenir

**Binding Rule:** Payout veya settlement akışını etkileyen hold/release kararları reason ile auditlenir.

### AU-104 — Settled ile paid_out ayrımı auditte korunur

**Binding Rule:** Settlement tamamlanması ile dış ödeme çıkışı tamamlanması aynı audit aksiyonu değildir.

---

## 18. Config / rule change audit ailesi

### AU-110 — Business-config değişimleri auditlenir

**Binding Rule:** Reward oranı, pricing margin rule, coupon limit, risk threshold, moderation toggle gibi config değişimleri audit zorunludur.

### AU-111 — Config diff görünür olmalıdır

**Binding Rule:** Audit kaydı old_value/new_value veya eşdeğer diff referansı taşımalıdır.

### AU-112 — Kritik config change approval chain görünür olmalıdır

**Binding Rule:** Gerekli alanlarda actor, reason ve approval chain bağlamı audit içine yansıtılmalıdır.

---

## 19. Manual override audit ailesi

### AU-120 — Manual override ayrı family altında tutulur

**Binding Rule:** İstisna, bypass, force-action ve override davranışları manual_override family ile izlenir.

### AU-121 — Override without reason yasaktır

**Binding Rule:** Reason_code ve actor bağlamı olmadan override audit’i eksik kabul edilir.

### AU-122 — Override önce/sonra etkiyi taşımalıdır

**Binding Rule:** Hangi hedefin hangi alanı override edildi, önceki durum neydi, yeni etki ne oldu soruları auditte görünmelidir.

---

## 20. Result state standardı

Canonical audit result_state:

* `accepted`
* `completed`
* `rejected`
* `blocked`
* `failed`
* `under_review`
* `released`
* `reconciled`
* `duplicate_ignored`

Net kural:

* `accepted` ile `completed` aynı değildir
* `blocked` ile `rejected` aynı değildir
* `reconciled` correction sonrası resmi sonucu gösterebilir

---

## 21. Faz-1 minimum audit zorunluluk seti

İlk fazda aşağıdaki aksiyon seti audit zorunlu kabul edilir:

1. creator / supplier approval-reject-restrict-suspend-reactivate
2. product acceptance approve-reject-revision
3. campaign activate-pause-close
4. coupon create-disable-sponsor-model change
5. checkout invalidation / expiry / ready_for_payment kritik geçişleri
6. payment unknown-result / reconciled / refund result
7. order create / order correction
8. shipment delivered / delivery_failed / entitlement open
9. return approve-reject / refund correction
10. moderation approve-reject-restrict-take_down
11. risk hold / release / suppression
12. settlement create-adjust-settle
13. payout create-payable-paid-failed
14. critical config/rule changes
15. manual override / exception actions

---

## 22. Faz-1 dışında bırakılan alanlar

* tüm read-only görüntüleme hareketlerinin auditlenmesi
* storage/retention detay matrisi
* full legal hold / export prosedürü
* düşük etkili UI davranışlarının audit zorunluluğu
* genel telemetry akışlarının audit kapsamına alınması

---

## 23. Kısa sonuç

Bu taksonomi ile aşağıdaki çekirdek kararlar sert biçimde sabitlenmiş olur:

* Audit, event’ten ayrı resmi kayıt katmanıdır
* Protected action, lifecycle kararı, moderation, risk hold ve finansal correction audit zorunlu alandır
* Actor, target, reason, result ve correlation kritik audit için asgari zorunluluktur
* Hold, release, reconciliation ve override ayrı audit izleri üretir
* Accepted ile completed, settled ile paid_out aynı audit sonucu değildir
* Audit overwrite edilmez; correction yeni audit kaydı üretir

Bu dosya, Aşama 11’in bağlayıcı ve yoruma kapalı audit referansıdır.
