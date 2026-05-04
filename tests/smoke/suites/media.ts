import { SmokeRunner } from '../types';
import { issueDevAuthToken } from '../auth-utils';

async function testAssetLifecycle(
  baseUrl: string,
  runStep: (name: string, fn: () => Promise<any>) => Promise<any>,
  mediaType: 'IMAGE' | 'VIDEO',
  fileName: string,
) {
  let assetId: string | undefined;
  const ownerId = `smoke_owner_${Math.random().toString(36).substr(2, 9)}`;
  const adminToken = issueDevAuthToken('admin-1', 'ADMIN');

  await runStep(`[${mediaType}] Intake`, async () => {
    const res = await fetch(`${baseUrl}/media/intake`, { 
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        ownerType: 'PRODUCT',
        ownerId: ownerId,
        mediaType: mediaType,
        sourceType: 'ADMIN_PANEL',
        fileName: fileName,
        mimeType: mediaType === 'IMAGE' ? 'image/jpeg' : 'video/mp4',
        fileSizeBytes: 1024 * 512,
      }),
    });
    if (!res.ok || res.status !== 201) throw new Error(`Media intake failed: ${res.status} ${await res.text()}`);
    const { data } = await res.json();
    if (!data.asset?.assetId) throw new Error('Asset ID not found in intake response');
    if (data.asset.status !== 'UPLOADED') throw new Error(`Expected status UPLOADED, got ${data.asset.status}`);
    assetId = data.asset.assetId;
    return { assetId };
  });

  await runStep(`[${mediaType}] Process`, async () => {
    if (!assetId) throw new Error('Asset ID not available for process step');
    const res = await fetch(`${baseUrl}/media/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ assetId }),
    });
    if (!res.ok) throw new Error(`Media process failed: ${res.status} ${await res.text()}`);
    const { data } = await res.json();
    if (data.asset?.status !== 'PROCESSED') throw new Error(`Expected status PROCESSED, got ${data.asset.status}`);
    if (!data.asset?.visibilityReady) throw new Error('Asset should be visibilityReady after processing');
    if (!data.generatedVariants || data.generatedVariants.length === 0) throw new Error('No variants were generated');
    return data;
  });

  await runStep(`[${mediaType}] Get & Verify`, async () => {
    if (!assetId) throw new Error('Asset ID not available for get step');
    const res = await fetch(`${baseUrl}/media/asset?assetId=${assetId}`);
    if (!res.ok) throw new Error(`Get asset failed: ${res.status}`);
    const { data } = await res.json();
    if (data.asset?.assetId !== assetId) throw new Error('Mismatched asset ID in get response');
    if (data.asset?.status !== 'PROCESSED') throw new Error('Asset status was not persisted as PROCESSED');
    return data;
  });
  
  await runStep(`[${mediaType}] Check Visibility`, async () => {
    if (!assetId) throw new Error('Asset ID not available for visibility step');
    const res = await fetch(`${baseUrl}/media/visibility?assetId=${assetId}`);
    if (!res.ok) throw new Error(`Get visibility failed: ${res.status}`);
    const { data } = await res.json();
    if (!data.visibilityReady) throw new Error('Asset should be visible after processing and approval');
    return data;
  });
}

export const mediaSmoke: SmokeRunner = {
  name: 'media',
  run: async (baseUrl: string) => {
    const steps: { name: string; status: 'PASS' | 'FAIL' | 'SKIPPED'; message: string }[] = [];
    const runStep = async (name: string, fn: () => Promise<any>) => {
      if (steps.some(s => s.status === 'FAIL')) {
        steps.push({ name, status: 'SKIPPED', message: 'Skipped due to previous step failure.' });
        return;
      }
      try {
        await fn();
        steps.push({ name, status: 'PASS', message: 'Step completed successfully.' });
      } catch (error: any) {
        steps.push({ name, status: 'FAIL', message: error.message });
      }
    };
    
    await runStep('Health Check', async () => {
        const res = await fetch(`${baseUrl}/health`);
        if (!res.ok) throw new Error('BFF is not healthy.');
    });

    await testAssetLifecycle(baseUrl, runStep, 'IMAGE', 'smoke-test-image.jpg');
    await testAssetLifecycle(baseUrl, runStep, 'VIDEO', 'smoke-test-video.mp4');

    const finalResult = steps.every(s => s.status === 'PASS') ? 'PASS' : 'FAIL';
    const failedStep = steps.find(s => s.status === 'FAIL');
    const message = finalResult === 'PASS' 
      ? 'Media readiness foundation smoke test passed successfully.' 
      : `Failed at step: ${failedStep?.name}. Reason: ${failedStep?.message}`;

    return { result: finalResult, message };
  },
};
