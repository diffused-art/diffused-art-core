import {
  keypairIdentity,
  Metaplex,
  MetaplexPlugin,
  toMetaplexFileFromBrowser,
  UploadMetadataInput,
} from '@metaplex-foundation/js';
import { nftStorage } from '@metaplex-foundation/js-plugin-nft-storage';
import { Connection, Keypair } from '@solana/web3.js';
import { useCallback, useMemo } from 'react';

const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL!);

export default function useAnonymousNFTStorage() {
  const metaplexCli = useMemo(() => {
    const keypair = Keypair.generate();
    return Metaplex.make(connection)
      .use(keypairIdentity(keypair))
      .use(
        nftStorage({
          identity: keypair,
        }) as unknown as MetaplexPlugin,
      );
  }, []);

  const uploadImage = useCallback(
    async (image: File) => {
      const { metadata } = await metaplexCli.nfts().uploadMetadata({
        image: await toMetaplexFileFromBrowser(image),
      });
      const imageURL = metadata.image;
      return imageURL || '';
    },
    [metaplexCli],
  );

  const uploadMetadata = useCallback(
    async (metadataToUpload: UploadMetadataInput) => {
      const { uri } = await metaplexCli.nfts().uploadMetadata(metadataToUpload);
      return uri;
    },
    [metaplexCli],
  );

  return { uploadImage, uploadMetadata };
}
