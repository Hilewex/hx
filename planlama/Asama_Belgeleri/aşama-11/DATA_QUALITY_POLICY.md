# DATA_QUALITY_POLICY

## 1. Amaç

Bu dosya, platformun event, audit, metric ve decision signal akışlarında veri kalitesini korumak için gerekli bağlayıcı politika setini tanımlar.

Bu dosyanın amacı:

* duplicate, late, out-of-order, replay ve correction davranışlarını tek doğrulu hale getirmek
* unknown-result ve reconciliation alanlarında sessiz veri bozulmasını engellemek
* anonymous -> authenticated kimlik bağlama sürecinde history bütünlüğünü korumak
* analytics, audit, ranking, risk ve finance tarafında aynı veri kalite dilini kurmaktır

Net kural:

* Veri kalite sorunu sessiz başarı sayılmaz
* Duplicate veri tekilleştirilmeden başarı metriğine karışmaz
* Late event history’de tutulabilir; ama canonical truth’u geriye dönük bozmaz
* Replay, correction ve rebuild ayrı davranış sınıflarıdır
* Unknown-result first-class veri kalite ve sonuç durumudur

---

## 2. Kapsam

Bu politika ilk fazda aşağıdaki alanları kapsar:

1. duplicate event policy
2. late / out-of-order event policy
3. replay ve rebuild policy
4. correlation / lineage policy
5. anonymous -> login identity bind policy
6. unknown-result ve reconciliation policy
7. audit quality guard’ları
8. metric quality guard’ları
9. finance / settlement / payout quality guard’ları
10. moderation / risk quality guard’ları
11. quarantine / discard policy

Bu dosya aşağıdaki alanları bilinçli olarak detaylandırmaz:

* storage engine seçimi
* streaming altyapısı detayları
* warehouse fiziksel model tasarımı
* exhaustive retention / purge operasyon matrisi
* her provider için tam teknik callback standardı

---

## 3. Temel kalite ilkeleri

### DQ-001 — Canonical truth overwrite edilmez

**Binding Rule:** Geç gelen, duplicate veya replay edilmiş veri owner truth’u sessizce geriye dönük değiştiremez.

### DQ-002 — Duplicate-safe işleme zorunludur

**Binding Rule:** Özellikle callback, async completion, refund, payout, settlement ve entitlement alanlarında aynı niyet ikinci kez yeni etki üretemez.

### DQ-003 — Late event kabul edilebilir ama aynı muameleyi görmez

**Binding Rule:** Late veri analytics/history katmanında kabul edilebilir; fakat state-finalization ve finance truth üzerinde doğrudan overwrite etkisi üretmez.

### DQ-004 — Replay, rebuild ve correction aynı şey değildir

**Binding Rule:** Replay geçmiş girdiyi yeniden işler, rebuild mevcut referanslardan projection kurar, correction ise yeni resmi sonuç üretir.

### DQ-005 — Unknown-result ayrı kalite sınıfıdır

**Binding Rule:** Timeout, provider ambiguity veya yarım kalan callback success/failure’a zorlanmadan ayrı tutulur.

### DQ-006 — Identity bind history-first yaklaşımıyla ele alınır

**Binding Rule:** Guest ve authenticated davranışlar sonradan bağlanabilir; geçmiş event history fiziksel silme veya sessiz overwrite ile yeniden yazılmaz.

### DQ-007 — Correction eski kaydı sessiz değiştirmez

**Binding Rule:** Event, audit, finance veya metric correction gerekiyorsa yeni kayıt veya açık correction mekanizması kullanılır.

### DQ-008 — Finance alanında duplicate ve attribution hatası kritik kalite ihlalidir

**Binding Rule:** Duplicate payment/refund/payout etkisi ve sponsor attribution eksikliği kritik veri kalite sorunu kabul edilir.

---

## 4. Veri kalite durum ailesi

Canonical `data_quality_state` ailesi:

* `clean`
* `duplicate_detected`
* `late_arrival`
* `out_of_order`
* `replayed`
* `partially_correlated`
* `unknown_result`
* `reconciled`
* `discarded`
* `quarantined`

Net kural:

* `duplicate_detected` ile `discarded` aynı şey değildir
* `late_arrival` ile `out_of_order` aynı şey değildir
* `unknown_result` ile `failed` aynı şey değildir
* `quarantined` incelemeye alınmış ama lineage’i korunan veri sınıfıdır

---

## 5. Duplicate event policy

### DQ-010 — Duplicate tespiti canonical correlation alanlarıyla yapılır

**Binding Rule:** Kritik alanlarda duplicate detection en az şu ailelerden biriyle yapılmalıdır:

* `event_id`
* `idempotency_key`
* `provider_ref`
* `correlation_id`
* domain-specific unique transition reference

