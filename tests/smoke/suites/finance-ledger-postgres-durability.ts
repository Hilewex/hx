import { strict as assert } from 'node:assert';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { closePool } from '../../../packages/persistence/src';
import { PostgresFinanceLedgerRepository } from '../../../packages/persistence/src/finance-ledger';
import { runMigrations } from '../../../packages/persistence/src/migrator';
import type { AppendLedgerEntryCommand } from '../../../packages/contracts/src/finance-ledger';
import type { SmokeRunner } from '../types';

const suiteName = 'finance-ledger-postgres-durability';

function createCommand(overrides: Partial<AppendLedgerEntryCommand> = {}): AppendLedgerEntryCommand {
  const suffix = randomUUID();
  return {
    idempotencyKey: `ledger-pg-${suffix}`,
    sourceType: 'PAYMENT',
    sourceId: `payment-${suffix}`,
    sourceEventId: `event-${suffix}`,
    direction: 'CREDIT',
    entryType: 'PAYMENT_CAPTURE',
    amount: 123.45,
    currency: 'TRY',
    accountType: 'PAYMENT_CLEARING',
    accountKey: `payment-${suffix}`,
    counterpartyType: 'CUSTOMER',
    counterpartyId: `customer-${suffix}`,
    metadata: { smoke: suiteName, suffix },
    ...overrides,
  };
}

function assertNoLedgerRewriteSql(): void {
  const forbidden = [
    ['UPDATE', 'finance_ledger_entries'],
    ['DELETE FROM', 'finance_ledger_entries'],
  ];
  const files = [
    'packages/persistence/src/finance-ledger.ts',
    'infra/migrations/20260513_001_finance_ledger_durability.sql',
  ];

  for (const file of files) {
    const content = readFileSync(resolve(file), 'utf8').toUpperCase();
    for (const [verb, table] of forbidden) {
      const pattern = `${verb} ${table.toUpperCase()}`;
      assert.equal(
        content.includes(pattern),
        false,
        `${file} contains forbidden finance ledger rewrite SQL: ${pattern}`,
      );
    }
  }
}

export const financeLedgerPostgresDurabilitySmoke: SmokeRunner = {
  name: suiteName,
  run: async () => {
    try {
      assert.equal(
        process.env.PERSISTENCE_MODE,
        'postgres',
        'PERSISTENCE_MODE=postgres and DATABASE_URL required',
      );
      assert.ok(process.env.DATABASE_URL, 'DATABASE_URL is required');

      await runMigrations(join(process.cwd(), 'infra', 'migrations'));

      const repository = new PostgresFinanceLedgerRepository();
      const command = createCommand();
      const inserted = await repository.appendLedgerEntry(command);

      assert.ok(inserted.ledgerEntryId, 'append should return ledgerEntryId');
      assert.equal(inserted.idempotencyKey, command.idempotencyKey);
      assert.equal(inserted.immutable, true);

      const readback = await repository.getLedgerEntries({
        sourceType: command.sourceType,
        sourceId: command.sourceId,
      });
      assert.equal(readback.length, 1, 'readback should find inserted entry');
      assert.equal(readback[0].ledgerEntryId, inserted.ledgerEntryId);

      const restartedRepository = new PostgresFinanceLedgerRepository();
      const restartReadback = await restartedRepository.getLedgerEntries({
        sourceType: command.sourceType,
        sourceId: command.sourceId,
      });
      assert.equal(restartReadback.length, 1, 'new repository instance should read durable entry');
      assert.equal(restartReadback[0].ledgerEntryId, inserted.ledgerEntryId);

      const duplicateSamePayload = await restartedRepository.appendLedgerEntry({ ...command });
      assert.equal(
        duplicateSamePayload.ledgerEntryId,
        inserted.ledgerEntryId,
        'duplicate same idempotency key and payload should return existing entry',
      );

      const countAfterDuplicate = (
        await repository.getLedgerEntries({
          sourceType: command.sourceType,
          sourceId: command.sourceId,
        })
      ).length;
      assert.equal(countAfterDuplicate, 1, 'duplicate same payload must not append a second row');

      await assert.rejects(
        () => repository.appendLedgerEntry({ ...command, amount: command.amount + 1 }),
        /DUPLICATE_IDEMPOTENCY_KEY_CONFLICT/,
        'duplicate same idempotency key with different payload should conflict',
      );

      const reversalCommand = createCommand({
        sourceType: 'REFUND',
        sourceId: `refund-${randomUUID()}`,
        sourceEventId: inserted.ledgerEntryId,
        direction: 'DEBIT',
        entryType: 'REFUND',
        amount: 25,
        accountType: 'REFUND_IMPACT',
      });
      const reversal = await repository.appendLedgerEntry(reversalCommand);
      assert.notEqual(
        reversal.ledgerEntryId,
        inserted.ledgerEntryId,
        'append-only follow-up entry should create a new ledger row',
      );
      assert.equal(reversal.immutable, true);

      assertNoLedgerRewriteSql();

      return {
        result: 'PASS',
        message:
          'Postgres finance ledger append/readback, durable read, idempotency conflict, append-only invariant, and no rewrite guard passed.',
      };
    } catch (error) {
      return {
        result: 'FAIL',
        message: (error as Error).stack || (error as Error).message,
      };
    } finally {
      await closePool().catch(() => undefined);
    }
  },
};
