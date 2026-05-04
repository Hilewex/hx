# FALLBACK_RETRY_TIMEOUT_POLICY

Bu dosya, Aşama 6 kapsamında dış sağlayıcı entegrasyonlarında timeout, retry, fallback, reconciliation ve manuel müdahale kurallarını tanımlar.

Amaç:
- provider hatalarında sistemin dağılmasını önlemek
- hangi durumda otomatik retry yapılacağını, hangi durumda yapılmayacağını netleştirmek
- timeout, duplicate callback, unknown result ve degraded dış bağımlılık durumlarını kontrollü yönetmek
- payment, shipment, email ve payout alanlarında ortak operasyon dili kurmak

Net kural:
- timeout her zaman kesin başarısızlık değildir
- retry yalnız retry-safe akışlarda yapılır
- fallback, owner truth’u bozacak şekilde uygulanmaz
- duplicate callback ikinci kez truth mutation üretmez
- unknown_result durumları reconciliation ile kapanır
- kritik dış sonuçlar kaybolmaz; izlenebilir kalır

---

## 1. KAPSAM

Bu politika şu entegrasyon alanları için geçerlidir:

- Payment provider
- Carrier / shipment provider
- Email provider
- Push provider (gelecek)
- Payout provider
- Media/CDN provider (gelecek)
- Harici fraud provider (gelecek)
- E-fatura / e-arşiv provider (gelecek)

İlk fazda aktif ağırlık:
- Payment
- Carrier
- Email sandbox
- Payout sandbox

---

## 2. TEMEL ILKELER

## 2.1 Timeout sonucu
Timeout aşağıdaki üç sınıftan biri olarak ele alınır:

### T1 — Submit başarısız
İstek provider’a hiç gitmedi veya açıkça gönderilemedi.

### T2 — Submit belirsiz
İstek provider’a gitmiş olabilir ama sonucu bilinmiyor.

### T3 — Sonuç bekleniyor
İstek alındı, callback / async result sonradan gelecek.

Net kural:
Timeout görüldüğünde hemen “domain failed” yazılmaz; önce hangi timeout sınıfında olduğuna karar verilir.

## 2.2 Retry ilkesi
Retry yalnız şu şartlarda yapılır:
- işlem retry-safe ise
- idempotency key veya eşdeğer correlation varsa
- duplicate side effect üretmeyecekse
- state guard bunu kabul ediyorsa

## 2.3 Fallback ilkesi
Fallback demek:
- başka sağlayıcıya yönlenme
- sandbox veya manual path’e düşme
- degraded ama kontrollü alternatif akışa geçme

Net kural:
Fallback, owner truth’u atlayarak çalışmaz.

## 2.4 Reconciliation ilkesi
Reconciliation şu durumda gerekir:
- provider sonucu belirsizse
- callback gelmediyse
- internal state ile provider state eşleşmiyorsa
- duplicate / out-of-order callback şüphesi varsa

---

## 3. SONUC SINIFLANDIRMA MODELI

Her entegrasyon sonucu şu sınıflardan biriyle normalize edilmelidir:

- `accepted`
- `pending_external`
- `failed_to_submit`
- `rejected_by_provider`
- `unknown_result`
- `completed`
- `completed_with_warning`
- `duplicate_ignored`
- `manually_review_required`

Bu sınıflar provider ham cevabının üstünde ortak iç dildir.

---

## 4. PAYMENT POLITIKASI

---

## 4.1 Initiation timeout

Eğer payment initiate çağrısında timeout olursa:

### Durum A
İstek provider’a hiç çıkmadıysa:
- `failed_to_submit`

### Durum B
İstek çıkmış olabilir ama kesin değilse:
- `unknown_result`
- reconciliation gerekir
- kullanıcıya kesin “başarısız” denmez

### Durum C
Provider async akışla sonuç verecekse:
- `pending_external`

## 4.2 Payment retry

Payment initiate retry yalnız şu durumda yapılır:
- aynı idempotency key ile
- payment owner alanı duplicate create üretmeyecek şekilde
- checkout hala geçerliyse
- price lock / stock reservation hâlâ uygunsa

