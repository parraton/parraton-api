export const ERRORS = {
  VAULT_DATA_NOT_FOUND: 'Vault data not found',
  VAULT_CONFIG_NOT_FOUND: 'Vault config not found',
  TOKEN_METADATA_NOT_FOUND: 'Token metadata not found',
  KPI_TARGET_NOT_FOUND: 'KPI target not found',
  KPI_CURRENT_NOT_FOUND: 'KPI current not found',
} as const;

export const VAULT_CONFIGS = [
  {
    address:
      '0:bb309547a688b8eb328938a5765cb998334d2cea2b6dc511406f8274fb6d2220',
    kpis: {
      tvl: '100000',
      liquidityFraction: '0.001',
      revenue: '1000',
    },
  },
  {
    address:
      '0:b5bf01c8d51dff89a575321292dceb0b9cf96fbfb5a6f7c3c1a6d4db3c0c8aab',
    kpis: {
      tvl: '100000',
      liquidityFraction: '0.001',
      revenue: '1000',
    },
  },
  {
    address:
      '0:2b3c1f89500d2127c97f45778599a3745b48deb4d8fd22d6f3460adad9ac7133',
    kpis: {
      tvl: '100000',
      liquidityFraction: '0.001',
      revenue: '1000',
    },
  },
];

export const RETRY_CONFIG = {
  retries: 5,
  minTimeout: 2000,
  maxTimeout: 20_000,
};

export const KEY_PREFIXES = {
  VAULT_CONFIG: 'vault_config:',
  VAULT_DATA: 'vault_data:',
  TOKEN_METADATA: 'token_metadata:',
  KPI_TARGET: 'kpi_target:',
  KPI_CURRENT: 'kpi_current:',
} as const;
