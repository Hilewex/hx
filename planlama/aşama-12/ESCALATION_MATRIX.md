# ESCALATION_MATRIX

## 1. Amaç

Bu dosya, platformdaki kritik operasyon, destek, güvenlik, teslimat, finans ve yaşam döngüsü problemlerinde hangi olayın hangi ekibe, hangi öncelikle, hangi koşulda ve hangi kayıt disipliniyle escalate edileceğini bağlayıcı biçimde tanımlar.

Bu dosyanın amacı:

* escalation gerektiren olayları tek merkezli ve çakışmasız hale getirmek
* support, operasyon, moderasyon, risk, finance ve admin rollerinin sorumluluk zincirini netleştirmek
* "kim bakacak", "ne zaman bakacak", "hangi durumda üst seviyeye çıkacak" sorularını yoruma kapatmak
* kritik olayların sosyal mesaj, serbest chat veya kişisel inisiyatif seviyesinde çözülmesini önlemektir

Net kural:

* Her problem escalation gerektirmez
* Her escalation aynı seviyede başlamaz
* Owner belli olmadan escalation açılamaz
* Primary owner değişmeden secondary owner final ownership alamaz
* Panel direct write ile sessiz çözüm yapılamaz
* Escalation audit olmadan resmi kabul edilmez
* Escalation kapanışı reason ve outcome olmadan tamamlanmış sayılmaz

---

## 2. Kapsam

Bu matris ilk fazda aşağıdaki escalation ailelerini kapsar:

1. support ve ticket escalation
2. sipariş ve operasyon escalation
3. teslimat / shipment anomaly escalation
4. ödeme / refund / finance escalation
5. payout hold / release escalation
6. moderation escalation
7. fraud / risk escalation
8. creator lifecycle escalation
9. supplier lifecycle escalation
10. kampanya / kupon / ticari kural escalation
11. sistemsel / teknik kritik akış escalation
12. admin üst onay escalation

Bu dosya aşağıdaki alanları ayrıntılı prosedür seviyesinde açmaz:

* ekip vardiya planı
* insan kaynaklı organizasyon şeması
* canlı çağrı / telefon prosedürü
* dış hukuk / yasal süreç akışı

Bu alanlar operasyon rehberi ve SLA dokümanlarında detaylandırılır.

---

## 3. Temel ilkeler

### EM-001 — Escalation owner’sız açılamaz

**Binding Rule:** Her escalation kaydı bir primary owner, gerekirse secondary owner ve net target domain taşımalıdır.

### EM-002 — Escalation ticket’tan ayrı ama ticket ile bağlanabilir

**Binding Rule:** Her escalation ticket olmak zorunda değildir; ama support kaynaklı escalation ticket lineage taşımalıdır.

### EM-003 — Escalation state mutation yerine geçmez

**Binding Rule:** Escalation kararı owner sistemin truth’unu doğrudan değiştirmez; protected action / command veya review süreci başlatır.

### EM-004 — Severity ile priority aynı şey değildir

**Binding Rule:** Sorunun sistemsel ciddiyeti ile çözüm önceliği ayrı kavramlardır; ikisi birlikte değerlendirilir.

### EM-005 — Escalation history-first çalışır

**Binding Rule:** Bir escalation sessiz kapatılmaz, overwrite edilmez; handoff, reassign, hold, release ve close history’de ayrı görünür.

### EM-006 — Social channel resmi escalation alanı değildir

**Binding Rule:** Fenomen mesaj kutusu veya sosyal etkileşim kanalı resmi support/finance/risk escalation yerine geçmez.

### EM-007 — Manual override yalnız kurallı escalation üstünden yapılır

**Binding Rule:** Kritik operasyon, finance, moderation veya lifecycle alanlarında serbest manuel çözüm değil, kayıtlı escalation + audit + protected action modeli geçerlidir.

### EM-008 — Secondary owner görüş verir, primary owner final sahipliği taşır

