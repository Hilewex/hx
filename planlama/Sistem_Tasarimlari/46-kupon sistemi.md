KUPON SİSTEMİ
1. Sistem tanımı

Kupon sistemi, belirli ürünler, mağazalar, sepetler veya kampanya koşulları üzerinde kontrollü indirim uygulanmasını sağlayan; bu indirimin kim tarafından finanse edildiğini açıkça tanımlayan; merkezi fiyat sistemi ve kampanya sistemiyle uyumlu çalışan promosyon ve dönüşüm sistemidir.

Bu sistemin görevi yalnız indirim vermek değildir. Aynı zamanda:

dönüşüm artırmak
mağaza bazlı satış ivmesi üretmek
yeni kullanıcı kazanımı desteklemek
özel dönem teşviki sağlamak
fenomen mağazalarına kontrollü promosyon alanı açmak
fakat bunu fiyat ve kâr yapısını bozmadan yürütmektir

Kısa tanım:

Kupon sistemi, indirim maliyet taşıyıcısını net tanımlayarak çalışan kontrollü promosyon sistemidir.

2. Temel ilke

Bu sistemin temel ilkesi şudur:

Kupon indirimi, satış fiyatının içinden rastgele kesilmez; önce indirimi kimin finanse ettiği belirlenir.

Yani:

kupon varsa indirim vardır
ama bu indirimin maliyeti otomatik olarak fenomenin kazancına yüklenmez
sistem önce sponsor katmanını belirler
sonra indirim uygulanır
sonra kâr etkisi hesaplanır

Net kural:

Kupon uygulanmadan önce “indirimi kim taşıyor?” sorusu cevaplanmış olmalıdır.

3. Sistemin platform içindeki rolü

Kupon sistemi şu sistemlerle doğrudan ilişkilidir:

merkezi fiyat sistemi
kampanya sistemi
fenomen mağaza sistemi
sepet sistemi
checkout sistemi
sipariş sistemi
bildirim sistemi
admin sistemi

Doğru akış şu olmalıdır:

ürün 2. havuzda satışa hazırdır
fiyat koridoru oluşmuştur
kupon uygulanabilirlik kontrolü yapılır
kupon indirimi sponsor modeline göre hesaplanır
sepet / checkout’ta nihai indirim görünür
siparişe kupon snapshot’ı yazılır
kupon maliyet etkisi ilgili tarafa işlenir

Net kural:

Kupon sistemi, merkezi fiyat sisteminin yerine geçmez; onun üstünde çalışan kontrollü indirim katmanıdır.

4. Aktörler

Bu sistemde en az şu aktörler vardır:

4.1 Platform

Kupon oluşturabilir, aktive edebilir, pasife alabilir, kural seti belirler, sponsor olabilir, fenomen kuponlarını sınırlar.

4.2 Fenomen mağaza

Yalnız izin verilen sınırlar içinde, kendi mağazasında geçerli kupon oluşturabilir.

4.3 Kullanıcı

Geçerli kuponu kullanır.

4.4 Tedarikçi

İlk fazda kupon oluşturucu olmamalıdır. Ancak ileri fazda sponsor katmanında yer alabilir.

Net kural:

İlk fazda kupon oluşturucu aktörler yalnız platform ve fenomen mağazasıdır.

5. Kupon sistemi neden ayrı bir sistemdir

Kampanya sistemi zaten var. Ama kampanya ile kupon aynı şey değildir.

Kampanya sistemi
merkezi promosyon rejimidir
ürün veya kategori üzerinde görünür ticari rejim kurar
kupon kodu girmeden çalışabilir
Kupon sistemi
kodlu veya koşullu indirimdir
kullanıcı aksiyonu ile tetiklenebilir
mağaza bazlı veya sepet bazlı olabilir
sponsor yapısı ayrı tanımlanır

Net kural:

kampanya ve kupon aynı aileye aittir ama aynı sistem davranışı değildir.

6. Kupon türleri

Kupon sistemi en az 4 ana türe ayrılmalıdır.

6.1 Platform kuponu

Platform oluşturur.
İndirim maliyetini platform taşır.

Kullanım alanları:

ilk sipariş teşviki
sezon kampanyası
yeni kullanıcı kazanımı
özel gün promosyonu
genel büyüme kampanyaları

Bu modelde fenomen mağaza marjı korunabilir.

