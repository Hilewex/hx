# HARDENING-00 — Cross-System Foundation Baseline Review Raporu

## 1. Kısa Yönetici Özeti

Bu rapor, HX sosyal-ticaret monorepo’sunun mevcut temel (foundation) durumunu kod ve dosya gerçeğine dayanarak analiz eder.

- **Genel Repo Durumu:** Repo, `pnpm` workspace tabanlı, `apps`, `services`, ve `packages` olarak net bir şekilde ayrılmış, iyi yapılandırılmış bir monorepo’dur. Kod kalitesi ve tutarlılığı yüksektir; `typecheck` ve `build` süreçleri sorunsuz çalışmaktadır. Birçok servis için `in-memory` ve `postgres` persistence katmanları kod seviyesinde hazır durumdadır.

- **Hardening’e Geçilebilir mi?:** Evet, ancak şartlı. Kod temeli sağlam olmasına rağmen, kritik test altyapısı eksiktir ve birçok servis varsayılan olarak `in-memory` modda çalışmaktadır. Hardening süreci, öncelikle bu iki alanı (persistence aktivasyonu ve test altyapısı kurulumu) ele alarak başlamalıdır.

- **En Kritik 5 Ortak Eksik:**
  1.  **In-Memory Veri Depolama:** Servislerin büyük çoğunluğu, kodda PostgreSQL desteği olmasına rağmen varsayılan olarak `in-memory` (hafızada) veri depolama kullanmaktadır.
  2.  **Smoke / Acceptance Test Eksikliği:** `package.json` dosyasında standart bir `smoke` veya `acceptance` test scripti tanımlı değildir. Bu, sistemlerin bütüncül sağlığını doğrulamanın önündeki en büyük engeldir.
  3.  **Eksik Planlama ve Kapanış Dokümanları:** Talep edilen `SYSTEM_CLOSURES` ve arşiv (`...A-...md`) dosyalarının çoğu bulunamamıştır. Bu durum, kod ile dokümantasyon arasında bir kopukluk olduğunu göstermektedir.
  4.  **Simülasyon Seviyesinde Kalan Sistemler:** Başta `Video` olmak üzere bazı sistemler (Auth, vb.) kontrat (contract) veya servis kodu seviyesinde çok zayıf veya eksiktir ve büyük ölçüde simülasyon olarak çalışmaktadır.
  5.  **Provider Bağımlılıkları:** Ödeme, kargo gibi dış servis bağımlılıkları gerçek entegrasyonlar yerine kod içinde simülasyonlarla yönetilmektedir.

- **En Acil Önerilen İlk Paket:** `HARDENING-01 — Persistence & Test Foundation`. Bu paket, tüm servislerde PostgreSQL persistence modunu aktive etmeyi ve ilk temel `smoke` test scriptlerini oluşturarak sistemin veri kalıcılığını ve temel çalışma doğruluğunu garanti altına almayı hedeflemelidir.

## 2. İncelenen Referans Dosyaları

