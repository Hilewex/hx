KULLANACAĞIN ANA TEKNOLOJİLER
1) Web uygulaması
Next.js
React
TypeScript

Gerekçe: Next.js, React tabanlı full-stack web uygulamaları için resmi framework’tür; TypeScript ve App Router ile hızlı, optimize ve SEO uyumlu web yüzeyleri kurmaya uygundur. Next.js ayrıca yerleşik optimizasyonlar ve image optimization gibi performans araçları sağlar.

2) Mobil uygulama
React Native
Expo
TypeScript

Gerekçe: React Native’in resmi dökümanında Expo, “production-grade React Native framework” olarak geçiyor; Expo da tek JavaScript/TypeScript proje ile Android, iOS ve web hedeflerini destekliyor. Bu sizin mobil öncelikli ama hız odaklı yapınıza en dengeli çözümdür.

3) Monorepo / paket yönetimi
pnpm
pnpm workspaces

Gerekçe: pnpm workspaces resmi olarak monorepo ve çok paketli repo yapısını destekliyor. Sizin web + mobil + backend + shared contracts yapınız için uygun.

4) Backend
Node.js
TypeScript

Benim net tavsiyem:
ilk fazda tek backend dili kullan.
Yani:

web = TS
mobil = TS
backend = TS

Bu, ekip hızını ve bakım kolaylığını artırır. Bu kısım resmi doküman alıntısı değil; benim mimari karar önerimdir.

5) Ana veritabanı
PostgreSQL

Gerekçe: Sipariş, ödeme, adres, kupon, hakediş, iade, moderasyon ve audit gibi çekirdek transactional truth alanları için ana veritabanın PostgreSQL olmalı. PostgreSQL’in güncel resmi dökümanı current sürümü ve ana belge setini sunuyor.

6) Cache / yardımcı state / kısa süreli lock
Redis

Gerekçe: Redis’in resmi dökümanı yüksek hızlı veri erişimi, cache ve in-memory kullanım senaryolarını destekliyor. Sende Redis ana truth olmayacak; cache, rate limit, kısa süreli lock, idempotency, helper queue gibi işler için kullanılacak.

7) Arama / retrieval / facet
OpenSearch

Gerekçe: Ürün arama, typo tolerance, filtre/facet, kategori arama ve mağaza retrieval için ayrı arama motoru şart. OpenSearch resmi dökümanı bu tip search ve analytics kullanımını destekliyor.

8) Gözlemlenebilirlik
Grafana
Loki
Tempo

Gerekçe:
Loki log stack’i için, Tempo trace için, Grafana dashboard ve görünürlük için uygun. Resmi dokümanlarda Loki logging stack, Tempo tracing backend olarak tanımlanıyor.

9) Container / local geliştirme
Docker
Docker Compose

Gerekçe: local geliştirme, servis ayağa kaldırma, PostgreSQL/Redis/OpenSearch/Grafana stack’i için şart. Grafana Loki dökümanı da Docker/Compose ile evaluation/development kurulumu destekliyor.

KULLANACAĞIN PROGRAMLAR
Zorunlu günlük araçlar
VS Code → ana editör
Docker Desktop → local servisler
Git → versiyon kontrol
Node.js LTS → çalışma ortamı
pnpm → paket yönetimi
API ve servis test araçları
Postman veya Insomnia
curl (terminal testleri için)

Benim önerim:
Günlük hızlı deneme için Insomnia, takım paylaşımı için Postman.
Bu bölüm pratik öneridir.

Veritabanı araçları
DBeaver veya TablePlus → PostgreSQL yönetimi
Redis Insight → Redis gözlemleme
OpenSearch Dashboards → arama index kontrolü
Gözlemleme / log / tracing araçları
Grafana
Loki
Tempo
istersen ileride Prometheus

Grafana ekosisteminde Loki log, Tempo trace tarafını tamamlar.

WEB TARAFINDA EK KÜTÜPHANELER
Kullan
Tailwind CSS
React Query / TanStack Query
Zod
React Hook Form
shadcn/ui veya sade internal UI kit

Bu bölüm resmi kaynak aramadan verdiğim profesyonel öneri setidir.

Neden?
Tailwind CSS: hızlı ve kontrollü UI
TanStack Query: data fetching / cache
Zod: contract validation
React Hook Form: checkout, adres, panel formları
shadcn/ui: hızlı ama özelleştirilebilir bileşen tabanı
MOBİL TARAFINDA EK KÜTÜPHANELER
Kullan
Expo Router
TanStack Query
React Hook Form
Zod
video için expo-video veya ihtiyaç halinde native destekli video katmanı

Expo resmi dokümanı çoklu platform ve router desteğini zaten öne çıkarıyor.

MEDIA / STORAGE / CDN
Kullan
AWS S3 veya eşdeğeri object storage
CDN: CloudFront veya Cloudflare
video processing için başlangıçta managed servis düşün

Bu kısım için en net yön:
medya dosyasını kendi uygulama sunucunda tutma.
Object storage + CDN kullan.

Bu bölüm daha çok mimari tavsiyemdir; burada ayrıca web araması yapmadım.

KULLANMAMAN GEREKENLER / ŞİMDİLİK AÇMAMAN GEREKENLER
İlk fazda açma
Kubernetes
Kafka
RabbitMQ
Go + Node iki backend dili birlikte
MongoDB ana katalog truth olarak

Sebep:

erken fazda operasyon yükünü gereksiz büyütür
ekip hızını düşürür
bakım maliyetini artırır

Bunlar kötü teknolojiler değil; ama faz-1 için erken.

NİHAİ KAYIT LİSTESİ

Bunu doğrudan kaydet:

Zorunlu stack
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
Zorunlu programlar
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
Web ekleri
Tailwind CSS
TanStack Query
Zod
React Hook Form
shadcn/ui
Mobil ekleri
Expo Router
TanStack Query
Zod
React Hook Form
Tek satırlık kesin karar

Bu platformu şu omurgayla kur:
Next.js + React Native/Expo + TypeScript + Node.js + pnpm monorepo + PostgreSQL + Redis + OpenSearch + Docker + Grafana/Loki/Tempo