6.2 Fenomen kuponu

Fenomen mağazası oluşturur.
Yalnız kendi mağazasında geçerli olur.
İndirim maliyetini fenomen tarafı taşır veya platform destekli modelle paylaşır.

Bu model mağaza bazlı promosyon içindir.

6.3 Platform destekli fenomen kuponu

Fenomen kuponu başlatır ama platform destek verir.

Bu model özellikle:

yeni fenomen mağaza büyütme
özel mağaza destek haftaları
seçili fenomen aktivasyonları
için idealdir.

Bu durumda:

kupon fenomen mağazasına özeldir
ama indirim maliyetinin tamamını fenomen taşımaz
6.4 Paylaştırılmış kupon

İndirim maliyeti birden fazla tarafa bölünür.

Örnek:

%50 platform
%50 fenomen

Bu model güçlüdür ama ilk faz için daha karmaşıktır.
İleri fazda açılması daha güvenlidir.

7. İlk faz için önerilen aktif modeller

İlk fazda sistemi gereksiz karmaşık kurmamak için şu 3 model yeterlidir:

Platform sponsorlu platform kuponu
Fenomen sponsorlu fenomen kuponu
Platform destekli fenomen kuponu

İlk fazda açılmaması daha güvenli olan:

tedarikçi sponsorlu kupon
çok taraflı paylaştırılmış kupon
dinamik gerçek zamanlı kupon pazarlığı
8. Fenomen kuponu nasıl çalışmalı

Fenomen mağazasının kupon oluşturabilmesi mümkündür. Ama serbest değil, kurallı olmalıdır.

Fenomen kuponu için sabit kurallar:

yalnız kendi mağazasında geçerlidir
yalnız kendi mağazasındaki aktif ürünlerde uygulanır
platformun belirlediği üst limitleri aşamaz
fiyat koridorunu bozamaz
kupon oluşturulduğunda sistem marj etkisini hesaplar
fenomenin net kazancını eksiye düşüremez
gerekirse review/onaya düşebilir
platform isterse belirli ürünleri kupona kapatabilir
kampanyalı ürünlerle çakışma kuralı olmalıdır

Net kural:

Fenomen kuponu, bağımsız fiyat motoru gibi çalışamaz.

9. Sponsor modeli

Kupon sisteminin kalbi sponsor modelidir.

Her kupon için zorunlu alan:

sponsor_type

Minimum sponsor tipleri:

platform
fenomen
platform_supported_phenomen

İleri fazda:

split
supplier_supported

eklenebilir.

Sponsor tiplerine göre davranış
A. Platform sponsorlu

İndirim maliyeti platformdan düşer.
Fenomen marjı korunabilir.

B. Fenomen sponsorlu

İndirim maliyeti fenomen payından düşer.
Ama sistem minimum marj altına inmeye izin vermez.

C. Platform destekli fenomen

Fenomen kupon açar, maliyetin tamamını veya bir kısmını platform taşır.
Bu model büyütme odaklıdır.

Net kural:

Kupon maliyeti “otomatik herkes biraz taşısın” mantığıyla değil, açık sponsor mantığıyla hesaplanmalıdır.

10. İndirim tipi

İlk faz için desteklenecek kupon tipleri:

10.1 Sabit tutarlı indirim

Örnek: 100 TL indirim

10.2 Yüzdesel indirim

Örnek: %10 indirim

Ama yüzdesel indirimlerde üst sınır zorunlu olmalıdır.

10.3 Minimum sepet şartlı kupon

Örnek: 1000 TL üstüne 150 TL indirim

İlk fazda desteklenmemesi daha güvenli olan:

ücretsiz ürün kuponu
çok katmanlı zincir kuponlar
karmaşık bundle kuponlar
11. Kupon kapsamı

Bir kuponun kapsamı net olmalıdır.

Minimum kapsam türleri:

tüm mağaza
seçili ürünler
seçili koleksiyon
minimum sepet
ilk sipariş
tekrar alışveriş
seçili kullanıcı segmenti

Fenomen kuponu için en güvenli kapsam:

tüm mağaza
veya
seçili mağaza ürünleri

Platform kuponu için daha geniş kapsam açılabilir.

12. Kupon oluşturma yetkisi
12.1 Platform

Tam oluşturma yetkisi vardır.

12.2 Fenomen mağazası

Yalnız izinli çerçevede kupon oluşturabilir.

