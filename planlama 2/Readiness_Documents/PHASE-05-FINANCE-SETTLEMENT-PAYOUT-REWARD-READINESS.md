# PHASE-05-FINANCE-SETTLEMENT-PAYOUT-REWARD-READINESS.md

## 1. Fazın Amacı

Bu fazın amacı, Hedihup platformunda ödeme, sipariş, teslimat, iade ve refund sonrası oluşan finansal etkilerin; settlement, hakediş, payable, payout, reward point ve finansal düzeltme zinciri içinde production-readiness seviyesine getirilmesidir.

Bu fazın en kritik ayrımları:

```text
Payment succeeded ≠ settlement completed
Delivered ≠ payable
Refund completed ≠ settlement adjusted
Settled ≠ payable
Payable ≠ paid_out
Reward earned ≠ spendable
```

Bu faz payment provider, order creation veya shipment lifecycle fazı değildir. Bu faz finansal doğruluk, hakediş ve ödeme çıkışının owner-boundary-safe kapatılmasıdır.

---

## 2. Fazın Kapsamı

Bu faz aşağıdaki alanları kapsar:

- finansal mutabakat / hakediş sistemi
- settlement lifecycle
- finance correction
- refund financial impact
- return/refund settlement adjustment
- payout / ödeme çıkış sistemi
- payout batch
- payout provider boundary
- payout retry / failure handling
- payable / paid_out ayrımı
- risk hold / payout block
- coupon / campaign sponsor financial impact
- reward point lifecycle
- point market financial and fraud impact
- finance audit / evidence
- finance admin protected actions

---

## 3. Fazın Kapsam Dışı Alanları

Bu fazda yapılmayacak işler:

- payment provider initiate / callback / reconciliation
- order handoff
- shipment/delivery state management
- product/catalog/search/ranking
- full frontend visual polish
- full admin panel redesign
- production deployment release gate

Bu faz, finansal owner domain alanını kapatır. Payment, order ve fulfillment verilerini girdi olarak alır; onların truth’unu doğrudan mutate etmez.

---

## 4. Referans Sistem Dosyaları

Bu fazda esas alınacak sistem dosyaları:

1. `47-finansal mutabakat hakedis sistemi.md`
2. `54-payout ödeme çıkış sistemi.md`
3. `18-iptal iade sistemi.md`
4. `15-ödeme sistemi.md`
5. `16-sipariş sistemi.md`
6. `17-kargo teslimat sistemi.md`
7. `46-kupon sistemi.md`
8. `35-kampanya sistemi.md`
9. `39-ödül puan sistemi.md`
10. `38-puan market sistemi.md`
11. `49-fraud risk abuse sistemi.md`
12. `40-admin sistemi.md`
13. `25-kural -yetki sistemi.md`
14. `OWNER_MATRIX.md`
15. `GUARD_MATRIX.md`
16. `PERMISSION_MATRIX.md`
17. `TRANSITION_POLICIES.md`
18. `CRITICAL_JOURNEY_CHECKLIST.md`
19. `ACCEPTANCE_CRITERIA_PACK.md`
20. `TEST_STRATEJISI.md`

---

## 5. Referans Kayıt Dosyaları

Bu fazda özellikle şu kayıtlar dikkate alınır:

- `63-IMPLEMENTATION_PROGRESS_MASTER_BIRLESTIRILMIS.md`
- `64-PACKAGE_EXECUTION_LOG_BIRLESTIRILMIS.md`
- `65-ACTIVE_RISKS_AND_DECISIONS-CONSOLIDATED.md`
- `HARDENING-08-09-CONSOLIDATED-REFERENCE-RECORD.md`
- `HARDENING-10-CALLBACK-MASTER-REFERENCE.md`
- `HARDENING-10C10 — PayTR Status Inquiry / Payment Reconciliation Birleşik Referans Dosyası`
- `PX_DOMAIN_IMPLEMENTATION_REFERENCE_RECORD.md`
- `01-SYSTEM_TO_IMPLEMENTATION_MAPPING.md`
- `02-CURRENT_STATE_BASELINE.md`
- `03-PRODUCTION_READINESS_PHASE_MASTER_PLAN.md`
- `04-PRODUCTION_READINESS_RISK_REGISTER.md`
- `09-RELEASE_BLOCKER_REGISTER.md`