**Binding Rule:** Secondary/consulted owner değerlendirme, görüş veya onay sağlayabilir; ancak Level-3 governance hariç final vaka sahipliği primary owner’da kalır.

### EM-009 — Upper approval ownership’i değil governance seviyesini değiştirir

**Binding Rule:** Üst onay devreye girdiğinde domain ownership transfer olmaz; yalnız kararın governance derinliği artar.

---

## 4. Escalation model bileşenleri

Her escalation kaydı en az şu alan mantığıyla düşünülmelidir:

* **Escalation ID**
* **Escalation Family**
* **Trigger Event / Trigger Condition**
* **Severity**
* **Priority**
* **Primary Owner**
* **Secondary Owner / Consulted Team** gerekirse
* **Escalation Level**
* **SLA Class**
* **Required Context**
* **Allowed Actions**
* **Forbidden Actions**
* **Resolution Standard**
* **Escalation Close Condition**

Net kural:

* "Birisi baksın" seviyesinde belirsiz escalation açılmaz
* Target domain, target entity ve beklenen çıktı belli olmalıdır
* Resolution standard belirtilmeden kritik escalation family tanımı tamamlanmış sayılmaz

---

## 5. Severity standardı

Canonical severity sınıfları:

* `S1-critical`
* `S2-high`
* `S3-medium`
* `S4-low`

### S1-critical

Aşağıdaki karakteri taşır:

* finansal veya güvenlik riski yüksek
* kritik iş akışı durmuş
* yanlış kapanırsa ciddi güven/para kaybı oluşur
* çoklu kullanıcı veya çoklu sipariş etkilenebilir

### S2-high

Aşağıdaki karakteri taşır:

* tekil ama kritik kullanıcı akışı bozulmuş
* sipariş/ödeme/teslimat/hesap erişimi ciddi etkilenmiş
* hızlı insan müdahalesi gerekir

### S3-medium

Aşağıdaki karakteri taşır:

* problem gerçek ama kısmi etkili
* SLA içinde ekip çözümüyle ilerleyebilir
* hemen üst yönetim onayı gerektirmez

### S4-low

Aşağıdaki karakteri taşır:

* düşük etkili veya bilgi tamamlama gerektiren durum
* kullanıcıyı bekletiyor olabilir ama kritik iş akışı durdurmaz

Net kural:

* Severity, kullanıcının duygusal tonu ile değil sistem etkisiyle belirlenir

---

## 6. Priority standardı

Canonical priority sınıfları:

* `P1-immediate`
* `P2-urgent`
* `P3-normal`
* `P4-batched`

Net kural:

* S1 çoğu durumda P1/P2 olur
* S4 çoğu durumda P3/P4 olur
* ama severity ve priority otomatik aynı değer değildir

---

## 7. Escalation level standardı

Canonical escalation level:

* `L1-domain-owner`
* `L2-domain-owner-plus-review`
* `L3-upper-governance`

### L1-domain-owner

Primary owner tek başına resmi outcome üretebilir.

### L2-domain-owner-plus-review

Primary owner outcome üretir; secondary review veya çapraz domain görüşü zorunludur.

### L3-upper-governance

Primary owner domain ownership’i korur; ancak final action için upper approver zinciri gerekir.

Net kural:

* L2, ownership devri değildir
* L3, governance escalation’dır; domain truth owner yine ilgili owner’dır

---

## 8. Owner standardı

Canonical primary owner aileleri:

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

Canonical secondary/consulted owner aileleri:

* `support_admin`
* `operations_admin`
* `finance_admin`
* `moderation_admin`
* `risk_admin`
* `commerce_admin`
* `super_admin`

Net kural:

* Her escalation’da tek primary owner vardır
* Birden fazla ekip involved olabilir ama final case ownership tekil kalır
* Secondary owner karar girişi üretir; case ownership’i sessizce üstlenemez

---

