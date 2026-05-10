"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.baseConfigSchema = void 0;
exports.parseConfig = parseConfig;
exports.createServiceConfig = createServiceConfig;
const zod_1 = require("zod");
exports.baseConfigSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.coerce.number().default(3000),
    LOG_LEVEL: zod_1.z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});
function parseConfig(schema, env) {
    return schema.parse(env);
}
function createServiceConfig(serviceSchema) {
    return exports.baseConfigSchema.extend(serviceSchema);
}
