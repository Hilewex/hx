# HARDENING-03B — Commerce Journey Persistence Kapanış Raporu

## 1. Amaç
Bu paketin amacı, `HARDENING-03` ile test edilen çekirdek ticaret yolculuğundaki (`Cart` → `Checkout` → `Payment` → `Order` → `Shipment`) kritik servislerden `Payment`, `Order` ve `Shipment`'ın `in-memory` olan veri depolama katmanlarını, PostgreSQL kullanarak kalıcı (persistent) hale getirmekti. Temel hedef, bu servislerin ürettiği kayıtların bir BFF yeniden başlatması (restart) sonrasında dahi korunabildiğini kanıtlamaktı.

## 2. Önceki Durum
- `HARDENING-03` paketi, çekirdek ticaret yolculuğunun tüm adımlarının (Cart, Checkout, Payment, Order, Shipment) fonksiyonel olarak ve entegre bir şekilde çalıştığını, uçtan uca bir acceptance testi ile kanıtlamıştı.
- Ancak, bu raporda `Payment`, `Order` ve `Shipment` servislerinin `in-memory` modda çalıştığı ve bu nedenle üretilen verilerin kalıcı olmadığı bir kısıtlama (limitation) olarak belirtilmişti. Bu paket, bu kısıtlamayı ortadan kaldırmak için açılmıştır.

