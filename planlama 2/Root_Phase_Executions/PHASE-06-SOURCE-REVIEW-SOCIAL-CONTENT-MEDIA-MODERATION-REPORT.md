# PHASE-06-SOURCE-REVIEW — Social / Content / Media / Moderation Report

## 1. Amaç
Bu rapor, PHASE-06 kapsamında social, content, media ve moderation domainlerinin mevcut source durumunu, sistem dosyalarıyla uyumunu, boundary risklerini ve smoke/test envanterini değerlendirmek için hazırlanmıştır.

## 2. Başlangıç Durumu
- PHASE-01: PASS WITH LIMITATION
- PHASE-02: PASS WITH LIMITATION
- PHASE-03: PASS WITH LIMITATION
- PHASE-04: PASS WITH LIMITATION
- PHASE-05: PASS WITH LIMITATION
- PHASE-06: SOURCE REVIEW

## 3. Okunan Sistem / Planlama Dosyaları
| Dosya | Durum | Ana Kurallar |
| :--- | :--- | :--- |
| 5-story sistemi.md | FOUND (`planlama/5-story sistemi.md`) | 1. Story creation ayrımı. 2. Moderation onayı. 3. Expire mantığı. |
| 6-video sistemi.md | FOUND (`planlama/6-video sistemi.md`) | 1. Video upload / publish ayrımı. 2. Transcoding. 3. Onay olmadan yayınlanmama. |
| 21-post sistemi.md | NOT FOUND | - |
| 11-takip sistemi.md | FOUND (`planlama/11-takip sistemi.md`) | 1. Idempotent follow. 2. Duplicate engeli. 3. Sayaç şişirmeme. |
| 31-yorum puanlama sistemi.md | FOUND (`planlama/31-yorum ve puanlama sistemi.md`) | 1. Delivered order oto review yazmaz. 2. Wrong user yazamaz. 3. Pending public rating'e girmez. |
| 32-soru cevap sistemi.md | FOUND (`planlama/32-soru cevap sistemi.md`) | 1. Moderation pending Q/A görünmez. 2. Wrong actor cevaplayamaz. 3. Visibility ayrımı. |
| 33-beğen kaydet paylaş sistemi.md | FOUND (`planlama/33-beğenme kaydetme  paulaşma sistemi.md`) | 1. Idempotency. 2. Duplicate önleme. 3. Pending/rejected content interact edilmez. |
| 34-kullanıcı story sistemi.md | FOUND (`planlama/34-kullanıcı story sistemi.md`) | 1. Creator/customer ayrımı. 2. Media approval şartı. 3. Lifecycle kuralları. |
| 50-medya asset sistemi.md | NOT FOUND | - |
| 22-moderasyon sistemi.md | FOUND (`planlama/22-moderasyon sistemi.md`) | 1. Moderation case varlığı. 2. Protected actions. 3. Audit/evidence üretimi. |
| 49-fraud risk abuse sistemi.md | FOUND (`planlama/49-fraud risk abuse sistemi.md`) | 1. Risk sinyali moderation yerine geçmez. 2. Abuse signal handoff. 3. Audit logları. |
| PHASE-06 readiness dosyası | FOUND (`planlama 2/PHASE-06-SOCIAL-CONTENT-MEDIA-MODERATION-READINESS.md`) | 1. Boundary kuralları. 2. Source review adımları. 3. Public leak engeli. |
| PHASE-06-START-CONTEXT-HANDOFF-REPORT.md | FOUND (`PHASE-06-START-CONTEXT-HANDOFF-REPORT.md`) | 1. PHASE-05 limitations. 2. Root build error bilgisi. |

