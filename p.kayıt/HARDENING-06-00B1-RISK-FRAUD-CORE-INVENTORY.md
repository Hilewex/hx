# HARDENING-06-00B1 — Risk / Fraud Core Inventory

## 1. Kısa Özet
- Bu paket inventory paketidir.
- Kod değişikliği yapılmadı.
- PASS/FAIL verilmedi.
- En kritik 5 risk/fraud core bulgusu:
    1. **Missing Domain Integration:** Risk servisinin `createRiskSignal` ve `createRiskCase` fonksiyonları mevcut ve contract'larda tanımlı, ancak hiçbir domain servisi (Payment, Order, Coupon vb.) henüz bu sinyalleri tetiklemiyor.
    2. **Weak Signal Protection:** BFF katmanında `handleCreateRiskSignal` sadece `requireAuthenticated` ile korunuyor. Bu, herhangi bir giriş yapmış kullanıcının sisteme risk sinyali enjekte edebileceği anlamına gelir (Zayıf Güvenlik).
    3. **Missing Automated Scoring:** Sistemde `RiskSignal` ve `RiskCase` modelleri var ancak sinyalleri otomatik olarak işleyip skora veya vakaya (Case) dönüştürecek bir "Score Compute" motoru henüz yok.
    4. **Audit-Only Connection:** Risk servisinin diğer sistemlerle tek bağı `appendAuditEvent` üzerinden Audit Log seviyesinde. Risk kararları henüz hedef domain'leri (Order hold, Payout block vb.) otomatik olarak mutate etmiyor (`targetTruthMutated: false`).
    5. **Persistence Schema Sync:** Postgres repository implementasyonu mevcut ancak moderasyon servisinde olduğu gibi migration süreci belirsiz; runtime'da tablo kontrolü yapmıyor ancak query'ler sabit kolonlara (`INSERT INTO risk_signals ...`) dayanıyor.

## 2. Referans Dosya Kontrolü
| Dosya | Durum | Not |
|---|---|---|
| HARDENING-06-00A-MODERATION-WORKFLOW-INVENTORY.md | FOUND | Moderasyon izolasyon kuralları referans alındı. |
| HARDENING-05C-PANEL-ADMIN-CREATOR-ROUTE-PROTECTION-CLOSURE-REPORT.md | FOUND | Guard yapıları incelendi. |
| HARDENING-05D-SOCIAL-ACTION-PERMISSION-ENFORCEMENT-CLOSURE-REPORT.md | FOUND | Permission enforcement standartları. |
| HARDENING-05E-SR-CLOSURE-REPORT.md | FOUND | Commerce akışları incelendi. |
| planlama/49-fraud risk abuse sistemi.md | FOUND | Sistemin vizyonu ve kural seti referans alındı. |
| planlama/25-kural -yetki sistemi.md | FOUND | Yetki katmanı ile risk katmanı ayrımı incelendi. |
| planlama/40-admin sistemi.md | FOUND | Risk Operator rolü ve panel beklentileri incelendi. |
| planlama/62-MASTER_IMPLEMENTATION_PLAN.md | FOUND | Roadmap hizalaması yapıldı. |

## 3. İncelenen Repo Dosyaları
| Alan | Dosya/Yol | Durum | Not |
|---|---|---|---|
| Contracts | `packages/contracts/src/risk.ts` | FOUND | Signal, Case, Decision, ReasonCode tanımları tam. |
| Service | `services/risk/src/risk.ts` | FOUND | Signal ingest ve Case review logic'leri mevcut. |
| Repository | `services/risk/src/repository/` | FOUND | Postgres ve In-Memory implementasyonları var. |
| BFF Handler | `apps/bff/src/server/risk.ts` | FOUND | Route handler'lar mevcut. |
| Guards | `apps/bff/src/server/guards.ts` | FOUND | `requireRiskOperator` tanımlı. |
| Smoke Test | `services/risk/src/smoke-test.ts` | FOUND | Temel akış doğrulaması mevcut. |

## 4. Risk Contract Inventory
| Bileşen | Dosya | Gerçek Durum | Kanıt | Risk |
|---|---|---|---|---|
| RiskSignal | `risk.ts:76` | Mevcut | `target`, `type`, `level`, `source` içeriyor. | Düşük |
| RiskScore | `risk.ts:29` | Kısmi | `RiskLevel` olarak var, sayısal/metrik bir model yok. | Orta |
| RiskDecision | `risk.ts:40` | Mevcut | `NO_ACTION`, `MARK_REVIEW_REQUIRED`, `RECOMMEND_HOLD` vb. | Düşük |
| AbuseType | `risk.ts:58` | Mevcut | `RiskReasonCode` olarak tanımlı (COUPON_ABUSE vb.). | Düşük |
| TargetType | `risk.ts:1` | Mevcut | `ACCOUNT`, `ORDER`, `PAYMENT`, `COUPON` vb. | Düşük |
| Block/Restrict | `risk.ts:31` | Kısmi | `RiskCaseStatus` içinde `ADVISORY_HOLD` var. | Orta |
| Audit/Event metadata | `risk.ts:83` | Mevcut | `metadata: Record<string, any>` ve Truth flags var. | Düşük |

