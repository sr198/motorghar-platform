/**
 * Fastify Plugins Library
 * Framework integration layer for auth and RBAC
 */

export { default as authPlugin } from './lib/auth.plugin.js';
export { default as rbacPlugin } from './lib/rbac.plugin.js';
export type { AuthPluginOptions } from './lib/auth.plugin.js';
export type { RBACPluginOptions } from './lib/rbac.plugin.js';
