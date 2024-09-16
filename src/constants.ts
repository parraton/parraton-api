export const ERRORS = {} as const;

export type VaultConfig = {
  address: string;
  kpis: {
    tvl: {
      target: string;
      current?: string;
    };
    liquidityFraction: {
      target: string;
      current?: string;
    };
    revenue: {
      target: string;
      current?: string;
    };
  };
};

export const VAULT_CONFIGS: VaultConfig[] = [
  {
    address:
      '0:bb309547a688b8eb328938a5765cb998334d2cea2b6dc511406f8274fb6d2220',
    kpis: {
      tvl: {
        target: '100000',
      },
      liquidityFraction: {
        target: '0.1',
      },
      revenue: {
        target: '100',
      },
    },
  },
];

export const RETRY_CONFIG = {
  retries: 5,
  minTimeout: 2000,
  maxTimeout: 20_000,
};