## 9. Escalation state standardı

Canonical escalation state:

* `opened`
* `triaged`
* `assigned`
* `in_progress`
* `waiting_internal`
* `waiting_external`
* `escalated_up`
* `blocked`
* `resolved`
* `closed`
* `reopened`

Net kural:

* `resolved` ile `closed` aynı değildir
* `blocked` ile `waiting_internal` aynı değildir
* `escalated_up` ayrı görünür olmalıdır

---

## 10. Resolution standardı

Kritik escalation family’lerinde resolution en az şu bileşenleri taşımalıdır:

1. **official owner outcome**
2. **gerekli downstream signal/action**
3. **audit completion**
4. **user/system visibility update** gerekiyorsa

Net kural:

* Yalnız yorum yazılması resolution değildir
* Yalnız kullanıcıya dönüş yapılması resolution değildir
* Official owner outcome olmadan critical escalation resolved sayılmaz

---

## 11. Support ve ticket escalation ailesi

### EM-010 — Support ticket escalation giriş kriteri

**Escalation Level:** `L1-domain-owner`
**Trigger Conditions:**

* ticket yanlış queue’ya düşmüş
* first-response SLA riske girmiş veya aşılmış
* kullanıcı kritik commerce akışında tıkanmış
* support ajanı domain owner olmadan çözüm üretemiyor
* aynı konuda tekrar açılan vaka var

**Primary Owner:** `support_ops`
**Secondary Owner:** ihtiyaca göre `order_ops`, `finance_ops`, `moderation_ops`, `risk_ops`

**Resolution Standard:**

* doğru queue / doğru owner handoff, veya
* support-owned vakada resmi çözüm + kayıt

**Allowed Actions:**

* triage
* queue change
* owner reassign
* escalation open
* internal note
* user-visible controlled update

**Forbidden Actions:**

* owner domain truth’a direct write
* financial finalization
* moderation final decision yerine geçme

**Close Condition:**

* doğru domain owner aksiyonu tamamlamış olmalı veya
* support-owned vaka resmi owner outcome ile kapanmış olmalı
* çözüm nedeni kayıtlı olmalı
* audit gerektiren alt akış varsa tamamlanmış olmalı

### EM-011 — Support escalation sosyal kanala taşınamaz

**Binding Rule:** Resmi support escalation’ı fenomen mesaj kutusuna veya serbest kullanıcı sohbetine devredilemez.

### EM-012 — Tekrar açılan support vakası kronik pattern olarak işaretlenir

**Binding Rule:** Aynı order / same actor / same issue family tekrarı varsa yeniden sıfırdan değil, ilişkili vaka mantığıyla ele alınır.

---

## 12. Sipariş ve operasyon escalation ailesi

### EM-020 — Order operation escalation tetikleri

**Escalation Level:** `L1-domain-owner`
**Trigger Conditions:**

* sipariş operasyona düştü ama ayrıştırılamadı
* hazırlanma SLA riski oluştu
* stok uyuşmazlığı tespit edildi
* problemli operasyon state’i açıldı
* kısmi işlenmiş sipariş takıldı
* sevkiyat öncesi kritik paketleme hatası bulundu

**Primary Owner:** `order_ops`
**Secondary Owner:** `supplier_admin`, `support_ops`, `delivery_ops`

**Resolution Standard:**

* order ops official outcome
* line/package seviyesinde net durum
* gerekiyorsa downstream shipment/support sinyali
* audit gerekli yerde completion

**Allowed Actions:**

* problem queue’ya alma
* tedarikçi görev/escalation açma
* shipment öncesi hold
* user-facing dürüst durum üretimi için support/takip sistemine sinyal

**Forbidden Actions:**

* sipariş truth’unu keyfi değiştirme
* tedarikçi adına shipment complete işaretleme

**Close Condition:**

