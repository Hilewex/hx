# OPERATION_LOGIC_GUIDE

## 1. Amaç

Bu dosya, platformun operasyonel çalışma mantığını tek doğrulu, uygulanabilir ve çakışmasız bir rehbere dönüştürür.

Bu dosyanın amacı:

* support, ticket, sipariş operasyonu, teslimat, iade, moderasyon, risk, finance, payout ve lifecycle yönetimi arasındaki çalışma ilişkisini bağlayıcı hale getirmek
* "hangi problem önce nerede ele alınır", "hangi noktada hangi domain owner devreye girer", "hangi ekip neyi çözer, neyi çözemez" sorularını yoruma kapatmak
* escalation, SLA ve approval dosyalarında kurulan kararları tek işletim mantığında birleştirmek
* sosyal alan, kullanıcı yüzü, panel ve owner domain sınırlarının operasyon sırasında bozulmasını engellemektir

Net kural:

* Operasyon mantığı, kullanıcıya görünen deneyimle aynı şey değildir
* Support, owner truth yerine geçmez
* Admin panel, owner domain yerine geçmez
* Sosyal iletişim kanalları resmi operasyon çözüm alanı değildir
* Her problem doğru queue, doğru owner ve doğru governance seviyesiyle ele alınmalıdır
* Official owner outcome olmadan kullanıcıya kesin sonuç dili verilmez

---

## 2. Kapsam

Bu rehber ilk fazda aşağıdaki operasyon ailelerini kapsar:

1. kullanıcı destek giriş mantığı
2. support ticket triage ve queue mantığı
3. sipariş operasyon ve fulfillment mantığı
4. shipment / delivery anomaly mantığı
5. iade / iptal / refund koordinasyon mantığı
6. moderasyon ve risk koordinasyon mantığı
7. finance / payout kontrollü çözüm mantığı
8. creator lifecycle operasyon mantığı
9. supplier lifecycle operasyon mantığı
10. admin sistemi üst koordinasyon mantığı
11. bildirim ve kullanıcıya dürüst durum yansıtma mantığı
12. escalation ve approval entegrasyon mantığı

Bu dosya aşağıdaki alanları ayrıntılı uygulama prosedürü seviyesinde açmaz:

* vardiya çizelgesi
* ajan bazlı görev planı
* ekran UI tasarım detayları
* teknik servis/topoloji mimarisi

---

## 3. Temel işletim ilkeleri

### OL-001 — İlk temas ile nihai çözüm aynı ekipte olmak zorunda değildir

**Binding Rule:** Support çoğu vakada giriş kapısıdır; nihai çözüm owner domain’de oluşur.

### OL-002 — Doğru queue ilk çözümdür

**Binding Rule:** Vakanın yanlış queue’ya düşmesi çözüm süresini bozduğu için operasyon mantığında ilk hedef doğru sınıflandırmadır.

### OL-003 — Her domain kendi truth sınırında kalır

**Binding Rule:** Support, moderation, risk, finance, payout, creator ve supplier yönetimi birbirinin truth alanına doğrudan write yapmaz.

### OL-004 — Kullanıcıya dürüst ama sade durum gösterilir

**Binding Rule:** İç operasyon karmaşıklığı kullanıcıya aynen yığılmaz; ama gerçek durum da saklanmaz.

### OL-005 — Sosyal kanal ile resmi süreç ayrımı bozulmaz

**Binding Rule:** Fenomen mesaj kutusu, takip, post veya sosyal etkileşim alanları resmi support/finance/return/moderation çözüm zincirine dönüştürülemez.

### OL-006 — Problemli akış first-class kabul edilir

**Binding Rule:** Sorunlu sipariş, delivery anomaly, unknown-result payment, high-risk moderation ve payout hold istisna değil, yönetilmesi gereken first-class operasyon aileleridir.

### OL-007 — Her kritik çözüm zinciri audit ve lineage üretir

**Binding Rule:** Operasyon sırasında handoff, correction, hold, release, suspend, restrict ve reconciliation history-first çalışır.

### OL-008 — Projection ile truth ayrımı korunur

**Binding Rule:** Tracking, support görünürlüğü, notification ve panel özetleri projection’dır; resmi state mutation owner domain’de kalır.

---

## 4. Operasyon katman modeli

### 4.1 Kullanıcı yüzü katmanı

