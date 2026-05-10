# 09-RELEASE_BLOCKER_REGISTER.md

## 1. Dosyanın Amacı

Bu dosya, Hedihup platformunun production release öncesinde yayına çıkışı doğrudan engelleyebilecek maddeleri takip etmek için hazırlanmıştır.

Bu dosya genel risk register değildir.

Bu dosyanın amacı:

- release öncesi mutlaka kapanması gereken blocker’ları tek yerde toplamak
- her blocker için kapanış kriteri belirlemek
- blocker’ın hangi fazda kapatılacağını göstermek
- production-ready iddiasının hangi şartlara bağlı olduğunu netleştirmek
- final release gate sırasında Go / No-Go kararına doğrudan kaynak sağlamaktır

---

## 2. Release Blocker Tanımı

Bir madde aşağıdaki durumlardan birini taşıyorsa release blocker kabul edilir:

- canlı ödeme / sipariş / finans akışını kırma riski varsa
- kullanıcıya yanlış kesin sonuç gösterme riski varsa
- duplicate order, duplicate payout veya yanlış finansal mutation riski varsa
- owner boundary ihlali yaratıyorsa
- critical journey’lerden biri production seviyesinde kapanmamışsa
- deployment / rollback / observability / security kapısı kapanmamışsa
- release sonrası telafisi zor veri veya para kaybı riski varsa

---

## 3. Release Blocker Durumları

Her blocker aşağıdaki statülerden biriyle takip edilir:

- `OPEN`
- `IN PROGRESS`
- `CLOSED`
- `ACCEPTED WITH EXECUTIVE LIMITATION`
- `DEFERRED - RELEASE NOT ALLOWED`

Net kural:

```text
OPEN blocker varken production-ready kararı verilemez.
```

---

## 4. Kapanış Kanıtı Standardı

Bir release blocker yalnız şu şartlarla kapanabilir:

- ilgili fazda ele alınmış olmalı
- source/boundary review yapılmış olmalı
- gerekiyorsa typecheck/build geçmeli
- ilgili targeted smoke veya acceptance senaryosu geçmeli
- risk register güncellenmeli
- blocker kapanış notu yazılmalı

Kod etkisi olmayan blocker’larda test yerine resmi karar, kapsam dışı kayıt ve release owner onayı gerekir.

---

# 5. Aktif Release Blocker Listesi

---

## RB-001 — Production-ready kararı henüz verilmedi

**Durum:** OPEN  
**Seviye:** CRITICAL  
**İlgili Risk:** PRR-001  
**Hedef Faz:** PHASE-12

### Açıklama

Mevcut resmi durum foundation-level release candidate accepted seviyesidir. Production-ready iddiası yoktur.

### Neden Blocker?

Production-ready kararı olmadan canlı yayın kararı verilemez.

### Kapanış Kriteri

- Tüm release blocker kayıtları kapatılmış olmalı
- PHASE-11 Critical Journey Acceptance PASS almalı
- PHASE-12 Release Gate PASS almalı
- Final Go / No-Go kararı verilmiş olmalı

---

## RB-002 — Canlı PayTR / gerçek provider ödeme doğrulaması yok

**Durum:** OPEN  
**Seviye:** CRITICAL  
**İlgili Risk:** PRR-002  
**Hedef Faz:** PHASE-03

### Açıklama

Provider boundary, callback, PayTR status inquiry mapping ve reconciliation foundation vardır. Ancak canlı/sandbox PayTR gerçek HTTP request ve provider E2E doğrulaması yoktur.

### Neden Blocker?

Gerçek ödeme sağlayıcı doğrulanmadan checkout → payment → payment result hattı canlı yayına güvenli çıkamaz.

### Kapanış Kriteri

- PayTR sandbox/live strategy onaylandı
- Credential/config/secrets modeli doğrulandı
- Successful payment provider response canonical mapping ile işlendi
- Failed / timeout / unknown_result davranışları kanıtlandı
- Provider sonucu business truth kabul edilmeden owner command zinciri çalıştı
- İlgili smoke / integration senaryoları PASS

---

## RB-003 — Payment succeeded → Order handoff yok

**Durum:** OPEN  
**Seviye:** CRITICAL  
**İlgili Risk:** PRR-003  
**Hedef Faz:** PHASE-03 / PHASE-04

### Açıklama

HARDENING-10C10 hattı payment reconciliation ve controlled payment mutation’ı kapatmıştır. Ancak order handoff özellikle kapsam dışı bırakılmıştır.

Korunan kural:

```text
Payment succeeded ≠ order created
```

### Neden Blocker?

Kullanıcıdan ödeme alınıp order oluşturulmaması veya duplicate order oluşturulması canlı sistemde kritik ticari ve finansal hatadır.

