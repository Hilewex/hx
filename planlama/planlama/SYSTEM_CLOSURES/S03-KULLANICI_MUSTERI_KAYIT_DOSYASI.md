# S03 — KULLANICI / MÜŞTERİ SİSTEMİ KAYIT DOSYASI

## 1. Sistem Özeti

Kullanıcı / Müşteri Sistemi, platformdaki normal müşterinin hesap/profil sınırını, misafir-kayıtlı kullanıcı ayrımını, adres ve checkout ön uygunluğunu, yorum/soru/story katkı uygunluğunu, takip/mesaj uygunluğunu, puan/ödül uygunluğunu ve sipariş/destek görünürlük sınırlarını yöneten müşteri omurgasıdır.

Bu sistemin temel amacı kullanıcının kim olduğunu, hangi durumda hangi aksiyona uygun olduğunu ve hangi işlemlerin başka sistemlerin sorumluluğunda kaldığını netleştirmektir.

Kullanıcı sistemi şu alanların sahibi değildir:

- gerçek auth/session
- sepet truth
- checkout truth
- ödeme truth
- sipariş truth
- kargo/teslimat truth
- iade/iptal truth
- yorum kaydı truth
- soru-cevap kaydı truth
- kullanıcı story truth
- puan bakiyesi truth
- destek ticket truth
- finans/payout truth
- fraud/risk karar truth
- moderasyon karar truth

---

## 2. Temel Mimari Karar

Kullanıcı / Müşteri Sistemi, doğrudan tüm müşteri işlemlerini yapan büyük bir monolit değildir.

Bu sistemin görevi:

- müşteri profil sınırını kurmak
- misafir / kayıtlı kullanıcı ayrımını belirlemek
- aktif / askıda / kapalı kullanıcı durumlarını yönetmek
- kullanıcı aksiyonlarının eligibility sonucunu üretmek
- farklı sistemlere giden müşteri temas noktalarını sınırlandırmak

Başka sistemlerin truth alanları kullanıcı sistemine taşınmayacaktır.

---

## 3. Yapılan Paketler

### PX-KULLANICI-01 — Customer Account / Profile Boundary Foundation

**Karar:** PASS WITH LIMITATION

**Yapılanlar:**

- Customer profile foundation kuruldu.
- Kayıtlı müşteri profil kaydı oluşturuldu.
- Guest context ile persistent customer profile ayrıldı.
- Misafir kullanıcının kalıcı müşteri profili oluşturması engellendi.
- Customer kendi profilini güncelleyebilir hale geldi.
- Customer başka profil üzerinde işlem yapamaz hale geldi.
- Admin suspend / reactivate / close akışı eklendi.
- Suspended profile update engellendi.
- Closed profile reactivate engellendi.
- BFF/port kaynaklı smoke problemi nedeniyle service-level smoke yaklaşımı benimsendi.

**Ek repair: PX-KULLANICI-01-R2**

**Karar:** PASS

**Yapılanlar:**

- Eski BFF/HTTP bazlı customer smoke’un port karışıklığı nedeniyle takıldığı tespit edildi.
- 3000 portunda BFF yerine Next.js/web çalıştığı için customer smoke’un yanlış hedefe gittiği netleşti.
- Customer domain davranışı BFF/HTTP’den ayrıldı.
- `customer-service-smoke.ts` oluşturuldu.
- Customer service davranışı doğrudan service-level smoke ile doğrulandı.

**Kapsam dışı:**

- gerçek auth/session entegrasyonu
- gerçek kullanıcı kayıt/login akışı
- sepet/checkout/order entegrasyonu
- yorum/soru/story/puan/destek feature’ları

---

### PX-KULLANICI-02 — Guest vs Registered User Boundary Hardening

**Karar:** PASS WITH LIMITATION

**Yapılanlar:**

- CustomerCapability eklendi.
- Guest / Active / Suspended / Closed kullanıcı ayrımı capability seviyesinde kuruldu.
- Guest kullanıcının kalıcı müşteri aksiyonları engellendi.
- Guest katalog gezebilir ve sepete ekleyebilir foundation kararı verildi.
- Guest yorum/story/takip/mesaj/puan gibi kalıcı aksiyonları yapamaz hale geldi.
- Registered active customer için bazı aksiyonlarda foundation ALLOW döndürüldü.
- Suspended customer aktif müşteri aksiyonlarında kısıtlandı.
- Closed customer aktif müşteri aksiyonlarında kapatıldı.
- `/customer/capability/check` endpoint’i eklendi.

