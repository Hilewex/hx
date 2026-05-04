# ELIGIBILITY_RULEBOOK

## 1. Amaç

Bu dosya, platformda belirli aksiyonların yalnız auth ile değil, ek uygunluk koşullarıyla açıldığı alanları tek doğrulu ve bağlayıcı kural kitabı haline getirir.

Bu dosyanın amacı:

* auth, role/scope, permission, eligibility, state ve risk katmanlarını birbirinden ayırmak
* hangi aksiyonun hangi ön koşulla açıldığını kanonik biçimde sabitlemek
* review, story, question, return, reward ve payout gibi hak açılışlarını yoruma kapatmak
* UI, BFF, panel ve owner sistemler arasında çelişkili hak davranışı oluşmasını engellemektir

Net kural:

* Auth sahibi olmak eligibility sahibi olmak için yeterli değildir
* Permission ile eligibility aynı şey değildir
* Eligibility, role/scope ve state’ten bağımsız düşünülemez
* UI eligibility üretmez; yalnız görünür kılar
* BFF eligibility owner değildir
* Eligibility sonucu mümkünse neden sınıfıyla birlikte üretilmelidir

---

## 2. Kapsam

Bu rulebook ilk fazda aşağıdaki eligibility ailelerini kapsar:

1. checkout eligibility
2. payment eligibility
3. review eligibility
4. story eligibility
5. question eligibility
6. return eligibility
7. reward earning eligibility
8. reward spend eligibility
9. payout eligibility
10. creator active / restricted access eligibility
11. supplier active / restricted access eligibility

Bu dosya aşağıdaki alanları yalnız üst/orta ayrıntı seviyesinde tanımlar:

* moderation appeal / restore matrisi
* fraud scoring formülü
* tüm UI metin varyantları
* tüm panel alt-rol varyasyonları
* guest order sonrası account-linking edge-case matrisi

---

## 3. Eligibility katman modeli

### ER-001 — Auth ile eligibility aynı şey değildir

**Binding Rule:** Kullanıcı giriş yapmış olabilir; fakat ilgili aksiyon için domain hakkı açılmamış olabilir.

### ER-002 — Permission ile eligibility aynı şey değildir

**Binding Rule:** Bir aktör ilgili endpoint veya yüzey kapsamına erişebilir; fakat domain hakkı kapalı olabilir.

### ER-003 — Eligibility değerlendirmesi katmanlı yapılır

**Binding Rule:** Kritik aksiyonlarda değerlendirme sırası en az şu mantıkla işler:

1. auth
2. role / scope
3. permission
4. ownership bağlamı gerekiyorsa ownership
5. eligibility
6. state / lifecycle guard
7. risk / moderation / finance block

### ER-004 — Eligibility owner sistemlerden türetilir

**Binding Rule:** Eligibility tek bir UI kararı veya BFF çıkarımı değildir; order, delivery, lifecycle, moderation, risk ve policy kaynaklarından owner alanlarda hesaplanır.

### ER-005 — Eligibility sonucu tek kaba boolean’a indirgenmez

**Binding Rule:** Gerekli yerlerde şu sınıflar korunur:

* eligible
* not_eligible
* login_required
* permission_denied
* blocked
* under_review
* window_closed
* restricted
* state_conflict

---

## 4. Eligibility standardı

Her eligibility kuralı şu alan mantığıyla okunmalıdır:

* **Eligibility ID**
* **Name**
* **Actor**
* **Context**
* **Auth / Scope Requirement**
* **Business Preconditions**
* **Blocking Conditions**
* **Owner / Enforcement**
* **UI / API Effect**

Net kural:

* Disabled button tek başına canonical eligibility sonucu sayılmaz
* Owner sistem eligibility sonucu üretir; UI yalnız uygun state dilini yansıtır
* Eligibility sonucu gerekiyorsa line-level, item-level veya batch-level çalışmalıdır

---

## 5. Checkout eligibility

### ER-010 — Can_Checkout

**Actor:** misafir kullanıcı veya giriş yapmış kullanıcı

**Context:** sepetten checkout başlatma / checkout review

**Auth / Scope Requirement:**

* guest checkout açıksa guest allowed
* login checkout için shopper scope allowed

**Business Preconditions:**