| Dosya                                                      | Durum       | Kısa Not                                      |
| ---------------------------------------------------------- | ----------- | --------------------------------------------- |
| `planlama/SYSTEM_CLOSURES/S01-HAVUZ_KAYIT_DOSYASI.md`         | Bulunamadı  | -                                             |
| `planlama/SYSTEM_CLOSURES/S02-FENOMEN_MAGAZA_KAYIT_DOSYASI.md` | Bulunamadı  | -                                             |
| `planlama/SYSTEM_CLOSURES/S03-KULLANICI_MUSTERI_KAYIT_DOSYASI.md` | Bulunamadı  | `planlama/planlama` altında benzeri mevcut.   |
| `planlama/SYSTEM_CLOSURES/S04-PDP_KAYIT_DOSYASI.md`         | Bulunamadı  | `planlama/planlama` altında benzeri mevcut.   |
| `planlama/SYSTEM_CLOSURES/S05-STORY_KAYIT_DOSYASI.md`       | Bulunamadı  | `planlama/planlama` altında benzeri mevcut.   |
| `planlama/SYSTEM_CLOSURES/S06-VIDEO_KAYIT_DOSYASI.md`       | Bulunamadı  | `planlama/planlama` altında benzeri mevcut.   |
| `planlama/60-KODLAMAYA HAZIRLIK YOL HARİTASI.md`           | Bulundu     | Yol haritası mevcut.                          |
| `planlama/61-FULL_CAPACITY_CODING_ROADMAP.md`              | Bulundu     | Yol haritası mevcut.                          |
| `planlama/62-MASTER_IMPLEMENTATION_PLAN.md`                | Bulundu     | Ana plan mevcut.                              |
| `planlama/63-IMPLEMENTATION_PROGRESS_MASTER.md`            | Bulundu     | İlerleme raporu mevcut.                       |
| `planlama/64-PACKAGE_EXECUTION_LOG.md`                     | Bulundu     | Paket logları mevcut.                         |
| `planlama/65-ACTIVE_RISKS_AND_DECISIONS.md`                | Bulundu     | Risk ve kararlar dosyası mevcut.              |
| `planlama/63A-IMPLEMENTATION_PROGRESS_ARCHIVE_P01_P41.md`    | Bulunamadı  | -                                             |
| `planlama/64A-PACKAGE_EXECUTION_ARCHIVE_P01_P41.md`          | Bulunamadı  | -                                             |
| `planlama/65A-RISKS_AND_DECISIONS_ARCHIVE_P01_P41.md`        | Bulunamadı  | -                                             |
| Ana sistem dosyaları (`planlama/1-havuz sistemi.md` vb.)   | Çoğu Bulundu | Sistemlerin tasarım dokümanları genel olarak mevcut. |

## 3. İncelenen Repo Alanları
- **root/workspace:** `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json` incelendi.
- **contracts:** `packages/contracts/src` altındaki tüm kontrat dosyaları incelendi. `video.ts` kontratı bulunamadı.
- **services:** `services` altındaki tüm servislerin `index.ts` ve/veya ana kaynak kodları incelendi. `catalog`, `ugc`, `post`, `review`, `question-answer` servislerinin kaynak kodları bulunamadı.
- **BFF:** `apps/bff/src/server/index.ts` dosyası ve altındaki tüm route handler'lar incelendi.
- **web:** `apps/web/src/bootstrap` altındaki dosyalar incelendi.
- **panel:** `apps/panel/src/bootstrap` altındaki dosyalar incelendi. Çoğu talep edilen smoke test dosyası bulunamadı.
- **infra:** `infra/migrations` altındaki SQL dosyaları listelendi.

## 4. System Foundation Matrix

| Sistem                | Contract | Service  | BFF Route | Web bootstrap | Panel bootstrap | Smoke/test | Storage                                | Boundary Durumu | Hardening İhtiyacı                                 |
| --------------------- | -------- | -------- | --------- | ------------- | --------------- | ---------- | -------------------------------------- | --------------- | -------------------------------------------------- |
| S01 Havuz             | Var      | Var      | Var       | Yok           | Yok             | Yok        | In-Memory (Postgres mevcut)            | İyi             | Persistence aktivasyonu, Test                      |
| S02 Fenomen Mağaza    | Var      | Var      | Var       | Var           | Yok             | Yok        | In-Memory (Postgres mevcut)            | İyi             | Persistence aktivasyonu, Test                      |
| S03 Kullanıcı / Müşteri | Var      | Var      | Var       | Var (`auth`)  | Var             | Yok        | In-Memory (Postgres mevcut)            | İyi             | Persistence aktivasyonu, Test                      |
| S04 PDP               | Var      | Yok      | Var       | Var           | Yok             | Yok        | Yok (Servis katmanı eksik)             | Zayıf           | Service katmanı oluşturma, Persistence, Test       |
| S05 Story             | Var      | Var      | Var       | Var           | Yok             | Yok        | In-Memory (Simülasyon)                 | Orta            | Gerçek veri modeline geçiş, Persistence, Test    |
| S06 Video             | **Yok**  | **Yok**  | **Yok**   | **Yok**       | **Yok**         | Yok        | Yok (Sistem temeli eksik)              | Çok Zayıf       | Sıfırdan başlanmalı (Contract, Service, vb.)       |

