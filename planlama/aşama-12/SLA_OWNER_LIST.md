# SLA_OWNER_LIST

## 1. Amaç

Bu dosya, platformdaki kritik operasyon, destek, teslimat, moderasyon, risk, finans ve lifecycle akışlarında hangi vaka ailesinin hangi owner tarafından hangi SLA sınıfıyla yönetileceğini bağlayıcı biçimde tanımlar.

Bu dosyanın amacı:

* escalation matrisindeki SLA sınıflarını somut owner sorumluluğuna bağlamak
* first response, owner acceptance ve resolution beklentilerini netleştirmek
* "kim bakar", "kim devralır", "saat ne zaman başlar", "ne zaman durur", "ne zaman üst seviyeye çıkar" sorularını yoruma kapatmak
* support, operations, finance, moderation, risk ve admin tarafında kayıp vaka oluşmasını önlemektir

Net kural:

* SLA yalnız süre değil, ownership taahhüdüdür
* Owner belli değilse SLA başlamış sayılmaz
* Waiting_user ile waiting_internal aynı değildir
* Accepted ile resolved aynı şey değildir
* Resolved ile closed aynı şey değildir
* SLA breach sessiz kalamaz; escalation üretmelidir

---

## 2. Kapsam

Bu liste ilk fazda aşağıdaki SLA ailelerini kapsar:

1. support triage SLA
2. order operations SLA
3. shipment / delivery anomaly SLA
4. payment / refund / finance SLA
5. payout hold / release SLA
6. moderation SLA
7. risk review SLA
8. creator lifecycle SLA
9. supplier lifecycle SLA
10. commerce rule / promotion SLA
11. technical incident / critical flow SLA
12. admin upper approval SLA

Bu dosya aşağıdaki alanları tam vardiya-planı seviyesinde açmaz:

* ekip çalışma saatleri
* bölgesel rota / vardiya farkları
* bireysel ajan bazlı performans kotası
* personel sayısı planlaması

---

## 3. SLA modeli

Her SLA girdisi şu mantıkla okunur:

* **SLA ID**
* **Case Family**
* **Primary Owner**
* **Secondary / Consulted Owner**
* **SLA Class**
* **First Response Expectation**
* **Owner Acceptance Expectation**
* **Resolution Standard**
* **Clock Start**
* **Clock Pause Conditions**
* **Clock Stop Condition**
* **Breach Action**

Net kural:

* First response kullanıcıya veya sisteme ilk anlamlı dönüşü ifade eder
* Owner acceptance, vakanın doğru owner tarafından resmen devralındığı andır
* Resolution standard resmi owner outcome + gerekli downstream action + audit/record completion mantığıyla düşünülür

---

## 4. SLA sınıf standardı

Canonical SLA class:

* `A-immediate-critical`
* `B-urgent-same-cycle`
* `C-priority-normal`
* `D-batched-review`

### 4.1 A-immediate-critical

Karakteri:

* finansal/güvenlik/işlem kritik akış
* kullanıcı veya sistem yüksek etki altında
* hızlı ilk temas ve hızlı owner devri gerekir

### 4.2 B-urgent-same-cycle

Karakteri:

* kritik ama her zaman kriz seviyesinde olmayan vaka
* aynı iş çevriminde gerçek çözüm hareketi beklenir

### 4.3 C-priority-normal

Karakteri:

* önemli ama kontrollü çözüm penceresi olan vaka
* doğru owner review ve kayıtlı çözüm bekler

### 4.4 D-batched-review

Karakteri:

* batch inceleme veya daha geniş değerlendirme penceresi uygundur
* düşük aciliyetli ama resmi sahiplik gerektiren vaka

Net kural:

* SLA class süre yerine öncelik + sahiplik + beklenen hız modelidir
* Kesin dakika/saat tabloları operasyonel alt belgede detaylandırılabilir; bu dosya owner ve sınıf mantığını sabitler

---

## 5. Saat davranışı standardı

### SLA-001 — Clock start

**Binding Rule:** Saat, vaka canonical biçimde açılıp minimal bağlam ve owner-adayı ile triage kuyruğuna düştüğünde başlar.

