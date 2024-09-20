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
        target: '0.001',
      },
      revenue: {
        target: '1000',
      },
    },
  },
  {
    address:
      '0:b5bf01c8d51dff89a575321292dceb0b9cf96fbfb5a6f7c3c1a6d4db3c0c8aab',
    kpis: {
      tvl: {
        target: '100000',
      },
      liquidityFraction: {
        target: '0.001',
      },
      revenue: {
        target: '1000',
      },
    },
  },
  {
    address:
      '0:2b3c1f89500d2127c97f45778599a3745b48deb4d8fd22d6f3460adad9ac7133',
    kpis: {
      tvl: {
        target: '100000',
      },
      liquidityFraction: {
        target: '0.001',
      },
      revenue: {
        target: '1000',
      },
    },
  },
];

export const RETRY_CONFIG = {
  retries: 5,
  minTimeout: 2000,
  maxTimeout: 20_000,
};
