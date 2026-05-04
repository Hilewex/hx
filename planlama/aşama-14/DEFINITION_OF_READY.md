# DEFINITION_OF_READY

## 1. Amaç

Bu dosya, bir işin, PACK’in, modülün veya aşama alt kaleminin gerçekten kodlamaya hazır sayılabilmesi için gerekli asgari şartları bağlayıcı biçimde tanımlar.

Bu dosyanın amacı:

* “başlayalım, detayları sonra netleştiririz” yaklaşımını engellemek
* owner boundary, kapsam, kabul ölçütü, contract ve test beklentisi netleşmeden kodlamaya girilmesini önlemek
* repo, branch, engineering ve test stratejisiyle uyumlu bir başlama kapısı kurmak
* planlama ile uygulama arasında ölçülebilir hazır olma standardı oluşturmaktır

Net kural:

* Anlaşılmamış iş kodlamaya hazır değildir
* Owner’ı belirsiz iş hazır değildir
* Kabul ölçütü olmayan iş hazır değildir
* Contract ve etki alanı belirsiz iş hazır değildir
* “Yolda netleşir” yaklaşımı kritik alanlarda readiness sayılmaz

---

## 2. Kapsam

Bu tanım ilk fazda aşağıdaki iş aileleri için geçerlidir:

1. yeni feature geliştirmesi
2. mevcut akışta önemli davranış değişikliği
3. state machine / transition değişikliği
4. endpoint / contract değişikliği
5. permission / guard değişikliği
6. finance / payout / refund etkili değişiklik
7. moderation / risk / lifecycle etkili değişiklik
8. infra/topology/config etkili değişiklik
9. PACK ve stage kabulüne gidecek işler

Bu dosya aşağıdaki alanları exact proje yönetim aracı seviyesinde açmaz:

* ticket template UI’si
* sprint board alan isimleri
* story point / estimation metodu
* günlük planlama ritüeli

---

## 3. Temel ilkeler

### DR-001 — Ready, “başlayabiliriz galiba” değildir

**Binding Rule:** Ready durumu sezgisel veya kişisel kanaatle değil; ölçülebilir netliklerle belirlenir.

### DR-002 — Kapsam sabitlenmeden kod başlamaz

**Binding Rule:** İşin neyi içerdiği ve neyi içermediği açık değilse çalışma readiness seviyesine gelmemiş sayılır.

### DR-003 — Owner boundary readiness’in parçasıdır

**Binding Rule:** İşin hangi owner/domain sınırında yürüdüğü, hangi modülün truth owner olduğu ve hangi katmanların yalnız projection olduğu baştan net olmalıdır. fileciteturn17file1

### DR-004 — Test beklentisi iş başlamadan bilinmelidir

**Binding Rule:** İş tamamlanınca hangi test seviyelerinin beklendiği en baştan bilinmelidir; kapanışta rastgele test seçimi readiness sayılmaz. fileciteturn17file2

### DR-005 — Ready, Done ile karıştırılmaz

**Binding Rule:** Bir işin hazır olması, uygulanmış ve kabul edilmiş olduğu anlamına gelmez.

---

## 4. Ready seviyesi modeli

### R0 — Not ready

İş konuşulmuş olabilir ama kodlamaya başlamak için netliği yoktur.

### R1 — Partially ready

Bazı sınırlar nettir ama kritik eksikler vardır; kodlamaya başlanması risklidir.

### R2 — Ready

İşin owner’ı, kapsamı, contract etkisi, kabul ölçütü ve test beklentisi nettir; uygulamaya alınabilir.

Net kural:

* Kritik işlerde hedef seviye `R2`’dir
* `R1` ile kritik domain kodlamasına girilmez

---

## 5. Bir işin ready sayılması için zorunlu alanlar

Bir iş, en az aşağıdaki alanlar netse ready kabul edilir:

1. iş tanımı
2. kapsam sınırı
3. owner/domain sınırı
4. etkilenen aktörler
5. etkilenen yüzeyler / servisler
6. contract etkisi
7. state / permission / eligibility etkisi
8. kabul ölçütü
9. test beklentisi
10. bilinen açık risk veya bağımlılık

Net kural:

* Bu alanlardan kritik olanlar boşsa iş ready değildir

---

## 6. İş tanımı standardı

### DR-010 — İş tek cümleyle anlatılabilmelidir

