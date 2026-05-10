PUAN MARKET SİSTEMİ
1. Sistem tanımı

Puan market sistemi, kullanıcının kazandığı kesinleşmiş ödül puanlarını kullanarak ürün alabildiği, normal satış kataloğundan ayrı çalışan, tamamen platform kontrolündeki ödül ürün pazarı sistemidir.

Bu sistem normal e-ticaret akışının devamı değildir.
Ayrı kurallarla çalışan özel bir kullanım alanıdır.

Kullanıcı sistemi dosyasında da puan market ayrı sistem olarak tanımlanır.

2. Sistemin ana amacı

Puan market sisteminin ana amacı şudur:

kullanıcıya puan biriktirmek için somut motivasyon sağlamak
yorum ve story üretimini ödül ile desteklemek
platform içi bağlılık ve geri dönüşü artırmak
ileride daha güçlü ödül ekonomisine temel hazırlamak
3. Temel ilke

Bu sistemin temel ilkesi şudur:

Puan market, normal katalogdan ayrı çalışır ve burada ürünler puanla alınır.

Yani:

normal satış fiyatı ile puan market bedeli karışmaz
kullanıcı puan market ürününü para ödeyerek değil, puan harcayarak alır
puan market ürünleri ayrı kuralla çalışır
4. İlk faz kullanım modeli

İlk fazda puan market sade başlamalıdır. İki model yeterlidir:

4.1 Sadece puan

Örnek:

ürün = 450 puan
4.2 Puan + kargo puanı

Örnek:

ürün = 450 puan
kargo = 100 puan

Bu model, fiziksel teslimat maliyetini puan ekonomisine yansıtmak için uygundur.

5. Platform kontrolü

Puan market tamamen platform kontrolünde olmalıdır.

Platform şunları belirler:

hangi ürün puan markette yer alır
kaç puanla alınır
kargo puanı gerekir mi
stok kaç adettir
kullanıcı başı limit var mı
ürün aktif mi pasif mi
puan marketten geçici kaldırılacak mı
puan geri verilecek mi

Fenomen mağaza ve tedarikçi bu sistemin sahibi değildir.

6. Kullanıcı uygunluğu

Puan market ürünü alabilmek için kullanıcı:

giriş yapmış olmalı
yeterli spendable puana sahip olmalı
ürün aktif olmalı
stok müsait olmalı
kullanıcı başı limit aşılmamış olmalı

Pending puan harcanamaz.
Vested ama henüz spendable’a açılmamış puan da harcanamaz.

7. Puan market ürünleri

Puan market ürünleri:

normal ürünlerden ayrı listelenebilir
platform seçkisi olabilir
kampanyalı ödül ürünleri olabilir
limitli adetli olabilir

Ama her durumda görünürlük ve kural owner’ı platformdur.

8. Puan cüzdanı ile ilişkisi

Puan market doğrudan ödül puanı sistemine bağlıdır.
Kullanıcı tarafında şu ilişki net olmalıdır:

pending puan = kazanılmış ama henüz harcanamaz
vested / confirmed puan = doğrulanmış puan
spendable puan = puan markette kullanılabilecek bakiye
harcanmış puan = geçmişe yazılır
iptal edilen puan = ayrıca görünür
eksi bakiye / puan borcu = ayrı izlenir

Net kural:
kullanıcıya görünen toplam puan ile puan markette harcanabilir bakiye aynı şey olmak zorunda değildir.
9. Satın alma akışı

Doğru ilk faz akışı:

kullanıcı puan market ürününü seçer
gerekli puan ve varsa kargo puanı görünür
sistem kullanıcının puanı yeterli mi kontrol eder
uygunsa puan düşülür veya harcama kaydı oluşur
puan market siparişi oluşur
ürün teslimat akışına girer
10. Sipariş geçmişi ilişkisi

Puan market siparişleri normal sipariş geçmişinde görünür.

Kullanıcı sistemi dosyası bunu açıkça söyler.

11. Kargo / teslimat ilişkisi

Puan market ürünü fiziksel ürünse:

paketlenir
sevk edilir
teslim edilir
sipariş takip sisteminde görünür

Yani puan market ayrı katalog olabilir, ama teslimat ve sipariş takibi tarafında sistemden kopuk çalışmaz.

12. İade / iptal ilişkisi

Puan market ürünlerinde iade/iptal kuralları platform tarafından yönetilir.

İlk faz için en doğru model:

iade uygunluğu platform kurallarıyla belirlenir
iade olursa harcanan puan iade edilebilir
kargo puanı varsa bu ayrıca değerlendirilebilir
her hareket audit’li olmalıdır
13. Fraud ve suistimal koruması

Puan markette en az şu korumalar olmalıdır:

kullanıcı başı ürün limiti
aynı ürün için tekrar alım sınırı
şüpheli puan harcama alarmı
fraud veya moderasyon kararıyla işlemi bloklama
gerekirse puan geri alma / sipariş iptali
14. İlk fazda kapalı alanlar

İlk fazda şunlar aktif değildir:

fenomen mağaza kaynaklı puan market ürünü
fenomen bonus puanı ile özel market akışı
görev zinciri ile market açma
mağaza bazlı puan kampanyaları
agresif puan ekonomisi oyunlaştırması
15. Ana kurallar
puan market normal katalogdan ayrı çalışır
ürünler yalnız puanla veya puan + kargo puanı ile alınır
puan market tamamen platform kontrolündedir
yalnız kesinleşmiş puan harcanabilir
fenomen mağaza ve tedarikçi bu sistemin owner’ı değildir
puan market siparişleri normal sipariş geçmişinde görünür
kargo / teslimat sistemiyle entegre çalışır
fraud, limit ve audit zorunludur
ilk fazda agresif bonus ve fenomen kullanım alanları kapalıdır
16. Nihai kısa özet

Puan market sistemi, kullanıcının kesinleşmiş ödül puanlarını kullanarak ürün alabildiği; ürünlerin yalnız puanla veya puan + kargo puanı modeliyle sunulduğu; normal ürün kataloğundan ayrı çalışan; tamamen platform tarafından yönetilen; puan market siparişlerini normal sipariş geçmişinde gösteren; ilk fazda sade, kontrollü ve fraud-korumalı biçimde çalışan ödül ürün pazarı sistemidir.


####
---
REVİZYON NOTU — 2026-04-19
Durum: Kanonik override
Etkilediği bölüm(ler): Puan uygunluğu, harcanabilir puan mantığı
Bağlı dosyalar: 39-ödül puanı sistemi, 18-iptal ve iade sistemi

Not:
Bu dosyada “kesinleşmiş puan” kavramı aşağıdaki yeni ayrımla yorumlanmalıdır:

1. Puanlar tek katmanlı kabul edilmez.
2. Kullanıcının puanı en az şu üç statüde yönetilebilir:
   - pending
   - vested / confirmed
   - spendable
3. Teslimat sonrası yorum ve story katkısı ile kazanılan puan, iade süresi ve suistimal riski görülmeden doğrudan spendable hale gelmez.
4. İlgili katkı puanı önce pending görünür.
5. İade / iptal / fraud riski geçtikten sonra spendable puana dönüşür.
6. Puan market alışverişi yalnız spendable puan ile yapılabilir.
7. Böylece katkı-puan-iade suistimal döngüsü engellenir.

Net sonuç:
Gösterilen puan ile harcanabilir puan aynı şey olmak zorunda değildir.
---