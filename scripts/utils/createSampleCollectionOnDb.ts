import * as dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';
import { STABLE_DIFFUSION_DEFAULTS_FOR_METADATA } from '../../functions/ai-sources/stable-diffusion/defaults';
import { addDays } from 'date-fns';

const prisma = new PrismaClient();

async function createSampleCollectionOnDb() {
  await prisma.collection.create({
    data: {
      title: 'Sample Collection - Cyberpunk Dragon',
      mintName: 'Cyberpunk Dragon',
      slugUrl: '/sample-collection-cyberpunk-dragon',
      mintSymbol: 'CPDRAGON',
      mintPrice: 0.01,
      mintOpenAt: addDays(new Date(), 1),
      description:
        'This collection imagines a cyberpunk dragon on the colors of the Solana logo. A fitting first collection, huh?',
      promptSource: 'STABLEDIFFUSION',
      promptPhrase:
        'The dream of a cyberpunk dragon on the colors of purple, blue and pink, ukiyo',
      promptSourceParams: {
        ...STABLE_DIFFUSION_DEFAULTS_FOR_METADATA,
      },
      bannerImageURL:
        'https://bafybeig4xlmbku44liu2tnc4dxy7d4zyjb3pkgy5kr2dmcjbu6d4ai3uvi.ipfs.nftstorage.link/',
      nftPlaceholderImageURL:
        'https://bafybeif7vz5efqf3fjhpncih6gmdqig7u7fgmnezro6eigoxf7fzhldhnm.ipfs.nftstorage.link/',
      mintTotalSupply: 100,
      artistName: 'Diffused Art',
      artistDescription: 'Revolutionizing the way we create art',
      artistDiscordUser: 'Kevcode#9254',
      artistRoyaltiesWalletAddress:
        'Dh8M8SKdXN4kmCfF5QnFEHh4v78WApggB7AUnRwCn5hu',
      artistWebsiteURL: 'https://diffused.art',
      artistTwitterURL: 'https://twitter.com/diffused_art',
    },
  });
}

createSampleCollectionOnDb();