**Kapsam dışı:**

- gerçek checkout başlatma
- gerçek yorum/soru/story oluşturma
- gerçek takip/mesaj kaydı
- gerçek puan kazanma
- gerçek support ticket

---

### PX-KULLANICI-03 — Customer Address / Checkout Eligibility Alignment

**Karar:** PASS WITH LIMITATION

**Yapılanlar:**

- Customer Address boundary izole olarak eklendi.
- CustomerAddress contract/service/BFF route’ları oluşturuldu.
- Guest kullanıcının kalıcı adres oluşturması engellendi.
- Active customer kendi adresini oluşturabilir/güncelleyebilir hale geldi.
- Default address seçimi kuruldu.
- Archived address’in default yapılması engellendi.
- Suspended customer adres ekleyemez hale geldi.
- Closed customer checkout eligibility alamaz hale geldi.
- Checkout eligibility sadece ALLOW/DENY + reason olarak döndürüldü.
- Gerçek checkout session oluşturulmadı.
- Cart / Checkout / Order / Payment domainlerine logic eklenmedi.

**Önemli not:**

PX-KULLANICI-03 sırasında `customer-service-smoke` reason validation beklentisi `>= 10 karakter` kuralıyla hizalandı.

**Kapsam dışı:**

- gerçek checkout
- ödeme
- sipariş oluşturma
- kargo hesaplama
- fatura
- adres doğrulama servisi
- kupon/kampanya uygulama
- stok rezervasyonu

---

### PX-KULLANICI-04 — Customer Contribution Eligibility: Review / Q&A / Story

**Karar:** PASS WITH LIMITATION

**Yapılanlar:**

- Customer Contribution Eligibility izole paket olarak kuruldu.
- PRODUCT_QUESTION, PRODUCT_REVIEW ve USER_PRODUCT_STORY ayrımı yapıldı.
- Guest kullanıcı yorum/soru/story oluşturamaz hale geldi.
- Active registered customer ürün sorusu için foundation seviyesinde eligible olabilir hale geldi.
- Review eligibility `delivered + verifiedPurchase` şartına bağlandı.
- User product story eligibility `delivered + verifiedPurchase` şartına bağlandı.
- Suspended / Closed customer katkı oluşturamaz hale geldi.
- moderationBlocked ve riskBlocked durumları DENY yapıldı.
- Gerçek review, Q&A veya story kaydı oluşturulmadı.
- Gerçek order, moderation veya risk sistemine gidilmedi; command context flag’leri kullanıldı.

**Kapsam dışı:**

- gerçek yorum oluşturma
- gerçek soru-cevap oluşturma
- gerçek kullanıcı story oluşturma
- gerçek order/fulfillment doğrulama
- gerçek moderation/risk entegrasyonu

---

### PX-KULLANICI-05 — Customer Follow / Message Boundary Alignment

**Karar:** PASS WITH LIMITATION

**Yapılanlar:**

- Customer Social Eligibility izole paket olarak eklendi.
- FOLLOW_STOREFRONT ve SEND_STORE_MESSAGE aksiyonları ayrıldı.
- Guest follow/message DENY yapıldı.
- Suspended ve Closed customer follow/message DENY yapıldı.
- Active registered customer için uygun koşullarda follow/message ALLOW döndürüldü.
- Hidden/Suspended storefront için follow/message DENY foundation kuralı kuruldu.
- AlreadyFollowing durumunda follow DENY döndürüldü.
- messageAllowedByStorefront false ise message DENY döndürüldü.
- `/customer/social-eligibility/check` endpoint’i eklendi.
- Gerçek follow relation oluşturulmadı.
- Gerçek message thread oluşturulmadı.
- Notification dispatch yapılmadı.

**Kapsam dışı:**

- gerçek takip grafiği
- gerçek mesaj thread’i
- canlı chat
- websocket
- notification dispatch
- store-post feed üretimi
- support ticket veya Q&A oluşturma

---

### PX-KULLANICI-06 — Customer Points / Reward Eligibility Foundation

