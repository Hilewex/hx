# FAZ_1_KAPSAM_LISTESI

Bu dosya, platformun ana kapsamını dondurur.

Net kural:
54 dosyada tanımlanan sistem ve özelliklerin tamamı ana kapsam içindedir.
Bu dosya kapsam eleme yapmak için değil, ana kapsamı tek listede sabitlemek için hazırlanmıştır.

Bu nedenle burada:
- “faz-2’ye bırakıldı” mantığı kullanılmaz
- kapsam küçültme yapılmaz
- yalnız ana kapsamın tam listesi ve ana kümeleri tanımlanır

---

## 1. TICARI CEKIRDEK KAPSAMI

Aşağıdaki sistemler ana ticari çekirdeğin zorunlu parçalarıdır:

1-havuz sistemi(8).md  
4-pdp sistemi(6).md  
10-kategori-plp sistemi(2).md  
12- Arama Sistemi(1).md  
13-sepet sistemi (1).md  
14-checkout sistemi (1).md  
15-ödeme sistemi (1).md  
16-sipariş sistemi (1).md  
17- kargo ve teslimat sistemi(1).md  
18- iptal ve iade sistemi (1).md  
24-adres sistem,.md  
26-varyant sistemi.md  
27-merkezi stok sistemi.md  
28-ürün kabul - onay sistemi.md  
29-merkezi fiyat sistemi.md  
30-sipariş takip sistemi.md  
35-kampanya sistemi.md  
46-kupon sistemi.md  
47-finansal mutabakat  hakediş sistemi.md  
54-payaut ödeme çıkış sistemi.md  
52-kategori taksonomi sistemi.md  

Bu küme:
ürün kabul
ürün sunumu
ürün buldurma
satın alma
ödeme
sipariş
teslimat
iade
fiyat
stok
kampanya/kupon
finansal dağılım
zincirini kapsar.

---

## 2. KULLANICI, KIMLIK VE ERISIM KAPSAMI

Aşağıdaki sistemler kullanıcı kimliği, erişim ve hak açma omurgasını oluşturur:

3- kullanıcı-müşteri sistemi(7).md  
23-üyelik giriş sistemi.md  
24-adres sistem,.md  
25-kural -yetki sistemi.md  

Bu küme:
misafir kullanıcı
kayıtlı kullanıcı
guest checkout
eligibility
rol/scope
ownership
guard yapıları
alanlarını kapsar.

---

## 3. SOSYAL-COMMERCE VE YUZEY KAPSAMI

Aşağıdaki sistemler platformun sosyal-commerce karakterini oluşturan ana görünür yüzeylerdir:

2-fenoemen mağaza sistemi(8).md  
5-story sistemi(6).md  
6-video sistemi(3).md  
7-keşfet sistemi(3).md  
8-klasik ürün kart sistemi(3).md  
9-ana sayfa sistemi(2).md  
11-takip sistemi(2).md  
21-post sistemi (1).md  
33-beğenme kaydetme  paulaşma sistemi.md  
36-beğen ve kaydet sayfaları sistemi.md  
37-öneri ve sıralama sistemi.md  

Bu küme:
mağaza vitrini
story
video kart
keşfet
takip
post
etkileşim
öneri/sıralama
yüzeylerini kapsar.

---

## 4. KULLANICI KATKISI, GUVEN VE TOPLULUK KAPSAMI

Aşağıdaki sistemler kullanıcı katkısı, sosyal kanıt ve güven omurgasını kurar:

31-yorum ve puanlama sistemi.md  
32-soru cevap sistemi.md  
34-kullanıcı story sistemi.md  
38-puan market sistemi.md  
39-ödül puan sistemi.md  
22-moderasyon sistemi(1).md  
49-fraud risk abuse sistemi.md  

Bu küme:
yorum
yıldız puanı
ürün bazlı soru-cevap
kullanıcı story
ödül puanı
puan market
moderasyon
risk/abuse
alanlarını kapsar.

---

## 5. YONETIM VE PANEL KAPSAMI

Aşağıdaki sistemler yönetim, panel ve denetim omurgasını oluşturur:

40-admin sistemi.md  
41- fenomen yönetim sistemi.md  
42-fenomen mağaza yönetim panel sistemi.md  
43-tedarikçi panel sistemi.md  
44-tedarikçi yönetim sistemi.md  
45-sipariş operasyon sistemi.md  
53- destek ticket operasyon sistemi.md  

Bu küme:
admin merkezi
fenomen yaşam döngüsü
fenomen paneli
tedarikçi paneli
tedarikçi yaşam döngüsü
sipariş operasyonu
ticket operasyonu
alanlarını kapsar.

---

## 6. DESTEK, BILDIRIM VE OPERASYON KAPSAMI

Aşağıdaki sistemler kullanıcı ile operasyon arasındaki servis katmanını kapsar:

19- bildirim sistemi(1).md  
20-destek sistemi (1).md  
30-sipariş takip sistemi.md  
53- destek ticket operasyon sistemi.md  

Bu küme:
bildirim
destek girişi
sipariş görünürlüğü
ticket yönlendirme ve çözüm
alanlarını kapsar.

---

## 7. ALTYAPI, ARAMA, MEDYA VE ANALITIK KAPSAMI

Aşağıdaki sistemler görünmeyen ama zorunlu teknik ve veri omurgasını kapsar:

48-arka paln analatik ölçümleme sistemi.md  
50-medya sistemş asset  sitemi.md  
51-arama  indeksleme sistemi.md  
52-kategori taksonomi sistemi.md  
47-finansal mutabakat  hakediş sistemi.md  
49-fraud risk abuse sistemi.md  

Bu küme:
ölçümleme
event omurgası
medya yaşam döngüsü
retrieval / indeksleme
taksonomi
finansal hesaplama
risk sinyali
alanlarını kapsar.

---

## 8. ANA KAPSAM ICINDE ZORUNLU CAPRAZ KURALLAR

Bu ana kapsam içinde aşağıdaki çapraz kurallar zorunlu kabul edilir:

- Owner dışı write yoktur
- BFF read-only aggregation katmanıdır
- Panel direct write yapmaz
- UI truth üretmez
- Event, owner truth mutate etmez
- Payment, checkout’tan ayrıdır
- Order, yalnız başarılı payment sonrası oluşur
- Settlement ve payout ayrıdır
- Pending / vested / spendable puan ayrımı vardır
- Story görünürlüğü ile story kaydı aynı şey değildir
- Medya truth’u ile görünür medya katmanı ayrıdır
- Guest checkout sosyal write hakları açmaz
- Kampanya ve kupon birlikte çalışsa da sponsor ve fiyat koridoru kuralları korunur

---

## 9. ANA KAPSAMIN KODLAMAYA HAZIRLIK ANLAMI

Bu dosyadaki liste, ürün kapsamını küçültmez.
Tam tersine, kodlama öncesi hazırlık sürecinde şu anlama gelir:

- tüm sistemler ana kapsam içindedir
- tüm sistemler için kod yazılmadan önce owner, state, veri modeli ve sözleşme netliği sağlanmalıdır
- bazı sistemler daha sonra kodlanabilir; ama ana kapsamın dışında sayılmaz
- öncelik sırası olabilir, kapsam elemesi olmaz

Net sonuç:
Bu platformun ana kapsamı 54 dosyada tanımlanan bütün özelliklerdir.