Kullanıcının gördüğü destek cebi, sipariş takip ekranı, iade akışı, bildirim merkezi ve ilgili CTA’lar bu katmandadır.

### 4.2 Destek / triage katmanı

Problemin ilk sınıflandırıldığı, queue’ya düştüğü ve doğru owner’a yönlendirildiği katmandır.

### 4.3 Domain owner çözüm katmanı

Order ops, delivery ops, finance ops, moderation ops, risk ops, payout ops, creator admin, supplier admin gibi gerçek çözüm ownership katmanıdır.

### 4.4 Governance katmanı

Commerce admin, operations admin, finance admin, moderation admin, support admin ve super admin seviyesinde approval, override ve üst escalation katmanıdır.

Net kural:

* Kullanıcı yüzü çözüm katmanı değildir
* Triage truth owner değildir
* Governance her vakaya otomatik dahil olmaz; gerektiğinde devreye girer
* Projection katmanı owner outcome olmadan kesin çözüm dili üretemez

---

## 5. Kullanıcı destek giriş mantığı

### OL-010 — Destek her sayfada erişilebilir olabilir, ama serbest chat ile başlamaz

**Binding Rule:** Doğru başlangıç modeli destek cebi -> konu seçimi -> alt konu -> self-service -> ticket/canlı destek/escalation zinciridir.

### OL-011 — Bağlamsal giriş destek kalitesini artırır

**Binding Rule:** PDP, cart, checkout, sipariş detay ve takip ekranı farklı konu başlıklarını öne çıkarabilir; ama ticket truth’u tek sistemde kalır.

### OL-012 — Self-service önce gelir

**Binding Rule:** Kullanıcının problemi görünür bilgi ve yönlendirmeyle çözülebiliyorsa önce self-service çalışır; gereksiz ticket yükü açılmaz.

### OL-013 — Kritik commerce belirsizliği support katmanında sonlandırılamaz

**Binding Rule:** "ödeme alındı ama sipariş yok", "teslim edildi görünüyor ama almadım", "refund görünmüyor" gibi durumlar açıklama metniyle kapatılamaz; domain escalation gerekir.

### OL-014 — Destek girişi resmi süreç başlatır, dostane sohbet üretmez

**Binding Rule:** Kullanıcı destek kanalına girdiğinde sistem konu, bağlam ve owner zinciri üretmelidir; serbest mesajlaşma mantığı baskın olmamalıdır.

---

## 6. Support ticket triage mantığı

### OL-020 — Her ticket önce triage katmanına girer

**Binding Rule:** Ticket doğrudan rastgele ajan çözümüne bırakılmaz; tür, öncelik, owner ve bağlam triage’da netleşir.

### OL-021 — Triage’ın işi çözmek değil, doğru çözüm yolunu açmaktır

**Binding Rule:** Support triage aşağıdakileri yapar:

* kategori belirleme
* priority belirleme
* queue seçme
* gerekli context tamamlama
* doğru owner handoff

### OL-022 — Ticket türü ile owner domain aynı şey değildir

**Binding Rule:** Ödeme problemi ticket’ı support sistemine girer ama finance owner’da çözülür; mağaza şikayeti support girişi olabilir ama moderation/creator admin owner olabilir.

### OL-023 — Owner’ı belirsiz ticket operasyonel kayıp vakadır

**Binding Rule:** owner_type ve owner_id/team_id net değilse ticket çözüme değil belirsizliğe gider; bu durum kabul edilmez.

### OL-024 — Support iletişimi sürdürür, ownership almaz

**Binding Rule:** Domain owner çözüm üretirken kullanıcıya geri bildirim support üzerinden gidebilir; bu, support’ün solution owner olduğu anlamına gelmez.

---

## 7. Support queue ve handoff mantığı

### OL-030 — Canonical queue aileleri korunur

İlk fazda en az şu queue mantığı çalışmalıdır:

* genel support
* sipariş / teslimat
* iade / iptal
* ödeme / finans
* teknik sorun
* moderasyon / şikayet
* fraud / risk
* yüksek öncelik / kritik queue gerekirse

### OL-031 — Handoff resmi çözümdür, kaçış değildir

**Binding Rule:** Support’un doğru domain owner’a devretmesi başarısızlık değil, doğru işletimdir.

### OL-032 — Handoff context’siz yapılamaz

