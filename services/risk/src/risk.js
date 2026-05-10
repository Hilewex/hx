"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRiskSignal = createRiskSignal;
exports.createRiskCase = createRiskCase;
exports.reviewRiskCase = reviewRiskCase;
exports.createInternalRiskSignal = createInternalRiskSignal;
exports.getRiskCase = getRiskCase;
exports.listRiskCases = listRiskCases;
exports.listRiskSignals = listRiskSignals;
const crypto = __importStar(require("crypto"));
const repository_1 = require("./repository");
const persistence_1 = require("@hx/persistence");
function generateId() {
    return crypto.randomBytes(16).toString('hex');
}
async function appendAuditEvent(params) {
    const repo = (0, persistence_1.getAuditEventRepositories)();
    await repo.audit.appendAuditLog({
        auditId: params.eventId,
        actionType: params.eventType,
        actorId: 'system',
        actorType: 'system',
        entityId: params.entityId,
        entityType: params.entityType,
        ownerService: params.ownerService,
        afterState: params.payload,
        correlationId: params.correlationId,
        metadata: {},
    });
}
async function createRiskSignal(command) {
    const repo = (0, repository_1.getRepository)();
    if (command.idempotencyKey) {
        const existing = await repo.checkIdempotency(command.idempotencyKey);
        if (existing) {
            return { success: true, signalId: existing };
        }
    }
    const signalId = `rsig_${generateId()}`;
    const now = new Date().toISOString();
    const signal = {
        signalId,
        target: command.target,
        type: command.type,
        level: command.level,
        source: command.source,
        reasonCode: command.reasonCode,
        metadata: command.metadata,
        idempotencyKey: command.idempotencyKey,
        createdAt: now,
        riskTruthMutated: true,
        targetTruthMutated: false,
        paymentTruthMutated: false,
        orderTruthMutated: false,
        refundTruthMutated: false,
        financeTruthMutated: false,
        moderationTruthMutated: false,
    };
    await repo.createSignal(signal);
    if (command.idempotencyKey) {
        await repo.saveIdempotency(command.idempotencyKey, signalId);
    }
    const warnings = [];
    try {
        await appendAuditEvent({
            eventId: `evt_${generateId()}`,
            eventType: 'RISK_SIGNAL_CREATED',
            entityId: signalId,
            entityType: 'RISK_SIGNAL',
            ownerService: 'risk',
            payload: signal,
            correlationId: command.correlationId || signalId,
        });
    }
    catch (err) {
        warnings.push('AUDIT_EVENT_APPEND_FAILED_AFTER_TRUTH_WRITE');
    }
    return { success: true, signalId, warnings: warnings.length > 0 ? warnings : undefined };
}
async function createRiskCase(command) {
    const repo = (0, repository_1.getRepository)();
    if (command.idempotencyKey) {
        const existing = await repo.checkIdempotency(command.idempotencyKey);
        if (existing) {
            return { success: true, caseId: existing };
        }
    }
    const caseId = `rcas_${generateId()}`;
    const now = new Date().toISOString();
    const riskCase = {
        caseId,
        target: command.target,
        status: 'OPEN',
        level: command.level,
        source: command.source,
        reasonCode: command.reasonCode,
        signals: command.signals || [],
        notes: command.notes,
        idempotencyKey: command.idempotencyKey,
        createdAt: now,
        updatedAt: now,
        riskTruthMutated: true,
        targetTruthMutated: false,
        paymentTruthMutated: false,
        orderTruthMutated: false,
        refundTruthMutated: false,
        financeTruthMutated: false,
        moderationTruthMutated: false,
    };
    await repo.createCase(riskCase);
    if (command.idempotencyKey) {
        await repo.saveIdempotency(command.idempotencyKey, caseId);
    }
    const warnings = [];
    try {
        await appendAuditEvent({
            eventId: `evt_${generateId()}`,
            eventType: 'RISK_CASE_CREATED',
            entityId: caseId,
            entityType: 'RISK_CASE',
            ownerService: 'risk',
            payload: riskCase,
            correlationId: command.correlationId || caseId,
        });
    }
    catch (err) {
        warnings.push('AUDIT_EVENT_APPEND_FAILED_AFTER_TRUTH_WRITE');
    }
    return { success: true, caseId, warnings: warnings.length > 0 ? warnings : undefined };
}
async function reviewRiskCase(command) {
    const repo = (0, repository_1.getRepository)();
    const riskCase = await repo.getCase(command.caseId);
    if (!riskCase) {
        throw new Error('RISK_CASE_NOT_FOUND');
    }
    let newStatus = riskCase.status;
    switch (command.decision) {
        case 'NO_ACTION':
            newStatus = 'NO_ACTION';
            break;
        case 'MARK_REVIEW_REQUIRED':
            newStatus = 'REVIEW_REQUIRED';
            break;
        case 'RECOMMEND_HOLD':
            newStatus = 'ADVISORY_HOLD_RECOMMENDED';
            break;
        case 'RELEASE_RECOMMENDATION':
            newStatus = 'CLOSED';
            break;
        case 'ESCALATE':
            newStatus = 'ESCALATED';
            break;
        case 'CLOSE':
            newStatus = 'CLOSED';
            break;
    }
    const updates = {
        status: newStatus,
        decision: command.decision,
        notes: command.notes ? `${riskCase.notes ? riskCase.notes + '\n' : ''}[${new Date().toISOString()}] ${command.notes}` : riskCase.notes,
        updatedAt: new Date().toISOString(),
    };
    await repo.updateCase(command.caseId, updates);
    const warnings = [];
    try {
        await appendAuditEvent({
            eventId: `evt_${generateId()}`,
            eventType: 'RISK_CASE_REVIEWED',
            entityId: command.caseId,
            entityType: 'RISK_CASE',
            ownerService: 'risk',
            payload: { caseId: command.caseId, decision: command.decision, newStatus, reviewerId: command.reviewerId },
            correlationId: command.correlationId || command.caseId,
        });
    }
    catch (err) {
        warnings.push('AUDIT_EVENT_APPEND_FAILED_AFTER_TRUTH_WRITE');
    }
    return { success: true, caseId: command.caseId, warnings: warnings.length > 0 ? warnings : undefined };
}
async function createInternalRiskSignal(params) {
    const command = {
        target: {
            targetId: params.targetId,
            targetType: params.targetType,
        },
        type: params.type,
        level: params.level,
        source: params.source,
        reasonCode: params.reasonCode,
        metadata: params.metadata,
        correlationId: params.correlationId,
        idempotencyKey: params.correlationId ? `internal_risk_${params.correlationId}` : undefined,
    };
    return createRiskSignal(command);
}
async function getRiskCase(query) {
    const repo = (0, repository_1.getRepository)();
    const riskCase = await repo.getCase(query.caseId);
    if (!riskCase) {
        throw new Error('RISK_CASE_NOT_FOUND');
    }
    return { case: riskCase };
}
async function listRiskCases(query) {
    const repo = (0, repository_1.getRepository)();
    const result = await repo.listCases(query);
    return result;
}
async function listRiskSignals(query) {
    const repo = (0, repository_1.getRepository)();
    const result = await repo.listSignals(query);
    return result;
}