---

## 6. Önceden Yapılmış İşler

### 6.1 Refund Foundation

Kayıtlara göre:

- P18 — Refund Foundation — PASS

Bu refund foundation olduğunu gösterir. Ancak refund execution’ın settlement adjustment ve payout etkisi production-readiness seviyesinde ayrıca doğrulanmalıdır.

### 6.2 Finance Correction / Settlement / Payout Foundation

Kayıtlarda P42–P50 hattında finance correction, settlement ve payout foundation/hardening çalışmaları yer alır.

Bu foundation, finansal domainlerin ilk owner sınırlarını kurmuştur; ancak production-ready finansal doğruluk iddiası değildir.

### 6.3 Provider Boundary Foundation

HARDENING-09 hattında payout provider boundary foundation kurulmuştur.

Korunan sınır:

```text
Payout provider sonucu doğrudan paid_out business truth değildir.
```

### 6.4 Reward Eligibility Foundation

PX-KULLANICI-06 ile customer points / reward eligibility foundation yapılmıştır.

Bu kayıt reward eligibility foundation olduğunu gösterir; ancak tam reward ledger ve point market lifecycle değildir.

### 6.5 Audit / Event / Outbox Foundation

HARDENING-08 ile event/audit/outbox foundation kurulmuştur.

Ancak production broker, distributed worker, retry scheduler ve DLQ yoktur.

---

## 7. Önceden Ertelenmiş / Sınırlı Bırakılmış İşler

Bu faza devreden ana limitation ve borçlar:

1. Refund completed sonrası settlement adjustment E2E yok
2. Settlement pending/settled/adjusted/reversed lifecycle production seviyesinde doğrulanmadı
3. Settled ≠ payable ayrımı doğrulanmalı
4. Payable ≠ paid_out ayrımı doğrulanmalı
5. Payout gerçek provider / sandbox runtime yok
6. Payout batch / retry / failure / hold davranışı netleşmeli
7. Bank/account verification modeli yok
8. Risk hold payout çıkışını durdurmalı
9. Coupon/campaign sponsor cost impact doğrulanmalı
10. Reward point pending/vested/spendable lifecycle netleşmeli
11. Return/refund sonrası reward point reversal netleşmeli
12. Point market spending transaction ve abuse guard eksik
13. Finance admin actions protected command + audit ile çalışmalı

---

## 8. Bu Fazda Yapılacak İşler

### 8.1 Settlement Lifecycle Kontrolü

Kontrol edilecek:

- Settlement line hangi olaydan sonra oluşur?
- Order created settlement üretir mi, yoksa delivery/return penceresi mi gerekir?
- Settlement pending / settled / adjusted / reversed state’leri net mi?
- Settlement line product, supplier, creator, platform commission, coupon sponsor etkilerini taşıyor mu?
- Duplicate settlement line oluşuyor mu?
- Event/outbox settlement truth yerine geçiyor mu?

Beklenen sonuç:

```text
Settlement finansal owner alanında ve idempotent biçimde oluşmalıdır.
```

---

### 8.2 Refund → Settlement Adjustment Kontrolü

Kontrol edilecek:

- Refund completed sonrası settlement adjusted/reversed nasıl çalışır?
- Partial refund settlement line’ı nasıl etkiler?
- Refund provider sonucu settlement truth’u doğrudan mutate ediyor mu?
- Return approved settlement adjustment yapıyor mu, yapmamalı mı?
- Duplicate refund adjustment engeli var mı?

Beklenen sonuç:

```text
Refund completed ≠ settlement adjusted; adjustment ayrı finance owner transition ile yapılır.
```

---

### 8.3 Payable Lifecycle Kontrolü

Kontrol edilecek:

- Settled balance ne zaman payable olur?
- Minimum payout threshold var mı?
- Risk/fraud hold payable olmayı durduruyor mu?
- Bank/account verification eksikse payable olabilir mi?
- Payable state payout batch’e nasıl girer?

Beklenen sonuç:

```text
Settled ≠ payable.
```

---

### 8.4 Payout Batch Kontrolü

