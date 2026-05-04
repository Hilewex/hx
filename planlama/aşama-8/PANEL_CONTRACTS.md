# PANEL_CONTRACTS

## 1. Amaç

Bu dosya, platformun panel ve iç operasyon yüzeylerinin kodlama öncesi ekran sözleşmelerini sabitler.

Bu dosyanın amacı:

* panel yüzeylerinin tek amacını netleştirmek,
* hangi panelin hangi domain truth’u yalnız okuduğunu, hangi aksiyonları protected action / command olarak tetiklediğini ayırmak,
* panelin owner truth gibi davranmasını engellemek,
* permission / scope / guard / audit zorunluluğunu ekran sözleşmesi seviyesinde görünür kılmak,
* loading / empty / blocked / degraded / conflict davranışlarını panel bazında tanımlamak,
* self-service panel ile üst denetim panelini birbirine karıştırmamaktır.

Net kural:

* Panel direct write yapmaz.
* Owner dışı write yoktur.
* Panel owner modüle protected action / command gönderir.
* Audit’siz kritik aksiyon yoktur.

---

## 2. Kapsam

Bu dosya şu yüzeyleri kapsar:

### Üst yönetim ve denetim

* Admin Panel

### Self-service çalışma alanları

* Fenomen Mağaza Yönetim Paneli
* Tedarikçi Paneli

### İç operasyon alanları

* Sipariş Operasyon Paneli
* Destek Ticket Operasyon Paneli

Not:
Bu dosya storefront / app ekranlarını kapsamaz. Onlar `SCREEN_CONTRACTS.md` içindedir.

---

## 3. Ortak panel sözleşmesi şablonu

Her panel için aşağıdaki başlıklar tanımlanmalıdır:

1. Panelin tek amacı
2. Ana aktörler ve scope
3. Okuduğu truth / projection alanları
4. Tetiklediği aksiyonlar
5. Ana modüller / bileşenler
6. State görünürlüğü
7. Guard / permission / audit kuralları
8. Block / empty / degraded / conflict davranışları
9. Mobil / web farkları
10. Yasak davranışlar

---

## 4. Ortak panel davranış kuralları

### 4.1 Permission ve scope kuralı

* Panel auth yeterli değildir.
* Doğru scope gerekir.
* Gerekli permission gerekir.
* Gerekirse ownership / domain eligibility / state guard da ayrıca çalışır.

### 4.2 Command ve projection ayrımı

* Panel listeleri, sayaçları, dashboard özetleri projection olabilir.
* Protected action’lar owner modüle command gider.
* “Ekranda görüyorum” ile “mutate edebiliyorum” aynı şey değildir.

### 4.3 Audit zorunluluğu

Aşağıdaki tür aksiyonlarda audit zorunludur:

* onay / red
* askıya alma / restrict
* payout hold / release
* moderation kararı
* kritik kural değişimi
* escalation yönlendirmesi

### 4.4 Invalid transition görünürlüğü

* Panel, geçersiz state geçişini sessizce yutmaz.
* Kullanıcıya açık ve kanonik hata dili gösterilir.
* “Neden yapılamıyor?” görünür olmalıdır.

### 4.5 Dürüst degradation kuralı

* Dashboard veya liste blokları partial / delayed olabilir.
* Ama kritik action guard’larında sahte başarı gösterilmez.

---

## 5. ADMIN PANEL SÖZLEŞMESİ

### 5.1 Tek amacı

Platformun kritik ticari, operasyonel, güvenlik, moderasyon ve yönetim kararlarını tek merkezden görmek, denetlemek ve kurallı aksiyonlarla yönetmek.

### 5.2 Ana aktörler ve scope

* Super Admin
* Commerce Admin
* Fenomen Admin
* Supplier Admin
* Operations Admin
* Moderation Admin
* Support Admin
* Finance Admin
* Analytics / Growth Admin

### 5.3 Okuduğu ana alanlar

* Fenomen lifecycle özetleri
* Tedarikçi lifecycle özetleri
* Ürün kabul ve ticari kontrol projection’ları
* Sipariş / operasyon / teslimat özetleri
* Moderasyon ve destek özetleri
* Finansal anomali ve problem özetleri
* Kural / yetki görünürlükleri

### 5.4 Tetiklediği aksiyonlar

* Başvuru onayla / reddet
* Restrict / suspend / reactivate başlat
* Moderation kararı başlat
* Payout hold / release başlat
* Escalation yönlendir
* Konfigürasyon değişimi başlat (izinli sınırlarda)

### 5.5 Ana modüller