Örnek:

* “Checkout anında merkezi fiyat doğrulamasını zorunlu kıl.”
* “Support ticket routing’te finance queue ayrımını ekle.”
* “Payout release için risk second review zorunluluğu getir.”

### DR-011 — Problem ve çözüm karıştırılmaz

**Binding Rule:** İş tanımında önce neyin eksik/yanlış olduğu anlaşılmalı; çözüm yaklaşımı sonra bağlanmalıdır.

### DR-012 — Belirsiz iş tanımı readiness sayılmaz

Yanlış örnekler:

* “Checkout’u iyileştir”
* “Destek sistemine bakalım”
* “Moderasyonu güçlendir”

---

## 7. Kapsam sınırı standardı

### DR-020 — İn-scope ve out-of-scope açık yazılmalıdır

Örnek:

* in-scope: payout release review akışı
* out-of-scope: payout provider değişimi

### DR-021 — Kapsam kayması readiness’i bozar

**Binding Rule:** İş başlamadan önce kabaca 3 farklı alt iş içine açılıyorsa readiness yeterli değildir.

### DR-022 — Feature creep açıkça dışarı itilmelidir

**Binding Rule:** Ana işin yanına eklenmek istenen unrelated kapsam readiness aşamasında ayrıştırılmalıdır.

---

## 8. Owner / domain boundary standardı

### DR-030 — Truth owner baştan net olmalıdır

Örnek sorular:

* Bu truth hangi modülde mutate edilir?
* BFF burada yalnız read/projection mı?
* Panel yalnız action caller mı?
* UI yalnız render mı?

### DR-031 — Cross-domain işler için sınır açık yazılmalıdır

**Binding Rule:** Örneğin finance, payout, moderation, risk, stock, pricing, checkout, auth gibi alanlar etkileniyorsa kimin owner, kimin consumer olduğu readiness notunda görünmelidir. fileciteturn17file1

### DR-032 — Owner belirsizliği kritik blokerdir

**Binding Rule:** “Bu M2 mi, M6 mı çözer?” seviyesi belirsizlik devam ediyorsa iş ready değildir.

---

## 9. Actor / surface etkisi standardı

### DR-040 — Hangi aktörlerin etkilendiği bilinmelidir

Örnek aktörler:

* guest user
* authenticated user
* eligible user
* creator
* supplier
* support operator
* finance operator
* moderator
* system worker

### DR-041 — Hangi yüzeylerin etkilendiği yazılmalıdır

Örnek yüzeyler:

* web/storefront
* panel
* BFF/gateway
* internal service API
* worker/reconciliation path
* notification center
* tracking screen

### DR-042 — Scope etkisi readiness’in parçasıdır

**Binding Rule:** Guest checkout istisnası, shopper/creator scope ayrımı veya panel/internal access guard etkileniyorsa readiness notunda açık olmalıdır. fileciteturn17file0turn17file1

---

## 10. Contract etkisi standardı

### DR-050 — Contract değişikliği baştan görünmelidir

İşin şu alanları etkileyip etkilemediği bilinmelidir:

* request schema
* response schema
* event schema
* panel action payload
* internal command payload
* error code family

### DR-051 — Contract değişiyorsa versiyonlama/uyum düşünülmelidir

**Binding Rule:** Public, app, panel veya internal contract değişiyorsa backward compatibility, migration veya synchronized rollout ihtiyacı önceden not edilmelidir.

### DR-052 — “Implement ederken bakarız” contract readiness değildir

---

## 11. State / permission / eligibility etkisi standardı

### DR-060 — State machine etkisi varsa belirtilmelidir

Örnek:

* checkout transition etkileniyor mu?
* order transition etkileniyor mu?
* payout hold/release state değişiyor mu?

### DR-061 — Permission / guard etkisi readiness’in parçasıdır

**Binding Rule:** Login, role, scope, ownership veya eligibility gate değişiyorsa bu en başta görünmelidir. fileciteturn17file1turn17file0

### DR-062 — Eligibility dinamiği önceden netleşmelidir

Örnek:

* review eligibility
* UGC/story eligibility
* return eligibility
* payout release approval eligibility

Bu alanlar belirsizse iş R2 sayılmaz.

---

## 12. Kabul ölçütü standardı

### DR-070 — Kabul cümlesi ölçülebilir olmalıdır

