# STATEFUL_UI_BEHAVIOR_GUIDE

## 1. Amaç

Bu dosya, Aşama 8 kapsamında storefront, app ve panel yüzeylerinin state değişimlerinde nasıl davranacağını sabitler.

Bu dosyanın amacı:

* ekranların yalnız veri göstermesini değil, durum değişimlerine nasıl tepki vereceğini netleştirmek,
* login gate, eligibility gate, permission gate ve state gate davranışlarını görünür kılmak,
* optimistic ve non-optimistic UI sınırlarını belirlemek,
* error / retry / conflict / unknown-result / degraded durumlarının kullanıcıya nasıl yansıyacağını standartlaştırmak,
* moderation, fraud/risk ve policy kaynaklı blokların ekran dilini sabitlemek,
* UI’nın state machine yerine geçmesini engellemektir.

Net kural:

* UI truth üretmez.
* UI state machine owner’ı değildir.
* UI, owner sistemlerden gelen state’i dürüst yansıtır.
* UI, belirsiz sonucu kesinlik gibi göstermez.

---

## 2. Kapsam

Bu rehber şu yüzey ailelerini kapsar:

### Storefront / app

* Ana Sayfa
* Keşfet
* Arama
* Kategori / PLP
* PDP
* Sepet
* Checkout
* Ödeme
* Sipariş Detayı
* Sipariş Takip
* İptal / İade Başlangıç Akışı
* Bildirim Merkezi
* Destek Girişi

### Panel / iç operasyon

* Admin Panel
* Fenomen Paneli
* Tedarikçi Paneli
* Sipariş Operasyon Paneli
* Destek Ticket Operasyon Paneli

---

## 3. Temel davranış ilkeleri

### 3.1 Truth-first görünürlük

* Önce owner truth esas alınır.
* Projection varsa projection gecikebilir.
* Geciken projection, kesin truth gibi sunulmaz.

### 3.2 Belirsizlik dürüst gösterilir

* Timeout veya provider belirsizliği olduğunda “başarısız” veya “tamamlandı” varsayımı yapılmaz.
* `unknown_result`, `pending_external`, `reviewing`, `degraded` gibi ara durumlar first-class kabul edilir.

### 3.3 UI command’ı command gibi davranır

* Butona basmak truth mutation değildir.
* UI aksiyon verdi diye sonuç kesin olmuş sayılmaz.
* Özellikle payment, order, shipment, refund, payout, moderation ve panel protected action yüzeylerinde accepted ile completed ayrımı korunur.

### 3.4 Gate’ler UI’da görünür olmalıdır

* Login gate
* Eligibility gate
* Permission gate
* State gate
* Moderation / risk / policy block

Bu engeller sessizce başarısız olmaz; kullanıcıya mümkün olduğunca neden gösterilir.

---

## 4. State davranış sınıfları

Bu rehberde UI davranışı 8 temel state sınıfıyla ele alınır:

1. `loading`
2. `ready`
3. `empty`
4. `blocked`
5. `degraded`
6. `pending`
7. `conflict`
8. `unknown_result`

### 4.1 loading

* İçerik veya blok yükleniyor.
* Skeleton / shimmer / placeholder uygundur.
* Loading süresince sahte son veri uydurulmaz.

### 4.2 ready

* Veri veya aksiyon görünmeye hazır.
* Kullanıcı etkileşimi açık olabilir.

### 4.3 empty

* Teknik hata değil; içerik yok veya uygun kayıt yok.
* Empty-state yönlendirici olmalıdır.

### 4.4 blocked

* Kullanıcı bir aksiyonu yapamaz veya bir blok görünmez.
* Sebep login, eligibility, permission, moderation, risk veya state olabilir.

### 4.5 degraded

* Veri kısmen eksik veya kaynaklardan biri kullanılamıyor.
* Ekran mümkün olduğunca güvenli kısmı gösterir.
* Sahte tamlık üretilmez.

### 4.6 pending

* İşlem kabul edildi ama tamamlanmadı.
* İç veya dış sistem sonucu bekleniyor olabilir.

### 4.7 conflict

* Geçersiz geçiş, stale data, duplicate command veya state çakışması var.
* Refresh / retry / geri dönüş gerekebilir.