* sepette ilgili satırlar aktif ve görünür olmalı
* varyantlı ürünlerde varyant seçimi tamamlanmış olmalı
* ilk stok uygunluğu sağlanmalı
* checkout için gerekli minimum iletişim/kimlik bağlamı sağlanabilmeli

**Blocking Conditions:**

* pasif ürün
* görünmez ürün
* geçersiz varyant
* stok yetersizliği
* sepetin checkout’a taşınmasını engelleyen kritik conflict
* guest checkout policy kapalıyken guest actor

**Owner / Enforcement:** commerce / checkout owner

**UI / API Effect:** checkout başlatılamaz veya invalid checkout state üretilir

### ER-011 — Guest checkout ticari istisnadır

**Binding Rule:** Guest actor checkout’a girebilir; fakat bu istisna sosyal write veya hesap bağlı haklar üretmez.

### ER-012 — Cart eligibility ile checkout eligibility aynı şey değildir

**Binding Rule:** Sepete eklenebilen satır, checkout’ta geçersiz hale gelebilir; final ticari doğruluk checkout’ta kurulur.

---

## 6. Payment eligibility

### ER-020 — Can_Pay

**Actor:** misafir kullanıcı veya giriş yapmış kullanıcı

**Context:** checkout -> payment handoff

**Auth / Scope Requirement:**

* guest checkout context veya shopper context geçerli olmalı

**Business Preconditions:**

* checkout valid / ready_for_payment olmalı
* adres bağlamı tamamlanmış olmalı
* fiyat ve stok final doğrulaması geçmiş olmalı
* final total netleşmiş olmalı
* payment method ilgili bağlamda açık olmalı

**Blocking Conditions:**

* invalid checkout
* expired checkout
* incomplete address context
* invalid / expired price lock
* stok rezervasyonu veya final doğrulama conflict’i
* payment risk block / fraud hold

**Owner / Enforcement:** checkout owner + payment owner

**UI / API Effect:** payment başlatılamaz; neden sınıfı görünür olmalıdır

### ER-021 — Geçersiz checkout payment eligibility üretmez

**Binding Rule:** `ready_for_payment` olmadan payment create hakkı doğmaz.

### ER-022 — Payment eligibility doğrudan sepetten türetilmez

**Binding Rule:** Payment’in tek doğru giriş bağlamı validated checkout context’tir.

### ER-023 — Payment eligibility ile payment success aynı şey değildir

**Binding Rule:** Pay hakkı açılmış olması payment completion anlamına gelmez.

---

## 7. Review eligibility

### ER-030 — Can_Write_Review

**Actor:** giriş yapmış kullanıcı

**Context:** PDP review girişi, order sonrası review aksiyonu

**Auth / Scope Requirement:**

* auth zorunlu
* shopper scope zorunlu

**Business Preconditions:**

* ürün satın alınmış olmalı
* ilgili sipariş satırı teslim edilmiş olmalı
* review entitlement / eligibility kaydı aktif olmalı
* kullanıcı aynı ürün için geçersiz tekrar hakkı kullanmıyor olmalı

**Blocking Conditions:**

* guest actor
* satın alma yok
* delivery eşiği yok
* eligibility inactive
* ilgili line iade/iptal sonucu hak düşmüş
* moderation block
* fraud / abuse block

**Owner / Enforcement:**

* source refs: order + delivery + return/cancel outcome
* domain owner: review / entitlement owner
* cross-guards: moderation + risk

**UI / API Effect:** review CTA yalnız eligible durumda aktifleşir; aksi halde login veya eligibility gate görünür

### ER-031 — Delivery eşiği review eligibility için zorunludur

**Binding Rule:** Payment success, checkout completion veya order creation review hakkı açmaz.

### ER-032 — Review auth gerektirir; guest commerce review hakkı açmaz

**Binding Rule:** Guest order oluşmuş olsa bile review hakkı auth’siz açılmaz.

### ER-033 — Review eligibility line-level değerlendirilir

**Binding Rule:** Çok satırlı siparişte bazı satırlar review eligible, bazıları değil olabilir.

### ER-034 — Return / fraud / policy sonrası review eligibility yeniden değerlendirilebilir

**Binding Rule:** Teslimat sonrası açılmış review hakkı veya trust etkisi sonradan düşebilir.

---

## 8. Story eligibility

### ER-040 — Can_Create_User_Product_Story

**Actor:** giriş yapmış kullanıcı

**Context:** user product story upload, PDP user story strip bağlamı

