# APPROVAL_FLOW_PACK

## 1. Amaç

Bu dosya, platformdaki kritik onay, red, revizyon, kısıtlama, askı, release ve override kararlarının hangi owner zinciriyle, hangi review seviyesinde ve hangi kayıt disipliniyle yürütüleceğini bağlayıcı biçimde tanımlar.

Bu dosyanın amacı:

* creator ve supplier başvuru akışlarını kanonik hale getirmek
* lifecycle, moderation, finance, payout ve operasyon tarafındaki kararları onay zinciriyle netleştirmek
* tek göz kararı ile çift onay gerektiren kararları birbirinden ayırmak
* panel direct write yerine protected action + approval + audit modelini sabitlemektir

Net kural:

* Her karar aynı onay derinliğiyle alınmaz
* Her review approval üretmez
* Revision request ile rejection aynı şey değildir
* Restriction ile suspension aynı şey değildir
* Hold ile reject aynı şey değildir
* Final approver açık değilse high-governance karar resmi sayılmaz
* Audit ve protected action completion olmadan approval tamamlanmış sayılmaz

---

## 2. Kapsam

Bu paket ilk fazda aşağıdaki approval ailelerini kapsar:

1. creator application approval flow
2. supplier application approval flow
3. creator restriction / suspension flow
4. supplier restriction / suspension flow
5. product acceptance approval flow
6. campaign / coupon approval flow
7. moderation approval / reject / restrict flow
8. risk hold / release advisory flow
9. payment / refund correction approval flow
10. payout hold / release approval flow
11. manual override / exception approval flow
12. upper-admin approval flow

Bu dosya aşağıdaki alanları tam prosedür seviyesinde açmaz:

* bireysel kişi bazlı görev dağılımı
* vardiya ve organizasyon detayları
* dış hukuk / compliance onay süreci
* teknik deployment / release approval süreçleri

---

## 3. Temel ilkeler

### AF-001 — Approval, owner truth yerine geçmez

**Binding Rule:** Approval kararı owner sisteme protected action veya command üretir; panel doğrudan truth mutate etmez.

### AF-002 — Review ile final approval aynı şey değildir

**Binding Rule:** İnceleme yapılmış olması nihai karar verildiği anlamına gelmez; review sonucu revision, reject, hold veya escalate_up olabilir.

### AF-003 — Tek göz ve çift göz kararları ayrıdır

**Binding Rule:** Düşük etkili kararlar tek owner review ile çıkabilir; kritik lifecycle, finance, payout ve override kararları ikinci göz veya üst onay gerektirir.

### AF-004 — Revision request pozitif/negatif son karar değildir

**Binding Rule:** Revision request başvuruyu veya vakayı kapatmaz; eksik/güçlendirme ihtiyacıyla geri döndürür.

### AF-005 — Approval flow history-first çalışır

**Binding Rule:** Draft, review, approved, rejected, restricted, suspended, released gibi adımlar ayrı kayıt ve audit izi bırakmalıdır.

### AF-006 — Approval without reason yasaktır

**Binding Rule:** Kritik approval/reject/restrict/suspend/release kararları reason_code olmadan resmi kabul edilmez.

### AF-007 — Risk advisory ile final domain kararı ayrıdır

**Binding Rule:** Risk ekibi signal ve görüş üretir; creator/supplier/payout/finance nihai kararı ilgili owner verir veya onay zincirinde birlikte verir.

### AF-008 — Secondary review görüş üretir, final approver resmi kararı sabitler

**Binding Rule:** Secondary reviewer zorunlu ikinci göz olabilir; fakat high-governance ailelerde final kararı explicit approver verir.

### AF-009 — Approved ile executed aynı şey değildir

**Binding Rule:** Approval outcome üretildikten sonra owner protected action tamamlanmadan lifecycle/state sonucu resmileşmez.

---

## 4. Approval seviye modeli

### Level-1: Single-owner approval

Tek domain owner veya yetkili admin kararıyla çıkabilen kararlar.

Örnek karakter:

* düşük etkili revision request
* standart moderation kararı
* düşük riskli kategori review

### Level-2: Owner + secondary review

Primary owner karar verir ama ikinci görüş veya doğrulama gereklidir.

Örnek karakter:

* creator restriction
* supplier quality restriction
* payout release after risk concern

### Level-3: High-governance approval

Üst admin veya özel yetkili approval chain gerektiren kararlar.

