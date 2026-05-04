# THIRD_PARTY_PROVIDER_MATRIX

Bu dosya, Aşama 6 kapsamında platformun dış sağlayıcı (3. parti entegrasyon) alanlarını, her entegrasyonun neden gerekli olduğunu, hangi sistemin bu entegrasyonla konuştuğunu ve ilk fazda gerçek / sandbox / park kararını tanımlar.

Amaç:
- dış entegrasyonları sistematik biçimde sınıflandırmak
- hangi sağlayıcının hangi owner alanla konuştuğunu netleştirmek
- ilk fazda gerçekten bağlanacak entegrasyonlarla sandbox/mock veya park edilecek entegrasyonları ayırmak
- implementasyon sırasında gereksiz erken karmaşayı önlemek

Net kural:
- dış sağlayıcı owner truth değildir
- dış sağlayıcı sonucu owner sistem tarafından doğrulanmadan truth mutate edilmiş sayılmaz
- callback/event sonucu duplicate işlenmemelidir
- panel, dış sağlayıcıyı truth owner gibi kullanmaz
- sandbox/park kararı açık yazılmadan entegrasyon başlatılmaz

---

## 1. ENTEGRASYON SINIFLARI

### Z1 — Faz 1 gerçek entegrasyon
İlk canlı çekirdek akış için gereklidir.

### Z2 — Faz 1 sandbox başlangıç
Alan gerçektir, fakat ilk implementasyonda gerçek sağlayıcı yerine sandbox/mock ile başlanır.

### Z3 — Faz 2 / sonraya park
İlk canlı çekirdek akış için zorunlu değildir. Sonraki faza bırakılır.

### Z4 — İç kural / provider yok
Alan ihtiyaçtır, fakat ilk fazda harici provider yerine iç kural/servis mantığıyla yürütülür.

---

## 2. MATRIS

| Entegrasyon Alanı | Sağlayıcı Türü | Bağlanan Sistem | Kullanım Amacı | Truth Etkisi | İlk Faz Kararı |
|---|---|---|---|---|---|
| Ödeme sağlayıcısı (primary) | PSP | Payment | Ana tahsilat akışı | Payment truth’u etkiler; order create hakkı doğurur | Z1 |
| Ödeme sağlayıcısı (secondary-ready) | PSP | Payment | Yedek / geçişe hazır ikinci sağlayıcı | Payment provider abstraction altında hazır tutulur | Z2 |
| Kargo / taşıyıcı sağlayıcısı | Carrier | Shipment / Delivery | Shipment create, tracking, delivered event | Shipment/delivery truth’unu dış olayla besler | Z1 |
| E-posta sağlayıcısı | Transactional email provider | Notification orchestration | Sipariş/iade/destek bilgilendirme | Ana truth değil; yan etki | Z2 |
| Push notification sağlayıcısı | Push provider | Notification orchestration | Mobil push iletimi | Ana truth değil; yan etki | Z3 |
| Payout sağlayıcısı / banka çıkışı | Payout / bank provider | Payout | Settlement sonrası ödeme çıkışı | Payout batch result etkisi | Z2/Z3 |
| Medya işleme / CDN | Media processing / CDN | Media / story / video yüzeyleri | Transcode, asset dağıtımı, medya hazır hale getirme | Media readiness/projection etkisi | Z3 |
| Harici fraud servisi | Fraud/risk provider | Risk / payment guard / payout hold | Risk skoru / fraud sinyali | Tek başına truth owner değil | Z4 |
| E-fatura / e-arşiv sağlayıcısı | Fiscal provider | Finance yan alanı | Resmi belge üretimi | Türev belge etkisi | Z3 |

---

## 3. ENTEGRASYON KARARLARI

### 3.1 Ödeme sağlayıcısı — Primary: PayTR

Tür:
- PSP

Bağlanan owner alan:
- Payment

Karar:
- Faz 1 gerçek entegrasyon
- Primary sağlayıcı: **PayTR**

Neden:
- İlk canlı ticari akış için gerçek ödeme gerekir
- Payment provider sonucu payment truth’u etkiler
- order create ayrıca ve idempotent çalışır

Uygulama kuralı:
- Payment katmanı provider bağımsız abstraction ile kurulacak
- aktif routing ilk fazda PayTR üzerinden çalışacak

---

### 3.2 Ödeme sağlayıcısı — Secondary-ready: iyzico

Tür:
- PSP

Bağlanan owner alan:
- Payment

Karar:
- İlk fazda aktif zorunlu akışın parçası değil
- mimaride hazır tutulacak
- secondary provider: **iyzico**

Neden:
- vendor lock riskini azaltmak
- ileride geçiş veya yedek sağlayıcı ihtiyacında tüm payment katmanını sökmeden devam etmek

Uygulama kuralı:
- tek payment abstraction
- altında en az:
  - paytr adapter
  - iyzico adapter

---

### 3.3 Kargo / taşıyıcı sağlayıcısı

Tür:
- Carrier

Bağlanan owner alan:
- Shipment / Delivery

Karar:
- Faz 1 gerçek entegrasyon
- mimari: **multi-carrier compatible**
- ilk faz aktif gerçek taşıyıcı sayısı: **1**

Neden:
- shipment/tracking/delivered akışı gerçek operasyon için zorunlu
- ama ilk günden çoklu gerçek entegrasyon gereksiz karmaşa yaratır
- doğru yaklaşım: abstraction baştan kur, ilk gerçek doğrulamayı tek taşıyıcı ile yap

Uygulama kuralı:
- tek carrier abstraction olacak
- altına farklı kargo sağlayıcıları adapter olarak eklenebilecek
- ilk canlı fazda yalnız 1 gerçek taşıyıcı aktif olacak

