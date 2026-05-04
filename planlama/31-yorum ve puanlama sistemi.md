YORUM / PUANLAMA SİSTEMİ
1. Sistem tanımı

Yorum / puanlama sistemi, kullanıcının satın alıp teslim aldığı ürün hakkında metin yorumu ve yıldız puanı üretebildiği; bu içeriklerin PDP güven katmanını beslediği; ürün ortalama puanını oluşturduğu; iade, moderasyon ve teslimat uygunluğu gibi süreçlerle bağlantılı çalışan ürün güven ve karar sistemidir. Sistem ağacında bu başlık, “kural seti var ama ayrı sistem olarak netleşmeli” denilerek kısmen hazır sistemler içinde yer alır.

2. Sistemin ana amacı

Yorum / puanlama sisteminin ana amacı şudur:

ürün karar kalitesini artırmak,
kullanıcıya gerçek deneyim sinyali göstermek,
PDP güven katmanını beslemek,
yıldız puanları üzerinden ürün ortalama puanını üretmek,
teslimat sonrası hakları kontrollü biçimde görünür kılmak,
iade ve moderasyon etkilerini dürüst biçimde puan sistemine yansıtmaktır.
Kargo / teslimat sistemi dosyası, “delivered” eşiğinin yorum ve puanlama hakkını açtığını açıkça söyler; sistem ağacı da yorum/puanlamayı ürün güveni ve karar kalitesi için kritik başlık olarak tanımlar.
3. Temel ilke

Bu sistemin temel ilkesi şudur:

Yorum ve puan, yalnız satın alınmış ve teslim edilmiş ürün için açılır.

Bu ilke esnetilmez. Kullanıcı sistemi dosyalarında açıkça:

kullanıcı yalnız satın aldığı ve teslim edilmiş ürün için yorum yapabilir,
yorum hakkı yalnız teslim edilmiş sipariş statüsünde açılır,
ürün başına tek yorum vardır,
yorum sırasında puanlama zorunludur
denir.
4. Sistemin platform içindeki rolü

Akış sırası içinde yorum / puanlama sisteminin rolü şöyledir:

kullanıcı ürünü satın alır,
teslimat doğrulanır,
ilgili ürün satırı için yorum ve puan hakkı açılır,
kullanıcı PDP bağlamında yorumunu ve yıldız puanını girer,
moderasyon ve uygunluk kontrolü uygulanır,
yorum görünür olur,
yıldız puanı ürün ortalamasına etki eder,
iade olursa güven meta verisi ve puan etkisi güncellenir.
Teslimat sistemi bu hakkı “ürün satırı bazında” açar; iade sistemi ise yorumun kalabileceğini ama puan etkisinin kaldırılacağını söyler.
5. Kim yorum yapabilir

Yorum yapabilmek için en az şu koşullar gerekir:

kullanıcı giriş yapmış olmalı,
ürünü satın almış olmalı,
ilgili sipariş satırı teslim edilmiş olmalı.
Misafir kullanıcı yorum yapamaz. Bu model kullanıcı sistemi ve teslimat sistemi kararlarıyla birebir uyumludur.
6. Yorum hakkının açılma anı

Yorum hakkı sipariş oluşturulunca değil, ödeme tamamlanınca da değil, yalnız teslim edilmiş sipariş statüsünde açılır. Daha doğru ifadeyle bu hak sipariş bazında değil, teslim edilen ürün satırı bazında açılmalıdır. Teslimat sistemi bunu özellikle vurgular; çok paketli yapılarda tüm sipariş teslim edilmeden de ilgili satır teslim alınırsa yorum hakkı açılabilir.

7. Yorum adedi

Her kullanıcı için ürün başına tek yorum vardır. Bu kural kullanıcı sistemi dosyalarında açıkça tekrar eder. Böylece aynı ürün üzerinde tekrar tekrar puan şişirme veya spam yorum üretme riski azaltılır.

8. Düzenleme hakkı

Kullanıcı yorumunu sınırsız düzenleyemez. Mevcut dosyalarda bu sınır net biçimde tanımlanmıştır:

kullanıcı yorumunu en fazla 3 kez düzenleyebilir.
Bu sınır yorum manipülasyonunu azaltır ve moderasyon yükünü kontrol altında tutar.
9. Yorum silme

Kullanıcı yorumunu sildiğinde:

yorum görünümden kalkar,
yorum puanı iptal edilir.
Bu karar kullanıcı sistemi dosyalarında açıkça yer alır. Yani silme işlemi yalnız metni kaldırmak değil, ürün puanına olan etkisini de sıfırlamak anlamına gelir.
10. Puanlama zorunluluğu
kullanıcı yorum yaparken 1–5 arası yıldız puanlama yapmak zorundadır
sistem yorum akışında puanlamayı zorunlu ister
ürün puanlama sistemi bu yıldızlardan oluşur

Yorum sistemi ile puanlama sistemi ayrık değil, birlikte çalışır. Dosyalarda açıkça:

yorum yaparken 1 yıldız ile 5 yıldız arasında seçim zorunludur,
yorum onayında puanlama da istenir,
ürün puanlama sistemi bu yıldızlardan oluşur
denir.
Bu nedenle doğru model:
metinsiz yıldız puanı ayrı ayrıca ileride düşünülebilir,
ama mevcut sistemde yorum akışı içinde yıldız puanı zorunlu çekirdektir.
11. Puan ölçeği

Puan sistemi 5’li yıldız ölçeğiyle çalışmalıdır:

1 yıldız
2 yıldız
3 yıldız
4 yıldız
5 yıldız
Bu karar kullanıcı sistemi dosyalarında açık şekilde yazılmıştır.
12. Ürün puanı nasıl oluşur