Örnek karakter:

* kalıcı kapatma
* kritik manual override
* yüksek etkili payout release
* geniş kapsamlı campaign/policy exception

Net kural:

* Her approval family hangi level’da çalıştığını açıkça taşımalıdır
* Level-3 kararlar tek operatör inisiyatifiyle kapanmaz
* Level-2 kararlar secondary review olmadan finalleşmez

---

## 5. Approval rol standardı

### Primary Owner

Domain ownership ve karar taslağının sahibidir.

### Secondary Reviewer

İkinci göz, çapraz domain doğrulaması veya zorunlu advisory review sağlar.

### Final Approver

Yalnız high-governance veya özel kritik ailelerde resmi son kararı verir.

Net kural:

* Primary owner her zaman bellidir
* Secondary reviewer sessizce final approver yerine geçemez
* Final approver olmayan aktör Level-3 sonucu resmileştiremez

---

## 6. Approval sonuç standardı

Canonical approval outcome ailesi:

* `approved`
* `rejected`
* `revision_requested`
* `restricted`
* `suspended`
* `held`
* `released`
* `escalated_up`
* `no_action`

Net kural:

* `approved` ile `activated` aynı şey değildir
* `held` ile `rejected` aynı şey değildir
* `released` ile `approved` aynı şey değildir
* `no_action` karar yokluğu değil, resmi karar sonucudur

---

## 7. Approval completion standardı

Kritik approval ancak şu zincir tamamlanınca bitmiş sayılır:

1. review completed
2. approval outcome recorded
3. required secondary review / final approval completed
4. protected action dispatched
5. audit completion
6. gerekiyorsa downstream visibility/state update

Net kural:

* yalnız karar notu düşmek completion değildir
* yalnız audit yazmak completion değildir
* protected action tamamlanmadan executed outcome kabul edilmez

---

## 8. Creator application approval flow

### AF-010 — Creator application base flow

**Approval Family:** creator_application
**Approval Level:** Level-2
**Primary Owner:** `creator_admin`
**Secondary Reviewer:** `risk_ops`
**Final Approver:** yok; primary owner resmi kararı verir

**Canonical Steps:**

1. application_received
2. preliminary_review
3. risk/context_review if needed
4. decision_draft
5. approved / rejected / revision_requested
6. protected action for lifecycle preparation
7. active only after lifecycle activation completes

**Allowed Outcomes:**

* approved
* rejected
* revision_requested
* escalated_up

**Forbidden Shortcuts:**

* takipçi sayısıyla otomatik approval
* risk görüşü gereken dosyada risksiz varsayım
* approved -> direct active kabulü

**Required Context:**

* identity/account correctness
* category fit
* content/store persona fit
* policy/risk review
* prior platform history if exists

### AF-011 — Creator approval ile active ayrıdır

**Binding Rule:** Başvuru onayı verilmesi self-service creator scope’un anında active açıldığı anlamına gelmez.

### AF-012 — Creator revision request kapanış değildir

**Binding Rule:** Eksik belge, profil netliği veya category fit sorunu varsa revision_requested sonucu başvuruyu sonlandırmaz.

---

## 9. Supplier application approval flow

### AF-020 — Supplier application base flow

**Approval Family:** supplier_application
**Approval Level:** Level-2
**Primary Owner:** `supplier_admin`
**Secondary Reviewer:** `risk_ops`
**Final Approver:** yok; primary owner resmi kararı verir

**Canonical Steps:**

1. application_received
2. document/capacity review
3. risk/compliance context review if needed
4. decision_draft
5. approved / rejected / revision_requested
6. protected action for supplier activation prep
7. active only after supplier lifecycle activation

**Allowed Outcomes:**

* approved
* rejected
* revision_requested
* escalated_up

**Forbidden Shortcuts:**

* belge eksikken approval
* upload capability doğrulanmadan active varsayımı
* approved -> unrestricted category access varsayımı

**Required Context:**

* company/info correctness
* category fit
* logistics capability
* quality expectation
* risk signals

### AF-021 — Supplier approval ile unrestricted operation aynı şey değildir

**Binding Rule:** Approval sonrası kategori/yükleme yetkileri ayrıca açılır; her kategori otomatik aktif olmaz.

---

## 10. Creator restriction / suspension flow

### AF-030 — Creator restriction flow

