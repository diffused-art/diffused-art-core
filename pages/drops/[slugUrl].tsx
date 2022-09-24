import { Collection, Mint } from '@prisma/client';
import axios from 'axios';
import Head from 'next/head';
import { useCallback, useState } from 'react';
import { useInterval } from 'usehooks-ts';
import CornerCard from '../../components/corner-card';
import Footer from '../../components/footer';
import Header from '../../components/header';
import MintButton from '../../components/mint-button';
import MintModal from '../../components/mint-modal';
import { useCandyMachine } from '../../lib/candy-machine';
import prisma from '../../lib/prisma';

export const getServerSideProps = async ({ params }) => {
  const collection = await prisma.collection.findUnique({
    where: {
      slugUrl: String(params?.slugUrl),
    },
  });
  if (!collection) return { notFound: true };
  return {
    props: {
      collection: {
        ...collection,
        mintPrice: collection.mintPrice.toNumber(),
        mintOpenAt: collection.mintOpenAt.getTime(),
        createdAt: collection.createdAt.getTime(),
        updatedAt: collection.updatedAt.getTime(),
        hashList: [],
      },
    },
  };
};

interface DropsSlugPageProps {
  collection: Collection;
}

const DropsSlugPage = ({ collection }: DropsSlugPageProps) => {
  const [isMintModalOpen, setIsMintModalOpen] = useState(false);
  const { isLoadingState, onMint, isMinting, candyMachine } = useCandyMachine(
    collection.mintCandyMachineId!,
  );

  const [activeMintHash, setActiveMintHash] = useState<string | null>(null);
  const [activeMint, setActiveMint] = useState<Mint | null>(null);

  const onMintCB = useCallback(async () => {
    setIsMintModalOpen(true);
    const mintHash = await onMint();
    if (mintHash === null) {
      setIsMintModalOpen(false);
      setActiveMintHash(null);
    } else {
      setActiveMintHash(mintHash);
    }
  }, [onMint]);

  const onCloseModal = useCallback(() => {
    setIsMintModalOpen(false);
    setActiveMintHash(null);
    setActiveMint(null);
  }, []);

  useInterval(
    () => {
      axios
        .get(`/api/mint/${activeMintHash}`)
        .then(res => {
          const mint: Mint = res.data.data;
          if (mint?.isRevealed) {
            setActiveMint(mint);
          }
        })
        .catch(() => setActiveMint(null));
    },
    activeMintHash && !activeMint ? 30000 : null,
  );
  const pageTitle = `diffused. "${collection.title}"`;
  return (
    <div>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={collection.description} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="flex flex-col justify-center items-center justify-items-center">
        <Header />

        <MintModal
          isMinting={isMinting}
          open={isMintModalOpen}
          closeModal={onCloseModal}
          nftPlaceholderURL={collection.nftPlaceholderImageURL!}
          mintHash={activeMintHash}
          mint={activeMint}
        />

        <main className="flex flex-col space-y-8 justify-center items-center !min-h-[80vh] my-5 px-3 md:px-20 text-center">
          <img
            src={collection.bannerImageURL}
            alt={collection?.title}
            className="rounded-md"
            width="640"
          />

          <h2 className="text-lg text-secondary font-bold">
            &quot;{collection.title}&quot; by{'  '}
            <a
              href={collection.artistTwitterURL!}
              target="_blank"
              rel="noreferrer"
              className="text-gray-400"
            >
              {collection.artistName}
            </a>
          </h2>

          <CornerCard
            backgroundColor={collection.nftPlaceholderBackgroundColor!}
            textColor={collection.nftPlaceholderForegroundColor!}
            title={
              new Date(Date.now()) > new Date(collection.mintOpenAt)
                ? 'mint is live.'
                : `mint will be live starting at:{' '}
                ${new Date(collection.mintOpenAt).toLocaleString()}`
            }
          >
            {!isLoadingState ? (
              <>
                <h2 className="text-base">
                  <b>supply -</b> {candyMachine?.itemsAvailable.toNumber()}
                </h2>
                <h2 className="text-base">
                  <b>pieces remaining -</b>{' '}
                  {candyMachine?.itemsRemaining.toNumber()}
                </h2>
                <h2 className="text-base">
                  <b>price -</b>{' '}
                  {(candyMachine?.price.basisPoints?.toNumber() || 0) /
                    Math.pow(10, candyMachine?.price.currency.decimals || 0)}
                  ◎
                </h2>
              </>
            ) : (
              <h2 className="text-lg">loading mint details...</h2>
            )}

            <div className="absolute top-10 right-5">
              <MintButton onMint={onMintCB} isLoading={isMinting} />
            </div>
          </CornerCard>

          <CornerCard
            backgroundColor={collection.nftPlaceholderBackgroundColor!}
            textColor={collection.nftPlaceholderForegroundColor!}
            title="drop details."
            side="right"
          >
            {collection.artistWebsiteURL && (
              <a href={collection.artistWebsiteURL}>
                <h2 className="text-lg font-bold">
                  {collection.artistWebsiteURL}
                </h2>
              </a>
            )}

            <h2 className="text-base text-justify mt-1">
              {collection.description}
            </h2>
          </CornerCard>

          <CornerCard
            backgroundColor={collection.nftPlaceholderBackgroundColor!}
            textColor={collection.nftPlaceholderForegroundColor!}
            title="generation parameters."
            side="left"
          >
            <h2 className="text-base text-left mt-1">
              <b>prompt - </b> {collection.promptPhrase.toLowerCase()}
            </h2>

            {collection.promptInitImage && (
              <div className="text-base text-left mt-1">
                <b>initial image - </b>{' '}
                <a
                  href={collection.promptInitImage}
                  target="_blank"
                  rel="noreferrer"
                  className='inline'
                >
                  Click here to see
                </a>
              </div>
            )}

            <h2 className="text-base text-left mt-1">
              <b>artificial intelligence model - </b>{' '}
              {collection.promptSource.toLowerCase()}
            </h2>

            <h2 className="text-base text-left mt-1">
              <b>techniques used</b>
              <ul className="ml-5">
                <li>
                  <b>- dynamic seed:</b> each art is unique and immutable by
                  using a derivation of the NFT address that gets generated on
                  mint time
                </li>
              </ul>
            </h2>

            <h1 className="text-2xl space-x-1"></h1>
          </CornerCard>
        </main>
        <Footer ctaEnabled={false} twitterEnabled={false} />
      </div>
    </div>
  );
};

export default DropsSlugPage;
