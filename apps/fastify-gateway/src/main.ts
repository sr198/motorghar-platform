/**
 * MotorGhar Platform - API Gateway
 * Main entry point for the Fastify API Gateway
 * Reference: Phase 1 Spec § 1 (API Gateway Setup)
 */

import Fastify from 'fastify';
import { app } from './app/app';
import { getEnvConfig } from '@motorghar-platform/config';
import { LOG_LEVEL_DEFAULT_DEV, LOG_LEVEL_DEFAULT_PROD } from '@motorghar-platform/constants';

// Load and validate environment configuration
const config = getEnvConfig();

const host = process.env['HOST'] ?? 'localhost';
const port = config.PORT;

// Instantiate Fastify with Pino logger
const server = Fastify({
  logger: {
    level: config.NODE_ENV === 'development' ? LOG_LEVEL_DEFAULT_DEV : LOG_LEVEL_DEFAULT_PROD,
    transport:
      config.NODE_ENV === 'development'
        ? {
            target: 'pino-pretty',
            options: {
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
  },
  requestIdLogLabel: 'requestId',
  disableRequestLogging: false,
  requestIdHeader: 'x-request-id',
});

// Register your application as a normal plugin.
server.register(app);

// Graceful shutdown
const closeGracefully = async (signal: string) => {
  server.log.info(`Received signal ${signal}, closing gracefully`);
  await server.close();
  process.exit(0);
};

process.on('SIGINT', () => closeGracefully('SIGINT'));
process.on('SIGTERM', () => closeGracefully('SIGTERM'));

// Start listening
server.listen({ port, host }, (err) => {
  if (err) {
    server.log.error(err);
    process.exit(1);
  } else {
    server.log.info(`API Gateway ready at http://${host}:${port}`);
  }
});
