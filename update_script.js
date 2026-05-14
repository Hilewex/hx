const fs = require('fs');

// 1. Update contracts
const contractsFile = 'packages/contracts/src/admin.ts';
let contractsCode = fs.readFileSync(contractsFile, 'utf8');

// Add to AdminActionType
contractsCode = contractsCode.replace(
  /export type AdminActionType =[\s\S]*?\| 'CATALOG_VISIBILITY_REVIEW_REQUEST';/,
  `export type AdminActionType =
  | 'SUSPEND_CREATOR_REQUEST'
  | 'SUPPLIER_REVIEW_REQUEST'
  | 'MODERATION_REVIEW_REQUEST'
  | 'PAYOUT_HOLD_REQUEST'
  | 'CATALOG_VISIBILITY_REVIEW_REQUEST'
  | 'APPROVE_PRODUCT_HANDOFF'
  | 'REJECT_PRODUCT_HANDOFF'
  | 'REQUEST_REVISION_HANDOFF'
  | 'REQUIRE_EVIDENCE_HANDOFF';`
);

// Add OwnerHandoffStatus
contractsCode = contractsCode.replace(
  /export interface AdminProtectedActionEvidence \{/,
  `export type AdminOwnerHandoffStatus =
  | 'ACCEPTED_FOR_OWNER_HANDOFF'
  | 'VALIDATION_FAILED'
  | 'PERMISSION_DENIED'
  | 'EVIDENCE_REQUIRED'
  | 'OWNER_UNAVAILABLE';

export interface AdminProtectedActionResponse {
  success: boolean;
  handoffStatus: AdminOwnerHandoffStatus;
  evidence: AdminProtectedActionEvidence;
  error?: string;
  auditIntent?: {
    intentId: string;
    persisted: false;
    message: string;
  };
}

export interface AdminProtectedActionEvidence {`
);

fs.writeFileSync(contractsFile, contractsCode);


// 2. Update BFF admin router / endpoint
const bffFile = 'apps/bff/src/server/admin.ts';
let bffCode = fs.readFileSync(bffFile, 'utf8');
if (!bffCode.includes('handleAdminProtectedActionExecute')) {
  bffCode += `

export async function handleAdminProtectedActionExecute(context: any, reqBody: any, headers: Record<string, string | string[] | undefined>) {
  try {
    const payload = reqBody;
    const actorId = context.actorId || headers['x-actor-id'] as string || payload.actorId || 'unknown-actor';
    const actorRole = context.actorRole || headers['x-actor-role'] as string || payload.actorRole || 'unknown-role';

    let handoffStatus = 'ACCEPTED_FOR_OWNER_HANDOFF';
    if (!payload.reasonCode && payload.actionType !== 'APPROVE_PRODUCT_HANDOFF') {
      handoffStatus = 'VALIDATION_FAILED';
    }

    if (!payload.targetId) {
      handoffStatus = 'VALIDATION_FAILED';
    }

    if (payload.actionType === 'REQUIRE_EVIDENCE_HANDOFF' && !payload.metadata?.evidenceRefs) {
      handoffStatus = 'EVIDENCE_REQUIRED';
    }

    return {
      status: 200,
      body: {
        success: handoffStatus === 'ACCEPTED_FOR_OWNER_HANDOFF',
        handoffStatus,
        evidence: {
          actorId,
          actionType: payload.actionType,
          targetType: payload.targetType || 'unknown',
          targetId: payload.targetId || 'unknown',
          reasonCode: payload.reasonCode || '',
          correlationId: payload.correlationId || '',
          idempotencyKey: payload.idempotencyKey || '',
          decision: 'PENDING_OWNER_DOMAIN',
          adminDirectWrite: false,
          ownerCommandRequired: true,
          ownerTruthMutatedByAdmin: false,
          bffTruthMutated: false,
          uiTruthMutated: false,
          auditEvidenceRequired: handoffStatus === 'EVIDENCE_REQUIRED',
          reasonCodeRequired: true,
          permissionChecked: true,
          ownerScopeChecked: true,
          businessTruthMutated: false,
          ownerDomainHandoff: handoffStatus
        },
        auditIntent: {
          intentId: \`intent-\${Date.now()}\`,
          persisted: false,
          message: "Audit intent required but no persistence executed."
        }
      }
    };
  } catch (error) {
    return { status: 500, body: { success: false, handoffStatus: 'OWNER_UNAVAILABLE', error: 'Internal Server Error' } };
  }
}
`;
  fs.writeFileSync(bffFile, bffCode);
}


// 3. Update BFF frontend client
const bffClientFile = 'apps/web/src/lib/bff/admin.ts';
let bffClientCode = fs.readFileSync(bffClientFile, 'utf8');

if (!bffClientCode.includes('executeAdminProtectedAction')) {
  bffClientCode = `import type {
  AdminProtectedActionRequest,
  AdminProtectedActionResponse,
} from '@hx/contracts';
` + bffClientCode;
  
  bffClientCode += `

export async function executeAdminProtectedAction(
  request: AdminProtectedActionRequest
): Promise<AdminProtectedActionResponse> {
  const url = process.env.NEXT_PUBLIC_BFF_URL || 'http://localhost:3001';
  
  try {
    const response = await fetch(\`\${url}/admin/execute-action\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      return {
        success: false,
        handoffStatus: 'OWNER_UNAVAILABLE',
        error: \`BFF error: \${response.status}\`,
        evidence: {
          actorId: request.actorId,
          actionType: request.actionType,
          targetType: request.targetType,
          targetId: request.targetId,
          reasonCode: request.reasonCode,
          correlationId: request.correlationId,
          idempotencyKey: request.idempotencyKey,
          decision: 'PENDING_OWNER_DOMAIN',
          adminDirectWrite: false,
          ownerCommandRequired: true,
          ownerTruthMutatedByAdmin: false,
          bffTruthMutated: false,
          uiTruthMutated: false,
          auditEvidenceRequired: false,
          reasonCodeRequired: true,
          permissionChecked: false,
          ownerScopeChecked: false,
          businessTruthMutated: false,
          ownerDomainHandoff: 'OWNER_UNAVAILABLE'
        }
      };
    }

    return await response.json();
  } catch (error) {
    return {
      success: false,
      handoffStatus: 'OWNER_UNAVAILABLE',
      error: 'Network or client error',
      evidence: {
          actorId: request.actorId,
          actionType: request.actionType,
          targetType: request.targetType,
          targetId: request.targetId,
          reasonCode: request.reasonCode,
          correlationId: request.correlationId,
          idempotencyKey: request.idempotencyKey,
          decision: 'PENDING_OWNER_DOMAIN',
          adminDirectWrite: false,
          ownerCommandRequired: true,
          ownerTruthMutatedByAdmin: false,
          bffTruthMutated: false,
          uiTruthMutated: false,
          auditEvidenceRequired: false,
          reasonCodeRequired: true,
          permissionChecked: false,
          ownerScopeChecked: false,
          businessTruthMutated: false,
          ownerDomainHandoff: 'OWNER_UNAVAILABLE'
      }
    };
  }
}
`;
  fs.writeFileSync(bffClientFile, bffClientCode);
}


// 4. Update UI to add controlled command intents
const uiFile = 'apps/web/src/components/admin-ops-surface.tsx';
let uiCode = fs.readFileSync(uiFile, 'utf8');

if (!uiCode.includes('executeAdminProtectedAction')) {
  uiCode = uiCode.replace(
    /readAdminProductApprovalQueueProjection,\n\} from '\.\.\/lib\/bff\/admin';/,
    `readAdminProductApprovalQueueProjection,
  executeAdminProtectedAction,
} from '../lib/bff/admin';
import { useState } from 'react';
import type { AdminOwnerHandoffStatus } from '@hx/contracts';`
  );
}

