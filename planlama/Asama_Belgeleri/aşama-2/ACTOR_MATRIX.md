# ACTOR_MATRIX

Bu matris, platform içindeki temel aktörleri ve her aktörün sistem içindeki rolünü tanımlar.

Net amaç:
- aktörleri birbirine karıştırmamak
- “kim kullanıcı, kim yönetici, kim veri kaynağı, kim owner değil ama işlem başlatabilir” ayrımını sabitlemek
- panel, storefront, internal service ve admin alanlarını netleştirmek

---

## 1. MISAFIR KULLANICI

### Tanım
Sisteme giriş yapmamış ziyaretçidir.

### Yapabilir
- ana sayfa, keşfet, kategori/PLP, PDP ve fenomen mağazası gibi açık yüzeyleri görebilir
- story, video ve UGC içeriklerini izleyebilir
- ürün inceleyebilir
- varyant seçebilir
- sepete ürün ekleyebilir
- sepeti görüntüleyebilir
- kontrollü guest checkout kullanabilir

### Yapamaz
- beğeni / kaydetme / takip
- mesaj gönderme
- soru sorma
- yorum yazma
- story / içerik yükleme
- puan kazanma
- hesap bağlı görünürlükleri kullanma

### Not
Misafir kullanıcı keşif aktörüdür; sosyal ve sahiplik bağlı write aktörü değildir. Guest checkout bu genel kuralı bozmaz. 

---

## 2. KAYITLI KULLANICI

### Tanım
Sisteme giriş yapmış standart müşteri hesabıdır.

### Yapabilir
- beğeni / kaydetme / paylaşma
- takip etme
- mesaj gönderme
- ürün bazlı soru sorma
- teslim edilmiş ürüne yorum yapma
- teslim edilmiş ürüne bağlı kullanıcı story yükleme
- siparişlerini görme
- destek süreçlerini yürütme
- puan durumunu izleme
- puan market kullanma
- iade/iptal hakkı varsa ilgili akışı başlatma

### Yapamaz
- admin / panel aksiyonları
- fenomen lifecycle kararı
- tedarikçi kararı
- financial truth mutate etme
- ürün onayı / fiyat owner kararı verme

### Not
Kayıtlı kullanıcı ana müşteri aktörüdür; ama bu tek başına her domain hakkının açıldığı anlamına gelmez. Birçok aksiyon eligibility gerektirir. 

---

## 3. VERIFIED / ELIGIBILITY SAHIBI KULLANICI

### Tanım
Giriş yapmış kullanıcı içinden, belirli domain aksiyonlarını açmaya uygun şartları sağlayan kullanıcıdır.

### Örnek eligibility’ler
- review eligible
- story eligible
- return eligible
- payout-related customer visibility uygunluğu
- belirli destek akışlarına giriş hakkı

### Not
Bu ayrı bir hesap tipi değil, kullanıcı üstünde açılan domain condition katmanıdır.

### Kritik kural
Auth sahibi olmak ile eligibility sahibi olmak aynı şey değildir. :contentReference[oaicite:3]{index=3}

---

## 4. FENOMEN ADAYI

### Tanım
Henüz onay almamış, fenomen olmak için başvuru yapmış kişidir.

### Yapabilir
- başvuru oluşturmak
- gerekli bilgi ve belgeleri sunmak
- revizyon istenirse güncelleme yapmak
- başvuru durumunu takip etmek

### Yapamaz
- aktif fenomen mağaza işletmek
- kategori yetkisi kullanmak
- fenomen panelindeki aktif mağaza aksiyonlarını kullanmak

### Not
Fenomen adayı ile aktif fenomen aynı aktör değildir. 

---

## 5. ONAYLI FENOMEN

### Tanım
Platform tarafından onaylanmış, belirli kategori sınırlarında mağaza işletme hakkı almış aktördür.

### Yapabilir
- mağazasını yönetmek
- havuzdan ürün seçmek
- mağaza içi ürün düzeni yapmak
- mağaza açıklaması / story / post / vitrin medya yönetmek
- müşteri mesajlarını görmek
- sade satış ve performans görünürlüğü almak
- izinli kupon / kampanya katmanlarında işlem yapmak

### Yapamaz
- bağımsız satıcı gibi davranmak
- stok truth üretmek
- sipariş lifecycle truth’unu yönetmek
- ödeme / finans truth’unu yönetmek
- resmi ürün soru-cevap owner’ı olmak
- kategori yetkisini kendi belirlemek

