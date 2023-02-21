import {
  CandyMachine,
  sol,
  toDateTime,
  TransactionBuilder,
  Nft,
  CandyGuard,
  DefaultCandyGuardSettings,
} from '@metaplex-foundation/js';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  BlockhashWithExpiryBlockHeight,
  Connection,
  PublicKey,
  Transaction,
} from '@solana/web3.js';
import axios from 'axios';
import { addMinutes } from 'date-fns';
import { useCallback } from 'react';
import { retry } from 'ts-retry-promise';
import { wrapInfiniteRetry } from '../utils/wrapInfiniteRetry';
import {
  ActionTypesCreateCollectionStore,
  useCreateCollectionStore,
} from './useCreateCollectionStore';
import useMetaplexWriteCli from './useMetaplexWriteCli';
import useToast, { ToastIconEnum } from './useToast';

async function sendAndConfirmTransaction(
  connection: Connection,
  signedTransaction: Transaction,
) {
  const txid = await connection.sendRawTransaction(
    signedTransaction.serialize(),
    {
      skipPreflight: true,
    },
  );

  // Confirm the transaction
  console.info('Confirming txn');
  const signatureStatus = await wrapInfiniteRetry(() =>
    connection.confirmTransaction(txid, 'confirmed'),
  );
  console.info('Signature Status: ', signatureStatus);

  return signatureStatus;
}

