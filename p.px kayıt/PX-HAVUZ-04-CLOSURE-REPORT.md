# PX-HAVUZ-04 — Supplier Intake + Admin Review Surface Hardening Kapanış Raporu

## Değişen Dosyalar
- `packages/contracts/src/pool.ts`
- `apps/bff/src/server/pool.ts`
- `apps/bff/src/server/index.ts`
- `services/pool/src/pool.ts`
- `apps/panel/src/bootstrap/pool.ts`
- `services/pool/package.json`
- `apps/panel/package.json`
- `apps/panel/tsconfig.json`
- `package.json`

## Eklenen/Güncellenen Route Listesi

### Supplier Routes (`/pool/supplier`)
- `POST /products/draft`: Yeni bir ürün taslağı oluşturur.
- `PATCH /products/:submittedProductId`: Mevcut bir ürün taslağını günceller.
- `POST /products/:submittedProductId/submit`: Bir ürünü incelemeye gönderir.
- `POST /products/:submittedProductId/submit-revision`: Revizyon istenen bir ürünü yeniden incelemeye gönderir.
- `GET /products/:submittedProductId`: Belirli bir tedarikçi ürününü getirir.
- `GET /products`: Tedarikçinin tüm ürünlerini listeler.

### Admin Routes (`/pool/admin`)
- `GET /products`: Tüm tedarikçi ürünlerini listeler.
- `GET /products/:submittedProductId`: Belirli bir tedarikçi ürününü getirir.
- `POST /products/:submittedProductId/start-review`: Ürün inceleme sürecini başlatır.
- `POST /products/:submittedProductId/request-revision`: Ürün için revizyon talep eder.
- `POST /products/:submittedProductId/approve`: Ürünü onaylar.
- `POST /products/:submittedProductId/reject`: Ürünü reddeder.
- `POST /products/:submittedProductId/suspend`: Ürünü askıya alır.
- `POST /products/:submittedProductId/commercialize`: Onaylanmış bir ürünü ticarileştirir.
- `GET /commercial-products`: Ticarileştirilmiş tüm ürünleri listeler.
- `GET /commercial-products/:commercialPoolProductId`: Belirli bir ticarileştirilmiş ürünü getirir.
- `POST /commercial-products/:commercialPoolProductId/bind`: Ürünün ticari havuzdaki verilerini bağlar (fiyat, stok vb.).
- `GET /commercial-products/:commercialPoolProductId/binding`: Ürünün bağlanma durumunu getirir.
- `POST /commercial-products/:commercialPoolProductId/activate`: Ticarileştirilmiş bir ürünü aktive eder.
- `POST /commercial-products/:commercialPoolProductId/suspend`: Ticarileştirilmiş bir ürünü askıya alır.
- `POST /commercial-products/:commercialPoolProductId/archive`: Ticarileştirilmiş bir ürünü arşivler.

## Guard/Validation Değişiklikleri

### BFF (`apps/bff/src/server/index.ts`)
- **Actor Context Zorunluluğu**: Tüm `/pool` route'ları `x-actor-id` ve `x-actor-type` header'larını gerektirir. Eksikse `400 Bad Request` döner.
- **Rol Yetkilendirmesi**: 
  - `/pool/supplier/*` yolları sadece `SUPPLIER` rolüyle erişilebilir.
  - `/pool/admin/*` yolları sadece `ADMIN` veya `OPERATOR` rolleriyle erişilebilir.
  - Yetkisiz erişim denemeleri `403 Forbidden` döner.

### Service (`services/pool/src/pool.ts`)
- **Supplier Sahiplik Kontrolü**: Tedarikçiler sadece kendi `supplierId`'lerine sahip ürünler üzerinde değişiklik yapabilir (`create`, `update`, `submit`). Aksi takdirde `POOL_SUPPLIER_SCOPE_MISMATCH` hatası alınır.
- **Admin/Operator Zorunluluğu**: İnceleme, onay, ret, ticarileştirme gibi tüm admin aksiyonları `ADMIN` veya `OPERATOR` rolü gerektirir.
- **Durum Geçiş Kontrolleri (State Machine)**: Bir ürünün mevcut durumuna göre geçersiz bir aksiyon denenirse (`örn. onaylanmış bir ürünü tekrar onaya göndermek`) `POOL_INVALID_TRANSITION` hatası alınır.
- **Submit Validasyonu**: Bir ürün incelemeye gönderilirken (`submit`/`submit-revision`) aşağıdaki alanların dolu olması zorunludur:
  - `productName` (title)
  - `supplierSuggestedCategoryId` (categoryId)
  - En az bir `variant`
  - Varyantlar için `basePrice` ve `stockInput`
