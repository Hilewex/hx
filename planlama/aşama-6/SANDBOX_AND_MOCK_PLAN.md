# SANDBOX_AND_MOCK_PLAN

Bu dosya, Aşama 6 kapsamında platformun dış entegrasyon alanlarında hangi seviyede gerçek entegrasyon, sandbox, mock veya park yaklaşımı kullanılacağını ve bunun geliştirme / test / doğrulama planına nasıl yansıyacağını tanımlar.

Amaç:
- dış sağlayıcı kararlarını uygulama planına çevirmek
- geliştiricilerin hangi alanı gerçek entegrasyonla, hangi alanı sandbox ile, hangi alanı mock ile geliştireceğini netleştirmek
- gerçek entegrasyon olmayan alanlarda bile contract ve state davranışını doğru test etmek
- erken fazda gereksiz operasyonel yükü azaltmak

Net kural:
- sandbox ve mock aynı şey değildir
- sandbox gerçek sağlayıcının test ortamıdır
- mock bizim kontrol ettiğimiz simülasyon ortamıdır
- park edilen alanlar unutulmuş değil, bilinçli ertelenmiştir
- gerçek entegrasyon olmayan alanlarda da contract ve state davranışı yine test edilir

---

## 1. TANIMLAR

### 1.1 Gerçek entegrasyon
Gerçek provider ile gerçek sözleşme üzerinden çalışan entegrasyon.

### 1.2 Sandbox
Provider’ın test ortamı veya gerçek provider davranışına yakın kontrollü dış test alanı.

### 1.3 Mock
Bizim kontrol ettiğimiz sahte/simüle davranış.
Gerçek dış sistem yoktur.
Contract ve state testi için kullanılır.

### 1.4 Park
Alan şu an uygulanmaz.
Ne gerçek entegrasyon ne sandbox ne de aktif mock zorunludur.
Ama karar belgede açıkça tutulur.

---

## 2. ILK FAZ KARAR OZETI

### Gerçek entegrasyon
- Payment primary provider: PayTR
- Carrier: multi-carrier mimari altında 1 gerçek taşıyıcı

### Sandbox
- Email provider
- Payout provider alanı (gerçek provider yok, test/sandbox mantığı)
- Secondary payment provider hazırlığı gerekiyorsa sınırlı sandbox doğrulama

### Mock / internal simulation
- Fraud/risk provider yerine internal rule engine
- bazı medya/CDN akışlarının state simülasyonu
- push için gerekirse sadece contract-level mock

### Park
- Push gerçek entegrasyonu
- CDN / media gerçek vendor entegrasyonu
- E-fatura / e-arşiv sağlayıcısı
- harici fraud provider
- ikinci ve sonraki gerçek taşıyıcı entegrasyonları

---

## 3. ENTEGRASYON BAZLI PLAN

---

## 3.1 Payment planı

### Aktif karar
- PayTR gerçek entegrasyon
- iyzico secondary-ready

### Geliştirme yaklaşımı
- payment abstraction yazılır
- primary adapter gerçek provider ile çalışır
- secondary adapter contract düzeyinde hazırlanır
- secondary için ilk aşamada tam canlı kullanım gerekmez

### Test yaklaşımı
- gerçek provider test ortamı / sandbox varsa kullanılır
- callback, duplicate callback, timeout, reject, pending senaryoları doğrulanır
- order create zinciri gerçek payment sonucu sonrası internal olarak test edilir

### Mock gereksinimi
- provider callback edge case’leri için mock gerekir
- unknown_result / timeout / duplicate event gibi senaryolar mock ile kolay test edilir

### Park edilen taraf
- otomatik aktif provider switching
- iki sağlayıcının aynı anda aktif routing’i

---

## 3.2 Carrier / shipment planı

### Aktif karar
- multi-carrier compatible mimari
- ilk fazda 1 gerçek taşıyıcı aktif

