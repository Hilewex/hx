## Aşağıda kullanıcı yani müşteri sistemini baştan sona, şu ana kadar netleştirdiğimiz kurallara sadık kalarak, eksiksiz ve düzenli biçimde listeliyorum.

KULLANICI / MÜŞTERİ SİSTEMİ
1. SİSTEMİN TANIMI

Kullanıcı sistemi, platformdaki normal müşterinin hesap, etkileşim, satın alma sonrası katkı, mesajlaşma, takip, puan, sipariş ve destek süreçlerini kapsayan ana sistem dalıdır.

Bu sistemin amacı kullanıcıyı yalnızca alışveriş yapan pasif kişi olarak değil, aynı zamanda:

ürünlerle etkileşen,
ürün hakkında soru soran,
satın aldığı ürüne yorum yapan,
satın aldığı ürüne bağlı story yükleyen,
puan kazanan,
takip ilişkileri kuran,
fenomen mağazalarla kontrollü iletişim kurabilen
bir müşteri aktörü olarak konumlandırmaktır.

Bu sistem içinde yalnızca kullanıcı tarafı ele alınır.
Fenomen mağaza sistemi, destek sistemi, puan market sistemi gibi alanlar burada yalnızca kullanıcıyla temas ettikleri kadar dikkate alınır; kendi detayları ayrı sistemlerde ele alınır.

2. AKTÖRLER
2.1 Misafir kullanıcı

Sisteme giriş yapmamış ziyaretçidir.

2.2 Kayıtlı normal kullanıcı

Sisteme giriş yapmış standart müşteri hesabıdır.

2.3 Fenomen mağaza hesabı

Normal kullanıcı hesabından ayrı kimliktir.
Kullanıcı sistemi içinde yalnızca temas noktaları dikkate alınır.

2.4 Platform

Soru-cevap, moderasyon, silme talepleri, destek ve kural uygulamaları gibi alanlarda yetkili sistem tarafıdır.

3. HESAP YAPISI
3.1 Kullanıcı hesabı

Normal müşteri hesabıdır.

Temel işlevleri:

ürünlerle etkileşim
takip
mesajlaşma
soru sorma
yorum yapma
story yükleme
sipariş ve destek süreçlerini kullanma
puan kazanma ve puan durumunu izleme
3.2 Fenomen mağaza hesabı ile ilişki
kullanıcı hesabı ile fenomen mağaza hesabı aynı şey değildir
aynı kişi isterse ayrı ayrı iki hesap kullanabilir
aynı giriş altında yönetilmez
normal kullanıcı hesabı sonradan fenomen mağaza hesabına dönüşmez
4. GİRİŞ DURUMLARI
4.1 Misafir kullanıcı neler yapabilir
platformda dolaşabilir
ürünleri inceleyebilir
genel yüzeyleri görebilir
sepete ürün ekleyebilir
4.2 Misafir kullanıcı neler yapamaz

*REVİZYON NOTU: Bu dosyadaki eski kural, kanonik guest checkout kararıyla güncellenmiştir.*

Misafir kullanıcı sosyal ve hesap bağlı aksiyonları yapamaz:
soru soramaz
mesaj atamaz
yorum yapamaz
story yükleyemez
puan kazanamaz
takip işlemi yapamaz
fenomen mağaza takipçilerine özel postları göremez

