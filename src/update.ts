import { Address } from '@ton/core';
import {
  getKpiCurrent,
  getKpiTarget,
  getTokenMetadata,
  getVaultData,
  readAllVaultAddresses,
  saveKpiCurrent,
  saveKpiTarget,
  saveTokenMetadata,
  saveVaultData,
} from './db.data';
import { getLPMetadata, getPLPMetadata, fetchVaultData } from './onchain.data';
import { VAULT_CONFIGS } from './constants';

export async function setConfigsOnInit() {
  for (const vaultConfig of VAULT_CONFIGS) {
    console.log('Setting config for vault', vaultConfig.address);
    const vaultAddress = Address.parse(vaultConfig.address);
    await saveKpiTarget({
      vaultAddress: vaultAddress.toString(),
      ...vaultConfig.kpis,
    });

    await updateSingleVaultData(vaultAddress);
    const { metadata: lpMetadata } = await getLPMetadata(vaultAddress);
    await saveTokenMetadata(lpMetadata);
    const { metadata: plpMetadata } = await getPLPMetadata(vaultAddress);
    await saveTokenMetadata(plpMetadata);
    console.log('Config set for vault', vaultAddress.toString());
  }
  return [];
}

export async function updateSingleVaultData(vaultAddress: Address) {
  console.log('Updating vault data for', vaultAddress.toString());
  const vaultData = await fetchVaultData(vaultAddress);
  await saveVaultData(vaultData);
  await saveKpiCurrent({
    vaultAddress: vaultAddress.toString(),
    ...vaultData.kpis,
  });

  const { metadata: lpMetadata } = await getLPMetadata(vaultAddress);
  await saveTokenMetadata(lpMetadata);
  const { metadata: plpMetadata } = await getPLPMetadata(vaultAddress);
  await saveTokenMetadata(plpMetadata);
  console.log('Vault data updated for', vaultAddress.toString());
}
export async function updateVaultData() {
  const vaultAddresses = await readAllVaultAddresses();
  console.log('Updating vault data for', vaultAddresses.length, 'vaults');
  for (const vaultAddress of vaultAddresses) {
    console.log('Updating vault data for', vaultAddress.toString());
    await updateSingleVaultData(Address.parse(vaultAddress));
  }
}

export async function getVaults() {
  const vaultAddresses = await readAllVaultAddresses();
  const vaultsData = [];
  for (const vaultAddress of vaultAddresses) {
    const vaultData = await getVaultData(vaultAddress);
    const kpiCurrent = await getKpiCurrent(vaultAddress);
    const kpiTarget = await getKpiTarget(vaultAddress);
    const plpMetadata = await getTokenMetadata(
      Address.parse(vaultAddress).toRawString()
    );
    const lpMetadata = await getTokenMetadata(
      Address.parse(vaultData.lpAddress).toRawString()
    );

    vaultsData.push({
      ...vaultData,
      plpMetadata,
      lpMetadata,
      kpis: {
        tvl: { current: kpiCurrent.tvl, target: kpiTarget.tvl },
        liquidityFraction: {
          current: kpiCurrent.liquidityFraction,
          target: kpiTarget.liquidityFraction,
        },
        revenue: { current: kpiCurrent.revenue, target: kpiTarget.revenue },
      },
    });
  }
  return vaultsData;
}