### Geliştirme yaklaşımı
- carrier abstraction yazılır
- ilk gerçek taşıyıcı adapter’ı bağlanır
- diğer taşıyıcılar için adapter slotu bırakılır

### Test yaklaşımı
- shipment create
- tracking fetch
- delivered callback
- duplicate callback
- delayed callback
- manual verification fallback
senaryoları doğrulanır

### Mock gereksinimi
- ikinci ve sonraki taşıyıcılar için mock adapter kullanılabilir
- callback varyasyonları mock ile test edilir

### Park edilen taraf
- çoklu gerçek taşıyıcı operasyonu
- akıllı provider routing
- otomatik taşıyıcı fallback

---

## 3.3 Email planı

### Aktif karar
- sandbox

### Geliştirme yaklaşımı
- notification orchestration email kanalını bilir
- gerçek provider zorunlu değildir
- message intent -> email send attempt akışı kurulur

### Test yaklaşımı
- send accepted
- send failed
- retry
- duplicate suppression
- template binding
senaryoları test edilir

### Mock gereksinimi
- provider response varyasyonları için mock kullanılabilir
- gerçek teslim zorunlu değildir

### Park edilen taraf
- production-grade gerçek delivery analytics
- çoklu email provider fallback

---

## 3.4 Push planı

### Aktif karar
- park

### Geliştirme yaklaşımı
- yalnız channel abstraction veya notification intent tarafında yer bırakılabilir
- gerçek device/token/provider entegrasyonu yapılmaz

### Test yaklaşımı
- zorunlu gerçek push testi yok
- gerekiyorsa contract-level placeholder doğrulama yapılır

### Park edilen taraf
- token management
- device registration
- real push delivery
- provider analytics

---

## 3.5 Payout planı

### Aktif karar
- sandbox / park

### Geliştirme yaklaşımı
- payout domain modeli, batch mantığı ve item state mantığı yazılır
- gerçek bank/payout provider zorunlu değildir
- dış sonucun simülasyonu ile ilerlenebilir

### Test yaklaşımı
- batch create
- partial_failure
- hold
- release
- paid
- duplicate result
senaryoları doğrulanır

### Mock gereksinimi
- payout result callback / reconciliation için mock gereklidir

### Park edilen taraf
- gerçek money-out
- gerçek banka/ödeme çıkışı entegrasyonu
- production-grade provider switching

---

## 3.6 Fraud / risk planı

### Aktif karar
- harici provider yok
- internal rule engine

### Geliştirme yaklaşımı
- risk flags
- manual review / hold / block sinyali
- payment/payout guard ile ilişki
iç sistemde kurulur

### Test yaklaşımı
- block
- hold
- allow
- suspicious repeat pattern
senaryoları test edilir

### Mock gereksinimi
- harici provider gerekmediği için dış mock zorunlu değildir
- iç sinyal üretimi test edilir

### Park edilen taraf
- harici scoring provider
- harici consortium data
- vendor-specific risk APIs

---

## 3.7 Media / CDN planı

### Aktif karar
- gerçek vendor entegrasyonu yok
- park

### Geliştirme yaklaşımı
- upload / processing / ready / published state modeli doğru kurulur
- provider gerçek değilse bile state akışı korunur

### Test yaklaşımı
- uploaded
- processing
- ready
- failed_processing
senaryoları mock ile test edilebilir

### Park edilen taraf
- gerçek CDN
- gerçek transcode pipeline
- global edge distribution

---

## 3.8 E-fatura / e-arşiv planı

### Aktif karar
- sonra

### Geliştirme yaklaşımı
- ilk fazda entegrasyon yazılmaz
- finance tarafında alan bilinçli ertelenmiş kabul edilir

### Test yaklaşımı
- şu an zorunlu değil

### Park edilen taraf
- gerçek fiscal provider
- belge üretim akışı
- resmi entegrasyon yaşam döngüsü

---

## 4. SANDBOX VE MOCK AYRIM KURALI

