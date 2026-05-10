# PHASE-07-START-CONTEXT — Next Phase Scope Verification / Handoff Report

## 1. Amaç
Bu rapor, PHASE-07’ye başlamadan önce faz kapsamını, gerekli referans dosyalarını, PHASE-06’dan devreden limitation’ların etkisini ve ilk güvenli adımı belirlemek için hazırlanmıştır.

## 2. Önceki Faz Durumu
- PHASE-01: PASS WITH LIMITATION
- PHASE-02: PASS WITH LIMITATION
- PHASE-03: PASS WITH LIMITATION
- PHASE-04: PASS WITH LIMITATION
- PHASE-05: PASS WITH LIMITATION
- PHASE-06: PASS WITH LIMITATION

## 3. PHASE-06’dan Devreden Aktif Limitation’lar
| Kod | Limitation | Etki | Hedef |
|---|---|---|---|
| 1 | Interaction/follow durable DB uniqueness yok | DEFER | PHASE-09 veya PHASE-12 |
| 2 | Social counter durable projection yok | DEFER | PHASE-09 |
| 3 | Story durable projection sınırlı | DEFER | PHASE-09 |
| 4 | Advanced story feed/ranking/discovery engine yok | BLOCKER | PHASE-07'de değerlendirilecek |
| 5 | Full maker-checker queue / assignment / approval UI yok | DEFER | PHASE-08 |
| 6 | Media/store-story moderation owner handoff genişletmesi eksik | DEFER | PHASE-08 |
| 7 | PHASE-05’ten devreden bazı finans/persistence limitation’ları | DEFER | PHASE-05 |

## 4. Okunan Roadmap / Planlama Dosyaları
| Dosya | Durum | PHASE-07 İçin Bulgu |
|---|---|---|
| `planlama/60-KODLAMAYA HAZIRLIK YOL HARİTASI.md` | FOUND | İlgili roadmap |
| `planlama/61-FULL_CAPACITY_CODING_ROADMAP.md` | FOUND | İlgili roadmap |
| `planlama/62-MASTER_IMPLEMENTATION_PLAN.md` | FOUND | İlgili roadmap |
| `planlama/63-IMPLEMENTATION_PROGRESS_MASTER.md` | FOUND | İlgili progress planı |
| `planlama/64-PACKAGE_EXECUTION_LOG.md` | FOUND | Log |
| `planlama/65-ACTIVE_RISKS_AND_DECISIONS.md` | FOUND | Risk register |
| `planlama/67-ROADMAP_ALIGNMENT_AND_PACKAGE_NUMBERING.md` | FOUND | Numaralandırma ve hizalama |
| `PHASE-06-CLOSURE-REPORT.md` | FOUND | Önceki faz raporu |
| `planlama 2/PHASE-07-SEARCH-CATALOG-RANKING-TAXONOMY-READINESS.md` | FOUND | PHASE-07 ana plan ve hazırlık dosyası |

## 5. PHASE-07 Kapsam Tespiti

**PHASE-07 adı:**
- Search / Catalog / Ranking / Taxonomy Readiness

**PHASE-07 ana kapsamı:**
- Arama sistemi ve indeksleme
- Kategori / PLP / Taxonomy
- Klasik ürün kartı listeleri
- PDP/catalog read projection bağlantısı
- Search intent / candidate owner ayrımları
- Ranking / recommendation owner ayrımları
- Dynamic facets ve filters
- Indexed category / storefront / product context
- OpenSearch production ops
- Pricing / stock / media projection sync

**PHASE-07 neden gerekli?**
- Kullanıcıya gösterilen arama, kategori, PLP, keşfet ve öneri yüzeyleri görünürlük, stok/fiyat projection, taxonomy, ranking ve index tutarlılığı açısından güvenli hale getirilmelidir. Yanlış ürünlerin veya stale verilerin (örn. askıya alınmış veya fiyatı güncellenmemiş) kullanıcılara görünmesini (leak) önlemek için kritiktir.

**PHASE-07 hangi sistem alanlarını etkiliyor?**
- Arama servisleri, kategori/taksonomi servisleri, katalog okuma (read projection), keşfet ve ana sayfa beslemeleri (ranking/recommendation).

**Kaynak:**
- `planlama 2/PHASE-07-SEARCH-CATALOG-RANKING-TAXONOMY-READINESS.md`

## 6. PHASE-07 İçin Gerekli Referans Dosyaları

