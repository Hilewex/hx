import { baseConfigSchema, parseConfig } from '@hx/config';
import { z } from 'zod';

const panelSchema = baseConfigSchema.extend({
  NEXT_PUBLIC_BFF_URL: z.string().url().default('http://localhost:4000'),
});

export const config = parseConfig(panelSchema, process.env);
