KODLAMAYA BAŞLAMADAN ÖNCE NİHAİ YOL HARİTASI
Nihai hedef

Bu yol haritası tamamlandığında elinizde şunlar hazır olmalı:

donmuş kanonik kararlar,
faz-1 kapsamı,
owner / yetki / guard matrisi,
state machine’ler,
veri modeli ve snapshot politikası,
API sözleşmeleri,
dış entegrasyon matrisi,
NFR hedefleri,
ekran/panel sözleşmeleri,
Figma handoff paketi,
analitik / event / audit sözlüğü,
cloud topoloji haritası,
repo / ortam / standart hazırlığı,
kabul kriterleri.

Yani sonuç:
“kodlamaya yakın” değil, “kodlamaya kontrollü biçimde hazır” sistem.

AŞAMA 1 — KANONİKLEŞTİRME VE KAPSAM DONDURMA
Amaç

Tüm dosyaları tek doğrulu hale getirmek.

Yapılacaklar
Revize edilen bütün dosyalar yeniden okunur.
Eski karar izi kalan yerler işaretlenir.
Kritik çakışma kümeleri kapatılır:
story ↔ keşfet
üyelik ↔ checkout
sepet ↔ stok ↔ PDP
fiyat ↔ kupon ↔ kampanya
soru-cevap ↔ tedarikçi paneli
puan ↔ puan market ↔ iade
kullanıcı story ↔ medya yaşam döngüsü
finansal mutabakat ↔ payout ↔ refund etkisi
Her sistem için karar verilir:
faz-1 açık
faz-1 sadeleştirilmiş açık
faz-2’ye park
Ek zorunlu çıktı
Terim Sözlüğü
active
visible
pending
settled
spendable
archived
blocked
restricted
degraded
verified
eligible
gibi terimlerin tek anlamı yazılır.
Teslim çıktıları
KANONIK_KARARLAR_OZETI.md
DOSYA_DURUM_ENVANTERI.md
KRITIK_KARAR_KUMELERI.md
FAZ_1_KAPSAM_LISTESI.md
FAZ_2_PARK_LISTESI.md
TERIM_SOZLUGU.md

Bu aşama bitmeden sonraki aşamalara geçilmez. Çünkü platform sistem ağacı ve kural/yetki omurgası zaten doğruluğun ve owner sınırlarının merkezde tutulmasını zorunlu görüyor.

AŞAMA 2 — OWNER / YETKİ / GUARD MİMARİSİ
Amaç

Kim neyi okuyabilir, kim neyi başlatabilir, kim neyi asla mutate edemez sorusunu kapatmak.

Yapılacaklar
Domain owner matrisi çıkarılır:
auth/session/access
commerce truth
content truth
social truth
financial truth
search intent/candidate
ranking
BFF aggregation
Aktör matrisi çıkarılır:
misafir
kayıtlı kullanıcı
verified kullanıcı
fenomen
tedarikçi
admin
moderatör
operasyon
finans
internal service
panel action caller
Guard katmanları yazılır:
auth guard
role/scope guard
ownership guard
eligibility guard
Dynamic permission listesi yazılır:
Can_Checkout
Can_Pay
Can_Return_Item
Can_Review_Product
Can_Create_UGC
Can_Ask_Question
Can_Message_Creator
vb.
Endpoint sınıfları ayrılır:
public
authenticated user
panel action
internal service
admin protected action
Teslim çıktıları
OWNER_MATRIX.md
ACTOR_MATRIX.md
PERMISSION_MATRIX.md
GUARD_MATRIX.md
ENDPOINT_SCOPE_CATALOG.md

Kural/yetki sistemi bu yapının yalnız RBAC değil, owner enforcement da içerdiğini açıkça söylüyor. BFF write yapmaz, panel direct write yapmaz, owner dışı write yoktur.

### AŞAMA 3 — CORE STATE MACHINE TASARIMI
Amaç

Kritik lifecycle’ları koddan önce kağıtta kapatmak.