**Binding Rule:** order_id, payment_ref, shipment_id, moderation_item, creator_id, supplier_id gibi bağlamlar olmadan handoff açılmaz.

### OL-033 — Handoff sonrası support görünürlüğü sürer, ownership devredilir

**Binding Rule:** Kullanıcı iletişimi support üzerinden gidebilir; ama çözüm ownership domain owner’da kalır.

### OL-034 — Handoff sonucu resolution yerine geçmez

**Binding Rule:** Handoff support katmanında doğru sonuç olabilir; fakat bütün vaka açısından final resolution ancak official owner outcome ile oluşur.

---

## 8. Sipariş operasyon mantığı

### OL-040 — Sipariş operasyonu kullanıcı ekranı değil, iç iş akışıdır

**Binding Rule:** Başarılı ödeme sonrası oluşmuş sipariş, operasyon işine dönüşür; kullanıcı sadece sadeleştirilmiş sonucu takip ekranında görür.

### OL-041 — Order ops, siparişi iş kuyruğuna dönüştürür

**Binding Rule:** Sipariş operasyon sistemi şu işleri üstlenir:

* line/package ayrıştırma
* tedarikçi / fulfillment görevine düşürme
* problemli işleri ayırma
* sevkiyat öncesi darboğazı görünür kılma

### OL-042 — Kısmi operasyon normaldir, ama kaba görünmezlik yasaktır

**Binding Rule:** Tek siparişte bazı satırlar ilerlerken bazıları takılabilir; bu hem ops hem kullanıcı görünürlüğünde dürüst yönetilmelidir.

### OL-043 — Fenomen sipariş operasyon owner’ı değildir

**Binding Rule:** Fenomen satış yüzü olabilir ama package ayırma, shipment state güncelleme, fulfillment yönlendirme yapamaz.

### OL-044 — Tedarikçi görev aktörüdür, order truth owner değildir

**Binding Rule:** Tedarikçi hazırlama ve sevkiyat bilgisini üretir; ama sipariş truth’unu keyfi yönetemez.

### OL-045 — Order ops projection’ı order truth yerine geçmez

**Binding Rule:** Operasyon panelindeki görev/iş kuyruğu görünümü order state’in projection’ıdır; resmi state owner alanında korunur.

---

## 9. Sipariş takip ve teslimat görünürlüğü mantığı

### OL-050 — Takip ekranı dürüst ama sade görünürlük katmanıdır

**Binding Rule:** İç operasyon statüleri kullanıcıya birebir yansıtılmaz; fakat yanlış basitleştirme de yapılmaz.

### OL-051 — Delivery doğrulaması olmadan delivered görünümü verilmez

**Binding Rule:** Teslim edildi state’i ancak teslimat doğrulama mantığı resmileşince görünür olmalıdır; çünkü entitlement açılışlarını tetikler.

### OL-052 — Takip ekranı desteğin yerine geçmez

**Binding Rule:** Kullanıcı önce net durum görür, problem varsa bağlamsal destek başlığına gider.

### OL-053 — Teslimat sonrası hak görünürlüğü first-class’tır

**Binding Rule:** Review/story hakkı açılışı takip ve bildirim sisteminde görünür olmalıdır; bu eşikler teslimat sonrası çalışır.

### OL-054 — Tracking projection’dır, final truth değildir

**Binding Rule:** Takip ekranında görünen sade statü, order/shipment owner truth’unun kullanıcı dostu sunumudur; support veya kullanıcı bu projection’ı final kanıt gibi değiştiremez.

---

## 10. Shipment anomaly mantığı

### OL-060 — Teslimat problemi support metniyle kapatılamaz

**Binding Rule:** Gecikme, kayıp, hasar, delivered-not-received ve tracking çelişkisi delivery anomaly olarak operasyonel inceleme ister.

### OL-061 — Delivery ops fiziksel truth’a en yakın owner’dır

**Binding Rule:** Shipment / carrier / delivered / failed / returned karar çizgisi delivery ops’ta yürür; support yalnız iletişim yüzüdür.

### OL-062 — Shipment anomaly support ve finance etkisi üretebilir

**Binding Rule:** Teslimat problemi refund, return eligibility, support ticket ve entitlement recompute etkisi doğurabilir; ama bu etkiler ilgili owner’larda çözülür.

### OL-063 — Investigation state ile final outcome karıştırılmaz

**Binding Rule:** İnceleme başladı bilgisi delivered/failed/refunded sonucu gibi sunulamaz.