**Approval Family:** creator_restriction
**Approval Level:** Level-2
**Primary Owner:** `creator_admin`
**Secondary Reviewer:** `moderation_ops`, `risk_ops`
**Final Approver:** yok; primary owner resmi restriction kararını verir

**Canonical Steps:**

1. trigger_detected
2. evidence_bundle_review
3. severity assessment
4. secondary review if required
5. decision_draft
6. warning / restricted / no_action / escalated_up
7. protected action completion

**Allowed Outcomes:**

* warning
* restricted
* no_action
* escalated_up

**Forbidden Shortcuts:**

* destek şikayetiyle otomatik restriction
* sales drop tek başına restriction gerekçesi

### AF-031 — Creator suspension flow

**Approval Family:** creator_suspension
**Approval Level:** Level-3
**Primary Owner:** `creator_admin`
**Secondary Reviewer:** `risk_admin` veya `moderation_admin`
**Final Approver:** `commerce_admin` veya `super_admin`

**Canonical Steps:**

1. severe_trigger_detected
2. evidence + history review
3. secondary review
4. approval request up
5. suspended / no_action / restricted_instead
6. protected action completion

**Required Evidence:**

* repeated policy or quality issue, or
* severe trust/risk harm, or
* serious platform safety concern

**Binding Rule:** Suspend kararı tek operator notuyla çıkmaz; explicit final approver gerekir.

### AF-032 — Restriction ve suspension aynı şey değildir

**Binding Rule:** Kısmi daraltma mümkünse önce restriction değerlendirilir; her sorun suspend ile çözülmez.

---

## 11. Supplier restriction / suspension flow

### AF-040 — Supplier restriction flow

**Approval Family:** supplier_restriction
**Approval Level:** Level-2
**Primary Owner:** `supplier_admin`
**Secondary Reviewer:** `order_ops`, `delivery_ops`, `risk_ops`
**Final Approver:** yok; primary owner resmi kararı verir

**Canonical Steps:**

1. quality/ops trigger_detected
2. evidence review
3. category/upload impact assessment
4. secondary review
5. decision_draft
6. warning / restricted / extra_review_mode / no_action
7. protected action completion

**Allowed Outcomes:**

* warning
* restricted
* extra_review_mode
* no_action
* escalated_up

**Forbidden Shortcuts:**

* tekil küçük hata ile tam suspend
* supplier panel davranışını owner truth kabul etme

### AF-041 — Supplier suspension flow

**Approval Family:** supplier_suspension
**Approval Level:** Level-3
**Primary Owner:** `supplier_admin`
**Secondary Reviewer:** `operations_admin`, `risk_admin`
**Final Approver:** `commerce_admin` veya `super_admin`

**Binding Rule:** Sürekli kalite bozulması, ağır sahtecilik şüphesi veya ciddi operasyon güven sorunu varsa suspend explicit upper approval ile çıkar.

---

## 12. Product acceptance approval flow

### AF-050 — Product acceptance flow

**Approval Family:** product_acceptance
**Approval Level:** Level-1 veya bağlama göre Level-2
**Primary Owner:** `commerce_admin`
**Secondary Reviewer:** gerekirse `supplier_admin`, `risk_ops`
**Final Approver:** yok

**Canonical Steps:**

1. submission_received
2. data/media/category review
3. risk/quality review if needed
4. approved / rejected / revision_requested / held
5. protected action completion

**Allowed Outcomes:**

* approved
* rejected
* revision_requested
* held

**Binding Rule:** Onaysız ürün fenomene/havuza açılmaz ve approval product publish truth yerine geçmez; owner action gerekir.

---

## 13. Campaign / coupon approval flow

### AF-060 — Campaign lifecycle approval

**Approval Family:** campaign_control
**Approval Level:** Level-1 normalde, Level-3 exception’da
**Primary Owner:** `commerce_admin`
**Secondary Reviewer:** `finance_ops` sponsor/margin etkisi varsa
**Final Approver:** exception varsa `super_admin` veya yetkili üst admin

**Canonical Steps:**

1. campaign draft review
2. scope + policy check
3. finance/promotion consistency check if needed
4. approve_activate / reject / revise / hold
5. protected action completion

### AF-061 — Coupon sponsor / exception approval

**Approval Family:** coupon_control
**Approval Level:** Level-2
**Primary Owner:** `commerce_admin`
**Secondary Reviewer:** `finance_ops`
**Final Approver:** yok, normal akışta primary owner resmi kararı verir

