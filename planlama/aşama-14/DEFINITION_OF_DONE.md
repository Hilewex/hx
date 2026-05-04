# DEFINITION_OF_DONE

## 1. Amaç

Bu dosya, bir işin, PACK’in, modülün veya aşama alt kaleminin gerçekten tamamlanmış ve kabul edilebilir sayılabilmesi için gerekli asgari şartları bağlayıcı biçimde tanımlar.

Bu dosyanın amacı:

* “kod yazıldıysa bitmiştir” yaklaşımını engellemek
* owner boundary, contract, test, audit, dokümantasyon ve kabul kanıtı tamamlanmadan işin kapatılmasını önlemek
* readiness ile başlayan işi ölçülebilir biçimde kapanış kapısına bağlamak
* planlama, uygulama, test ve acceptance zincirini tek done standardında toplamak

Net kural:

* Kod yazılmış olması done değildir
* Build alması tek başına done değildir
* Testsiz kritik iş done değildir
* Acceptance kanıtı olmayan önemli iş done değildir
* Boundary ihlali taşıyan iş done değildir

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

Bu dosya aşağıdaki alanları proje yönetim aracı detayı seviyesinde açmaz:

* task close UI kuralları
* sprint retrospective ölçütleri
* performans değerlendirme metrikleri
* ekip kapasite raporlama formatı

---

## 3. Temel ilkeler

### DD-001 — Done, uygulanmış ve kanıtlanmış durumdur

**Binding Rule:** İşin kodunun yazılması yetmez; davranışı doğrulanmış ve kabul kriteri kanıtlanmış olmalıdır.

### DD-002 — Done, owner boundary ile uyumlu olmalıdır

**Binding Rule:** BFF write yapıyorsa, panel direct write alanına dönüştüyse veya owner dışı mutation varsa iş done sayılamaz. fileciteturn17file1

### DD-003 — Done, test seviyesiyle uyumlu olmalıdır

**Binding Rule:** Readiness aşamasında beklenen test seviyesi karşılanmadan iş done kabul edilmez. fileciteturn17file2

### DD-004 — Done, acceptance diline bağlanmalıdır

**Binding Rule:** Özellikle PACK/stage kapanışında “tamamlandı” cümlesi test ve acceptance kanıtı olmadan geçerli değildir. fileciteturn17file2

### DD-005 — Known limitation gizlenmez

**Binding Rule:** İş tamamlandıysa ama dürüstçe yazılması gereken sınırlama varsa bu görünür biçimde kayda geçmelidir; sessizce done etiketi verilmez.

---

## 4. Done seviyesi modeli

### D0 — Not done

Kod yok, yarım, doğrulanmamış veya kabul koşulları eksik.

### D1 — Implemented but not accepted

Kod yazılmış olabilir; ancak test, contract, audit, acceptance veya dokümantasyon eksikleri vardır.

### D2 — Done

İş uygulanmış, doğrulanmış, acceptance kriteri karşılanmış ve kapanış kanıtı üretilmiştir.

Net kural:

* Kritik işlerde hedef seviye `D2`’dir
* `D1` seviyesi “bitti” diye raporlanmaz

---

## 5. Bir işin done sayılması için zorunlu alanlar

Bir iş, en az aşağıdaki alanlar tamamlandıysa done kabul edilir:

1. implementasyon tamamlandı
2. scope dışına taşmadan tamamlandı
3. owner/domain boundary korundu
4. contract etkisi uygulandı ve hizalandı
5. state/permission/eligibility etkisi doğrulandı
6. gerekli test seviyesi çalıştırıldı
7. acceptance kriteri kanıtlandı
8. gerekli dokümantasyon güncellendi
9. bilinen sınırlamalar yazıldı
10. kapanış kanıtı üretildi

Net kural:

* Bu alanlardan kritik olanlar eksikse iş done değildir

---

## 6. Implementasyon tamamlanma standardı

### DD-010 — Kod parçası değil, iş davranışı tamamlanmış olmalıdır

**Binding Rule:** Yalnız bir endpoint açmak, buton eklemek veya state field koymak done sayılmaz; hedef davranış uçtan uca anlamlı şekilde tamamlanmış olmalıdır.

### DD-011 — Scope creep done’u bozmaz ama done’u erteler

**Binding Rule:** İş sırasında yeni kapsam eklenmişse ya ayrıştırılmalı ya da done kararı ana iş için dürüst biçimde yeniden değerlendirilmelidir.

### DD-012 — Half-wired implementasyon done değildir

