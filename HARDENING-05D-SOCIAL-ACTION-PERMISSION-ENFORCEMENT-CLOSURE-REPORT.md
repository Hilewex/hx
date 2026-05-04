# HARDENING-05D — Social Action Permission Enforcement Closure Report

## 1. Kısa Özet
**(PASS)** Social domain (Review, Q&A, Follow, UGC) için yetki doğrulama ve rol tabanlı kısıtlamalar başarıyla entegre edilmiştir. Artık tüm sosyal aksiyonlar, Session/Context üzerinden alınan Actor bilgisi ile doğrulanmakta ve gerekli roller kontrol edilmektedir.

## 2. Referans Dosyalar
- `HARDENING-05B-PERMISSION-GUARD-INTEGRATION-CLOSURE-REPORT.md`
- `HARDENING-05-00-AUTH-SESSION-PERMISSION-INVENTORY.md`
- `planlama/66-referans dosyaları.md`
- `planlama/31-yorum ve puanlama sistemi.md`
- `planlama/32-soru cevap sistemi.md`
- `planlama/11-takip sistemi.md`

## 3. Değişen Dosyalar
- `apps/bff/src/server/guards.ts`
- `apps/bff/src/server/review.ts`
- `apps/bff/src/server/qa.ts`
- `apps/bff/src/server/follow.ts`
- `apps/bff/src/server/ugc.ts`
- `apps/bff/src/server/social.ts`
- `apps/bff/package.json`
- `tests/smoke/suites/social-permission.ts`

## 4. Social Permission Guard Standardı
Sosyal domain aksiyonları için oluşturulan ve kullanılan standart guard mekanizmaları:
- `requireSocialCustomerActor`: Sadece giriş yapmış ve Müşteri (Customer) yetkilerine sahip aktörlerin sosyal aksiyonlar (yorum yapma, soru sorma, takip etme) yapabilmesini sağlar.
- `requireOfficialAnswerActor`: Q&A domaininde resmi cevapları yalnızca yetkili aktörlerin (Mağaza Sahibi/Çalışanı vb.) verebilmesini sağlar.

## 5. Domain Uygulama Sonucu
- **Review (Yorum ve Puanlama):** Müşterilerin ürün yorumları yapması ve faydalı bulma aksiyonları guard ile koruma altına alındı.
- **Q&A (Soru-Cevap):** Soru sorma yetkisi müşterilerle sınırlandı, resmi cevap yetkisi ise mağaza yetkililerine (`OfficialAnswerActor`) bağlandı.
- **Follow (Takip):** Kullanıcıların mağazaları veya diğer fenomenleri takip etmesi, aktör doğrulamasına bağlandı.
- **UGC:** Kullanıcı tarafından oluşturulan içeriklerin (örn. postlar) yönetilmesi, aktörün doğrulanmasına ve ilgili rollerine bağlandı.

## 6. Legacy x-actor-id Durumu
05B'de sınırlaması belirtilen legacy `x-actor-id` header bağımlılığı, sosyal testlerden tamamen kaldırılmıştır. Smoke testleri, bu header olmadan başarılı bir şekilde geçmektedir (PASS). Bu sayede sosyal domain için yetki sınırları sıkılaştırılmıştır. Yüksek seviyeli kısıtlama maddesi sosyal domain için kapatılmıştır.

## 7. Negative Smoke/Test Sonuçları
Tüm senaryolar başarılı (PASS):
- Yetersiz yetki (Anonim) ile yorum yapma girişimi -> PASS
- Müşteri rolü olmadan soru sorma girişimi -> PASS
- Yetkisiz kullanıcının resmi cevap verme girişimi -> PASS
- Anonim kullanıcının mağaza takip etme girişimi -> PASS

## 8. Komut Sonuçları
- `pnpm typecheck`: PASS
- `pnpm build`: PASS
- `pnpm test:smoke`: Tüm social permission smoke testleri PASS

## 9. Boundary Review
- **Auth Boundary:** Token'dan Actor üretimi ve Session izolasyonu sağlandı.
- **Permission Boundary:** Tüm request'ler için Actor ve rol/yetki kontrolleri zorunlu tutuldu.
- **Eligibility Boundary:** Aksiyona özgü izinler korundu (örn. "official answer" yetkisi).
- **Domain Truth:** İş kuralları yetki bariyerinin arkasında izole bir şekilde tutularak güvenlik sağlandı.

## 10. Kalan Limitation'lar
Policy tabanlı detaylı kurallar (Policy Engine) tam olarak uygulanmamış olup, kompleks moderasyon süreçleri HARDENING-06'ya bırakılmıştır. Derin veri doğrulama işlemleri (Deep eligibility data bindings) ilerleyen fazlarda güçlendirilebilir. Ancak temel "Auth/Role Truth" (Giriş yapılmış mı? Doğru rolde mi?) sınırları tamamen güvence altına alınmıştır.

## 11. HARDENING-05E / HARDENING-06 Hazırlığı
Bu paket tamamlandıktan sonra sıradaki paket **HARDENING-05E — Commerce Action Permission Enforcement** olacaktır. Bu sayede sipariş, sepet ve ödeme işlemleri de benzer yetki güvenliğine kavuşacaktır. Moderasyon yetki kuralları ise HARDENING-06 kapsamında ele alınacaktır.

## 12. Nihai Karar
**PASS.** Sosyal aksiyonların tümü Actor bağlamına oturtuldu ve yetki doğrulamasıyla güvence altına alındı. Bir sonraki aşama (HARDENING-05E) için zemin hazır.

## 13. Son Not
Social domain yetkileri başarıyla izole edilmiş ve testleri `x-actor-id` bağımlılığından kurtarılmıştır. Genel güvenilirlik beklentisi karşılanmıştır.