### DQ-011 — Duplicate veri başarı sayımına ikinci kez girmez

**Binding Rule:** Duplicate event count, conversion, payout success, reward grant veya settlement success metriğine ikinci kez katkı vermez.

### DQ-012 — Duplicate işleme alan bazlı farklı olabilir

**Binding Rule:**

* raw layer duplicate history tutabilir
* normalized layer canonical tekilliğe indirger
* finance/order/payout alanı duplicate etkiyi sıfır toleransla engeller

### DQ-013 — Duplicate sonucu explicit canonical state üretir

**Binding Rule:** `duplicate_ignored` veya eşdeğer canonical sonuç kullanılır; sessiz yutma tercih edilmez.

### DQ-014 — Duplicate callback mevcut başarılı sonucu bozamaz

**Binding Rule:** Aynı provider success callback’i yeniden gelse bile mevcut canonical success sessizce yeniden işlenmez.

---

## 6. Late / out-of-order event policy

### DQ-020 — Late event history’de kabul edilebilir

**Binding Rule:** Geç gelen event analytics ve lineage katmanında saklanabilir; ama truth overwrite aracı değildir.

### DQ-021 — Out-of-order ayrı kalite işaretidir

**Binding Rule:** Olayın gerçekleşme sırası ile alınma sırası uyuşmuyorsa `out_of_order` işareti korunmalıdır.

### DQ-022 — Late event metric penceresine kontrollü girer

**Binding Rule:** Late veri metriğe dahil ediliyorsa hangi pencereye nasıl yazıldığı açık politika ile belirlenir; sessiz yeniden dağıtım yapılmaz.

### DQ-023 — Late finance event correction ister

**Binding Rule:** Finansal alanda geç gelen bilgi mevcut truth’u overwrite etmez; correction veya reconciliation akışı başlatır.

### DQ-024 — Late delivery / return event entitlement recompute başlatabilir

**Binding Rule:** Review/story/reward entitlement etkileri recompute mantığıyla ele alınır; sessiz hak aç/kapa yapılmaz.

---

## 7. Replay / rebuild / correction policy

### DQ-030 — Replay yeniden işleme hareketidir

**Binding Rule:** Replay geçmiş raw/normalized event akışını yeniden işler; yeni business truth üretme shortcut’ı değildir.

### DQ-031 — Replay işaretlenmeden çalıştırılamaz

**Binding Rule:** Replay çıktısı `replayed` veya eşdeğer bağlam işareti taşımalıdır.

### DQ-032 — Replay ikinci finansal veya ticari etki üretemez

**Binding Rule:** Replay ikinci order, ikinci settlement, ikinci payout, ikinci refund veya ikinci reward grant üretemez.

### DQ-033 — Rebuild replay’den ayrıdır

**Binding Rule:** Rebuild mevcut history ve canonical refs üzerinden projection veya derived state yeniden kurar; raw event replay ile aynı işlem sınıfı değildir.

### DQ-034 — Correction yeni resmi sonuç üretir

**Binding Rule:** Rebuild veya reconciliation sırasında fark tespit edilirse eski kayıt sessizce değiştirilmez; correction/reconciliation kaydı üretilir.

### DQ-035 — Correction lineage zorunludur

**Binding Rule:** Yeni correction kaydı hangi eski kayıt/olay/line ile ilişkili olduğunu correlation/ref alanlarıyla göstermelidir.

---

## 8. Correlation / lineage policy

### DQ-040 — Kritik zincirlerde correlation zorunludur

**Binding Rule:** Search -> PDP -> cart -> checkout -> payment -> order ve order -> shipment -> delivery -> return/refund zincirlerinde correlation alanları korunmalıdır.

### DQ-041 — Derived metric ve signal lineage görünür olmalıdır

**Binding Rule:** Derived metric veya decision signal hangi canonical source event ailesinden türediğini izlenebilir kılmalıdır.

### DQ-042 — Cross-domain correction lineage zorunludur

**Binding Rule:** Refund correction, settlement adjustment, payout hold/release, reward revoke ve entitlement recompute zincirlerinde önceki kayıtla bağ kurulmalıdır.

### DQ-043 — Quarantined veri lineage kaybetmez

**Binding Rule:** İncelemeye alınan veri correlation bağlamı korunarak quarantine edilir.

### DQ-044 — Correlation eksik kritik async kayıt canonical kabul edilmez

**Binding Rule:** Provider-driven payment/payout/refund gibi alanlarda correlation eksikliği quality sorunudur; quarantine veya unknown-result sınıfı uygulanır.

---

## 9. Anonymous -> authenticated identity bind policy

### DQ-050 — Guest ve authenticated history ayrı başlar

**Binding Rule:** Guest session event’leri ile authenticated session event’leri başlangıçta ayrı actor/auth_state bağlamında tutulur.

