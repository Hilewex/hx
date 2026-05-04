# HARDENING-06-00A — Moderation Workflow Inventory

## 1. Kısa Özet
- Bu paket inventory paketidir.
- Kod değişikliği yapılmadı.
- PASS/FAIL verilmedi.
- En kritik 5 moderation bulgusu:
    1. **Domain Isolation Breach:** Moderation kararları (APPROVE/REJECT) domain servislerinde (Post, Review, UGC) doğrudan "moderationStatus" alanını güncelliyor. Moderation servisi bu mutation'ları yapmıyor (Rule Breach).
    2. **Missing Integration:** `CreateModerationCase` komutu tanımlı olmasına rağmen, hiçbir domain servisi (Post, Review, UGC, Q&A) bir moderation vakası (Case) oluşturmuyor.
    3. **Circular Dependencies:** Domain servisleri moderation durumuna bakıyor, ancak moderation süreci tetiklenmiyor.
    4. **Persistence Inconsistency:** Moderation servisi Postgres desteğine sahip görünse de, idempotency tablolarını runtime'da `CREATE TABLE IF NOT EXISTS` ile oluşturmaya çalışıyor (Migration eksikliği).
    5. **Role Guard Lack:** BFF'de `handleCreateModerationCase` sadece `requireAuthenticated` ile korunuyor, herhangi bir Guest/Customer vaka oluşturabilir.

## 2. Referans Dosya Kontrolü
| Dosya | Durum | Not |
|---|---|---|
| HARDENING_PROGRESS_RECORD.md | NOT FOUND | Ana dizinde bulunamadı, planlama dizininde (1) versiyonu var. |
| HARDENING-05C-PANEL-ADMIN-CREATOR-ROUTE-PROTECTION-CLOSURE-REPORT.md | FOUND | Guard yapıları için referans alındı. |
| HARDENING-05D-SOCIAL-ACTION-PERMISSION-ENFORCEMENT-CLOSURE-REPORT.md | FOUND | Social domain guard'ları incelendi. |
| HARDENING-05E-SR-CLOSURE-REPORT.md | FOUND | Commerce guard'ları incelendi. |
| HARDENING-04B-CLOSURE-REPORT.md | FOUND | Backend hardening standartları. |
| HARDENING-04R-CLOSURE-REPORT.md | FOUND | Repository pattern standartları. |
| planlama/21-post sistemi.md | FOUND | Post akışı incelendi. |
| planlama/31-yorum ve puanlama sistemi.md | FOUND | Review akışı incelendi. |
| planlama/32-soru cevap sistemi.md | FOUND | Q&A akışı incelendi. |
| planlama/34-kullanıcı story sistemi.md | FOUND | UGC akışı incelendi. |
| planlama/50-medya sistemş asset sitemi.md | FOUND | Media/Asset moderasyonu incelendi. |
| planlama/40-admin sistemi.md | FOUND | Panel yetkileri incelendi. |
| planlama/25-kural -yetki sistemi.md | FOUND | Role mapping incelendi. |
| planlama/62-MASTER_IMPLEMENTATION_PLAN.md | FOUND | Genel roadmap referansı. |

## 3. İncelenen Repo Dosyaları
| Alan | Dosya/Yol | Durum | Not |
|---|---|---|---|
| Contracts | `packages/contracts/src/moderation.ts` | FOUND | Case, Snapshot, Decision modelleri tam. |
| Service | `services/moderation/src/moderation.ts` | FOUND | CreateCase ve ReviewCase logicleri mevcut. |
| Repository | `services/moderation/src/repository/` | FOUND | Postgres ve In-Memory implementasyonları var. |
| BFF Handler | `apps/bff/src/server/moderation.ts` | FOUND | Route handler'lar mevcut. |
| Guards | `apps/bff/src/server/guards.ts` | FOUND | `requireModerationOperator` tanımlı. |
| Domain | `services/post/src/post.ts` | FOUND | `moderationStatus` var ama entegrasyon yok. |

## 4. Moderation Contract Inventory
| Bileşen | Dosya | Gerçek Durum | Kanıt | Risk |
|---|---|---|---|---|
| TargetType | `moderation.ts:1` | Mevcut | `STORE_POST`, `UGC`, `REVIEW`, vb. | Düşük |
| Case Model | `moderation.ts:71` | Mevcut | `ModerationCase` interface. | Düşük |
| Decision Model | `moderation.ts:20` | Mevcut | `APPROVE`, `REJECT`, `ESCALATE`, vb. | Düşük |
| Truth Flags | `moderation.ts:85` | Mevcut | `moderationTruth: true`, `targetTruthMutated: false`. | Düşük |
| Mutated Flags | `moderation.ts:87-92` | Mevcut | `postTruthMutated`, `ugcTruthMutated` vb. | Düşük |

## 5. Moderation Service Inventory
| Fonksiyon/Akış | Dosya | Mevcut Davranış | Boundary Durumu | Risk |
|---|---|---|---|---|
| createModerationCase | `moderation.ts:48` | Vaka oluşturur, Audit/Outbox yazar. | SAFE | Vaka oluşturulduğunda target domain'e dokunmuyor. |
| reviewModerationCase | `moderation.ts:154` | Karar verir, status günceller. | SAFE | Karar sonrası target domain mutation tetiklemiyor (Sadece log atıyor). |
| Persistence | `repository/postgres.ts` | Postgres ve In-memory destekli. | SAFE | Schema/Migration eksik, runtime'da tablo yaratmaya çalışıyor. |
| targetTruthMutated | `moderation.ts:135` | Daima `false` set ediliyor. | SAFE | Henüz domain mutation logic implemente edilmemiş. |