* operasyonel darboğaz çözülmüş olmalı veya uygun downstream owner’a devredilmiş olmalı
* line/package bağlamı korunmuş olmalı
* gerekli downstream aksiyonlar başlatılmış olmalı

### EM-021 — Kısmi operasyon first-class escalation sebebidir

**Binding Rule:** Çok satırlı veya çok paketli siparişte yalnız problemli parçayı etkileyecek escalation mümkün olmalıdır; tüm siparişi tek kaba problem olarak ele almak yasaktır.

---

## 13. Shipment / delivery anomaly escalation ailesi

### EM-030 — Delivery anomaly escalation tetikleri

**Escalation Level:** `L1-domain-owner` veya `L2-domain-owner-plus-review`
**Trigger Conditions:**

* teslimat gecikmesi SLA riskine girdi
* teslim edildi görünüyor ama kullanıcı almadı
* paket kayıp / hasarlı / yanlış teslimat şüphesi var
* tracking ve actual status çelişiyor
* kısmi teslimat uzun süre düzelmedi

**Primary Owner:** `delivery_ops`
**Secondary Owner:** `support_ops`, `order_ops`, `finance_ops` gerektiğinde

**Resolution Standard:**

* shipment official outcome
* support/user-facing context update
* gerekiyorsa refund/return/entitlement downstream action
* audit completion gerekli ise

**Allowed Actions:**

* anomaly case açma
* shipment investigation başlatma
* support’e kontrollü kullanıcı açıklaması sağlama
* return/refund eligibility için sinyal üretme

**Forbidden Actions:**

* teslimat doğrulaması olmadan delivered’ı manuel dayatma
* kullanıcıyı belirsiz durumdayken closed çözüme zorlama

**Close Condition:**

* shipment outcome netleşmiş olmalı
* delivered / failed / returned / under-investigation çizgisi kesinleşmiş olmalı
* gerekiyorsa entitlement ve support etkileri recompute edilmiş olmalı

### EM-031 — "Teslim edildi ama almadım" varsayılan support ticket değil, delivery anomaly escalation’dır

**Binding Rule:** Bu vaka doğrudan operasyonel araştırma gerektirir; yalnız metin yanıtıyla kapatılamaz.

---

## 14. Ödeme / refund / finance escalation ailesi

### EM-040 — Finance escalation tetikleri

**Escalation Level:** `L2-domain-owner-plus-review`
**Trigger Conditions:**

* ödeme alındı ama sipariş görünmüyor
* payment unknown-result oluştu
* çift çekim / yanlış tutar şüphesi var
* refund başlatıldı ama completion görünmüyor
* kupon / promosyon finans etkisi anlaşmazlığı var
* hakediş / correction etkisi support seviyesinde çözülemiyor

**Primary Owner:** `finance_ops`
**Secondary Owner:** `support_ops`, `order_ops`, `risk_ops`, `commerce_admin`

**Resolution Standard:**

* finance official outcome
* reconciliation/correction completed or officially determined
* ilgili order/settlement/payout downstream action
* audit completion

**Allowed Actions:**

* payment/refund reconciliation başlatma
* correction talebi açma
* coupon sponsor attribution incelemesi
* finance hold veya review başlatma

**Forbidden Actions:**

* kanıtsız refund tamamlama
* unknown-result’ı sessiz success/failure sayma
* audit’siz manuel finans kararı

**Close Condition:**

* payment/refund/correction sonucu resmi olarak netleşmiş olmalı
* audit ve reconciliation izi oluşmuş olmalı
* downstream etki varsa işlenmiş olmalı

### EM-041 — Unknown-result finance escalation ilk sınıf olaydır

**Binding Rule:** Payment, refund veya payout belirsizliği support metniyle değil reconciliation hattıyla çözülür.

### EM-042 — Coupon sponsor anlaşmazlığı commerce değil finance escalation’dır

**Binding Rule:** İndirim maliyetinin hangi tarafa yazılacağı konusu support veya campaign etiketi seviyesinde değil, finance bağlamında çözülür.

