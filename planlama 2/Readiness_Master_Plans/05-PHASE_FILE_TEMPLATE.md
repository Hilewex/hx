# 05-PHASE_FILE_TEMPLATE.md

## 1. Dosyanın Amacı

Bu dosya, Hedihup production-readiness sürecinde açılacak her faz dosyasının standart yapısını tanımlar.

Amaç, her fazın aynı disiplinle hazırlanmasını, sistem dosyaları ile kayıt dosyalarının birlikte okunmasını, yapılmış işler ile yapılacak işlerin karıştırılmamasını ve faz kapanışlarının kanıtlı yürütülmesini sağlamaktır.

Bu dosya bir faz planı değildir.

Bu dosya, bütün faz planları için kullanılacak zorunlu şablondur.

---

## 2. Kullanım Kuralı

Her yeni faz dosyası bu şablona göre hazırlanacaktır.

Bir faz dosyası açılmadan önce:

- ilgili sistem dosyaları belirlenir
- ilgili kayıt dosyaları belirlenir
- daha önce yapılmış işler ayrılır
- daha önce ertelenmiş veya sınırlı bırakılmış işler ayrılır
- eksikler belirlenir
- riskler belirlenir
- owner / guard / permission / transition etkisi kontrol edilir
- fazın kapanış kriterleri yazılır

Net kural:

```text
Faz dosyası = yapılacaklar listesi değildir.
Faz dosyası = hedef sistem + mevcut kayıt + eksik + risk + kabul kriteri + kapanış şartı belgesidir.
```

---

## 3. Faz Dosyası İsimlendirme Standardı

Her faz dosyası aşağıdaki formatla adlandırılır:

```text
PHASE-XX-FAZ-ADI.md
```

Örnek:

```text
PHASE-00-BASELINE-MAPPING-AND-RULE-LOCK.md
PHASE-01-ARCHITECTURE-BOUNDARY-READINESS.md
PHASE-02-COMMERCE-CORE-READINESS.md
PHASE-03-PAYMENT-PROVIDER-CALLBACK-READINESS.md
```

Kapanış raporu ayrı dosyada tutulur:

```text
PHASE-XX-CLOSURE-REPORT.md
```

---

## 4. Faz Dosyası Zorunlu Başlıkları

Her faz dosyası aşağıdaki başlıkları eksiksiz taşımalıdır.

---

# PHASE-XX — FAZ ADI

## 1. Fazın Amacı

Bu bölümde fazın neden açıldığı ve neyi kapatacağı yazılır.

Açık ve sınırlı olmalıdır.

Şunlar belirtilir:

- faz hangi ana problemi çözer
- faz hangi production-readiness boşluğunu kapatır
- faz hangi sistem alanlarını yayına hazırlık seviyesine taşır
- fazın sonunda hangi kararın verilebilmesi beklenir

Örnek:

```text
Bu fazın amacı, payment provider callback ve reconciliation hattını order handoff öncesi production-readiness sınırlarına göre doğrulamak, canlı provider entegrasyonu ve order handoff için açık blocker’ları netleştirmektir.
```

---

## 2. Fazın Kapsamı

Bu bölümde fazın içine giren sistem alanları yazılır.

Kapsam maddeleri net olmalıdır.

Örnek:

```text
Bu fazın kapsamı:

- ödeme sistemi
- provider callback hattı
- PayTR status inquiry / reconciliation kayıtları
- payment owner transition guard’ları
- order handoff öncesi eligibility ve idempotency kararları
```

---

## 3. Referans Sistem Dosyaları

Bu bölümde fazın dayandığı sistem dosyaları listelenir.

Her dosya yanında neden referans olduğu kısa yazılır.

Format:

```text
- `15-ödeme sistemi.md` — payment lifecycle, unknown-result ve başarılı ödeme sınırları için
- `16-sipariş sistemi.md` — payment sonrası order create ayrımı için
- `47-finansal mutabakat hakediş sistemi.md` — payment sonrası finansal dağıtımın ödeme ile karıştırılmaması için
- `54-payout ödeme çıkış sistemi.md` — payable / paid_out ayrımı için
```

