import { Collection } from '@prisma/client';
import { addMinutes } from 'date-fns';
import { CreateCollectionStoreForm } from '../../../hooks/useCreateCollectionStore';

export function getDatetime(date, time) {
  const dateTime = `${date}T${time}`;
  const dateObject = new Date(dateTime + 'Z');
  return dateObject;
}

interface APIBodyInterface extends Partial<Collection> {
  tags: string[];
}

export function generateAPIObjectFromStore(
  store: CreateCollectionStoreForm,
): APIBodyInterface {
  return {
    title: store.dropName,
    description: store.dropDescription,
    promptPhrase: store.prompt,
    promptInitImage: store.initImage,
    promptSource: 'STABLEDIFFUSION',
    promptSourceParams: {
      cfgScale: store.cfgScale,
      width: store.width,
      height: store.height,
      engine: store.engine,
    },
    bannerImageURL: store.teaserImage,
    mintName: `${store.dropName} #`,
    mintPrice: store.currencyTotal as any,
    mintSellerFeeBasisPoints: 250,
    mintOpenAt: store.startImediately
      ? (addMinutes(new Date(Date.now()), 15).getTime() as any)
      : (getDatetime(store.startDate, store.startTime).getTime() as any),
    mintTotalSupply: store.quantity,
    tags: store.keywords,
  };
}
