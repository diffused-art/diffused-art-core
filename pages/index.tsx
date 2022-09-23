import { Collection } from '@prisma/client';
import Head from 'next/head';
import Link from 'next/link';
import Footer from '../components/footer';
import Header from '../components/header';
import prisma from '../lib/prisma';

export const getServerSideProps = async () => {
  const collectionsLive = await prisma.collection.findMany({
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
      })),
    },
  };
};

interface HomeProps {
  collectionsLive: Collection[];
}

const Home = ({ collectionsLive }: HomeProps) => {
  return (
    <div>
      <Head>
        <title>diffused art</title>
        <meta
          name="description"
          content="Truly immutable on-chain 1/1 AI art generated in real time"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex flex-col space-y-5 justify-center items-center !min-h-[80vh] px-20 text-center">
        <Header />
        <h2 className="text-xl">
          Truly immutable on-chain 1/1 AI art generated in real time
        </h2>

        <h3 className="text-base">
          Mint one of the latest AI art drops powered by the diffused.art
          protocol below:
        </h3>
        <div id="collections-live" className="flex space-x-5">
          {collectionsLive.map(collection => (
            <Link key={collection.id} href={collection.slugUrl}>
              <div className="relative group">
                <div
                  className="invisible group-hover:visible 
                absolute bottom-1 mx-5 z-10 opacity-85 cursor-pointer"
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
  );
};

export default Home;
