import cron from 'node-cron';
import { revealAllMintedNFTS } from '../scripts/revealAllMintedNFTS';

cron.schedule('15 * * * * *', async () => {
  console.info(
    `Cron "revealAllMintedNFTS" running again ${new Date().toLocaleString()}`,
  );
  await revealAllMintedNFTS().catch((e) => console.error(e));
  console.info(
    `Cron "revealAllMintedNFTS" finished ${new Date().toLocaleString()}`,
  );
});