### 4.8 unknown_result

* Özellikle dış sağlayıcı bağımlı akışlarda sonuç bilinmiyor.
* Kullanıcıya yanlış kesinlik verilmez.
* Reconciliation veya bekleme gerekebilir.

---

## 5. Login gate davranış rehberi

### 5.1 Genel kural

* Misafir kullanıcı açık yüzeyleri rahatça görebilir.
* Login duvarı yalnız kimlik bağlı aksiyon anında açılır.
* Erken ve kör duvar yaklaşımı kullanılmaz.

### 5.2 Login isteyen aksiyonlar

* Beğen
* Kaydet
* Takip et
* Mesaj gönder
* Soru sor
* Yorum yaz
* Story / içerik yükle
* Hesap bağlı sipariş/destek geçmişi alanları

### 5.3 Ticari istisna

*REVİZYON NOTU: Bu bölüm, kanonik guest checkout kararıyla hizalanmıştır.*

* Guest checkout ticari bir istisnadır; misafir kullanıcı bu akışta ödeme yapabilir ve sipariş oluşturabilir. Commerce akışında login duvarı yoktur.
* Ancak guest checkout, sosyal hak açmaz. Ödeme yapılmış olması misafire review, story veya beğeni gibi hesap bağlı hakları kazandırmaz.

### 5.4 UI davranışı

Login gereken aksiyonda:

* Buton gizlenmezse, tıklamada login gate açılır.
* Kullanıcı mümkünse aynı bağlama geri döndürülür.
* Aksiyon intent’i kaybedilmez.

---

## 6. Eligibility gate davranış rehberi

### 6.1 Genel kural

Eligibility, yalnız auth ile açılmaz. UI bunu görünür kılmalıdır.

### 6.2 Örnek eligibility alanları

* Review eligibility
* Story eligibility
* Return eligibility
* Payout eligibility
* Coupon applicability
* Question availability

### 6.3 UI davranışı

* Uygun değilse aksiyon disable veya gated gösterilebilir.
* Mümkünse neden belirtilir.
* “Teslimattan sonra yorum yapabilirsin”, “Bu ürün için iade süresi doldu” gibi bağlamsal dil kullanılır.

### 6.4 Sahte enable yasağı

* Yalnız auth var diye review/story/return açılmaz.
* UI, eligibility olmayan aksiyonu normal açık göstermez.

---

## 7. Permission / scope / panel gate davranış rehberi

### 7.1 Panel yüzeylerinde genel kural

* Auth yeterli değildir.
* Scope gerekir.
* Permission gerekir.
* Gerekirse reason code ve audit zorunluluğu da vardır.

### 7.2 UI davranışı

* Yetkisiz aksiyon ya görünmez ya da disabled + reason ile görünür.
* Invalid transition açık conflict davranışıyla gösterilir.
* “Access denied”, “Actor not allowed”, “Reason code required” gibi semantik farklar korunur.

---

## 8. Optimistic vs non-optimistic UI rehberi

### 8.1 Optimistic UI izinli alanlar

Hafif sosyal ve M4 tipi etkileşimlerde optimistic davranış uygulanabilir:

* Beğen
* Kaydet
* Takip et
* Bazı hafif sosyal etkileşimler

### 8.2 Optimistic UI sınırları

Optimistic UI yalnız şu şartlarda kullanılabilir:

* Owner truth sosyal etkileşim alanıdır
* Geri alma / rollback mümkündür
* Finansal veya kritik commerce truth etkilenmez

### 8.3 Non-optimistic zorunlu alanlar

Aşağıdaki alanlarda optimistic truth görünürlüğü kullanılmaz:

* Sepet kritik mutation doğrulaması gerekiyorsa
* Checkout validity
* Payment initiate sonucu
* Order created görünürlüğü
* Shipment delivered görünürlüğü
* Refund completed görünürlüğü
* Payout result
* Panel protected actions

### 8.4 Neden

Bu alanlar ticari, finansal veya operasyonel truth’tur. Yanlış erken kesinlik güven ve doğruluk bozar.

---

## 9. Storefront yüzey davranış rehberi