---

## 15. Payout hold / release escalation ailesi

### EM-050 — Payout escalation tetikleri

**Escalation Level:** `L2-domain-owner-plus-review` veya kritik durumda `L3-upper-governance`
**Trigger Conditions:**

* payable bakiye paid_out olamıyor
* payout account doğrulama problemi var
* finance hold konmuş
* risk hold release talebi var
* batch created ama line sonuçları parçalı / başarısız

**Primary Owner:** `payout_ops`
**Secondary Owner:** `finance_ops`, `risk_ops`, `creator_admin`, `supplier_admin`

**Resolution Standard:**

* payout official outcome
* hold/release/retry/correction sonucu
* finance/risk downstream sync
* audit completion

**Allowed Actions:**

* payout hold açma
* payout release incelemesi
* batch/line düzeyinde retry veya correction talebi
* actor lifecycle tarafına sinyal

**Forbidden Actions:**

* hold reason olmadan release
* payable ile paid_out’ı eşitleme
* payout başarısızlığını settlement sorunu gibi kapatma

**Close Condition:**

* line/batch sonucu netleşmiş olmalı
* hold/release nedeni kaydedilmiş olmalı
* finance ve risk açısından açık blok kalmamış olmalı
* audit completion sağlanmış olmalı

### EM-051 — Risk hold release doğrudan payout ekibi kararıyla kapanmaz

**Binding Rule:** Risk kaynaklı hold varsa release için risk owner görüşü zorunludur.

---

## 16. Moderation escalation ailesi

### EM-060 — Moderation escalation tetikleri

**Escalation Level:** `L1-domain-owner` veya `L2-domain-owner-plus-review`
**Trigger Conditions:**

* içerik yüksek riskli veya belirsiz
* standart moderasyon kararı yeterli değil
* mağaza/creator davranışıyla içerik birlikte değerlendirilmeli
* kullanıcı itirazı kritik görünüyor
* aynı aktörde tekrar eden ihlal paterni var

**Primary Owner:** `moderation_ops`
**Secondary Owner:** `risk_ops`, `creator_admin`, `support_ops`

**Resolution Standard:**

* moderation official outcome
* creator/risk downstream signal gerekiyorsa
* audit completion

**Allowed Actions:**

* manual review genişletme
* higher-severity moderation queue
* creator warning/restriction sinyali
* support’e kontrollü karar bilgisi

**Forbidden Actions:**

* risk kararını moderasyon kararı gibi sunma
* moderation takedown’u support notuyla kapatma

**Close Condition:**

* approve/reject/restrict/take_down kararı netleşmiş olmalı
* gerekiyorsa üst sistemlere sinyal üretilmiş olmalı
* audit completion sağlanmış olmalı

### EM-061 — Moderation ve support ayrı zincirdir

**Binding Rule:** Uygunsuz içerik ticket ile gelse bile final içerik kararı moderation owner’da kalır.

---

## 17. Fraud / risk escalation ailesi

### EM-070 — Risk escalation tetikleri

**Escalation Level:** `L2-domain-owner-plus-review`
**Trigger Conditions:**

* repeated suspicious complaint
* coupon abuse suspicion
* refund abuse suspicion
* account takeover suspicion
* çoklu hesap paterni
* anormal return / reward / payout korelasyonu

**Primary Owner:** `risk_ops`
**Secondary Owner:** `finance_ops`, `support_ops`, `moderation_ops`, `creator_admin`, `supplier_admin`

**Resolution Standard:**

* risk official outcome
* false_positive / hold / release / restrict / escalate_up sonucu
* affected domain downstream action
* audit completion

**Allowed Actions:**

* risk case açma
* hold / suppression uygulama talebi
* manual review’a taşıma
* ilgili domain owner’a restricted action sinyali

**Forbidden Actions:**

