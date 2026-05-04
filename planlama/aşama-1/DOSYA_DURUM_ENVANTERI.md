# DOSYA_DURUM_ENVANTERI

Bu envanterde tüm mevcut dosyalar, kodlamaya hazırlık açısından işlevsel kümelerine göre sınıflandırılmıştır.

Durum etiketleri:
- KANONIK / CEKIRDEK: platformun çekirdek iş ve truth omurgasını kuran dosya
- KANONIK / DESTEKLEYICI: çekirdek omurgayı tamamlayan iş kuralı ve yüzey dosyası
- KANONIK / YONETIM-PANEL: yönetim, panel, operasyon ve denetim alanı
- KANONIK / ALTYAPI-OMURGA: mimari, kural, arama, medya, analitik ve teknik omurga

---

## A. KANONIK / CEKIRDEK

1-havuz sistemi(8).md  
2-fenoemen mağaza sistemi(8).md  
3- kullanıcı-müşteri sistemi(7).md  
4-pdp sistemi(6).md  
10-kategori-plp sistemi(2).md  
12- Arama Sistemi(1).md  
13-sepet sistemi (1).md  
14-checkout sistemi (1).md  
15-ödeme sistemi (1).md  
16-sipariş sistemi (1).md  
17- kargo ve teslimat sistemi(1).md  
18- iptal ve iade sistemi (1).md  
23-üyelik giriş sistemi.md  
24-adres sistem,.md  
25-kural -yetki sistemi.md  
26-varyant sistemi.md  
27-merkezi stok sistemi.md  
28-ürün kabul - onay sistemi.md  
29-merkezi fiyat sistemi.md  
30-sipariş takip sistemi.md  
52-kategori taksonomi sistemi.md  

Bu küme, ürünün sisteme kabulünden müşterinin siparişi teslim almasına kadar olan ana ticari zinciri kurar.

---

## B. KANONIK / DESTEKLEYICI

5-story sistemi(6).md  
6-video sistemi(3).md  
7-keşfet sistemi(3).md  
8-klasik ürün kart sistemi(3).md  
9-ana sayfa sistemi(2).md  
11-takip sistemi(2).md  
19- bildirim sistemi(1).md  
20-destek sistemi (1).md  
21-post sistemi (1).md  
31-yorum ve puanlama sistemi.md  
32-soru cevap sistemi.md  
33-beğenme kaydetme  paulaşma sistemi.md  
34-kullanıcı story sistemi.md  
35-kampanya sistemi.md  
36-beğen ve kaydet sayfaları sistemi.md  
37-öneri ve sıralama sistemi.md  
38-puan market sistemi.md  
39-ödül puan sistemi.md  
46-kupon sistemi.md  

Bu küme, çekirdek ticaret omurgasının üstünde çalışan sosyal-commerce, görünürlük, etkileşim, promosyon ve bağlılık katmanlarını taşır.

---

## C. KANONIK / YONETIM-PANEL

40-admin sistemi.md  
41- fenomen yönetim sistemi.md  
42-fenomen mağaza yönetim panel sistemi.md  
43-tedarikçi panel sistemi.md  
44-tedarikçi yönetim sistemi.md  
45-sipariş operasyon sistemi.md  
53- destek ticket operasyon sistemi.md  
54-payaut ödeme çıkış sistemi.md  

Bu küme, platformun yönetim, panel, başvuru, denetim, sipariş operasyonu, çözüm ve payout uygulama katmanını taşır.

---

## D. KANONIK / ALTYAPI-OMURGA

22-moderasyon sistemi(1).md  
47-finansal mutabakat  hakediş sistemi.md  
48-arka paln analatik ölçümleme sistemi.md  
49-fraud risk abuse sistemi.md  
50-medya sistemş asset  sitemi.md  
51-arama  indeksleme sistemi.md  
60-KODLAMAYA HAZIRLIK YOL HARİTASI.md  
platform sistem ağacı (1).md  

Bu küme, platformun görünmeyen ama tüm diğer sistemleri besleyen denetim, finans, analitik, risk, medya, retrieval ve planlama omurgasını taşır.

---

## E. KODLAMAYA HAZIRLIKTA ONCELIK SIRASI

Kodlamaya hazırlık açısından okuma ve karar dondurma önceliği şu sırada ele alınmalıdır:

1. platform sistem ağacı (1).md
2. 60-KODLAMAYA HAZIRLIK YOL HARİTASI.md
3. 25-kural -yetki sistemi.md
4. 23-üyelik giriş sistemi.md
5. 12- Arama Sistemi(1).md
6. 13-sepet sistemi (1).md
7. 14-checkout sistemi (1).md
8. 15-ödeme sistemi (1).md
9. 16-sipariş sistemi (1).md
10. 17- kargo ve teslimat sistemi(1).md
11. 18- iptal ve iade sistemi (1).md
12. 29-merkezi fiyat sistemi.md
13. 27-merkezi stok sistemi.md
14. 47-finansal mutabakat  hakediş sistemi.md
15. 54-payaut ödeme çıkış sistemi.md
16. 22-moderasyon sistemi(1).md
17. 48-arka paln analatik ölçümleme sistemi.md
18. 49-fraud risk abuse sistemi.md
19. 50-medya sistemş asset  sitemi.md
20. 51-arama  indeksleme sistemi.md

Bu öncelik sırası, owner sınırlarını, çekirdek ticari zinciri ve görünmeyen altyapı truth’lerini önce sabitlemek içindir.

---

## F. KRITIK BAGLILIK KUMELERI

### Kume 1
5-story sistemi(6).md  
7-keşfet sistemi(3).md  
12- Arama Sistemi(1).md  
34-kullanıcı story sistemi.md  
50-medya sistemş asset  sitemi.md  

### Kume 2
23-üyelik giriş sistemi.md  
13-sepet sistemi (1).md  
14-checkout sistemi (1).md  
24-adres sistem,.md  
25-kural -yetki sistemi.md  

### Kume 3
27-merkezi stok sistemi.md  
29-merkezi fiyat sistemi.md  
35-kampanya sistemi.md  
46-kupon sistemi.md  
47-finansal mutabakat  hakediş sistemi.md  

### Kume 4
15-ödeme sistemi (1).md  
16-sipariş sistemi (1).md  
17- kargo ve teslimat sistemi(1).md  
18- iptal ve iade sistemi (1).md  
30-sipariş takip sistemi.md  
45-sipariş operasyon sistemi.md  
54-payaut ödeme çıkış sistemi.md  

### Kume 5
31-yorum ve puanlama sistemi.md  
32-soru cevap sistemi.md  
39-ödül puan sistemi.md  
38-puan market sistemi.md  
22-moderasyon sistemi(1).md  
49-fraud risk abuse sistemi.md  

Bu kümeler, Aşama 1 ve Aşama 2 boyunca birlikte değerlendirilmesi gereken yüksek bağlılık alanlarıdır.