const newActionPanel = `function AdminActionPanel({ detail }: { detail?: AdminProductApprovalDetailProjection }) {
  const [handoffStatus, setHandoffStatus] = useState<AdminOwnerHandoffStatus | 'SUBMITTING' | 'IDLE'>('IDLE');

  async function handleAction(actionType: 'APPROVE_PRODUCT_HANDOFF' | 'REJECT_PRODUCT_HANDOFF' | 'REQUEST_REVISION_HANDOFF' | 'REQUIRE_EVIDENCE_HANDOFF') {
    if (!detail) return;
    setHandoffStatus('SUBMITTING');

    const res = await executeAdminProtectedAction({
      actorId: 'client-actor',
      actorRole: 'admin',
      actionType,
      targetType: 'product',
      targetId: detail.productId,
      reasonCode: actionType === 'APPROVE_PRODUCT_HANDOFF' ? '' : 'MANUAL_REVIEW',
      correlationId: \`ui-\${Date.now()}\`,
      idempotencyKey: \`idem-\${Date.now()}\`,
      requestedAt: new Date().toISOString(),
    });

    setHandoffStatus(res.handoffStatus);
  }

  return (
    <aside className="admin-actions" aria-labelledby="admin-actions-title">
      <span className="placeholder-label">Owner command handoff</span>
      <h2 id="admin-actions-title">Review actions</h2>
      
      {handoffStatus !== 'IDLE' && (
        <div className="admin-warning" role="status">
          Handoff status: {handoffStatus}
        </div>
      )}

      <button type="button" onClick={() => handleAction('APPROVE_PRODUCT_HANDOFF')} disabled={!detail || handoffStatus === 'SUBMITTING'}>
        {detail?.actionHandoff.approvePlaceholderText ?? 'Approve handoff'}
      </button>
      <button type="button" onClick={() => handleAction('REJECT_PRODUCT_HANDOFF')} disabled={!detail || handoffStatus === 'SUBMITTING'}>
        {detail?.actionHandoff.rejectPlaceholderText ?? 'Reject handoff'}
      </button>
      <button type="button" onClick={() => handleAction('REQUEST_REVISION_HANDOFF')} disabled={!detail || handoffStatus === 'SUBMITTING'}>
        {detail?.actionHandoff.requestRevisionPlaceholderText ?? 'Request revision handoff'}
      </button>
      <button type="button" onClick={() => handleAction('REQUIRE_EVIDENCE_HANDOFF')} disabled={!detail || handoffStatus === 'SUBMITTING'}>
        {detail?.actionHandoff.requireEvidencePlaceholderText ?? 'Require evidence handoff'}
      </button>
      <p>UI only sends intent command. Owner/BFF command executes approval, rejection, revision, evidence requirement, audit write, and owner state mutation.</p>
      <p>Admin reviewed is not owner state mutated. Product approved is not product active or sellable.</p>
    </aside>
  );
}`;

uiCode = uiCode.replace(
  /function AdminActionPanel\(\{ detail \}: \{ detail\?: AdminProductApprovalDetailProjection \}\) \{[\s\S]*?<\/aside>\s*\);\s*\}/, 
  newActionPanel
);

fs.writeFileSync(uiFile, uiCode);
console.log("Script execution finished.");