* kanıtsız kalıcı yaptırım
* support ticket’ı doğrudan fraud hükmüne çevirmek
* risk case’i audit’siz kapatmak

**Close Condition:**

* signal false positive veya confirmed concern olarak netleşmeli
* hold/release/restrict sonucu kaydedilmeli
* etkilenen domain’lerde gerekli aksiyon alınmış olmalı

### EM-071 — Risk escalation çoklu domain etkisi üretebilir

**Binding Rule:** Kupon, reward, payout, UGC, creator veya supplier yaşam döngüsü aynı risk vakasından etkilenebilir; ama her domain kendi owner sınırında aksiyon alır.

---

## 18. Creator lifecycle escalation ailesi

### EM-080 — Creator lifecycle escalation tetikleri

**Escalation Level:** `L2-domain-owner-plus-review` veya kritik durumda `L3-upper-governance`
**Trigger Conditions:**

* başvuru belirsiz / riskli / eksik
* kategori yetkisi gözden geçirilmeli
* içerik / davranış / destek yükü / iade etkisi yükseldi
* mağaza görünürlüğü veya aktifliği için uyarı/kısıt gereği doğdu
* tekrar eden ihlal veya kalite düşüşü var

**Primary Owner:** `creator_admin`
**Secondary Owner:** `moderation_ops`, `risk_ops`, `support_ops`, `commerce_admin`

**Resolution Standard:**

* creator lifecycle official outcome
* warning/restriction/suspension/reactivation sonucu
* downstream visibility/category/scope action
* audit completion

**Allowed Actions:**

* revision request
* category restriction review
* warning
* temporary restriction
* suspension recommendation
* status review

**Forbidden Actions:**

* creator adına commerce truth write
* audit’siz suspend
* sosyal mesaj üzerinden resmi creator kararı iletme

**Close Condition:**

* approved / revision_requested / restricted / suspended / reactivated sonucu netleşmeli
* gerekçeli kayıt tamamlanmış olmalı
* downstream creator scope etkisi işlenmiş olmalı

### EM-081 — Creator escalation’da "satış düşüklüğü" tek başına yaptırım gerekçesi değildir

**Binding Rule:** Düşük performans sinyali inceleme sebebi olabilir; ama yaptırım için kalite/risk/policy bağlamı gerekir.

---

## 19. Tedarikçi lifecycle escalation ailesi

### EM-090 — Supplier lifecycle escalation tetikleri

**Escalation Level:** `L2-domain-owner-plus-review` veya kritik durumda `L3-upper-governance`
**Trigger Conditions:**

* başvuru eksik / riskli / belirsiz
* ürün kabul kalitesi bozuldu
* stok doğruluk problemi arttı
* geç sevkiyat tekrar ediyor
* iade / kalite problemi yoğunlaştı
* kategori bazlı yükleme hakkı gözden geçirilmeli

**Primary Owner:** `supplier_admin`
**Secondary Owner:** `order_ops`, `delivery_ops`, `risk_ops`, `commerce_admin`

**Resolution Standard:**

* supplier lifecycle official outcome
* warning/restriction/upload_limit/suspension sonucu
* downstream category/upload/ops action
* audit completion

**Allowed Actions:**

* revision request
* category close review
* upload restriction
* extra review mode
* suspension recommendation

**Forbidden Actions:**

* supplier panel aksiyonunu owner truth gibi kabul etme
* performans sorunu varken sessiz kategori açık bırakma
* audit’siz ceza uygulama

**Close Condition:**

* active / restricted / suspended / closed sonucu netleşmeli
* quality/risk temeli kayıtlı olmalı
* downstream supplier scope etkisi işlenmiş olmalı

### EM-091 — Supplier escalation operasyon sinyaliyle açılabilir

**Binding Rule:** Geç sevkiyat, stok sapması ve problemli fulfillment support vakası değil, supplier lifecycle escalation tetikleyebilir.

---

## 20. Kampanya / kupon / ticari kural escalation ailesi