### DQ-051 — Identity bind yeni ilişki üretir, geçmişi silmez

**Binding Rule:** Login sonrası guest davranış ve sepet hesapla bağlanabilir; geçmiş raw event history fiziksel olarak yeniden yazılmaz.

### DQ-052 — Bind olayı canonical kayıt üretir

**Binding Rule:** `identity_bound_from_guest` veya eşdeğer canonical event/audit kaydı zorunludur.

### DQ-053 — Bind sonrası attribution politikası açık olmalıdır

**Binding Rule:** Guest davranışın hangi kısmının authenticated kullanıcıya bağlanacağı sessiz ve keyfi biçimde değil, açık canonical politika ile belirlenir.

### DQ-054 — Guest commerce geçmişi sonradan social entitlement üretmez

**Binding Rule:** Guest ödeme/sipariş geçmişi, sonradan login oldu diye geriye dönük review/story/reward hakkı açılmış gibi yorumlanmaz.

### DQ-055 — Cart merge duplicate commerce etkisi üretemez

**Binding Rule:** Guest cart ile authenticated cart birleşmesi yeni order intent veya duplicate add_to_cart metriği üretmez.

---

## 10. Unknown-result / reconciliation policy

### DQ-060 — Unknown-result ayrı canonical sonuç sınıfıdır

**Binding Rule:** Timeout, provider ambiguity, half-confirmed callback veya correlation eksikliği success/failure’a zorlanmaz.

### DQ-061 — Unknown-result durumunda finalization beklemeye alınır

**Binding Rule:** Payment, refund, payout gibi kritik alanlarda reconciliation veya review süreci çalışır.

### DQ-062 — Reconciliation eski kaydı sessiz overwrite etmez

**Binding Rule:** Unknown-result sonradan netleşse bile bu sonuç yeni event/audit/correction kaydıyla history’ye eklenir.

### DQ-063 — Unknown-result başarı metriğine karışmaz

**Binding Rule:** Payment success, payout success, refund completion gibi metriklerde unknown-result ayrı tutulur.

### DQ-064 — Uzun süre çözülmeyen unknown-result escalation gerektirir

**Binding Rule:** Belirli SLA penceresinde çözülemeyen belirsiz sonuçlar operasyonel veya finansal inceleme kuyruğuna düşmelidir.

### DQ-065 — Reconciliation sonucu correction lineage taşımalıdır

**Binding Rule:** Reconciled kayıt hangi unknown-result veya hangi callback zincirini kapattığını correlation/ref ile göstermelidir.

---

## 11. Analytics data quality guard’ları

### DQ-070 — Context’siz raw event canonical normalized event’e dönüşmez

**Binding Rule:** Surface, actor, object veya minimal result bağlamı olmayan kayıt canonical normalized event kabul edilmez; quarantine veya discard uygulanır.

### DQ-071 — Numerator / denominator kalite koruması zorunludur

**Binding Rule:** Duplicate, unknown-result ve invalid correlation event’leri rate metric’lerine sessizce karışmaz.

### DQ-072 — No-result ve degraded ayrı ölçülür

**Binding Rule:** Search gibi alanlarda gerçek no-result ile teknik degraded sonuç aynı metriğe yazılmaz.

### DQ-073 — Preview ve final outcome ayrı ölçülür

**Binding Rule:** Cart preview, coupon preview, optimistic UI state ve final checkout/order outcome ayrı metric ailelerinde tutulur.

### DQ-074 — Replayed veri raw history’de kalabilir ama production KPI’ına doğrudan karışmaz

**Binding Rule:** Replay veya rebuild kaynaklı kayıtlar KPI hesaplarına kontrollü dahil edilir.

---

## 12. Audit data quality guard’ları

### DQ-080 — Audit minimal alanlar olmadan canonical değildir

**Binding Rule:** actor, action, target, created_at ve result_state olmayan kayıt canonical audit kabul edilmez.

### DQ-081 — Correction yeni audit üretir

**Binding Rule:** Audit geçmişi in-place update ile düzeltilmez; correction/reconciliation kaydı eklenir.

### DQ-082 — Execution mode eksikliği kalite sorunudur

**Binding Rule:** manual / system / provider / reconciliation ayrımı olmayan audit eksik kabul edilir.

### DQ-083 — Reason eksik kritik audit quarantine edilebilir

**Binding Rule:** Restriction, suspension, payout hold, moderation takedown gibi kararlar reason_code olmadan temiz audit sayılmaz.

### DQ-084 — Accepted / completed / reconciled audit karışmaz

**Binding Rule:** Bu sonuç sınıfları tek kaba audit sonucu altında ezilmez.

---

## 13. Finance / settlement / payout quality guard’ları

### DQ-090 — Finance alanında duplicate etki sıfır toleranslıdır

