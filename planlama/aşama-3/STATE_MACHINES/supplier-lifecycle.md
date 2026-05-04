# STATE_MACHINES/supplier-lifecycle

Bu dosya, tedarikçi yaşam döngüsünün kodlama öncesi state machine omurgasını tanımlar.

Net kural:
- tedarikçi adaylığı ile aktif tedarikçi aynı şey değildir
- tedarikçi paneli ile tedarikçi yönetim sistemi aynı şey değildir
- tedarikçi kendi lifecycle truth’unu direct write ile değiştiremez
- supplier lifecycle owner alanı admin kontrollü yönetim sistemidir
- ürün yükleme, kategori hakkı, stok/baz fiyat girdisi ve fulfillment katılımı bu yaşam döngüsüne bağlıdır

Tedarikçi yaşam döngüsü sistemi, başvurudan aktif ürün/operasyon katılımına, oradan kısıt/askı/kapatma kararlarına kadar platform içindeki resmi supplier statüsünü taşır. 

---

## 1. SUPPLIER LIFECYCLE SISTEMININ AMACI

Bu sistem şu işleri yapar:

- tedarikçi başvurusunu almak
- başvuruyu incelemek
- revizyon istemek
- onay / red kararı vermek
- kategori ve ürün yükleme yetkilerini tanımlamak
- kalite / askı / kısıt kararlarını yürütmek
- supplier görünür ve aktif statüsünü taşımak
- fulfillment katılım hakkını açmak veya daraltmak

Bu sistem şu işleri yapmaz:

- panel üzerinden ürün veri girişi yürütmek
- satış fiyatını belirlemek
- ürün onayı vermek
- payout owner’ı olmak
- financial truth owner’ı olmak
- order truth owner’ı olmak

---

## 2. GIRDISI

Supplier lifecycle şu kaynaklardan beslenir:

- tedarikçi başvurusu
- başvuru belgeleri ve bilgiler
- kategori/yükleme yetkisi kararları
- ürün kabul performansı
- kalite / iade / problem sinyalleri
- operasyon ve fulfillment kalite sinyalleri
- risk/fraud sinyalleri
- admin kararları
- revizyon / itiraz bilgileri

---

## 3. AKTORLER

### 3.1 Tedarikçi adayı
Başvuru yapar, revizyon verir, durumunu takip eder.

### 3.2 Onaylı tedarikçi
Aktif supplier scope’u ile ürün ve fulfillment girdisi sağlar; lifecycle owner değildir.

### 3.3 Supplier admin / admin
İnceleme, onay, red, kategori yetkisi, kısıt ve askı kararı verir.

### 3.4 Product acceptance / operations / risk / finance
Sinyal üretir; nihai supplier lifecycle owner’ı değildir.

---

## 4. SUPPLIER LIFECYCLE STATE LISTESI

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
Active = ürün yükleme / lojistik / fulfillment katılımı teknik ve operasyonel olarak açıldı.

---

## 5. STATE TANIMLARI

### 5.1 application_received
Başvuru sisteme alınmıştır.

### 5.2 under_review
Başvuru, belge, uygunluk ve politika açısından incelenmektedir.

### 5.3 revision_requested
Ek belge / düzeltme / açıklama istenmiştir.

### 5.4 approved
Başvuru onaylanmıştır.
Supplier olma hakkı tanınmıştır; ancak aktif operasyon açılmamış olabilir.

### 5.5 active
Tedarikçi aktif supplier scope’u ile ürün ve fulfillment girdisi sağlayabilir.

### 5.6 restricted
Tedarikçi tamamen kapatılmamış; ama bazı hakları daraltılmıştır.

Örnek:
- belirli kategori kısıtı
- yeni ürün yükleme kısıtı
- stok/fiyat güncelleme kısıtı
- fulfillment katılım kısıtı

### 5.7 suspended
Tedarikçi geçici olarak askıya alınmıştır.
Aktif ürün/fulfillment kullanım hakkı durdurulmuştur.

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
Başvuru onayı ile aktif supplier olma aynı adım değildir.

---

## 8. KATEGORI / YUKLEME YETKISI ILE ILISKI