## 3. İncelenen Dosyalar
| Dosya | Bulundu / Bulunamadı | Not |
|---|---|---|
| HARDENING-03-CLOSURE-REPORT.md | Bulundu | Önceki durum ve `in-memory` kısıtlaması teyit edildi. |
| services/payment/src/repository/* | Bulundu | Mevcut `in-memory` ve `postgres` repository'ler incelendi. |
| services/order/src/repository/* | Bulundu | Mevcut `in-memory` ve `postgres` repository'ler incelendi. |
| services/shipment/src/repository/* | Bulundu | Mevcut `in-memory` ve `postgres` repository'ler incelendi. |
| infra/migrations/* | Bulundu | İlgili tabloların (`payments`, `orders`, `shipments`) varlığı doğrulandı. |
| tests/smoke/suites/core-commerce.ts | Bulundu | Test, yeniden başlatma dayanıklılığını içerecek şekilde güncellendi. |

## 4. Persistence Inventory
| Service | Önceki Storage | Yeni Storage | Repository Interface | Postgres Adapter | Migration | Env Mode |
|---|---|---|---|---|---|---|
| Payment | In-Memory | **Postgres** | Var (`IPaymentRepository`) | Var (`PostgresPaymentRepository`)| Var | `PERSISTENCE_MODE` |
| Order | In-Memory | **Postgres** | Var (`IOrderRepository`) | Var (`PostgresOrderRepository`) | Var | `PERSISTENCE_MODE` |
| Shipment | In-Memory | **Postgres** | Var (`IShipmentRepository`)| Var (`PostgresShipmentRepository`)| Var | `PERSISTENCE_MODE` |

Tüm servislerin `PERSISTENCE_MODE=postgres` ortam değişkeni ile PostgreSQL moduna geçtiği doğrulandı.

## 5. Migration Sonucu
- Mevcut `20260425_003_payment_order_persistence.sql` ve `20260425_004_shipment_return_refund_persistence.sql` migration'ları incelendi.
- `shipments` tablosunda `timeline` verisini saklamak için bir kolon eksikliği tespit edildi.
- `infra/migrations/20260430_002_shipment_timeline.sql` adında yeni bir migration dosyası oluşturuldu ve `ALTER TABLE shipments ADD COLUMN timeline JSONB;` komutu ile bu eksiklik giderildi.
- Migration, `docker-compose exec` komutu ile başarıyla veritabanına uygulandı.

## 6. Payment Persistence Sonucu
- `initiate` ve `simulate success` adımları, `PostgresPaymentRepository` üzerinden çalışarak `payments` tablosuna kayıt attı.
- **Sonuç: PASS**. Ödeme durumunun kalıcı hale geldiği, siparişin bu kaydı okuyabilmesiyle dolaylı olarak kanıtlanmıştır. `getPayment` için bir BFF endpoint'i olmadığı için doğrudan okuma testi yapılamamıştır, bu durum bir kısıtlamadır.

## 7. Order Persistence Sonucu
- `createOrderFromPayment` fonksiyonu, başarılı ve kalıcı hale getirilmiş ödeme kaydını okuduktan sonra `PostgresOrderRepository` aracılığıyla `orders` ve `order_lines` tablolarına veriyi yazdı.
- Yeniden başlatma sonrasında, oluşturulan `orderId` ile `GET /order/:orderId` endpoint'i çağrıldı ve sipariş verisi başarıyla okundu.
- **Sonuç: PASS**.

## 8. Shipment Persistence Sonucu
- `createShipmentFromOrder` fonksiyonu, kalıcı sipariş kaydını okuyarak `PostgresShipmentRepository` aracılığıyla `shipments`, `shipment_packages` ve `shipment_lines` tablolarına kayıtları yazdı.
- Yeniden başlatma sonrasında, oluşturulan `shipmentId` ile `GET /shipment/:shipmentId` endpoint'i çağrıldı ve kargo verisi başarıyla okundu.
- **Sonuç: PASS**.

## 9. Core Commerce Smoke Durability
- `tests/smoke/suites/core-commerce.ts` testi iki fazlı çalışacak şekilde güncellendi.
- **Faz 1:** `pnpm run smoke:core-commerce:1` komutu ile çalıştırıldı. Test, tüm ticaret yolculuğunu tamamladı ve oluşturulan `orderId` ve `shipmentId`'yi `tests/smoke/durability-context.json` dosyasına kaydetti. **Sonuç: PASS**.
- **BFF Restart:** BFF manuel olarak yeniden başlatıldı.
- **Faz 2:** `pnpm run smoke:core-commerce:2` komutu ile çalıştırıldı. Test, `durability-context.json` dosyasından ID'leri okuyarak aynı kayıtları BFF üzerinden tekrar getirmeyi denedi.
- **Sonuç: PASS**. Tüm kayıtların yeniden başlatma sonrasında başarıyla okunduğu doğrulandı.

## 10. Owner Boundary Review
| Alan | Gözlem | Sonuç |
|---|---|---|
| `order` vs `payment` | `order` servisi, kalıcı hale getirilmiş `payment` kaydının state'ini PostgreSQL üzerinden okuyarak doğrulama yaptı. Boundary korundu. | **PASS** |
| `shipment` vs `order` | `shipment` servisi, kalıcı hale getirilmiş `order` kaydını PostgreSQL üzerinden okuyarak doğrulama yaptı. Boundary korundu. | **PASS** |

## 11. Yapılan Değişiklikler
| Dosya | Durum | Ne Değişti? | Neden Değişti? |
|---|---|---|---|
| `infra/migrations/20260430_002_shipment_timeline.sql` | Created | `shipments` tablosuna `timeline` kolonu eklendi. | `ShipmentResponse` kontratına uyum ve veri bütünlüğü. |
| `services/shipment/src/repository/postgres.ts` | Modified | `timeline` verisinin okunup yazılması için güncellendi. | Yeni migration ile uyumluluk. |
| `.env.example` | Modified | `DATABASE_URL` ve `PERSISTENCE_MODE` eklendi. | Standart ve merkezi veritabanı bağlantısı sağlamak. |
| `tests/smoke/suites/core-commerce.ts` | Modified | Test, iki fazlı (oluşturma ve yeniden başlatma sonrası okuma) çalışacak şekilde yeniden yapılandırıldı. | Kalıcılığı (durability) doğrulamak için. |
| `package.json` | Modified | `smoke:core-commerce:1` ve `smoke:core-commerce:2` script'leri eklendi. | İki fazlı testi kolayca çalıştırmak için. |
| `pnpm-lock.yaml` | Modified | `cross-env` paketi eklendi. | Platformlar arası `SMOKE_PHASE` ortam değişkenini ayarlamak için. |

## 12. Çalıştırılan Komutlar
- **Migration:** `docker-compose ... exec ... psql ...` - **PASS**
- `pnpm run typecheck` - **PASS**
- `pnpm run build` - **PASS**
- `pnpm run smoke:health` - **PASS**
- `pnpm run smoke:core-commerce:1` (Restart Öncesi) - **PASS**
- `pnpm run smoke:core-commerce:2` (Restart Sonrası) - **PASS**
- `pnpm run smoke:all` - **PASS** (tüm mevcut testler bozulmadı)

## 13. Regression Kontrolü
- Tüm zorunlu test komutları (`typecheck`, `build`, `smoke:*`) başarıyla tamamlandı.
- `HARDENING-02B` ile kalıcı hale getirilen `Customer/Storefront/Cart` akışları, `smoke:all` testinin bir parçası olarak doğrulandı ve herhangi bir bozulma olmadığı teyit edildi.
- BFF route'ları ve kontratlarda herhangi bir değişiklik yapılmadı.

## 14. Açık Eksikler / Limitation
- Gerçek bir `payment` veya `shipment` provider entegrasyonu bulunmamaktadır; tüm akış simülasyonlar üzerinden ilerlemektedir.
- `Payment` servisi için verinin kalıcı olduğu dolaylı olarak kanıtlanmış olsa da, `GET /payment/:id` gibi bir public endpoint olmadığı için doğrudan bir okuma testi yapılamamıştır.
- İptal, iade, finans ve hakediş gibi ticaret yolculuğunun ileri adımları bu paketin kapsamında değildir.

## 15. Nihai Karar
**PASS WITH LIMITATION**

Karar Kriteri: `Payment`, `Order` ve `Shipment` servisleri için PostgreSQL tabanlı kalıcılık başarıyla entegre edilmiştir. Çekirdek ticaret yolculuğunda oluşturulan verilerin, bir sunucu yeniden başlatması sonrasında dahi korunduğu, iki fazlı bir smoke testi ile kanıtlanmıştır. "Limitation" notu, provider'ların hala simüle ediliyor olmasından ve `payment` verisinin doğrudan bir endpoint ile değil, dolaylı olarak doğrulanmasından kaynaklanmaktadır.

## 16. Sonraki Paket Önerisi
**HARDENING-04 — Media Readiness Foundation**

Çekirdek ticaret yolculuğu hem fonksiyonel hem de kalıcılık açısından stabil hale getirilmiştir. Platformun sosyal-ticaret kimliği için bir sonraki en kritik adım olan medya (görsel/video) yükleme ve işleme altyapısının temellerinin atılması (`object storage` entegrasyonu, temel upload API'leri) uygundur.