**Binding Rule:** Duplicate payment success, duplicate settlement create, duplicate payout line ve duplicate refund completion ikinci finansal etki üretemez.

### DQ-091 — Settled / payable / paid_out ayrı kalite kontrolleriyle izlenir

**Binding Rule:** Bu üç aşama state, audit ve metric düzeyinde ayrı ele alınır; tek başarı sayısına indirgenmez.

### DQ-092 — Sponsor attribution eksikliği kritik kalite sorunudur

**Binding Rule:** Coupon/campaign indirim etkisi kime yazıldığı belli değilse settlement canonical kabul edilmez; quarantine veya correction gerekir.

### DQ-093 — Return/refund correction line-level çalışmalıdır

**Binding Rule:** Kısmi iade veya correction order-total kaba düzeltme ile geçiştirilemez.

### DQ-094 — Unknown-result payment veya payout final success sayılmaz

**Binding Rule:** Reconciliation bitmeden success KPI ve payout completion KPI içine dahil edilmez.

### DQ-095 — Payable batch ve paid batch ayrımı korunur

**Binding Rule:** Batch created veya payable marked olması paid_out kabul edilmez.

---

## 14. Moderation / risk quality guard’ları

### DQ-100 — Moderation ve risk sinyali ayrı tutulur

**Binding Rule:** İçerik güvenliği ile abuse/anomaly kaynağı tek quality alanında ezilmez.

### DQ-101 — UGC visibility correction history-first çalışır

**Binding Rule:** Review/story/question için visible -> restricted / taken_down / archived geçişleri replay-safe ve auditlenebilir olmalıdır.

### DQ-102 — Risk hold/release duplicate-safe çalışır

**Binding Rule:** Aynı hold veya release tekrar işlense bile yeni hak etkisi üretmemelidir.

### DQ-103 — Entitlement recompute correlation zorunludur

**Binding Rule:** Return sonrası reward, trust veya visibility recompute akışlarında source order_line / delivery / return ref kaybolmamalıdır.

### DQ-104 — Moderation takedown ile user delete aynı correction ailesine karışmaz

**Binding Rule:** İki davranışın lineage ve quality yorumu ayrı tutulur.

---

## 15. Quarantine / discard policy

### DQ-110 — Quarantine geri izlenebilir veri sınıfıdır

**Binding Rule:** Güvenilmeyen ama incelemeye değer veri quarantine edilir; lineage korunur.

### DQ-111 — Discard son çare davranıştır

**Binding Rule:** Minimal korelasyon veya güvenlik gerekçesiyle kullanılamayan veri discard edilebilir; discard nedeni kayıt altına alınmalıdır.

### DQ-112 — Quarantine veri başarı metriğine karışmaz

**Binding Rule:** Quarantine altındaki veri temiz metric ve signal hesaplarına doğrudan katılmaz.

### DQ-113 — Quarantine’den clean/reconciled çıkış açık olayla işaretlenmelidir

**Binding Rule:** İnceleme sonrası temizlenen veya uzlaştırılan veri quality_state geçişiyle açıkça işaretlenir.

---

## 16. Faz-1 minimum veri kalite zorunluluk seti

İlk fazda aşağıdaki alanlarda veri kalite guard’ları zorunludur:

1. payment callback duplicate / unknown-result / reconciliation
2. order create duplicate-safe davranış
3. coupon apply duplicate/reject/final-checkout ayrımı
4. settlement correction ve sponsor attribution
5. payout payable / paid / failed ayrımı
6. delivery entitlement open / revoke / recompute
7. reward pending / spendable / revoke zinciri
8. identity bind ve cart merge
9. moderation takedown history
10. search no-result / degraded / result click ayrımı

---

## 17. Faz-1 dışında bırakılan alanlar

* tam warehouse backfill prosedürü
* gelişmiş event-time watermarking stratejisi
* her provider için exhaustive kalite matrisi
* full legal retention ve e-discovery politikası
* exhaustive purge / compaction akışları

---

## 18. Kısa sonuç

Bu politika ile aşağıdaki çekirdek veri kalite kararları sert biçimde sabitlenmiş olur:

* Duplicate, late, out-of-order, replay, rebuild ve correction aynı şey değildir
* Canonical truth sessiz overwrite edilmez
* Unknown-result first-class kalite ve sonuç durumudur
* Replay yeni finansal veya ticari etki üretemez
* Identity bind history-first yaklaşımıyla çalışır
* Audit correction yeni kayıtla yapılır
* Finance alanında duplicate ve sponsor-attribution hatası kritik kalite sorunudur
* Quarantine ve discard ayrı davranış sınıflarıdır

Bu dosya, Aşama 11’in bağlayıcı ve yoruma kapalı veri kalite politikasıdır.