| Dosya | Gerekçe | Durum |
|---|---|---|
| `planlama/12- Arama Sistemi.md` | Arama domain kuralları | FOUND |
| `planlama/51-arama  indeksleme sistemi.md` | İndeksleme ve OpenSearch ops | FOUND |
| `planlama/10-kategori-plp sistemi.md` | PLP ve kategori arayüz kuralları | FOUND |
| `planlama/52-kategori taksonomi sistemi.md` | Kategori ağacı ve owner truth | FOUND |
| `planlama/37-öneri ve sıralama sistemi.md` | Ranking/Recommendation kuralları | FOUND |
| `planlama/7-keşfet sistemi.md` | Keşfet feed ve candidate yapısı | FOUND |
| `planlama/9-ana sayfa sistemi.md` | Home feed | FOUND |
| `planlama/8-klasik ürün kart sistemi.md` | Kart projeksiyonları | FOUND |
| `planlama/4-pdp sistemi.md` | Catalog read projection | FOUND |
| `planlama/27-merkezi stok sistemi.md` | Stock projection sync | FOUND |
| `planlama/29-merkezi fiyat sistemi.md` | Pricing projection sync | FOUND |
| `planlama/50-medya sistemş asset  sitemi.md` | Media projection | FOUND |
| `planlama/1-havuz sistemi.md` | Temel havuz tanımları | FOUND |
| `planlama/25-kural -yetki sistemi.md` | Yetki kontrolleri | FOUND |

## 7. PHASE-06 Limitation’larının PHASE-07 Etkisi

| Limitation | PHASE-07 etkisi | Karar |
|---|---|---|
| Interaction/follow durable DB uniqueness | Ranking sinyallerini etkileyebilir ama PHASE-07 arama/katalog temelini engellemez | DEFER |
| Social counter durable projection | Home/Discover sıralama kalitesini düşürebilir | DEFER |
| Story durable projection | Story gösterim sıralamasını etkiler | DEFER |
| Advanced story feed/ranking/discovery | Keşfet ve ranking yüzeylerinin doğrudan temelini oluşturur. Bu fazda "discovery/ranking engine" sınırları netleştirileceği için bu limitation **doğrudan ilgilidir**. | BLOCKER |
| Full maker-checker workflow/UI | Admin/Moderasyon UI eksikliği, search index'i etkilemez | NO ACTION |
| Media/store-story owner handoff | Search index'e giren içeriklerin güncelliğini etkileyebilir ama moderation fazı (PHASE-06) kapandı. | DEFER |
| PHASE-05 finans/persistence limitation’ları | Fiyat projeksiyonlarının güncelliğini etkiler (stale data leak riski) | LIMITATION |

## 8. İlk Önerilen Adım

**Önerilen ilk adım:**
- `PHASE-07-SOURCE-REVIEW`

**Gerekçe:**
PHASE-07 doğrudan OpenSearch, Catalog Read Projection, Taxonomy Owner, Ranking Owner ve Search Boundary gibi mevcut mikroservis (örn. M9 ve M8) durumlarını içeriyor. Kodlama veya fix paketi açmadan önce mevcut codebase'in bu phase hedeflerine ne kadar yakın olduğunu, özellikle `search candidate ≠ final ranking`, `catalog projection ≠ commerce truth` ayrımlarının kodda nasıl uygulandığını ve `hidden/unavailable leak` olup olmadığını görmek için önce bir kod incelemesi (Source Review) yapılmalıdır.

## 9. PHASE-07 Başlangıç Kararı

**PHASE-07 başlangıç kararı:**
- **GO TO SOURCE REVIEW**

## 10. Sonraki Prompt İçin Hazırlık

PHASE-07’nin doğrulanmış kapsamına göre sıradaki Roo Code promptunda istenecekler:
- Okunacak sistem dosyaları: `12- Arama Sistemi.md`, `51-arama  indeksleme sistemi.md`, `10-kategori-plp sistemi.md`, `52-kategori taksonomi sistemi.md`, `37-öneri ve sıralama sistemi.md`, `4-pdp sistemi.md`
- Source review alanları: `apps/bff`, `services/catalog`, `services/search` (veya M9), `services/ranking` (veya M8), OpenSearch bağlantıları ve outbox consumer/worker'ları.
- Boundary kontrolleri: M9 (Search) intent/candidate sınırında kalıyor mu? M8 (Ranking) final ordering yapıyor mu? BFF search/ranking truth üretiyor mu? Catalog projection commerce truth olarak mutate ediliyor mu?
- Smoke/test gereksinimleri: `smoke:catalog-read`, `smoke:search`, `smoke:search-index-projection`, `hidden/unavailable leak test`, `taxonomy/facet mapping test`.
- Kapanış kriterleri: Search/Ranking owner boundary testlerinin doğrulanması, stale index veya hidden data leak olmaması.
- PHASE-06'dan devreden limitation bağlantıları: Advanced story feed/ranking limitation'ı bu fazda ranking (M8) incelenirken nasıl kapsanacak veya PHASE-09'a nasıl izole edilecek belirlenmeli.
