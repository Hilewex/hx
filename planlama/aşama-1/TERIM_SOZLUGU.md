# TERIM_SOZLUGU

Bu sözlükte yer alan terimler, tüm sistem dosyalarında mümkün olduğunca aynı anlamla kullanılmalıdır.
Aynı terimin farklı bağlamda farklı anlam üretmesi engellenmelidir.

---

## active
Bir nesnenin, kural setine göre sistem içinde çalışır / kullanılabilir durumda olduğunu ifade eder.

Örnek:
- aktif kampanya
- aktif mağaza
- aktif kupon
- aktif ürün

Not:
active, her zaman visible anlamına gelmez.

---

## visible
Bir nesnenin kullanıcıya veya ilgili role görünür olduğunu ifade eder.

Örnek:
- görünür ürün
- görünür story
- görünür kampanya etiketi

Not:
Bir nesne active olabilir ama visible olmayabilir.
Bir nesne kayıtlı olabilir ama visible olmayabilir.

---

## published
İçerik veya yanıtın sistem içinde yayın statüsüne geçtiğini ifade eder.

Örnek:
- yayınlanmış post
- yayınlanmış soru-cevap yanıtı
- yayınlanmış story

Not:
published olmak, her zaman herkese açık olmak zorunda değildir; scope’a bağlı olabilir.

---

## draft
Henüz yayınlanmamış, onaylanmamış veya tamamlanmamış kayıt.

Örnek:
- taslak cevap
- taslak içerik
- taslak checkout hazırlığı

---

## pending
Bir aksiyonun veya değerin oluştuğunu ama henüz kesinleşmediğini ifade eder.

Örnek:
- pending puan
- pending inceleme
- pending moderation
- pending payout değerlendirmesi

Not:
pending değer, görünür olabilir ama tam hak doğurmaz.

---

## vested
Doğrulanmış, geçerliliği kabul edilmiş ama mutlaka hemen harcanabilir veya payout’a hazır olmak zorunda olmayan ara kesinlik statüsü.

Örnek:
- vested puan
- vested hakediş ara statüsü

---

## spendable
Kullanıcı tarafından gerçekten harcanabilir duruma gelmiş değer.

Örnek:
- spendable puan

Not:
Her pending veya vested değer spendable değildir.

---

## payable
Ödeme çıkışına aday, gerekli şartları geçmiş ama henüz fiilen ödenmiş olmayan finansal bakiye.

Örnek:
- payable hakediş

---

## settled
Finansal mutabakat açısından kesinleşmiş ve kalem bazlı dağıtım kuralı tamamlanmış değer.

Not:
settled ile paid aynı şey değildir.

---

## paid
Gerçek ödeme çıkışı tamamlanmış durumu ifade eder.

Örnek:
- paid payout
- paid invoice

---

## blocked
Sistemsel, finansal, risk veya yetki sebebiyle işlenmesi/geçmesi engellenmiş durum.

Örnek:
- blocked payout
- blocked auth
- blocked action

---

## restricted
Tam kapatılmamış ama yetkileri veya görünürlüğü daraltılmış durum.

Örnek:
- restricted creator
- restricted supplier
- restricted feature set

---

## suspended
Geçici olarak durdurulmuş, askıya alınmış durum.

Örnek:
- suspended mağaza
- suspended tedarikçi
- suspended hesap

Not:
restricted ve suspended aynı şey değildir.
restricted = sınırlı aktiflik
suspended = geçici durdurma

---

## archived
Sıcak kullanım/görünürlük katmanından çıkarılmış ama tarihsel kayıt olarak sistemde tutulmaya devam eden durum.

Örnek:
- archived story
- archived campaign
- archived media record

---

## deleted
Sistemden silinmiş veya kullanıcıya artık yokmuş gibi davranılan durum.

Not:
deleted her zaman fiziksel hard delete anlamına gelmez.
Soft delete olabilir.

---

## soft delete
Kayıt fiziksel olarak durur; ama uygulama açısından silinmiş kabul edilir.

---

## hard delete
Kayıt fiziksel olarak tamamen kaldırılır.