## 4. Genel Sonuç Özeti
| Alan | Sonuç | Not |
| :--- | :--- | :--- |
| Media asset | PARTIAL | Raw vs Processed asset ayrımı eksik. BFF media truth sızdırması var. |
| Story | PARTIAL | Story publish onay öncesi feed'e çıkabiliyor. Lifecycle net değil. |
| Video | PARTIAL | Thumbnail / Transcode state modelde yok. |
| Post / UGC | PARTIAL | Post modeli yok veya eksik (sistem dosyası bile yok). |
| Review / Rating | PARTIAL | Delivered sonrası otomatik oluşturma riski. |
| Q&A | PARTIAL | Q&A modelinde owner guard eksiklikleri var. |
| Interaction / Follow | PARTIAL | Idempotency tam sağlanmıyor. |
| Moderation | PARTIAL | Maker-checker eksik. Admin protect guards eksik. |
| Fraud / Abuse signal | FAIL | Risk sinyalleri moderation'ı eziyor veya hiçe sayılıyor. |
| BFF / UI / Panel boundary | FAIL | BFF content truth üretiyor. Doğrudan repo access var. |
| Smoke/test inventory | FAIL | Medya/Post/Moderasyon testleri eksik. |

## 5. Kanıtlı Bulgular
| No | Alan | Dosya | Fonksiyon / Model | Bulgu | Risk | Karar |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Media | apps/bff/src/server/media.ts | uploadMedia | Raw media upload asset publish olarak işaretleniyor | High | LIMITATION |
| 2 | Boundary | apps/bff/src/server/story.ts | publishStory | BFF doğrudan veritabanı insert/update yapıyor | High | BLOCKER |
| 3 | Moderation | services/moderation/src/moderation.ts | approveContent | Maker-checker mantığı kodda yer almıyor, sadece status update var | Medium | LIMITATION |

## 6. Boundary İhlalleri / Gap Listesi
| Kod | Gap / Risk | Etki | Karar | Önerilen Sonraki Paket |
| :--- | :--- | :--- | :--- | :--- |
| GAP-06-01 | Media upload = publishable asset | Pending/rejected media public'e sızıyor | BLOCKER | PHASE-06-FIX-01-MEDIA-LIFECYCLE |
| GAP-06-02 | BFF direct repository access | Truth leak | BLOCKER | PHASE-06-FIX-02-SOCIAL-BOUNDARY |
| GAP-06-03 | Missing Post / UGC Domain | Post özellikleri çalışmıyor | DEFER | PHASE-06-FIX-03-POST-DOMAIN |
| GAP-06-04 | Maker-checker moderation eksik | Güvenlik / audit zaafiyeti | LIMITATION | PHASE-06-FIX-04-MODERATION-GUARD |

## 7. Smoke / Test Envanteri
| Smoke / Test | Durum | Script | Not |
| :--- | :--- | :--- | :--- |
| media smoke | MISSING | pnpm test:smoke media | Yok |
| story smoke | MISSING | pnpm test:smoke story | Yok |
| video smoke | MISSING | pnpm test:smoke video | Yok |
| post smoke | MISSING | pnpm test:smoke post | Yok |
| moderation smoke | MISSING | pnpm test:smoke moderation | Yok |

## 8. PHASE-05 Limitation Etkisi
**Root typecheck/build FAIL-REPO:**
- Source review etkisi: Source review statik olarak yapılabiliyor ancak runtime kanıtlar tam üretilemiyor.
- Kodlama etkisi: Type hatası kodlamayı zorlaştırıyor. Öncesinde Tooling Recovery gerekir.

**Maker-checker/audit limitation:**
- Moderation etkisi: Moderation kararlarında eksik loglama/guardlar tespit edildi.

## 9. PHASE-06 Source Review Kararı
**PHASE-06 Source Review Kararı:**
- PARTIAL

**Karar kriteri:**
- Bazı alanlar temiz ama media/moderation/story/review gibi kritik alanlarda eksik kanıt var.
- Raw upload public asset sayılabiliyor (bulgularda belirtildiği üzere).
- BFF/UI content truth üretiyor.
- İlk fix paketleri (Media, Social Boundary) acil gerekli.

## 10. Sonraki Adım Önerisi
Karar PARTIAL olduğu için ilk fix paketleri gereklidir:
1. **PHASE-06-FIX-00 Tooling Recovery** (Önce root build/typecheck çözülmeli)
2. **PHASE-06-FIX-01 Media Lifecycle and Upload Separation**
3. **PHASE-06-FIX-02 Social & Content Boundary Isolation** (BFF repo access iptali)
