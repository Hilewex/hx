# PHASE-08-ADMIN-CREATOR-SUPPLIER-SUPPORT-PANEL-READINESS.md

## 1. Fazın Amacı

Bu fazın amacı, Hedihup platformunda admin, creator/fenomen, supplier/tedarikçi ve support operasyon panellerini production-readiness seviyesine getirmektir.

Bu fazın ana kuralı:

```text
Panel direct write yapmaz.
Panel yalnız protected owner command başlatır.
```

Bu fazın hedefi:

```text
Platformun operasyonel yönetim yüzeyleri; scope, permission, owner boundary, audit, approval ve protected action kurallarıyla güvenli biçimde hazır hale getirilmelidir.
```

---

## 2. Fazın Kapsamı

Bu faz aşağıdaki alanları kapsar:

- admin sistemi
- fenomen yönetim sistemi
- fenomen mağaza yönetim paneli
- tedarikçi panel sistemi
- tedarikçi yönetim sistemi
- sipariş operasyon sistemi
- destek ticket operasyon sistemi
- moderation panel / review queue
- risk review queue
- finance/payout operation panels
- protected action flow
- approval flow
- panel audit/evidence
- panel route protection
- panel role/scope/permission guard
- panel direct write taraması

---

## 3. Fazın Kapsam Dışı Alanları

Bu fazda yapılmayacak işler:

- full public storefront UX
- mobile storefront page drawings
- payment provider live integration
- finance settlement core implementation
- ranking/recommendation engine
- full deployment/release gate
- full BI/analytics dashboard suite

Bu faz panel ve operasyon yüzeylerinin domain-boundary-safe üretim hazırlığını kapsar. Görsel tasarım ve ekran çizimleri PHASE-10 ile birlikte detaylandırılır.

---

## 4. Referans Sistem Dosyaları

Bu fazda esas alınacak sistem dosyaları:

1. `40-admin sistemi.md`
2. `41-fenomen yönetim sistemi.md`
3. `42-fenomen mağaza yönetim paneli sistemi.md`
4. `43-tedarikçi panel sistemi.md`
5. `44-tedarikçi yönetim sistemi.md`
6. `45-sipariş operasyon sistemi.md`
7. `53-destek ticket operasyon sistemi.md`
8. `22-moderasyon sistemi.md`
9. `49-fraud risk abuse sistemi.md`
10. `47-finansal mutabakat hakedis sistemi.md`
11. `54-payout ödeme çıkış sistemi.md`
12. `28-ürün kabul onay sistemi.md`
13. `1-havuz sistemi.md`
14. `2-fenomen mağaza sistemi.md`
15. `25-kural -yetki sistemi.md`
16. `OWNER_MATRIX.md`
17. `GUARD_MATRIX.md`
18. `PERMISSION_MATRIX.md`
19. `TRANSITION_POLICIES.md`
20. `CRITICAL_JOURNEY_CHECKLIST.md`
21. `ACCEPTANCE_CRITERIA_PACK.md`
22. `TEST_STRATEJISI.md`

---

## 5. Referans Kayıt Dosyaları

Bu fazda özellikle şu kayıtlar dikkate alınır:

- `63-IMPLEMENTATION_PROGRESS_MASTER_BIRLESTIRILMIS.md`
- `64-PACKAGE_EXECUTION_LOG_BIRLESTIRILMIS.md`
- `65-ACTIVE_RISKS_AND_DECISIONS-CONSOLIDATED.md`
- `HARDENING-00-05E-CONSOLIDATED-REFERENCE-RECORD.md`
- `HARDENING-06-07-CONSOLIDATED-REFERENCE-RECORD.md`
- `HARDENING-08-09-CONSOLIDATED-REFERENCE-RECORD.md`
- `PX_DOMAIN_IMPLEMENTATION_REFERENCE_RECORD.md`
- `01-SYSTEM_TO_IMPLEMENTATION_MAPPING.md`
- `02-CURRENT_STATE_BASELINE.md`
- `03-PRODUCTION_READINESS_PHASE_MASTER_PLAN.md`
- `04-PRODUCTION_READINESS_RISK_REGISTER.md`
- `09-RELEASE_BLOCKER_REGISTER.md`

---

## 6. Önceden Yapılmış İşler

### 6.1 App / Panel Shell Foundation

Kayıtlara göre web/panel/app shell foundation yapılmıştır.

Bu, panel yüzeylerinin teknik iskeletinin oluştuğunu gösterir; production panel readiness anlamına gelmez.

### 6.2 Protected Action Foundation

- P07 — Protected Action Foundation — PASS

Bu kayıt protected action modelinin foundation seviyesinde kurulduğunu gösterir.

### 6.3 Route Protection Hardening

HARDENING-05 hattında:

- admin route protection
- creator route protection
- permission guard integration
- access/session hardening