### SLA-002 — Clock pause

**Binding Rule:** Saat yalnız aşağıdaki açık koşullarda durabilir:

* `waiting_user` ve gerçekten kullanıcıdan bilgi gerekiyorsa
* `waiting_external` ve provider/taşıyıcı/doğrulama yanıtı bekleniyorsa
* `blocked` ve blok nedeni kayıtlıysa

### SLA-003 — Clock running

**Binding Rule:** Yanlış owner’da bekleyen, triage’da unutulan veya iç notla oyalanan vaka saat çalışmaya devam eder.

### SLA-004 — Clock stop

**Binding Rule:** Saat yalnız resmi owner outcome üretildiğinde ve vaka `resolved` veya uygun resmi sonuca geçtiğinde durur.

### SLA-005 — Reopen yeni takip penceresi başlatır

**Binding Rule:** Reopened vaka history’yi korur ama yeni çözüm penceresi ayrıca izlenir.

---

## 6. Owner standardı

Canonical primary owner:

* `support_ops`
* `order_ops`
* `delivery_ops`
* `finance_ops`
* `payout_ops`
* `moderation_ops`
* `risk_ops`
* `creator_admin`
* `supplier_admin`
* `commerce_admin`
* `system_admin`

Canonical secondary / consulted owner:

* `support_admin`
* `operations_admin`
* `finance_admin`
* `moderation_admin`
* `risk_admin`
* `commerce_admin`
* `super_admin`

Net kural:

* Tek vakada bir primary owner vardır
* Secondary owner görüş verir veya review zincirine girer; final vaka sahipliğini devralmaz

---

## 7. Resolution standardı

Kritik vaka ailelerinde resolution en az şu dört parçayla düşünülmelidir:

1. **official owner outcome**
2. **gerekli downstream signal / action**
3. **audit veya resmi kayıt completion**
4. **user/system visibility update** gerekiyorsa

Net kural:

* yalnız kullanıcıya cevap verilmesi resolution değildir
* yalnız vaka notu düşülmesi resolution değildir
* owner outcome olmadan resolved state kabul edilmez

---

## 8. Support triage SLA ailesi

### SLA-010 — Genel support triage

**Case Family:** support_ticket_triage
**Primary Owner:** `support_ops`
**Secondary Owner:** bağlama göre değişir
**SLA Class:** `B-urgent-same-cycle`

**First Response Expectation:**

* ticket görüldü ve triage başladı bilgisi üretilebilir
* kullanıcı kritik durumda ise kontrollü durum mesajı verilir

**Owner Acceptance Expectation:**

* doğru queue ve doğru owner belirlenmiş olmalı

**Resolution Standard:**

* support-owned vakada official support outcome, veya
* support-owned olmayan vakada resmi handoff completion + context integrity

**Clock Start:** ticket canonical şekilde opened/triaged olduğunda
**Clock Pause Conditions:** waiting_user
**Clock Stop Condition:** doğru owner’a kayıtlı handoff veya support-owned vaka için resmi outcome
**Breach Action:** `support_admin` ve gerekirse ilgili domain owner’a escalation

### SLA-011 — Tekrar açılan support vakası

**Case Family:** reopened_support_ticket
**Primary Owner:** `support_ops`
**SLA Class:** `B-urgent-same-cycle`
**Binding Rule:** Reopened vaka yeni talep gibi değil, ilişkili vaka olarak hızlandırılmış triage alır.

---

## 9. Order operations SLA ailesi

### SLA-020 — Operasyona düşen sipariş darboğazı

**Case Family:** order_operation_block
**Primary Owner:** `order_ops`
**Secondary Owner:** `supplier_admin`, `delivery_ops`
**SLA Class:** `B-urgent-same-cycle`

**First Response Expectation:**

* vaka görüldü, problem tipi sınıflandı

**Owner Acceptance Expectation:**

* ilgili line/package/supplier bağlamı devralındı

**Resolution Standard:**

* order ops official outcome
* line/package düzeyinde net durum
* gerekiyorsa shipment/support downstream action
* resmi kayıt completion