## 9.1 Ana Sayfa

### loading

* Blok bazlı skeleton uygundur.
* Header ve temel navigasyon mümkün olduğunca erken görünmelidir.

### degraded

* Tek blok unavailable ise diğer bloklar yüklenebilir.
* Blok içinde “şu anda gösterilemiyor” dili kullanılabilir.

### empty

* Belirli blok boş olabilir; tüm ana sayfa boş sayılmaz.

### yasak

* Boş veya unavailable bloğu sahte içerikle doldurmak.

---

## 9.2 Keşfet

### loading

* Feed ve story strip ayrı yüklenebilir.
* Video kartlarda hafif placeholder davranışı uygundur.

### degraded

* Story strip veya feed parçalı bozulabilir.
* Video akışı bozulduysa keşfet “karar yüzeyi” gibi alternatif listeye zorla dönüştürülmez.

### empty

* Yeni içerik yoksa empty discovery state yönlendirici olmalıdır.

### interaction behavior

* Beğen/kaydet/paylaş hafif ve akış bozmayan şekilde çalışır.
* Login gate aksiyon anında açılır.

---

## 9.3 Arama

### empty query

* Son aramalar / öneriler / yönlendirici girişler gösterilebilir.

### no result

* “Sonuç yok” net görünür.
* Yakın kategori / mağaza / öneri geçişi sunulabilir.

### degraded

* Suggestion veya facet unavailable olabilir.
* Ama yanlış sonuç kesinliği gösterilmez.

### conflict

* Çok hızlı filtre/sort değişiminde stale response güvenli şekilde yenilenir.

---

## 9.4 Kategori / PLP

### loading

* Liste ve facet ayrı yüklenebilir.

### filter apply

* Filtre değişince ekran yeni sonucu beklediğini net göstermelidir.
* Eski liste ile yeni filter state karışmamalıdır.

### empty

* Sonuç yoksa filtreleri temizle / üst kategoriye dön gibi yönlendirici aksiyonlar verilir.

### degraded

* Facet verisi bozulduysa liste çalışmaya devam edebilir; bu partial degraded olarak görünür.

---

## 9.5 PDP

### loading

* Medya, ürün bilgi ve satın alma bloğu kontrollü skeleton ile yüklenebilir.

### variant gate

* Varyant zorunluysa seçilmeden add-to-cart / buy-now kesin çalışır gibi görünmez.
* CTA disabled veya gated olabilir.

### stock behavior

* Stok yoksa CTA net bloklanır.
* Düşük stok varsa dürüst baskı / kıtlık dili kullanılabilir; rezervasyon vaadi verilmez.

### social/content degraded

* Review, soru-cevap veya sosyal kanıt blokları kısmen unavailable olabilir.
* Core ticari karar bloğu ile karıştırılmaz.

### interaction behavior

* Beğen/kaydet/paylaş login ister.
* Review / soru aksiyonları auth + eligibility gerektirir.

### policy / moderation behavior

* İçerik kaldırılmış veya kısıtlıysa blok düzeyinde uygun dil kullanılır.

---

## 10. Commerce flow davranış rehberi

## 10.1 Sepet

### availability drift

* Sepette ürün var diye checkout garantili değildir.
* Fiyat/stok drift uyarıları görünür olabilir.

### line issues

* Tek satır problemliyse tüm sepet çökmez; satır bazlı uyarı gösterilir.

### checkout gate

* Checkout geçişi kritik problem varsa bloklanabilir.

---

## 10.2 Checkout

### reviewing state

* Kullanıcıya sistemin doğrulama yaptığını gösterir.
* Stok/fiyat/adres/kupon/teslimat uygunluğu bu sırada yeniden kontrol edilir.

### invalid state

* Invalid checkout genel “bir şeyler ters” mesajına düşmez.
* Sebep sınıfı mümkün olduğunca görünür olur:

  * fiyat değişti
  * stok yetersiz
  * adres uygun değil
  * kupon geçersiz

### ready_for_payment state

* Bu, sipariş oluştu anlamına gelmez.
* Yalnız ödeme için temiz bağlam hazır demektir.

### expired state