Ancak misafir kullanıcı kontrollü guest commerce akışını kullanabilir. Misafir kullanıcı sipariş oluşturabilir ve ödeme yapabilir, fakat bu sipariş guest context ile taşınır. Misafir kullanıcı yorum, soru, beğeni, kaydetme, takip, story yükleme gibi hakları ödeme yaptığı için otomatik kazanmaz. Guest alışveriş, kayıtlı kullanıcı modelinin yerine geçen tam hesap modeli değildir.
4.3 Giriş yapmış kullanıcı neler yapabilir
ürün beğenebilir
ürün kaydedebilir
ürün paylaşabilir
fenomen mağazayı takip edebilir
diğer kullanıcılara takip isteği gönderebilir
PDP üzerinde soru sorabilir
teslim edilmiş ürüne yorum yapabilir
teslim edilmiş ürüne bağlı story yükleyebilir
puan kazanabilir
siparişlerini görüntüleyebilir
destek süreçlerini kullanabilir
mesaj kuralları uygunsa mesajlaşabilir
5. TAKİP SİSTEMİ
5.1 Fenomen mağaza takibi
kullanıcı fenomen mağazayı doğrudan takip edebilir
fenomen mağaza postlarını görebilmek için kullanıcı giriş yapmış olmalı ve ilgili fenomen mağazayı takip ediyor olmalıdır
5.2 Kullanıcılar arası takip
kullanıcılar arasında direkt takip yoktur
takip isteği vardır
karşı taraf kabul ederse takip ilişkisi oluşur
5.3 Takip sistemini açma-kapama
kullanıcı kendi takip sistemini açıp kapatabilir
kapalıysa takip isteği alamaz / takip ilişkisi kurulamaz
6. TAKİP SAYFASI
6.1 Takip sayfasının amacı

Takip sayfası, kullanıcının takip ettiği fenomen mağazaların takipçiye özel post akışını gösterir.

6.2 Takip sayfasında görünen içerikler
yalnızca takip edilen fenomen mağazaların postları
6.3 Takip sayfasında görünmeyen içerikler
kullanıcı story’leri
genel keşfet akışı mantığındaki karma içerikler
yorumlar
PDP soru-cevap içerikleri
6.4 Kullanıcı hiç fenomen mağaza takip etmiyorsa
üst bölümde hoş ve yönlendirici bir uyarı gösterilebilir
alt bölümde keşfet yönlendirmesi açılabilir
7. BEĞENİ / KAYDETME / PAYLAŞMA
7.1 Kullanıcının ürün üzerinde yapabildiği temel etkileşimler
beğenme
kaydetme
paylaşma
7.2 Beğeniler
kullanıcının beğendiği ürünler beğeniler sayfasında görünür
görünürlük varsayılan olarak kullanıcıya özel olabilir veya ayarlanabilir
7.3 Kaydetmeler
kullanıcının kaydettiği ürünler kaydet sayfasında görünür
kaydedilenler kesin özel yapıdadır
7.4 Paylaşma
kullanıcı ürün veya uygun içerikleri paylaşabilir
8. SORU SİSTEMİ
8.1 Konum

Soru sistemi yalnızca ürün detay sayfasında yani PDP’de bulunur.

8.2 Soru sorabilme şartı
kullanıcı giriş yapmış olmalıdır
8.3 Misafir kullanıcı
soru soramaz
8.4 Soruya kim cevap verebilir

Yalnızca:


platform

Başka kullanıcı cevap veremez.

Fenomen mağaza resmi ürün soru-cevap aktörü değildir. Ürün bilgi alanındaki cevap otoritesi yalnız platformdur.

8.5 Moderasyon
ilk etapta soru alanı manuel onaya tabidir
8.6 Cevap etiketleri

Cevaplarda kaynak açık olmalıdır:

Platform Cevabı
9. YORUM SİSTEMİ
9.1 Yorum yapabilme şartı

Kullanıcı yalnızca satın aldığı ve teslim edilmiş ürün için yorum yapabilir.

9.2 Yorum hakkı açılma anı
yalnız teslim edilmiş sipariş statüsünde açılır
9.3 Yorum adedi
ürün başına tek yorum vardır
9.4 Düzenleme hakkı
kullanıcı yorumunu en fazla 3 kez düzenleyebilir
9.5 Yorum silinmesi
kullanıcı yorumunu sildiğinde yorum görünümden kalkar
yorum puanı iptal edilir
9.6 İade sonrası yorum

Ürün iade edilirse:

yorum kalabilir
puanı iptal edilir
“satın alındı / doğrulanmış satın alım” güven etiketi düşer
gerekiyorsa kullanıcı adı anonimleşebilir


9-7 kullancı yorunm  yaparken ürün puanlama sı zorunludur 5lik istem üzerin de 1 yıldız 2yıldız3 yıldız 4 yıldız ve 5 yıldız seçimi yapmalıdır böylece ürünün puanlma sitemi ortaya çıkar .
9.8 kullanıcılar ürünü yorumlarken ürünü 1+2+3+4+5 yıldız gibi puanlama yapacaklardır sistem yorum onayında puanlamayı isteyecektir 