**Auth / Scope Requirement:**

* auth zorunlu
* shopper scope zorunlu

**Business Preconditions:**

* ürün satın alınmış olmalı
* ilgili sipariş satırı teslim edilmiş olmalı
* story entitlement / eligibility aktif olmalı
* ürün etiketi bağlanabilmeli
* kullanıcı allowed story limit içinde olmalı

**Blocking Conditions:**

* guest actor
* no purchase
* no delivery
* inactive story eligibility
* taggable product context yok
* moderation block
* risk / abuse block
* per-product story limit exceeded

**Owner / Enforcement:**

* source refs: order + delivery + return outcome
* domain owner: story/UGC owner + entitlement logic
* cross-guards: moderation + risk

**UI / API Effect:** story upload CTA yalnız eligible durumda açılır; aksi halde reason-based gate gösterilir

### ER-041 — Story eligibility ile story publish eligibility aynı şey değildir

**Binding Rule:** Kullanıcının story yükleme hakkı olabilir; fakat story’nin görünür olması moderasyon/policy ile ayrıca belirlenir.

### ER-042 — Story eligibility auth gerektirir; guest commerce story hakkı açmaz

**Binding Rule:** Guest checkout ve guest order oluşumu social content upload hakkı üretmez.

### ER-043 — Story reward eligibility ayrı değerlendirilir

**Binding Rule:** Story upload hakkı ile story’den puan kazanma hakkı aynı anda ve aynı koşulla açılmayabilir.

### ER-044 — Story eligibility line-level ve ürün-bağlamlı çalışır

**Binding Rule:** Hakkın kaynağı belirli delivered order line ve product context’tir.

---

## 9. Question eligibility

### ER-050 — Can_Ask_Question

**Actor:** giriş yapmış kullanıcı

**Context:** PDP ürün bazlı soru oluşturma

**Auth / Scope Requirement:**

* auth zorunlu
* shopper scope zorunlu

**Business Preconditions:**

* ürün aktif ve görünür olmalı
* PDP bağlamı geçerli olmalı
* kullanıcı ask-question açısından policy ile kapatılmamış olmalı

**Blocking Conditions:**

* guest actor
* pasif/görünmez ürün
* question policy block
* moderation / abuse block

**Owner / Enforcement:**

* source refs: product visibility + policy state
* domain owner: question/Q&A owner
* cross-guards: moderation + risk

**UI / API Effect:** question CTA login_required veya blocked_by_policy gibi net durumla görünür olmalıdır

### ER-051 — Question satın alma zorunluluğu taşımaz

**Binding Rule:** İlk fazda ürün bazlı soru için purchase/delivery eşiği zorunlu değildir; auth ve policy geçerliliği yeterlidir.

### ER-052 — Question mağaza mesajı değildir

**Binding Rule:** Question eligibility PDP product context için hesaplanır; genel social messaging hakkı yerine geçmez.

---

## 10. Return eligibility

### ER-060 — Can_Request_Return

**Actor:** giriş yapmış kullanıcı

**Context:** order detail / tracking / return entry surface

**Auth / Scope Requirement:**

* auth zorunlu
* kendi sipariş bağlamı zorunlu

**Business Preconditions:**

* ilgili sipariş satırı kullanıcıya ait olmalı
* delivery tamamlanmış olmalı
* return window açık olmalı
* ilgili line return policy açısından uygun olmalı
* return eligibility aktif olmalı

**Blocking Conditions:**

* ownership yok
* no delivery
* window closed
* line final return/cancel state’e ulaşmış
* policy block
* fraud / abuse review hold

**Owner / Enforcement:**

* source refs: order + delivery + return window/policy
* domain owner: cancel/return owner + entitlement logic
* cross-guards: risk + finance hold if needed

**UI / API Effect:** iade başlat CTA line bazında açılır veya kapalı neden görünür olur

### ER-061 — Return eligibility checkout/payment verisinden türetilmez

**Binding Rule:** Return hakkı yalnız order + delivery + policy birleşiminden hesaplanır.

### ER-062 — Return eligibility line-level first-class’tır

**Binding Rule:** Aynı siparişte bazı satırlar return eligible, bazıları değil olabilir.

### ER-063 — Return eligibility ile refund completion aynı şey değildir

**Binding Rule:** İade başlatma hakkı, refund’ın tamamlanmış olduğu anlamına gelmez.