### Kapanış Kriteri

- 10C11 order handoff boundary inventory tamamlandı
- Order owner command modeli belirlendi
- Payment success sonrası order create yalnız order owner üzerinden çalışıyor
- Duplicate payment success duplicate order üretmiyor
- Failed / cancelled / unknown_result payment order oluşturamıyor
- Risk hold varsa handoff davranışı tanımlı
- Acceptance senaryosu PASS

---

## RB-004 — Reconciliation production runtime yok

**Durum:** OPEN  
**Seviye:** HIGH  
**İlgili Risk:** PRR-004  
**Hedef Faz:** PHASE-03 / PHASE-12

### Açıklama

Reconciliation task, repository, dry-run worker, controlled mutation, audit/outbox evidence vardır. Ancak scheduler/queue/background worker runtime, claim/retry/concurrency ve observability yoktur.

### Neden Blocker?

Unknown_result veya pending ödemeler production ortamda otomatik ve güvenli kapanmazsa kullanıcı ve order lifecycle belirsiz kalır.

### Kapanış Kriteri

- Worker runtime modeli netleşti
- Claim/lock/concurrency duplicate mutation engeli var
- Retry/backoff/max attempt/manual review davranışı tanımlı
- Worker observability ve alerting var
- Reconciliation scenario integration test PASS

---

## RB-005 — Critical journey acceptance tamamlanmadı

**Durum:** OPEN  
**Seviye:** CRITICAL  
**İlgili Risk:** PRR-020  
**Hedef Faz:** PHASE-11

### Açıklama

13 kritik journey tanımlıdır. Bazıları foundation veya smoke seviyesinde doğrulanmıştır. Ancak release acceptance seviyesinde success/fail/rollback/guard/audit/analytics kontrolleri tamamlanmamıştır.

### Neden Blocker?

Kritik kullanıcı ve ticari journey’ler production acceptance almadan yayın kararı verilemez.

### Kapanış Kriteri

Aşağıdaki journey’lerin tamamı release acceptance almalıdır:

1. search → PDP
2. PDP → cart
3. cart → checkout
4. checkout → payment
5. payment → order
6. order → shipment
7. delivery → review/story eligibility
8. delivery → return/refund impact
9. coupon/campaign application
10. reward point flow
11. creator onboarding
12. supplier onboarding
13. support/moderation/fraud escalations

Her journey için:

- success case PASS
- fail case PASS
- rollback/retry/unknown-result davranışı net
- permission/guard etkisi doğrulandı
- analytics/audit görünürlüğü doğrulandı

---

## RB-006 — PX-HAVUZ-05 PARTIAL build borcu

**Durum:** OPEN  
**Seviye:** HIGH  
**İlgili Risk:** PRR-005  
**Hedef Faz:** PHASE-02

### Açıklama

PX-HAVUZ-05 smoke PASS olsa da build hatası raporlanmıştır. Bu kayıt PASS gibi ele alınamaz.

### Neden Blocker?

Havuz / creator store commercial product binding hattı commerce core ve creator storefront satış bağlamını etkiler. Build borcu kapanmadan production-readiness temiz kabul verilemez.

### Kapanış Kriteri

- PX-HAVUZ-05 kaynak hatası incelendi
- Build hatası kapatıldı
- `pnpm run build` PASS
- Gerekli typecheck/smoke PASS
- Closure kararı güncellendi

---

## RB-007 — Refund / settlement / payout E2E yok

**Durum:** OPEN  
**Seviye:** HIGH  
**İlgili Risk:** PRR-010 / PRR-011  
**Hedef Faz:** PHASE-05

### Açıklama

Refund, settlement ve payout foundation vardır. Ancak return/refund → settlement adjustment → payable → payout zinciri production E2E kabul seviyesinde kapatılmamıştır.

### Neden Blocker?

Finansal dağıtım, hakediş, refund düzeltmesi ve payout çıkışı canlı sistemde para kaybı veya yanlış ödeme riski doğurabilir.

### Kapanış Kriteri

- Return approved ≠ refund completed ayrımı doğrulandı
- Refund completed → settlement adjustment test PASS
- Settled ≠ payable ayrımı doğrulandı
- Payable ≠ paid_out ayrımı doğrulandı
- Payout provider boundary / sandbox stratejisi doğrulandı
- Failed payout retry / hold davranışı net
- Finance owner boundary PASS

---

## RB-008 — Payout gerçek ödeme çıkışı / provider runtime yok

**Durum:** OPEN  
**Seviye:** HIGH  
**İlgili Risk:** PRR-011  
**Hedef Faz:** PHASE-05 / PHASE-12

### Açıklama