10. STORY SİSTEMİ
10.1 Story sisteminin tanımı

Kullanıcı story sistemi, satın alınmış ürünlere bağlı kullanıcı katkı içeriği üretme sistemidir.

Bu içerik:

keyfi sosyal paylaşım değildir
satın alma ilişkisine bağlıdır
ürün etiketli olmak zorundadır
moderasyon onayına tabidir
puan üretimi ile bağlantılıdır
10.2 Story yükleme şartı

Kullanıcı:

giriş yapmış olmalı
ürünü satın almış olmalı
sipariş teslim edilmiş olmalı
10.3 Ürün etiketi zorunluluğu
story yüklerken mutlaka aldığı ürünü etiketlemelidir
etiketsiz story kabul edilmez
10.4 Story’nin ürünle ilişkili olması

Story mutlaka ilgili satın alınmış ürünün story’si olmalıdır.

Örnek:

alınan tencere ile yapılan kullanım paylaşımı
alınan tava ile yapılan kullanım paylaşımı

Story ile etiketlenen ürün alakasızsa içerik iptal edilir.

10.5 Story hakkı
story hakkı sipariş başına değil, ürün başınadır
aynı ürün için maksimum 2 story hakkı vardır
aynı üründen 2, 3, 4 adet alınması ek hak üretmez
farklı ürünler yeni story hakkı doğurur

Örnek:

3 farklı ürün aldıysa toplam 6 story hakkı doğabilir
ama her ürün için en fazla 2 story
10.6 Story’nin yayın yerleri

Onaylı story:

kullanıcının kendi profilinde görünür
ilgili ürünün PDP’sinde görünür
ürün fenomen mağazadan alınmışsa ilgili fenomen mağaza bağlamında da görünebilir

Kullanıcı ürün story’leri keşfet genel akışına veya fenomen mağaza tanıtım / ürün tanıtım story akışına karışmaz; bulunduğu bağlamı korur.
10.7 Story etkileşimleri

Story için şu etkileşimler olabilir:

beğeni
kaydetme
paylaşma

Kullanıcı kendi story’sinde şu sayaçları görebilir:

beğeni sayısı
kaydetme sayısı
paylaşım sayısı
izlenme sayısı
10.8 Story moderasyonu

Story’ler platformun manuel onayına tabidir.

10.9 Story red nedenleri

Moderasyon panelinde hazır red seçenekleri bulunmalıdır:

ürün görünmüyor
ürün etiketi uyumsuz
içerik ürün deneyimi taşımıyor
kalite yetersiz
platform kural ihlali
10.10 Story reddi

Story reddedilirse:

red sebebi kullanıcıya bildirilir
gerekli ise düzeltilip yeniden yüklenebilir
10.11 Story hakkı ve red ilişkisi
Teknik / kalite eksikliği varsa
kullanıcıya neden bildirilir
düzeltme istenir
story hakkı korunur
Platform kural ihlali / ağır ihlal varsa
admin story’yi iptal edebilir
admin gerekli görürse ilgili story hakkını da düşürebilir
10.12 Story silme
Onay öncesi
kullanıcı story’yi silebilir
Onay sonrası
kullanıcı silme talebi gönderir
platform siler
10.13 Story süresi
story’ler geçici 24 saatlik yapı değildir
platform silene kadar veya kaldırılana kadar kalıcıdır
10.14 Story yükleme öncesi onay

Kullanıcıdan mevzuat / içerik kuralları onayı alınır. Onay verirse yükleyebilir.
10. 12. Kullanıcı profil görseli konusu

Bu önemli ve eklenmeli. Haklısın.

Kullanıcı tarafına eklenmesi gereken kural:

kullanıcı profil görseli yükleyebilir
profil görseli yüklemezse sistem uygun varsayılan profil görseli avatar atar
bu varsayılan görsel düz, boş avatar olmak zorunda değildir
erkek / kadın / nötr uygun profil görselleri üretilebilir veya hazır setten atanabilir
bu profil görseli story halkasıyla birlikte görünür

Bu özellikle “sizden gelenler” şeridinde çok önemlidir. Çünkü:

anonim ama cansız görünümü kırar
sosyal kanıtı güçlendirir
story halkalarının görsel okunabilirliğini artırır

Burada dikkat edilmesi gereken sınır:

bu alan kimlik doğrulama göstergesi değil
sadece profil temsili alanıdır
 görseli silebilir silserse platform oatamatik avatar atar 
11. PUAN / TEŞVİK SİSTEMİ
11.1 Amaç

Kullanıcının satın aldığı ürüne katkı yapmasını teşvik etmektir.

11.2 Puan üreten aksiyonlar
yorum: 2 puan
story: 5 puan
11.3 Puan kesinleşme anı
puan yalnızca onay sonrası kesinleşir
11.4 Tekrarlı puan kısıtı
aynı ürün için yorum puanı yalnız 1 kez verilir
aynı ürün için story puanı maksimum 2 story üzerinden verilebilir
tekrar içerik puan üretmez
11.5 Silme sonrası puan
yorum silinirse yorum puanı iptal edilir
story silinirse story puanı iptal edilir
11.6 Admin kaldırması sonrası puan
içerik admin tarafından kaldırılırsa ilgili puan da iptal edilir
11.7 İade sonrası puan
ürün iade edilirse o ürünle ilgili kazanılmış puan iptal edilir
11.8 Puan borçlanması
kullanıcı puanı önceden harcamışsa
sonra içerik silinir / iade olur / puan geri alınırsa
kullanıcı eksi puana düşebilir
sonraki puanlar önce bu borcu kapatır
11.9 Puan market ilişkisi
kullanıcı biriken puanları puan markette kullanabilir
puan market ayrı sistemdir
puan market siparişleri normal sipariş geçmişinde görünür
12. MESAJLAŞMA SİSTEMİ

Mesajlaşma sistemi iki ayrı hatta çalışır:

kullanıcı ↔ kullanıcı
kullanıcı ↔ fenomen mağaza

Bu iki hat benzer ama aynı kurala tabi değildir.

12.1 Kullanıcı ↔ kullanıcı mesajlaşması
Şartlar
kullanıcının takip sistemi açık olmalı
takip isteği gönderilmiş olmalı
karşı taraf kabul etmiş olmalı
mesaj özelliği açık olmalı

Bu şartlar sağlanınca mesajlaşma mümkündür.

Mesaj kutusu kapalıysa
mesaj alanı görünür olabilir
ama kapalı / blokeli olduğu anlaşılır
mesaj gönderilemez
İlk mesaj
takip kabul edilmişse
mesaj ayarı açıksa
mesaj direkt gider
İzin verilen içerik
metin tabanlı mesajlaşma
ses yok
dış link yok
platform içi link olabilir
kod yükü yüksekse ilk sürümde yalnız düz metin yeterlidir
Güvenlik aksiyonları
engelleme var
şikayet var
12.2 Kullanıcı ↔ fenomen mağaza mesajlaşması
Şartlar
kullanıcı sisteme giriş yapmış olmalı
ilgili fenomen mağazayı takip ediyor olmalı
fenomen mağazanın mesaj kutusu açık olmalı
Mesaj başlıkları

Kullanıcı mesaj gönderirken şu başlıklardan birini seçer:

ürün hakkında bilgi
öneri / geri bildirim
diğer

Bu başlıklar mesaj kategorisi / başlığı olarak çalışır.

Mesaj tipi
metin tabanlı
ses yok
dış link engelli
platform içi linkler sınırlı biçimde olabilir
Güvenlik
engelleme
şikayet
mekanizmaları bulunur
13. FENOMEN MAĞAZA POSTLARI İLE KULLANICI İLİŞKİSİ

Bu bölümde fenomen mağaza sistemi tüm detaylarıyla ele alınmaz. Kullanıcı sistemi açısından yalnız temas kuralları tanımlanır.

Takip sayfası post yüzeyidir; fenomen mağaza story’leri bu sayfaya düşmez.

13.1 Post görünürlüğü

Fenomen mağaza postları:

misafir kullanıcılara görünmez
yalnız giriş yapmış ve ilgili fenomen mağazayı takip eden kullanıcılara görünür
13.2 Takip sayfası ilişkisi
takip sayfasına yalnız fenomen mağaza postları düşer
13.3 Post etkileşimleri