Fenomen panelinde “Kuponlarım” alanı olabilir.
Burada şu alanlar girilir:

kupon adı
kupon kodu
indirim tipi
indirim değeri
geçerlilik tarihi
minimum sepet
kullanım limiti
kişi başı kullanım limiti
hangi ürünlerde geçerli olduğu
sponsor tipi

Ama arka planda sistem şunları kontrol eder:

indirim üst limite uyuyor mu
fiyat koridoru bozuluyor mu
marj eksiye düşüyor mu
kupon kampanyalı ürünle çakışıyor mu
mağaza statüsü kupon oluşturmaya izinli mi
admin onayı gerekiyor mu
13. Onay ve yayın modeli

Fenomen kuponları iki modda çalışabilir:

13.1 Otomatik onaylı kupon

Düşük riskli ve platform sınırlarına tam uyan kuponlar anında aktifleşir.

13.2 Review gerektiren kupon

Yüksek indirim, özel ürün seti veya sınır değere yakın kuponlar admin incelemesine düşer.

Bu model çok güçlüdür çünkü:

fenomeni yavaşlatmaz
ama platformu da korur

Platform kuponları ise doğrudan admin tarafından yönetilir.

14. Marj koruma sistemi

Bu sistemin en kritik koruma alanı budur.

Fenomen sponsorlu kuponlarda sistem mutlaka şu hesapları yapmalıdır:

mevcut satış fiyatı
kupon sonrası kullanıcıya yansıyan fiyat
kupon indiriminin maliyeti
bu maliyetin kimden düşeceği
fenomenin tahmini net kazancı
minimum izinli marj korunuyor mu

Net kural:

Fenomen kuponu, fenomen payını sıfırlayamaz veya eksiye düşüremez.

Bu yüzden sistemde:

minimum net marj eşiği
kategori bazlı kupon üst sınırı
ürün bazlı kupon kapatma
olmalıdır.
15. Kampanya sistemi ile ilişki

Kupon ve kampanya birlikte çalışabilir ama kuralsız birleşmemelidir.

Doğru modeller:

kampanya + kupon birlikte kullanılabilir
kampanya varken kupon yasak olabilir
belirli kampanya türlerinde yalnız platform kuponu çalışabilir
fenomen kuponu kampanyalı ürünlerde bloklanabilir

İlk faz için en güvenli kural:

kampanyalı ürünlerde fenomen kuponu varsayılan olarak kapalı olsun
Platform isterse istisna açsın.

Bu, marj karmaşasını azaltır.

16. Sepet ve checkout ilişkisi

Kupon sistemi asıl etkisini sepette ve checkout’ta göstermelidir.

Sepette:

kupon giriş alanı
kupon uygunluk kontrolü
indirim görünürlüğü
sponsor tipi görünmez ama sistemsel olarak işlenir
hatalı kupon için net uyarı

Checkout’ta:

kupon final doğrulaması
fiyat/stok ile birlikte yeniden doğrulama
nihai indirim snapshot’ı
kuponun geçerli kaldığının teyidi

Net kural:

kupon sepette uygulanabilir ama nihai doğrulama checkout’ta yapılmalıdır.

17. Sipariş sistemi ile ilişki

Siparişe şu alanlar snapshot olarak yazılmalıdır:

kupon ID
kupon kodu
kupon tipi
sponsor tipi
indirim tutarı
hangi satırlara uygulandığı
sipariş toplamına etkisi

Bu kayıt daha sonra:

iade
iptal
finansal mutabakat
raporlama
için gerekir.
18. İptal / iade ilişkisi

Kuponlu siparişlerde iptal/iade davranışı net olmalıdır.

Minimum kurallar:

kupon siparişe snapshot olarak yazılır
kısmi iade durumunda kupon etkisi yeniden hesaplanabilir
kupon maliyeti sponsor tipine göre düzeltilir
kötüye kullanım tespitinde kupon geri kazanımı veya blok uygulanabilir

Bu alan özellikle ileri fazda daha da detaylandırılabilir.

19. Fenomen paneli ile ilişki

Fenomen panelinde ayrı bir Kuponlarım modülü olabilir.

Burada fenomen:

kupon oluşturur
taslak kaydeder
aktif/pasif yapar
kullanım sayısını görür
hangi ürünlerde geçerli olduğunu görür
kuponun satış etkisini izler

