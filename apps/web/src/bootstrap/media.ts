import { MediaAssetType, MediaOwnerType, MediaSourceType } from '@hx/contracts';

export const simulateMediaFlow = async (fetchBff: any) => {
  console.log('--- P30 Media / Asset Foundation Simulation ---');

  // Scenario 1: GET Seed Asset
  console.log('Scenario 1: GET /media/asset?assetId=asset_product_image_1');
  const res1 = await fetchBff('/media/asset?assetId=asset_product_image_1', { method: 'GET' });
  console.log('Seed Asset:', JSON.stringify(res1, null, 2));

  // Scenario 2: Valid Intake (IMAGE)
  console.log('Scenario 2: POST /media/intake (Valid IMAGE)');
  const res2 = await fetchBff('/media/intake', {
    method: 'POST',
    body: JSON.stringify({
      ownerType: MediaOwnerType.PRODUCT,
      ownerId: 'p_new_1',
      mediaType: MediaAssetType.IMAGE,
      sourceType: MediaSourceType.USER_UPLOAD,
      fileName: 'test.jpg',
      mimeType: 'image/jpeg',
      fileSizeBytes: 1024 * 100,
      width: 800,
      height: 800
    })
  });
  console.log('Intake Result:', JSON.stringify(res2, null, 2));
  const newAssetId = res2.asset?.assetId;

  // Scenario 3: Process the new asset
  if (newAssetId) {
    console.log(`Scenario 3: POST /media/process (assetId: ${newAssetId})`);
    const res3 = await fetchBff('/media/process', {
      method: 'POST',
      body: JSON.stringify({ assetId: newAssetId })
    });
    console.log('Process Result:', JSON.stringify(res3, null, 2));
  }

  // Scenario 4: Invalid Intake (Invalid Mime)
  console.log('Scenario 4: POST /media/intake (Invalid Video Mime)');
  const res4 = await fetchBff('/media/intake', {
    method: 'POST',
    body: JSON.stringify({
      ownerType: MediaOwnerType.STORY,
      ownerId: 'story_1',
      mediaType: MediaAssetType.VIDEO,
      sourceType: MediaSourceType.USER_UPLOAD,
      fileName: 'test.exe',
      mimeType: 'application/octet-stream',
      fileSizeBytes: 1024
    })
  });
  console.log('Invalid Intake Result:', JSON.stringify(res4, null, 2));

  // Scenario 5: List UGC Assets
  console.log('Scenario 5: GET /media/list?ownerType=UGC');
  const res5 = await fetchBff('/media/list?ownerType=UGC', { method: 'GET' });
  console.log('UGC Assets:', JSON.stringify(res5, null, 2));

  // Scenario 6: Visibility for Post Image (Pending Review)
  console.log('Scenario 6: GET /media/visibility?assetId=asset_post_image_1');
  const res6 = await fetchBff('/media/visibility?assetId=asset_post_image_1', { method: 'GET' });
  console.log('Visibility Result:', JSON.stringify(res6, null, 2));

  // Scenario 7: List Visibility Ready Assets
  console.log('Scenario 7: GET /media/list?visibilityReady=true');
  const res7 = await fetchBff('/media/list?visibilityReady=true', { method: 'GET' });
  console.log('Visibility Ready Assets:', JSON.stringify(res7, null, 2));

  console.log('--- P30 Media Simulation Completed ---');
};
