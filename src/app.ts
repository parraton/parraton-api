import fastify from 'fastify';
import fastifyCors from '@fastify/cors';

import { HOST, PORT } from './config';
import { getVaults } from './data';

const getVaultsWithCacheFallback = withCacheFallback(getVaults, 60_000 * 2);

export async function bootstrapApp() {
  const app = fastify({ logger: true });

  app.register(fastifyCors, {});
  app.log.info('Bootstrapping app');

  /* Wait until all the plugins have finished loading */
  await app.after();

  app.get('/v1/vaults', async (_, reply) => {
    try {
      const vaults = await getVaultsWithCacheFallback();

      return vaults;
    } catch (error) {
      reply.status(500).send({
        error: 'Internal server error',
      });
    }
  });

  app.listen({
    host: HOST,
    port: PORT,
  });
}

/**
 * Cache the response of a function for a given amount of time
 * And will always return the cached value if the function fails
 *
 * Though will throw the error if the cache TTL has expired AND function fails
 */
function withCacheFallback<T>(
  fn: (...args: unknown[]) => Promise<T>,
  maxAge: number
) {
  let cache: { ttl: number; value: T | undefined };

  return async (...args: Parameters<typeof fn>) => {
    try {
      const value = await fn(...args);
      cache = { ttl: Date.now() + maxAge, value };

      return value;
    } catch (error) {
      if (cache && cache.ttl > Date.now() && cache.value) {
        return cache.value;
      }

      throw error;
    }
  };
}