**Clock Start:** problemli operasyon state’i veya escalation açıldığında
**Clock Pause Conditions:** waiting_external (supplier/taşıyıcı doğrulaması)
**Clock Stop Condition:** problem state’i resmi outcome’a bağlandığında
**Breach Action:** `operations_admin` ve gerekiyorsa `supplier_admin`

### SLA-021 — Kısmi operasyon tıkanması

**Case Family:** partial_operation_stall
**Primary Owner:** `order_ops`
**SLA Class:** `B-urgent-same-cycle`
**Binding Rule:** Tüm sipariş değil, etkilenen line/package owner bazında hızlandırılmış çözüm bekler.

---

## 10. Shipment / delivery anomaly SLA ailesi

### SLA-030 — Teslimat gecikmesi / anomaly

**Case Family:** delivery_anomaly
**Primary Owner:** `delivery_ops`
**Secondary Owner:** `support_ops`, `order_ops`
**SLA Class:** `A-immediate-critical` veya `B-urgent-same-cycle` bağlama göre

**First Response Expectation:**

* anomaly kabul edildi ve investigation başladı
* kullanıcıya dürüst ara durum gerekiyorsa support üzerinden verilir

**Owner Acceptance Expectation:**

* shipment/package bağlamı resmen devralınmalı

**Resolution Standard:**

* shipment official outcome
* support visibility update
* gerekiyorsa refund/return/entitlement downstream action
* resmi kayıt completion

**Clock Start:** anomaly trigger anında
**Clock Pause Conditions:** waiting_external (carrier confirmation)
**Clock Stop Condition:** resmi outcome veya kontrollü investigation state’i
**Breach Action:** `operations_admin`; kritikse `support_admin`

### SLA-031 — "Teslim edildi ama almadım"

**Case Family:** delivered_not_received
**Primary Owner:** `delivery_ops`
**Secondary Owner:** `support_ops`, `finance_ops` gerektiğinde
**SLA Class:** `A-immediate-critical`
**Binding Rule:** Bu vaka P1/A karakterindedir; sıradan teslimat sorusu gibi batch kuyruğa atılamaz.

---

## 11. Payment / refund / finance SLA ailesi

### SLA-040 — Payment unknown-result / ödeme belirsizliği

**Case Family:** payment_unknown_result
**Primary Owner:** `finance_ops`
**Secondary Owner:** `support_ops`, `order_ops`, `risk_ops`
**SLA Class:** `A-immediate-critical`

**First Response Expectation:**

* vaka finance reconciliation hattına alındı bilgisi

**Owner Acceptance Expectation:**

* payment_ref / correlation bağlamı devralınmış olmalı

**Resolution Standard:**

* finance official outcome
* reconciled/corrected/finally_failed/finally_confirmed sonucu
* order/settlement/payout downstream action gerekiyorsa
* audit completion

**Clock Start:** unknown_result tespit edildiğinde
**Clock Pause Conditions:** waiting_external (provider confirmation)
**Clock Stop Condition:** reconciliation sonucu netleştiğinde
**Breach Action:** `finance_admin`, gerekirse `super_admin`

### SLA-041 — Refund completion gecikmesi

**Case Family:** refund_delay_or_failure
**Primary Owner:** `finance_ops`
**SLA Class:** `B-urgent-same-cycle`
**Resolution Standard:** finance official refund outcome + gerekli correction + kayıt completion

### SLA-042 — Çift çekim / yanlış tutar

**Case Family:** payment_amount_dispute
**Primary Owner:** `finance_ops`
**Secondary Owner:** `support_ops`
**SLA Class:** `A-immediate-critical`
**Resolution Standard:** finance official dispute outcome + gerekiyorsa correction/refund + audit completion

### SLA-043 — Kupon sponsor / finans correction anlaşmazlığı

**Case Family:** promotion_finance_dispute
**Primary Owner:** `finance_ops`
**Secondary Owner:** `commerce_admin`
**SLA Class:** `C-priority-normal`
**Resolution Standard:** sponsor attribution outcome + gerekiyorsa settlement correction + kayıt completion

---

## 12. Payout hold / release SLA ailesi

