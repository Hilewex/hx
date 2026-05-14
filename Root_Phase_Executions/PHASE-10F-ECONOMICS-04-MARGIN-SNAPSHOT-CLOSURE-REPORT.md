# PHASE-10F-ECONOMICS-04 - MARGIN SNAPSHOT CLOSURE REPORT

## Degisen Dosyalar

- `services/order/src/order.ts`
- `tests/smoke/suites/order-line-economics-snapshot-foundation.ts`
- `PHASE-10F-ECONOMICS-04-MARGIN-SNAPSHOT-CLOSURE-REPORT.md`

Not: Repo calisma agaci bu faz oncesinden de kirliydi. Build/typecheck sonrasi mevcut `dist`/`tsbuildinfo` dosyalari da guncellenmis olabilir.

## Margin Hesaplama Kurallari

Order line `economicsSnapshot` artik checkout line uzerinden gelen gercek source amount alanlarini kullanarak margin snapshot hesaplar.

- `supplierBaseAmount` varsa snapshot'a tasinir.
- `poolBasePriceAmount` varsa snapshot'a tasinir.
- `creatorSelectedPriceAmount` varsa snapshot'a tasinir.
- `platformMarginAmount` sadece `poolBasePriceAmount` ve `supplierBaseAmount` mevcutsa ve `poolBasePriceAmount >= supplierBaseAmount` ise hesaplanir.
- `platformMarginAmount = poolBasePriceAmount - supplierBaseAmount`
- `creatorMarginAmount` sadece `creatorSelectedPriceAmount` ve `poolBasePriceAmount` mevcutsa ve `creatorSelectedPriceAmount >= poolBasePriceAmount` ise hesaplanir.
- `creatorMarginAmount = creatorSelectedPriceAmount - poolBasePriceAmount`

Negatif margin uretilmez. Yuvarlama, kategori kar orani, admin pricing policy veya commission policy owner eklenmedi.

## Artik Snapshot Olarak Hesaplanan Alanlar

- `platformMarginAmount`
- `creatorMarginAmount`

Tam source senaryosunda smoke ornegi:

- `supplierBaseAmount=100`
- `poolBasePriceAmount=120`
- `creatorSelectedPriceAmount=150`
- `platformMarginAmount=20`
- `creatorMarginAmount=30`
- `status=COMPLETE`

## Unknown / Degraded Kalan Durumlar

Source eksikse ilgili margin alani hesaplanmaz ve `unknownFields` icinde kalir.

- `poolBasePriceAmount` veya `supplierBaseAmount` eksikse `platformMarginAmount` unknown kalir.
- `creatorSelectedPriceAmount` veya `poolBasePriceAmount` eksikse `creatorMarginAmount` unknown kalir.
- `poolBasePriceAmount < supplierBaseAmount` ise `PLATFORM_MARGIN_PRICE_RELATION_INVALID` warning'i eklenir ve `platformMarginAmount` unknown kalir.
- `creatorSelectedPriceAmount < poolBasePriceAmount` ise `CREATOR_MARGIN_PRICE_RELATION_INVALID` warning'i eklenir ve `creatorMarginAmount` unknown kalir.
- Eksik veya gecersiz alan varsa snapshot `DEGRADED` kalir.

## Boundary Mutation Durumu

Bu faz sadece snapshot hesaplama ekledi. Settlement, payout, ledger, payable veya finance mutation acilmadi.

- `economicsSnapshotOnly: true`
- `settlementCreated: false`
- `payoutCreated: false`
- `ledgerEntryCreated: false`
- `payableCreated: false`

Static guard asagidaki pattern'lerin order snapshot yolunda bulunmadigini dogruladi:

- `createSettlement`
- `finalizeSettlement`
- `appendLedgerEntry`
- `createPayout`
- `executePayout`
- `applyFinanceCorrection`
- `providerPayout`
- `supplierPayableCreated: true`
- `creatorEarningCreated: true`
- `platformRevenueCreated: true`
- `settlementCreated: true`
- `payoutCreated: true`
- `ledgerEntryCreated: true`
- `payableCreated: true`

## Smoke Sonuclari

- `pnpm.cmd run typecheck`: PASS
- `pnpm.cmd run build`: PASS
- `pnpm.cmd run smoke:order-line-economics-snapshot-foundation`: PASS
- `pnpm.cmd run smoke:settlement-calculation-foundation`: PASS
- `pnpm.cmd run smoke:admin-finance-ops-projection`: PASS
- `pnpm.cmd run smoke:finance-ledger-postgres-durability`: FAIL, migration baslangicinda Postgres baglantisi reddedildi (`ECONNREFUSED`).

## Kalan Limitations

- Margin hesaplama yalnizca order line economics snapshot icin acildi.
- Settlement snapshot'i bu alanlari henuz kullanacak sekilde genisletilmedi.
- Payable lifecycle, payout lifecycle, ledger append, provider payout/refund call ve finance correction apply kapali kaldi.
- Catalog projection source alanlari durable bir projection pipeline tarafindan doldurulmadikca checkout/order bu alanlari uretmez.
