import axios from 'axios';
import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();

export async function refreshWebhookMonitor() {
  let collections = await prisma.collection.findMany({
    where: {
      isFullyRevealed: false,
    },
  });
  collections = collections.filter(
    collection =>
      collection.mintTotalSupply !==
      [...new Set([...((collection.hashList as string[]) || [])])].length,
  );
  const accountAddresses = collections
    .map(({ mintCandyMachineId }) => mintCandyMachineId)
    .filter(Boolean);

  const { data } = await axios.get(
    `https://api.helius.xyz/v0/webhooks/${process.env.HELIUS_CM_MONITOR_ID}?api-key=${process.env.HELIUS_API_KEY}`,
  );

  await axios.put(
    `https://api.helius.xyz/v0/webhooks/${process.env.HELIUS_CM_MONITOR_ID}?api-key=${process.env.HELIUS_API_KEY}`,
    {
      ...data,
      accountAddresses,
    },
  );
}

refreshWebhookMonitor();