## 5. Persistence Baseline

| Service            | Mevcut Storage Modeli      | Repository Pattern | Postgres Desteği | Migration/ORM Dosyası | Öncelik | Notlar                                                    |
| ------------------ | -------------------------- | ------------------ | ---------------- | --------------------- | ------- | --------------------------------------------------------- |
| `pool`             | In-Memory (varsayılan)     | Evet               | Var              | Evet                  | Yüksek  | -                                                         |
| `storefront`       | In-Memory (varsayılan)     | Evet               | Var              | Evet                  | Yüksek  | -                                                         |
| `customer`         | In-Memory (varsayılan)     | Evet               | Var              | Evet                  | Yüksek  | -                                                         |
| `cart`/`commerce`  | In-Memory (varsayılan)     | Evet               | Var              | Evet                  | Kritik  | `checkout` da bu servis içinde.                           |
| `pricing`          | In-Memory (simülasyon)     | Hayır              | Hayır            | Hayır                 | Kritik  | Gerçek bir repository pattern yok.                        |
| `stock`            | In-Memory (simülasyon)     | Hayır              | Hayır            | Hayır                 | Kritik  | Gerçek bir repository pattern yok.                        |
| `order`            | In-Memory (varsayılan)     | Evet               | Var              | Evet                  | Kritik  | -                                                         |
| `shipment`         | In-Memory (varsayılan)     | Evet               | Var              | Evet                  | Kritik  | -                                                         |
| `media`            | In-Memory (simülasyon)     | Evet               | Var              | Evet                  | Yüksek  | `review` ve `qa` bu servis altında.                       |
| `moderation`       | In-Memory (varsayılan)     | Evet               | Var              | Evet                  | Orta    | -                                                         |
| `interaction`      | In-Memory (varsayılan)     | Evet               | Var              | Evet                  | Orta    | -                                                         |
| `story`            | In-Memory (simülasyon)     | Evet               | Var              | Evet                  | Yüksek  | `store-story` de burada. Veri modeli projeksiyon.         |
| `ugc` / `post`     | Servis Kodu Yok            | -                  | -                | -                     | Düşük   | Kontrat var, servis implementasyonu yok.                  |
| `follow`           | In-Memory (varsayılan)     | Evet               | Var              | Evet                  | Orta    | -                                                         |
| `search`           | In-Memory (varsayılan)     | Evet               | Var (OpenSearch) | Hayır                 | Yüksek  | OpenSearch client kodu var, migration dosyası yok.        |
| `category`         | In-Memory (simülasyon)     | Evet               | Var              | Evet                  | Orta    | -                                                         |

## 6. Owner Boundary Baseline

| Alan                                      | Dosya                                   | Gözlem                                                                                                  | Risk Seviyesi | Önerilen Hardening Hattı         |
| ----------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------- | -------------------------------- |
| BFF truth üretimi                         | `apps/bff/src/server/*.ts`              | BFF, servis katmanlarına delegasyon yapıyor, doğrudan truth üretmiyor. Bu iyi bir desen.                    | DÜŞÜK         | Acceptance testleri ile doğrulama |
| UI truth üretimi                          | `apps/web/src/bootstrap/*.ts`           | Bootstrap dosyaları simülasyon ve render odaklı. UI'ın truth ürettiğine dair bir kanıt yok.            | DÜŞÜK         | Acceptance testleri ile doğrulama |
| `pricing`/`stock` başka servis içinde     | `services/checkout/src/checkout.ts` vb. | `checkout` gibi servisler `pricing` ve `stock` servislerinden veri okuyor, hesaplamayı kendi yapmıyor. | DÜŞÜK         | Entegrasyon testleri             |
| `cart`/`order`/`payment` ayrımı           | `services/*/src/*.ts`                   | Servisler ve kontratlar bu ayrımı net bir şekilde koruyor. `Order` yaratımı `payment` sonucuna bağlı.    | DÜŞÜK         | Entegrasyon testleri             |
| `moderation`/`risk` target truth mutate   | `services/moderation/src/moderation.ts` | Kontratlarda `targetTruthMutated: false` bayrağı var. Bu, boundary koruma niyetini gösteriyor.          | DÜŞÜK         | Entegrasyon testleri             |

