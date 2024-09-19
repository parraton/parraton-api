import { TonClient4 } from '@ton/ton';
// import { getHttpV4Endpoint } from '@orbs-network/ton-access';
import { TON_CLIENT_URL } from './config';

// const endpointPromise = getHttpV4Endpoint();

export const tonClient = (async () => {
  const endpoint = TON_CLIENT_URL;
  // const endpoint = TON_CLIENT_URL || (await endpointPromise);

  return new TonClient4({
    endpoint,
    timeout: 60_000,
  });
})();
