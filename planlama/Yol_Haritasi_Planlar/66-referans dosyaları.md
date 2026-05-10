. Bu, projenin teoriden pratiğe geçtiği en kritik noktadır. Tüm bu dokümantasyonu bir "kütüphane" olarak düşünürsek, her geliştiricinin sürekli elinin altında tutması gereken "anayasa" ve "kılavuz" niteliğindeki temel eserler vardır.

Kodlama sırasında tüm dosyalara aynı anda bakmak imkansız ve verimsizdir. Bu yüzden referansları katmanlara ayırarak, hangi işi yaparken hangi dosya setine bakmanız gerektiğini aşağıda net bir şekilde listeliyorum.

---

### 1. "Anayasal Çekirdek" – Her Zaman Açık Olması Gereken 5 Dosya

Bu beş dosya, projenin anayasasıdır. Hangi modülü kodluyor olursanız olun, bu kurallar her zaman geçerlidir ve sürekli referans alınmalıdır. Bir çelişki anında ilk bakılacak yer burasıdır.

1.  **`KANONIK_KARARLAR_OZETI.md`**
    *   **Neden Sürekli Referans?** Bu dosya, tüm revizyonların, istisnaların ve nihai kararların özetidir. `guest checkout`'tan `captured ≠ order_created` ayrımına kadar projenin en temel ve güncel doğrularını içerir. Eğer bir konuda şüpheniz varsa, ilk bakacağınız yer burasıdır.

2.  **`OWNER_MATRIX.md`**
    *   **Neden Sürekli Referans?** "Bu kodu nereye yazmalıyım? Bu veriyi kim değiştirebilir?" sorularının nihai cevabıdır. Bir `service` yazarken başka bir `owner` alanına ait bir `truth`'u mutate etme hatasına düşmenizi engeller. En büyük mimari hatalar bu dosya ihlal edildiğinde başlar.

3.  **`GUARD_MATRIX.md`**
    *   **Neden Sürekli Referans?** Yazdığınız her `action` veya `endpoint`'in hangi güvenlik ve erişim katmanlarından geçmesi gerektiğini tanımlar. `auth`, `scope`, `permission`, `eligibility` ve `state` guard'larının ne anlama geldiğini unuttuğunuzda bakacağınız yerdir. Güvenlik ve yetki hatalarını önler.

4.  **`TRANSITION_POLICIES.md`**
    *   **Neden Sürekli Referans?** Bir `state machine` (sipariş, ödeme, iade vb.) üzerinde çalışıyorsanız, hangi geçişin yasal, hangisinin yasak olduğunu, hangi geçişin `audit` gerektirdiğini ve hangi ara durumların atlanamayacağını tanımlar. State mantığı hatalarını önler.

5.  **`ENGINEERING_STANDARDS.md`**
    *   **Neden Sürekli Referans?** Kodun "nasıl" yazılacağını tanımlar. Dosya isimlendirmesi, klasör yapısı, `domain/application/infra/api` katmanları ve yasak mühendislik davranışları gibi kurallarla kodun tutarlı ve bakımı yapılabilir kalmasını sağlar.

---

### 2. "Mühendislik Kılavuzu" – Bir İşe Başlarken ve Bitirirken Bakılacak Dosyalar

Bu set, geliştirme sürecinin kendisini düzenler.

1.  **`REPO_BLUEPRINT.md`:** Yeni bir `app`, `service` veya `package` oluştururken kodun nereye yerleşeceğini gösterir.
2.  **`BRANCH_RELEASE_POLICY.md`:** `feature`, `pack`, `release`, `hotfix` gibi `branch`'leri nasıl yöneteceğinizi ve `merge` kurallarını tanımlar.
3.  **`DEFINITION_OF_READY.md`:** Bir işe kodlamaya başlamadan önce hangi şartların sağlanması gerektiğini kontrol etmek için kullanılır.
4.  **`DEFINITION_OF_DONE.md`:** Yazdığınız kodun "tamamlandı" sayılması için hangi kanıtları üretmeniz gerektiğini (test, dokümantasyon, acceptance vb.) gösterir.
5.  **`TEST_STRATEJISI.md`:** Yaptığınız değişikliğin ağırlığına göre hangi seviyede (T0-T4) test yazmanız gerektiğini belirler.
6.  **`API_ERROR_CATALOG.md` & `ERROR_CODE_STANDARD.md`:** Bir `endpoint` yazarken hangi hata durumunda hangi `kanonik hata kodunu` döndürmeniz gerektiğini tanımlar.

---

### 3. Görev Bazlı Referans Setleri (En Sık Kullanılacak Model)

Her geliştirici, aldığı görevin türüne göre aşağıdaki özel setleri referans almalıdır. **Anayasal Çekirdek her zaman bu setlerin üzerindedir.**

#### **A. Yeni Bir Ekran/Component Yaparken (Frontend / Mobil):**

