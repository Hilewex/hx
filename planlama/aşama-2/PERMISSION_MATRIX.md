# PERMISSION_MATRIX

Bu matris, platformdaki temel izinleri (permission / capability) ve bu izinlerin hangi aktörlerde, hangi şartlarla açıldığını tanımlar.

Net kural:
- permission, role ile aynı şey değildir
- auth sahibi olmak, permission sahibi olmak için yeterli olmayabilir
- birçok permission eligibility ile birlikte çalışır
- panel permission’ları da owner truth’u doğrudan mutate etme hakkı vermez
- permission verilse bile owner sınırı korunur

---

## 1. PUBLIC / GUEST KATMANI PERMISSION'LARI

### Can_View_Public_Surface
#### Kimlerde
- misafir kullanıcı
- kayıtlı kullanıcı
- fenomen
- tedarikçi
- admin (gerekirse)

#### Kapsam
- ana sayfa
- keşfet
- kategori / PLP
- PDP
- fenomen mağazası
- açık içerik yüzeyleri

#### Not
Bu permission, sosyal write veya sahiplik bağlı aksiyon vermez.

---

### Can_Add_To_Cart
#### Kimlerde
- misafir kullanıcı
- kayıtlı kullanıcı

#### Kapsam
- sepete ürün ekleme
- sepet düzenleme
- varyant seçimi sonrası sepet akışı

#### Ön koşullar
- ürün aktif
- ürün görünür
- varyant seçimi tam
- stok uygunluğu anlık kontrol seviyesinde kabul edilebilir

#### Not
Bu permission rezervasyon garantisi anlamına gelmez.

---

### Can_Start_Guest_Checkout
#### Kimlerde
- misafir kullanıcı

#### Kapsam
- kontrollü guest checkout başlatma
- gerekli minimum iletişim/teslimat/ödeme hazırlığı adımlarına girme

#### Ön koşullar
- guest checkout business rule olarak açık
- sepet geçerli
- checkout eligibility sağlanmış

#### Not
Bu permission sosyal hak açmaz.
Guest checkout, sosyal/hesap bağlı write aksiyonlara kapı açmaz.

---

## 2. AUTHENTICATED USER PERMISSION'LARI

### Can_Login
#### Kimlerde
- misafir kullanıcı → kayıtlı kullanıcıya geçiş akışı

#### Kapsam
- auth oluşturma
- session açma
- shopper profile erişimi

---

### Can_Use_Shopper_Profile
#### Kimlerde
- kayıtlı kullanıcı
- profile switch ile shopper scope’a geçmiş kullanıcı

#### Kapsam
- hesap bağlı müşteri aksiyonları
- sipariş geçmişi
- destek
- puan alanları
- kayıtlı adresler

---

### Can_Like
#### Kimlerde
- kayıtlı kullanıcı

#### Ön koşullar
- auth var
- ilgili yüzey beğeni aksiyonunu destekliyor

#### Kapsam
- ürün
- story
- post
- ilgili izinli yüzeyler

---

### Can_Save
#### Kimlerde
- kayıtlı kullanıcı

#### Ön koşullar
- auth var
- ilgili yüzey kaydetme aksiyonunu destekliyor

#### Kapsam
- ürün
- izin verilmişse story/post vb.

---

### Can_Share
#### Kimlerde
- misafir kullanıcı veya kayıtlı kullanıcı
  (ürün kararıyla daraltılabilir)

#### Ön koşullar
- ilgili yüzey paylaşım aksiyonunu destekliyor

#### Not
Paylaşım, auth gerektirmeyen bir yüzey aksiyonu olarak da tasarlanabilir; nihai ürün kararıyla sabitlenmelidir.

---

### Can_Follow_Creator
#### Kimlerde
- kayıtlı kullanıcı

#### Ön koşullar
- auth var
- fenomen mağaza aktif/görünür
- kullanıcı hesabı follow aksiyonuna açık

---

### Can_Send_Message
#### Kimlerde
- kayıtlı kullanıcı

#### Ön koşullar
- auth var
- mesajlaşma sistemi ilgili bağlamda açık
- hesabın mesaj hakkı engellenmemiş

#### Not
Destek sistemi ile sosyal mesajlaşma aynı permission alanı değildir.

---

### Can_Ask_Question
#### Kimlerde
- kayıtlı kullanıcı

#### Ön koşullar
- auth var
- PDP bağlamı var
- ürün görünür/aktif
- kullanıcı ask-question açısından engelli değil

#### Kapsam
- ürün bazlı soru oluşturma

#### Not
Soru, ürün bazlıdır; mağaza mesajı yerine geçmez.

---

### Can_Write_Review
#### Kimlerde
- kayıtlı kullanıcı

#### Ön koşullar
- review eligible
- ürün satın alınmış olmalı
- ilgili sipariş satırı teslim edilmiş olmalı
- ürün başına yorum hakkı kuralları sağlanmış olmalı

