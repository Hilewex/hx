# HARDENING-10C10-A — Reconciliation Boundary & System Alignment Inventory

## 1. Paket Tanımı

Bu paket, bir kod implementasyon paketi değildir. Görevi, `HARDENING-10C9-02` sonrasında ödeme callback ve mutabakat (reconciliation) hattının ana sistem dosyalarıyla uyumunu doğrulamak, sistem sınırı (boundary) kararlarını envanterlemek ve olası riskleri raporlamaktır.

Bu çalışma, `10C9-02` ile eklenen kontrollü `succeeded`/`failed` callback sahibi geçişlerinin (owner transition) ardından, tam bir mutabakat (reconciliation) ve durum sorgulama (status inquiry) mekanizması kurulmadan önce sistemin genel prensiplerle ne kadar uyumlu olduğunu denetlemek için gereklidir. Amaç, kör bir implementasyona başlamadan önce mevcut durumu, sınırlarımızı ve potansiyel tehlikeleri netleştirmektir.

## 2. 10C9-02 Mevcut Durum Özeti

`HARDENING-10C9-02` paketiyle aşağıdaki yetenekler eklenmiştir:

- **Tamamlananlar:**
  - Yalnızca `opt-in` modunda çalışan bir callback worker’a, `MARK_PAYMENT_SUCCEEDED` ve `MARK_PAYMENT_FAILED` komutları aracılığıyla `payment` ve `payment_attempt` entity’leri üzerinde state güncelleme yeteneği kazandırıldı.
  - Bu worker, `providerReference` üzerinden `paymentAttempt` bulma yeteneğine sahiptir.
  - State geçişleri, terminal state çakışmalarını (örn. succeeded → failed) önleyecek şekilde idempotent ve korumalıdır.
  - Varsayılan worker modu `dry_run` olarak korunmaktadır, yani canlıda owner mutation varsayılan olarak kapalıdır.

- **Kapsam Dışı Olanlar:**
  - **Reconciliation runtime:** Henüz belirsiz (unknown) veya bekleyen (pending) durumdaki ödemeleri sonuçlandırmak için aktif bir mutabakat motoru yoktur.
  - **PayTR status inquiry adapter:** PayTR’dan bir ödemenin nihai durumunu sorgulamak için bir adaptör veya servis entegrasyonu mevcut değildir.
  - **Pending/unknown/cancelled/expired mutation:** `succeeded` ve `failed` dışında kalan ödeme durumları için (örn. `pending`, `unknown_result`, `cancelled`, `expired`) bir owner mutation mantığı eklenmemiştir.
  - **Order handoff:** Başarılı bir ödemenin `order` (sipariş) sistemine devredilmesi ve siparişin oluşturulması süreci henüz yoktur.
  - **Finance/risk mutation:** Ödeme sonucunun finansal (settlement, payout) veya risk (fraud) sistemlerine etki etmesi için bir entegrasyon bulunmamaktadır.
  - **Migration:** Veritabanı şemasında bir değişiklik yapılmamıştır.

## 3. Sistem Dosyalarıyla Uyum Kontrolü

Okunan ana sistem ve planlama dosyalarına göre aşağıdaki sınırlar doğrulanmıştır:

- **Payment sistemi sadece finansal sonucu üretir:** Doğru. `15-ödeme sistemi .md` dosyası, ödeme sisteminin ana görevinin finansal sonucu kesinleştirmek olduğunu, siparişin kendisi olmadığını netleştirir. `10C9-02` implementasyonu da bu kurala uymaktadır.

- **Payment success order created değildir:** Doğru. `15-ödeme sistemi .md` ve `16-sipariş sistemi .md` dosyaları bu ayrımı çok sert bir şekilde çizmektedir. `payment captured` → `order creation attempt` zinciri kurulması gerektiği belirtilmiştir. `10C9-02` paketi, `order handoff` içermeyerek bu sınırı korumuştur.

- **Order create ayrı owner command olmalıdır:** Doğru. `16-sipariş sistemi .md` ve `VERI_AKISI_SENKRONIZASYON_MODELI.md` dosyaları, sipariş oluşturmanın ayrı ve idempotent bir komut olması gerektiğini vurgular.

- **Settlement payment değildir:** Doğru. `planlama/47-finansal mutabakat hakediş sistemi.md` ve `STATE_MACHINES/settlement-line.md` dosyaları, settlement'ın ödeme sonrası oluşan, hakediş ve kesintileri yöneten ayrı bir finansal dağıtım süreci olduğunu net bir şekilde tanımlar. Ödeme (payment) para almaktır, mutabakat (settlement) ise alınan paranın nasıl dağıtılacağını hesaplamaktır.

