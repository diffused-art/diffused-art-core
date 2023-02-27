import { Collection } from '@prisma/client';
import { useLocalStorage } from '@solana/wallet-adapter-react';
import axios from 'axios';
import { useRouter } from 'next/router';
import React, { useCallback } from 'react';
import { useQuery } from 'react-query';
import {
  ActionTypesCreateCollectionStore,
  useCreateCollectionStore,
} from '../../../hooks/useCreateCollectionStore';

export default function PublishDone() {
  const { state, dispatch } = useCreateCollectionStore();
  const router = useRouter();

  const data = useQuery<Collection>(
    'created-collection',
    () =>
      axios
        .get(`/api/collection/${state.collectionId}`)
        .then(data => data.data.data as Collection),
    {
      enabled: state.publishStep === 'done',
    },
  );

  const cleanAndRedirect = useCallback(() => {
    dispatch({
      type: ActionTypesCreateCollectionStore.Reset,
    });

    router.push(`/drops/${data.data?.slugUrl}`);
  }, [dispatch, data, router]);
  
  if (state.publishStep !== 'done') return null;

  return (
    <div>
      <h1 className="my-3">Your drop is published!</h1>
      <h1 className="my-3">
        There is no need to record the data on your browser anymore, so when you
        click on the button below, the data will be deleted from your browser.
      </h1>
      <button
        disabled={data.isLoading}
        onClick={cleanAndRedirect}
        className="bg-main-yellow text-black rounded my-3 p-3 text-center w-full"
      >
        {data.isLoading ? 'Loading...' : 'Click here to go the drop page.'}
      </button>
    </div>
  );
}