### Not
Fenomen bağımsız seller değil; kontrollü mağaza işleten aktördür. 

---

## 6. FENOMEN PANEL KULLANICISI

### Tanım
Onaylı fenomenin kendi mağazasını yönettiği panel aktörüdür.

### Rol
- self-service mağaza yönetimi
- mağaza içi içerik ve düzen
- sade mağaza performans görünürlüğü
- platform uyarılarını görme

### Kritik sınır
Panel kullanıcısı olmak, truth owner olmak değildir.

### Asla yapamaz
- panelden direct write ile kritik truth değiştirmek
- order / payout / platform kârı / category permission mutate etmek

---

## 7. TEDARIKÇI ADAYI

### Tanım
Henüz onay almamış, tedarikçi olmak için başvuru yapan taraftır.

### Yapabilir
- başvuru ve belge sunmak
- revizyon taleplerini tamamlamak
- başvuru durumunu takip etmek

### Yapamaz
- ürün yükleme
- aktif fulfillment işlemi
- tedarikçi panelini tam kullanma

### Not
Aday statüsü ile aktif supplier statüsü ayrıdır. 

---

## 8. ONAYLI TEDARIKÇI

### Tanım
Platform tarafından kabul edilmiş, belirli kategori ve operasyon sınırlarında ürün sağlayabilen aktördür.

### Yapabilir
- ürün yükleme
- varyant tanımlama
- stok güncelleme
- baz fiyat girme
- lojistik veri girme
- ürün kabul sürecini takip etme
- kendine düşen sipariş hazırlama / sevkiyat aksiyonlarını yürütme
- teknik soru-cevap için taslak bilgi katkısı verme

### Yapamaz
- ürün onayı verme
- satış fiyatını belirleme
- kampanya açma
- platform kârını görme
- financial truth mutate etme
- resmi yayın owner’ı olma

### Not
Tedarikçi ürün ve fulfillment girdisi sağlar; ticari owner değildir. 

---

## 9. TEDARIKÇI PANEL KULLANICISI

### Tanım
Onaylı tedarikçinin panel üzerinden çalışan operasyon aktörüdür.

### Rol
- ürün girişi
- ürün kabul takibi
- stok / baz fiyat / lojistik bilgisi
- sevkiyat girdileri
- teknik taslak bilgi katkısı
- sade performans görünürlüğü

### Kritik sınır
Tedarikçi panel kullanıcısı truth owner değildir.

---

## 10. ADMIN

### Tanım
Platformun üst denetim ve kurallı müdahale aktörüdür.

### Yapabilir
- başvuru inceleme / onay / red
- kategori yetkisi verme
- kısıt / askı / kapatma başlatma
- moderasyon ve risk escalations yönetme
- fiyat / kampanya / kupon kural setlerini yönetme
- finansal görünürlük alma
- payout ve mutabakat tarafında kurallı kararlar verme
- audit ile kayıtlı yönetim aksiyonu üretme

### Yapamaz
- audit’siz bypass
- owner modülü atlayarak keyfi direct write
- sınırsız kontrolsüz müdahale

### Not
Admin güçlüdür ama sınırsız değildir. :contentReference[oaicite:8]{index=8}

---

## 11. MODERATOR

### Tanım
İçerik ve görünürlük güvenliğini yöneten özel yönetim aktörüdür.

### Yapabilir
- yorum / story / post / soru-cevap moderation queue’larını işlemek
- görünürlük kararları vermek
- takedown / restriction başlatmak
- escalation oluşturmak

### Yapamaz
- finansal karar vermek
- sipariş / payout truth mutate etmek
- creator/supplier lifecycle kararı tek başına kesinleştirmek

### Not
Moderator, admin rolünün alt kırılımı olabilir; ama içerik owner alanına yakın özel aktördür.

---

## 12. OPERATIONS ADMIN / OPERASYON AKTORU

### Tanım
Sipariş operasyonu, fulfillment, gecikme, sevkiyat anomali ve teslimat istisnalarını yöneten yönetim aktörüdür.

### Yapabilir
- sipariş operasyon ekranlarını kullanmak
- problemli shipment / hazırlama akışlarını yönetmek
- escalation açmak
- destek ve teslimat problemlerini çözüm kuyruklarına bağlamak

### Yapamaz
- financial truth mutate etmek
- moderation owner kararı vermek
- pricing owner kararı vermek

### Not
Order ops alanı, order truth’unun kendisi değildir; operasyon akışıdır. :contentReference[oaicite:9]{index=9}

