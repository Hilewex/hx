# 06-PHASE_CLOSURE_TEMPLATE.md

## 1. Dosyanın Amacı

Bu dosya, Hedihup production-readiness yol haritasında her faz tamamlandığında kullanılacak standart kapanış raporu şablonudur.

Amaç:

- fazın gerçekten tamamlanıp tamamlanmadığını kanıtlı biçimde değerlendirmek
- faz içinde önceden yapılmış işler ile bu fazda yapılan işleri ayırmak
- sistem dosyaları ve kayıt dosyalarıyla uyumu kontrol etmek
- owner / guard / permission / transition sınırlarının korunup korunmadığını doğrulamak
- gereksiz ağır test yükü oluşturmadan risk bazlı gerekli kanıtları toplamak
- PASS / PASS WITH LIMITATION / PARTIAL / FAIL kararını standartlaştırmak
- sonraki faza devreden işleri görünür hale getirmektir

Bu şablon kullanılmadan hiçbir faz resmi olarak kapatılmış sayılmaz.

---

## 2. Faz Kapanış Raporu Başlığı

```text
# PHASE-XX — [Faz Adı] — CLOSURE REPORT
```

Her kapanış raporunda faz kodu ve faz adı net yazılmalıdır.

Örnek:

```text
# PHASE-03 — Payment / Provider / Callback / Reconciliation Readiness — CLOSURE REPORT
```

---

## 3. Kapanış Kararı Özeti

Bu bölüm en üstte yer alır.

```text
Faz Kodu:
Faz Adı:
Kapanış Tarihi:
Karar:
- PASS
- PASS WITH LIMITATION
- PARTIAL
- FAIL

Kısa Sonuç:
```

Karar yalnız dört değerden biri olabilir.

Ara karar, yoruma açık ifade veya belirsiz kapanış dili kullanılmaz.

---

## 4. Fazın Amacı

Bu bölümde fazın başlangıçta neyi kapatmak için açıldığı yazılır.

```text
Bu fazın amacı:
- ...
- ...
- ...
```

Kapanış sırasında fazın amacı değiştirilmez.

Eğer faz sırasında kapsam değiştiyse bu ayrıca “Kapsam Sapması / Scope Change” bölümünde yazılır.

---

## 5. Referans Sistem Dosyaları Kontrolü

Bu bölümde fazın dayandığı sistem dosyaları listelenir.

```text
Kontrol edilen sistem dosyaları:
- ...
- ...
- ...
```

Her sistem dosyası için kısa kontrol sonucu yazılır:

```text
Sistem dosyası:
Beklenen davranış:
Fazda karşılığı:
Durum:
- UYUMLU
- KISMEN UYUMLU
- UYUMSUZ
- KAYIT YOK / DOĞRULANAMADI
Not:
```

Net kural:

- Sistem beklentisi ile yapılan iş eşleşmeden PASS verilmez.
- Eksik doğrulama varsa PASS WITH LIMITATION veya PARTIAL düşünülür.
- Uyum bozucu owner / transition ihlali varsa PASS verilmez.

---

## 6. Referans Kayıt Dosyaları Kontrolü

Bu bölümde fazın dayandığı kayıt dosyaları listelenir.

```text
Kontrol edilen kayıt dosyaları:
- 63-IMPLEMENTATION_PROGRESS_MASTER...
- 64-PACKAGE_EXECUTION_LOG...
- 65-ACTIVE_RISKS_AND_DECISIONS...
- HARDENING...
- PX...
```

Her kayıt için kısa sonuç yazılır:

```text
Kayıt dosyası:
Faza etkisi:
Önceden yapılmış iş:
Önceden kalan limitation:
Bu fazdaki durum:
Not:
```

Net kural:

- Kayıtta PASS görünen iş, production-ready sayılmaz; kapsamına göre değerlendirilir.
- PASS WITH LIMITATION kayıtları tekrar incelenmeden kapanmış kabul edilmez.
- PARTIAL kayıtları PASS gibi ele alınmaz.
- CLOSED WITH LIMITATIONS kayıtları sonraki fazlara devreden borçlarıyla birlikte okunur.

---

## 7. Önceden Yapılmış İşler

Bu bölümde faz başlamadan önce kayıt dosyalarında zaten yapılmış olan işler yazılır.

```text
Önceden yapılmış işler:
1. ...
2. ...
3. ...
```

Her madde için kaynak kayıt belirtilmelidir:

```text
İş:
Kaynak kayıt:
Durum:
- PASS
- PASS WITH LIMITATION
- PARTIAL
- CLOSED WITH LIMITATIONS
Not:
```

Bu bölüm, tekrar iş üretmeyi engeller.

---