**Karar:** PASS WITH LIMITATION

**Yapılanlar:**

- Customer Reward Eligibility izole paket olarak kuruldu.
- Guest / Suspended / Closed customer puan kazanamaz kuralı eklendi.
- Purchase delivered + notReturned için earn eligibility kuruldu.
- Review approved için earn eligibility kuruldu.
- User story approved için earn eligibility kuruldu.
- Return/refund, review deleted, story removed, moderation rejected için revoke eligibility kuruldu.
- Risk/moderation blocked durumları DENY yapıldı.
- `/customer/reward-eligibility/check` endpoint’i eklendi.
- Gerçek point balance mutate edilmedi.
- Gerçek reward transaction oluşturulmadı.
- Coupon / campaign / finance / payout mutation yapılmadı.

**Kapsam dışı:**

- puan bakiyesi tutma
- puan market işlemi
- kupon üretme
- finansal kayıt
- payout
- gerçek order/review/story/moderation entegrasyonu
- kampanya motoru

---

### PX-KULLANICI-07 — Customer Support / Order Visibility Boundary

**Karar:** PASS WITH LIMITATION

**Yapılanlar:**

- Customer Support / Order Visibility boundary izole paket olarak kuruldu.
- Guest order/support DENY yapıldı.
- Active customer own order ALLOW yapıldı.
- Active customer foreign order DENY yapıldı.
- Active customer support context kuralları eklendi.
- Suspended customer için yalnız mevcut sipariş bağlamında sınırlı destek izni verildi.
- Suspended support without order context DENY yapıldı.
- Closed customer order/support DENY yapıldı.
- `/customer/support-eligibility/check` endpoint’i eklendi.
- Gerçek order read yapılmadı.
- Gerçek support ticket oluşturulmadı.
- Payment/refund/finance mutation yapılmadı.
- Store message’ın destek yerine geçmediği boundary korundu.

**Kapsam dışı:**

- gerçek order read
- gerçek support ticket oluşturma
- ödeme/kargo/iade çözme
- refund başlatma
- ticket lifecycle
- support agent panel
- notification dispatch
- fraud/risk kararı
- finance mutation

---

## 4. Tamamlanan Alanlar

Kullanıcı / Müşteri Sistemi foundation hattında aşağıdaki alanlar tamamlandı:

- Customer profile foundation
- Guest context / registered customer ayrımı
- Customer account status: active / suspended / closed
- Admin suspend / reactivate / close
- Customer capability matrix
- Guest vs registered user boundary
- Customer address boundary
- Checkout eligibility foundation
- Contribution eligibility: review / Q&A / user story
- Social eligibility: follow / store message
- Reward eligibility: earn / revoke points
- Support / order visibility eligibility
- Customer service-level smoke yaklaşımı
- BFF/HTTP smoke için port riskinin tespiti
- Diğer sistemlerle regression smoke disiplini

---

## 5. Bilinçli Kapsam Dışı Bırakılanlar

Aşağıdaki konular bilinçli olarak Kullanıcı / Müşteri foundation hattının dışında bırakıldı:

- gerçek auth/session entegrasyonu
- gerçek kayıt/login akışı
- gerçek customer persistence / PostgreSQL
- gerçek adres doğrulama servisi
- gerçek checkout session oluşturma
- gerçek ödeme
- gerçek sipariş oluşturma veya sipariş okuma
- gerçek destek ticket oluşturma
- gerçek yorum oluşturma
- gerçek soru-cevap oluşturma
- gerçek kullanıcı story oluşturma
- gerçek takip relation persistence
- gerçek mesaj thread oluşturma
- gerçek puan bakiyesi
- gerçek reward transaction
- gerçek puan market işlemi
- gerçek kampanya/kupon motoru
- gerçek order/fulfillment verified purchase kontrolü
- gerçek moderation/risk entegrasyonu
- notification dispatch
- finance/payout mutation
- canlı chat / websocket

---

## 6. Açık Eksikler

### 6.1 Persistence Eksikliği

Kullanıcı sistemi foundation seviyesinde geçici / in-memory yapıdadır.

Kalıcı hale getirilmesi gereken alanlar:

- customer profile
- customer address
- capability karar kayıtları
- contribution eligibility audit
- social eligibility audit
- reward eligibility audit
- support/order eligibility audit

