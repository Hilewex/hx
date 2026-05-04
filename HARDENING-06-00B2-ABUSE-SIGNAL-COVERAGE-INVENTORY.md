# HARDENING-06-00B2 — Abuse Signal Coverage Inventory

## 1. Kısa Özet
- Bu paket inventory paketidir.
- Kod değişikliği yapılmadı.
- PASS/FAIL verilmedi.
- En kritik 5 abuse signal bulgusu:
    1. **Signal Generation Gap:** Social, Commerce ve Creator domainlerinde "Abuse Signal" üreten hiçbir aktif kod bloğu bulunamadı. Servisler sadece pasif durum güncellemeleri (moderationStatus) yapıyor.
    2. **Risk Service Isolation:** Risk servisi zengin bir contract yapısına (`COUPON_ABUSE`, `INTERACTION_MANIPULATION` vb.) sahip olmasına rağmen, hiçbir domain servisi bu sinyalleri Risk servisine göndermiyor.
    3. **Fake Review/Follow Protection Lack:** Fake review veya fake follow tespiti yapacak herhangi bir anomali tespit motoru veya sinyal yakalayıcı mevcut değil.
    4. **Guest Commerce Abuse Blindness:** Guest checkout ve ödeme akışlarında risk/fraud analizi yapılmıyor; sistem sadece sepet sahipliği doğrulaması yapıyor.
    5. **Manual-Only Intervention:** Mevcut sistem tamamen manuel moderasyon kararlarına (`APPROVED`/`REJECTED`) dayanıyor; abuse sinyallerine dayalı otomatik bir önleyici (decision/queue) mekanizma yok.

## 2. Referans Dosya Kontrolü
| Dosya | Durum | Not |
|---|---|---|
| HARDENING-06-00A-MODERATION-WORKFLOW-INVENTORY.md | FOUND | Moderasyon izolasyon kuralları referans alındı. |
| HARDENING-06-00B1-RISK-FRAUD-CORE-INVENTORY.md | FOUND | Risk core yapısı ve contract'lar incelendi. |
| HARDENING-05D-SOCIAL-ACTION-PERMISSION-ENFORCEMENT-CLOSURE-REPORT.md | FOUND | Social domain permission guard'ları incelendi. |
| HARDENING-05E-SR-CLOSURE-REPORT.md | FOUND | Commerce domain permission guard'ları incelendi. |
| planlama/49-fraud risk abuse sistemi.md | FOUND | Abuse sinyal tipleri ve strateji referansı. |

## 3. İncelenen Repo Dosyaları
| Alan | Dosya/Yol | Durum | Not |
|---|---|---|---|
| Social | `services/review/src/review.ts` | FOUND | `trustMetadata` ve `verifiedPurchaseLabel` var, abuse sinyali yok. |
| Social | `services/question-answer/src/qa.ts` | FOUND | Moderation status takibi var, spam tespiti yok. |
| Social | `services/ugc/src/ugc.ts` | FOUND | `visibilityState` yönetimi var, abuse sinyali yok. |
| Social | `services/follow/src/follow.ts` | FOUND | Sadece limit kontrolü var, fake follow tespiti yok. |
| Social | `services/post/src/post.ts` | FOUND | Moderation status takibi var, abuse sinyali yok. |
| Commerce | `services/payment/src/payment.ts` | FOUND | Ödeme simülasyonu var, anomali tespiti yok. |
| Commerce | `services/order/src/order.ts` | FOUND | Sipariş oluşturma var, fraud kontrolü yok. |
| Commerce | `services/commerce/src/` | FOUND | Checkout ve sepet yönetimi var, abuse kontrolü yok. |
| Creator | `services/storefront/src/storefront.ts`| FOUND | Suspend/Reactivate logic'i var, davranış analizi yok. |
| Risk | `packages/contracts/src/risk.ts` | FOUND | Zengin Abuse sinyal tipleri (v1) mevcut. |
| Risk | `services/risk/src/risk.ts` | FOUND | Signal ingest logic'i var ama tetikleyen yok. |

## 4. Social Abuse Coverage
| Abuse Alanı | Sinyal Var mı? | Aksiyon Var mı? | Kanıt | Risk |
|---|---|---|---|---|
| Fake review | HAYIR | HAYIR | Kodda `ratingImpactActive: false` sabit duruyor. | Yüksek |
| Review spam | HAYIR | Kısmi | Sadece default 20 limit var, rate limiting yok. | Yüksek |
| Q&A spam | HAYIR | HAYIR | Spam tespiti yapan logic bulunamadı. | Yüksek |
| Fake follow | HAYIR | Kısmi | Sadece default 50 limit var, anomali tespiti yok. | Yüksek |
| UGC abuse | HAYIR | HAYIR | Sadece manuel moderasyon status takibi var. | Orta |
| Post spam | HAYIR | HAYIR | Spam tespiti yapan logic bulunamadı. | Yüksek |
| Media abuse reference | HAYIR | HAYIR | `MediaModerationStatus` var ama abuse sinyali yok. | Orta |