---

## 13. FINANCE ADMIN / FINANS AKTORU

### Tanım
Mutabakat, hakediş, blokaj, payout, refund finans etkisi ve inceleme kararlarını yöneten aktördür.

### Yapabilir
- settlement görünürlüğü
- blocked/payable/settled durumlarını inceleme
- payout hold / release kararı
- finansal problem ve anomali inceleme
- kupon sponsor etkisi ve iade düzeltmesi tarafını denetleme

### Yapamaz
- creator/supplier içerik veya mağaza görünürlüğü owner kararı verme
- sipariş operasyonunu yönetmek
- moderation kararını yürütmek

### Not
Finance actor finans truth owner sistemine komut veren yönetsel aktördür; panelden direct write yapmaz. 

---

## 14. SUPPORT AGENT / SUPPORT ADMIN

### Tanım
Destek ticket akışını, sınıflandırmayı ve ilk çözüm/el koyma seviyesini yöneten aktördür.

### Yapabilir
- ticket routing
- SLA takibi
- escalation açma
- kullanıcıya süreç görünürlüğü verme
- ilgili domain ekibine aktarım

### Yapamaz
- finance, moderation, fraud veya lifecycle owner kararlarını kendi başına finalize etmek

### Not
Destek sistemi kullanıcı yüzüdür; ticket operasyon sistemi iç çözüm motorudur. :contentReference[oaicite:11]{index=11}

---

## 15. INTERNAL SERVICE / SYSTEM ACTOR

### Tanım
İnsan olmayan, sistem içi servis veya worker aktörüdür.

### Rol
- event tüketme
- projection güncelleme
- async işlem yürütme
- notification işleme
- search document güncelleme
- analytics ingest

### Yapamaz
- owner olmayan truth’u rastgele mutate etmek
- panel/user action yerine geçmek
- auth/permission bypass etmek

### Not
Internal actor da owner matrisi kurallarına tabidir.

---

## 16. BFF ACTOR

### Tanım
Client-facing aggregation katmanıdır.

### Rol
- read aggregation
- degraded / blocked / auth-aware projection
- client-friendly DTO üretimi

### Yapamaz
- truth mutate etmek
- final business owner kararı vermek
- direct write gerçekleştirmek

### Not
BFF aktördür ama owner değildir. 

---

## 17. PANEL ACTION CALLER

### Tanım
Panel arayüzünden aksiyon başlatan kullanıcı/sistem rolüdür.

### Rol
- protected action başlatmak
- owner modüle komut göndermek
- review / approve / reject / restrict / release gibi kontrollü aksiyonları tetiklemek

### Kritik sınır
Panel action caller olmak, panelin kendisini owner yapmaz.
Aksiyon ancak ilgili owner sistem ve guard’lar izin verirse uygulanır.

---

## 18. OZEL AKTOR ILISKILERI

### Misafir → kayıtlı kullanıcı
- auth açılır
- sosyal haklar açılabilir
- guest checkout geçmişi hesapla ilişkilendirilebilir

### Kayıtlı kullanıcı → verified/eligible kullanıcı
- ayrı hesap değildir
- domain şartı sağlandığında belirli haklar açılır

### Kullanıcı hesabı ↔ fenomen hesabı
- aynı domain hesap değildir
- role merge değildir
- aynı kimlik altında profile switch desteklenebilir

### Tedarikçi ↔ tedarikçi paneli
- panel, supplier’ın çalışma aracıdır
- owner değildir

### Fenomen ↔ fenomen paneli
- panel, creator’ın self-service alanıdır
- owner değildir

### Admin ↔ owner sistemler
- admin karar başlatır / onaylar / sınırlar
- owner sistemler truth’u mutate eder

---

## 19. KISA OZET

- Misafir: keşif ve kontrollü guest checkout
- Kayıtlı kullanıcı: müşteri aksiyonları
- Eligible kullanıcı: domain bazlı açılmış hak sahibi kullanıcı
- Fenomen: kontrollü mağaza aktörü
- Tedarikçi: ürün ve fulfillment girdisi sağlayan aktör
- Admin: üst denetim ve kurallı müdahale
- Moderator: içerik görünürlüğü/güvenlik aktörü
- Operations: fulfillment ve teslimat istisna aktörü
- Finance: mutabakat/payout/hold aktörü
- Support: ticket ve çözüm yönlendirme aktörü
- Internal service: async/projection/system worker
- BFF: read-only aggregation aktörü
- Panel action caller: protected action tetikleyici