Payout provider boundary foundation vardır. Ancak gerçek payout provider runtime, batch execution, retry, account verification ve risk hold integration tamamlanmamıştır.

### Neden Blocker?

Fenomen ve tedarikçi hakedişleri yanlış veya kontrolsüz ödenirse telafisi zor finansal risk oluşur.

### Kapanış Kriteri

- Payout provider strategy net
- Batch runtime ve retry/failure behavior var
- Minimum payment threshold / hold / release kontrolleri çalışıyor
- Risk hold payout çıkışını engelleyebiliyor
- Sandbox veya controlled provider test PASS
- Payout audit kanıtı var

---

## RB-009 — Frontend / mobile critical surface acceptance yok

**Durum:** OPEN  
**Seviye:** HIGH  
**İlgili Risk:** PRR-019  
**Hedef Faz:** PHASE-10 / PHASE-11

### Açıklama

Backend foundation ve BFF smoke’ları vardır. Ancak kullanıcı yüzeylerinin gerçek release acceptance seviyesi doğrulanmamıştır.

### Neden Blocker?

Checkout, payment, order tracking, return/refund, support gibi yüzeylerde kullanıcı doğru yönlendirilmezse sistem çalışsa bile ürün yayınlanabilir kabul edilemez.

### Kapanış Kriteri

- Storefront critical journeys UI üzerinden doğrulandı
- Mobile/responsive checkout/payment/order tracking minimum PASS
- Error/degraded/unknown-result UI yanıltıcı değil
- Creator/supplier/admin panel minimum surface acceptance PASS
- UI truth üretmiyor

---

## RB-010 — Deployment / observability / security release gate yok

**Durum:** OPEN  
**Seviye:** CRITICAL  
**İlgili Risk:** PRR-021  
**Hedef Faz:** PHASE-12

### Açıklama

Local runtime ve smoke altyapısı vardır. Ancak production deployment, secrets/config hardening, observability, alerting, backup/restore, rollback ve incident response gate kapanmamıştır.

### Neden Blocker?

Sistem teknik olarak çalışsa bile production ortamda izlenebilir, geri alınabilir ve güvenli değilse canlı yayın yapılamaz.

### Kapanış Kriteri

- Production environment readiness PASS
- CI/CD veya deployment prosedürü net
- Secrets/config review PASS
- Migration apply/rollback planı var
- Logging/tracing/metrics/alerting minimum set var
- Backup/restore planı var
- Rollback planı var
- Final smoke/regression PASS
- Go / No-Go release kararı verildi

---

## RB-011 — Owner boundary kritik ihlal taraması tamamlanmadı

**Durum:** OPEN  
**Seviye:** HIGH  
**İlgili Risk:** PRR-Architecture  
**Hedef Faz:** PHASE-01

### Açıklama

Owner boundary kuralı anayasal olarak sabittir. Foundation/hardening kayıtları olumlu olsa da production-readiness öncesinde tüm kritik domainlerde tekrar source/boundary review yapılmalıdır.

### Neden Blocker?

Owner dışı write, BFF mutation, panel direct write veya event ile state mutation canlı sistemde veri tutarlılığını bozar.

### Kapanış Kriteri

- BFF write taraması tamamlandı
- Panel direct write taraması tamamlandı
- Owner dışı service mutation taraması tamamlandı
- Event/audit/outbox business mutation yerine geçmiyor
- Kritik ihlal yok veya kapatıldı

---

## RB-012 — Kupon / kampanya finansal etki ve abuse kontrolü doğrulanmadı

**Durum:** OPEN  
**Seviye:** HIGH  
**İlgili Risk:** PRR-025  
**Hedef Faz:** PHASE-02 / PHASE-05 / PHASE-09

### Açıklama

Kupon ve kampanya sistemleri checkout, order snapshot, finance settlement ve fraud risk alanlarını etkiler. Sponsor maliyet modeli doğrulanmadan canlı indirim sistemleri risklidir.

### Neden Blocker?

İndirim maliyetinin yanlış tarafa yazılması veya abuse edilmesi finansal kayıp doğurabilir.

### Kapanış Kriteri

- Coupon sponsor modeli net
- Platform/fenomen destekli kupon ayrımı çalışıyor
- Checkout/order snapshot doğru
- Settlement impact doğru
- Coupon abuse risk signal çalışıyor
- Coupon/campaign critical journey PASS

---

## RB-013 — Risk / fraud minimum production koruma seti tamamlanmadı

**Durum:** OPEN  
**Seviye:** HIGH  
**İlgili Risk:** PRR-022 / PRR-025 / PRR-024  
**Hedef Faz:** PHASE-09 / PHASE-12

### Açıklama

