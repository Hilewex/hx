FAZ-2 / BÖLÜM-6
Repo Audit Control Criteria — v0.1

Bu bölüm çok önemli.

Çünkü artık:

repo’ya baktığımızda
neye göre karar vereceğimizi

kesinleştiriyoruz.

Yani:

“Bu kod doğru mu yanlış mı?” sorusunun cetvelini oluşturuyoruz.

1. Ana kural

Repo audit:

feature sayma işi değildir

Şunlara bakacağız:

truth korunuyor mu?
owner boundary korunuyor mu?
lifecycle doğru mu?
financial safety var mı?
event akışı doğru mu?
projection owner olmuş mu?
2. Audit sonuç sınıfları

Her modül/sistem için şu statülerden biri verilecek:

Status	Anlam
COMPLETE	doğru ve production-ready
ACCEPTABLE	küçük eksikler var
PARTIAL	yarım implementasyon
BROKEN	mimari yanlış
DANGEROUS	production riski
INTENTIONALLY_CLOSED	bilinçli kapalı capability
3. En kritik ayrım

Şu ayrım çok önemli:

Eksik feature
≠
bilinçli kapalı capability

Örnek:

payout execution intentionally closed olabilir

Bu:

broken

değildir.

4. Audit ana kategorileri

Repo her domain için şu başlıklarda incelenecek:

Kategori	Amaç
Ownership	doğru owner var mı
Write boundary	illegal write var mı
Lifecycle	state akışı doğru mu
Eligibility	haklar doğru açılıyor mu
Snapshot	immutable kayıt var mı
Event flow	event sistemi doğru mu
Projection	projection owner olmuş mu
Financial integrity	para güvenli mi
Moderation/risk	trust korunuyor mu
Async reliability	retry/idempotency güvenli mi
Observability	sistem izlenebilir mi
5. Ownership audit kriteri

Sorular:

Bu verinin gerçek sahibi kim?
Bu modül owner mı?
Başka sistem owner bypass yapıyor mu?

Örnek:

creator service stock update yapıyorsa
→ DANGEROUS
6. Write boundary audit kriteri

Kontrol:

panel direct DB write var mı?
BFF state mutate ediyor mu?
event consumer owner gibi davranıyor mu?

Bunlar ciddi risk.

7. Lifecycle audit kriteri

Kontrol:

state sırası doğru mu?

Örnek:

Doğru:

delivered
→ review eligibility

Yanlış:

order created
→ review enabled
8. Eligibility audit kriteri

Kontrol:

haklar doğru şartlarda mı açılıyor?

Örnek:

Capability	Gerekli
reward	moderated contribution
payout	settled earnings
review	delivered order
creator store	approved creator

Bypass varsa:

HIGH RISK
9. Snapshot audit kriteri

Kontrol:

sipariş anındaki gerçekler sabitleniyor mu?

Özellikle:

price snapshot
address snapshot
variant snapshot
coupon snapshot
store snapshot

Yoksa:

order geçmişi bozulabilir
10. Projection audit kriteri

Kontrol:

projection owner gibi davranıyor mu?
cache truth olmuş mu?
search index commerce kararı veriyor mu?

Projection sadece gösterim olmalı.

11. Event audit kriteri

Kontrol:

event doğru owner’dan mı çıkıyor?
duplicate side effect var mı?
retry güvenli mi?
cron workaround kullanılmış mı?

Özellikle:

payment retry
duplicate order üretiyor mu?

çok kritik.

12. Financial audit kriteri

EN ÖNEMLİ AUDIT.

Kontrol:

payment
settlement
refund
reward
coupon
payout

Risk örnekleri:

duplicate payout → P0
refund without reversal → P0
coupon sponsor corruption → P0
reward abuse → HIGH RISK
13. Moderation/risk audit kriteri

Kontrol:

hidden content discovery’de çıkıyor mu?
risk payout/reward sistemini etkiliyor mu?
fake engagement filtreleniyor mu?
14. Async reliability audit kriteri

Kontrol:

queues
retry
dead letters
idempotency

Özellikle:

aynı job tekrar çalışınca
aynı side effect oluşuyor mu?
15. Observability audit kriteri

Kontrol:

metrics var mı?
audit log var mı?
critical flow izlenebiliyor mu?

Özellikle:

payment
settlement
payout
reward
shipment

izlenebilir olmalı.

16. Risk seviyeleri
Risk	Anlam
P0	production killer
P1	yüksek finans/ticaret riski
P2	operasyon/ölçek riski
P3	UX/kalite riski
P4	kozmetik
17. P0 örnekleri
duplicate payout
stock corruption
payment/order mismatch
unaudited finance actions
reward farming exploit
18. P1 örnekleri
review eligibility bug
creator pricing bypass
moderation leakage
return correction issue
19. Audit çalışma yöntemi

Repo audit sırasında:

domain domain
servis servis
tablo tablo
event event

gideceğiz.

Rastgele değil.

20. Her bulgu nasıl yazılacak?

Standart format:

Alan	İçerik
Domain	hangi sistem
Evidence	hangi dosya/kod
Truth expectation	ne olmalıydı
Repo reality	gerçekte ne yapıyor
Status	COMPLETE/PARTIAL/BROKEN
Risk	P0/P1/P2
Required fix	ne yapılmalı
21. Örnek audit kaydı
Alan	Değer
Domain	Reward
Evidence	reward-service/grant.ts
Truth expectation	reward moderation sonrası spendable olmalı
Repo reality	payment success anında grant
Status	DANGEROUS
Risk	P1
Required fix	pending → moderation → vested flow kurulmalı
22. Repo audit’in amacı

Amaç:

kod kötülemek değil

Amaç:

canonical truth ile
gerçek implementation’ı uzlaştırmak
23. Bu kriterler neden çok önemli?

Çünkü büyük sistemlerde:

çalışıyor gibi görünen şey
aslında büyük risk olabilir

Örneğin:

stok sistemi çalışıyor görünür
ama duplicate truth vardır

Bu ancak bu cetvelle yakalanır.

24. Faz-2 sonucu

Şu an oluşan çıktılar:

DOMAIN_OWNERSHIP_MAP_v0.1
WRITE_BOUNDARY_MATRIX_v0.1
READ_PROJECTION_MATRIX_v0.1
EVENT_BOUNDARY_MAP_v0.1
SYSTEM_INTERACTION_MAP_v0.1
REPO_AUDIT_CONTROL_CRITERIA_v0.1
25. Şu an ne oldu?

Artık elimizde:

✅ Platformun canonical truth’u
✅ Ownership modeli
✅ Write/read sınırları
✅ Event mimarisi
✅ Projection modeli
✅ Sistem etkileşim kuralları
✅ Repo audit kriterleri

var.

Yani artık:

repo’ya profesyonel seviyede bakabilecek noktaya geldik
