### **HARDENING-09A — Provider Boundary & Env Standard Foundation Planı**

**1. Paket Amacı**

Bu paketin temel amacı, harici servis sağlayıcı (provider) entegrasyonları için standart, güvenli ve yönetilebilir bir "boundary" (sınır) katmanı oluşturmaktır. Bu katman, ödeme, kargo, bildirim ve ödeme çıkışı gibi farklı provider'lardan gelen verilerin ve operasyonların sistemin ana iş mantığını (business truth) doğrudan değiştirmesini engeller. Amaç, provider'lardan gelen bilgiyi bir "öneri" veya "ham data" olarak kabul edip, sistemin kendi kuralları ve doğruları çerçevesinde işlemektir. Bu paketle birlikte, environment-spesifik konfigürasyon ve credential yönetimini standartlaştırarak hem geliştirme (development) hem de production ortamlarında tutarlılık ve güvenlik sağlanacaktır.

**2. Kapsam İçi**

*   **Provider Boundary Soyutlaması:** Tüm provider entegrasyonları için ortak bir "Provider" arayüzü ve "Adapter" (bağdaştırıcı) deseninin tasarlanması.
*   **Provider Result Envelope:** Provider'lardan gelen yanıtları standart bir zarf (envelope) yapısı içinde sarmalamak. Bu yapı, provider işleminin sonucunu (`success`, `failure`), ham datayı, normalize edilmiş veriyi ve hata bilgilerini içerecektir.
*   **Environment Standardı:** `.env` dosyaları aracılığıyla provider-spesifik `API_KEY`, `SECRET`, `ENDPOINT` gibi bilgilerin yönetimi için standart bir isimlendirme ve yapı kuralı getirilmesi.
*   **Webhook/Callback Hazırlığı:** Provider'lardan gelecek asenkron bildirimler (webhook/callback) için genel bir `handler` ve doğrulama (verification) mekanizması altyapısının tasarlanması.
*   **Ortak Contract'lar:** Farklı provider (ödeme, kargo vb.) türleri için temel `request` ve `response` tiplerini içeren yeni bir `contracts` paketinin (`@hx/contracts-provider`) oluşturulması.

**3. Kapsam Dışı**

*   **Spesifik Provider Entegrasyonu:** Bu paket, herhangi bir spesifik ödeme (örn: Stripe, Iyzico) veya kargo (örn: Yurtiçi Kargo) provider'ının tam entegrasyonunu *yapmayacaktır*. Sadece bu entegrasyonların yapılacağı standart altyapıyı kuracaktır.
*   **UI Değişiklikleri:** Provider yönetimi veya sonuçlarının gösterileceği herhangi bir kullanıcı arayüzü (UI) bu paketin kapsamı dışındadır.
*   **Veritabanı Şema Değişiklikleri:** Bu aşamada, ana iş objelerinin (order, shipment, payment) veritabanı şemalarında değişiklik yapılması planlanmamaktadır. Provider'dan gelen ham data, mevcut `outbox` veya yeni oluşturulacak `provider_raw_log` gibi bir tabloda tutulabilir ancak bu, implementasyon aşamasında kararlaştırılacaktır.

**4. Değişmesi Önerilen Dosyalar**

Mevcut yapıya dokunmadan, yeni bir "boundary" ve "adapter" katmanı eklemek hedeflenmektedir. Bu nedenle mevcut servislerin doğrudan değiştirilmesi yerine, onlarla etkileşime geçecek yeni modüller eklenecektir.

*   `services/payment/src/payment.ts`: Ödeme provider'ı adaptörünü kullanacak şekilde güncellenebilir.
*   `services/shipment/src/shipment.ts`: Kargo provider'ı adaptörünü kullanacak şekilde güncellenebilir.
*   `services/notification/src/notification.ts`: Bildirim provider'ı adaptörünü kullanacak şekilde güncellenebilir.
*   `services/payout/src/payout.ts`: Ödeme çıkış provider'ı adaptörünü kullanacak şekilde güncellenebilir.
*   `.env.example`: Yeni eklenecek environment değişkenleri için standartları yansıtacak şekilde güncellenecektir.
*   `pnpm-workspace.yaml`: Yeni oluşturulacak `packages/contracts-provider` paketini içerecek şekilde güncellenecektir.

**5. Yeni Eklenecek Contract/Type Dosyaları**