çalışılmıştır.

### 6.4 Pool / Supplier Intake Admin Surface

PX-HAVUZ-04 ile:

- supplier intake
- admin review surface hardening

PASS olarak kaydedilmiştir.

### 6.5 Creator Store Product / Post / Follow

PX-FENOMEN kayıtlarında:

- creator store product management hardening
- store post / follow feed foundation

PASS olarak kaydedilmiştir.

### 6.6 Support / Ticket Foundation

- P20 — Support / Ticket Foundation — PASS
- PX-KULLANICI-07 — Customer Support / Order Visibility Boundary — PASS

Bu kayıt support/order visibility foundation olduğunu gösterir.

### 6.7 Moderation / Risk Foundation

P31 ve HARDENING-06 hattında moderation/risk/abuse foundation ve hardening çalışmaları yapılmıştır.

---

## 7. Önceden Ertelenmiş / Sınırlı Bırakılmış İşler

Bu faza devreden ana limitation ve borçlar:

1. Full admin control tower yok
2. Creator panel mobile-first production UX doğrulanmadı
3. Supplier panel product/stock/order workbench production-ready değil
4. Support ticket queue / SLA / escalation UI eksik
5. Moderation full panel UI yok
6. Risk/fraud review queue production-ready değil
7. Finance/payout admin action UI ve approval flow netleşmeli
8. Panel direct write riski tekrar source review ister
9. Protected action coverage tüm kritik panel actions için doğrulanmalı
10. Audit/evidence zorunluluğu tüm kritik panel actions için doğrulanmalı
11. Creator/supplier scope isolation production seviyesinde test edilmeli

---

## 8. Bu Fazda Yapılacak İşler

### 8.1 Admin Control Tower Scope

Kontrol edilecek:

- Admin hangi modüllere erişebilir?
- Admin role alt kırılımları neler?
- Admin action’lar protected action üzerinden mi?
- Admin her şeyi doğrudan mutate edebiliyor mu?
- High-risk admin action approval istiyor mu?
- Admin dashboard yalnız projection mı?

Beklenen sonuç:

```text
Admin güçlüdür; fakat owner dışı direct write yapamaz.
```

---

### 8.2 Creator / Fenomen Yönetim Sistemi

Kontrol edilecek:

- Creator application lifecycle
- approve / reject / restrict / suspend / close
- category permission
- creator profile / storefront state
- creator payout eligibility ile creator active state ayrımı
- creator risk/moderation flag etkisi
- admin creator lifecycle action audit’i

Beklenen sonuç:

```text
Creator approved ≠ active commercial eligibility.
```

---

### 8.3 Creator Store Management Panel

Kontrol edilecek:

- Creator kendi mağazasını yönetebiliyor mu?
- Creator commercial pool ürününü kendi storefront’una eklerken global product truth’u mutate ediyor mu?
- Product reorder / merchandising yalnız store context’inde mi?
- Creator story/post/media management scope’u doğru mu?
- Creator kendi dışındaki mağaza veya ürünlere erişebiliyor mu?
- Creator panel action’ları protected command ile mi?

Beklenen sonuç:

```text
Creator panel yalnız kendi store scope’unda çalışır.
```

---

### 8.4 Supplier Panel Workbench

Kontrol edilecek:

- Supplier product submission
- manual / XML / API intake scope
- supplier stock update
- supplier base price input
- supplier order preparation
- supplier shipment/tracking input
- supplier support/dispute view
- supplier kendi ürün/order scope’u dışına çıkabiliyor mu?

Beklenen sonuç:

```text
Supplier veri girdisi sağlar; platform commercial truth ve approval owner olarak kalır.
```

---

### 8.5 Supplier Management System

Kontrol edilecek:

- Supplier application lifecycle
- approval / rejection / restriction / suspension
- category permission
- quality score / penalty
- document verification
- supplier account status payout eligibility ile karışıyor mu?
- admin supplier actions audit’li mi?

Beklenen sonuç:

```text
Supplier lifecycle platform governance alanıdır.
```

---

### 8.6 Order Operations Panel

Kontrol edilecek:

- Operation team hangi orders/lines görebilir?
- Order operation state order truth ile karışıyor mu?
- Manual intervention protected action mı?
- Fulfillment issue escalation nasıl?
- Supplier SLA breach nasıl görünür?
- Operation panel order/payment/finance truth’u direct mutate ediyor mu?

Beklenen sonuç:

```text
Order operations panel workflow yönetir; owner truth’u direct mutate etmez.
```

---

### 8.7 Support Ticket Operations Panel

Kontrol edilecek:

- Ticket queues
- SLA / priority
- customer order visibility
- escalation to operations / finance / moderation / risk
- support agent hangi state’leri değiştirebilir?
- support ticket order/refund/finance mutation yerine geçiyor mu?
- support internal note / customer message ayrımı