Tasarlanacak state machine’ler
checkout
payment
order
shipment / delivery
cancel / return
support ticket
moderation item
creator lifecycle
supplier lifecycle
settlement line
payout batch
Her biri için yazılacak
state listesi
transition listesi
forbidden transition listesi
actor / permission ilişkisi
retry kararı
duplicate/idempotency kararı
audit kaydı
event üretimi
Özellikle netleşecek kurallar
checkout tamamlandı ≠ order oluştu
payment başarılı = order oluşturma hakkı
sipariş ≠ sipariş operasyonu
teslimat ≠ sipariş takip ekranı
refund execution ≠ commerce truth mutation
moderation visibility ≠ hard delete zorunluluğu
Teslim çıktıları
STATE_MACHINES/checkout.md
STATE_MACHINES/payment.md
STATE_MACHINES/order.md
...
TRANSITION_POLICIES.md
IDEMPOTENCY_POLICIES.md

Ödeme, sipariş, teslimat, iade ve mutabakat dosyaları bu ayrımın sert korunması gerektiğini zaten açıkça tarif ediyor.

#### AŞAMA 4 — VERİ MODELİ, SNAPSHOT VE TARİHSEL KAYIT POLİTİKASI
Amaç

Kod başlamadan önce canonical entity sınırlarını belirlemek.

Yapılacaklar
Canonical entity kataloğu çıkarılır.
Her entity için karar verilir:
owner kim
mutable alanlar hangileri
snapshot gereken alanlar hangileri
archive / soft delete / immutable history politikası ne
Özellikle şu snapshot’lar kapanır:
address snapshot
price snapshot
coupon snapshot
campaign effect snapshot
store context snapshot
settlement / payout snapshot
verified purchase / eligibility snapshot
Teslim çıktıları
ENTITY_CATALOG.md
LOGICAL_DATA_MODEL.md
SNAPSHOT_POLICY.md
ARCHIVE_RETENTION_POLICY.md

Finansal mutabakat, sipariş ve adres sistemleri snapshot mantığını zorunlu kılıyor.

##### AŞAMA 5 — API-FIRST TASARIMI

Bu aşama, üçüncü uzmanın en doğru eklerinden biri. Bunu artık ayrı bir blok olarak zorunlu kabul ediyoruz.

Amaç

Kod yazılmadan önce servis ve frontend konuşma sözleşmelerini dondurmak.

Yapılacaklar
OpenAPI / Swagger kontratları hazırlanır.
Şu ayrımlar yapılır:
public API
mobile/web client API
panel API
internal service API
Her endpoint için yazılır:
request
response
error codes
auth scope
permission
idempotency ihtiyacı
Mock API stratejisi hazırlanır:
frontend / mobile ekip mock veriyle başlayabilmeli
Teslim çıktıları
OPENAPI/public.yaml
OPENAPI/app.yaml
OPENAPI/panel.yaml
OPENAPI/internal.yaml
API_ERROR_CATALOG.md
MOCKING_STRATEGY.md

Bu aşama bitmeden frontend ve mobil kodlamaya geçilmez.

### AŞAMA 6 — 3. PARTİ ENTEGRASYON MATRİSİ

Bu da üçüncü uzmanın doğru şekilde işaret ettiği kritik eksikti.

Amaç

Dış dünya bağımlılıklarını kağıtta kontrol altına almak.

Entegrasyon alanları
ödeme sağlayıcısı
kargo sağlayıcısı
SMS/e-posta sağlayıcısı
video transcoding / media provider
e-fatura / e-arşiv
push notification sağlayıcıları
fraud/risk dış servisleri varsa onlar
Her biri için yazılacak
sağlayıcı adayları
owner domain
kullanılacak operasyonlar
synchronous / asynchronous davranış
fallback stratejisi
retry politikası
timeout politikası
mock / sandbox yaklaşımı
sağlayıcı çökünce kullanıcıya ne gösterilir
Teslim çıktıları
THIRD_PARTY_PROVIDER_MATRIX.md
INTEGRATION_BEHAVIOR_RULES.md
FALLBACK_RETRY_TIMEOUT_POLICY.md
SANDBOX_AND_MOCK_PLAN.md
### AŞAMA 7 — NFR / PERFORMANS / KAPASİTE HEDEFLERİ

Bu aşama da yeni zorunlu blok. İş kurallarının yanında hız ve kapasite hedefleri yazılı olmalı.

Amaç

“Doğru çalışan” değil, “hedef altında doğru çalışan” sistem tanımı yapmak.

