import { bootstrapApp } from './app';
import { schedule } from 'node-cron';
import { updateVaultData, setConfigsOnInit } from './update';

async function main() {
  await bootstrapApp();
  await setConfigsOnInit();

  schedule(
    '*/15 * * * *', // every 15 minutes
    updateVaultData
  );
}

main().catch((error) => {
  console.error(error);

  process.exit(1);
});