**Binding Rule:** Sponsor attribution, margin/corridor etkisi ve creator coupon boundary review edilmeden approval çıkmaz.

### AF-062 — Promotion exception / override

**Approval Family:** promotion_override
**Approval Level:** Level-3
**Primary Owner:** `commerce_admin`
**Secondary Reviewer:** `finance_admin`
**Final Approver:** `super_admin` veya yetkili üst admin

**Binding Rule:** Campaign-active üründe creator coupon exception gibi kararlar explicit high-governance approval gerektirir.

---

## 14. Moderation approval flow

### AF-070 — Standard moderation flow

**Approval Family:** moderation_standard
**Approval Level:** Level-1
**Primary Owner:** `moderation_ops`
**Secondary Reviewer:** yok
**Final Approver:** yok

**Canonical Steps:**

1. item_received
2. review
3. approved / rejected / restricted / taken_down
4. protected visibility action
5. audit completion

### AF-071 — High-risk moderation flow

**Approval Family:** moderation_high_risk
**Approval Level:** Level-2
**Primary Owner:** `moderation_ops`
**Secondary Reviewer:** `risk_ops`, gerektiğinde `creator_admin`
**Final Approver:** yok; primary owner resmi moderation sonucunu verir

**Binding Rule:** High-risk item tek moderatör hızlı kararıyla kapatılamaz; second review veya coordinated review gerekir.

### AF-072 — User delete request ile platform takedown ayrılır

**Binding Rule:** Kullanıcı silme talebi approval flow’u ile platform moderasyon kararı aynı approval family altında ezilmez.

---

## 15. Risk hold / release advisory flow

### AF-080 — Risk hold flow

**Approval Family:** risk_hold
**Approval Level:** Level-2
**Primary Owner:** `risk_ops`
**Secondary Reviewer:** etkilenen domain owner (`finance_ops`, `payout_ops`, `moderation_ops`, `creator_admin`, `supplier_admin`)
**Final Approver:** yok; risk advisory üretir, domain owner resmi action’ı çıkarır

**Binding Rule:** Risk hold önerisi doğrudan domain kararına dönüşmez; target domain owner uygun action’ı resmileştirir.

### AF-081 — Risk release flow

**Approval Family:** risk_release
**Approval Level:** Level-2
**Primary Owner:** ilgili domain owner
**Secondary Reviewer:** `risk_ops`
**Final Approver:** yok; normal akışta primary owner resmi action’ı verir

**Binding Rule:** Risk kaynaklı hold olan alanda release için risk görüşü kapanmadan final release çıkarılamaz.

---

## 16. Payment / refund correction approval flow

### AF-090 — Payment correction / reconciliation approval

**Approval Family:** finance_correction
**Approval Level:** Level-2
**Primary Owner:** `finance_ops`
**Secondary Reviewer:** `finance_admin`, gerektiğinde `risk_ops`
**Final Approver:** yok; kritik correction’da `finance_admin` explicit second review verir

**Canonical Steps:**

1. unknown_result or discrepancy detected
2. evidence/correlation review
3. correction draft
4. secondary review if required
5. reconciled / failed / refund_required / no_action
6. protected finance action
7. audit completion

**Binding Rule:** Unknown-result veya disputed payment support notuyla kapanmaz; finance correction flow gerekir.

### AF-091 — Refund correction approval

**Approval Family:** refund_correction
**Approval Level:** Level-2
**Primary Owner:** `finance_ops`
**Secondary Reviewer:** `order_ops` veya `support_ops` context için
**Final Approver:** yok

**Binding Rule:** Refund correction line-level bağlam taşımalıdır; order-total kaba karar yasaktır.

---

## 17. Payout hold / release approval flow

### AF-100 — Payout hold flow

**Approval Family:** payout_hold
**Approval Level:** Level-2
**Primary Owner:** `payout_ops`
**Secondary Reviewer:** `finance_ops` veya `risk_ops`
**Final Approver:** yok; normal hold primary owner tarafından resmileşir

**Allowed Outcomes:**

* held
* no_action
* escalated_up

### AF-101 — Payout release flow

**Approval Family:** payout_release
**Approval Level:** Level-2 veya kritik durumda Level-3
**Primary Owner:** `payout_ops`
**Secondary Reviewer:** `finance_ops`
**Risk Concern varsa:** `risk_ops`
**Final Approver:** kritik amount / kritik case ise `finance_admin` veya `super_admin`

