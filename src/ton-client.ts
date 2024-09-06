import { TonClient4 } from '@ton/ton';
import { TON_CLIENT_URL } from './config';

export const tonClient = new TonClient4({
  endpoint: TON_CLIENT_URL,
  timeout: 60_000,
});
