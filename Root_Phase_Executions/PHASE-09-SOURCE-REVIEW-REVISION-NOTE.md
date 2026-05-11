# PHASE-09 Source Review Revision Note

## Önceki Karar
PARTIAL

## Yeni Karar
PARTIAL

## Karar Değişti Mi?
Hayır. Ancak kararın dayandığı kanıtlar ve bulgular kesinleştirilmiştir.

## Neden Revizyon Yapıldı?
Mevcut PHASE-09 source review raporunda kullanılan "görünüyor", "muhtemelen", "temel olarak mevcut", "kısmen" ve "yetersiz kalabilir" gibi varsayıma dayalı ve belirsiz ifadeler, readiness kriterlerini net olarak karşılamıyordu. Gerçek kanıtlara (kod, dosya, smoke) dayalı kesin ifadelerin kullanılması amacıyla revizyon yapıldı.

## Hangi Belirsiz İfadeler Düzeltildi?
- "doğrudan external domain'i force mutate etmiyor gibi görünüyor" ifadesi yerine "Risk BFF ve servisi order/payment statülerini doğrudan mutate etmemektedir" yazıldı.
- "Fraud büyük ihtimalle risk servisine entegre edilmiş ya da eksik" ifadesi yerine "Ayrı Fraud boundary implementation bulunamadı" yazıldı.
- "temel olarak mevcut fakat tam durable replay pattern smoke olarak yetersiz kalabilir" ifadesi yerine "Replay ve duplicate handling kanıtı yoktur" yazıldı.
- Sadece "eksikliği" denilen durumların karşısına açıkça incelenen dosya isimleri ve route'lar eklendi.

## Hangi Repo Alanları Ek İncelendi?
Aşağıdaki lokasyonlardaki güncel dosyalar taranarak raporda "Revision Evidence" altına eklendi:
- `apps/bff/src/server/` içerisindeki risk.ts, analytics.ts, notification.ts
- `services/` altındaki risk, analytics, notification klasörleri (ve fraud'un bulunamadığı bilgisi)
- `packages/contracts/src/` içindeki risk, analytics, notification, audit dosyaları
- `tests/smoke/suites/` içindeki risk-signal.ts, analytics.ts, notification.ts, notification-provider-boundary.ts, event-audit.ts, event-outbox.ts dosyaları

## Hangi Gap Gerekçeleri Güçlendirildi?
- **GAP-FRAUD-REVIEW-HANDOFF**: Fraud'un bir entegrasyonu olmadığı değil, projede tamamen "bulunamadığı" (NO implementation) gerçeği eklendi.
- **GAP-RISK-SIGNAL-HANDOFF**: Route ve fonksiyon isimleri (`createRiskSignal`, `createRiskCase`, `reviewRiskCase`) açıkça listelenerek truth handoff kodunun eksikliği vurgulandı.
- **GAP-ANALYTICS-PII-NON-MUTATION**: Ingestion var, fakat veri içeriğindeki (payload) maskeleme loglarının olmadığı kanıtlandı.
- **GAP-NOTIFICATION-PRIVACY-IDEMPOTENCY**: Duplicate koruması ve retry mekanizmasının test ve implementasyon kanıtı olmadığı belirtildi.
- **GAP-EVENT-AUDIT-OUTBOX-DURABILITY**: Memory vs. Durable kontrolü üzerinden test cover'ın yetersizliği doğrulandı.
- **GAP-PANEL-EVIDENCE-INTEGRATION**: "Panel pipeline entegrasyon kanıtı yok" ifadesi ile kesinleştirildi.

## Fix Sırası Değişti Mi?
Evet. Build / Typecheck ve Baseline Smoke Recovery her phase için zorunlu foundation adımı olduğu için **PHASE-09-FIX-00** (Route / Build / Smoke Runtime Recovery) sıranın en başına eklendi ve tüm liste yeniden numaralandırıldı.

## Kod Değişikliği Yapıldı Mı?
Hayır. Hiçbir business logic, kod, smoke testi veya proje konfigürasyonu değiştirilmedi. Yalnızca rapor dokümantasyonu revize edildi.

## Sonraki Önerilen Paket
**PHASE-09-FIX-00 — Risk/Fraud/Analytics/Notification Route / Build / Smoke Runtime Recovery**
