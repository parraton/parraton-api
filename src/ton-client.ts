import { TonClient } from '@ton/ton';
import { TON_CLIENT_URL } from './config';

export const tonClient = new TonClient({
  endpoint: TON_CLIENT_URL,
  timeout: 60_000,
});
