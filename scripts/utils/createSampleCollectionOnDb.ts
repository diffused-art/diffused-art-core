import * as dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';
import { STABLE_DIFFUSION_DEFAULTS_FOR_METADATA } from '../../functions/ai-sources/stable-diffusion/defaults';
import { addDays } from 'date-fns';
import { FontFamilies } from '../generatePlaceholderImage';

const prisma = new PrismaClient();

async function createSampleCollectionOnDb() {
  await prisma.collection.create({
    data: {
      title: 'Sample Collection - A Thousand Solana Cats',
      mintName: 'DiffArt Cats',
      slugUrl: '/sample-collection-thousand-sol-cats',
      mintSymbol: 'DIFFTCATS',
      mintPrice: 0.001,
      mintOpenAt: addDays(new Date(), 1),
      description:
        'This collection imagines a dream of a thousand cats on the colors of the Solana logo. A fitting first collection, huh?',
      promptSource: 'STABLEDIFFUSION',
      promptPhrase:
        'Dream of a thousand cats on the colors of purple, blue and pink, ukiyo-e art',
      promptSourceParams: {
        ...STABLE_DIFFUSION_DEFAULTS_FOR_METADATA,
      },
      nftPlaceholderForegroundColor: '#d5d5d5',
      nftPlaceholderBackgroundColor: '#7d1aa5',
      nftPlaceholderFontFamily: FontFamilies.Roboto,
      bannerImageURL:
        'https://bafybeihm3h2slf2iezvcmypwcvoro2r6odtsh3fsrska5pshiqknz5npfq.ipfs.nftstorage.link',
      mintTotalSupply: 100,
      artistName: 'diffused art',
      artistDescription: 'Revolutionizing the way we create immutable AI art on-chain',
      artistDiscordUser: 'Kevcode#9254',
      artistRoyaltiesWalletAddress:
        'Dh8M8SKdXN4kmCfF5QnFEHh4v78WApggB7AUnRwCn5hu',
      artistWebsiteURL: 'https://diffused.art',
      artistTwitterURL: 'https://twitter.com/diffused_art',
    },
  });
}

createSampleCollectionOnDb();