Beklenen sonuç:

```text
Support ticket orkestrasyon ve görünürlük sistemidir; finance/order owner değildir.
```

---

### 8.8 Moderation Panel

Kontrol edilecek:

- Moderation queue
- content pending/rejected/approved/taken_down actions
- moderator scope
- moderation action protected command mi?
- moderator content owner truth’u direct mutate ediyor mu?
- audit/evidence var mı?
- duplicate moderation action idempotent mi?

Beklenen sonuç:

```text
Moderation panel visibility decision başlatır; direct content DB write yapmaz.
```

---

### 8.9 Risk / Fraud Review Queue

Kontrol edilecek:

- Risk signals hangi queue’ya düşüyor?
- Risk reviewer hold/release yapabilir mi?
- Risk hold payment/order/payout owner truth’u doğrudan mutate ediyor mu?
- Review required / blocked / released state owner boundary nasıl?
- Fraud decision audit zorunlu mu?

Beklenen sonuç:

```text
Risk panel signal/review/hold yönetir; payment/order/finance truth’u direct mutate etmez.
```

---

### 8.10 Finance / Payout Admin Actions

Kontrol edilecek:

- Payout hold/release action
- Settlement correction action
- Manual finance adjustment
- Dual approval / maker-checker ihtiyacı
- Finance action audit zorunluluğu
- Payout provider retry/reversal action
- Admin direct payout write riski

Beklenen sonuç:

```text
Finance panel critical actions protected, audited ve gerekirse approval’lı olmalıdır.
```

---

### 8.11 Protected Action Coverage

Kontrol edilecek:

- Her kritik panel action protected action mı?
- Role/scope guard var mı?
- Owner command target belli mi?
- Idempotency key var mı?
- Audit evidence var mı?
- Approval flow gerekli mi?
- Error response canonical mı?

Beklenen sonuç:

```text
Panel action = protected command request.
```

---

### 8.12 Panel Direct Write Source Review

Kontrol edilecek:

- `apps/panel` doğrudan DB/repository import ediyor mu?
- Panel component state truth gibi kullanılıyor mu?
- BFF route panel adına owner dışı mutate ediyor mu?
- Admin/creator/supplier panel aynı endpoint’i scope’suz mu kullanıyor?
- Internal service action bypass var mı?

Beklenen sonuç:

```text
Panel direct write yoktur.
```

---

## 9. Bu Fazda Yapılmayacak İşler

Bu fazda bilinçli olarak yapılmayacaklar:

- Full visual design
- Figma final çizimleri
- Public storefront polish
- Payment provider implementation
- Settlement/payout core domain implementation
- Search/ranking implementation
- Production deploy

---

## 10. Owner / Guard / Permission Kuralları

### 10.1 Owner Boundary

Bu fazda korunacak sınırlar:

- Panel owner truth mutate etmez
- Admin direct DB write yapmaz
- Creator kendi store scope’u dışına çıkmaz
- Supplier kendi ürün/order scope’u dışına çıkmaz
- Support finance/order owner değildir
- Moderation content owner değildir; visibility decision command üretir
- Risk payment/order/finance truth mutate etmez
- Finance panel finance owner command kullanır

### 10.2 Guard Kuralları

Zorunlu guard aileleri:

- authentication guard
- role/scope guard
- ownership guard
- eligibility guard
- state/lifecycle guard
- risk/moderation/financial block guard
- approval guard
- audit guard
- idempotency guard

### 10.3 Permission Kuralları

- Admin permission sınırsız direct write değildir
- Creator permission global product mutation hakkı değildir
- Supplier permission commercial activation hakkı değildir
- Support permission refund execution hakkı değildir
- Moderator permission hard delete hakkı değildir
- Finance permission approval bypass hakkı değildir

### 10.4 Transition Kuralları

Korunacak ayrımlar:

- application submitted ≠ approved
- approved ≠ active
- restricted ≠ deleted
- support ticket opened ≠ refund approved
- moderation approved ≠ commercial active
- payout held ≠ payout failed
- admin action requested ≠ owner state changed

---

## 11. Riskler

### 11.1 RB-009 — Frontend / Mobile Critical Surface Acceptance Yok

Panel yüzeyleri PHASE-10’da UI acceptance alacaktır; ancak bu faz panel behavior/readiness kapsamını hazırlar.

### 11.2 Panel Direct Write Riski

Bu fazın en kritik mimari riskidir.

### 11.3 Protected Action Coverage Riski

Kritik panel action protected command değilse production güvenliği zayıflar.

### 11.4 Creator/Supplier Scope Leak Riski

Creator veya supplier kendi scope’u dışındaki ürün, order veya mağaza verisine erişirse ciddi veri güvenliği sorunu oluşur.

