import { baseConfigSchema, parseConfig } from '@hx/config';
import { z } from 'zod';

const bffSchema = baseConfigSchema.extend({
  PORT: z.coerce.number().default(3001),
  // BFF specific config overrides can be placed here
});

export const config = parseConfig(bffSchema, {
  ...process.env,
  PORT: process.env.BFF_PORT || process.env.PORT || '3001'
});
