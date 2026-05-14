PHASE-10 ROADMAP — Frontend / UX / Mobile / Panel
PHASE-10A — Real Web App Foundation

Amaç: Console simulation yerine gerçek web uygulaması kurmak.

Yapılacaklar:

Next.js page/layout yapısı
gerçek navigation
responsive shell
BFF client layer
loading/error/empty state altyapısı
auth-aware layout
packages/ui temel component başlangıcı

Çıkış hedefi:

Web artık gerçek browser app olarak açılıyor.
PHASE-10B — Public Storefront / Discovery UI

Amaç: Kullanıcının platformu gezebileceği ana yüzeyleri oluşturmak.

Yapılacaklar:

ana sayfa
keşfet
arama
kategori / PLP
ürün kartları
creator storefront
story/video rail
follow feed temel görünümü

Çıkış hedefi:

Kullanıcı ürünleri ve mağazaları gezebiliyor.
PHASE-10C — PDP / Commerce UI

Amaç: Satın alma karar alanını gerçek UI yapmak.

Yapılacaklar:

PDP
varyant seçimi
fiyat/stok gösterimi
creator mağaza bağlamı
review/Q&A görünümü
beğen/kaydet/paylaş state
sepete ekleme başlangıcı

Çıkış hedefi:

Kullanıcı ürünü anlayıp sepete ekleme kararına gelebiliyor.
PHASE-10D — Cart / Checkout / Payment UI

Amaç: Alışveriş akışını çalışır ve anlaşılır hale getirmek.

Yapılacaklar:

cart
checkout
guest checkout
adres alanı
kupon/kampanya feedback
payment initiate
payment pending
payment failed
payment unknown-result
duplicate submit prevention

Çıkış hedefi:

Kullanıcı ödeme sürecinde ne olduğunu doğru anlıyor.
PHASE-10E — Order / Delivery / Return / Support UI

Amaç: Satış sonrası güven ekranlarını oluşturmak.

Yapılacaklar:

order confirmation
order tracking
shipment timeline
delivery status
cancel request
return request
refund status
support ticket create/list/detail

Çıkış hedefi:

Kullanıcı sipariş ve iade durumunu karıştırmadan takip edebiliyor.
PHASE-10F — Creator Panel Foundation

Amaç: Creator’ın mağazasını yönetebileceği ilk gerçek paneli kurmak.

Yapılacaklar:

creator dashboard
mağaza profil yönetimi
ürün listesi
ürün sıralama / mağazadan çıkarma
story/post/media yönetim başlangıcı
performans özeti
scope guard

Çıkış hedefi:

Creator kendi mağazasını temel seviyede yönetebiliyor.
PHASE-10G — Supplier Panel Foundation

Amaç: Tedarikçinin ürün ve operasyon işlerini yapabileceği paneli kurmak.

Yapılacaklar:

supplier dashboard
ürün gönderimi
ürün revizyon durumu
stok güncelleme
baz fiyat güncelleme
sipariş hazırlama görünümü
shipment input temel akışı

Çıkış hedefi:

Tedarikçi ürün ve fulfillment sürecini temel seviyede yönetebiliyor.
PHASE-10H — Admin / Ops Panel Foundation

Amaç: Platform ekibinin sistemi yönetebileceği operasyon panelini kurmak.

Yapılacaklar:

admin dashboard
ürün onay kuyruğu
creator yönetimi
supplier yönetimi
moderation queue
support queue
risk/fraud review
finance/payout görünümü
audit/evidence görünümü

Çıkış hedefi:

Operasyon ekibi kritik işleri görebiliyor ve güvenli aksiyon başlatabiliyor.
PHASE-10I — UI Boundary Cleanup

Amaç: UI’ın yanlışlıkla truth üretmesini engellemek.

Yapılacaklar:

local mock truth temizliği
PDP local price/stock mock kaldırma
UI permission decision kaldırma
eligibility snapshot input temizliği
panel service dependency temizliği
UI sadece BFF/contract kullanacak hale getirme

Çıkış hedefi:

UI yalnız gösterir; karar vermez.
PHASE-10J — Mobile-first / Responsive Hardening

Amaç: Kritik akışların mobilde kullanılabilir olması.

Yapılacaklar:

360px mobile baseline
checkout mobile
payment mobile
PDP mobile
story/video mobile
order tracking mobile
panel temel mobile usability
sticky CTA
modal/sheet davranışları

Çıkış hedefi:

Kritik kullanıcı akışları mobilde çalışıyor.
PHASE-10K — Accessibility / Performance / UI Smoke

Amaç: PHASE-10 kapanışına hazırlık.

Yapılacaklar:

accessibility minimum check
performance minimum check
Playwright walkthrough
route smoke
payment unknown-result scenario
checkout scenario
order tracking scenario
panel scope walkthrough
build/typecheck/smoke
PHASE-10 closure report

Çıkış hedefi:

PHASE-10 PASS veya PASS WITH LIMITATION kararı verilebilir.
Önerilen Sıra
10A → 10B → 10C → 10D → 10E → 10F → 10G → 10H → 10I → 10J → 10K

Ama pratikte ilk 4 faz kritik:

10A Web Foundation
10B Public Storefront
10C PDP
10D Cart/Checkout/Payment