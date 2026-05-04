# UGC_RULEBOOK

## 1. Amaç

Bu dosya, platformdaki kullanıcı katkısı (UGC) alanlarını tek doğrulu, uygulanabilir ve çakışmasız kural kitabı haline getirir.

Bu dosyanın amacı:

* review, question-answer ve user product story alanlarını kesin biçimde ayırmak
* UGC’nin hangi koşulla üretildiğini, yayınlandığını, görünür kaldığını, sınırlandığını ve arşivlendiğini bağlayıcı hale getirmek
* PDP bağlamı, sosyal bağlam ve mağaza/promosyon bağlamını karıştırmamak
* moderation, fraud/risk, return ve reward etkilerini UGC üstünde yoruma kapatmak

Net kural:

* UGC tek tip alan değildir
* Review, question-answer ve user product story aynı semantik ailede olsa da aynı davranış modelinde değildir
* UGC owner truth’u ile projection / UI sunumu aynı şey değildir
* UGC görünürlüğü moderation, policy, risk ve teslimat-sonrası hak etkileriyle değişebilir
* UGC create ile visible kalma hakkı aynı şey değildir

---

## 2. Kapsam

Bu rulebook ilk fazda aşağıdaki UGC ailelerini kapsar:

1. review / yıldız puanlama
2. question / answer
3. user product story
4. UGC create / publish / visibility / archive kuralları
5. moderation ve policy etkileri
6. reward ve eligibility ilişkisi
7. return / fraud / risk sonrası UGC etkileri
8. PDP bağlamı ve sosyal bağlam ayrımları

Bu dosya aşağıdaki alanları kapsam dışı veya sınırlı ayrıntı seviyesinde bırakır:

* genel post sistemi
* fenomen mağaza tanıtım story’leri
* fenomen ürün tanıtım story’leri
* mağaza post akışı
* tam appeal / restore matrisi
* detaylı cold-storage / purge operasyon matrisi

---

## 3. UGC katman modeli

### UG-001 — Review, question-answer ve user product story aynı şey değildir

**Binding Rule:** Bu üç alan ortak kullanıcı katkısı ailesindedir; fakat create koşulu, publish davranışı, visibility etkisi ve reward ilişkisi ayrıdır.

### UG-002 — Create ile publish aynı şey değildir

**Binding Rule:** İçerik oluşturulmuş olabilir; fakat yayınlanmış veya görünür hale gelmiş olmayabilir.

### UG-003 — Publish ile visible aynı şey değildir

**Binding Rule:** İçerik sistemde publish state’e geçmiş olabilir; fakat surface-level görünürlüğü moderation, policy, scope veya lifecycle nedeniyle sınırlı olabilir.

### UG-004 — Visible ile archived aynı şey değildir

**Binding Rule:** Sıcak görünürlükten çıkmış içerik history olarak saklanabilir; archive hard delete değildir.

### UG-005 — Moderation, risk ve return etkileri farklı kaynaklardır

**Binding Rule:** Moderation içerik güvenliğini, risk kötüye kullanım/anomaliyi, return ise teslimat-sonrası trust ve entitlement etkisini taşır; hepsi UGC görünürlüğünü etkileyebilir ama aynı sebep olarak ele alınmaz.

### UG-006 — Reward, visibility ve trust aynı kavram değildir

**Binding Rule:** Bir UGC öğesi reward üretmiş olabilir ama görünür kalmayabilir; görünür olabilir ama reward üretmeyebilir; trust etiketi ayrıca değişebilir.

---

## 4. UGC standardı

Her kural şu alan mantığıyla okunur:

* **Rule ID**
* **Rule Name**
* **UGC Type**
* **Context**
* **Create Preconditions**
* **Publish / Visibility Conditions**
* **Blocking / Restriction Conditions**
* **Owner / Enforcement**
* **Trust / Reward / Archive Effect**

Net kural:

* created, published, visible, restricted, taken_down, archived durumları ayrı anlam taşır
* PDP’de görünmek ile sistemde history olarak saklanmak aynı şey değildir

---

## 5. Review kuralları

### UG-010 — Review yalnız satın alınmış ve teslim edilmiş ürün için açılır

**UGC Type:** review

**Context:** PDP review alanı, order sonrası review girişi

**Create Preconditions:**

* kullanıcı giriş yapmış olmalı
* shopper scope aktif olmalı
* ürün satın alınmış olmalı
* ilgili order line delivered state’e ulaşmış olmalı
* review eligibility aktif olmalı
* kullanıcı review açısından blocked/restricted olmamalı

**Publish / Visibility Conditions:**

* review kaydı oluşturulmuş olmalı
* moderation / policy açısından görünmeye uygun olmalı
* trust etkisi kapatılmamış olmalıysa verified context gösterilebilir

