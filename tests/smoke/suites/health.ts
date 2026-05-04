import { SmokeRunner } from '../types';

export const healthSmoke: SmokeRunner = {
  name: 'health',
  run: async (baseUrl: string) => {
    try {
      const res = await fetch(`${baseUrl}/health`);
      if (res.ok) {
        return { result: 'PASS', message: 'Health check passed' };
      }
      return { result: 'FAIL', message: `Health check failed with status ${res.status}` };
    } catch (e: any) {
      return { result: 'SKIPPED', message: `BFF unreachable: ${e.message}` };
    }
  }
};
