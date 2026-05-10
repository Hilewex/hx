# STATE_MACHINES/creator-lifecycle

Bu dosya, fenomen yaşam döngüsünün kodlama öncesi state machine omurgasını tanımlar.

Net kural:
- fenomen adaylığı ile aktif fenomen aynı şey değildir
- fenomen paneli ile fenomen yönetim sistemi aynı şey değildir
- fenomen kendi lifecycle truth’unu direct write ile değiştiremez
- creator lifecycle owner alanı, admin kontrollü yönetim sistemidir
- creator aktifliği, mağaza görünürlüğü ve yetki seti bu yaşam döngüsüne bağlıdır

Fenomen yaşam döngüsü sistemi, başvurudan aktif mağaza işletimine, oradan kısıt/askı/kapatma kararlarına kadar platform içindeki resmi creator statüsünü taşır. 

---

## 1. CREATOR LIFECYCLE SISTEMININ AMACI

Bu sistem şu işleri yapar:

- fenomen aday başvurusunu almak
- başvuruyu incelemek
- revizyon istemek
- onay / red kararı vermek
- kategori yetkilerini tanımlamak
- kısıt / askı / kapatma kararlarını yürütmek
- görünür creator statüsünü taşımak
- mağaza kullanım hakkını açmak veya daraltmak

Bu sistem şu işleri yapmaz:

- panel üzerinden self-service mağaza düzeni yürütmek
- sipariş truth owner’ı olmak
- finansal truth owner’ı olmak
- content/social truth owner’ı olmak
- payout owner’ı olmak

---

## 2. GIRDISI

Creator lifecycle şu kaynaklardan beslenir:

- fenomen başvurusu
- başvuru belgeleri ve bilgiler
- kategori/yetki kararları
- kalite / policy / moderation sinyalleri
- fraud/risk sinyalleri
- satış / performans / kalite özeti
- admin kararları
- itiraz / revizyon bilgileri

---

## 3. AKTORLER

### 3.1 Fenomen adayı
Başvuru yapar, revizyon verir, durumunu takip eder.

### 3.2 Onaylı fenomen
Aktif creator scope’u ile mağaza işletir; lifecycle owner değildir.

### 3.3 Creator admin / admin
İnceleme, onay, red, kategori yetkisi, kısıt ve askı kararı verir.

### 3.4 Moderation / risk / operations / finance
Sinyal üretir; nihai creator status owner’ı değildir.

---

## 4. CREATOR LIFECYCLE STATE LISTESI

Önerilen minimum state listesi:

- application_received
- under_review
- revision_requested
- approved
- active
- restricted
- suspended
- rejected
- closed

İlk faz için güvenli çekirdek:
- application_received
- under_review
- revision_requested
- approved
- active
- restricted
- suspended
- rejected

Not:
`approved` ile `active` ayrı tutulmalıdır.
Approved = yönetim onayı verildi.
Active = hesap, mağaza ve gerekli teknik/operasyonel açılış tamamlandı.

---

## 5. STATE TANIMLARI

### 5.1 application_received
Başvuru sisteme alınmıştır.

### 5.2 under_review
Başvuru, belge, uygunluk ve politika açısından incelenmektedir.

### 5.3 revision_requested
Ek bilgi/belge/açıklama veya düzeltme istenmiştir.

### 5.4 approved
Başvuru onaylanmıştır.
Creator olma hakkı tanınmıştır; ancak aktif kullanım açılmamış olabilir.

### 5.5 active
Fenomen aktif creator scope’uyla mağaza işletebilir.

### 5.6 restricted
Creator tamamen kapatılmamış; ama bazı hakları daraltılmıştır.

Örnek:
- belirli kategori kısıtı
- içerik üretim kısıtı
- kupon/story/post kısıtı
- görünürlük sınırı

### 5.7 suspended
Creator geçici olarak askıya alınmıştır.
Aktif mağaza kullanım hakkı durdurulmuştur.

### 5.8 rejected
Başvuru reddedilmiştir veya yeniden açılmayan süreç sonlandırılmıştır.

### 5.9 closed
Yaşam döngüsü aktif kullanım dışı kapanmıştır; tarihsel kayıt korunur.

---

## 6. GECERLI TRANSITION LISTESI

### Başvuru akışı
- application_received → under_review
- under_review → revision_requested
- under_review → approved
- under_review → rejected
- revision_requested → under_review

### Açılış akışı
- approved → active

### Yönetim/kısıt akışı
- active → restricted
- active → suspended
- restricted → active
- restricted → suspended
- suspended → active
- suspended → restricted