---

## 11. İade / iptal / refund koordinasyon mantığı

### OL-070 — İptal, iade ve refund aynı sistem değildir

**Binding Rule:** İptal/iadeye ilişkin kullanıcı akışı, operasyonel uygunluk ve finansal refund farklı owner alanlarında yürür; tek kaba çözüm zinciri kurulmaz.

### OL-071 — Support iade isteğini açabilir, nihai kararı vermez

**Binding Rule:** İade ticket’ı veya destek başlığı support girişi olabilir; ama eligibility, line-level durum ve refund etkisi ilgili owner’larda çözülür.

### OL-072 — Line-level mantık korunur

**Binding Rule:** Kısmi iade/kısmi refund/order-total yerine line-level bağlamla yönetilir.

### OL-073 — Return sonrası entitlement ve reward etkileri recompute edilir

**Binding Rule:** Review/story/reward/trust alanları iade sonrası yeniden değerlendirilir; sessiz yok etme veya sessiz koruma yapılmaz.

### OL-074 — Refund completion, return request’ten farklıdır

**Binding Rule:** Kullanıcı iade talebi açmış olabilir; bu, finansal refund’ın tamamlandığı anlamına gelmez. Kullanıcı görünürlüğü bu ayrımı dürüst taşımalıdır.

---

## 12. Ödeme / finance operasyon mantığı

### OL-080 — Payment belirsizliği finance owner alanıdır

**Binding Rule:** Ödeme alındı ama sipariş oluşmadı, çift çekim, yanlış tutar, refund belirsizliği gibi durumlar finance reconciliation ister.

### OL-081 — Support finansal outcome üretemez

**Binding Rule:** Support kullanıcıyı bilgilendirir; confirmed/failed/refund_completed/correction kararı finance owner’da çıkar.

### OL-082 — Unknown-result başarı sayılmaz

**Binding Rule:** Payment/refund/payout belirsizliği resolved diline zorlanmaz; reconciliation hattı gerekir.

### OL-083 — Promosyon finans problemi commerce etiketiyle kapanmaz

**Binding Rule:** Sponsor attribution ve coupon/campaign correction konusu finance bağlamında çözülür; support veya yüzey badge diliyle kapatılamaz.

### OL-084 — Finance projection ile official outcome ayrıdır

**Binding Rule:** Kullanıcıya “inceleniyor” veya “işleme alındı” denmesi final finance outcome üretmez; projection ile official owner outcome ayrılır.

---

## 13. Payout kontrollü çözüm mantığı

### OL-090 — Payout ayrı owner alanıdır

**Binding Rule:** Settlement, payable ve paid_out aşamaları aynı ekip ve aynı anlama indirgenmez; payout ops bu zinciri ayrı owner mantığıyla taşır.

### OL-091 — Hold/release kurallı review ister

**Binding Rule:** Payout hold veya release support notuyla veya tek operatör kararıyla kapatılamaz; finance/risk bağlamı gerekir.

### OL-092 — Creator/supplier alıcıdır, payout owner değildir

**Binding Rule:** Fenomen ve tedarikçi payout sonucundan etkilenir; ama payout truth’unu yönetmez.

### OL-093 — Payable görünürlüğü paid_out sonucu değildir

**Binding Rule:** Panel veya kullanıcıya sunulan “ödenebilir” görünüm, dış ödeme çıkışının tamamlandığı anlamına gelmez.

---

## 14. Moderation ve risk koordinasyon mantığı

### OL-100 — Moderation ve risk ayrı problem aileleridir

**Binding Rule:** İçerik güvenliği ile abuse/anomaly aynı owner alanı değildir; coordinated review gerekebilir ama final karar aynı yerde toplanmaz.

### OL-101 — Destekten gelen içerik şikayeti moderation’a döner

**Binding Rule:** Ticket support’ta açılabilir; fakat approve/reject/restrict/take_down sonucu moderation owner’da çıkar.

### OL-102 — Risk sinyali çoklu domain etkisi üretebilir

**Binding Rule:** Coupon abuse, refund abuse, account takeover, payout risk, creator/supplier lifecycle ve UGC suppression aynı risk case’ten etkilenebilir; ama her aksiyon ilgili owner domain’de resmileşir.

### OL-103 — High-risk moderation coordinated review ister

