import { createServer } from './apps/bff/src/server/index';
import { simulatePostFlow } from './apps/web/src/bootstrap/post';
import { simulateUgcFlow } from './apps/web/src/bootstrap/ugc';

async function verify() {
  const server = createServer();
  server.start();
  
  try {
    console.log('Wait for server...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await simulatePostFlow();
    await simulateUgcFlow();
    
    console.log('\n--- VERIFICATION COMPLETED ---');
  } catch (error) {
    console.error('Verification failed:', error);
  } finally {
    server.stop();
    process.exit(0);
  }
}

verify();
