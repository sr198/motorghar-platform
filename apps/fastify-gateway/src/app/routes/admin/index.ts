/**
 * Admin Routes Index
 * Registers all admin routes
 */

import { FastifyInstance } from 'fastify';
import authRoutes from './auth.js';
import userRoutes from './users.js';

export default async function (fastify: FastifyInstance) {
  fastify.log.info('Loading admin routes...');

  // Register auth routes - they define their own full paths
  await fastify.register(authRoutes);

  // Register user management routes - demonstrates new decorators
  await fastify.register(userRoutes);

  fastify.log.info('Admin routes loaded successfully');
}
