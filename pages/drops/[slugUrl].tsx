import { Collection } from '@prisma/client';
import Head from 'next/head';
import CollectionAttributeCard from '../../components/collection-attribute-card';
import CornerCard from '../../components/corner-card';
import Footer from '../../components/footer';
import Header from '../../components/header';
import { useCandyMachine } from '../../lib/candy-machine/hook';
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
  const candyMachine = useCandyMachine({
    candyMachineAddress: collection.mintCandyMachineId!,
  });
  const pageTitle = `diffused. "${collection.title}"`;
  return (
    <div>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={collection.description} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="flex flex-col">
        <Header />

        <main className="flex flex-col space-y-8 justify-center items-center !min-h-[80vh] text-center my-5">
          <img
            src={collection.bannerImageURL}
            alt={collection?.title}
            className="rounded-md"
            width="70%"
          />

          <h2 className="text-xl text-secondary font-bold">
            {collection.title} -{' '}
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
            title={
              candyMachine.isLive
                ? 'mint is live.'
                : `mint will be live starting at:{' '}
                ${candyMachine.goLiveDate.toLocaleString()}`
            }
          >
            <h2 className="text-base">
              <b>supply -</b> {candyMachine.itemsAvailable}◎
            </h2>
            <h2 className="text-base">
              <b>pieces remaining -</b> {candyMachine.itemsRemaining}
            </h2>
            <h2 className="text-base">
              <b>price -</b> {candyMachine.price}◎
            </h2>
          </CornerCard>

          <CornerCard title="drop details." side="right">
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

          <CornerCard title="generation parameters." side="left">
            <h2 className="text-base text-left mt-1">
              <b>prompt - </b> {collection.promptPhrase.toLowerCase()}
            </h2>

            {collection.promptInitImage && (
              <h2 className="text-base text-left truncate mt-1">
                <b>initial image - </b>{' '}
                <a
                  href={collection.promptInitImage}
                  target="_blank"
                  rel="noreferrer"
                >
                  {collection.promptInitImage}
                </a>
              </h2>
            )}

            <h2 className="text-base text-left mt-1">
              <b>artificial intelligence model - </b>{' '}
              {collection.promptSource.toLowerCase()}
            </h2>

            <h2 className="text-base text-left mt-1">
              <b>dynamism - </b> each art is unique and immutable by using a
              derivation of the NFT address that gets generated on mint time
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