Yanlış örnekler:

* UI var, backend yok
* backend var, guard yok
* action var, audit yok
* state var, transition validation yok

---

## 7. Boundary korunumu standardı

### DD-020 — Owner boundary ihlali done’u düşürür

Örnek done engelleri:

* BFF mutation yapıyor
* panel client truth write ediyor
* UI permission truth hesaplıyor
* service başka service’in domain katmanını source import ile deliyor

### DD-021 — Projection/truth ayrımı korunmalıdır

**Binding Rule:** Tracking, notification, admin summary, BFF read model ve benzeri projection katmanları truth owner gibi davranıyorsa iş done sayılamaz.

### DD-022 — Scope/permission doğruluğu zorunludur

**Binding Rule:** Guest/authenticated/eligible/internal/panel ayrımı bozuluyorsa veya beklenmeyen hak açılıyorsa iş done değildir. fileciteturn17file0turn17file1

---

## 8. Contract ve error hizası standardı

### DD-030 — Contract etkisi kapanmalıdır

**Binding Rule:** Request/response/event/action payload etkilenmişse ilgili contract uyumu tamamlanmış olmalıdır.

### DD-031 — Error code family hizalanmalıdır

**Binding Rule:** Yeni davranış yeni error family gerektiriyorsa canonical error standardına uygun olmalı; rastgele string veya geçici mesaj ile bırakılmaz.

### DD-032 — Backward-compatibility etkisi görünür olmalıdır

**Binding Rule:** Kırıcı değişiklik varsa migration, rollout veya synchronized adoption planı olmadan done denmez.

---

## 9. State / permission / eligibility kapanış standardı

### DD-040 — State machine etkisi varsa transition doğrulanmalıdır

**Binding Rule:** Checkout/order/return/payout/lifecycle gibi alanlarda transition değiştiyse ilgili davranış kanıtlanmalıdır. fileciteturn17file2

### DD-041 — Permission / guard etkisi varsa policy doğrulanmalıdır

**Binding Rule:** Login, role, scope, ownership veya eligibility gate değiştiyse bu kapıların beklenen çalıştığı test/kanıt ile gösterilmelidir. fileciteturn17file1turn17file2

### DD-042 — Eligibility yalnız metinle değil davranışla kapanır

Örnek:

* review eligibility
* UGC/story eligibility
* return eligibility
* payout release approval eligibility

Bu alanlar çalışmadan done etiketi verilmez.

---

## 10. Test ve doğrulama standardı

### DD-050 — Beklenen test seviyesi tamamlanmalıdır

Readiness’te seçilen seviyeye göre en az şu doğrulamalar yapılmalıdır:

* T0 static
* T1 module behavior
* T2 contract
* T3 integration
* T4 acceptance. fileciteturn17file2

### DD-051 — Kritik alanlarda test atlanamaz

Özellikle şu alanlarda test olmadan done verilmez:

* state machine
* owner boundary
* idempotency
* finance/payout/refund
* contract
* permission/guard
* panel protected actions

### DD-052 — Test kanıtı görünür olmalıdır

Minimum:

* çalıştırılan komut
* sonuç özeti
* doğrulanan senaryo
* varsa limitation notu

“çalışıyor gibi” done kanıtı değildir. fileciteturn17file2

---

## 11. Audit / action / visibility standardı

### DD-060 — Protected action varsa audit tamamlanmalıdır

**Binding Rule:** Approve/reject/restrict/suspend/hold/release/override gibi aksiyonlar audit izi olmadan done kabul edilmez.

### DD-061 — Action sonucu görünürlük hizalanmalıdır

**Binding Rule:** Kullanıcı-facing veya panel-facing davranış değişmişse ilgili visibility/projection de owner outcome ile hizalanmış olmalıdır.

### DD-062 — Unknown-result ve duplicate-safe davranış görünür olmalıdır

**Binding Rule:** Belirsiz sonuç veya duplicate-safe handling sessiz bırakılmışsa kritik iş done değildir.

---

## 12. Dokümantasyon güncelleme standardı

### DD-070 — Davranış değiştiyse ilgili doküman güncellenir

Örnek:

* contract değiştiyse contract/openapi
* error family değiştiyse error standard alignment
* stage/pack kapanıyorsa kapanış notu
* repo/engineering standard etkileniyorsa ilgili standart dosyası

### DD-071 — Mimari karar değiştiyse plan izi bırakılır