### SLA-050 — Payout hold incelemesi

**Case Family:** payout_hold_review
**Primary Owner:** `payout_ops`
**Secondary Owner:** `finance_ops`, `risk_ops`
**SLA Class:** `B-urgent-same-cycle`

**First Response Expectation:**

* hold reason doğrulandı ve vaka sahibine alındı

**Owner Acceptance Expectation:**

* actor, batch, line veya balance bağlamı devralındı

**Resolution Standard:**

* payout official outcome
* hold / release / retry / correction sonucu
* finance/risk downstream sync
* audit completion

**Clock Start:** hold veya release talebi açıldığında
**Clock Pause Conditions:** waiting_internal (risk/finance opinion), waiting_external gerekiyorsa
**Clock Stop Condition:** resmi hold/release outcome
**Breach Action:** `finance_admin`, kritik durumda `super_admin`

### SLA-051 — Risk kaynaklı payout release

**Case Family:** payout_release_after_risk_hold
**Primary Owner:** `payout_ops`
**Secondary Owner:** `risk_ops`
**SLA Class:** `B-urgent-same-cycle`
**Binding Rule:** Risk görüşü gelmeden saat tamamen durmaz; vaka waiting_internal altında izlenmeye devam eder.

---

## 13. Moderation SLA ailesi

### SLA-060 — Standart moderation incelemesi

**Case Family:** moderation_review
**Primary Owner:** `moderation_ops`
**Secondary Owner:** `support_ops` gerektiğinde
**SLA Class:** `C-priority-normal`
**Resolution Standard:** moderation official outcome + visibility effect + audit completion

### SLA-061 — High-risk moderation

**Case Family:** high_risk_moderation_case
**Primary Owner:** `moderation_ops`
**Secondary Owner:** `risk_ops`, gerektiğinde `creator_admin`
**SLA Class:** `B-urgent-same-cycle`

**First Response Expectation:**

* item review kuyruğuna alındı ve severity doğrulandı

**Owner Acceptance Expectation:**

* moderation item + actor bağlamı devralındı

**Resolution Standard:**

* moderation official outcome
* gerekiyorsa creator/risk downstream signal
* audit completion

**Clock Start:** moderation escalation açıldığında
**Clock Pause Conditions:** waiting_internal (risk görüşü gerekiyorsa)
**Clock Stop Condition:** resmi moderation kararı
**Breach Action:** `moderation_admin`

---

## 14. Risk review SLA ailesi

### SLA-070 — Fraud / abuse risk review

**Case Family:** risk_case_review
**Primary Owner:** `risk_ops`
**Secondary Owner:** `finance_ops`, `moderation_ops`, `support_ops`
**SLA Class:** `B-urgent-same-cycle` veya `A-immediate-critical` bağlama göre

**First Response Expectation:**

* risk case açıldı ve signal family doğrulandı

**Owner Acceptance Expectation:**

* case primary analyst/team tarafından devralındı

**Resolution Standard:**

* risk official outcome
* hold / release / restrict / false_positive sonucu
* affected domain downstream action
* audit completion

**Clock Start:** risk_case_opened anında
**Clock Pause Conditions:** waiting_external nadir; çoğunlukla saat çalışır
**Clock Stop Condition:** risk outcome resmi üretildiğinde
**Breach Action:** `risk_admin`

### SLA-071 — Account takeover suspicion

**Case Family:** account_takeover_suspicion
**Primary Owner:** `risk_ops`
**Secondary Owner:** `support_ops`, `system_admin`
**SLA Class:** `A-immediate-critical`
**Resolution Standard:** risk official outcome + gerekli access/security action + audit completion

---

## 15. Creator lifecycle SLA ailesi

### SLA-080 — Creator başvuru incelemesi

**Case Family:** creator_application_review
**Primary Owner:** `creator_admin`
**Secondary Owner:** `risk_ops`, `commerce_admin`
**SLA Class:** `C-priority-normal`
**Resolution Standard:** approved/rejected/revision_requested official outcome + lifecycle preparation + audit completion

### SLA-081 — Creator restriction / suspension review

