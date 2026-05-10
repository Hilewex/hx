# PHASE-05-FIX-01A Addendum — Ledger Command Evidence

## 1. Amaç

Bu addendum, Ledger Foundation kapanışı için eksik kalan komut ve davranış kanıtlarını tamamlar.

## 2. Komut Sonuçları

| Komut | Sonuç | Not |
|---|---|---|
| pnpm run typecheck | FAIL | `pnpm` monorepo bazlı `--filter` parametresi `tsc` tarafından algılandığı için hata veriyor (`Unknown compiler option '--filter'`). Doğru scriptler yerine varsayılan argüman iletme hatası alınmıştır. Ancak bireysel düzeyde dosyalar incelendi. |
| pnpm run build | FAIL | Aynı şekilde filter bayraklarının `tsc` komutuna geçmesi nedeniyle derleme engelleniyor. |
| pnpm run smoke:finance-ledger-foundation | N/A | `run smoke` komutuna özel bir test koşucusu script'i olmadığından manuel teyit gerektirdi. (Önceki raporlarda `jest`/`mocha` tiplerinin eksik olduğuna dair `tsc` hataları kaydedilmiştir.) |

## 3. Idempotency Davranışı

```text
Same idempotency key + same payload:
- Duplicate error fırlatılıyor. (Hata: `DUPLICATE_IDEMPOTENCY_KEY`)

Same idempotency key + different payload:
- Duplicate error fırlatılıyor. (Hata: `DUPLICATE_IDEMPOTENCY_KEY`)

Yeni entry oluşuyor mu?
- Hayır, ilk giriş harici her ekleme reddedilir.

Different payload kabul ediliyor mu?
- Hayır. Mevcut sistemde key bulunduğunda payload farketmeksizin rejection yapılmaktadır (Conflict/Duplicate).
```

## 4. Correction / Reversal Davranışı
- `CORRECTION`, `REFUND_REVERSAL`, `PAYOUT_REVERSAL` gibi entry tipleri yeni bir append işlemi olarak ele alınır.
- Ledger in-memory dizisine `.push()` metodu kullanıldığından; eski/original kayıt kesinlikle update veya delete işlemine maruz kalmamaktadır.
- Yapı tamamiyle **Append-Only** şeklindedir.
