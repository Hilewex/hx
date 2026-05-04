import { baseConfigSchema, parseConfig } from '@hx/config';
import { z } from 'zod';

const webSchema = baseConfigSchema.extend({
  NEXT_PUBLIC_BFF_URL: z.string().url().default('http://localhost:4000'),
});

export const config = parseConfig(webSchema, process.env);