**Binding Rule:** Moderation item bazı durumlarda creator admin veya risk ops görüşü gerektirir; tek moderatör kararı yeterli olmayabilir.

### OL-104 — Advisory review ile domain action karıştırılmaz

**Binding Rule:** Risk görüşü veya moderation advisory note doğrudan suspension, payout release denial veya finance correction yerine geçmez.

---

## 15. Creator lifecycle operasyon mantığı

### OL-110 — Creator yönetimi başvurudan aktif yaşam döngüsüne kadar kurallıdır

**Binding Rule:** Creator başvuru, kategori yetkisi, mağaza davranış sınırı, warning/restriction/suspension kararları creator admin owner alanında yürür.

### OL-111 — Creator mağaza vitrindir; yönetim sistemi denetim katmanıdır

**Binding Rule:** Fenomen mağaza deneyimi ile creator yönetim sistemi karıştırılamaz.

### OL-112 — Creator restriction kademeli çalışır

**Binding Rule:** Warning, feature restriction, category restriction, visibility impact ve suspension kademeli seçeneklerdir; her sorun suspend ile çözülmez.

### OL-113 — Creator kararı support veya sosyal sinyalle tek başına verilmez

**Binding Rule:** Şikayet/support yükü sinyal üretebilir; nihai lifecycle kararı creator admin review + gerekiyorsa moderation/risk görüşüyle çıkar.

### OL-114 — Approved creator ile active creator ayrımı korunur

**Binding Rule:** Başvuru onayı operationally active creator scope’un açıldığı anlamına gelmez; activation ayrı completion adımıdır.

---

## 16. Supplier lifecycle operasyon mantığı

### OL-120 — Supplier yönetimi operasyon kalite odaklıdır

**Binding Rule:** Başvuru, kategori yükleme yetkisi, stok güvenilirliği, sevkiyat disiplini, kalite sorunları ve restriction/suspension supplier admin owner alanındadır.

### OL-121 — Supplier panel çalışma alanıdır, yönetim sistemi denetim alanıdır

**Binding Rule:** Panelde ürün/stok/sevkiyat girişi yapılır; ama yetki, ceza ve lifecycle kararı supplier yönetim sisteminde alınır.

### OL-122 — Operasyon sinyalleri supplier lifecycle’a beslenir

**Binding Rule:** Geç sevkiyat, stok sapması, kalite iadesi ve problemli fulfillment supplier quality review üretir.

### OL-123 — Supplier approval ile unrestricted operation ayrıdır

**Binding Rule:** Supplier onayı verilmiş olsa bile kategori/yükleme/operasyon yetkileri ayrı completion zinciriyle açılır.

---

## 17. Admin sistemi üst koordinasyon mantığı

### OL-130 — Admin sistemi kontrol kulesidir, sınırsız write alanı değildir

**Binding Rule:** Admin görür, denetler, onaylar, protected action başlatır; owner domain’e direct write yapmaz.

### OL-131 — Başvuru ve yaşam döngüsü ekranları ayrıdır

**Binding Rule:** Başvuru merkezi ile creator/supplier aktif yönetim ekranı ayrı işletim amacına hizmet eder.

### OL-132 — Admin modülleri operasyon mantığını dağıtmaz, toplar

**Binding Rule:** Support, order ops, moderation, finance, risk, creator, supplier ve commerce taraflarının görünürlüğü admin altında birleşir; ownership birleşmez.

### OL-133 — Audit’siz manuel müdahale yoktur

**Binding Rule:** Override, suspend, release, rule change ve kritik approval’lar audit olmadan resmi sayılmaz.

### OL-134 — Admin görünürlüğü projection’dır, domain truth değildir

**Binding Rule:** Kontrol kulesi ve panel özetleri karar desteği verir; truth mutation yalnız owner modüllerde resmileşir.

---

## 18. Bildirim ve kullanıcıya durum yansıtma mantığı

### OL-140 — Bildirim, doğru owner sonucu sonrası çalışır

**Binding Rule:** Kritik işlem, teslimat, destek ve güvenlik bildirimleri owner outcome ile senkronize olmalıdır; spekülatif bildirim üretilmez.

### OL-141 — İşlem bildirimleri sosyal bildirimlerden üstündür

**Binding Rule:** Ödeme, sipariş, teslimat, iade, destek ve güvenlik bildirimleri en yüksek öncelikli katmandadır.