Genel olarak, kod seviyesinde Owner Boundary kurallarına büyük ölçüde sadık kalındığı görülmektedir. En büyük risk, bu sınırların testlerle garanti altına alınmamış olmasıdır.

## 7. BFF Route Baseline

`apps/bff/src/server/index.ts` dosyası incelendiğinde, neredeyse istenen tüm sistemler için route gruplarının oluşturulduğu görülmektedir.

| Route Grubu           | Paths Örnekleri                     | Owner Service (Tahmini)      | Validation | Delegation | Hata Yanıtı         | Risk                                  |
| --------------------- | ----------------------------------- | ---------------------------- | ---------- | ---------- | ------------------- | ------------------------------------- |
| `/catalog/pdp/:id`    | GET                                 | `catalog` (Eksik)            | Var        | Evet       | Standart (P50)      | Servis katmanı eksik.                 |
| `/cart`               | GET, POST, PATCH, DELETE            | `commerce`                   | Var        | Evet       | Standart (P50)      | Test eksikliği.                       |
| `/checkout`           | POST /start                         | `commerce`                   | Var        | Evet       | Standart (P50)      | Test eksikliği.                       |
| `/order`              | GET /:id, POST /create...           | `order`                      | Var        | Evet       | Standart (P50)      | Test eksikliği.                       |
| `/payment`            | POST /initiate, POST /simulate...   | `payment`                    | Var        | Evet       | Standart (P50)      | Gerçek provider entegrasyonu yok.     |
| `/story`              | GET /tray, GET /viewer              | `story`                      | Var        | Evet       | Standart (P50)      | Simülasyon verisi kullanıyor.         |
| `/moderation`         | POST /case/create, POST /case/review | `moderation`                 | Var        | Evet       | Standart (P50)      | Test eksikliği.                       |
| `/risk`               | POST /case/create, POST /case/review | `risk`                       | Var        | Evet       | Standart (P50)      | Test eksikliği.                       |
| Diğerleri...          | (Benzer yapıda)                     | (İlgili servis)              | Var        | Evet       | Standart (P50)      | Genel test eksikliği.                 |

**Genel Gözlem:** BFF katmanı, gelen istekleri doğrulayıp ilgili servis katmanına delege etme görevini doğru bir şekilde üstlenmiş görünmektedir. P49 ve P50 paketleri ile hata ve yanıt yapısı standartlaştırılmıştır. BFF içinde iş kuralı bulunmamaktadır. En büyük risk, bu akışların entegrasyon ve acceptance testlerinin olmamasıdır.

## 8. Smoke / Bootstrap / Runtime Baseline

**Ana Bulgular:**
- `package.json` dosyasında `smoke` ile başlayan **hiçbir script bulunamamıştır**.
- Bu nedenle, talep edilen `story/store-story smoke`, `media smoke`, `PDP smoke` vb. komutların hiçbiri çalıştırılamamıştır.
- `apps/web/src/bootstrap` ve `apps/panel/src/bootstrap` altında bazı `*.ts` dosyaları bulunmuştur. Bunlar, standartlaştırılmış testler değil, belirli özellikleri simüle eden veya başlatan dosyalardır.

