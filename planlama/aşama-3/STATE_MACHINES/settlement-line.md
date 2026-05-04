# STATE_MACHINES/settlement-line

Bu dosya, finansal mutabakat / hakediş alanındaki settlement line yaşam döngüsünün kodlama öncesi state machine omurgasını tanımlar.

Net kural:
- tahsil edilen para ile hak edilmiş para aynı şey değildir
- settlement line, ödeme işlemi değildir
- settlement line, payout değildir
- settlement line sipariş/ödeme etkisini kalem bazlı finansal dağıtıma çeviren mutabakat birimidir
- iade/iptal/refund etkileri settlement line üstünde düzeltme üretir

Settlement line, platform, fenomen mağazası, tedarikçi, kupon sponsor etkisi, kargo etkisi ve düzeltme kalemlerinin finansal omurgasını taşır. 

---

## 1. SETTLEMENT LINE SISTEMININ AMACI

Bu sistem şu işleri yapar:

- başarılı ödeme sonrası order etkisini finansal kalemlere ayırmak
- taraf bazlı hakediş/parçalanma üretmek
- pending / blocked / settled / payable ayrımlarını taşımak
- kupon sponsor etkisini doğru tarafa yazmak
- iade/iptal/refund sonrası finansal düzeltme üretmek
- payout sistemine ödenebilir bakiye için doğru giriş üretmek

Bu sistem şu işleri yapmaz:

- tahsilat yapmak
- order oluşturmak
- payout transferini icra etmek
- panelde sade görünürlük dışında nihai ödeme göstergesi üretmek

---

## 2. GIRDISI

Settlement line şu kaynaklardan beslenir:

- successful payment
- order snapshot
- order lines
- price snapshot
- coupon snapshot
- campaign effect snapshot
- shipping effect
- sponsor attribution
- return/refund/cancel düzeltme sinyalleri
- risk/finance hold kararları

Net kural:
Settlement line doğrudan yalnız “toplam sipariş tutarı” ile çalışmaz.
Kalem bazlı finansal parçalanma üretmelidir. :contentReference[oaicite:2]{index=2}

---

## 3. AKTORLER

### 3.1 Platform
Settlement truth owner alanını yönetir.

### 3.2 Finance admin
İnceleme, blokaj, düzeltme ve payout hazırlığı görünürlüğü alır.

### 3.3 Payout sistemi
Ödenebilir duruma gelmiş line/bakiye üstünden çalışır; settlement owner değildir.

### 3.4 Risk sistemi
Hold / review sinyali üretebilir.

### 3.5 Admin / analytics
Projection ve inceleme görünürlüğü alabilir.

---

## 4. SETTLEMENT LINE STATE LISTESI

Önerilen minimum state listesi:

- created
- pending
- blocked
- settled
- payable
- paid_out
- adjusted
- reversed
- closed

İlk faz için güvenli çekirdek:
- created
- pending
- blocked
- settled
- payable
- paid_out
- adjusted

Not:
`settled` ile `payable` ayrı tutulmalıdır.
Her settled line hemen payout’a uygun olmak zorunda değildir.

---

## 5. STATE TANIMLARI

### 5.1 created
Settlement line oluşturulmuştur.
Henüz tüm finansal değerlendirme tamamlanmamış olabilir.

### 5.2 pending
Line finansal olarak oluşmuştur; fakat risk, teslimat, iade penceresi veya iş kuralı nedeniyle kesinleşmemiştir.

### 5.3 blocked
Line veya ilgili bakiye payout/settlement devamı açısından geçici blok altındadır.

### 5.4 settled
Line finansal mutabakat açısından kesinleşmiştir.
Hakediş/düzeltme kalemi artık stabil kabul edilir.

### 5.5 payable
Line payout’a adaydır.
Gerekli hold/uygunluk kontrolleri geçmiştir.

### 5.6 paid_out
Bu line’ın ilgili ödenebilir etkisi payout sistemince gerçek ödeme çıkışına taşınmıştır.

### 5.7 adjusted
Line, iade/iptal/refund, sponsor düzeltmesi veya finansal revizyon nedeniyle düzeltilmiştir.

### 5.8 reversed
Line etkisi tamamen geri alınmıştır.

### 5.9 closed
Line aktif finansal yaşamını tamamlamıştır; tarihsel kayıt olarak kalır.

---

## 6. GECERLI TRANSITION LISTESI

### Oluşum
- created → pending

### Kesinleşme / blokaj
- pending → blocked
- pending → settled
- blocked → pending
- blocked → settled

### Payout’a hazırlık
- settled → payable
- payable → paid_out

### Düzeltme / ters çevirme
- pending → adjusted
- settled → adjusted
- payable → adjusted
- adjusted → settled
- adjusted → payable
- pending → reversed
- settled → reversed
- adjusted → reversed

### Kapanış
- paid_out → closed
- reversed → closed
- settled → closed
  (payout dışı senaryolar varsa)
