"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryRiskRepository = void 0;
class InMemoryRiskRepository {
    signals = new Map();
    cases = new Map();
    idempotency = new Map();
    async createSignal(signal) {
        this.signals.set(signal.signalId, signal);
    }
    async createCase(riskCase) {
        this.cases.set(riskCase.caseId, riskCase);
    }
    async updateCase(caseId, updates) {
        const existing = this.cases.get(caseId);
        if (existing) {
            this.cases.set(caseId, { ...existing, ...updates });
        }
    }
    async getCase(caseId) {
        return this.cases.get(caseId) || null;
    }
    async listCases(query) {
        let result = Array.from(this.cases.values());
        if (query.targetId)
            result = result.filter(c => c.target.targetId === query.targetId);
        if (query.targetType)
            result = result.filter(c => c.target.targetType === query.targetType);
        if (query.status)
            result = result.filter(c => c.status === query.status);
        if (query.level)
            result = result.filter(c => c.level === query.level);
        const total = result.length;
        const offset = query.offset || 0;
        const limit = query.limit || 50;
        return {
            cases: result.slice(offset, offset + limit),
            total,
        };
    }
    async listSignals(query) {
        let result = Array.from(this.signals.values());
        if (query.targetId)
            result = result.filter(s => s.target.targetId === query.targetId);
        if (query.targetType)
            result = result.filter(s => s.target.targetType === query.targetType);
        const total = result.length;
        const offset = query.offset || 0;
        const limit = query.limit || 50;
        return {
            signals: result.slice(offset, offset + limit),
            total,
        };
    }
    async checkIdempotency(key) {
        return this.idempotency.get(key) || null;
    }
    async saveIdempotency(key, result) {
        this.idempotency.set(key, result);
    }
}
exports.InMemoryRiskRepository = InMemoryRiskRepository;
