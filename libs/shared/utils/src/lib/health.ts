/**
 * Health Check Utilities
 * Provides health check functions for infrastructure services
 * Reference: Solution Design v1.0 § 11 (Observability)
 */

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    [service: string]: {
      status: 'up' | 'down';
      responseTime?: number;
      error?: string;
    };
  };
  timestamp: string;
}

/**
 * Create a health check response
 */
export function createHealthResponse(
  checks: HealthStatus['checks']
): HealthStatus {
  const allUp = Object.values(checks).every((check) => check.status === 'up');
  const someDown = Object.values(checks).some((check) => check.status === 'down');

  return {
    status: allUp ? 'healthy' : someDown ? 'degraded' : 'unhealthy',
    checks,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Check database connectivity
 */
export async function checkDatabase(
  checkFn: () => Promise<void>
): Promise<HealthStatus['checks']['database']> {
  const start = Date.now();
  try {
    await checkFn();
    return {
      status: 'up',
      responseTime: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check Redis connectivity
 */
export async function checkRedis(
  checkFn: () => Promise<void>
): Promise<HealthStatus['checks']['redis']> {
  const start = Date.now();
  try {
    await checkFn();
    return {
      status: 'up',
      responseTime: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check MinIO connectivity
 */
export async function checkMinIO(
  checkFn: () => Promise<void>
): Promise<HealthStatus['checks']['minio']> {
  const start = Date.now();
  try {
    await checkFn();
    return {
      status: 'up',
      responseTime: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