1.  **`SCREEN_CONTRACTS_REFINED.md`:** Ekranın amacını, bileşenlerini ve state görünürlüğünü anlamak için.
2.  **`DTO_RESPONSE_CATALOG.md`:** Ekranın backend'den hangi veri yapısını (DTO) beklediğini görmek için.
3.  **`STATEFUL_UI_BEHAVIOR_GUIDE.md`:** `loading`, `empty`, `blocked`, `degraded`, `pending` gibi durumlarda ekranın nasıl davranacağını anlamak için.
4.  **`FIGMA_LINKS.md` & `DESIGN_TOKEN_GUIDE.md` & `COMPONENT_STATE_GUIDE.md`:** Ekranın görsel tasarımını, kullanılacak `token`'ları ve `component`'leri görmek için.
5.  **İlgili Sistem Dosyası:** Örneğin, `PDP` ekranını yapıyorsanız `4-pdp sistemi.md` dosyasına bakarak işlevsel gereksinimleri teyit etmek için.

#### **B. Yeni Bir API Endpoint'i Yazarken (Backend):**

1.  **İlgili Sistem Dosyası:** Örneğin, `checkout` ile ilgili bir endpoint ise `14-checkout sistemi .md` dosyası.
2.  **İlgili State Machine Dosyası:** Örneğin, `checkout.md` (state machine) dosyası.
3.  **İlgili OpenAPI Dosyası (`app.yaml`, `panel.yaml` vb.):** Endpoint'in `request`, `response` ve `path` sözleşmesini görmek için.
4.  **`API_ERROR_CATALOG.md`:** Hangi hata durumlarını döndürmeniz gerektiğini bilmek için.
5.  **`GUARD_MATRIX.md` & `PERMISSION_MATRIX.md`:** Bu endpoint'in hangi `guard`'lardan geçmesi gerektiğini ve hangi `permission`'ları gerektirdiğini belirlemek için.

#### **C. Kritik Bir Ticari Akışı Değiştirirken (Örn: İade Sonrası Puan İptali):**

1.  **`CRITICAL_JOURNEY_CHECKLIST.md`:** Bu yolculuğun tüm adımlarını, `fail case`'lerini ve beklentilerini görmek için.
2.  **`ACCEPTANCE_CRITERIA_PACK.md`:** Yaptığınız değişikliğin hangi kabul kriterlerini karşılaması gerektiğini bilmek için.
3.  **İlgili Tüm Sistem Dosyaları:** `18- iptal ve iade sistemi .md`, `39-ödül puan sistemi.md`, `47-finansal mutabakat hakediş sistemi.md`.
4.  **İlgili Tüm State Machine Dosyaları:** `cancel-return.md`, `settlement-line.md`.
5.  **Politika ve Rulebook Dosyaları:** `DATA_QUALITY_POLICY.md`, `ELIGIBILITY_RULEBOOK.md`, `AUDIT_TAXONOMY.md`.

---

### 4. Pratik Bir Çalışma Modeli

Bir geliştirici olarak günlük akışınız şöyle olmalı:

1.  **İşe Başlarken:**
    *   `DEFINITION_OF_READY.md` checklist'ini zihninizde kontrol edin: Bu işin kapsamı, owner'ı, kabul ölçütü belli mi?
2.  **Kodlama Sırasında:**
    *   **"Anayasal Çekirdek"** her zaman aklınızın bir köşesinde veya bir ekranınızda açık olsun.
    *   Görev hangi alandaysa, **"Görev Bazlı Referans Seti"**'ndeki ilgili dosyaları açın.
    *   Bir branch açarken veya commit atarken **"Mühendislik Kılavuzu"**'na göz atın.
3.  **İşi Bitirirken:**
    *   `DEFINITION_OF_DONE.md` checklist'ini kontrol edin: Gerekli testleri yazdım mı? Kabul kriterini karşıladığıma dair kanıtım var mı? Dokümantasyonu güncelledim mi?

---

### 5. Özet Tablo

| Dosya Kategorisi | Ne Zaman Bakılmalı? | En Kritik Dosyalar |
| :--- | :--- | :--- |
| **Anayasal Çekirdek** | Sürekli, her zaman, her iş için. | `KANONIK_KARARLAR_OZETI.md`, `OWNER_MATRIX.md`, `GUARD_MATRIX.md`, `TRANSITION_POLICIES.md`, `ENGINEERING_STANDARDS.md` |
| **Mühendislik Kılavuzu**| Bir işe başlarken, branch açarken, PR gönderirken ve işi kapatırken. | `REPO_BLUEPRINT.md`, `BRANCH_RELEASE_POLICY.md`, `DEFINITION_OF_READY.md`, `DEFINITION_OF_DONE.md`, `TEST_STRATEJISI.md` |
| **Alan (Domain) Dosyaları**| Üzerinde çalıştığınız modülün iş mantığını anlamak için. | `*sistemi.md` dosyaları, ilgili state machine dosyaları |
| **Sözleşmeler (Contracts)**| API, ekran veya panel yüzeyi geliştirirken. | OpenAPI dosyaları, `DTO_RESPONSE_CATALOG.md`, `SCREEN_CONTRACTS_REFINED.md`, `PANEL_CONTRACTS.md`, `API_ERROR_CATALOG.md` |
| **Kabul ve Kalite** | Bir işin başarı tanımını ve test beklentisini anlamak için. | `CRITICAL_JOURNEY_CHECKLIST.md`, `ACCEPTANCE_CRITERIA_PACK.md`, `DATA_QUALITY_POLICY.md` |

Bu rehber, kütüphanedeki en değerli kitapları ve hangi durumda hangisine başvurmanız gerektiğini gösteren bir pusuladır. Bu disipline sadık kalmak, projenin mimari bütünlüğünü korumanın tek yoludur.