Risk/fraud foundation ve advisory signals vardır. Ancak full fraud scoring, auto hold/block, distributed rate limit/WAF ve payout/finance abuse workflow eksiktir.

### Neden Blocker?

Canlı ödeme, kupon, puan, payout ve provider callback yüzeyleri abuse’a açık kalabilir.

### Kapanış Kriteri

- Minimum fraud/risk release scope belirlendi
- Public critical endpoints distributed protection altında
- Coupon/point/payout abuse signals çalışıyor
- High-risk actions review/hold üretebiliyor
- False positive / manual review davranışı net

---

## RB-014 — Search / taxonomy / ranking leak kontrolü tamamlanmadı

**Durum:** OPEN  
**Seviye:** MEDIUM  
**İlgili Risk:** PRR-012 / PRR-013 / PRR-014  
**Hedef Faz:** PHASE-07

### Açıklama

Search/catalog foundation ve hardening vardır. Ancak taxonomy owner, ranking owner, OpenSearch production ops ve hidden/unavailable leak kontrolü tam kapanmamıştır.

### Neden Blocker?

Yayında görünmemesi gereken ürün, mağaza veya içerik arama/PLP/keşfet yüzeyinden leak ederse güven ve ticari risk oluşur.

### Kapanış Kriteri

- Hidden/unavailable/archived leak test PASS
- Search candidate owner ile ranking owner ayrımı korunuyor
- Taxonomy truth owner net
- Index worker/reindex/recovery planı var
- Degraded search behavior net

---

## RB-015 — Media production pipeline ve güvenli yayın gate’i yok

**Durum:** OPEN  
**Seviye:** MEDIUM  
**İlgili Risk:** PRR-015  
**Hedef Faz:** PHASE-06 / PHASE-12

### Açıklama

Media foundation vardır. Ancak raw upload → processing → moderation → publishable asset lifecycle production seviyesinde doğrulanmamıştır.

### Neden Blocker?

Bozuk, ağır, uygunsuz veya güvenlik riski taşıyan medya public yüzeylere çıkabilir.

### Kapanış Kriteri

- Raw upload doğrudan yayınlanmıyor
- Derivative/thumbnail/video processing strategy net
- Media moderation/policy gate var
- Broken/unsafe media public yüzeye çıkmıyor
- CDN/object storage strategy net

---

# 6. Blocker Öncelik Sırası

## 6.1 İlk Kapatılması Gerekenler

1. RB-011 — Owner boundary kritik ihlal taraması
2. RB-006 — PX-HAVUZ-05 build borcu
3. RB-002 — Canlı PayTR / provider doğrulaması
4. RB-003 — Payment succeeded → order handoff
5. RB-004 — Reconciliation production runtime

## 6.2 Orta Fazda Kapatılması Gerekenler

6. RB-007 — Refund / settlement / payout E2E
7. RB-008 — Payout gerçek ödeme çıkışı
8. RB-012 — Coupon/campaign finance impact
9. RB-013 — Risk/fraud minimum koruma seti
10. RB-014 — Search/taxonomy/ranking leak kontrolü
11. RB-015 — Media production pipeline

## 6.3 Son Fazda Kapatılması Gerekenler

12. RB-009 — Frontend/mobile critical surface acceptance
13. RB-005 — Critical journey acceptance
14. RB-010 — Deployment/observability/security release gate
15. RB-001 — Final production-ready decision

---

## 7. Release Karar Kuralı

Production release için şu kural geçerlidir:

```text
RB-001 ancak RB-002’den RB-015’e kadar tüm blocker’lar CLOSED olduktan sonra kapatılabilir.
```

Eğer bir blocker `ACCEPTED WITH EXECUTIVE LIMITATION` olarak bırakılacaksa:

- açıkça yazılmalı
- etkilediği kullanıcı/finans/operasyon alanı belirtilmeli
- rollback veya mitigation planı bulunmalı
- production-ready iddiasının kapsamı daraltılmalı

---

## 8. Faz Kapanışlarında Bu Dosyanın Kullanımı

Her faz kapanışında:

- ilgili blocker’lar kontrol edilir
- kapatılan blocker `CLOSED` yapılır
- kapanmayan blocker yeni hedef faza taşınır
- yeni blocker tespit edilirse bu dosyaya eklenir
- release gate fazına kadar hiçbir blocker sessiz bırakılmaz

---

## 9. Nihai Not

Bu dosya production-ready kararı vermez.

Bu dosya, production-ready kararını engelleyen aktif blocker’ları görünür tutar.

Net karar:

```text
RELEASE_BLOCKER_REGISTER V1 hazırdır.
Production release için tüm OPEN blocker’lar kapanmadan Go kararı verilemez.
```