**Blocking / Restriction Conditions:**

* guest actor
* no purchase
* no delivery
* inactive review eligibility
* moderation reject / restrict
* risk / abuse block
* duplicate/repeat review abuse kuralı

**Owner / Enforcement:**

* source refs: order + delivery + return/refund outcome
* domain owner: review owner / UGC owner
* cross guards: eligibility + moderation + risk

**Trust / Reward / Archive Effect:**

* trust/verified purchase etkisi ayrı meta bağlamdır
* reward varsa ayrıca reward owner tarafından değerlendirilir

### UG-011 — Review, yorum + yıldız puanlama birlikte ele alınır

**UGC Type:** review

**Binding Rule:** İlk faz review katkısı yalnız düz metin değildir; yıldız puanlama ile birlikte anlam taşır. Reward açısından tam review katkısı bu birlikteliğe dayanır.

### UG-012 — Review PDP güven katmanının parçasıdır, sosyal feed içeriği değildir

**UGC Type:** review

**Binding Rule:** Review PDP’de karar destek ve güven katmanı olarak çalışır; genel post/feed mantığına taşınmaz.

### UG-013 — Review visibility sonradan yeniden değerlendirilebilir

**UGC Type:** review

**Binding Rule:** Return, fraud, policy veya moderation sonucu review görünürlüğü ve trust etkisi sonradan değişebilir.

### UG-014 — Review geçmişi otomatik hard delete edilmez

**UGC Type:** review

**Binding Rule:** Visibility düşse veya trust etkisi kaldırılsa bile review history-first yaklaşım ile ele alınır; hard delete varsayılan davranış değildir.

---

## 6. Question / answer kuralları

### UG-020 — Question ürün bazlıdır

**UGC Type:** question

**Context:** PDP Q&A alanı

**Create Preconditions:**

* kullanıcı giriş yapmış olmalı
* shopper scope aktif olmalı
* ürün aktif ve görünür olmalı
* PDP product context geçerli olmalı
* question policy block olmamalı

**Publish / Visibility Conditions:**

* soru oluşturulmuş olmalı
* moderation/policy açısından görünür olmaya uygun olmalı

**Blocking / Restriction Conditions:**

* guest actor
* pasif/görünmez ürün
* question policy block
* moderation block
* risk / abuse block

**Owner / Enforcement:**

* source refs: product visibility + Q&A policy state
* domain owner: Q&A owner
* cross guards: moderation + risk

**Trust / Reward / Archive Effect:**

* question ilk fazda reward üretmez
* answer/question history saklanabilir

### UG-021 — Question satın alma zorunluluğu taşımaz

**UGC Type:** question

**Binding Rule:** İlk fazda question eligibility için purchase/delivery zorunlu değildir; auth ve policy geçerliliği yeterlidir.

### UG-022 — Question mağaza mesajı değildir

**UGC Type:** question

**Binding Rule:** Question PDP product context’te çalışır; genel mağaza mesajlaşması yerine geçmez.

### UG-023 — Under-review soru/yanıt sessiz kaybolmaz

**UGC Type:** question-answer

**Binding Rule:** İnceleme altındaki içerik mümkünse under_review veya benzeri semantik durumla yönetilir; yok olmuş gibi davranılmaz.

### UG-024 — Answer publish ve answer visible aynı şey değildir

**UGC Type:** answer

**Binding Rule:** Yanıt sistemde publish edilmiş olabilir; ama surface-level görünürlüğü policy/moderation ile sınırlandırılabilir.

---

## 7. User product story kuralları

### UG-030 — User product story yalnız satın alınmış ve teslim edilmiş ürün için açılır

**UGC Type:** user product story

**Context:** PDP user story strip, story upload akışı

**Create Preconditions:**

* kullanıcı giriş yapmış olmalı
* shopper scope aktif olmalı
* ürün satın alınmış olmalı
* ilgili order line delivered olmalı
* story eligibility aktif olmalı
* ürün etiketi bağlanabilmeli
* kullanıcı blocked/restricted olmamalı

**Publish / Visibility Conditions:**

* story yükleme tamamlanmış olmalı
* moderation / policy açısından görünmeye uygun olmalı
* visible window veya sıcak görünürlük penceresi aktifse bu pencerede olmalı

**Blocking / Restriction Conditions:**

* guest actor
* no purchase
* no delivery
* inactive story eligibility
* no taggable product context
* moderation reject / restrict
* risk / abuse block
* per-product story limit exceeded

**Owner / Enforcement:**

* source refs: order + delivery + return outcome
* domain owner: story/UGC owner
* cross guards: eligibility + moderation + risk