Örnek:

* “Guest checkout açıkken sosyal write guard’ları gevşemez.”
* “Payout release risk review olmadan tamamlanamaz.”
* “Checkout final price yalnız merkezi fiyat doğrulamasından gelir.”

### DR-071 — “Çalışıyor gibi” kabul ölçütü değildir

**Binding Rule:** Kabul ölçütü davranış, çıktı veya kısıt üzerinden ölçülebilir olmalıdır.

### DR-072 — Done kapısına bağlanacak kabul ölçütü önceden yazılmalıdır

**Binding Rule:** İş başlarken başarı tanımı bilinmelidir.

---

## 13. Test beklentisi standardı

### DR-080 — Beklenen test seviyesi önceden yazılır

İşin etkisine göre şu seviyeler seçilir:

* T0 static doğrulama
* T1 modül davranış testi
* T2 contract testi
* T3 entegrasyon testi
* T4 acceptance/kapı testi. fileciteturn17file2

### DR-081 — Kritik işte test seviyesi boş bırakılamaz

Örnek kritik alanlar:

* state machine
* finance/payout
* permission/guard
* contract
* idempotency
* owner boundary

### DR-082 — Test kanıtı formatı en baştan düşünülmelidir

**Binding Rule:** Hangi komut, hangi senaryo veya hangi acceptance kanıtı beklendiği readiness notunda bilinebilir olmalıdır. fileciteturn17file2

---

## 14. Bağımlılık ve risk standardı

### DR-090 — Dış bağımlılık görünür olmalıdır

Örnek:

* önce başka PACK kapanmalı mı?
* önce contract kararı gerekli mi?
* önce topology/config standardı netleşmeli mi?

### DR-091 — Bilinen risk readiness notunda görünür olmalıdır

Örnek:

* callback ambiguity
* provider belirsizliği
* state migration riski
* panel permission riski

### DR-092 — Risk var diye iş not-ready olmaz; ama gizli risk readiness sayılmaz

---

## 15. Ready checklist

Bir iş R2/Ready sayılmadan önce aşağıdaki checklist karşılanmalıdır:

* [ ] İş tek cümleyle açık tanımlandı
* [ ] İn-scope / out-of-scope net yazıldı
* [ ] Owner/domain boundary net
* [ ] Etkilenen aktörler belli
* [ ] Etkilenen yüzeyler/servisler belli
* [ ] Contract etkisi açık
* [ ] State/permission/eligibility etkisi açık
* [ ] Kabul ölçütü ölçülebilir yazıldı
* [ ] Beklenen test seviyesi yazıldı
* [ ] Bilinen bağımlılık ve riskler görünür

Net kural:

* Kritik işlerde checklist eksikse ready verilmez

---

## 16. Ready değildir örnekleri

Aşağıdaki durumlar ready değildir:

* “Support tarafına bir şeyler ekleyelim.”
* “Checkout’u daha güvenli yapalım.”
* “Payout’ta sorun olursa bakarız.”
* “Panelde bir action açarız, owner sonra netleşir.”
* “Error code’u uygularken düşünürüz.”
* “Testi sonra topluca hallederiz.”

---

## 17. Faz-1 minimum readiness standardı

İlk fazda aşağıdaki alanlar net değilse iş ready sayılmaz:

1. owner/domain boundary
2. in-scope / out-of-scope
3. actor/surface etkisi
4. contract etkisi
5. state/permission/eligibility etkisi
6. kabul ölçütü
7. test seviyesi
8. bağımlılık/risk notu

---

## 18. Faz-1 dışında bırakılan alanlar

* story point estimation kuralları
* sprint kapasite planı
* kaynak planlama detayları
* person assignment detayları

---

## 19. Kısa sonuç

Bu tanım ile aşağıdaki çekirdek kararlar sabitlenmiş olur:

* Kodlama readiness ölçülebilir bir kapıdır
* Owner boundary, kapsam, contract ve kabul ölçütü net değilse iş hazır değildir
* Test beklentisi iş başlamadan bilinmelidir
* Permission, eligibility ve state etkisi kritik readiness girdisidir
* “Yolda netleşir” yaklaşımı kritik alanlarda readiness yerine geçmez

Bu dosya, Aşama 14’ün bağlayıcı iş başlama / kodlamaya hazır olma standardıdır.
