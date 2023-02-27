import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { Artist, Collection } from '@prisma/client';
import classNames from 'classnames';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Footer from '../components/footer';
import Menu from '../components/menu';
import prisma from '../lib/prisma';

// TODO: Search should be paginated in the future with infinite pagination
export const getServerSideProps = async context => {
  let searchFilter: any[] = [];
  const search = context.query.search;
  if (search) {
    searchFilter = [
      {
        title: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        promptPhrase: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        description: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        CollectionTag: {
          some: {
            tag: {
              label: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
        },
      },
      {
        artist: {
          username: {
            contains: search,
            mode: 'insensitive',
          },
        },
      },
    ];
  }
  let filters = {};
  if (search) {
    filters = {
      OR: searchFilter,
    };
  }

  const collectionsLive = await prisma.collection.findMany({
    include: {
      artist: {
        select: {
          twitterURL: true,
          username: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
    where: {
      AND: [
        {
          isFullyRevealed: false,
        },
        { mintCandyMachineId: { not: null } },
        { isPublished: true },
        filters,
      ],
    },
    orderBy: [
      {
        mints: {
          _count: 'desc',
        },
      },
      { updatedAt: 'desc' },
    ],
  });
  return {
    props: {
      collectionsLive: collectionsLive.map(collection => ({
        ...collection,
        updateAuthorityPrivateKey: null,
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
        totalMinted: (collection.hashList as Array<string>).length || 0,
      })),
    },
  };
};

interface HomeProps {
  collectionsLive: (Collection & { artist: Artist; totalMinted: number })[];
}

const Home = ({ collectionsLive }: HomeProps) => {
  const { query } = useRouter();
  return (
    <div className="bg-secondary-50">
      <Head>
        <title>diffused.art</title>
        <meta
          name="description"
          content="Truly immutable on-chain 1/1 AI art generated in real time"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex flex-col h-full">
        <Menu />
        <main>
          <div
            className={classNames(
              'w-full px-5 gap-10 mt-[80px] md:mt-[100px]',
              {
                'columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6':
                  collectionsLive.length > 0,
              },
            )}
          >
            {collectionsLive.length === 0 && (
              <div className="text-center">
                No collections found for{' '}
                {`"${query.search}" 😞 Try searching again.`}{' '}
                <Link
                  href="/create-collection"
                  className="text-main-yellow hover:opacity-50"
                >
                  Or just create your own collection!
                </Link>
              </div>
            )}
            {collectionsLive.map(collection => {
              const totalPercentMinted =
                (collection.totalMinted / (collection?.mintTotalSupply || 0)) *
                100;
              return (
                <Link
                  key={collection.id}
                  href={`/drops/${collection.slugUrl}`}
                  className="flex justify-center"
                >
                  <div className="relative group mb-[2.5rem] inline-block">
                    <div
                      className="visible md:invisible group-hover:visible rounded-md pb-2 absolute w-full bottom-0 z-10 opacity-85 text-white 
                    cursor-pointer text-xs lg:text-base 3xl:text-lg bg-gray-half-transparent"
                    >
                      <div className="m-2">
                        <div className="flex flex-col">
                          <div>{collection.title}</div>
                          <div className="space-x-2 flex justify-between items-stretch">
                            <div className="text-main-yellow">
                              @{collection.artist.username}
                            </div>
                            <div className="flex space-x-1">
                              <span className="text-main-yellow">
                                {collection.totalMinted}
                              </span>
                              <span
                                className={classNames(
                                  'flex items-center space-x-1',
                                  {
                                    'text-main-yellow':
                                      totalPercentMinted === 100,
                                  },
                                )}
                              >
                                <span>/ {collection.mintTotalSupply}</span>
                                {totalPercentMinted === 100 && (
                                  <span>
                                    <CheckCircleIcon height={14} />
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          width: `${totalPercentMinted}%`,
                        }}
                        className="h-1 absolute top-0 left-0 bg-main-yellow"
                      />
                    </div>
                    <img
                      alt={`${collection.title} - Collection Image`}
                      key={collection.id}
                      src={collection.bannerImageURL!}
                      className="z-0 rounded-md hover:opacity-80 cursor-pointer transition-all group-hover:shadow-lg group-hover:shadow-main-yellow"
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Home;
