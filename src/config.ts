import { config } from 'dotenv';

console.log('Applying .env configuration');
config();

export const PORT = integerWithFallback('PORT', 3001);

export const HOST = process.env.HOST || '0.0.0.0';

export const TONAPI_URL = process.env.TONAPI_URL || 'https://tonapi.io';

export const TON_CLIENT_URL =
  process.env.TON_CLIENT_URL || 'https://mainnet-v4.tonhubapi.com';

export const REDIS_CONNECTION_STRING =
  process.env.REDIS_CONNECTION_STRING || 'redis://localhost:6379';

export const DEDUST_API_URL =
  process.env.DEDUST_API_URL || 'https://api.dedust.io/v3/graphql';

export const TONCENTER_API_KEY = process.env.TONCENTER_API_KEY || '';

export const IPFS_GATEWAY =
  process.env.IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/';
/* helpers */
function integerWithFallback(key: string, defaultValue: number) {
  const env = process.env[key];
  return env ? parseInt(env) : defaultValue;
}
