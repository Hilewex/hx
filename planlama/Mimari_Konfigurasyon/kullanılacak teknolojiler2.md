# TEKNOLOJİ GEREKSİNİM DOSYASI — GÜNCEL SÜRÜM

## 1. Ana Mimari Karar

Bu platform şu omurga ile geliştirilecektir:

```text
Next.js + React Native/Expo + TypeScript + Node.js + pnpm monorepo + PostgreSQL + Redis + OpenSearch + Docker + Grafana/Loki/Tempo

Ana prensip:

Core business logic bizde kalır.
Commodity altyapı kanıtlanmış araçlarla kullanılır.

Yani:

Ne yapılacağı: platform/domain logic
Nasıl taşınacağı: altyapı araçları
2. Web Uygulaması
Kullanılacak Teknolojiler
Next.js
React
TypeScript
Kullanım Alanları
public storefront
ana sayfa
keşfet
kategori / PLP
PDP
sepet
checkout
ödeme
sipariş takip
destek
creator storefront
admin / creator / supplier / support panel yüzeyleri
Karar

Next.js web tarafı için ana framework olacaktır.

3. Mobil Uygulama
Kullanılacak Teknolojiler
React Native
Expo
TypeScript
Expo Router
Karar

Mobil uygulama için React Native + Expo kullanılacaktır.

Not

İlk aşamada web/mobile responsive deneyim tamamlanır. Native mobil uygulama, kritik akışlar doğrulandıktan sonra genişletilir.

4. Monorepo / Paket Yönetimi
Kullanılacak Teknolojiler
pnpm
pnpm workspaces
Karar

Tüm sistem monorepo mantığıyla yürütülür.

Muhtemel yapı:

apps/web
apps/mobile
apps/panel
apps/bff
services/*
packages/contracts
packages/shared
packages/ui
5. Backend
Kullanılacak Teknolojiler
Node.js
TypeScript
Karar

İlk fazda tek backend dili kullanılacaktır.

Web = TypeScript
Mobil = TypeScript
Backend = TypeScript
Contracts = TypeScript
Neden
ekip hızı
contract tutarlılığı
bakım kolaylığı
Roo Code / VS Code AI ile daha kontrollü üretim
6. Ana Veritabanı
Kullanılacak Teknoloji
PostgreSQL
Kullanım Alanları
kullanıcı
ürün
sipariş
ödeme
checkout
adres
kupon
kampanya
settlement
payout
audit
support ticket
moderation
risk kayıtları
outbox kayıtları
Karar

PostgreSQL ana transactional truth veritabanıdır.

7. Cache / Kısa Süreli State / Lock
Kullanılacak Teknoloji
Redis
Kullanım Alanları
cache
rate limit
kısa süreli lock
idempotency helper
session yardımcı state
geçici sayaçlar
düşük riskli geçici kuyruk yardımcıları
Kritik Kural
Redis ana truth değildir.

Ana truth PostgreSQL’de kalır.

8. Arama / Retrieval / Facet
Kullanılacak Teknoloji
OpenSearch
Kullanım Alanları
ürün arama
kategori arama
mağaza arama
filtre / facet
typo tolerance
search candidate generation
keşfet / video ağırlıklı aday üretimi
Karar

OpenSearch arama ve retrieval için kullanılacaktır.

Not

İlk canlı öncesi basit arama ile başlanabilir. OpenSearch production operasyonu kontrollü şekilde devreye alınmalıdır.

9. Event / Outbox / Queue / Worker
Kullanılacak Yaklaşım

İlk production-readiness yaklaşımı:

PostgreSQL Outbox + Worker

Sonraki aşama:

Managed Queue veya RabbitMQ / SQS
Kullanım Alanları
notification dispatch
analytics event processing
audit/event delivery
payment reconciliation
provider callback processing
media processing jobs
settlement / payout jobs
retry gerektiren async işler
Kritik Kural
Outbox bizde.
Business logic bizde.
Queue engine commodity altyapıdan.
Şimdilik Kullanılmayacaklar
Kafka
karmaşık distributed event platformu
gereksiz büyük queue mimarisi
Neden

Kafka erken faz için fazla ağırdır. İlk ihtiyaç güvenli outbox, basit worker, retry ve DLQ mantığıdır.

10. Medya / Storage / CDN
Kullanılacak Teknolojiler
S3 uyumlu object storage
CloudFront veya Cloudflare CDN
ileride managed video processing
Kullanım Alanları
ürün görselleri
ürün videoları
story medyaları
post medyaları
creator mağaza görselleri
kampanya/vitrin görselleri
Kritik Kural
Medya dosyası uygulama sunucusunda tutulmaz.

Medya object storage üzerinde tutulur, CDN üzerinden servis edilir.

11. Gözlemlenebilirlik
Kullanılacak Teknolojiler
Grafana
Loki
Tempo
ileride Prometheus
Kullanım Alanları
log izleme
hata takibi
trace
dashboard
payment/order/support/reconciliation görünürlüğü
Başlangıç Önceliği

İlk etapta her şeyi izlemek değil, şu kritik alanları izlemek gerekir:

ödeme
checkout
sipariş
provider callback
reconciliation
notification
support ticket
admin action
error rate
12. Error Monitoring
Kullanılacak Araç
Sentry veya eşdeğer error monitoring aracı
Kullanım Alanları
frontend error
backend exception
mobile crash
panel error
payment/checkout exception
Karar

Production öncesi error monitoring zorunludur.

13. Security / Secret / Config
Kullanılacak Yaklaşım
environment based config
secret manager
provider secret rotation
local .env
production secret vault
Kullanım Alanları
PayTR secret
database credentials
Redis credentials
JWT/session secret
provider callback secret
object storage credentials
Kritik Kural
Secret kod içine yazılmaz.
14. Backup / Restore
Kullanılacak Yaklaşım
PostgreSQL backup
restore testleri
object storage backup policy
audit/outbox retention policy
Kritik Kural
Backup almak yetmez; restore test edilmelidir.
15. Rate Limit / Abuse Protection
Kullanılacak Teknolojiler
Redis tabanlı rate limit
CDN/WAF rate limit
application-level guard
Kullanım Alanları
login
checkout
payment
coupon usage
review/story upload
support ticket
provider callback
search abuse
notification abuse
16. Container / Local Geliştirme
Kullanılacak Teknolojiler
Docker
Docker Compose
Kullanım Alanları
PostgreSQL
Redis
OpenSearch
Grafana/Loki/Tempo
local worker
local BFF
local web/panel
17. Web Ek Kütüphaneleri
Kullanılacaklar
Tailwind CSS
TanStack Query
Zod
React Hook Form
shadcn/ui veya internal UI kit
Playwright
Vitest
Kullanım Alanları
Tailwind CSS

Hızlı, kontrollü, responsive UI.

TanStack Query

Data fetching, cache ve server state yönetimi.

Zod

Contract ve form validation.

React Hook Form

Adres, checkout, payment, panel formları.

shadcn/ui

Hızlı component foundation.

Playwright

Critical journey ve UI walkthrough testleri.

Vitest

Unit / service-level testler.

18. Mobil Ek Kütüphaneleri
Kullanılacaklar
Expo Router
TanStack Query
React Hook Form
Zod
expo-video veya ihtiyaç halinde native video katmanı
19. API / Servis Test Araçları
Kullanılacaklar
Postman veya Insomnia
curl
smoke test runner
Playwright API/UI testleri
Öneri
Hızlı kişisel kullanım: Insomnia
Takım paylaşımı: Postman
20. Veritabanı / Operasyon Araçları
Kullanılacaklar
DBeaver veya TablePlus
Redis Insight
OpenSearch Dashboards
Grafana
21. Kullanılmaması Gerekenler / Şimdilik Açılmayacaklar
İlk aşamada açılmayacaklar
Kubernetes
Kafka
iki farklı backend dili
MongoDB ana truth olarak
custom queue engine yazmak
custom distributed lock altyapısı yazmak
custom message broker yazmak
Neden

Bu teknolojiler kötü değildir. Ancak erken fazda:

operasyon yükünü artırır
maliyeti yükseltir
karmaşıklık yaratır
ürün doğrulamasını geciktirir
22. Build vs Buy Kararı
Bizim Yapacağımız Alanlar
owner boundary
domain logic
permission guard
mutation guard
PII guard
event taxonomy
audit logic
analytics logic
notification rules
reconciliation decision
business workflow
Dış Altyapıdan Kullanılacak Alanlar
queue taşıma katmanı
object storage
CDN
email/SMS/push provider
error monitoring
managed database ops gerekiyorsa
WAF/CDN protection
Ana Kural
Rekabet avantajı olan şeyi biz yaparız.
Commodity altyapıyı dışarıdan kullanırız.
23. Production-Readiness İçin Eklenen Zorunlu Başlıklar

Başlangıç teknoloji listesine ek olarak artık şu alanlar zorunludur:

PostgreSQL Outbox
Worker runtime
Retry / DLQ politikası
Object Storage + CDN
Error Monitoring
Secret Management
Backup / Restore
Rate Limiting
Playwright UI walkthrough
Performance minimum check
Accessibility minimum check
24. Güncel Zorunlu Stack
Next.js
React
React Native
Expo
TypeScript
Node.js
pnpm
PostgreSQL
Redis
OpenSearch
Docker
Grafana
Loki
Tempo
S3-compatible Object Storage
CDN
PostgreSQL Outbox
Worker Runtime
Sentry veya eşdeğer Error Monitoring
Playwright
Vitest
25. Güncel Zorunlu Programlar
VS Code
Docker Desktop
Git
Node.js LTS
pnpm
DBeaver veya TablePlus
Redis Insight
OpenSearch Dashboards
Postman veya Insomnia
Grafana
Sentry veya eşdeğer error monitoring paneli
26. Güncel Nihai Karar

Bu platform şu teknoloji omurgasıyla ilerlemelidir:

Next.js + React Native/Expo + TypeScript + Node.js + pnpm monorepo + PostgreSQL + Redis + OpenSearch + Docker + Grafana/Loki/Tempo + Object Storage/CDN + PostgreSQL Outbox/Worker + Playwright + Error Monitoring

Ana strateji:

Önce sade ama doğru production-readiness.
Sonra kullanıcı ve trafik arttıkça managed queue, gelişmiş worker orchestration ve daha güçlü observability.
27. Kısa Yönetici Özeti

İlk teknoloji kararımız doğruydu.

Değiştirilmesi gereken ana omurga yoktur.

Ancak platform artık foundation seviyesinden production-readiness seviyesine geçtiği için aşağıdaki ekler zorunlu hale gelmiştir:

gerçek medya storage/CDN
outbox/worker altyapısı
error monitoring
secret management
backup/restore
rate limit
UI walkthrough testleri

Net karar:

Ana stack korunur.
Production çevresi güçlendirilir.
Ağır infra erken açılmaz.