**Case Family:** creator_restriction_review
**Primary Owner:** `creator_admin`
**Secondary Owner:** `moderation_ops`, `risk_ops`, `support_ops`
**SLA Class:** `B-urgent-same-cycle`

**First Response Expectation:**

* vaka severity ve trigger nedeni doğrulandı

**Owner Acceptance Expectation:**

* creator profile, history ve sinyal seti devralındı

**Resolution Standard:**

* creator lifecycle official outcome
* warning/restriction/suspension/reactivation sonucu
* downstream scope/visibility/category action
* audit completion

**Clock Start:** escalation açıldığı anda
**Clock Pause Conditions:** waiting_internal (risk/moderation görüşü)
**Clock Stop Condition:** resmi lifecycle kararı
**Breach Action:** `commerce_admin`

---

## 16. Supplier lifecycle SLA ailesi

### SLA-090 — Supplier başvuru incelemesi

**Case Family:** supplier_application_review
**Primary Owner:** `supplier_admin`
**Secondary Owner:** `risk_ops`, `commerce_admin`
**SLA Class:** `C-priority-normal`
**Resolution Standard:** approved/rejected/revision_requested official outcome + activation prep + audit completion

### SLA-091 — Supplier quality / restriction review

**Case Family:** supplier_quality_restriction_review
**Primary Owner:** `supplier_admin`
**Secondary Owner:** `order_ops`, `delivery_ops`, `risk_ops`
**SLA Class:** `B-urgent-same-cycle`

**First Response Expectation:**

* quality trigger family doğrulandı

**Owner Acceptance Expectation:**

* supplier history + affected categories/operations devralındı

**Resolution Standard:**

* supplier lifecycle official outcome
* warning/restriction/upload_limit/suspension sonucu
* downstream category/upload/ops action
* audit completion

**Clock Start:** supplier escalation açıldığında
**Clock Pause Conditions:** waiting_internal (ops/quality review)
**Clock Stop Condition:** resmi supplier lifecycle kararı
**Breach Action:** `commerce_admin`

---

## 17. Commerce rule / promotion SLA ailesi

### SLA-100 — Campaign / coupon policy review

**Case Family:** commerce_rule_review
**Primary Owner:** `commerce_admin`
**Secondary Owner:** `finance_ops`, `creator_admin`
**SLA Class:** `C-priority-normal`
**Resolution Standard:** policy official outcome + gerekiyorsa hold/disable/correction request + audit completion

### SLA-101 — Margin / corridor / sponsor conflict

**Case Family:** promotion_rule_conflict
**Primary Owner:** `commerce_admin`
**Secondary Owner:** `finance_ops`
**SLA Class:** `B-urgent-same-cycle`

**First Response Expectation:**

* policy conflict kayda alındı ve scope doğrulandı

**Owner Acceptance Expectation:**

* coupon/campaign/order context devralındı

**Resolution Standard:**

* policy owner official outcome
* gerekiyorsa finance correction / promotion hold
* audit completion

**Clock Start:** commerce escalation açıldığında
**Clock Pause Conditions:** waiting_internal (finance görüşü)
**Clock Stop Condition:** policy owner sonucu ve gerekiyorsa correction talebi
**Breach Action:** `finance_admin` ve gerektiğinde `super_admin`

---

## 18. Technical incident / critical flow SLA ailesi

### SLA-110 — Kritik teknik akış kırılması

**Case Family:** technical_critical_flow_incident
**Primary Owner:** `system_admin`
**Secondary Owner:** `support_ops`, `finance_ops`, `order_ops`
**SLA Class:** `A-immediate-critical`

**First Response Expectation:**

* incident kabul edildi, etki alanı sınıflandı

**Owner Acceptance Expectation:**

* teknik owner/responsible team vaka sahipliğini aldı

**Resolution Standard:**

* official incident outcome
* containment/recovery/reconciliation planı
* downstream bilgilendirme
* incident/audit history completion

**Clock Start:** incident canonical açıldığında
**Clock Pause Conditions:** yok denecek kadar sınırlı; saat esasen çalışır
**Clock Stop Condition:** resmi recovery / containment sonucu
**Breach Action:** `super_admin`