---

## 11. Reward earning eligibility

### ER-070 — Can_Earn_Review_Reward

**Actor:** giriş yapmış kullanıcı

**Context:** review tamamlandıktan sonra reward üretimi

**Auth / Scope Requirement:**

* auth zorunlu
* shopper scope zorunlu

**Business Preconditions:**

* review eligibility aktif olmalı
* geçerli review + star rating tamamlanmış olmalı
* duplicate contribution kuralı ihlal edilmemeli

**Blocking Conditions:**

* invalid review contribution
* duplicate reward attempt
* no delivery / no purchase
* risk / abuse block

**Owner / Enforcement:** reward owner + review domain + risk signals

### ER-071 — Can_Earn_Story_Reward

**Actor:** giriş yapmış kullanıcı

**Context:** story sonrası reward üretimi

**Auth / Scope Requirement:**

* auth zorunlu
* shopper scope zorunlu

**Business Preconditions:**

* story eligibility aktif olmalı
* ürün etiketli story yüklenmiş olmalı
* moderasyon onayı alınmış olmalı
* duplicate / limit kuralı ihlal edilmemeli

**Blocking Conditions:**

* moderation pending/reject
* duplicate reward attempt
* risk / abuse block

**Owner / Enforcement:** reward owner + story domain + moderation + risk

### ER-072 — Reward earning ile reward spend aynı şey değildir

**Binding Rule:** Reward kazanılmış olabilir ama spendable olmayabilir.

---

## 12. Reward spend eligibility

### ER-080 — Can_Use_Reward_Points

**Actor:** giriş yapmış kullanıcı

**Context:** point market redemption

**Auth / Scope Requirement:**

* auth zorunlu
* shopper scope zorunlu

**Business Preconditions:**

* spendable puan yeterli olmalı
* point market ürünü aktif olmalı
* stok uygun olmalı
* kullanıcı başı limit aşılmamış olmalı

**Blocking Conditions:**

* pending only points
* vested but not spendable points
* insufficient spendable balance
* item inactive
* limit exceeded
* reward abuse hold

**Owner / Enforcement:** reward owner + point market owner + risk signals

**UI / API Effect:** redemption CTA yalnız spendable balance bazında açılır

### ER-081 — Spendable eşiği zorunludur

**Binding Rule:** Pending veya yalnız vested puan redemption açmaz.

### ER-082 — Reward spend abuse durumunda geçici block uygulanabilir

**Binding Rule:** Çoklu hesap, manipülasyon veya anomali halinde redemption eligibility düşebilir.

---

## 13. Payout eligibility

### ER-090 — Can_Receive_Payout

**Actor:** fenomen veya tedarikçi alıcı taraf

**Context:** payout batch input / payout readiness

**Auth / Scope Requirement:**

* ilgili actor lifecycle active veya payout’a izinli restricted state’te olmalı

**Business Preconditions:**

* payable balance mevcut olmalı
* payout account bilgisi doğrulanmış olmalı
* minimum threshold aşılmış olmalı
* açık kritik dispute olmamalı

**Blocking Conditions:**

* suspended / closed actor lifecycle
* blocked payout account
* threshold not met
* risk hold
* finance hold
* unresolved critical dispute

**Owner / Enforcement:** payout owner + settlement owner + finance admin + risk signals

**UI / API Effect:** payout readiness actor-level veya batch-level visibility ile gösterilir; otomatik paid varsayımı yapılmaz

### ER-091 — Settled payout eligibility üretmez, payable gerekir

**Binding Rule:** `settled != payout eligible` ayrımı korunur.

### ER-092 — Payout eligibility batch-level ve line/balance-level yeniden değerlendirilebilir

**Binding Rule:** Aynı actor’ün bazı bakiyeleri eligible, bazıları hold altında olabilir.

---

## 14. Creator access eligibility

### ER-100 — Can_Use_Creator_Scope

**Actor:** onaylı fenomen

**Context:** creator panel / creator store operations

**Auth / Scope Requirement:**

* auth zorunlu
* creator scope zorunlu

**Business Preconditions:**

* creator lifecycle active veya izinli restricted durumda olmalı
* gerekli category permission açık olmalı

**Blocking Conditions:**

* application / under_review / revision_requested / rejected
* suspended / closed
* ilgili feature restriction

