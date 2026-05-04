# BRANCH_RELEASE_POLICY

## 1. Amaç

Bu dosya, platformun branch, merge, release ve hotfix disiplinini tek doğrulu, uygulanabilir ve mimari kapanış mantığıyla uyumlu hale getirir.

Bu dosyanın amacı:

* branch ailelerini ve ne için kullanılacaklarını netleştirmek
* hangi işin ne zaman merge edileceğini ve hangi doğrulama kapılarından geçeceğini bağlayıcı hale getirmek
* stage/pack kapanışları ile release adayları arasındaki ilişkiyi netleştirmek
* hotfix, stabilization ve release candidate akışlarını yorumdan çıkarmaktır

Net kural:

* Branch stratejisi kişisel çalışma alışkanlığına göre değişmez
* Her değişiklik ana hatta doğrudan atılamaz
* Kritik kapanışlar test ve kabul kanıtı olmadan release hattına taşınamaz
* Hotfix, kalıcı bypass mekanizması değildir
* Release etiketi, kod “neredeyse hazır” diye değil, kapı geçtiği için verilir

---

## 2. Kapsam

Bu politika ilk fazda aşağıdaki alanları kapsar:

1. ana branch aileleri
2. feature / pack çalışma branch’leri
3. release candidate mantığı
4. stabilization mantığı
5. hotfix mantığı
6. merge kuralları
7. tag/release işaretleme mantığı
8. stage ve acceptance gate ilişkisi
9. yasak branch/release davranışları

Bu dosya aşağıdaki alanları exact tool seviyesinde açmaz:

* Git hosting provider ayarları
* protection rule UI konfigürasyonu
* semantic versioning exact numerik şeması
* exact CI/CD workflow syntax’ı

---

## 3. Temel ilkeler

### BR-001 — Ana hat her zaman korunur

**Binding Rule:** Ana branch kırık, doğrulanmamış veya owner boundary ihlali taşıyan kod için geçici park alanı değildir.

### BR-002 — Feature branch geçicidir, hakikat değildir

**Binding Rule:** Feature/pack branch çalışma alanıdır; kabul edilmiş mimari durumun kalıcı kaydı ana hat ve release çizgisidir.

### BR-003 — Release candidate teknik ve işsel kapıdan geçer

**Binding Rule:** RC yalnız build alan kod değil; test ve kabul kapısından geçmiş adaydır. fileciteturn17file2

### BR-004 — Hotfix ayrı istisna yoludur

**Binding Rule:** Hotfix yalnız üretim etkili veya release-blocking kritik sorunlar için açılır; normal feature geliştirme hotfix adıyla yürütülmez.

### BR-005 — Merge birleştirme değil, kalite kararıdır

**Binding Rule:** PR merge edilmesi, teknik ve mimari olarak kabul edildiği anlamına gelir; “sonra düzeltiriz” parkı değildir.

### BR-006 — Branch politikası owner boundary’yi korumalıdır

**Binding Rule:** BFF write, panel direct write, owner dışı mutation veya truth/projection karışıklığı gibi boundary ihlalleri branch seviyesinde normalleştirilemez. fileciteturn17file1

---

## 4. Branch aileleri

İlk faz için önerilen ve bağlayıcı branch ailesi:

* `main`
* `develop` veya eşdeğer ana entegrasyon hattı
* `feature/*`
* `pack/*`
* `release/*`
* `hotfix/*`
* gerekirse `chore/*`, `docs/*`, `refactor/*`

Net kural:

* Aynı anlam için rastgele farklı branch family’leri üretilmez
* `test/*`, `random/*`, `final/*`, `new/*` gibi belirsiz isimli branch family’leri kabul edilmez

---

## 5. Ana branch’ler

### BR-010 — `main`

**Amaç:** kabul edilmiş, izlenebilir, yayın/hotfix referansı olabilecek ana hat

**Özellikleri:**

* doğrudan commit atılmaz
* yalnız kontrollü merge ile ilerler
* release ve hotfix referansı olarak kullanılabilir
* kırık state park alanı değildir

### BR-011 — `develop`

**Amaç:** aktif entegrasyon hattı

**Özellikleri:**

* feature/pack branch’leri önce burada birleşebilir
* daha yüksek değişim temposu taşıyabilir
* ama yine test ve kalite kapısı ister

Net kural:

* `main` en korunaklı hattır
* `develop` daha hareketlidir ama “kontrolsüz geçici çöplük” değildir

---

## 6. Çalışma branch’leri

### BR-020 — `feature/*`

Kullanım amacı:

* sınırlı kapsamlı geliştirme
* belirli bir teknik veya ürün işinin uygulanması

Örnek:

* `feature/checkout-price-validation`
* `feature/support-ticket-routing`

### BR-021 — `pack/*`

Kullanım amacı:

* planlı PACK veya kabul kapısı odaklı iş toplaması
* birden fazla küçük commit’in bir kabul birimine bağlanması

Örnek:

* `pack/stage-14-repo-blueprint`
* `pack/stage-15-acceptance-gate-foundation`

### BR-022 — `docs/*`

Kullanım amacı:

* yalnız plan, standart, mimari belge ve rehber güncellemesi

### BR-023 — `refactor/*`

Kullanım amacı:

* davranış değiştirmeyen yapısal iyileştirme

Net kural:

* Feature branch, kapsamı açık olmayan uzun ömürlü yaşam alanına dönüşmez
* Pack branch, gerçek kabul paketi mantığı olmadan isim olarak kullanılmaz

---

## 7. Branch isimlendirme standardı

### BR-030 — Branch adı amacı açık anlatmalıdır

Format önerisi:

* `feature/<short-purpose>`
* `pack/<stage-or-pack-purpose>`
* `release/<version-or-stage-tag>`
* `hotfix/<critical-issue>`

### BR-031 — Branch adında belirsiz kelimeler kullanılmaz

Yanlış örnekler:

* `feature/fix`
* `feature/new`
* `hotfix/issue`
* `pack/final`

### BR-032 — Branch adı mümkünse owner veya problem alanını yansıtmalıdır

Örnek:

* `feature/finance-refund-correction`
* `feature/risk-hold-release-guard`
* `pack/stage-14-engineering-standards`

---

## 8. Merge politikası

### BR-040 — Doğrudan `main` commit yok

**Binding Rule:** Ana hatta doğrudan push/commit normal çalışma modeli değildir.

### BR-041 — Merge öncesi minimum doğrulama zorunludur

Değişikliğin etkisine göre en az şu alanlar değerlendirilir:

* T0 static doğrulama
* ilgili T1/T2
* kritik akış etkileniyorsa T3
* kabul/pack kapanışında T4. fileciteturn17file2

### BR-042 — Owner boundary etkileyen PR daha sıkı incelenir

**Binding Rule:** permission, state machine, idempotency, contract, finance, payout, moderation ve owner sınırı etkileyen PR’lar ek dikkat ve kanıt ister. fileciteturn17file1turn17file2

### BR-043 — Docs-only merge ile code merge aynı kabul seviyesinde değildir

**Binding Rule:** Sadece belge güncellemesi code/test kapılarıyla aynı ağırlıkta incelenmeyebilir; ama mimari karar değiştiriyorsa yine dikkat ister.

### BR-044 — “WIP ama merge edelim” normal akış değildir

**Binding Rule:** Eksik, kırık, test kapısı geçmemiş veya bilerek yarım bırakılmış branch ana entegrasyon hattına taşınmaz.

---

## 9. Release candidate mantığı

### BR-050 — `release/*` branch’i stabilization içindir

Kullanım amacı:

* aday sürümü dondurmak
* yalnız release-blocking düzeltmeler almak
* acceptance ve stabilization doğrulaması yapmak

Örnek:

* `release/stage-14-rc1`
* `release/v0.1.0-rc1`

### BR-051 — Release branch feature geliştirme alanı değildir

**Binding Rule:** Release branch açıldıktan sonra yeni kapsam eklenmez; yalnız stabilization, fix ve release readiness işleri alınır.

### BR-052 — RC çıkmak için en az şu kapılar düşünülür

* build/type/static doğrulama
* etkilenen kritik zincirlerin testleri
* açık bilinen sınırlamaların dürüst kaydı
* release notuna temel olacak değişim özeti

---

## 10. Stabilization politikası

### BR-060 — Stabilization yeni iş değil, risk azaltma dönemidir

**Binding Rule:** RC veya stage kapanışı öncesi stabilization döneminde odak yeni feature eklemek değil; mevcut adayın güvenilirliğini artırmaktır.

### BR-061 — Stabilization değişiklikleri sınırlıdır

İzinli örnekler:

* bug fix
* contract alignment
* guard tightening
* config correction
* observability hardening
* documentation correction

Yasak örnekler:

* kapsam büyütme
* unrelated refactor
* yeni domain açma
* büyük feature ekleme

### BR-062 — Stabilization sonucu iki olasılığa gider

* RC kabul edilir ve `main`e taşınır
* RC reddedilir, ilgili branch’e geri dönülür ve yeni aday hazırlanır

---

## 11. Hotfix politikası

### BR-070 — `hotfix/*` yalnız kritik durum içindir

Örnek durumlar:

* production’da kritik akış bozuldu
* release candidate bloklayan yüksek kritik hata var
* güvenlik/audit/financial correctness ihlali tespit edildi

### BR-071 — Hotfix küçük ve hedefli olmalıdır

**Binding Rule:** Hotfix branch, kritik sorunu en dar kapsamla düzeltir; yanına feature toplamaz.

### BR-072 — Hotfix merge sonrası geri taşıma zorunludur

**Binding Rule:** Hotfix yalnız `main`e atılıp bırakılmaz; gerekiyorsa `develop` ve ilgili aktif hatlara da taşınır.

