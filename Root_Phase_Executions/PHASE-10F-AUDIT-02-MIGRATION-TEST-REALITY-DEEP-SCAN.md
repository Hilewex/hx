# PHASE-10F-AUDIT-02 — Migration & Test Reality Deep Scan

## 1. Migration Sistemi Gerçekten Var mı?
**Evet, var.** 
- `infra/migrations` dizini altında `.sql` uzantılı versiyonlanmış (timestamp/sıralı) migration dosyaları bulunuyor (örn. `20260425_001_moderation_init.sql`, `20260427_001_risk_foundation.sql`).
- `packages/persistence/src/migrator.ts` içerisinde `_migrations` tablosunu yöneten temel bir migration runner mekanizması kurulmuş.
- Root dizinde `run-migrations.ts` scripti mevcut.

## 2. Hangi Tablolar Migration ile Yönetiliyor?
Core domain tabloları migration dosyalarıyla yönetiliyor. 
İsimlendirmelerden anlaşıldığı kadarıyla:
- Moderation (`moderation_init`)
- Commerce/Cart/Checkout (`commerce_cart_checkout`)
- Payment & Order (`payment_order_persistence`)
- Shipment & Refund (`shipment_return_refund_persistence`)
- Risk, Finance, Settlement, Payout, Metrics/Analytics, Provider Callback gibi temel yapıtaşlarının tamamı `infra/migrations` içindeki SQL dosyalarıyla tanımlanmış.

## 3. Hangi Tablolar Repository İçinde Runtime Create Ediliyor?
`search_files` taramasına göre özellikle **Idempotency (Tekrarlanmazlık)** tabloları repository seviyesinde, runtime'da yaratılıyor:
- `_idempotency`
- `_moderation_decision_idempotency`

*Örnek Kod (`services/moderation/src/repository/postgres.ts`):*
```typescript
// Ensure table exists (simple approach for foundation)
await query('CREATE TABLE IF NOT EXISTS _idempotency (key TEXT PRIMARY KEY, case_id TEXT NOT NULL)');
```

## 4. Bu Production Riski mi, Yoksa Dev/Foundation Tercihi mi?
Şu anki haliyle **Dev/Foundation tercihi**. Yorum satırlarında da *(simple approach for foundation)* şeklinde belirtilmiş. 
Ancak bu yapı prod ortamında **risktir**:
- Veritabanı kullanıcısının production'da `CREATE TABLE` yetkisine sahip olması güvenlik açısından (Principle of Least Privilege) önerilmez.
- Concurrent (eşzamanlı) isteklerde tablo yaratma çakışmaları (race condition) olabilir.

## 5. Test/Smoke Scriptleri Dağınık mı?
**Hayır, oldukça konsolide.**
- Kök dizindeki `package.json` incelendiğinde `smoke:health`, `smoke:catalog`, `smoke:commerce`, `smoke:payment-*`, `smoke:refund-*` gibi devasa bir komut listesi (yaklaşık 100 adet) bulunuyor.
- Bu scriptlerin tümü ortak bir noktayı işaret ediyor.

## 6. Merkezi Test Runner Var mı?
**Evet, var.**
Tüm `smoke:*` komutları `tsx tests/smoke/run-smoke.ts <command>` şeklinde merkezi bir runner'a bağlanmış durumda. Dağınık bash scriptleri veya farklı farklı runner (jest, vitest karışık) kullanımı görünmüyor. Her şey bu merkezi yapı üzerinden yürüyor.

## 7. Hemen Çözülmesi Gereken P0/P1 Var mı?
- P0 seviyesinde acil bir blocker görünmüyor. 
- Runtime `CREATE TABLE` işlemleri P2 seviyesinde bir teknik borçtur. İlerleyen fazlarda bu tabloların (özellikle idempotency tablolarının) `infra/migrations` içerisine taşınarak, uygulama db kullanıcısının DDL yetkilerinin (Create Table) alınması gerekecektir.

## 8. Phase-10’u Durduracak Blocker Var mı?
**Yok.** Altyapı beklediğimizden daha düzenli, testler tek bir runner arkasında toplanmış ve merkezi migration sistemi (birkaç istisna hariç) çalışıyor. Phase-10 güvenle devam edebilir.

## 9. Öneri
1. **Öncelik Commerce Ops Expansion:** Mimari engel olmadığı için iş kuralları ve domain genişlemesine (Commerce Ops) odaklanmaya devam edilmeli.
2. **Backlog (Migration Cleanup):** Runtime table creation (idempotency) işlemlerini standart migration sürecine dahil etme görevi teknik borç (Tech Debt) olarak backlog'a eklenmeli.
3. **Test Konsolidasyonu Durumu:** Test tarafında zaten `run-smoke.ts` ile iyi bir konsolidasyon yakalanmış. Ekstra bir efora gerek yok.