### Sandbox ne zaman kullanılır?
Aşağıdaki durumda sandbox tercih edilir:
- gerçek provider contract’ını erken doğrulamak istiyorsak
- gerçek provider davranışına yakın test istiyorsak
- callback / request formatı gerçek sisteme benzer kalmalıysa

Örnek:
- payment provider
- email provider

### Mock ne zaman kullanılır?
Aşağıdaki durumda mock tercih edilir:
- edge case üretmek gerekiyorsa
- timeout / duplicate / delayed callback simülasyonu lazımsa
- gerçek provider bağlamadan state test etmek istiyorsak

Örnek:
- duplicate payment callback
- delayed delivery callback
- payout partial failure
- media processing failed

---

## 5. MOCK SENARYO MINIMUM SETI

İlk fazda aşağıdaki minimum mock/sandbox senaryoları bulunmalıdır:

### Payment
- initiate accepted
- provider reject
- callback success
- duplicate callback
- unknown_result
- timeout

### Carrier
- shipment created
- delayed create result
- delivered callback
- duplicate delivered callback
- failed delivery
- manual verification required

### Email
- send accepted
- send failed
- retry success
- retry exhausted

### Payout
- batch paid
- partial failure
- hold
- duplicate result
- reconciliation needed

### Fraud internal
- allow
- hold
- block
- manual review

---

## 6. GELISTIRME SIRASI

İlk faz için önerilen entegrasyon geliştirme sırası:

1. Payment primary provider (gerçek)
2. Carrier abstraction + 1 gerçek taşıyıcı
3. Email sandbox
4. Payout sandbox/internal simulation
5. Secondary payment provider adapter hazırlığı
6. Diğer park alanları için yalnız placeholder/capability tasarımı

Net kural:
Gerçek iş değerini üretmeyen entegrasyonlar ilk sıraya alınmaz.

---

## 7. KABUL KRITERLERI

Bir entegrasyon alanı “hazır” sayılmadan önce:

### Gerçek entegrasyon için
- contract doğrulanmış olmalı
- success/failure/timeout/duplicate senaryosu test edilmiş olmalı
- audit/trace alanları görünür olmalı
- fallback/retry davranışı tanımlı olmalı

### Sandbox için
- request/response sözleşmesi doğrulanmış olmalı
- en az minimum senaryo seti test edilmiş olmalı

### Mock için
- happy path dışında edge case’ler bulunmalı
- state transition testi yapılmış olmalı

### Park için
- park kararı açık yazılmış olmalı
- unutulmuş alan gibi bırakılmamalı

---

## 8. RISK AZALTMA KURALI

Bu planın temel amacı:
- tüm sağlayıcıları ilk günde bağlamamak
- ama mimariyi geleceğe kapatmamak

Bu yüzden:
- abstraction önce kurulur
- gerçek aktif entegrasyon sayısı düşük tutulur
- sandbox/mock ile kontrat ve edge case test edilir
- sonraki sağlayıcılar aynı omurgaya eklenir

---

## 9. IMPLEMENTASYON ICIN NET KARARLAR

1. Payment primary gerçek entegrasyonla başlar
2. Secondary payment adapter hazır tutulur
3. Carrier mimarisi multi-carrier uyumlu kurulur
4. İlk fazda 1 gerçek taşıyıcı bağlanır
5. Email sandbox ile ilerler
6. Push park edilir
7. Payout gerçek provider olmadan domain/sandbox seviyesinde ilerler
8. Fraud iç kural ile çalışır
9. Media/CDN ve e-fatura/e-arşiv sonraya bırakılır
10. Mock ve sandbox karıştırılmaz

---

## 10. KISA OZET

Doğru sandbox/mock planı şudur:

- gerçekten gerekli entegrasyonlar gerçek bağlanır
- iş yükü artıracak ama bloklayıcı olmayanlar sandbox ile başlar
- bazı alanlar bilinçli olarak park edilir
- mock ile edge case ve state davranışı test edilir
- abstraction kurularak sonraki entegrasyonların yükü azaltılır