---

### 6.2 Gerçek Auth / Session Eksikliği

Actor context hâlâ header veya smoke context üzerinden taşınmaktadır.

İleri fazda gerçek auth/session owner ile bağlanmalıdır.

---

### 6.3 Gerçek Owner Entegrasyonları Eksik

Birçok eligibility kararında context flag kullanılmıştır.

İleri fazda şu veriler gerçek owner sistemlerden okunmalıdır:

- delivered / verifiedPurchase → Order / Fulfillment owner
- orderCustomerProfileId / hasExistingOrderContext → Order owner
- support topic / ticket eligibility → Support owner
- moderationBlocked → Moderation owner
- riskBlocked → Risk/Fraud owner
- reviewApproved / reviewDeleted → Review owner
- storyApproved / storyRemoved → User Story owner
- campaignEligible → Campaign owner
- point balance / reward transaction → Reward/Puan owner
- storefront visibility/status → Storefront owner
- messageAllowedByStorefront → Store Message / Storefront owner

---

### 6.4 BFF/HTTP Smoke Standardı Eksik

Customer smoke sırasında BFF port karmaşası yaşandı.

Tespit:

- 3000 portunda BFF yerine Next.js / web çalışabiliyor.
- BFF dinamik portta veya farklı portta ayağa kalkabiliyor.
- HTTP smoke testleri service-level smoke’a göre daha kırılgan.

Karar:

- Customer domain davranışı service-level smoke ile doğrulanmalıdır.
- BFF-level smoke ancak port/server lifecycle standardı netleşince kullanılmalıdır.

---

### 6.5 Build Order / Dist Dependency Riski

Önceki paketlerde `@hx/contracts` alias’ının `packages/contracts/dist` çıktısına dayanması kararlaştırılmıştı.

Temiz ortamda contracts build sırası kritik olabilir.

---

### 6.6 Eligibility Matrix’lerin Gerçek Sistemlerle Bağlanması

Şu an eligibility kararları foundation seviyesinde command context’e göre çalışıyor.

Production öncesi bu kararlar gerçek sistemlerden okunan durumlara bağlanmalıdır.

---

## 7. Riskler

### RISK-01 — Kullanıcı Sisteminin Monolite Dönüşmesi

Kullanıcı sistemi tüm müşteri işlemlerini sahiplenirse sistem sınırları karışır.

**Dikkat:**

Kullanıcı sistemi sadece profil ve eligibility boundary üretmelidir. Sepet, checkout, order, review, story, support, reward gibi truth alanları ilgili owner sistemlerde kalmalıdır.

---

### RISK-02 — Guest Kullanıcının Kalıcı Müşteri Gibi Davranması

Misafir kullanıcıya kalıcı profil, adres, yorum, story, puan veya takip/mesaj hakkı verilirse güven ve eligibility yapısı bozulur.

**Dikkat:**

Guest sadece sınırlı geçici aksiyonlara sahip olmalıdır.

---

### RISK-03 — Eligibility’nin Gerçek İşlem Gibi Algılanması

Eligibility ALLOW sonucu gerçek işlem yapılmış anlamına gelmez.

**Dikkat:**

- checkout eligibility gerçek checkout değildir
- reward eligibility gerçek puan değildir
- support eligibility gerçek ticket değildir
- contribution eligibility gerçek yorum/story/soru değildir
- social eligibility gerçek takip/mesaj değildir

---

### RISK-04 — BFF/Port Smoke Kırılganlığı

BFF/HTTP smoke testleri port karmaşası yüzünden takılabilir.

**Dikkat:**

Service-level smoke domain davranışı için esas alınmalı; BFF-level smoke ayrı port/lifecycle standardıyla yapılmalıdır.

---

### RISK-05 — Context Flag’lerin Gerçek Truth Sanılması

`delivered`, `verifiedPurchase`, `riskBlocked`, `moderationBlocked`, `hasExistingOrderContext` gibi alanlar şu an test context’inden geliyor.

**Dikkat:**

Production’da bunlar gerçek owner sistemlerden okunmalıdır.

---

### RISK-06 — Suspended / Closed Customer Kurallarının Karışması

Suspended kullanıcı bazı sınırlı destek/sipariş bağlamlarında hak sahibi olabilir; ancak aktif ticari/sosyal aksiyon yapamaz.

