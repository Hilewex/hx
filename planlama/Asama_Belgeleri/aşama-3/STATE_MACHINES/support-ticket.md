# STATE_MACHINES/support-ticket

Bu dosya, destek ticket operasyon alanının kodlama öncesi state machine omurgasını tanımlar.

Net kural:
- destek sistemi ile destek ticket operasyon sistemi aynı şey değildir
- destek sistemi kullanıcı giriş kapısıdır
- support-ticket sistemi iç çözüm ve vaka yönetim motorudur
- sosyal mesajlaşma ile resmi ticket birbirine karıştırılmaz
- ticket, doğru ekip ve doğru SLA ile yönetilmelidir

Support-ticket sistemi, serbest sohbet değil; kurallı vaka yönetimidir. :contentReference[oaicite:1]{index=1}

---

## 1. SUPPORT-TICKET SISTEMININ AMACI

Bu sistem şu işleri yapar:

- kullanıcıdan gelen resmi destek talebini ticket’a dönüştürmek
- ticket’ı sınıflandırmak
- öncelik ve risk seviyesini belirlemek
- doğru kuyruğa ve doğru ekibe atamak
- SLA takibi yapmak
- escalation başlatmak
- çözüm ve kapanış kayıtlarını tutmak

Bu sistem şu işleri yapmaz:

- sosyal mesaj kutusu gibi serbest sohbet taşımak
- sipariş truth’unu mutate etmek
- moderation owner kararı vermek
- fraud owner kararı vermek
- financial truth mutate etmek

---

## 2. GIRDISI

Support-ticket sistemi şu kaynaklardan beslenebilir:

- destek sistemi giriş yüzeyi
- sipariş detay ekranı
- sipariş takip ekranı
- iade/iptal akışı
- ödeme hata ekranı
- hesap/giriş sorun akışı
- moderasyon/şikayet yüzeyi
- admin iç açılışları gerekiyorsa

Net kural:
Farklı giriş noktaları olabilir; ticket truth’u tek sistemde tutulmalıdır. :contentReference[oaicite:2]{index=2}

---

## 3. AKTORLER

### 3.1 Kullanıcı
Ticket’ın sahibi ve problem bildiricisidir.

### 3.2 Support agent / support admin
Ticket’ı karşılayan, sınıflandıran, işleyen veya ilgili ekibe yönlendiren aktördür.

### 3.3 Operations team
Sipariş, fulfillment, gecikme ve teslimat konularında devreye girer.

### 3.4 Finance team
Ödeme, refund, kupon finansı ve hakediş itirazı tarafında devreye girer.

### 3.5 Moderation team
İçerik ve şikayet vakalarında devreye girer.

### 3.6 Fraud / risk team
Kötüye kullanım, sahte sipariş, kupon suistimali ve anomali vakalarında devreye girer.

### 3.7 Admin
Üst görünürlük ve kritik escalation tarafıdır.

---

## 4. TICKET STATE LISTESI

Önerilen minimum profesyonel state listesi:

- created
- triaged
- assigned
- in_progress
- waiting_user
- waiting_internal
- escalated
- resolved
- reopened
- closed

İlk faz için güvenli çekirdek:
- created
- triaged
- assigned
- in_progress
- waiting_user
- escalated
- resolved
- closed

---

## 5. STATE TANIMLARI

### 5.1 created
Ticket oluşturulmuştur.
Henüz sınıflandırma ve atama yapılmamıştır.

### 5.2 triaged
Ticket türü, önceliği, risk seviyesi ve hedef ekip belirlenmiştir.

### 5.3 assigned
Ticket belirli bir ekip veya temsilciye atanmıştır.

### 5.4 in_progress
Ticket aktif olarak işlenmektedir.

### 5.5 waiting_user
Çözüm için kullanıcıdan ek bilgi / doğrulama / belge beklenmektedir.

### 5.6 waiting_internal
Ticket ilgili iç ekip veya dış bağımlılıktan cevap beklemektedir.

### 5.7 escalated
Ticket daha üst seviye ekip veya başka owner alana yükseltilmiştir.

### 5.8 resolved
Çözüm üretilmiştir; ticket kapanışa hazırdır.

### 5.9 reopened
Kapanmış veya çözülmüş ticket yeniden açılmıştır.

### 5.10 closed
Ticket kapanmıştır.
Tarihsel kayıt olarak yaşamaya devam eder.

---

## 6. GECERLI TRANSITION LISTESI

### Oluşum
- created → triaged

### Atama / işleme
- triaged → assigned
- assigned → in_progress
- triaged → in_progress
  (küçük ekiplerde doğrudan işleme geçiş olabilir)

### Bekleme
- in_progress → waiting_user
- in_progress → waiting_internal
- waiting_user → in_progress
- waiting_internal → in_progress

### Escalation
- triaged → escalated
- assigned → escalated
- in_progress → escalated
- waiting_internal → escalated

### Çözüm / kapanış
- in_progress → resolved
- escalated → resolved
- waiting_user → resolved
  (kullanıcı dönüşüyle çözüm tamamlandıysa)
- resolved → closed

### Yeniden açılma
- resolved → reopened
- closed → reopened
- reopened → triaged
- reopened → assigned
- reopened → in_progress

---

## 7. YASAK TRANSITION LISTESI

- created → resolved
- created → closed
- triaged → closed
- waiting_user → closed
  (çözüm/kapanış kuralı olmadan)
