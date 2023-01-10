import { Collection } from '@prisma/client';
import Head from 'next/head';
import Link from 'next/link';
import Footer from '../components/footer';
import Menu from '../components/menu';
import prisma from '../lib/prisma';

export const getServerSideProps = async context => {
  const collectionsLive = await prisma.collection.findMany({
    include: {
      artist: true,
    },
    where: {
      isFullyRevealed: false,
    },
  });
  return {
    props: {
      collectionsLive: collectionsLive.map(collection => ({
        ...collection,
        mintPrice: collection.mintPrice.toNumber(),
        mintOpenAt: collection.mintOpenAt.getTime(),
        createdAt: collection.createdAt.getTime(),
        updatedAt: collection.updatedAt.getTime(),
        artist: {
          ...collection.artist,
          isCollectionCreationEnabled: false,
          createdAt: collection.artist.createdAt.getTime(),
          updatedAt: collection.artist.updatedAt.getTime(),
        },
        hashList: [],
      })),
    },
  };
};

interface HomeProps {
  collectionsLive: Collection[];
}

const Home = ({ collectionsLive }: HomeProps) => {
  return (
    <div className="bg-secondary-50">
      <Head>
        <title>diffused.</title>
        <meta
          name="description"
          content="Truly immutable on-chain 1/1 AI art generated in real time"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex flex-col h-full">
        <Menu />
        <main className="flex flex-col space-y-5 justify-center items-center h-full px-20 text-center">
          <h2 className="text-xl">
            Truly immutable on-chain 1/1 AI art generated in real time
          </h2>

          <h3 className="text-base">
            Mint one of the latest AI art drops powered by{' '}
            <i>
              <b>diffused.</b>
            </i>{' '}
            platform below:
          </h3>
          <div
            id="collections-live"
            className="flex flex-col md:flex-row space-y-5 space-x-0 md:space-y-0 md:space-x-5 py-5"
          >
            {collectionsLive.map(collection => (
              <Link key={collection.id} href={`/drops/${collection.slugUrl}`}>
                <div className="relative group">
                  <div
                    className="invisible group-hover:visible 
                absolute bottom-1 z-10 opacity-85 cursor-pointer text-xs md:text-lg ml-5"
                  >
                    {collection.title}
                  </div>
                  <img
                    height={360}
                    width={360}
                    alt={`${collection.title} Collection Image`}
                    key={collection.id}
                    src={collection.bannerImageURL!}
                    className="z-0 rounded-md hover:opacity-80 cursor-pointer transition-all"
                  />
                </div>
              </Link>
            ))}
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default Home;