**Binding Rule:** Hold reason finance/risk tabanlıysa release aynı tabanın görüşü olmadan çıkmaz.

### AF-102 — Payable ile paid_out aynı approval adımı değildir

**Binding Rule:** Payable state approval’ı, dış ödeme çıkışının tamamlandığı anlamına gelmez.

---

## 18. Manual override / exception flow

### AF-110 — Manual override flow

**Approval Family:** manual_override
**Approval Level:** Level-3
**Primary Owner:** ilgili domain owner
**Secondary Reviewer:** ilgili admin owner
**Final Approver:** `super_admin` veya üst yetkili admin

**Canonical Steps:**

1. exception request opened
2. justification bundle prepared
3. impact review
4. secondary review
5. upper approval
6. protected action execution
7. audit verification

**Required Conditions:**

* net gerekçe
* context tamlığı
* neden normal akış yeterli değil açıklaması
* etki alanı tanımı

**Forbidden Shortcuts:**

* chat/not üzerinden override
* audit’siz bypass
* tek kişiyle kritik exception kararı

---

## 19. Upper-admin approval flow

### AF-120 — High-governance upper approval

**Approval Family:** upper_admin_approval
**Approval Level:** Level-3
**Primary Owner:** ilgili domain owner
**Secondary Reviewer:** gerekiyorsa domain admin
**Final Approver:** `super_admin`

**Applies To:**

* kalıcı kapatma
* kritik payout release
* geniş etkili promotion exception
* yüksek etkili role/permission override
* çok domain etkileyen istisna

**Binding Rule:** Bu kararlar domain owner önerisiyle başlar ama son onay explicit upper approver tarafından tamamlanır.

---

## 20. Approval required evidence standardı

Kritik Level-2 / Level-3 kararlar için aşağıdaki kanıt aileleri gerekebilir:

* trigger summary
* history / repeated pattern
* impacted entities
* policy / rule reference
* risk / moderation / finance görüşü
* user / ticket / shipment / order / payout / creator / supplier bağlamı
* recommended action and why alternatives were insufficient

Net kural:

* Evidence yoksa kritik karar taslak seviyesini aşmaz
* Secondary review evidence’siz formaliteye dönüşemez

---

## 21. Approval + audit standardı

### AF-130 — Her kritik approval audit üretir

**Binding Rule:** Approved, rejected, restricted, suspended, held, released, escalated_up gibi sonuçlar audit kaydı üretmeden resmi kabul edilmez.

### AF-131 — Approval sonucu owner action ile tamamlanır

**Binding Rule:** Panel kararı tek başına yeterli değildir; owner modüle protected action/command geçmelidir.

### AF-132 — Correction yeni audit üretir

**Binding Rule:** Sonradan karar revizesi gerekiyorsa önceki approval sessiz overwrite edilmez.

### AF-133 — Approval completed ile executed ayrı izlenebilir

**Binding Rule:** Gerekli durumlarda approval_result ile protected_action_execution sonucu ayrı tarihsel adımlar olarak tutulmalıdır.

---

## 22. Faz-1 minimum zorunlu approval seti

İlk fazda aşağıdaki approval aileleri zorunlu kabul edilir:

1. creator application
2. supplier application
3. creator restriction / suspension
4. supplier restriction / suspension
5. product acceptance
6. coupon/campaign sponsor-policy review
7. moderation high-risk review
8. payment/refund correction
9. payout hold / release
10. manual override / upper admin approval

---

## 23. Faz-1 dışında bırakılan alanlar

* exhaustive appeal / restore flow matrix
* legal/compliance dedicated approval flows
* deployment/release engineering approvals
* HR / staffing / org approvals

---

## 24. Kısa sonuç

Bu paket ile aşağıdaki çekirdek kararlar sert biçimde sabitlenmiş olur:

* Approval review’dan ayrıdır
* Tek göz, ikinci göz ve final approver katmanları ayrıdır
* Revision request, rejection, hold, restriction, suspension ve release aynı sonuç değildir
* Creator/supplier approval active açılışla aynı şey değildir
* Risk advisory ile final domain action ayrıdır
* Unknown-result ve finance correction explicit owner onay akışı ister
* Manual override ve high-governance exception explicit upper approval olmadan çıkmaz
* Her kritik approval audit + protected action completion ile tamamlanır

Bu dosya, Aşama 12’nin bağlayıcı ve yoruma kapalı approval zinciri omurgasıdır.