Closed kullanıcı aktif müşteri aksiyonu yapamaz.

---

### RISK-07 — Destek ve Mağaza Mesajının Karışması

Store message sosyal/ilişkisel iletişimdir.

Destek; sipariş, ödeme, kargo, iade, iptal gibi resmi sorunların yeridir.

---

## 8. Dikkat Edilecek Mimari Sınırlar

Aşağıdaki sınırlar korunmalıdır:

- Guest kalıcı müşteri profili değildir.
- Guest kalıcı adres oluşturamaz.
- Guest yorum, soru, story, takip, mesaj, puan kazanma ve sipariş geçmişi aksiyonları yapamaz.
- Registered customer profili auth/session owner değildir.
- Customer profile adres truth sahibi değildir.
- Customer profile order truth sahibi değildir.
- Customer profile point balance truth sahibi değildir.
- Customer contribution eligibility gerçek içerik kaydı oluşturmaz.
- Customer reward eligibility gerçek puan hareketi oluşturmaz.
- Customer support eligibility gerçek ticket oluşturmaz.
- Customer social eligibility gerçek follow/message kaydı oluşturmaz.
- Suspended customer aktif müşteri aksiyonlarında kısıtlanmalıdır.
- Closed customer aktif müşteri aksiyonu yapamaz.
- BFF business logic üretmez.
- Panel/UI truth üretmez.
- Projection truth değildir.

---

## 9. İleri Faz / Hardening Önerileri

### H01 — Customer Persistence Foundation

Amaç:

- customer profile
- customer address
- eligibility decision audit

kayıtlarını kalıcı hale getirmek.

---

### H02 — Auth / Session / Permission Integration

Amaç:

Header/smoke context yerine gerçek auth/session/permission owner ile customer actor bağını kurmak.

---

### H03 — Customer Eligibility Owner Integration

Amaç:

Eligibility kararlarında kullanılan context flag’leri gerçek owner sistemlerden okumak.

Bağlanacak sistemler:

- Order / Fulfillment
- Support
- Review
- Q&A
- User Story
- Moderation
- Risk/Fraud
- Reward/Puan
- Storefront

---

### H04 — BFF Smoke / Port Orchestration Standard

Amaç:

BFF HTTP smoke testlerinin port, lifecycle ve timeout standardını belirlemek.

---

### H05 — Customer Audit / Event Durability

Amaç:

Eligibility kararlarını ve önemli customer lifecycle değişikliklerini audit/event olarak saklamak.

---

### H06 — Guest Checkout Policy Finalization

Amaç:

Guest checkout gerçekten olacak mı, hangi sınırlarla olacak, kalıcı profil olmadan sipariş sonrası destek nasıl işleyecek netleştirmek.

---

### H07 — Suspended / Closed Account Policy Hardening

Amaç:

Suspended ve closed customer için sipariş geçmişi, destek, yasal saklama, privacy ve audit sınırlarını üretim seviyesinde netleştirmek.

---

## 10. Önemli Notlar

- Kullanıcı / Müşteri Sistemi foundation hattı tamamlanmıştır.
- Sistem production-ready değildir.
- Customer domain davranışları service-level smoke ile doğrulanmıştır.
- BFF/HTTP smoke port standardı henüz güvenilir değildir.
- Customer sistemi owner olmayan domainleri gerçek işlem olarak başlatmaz.
- Eligibility sonucu işlem yapılmış anlamına gelmez.
- Guest / Registered / Suspended / Closed ayrımı sistem genelinde korunmalıdır.
- Suspended kullanıcı sınırlı destek/order bağlamında farklı ele alınabilir.
- Closed kullanıcı aktif müşteri aksiyonu yapamaz.
- Support ve store message aynı şey değildir.
- Reward eligibility gerçek puan hareketi değildir.
- Contribution eligibility gerçek yorum/soru/story oluşturmaz.

---

## 11. Güncel Karar

### Foundation Durumu

PASS WITH LIMITATION

### Production Readiness

PARTIAL

### Sonraki Önerilen Aksiyon

Kullanıcı / Müşteri Sistemi için foundation hattı tamamlandığı için sıradaki sistem dosyasına geçilebilir.

Önerilen sıradaki sistem:

S04 — PDP Sistemi