Net kural:

Sistem dosyası belirtilmeden faz kapsamı kesinleşmiş sayılmaz.

---

## 4. Referans Kayıt Dosyaları

Bu bölümde fazın dayandığı uygulama / hardening / risk kayıtları listelenir.

Format:

```text
- `63-IMPLEMENTATION_PROGRESS_MASTER_BIRLESTIRILMIS.md` — güncel resmi yürütme durumu
- `64-PACKAGE_EXECUTION_LOG_BIRLESTIRILMIS.md` — paket bazlı yapılan işler
- `65-ACTIVE_RISKS_AND_DECISIONS-CONSOLIDATED.md` — aktif risk ve kararlar
- `HARDENING-10-CALLBACK-MASTER-REFERENCE.md` — callback hattı kayıtları
- `HARDENING-10C10 — PayTR Status Inquiry / Payment Reconciliation Birleşik Referans Dosyası` — reconciliation son durum kayıtları
```

Net kural:

Kayıt dosyası karşılığı olmayan “yapıldı” iddiası bu fazda kabul edilmez.

---

## 5. Önceden Yapılmış İşler

Bu bölümde kayıt dosyalarına göre daha önce tamamlanmış işler yazılır.

Her madde mümkün olduğunca paket / kayıt karşılığı ile yazılmalıdır.

Format:

```text
- P13 Payment Initiation Foundation — PASS WITH LIMITATION
- P14 Payment → Order Foundation — PASS
- HARDENING-10C10-07 Controlled Reconciliation Payment Mutation — PASS WITH LIMITATION
- HARDENING-10C10-09 Reconciliation Audit/Outbox + Task Finalization Guard — PASS WITH LIMITATION
```

Bu bölümde yalnız gerçekten kayıtlarda bulunan işler yazılır.

---

## 6. Önceden Ertelenmiş / Sınırlı Bırakılmış İşler

Bu bölümde daha önce PASS WITH LIMITATION, PARTIAL veya açık risk olarak devreden işler yazılır.

Örnek:

```text
- PayTR live/sandbox gerçek request hâlâ yoktur.
- Reconciliation otomatik scheduler/queue ile çalışmaz.
- Controlled mutation production runtime’a bağlanmamıştır.
- Order handoff hâlâ açılmamıştır.
- Outbox event delivery guarantee veya consumer/worker bu faz öncesinde tamamlanmamıştır.
```

Net kural:

Limitation gizlenmez.

Bir limitation, faz içinde kapatılacaksa “Bu Fazda Yapılacak İşler” bölümüne alınır.

Bir limitation bilinçli devredecekse “Sonraki Faza Devredenler” bölümünde tekrar yazılır.

---

## 7. Bu Fazda Yapılacak İşler

Bu bölümde fazda yapılacak işler net, ölçülebilir ve kapsamlı yazılır.

Her madde aksiyon odaklı olmalıdır.

Format:

```text
1. Payment succeeded sonrası order handoff için inventory ve boundary review yapılacak.
2. Order owner’ın kabul edeceği command / trigger modeli netleştirilecek.
3. Duplicate order üretimini engelleyecek idempotency key modeli belirlenecek.
4. Risk hold varsa order handoff’un durup durmayacağı karara bağlanacak.
5. Payment reconciliation completed event’inin doğrudan order create tetiklemeyeceği garanti altına alınacak.
```

Net kural:

Bu bölümde yazılmayan iş faz kapsamında yapılmış sayılmaz.

---

## 8. Bu Fazda Yapılmayacak İşler

Bu bölüm scope creep’i engellemek için zorunludur.

Fazın dışında kalan işler açıkça yazılır.

Örnek:

```text
Bu fazda yapılmayacaklar:

- payout icrası
- settlement hesaplama
- production dashboard
- full mobile UI redesign
- kapsam dışı yeni kampanya modeli
```

Net kural:

Kapsam dışı iş faz içinde sessizce açılmaz.

Yeni ihtiyaç çıkarsa risk / devreden iş olarak kaydedilir.