Yazılacak hedef türleri
arama latency hedefi
PDP ilk görünüm hedefi
checkout action latency hedefi
payment timeout hedefi
order creation hedefi
admin panel table response hedefi
video first-frame hedefi
push notification işlenme hedefi
eşzamanlı kullanıcı kapasite hedefleri
event ingestion hedefleri
Ayrıca
minimum uptime hedefi
RPO/RTO hedefleri
log retention
trace retention
media cold storage politikası
Teslim çıktıları
NFR_TARGETS.md
CAPACITY_ASSUMPTIONS.md
PERFORMANCE_BUDGETS.md
RELIABILITY_TARGETS.md
### AŞAMA 8 — EKRAN, PANEL VE DENEYİM SÖZLEŞMELERİ
Amaç

UI davranışını koddan önce sözleşme haline getirmek.

Hazırlanacak yüzeyler
storefront web
mobil storefront
search
category/PLP
PDP
cart
checkout
payment
order detail / order tracking
returns
notification center
support entry
creator panel
supplier panel
admin panel
Her biri için yazılacak
ekranın tek amacı
hangi truth’lerden okur
hangi aksiyonu tetikler
hangi state’leri gösterir
blocked / degraded / empty / loading halleri
mobil / web farkları
hangi aksiyon command’dır
hangi data projection’dır
Teslim çıktıları
SCREEN_CONTRACTS.md
PANEL_CONTRACTS.md
DTO_RESPONSE_CATALOG.md
STATEFUL_UI_BEHAVIOR_GUIDE.md
### AŞAMA 9 — FIGMA / UI-UX HANDOFF

Bu artık ayrı ve zorunlu aşama. Çünkü ekran sözleşmesi metin olarak yeterli değil. Üçüncü uzmanın bu eleştirisi yerinde.

Amaç

Geliştiricilerin ekranları kendi yorumlarıyla üretmesini engellemek.

Yapılacaklar
bilgi mimarisi
user flow
wireframe
high-fidelity tasarımlar
mobile-first component set
empty/loading/error states
panel table/filter/action halleri
design tokens
spacing / typography / interaction states
developer handoff notları
Handoff kapsamı
mobile app
web storefront
creator panel
supplier panel
admin panel
Teslim çıktıları
FIGMA_LINKS.md
DESIGN_TOKEN_GUIDE.md
COMPONENT_STATE_GUIDE.md
DEV_HANDOFF_PACK.md

Bu aşama bitmeden frontend/mobil geliştirme başlatılmaz.

#### AŞAMA 10 — İŞ KURALI VE ELIGIBILITY REGISTRY
Amaç

Kuralları dosya içi metin olmaktan çıkarıp uygulanabilir kayıt haline getirmek.

Çalışma alanları
fiyat koridoru
kupon sponsor kuralları
kampanya kombinasyon kuralları
price lock / batch price activation
review eligibility
story eligibility
question eligibility
reward point pending/vested/spendable
iade sonrası puan etkisi
story görünürlük/arsiv kuralları
creator/supplier restriction kuralları
Teslim çıktıları
BUSINESS_RULES_REGISTER.md
ELIGIBILITY_RULEBOOK.md
PROMOTION_RULEBOOK.md
UGC_RULEBOOK.md
### AŞAMA 11 — ANALİTİK / EVENT / AUDIT TAKSONOMİSİ
Amaç

Kod başlamadan önce veri omurgasını belirlemek.

Yapılacaklar
analytics event taxonomy
audit taxonomy
metric dictionary
duplicate/late event policy
entity replay policy
anonymous→login identity bind policy
Katmanlar
raw event
normalized event
derived metric
decision signal

Analitik sistemi bu 4 katmanı zaten ana omurga olarak tanımlıyor.

Teslim çıktıları
EVENT_TAXONOMY.md
AUDIT_TAXONOMY.md
METRIC_DICTIONARY.md
DATA_QUALITY_POLICY.md
#### AŞAMA 12 — OPERASYON MANTIĞI VE ESKALASYON MATRİSİ

Burada üçüncü uzmanın uyarısını dikkate alıyoruz:
kullanım kılavuzu değil, operasyon mantığı ve sorumluluk zinciri yazılacak. Tam manual’lar daha sonra üretilebilir.

Amaç

Kod öncesi operasyon owner’larını ve escalation yollarını kapatmak.

