import * as dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';
import { STABLE_DIFFUSION_DEFAULTS_FOR_METADATA } from '../../functions/ai-sources/stable-diffusion/defaults';
import { addDays } from 'date-fns';

const prisma = new PrismaClient();

async function createSampleCollectionOnDb() {
  await prisma.collection.create({
    data: {
      title: 'Sample Collection - Cyberpunk Town',
      mintName: 'DiffArt Cyberpunk',
      slugUrl: 'sample-collection-cyberpunk-town',
      mintSymbol: 'DIFFCTOWN',
      mintPrice: 0.001,
      mintOpenAt: addDays(new Date(), 1),
      description:
        'This collection tests a generation that uses an init image for giving context on a medieval town that gets mutated into a Cyberpunk dystopia.',
      promptSource: 'STABLEDIFFUSION',
      promptPhrase:
        'A digital illustration of a cyberpunk medieval town, robot dragons in the sky, trending in artstation, fantasy',
      promptSourceParams: {
        ...STABLE_DIFFUSION_DEFAULTS_FOR_METADATA,
        start_schedule: 0.6,
      },
      promptInitImage:
        'https://bafybeihzqncear44one6zvf2wqtjsjcu3hoz65ajg2ctmnthjx5qnzptym.ipfs.nftstorage.link',
      nftPlaceholderForegroundColor: '#4A4945',
      nftPlaceholderBackgroundColor: '#896F60',
      nftPlaceholderFontFamily: `'Roboto', sans-serif;`,
      bannerImageURL:
        'https://bafybeihzqncear44one6zvf2wqtjsjcu3hoz65ajg2ctmnthjx5qnzptym.ipfs.nftstorage.link',
      mintTotalSupply: 100,
      artist: {
        connectOrCreate: {
          create: {
            username: 'diffused.art',
            name: 'diffused.',
            description:
              'Revolutionizing the way we create immutable AI art on-chain',
            discordUser: 'Kevcode#9254',
            royaltiesWalletAddress:
              '7127qt51Yw8NWAEnKKVwmLfWRMv88VMQmVCw1eqRjjWh',
            walletAddress: '7127qt51Yw8NWAEnKKVwmLfWRMv88VMQmVCw1eqRjjWh',
            websiteURL: 'https://diffused.art',
            twitterURL: 'https://twitter.com/diffused_art',
          },
          where: {
            username: 'diffused.art',
          }
        },
      },
    },
  });
}

createSampleCollectionOnDb();
