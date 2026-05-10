# PHASE-07-FIX-00 — Search / Catalog Smoke Runtime Recovery Report

## 1. Amaç
Bu fix paketinin amacı, PHASE-07 source review addendum sırasında FAIL olan search/catalog/index/media smoke testlerini local runtime, BFF health, route registration, env ve smoke runner açısından düzeltmek ve temel PHASE-07 kabul testlerini PASS hale getirmektir.

## 2. Başlangıç Durumu
PHASE-07 Source Review Addendum:
- PARTIAL

Başlangıç smoke durumu:
- smoke:catalog-read FAIL
- smoke:search FAIL
- smoke:search-index-projection FAIL
- smoke:media FAIL
- category/taxonomy/plp/ranking/recommendation smoke NOT FOUND

## 3. İlk Komut Sonuçları
| Komut | İlk Sonuç | Hata | Kök Neden |
| :--- | :--- | :--- | :--- |
| `pnpm run typecheck` | PASS | | |
| `pnpm run build` | PASS | | |
| `pnpm run smoke:catalog-read` | FAIL | fetch failed | BFF server çalışmıyordu. |
| `pnpm run smoke:search` | FAIL | fetch failed | BFF server çalışmıyordu. |
| `pnpm run smoke:search-index-projection` | FAIL | fetch failed | BFF server çalışmıyordu. |
| `pnpm run smoke:media` | FAIL | Failed at step: Health Check. Reason: fetch failed | BFF server çalışmıyordu. |

## 4. Runtime Kök Neden Analizi
BFF smoke sırasında çalışıyor muydu?
- Hayır, `run-smoke.ts` doğrudan verilen URL'e (`http://localhost:3001`) istek atıyordu ancak BFF'i başlatmıyordu.

Base URL / Port:
- `http://localhost:3001` (veya ortam değişkeninden gelen `BFF_BASE_URL`)

PERSISTENCE_MODE:
- Standart ayarlarda `postgres` kullanılıyordu. Testlerin foundation testleri olarak memory mode'da deterministik çalışabilmesi için runner içinde açıkça set edilmemişti.

Health route:
- `/health` endpoint'i mevcuttu ancak server down olduğu için ulaşılamıyordu.

Fetch failed kök nedeni:
- Smoke runner (`run-smoke.ts`) çalıştırıldığında arkaplanda hedef portu dinleyen bir local sunucu başlatılmamıştı.

Route registration eksikliği:
- Yok. Mevcut BFF kodlarında ilgili route'lar kayıtlıydı ancak sunucu hiç ayaklanmıyordu.

Env eksikliği:
- Var. `PERSISTENCE_MODE` belirteci tüm temel smoke süreçlerinde memory davranışı beklerken runner seviyesinde sabitlenmemişti.

## 5. Değiştirilen Dosyalar
| Dosya | Değişiklik | Gerekçe | Etki |
| :--- | :--- | :--- | :--- |
| `tests/smoke/run-smoke.ts` | Server'ı arkaplanda başlatan (`child_process.spawn`) mantık eklendi. | Testlerin `fetch failed` hatası almadan ilgili endpoint'lere erişebilmesini sağlamak. | Runner, testlere başlamadan önce local BFF server'ı memory modda ayaklandırır ve bitince kapatır. |
| `tests/smoke/run-smoke.ts` | `PERSISTENCE_MODE='memory'` env'a eklendi. | Foundation smoke testlerinin deterministik çalışması. | Testler dış bağımlılık olmadan güvenle çalıştırılır. |
| `tests/smoke/run-smoke.ts` | Server `/health` endpoint'ine periyodik istek atan bekleme mekanizması eklendi. | Sunucu ayaklanmadan testlerin patlamasını önlemek. | Server "ok" yanıtı verdiğinde testler güvenle başlar. |

## 6. Catalog-read Smoke Kanıtı
| Senaryo | Sonuç | Kanıt |
| :--- | :--- | :--- |
| BFF reachable | PASS | Health check başarılı, `catalog-read` 0 koduyla tamamlandı. |
| Catalog/PDP route reachable | PASS | /catalog/product/p_valid endpoint'i aktif dönüyor. |
| Hidden/unavailable public readable değil | PASS | Hidden product 404, unavailable PDP 410 dönüyor. |
| catalogReadTruth false korunuyor | PASS | Public response catalogReadTruth false işaretli taşıyor. |
| BFF catalog truth üretmiyor | PASS | BFF catalog price/stock gibi owner limitlerini sızdırmıyor. |

