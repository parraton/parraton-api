import memoizee from 'memoizee';
import asyncRetry from 'async-retry';

import { Address, fromNano } from '@ton/core';
import { TonJettonTonStrategy, Vault } from '@parraton/sdk';

import { tonClient } from './ton-client';
import { tonApiClient } from './ton-api';

import { RETRY_CONFIG, VAULT_ADDRESSES } from './constants';

export const getVaults = memoizee(
  async () => {
    const vaults = [];
    for (const vaultAddress of VAULT_ADDRESSES) {
      const vaultData = await getVault(Address.parse(vaultAddress));
      vaults.push(vaultData);
    }
    return vaults;
  },
  {
    maxAge: 60_000,
    promise: true,
    preFetch: true,
  }
);

export const getVault = memoizee(
  async (vaultAddress: Address) => {
    const vaultAddressFormatted = vaultAddress.toString();
    const lpAddress = await getLPAddress(vaultAddress);
    const { lpPrice, poolTvlUsd } = await getDedustLPInfo(lpAddress.toString());
    const tvlUsd = await getVaultTVLUSD(vaultAddress, lpPrice);
    const rewardsStats = await getRewardsStats(
      lpAddress.toString(),
      poolTvlUsd
    );
    const { managementFee } = await getVaultData(vaultAddress);
    const lpInfo = await getLPMetadata(vaultAddress);
    const plpInfo = await getPLPMetadata(vaultAddress);
    const plpPrice = await getVaultLPPriceUSD(lpPrice, vaultAddress);
    const pendingRewardsUSD = await getPendingRewardsUSD(vaultAddress);

    return {
      name: lpInfo.metadata.name,
      vaultAddress: vaultAddress.toString(),
      vaultAddressFormatted,
      lpMetadata: lpInfo.metadata,
      lpTotalSupply: lpInfo.total_supply,
      plpMetadata: plpInfo.metadata,
      plpTotalSupply: plpInfo.total_supply,
      plpPriceUsd: plpPrice.toFixed(2),
      lpPriceUsd: lpPrice.toFixed(2),
      tvlUsd: tvlUsd.toFixed(2),
      pendingRewardsUSD: pendingRewardsUSD.toFixed(2),
      dpr: rewardsStats.dpr.toFixed(4),
      apr: rewardsStats.apr.toFixed(4),
      apy: rewardsStats.apy.toFixed(4),
      dailyUsdRewards: rewardsStats.daily.toFixed(4),
      managementFee: managementFee.toString(),
    };
  },
  {
    maxAge: 60_000,
    promise: true,
    preFetch: true,
  }
);

const getPLPMetadata = memoizee(
  async (vaultAddress: Address) => {
    return tonApiClient.jettons.getJettonInfo(vaultAddress.toString());
  },
  {
    maxAge: 24 * 60 * 60 * 1000, // 1 day

    promise: true,
  }
);

const getLPAddress = memoizee(
  async (vaultAddress: Address) => {
    const strategyInfo = await getStrategyInfoByVault(vaultAddress);
    return strategyInfo.poolAddress;
  },
  {
    maxAge: 24 * 60 * 60 * 1000, // 1 day

    promise: true,
  }
);

const getLPMetadata = memoizee(
  async (vaultAddress: Address) => {
    const lpAddress = await getLPAddress(vaultAddress);
    return tonApiClient.jettons.getJettonInfo(lpAddress.toString());
  },
  {
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    promise: true,
  }
);

const getVaultData = memoizee(
  async (vaultAddress: Address) => {
    const rawVault = Vault.createFromAddress(vaultAddress);
    const vault = (await tonClient).open(rawVault);

    return asyncRetry(() => vault.getVaultData(), RETRY_CONFIG);
  },
  {
    maxAge: 60_000,
    promise: true,
  }
);

const getDedustV3Pool = memoizee(
  async (address: string) => {
    const operationName = 'GetPool';
    const query =
      'query GetPool($address: ID!) { pool(address: $address) { totalSupply assets reserves } }';

    const variables = {
      address,
    };

    return fetchDedustV3Api<{
      pool: {
        totalSupply: string;
        assets: [string, string];
        reserves: [string, string];
      };
    }>(operationName, query, variables);
  },
  {
    maxAge: 60_000,
    promise: true,
  }
);

const getDedustLPInfo = memoizee(
  async (lpAddress: string) => {
    const { pool } = await getDedustV3Pool(lpAddress);
    const [asset1Type, asset1Address] = pool.assets[0].split(':');
    const [asset2Type, asset2Address] = pool.assets[1].split(':');

    const allDedustAssets = await getAllDedustAssets();

    const asset1 = allDedustAssets.assets.find(
      (asset) => asset.address == asset1Address && asset.type == asset1Type
    );
    const asset2 = allDedustAssets.assets.find(
      (asset) => asset.address == asset2Address && asset.type == asset2Type
    );

    if (!asset1 || !asset2) {
      throw new Error('Asset not found');
    }

    const [reserve1, reserve2] = pool.reserves.map(BigInt);

    const oneLP = 1_000_000_000n;
    const totalSupply = BigInt(pool.totalSupply);

    const assetOneUnderLP = (oneLP * reserve1) / totalSupply;
    const assetTwoUnderLP = (oneLP * reserve2) / totalSupply;

    const asset1Price = Number(asset1.price);
    const asset2Price = Number(asset2.price);

    const precision = 10_000;

    const lpPrice =
      (Number(
        (assetOneUnderLP * BigInt(precision)) / 10n ** BigInt(asset1.decimals)
      ) /
        precision) *
        asset1Price +
      (Number(
        (assetTwoUnderLP * BigInt(precision)) / 10n ** BigInt(asset2.decimals)
      ) /
        precision) *
        asset2Price;

    return {
      lpPrice,
      asset1Price,
      asset2Price,
      poolTvlUsd:
        (Number((totalSupply * BigInt(precision)) / oneLP) * lpPrice) /
        precision,
    };
  },
  {
    maxAge: 60_000,
    promise: true,
  }
);

