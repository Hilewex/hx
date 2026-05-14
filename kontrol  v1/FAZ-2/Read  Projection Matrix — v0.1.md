FAZ-2 / BÖLÜM-3
Read / Projection Matrix — v0.1

Bu bölümün amacı:

“Kim gerçek sahibi değil ama göstermek, aramak, raporlamak veya hızlandırmak için kopya/veri görünümü tutabilir?”

1. Basit kural

Bazı sistemler gerçek verinin sahibi değildir ama o veriyi göstermek için kopya tutabilir.

Buna basitçe:

okuma görünümü
listeleme verisi
projection
index
cache
özet tablo

diyebiliriz.

Ama çok kritik kural:

Projection gerçek değildir.
Cache gerçek değildir.
Index gerçek değildir.
Gerçek veri owner sistemdedir.
2. Neden projection gerekir?

Çünkü platformda her ekran doğrudan 10 farklı sisteme sormamalı.

Örnek:

Ana sayfada bir ürün kartı gösterilirken şunlar gerekir:

ürün adı
fiyat
stok uygunluğu
mağaza adı
görsel
kampanya etiketi
beğeni/kaydet durumu

Bunların gerçek sahipleri farklı olabilir.

Bu yüzden ekranda hızlı göstermek için okuma modeli/projection olabilir.

Ama bu projection karar veremez.

3. Projection örnekleri
Projection / Görünüm	Kaynak truth	Ne işe yarar	Ne yapamaz
Product card projection	Product + Price + Stock + Media	hızlı ürün kartı gösterir	fiyat/stok truth’u olamaz
PDP projection	Product + Store + Review + Q&A	ürün detayını hızlı sunar	ürün onayı/fiyat üretmez
Search index	Product + Store + Taxonomy	arama adayı üretir	ürün truth’u olamaz
Ranking feature store	Analytics + Social + Commerce	sıralama sinyali üretir	stok/fiyat değiştiremez
Creator store projection	Store + Product + Media	mağaza vitrini gösterir	ürün ana bilgisini değiştiremez
Order tracking projection	Order + Shipment + Delivery	kullanıcıya takip gösterir	teslimat truth’u olamaz
Admin dashboard projection	birçok sistem	karar kutuları gösterir	owner bypass yapamaz
Finance report projection	Settlement + Payout	finans görünürlüğü sağlar	payout yaratamaz
Notification inbox	Event sources	bildirim gösterir	olayın kendisini yaratamaz
Analytics metrics	Event logs	ölçüm/rapor sağlar	commerce state değiştiremez
4. Search index projection’dır

Arama sistemi ürünleri gösterebilir ama ürün sahibi değildir.

Yani:

search index ürünü gösterir
ama ürünün aktif/pasif gerçeği product sistemindedir

Risk:

ürün pasif ama search index’te çıkıyorsa → HIGH RISK
5. Ranking projection’dır

Öneri/sıralama sistemi ürün sıralar.

Ama:

ürün satılabilir mi?
stok var mı?
fiyat geçerli mi?
moderasyon uygun mu?

kararlarını kendi başına uyduramaz.

Bu bilgiler owner sistemlerden gelir.

6. Admin dashboard projection’dır

Admin dashboard çok şey gösterir:

bekleyen ürün
geciken sipariş
riskli payout
bekleyen moderasyon
yüksek iade oranı

Ama dashboard’un kendisi truth değildir.

Doğru:

dashboard gösterir
admin protected action başlatır
owner sistem değiştirir
audit log yazar

Yanlış:

dashboard satırı direkt DB update yapar
7. Order tracking projection’dır

Kullanıcıya görünen sipariş takip ekranı gerçek operasyon motoru değildir.

Doğru:

Order/Shipment/Delivery truth’lerinden beslenir
kullanıcıya sade durum gösterir

Yanlış:

kullanıcı tracking ekranından delivery state değiştirebilir
8. Product card projection’dır

Ürün kartında görünen:

ürün adı
fiyat
stok etiketi
kampanya etiketi
creator bağlamı
medya

birleştirilmiş görüntüdür.

Ama:

kart fiyat hesaplamaz
kart stok düşmez
kart ürün onayı vermez
9. Cache kuralı

Cache sadece hız içindir.

Kritik kural:

cache yanlışsa owner truth kazanır

Repo audit sırasında bakacağız:

cache stale olduğunda sistem yanlış satış yapıyor mu?
checkout cache’e mi güveniyor?
fiyat cache’ten mi finalize ediliyor?

Eğer checkout cache verisine güveniyorsa:

DANGEROUS
10. Projection update modeli

Doğru akış:

Owner state değişir
→ event yayınlanır
→ projection güncellenir
→ UI hızlı okur

Yanlış akış:

Projection değişir
→ owner state değişmiş kabul edilir
11. Projection bozulursa ne olmalı?

Projection gecikebilir ama final karar owner’dan gelmeli.

Örnek:

ürün kartında stok var göründü
ama checkout’ta stok tekrar kontrol edilir
stok yoksa checkout bloklar

Bu doğru davranış.

Çünkü:

cart/card projection final truth değildir
checkout final validation noktasıdır
12. Repo audit’te bakacağımız şeyler
1. Search index owner gibi mi davranıyor?
2. Product card fiyat hesaplıyor mu?
3. Checkout cache/projection’a mı güveniyor?
4. Admin dashboard direct write yapıyor mu?
5. Order tracking gerçek shipment state’i mutate ediyor mu?
6. Analytics commerce state değiştiriyor mu?
7. Recommendation hidden/out-of-stock ürünü gösteriyor mu?
8. Projection stale olunca sistem yanlış sipariş oluşturuyor mu?
13. Basit özet
Owner = gerçek sahibi
Projection = gösterim kopyası
Cache = hızlandırma
Index = arama kopyası
Dashboard = yönetim görünümü

Ama:

hiçbiri gerçek owner’ın yerine geçmez
14. FAZ-2 Bölüm-3 sonucu

Bu çıktı oluştu:

READ_PROJECTION_MATRIX_v0.1