Retry yapılmaz:
- checkout expired ise
- payment kesin reject aldıysa
- guard/state conflict varsa

## 4.3 Payment fallback provider

İlk fazda:
- primary aktif provider: PayTR
- secondary-ready provider: iyzico

Fallback yaklaşımı:
- otomatik fallback varsayılan değildir
- önce primary sonucu sınıflanır
- `failed_to_submit` gibi erken kırılım varsa kontrollü secondary fallback düşünülebilir
- `unknown_result` durumunda hemen ikinci provider’a gitmek tehlikelidir; duplicate tahsilat riski doğurur

Net kural:
`unknown_result` durumunda önce reconciliation, sonra karar.

## 4.4 Payment callback

Provider callback geldiğinde:
- dedupe yapılır
- state guard çalışır
- duplicate ise `duplicate_ignored`
- valid ise payment truth güncellenir
- order create ayrıca ve idempotent çalışır

---

## 5. CARRIER / SHIPMENT POLITIKASI

---

## 5.1 Shipment create timeout

Carrier shipment create çağrısında timeout olursa:

- request provider’a ulaşmadıysa `failed_to_submit`
- ulaşıp ulaşmadığı bilinmiyorsa `unknown_result`
- shipment owner alanı “created”e geçmeden önce reconciliation gerekebilir

## 5.2 Carrier retry

Retry yapılabilir:
- shipment create request idempotent ise
- aynı carrier reference/correlation ile tekrarlanabiliyorsa
- duplicate label / duplicate create riski kontrol altındaysa

Retry yapılmaz:
- provider create durumu belirsiz ve duplicate shipment riski yüksekse
- önce reconciliation gerekiyorsa

## 5.3 Delivery callback timeout / gecikme

Delivery event gecikirse:
- order/shipment truth hemen tamamlanmış sayılmaz
- provider polling veya manual verification devreye girebilir
- projection tarafında “gecikmeli bilgi” gösterilebilir

## 5.4 Carrier fallback

İlk fazda 1 gerçek taşıyıcı aktif olduğundan:
- otomatik taşıyıcılar arası fallback ilk faz varsayılanı değildir
- mimari buna açık olabilir ama aktif karar değildir

---

## 6. EMAIL POLITIKASI

---

## 6.1 İlk faz durumu
Email provider sandbox ile çalışır.

## 6.2 Email failure

Email gönderilemezse:
- notification delivery failed veya pending olur
- ana domain truth değişmez
- retry-safe ise tekrar denenir

## 6.3 Email retry

Retry yapılabilir:
- aynı message intent için
- duplicate mail göndermeyi kontrol eden idempotent policy ile
- rate limit ve provider backoff gözetilerek

## 6.4 Email fallback

İlk fazda gerçek email provider aktif değilse:
- sandbox log yeterlidir
- manual support visibility gerekirse event/log tutulur

---

## 7. PUSH POLITIKASI

İlk fazda push park edildiği için:
- gerçek timeout/retry/fallback politikası aktif değil
- ama channel abstraction bunu sonradan destekleyecek şekilde düşünülür

---

## 8. PAYOUT POLITIKASI

---

## 8.1 İlk faz durumu
Payout gerçek provider entegrasyonu aktif değildir.
Sandbox/park yaklaşımı uygulanır.

## 8.2 Timeout / unknown result

Gerçek provider geldiğinde uygulanacak temel kural:
- payout submit timeout her zaman başarısızlık değildir
- external paid sonucu belirsizse reconciliation gerekir
- duplicate payout riski en yüksek dikkat alanıdır

## 8.3 Retry

Payout retry yalnız:
- item/batch state uygunsa
- duplicate transfer riski kontrol edildiyse
- provider-side idempotency veya transfer reference varsa

## 8.4 Partial failure

Payout batch için:
- batch success ile item success aynı şey değildir
- partial_failure first-class durumdur
- retry item düzeyinde planlanabilir