**Trust / Reward / Archive Effect:**

* reward ayrı değerlendirilir
* visible süresi biten story archive/history alanına alınabilir

### UG-031 — User product story, fenomen mağaza story’si değildir

**UGC Type:** user product story

**Binding Rule:** Kullanıcı ürün story’si ayrı semantik türdür; fenomen mağaza tanıtım story’si ve fenomen ürün tanıtım story’si ile karıştırılamaz.

### UG-032 — PDP’de yalnız user product story şeridi bulunur

**UGC Type:** user product story

**Binding Rule:** PDP’de fenomen mağaza story akışı bulunmaz; yalnız kullanıcı ürün story strip’i bulunur.

### UG-033 — User product story keşfet üst şeridine düşmez

**UGC Type:** user product story

**Binding Rule:** Keşfet üst şeridinde yalnız mağaza tanıtım story’leri bulunur; user product story burada sıcak üst story olarak yer almaz.

### UG-034 — Story reward için moderasyon onayı gerekir

**UGC Type:** user product story

**Binding Rule:** Story upload edilmiş olması reward kesinliği üretmez; moderasyon onayı sonrası reward lifecycle zinciri çalışır.

### UG-035 — Story existence ile story visibility aynı şey değildir

**UGC Type:** user product story

**Binding Rule:** Story sistemde history olarak var olabilir; ancak sıcak görünürlük süresi, archive ve takedown etkileri ayrıdır.

---

## 8. Create / publish / visibility / archive kuralları

### UG-040 — Created, published, visible, restricted, taken_down ve archived farklı durumlardır

**Binding Rule:** UGC yaşam döngüsü tek kaba state’e indirgenemez; her durumun görünürlük ve retention anlamı ayrıdır.

### UG-041 — Published herkese görünür demek değildir

**Binding Rule:** Surface, scope, moderation ve policy nedeniyle published içerik sınırlı görünür olabilir.

### UG-042 — Restricted içerik ile taken_down içerik aynı değildir

**Binding Rule:** Restricted içerik kısmi görünür veya sınırlı erişimli olabilir; taken_down içerik aktif görünürlükten çekilmiştir.

### UG-043 — Archived içerik aktif yüzeyden çıkar ama history olarak kalabilir

**Binding Rule:** Archive soft history / warm storage mantığıdır; hard delete varsayılan değildir.

### UG-044 — Deleted ile physically removed aynı şey değildir

**Binding Rule:** İlk fazda UGC alanlarında hide/restrict/take_down/archive davranışı fiziksel silmeden önceliklidir.

### UG-045 — UI visibility kararı uyduramaz

**Binding Rule:** UI visibility kararını owner ve moderation/policy sonuçlarından projection olarak alır.

---

## 9. Moderation ve policy kuralları

### UG-050 — Moderation UGC görünürlüğü üstünde first-class etkidir

**Binding Rule:** Review, question, answer ve user story alanları moderation-safe çalışmalıdır.

### UG-051 — Moderation finansal truth owner değildir

**Binding Rule:** Moderation visibility / publish / restrict / takedown kararı üretir; finance truth veya settlement truth’u mutate etmez.

### UG-052 — Moderation ile risk aynı sistem değildir

**Binding Rule:** Moderation içerik güvenliği ve görünürlükle ilgilenir; risk sistemi ise kötüye kullanım / anomali tarafını taşır.

### UG-053 — Under-review UGC sessiz fail olmaz

**Binding Rule:** İçerik review altındaysa mümkünse semantik durum üretilir; kullanıcıya kaybolmuş içerik hissi verilmez.

### UG-054 — Appeal / restore ilk faz ana kural setinin dışında kalır

**Binding Rule:** Appeal/restore davranışı burada üst not olarak kalır; ayrıntı matrisi ayrı ele alınır.

---

## 10. Reward ve eligibility ilişkisi

### UG-060 — Review eligibility ile review reward aynı şey değildir

**Binding Rule:** Kullanıcı review yazmaya eligible olabilir; fakat reward ancak geçerli review katkısı tamamlandığında değerlendirilir.

### UG-061 — Story eligibility ile story reward aynı şey değildir

**Binding Rule:** Story upload hakkı ile story’den reward puanı kazanma hakkı aynı anda ve aynı koşulla açılmayabilir.

### UG-062 — Reward visibility garantisi vermez

**Binding Rule:** Reward üreten bir UGC öğesi sonradan moderation/risk/return etkisiyle görünürlüğünü kaybedebilir.

### UG-063 — Guest commerce UGC reward açmaz

**Binding Rule:** Guest payment/order oluşumu review/story reward hakkı açılmış gibi yorumlanmaz; auth + relevant eligibility zorunludur.