- **Payout settlement değildir:** Doğru. `54-payaut ödeme çıkış sistemi.md` dosyası, payout'un, `settled` ve `payable` hale gelmiş bakiyelerin fiili olarak ödenmesi olduğunu, yani settlement'tan sonraki bir icra adımı olduğunu belirtir.

- **Risk sistemi sinyal/hold/review üretebilir ama payment truth mutate etmez:** Doğru. `49-fraud risk abuse sistemi.md` ve `OWNER_MATRIX.md` dosyaları, risk sisteminin bir karar destek ve koruma katmanı olduğunu, ancak `payment`, `order` gibi ana truth'ları doğrudan değiştirmeyeceğini belirtir. Risk, `hold` veya `review` gibi durumlar üreterek diğer sistemleri etkiler.

- **Provider callback business truth değildir:** Doğru. Bu, projenin en temel kurallarından biridir. `INTEGRATION_BEHAVIOR_RULES.md` ve `OPERATION_LOGIC_GUIDE.md` dosyaları, provider'dan gelen bilginin (callback) bir girdi olduğunu, ancak nihai "iş gerçeği"nin (business truth) owner sistemin doğrulaması ve state geçişi ile oluştuğunu vurgular. `10C9-02`, callback'i bir komuta çevirerek bu ilkeye uyar.

- **Event state mutation yerine geçmez:** Doğru. `VERI_AKISI_SENKRONIZASYON_MODELI.md` ve `EVENT_TAXONOMY.md`, event'lerin bir durum değişikliğinin *sonucu* olarak yayınlandığını, durum değişikliğinin *sebebi* olamayacağını netleştirir. State mutation, her zaman bir `command` ile owner sistem içinde gerçekleşmelidir.

- **BFF truth owner değildir:** Doğru. `OWNER_MATRIX.md` ve `25-kural -yetki sistemi.md` dosyaları, BFF'in (Backend for Frontend) sadece bir read-only aggregation katmanı olduğunu, asla bir truth owner olmadığını ve write işlemi yapamayacağını kesin bir dille belirtir.

- **UI/panel truth üretmez:** Doğru. Bu kural da `OWNER_MATRIX.md` ve `25-kural -yetki sistemi.md` dosyalarında sabittir. UI ve paneller, kullanıcıdan veya adminden gelen niyetleri (intent) alıp owner sistemlere `command` olarak gönderen yüzeylerdir; doğrudan veritabanı veya state değişikliği yapamazlar.

## 4. Owner Boundary Kararı

`OWNER_MATRIX.md`, `GUARD_MATRIX.md` ve `TRANSITION_POLICIES.md` dosyalarına dayanarak sınırlar aşağıdaki gibidir:

- **Payment owner neyi mutate edebilir?**
  - `payment` ve `payment_attempt` entity'lerinin state'ini (`created`, `processing`, `captured`, `failed`, `refunded` vb.).
  - Ödeme ile ilgili referansları (provider referansı, işlem ID'si).
  - Refund (geri ödeme) işleminin finansal icrasını.
  - **Yapamaz:** Sipariş oluşturamaz, kargo başlatamaz, hakediş (settlement) hesaplayamaz.

- **Order owner neyi mutate edebilir?**
  - Başarılı bir ödeme sonrası `order` entity'sini oluşturabilir.
  - Siparişin yaşam döngüsü state'ini yönetebilir (`confirmed`, `preparing`, `shipped`, `delivered`, `cancelled`).
  - Sipariş satırlarının (order lines) durumunu yönetebilir.
  - **Yapamaz:** Ödeme alamaz, para iadesi yapamaz (sadece iade talebini ve sürecini yönetir), hakediş (settlement) durumunu değiştiremez.

- **Finance/settlement owner neyi mutate edebilir?**
  - `settlement-line` ve `payout-batch` gibi finansal kayıtları oluşturabilir ve yönetebilir.
  - Bir işlemin hakedişe dönüşme durumunu (`pending`, `settled`, `payable`, `paid_out`) belirleyebilir.
  - Payout (hakediş ödemesi) işlemlerini başlatabilir ve sonuçlandırabilir.
  - Finansal düzeltme (adjustment) kayıtları oluşturabilir.
  - **Yapamaz:** Siparişin teslimat durumunu değiştiremez, ödeme alamaz (sadece ödeme sonucunu kullanır), ürünün stoğunu veya fiyatını yönetemez.

- **Risk owner neyi yapabilir, neyi yapamaz?**
  - **Yapabilir:** Bir ödeme, sipariş veya hesaba `risk_hold` veya `review_required` gibi bayraklar ekleyebilir. Diğer sistemlerin bu bayraklara göre aksiyon almasını (örn. ödemeyi engelleme, payout'u durdurma) sağlayabilir. Anomali sinyalleri üretebilir.
  - **Yapamaz:** Bir ödemeyi `failed` veya `succeeded` yapamaz. Bir siparişi `cancelled` yapamaz. Bir hakedişi `paid_out` yapamaz. Sadece ilgili owner'ların kararını etkileyecek sinyaller ve bloklar üretir.

- **BFF ve panel bu hatta ne yapamaz?**
  - Bu hattaki hiçbir truth'u (`payment` state, `order` state, `settlement` state vb.) **doğrudan mutate edemezler**. Sadece ilgili owner sisteme `protected action` veya `command` göndererek bir state değişikliği talep edebilirler.

## 5. Reconciliation Hattının Sistem İçindeki Yeri

- **Reconciliation payment owner hattına mı yakın?**
  Evet. `FALLBACK_RETRY_TIMEOUT_POLICY.md` ve `INTEGRATION_BEHAVIOR_RULES.md` dosyalarına göre, bir ödemenin belirsiz (`unknown_result`) kalan durumunu netleştirmek, `payment` sisteminin kendi iç sorumluluğudur. Bu nedenle, bir status inquiry (durum sorgulama) adaptörü ve reconciliation runtime'ı, `Payment Owner` alanının bir parçası olmalıdır.

- **Reconciliation sonucu doğrudan order/finance tetikler mi?**
  Hayır, doğrudan tetiklemez. Reconciliation, sadece `payment`'ın belirsiz olan state'ini `succeeded` veya `failed` gibi nihai bir duruma taşır. Bu nihai durum (`payment_captured` veya `payment_failed` event'i) oluştuktan *sonra*, `Order` veya `Finance` sistemleri bu sonucu dinleyerek kendi süreçlerini (order create, settlement create vb.) başlatır. Zincir korunur.

- **Reconciliation sadece payment sonucunu netleştirir mi?**
  Evet. Ana görevi budur. Provider'dan alınamayan veya callback'i geciken bir işlemin sonucunu kesinleştirmektir.

- **Order handoff hangi sonraki paketin konusu olmalı?**
  Bir sonraki paket olan `10C10-B`, yalnızca PayTR Status Inquiry (durum sorgulama) ve buna bağlı Reconciliation (mutabakat) kararlarının envanterine odaklanacaktır. `10C10-B` paketinde `order create` veya `order handoff` implementasyonu **bulunmayacaktır**. Başarılı ödeme sonucunun siparişe dönüştürülmesi (order handoff), en erken `10C11` paketinin konusu olabilir. Bu, `payment succeeded` olayının yalnızca sipariş oluşturma *hakkı* doğurduğu, ancak siparişin kendisinin ayrı bir `Order Owner` komutu ile oluşturulması gerektiği ilkesini korur.

## 6. Unknown Result / Pending İlkesi

`FALLBACK_RETRY_TIMEOUT_POLICY.md` ve `INTEGRATION_BEHAVIOR_RULES.md` dosyalarına göre ilkeler nettir:

- **timeout kesin başarısızlık değildir:** Bir provider'a yapılan çağrı `timeout` olursa, bu işlemin başarısız olduğu anlamına gelmez. İşlem `unknown_result` olarak işaretlenmeli ve reconciliation'a bırakılmalıdır.
- **unknown_result failure değildir:** Bu durumdaki bir ödeme için kullanıcıya "başarısız" denmemeli, sipariş iptal edilmemelidir. Durumun netleşmesi beklenmelidir.
- **pending provider sonucu final değildir:** `pending` state, işlemin hala devam ettiğini gösterir ve nihai bir başarı veya başarısızlık değildir.
- **reconciliation gerekliliği first-class kabul edilir:** Belirsiz durumları çözme ihtiyacı, sistemin bir "edge-case"i veya "hata"sı değil, entegrasyonların doğası gereği beklenen ve yönetilmesi gereken birinci sınıf bir senaryodur.

## 7. Audit / Event İlkesi

`AUDIT_TAXONOMY.md` ve `EVENT_TAXONOMY.md` dosyalarına göre:

- **provider callback received event ile reconciliation audit aynı şey değildir:**
  - `provider_callback_received` bir **event**'tir; sistemin bir dış sinyal aldığını gösterir.
  - `payment_reconciled` bir **audit** kaydı olabilir; bu, `unknown_result` gibi belirsiz bir durumun, bir sistem veya manuel müdahale ile belirli bir sonuca (`succeeded`/`failed`) bağlandığını gösteren resmi bir denetim izidir.

- **event truth değildir:** Event'ler, bir "truth" değişikliğinin sonucunda yayınlanan sinyallerdir. `payment_captured` event'i, `payment` state'inin `captured` olmasının bir sonucudur; sebebi değil.

- **audit truth değildir:** Audit, "truth"ta yapılan değişikliklerin tarihsel kaydıdır. Kimin, ne zaman, neden bir değişikliğe sebep olduğunu gösterir.

- **correction/reconciliation audit gerektirebilir:** Evet, belirsiz bir durumu netleştirmek veya hatalı bir state'i düzeltmek gibi operasyonel müdahaleler, `reconciliation` veya `correction` tipi audit kayıtları üretmelidir.

- **bu görevde audit/event implementation yapılmayacak:** Doğru, bu bir envanter görevidir.

## 8. Kritik Journey Etkisi

`CRITICAL_JOURNEY_CHECKLIST.md` dosyasındaki `payment` → `order` yolculuğu için:

- **payment captured / succeeded order create ile aynı şey değildir:** Bu, en kritik ilkedir. `10C9-02` bu sınırı korumuştur. Gelecekteki implementasyon, `payment_captured` sonrası ayrı ve idempotent bir `order_create` komutu çalıştırmalıdır.

- **duplicate order oluşmamalıdır:** Bu, `order_create` komutunun `payment_attempt_id` gibi bir anahtarla idempotent yapılmasını gerektirir. Aynı başarılı ödeme için ikinci bir sipariş oluşturulmamalıdır.

- **unknown-result kullanıcıya yanlış kesin sonuç olarak gösterilmemelidir:** Kullanıcıya "Ödemeniz kontrol ediliyor" gibi bir ara durum gösterilmeli, "başarısız oldu" veya "başarılı" gibi kesin bir dil kullanılmamalıdır.

- **fail/retry/reconciliation davranışı açık olmalıdır:** Sistem, bu üç yolu da ayrı ayrı yönetebilmelidir. `10C9-02` yalnızca `fail` durumunu yönetmektedir. `retry` (kullanıcı tarafından) ve `reconciliation` (sistem tarafından) gelecek paketlerin konusudur.

## 9. Kırmızı Bayrak / Sarı Bayrak

- **Kırmızı Bayrak:**
  Yok. Mevcut `10C9-02` implementasyonu, belirtilen sınırlar içinde kaldığı ve agresif adımlar atmadığı için kırmızı bayrak oluşturmamaktadır.

- **Sarı Bayraklar (Değerlendirme):**
  - **Kod payment state isimleri ile planlama payment state isimleri birebir aynı değil; mapping gerekir:** Beklenen bir durumdur. `STATE_MACHINES/payment.md` dosyasındaki state'ler (`captured`, `authorizing` vb.) idealize edilmiş kanonik state'lerdir. Koddaki (`SUCCEEDED`, `FAILED`) isimlendirme daha basit bir başlangıçtır. Gelecekte, daha granüler state'ler eklendikçe bu mapping'in dikkatli yapılması gerekecektir. **Bu sarı bayrak geçerlidir.**
  - **Pending/unknown_result mutation erken yapılırsa order/finance zincirinde yanlış sonuç doğabilir:** Kesinlikle. `pending` bir ödemeyi `succeeded` saymak, olmayan parayla sipariş oluşturmaya veya hakediş hesaplamaya yol açar. Bu yüzden bu durumların mutasyonu, reconciliation tam olarak tasarlanana kadar yapılmamalıdır. **Bu sarı bayrak kritiktir.**
  - **Reconciliation state ayrı tutulmazsa callback processing status şişebilir:** Evet. Bir callback kaydının `processingStatus`'u (`accepted`, `rejected`, `ignored`) ile `payment`'ın kendi ana state'i (`pending_reconciliation`) ayrı tutulmalıdır. Aksi takdirde, hangi ödemelerin aktif olarak mutabakat beklediğini sorgulamak zorlaşır. **Bu sarı bayrak geçerlidir.**
  - **Provider callback business truth sayılırsa owner boundary kırılır:** Evet, bu en temel kuralın ihlali olur ve kırmızı bayrağa döner. Callback doğrudan veritabanını güncellerse, sistemin tüm `owner` ve `guard` mantığı çöker. Mevcut implementasyon bu hatayı yapmamaktadır. **Bu sarı bayrak, bir uyarı olarak geçerlidir.**

## 10. Nihai Karar

**HARDENING-10C10-A — BOUNDARY INVENTORY COMPLETE / 10C10-B REQUIRED**
