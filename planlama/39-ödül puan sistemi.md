ÖDÜL PUANI SİSTEMİ
1. Sistem tanımı

Ödül puanı sistemi, kullanıcının teslim edilmiş ürüne yaptığı değerli katkılar karşılığında platform içinde puan kazandığı teşvik sistemidir.

Bu puan tek katmanlı değildir.
Puan lifecycle’ı en az şu alanları içerebilir:

pending
kesinleşmiş / vested
spendable
iptal edilen
harcanmış
eksi bakiye / puan borcu

Bu sistemin ilk fazdaki amacı, kullanıcıyı özellikle:
yorum + yıldız puanlama yapmaya
kullanıcı ürün story’si yüklemeye
teşvik etmektir.

2. Sistemin ana amacı

Ödül puanı sisteminin ana amacı şudur:

teslimat sonrası kullanıcı katkısını artırmak
PDP güven katmanını besleyen yorum ve kullanıcı story üretimini teşvik etmek
kullanıcıyı sipariş sonrası yeniden platforma döndürmek
ileride puan market ve daha gelişmiş görev sistemleri için zemin oluşturmaktır

İlk fazda sistem sade tutulur; agresif görevler, takip görevleri, fenomen bonusları ve satın alma bonusları aktif değildir.

3. Temel ilke

Bu sistemin temel ilkesi şudur:

Puan yalnız doğrulanabilir ve platform için değerli kullanıcı katkısından kazanılır.

İlk fazda puan kazandıran aksiyonlar sadece şunlardır:

teslim edilmiş ürün için yorum + yıldız puanlama
teslim edilmiş ürün için kullanıcı ürün story’si yükleme

Bunun dışındaki aksiyonlar ilk fazda puan üretmez.

4. Puan kazandıran aksiyonlar

İlk fazda puan üreten aksiyonlar:

4.1 Yorum + yıldız puanlama

Kullanıcı:

giriş yapmış olmalı
ürünü satın almış olmalı
ürün teslim edilmiş olmalı
yorum yapmalı
1–5 arası yıldız puan vermelidir

Bu aksiyon geçerli olduğunda ödül puanı kazanır.

4.2 Kullanıcı ürün story’si

Kullanıcı:

giriş yapmış olmalı
ürünü satın almış olmalı
ürün teslim edilmiş olmalı
ürün etiketli story yüklemelidir
story moderasyondan geçmelidir

Story yalnız moderasyon onayından sonra puan üretir.

5. İlk faz puan oranları

İlk faz başlangıç puan oranı:

yorum + yıldız puanlama = 2 puan
kullanıcı ürün story’si = 5 puan

Bu oranlar sabit kod kuralı değildir.

6. Admin tarafından yönetim

Ödül puanı oranları admin tarafından değiştirilebilir olmalıdır.

Admin:

yorum puanını değiştirebilir
story puanını değiştirebilir
sistemi geçici olarak açıp kapatabilir
puan dağıtımını pasife alabilir
belirli puan kurallarını revize edebilir

Ama ilk fazda admin yalnız mevcut iki kuralı yönetir; yeni görev türleri aktif değildir.

7. Puanın kesinleşme anı

Puan anında spendable olmak zorunda değildir.

Doğru model:

aksiyon gerçekleşir
sistem uygunluk ve geçerlilik kontrolü yapar
puan önce pending statüsüne alınabilir
doğrulama tamamlanınca vested / kesinleşmiş statüye geçer
iade penceresi ve risk kontrolleri uygun ise spendable bakiye açılır

Özellikle story puanı için:
moderasyon onayı olmadan puan kesinleşmez

Net kural:
puan kazanımı ile puanı harcama hakkı aynı an olmak zorunda değildir.

8. Puan durumları

Sistemde en az şu puan durumları bulunmalıdır:

bekleyen puan
kesinleşmiş puan
iptal edilen puan
harcanmış puan
eksi bakiye / puan borcu

Bu yapı ileride puan market ve geri alma senaryoları için zorunludur.

9. Tekrarlı puan kısıtları

Puan sistemi suistimali önlemek için mevcut kullanıcı kurallarıyla birebir çalışmalıdır:

aynı ürün için yorum puanı yalnız 1 kez verilir
aynı ürün için story puanı en fazla 2 story üzerinden verilebilir
aynı üründen çok adet satın almak ek story puanı üretmez
geçersiz tekrar içerik puan üretmez

Kullanıcı sistemi dosyası bu sınırları açıkça tanımlar.

10. Teslimat ile ilişkisi

Ödül puanı sistemi eligibility’yi kendi başına üretmez.
Eligibility kaynağı:

teslimat sistemi
yorum hakkı açılması
story hakkı açılması
ürün satırı bazlı teslim edilmiş durumudur

Yani puan hakkı sipariş bazlı değil, ürün satırı bazlı açılır.

11. Yorum sistemi ile ilişkisi

Yorum puanı şu durumda verilir:

yorum geçerli
yıldız puanlama yapılmış
ürün teslim edilmiş
kullanıcı bu ürün için daha önce puanlı yorum hakkını tüketmemiş

Yorum sonradan silinirse:

yorum görünümden kalkar
ilgili ödül puanı iptal edilir

Bu kural kullanıcı sistemi dosyasında açıkça vardır.

12. Story sistemi ile ilişkisi

Story puanı şu durumda verilir:

story ürün etiketli
ürün teslim edilmiş
kullanıcı bu ürün için story hakkına sahip
story moderasyondan geçmiş

Story reddedilirse:

puan verilmez

Story sonradan kaldırılırsa:

ilgili ödül puanı iptal edilebilir
13. Moderasyon ile ilişkisi

Moderasyon ödül puanı sisteminin ana güven katmanıdır.

yorum kaldırılırsa puan iptal edilir
story reddedilirse puan verilmez
story kaldırılırsa puan iptal edilebilir
ağır ihlalde platform puanları geri alabilir

Kullanıcı sistemi dosyası da platformun puan iptali ve hak düşürme yetkisine sahip olduğunu açıkça söyler.

14. İade ile ilişkisi

İlk fazda kural nettir:

Ürün iade edilirse o ürünle ilgili kazanılmış puan iptal edilir.

Bu kural yorum ve story için geçerlidir.

Kullanıcı sistemi dosyası bunu açıkça sabitler.

15. Eksi puan / puan borcu

Kullanıcı puanı önceden harcamışsa ve sonradan:

iade olmuşsa
içerik silinmişse
moderasyon kaldırmışsa
puan geri alınmışsa

kullanıcı eksi puana düşebilir.

Bu durumda sonraki kazanılan puanlar önce bu borcu kapatır.
Bu kural kullanıcı sistemi dosyasında açıkça vardır.

16. Kullanıcının göreceği alanlar

Kullanıcı kendi hesabında en az şu alanları görebilmelidir:

toplam puan
bekleyen puan
iptal edilen puan
puan geçmişi
puan markette kullanabileceği bakiye

Kullanıcı sistemi dosyası kullanıcının puan durumunu izleyebildiğini açıkça söyler.

17. İlk fazda kapalı tutulan alanlar

İlk fazda şunlar aktif değildir:

fenomen mağaza bonus puanı
mağaza bazlı ekstra puan verme
3 mağaza takip et +50 puan gibi görevler
ürün satın al +500 puan kampanyaları
agresif büyüme görevleri

Ama altyapı ileride bunlara açılabilecek şekilde tasarlanmalıdır.


18. Ana kurallar

ödül puanı, ürün yıldız puanından ayrı sistemdir
ilk fazda puan yalnız yorum + yıldız ve kullanıcı ürün story’sinden kazanılır
yorum puanı = 2
story puanı = 5
bu oranlar admin tarafından değiştirilebilir
puan önce pending olarak doğabilir
puan onay / doğrulama sonrası vested hale gelir
spendable bakiye ayrı yönetilir
aynı ürün için yorum puanı yalnız 1 kez verilir
aynı ürün için story puanı en fazla 2 story üzerinden verilir
yorum silinirse yorum puanı iptal edilir
story silinirse story puanı iptal edilir
admin kaldırması sonrası ilgili puan iptal edilir
ürün iade edilirse ilgili puan geri alınabilir
kullanıcı eksi puana düşebilir
sonraki puanlar önce borcu kapatır
ilk fazda fenomen ve agresif görev tarafı kapalıdır
19. Nihai kısa özet

Ödül puanı sistemi, ilk fazda yalnız teslim edilmiş ürün için yapılan yorum + yıldız puanlama ve moderasyon onaylı kullanıcı ürün story’si üzerinden puan kazandıran; puan oranları admin tarafından değiştirilebilen; ürün yıldız puanı sisteminden tamamen ayrı çalışan; puanı onay sonrası kesinleştiren; iade, silme, moderasyon kaldırması ve fraud durumunda puanı iptal edebilen; eksi puan mantığını destekleyen sade ama ileride genişlemeye uygun platform kontrollü teşvik sistemidir.


######
---
REVİZYON NOTU — 2026-04-19
Durum: Kanonik override
Etkilediği bölüm(ler): Puan kazanımı, puan kesinleşmesi, iade etkisi
Bağlı dosyalar: 38-puan market sistemi, 18-iptal ve iade sistemi, 49-fraud risk abuse sistemi

Not:
Bu dosyadaki puan kazanımı korunur; ancak puanın kullanım hakkı aşağıdaki şekilde yeniden yorumlanır:

1. Yorum ve kullanıcı story katkısı puan üretmeye devam eder.
2. Ancak üretilen puan anında spendable olmaz.
3. İlk statü pending puandır.
4. Puanın spendable hale gelmesi için:
   - teslimat doğrulanmış olmalı,
   - ilgili katkı moderasyon koşulunu geçmiş olmalı,
   - iade / iptal penceresi ve temel suistimal kontrolleri tamamlanmış olmalıdır.
5. İade veya sahte katkı halinde pending / vested puan geri alınabilir.
6. Kullanıcının toplam puanı, bilgilendirme amaçlı görünse bile spendable bakiye ayrı alan olarak izlenmelidir.

Net sonuç:
Ödül puanı kazanımı ile puan markette harcama hakkı ayrı lifecycle’larda yönetilir.
---