Yazılacaklar
fenomen başvuru akışı
tedarikçi başvuru akışı
admin onay/red/revizyon kuralları
support ticket routing mantığı
moderation escalation mantığı
fraud escalation mantığı
finance review mantığı
payout hold / release mantığı
shipment anomaly yönetimi
delayed delivery escalation
Teslim çıktıları
ESCALATION_MATRIX.md
APPROVAL_FLOW_PACK.md
SLA_OWNER_LIST.md
OPERATION_LOGIC_GUIDE.md
###### AŞAMA 13 — CLOUD TOPOLOJİ VE ORTAM MİMARİSİ

Bu da üçüncü uzmanın eklediği kritik bloklardan biri.

Amaç

Sistemin fiziksel/topolojik dağılımını kod öncesi görmek.

Çizilecekler
public edge
CDN
storefront app layer
panel app layer
BFF / gateway katmanı
core services
search/indexing katmanı
PostgreSQL
Redis
object storage
media processing
observability stack
staging / prod ayrımı
secrets/config yönetimi
internal/public network sınırları
Teslim çıktıları
CLOUD_TOPOLOGY_DIAGRAM.png
ENVIRONMENT_ARCHITECTURE.md
SERVICE_DEPLOYMENT_MAP.md
SECRETS_AND_CONFIG_POLICY.md
#### AŞAMA 14 — REPO, ORTAM VE MÜHENDİSLİK STANDARTLARI
Amaç

Kod başlayınca kaos değil, standart üretmek.

Yapılacaklar
repo blueprint
package naming
apps/services/packages ayrımı
branch stratejisi
release stratejisi
migration naming
env dosya standardı
error code standardı
idempotency key formatı
file naming standardı
commit / PR şablonları
Definition of Ready
Definition of Done
Teslim çıktıları
REPO_BLUEPRINT.md
ENGINEERING_STANDARDS.md
BRANCH_RELEASE_POLICY.md
ERROR_CODE_STANDARD.md
DEFINITION_OF_READY.md
DEFINITION_OF_DONE.md
### AŞAMA 15 — KABUL KRİTERLERİ VE KODLAMAYA BAŞLAMA KAPISI
Amaç

“Hazır hissediyoruz” değil, ölçülebilir hazır olma kararı vermek.

Kritik journey listesi
search → PDP
PDP → cart
cart → checkout
checkout → payment
payment → order
order → shipment
delivery → review/story
delivery → return/refund impact
coupon/campaign application
reward point flow
creator/supplier onboarding
support/moderation/fraud escalations
Her journey için yazılacak
minimum data set
success case
fail case
rollback / retry davranışı
analytics etkisi
audit etkisi
permission/guard etkisi
Kodlamaya başlama kapısı

Aşağıdaki 15 kalem tamamlanmış olacak:

Kanonik kararlar dondu
Faz-1 kapsamı dondu
Terim sözlüğü çıktı
Owner matrisi çıktı
Permission/guard matrisi çıktı
State machine’ler hazır
Veri modeli hazır
API kontratları hazır
parti entegrasyon matrisi hazır
NFR hedefleri hazır
Screen/panel contracts hazır
Figma handoff tamam
Event/audit taxonomy hazır
Cloud topoloji hazır
Engineering standards hazır
Teslim çıktıları
ACCEPTANCE_CRITERIA_PACK.md
CRITICAL_JOURNEY_CHECKLIST.md
CODING_READINESS_GATE.md
GÜNCELLENMİŞ NİHAİ SIRALAMA

Uygulama sırası şu olsun:

Kanonikleştirme ve kapsam dondurma
Owner / yetki / guard mimarisi
Core state machine tasarımı
Veri modeli / snapshot politikası
API-first sözleşmeler
parti entegrasyon matrisi
NFR / performans / kapasite hedefleri
Ekran ve panel sözleşmeleri
Figma / UI handoff
İş kuralı ve eligibility registry
Analitik / event / audit taxonomy
Operasyon mantığı ve escalation matrisi
Cloud topoloji ve ortam mimarisi
Repo / standart / mühendislik hazırlığı
Kabul kriterleri ve coding readiness gate
SON HÜKÜM

Bu güncellenmiş sürümle artık yol haritanız:

yalnız iş kuralı odaklı değil,
aynı zamanda mühendislik, entegrasyon, performans, UI handoff ve altyapı hazırlığı içeren
tam kapasiteli bir pre-coding roadmap haline gelmiş olur.

Yani bu sürüm bittiğinde sistem:
“tasarlanmış” değil, “kodlamaya disiplinli şekilde hazır” olur.