### BR-073 — Hotfix de testten muaftır sanılmaz

**Binding Rule:** Kritik olduğu için bazı süreçler hızlanabilir; ama ilgili risk alanı için test/kanıt zorunluluğu kalkmaz. fileciteturn17file2

---

## 12. Release işaretleme mantığı

### BR-080 — Release etiketi yalnız kabul edilmiş adaya verilir

**Binding Rule:** Tag veya resmi release işareti, RC/stage kapıları geçilmiş aday için kullanılır.

### BR-081 — Tag okunabilir ve izlenebilir olmalıdır

Örnek formatlar:

* `v0.1.0`
* `v0.1.0-rc1`
* `stage-14-accepted`

### BR-082 — Tag açıklamasız bırakılmaz

**Binding Rule:** Release etiketi; neyi içerdiği, hangi kapıdan geçtiği ve varsa bilinen sınırlamalarıyla izlenebilir olmalıdır.

---

## 13. Stage / pack kabul kapısı ile branch ilişkisi

### BR-090 — Pack kapanışı branch seviyesinde görünür olmalıdır

**Binding Rule:** Bir PACK tamamlandığında hangi branch/PR/test kanıtı ile kapandığı izlenebilir olmalıdır.

### BR-091 — Stage kapanışı release mantığına bağlanır

**Binding Rule:** Aşama kapanışı yalnız belge cümlesi değildir; en az ilgili branch/RC/test/acceptance iziyle desteklenmelidir. fileciteturn17file2

### BR-092 — Belgede kabul edilmiş ama repo’da iz bırakmamış kapanış zayıf kabul edilir

**Binding Rule:** Plan ve repo izi mümkün olduğunca birbirini doğrulamalıdır.

---

## 14. Review ve onay mantığı

### BR-100 — Her PR aynı review derinliğinde değildir

Aşağıdaki alanlar daha sıkı review ister:

* owner boundary
* permission / guard
* state machine
* API contract
* idempotency
* financial logic
* payout / settlement
* moderation / risk action flows

### BR-101 — Docs-only PR daha hafif olabilir ama mimari kararsa hafif sayılamaz

**Binding Rule:** Mimari standart, repo blueprint, acceptance gate, topology ve benzeri dokümanlar code içermese de yüksek etki taşıyabilir.

### BR-102 — Self-merge kültürü ana akış için esas kabul edilmez

**Binding Rule:** Özellikle kritik alanlarda ikinci göz veya review izi beklenir.

---

## 15. Revert politikası

### BR-110 — Revert meşru operasyondur

**Binding Rule:** Sorunlu merge tespit edildiğinde hızlı ve izlenebilir revert kabul edilir; problemi gizlemek için yamalı sessiz düzeltme tercih edilmez.

### BR-111 — Revert sonrası kök neden ayrı ele alınır

**Binding Rule:** Revert, kök neden çözümü yerine geçmez; ilgili fix branch veya hotfix sonrası yeniden ele alınır.

---

## 16. Yasak branch/release davranışları

Aşağıdaki davranışlar bu politikaya göre yasaktır:

* doğrudan `main`e rastgele commit atmak
* feature branch’te aylarca belirsiz geliştirme biriktirmek
* release branch’e yeni feature taşımak
* hotfix branch’e ilgisiz refactor eklemek
* test kanıtı olmayan kritik PR’ı merge etmek
* owner boundary ihlalini “sonra düzeltiriz” diyerek geçmek
* stage kabulünü repo branch/release izinden kopuk bırakmak
* aynı anlam için rastgele branch family üretmek

---

## 17. Faz-1 minimum branch/release omurgası

İlk fazda aşağıdaki omurga zorunlu kabul edilir:

1. korunaklı `main`
2. aktif entegrasyon için `develop`
3. kapsamı açık `feature/*`
4. kabul odaklı `pack/*`
5. stabilization için `release/*`
6. kritik müdahale için `hotfix/*`
7. merge öncesi test/kanıt kapısı
8. tag/release izlenebilirliği
9. hotfix geri taşıma disiplini

---

## 18. Faz-1 dışında bırakılan alanlar

* trunk-based development varyant detayları
* GitFlow varyantlarının tam karşılaştırması
* exact semantic version increment kuralları
* automated release notes tooling detayları

---

## 19. Kısa sonuç

Bu politika ile aşağıdaki çekirdek kararlar sabitlenmiş olur:

* Ana hat korunur; doğrulanmamış iş doğrudan taşınmaz
* Feature ve pack branch’leri geçici çalışma alanıdır
* Release branch stabilization içindir, feature ekleme alanı değildir
* Hotfix yalnız kritik ve hedefli müdahale içindir
* Merge kalite kararıdır; test/kanıt gerektirir
* Stage ve pack kapanışları repo izi ve release mantığıyla bağlanır
* Owner boundary ihlali branch süreci içinde normalleştirilemez

Bu dosya, Aşama 14’ün bağlayıcı branch, merge ve release yönetim politikasıdır.
