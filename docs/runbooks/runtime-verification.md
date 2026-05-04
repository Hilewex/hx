# Runtime Verification Standard

Bu belge, lokal geliştirme ve test süreçlerinde BFF, Web ve Panel uygulamalarının nasıl güvenli ve standartlara uygun şekilde başlatılıp doğrulanacağını açıklar.

## Kurallar ve Disiplinler

1. **Bilinçsiz `taskkill` Yasaktır:** `taskkill /IM node.exe /F` veya benzeri kaba kuvvet yöntemleri yasaktır. Bu tür komutlar VSCode, Next.js, veya diğer arkaplan görevlerini bozarak ortamı tutarsız hale getirir.
2. **Sahte Yanıtlar Başarı Sayılmaz:** HTML 404 sayfası veya başka bir proxy hata sayfası JSON yanıtı olarak kabul edilmez. Hedef port netleştirilmeli ve beklenen *şema* (Örn: `HealthResponse`) alınmadan işlem başarılı sayılmamalıdır.
3. **Port Yönetimi:** Uygulamalar her zaman belirlenmiş portlarda çalışmalı, port çakışmalarından kaynaklı hatalar düzeltilmeden devam edilmemelidir.

## Güvenli Başlatma ve Doğrulama Adımları

### 1. BFF (Backend For Frontend)
BFF, monorepo'daki diğer servislerin de kullanacağı ana gateway'dir.

*   **Başlatma Komutu:** `pnpm dev:bff`
*   **Doğrulama Portu:** Varsayılan olarak `3000` (veya `PORT` env değişkeni).
*   **Başarı Endpoint'i:** `GET /health`
*   **Beklenen Çıktı:** 
    ```json
    {
      "status": "ok",
      "version": "1.0.0",
      "timestamp": "2026-04-23T00:00:00.000Z"
    }
    ```

### 2. Web Shell
*   **Başlatma Komutu:** `pnpm dev:web`
*   **Doğrulama Portu:** Gelecekte Next.js veya Vite için belirlenecek varsayılan port (Örn: 3001).
*   **Başarı Kanıtı:** Uygulamanın loglarında veya browser tarafında "Web App Shell Mounted" ibaresinin görülmesi.

### 3. Panel Shell
*   **Başlatma Komutu:** `pnpm dev:panel`
*   **Doğrulama Portu:** Gelecekte belirlenecek panel varsayılan portu (Örn: 3002).
*   **Başarı Kanıtı:** Uygulamanın loglarında "Panel App Shell Mounted" ibaresinin görülmesi.

## Güvenli Process Sonlandırma

Arkaplan process'lerini kapatmak gerekirse, port bazlı hedefli kill yöntemlerini kullanın:
*   Örnek (Windows): `Get-NetTCPConnection -LocalPort 3000 | Select-Object -ExpandProperty OwningProcess | Stop-Process -Force`
*   Veya pnpm dev process'ini çalıştırdığınız terminali gracefully kapatın (CTRL+C).
