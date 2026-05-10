import { SmokeRunner } from '../types';
import { handleToggleInteraction } from '../../../apps/bff/src/server/interaction';

export const bffActorSpoofingGuardSmoke: SmokeRunner = {
  name: 'bff-actor-spoofing-guard',
  run: async () => {
    try {
      const context = { actorId: 'safe-context-actor', actorType: 'CUSTOMER' };
      const target = { targetType: 'POST' as const, targetId: `actor-spoof-${Date.now()}`, targetVisibility: 'PUBLIC' as const };

      const spoofedBodyActor = await handleToggleInteraction(context, {
        actorId: 'spoofed-body-actor',
        target,
        actionType: 'LIKE'
      });

      if (spoofedBodyActor.status !== 200) {
        return { result: 'FAIL', message: `Safe context actor request failed: ${spoofedBodyActor.status}` };
      }

      const data = spoofedBodyActor.body?.data;
      if (data?.actorId !== context.actorId || data?.interaction?.actorId !== context.actorId) {
        return { result: 'FAIL', message: 'Body actor overrode resolved context actor' };
      }

      const missingActor = await handleToggleInteraction({}, {
        actorId: 'spoofed-body-actor',
        target: { targetType: 'POST', targetId: `actor-missing-${Date.now()}`, targetVisibility: 'PUBLIC' },
        actionType: 'LIKE'
      });

      if (missingActor.status < 400) {
        return { result: 'FAIL', message: 'Protected interaction accepted request without resolved actor' };
      }

      return { result: 'PASS', message: 'BFF interaction actor source remains resolved context' };
    } catch (error: any) {
      return { result: 'FAIL', message: error.message };
    }
  }
};