### 11.5 Finance/Admin Action Audit Riski

Finance veya payout action audit olmadan çalışırsa operasyonel ve yasal risk doğar.

### 11.6 Support Owner Boundary Riski

Support agent order/refund/finance truth mutate ederse owner boundary bozulur.

---

## 12. Kabul Kriterleri

PHASE-08 kapanışı için minimum kabul kriterleri:

1. Admin control tower minimum scope netleşmeli
2. Creator lifecycle management boundary doğrulanmalı
3. Creator panel store scope isolation doğrulanmalı
4. Supplier panel workbench scope isolation doğrulanmalı
5. Supplier lifecycle management boundary doğrulanmalı
6. Order operations panel owner boundary doğrulanmalı
7. Support ticket operations escalation model netleşmeli
8. Moderation panel protected command modeli doğrulanmalı
9. Risk/fraud review queue owner boundary doğrulanmalı
10. Finance/payout admin actions protected/audit’li olmalı
11. Protected action coverage listesi çıkarılmalı
12. Panel direct write source review yapılmalı
13. Critical panel route protection doğrulanmalı
14. Audit/evidence requirement listesi çıkarılmalı
15. Risk ve release blocker register güncellenmeli

---

## 13. Test / Smoke / Runtime Kanıtları

Bu faz panel/source/boundary etkili fazdır.

Minimum önerilen kanıtlar:

```text
- pnpm run typecheck
- pnpm run build
- panel route protection smoke
- protected action smoke
- creator scope isolation test
- supplier scope isolation test
- admin protected action test
- support escalation boundary review
- moderation panel action smoke
- finance admin action boundary review
- panel direct write source scan
```

UI/visual acceptance bu fazda zorunlu değildir; PHASE-10’da yapılır.

---

## 14. Kapanış Kontrol Listesi

```text
[ ] Admin control tower scope yazıldı
[ ] Creator lifecycle boundary kontrol edildi
[ ] Creator panel scope isolation kontrol edildi
[ ] Supplier panel workbench kontrol edildi
[ ] Supplier lifecycle boundary kontrol edildi
[ ] Order operations panel boundary kontrol edildi
[ ] Support ticket operations escalation kontrol edildi
[ ] Moderation panel protected command kontrol edildi
[ ] Risk/fraud review queue boundary kontrol edildi
[ ] Finance/payout admin actions kontrol edildi
[ ] Protected action coverage listesi çıkarıldı
[ ] Panel direct write source scan yapıldı
[ ] Panel route protection kontrol edildi
[ ] Audit/evidence requirements yazıldı
[ ] Targeted smoke/test kanıtı alındı
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

Ancak full visual UX PHASE-10’a devredileceği için şu karar da mümkün olabilir:

```text
PASS WITH LIMITATION
```

### PASS Şartı

- Panel direct write yok
- Protected action coverage tamam
- Creator/supplier/admin/support scope isolation doğru
- Critical admin/finance/moderation actions audit’li
- Targeted panel/boundary tests PASS

### PASS WITH LIMITATION Şartı

- Behavior ve boundary doğru
- Full UI/visual design PHASE-10’a kontrollü devredildi
- Release blocker niteliğinde panel security riski yok

### PARTIAL Şartı

- Protected action coverage eksik
- Panel direct write scan eksik
- Creator/supplier scope isolation belirsiz
- Test kanıtı eksik

### FAIL Şartı

- Panel direct write var
- Admin owner dışı mutation yapıyor
- Creator/supplier scope leak var
- Finance/admin action audit’siz çalışıyor
- Support order/refund/finance truth mutate ediyor

---

## 16. Sonraki Faza Devredenler

PHASE-09’a devredenler:

- risk/fraud scoring queues
- analytics/event coverage
- notification preference/consent
- outbox/worker operationalization

PHASE-10’a devredenler:

- admin panel screen design
- creator panel page drawings
- supplier panel page drawings
- support panel UX
- moderation/risk/finance dashboard UX
- mobile-first panel flows

PHASE-11’e devredenler:

- creator onboarding critical journey
- supplier onboarding critical journey
- support/moderation/fraud escalation critical journey

PHASE-12’ye devredenler:

- panel deployment security
- admin action observability
- audit retention / compliance review

---

## 17. Nihai Faz Açılış Kararı

PHASE-08 şu şartla başlatılabilir:

```text
PHASE-07 Search / Catalog / Ranking / Taxonomy Readiness en az PASS WITH LIMITATION olarak kapanmış olmalıdır.
```

Planlama seviyesi için bu dosya hazırdır.

Gerçek uygulama/kapanış için repo source review, panel route/action review, targeted tests ve boundary review gereklidir.

Net açılış kararı:

```text
PHASE-08 Admin / Creator / Supplier / Support Panel Readiness planı hazırdır.
```