- adjusted → closed
  (nihai karar sonrası)

---

## 7. YASAK TRANSITION LISTESI

- created → payable
- created → paid_out
- pending → paid_out
- blocked → paid_out
- reversed → payable
- closed → any_active_state

Net kural:
Settlement line payout’a ancak settled/payable zinciriyle gider.
Pending veya blocked line doğrudan payout’a çıkamaz.

---

## 8. FINANSAL PARCALANMA MANTIGI

Bir settlement line en az şu kalem mantıklarını desteklemelidir:

- platform payı
- fenomen hakedişi
- tedarikçi hakedişi
- kupon sponsor etkisi
- kampanya etkisi
- kargo etkisi
- iade/iptal düzeltmesi
- refund düzeltmesi
- manuel finansal düzeltme

Bu nedenle settlement line “tek kazanç alanı” olarak tasarlanamaz. :contentReference[oaicite:3]{index=3}

---

## 9. ORDER / PAYMENT ILE ILISKI

Doğru zincir:
- payment başarılı olur
- order resmi kayıt olur
- settlement line’lar finansal parçalanma olarak oluşur

Net kural:
Payment success, settlement line etkisini başlatır ama settlement line payment değildir.
Order snapshot, settlement line için ana finansal referanslardan biridir.

---

## 10. RETURN / REFUND / CANCEL ILE ILISKI

Aşağıdaki olaylar settlement line’ı değiştirebilir:

- teslimat öncesi iptal
- teslimat sonrası iade
- refund execution
- kısmi refund
- kupon sponsor revizyonu
- kargo maliyet düzeltmesi

Doğru model:
- cancel/return owner kararı üretir
- refund execution financial/payment owner alanında yürür
- settlement line ilgili düzeltmeyi `adjusted` veya `reversed` olarak taşır



---

## 11. PAYOUT ILE ILISKI

Settlement line ile payout aynı şey değildir.

Doğru model:
- settlement line finansal hakedişi ve kesinliği taşır
- payout bu line’ların payable hale gelmiş etkisini gerçek ödeme çıkışına çevirir

Bu nedenle:
- `settled` ≠ `paid_out`
- `payable` ≠ `paid_out`

Payout owner, settlement truth’u oluşturmaz; onu kullanır. :contentReference[oaicite:5]{index=5}

---

## 12. RISK / HOLD ILE ILISKI

Risk ve finance review aşağıdaki durumlarda `blocked` üretebilir:

- anormal payout paterni
- fraud şüphesi
- iade penceresi / delivery riski
- sponsor maliyet uyuşmazlığı
- manuel finans incelemesi

Net kural:
Blok, line’ı yok etmez; payout ve kesinleşme zincirini geçici olarak durdurur.

---

## 13. AUDIT / EVENT NOKTALARI

En az şu event’ler üretilmelidir:

- settlement_line_created
- settlement_line_pending
- settlement_line_blocked
- settlement_line_settled
- settlement_line_payable
- settlement_line_paid_out
- settlement_line_adjusted
- settlement_line_reversed
- settlement_line_closed

Bu event’ler:
- finance dashboards
- payout preparation
- analytics
- audit
alanlarında kullanılabilir.

---

## 14. IDEMPOTENCY KURALI

Aşağıdaki alanlarda duplicate önleme gerekir:

- aynı order line için duplicate settlement create
- aynı refund etkisinin iki kez işlenmesi
- aynı payout bağlamı için settlement paid_out etkisinin iki kez yazılması
- aynı sponsor düzeltmesinin çoğalması

En az şu anahtarlar normalize edilmelidir:
- settlement_line_id
- order_line_id
- settlement_effect_key
- refund_reference
- payout_reference

Bu koruma olmazsa:
- çift hakediş
- yanlış payout
- hatalı finans raporu
- uyumsuz mutabakat
oluşabilir.

---

## 15. KULLANICI / PANEL GORUNURLUGU NOTU

Settlement line’ın tamamı son kullanıcıya açılmaz.

### Kullanıcıya
- doğrudan settlement line görünürlüğü genelde açılmaz

### Fenomen / tedarikçi paneline
- sade gelir / hakediş özeti açılabilir
- tüm platform maliyeti veya karşı taraf detayı açılmaz

### Admin / finance
- detaylı settlement görünürlüğü açılabilir

Net kural:
Projection görünürlüğü, truth’un tamamını herkes için açmaz.

---

## 16. KISA OZET

Doğru settlement line omurgası şudur:

- payment/order sonrası finansal line oluşur
- line pending başlar
- gerekirse blocked olur
- settled hale gelir
- payout için payable olur
- gerçek ödeme çıkışı sonrası paid_out olur
- iade/refund/sponsor etkileri adjusted/reversed üretir

Bu nedenle settlement line, payment ve payout’tan ayrı ama ikisine bağlı finansal truth state machine’idir.