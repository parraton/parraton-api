import { config } from 'dotenv';

console.log('Applying .env configuration');
config();

export const PORT = integerWithFallback('PORT', 3001);
export const HOST = process.env.HOST || '0.0.0.0';

export const TONAPI_URL = process.env.TONAPI_URL || 'https://tonapi.io';
export const TON_CLIENT_URL =
  process.env.TON_CLIENT_URL || 'https://mainnet-v4.tonhubapi.com';

/* helpers */
function integerWithFallback(key: string, defaultValue: number) {
  const env = process.env[key];
  return env ? parseInt(env) : defaultValue;
}