Ama kural:

kendi scope’u dışına çıkamaz
yalnız kendi mağazasını etkileyen kuponları yönetir
sponsor ve limit kuralları platformca çizilir
20. Admin paneli ile ilişki

Admin panelinde kupon merkezi ayrı modül olmalıdır.

Burada admin:

platform kuponlarını oluşturur
fenomen kuponlarını izler
review bekleyen kuponları onaylar/reddeder
kupon sınırlarını değiştirir
kupon üst limitlerini belirler
kötüye kullanım tespiti yapar
kupon performansını görür

Bu modül, admin sistemindeki ticari kontrol merkezi altında da yaşayabilir.

21. Bildirim sistemi ile ilişki

Kupon sistemi bildirim üretmelidir.

Örnek bildirimler:

Kullanıcıya
kupon başarıyla uygulandı
kupon geçersiz
kupon süresi doldu
kupon kullanım limiti doldu
Fenomene
kupon onaylandı
kupon reddedildi
kupon aktifleşti
kupon kullanım limiti doldu
kupon performansı yüksek
Admin’e
review bekleyen fenomen kuponu
anormal kullanım
kötüye kullanım şüphesi
yüksek maliyetli platform kuponu
22. Fraud / abuse riski

Kupon sistemi abuse’a çok açıktır. Bu yüzden en az şu riskler izlenmelidir:

aynı kullanıcı çoklu hesapla kupon kullanımı
fenomenin sahte trafikle kendi kuponunu şişirmesi
iade amaçlı kupon suistimali
kısa sürede anormal kupon kullanımı
düşük marjlı ürünlerde agresif kupon açılması

Net kural:

kupon sistemi mutlaka risk/fraud sinyali üretmelidir.

23. Kritik edge case kararları
kupon var ama ürün kampanyalı → fenomen kuponu blok, platform kuponu kurala göre çalışabilir
kupon oluşturuldu ama marj eksiye düşüyor → oluşturulamaz
kupon mağaza dışı ürüne uygulanmaya çalışıldı → geçersiz
kupon süresi doldu → checkout’ta düşer
kupon sepette çalıştı ama checkout’ta şart bozuldu → yeniden hesaplanır
kupon limit doldu → yeni kullanıma kapanır
fenomen askıya alındı → aktif fenomen kuponları pasife alınabilir
ürün havuzdan kalktı → ona bağlı kupon kapsamı otomatik güncellenir
24. Audit ve kayıt

Tüm kritik kupon aksiyonları loglanmalıdır:

kupon oluşturma
kupon güncelleme
kupon onaylama
kupon reddetme
kupon aktif/pasif
sponsor değişikliği
limit değişikliği
kupon kullanımı
anomali işareti

Bu olmadan kupon sistemi denetlenebilir olmaz.

25. Ana kurallar

Kupon sistemi için sabitlenmesi gereken temel kurallar şunlardır:

kupon sistemi kampanya sisteminden ayrıdır
kupon indiriminin maliyetini kimin taşıdığı her zaman net olmalıdır
ilk fazda kupon oluşturucu aktörler yalnız platform ve fenomen mağazasıdır
platform kuponu oluşturabilir
fenomen mağazası yalnız kendi mağazası için kupon oluşturabilir
fenomen kuponu fiyat koridorunu bozamaz
fenomen kuponu minimum marj altına düşemez
sponsor tipi zorunlu alandır
ilk fazda en güvenli sponsor modelleri: platform, fenomen, platform destekli fenomen
kuponun nihai doğrulaması checkout’ta yapılmalıdır
kupon etkisi siparişe snapshot olarak yazılmalıdır
kampanyalı ürünlerde fenomen kuponu varsayılan olarak kapalı olmalıdır
admin review gerektiren kuponları denetleyebilmelidir
tüm kritik aksiyonlar audit log üretmelidir
26. Nihai kısa özet

Kupon sistemi, platformun ve fenomen mağazasının kontrollü biçimde kupon oluşturabildiği; ancak kupon indiriminin maliyetini kimin taşıdığını sponsor modeli üzerinden açıkça tanımlayan; fenomen marjını koruyan; fiyat koridorunu bozmayan; sepet ve checkout’ta doğrulanan; siparişe snapshot olarak yazılan; kampanya sistemiyle uyumlu çalışan kontrollü promosyon sistemidir.