*   **Gerekçe:** Provider'lar arası iletişimi standartlaştırmak, tiplerin tek bir merkezden yönetilmesini sağlamak ve "truth owner" prensibini güçlendirmek için yeni bir `contracts` paketi oluşturulması elzemdir. Bu, servislerin provider'a özgü veri yapılarına doğrudan bağımlı olmasını engeller.
*   **Yeni Paket: `packages/contracts-provider`**
    *   `packages/contracts-provider/src/common.ts`: `ProviderMode` (örn: `LIVE`, `TEST`, `MOCK`), `ProviderResultEnvelope<T>`, `ProviderError` gibi tüm provider'lar için ortak tipleri içerecektir.
    *   `packages/contracts-provider/src/payment.ts`: Ödeme provider'ları için `CreatePaymentRequest`, `CreatePaymentResponse`, `PaymentStatus` gibi tipleri tanımlayacaktır.
    *   `packages/contracts-provider/src/shipment.ts`: Kargo provider'ları için `CreateShipmentRequest`, `TrackShipmentResponse`, `ShipmentStatus` gibi tipleri tanımlayacaktır.
    *   `packages/contracts-provider/src/notification.ts`: Bildirim (SMS, email, push) provider'ları için `SendNotificationRequest` ve `SendNotificationResponse` tiplerini barındıracaktır.
    *   `packages/contracts-provider/src/payout.ts`: Ödeme çıkış provider'ları için `CreatePayoutRequest`, `PayoutStatus` gibi tipleri tanımlayacaktır.

**6. Provider Mode Standardı Önerisi**

Her provider entegrasyonu, ortam değişkeniyle (`process.env.PAYMENT_PROVIDER_MODE`) yönetilen üç modu desteklemelidir:
*   `LIVE`: Gerçek production API'sine istek atar. Sadece production ortamında aktif olmalıdır.
*   `TEST`: Provider'ın sunduğu test/sandbox API'sine istek atar. Staging ve development ortamları için varsayılandır.
*   `MOCK`: Hiçbir dış ağ çağrısı yapmaz. Önceden tanımlanmış başarılı veya hatalı yanıtları döndürür. Lokal geliştirme ve unit/integration testleri için kullanılır. Bu mod, backend geliştiricisinin frontend veya diğer servislerden izole bir şekilde çalışmasına olanak tanır.

**7. Provider Result Envelope Önerisi**

Tüm provider adapter'ları, kendi ham sonuçlarını aşağıdaki standart zarf yapısına dönüştürüp döndürmelidir:

```typescript
interface ProviderResultEnvelope<TRaw, TNormalized> {
  mode: 'LIVE' | 'TEST' | 'MOCK';
  provider: string; // 'stripe', 'iyzico', 'yurtici_kargo'
  status: 'SUCCESS' | 'FAILURE' | 'PENDING';
  rawResponse: TRaw;
  normalizedData?: TNormalized; // Başarılı ve normalize edilebilir yanıtlarda dolu olur.
  error?: {
    message: string;
    code?: string; // Provider'a özgü hata kodu
    isRetryable: boolean;
  };
  transactionId: string; // Provider'ın verdiği veya bizim ürettiğimiz işlem ID'si
  timestamp: string; // ISO 8601
}
```

**8. Env/Credential Standardı Önerisi**

Her provider için `.env` değişkenleri şu standart formatta olmalıdır: `[PROVIDER_ADI]_[DEGISKEN_ADI]`

*Örnekler:*
```
# Payment
PAYMENT_PROVIDER=stripe
PAYMENT_PROVIDER_MODE=TEST # LIVE | TEST | MOCK
STRIPE_API_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Shipment
SHIPMENT_PROVIDER=yurtici_kargo
SHIPMENT_PROVIDER_MODE=MOCK
YURTICI_KARGO_API_KEY=...
YURTICI_KARGO_SECRET_KEY=...
```

Bu yapı, farklı provider'lar arasında geçiş yapmayı ve konfigürasyonu anlamayı kolaylaştırır.

**9. Webhook/Callback Hazırlık Standardı**

*   Her provider için tek bir merkezi webhook endpoint'i (`/api/webhooks/:provider`) oluşturulmalıdır. Örneğin: `/api/webhooks/stripe`, `/api/webhooks/yurtici_kargo`.
*   Bu endpoint'ler, ilk olarak isteğin `signature`'ını (imzasını) provider'ın `WEBHOOK_SECRET`'ı ile doğrulamalıdır. Başarısız doğrulama `401 Unauthorized` ile sonuçlanmalıdır.
*   Doğrulanan webhook payload'ı, ham haliyle bir `outbox` veya `event` tablosuna (örn: `provider_webhooks` ) kaydedilmeli ve bir `event` (örn: `provider.webhook.received`) olarak yayınlanmalıdır.
*   Asıl iş mantığı (sipariş durumunu güncelleme vb.) bu event'i dinleyen asenkron bir `consumer` tarafından yapılmalıdır. Bu, webhook endpoint'inin hızlıca yanıt vermesini (`200 OK`) sağlar ve provider tarafında `timeout` yaşanmasını engeller.