## 8. Bu Fazda Yapılan İşler

Bu bölümde faz sırasında gerçekten yapılan işler yazılır.

```text
Bu fazda yapılan işler:
1. ...
2. ...
3. ...
```

Her iş için:

```text
İş:
Kapsam:
Etkilenen alan:
Kanıt:
Durum:
Not:
```

Kod etkisi olmayan fazlarda kanıt; dosya eşleştirme, karar kaydı ve kontrol listesi olabilir.

Kod etkisi olan fazlarda kanıt; source review, boundary review, typecheck/build, smoke/test veya acceptance sonucu olmalıdır.

---

## 9. Bu Fazda Bilinçli Olarak Yapılmayanlar

Bu bölüm kapsam dışı bırakılan işleri yazar.

```text
Bu fazda yapılmayan işler:
1. ...
2. ...
3. ...
```

Her madde için neden yazılır:

```text
Madde:
Neden bu fazda yapılmadı:
Sonraki faz:
Risk seviyesi:
- LOW
- MEDIUM
- HIGH
- RELEASE BLOCKER
```

Net kural:

- Kapsam dışı iş sessiz bırakılmaz.
- Sonraki faza devredilen iş kayıt altına alınır.
- Release blocker ise ayrıca release blocker register’a işlenir.

---

## 10. Owner / Guard / Permission / Transition Kontrolü

Bu bölüm faz kapanışının ana güvenlik kontrolüdür.

### 10.1 Owner Boundary Kontrolü

```text
Owner dışı write var mı?
- Hayır / Evet

BFF truth owner gibi davrandı mı?
- Hayır / Evet

Panel direct write yaptı mı?
- Hayır / Evet

UI truth üretti mi?
- Hayır / Evet

Event / audit / outbox owner state mutation yerine geçti mi?
- Hayır / Evet
```

Evet çıkan herhangi bir kritik madde varsa faz PASS kapanamaz.

### 10.2 Guard Kontrolü

```text
Authentication guard kontrol edildi mi?
Role / scope guard kontrol edildi mi?
Ownership guard kontrol edildi mi?
Eligibility guard kontrol edildi mi?
State / lifecycle guard kontrol edildi mi?
Risk / moderation / financial block guard kontrol edildi mi?
Idempotency / replay guard gerekiyorsa kontrol edildi mi?
```

Her guard her faz için zorunlu olmayabilir.

Ancak gerekli guard belirtilmeli ve neden gerekli / gereksiz olduğu yazılmalıdır.

### 10.3 Permission Kontrolü

```text
Permission ile role karıştırıldı mı?
Permission ile eligibility karıştırıldı mı?
Panel permission owner truth write hakkı gibi yorumlandı mı?
Guest permission sosyal hak açtı mı?
```

### 10.4 Transition Kontrolü

```text
Korunan kritik ayrımlar:
- checkout ≠ payment
- payment succeeded ≠ order created
- delivered ≠ review/story written
- return approved ≠ refund completed
- refund completed ≠ settlement adjusted
- settled ≠ payable
- payable ≠ paid out
- event emitted ≠ owner state mutated
```

Faz hangi transition’ları etkiliyorsa özel olarak yazılmalıdır.

---

## 11. Test / Smoke / Runtime / Acceptance Kanıtları

Bu bölüm risk bazlıdır.

### 11.1 Kod Etkisi Yoksa

Planlama, mapping veya dokümantasyon fazlarında şu kanıtlar yeterlidir:

```text
- sistem dosyası eşleştirme tamamlandı
- kayıt dosyası eşleştirme tamamlandı
- risk ayrımı yapıldı
- faz kapsamı netleşti
- kapanış checklist’i tamamlandı
```

### 11.2 Kod Etkisi Varsa

Kod etkisi olan fazlarda ilgili kanıtlar yazılır:

```text
Çalıştırılan kontroller:
- pnpm run typecheck
- pnpm run build
- targeted smoke:
- integration test:
- acceptance scenario:
- source review:
- boundary review:
```

Her komut için:

```text
Komut:
Sonuç:
- PASS
- FAIL
- SKIPPED
Not:
```

SKIPPED varsa nedeni yazılır. Sebepsiz SKIPPED ile PASS verilmez.

### 11.3 Kritik Alanlarda Zorunlu Ek Kanıt

Aşağıdaki alanlarda daha güçlü kanıt aranır:

- payment
- provider callback
- reconciliation
- order handoff
- refund
- settlement
- payout
- risk/fraud
- critical journey E2E
- release gate

Bu alanlarda yalnız dokümantasyon veya happy-path smoke yeterli değildir.

---

## 12. Risk ve Limitation Kontrolü

Bu bölümde faz sonunda kalan riskler yazılır.

