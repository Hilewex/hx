export const simulateModerationFlow = async (fetchBff: any) => {
  console.log('\n--- P31: Moderation Foundation Simulation ---');

  // 1. STORE_POST için moderation case oluştur
  console.log('1. Creating moderation case for STORE_POST...');
  const postCase = await fetchBff('/moderation/case/create', 'POST', {
    target: { targetType: 'STORE_POST', targetId: 'post_123', ownerActorId: 'actor_456' },
    source: 'SYSTEM_RULE',
    riskLevel: 'LOW',
    contentText: 'Simulated store post content for moderation'
  });
  console.log('Post Case Created:', postCase.body.success ? `SUCCESS (ID: ${postCase.body.caseId})` : 'FAILED');
  const caseId = postCase.body.caseId;

  // 2. UGC için high-risk moderation case oluştur
  console.log('2. Creating high-risk moderation case for UGC...');
  const ugcCase = await fetchBff('/moderation/case/create', 'POST', {
    target: { targetType: 'UGC', targetId: 'ugc_789' },
    source: 'USER_REPORT',
    riskLevel: 'HIGH',
    reasonCodes: ['ABUSE', 'INAPPROPRIATE_MEDIA']
  });
  console.log('UGC Case Created:', ugcCase.body.success ? 'SUCCESS' : 'FAILED');

  // 3. Eksik target ile create dene, hata bekle
  console.log('3. Testing invalid create (missing target)...');
  const invalidCase = await fetchBff('/moderation/case/create', 'POST', {
    source: 'SYSTEM_RULE'
  });
  console.log('Invalid Create Response Status:', invalidCase.status); // Beklenen 400

  // 4. Case detail oku
  if (caseId) {
    console.log(`4. Getting case details for ${caseId}...`);
    const caseDetail = await fetchBff(`/moderation/case?caseId=${caseId}`, 'GET');
    console.log('Case Detail Status:', caseDetail.body.data?.status);
    console.log('Case Risk Level:', caseDetail.body.data?.riskLevel);
  }

  // 5. Case list oku
  console.log('5. Listing moderation cases...');
  const caseList = await fetchBff('/moderation/case/list', 'GET');
  console.log('Total Cases Found:', caseList.body.items?.length);

  // 6. Case review APPROVE uygula
  if (caseId) {
    console.log(`6. Reviewing case ${caseId} (APPROVE)...`);
    const approveResult = await fetchBff('/moderation/case/review', 'POST', {
      caseId,
      decision: 'APPROVE',
      note: 'Found clean in simulation'
    });
    console.log('Approve Result:', approveResult.body.success ? 'SUCCESS' : 'FAILED');
    
    const finalDetail = await fetchBff(`/moderation/case?caseId=${caseId}`, 'GET');
    console.log('Final Status After Approve:', finalDetail.body.data?.status);
  }

  // 7. Case review HIDE uygula ve target truth mutate edilmediğini doğrula
  console.log('7. Reviewing UGC case (HIDE) and checking boundary...');
  const ugcId = ugcCase.body.caseId;
  if (ugcId) {
    const hideResult = await fetchBff('/moderation/case/review', 'POST', {
      caseId: ugcId,
      decision: 'HIDE',
      note: 'Violates policy'
    });
    console.log('Hide Result:', hideResult.body.success ? 'SUCCESS' : 'FAILED');
    
    const ugcDetail = await fetchBff(`/moderation/case?caseId=${ugcId}`, 'GET');
    console.log('UGC Target Truth Mutated:', ugcDetail.body.data?.targetTruthMutated); // Beklenen false
    console.log('Warnings:', ugcDetail.body.data?.warnings);
  }

  // 8. Unknown case review dene, MODERATION_CASE_NOT_FOUND bekle
  console.log('8. Testing review for non-existent case...');
  const nonExistentReview = await fetchBff('/moderation/case/review', 'POST', {
    caseId: 'unknown_123',
    decision: 'APPROVE'
  });
  console.log('Non-existent Review Response Status:', nonExistentReview.status); // Beklenen 404

  console.log('--- P31 Simulation Completed ---\n');
};