### OL-142 — Support güncellemesi ile resmi domain sonucu karıştırılmaz

**Binding Rule:** Kullanıcıya "inceleniyor" denmesi refund completed veya delivered confirmed anlamına gelmez.

### OL-143 — Teslimat sonrası entitlement bildirimleri anlamlıdır

**Binding Rule:** Review/story hakkı açılışı doğru anda bildirilir; spam veya erken bildirim yapılmaz.

### OL-144 — Notification projection’dır, official outcome değildir

**Binding Rule:** Bildirim merkezi veya push dili final state yerine geçmez; yalnız resmi owner outcome’u yansıtır.

---

## 19. Escalation, SLA ve approval entegrasyon mantığı

### OL-150 — Escalation, problem owner’a ulaşma yoludur

**Binding Rule:** Escalation bir çözüm değil, doğru ownership ve governance yolunu açan resmi işletim adımıdır.

### OL-151 — SLA, owner sorumluluğunun hız modelidir

**Binding Rule:** First response, owner acceptance ve resolution ayrı izlenir; çözüm üretmeyen bekleme gerçek başarı sayılmaz.

### OL-152 — Approval, owner action’dan önce gelen governance katmanıdır

**Binding Rule:** Review/approval çıktıktan sonra owner protected action/command aşaması tamamlanmadan sonuç resmileşmez.

### OL-153 — High-governance alanlar zincir halinde çalışır

**Binding Rule:** escalation -> review -> approval -> protected action -> audit -> user/system visibility zinciri bozulmaz.

### OL-154 — Support nihai sonucu değil, nihai sonucun iletişimini taşıyabilir

**Binding Rule:** Çözüm zincirinin son halkası her zaman support değildir; ama nihai owner outcome kullanıcının göreceği dilde support/notification/tracking katmanına yansıyabilir.

---

## 20. Operasyonda yasak davranışlar

Aşağıdaki davranışlar bu rehbere göre yasaktır:

* support ajanının finance outcome üretmesi
* moderation dışı ekibin içerik final kararı vermesi
* risk sinyaliyle audit’siz kalıcı yaptırım uygulanması
* supplier/creator panel davranışının owner truth gibi kabul edilmesi
* social chat üzerinden resmi refund / return / restriction çözümü yürütülmesi
* admin panelden direct write ile truth değiştirilmesi
* unknown-result’ı sessiz success/failure saymak
* line-level problemi order-total kaba notla kapatmak
* projection state’i official outcome gibi sunmak

---

## 21. Faz-1 minimum zorunlu işletim zinciri

İlk fazda aşağıdaki operasyon zincirleri eksiksiz çalışmalıdır:

1. support -> triage -> correct domain handoff
2. order ops -> shipment/delivery -> tracking visibility
3. delivery anomaly -> support context update -> official outcome
4. return/refund -> finance correction -> user-visible resolution
5. moderation complaint -> moderation decision -> creator/risk signal if needed
6. risk case -> domain hold/restrict/release coordination
7. creator/supplier review -> approval -> lifecycle action
8. payout hold/release -> finance/risk controlled outcome
9. admin review -> protected action -> audit trail
10. notification -> honest user/system visibility

---

## 22. Faz-1 dışında bırakılan alanlar

* vardiya ve organizasyon seviyesinde personel rotasyonu
* çağrı merkezi scriptleri
* saha operasyon prosedürleri
* exhaustive legal/compliance process maps

---

## 23. Kısa sonuç

Bu rehber ile aşağıdaki çekirdek operasyon kararları sert biçimde sabitlenmiş olur:

* Support giriş kapısıdır, nihai owner değildir
* Sipariş operasyonu iç iş motorudur; sipariş takip kullanıcı görünürlüğüdür
* Delivery anomaly, finance belirsizliği, moderation high-risk ve payout hold first-class operasyon aileleridir
* Creator ve supplier lifecycle kararları ayrı yönetim owner’larında yürür
* Admin sistemi üst koordinasyon merkezidir ama direct write yapmaz
* Bildirim ve kullanıcı görünürlüğü resmi owner outcome ile senkronize çalışır
* Escalation, SLA ve approval tek işletim zincirinde birleşir
* Projection ile truth ayrımı operasyonun her katmanında korunur

Bu dosya, Aşama 12’nin bağlayıcı ve yoruma kapalı operasyon mantığı rehberidir.
