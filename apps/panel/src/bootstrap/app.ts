import { config } from '../config';
import { defaultTokens } from '@hx/ui';
import { initializeAuth } from './auth';

export function createPanelShell() {
  return {
    mount: () => {
      console.log(`[Panel] Mounted panel shell with background: ${defaultTokens.colors.background}`);
      console.log(`[Panel] Connecting to BFF at: ${config.NEXT_PUBLIC_BFF_URL}`);
      const authState = initializeAuth();
      console.log(`[Panel] Initial Auth State:`, authState);
    }
  };
}