#### Not
Bu permission auth ile değil, eligibility ile açılır.

---

### Can_Create_User_Product_Story
#### Kimlerde
- kayıtlı kullanıcı

#### Ön koşullar
- story eligible
- ürün satın alınmış olmalı
- ilgili sipariş satırı teslim edilmiş olmalı
- ürün etiketi bağlanabilmeli
- moderasyon / risk blokesi olmamalı

---

### Can_View_Orders
#### Kimlerde
- kayıtlı kullanıcı

#### Kapsam
- kendi siparişleri
- kendi sipariş takip ekranı
- kendi iade/iptal görünürlüğü

---

### Can_Request_Return
#### Kimlerde
- kayıtlı kullanıcı

#### Ön koşullar
- return eligible
- ilgili sipariş/satır iade kurallarına uygun
- iade süresi ve durum koşulları sağlanıyor

---

### Can_Use_Reward_Points
#### Kimlerde
- kayıtlı kullanıcı

#### Ön koşullar
- spendable puan bakiyesi var
- risk/fraud blokesi yok
- puan market işlemi açık

#### Not
Pending veya yalnız vested puan kullanılamaz; spendable gerekir.

---

### Can_View_Reward_Balance
#### Kimlerde
- kayıtlı kullanıcı

#### Kapsam
- pending / vested / spendable ayrımlı puan görünümü
- puan geçmişi
- puan borcu/eksi bakiye görünümü gerekiyorsa

---

## 3. ELIGIBILITY TEMELLI USER PERMISSION'LARI

### Can_Checkout
#### Kimlerde
- kayıtlı kullanıcı
- misafir kullanıcı (guest checkout açık ise)

#### Ön koşullar
- sepet geçerli
- ürünler görünür/aktif
- varyant seçimi tam
- checkout giriş kuralları sağlanmış
- risk blokesi yok
- gerekli iletişim/adres bağlamı kurulabilir

---

### Can_Pay
#### Kimlerde
- checkout’u geçmiş uygun kullanıcı

#### Ön koşullar
- checkout valid
- payment giriş koşulları sağlanmış
- risk/fraud/financial block yok
- toplam tutar netleşmiş

#### Not
Can_Checkout ile Can_Pay aynı şey değildir.

---

### Can_View_Verified_Purchase_Badges
#### Kimlerde
- storefront / PDP görünümü
- ilgili projection owner sistemler

#### Not
Bu bir kullanıcı aksiyonundan çok system-derived visibility permission’ıdır.
Verified purchase badge görünürlüğü iade ve uygunluk etkileriyle değişebilir.

---

## 4. FENOMEN PERMISSION'LARI

### Can_Use_Creator_Profile
#### Kimlerde
- onaylı fenomen

#### Kapsam
- fenomen scope’una geçiş
- fenomen panel erişimi
- mağaza yönetim alanları

---

### Can_Manage_Storefront
#### Kimlerde
- onaylı fenomen

#### Ön koşullar
- creator lifecycle aktif
- kategori/yetki kısıtı yok
- mağaza askıda değil

#### Kapsam
- mağaza açıklaması
- mağaza içi görünüm
- izinli vitrin düzeni
- mağaza post/story üretimi

---

### Can_Select_From_Pool
#### Kimlerde
- onaylı fenomen

#### Ön koşullar
- ürün havuzda aktif/onaylı
- creator kategori yetkisi uygun

---

### Can_Set_Store_Level_Pricing_Within_Range
#### Kimlerde
- onaylı fenomen

#### Ön koşullar
- ürün ilgili koridor içinde fiyatlanabilir
- kampanya/kupon/fiyat rejimi izin veriyor
- creator restriction yok

#### Not
Bu permission bağımsız fiyat owner’lığı vermez.

---

### Can_Create_Creator_Post
#### Kimlerde
- onaylı fenomen

#### Ön koşullar
- creator aktif
- moderation/risk blokesi yok
- mağaza içerik hakkı kısıtlanmamış

---

### Can_Create_Creator_Story
#### Kimlerde
- onaylı fenomen

#### Ön koşullar
- creator aktif
- izin verilen story türü için hak açık
- moderation/risk blokesi yok

---

### Can_View_Store_Performance_Summary
#### Kimlerde
- onaylı fenomen

#### Kapsam
- mağaza bazlı sade performans
- takipçi / etkileşim / görünüm / satış özeti

#### Not
Bu permission financial truth detaylarını açmaz.

---

### Can_Create_Creator_Coupon
#### Kimlerde
- onaylı fenomen

#### Ön koşullar
- kupon sistemi bu creator için açık
- kupon sponsor modeli izin veriyor
- creator restriction yok

#### Not
Creator kuponu, platform sponsor modelini bypass edemez.

---

## 5. TEDARIKÇI PERMISSION'LARI

### Can_Use_Supplier_Panel
#### Kimlerde
- onaylı tedarikçi