Kullanıcı fenomen mağaza postlarında:

beğeni
kaydetme
paylaşma
gibi hafif etkileşimler yapabilir
13.4 Postlarda yorum
kullanıcı fenomen mağaza postlarına yorum yazamaz
14. PROFİL VE GÖRÜNÜRLÜK
14.1 Kullanıcının kendi görebildiği sayaçlar

Kullanıcı yalnızca kendi hesabında şu sayaçları görebilir:

takipçi sayısı
takip ettiği hesap sayısı
beğeni sayısı
puan sayısı
14.2 Seviye sistemi
seviye sistemi yoktur
14.3 Beğeni görünürlüğü
varsayılan olarak kullanıcıya özel olabilir
ayarlanabilir yapı düşünülebilir
14.4 Kaydet görünürlüğü
kesin özel
15. SİPARİŞ / SEPET / GEÇMİŞ
15.1 Sepet
kullanıcı sepete ürün ekleyebilir
15.2 Ödeme
ödeme giriş yapmış kullanıcı tarafından veya kontrollü guest checkout akışında misafir kullanıcı tarafından yapılabilir
15.3 Siparişlerim

Kullanıcı:

aktif siparişlerini görebilir
geçmiş siparişlerini görebilir
15.4 Puan market siparişleri
normal sipariş geçmişinde görünür
16. DESTEK / İPTAL / İADE / ŞİKAYET
16.1 Genel kural

Destek sistemi mesajlaşma sisteminden tamamen ayrıdır.

16.2 Tek merkez

Aşağıdaki süreçler tek destek merkezi altında ele alınır:

iptal
iade
şikayet
destek talepleri
16.3 Sosyal mesajlaşma ile ayrım
kullanıcı, resmi sipariş ve destek süreçlerini fenomen mağaza mesaj kutusundan yürütmez
destek ayrı bir sistemdir
17. MODERASYON
17.1 Moderasyona tabi alanlar
story
soru
gerekli olduğunda diğer kullanıcı katkıları
17.2 Platform yetkileri

Platform:

içerik onaylayabilir
reddedebilir
red nedeni gösterebilir
silme talebini işleyebilir
puan iptal edebilir
ihlal halinde hak düşürebilir
17.3 Ağır ihlal

Ağır ihlal halinde platform:

içeriği doğrudan kaldırabilir
ilgili story hakkını iptal edebilir
puanları geri alabilir
## 18. ANA KURALLARIN KISA ÖZETİ
Hesap
kullanıcı hesabı ayrı
fenomen mağaza hesabı ayrı
Misafir
dolaşabilir
sepete ekleyebilir
kontrollü guest checkout ile ödeme yapabilir ancak sosyal hak kazanamaz
post göremez
Yorum
yalnız teslim edilen ürüne
tek yorum
3 düzenleme
silinirse puan silinir
iade olursa puan silinir, güven etiketi düşer
Story
yalnız teslim edilen ürüne
ürün etiketi zorunlu
ürün başına 2 hak
onay sonrası puan
manuel moderasyon
onay öncesi kullanıcı silebilir
onay sonrası talep ile silinir
Soru
yalnız PDP’de
kullanıcı sorar
yalnız  platform cevap verir
Mesaj
kullanıcı ↔ kullanıcı: takip isteği + kabul + mesaj açıklığı
kullanıcı ↔ fenomen mağaza: takip + mağaza mesaj açıklığı
Postlar
yalnız takipçilere özel
misafir görmez
takip sayfasına yalnız mağaza postları düşer
yorum yok
Puan
yorum 2
story 5
onay sonrası kesinleşir
silinirse / iade olursa iptal edilir
eksi puan olabilir
Destek
mesajlaşmadan ayrı
tek merkezden yönetilir
19. NİHAİ DURUM

Bu haliyle kullanıcı / müşteri sistemi:

hesap tarafını,
sosyal etkileşimi,
soru-cevap yapısını,
yorum ve story kurallarını,
puan ilişkisini,
mesajlaşma mantığını,
takip akışını,
sipariş ve destek bağını

birbirine karışmadan tanımlanmış bir sistem haline gelmiştir.