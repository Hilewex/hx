"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostgresPaymentReconciliationTaskRepository = exports.InMemoryPaymentReconciliationTaskRepository = void 0;
exports.getPaymentReconciliationTaskRepository = getPaymentReconciliationTaskRepository;
const index_1 = require("./index");
const TERMINAL_RECONCILIATION_STATUSES = new Set(['reconciled', 'reconciliation_rejected']);
function mapRowToTask(row) {
    return {
        taskId: row.id,
        reconciliationRef: row.reconciliation_ref,
        paymentId: row.payment_id ?? undefined,
        paymentAttemptId: row.payment_attempt_id ?? undefined,
        checkoutId: row.checkout_id ?? undefined,
        providerName: row.provider_name,
        providerReference: row.provider_reference ?? undefined,
        merchantOid: row.merchant_oid ?? undefined,
        triggerReason: row.trigger_reason,
        status: row.status,
        attemptCount: row.attempt_count,
        maxAttempts: row.max_attempts,
        nextAttemptAt: row.next_attempt_at ?? undefined,
        lastInquiryRef: row.last_inquiry_ref ?? undefined,
        lastCandidate: row.last_candidate ?? undefined,
        manualReviewRequired: row.manual_review_required,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        boundary: row.boundary,
    };
}
class InMemoryPaymentReconciliationTaskRepository {
    tasks = new Map();
    reconciliationRefIndex = new Map();
    nextId = 1;
    async createTask(candidate) {
        const existingId = this.reconciliationRefIndex.get(candidate.reconciliationRef);
        if (existingId) {
            return this.tasks.get(existingId);
        }
        const taskId = candidate.taskId ?? String(this.nextId++);
        const now = new Date();
        const task = {
            ...candidate,
            taskId,
            createdAt: candidate.createdAt ?? now,
            updatedAt: candidate.updatedAt ?? now,
        };
        this.tasks.set(taskId, task);
        this.reconciliationRefIndex.set(candidate.reconciliationRef, taskId);
        return task;
    }
    async getTaskById(taskId) {
        return this.tasks.get(taskId) ?? null;
    }
    async getTaskByReconciliationRef(reconciliationRef) {
        const taskId = this.reconciliationRefIndex.get(reconciliationRef);
        return taskId ? this.tasks.get(taskId) ?? null : null;
    }
    async findOpenTaskByProviderReference(providerName, providerReference) {
        return (Array.from(this.tasks.values()).find((task) => task.providerName === providerName &&
            task.providerReference === providerReference &&
            !TERMINAL_RECONCILIATION_STATUSES.has(task.status)) ?? null);
    }
    async listTasksByStatus(status, limit = 100) {
        return Array.from(this.tasks.values())
            .filter((task) => task.status === status)
            .slice(0, limit);
    }
    async updateTaskStatus(taskId, update) {
        const task = this.tasks.get(taskId);
        if (!task)
            return null;
        const updatedTask = {
            ...task,
            status: update.status,
            nextAttemptAt: update.nextAttemptAt ?? task.nextAttemptAt,
            manualReviewRequired: update.manualReviewRequired ?? task.manualReviewRequired,
            updatedAt: new Date(),
        };
        this.tasks.set(taskId, updatedTask);
        return updatedTask;
    }
    async markTaskAttempt(taskId, update) {
        const task = this.tasks.get(taskId);
        if (!task)
            return null;
        const updatedTask = {
            ...task,
            attemptCount: update.attemptCount,
            nextAttemptAt: update.nextAttemptAt ?? task.nextAttemptAt,
            lastInquiryRef: update.lastInquiryRef ?? task.lastInquiryRef,
            lastCandidate: update.lastCandidate ?? task.lastCandidate,
            updatedAt: new Date(),
        };
        this.tasks.set(taskId, updatedTask);
        return updatedTask;
    }
}
exports.InMemoryPaymentReconciliationTaskRepository = InMemoryPaymentReconciliationTaskRepository;
class PostgresPaymentReconciliationTaskRepository {
    async createTask(candidate) {
        const sql = `
      INSERT INTO payment_reconciliation_tasks (
        reconciliation_ref, payment_id, payment_attempt_id, checkout_id,
        provider_name, provider_reference, merchant_oid, trigger_reason, status,
        attempt_count, max_attempts, next_attempt_at, last_inquiry_ref,
        last_candidate, manual_review_required, boundary, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14, $15, $16, $17, $18
      )
      ON CONFLICT (reconciliation_ref) DO NOTHING
      RETURNING *;
    `;
        const res = await (0, index_1.query)(sql, [
            candidate.reconciliationRef,
            candidate.paymentId,
            candidate.paymentAttemptId,
            candidate.checkoutId,
            candidate.providerName,
            candidate.providerReference,
            candidate.merchantOid,
            candidate.triggerReason,
            candidate.status,
            candidate.attemptCount,
            candidate.maxAttempts,
            candidate.nextAttemptAt,
            candidate.lastInquiryRef,
            JSON.stringify(candidate.lastCandidate ?? null),
            candidate.manualReviewRequired,
            JSON.stringify(candidate.boundary),
            candidate.createdAt,
            candidate.updatedAt ?? candidate.createdAt,
        ]);
        if (res.rowCount && res.rows[0]) {
            return mapRowToTask(res.rows[0]);
        }
        const existing = await this.getTaskByReconciliationRef(candidate.reconciliationRef);
        if (!existing) {
            throw new Error('payment reconciliation task insert failed');
        }
        return existing;
    }
    async getTaskById(taskId) {
        const res = await (0, index_1.query)('SELECT * FROM payment_reconciliation_tasks WHERE id = $1', [taskId]);
        return res.rows[0] ? mapRowToTask(res.rows[0]) : null;
    }
    async getTaskByReconciliationRef(reconciliationRef) {
        const res = await (0, index_1.query)('SELECT * FROM payment_reconciliation_tasks WHERE reconciliation_ref = $1', [reconciliationRef]);
        return res.rows[0] ? mapRowToTask(res.rows[0]) : null;
    }
    async findOpenTaskByProviderReference(providerName, providerReference) {
        const res = await (0, index_1.query)(`SELECT * FROM payment_reconciliation_tasks
       WHERE provider_name = $1
         AND provider_reference = $2
         AND status <> ALL($3::text[])
       ORDER BY created_at ASC
       LIMIT 1`, [
            providerName,
            providerReference,
            Array.from(TERMINAL_RECONCILIATION_STATUSES),
        ]);
        return res.rows[0] ? mapRowToTask(res.rows[0]) : null;
    }
    async listTasksByStatus(status, limit = 100) {
        const res = await (0, index_1.query)(`SELECT * FROM payment_reconciliation_tasks
       WHERE status = $1
       ORDER BY created_at ASC
       LIMIT $2`, [status, limit]);
        return res.rows.map(mapRowToTask);
    }
    async updateTaskStatus(taskId, update) {
        const res = await (0, index_1.query)(`UPDATE payment_reconciliation_tasks
       SET status = $1,
           next_attempt_at = COALESCE($2::timestamptz, next_attempt_at),
           manual_review_required = COALESCE($3::boolean, manual_review_required),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`, [
            update.status,
            update.nextAttemptAt,
            update.manualReviewRequired,
            taskId,
        ]);
        return res.rows[0] ? mapRowToTask(res.rows[0]) : null;
    }
    async markTaskAttempt(taskId, update) {
        const res = await (0, index_1.query)(`UPDATE payment_reconciliation_tasks
       SET attempt_count = $1,
           next_attempt_at = COALESCE($2::timestamptz, next_attempt_at),
           last_inquiry_ref = COALESCE($3::text, last_inquiry_ref),
           last_candidate = COALESCE($4::jsonb, last_candidate),
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`, [
            update.attemptCount,
            update.nextAttemptAt,
            update.lastInquiryRef,
            update.lastCandidate ? JSON.stringify(update.lastCandidate) : null,
            taskId,
        ]);
        return res.rows[0] ? mapRowToTask(res.rows[0]) : null;
    }
}
exports.PostgresPaymentReconciliationTaskRepository = PostgresPaymentReconciliationTaskRepository;
let reconciliationTaskRepo = null;
function getPaymentReconciliationTaskRepository() {
    if (reconciliationTaskRepo) {
        return reconciliationTaskRepo;
    }
    const mode = process.env.PERSISTENCE_MODE || 'memory';
    reconciliationTaskRepo =
        mode === 'postgres'
            ? new PostgresPaymentReconciliationTaskRepository()
            : new InMemoryPaymentReconciliationTaskRepository();
    return reconciliationTaskRepo;
}
