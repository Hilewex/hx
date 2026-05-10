# HARDENING-10A3: Provider Callback Persistence Migration — Closure Report

## Paket Adı

HARDENING-10A3 — Provider Callback Persistence / Migration Only

## Amaç

Bu paketin amacı, `HARDENING-10A1` ve `HARDENING-10A2` ile eklenen provider callback sözleşme ve imza altyapısını bozmadan, yalnızca provider callback kayıtları için bir persistence ve migration temeli eklemektir. Bu çalışma, gelecekteki callback işleme, kriptografik doğrulama ve mutabakat özelliklerine zemin hazırlamaktadır.

## Değişen Dosyalar

- `packages/persistence/src/provider-callback.ts`: Yeni dosya. Provider callback olayları için `ProviderCallbackEventRepository` arayüzünü, in-memory ve PostgreSQL implementasyonlarını içerir.
- `packages/persistence/src/index.ts`: `provider-callback.ts` dosyasından yapılan export'ları ana `index.ts` dosyasına dahil etmek için güncellendi.
- `infra/migrations/20260504_001_provider_callback_persistence.sql`: Yeni dosya. `provider_callback_events` tablosunu ve ilgili index'leri oluşturan SQL migration betiği.

## Eklenen Migration

- `infra/migrations/20260504_001_provider_callback_persistence.sql`

Bu migration, `provider_callback_events` adında yeni bir tablo oluşturur. Tablo, provider'lardan gelen callback'lerin ham ve normalize edilmiş verilerini, işleme durumunu, imza doğrulama sonucunu ve diğer meta verileri depolamak için tasarlanmıştır. `provider_event_id` ve `idempotency_key` üzerinde `UNIQUE PARTIAL INDEX`'ler eklenerek veri bütünlüğü ve tekrar eden olayların yönetimi hedeflenmiştir.

## Eklenen Repository API

`packages/persistence/src/provider-callback.ts` içinde aşağıdaki API'ler eklenmiştir:

- **`ProviderCallbackEventRepository` (Arayüz):**
  - `insertProviderCallbackEvent(record)`: Yeni bir callback kaydı ekler.
  - `getProviderCallbackEventById(id)`: ID ile bir callback kaydını getirir.
  - `findProviderCallbackEventByProviderEventId(...)`: Provider tarafından verilen olay ID'si ile bir kayıt bulur.
  - `findProviderCallbackEventByIdempotencyKey(...)`: Idempotency anahtarı ile bir kayıt bulur.
  - `markProviderCallbackEventProcessed(id, ...)`: Bir kaydın işlenme durumunu günceller.
  - `listProviderCallbackEventsByProcessingStatus(status, ...)`: Belirli bir işleme durumundaki kayıtları listeler.

- **Implementasyonlar:**
  - `InMemoryProviderCallbackEventRepository`: Test ve geliştirme ortamları için in-memory implementasyon.
  - `PostgresProviderCallbackEventRepository`: PostgreSQL veritabanı için implementasyon.

- **Factory:**
  - `getProviderCallbackEventRepository()`: Ortam değişkenine (`PERSISTENCE_MODE`) göre uygun repository implementasyonunu döndüren bir fabrika fonksiyonu.

## Değişmeyen/Yasaklı Alanlar

Talimatlara uygun olarak aşağıdaki alanlarda hiçbir değişiklik yapılmamıştır:

- BFF route'ları veya Webhook/callback endpoint'leri eklenmedi.
- Domain servislerinde (Payment, Shipment, vb.) callback işleme mantığı eklenmedi.
- Worker, consumer veya reconciliation mekanizmaları oluşturulmadı.
- Gerçek kriptografik doğrulama veya provider secret yönetimi eklenmedi.
- `.env.example`, `tsconfig.base.json`, `package.json` gibi kök yapılandırma dosyaları değiştirilmedi.
- `pnpm install` komutu çalıştırılmadı.
- `HARDENING_PROGRESS_RECORD` dosyasına dokunulmadı.

## Boundary Sonucu

- **Contract Boundary:** `ProviderCallbackRecord` sözleşmesi bozulmadı. Yeni repository, bu sözleşme ile tam uyumlu çalışmaktadır.
- **Persistence Boundary:** Repository, iş mantığı içermez ve sadece veri erişim katmanı olarak görev yapar. Domain state'ini doğrudan mutate etmez.
- **Migration:** Migration dosyası, mevcut veritabanı şemasından bağımsız olup, sadece yeni bir tablo ekler. Idempotent olarak tasarlanmıştır.

## Çalıştırılan Komutlar ve Sonuçları

1.  **`pnpm --filter @hx/persistence run build`**: BAŞARILI. `packages/persistence` paketi hatasız derlendi.
2.  **`pnpm run typecheck`**: BAŞARILI. Tüm monorepo genelinde tip kontrolü hatasız tamamlandı.
3.  **`pnpm run build`**: BAŞARILI. Tüm projeler hatasız bir şekilde derlendi.
4.  **Migration Uygulaması**: BAŞARILI. `type .\infra\migrations\20260504_001_provider_callback_persistence.sql | docker compose -f .\infra\compose\docker-compose.local.yml exec -T postgres psql -U hx_local_user -d hx_local_db` komutu ile migration başarıyla uygulandı.

## Kalan Limitler

Bu paket, bilinçli olarak aşağıdaki limitlerle tamamlanmıştır:

- BFF callback/webhook endpoint'i yoktur; sistem dışarıdan callback kabul edemez.
- Domain callback işleme mantığı yoktur; gelen callback'ler herhangi bir iş etkisine neden olmaz.
- Gerçek kriptografik imza doğrulaması eklenmemiştir; `verification_status` alanı şu an için sadece bir yer tutucudur.
- Tekrar/kopya tespiti (`replay/duplicate detection`) sadece persistence katmanında, `UNIQUE INDEX`'ler aracılığıyla temel düzeyde sağlanmıştır. Domain seviyesinde bir işleme mantığı yoktur.
- Callback'ler için smoke suite testi eklenmemiştir.
- Canlı bir mutabakat (reconciliation) mekanizması yoktur.
- Provider'a özgü callback verilerini normalize edecek bir haritalama (mapping) katmanı yoktur.

## Nihai Karar

Tüm hedefler başarıyla tamamlanmış, zorunlu komutlar hatasız çalışmış ve migration uygulanmıştır. Belirtilen yasaklı alanlara dokunulmamıştır. Proje, belirtilen limitler dahilinde hedeflere ulaşmıştır.

**Karar: PASS WITH LIMITATION**