---

## 9. Owner / Guard / Permission / Transition Kuralları

Bu bölümde faz boyunca kırılmayacak mimari sınırlar yazılır.

Minimum kontrol alanları:

- owner dışı write var mı?
- BFF truth owner gibi davranıyor mu?
- panel direct write yapıyor mu?
- UI truth üretiyor mu?
- event state mutation yerine geçiyor mu?
- permission ile eligibility karışıyor mu?
- state transition doğru owner’da mı?
- duplicate/idempotency guard gerekli mi?

Örnek:

```text
Bu fazda korunacak sınırlar:

- Payment owner yalnız payment sonucunu mutate eder.
- Order owner order create kararını kendi command path’iyle işler.
- Payment succeeded order created değildir.
- Event veya outbox kaydı tek başına order create sebebi değildir.
- BFF handoff yapabilir; truth mutate edemez.
```

---

## 10. Riskler

Bu bölümde faza özgü riskler yazılır.

Riskler üç sınıfa ayrılır:

### 10.1 Release blocker

Yayına çıkışı engelleyebilecek riskler.

### 10.2 Production-readiness debt

Yayına hazırlık için kapanması gereken ama tek başına hemen blocker olmayabilecek borçlar.

### 10.3 Monitored limitation

Bilinçli izlenecek sınırlamalar.

Format:

```text
| Risk | Tür | Etki | Aksiyon |
|---|---|---|---|
| Payment succeeded sonrası duplicate order riski | Release blocker | Finansal ve operasyonel çift kayıt | Order handoff idempotency modeli zorunlu |
```

---

## 11. Kabul Kriterleri

Bu bölümde fazın PASS kapanabilmesi için gerekli şartlar yazılır.

Her kabul kriteri ölçülebilir olmalıdır.

Format:

```text
- Faz kapsamındaki tüm sistem dosyaları kontrol edildi.
- İlgili kayıt dosyalarındaki yapılmış işler ayrıştırıldı.
- Owner boundary ihlali bulunmadı veya düzeltilmek üzere blocker kaydedildi.
- Faz kapsamındaki açık riskler sınıflandırıldı.
- Kod etkisi varsa gerekli minimum test / smoke / typecheck kanıtı alındı.
- Kapanış raporu üretildi.
```

Net kural:

Happy path tek başına kabul kriteri değildir.

Fail case, rollback/retry, idempotency veya audit etkisi gerekiyorsa kabul kriterine yazılır.

---

## 12. Test / Smoke / Runtime Kanıtları

Bu bölümde fazın niteliğine göre test veya kontrol seviyesi yazılır.

Test yaklaşımı risk bazlıdır.

### 12.1 Planlama / mapping fazları

Kod etkisi yoksa test gerekmez.

Gerekli kanıtlar:

- kaynak dosya kontrolü
- mapping kontrolü
- risk sınıflandırması
- kapanış checklist’i

### 12.2 Kod etkisi olan standart fazlar

Minimum kanıtlar:

- source review
- boundary review
- gerekiyorsa `pnpm run typecheck`
- gerekiyorsa `pnpm run build`
- ilgili targeted smoke/test

### 12.3 Kritik finansal / provider / order fazları

Güçlendirilmiş kanıtlar:

- idempotency testi
- duplicate testi
- fail case testi
- unknown-result / retry / reconciliation testi
- audit / outbox evidence kontrolü
- no owner-boundary breach kontrolü

Net kural:

Her küçük işte tam test yoktur.

Faz kapanışında yeterli ve riskle orantılı kanıt vardır.

---

## 13. Kapanış Kontrol Listesi

Her faz sonunda aşağıdaki liste doldurulur.

