import { KEY_PREFIXES, ERRORS } from './constants';
import { redis } from './db';

export type TokenMetadata = {
  address: string;
  name: string;
  symbol: string;
  decimals: string;
  image?: string;
};

export type Kpi = {
  vaultAddress: string;
  tvl: string;
  liquidityFraction: string;
  revenue: string;
};

export type VaultData = {
  name: string;
  vaultAddress: string;
  lpAddress: string;
  vaultAddressFormatted: string;
  lpTotalSupply: string;
  plpTotalSupply: string;
  plpPriceUsd: string;
  lpPriceUsd: string;
  tvlUsd: string;
  pendingRewardsUSD: string;
  dpr: string;
  apr: string;
  apy: string;
  dailyUsdRewards: string;
  managementFee: string;
};

function withVaultDataPrefix(vaultAddress: string) {
  return `${KEY_PREFIXES.VAULT_DATA}${vaultAddress}`;
}

function withTokenMetadataPrefix(tokenAddress: string) {
  return `${KEY_PREFIXES.TOKEN_METADATA}${tokenAddress}`;
}

function withKpiTargetPrefix(kpiName: string) {
  return `${KEY_PREFIXES.KPI_TARGET}${kpiName}`;
}

function withKpiCurrentPrefix(vaultAddress: string) {
  return `${KEY_PREFIXES.KPI_CURRENT}${vaultAddress}`;
}

export async function saveVaultData({
  vaultAddress,
  ...restOfVault
}: VaultData) {
  await redis.hset(withVaultDataPrefix(vaultAddress), restOfVault);
}

export async function saveTokenMetadata({
  address,
  ...restOfToken
}: TokenMetadata) {
  await redis.hset(withTokenMetadataPrefix(address), restOfToken);
}

export async function saveKpiTarget({ vaultAddress, ...restOfKpi }: Kpi) {
  await redis.hset(withKpiTargetPrefix(vaultAddress), restOfKpi);
}

export async function saveKpiCurrent({ vaultAddress, ...restOfKpi }: Kpi) {
  await redis.hset(withKpiCurrentPrefix(vaultAddress), restOfKpi);
}

export async function updateVaultData(
  vaultAddress: string,
  vault: Partial<VaultData>
) {
  return redis.hset(withVaultDataPrefix(vaultAddress), vault);
}

export async function updateTokenMetadata(
  tokenAddress: string,
  token: Partial<TokenMetadata>
) {
  return redis.hset(withTokenMetadataPrefix(tokenAddress), token);
}

export async function updateKpiTarget(vaultAddress: string, kpi: Partial<Kpi>) {
  return redis.hset(withKpiTargetPrefix(vaultAddress), kpi);
}

export async function updateKpiCurrent(
  vaultAddress: string,
  kpi: Partial<Kpi>
) {
  return redis.hset(withKpiCurrentPrefix(vaultAddress), kpi);
}

export async function doesVaultDataExist(vaultAddress: string) {
  return (await redis.exists(withVaultDataPrefix(vaultAddress))) === 1;
}

export async function doesTokenMetadataExist(tokenAddress: string) {
  return (await redis.exists(withTokenMetadataPrefix(tokenAddress))) === 1;
}

export async function doesKpiTargetExist(vaultAddress: string) {
  return (await redis.exists(withKpiTargetPrefix(vaultAddress))) === 1;
}

export async function doesKpiCurrentExist(vaultAddress: string) {
  return (await redis.exists(withKpiCurrentPrefix(vaultAddress))) === 1;
}

export async function getVaultData(vaultAddress: string): Promise<VaultData> {
  const vaultData = await redis.hgetall(withVaultDataPrefix(vaultAddress));
  if (Object.keys(vaultData).length === 0) {
    throw new Error(ERRORS.VAULT_DATA_NOT_FOUND);
  }

  return {
    vaultAddress,
    name: vaultData.name,
    vaultAddressFormatted: vaultData.vaultAddressFormatted,
    lpTotalSupply: vaultData.lpTotalSupply,
    plpTotalSupply: vaultData.plpTotalSupply,
    plpPriceUsd: vaultData.plpPriceUsd,
    lpPriceUsd: vaultData.lpPriceUsd,
    tvlUsd: vaultData.tvlUsd,
    lpAddress: vaultData.lpAddress,
    pendingRewardsUSD: vaultData.pendingRewardsUSD,
    dpr: vaultData.dpr,
    apr: vaultData.apr,
    apy: vaultData.apy,
    dailyUsdRewards: vaultData.dailyUsdRewards,
    managementFee: vaultData.managementFee,
  };
}
export async function getTokenMetadata(
  tokenAddress: string
): Promise<TokenMetadata> {
  const tokenData = await redis.hgetall(withTokenMetadataPrefix(tokenAddress));
  if (Object.keys(tokenData).length === 0) {
    throw new Error(ERRORS.TOKEN_METADATA_NOT_FOUND);
  }

  return {
    address: tokenAddress,
    name: tokenData.name,
    symbol: tokenData.symbol,
    image: tokenData.image,
    decimals: tokenData.decimals,
  };
}

export async function getKpiTarget(vaultAddress: string): Promise<Kpi> {
  const kpiTarget = await redis.hgetall(withKpiTargetPrefix(vaultAddress));
  if (Object.keys(kpiTarget).length === 0) {
    throw new Error(ERRORS.KPI_TARGET_NOT_FOUND);
  }

  return {
    vaultAddress,
    tvl: kpiTarget.tvl,
    liquidityFraction: kpiTarget.liquidityFraction,
    revenue: kpiTarget.revenue,
  };
}

export async function getKpiCurrent(vaultAddress: string): Promise<Kpi> {
  const kpiCurrent = await redis.hgetall(withKpiCurrentPrefix(vaultAddress));
  if (Object.keys(kpiCurrent).length === 0) {
    throw new Error(ERRORS.KPI_CURRENT_NOT_FOUND);
  }

  return {
    vaultAddress,
    tvl: kpiCurrent.tvl,
    liquidityFraction: kpiCurrent.liquidityFraction,
    revenue: kpiCurrent.revenue,
  };
}

export function readAllVaultAddresses() {
  return new Promise<string[]>((resolve, reject) => {
    const allKeys: string[] = [];

    const stream = redis.scanStream({
      match: `${KEY_PREFIXES.VAULT_DATA}*`,
    });

    stream.on('data', async (userKeys: string[]) => {
      allKeys.push(
        ...userKeys.map((key) => key.replace(KEY_PREFIXES.VAULT_DATA, ''))
      );
    });

    stream.on('error', (error) => {
      reject(error);
    });

    stream.on('end', () => {
      resolve(allKeys);
    });
  });
}
