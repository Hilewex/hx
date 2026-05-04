ÖNERİ / SIRALAMA SİSTEMİ
1. Sistem tanımı

Öneri / sıralama sistemi, platformdaki ürün, içerik, mağaza ve feed adaylarını yüzey bağlamına göre skorlayan, sıralayan, kişiselleştiren ve kontrollü fallback üreten algoritmik karar sistemidir. Bu modül içerik/ürün ana datasını sahiplenmez; yalnız aday set, sinyal, skor, recommendation ve ranking çıktısını üretir. Modül 8 dokümanlarında recommendation generation, personalization scoring, ranking/reranking ve feed generation owner alanları açıkça tanımlanmıştır.

2. Sistemin ana amacı

Bu sistemin ana amacı şudur:

keşfet, ana sayfa, takip, mağaza, kategori ve arama yüzeylerinde doğru adayları doğru sırayla göstermek,
kişiselleştirme ile generic akış arasında kontrollü geçiş kurmak,
etkileşim, satış, stok, iade ve güven sinyallerini birlikte değerlendirmek,
sıralamayı tam manuel operasyon alanına çevirmeden platform kalitesini yükseltmektir.
Modül 8 ana dosyası çıktılar arasında ürün sıralaması, içerik sıralaması, feed akışı, keşfet listesi, öneri listeleri ve kullanıcıya özel içerik sayar.
3. Temel ilke

Bu sistemin temel ilkesi şudur:

Öneri ve sıralama, tek formüllü değil çok sinyalli ve yüzey bağlamlı çalışır.

Modül 8’de açıkça:

algoritma tek formüle bağlı değildir,
multi-signal zorunludur,
satış ve içerik birlikte değerlendirilir,
stok ve iade oranı kritik sinyaldir,
manipülasyon tespiti zorunludur,
admin override mümkündür ama sınırlıdır
denir. Bu ilke sistemin omurgasıdır.
4. Owner scope

Öneri / sıralama sistemi şu alanların owner’ıdır:

feed generation
ranking / reranking
recommendation generation
personalization scoring
search final ranking
suppression / demotion / boost computation
fallback feed_type kararı
trend slot dışı ana feed ordering

Ama:

commerce truth mutate etmez
content truth mutate etmez
social truth mutate etmez
search intent owner değildir
page/BFF owner değildir
CMS tam manuel override açamaz.
5. Sistem hangi truth’lerden beslenir

Bu sistem read-only olarak şu modüllerden beslenir:

M1: auth/session/account state/trust context
M2: commerce signals, stock, price, availability, conversion context
M3: content pool / visibility / moderation-safe content
M4: social signals, interaction summary, follow graph projection
M5: storefront / creator performance context
M9: search intent + candidate set
M12: fraud / safety / suppression input

Yani öneri sistemi tek başına veri üretmez; var olan truth’leri sinyal olarak kullanır.

6. Ana sinyal aileleri

Dosyalara göre çekirdek sinyal aileleri şunlardır:

içerik etkileşimi
sosyal etkileşim
sepete ekleme / dönüşüm / satış
iade oranı
stok durumu
kullanıcı kalite/güven profili
spam / fraud / duplicate şüphesi
mağaza / creator performansı
freshness / yeni içerik etkisi

Modül 8 sinyal ingest ve score tanımlarında bunlar açıkça yer alır.

7. Çekirdek entity omurgası

Bu sistem için dosyalarda tanımlanan minimum entity ailesi şunlardır:

AlgorithmContext
SignalSnapshot
ContentScoreProfile
ProductScoreProfile
UserScoreProfile
RecommendationCandidate
RankingScore
FeedAssembly
PersonalizationProfile
ColdStartBoostRule
SuppressionRule
ManualOverrideRecord
FeatureVectorStoreRef
DuplicateDetectionRecord
AlgorithmOutputProjection

Bu entity seti recommendation, ranking, feed assembly ve projection mantığını taşır.

8. Yüzey bağlamı zorunluluğu

Bu sistem her yerde aynı sıralamayı kullanmaz. Modül 8 API ve context dokümanlarında ranking’in bağlam bazlı çalışması gerektiği açıkça yazılıdır. Ana yüzey bağlamları:

home
discover
following
storefront
category/PLP
search
PDP related recommendations