---

## 9. FRAUD / RISK POLITIKASI

İlk fazda harici fraud provider yoktur.

Bu nedenle:
- timeout/retry/fallback alanı dış provider için aktif değildir
- risk internal rule engine ile çalışır

Gelecekte harici provider gelirse:
- sinyal kaynağı gibi davranır
- timeout durumunda owner guard blind accept vermez
- gerekirse `manually_review_required` durumu kullanılır

---

## 10. MEDIA / CDN POLITIKASI

İlk fazda gerçek vendor aktif değildir.

Gelecekte uygulanacak temel kural:
- upload sonucu `ready` sayılmaz
- transcode/cdn dağıtımı tamamlanmadan yayın state’i açılmaz
- timeout durumunda media state `processing` / `unknown_result` benzeri kontrollü durumda kalır

---

## 11. RECONCILIATION KURALI

Reconciliation zorunlu alanlar:
- payment unknown_result
- payout unknown_result
- shipment create belirsizliği
- delivery callback kaybı / sıradışı gecikme

Reconciliation çıktıları:
- `completed`
- `rejected_by_provider`
- `duplicate_ignored`
- `manually_review_required`

Net kural:
Belirsiz dış sonuçlar “sessizce başarısız” sayılmaz; kapatılana kadar izlenir.

---

## 12. RETRY PROFILI

Retry profili sınıfları:

### R1 — Hızlı ama sınırlı retry
Kısa süreli network / transient failure için

### R2 — Kontrollü backoff retry
Provider yoğunluğu / geçici cevaplar için

### R3 — Retry yok
Kesin domain rejection / invalid transition / duplicate-risk alanları için

İlk faz varsayılanı:
- payment initiate: kontrollü
- shipment create: dikkatli/kısıtlı
- email send: kontrollü
- payout submit: ilk fazda sandbox
- callback ingestion: tekrar gönderim olabilir ama owner dedupe yapar

---

## 13. MANUEL MUDAHALE KRITERI

Aşağıdaki durumlarda manuel inceleme açılabilir:
- payment unknown_result uzun süre kapanmıyorsa
- shipment create belirsiz ve provider doğrulaması alınamıyorsa
- payout sonucu çelişkiliyse
- duplicate callback/state uyumsuzluğu varsa
- provider success var ama internal finalization başarısızsa

Manuel müdahale “normal akış” değil, istisna akışıdır.

---

## 14. GÖZLEMLENEBILIRLIK KURALI

Timeout / retry / fallback / reconciliation olaylarında minimum iz:
- request_id
- command_id
- provider_reference
- provider_event_id
- adapter_name
- retry_count
- timeout_class
- final_resolution

Bu olaylar alert/incident üretmeye uygun sınıflandırılmalıdır.

---

## 15. IMPLEMENTASYON ICIN NET KARARLAR

1. Timeout her zaman final failure sayılmaz
2. Retry yalnız retry-safe akışlarda uygulanır
3. Unknown result alanları reconciliation ister
4. Payment unknown_result durumunda otomatik ikinci provider’a geçilmez
5. Shipment tarafında duplicate create riski varsa retry öncesi reconciliation gerekir
6. Email failure ana domain truth’u bozmaz
7. Payout duplicate riski en yüksek alanlardan biridir
8. Duplicate callback second mutation üretmez
9. Manuel inceleme istisna ama resmi state olarak desteklenir
10. Tüm entegrasyonlar ortak normalize sonuç dili kullanır

---

## 16. KISA OZET

Doğru fallback/retry/timeout politikası şudur:

- timeout ile failure aynı şey değildir
- retry kontrollü, idempotent ve state-aware yapılır
- fallback kör şekilde ikinci sağlayıcıya geçmek değildir
- payment ve payout gibi alanlarda unknown_result reconciliation ile kapanır
- shipment ve callback alanlarında duplicate-safe davranış zorunludur
- email gibi yan etkiler ana truth’u geri aldırmaz
- manuel inceleme yalnız istisna durumlar için açılır