## 5. Commerce Abuse Coverage
| Abuse Alanı | Sinyal Var mı? | Aksiyon Var mı? | Kanıt | Risk |
|---|---|---|---|---|
| Guest checkout abuse | HAYIR | HAYIR | Guest sepet ekleyebiliyor, sınır yok. | Yüksek |
| Payment anomaly | HAYIR | HAYIR | Ödeme akışında risk sinyali üretilmiyor. | P0 |
| Order fraud | HAYIR | HAYIR | Sipariş akışında fraud kontrolü yok. | P0 |
| Refund abuse | HAYIR | HAYIR | İade akışında abuse kontrolü yok. | Orta |
| Coupon/point abuse | HAYIR | HAYIR | Kupon/Puan servislerinde risk kontrolü yok. | Yüksek |
| Payout abuse reference | HAYIR | HAYIR | Payout review manuel, otomatik sinyal yok. | Orta |

## 6. Creator / Storefront Abuse Coverage
| Abuse Alanı | Sinyal Var mı? | Aksiyon Var mı? | Kanıt | Risk |
|---|---|---|---|---|
| Creator fake engagement | HAYIR | HAYIR | Engagement sinyalleri (beğeni/takip) ham kullanılıyor. | Yüksek |
| Storefront spam | HAYIR | HAYIR | Storefront oluşturmada spam kontrolü yok. | Orta |
| Product/media abuse | HAYIR | HAYIR | Sadece manuel admin review mekanizması var. | Orta |
| Suspicious creator behavior| HAYIR | HAYIR | Davranış modeli veya risk skoru yok. | Yüksek |

## 7. Risk / Moderation Bağlantısı
| Sinyal | Risk Service’e Bağlı mı? | Moderation Case’e Bağlı mı? | Eksik | Risk |
|---|---|---|---|---|
| Abuse Signals | HAYIR | HAYIR | Hiçbir domain sinyal üretip göndermiyor. | P0 |
| Risk Decisions | HAYIR | HAYIR | Risk kararları (HOLD) domain'lere ulaşmıyor. | Yüksek |
| Moderation Sync | HAYIR | HAYIR | Risk vakası ile Moderation vakası kopuk. | Orta |

## 8. Boundary Riskleri
| Risk | Kanıt | Etki | Önerilen Paket |
|---|---|---|---|
| Abuse signal owner mutation | Domain servisleri `moderationStatus`'u kendisi set ediyor. | Karar verici otorite (Moderation) bypass ediliyor. | HARDENING-06C |
| Risk/Abuse Silence | Hiçbir servis `createRiskSignal` çağırmıyor. | Platform suistimallere karşı tamamen kör. | HARDENING-06D |
| Guest Abuse Blindness | Guest checkout'ta hiçbir limit veya risk kontrolü yok. | Botlar aracılığıyla stok kilitleme veya ödeme spam'i riski. | HARDENING-06D |
| Fake Engagement Inflation | Beğeni/Takip sayıları doğrudan truth olarak kullanılıyor. | Fenomen puanları ve sıralamalar manipüle edilebilir. | HARDENING-06C |

## 9. HARDENING-06C / 06D İçin Öneri
| Paket | Amaç | Kapsam | Dışarıda Bırakılacak | Kabul Kanıtı |
|---|---|---|---|---|
| HARDENING-06C | Social Content & Engagement Abuse Enforcement | Review, Follow, Post spam tespiti ve sinyal üretimi. | Otomatik AI engelleme (sadece sinyal). | Smoke testte fake follow sinyali üretimi. |
| HARDENING-06D | Commerce Abuse & Fraud Guard Integration | Payment ve Order akışlarına Risk Signal entegrasyonu. | Finansal blokaj (sadece sinyal/hold önerisi). | Smoke testte şüpheli ödeme sinyali üretimi. |

## 10. Komut/Test Durumu
Bu inventory paketinde komut zorunlu değildir.
Çalıştırılmadı (NOT RUN).

| Komut | Çalıştırıldı mı? | Sonuç | Not |
|---|---|---|---|
| search_files | Evet | SUCCESS | Repo genelinde abuse/risk taraması yapıldı. |
| list_files | Evet | SUCCESS | Test suite'leri kontrol edildi. |

## 11. Nihai Karar
- HARDENING-06-00B2 inventory paketidir.
- Kod değişikliği yapılmadı.
- Sistem PASS/FAIL verilmedi.
- Abuse signal coverage repo gerçekliği çıkarıldı.
- **HARDENING-06C için önerilen yön:** Social domain servislerinin (özellikle Review ve Follow) şüpheli aktiviteleri algılayıp Risk servisine sinyal göndermesinin sağlanması.
- **HARDENING-06D için önerilen yön:** Ödeme ve Sipariş akışlarının "Risk-Aware" hale getirilmesi, kritik adımlarda Risk servisinden "Advisory Decision" alınması.
- **En kritik P0 riskler:** Hiçbir domain servisinin abuse/risk sinyali üretmiyor olması ve Risk servisinin platformdan tamamen izole (pasif) kalması.