**10. Audit/Outbox Boundary Etkisi**

*   **Outbox:** Provider'a yapılan her giden çağrı (`createPayment`, `createShipment`) ve gelen her webhook, bir `outbox` kaydı oluşturmalıdır. Bu, sistemin çökmesi durumunda bile "en az bir kez teslim" (at-least-once delivery) garantisi sağlar.
*   **Audit:** Provider'dan gelen `ProviderResultEnvelope` içindeki `rawResponse` ve `normalizedData`, audit logları için kritik bir girdi oluşturur. Özellikle `truth owner`'ın kim olduğu (bizim sistemimiz) ve provider'ın ne "önerdiği" arasındaki ayrımı göstermek için bu loglar çok değerlidir. Örneğin, "Provider 'Stripe' ödemeyi 'başarılı' olarak bildirdi (raw data), sistem 'Order' statüsünü 'PAID' olarak güncelledi (business truth mutation)" şeklinde bir audit kaydı oluşturulabilir.

**11. Smoke/Test Planı**

1.  **Unit Testler:** Her provider adaptörünün `MOCK` modunda doğru `ProviderResultEnvelope` ürettiği test edilmelidir.
2.  **Integration Testler:**
    *   Servislerin (payment, shipment), ilgili provider adaptörünü `MOCK` modda çağırıp, gelen yanıta göre doğru iş mantığını (state güncellemesi, event fırlatma) tetiklediği doğrulanmalıdır.
    *   Webhook `handler`'larının, sahte (mock) ama geçerli imzalı webhook isteklerini doğru bir şekilde `outbox`'a kaydettiği test edilmelidir.
    *   Geçersiz imzalı webhook isteklerinin `401` ile reddedildiği test edilmelidir.
3.  **Smoke Testler (Staging):**
    *   `.env` dosyasındaki `TEST` mod konfigürasyonu ile, en az bir ödeme ve bir kargo provider'ının sandbox ortamlarına başarılı bir şekilde bağlanıp temel bir işlem (örn: ödeme yaratma, kargo oluşturma) yapabildiği kontrol edilmelidir.
    *   Staging ortamındaki webhook endpoint'ine, provider'ın test arayüzünden manuel bir test event'i gönderilerek, bunun sisteme düşüp düşmediği kontrol edilmelidir.

**12. Riskler**

*   **Artan Karmaşıklık:** Yeni bir soyutlama katmanı eklemek, başlangıçta basit bir API çağrısı yapmaktan daha karmaşık görünebilir. Geliştiricilerin bu yeni standardı benimsemesi için iyi bir dokümantasyon ve eğitim gereklidir.
*   **Provider Çeşitliliği:** Tüm provider'ların `request`/`response` yapılarını tek bir `normalizedData` altında toplamak zor olabilir. Bazı durumlarda `normalizedData` alanı boş kalabilir ve iş mantığı `rawResponse`'u yorumlamak zorunda kalabilir. Bu, standardın esnekliğini test edecektir.
*   **Credential Yönetimi:** `.env` dosyalarında hassas bilgilerin tutulması, production ortamları için ideal bir çözüm değildir. Bu paket bir başlangıç noktasıdır, ancak gelecekte `HashiCorp Vault`, `AWS Secrets Manager` gibi daha güvenli credential yönetim sistemlerine geçiş planlanmalıdır.

**13. Implementation’a Geçilebilir mi? GO / NO-GO Önerisi**

**Öneri: GO**

**Gerekçe:** Sunulan plan, projenin en temel kurallarından biri olan "Provider business truth owner değildir" ilkesini sisteme entegre etmek için sağlam bir temel oluşturmaktadır. Kod yazmadan önce bu planın yapılması, körlemesine ilerlemeyi engelleyecek ve tüm ekibin ortak bir anlayış ve standart çerçevesinde hareket etmesini sağlayacaktır. Referans dokümanlardaki (örn: `HARDENING-08B`, `15-ödeme sistemi.md`) hedeflerle uyumlu olan bu plan, gelecekteki provider entegrasyonlarını hızlandıracak, test edilebilirliği artıracak ve sistemin genel sağlığını ve güvenliğini önemli ölçüde iyileştirecektir. Riskler yönetilebilir düzeydedir ve planın faydaları bu risklerden ağır basmaktadır.