## 5. Risk Service Inventory
| Fonksiyon/Akış | Dosya | Mevcut Davranış | Boundary Durumu | Risk |
|---|---|---|---|---|
| createRiskSignal | `risk.ts:40` | Sinyali veritabanına kaydeder ve Audit Log atar. | SAFE | Target domain'e müdahale etmiyor. |
| createRiskCase | `risk.ts:96` | Manuel veya kural bazlı vaka oluşturur. | SAFE | Başlangıç status'u 'OPEN'. |
| reviewRiskCase | `risk.ts:154` | Operatör kararı ile status günceller. | SAFE | Karar sadece Risk domain'inde kalıyor. |
| Signal Ingest | `risk.ts:40` | Pasif kayıt. | SAFE | Otomatik bir tetikleyici/skorer yok. |
| Score Compute | - | BULUNAMADI | UNSAFE | Manuel müdahale veya dış sinyal bekliyor. |

## 6. Risk BFF Route Inventory
| Route/Handler | Method | Action | Actor Guard | Risk |
|---|---|---|---|---|
| handleCreateRiskSignal | POST | Signal Ingest | `requireAuthenticated` | Yüksek (Customer sinyal basabilir) |
| handleCreateRiskCase | POST | Case Create | `requireRiskOperator` | Düşük |
| handleReviewRiskCase | POST | Case Review | `requireRiskOperator` | Düşük |
| handleGetRiskCase | GET | View Case | `requireRiskOperator` | Düşük |
| handleListRiskCases | GET | List Cases | `requireRiskOperator` | Düşük |

## 7. Permission / Boundary Değerlendirmesi
| Kontrol | Sonuç | Kanıt | Risk |
|---|---|---|---|
| Risk permission yerine geçiyor mu? | HAYIR | `guards.ts`'de yetki ve risk kontrolü ayrı. | Düşük |
| Risk eligibility yerine geçiyor mu? | HAYIR | Eligibility domain servislerinde, Risk ise ayrı. | Düşük |
| Risk owner dışı truth mutate ediyor mu? | HAYIR | `targetTruthMutated` daima `false` set ediliyor. | Düşük |
| BFF risk decision execute ediyor mu? | HAYIR | Sadece Risk domain'inde status güncelliyor. | Düşük |
| Guest/customer/creator risk action yapabiliyor mu? | EVET (Sinyal) | `handleCreateRiskSignal` guard'ı zayıf. | Yüksek |

## 8. Persistence / Audit / Event Durumu
| Alan | Persistence | Audit | Event/Outbox | Risk |
|---|---|---|---|---|
| Risk Signals | Postgres | `RISK_SIGNAL_CREATED` | Evet (Internal) | Düşük |
| Risk Cases | Postgres | `RISK_CASE_CREATED/REVIEWED` | Evet (Internal) | Düşük |
| Audit Bağlantısı | `services/risk/src/risk.ts:24` | `appendAuditEvent` ile merkezi log'a bağlı. | Düşük |

## 9. HARDENING-06B İçin Öneri
HARDENING-06B — Risk Signal / Abuse Decision Integration için öneri:

| Kapsam | Yapılacak | Dışarıda Bırakılacak | Kabul Kanıtı |
|---|---|---|---|
| Integration | Domain servislerinin (Payment, Order) kritik anomali anında sinyal üretmesi. | Otomatik hesap bloklama. | Smoke testlerde domain tetiklemeli sinyal oluşumu. |
| Security | `handleCreateRiskSignal` guard'ının `requireInternalService` veya `requireAdmin` yapılması. | Son kullanıcı sinyal erişimi. | Customer rolüyle sinyal basılamaması. |
| Orchestration | Risk kararlarının (HOLD) ilgili domain'e event olarak asenkron iletilmesi. | Senkron mutation (Truth owner korunmalı). | Outbox üzerinden "Risk Decision" event'i yayımı. |

## 10. Komut/Test Durumu
Bu inventory paketinde komut zorunlu değildir.
Repo içinde `services/risk/src/smoke-test.ts` incelenmiş ancak çalıştırılmamıştır (Inventory kuralı).

| Komut | Çalıştırıldı mı? | Sonuç | Not |
|---|---|---|---|
| `search_files` | EVET | SUCCESS | Repo genelinde anahtar kelime taraması yapıldı. |
| `read_file` | EVET | SUCCESS | Contract, Service ve BFF dosyaları detaylı incelendi. |

## 11. Nihai Karar
- HARDENING-06-00B1 inventory paketidir.
- Kod değişikliği yapılmadı.
- Sistem PASS/FAIL verilmedi.
- Risk/fraud core repo gerçekliği çıkarıldı.
- **HARDENING-06B için önerilen yön:** Risk servisinin bir "bilgi toplama merkezi"nden "aksiyon öneren bir orkestratöre" evrilmesi için domain servisleriyle (Payment, Order, Coupon) sinyal seviyesinde entegre edilmesi.
- **En kritik P0 riskler:** `handleCreateRiskSignal` endpoint'inin yetkisiz (Customer) erişime açık olması ve domain servislerinin henüz hiçbir risk sinyali üretmiyor olması.