**Owner / Enforcement:** creator lifecycle owner + scope guard + permissions

### ER-101 — Approved ile active aynı şey değildir

**Binding Rule:** Başvuru onayı verilmiş olması self-service creator access’in tamamen açıldığı anlamına gelmez.

### ER-102 — Restricted creator kısmi access modeliyle çalışabilir

**Binding Rule:** Restriction binary değildir; bazı özellikler açık, bazıları kapalı olabilir.

---

## 15. Supplier access eligibility

### ER-110 — Can_Use_Supplier_Scope

**Actor:** onaylı tedarikçi

**Context:** supplier panel / product and fulfillment operations

**Auth / Scope Requirement:**

* auth zorunlu
* supplier scope zorunlu

**Business Preconditions:**

* supplier lifecycle active veya izinli restricted durumda olmalı
* gerekli category/upload permissions açık olmalı

**Blocking Conditions:**

* application / under_review / revision_requested / rejected
* suspended / closed
* upload or fulfillment restriction

**Owner / Enforcement:** supplier lifecycle owner + scope guard + permissions

### ER-111 — Approved ile active aynı şey değildir

**Binding Rule:** Onay verilmiş olması product upload ve operational participation’ın tam açıldığı anlamına gelmez.

### ER-112 — Restricted supplier kısmi access modeliyle çalışabilir

**Binding Rule:** Bazı kategoriler, upload hakları veya fulfillment alanları kapanabilir.

---

## 16. Moderation / risk / finance etkileri

### ER-120 — Moderation, risk ve finance block aynı şey değildir

**Binding Rule:** İçerik güvenliği, abuse/anomaly ve finansal hold farklı kaynaklardır; eligibility üstünde ortak etki üretebilirler ama aynı sebep kodu gibi davranmazlar.

### ER-121 — High-risk signal eligibility düşürebilir veya askıya alabilir

**Binding Rule:** Kupon, reward, payout, return, question, review ve story hakları risk sonucu geçici veya kalıcı daraltılabilir.

### ER-122 — Under-review sonucu silent fail olamaz

**Binding Rule:** Mümkünse kullanıcıya veya panele review, payout, moderation veya risk incelemesi altında olduğu görünür kılınmalıdır.

---

## 17. UI / API davranış kuralları

### ER-130 — Login gate ile eligibility gate ayrılır

**Binding Rule:** Guest user için login_required; auth sahibi ama hakkı açılmamış actor için eligibility_closed / blocked / window_closed gibi durumlar kullanılır.

### ER-131 — BFF eligibility sonucu uydurmaz

**Binding Rule:** BFF en fazla owner sistemlerden gelen eligibility, blocked_reason veya state summary’yi taşır.

### ER-132 — Eligible olmayan aksiyon accepted/completed gibi gösterilmez

**Binding Rule:** UI butonu gösterebilir, disable edebilir veya gate açabilir; ama sahte başarı üretemez.

### ER-133 — Kanonik hata dili korunur

**Binding Rule:** En az şu aileler korunur:

* REVIEW_ELIGIBILITY_NOT_ACTIVE
* STORY_ELIGIBILITY_NOT_ACTIVE
* VERIFIED_PURCHASE_NOT_ACTIVE
* RETURN_WINDOW_CLOSED
* PAYOUT_NOT_ELIGIBLE
* ACCESS_DENIED

---

## 18. Faz-1 açık ve sonraki aşamaya bırakılan alanlar

### 18.1 Bu dosyada bağlanan ana eligibility alanları

* checkout
* payment
* review
* story
* question
* return
* reward earning
* reward spend
* payout
* creator / supplier access

### 18.2 Sonraki detaylandırma alanları

* guest order sonrası account linking ve sonradan hak dönüşümü
* moderation appeal sonrası eligibility restore matrisi
* multi-order-line karmaşık reward reconciliation
* advanced finance dispute sonrası payout re-eligibility matrisi

---

## 19. Kısa sonuç

Bu rulebook ile aşağıdaki ayrımlar sert biçimde sabitlenmiş olur:

* auth != permission != eligibility
* approved != active
* delivered != reward spendable
* review/story create hakkı != publish hakkı
* settled != payout eligible
* restricted != tamamen kapalı
* guest commerce açık olabilir ama social eligibility açılmaz

Bu dosya, platformun hak açılışı ve hak blokajı alanında bağlayıcı eligibility refera