## 6. Moderation BFF Route Inventory
| Route/Handler | Method | Action | Actor Guard | Target Domain | Risk |
|---|---|---|---|---|---|
| handleCreateModerationCase | POST | Case Create | `requireAuthenticated` | Moderation | Yüksek (Customer vaka yaratabilir) |
| handleReviewModerationCase | POST | Case Review | `requireModerationOperator` | Moderation | Düşük |
| handleGetModerationCase | GET | View Case | `requireModerationOperator` | Moderation | Düşük |
| handleListModerationCases | GET | List Cases | `requireModerationOperator` | Moderation | Düşük |

## 7. Social Content Moderation Coverage

### 7.1 Post
| Domain | Moderation Bağlantısı | Eksik | Risk | Önerilen Paket |
|---|---|---|---|---|
| Post | `moderationStatus` alanı var. | Vaka (Case) oluşturma tetikleyicisi eksik. | Yüksek | HARDENING-06A Foundation |

### 7.2 Review
| Domain | Moderation Bağlantısı | Eksik | Risk | Önerilen Paket |
|---|---|---|---|---|
| Review | `moderationStatus` ve `visibilityState` var. | Entegrasyon (Call/Event) eksik. | Yüksek | HARDENING-06A Foundation |

### 7.3 Q&A
| Domain | Moderation Bağlantısı | Eksik | Risk | Önerilen Paket |
|---|---|---|---|---|
| Q&A | `moderationStatus` alanı var. | Moderation servisiyle hiçbir iletişim yok. | Yüksek | HARDENING-06A Foundation |

### 7.4 UGC / User Product Story
| Domain | Moderation Bağlantısı | Eksik | Risk | Önerilen Paket |
|---|---|---|---|---|
| UGC | `moderationStatus` ve `visibilityState` var. | Logic sadece internal status update yapıyor. | Yüksek | HARDENING-06A Foundation |

### 7.5 Media
| Domain | Moderation Bağlantısı | Eksik | Risk | Önerilen Paket |
|---|---|---|---|---|
| Media | `MediaModerationStatus` enum kullanılıyor. | Moderation süreci Media servisi içinde izole (Circular risk). | Orta | HARDENING-06B Media Hardening |

## 8. Audit / Event / Outbox Inventory
| Alan | Audit Var mı? | Event Var mı? | Persistence | Risk |
|---|---|---|---|---|
| Create Case | Evet | Evet (Outbox) | Evet | Düşük |
| Review Case | Evet | Evet (Outbox) | Evet | Düşük |

## 9. Panel / Admin Surface Inventory
| Dosya/Surface | Kullanım | Direct Write Riski | Guard Durumu | Risk |
|---|---|---|---|---|
| apps/panel/src/* | Mock/Smoke yapılar | Düşük | Mevcut değil (BFF üzerinden guard bekliyor) | Orta |

## 10. Cross-System Boundary Riskleri
| Risk | Kanıt | Etki | Önerilen Paket |
|---|---|---|---|
| Domain Mutation Leak | Domain servisleri `moderationStatus`'u kendisi set ediyor. | Moderasyon kararı bypass edilebilir veya tutarsızlık oluşur. | HARDENING-06A Foundation |
| Missing Orchestration | Hiçbir servis `createModerationCase` çağırmıyor. | Moderasyon kuyruğu daima boş kalır. | HARDENING-06A Foundation |
| Role Overlap | `handleCreateModerationCase` guard'ı zayıf. | Sistem spam vaka raporlarıyla doldurulabilir. | HARDENING-05 Hardening |

## 11. HARDENING-06A İçin Öneri
HARDENING-06A — Moderation Workflow Foundation Hardening için:
| Kapsam | Yapılacak | Dışarıda Bırakılacak | Kabul Kanıtı |
|---|---|---|---|
| Integration | Domain servislerinin `createModerationCase` çağırması. | Otomatik AI Moderasyonu (şuanlık). | Smoke testlerde vaka oluşumu. |
| Security | BFF Route Guard'larının sıkılaştırılması. | Yeni Role tanımları. | `requireModerationOperator` kontrolü. |
| Isolation | Domain servislerinin kendi statuslerini "MODERATION_PENDING" dışında set etmemesi. | Karar sonrası otomatik mutation (06B/C konusu). | Kod analizi (No direct APPROVED write). |

## 12. Komut/Test Status
Bu inventory paketinde komut zorunlu değildir.
| Komut | Çalıştırıldı mı? | Sonuç | Not |
|---|---|---|---|
| `search_files` | Evet | SUCCESS | Repo genelinde moderation taraması yapıldı. |
| `read_file` | Evet | SUCCESS | Contract ve Servis implementasyonları incelendi. |

## 13. Nihai Karar
- HARDENING-06-00A inventory paketidir.
- Kod değişikliği yapılmadı.
- Sistem PASS/FAIL verilmedi.
- Moderation repo gerçekliği çıkarıldı.
- **HARDENING-06A için önerilen yön:** Domain servislerinin (Post, UGC, Review) vaka oluşturma mekanizmalarının entegre edilmesi ve domain servislerinin moderasyon kararlarını beklemesinin zorunlu kılınması.
- **En kritik P0 riskler:** Domain servislerinin moderasyon kararlarını simüle ederek kendi statuslerini `APPROVED` set etmesi (Isolation Breach).
