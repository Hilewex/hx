const fs = require('fs');

const contractsFile = 'packages/contracts/src/admin.ts';
let contractsCode = fs.readFileSync(contractsFile, 'utf8');

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

fs.writeFileSync(contractsFile, contractsCode);
