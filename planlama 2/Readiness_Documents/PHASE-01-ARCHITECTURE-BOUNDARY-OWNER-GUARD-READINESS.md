# PHASE-01-ARCHITECTURE-BOUNDARY-OWNER-GUARD-READINESS.md

## 1. Fazın Amacı

Bu fazın amacı, production-readiness domain çalışmalarına geçmeden önce Hedihup platformunun anayasal mimari sınırlarını doğrulamak ve riskli owner / guard / permission / transition ihlallerini erken kapatmaktır.

Bu faz, yeni feature üretme fazı değildir.

Bu fazın ana hedefi:

```text
Kodlanmış foundation ve hardening hattının owner-boundary-safe olduğunu production-readiness öncesinde doğrulamak.
```

Bu faz kapanmadan PHASE-02 Commerce Core Readiness ve PHASE-03 Payment / Provider / Callback / Reconciliation Readiness fazlarına geçilmemelidir.

---

## 2. Fazın Kapsamı

Bu faz aşağıdaki alanları kapsar:

- owner boundary kontrolü
- BFF write / truth owner riski kontrolü
- panel direct write riski kontrolü
- UI truth üretimi riski kontrolü
- event / audit / outbox business mutation yerine geçiyor mu kontrolü
- permission / eligibility ayrımı kontrolü
- guard zinciri kontrolü
- transition policy kritik ayrımları kontrolü
- legacy actor context / `x-actor-id` kalıntıları kontrolü
- protected action kapsamı kontrolü
- cross-service public package boundary kontrolü
- source review ve boundary review planı

---

## 3. Fazın Kapsam Dışı Alanları

Bu fazda yapılmayacak işler:

- yeni domain feature açmak
- ödeme provider canlı entegrasyonu yapmak
- order handoff implementasyonu yapmak
- finance / settlement / payout mutation yazmak
- frontend UI geliştirmek
- full production deploy yapmak
- full critical journey acceptance çalıştırmak

Bu fazın işi:

```text
Önce sınırları doğrulamak, sonra domain fazlarına güvenli geçmek.
```

---

## 4. Referans Sistem Dosyaları

Bu fazın ana sistem referansları:

- `25-kural -yetki sistemi.md`
- `OWNER_MATRIX.md`
- `GUARD_MATRIX.md`
- `PERMISSION_MATRIX.md`
- `TRANSITION_POLICIES.md`
- `ADMIN SİSTEMİ`
- `FENOMEN MAĞAZA YÖNETİM PANELİ SİSTEMİ`
- `TEDARİKÇİ PANEL SİSTEMİ`
- `FRAUD / RİSK / ABUSE SİSTEMİ`
- `FİNANSAL MUTABAKAT / HAKEDİŞ SİSTEMİ`
- `PAYOUT / ÖDEME ÇIKIŞ SİSTEMİ`
- `ÖDEME SİSTEMİ`
- `SİPARİŞ SİSTEMİ`
- `DESTEK TICKET OPERASYON SİSTEMİ`
- `ARKA PLAN ANALİTİK / ÖLÇÜMLEME SİSTEMİ`

Bu faz tüm sistemleri etkiler; ancak yukarıdaki dosyalar boundary ve governance açısından doğrudan ana referanstır.

---

## 5. Referans Kayıt Dosyaları

Bu fazda özellikle şu kayıtlar dikkate alınır:

- `63-IMPLEMENTATION_PROGRESS_MASTER_BIRLESTIRILMIS.md`
- `64-PACKAGE_EXECUTION_LOG_BIRLESTIRILMIS.md`
- `65-ACTIVE_RISKS_AND_DECISIONS-CONSOLIDATED.md`
- `HARDENING-00-05E-CONSOLIDATED-REFERENCE-RECORD.md`
- `HARDENING-06-07-CONSOLIDATED-REFERENCE-RECORD.md`
- `HARDENING-08-09-CONSOLIDATED-REFERENCE-RECORD.md`
- `HARDENING-10-CALLBACK-DECISION-INDEX.md`
- `HARDENING-10-CALLBACK-MASTER-REFERENCE.md`
- `HARDENING-10C10 — PayTR Status Inquiry / Payment Reconciliation Birleşik Referans Dosyası`
- `PX_DOMAIN_IMPLEMENTATION_REFERENCE_RECORD.md`

---

## 6. Önceden Yapılmış İşler

### 6.1 Access / Permission / Protected Action Foundation

Kayıtlara göre:

- P06 — Access / Permission / Scope Foundation — PASS
- P07 — Protected Action Foundation — PASS