Kontrol edilecek:

- Payout batch hangi periyotta oluşur?
- Fenomen payout ve tedarikçi payout ayrımı var mı?
- Batch validation state’i var mı?
- Hold/release davranışı nasıl?
- Failed payout retry nasıl?
- Duplicate payout instruction engeli var mı?
- Payout batch kapandıktan sonra geri dönüş nasıl yönetilir?

Beklenen sonuç:

```text
Payable balance kontrollü batch ile payout instruction’a dönüşür.
```

---

### 8.5 Payout Provider Boundary

Kontrol edilecek:

- Gerçek payout provider var mı?
- Sandbox veya simulation sınırı açık mı?
- Provider response paid_out truth sayılıyor mu?
- Provider failure retry üretiyor mu?
- Provider callback/result idempotent mi?
- ActualProviderPayoutPerformed flag veya eşdeğer boundary açık mı?

Beklenen sonuç:

```text
Provider sonucu paid_out değildir; finance/payout owner guard ile işlenir.
```

---

### 8.6 Bank / Account / Identity Verification

Kontrol edilecek:

- Fenomen payout hesabı doğrulanmış mı?
- Tedarikçi payout hesabı doğrulanmış mı?
- Eksik banka/IBAN/kimlik durumunda payout block var mı?
- Admin override mümkünse protected/audit’li mi?
- Account change sonrası payout hold gerekir mi?

Beklenen sonuç:

```text
Payout recipient verification olmadan ödeme çıkışı açılmamalıdır.
```

---

### 8.7 Coupon / Campaign Financial Impact

Kontrol edilecek:

- Kupon maliyetini kim üstleniyor?
- Platform funded / creator funded / supplier funded coupon ayrımı var mı?
- Campaign effect checkout/order snapshot’a girmiş mi?
- Settlement line discount sponsor etkisini taşıyor mu?
- Abuse/fraud risk signal var mı?
- Coupon kullanım limiti finansal hesapta doğru mu?

Beklenen sonuç:

```text
İndirim kimin cebinden çıktığı bilinmeden settlement yapılmamalıdır.
```

---

### 8.8 Reward Point Lifecycle

Kontrol edilecek:

- Point earned ne zaman oluşur?
- Point pending / vested / spendable ayrımı var mı?
- Delivery sonrası mı açılır?
- Review/story reward point etkisi nasıl?
- Return/refund sonrası point reversal var mı?
- Duplicate reward event ikinci puan üretir mi?
- Point ledger var mı?

Beklenen sonuç:

```text
Reward earned ≠ spendable.
```

---

### 8.9 Point Market Spending

Kontrol edilecek:

- Point market item stock var mı?
- Point spend transaction idempotent mi?
- Kullanıcının spendable balance’ı doğrulanıyor mu?
- Fraud/abuse guard var mı?
- Order/refund ile ilişkili puan harcaması nasıl etkilenir?
- Point market shipping veya delivery gerektiriyor mu?

Beklenen sonuç:

```text
Puan harcaması finansal/eligibility etkili transaction olarak ele alınmalıdır.
```

---

### 8.10 Finance Admin Protected Actions

Kontrol edilecek:

- Finance admin payout hold/release yapabilir mi?
- Settlement correction protected action mı?
- Manual adjustment audit zorunlu mu?
- Admin direct DB/state write var mı?
- Maker-checker / approval flow gerekiyor mu?
- Yüksek riskli financial action dual approval ister mi?

Beklenen sonuç:

```text
Finance admin güçlüdür; fakat direct write yapmaz ve audit dışı çalışmaz.
```

---

### 8.11 Financial Audit / Evidence

Kontrol edilecek:

- Settlement creation audit var mı?
- Adjustment audit var mı?
- Payout batch audit var mı?
- Payout provider result audit var mı?
- Manual finance correction audit var mı?
- Event/audit business truth gibi kullanılmıyor mu?

Beklenen sonuç:

```text
Audit finansal kanıttır; finansal truth değildir.
```

---

## 9. Bu Fazda Yapılmayacak İşler

Bu fazda bilinçli olarak yapılmayacaklar:

- Payment provider initiate/callback implementation
- Order handoff implementation
- Shipment/delivery lifecycle implementation
- Full frontend payout/finance UI polish
- Full BI/reporting dashboard
- Production deploy
- Full fraud scoring engine

---

## 10. Owner / Guard / Permission Kuralları

### 10.1 Owner Boundary

Bu fazda korunacak sınırlar:

- Financial truth yalnız finance owner alanında mutate edilir
- Payment owner settlement/payout mutate etmez
- Order owner payout mutate etmez
- Support owner refund/settlement/payout mutate etmez
- Risk owner financial truth mutate etmez; hold/review/block signal üretir
- Payout provider paid_out truth yaratmaz
- BFF financial truth üretmez
- Panel direct finance write yapmaz

### 10.2 Guard Kuralları

Zorunlu guard aileleri:

- authentication guard
- role/scope guard
- ownership guard
- financial block guard
- risk/fraud hold guard
- state/lifecycle guard
- idempotency guard
- approval guard
- audit requirement guard

### 10.3 Permission Kuralları

- Finance admin permission direct mutation hakkı değildir
- Payout release payout provider result ile aynı şey değildir
- Reward point spend permission spendable balance olmadan çalışmaz
- Coupon apply permission sponsor finance impact’i gizleyemez
- Admin correction approval olmadan kritik finance state değiştiremez

### 10.4 Transition Kuralları

Korunacak ayrımlar:

- payment succeeded ≠ settlement completed
- delivered ≠ settled
- return approved ≠ refund completed
- refund completed ≠ settlement adjusted
- settled ≠ payable
- payable ≠ paid_out
- payout submitted ≠ payout completed
- reward earned ≠ spendable
- event emitted ≠ financial truth mutated

---

## 11. Riskler

### 11.1 RB-007 — Refund / Settlement / Payout E2E Yok

Bu fazın ana blocker’ıdır.

### 11.2 RB-008 — Payout Gerçek Ödeme Çıkışı / Provider Runtime Yok

Payout provider boundary foundation vardır; fakat gerçek payout runtime yoktur.

### 11.3 RB-012 — Coupon / Campaign Financial Impact

Kupon/kampanya sponsor etkisi settlement’a doğru yansımazsa finansal kayıp oluşur.

### 11.4 Reward Point Ledger Riski

Reward point eligibility foundation vardır; fakat tam ledger yoksa duplicate puan, yanlış harcama veya refund sonrası haksız puan kalabilir.

### 11.5 Finance Admin Direct Write Riski

Finance panel direct write yaparsa owner/audit/approval zinciri bozulur.

### 11.6 Risk Hold Atlanması

Fraud/risk hold payout öncesi çalışmazsa riskli alıcıya ödeme çıkışı yapılabilir.

---

## 12. Kabul Kriterleri

PHASE-05 kapanışı için minimum kabul kriterleri:

1. Settlement lifecycle net olmalı
2. Refund → settlement adjustment doğrulanmalı
3. Settled ≠ payable ayrımı korunmalı
4. Payable ≠ paid_out ayrımı korunmalı
5. Payout batch lifecycle tanımlı olmalı
6. Payout provider boundary doğrulanmalı
7. Bank/account verification veya payout block modeli net olmalı
8. Risk hold payout’u durdurabilmeli
9. Coupon/campaign sponsor finance impact doğrulanmalı
10. Reward point lifecycle netleşmeli
11. Point market spending idempotent ve fraud-aware olmalı
12. Finance admin actions protected/audit’li olmalı
13. Financial audit/evidence oluşmalı
14. Targeted settlement/payout/reward tests PASS olmalı
15. Risk ve release blocker register güncellenmeli

---

## 13. Test / Smoke / Runtime Kanıtları

Bu faz kod/source/runtime etkili fazdır.

Minimum önerilen kanıtlar:

```text
- pnpm run typecheck
- pnpm run build
- refund → settlement adjustment smoke
- settlement lifecycle smoke
- payable lifecycle smoke
- payout batch smoke
- payout provider boundary smoke
- failed payout retry scenario
- risk hold → no payout scenario
- coupon sponsor settlement impact scenario
- reward point lifecycle smoke
- point spend idempotency test
- finance admin protected action boundary review
```

Acceptance bağlantıları:

- Journey 08 — delivery → return/refund impact
- Journey 09 — coupon/campaign application
- Journey 10 — reward point flow

---

## 14. Kapanış Kontrol Listesi

```text
[ ] Settlement lifecycle kontrol edildi
[ ] Refund → settlement adjustment kontrol edildi
[ ] Partial refund adjustment kontrol edildi
[ ] Settled ≠ payable ayrımı kontrol edildi
[ ] Payable ≠ paid_out ayrımı kontrol edildi
[ ] Payout batch lifecycle kontrol edildi
[ ] Payout provider boundary kontrol edildi
[ ] Payout retry/failure behavior kontrol edildi
[ ] Bank/account verification veya payout block kontrol edildi
[ ] Risk hold payout’u durduruyor kontrol edildi
[ ] Coupon sponsor finance impact kontrol edildi
[ ] Campaign finance impact kontrol edildi
[ ] Reward pending/vested/spendable lifecycle kontrol edildi
[ ] Return/refund point reversal kontrol edildi
[ ] Point market spend transaction kontrol edildi
[ ] Finance admin protected actions kontrol edildi
[ ] Audit/evidence kontrol edildi
[ ] Targeted smoke/test kanıtı alındı
[ ] RB-007 güncellendi
[ ] RB-008 güncellendi
[ ] RB-012 güncellendi
[ ] Risk register güncellendi
[ ] Release blocker register güncellendi
[ ] Faz kapanış raporu üretildi
```

---

## 15. Faz Sonu Kararı İçin Beklenen Sonuç

Bu fazın ideal hedef kararı:

```text
PASS
```

Ancak gerçek payout provider runtime kapsamı kontrollü biçimde PHASE-12’ye devredilecekse şu karar mümkün olabilir:

```text
PASS WITH LIMITATION
```

### PASS Şartı

- Settlement/refund/payout/reward zinciri owner-boundary-safe çalışıyor
- Finansal duplicate/idempotency testleri PASS
- Payout provider boundary veya sandbox doğrulandı
- Coupon/reward financial impact doğrulandı
- Release blocker kalmadı

### PASS WITH LIMITATION Şartı

- Finansal correctness ana zinciri çalışıyor
- Gerçek payout provider operasyonel hardening PHASE-12’ye kontrollü devredildi
- Para kaybı veya yanlış payout riski doğuran blocker kalmadı

### PARTIAL Şartı

- Settlement adjustment belirsiz
- Payout batch belirsiz
- Reward ledger belirsiz
- Coupon finance impact belirsiz
- Test kanıtı eksik

### FAIL Şartı

- Financial truth owner dışı mutate ediliyor
- Payable doğrudan paid_out yapılıyor
- Refund settlement adjustment yanlış veya duplicate
- Risk hold atlanıyor
- Payout duplicate ödeme üretiyor

---

## 16. Sonraki Faza Devredenler

PHASE-08’e devredenler:

- Finance admin UI
- Payout hold/release paneli
- Settlement correction paneli
- Approval workflows

PHASE-09’a devredenler:

- Coupon abuse signal
- Point abuse signal
- Payout abuse/fraud workflow
- Analytics/BI producer coverage
- Outbox worker/DLQ

PHASE-10’a devredenler:

- User reward/point market UI
- Creator payout visibility UI
- Supplier payout visibility UI
- Finance error/degraded UI

PHASE-11’e devredenler:

- delivery → return/refund impact
- coupon/campaign application
- reward point flow

PHASE-12’ye devredenler:

- production payout provider credentials
- payout runtime monitoring
- finance/payout incident playbook
- final deployment/observability gate

---

## 17. Nihai Faz Açılış Kararı

PHASE-05 şu şartla başlatılabilir:

```text
PHASE-04 Order / Fulfillment / Delivery / Return / Refund Readiness en az PASS WITH LIMITATION olarak kapanmış olmalıdır.
```

Planlama seviyesi için bu dosya hazırdır.

Gerçek uygulama/kapanış için repo source review, targeted finance/payout/reward tests ve boundary review gereklidir.

Net açılış kararı:

```text
PHASE-05 Finance / Settlement / Payout / Reward Readiness planı hazırdır.
```