- escalated → closed
  (çözüm üretmeden)
- closed → resolved
  (yeniden açılmadan)

Net kural:
Ticket, sınıflandırma ve işlem izi olmadan “kapatıldı”ya gitmemelidir.

---

## 8. TICKET TURLERI

Ticket sistemi en az şu ana türleri taşımalıdır:

- sipariş problemi
- teslimat / kargo problemi
- iptal / iade talebi veya itirazı
- ödeme problemi
- kupon / promosyon problemi
- hesap / giriş problemi
- teknik problem
- mağaza / fenomen şikayeti
- içerik / moderasyon şikayeti
- ürün kalite problemi
- puan / ödül / puan market problemi

Bu sınıflandırma, triage state’inde mutlaka işlenmelidir. :contentReference[oaicite:3]{index=3}

---

## 9. ONCELIK VE SLA MANTIGI

Her ticket aynı ağırlıkta değildir.

Minimum öncelik:
- low
- normal
- high
- urgent
- critical

SLA, en az şu alanlara bağlanmalıdır:
- ilk yanıt süresi
- ilk atama süresi
- escalation süresi
- çözüm süresi
- kapanış süresi

Not:
Ödeme problemi ile basit bilgi talebi aynı kuyruğa ve aynı SLA’ya düşmemelidir. :contentReference[oaicite:4]{index=4}

---

## 10. ROUTING / ASSIGNMENT MANTIGI

Triaged state’inde ticket şu ekiplerden birine yönlenebilir:

- support default queue
- operations queue
- finance queue
- moderation queue
- fraud/risk queue
- technical queue
- admin escalation queue

Net kural:
Routing, ticket türü + öncelik + risk seviyesi + bağlam (order/payment/content) üzerinden yapılmalıdır.

---

## 11. SIPARIS / ODEME / MODERASYON ILE ILISKI

Support-ticket sistemi owner truth değildir.
Doğru ilişki şu şekilde kurulmalıdır:

- sipariş problemi → order/ops projection’a bakar
- ödeme problemi → payment/finance projection’a bakar
- iade problemi → cancel-return projection’a bakar
- içerik şikayeti → moderation queue’ya escalation açar
- abuse şüphesi → fraud/risk queue’ya escalation açar

Net kural:
Ticket sistemi vaka owner’ıdır; domain truth owner’ı değildir.

---

## 12. ESCALATION KURALI

Escalation şu durumlarda açılabilir:

- yüksek risk / kritik öncelik
- SLA ihlali
- support scope dışı domain owner gereksinimi
- finance/moderation/risk owner kararı ihtiyacı
- tekrar eden unresolved vaka
- operasyonel tıkanma

Escalated state, “çözülmedi ama başka owner’a taşındı” anlamına gelir.

---

## 13. REOPEN KURALI

Aşağıdaki durumlarda reopen açılabilir:

- kullanıcı çözümün yeterli olmadığını bildirdi
- aynı vaka tekrarlandı
- iç ekip çözümü geri çekti
- kapanış sonrası yeni veri geldi

Net kural:
Reopen, aynı ticket geçmişini korumalıdır; yeni vaka açmak zorunlu değildir.

---

## 14. AUDIT / EVENT NOKTALARI

Support-ticket sistemi en az şu olayları üretebilmelidir:

- ticket_created
- ticket_triaged
- ticket_assigned
- ticket_in_progress
- ticket_waiting_user
- ticket_waiting_internal
- ticket_escalated
- ticket_resolved
- ticket_reopened
- ticket_closed

Bu event’ler:
- analytics
- SLA reporting
- support dashboards
- admin visibility
alanlarında kullanılabilir.

---

## 15. IDEMPOTENCY / DUPLICATE KURALI

Aşağıdaki alanlarda duplicate önleme gerekir:

- aynı problem için peş peşe çoklu ticket açılması
- aynı sipariş/satır/ödeme bağlamı için istemeden duplicate vaka
- aynı webhook/otomatik trigger’dan çoklu ticket üretimi

En az şu alanlar normalize edilmelidir:
- ticket_source
- subject_type
- subject_id
- user_id
- recent_window
- dedupe_key

Not:
Bazı tekrarlar gerçekten yeni vakadır; bu yüzden dedupe kör değil, kural bazlı çalışmalıdır.

---

## 16. KULLANICI GORUNURLUGU NOTU

Kullanıcıya sade süreç dili gösterilmelidir:

- talebiniz alındı
- inceleniyor
- ek bilgi bekleniyor
- ilgili ekibe iletildi
- çözüldü
- kapatıldı

Kullanıcıya:
- iç queue adı
- iç escalation kodu
- internal owner dili
- risk/moderation iç notları
doğrudan gösterilmez.

---

## 17. MOBIL ONCELIKLI TASARIM NOTU

Support-ticket deneyimi mobil öncelikli olmalıdır:

- konu seçimi hızlı
- sipariş bağlamı kolay iliştirilebilir
- ek bilgi / medya yükleme basit
- ticket geçmişi sade timeline olarak görünür
- escalation olsa bile kullanıcı dili sade kalır

---

## 18. KISA OZET

Doğru support-ticket omurgası şudur:

- destek sistemi giriş kapısıdır
- support-ticket sistemi iç vaka motorudur
- ticket önce sınıflanır, sonra atanır, sonra çözülür
- domain owner gerektiren vakalar escalation ile doğru ekibe taşınır
- ticket kapanır ama tarihsel iz korunur