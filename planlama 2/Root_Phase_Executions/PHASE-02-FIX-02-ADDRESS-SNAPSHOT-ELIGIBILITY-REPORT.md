
# PHASE-02-FIX-02 Raporu: Checkout Adres Uygunluğu ve Snapshot Düzeltmesi

**Tarih:** 2026-05-08
**Durum:** TAMAMLANDI
**İlgili Blocker:** P2-B03 — Checkout address eligibility/snapshot kullanmıyor.

## 1. Amaç

Bu çalışma, PHASE-02 kaynak kodu incelemesinde tespit edilen **P2-B03** blocker'ını kapatmayı hedefler. Temel amaç, `checkout` süreci ödeme için hazır (`payment-ready`) kabul edilmeden önce adres ve iletişim bilgilerinin uygunluğunu zorunlu hale getirmek ve `checkout` oturumu boyunca bu bilgileri güvenli bir şekilde sabitlemektir (snapshot).

## 2. Yapılan Değişiklikler ve Gerekçeleri

### 2.1. Contract Güncellemesi (`packages/contracts/src/checkout.ts`)

- **Değişiklik:** `CheckoutAddressSnapshot` adında yeni bir `interface` tanımlandı. Bu arayüz, hem kayıtlı kullanıcıların seçili adresini (`REGISTERED_ADDRESS`) hem de misafir kullanıcıların girdiği adres bilgilerini (`GUEST_ADDRESS`) taşıyabilecek esnek bir yapı sunar.
- **Değişiklik:** `StartCheckoutCommand` ve `CheckoutReviewResponse` arayüzleri, isteğe bağlı (`?`) bir `addressSnapshot` alanı içerecek şekilde güncellendi.
- **Gerekçe:** Bu değişiklik, `checkout` başlatma isteğine adres bilgilerinin dahil edilmesini ve `checkout` yanıtında sabitlenmiş adresin döndürülmesini sağlayarak "Checkout içinde address snapshot veya eşdeğer sabitlenmiş teslimat bilgisi bulunmalı" kuralını karşılar.

### 2.2. Checkout Servis Mantığının Güncellenmesi (`services/checkout/src/checkout.ts`)

- **Değişiklik:** `@hx/customer-address` paketinden `checkCheckoutEligibility` ve `getCustomerAddress` fonksiyonları `import` edildi.
- **Değişiklik:** `startCheckout` fonksiyonunun başlangıcına, `checkCheckoutEligibility` fonksiyonunu çağıran bir kontrol eklendi. Eğer `eligible` değilse, `checkout` `BLOCKED` durumuna getirilir.
- **Değişiklik:** Misafir kullanıcılar (`GUEST`) için `command.addressSnapshot`'ın varlığı ve `recipientName`, `phone`, `city`, `addressLine` gibi minimum alanları içerip içermediği kontrolü eklendi. Eksikse, `checkout` `BLOCKED` durumuna getirilir ve `GUEST_ADDRESS_INCOMPLETE` hatası döndürülür.
- **Değişiklik:** Kayıtlı kullanıcılar (`CUSTOMER`) için, `command.addressSnapshot.addressId` kullanılarak `getCustomerAddress` ile adresin "truth" (doğru) verisi çekilir ve `finalAddressSnapshot` bu veriyle oluşturulur. Bu, UI veya BFF'ten gelen veriye güvenmek yerine, sistemin doğruladığı verinin kullanılmasını sağlar.
- **Gerekçe:** Bu mantık, "Registered customer için uygun/default shipping address yoksa checkout payment-ready olmamalı", "Guest checkout için minimum contact/address bilgisi yoksa checkout payment-ready olmamalı" ve "Address truth ile snapshot ayrılmalı" kurallarını doğrudan uygular.

### 2.3. Customer Address Servis Mantığının İyileştirilmesi (`services/customer-address/src/customer-address.ts`)

- **Değişiklik:** `checkCheckoutEligibility` fonksiyonu, misafir kullanıcılar için her zaman `eligible: true` döndürecek şekilde netleştirildi. Fonksiyon içi yorumlar, asıl sorumluluğun `checkout` servisinde olduğunu belirtecek şekilde güncellendi.
- **Gerekçe:** Bu değişiklik, sorumlulukların doğru ayrılmasını sağlar. `customer-address` servisi, bir müşterinin sistemsel olarak `checkout`'a uygun olup olmadığını (örn: hesabı kapalı mı, varsayılan adresi var mı) kontrol ederken, `checkout` servisi o anki `checkout` işlemi için sunulan (misafir adresi gibi) verilerin geçerliliğini kontrol eder.

### 2.4. Bağımlılık Yönetimi (`services/checkout/package.json`)

- **Değişiklik:** `@hx/checkout` paketinin `dependencies` listesine `@hx/customer-address` paketi eklendi (`"workspace:*"`).
- **Gerekçe:** Bu değişiklik, `checkout` servisinin `customer-address` servisindeki fonksiyonları çağırmasıyla ortaya çıkan `TS2307: Cannot find module` derleme hatasını gidermek için zorunluydu.

## 3. Kapanan Kurallar

1.  **Registered customer için uygun/default shipping address yoksa checkout payment-ready olmamalı:** **KAPANDI.** `checkCheckoutEligibility`, varsayılan sevkiyat adresi olmayan kayıtlı kullanıcılar için `eligible: false` döndürür ve `startCheckout` bu durumda işlemi `BLOCKED` olarak sonlandırır.
2.  **Guest checkout için minimum contact/address bilgisi yoksa checkout payment-ready olmamalı:** **KAPANDI.** `startCheckout`, misafir kullanıcılar için `addressSnapshot` ve zorunlu alanların varlığını kontrol eder. Eksikse `GUEST_ADDRESS_INCOMPLETE` hatasıyla işlemi `BLOCKED` olarak sonlandırır.
3.  **Checkout içinde address snapshot veya eşdeğer sabitlenmiş teslimat bilgisi bulunmalı:** **KAPANDI.** `CheckoutAddressSnapshot` `contract`'ı ve bu `contract`'ı kullanan `startCheckout` mantığı, adres bilgisini `CheckoutReviewResponse` içinde sabitler.
4.  **Address truth ile snapshot ayrılmalı:** **KAPANDI.** Kayıtlı kullanıcılar için `startCheckout`, `addressId` kullanarak `customer-address` servisinden adresin en güncel ("truth") halini alır ve `snapshot`'ı bu veriyle oluşturur.
5.  **Guest checkout sosyal hak veya customer eligibility açmamalı:** **KAPANDI.** Misafir kullanıcı adresi, `CustomerAddress` varlığına kaydedilmez; sadece o `checkout` işlemi için geçerli bir `snapshot` olarak kalır. `createCustomerAddress` fonksiyonu hala misafirlere kapalıdır.

## 4. Doğrulama

- Yapılan değişiklikler sonrası `pnpm run build` komutu çalıştırıldı ve tüm workspace paketlerinin başarıyla derlendiği doğrulandı.

## 5. Sonuç

**P2-B03** blocker'ı başarıyla kapatılmıştır. `Checkout` süreci artık ödeme aşamasına geçmeden önce hem kayıtlı hem de misafir kullanıcılar için adres uygunluğunu ve varlığını zorunlu kılmaktadır. Adres bilgileri, `checkout` oturumu boyunca güvenli bir şekilde `snapshot` olarak saklanmaktadır.