#### Ön koşullar
- supplier lifecycle aktif
- panel erişimi açık
- askı/kısıt yok

---

### Can_Upload_Product_Data
#### Kimlerde
- onaylı tedarikçi

#### Ön koşullar
- kategori yükleme yetkisi var
- supplier kısıtlı/askıda değil

---

### Can_Update_Stock
#### Kimlerde
- onaylı tedarikçi

#### Ön koşullar
- ürün kendi kapsamına ait
- stock update yetkisi açık
- supplier aktif

#### Not
Stok truth owner’ı platform merkezli olabilir; tedarikçi burada kaynak input üretir.

---

### Can_Update_Base_Price
#### Kimlerde
- onaylı tedarikçi

#### Ön koşullar
- ürün kendi kapsamına ait
- base price update yetkisi açık
- supplier aktif

#### Not
Baz fiyat girmek, satış fiyatı owner’lığı vermez.

---

### Can_Update_Logistics_Data
#### Kimlerde
- onaylı tedarikçi

#### Kapsam
- boyut/ağırlık/lojistik alanları
- fulfillment için gerekli veriler

---

### Can_Process_Assigned_Fulfillment
#### Kimlerde
- onaylı tedarikçi

#### Ön koşullar
- ilgili sipariş/satır supplier’a atanmış
- operasyon kısıtı yok

#### Kapsam
- hazırlama
- paketleme girdileri
- sevkiyat bilgisi sağlama

---

### Can_Submit_Technical_QA_Draft
#### Kimlerde
- onaylı tedarikçi

#### Ön koşullar
- soru kendi ürününe ait
- supplier bilgi katkısı hakkı açık

#### Not
Bu permission resmi cevap owner’lığı vermez; yalnız taslak katkı verir.

---

## 6. ADMIN / YONETIM PERMISSION'LARI

### Can_Review_Creator_Application
#### Kimlerde
- admin / creator admin

### Can_Review_Supplier_Application
#### Kimlerde
- admin / supplier admin

### Can_Assign_Category_Permission
#### Kimlerde
- admin

### Can_Restrict_Creator
#### Kimlerde
- admin / creator admin

### Can_Suspend_Creator
#### Kimlerde
- admin / creator admin

### Can_Restrict_Supplier
#### Kimlerde
- admin / supplier admin

### Can_Suspend_Supplier
#### Kimlerde
- admin / supplier admin

### Can_Approve_Product
#### Kimlerde
- admin / commerce admin / product acceptance owner role

### Can_Reject_Product
#### Kimlerde
- admin / commerce admin / product acceptance owner role

### Can_Manage_Campaign
#### Kimlerde
- admin / commerce admin

### Can_Manage_Coupon_Rules
#### Kimlerde
- admin / commerce admin

### Can_Manage_Reward_Point_Rules
#### Kimlerde
- admin / finance/admin-authorized role

### Can_View_Financial_Dashboard
#### Kimlerde
- finance admin / authorized admin

### Can_Manage_Payout_Hold_Release
#### Kimlerde
- finance admin / authorized admin

### Can_Manage_Moderation_Decision
#### Kimlerde
- moderator / moderation admin

### Can_Manage_Risk_Flag
#### Kimlerde
- fraud/risk admin

### Can_Manage_Order_Operation
#### Kimlerde
- operations admin

### Can_Manage_Support_Ticket_Routing
#### Kimlerde
- support admin / support agent (scope’a bağlı)

#### Ortak kritik not
Bu permission’ların hiçbiri paneli direct write owner’ı yapmaz.
Aksiyon owner sistemlere protected action / command olarak gider.

---

## 7. SYSTEM / INTERNAL PERMISSION'LARI

### Can_Consume_Event
#### Kimlerde
- internal service / worker

### Can_Publish_Event
#### Kimlerde
- ilgili owner sistem

### Can_Update_Projection
#### Kimlerde
- projection owner internal service’ler

### Can_Run_Async_Reconciliation
#### Kimlerde
- financial owner/internal workers

### Can_Update_Search_Documents
#### Kimlerde
- search/indexing owner workers

### Can_Ingest_Analytics_Event
#### Kimlerde
- analytics owner workers

### Can_Issue_Notification
#### Kimlerde
- notification owner workers / services

#### Not
Internal permission’lar da owner sınırına tabidir.

---

## 8. OZEL KURAL SETI

### Auth != Permission
Giriş yapılmış olması, tüm permission’ların açıldığı anlamına gelmez.

### Permission != Owner
Bir aktör belirli aksiyonu başlatabilir; ama truth mutation yine owner sistemde olur.

### Panel Permission != Direct Write
Panel aksiyonu vardır; panel owner değildir.

### Eligibility Permission'dan once gelir
Review, story, return, pay gibi alanlar için eligibility kontrolü permission’ın alt şartıdır.

### Moderation ve Risk ayrıdır
Content visibility permission’ları ile fraud hold/review permission’ları karıştırılmaz.