Not:
Sipariş, ödeme, mutabakat, audit gibi kritik kayıtlarda hard delete çok sınırlı kullanılmalıdır.

---

## eligible
Bir aksiyon veya hakkın açılabilmesi için gerekli şartları sağlıyor olmak.

Örnek:
- review eligible
- story eligible
- return eligible
- payout eligible

---

## verified
Doğrulanmış veya sistem tarafından geçerliliği kabul edilmiş bağlam.

Örnek:
- verified purchase
- verified address
- verified payout info

Not:
verified, her zaman visible badge anlamına gelmez.

---

## review eligible
Kullanıcının yorum yapma hakkını açan uygunluk durumu.

Genel anlam:
ürün satın alınmış ve teslim edilmiş olmalıdır.

---

## story eligible
Kullanıcının ürün story’si yükleyebilme hakkını açan uygunluk durumu.

Genel anlam:
ürün satın alınmış, teslim edilmiş ve ürün etiketiyle ilişkilendirilebilir olmalıdır.

---

## return eligible
İlgili sipariş veya satırın iade kuralı açısından uygun durumda olması.

---

## degraded
Sistem veya yüzeyin tamamen kapalı olmadan eksik/azaltılmış kalitede çalışması.

Örnek:
- degraded service
- degraded response
- degraded upstream dependency

---

## unavailable
İlgili bağımlılık veya yüzeyin kullanılamaz durumda olması.

---

## fallback
Ana davranış veya ana sağlayıcı çalışmadığında sistemin kontrollü biçimde geçtiği alternatif davranış.

---

## retry
Başarısız olmuş bir işlemin kural dahilinde yeniden denenmesi.

---

## idempotent
Aynı isteğin birden fazla kez gelmesi halinde sistem sonucunun çoğalmaması.

Örnek:
- payment capture request
- order create command
- payout trigger

---

## owner
Belirli truth alanını mutate etme yetkisine sahip tek domain/modül.

Not:
read hakkı farklı sistemlerde olabilir; write hakkı owner’da kalır.

---

## projection
Başka bir truth kaynağından üretilmiş, okunabilir ama ana truth olmayan görünüm.

Örnek:
- panel özeti
- BFF response shape
- analytics görünümü

---

## truth
Sistemde kanonik kabul edilen, karar ve mutation açısından referans veri alanı.

---

## command
Owner modülde state değişikliği talep eden kontrollü aksiyon.

---

## event
Bir şey olduğunu bildiren, bilgi taşıyan ve diğer sistemlerin tepki vermesine yarayan mesaj.

Not:
event, owner truth mutation yerine geçmez.

---

## audit log
Kritik aksiyonların kim, ne zaman, hangi bağlamda yaptığını kaydeden denetim izi.

---

## moderation
İçeriğin veya davranışın platform kurallarına uygunluğunu inceleyen ve görünürlük/karar etkisi doğuran kontrol süreci.

---

## fraud / risk
Suistimal, anomali veya finansal/operasyonel tehdit ihtimalini değerlendiren koruma katmanı.

Not:
moderation ile fraud/risk aynı şey değildir.

---

## hot storage
Sık erişilen, aktif gösterilen veya hızlı servis edilmesi gereken içerik/veri katmanı.

---

## warm storage
Daha az erişilen ama hâlâ erişilebilir ve orta hızda tutulabilen katman.

---

## cold storage
Aktif görünür kullanımda olmayan, maliyet/verim odaklı arşiv katmanı.

---

## snapshot
Belirli bir anda geçerli olan verinin, sonraki değişimlerden etkilenmeyecek şekilde sabitlenmiş kopyası.

Örnek:
- address snapshot
- price snapshot
- settlement snapshot

---

## context
Bir aksiyonun veya görünümün gerçekleştiği bağlam.

Örnek:
- mağaza bağlamlı PDP
- keşfet bağlamlı arama
- kullanıcı bağlamlı eligibility

---

## scope
Bir aktörün hangi alanda hangi sınırla işlem yapabildiğini tanımlayan erişim çerçevesi.

Örnek:
- shopper scope
- creator scope
- admin scope
- internal scope