```text
Kalan riskler:
1. ...
2. ...
3. ...
```

Her risk için:

```text
Risk:
Tür:
- Release Blocker
- Production Readiness Debt
- Monitored Limitation
Etkilediği alan:
Sonraki aksiyon:
Sahip / ilgili faz:
Not:
```

Net kural:

- Bilinen limitation gizlenmez.
- PASS WITH LIMITATION kararı verildiyse limitation açıkça yazılır.
- Release blocker varsa faz PASS kapanamaz; en fazla PARTIAL veya FAIL olabilir.

---

## 13. Release Blocker Kontrolü

```text
Bu faz sonunda release blocker var mı?
- Hayır / Evet

Varsa:
1. ...
2. ...
```

Release blocker örnekleri:

- canlı ödeme provider doğrulanmadı
- payment succeeded sonrası order handoff yok
- reconciliation production runtime yok
- critical journey E2E geçmedi
- payout gerçek ödeme çıkışı doğrulanmadı
- deployment / rollback / observability gate yok
- owner boundary ihlali var
- güvenlik veya finansal veri riski var

---

## 14. Faz Kapanış Checklist’i

Her faz kapanışında bu liste doldurulur.

```text
[ ] Faz amacı kontrol edildi
[ ] Sistem dosyaları kontrol edildi
[ ] Kayıt dosyaları kontrol edildi
[ ] Önceden yapılmış işler ayrıldı
[ ] Bu fazda yapılan işler yazıldı
[ ] Yapılmayan / devredilen işler yazıldı
[ ] Owner boundary kontrol edildi
[ ] Guard / permission kontrol edildi
[ ] Transition ayrımları kontrol edildi
[ ] Riskler yazıldı
[ ] Release blocker kontrol edildi
[ ] Gerekli test / smoke / acceptance kanıtı yazıldı
[ ] PASS / PASS WITH LIMITATION / PARTIAL / FAIL kararı verildi
[ ] Sonraki faza devredenler yazıldı
```

Checklist eksikse faz kapatılamaz.

---

## 15. Faz Sonu Karar Standardı

### PASS

Şartlar:

- Faz amacı tamamen kapandı.
- Kritik eksik yok.
- Release blocker yok.
- Gerekli kanıtlar var.
- Owner / guard / permission / transition ihlali yok.

### PASS WITH LIMITATION

Şartlar:

- Fazın ana amacı kapandı.
- Bilinçli devreden limitation var.
- Limitation sonraki faza veya risk kaydına işlenmiş.
- Release blocker yok veya bu fazın kapsamı dışında kontrollü biçimde devredilmiş.

### PARTIAL

Şartlar:

- Bazı işler yapıldı.
- Ana faz amacı tam kapanmadı.
- Eksiklerin kapatılması gerekiyor.
- Sonraki faza geçiş riskli olabilir.

### FAIL

Şartlar:

- Faz amacı kapanmadı.
- Kritik blocker var.
- Owner / boundary / transition ihlali var.
- Kanıt yok veya test başarısız.

---

## 16. Sonraki Faza Devredenler

Bu bölümde kapanmayan işler net şekilde yazılır.

```text
Sonraki faza devredenler:
1. ...
2. ...
3. ...
```

Her madde için:

```text
Devreden iş:
Neden devretti:
Hedef faz:
Risk seviyesi:
Gerekli aksiyon:
```

---

## 17. Kapanış Sonucu

Son bölümde kısa ve net karar yazılır.

```text
Nihai karar:
[PASS / PASS WITH LIMITATION / PARTIAL / FAIL]

Kısa gerekçe:
...

Sonraki adım:
...
```

---

## 18. Örnek Kısa Karar Metni

```text
Nihai karar: PASS WITH LIMITATION

Kısa gerekçe:
Fazın ana amacı tamamlandı. Sistem ve kayıt dosyaları eşleştirildi. Owner boundary ihlali tespit edilmedi. Kod etkisi olmadığı için test koşulmadı; kaynak eşleştirme ve checklist kanıtı yeterli kabul edildi. Ancak ödeme provider production runtime ve order handoff sonraki fazlara devredildi.

Sonraki adım:
PHASE-03 — Payment / Provider / Callback / Reconciliation Readiness dosyasında ilgili limitation’lar kapatılacaktır.
```

---

## 19. Net Kapanış Kuralı

Bu şablon kullanılmadan, faz kapanış raporu oluşturulmadan ve karar standardı uygulanmadan hiçbir faz kapanmış kabul edilmez.

Net karar:

```text
Faz kapatma = kaynak kontrolü + boundary kontrolü + risk kontrolü + gerekli kanıt + resmi kapanış kararı
```