**Binding Rule:** Sadece kodu değiştirip plan/karar dokümanını eski halde bırakmak done sayılmaz.

### DD-072 — Docs-only eksikliği done’u etkileyebilir

**Binding Rule:** Özellikle acceptance, policy, topology ve standard etkili işlerde dokümantasyon eksikliği done kararını düşürür.

---

## 13. Acceptance standardı

### DD-080 — Kabul ölçütü tek tek karşılanmalıdır

**Binding Rule:** Readiness aşamasında yazılmış kabul ölçütleri gerçekleşmeden done denmez.

### DD-081 — Acceptance senaryosu mümkünse izlenebilir olmalıdır

Örnek:

* guest checkout sosyal write açmıyor
* payout release risk review olmadan tamamlanmıyor
* checkout final price merkezi fiyat doğrulamasından geliyor

### DD-082 — PACK/stage done için T4 veya eşdeğer acceptance kanıtı gerekir

**Binding Rule:** PACK ve stage kapanışları yalnız local confidence ile değil, acceptance düzeyinde kanıtlanmalıdır. fileciteturn17file2

---

## 14. Known limitation standardı

### DD-090 — Limitation gizlenmez

**Binding Rule:** İş tamamlanmış olsa bile eksik provider coverage, temporary fallback, non-durable worker behavior veya observability limitation gibi noktalar dürüstçe yazılır.

### DD-091 — Limitation yazmak done’u otomatik düşürmez

**Binding Rule:** Sınırlama dürüstçe yazılmış ve kabul edilmişse iş yine done olabilir; ama limitation gizlenirse done etiketi geçersizleşir.

### DD-092 — Critical limitation varsa done yerine conditional kabul düşünülür

**Binding Rule:** Limitasyon işin çekirdek amacını kırıyorsa tam done yerine accepted-with-limitations benzeri dürüst durum kullanılmalıdır.

---

## 15. Done checklist

Bir iş D2/Done sayılmadan önce aşağıdaki checklist karşılanmalıdır:

* [ ] Implementasyon hedef davranışı tamamladı
* [ ] In-scope sınırında kaldı
* [ ] Owner/domain boundary korundu
* [ ] Contract etkileri hizalandı
* [ ] Error family hizalandı
* [ ] State/permission/eligibility etkisi doğrulandı
* [ ] Beklenen test seviyesi çalıştı
* [ ] Acceptance kriterleri karşılandı
* [ ] Gerekli audit/visibility etkileri tamamlandı
* [ ] İlgili dokümantasyon güncellendi
* [ ] Known limitation varsa açıkça yazıldı
* [ ] Kapanış/test kanıtı üretildi

Net kural:

* Kritik işlerde checklist eksikse done verilmez

---

## 16. Done değildir örnekleri

Aşağıdaki durumlar done değildir:

* “API yazıldı ama integration test yok.”
* “Panel action var ama audit yok.”
* “UI değişti ama permission guard net değil.”
* “Payout akışı çalışıyor gibi ama duplicate-safe doğrulanmadı.”
* “Contract değişti ama hata kodu ve docs güncellenmedi.”
* “Stage kapandı dedik ama acceptance kanıtı yok.”

---

## 17. Faz-1 minimum done standardı

İlk fazda aşağıdaki alanlar tamamlanmadan iş done sayılmaz:

1. hedef davranış implementasyonu
2. owner/domain boundary korunumu
3. contract/error hizası
4. state/permission/eligibility doğrulaması
5. gerekli test seviyesi
6. acceptance kriteri karşılanması
7. audit/visibility etkisi
8. ilgili dokümantasyon güncellemesi
9. limitation notu ve kapanış kanıtı

---

## 18. Faz-1 dışında bırakılan alanlar

* performans benchmark zorunluluk tabloları
* coverage yüzdesi hedefleri
* ekip bazlı velocity ölçütleri
* operasyonel runbook post-check detayları

---

## 19. Kısa sonuç

Bu tanım ile aşağıdaki çekirdek kararlar sabitlenmiş olur:

* Done, yalnız kodun yazılması değil; davranışın kanıtlanmasıdır
* Owner boundary, contract, error, permission ve state hizası done’un parçasıdır
* Test ve acceptance kanıtı olmadan kritik iş kapanmaz
* Audit ve visibility etkileri gereken işlerde tamamlanmalıdır
* Known limitation gizlenemez; dürüstçe yazılır

Bu dosya, Aşama 14’ün bağlayıcı iş kapatma ve gerçekten tamamlanmış sayılma standardıdır.