### EM-100 — Commerce rule escalation tetikleri

**Escalation Level:** `L2-domain-owner-plus-review` veya exception’da `L3-upper-governance`
**Trigger Conditions:**

* campaign/koupon davranışı beklenen policy ile çelişiyor
* creator kuponu campaign-active ürünle çakışıyor
* sponsor attribution belirsiz
* margin/corridor ihlali şüphesi var
* manuel istisna talebi geldi

**Primary Owner:** `commerce_admin`
**Secondary Owner:** `finance_ops`, `support_ops`, `creator_admin`

**Resolution Standard:**

* commerce policy official outcome
* gerekiyorsa finance correction veya promotion hold
* audit completion

**Allowed Actions:**

* rule review
* promotion hold
* coupon disable review
* policy clarification
* finance correction talebi

**Forbidden Actions:**

* canlı sipariş truth’unu sessiz düzeltme
* support ajanının ticari kural yorumu ile karar kapatması

**Close Condition:**

* policy owner kararı netleşmiş olmalı
* gerekiyorsa downstream correction başlatılmış olmalı
* audit completion sağlanmış olmalı

### EM-101 — Manual promotion exception super-light işlem değildir

**Binding Rule:** Manuel istisna high-governance aksiyondur; audit ve gerekçe zorunludur.

---

## 21. Sistemsel / teknik kritik akış escalation ailesi

### EM-110 — Technical escalation tetikleri

**Escalation Level:** `L3-upper-governance`
**Trigger Conditions:**

* checkout / payment ekranı kitlendi
* sipariş oluşum zincirinde teknik kırılma var
* notification / support / panel kritik yüzeyi çalışmıyor
* event/audit lineage kopuyor
* duplicate veya unknown-result hacmi eşik üstüne çıktı

**Primary Owner:** `system_admin`
**Secondary Owner:** `support_ops`, `finance_ops`, `order_ops`

**Resolution Standard:**

* official incident outcome
* containment/recovery/reconciliation kararı
* gerekli downstream bilgilendirme
* audit/incident history completion

**Allowed Actions:**

* incident açma
* degraded mode ilanı
* downstream ekipleri bilgilendirme
* geçici traffic / flow restriction önerisi

**Forbidden Actions:**

* teknik kırılmayı business success gibi sunma
* incident’i sessiz kapatma

**Close Condition:**

* teknik etki sonlanmış olmalı
* backfill/reconciliation ihtiyacı varsa kaydedilmiş olmalı
* kullanıcıya/ekiplere dürüst durum yönetimi yapılmış olmalı

---

## 22. Admin üst onay escalation ailesi

### EM-120 — High-governance escalation tetikleri

**Escalation Level:** `L3-upper-governance`
**Trigger Conditions:**

* kalıcı kapatma
* kritik payout release
* geniş kapsamlı campaign override
* yüksek etkili role/permission değişikliği
* çoklu domaini etkileyen istisna kararı

**Primary Owner:** ilgili domain owner
**Secondary Owner / Approver:** `super_admin` veya yetkili üst admin

**Resolution Standard:**

* upper approval outcome
* owner protected action completion
* audit completion

**Allowed Actions:**

* upper approval request
* protected action prepare
* audit-backed exception flow

**Forbidden Actions:**

* tek operatör kararıyla kritik override
* çift onay gerektiren durumda tek onayla kapanış

**Close Condition:**

* approval chain tamamlanmış olmalı
* audit kaydı açık olmalı
* owner sistem aksiyonu resmi olarak işlemiş olmalı

---

## 23. Escalation tetik kaynakları

Escalation aşağıdaki kaynaklardan doğabilir:

* support ticket triage
* order ops queue
* delivery anomaly queue
* finance/reconciliation queue
* moderation queue
* risk signal
* admin review paneli
* automated SLA breach detector
* data quality / unknown-result / duplicate anomaly

Net kural:

* Kaynak farklı olabilir, ama escalation truth’u tek modelde tutulmalıdır

---

## 24. Gerekli bağlam alanları

Escalation family’sine göre aşağıdaki bağlamlar zorunlu olabilir:

* `ticket_id`
* `order_id`
* `order_line_id`
* `shipment_id`
* `payment_attempt_id`
* `refund_ref`
* `coupon_id`
* `settlement_line_id`
* `payout_batch_id`
* `creator_id`
* `supplier_id`
* `moderation_item_id`
* `risk_case_id`

Net kural:

* Bağlamsız escalation açılmaz
* "Genel problem" diye owner’sız case oluşturulmaz

---

## 25. SLA class standardı

Bu dosyada süre vermek yerine SLA sınıfı verilir.

Canonical SLA class:

* `A-immediate-critical`
* `B-urgent-same-cycle`
* `C-priority-normal`
* `D-batched-review`

Detay süreler `SLA_OWNER_LIST.md` içinde tanımlanır.

---

## 26. Allowed vs forbidden action standardı

### İzinli ortak escalation aksiyonları

* triage
* queue change
* reassign
* internal note
* case open
* hold request
* release review
* owner review request
* upper escalation
* user-visible controlled update

### Yasak ortak escalation davranışları

* owner dışı direct write
* audit’siz manuel karar
* unknown-result’ı sessiz kapatma
* support notuyla finance sonucu üretme
* social channel üzerinden resmi süreç çözme
* context’siz case kapatma

---

## 27. Kapanış standardı

Bir escalation yalnız şu durumda kapanabilir:

1. primary owner resmi outcome üretmiş olmalı
2. outcome state’i kayda geçmiş olmalı
3. reason / resolution note bulunmalı
4. gerekiyorsa downstream owner’lara etkiler işlenmiş olmalı
5. audit kaydı tamamlanmış olmalı

Net kural:

* "ilgilenildi" kapanış değildir
* "kullanıcıya yazıldı" kapanış değildir
* resmi owner sonucu olmadan escalation kapanmaz

---

## 28. Faz-1 minimum zorunlu escalation seti

İlk fazda aşağıdaki escalation zincirleri zorunlu kabul edilir:

1. support ticket -> order / delivery / finance / moderation / risk handoff
2. payment unknown-result -> finance reconciliation
3. delivered görünür ama kullanıcı almadı -> delivery anomaly
4. repeated coupon/refund complaint -> risk review
5. supplier geç sevkiyat paterni -> supplier lifecycle review
6. creator mağaza ihlal paterni -> creator lifecycle review
7. payout hold / release -> finance + risk controlled review
8. moderation high-risk content -> moderation + risk coordinated review
9. shipment anomaly -> support context update + delivery investigation
10. kritik manuel istisna -> upper admin approval

---

## 29. Faz-1 dışında bırakılan alanlar

* dış hukuk / regülasyon escalation zinciri
* çok aşamalı bölgesel operasyon organizasyonu
* sesli çağrı merkezi escalation scriptleri
* fiziksel depo / saha ekibi organizasyon detayları

---

## 30. Kısa sonuç

Bu matris ile aşağıdaki çekirdek kararlar sert biçimde sabitlenmiş olur:

* Escalation owner’sız açılamaz
* Secondary owner görüş verir; primary owner final sahipliği taşır
* Severity ile priority aynı şey değildir
* Support, order, delivery, finance, moderation, risk, creator ve supplier escalation aileleri ayrı tutulur
* Unknown-result ve payout/finance belirsizlikleri ayrı yönetilir
* Social kanallar resmi escalation alanı değildir
* Manual override yalnız kayıtlı escalation + audit + approval modeliyle mümkündür
* Kapanış için resmi owner outcome + downstream action + audit completion zorunludur

Bu dosya, Aşama 12’nin bağlayıcı ve yoruma kapalı escalation omurgasıdır.