* Kontrol kulesi / ana dashboard
* Fenomen yönetimi
* Tedarikçi yönetimi
* Ürün kabul / ticari kontrol
* Sipariş ve operasyon görünürlüğü
* Moderasyon merkezi
* Destek merkezi görünürlüğü
* Finans / anomali / payout görünürlüğü
* Kural / yetki / config görünürlüğü

### 5.6 State görünürlüğü

* Queue loading
* Empty queue
* Pending review
* Restricted / suspended state
* Partial data degraded
* Conflict / invalid transition

### 5.7 Guard / permission / audit kuralları

* Alt rol bazlı görünürlük zorunludur.
* View permission ile action permission ayrı düşünülür.
* Kritik aksiyonlarda reason code ve audit kaydı gerekir.
* Panel direct write yapmaz; protected action / command gönderir.

### 5.8 Block / empty / degraded / conflict davranışları

* Dashboard blokları partial gelebilir.
* Queue boşsa dekoratif boşluk değil, operasyonel empty-state gösterilir.
* Invalid transition panelde açık hata olarak görünür.

### 5.9 Mobil / web farkları

* Admin panelin ana çalışma biçimi web-first olmalıdır.
* Mobilde yalnız hafif izleme / kritik onay alanları düşünülebilir; tam operasyon masaüstü önceliklidir.

### 5.10 Yasak davranışlar

* Admin sınırsız ve audit’siz güç gibi davranmaz.
* Owner truth’u doğrudan mutate etmez.
* Ranking, financial truth, order truth gibi alanları panel state alanı gibi sahiplenmez.

---

## 6. FENOMEN MAĞAZA YÖNETİM PANELİ SÖZLEŞMESİ

### 6.1 Tek amacı

Onaylı fenomenin kendi mağazasını platform kuralları içinde self-service biçimde yönetmesini sağlamak.

### 6.2 Ana aktörler ve scope

* Onaylı fenomen
* Creator scope’a geçmiş kullanıcı

### 6.3 Okuduğu ana alanlar

* Kendi mağaza profili ve mağaza durumu
* Havuzdan seçilebilir ürünler
* Kendi mağaza ürün sırası ve mağaza içi vitrin bağlamı
* Kendi story / post / medya alanları
* Mesaj ve takipçi görünürlüğü
* Kendi satış ve performans özetleri
* Platform uyarıları ve mağaza durum sinyalleri

### 6.4 Tetiklediği aksiyonlar

* Havuzdan ürün seç
* Mağazaya ürün ekle / çıkar
* Mağaza içi ürün sırası düzenle
* Story / post oluştur
* Ürün için mağaza bağlamlı medya veya not ekle
* Mesajlara cevap ver
* İzinli kupon aksiyonu başlat

### 6.5 Ana modüller

* Ana kokpit
* Ürün seçki yönetimi
* İçerik yönetimi
* Story / post yönetimi
* Mesaj ve takipçi görünürlüğü
* Performans özeti
* Mağaza durum / uyarı alanı

### 6.6 State görünürlüğü

* Active
* Restricted
* Suspended
* Content pending / rejected
* Action blocked by policy
* Partial analytics degraded

### 6.7 Guard / permission / audit kuralları

* Yalnız kendi mağazası bağlamında çalışır.
* Creator scope gerekir.
* İzin verilmeyen kupon / içerik / medya aksiyonları bloklanır.
* Kritik kısıt veya ihlal durumları görünür uyarı olarak gösterilir.

### 6.8 Block / empty / degraded / conflict davranışları

* Havuzdan seçilebilir ürün yoksa doğru empty-state gösterilir.
* Mağaza restricted ise neden görünür olur.
* Analytics veya sayaçlar degrade olabilir; fakat mağaza statüsü sahte gösterilmez.

### 6.9 Mobil / web farkları

* Mobil öncelikli olmalıdır.
* Tek elle kullanılabilir, az adımlı, görev odaklı akış gerekir.
* Web sürümü daha geniş ama aynı mantığın tam sürümüdür.

### 6.10 Yasak davranışlar

* Stok truth’unu değiştirmek
* Satış fiyatı motorunu sahiplenmek
* Sipariş lifecycle’ını yönetmek
* Resmi ürün soru-cevap owner’ı gibi davranmak
* Havuz dışından ürün sokmak

---

## 7. TEDARİKÇİ PANELİ SÖZLEŞMESİ

### 7.1 Tek amacı

Onaylı tedarikçinin ürün ve fulfillment girdisini kontrollü self-service biçimde sağlamasını mümkün kılmak.

### 7.2 Ana aktörler ve scope

* Onaylı tedarikçi
* Supplier scope’a geçmiş kullanıcı