Supplier lifecycle state’i tek başına yeterli değildir.
Kategori ve yükleme yetkisi ayrı ama bağlı karar alanıdır.

Doğru model:
- active supplier olabilir
- ama yalnız belirli kategorilerde ürün yükleyebilir
- restricted state kategori veya işlem bazlı kısıt üretebilir

Bu yüzden:
supplier aktifliği ve category/upload permission birlikte değerlendirilmelidir. 

---

## 9. SUPPLIER PANEL ILE ILISKI

Tedarikçi paneli lifecycle owner değildir.

Doğru ilişki:
- lifecycle owner = tedarikçi yönetim sistemi
- supplier panel = çalışma alanı
- panel yalnız active/restricted/suspended sonucu yansıtır
- panelden lifecycle change direct write yapılamaz



---

## 10. PRODUCT ACCEPTANCE / QUALITY / RISK SINYALLERI

Aşağıdaki sinyaller lifecycle state’i etkileyebilir:
- tekrar eden ürün kabul problemi
- kalite sorunu / yüksek iade paterni
- yanlış kategori / yanlış veri girme
- fulfillment gecikmesi / operasyon güvensizliği
- sahte stok/fiyat pattern’leri
- risk/fraud işaretleri

Net kural:
Bu sinyaller supplier lifecycle owner’a karar girdisi üretir; tek başına otomatik nihai state mutation yapmak zorunda değildir.

---

## 11. GORUNURLUK VE IS HAKKI ETKISI

State’in panel ve platform etkileri:

### approved
- henüz tam aktif operasyon açılmayabilir

### active
- ürün yükleme açılır
- stok/baz fiyat girdisi açılır
- fulfillment katılımı açılır
- supplier panel tam kullanıma geçer

### restricted
- belirli alanlar daralabilir
- yeni ürün yükleme veya bazı aksiyonlar kapanabilir

### suspended
- panel engelli/uyarı moduna geçebilir
- aktif kullanım ciddi biçimde daralır veya kapanır

### rejected / closed
- aktif supplier deneyimi açılmaz

---

## 12. AUDIT / EVENT NOKTALARI

En az şu event’ler üretilmelidir:

- supplier_application_received
- supplier_review_started
- supplier_revision_requested
- supplier_approved
- supplier_activated
- supplier_restricted
- supplier_suspended
- supplier_reactivated
- supplier_rejected
- supplier_closed

Bu event’ler:
- analytics
- admin visibility
- product acceptance dashboards
- risk/ops referansı
alanlarında kullanılabilir.

---

## 13. IDEMPOTENCY KURALI

Şu alanlarda duplicate önleme gerekir:

- aynı başvurunun birden fazla oluşturulması
- aynı admin kararının tekrar uygulanması
- aynı restriction/suspension komutunun duplicate işlenmesi

En az şu anahtarlar normalize edilmelidir:
- supplier_application_id
- supplier_id
- admin_action_id
- lifecycle_decision_key

---

## 14. KULLANICI / TEDARIKCI GORUNURLUGU NOTU

Tedarikçiye gösterilen dil sade olmalıdır:

- başvurunuz alındı
- incelemede
- ek bilgi gerekli
- onaylandı
- aktif
- kısıtlı
- askıda

İç quality/risk/ops notları doğrudan supplier’a aynen gösterilmez.

---

## 15. MOBIL / PANEL TASARIM NOTU

Supplier lifecycle görünürlüğü panelde sade olmalıdır:

- başvuru durumu tek bakışta
- eksik belge / revizyon çağrısı net CTA ile
- askı/kısıt sebepleri eyleme dönük dilde
- kategori/yükleme hakkı anlaşılır özetle

---

## 16. KISA OZET

Doğru supplier lifecycle omurgası şudur:

- aday başvurur
- platform inceler
- gerekirse revizyon ister
- onay / red verir
- supplier aktifleşir
- gerektiğinde restricted / suspended olabilir

Bu nedenle supplier lifecycle,
supplier panelinden ayrı, admin kontrollü owner state machine olarak tasarlanmalıdır.