import { z } from 'zod';

export const baseConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type BaseConfig = z.infer<typeof baseConfigSchema>;

export function parseConfig<T extends z.ZodTypeAny>(schema: T, env: Record<string, string | undefined> = process.env) {
  return schema.parse(env);
}

export function createServiceConfig<T extends z.ZodRawShape>(serviceSchema: T) {
  return baseConfigSchema.extend(serviceSchema);
}