---

## 11. Return / fraud / risk sonrası etkiler

### UG-070 — Return sonrası trust ve entitlement etkileri yeniden değerlendirilir

**Binding Rule:** Return veya refund, verified purchase, review trust etkisi, story trust etkisi ve reward bağlamını değiştirebilir.

### UG-071 — Return tüm UGC’yi otomatik yok etmez

**Binding Rule:** İade olmuş işlem, review/story geçmişini otomatik hard delete gerekçesi yapmaz; visibility, trust ve reward etkisi ayrı değerlendirilir.

### UG-072 — Fraud / abuse sinyali UGC create ve visibility’yi daraltabilir

**Binding Rule:** Sahte review, organize story üretimi, çoklu hesap katkısı veya reward abuse şüphesinde create/publish/visibility hakları düşebilir.

### UG-073 — Risk blockesi ve moderation blockesi aynı UI diliyle gizlenmez

**Binding Rule:** Mümkünse moderation, policy ve abuse kaynaklı blok nedenleri semantik olarak ayrıştırılır.

---

## 12. PDP bağlamı ve sosyal bağlam ayrımları

### UG-080 — PDP’de review, Q&A ve user story ayrı katmanlardır

**Binding Rule:** PDP bu üç alanı karıştırmadan göstermelidir; tek birleşik sosyal akışa dönüştürmez.

### UG-081 — UGC PDP’de karar destek katmanıdır, keşfet akışı değildir

**Binding Rule:** PDP’deki UGC ürün kararı ve güven desteği içindir; keşfet/feed mantığına dönüştürülmez.

### UG-082 — Review, question ve story aynı CTA semantiğini kullanmaz

**Binding Rule:** Her UGC türünün login gate, eligibility gate, blocked state ve under-review dili kendi semantiğine göre görünür olmalıdır.

### UG-083 — PDP social layer ile content layer karıştırılmaz

**Binding Rule:** Ürünle ilişkili genel content alanı ile PDP’ye özgü sosyal/UGC alanı ayrı owner ve ayrı response mantığında korunur.

---

## 13. UI / API davranış kuralları

### UG-090 — Login gate ile eligibility gate ayrımı korunur

**Binding Rule:** Guest user için login_required; auth sahibi ama hakkı açılmamış actor için eligibility_closed / blocked / restricted / under_review gibi durumlar kullanılır.

### UG-091 — Empty, blocked, degraded, under_review ve taken_down karıştırılmaz

**Binding Rule:** İçerik yokluğu, hak kapısı, veri bozulması, inceleme altı ve aktif görünürlükten çekilmiş olma farklı state’lerdir.

### UG-092 — Pending moderation veya pending visibility sahte published/visible gibi gösterilmez

**Binding Rule:** UGC için sahte kesinlik dili kullanılmaz.

### UG-093 — Kanonik state / error aileleri korunur

**Binding Rule:** En az şu aileler görünür kalmalıdır:

* REVIEW_ELIGIBILITY_NOT_ACTIVE
* STORY_ELIGIBILITY_NOT_ACTIVE
* VERIFIED_PURCHASE_NOT_ACTIVE
* blocked
* restricted
* under_review
* taken_down
* archived

---

## 14. Faz-1 açık ve sonraki aşamaya bırakılan alanlar

### 14.1 Bu dosyada bağlanan alanlar

* review create / visibility kuralları
* question-answer create / visibility kuralları
* user product story create / visibility kuralları
* create / publish / visible / archive ayrımları
* moderation / policy / risk etkileri
* reward / eligibility ilişkisi
* return sonrası UGC etkileri
* PDP bağlamı ayrımları

### 14.2 Sonraki detaylandırma alanları

* appeal / restore süreçleri
* cold storage / purge detay matrisi
* daha ileri quality scoring ve ranking etkileri
* toplu abuse escalation senaryoları

---

## 15. Kısa sonuç

Bu rulebook ile aşağıdaki çekirdek UGC kararları sert biçimde sabitlenmiş olur:

* review, question-answer ve user product story aynı şey değildir
* review ve story teslimat-sonrası hak alanıdır
* question auth ister ama purchase/delivery zorunluluğu taşımaz
* PDP’de yalnız user product story strip bulunur
* user product story keşfet üst şeridine düşmez
* create, publish, visible, restricted, taken_down ve archived farklı durumlardır
* moderation ve risk aynı etki kaynağı değildir
* reward, visibility ve trust birbirinin yerine geçmez
* return sonrası UGC etkileri yeniden değerlendirilir ama geçmiş içerik otomatik hard delete edilmez

Bu dosya, platformun UGC alanında bağlayıcı ve yoruma kapalı kanonik rulebook’tur.
