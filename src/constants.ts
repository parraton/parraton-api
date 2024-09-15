export const ERRORS = {} as const;

export const VAULT_ADDRESSES: string[] = [
  '0:bb309547a688b8eb328938a5765cb998334d2cea2b6dc511406f8274fb6d2220',
];

export const RETRY_CONFIG = {
  retries: 5,
  minTimeout: 2000,
  maxTimeout: 20_000,
};