* Checkout süresi dolduysa kullanıcıya yenileme / geri dönme yönü verilir.
* Expired state gizli tutulmaz.

### guest behavior

*REVİZYON NOTU: Bu bölüm, kanonik guest checkout kararıyla hizalanmıştır.*

* Misafir kullanıcı checkout ve ödeme akışını tamamlayabilir, sipariş oluşturabilir.
* Ancak guest checkout açık olması, sosyal hak açıldığı izlenimi vermemelidir. UI, commerce tamamlandığında kullanıcıyı login action'a zorlamaz, fakat profil veya story alanına geçmeye çalıştığında login barrier çıkarır.

---

## 10.3 Payment

### initiating

* Kullanıcı ödeme başlatıldığını görür.
* Çoklu tıklama / duplicate başlatma engellenir.

### pending_provider

* Dış sağlayıcı sonucu bekleniyor olabilir.
* Kullanıcı erken “başarısız” veya “tamamlandı” ile yanıltılmaz.

### failed

* Geri dönüş yolu net olmalıdır.
* Checkout’a temiz dönülebilir veya retry önerilebilir.

### unknown_result

* Timeout = kesin başarısızlık değildir.
* Kullanıcıya belirsiz sonuç dili gösterilir.
* “Ödeme sonucu doğrulanıyor” benzeri güvenli dil gerekir.

### captured visibility

* Payment captured sonucu görünse bile order created görünürlüğü ayrı olabilir.
* “Siparişiniz oluşuyor” / “Sipariş hazırlanıyor” ayrımı korunur.

---

## 10.4 Order detail

### created/confirmed visibility

* Sipariş oluştuğu an kullanıcıya resmi kayıt hissi verilmelidir.
* Ama iç operasyon state’leri kullanıcıya dökülmez.

### post-order actions

* İptal/iade/destek aksiyonları eligibility’ye göre açılır.

### partial states

* Kısmi teslimat / kısmi iptal / kısmi iade durumları sipariş detayında dürüst görünür olmalıdır.

---

## 11. Post-order / support davranış rehberi

## 11.1 Sipariş takip

### tracking state

* Kullanıcıya sade, dürüst ve anlaşılır milestone dili gösterilir.
* İç operasyon karmaşası aynen yansıtılmaz.

### stale projection

* Tracking gecikebilir ama yalan söylemez.
* Gecikme veya belirsizlik varsa uygun uyarı verilir.

### delivered behavior

* Delivered görünürlüğü, teslimat sonrası hakların açılması için eşiktir.
* Ancak eligibility propagation anlık olmayabilir; bu UI’da dürüstçe yönetilmelidir.

---

## 11.2 Cancel / return entry

### cancel vs return ayrımı

* İptal teslimat öncesi, iade teslimat sonrası eksendir.
* UI bu iki akışı tek başlık altında bulanıklaştırmaz.

### approved vs refunded ayrımı

* Request approved = refund completed değildir.
* UI bu iki aşamayı ayrı gösterir.

### partial behavior

* Satır bazlı uygunluk ve sonuçlar desteklenmelidir.

---

## 11.3 Notification center

### priority behavior

* Zorunlu bildirimler öne çıkar.
* Gürültülü sosyal sinyaller özetlenebilir.

### read state

* Okundu / okunmadı görünürlüğü net olmalıdır.

### failure isolation

* Notification gecikmesi ana truth’u geri aldırmaz.

---

## 11.4 Support entry

### entry behavior

* Destek giriş noktası her sayfada erişilebilir olabilir.
* Ama serbest chat ile açılmaz.

### topic-first

* Önce konu seçimi
* Sonra self-service / yönlendirme
* Çözülmezse ticket / insan desteği

### context behavior

* PDP, sipariş, ödeme, teslimat gibi bağlamlarda destek başlıkları bağlamsal olarak zenginleşebilir.

---

## 12. Moderation / risk / policy davranış rehberi

## 12.1 Moderation kaynaklı blok

Aşağıdaki alanlarda moderation block görünür olmalıdır:

* Yorum
* Soru-cevap
* Story
* Post
* Mağaza içeriği

UI davranışı:

* İçerik kaldırıldıysa “yok oldu” gibi davranılmaz.
* Gerektiğinde kısıtlı / kaldırıldı / incelemede dili kullanılır.

## 12.2 Risk / abuse kaynaklı blok

Aşağıdaki aksiyonlarda risk block olabilir:

* Kupon kullanımı
* Puan / reward işlemleri
* Yoğun etkileşim üretimi
* Sipariş / iade örüntüleri

UI davranışı:

* Genel güvenlik blokları kaba ve açıklamasız duvar olmamalıdır.
* Ama abuse hassasiyeti nedeniyle ayrıntı her zaman tam açılmaz.

## 12.3 Policy block

* Bazı aksiyonlar platform politikası nedeniyle açılmayabilir.
* Bu durum “bug” gibi sunulmaz; policy block dili taşır.

---

## 13. Panel davranış rehberi

## 13.1 Admin panel

### queue behavior

* Onay, inceleme, escalation kuyrukları boşsa operasyonel empty-state gösterilir.

### protected action behavior

* Aksiyon sonrası accepted göstermek yeterli olabilir.
* Final outcome hemen gelmeyebilir.

### invalid transition

* Sessiz başarısızlık olmaz.
* Açık conflict görünürlüğü gerekir.

---

## 13.2 Creator panel

### mobile-first behavior

* En sık işler 1–2 adımda erişilebilir olmalıdır.

### restriction visibility

* Mağaza restricted veya suspended ise fenomen bunu net görmelidir.
* Sebepsiz kaybolan aksiyonlar kullanılmaz.

### self-service boundary

* Kullanıcı kendi mağazasını yönetir; owner olmayan alanlarda UI sahte yetki vermez.

---

## 13.3 Supplier panel

### revision behavior

* Revizyon istenen ürünler belirgin ve işlenebilir görünür olmalıdır.

### stock/base price behavior

* Kritik input alanlarında stale data ile yanlış kaydetme riski azaltılmalıdır.

### fulfillment alerts

* Yeni iş, geciken iş, problemli iş ayrımı görünür olmalıdır.

---

## 13.4 Order operations panel

### work queue behavior

* Operasyon iş listesi öncelik ve problem sinyali taşımalıdır.

### delay/problem behavior

* Gecikme veya tıkanma yalnız renk ile değil, semantik state ile gösterilmelidir.

### accepted vs completed

* Operasyon aksiyonu accepted olabilir; fiziksel süreç ayrı tamamlanır.

---

## 13.5 Support ticket operations panel

### triage behavior

* Ticket aynı anda hem çözüldü hem bekliyor gibi görünmez.
* Owner queue ve SLA state net ayrılır.

### escalation behavior

* Escalation, state değişimiyle görünür olmalıdır.

### reopen behavior

* Reopened ticket açıkça yeniden açılmış state taşır; kapalı ticket ile karışmaz.

---

## 14. Command sonucu görünürlük rehberi

### 14.1 Accepted vs completed ayrımı

Aşağıdaki aksiyonlarda UI, `accepted` ile `completed` ayrımını net korumalıdır:

* Panel protected actions
* Payment initiate
* Return / refund başlatma akışları
* Destek escalation aksiyonları
* Bazı operasyon aksiyonları

Doğru davranış:

* accepted = istek kabul edildi / işleme alındı
* completed = owner sistem nihai sonucu üretti

Yanlış davranış:

* accepted sonucu tamamlanmış truth gibi göstermek

### 14.2 Immediate result gösterilebilecek alanlar

Aşağıdaki alanlarda sonuç çoğu zaman anlık ve net gösterilebilir:

* Beğen / kaydet toggle
* Hafif sosyal etkileşim sayaç güncellemesi
* Basit bildirim okundu işareti

Bu alanlarda da rollback ihtimali varsa UI bunu yönetebilmelidir.

### 14.3 Delayed finalization alanları

Aşağıdaki alanlarda final görünürlük gecikmeli olabilir:

* Payment -> order create
* Delivered -> eligibility propagation
* Return approved -> refund completed
* Panel action -> downstream owner sonucu

UI davranışı:

* Ara durum görünür olur
* Kullanıcıya ne beklendiği söylenir
* Sessiz şekilde ekrandan kaybolan ara durum kullanılmaz