Bu foundation, permission ve protected action altyapısının kurulduğunu gösterir.

### 6.2 HARDENING-05 Hattı

HARDENING-05 hattında:

- auth/session/actor context foundation
- permission guard integration
- panel/admin/creator route protection
- social action permission enforcement
- commerce permission enforcement source-reconciled closure

çalışılmıştır.

### 6.3 65 Aktif Kararları

Aktif karar kayıtlarında owner boundary anayasal olarak sabitlenmiştir:

- owner dışı write yok
- BFF read-only / delegation
- UI truth üretmez
- panel direct write yapmaz
- projection truth değildir
- Redis owner truth değildir
- event owner state mutation yerine geçmez

### 6.4 HARDENING-10 / 10C10 Boundary Kararları

Callback ve reconciliation hattında özellikle şu sınırlar korunmuştur:

- provider callback business truth değildir
- callback record owner state mutation değildir
- BFF truth owner değildir
- event/audit/outbox business mutation değildir
- payment succeeded order created değildir
- payment mutation yalnız payment owner domain içinde olabilir
- order handoff 10C10 kapsamı dışında bırakılmıştır

### 6.5 PX Domain Boundary Kayıtları

PX kayıtları genel olarak BFF delegation ve domain service boundary çizgisini korumuştur. Ancak PX-HAVUZ-05 PARTIAL olduğu için bu fazda owner boundary açısından da ayrıca dikkat edilmelidir.

---

## 7. Önceden Ertelenmiş / Sınırlı Bırakılmış İşler

Bu faz açısından izlenecek limitation’lar:

1. Bazı eski BFF route ailelerinde legacy `x-actor-id` kullanımı veya actor context simülasyonu kalmış olabilir.
2. Bazı paketlerde in-memory store kullanımı devam edebilir.
3. Panel/admin/creator route protection yapılmış olsa da tüm panel action’larının protected command modeline uygunluğu source review ister.
4. Event/audit/outbox altyapısı vardır; ancak bunların business truth yerine geçmediği her domainde korunmalıdır.
5. Cross-service public package boundary bazı erken paketlerde tekrar kontrol edilmelidir.
6. PX-HAVUZ-05 PARTIAL nedeniyle creator-store commercial product binding hattı hem build hem boundary açısından doğrulanmalıdır.

---

## 8. Bu Fazda Yapılacak İşler

### 8.1 Owner Boundary Source Review

Kontrol edilecek:

- BFF herhangi bir truth state mutate ediyor mu?
- apps/web veya apps/panel domain truth üretiyor mu?
- servisler kendi owner alanı dışına write yapıyor mu?
- finance truth finance owner dışında mutate ediliyor mu?
- order truth payment veya BFF tarafından yaratılıyor mu?
- payment owner order/finance/risk mutation yapıyor mu?
- event/audit/outbox business state mutation yerine kullanılıyor mu?

Beklenen sonuç:

```text
Owner dışı write bulunmamalıdır.
```

### 8.2 BFF Read-only / Delegation Kontrolü

Kontrol edilecek:

- BFF yalnız validation / delegation / response composition yapıyor mu?
- BFF doğrudan repository veya owner dışı store mutate ediyor mu?
- BFF eligibility hesaplıyor mu, yoksa owner domain’e delegate ediyor mu?
- BFF financial state üretiyor mu?

Beklenen sonuç:

```text
BFF truth owner değildir.
```

### 8.3 Panel Direct Write Kontrolü

Kontrol edilecek:

- Admin panel doğrudan DB/state write yapıyor mu?
- Creator panel kendi scope’u dışında mutation yapıyor mu?
- Supplier panel ticari fiyat/kampanya/approval truth’una doğrudan yazıyor mu?
- Finance panel payout/settlement mutation’ı protected finance command dışında yapıyor mu?

Beklenen sonuç:

```text
Panel direct write yoktur.
Panel yalnız protected owner command başlatır.
```

### 8.4 UI Truth Üretimi Kontrolü

Kontrol edilecek:

- web/panel UI permission truth hesaplıyor mu?
- UI checkout/payment/order state üretiyor mu?
- UI price/stock final truth üretiyor mu?
- UI moderation/risk sonucu üretiyor mu?

Beklenen sonuç:

```text
UI truth üretmez.
```

### 8.5 Permission / Eligibility Ayrımı Kontrolü

Kontrol edilecek kritik ayrımlar:

- auth sahibi olmak review hakkı değildir
- auth sahibi olmak user product story hakkı değildir
- guest checkout sosyal hak açmaz
- permission verilmesi owner truth write hakkı değildir
- creator role, her mağaza ürününe müdahale hakkı değildir
- supplier role, satış fiyatı veya kampanya açma hakkı değildir
- admin permission, owner dışı direct write hakkı değildir

Beklenen sonuç:

```text
Permission ve eligibility karıştırılmamalıdır.
```

### 8.6 Guard Zinciri Kontrolü

Kontrol edilecek guard katmanları:

- authentication guard
- role / scope guard
- ownership guard
- eligibility guard
- state / lifecycle guard
- risk / moderation / financial block guard
- idempotency / replay guard

Her aksiyon tüm guard’ları gerektirmez. Ancak kritik ticari / finansal / panel / provider aksiyonlarda gerekli guard zinciri bulunmalıdır.

### 8.7 Transition Policy Kontrolü

Kontrol edilecek kritik ayrımlar:

- checkout ≠ payment
- payment succeeded ≠ order created
- delivered ≠ review/story written
- return approved ≠ refund completed
- refund completed ≠ settlement adjusted
- settled ≠ payable
- payable ≠ paid_out
- event emitted ≠ owner state mutated

Beklenen sonuç:

```text
Transition ayrımları gevşetilmemelidir.
```

### 8.8 Legacy Actor Context Kontrolü

Kontrol edilecek:

- `x-actor-id`
- body actor spoof riski
- query/body recipient spoof riski
- actor context’in BFF veya client tarafından serbest taşınması
- service layer’da actor guard eksikliği

Beklenen sonuç:

```text
Actor context merkezi ve guard’lı olmalıdır.
```

### 8.9 Public Package Boundary Kontrolü

Kontrol edilecek:

- cross-service `src/*` import var mı?
- servisler public package export üzerinden mi konuşuyor?
- test/smoke dosyalarında owner dışı internal path kullanımı production path’e sızıyor mu?

Beklenen sonuç:

```text
Public package boundary korunmalıdır.
```

---

## 9. Bu Fazda Yapılmayacak İşler

Bu fazda şu işler yapılmayacaktır:

- Payment handoff implementasyonu
- PayTR canlı entegrasyonu
- Commerce core düzeltmeleri
- PX-HAVUZ-05 build fix
- Finance/payout implementation
- Frontend UI geliştirme
- Risk/fraud scoring implementation

Bu işler ilgili fazlara devredilir.

---

## 10. Owner / Guard / Permission Kuralları

Bu fazda bağlayıcı kurallar:

### 10.1 Owner Kuralları

- Auth/session/access owner M1
- Commerce truth owner M2
- Content truth owner M3
- Social truth owner M4
- Financial truth owner M6
- BFF aggregation owner M7 ama truth owner değildir
- Ranking owner M8
- Search intent/candidate owner M9

### 10.2 Guard Kuralları

- Auth guard tek başına yeterli değildir
- Role/scope guard gerekli alanlarda zorunludur
- Ownership guard owner dışı write’ı engeller
- Eligibility guard delivered/review/story/return gibi hakları belirler
- State/lifecycle guard yanlış transition’ı engeller
- Risk/financial/moderation block guard kritik aksiyonlarda çalışır
- Idempotency/replay guard duplicate etkileri engeller

### 10.3 Permission Kuralları

- Permission role değildir
- Permission eligibility değildir
- Permission owner write hakkı değildir
- Admin permission sınırsız yetki değildir
- Guest checkout sosyal write izni değildir

### 10.4 Transition Kuralları

- State transition basit status update değildir
- Her transition ilgili owner alanında çalışır
- Guard zinciri olmadan state mutation yapılmaz
- Audit/event transition’ın kendisi değildir

---

## 11. Riskler

### 11.1 RB-011 — Owner boundary kritik ihlal taraması tamamlanmadı

Bu fazın ana release blocker’ı RB-011’dir.

Kapanış için:

- BFF write taraması
- Panel direct write taraması
- UI truth taraması
- Event/audit/outbox mutation taraması
- Cross-service boundary taraması

yapılmalıdır.

### 11.2 Legacy Actor Context Riski

Bazı eski smoke/paketlerde `x-actor-id` veya benzeri actor context simülasyonları kullanılmış olabilir. Production-readiness öncesi client-supplied actor spoof riski kapatılmalıdır.

### 11.3 Panel Direct Write Riski

Admin/creator/supplier panel yüzeyleri arttıkça panel direct write riski büyür. Bu fazda korunmazsa PHASE-08’de yönetilemez hale gelebilir.

### 11.4 Permission / Eligibility Karışma Riski