### Kapanış
- rejected → closed
- suspended → closed
  (iş modeline göre kalıcı kapatma)
- active → closed
  (iş modeline göre platformdan çıkış/sonlandırma)
- restricted → closed

---

## 7. YASAK TRANSITION LISTESI

- application_received → active
- application_received → approved
  (review olmadan)
- rejected → active
  (yeniden başvuru veya ayrı reopen mantığı olmadan)
- closed → active
  (ayrı yeniden aktivasyon/reopen modeli olmadan)
- suspended → approved
- restricted → approved

Net kural:
Başvuru onayı ile aktif creator olma aynı adım değildir.

---

## 8. KATEGORI YETKISI ILE ILISKI

Creator lifecycle state’i tek başına yeterli değildir.
Kategori yetkisi ayrı ama bağlı karar alanıdır.

Doğru model:
- active creator olabilir
- ama yalnız belirli kategorilerde işlem açılabilir
- restricted state kategori bazlı kısıt üretebilir

Bu yüzden:
creator aktifliği ve category permission birlikte değerlendirilmelidir. 

---

## 9. CREATOR PANEL ILE ILISKI

Fenomen mağaza yönetim paneli lifecycle owner değildir.

Doğru ilişki:
- lifecycle owner = fenomen yönetim sistemi
- creator panel = self-service çalışma alanı
- panel yalnız aktif/restricted/suspended sonucu yansıtır
- panelden lifecycle change direct write yapılamaz



---

## 10. MODERATION / RISK / PERFORMANCE SINYALLERI

Aşağıdaki sinyaller lifecycle state’i etkileyebilir:
- tekrar eden moderation ihlali
- sahte etkileşim / abuse
- kalite sorunu
- kural ihlali
- çok yüksek iade/şikayet paterni
- platform güvenliği açısından risk

Net kural:
Bu sinyaller creator lifecycle owner’a karar girdisi üretir; tek başına otomatik nihai state mutation yapmak zorunda değildir.

---

## 11. GORUNURLUK ETKISI

State’in storefront ve panel etkileri:

### approved
- henüz tam aktif mağaza olmak zorunda değildir

### active
- mağaza kullanılabilir
- creator panel aktif
- izinli içerik ve vitrini açabilir

### restricted
- mağaza görülebilir ama haklar daralabilir
- bazı CTA’lar veya yüzeyler kapanabilir

### suspended
- mağaza görünürlüğü kapatılabilir veya ciddi daraltılabilir
- panel uyarı/engelli moda geçebilir

### rejected / closed
- aktif creator deneyimi açılmaz

---

## 12. AUDIT / EVENT NOKTALARI

En az şu event’ler üretilmelidir:

- creator_application_received
- creator_review_started
- creator_revision_requested
- creator_approved
- creator_activated
- creator_restricted
- creator_suspended
- creator_reactivated
- creator_rejected
- creator_closed

Bu event’ler:
- analytics
- admin visibility
- risk/moderation referansı
- support
alanlarında kullanılabilir.

---

## 13. IDEMPOTENCY KURALI

Şu alanlarda duplicate önleme gerekir:

- aynı başvurunun birden fazla oluşturulması
- aynı admin kararının tekrar uygulanması
- aynı restriction/suspension komutunun duplicate işlenmesi

En az şu anahtarlar normalize edilmelidir:
- creator_application_id
- creator_id
- admin_action_id
- lifecycle_decision_key

---

## 14. KULLANICI / MAGAZA GORUNURLUGU NOTU

Kullanıcıya ve creator’a gösterilen dil sade olmalıdır:

- başvurunuz alındı
- incelemede
- ek bilgi gerekli
- onaylandı
- aktif
- kısıtlı
- askıda

İç policy/risk/moderation notları doğrudan creator’a aynen gösterilmez.

---

## 15. MOBIL ONCELIKLI TASARIM NOTU

Creator lifecycle görünürlüğü mobilde şu şekilde sade olmalıdır:

- başvuru durumu tek bakışta
- eksik belge / revizyon çağrısı net CTA ile
- askı/kısıt sebepleri eyleme dönük dilde
- aktiflik ve kategori yetkisi anlaşılır özetle

---

## 16. KISA OZET

Doğru creator lifecycle omurgası şudur:

- aday başvurur
- platform inceler
- gerekirse revizyon ister
- onay / red verir
- creator aktifleşir
- gerektiğinde restricted / suspended olabilir

Bu nedenle creator lifecycle,
creator panelinden ayrı, admin kontrollü owner state machine olarak tasarlanmalıdır.