export default function useCandyMachineCreate() {
  const wallet = useWallet();
  const { connection } = useConnection();
  const metaplexCli = useMetaplexWriteCli();
  const { state, dispatch } = useCreateCollectionStore();
  const toast = useToast();

  const createCollectionNFT = useCallback(async () => {
    const {
      data: { data: collectionData },
    } = await axios.get(`/api/collection/${state.collectionId}`);

    if (!collectionData.collectionOnChainAddress) {
      const {
        data: { data },
      } = await axios.post(
        `/api/collection/${state.collectionId}/create-collection-nft`,
      );
      const transaction = Transaction.from(data.data);

      const signedTxn = await wallet
        ?.signTransaction?.(transaction)
        .catch(() => {
          toast({
            message: 'User refused to sign in the transaction',
            icon: ToastIconEnum.FAILURE,
          });
        });
      if (!signedTxn) return false;
      await sendAndConfirmTransaction(metaplexCli.connection, signedTxn!);
      const collectionOnChainAddress = signedTxn?.signatures
        .find(
          sig =>
            ![
              collectionData.updateAuthorityPublicKey,
              metaplexCli.identity().publicKey.toString(),
            ].includes(sig.publicKey.toString()),
        )
        ?.publicKey.toString();

      console.info(
        'Created collection NFT, address ' + collectionOnChainAddress,
      );

      dispatch({
        type: ActionTypesCreateCollectionStore.SetFieldValue,
        payload: {
          field: 'collectionNFTAddress',
          value: collectionOnChainAddress || '',
        },
      });

      await axios.put(`/api/collection/${state.collectionId}`, {
        collectionOnChainAddress,
      });

      return true;
    }
  }, [state.collectionId, wallet, metaplexCli, toast, dispatch]);

  const createCandyMachine = useCallback(async () => {
    const {
      data: { data },
    } = await axios.get(`/api/collection/${state.collectionId}`);

    if (!data.mintCandyMachineId) {
      let startDate = toDateTime(new Date(data.mintOpenAt).getTime());
      if (new Date(data.mintOpenAt) <= new Date(Date.now())) {
        startDate = toDateTime(
          new Date(addMinutes(new Date(Date.now()), 15)).getTime(),
        );
      }

      const {
        data: { data: transactionData },
      } = await axios.post(
        `/api/collection/${state.collectionId}/create-candy-machine`,
      );
      const transaction = Transaction.from(transactionData.data);
      const signedTxn = await wallet
        ?.signTransaction?.(transaction)
        .catch(() => {
          toast({
            message: 'User refused to sign in the transaction',
            icon: ToastIconEnum.FAILURE,
          });
        });
      if (!signedTxn) return false;
      await sendAndConfirmTransaction(metaplexCli.connection, signedTxn!);
      const mintCandyMachineId = signedTxn?.signatures
        .find(
          sig =>
            ![
              data.updateAuthorityPublicKey,
              metaplexCli.identity().publicKey.toString(),
            ].includes(sig.publicKey.toString()),
        )
        ?.publicKey.toString();

      const candyMachine: CandyMachine = await wrapInfiniteRetry(() =>
        metaplexCli
          .candyMachines()
          .findByAddress({ address: new PublicKey(mintCandyMachineId!) }),
      );

      console.info('Created Candy Machine - ', candyMachine);

      const candyGuardAddress: string = await wrapInfiniteRetry(() =>
        metaplexCli
          .candyMachines()
          .createCandyGuard({
            guards: {
              botTax: { lamports: sol(0.01), lastInstruction: true },
              solPayment: {
                amount: sol(Number(data.mintPrice)),
                destination: new PublicKey(
                  process.env.NEXT_PUBLIC_DIFFUSED_ART_CREATOR!,
                ),
              },
              startDate: { date: startDate },
            },
          })
          .then(res => res.candyGuardAddress.toString())
          .catch(e => {
            if (
              e
                ?.toString()
                .includes?.(
                  '[AccountNotFoundError] No account was found at the provided address [',
                )
            ) {
              return e
                ?.toString()
                ?.replace(
                  '[AccountNotFoundError] No account was found at the provided address [',
                  '',
                )
                .split('].')[0]
                .replace('].', '')
                .trim();
            } else {
              console.error('Error when creating Candy Guard >', e);
              throw new Error(`Error when creating Candy Guard - ${e}`);
            }
          }),
      );

      const candyGuard: CandyGuard<DefaultCandyGuardSettings> =
        await wrapInfiniteRetry(() =>
          metaplexCli.candyMachines().findCandyGuardByAddress({
            address: new PublicKey(candyGuardAddress),
          }),
        );

      console.info('Created Candy Guard - ', candyGuard);

      // Finally, wrap the CM with the guards
      await wrapInfiniteRetry(() =>
        metaplexCli.candyMachines().wrapCandyGuard({
          candyGuard: candyGuard.address,
          candyMachine: candyMachine.address,
        }),
      );

      await axios.post(
        `/api/collection/${state.collectionId}/candy-machine-create-logs`,
        {
          mintCandyMachineId,
          mintGuardId: candyGuard.address.toString(),
        },
      );

      await axios.put(`/api/collection/${state.collectionId}`, {
        mintCandyMachineId,
        mintGuardId: candyGuard.address.toString(),
      });

      dispatch({
        type: ActionTypesCreateCollectionStore.SetFieldValue,
        payload: {
          field: 'collectionCandyMachineAddress',
          value: mintCandyMachineId!,
        },
      });

      dispatch({
        type: ActionTypesCreateCollectionStore.SetFieldValue,
        payload: {
          field: 'collectionCandyGuardAddress',
          value: candyGuard.address.toString() || '',
        },
      });

      console.info(
        'Candy Machine using the guard created, we are ready to go, Houston 🚀!',
      );

      return true;
    }
  }, [state.collectionId, metaplexCli, wallet, toast, dispatch]);

  const insertItems = useCallback(async () => {
    const {
      data: { data },
    } = await axios.get(`/api/collection/${state.collectionId}`);

    const candyMachine: CandyMachine = await wrapInfiniteRetry(() =>
      metaplexCli
        .candyMachines()
        .findByAddress({ address: new PublicKey(data.mintCandyMachineId) }),
    );

    const collectionNft: Nft = await wrapInfiniteRetry(() =>
      metaplexCli.nfts().findByMint({
        mintAddress: new PublicKey(data.collectionOnChainAddress),
      }),
    );

    const items = Array(data.mintTotalSupply)
      .fill(0)
      .map(() => ({
        name: '',
        uri: collectionNft.uri.replace('https://nftstorage.link/ipfs/', ''),
      }));

    console.info(
      `Array created to be inserted into the CM (${
        items.length
      } items) ${JSON.stringify(items.slice(0, 5))}`,
    );

    const chunkSize = 5;
    const chunkedItems: any[] = [];
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      chunkedItems.push(chunk);
    }

    const txnArray: Transaction[] = [];
    const blockhashWithExpiryBlockHeight: BlockhashWithExpiryBlockHeight =
      await connection.getLatestBlockhash();
    for (let index = 0; index < chunkedItems.length; index++) {
      const chunkItems = chunkedItems[index];
      console.info(`Creating TXN for Chunk N${index + 1} with 5 items`);
      const txBuilder: TransactionBuilder = metaplexCli
        .candyMachines()
        .builders()
        .insertItems({
          candyMachine,
          items: chunkItems,
          index: index * chunkSize,
        });

      txnArray.push(txBuilder.toTransaction(blockhashWithExpiryBlockHeight));
    }

    const batchSize = 75;
    const batchedTxns: Transaction[][] = [];
    for (let i = 0; i < txnArray.length; i += batchSize) {
      const batch = txnArray.slice(i, i + batchSize);
      batchedTxns.push(batch);
    }

    const result = await wallet?.signAllTransactions?.(txnArray).catch(() => {
      toast({
        message: 'User refused to sign in the transaction',
        icon: ToastIconEnum.FAILURE,
      });
    });

    // User did not approve the transaction
    if (!result) {
      return;
    }

    const resultOfAll: any[] = [];
    for (let index = 0; index < batchedTxns.length; index++) {
      resultOfAll.push(
        await Promise.all(
          batchedTxns[index].map(txn =>
            sendAndConfirmTransaction(connection, txn),
          ),
        ),
      );
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    const isSuccess = resultOfAll.every((result: any) =>
      result.every((r: any) => !r?.value?.err),
    );

    if (isSuccess) {
      // Update collection NFT to have the update authority of the reveal wallet
      await axios.put(`/api/collection/${state.collectionId}`, {
        isPublished: true,
      });
    }

    console.info(
      `Finished inserting items into the CM! Please validate with "reinsertNonConfirmedItemsInsert" that all have been uploaded. 
        Hash: https://solana.fm/address/account/${candyMachine.address.toString()}`,
    );

    dispatch({
      type: ActionTypesCreateCollectionStore.SetFieldValue,
      payload: {
        field: 'publishStep',
        value: 'done',
      },
    });
    return true;
  }, [state.collectionId, connection, toast, metaplexCli, wallet, dispatch]);

  return {
    createCollectionNFT,
    createCandyMachine,
    insertItems,
  };
}