Review/story/return/payout/point gibi haklar sadece permission ile açılırsa sistem yanlış kullanıcı hakkı üretebilir.

### 11.5 Event / Outbox Truth Riski

HARDENING-08 ve 10C10 sonrası event/outbox evidence artmıştır. Bu yapı business truth veya order command yerine geçmemelidir.

---

## 12. Kabul Kriterleri

PHASE-01 kapanışı için minimum kabul kriterleri:

1. Owner boundary source review yapılmış olmalı
2. BFF write/truth owner riski kontrol edilmeli
3. Panel direct write riski kontrol edilmeli
4. UI truth üretimi riski kontrol edilmeli
5. Event/audit/outbox business mutation yerine geçiyor mu kontrol edilmeli
6. Permission / eligibility ayrımı doğrulanmalı
7. Transition policy kritik ayrımları korunmalı
8. Legacy actor context riski kayıt altına alınmalı veya kapatılmalı
9. Public package boundary kontrol edilmeli
10. RB-011 için karar verilmeli:
    - CLOSED
    - veya PARTIAL / devam eden açık borç

---

## 13. Test / Smoke / Runtime Kanıtları

Bu faz ağırlıklı olarak source/boundary review fazıdır.

Kod değişikliği yapılmazsa minimum kanıt:

- source review notları
- boundary review notları
- dosya/path tarama sonucu
- risk register güncellemesi
- release blocker register güncellemesi

Kod değişikliği yapılırsa ek olarak:

- `pnpm run typecheck`
- `pnpm run build`
- ilgili targeted smoke
- ilgili route/guard smoke

çalıştırılmalıdır.

Risk bazlı test yaklaşımı geçerlidir. Bu fazda full smoke veya full critical journey acceptance zorunlu değildir.

---

## 14. Kapanış Kontrol Listesi

```text
[ ] Owner boundary source review tamamlandı
[ ] BFF write/truth owner taraması yapıldı
[ ] Panel direct write taraması yapıldı
[ ] UI truth üretimi taraması yapıldı
[ ] Event/audit/outbox truth yerine geçme riski kontrol edildi
[ ] Permission / eligibility ayrımı kontrol edildi
[ ] Guard zinciri kritik alanlarda kontrol edildi
[ ] Transition ayrımları kontrol edildi
[ ] Legacy actor context / x-actor-id riski kontrol edildi
[ ] Public package boundary kontrol edildi
[ ] RB-011 durumu güncellendi
[ ] 04 risk register güncellendi
[ ] 09 release blocker register güncellendi
[ ] Faz kapanış raporu üretildi
```

---

## 15. Faz Sonu Kararı İçin Beklenen Sonuç

Bu faz için ideal karar:

```text
PASS
```

Ancak aşağıdaki durumlarda karar değişir:

### PASS WITH LIMITATION

- Kritik owner ihlali yoktur
- Bazı legacy actor/header veya monitored limitation sonraki faza bilinçli devredilir

### PARTIAL

- Bazı taramalar yapılmıştır ama owner boundary review tamamlanmamıştır
- BFF/panel/UI alanlarında doğrulanmamış kritik bölümler kalmıştır

### FAIL

- Owner dışı write tespit edilmiştir
- BFF truth owner gibi davranmaktadır
- Panel direct write yapmaktadır
- Event/outbox state mutation yerine kullanılmaktadır
- Kritik transition ayrımı bozulmuştur

---

## 16. Sonraki Faza Devredenler

PHASE-01 başarıyla kapanırsa PHASE-02’ye devredilecekler:

- PX-HAVUZ-05 build borcu
- Commerce core source/runtime kontrolü
- Stock/price/snapshot validation
- Kupon/kampanya commerce etkisi

PHASE-03’e devredilecekler:

- Canlı PayTR / sandbox provider doğrulaması
- Reconciliation production runtime
- Payment succeeded → order handoff inventory
- ProviderReference uniqueness riski
- Expected amount/currency reconciliation source kararı

PHASE-08’e devredilecekler:

- Admin/creator/supplier panel action detayları
- Support/moderation/risk panel queue detayları

---

## 17. Nihai Faz Açılış Kararı

PHASE-01 şu şartla başlatılabilir:

```text
PHASE-00 PASS WITH LIMITATION olarak kabul edilmiş olmalı.
```

PHASE-01’in hedef kararı:

```text
Owner-boundary-safe production-readiness çalışma zemini oluşturmak.
```

Net açılış kararı:

```text
GO — PHASE-01 Architecture Boundary / Owner / Guard Readiness başlatılabilir.
```