Yani “tek global sıralama” yoktur; her yüzey kendi amacıyla değerlendirilir.

9. Keşfet davranışı

Keşfet tamamen algorithm-owned yüzeydir. Dosyalarda açıkça:

feed tamamen M8 tarafından üretilir
manual ranking yoktur
admin etkisi yalnız skor ağırlığı veya ayrı trend surface ile sınırlıdır
ana feed bypass edilemez
denir. Keşfet dosyası da bu yüzeyin açık sosyal-commerce keşif alanı olduğunu, karar tamamlama yüzeyi olmadığını söyler. Bu nedenle keşfet sıralaması yüksek derecede algoritmik ve multi-signal olmalıdır.
10. Ana sayfa davranışı

Ana sayfada CMS yalnız block composition yapar; blok içi sıralama ve personalization M8’dedir. Yani ana sayfa tamamen manuel vitrin değildir. Promo/vitrin blokları olabilir ama blok iç order öneri/sıralama sisteminden gelmelidir. Bu karar ana sayfa dosyasındaki hibrit yapı ve Modül 8 API kurallarıyla uyumludur.

11. Takip yüzeyi davranışı

Takip yüzeyinde follow truth M4’tedir; ama follow-based feed generation ve feed_type kararı M8’dedir. Ayrıca BFF “boşsa generic göster” kararı alamaz; yalnız M8 çıktısını taşır. Bu şu anlama gelir:

takip yüzeyi tam kronolojik değildir
ama keşfet gibi agresif açık ranking de değildir
seçilmiş ilişki bağlamında hafif algoritmik/dengeli akış üretir.
12. Arama ile ilişkisi

Arama tarafında:

M9 query parsing / intent / candidate üretir
M8 final ranking, personalization ve sinyal birleşimini yapar

Arama sistem dosyası da genel aramada klasik sıralama desteklenebileceğini; keşfet aramasında ise trend/yeni/en çok kaydedilen/en çok paylaşılan gibi hafif keşif yönlerinin daha doğru olduğunu söyler. Yani aramada intent M9’da, final ranking M8’dedir.

13. Kategori / PLP ile ilişkisi

Kategori / PLP seçim yüzeyidir; burada filtre ve sıralama çekirdek davranıştır. Modül 8 API açıkça category rerank endpoint’i tanımlar ve M9 filter/search akışını kullanabilse de final sıralamanın M8’de kaldığını söyler. Dolayısıyla kategori yüzeyi:

tamamen keşfet feed’i gibi algoritmik değil,
tamamen statik de değil,
filtre sonrası sonuçları sıralama sistemiyle yeniden düzenleyen ticari seçim yüzeyidir.
14. Storefront / fenomen mağaza ile ilişkisi

Storefront truth M5’tedir; ama ürün/içerik rail sıralaması M8 katkısıyla yapılabilir. Bu çok kritik ayrım:

mağaza kimliği, içerik sahibi ve vitrinin ana truth’u storefront tarafında,
ama mağaza içi öneri rail’leri veya ürün sıralama katkısı algoritmadan gelebilir.

Bu, fenomen mağazasının “kendi mağazası gibi hissettiren ama platform kontrollü” yapısıyla uyumludur.

15. PDP related recommendation

Modül 8 API’de rerank/pdp-related açıkça tanımlanır. Yani PDP’de ilgili ürün / benzer ürün / tamamlayıcı ürün önerileri recommendation/ranking modülünün alanıdır. Ama bu alan PDP karar yüzeyinin önüne geçmemeli; destekleyici kalmalıdır.

16. Kişiselleştirme

Bu sistem kişiselleştirme profili tutmalıdır. Dosyalarda PersonalizationProfile entity’si ve GET /algorithm/personalization/me endpoint’i açıkça vardır. Ayrıca kullanıcı etkileşimi kişiselleştirmeyi günceller tetikleyicisi tanımlıdır. Doğru model:

user_id varsa kişiselleştirme devreye girer
profil boşsa generic mode açılabilir
personalization tüm yüzeylerde aynı ağırlıkla çalışmak zorunda değildir.
17. Cold start

Yeni ürün, yeni içerik veya yeni mağaza için cold start mekanizması zorunludur. Modül 8 bunu doğrudan kilit karar olarak yazar. Aksi halde sadece geçmiş performansı güçlü olanlar görünür olur ve yeni adaylar hiç çıkamaz.