---

### 3.4 E-posta sağlayıcısı

Tür:
- Transactional email provider

Bağlanan alan:
- Notification orchestration

Karar:
- Faz 1 sandbox başlangıç

Neden:
- sipariş, iade, destek gibi akışlarda ileride faydalı olacak
- ama ilk günde gerçek sağlayıcı bağlamak zorunlu değil
- contract ve orchestration mantığı şimdiden kurulmalı

Uygulama kuralı:
- gerçek provider zorunlu değil
- sandbox/mock ile ilerlenebilir
- notification intent ile delivery provider sonucu karıştırılmayacak

---

### 3.5 Push notification sağlayıcısı

Tür:
- Push provider

Bağlanan alan:
- Notification orchestration

Karar:
- Faz 2 / sonraya park

Neden:
- çekirdek ticari akış için bloklayıcı değil
- mobil token/device yönetimi ek iş yükü çıkarır
- ilk fazda gereksiz operasyonel karmaşa üretir

Uygulama kuralı:
- şimdilik gerçek push entegrasyonu yok
- gerekirse sonraki fazda açılır

---

### 3.6 Payout sağlayıcısı / banka çıkışı

Tür:
- Payout provider / bank transfer

Bağlanan owner alan:
- Payout

Karar:
- İlk fazda gerçek provider entegrasyonu yok
- **sandbox / park yaklaşımı**

Neden:
- payout domain modeli ve batch mantığı kurulmalı
- ama gerçek money-out entegrasyonu ilk fazı ağırlaştırmamalı

Uygulama kuralı:
- payout owner modeli kurulacak
- gerçek dış sağlayıcı entegrasyonu sonraki olgunlaşma adımına bırakılacak
- gerekirse sandbox/test akışı kullanılacak

---

### 3.7 Medya işleme / CDN

Tür:
- Media processing / CDN

Bağlanan alan:
- Media / story / video yüzeyleri

Karar:
- Faz 2 / sonraya park

Neden:
- şu an gerçek vendor kullanılmayacak
- çekirdek commerce akışını bloklamıyor
- ilk fazla gereksiz operasyonel yük üretmesin

Uygulama kuralı:
- medya mimarisi provider-bağımsız kurulabilir
- gerçek CDN/media vendor entegrasyonu sonraya bırakılır

---

### 3.8 Harici fraud servisi

Tür:
- Fraud / risk provider

Bağlanan alan:
- Risk / payment guard / payout hold

Karar:
- İç kural ile başla
- harici provider yok

Sınıf:
- Z4 — İç kural / provider yok

Neden:
- ilk fazda ek dış bağımlılık ve maliyet istemiyoruz
- temel risk mantığı internal rule tabanı ile kurulabilir

Uygulama kuralı:
- risk flags / hold / manual review mantığı iç kural ile çalışacak
- mimari ileride harici fraud servis eklenmesine açık kalacak

---

### 3.9 E-fatura / e-arşiv sağlayıcısı

Tür:
- Fiscal document provider

Bağlanan alan:
- Finance yan alanı

Karar:
- Faz 2 / sonraya park

Neden:
- şu an iş yükü çıkarmasın
- ilk çekirdek implementasyonu bloklamasın

Uygulama kuralı:
- alan bilinçli olarak ertelendi
- unutulmuş değil, sonraki faz konusu

---

## 4. ILK FAZ KARAR OZETI

### Faz 1 gerçek entegrasyon
- Payment provider: **PayTR**
- Carrier provider: **1 gerçek taşıyıcı**, ama multi-carrier uyumlu mimari

### Faz 1 sandbox / mock
- iyzico secondary-ready provider
- E-posta sağlayıcısı
- Payout dış sağlayıcı entegrasyonu

### Faz 2 / park
- Push provider
- CDN / medya vendor
- E-fatura / e-arşiv

### İç kural ile yürütülecek
- Fraud / risk

---

## 5. ZORUNLU ORTAK KURALLAR

1. Provider owner truth değildir
2. Payment provider sonucu payment truth’u etkiler; order create ayrıca çalışır
3. Carrier event sonucu shipment/delivery owner alanında normalize edilir
4. Notification provider sonucu ana iş akışını geri aldırmaz
5. Callback/webhook/result ingestion idempotent olmalıdır
6. Multi-provider alanlarda abstraction zorunludur
7. Sandbox ve gerçek provider davranışı ayrı yazılmalıdır
8. Audit kritik entegrasyonlarda zorunludur

---

## 6. DEVAM DOSYALARI ICIN ETKI

Bu matris sonrası daha doğru yazılacak dosyalar:
- `INTEGRATION_BEHAVIOR_RULES.md`
- `FALLBACK_RETRY_TIMEOUT_POLICY.md`
- `SANDBOX_AND_MOCK_PLAN.md`

Çünkü önce:
- ne gerçek
- ne sandbox
- ne park
- ne internal rule
netleştirilmiştir.

---

## 7. KISA OZET

Bu projede ilk faz entegrasyon yaklaşımı şudur:

- ödeme tarafında provider-bağımsız mimari kurulur
- PayTR primary aktif sağlayıcı olur
- iyzico secondary-ready olarak hazır tutulur
- kargo tarafı multi-carrier uyumlu kurulur ama ilk fazda 1 gerçek taşıyıcı aktive edilir
- e-posta sandbox ile başlar
- push park edilir
- fraud iç kuralla yürür
- payout gerçek sağlayıcıya bağlanmaz; sandbox/park yaklaşımı kullanılır
- e-fatura/e-arşiv ve CDN/media gerçek vendor entegrasyonları sonraya bırakılır