| Bootstrap/Smoke Dosyası         | Domain                | BFF Gerekli mi? | Standalone mı? | Script Var mı? | Sonuç / Sorun                                   |
| ------------------------------- | --------------------- | --------------- | -------------- | -------------- | ----------------------------------------------- |
| `apps/web/src/bootstrap/pdp.ts`   | PDP                   | Hayır (simüle ediyor) | Evet           | Hayır          | Sadece PDP'nin farklı durumlarını render etmeyi simüle eder. |
| `apps/web/src/bootstrap/story.ts` | Story                 | Evet            | Hayır          | Hayır          | BFF'e istek atarak story akışını simüle eder.    |
| `.../customer-contribution...`    | Customer Contribution | Evet            | Hayır          | Hayır          | BFF'e istek atarak yetki kontrolü simüle eder. |
| Diğer `bootstrap` dosyaları     | Çeşitli               | Değişiyor       | Değişiyor      | Hayır          | Standart bir yapıları yok, hepsi simülasyon amaçlı. |

## 9. Media Readiness Baseline
- **Mevcut Durum:** `packages/contracts/src/media.ts` içinde çok detaylı bir medya varlık modeli (`MediaAssetRecord`) tanımlanmıştır. Image/video, owner type, status, moderation, processing gibi ayrımlar mevcuttur. `services/media` altında kod temeli bulunmaktadır.
- **Eksikler:** Servis büyük ölçüde simülasyon (`simulationOnly: true`) ve iskelet halindedir. Gerçek upload intake, validation, processing (transcode), thumbnail üretimi ve CDN/storage entegrasyonu bulunmamaktadır.
- **HARDENING-04 Önerileri:**
  1. Gerçek bir object storage (örn. S3-uyumlu) entegrasyonu için altyapı oluşturulmalı.
  2. `services/media` içindeki upload, process fonksiyonları bu storage servisine bağlanmalı.
  3. Temel bir imaj işleme (thumbnail, optimizasyon) kütüphanesi entegre edilmeli.
  4. Video işleme (transcoding) için bir servis (örn. MediaConvert, veya FFMPEG tabanlı bir worker) entegrasyonu planlanmalı.
  5. `simulationOnly` bayrakları kaldırılarak ilk E2E upload testi yazılmalı.

## 10. Moderation / Risk Baseline
- **Mevcut Durum:** Her iki sistem için de detaylı kontratlar (`moderation.ts`, `risk.ts`) ve servis iskeletleri (`services/moderation`, `services/risk`) mevcuttur. `infra/migrations` altında her ikisi için de veritabanı şemaları bulunmaktadır. Repository pattern uygulanmıştır.
- **Eksikler:** Gerçek kural motorları (rule engines) ve panel/admin entegrasyonları zayıftır. Sistemler şu anda büyük ölçüde manuel API çağrıları ile tetiklenmektedir. Sistemler arası entegrasyon (örn. bir siparişin otomatik risk case açması) kodda mevcut değildir.
- **HARDENING-06 Önerileri:**
  1. `services/risk` için temel bir kural motoru altyapısı kurulmalı (örn. "yüksek tutarlı ilk sipariş" gibi basit bir kuralla).
  2. `services/order` ve `services/payment` servislerinden `services/risk`'e olay bazlı (event-driven) sinyal gönderimi için ilk entegrasyon yapılmalı.
  3. `apps/panel` içinde moderasyon ve risk "case"lerini listeleyen ve temel aksiyonların (onayla, reddet) alınabildiği bir arayüz oluşturulmalı.
  4. Moderasyonun `UGC`, `review`, `Q&A` gibi hedefleri otomatik olarak case oluşturacak şekilde entegre edilmeli.