18. Stok ve iade etkisi

Bu sistem yalnız etkileşim bakmaz; stok ve iade oranı kritik sinyal kabul edilir. Modül 8 tetikleyicileri açıkça:

stok bitti → visibility düşer
iade arttı → skor düşüşü
der. Bu çok önemli; viral ama stoksuz ya da çok iade alan ürünü agresif önermez.
19. Manipülasyon ve güvenlik

Bu sistemde manipülasyon tespiti zorunludur. Edge case’lerde:

bot etkileşim → sinyal filtreleme
fenomen manipülasyonu → fraud + suppression
kullanıcı spam davranışı → kişiselleştirme dışı bırakma
duplicate içerik → duplicate detection
kuralları açıkça tanımlanmıştır. Bu nedenle öneri/sıralama sistemi mutlaka fraud ve moderasyon girdisiyle çalışmalıdır.
20. Admin / merchandising override sınırı

Admin override mümkündür ama sınırlıdır. Açık kurallar:

relevance override yok
query intent override yok
full manual ordering yok
keşfette manual ranking yok
ana sayfada full manual home feed açılamaz
trend slot policy ana feed policy’sinden ayrı tutulur

Yani admin skoru etkileyebilir ama nihai listeyi keyfi elle yazamaz. Bu, platformun kontrollü ama tamamen manuel olmayan algoritmik yapısını korur.

21. Fallback ve generic mode

Bu sistemde fallback mekanizması olmalıdır. Dosyalarda fallback evaluate ve generic/personalized/follow_based/discovery_fallback gibi kontrollü modların üretildiği yazılır. Ayrıca yüzey task’lerinde zero-result veya empty durumda fallback zincirleri tanımlıdır. Bu nedenle:

personalization yoksa generic,
takip yüzeyi boşsa controlled follow fallback,
zero-result varsa alternatif öneri
üretilebilmelidir.
22. Arama öneri paneli ile ilişkisi

Arama sistemi dosyasında boş veya yazım anındaki otomatik öneriler:

son aramalar
trend aramalar
popüler kategoriler
öne çıkan mağazalar
sorgu tamamlama
olarak tanımlanır. Bu alan recommendation/ranking sisteminin hafif yönlendirme çıktısı olabilir; ama reklam çöplüğüne dönmemesi gerektiği özellikle vurgulanır.
23. Ana riskler

Bu sistemdeki ana riskler:

keşfetin katalog sayfasına dönmesi
CMS/admin’in tam manuel override ile algoritmayı bypass etmesi
aramada relevance’ın merchandising tarafından bozulması
stock-out veya yüksek iade ürünün aşırı öne çıkması
bot/spam etkileşimlerin skorları kirletmesi
yeni ürünlerin hiç görünmemesi
BFF’nin karar verici gibi davranması

Dosyalardaki modül sınırları bu riskleri özellikle kapatır.

24. Ana kurallar

Öneri / sıralama sistemi için sabitlenmesi gereken temel kurallar şunlardır:

ranking ve recommendation owner’ı M8’dir
modül içerik/ürün ana datasını mutate etmez
multi-signal zorunludur
stok ve iade oranı kritik sinyaldir
manipülasyon tespiti zorunludur
personalization desteklenir; profil boşsa generic mode açılabilir
keşfet algorithm-owned’dur, full manual ranking yoktur
aramada intent M9’da, final ranking M8’dedir
kategoride filtre sonrası sıralama M8 katkısıyla çalışır
ana sayfada CMS composition yapar, blok içi order M8’dedir
storefront truth ayrı kalır; rail ranking M8 katkısı alabilir
full manual override yoktur
admin etkisi bounded weight/boost/policy seviyesindedir
fallback ve cold start mekanizmaları zorunludur
BFF karar vermez; yalnız projection taşır.
25. Nihai kısa özet

Öneri / sıralama sistemi, ürün, içerik ve mağaza adaylarını yüzey bağlamına göre çok sinyalli biçimde skorlayan; kişiselleştirme, cold start, suppression ve fallback modlarını işleten; keşfet, ana sayfa, takip, kategori, arama, storefront ve PDP ilgili öneri alanlarında final ranking / recommendation çıktısı üreten; ama içerik, commerce veya search truth’unu mutate etmeyen merkezi algoritmik karar sistemidir.