# FAZ-5F-BFF-AUTH-RUNTIME-RESOLUTION-FIX-REPORT

## 1. CI milestone ozeti

Gercek Linux CI run'da asagidaki milestone'lar gecildi:

- `pnpm install --frozen-lockfile`
- `build:prod:packages`
- `build:prod:services`
- `build:prod:bff`
- `build:prod:panel`
- `build:prod:web`
- `verify:web:standalone`
- web standalone startup smoke

Kalan fail noktasi BFF production startup smoke idi.

## 2. BFF startup hata ozeti

CI hatasi:

```text
ERR_MODULE_NOT_FOUND
Cannot find module '/home/runner/work/hx/hx/services/auth/src/token' imported from /home/runner/work/hx/hx/services/auth/src/index.ts
```

BFF compiled runtime `@hx/auth` paketini yuklerken package metadata `src/index.ts` girisine gidiyordu. Bu kaynak dosyada extensionless `export * from './token'` kullanildigi icin Node ESM runtime Linux ortaminda `services/auth/src/token` modülünü cozemedi.

## 3. Incelenen auth/BFF package/tsconfig/import yapisi

Incelenen dosyalar:

- `services/auth/src/index.ts`
- `services/auth/src/token.ts`
- `services/auth/src/auth.ts`
- `services/auth/package.json`
- `services/auth/tsconfig.json`
- `apps/bff/package.json`
- `apps/bff/tsconfig.json`
- `tsconfig.base.json`

Bulgu ozeti:

- `services/auth/package.json` eski durumda `"main": "src/index.ts"` gosteriyordu.
- `services/auth/package.json` eski durumda `types` alani yoktu.
- `services/auth/tsconfig.json` `outDir: ./dist` ve `rootDir: ./src` ile `dist/index.js` ve `dist/index.d.ts` uretiyor.
- `apps/bff/dist/server/context.js` runtime'da `require("@hx/auth")` cagiriyor.
- `services/auth/src/index.ts` `export * from './token'` ve `export * from './auth'` kullaniyor.
- `services/auth/src/auth.ts` `import { validateAuthToken } from './token'` kullaniyor.
- `tsconfig.base.json` CommonJS output uretiyor; compiled `dist` ciktilari Node CJS runtime tarafinda calisabilir durumda.

Benzer production-main standardi olarak bazi service package'lar `dist/index.js` ve `dist/index.d.ts` kullaniyor: `@hx/cancel-return`, `@hx/commerce`, `@hx/order-ops`, `@hx/post`, `@hx/question-answer`, `@hx/review`, `@hx/service-store-message`, `@hx/service-store-post`, `@hx/store-story`, `@hx/ugc`.

## 4. Kok neden

Kok neden domain logic degil, package runtime metadata uyumsuzlugu idi.

`@hx/auth` build ile `dist/index.js` uretmesine ragmen package `main` alani production runtime'i `src/index.ts` dosyasina yonlendiriyordu. BFF production build'i compiled JS olsa da `require("@hx/auth")` cagrisi Node package resolution nedeniyle auth source TS girisine dusuyordu. Source TS dosyasindaki extensionless relative export ESM loader tarafinda extension bekleyen runtime path'e donustu ve Linux CI'da `ERR_MODULE_NOT_FOUND` verdi.

## 5. Yapilan minimum degisiklik

Sadece `services/auth/package.json` guncellendi:

```json
{
  "main": "dist/index.js",
  "types": "dist/index.d.ts"
}
```

Domain logic, build orchestration, workflow, Dockerfile, Compose veya Kubernetes dosyasi degistirilmedi.

## 6. Lokal BFF startup dogrulama sonucu

Calistirilan dogrulamalar:

```text
pnpm --filter @hx/auth build
pnpm --filter @hx/bff build
```

Sonuc: ikisi de basarili.

Auth package runtime resolution izole kontrol:

```text
apps/bff> node -e "const auth = require('@hx/auth'); console.log(typeof auth.validateAuthToken, typeof auth.issueDevAuthToken)"
function function
```

BFF production startup smoke:

```text
node apps/bff/dist/index.js
```

Auth blocker kalkti; runtime bir sonraki ayni sinif package metadata sorununda durdu:

```text
Error [ERR_MODULE_NOT_FOUND]: Cannot find module 'C:\gelistirme\HX\services\catalog\src\catalog' imported from C:\gelistirme\HX\services\catalog\src\index.ts
```

Bu raporun kapsami `@hx/auth` runtime resolution fix'i ile sinirlidir. `@hx/catalog` hatasi yeni/sonraki BFF startup blocker olarak ayrica ele alinmalidir.

## 7. Commit hash

Fix commit hash:

```text
6d97ec8
```

## 8. Push sonucu

Push basarili:

```text
To https://github.com/Hilewex/hx.git
   fc2ffcc..6d97ec8  master -> master
```

## 9. Yeni CI run icin beklenen asama

Yeni CI run'da `@hx/auth` kaynak TS girisine dusen BFF startup smoke hatasinin kalkmasi beklenir.

Sonraki beklenen risk, BFF runtime'in `main: src/index.ts` gosterilen diger workspace dependency'lerinde ayni ESM/source resolution sinifindan yeni bir blocker'a ilerlemesidir. Lokal Windows denemesinde ilk gorunen sonraki blocker `@hx/catalog` oldu.