## 11. Search / Category / PLP / Discover Baseline
- **Mevcut Durum:** `search.ts` ve `category.ts` kontratları mevcuttur. `services/search` içinde OpenSearch client bağlantı kodu bulunmaktadır, ancak varsayılan olarak in-memory çalışmaktadır. Kategori servisi büyük ölçüde statik veri döndürmektedir.
- **Eksikler:** Gerçek bir OpenSearch indexing hattı yoktur. Ürünler, kategoriler veya mağazalar güncellendiğinde arama indeksini besleyen bir mekanizma bulunmamaktadır. Facet/filter state'i kontrat seviyesinde tanımlı ama servis implementasyonu zayıftır.
- **HARDENING-07 Önerileri:**
  1. OpenSearch için bir `docker-compose` servisi eklenerek lokal geliştirme ortamı standartlaştırılmalı.
  2. `services/pool` ve `services/storefront` güncellemelerinden sonra `services/search`'e bildirim gönderen basit bir event-driven akış oluşturulmalı.
  3. `services/search` içinde bu event'leri dinleyip OpenSearch'e indexing yapan bir "indexer" fonksiyonu yazılmalı.
  4. PLP BFF endpoint'i, `services/search`'ten facet/filter verisi alacak şekilde güncellenmeli.

## 12. Analytics / Notification Baseline
- **Mevcut Durum:** Her iki sistem de (`analytics.ts`, `notification.ts`) detaylı kontratlara, `postgres` destekli repository pattern'e ve veritabanı migration dosyalarına sahiptir. Temelleri oldukça sağlamdır.
- **Eksikler:** Gerçek provider entegrasyonları (email, push, SMS) yoktur ve `sandbox`/`parked` olarak işaretlenmiştir. Analytics tarafında ise event toplama (`ingestion`) altyapısı mevcutken, bu veriyi işleyip anlamlı metrikler üreten ve görselleştiren bir katman (örn. dashboard'lar) yoktur.
- **HARDENING-08 Önerileri:**
  1. `services/notification` için bir email provider (örn. Mailgun, SendGrid sandbox) entegrasyonu yapılmalı ve ilk transactional email (örn. sipariş onayı) gönderimi test edilmeli.
  2. Temel bir "outbox pattern" worker'ı oluşturularak `event_outbox` tablosundaki olayların `services/analytics`'e iletilmesi sağlanmalı.
  3. `services/analytics` içinde `order.created` gibi temel bir olayı işleyip "günlük sipariş sayısı" gibi bir metriği güncelleyen basit bir snapshot mekanizması kurulmalı.

## 13. Auth / Session / Permission Baseline
- **Mevcut Durum:** `auth.ts` kontratı çok temel seviyededir. `services/auth` servisi neredeyse boştur. Yetkilendirme mantığı büyük ölçüde BFF katmanında header simülasyonu (`resolveContext`) ile yapılmaktadır. Guest/customer ayrımı kodda mevcuttur.
- **Eksikler:** Gerçek bir auth/session yönetimi (örn. JWT, session store) yoktur. `permission/access` paketleri boştur. Kural/Yetki sistemi (`planlama/25-kural -yetki sistemi.md`) dokümanı çok detaylı olmasına rağmen koda yansımamıştır.
- **HARDENING-02 Önerileri:**
  1. Gerçek bir authentication stratejisi seçilmeli (örn. JWT).
  2. `services/auth` içinde `login`, `logout`, `verifyToken` gibi temel fonksiyonlar implemente edilmeli.
  3. BFF'teki `resolveContext` fonksiyonu, gelen token'ı `services/auth` ile doğrulayacak şekilde güncellenmeli.
  4. Temel bir rol ayrımı (örn. `CUSTOMER` vs `ADMIN`) token içine eklenmeli ve BFF'teki `checkAccess` fonksiyonu bu role'leri kontrol etmelidir.

## 14. CI / Build / Workspace Baseline
- **Typecheck/Build Sonucu:** `pnpm run typecheck` ve `pnpm run build` komutları **başarıyla** tamamlanmıştır. Bu, kod tabanının statik analiz ve derleme açısından sağlıklı olduğunu gösteren çok olumlu bir işarettir.
- **Workspace Sorunları:** `pnpm-workspace.yaml` ve `tsconfig.base.json` dosyaları düzgün yapılandırılmıştır. Servisler arası bağımlılıklar ve path alias'ları çalışmaktadır. Belirgin bir workspace sorunu tespit edilmemiştir.
- **ESM/Runtime Sorunları:** `tsconfig.base.json` içinde `module: "commonjs"` ayarı kullanıldığı için şu anki yapıda belirgin bir ESM sorunu yaşanmamaktadır.
- **HARDENING-09/10 Önerileri:**
  1. Temel bir CI pipeline (örn. GitHub Actions) dosyası eklenerek `pnpm install`, `pnpm run typecheck` ve `pnpm run build` adımları otomatikleştirilmeli.
  2. Projeye `eslint` ve `prettier` eklenerek kod formatlama ve linting kuralları standartlaştırılmalı ve CI'a eklenmeli.
  3. `package.json` script'leri standardize edilmeli. Her servis ve app için `test`, `lint`, `format` gibi ortak script'ler eklenmeli.

## 15. Cross-System Gap List

| Gap (Eksiklik)                       | Etkilenen Sistemler              | Neden Önemli                                                              | Hardening Hattı         | Öncelik |
| ------------------------------------ | -------------------------------- | ------------------------------------------------------------------------- | ----------------------- | ------- |
| **Veri Kalıcılığı Eksikliği**          | Tüm Servisler                    | Uygulama yeniden başlatıldığında tüm veriler kaybolur. Gerçek kullanım imkansızdır. | Persistence & Test      | Kritik  |
| **Otomatik Test Altyapısı Yok**        | Tüm Sistem                       | Değişikliklerin sistemi bozup bozmadığı manuel olarak anlaşılamaz. Güvenilirlik düşüktür. | Persistence & Test      | Kritik  |
| **Video Sistemi Temeli Eksik**         | Video, Story, Keşfet, PDP        | Platformun ana sosyal-ticaret vaatlerinden biri eksik kalmaktadır.        | Media Readiness         | Yüksek  |
| **Gerçek Kimlik Doğrulama Yok**        | Tüm Sistem                       | Güvenlik yoktur, kullanıcı ve yetki ayrımı simülasyondur.                | Auth & Session          | Yüksek  |
| **Dış Servis Entegrasyonları Yok**     | Payment, Shipment, Notification  | Para alınamaz, kargo gönderilemez, bildirim yapılamaz.                    | Provider Integration    | Yüksek  |
| **Arama İndeksleme Hattı Yok**         | Search, Pool, Storefront         | Yeni ürünler veya mağazalar arama sonuçlarında görünmez.                   | Search & Indexing       | Orta    |

## 16. Önerilen Hardening Paket Sırası

1.  **HARDENING-01 — Persistence & Test Foundation:**
    - **Amaç:** Tüm servislerde PostgreSQL'i aktive etmek ve ilk `smoke` testlerini yazmak.
    - **Neden Bu Sırada?:** Veri kalıcılığı ve temel testler olmadan diğer hiçbir hardening adımı güvenilir bir şekilde yapılamaz.

2.  **HARDENING-02 — Auth & Session Hardening:**
    - **Amaç:** Gerçek JWT tabanlı kimlik doğrulama ve temel rol ayrımını (customer/admin) implemente etmek.
    - **Neden Bu Sırada?:** Güvenli ve yetkilendirilmiş API'ler, diğer tüm özelliklerin ön koşuludur.

3.  **HARDENING-03 — Core Commerce Journey Acceptance:**
    - **Amaç:** Sepet -> Checkout -> Ödeme (simüle) -> Sipariş akışı için ilk entegrasyon ve acceptance testlerini yazmak.
    - **Neden Bu Sırada?:** Platformun ana para kazanma akışının temelini doğrulamak için kritik öneme sahiptir.

4.  **HARDENING-04 — Media Readiness:**
    - **Amaç:** Gerçek bir object storage entegrasyonu yapmak ve temel imaj yükleme/işleme hattını kurmak.
    - **Neden Bu Sırada?:** Story, Post, PDP gibi sosyal-ticaret özelliklerinin temel taşıdır.

5.  **HARDENING-05 — Video Foundation:**
    - **Amaç:** `video.ts` kontratını, servisini ve temel video işleme (transcode) altyapısını sıfırdan oluşturmak.
    - **Neden Bu Sırada?:** Media altyapısı kurulduktan sonra, eksik olan en büyük sosyal-ticaret bileşenini eklemek mantıklıdır.

6.  **HARDENING-06 — Moderation & Risk Workflow:**
    - **Amaç:** Panel için temel case yönetim arayüzü oluşturmak ve sistemleri olay-bazlı tetikleyicilerle bağlamak.
    - **Neden Bu Sırada?:** Sosyal içerik (Media/Video) artmaya başladığında, denetim mekanizmaları da işlemeye başlamalıdır.

7.  **HARDENING-07 — Search & Indexing Pipeline:**
    - **Amaç:** OpenSearch'e ürün ve mağaza güncellemelerini otomatik indexleyen bir hat kurmak.
    - **Neden Bu Sırada?:** Ürün sayısı arttıkça keşfedilebilirlik hayati hale gelir.

8.  **HARDENING-08 — Provider Integration (Notification & Payment):**
    - **Amaç:** Gerçek bir email ve payment provider sandbox entegrasyonu yapmak.
    - **Neden Bu Sırada?:** Temel ticari akış test edildikten sonra, dış dünya ile entegrasyon test edilmelidir.

9.  **HARDENING-09 — CI/CD Foundation:**
    - **Amaç:** Temel bir CI/CD pipeline kurarak test, build ve linting süreçlerini otomatikleştirmek.
    - **Neden Bu Sırada?:** Geliştirme hızı ve kalitesini artırmak için otomasyon şarttır.

10. **HARDENING-10 — Workspace Quality:**
    - **Amaç:** Kod formatlama (Prettier), linting (ESLint) ve standartlaştırılmış `package.json` script'leri eklemek.
    - **Neden Bu Sırada?:** Proje büyüdükçe kod kalitesini ve tutarlılığını korumak için gereklidir.

## 17. İlk Paket İçin Öneri

- **Paket Adı:** `HARDENING-01 — Persistence & Test Foundation`
- **Kapsam:**
  1.  Tüm servislerdeki (`services/*`) repository katmanlarının varsayılan olarak `PostgreSQL` kullanacak şekilde ayarlanması. `PERSISTENCE_MODE` ortam değişkeni ile `postgres` modunun zorunlu kılınması.
  2.  Lokal geliştirme ortamı için `docker-compose.local.yml` dosyasına tüm servislerin PostgreSQL'e bağlanmasını sağlayacak environment değişkenlerinin eklenmesi.
  3.  Root `package.json` içine `smoke:all` adında yeni bir script eklenmesi.
  4.  `tests/smoke` adında yeni bir klasör oluşturulması.
  5.  Bu klasör içine, temel servislerin (örn. `customer`, `cart`, `order`) sağlık durumunu kontrol eden (health check) ve bir kayıt oluşturup okuyabilen (CRUD) basit birer test senaryosu eklenmesi. `smoke:all` script'inin bu testleri çalıştırması.
- **Kabul Kriterleri:**
  - Tüm servisler yeniden başlatıldığında `Postgres` modunda çalışmalıdır.
  - `pnpm run smoke:all` komutu başarıyla çalışmalı ve temel servislerin veritabanına bağlanıp işlem yapabildiğini doğrulamalıdır.
  - Bir smoke test sırasında oluşturulan veri, uygulama yeniden başlatıldıktan sonra bile okunabilir olmalıdır.
- **Riskler:**
  - Lokal PostgreSQL kurulumu veya Docker ortamı olmayan geliştiriciler için ek kurulum adımları gerektirecektir.
  - Bazı `in-memory` implementasyonlarındaki mantıkların `PostgreSQL` implementasyonlarına tam olarak taşınmamış olma riski.

## 18. Nötr Sonuç
Bu rapor yalnız baseline review raporudur. Kod değişikliği yapılmamıştır. Hardening paketleri ayrıca açılmalıdır.