## 7. Search Smoke Kanıtı
| Senaryo | Sonuç | Kanıt |
| :--- | :--- | :--- |
| Search route reachable | PASS | `smoke:search` 0 koduyla tamamlandı. |
| Candidate output dönüyor | PASS | BFF'den search candidate başarıyla dönüyor. |
| Hidden/unavailable result yok | PASS | Sızma (leak) fail mesajları verilmiyor. |
| Search final ranking owner değil | PASS | searchTruth / rankingFinal marker false korunuyor. |
| searchTruth/rankingFinal marker korunuyor | PASS | Assertion başarıyla tamamlandı. |
| BFF search truth üretmiyor | PASS | BFF testlerde boundary flag'lerini ihlal etmedi. |

## 8. Search-index-projection Smoke Kanıtı
| Senaryo | Sonuç | Kanıt |
| :--- | :--- | :--- |
| Indexable projection oluşuyor | PASS | `smoke:search-index-projection` 0 koduyla tamamlandı. |
| Hidden/unavailable indexable değil | PASS | Assertion başarıyla korundu. |
| Deactivate/delete behavior güvenli | PASS | Test başarılı. |
| Projection commerce truth mutate etmiyor | PASS | Truth marker flag validation hata vermedi. |
| OpenSearch fallback/memory mode açık | PASS | Hata verilmeden memory üzerinde mock OpenSearch davranışıyla tamamlandı. |

## 9. Media Smoke Kanıtı
| Senaryo | Sonuç | Kanıt |
| :--- | :--- | :--- |
| Media route reachable | PASS | `smoke:media` 0 koduyla tamamlandı. |
| Raw upload publishable değil | PASS | Assertion hata fırlatmadı. |
| Pending/rejected public değil | PASS | Visibility validation PASS verdi. |
| Approved/visibilityReady public olabilir | PASS | Test senaryosu onaylanmış içeriği public olarak tespit etti. |
| BFF media truth üretmiyor | PASS | Boundary marker kontrolleri geçildi. |

## 10. NOT FOUND Scriptler
| Script | Durum | Hedef Paket |
| :--- | :--- | :--- |
| smoke:category | NOT FOUND | PHASE-07-FIX-01 / test coverage |
| smoke:taxonomy | NOT FOUND | PHASE-07-FIX-01 / test coverage |
| smoke:plp | NOT FOUND | PHASE-07-FIX-01 / test coverage |
| smoke:ranking | NOT FOUND | PHASE-07-FIX-01 / test coverage |
| smoke:recommendation | NOT FOUND | PHASE-07-FIX-01 / test coverage |

*Bu paket yalnız mevcut FAIL smoke runtime recovery paketidir. Eksik smoke scriptleri PHASE-07-FIX-01 veya sonraki test coverage paketine devredildi.*

## 11. Final Komut Sonuçları
| Komut | Sonuç | Not |
| :--- | :--- | :--- |
| `pnpm run typecheck` | PASS | |
| `pnpm run build` | PASS | |
| `pnpm run smoke:catalog-read` | PASS | BFF auto-start memory |
| `pnpm run smoke:search` | PASS | BFF auto-start memory |
| `pnpm run smoke:search-index-projection` | PASS | BFF auto-start memory |
| `pnpm run smoke:media` | PASS | BFF auto-start memory |
| actor spoof regression | PASS | |
| story/review/Q&A regression | PASS | |
| interaction regression | PASS | |
| moderation decision regression | PASS | |

## 12. Kalan Açık Noktalar
| Kod | Açık Nokta | Etki | Hedef Faz / Fix |
| :--- | :--- | :--- | :--- |
| SMOKE_MISSING | Missing category/taxonomy/plp/ranking/recommendation smoke scripts | Boundary test edilemiyor | PHASE-07-FIX-01 |
| OUTBOX_CONSUMER | Projection outbox consumer yokluğu | Eventler memory'de kalır | PHASE-07/Limitation |
| RANKING_GAP | Ranking skeleton boşluğu | Search ranking zayıf kalır | PHASE-07/Limitation |
| OPENSEARCH_OPS | OpenSearch production lifecycle limitation | Prod ortama geçiş yapılamaz | PHASE-07/Limitation |

## 13. PHASE-07’ye Etki
Search/catalog smoke runtime:
- **CLOSED WITH LIMITATION**

PHASE-07 source review addendum kararı güncellenebilir mi?
- **Evet**

## 14. Nihai Karar
PHASE-07-FIX-00 Kararı:
- **PASS WITH LIMITATION**

Gerekçe: Dört ana smoke runner'ın BFF entegrasyonu ve `fetch failed` hataları runtime kök analizi yapılarak (sunucunun ayaklandırılması ve memory persistency tanımlanmasıyla) kalıcı çözülmüştür. Bütün testler 0 koduyla çalışmakta olup hiçbir assertion zayıflatılmamıştır. Eksik smoke testleri ve limitation'lar sonraki fazlara devredilmiştir.

## 15. Sonraki Adım
PASS WITH LIMITATION olduğu için:
PHASE-07-FIX-01 — Category / Taxonomy / PLP Smoke Coverage veya Projection Sync Gap Review açılabilir.
