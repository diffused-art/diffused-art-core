import cron from 'node-cron';
import { refreshHashLists } from '../scripts/refreshHashLists';
import { revealAllMintedNFTS } from '../scripts/revealAllMintedNFTS';

cron.schedule('30 * * * * *', async () => {
  console.info(
    `Cron "refreshHashLists" running again ${new Date().toLocaleString()}`,
  );
  await refreshHashLists();
  console.info(
    `Cron "refreshHashLists" finished ${new Date().toLocaleString()}`,
  );
});

cron.schedule('59 * * * * *', async () => {
  console.info(
    `Cron "revealAllMintedNFTS" running again ${new Date().toLocaleString()}`,
  );
  await revealAllMintedNFTS();
  console.info(
    `Cron "revealAllMintedNFTS" finished ${new Date().toLocaleString()}`,
  );
});