```text
[ ] Referans sistem dosyaları kontrol edildi.
[ ] Referans kayıt dosyaları kontrol edildi.
[ ] Önceden yapılmış işler ayrıldı.
[ ] Ertelenmiş / sınırlı işler ayrıldı.
[ ] Bu fazda yapılacak işler tamamlandı.
[ ] Kapsam dışına çıkılmadı.
[ ] Owner boundary kontrol edildi.
[ ] Guard / permission / eligibility etkisi kontrol edildi.
[ ] Transition / state etkisi kontrol edildi.
[ ] Riskler sınıflandırıldı.
[ ] Gerekli test / smoke / runtime kanıtı alındı veya neden gerekmediği yazıldı.
[ ] Release blocker kaldıysa açıkça yazıldı.
[ ] Faz kapanış kararı verildi.
[ ] Sonraki faza devredenler yazıldı.
```

---

## 14. Faz Sonu Kararı

Her faz yalnız aşağıdaki kararlardan biriyle kapanır.

### PASS

Faz kapsamı tamamlandı.

Gerekli kanıtlar var.

Sonraki faza geçişi engelleyen blocker yok.

### PASS WITH LIMITATION

Fazın ana amacı tamamlandı.

Bilinçli devreden limitation var.

Limitation açıkça kaydedildi.

### PARTIAL

Fazda bazı işler yapıldı; ancak ana amaç tam kapanmadı.

Sonraki faza geçiş riskli olabilir.

### FAIL

Faz hedefi kapanmadı.

Kritik blocker var.

Faz kapatılamaz.

---

## 15. Sonraki Faza Devredenler

Bu bölümde faz sonunda kapanmayan ama bilinçli olarak sonraki faza taşınan maddeler yazılır.

Format:

```text
| Devreden İş | Neden Kapanmadı | Hangi Faza Devredildi | Risk Türü |
|---|---|---|---|
| PayTR live request | Bu faz simulation / boundary fazıydı | PHASE-03 | Release blocker |
```

Net kural:

Devreden iş gizlenmez.

Devreden işin fazı ve riski yazılır.

---

## 16. Faz Dosyası Standart Boş Şablonu

Aşağıdaki blok yeni faz oluştururken doğrudan kullanılabilir.

```markdown
# PHASE-XX — FAZ ADI

## 1. Fazın Amacı


## 2. Fazın Kapsamı


## 3. Referans Sistem Dosyaları


## 4. Referans Kayıt Dosyaları


## 5. Önceden Yapılmış İşler


## 6. Önceden Ertelenmiş / Sınırlı Bırakılmış İşler


## 7. Bu Fazda Yapılacak İşler


## 8. Bu Fazda Yapılmayacak İşler


## 9. Owner / Guard / Permission / Transition Kuralları


## 10. Riskler

### 10.1 Release Blocker


### 10.2 Production-Readiness Debt


### 10.3 Monitored Limitation


## 11. Kabul Kriterleri


## 12. Test / Smoke / Runtime Kanıtları


## 13. Kapanış Kontrol Listesi

```text
[ ] Referans sistem dosyaları kontrol edildi.
[ ] Referans kayıt dosyaları kontrol edildi.
[ ] Önceden yapılmış işler ayrıldı.
[ ] Ertelenmiş / sınırlı işler ayrıldı.
[ ] Bu fazda yapılacak işler tamamlandı.
[ ] Kapsam dışına çıkılmadı.
[ ] Owner boundary kontrol edildi.
[ ] Guard / permission / eligibility etkisi kontrol edildi.
[ ] Transition / state etkisi kontrol edildi.
[ ] Riskler sınıflandırıldı.
[ ] Gerekli test / smoke / runtime kanıtı alındı veya neden gerekmediği yazıldı.
[ ] Release blocker kaldıysa açıkça yazıldı.
[ ] Faz kapanış kararı verildi.
[ ] Sonraki faza devredenler yazıldı.
```

## 14. Faz Sonu Kararı

Karar: `PASS / PASS WITH LIMITATION / PARTIAL / FAIL`

Gerekçe:


## 15. Sonraki Faza Devredenler


```

---

## 17. Nihai Karar

Bu şablon, production-readiness sürecindeki tüm faz dosyaları için bağlayıcı yazım ve kontrol formatıdır.

Bu şablon kullanılmadan açılan faz dosyası resmi faz dosyası sayılmaz.

Net karar:

```text
PHASE FILE TEMPLATE — ACCEPTED
```