- **Revizyon Talebi Validasyonu**: Revizyon talep edilirken (`requestRevision`) `requiredChanges` listesi boş olamaz.
- **Gerekçe Zorunluluğu**: `suspend` ve `reject` gibi aksiyonlarda gerekçe/not alanları zorunludur.
- **Mevcut Guard'lar Korundu**:
  - Bir ürünün birden fazla kez ticarileştirilmesini engelleyen `POOL_DUPLICATE_COMMERCIALIZE` guard'ı korundu.
  - Bir ürünün tüm bağlamaları (`binding`) tamamlanmadan aktive edilmesini engelleyen `POOL_BINDING_INCOMPLETE` guard'ı korundu.

## Command Outputs

### `pnpm run typecheck`
```
> hx-monorepo@1.0.0 typecheck C:\gelistirme\HX
> pnpm -r typecheck

Scope: 43 of 44 workspace projects
...
apps/bff typecheck: Done
```
**Sonuç: PASS**

### `pnpm run build`
```
> hx-monorepo@1.0.0 build C:\gelistirme\HX
> pnpm -r build

Scope: 43 of 44 workspace projects
...
apps/bff build: Done
```
**Sonuç: PASS**

## Smoke Çıktısı

Smoke testi, tanımlanan tüm senaryoları başarıyla geçmiştir. Çıktının tamamı `cmd-1777413059759.txt` artefaktında mevcuttur.

**Özet:**
- Tedarikçi taslak oluşturdu.
- Eksik veriyle gönderim denemesi `POOL_VALIDATION_FAILED` ile başarısız oldu.
- Veriler tamamlanıp gönderim başarılı oldu.
- Tedarikçinin onay denemesi `POOL_FORBIDDEN` ile engellendi.
- Admin incelemeyi başlattı.
- Gerekçesiz revizyon talebi `POOL_VALIDATION_FAILED` ile başarısız oldu.
- Gerekçeli revizyon talebi başarılı oldu.
- Tedarikçi revizyonu gönderdi.
- Admin onayladı ve ürünü ticarileştirdi.
- Tekrar ticarileştirme denemesi `POOL_DUPLICATE_COMMERCIALIZE` ile engellendi.
- Binding ve Aktivasyon adımları başarıyla tamamlandı.

**Sonuç: PASS**

## Boundary Review

- **BFF vs Service**: BFF katmanı kesinlikle iş mantığı içermemektedir. Gelen isteklerden aktör bilgilerini ve gövdeyi (body) ayrıştırıp, ilgili servis metoduna delege etmektedir. Tüm yetkilendirme, validasyon ve iş mantığı `services/pool` içerisinde yer almaktadır.
- **Truth of Source**: Fiyat, stok, kategori ve medya gibi konuların ana kaynağının `pool` servisi olmadığı kuralına uyulmuştur. Bu veriler `commercialization` snapshot'ı içinde saklanmakta ve `binding` adımıyla dış sistemlerle senkronizasyonun simülasyonu yapılmaktadır.
- **Error Handling**: `PoolResult` ve `PoolErrorCode` kullanımı ile servis ve BFF arasında standart bir hata iletişim protokolü oluşturulmuştur.

## Kapsam Dışı Bırakılanlar

- Yeni bir domain feature eklenmedi.
- Ticari havuz (commercial pool) ve bağlama (binding) davranışları mevcut kapsamın dışına genişletilmedi.
- Creator selection, storefront binding, story/video upload, checkout/order/search/finance gibi entegrasyonlar yapılmadı.

## Açık Teknik Borçlar

- **In-Memory Store**: Tüm veriler (`submittedProduct`, `commercialProduct`, `bindingSnapshot`) bellekte tutulmaktadır. Kalıcı bir veritabanı entegrasyonu (örn. `packages/persistence` kullanarak) gereklidir.
- **Mocked Actor Context**: BFF katmanı, actor context'i `x-` header'larından okumaktadır. Gerçek bir sistemde bu bilgiler bir kimlik doğrulama (authentication) servisinden veya bir API Gateway'den alınmalıdır.
- **Detaylı Validasyon**: Ürün gönderim validasyonu şu an temel seviyededir. SKU, barkod formatı, metin uzunlukları, fiyat/stok değer aralıkları gibi daha detaylı kurallar eklenebilir.
- **Hardcoded Roller**: "ADMIN", "OPERATOR", "SUPPLIER" gibi roller hardcoded olarak kontrol edilmektedir. Bu, daha dinamik bir yetkilendirme sistemi (örneğin RBAC - Role-Based Access Control) ile değiştirilebilir.

## Karar

**PASS**

Tüm acceptance kriterleri karşılanmış, kodlama, build, typecheck ve smoke test adımları başarıyla tamamlanmıştır. Projenin ana hedefleri olan Supplier ve Admin rollerinin ayrıştırılması, yetkilendirme ve validasyon kurallarının sıkılaştırılması (surface hardening) gerçekleştirilmiştir.