Ürün ortalama puanı, kullanıcıların yorumla birlikte verdiği yıldız puanlarından oluşur. İptal/iade sistemi dosyası bunu açıkça söyler: yorumla birlikte verilen yıldız puanı ürün ortalamasını oluşturur. Bu yüzden puan sistemi:

yalnız görünür bir UI öğesi değil,
ürün güven sinyalinin hesap katmanıdır.
13. Verified purchase / doğrulanmış satın alım ilişkisi

Teslim edilmiş ürün için yapılan yorumlar güven meta verisi taşımalıdır. Dosyalarda “satın alındı / doğrulanmış satın alım” etiketinin iade sonrası düşeceği açıkça yazılıdır. Buradan çıkan doğru kanonik kural:

teslimatla birlikte verified purchase niteliği açılır,
yorum bu etiketi taşıyabilir,
iade sonrası bu etiket kaldırılır.
14. İade sonrası yorum davranışı
iade sonrası verified purchase / satın alındı etiketi düşer
gerekiyorsa kullanıcı adı anonimleşebilir

Bu sistemin en kritik kararlarından biri burada:

ürün iade edilirse yorum kalabilir,
ama yorumun puanı iptal edilir,
verified purchase etiketi düşer,
gerekirse kullanıcı adı anonimleşebilir.
Bu karar hem kullanıcı sistemi hem iptal/iade sistemi tarafından açık biçimde desteklenir. Bu, deneyim içeriğini tamamen yok etmeden güven sinyalini dürüst tutar.
15. İade sonrası puan etkisi

İade sonrası en doğru model şudur:

yorum metni tarihsel deneyim olarak kalabilir,
ama yıldız puanının ürün ortalamasına etkisi kaldırılır,
verified purchase bağı kırılır.
İptal/iade sistemi dosyası bu mantığı açıkça tarif eder.
16. Teslimat sistemi ile ilişkisi

Teslimat sistemi yorum sistemi için eligibility üretir. Teslimat sistemi dosyasında açıkça şu bilgiler yorum sistemine verilmelidir denir:

teslimat eşiği geçti mi,
hangi ürün satırı eligible oldu,
iade sonrası verified purchase etiketi düşecek mi.
Bu yüzden yorum sistemi tek başına karar vermez; teslimat truth’ünden beslenir.
17. PDP ile ilişkisi

PDP ürün karar yüzeyidir ve yorum / puanlama sistemi onun güven katmanının çekirdek parçasıdır. Kargo/teslimat dosyası da teslim edilen ürünler için yorumların PDP güven katmanını beslediğini söyler. Yani yorum sistemi:

takip akışının değil,
keşfet gövdesinin değil,
esas olarak PDP güven katmanının parçasıdır.
18. Moderasyon ile ilişkisi

Yorum alanı tamamen serbest bırakılamaz. Moderasyon sistemi dosyasına göre:

uygunsuz yorum içeriği incelenebilir,
spam veya kötü niyetli tekrar denemeleri engellenir,
yorum düzenleme suistimali izlenir,
iade sonrası güven meta verisi güncellenir,
gerekirse yorum kaldırılabilir, gizlenebilir veya anonimleştirilebilir.
Ayrıca yorum alanı “aşırı katı olmayan ama kontrolsüz de olmayan” bir moderasyon rejimiyle çalışmalıdır.
19. Çok paketli siparişlerde yorum hakkı

Çok paketli yapılarda yorum hakkı tüm siparişe kilitlenmemelidir. Teslimat sistemi dosyası, hakların sipariş bazlı değil ürün satırı bazlı açılması gerektiğini açıkça söyler. Bu yüzden:

siparişin bir kısmı teslim edilmişse,
yalnız o satırlar için yorum hakkı açılır,
diğer satırlar beklemede kalır.
20. Ana riskler

Yorum / puanlama sistemindeki ana riskler şunlardır:

satın almadan yorum üretme denemesi,
teslimat olmadan erken yorum hakkı açılması,
ürün başına birden fazla yorumla puan manipülasyonu,
iade sonrası puanın sistemde kalmaya devam etmesi,
düzenleme hakkının suistimali,
uygunsuz / spam yorumlar.
Bu risklerin tamamı mevcut kullanıcı, teslimat, iade ve moderasyon kararlarında zaten işaretlenmiş durumdadır.
21. Ana kurallar

Yorum / puanlama sistemi için sabitlenmesi gereken temel kurallar şunlardır:

yalnız giriş yapmış kullanıcı yorum yapabilir
yorum hakkı yalnız satın alınmış ve teslim edilmiş ürün için açılır
hak sipariş bazlı değil, ürün satırı bazlı açılır
ürün başına tek yorum vardır
kullanıcı yorumunu en fazla 3 kez düzenleyebilir
yorum silinirse görünümden kalkar ve puan etkisi iptal edilir
yorum yaparken 1–5 yıldız puanlama zorunludur
ürün puanı bu yıldızlardan oluşur
iade sonrası yorum kalabilir
iade sonrası puan etkisi kaldırılır
iade sonrası verified purchase etiketi düşer
gerekirse anonimleştirme uygulanabilir
yorum sistemi moderasyon denetimine tabidir
yorum sistemi PDP güven katmanının çekirdek parçasıdır.
22. Nihai kısa özet

Yorum / puanlama sistemi, yalnız satın alınıp teslim edilmiş ürün için ürün satırı bazında açılan; kullanıcıya ürün başına tek yorum ve zorunlu 1–5 yıldız puanı verme hakkı tanıyan; ürün ortalama puanını bu yıldızlardan üreten; iade sonrası yorumu tamamen silmeden puan etkisini ve verified purchase güven etiketini güncelleyen; PDP güven katmanını besleyen kontrollü ürün deneyimi sistemidir.