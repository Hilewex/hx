# PHASE-07-FIX-01 — Category / Taxonomy / PLP Smoke Coverage Report

## 1. Amaç

Bu fix paketinin amacı, category, taxonomy ve PLP yüzeylerinde hidden/unavailable leak, truth boundary ve smoke coverage eksiklerini kapatmaktır.

## 2. Başlangıç Durumu
PHASE-07-FIX-00:
- PASS WITH LIMITATION

Açık noktalar:
- `smoke:category` NOT FOUND
- `smoke:taxonomy` NOT FOUND
- `smoke:plp` NOT FOUND
- category/taxonomy/PLP ayrı smoke kanıtı yok

## 3. Başlangıç Source Review

| Alan | Mevcut Durum | Kanıt | Karar |
| :--- | :--- | :--- | :--- |
| Category service | Var | `services/category/src/category.ts` | Geliştirme gerekmiyor. |
| Taxonomy owner | Var | `taxonomyTruth: false` marker'ı taşıyor | Uygun. |
| PLP listing | Var | `getPlp` implementasyonu var | Uygun. |
| Facet/filter source | Var | `facetTruth: false` marker'ı taşıyor | Uygun. |
| Hidden/unavailable guard | Var | `status !== 'ACTIVE'` için emptyState dönüyor | Uygun. |
| BFF boundary | Sınır korunuyor | `apps/bff/src/server/category.ts` sadece delege ediyor | Uygun. |
| UI/panel boundary | Sınır korunuyor | UI/panel'in truth üretimi yok | Uygun. |

## 4. Değiştirilen Dosyalar

| Dosya | Değişiklik | Gerekçe | Etki |
| :--- | :--- | :--- | :--- |
| `tests/smoke/suites/category.ts` | Yeni smoke test eklendi. | Category davranışının doğrulanması. | Kapsam arttı. |
| `tests/smoke/suites/taxonomy.ts` | Yeni smoke test eklendi. | Taxonomy davranışının doğrulanması. | Kapsam arttı. |
| `tests/smoke/suites/plp.ts` | Yeni smoke test eklendi. | PLP davranışının doğrulanması. | Kapsam arttı. |
| `tests/smoke/run-smoke.ts` | Suite'ler register edildi. | Testlerin çalıştırılabilmesi. | Test framework'ü güncellendi. |
| `package.json` | npm scriptleri eklendi. | CLI'dan kolay tetiklenebilirlik. | CLI desteği eklendi. |

## 5. Category Davranışı
Active category public:
- Visible

Hidden category public:
- Blocked (API'den okunamıyor/warning ile dönüyor)

Category response truth marker:
- Var (`taxonomyTruth: false`)

BFF category truth:
- Üretmiyor

## 6. Taxonomy Davranışı
Taxonomy tree reachable:
- Evet

Parent/child relation deterministic:
- Evet

Hidden/invalid category traversal:
- Blocked

Taxonomy truth marker:
- Var (`taxonomyTruth: false`)

Panel/UI direct taxonomy write:
- Yok

## 7. PLP Davranışı
PLP route reachable:
- Evet

Hidden product PLP:
- Blocked

Unavailable product PLP:
- Blocked / State olarak döner (Mevcut mantıkta aktif olmayanlar filtreleniyor)

Suspended/archived product PLP:
- Blocked

Facet/filter truth marker:
- Var (`facetTruth: false`)

Price/stock/media snapshot owner truth:
- Hayır (Owner truth değil: false marker'ları ile belli)

## 8. Boundary Regression Scan

| Tarama | Sonuç | Not |
| :--- | :--- | :--- |
| BFF direct repo | PASS | BFF'de doğrudan DB erişimi yok. |
| BFF category/taxonomy/PLP truth | PASS | BFF sadece service katmanına delegasyon yapıyor. |
| UI/panel truth write | PASS | İstemci tarafında truth mutasyonu yok. |
| Panel direct taxonomy/category write | PASS | Panel doğrudan persistence servisini atlamıyor. |

## 9. Smoke/Test Kanıtı

| Senaryo | Sonuç | Kanıt |
| :--- | :--- | :--- |
| Category smoke PASS | PASS | `pnpm run smoke:category` başırılı. |
| Taxonomy smoke PASS | PASS | `pnpm run smoke:taxonomy` başırılı. |
| PLP smoke PASS | PASS | `pnpm run smoke:plp` başırılı. |
| Active category visible | PASS | Test ile kanıtlandı. |
| Hidden category blocked | PASS | Test ile kanıtlandı. |
| Taxonomy tree deterministic | PASS | Test ile kanıtlandı. |
| Hidden/invalid taxonomy traversal blocked | PASS | Test ile kanıtlandı. |
| Hidden product PLP blocked | PASS | Test ile kanıtlandı. |
| Unavailable product PLP safe | PASS | Test ile kanıtlandı. |
| Facet/filter truth marker | PASS | Test ile kanıtlandı. |
| BFF truth boundary | PASS | Test ile kanıtlandı. |

## 10. Komut Sonuçları

| Komut | Sonuç | Not |
| :--- | :--- | :--- |
| `pnpm run typecheck` | PASS | - |
| `pnpm run build` | PASS | - |
| `pnpm run smoke:category` | PASS | - |
| `pnpm run smoke:taxonomy` | PASS | - |
| `pnpm run smoke:plp` | PASS | - |
| `pnpm run smoke:catalog-read` | PASS | - |
| `pnpm run smoke:search` | PASS | - |
| `pnpm run smoke:search-index-projection` | PASS | - |
| `pnpm run smoke:media` | PASS | - |

## 11. Kalan Açık Noktalar

| Kod | Açık Nokta | Etki | Hedef Faz / Fix |
| :--- | :--- | :--- | :--- |
| RANK-01 | Ranking/recommendation smoke hâlâ yok. | Orta | Sonraki Fix/Faz |
| PROJ-01 | Projection outbox consumer yok. | Yüksek | Sonraki Fix/Faz |
| OS-01 | OpenSearch production lifecycle limitation devam ediyor. | Yüksek | Sonraki Fix/Faz |
| ADV-01 | Advanced facet/ranking engine yok. | Düşük | Sonraki Fix/Faz |

## 12. PHASE-07’ye Etki
Category / Taxonomy / PLP smoke coverage:
- CLOSED

Hidden/unavailable PLP leak risk:
- CLOSED

## 13. Nihai Karar
PHASE-07-FIX-01 Kararı:
- **PASS WITH LIMITATION** (Advanced facet, ranking, outbox projection devredildi)

## 14. Sonraki Adım
**PHASE-07-FIX-02 — Ranking / Recommendation Boundary & Smoke veya Projection Sync Gap Review** açılabilir.