### 7.3 Okuduğu ana alanlar

* Kendi ürünleri
* Ürün kabul durumu ve revizyon istekleri
* Varyant, stok ve baz fiyat çalışma alanları
* Lojistik bilgileri
* Kendi sipariş hazırlık / sevkiyat iş listesi
* Kalite / performans görünürlüğü

### 7.4 Tetiklediği aksiyonlar

* Ürün verisi gir / güncelle
* Varyant kur
* Stok güncelle
* Baz fiyat güncelle
* Lojistik bilgisi gir
* Sipariş hazırlama başlat
* Sevkiyat bilgisi gir
* Revizyon yanıtla

### 7.5 Ana modüller

* Ana operasyon kokpiti
* Ürün veri girişi
* Ürün kabul durumu
* Stok / baz fiyat yönetimi
* Sipariş hazırlama ve sevkiyat alanı
* Kalite / performans görünürlüğü

### 7.6 State görünürlüğü

* Product under review
* Revision requested
* Rejected
* Active / visible input state
* Stock warning
* Fulfillment waiting
* Fulfillment delayed

### 7.7 Guard / permission / audit kuralları

* Yalnız kendi tedarikçi bağlamında çalışır.
* Tedarikçi ürün onay owner’ı değildir.
* Satış fiyatı ve kampanya owner’ı değildir.
* Kritik baz fiyat / lojistik / fulfillment değişimleri izlenebilir olmalıdır.

### 7.8 Block / empty / degraded / conflict davranışları

* Revizyon bekleyen alanlar görünür listelenir.
* Reddedilen ürünlerde sebep görünür olur.
* Kendi verisini görebilir ama platform iç marjını veya merkezi finans truth’unu göremez.

### 7.9 Mobil / web farkları

* Masaüstünde tablo + form dengesi güçlü olmalıdır.
* Mobilde stok, sipariş hazırlama ve kritik uyarı akışları sadeleştirilmiş olmalıdır.

### 7.10 Yasak davranışlar

* Ürün onayını kendi kendine vermek
* Satış fiyatını belirlemek
* Kampanya rejimini açmak
* Platform kâr yapısını görmek
* Order truth owner gibi davranmak

---

## 8. SİPARİŞ OPERASYON PANELİ SÖZLEŞMESİ

### 8.1 Tek amacı

Resmi sipariş kaydını iç operasyon iş akışına çeviren fulfillment ve istisna yönetim yüzeyi olmak.

### 8.2 Ana aktörler ve scope

* Operations Admin
* İlgili operasyon rolleri

### 8.3 Okuduğu ana alanlar

* Sipariş operasyon queue’ları
* Hazırlama / paketleme iş listeleri
* Tedarikçi bazlı iş dağılımı
* Gecikme ve problem sinyalleri
* İptal / iade / destek ilişkili operasyon referansları
* Shipment readiness görünürlüğü

### 8.4 Tetiklediği aksiyonlar

* Operasyona al
* Hazırlama / paketleme aksiyonu başlat
* Tıkanıklık / problem eskale et
* İlgili domain ekibine yönlendir
* Gerekirse shipment readiness command’i başlat

### 8.5 Ana modüller

* Operasyon iş listesi
* Hazırlama / paketleme görünürlüğü
* Gecikme / problem kuyruğu
* Tedarikçi bazlı dağılım görünürlüğü
* Escalation paneli

### 8.6 State görünürlüğü

* New operational work
* In preparation
* Packed
* Awaiting handover
* Delayed / blocked
* Escalated

### 8.7 Guard / permission / audit kuralları

* Sipariş operasyonu sipariş truth’uyla aynı şey değildir.
* Kullanıcıya görünen takip statüsü ile iç operasyon statüsü birebir aynı olmak zorunda değildir.
* Kritik problem yönlendirmeleri audit izli olmalıdır.

### 8.8 Block / empty / degraded / conflict davranışları

* Queue boşsa operasyonel empty-state gösterilir.
* Tedarikçi veya shipment bağımlılıkları gecikirse panel bunu “problemli iş” olarak görünür kılar.
* Sahte tamamlanmışlık gösterilmez.

### 8.9 Mobil / web farkları

* Ana çalışma biçimi web-first’tür.
* Mobil, yalnız kritik queue takibi ve hafif müdahale alanları için düşünülür.

### 8.10 Yasak davranışlar

* Sipariş truth owner gibi davranmak
* Kullanıcı takip dilini panel iç operasyon diliyle karıştırmak
* Finansal truth veya refund execution’ı bu panelde sahiplenmek

---