const getAllDedustAssets = memoizee(
  async () => {
    const operationName = 'GetAllAssets';
    const query =
      'query GetAllAssets { assets { type address price decimals } }';

    return fetchDedustV3Api<{
      assets: {
        type: string;
        address: string;
        price: string;
        decimals: number;
      }[];
    }>(operationName, query, {});
  },
  {
    maxAge: 60_000,
    promise: true,
  }
);

const getVaultLPPriceUSD = memoizee(
  async (lpPrice: number, vaultAddress: Address) => {
    const rawVault = Vault.createFromAddress(vaultAddress);
    const vault = (await tonClient).open(rawVault);
    const estimatedLpAmount = await asyncRetry(
      () => vault.getEstimatedLpAmount(1_000_000_000n),
      RETRY_CONFIG
    );

    const precision = 1000;

    return (
      (Number((estimatedLpAmount * BigInt(precision)) / 10n ** 9n) * lpPrice) /
      precision
    );
  },
  {
    maxAge: 60_000,
    promise: true,
  }
);

const getPendingRewardsUSD = memoizee(
  async (vaultAddress: Address) => {
    const balance = await getAccountTonBalance(vaultAddress);
    const vaultData = await getVaultData(vaultAddress);
    const tonPrice = await getTonPrice();

    return (
      (Number(balance) - Number(fromNano(vaultData.managementFee))) * tonPrice
    );
  },
  {
    maxAge: 60_000,
    promise: true,
  }
);

const getAccountTonBalance = memoizee(
  async (accountAddress: Address) => {
    const {
      last: { seqno },
    } = await asyncRetry(
      async () => (await tonClient).getLastBlock(),
      RETRY_CONFIG
    );
    const { account } = await asyncRetry(
      async () => (await tonClient).getAccountLite(seqno, accountAddress),
      RETRY_CONFIG
    );
    const balance = fromNano(account.balance.coins);
    return balance;
  },
  {
    maxAge: 60_000,
    promise: true,
  }
);

const getVaultTVLUSD = memoizee(
  async (vaultAddress: Address, lpPriceUSD: number) => {
    const balance = await getAccountTonBalance(vaultAddress);
    const tonPrice = await getTonPrice();

    const vaultData = await getVaultData(vaultAddress);
    const precision = 1000;

    const tvl =
      (Number((vaultData.depositedLp * BigInt(precision)) / 10n ** 9n) /
        precision) *
        lpPriceUSD +
      Number(balance) * tonPrice;

    return tvl;
  },
  {
    maxAge: 60_000,
    promise: true,
  }
);

const getTonPrice = memoizee(
  async () => {
    const { rates } = await tonApiClient.rates.getRates({
      currencies: ['USD'],
      tokens: ['TON'],
    });

    const rate = rates['TON'].prices?.['USD'];

    if (!rate) {
      throw new Error('TON price not found');
    }

    return rate;
  },
  {
    maxAge: 60_000,
    promise: true,
  }
);

const getAllTonBoosts = memoizee(
  async () => {
    const fetchResult = await fetchDedustV3Api<{
      boosts: {
        liquidityPool: string;
        asset: string;
        budget: string;
        rewardPerDay: string;
        startAt: string;
        endAt: string;
      }[];
    }>(
      'GetAllBoosts',
      'query GetAllBoosts { boosts { liquidityPool asset budget rewardPerDay startAt endAt } }',
      {}
    );

    return fetchResult.boosts;
  },
  {
    maxAge: 60_000 * 5,
    promise: true,
  }
);

const getRewardsStats = memoizee(
  async (lpAddress: string, tvlUsd: number) => {
    const allBoosts = await getAllTonBoosts();
    const nativeBoost = allBoosts.find(
      (boost) =>
        boost.liquidityPool == lpAddress &&
        boost.asset === 'native' &&
        new Date(boost.startAt) < new Date() &&
        new Date(boost.endAt) > new Date()
    );

    const dailyRewards = nativeBoost?.rewardPerDay
      ? Number(fromNano(nativeBoost.rewardPerDay))
      : 0;

    const dailyRewardsUsd = dailyRewards * (await getTonPrice());
    const apr = (dailyRewardsUsd * 365) / tvlUsd;
    const apy = (1 + apr / 365) ** 365 - 1;

    return {
      dpr: (apr * 100) / 365,
      apr: apr * 100,
      apy: apy * 100,
      daily: dailyRewardsUsd,
    };
  },
  {
    maxAge: 60_000 * 10,
    promise: true,
  }
);

const getStrategyInfoByVault = memoizee(
  async (vaultAddress: Address) => {
    const { strategyAddress } = await getVaultData(vaultAddress);
    const rawStrategy = TonJettonTonStrategy.createFromAddress(strategyAddress);
    const strategy = (await tonClient).open(rawStrategy);

    return asyncRetry(() => strategy.getStrategyData(), {
      retries: 5,
      minTimeout: 2000,
      maxTimeout: 20_000,
    });
  },
  {
    maxAge: 60_000 * 5,
    promise: true,
  }
);

const fetchDedustV3Api = async <Response = unknown, Vars = unknown>(
  operationName: string,
  query: string,
  variables: Vars
): Promise<Response> => {
  const url = 'https://api.dedust.io/v3/graphql';
  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({
      operationName,
      query,
      variables,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const json = (await response.json()) as { data: Response };
  return json.data;
};