### SLA-111 — Event/audit lineage bozulması

**Case Family:** lineage_integrity_incident
**Primary Owner:** `system_admin`
**Secondary Owner:** `finance_ops`, `risk_ops`
**SLA Class:** `A-immediate-critical`
**Resolution Standard:** lineage official recovery outcome + gerekiyorsa reconciliation/backfill planı + audit completion

---

## 19. Admin upper approval SLA ailesi

### SLA-120 — High-governance approval

**Case Family:** upper_admin_approval
**Primary Owner:** ilgili domain owner
**Secondary Owner / Approver:** `super_admin`
**SLA Class:** `B-urgent-same-cycle` veya `C-priority-normal` bağlama göre

**First Response Expectation:**

* approval request alındı ve kapsam doğrulandı

**Owner Acceptance Expectation:**

* gerekli context, reason ve audit draft hazır

**Resolution Standard:**

* approval official outcome
* owner protected action completion
* audit completion

**Clock Start:** upper approval request açıldığında
**Clock Pause Conditions:** waiting_internal yalnız açık approver bekleme halinde
**Clock Stop Condition:** approval chain tamamlandığında
**Breach Action:** üst yönetim / `super_admin` uyarısı

---

## 20. Waiting ve blocked standardı

### SLA-130 — waiting_user

**Binding Rule:** Kullanıcıdan gerçekten yeni bilgi / belge / doğrulama bekleniyorsa saat durabilir.

### SLA-131 — waiting_internal

**Binding Rule:** İç ekip görüşü bekleniyor diye vaka unutulmuş sayılmaz; owner görünürlüğü sürer.

### SLA-132 — waiting_external

**Binding Rule:** Taşıyıcı / provider / dış doğrulama bekleniyorsa açık external dependency olarak işaretlenir.

### SLA-133 — blocked

**Binding Rule:** Teknik veya policy blok varsa ayrıca blocked_reason zorunludur.

---

## 21. Breach standardı

### SLA-140 — SLA breach sessiz kalamaz

**Binding Rule:** First response, acceptance veya resolution breach’i olduğunda otomatik escalation, owner reminder veya admin görünürlüğü oluşmalıdır.

### SLA-141 — Tekrarlı breach kalite sinyalidir

**Binding Rule:** Aynı family’de tekrarlayan breach ilgili owner/team için kalite sinyali üretir.

### SLA-142 — Breach kapatmak çözüm değildir

**Binding Rule:** Breach işaretini kaldırmak için resmi outcome gerekir; yalnız not düşmek yeterli değildir.

---

## 22. Faz-1 minimum zorunlu SLA kapsamı

İlk fazda aşağıdaki vaka aileleri SLA zorunlu kabul edilir:

1. support triage
2. payment unknown-result
3. delivered_not_received
4. refund delay / failure
5. payout hold / release
6. moderation high-risk case
7. risk case review
8. creator restriction review
9. supplier quality restriction review
10. technical critical flow incident

---

## 23. Faz-1 dışında bırakılan alanlar

* exact minute/hour target table
* vardiya ve hafta sonu farkları
* coğrafi SLA ayrımları
* kişi bazlı performans SLA’leri

Bu tür detaylar operasyonel alt belgelerde ayrı açılabilir.

---

## 24. Kısa sonuç

Bu liste ile aşağıdaki çekirdek kararlar sert biçimde sabitlenmiş olur:

* SLA bir süre tablosu değil, owner sorumluluk modelidir
* First response, owner acceptance ve resolution ayrı aşamalardır
* Waiting_user, waiting_internal, waiting_external ve blocked aynı şey değildir
* Support, order, delivery, finance, payout, moderation, risk, creator, supplier ve system aileleri ayrı owner SLA’si taşır
* Resolution için official owner outcome + downstream action + audit completion gerekir
* SLA breach otomatik görünürlük ve üst seviye aksiyon üretmelidir
* Resmi owner outcome olmadan çözüm tamamlanmış sayılmaz

Bu dosya, Aşama 12’nin bağlayıcı ve yoruma kapalı SLA referansıdır.