## 9. DESTEK TICKET OPERASYON PANELİ SÖZLEŞMESİ

### 9.1 Tek amacı

Resmi destek taleplerini sınıflandırmak, doğru kuyruğa atamak, SLA ile izlemek ve gerekli ekip escalations’ını yönetmek.

### 9.2 Ana aktörler ve scope

* Support Admin / Support Agent
* Operations Team
* Finance Team
* Moderation Team
* Fraud / Risk Team
* Admin

### 9.3 Okuduğu ana alanlar

* Ticket listesi
* Ticket önceliği
* Risk seviyesi
* İlgili sipariş / ödeme / teslimat / iade referansları
* SLA görünürlüğü
* Eskalasyon ve yeniden açılma geçmişi

### 9.4 Tetiklediği aksiyonlar

* Ticket triage et
* Kuyruğa ata
* Sahiplen / yeniden ata
* Escalation başlat
* Kullanıcıdan bilgi iste
* Çözüm kaydı gir
* Resolve / close başlat

### 9.5 Ana modüller

* Ticket kuyruğu
* Triage görünümü
* Atama görünümü
* SLA / aging görünümü
* Escalation görünümü
* Çözüm / kapanış kaydı alanı

### 9.6 State görünürlüğü

* Created
* Triaged
* Assigned
* In progress
* Waiting user
* Waiting internal
* Escalated
* Resolved
* Closed

### 9.7 Guard / permission / audit kuralları

* Destek ticket operasyonu serbest chat değildir.
* Her ticket aynı öncelikte çalışmaz.
* Kritik kapanış ve yeniden açılma hareketleri audit’li olmalıdır.
* İlgili domain ekiplerine yönlendirme kontrollü yapılmalıdır.

### 9.8 Block / empty / degraded / conflict davranışları

* Queue empty-state operasyonel dilde görünür olmalıdır.
* SLA riski olan kayıtlar öne çıkarılmalıdır.
* İlgili sipariş veya ödeme referansı eksikse ticket “işlenemez bağlam” olarak işaretlenebilir.

### 9.9 Mobil / web farkları

* Ana çalışma biçimi web-first’tür.
* Mobil, yalnız hafif queue görünürlüğü ve sınırlı aksiyon için uygundur.

### 9.10 Yasak davranışlar

* Destek mesajlaşmasını sosyal chat alanına çevirmek
* Ticket motorunu owner domain karar sistemi yerine koymak
* Sipariş / refund / moderation truth’unu ticket ekranından doğrudan mutate etmek

---

## 10. Paneller arası kesin ayrımlar

### 10.1 Admin panel vs self-service panel

* Admin panel = üst denetim ve kurallı müdahale
* Fenomen / tedarikçi paneli = yalnız kendi alanında self-service çalışma alanı

### 10.2 Fenomen panel vs tedarikçi panel

* Fenomen panel = mağaza vitrini ve ilişki yönetimi
* Tedarikçi paneli = ürün ve fulfillment girdisi

### 10.3 Sipariş operasyon paneli vs sipariş takip yüzeyi

* Operasyon paneli = iç iş akışı
* Sipariş takip = kullanıcıya çevrilmiş projection

### 10.4 Destek girişi vs ticket operasyonu

* Destek girişi = kullanıcı yüzü
* Ticket operasyonu = iç vaka yönetimi

---

## 11. Panel bazlı ortak hata / blok durumları

Panel sözleşmelerinde en az şu blok/hata sınıfları görünür olmalıdır:

* Auth required
* Scope required
* Permission required
* Actor not allowed
* Invalid transition
* State conflict
* Resource not found
* Dependency degraded
* Reason code required

Bu sınıflar panel davranışında sessiz yutulmaz; kullanıcıya açık biçimde gösterilir.

---

## 12. Aşama 8 kapsamında bu dosyanın kapanış kriteri

Bu dosya şu durumda kapanmış kabul edilir:

* her panel yüzeyi için tek amaç yazılmışsa,
* panelin okuduğu projection ve tetiklediği command ayrılmışsa,
* guard / permission / audit kuralları görünürleştirilmişse,
* block / empty / degraded / conflict davranışları yazılmışsa,
* panel direct write yasağı tüm yüzeylerde korunmuşsa,
* self-service panel ile denetim paneli ayrımı kapanmışsa.

---

## 13. Açık sonraki adım

Bir sonraki dosya `DTO_RESPONSE_CATALOG.md` olacaktır.
Orada:

* storefront ve panel yüzeyleri için response aileleri,
* ekran katmanları,
* projection blokları,
* summary/detail DTO sınıfları,
* state-carrying response yapıları
  kataloglanacaktır.
