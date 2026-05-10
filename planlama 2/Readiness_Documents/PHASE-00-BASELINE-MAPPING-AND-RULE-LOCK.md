# PHASE-00-BASELINE-MAPPING-AND-RULE-LOCK.md

## 1. Fazın Amacı

Bu fazın amacı, Hedihup production-readiness yolculuğuna başlamadan önce bütün kaynakları, çalışma kurallarını, sistem-kayıt eşleştirmesini, mevcut durum baseline’ını, riskleri ve release blocker adaylarını resmi olarak kilitlemektir.

Bu faz kod yazma fazı değildir.

Bu fazın ana hedefi:

```text
Yanlış başlangıç varsayımını engellemek.
```

Bu faz tamamlanmadan:

- commerce core readiness
- payment/provider readiness
- order/finance readiness
- frontend readiness
- release gate

fazlarına geçilmemelidir.

---

## 2. Fazın Kapsamı

Bu faz aşağıdaki alanları kapsar:

- kaynak dosya seti kontrolü
- çalışma kuralları kontrolü
- faz dosyası şablonu kontrolü
- faz kapanış şablonu kontrolü
- 54 sistem dosyası ile uygulama kayıtlarının eşleştirilmesi
- mevcut durum baseline’ının çıkarılması
- production-readiness ana faz planının çıkarılması
- risk register oluşturulması
- release blocker register oluşturulması
- sonraki faza geçiş koşullarının belirlenmesi

---

## 3. Bu Fazın Kapsam Dışı Alanları

Bu fazda yapılmayacak işler:

- yeni kod yazmak
- mevcut kodu değiştirmek
- source review üzerinden kesin PASS vermek
- runtime test çalıştırmak
- provider entegrasyonu yapmak
- payment/order/finance mutation açmak
- frontend/panel UI geliştirmek
- production-ready kararı vermek

Net kural:

```text
PHASE-00 hazırlık ve kilitleme fazıdır.
Implementation fazı değildir.
```

---

## 4. Referans Sistem Dosyaları

Bu fazın genel referans sistemi, yüklenen 54 sistem dosyasının tamamıdır.

Bu dosyalar platformun hedef davranışını tanımlar:

- havuz
- fenomen mağaza
- kullanıcı/müşteri
- PDP
- story
- video
- keşfet
- ürün kartı
- ana sayfa
- kategori/PLP
- takip
- arama
- sepet
- checkout
- ödeme
- sipariş
- kargo/teslimat
- iade/refund
- notification
- destek
- post/UGC
- moderasyon
- auth/access
- adres
- kural/yetki
- varyant
- stok
- ürün kabul/onay
- fiyat
- sipariş takip
- yorum/puanlama
- soru-cevap
- interaction
- kullanıcı story
- kampanya
- beğeni/kaydet sayfaları
- öneri/sıralama
- puan market
- ödül puanı
- admin
- fenomen yönetim
- fenomen panel
- tedarikçi panel
- tedarikçi yönetim
- sipariş operasyon
- kupon
- finansal mutabakat/hakediş
- analitik/ölçümleme
- fraud/risk/abuse
- medya/asset
- arama indeksleme
- kategori/taksonomi
- destek ticket operasyon
- payout

---

## 5. Referans Kayıt Dosyaları

Bu fazda aşağıdaki kayıt dosyaları dikkate alınmıştır:

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

Bu fazda ayrıca aşağıdaki planlama ve anayasal dosyalar dikkate alınmıştır:

- `60-KODLAMAYA HAZIRLIK YOL HARİTASI.md`
- `61-FULL_CAPACITY_CODING_ROADMAP.md`
- `62-MASTER_IMPLEMENTATION_PLAN.md`
- `67-ROADMAP_ALIGNMENT_AND_PACKAGE_NUMBERING.md`
- `OWNER_MATRIX.md`
- `GUARD_MATRIX.md`
- `PERMISSION_MATRIX.md`
- `TRANSITION_POLICIES.md`
- `DEFINITION_OF_DONE.md`
- `ACCEPTANCE_CRITERIA_PACK.md`
- `CRITICAL_JOURNEY_CHECKLIST.md`
- `TEST_STRATEJISI.md`

---

## 6. Önceden Yapılmış İşler

Bu faz başlamadan önce mevcut kayıtlar aşağıdaki ana durumu göstermektedir:

### 6.1 Foundation roadmap tamamlandı

P01–P52 foundation coding roadmap tamamlanmıştır.

Resmi durum:

```text
Foundation-level Release Candidate Accepted — PASS WITH LIMITATION
Production Readiness: NOT CLAIMED
```

### 6.2 Hardening hattı ilerledi

Hardening 00–10 arasında:

- smoke/runtime baseline
- persistence hardening
- core commerce durability
- media runtime remediation
- auth/session/permission hardening
- moderation/risk/abuse hardening
- catalog/search hardening
- analytics/event/audit/outbox hardening
- provider boundary foundation
- callback/webhook foundation

çalışılmıştır.

### 6.3 HARDENING-10C10 ile reconciliation baseline güncellendi

HARDENING-10C10 kayıtlarına göre:

- PayTR status inquiry mapping
- reconciliation decision contract
- reconciliation task repository
- dry-run worker
- owner command guard
- controlled payment mutation
- no order handoff validation
- audit/outbox evidence
- task finalization

foundation seviyesinde tamamlanmıştır.

Ancak açık limitations:

- canlı PayTR request yok
- production worker runtime yok
- scheduler/queue yok
- order handoff yok
- finance/risk mutation yok
- real sandbox E2E yok

### 6.4 PX domain kayıtları işlendi

PX domain kayıtlarına göre:

- PX-HAVUZ-01/02/03/03-R/04 PASS
- PX-HAVUZ-05 PARTIAL
- PX-FENOMEN-02 PASS
- PX-FENOMEN-05 PASS
- PX-KULLANICI-02/03/04/05/06/07 PASS

Kritik not:

```text
PX-HAVUZ-05 PASS gibi ele alınamaz.
```

---

## 7. Bu Fazda Üretilen Dosyalar

PHASE-00 kapsamında aşağıdaki production-readiness başlangıç dosyaları oluşturulmuştur:

### 7.1 `00-PRODUCTION_READINESS_WORKING_RULES.md`

Amaç:

- yeni production-readiness çalışma disiplinini sabitlemek
- kör ilerleme ve varsayımı yasaklamak
- risk bazlı test yaklaşımını belirlemek
- her fazın ayrı dosyada yürütülmesini zorunlu kılmak

Durum:

```text
OLUŞTURULDU
```

### 7.2 `05-PHASE_FILE_TEMPLATE.md`

Amaç:

- her faz dosyasının standart formatını belirlemek
- yapılan/yapılacak/ertelenen/risk/kabul kriteri alanlarını zorunlu kılmak

Durum:

```text
OLUŞTURULDU
```

### 7.3 `06-PHASE_CLOSURE_TEMPLATE.md`

Amaç:

- her faz sonunda kullanılacak kapanış raporu formatını belirlemek
- PASS / PASS WITH LIMITATION / PARTIAL / FAIL kararını standartlaştırmak

Durum:

```text
OLUŞTURULDU
```

### 7.4 `01-SYSTEM_TO_IMPLEMENTATION_MAPPING.md`

Amaç:

- 54 sistem dosyasını kayıt gerçekliğiyle eşleştirmek
- yapılanları, eksikleri, limitation’ları ve faz bağlantılarını çıkarmak

Durum:

```text
OLUŞTURULDU
```

### 7.5 `02-CURRENT_STATE_BASELINE.md`

Amaç:

- mevcut resmi durumu kilitlemek
- foundation-level RC ile production-ready ayrımını sabitlemek
- HARDENING-10C10 sonrası reconciliation gerçekliğini baseline’a işlemek

Durum:

```text
OLUŞTURULDU
```

### 7.6 `03-PRODUCTION_READINESS_PHASE_MASTER_PLAN.md`

Amaç:

- yeni production-readiness ana faz planını çıkarmak
- 12 fazlık yayına hazırlık yolunu tanımlamak

Durum:

```text
OLUŞTURULDU
```

### 7.7 `04-PRODUCTION_READINESS_RISK_REGISTER.md`

Amaç:

- production-readiness risklerini takip etmek
- her riskin hedef fazını ve kapanış kriterini belirtmek

Durum:

```text
OLUŞTURULDU
```

### 7.8 `09-RELEASE_BLOCKER_REGISTER.md`

Amaç:

- yayına çıkışı engelleyen blocker’ları genel risklerden ayırmak
- final release gate öncesi kapanması gereken maddeleri listelemek

Durum:

```text
OLUŞTURULDU
```

---

## 8. Bu Fazda Yapılan Ana Değerlendirmeler

### 8.1 Eski roadmap devam ettirilmeyecek

60 / 61 / 62 / 67 dosyaları tarihsel ve stratejik referans olarak kullanılacaktır.

Yeni production-readiness roadmap’i mevcut gerçek duruma göre oluşturulmuştur.

### 8.2 Foundation ≠ production-ready ayrımı sabitlendi

P01–P52 tamamlanmış olsa da bu production-ready değildir.

Production-ready kararı yalnız release gate sonunda verilebilir.

### 8.3 Reconciliation durumu düzeltildi

Eski “reconciliation yok” ifadesi artık geçersizdir.

Doğru ifade:

```text
Reconciliation foundation vardır; production runtime değildir.
```

### 8.4 Payment succeeded ≠ order created ayrımı korundu

HARDENING-10C10 hattı payment succeeded sonrası order handoff’u özellikle kapsam dışında tutmuştur.

Bu ayrım PHASE-03 ve PHASE-04 için kritik geçiş konusudur.

### 8.5 PX-HAVUZ-05 teknik borcu erken faza alındı

PX-HAVUZ-05 PARTIAL olduğu için PHASE-02 içinde öncelikli doğrulama ve kapatma maddesi yapılmıştır.

### 8.6 Release blocker’lar ayrı dosyada takip edilmeye başlandı

Genel risk ile release blocker ayrıldı.

Bu ayrım final Go / No-Go kararını netleştirecektir.

---

## 9. Owner / Guard / Permission / Transition Kontrolü

PHASE-00 kod etkisi üretmediği için runtime owner ihlali oluşturmaz.

Ancak sonraki fazlarda korunacak anayasal sınırlar bu fazda kilitlenmiştir:

- owner dışı write yok
- BFF truth owner değildir
- panel direct write yapmaz
- UI truth üretmez
- event / audit / outbox business truth değildir
- payment succeeded order created değildir
- return approved refund completed değildir
- settled payable değildir
- payable paid_out değildir
- permission eligibility ile karıştırılmaz
- guest checkout sosyal hak açmaz

---

## 10. Test / Smoke / Runtime Kanıtları

Bu faz kod etkisi olmayan planlama ve baseline kilitleme fazıdır.

Bu nedenle:

```text
typecheck/build/smoke çalıştırılması gerekmez.
```

Bu faz için kanıt türü:

- kaynak dosya seti kontrolü
- sistem-kayıt eşleştirme
- baseline dosyası
- risk register
- release blocker register
- faz master planı
- çalışma kuralları
- faz şablonları

Risk bazlı test yaklaşımı gereği, kod etkisi olmayan bu fazda test yerine kaynak ve kayıt kanıtı yeterlidir.

---

## 11. Risk Kontrolü

PHASE-00 sonunda açık kalan ana riskler şunlardır:

1. Production-ready iddiası yok
2. Canlı PayTR / gerçek provider doğrulaması yok
3. Payment succeeded → order handoff yok
4. Reconciliation production runtime yok
5. PX-HAVUZ-05 PARTIAL build borcu
6. Refund / settlement / payout E2E yok
7. Payout gerçek ödeme çıkışı yok
8. Critical journey acceptance tamamlanmadı
9. Deployment / observability / security release gate yok
10. Frontend/mobile critical surface acceptance yok
11. Owner boundary kritik ihlal taraması PHASE-01’de yapılmalı

Bu riskler `04-PRODUCTION_READINESS_RISK_REGISTER.md` ve `09-RELEASE_BLOCKER_REGISTER.md` dosyalarına işlenmiştir.

---

## 12. Release Blocker Kontrolü

PHASE-00 sonunda release blocker’lar kapatılmamıştır.

Bu fazın amacı blocker kapatmak değil, blocker’ları görünür hale getirmektir.

Aktif blocker kayıtları:

- RB-001 — Production-ready kararı henüz verilmedi
- RB-002 — Canlı PayTR / gerçek provider ödeme doğrulaması yok
- RB-003 — Payment succeeded → Order handoff yok
- RB-004 — Reconciliation production runtime yok
- RB-005 — Critical journey acceptance tamamlanmadı
- RB-006 — PX-HAVUZ-05 PARTIAL build borcu
- RB-007 — Refund / settlement / payout E2E yok
- RB-008 — Payout gerçek ödeme çıkışı / provider runtime yok
- RB-009 — Frontend / mobile critical surface acceptance yok
- RB-010 — Deployment / observability / security release gate yok
- RB-011 — Owner boundary kritik ihlal taraması tamamlanmadı
- RB-012 — Kupon / kampanya finansal etki ve abuse kontrolü doğrulanmadı
- RB-013 — Risk / fraud minimum production koruma seti tamamlanmadı
- RB-014 — Search / taxonomy / ranking leak kontrolü tamamlanmadı
- RB-015 — Media production pipeline ve güvenli yayın gate’i yok

---

## 13. Faz Kapanış Checklist’i

```text
[x] Faz amacı yazıldı
[x] Faz kapsamı yazıldı
[x] Kapsam dışı alanlar yazıldı
[x] Referans sistem dosyaları belirtildi
[x] Referans kayıt dosyaları belirtildi
[x] Önceden yapılmış işler ayrıldı
[x] Bu fazda üretilen dosyalar listelendi
[x] Reconciliation baseline güncellendi
[x] PX-HAVUZ-05 PARTIAL borcu işlendi
[x] Production-ready iddiası verilmedi
[x] Owner / guard / permission sınırları kilitlendi
[x] Risk register oluşturuldu
[x] Release blocker register oluşturuldu
[x] Test gerekmeme gerekçesi yazıldı
[x] Sonraki faza geçiş şartı yazıldı
```

---

## 14. Faz Sonu Kararı

Bu faz için önerilen karar:

```text
PASS WITH LIMITATION
```

### Gerekçe

PHASE-00’ın ana amacı tamamlanmıştır:

- çalışma kuralları oluşturuldu
- faz şablonu oluşturuldu
- kapanış şablonu oluşturuldu
- sistem-kayıt mapping oluşturuldu
- mevcut durum baseline’ı oluşturuldu
- production-readiness master faz planı oluşturuldu
- risk register oluşturuldu
- release blocker register oluşturuldu

Ancak bu faz production blocker kapatma fazı değildir. Açık blocker’lar sonraki fazlara devredilmiştir.

Bu nedenle en doğru karar:

```text
PASS WITH LIMITATION
```

---

## 15. Sonraki Faza Devredenler

PHASE-01’e devredenler:

1. Owner boundary source review
2. BFF write taraması
3. Panel direct write taraması
4. UI truth üretimi riski kontrolü
5. Event/audit/outbox mutation yerine geçiyor mu kontrolü
6. Permission / eligibility ayrımı kontrolü
7. Legacy actor header / x-actor-id kalıntıları kontrolü
8. Protected action kapsamı kontrolü

PHASE-02’ye devredenler:

1. PX-HAVUZ-05 PARTIAL build borcu
2. Commerce core source/runtime kontrolü
3. Stock/price/snapshot validation
4. Coupon/campaign commerce etkisi

PHASE-03’e devredenler:

1. Canlı PayTR / sandbox provider doğrulaması
2. Reconciliation production runtime
3. Payment succeeded → order handoff inventory
4. ProviderReference uniqueness riski
5. Expected amount/currency reconciliation task source kararı

---

## 16. Sonraki Adım

Sıradaki faz:

```text
PHASE-01 — Architecture Boundary / Owner / Guard Readiness
```

PHASE-01 için üretilecek dosya:

```text
PHASE-01-ARCHITECTURE-BOUNDARY-OWNER-GUARD-READINESS.md
```

PHASE-01 amacı:

```text
Production-readiness domain çalışmalarına geçmeden önce owner boundary, guard, permission ve transition sınırlarını source/kayıt bazlı doğrulamak.
```

---

## 17. Nihai Kısa Sonuç

```text
PHASE-00 — Baseline / Mapping / Rule Lock tamamlandı.

Karar: PASS WITH LIMITATION

Ana limitation:
Bu faz hiçbir production blocker kapatmamıştır; yalnız blocker’ları, riskleri, baseline’ı ve çalışma sistemini görünür hale getirmiştir.

Sonraki faz:
PHASE-01 — Architecture Boundary / Owner / Guard Readiness
```