---

## 15. Retry / refresh / duplicate davranış rehberi

### 14.1 Retry yapılabilecek durumlar

* Notification delivery
* Bazı internal command görünürlükleri
* Güvenli yeniden deneme desteklenen payment / checkout alt akışları

### 14.2 Retry yapılmaması gereken durumlar

* Invalid transition
* Permission reddi
* Kesin policy reddi
* Kesin domain rejection

### 14.3 UI duplicate koruması

* Hızlı çoklu tıklama engellenir.
* Aynı aksiyon birden fazla kez accepted gibi görünmez.
* Özellikle payment initiate, panel protected action, iade başlat, payout release gibi alanlarda bunu korumak zorunludur.

### 14.4 Refresh davranışı

* Conflict veya stale-data durumunda kullanıcıya refresh / yeniden doğrulama önerilebilir.
* Arka planda sessiz refresh mümkünse kullanılabilir; ama final state saklanmaz.

---

## 16. Kullanıcı diline çeviri kuralları

UI dili şu ayrımları korumalıdır:

* accepted ≠ completed
* approved ≠ refunded
* delivered ≠ fully propagated
* captured ≠ order created
* restricted ≠ deleted
* degraded ≠ broken
* empty ≠ error

Bu ayrımlar ekran metinlerinde ve buton davranışlarında korunmalıdır.

---

## 17. Satır / paket / kısmi durum davranış rehberi

### 17.1 Kısmi teslimat

* Siparişin tamamı teslim edilmedi diye teslim edilen satır gizlenmez.
* Teslim edilen satır için ilgili hak veya sonraki aksiyon bağlamı ayrı görünür olabilir.

### 17.2 Kısmi iptal / kısmi iade

* Tüm sipariş tek kaba statüye indirgenmez.
* Hangi satırın iptal / iade sürecinde olduğu görünür olmalıdır.

### 17.3 Paket bazlı ayrım

* Tracking ve order detail yüzeylerinde paket bazlı görünürlük gerekiyorsa korunmalıdır.
* Paket state ile sipariş state karıştırılmaz.

### 17.4 UI dili

* “Siparişinizin bir kısmı teslim edildi” gibi dürüst ara dil kullanılmalıdır.
* Kısmi durumlar tam başarı veya tam başarısızlık gibi sunulmaz.

---

## 18. Yasak davranışlar

Aşağıdakiler bu rehber kapsamında yasaktır:

* UI’da sahte kesinlik üretmek
* Unknown-result’ı başarısız veya başarılı varsaymak
* Eligibility gerektiren aksiyonu normal açık göstermek
* Panel aksiyonunu direct write gibi sunmak
* Moderation/risk blocklarını sessizce yutmak
* Projection gecikmesini truth gibi sunmak
* Sosyal yüzeylerdeki optimistic davranışı commerce truth alanlarına taşımak

---

## 19. Aşama 8 kapsamında bu dosyanın kapanış kriteri

Bu dosya şu durumda kapanmış kabul edilir:

* loading / ready / empty / blocked / degraded / pending / conflict / unknown_result sınıfları yazılmışsa,
* login / eligibility / permission / state gate davranışları sabitlenmişse,
* optimistic ve non-optimistic alan sınırı çizilmişse,
* checkout / payment / order / tracking / cancel-return davranışları dürüst biçimde ayrılmışsa,
* moderation / risk / policy block ekran dili belirlenmişse,
* panel yüzeylerinde protected action davranışı netleşmişse.

---

## 20. Aşama 8 kapanış özeti

Bu dosyayla birlikte Aşama 8’in dört ana teslimi tamamlanmış olur:

* `SCREEN_CONTRACTS.md`
* `PANEL_CONTRACTS.md`
* `DTO_RESPONSE_CATALOG.md`
* `STATEFUL_UI_BEHAVIOR_GUIDE.md`

Bu noktadan sonra Aşama 8 çıktıları:

* ekranın ne olduğunu,
* panelin ne olduğunu,
* hangi veriyle beslendiğini,
* state değişince nasıl davranacağını
  koddan önce sözleşme düzeyinde sabitlemiş olur.
